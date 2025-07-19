#!/usr/bin/env python3
"""
Simple Auth Service for DevAssist Pro
Простой сервис аутентификации для быстрого тестирования
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import uvicorn
import jwt
import hashlib
import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Simple Auth Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT configuration
JWT_SECRET = "your-super-secret-jwt-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 30

# Simple in-memory user storage for testing
test_users = {
    "zx1cc@gmail.com": {
        "id": 1,
        "email": "zx1cc@gmail.com",
        "password_hash": hashlib.sha256("test123".encode()).hexdigest(),
        "full_name": "Test User",
        "is_active": True,
        "created_at": datetime.datetime.utcnow().isoformat(),
    },
    "test@example.com": {
        "id": 2,
        "email": "test@example.com", 
        "password_hash": hashlib.sha256("testpassword".encode()).hexdigest(),
        "full_name": "Example User",
        "is_active": True,
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
}

# Pydantic models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = ""

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: UserResponse

class APIResponse(BaseModel):
    success: bool
    message: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: int) -> str:
    to_encode = {"sub": str(user_id), "type": "refresh"}
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

# API endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "auth"}

@app.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """User login"""
    logger.info(f"Login attempt for email: {login_data.email}")
    
    # Find user
    user = test_users.get(login_data.email.lower())
    if not user:
        logger.warning(f"User not found: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user["password_hash"]):
        logger.warning(f"Invalid password for user: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user["is_active"]:
        logger.warning(f"Inactive user attempted login: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": str(user["id"]), "email": user["email"]}
    )
    refresh_token = create_refresh_token(user["id"])
    
    logger.info(f"Login successful for user: {login_data.email}")
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=JWT_EXPIRE_MINUTES * 60,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            is_active=user["is_active"],
            created_at=user["created_at"]
        )
    )

@app.post("/auth/register", response_model=APIResponse)
async def register(register_data: RegisterRequest):
    """User registration"""
    logger.info(f"Registration attempt for email: {register_data.email}")
    
    # Check if user already exists
    if register_data.email.lower() in test_users:
        logger.warning(f"User already exists: {register_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    new_user_id = len(test_users) + 1
    test_users[register_data.email.lower()] = {
        "id": new_user_id,
        "email": register_data.email.lower(),
        "password_hash": hash_password(register_data.password),
        "full_name": register_data.full_name or "",
        "is_active": True,
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
    
    logger.info(f"User registered successfully: {register_data.email}")
    
    return APIResponse(
        success=True,
        message="User registered successfully"
    )

@app.post("/auth/refresh")
async def refresh_token():
    """Token refresh endpoint"""
    # Simple implementation for testing
    return {"message": "Token refresh not implemented in simple auth service"}

@app.get("/auth/me")
async def get_current_user():
    """Get current user info"""
    # Simple implementation for testing
    return {"message": "User info endpoint not implemented in simple auth service"}

if __name__ == "__main__":
    logger.info("Starting Simple Auth Service...")
    uvicorn.run(
        "simple_auth_service:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )