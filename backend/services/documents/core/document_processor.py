"""
Document Processor для Documents Service
Основная логика обработки документов
"""
import os
import logging
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Процессор для управления документами"""
    
    def __init__(self):
        self.upload_dir = Path("data/uploads")
        self.processed_dir = Path("data/processed")
        self.metadata_file = Path("data/documents_metadata.json")
        
        # Создание директорий
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        # Загрузка метаданных
        self.metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Загрузка метаданных документов"""
        try:
            if self.metadata_file.exists():
                with open(self.metadata_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.warning(f"Failed to load metadata: {e}")
            return {}
    
    def _save_metadata(self):
        """Сохранение метаданных документов"""
        try:
            with open(self.metadata_file, "w", encoding="utf-8") as f:
                json.dump(self.metadata, f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save metadata: {e}")
    
    async def list_documents(
        self,
        user_id: Optional[int] = None,
        document_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Получение списка документов с фильтрацией"""
        
        documents = []
        
        for doc_id, doc_meta in self.metadata.items():
            # Применение фильтров
            if user_id is not None and doc_meta.get("user_id") != user_id:
                continue
            
            if document_type is not None and doc_meta.get("document_type") != document_type:
                continue
                
            if status is not None and doc_meta.get("status") != status:
                continue
            
            documents.append({
                "document_id": doc_id,
                **doc_meta
            })
        
        # Сортировка по дате загрузки (новые первые)
        documents.sort(
            key=lambda x: x.get("uploaded_at", ""), 
            reverse=True
        )
        
        # Пагинация
        return documents[offset:offset + limit]
    
    def save_document_metadata(self, document_id: str, metadata: Dict[str, Any]):
        """Сохранение метаданных документа"""
        self.metadata[document_id] = metadata
        self._save_metadata()
    
    def get_document_metadata(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Получение метаданных документа"""
        return self.metadata.get(document_id)
    
    def update_document_status(self, document_id: str, status: str, additional_data: Dict[str, Any] = None):
        """Обновление статуса документа"""
        if document_id in self.metadata:
            self.metadata[document_id]["status"] = status
            self.metadata[document_id]["updated_at"] = datetime.now().isoformat()
            
            if additional_data:
                self.metadata[document_id].update(additional_data)
            
            self._save_metadata()
    
    def delete_document(self, document_id: str) -> bool:
        """Удаление документа и его метаданных"""
        try:
            # Удаление файлов
            upload_files = list(self.upload_dir.glob(f"{document_id}.*"))
            processed_files = list(self.processed_dir.glob(f"{document_id}.*"))
            
            for file_path in upload_files + processed_files:
                if file_path.exists():
                    file_path.unlink()
            
            # Удаление метаданных
            if document_id in self.metadata:
                del self.metadata[document_id]
                self._save_metadata()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")
            return False
    
    def get_document_stats(self) -> Dict[str, Any]:
        """Получение статистики документов"""
        total_documents = len(self.metadata)
        
        stats = {
            "total_documents": total_documents,
            "by_status": {},
            "by_type": {},
            "by_format": {},
            "total_size": 0
        }
        
        for doc_meta in self.metadata.values():
            # Статистика по статусам
            status = doc_meta.get("status", "unknown")
            stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
            
            # Статистика по типам
            doc_type = doc_meta.get("document_type", "unknown")
            stats["by_type"][doc_type] = stats["by_type"].get(doc_type, 0) + 1
            
            # Статистика по форматам
            file_type = doc_meta.get("file_type", "unknown")
            stats["by_format"][file_type] = stats["by_format"].get(file_type, 0) + 1
            
            # Общий размер
            file_size = doc_meta.get("file_size", 0)
            if isinstance(file_size, (int, float)):
                stats["total_size"] += file_size
        
        return stats
    
    def cleanup_orphaned_files(self) -> Dict[str, Any]:
        """Очистка файлов без метаданных"""
        orphaned_files = []
        
        # Проверка файлов в upload_dir
        for file_path in self.upload_dir.iterdir():
            if file_path.is_file():
                # Извлечение document_id из имени файла
                doc_id = file_path.stem.split("_")[0] if "_" in file_path.stem else file_path.stem
                
                if doc_id not in self.metadata:
                    orphaned_files.append(str(file_path))
                    file_path.unlink()
        
        # Проверка файлов в processed_dir
        for file_path in self.processed_dir.iterdir():
            if file_path.is_file():
                doc_id = file_path.stem
                
                if doc_id not in self.metadata:
                    orphaned_files.append(str(file_path))
                    file_path.unlink()
        
        return {
            "orphaned_files_removed": len(orphaned_files),
            "files": orphaned_files
        }
    
    def validate_document_integrity(self, document_id: str) -> Dict[str, Any]:
        """Проверка целостности документа"""
        metadata = self.get_document_metadata(document_id)
        
        if not metadata:
            return {
                "valid": False,
                "error": "Document metadata not found"
            }
        
        issues = []
        
        # Проверка наличия исходного файла
        upload_path = metadata.get("upload_path")
        if upload_path and not Path(upload_path).exists():
            issues.append("Original file missing")
        
        # Проверка наличия обработанного файла
        if metadata.get("text_extracted"):
            text_path = metadata.get("text_path")
            if text_path and not Path(text_path).exists():
                issues.append("Processed text file missing")
        
        # Проверка размера файла
        if upload_path and Path(upload_path).exists():
            actual_size = Path(upload_path).stat().st_size
            expected_size = metadata.get("file_size", 0)
            
            if actual_size != expected_size:
                issues.append(f"File size mismatch: expected {expected_size}, actual {actual_size}")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "document_id": document_id,
            "metadata": metadata
        }