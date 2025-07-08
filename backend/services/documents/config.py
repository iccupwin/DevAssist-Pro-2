"""
Configuration для Documents Service
"""
import os
from typing import List
from pydantic import BaseSettings, Field


class DocumentsSettings(BaseSettings):
    """Настройки Documents Service"""
    
    # Service Configuration
    SERVICE_NAME: str = "documents"
    SERVICE_VERSION: str = "1.0.0"
    HOST: str = Field(default="0.0.0.0", env="DOCUMENTS_HOST")
    PORT: int = Field(default=8003, env="DOCUMENTS_PORT")
    RELOAD: bool = Field(default=False, env="DOCUMENTS_RELOAD")
    
    # File Processing
    MAX_FILE_SIZE: int = Field(default=50 * 1024 * 1024, env="MAX_FILE_SIZE")  # 50MB
    SUPPORTED_FORMATS: List[str] = Field(
        default=[".pdf", ".docx", ".txt"], 
        env="SUPPORTED_FORMATS"
    )
    
    # Storage Paths
    UPLOAD_DIR: str = Field(default="data/uploads", env="UPLOAD_DIR")
    PROCESSED_DIR: str = Field(default="data/processed", env="PROCESSED_DIR")
    METADATA_FILE: str = Field(default="data/documents_metadata.json", env="METADATA_FILE")
    
    # External Services
    LLM_SERVICE_URL: str = Field(default="http://localhost:8002", env="LLM_SERVICE_URL")
    
    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379/3", env="REDIS_URL")
    
    # OCR Configuration
    TESSERACT_PATH: str = Field(default="/usr/bin/tesseract", env="TESSERACT_PATH")
    ENABLE_OCR: bool = Field(default=True, env="ENABLE_OCR")
    
    # Text Extraction
    DEFAULT_ENCODING: str = Field(default="utf-8", env="DEFAULT_ENCODING")
    FALLBACK_ENCODINGS: List[str] = Field(
        default=["cp1251", "latin-1", "cp866"], 
        env="FALLBACK_ENCODINGS"
    )
    
    # Processing Options
    BACKGROUND_PROCESSING: bool = Field(default=True, env="BACKGROUND_PROCESSING")
    CLEANUP_TEMP_FILES: bool = Field(default=True, env="CLEANUP_TEMP_FILES")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    ENABLE_STRUCTURED_LOGGING: bool = Field(default=True, env="ENABLE_STRUCTURED_LOGGING")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Глобальный экземпляр настроек
settings = DocumentsSettings()


# Document Type Mapping
DOCUMENT_TYPES = {
    "tz": "Техническое задание",
    "kp": "Коммерческое предложение", 
    "contract": "Договор",
    "report": "Отчет",
    "specification": "Спецификация",
    "general": "Общий документ"
}

# MIME Type Mapping
MIME_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain"
}

# Processing Priorities
PROCESSING_PRIORITY = {
    "tz": 1,  # Высший приоритет
    "kp": 2,
    "contract": 3,
    "report": 4,
    "specification": 5,
    "general": 6  # Низший приоритет
}