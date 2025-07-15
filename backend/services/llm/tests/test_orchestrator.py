"""
Тесты для LLM Orchestrator
"""
import pytest
import asyncio
from unittest.mock import Mock, patch
from datetime import datetime

from ..orchestrator import LLMOrchestrator
from ..shared.llm_schemas import AIRequest, TaskType, AIProvider


class TestLLMOrchestrator:
    """Тесты для LLM оркестратора"""
    
    @pytest.fixture
    async def orchestrator(self):
        """Фикстура для создания оркестратора"""
        orch = LLMOrchestrator()
        # Мокаем Redis для тестов
        orch.redis_client = Mock()
        return orch
    
    @pytest.mark.asyncio
    async def test_init_providers(self, orchestrator):
        """Тест инициализации провайдеров"""
        assert isinstance(orchestrator.providers, dict)
        assert "openai" in orchestrator.providers or "anthropic" in orchestrator.providers
    
    @pytest.mark.asyncio
    async def test_model_selection(self, orchestrator):
        """Тест выбора модели"""
        provider_name, model = orchestrator._select_model(TaskType.ANALYSIS)
        
        assert provider_name in orchestrator.providers
        assert model is not None
        assert isinstance(model, str)
    
    @pytest.mark.asyncio
    async def test_generate_text_basic(self, orchestrator):
        """Тест базовой генерации текста"""
        request = AIRequest(
            task_type=TaskType.ANALYSIS,
            content="Test prompt",
            system_prompt="You are a helpful assistant"
        )
        
        # Мокаем провайдер
        mock_provider = Mock()
        mock_provider.generate_text.return_value = {
            "content": "Test response",
            "model": "test-model",
            "provider": "test-provider",
            "prompt_tokens": 10,
            "completion_tokens": 5,
            "total_tokens": 15,
            "cost_usd": 0.01
        }
        
        orchestrator.providers["test-provider"] = mock_provider
        
        # Мокаем выбор модели
        with patch.object(orchestrator, '_select_model', return_value=("test-provider", "test-model")):
            response = await orchestrator.generate_text(request)
        
        assert response.content == "Test response"
        assert response.model_used == "test-model"
        assert response.provider_used == AIProvider.OPENAI  # Default fallback
    
    @pytest.mark.asyncio
    async def test_cache_functionality(self, orchestrator):
        """Тест функциональности кеша"""
        request = AIRequest(
            task_type=TaskType.ANALYSIS,
            content="Test content for caching"
        )
        
        cache_key = orchestrator._get_cache_key(request)
        assert isinstance(cache_key, str)
        assert len(cache_key) > 0
    
    @pytest.mark.asyncio
    async def test_kp_analysis_basic(self, orchestrator):
        """Тест базового анализа КП"""
        from ..shared.llm_schemas import KPAnalysisRequest
        
        request = KPAnalysisRequest(
            tz_content="Техническое задание на разработку системы",
            kp_content="Коммерческое предложение от компании"
        )
        
        # Мокаем методы анализа
        with patch.object(orchestrator, '_extract_kp_summary') as mock_extract, \
             patch.object(orchestrator, '_compare_tz_kp') as mock_compare, \
             patch.object(orchestrator, '_generate_recommendations') as mock_recommend:
            
            mock_extract.return_value = {
                "company_name": "ТестКомпания",
                "tech_stack": "Python, React",
                "pricing": "1 000 000 руб.",
                "timeline": "6 месяцев"
            }
            
            mock_compare.return_value = {
                "compliance_score": 85,
                "missing_requirements": ["Требование 1"],
                "additional_features": ["Дополнительная функция"]
            }
            
            mock_recommend.return_value = {
                "strength": ["Хорошая команда"],
                "weakness": ["Высокая цена"],
                "summary": "Рекомендуется к рассмотрению"
            }
            
            response = await orchestrator.analyze_kp_documents(request)
        
        assert response.analysis_id is not None
        assert response.compliance_score == 0.85  # 85/100
        assert len(response.compliance_details) >= 2
        assert len(response.recommendations) >= 3
    
    @pytest.mark.asyncio 
    async def test_health_check(self, orchestrator):
        """Тест проверки здоровья сервиса"""
        # Мокаем провайдеры
        mock_provider = Mock()
        mock_provider.check_health.return_value = {
            "provider": "test-provider",
            "status": "healthy",
            "last_check": datetime.now()
        }
        
        orchestrator.providers["test-provider"] = mock_provider
        
        health_status = await orchestrator.get_health_status()
        
        assert "service_status" in health_status
        assert "providers_status" in health_status
        assert "active_models" in health_status
        assert health_status["total_providers"] >= 0


@pytest.mark.asyncio
async def test_ai_request_validation():
    """Тест валидации AI запросов"""
    # Валидный запрос
    valid_request = AIRequest(
        task_type=TaskType.ANALYSIS,
        content="Test content"
    )
    assert valid_request.task_type == TaskType.ANALYSIS
    assert valid_request.content == "Test content"
    
    # Проверка дефолтных значений
    assert valid_request.temperature == 0.7
    assert valid_request.max_tokens == 1000


@pytest.mark.asyncio
async def test_error_handling():
    """Тест обработки ошибок"""
    orchestrator = LLMOrchestrator()
    
    # Тест с пустыми провайдерами
    orchestrator.providers = {}
    
    request = AIRequest(
        task_type=TaskType.ANALYSIS,
        content="Test content"
    )
    
    response = await orchestrator.generate_text(request)
    assert response.error is not None
    assert response.content == ""


if __name__ == "__main__":
    pytest.main([__file__])