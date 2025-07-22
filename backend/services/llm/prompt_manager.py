"""
Управление промптами для LLM Service DevAssist Pro
Согласно ТЗ Этап 4: централизованное управление промптами
"""
import json
import os
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path
from sqlalchemy.orm import Session
from ..shared.llm_models import PromptTemplate
from ..shared.llm_schemas import TaskType

logger = logging.getLogger(__name__)

class PromptManager:
    """Централизованный менеджер промптов согласно ТЗ"""
    
    def __init__(self, prompts_dir: str = None):
        self.prompts_dir = Path(prompts_dir) if prompts_dir else Path(__file__).parent.parent.parent.parent / "prompts"
        self.templates_cache: Dict[str, Dict[str, Any]] = {}
        self._load_builtin_prompts()
    
    def _load_builtin_prompts(self):
        """Загрузка встроенных промптов согласно ТЗ раздел 4.2.2"""
        
        # КП Анализатор промпты согласно ТЗ
        self.templates_cache["kp_analyzer"] = {
            "extract_tz_requirements": {
                "name": "extract_tz_requirements",
                "task_type": TaskType.DATA_EXTRACTION,
                "system_prompt": "Ты эксперт по анализу технических заданий в строительстве и девелопменте. Твоя задача - точно извлечь и структурировать все ключевые требования из ТЗ.",
                "user_prompt_template": """Проанализируй техническое задание и извлеки все ключевые требования.

Техническое задание:
{tz_content}

Извлеки и структурируй следующие данные в JSON формате:
1. "work_scope": Объем и состав требуемых работ
2. "timeline": Требования к срокам выполнения
3. "budget": Бюджетные ограничения (если указаны)
4. "technical_requirements": Технические требования и стандарты
5. "materials": Требования к материалам
6. "personnel": Требования к квалификации исполнителей
7. "special_conditions": Особые условия и ограничения
8. "acceptance_criteria": Критерии приемки работ
9. "warranty": Гарантийные требования

Верни результат строго в JSON формате без дополнительного текста.""",
                "variables": ["tz_content"],
                "version": "1.0",
                "description": "Извлечение требований из технического задания"
            },
            
            "extract_kp_data": {
                "name": "extract_kp_data",
                "task_type": TaskType.DATA_EXTRACTION,
                "system_prompt": "Ты эксперт по анализу коммерческих предложений в строительной сфере. Твоя задача - точно извлечь и структурировать все ключевые данные из КП.",
                "user_prompt_template": """Проанализируй коммерческое предложение и извлеки все ключевые данные.

Коммерческое предложение:
{kp_content}

Извлеки и структурируй следующие данные в JSON формате:
1. "cost_breakdown": Стоимость работ с разбивкой по этапам
2. "total_cost": Общая стоимость проекта (только число без валюты)
3. "currency": Валюта (руб., USD, EUR и т.д.)
4. "pricing_details": Детальная информация о ценах и расчетах
5. "timeline": Предлагаемые сроки выполнения
6. "warranty": Гарантийные обязательства
7. "work_description": Состав предлагаемых работ
8. "materials": Используемые материалы и их характеристики
9. "company_info": Квалификация персонала и опыт компании
10. "payment_terms": Условия оплаты и дополнительные условия
11. "contractor_details": Подробная информация о компании-подрядчике

Верни результат строго в JSON формате без дополнительного текста.""",
                "variables": ["kp_content"],
                "version": "1.0",
                "description": "Извлечение данных из коммерческого предложения"
            },
            
            "compare_compliance": {
                "name": "compare_compliance",
                "task_type": TaskType.COMPARISON,
                "system_prompt": "Ты эксперт по сопоставлению технических заданий с коммерческими предложениями. Проводи объективный анализ соответствия.",
                "user_prompt_template": """Сопоставь требования ТЗ с предложениями КП и оцени соответствие.

Требования ТЗ:
{tz_requirements}

Данные КП:
{kp_data}

Проведи анализ соответствия и верни результат в JSON формате:
1. "compliance_score": Общий процент соответствия (0-100)
2. "compliance_details": Детальное сопоставление по каждому пункту
3. "fully_compliant": Список полностью соответствующих требований
4. "partially_compliant": Список частично соответствующих требований с объяснениями
5. "non_compliant": Список несоответствующих или отсутствующих требований
6. "additional_offers": Дополнительные предложения КП, не требуемые в ТЗ
7. "risk_factors": Выявленные факторы риска
8. "recommendations": Рекомендации по доработке

Верни результат строго в JSON формате.""",
                "variables": ["tz_requirements", "kp_data"],
                "version": "1.0",
                "description": "Сопоставление ТЗ с КП и оценка соответствия"
            },
            
            "assess_risks": {
                "name": "assess_risks",
                "task_type": TaskType.RISK_ASSESSMENT,
                "system_prompt": "Ты эксперт по оценке рисков в строительных проектах. Проводи комплексную оценку всех потенциальных рисков.",
                "user_prompt_template": """Оцени риски в данном коммерческом предложении.

Данные КП:
{kp_data}

Результаты анализа соответствия:
{compliance_analysis}

Проведи оценку рисков и верни результат в JSON формате:
1. "overall_risk_level": Общий уровень риска (low/medium/high)
2. "financial_risks": Финансовые риски
3. "technical_risks": Технические и качественные риски
4. "timeline_risks": Риски по срокам
5. "contractor_risks": Риски, связанные с подрядчиком
6. "hidden_risks": Скрытые или неочевидные риски
7. "mitigation_strategies": Стратегии снижения рисков
8. "red_flags": Критические предупреждающие сигналы

Каждый риск должен содержать: description, probability, impact, severity.
Верни результат строго в JSON формате.""",
                "variables": ["kp_data", "compliance_analysis"],
                "version": "1.0",
                "description": "Комплексная оценка рисков КП"
            },
            
            "generate_recommendations": {
                "name": "generate_recommendations",
                "task_type": TaskType.RECOMMENDATION,
                "system_prompt": "Ты эксперт-консультант по выбору подрядчиков в строительстве. Формируй практичные и обоснованные рекомендации.",
                "user_prompt_template": """На основе анализа сформируй рекомендации по данному КП.

Данные анализа:
- Соответствие ТЗ: {compliance_score}%
- Выявленные риски: {risks_summary}
- Данные подрядчика: {contractor_info}

Сформируй рекомендации в JSON формате:
1. "overall_recommendation": Общая рекомендация (accept/reject/conditional)
2. "decision_rationale": Обоснование решения
3. "key_strengths": Ключевые преимущества КП
4. "major_weaknesses": Основные недостатки КП
5. "clarification_questions": Вопросы для уточнения подрядчику
6. "improvement_suggestions": Рекомендации по доработке КП
7. "negotiation_points": Ключевые моменты для переговоров
8. "next_steps": Следующие шаги в процессе выбора

Верни результат строго в JSON формате.""",
                "variables": ["compliance_score", "risks_summary", "contractor_info"],
                "version": "1.0",
                "description": "Генерация рекомендаций по КП"
            }
        }
        
        # Промпты для других модулей
        self.templates_cache["tz_generator"] = {
            "generate_tz_section": {
                "name": "generate_tz_section",
                "task_type": TaskType.REPORT_GENERATION,
                "system_prompt": "Ты эксперт по составлению технических заданий в строительстве.",
                "user_prompt_template": """Создай раздел технического задания на основе следующих данных:

Тип проекта: {project_type}
Раздел ТЗ: {section_name}
Требования: {requirements}

Создай детальный и профессиональный раздел ТЗ.""",
                "variables": ["project_type", "section_name", "requirements"],
                "version": "1.0",
                "description": "Генерация раздела технического задания"
            }
        }
        
        # Общие промпты
        self.templates_cache["general"] = {
            "summarize_document": {
                "name": "summarize_document",
                "task_type": TaskType.TEXT_ANALYSIS,
                "system_prompt": "Ты эксперт по анализу и резюмированию документов.",
                "user_prompt_template": """Создай краткое резюме следующего документа:

{document_content}

Выдели ключевые моменты, основные цифры и важные решения.""",
                "variables": ["document_content"],
                "version": "1.0",
                "description": "Резюмирование документа"
            }
        }
        
        logger.info(f"Loaded {sum(len(module) for module in self.templates_cache.values())} builtin prompts")
    
    def get_prompt_template(self, module: str, template_name: str) -> Optional[Dict[str, Any]]:
        """Получить шаблон промпта"""
        return self.templates_cache.get(module, {}).get(template_name)
    
    def format_prompt(
        self, 
        module: str, 
        template_name: str, 
        variables: Dict[str, Any]
    ) -> tuple[str, str]:
        """Форматировать промпт с подстановкой переменных"""
        
        template = self.get_prompt_template(module, template_name)
        if not template:
            raise ValueError(f"Template {module}/{template_name} not found")
        
        try:
            system_prompt = template["system_prompt"]
            user_prompt = template["user_prompt_template"].format(**variables)
            return system_prompt, user_prompt
            
        except KeyError as e:
            missing_var = str(e).strip("'\"")
            raise ValueError(f"Missing variable {missing_var} for template {module}/{template_name}")
    
    def list_templates(self, module: Optional[str] = None) -> Dict[str, List[str]]:
        """Получить список доступных шаблонов"""
        if module:
            return {module: list(self.templates_cache.get(module, {}).keys())}
        
        return {
            module: list(templates.keys()) 
            for module, templates in self.templates_cache.items()
        }
    
    def validate_template(self, template: Dict[str, Any]) -> List[str]:
        """Валидация шаблона промпта"""
        errors = []
        
        required_fields = ["name", "task_type", "system_prompt", "user_prompt_template", "variables"]
        for field in required_fields:
            if field not in template:
                errors.append(f"Missing required field: {field}")
        
        # Проверка переменных в шаблоне
        if "user_prompt_template" in template and "variables" in template:
            template_text = template["user_prompt_template"]
            declared_vars = set(template["variables"])
            
            # Найти все переменные в шаблоне
            import re
            found_vars = set(re.findall(r'{(\w+)}', template_text))
            
            # Проверить соответствие
            missing_vars = found_vars - declared_vars
            unused_vars = declared_vars - found_vars
            
            if missing_vars:
                errors.append(f"Variables used in template but not declared: {missing_vars}")
            if unused_vars:
                errors.append(f"Variables declared but not used in template: {unused_vars}")
        
        return errors
    
    def add_custom_template(
        self, 
        module: str, 
        template: Dict[str, Any],
        db: Session
    ) -> bool:
        """Добавить пользовательский шаблон"""
        
        # Валидация
        errors = self.validate_template(template)
        if errors:
            logger.error(f"Template validation failed: {errors}")
            return False
        
        try:
            # Сохранение в базу данных
            db_template = PromptTemplate(
                name=template["name"],
                task_type=template["task_type"],
                system_prompt=template["system_prompt"],
                user_prompt_template=template["user_prompt_template"],
                variables=template["variables"],
                version=template.get("version", "1.0"),
                description=template.get("description", ""),
                examples=template.get("examples"),
                created_by_id=template.get("created_by_id", 1)  # TODO: Get from auth
            )
            
            db.add(db_template)
            db.commit()
            
            # Добавление в кеш
            if module not in self.templates_cache:
                self.templates_cache[module] = {}
            
            self.templates_cache[module][template["name"]] = template
            
            logger.info(f"Added custom template {module}/{template['name']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add custom template: {e}")
            db.rollback()
            return False
    
    def load_templates_from_db(self, db: Session):
        """Загрузить шаблоны из базы данных"""
        try:
            templates = db.query(PromptTemplate).filter(PromptTemplate.is_active == True).all()
            
            for template in templates:
                # Определить модуль по имени или task_type
                module = "custom"  # По умолчанию
                
                if template.name.startswith("kp_"):
                    module = "kp_analyzer"
                elif template.name.startswith("tz_"):
                    module = "tz_generator"
                
                if module not in self.templates_cache:
                    self.templates_cache[module] = {}
                
                self.templates_cache[module][template.name] = {
                    "name": template.name,
                    "task_type": template.task_type,
                    "system_prompt": template.system_prompt,
                    "user_prompt_template": template.user_prompt_template,
                    "variables": template.variables,
                    "version": template.version,
                    "description": template.description,
                    "examples": template.examples
                }
            
            logger.info(f"Loaded {len(templates)} templates from database")
            
        except Exception as e:
            logger.error(f"Failed to load templates from database: {e}")
    
    def export_templates(self, output_dir: str):
        """Экспорт шаблонов в файлы"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        for module, templates in self.templates_cache.items():
            module_file = output_path / f"{module}_prompts.json"
            
            with open(module_file, 'w', encoding='utf-8') as f:
                json.dump(templates, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Exported templates to {output_path}")
    
    def get_template_statistics(self) -> Dict[str, Any]:
        """Получить статистику по шаблонам"""
        stats = {
            "total_templates": sum(len(templates) for templates in self.templates_cache.values()),
            "modules": len(self.templates_cache),
            "templates_by_module": {
                module: len(templates) 
                for module, templates in self.templates_cache.items()
            },
            "templates_by_task_type": {}
        }
        
        # Подсчет по типам задач
        for templates in self.templates_cache.values():
            for template in templates.values():
                task_type = template.get("task_type", "unknown")
                stats["templates_by_task_type"][task_type] = stats["templates_by_task_type"].get(task_type, 0) + 1
        
        return stats