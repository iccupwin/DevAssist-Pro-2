#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Export API Endpoint для DevAssist Pro
Интеграция рабочего PDF экспортера с поддержкой кириллицы
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging
import tempfile
import os
from datetime import datetime

# НОВАЯ СИСТЕМА: Импортируем профессиональный PDF генератор
try:
    from services.reports.core.professional_kp_pdf_generator import ProfessionalKPPDFGenerator
    from services.reports.core.advanced_chart_generator import AdvancedChartGenerator
except ImportError:
    # Fallback import
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).parent.parent / "services" / "reports" / "core"))
    from professional_kp_pdf_generator import ProfessionalKPPDFGenerator
    from advanced_chart_generator import AdvancedChartGenerator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["PDF Export"])


class KPAnalysisExportRequest(BaseModel):
    """Модель запроса для экспорта PDF анализа КП"""
    
    # Основная информация
    id: str = Field(..., description="Уникальный ID анализа")
    tz_name: str = Field(..., description="Название технического задания")
    kp_name: str = Field(..., description="Название коммерческого предложения")
    company_name: str = Field(..., description="Название компании")
    
    # Оценки
    overall_score: int = Field(0, ge=0, le=100, description="Общая оценка (0-100)")
    confidence_level: int = Field(85, ge=0, le=100, description="Уровень уверенности")
    analysis_duration: int = Field(30, ge=1, description="Время анализа в секундах")
    
    # Метаданные
    model_used: str = Field("claude-3-5-sonnet-20241022", description="Используемая AI модель")
    analysis_version: str = Field("2.0", description="Версия анализатора")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Время создания")
    
    # Финансовые данные
    pricing: Optional[str] = Field(None, description="Информация о стоимости")
    timeline: Optional[str] = Field(None, description="Информация о сроках")
    tech_stack: Optional[str] = Field(None, description="Технологический стек")
    
    # Валютная информация
    primary_currency: Optional[Dict[str, Any]] = Field(None, description="Основная валюта")
    currencies_detected: Optional[List[Dict[str, Any]]] = Field(None, description="Обнаруженные валюты")
    
    # Разделы анализа
    budget_compliance: Optional[Dict[str, Any]] = Field(None, description="Бюджетное соответствие")
    timeline_compliance: Optional[Dict[str, Any]] = Field(None, description="Временные рамки")
    technical_compliance: Optional[Dict[str, Any]] = Field(None, description="Техническое соответствие")
    team_expertise: Optional[Dict[str, Any]] = Field(None, description="Команда и экспертиза")
    
    # Результаты и рекомендации
    final_recommendation: str = Field("conditional_accept", description="Итоговая рекомендация")
    executive_summary: Optional[str] = Field(None, description="Исполнительное резюме")
    key_strengths: Optional[List[str]] = Field(None, description="Ключевые сильные стороны")
    critical_concerns: Optional[List[str]] = Field(None, description="Критические проблемы")
    next_steps: Optional[List[str]] = Field(None, description="Следующие шаги")


class PDFExportResponse(BaseModel):
    """Модель ответа PDF экспорта"""
    success: bool = Field(..., description="Статус успеха")
    pdf_url: Optional[str] = Field(None, description="URL для скачивания PDF")
    filename: Optional[str] = Field(None, description="Имя файла")
    error: Optional[str] = Field(None, description="Сообщение об ошибке")
    details: Optional[str] = Field(None, description="Детали ошибки")


@router.post("/export/kp-analysis-pdf-professional", response_model=PDFExportResponse)
async def export_kp_analysis_to_pdf_professional(request: KPAnalysisExportRequest):
    """
    НОВАЯ СИСТЕМА: Экспорт анализа КП в профессиональный PDF
    
    Возможности:
    - Полная поддержка кириллицы без артефактов
    - Профессиональный дизайн на уровне McKinsey/BCG
    - 15+ типов графиков и диаграмм
    - Интерактивное оглавление
    - Готовность к клиентским презентациям
    
    Args:
        request: Данные для экспорта
        
    Returns:
        PDFExportResponse: Результат экспорта
    """
    try:
        logger.info(f"🎯 НОВАЯ СИСТЕМА: Профессиональный PDF экспорт для анализа: {request.id}")
        
        # Преобразуем данные запроса в формат для генератора
        analysis_data = _convert_request_to_analysis_data(request)
        
        # Создаем профессиональный PDF генератор
        logger.info("🔥 ИСПОЛЬЗУЕМ НОВЫЙ ПРОФЕССИОНАЛЬНЫЙ PDF ГЕНЕРАТОР")
        pdf_generator = ProfessionalKPPDFGenerator()
        
        # Генерируем PDF отчет
        pdf_buffer = pdf_generator.generate_report(analysis_data)
        pdf_content = pdf_buffer.read()
        
        # Создаем временный файл
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix='.pdf',
            prefix=f'professional_kp_analysis_{request.id}_'
        )
        
        # Записываем PDF в временный файл
        with open(temp_file.name, 'wb') as f:
            f.write(pdf_content)
        
        # Генерируем имя файла
        safe_company_name = _sanitize_filename(request.company_name)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"DevAssist_Pro_Professional_Report_{safe_company_name}_{timestamp}.pdf"
        
        # Возвращаем успешный ответ
        logger.info(f"✅ НОВАЯ СИСТЕМА: Профессиональный PDF создан: {filename}")
        
        return PDFExportResponse(
            success=True,
            pdf_url=f"/api/reports/download/{os.path.basename(temp_file.name)}",
            filename=filename
        )
        
    except Exception as e:
        logger.error(f"❌ КРИТИЧЕСКАЯ ОШИБКА профессионального PDF экспорта: {e}")
        import traceback
        traceback.print_exc()
        
        return PDFExportResponse(
            success=False,
            error=str(e),
            details="Ошибка при генерации профессионального PDF отчета"
        )


@router.post("/export/kp-analysis-pdf", response_model=PDFExportResponse)
async def export_kp_analysis_to_pdf(request: KPAnalysisExportRequest):
    """
    Экспорт анализа КП в PDF с поддержкой кириллицы
    
    Args:
        request: Данные для экспорта
        
    Returns:
        PDFExportResponse: Результат экспорта
    """
    try:
        logger.info(f"🎯 Начало экспорта PDF для анализа: {request.id}")
        
        # Преобразуем данные запроса в формат для PDF экспортера
        analysis_data = _convert_request_to_analysis_data(request)
        
        # ОБНОВЛЕНО: Используем новый профессиональный PDF генератор
        logger.info("🎯 ОБНОВЛЕНО: Используем новый профессиональный PDF генератор")
        pdf_generator = ProfessionalKPPDFGenerator()
        pdf_buffer = pdf_generator.generate_report(analysis_data)
        pdf_content = pdf_buffer.read()
        
        # Создаем временный файл
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix='.pdf',
            prefix=f'kp_analysis_{request.id}_'
        )
        
        # Записываем PDF в временный файл
        with open(temp_file.name, 'wb') as f:
            f.write(pdf_content)
        
        # Генерируем имя файла
        safe_company_name = _sanitize_filename(request.company_name)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"DevAssist_Pro_KP_Analysis_{safe_company_name}_{timestamp}.pdf"
        
        # Возвращаем успешный ответ
        logger.info(f"✅ PDF успешно создан: {filename}")
        
        return PDFExportResponse(
            success=True,
            pdf_url=f"/api/reports/download/{os.path.basename(temp_file.name)}",
            filename=filename
        )
        
    except Exception as e:
        logger.error(f"❌ Ошибка экспорта PDF: {e}")
        import traceback
        traceback.print_exc()
        
        return PDFExportResponse(
            success=False,
            error=str(e),
            details="Внутренняя ошибка сервера при генерации PDF"
        )


@router.post("/export/kp-analysis-pdf-tender", response_model=PDFExportResponse)
async def export_kp_analysis_to_pdf_tender_style(request: KPAnalysisExportRequest):
    """
    КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Экспорт анализа КП в PDF в стиле Tender с поддержкой кириллицы
    
    Args:
        request: Данные для экспорта
        
    Returns:
        PDFExportResponse: Результат экспорта
    """
    try:
        logger.info(f"🎯 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Tender Style PDF экспорт для анализа: {request.id}")
        
        # Преобразуем данные запроса в формат для экспортера
        analysis_data = _convert_request_to_analysis_data(request)
        
        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем Tender Style PDF Exporter
        logger.info("🔥 ИСПОЛЬЗУЮ TENDER STYLE EXPORTER с matplotlib")
        pdf_buffer = tender_pdf_exporter.generate_kp_analysis_pdf(analysis_data)
        pdf_content = pdf_buffer.getvalue()
        
        # Создаем временный файл
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix='.pdf',
            prefix=f'tender_style_kp_analysis_{request.id}_'
        )
        
        # Записываем PDF в временный файл
        with open(temp_file.name, 'wb') as f:
            f.write(pdf_content)
        
        # Генерируем имя файла
        safe_company_name = _sanitize_filename(request.company_name)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"DevAssist_Pro_TENDER_STYLE_{safe_company_name}_{timestamp}.pdf"
        
        # Возвращаем успешный ответ
        logger.info(f"✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: PDF Tender Style создан: {filename}")
        
        return PDFExportResponse(
            success=True,
            pdf_url=f"/api/reports/download/{os.path.basename(temp_file.name)}",
            filename=filename
        )
        
    except Exception as e:
        logger.error(f"❌ КРИТИЧЕСКАЯ ОШИБКА Tender Style PDF экспорта: {e}")
        import traceback
        traceback.print_exc()
        
        return PDFExportResponse(
            success=False,
            error=str(e),
            details="Ошибка при генерации PDF в стиле Tender"
        )


@router.get("/download/{file_id}")
async def download_pdf(file_id: str):
    """
    Скачивание сгенерированного PDF файла
    
    Args:
        file_id: ID файла для скачивания
        
    Returns:
        FileResponse: PDF файл для скачивания
    """
    try:
        # Путь к временному файлу
        temp_path = os.path.join(tempfile.gettempdir(), file_id)
        
        if not os.path.exists(temp_path):
            raise HTTPException(status_code=404, detail="Файл не найден")
        
        # Определяем имя файла
        filename = f"DevAssist_Pro_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return FileResponse(
            path=temp_path,
            filename=filename,
            media_type='application/pdf'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка скачивания файла {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Ошибка скачивания файла")


def _convert_request_to_analysis_data(request: KPAnalysisExportRequest) -> Dict[str, Any]:
    """
    Преобразует данные запроса в формат для PDF экспортера
    
    Args:
        request: Данные запроса
        
    Returns:
        Dict: Данные в формате PDF экспортера
    """
    
    # Создаем базовую структуру
    analysis_data = {
        # Основная информация
        "id": request.id,
        "tz_name": request.tz_name,
        "kp_name": request.kp_name,
        "company_name": request.company_name,
        "overall_score": request.overall_score,
        "confidence_level": request.confidence_level,
        "analysis_duration": request.analysis_duration,
        "model_used": request.model_used,
        "analysis_version": request.analysis_version,
        "created_at": request.created_at,
        
        # Дополнительные данные
        "pricing": request.pricing,
        "timeline": request.timeline,
        "tech_stack": request.tech_stack,
        
        # Валютная информация
        "primary_currency": request.primary_currency or {
            "code": "RUB",
            "symbol": "₽",
            "name": "Российский рубль",
            "detected": True
        },
        "currencies_detected": request.currencies_detected or [
            {
                "code": "RUB",
                "symbol": "₽", 
                "name": "Российский рубль",
                "detected": True
            }
        ],
        
        # Разделы анализа
        "budget_compliance": request.budget_compliance or _create_default_section(
            "budget_compliance", "Бюджетное соответствие", request.overall_score
        ),
        "timeline_compliance": request.timeline_compliance or _create_default_section(
            "timeline_compliance", "Временные рамки", request.overall_score
        ),
        "technical_compliance": request.technical_compliance or _create_default_section(
            "technical_compliance", "Техническое соответствие", request.overall_score
        ),
        "team_expertise": request.team_expertise or _create_default_section(
            "team_expertise", "Команда и экспертиза", request.overall_score - 5
        ),
        
        # Итоговые рекомендации
        "final_recommendation": request.final_recommendation,
        "executive_summary": request.executive_summary or _generate_default_summary(
            request.company_name, request.overall_score
        ),
        "key_strengths": request.key_strengths or [
            "Соответствие основным требованиям ТЗ",
            "Адекватное ценовое предложение"
        ],
        "critical_concerns": request.critical_concerns or [
            "Требуется детализация отдельных аспектов"
        ],
        "next_steps": request.next_steps or [
            "Провести техническое интервью с командой",
            "Уточнить детали реализации",
            "Согласовать финальные условия"
        ]
    }
    
    return analysis_data


def _create_default_section(section_id: str, title: str, base_score: int) -> Dict[str, Any]:
    """
    Создает секцию по умолчанию для анализа
    
    Args:
        section_id: ID секции
        title: Название секции
        base_score: Базовая оценка
        
    Returns:
        Dict: Данные секции
    """
    return {
        "id": section_id,
        "title": title,
        "score": base_score,
        "description": f"Анализ раздела '{title}' выполнен успешно.",
        "key_findings": [
            f"Анализ {title.lower()} показал соответствие требованиям",
            "Выявлены области для улучшения"
        ],
        "recommendations": [
            f"Рекомендуется детализировать {title.lower()}",
            "Провести дополнительную проверку"
        ],
        "risk_level": "low" if base_score >= 80 else "medium" if base_score >= 60 else "high"
    }


def _generate_default_summary(company_name: str, score: int) -> str:
    """
    Генерирует резюме по умолчанию
    
    Args:
        company_name: Название компании
        score: Общая оценка
        
    Returns:
        str: Резюме
    """
    if score >= 80:
        status = "высокий уровень качества"
        recommendation = "рекомендуется к принятию"
    elif score >= 60:
        status = "средний уровень качества"
        recommendation = "рекомендуется к принятию с условиями"
    else:
        status = "требует улучшений"
        recommendation = "требует доработки"
    
    return f"""
    Коммерческое предложение от {company_name} получило общую оценку {score}/100 баллов.
    Предложение демонстрирует {status} и {recommendation}.
    
    Анализ выполнен с использованием системы DevAssist Pro с поддержкой кириллицы
    и профессиональным оформлением PDF отчетов.
    """


def _sanitize_filename(filename: str) -> str:
    """
    Очищает имя файла от недопустимых символов
    
    Args:
        filename: Исходное имя файла
        
    Returns:
        str: Очищенное имя файла
    """
    import re
    # Удаляем недопустимые символы
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Ограничиваем длину
    return sanitized[:50] if len(sanitized) > 50 else sanitized


# Регистрируем роутер в основном приложении
def setup_pdf_export_routes(app):
    """
    Настройка маршрутов PDF экспорта
    
    Args:
        app: FastAPI приложение
    """
    app.include_router(router)
    logger.info("🔗 PDF Export API routes зарегистрированы")


if __name__ == "__main__":
    # Тестирование PDF экспорта
    import asyncio
    
    async def test_pdf_export():
        """Тест PDF экспорта"""
        test_request = KPAnalysisExportRequest(
            id="test_123",
            tz_name="Тест ТЗ",
            kp_name="Тест КП",
            company_name="Тестовая компания ООО",
            overall_score=85,
            pricing="2,500,000 рублей",
            timeline="6 месяцев",
            tech_stack="React, Node.js",
            executive_summary="Это тестовое резюме для проверки PDF экспорта."
        )
        
        result = await export_kp_analysis_to_pdf(test_request)
        print("✅ Тест PDF экспорта:", result)
    
    asyncio.run(test_pdf_export())