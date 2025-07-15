"""
Google Provider для LLM Service DevAssist Pro
Согласно ТЗ Этап 4: AI Integrations раздел 4.3
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from .base import BaseAIProvider, AIProviderError, RateLimitError, APIKeyError

logger = logging.getLogger(__name__)

class GoogleProvider(BaseAIProvider):
    """Провайдер для Google Gemini API согласно ТЗ"""
    
    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, **kwargs)
        genai.configure(api_key=api_key)
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }
        
    def _get_available_models(self) -> Dict[str, Dict[str, Any]]:
        """Модели Google согласно ТЗ раздел 4.3"""
        return {
            "gemini-pro": {
                "display_name": "Gemini Pro",
                "max_tokens": 4096,
                "cost_per_1k_input": 0.0005,
                "cost_per_1k_output": 0.0015,
                "supports_streaming": True,
                "supports_functions": True,
                "context_window": 30720
            },
            "gemini-pro-vision": {
                "display_name": "Gemini Pro Vision",
                "max_tokens": 4096,
                "cost_per_1k_input": 0.0005,
                "cost_per_1k_output": 0.0015,
                "supports_streaming": True,
                "supports_functions": False,
                "context_window": 30720
            }
        }
    
    def _convert_messages(self, messages: List[Dict[str, str]]) -> str:
        """Конвертировать сообщения в формат Google"""
        # Google Gemini использует простой текстовый промпт
        combined_prompt = ""
        
        for message in messages:
            role = message["role"]
            content = message["content"]
            
            if role == "system":
                combined_prompt += f"Системная инструкция: {content}\n\n"
            elif role == "user":
                combined_prompt += f"Пользователь: {content}\n\n"
            elif role == "assistant":
                combined_prompt += f"Ассистент: {content}\n\n"
        
        return combined_prompt.strip()
    
    async def _make_request(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> Dict[str, Any]:
        """Выполнить запрос к Google Gemini API"""
        try:
            gemini_model = genai.GenerativeModel(model)
            prompt = self._convert_messages(messages)
            
            # Настройка генерации
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=kwargs.get('max_tokens', 1000),
                temperature=kwargs.get('temperature', 0.7),
                top_p=kwargs.get('top_p', 0.8),
                top_k=kwargs.get('top_k', 40)
            )
            
            # Выполнение запроса
            response = await asyncio.to_thread(
                gemini_model.generate_content,
                prompt,
                generation_config=generation_config,
                safety_settings=self.safety_settings
            )
            
            if response.candidates and response.candidates[0].content:
                content = response.candidates[0].content.parts[0].text
            else:
                content = ""
            
            return {
                "content": content,
                "metadata": {
                    "finish_reason": response.candidates[0].finish_reason if response.candidates else None,
                    "safety_ratings": [
                        {
                            "category": rating.category.name,
                            "probability": rating.probability.name
                        }
                        for rating in (response.candidates[0].safety_ratings if response.candidates else [])
                    ],
                    "usage": {
                        "prompt_tokens": response.usage_metadata.prompt_token_count if response.usage_metadata else 0,
                        "completion_tokens": response.usage_metadata.candidates_token_count if response.usage_metadata else 0,
                        "total_tokens": response.usage_metadata.total_token_count if response.usage_metadata else 0,
                    }
                }
            }
            
        except Exception as e:
            error_str = str(e)
            
            if "quota" in error_str.lower() or "rate" in error_str.lower():
                logger.warning(f"Google rate limit exceeded: {e}")
                raise RateLimitError(str(e), "google", model, retry_after=60)
                
            elif "api" in error_str.lower() and "key" in error_str.lower():
                logger.error(f"Google authentication failed: {e}")
                raise APIKeyError(str(e), "google", model)
                
            elif "not found" in error_str.lower() or "invalid" in error_str.lower():
                logger.error(f"Google model not found: {e}")
                raise AIProviderError(f"Model {model} not found", "google", model)
                
            else:
                logger.error(f"Google request failed: {e}")
                raise AIProviderError(str(e), "google", model)
    
    async def _make_streaming_request(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Выполнить streaming запрос к Google Gemini API"""
        try:
            gemini_model = genai.GenerativeModel(model)
            prompt = self._convert_messages(messages)
            
            # Настройка генерации
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=kwargs.get('max_tokens', 1000),
                temperature=kwargs.get('temperature', 0.7),
                top_p=kwargs.get('top_p', 0.8),
                top_k=kwargs.get('top_k', 40)
            )
            
            # Streaming запрос
            def generate_stream():
                return gemini_model.generate_content(
                    prompt,
                    generation_config=generation_config,
                    safety_settings=self.safety_settings,
                    stream=True
                )
            
            response_stream = await asyncio.to_thread(generate_stream)
            
            for chunk in response_stream:
                if chunk.candidates and chunk.candidates[0].content:
                    text = chunk.candidates[0].content.parts[0].text
                    yield text
                    
        except Exception as e:
            error_str = str(e)
            
            if "quota" in error_str.lower() or "rate" in error_str.lower():
                logger.warning(f"Google streaming rate limit exceeded: {e}")
                raise RateLimitError(str(e), "google", model, retry_after=60)
                
            elif "api" in error_str.lower() and "key" in error_str.lower():
                logger.error(f"Google streaming authentication failed: {e}")
                raise APIKeyError(str(e), "google", model)
                
            else:
                logger.error(f"Google streaming request failed: {e}")
                raise AIProviderError(str(e), "google", model)
    
    async def check_health(self) -> Dict[str, Any]:
        """Проверить состояние Google Gemini API"""
        try:
            # Простой тест с минимальным промптом
            model = genai.GenerativeModel("gemini-pro")
            response = await asyncio.to_thread(
                model.generate_content,
                "Test",
                generation_config=genai.types.GenerationConfig(max_output_tokens=1)
            )
            
            return {
                "provider": "google",
                "status": "healthy",
                "models_available": list(self.models.keys()),
                "response_time": 1.0,  # Примерное значение
                "last_check": "now"
            }
            
        except Exception as e:
            logger.error(f"Google health check failed: {e}")
            return {
                "provider": "google",
                "status": "unhealthy",
                "error": str(e),
                "models_available": [],
                "last_check": "now"
            }
    
    async def analyze_with_vision(
        self,
        text_content: str,
        image_data: bytes = None,
        analysis_prompt: str = "Проанализируй содержимое"
    ) -> Dict[str, Any]:
        """Специализированный метод для анализа с поддержкой изображений"""
        
        try:
            model = genai.GenerativeModel("gemini-pro-vision")
            
            # Подготовка контента
            content_parts = [analysis_prompt]
            
            if text_content:
                content_parts.append(f"\n\nТекстовое содержимое:\n{text_content}")
            
            if image_data:
                # Добавление изображения
                import PIL.Image
                import io
                image = PIL.Image.open(io.BytesIO(image_data))
                content_parts.append(image)
            
            response = await asyncio.to_thread(
                model.generate_content,
                content_parts,
                safety_settings=self.safety_settings
            )
            
            content = ""
            if response.candidates and response.candidates[0].content:
                content = response.candidates[0].content.parts[0].text
            
            return {
                "content": content,
                "model": "gemini-pro-vision",
                "provider": "google",
                "supports_vision": True,
                "metadata": {
                    "safety_ratings": [
                        {
                            "category": rating.category.name,
                            "probability": rating.probability.name
                        }
                        for rating in (response.candidates[0].safety_ratings if response.candidates else [])
                    ]
                }
            }
            
        except Exception as e:
            logger.error(f"Google vision analysis failed: {e}")
            raise AIProviderError(str(e), "google", "gemini-pro-vision")
    
    async def generate_structured_data(
        self,
        prompt: str,
        output_schema: Dict[str, Any],
        model: str = "gemini-pro"
    ) -> Dict[str, Any]:
        """Генерация структурированных данных с валидацией схемы"""
        
        schema_description = self._format_schema(output_schema)
        
        structured_prompt = f"""
{prompt}

ВАЖНО: Верни ответ строго в JSON формате согласно следующей схеме:

{schema_description}

Ответ должен быть валидным JSON без дополнительного текста.
"""
        
        response = await self.generate_text(
            model=model,
            prompt=structured_prompt,
            temperature=0.1  # Низкая температура для структурированности
        )
        
        return response
    
    def _format_schema(self, schema: Dict[str, Any]) -> str:
        """Форматировать схему для промпта"""
        if "properties" in schema:
            props = []
            for key, value in schema["properties"].items():
                prop_type = value.get("type", "string")
                description = value.get("description", "")
                props.append(f'  "{key}": {prop_type} // {description}')
            
            return "{\n" + ",\n".join(props) + "\n}"
        
        return str(schema)