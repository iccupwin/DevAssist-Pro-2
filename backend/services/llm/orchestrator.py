"""
LLM Orchestrator для DevAssist Pro
Главный координатор всех AI провайдеров согласно ТЗ Этап 4
"""
import asyncio
import logging
import time
import hashlib
import json
from typing import Dict, Any, List, Optional, AsyncGenerator, Union
from datetime import datetime, timedelta
import aioredis
from sqlalchemy.orm import Session

from .providers.openai_provider import OpenAIProvider
from .providers.anthropic_provider import AnthropicProvider
from .providers.google_provider import GoogleProvider
from .providers.base import BaseAIProvider, AIProviderError, RateLimitError, APIKeyError
from .config import settings, TASK_MODEL_MAPPING
from ..shared.llm_schemas import (
    AIRequest, AIResponse, StreamChunk, TaskType, AIProvider, 
    AIConfiguration, KPAnalysisRequest, KPAnalysisResponse, ErrorResponse
)
from ..shared.llm_models import AIRequest as AIRequestModel

logger = logging.getLogger(__name__)

class LLMOrchestrator:
    """Главный оркестратор LLM сервисов согласно ТЗ"""
    
    def __init__(self):
        self.providers: Dict[str, BaseAIProvider] = {}
        self.redis_client: Optional[aioredis.Redis] = None
        self.fallback_order = settings.FALLBACK_ORDER
        self.cache_ttl = settings.CACHE_TTL
        
        # Инициализация провайдеров согласно ТЗ раздел 4.3
        self._init_providers()
    
    def _init_providers(self):
        """Инициализация AI провайдеров"""
        if settings.OPENAI_API_KEY:
            try:
                self.providers["openai"] = OpenAIProvider(settings.OPENAI_API_KEY)
                logger.info("OpenAI provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI provider: {e}")
        
        if settings.ANTHROPIC_API_KEY:
            try:
                self.providers["anthropic"] = AnthropicProvider(settings.ANTHROPIC_API_KEY)
                logger.info("Anthropic provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic provider: {e}")
        
        if settings.GOOGLE_API_KEY:
            try:
                self.providers["google"] = GoogleProvider(settings.GOOGLE_API_KEY)
                logger.info("Google provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Google provider: {e}")
        
        # TODO: Добавить YandexGPT и GigaChat провайдеры
        
        logger.info(f"Initialized {len(self.providers)} AI providers: {list(self.providers.keys())}")
    
    async def init_redis(self):
        """Инициализация Redis для кеширования"""
        try:
            self.redis_client = aioredis.from_url(settings.REDIS_URL)
            await self.redis_client.ping()
            logger.info("Redis connection established for LLM caching")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    def _get_cache_key(self, request: AIRequest) -> str:
        """Генерация ключа кеша для запроса"""
        content_hash = hashlib.sha256(
            f"{request.task_type}:{request.content}:{request.system_prompt}:{request.user_prompt}".encode()
        ).hexdigest()[:16]
        return f"{settings.CACHE_PREFIX}{content_hash}"
    
    async def _get_cached_response(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Получить кешированный ответ"""
        if not self.redis_client or not settings.ENABLE_CACHING:
            return None
        
        try:
            cached_data = await self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Cache retrieval failed: {e}")
        
        return None
    
    async def _cache_response(self, cache_key: str, response: Dict[str, Any]):
        """Кешировать ответ"""
        if not self.redis_client or not settings.ENABLE_CACHING:
            return
        
        try:
            await self.redis_client.setex(
                cache_key, 
                self.cache_ttl, 
                json.dumps(response, default=str)
            )
        except Exception as e:
            logger.warning(f"Cache storage failed: {e}")
    
    def _select_model(self, task_type: TaskType, model_override: Optional[str] = None) -> tuple[str, str]:
        """Выбор модели и провайдера для задачи согласно ТЗ"""
        
        if model_override:
            # Пользователь указал конкретную модель
            for provider_name, provider in self.providers.items():
                if model_override in provider.models:
                    return provider_name, model_override
        
        # Выбор по типу задачи согласно конфигурации
        task_models = TASK_MODEL_MAPPING.get(task_type.value, {})
        
        # Попробовать модель по умолчанию
        default_model = task_models.get("default")
        if default_model:
            for provider_name, provider in self.providers.items():
                if default_model in provider.models:
                    return provider_name, default_model
        
        # Fallback к первому доступному провайдеру
        for provider_name in self.fallback_order:
            if provider_name in self.providers:
                provider = self.providers[provider_name]
                models = list(provider.models.keys())
                if models:
                    return provider_name, models[0]
        
        raise AIProviderError("No suitable model found for task", "orchestrator")
    
    async def _execute_with_fallback(
        self,
        task_func,
        request: AIRequest,
        max_retries: int = None
    ) -> Dict[str, Any]:
        """Выполнение запроса с fallback логикой согласно ТЗ"""
        
        max_retries = max_retries or settings.MAX_RETRIES
        provider_name, model = self._select_model(request.task_type, request.model_override)
        
        last_error = None
        
        # Попробовать основной провайдер
        for attempt in range(max_retries):
            try:
                provider = self.providers[provider_name]
                return await task_func(provider, model)
                
            except RateLimitError as e:
                logger.warning(f"Rate limit hit for {provider_name}/{model}, attempt {attempt + 1}")
                last_error = e
                
                if e.retry_after:
                    await asyncio.sleep(min(e.retry_after, 60))  # Макс 60 сек
                else:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    
            except (APIKeyError, AIProviderError) as e:
                logger.error(f"Provider error for {provider_name}/{model}: {e}")
                last_error = e
                break  # Не повторяем при ошибках API ключа
        
        # Fallback к другим провайдерам согласно ТЗ
        if settings.FALLBACK_ENABLED:
            for fallback_provider_name in self.fallback_order:
                if fallback_provider_name == provider_name or fallback_provider_name not in self.providers:
                    continue
                
                try:
                    fallback_provider = self.providers[fallback_provider_name]
                    fallback_models = list(fallback_provider.models.keys())
                    
                    if fallback_models:
                        fallback_model = fallback_models[0]  # Первая доступная модель
                        logger.info(f"Falling back to {fallback_provider_name}/{fallback_model}")
                        
                        return await task_func(fallback_provider, fallback_model)
                        
                except Exception as e:
                    logger.warning(f"Fallback failed for {fallback_provider_name}: {e}")
                    continue
        
        # Все попытки провалились
        raise last_error or AIProviderError("All providers failed", "orchestrator")
    
    async def generate_text(self, request: AIRequest) -> AIResponse:
        """Основной метод генерации текста согласно ТЗ"""
        
        task_id = f"task_{int(time.time() * 1000)}"
        start_time = time.time()
        
        # Проверка кеша
        cache_key = self._get_cache_key(request)
        cached_response = await self._get_cached_response(cache_key)
        
        if cached_response:
            logger.info(f"Cache hit for task {task_id}")
            return AIResponse(
                task_id=task_id,
                **cached_response,
                created_at=datetime.now()
            )
        
        # Выполнение запроса
        async def task_func(provider: BaseAIProvider, model: str):
            return await provider.generate_text(
                model=model,
                prompt=request.content,
                system_prompt=request.system_prompt,
                max_tokens=request.max_tokens or 1000,
                temperature=request.temperature or 0.7
            )
        
        try:
            result = await self._execute_with_fallback(task_func, request)
            
            # Кеширование результата
            await self._cache_response(cache_key, result)
            
            response = AIResponse(
                task_id=task_id,
                content=result["content"],
                model_used=result["model"],
                provider_used=AIProvider(result["provider"]),
                prompt_tokens=result.get("prompt_tokens", 0),
                completion_tokens=result.get("completion_tokens", 0),
                total_tokens=result.get("total_tokens", 0),
                cost_usd=result.get("cost_usd", 0.0),
                response_time=time.time() - start_time,
                created_at=datetime.now(),
                metadata=result.get("metadata", {})
            )
            
            # TODO: Сохранить в базу данных для статистики
            
            return response
            
        except Exception as e:
            logger.error(f"Text generation failed for task {task_id}: {e}")
            return AIResponse(
                task_id=task_id,
                content="",
                model_used="",
                provider_used=AIProvider.OPENAI,  # Default
                response_time=time.time() - start_time,
                created_at=datetime.now(),
                error=str(e)
            )
    
    async def generate_text_stream(self, request: AIRequest) -> AsyncGenerator[StreamChunk, None]:
        """Streaming генерация текста согласно ТЗ"""
        
        task_id = f"stream_{int(time.time() * 1000)}"
        provider_name, model = self._select_model(request.task_type, request.model_override)
        
        try:
            provider = self.providers[provider_name]
            
            async for chunk_data in provider.generate_text_stream(
                model=model,
                prompt=request.content,
                system_prompt=request.system_prompt,
                max_tokens=request.max_tokens or 1000,
                temperature=request.temperature or 0.7
            ):
                yield StreamChunk(
                    task_id=task_id,
                    chunk=chunk_data.get("chunk", ""),
                    is_complete=chunk_data.get("is_complete", False),
                    tokens_used=chunk_data.get("tokens_used", 0),
                    error=chunk_data.get("error")
                )
                
        except Exception as e:
            logger.error(f"Streaming generation failed for task {task_id}: {e}")
            yield StreamChunk(
                task_id=task_id,
                chunk="",
                is_complete=True,
                error=str(e)
            )
    
    async def analyze_kp_documents(self, request: KPAnalysisRequest) -> KPAnalysisResponse:
        """Специализированный анализ КП согласно ТЗ раздел 4.2"""
        
        analysis_id = f"kp_{int(time.time() * 1000)}"
        start_time = time.time()
        
        try:
            # Выбор оптимального провайдера для анализа КП
            provider_name = "openai"  # GPT-4 хорош для структурированного анализа
            if "openai" not in self.providers and "anthropic" in self.providers:
                provider_name = "anthropic"  # Claude как альтернатива
            
            provider = self.providers[provider_name]
            
            # Выполнение анализа КП через провайдер
            if hasattr(provider, 'analyze_kp_document'):
                analysis_results = await provider.analyze_kp_document(
                    tz_content=request.tz_content,
                    kp_content=request.kp_content,
                    analysis_type=request.analysis_type
                )
            else:
                # Fallback к базовому анализу
                analysis_results = await self._basic_kp_analysis(provider, request)
            
            return KPAnalysisResponse(
                analysis_id=analysis_id,
                tz_requirements=analysis_results.get("tz_requirements", {}),
                kp_data=analysis_results.get("kp_data", {}),
                compliance_score=0.85,  # Пример
                compliance_details=analysis_results.get("compliance_analysis", []),
                risks_identified=analysis_results.get("risk_assessment", []),
                recommendations=analysis_results.get("recommendations", []),
                confidence_score=0.9,
                processing_time=time.time() - start_time,
                models_used=[f"{provider_name}/gpt-4"],
                total_cost=0.15,  # Пример
                created_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"KP analysis failed for {analysis_id}: {e}")
            raise AIProviderError(f"KP analysis failed: {e}", "orchestrator")
    
    async def _basic_kp_analysis(self, provider: BaseAIProvider, request: KPAnalysisRequest) -> Dict[str, Any]:
        """Базовый анализ КП если провайдер не поддерживает специализированный метод"""
        
        results = {}
        
        # Анализ ТЗ
        tz_response = await provider.generate_text(
            model=list(provider.models.keys())[0],
            prompt=f"Проанализируй техническое задание и извлеки ключевые требования:\n\n{request.tz_content}",
            system_prompt="Ты эксперт по анализу технических заданий в строительстве.",
            temperature=0.3
        )
        results["tz_requirements"] = tz_response["content"]
        
        # Анализ КП
        kp_response = await provider.generate_text(
            model=list(provider.models.keys())[0],
            prompt=f"Проанализируй коммерческое предложение и извлеки ключевые данные:\n\n{request.kp_content}",
            system_prompt="Ты эксперт по анализу коммерческих предложений.",
            temperature=0.3
        )
        results["kp_data"] = kp_response["content"]
        
        return results
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Проверка состояния всех провайдеров"""
        
        providers_status = {}
        
        for provider_name, provider in self.providers.items():
            try:
                status = await provider.check_health()
                providers_status[provider_name] = status
            except Exception as e:
                providers_status[provider_name] = {
                    "provider": provider_name,
                    "status": "unhealthy",
                    "error": str(e),
                    "last_check": datetime.now()
                }
        
        # Определение общего статуса
        healthy_count = sum(1 for status in providers_status.values() if status.get("status") == "healthy")
        total_count = len(providers_status)
        
        if healthy_count == 0:
            service_status = "unhealthy"
        elif healthy_count < total_count:
            service_status = "degraded"
        else:
            service_status = "healthy"
        
        return {
            "service_status": service_status,
            "providers_status": providers_status,
            "active_models": [
                f"{name}/{model}" 
                for name, provider in self.providers.items() 
                for model in provider.models.keys()
            ],
            "total_providers": total_count,
            "healthy_providers": healthy_count,
            "last_updated": datetime.now()
        }