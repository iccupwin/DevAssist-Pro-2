"""
Reports Service для DevAssist Pro
Микросервис для генерации отчетов и экспорта данных
Этап 5C: Отчеты и экспорт
"""
import os
import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from core.report_generator import ReportGenerator
from core.pdf_generator import PDFGenerator
from core.excel_generator import ExcelGenerator
from core.template_manager import TemplateManager
# Временно комментируем shared импорты для Docker
# from ..shared.models import Document, DocumentAnalysis, Project
# from ..shared.schemas import (
#     ReportGenerationRequest, ReportGenerationResponse, 
#     ReportTemplateRequest, ReportTemplateResponse,
#     ExportRequest, ExportResponse, HealthResponse
# )

# Локальные схемы для Docker версии
from pydantic import BaseModel

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Глобальные экземпляры сервисов
report_generator: Optional[ReportGenerator] = None
pdf_generator: Optional[PDFGenerator] = None
excel_generator: Optional[ExcelGenerator] = None
template_manager: Optional[TemplateManager] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events для FastAPI приложения"""
    global report_generator, pdf_generator, excel_generator, template_manager
    
    logger.info("Starting Reports Service...")
    
    # Инициализация сервисов
    report_generator = ReportGenerator()
    pdf_generator = PDFGenerator()
    excel_generator = ExcelGenerator()
    template_manager = TemplateManager()
    
    # Создание необходимых директорий
    os.makedirs("data/reports", exist_ok=True)
    os.makedirs("data/exports", exist_ok=True)
    os.makedirs("data/templates", exist_ok=True)
    
    logger.info("Reports Service initialized successfully")
    
    yield
    
    logger.info("Shutting down Reports Service...")

# Создание FastAPI приложения
app = FastAPI(
    title="DevAssist Pro Reports Service",
    description="Микросервис для генерации отчетов и экспорта данных",
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
def get_report_generator():
    global report_generator
    if report_generator is None:
        raise HTTPException(status_code=500, detail="Report generator not initialized")
    return report_generator

def get_pdf_generator():
    global pdf_generator
    if pdf_generator is None:
        raise HTTPException(status_code=500, detail="PDF generator not initialized")
    return pdf_generator

def get_excel_generator():
    global excel_generator
    if excel_generator is None:
        raise HTTPException(status_code=500, detail="Excel generator not initialized")
    return excel_generator

def get_template_manager():
    global template_manager
    if template_manager is None:
        raise HTTPException(status_code=500, detail="Template manager not initialized")
    return template_manager

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Проверка состояния сервиса"""
    return HealthResponse(
        status="healthy",
        service="reports",
        timestamp=datetime.utcnow(),
        version="1.0.0"
    )

# Генерация PDF отчета
@app.post("/generate/pdf", response_model=ReportGenerationResponse)
async def generate_pdf_report(
    request: ReportGenerationRequest,
    background_tasks: BackgroundTasks,
    pdf_gen: PDFGenerator = Depends(get_pdf_generator)
):
    """Генерация PDF отчета по анализу КП"""
    try:
        logger.info(f"Generating PDF report for analysis_id: {request.analysis_id}")
        
        # Генерация отчета
        report_path = await pdf_gen.generate_kp_analysis_report(
            analysis_id=request.analysis_id,
            template_name=request.template_name,
            include_charts=request.include_charts,
            include_raw_data=request.include_raw_data
        )
        
        return ReportGenerationResponse(
            report_id=request.analysis_id,
            report_type="pdf",
            file_path=report_path,
            download_url=f"/download/pdf/{Path(report_path).name}",
            status="completed",
            generated_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error generating PDF report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

# Генерация Excel отчета
@app.post("/generate/excel", response_model=ReportGenerationResponse)
async def generate_excel_report(
    request: ReportGenerationRequest,
    background_tasks: BackgroundTasks,
    excel_gen: ExcelGenerator = Depends(get_excel_generator)
):
    """Генерация Excel отчета по анализу КП"""
    try:
        logger.info(f"Generating Excel report for analysis_id: {request.analysis_id}")
        
        # Генерация отчета
        report_path = await excel_gen.generate_kp_analysis_report(
            analysis_id=request.analysis_id,
            include_charts=request.include_charts,
            include_raw_data=request.include_raw_data
        )
        
        return ReportGenerationResponse(
            report_id=request.analysis_id,
            report_type="excel",
            file_path=report_path,
            download_url=f"/download/excel/{Path(report_path).name}",
            status="completed",
            generated_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error generating Excel report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

# Скачивание сгенерированного отчета
@app.get("/download/pdf/{filename}")
async def download_pdf_report(filename: str):
    """Скачивание PDF отчета"""
    file_path = Path("data/reports") / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename
    )

@app.get("/download/excel/{filename}")
async def download_excel_report(filename: str):
    """Скачивание Excel отчета"""
    file_path = Path("data/exports") / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename
    )

# Управление шаблонами
@app.get("/templates")
async def list_templates(
    template_mgr: TemplateManager = Depends(get_template_manager)
):
    """Список доступных шаблонов отчетов"""
    templates = await template_mgr.list_templates()
    return {"templates": templates}

@app.post("/templates", response_model=ReportTemplateResponse)
async def create_template(
    request: ReportTemplateRequest,
    template_mgr: TemplateManager = Depends(get_template_manager)
):
    """Создание нового шаблона отчета"""
    try:
        template_id = await template_mgr.create_template(
            name=request.name,
            description=request.description,
            template_data=request.template_data,
            report_type=request.report_type
        )
        
        return ReportTemplateResponse(
            template_id=template_id,
            name=request.name,
            status="created",
            created_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Template creation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8005,
        reload=True,
        log_level="info"
    )