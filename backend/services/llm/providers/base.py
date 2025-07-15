"""
Базовый класс для AI провайдеров DevAssist Pro
Согласно ТЗ Этап 4: AI Integrations
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, AsyncGenerator
from datetime import datetime
import time
import asyncio
import logging

logger = logging.getLogger(__name__)

class AIProviderError(Exception):
    """Базовый класс для ошибок AI провайдеров"""
    def __init__(self, message: str, provider: str, model: str = None, retry_after: int = None):
        self.message = message
        self.provider = provider
        self.model = model
        self.retry_after = retry_after
        super().__init__(message)

class RateLimitError(AIProviderError):
    """Ошибка превышения лимита запросов"""
    pass

class APIKeyError(AIProviderError):
    """Ошибка с API ключом"""
    pass

class ModelNotFoundError(AIProviderError):
    """Модель не найдена"""
    pass

class BaseAIProvider(ABC):
    """Базовый класс для всех AI провайдеров согласно ТЗ"""
    
    def __init__(self, api_key: str = None, **kwargs):
        self.api_key = api_key
        self.name = self.__class__.__name__.lower().replace('provider', '')
        self.models = self._get_available_models()
        self.rate_limits = {}
        self.last_request_time = {}
        
    @abstractmethod
    def _get_available_models(self) -> Dict[str, Dict[str, Any]]:
        """Получить список доступных моделей провайдера"""
        pass
    
    @abstractmethod
    async def _make_request(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> Dict[str, Any]:
        """Выполнить запрос к API провайдера"""
        pass
    
    @abstractmethod
    async def _make_streaming_request(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Выполнить streaming запрос к API провайдера"""
        pass
    
    def _validate_model(self, model: str) -> bool:
        """Проверить, что модель поддерживается провайдером"""
        return model in self.models
    
    def _calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Рассчитать стоимость запроса"""
        if model not in self.models:
            return 0.0
            
        model_config = self.models[model]
        input_cost = (input_tokens / 1000) * model_config.get('cost_per_1k_input', 0)
        output_cost = (output_tokens / 1000) * model_config.get('cost_per_1k_output', 0)
        return input_cost + output_cost
    
    def _count_tokens(self, text: str) -> int:
        """Приблизительный подсчет токенов (для более точного нужен tokenizer)"""
        # Простая аппроксимация: 1 токен ≈ 4 символа для латиницы, 2 символа для кириллицы
        return len(text) // 3
    
    async def _handle_rate_limit(self, model: str):
        """Обработка rate limits согласно ТЗ"""
        current_time = time.time()
        last_request = self.last_request_time.get(model, 0)
        
        # Минимальная пауза между запросами (100ms)
        min_interval = 0.1
        elapsed = current_time - last_request
        
        if elapsed < min_interval:
            await asyncio.sleep(min_interval - elapsed)
        
        self.last_request_time[model] = time.time()
    
    async def check_health(self) -> Dict[str, Any]:
        """Проверить состояние провайдера"""
        try:
            start_time = time.time()
            
            # Простой тест запрос
            test_messages = [{"role": "user", "content": "Test"}]
            await self._make_request(
                model=list(self.models.keys())[0],
                messages=test_messages,
                max_tokens=1
            )
            
            response_time = time.time() - start_time
            
            return {
                "provider": self.name,
                "status": "healthy",
                "response_time": response_time,
                "models_available": list(self.models.keys()),
                "last_check": datetime.now()
            }
        except Exception as e:
            logger.error(f"Health check failed for {self.name}: {e}")
            return {
                "provider": self.name,
                "status": "unhealthy",
                "error": str(e),
                "models_available": [],
                "last_check": datetime.now()
            }
    
    async def generate_text(
        self,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> Dict[str, Any]:
        """Основной метод для генерации текста согласно ТЗ"""
        
        if not self._validate_model(model):
            raise ModelNotFoundError(f"Model {model} not available", self.name, model)
        
        # Подготовка сообщений
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Обработка rate limits
        await self._handle_rate_limit(model)
        
        start_time = time.time()
        
        try:
            # Выполнение запроса
            response = await self._make_request(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            )
            
            response_time = time.time() - start_time
            
            # Подсчет токенов и стоимости
            input_tokens = self._count_tokens(prompt + (system_prompt or ""))
            output_tokens = self._count_tokens(response.get('content', ''))
            total_tokens = input_tokens + output_tokens
            cost = self._calculate_cost(model, input_tokens, output_tokens)
            
            return {
                "content": response.get('content', ''),
                "model": model,
                "provider": self.name,
                "prompt_tokens": input_tokens,
                "completion_tokens": output_tokens,
                "total_tokens": total_tokens,
                "cost_usd": cost,
                "response_time": response_time,
                "metadata": response.get('metadata', {})
            }
            
        except Exception as e:
            logger.error(f"Request failed for {self.name}/{model}: {e}")
            raise AIProviderError(str(e), self.name, model)
    
    async def generate_text_stream(
        self,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Streaming генерация текста согласно ТЗ"""
        
        if not self._validate_model(model):
            raise ModelNotFoundError(f"Model {model} not available", self.name, model)
        
        if not self.models[model].get('supports_streaming', False):
            # Fallback к обычной генерации
            result = await self.generate_text(
                model, prompt, system_prompt, max_tokens, temperature, **kwargs
            )
            yield {
                "chunk": result["content"],
                "is_complete": True,
                "tokens_used": result["total_tokens"],
                "model": model,
                "provider": self.name
            }
            return
        
        # Подготовка сообщений
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Обработка rate limits
        await self._handle_rate_limit(model)
        
        try:
            async for chunk in self._make_streaming_request(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            ):
                yield {
                    "chunk": chunk,
                    "is_complete": False,
                    "model": model,
                    "provider": self.name
                }
            
            # Финальный чанк
            yield {
                "chunk": "",
                "is_complete": True,
                "model": model,
                "provider": self.name
            }
            
        except Exception as e:
            logger.error(f"Streaming request failed for {self.name}/{model}: {e}")
            yield {
                "chunk": "",
                "is_complete": True,
                "error": str(e),
                "model": model,
                "provider": self.name
            }
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Получить информацию о модели"""
        if model not in self.models:
            return {}
        
        return {
            "provider": self.name,
            "model": model,
            **self.models[model]
        }