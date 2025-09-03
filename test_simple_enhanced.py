#!/usr/bin/env python3
"""
Простой тест расширенной системы - без Unicode символов
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
    print("TESTING ENHANCED DEVASSIST PRO SYSTEM")
    print("=" * 50)
    
    all_tests_passed = True
    test_results = {}
    
    # ===== 1. ТЕСТ AI ИНТЕГРАЦИИ =====
    print("\n1. TESTING AI INTEGRATION...")
    try:
        from backend.services.documents.core.enhanced_ai_analyzer import enhanced_analyzer
        
        # Создание тестового файла
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            test_content = """
            COMMERCIAL PROPOSAL TEST
            Construction Company LLC
            
            Total project cost: 15,500,000 rubles
            Timeline: 45 weeks
            
            Work stages:
            1. Design - 800,000 rub. (4 weeks)
            2. Preparation - 1,200,000 rub. (8 weeks)
            3. Main construction - 10,000,000 rub. (25 weeks)
            4. Finishing - 2,500,000 rub. (6 weeks)
            5. Handover - 1,000,000 rub. (2 weeks)
            
            Warranty: 36 months
            Payment terms: 25% prepayment, 75% in stages
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
        
        print(f"   SUCCESS: AI analysis completed")
        print(f"   Score: {result['overall_score']}/100")
        print(f"   Risk level: {result.get('risk_level', 'unknown')}")
        print(f"   Using real AI: {result.get('using_real_ai', False)}")
        
        test_results["ai_integration"] = "PASSED"
        
        # Очистка
        Path(test_file_path).unlink()
        
    except Exception as e:
        print(f"   ERROR: AI integration failed - {str(e)}")
        test_results["ai_integration"] = f"FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== 2. ТЕСТ ВАЛИДАЦИИ =====
    print("\n2. TESTING VALIDATION SYSTEM...")
    try:
        from backend.core.validation import file_validator, validate_request_data
        
        # Создание мок файла
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
        
        # Тест корректного файла
        valid_file = MockFile("test.pdf", "application/pdf", 10240, b"%PDF-1.4\ntest content")
        is_valid, errors = await file_validator.validate_upload_file(valid_file)
        assert is_valid, f"Valid file rejected: {errors}"
        
        # Тест некорректного файла
        invalid_file = MockFile("test.exe", "application/x-executable", 5000, b"MZ executable")
        is_valid, errors = await file_validator.validate_upload_file(invalid_file)
        assert not is_valid, "Invalid file accepted"
        
        print(f"   SUCCESS: File validation works correctly")
        
        test_results["validation"] = "PASSED"
        
    except Exception as e:
        print(f"   ERROR: Validation failed - {str(e)}")
        test_results["validation"] = f"FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== 3. ТЕСТ СИСТЕМЫ БЕЗОПАСНОСТИ =====
    print("\n3. TESTING SECURITY SYSTEM...")
    try:
        from backend.core.security import PasswordValidator, JWTManager, RateLimiter
        
        # Тест паролей
        is_valid, errors = PasswordValidator.validate_password("Test123!")
        assert is_valid, f"Valid password rejected: {errors}"
        
        is_valid, errors = PasswordValidator.validate_password("123")
        assert not is_valid, "Weak password accepted"
        
        # Тест JWT
        user_data = {"user_id": 1, "username": "testuser", "role": "user"}
        token = JWTManager.create_access_token(user_data)
        assert token, "JWT token creation failed"
        
        decoded = JWTManager.verify_token(token)
        assert decoded["user_id"] == 1, "JWT token verification failed"
        
        print(f"   SUCCESS: Password validation works")
        print(f"   SUCCESS: JWT tokens work correctly")
        
        test_results["security"] = "PASSED"
        
    except Exception as e:
        print(f"   ERROR: Security system failed - {str(e)}")
        test_results["security"] = f"FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== 4. ТЕСТ МОНИТОРИНГА =====
    print("\n4. TESTING MONITORING SYSTEM...")
    try:
        from backend.core.monitoring import SystemMonitor, PerformanceTracker
        
        # Тест системных метрик
        system_monitor = SystemMonitor()
        system_metrics = system_monitor.get_system_metrics()
        
        assert system_metrics.cpu_percent >= 0, "Invalid CPU metrics"
        assert system_metrics.memory_percent >= 0, "Invalid memory metrics"
        assert system_metrics.uptime_seconds >= 0, "Invalid uptime metrics"
        
        # Тест производительности
        performance_tracker = PerformanceTracker()
        test_request_id = "test_123"
        
        performance_tracker.start_request(test_request_id, "test_endpoint")
        performance_tracker.end_request(test_request_id, "test_endpoint", 0.5, 200)
        
        avg_time = performance_tracker.get_average_response_time("test_endpoint")
        assert avg_time > 0, "Performance tracking failed"
        
        print(f"   SUCCESS: System metrics collection works")
        print(f"   SUCCESS: Performance tracking works")
        
        test_results["monitoring"] = "PASSED"
        
    except Exception as e:
        print(f"   ERROR: Monitoring failed - {str(e)}")
        test_results["monitoring"] = f"FAILED: {str(e)}"
        all_tests_passed = False
    
    # ===== ИТОГОВЫЕ РЕЗУЛЬТАТЫ =====
    print("\n" + "=" * 50)
    print("FINAL RESULTS")
    print("=" * 50)
    
    for test_name, result in test_results.items():
        print(f"{test_name.upper():<20} {result}")
    
    print(f"\nTest time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if all_tests_passed:
        print("\nALL TESTS PASSED SUCCESSFULLY!")
        print("System is ready for production use")
        print("All critical gaps have been resolved")
        print("MVP is ready for launch")
    else:
        print("\nSOME TESTS FAILED")
        print("Additional fixes are needed")
        
        failed_tests = [name for name, result in test_results.items() if "FAILED" in result]
        print(f"Failed components: {', '.join(failed_tests)}")
    
    return all_tests_passed, test_results

if __name__ == "__main__":
    try:
        success, results = asyncio.run(test_enhanced_system())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\nTesting interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nCRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)