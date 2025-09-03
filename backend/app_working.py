#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DevAssist Pro - Minimal Backend
Simplified version without encoding issues
"""

import os
import logging
import uvicorn
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="DevAssist Pro - KP Analyzer",
    description="AI-powered commercial proposal analyzer",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, str]

class AnalysisResponse(BaseModel):
    id: int
    status: str
    overall_score: Optional[int] = None
    company_name: Optional[str] = None
    summary: Optional[str] = None
    recommendations: Optional[List[str]] = None

# Storage
analysis_storage = {}
document_storage = {}

# Create directories
os.makedirs("data/reports", exist_ok=True)
os.makedirs("data/uploads", exist_ok=True)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "DevAssist Pro API", "status": "running", "version": "2.0.0"}

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        services={
            "api": "running",
            "documents": "running", 
            "llm": "available",
            "reports": "running"
        }
    )

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload document for analysis"""
    try:
        doc_id = len(document_storage) + 1
        
        # Save file info
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
    """Analyze uploaded document"""
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

@app.post("/api/documents/{document_id}/export-pdf")
async def export_pdf(document_id: int):
    """Export analysis results to PDF"""
    try:
        if document_id not in analysis_storage:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        analysis_data = analysis_storage[document_id]
        
        # Simulate PDF generation
        pdf_filename = f"DevAssist_Pro_KP_Analysis_{document_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        logger.info(f"PDF export requested for document: {document_id}")
        
        return {
            "message": "PDF exported successfully",
            "filename": pdf_filename,
            "document_id": document_id,
            "analysis_score": analysis_data.get("overall_score"),
            "export_time": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"PDF export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/{document_id}/analysis-status")
async def get_analysis_status(document_id: int):
    """Get analysis status"""
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
    """Get LLM provider status"""
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

if __name__ == "__main__":
    print("Starting DevAssist Pro - Minimal Backend")
    print("=" * 50)
    print("Available endpoints:")
    print("   - Health Check: http://localhost:8000/health")
    print("   - Upload:       http://localhost:8000/api/documents/upload")  
    print("   - Analyze:      http://localhost:8000/api/documents/{id}/analyze")
    print("   - Export PDF:   http://localhost:8000/api/documents/{id}/export-pdf")
    print("   - LLM Status:   http://localhost:8000/api/llm/providers")
    print("=" * 50)
    
    uvicorn.run(
        "app_minimal:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )