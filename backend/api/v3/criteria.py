"""
Управление критериями и весами для v3 анализа
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from shared.database import get_db
from core.security import get_current_user
from shared.models import User, CriteriaWeightsPreset
from .schemas import CriteriaWeight, WeightPresetsResponse

router = APIRouter(prefix="/api/v3/criteria", tags=["Criteria Management v3"])

@router.get("/weights/presets", response_model=WeightPresetsResponse)
async def get_weight_presets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить доступные пресеты весов критериев"""
    
    # Системные пресеты
    system_presets = {
        "balanced": {
            "name": "Сбалансированный",
            "description": "Равномерное распределение весов по всем критериям",
            "weights": CriteriaWeight().dict()
        },
        "budget_focused": {
            "name": "Бюджетно-ориентированный", 
            "description": "Повышенное внимание к финансовым аспектам",
            "weights": CriteriaWeight(
                budget_compliance=0.25,
                timeline_compliance=0.15,
                technical_compliance=0.15,
                team_expertise=0.08,
                functional_coverage=0.12,
                quality_assurance=0.05,
                development_methodology=0.05,
                scalability=0.05,
                communication=0.05,
                added_value=0.05
            ).dict()
        },
        "technical_focused": {
            "name": "Технически-ориентированный",
            "description": "Акцент на технических решениях и функциональности", 
            "weights": CriteriaWeight(
                budget_compliance=0.10,
                timeline_compliance=0.10,
                technical_compliance=0.25,
                team_expertise=0.15,
                functional_coverage=0.20,
                quality_assurance=0.08,
                development_methodology=0.07,
                scalability=0.05,
                communication=0.05,
                added_value=0.05
            ).dict()
        },
        "quality_focused": {
            "name": "Качество-ориентированный",
            "description": "Приоритет контроля качества и надежности",
            "weights": CriteriaWeight(
                budget_compliance=0.12,
                timeline_compliance=0.12,
                technical_compliance=0.15,
                team_expertise=0.12,
                functional_coverage=0.15,
                quality_assurance=0.20,
                development_methodology=0.08,
                scalability=0.06,
                communication=0.05,
                added_value=0.05
            ).dict()
        }
    }
    
    # Пользовательские пресеты (если есть)
    user_presets = db.query(CriteriaWeightsPreset).filter(
        CriteriaWeightsPreset.created_by_id == current_user.id,
        CriteriaWeightsPreset.is_system == False
    ).all()
    
    custom_presets = {}
    for preset in user_presets:
        custom_presets[f"custom_{preset.id}"] = {
            "name": preset.name,
            "description": preset.description,
            "weights": {
                "budget_compliance": preset.budget_compliance,
                "timeline_compliance": preset.timeline_compliance,
                "technical_compliance": preset.technical_compliance,
                "team_expertise": preset.team_expertise,
                "functional_coverage": preset.functional_coverage,
                "quality_assurance": preset.quality_assurance,
                "development_methodology": preset.development_methodology,
                "scalability": preset.scalability,
                "communication": preset.communication,
                "added_value": preset.added_value
            }
        }
    
    return WeightPresetsResponse(
        system_presets=system_presets,
        custom_presets=custom_presets,
        criteria_descriptions={
            "budget_compliance": "Соответствие бюджетным требованиям",
            "timeline_compliance": "Соответствие временным рамкам", 
            "technical_compliance": "Техническое соответствие требованиям",
            "team_expertise": "Экспертиза и квалификация команды",
            "functional_coverage": "Покрытие функциональных требований",
            "quality_assurance": "Процессы обеспечения качества",
            "development_methodology": "Методология разработки",
            "scalability": "Возможности масштабирования",
            "communication": "Качество коммуникации",
            "added_value": "Добавленная стоимость"
        }
    )

@router.post("/weights/custom")
async def set_custom_weights(
    weights: CriteriaWeight,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Установка пользовательских весов критериев"""
    
    # Валидация что сумма весов равна 1.0
    total_weight = sum(weights.dict().values())
    if not (0.99 <= total_weight <= 1.01):  # Допуск на ошибки округления
        raise HTTPException(
            status_code=400,
            detail=f"Weights must sum to 1.0, got {total_weight:.3f}"
        )
    
    return {
        "status": "success",
        "message": "Custom weights validated successfully",
        "weights": weights.dict(),
        "total_weight": total_weight
    }

@router.post("/weights/save")
async def save_custom_preset(
    name: str,
    description: str,
    weights: CriteriaWeight,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Сохранить пользовательский пресет весов"""
    
    # Проверить что пресет с таким именем не существует
    existing = db.query(CriteriaWeightsPreset).filter(
        CriteriaWeightsPreset.name == name,
        CriteriaWeightsPreset.created_by_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Preset with this name already exists")
    
    # Валидация весов
    total_weight = sum(weights.dict().values())
    if not (0.99 <= total_weight <= 1.01):
        raise HTTPException(
            status_code=400,
            detail=f"Weights must sum to 1.0, got {total_weight:.3f}"
        )
    
    # Создать новый пресет
    preset = CriteriaWeightsPreset(
        name=name,
        description=description,
        created_by_id=current_user.id,
        **weights.dict()
    )
    
    db.add(preset)
    db.commit()
    db.refresh(preset)
    
    return {
        "status": "success",
        "message": "Custom preset saved successfully",
        "preset_id": preset.id,
        "name": preset.name
    }