"""
Dashboard Service для DevAssist Pro
Согласно ТЗ раздел 3 "Главный портал"
"""
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import List, Optional, Dict, Any
import uvicorn
import logging
import os
from datetime import datetime, timedelta

# Импорты из shared библиотеки
import sys
sys.path.append('/app/shared')

from shared.config import settings
from shared.database import get_db, create_tables
from shared.models import User, Organization, Project, Document, Analysis, AIUsage
from shared.dashboard_models import (
    DashboardModule, UserActivity, Notification, 
    DashboardPreference, SystemMetric, SearchIndex
)
from shared.dashboard_schemas import (
    DashboardResponse, DashboardModule as DashboardModuleSchema,
    DashboardStatistics, AIModelStatus, RecentActivity,
    SearchResponse, SearchResult, NotificationsResponse,
    Notification as NotificationSchema, DashboardPreferences,
    ModuleStatus, ModuleStats, DashboardAnalytics
)
from shared.auth import get_current_active_user

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание FastAPI приложения
app = FastAPI(
    title="DevAssist Pro Dashboard Service",
    description="Сервис главного портала и dashboard",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=settings.allowed_methods,
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Корневой endpoint"""
    return {
        "service": "DevAssist Pro Dashboard Service",
        "version": "1.0.0",
        "status": "running"
    }

# Dashboard API Support согласно ТЗ Этап 3
@app.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Получение данных для главной страницы dashboard
    Согласно ТЗ раздел 2.2
    """
    try:
        # Модули согласно ТЗ раздел 2.2
        modules_data = []
        
        # КП Анализатор (первый модуль в разработке)
        kp_stats = await get_module_stats(db, current_user.id, "kp-analyzer")
        modules_data.append(DashboardModuleSchema(
            id="kp-analyzer",
            title="КП Анализатор",
            description="AI-анализ коммерческих предложений",
            icon="DocumentAnalysisIcon",
            status=ModuleStatus.BETA,
            ai_models=["claude-3-sonnet", "gpt-4"],
            quick_stats=kp_stats
        ))
        
        # Остальные модули согласно ТЗ
        upcoming_modules = [
            {
                "id": "tz-generator",
                "title": "ТЗ Генератор", 
                "description": "AI-генерация технических заданий",
                "status": ModuleStatus.COMING_SOON
            },
            {
                "id": "project-evaluation",
                "title": "Оценка проектов",
                "description": "Мультикритериальный анализ проектов",
                "status": ModuleStatus.COMING_SOON
            },
            {
                "id": "marketing-planner",
                "title": "Маркетинг планировщик",
                "description": "AI-генерация маркетинговых стратегий",
                "status": ModuleStatus.COMING_SOON
            },
            {
                "id": "knowledge-base",
                "title": "База знаний",
                "description": "Накопление опыта всех модулей",
                "status": ModuleStatus.COMING_SOON
            }
        ]
        
        for module in upcoming_modules:
            modules_data.append(DashboardModuleSchema(
                id=module["id"],
                title=module["title"],
                description=module["description"],
                icon="ModuleIcon",
                status=module["status"],
                ai_models=[]
            ))
        
        # Statistics API согласно ТЗ
        statistics = await get_dashboard_statistics(db, current_user)
        
        # AI Models Status согласно ТЗ
        ai_models_status = await get_ai_models_status(db, current_user)
        
        # Recent Activity согласно ТЗ
        recent_activities = await get_recent_activities(db, current_user)
        
        # User Organizations
        user_organizations = []
        for membership in current_user.organizations:
            if membership.is_active:
                user_organizations.append({
                    "id": membership.organization.id,
                    "name": membership.organization.name,
                    "role": membership.role
                })
        
        return DashboardResponse(
            welcome_message=f"Добро пожаловать в DevAssist Pro Portal, {current_user.full_name}!",
            modules=modules_data,
            statistics=statistics,
            ai_models_status=ai_models_status,
            recent_activities=recent_activities,
            user_organizations=user_organizations
        )
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load dashboard"
        )

# Statistics API endpoints согласно ТЗ
async def get_dashboard_statistics(db: Session, user: User) -> DashboardStatistics:
    """Получение статистики для dashboard"""
    try:
        # Получаем организации пользователя
        user_org_ids = [m.organization_id for m in user.organizations if m.is_active]
        
        # Статистика проектов
        total_projects = db.query(Project).filter(
            Project.organization_id.in_(user_org_ids)
        ).count() if user_org_ids else 0
        
        # Статистика документов
        total_documents = db.query(Document).filter(
            Document.project_id.in_(
                db.query(Project.id).filter(Project.organization_id.in_(user_org_ids))
            )
        ).count() if user_org_ids else 0
        
        # Статистика анализов
        total_analyses = db.query(Analysis).filter(
            Analysis.project_id.in_(
                db.query(Project.id).filter(Project.organization_id.in_(user_org_ids))
            )
        ).count() if user_org_ids else 0
        
        # AI стоимость за текущий месяц
        current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        ai_cost_current_month = db.query(func.sum(AIUsage.cost_usd)).filter(
            and_(
                AIUsage.organization_id.in_(user_org_ids),
                AIUsage.created_at >= current_month
            )
        ).scalar() or 0.0 if user_org_ids else 0.0
        
        # Активные пользователи (за последние 24 часа)
        yesterday = datetime.utcnow() - timedelta(days=1)
        active_users = db.query(func.count(func.distinct(UserActivity.user_id))).filter(
            and_(
                UserActivity.organization_id.in_(user_org_ids),
                UserActivity.created_at >= yesterday
            )
        ).scalar() or 0 if user_org_ids else 0
        
        # Недавняя активность
        recent_activity_count = db.query(UserActivity).filter(
            and_(
                UserActivity.organization_id.in_(user_org_ids),
                UserActivity.created_at >= yesterday
            )
        ).count() if user_org_ids else 0
        
        return DashboardStatistics(
            total_projects=total_projects,
            total_documents=total_documents,
            total_analyses=total_analyses,
            ai_cost_current_month=round(ai_cost_current_month, 2),
            active_users=active_users,
            recent_activity_count=recent_activity_count
        )
        
    except Exception as e:
        logger.error(f"Statistics error: {str(e)}")
        return DashboardStatistics(
            total_projects=0,
            total_documents=0,
            total_analyses=0,
            ai_cost_current_month=0.0,
            active_users=0,
            recent_activity_count=0
        )

async def get_module_stats(db: Session, user_id: int, module_id: str) -> Optional[ModuleStats]:
    """Получение статистики модуля"""
    try:
        if module_id == "kp-analyzer":
            # Статистика для КП Анализатора
            user_analyses = db.query(Analysis).join(Project).filter(
                Project.owner_id == user_id,
                Analysis.analysis_type == "kp_analysis"
            )
            
            analyzed = user_analyses.count()
            
            # Приблизительная экономия времени (4 часа на анализ)
            saved_hours = analyzed * 4.0
            
            # Средняя точность анализов
            avg_confidence = db.query(func.avg(Analysis.confidence_score)).filter(
                Analysis.project_id.in_(
                    db.query(Project.id).filter(Project.owner_id == user_id)
                ),
                Analysis.confidence_score.isnot(None)
            ).scalar()
            
            accuracy = round(avg_confidence * 100, 1) if avg_confidence else None
            
            # Последнее использование
            last_analysis = user_analyses.order_by(desc(Analysis.created_at)).first()
            last_used = last_analysis.created_at if last_analysis else None
            
            return ModuleStats(
                analyzed=analyzed,
                saved_hours=saved_hours,
                accuracy=accuracy,
                last_used=last_used
            )
        
        return None
        
    except Exception as e:
        logger.error(f"Module stats error: {str(e)}")
        return None

async def get_ai_models_status(db: Session, user: User) -> List[AIModelStatus]:
    """Получение статуса AI моделей согласно ТЗ"""
    models_status = []
    
    # OpenAI модели
    models_status.append(AIModelStatus(
        provider="openai",
        model_name="gpt-4",
        status="available",
        response_time=1.2,
        cost_per_token=0.00003,
        tokens_used_today=0,
        cost_today=0.0
    ))
    
    # Anthropic модели
    models_status.append(AIModelStatus(
        provider="anthropic", 
        model_name="claude-3-sonnet",
        status="available",
        response_time=0.8,
        cost_per_token=0.000015,
        tokens_used_today=0,
        cost_today=0.0
    ))
    
    # Google модели
    models_status.append(AIModelStatus(
        provider="google",
        model_name="gemini-pro",
        status="available", 
        response_time=1.5,
        cost_per_token=0.0000005,
        tokens_used_today=0,
        cost_today=0.0
    ))
    
    # TODO: Получить реальные данные из AI usage
    
    return models_status

async def get_recent_activities(db: Session, user: User) -> List[RecentActivity]:
    """Получение недавней активности согласно ТЗ"""
    try:
        user_org_ids = [m.organization_id for m in user.organizations if m.is_active]
        
        activities = db.query(UserActivity).filter(
            UserActivity.organization_id.in_(user_org_ids)
        ).order_by(desc(UserActivity.created_at)).limit(10).all() if user_org_ids else []
        
        result = []
        for activity in activities:
            result.append(RecentActivity(
                id=activity.id,
                type=activity.activity_type,
                title=activity.title,
                description=activity.description or "",
                user_name=activity.user.full_name,
                timestamp=activity.created_at,
                module_id=activity.module_id,
                project_id=activity.project_id
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Recent activities error: {str(e)}")
        return []

# Search functionality API согласно ТЗ
@app.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=2, description="Поисковый запрос"),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Поиск по контенту согласно ТЗ
    """
    start_time = datetime.utcnow()
    
    try:
        user_org_ids = [m.organization_id for m in current_user.organizations if m.is_active]
        
        # Поиск в индексе
        search_results = db.query(SearchIndex).filter(
            and_(
                SearchIndex.organization_id.in_(user_org_ids),
                or_(
                    SearchIndex.title.ilike(f"%{q}%"),
                    SearchIndex.content.ilike(f"%{q}%"),
                    SearchIndex.description.ilike(f"%{q}%")
                )
            )
        ).order_by(
            desc(SearchIndex.relevance_boost),
            desc(SearchIndex.last_accessed)
        ).limit(limit).all() if user_org_ids else []
        
        results = []
        for item in search_results:
            # Простой расчет релевантности
            relevance = 0.5
            if q.lower() in item.title.lower():
                relevance += 0.3
            if q.lower() in (item.description or "").lower():
                relevance += 0.2
                
            results.append(SearchResult(
                type=item.object_type,
                id=item.object_id,
                title=item.title,
                description=item.description or "",
                module_id=item.module_id,
                project_id=item.project_id,
                created_at=item.created_at,
                relevance_score=min(relevance, 1.0)
            ))
        
        search_time = (datetime.utcnow() - start_time).total_seconds()
        
        return SearchResponse(
            query=q,
            total_results=len(results),
            results=results,
            search_time=round(search_time, 3)
        )
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )

# Notifications backend согласно ТЗ
@app.get("/notifications", response_model=NotificationsResponse)
async def get_notifications(
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение уведомлений пользователя"""
    try:
        query = db.query(Notification).filter(
            and_(
                Notification.user_id == current_user.id,
                Notification.is_deleted == False,
                or_(
                    Notification.expires_at.is_(None),
                    Notification.expires_at > datetime.utcnow()
                )
            )
        )
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        notifications = query.order_by(desc(Notification.created_at)).limit(limit).all()
        
        unread_count = db.query(Notification).filter(
            and_(
                Notification.user_id == current_user.id,
                Notification.is_read == False,
                Notification.is_deleted == False
            )
        ).count()
        
        result = []
        for notif in notifications:
            result.append(NotificationSchema(
                id=notif.id,
                type=notif.type,
                title=notif.title,
                message=notif.message,
                is_read=notif.is_read,
                created_at=notif.created_at,
                expires_at=notif.expires_at,
                action_url=notif.action_url,
                action_text=notif.action_text
            ))
        
        return NotificationsResponse(
            notifications=result,
            unread_count=unread_count,
            total_count=len(result)
        )
        
    except Exception as e:
        logger.error(f"Notifications error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get notifications"
        )

# Module status API согласно ТЗ
@app.get("/modules/status")
async def get_modules_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение статуса всех модулей"""
    try:
        modules = db.query(DashboardModule).filter(
            DashboardModule.is_enabled == True
        ).order_by(DashboardModule.sort_order).all()
        
        result = []
        for module in modules:
            stats = await get_module_stats(db, current_user.id, module.id)
            
            result.append({
                "id": module.id,
                "title": module.title,
                "status": module.status,
                "is_enabled": module.is_enabled,
                "ai_models": module.ai_models,
                "stats": stats.dict() if stats else None
            })
        
        return {"modules": result}
        
    except Exception as e:
        logger.error(f"Module status error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get module status"
        )

# Создание таблиц при запуске
@app.on_event("startup")
async def startup_event():
    """Инициализация при запуске"""
    logger.info("Starting Dashboard Service...")
    create_tables()
    logger.info("Dashboard Service started successfully")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8006,
        reload=os.getenv("RELOAD", "false").lower() == "true"
    )