"""
Analytics Service для DevAssist Pro
Микросервис для обработки аналитики и метрик
Этап 5C: Отчеты и экспорт
"""
import os
import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from .core.analytics_processor import AnalyticsProcessor
from .core.metrics_calculator import MetricsCalculator
from .core.data_aggregator import DataAggregator
from .core.statistics_generator import StatisticsGenerator
from ..shared.models import Document, DocumentAnalysis, Project, User
from ..shared.schemas import (
    AnalyticsRequest, AnalyticsResponse, 
    MetricsRequest, MetricsResponse,
    StatisticsRequest, StatisticsResponse,
    HealthResponse
)

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Глобальные экземпляры сервисов
analytics_processor: Optional[AnalyticsProcessor] = None
metrics_calculator: Optional[MetricsCalculator] = None
data_aggregator: Optional[DataAggregator] = None
statistics_generator: Optional[StatisticsGenerator] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events для FastAPI приложения"""
    global analytics_processor, metrics_calculator, data_aggregator, statistics_generator
    
    logger.info("Starting Analytics Service...")
    
    # Инициализация сервисов
    analytics_processor = AnalyticsProcessor()
    metrics_calculator = MetricsCalculator()
    data_aggregator = DataAggregator()
    statistics_generator = StatisticsGenerator()
    
    # Инициализация Redis подключений
    await analytics_processor.init_redis()
    await metrics_calculator.init_redis()
    
    # Создание необходимых директорий
    os.makedirs("data/analytics", exist_ok=True)
    os.makedirs("data/cache", exist_ok=True)
    
    logger.info("Analytics Service initialized successfully")
    
    yield
    
    logger.info("Shutting down Analytics Service...")

# Создание FastAPI приложения
app = FastAPI(
    title="DevAssist Pro Analytics Service",
    description="Микросервис для обработки аналитики и метрик",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency для получения экземпляров сервисов
def get_analytics_processor():
    global analytics_processor
    if analytics_processor is None:
        raise HTTPException(status_code=500, detail="Analytics processor not initialized")
    return analytics_processor

def get_metrics_calculator():
    global metrics_calculator
    if metrics_calculator is None:
        raise HTTPException(status_code=500, detail="Metrics calculator not initialized")
    return metrics_calculator

def get_data_aggregator():
    global data_aggregator
    if data_aggregator is None:
        raise HTTPException(status_code=500, detail="Data aggregator not initialized")
    return data_aggregator

def get_statistics_generator():
    global statistics_generator
    if statistics_generator is None:
        raise HTTPException(status_code=500, detail="Statistics generator not initialized")
    return statistics_generator

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Проверка состояния сервиса"""
    return HealthResponse(
        status="healthy",
        service="analytics",
        timestamp=datetime.utcnow(),
        version="1.0.0"
    )

# Обработка аналитики
@app.post("/analytics/process", response_model=AnalyticsResponse)
async def process_analytics(
    request: AnalyticsRequest,
    processor: AnalyticsProcessor = Depends(get_analytics_processor)
):
    """Обработка аналитических данных"""
    try:
        logger.info(f"Processing analytics for: {request.data_type}")
        
        result = await processor.process_analytics(
            data_type=request.data_type,
            filters=request.filters,
            date_range=request.date_range,
            aggregation_type=request.aggregation_type
        )
        
        return AnalyticsResponse(
            data_type=request.data_type,
            result=result,
            processed_at=datetime.utcnow(),
            cache_key=result.get("cache_key")
        )
        
    except Exception as e:
        logger.error(f"Error processing analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analytics processing failed: {str(e)}")

# Расчет метрик
@app.post("/metrics/calculate", response_model=MetricsResponse)
async def calculate_metrics(
    request: MetricsRequest,
    calculator: MetricsCalculator = Depends(get_metrics_calculator)
):
    """Расчет метрик КП Анализатора"""
    try:
        logger.info(f"Calculating metrics: {request.metric_types}")
        
        result = await calculator.calculate_metrics(
            metric_types=request.metric_types,
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            period=request.period
        )
        
        return MetricsResponse(
            metric_types=request.metric_types,
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            result=result,
            calculated_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error calculating metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Metrics calculation failed: {str(e)}")

# Получение статистики
@app.get("/statistics/dashboard")
async def get_dashboard_statistics(
    period: str = Query("7d", description="Период: 1d, 7d, 30d, 90d"),
    user_id: Optional[int] = Query(None, description="ID пользователя"),
    organization_id: Optional[int] = Query(None, description="ID организации"),
    stats_gen: StatisticsGenerator = Depends(get_statistics_generator)
):
    """Получение статистики для дашборда"""
    try:
        logger.info(f"Getting dashboard statistics for period: {period}")
        
        result = await stats_gen.generate_dashboard_statistics(
            period=period,
            user_id=user_id,
            organization_id=organization_id
        )
        
        return {
            "period": period,
            "statistics": result,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Statistics generation failed: {str(e)}")

# Аналитика по анализам КП
@app.get("/analytics/kp-analysis")
async def get_kp_analysis_analytics(
    period: str = Query("30d", description="Период анализа"),
    aggregation: str = Query("day", description="Группировка: day, week, month"),
    processor: AnalyticsProcessor = Depends(get_analytics_processor)
):
    """Аналитика по анализам КП"""
    try:
        logger.info(f"Getting KP analysis analytics for period: {period}")
        
        result = await processor.get_kp_analysis_analytics(
            period=period,
            aggregation=aggregation
        )
        
        return {
            "period": period,
            "aggregation": aggregation,
            "analytics": result,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting KP analysis analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"KP analytics failed: {str(e)}")

# Метрики использования AI
@app.get("/metrics/ai-usage")
async def get_ai_usage_metrics(
    period: str = Query("30d", description="Период"),
    provider: Optional[str] = Query(None, description="AI провайдер"),
    calculator: MetricsCalculator = Depends(get_metrics_calculator)
):
    """Метрики использования AI"""
    try:
        logger.info(f"Getting AI usage metrics for period: {period}")
        
        result = await calculator.get_ai_usage_metrics(
            period=period,
            provider=provider
        )
        
        return {
            "period": period,
            "provider": provider,
            "metrics": result,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting AI usage metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI metrics failed: {str(e)}")

# Аналитика по пользователям
@app.get("/analytics/users")
async def get_user_analytics(
    period: str = Query("30d", description="Период"),
    aggregation: str = Query("day", description="Группировка"),
    aggregator: DataAggregator = Depends(get_data_aggregator)
):
    """Аналитика по пользователям"""
    try:
        logger.info(f"Getting user analytics for period: {period}")
        
        result = await aggregator.aggregate_user_data(
            period=period,
            aggregation=aggregation
        )
        
        return {
            "period": period,
            "aggregation": aggregation,
            "analytics": result,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting user analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"User analytics failed: {str(e)}")

# Экспорт аналитических данных
@app.post("/analytics/export")
async def export_analytics_data(
    request: AnalyticsRequest,
    format: str = Query("json", description="Формат экспорта: json, csv, excel"),
    processor: AnalyticsProcessor = Depends(get_analytics_processor)
):
    """Экспорт аналитических данных"""
    try:
        logger.info(f"Exporting analytics data in format: {format}")
        
        # Обработка данных
        analytics_data = await processor.process_analytics(
            data_type=request.data_type,
            filters=request.filters,
            date_range=request.date_range,
            aggregation_type=request.aggregation_type
        )
        
        # Экспорт в указанном формате
        export_result = await processor.export_analytics_data(
            data=analytics_data,
            format=format
        )
        
        return {
            "export_id": export_result["export_id"],
            "format": format,
            "file_path": export_result["file_path"],
            "download_url": export_result["download_url"],
            "record_count": export_result["record_count"],
            "exported_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error exporting analytics data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analytics export failed: {str(e)}")

# Очистка кеша аналитики
@app.delete("/analytics/cache")
async def clear_analytics_cache(
    cache_key: Optional[str] = Query(None, description="Ключ кеша для очистки"),
    processor: AnalyticsProcessor = Depends(get_analytics_processor)
):
    """Очистка кеша аналитики"""
    try:
        logger.info(f"Clearing analytics cache: {cache_key or 'all'}")
        
        result = await processor.clear_cache(cache_key)
        
        return {
            "cache_key": cache_key,
            "cleared": result,
            "cleared_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error clearing analytics cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cache clearing failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8004,
        reload=True,
        log_level="info"
    )