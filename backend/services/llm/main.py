"""
LLM Service для DevAssist Pro
Главный FastAPI сервис согласно ТЗ Этап 4: AI Integrations
"""
import asyncio
import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, date
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import json

from .orchestrator import LLMOrchestrator
from .prompt_manager import PromptManager
from .usage_tracker import UsageTracker
from .config import settings
from ..shared.llm_schemas import (
    AIRequest, AIResponse, StreamChunk, TaskType, AIProvider,
    KPAnalysisRequest, KPAnalysisResponse, LLMHealth, UsageStatistics,
    PromptTemplate, ErrorResponse
)

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Глобальные экземпляры сервисов
orchestrator: Optional[LLMOrchestrator] = None
prompt_manager: Optional[PromptManager] = None
usage_tracker: Optional[UsageTracker] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events для FastAPI приложения"""
    global orchestrator, prompt_manager, usage_tracker
    
    logger.info("Starting LLM Service...")
    
    # Инициализация сервисов
    orchestrator = LLMOrchestrator()
    await orchestrator.init_redis()
    
    prompt_manager = PromptManager()
    
    usage_tracker = UsageTracker()
    await usage_tracker.init_redis()
    
    logger.info("LLM Service started successfully")
    
    yield
    
    logger.info("Shutting down LLM Service...")

# Создание FastAPI приложения
app = FastAPI(
    title="DevAssist Pro LLM Service",
    description="AI Orchestration Service для веб-портала DevAssist Pro",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене ограничить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Корневой endpoint LLM Service"""
    return {
        "service": "DevAssist Pro LLM Service",
        "version": "1.0.0",
        "status": "running",
        "providers": list(orchestrator.providers.keys()) if orchestrator else [],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health", response_model=LLMHealth)
async def health_check():
    """Health check endpoint согласно ТЗ"""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        health_status = await orchestrator.get_health_status()
        
        return LLMHealth(
            service_status=health_status["service_status"],
            providers_status=health_status["providers_status"],
            active_models=health_status["active_models"],
            total_requests_today=0,  # TODO: Получить из usage_tracker
            total_cost_today=0.0,
            average_response_time=0.5,
            uptime_percentage=99.9,
            last_updated=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/generate", response_model=AIResponse)
async def generate_text(
    request: AIRequest,
    background_tasks: BackgroundTasks
):
    """Основной endpoint для генерации текста согласно ТЗ"""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    start_time = time.time()
    
    try:
        response = await orchestrator.generate_text(request)
        
        # Отслеживание использования в фоне
        if usage_tracker and not response.error:
            background_tasks.add_task(
                usage_tracker.track_request,
                user_id=request.user_id,
                organization_id=request.organization_id,
                provider=response.provider_used,
                model=response.model_used,
                task_type=request.task_type,
                prompt_tokens=response.prompt_tokens,
                completion_tokens=response.completion_tokens,
                cost_usd=response.cost_usd,
                response_time=response.response_time,
                success=True
            )
        
        return response
        
    except Exception as e:
        logger.error(f"Text generation failed: {e}")
        
        # Отслеживание неуспешного запроса
        if usage_tracker:
            background_tasks.add_task(
                usage_tracker.track_request,
                user_id=request.user_id,
                organization_id=request.organization_id,
                provider=AIProvider.OPENAI,  # Default для ошибок
                model="unknown",
                task_type=request.task_type,
                prompt_tokens=0,
                completion_tokens=0,
                cost_usd=0.0,
                response_time=time.time() - start_time,
                success=False
            )
        
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/stream")
async def generate_text_stream(request: AIRequest):
    """Streaming endpoint для генерации текста согласно ТЗ"""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    async def stream_generator():
        try:
            async for chunk in orchestrator.generate_text_stream(request):
                yield f"data: {json.dumps(chunk.dict())}\n\n"
                
                if chunk.is_complete:
                    break
                    
        except Exception as e:
            error_chunk = StreamChunk(
                task_id="error",
                chunk="",
                is_complete=True,
                error=str(e)
            )
            yield f"data: {json.dumps(error_chunk.dict())}\n\n"
    
    return StreamingResponse(
        stream_generator(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )

@app.post("/analyze/kp", response_model=KPAnalysisResponse)
async def analyze_kp_documents(
    request: KPAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """Специализированный анализ КП согласно ТЗ раздел 4.2"""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        response = await orchestrator.analyze_kp_documents(request)
        
        # Отслеживание использования
        if usage_tracker:
            background_tasks.add_task(
                usage_tracker.track_request,
                user_id=None,  # TODO: Получить из auth
                organization_id=None,
                provider=AIProvider.OPENAI,  # Основной провайдер для КП анализа
                model="gpt-4",
                task_type=TaskType.COMPARISON,
                prompt_tokens=len(request.tz_content) // 4,  # Приблизительно
                completion_tokens=len(str(response.dict())) // 4,
                cost_usd=response.total_cost,
                response_time=response.processing_time,
                success=True
            )
        
        return response
        
    except Exception as e:
        logger.error(f"KP analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prompts/templates")
async def list_prompt_templates(module: Optional[str] = None):
    """Получение списка доступных шаблонов промптов"""
    if not prompt_manager:
        raise HTTPException(status_code=503, detail="Prompt manager not initialized")
    
    try:
        templates = prompt_manager.list_templates(module)
        return {"templates": templates}
        
    except Exception as e:
        logger.error(f"Failed to list templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prompts/templates/{module}/{template_name}")
async def get_prompt_template(module: str, template_name: str):
    """Получение конкретного шаблона промпта"""
    if not prompt_manager:
        raise HTTPException(status_code=503, detail="Prompt manager not initialized")
    
    try:
        template = prompt_manager.get_prompt_template(module, template_name)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"template": template}
        
    except Exception as e:
        logger.error(f"Failed to get template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/prompts/format")
async def format_prompt(
    module: str,
    template_name: str,
    variables: Dict[str, Any]
):
    """Форматирование промпта с подстановкой переменных"""
    if not prompt_manager:
        raise HTTPException(status_code=503, detail="Prompt manager not initialized")
    
    try:
        system_prompt, user_prompt = prompt_manager.format_prompt(
            module, template_name, variables
        )
        
        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to format prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/usage/stats")
async def get_usage_statistics(
    user_id: Optional[int] = None,
    organization_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    provider: Optional[str] = None
):
    """Получение статистики использования AI согласно ТЗ"""
    if not usage_tracker:
        raise HTTPException(status_code=503, detail="Usage tracker not initialized")
    
    try:
        # Конвертация дат
        start_dt = date.fromisoformat(start_date) if start_date else None
        end_dt = date.fromisoformat(end_date) if end_date else None
        provider_enum = AIProvider(provider) if provider else None
        
        stats = await usage_tracker.get_usage_stats(
            user_id=user_id,
            organization_id=organization_id,
            start_date=start_dt,
            end_date=end_dt,
            provider=provider_enum
        )
        
        return stats
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameter: {e}")
    except Exception as e:
        logger.error(f"Failed to get usage stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/usage/realtime")
async def get_realtime_metrics():
    """Получение метрик в реальном времени"""
    if not usage_tracker:
        raise HTTPException(status_code=503, detail="Usage tracker not initialized")
    
    try:
        metrics = await usage_tracker.get_real_time_metrics()
        return metrics
        
    except Exception as e:
        logger.error(f"Failed to get realtime metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/usage/limits/user/{user_id}")
async def set_user_limits(
    user_id: int,
    daily_cost_limit: Optional[float] = None,
    monthly_cost_limit: Optional[float] = None
):
    """Установка лимитов для пользователя"""
    if not usage_tracker:
        raise HTTPException(status_code=503, detail="Usage tracker not initialized")
    
    try:
        await usage_tracker.set_user_limits(
            user_id=user_id,
            daily_cost_limit=daily_cost_limit,
            monthly_cost_limit=monthly_cost_limit
        )
        
        return {"message": f"Limits updated for user {user_id}"}
        
    except Exception as e:
        logger.error(f"Failed to set user limits: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/usage/limits/organization/{organization_id}")
async def set_organization_limits(
    organization_id: int,
    daily_cost_limit: Optional[float] = None,
    monthly_cost_limit: Optional[float] = None
):
    """Установка лимитов для организации"""
    if not usage_tracker:
        raise HTTPException(status_code=503, detail="Usage tracker not initialized")
    
    try:
        await usage_tracker.set_organization_limits(
            organization_id=organization_id,
            daily_cost_limit=daily_cost_limit,
            monthly_cost_limit=monthly_cost_limit
        )
        
        return {"message": f"Limits updated for organization {organization_id}"}
        
    except Exception as e:
        logger.error(f"Failed to set organization limits: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/providers")
async def list_providers():
    """Получение списка доступных AI провайдеров"""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    providers_info = {}
    
    for provider_name, provider in orchestrator.providers.items():
        providers_info[provider_name] = {
            "name": provider_name,
            "models": list(provider.models.keys()),
            "model_details": provider.models
        }
    
    return {"providers": providers_info}

@app.get("/models")
async def list_models():
    """Получение списка всех доступных моделей"""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    all_models = []
    
    for provider_name, provider in orchestrator.providers.items():
        for model_name, model_config in provider.models.items():
            all_models.append({
                "provider": provider_name,
                "model": model_name,
                "display_name": model_config.get("display_name", model_name),
                "max_tokens": model_config.get("max_tokens", 4096),
                "supports_streaming": model_config.get("supports_streaming", False),
                "cost_per_1k_input": model_config.get("cost_per_1k_input", 0.0),
                "cost_per_1k_output": model_config.get("cost_per_1k_output", 0.0)
            })
    
    return {"models": all_models}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    """Глобальный обработчик исключений"""
    logger.error(f"Unhandled exception: {exc}")
    
    return ErrorResponse(
        error_code="internal_error",
        error_message="Internal server error",
        details={"exception": str(exc)},
        timestamp=datetime.now()
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level="info"
    )