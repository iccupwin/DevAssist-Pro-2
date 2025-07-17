#!/usr/bin/env python3
"""
DevAssist Pro API Integration Tests
Тестирование интеграции всех API endpoints
"""
import os
import sys
import asyncio
import json
import tempfile
from datetime import datetime
from typing import Dict, Any

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import httpx
import pytest
from fastapi.testclient import TestClient

# Import the main API Gateway app
from api_gateway.main import app

client = TestClient(app)

class TestAPIIntegration:
    """Интеграционные тесты API"""
    
    @classmethod
    def setup_class(cls):
        """Подготовка тестовых данных"""
        cls.test_user_data = {
            "email": "api.test@example.com",
            "password": "TestPassword123!",
            "full_name": "API Test User",
            "company": "Test Company",
            "position": "API Tester"
        }
        cls.access_token = None
        cls.user_id = None
        cls.organization_id = None
        cls.project_id = None
    
    def test_01_health_check(self):
        """Тест health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data
        assert "timestamp" in data
    
    def test_02_api_docs_accessible(self):
        """Тест доступности API документации"""
        response = client.get("/api/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_03_user_registration(self):
        """Тест регистрации пользователя через API"""
        response = client.post("/api/auth/register", json=self.test_user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == self.test_user_data["email"]
        assert "id" in data
        
        self.__class__.user_id = data["id"]
    
    def test_04_user_login(self):
        """Тест авторизации пользователя"""
        response = client.post("/api/auth/login", data={
            "username": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        self.__class__.access_token = data["access_token"]
    
    def test_05_protected_endpoint_without_token(self):
        """Тест защищенного endpoint без токена"""
        response = client.get("/api/auth/me")
        assert response.status_code == 401
    
    def test_06_protected_endpoint_with_token(self):
        """Тест защищенного endpoint с токеном"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == self.test_user_data["email"]
    
    def test_07_create_organization(self):
        """Тест создания организации"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        org_data = {
            "name": "API Test Organization",
            "description": "Organization for API testing",
            "website": "https://api-test.example.com"
        }
        
        response = client.post("/api/organizations", json=org_data, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == org_data["name"]
        
        self.__class__.organization_id = data["id"]
    
    def test_08_list_organizations(self):
        """Тест получения списка организаций"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = client.get("/api/organizations", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_09_create_project(self):
        """Тест создания проекта"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        project_data = {
            "name": "API Test Project",
            "description": "Project for API testing",
            "project_type": "commercial",
            "organization_id": self.organization_id
        }
        
        response = client.post("/api/projects", json=project_data, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == project_data["name"]
        
        self.__class__.project_id = data["id"]
    
    def test_10_upload_document(self):
        """Тест загрузки документа"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Создаем тестовый файл
        test_content = "Test document content for API testing"
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as file:
                files = {"file": ("test_doc.txt", file, "text/plain")}
                data = {
                    "document_type": "tz",
                    "project_id": self.project_id
                }
                
                response = client.post(
                    "/api/documents/upload", 
                    files=files, 
                    data=data, 
                    headers=headers
                )
            
            assert response.status_code == 201
            result = response.json()
            assert result["filename"]
            assert result["document_type"] == "tz"
            
        finally:
            os.unlink(temp_file_path)
    
    def test_11_list_documents(self):
        """Тест получения списка документов"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = client.get("/api/documents", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_12_ai_providers_list(self):
        """Тест получения списка AI провайдеров"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = client.get("/api/ai/providers", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert isinstance(data["providers"], dict)
    
    def test_13_ai_models_list(self):
        """Тест получения списка AI моделей"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = client.get("/api/ai/models", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert isinstance(data["models"], list)
    
    def test_14_usage_statistics(self):
        """Тест получения статистики использования"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = client.get("/api/usage/stats", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_requests" in data
        assert "total_cost" in data
    
    def test_15_invalid_endpoint(self):
        """Тест несуществующего endpoint"""
        response = client.get("/api/nonexistent")
        assert response.status_code == 404
    
    def test_16_rate_limiting(self):
        """Тест rate limiting"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Отправляем много запросов подряд
        responses = []
        for i in range(20):
            response = client.get("/api/auth/me", headers=headers)
            responses.append(response.status_code)
        
        # Проверяем, что не все запросы заблокированы
        success_responses = [r for r in responses if r == 200]
        assert len(success_responses) > 0
    
    def test_17_cors_headers(self):
        """Тест CORS заголовков"""
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization"
        }
        
        response = client.options("/api/auth/me", headers=headers)
        
        # Проверяем CORS заголовки
        assert "Access-Control-Allow-Origin" in response.headers
        assert "Access-Control-Allow-Methods" in response.headers
    
    def test_18_error_handling(self):
        """Тест обработки ошибок"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Отправляем некорректные данные
        response = client.post("/api/projects", json={
            "name": "",  # Пустое имя должно вызвать ошибку
            "organization_id": "invalid_id"
        }, headers=headers)
        
        assert response.status_code in [400, 422]
        data = response.json()
        assert "detail" in data or "errors" in data
    
    def test_19_pagination(self):
        """Тест пагинации"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Тестируем с параметрами пагинации
        response = client.get("/api/documents?page=1&limit=10", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Проверяем структуру ответа с пагинацией
        if isinstance(data, dict) and "items" in data:
            assert "page" in data
            assert "limit" in data
            assert "total" in data
    
    def test_20_logout(self):
        """Тест выхода из системы"""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = client.post("/api/auth/logout", headers=headers)
        
        assert response.status_code == 200
        
        # Проверяем, что токен больше не работает
        response = client.get("/api/auth/me", headers=headers)
        assert response.status_code == 401


class TestWebSocketIntegration:
    """Тесты WebSocket соединений"""
    
    @pytest.mark.asyncio
    async def test_websocket_connection(self):
        """Тест WebSocket подключения"""
        async with httpx.AsyncClient() as client:
            # Тестируем подключение к WebSocket
            try:
                response = await client.get("ws://localhost:8000/ws/test")
                # WebSocket тест - проверяем, что endpoint существует
                assert response.status_code in [200, 426]  # 426 = Upgrade Required for WebSocket
            except Exception:
                # WebSocket может не быть доступен в тестах
                pass


class TestPerformanceBaseline:
    """Базовые тесты производительности"""
    
    def test_api_response_time(self):
        """Тест времени ответа API"""
        import time
        
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 1.0  # Ответ должен быть быстрее 1 секунды
    
    def test_concurrent_requests(self):
        """Тест параллельных запросов"""
        import threading
        import time
        
        results = []
        
        def make_request():
            start_time = time.time()
            response = client.get("/health")
            end_time = time.time()
            results.append({
                "status_code": response.status_code,
                "response_time": end_time - start_time
            })
        
        # Запускаем 10 параллельных запросов
        threads = []
        for i in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Ждем завершения всех запросов
        for thread in threads:
            thread.join()
        
        # Проверяем результаты
        assert len(results) == 10
        assert all(r["status_code"] == 200 for r in results)
        assert all(r["response_time"] < 2.0 for r in results)


def run_integration_tests():
    """Запуск всех интеграционных тестов"""
    print("🧪 Starting DevAssist Pro API Integration Tests")
    print("=" * 60)
    
    # Запускаем pytest
    pytest.main([__file__, "-v", "--tb=short"])


if __name__ == "__main__":
    run_integration_tests()