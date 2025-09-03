#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for ProfessionalKPPDFGenerator fix
"""

import sys
import os
import asyncio
import logging
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append('/mnt/f/DevAssitPro/DevAssist-Pro/backend')

# Import the generator
from services.reports.core.professional_kp_pdf_generator import ProfessionalKPPDFGenerator

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_professional_pdf_generator():
    """Test the professional PDF generator with the new method"""
    
    try:
        logger.info("🎯 Testing ProfessionalKPPDFGenerator with generate_professional_report method")
        
        # Create the generator
        generator = ProfessionalKPPDFGenerator()
        
        # Test data similar to what the backend sends
        test_data = {
            "id": "test_analysis_001",
            "company_name": "Тестовая IT Компания ООО",
            "tz_name": "Разработка веб-портала",
            "kp_name": "Коммерческое предложение № 2024-TEST",
            "overall_score": 85,
            "confidence_level": 92,
            "analysis_duration": 45,
            "model_used": "claude-3-5-sonnet-20241022",
            "analysis_version": "2.0",
            "created_at": datetime.now().isoformat(),
            
            "pricing": "Фиксированная стоимость: 2,500,000 рублей (без НДС)",
            "timeline": "Срок реализации: 4 месяца",
            "tech_stack": "React 18, FastAPI, PostgreSQL, Docker",
            
            "primary_currency": {
                "code": "RUB",
                "symbol": "₽",
                "name": "Российский рубль",
                "detected": True
            },
            
            "budget_compliance": {
                "score": 88,
                "description": "Предложенная стоимость соответствует бюджету проекта.",
                "key_findings": ["Цена в рамках бюджета", "Хорошая детализация расходов"],
                "recommendations": ["Уточнить дополнительные опции"]
            },
            
            "technical_compliance": {
                "score": 82,
                "description": "Техническое решение соответствует требованиям с небольшими замечаниями.",
                "key_findings": ["Современные технологии", "Хорошая архитектура"],
                "recommendations": ["Усилить меры безопасности"]
            },
            
            "team_expertise": {
                "score": 90,
                "description": "Команда демонстрирует высокую квалификацию.",
                "key_findings": ["Опытные специалисты", "Релевантный опыт"],
                "recommendations": ["Провести техническое интервью"]
            },
            
            "final_recommendation": "accept",
            "executive_summary": "Предложение рекомендуется к принятию с небольшими доработками.",
            
            "key_strengths": [
                "Высокая экспертиза команды",
                "Соответствие бюджету",
                "Современный технологический стек"
            ],
            
            "critical_concerns": [
                "Недостаточная детализация безопасности",
                "Отсутствие плана интеграций"
            ],
            
            "next_steps": [
                "Провести техническое интервью",
                "Уточнить детали безопасности",
                "Подготовить договор"
            ]
        }
        
        # Test the new generate_professional_report method
        logger.info("📄 Calling generate_professional_report method...")
        result = await generator.generate_professional_report(test_data)
        
        # Check the result
        if result["success"]:
            logger.info(f"✅ Professional PDF generated successfully!")
            logger.info(f"📁 File path: {result.get('file_path')}")
            logger.info(f"📄 Filename: {result.get('filename')}")
            logger.info(f"💾 File size: {result.get('file_size', 0):,} bytes")
            logger.info(f"🌐 PDF URL: {result.get('pdf_url')}")
            logger.info(f"ℹ️ Details: {result.get('details')}")
            
            # Verify the file exists
            file_path = result.get('file_path')
            if file_path and os.path.exists(file_path):
                actual_size = os.path.getsize(file_path)
                logger.info(f"✅ File verification successful: {actual_size:,} bytes")
                return True
            else:
                logger.error(f"❌ File not found at: {file_path}")
                return False
                
        else:
            logger.error(f"❌ PDF generation failed: {result.get('error')}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Test failed with exception: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    """Run the test"""
    print("=" * 60)
    print("Testing Professional KP PDF Generator Fix")
    print("=" * 60)
    
    # Run the async test
    success = asyncio.run(test_professional_pdf_generator())
    
    if success:
        print("\n✅ TEST PASSED: Professional PDF generator is working correctly!")
        print("🎯 The generate_professional_report method has been successfully implemented.")
    else:
        print("\n❌ TEST FAILED: There are still issues with the PDF generator.")
        
    print("=" * 60)