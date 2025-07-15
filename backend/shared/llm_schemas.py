"""
Схемы данных для LLM Service DevAssist Pro
Согласно ТЗ Этап 4: AI Integrations
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union, Literal
from datetime import datetime
from enum import Enum

class AIProvider(str, Enum):
    """Поддерживаемые AI провайдеры согласно ТЗ раздел 4.3"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    YANDEX = "yandex"
    GIGACHAT = "gigachat"
    LOCAL = "local"

class AIModel(BaseModel):
    """Конфигурация AI модели"""
    provider: AIProvider
    model_name: str
    display_name: str
    max_tokens: int = 4096
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)
    cost_per_1k_input: float = 0.0
    cost_per_1k_output: float = 0.0
    supports_streaming: bool = True
    supports_functions: bool = False
    context_window: int = 4096

class TaskType(str, Enum):
    """Типы AI задач согласно ТЗ"""
    TEXT_ANALYSIS = "text_analysis"
    DATA_EXTRACTION = "data_extraction" 
    DOCUMENT_CONVERSION = "document_conversion"
    REPORT_GENERATION = "report_generation"
    RISK_ASSESSMENT = "risk_assessment"
    RECOMMENDATION = "recommendation"
    COMPARISON = "comparison"
    SEARCH = "search"

class AIRequest(BaseModel):
    """Запрос к LLM сервису"""
    task_type: TaskType
    content: str
    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None
    model_override: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    stream: bool = False
    user_id: Optional[int] = None
    organization_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class AIResponse(BaseModel):
    """Ответ от LLM сервиса"""
    task_id: str
    content: str
    model_used: str
    provider_used: AIProvider
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    response_time: float = 0.0
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class StreamChunk(BaseModel):
    """Чанк для streaming ответа"""
    task_id: str
    chunk: str
    is_complete: bool = False
    tokens_used: int = 0
    error: Optional[str] = None

class PromptTemplate(BaseModel):
    """Шаблон промпта согласно ТЗ раздел 4.2.2"""
    name: str
    task_type: TaskType
    system_prompt: str
    user_prompt_template: str
    variables: List[str]
    version: str = "1.0"
    description: Optional[str] = None
    examples: Optional[List[Dict[str, str]]] = None

class AIConfiguration(BaseModel):
    """Конфигурация AI согласно ТЗ раздел 3.2"""
    default_models: Dict[TaskType, str]
    model_overrides: Optional[Dict[str, str]] = None
    cost_limits: Optional[Dict[str, float]] = None
    performance_mode: Literal["quality", "balanced", "speed"] = "balanced"
    enable_fallback: bool = True
    fallback_order: List[AIProvider] = [AIProvider.OPENAI, AIProvider.ANTHROPIC, AIProvider.GOOGLE]
    max_retries: int = 3
    timeout_seconds: int = 30

class UsageStatistics(BaseModel):
    """Статистика использования AI"""
    user_id: Optional[int] = None
    organization_id: Optional[int] = None
    period_start: datetime
    period_end: datetime
    total_requests: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    requests_by_provider: Dict[AIProvider, int] = {}
    tokens_by_provider: Dict[AIProvider, int] = {}
    cost_by_provider: Dict[AIProvider, float] = {}
    requests_by_task_type: Dict[TaskType, int] = {}
    average_response_time: float = 0.0
    error_rate: float = 0.0

class ProviderStatus(BaseModel):
    """Статус AI провайдера"""
    provider: AIProvider
    is_available: bool = True
    last_check: datetime
    response_time: Optional[float] = None
    error_count: int = 0
    rate_limit_remaining: Optional[int] = None
    rate_limit_reset: Optional[datetime] = None
    models_available: List[str] = []

class LLMHealth(BaseModel):
    """Health check для LLM сервиса"""
    service_status: Literal["healthy", "degraded", "unhealthy"]
    providers_status: Dict[AIProvider, ProviderStatus]
    active_models: List[str]
    total_requests_today: int = 0
    total_cost_today: float = 0.0
    average_response_time: float = 0.0
    uptime_percentage: float = 100.0
    last_updated: datetime

class KPAnalysisRequest(BaseModel):
    """Специализированный запрос для КП Анализатора согласно ТЗ раздел 4.2"""
    tz_content: str
    kp_content: str
    analysis_type: Literal["basic", "detailed", "full"]
    extract_requirements: bool = True
    compare_compliance: bool = True
    assess_risks: bool = True
    generate_recommendations: bool = True
    model_preference: Optional[str] = None

class KPAnalysisResponse(BaseModel):
    """Ответ анализа КП"""
    analysis_id: str
    tz_requirements: Dict[str, Any]
    kp_data: Dict[str, Any]
    compliance_score: float = Field(ge=0.0, le=1.0)
    compliance_details: List[Dict[str, Any]]
    risks_identified: List[Dict[str, Any]]
    recommendations: List[str]
    confidence_score: float = Field(ge=0.0, le=1.0)
    processing_time: float
    models_used: List[str]
    total_cost: float
    created_at: datetime

class ErrorResponse(BaseModel):
    """Стандартизированный ответ об ошибке"""
    error_code: str
    error_message: str
    details: Optional[Dict[str, Any]] = None
    retry_after: Optional[int] = None
    provider: Optional[AIProvider] = None
    model: Optional[str] = None
    timestamp: datetime