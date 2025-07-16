"""
Dashboard модели данных для DevAssist Pro
Согласно ТЗ раздел 2.2
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .models import Base, TimestampMixin

class DashboardModule(Base, TimestampMixin):
    """Модель модуля dashboard согласно ТЗ"""
    __tablename__ = "dashboard_modules"
    
    id = Column(String(50), primary_key=True)  # kp-analyzer, tz-generator, etc.
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default="coming_soon")  # active, coming_soon, beta
    ai_models = Column(JSON, nullable=False, default=list)  # Используемые AI модели
    is_enabled = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    access_level = Column(String(20), default="public", nullable=False)  # public, premium, enterprise
    settings = Column(JSON, nullable=True, default=dict)

class UserActivity(Base, TimestampMixin):
    """Модель активности пользователя"""
    __tablename__ = "user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Тип активности
    activity_type = Column(String(50), nullable=False)  # document_upload, analysis_complete, etc.
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Связанные объекты
    module_id = Column(String(50), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True)
    
    # Метаданные
    activity_metadata = Column(JSON, nullable=True, default=dict)
    
    # Связи
    user = relationship("User")
    organization = relationship("Organization")
    project = relationship("Project")
    document = relationship("Document")
    analysis = relationship("Analysis")

class Notification(Base, TimestampMixin):
    """Модель уведомлений"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Содержимое уведомления
    type = Column(String(20), nullable=False)  # info, success, warning, error
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Состояние
    is_read = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Время жизни
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Действие
    action_url = Column(String(500), nullable=True)
    action_text = Column(String(100), nullable=True)
    
    # Связанные объекты
    module_id = Column(String(50), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    # Связи
    user = relationship("User")
    organization = relationship("Organization")
    project = relationship("Project")

class DashboardPreference(Base, TimestampMixin):
    """Настройки dashboard пользователя"""
    __tablename__ = "dashboard_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Настройки интерфейса
    theme = Column(String(20), default="light", nullable=False)  # light, dark, auto
    language = Column(String(5), default="ru", nullable=False)  # ru, en
    
    # Поведение
    show_welcome_tour = Column(Boolean, default=True, nullable=False)
    default_module = Column(String(50), nullable=True)
    
    # Уведомления
    notifications_enabled = Column(Boolean, default=True, nullable=False)
    email_notifications = Column(Boolean, default=False, nullable=False)
    
    # Кастомизация
    dashboard_layout = Column(JSON, nullable=True, default=dict)
    favorite_modules = Column(JSON, nullable=True, default=list)
    
    # Связи
    user = relationship("User")

class SystemMetric(Base, TimestampMixin):
    """Системные метрики для dashboard"""
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Тип метрики
    metric_type = Column(String(50), nullable=False)  # users_active, documents_processed, etc.
    metric_name = Column(String(100), nullable=False)
    
    # Значения
    value = Column(Float, nullable=False)
    previous_value = Column(Float, nullable=True)
    
    # Контекст
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    module_id = Column(String(50), nullable=True)
    
    # Время измерения
    measured_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    period = Column(String(20), nullable=False)  # hour, day, week, month
    
    # Связи
    organization = relationship("Organization")

class SearchIndex(Base, TimestampMixin):
    """Индекс для поиска согласно ТЗ"""
    __tablename__ = "search_index"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Тип объекта
    object_type = Column(String(50), nullable=False)  # project, document, analysis, user
    object_id = Column(Integer, nullable=False)
    
    # Контент для поиска
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    
    # Метаданные
    module_id = Column(String(50), nullable=True)
    project_id = Column(Integer, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Для ранжирования
    relevance_boost = Column(Float, default=1.0, nullable=False)
    last_accessed = Column(DateTime(timezone=True), nullable=True)
    access_count = Column(Integer, default=0, nullable=False)
    
    # Связи
    organization = relationship("Organization")
    user = relationship("User")