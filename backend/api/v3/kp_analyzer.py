"""
КП Анализатор v3 - API endpoints
Экспертная система с 10-критериальным анализом
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from shared.database import get_db
from core.security import get_current_user
from shared.models import User, V3Analysis, V3AnalysisDocument, Document
from services.kp_analyzer_v3 import V3AnalyzerService
from .schemas import (
    V3AnalysisRequest, V3AnalysisResponse, CriteriaWeight,
    WeightConfigRequest, V3AnalysisHistoryResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v3/kp-analyzer", tags=["KP Analyzer v3"])

@router.post("/upload")
async def upload_document_v3(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузка документа с расширенной обработкой для v3"""
    try:
        analyzer_service = V3AnalyzerService(db)
        
        # Загрузка и обработка документа
        document = await analyzer_service.upload_and_process_document(
            file, current_user
        )
        
        return {
            "id": document.id,
            "filename": document.filename,
            "status": "uploaded_v3",
            "message": "Document uploaded successfully with advanced extraction",
            "extraction_summary": {
                "text_length": len(document.extracted_text or ""),
                "metadata": document.document_metadata or {}
            }
        }
        
    except Exception as e:
        logger.error(f"V3 upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/analyze", response_model=V3AnalysisResponse)
async def analyze_v3(
    request: V3AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Экспертный анализ КП по 10 критериям"""
    try:
        analyzer_service = V3AnalyzerService(db)
        
        # Проведение анализа
        analysis = await analyzer_service.perform_expert_analysis(
            request, current_user
        )
        
        return V3AnalysisResponse.from_orm(analysis)
        
    except Exception as e:
        logger.error(f"V3 analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/analysis/{analysis_id}", response_model=V3AnalysisResponse)
async def get_v3_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить результаты v3 анализа"""
    analysis = db.query(V3Analysis).filter(
        V3Analysis.id == analysis_id,
        V3Analysis.created_by_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return V3AnalysisResponse.from_orm(analysis)

@router.get("/history", response_model=V3AnalysisHistoryResponse)
async def get_analysis_history(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """История v3 анализов пользователя"""
    query = db.query(V3Analysis).filter(
        V3Analysis.created_by_id == current_user.id
    ).order_by(V3Analysis.created_at.desc())
    
    total = query.count()
    analyses = query.offset(skip).limit(limit).all()
    
    return V3AnalysisHistoryResponse(
        analyses=[V3AnalysisResponse.from_orm(a) for a in analyses],
        total=total,
        skip=skip,
        limit=limit
    )

@router.post("/export/pdf/{analysis_id}")
async def export_v3_pdf(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Экспорт v3 анализа в PDF с professional styling"""
    try:
        analyzer_service = V3AnalyzerService(db)
        
        # Генерация PDF
        pdf_response = await analyzer_service.generate_professional_pdf(
            analysis_id, current_user
        )
        
        return pdf_response
        
    except Exception as e:
        logger.error(f"V3 PDF export error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF export failed: {str(e)}")