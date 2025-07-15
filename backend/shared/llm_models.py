"""
Модели базы данных для LLM Service DevAssist Pro
Согласно ТЗ Этап 4: AI Integrations
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, Float, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from .models import Base, TimestampMixin
import enum

class AIProviderEnum(enum.Enum):
    """Enum для AI провайдеров"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    YANDEX = "yandex"
    GIGACHAT = "gigachat"
    LOCAL = "local"

class TaskTypeEnum(enum.Enum):
    """Enum для типов AI задач"""
    TEXT_ANALYSIS = "text_analysis"
    DATA_EXTRACTION = "data_extraction"
    DOCUMENT_CONVERSION = "document_conversion"
    REPORT_GENERATION = "report_generation"
    RISK_ASSESSMENT = "risk_assessment"
    RECOMMENDATION = "recommendation"
    COMPARISON = "comparison"
    SEARCH = "search"

class AIModel(Base, TimestampMixin):
    """Модель конфигурации AI моделей"""
    __tablename__ = "ai_models"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(Enum(AIProviderEnum), nullable=False)
    model_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=False)
    max_tokens = Column(Integer, default=4096)
    temperature = Column(Float, default=0.7)
    top_p = Column(Float, default=1.0)
    cost_per_1k_input = Column(Float, default=0.0)
    cost_per_1k_output = Column(Float, default=0.0)
    supports_streaming = Column(Boolean, default=True)
    supports_functions = Column(Boolean, default=False)
    context_window = Column(Integer, default=4096)
    is_active = Column(Boolean, default=True)
    
    # Связи
    requests = relationship("AIRequest", back_populates="model")

class AIRequest(Base, TimestampMixin):
    """Модель запросов к AI"""
    __tablename__ = "ai_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(50), unique=True, index=True, nullable=False)
    task_type = Column(Enum(TaskTypeEnum), nullable=False)
    content_hash = Column(String(64), index=True, nullable=False)  # SHA256 для кеширования
    
    # Параметры запроса
    model_id = Column(Integer, ForeignKey("ai_models.id"), nullable=False)
    system_prompt = Column(Text, nullable=True)
    user_prompt = Column(Text, nullable=False)
    temperature = Column(Float, nullable=True)
    max_tokens = Column(Integer, nullable=True)
    stream = Column(Boolean, default=False)
    
    # Результат
    response_content = Column(Text, nullable=True)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    response_time = Column(Float, nullable=True)
    
    # Статус
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Пользователь и организация
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Метаданные
    metadata = Column(JSON, nullable=True)
    
    # Связи
    model = relationship("AIModel", back_populates="requests")
    user = relationship("User")
    organization = relationship("Organization")

class PromptTemplate(Base, TimestampMixin):
    """Модель шаблонов промптов"""
    __tablename__ = "prompt_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    task_type = Column(Enum(TaskTypeEnum), nullable=False)
    system_prompt = Column(Text, nullable=False)
    user_prompt_template = Column(Text, nullable=False)
    variables = Column(JSON, nullable=False)  # Список переменных
    version = Column(String(20), default="1.0")
    description = Column(Text, nullable=True)
    examples = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Автор шаблона
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by = relationship("User")

class AIConfiguration(Base, TimestampMixin):
    """Модель конфигурации AI для пользователей/организаций"""
    __tablename__ = "ai_configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Конфигурация моделей по умолчанию
    default_models = Column(JSON, nullable=False)  # Dict[TaskType, model_id]
    model_overrides = Column(JSON, nullable=True)  # Переопределения для модулей
    
    # Лимиты
    daily_cost_limit = Column(Float, default=10.0)
    monthly_cost_limit = Column(Float, default=100.0)
    daily_request_limit = Column(Integer, default=1000)
    
    # Настройки
    performance_mode = Column(String(20), default="balanced")  # quality, balanced, speed
    enable_fallback = Column(Boolean, default=True)
    fallback_order = Column(JSON, nullable=True)  # List[AIProvider]
    max_retries = Column(Integer, default=3)
    timeout_seconds = Column(Integer, default=30)
    
    # Связи
    user = relationship("User")
    organization = relationship("Organization")

class ProviderStatus(Base, TimestampMixin):
    """Модель статуса AI провайдеров"""
    __tablename__ = "provider_status"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(Enum(AIProviderEnum), unique=True, nullable=False)
    is_available = Column(Boolean, default=True)
    last_check = Column(DateTime(timezone=True), server_default=func.now())
    response_time = Column(Float, nullable=True)
    error_count = Column(Integer, default=0)
    rate_limit_remaining = Column(Integer, nullable=True)
    rate_limit_reset = Column(DateTime(timezone=True), nullable=True)
    models_available = Column(JSON, nullable=True)  # List[str]
    
    # Статистика за день
    requests_today = Column(Integer, default=0)
    cost_today = Column(Float, default=0.0)
    errors_today = Column(Integer, default=0)

class UsageStatistics(Base):
    """Модель статистики использования AI (агрегированная по дням)"""
    __tablename__ = "usage_statistics"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    provider = Column(Enum(AIProviderEnum), nullable=False)
    task_type = Column(Enum(TaskTypeEnum), nullable=False)
    
    # Метрики
    total_requests = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    total_cost = Column(Float, default=0.0)
    average_response_time = Column(Float, default=0.0)
    error_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связи
    user = relationship("User")
    organization = relationship("Organization")

class KPAnalysis(Base, TimestampMixin):
    """Модель для хранения результатов анализа КП согласно ТЗ раздел 4.2"""
    __tablename__ = "kp_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Входные данные
    tz_content_hash = Column(String(64), nullable=False)
    kp_content_hash = Column(String(64), nullable=False)
    analysis_type = Column(String(20), nullable=False)  # basic, detailed, full
    
    # Результаты анализа
    tz_requirements = Column(JSON, nullable=True)
    kp_data = Column(JSON, nullable=True)
    compliance_score = Column(Float, nullable=True)
    compliance_details = Column(JSON, nullable=True)
    risks_identified = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    # Метаданные обработки
    processing_time = Column(Float, nullable=True)
    models_used = Column(JSON, nullable=True)  # List[str]
    total_cost = Column(Float, default=0.0)
    
    # Статус
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    
    # Пользователь
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Связи
    user = relationship("User")
    organization = relationship("Organization")

class PromptUsage(Base, TimestampMixin):
    """Модель отслеживания использования промптов"""
    __tablename__ = "prompt_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("prompt_templates.id"), nullable=False)
    request_id = Column(Integer, ForeignKey("ai_requests.id"), nullable=False)
    variables_used = Column(JSON, nullable=True)  # Значения переменных
    success = Column(Boolean, default=True)
    
    # Связи
    template = relationship("PromptTemplate")
    request = relationship("AIRequest")