"""
Anthropic Provider для LLM Service DevAssist Pro
Согласно ТЗ Этап 4: AI Integrations раздел 4.3
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
import anthropic
from anthropic import AsyncAnthropic
from .base import BaseAIProvider, AIProviderError, RateLimitError, APIKeyError

logger = logging.getLogger(__name__)

class AnthropicProvider(BaseAIProvider):
    """Провайдер для Anthropic Claude API согласно ТЗ"""
    
    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, **kwargs)
        self.client = AsyncAnthropic(api_key=api_key)
        
    def _get_available_models(self) -> Dict[str, Dict[str, Any]]:
        """Модели Anthropic согласно ТЗ раздел 4.3"""
        return {
            "claude-3-opus-20240229": {
                "display_name": "Claude 3 Opus",
                "max_tokens": 4096,
                "cost_per_1k_input": 0.015,
                "cost_per_1k_output": 0.075,
                "supports_streaming": True,
                "supports_functions": False,
                "context_window": 200000
            },
            "claude-3-sonnet-20240229": {
                "display_name": "Claude 3 Sonnet",
                "max_tokens": 4096,
                "cost_per_1k_input": 0.003,
                "cost_per_1k_output": 0.015,
                "supports_streaming": True,
                "supports_functions": False,
                "context_window": 200000
            },
            "claude-3-haiku-20240307": {
                "display_name": "Claude 3 Haiku",
                "max_tokens": 4096,
                "cost_per_1k_input": 0.00025,
                "cost_per_1k_output": 0.00125,
                "supports_streaming": True,
                "supports_functions": False,
                "context_window": 200000
            }
        }
    
    def _convert_messages(self, messages: List[Dict[str, str]]) -> tuple:
        """Конвертировать сообщения в формат Anthropic"""
        system_prompt = ""
        converted_messages = []
        
        for message in messages:
            if message["role"] == "system":
                system_prompt = message["content"]
            else:
                converted_messages.append({
                    "role": message["role"],
                    "content": message["content"]
                })
        
        return system_prompt, converted_messages
    
    async def _make_request(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> Dict[str, Any]:
        """Выполнить запрос к Anthropic API"""
        try:
            system_prompt, converted_messages = self._convert_messages(messages)
            
            request_params = {
                "model": model,
                "messages": converted_messages,
                **kwargs
            }
            
            if system_prompt:
                request_params["system"] = system_prompt
            
            response = await self.client.messages.create(**request_params)
            
            return {
                "content": response.content[0].text if response.content else "",
                "metadata": {
                    "stop_reason": response.stop_reason,
                    "usage": {
                        "prompt_tokens": response.usage.input_tokens if response.usage else 0,
                        "completion_tokens": response.usage.output_tokens if response.usage else 0,
                        "total_tokens": (response.usage.input_tokens + response.usage.output_tokens) if response.usage else 0,
                    }
                }
            }
            
        except anthropic.RateLimitError as e:
            logger.warning(f"Anthropic rate limit exceeded: {e}")
            raise RateLimitError(str(e), "anthropic", model, retry_after=60)
            
        except anthropic.AuthenticationError as e:
            logger.error(f"Anthropic authentication failed: {e}")
            raise APIKeyError(str(e), "anthropic", model)
            
        except anthropic.NotFoundError as e:
            logger.error(f"Anthropic model not found: {e}")
            raise AIProviderError(f"Model {model} not found", "anthropic", model)
            
        except Exception as e:
            logger.error(f"Anthropic request failed: {e}")
            raise AIProviderError(str(e), "anthropic", model)
    
    async def _make_streaming_request(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Выполнить streaming запрос к Anthropic API"""
        try:
            system_prompt, converted_messages = self._convert_messages(messages)
            
            request_params = {
                "model": model,
                "messages": converted_messages,
                "stream": True,
                **kwargs
            }
            
            if system_prompt:
                request_params["system"] = system_prompt
            
            async with self.client.messages.stream(**request_params) as stream:
                async for text in stream.text_stream:
                    yield text
                    
        except anthropic.RateLimitError as e:
            logger.warning(f"Anthropic streaming rate limit exceeded: {e}")
            raise RateLimitError(str(e), "anthropic", model, retry_after=60)
            
        except anthropic.AuthenticationError as e:
            logger.error(f"Anthropic streaming authentication failed: {e}")
            raise APIKeyError(str(e), "anthropic", model)
            
        except Exception as e:
            logger.error(f"Anthropic streaming request failed: {e}")
            raise AIProviderError(str(e), "anthropic", model)
    
    async def check_health(self) -> Dict[str, Any]:
        """Проверить состояние Anthropic API"""
        try:
            # Простой тест с минимальным количеством токенов
            response = await self.client.messages.create(
                model="claude-3-haiku-20240307",
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=1
            )
            
            return {
                "provider": "anthropic",
                "status": "healthy",
                "models_available": list(self.models.keys()),
                "response_time": 0.8,  # Примерное значение
                "last_check": "now"
            }
            
        except Exception as e:
            logger.error(f"Anthropic health check failed: {e}")
            return {
                "provider": "anthropic",
                "status": "unhealthy",
                "error": str(e),
                "models_available": [],
                "last_check": "now"
            }
    
    async def analyze_document_semantics(
        self,
        document_content: str,
        analysis_goal: str = "extract_key_info"
    ) -> Dict[str, Any]:
        """Специализированный метод для семантического анализа документов"""
        
        system_prompt = """Ты эксперт по анализу документов в сфере строительства и девелопмента.
        Проводи глубокий семантический анализ с фокусом на практические аспекты."""
        
        user_prompt = f"""Проанализируй следующий документ и извлеки ключевую информацию:

Документ:
{document_content}

Цель анализа: {analysis_goal}

Проведи структурированный анализ:
1. Основные темы и ключевые понятия
2. Количественные данные и метрики
3. Временные рамки и даты
4. Финансовые показатели
5. Требования и ограничения
6. Риски и возможности

Верни результат в структурированном JSON формате."""
        
        response = await self.generate_text(
            model="claude-3-sonnet-20240229",
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.2,
            max_tokens=2000
        )
        
        return response
    
    async def compare_documents(
        self,
        doc1_content: str,
        doc2_content: str,
        comparison_criteria: List[str] = None
    ) -> Dict[str, Any]:
        """Специализированный метод для сравнения документов"""
        
        if comparison_criteria is None:
            comparison_criteria = [
                "Соответствие требованиям",
                "Полнота информации", 
                "Финансовые условия",
                "Временные рамки",
                "Качественные характеристики"
            ]
        
        system_prompt = """Ты эксперт по сравнительному анализу документов в строительной сфере.
        Проводи объективное сравнение с фокусом на практические различия."""
        
        user_prompt = f"""Сравни два документа по заданным критериям:

Документ 1:
{doc1_content}

Документ 2:
{doc2_content}

Критерии сравнения:
{chr(10).join(f'- {criterion}' for criterion in comparison_criteria)}

Проведи детальное сравнение:
1. Сравнительная таблица по каждому критерию
2. Ключевые различия и сходства
3. Преимущества и недостатки каждого документа
4. Рекомендации по выбору
5. Оценка соответствия в процентах

Верни результат в структурированном JSON формате."""
        
        response = await self.generate_text(
            model="claude-3-opus-20240229",  # Opus для сложного анализа
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.1,  # Низкая температура для объективности
            max_tokens=3000
        )
        
        return response