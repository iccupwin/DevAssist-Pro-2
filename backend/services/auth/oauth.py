"""
OAuth провайдеры для DevAssist Pro
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import httpx
import secrets
import urllib.parse
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

class OAuthProvider(ABC):
    """Базовый класс для OAuth провайдеров"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
    
    @abstractmethod
    def get_authorization_url(self, state: str = None) -> str:
        """Получение URL для авторизации"""
        pass
    
    @abstractmethod
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Обмен кода на токен"""
        pass
    
    @abstractmethod
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Получение информации о пользователе"""
        pass

class GoogleOAuthProvider(OAuthProvider):
    """Google OAuth провайдер"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        super().__init__(client_id, client_secret, redirect_uri)
        self.auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_url = "https://oauth2.googleapis.com/token"
        self.user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        self.scope = "openid email profile"
    
    def get_authorization_url(self, state: str = None) -> str:
        """Получение URL для авторизации Google"""
        if not state:
            state = secrets.token_urlsafe(32)
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": self.scope,
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
        
        return f"{self.auth_url}?{urllib.parse.urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Обмен кода на токен Google"""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, data=data)
            
            if response.status_code != 200:
                logger.error(f"Google token exchange failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for token"
                )
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Получение информации о пользователе Google"""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.user_info_url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Google user info failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info"
                )
            
            user_data = response.json()
            return {
                "email": user_data.get("email"),
                "name": user_data.get("name"),
                "picture": user_data.get("picture"),
                "provider": "google",
                "provider_id": user_data.get("id")
            }

class MicrosoftOAuthProvider(OAuthProvider):
    """Microsoft OAuth провайдер"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        super().__init__(client_id, client_secret, redirect_uri)
        self.auth_url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
        self.token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        self.user_info_url = "https://graph.microsoft.com/v1.0/me"
        self.scope = "openid email profile User.Read"
    
    def get_authorization_url(self, state: str = None) -> str:
        """Получение URL для авторизации Microsoft"""
        if not state:
            state = secrets.token_urlsafe(32)
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": self.scope,
            "response_type": "code",
            "response_mode": "query",
            "state": state
        }
        
        return f"{self.auth_url}?{urllib.parse.urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Обмен кода на токен Microsoft"""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, data=data)
            
            if response.status_code != 200:
                logger.error(f"Microsoft token exchange failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for token"
                )
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Получение информации о пользователе Microsoft"""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.user_info_url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Microsoft user info failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info"
                )
            
            user_data = response.json()
            return {
                "email": user_data.get("mail") or user_data.get("userPrincipalName"),
                "name": user_data.get("displayName"),
                "picture": None,  # Microsoft Graph требует отдельный запрос для фото
                "provider": "microsoft",
                "provider_id": user_data.get("id")
            }

class YandexOAuthProvider(OAuthProvider):
    """Yandex OAuth провайдер"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        super().__init__(client_id, client_secret, redirect_uri)
        self.auth_url = "https://oauth.yandex.ru/authorize"
        self.token_url = "https://oauth.yandex.ru/token"
        self.user_info_url = "https://login.yandex.ru/info"
        self.scope = "login:email login:info"
    
    def get_authorization_url(self, state: str = None) -> str:
        """Получение URL для авторизации Yandex"""
        if not state:
            state = secrets.token_urlsafe(32)
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": self.scope,
            "response_type": "code",
            "state": state
        }
        
        return f"{self.auth_url}?{urllib.parse.urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Обмен кода на токен Yandex"""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, data=data)
            
            if response.status_code != 200:
                logger.error(f"Yandex token exchange failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for token"
                )
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Получение информации о пользователе Yandex"""
        headers = {"Authorization": f"OAuth {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.user_info_url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Yandex user info failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info"
                )
            
            user_data = response.json()
            return {
                "email": user_data.get("default_email"),
                "name": user_data.get("real_name") or user_data.get("display_name"),
                "picture": f"https://avatars.yandex.net/get-yapic/{user_data.get('default_avatar_id')}/islands-200" if user_data.get('default_avatar_id') else None,
                "provider": "yandex",
                "provider_id": user_data.get("id")
            }

class OAuthManager:
    """Менеджер OAuth провайдеров"""
    
    def __init__(self):
        self.providers = {}
    
    def register_provider(self, name: str, provider: OAuthProvider):
        """Регистрация OAuth провайдера"""
        self.providers[name] = provider
    
    def get_provider(self, name: str) -> Optional[OAuthProvider]:
        """Получение OAuth провайдера"""
        return self.providers.get(name)
    
    def get_authorization_url(self, provider_name: str, state: str = None) -> str:
        """Получение URL авторизации для провайдера"""
        provider = self.get_provider(provider_name)
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown OAuth provider: {provider_name}"
            )
        
        return provider.get_authorization_url(state)
    
    async def process_oauth_callback(self, provider_name: str, code: str) -> Dict[str, Any]:
        """Обработка OAuth callback"""
        provider = self.get_provider(provider_name)
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown OAuth provider: {provider_name}"
            )
        
        # Обмениваем код на токен
        token_data = await provider.exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get access token"
            )
        
        # Получаем информацию о пользователе
        user_info = await provider.get_user_info(access_token)
        
        return {
            "user_info": user_info,
            "token_data": token_data
        }

# Создание глобального менеджера OAuth
oauth_manager = OAuthManager()