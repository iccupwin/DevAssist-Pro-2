#!/usr/bin/env python3
"""
Validation System - ПОЛЬЗОВАТЕЛЬСКИЕ СЦЕНАРИИ И ВАЛИДАЦИЯ
Система валидации входных данных, файлов и бизнес-правил
"""
import os
import logging
from typing import Dict, Any, List, Optional, Union, Tuple
from pathlib import Path
from datetime import datetime
import mimetypes
import magic

from fastapi import UploadFile, HTTPException
from pydantic import BaseModel, validator, Field

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Кастомное исключение валидации"""
    def __init__(self, field: str, message: str, code: str = "validation_error"):
        self.field = field
        self.message = message
        self.code = code
        super().__init__(f"{field}: {message}")

class FileValidationConfig:
    """Конфигурация валидации файлов"""
    
    # Поддерживаемые типы файлов
    ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt', '.rtf'}
    ALLOWED_MIME_TYPES = {
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword', 
        'text/plain',
        'text/rtf',
        'application/rtf'
    }
    
    # Ограничения размера
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
    MIN_FILE_SIZE = 100  # 100 bytes
    
    # Ограничения содержимого
    MIN_TEXT_LENGTH = 50  # минимум 50 символов текста
    MAX_TEXT_LENGTH = 10 * 1024 * 1024  # максимум 10 MB текста

class DocumentUploadRequest(BaseModel):
    """Модель запроса загрузки документа"""
    document_type: str = Field(..., description="Тип документа (kp, tz)")
    project_id: Optional[int] = Field(None, description="ID проекта")
    description: Optional[str] = Field(None, max_length=500, description="Описание документа")
    
    @validator('document_type')
    def validate_document_type(cls, v):
        allowed_types = {'kp', 'tz', 'contract', 'specification'}
        if v not in allowed_types:
            raise ValueError(f'Тип документа должен быть одним из: {allowed_types}')
        return v

class AnalysisRequest(BaseModel):
    """Модель запроса анализа"""
    document_id: str = Field(..., description="ID документа")
    analysis_type: str = Field(default="standard", description="Тип анализа")
    include_recommendations: bool = Field(default=True, description="Включать рекомендации")
    comparison_mode: bool = Field(default=False, description="Режим сравнения с ТЗ")
    tz_document_id: Optional[str] = Field(None, description="ID ТЗ для сравнения")
    
    @validator('analysis_type')
    def validate_analysis_type(cls, v):
        allowed_types = {'standard', 'detailed', 'quick', 'comparison'}
        if v not in allowed_types:
            raise ValueError(f'Тип анализа должен быть одним из: {allowed_types}')
        return v

class BusinessValidator:
    """Валидатор бизнес-правил"""
    
    @staticmethod
    def validate_cost_data(cost_data: Dict[str, Any]) -> List[ValidationError]:
        """Валидация данных о стоимости"""
        errors = []
        
        total_cost = cost_data.get('total_cost', 0)
        if total_cost <= 0:
            errors.append(ValidationError(
                'total_cost', 
                'Общая стоимость должна быть больше 0', 
                'invalid_cost'
            ))
        
        # Проверка разумности стоимости (не больше 1 млрд руб)
        if total_cost > 1000000000:
            errors.append(ValidationError(
                'total_cost',
                'Стоимость превышает разумные пределы (>1 млрд руб)',
                'cost_too_high'
            ))
        
        # Проверка разбивки стоимости
        cost_breakdown = cost_data.get('cost_breakdown', [])
        if cost_breakdown:
            breakdown_sum = sum(item.get('cost', 0) for item in cost_breakdown)
            if abs(breakdown_sum - total_cost) / total_cost > 0.1:  # разница >10%
                errors.append(ValidationError(
                    'cost_breakdown',
                    'Сумма разбивки не соответствует общей стоимости',
                    'breakdown_mismatch'
                ))
        
        return errors
    
    @staticmethod
    def validate_timeline_data(timeline_data: Dict[str, Any]) -> List[ValidationError]:
        """Валидация данных о сроках"""
        errors = []
        
        timeline = timeline_data.get('timeline_days', 0)
        if timeline <= 0:
            errors.append(ValidationError(
                'timeline_days',
                'Срок выполнения должен быть больше 0 дней',
                'invalid_timeline'
            ))
        
        # Проверка разумности сроков (не больше 10 лет)
        if timeline > 3650:  # 10 лет
            errors.append(ValidationError(
                'timeline_days',
                'Срок выполнения превышает разумные пределы (>10 лет)',
                'timeline_too_long'
            ))
        
        # Проверка соответствия стоимости и сроков
        total_cost = timeline_data.get('total_cost', 0)
        if total_cost > 0 and timeline > 0:
            cost_per_day = total_cost / timeline
            if cost_per_day > 1000000:  # больше 1 млн в день
                errors.append(ValidationError(
                    'cost_per_day',
                    'Слишком высокая стоимость в день (возможная ошибка)',
                    'cost_per_day_too_high'
                ))
        
        return errors
    
    @staticmethod  
    def validate_contractor_data(contractor_data: Dict[str, Any]) -> List[ValidationError]:
        """Валидация данных о подрядчике"""
        errors = []
        
        name = contractor_data.get('name', '').strip()
        if not name or name == 'Не указано':
            errors.append(ValidationError(
                'contractor_name',
                'Название подрядчика не указано',
                'missing_contractor'
            ))
        
        # Проверка наличия контактной информации
        has_contact = any([
            contractor_data.get('phone'),
            contractor_data.get('email'), 
            contractor_data.get('address'),
            contractor_data.get('website')
        ])
        
        if not has_contact:
            errors.append(ValidationError(
                'contractor_contacts',
                'Отсутствует контактная информация подрядчика',
                'missing_contacts'
            ))
        
        return errors

class FileValidator:
    """Валидатор файлов"""
    
    def __init__(self, config: FileValidationConfig = None):
        self.config = config or FileValidationConfig()
        
    async def validate_upload_file(self, file: UploadFile) -> Tuple[bool, List[str]]:
        """
        Полная валидация загружаемого файла
        Возвращает (is_valid, list_of_errors)
        """
        errors = []
        
        try:
            # 1. Проверка имени файла
            if not file.filename:
                errors.append("Имя файла не указано")
                return False, errors
            
            # 2. Проверка расширения
            file_extension = Path(file.filename).suffix.lower()
            if file_extension not in self.config.ALLOWED_EXTENSIONS:
                errors.append(f"Неподдерживаемый тип файла: {file_extension}. "
                            f"Разрешены: {', '.join(self.config.ALLOWED_EXTENSIONS)}")
            
            # 3. Проверка MIME типа
            if file.content_type not in self.config.ALLOWED_MIME_TYPES:
                errors.append(f"Неподдерживаемый MIME тип: {file.content_type}")
            
            # 4. Проверка размера файла
            if hasattr(file, 'size') and file.size:
                if file.size > self.config.MAX_FILE_SIZE:
                    errors.append(f"Файл слишком большой: {file.size} bytes. "
                                f"Максимум: {self.config.MAX_FILE_SIZE} bytes")
                
                if file.size < self.config.MIN_FILE_SIZE:
                    errors.append(f"Файл слишком маленький: {file.size} bytes. "
                                f"Минимум: {self.config.MIN_FILE_SIZE} bytes")
            
            # 5. Проверка содержимого файла (magic numbers)
            await file.seek(0)
            file_content = await file.read(1024)  # Читаем первые 1KB
            await file.seek(0)  # Возвращаемся в начало
            
            if len(file_content) == 0:
                errors.append("Файл пустой")
                return False, errors
            
            # Проверка magic numbers для PDF
            if file_extension == '.pdf' and not file_content.startswith(b'%PDF'):
                errors.append("Файл не является корректным PDF")
            
            # Проверка для DOCX (ZIP-based format)
            if file_extension == '.docx' and not file_content.startswith(b'PK'):
                errors.append("Файл не является корректным DOCX")
            
            # 6. Проверка имени файла на безопасность
            security_issues = self._check_filename_security(file.filename)
            if security_issues:
                errors.extend(security_issues)
            
        except Exception as e:
            logger.error(f"Error during file validation: {str(e)}")
            errors.append(f"Ошибка валидации файла: {str(e)}")
        
        return len(errors) == 0, errors
    
    def _check_filename_security(self, filename: str) -> List[str]:
        """Проверка безопасности имени файла"""
        errors = []
        
        # Запрещенные символы
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\0']
        for char in dangerous_chars:
            if char in filename:
                errors.append(f"Недопустимый символ в имени файла: '{char}'")
        
        # Проверка на path traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            errors.append("Недопустимые символы пути в имени файла")
        
        # Проверка длины имени файла
        if len(filename) > 255:
            errors.append("Слишком длинное имя файла (максимум 255 символов)")
        
        # Проверка на зарезервированные имена Windows
        reserved_names = {'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 
                         'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 
                         'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 
                         'LPT7', 'LPT8', 'LPT9'}
        
        filename_base = Path(filename).stem.upper()
        if filename_base in reserved_names:
            errors.append(f"Зарезервированное имя файла: {filename}")
        
        return errors

class UserScenarioValidator:
    """Валидатор пользовательских сценариев"""
    
    @staticmethod
    def validate_kp_analysis_scenario(request_data: Dict[str, Any]) -> List[ValidationError]:
        """Валидация сценария анализа КП"""
        errors = []
        
        # Проверка обязательных полей
        if not request_data.get('document_id'):
            errors.append(ValidationError(
                'document_id', 
                'ID документа не указан', 
                'missing_document_id'
            ))
        
        # Проверка режима сравнения
        if request_data.get('comparison_mode', False):
            if not request_data.get('tz_document_id'):
                errors.append(ValidationError(
                    'tz_document_id',
                    'Для режима сравнения необходимо указать ID технического задания',
                    'missing_tz_document'
                ))
        
        return errors
    
    @staticmethod
    def validate_report_generation_scenario(request_data: Dict[str, Any]) -> List[ValidationError]:
        """Валидация сценария генерации отчета"""
        errors = []
        
        # Проверка типа отчета
        report_type = request_data.get('report_type')
        if report_type not in ['pdf', 'excel', 'both']:
            errors.append(ValidationError(
                'report_type',
                'Тип отчета должен быть: pdf, excel или both',
                'invalid_report_type'
            ))
        
        # Проверка ID анализа
        if not request_data.get('analysis_id'):
            errors.append(ValidationError(
                'analysis_id',
                'ID анализа не указан',
                'missing_analysis_id'
            ))
        
        return errors

# Глобальные экземпляры валидаторов
file_validator = FileValidator()
business_validator = BusinessValidator()
scenario_validator = UserScenarioValidator()

def validate_request_data(data: Dict[str, Any], validation_type: str) -> List[ValidationError]:
    """
    Универсальная функция валидации
    
    Args:
        data: Данные для валидации
        validation_type: Тип валидации (kp_analysis, report_generation, etc.)
    
    Returns:
        Список ошибок валидации
    """
    errors = []
    
    if validation_type == 'kp_analysis':
        errors.extend(scenario_validator.validate_kp_analysis_scenario(data))
        
        # Дополнительная валидация если есть данные о стоимости
        if 'cost_data' in data:
            errors.extend(business_validator.validate_cost_data(data['cost_data']))
            
        if 'timeline_data' in data:
            errors.extend(business_validator.validate_timeline_data(data['timeline_data']))
            
        if 'contractor_data' in data:
            errors.extend(business_validator.validate_contractor_data(data['contractor_data']))
    
    elif validation_type == 'report_generation':
        errors.extend(scenario_validator.validate_report_generation_scenario(data))
    
    return errors

def create_validation_response(errors: List[ValidationError]) -> Dict[str, Any]:
    """Создание ответа с ошибками валидации"""
    return {
        "valid": len(errors) == 0,
        "errors": [
            {
                "field": error.field,
                "message": error.message,
                "code": error.code
            }
            for error in errors
        ],
        "error_count": len(errors),
        "timestamp": datetime.now().isoformat()
    }