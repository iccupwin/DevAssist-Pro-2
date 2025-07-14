#!/usr/bin/env python3
"""
DevAssist Pro - Монолитное приложение
Объединяет все сервисы в одном FastAPI приложении для упрощения запуска
"""
import os
import logging
import sys
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path

# FastAPI и зависимости
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Добавляем путь к shared модулям
sys.path.append(str(Path(__file__).parent / "shared"))

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========================================
# СХЕМЫ И МОДЕЛИ
# ========================================

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str
    version: str = "1.0.0"

class AnalyticsRequest(BaseModel):
    data_type: str
    aggregation_type: str = "count"
    period: str = "30d"
    filters: Optional[Dict[str, Any]] = {}

class AnalyticsResponse(BaseModel):
    data_type: str
    results: Dict[str, Any]
    metadata: Dict[str, Any]

class ReportGenerationRequest(BaseModel):
    analysis_id: int
    report_format: str = "pdf"
    template_name: str = "kp_analysis_default"
    include_charts: bool = True
    include_raw_data: bool = False

class ReportGenerationResponse(BaseModel):
    report_id: str
    analysis_id: int
    format: str
    status: str
    download_url: Optional[str] = None
    generated_at: str

class DashboardStats(BaseModel):
    overview: Dict[str, Any]
    charts: List[Dict[str, Any]]
    metrics: Dict[str, Any]

# ========================================
# БИЗНЕС-ЛОГИКА
# ========================================

class ReportsManager:
    """Менеджер отчетов"""
    
    def __init__(self):
        self.reports_dir = Path("data/reports")
        self.reports_dir.mkdir(exist_ok=True)
    
    async def generate_pdf_report(self, analysis_id: int, template_name: str = "default") -> str:
        """Генерация PDF отчета"""
        filename = f"kp_analysis_{analysis_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = self.reports_dir / filename
        
        # Мок-генерация PDF
        pdf_content = f"""
        КП АНАЛИЗ ОТЧЕТ #{analysis_id}
        =============================
        
        Дата: {datetime.now().strftime('%d.%m.%Y %H:%M')}
        Шаблон: {template_name}
        
        ОСНОВНЫЕ МЕТРИКИ:
        - Качество предложения: 85%
        - Соответствие требованиям: 92%
        - Конкурентоспособность: 78%
        
        РЕКОМЕНДАЦИИ:
        - Уточнить сроки выполнения
        - Добавить гарантийные обязательства
        - Пересмотреть ценовую политику
        
        ЗАКЛЮЧЕНИЕ:
        Коммерческое предложение соответствует требованиям,
        рекомендуется к рассмотрению с учетом замечаний.
        """
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(pdf_content)
        
        logger.info(f"PDF отчет создан: {filename}")
        return filename
    
    async def generate_excel_report(self, analysis_id: int) -> str:
        """Генерация Excel отчета"""
        filename = f"kp_data_{analysis_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        filepath = self.reports_dir / filename
        
        # Мок-генерация Excel
        excel_content = f"""
        Лист 1: Основные данные
        ID Анализа: {analysis_id}
        Дата: {datetime.now()}
        
        Лист 2: Метрики
        Качество: 85%
        Соответствие: 92%
        Конкурентность: 78%
        
        Лист 3: Рекомендации
        1. Уточнить сроки
        2. Добавить гарантии
        3. Пересмотреть цены
        """
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(excel_content)
        
        logger.info(f"Excel отчет создан: {filename}")
        return filename

class AnalyticsManager:
    """Менеджер аналитики"""
    
    def __init__(self):
        self.cache = {}
    
    async def process_analytics(self, data_type: str, aggregation_type: str = "count") -> Dict[str, Any]:
        """Обработка аналитических данных"""
        
        # Мок-данные для демонстрации
        mock_data = {
            "analyses": {
                "total_analyses": 1247,
                "successful_analyses": 1156,
                "failed_analyses": 91,
                "success_rate": 92.7,
                "avg_processing_time": 23.5,
                "total_cost": 1847.50
            },
            "documents": {
                "total_documents": 2394,
                "processed_documents": 2201,
                "pdf_documents": 1456,
                "docx_documents": 789,
                "txt_documents": 149,
                "avg_file_size": 2.3
            },
            "users": {
                "total_users": 89,
                "active_users": 67,
                "new_users": 12,
                "avg_session_duration": 45.2
            },
            "projects": {
                "total_projects": 234,
                "active_projects": 89,
                "completed_projects": 134,
                "avg_project_duration": 12.5
            }
        }
        
        return mock_data.get(data_type, {})
    
    async def calculate_metrics(self, metric_types: List[str], period: str = "30d") -> Dict[str, Any]:
        """Расчет метрик"""
        
        metrics = {}
        
        for metric_type in metric_types:
            if metric_type == "success_rate":
                metrics[metric_type] = {
                    "value": 92.7,
                    "unit": "%",
                    "trend": "+2.3",
                    "period": period
                }
            elif metric_type == "avg_processing_time":
                metrics[metric_type] = {
                    "value": 23.5,
                    "unit": "сек",
                    "trend": "-1.2",
                    "period": period
                }
            elif metric_type == "cost_per_analysis":
                metrics[metric_type] = {
                    "value": 1.48,
                    "unit": "$",
                    "trend": "-0.15",
                    "period": period
                }
        
        return metrics
    
    async def generate_dashboard_stats(self, period: str = "30d") -> Dict[str, Any]:
        """Генерация статистики для дашборда"""
        
        return {
            "overview": {
                "total_projects": 234,
                "total_analyses": 1247,
                "total_documents": 2394,
                "total_users": 89,
                "success_rate": 92.7,
                "avg_processing_time": 23.5
            },
            "charts": [
                {
                    "type": "line",
                    "title": "Анализы по дням",
                    "data": [45, 52, 38, 41, 59, 67, 48]
                },
                {
                    "type": "pie", 
                    "title": "Типы документов",
                    "data": {"PDF": 61, "DOCX": 33, "TXT": 6}
                },
                {
                    "type": "bar",
                    "title": "Успешность по проектам",
                    "data": [89, 92, 87, 94, 91]
                }
            ],
            "metrics": {
                "period": period,
                "generated_at": datetime.now().isoformat(),
                "total_cost": 1847.50,
                "avg_cost_per_analysis": 1.48
            }
        }

class DocumentsManager:
    """Менеджер документов"""
    
    def __init__(self):
        self.uploads_dir = Path("data/uploads")
        self.uploads_dir.mkdir(exist_ok=True)
    
    async def upload_file(self, file: UploadFile) -> Dict[str, Any]:
        """Загрузка файла"""
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        filepath = self.uploads_dir / filename
        
        content = await file.read()
        with open(filepath, 'wb') as f:
            f.write(content)
        
        return {
            "document_id": hash(filename) % 100000,
            "filename": filename,
            "original_name": file.filename,
            "size": len(content),
            "content_type": file.content_type,
            "uploaded_at": datetime.now().isoformat()
        }
    
    async def analyze_document(self, document_id: int) -> Dict[str, Any]:
        """Анализ документа"""
        
        # Мок-анализ КП
        return {
            "analysis_id": document_id * 10,
            "document_id": document_id,
            "status": "completed",
            "analysis_type": "kp_analysis",
            "results": {
                "quality_score": 85.2,
                "compliance_score": 92.1,
                "competitiveness_score": 78.5,
                "summary": "Коммерческое предложение соответствует требованиям с замечаниями",
                "recommendations": [
                    "Уточнить сроки выполнения работ",
                    "Добавить информацию о гарантийных обязательствах",
                    "Пересмотреть ценовую политику в сторону конкурентоспособности"
                ],
                "key_points": [
                    "Четко сформулированы цели проекта",
                    "Указаны основные этапы выполнения",
                    "Присутствует техническое описание",
                    "Недостаточно детализированы риски"
                ]
            },
            "processed_at": datetime.now().isoformat(),
            "processing_time": 23.7,
            "ai_provider": "openai",
            "model_used": "gpt-4"
        }

# ========================================
# СОЗДАНИЕ ПРИЛОЖЕНИЯ
# ========================================

# Инициализация менеджеров
reports_manager = ReportsManager()
analytics_manager = AnalyticsManager()
documents_manager = DocumentsManager()

# Создание FastAPI приложения
app = FastAPI(
    title="DevAssist Pro - КП Анализатор",
    description="Монолитное приложение для анализа коммерческих предложений",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# HEALTH CHECK
# ========================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Проверка здоровья сервиса"""
    return HealthResponse(
        status="healthy",
        service="devassist-pro-monolith",
        timestamp=datetime.now().isoformat()
    )

# ========================================
# DOCUMENTS API
# ========================================

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Загрузка документа"""
    try:
        result = await documents_manager.upload_file(file)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Ошибка загрузки файла: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/{document_id}/analyze")
async def analyze_document(document_id: int):
    """Анализ документа"""
    try:
        result = await documents_manager.analyze_document(document_id)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Ошибка анализа документа: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# ANALYTICS API
# ========================================

@app.post("/api/analytics/process", response_model=AnalyticsResponse)
async def process_analytics(request: AnalyticsRequest):
    """Обработка аналитических данных"""
    try:
        results = await analytics_manager.process_analytics(
            request.data_type, 
            request.aggregation_type
        )
        
        return AnalyticsResponse(
            data_type=request.data_type,
            results=results,
            metadata={
                "period": request.period,
                "processed_at": datetime.now().isoformat(),
                "aggregation_type": request.aggregation_type
            }
        )
    except Exception as e:
        logger.error(f"Ошибка обработки аналитики: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/dashboard")
async def get_dashboard_stats(period: str = Query("30d")):
    """Статистика для дашборда"""
    try:
        stats = await analytics_manager.generate_dashboard_stats(period)
        return {"success": True, "data": stats}
    except Exception as e:
        logger.error(f"Ошибка получения статистики: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/metrics")
async def calculate_metrics(
    metric_types: List[str],
    period: str = Query("30d")
):
    """Расчет метрик"""
    try:
        metrics = await analytics_manager.calculate_metrics(metric_types, period)
        return {"success": True, "data": metrics}
    except Exception as e:
        logger.error(f"Ошибка расчета метрик: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# REPORTS API
# ========================================

@app.post("/api/reports/generate/pdf", response_model=ReportGenerationResponse)
async def generate_pdf_report(request: ReportGenerationRequest):
    """Генерация PDF отчета"""
    try:
        filename = await reports_manager.generate_pdf_report(
            request.analysis_id, 
            request.template_name
        )
        
        return ReportGenerationResponse(
            report_id=f"pdf_{request.analysis_id}_{int(datetime.now().timestamp())}",
            analysis_id=request.analysis_id,
            format="pdf",
            status="completed",
            download_url=f"/api/reports/download/pdf/{filename}",
            generated_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Ошибка генерации PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reports/generate/excel", response_model=ReportGenerationResponse)
async def generate_excel_report(request: ReportGenerationRequest):
    """Генерация Excel отчета"""
    try:
        filename = await reports_manager.generate_excel_report(request.analysis_id)
        
        return ReportGenerationResponse(
            report_id=f"excel_{request.analysis_id}_{int(datetime.now().timestamp())}",
            analysis_id=request.analysis_id,
            format="excel",
            status="completed",
            download_url=f"/api/reports/download/excel/{filename}",
            generated_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Ошибка генерации Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports/download/pdf/{filename}")
async def download_pdf_report(filename: str):
    """Скачивание PDF отчета"""
    filepath = reports_manager.reports_dir / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/pdf"
    )

@app.get("/api/reports/download/excel/{filename}")
async def download_excel_report(filename: str):
    """Скачивание Excel отчета"""
    filepath = reports_manager.reports_dir / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# ========================================
# КП АНАЛИЗАТОР API (ОСНОВНОЙ ФУНКЦИОНАЛ)
# ========================================

@app.post("/api/kp-analyzer/full-analysis")
async def full_kp_analysis(file: UploadFile = File(...)):
    """Полный анализ КП: загрузка → анализ → отчет"""
    try:
        # 1. Загрузка документа
        upload_result = await documents_manager.upload_file(file)
        document_id = upload_result["document_id"]
        
        # 2. Анализ документа
        analysis_result = await documents_manager.analyze_document(document_id)
        analysis_id = analysis_result["analysis_id"]
        
        # 3. Генерация отчета
        pdf_filename = await reports_manager.generate_pdf_report(analysis_id)
        excel_filename = await reports_manager.generate_excel_report(analysis_id)
        
        return {
            "success": True,
            "data": {
                "document": upload_result,
                "analysis": analysis_result,
                "reports": {
                    "pdf": {
                        "filename": pdf_filename,
                        "download_url": f"/api/reports/download/pdf/{pdf_filename}"
                    },
                    "excel": {
                        "filename": excel_filename,
                        "download_url": f"/api/reports/download/excel/{excel_filename}"
                    }
                }
            }
        }
    except Exception as e:
        logger.error(f"Ошибка полного анализа КП: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# АДМИНИСТРАТИВНЫЕ ENDPOINTS
# ========================================

@app.get("/api/admin/status")
async def get_system_status():
    """Статус системы"""
    return {
        "status": "operational",
        "version": "1.0.0",
        "services": {
            "documents": "healthy",
            "analytics": "healthy", 
            "reports": "healthy"
        },
        "uptime": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/admin/stats")
async def get_system_stats():
    """Системная статистика"""
    try:
        stats = await analytics_manager.generate_dashboard_stats()
        return {"success": True, "data": stats}
    except Exception as e:
        logger.error(f"Ошибка получения статистики: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# ЗАПУСК ПРИЛОЖЕНИЯ
# ========================================

if __name__ == "__main__":
    # Создание необходимых директорий
    os.makedirs("data/reports", exist_ok=True)
    os.makedirs("data/uploads", exist_ok=True)
    
    print("🚀 Запуск DevAssist Pro - Монолитное приложение")
    print("=" * 50)
    print("📊 Доступные API:")
    print("   • Health Check:     http://localhost:8000/health")
    print("   • API Docs:         http://localhost:8000/docs")
    print("   • Documents API:    http://localhost:8000/api/documents/")
    print("   • Analytics API:    http://localhost:8000/api/analytics/")
    print("   • Reports API:      http://localhost:8000/api/reports/")
    print("   • КП Analyzer:      http://localhost:8000/api/kp-analyzer/")
    print("   • Admin Panel:      http://localhost:8000/api/admin/")
    print("=" * 50)
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )