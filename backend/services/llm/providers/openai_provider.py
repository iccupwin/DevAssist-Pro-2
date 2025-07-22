"""
OpenAI Provider для LLM Service DevAssist Pro
Согласно ТЗ Этап 4: AI Integrations раздел 4.3
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
import openai
from openai import AsyncOpenAI
from .base import BaseAIProvider, AIProviderError, RateLimitError, APIKeyError

logger = logging.getLogger(__name__)

class OpenAIProvider(BaseAIProvider):
    """Провайдер для OpenAI API согласно ТЗ"""
    
    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, **kwargs)
        self.client = AsyncOpenAI(api_key=api_key)
        
    def _get_available_models(self) -> Dict[str, Dict[str, Any]]:
        """Модели OpenAI согласно ТЗ раздел 4.3"""
        return {
            "gpt-4": {
                "display_name": "GPT-4",
                "max_tokens": 8192,
                "cost_per_1k_input": 0.03,
                "cost_per_1k_output": 0.06,
                "supports_streaming": True,
                "supports_functions": True,
                "context_window": 8192
            },
            "gpt-4-turbo": {
                "display_name": "GPT-4 Turbo",
                "max_tokens": 4096,
                "cost_per_1k_input": 0.01,
                "cost_per_1k_output": 0.03,
                "supports_streaming": True,
                "supports_functions": True,
                "context_window": 128000
            },
            "gpt-3.5-turbo": {
                "display_name": "GPT-3.5 Turbo",
                "max_tokens": 4096,
                "cost_per_1k_input": 0.001,
                "cost_per_1k_output": 0.002,
                "supports_streaming": True,
                "supports_functions": True,
                "context_window": 16385
            }
        }
    
    async def _make_request(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> Dict[str, Any]:
        """Выполнить запрос к OpenAI API"""
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs
            )
            
            return {
                "content": response.choices[0].message.content,
                "metadata": {
                    "finish_reason": response.choices[0].finish_reason,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                        "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                        "total_tokens": response.usage.total_tokens if response.usage else 0,
                    }
                }
            }
            
        except openai.RateLimitError as e:
            logger.warning(f"OpenAI rate limit exceeded: {e}")
            raise RateLimitError(str(e), "openai", model, retry_after=60)
            
        except openai.AuthenticationError as e:
            logger.error(f"OpenAI authentication failed: {e}")
            raise APIKeyError(str(e), "openai", model)
            
        except openai.NotFoundError as e:
            logger.error(f"OpenAI model not found: {e}")
            raise AIProviderError(f"Model {model} not found", "openai", model)
            
        except Exception as e:
            logger.error(f"OpenAI request failed: {e}")
            raise AIProviderError(str(e), "openai", model)
    
    async def _make_streaming_request(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Выполнить streaming запрос к OpenAI API"""
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                **kwargs
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except openai.RateLimitError as e:
            logger.warning(f"OpenAI streaming rate limit exceeded: {e}")
            raise RateLimitError(str(e), "openai", model, retry_after=60)
            
        except openai.AuthenticationError as e:
            logger.error(f"OpenAI streaming authentication failed: {e}")
            raise APIKeyError(str(e), "openai", model)
            
        except Exception as e:
            logger.error(f"OpenAI streaming request failed: {e}")
            raise AIProviderError(str(e), "openai", model)
    
    def _count_tokens(self, text: str) -> int:
        """Более точный подсчет токенов для OpenAI с помощью tiktoken"""
        try:
            import tiktoken
            encoding = tiktoken.get_encoding("cl100k_base")  # GPT-4/3.5 encoding
            return len(encoding.encode(text))
        except ImportError:
            # Fallback к базовому методу
            return super()._count_tokens(text)
    
    async def check_health(self) -> Dict[str, Any]:
        """Проверить состояние OpenAI API"""
        try:
            # Простой тест с минимальным количеством токенов
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=1
            )
            
            return {
                "provider": "openai",
                "status": "healthy",
                "models_available": list(self.models.keys()),
                "response_time": 0.5,  # Примерное значение
                "rate_limit_remaining": getattr(response, '_headers', {}).get('x-ratelimit-remaining-requests'),
                "last_check": "now"
            }
            
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return {
                "provider": "openai",
                "status": "unhealthy",
                "error": str(e),
                "models_available": [],
                "last_check": "now"
            }
    
    async def analyze_kp_document(
        self,
        tz_content: str,
        kp_content: str,
        analysis_type: str = "basic"
    ) -> Dict[str, Any]:
        """Специализированный метод для анализа КП согласно ТЗ раздел 4.2"""
        
        from ..config import KP_ANALYZER_PROMPTS
        
        results = {}
        
        # Этап 1: Извлечение требований из ТЗ
        tz_analysis = await self.generate_text(
            model="gpt-4",
            prompt=KP_ANALYZER_PROMPTS["extract_tz_requirements"]["user"].format(
                tz_content=tz_content
            ),
            system_prompt=KP_ANALYZER_PROMPTS["extract_tz_requirements"]["system"],
            temperature=0.3
        )
        results["tz_requirements"] = tz_analysis["content"]
        
        # Этап 2: Извлечение данных из КП
        kp_analysis = await self.generate_text(
            model="gpt-4",
            prompt=KP_ANALYZER_PROMPTS["extract_kp_data"]["user"].format(
                kp_content=kp_content
            ),
            system_prompt=KP_ANALYZER_PROMPTS["extract_kp_data"]["system"],
            temperature=0.3
        )
        results["kp_data"] = kp_analysis["content"]
        
        if analysis_type in ["detailed", "full"]:
            # Этап 3: Сопоставление ТЗ и КП
            comparison = await self.generate_text(
                model="gpt-4",
                prompt=KP_ANALYZER_PROMPTS["compare_tz_with_kp"]["user"].format(
                    tz_requirements=results["tz_requirements"],
                    kp_data=results["kp_data"]
                ),
                system_prompt=KP_ANALYZER_PROMPTS["compare_tz_with_kp"]["system"],
                temperature=0.2
            )
            results["compliance_analysis"] = comparison["content"]
        
        if analysis_type == "full":
            # Этап 4: Оценка рисков
            risk_assessment = await self.generate_text(
                model="gpt-4",
                prompt=KP_ANALYZER_PROMPTS["risk_assessment"]["user"].format(
                    kp_data=results["kp_data"],
                    compliance_analysis=results.get("compliance_analysis", "")
                ),
                system_prompt=KP_ANALYZER_PROMPTS["risk_assessment"]["system"],
                temperature=0.2
            )
            results["risk_assessment"] = risk_assessment["content"]
            
            # Этап 5: Генерация рекомендаций
            recommendations = await self.generate_text(
                model="gpt-4",
                prompt=KP_ANALYZER_PROMPTS["recommendation_generation"]["user"].format(
                    compliance_score=85,  # Пример
                    risks=results["risk_assessment"],
                    contractor_info=results["kp_data"]
                ),
                system_prompt=KP_ANALYZER_PROMPTS["recommendation_generation"]["system"],
                temperature=0.4
            )
            results["recommendations"] = recommendations["content"]
        
        return results