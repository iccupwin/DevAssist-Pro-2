"""
Documents Service для DevAssist Pro
Микросервис для обработки документов согласно ТЗ Этап 3
"""
import os
import logging
import time
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import aiofiles
import hashlib

from .core.document_processor import DocumentProcessor
from .core.text_extractor import TextExtractor  
from .core.document_analyzer import DocumentAnalyzer
from ..shared.models import DocumentMetadata, DocumentAnalysis
from ..shared.schemas import (
    DocumentUploadResponse, DocumentListResponse, DocumentContentResponse,
    DocumentAnalysisRequest, DocumentAnalysisResponse, HealthResponse
)

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Глобальные экземпляры сервисов
document_processor: Optional[DocumentProcessor] = None
text_extractor: Optional[TextExtractor] = None
document_analyzer: Optional[DocumentAnalyzer] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events для FastAPI приложения"""
    global document_processor, text_extractor, document_analyzer
    
    logger.info("Starting Documents Service...")
    
    # Инициализация сервисов
    document_processor = DocumentProcessor()
    text_extractor = TextExtractor()
    document_analyzer = DocumentAnalyzer()
    
    # Создание необходимых директорий
    os.makedirs("data/uploads", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)
    
    logger.info("Documents Service started successfully")
    
    yield
    
    logger.info("Shutting down Documents Service...")

# Создание FastAPI приложения
app = FastAPI(
    title="DevAssist Pro Documents Service",
    description="Микросервис обработки документов для веб-портала DevAssist Pro",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене ограничить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Корневой endpoint Documents Service"""
    return {
        "service": "DevAssist Pro Documents Service",
        "version": "1.0.0",
        "status": "running",
        "supported_formats": ["pdf", "docx", "txt"],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    if not document_processor:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    return HealthResponse(
        status="healthy",
        service="documents",
        version="1.0.0",
        uptime=time.time(),
        timestamp=datetime.now()
    )

@app.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = "general",
    user_id: Optional[int] = None,
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Загрузка документа согласно ТЗ"""
    if not document_processor:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        # Валидация типа файла
        allowed_extensions = [".pdf", ".docx", ".txt"]
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file_extension}. Supported: {allowed_extensions}"
            )
        
        # Генерация уникального ID документа
        content = await file.read()
        file_hash = hashlib.sha256(content).hexdigest()[:16]
        document_id = f"doc_{int(time.time())}_{file_hash}"
        
        # Сохранение файла
        upload_path = Path(f"data/uploads/{document_id}{file_extension}")
        
        async with aiofiles.open(upload_path, "wb") as f:
            await f.write(content)
        
        # Метаданные документа
        metadata = {
            "document_id": document_id,
            "original_filename": file.filename,
            "file_size": len(content),
            "file_type": file_extension,
            "document_type": document_type,
            "upload_path": str(upload_path),
            "uploaded_at": datetime.now().isoformat(),
            "user_id": user_id,
            "status": "uploaded"
        }
        
        # Фоновая обработка текста
        background_tasks.add_task(
            extract_text_background,
            document_id,
            upload_path,
            metadata
        )
        
        return DocumentUploadResponse(
            document_id=document_id,
            filename=file.filename,
            file_size=len(content),
            file_type=file_extension,
            status="uploaded",
            upload_path=str(upload_path),
            created_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def extract_text_background(document_id: str, file_path: Path, metadata: Dict[str, Any]):
    """Фоновое извлечение текста из документа"""
    try:
        extracted_text = await text_extractor.extract_text_async(file_path)
        
        # Сохранение извлеченного текста
        text_path = Path(f"data/processed/{document_id}.txt")
        async with aiofiles.open(text_path, "w", encoding="utf-8") as f:
            await f.write(extracted_text)
        
        # Обновление метаданных
        metadata.update({
            "text_extracted": True,
            "text_path": str(text_path),
            "text_length": len(extracted_text),
            "processed_at": datetime.now().isoformat(),
            "status": "processed"
        })
        
        logger.info(f"Text extraction completed for document {document_id}")
        
    except Exception as e:
        logger.error(f"Text extraction failed for document {document_id}: {e}")
        metadata.update({
            "text_extracted": False,
            "error": str(e),
            "status": "error"
        })

@app.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    user_id: Optional[int] = None,
    document_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Получение списка загруженных документов"""
    if not document_processor:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        documents = await document_processor.list_documents(
            user_id=user_id,
            document_type=document_type,
            status=status,
            limit=limit,
            offset=offset
        )
        
        return DocumentListResponse(
            documents=documents,
            total=len(documents),
            limit=limit,
            offset=offset
        )
        
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}/content", response_model=DocumentContentResponse)
async def get_document_content(document_id: str):
    """Получение содержимого документа"""
    if not document_processor:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        # Поиск файла с извлеченным текстом
        text_path = Path(f"data/processed/{document_id}.txt")
        
        if not text_path.exists():
            raise HTTPException(status_code=404, detail="Document content not found")
        
        async with aiofiles.open(text_path, "r", encoding="utf-8") as f:
            content = await f.read()
        
        return DocumentContentResponse(
            document_id=document_id,
            content=content,
            content_type="text/plain",
            character_count=len(content),
            extracted_at=datetime.fromtimestamp(text_path.stat().st_mtime)
        )
        
    except Exception as e:
        logger.error(f"Failed to get document content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/{document_id}/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(
    document_id: str,
    analysis_request: DocumentAnalysisRequest
):
    """Анализ документа с помощью AI"""
    if not document_analyzer:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        # Получение содержимого документа
        content_response = await get_document_content(document_id)
        
        # Выполнение анализа
        analysis_result = await document_analyzer.analyze_document(
            content=content_response.content,
            analysis_type=analysis_request.analysis_type,
            custom_prompt=analysis_request.custom_prompt,
            context=analysis_request.context
        )
        
        return DocumentAnalysisResponse(
            document_id=document_id,
            analysis_type=analysis_request.analysis_type,
            analysis_result=analysis_result,
            confidence_score=0.9,  # TODO: Реальная оценка
            processing_time=1.5,   # TODO: Реальное время
            created_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Document analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Удаление документа и связанных файлов"""
    if not document_processor:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        # Удаление файлов
        upload_files = list(Path("data/uploads").glob(f"{document_id}.*"))
        processed_files = list(Path("data/processed").glob(f"{document_id}.*"))
        
        deleted_files = []
        
        for file_path in upload_files + processed_files:
            if file_path.exists():
                file_path.unlink()
                deleted_files.append(str(file_path))
        
        return {
            "document_id": document_id,
            "status": "deleted",
            "deleted_files": deleted_files,
            "deleted_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}/metadata")
async def get_document_metadata(document_id: str):
    """Получение метаданных документа"""
    try:
        # Поиск файлов документа
        upload_files = list(Path("data/uploads").glob(f"{document_id}.*"))
        processed_files = list(Path("data/processed").glob(f"{document_id}.*"))
        
        if not upload_files:
            raise HTTPException(status_code=404, detail="Document not found")
        
        upload_file = upload_files[0]
        processed_file = processed_files[0] if processed_files else None
        
        metadata = {
            "document_id": document_id,
            "original_path": str(upload_file),
            "file_size": upload_file.stat().st_size,
            "file_type": upload_file.suffix,
            "created_at": datetime.fromtimestamp(upload_file.stat().st_ctime),
            "modified_at": datetime.fromtimestamp(upload_file.stat().st_mtime),
            "text_extracted": processed_file is not None,
            "status": "processed" if processed_file else "uploaded"
        }
        
        if processed_file:
            metadata.update({
                "text_path": str(processed_file),
                "text_size": processed_file.stat().st_size,
                "processed_at": datetime.fromtimestamp(processed_file.stat().st_ctime)
            })
        
        return metadata
        
    except Exception as e:
        logger.error(f"Failed to get document metadata: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8003,
        reload=True,
        log_level="info"
    )