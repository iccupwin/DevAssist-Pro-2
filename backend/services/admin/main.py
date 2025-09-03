"""Admin service for user management and system monitoring"""
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from passlib.context import CryptContext
import httpx
import redis
import asyncio
from contextlib import asynccontextmanager

from backend.shared.database import get_db, init_db
from backend.shared.models import User, Organization, OrganizationMember, Project, Document
from backend.shared.auth import get_current_user, create_access_token
from backend.shared.schemas import UserCreate, UserUpdate, UserResponse
from backend.shared.models import MemberRole

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Redis client
redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    global redis_client
    try:
        redis_client = redis.Redis.from_url(
            os.getenv("REDIS_URL", "redis://redis:6379/0"),
            decode_responses=True
        )
        redis_client.ping()
    except:
        print("Redis connection failed, continuing without cache")
        redis_client = None
    yield
    # Shutdown
    if redis_client:
        redis_client.close()

app = FastAPI(
    title="Admin Service",
    description="Admin service for user management and system monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin check dependency
async def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "admin"}

# User management endpoints
@app.get("/api/admin/users", response_model=Dict[str, Any])
async def get_users(
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_verified: Optional[bool] = None,
    organization_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get all users with pagination and filters"""
    query = db.query(User)
    
    # Apply filters
    if search:
        query = query.filter(
            func.lower(User.email).contains(search.lower()) |
            func.lower(User.full_name).contains(search.lower())
        )
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if is_verified is not None:
        query = query.filter(User.is_verified == is_verified)
    if organization_id:
        query = query.join(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    users = query.offset(offset).limit(page_size).all()
    
    # Get user statistics
    user_data = []
    for user in users:
        # Get user's organizations
        org_members = db.query(OrganizationMember).filter(
            OrganizationMember.user_id == user.id
        ).all()
        
        # Get user's projects count
        projects_count = db.query(func.count(Project.id)).filter(
            Project.created_by_id == user.id
        ).scalar()
        
        # Get user's documents count
        documents_count = db.query(func.count(Document.id)).filter(
            Document.uploaded_by_id == user.id
        ).scalar()
        
        user_dict = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "company": user.company,
            "position": user.position,
            "phone": user.phone,
            "organizations": [
                {
                    "id": om.organization.id,
                    "name": om.organization.name,
                    "role": om.role.value
                } for om in org_members
            ],
            "stats": {
                "projects_count": projects_count,
                "documents_count": documents_count,
                "organizations_count": len(org_members)
            }
        }
        user_data.append(user_dict)
    
    return {
        "users": user_data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

@app.get("/api/admin/users/{user_id}", response_model=Dict[str, Any])
async def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get detailed information about a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's organizations
    org_members = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user.id
    ).all()
    
    # Get user's recent projects
    recent_projects = db.query(Project).filter(
        Project.created_by_id == user.id
    ).order_by(Project.created_at.desc()).limit(5).all()
    
    # Get user's recent documents
    recent_documents = db.query(Document).filter(
        Document.uploaded_by_id == user.id
    ).order_by(Document.created_at.desc()).limit(5).all()
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "company": user.company,
            "position": user.position,
            "phone": user.phone
        },
        "organizations": [
            {
                "id": om.organization.id,
                "name": om.organization.name,
                "role": om.role.value,
                "joined_at": om.created_at.isoformat() if om.created_at else None
            } for om in org_members
        ],
        "recent_projects": [
            {
                "id": p.id,
                "name": p.name,
                "created_at": p.created_at.isoformat() if p.created_at else None
            } for p in recent_projects
        ],
        "recent_documents": [
            {
                "id": d.id,
                "filename": d.filename,
                "created_at": d.created_at.isoformat() if d.created_at else None
            } for d in recent_documents
        ]
    }

@app.put("/api/admin/users/{user_id}")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return {"message": "User updated successfully", "user_id": user.id}

@app.post("/api/admin/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Toggle user active status (ban/unban)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow admins to ban themselves
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot ban your own account"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    action = "unbanned" if user.is_active else "banned"
    return {"message": f"User {action} successfully", "is_active": user.is_active}

@app.post("/api/admin/users/create-admin")
async def create_admin_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create a new admin user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    # Create new admin user
    hashed_password = pwd_context.hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_active=True,
        is_superuser=True,
        is_verified=True,
        company=user_data.company,
        position=user_data.position,
        phone=user_data.phone
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Admin user created successfully",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name
        }
    }

# System monitoring endpoints
@app.get("/api/admin/system/status")
async def get_system_status(
    admin_user: User = Depends(get_admin_user)
):
    """Get status of all backend services"""
    services = {
        "api_gateway": {"url": "http://backend:8000/health", "status": "unknown"},
        "auth": {"url": "http://backend:8001/health", "status": "unknown"},
        "llm": {"url": "http://backend:8002/health", "status": "unknown"},
        "documents": {"url": "http://backend:8003/health", "status": "unknown"},
        "analytics": {"url": "http://backend:8004/health", "status": "unknown"},
        "reports": {"url": "http://backend:8005/health", "status": "unknown"},
        "dashboard": {"url": "http://backend:8006/health", "status": "unknown"}
    }
    
    # Check each service
    async with httpx.AsyncClient(timeout=5.0) as client:
        for service_name, service_info in services.items():
            try:
                response = await client.get(service_info["url"])
                if response.status_code == 200:
                    services[service_name]["status"] = "healthy"
                    services[service_name]["response"] = response.json()
                else:
                    services[service_name]["status"] = "unhealthy"
                    services[service_name]["error"] = f"Status code: {response.status_code}"
            except Exception as e:
                services[service_name]["status"] = "offline"
                services[service_name]["error"] = str(e)
    
    # Check database
    try:
        db_status = "healthy"
        db = next(get_db())
        db.execute(select(1))
        db.close()
    except Exception as e:
        db_status = "unhealthy"
    
    # Check Redis
    redis_status = "unknown"
    if redis_client:
        try:
            redis_client.ping()
            redis_status = "healthy"
        except:
            redis_status = "unhealthy"
    
    return {
        "services": services,
        "database": {"status": db_status},
        "redis": {"status": redis_status},
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/admin/system/llm-status")
async def get_llm_status(
    admin_user: User = Depends(get_admin_user)
):
    """Get status of LLM providers"""
    llm_status = {}
    
    # Check LLM service for provider status
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get("http://backend:8002/api/llm/providers/status")
            if response.status_code == 200:
                llm_status = response.json()
            else:
                llm_status = {
                    "error": f"Failed to get LLM status: {response.status_code}"
                }
        except Exception as e:
            llm_status = {
                "error": f"Failed to connect to LLM service: {str(e)}"
            }
    
    # Add API key presence check
    llm_status["api_keys"] = {
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
        "google": bool(os.getenv("GOOGLE_API_KEY"))
    }
    
    return llm_status

@app.get("/api/admin/stats/overview")
async def get_stats_overview(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get overall system statistics"""
    # User statistics
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    verified_users = db.query(func.count(User.id)).filter(User.is_verified == True).scalar()
    admin_users = db.query(func.count(User.id)).filter(User.is_superuser == True).scalar()
    
    # Recent users (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = db.query(func.count(User.id)).filter(
        User.created_at >= seven_days_ago
    ).scalar()
    
    # Organization statistics
    total_organizations = db.query(func.count(Organization.id)).scalar()
    
    # Project statistics
    total_projects = db.query(func.count(Project.id)).scalar()
    
    # Document statistics
    total_documents = db.query(func.count(Document.id)).scalar()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "verified": verified_users,
            "admins": admin_users,
            "recent": recent_users
        },
        "organizations": {
            "total": total_organizations
        },
        "projects": {
            "total": total_projects
        },
        "documents": {
            "total": total_documents
        },
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)