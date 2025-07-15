"""
Тесты для API Gateway
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import httpx

from ..main import app


class TestAPIGateway:
    """Тесты для API Gateway"""
    
    @pytest.fixture
    def client(self):
        """Фикстура для тестового клиента"""
        return TestClient(app)
    
    def test_root_endpoint(self, client):
        """Тест корневого endpoint'а"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "DevAssist Pro API Gateway"
        assert data["version"] == "1.0.0"
        assert "services" in data
    
    @patch('httpx.AsyncClient.get')
    def test_health_check(self, mock_get, client):
        """Тест health check endpoint'а"""
        # Мокаем ответы от микросервисов
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.elapsed.total_seconds.return_value = 0.1
        mock_get.return_value = mock_response
        
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["api_gateway"] == "healthy"
        assert "services" in data
    
    @patch('httpx.AsyncClient.request')
    def test_kp_analyzer_upload_proxy(self, mock_request, client):
        """Тест проксирования загрузки для КП Анализатора"""
        # Мокаем ответ от documents service
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "document_id": "test_doc_123",
            "filename": "test.pdf",
            "status": "uploaded"
        }
        mock_response.headers = {"content-type": "application/json"}
        mock_request.return_value = mock_response
        
        # Тестовые данные для загрузки
        files = {"file": ("test.pdf", b"fake pdf content", "application/pdf")}
        
        response = client.post("/api/kp-analyzer/upload", files=files)
        
        assert response.status_code == 200
        # Проверяем, что запрос был проксирован к documents service
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        assert kwargs["url"].endswith("/upload")
    
    @patch('httpx.AsyncClient.request')
    def test_kp_analyzer_analyze_proxy(self, mock_request, client):
        """Тест проксирования анализа КП"""
        # Мокаем ответ от LLM service
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "analysis_id": "analysis_123",
            "compliance_score": 0.85,
            "recommendations": ["test recommendation"]
        }
        mock_response.headers = {"content-type": "application/json"}
        mock_request.return_value = mock_response
        
        # Тестовые данные для анализа
        analysis_data = {
            "tz_content": "Техническое задание",
            "kp_content": "Коммерческое предложение"
        }
        
        response = client.post("/api/kp-analyzer/analyze", json=analysis_data)
        
        assert response.status_code == 200
        # Проверяем, что запрос был проксирован к LLM service
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        assert kwargs["url"].endswith("/analyze/kp")
    
    @patch('httpx.AsyncClient.request')
    def test_documents_list_proxy(self, mock_request, client):
        """Тест проксирования списка документов"""
        # Мокаем ответ от documents service
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "documents": [
                {"document_id": "doc1", "filename": "test1.pdf"},
                {"document_id": "doc2", "filename": "test2.pdf"}
            ],
            "total": 2
        }
        mock_response.headers = {"content-type": "application/json"}
        mock_request.return_value = mock_response
        
        response = client.get("/api/kp-analyzer/documents")
        
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert len(data["documents"]) == 2
    
    @patch('httpx.AsyncClient.request')
    def test_document_content_proxy(self, mock_request, client):
        """Тест проксирования получения содержимого документа"""
        # Мокаем ответ от documents service
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "document_id": "test_doc_123",
            "content": "Содержимое документа",
            "content_type": "text/plain"
        }
        mock_response.headers = {"content-type": "application/json"}
        mock_request.return_value = mock_response
        
        response = client.get("/api/kp-analyzer/documents/test_doc_123/content")
        
        assert response.status_code == 200
        data = response.json()
        assert data["document_id"] == "test_doc_123"
        assert "content" in data
    
    @patch('httpx.AsyncClient.request')
    def test_service_unavailable(self, mock_request, client):
        """Тест обработки недоступности сервиса"""
        # Мокаем ошибку подключения
        mock_request.side_effect = httpx.ConnectError("Connection failed")
        
        response = client.get("/api/kp-analyzer/documents")
        
        assert response.status_code == 502  # Bad Gateway
    
    @patch('httpx.AsyncClient.request')
    def test_service_timeout(self, mock_request, client):
        """Тест обработки таймаута сервиса"""
        # Мокаем таймаут
        mock_request.side_effect = httpx.TimeoutException("Timeout")
        
        response = client.get("/api/kp-analyzer/documents")
        
        assert response.status_code == 504  # Gateway Timeout
    
    def test_cors_headers(self, client):
        """Тест CORS заголовков"""
        response = client.options("/api/kp-analyzer/documents")
        
        # Проверяем наличие CORS заголовков
        assert "access-control-allow-origin" in response.headers
    
    def test_process_time_header(self, client):
        """Тест добавления заголовка времени обработки"""
        response = client.get("/")
        
        assert "X-Process-Time" in response.headers
        # Время обработки должно быть числом
        process_time = float(response.headers["X-Process-Time"])
        assert process_time >= 0
    
    @patch('httpx.AsyncClient.request')
    def test_auth_service_proxy(self, mock_request, client):
        """Тест проксирования к auth service"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "authenticated"}
        mock_response.headers = {"content-type": "application/json"}
        mock_request.return_value = mock_response
        
        response = client.get("/api/auth/status")
        
        assert response.status_code == 200
        mock_request.assert_called_once()
    
    @patch('httpx.AsyncClient.request')
    def test_llm_service_proxy(self, mock_request, client):
        """Тест проксирования к LLM service"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"content": "AI response"}
        mock_response.headers = {"content-type": "application/json"}
        mock_request.return_value = mock_response
        
        response = client.post("/api/llm/generate", json={"prompt": "test"})
        
        assert response.status_code == 200
        mock_request.assert_called_once()


@pytest.mark.asyncio
async def test_proxy_request_function():
    """Тест функции проксирования запросов"""
    from ..main import proxy_request
    from fastapi import Request
    
    # Создание мок-запроса
    mock_request = Mock(spec=Request)
    mock_request.method = "GET"
    mock_request.query_params = {}
    mock_request.headers = {"content-type": "application/json"}
    mock_request.body.return_value = b""
    
    with patch('httpx.AsyncClient.request') as mock_http_request:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"test": "data"}
        mock_response.headers = {"content-type": "application/json"}
        mock_http_request.return_value = mock_response
        
        response = await proxy_request("documents", "/test", mock_request)
        
        assert response.status_code == 200


def test_unknown_service():
    """Тест обращения к неизвестному сервису"""
    client = TestClient(app)
    
    response = client.get("/api/unknown-service/test")
    
    assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__])