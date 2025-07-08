"""
Document Analyzer для Documents Service
Анализ документов с использованием LLM Service
"""
import logging
import httpx
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class DocumentAnalyzer:
    """Анализатор документов с интеграцией LLM Service"""
    
    def __init__(self, llm_service_url: str = "http://localhost:8002"):
        self.llm_service_url = llm_service_url.rstrip("/")
        self.timeout = 60.0  # 60 секунд для AI анализа
    
    async def analyze_document(
        self,
        content: str,
        analysis_type: str = "summary",
        custom_prompt: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Анализ документа с помощью LLM Service
        
        Args:
            content: Текст документа для анализа
            analysis_type: Тип анализа (summary, extraction, classification, etc.)
            custom_prompt: Пользовательский промпт
            context: Дополнительный контекст для анализа
            
        Returns:
            Dict с результатами анализа
        """
        try:
            # Выбор промпта в зависимости от типа анализа
            system_prompt, user_prompt = self._get_analysis_prompts(
                analysis_type, custom_prompt, context
            )
            
            # Подготовка запроса к LLM Service
            llm_request = {
                "task_type": "analysis",
                "content": content,
                "system_prompt": system_prompt,
                "user_prompt": user_prompt,
                "temperature": 0.3,
                "max_tokens": 2000
            }
            
            # Вызов LLM Service
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.llm_service_url}/generate",
                    json=llm_request
                )
                
                if response.status_code != 200:
                    raise Exception(f"LLM Service error: {response.status_code} - {response.text}")
                
                llm_response = response.json()
            
            # Обработка результата
            analysis_result = self._process_analysis_result(
                llm_response, analysis_type
            )
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Document analysis failed: {e}")
            return {
                "error": str(e),
                "analysis_type": analysis_type,
                "status": "failed",
                "timestamp": datetime.now().isoformat()
            }
    
    def _get_analysis_prompts(
        self,
        analysis_type: str,
        custom_prompt: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> tuple[str, str]:
        """Получение промптов для анализа в зависимости от типа"""
        
        if custom_prompt:
            return "Ты опытный аналитик документов.", custom_prompt
        
        prompts = {
            "summary": {
                "system": (
                    "Ты эксперт по анализу и резюмированию документов. "
                    "Твоя задача - создать краткое, но информативное резюме документа на русском языке."
                ),
                "user": (
                    "Проанализируй следующий документ и создай структурированное резюме:\\n\\n"
                    "1. Основная тема и цель документа\\n"
                    "2. Ключевые пункты и требования\\n"
                    "3. Важные детали и характеристики\\n"
                    "4. Выводы и рекомендации (если есть)\\n\\n"
                    "Документ для анализа:\\n{content}\"\n"
                )\n            },\n            \"extraction\": {\n                \"system\": (\n                    \"Ты эксперт по извлечению структурированной информации из документов. \"\n                    \"Извлекай ключевые данные в формате JSON.\"\n                ),\n                \"user\": (\n                    \"Извлеки из документа следующую информацию в формате JSON:\\n\\n\"\n                    \"- Названия компаний и организаций\\n\"\n                    \"- Даты и сроки\\n\"\n                    \"- Числовые значения и суммы\\n\"\n                    \"- Технические характеристики\\n\"\n                    \"- Контактная информация\\n\\n\"\n                    \"Документ:\\n{content}\"\n                )\n            },\n            \"classification\": {\n                \"system\": (\n                    \"Ты эксперт по классификации документов. \"\n                    \"Определи тип документа и его основные характеристики.\"\n                ),\n                \"user\": (\n                    \"Определи:\\n\\n\"\n                    \"1. Тип документа (договор, техническое задание, коммерческое предложение, отчет, и т.д.)\\n\"\n                    \"2. Сферу деятельности\\n\"\n                    \"3. Уровень формальности\\n\"\n                    \"4. Целевую аудиторию\\n\"\n                    \"5. Основную цель документа\\n\\n\"\n                    \"Документ:\\n{content}\"\n                )\n            },\n            \"requirements_analysis\": {\n                \"system\": (\n                    \"Ты эксперт по анализу требований в документах. \"\n                    \"Выдели и структурируй все требования из документа.\"\n                ),\n                \"user\": (\n                    \"Проанализируй документ и выдели:\\n\\n\"\n                    \"1. Функциональные требования\\n\"\n                    \"2. Нефункциональные требования\\n\"\n                    \"3. Технические требования\\n\"\n                    \"4. Бизнес-требования\\n\"\n                    \"5. Ограничения и условия\\n\\n\"\n                    \"Для каждого требования укажи приоритет (высокий/средний/низкий).\\n\\n\"\n                    \"Документ:\\n{content}\"\n                )\n            },\n            \"risk_assessment\": {\n                \"system\": (\n                    \"Ты эксперт по оценке рисков в документах. \"\n                    \"Выяви потенциальные риски и проблемы.\"\n                ),\n                \"user\": (\n                    \"Проанализируй документ на предмет рисков:\\n\\n\"\n                    \"1. Технические риски\\n\"\n                    \"2. Финансовые риски\\n\"\n                    \"3. Временные риски\\n\"\n                    \"4. Правовые риски\\n\"\n                    \"5. Операционные риски\\n\\n\"\n                    \"Для каждого риска оцени вероятность и влияние.\\n\\n\"\n                    \"Документ:\\n{content}\"\n                )\n            }\n        }\n        \n        if analysis_type not in prompts:\n            # Дефолтный анализ\n            analysis_type = \"summary\"\n        \n        prompt_config = prompts[analysis_type]\n        \n        # Добавление контекста, если есть\n        user_prompt = prompt_config[\"user\"]\n        if context:\n            context_str = \"\\n\\nДополнительный контекст:\\n\"\n            for key, value in context.items():\n                context_str += f\"- {key}: {value}\\n\"\n            user_prompt = context_str + \"\\n\" + user_prompt\n        \n        return prompt_config[\"system\"], user_prompt\n    \n    def _process_analysis_result(self, llm_response: Dict[str, Any], analysis_type: str) -> Dict[str, Any]:\n        \"\"\"Обработка результата анализа от LLM Service\"\"\"\n        \n        result = {\n            \"analysis_type\": analysis_type,\n            \"status\": \"completed\",\n            \"timestamp\": datetime.now().isoformat(),\n            \"model_used\": llm_response.get(\"model_used\", \"unknown\"),\n            \"provider_used\": llm_response.get(\"provider_used\", \"unknown\"),\n            \"tokens_used\": {\n                \"prompt\": llm_response.get(\"prompt_tokens\", 0),\n                \"completion\": llm_response.get(\"completion_tokens\", 0),\n                \"total\": llm_response.get(\"total_tokens\", 0)\n            },\n            \"cost_usd\": llm_response.get(\"cost_usd\", 0.0),\n            \"response_time\": llm_response.get(\"response_time\", 0.0)\n        }\n        \n        # Основной контент анализа\n        content = llm_response.get(\"content\", \"\")\n        \n        # Попытка парсинга JSON для структурированных типов анализа\n        if analysis_type in [\"extraction\", \"classification\"] and content.strip():\n            try:\n                import json\n                # Очистка от markdown разметки\n                clean_content = content.strip()\n                if clean_content.startswith(\"```json\"):\n                    clean_content = clean_content[7:-3].strip()\n                elif clean_content.startswith(\"```\"):\n                    clean_content = clean_content[3:-3].strip()\n                \n                parsed_data = json.loads(clean_content)\n                result[\"structured_data\"] = parsed_data\n                result[\"raw_content\"] = content\n            except json.JSONDecodeError:\n                result[\"raw_content\"] = content\n                result[\"parsing_error\"] = \"Failed to parse as JSON\"\n        else:\n            result[\"content\"] = content\n        \n        # Обработка ошибок\n        if llm_response.get(\"error\"):\n            result[\"status\"] = \"error\"\n            result[\"error\"] = llm_response[\"error\"]\n        \n        return result\n    \n    async def analyze_kp_document(self, tz_content: str, kp_content: str) -> Dict[str, Any]:\n        \"\"\"Специализированный анализ КП против ТЗ\"\"\"\n        \n        try:\n            # Запрос к специализированному endpoint LLM Service\n            kp_request = {\n                \"tz_content\": tz_content,\n                \"kp_content\": kp_content,\n                \"analysis_type\": \"comprehensive\"\n            }\n            \n            async with httpx.AsyncClient(timeout=self.timeout) as client:\n                response = await client.post(\n                    f\"{self.llm_service_url}/analyze/kp\",\n                    json=kp_request\n                )\n                \n                if response.status_code != 200:\n                    raise Exception(f\"KP analysis error: {response.status_code} - {response.text}\")\n                \n                return response.json()\n                \n        except Exception as e:\n            logger.error(f\"KP document analysis failed: {e}\")\n            return {\n                \"error\": str(e),\n                \"analysis_type\": \"kp_analysis\",\n                \"status\": \"failed\",\n                \"timestamp\": datetime.now().isoformat()\n            }\n    \n    async def health_check(self) -> bool:\n        \"\"\"Проверка доступности LLM Service\"\"\"\n        try:\n            async with httpx.AsyncClient(timeout=5.0) as client:\n                response = await client.get(f\"{self.llm_service_url}/health\")\n                return response.status_code == 200\n        except Exception:\n            return False