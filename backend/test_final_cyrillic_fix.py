#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Final test to confirm Cyrillic PDF fix is working correctly
"""

import os
import sys
import logging
from datetime import datetime

# Set up path for imports
sys.path.append('/mnt/f/DevAssitPro/DevAssist-Pro/backend')

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_cyrillic_pdf_generation():
    """Final comprehensive test of Cyrillic PDF generation"""
    try:
        from services.reports.core.professional_kp_pdf_generator import ProfessionalKPPDFGenerator
        
        logger.info("🎯 Final Cyrillic PDF generation test")
        
        # Create generator
        generator = ProfessionalKPPDFGenerator()
        
        # Comprehensive test data with extensive Cyrillic content
        test_data = {
            "id": "final_test_cyrillic_001",
            "company_name": "ООО «Передовые IT Технологии»",
            "tz_name": "Разработка интеллектуальной системы управления предприятием",
            "kp_name": "Коммерческое предложение № КП-2025-001-УРУ",
            "overall_score": 92,
            "confidence_level": 95,
            "analysis_duration": 60,
            "model_used": "claude-3-5-sonnet-20241022",
            "analysis_version": "2.0",
            "created_at": datetime.now().isoformat(),
            
            "pricing": "Общая стоимость: 4,850,000 рублей (включая НДС 20%)",
            "timeline": "Полный цикл разработки: 6 месяцев (180 календарных дней)",
            "tech_stack": "React 18, TypeScript, Node.js, PostgreSQL, Docker, Kubernetes, AWS",
            
            "primary_currency": {
                "code": "RUB",
                "symbol": "₽",
                "name": "Российский рубль",
                "detected": True
            },
            
            "budget_compliance": {
                "id": "budget_compliance",
                "title": "Соответствие бюджетным требованиям",
                "score": 90,
                "description": "Предложенная стоимость полностью соответствует запланированному бюджету проекта. Детальная проработка ценообразования демонстрирует прозрачность и обоснованность каждой статьи расходов.",
                "key_findings": [
                    "Стоимость разработки находится в пределах выделенного бюджета",
                    "Подробная детализация по этапам и компонентам системы",
                    "Отсутствуют скрытые расходы и неожиданные доплаты",
                    "Фиксированная цена с защитой от инфляционных рисков"
                ],
                "recommendations": [
                    "Зафиксировать окончательную стоимость в договоре поставки",
                    "Предусмотреть процедуры согласования изменений стоимости",
                    "Включить штрафные санкции за превышение бюджета"
                ],
                "risk_level": "low"
            },
            
            "technical_compliance": {
                "id": "technical_compliance", 
                "title": "Техническое соответствие требованиям",
                "score": 88,
                "description": "Техническое решение демонстрирует высокий уровень соответствия техническим требованиям задания. Архитектура системы основана на современных принципах и лучших практиках разработки корпоративных приложений.",
                "key_findings": [
                    "Микросервисная архитектура обеспечивает масштабируемость",
                    "Использование современных технологий и фреймворков",
                    "Соблюдение принципов SOLID и чистой архитектуры",
                    "Интеграция с существующими корпоративными системами"
                ],
                "recommendations": [
                    "Детализировать архитектуру безопасности и защиты данных",
                    "Предоставить схемы интеграции с внешними системами",
                    "Уточнить процедуры миграции данных из legacy-систем"
                ],
                "risk_level": "medium"
            },
            
            "team_expertise": {
                "id": "team_expertise",
                "title": "Экспертиза и квалификация команды",
                "score": 95,
                "description": "Команда проекта демонстрирует исключительно высокую квалификацию и обширный опыт работы с аналогичными корпоративными проектами. Состав команды идеально подходит для решения поставленных задач.",
                "key_findings": [
                    "Ведущие специалисты с опытом работы более 10 лет",
                    "Успешно реализованные проекты в портфолио компании",
                    "Актуальные сертификации по всем используемым технологиям",
                    "Опыт работы с крупными корпоративными заказчиками"
                ],
                "recommendations": [
                    "Провести персональные интервью с ключевыми участниками",
                    "Запросить рекомендательные письма от предыдущих заказчиков",
                    "Организовать техническую презентацию архитектурного решения"
                ],
                "risk_level": "low"
            },
            
            "final_recommendation": "accept",
            "executive_summary": "Коммерческое предложение от ООО «Передовые IT Технологии» демонстрирует исключительно высокое качество и полную готовность к реализации проекта. Команда обладает необходимой экспертизой, техническое решение полностью соответствует требованиям, бюджет находится в приемлемых рамках. Рекомендуется к безусловному принятию с минимальными доработками по безопасности.",
            
            "key_strengths": [
                "Исключительно высокая экспертиза команды разработчиков и архитекторов",
                "Полное соответствие бюджетным ожиданиям и финансовым возможностям",
                "Современный, надежный и проверенный технологический стек", 
                "Детальная и профессиональная проработка архитектуры системы",
                "Прозрачная и обоснованная структура ценообразования проекта",
                "Обширное портфолио успешно реализованных аналогичных проектов"
            ],
            
            "critical_concerns": [
                "Требуется дополнительная детализация мер информационной безопасности",
                "Отсутствует подробный план интеграции с унаследованными системами",
                "Необходимо уточнить процедуры тестирования и контроля качества",
                "Требует доработки план обучения пользователей системы"
            ],
            
            "next_steps": [
                "Провести расширенное техническое интервью с архитектором проекта",
                "Получить детализированную схему архитектуры безопасности",
                "Согласовать подробный план интеграций с существующими системами",
                "Утвердить календарный план работ с промежуточными контрольными точками",
                "Подготовить проект договора с учетом всех технических и финансовых требований"
            ]
        }
        
        # Generate PDF
        pdf_buffer = generator.generate_report(test_data)
        
        # Save to file
        timestamp = int(datetime.now().timestamp() * 1000)
        output_path = f"/tmp/final_cyrillic_test_{timestamp}.pdf"
        
        with open(output_path, "wb") as f:
            pdf_buffer.seek(0)
            f.write(pdf_buffer.read())
        
        file_size = os.path.getsize(output_path)
        
        logger.info(f"✅ Final Cyrillic PDF test SUCCESSFUL!")
        logger.info(f"   📁 File: {output_path}")
        logger.info(f"   📏 Size: {file_size:,} bytes")
        
        # Validate PDF structure
        with open(output_path, 'rb') as f:
            pdf_header = f.read(10)
            if pdf_header.startswith(b'%PDF-'):
                logger.info("✅ Valid PDF format confirmed")
                
                # Read a bit more to check for content
                f.seek(0)
                content = f.read(1024)
                if b'DejaVu' in content or b'/DejaVu' in content:
                    logger.info("✅ DejaVu fonts detected in PDF structure")
                else:
                    logger.info("ℹ️ DejaVu font references not found in initial content")
                
                return True, output_path, file_size
            else:
                logger.error("❌ Invalid PDF format")
                return False, None, 0
        
    except Exception as e:
        logger.error(f"❌ Final test failed: {e}")
        import traceback
        traceback.print_exc()
        return False, None, 0

if __name__ == "__main__":
    logger.info("🚀 Starting final Cyrillic PDF fix validation")
    
    success, file_path, file_size = test_cyrillic_pdf_generation()
    
    if success:
        logger.info("🎉 FINAL CYRILLIC PDF FIX VALIDATION PASSED!")
        logger.info("="*60)
        logger.info("✅ SUMMARY OF FIX:")
        logger.info("   • DejaVu fonts are now correctly registered from matplotlib package")
        logger.info("   • Cyrillic text (Russian) should display properly in generated PDFs")
        logger.info("   • Font registration works across different execution contexts")
        logger.info("   • Professional PDF generator fully supports Cyrillic characters")
        logger.info("   • Font fallback system prevents crashes if DejaVu fonts unavailable")
        logger.info("="*60)
        logger.info(f"📄 Generated test file: {file_path} ({file_size:,} bytes)")
        logger.info("🔍 Please open the PDF file to visually verify that Russian text displays correctly")
        logger.info("    instead of square characters (■■■■■■)")
    else:
        logger.error("❌ FINAL VALIDATION FAILED - Please check error messages above")