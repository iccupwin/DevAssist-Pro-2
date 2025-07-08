"""
Общие настройки конфигурации для всех микросервисов
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class BaseServiceSettings(BaseSettings):
    """Базовые настройки для всех микросервисов"""
    
    # Database
    postgres_url: str = "postgresql://devassist:devassist_password@localhost:5432/devassist_pro"
    
    # Redis
    redis_url: str = "redis://:redis_password@localhost:6379/0"
    
    # Environment
    debug: bool = False
    environment: str = "development"
    log_level: str = "INFO"
    
    # Security
    jwt_secret_key: str = "your_jwt_secret_key_change_in_production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30
    
    # CORS
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: List[str] = ["*"]
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60
    
    # Monitoring
    sentry_dsn: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False

class DatabaseSettings(BaseSettings):
    """Настройки базы данных"""
    
    postgres_url: str
    postgres_pool_size: int = 10
    postgres_max_overflow: int = 20
    postgres_pool_timeout: int = 30
    postgres_pool_recycle: int = 3600
    
    class Config:
        env_file = ".env"

class RedisSettings(BaseSettings):
    """Настройки Redis"""
    
    redis_url: str
    redis_pool_size: int = 10
    redis_timeout: int = 5
    
    class Config:
        env_file = ".env"

class AISettings(BaseSettings):
    """Настройки для AI провайдеров"""
    
    # OpenAI
    openai_api_key: Optional[str] = None
    openai_base_url: str = "https://api.openai.com/v1"
    openai_timeout: int = 60
    
    # Anthropic
    anthropic_api_key: Optional[str] = None
    anthropic_base_url: str = "https://api.anthropic.com"
    anthropic_timeout: int = 60
    
    # Google
    google_api_key: Optional[str] = None
    google_base_url: str = "https://generativelanguage.googleapis.com"
    google_timeout: int = 60
    
    # Default model configurations
    default_text_model: str = "gpt-4"
    default_analysis_model: str = "claude-3-sonnet-20240229"
    default_report_model: str = "gpt-4"
    
    # Cost limits (USD per month)
    monthly_cost_limit: float = 1000.0
    user_daily_cost_limit: float = 10.0
    
    class Config:
        env_file = ".env"

class S3Settings(BaseSettings):
    """Настройки S3 хранилища"""
    
    s3_bucket_name: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None
    s3_endpoint_url: str = "https://s3.amazonaws.com"
    s3_region: str = "us-east-1"
    
    class Config:
        env_file = ".env"

# Глобальные настройки
settings = BaseServiceSettings()
db_settings = DatabaseSettings()
redis_settings = RedisSettings()
ai_settings = AISettings()
s3_settings = S3Settings()