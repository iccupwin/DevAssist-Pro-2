"""
Интеграционные тесты для КП Анализатора
Тестирование полного цикла: загрузка → анализ → отчет
"""
import pytest
import asyncio
import httpx
import json
import time
from pathlib import Path
from typing import Dict, Any

# Базовые URL сервисов
BASE_URL = "http://localhost:8000"
SERVICES = {
    "auth": "http://localhost:8001",
    "llm": "http://localhost:8002", 
    "documents": "http://localhost:8003",
    "analytics": "http://localhost:8004",
    "reports": "http://localhost:8005",
    "dashboard": "http://localhost:8006"
}

class TestKPAnalyzerIntegration:
    """Тесты интеграции КП Анализатора"""
    
    @pytest.fixture(scope="class")
    async def auth_token(self):
        """Получение токена авторизации"""
        async with httpx.AsyncClient() as client:
            # Регистрация или логин тестового пользователя
            login_data = {
                "email": "test@devassist.pro",
                "password": "test_password123"
            }
            
            response = await client.post(
                f"{SERVICES['auth']}/login",
                json=login_data
            )
            
            if response.status_code == 200:
                return response.json()["access_token"]
            else:
                # Попытка регистрации если логин не удался
                register_data = {
                    "email": "test@devassist.pro",
                    "password": "test_password123",
                    "full_name": "Test User"
                }
                
                register_response = await client.post(
                    f"{SERVICES['auth']}/register",
                    json=register_data
                )
                
                if register_response.status_code == 201:
                    # Повторный логин после регистрации
                    login_response = await client.post(
                        f"{SERVICES['auth']}/login",
                        json=login_data
                    )
                    return login_response.json()["access_token"]
                else:
                    pytest.fail("Failed to authenticate test user")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Заголовки авторизации"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture
    def sample_kp_document(self):
        """Образец документа КП для тестирования"""
        return {
            "filename": "test_commercial_proposal.txt",
            "content": """
            КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
            
            Компания: ООО "СтройТехСервис"
            Проект: Строительство жилого комплекса "Солнечный"
            
            ОПИСАНИЕ РАБОТ:
            1. Подготовительные работы - 500,000 руб.
            2. Фундаментные работы - 2,000,000 руб.
            3. Возведение стен - 3,500,000 руб.
            4. Кровельные работы - 1,200,000 руб.
            5. Отделочные работы - 2,800,000 руб.
            
            ОБЩАЯ СТОИМОСТЬ: 10,000,000 руб.
            
            СРОКИ ВЫПОЛНЕНИЯ:
            - Подготовительные работы: 2 недели
            - Фундаментные работы: 6 недель
            - Возведение стен: 12 недель
            - Кровельные работы: 4 недели
            - Отделочные работы: 8 недель
            
            Общий срок: 32 недели
            
            ГАРАНТИИ:
            - Фундамент: 10 лет
            - Конструкции: 5 лет
            - Отделка: 2 года
            
            УСЛОВИЯ ОПЛАТЫ:
            - Аванс: 30%
            - Поэтапная оплата: 60%
            - Окончательный расчет: 10%
            """,
            "document_type": "kp"
        }
    
    async def test_service_health_checks(self):
        """Тест доступности всех сервисов"""
        async with httpx.AsyncClient() as client:
            for service_name, url in SERVICES.items():
                try:
                    response = await client.get(f"{url}/health", timeout=5.0)
                    assert response.status_code == 200, f"Service {service_name} is not healthy"
                    
                    health_data = response.json()
                    assert health_data["status"] == "healthy", f"Service {service_name} reports unhealthy status"
                    
                except httpx.TimeoutException:
                    pytest.fail(f"Service {service_name} health check timed out")
                except Exception as e:
                    pytest.fail(f"Service {service_name} health check failed: {str(e)}")
    
    async def test_document_upload_and_processing(self, auth_headers, sample_kp_document):
        """Тест загрузки и обработки документа"""
        async with httpx.AsyncClient() as client:
            # Имитация загрузки файла
            files = {
                "file": (
                    sample_kp_document["filename"],
                    sample_kp_document["content"].encode("utf-8"),
                    "text/plain"
                )
            }
            
            response = await client.post(
                f"{SERVICES['documents']}/upload",
                files=files,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            upload_result = response.json()
            
            assert "document_id" in upload_result
            assert upload_result["filename"] == sample_kp_document["filename"]
            assert upload_result["status"] == "uploaded"
            
            document_id = upload_result["document_id"]
            
            # Ожидание обработки документа
            await asyncio.sleep(2)
            
            # Проверка статуса обработки
            processing_response = await client.get(
                f"{SERVICES['documents']}/{document_id}/content",
                headers=auth_headers
            )
            
            assert processing_response.status_code == 200
            content_result = processing_response.json()
            
            assert content_result["document_id"] == document_id
            assert "content" in content_result
            assert len(content_result["content"]) > 0
            
            return document_id
    
    async def test_kp_analysis_workflow(self, auth_headers, sample_kp_document):
        """Тест полного цикла анализа КП"""
        async with httpx.AsyncClient() as client:
            # 1. Загрузка документа
            document_id = await self.test_document_upload_and_processing(
                auth_headers, sample_kp_document
            )
            
            # 2. Запуск анализа КП
            analysis_request = {
                "document_id": document_id,
                "analysis_type": "kp_analysis",
                "ai_provider": "openai",
                "model": "gpt-4",
                "analysis_config": {
                    "extract_costs": True,
                    "extract_timeline": True,
                    "extract_requirements": True,
                    "confidence_threshold": 0.7
                }
            }
            
            analysis_response = await client.post(
                f"{SERVICES['llm']}/analyze/kp",
                json=analysis_request,
                headers=auth_headers
            )
            
            assert analysis_response.status_code == 200
            analysis_result = analysis_response.json()
            
            assert "analysis_id" in analysis_result
            assert analysis_result["status"] == "processing"
            
            analysis_id = analysis_result["analysis_id"]
            
            # 3. Ожидание завершения анализа
            max_wait_time = 60  # 60 секунд
            start_time = time.time()
            
            while time.time() - start_time < max_wait_time:
                status_response = await client.get(
                    f"{SERVICES['llm']}/analyze/status/{analysis_id}",
                    headers=auth_headers
                )
                
                assert status_response.status_code == 200
                status_data = status_response.json()
                
                if status_data["status"] == "completed":
                    break
                elif status_data["status"] == "failed":
                    pytest.fail(f"Analysis failed: {status_data.get('error', 'Unknown error')}")
                
                await asyncio.sleep(2)
            else:
                pytest.fail("Analysis timed out")
            
            # 4. Получение результатов анализа
            results_response = await client.get(
                f"{SERVICES['llm']}/analyze/results/{analysis_id}",
                headers=auth_headers
            )
            
            assert results_response.status_code == 200
            results_data = results_response.json()
            
            # Проверка структуры результатов
            assert "analysis_results" in results_data
            assert "confidence_score" in results_data
            assert results_data["confidence_score"] >= 0.7
            
            analysis_results = results_data["analysis_results"]
            assert "cost_analysis" in analysis_results
            assert "timeline_analysis" in analysis_results
            assert "technical_requirements" in analysis_results
            
            return analysis_id, results_data
    
    async def test_report_generation(self, auth_headers, sample_kp_document):
        """Тест генерации отчетов"""
        async with httpx.AsyncClient() as client:
            # Получение ID анализа
            analysis_id, _ = await self.test_kp_analysis_workflow(
                auth_headers, sample_kp_document
            )
            
            # Генерация PDF отчета
            pdf_request = {
                "analysis_id": analysis_id,
                "report_type": "pdf",
                "template_name": "kp_analysis_default",
                "include_charts": True,
                "include_raw_data": False
            }
            
            pdf_response = await client.post(
                f"{SERVICES['reports']}/generate/pdf",
                json=pdf_request,
                headers=auth_headers
            )
            
            assert pdf_response.status_code == 200
            pdf_result = pdf_response.json()
            
            assert pdf_result["report_type"] == "pdf"
            assert pdf_result["status"] == "completed"
            assert "download_url" in pdf_result
            
            # Генерация Excel отчета
            excel_request = {
                "analysis_id": analysis_id,
                "include_charts": True,
                "include_raw_data": True
            }
            
            excel_response = await client.post(
                f"{SERVICES['reports']}/generate/excel",
                json=excel_request,
                headers=auth_headers
            )
            
            assert excel_response.status_code == 200
            excel_result = excel_response.json()
            
            assert excel_result["report_type"] == "excel"
            assert excel_result["status"] == "completed"
            assert "download_url" in excel_result
    
    async def test_analytics_integration(self, auth_headers, sample_kp_document):
        """Тест интеграции с аналитикой"""
        async with httpx.AsyncClient() as client:
            # Выполнение анализа для генерации данных
            analysis_id, _ = await self.test_kp_analysis_workflow(
                auth_headers, sample_kp_document
            )
            
            # Получение аналитики по анализам
            analytics_request = {
                "data_type": "analyses",
                "aggregation_type": "count",
                "date_range": {
                    "start": "2025-01-01T00:00:00Z",
                    "end": "2025-12-31T23:59:59Z"
                }
            }
            
            analytics_response = await client.post(
                f"{SERVICES['analytics']}/analytics/process",
                json=analytics_request,
                headers=auth_headers
            )
            
            assert analytics_response.status_code == 200
            analytics_result = analytics_response.json()
            
            assert analytics_result["data_type"] == "analyses"
            assert "result" in analytics_result
            assert analytics_result["result"]["total_analyses"] >= 1
            
            # Получение метрик
            metrics_request = {
                "metric_types": ["success_rate", "avg_processing_time", "cost_per_analysis"],
                "entity_type": "global",
                "period": "30d"
            }
            
            metrics_response = await client.post(
                f"{SERVICES['analytics']}/metrics/calculate",
                json=metrics_request,
                headers=auth_headers
            )
            
            assert metrics_response.status_code == 200
            metrics_result = metrics_response.json()
            
            assert "success_rate" in metrics_result["result"]
            assert "avg_processing_time" in metrics_result["result"]
            assert "cost_per_analysis" in metrics_result["result"]
    
    async def test_dashboard_statistics(self, auth_headers):
        """Тест получения статистики дашборда"""
        async with httpx.AsyncClient() as client:
            dashboard_response = await client.get(
                f"{SERVICES['analytics']}/statistics/dashboard?period=30d",
                headers=auth_headers
            )
            
            assert dashboard_response.status_code == 200
            dashboard_data = dashboard_response.json()
            
            assert "statistics" in dashboard_data
            assert "period" in dashboard_data
            assert dashboard_data["period"] == "30d"
            
            statistics = dashboard_data["statistics"]
            
            # Проверка основных секций статистики
            expected_sections = [
                "overview", "analysis", "documents", 
                "ai_usage", "performance", "trends"
            ]
            
            for section in expected_sections:
                assert section in statistics, f"Missing section: {section}"
    
    async def test_end_to_end_workflow(self, auth_headers, sample_kp_document):
        """Тест полного end-to-end workflow"""
        async with httpx.AsyncClient() as client:
            # 1. Загрузка документа
            document_id = await self.test_document_upload_and_processing(
                auth_headers, sample_kp_document
            )
            
            # 2. Анализ КП
            analysis_id, analysis_results = await self.test_kp_analysis_workflow(
                auth_headers, sample_kp_document
            )
            
            # 3. Генерация отчета
            await self.test_report_generation(auth_headers, sample_kp_document)
            
            # 4. Получение аналитики
            await self.test_analytics_integration(auth_headers, sample_kp_document)
            
            # 5. Проверка дашборда
            await self.test_dashboard_statistics(auth_headers)
            
            # Финальная проверка - все данные должны быть связаны
            final_check_response = await client.get(
                f"{SERVICES['llm']}/analyze/results/{analysis_id}",
                headers=auth_headers
            )
            
            assert final_check_response.status_code == 200
            final_data = final_check_response.json()
            
            # Проверка качества анализа
            assert final_data["confidence_score"] >= 0.7
            assert "cost_analysis" in final_data["analysis_results"]
            assert "timeline_analysis" in final_data["analysis_results"]
            
            # Проверка извлеченных данных
            cost_analysis = final_data["analysis_results"]["cost_analysis"]
            assert "total_cost" in cost_analysis
            assert cost_analysis["total_cost"] > 0
            
            timeline_analysis = final_data["analysis_results"]["timeline_analysis"]
            assert "proposed_duration" in timeline_analysis
            assert timeline_analysis["proposed_duration"] > 0
    
    async def test_error_handling(self, auth_headers):
        """Тест обработки ошибок"""
        async with httpx.AsyncClient() as client:
            # Тест с несуществующим документом
            invalid_analysis_request = {
                "document_id": "non_existent_id",
                "analysis_type": "kp_analysis",
                "ai_provider": "openai"
            }
            
            error_response = await client.post(
                f"{SERVICES['llm']}/analyze/kp",
                json=invalid_analysis_request,
                headers=auth_headers
            )
            
            assert error_response.status_code == 404
            
            # Тест с неправильными параметрами
            invalid_request = {
                "analysis_id": "invalid_id",
                "report_type": "invalid_type"
            }
            
            report_error_response = await client.post(
                f"{SERVICES['reports']}/generate/pdf",
                json=invalid_request,
                headers=auth_headers
            )
            
            assert report_error_response.status_code in [400, 404, 500]
    
    async def test_performance_benchmarks(self, auth_headers, sample_kp_document):
        """Тест производительности системы"""
        async with httpx.AsyncClient() as client:
            start_time = time.time()
            
            # Выполнение полного цикла
            await self.test_end_to_end_workflow(auth_headers, sample_kp_document)
            
            total_time = time.time() - start_time
            
            # Проверка времени выполнения (должно быть менее 2 минут)
            assert total_time < 120, f"End-to-end workflow took too long: {total_time:.2f}s"
            
            # Проверка отдельных этапов
            # Время анализа не должно превышать 60 секунд
            analysis_start = time.time()
            await self.test_kp_analysis_workflow(auth_headers, sample_kp_document)
            analysis_time = time.time() - analysis_start
            
            assert analysis_time < 60, f"KP analysis took too long: {analysis_time:.2f}s"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])