"""
Auth Service для DevAssist Pro
Сервис аутентификации и авторизации
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import uvicorn
import logging
import os
from datetime import datetime, timedelta

# Импорты из shared библиотеки
import sys
sys.path.append('/app/shared')

from shared.config import settings
from shared.database import get_db, create_tables
from shared.models import User, Organization, OrganizationMember
from shared.auth import UserManager, token_manager, AuthenticationError, AuthorizationError
from shared.schemas import (
    LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse,
    UserCreate, User as UserSchema, UserUpdate, UserPasswordUpdate,
    OrganizationCreate, Organization as OrganizationSchema,
    LogoutRequest, PasswordResetRequest, PasswordResetConfirm,
    EmailVerificationRequest, EmailVerificationConfirm,
    APIResponse, ErrorResponse, HealthCheck, UserPermissions
)

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание FastAPI приложения
app = FastAPI(
    title="DevAssist Pro Auth Service",
    description="Сервис аутентификации и авторизации",
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

# HTTP Bearer для токенов
security = HTTPBearer()

# Dependency для получения текущего пользователя
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Получение текущего пользователя по токену"""
    try:
        token = credentials.credentials
        payload = token_manager.verify_token(token, "access")
        user_id = payload.get("sub")
        
        if user_id is None:
            raise AuthenticationError("Invalid token payload")
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise AuthenticationError("User not found")
        
        if not user.is_active:
            raise AuthenticationError("User account is disabled")
        
        return user
        
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

# Dependency для проверки активного пользователя
async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Получение активного пользователя"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

# Dependency для проверки суперпользователя
async def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    """Получение суперпользователя"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Health check
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="1.0.0",
        services={
            "database": "connected",  # TODO: Добавить проверку БД
            "redis": "connected"       # TODO: Добавить проверку Redis
        }
    )

@app.get("/")
async def root():
    """Корневой endpoint"""
    return {
        "service": "DevAssist Pro Auth Service",
        "version": "1.0.0",
        "status": "running"
    }

# Аутентификация
@app.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Вход пользователя"""
    try:
        user_manager = UserManager(db)
        user = user_manager.authenticate_user(login_data.email, login_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Создаем токены
        access_token = token_manager.create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        refresh_token = token_manager.create_refresh_token(user.id)
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.jwt_expire_minutes * 60,
            user=UserSchema.model_validate(user)
        )
        
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@app.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Обновление access токена"""
    try:
        payload = token_manager.verify_token(refresh_data.refresh_token, "refresh")
        user_id = payload.get("sub")
        
        if not user_id:
            raise AuthenticationError("Invalid refresh token")
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")
        
        # Создаем новый access токен
        access_token = token_manager.create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return RefreshTokenResponse(
            access_token=access_token,
            expires_in=settings.jwt_expire_minutes * 60
        )
        
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@app.post("/logout", response_model=APIResponse)
async def logout(
    logout_data: LogoutRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Выход пользователя"""
    try:
        # Отзываем refresh токен
        token_manager.revoke_refresh_token(logout_data.refresh_token)
        
        return APIResponse(
            success=True,
            message="Successfully logged out"
        )
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return APIResponse(
            success=False,
            message="Logout failed"
        )

# Регистрация пользователей
@app.post("/register", response_model=UserSchema)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    try:
        user_manager = UserManager(db)
        user = user_manager.create_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            company=user_data.company,
            position=user_data.position,
            phone=user_data.phone
        )
        
        return UserSchema.model_validate(user)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

# Управление пользователями
@app.get("/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Получение информации о текущем пользователе"""
    return UserSchema.model_validate(current_user)

@app.put("/me", response_model=UserSchema)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Обновление информации о текущем пользователе"""
    try:
        for field, value in user_update.model_dump(exclude_unset=True).items():
            setattr(current_user, field, value)
        
        db.commit()
        db.refresh(current_user)
        
        return UserSchema.model_validate(current_user)
        
    except Exception as e:
        db.rollback()
        logger.error(f"User update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Update failed"
        )

@app.put("/me/password", response_model=APIResponse)
async def change_password(
    password_data: UserPasswordUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Изменение пароля пользователя"""
    try:
        user_manager = UserManager(db)
        
        # Проверяем текущий пароль
        if not user_manager.password_manager.verify_password(
            password_data.current_password, current_user.hashed_password
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password"
            )
        
        # Проверяем силу нового пароля
        strength_check = user_manager.password_manager.validate_password_strength(
            password_data.new_password
        )
        if not strength_check["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Weak password: {', '.join(strength_check['issues'])}"
            )
        
        # Обновляем пароль
        current_user.hashed_password = user_manager.password_manager.hash_password(
            password_data.new_password
        )
        db.commit()
        
        return APIResponse(
            success=True,
            message="Password updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Password change error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )

@app.get("/me/permissions", response_model=UserPermissions)
async def get_user_permissions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение разрешений пользователя"""
    user_manager = UserManager(db)
    permissions = user_manager.get_user_permissions(current_user)
    return UserPermissions(**permissions)

# Password reset
@app.post("/password-reset", response_model=APIResponse)
async def request_password_reset(reset_data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Запрос сброса пароля"""
    # TODO: Реализовать отправку email с токеном сброса
    return APIResponse(
        success=True,
        message="Password reset email sent"
    )

@app.post("/password-reset/confirm", response_model=APIResponse)
async def confirm_password_reset(reset_data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Подтверждение сброса пароля"""
    # TODO: Реализовать проверку токена и обновление пароля
    return APIResponse(
        success=True,
        message="Password reset successfully"
    )

# Email verification
@app.post("/email/verify", response_model=APIResponse)
async def request_email_verification(verify_data: EmailVerificationRequest):
    """Запрос верификации email"""
    # TODO: Реализовать отправку email с токеном верификации
    return APIResponse(
        success=True,
        message="Verification email sent"
    )

@app.post("/email/verify/confirm", response_model=APIResponse)
async def confirm_email_verification(verify_data: EmailVerificationConfirm, db: Session = Depends(get_db)):
    """Подтверждение верификации email"""
    # TODO: Реализовать проверку токена и обновление статуса верификации
    return APIResponse(
        success=True,
        message="Email verified successfully"
    )

# OAuth endpoints - temporarily commented out to fix import error
# from .oauth import oauth_manager, GoogleOAuthProvider, MicrosoftOAuthProvider, YandexOAuthProvider
# from shared.schemas import OAuthLoginRequest, OAuthProvider as OAuthProviderEnum

# OAuth endpoints temporarily disabled
# @app.get("/oauth/{provider}/authorize")
# async def oauth_authorize(provider: str, redirect_uri: str = None):
#     """Получение URL для OAuth авторизации"""
#     try:
#         auth_url = oauth_manager.get_authorization_url(provider)
#         return {"authorization_url": auth_url}
#     except Exception as e:
#         logger.error(f"OAuth authorize error: {str(e)}")
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e)
#         )

# OAuth login endpoint temporarily disabled
# @app.post("/oauth/login", response_model=LoginResponse)
# async def oauth_login(oauth_data: OAuthLoginRequest, db: Session = Depends(get_db)):
#     """OAuth вход"""
#     try:
#         # Обрабатываем OAuth callback
#         result = await oauth_manager.process_oauth_callback(
#             oauth_data.provider.value, 
#             oauth_data.code
#         )
#         
#         user_info = result["user_info"]
#         email = user_info["email"]
#         
#         if not email:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Email not provided by OAuth provider"
#             )
#         
#         # Ищем существующего пользователя
#         user = db.query(User).filter(User.email == email.lower()).first()
#         
#         # Если пользователя нет, создаем нового
#         if not user:
#             user_manager = UserManager(db)
#             # Генерируем случайный пароль для OAuth пользователей
#             random_password = user_manager.password_manager.generate_password()
#             
#             user = user_manager.create_user(
#                 email=email,
#                 password=random_password,
#                 full_name=user_info.get("name", ""),
#                 is_verified=True  # OAuth пользователи считаются верифицированными
#             )
#         
#         # Проверяем активность пользователя
#         if not user.is_active:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="User account is disabled"
#             )
#         
#         # Создаем токены
#         access_token = token_manager.create_access_token(
#             data={"sub": str(user.id), "email": user.email}
#         )
#         refresh_token = token_manager.create_refresh_token(user.id)
#         
#         return LoginResponse(
#             access_token=access_token,
#             refresh_token=refresh_token,
#             expires_in=settings.jwt_expire_minutes * 60,
#             user=UserSchema.model_validate(user)
#         )
#         
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"OAuth login error: {str(e)}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="OAuth login failed"
#         )

# Создание таблиц при запуске
@app.on_event("startup")
async def startup_event():
    """Инициализация при запуске"""
    logger.info("Starting Auth Service...")
    create_tables()
    logger.info("Auth Service started successfully")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=os.getenv("RELOAD", "false").lower() == "true"
    )