#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Cyrillic PDF generation with fixed font registration
"""

import os
import sys
import logging
from datetime import datetime

# Set up path for imports
sys.path.append('/mnt/f/DevAssitPro/DevAssist-Pro/backend')
sys.path.append('/mnt/f/DevAssitPro/DevAssist-Pro/backend/services/reports/core')

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test Cyrillic text
CYRILLIC_TEXT = "Анализ коммерческих предложений"
CYRILLIC_COMPANY = "ООО «Инновационные IT Решения»"
CYRILLIC_PROJECT = "Разработка корпоративного веб-портала"

def test_font_registration():
    """Test font registration directly"""
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.lib.fonts import addMapping
        
        logger.info("🧪 Testing font registration...")
        
        # Try to find DejaVu fonts (use actual found path from find command)
        project_root = '/mnt/f/DevAssitPro/DevAssist-Pro'
        font_paths = [
            os.path.join(project_root, 'env/Lib/site-packages/matplotlib/mpl-data/fonts/ttf'),
            '../env/Lib/site-packages/matplotlib/mpl-data/fonts/ttf',
            './env/Lib/site-packages/matplotlib/mpl-data/fonts/ttf'
        ]
        
        for base_path in font_paths:
            regular_path = os.path.join(base_path, 'DejaVuSans.ttf')
            bold_path = os.path.join(base_path, 'DejaVuSans-Bold.ttf')
            
            if os.path.exists(regular_path) and os.path.exists(bold_path):
                logger.info(f"✅ Found fonts in: {base_path}")
                logger.info(f"   Regular: {regular_path}")
                logger.info(f"   Bold: {bold_path}")
                
                # Register fonts
                pdfmetrics.registerFont(TTFont('DejaVuSans', regular_path))
                pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', bold_path))
                
                # Add font family mapping
                addMapping('DejaVuSans', 0, 0, 'DejaVuSans')  # Regular
                addMapping('DejaVuSans', 1, 0, 'DejaVuSans-Bold')  # Bold
                
                logger.info("✅ Fonts registered successfully")
                return True
        
        logger.error("❌ No DejaVu fonts found")
        return False
        
    except Exception as e:
        logger.error(f"❌ Font registration error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_simple_cyrillic_pdf():
    """Test simple Cyrillic PDF creation"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER
        from reportlab.lib.colors import HexColor
        import io
        
        logger.info("📄 Testing simple Cyrillic PDF creation...")
        
        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        
        # Create styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CyrillicTitle',
            parent=styles['Title'],
            fontName='DejaVuSans',
            fontSize=18,
            alignment=TA_CENTER,
            textColor=HexColor('#2E86AB')
        )
        
        body_style = ParagraphStyle(
            'CyrillicBody',
            parent=styles['Normal'],
            fontName='DejaVuSans',
            fontSize=12
        )
        
        # Create content
        story = []
        story.append(Paragraph(CYRILLIC_TEXT, title_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph(f"<b>Компания:</b> {CYRILLIC_COMPANY}", body_style))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>Проект:</b> {CYRILLIC_PROJECT}", body_style))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>Дата:</b> {datetime.now().strftime('%d.%m.%Y %H:%M')}", body_style))
        
        # Build PDF
        doc.build(story)
        
        # Save to file
        output_path = "/tmp/test_cyrillic_simple.pdf"
        with open(output_path, "wb") as f:
            buffer.seek(0)
            f.write(buffer.read())
        
        file_size = os.path.getsize(output_path)
        logger.info(f"✅ Simple Cyrillic PDF created: {output_path} ({file_size:,} bytes)")
        return output_path
        
    except Exception as e:
        logger.error(f"❌ Simple PDF creation error: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_professional_generator():
    """Test the professional PDF generator with Cyrillic"""
    try:
        from services.reports.core.professional_kp_pdf_generator import ProfessionalKPPDFGenerator
        
        logger.info("🎯 Testing professional PDF generator...")
        
        # Create generator
        generator = ProfessionalKPPDFGenerator()
        
        # Create test data with Cyrillic
        test_data = {
            "id": "test_cyrillic_001",
            "company_name": CYRILLIC_COMPANY,
            "tz_name": CYRILLIC_PROJECT,
            "overall_score": 85,
            "confidence_level": 92,
            "model_used": "claude-3-5-sonnet-20241022",
            "pricing": "3,200,000 рублей (без НДС)",
            "timeline": "5 месяцев",
            "tech_stack": "React 18, Node.js, PostgreSQL",
            "budget_compliance": {
                "score": 88,
                "description": "Предложенная стоимость соответствует запланированному бюджету проекта.",
                "key_findings": ["Стоимость в рамках бюджета", "Детализация корректная"],
                "recommendations": ["Зафиксировать цену в договоре"]
            },
            "key_strengths": [
                "Высокая экспертиза команды разработчиков",
                "Соответствие бюджетным ожиданиям", 
                "Современный технологический стек"
            ],
            "critical_concerns": [
                "Недостаточная детализация мер безопасности"
            ],
            "next_steps": [
                "Провести техническое интервью с командой",
                "Согласовать план интеграций"
            ]
        }
        
        # Generate PDF
        result = generator.generate_report(test_data)
        
        # Save to file
        output_path = "/tmp/test_professional_cyrillic.pdf"
        with open(output_path, "wb") as f:
            result.seek(0)
            f.write(result.read())
        
        file_size = os.path.getsize(output_path)
        logger.info(f"✅ Professional Cyrillic PDF created: {output_path} ({file_size:,} bytes)")
        return output_path
        
    except Exception as e:
        logger.error(f"❌ Professional PDF generation error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    logger.info("🚀 Starting Cyrillic PDF fix test")
    
    # Test 1: Font registration
    fonts_ok = test_font_registration()
    
    if fonts_ok:
        # Test 2: Simple PDF
        simple_pdf = test_simple_cyrillic_pdf()
        
        # Test 3: Professional PDF
        professional_pdf = test_professional_generator()
        
        if simple_pdf and professional_pdf:
            logger.info("🎉 All tests passed! Cyrillic support should be working.")
        else:
            logger.error("❌ Some tests failed. Check logs above.")
    else:
        logger.error("❌ Font registration failed. Cannot proceed with PDF tests.")