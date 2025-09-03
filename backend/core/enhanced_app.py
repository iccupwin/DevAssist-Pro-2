#!/usr/bin/env python3
"""
Enhanced Application - ИНТЕГРАЦИЯ ВСЕХ УЛУЧШЕНИЙ
Интеграция AI анализа, валидации, безопасности и мониторинга
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Импорты новых систем
from .validation import file_validator, validate_request_data, create_validation_response
from .security import (
    security_middleware, get_current_user, verify_admin_access, 
    create_security_headers, audit_logger
)
from .monitoring import (
    performance_tracker, metrics_collector, MetricsMiddleware,
    get_health_status, get_system_metrics, get_all_metrics, get_prometheus_metrics,
    init_monitoring
)

# Существующие менеджеры
from backend.real_managers import documents_manager, reports_manager

logger = logging.getLogger(__name__)

class EnhancedAPI:
    """Расширенное API с интегрированными системами"""
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.setup_middleware()
        self.setup_routes()
        
    def setup_middleware(self):
        """Настройка middleware"""
        
        # Middleware мониторинга
        self.app.add_middleware(MetricsMiddleware)
        
        # CORS middleware с безопасными заголовками
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000", "http://localhost:3001"],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE"],
            allow_headers=["*"],
        )
        
        # Добавление заголовков безопасности ко всем ответам
        @self.app.middleware("http")
        async def add_security_headers(request: Request, call_next):
            response = await call_next(request)
            
            # Добавляем заголовки безопасности
            security_headers = create_security_headers()
            for header, value in security_headers.items():
                response.headers[header] = value
                
            return response
    
    def setup_routes(self):
        """Настройка маршрутов API"""
        
        # ===== СИСТЕМА МОНИТОРИНГА =====
        
        @self.app.get("/health")
        async def health_check():
            """Расширенная проверка состояния системы"""
            return await get_health_status()
        
        @self.app.get("/metrics")
        async def prometheus_metrics():
            """Метрики в формате Prometheus"""
            metrics = await get_prometheus_metrics()
            return Response(content=metrics, media_type="text/plain")
        
        @self.app.get("/api/monitoring/system")
        async def system_metrics(current_user: Dict = Depends(verify_admin_access)):
            """Системные метрики (только для админов)"""
            return await get_system_metrics()
        
        @self.app.get("/api/monitoring/all")
        async def all_metrics(current_user: Dict = Depends(verify_admin_access)):
            """Все метрики системы"""
            return await get_all_metrics()
        
        # ===== ДОКУМЕНТЫ С ВАЛИДАЦИЕЙ =====
        
        @self.app.post("/api/documents/upload")
        async def upload_document_enhanced(
            request: Request,
            file: UploadFile = File(...),
            document_type: str = "kp",
            description: Optional[str] = None,
            current_user: Dict = Depends(get_current_user)
        ):
            """Загрузка документа с полной валидацией"""
            
            client_ip = security_middleware._get_client_ip(request)
            user_id = current_user.get("user_id")
            
            try:
                # Валидация файла
                is_valid, validation_errors = await file_validator.validate_upload_file(file)
                if not is_valid:
                    audit_logger.log_action(
                        user_id, "UPLOAD_FAILED", "documents", client_ip,
                        request_data={"filename": file.filename, "errors": validation_errors},
                        success=False, error_message="File validation failed"
                    )
                    raise HTTPException(status_code=400, detail={
                        "message": "File validation failed",
                        "errors": validation_errors
                    })
                
                # Валидация запроса
                request_data = {
                    "document_type": document_type,
                    "description": description
                }
                validation_errors = validate_request_data(request_data, "document_upload")
                if validation_errors:
                    return JSONResponse(
                        status_code=400,
                        content=create_validation_response(validation_errors)
                    )
                
                # Запись метрик
                start_time = datetime.now()
                performance_tracker.start_request(f"upload_{user_id}", "document_upload")
                
                # Загрузка документа
                result = await documents_manager.upload_file(file)
                result["document_type"] = document_type
                result["description"] = description
                result["uploaded_by"] = user_id
                
                # Завершение метрик
                processing_time = (datetime.now() - start_time).total_seconds()
                performance_tracker.end_request(f"upload_{user_id}", "document_upload", processing_time, 200)
                performance_tracker.record_document_processing(document_type, processing_time)
                
                # Аудит успешной загрузки
                audit_logger.log_action(
                    user_id, "UPLOAD_SUCCESS", "documents", client_ip,
                    request_data={
                        "document_id": result["document_id"],
                        "filename": file.filename,
                        "size": file.size
                    }
                )
                
                return JSONResponse(content={
                    "success": True,
                    "data": result,
                    "message": "Document uploaded successfully"
                })
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Document upload error: {str(e)}")
                performance_tracker.record_error("DocumentUploadError", "document_upload")
                
                audit_logger.log_action(
                    user_id, "UPLOAD_ERROR", "documents", client_ip,
                    success=False, error_message=str(e)
                )
                
                raise HTTPException(status_code=500, detail={
                    "message": "Internal server error during upload",
                    "error": str(e)
                })
        
        @self.app.post("/api/documents/{document_id}/analyze")
        async def analyze_document_enhanced(
            document_id: str,
            request: Request,
            analysis_type: str = "standard",
            include_recommendations: bool = True,
            current_user: Dict = Depends(get_current_user)
        ):
            """Расширенный анализ документа с бизнес-логикой"""
            
            client_ip = security_middleware._get_client_ip(request)
            user_id = current_user.get("user_id")
            
            try:
                # Валидация запроса
                request_data = {
                    "document_id": document_id,
                    "analysis_type": analysis_type
                }
                validation_errors = validate_request_data(request_data, "kp_analysis")
                if validation_errors:
                    return JSONResponse(
                        status_code=400,
                        content=create_validation_response(validation_errors)
                    )
                
                # Запись метрик
                start_time = datetime.now()
                performance_tracker.start_request(f"analysis_{user_id}", "document_analysis")
                
                # Выполнение анализа
                analysis_result = await documents_manager.analyze_document(document_id)
                
                # Дополнительная обработка результата
                if include_recommendations and analysis_result.get("recommendations"):
                    analysis_result["recommendation_count"] = len(analysis_result["recommendations"])
                
                analysis_result["analysis_type"] = analysis_type
                analysis_result["analyzed_by"] = user_id
                analysis_result["client_info"] = {
                    "ip": client_ip,
                    "user_agent": request.headers.get("user-agent", "unknown")
                }
                
                # Завершение метрик
                processing_time = (datetime.now() - start_time).total_seconds()
                performance_tracker.end_request(f"analysis_{user_id}", "document_analysis", processing_time, 200)
                
                # Аудит успешного анализа
                audit_logger.log_action(
                    user_id, "ANALYSIS_SUCCESS", "documents", client_ip,
                    request_data={
                        "document_id": document_id,
                        "analysis_id": analysis_result.get("analysis_id"),
                        "overall_score": analysis_result.get("overall_score", 0)
                    }
                )
                
                return JSONResponse(content={
                    "success": True,
                    "data": analysis_result,
                    "processing_time": processing_time,
                    "message": "Document analyzed successfully"
                })
                
            except Exception as e:
                logger.error(f"Document analysis error: {str(e)}")
                performance_tracker.record_error("DocumentAnalysisError", "document_analysis")
                
                audit_logger.log_action(
                    user_id, "ANALYSIS_ERROR", "documents", client_ip,
                    success=False, error_message=str(e)
                )
                
                raise HTTPException(status_code=500, detail={
                    "message": "Analysis failed",
                    "error": str(e)
                })
        
        # ===== ОТЧЕТЫ =====
        
        @self.app.post("/api/reports/generate/{report_type}")
        async def generate_report_enhanced(
            report_type: str,
            analysis_id: str,
            request: Request,
            current_user: Dict = Depends(get_current_user)
        ):
            """Генерация отчетов с метриками"""
            
            client_ip = security_middleware._get_client_ip(request)
            user_id = current_user.get("user_id")
            
            try:
                # Валидация
                if report_type not in ["pdf", "excel"]:
                    raise HTTPException(status_code=400, detail="Invalid report type")
                
                # Метрики
                start_time = datetime.now()
                performance_tracker.start_request(f"report_{user_id}", "report_generation")
                
                # Генерация отчета
                if report_type == "pdf":
                    filename = await reports_manager.generate_pdf_report(analysis_id)
                else:
                    filename = await reports_manager.generate_excel_report(analysis_id)
                
                # Завершение метрик
                processing_time = (datetime.now() - start_time).total_seconds()
                performance_tracker.end_request(f"report_{user_id}", "report_generation", processing_time, 200)
                performance_tracker.record_report_generation()
                
                # Аудит
                audit_logger.log_action(
                    user_id, "REPORT_GENERATED", "reports", client_ip,
                    request_data={
                        "analysis_id": analysis_id,
                        "report_type": report_type,
                        "filename": filename
                    }
                )
                
                return JSONResponse(content={
                    "success": True,
                    "data": {
                        "filename": filename,
                        "report_type": report_type,
                        "analysis_id": analysis_id,
                        "download_url": f"/api/reports/download/{report_type}/{filename}"
                    },
                    "processing_time": processing_time,
                    "message": f"{report_type.upper()} report generated successfully"
                })
                
            except Exception as e:
                logger.error(f"Report generation error: {str(e)}")
                performance_tracker.record_error("ReportGenerationError", "report_generation")
                
                audit_logger.log_action(
                    user_id, "REPORT_ERROR", "reports", client_ip,
                    success=False, error_message=str(e)
                )
                
                raise HTTPException(status_code=500, detail={
                    "message": "Report generation failed",
                    "error": str(e)
                })
        
        # ===== АНАЛИТИКА =====
        
        @self.app.get("/api/analytics/dashboard")
        async def dashboard_analytics(
            current_user: Dict = Depends(get_current_user)
        ):
            """Аналитика для дашборда"""
            
            try:
                # Сбор метрик приложения
                app_metrics = await metrics_collector.collect_application_metrics()
                business_metrics = await metrics_collector.collect_business_metrics()
                
                dashboard_data = {
                    "user_id": current_user.get("user_id"),
                    "timestamp": datetime.now().isoformat(),
                    "metrics": {
                        "total_documents": app_metrics.documents_processed,
                        "total_reports": app_metrics.reports_generated,
                        "average_response_time": app_metrics.average_response_time,
                        "error_rate": app_metrics.error_rate,
                        "system_health": "healthy"  # TODO: calculate from system metrics
                    },
                    "recent_activity": {
                        "documents_today": business_metrics.documents_analyzed_today,
                        "active_users": app_metrics.active_users,
                        "success_rate": business_metrics.success_rate
                    }
                }
                
                return JSONResponse(content={
                    "success": True,
                    "data": dashboard_data
                })
                
            except Exception as e:
                logger.error(f"Dashboard analytics error: {str(e)}")
                raise HTTPException(status_code=500, detail={
                    "message": "Failed to load dashboard analytics",
                    "error": str(e)
                })

# Функция инициализации расширенного приложения
async def create_enhanced_app(existing_app: FastAPI) -> FastAPI:
    """Создание расширенного приложения с интеграцией всех систем"""
    
    try:
        # Инициализация мониторинга
        await init_monitoring()
        
        # Создание расширенного API
        enhanced_api = EnhancedAPI(existing_app)
        
        logger.info("Enhanced application created successfully with:")
        logger.info("✅ AI Integration with business logic")
        logger.info("✅ User scenarios validation")
        logger.info("✅ Production security system")
        logger.info("✅ Monitoring and metrics")
        
        return existing_app
        
    except Exception as e:
        logger.error(f"Failed to create enhanced application: {str(e)}")
        raise

# Функция для проверки готовности системы
async def system_readiness_check() -> Dict[str, Any]:
    """Проверка готовности всех систем"""
    
    readiness_report = {
        "timestamp": datetime.now().isoformat(),
        "systems": {},
        "overall_ready": True
    }
    
    # Проверка AI интеграции
    try:
        from backend.services.documents.core.enhanced_ai_analyzer import enhanced_analyzer
        ai_ready = enhanced_analyzer is not None
        readiness_report["systems"]["ai_integration"] = {
            "ready": ai_ready,
            "fallback_mode": not enhanced_analyzer.use_real_api if ai_ready else True
        }
    except Exception as e:
        readiness_report["systems"]["ai_integration"] = {
            "ready": False,
            "error": str(e)
        }
        readiness_report["overall_ready"] = False
    
    # Проверка валидации
    try:
        validation_ready = file_validator is not None
        readiness_report["systems"]["validation"] = {"ready": validation_ready}
        if not validation_ready:
            readiness_report["overall_ready"] = False
    except Exception as e:
        readiness_report["systems"]["validation"] = {
            "ready": False,
            "error": str(e)
        }
        readiness_report["overall_ready"] = False
    
    # Проверка безопасности
    try:
        security_ready = security_middleware is not None
        readiness_report["systems"]["security"] = {"ready": security_ready}
        if not security_ready:
            readiness_report["overall_ready"] = False
    except Exception as e:
        readiness_report["systems"]["security"] = {
            "ready": False, 
            "error": str(e)
        }
        readiness_report["overall_ready"] = False
    
    # Проверка мониторинга
    try:
        monitoring_ready = metrics_collector is not None
        readiness_report["systems"]["monitoring"] = {"ready": monitoring_ready}
        if not monitoring_ready:
            readiness_report["overall_ready"] = False
    except Exception as e:
        readiness_report["systems"]["monitoring"] = {
            "ready": False,
            "error": str(e)
        }
        readiness_report["overall_ready"] = False
    
    # Итоговая оценка готовности
    ready_count = sum(1 for system in readiness_report["systems"].values() if system.get("ready", False))
    total_count = len(readiness_report["systems"])
    readiness_report["readiness_percentage"] = (ready_count / total_count) * 100 if total_count > 0 else 0
    
    return readiness_report