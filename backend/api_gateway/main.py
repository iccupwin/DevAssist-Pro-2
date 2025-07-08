"""
DevAssist Pro API Gateway
Главная точка входа для всех API запросов
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import httpx
import time
import logging
from typing import Dict, Any
import os

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание FastAPI приложения
app = FastAPI(
    title="DevAssist Pro API Gateway",
    description="API Gateway для веб-портала DevAssist Pro",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=os.getenv("ALLOWED_METHODS", "GET,POST,PUT,DELETE,OPTIONS").split(","),
    allow_headers=["*"],
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.devassist.pro"]
)

# Конфигурация микросервисов
SERVICES = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://localhost:8001"),
    "dashboard": os.getenv("DASHBOARD_SERVICE_URL", "http://localhost:8006"),
    "llm": os.getenv("LLM_SERVICE_URL", "http://localhost:8002"),
    "documents": os.getenv("DOCUMENTS_SERVICE_URL", "http://localhost:8003"),
    "analytics": os.getenv("ANALYTICS_SERVICE_URL", "http://localhost:8004"),
    "reports": os.getenv("REPORTS_SERVICE_URL", "http://localhost:8005"),
}

# HTTP клиент для проксирования запросов
http_client = httpx.AsyncClient(timeout=30.0)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Middleware для отслеживания времени выполнения запросов"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.get("/")
async def root():
    """Корневой endpoint API Gateway"""
    return {
        "message": "DevAssist Pro API Gateway",
        "version": "1.0.0",
        "status": "running",
        "services": list(SERVICES.keys())
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    services_status = {}
    
    for service_name, service_url in SERVICES.items():
        try:
            response = await http_client.get(f"{service_url}/health", timeout=5.0)
            services_status[service_name] = {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "response_time": response.elapsed.total_seconds()
            }
        except Exception as e:
            services_status[service_name] = {
                "status": "unhealthy",
                "error": str(e)
            }
    
    return {
        "api_gateway": "healthy",
        "services": services_status
    }

async def proxy_request(service_name: str, path: str, request: Request):
    """Проксирование запросов к микросервисам"""
    service_url = SERVICES.get(service_name)
    if not service_url:
        raise HTTPException(status_code=404, detail=f"Service {service_name} not found")
    
    # Формирование URL для запроса
    target_url = f"{service_url}{path}"
    
    # Получение параметров запроса
    params = dict(request.query_params)
    
    # Получение заголовков (исключая hop-by-hop заголовки)
    headers = {
        key: value for key, value in request.headers.items()
        if key.lower() not in ["host", "content-length", "connection"]
    }
    
    try:
        # Получение тела запроса
        body = await request.body()
        
        # Выполнение запроса к микросервису
        response = await http_client.request(
            method=request.method,
            url=target_url,
            params=params,
            headers=headers,
            content=body
        )
        
        # Возврат ответа
        return JSONResponse(
            content=response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
            status_code=response.status_code,
            headers={key: value for key, value in response.headers.items() if key.lower() not in ["content-length", "connection"]}
        )
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"Service {service_name} timeout")
    except Exception as e:
        logger.error(f"Error proxying request to {service_name}: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Service {service_name} error")

# Специализированные эндпоинты для КП Анализатора
@app.post("/api/kp-analyzer/upload")
async def kp_analyzer_upload(request: Request):
    """Загрузка файлов для КП Анализатора"""
    return await proxy_request("documents", "/upload", request)

@app.post("/api/kp-analyzer/analyze")
async def kp_analyzer_analyze(request: Request):
    """Анализ КП против ТЗ"""
    return await proxy_request("llm", "/analyze/kp", request)

@app.get("/api/kp-analyzer/documents")
async def kp_analyzer_documents(request: Request):
    """Получение списка документов КП Анализатора"""
    return await proxy_request("documents", "/documents", request)

@app.get("/api/kp-analyzer/documents/{document_id}/content")
async def kp_analyzer_document_content(document_id: str, request: Request):
    """Получение содержимого документа"""
    return await proxy_request("documents", f"/documents/{document_id}/content", request)

# Маршруты для микросервисов
@app.api_route("/api/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def auth_service(path: str, request: Request):
    """Проксирование запросов к сервису авторизации"""
    return await proxy_request("auth", f"/{path}", request)

@app.api_route("/api/dashboard/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def dashboard_service(path: str, request: Request):
    """Проксирование запросов к сервису dashboard"""
    return await proxy_request("dashboard", f"/{path}", request)

@app.api_route("/api/llm/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def llm_service(path: str, request: Request):
    """Проксирование запросов к LLM сервису"""
    return await proxy_request("llm", f"/{path}", request)

@app.api_route("/api/documents/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def documents_service(path: str, request: Request):
    """Проксирование запросов к сервису документов"""
    return await proxy_request("documents", f"/{path}", request)

@app.api_route("/api/analytics/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def analytics_service(path: str, request: Request):
    """Проксирование запросов к сервису аналитики"""
    return await proxy_request("analytics", f"/{path}", request)

@app.api_route("/api/reports/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def reports_service(path: str, request: Request):
    """Проксирование запросов к сервису отчетов"""
    return await proxy_request("reports", f"/{path}", request)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Глобальный обработчик исключений"""
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("RELOAD", "false").lower() == "true"
    )