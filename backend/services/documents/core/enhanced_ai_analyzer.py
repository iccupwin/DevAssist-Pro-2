#!/usr/bin/env python3
"""
Enhanced AI Analyzer - РЕАЛЬНАЯ БИЗНЕС-ЛОГИКА
Анализ КП с scoring, рисками, соответствием требованиям
"""
import asyncio
import logging
import json
import re
import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid

# Добавление пути к модулю prompts
current_dir = Path(__file__).parent.parent.parent.parent
prompts_dir = current_dir / "prompts"
sys.path.append(str(prompts_dir))

from .real_document_analyzer import RealDocumentAnalyzer

# Импорт менеджера промптов
try:
    from prompt_manager import get_prompts_for_document_type, get_ai_settings_for_document_type
    PROMPTS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Prompt manager not available: {e}")
    PROMPTS_AVAILABLE = False

logger = logging.getLogger(__name__)

class EnhancedAIAnalyzer(RealDocumentAnalyzer):
    """Улучшенный AI анализатор с реальной бизнес-логикой"""
    
    def __init__(self, llm_service_url: str = "http://localhost:8002"):
        super().__init__(llm_service_url)
        self.use_real_api = os.getenv("USE_REAL_API", "false").lower() == "true"
        self.fallback_mode = os.getenv("AI_FALLBACK_MODE", "false").lower() == "true"
        
        logger.info(f"Enhanced AI Analyzer initialized: use_real_api={self.use_real_api}, fallback_mode={self.fallback_mode}")
        
    async def extract_kp_summary_data(self, text: str) -> Dict[str, Any]:
        """
        Извлечение ключевых данных из КП с использованием AI (аналог функции из Tender проекта)
        Возвращает словарь с ключами: company_name, tech_stack, pricing, timeline.
        """
        try:
            if self.use_real_api:
                # Используем новый промпт из prompt_manager
                prompt_data = {
                    "kp_content": text
                }
                
                ai_result = await self._call_llm_service(
                    "kp_analyzer", 
                    "extract_kp_summary_data", 
                    prompt_data
                )
                
                # Парсинг JSON ответа с fallback
                if isinstance(ai_result.get("response"), str):
                    import json
                    try:
                        response_text = ai_result["response"].strip()
                        if response_text.startswith("```json"):
                            response_text = response_text[7:-3].strip()
                        elif response_text.startswith("```"):
                            response_text = response_text[3:-3].strip()
                        
                        extracted_data = json.loads(response_text)
                        
                        # Проверяем наличие ключей, добавляем значения по умолчанию
                        default_data = {
                            "company_name": "Не определено",
                            "tech_stack": "Не указано",
                            "pricing": "Не указано",
                            "timeline": "Не указано"
                        }
                        
                        for key in default_data.keys():
                            if key in extracted_data and extracted_data[key]:
                                default_data[key] = str(extracted_data[key])
                        
                        return default_data
                        
                    except json.JSONDecodeError as e:
                        logger.warning(f"Failed to parse AI JSON response: {e}")
                        
                # Fallback к правилам
                return self._extract_kp_data_by_rules(text)
            else:
                return self._extract_kp_data_by_rules(text)
                
        except Exception as e:
            logger.error(f"KP data extraction failed: {e}")
            return {
                "company_name": "Ошибка извлечения",
                "tech_stack": "Ошибка",
                "pricing": "Ошибка", 
                "timeline": "Ошибка"
            }

    def _extract_kp_data_by_rules(self, text: str) -> Dict[str, Any]:
        """Извлечение данных из КП с помощью правил (fallback)"""
        
        # Поиск названия компании
        company_patterns = [
            r'(?:ООО|АО|ЗАО|ОАО|ИП)\s+"?([^".,\n]+)"?',
            r'Исполнитель:\s*([^,.\n]+)',
            r'Подрядчик:\s*([^,.\n]+)',
            r'Компания:\s*([^,.\n]+)'
        ]
        
        company_name = "Не определено"
        for pattern in company_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                company_name = match.group(1).strip()
                break
        
        # Поиск технологий
        tech_keywords = ['Python', 'Java', 'JavaScript', 'React', 'Angular', 'Vue', 'Django', 'Spring', 
                        'Docker', 'Kubernetes', 'AWS', 'Azure', 'PostgreSQL', 'MySQL', 'MongoDB']
        found_tech = []
        for tech in tech_keywords:
            if tech.lower() in text.lower():
                found_tech.append(tech)
        
        tech_stack = ", ".join(found_tech) if found_tech else "Не указано"
        
        # Поиск стоимости
        price_patterns = [
            r'(?:стоимость|цена|сумма)[:\s]*(\d+(?:\s?\d{3})*(?:[.,]\d+)?)\s*(?:руб|₽|рублей)',
            r'(\d+(?:\s?\d{3})*(?:[.,]\d+)?)\s*(?:руб|₽|рублей)'
        ]
        
        pricing = "Не указано"
        for pattern in price_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                price_str = match.group(1).replace(' ', '')
                pricing = f"Фиксированная цена: {price_str} руб."
                break
        
        # Поиск сроков
        timeline_patterns = [
            r'(?:срок|продолжительность)[:\s]*(\d+)\s*(?:дней|недель|месяцев)',
            r'(\d+)\s*(?:рабочих\s+)?(?:дней|недель|месяцев)'
        ]
        
        timeline = "Не указано"
        for pattern in timeline_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                duration = match.group(1)
                unit = "дней" if "дней" in match.group(0).lower() else \
                       "недель" if "недель" in match.group(0).lower() else "месяцев"
                timeline = f"{duration} {unit}"
                break
        
        return {
            "company_name": company_name,
            "tech_stack": tech_stack,
            "pricing": pricing,
            "timeline": timeline
        }

    async def analyze_document_enhanced(self, document_path, document_type: str = "kp") -> Dict[str, Any]:
        """
        Расширенный анализ документа с бизнес-логикой
        """
        try:
            analysis_id = str(uuid.uuid4())
            logger.info(f"Starting enhanced analysis {analysis_id} for {document_path}")
            
            # 1. Базовое извлечение текста
            extracted_text = await self.text_extractor.extract_text_async(document_path)
            if not extracted_text or len(extracted_text.strip()) < 10:
                raise ValueError("Extracted text is empty or too short")
            
            # 2. Предварительный анализ текста (быстрый)
            quick_analysis = self._analyze_text_structure(extracted_text)
            
            # 3. AI анализ (ТОЛЬКО реальный API)
            if self.use_real_api:
                ai_result = await self._perform_ai_analysis(extracted_text, document_type, analysis_id)
            else:
                logger.error("Real AI API disabled but required for analysis")
                raise ValueError("Real AI analysis is required. Set USE_REAL_API=true in environment.")
            
            # 4. Бизнес-анализ и scoring
            business_analysis = self._perform_business_analysis(ai_result, quick_analysis, document_type)
            
            # 5. Генерация рекомендаций
            recommendations = self._generate_recommendations(business_analysis, document_type)
            
            # 6. Формирование итогового результата
            result = {
                "analysis_id": analysis_id,
                "document_info": self.text_extractor.get_document_info(document_path),
                "extracted_text": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
                "full_text_length": len(extracted_text),
                "quick_analysis": quick_analysis,
                "ai_analysis": ai_result,
                "business_analysis": business_analysis,
                "recommendations": recommendations,
                "overall_score": business_analysis.get("overall_score", 0),
                "risk_level": business_analysis.get("risk_level", "medium"),
                "analyzed_at": datetime.now().isoformat(),
                "status": "completed",
                "using_real_ai": self.use_real_api
            }
            
            logger.info(f"Enhanced analysis {analysis_id} completed with score {business_analysis.get('overall_score', 0)}")
            return result
            
        except Exception as e:
            logger.error(f"Enhanced analysis failed: {str(e)}")
            return self._create_error_result(analysis_id if 'analysis_id' in locals() else str(uuid.uuid4()), str(e))
    
    def _analyze_text_structure(self, text: str) -> Dict[str, Any]:
        """Быстрый структурный анализ текста без AI"""
        
        # Поиск ключевых паттернов
        cost_patterns = [
            r'(\d+(?:\s?\d{3})*(?:[.,]\d+)?)\s*(?:руб|₽|rub)',
            r'стоимость[:\s]*(\d+(?:\s?\d{3})*(?:[.,]\d+)?)',
            r'сумма[:\s]*(\d+(?:\s?\d{3})*(?:[.,]\d+)?)',
            r'цена[:\s]*(\d+(?:\s?\d{3})*(?:[.,]\d+)?)'
        ]
        
        timeline_patterns = [
            r'(\d+)\s*(?:дней|дня|недель|недели|месяцев|месяца)',
            r'срок[:\s]*(\d+)',
            r'выполнение[:\s]*(\d+)'
        ]
        
        # Извлечение стоимостей
        costs = []
        for pattern in cost_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                cost_str = match.group(1).replace(' ', '').replace(',', '.')
                try:
                    costs.append(float(cost_str))
                except ValueError:
                    continue
        
        # Извлечение сроков
        timelines = []
        for pattern in timeline_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    timelines.append(int(match.group(1)))
                except ValueError:
                    continue
        
        # Поиск ключевых слов
        quality_keywords = ['гарантия', 'качество', 'сертификат', 'лицензия', 'опыт']
        risk_keywords = ['предоплата', 'аванс', 'без гарантии', 'субподряд']
        
        quality_score = sum(1 for keyword in quality_keywords if keyword in text.lower())
        risk_score = sum(1 for keyword in risk_keywords if keyword in text.lower())
        
        return {
            "estimated_costs": costs,
            "max_cost": max(costs) if costs else 0,
            "min_cost": min(costs) if costs else 0,
            "average_cost": sum(costs) / len(costs) if costs else 0,
            "timeline_days": timelines,
            "max_timeline": max(timelines) if timelines else 0,
            "quality_indicators": quality_score,
            "risk_indicators": risk_score,
            "text_length": len(text),
            "word_count": len(text.split()),
            "contains_tables": 'таблица' in text.lower() or '|' in text,
            "contains_attachments": 'приложение' in text.lower() or 'чертеж' in text.lower()
        }
    
    def _create_enhanced_fallback_analysis(self, text: str, document_type: str, quick_analysis: Dict) -> Dict[str, Any]:
        """Создание улучшенного fallback анализа на основе правил"""
        
        if document_type == "kp":
            # Анализ КП
            total_cost = quick_analysis.get("max_cost", 0)
            timeline = quick_analysis.get("max_timeline", 0)
            
            # Определение типа проекта по стоимости
            if total_cost > 50000000:  # > 50 млн
                project_type = "Крупный проект"
                complexity = "high"
            elif total_cost > 10000000:  # > 10 млн  
                project_type = "Средний проект"
                complexity = "medium"
            else:
                project_type = "Малый проект"
                complexity = "low"
            
            # Генерация структурированных данных
            structured_data = {
                "total_cost": total_cost,
                "currency": "руб.",
                "timeline": f"{timeline} дней" if timeline > 0 else "Не указано",
                "project_type": project_type,
                "complexity": complexity,
                "cost_breakdown": self._generate_cost_breakdown(total_cost),
                "contractor_details": {
                    "name": "Определяется из документа",
                    "experience": f"{quick_analysis.get('quality_indicators', 0)} показателей качества"
                },
                "payment_terms": "30% предоплата" if 'предоплата' in text.lower() else "По факту",
                "warranty": "24 месяца" if 'гарантия' in text.lower() else "Не указана"
            }
            
        else:
            # Анализ ТЗ
            structured_data = {
                "project_scope": "Техническое задание",
                "requirements_count": quick_analysis.get("word_count", 0) // 100,
                "technical_complexity": "medium",
                "estimated_timeline": f"{timeline} дней" if timeline > 0 else "Требует уточнения"
            }
        
        return {
            "structured_data": structured_data,
            "raw_response": f"Документ проанализирован системой правил. Найдено {len(quick_analysis.get('estimated_costs', []))} стоимостных показателей.",
            "model_used": "rule_based_analyzer_v1.0",
            "analysis_quality": "high" if quick_analysis.get("quality_indicators", 0) > 2 else "medium",
            "confidence_score": min(85 + quick_analysis.get("quality_indicators", 0) * 3, 95),
            "processing_time": 0.5,  # Быстрый анализ
            "fallback": True,
            "rule_based": True
        }
    
    def _generate_cost_breakdown(self, total_cost: float) -> List[Dict]:
        """Генерация примерной разбивки стоимости"""
        if total_cost <= 0:
            return []
        
        # Типовая разбивка для строительных проектов
        breakdown = [
            {"item": "Подготовительные работы", "percentage": 10},
            {"item": "Материалы и комплектующие", "percentage": 40},
            {"item": "Строительно-монтажные работы", "percentage": 35},
            {"item": "Пуско-наладочные работы", "percentage": 10},
            {"item": "Прочие расходы", "percentage": 5}
        ]
        
        result = []
        for item in breakdown:
            cost = total_cost * item["percentage"] / 100
            result.append({
                "item": item["item"],
                "cost": round(cost, 2),
                "percentage": item["percentage"]
            })
        
        return result
    
    def _perform_business_analysis(self, ai_result: Dict, quick_analysis: Dict, document_type: str) -> Dict[str, Any]:
        """Выполнение бизнес-анализа с системой 10 критериев из Tender проекта"""
        
        # Извлечение данных из AI результата
        structured_data = ai_result.get("structured_data", {})
        total_cost = structured_data.get("total_cost", quick_analysis.get("max_cost", 0))
        
        # Система 10 критериев с весовыми коэффициентами из Tender проекта
        criteria_weights = {
            "technical_compliance": 30,      # Техническое соответствие (30%)
            "functional_completeness": 30,   # Функциональная полнота (30%)
            "cost_effectiveness": 20,        # Экономическая эффективность (20%)
            "timeline_realism": 10,          # Реалистичность сроков (10%)
            "vendor_reliability": 10,        # Надежность поставщика (10%)
            # Дополнительные критерии (расширенная оценка)
            "solution_quality": 0,           # Качество предлагаемого решения
            "innovation_approach": 0,        # Инновационность подхода
            "risk_management": 0,            # Управление рисками
            "support_maintenance": 0,        # Сопровождение и поддержка
            "flexibility_adaptability": 0    # Гибкость и адаптивность
        }
        
        # Расчет оценок по каждому критерию (0-100)
        criteria_scores = {}
        timeline = quick_analysis.get("max_timeline", 0)
        
        # 1. Техническое соответствие (30% веса)
        tech_score = 70  # Базовая оценка
        if quick_analysis.get("contains_tables", False):
            tech_score += 10  # Есть технические таблицы
        if quick_analysis.get("contains_attachments", False):
            tech_score += 10  # Есть чертежи/схемы
        if 'стандарт' in str(structured_data).lower() or 'ГОСТ' in str(structured_data):
            tech_score += 10  # Соответствие стандартам
        criteria_scores["technical_compliance"] = min(tech_score, 100)
        
        # 2. Функциональная полнота (30% веса)
        func_score = 65  # Базовая оценка
        if quick_analysis.get("word_count", 0) > 1000:
            func_score += 15  # Детальное описание
        if len(quick_analysis.get("estimated_costs", [])) > 1:
            func_score += 10  # Детальная разбивка работ
        if structured_data.get("cost_breakdown"):
            func_score += 10  # Структурированные работы
        criteria_scores["functional_completeness"] = min(func_score, 100)
        
        # 3. Экономическая эффективность (20% веса)
        cost_score = 50  # Базовая оценка
        if total_cost > 0:
            competitiveness = self._assess_competitiveness(total_cost)
            if competitiveness == "competitive":
                cost_score += 30  # Конкурентная цена
            elif competitiveness == "market_rate":
                cost_score += 20  # Рыночная цена
            elif competitiveness == "premium":
                cost_score += 10  # Премиум цена
            
            if len(quick_analysis.get("estimated_costs", [])) > 1:
                cost_score += 20  # Прозрачная структура цен
        criteria_scores["cost_effectiveness"] = min(cost_score, 100)
        
        # 4. Реалистичность сроков (10% веса)
        time_score = 50  # Базовая оценка
        if timeline > 0:
            # Проверка реалистичности (примерно 1 млн = 1 неделя)
            expected_timeline = max(total_cost / 1000000 * 7, 30) if total_cost > 0 else 60
            if abs(timeline - expected_timeline) / expected_timeline <= 0.3:
                time_score += 40  # Очень реалистично
            elif abs(timeline - expected_timeline) / expected_timeline <= 0.5:
                time_score += 25  # Реалистично
            else:
                time_score += 10  # Сомнительно
        criteria_scores["timeline_realism"] = min(time_score, 100)
        
        # 5. Надежность поставщика (10% веса)
        vendor_score = min(quick_analysis.get("quality_indicators", 0) * 20, 100)
        if vendor_score < 40:  # Минимальная оценка
            vendor_score = 40
        criteria_scores["vendor_reliability"] = vendor_score
        
        # Дополнительные критерии (для будущего расширения)
        criteria_scores["solution_quality"] = 75
        criteria_scores["innovation_approach"] = 70 
        criteria_scores["risk_management"] = max(80 - quick_analysis.get("risk_indicators", 0) * 20, 20)
        criteria_scores["support_maintenance"] = 65
        criteria_scores["flexibility_adaptability"] = 70
        
        # Расчет взвешенного общего скора (используем только основные 5 критериев)
        weighted_score = 0
        main_criteria = ["technical_compliance", "functional_completeness", "cost_effectiveness", 
                        "timeline_realism", "vendor_reliability"]
        
        for criterion in main_criteria:
            weight = criteria_weights[criterion] / 100  # Преобразуем проценты в коэффициенты
            score = criteria_scores[criterion]
            weighted_score += score * weight
        
        overall_score = int(weighted_score)
        
        # Определение уровня риска
        if overall_score >= 80:
            risk_level = "low"
            risk_description = "Низкий риск - рекомендуется к рассмотрению"
        elif overall_score >= 60:
            risk_level = "medium" 
            risk_description = "Средний риск - требует дополнительной проверки"
        else:
            risk_level = "high"
            risk_description = "Высокий риск - не рекомендуется без серьезной доработки"
        
        # Выявление конкретных проблем на основе новых критериев
        issues = []
        if criteria_scores["technical_compliance"] < 70:
            issues.append("Недостаточное техническое соответствие требованиям ТЗ")
        if criteria_scores["functional_completeness"] < 70:
            issues.append("Неполное покрытие функциональных требований")
        if criteria_scores["cost_effectiveness"] < 60:
            issues.append("Неконкурентоспособная или завышенная стоимость")
        if criteria_scores["timeline_realism"] < 60:
            issues.append("Нереалистичные или отсутствующие сроки выполнения")
        if criteria_scores["vendor_reliability"] < 50:
            issues.append("Недостаточно подтвержденная надежность поставщика")
        if criteria_scores["risk_management"] < 60:
            issues.append("Высокие проектные риски, недостаточно проработанное управление рисками")
        
        return {
            "overall_score": overall_score,
            "max_score": 100,
            "criteria_scores": criteria_scores,
            "criteria_weights": criteria_weights,
            "weighted_score_calculation": {
                criterion: {
                    "score": criteria_scores[criterion],
                    "weight": criteria_weights[criterion],
                    "weighted_value": criteria_scores[criterion] * criteria_weights[criterion] / 100
                } for criterion in main_criteria
            },
            "risk_level": risk_level,
            "risk_description": risk_description,
            "identified_issues": issues,
            "cost_analysis": {
                "total_cost": total_cost,
                "cost_per_day": round(total_cost / max(timeline, 1), 2) if timeline > 0 else 0,
                "competitiveness": self._assess_competitiveness(total_cost),
                "cost_breakdown": structured_data.get("cost_breakdown", [])
            },
            "timeline_analysis": {
                "proposed_timeline": timeline,
                "timeline_unit": "days",
                "realism_assessment": "realistic" if criteria_scores["timeline_realism"] >= 70 else "questionable"
            },
            "quality_metrics": {
                "technical_compliance": criteria_scores["technical_compliance"],
                "functional_completeness": criteria_scores["functional_completeness"],
                "contractor_indicators": quick_analysis.get("quality_indicators", 0),
                "risk_indicators": quick_analysis.get("risk_indicators", 0)
            },
            # Добавляем детальную информацию о критериях для интерфейса
            "criteria_details": {
                "technical_compliance": {
                    "name": "Техническое соответствие",
                    "description": "Насколько предложенное решение соответствует техническим требованиям ТЗ?",
                    "weight": 30,
                    "score": criteria_scores["technical_compliance"]
                },
                "functional_completeness": {
                    "name": "Функциональная полнота", 
                    "description": "Насколько полно реализованы требуемые функции?",
                    "weight": 30,
                    "score": criteria_scores["functional_completeness"]
                },
                "cost_effectiveness": {
                    "name": "Экономическая эффективность",
                    "description": "Насколько адекватна цена предложения рынку и бюджету?",
                    "weight": 20,
                    "score": criteria_scores["cost_effectiveness"]
                },
                "timeline_realism": {
                    "name": "Реалистичность сроков",
                    "description": "Насколько реалистичны предложенные сроки выполнения работ?",
                    "weight": 10,
                    "score": criteria_scores["timeline_realism"]
                },
                "vendor_reliability": {
                    "name": "Надежность поставщика",
                    "description": "Опыт, репутация и ресурсы поставщика.",
                    "weight": 10,
                    "score": criteria_scores["vendor_reliability"]
                }
            }
        }
    
    def _assess_competitiveness(self, cost: float) -> str:
        """Оценка конкурентоспособности стоимости"""
        if cost <= 0:
            return "unknown"
        elif cost < 5000000:  # < 5 млн
            return "competitive"
        elif cost < 20000000:  # < 20 млн
            return "market_rate"
        else:
            return "premium"
    
    def _generate_recommendations(self, business_analysis: Dict, document_type: str) -> List[Dict[str, str]]:
        """Генерация рекомендаций на основе анализа"""
        
        recommendations = []
        score = business_analysis.get("overall_score", 0)
        issues = business_analysis.get("identified_issues", [])
        
        # Общие рекомендации по score
        if score >= 80:
            recommendations.append({
                "type": "positive",
                "title": "Качественное предложение",
                "description": "КП соответствует высоким стандартам и рекомендуется к принятию"
            })
        elif score >= 60:
            recommendations.append({
                "type": "warning", 
                "title": "Требует доработки",
                "description": "КП имеет потенциал, но необходимы уточнения по выявленным вопросам"
            })
        else:
            recommendations.append({
                "type": "danger",
                "title": "Высокие риски",
                "description": "КП требует серьезной доработки или отклонения"
            })
        
        # Специфичные рекомендации по проблемам
        for issue in issues:
            if "стоимости" in issue:
                recommendations.append({
                    "type": "action",
                    "title": "Запросить детальную смету",
                    "description": "Необходимо получить подробную разбивку стоимости по этапам работ"
                })
            elif "сроки" in issue:
                recommendations.append({
                    "type": "action", 
                    "title": "Уточнить календарный план",
                    "description": "Запросить реалистичный график выполнения работ с обоснованием"
                })
            elif "документация" in issue:
                recommendations.append({
                    "type": "action",
                    "title": "Дополнить пакет документов", 
                    "description": "Запросить недостающие технические документы и чертежи"
                })
            elif "подрядчика" in issue:
                recommendations.append({
                    "type": "action",
                    "title": "Проверить квалификацию",
                    "description": "Запросить портфолио, лицензии и рекомендации подрядчика"
                })
        
        # Рекомендации по конкурентоспособности
        competitiveness = business_analysis.get("cost_analysis", {}).get("competitiveness", "unknown")
        if competitiveness == "premium":
            recommendations.append({
                "type": "warning",
                "title": "Высокая стоимость",
                "description": "Цена выше рыночных значений. Рекомендуется запросить обоснование или альтернативные варианты"
            })
        elif competitiveness == "competitive":
            recommendations.append({
                "type": "positive", 
                "title": "Конкурентная цена",
                "description": "Стоимость соответствует рыночным значениям"
            })
        
        return recommendations
    
    def _create_error_result(self, analysis_id: str, error_message: str) -> Dict[str, Any]:
        """Создание результата с ошибкой"""
        return {
            "analysis_id": analysis_id,
            "status": "failed",
            "error": error_message,
            "overall_score": 0,
            "risk_level": "unknown",
            "analyzed_at": datetime.now().isoformat(),
            "using_real_ai": self.use_real_api
        }

# Глобальный экземпляр для использования
enhanced_analyzer = EnhancedAIAnalyzer()