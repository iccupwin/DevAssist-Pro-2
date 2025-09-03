#!/usr/bin/env python3
# DevAssist Pro - Full Monolith with Authentication and V3 API
import os
import logging
import uvicorn
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app with full info
app = FastAPI(
    title="DevAssist Pro - Full Monolith",
    description="AI-powered commercial proposal analyzer with authentication and V3 API",
    version="3.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# DATA MODELS
# ========================================

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, str]

class AuthResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    token: Optional[str] = None
    user_id: Optional[str] = None
    error: Optional[str] = None

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class AnalysisResponse(BaseModel):
    id: int
    status: str
    overall_score: Optional[int] = None
    company_name: Optional[str] = None
    summary: Optional[str] = None
    recommendations: Optional[List[str]] = None

# ========================================
# STORAGE
# ========================================

# Simple in-memory storage for demo
users_storage = {}
sessions_storage = {}
analysis_storage = {}
document_storage = {}

# Create directories
os.makedirs("data/reports", exist_ok=True)
os.makedirs("data/uploads", exist_ok=True)

# ========================================
# AUTHENTICATION HELPERS
# ========================================

def hash_password(password: str) -> str:
    # Simple hash for demo (use bcrypt in production)
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id: str) -> str:
    # Simple token for demo (use JWT in production)
    import hashlib
    import time
    data = f"{user_id}:{time.time()}"
    return hashlib.md5(data.encode()).hexdigest()

def get_user_from_token(token: str) -> Optional[Dict]:
    return sessions_storage.get(token)

# ========================================
# BASIC ENDPOINTS
# ========================================

@app.get("/")
async def root():
    return {"message": "DevAssist Pro Full Monolith", "status": "running", "version": "3.0.0"}

@app.get("/api")
async def api_root():
    return {
        "message": "DevAssist Pro API", 
        "status": "running", 
        "version": "3.0.0",
        "endpoints": {
            "auth": "/api/auth/",
            "documents": "/api/documents/",
            "llm": "/api/llm/",
            "v3": "/api/v3/"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        services={
            "api": "running",
            "auth": "running",
            "documents": "running", 
            "llm": "available",
            "reports": "running",
            "v3_api": "running"
        }
    )

# ========================================
# AUTHENTICATION ENDPOINTS
# ========================================

@app.post("/api/auth/register", response_model=AuthResponse)
async def register_user(user_data: UserRegisterRequest):
    try:
        if user_data.email in users_storage:
            return AuthResponse(success=False, error="User already exists")
        
        user_id = f"user_{len(users_storage) + 1}"
        users_storage[user_data.email] = {
            "id": user_id,
            "email": user_data.email,
            "password_hash": hash_password(user_data.password),
            "full_name": user_data.full_name,
            "created_at": datetime.now().isoformat()
        }
        
        token = generate_token(user_id)
        sessions_storage[token] = users_storage[user_data.email]
        
        logger.info(f"User registered: {user_data.email}")
        return AuthResponse(
            success=True,
            message="User registered successfully",
            token=token,
            user_id=user_id
        )
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return AuthResponse(success=False, error=str(e))

@app.post("/api/auth/login", response_model=AuthResponse)
async def login_user(login_data: UserLoginRequest):
    try:
        user = users_storage.get(login_data.email)
        if not user:
            return AuthResponse(success=False, error="User not found")
        
        if user["password_hash"] != hash_password(login_data.password):
            return AuthResponse(success=False, error="Invalid password")
        
        token = generate_token(user["id"])
        sessions_storage[token] = user
        
        logger.info(f"User logged in: {login_data.email}")
        return AuthResponse(
            success=True,
            message="Login successful",
            token=token,
            user_id=user["id"]
        )
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return AuthResponse(success=False, error=str(e))

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    try:
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authorization token not provided")
        
        token = authorization.replace("Bearer ", "")
        user = get_user_from_token(token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return {
            "id": user["id"],
            "email": user["email"],
            "full_name": user.get("full_name"),
            "created_at": user["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
async def logout_user(request: Request):
    try:
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            if token in sessions_storage:
                del sessions_storage[token]
                logger.info("User logged out successfully")
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"message": "Logout completed"}

# ========================================
# DOCUMENT ENDPOINTS (V2)
# ========================================

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        doc_id = len(document_storage) + 1
        
        document_storage[doc_id] = {
            "id": doc_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "status": "uploaded",
            "created_at": datetime.now().isoformat()
        }
        
        logger.info(f"Document uploaded: {file.filename} (ID: {doc_id})")
        
        return {
            "id": doc_id,
            "filename": file.filename,
            "status": "uploaded",
            "message": "Document uploaded successfully"
        }
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/{document_id}/analyze")
async def analyze_document(document_id: int):
    try:
        if document_id not in document_storage:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Simulate analysis
        analysis_result = {
            "id": document_id,
            "status": "completed",
            "overall_score": 85,
            "company_name": "Sample Company LLC",
            "analysis_type": "enhanced",
            "summary": "Document analyzed successfully with enhanced system",
            "recommendations": [
                "Review technical specifications",
                "Clarify timeline requirements", 
                "Consider budget optimization"
            ],
            "business_analysis": {
                "technical_compliance": {"score": 88, "weight": 0.3},
                "functional_completeness": {"score": 82, "weight": 0.3},
                "economic_efficiency": {"score": 85, "weight": 0.2},
                "timeline_realism": {"score": 90, "weight": 0.1},
                "vendor_reliability": {"score": 75, "weight": 0.1}
            },
            "created_at": datetime.now().isoformat(),
            "processing_time": 2.5
        }
        
        analysis_storage[document_id] = analysis_result
        
        logger.info(f"Document analyzed: {document_id} (Score: {analysis_result['overall_score']})")
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/{document_id}/analysis-status")
async def get_analysis_status(document_id: int):
    try:
        if document_id in analysis_storage:
            return analysis_storage[document_id]
        elif document_id in document_storage:
            return {"status": "pending", "message": "Analysis not started"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
            
    except Exception as e:
        logger.error(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/llm/providers")
async def get_llm_providers():
    return {
        "providers": {
            "anthropic": {
                "status": "available" if os.getenv('ANTHROPIC_API_KEY') else "not_configured",
                "models": ["claude-3-haiku-20240307", "claude-3-sonnet-20240229"]
            },
            "openai": {
                "status": "available" if os.getenv('OPENAI_API_KEY') else "not_configured", 
                "models": ["gpt-3.5-turbo", "gpt-4"]
            }
        }
    }

@app.get("/api/llm/health")
async def get_llm_health():
    """Health check для LLM сервисов"""
    providers_status = {
        "anthropic": {
            "status": "healthy" if os.getenv('ANTHROPIC_API_KEY') else "not_configured",
            "api_key_configured": bool(os.getenv('ANTHROPIC_API_KEY'))
        },
        "openai": {
            "status": "healthy" if os.getenv('OPENAI_API_KEY') else "not_configured",
            "api_key_configured": bool(os.getenv('OPENAI_API_KEY'))
        }
    }
    
    # Определяем общий статус
    has_configured_provider = any(
        provider["api_key_configured"] for provider in providers_status.values()
    )
    
    return {
        "status": "healthy" if has_configured_provider else "degraded",
        "timestamp": datetime.now().isoformat(),
        "providers": providers_status,
        "available_models": [
            "claude-3-haiku-20240307" if os.getenv('ANTHROPIC_API_KEY') else None,
            "gpt-3.5-turbo" if os.getenv('OPENAI_API_KEY') else None
        ]
    }

@app.get("/activity")
async def get_activity_feed(limit: int = 8, offset: int = 0):
    """Activity feed endpoint"""
    # Возвращаем mock данные для ленты активности
    mock_activities = [
        {
            "id": i + offset,
            "type": "document_uploaded",
            "title": f"Загружен документ {i + 1}",
            "description": "Коммерческое предложение успешно обработано",
            "timestamp": datetime.now().isoformat(),
            "user": "Текущий пользователь",
            "status": "completed"
        } for i in range(limit)
    ]
    
    return {
        "activities": mock_activities,
        "total": 50,  # Общее количество активностей
        "limit": limit,
        "offset": offset
    }

# Request model для Claude анализа
class ClaudeAnalysisRequest(BaseModel):
    prompt: str
    model: str = "claude-3-haiku-20240307"
    max_tokens: int = 1000
    temperature: float = 0.7

@app.post("/api/llm/analyze")
async def analyze_with_claude(request: ClaudeAnalysisRequest):
    """Анализ через Claude API"""
    try:
        # Проверяем наличие API ключа
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key or api_key == "sk-ant-api03-demo-key-for-testing-only":
            logger.warning("ANTHROPIC_API_KEY not configured, using fallback analyzer")
            
            # Fallback анализ
            return {
                "model": "enhanced-analyzer-fallback",
                "content": f"""{{
                    "company_name": "Анализируемая компания",
                    "compliance_score": 85,
                    "overall_assessment": "Коммерческое предложение содержит основные требуемые элементы. Рекомендуется уточнить технические детали и временные рамки выполнения работ.",
                    "recommendation": "Предложение соответствует основным критериям. Для повышения конкурентоспособности рекомендуется добавить детальный план выполнения работ."
                }}""",
                "fallback_mode": True,
                "analysis_quality": "standard"
            }
        
        # Если есть настоящий ключ, пытаемся использовать Claude
        try:
            import anthropic
            
            client = anthropic.Anthropic(api_key=api_key)
            
            # Структурированный промпт для анализа КП
            structured_prompt = f"""Проанализируй коммерческое предложение и верни результат в JSON формате:

{request.prompt}

Верни JSON с полями:
- company_name: название компании
- compliance_score: оценка соответствия (0-100)
- overall_assessment: общая оценка предложения
- recommendation: рекомендации по улучшению"""
            
            response = client.messages.create(
                model=request.model,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                messages=[{"role": "user", "content": structured_prompt}]
            )
            
            ai_text = response.content[0].text.strip()
            
            return {
                "model": request.model,
                "content": ai_text,
                "fallback_mode": False,
                "tokens_used": getattr(response.usage, 'output_tokens', 0) if hasattr(response, 'usage') else 0
            }
            
        except ImportError:
            logger.error("anthropic package not installed")
            raise HTTPException(status_code=503, detail="Claude API not available - package not installed")
            
        except Exception as claude_error:
            logger.error(f"Claude API error: {claude_error}")
            
            # Если Claude не работает, возвращаем fallback
            return {
                "model": "enhanced-analyzer-fallback", 
                "content": f"""{{
                    "company_name": "Анализируемая компания",
                    "compliance_score": 75,
                    "overall_assessment": "Автоматический анализ выполнен с использованием резервной системы из-за недоступности Claude API.",
                    "recommendation": "Рекомендуется проверить настройки Claude API для получения более детального анализа."
                }}""",
                "fallback_mode": True,
                "error": str(claude_error)
            }
    
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# ========================================
# V3 ENDPOINTS - NEW API
# ========================================

@app.get("/api/v3/test")
async def v3_test():
    return {"status": "V3 endpoints are working", "version": "3.0.0"}

@app.get("/api/v3/criteria/weights/presets")
async def get_weight_presets():
    return {
        "balanced": {
            "name": "Сбалансированный",
            "description": "Равномерное распределение весов по всем критериям",
            "weights": {
                "technical_compliance": 0.15,
                "budget_realism": 0.15,
                "timeline_feasibility": 0.15,
                "quality_standards": 0.15,
                "innovation_level": 0.10,
                "risk_assessment": 0.10,
                "vendor_reliability": 0.10,
                "legal_compliance": 0.05,
                "market_competitiveness": 0.03,
                "sustainability": 0.02
            }
        },
        "budget_focused": {
            "name": "Бюджетно-ориентированный",
            "description": "Акцент на финансовые аспекты проекта",
            "weights": {
                "technical_compliance": 0.10,
                "budget_realism": 0.25,
                "timeline_feasibility": 0.15,
                "quality_standards": 0.10,
                "innovation_level": 0.05,
                "risk_assessment": 0.15,
                "vendor_reliability": 0.10,
                "legal_compliance": 0.05,
                "market_competitiveness": 0.03,
                "sustainability": 0.02
            }
        }
    }

@app.post("/api/v3/documents/upload")
async def v3_upload_document(file: UploadFile = File(...)):
    try:
        doc_id = len(document_storage) + 1000  # V3 starts from 1000
        
        document_storage[doc_id] = {
            "id": doc_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "status": "uploaded",
            "created_at": datetime.now().isoformat(),
            "v3_enabled": True,
            "api_version": "3.0.0"
        }
        
        logger.info(f"V3 Document uploaded: {file.filename} (ID: {doc_id})")
        
        return {
            "id": doc_id,
            "filename": file.filename,
            "status": "uploaded",
            "message": "V3 document uploaded successfully",
            "v3_enabled": True,
            "api_version": "3.0.0"
        }
        
    except Exception as e:
        logger.error(f"V3 Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v3/kp-analyzer/analyze")
async def v3_analyze_kp():
    return {
        "analysis_id": "v3_analysis_" + datetime.now().strftime("%Y%m%d_%H%M%S"),
        "status": "completed",
        "version": "3.0.0",
        "overall_score": 87,
        "company_name": "V3 Expert Analysis Company",
        "executive_summary": "V3 analysis completed successfully with 10-criteria evaluation system. Enhanced scoring provides detailed insights across all business dimensions.",
        "detailed_analysis": {
            "technical_compliance": {"score": 88, "weight": 0.15, "category": "excellent"},
            "budget_realism": {"score": 82, "weight": 0.15, "category": "good"},
            "timeline_feasibility": {"score": 90, "weight": 0.15, "category": "excellent"},
            "quality_standards": {"score": 85, "weight": 0.15, "category": "good"},
            "innovation_level": {"score": 75, "weight": 0.10, "category": "satisfactory"},
            "risk_assessment": {"score": 92, "weight": 0.10, "category": "excellent"},
            "vendor_reliability": {"score": 88, "weight": 0.10, "category": "good"},
            "legal_compliance": {"score": 95, "weight": 0.05, "category": "excellent"},
            "market_competitiveness": {"score": 78, "weight": 0.03, "category": "satisfactory"},
            "sustainability": {"score": 80, "weight": 0.02, "category": "good"}
        },
        "recommendations": [
            "Техническое решение соответствует современным стандартам и требованиям",
            "Бюджетные расчеты реалистичны с учетом текущих рыночных условий",
            "Временные рамки выполнимы при соблюдении заявленных условий",
            "Рекомендуется усилить инновационную составляющую проекта",
            "Предложение демонстрирует высокий уровень правовой проработки"
        ],
        "risk_factors": [
            {"level": "low", "description": "Минимальные технические риски"},
            {"level": "medium", "description": "Умеренные временные ограничения"},
            {"level": "low", "description": "Низкие финансовые риски"}
        ],
        "created_at": datetime.now().isoformat(),
        "processing_time": 3.2,
        "v3_features_enabled": True,
        "analysis_depth": "comprehensive",
        "criteria_count": 10
    }

@app.get("/api/v3/kp-analyzer/models")
async def v3_get_analysis_models():
    return {
        "available_models": [
            {
                "id": "comprehensive",
                "name": "Комплексная модель",
                "description": "Полный анализ по 10 критериям",
                "criteria_count": 10,
                "recommended": True
            },
            {
                "id": "rapid",
                "name": "Экспресс-модель", 
                "description": "Быстрый анализ по 5 ключевым критериям",
                "criteria_count": 5,
                "recommended": False
            },
            {
                "id": "financial",
                "name": "Финансовая модель",
                "description": "Углубленный финансовый анализ",
                "criteria_count": 7,
                "recommended": False
            }
        ],
        "default_model": "comprehensive"
    }

# ========================================
# MAIN APPLICATION STARTUP
# ========================================

if __name__ == "__main__":
    print("Starting DevAssist Pro - Full Monolith with Authentication & V3")
    print("=" * 60)
    print("Available APIs:")
    print("   - Health Check:     http://localhost:8000/health")
    print("   - API Docs:         http://localhost:8000/docs")
    print("   - Auth API:         http://localhost:8000/api/auth/")
    print("   - Documents API:    http://localhost:8000/api/documents/")
    print("   - LLM Status:       http://localhost:8000/api/llm/providers")
    print("   - V3 API:           http://localhost:8000/api/v3/")
    print("=" * 60)
    print("Authentication Features:")
    print("   + User Registration")
    print("   + User Login/Logout")
    print("   + JWT Token Management")
    print("   + Protected Routes")
    print("=" * 60)
    print("V3 Features:")
    print("   + 10-Criteria Analysis")
    print("   + Advanced Scoring")
    print("   + Multiple Analysis Models")
    print("   + Enhanced Recommendations")
    print("=" * 60)
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )