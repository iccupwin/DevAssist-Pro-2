"""
Утилиты аутентификации и авторизации для DevAssist Pro
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import string
from email_validator import validate_email, EmailNotValidError
import redis
import json
from sqlalchemy.orm import Session
from .config import settings
from .models import User, Organization, OrganizationMember

# Контекст для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Redis для хранения refresh токенов и блэклиста
redis_client = redis.from_url(settings.redis_url, decode_responses=True)

class AuthenticationError(Exception):
    """Ошибка аутентификации"""
    pass

class AuthorizationError(Exception):
    """Ошибка авторизации"""
    pass

class TokenManager:
    """Менеджер JWT токенов"""
    
    def __init__(self):
        self.secret_key = settings.jwt_secret_key
        self.algorithm = settings.jwt_algorithm
        self.access_token_expire_minutes = settings.jwt_expire_minutes
        self.refresh_token_expire_days = 30
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Создание access токена"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({
            "exp": expire,
            "type": "access",
            "iat": datetime.utcnow()
        })
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, user_id: int) -> str:
        """Создание refresh токена"""
        # Создаем уникальный идентификатор токена
        jti = secrets.token_urlsafe(32)
        
        data = {
            "sub": str(user_id),
            "jti": jti,
            "type": "refresh",
            "exp": datetime.utcnow() + timedelta(days=self.refresh_token_expire_days),
            "iat": datetime.utcnow()
        }
        
        encoded_jwt = jwt.encode(data, self.secret_key, algorithm=self.algorithm)
        
        # Сохраняем refresh токен в Redis
        redis_key = f"refresh_token:{user_id}:{jti}"
        redis_client.setex(
            redis_key,
            timedelta(days=self.refresh_token_expire_days),
            json.dumps({"active": True, "created_at": datetime.utcnow().isoformat()})
        )
        
        return encoded_jwt
    
    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """Проверка токена"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Проверяем тип токена
            if payload.get("type") != token_type:
                raise AuthenticationError(f"Invalid token type. Expected {token_type}")
            
            # Проверяем блэклист для access токенов
            if token_type == "access":
                token_id = payload.get("jti")
                if token_id and redis_client.get(f"blacklist:{token_id}"):
                    raise AuthenticationError("Token is blacklisted")
            
            # Проверяем активность refresh токена
            if token_type == "refresh":
                user_id = payload.get("sub")
                jti = payload.get("jti")
                if user_id and jti:
                    redis_key = f"refresh_token:{user_id}:{jti}"
                    token_data = redis_client.get(redis_key)
                    if not token_data:
                        raise AuthenticationError("Refresh token not found or expired")
                    
                    token_info = json.loads(token_data)
                    if not token_info.get("active"):
                        raise AuthenticationError("Refresh token is inactive")
            
            return payload
            
        except JWTError as e:
            raise AuthenticationError(f"Token validation failed: {str(e)}")
    
    def revoke_refresh_token(self, token: str) -> bool:
        """Отзыв refresh токена"""
        try:
            payload = self.verify_token(token, "refresh")
            user_id = payload.get("sub")
            jti = payload.get("jti")
            
            if user_id and jti:
                redis_key = f"refresh_token:{user_id}:{jti}"
                token_data = redis_client.get(redis_key)
                if token_data:
                    token_info = json.loads(token_data)
                    token_info["active"] = False
                    redis_client.setex(redis_key, timedelta(days=1), json.dumps(token_info))
                    return True
            
            return False
            
        except AuthenticationError:
            return False
    
    def blacklist_access_token(self, token: str) -> bool:
        """Добавление access токена в блэклист"""
        try:
            payload = self.verify_token(token, "access")
            jti = payload.get("jti")
            exp = payload.get("exp")
            
            if jti and exp:
                # Вычисляем время до истечения токена
                expire_time = datetime.fromtimestamp(exp) - datetime.utcnow()
                if expire_time.total_seconds() > 0:
                    redis_client.setex(f"blacklist:{jti}", expire_time, "true")
                return True
            
            return False
            
        except AuthenticationError:
            return False

class PasswordManager:
    """Менеджер паролей"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Хеширование пароля"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Проверка пароля"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def generate_password(length: int = 12) -> str:
        """Генерация случайного пароля"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Union[bool, str]]:
        """Проверка надежности пароля"""
        issues = []
        
        if len(password) < 8:
            issues.append("Пароль должен содержать минимум 8 символов")
        
        if not any(c.isupper() for c in password):
            issues.append("Пароль должен содержать заглавные буквы")
        
        if not any(c.islower() for c in password):
            issues.append("Пароль должен содержать строчные буквы")
        
        if not any(c.isdigit() for c in password):
            issues.append("Пароль должен содержать цифры")
        
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            issues.append("Пароль должен содержать специальные символы")
        
        return {
            "is_valid": len(issues) == 0,
            "issues": issues
        }

class UserManager:
    """Менеджер пользователей"""
    
    def __init__(self, db: Session):
        self.db = db
        self.token_manager = TokenManager()
        self.password_manager = PasswordManager()
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Аутентификация пользователя"""
        user = self.db.query(User).filter(User.email == email.lower()).first()
        
        if not user:
            return None
        
        if not user.is_active:
            raise AuthenticationError("Аккаунт деактивирован")
        
        if not self.password_manager.verify_password(password, user.hashed_password):
            return None
        
        return user
    
    def create_user(self, email: str, password: str, full_name: str, **kwargs) -> User:
        """Создание нового пользователя"""
        # Валидация email
        try:
            validated_email = validate_email(email)
            email = validated_email.email.lower()
        except EmailNotValidError:
            raise ValueError("Некорректный email адрес")
        
        # Проверка уникальности email
        if self.db.query(User).filter(User.email == email).first():
            raise ValueError("Пользователь с таким email уже существует")
        
        # Валидация пароля
        password_check = self.password_manager.validate_password_strength(password)
        if not password_check["is_valid"]:
            raise ValueError(f"Слабый пароль: {', '.join(password_check['issues'])}")
        
        # Создание пользователя
        hashed_password = self.password_manager.hash_password(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            **kwargs
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def get_user_permissions(self, user: User) -> Dict[str, Any]:
        """Получение разрешений пользователя"""
        permissions = {
            "is_superuser": user.is_superuser,
            "organizations": [],
            "global_permissions": []
        }
        
        # Разрешения суперпользователя
        if user.is_superuser:
            permissions["global_permissions"] = ["admin", "manage_users", "manage_organizations"]
        
        # Разрешения по организациям
        for membership in user.organizations:
            org_perms = {
                "organization_id": membership.organization_id,
                "organization_name": membership.organization.name,
                "role": membership.role,
                "permissions": []
            }
            
            # Разрешения в зависимости от роли
            if membership.role == "owner":
                org_perms["permissions"] = ["admin", "manage_members", "manage_projects", "view_analytics"]
            elif membership.role == "admin":
                org_perms["permissions"] = ["manage_projects", "view_analytics", "manage_members"]
            elif membership.role == "member":
                org_perms["permissions"] = ["view_projects", "create_projects"]
            
            permissions["organizations"].append(org_perms)
        
        return permissions

class EmailValidator:
    """Валидатор email адресов"""
    
    @staticmethod
    def validate_email_format(email: str) -> bool:
        """Проверка формата email"""
        try:
            validate_email(email)
            return True
        except EmailNotValidError:
            return False
    
    @staticmethod
    def is_business_email(email: str) -> bool:
        """Проверка на корпоративный email (не Gmail, Yandex и т.д.)"""
        domain = email.split('@')[1].lower()
        consumer_domains = {
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'yandex.ru', 'yandex.com', 'mail.ru', 'rambler.ru'
        }
        return domain not in consumer_domains

# Глобальные экземпляры
token_manager = TokenManager()
password_manager = PasswordManager()
email_validator = EmailValidator()