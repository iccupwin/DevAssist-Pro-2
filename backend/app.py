#!/usr/bin/env python3
"""
DevAssist Pro - Монолитное приложение
Объединяет все сервисы в одном FastAPI приложении для упрощения запуска
"""
import os
import logging
import sys
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
import time
import hashlib

# FastAPI и зависимости
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query, UploadFile, File, Request
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Добавляем путь к shared модулям
sys.path.append(str(Path(__file__).parent / "shared"))

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========================================
# СХЕМЫ И МОДЕЛИ
# ========================================

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str
    version: str = "1.0.0"

class AnalyticsRequest(BaseModel):
    data_type: str
    aggregation_type: str = "count"
    period: str = "30d"
    filters: Optional[Dict[str, Any]] = {}

class AnalyticsResponse(BaseModel):
    data_type: str
    results: Dict[str, Any]
    metadata: Dict[str, Any]

class ReportGenerationRequest(BaseModel):
    analysis_id: int
    report_format: str = "pdf"
    template_name: str = "kp_analysis_default"
    include_charts: bool = True
    include_raw_data: bool = False

class ReportGenerationResponse(BaseModel):
    report_id: str
    analysis_id: int
    format: str
    status: str
    download_url: Optional[str] = None
    generated_at: str

class DashboardStats(BaseModel):
    overview: Dict[str, Any]
    charts: List[Dict[str, Any]]
    metrics: Dict[str, Any]

# Схемы для аутентификации
class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    company: Optional[str] = None
    phone: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    role: str = "user"
    created_at: str

class AuthResponse(BaseModel):
    success: bool
    user: Optional[UserResponse] = None
    token: Optional[str] = None
    error: Optional[str] = None

# ========================================
# БИЗНЕС-ЛОГИКА
# ========================================

class ReportsManager:
    """Менеджер отчетов"""
    
    def __init__(self):
        self.reports_dir = Path("data/reports")
        self.reports_dir.mkdir(exist_ok=True)
    
    async def generate_pdf_report(self, analysis_id: int, template_name: str = "default") -> str:
        """Генерация PDF отчета"""
        filename = f"kp_analysis_{analysis_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = self.reports_dir / filename
        
        # Мок-генерация PDF
        pdf_content = f"""
        КП АНАЛИЗ ОТЧЕТ #{analysis_id}
        =============================
        
        Дата: {datetime.now().strftime('%d.%m.%Y %H:%M')}
        Шаблон: {template_name}
        
        ОСНОВНЫЕ МЕТРИКИ:
        - Качество предложения: 85%
        - Соответствие требованиям: 92%
        - Конкурентоспособность: 78%
        
        РЕКОМЕНДАЦИИ:
        - Уточнить сроки выполнения
        - Добавить гарантийные обязательства
        - Пересмотреть ценовую политику
        
        ЗАКЛЮЧЕНИЕ:
        Коммерческое предложение соответствует требованиям,
        рекомендуется к рассмотрению с учетом замечаний.
        """
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(pdf_content)
        
        logger.info(f"PDF отчет создан: {filename}")
        return filename
    
    async def generate_excel_report(self, analysis_id: int) -> str:
        """Генерация Excel отчета"""
        filename = f"kp_data_{analysis_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        filepath = self.reports_dir / filename
        
        # Мок-генерация Excel
        excel_content = f"""
        Лист 1: Основные данные
        ID Анализа: {analysis_id}
        Дата: {datetime.now()}
        
        Лист 2: Метрики
        Качество: 85%
        Соответствие: 92%
        Конкурентность: 78%
        
        Лист 3: Рекомендации
        1. Уточнить сроки
        2. Добавить гарантии
        3. Пересмотреть цены
        """
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(excel_content)
        
        logger.info(f"Excel отчет создан: {filename}")
        return filename

class AnalyticsManager:
    """Менеджер аналитики"""
    
    def __init__(self):
        self.cache = {}
    
    async def process_analytics(self, data_type: str, aggregation_type: str = "count") -> Dict[str, Any]:
        """Обработка аналитических данных"""
        
        # Мок-данные для демонстрации
        mock_data = {
            "analyses": {
                "total_analyses": 1247,
                "successful_analyses": 1156,
                "failed_analyses": 91,
                "success_rate": 92.7,
                "avg_processing_time": 23.5,
                "total_cost": 1847.50
            },
            "documents": {
                "total_documents": 2394,
                "processed_documents": 2201,
                "pdf_documents": 1456,
                "docx_documents": 789,
                "txt_documents": 149,
                "avg_file_size": 2.3
            },
            "users": {
                "total_users": 89,
                "active_users": 67,
                "new_users": 12,
                "avg_session_duration": 45.2
            },
            "projects": {
                "total_projects": 234,
                "active_projects": 89,
                "completed_projects": 134,
                "avg_project_duration": 12.5
            }
        }
        
        return mock_data.get(data_type, {})
    
    async def calculate_metrics(self, metric_types: List[str], period: str = "30d") -> Dict[str, Any]:
        """Расчет метрик"""
        
        metrics = {}
        
        for metric_type in metric_types:
            if metric_type == "success_rate":
                metrics[metric_type] = {
                    "value": 92.7,
                    "unit": "%",
                    "trend": "+2.3",
                    "period": period
                }
            elif metric_type == "avg_processing_time":
                metrics[metric_type] = {
                    "value": 23.5,
                    "unit": "сек",
                    "trend": "-1.2",
                    "period": period
                }
            elif metric_type == "cost_per_analysis":
                metrics[metric_type] = {
                    "value": 1.48,
                    "unit": "$",
                    "trend": "-0.15",
                    "period": period
                }
        
        return metrics
    
    async def generate_dashboard_stats(self, period: str = "30d") -> Dict[str, Any]:
        """Генерация статистики для дашборда"""
        
        return {
            "overview": {
                "total_projects": 234,
                "total_analyses": 1247,
                "total_documents": 2394,
                "total_users": 89,
                "success_rate": 92.7,
                "avg_processing_time": 23.5
            },
            "charts": [
                {
                    "type": "line",
                    "title": "Анализы по дням",
                    "data": [45, 52, 38, 41, 59, 67, 48]
                },
                {
                    "type": "pie", 
                    "title": "Типы документов",
                    "data": {"PDF": 61, "DOCX": 33, "TXT": 6}
                },
                {
                    "type": "bar",
                    "title": "Успешность по проектам",
                    "data": [89, 92, 87, 94, 91]
                }
            ],
            "metrics": {
                "period": period,
                "generated_at": datetime.now().isoformat(),
                "total_cost": 1847.50,
                "avg_cost_per_analysis": 1.48
            }
        }

class AuthManager:
    """Менеджер аутентификации (Mock для разработки)"""
    
    def __init__(self):
        self.users_db = {}  # Mock база пользователей
        self.sessions = {}  # Mock сессии
        
        # Создаем админа по умолчанию
        admin_user = {
            "id": "admin_001",
            "email": "admin@devassist.pro",
            "password": self._hash_password("admin123"),
            "full_name": "Администратор",
            "company": "DevAssist Pro",
            "phone": "+7 (495) 123-45-67",
            "role": "admin",
            "created_at": datetime.now().isoformat()
        }
        self.users_db["admin@devassist.pro"] = admin_user
    
    def _hash_password(self, password: str) -> str:
        """Простое хеширование пароля"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _generate_token(self, user_id: str) -> str:
        """Генерация простого токена"""
        timestamp = str(int(time.time()))
        token_data = f"{user_id}:{timestamp}"
        return hashlib.md5(token_data.encode()).hexdigest()
    
    async def register_user(self, user_data: UserRegisterRequest) -> AuthResponse:
        """Регистрация нового пользователя"""
        try:
            # Проверка существования пользователя
            if user_data.email in self.users_db:
                return AuthResponse(
                    success=False,
                    error="Пользователь с таким email уже существует"
                )
            
            # Валидация пароля
            if len(user_data.password) < 8:
                return AuthResponse(
                    success=False,
                    error="Пароль должен содержать минимум 8 символов"
                )
            
            # Создание пользователя
            user_id = f"user_{int(time.time())}"
            new_user = {
                "id": user_id,
                "email": user_data.email,
                "password": self._hash_password(user_data.password),
                "full_name": user_data.full_name,
                "company": user_data.company,
                "phone": user_data.phone,
                "role": "user",
                "created_at": datetime.now().isoformat()
            }
            
            # Сохранение пользователя
            self.users_db[user_data.email] = new_user
            
            # Генерация токена
            token = self._generate_token(user_id)
            self.sessions[token] = user_id
            
            # Ответ пользователю
            user_response = UserResponse(
                id=new_user["id"],
                email=new_user["email"],
                full_name=new_user["full_name"],
                company=new_user["company"],
                phone=new_user["phone"],
                role=new_user["role"],
                created_at=new_user["created_at"]
            )
            
            logger.info(f"Пользователь зарегистрирован: {user_data.email}")
            
            return AuthResponse(
                success=True,
                user=user_response,
                token=token
            )
            
        except Exception as e:
            logger.error(f"Ошибка регистрации: {e}")
            return AuthResponse(
                success=False,
                error=f"Ошибка регистрации: {str(e)}"
            )
    
    async def login_user(self, login_data: UserLoginRequest) -> AuthResponse:
        """Вход пользователя"""
        try:
            # Поиск пользователя
            user = self.users_db.get(login_data.email)
            if not user:
                return AuthResponse(
                    success=False,
                    error="Пользователь не найден"
                )
            
            # Проверка пароля
            if user["password"] != self._hash_password(login_data.password):
                return AuthResponse(
                    success=False,
                    error="Неверный пароль"
                )
            
            # Генерация токена
            token = self._generate_token(user["id"])
            self.sessions[token] = user["id"]
            
            # Ответ пользователю
            user_response = UserResponse(
                id=user["id"],
                email=user["email"],
                full_name=user["full_name"],
                company=user["company"],
                phone=user["phone"],
                role=user["role"],
                created_at=user["created_at"]
            )
            
            logger.info(f"Пользователь вошел в систему: {login_data.email}")
            
            return AuthResponse(
                success=True,
                user=user_response,
                token=token
            )
            
        except Exception as e:
            logger.error(f"Ошибка входа: {e}")
            return AuthResponse(
                success=False,
                error=f"Ошибка входа: {str(e)}"
            )
    
    async def get_user_by_token(self, token: str) -> Optional[UserResponse]:
        """Получение пользователя по токену"""
        try:
            user_id = self.sessions.get(token)
            if not user_id:
                return None
            
            # Поиск пользователя по ID
            for user in self.users_db.values():
                if user["id"] == user_id:
                    return UserResponse(
                        id=user["id"],
                        email=user["email"],
                        full_name=user["full_name"],
                        company=user["company"],
                        phone=user["phone"],
                        role=user["role"],
                        created_at=user["created_at"]
                    )
            
            return None
        except Exception as e:
            logger.error(f"Ошибка получения пользователя: {e}")
            return None

class DocumentsManager:
    """Менеджер документов"""
    
    def __init__(self):
        self.uploads_dir = Path("data/uploads")
        self.uploads_dir.mkdir(exist_ok=True)
    
    async def upload_file(self, file: UploadFile) -> Dict[str, Any]:
        """Загрузка файла"""
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        filepath = self.uploads_dir / filename
        
        content = await file.read()
        with open(filepath, 'wb') as f:
            f.write(content)
        
        return {
            "document_id": hash(filename) % 100000,
            "filename": filename,
            "original_name": file.filename,
            "size": len(content),
            "content_type": file.content_type,
            "uploaded_at": datetime.now().isoformat()
        }
    
    async def analyze_document(self, document_id: int) -> Dict[str, Any]:
        """Анализ документа"""
        
        # Мок-анализ КП
        return {
            "analysis_id": document_id * 10,
            "document_id": document_id,
            "status": "completed",
            "analysis_type": "kp_analysis",
            "results": {
                "quality_score": 85.2,
                "compliance_score": 92.1,
                "competitiveness_score": 78.5,
                "summary": "Коммерческое предложение соответствует требованиям с замечаниями",
                "recommendations": [
                    "Уточнить сроки выполнения работ",
                    "Добавить информацию о гарантийных обязательствах",
                    "Пересмотреть ценовую политику в сторону конкурентоспособности"
                ],
                "key_points": [
                    "Четко сформулированы цели проекта",
                    "Указаны основные этапы выполнения",
                    "Присутствует техническое описание",
                    "Недостаточно детализированы риски"
                ]
            },
            "processed_at": datetime.now().isoformat(),
            "processing_time": 23.7,
            "ai_provider": "openai",
            "model_used": "gpt-4"
        }

# ========================================
# СОЗДАНИЕ ПРИЛОЖЕНИЯ
# ========================================

# Инициализация менеджеров
auth_manager = AuthManager()
reports_manager = ReportsManager()
analytics_manager = AnalyticsManager()
documents_manager = DocumentsManager()

# Создание FastAPI приложения
app = FastAPI(
    title="DevAssist Pro - КП Анализатор",
    description="Монолитное приложение для анализа коммерческих предложений",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# ROOT & HEALTH CHECK
# ========================================

@app.get("/", response_class=HTMLResponse)
async def root():
    """Корневая страница API"""
    html_content = f"""
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DevAssist Pro - API Backend</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }}
            .container {{
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #2E75D6 0%, #1e3c72 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 2.5em;
                font-weight: 300;
            }}
            .header p {{
                margin: 10px 0 0 0;
                opacity: 0.9;
                font-size: 1.1em;
            }}
            .content {{
                padding: 30px;
            }}
            .status {{
                display: inline-block;
                background: #10B981;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 500;
                margin-bottom: 20px;
            }}
            .endpoints {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }}
            .endpoint {{
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                transition: transform 0.2s, box-shadow 0.2s;
            }}
            .endpoint:hover {{
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }}
            .endpoint h3 {{
                margin: 0 0 10px 0;
                color: #2E75D6;
                font-size: 1.2em;
            }}
            .endpoint a {{
                color: #6366f1;
                text-decoration: none;
                font-family: monospace;
                background: #f1f5f9;
                padding: 4px 8px;
                border-radius: 4px;
                display: inline-block;
                margin: 2px 0;
            }}
            .endpoint a:hover {{
                background: #e2e8f0;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
                margin-top: 30px;
            }}
            .timestamp {{
                font-family: monospace;
                font-size: 0.9em;
                color: #9ca3af;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>DevAssist Pro</h1>
                <p>AI-powered веб-портал для анализа коммерческих предложений</p>
            </div>
            
            <div class="content">
                <div class="status">🟢 Backend Running v1.0.0</div>
                
                <h2>Доступные API Endpoints</h2>
                
                <div class="endpoints">
                    <div class="endpoint">
                        <h3>🔧 Системные</h3>
                        <a href="/health">GET /health</a><br>
                        <a href="/docs">GET /docs</a><br>
                        <a href="/api/admin/status">GET /api/admin/status</a>
                    </div>
                    
                    <div class="endpoint">
                        <h3>🔐 Аутентификация</h3>
                        <a>POST /api/auth/register</a><br>
                        <a>POST /api/auth/login</a><br>
                        <a>GET /api/auth/me</a><br>
                        <a>POST /api/auth/logout</a>
                    </div>
                    
                    <div class="endpoint">
                        <h3>📄 Документы</h3>
                        <a>POST /api/documents/upload</a><br>
                        <a>POST /api/documents/{{id}}/analyze</a>
                    </div>
                    
                    <div class="endpoint">
                        <h3>🎯 КП Анализатор</h3>
                        <a>POST /api/kp-analyzer/full-analysis</a>
                    </div>
                    
                    <div class="endpoint">
                        <h3>📊 Аналитика</h3>
                        <a href="/api/analytics/dashboard">GET /api/analytics/dashboard</a><br>
                        <a>POST /api/analytics/process</a><br>
                        <a>POST /api/analytics/metrics</a>
                    </div>
                    
                    <div class="endpoint">
                        <h3>📋 Отчеты</h3>
                        <a>POST /api/reports/generate/pdf</a><br>
                        <a>POST /api/reports/generate/excel</a><br>
                        <a>GET /api/reports/download/{{type}}/{{filename}}</a>
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>React Frontend:</strong> <a href="http://localhost:3000" target="_blank">http://localhost:3000</a></p>
                    <p><strong>API Documentation:</strong> <a href="/docs" target="_blank">Swagger UI</a></p>
                    <div class="timestamp">Последнее обновление: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content

@app.get("/api")
async def api_info():
    """JSON информация об API для программного доступа"""
    return {
        "service": "DevAssist Pro - КП Анализатор",
        "version": "1.0.0",
        "status": "running",
        "description": "AI-powered веб-портал для анализа коммерческих предложений",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "auth": "/api/auth/*",
            "documents": "/api/documents/*",
            "analytics": "/api/analytics/*",
            "reports": "/api/reports/*",
            "kp_analyzer": "/api/kp-analyzer/*",
            "admin": "/api/admin/*"
        },
        "frontend_url": "http://localhost:3000",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Проверка здоровья сервиса"""
    return HealthResponse(
        status="healthy",
        service="devassist-pro-monolith",
        timestamp=datetime.now().isoformat()
    )

# ========================================
# AUTHENTICATION API
# ========================================

@app.post("/api/auth/register", response_model=AuthResponse)
async def register_user(user_data: UserRegisterRequest):
    """Регистрация нового пользователя"""
    try:
        response = await auth_manager.register_user(user_data)
        logger.info(f"Регистрация пользователя {user_data.email}: {'успешно' if response.success else 'неудача'}")
        return response
    except Exception as e:
        logger.error(f"Ошибка регистрации пользователя: {e}")
        return AuthResponse(
            success=False,
            error=f"Внутренняя ошибка сервера: {str(e)}"
        )

@app.post("/api/auth/login", response_model=AuthResponse)
async def login_user(login_data: UserLoginRequest):
    """Вход пользователя в систему"""
    try:
        response = await auth_manager.login_user(login_data)
        logger.info(f"Вход пользователя {login_data.email}: {'успешно' if response.success else 'неудача'}")
        return response
    except Exception as e:
        logger.error(f"Ошибка входа пользователя: {e}")
        return AuthResponse(
            success=False,
            error=f"Внутренняя ошибка сервера: {str(e)}"
        )

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    """Получение информации о текущем пользователе"""
    try:
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Токен авторизации не предоставлен")
        
        token = authorization.replace("Bearer ", "")
        user = await auth_manager.get_user_by_token(token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Недействительный токен")
        
        return {"success": True, "user": user}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения пользователя: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
async def logout_user(request: Request):
    """Выход пользователя из системы"""
    try:
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            # Удаление токена из сессий
            if token in auth_manager.sessions:
                del auth_manager.sessions[token]
                logger.info("Пользователь вышел из системы")
        
        return {"success": True, "message": "Успешный выход из системы"}
    except Exception as e:
        logger.error(f"Ошибка выхода: {e}")
        return {"success": False, "error": str(e)}

# ========================================
# DOCUMENTS API
# ========================================

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Загрузка документа"""
    try:
        result = await documents_manager.upload_file(file)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Ошибка загрузки файла: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/{document_id}/analyze")
async def analyze_document(document_id: int):
    """Анализ документа"""
    try:
        result = await documents_manager.analyze_document(document_id)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Ошибка анализа документа: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# ANALYTICS API
# ========================================

@app.post("/api/analytics/process", response_model=AnalyticsResponse)
async def process_analytics(request: AnalyticsRequest):
    """Обработка аналитических данных"""
    try:
        results = await analytics_manager.process_analytics(
            request.data_type, 
            request.aggregation_type
        )
        
        return AnalyticsResponse(
            data_type=request.data_type,
            results=results,
            metadata={
                "period": request.period,
                "processed_at": datetime.now().isoformat(),
                "aggregation_type": request.aggregation_type
            }
        )
    except Exception as e:
        logger.error(f"Ошибка обработки аналитики: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/dashboard")
async def get_dashboard_stats(period: str = Query("30d")):
    """Статистика для дашборда"""
    try:
        stats = await analytics_manager.generate_dashboard_stats(period)
        return {"success": True, "data": stats}
    except Exception as e:
        logger.error(f"Ошибка получения статистики: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/metrics")
async def calculate_metrics(
    metric_types: List[str],
    period: str = Query("30d")
):
    """Расчет метрик"""
    try:
        metrics = await analytics_manager.calculate_metrics(metric_types, period)
        return {"success": True, "data": metrics}
    except Exception as e:
        logger.error(f"Ошибка расчета метрик: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# REPORTS API
# ========================================

@app.post("/api/reports/generate/pdf", response_model=ReportGenerationResponse)
async def generate_pdf_report(request: ReportGenerationRequest):
    """Генерация PDF отчета"""
    try:
        filename = await reports_manager.generate_pdf_report(
            request.analysis_id, 
            request.template_name
        )
        
        return ReportGenerationResponse(
            report_id=f"pdf_{request.analysis_id}_{int(datetime.now().timestamp())}",
            analysis_id=request.analysis_id,
            format="pdf",
            status="completed",
            download_url=f"/api/reports/download/pdf/{filename}",
            generated_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Ошибка генерации PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reports/generate/excel", response_model=ReportGenerationResponse)
async def generate_excel_report(request: ReportGenerationRequest):
    """Генерация Excel отчета"""
    try:
        filename = await reports_manager.generate_excel_report(request.analysis_id)
        
        return ReportGenerationResponse(
            report_id=f"excel_{request.analysis_id}_{int(datetime.now().timestamp())}",
            analysis_id=request.analysis_id,
            format="excel",
            status="completed",
            download_url=f"/api/reports/download/excel/{filename}",
            generated_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Ошибка генерации Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports/download/pdf/{filename}")
async def download_pdf_report(filename: str):
    """Скачивание PDF отчета"""
    filepath = reports_manager.reports_dir / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/pdf"
    )

@app.get("/api/reports/download/excel/{filename}")
async def download_excel_report(filename: str):
    """Скачивание Excel отчета"""
    filepath = reports_manager.reports_dir / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# ========================================
# КП АНАЛИЗАТОР API (ОСНОВНОЙ ФУНКЦИОНАЛ)
# ========================================

@app.post("/api/kp-analyzer/full-analysis")
async def full_kp_analysis(file: UploadFile = File(...)):
    """Полный анализ КП: загрузка → анализ → отчет"""
    try:
        # 1. Загрузка документа
        upload_result = await documents_manager.upload_file(file)
        document_id = upload_result["document_id"]
        
        # 2. Анализ документа
        analysis_result = await documents_manager.analyze_document(document_id)
        analysis_id = analysis_result["analysis_id"]
        
        # 3. Генерация отчета
        pdf_filename = await reports_manager.generate_pdf_report(analysis_id)
        excel_filename = await reports_manager.generate_excel_report(analysis_id)
        
        return {
            "success": True,
            "data": {
                "document": upload_result,
                "analysis": analysis_result,
                "reports": {
                    "pdf": {
                        "filename": pdf_filename,
                        "download_url": f"/api/reports/download/pdf/{pdf_filename}"
                    },
                    "excel": {
                        "filename": excel_filename,
                        "download_url": f"/api/reports/download/excel/{excel_filename}"
                    }
                }
            }
        }
    except Exception as e:
        logger.error(f"Ошибка полного анализа КП: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# АДМИНИСТРАТИВНЫЕ ENDPOINTS
# ========================================

@app.get("/api/admin/status")
async def get_system_status():
    """Статус системы"""
    return {
        "status": "operational",
        "version": "1.0.0",
        "services": {
            "documents": "healthy",
            "analytics": "healthy", 
            "reports": "healthy"
        },
        "uptime": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/admin/stats")
async def get_system_stats():
    """Системная статистика"""
    try:
        stats = await analytics_manager.generate_dashboard_stats()
        return {"success": True, "data": stats}
    except Exception as e:
        logger.error(f"Ошибка получения статистики: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# ЗАПУСК ПРИЛОЖЕНИЯ
# ========================================

if __name__ == "__main__":
    # Создание необходимых директорий
    os.makedirs("data/reports", exist_ok=True)
    os.makedirs("data/uploads", exist_ok=True)
    
    print("🚀 Запуск DevAssist Pro - Монолитное приложение")
    print("=" * 50)
    print("📊 Доступные API:")
    print("   • Health Check:     http://localhost:8000/health")
    print("   • API Docs:         http://localhost:8000/docs")
    print("   • Documents API:    http://localhost:8000/api/documents/")
    print("   • Analytics API:    http://localhost:8000/api/analytics/")
    print("   • Reports API:      http://localhost:8000/api/reports/")
    print("   • КП Analyzer:      http://localhost:8000/api/kp-analyzer/")
    print("   • Admin Panel:      http://localhost:8000/api/admin/")
    print("=" * 50)
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )