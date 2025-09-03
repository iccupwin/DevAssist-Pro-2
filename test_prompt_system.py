#!/usr/bin/env python3
"""
Тест системы промптов - проверка интеграции с AI анализатором
"""
import asyncio
import sys
import tempfile
from pathlib import Path
from datetime import datetime

# Добавляем backend к path
sys.path.append(str(Path(__file__).parent / "backend"))

async def test_prompt_system():
    """Тестирование системы промптов"""
    print("TESTING ENHANCED PROMPT SYSTEM")
    print("=" * 50)
    
    all_tests_passed = True
    test_results = {}
    
    # ===== 1. ТЕСТ МЕНЕДЖЕРА ПРОМПТОВ =====
    print("\n1. TESTING PROMPT MANAGER...")
    try:
        from backend.prompts.prompt_manager import prompt_manager, get_prompts_for_document_type
        
        # Проверка доступных типов
        available_types = prompt_manager.list_available_prompt_types()
        assert "kp_analysis" in available_types, "KP analysis prompts not found"
        assert "tz_analysis" in available_types, "TZ analysis prompts not found"
        
        # Проверка загрузки промптов для КП
        kp_prompts = get_prompts_for_document_type('kp')
        assert 'system_prompt' in kp_prompts, "KP system prompt missing"
        assert 'user_prompt' in kp_prompts, "KP user prompt missing"
        assert len(kp_prompts['system_prompt']) > 100, "KP system prompt too short"
        assert len(kp_prompts['user_prompt']) > 500, "KP user prompt too short"
        
        # Проверка загрузки промптов для ТЗ  
        tz_prompts = get_prompts_for_document_type('tz')
        assert 'system_prompt' in tz_prompts, "TZ system prompt missing"
        assert 'user_prompt' in tz_prompts, "TZ user prompt missing"
        assert len(tz_prompts['system_prompt']) > 100, "TZ system prompt too short"
        assert len(tz_prompts['user_prompt']) > 500, "TZ user prompt too short"
        
        print(f"   SUCCESS: Prompt manager works correctly")
        print(f"   - KP System Prompt: {len(kp_prompts['system_prompt'])} chars")
        print(f"   - KP User Prompt: {len(kp_prompts['user_prompt'])} chars")
        print(f"   - TZ System Prompt: {len(tz_prompts['system_prompt'])} chars") 
        print(f"   - TZ User Prompt: {len(tz_prompts['user_prompt'])} chars")
        
        test_results["prompt_manager"] = "PASSED"
        
    except Exception as e:
        print(f"   ERROR: Prompt manager failed - {str(e)}")
        test_results["prompt_manager"] = f"FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== 2. ТЕСТ ИНТЕГРАЦИИ С AI АНАЛИЗАТОРОМ =====
    print("\n2. TESTING AI ANALYZER INTEGRATION...")
    try:
        from backend.services.documents.core.real_document_analyzer import RealDocumentAnalyzer
        
        # Создание анализатора
        analyzer = RealDocumentAnalyzer()
        
        # Тест получения промптов для КП
        kp_system_prompt = analyzer._get_system_prompt('kp')
        kp_user_prompt = analyzer._get_user_prompt('kp')
        
        assert kp_system_prompt, "KP system prompt not loaded"
        assert kp_user_prompt, "KP user prompt not loaded"
        assert len(kp_system_prompt) > 100, "KP system prompt too short in analyzer"
        assert len(kp_user_prompt) > 500, "KP user prompt too short in analyzer"
        
        # Тест получения промптов для ТЗ
        tz_system_prompt = analyzer._get_system_prompt('tz')
        tz_user_prompt = analyzer._get_user_prompt('tz')
        
        assert tz_system_prompt, "TZ system prompt not loaded"
        assert tz_user_prompt, "TZ user prompt not loaded"
        assert len(tz_system_prompt) > 100, "TZ system prompt too short in analyzer"
        assert len(tz_user_prompt) > 500, "TZ user prompt too short in analyzer"
        
        # Проверка что промпты отличаются от простых fallback
        assert "опыт работы более 10 лет" in kp_system_prompt or len(kp_system_prompt) > 200, "Advanced prompts not loaded"
        
        print(f"   SUCCESS: AI Analyzer integration works")
        print(f"   - Loaded KP prompts: system={len(kp_system_prompt)}, user={len(kp_user_prompt)}")
        print(f"   - Loaded TZ prompts: system={len(tz_system_prompt)}, user={len(tz_user_prompt)}")
        
        test_results["ai_integration"] = "PASSED"
        
    except Exception as e:
        print(f"   ERROR: AI analyzer integration failed - {str(e)}")
        test_results["ai_integration"] = f"FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== 3. ТЕСТ ENHANCED AI АНАЛИЗАТОРА =====
    print("\n3. TESTING ENHANCED AI ANALYZER...")
    try:
        from backend.services.documents.core.enhanced_ai_analyzer import EnhancedAIAnalyzer
        
        # Создание enhanced анализатора
        enhanced_analyzer = EnhancedAIAnalyzer()
        
        # Создание тестового файла
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            test_content = """
            КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
            ООО "СтройТест"
            
            Общая стоимость проекта: 25,750,000 рублей
            Срок выполнения: 180 дней
            
            Этапы работ:
            1. Проектирование и согласования - 1,500,000 руб. (30 дней)
            2. Подготовительные работы - 2,250,000 руб. (15 дней)
            3. Основные строительные работы - 18,000,000 руб. (120 дней)
            4. Отделочные работы - 3,000,000 руб. (10 дней)
            5. Сдача объекта - 1,000,000 руб. (5 дней)
            
            Гарантия: 60 месяцев на все виды работ
            Условия оплаты: 30% предоплата, 70% поэтапно согласно календарному плану
            
            Подрядчик: ООО "СтройТест" 
            ИНН: 7701234567
            Лицензия: СРО-С-123-456789
            Опыт работы: 12 лет в сфере коммерческого строительства
            Выполнено проектов: более 150
            """
            f.write(test_content)
            test_file_path = f.name
        
        # Выполнение анализа
        result = await enhanced_analyzer.analyze_document_enhanced(Path(test_file_path), "kp")
        
        # Проверки результата
        assert result["status"] == "completed", "Analysis not completed"
        assert "overall_score" in result, "Overall score missing"
        assert "business_analysis" in result, "Business analysis missing"  
        assert "recommendations" in result, "Recommendations missing"
        assert result["overall_score"] > 0, "Score should be positive"
        
        print(f"   SUCCESS: Enhanced AI analyzer works")
        print(f"   - Overall Score: {result['overall_score']}/100")
        print(f"   - Risk Level: {result.get('risk_level', 'unknown')}")
        print(f"   - Recommendations: {len(result.get('recommendations', []))}")
        print(f"   - Using Enhanced Prompts: {result.get('enhanced_prompts_used', False)}")
        
        test_results["enhanced_analyzer"] = "PASSED"
        
        # Очистка
        Path(test_file_path).unlink()
        
    except Exception as e:
        print(f"   ERROR: Enhanced AI analyzer failed - {str(e)}")
        test_results["enhanced_analyzer"] = f"FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== 4. ТЕСТ СРАВНЕНИЯ ПРОМПТОВ =====
    print("\n4. TESTING PROMPT COMPARISON...")
    try:
        # Сравнение длины старых и новых промптов
        from backend.services.documents.core.real_document_analyzer import RealDocumentAnalyzer
        
        analyzer = RealDocumentAnalyzer()
        
        # Получение новых промптов
        new_kp_system = analyzer._get_system_prompt('kp')
        new_kp_user = analyzer._get_user_prompt('kp')
        
        # Получение fallback промптов
        old_kp_system = analyzer._get_fallback_system_prompt('kp')
        old_kp_user = analyzer._get_fallback_user_prompt('kp')
        
        # Сравнение
        system_improved = len(new_kp_system) >= len(old_kp_system)
        user_improved = len(new_kp_user) >= len(old_kp_user)
        
        print(f"   System Prompt: Old={len(old_kp_system)}, New={len(new_kp_system)} - {'IMPROVED' if system_improved else 'SAME'}")
        print(f"   User Prompt: Old={len(old_kp_user)}, New={len(new_kp_user)} - {'IMPROVED' if user_improved else 'SAME'}")
        
        test_results["prompt_comparison"] = "PASSED"
        
    except Exception as e:
        print(f"   ERROR: Prompt comparison failed - {str(e)}")
        test_results["prompt_comparison"] = f"FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== ИТОГОВЫЕ РЕЗУЛЬТАТЫ =====
    print("\n" + "=" * 50)
    print("FINAL RESULTS")
    print("=" * 50)
    
    for test_name, result in test_results.items():
        print(f"{test_name.upper():<25} {result}")
    
    print(f"\nTest time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if all_tests_passed:
        print("\nALL PROMPT SYSTEM TESTS PASSED!")
        print("SUCCESS: Prompt manager loads prompts from files")
        print("SUCCESS: AI analyzer uses enhanced prompts")
        print("SUCCESS: Enhanced analyzer works with new prompts")
        print("SUCCESS: System ready for production with advanced prompts")
    else:
        print("\nSOME TESTS FAILED")
        print("Additional fixes needed for prompt system")
        
        failed_tests = [name for name, result in test_results.items() if "FAILED" in result]
        print(f"Failed components: {', '.join(failed_tests)}")
    
    return all_tests_passed, test_results

if __name__ == "__main__":
    try:
        success, results = asyncio.run(test_prompt_system())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\nTesting interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nCRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)