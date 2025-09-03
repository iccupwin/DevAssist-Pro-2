"""
Real Document Analyzer - ЗАМЕНЯЕТ MOCK реализацию
Реальная интеграция TextExtractor → LLM Service → AI Analysis
"""
import asyncio
import logging
import httpx
import json
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime
import uuid

from .text_extractor import TextExtractor

logger = logging.getLogger(__name__)

class RealDocumentAnalyzer:
    """Реальный анализатор документов с AI интеграцией"""
    
    def __init__(self, llm_service_url: str = "http://localhost:8002"):
        self.text_extractor = TextExtractor()
        self.llm_service_url = llm_service_url
        self.http_client = httpx.AsyncClient(timeout=120.0)  # 2 минуты timeout
        
    async def analyze_document(self, document_path: Path, document_type: str = "kp") -> Dict[str, Any]:
        """
        Полный анализ документа через AI
        
        Args:
            document_path: Путь к документу
            document_type: Тип документа (kp, tz)
            
        Returns:
            Результат анализа с данными от AI
        """
        try:
            analysis_id = str(uuid.uuid4())
            logger.info(f"Starting document analysis {analysis_id} for {document_path}")
            
            # 1. Извлечение текста
            logger.info("Step 1: Extracting text from document")
            extracted_text = await self.text_extractor.extract_text_async(document_path)
            
            if not extracted_text or len(extracted_text.strip()) < 10:
                raise ValueError("Extracted text is empty or too short")
                
            logger.info(f"Extracted {len(extracted_text)} characters from document")
            
            # 2. Получение метаданных документа
            document_info = self.text_extractor.get_document_info(document_path)
            
            # 3. AI анализ через LLM Service
            logger.info("Step 2: Sending to AI analysis")
            ai_result = await self._perform_ai_analysis(extracted_text, document_type, analysis_id)
            
            # 4. Формирование результата
            result = {
                "analysis_id": analysis_id,
                "document_info": document_info,
                "extracted_text": extracted_text[:1000] + "..." if len(extracted_text) > 1000 else extracted_text,
                "full_text_length": len(extracted_text),
                "ai_analysis": ai_result,
                "analyzed_at": datetime.now().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Document analysis {analysis_id} completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Document analysis failed: {str(e)}")
            return {
                "analysis_id": analysis_id if 'analysis_id' in locals() else str(uuid.uuid4()),
                "status": "failed",
                "error": str(e),
                "analyzed_at": datetime.now().isoformat()
            }
    
    async def _perform_ai_analysis(self, text: str, document_type: str, analysis_id: str) -> Dict[str, Any]:
        """Отправка текста на AI анализ"""
        try:
            # Подготовка запроса для LLM Service
            ai_request = {
                "task_type": "DATA_EXTRACTION" if document_type == "kp" else "COMPARISON",
                "content": text,
                "user_id": 1,  # TODO: получать из контекста
                "organization_id": 1,
                "system_prompt": self._get_system_prompt(document_type),
                "user_prompt": self._get_user_prompt(document_type),
                "model_override": None,  # Использовать модель по умолчанию
                "temperature": 0.1,  # Низкая температура для точности
                "max_tokens": 2000,
                "metadata": {
                    "analysis_id": analysis_id,
                    "document_type": document_type
                }
            }
            
            logger.info(f"Sending AI request to {self.llm_service_url}/generate")
            
            # Отправка запроса к LLM Service (используем прямой endpoint)
            response = await self.http_client.post(
                "http://localhost:8000/api/llm/analyze", 
                json={
                    "prompt": ai_request["content"],
                    "model": ai_request.get("model_override", "claude-3-haiku-20240307"),
                    "max_tokens": ai_request.get("max_tokens", 2000),
                    "temperature": ai_request.get("temperature", 0.1)
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                ai_response = response.json()
                logger.info("AI analysis completed successfully")
                return self._process_ai_response(ai_response, document_type)
            else:
                logger.error(f"AI service error: {response.status_code} - {response.text}")
                raise Exception(f"AI service failed: {response.status_code} - {response.text}")
                
        except httpx.TimeoutException:
            logger.error("AI service timeout")
            raise Exception("AI service timeout - real analysis unavailable")
        except Exception as e:
            logger.error(f"AI analysis error: {str(e)}")
            raise Exception(f"AI analysis failed: {str(e)}")
    
    def _get_system_prompt(self, document_type: str) -> str:
        """Получить системный промпт для типа документа"""
        # Попытка использовать промпт из файла
        try:
            from pathlib import Path
            import sys
            
            # Добавление пути к модулю prompts
            current_dir = Path(__file__).parent.parent.parent.parent
            prompts_dir = current_dir / "prompts"
            sys.path.append(str(prompts_dir))
            
            from prompt_manager import get_prompts_for_document_type
            prompts = get_prompts_for_document_type(document_type)
            return prompts.get('system_prompt', self._get_fallback_system_prompt(document_type))
            
        except Exception as e:
            logger.warning(f"Could not load prompts from file: {e}")
            return self._get_fallback_system_prompt(document_type)
    
    def _get_fallback_system_prompt(self, document_type: str) -> str:
        """Получить fallback системный промпт"""
        if document_type == "kp":
            return """Ты эксперт по анализу коммерческих предложений в строительной сфере. 
            Твоя задача - точно извлечь и структурировать все ключевые данные из КП."""
        else:
            return """Ты эксперт по анализу технических заданий в строительстве и девелопменте. 
            Твоя задача - точно извлечь и структурировать все ключевые требования из ТЗ."""
    
    def _get_user_prompt(self, document_type: str) -> str:
        """Получить пользовательский промпт для типа документа"""
        # Попытка использовать промпт из файла
        try:
            from pathlib import Path
            import sys
            
            # Добавление пути к модулю prompts
            current_dir = Path(__file__).parent.parent.parent.parent
            prompts_dir = current_dir / "prompts"
            sys.path.append(str(prompts_dir))
            
            from prompt_manager import get_prompts_for_document_type
            prompts = get_prompts_for_document_type(document_type)
            return prompts.get('user_prompt', self._get_fallback_user_prompt(document_type))
            
        except Exception as e:
            logger.warning(f"Could not load prompts from file: {e}")
            return self._get_fallback_user_prompt(document_type)
    
    def _get_fallback_user_prompt(self, document_type: str) -> str:
        """Получить fallback пользовательский промпт"""
        if document_type == "kp":
            return """Проанализируй коммерческое предложение и извлеки следующие данные в JSON формате:
            1. "total_cost": Общая стоимость проекта (только число)
            2. "currency": Валюта
            3. "cost_breakdown": Разбивка стоимости по этапам
            4. "timeline": Сроки выполнения
            5. "work_description": Описание работ
            6. "materials": Материалы и характеристики
            7. "warranty": Гарантийные обязательства
            8. "payment_terms": Условия оплаты
            9. "contractor_details": Информация о подрядчике
            
            Верни результат строго в JSON формате."""
        else:
            return """Проанализируй техническое задание и извлеки ключевые требования в JSON формате:
            1. "work_scope": Объем работ
            2. "timeline": Требования к срокам
            3. "budget": Бюджетные ограничения
            4. "technical_requirements": Технические требования
            5. "materials": Требования к материалам
            6. "acceptance_criteria": Критерии приемки
            
            Верни результат строго в JSON формате."""
    
    def _process_ai_response(self, ai_response: Dict[str, Any], document_type: str) -> Dict[str, Any]:
        """Обработка ответа от AI сервиса"""
        try:
            # Извлечение данных из ответа LLM Service
            content = ai_response.get("content", "")
            model_used = ai_response.get("model_used", "unknown")
            
            # Попытка парсинга JSON из ответа AI
            try:
                # Удаляем markdown разметку если есть
                clean_content = content.strip()
                if clean_content.startswith("```json"):
                    clean_content = clean_content.replace("```json", "").replace("```", "")
                elif clean_content.startswith("```"):
                    clean_content = clean_content.replace("```", "")
                
                parsed_data = json.loads(clean_content)
                
                return {
                    "structured_data": parsed_data,
                    "raw_response": content,
                    "model_used": model_used,
                    "tokens_used": ai_response.get("total_tokens", 0),
                    "cost_usd": ai_response.get("cost_usd", 0.0),
                    "analysis_quality": "high"
                }
                
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON from AI response, using raw text")
                return {
                    "structured_data": {"raw_analysis": content},
                    "raw_response": content,
                    "model_used": model_used,
                    "analysis_quality": "medium"
                }
                
        except Exception as e:
            logger.error(f"Error processing AI response: {str(e)}")
            return self._create_fallback_analysis("", document_type)
    
    def _create_fallback_analysis(self, text: str, document_type: str) -> Dict[str, Any]:
        """Создание fallback анализа при сбое AI"""
        return {
            "structured_data": {
                "error": "AI analysis failed",
                "fallback_analysis": f"Document contains {len(text)} characters",
                "document_type": document_type
            },
            "raw_response": "AI service unavailable",
            "model_used": "fallback",
            "analysis_quality": "low",
            "fallback": True
        }
    
    async def close(self):
        """Закрытие HTTP клиента"""
        await self.http_client.aclose()