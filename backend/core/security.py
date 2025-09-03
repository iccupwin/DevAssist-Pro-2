#!/usr/bin/env python3
"""
Security System - СИСТЕМА БЕЗОПАСНОСТИ ДЛЯ ПРОДАКШЕНА
Аутентификация, авторизация, шифрование, rate limiting, audit logging
"""
import os
import logging
import hashlib
import secrets
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import time
import json
from collections import defaultdict, deque

import jwt
import bcrypt
from cryptography.fernet import Fernet
from fastapi import Request, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class SecurityConfig:
    """Конфигурация безопасности"""
    
    # JWT настройки
    JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    # Шифрование файлов
    FILE_ENCRYPTION_KEY = os.getenv("FILE_ENCRYPTION_KEY", Fernet.generate_key().decode())
    
    # Rate limiting
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour
    
    # Паролирование
    PASSWORD_MIN_LENGTH = int(os.getenv("PASSWORD_MIN_LENGTH", "8"))
    PASSWORD_REQUIRE_SPECIAL = os.getenv("PASSWORD_REQUIRE_SPECIAL", "true").lower() == "true"
    
    # Аудит
    AUDIT_LOG_ENABLED = os.getenv("AUDIT_LOG_ENABLED", "true").lower() == "true"
    AUDIT_LOG_PATH = os.getenv("AUDIT_LOG_PATH", "logs/audit.log")
    
    # IP фильтрация
    ALLOWED_IPS = os.getenv("ALLOWED_IPS", "").split(",") if os.getenv("ALLOWED_IPS") else []
    BLOCKED_IPS = os.getenv("BLOCKED_IPS", "").split(",") if os.getenv("BLOCKED_IPS") else []

class PasswordValidator:
    """Валидатор паролей"""
    
    @staticmethod
    def validate_password(password: str) -> tuple[bool, List[str]]:
        """
        Валидация пароля
        Возвращает (is_valid, list_of_errors)
        """
        errors = []
        
        if len(password) < SecurityConfig.PASSWORD_MIN_LENGTH:
            errors.append(f"Пароль должен быть не менее {SecurityConfig.PASSWORD_MIN_LENGTH} символов")
        
        if not any(c.islower() for c in password):
            errors.append("Пароль должен содержать строчные буквы")
            
        if not any(c.isupper() for c in password):
            errors.append("Пароль должен содержать заглавные буквы")
            
        if not any(c.isdigit() for c in password):
            errors.append("Пароль должен содержать цифры")
            
        if SecurityConfig.PASSWORD_REQUIRE_SPECIAL:
            if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
                errors.append("Пароль должен содержать специальные символы")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Хеширование пароля"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Проверка пароля"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False

class JWTManager:
    """Менеджер JWT токенов"""
    
    @staticmethod
    def create_access_token(user_data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Создание access токена"""
        to_encode = user_data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=SecurityConfig.JWT_EXPIRATION_HOURS)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        })
        
        encoded_jwt = jwt.encode(
            to_encode, 
            SecurityConfig.JWT_SECRET, 
            algorithm=SecurityConfig.JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(user_id: int) -> str:
        """Создание refresh токена"""
        to_encode = {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(days=30),
            "iat": datetime.utcnow(),
            "type": "refresh",
            "jti": secrets.token_hex(16)  # JWT ID for token revocation
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            SecurityConfig.JWT_SECRET,
            algorithm=SecurityConfig.JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
        """Проверка и декодирование токена"""
        try:
            payload = jwt.decode(
                token,
                SecurityConfig.JWT_SECRET,
                algorithms=[SecurityConfig.JWT_ALGORITHM]
            )
            
            if payload.get("type") != token_type:
                raise jwt.InvalidTokenError(f"Invalid token type: expected {token_type}")
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

class RateLimiter:
    """Rate limiting система"""
    
    def __init__(self):
        # Хранилище запросов по IP
        self.requests = defaultdict(deque)
        self.blocked_until = defaultdict(float)
    
    def is_allowed(self, client_ip: str, endpoint: str = None) -> bool:
        """Проверка разрешения запроса"""
        current_time = time.time()
        
        # Проверка блокировки
        if client_ip in self.blocked_until:
            if current_time < self.blocked_until[client_ip]:
                return False
            else:
                del self.blocked_until[client_ip]
        
        # Ключ для отслеживания (IP + endpoint)
        key = f"{client_ip}:{endpoint}" if endpoint else client_ip
        
        # Очистка старых запросов
        window_start = current_time - SecurityConfig.RATE_LIMIT_WINDOW
        while self.requests[key] and self.requests[key][0] < window_start:
            self.requests[key].popleft()
        
        # Проверка лимита
        if len(self.requests[key]) >= SecurityConfig.RATE_LIMIT_REQUESTS:
            # Блокируем на 1 час
            self.blocked_until[client_ip] = current_time + 3600
            logger.warning(f"Rate limit exceeded for {client_ip}, blocked for 1 hour")
            return False
        
        # Добавляем текущий запрос
        self.requests[key].append(current_time)
        return True
    
    def get_remaining_requests(self, client_ip: str, endpoint: str = None) -> int:
        """Получение количества оставшихся запросов"""
        key = f"{client_ip}:{endpoint}" if endpoint else client_ip
        current_requests = len(self.requests[key])
        return max(0, SecurityConfig.RATE_LIMIT_REQUESTS - current_requests)

class FileEncryption:
    """Шифрование файлов"""
    
    def __init__(self):
        self.cipher_suite = Fernet(SecurityConfig.FILE_ENCRYPTION_KEY.encode())
    
    def encrypt_file_content(self, content: bytes) -> bytes:
        """Шифрование содержимого файла"""
        try:
            encrypted_content = self.cipher_suite.encrypt(content)
            return encrypted_content
        except Exception as e:
            logger.error(f"File encryption error: {e}")
            raise
    
    def decrypt_file_content(self, encrypted_content: bytes) -> bytes:
        """Расшифровка содержимого файла"""
        try:
            decrypted_content = self.cipher_suite.decrypt(encrypted_content)
            return decrypted_content
        except Exception as e:
            logger.error(f"File decryption error: {e}")
            raise
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Шифрование чувствительных данных (строки)"""
        try:
            encrypted_data = self.cipher_suite.encrypt(data.encode('utf-8'))
            return encrypted_data.decode('utf-8')
        except Exception as e:
            logger.error(f"Data encryption error: {e}")
            raise
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Расшифровка чувствительных данных"""
        try:
            decrypted_data = self.cipher_suite.decrypt(encrypted_data.encode('utf-8'))
            return decrypted_data.decode('utf-8')
        except Exception as e:
            logger.error(f"Data decryption error: {e}")
            raise

class AuditLogger:
    """Система аудит логирования"""
    
    def __init__(self):
        self.audit_log_path = SecurityConfig.AUDIT_LOG_PATH
        os.makedirs(os.path.dirname(self.audit_log_path), exist_ok=True)
    
    def log_action(self, 
                   user_id: Optional[int], 
                   action: str, 
                   resource: str, 
                   client_ip: str,
                   request_data: Optional[Dict] = None,
                   success: bool = True,
                   error_message: Optional[str] = None):
        """Логирование действия пользователя"""
        
        if not SecurityConfig.AUDIT_LOG_ENABLED:
            return
        
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "client_ip": client_ip,
            "success": success,
            "error_message": error_message,
            "request_data": request_data,
            "session_id": self._generate_session_id(user_id, client_ip)
        }
        
        try:
            with open(self.audit_log_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(audit_entry, ensure_ascii=False) + '\n')
        except Exception as e:
            logger.error(f"Audit logging error: {e}")
    
    def _generate_session_id(self, user_id: Optional[int], client_ip: str) -> str:
        """Генерация ID сессии"""
        data = f"{user_id}:{client_ip}:{datetime.now().date()}"
        return hashlib.md5(data.encode()).hexdigest()[:16]

class IPFilter:
    """Фильтрация по IP адресам"""
    
    @staticmethod
    def is_ip_allowed(client_ip: str) -> bool:
        """Проверка разрешения IP адреса"""
        
        # Проверка блокировки
        if SecurityConfig.BLOCKED_IPS and client_ip in SecurityConfig.BLOCKED_IPS:
            return False
        
        # Проверка whitelist (если настроен)
        if SecurityConfig.ALLOWED_IPS:
            return client_ip in SecurityConfig.ALLOWED_IPS
        
        # Если whitelist не настроен, разрешаем все кроме заблокированных
        return True

class SecurityMiddleware:
    """Middleware безопасности"""
    
    def __init__(self):
        self.rate_limiter = RateLimiter()
        self.audit_logger = AuditLogger()
        self.file_encryption = FileEncryption()
        self.jwt_manager = JWTManager()
        self.security = HTTPBearer()
    
    async def verify_request_security(self, request: Request) -> Dict[str, Any]:
        """Комплексная проверка безопасности запроса"""
        
        client_ip = self._get_client_ip(request)
        endpoint = str(request.url.path)
        
        # 1. Проверка IP адреса
        if not IPFilter.is_ip_allowed(client_ip):
            self.audit_logger.log_action(
                None, "IP_BLOCKED", endpoint, client_ip, 
                success=False, error_message="IP address blocked"
            )
            raise HTTPException(status_code=403, detail="IP address blocked")
        
        # 2. Rate limiting
        if not self.rate_limiter.is_allowed(client_ip, endpoint):
            self.audit_logger.log_action(
                None, "RATE_LIMIT_EXCEEDED", endpoint, client_ip,
                success=False, error_message="Rate limit exceeded"
            )
            raise HTTPException(status_code=429, detail="Too many requests")
        
        # 3. Аудит запроса
        self.audit_logger.log_action(
            None, "REQUEST", endpoint, client_ip, 
            request_data={"method": request.method, "endpoint": endpoint}
        )
        
        return {
            "client_ip": client_ip,
            "endpoint": endpoint,
            "remaining_requests": self.rate_limiter.get_remaining_requests(client_ip, endpoint)
        }
    
    def _get_client_ip(self, request: Request) -> str:
        """Получение IP адреса клиента"""
        # Проверка заголовков прокси
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    async def authenticate_user(self, credentials: HTTPAuthorizationCredentials = Security(HTTPBearer())) -> Dict[str, Any]:
        """Аутентификация пользователя по JWT токену"""
        
        if not credentials:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        try:
            payload = self.jwt_manager.verify_token(credentials.credentials)
            return payload
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise HTTPException(status_code=401, detail="Invalid authentication")

# Глобальные экземпляры
security_middleware = SecurityMiddleware()
password_validator = PasswordValidator()
jwt_manager = JWTManager()
audit_logger = AuditLogger()
file_encryption = FileEncryption()

# Dependency для FastAPI
async def get_current_user(request: Request, 
                          credentials: HTTPAuthorizationCredentials = Security(HTTPBearer())) -> Dict[str, Any]:
    """Dependency для получения текущего пользователя"""
    
    # Проверка безопасности запроса
    await security_middleware.verify_request_security(request)
    
    # Аутентификация пользователя
    user_data = await security_middleware.authenticate_user(credentials)
    
    # Логирование успешной аутентификации
    client_ip = security_middleware._get_client_ip(request)
    audit_logger.log_action(
        user_data.get("user_id"),
        "AUTH_SUCCESS", 
        str(request.url.path), 
        client_ip,
        success=True
    )
    
    return user_data

async def verify_admin_access(current_user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency для проверки прав администратора"""
    
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return current_user

def create_security_headers() -> Dict[str, str]:
    """Создание заголовков безопасности"""
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY", 
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }