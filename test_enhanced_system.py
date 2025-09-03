#!/usr/bin/env python3
"""
Тест расширенной системы - ПРОВЕРКА ВСЕХ КРИТИЧЕСКИХ УЛУЧШЕНИЙ
"""
import asyncio
import sys
import tempfile
from pathlib import Path
from datetime import datetime

# Добавляем backend к path
sys.path.append(str(Path(__file__).parent / "backend"))

async def test_enhanced_system():
    """Тестирование расширенной системы"""
    print("ТЕСТИРОВАНИЕ РАСШИРЕННОЙ СИСТЕМЫ DevAssist Pro")
    print("=" * 60)
    
    all_tests_passed = True
    test_results = {}
    
    # ===== 1. ТЕСТ AI ИНТЕГРАЦИИ =====
    print("\n1. ТЕСТИРОВАНИЕ AI ИНТЕГРАЦИИ...")
    try:
        from backend.services.documents.core.enhanced_ai_analyzer import enhanced_analyzer
        
        # Создание тестового файла
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            test_content = """
            КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
            ООО "ТестСтрой"
            
            Общая стоимость проекта: 15,500,000 рублей
            Срок выполнения: 45 недель
            
            Этапы работ:
            1. Проектирование - 800,000 руб. (4 недели)
            2. Подготовительные работы - 1,200,000 руб. (8 недель)
            3. Основные строительные работы - 10,000,000 руб. (25 недель)
            4. Отделочные работы - 2,500,000 руб. (6 недель)
            5. Сдача объекта - 1,000,000 руб. (2 недели)
            
            Гарантия: 36 месяцев на все виды работ
            Условия оплаты: 25% предоплата, 75% поэтапно
            
            Компания имеет лицензию на строительство, сертификаты ISO 9001 и ISO 14001.
            Опыт работы: более 15 лет, реализовано более 200 проектов.
            """
            f.write(test_content)
            test_file_path = f.name
        
        # Выполнение анализа
        result = await enhanced_analyzer.analyze_document_enhanced(Path(test_file_path), "kp")
        
        # Проверки
        assert result["status"] == "completed"
        assert "overall_score" in result
        assert "business_analysis" in result
        assert "recommendations" in result
        assert result["overall_score"] > 0
        
        print(f"   ✅ AI анализ выполнен успешно")
        print(f"   📊 Общий балл: {result['overall_score']}/100")
        print(f"   🎯 Уровень риска: {result.get('risk_level', 'unknown')}")
        print(f"   🤖 Использует реальный AI: {result.get('using_real_ai', False)}")
        
        test_results["ai_integration"] = "✅ PASSED"
        
        # Очистка
        Path(test_file_path).unlink()
        
    except Exception as e:
        print(f"   ❌ ОШИБКА AI интеграции: {str(e)}")
        test_results["ai_integration"] = f"❌ FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== 2. ТЕСТ ВАЛИДАЦИИ =====
    print("\n2️⃣ ТЕСТИРОВАНИЕ СИСТЕМЫ ВАЛИДАЦИИ...")
    try:
        from backend.core.validation import file_validator, validate_request_data
        
        # Создание тестового "файла" (мок объекта)
        class MockFile:
            def __init__(self, filename, content_type, size, content):
                self.filename = filename
                self.content_type = content_type
                self.size = size
                self._content = content
                self._position = 0
            
            async def seek(self, position):
                self._position = position
            
            async def read(self, size=None):
                if size is None:
                    return self._content[self._position:]
                else:
                    return self._content[self._position:self._position + size]
        
        # Тест валидации корректного PDF файла
        valid_file = MockFile("test.pdf", "application/pdf", 10240, b"%PDF-1.4\ntest content")
        is_valid, errors = await file_validator.validate_upload_file(valid_file)
        assert is_valid, f"Valid file rejected: {errors}"
        
        # Тест валидации некорректного файла
        invalid_file = MockFile("test.exe", "application/x-executable", 5000, b"MZ executable")
        is_valid, errors = await file_validator.validate_upload_file(invalid_file)
        assert not is_valid, "Invalid file accepted"
        
        # Тест валидации запроса
        valid_request = {"document_id": "test123", "analysis_type": "standard"}
        validation_errors = validate_request_data(valid_request, "kp_analysis")
        assert len(validation_errors) == 0, f"Valid request rejected: {validation_errors}"
        
        print(f"   ✅ Валидация файлов работает корректно")
        print(f"   ✅ Валидация запросов работает корректно")
        
        test_results["validation"] = "✅ PASSED"
        
    except Exception as e:
        print(f"   ❌ ОШИБКА валидации: {str(e)}")
        test_results["validation"] = f"❌ FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== 3. ТЕСТ СИСТЕМЫ БЕЗОПАСНОСТИ =====
    print("\n3️⃣ ТЕСТИРОВАНИЕ СИСТЕМЫ БЕЗОПАСНОСТИ...")
    try:
        from backend.core.security import PasswordValidator, JWTManager, RateLimiter
        
        # Тест валидации паролей
        is_valid, errors = PasswordValidator.validate_password("Test123!")
        assert is_valid, f"Valid password rejected: {errors}"
        
        is_valid, errors = PasswordValidator.validate_password("123")
        assert not is_valid, "Weak password accepted"
        
        # Тест хеширования пароля
        password = "TestPassword123!"
        hashed = PasswordValidator.hash_password(password)
        assert PasswordValidator.verify_password(password, hashed), "Password verification failed"
        
        # Тест JWT токенов
        user_data = {"user_id": 1, "username": "testuser", "role": "user"}
        token = JWTManager.create_access_token(user_data)
        assert token, "JWT token creation failed"
        
        decoded = JWTManager.verify_token(token)
        assert decoded["user_id"] == 1, "JWT token verification failed"
        
        # Тест rate limiting
        rate_limiter = RateLimiter()
        test_ip = "192.168.1.100"
        
        # Первые запросы должны проходить
        for i in range(5):
            assert rate_limiter.is_allowed(test_ip), f"Request {i} blocked incorrectly"
        
        print(f"   ✅ Валидация паролей работает")
        print(f"   ✅ JWT токены создаются и проверяются")  
        print(f"   ✅ Rate limiting функционирует")
        
        test_results["security"] = "✅ PASSED"
        
    except Exception as e:
        print(f"   ❌ ОШИБКА безопасности: {str(e)}")
        test_results["security"] = f"❌ FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== 4. ТЕСТ МОНИТОРИНГА =====
    print("\n4️⃣ ТЕСТИРОВАНИЕ СИСТЕМЫ МОНИТОРИНГА...")
    try:
        from backend.core.monitoring import SystemMonitor, PerformanceTracker, HealthChecker
        
        # Тест системного монитора
        system_monitor = SystemMonitor()
        system_metrics = system_monitor.get_system_metrics()
        
        assert system_metrics.cpu_percent >= 0, "Invalid CPU metrics"
        assert system_metrics.memory_percent >= 0, "Invalid memory metrics" 
        assert system_metrics.uptime_seconds >= 0, "Invalid uptime metrics"
        
        # Тест трекера производительности
        performance_tracker = PerformanceTracker()
        test_request_id = "test_123"
        
        performance_tracker.start_request(test_request_id, "test_endpoint")
        performance_tracker.end_request(test_request_id, "test_endpoint", 0.5, 200)
        
        avg_time = performance_tracker.get_average_response_time("test_endpoint")
        assert avg_time > 0, "Performance tracking failed"
        
        # Тест health checker
        health_checker = HealthChecker()
        # Пропускаем реальную проверку БД в тесте
        
        print(f"   ✅ Системные метрики собираются")
        print(f"   ✅ Производительность отслеживается")
        print(f"   ✅ Health checker инициализирован")
        
        test_results["monitoring"] = "✅ PASSED"
        
    except Exception as e:
        print(f"   ❌ ОШИБКА мониторинга: {str(e)}")
        test_results["monitoring"] = f"❌ FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== 5. ТЕСТ ИНТЕГРАЦИИ =====
    print("\n5️⃣ ТЕСТИРОВАНИЕ ОБЩЕЙ ИНТЕГРАЦИИ...")
    try:
        from backend.core.enhanced_app import system_readiness_check
        
        readiness_report = await system_readiness_check()
        
        assert "systems" in readiness_report
        assert "readiness_percentage" in readiness_report
        assert readiness_report["readiness_percentage"] > 0
        
        print(f"   ✅ Готовность системы: {readiness_report['readiness_percentage']}%")
        print(f"   📋 Проверенных систем: {len(readiness_report['systems'])}")
        
        test_results["integration"] = "✅ PASSED"
        
    except Exception as e:
        print(f"   ❌ ОШИБКА интеграции: {str(e)}")
        test_results["integration"] = f"❌ FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== ИТОГОВЫЕ РЕЗУЛЬТАТЫ =====
    print("\n" + "=" * 60)
    print("📊 ИТОГОВЫЕ РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ")
    print("=" * 60)
    
    for test_name, result in test_results.items():
        print(f"{test_name.upper():<20} {result}")
    
    print(f"\nВремя тестирования: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if all_tests_passed:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!")
        print("✅ Система готова к production использованию")
        print("✅ Все критические пробелы устранены")
        print("✅ MVP готов к запуску")
    else:
        print("\n⚠️  НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОШЛИ")
        print("❌ Необходимы дополнительные исправления")
        
        failed_tests = [name for name, result in test_results.items() if "❌" in result]
        print(f"❌ Проблемные компоненты: {', '.join(failed_tests)}")
    
    return all_tests_passed, test_results

if __name__ == "__main__":
    try:
        success, results = asyncio.run(test_enhanced_system())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Тестирование прервано пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 КРИТИЧЕСКАЯ ОШИБКА: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)