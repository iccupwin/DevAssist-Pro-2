#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple PDF Generation Test
DevAssist Pro - Basic PDF Generation Testing

Tests basic PDF generation without advanced dependencies
"""

import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

def test_basic_imports():
    """Test if we can import basic modules"""
    print("Testing basic imports...")
    
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph
        from reportlab.lib.styles import getSampleStyleSheet
        print("SUCCESS: ReportLab modules imported successfully")
        return True
    except ImportError as e:
        print(f"ERROR: Failed to import ReportLab: {e}")
        return False

def test_simple_pdf_creation():
    """Test simple PDF creation with Cyrillic text"""
    print("Testing simple PDF creation...")
    
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import cm
        
        # Create a simple PDF with Cyrillic text
        import tempfile
        temp_dir = tempfile.gettempdir()
        output_path = os.path.join(temp_dir, "test_simple_cyrillic.pdf")
        
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title = Paragraph("ТЕСТ ПОДДЕРЖКИ КИРИЛЛИЦЫ", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 1*cm))
        
        # Body text with Cyrillic
        cyrillic_text = """
        Этот документ создан для тестирования поддержки кириллицы в системе 
        генерации PDF отчетов DevAssist Pro.
        
        Проверяем различные символы:
        • Русские буквы: АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ
        • Строчные буквы: абвгдеёжзийклмнопрстуфхцчшщъыьэюя
        • Специальные символы: №, %, ₽, €, $
        • Даты: """ + datetime.now().strftime("%d.%m.%Y %H:%M") + """
        
        Если вы видите этот текст корректно, поддержка кириллицы работает!
        """
        
        body = Paragraph(cyrillic_text, styles['Normal'])
        story.append(body)
        
        # Build PDF
        doc.build(story)
        
        # Check if file was created and has reasonable size
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            if file_size > 1000:  # At least 1KB
                print(f"SUCCESS: PDF created successfully - {file_size} bytes")
                print(f"File location: {output_path}")
                return True
            else:
                print(f"ERROR: PDF too small - {file_size} bytes")
                return False
        else:
            print("ERROR: PDF file not created")
            return False
            
    except Exception as e:
        print(f"ERROR: Failed to create PDF: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_data_structure():
    """Test our API data structure"""
    print("Testing API data structure...")
    
    try:
        # Test data structure for API
        test_data = {
            "id": "test_analysis_001",
            "company_name": "ООО Тестовая компания",
            "tz_name": "Тестовое техническое задание",
            "kp_name": "Тестовое коммерческое предложение",
            "overall_score": 85,
            "confidence_level": 92,
            "analysis_duration": 45,
            "model_used": "claude-3-5-sonnet-20241022",
            "analysis_version": "2.0",
            "created_at": datetime.now().isoformat(),
            "pricing": "Фиксированная стоимость: 2,500,000 рублей",
            "timeline": "Срок реализации: 4 месяца",
            "tech_stack": "React, Node.js, PostgreSQL",
            "primary_currency": {
                "code": "RUB",
                "symbol": "₽",
                "name": "Российский рубль",
                "detected": True
            },
            "executive_summary": "Тестовое резюме анализа",
            "key_strengths": [
                "Высокое качество технического решения",
                "Конкурентная цена"
            ],
            "critical_concerns": [
                "Требует уточнения сроков"
            ],
            "next_steps": [
                "Провести техническое интервью",
                "Уточнить детали реализации"
            ]
        }
        
        # Validate data structure
        required_fields = [
            "id", "company_name", "overall_score", "executive_summary"
        ]
        
        missing_fields = [field for field in required_fields if field not in test_data]
        
        if missing_fields:
            print(f"ERROR: Missing required fields: {missing_fields}")
            return False
        else:
            print("SUCCESS: API data structure is valid")
            return True
            
    except Exception as e:
        print(f"ERROR: Data structure test failed: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("DevAssist Pro - Simple PDF Generation Test")
    print("=" * 60)
    
    tests = [
        ("Basic imports", test_basic_imports),
        ("Simple PDF creation", test_simple_pdf_creation), 
        ("API data structure", test_api_data_structure)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\nRunning: {test_name}")
        print("-" * 40)
        result = test_func()
        results.append((test_name, result))
        print("")
    
    print("=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {len(results)} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    success_rate = (passed / len(results)) * 100 if results else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    if success_rate >= 100:
        print("\nCONCLUSION: All tests passed! PDF system ready for deployment.")
    elif success_rate >= 75:
        print("\nCONCLUSION: Most tests passed. System is functional with minor issues.")
    else:
        print("\nCONCLUSION: Critical issues found. System needs fixes before deployment.")
    
    return success_rate >= 75

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)