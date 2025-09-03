#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DevAssist Pro - Integrated Backend v3
Правильная интеграция КП Анализатора v3 с существующей инфраструктурой
"""

import os
import logging
import uvicorn
from datetime import datetime
from typing import Dict, Any
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Existing infrastructure imports
from shared.database import get_db, create_tables
from shared.models import User
from shared.config import settings
from core.security import get_current_user

# V3 API imports (with safe imports)
try:
    from api.v3.kp_analyzer import router as kp_analyzer_v3_router  
    from api.v3.criteria import router as criteria_router
    v3_available = True
except ImportError as e:
    logger.warning(f"V3 modules not available: {e}")
    v3_available = False

# Import for file handling
from fastapi import UploadFile, File

# Legacy v2 imports (from original app.py)
from services.reports.core.tender_style_pdf_exporter import tender_pdf_exporter

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app with proper configuration
app = FastAPI(
    title="DevAssist Pro - Integrated Backend v3",
    description="AI-powered commercial proposal analyzer with proper database integration",
    version="3.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# CORS middleware with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Health check models
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    services: Dict[str, str]

# ============================================================================
# CORE ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "DevAssist Pro - Integrated Backend v3", 
        "status": "running", 
        "version": "3.0.0",
        "features": [
            "🔐 JWT Authentication & Authorization",
            "🗄️ PostgreSQL Database Integration", 
            "📊 KP Analyzer v2 - Legacy Support",
            "🎯 KP Analyzer v3 - Expert 10-Criteria Analysis",
            "🤖 Multiple AI Providers (Claude, OpenAI, Google)",
            "📄 Advanced Document Processing (PDF, DOCX, TXT)",
            "💰 Multi-currency Detection & Extraction",
            "📈 Interactive Charts Generation",
            "⚖️ Configurable Criteria Weights",
            "📋 Professional PDF Export with Cyrillic Support",
            "🏢 Multi-tenant Organization Support",
            "📱 Real-time Analytics & Monitoring"
        ],
        "endpoints": {
            "health": "/health",
            "auth": "/api/auth/*",
            "v2": "/api/documents/*", 
            "v3": "/api/v3/*",
            "docs": "/docs"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Comprehensive health check with database connectivity"""
    
    services_status = {
        "database": "unknown",
        "ai_providers": "unknown", 
        "file_storage": "unknown",
        "redis": "unknown"
    }
    
    try:
        # Test database connection
        db.execute("SELECT 1")
        services_status["database"] = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        services_status["database"] = "unhealthy"
    
    try:
        # Test AI providers
        has_anthropic = bool(os.getenv('ANTHROPIC_API_KEY'))
        has_openai = bool(os.getenv('OPENAI_API_KEY'))
        if has_anthropic or has_openai:
            services_status["ai_providers"] = "available"
        else:
            services_status["ai_providers"] = "not_configured"
    except Exception:
        services_status["ai_providers"] = "error"
    
    try:
        # Test file storage
        import pathlib
        uploads_dir = pathlib.Path("data/uploads")
        reports_dir = pathlib.Path("data/reports")
        uploads_dir.mkdir(parents=True, exist_ok=True)
        reports_dir.mkdir(parents=True, exist_ok=True)
        services_status["file_storage"] = "available"
    except Exception:
        services_status["file_storage"] = "error"
    
    # Overall status
    overall_status = "healthy" if all(
        status in ["healthy", "available"] 
        for status in services_status.values()
    ) else "degraded"
    
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.utcnow().isoformat(),
        version="3.0.0",
        services=services_status
    )

# ============================================================================
# AUTH ENDPOINTS (Basic implementation)
# ============================================================================

@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "company": current_user.company,
        "position": current_user.position
    }

# ============================================================================
# V3 API INTEGRATION
# ============================================================================

# Include V3 routers with proper authentication (if available)
if v3_available:
    app.include_router(
        kp_analyzer_v3_router,
        dependencies=[Depends(get_current_user)]  # Require authentication for all v3 endpoints
    )

    app.include_router(
        criteria_router,
        dependencies=[Depends(get_current_user)]  # Require authentication for criteria management
    )
    logger.info("✅ V3 routers included successfully")
else:
    logger.warning("❌ V3 routers not available - continuing without v3 endpoints")

# ============================================================================
# LEGACY V2 ENDPOINTS (Maintained for backward compatibility)
# ============================================================================

# Legacy in-memory storage (for v2 compatibility only)
legacy_analysis_storage = {}
legacy_document_storage = {}
legacy_file_content_storage = {}

@app.post("/api/documents/upload")
async def upload_document_legacy(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Legacy v2 document upload (maintained for compatibility)"""
    try:
        doc_id = len(legacy_document_storage) + 1
        
        # Read file content
        file_content = await file.read()
        
        # Basic text extraction (legacy method)
        extracted_text = _extract_text_basic(file_content, file.filename)
        
        # Store in legacy storage
        legacy_document_storage[doc_id] = {
            "id": doc_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "status": "uploaded_legacy",
            "size": len(file_content),
            "created_at": datetime.utcnow().isoformat(),
            "uploaded_by": current_user.id
        }
        
        legacy_file_content_storage[doc_id] = {
            "raw_content": file_content,
            "extracted_text": extracted_text,
            "text_length": len(extracted_text)
        }
        
        logger.info(f"✅ Legacy document uploaded: {file.filename} (ID: {doc_id})")
        
        return {
            "id": doc_id,
            "filename": file.filename,
            "status": "uploaded_legacy",
            "message": "Document uploaded successfully (legacy v2 mode)",
            "text_extracted": len(extracted_text) > 0,
            "text_length": len(extracted_text)
        }
        
    except Exception as e:
        logger.error(f"❌ Legacy upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _extract_text_basic(file_content: bytes, filename: str) -> str:
    """Basic text extraction for legacy mode"""
    try:
        if filename.lower().endswith('.pdf'):
            import PyPDF2
            from io import BytesIO
            pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        elif filename.lower().endswith('.docx'):
            import docx
            from io import BytesIO
            doc = docx.Document(BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        elif filename.lower().endswith('.txt'):
            return file_content.decode('utf-8')
        else:
            return file_content.decode('utf-8', errors='ignore')
    except Exception as e:
        logger.error(f"Text extraction error: {e}")
        return f"Text extraction failed for {filename}"

@app.get("/api/documents/{document_id}/analysis-status")
async def get_legacy_analysis_status(
    document_id: int,
    current_user: User = Depends(get_current_user)
):
    """Legacy analysis status check"""
    if document_id in legacy_analysis_storage:
        return legacy_analysis_storage[document_id]
    elif document_id in legacy_document_storage:
        return {"status": "pending", "message": "Analysis not started"}
    else:
        raise HTTPException(status_code=404, detail="Document not found")

# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.get("/api/system/info")
async def get_system_info():
    """System information endpoint"""
    return {
        "version": "3.0.0",
        "architecture": "integrated_monolith",
        "features": {
            "authentication": True,
            "database": True,
            "ai_providers": True,
            "v2_compatibility": True,
            "v3_expert_analysis": True,
            "multi_tenant": True
        },
        "ai_providers": {
            "anthropic": bool(os.getenv('ANTHROPIC_API_KEY')),
            "openai": bool(os.getenv('OPENAI_API_KEY')),
            "google": bool(os.getenv('GOOGLE_API_KEY'))
        },
        "database_type": "postgresql" if "postgresql" in (os.getenv('POSTGRES_URL') or '') else "sqlite"
    }

@app.get("/api/v3/status")
async def get_v3_status():
    """V3 system status and capabilities"""
    return {
        "status": "active",
        "version": "3.0.0",
        "capabilities": {
            "10_criteria_analysis": True,
            "advanced_document_processing": True,
            "multi_currency_detection": True,
            "table_extraction": True,
            "configurable_weights": True,
            "professional_pdf_export": True,
            "interactive_charts": True,
            "risk_assessment": True,
            "automated_recommendations": True,
            "comparison_analysis": True
        },
        "supported_formats": ["PDF", "DOCX", "TXT"],
        "analysis_criteria": [
            "budget_compliance",
            "timeline_compliance", 
            "technical_compliance",
            "team_expertise",
            "functional_coverage",
            "quality_assurance",
            "development_methodology",
            "scalability",
            "communication",
            "added_value"
        ]
    }

# ============================================================================
# APPLICATION STARTUP
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Application startup initialization"""
    logger.info("🚀 Starting DevAssist Pro v3 Integrated Backend...")
    
    # Create database tables
    try:
        create_tables()
        logger.info("✅ Database tables created/verified")
    except Exception as e:
        logger.error(f"❌ Database initialization error: {e}")
    
    # Create required directories
    import pathlib
    pathlib.Path("data/uploads").mkdir(parents=True, exist_ok=True)
    pathlib.Path("data/reports").mkdir(parents=True, exist_ok=True)
    logger.info("✅ File storage directories initialized")
    
    # Log configuration
    logger.info(f"✅ Configuration loaded:")
    logger.info(f"   - Debug mode: {settings.debug}")
    logger.info(f"   - AI Providers: {', '.join(p for p in ['Anthropic', 'OpenAI', 'Google'] if os.getenv(f'{p.upper()}_API_KEY'))}")
    logger.info(f"   - Database: {'PostgreSQL' if 'postgresql' in (os.getenv('POSTGRES_URL') or '') else 'SQLite'}")

@app.on_event("shutdown") 
async def shutdown_event():
    """Application shutdown cleanup"""
    logger.info("🛑 Shutting down DevAssist Pro v3...")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("🚀 DevAssist Pro v3 - Integrated Backend")
    print("=" * 80)
    print("✨ Features:")
    print("   🔐 JWT Authentication & Multi-tenant Support")
    print("   🗄️ PostgreSQL Database with SQLAlchemy ORM")
    print("   🎯 KP Analyzer v3 - 10-Criteria Expert Analysis")
    print("   📊 KP Analyzer v2 - Legacy Compatibility")
    print("   🤖 Multiple AI Providers (Claude, OpenAI, Google)")
    print("   📄 Advanced Document Processing & Extraction")
    print("   💰 Multi-currency Detection & Financial Analysis")
    print("   📈 Interactive Charts & Data Visualization")
    print("   ⚖️ Configurable Criteria Weights & Presets")
    print("   📋 Professional PDF Export with Cyrillic Support")
    print("   🏢 Organization Management & RBAC")
    print("   📱 Real-time Analytics & Monitoring")
    print("-" * 80)
    print("🌐 API Endpoints:")
    print("   📊 Health Check:      http://localhost:8000/health")
    print("   🔐 Authentication:    http://localhost:8000/api/auth/*")
    print("   📄 V2 Documents:      http://localhost:8000/api/documents/*")
    print("   🎯 V3 KP Analyzer:    http://localhost:8000/api/v3/kp-analyzer/*")
    print("   ⚖️ V3 Criteria:       http://localhost:8000/api/v3/criteria/*")
    print("   📚 API Docs:          http://localhost:8000/docs")
    print("=" * 80)
    
    uvicorn.run(
        "app_integrated:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )