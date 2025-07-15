"""
Configuration для API Gateway
"""
import os
from typing import List, Dict
from pydantic import BaseSettings, Field


class GatewaySettings(BaseSettings):
    """Настройки API Gateway"""
    
    # Service Configuration
    SERVICE_NAME: str = "api-gateway"
    SERVICE_VERSION: str = "1.0.0"
    HOST: str = Field(default="0.0.0.0", env="GATEWAY_HOST")
    PORT: int = Field(default=8000, env="GATEWAY_PORT")
    RELOAD: bool = Field(default=False, env="GATEWAY_RELOAD")
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        env="ALLOWED_ORIGINS"
    )
    ALLOWED_METHODS: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        env="ALLOWED_METHODS"
    )
    ALLOWED_HEADERS: List[str] = Field(default=["*"], env="ALLOWED_HEADERS")
    
    # Security
    TRUSTED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1", "*.devassist.pro"],
        env="TRUSTED_HOSTS"
    )
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds
    
    # Timeouts
    DEFAULT_TIMEOUT: int = Field(default=30, env="DEFAULT_TIMEOUT")  # seconds
    UPLOAD_TIMEOUT: int = Field(default=300, env="UPLOAD_TIMEOUT")  # 5 minutes
    ANALYSIS_TIMEOUT: int = Field(default=120, env="ANALYSIS_TIMEOUT")  # 2 minutes
    
    # Microservices URLs
    AUTH_SERVICE_URL: str = Field(default="http://localhost:8001", env="AUTH_SERVICE_URL")
    LLM_SERVICE_URL: str = Field(default="http://localhost:8002", env="LLM_SERVICE_URL")
    DOCUMENTS_SERVICE_URL: str = Field(default="http://localhost:8003", env="DOCUMENTS_SERVICE_URL")
    ANALYTICS_SERVICE_URL: str = Field(default="http://localhost:8004", env="ANALYTICS_SERVICE_URL")
    REPORTS_SERVICE_URL: str = Field(default="http://localhost:8005", env="REPORTS_SERVICE_URL")
    DASHBOARD_SERVICE_URL: str = Field(default="http://localhost:8006", env="DASHBOARD_SERVICE_URL")
    
    # Load Balancing (для будущего использования)
    ENABLE_LOAD_BALANCING: bool = Field(default=False, env="ENABLE_LOAD_BALANCING")
    HEALTH_CHECK_INTERVAL: int = Field(default=30, env="HEALTH_CHECK_INTERVAL")  # seconds
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    ENABLE_ACCESS_LOGS: bool = Field(default=True, env="ENABLE_ACCESS_LOGS")
    
    # Monitoring
    ENABLE_METRICS: bool = Field(default=False, env="ENABLE_METRICS")
    METRICS_PORT: int = Field(default=9090, env="METRICS_PORT")
    
    # Circuit Breaker Settings
    CIRCUIT_BREAKER_ENABLED: bool = Field(default=True, env="CIRCUIT_BREAKER_ENABLED")
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: int = Field(default=5, env="CIRCUIT_BREAKER_FAILURE_THRESHOLD")
    CIRCUIT_BREAKER_RECOVERY_TIMEOUT: int = Field(default=60, env="CIRCUIT_BREAKER_RECOVERY_TIMEOUT")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Глобальный экземпляр настроек
settings = GatewaySettings()


# Service Configuration
SERVICES = {
    "auth": {
        "url": settings.AUTH_SERVICE_URL,
        "timeout": settings.DEFAULT_TIMEOUT,
        "critical": True,  # Критический сервис
        "health_endpoint": "/health"
    },
    "llm": {
        "url": settings.LLM_SERVICE_URL,
        "timeout": settings.ANALYSIS_TIMEOUT,
        "critical": True,
        "health_endpoint": "/health"
    },
    "documents": {
        "url": settings.DOCUMENTS_SERVICE_URL,
        "timeout": settings.UPLOAD_TIMEOUT,
        "critical": True,
        "health_endpoint": "/health"
    },
    "analytics": {
        "url": settings.ANALYTICS_SERVICE_URL,
        "timeout": settings.DEFAULT_TIMEOUT,
        "critical": False,
        "health_endpoint": "/health"
    },
    "reports": {
        "url": settings.REPORTS_SERVICE_URL,
        "timeout": settings.ANALYSIS_TIMEOUT,
        "critical": False,
        "health_endpoint": "/health"
    },
    "dashboard": {
        "url": settings.DASHBOARD_SERVICE_URL,
        "timeout": settings.DEFAULT_TIMEOUT,
        "critical": False,
        "health_endpoint": "/health"
    }
}

# Route Patterns для специализированных эндпоинтов
ROUTE_PATTERNS = {
    "kp_analyzer": {
        "/api/kp-analyzer/upload": {
            "target_service": "documents",
            "target_path": "/upload",
            "method": "POST",
            "timeout": settings.UPLOAD_TIMEOUT
        },
        "/api/kp-analyzer/analyze": {
            "target_service": "llm",
            "target_path": "/analyze/kp",
            "method": "POST",
            "timeout": settings.ANALYSIS_TIMEOUT
        },
        "/api/kp-analyzer/documents": {
            "target_service": "documents",
            "target_path": "/documents",
            "method": "GET",
            "timeout": settings.DEFAULT_TIMEOUT
        },
        "/api/kp-analyzer/documents/{document_id}/content": {
            "target_service": "documents",
            "target_path": "/documents/{document_id}/content",
            "method": "GET",
            "timeout": settings.DEFAULT_TIMEOUT
        }
    }
}

# Headers to exclude from proxying
EXCLUDED_HEADERS = {
    "host",
    "content-length",
    "connection",
    "transfer-encoding",
    "upgrade"
}

# Error Response Templates
ERROR_RESPONSES = {
    "service_unavailable": {
        "error": "service_unavailable",
        "message": "Сервис временно недоступен",
        "code": 503
    },
    "timeout": {
        "error": "timeout", 
        "message": "Превышено время ожидания ответа",
        "code": 504
    },
    "not_found": {
        "error": "not_found",
        "message": "Запрашиваемый ресурс не найден",
        "code": 404
    },
    "bad_gateway": {
        "error": "bad_gateway",
        "message": "Ошибка связи с внутренним сервисом",
        "code": 502
    }
}