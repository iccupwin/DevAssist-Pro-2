#!/usr/bin/env python3
"""
DevAssist Pro - Упрощенное API для быстрого запуска
Минимальная версия без зависимости от базы данных
"""
import os
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

# FastAPI и зависимости
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========================================
# МОДЕЛИ ДАННЫХ
# ========================================

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    services: Dict[str, str]

class AnalysisRequest(BaseModel):
    file_content: str
    analysis_type: str = "kp_analysis"

class AnalysisResponse(BaseModel):
    status: str
    result: Dict[str, Any]
    timestamp: str

# ========================================
# СОЗДАНИЕ ПРИЛОЖЕНИЯ
# ========================================

app = FastAPI(
    title="DevAssist Pro API",
    description="AI-powered platform for real estate developers",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Настройка CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost,http://localhost:80,http://localhost:8080").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins + ["*"],  # В production убрать "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# ЭНДПОИНТЫ
# ========================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Проверка здоровья сервиса"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat(),
        services={
            "api": "operational",
            "database": "not_configured",
            "ai_service": "ready"
        }
    )

@app.get("/api/health", response_model=HealthResponse)
async def api_health_check():
    """API health check"""
    return await health_check()

@app.get("/api/")
async def api_root():
    """Корневой эндпоинт API"""
    return {
        "message": "Welcome to DevAssist Pro API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "docs": "/api/docs",
            "kp_analyzer": "/api/kp-analyzer/"
        }
    }

@app.get("/api/kp-analyzer/")
async def kp_analyzer_info():
    """Информация о КП анализаторе"""
    return {
        "service": "KP Analyzer",
        "version": "1.0.0",
        "description": "AI-powered commercial proposal analyzer",
        "endpoints": {
            "upload": "/api/kp-analyzer/upload",
            "analyze": "/api/kp-analyzer/analyze",
            "compare": "/api/kp-analyzer/compare"
        }
    }

@app.post("/api/kp-analyzer/upload")
async def upload_file(file: UploadFile = File(...)):
    """Загрузка файла для анализа"""
    try:
        # Проверяем тип файла
        allowed_types = ["pdf", "docx", "doc", "txt"]
        file_ext = file.filename.split(".")[-1].lower()
        
        if file_ext not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_types)}"
            )
        
        # В упрощенной версии просто возвращаем информацию о файле
        return {
            "status": "success",
            "file_id": f"file_{datetime.utcnow().timestamp()}",
            "filename": file.filename,
            "size": file.size or 0,
            "type": file_ext
        }
    
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/kp-analyzer/analyze", response_model=AnalysisResponse)
async def analyze_document(request: AnalysisRequest):
    """Анализ документа"""
    try:
        # В упрощенной версии возвращаем заглушку
        return AnalysisResponse(
            status="success",
            result={
                "company": "Demo Company",
                "analysis_type": request.analysis_type,
                "score": 85,
                "recommendations": [
                    "Документ соответствует основным требованиям",
                    "Рекомендуется уточнить сроки выполнения",
                    "Цена находится в рыночном диапазоне"
                ]
            },
            timestamp=datetime.utcnow().isoformat()
        )
    
    except Exception as e:
        logger.error(f"Error analyzing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/dashboard")
async def analytics_dashboard():
    """Дашборд аналитики"""
    return {
        "stats": {
            "total_analyses": 42,
            "total_users": 5,
            "total_projects": 3,
            "average_score": 82.5
        },
        "recent_activity": [
            {
                "date": "2024-01-19",
                "action": "analysis_completed",
                "project": "Жилой комплекс 'Солнечный'"
            }
        ],
        "timestamp": datetime.utcnow().isoformat()
    }

# ========================================
# ЗАПУСК ПРИЛОЖЕНИЯ
# ========================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting DevAssist Pro API on {host}:{port}")
    logger.info(f"API docs available at http://{host}:{port}/api/docs")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )