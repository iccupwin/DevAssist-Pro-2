#!/usr/bin/env python3
"""
DevAssist Pro - Упрощенная версия без базы данных
Для быстрого запуска с аутентификацией
"""
import os
import logging
import hashlib
import time
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========================================
# СХЕМЫ И МОДЕЛИ
# ========================================

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    company: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    company: Optional[str] = None
    role: str = "user"
    created_at: str

class AuthResponse(BaseModel):
    success: bool
    user: Optional[UserResponse] = None
    token: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str
    version: str = "1.0.0"

# ========================================
# ПРОСТАЯ АУТЕНТИФИКАЦИЯ
# ========================================

class SimpleAuth:
    def __init__(self):
        self.users = {}  # В памяти
        self.sessions = {}
        
        # Создаем тестового пользователя
        self.users["test@example.com"] = {
            "id": "1",
            "email": "test@example.com", 
            "password_hash": self._hash_password("testpass123"),
            "full_name": "Test User",
            "company": "Test Company",
            "created_at": datetime.now().isoformat()
        }
        
        # Создаем админа
        self.users["admin@devassist.pro"] = {
            "id": "2",
            "email": "admin@devassist.pro",
            "password_hash": self._hash_password("admin123"),
            "full_name": "Администратор",
            "company": "DevAssist Pro",
            "created_at": datetime.now().isoformat()
        }
    
    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _generate_token(self, user_id: str) -> str:
        timestamp = str(int(time.time()))
        token_data = f"{user_id}:{timestamp}"
        return hashlib.md5(token_data.encode()).hexdigest()
    
    def register(self, data: UserRegisterRequest) -> AuthResponse:
        if data.email in self.users:
            return AuthResponse(
                success=False,
                error="Пользователь с таким email уже существует"
            )
        
        user_id = str(len(self.users) + 1)
        self.users[data.email] = {
            "id": user_id,
            "email": data.email,
            "password_hash": self._hash_password(data.password),
            "full_name": data.full_name,
            "company": data.company,
            "created_at": datetime.now().isoformat()
        }
        
        token = self._generate_token(user_id)
        self.sessions[token] = user_id
        
        user_response = UserResponse(
            id=user_id,
            email=data.email,
            full_name=data.full_name,
            company=data.company or "",
            role="user",
            created_at=self.users[data.email]["created_at"]
        )
        
        return {
            "success": True,
            "user": user_response,
            "token": token,
            "access_token": token,
            "refresh_token": token
        }
    
    def login(self, data: UserLoginRequest) -> AuthResponse:
        user = self.users.get(data.email)
        if not user:
            return AuthResponse(
                success=False,
                error="Пользователь не найден"
            )
        
        if user["password_hash"] != self._hash_password(data.password):
            return AuthResponse(
                success=False,
                error="Неверный пароль"
            )
        
        token = self._generate_token(user["id"])
        self.sessions[token] = user["id"]
        
        user_response = UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            company=user.get("company", ""),
            role="admin" if user["email"] == "admin@devassist.pro" else "user",
            created_at=user["created_at"]
        )
        
        return {
            "success": True,
            "user": user_response,
            "token": token,
            "access_token": token,
            "refresh_token": token
        }
    
    def get_user_by_token(self, token: str) -> Optional[UserResponse]:
        user_id = self.sessions.get(token)
        if not user_id:
            return None
        
        for email, user in self.users.items():
            if user["id"] == user_id:
                return UserResponse(
                    id=user["id"],
                    email=user["email"],
                    full_name=user["full_name"],
                    company=user.get("company", ""),
                    role="admin" if user["email"] == "admin@devassist.pro" else "user",
                    created_at=user["created_at"]
                )
        return None

# ========================================
# СОЗДАНИЕ ПРИЛОЖЕНИЯ
# ========================================

app = FastAPI(
    title="DevAssist Pro - Simple Backend",
    description="Упрощенная версия для тестирования аутентификации",
    version="1.0.0"
)

# CORS middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Инициализация аутентификации
auth = SimpleAuth()

# ========================================
# ENDPOINTS
# ========================================

@app.get("/", response_class=str)
async def root():
    return """
    <html>
    <head><title>DevAssist Pro Backend</title></head>
    <body>
        <h1>🚀 DevAssist Pro Backend</h1>
        <p>Status: <strong>Running</strong></p>
        <p>Version: 1.0.0 (Simple)</p>
        <h2>Endpoints:</h2>
        <ul>
            <li><a href="/health">GET /health</a></li>
            <li><a href="/docs">GET /docs</a></li>
            <li>POST /api/auth/register</li>
            <li>POST /api/auth/login</li>
            <li>GET /api/auth/me</li>
        </ul>
        <h2>Test Users:</h2>
        <ul>
            <li>test@example.com / testpass123</li>
            <li>admin@devassist.pro / admin123</li>
        </ul>
    </body>
    </html>
    """

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="devassist-simple-backend",
        timestamp=datetime.now().isoformat()
    )

@app.post("/api/auth/register")
async def register(data: UserRegisterRequest):
    try:
        result = auth.register(data)
        logger.info(f"Registration attempt for {data.email}: {'success' if result['success'] else 'failed'}")
        return result
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return AuthResponse(success=False, error=str(e))

@app.post("/api/auth/login") 
async def login(data: UserLoginRequest):
    try:
        result = auth.login(data)
        logger.info(f"Login attempt for {data.email}: {'success' if result['success'] else 'failed'}")
        return result
    except Exception as e:
        logger.error(f"Login error: {e}")
        return AuthResponse(success=False, error=str(e))

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    try:
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Токен авторизации не предоставлен")
        
        token = authorization.replace("Bearer ", "")
        user = auth.get_user_by_token(token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Недействительный токен")
        
        return {"success": True, "user": user}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
async def logout(request: Request):
    try:
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            if token in auth.sessions:
                del auth.sessions[token]
        
        return {"success": True, "message": "Успешный выход"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"success": False, "error": str(e)}

# Базовые endpoints для совместимости с frontend
@app.get("/api/llm/providers")
async def get_providers():
    return {
        "success": True,
        "providers": {
            "anthropic": {"status": "available" if os.getenv("ANTHROPIC_API_KEY") else "not_configured"}
        }
    }

@app.post("/api/documents/upload")
async def upload_mock():
    return {
        "success": True,
        "data": {
            "document_id": 12345,
            "filename": "mock_upload.pdf",
            "message": "Mock upload - функция в разработке"
        }
    }

# ========================================
# ЗАПУСК
# ========================================

if __name__ == "__main__":
    print("🚀 Запуск DevAssist Pro - Простая версия")
    print("=" * 50)
    print("📊 API:")
    print("   • Health:      http://localhost:8000/health") 
    print("   • API Docs:    http://localhost:8000/docs")
    print("   • Auth:        http://localhost:8000/api/auth/")
    print("")
    print("👤 Тестовые пользователи:")
    print("   • test@example.com / testpass123")
    print("   • admin@devassist.pro / admin123")
    print("=" * 50)
    
    uvicorn.run(
        "app_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )