"""
Общие настройки конфигурации для всех микросервисов
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class BaseServiceSettings(BaseSettings):
    """Базовые настройки для всех микросервисов"""
    
    # Database - ИСПРАВЛЕНО: используем переменные окружения
    postgres_url: str = os.getenv(
        "POSTGRES_URL", 
        os.getenv("DATABASE_URL", "postgresql://devassist:devassist_password@localhost:5432/devassist_pro")
    )
    
    # Redis - ИСПРАВЛЕНО: используем переменные окружения
    redis_url: str = os.getenv(
        "REDIS_URL", 
        "redis://:redis_password@localhost:6379/0"
    )
    
    # Environment
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Security - КРИТИЧНО: используем переменные окружения
    jwt_secret_key: str = os.getenv(
        "JWT_SECRET_KEY", 
        "your_jwt_secret_key_change_in_production"  # Fallback только для dev
    )
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))
    
    # CORS - используем переменные окружения
    allowed_origins: str = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3000,http://localhost:8000"
    )
    allowed_methods: str = os.getenv(
        "ALLOWED_METHODS", 
        "GET,POST,PUT,DELETE,OPTIONS"
    )
    allowed_headers: str = os.getenv("ALLOWED_HEADERS", "*")
    
    # Rate Limiting
    rate_limit_requests: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    rate_limit_window: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    
    # Monitoring
    sentry_dsn: Optional[str] = os.getenv("SENTRY_DSN")
    
    class Config:
        env_file = ".env"
        extra = "ignore"
        case_sensitive = False
        extra = "ignore"  # Игнорировать дополнительные поля из переменных окружения
    
    def __post_init__(self):
        """Валидация настроек после инициализации"""
        # КРИТИЧНО: Проверка что в production не используются дефолтные значения
        if self.environment == 'production':
            if self.jwt_secret_key == 'your_jwt_secret_key_change_in_production':
                raise ValueError("🚨 КРИТИЧЕСКАЯ ОШИБКА: JWT_SECRET_KEY не может быть дефолтным в production!")
            if 'devassist_password' in self.postgres_url:
                raise ValueError("🚨 КРИТИЧЕСКАЯ ОШИБКА: DATABASE_URL не может содержать дефолтный пароль в production!")
            if 'redis_password' in self.redis_url:
                raise ValueError("🚨 КРИТИЧЕСКАЯ ОШИБКА: REDIS_URL не может содержать дефолтный пароль в production!")
            # ИСПРАВЛЕНО: Убираем проверку localhost, так как может быть валидная конфигурация
            # if 'localhost' in self.allowed_origins:
            #     raise ValueError("🚨 КРИТИЧЕСКАЯ ОШИБКА: ALLOWED_ORIGINS не может содержать localhost в production!")

class DatabaseSettings(BaseSettings):
    """Настройки базы данных"""
    
    postgres_url: str = os.getenv("POSTGRES_URL", os.getenv("DATABASE_URL", ""))
    postgres_pool_size: int = int(os.getenv("DB_POOL_SIZE", "10"))
    postgres_max_overflow: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    postgres_pool_timeout: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    postgres_pool_recycle: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))
    
    class Config:
        env_file = ".env"
        extra = "ignore"

class RedisSettings(BaseSettings):
    """Настройки Redis"""
    
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_pool_size: int = int(os.getenv("REDIS_POOL_SIZE", "10"))
    redis_timeout: int = int(os.getenv("REDIS_TIMEOUT", "5"))
    
    class Config:
        env_file = ".env"
        extra = "ignore"

class AISettings(BaseSettings):
    """Настройки для AI провайдеров"""
    
    # OpenAI
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    openai_timeout: int = int(os.getenv("OPENAI_TIMEOUT", "60"))
    
    # Anthropic
    anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    anthropic_base_url: str = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
    anthropic_timeout: int = int(os.getenv("ANTHROPIC_TIMEOUT", "60"))
    
    # Google
    google_api_key: Optional[str] = os.getenv("GOOGLE_API_KEY")
    google_base_url: str = os.getenv("GOOGLE_BASE_URL", "https://generativelanguage.googleapis.com")
    google_timeout: int = int(os.getenv("GOOGLE_TIMEOUT", "60"))
    
    # Default model configurations
    default_text_model: str = "gpt-4"
    default_analysis_model: str = "claude-3-sonnet-20240229"
    default_report_model: str = "gpt-4"
    
    # Cost limits (USD per month)
    monthly_cost_limit: float = float(os.getenv("MONTHLY_COST_LIMIT", "1000.0"))
    user_daily_cost_limit: float = float(os.getenv("USER_DAILY_COST_LIMIT", "10.0"))
    
    class Config:
        env_file = ".env"
        extra = "ignore"

class S3Settings(BaseSettings):
    """Настройки S3 хранилища"""
    
    s3_bucket_name: Optional[str] = os.getenv("S3_BUCKET_NAME")
    s3_access_key: Optional[str] = os.getenv("S3_ACCESS_KEY")
    s3_secret_key: Optional[str] = os.getenv("S3_SECRET_KEY")
    s3_endpoint_url: str = os.getenv("S3_ENDPOINT_URL", "https://s3.amazonaws.com")
    s3_region: str = os.getenv("S3_REGION", "us-east-1")
    
    class Config:
        env_file = ".env"
        extra = "ignore"

# Глобальные настройки
settings = BaseServiceSettings()
db_settings = DatabaseSettings()
redis_settings = RedisSettings()
ai_settings = AISettings()
s3_settings = S3Settings()