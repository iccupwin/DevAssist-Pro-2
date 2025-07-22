"""
Базовые модели данных для DevAssist Pro
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any
import uuid

Base = declarative_base()

class TimestampMixin:
    """Mixin для добавления временных меток"""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class User(Base, TimestampMixin):
    """Модель пользователя"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Профиль пользователя
    company = Column(String(255), nullable=True)
    position = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Связи
    organizations = relationship("OrganizationMember", back_populates="user")
    projects = relationship("Project", back_populates="owner")
    documents = relationship("Document", back_populates="uploaded_by")

class Organization(Base, TimestampMixin):
    """Модель организации"""
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Подписка и лимиты
    subscription_plan = Column(String(50), default="starter", nullable=False)
    monthly_ai_cost_limit = Column(Float, default=100.0, nullable=False)
    document_limit = Column(Integer, default=100, nullable=False)
    
    # Связи
    members = relationship("OrganizationMember", back_populates="organization")
    projects = relationship("Project", back_populates="organization")

class OrganizationMember(Base, TimestampMixin):
    """Связь пользователей с организациями"""
    __tablename__ = "organization_members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    role = Column(String(50), default="member", nullable=False)  # owner, admin, member
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Связи
    user = relationship("User", back_populates="organizations")
    organization = relationship("Organization", back_populates="members")

class Project(Base, TimestampMixin):
    """Модель проекта"""
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    project_type = Column(String(50), nullable=False)  # residential, commercial, industrial
    status = Column(String(50), default="planning", nullable=False)  # planning, analysis, execution, completed
    
    # Связи
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    
    owner = relationship("User", back_populates="projects")
    organization = relationship("Organization", back_populates="projects")
    documents = relationship("Document", back_populates="project")
    analyses = relationship("Analysis", back_populates="project")

class Document(Base, TimestampMixin):
    """Модель документа"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, xlsx, etc.
    document_type = Column(String(50), nullable=False)  # tz, kp, report, etc.
    
    # Хранение
    file_path = Column(String(500), nullable=False)
    s3_bucket = Column(String(255), nullable=True)
    s3_key = Column(String(500), nullable=True)
    
    # Обработка
    is_processed = Column(Boolean, default=False, nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    processing_status = Column(String(50), default="pending", nullable=False)  # pending, processing, completed, failed
    
    # Извлеченный контент
    extracted_text = Column(Text, nullable=True)
    document_metadata = Column(JSON, nullable=True)
    
    # Связи
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    uploaded_by = relationship("User", back_populates="documents")
    project = relationship("Project", back_populates="documents")

class Analysis(Base, TimestampMixin):
    """Модель анализа документов"""
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_type = Column(String(50), nullable=False)  # kp_analysis, tz_analysis, comparison
    status = Column(String(50), default="pending", nullable=False)  # pending, processing, completed, failed
    
    # Параметры анализа
    ai_model = Column(String(100), nullable=False)
    ai_provider = Column(String(50), nullable=False)
    analysis_config = Column(JSON, nullable=True)
    
    # Результаты
    results = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    processing_time = Column(Float, nullable=True)  # в секундах
    
    # Стоимость
    ai_cost = Column(Float, default=0.0, nullable=False)
    tokens_used = Column(Integer, default=0, nullable=False)
    
    # Связи
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    tz_document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    project = relationship("Project", back_populates="analyses")
    tz_document = relationship("Document", foreign_keys=[tz_document_id])

class AnalysisDocument(Base):
    """Связь анализа с анализируемыми КП документами"""
    __tablename__ = "analysis_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    
    # Результаты для конкретного документа
    compliance_score = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True)
    recommendation = Column(Text, nullable=True)
    detailed_results = Column(JSON, nullable=True)

class AIUsage(Base, TimestampMixin):
    """Модель отслеживания использования AI"""
    __tablename__ = "ai_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    
    # Детали запроса
    ai_provider = Column(String(50), nullable=False)
    ai_model = Column(String(100), nullable=False)
    operation_type = Column(String(50), nullable=False)  # analysis, report_generation, etc.
    
    # Метрики
    tokens_input = Column(Integer, default=0, nullable=False)
    tokens_output = Column(Integer, default=0, nullable=False)
    cost_usd = Column(Float, default=0.0, nullable=False)
    response_time = Column(Float, nullable=True)
    
    # Связанные объекты
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True)
    
    # Связи
    user = relationship("User")
    organization = relationship("Organization")

class Report(Base, TimestampMixin):
    """Модель отчетов"""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False)  # executive_summary, detailed_analysis, comparison
    format = Column(String(20), nullable=False)  # pdf, excel, web
    
    # Содержимое
    content = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    
    # Параметры генерации
    template_used = Column(String(100), nullable=True)
    ai_model = Column(String(100), nullable=True)
    generation_config = Column(JSON, nullable=True)
    
    # Связи
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    analysis = relationship("Analysis")
    generated_by = relationship("User")

# Импорт dashboard моделей
from .dashboard_models import (
    DashboardModule, UserActivity, Notification, 
    DashboardPreference, SystemMetric, SearchIndex
)