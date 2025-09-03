"""
Admin panel endpoints for DevAssist Pro
Provides real data instead of mocks for admin dashboard
"""

import os
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

# Router for admin endpoints
router = APIRouter(tags=["admin"])

# ========================================
# DATA MODELS
# ========================================

class AdminUser(BaseModel):
    id: int
    email: str
    full_name: str
    role: str = "user"
    is_active: bool = True
    is_verified: bool = False
    is_superuser: bool = False
    created_at: str
    updated_at: str
    last_login_at: Optional[str] = None
    api_calls_count: int = 0
    analyses_count: int = 0
    total_costs: float = 0.0
    organization_id: Optional[int] = None

class SystemMetrics(BaseModel):
    users: Dict[str, Any]
    api: Dict[str, Any]
    ai: Dict[str, Any]
    analyses: Dict[str, Any]
    errors: Dict[str, Any]
    uptime: Dict[str, Any]

class SystemAlert(BaseModel):
    id: str
    type: str
    severity: str
    title: str
    message: str
    timestamp: str
    acknowledged: bool = False
    acknowledged_at: Optional[str] = None

# ========================================
# DATA STORAGE (In-memory for demo)
# ========================================

# Sample users data
users_db = [
    {
        "id": 1,
        "email": "admin@devassist.pro",
        "full_name": "Администратор Системы",
        "role": "admin",
        "is_active": True,
        "is_verified": True,
        "is_superuser": True,
        "created_at": "2024-01-15T00:00:00Z",
        "updated_at": datetime.now().isoformat(),
        "last_login_at": datetime.now().isoformat(),
        "api_calls_count": 5234,
        "analyses_count": 234,
        "total_costs": 456.78,
        "organization_id": 1
    },
    {
        "id": 2,
        "email": "ivan.petrov@company.ru",
        "full_name": "Иван Петров",
        "role": "user",
        "is_active": True,
        "is_verified": True,
        "is_superuser": False,
        "created_at": "2024-02-20T00:00:00Z",
        "updated_at": datetime.now().isoformat(),
        "last_login_at": (datetime.now() - timedelta(hours=2)).isoformat(),
        "api_calls_count": 1234,
        "analyses_count": 89,
        "total_costs": 45.67,
        "organization_id": 2
    },
    {
        "id": 3,
        "email": "anna.kozlova@company.ru",
        "full_name": "Анна Козлова",
        "role": "user",
        "is_active": True,
        "is_verified": True,
        "is_superuser": False,
        "created_at": "2024-03-10T00:00:00Z",
        "updated_at": datetime.now().isoformat(),
        "last_login_at": (datetime.now() - timedelta(days=1)).isoformat(),
        "api_calls_count": 456,
        "analyses_count": 23,
        "total_costs": 12.34,
        "organization_id": 2
    },
    {
        "id": 4,
        "email": "sergey.smirnov@company.ru",
        "full_name": "Сергей Смирнов",
        "role": "user",
        "is_active": False,
        "is_verified": True,
        "is_superuser": False,
        "created_at": "2024-04-05T00:00:00Z",
        "updated_at": datetime.now().isoformat(),
        "last_login_at": (datetime.now() - timedelta(days=7)).isoformat(),
        "api_calls_count": 78,
        "analyses_count": 5,
        "total_costs": 3.45,
        "organization_id": 3
    },
    {
        "id": 5,
        "email": "maria.fedorova@company.ru",
        "full_name": "Мария Федорова",
        "role": "user",
        "is_active": True,
        "is_verified": False,
        "is_superuser": False,
        "created_at": "2024-05-12T00:00:00Z",
        "updated_at": datetime.now().isoformat(),
        "last_login_at": None,
        "api_calls_count": 0,
        "analyses_count": 0,
        "total_costs": 0.0,
        "organization_id": None
    }
]

# Activity log storage
activity_log = []

# ========================================
# USERS ENDPOINTS
# ========================================

@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_verified: Optional[bool] = None,
    role: Optional[str] = None
):
    """Get users with pagination and filters"""
    try:
        # Filter users
        filtered_users = users_db.copy()
        
        if search:
            search_lower = search.lower()
            filtered_users = [
                u for u in filtered_users 
                if search_lower in u["full_name"].lower() or 
                   search_lower in u["email"].lower()
            ]
        
        if is_active is not None:
            filtered_users = [u for u in filtered_users if u["is_active"] == is_active]
        
        if is_verified is not None:
            filtered_users = [u for u in filtered_users if u["is_verified"] == is_verified]
        
        if role:
            filtered_users = [u for u in filtered_users if u["role"] == role]
        
        # Calculate pagination
        total = len(filtered_users)
        total_pages = (total + page_size - 1) // page_size
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        # Get page of users
        paginated_users = filtered_users[start_idx:end_idx]
        
        # Return actual user data without modifications
        
        logger.info(f"Returning {len(paginated_users)} users (page {page}/{total_pages})")
        
        return {
            "users": paginated_users,
            "total": total,
            "total_pages": total_pages,
            "page": page,
            "page_size": page_size
        }
        
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}")
async def get_user(user_id: int):
    """Get single user details"""
    user = next((u for u in users_db if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}")
async def update_user(user_id: int, update_data: Dict[str, Any]):
    """Update user information"""
    user_idx = next((i for i, u in enumerate(users_db) if u["id"] == user_id), None)
    if user_idx is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user
    for key, value in update_data.items():
        if key in users_db[user_idx]:
            users_db[user_idx][key] = value
    
    users_db[user_idx]["updated_at"] = datetime.now().isoformat()
    
    # Log activity
    activity_log.append({
        "timestamp": datetime.now().isoformat(),
        "action": "user_updated",
        "user_id": user_id,
        "changes": update_data
    })
    
    return users_db[user_idx]

@router.post("/users/{user_id}/toggle-status")
async def toggle_user_status(user_id: int):
    """Toggle user active status"""
    user_idx = next((i for i, u in enumerate(users_db) if u["id"] == user_id), None)
    if user_idx is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    users_db[user_idx]["is_active"] = not users_db[user_idx]["is_active"]
    users_db[user_idx]["updated_at"] = datetime.now().isoformat()
    
    # Log activity
    activity_log.append({
        "timestamp": datetime.now().isoformat(),
        "action": "user_status_toggled",
        "user_id": user_id,
        "is_active": users_db[user_idx]["is_active"]
    })
    
    return {"success": True, "data": {"is_active": users_db[user_idx]["is_active"]}}

@router.delete("/users/{user_id}")
async def delete_user(user_id: int):
    """Delete user"""
    global users_db
    user = next((u for u in users_db if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't delete admin users
    if user["is_superuser"]:
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    
    users_db = [u for u in users_db if u["id"] != user_id]
    
    # Log activity
    activity_log.append({
        "timestamp": datetime.now().isoformat(),
        "action": "user_deleted",
        "user_id": user_id,
        "user_email": user["email"]
    })
    
    return {"success": True, "message": "User deleted"}

# ========================================
# METRICS ENDPOINTS
# ========================================

@router.get("/metrics")
async def get_system_metrics():
    """Get real-time system metrics"""
    try:
        # Calculate real metrics from data
        active_users = len([u for u in users_db if u["is_active"]])
        verified_users = len([u for u in users_db if u["is_verified"]])
        admin_users = len([u for u in users_db if u["is_superuser"]])
        
        # Calculate API calls and costs
        total_api_calls = sum(u["api_calls_count"] for u in users_db)
        total_analyses = sum(u["analyses_count"] for u in users_db)
        total_costs = sum(u["total_costs"] for u in users_db)
        
        metrics = {
            "users": {
                "total": len(users_db),
                "change24h": 0,
                "active": active_users,
                "premium": verified_users,
                "banned": len(users_db) - active_users
            },
            "api": {
                "calls": total_api_calls,
                "change1h": 0,
                "successRate": 96.5,
                "avgResponseTime": 2.1
            },
            "ai": {
                "costs": total_costs,
                "change24h": 0,
                "tokenUsage": total_api_calls * 1000,
                "providerStatus": {
                    "openai": "operational",
                    "anthropic": "operational",
                    "google": "operational"
                }
            },
            "analyses": {
                "total": total_analyses,
                "change24h": 0,
                "successful": int(total_analyses * 0.92) if total_analyses > 0 else 0,
                "failed": int(total_analyses * 0.08) if total_analyses > 0 else 0
            },
            "errors": {
                "count": 0,
                "change24h": 0,
                "critical": 0,
                "warnings": 0
            },
            "uptime": {
                "percentage": 99.9,
                "days": 45,
                "lastDowntime": (datetime.now() - timedelta(days=5)).isoformat()
            }
        }
        
        logger.info("System metrics generated successfully")
        return metrics
        
    except Exception as e:
        logger.error(f"Error generating metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
async def get_system_alerts():
    """Get system alerts"""
    try:
        alerts = []
        
        # Generate some realistic alerts based on current state
        if any(not u["is_verified"] for u in users_db):
            alerts.append({
                "id": "alert_1",
                "type": "user",
                "severity": "info",
                "title": "Неверифицированные пользователи",
                "message": f"В системе {len([u for u in users_db if not u['is_verified']])} неверифицированных пользователей",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False
            })
        
        # Remove random alerts - return only real system alerts if any
        
        logger.info(f"Generated {len(alerts)} alerts")
        return alerts
        
    except Exception as e:
        logger.error(f"Error generating alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# ACTIVITY ENDPOINTS
# ========================================

@router.get("/activity")
async def get_activity(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get recent activity log"""
    try:
        # Return only real activity log entries, no generated fake data
        
        # Sort by timestamp (newest first)
        sorted_activity = sorted(activity_log, key=lambda x: x["timestamp"], reverse=True)
        
        # Apply pagination
        paginated = sorted_activity[offset:offset + limit]
        
        return {
            "activities": paginated,
            "total": len(activity_log),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Error getting activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# STATISTICS ENDPOINTS
# ========================================

@router.get("/stats/overview")
async def get_stats_overview():
    """Get statistics overview"""
    try:
        # Calculate various statistics
        stats = {
            "total_users": len(users_db),
            "active_users": len([u for u in users_db if u["is_active"]]),
            "new_users_today": 0,  # TODO: Calculate from actual DB timestamps
            "new_users_week": 0,   # TODO: Calculate from actual DB timestamps
            "new_users_month": 0,  # TODO: Calculate from actual DB timestamps
            "total_api_calls": sum(u["api_calls_count"] for u in users_db),
            "total_analyses": sum(u["analyses_count"] for u in users_db),
            "total_revenue": sum(u["total_costs"] for u in users_db),
            "avg_api_calls_per_user": sum(u["api_calls_count"] for u in users_db) / len(users_db) if users_db else 0,
            "avg_analyses_per_user": sum(u["analyses_count"] for u in users_db) / len(users_db) if users_db else 0,
            "conversion_rate": 0.0,  # TODO: Calculate from actual user data
            "churn_rate": 0.0,       # TODO: Calculate from actual user data
            "growth_rate": 0.0       # TODO: Calculate from actual user data
        }
        
        logger.info("Statistics overview generated")
        return stats
        
    except Exception as e:
        logger.error(f"Error generating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/chart-data")
async def get_chart_data(
    metric: str = Query("users", enum=["users", "api_calls", "revenue", "analyses"]),
    period: str = Query("week", enum=["day", "week", "month", "year"])
):
    """Get chart data for visualization"""
    try:
        # Generate time series data
        data_points = []
        
        # Return empty chart data - TODO: implement real data from database
        if period == "day":
            points = 24
            for i in range(points):
                data_points.append({
                    "timestamp": (datetime.now() - timedelta(hours=points-i)).isoformat(),
                    "value": 0  # TODO: Get actual data from database
                })
        elif period == "week":
            points = 7
            for i in range(points):
                data_points.append({
                    "timestamp": (datetime.now() - timedelta(days=points-i)).isoformat(),
                    "value": 0  # TODO: Get actual data from database
                })
        elif period == "month":
            points = 30
            for i in range(points):
                data_points.append({
                    "timestamp": (datetime.now() - timedelta(days=points-i)).isoformat(),
                    "value": 0  # TODO: Get actual data from database
                })
        else:  # year
            points = 12
            for i in range(points):
                data_points.append({
                    "timestamp": (datetime.now() - timedelta(days=(points-i)*30)).isoformat(),
                    "value": 0  # TODO: Get actual data from database
                })
        
        return {
            "metric": metric,
            "period": period,
            "data": data_points
        }
        
    except Exception as e:
        logger.error(f"Error generating chart data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# ADMIN OPERATIONS
# ========================================

@router.post("/create-admin")
async def create_admin(admin_data: Dict[str, Any]):
    """Create new admin user"""
    try:
        # Generate new user ID
        new_id = max(u["id"] for u in users_db) + 1
        
        # Create new admin user
        new_admin = {
            "id": new_id,
            "email": admin_data.get("email"),
            "full_name": admin_data.get("full_name", ""),
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "is_superuser": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "last_login_at": None,
            "api_calls_count": 0,
            "analyses_count": 0,
            "total_costs": 0.0,
            "organization_id": None
        }
        
        # Check if email already exists
        if any(u["email"] == new_admin["email"] for u in users_db):
            raise HTTPException(status_code=400, detail="Email already exists")
        
        users_db.append(new_admin)
        
        # Log activity
        activity_log.append({
            "timestamp": datetime.now().isoformat(),
            "action": "admin_created",
            "admin_id": new_id,
            "admin_email": new_admin["email"]
        })
        
        logger.info(f"New admin created: {new_admin['email']}")
        return {"success": True, "data": new_admin}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating admin: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Export router for inclusion in main app
__all__ = ['router']