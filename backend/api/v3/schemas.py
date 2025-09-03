"""
Pydantic схемы для API v3
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class CriteriaWeight(BaseModel):
    """Веса критериев для v3 анализа"""
    budget_compliance: float = Field(0.15, ge=0, le=1, description="Соответствие бюджету")
    timeline_compliance: float = Field(0.12, ge=0, le=1, description="Соответствие срокам")
    technical_compliance: float = Field(0.18, ge=0, le=1, description="Техническое соответствие")
    team_expertise: float = Field(0.10, ge=0, le=1, description="Экспертиза команды")
    functional_coverage: float = Field(0.15, ge=0, le=1, description="Функциональное покрытие")
    quality_assurance: float = Field(0.08, ge=0, le=1, description="Обеспечение качества")
    development_methodology: float = Field(0.07, ge=0, le=1, description="Методология разработки")
    scalability: float = Field(0.05, ge=0, le=1, description="Масштабируемость")
    communication: float = Field(0.05, ge=0, le=1, description="Коммуникация")
    added_value: float = Field(0.05, ge=0, le=1, description="Добавленная стоимость")

class DetailedCriteriaScore(BaseModel):
    """Детальная оценка по критерию"""
    score: int = Field(..., ge=0, le=100)
    weight: float = Field(..., ge=0, le=1)
    details: str
    recommendations: List[str]
    compliance_level: str = Field(..., regex="^(high|medium|low)$")
    risk_factors: List[str]

class V3BusinessAnalysis(BaseModel):
    """Бизнес-анализ по 10 критериям v3"""
    budget_compliance: DetailedCriteriaScore
    timeline_compliance: DetailedCriteriaScore
    technical_compliance: DetailedCriteriaScore
    team_expertise: DetailedCriteriaScore
    functional_coverage: DetailedCriteriaScore
    quality_assurance: DetailedCriteriaScore
    development_methodology: DetailedCriteriaScore
    scalability: DetailedCriteriaScore
    communication: DetailedCriteriaScore
    added_value: DetailedCriteriaScore

class WeightConfigRequest(BaseModel):
    """Конфигурация весов для анализа"""
    preset: Optional[str] = Field("balanced", description="Preset name")
    custom_weights: Optional[CriteriaWeight] = None

class V3AnalysisRequest(BaseModel):
    """Запрос на v3 анализ"""
    document_ids: List[int] = Field(..., description="IDs документов КП")
    tz_document_id: Optional[int] = Field(None, description="ID документа ТЗ")
    analysis_config: Optional[WeightConfigRequest] = None
    detailed_extraction: bool = Field(True, description="Включить детальное извлечение данных")
    generate_charts: bool = Field(True, description="Генерировать диаграммы")

class V3AnalysisResponse(BaseModel):
    """Ответ с результатами v3 анализа"""
    id: int
    status: str
    overall_score: Optional[int] = None
    weighted_score: Optional[float] = None
    company_name: Optional[str] = None
    executive_summary: Optional[str] = None
    recommendations: Optional[List[str]] = None
    business_analysis: Optional[Dict[str, Any]] = None
    criteria_weights: Optional[Dict[str, float]] = None
    risk_level: Optional[str] = None
    analysis_type: str = "v3_expert"
    processing_time: Optional[float] = None
    currency_data: Optional[Dict[str, Any]] = None
    extracted_tables: Optional[List[Dict[str, Any]]] = None
    charts_data: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class V3AnalysisHistoryResponse(BaseModel):
    """История анализов v3"""
    analyses: List[V3AnalysisResponse]
    total: int
    skip: int
    limit: int

class WeightPresetsResponse(BaseModel):
    """Доступные пресеты весов критериев"""
    system_presets: Dict[str, Any]
    custom_presets: Dict[str, Any]
    criteria_descriptions: Dict[str, str]