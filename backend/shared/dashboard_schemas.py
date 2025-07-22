"""
Dashboard schemas для DevAssist Pro
Согласно ТЗ раздел 2.2 - Требования к главной странице портала
"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

# Enums согласно ТЗ
class ModuleStatus(str, Enum):
    ACTIVE = "active"
    COMING_SOON = "coming_soon" 
    BETA = "beta"

class ModuleId(str, Enum):
    KP_ANALYZER = "kp-analyzer"
    TZ_GENERATOR = "tz-generator"
    PROJECT_EVALUATION = "project-evaluation"
    MARKETING_PLANNER = "marketing-planner"
    KNOWLEDGE_BASE = "knowledge-base"

# ModuleStats согласно ТЗ
class ModuleStats(BaseModel):
    analyzed: Optional[int] = None
    saved_hours: Optional[float] = None
    accuracy: Optional[float] = None
    last_used: Optional[datetime] = None
    total_documents: Optional[int] = None
    active_projects: Optional[int] = None

# DashboardModule согласно ТЗ раздел 2.2
class DashboardModule(BaseModel):
    id: str
    title: str
    description: str
    icon: str  # Название иконки
    status: ModuleStatus
    ai_models: List[str]  # Используемые AI модели
    last_used: Optional[datetime] = None
    quick_stats: Optional[ModuleStats] = None
    
    class Config:
        from_attributes = True

# Dashboard statistics
class DashboardStatistics(BaseModel):
    total_projects: int
    total_documents: int
    total_analyses: int
    ai_cost_current_month: float
    active_users: int
    recent_activity_count: int

# AI Models Status согласно ТЗ
class AIModelStatus(BaseModel):
    provider: str  # openai, anthropic, google
    model_name: str
    status: str  # available, unavailable, rate_limited
    response_time: Optional[float] = None  # в секундах
    cost_per_token: Optional[float] = None
    tokens_used_today: int = 0
    cost_today: float = 0.0

# Recent Activity согласно ТЗ
class RecentActivity(BaseModel):
    id: int
    type: str  # document_upload, analysis_complete, report_generated
    title: str
    description: str
    user_name: str
    timestamp: datetime
    module_id: Optional[str] = None
    project_id: Optional[int] = None

# Dashboard Response согласно ТЗ
class DashboardResponse(BaseModel):
    welcome_message: str
    modules: List[DashboardModule]
    statistics: DashboardStatistics
    ai_models_status: List[AIModelStatus]
    recent_activities: List[RecentActivity]
    user_organizations: List[Dict[str, Any]]

# Search результаты
class SearchResult(BaseModel):
    type: str  # project, document, analysis, user
    id: int
    title: str
    description: str
    module_id: Optional[str] = None
    project_id: Optional[int] = None
    created_at: datetime
    relevance_score: float

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResult]
    search_time: float  # в секундах

# Notifications согласно ТЗ
class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success" 
    WARNING = "warning"
    ERROR = "error"

class Notification(BaseModel):
    id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool = False
    created_at: datetime
    expires_at: Optional[datetime] = None
    action_url: Optional[str] = None
    action_text: Optional[str] = None

class NotificationsResponse(BaseModel):
    notifications: List[Notification]
    unread_count: int
    total_count: int

# Module configuration для админов
class ModuleConfiguration(BaseModel):
    module_id: str
    is_enabled: bool
    ai_models: List[str]
    settings: Dict[str, Any]
    access_level: str  # public, premium, enterprise

# Quick actions согласно ТЗ
class QuickAction(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    module_id: str
    url: str
    requires_auth: bool = True

# User dashboard preferences
class DashboardPreferences(BaseModel):
    theme: str = "light"  # light, dark, auto
    language: str = "ru"  # ru, en
    show_welcome_tour: bool = True
    default_module: Optional[str] = None
    notifications_enabled: bool = True
    email_notifications: bool = False

# Analytics для dashboard согласно ТЗ
class DashboardAnalytics(BaseModel):
    page_views: int
    unique_visitors: int
    avg_session_duration: float  # в секундах
    bounce_rate: float  # в процентах
    most_used_modules: List[Dict[str, Any]]
    peak_usage_hours: List[int]  # часы пиковой нагрузки