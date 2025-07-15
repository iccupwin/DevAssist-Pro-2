"""
Template Manager для DevAssist Pro
Управление шаблонами отчетов
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path
import json
import uuid

logger = logging.getLogger(__name__)

class TemplateManager:
    """Менеджер шаблонов отчетов"""
    
    def __init__(self):
        self.templates_dir = Path("data/templates")
        self.templates_dir.mkdir(exist_ok=True)
        
        # Загрузка шаблонов из файлов
        self.templates = {}
        self._load_templates()
    
    def _load_templates(self):
        """Загрузка шаблонов из файлов"""
        
        # Стандартные шаблоны
        self.templates = {
            "kp_analysis_default": {
                "id": "kp_analysis_default",
                "name": "Стандартный анализ КП",
                "description": "Базовый шаблон для анализа коммерческих предложений",
                "report_type": "pdf",
                "sections": [
                    {
                        "id": "executive_summary",
                        "name": "Резюме анализа",
                        "required": True,
                        "order": 1
                    },
                    {
                        "id": "document_info",
                        "name": "Информация о документе",
                        "required": True,
                        "order": 2
                    },
                    {
                        "id": "analysis_results",
                        "name": "Результаты анализа",
                        "required": True,
                        "order": 3
                    },
                    {
                        "id": "recommendations",
                        "name": "Рекомендации",
                        "required": True,
                        "order": 4
                    }
                ],
                "layout": {
                    "page_size": "A4",
                    "margins": {
                        "top": 72,
                        "bottom": 72,
                        "left": 72,
                        "right": 72
                    },
                    "fonts": {
                        "title": {"family": "Arial", "size": 20, "bold": True},
                        "header": {"family": "Arial", "size": 16, "bold": True},
                        "body": {"family": "Arial", "size": 12, "bold": False}
                    },
                    "colors": {
                        "primary": "#2E75D6",
                        "secondary": "#1A1E3A",
                        "accent": "#FF5F08",
                        "background": "#F4F7FC"
                    }
                },
                "created_at": datetime.utcnow().isoformat(),
                "is_default": True,
                "is_custom": False
            },
            
            "kp_comparison": {
                "id": "kp_comparison",
                "name": "Сравнение КП",
                "description": "Шаблон для сравнительного анализа нескольких КП",
                "report_type": "pdf",
                "sections": [
                    {
                        "id": "comparison_summary",
                        "name": "Сводка сравнения",
                        "required": True,
                        "order": 1
                    },
                    {
                        "id": "side_by_side_analysis",
                        "name": "Параллельный анализ",
                        "required": True,
                        "order": 2
                    },
                    {
                        "id": "score_breakdown",
                        "name": "Детализация оценок",
                        "required": True,
                        "order": 3
                    },
                    {
                        "id": "recommendations",
                        "name": "Рекомендации",
                        "required": True,
                        "order": 4
                    }
                ],
                "layout": {
                    "page_size": "A4",
                    "orientation": "landscape",
                    "margins": {
                        "top": 72,
                        "bottom": 72,
                        "left": 72,
                        "right": 72
                    }
                },
                "created_at": datetime.utcnow().isoformat(),
                "is_default": False,
                "is_custom": False
            },
            
            "detailed_analysis": {
                "id": "detailed_analysis",
                "name": "Детальный анализ",
                "description": "Подробный шаблон с расширенными секциями",
                "report_type": "pdf",
                "sections": [
                    {
                        "id": "executive_summary",
                        "name": "Резюме",
                        "required": True,
                        "order": 1
                    },
                    {
                        "id": "document_metadata",
                        "name": "Метаданные документа",
                        "required": True,
                        "order": 2
                    },
                    {
                        "id": "content_analysis",
                        "name": "Анализ содержания",
                        "required": True,
                        "order": 3
                    },
                    {
                        "id": "technical_requirements",
                        "name": "Технические требования",
                        "required": True,
                        "order": 4
                    },
                    {
                        "id": "cost_analysis",
                        "name": "Анализ стоимости",
                        "required": True,
                        "order": 5
                    },
                    {
                        "id": "timeline_analysis",
                        "name": "Анализ временных рамок",
                        "required": True,
                        "order": 6
                    },
                    {
                        "id": "risk_assessment",
                        "name": "Оценка рисков",
                        "required": False,
                        "order": 7
                    },
                    {
                        "id": "recommendations",
                        "name": "Рекомендации",
                        "required": True,
                        "order": 8
                    },
                    {
                        "id": "appendices",
                        "name": "Приложения",
                        "required": False,
                        "order": 9
                    }
                ],
                "layout": {
                    "page_size": "A4",
                    "margins": {
                        "top": 72,
                        "bottom": 72,
                        "left": 72,
                        "right": 72
                    }
                },
                "created_at": datetime.utcnow().isoformat(),
                "is_default": False,
                "is_custom": False
            }
        }
        
        # Загрузка кастомных шаблонов из файлов
        self._load_custom_templates()
    
    def _load_custom_templates(self):
        """Загрузка кастомных шаблонов из файлов"""
        
        templates_pattern = self.templates_dir / "*.json"
        
        for template_file in self.templates_dir.glob("*.json"):
            try:
                with open(template_file, 'r', encoding='utf-8') as f:
                    template_data = json.load(f)
                
                template_id = template_data.get("id", template_file.stem)
                self.templates[template_id] = template_data
                
                logger.info(f"Loaded custom template: {template_id}")
                
            except Exception as e:
                logger.error(f"Error loading template {template_file}: {str(e)}")
    
    async def list_templates(self) -> List[Dict[str, Any]]:
        """Получение списка всех шаблонов"""
        
        templates_list = []
        
        for template_id, template in self.templates.items():
            templates_list.append({
                "id": template_id,
                "name": template["name"],
                "description": template.get("description", ""),
                "report_type": template.get("report_type", "pdf"),
                "sections_count": len(template.get("sections", [])),
                "is_default": template.get("is_default", False),
                "is_custom": template.get("is_custom", False),
                "created_at": template.get("created_at")
            })
        
        # Сортировка: сначала дефолтные, потом кастомные
        templates_list.sort(key=lambda x: (not x["is_default"], x["name"]))
        
        return templates_list
    
    async def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Получение шаблона по ID"""
        
        return self.templates.get(template_id)
    
    async def create_template(
        self,
        name: str,
        description: str,
        template_data: Dict[str, Any],
        report_type: str = "pdf"
    ) -> str:
        """
        Создание нового шаблона
        
        Args:
            name: Название шаблона
            description: Описание
            template_data: Данные шаблона
            report_type: Тип отчета
            
        Returns:
            ID созданного шаблона
        """
        
        # Генерация ID
        template_id = f"custom_{uuid.uuid4().hex[:8]}"
        
        # Подготовка данных шаблона
        template = {
            "id": template_id,
            "name": name,
            "description": description,
            "report_type": report_type,
            "sections": template_data.get("sections", []),
            "layout": template_data.get("layout", {}),
            "created_at": datetime.utcnow().isoformat(),
            "is_default": False,
            "is_custom": True
        }
        
        # Валидация секций
        self._validate_template_sections(template["sections"])
        
        # Сохранение в память
        self.templates[template_id] = template
        
        # Сохранение в файл
        await self._save_template_to_file(template_id, template)
        
        logger.info(f"Created template: {template_id}")
        return template_id
    
    def _validate_template_sections(self, sections: List[Dict[str, Any]]):
        """Валидация секций шаблона"""
        
        required_fields = ["id", "name", "order"]
        
        for section in sections:
            # Проверка обязательных полей
            for field in required_fields:
                if field not in section:
                    raise ValueError(f"Missing required field '{field}' in section")
            
            # Проверка типов
            if not isinstance(section["order"], int):
                raise ValueError("Section order must be an integer")
            
            if not isinstance(section["name"], str):
                raise ValueError("Section name must be a string")
    
    async def _save_template_to_file(self, template_id: str, template: Dict[str, Any]):
        """Сохранение шаблона в файл"""
        
        file_path = self.templates_dir / f"{template_id}.json"
        
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(template, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Template saved to file: {file_path}")
            
        except Exception as e:
            logger.error(f"Error saving template to file: {str(e)}")
            raise
    
    async def update_template(
        self,
        template_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """
        Обновление существующего шаблона
        
        Args:
            template_id: ID шаблона
            updates: Обновления для применения
            
        Returns:
            True если обновление успешно
        """
        
        if template_id not in self.templates:
            raise ValueError(f"Template {template_id} not found")
        
        template = self.templates[template_id]
        
        # Проверка на изменение стандартных шаблонов
        if not template.get("is_custom", False):
            raise ValueError("Cannot modify standard templates")
        
        # Применение обновлений
        allowed_updates = ["name", "description", "sections", "layout", "report_type"]
        
        for key, value in updates.items():
            if key in allowed_updates:
                template[key] = value
        
        # Валидация секций если они обновляются
        if "sections" in updates:
            self._validate_template_sections(updates["sections"])
        
        # Обновление времени изменения
        template["updated_at"] = datetime.utcnow().isoformat()
        
        # Сохранение в файл
        await self._save_template_to_file(template_id, template)
        
        logger.info(f"Updated template: {template_id}")
        return True
    
    async def delete_template(self, template_id: str) -> bool:
        """
        Удаление шаблона
        
        Args:
            template_id: ID шаблона
            
        Returns:
            True если удаление успешно
        """
        
        if template_id not in self.templates:
            raise ValueError(f"Template {template_id} not found")
        
        template = self.templates[template_id]
        
        # Проверка на удаление стандартных шаблонов
        if not template.get("is_custom", False):
            raise ValueError("Cannot delete standard templates")
        
        # Удаление из памяти
        del self.templates[template_id]
        
        # Удаление файла
        file_path = self.templates_dir / f"{template_id}.json"
        if file_path.exists():
            file_path.unlink()
        
        logger.info(f"Deleted template: {template_id}")
        return True
    
    async def get_template_sections(self, template_id: str) -> List[Dict[str, Any]]:
        """Получение секций шаблона"""
        
        template = await self.get_template(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        return template.get("sections", [])
    
    async def validate_template_compatibility(
        self,
        template_id: str,
        report_type: str
    ) -> bool:
        """
        Проверка совместимости шаблона с типом отчета
        
        Args:
            template_id: ID шаблона
            report_type: Тип отчета (pdf, excel, html, word)
            
        Returns:
            True если совместимо
        """
        
        template = await self.get_template(template_id)
        if not template:
            return False
        
        # Базовая проверка совместимости
        template_type = template.get("report_type", "pdf")
        
        # Некоторые шаблоны могут быть универсальными
        if template_type == "universal":
            return True
        
        # Проверка прямого соответствия
        if template_type == report_type:
            return True
        
        # Дополнительные правила совместимости
        compatibility_rules = {
            "pdf": ["html", "word"],
            "html": ["pdf"],
            "excel": ["csv"],
            "word": ["pdf", "html"]
        }
        
        compatible_types = compatibility_rules.get(template_type, [])
        return report_type in compatible_types