"""
Report Generator для DevAssist Pro
Основной генератор отчетов для КП Анализатора
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path
import json

logger = logging.getLogger(__name__)

class ReportGenerator:
    """Основной класс для генерации отчетов"""
    
    def __init__(self):
        self.supported_formats = ["pdf", "excel", "html", "word"]
        self.report_templates = {}
        self._load_default_templates()
    
    def _load_default_templates(self):
        """Загрузка стандартных шаблонов отчетов"""
        self.report_templates = {
            "kp_analysis_default": {
                "name": "Стандартный анализ КП",
                "sections": [
                    "executive_summary",
                    "document_info",
                    "analysis_results",
                    "recommendations",
                    "appendices"
                ],
                "layout": "standard"
            },
            "kp_comparison": {
                "name": "Сравнение КП",
                "sections": [
                    "comparison_summary",
                    "side_by_side_analysis",
                    "score_breakdown",
                    "recommendations"
                ],
                "layout": "comparison"
            },
            "detailed_analysis": {
                "name": "Детальный анализ",
                "sections": [
                    "executive_summary",
                    "document_metadata",
                    "content_analysis",
                    "technical_requirements",
                    "cost_analysis",
                    "timeline_analysis",
                    "risk_assessment",
                    "recommendations",
                    "raw_data",
                    "appendices"
                ],
                "layout": "detailed"
            }
        }
    
    async def generate_report(
        self,
        analysis_id: int,
        report_format: str,
        template_name: str = "kp_analysis_default",
        include_charts: bool = True,
        include_raw_data: bool = False,
        custom_sections: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Генерация отчета по результатам анализа
        
        Args:
            analysis_id: ID анализа
            report_format: Формат отчета (pdf, excel, html, word)
            template_name: Название шаблона
            include_charts: Включать диаграммы
            include_raw_data: Включать сырые данные
            custom_sections: Кастомные секции
            
        Returns:
            Dict с данными отчета
        """
        try:
            logger.info(f"Generating report for analysis {analysis_id}, format: {report_format}")
            
            # Проверка поддерживаемого формата
            if report_format not in self.supported_formats:
                raise ValueError(f"Unsupported format: {report_format}")
            
            # Получение данных анализа
            analysis_data = await self._get_analysis_data(analysis_id)
            
            # Получение шаблона
            template = self._get_template(template_name)
            
            # Подготовка данных для отчета
            report_data = await self._prepare_report_data(
                analysis_data,
                template,
                include_charts,
                include_raw_data,
                custom_sections
            )
            
            return report_data
            
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            raise
    
    async def _get_analysis_data(self, analysis_id: int) -> Dict[str, Any]:
        """Получение данных анализа из базы данных"""
        # TODO: Реализовать получение данных из базы данных
        # Заглушка для демонстрации
        return {
            "analysis_id": analysis_id,
            "document_info": {
                "filename": "commercial_proposal.pdf",
                "uploaded_at": datetime.utcnow().isoformat(),
                "file_size": 1024000,
                "pages": 15
            },
            "analysis_results": {
                "executive_summary": "Коммерческое предложение содержит детальное описание услуг...",
                "key_findings": [
                    "Конкурентные цены на основные услуги",
                    "Сроки выполнения соответствуют стандартам",
                    "Требуется уточнение технических спецификаций"
                ],
                "technical_requirements": {
                    "compliance_score": 85,
                    "missing_requirements": [
                        "Детальный план работ",
                        "Гарантийные обязательства"
                    ]
                },
                "cost_analysis": {
                    "total_cost": 2500000,
                    "cost_breakdown": {
                        "materials": 1000000,
                        "labor": 1200000,
                        "overhead": 300000
                    },
                    "competitiveness": "средняя"
                },
                "timeline_analysis": {
                    "proposed_duration": 180,
                    "critical_path": [
                        "Подготовительные работы",
                        "Основные строительные работы",
                        "Отделочные работы"
                    ]
                },
                "risk_assessment": {
                    "overall_risk": "средний",
                    "risk_factors": [
                        "Зависимость от поставщиков",
                        "Погодные условия",
                        "Возможные изменения в требованиях"
                    ]
                },
                "recommendations": [
                    "Запросить детализацию по отдельным позициям",
                    "Уточнить гарантийные обязательства",
                    "Обсудить возможность оптимизации сроков"
                ]
            },
            "ai_metadata": {
                "model_used": "gpt-4",
                "provider": "openai",
                "confidence_score": 0.92,
                "processing_time": 45.2,
                "tokens_used": 3500
            }
        }
    
    def _get_template(self, template_name: str) -> Dict[str, Any]:
        """Получение шаблона отчета"""
        if template_name not in self.report_templates:
            logger.warning(f"Template {template_name} not found, using default")
            template_name = "kp_analysis_default"
        
        return self.report_templates[template_name]
    
    async def _prepare_report_data(
        self,
        analysis_data: Dict[str, Any],
        template: Dict[str, Any],
        include_charts: bool,
        include_raw_data: bool,
        custom_sections: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Подготовка данных для отчета согласно шаблону"""
        
        # Определение секций для включения
        sections = custom_sections or template.get("sections", [])
        
        report_data = {
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "analysis_id": analysis_data["analysis_id"],
                "template_name": template["name"],
                "include_charts": include_charts,
                "include_raw_data": include_raw_data
            },
            "sections": {}
        }
        
        # Генерация секций
        for section in sections:
            if section == "executive_summary":
                report_data["sections"]["executive_summary"] = {
                    "title": "Резюме анализа",
                    "content": analysis_data["analysis_results"]["executive_summary"],
                    "key_findings": analysis_data["analysis_results"]["key_findings"]
                }
            
            elif section == "document_info":
                report_data["sections"]["document_info"] = {
                    "title": "Информация о документе",
                    "content": analysis_data["document_info"]
                }
            
            elif section == "analysis_results":
                report_data["sections"]["analysis_results"] = {
                    "title": "Результаты анализа",
                    "technical_requirements": analysis_data["analysis_results"]["technical_requirements"],
                    "cost_analysis": analysis_data["analysis_results"]["cost_analysis"],
                    "timeline_analysis": analysis_data["analysis_results"]["timeline_analysis"]
                }
            
            elif section == "recommendations":
                report_data["sections"]["recommendations"] = {
                    "title": "Рекомендации",
                    "content": analysis_data["analysis_results"]["recommendations"]
                }
            
            elif section == "raw_data" and include_raw_data:
                report_data["sections"]["raw_data"] = {
                    "title": "Сырые данные",
                    "content": analysis_data
                }
        
        # Добавление данных для диаграмм
        if include_charts:
            report_data["charts"] = await self._prepare_chart_data(analysis_data)
        
        return report_data
    
    async def _prepare_chart_data(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Подготовка данных для диаграмм"""
        charts = {}
        
        # Диаграмма распределения затрат
        if "cost_analysis" in analysis_data["analysis_results"]:
            cost_data = analysis_data["analysis_results"]["cost_analysis"]["cost_breakdown"]
            charts["cost_distribution"] = {
                "type": "pie",
                "title": "Распределение затрат",
                "data": cost_data
            }
        
        # Диаграмма соответствия требованиям
        if "technical_requirements" in analysis_data["analysis_results"]:
            compliance_score = analysis_data["analysis_results"]["technical_requirements"]["compliance_score"]
            charts["compliance_score"] = {
                "type": "gauge",
                "title": "Соответствие требованиям",
                "value": compliance_score,
                "max_value": 100
            }
        
        return charts
    
    async def list_templates(self) -> List[Dict[str, Any]]:
        """Получение списка доступных шаблонов"""
        return [
            {
                "name": name,
                "display_name": template["name"],
                "sections": template["sections"],
                "layout": template["layout"]
            }
            for name, template in self.report_templates.items()
        ]
    
    async def create_custom_template(
        self,
        name: str,
        display_name: str,
        sections: List[str],
        layout: str = "standard"
    ) -> str:
        """Создание кастомного шаблона"""
        template_id = f"custom_{name}"
        
        self.report_templates[template_id] = {
            "name": display_name,
            "sections": sections,
            "layout": layout,
            "custom": True
        }
        
        logger.info(f"Created custom template: {template_id}")
        return template_id