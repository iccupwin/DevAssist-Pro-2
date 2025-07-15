"""
Конфигурация LLM Service DevAssist Pro
Согласно ТЗ Этап 4: AI Integrations
"""
import os
from typing import Dict, List, Optional
from pydantic import BaseSettings, Field
from enum import Enum

class Settings(BaseSettings):
    """Настройки LLM Service"""
    
    # Основные настройки сервиса
    SERVICE_NAME: str = "llm-service"
    SERVICE_VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8002
    DEBUG: bool = False
    RELOAD: bool = False
    
    # База данных
    POSTGRES_URL: str = Field(..., env="POSTGRES_URL")
    
    # Redis для кеширования
    REDIS_URL: str = Field(..., env="REDIS_URL")
    CACHE_TTL: int = 3600  # 1 час
    
    # API ключи провайдеров согласно ТЗ раздел 4.3
    OPENAI_API_KEY: Optional[str] = Field(None, env="OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")
    GOOGLE_API_KEY: Optional[str] = Field(None, env="GOOGLE_API_KEY")
    YANDEX_API_KEY: Optional[str] = Field(None, env="YANDEX_API_KEY")
    GIGACHAT_API_KEY: Optional[str] = Field(None, env="GIGACHAT_API_KEY")
    
    # Лимиты и таймауты
    DEFAULT_TIMEOUT: int = 30
    MAX_RETRIES: int = 3
    MAX_TOKENS_PER_REQUEST: int = 4096
    DAILY_COST_LIMIT: float = 100.0
    MONTHLY_COST_LIMIT: float = 1000.0
    
    # Настройки кеширования
    ENABLE_CACHING: bool = True
    CACHE_PREFIX: str = "llm_cache:"
    
    # Мониторинг
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 8012
    
    # Fallback настройки согласно ТЗ
    FALLBACK_ENABLED: bool = True
    FALLBACK_ORDER: List[str] = ["openai", "anthropic", "google", "yandex"]
    
    # JWT для валидации токенов
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Конфигурация AI моделей согласно ТЗ раздел 4.3
DEFAULT_MODELS_CONFIG = {
    "openai": {
        "gpt-4": {
            "display_name": "GPT-4",
            "max_tokens": 8192,
            "cost_per_1k_input": 0.03,
            "cost_per_1k_output": 0.06,
            "supports_streaming": True,
            "supports_functions": True,
            "context_window": 8192
        },
        "gpt-4-turbo": {
            "display_name": "GPT-4 Turbo",
            "max_tokens": 4096,
            "cost_per_1k_input": 0.01,
            "cost_per_1k_output": 0.03,
            "supports_streaming": True,
            "supports_functions": True,
            "context_window": 128000
        },
        "gpt-3.5-turbo": {
            "display_name": "GPT-3.5 Turbo",
            "max_tokens": 4096,
            "cost_per_1k_input": 0.001,
            "cost_per_1k_output": 0.002,
            "supports_streaming": True,
            "supports_functions": True,
            "context_window": 16385
        }
    },
    "anthropic": {
        "claude-3-opus": {
            "display_name": "Claude 3 Opus",
            "max_tokens": 4096,
            "cost_per_1k_input": 0.015,
            "cost_per_1k_output": 0.075,
            "supports_streaming": True,
            "supports_functions": False,
            "context_window": 200000
        },
        "claude-3-sonnet": {
            "display_name": "Claude 3 Sonnet",
            "max_tokens": 4096,
            "cost_per_1k_input": 0.003,
            "cost_per_1k_output": 0.015,
            "supports_streaming": True,
            "supports_functions": False,
            "context_window": 200000
        },
        "claude-3-haiku": {
            "display_name": "Claude 3 Haiku",
            "max_tokens": 4096,
            "cost_per_1k_input": 0.00025,
            "cost_per_1k_output": 0.00125,
            "supports_streaming": True,
            "supports_functions": False,
            "context_window": 200000
        }
    },
    "google": {
        "gemini-pro": {
            "display_name": "Gemini Pro",
            "max_tokens": 4096,
            "cost_per_1k_input": 0.0005,
            "cost_per_1k_output": 0.0015,
            "supports_streaming": True,
            "supports_functions": True,
            "context_window": 30720
        },
        "gemini-ultra": {
            "display_name": "Gemini Ultra",
            "max_tokens": 4096,
            "cost_per_1k_input": 0.0,  # Пока не доступно
            "cost_per_1k_output": 0.0,
            "supports_streaming": True,
            "supports_functions": True,
            "context_window": 30720
        }
    },
    "yandex": {
        "yandexgpt": {
            "display_name": "YandexGPT",
            "max_tokens": 2048,
            "cost_per_1k_input": 0.002,
            "cost_per_1k_output": 0.002,
            "supports_streaming": False,
            "supports_functions": False,
            "context_window": 8000
        }
    },
    "local": {
        "llama-3-8b": {
            "display_name": "Llama 3 8B (Local)",
            "max_tokens": 4096,
            "cost_per_1k_input": 0.0,
            "cost_per_1k_output": 0.0,
            "supports_streaming": True,
            "supports_functions": False,
            "context_window": 8192
        },
        "mixtral-8x7b": {
            "display_name": "Mixtral 8x7B (Local)",
            "max_tokens": 4096,
            "cost_per_1k_input": 0.0,
            "cost_per_1k_output": 0.0,
            "supports_streaming": True,
            "supports_functions": False,
            "context_window": 32768
        }
    }
}

# Конфигурация задач по типам согласно ТЗ
TASK_MODEL_MAPPING = {
    "text_analysis": {
        "default": "gpt-4",
        "fast": "gpt-3.5-turbo",
        "quality": "claude-3-opus"
    },
    "data_extraction": {
        "default": "gpt-4",
        "fast": "gpt-3.5-turbo",
        "quality": "claude-3-sonnet"
    },
    "document_conversion": {
        "default": "claude-3-sonnet",
        "fast": "gpt-3.5-turbo",
        "quality": "claude-3-opus"
    },
    "report_generation": {
        "default": "gpt-4",
        "fast": "claude-3-haiku",
        "quality": "claude-3-opus"
    },
    "risk_assessment": {
        "default": "claude-3-opus",
        "fast": "claude-3-sonnet",
        "quality": "gpt-4"
    },
    "recommendation": {
        "default": "gpt-4",
        "fast": "claude-3-haiku",
        "quality": "claude-3-opus"
    },
    "comparison": {
        "default": "claude-3-sonnet",
        "fast": "gpt-3.5-turbo",
        "quality": "claude-3-opus"
    },
    "search": {
        "default": "gpt-3.5-turbo",
        "fast": "claude-3-haiku",
        "quality": "gpt-4"
    }
}

# Промпты для КП Анализатора согласно ТЗ раздел 4.2.2
KP_ANALYZER_PROMPTS = {
    "extract_tz_requirements": {
        "system": "Ты эксперт по анализу технических заданий в строительстве и девелопменте.",
        "user": """Проанализируй техническое задание и извлеки все ключевые требования.

Техническое задание:
{tz_content}

Извлеки и структурируй следующие данные:
1. Объем и состав требуемых работ
2. Требования к срокам выполнения
3. Бюджетные ограничения (если указаны)
4. Технические требования и стандарты
5. Требования к материалам
6. Требования к квалификации исполнителей
7. Особые условия и ограничения
8. Критерии приемки работ
9. Гарантийные требования

Верни результат в JSON формате."""
    },
    "extract_kp_data": {
        "system": "Ты эксперт по анализу коммерческих предложений в строительной сфере.",
        "user": """Проанализируй коммерческое предложение и извлеки все ключевые данные.

Коммерческое предложение:
{kp_content}

Извлеки и структурируй следующие данные:
1. Стоимость работ (с разбивкой по этапам)
2. Предлагаемые сроки выполнения
3. Гарантийные обязательства
4. Состав предлагаемых работ
5. Используемые материалы и их характеристики
6. Квалификация персонала и опыт компании
7. Условия оплаты и дополнительные условия
8. Информация о компании-подрядчике

Верни результат в JSON формате."""
    },
    "compare_tz_with_kp": {
        "system": "Ты эксперт по сопоставлению технических заданий с коммерческими предложениями.",
        "user": """Сопоставь требования ТЗ с предложениями КП и оцени соответствие.

Требования ТЗ:
{tz_requirements}

Данные КП:
{kp_data}

Проведи анализ соответствия:
1. Построчное сопоставление требований ТЗ с предложениями КП
2. Выяви расхождения и несоответствия
3. Оцени полноту покрытия требований (в процентах)
4. Определи список отсутствующих в КП требований
5. Определи список дополнительных предложений КП

Верни результат в JSON формате с детальным анализом."""
    },
    "risk_assessment": {
        "system": "Ты эксперт по оценке рисков в строительных проектах.",
        "user": """Оцени риски в данном коммерческом предложении.

Данные КП:
{kp_data}

Результаты сопоставления с ТЗ:
{compliance_analysis}

Проведи оценку рисков:
1. Выяви скрытые риски в КП
2. Проанализируй нестандартные условия
3. Оцени профессионализм составления КП
4. Спрогнозируй вероятность успешного сотрудничества
5. Оцени финансовые риски

Верни результат в JSON формате с описанием каждого риска и его критичности."""
    },
    "recommendation_generation": {
        "system": "Ты эксперт-консультант по выбору подрядчиков в строительстве.",
        "user": """На основе анализа ТЗ, КП и оценки рисков сформируй рекомендации.

Данные анализа:
- Соответствие ТЗ: {compliance_score}%
- Выявленные риски: {risks}
- Данные подрядчика: {contractor_info}

Сформируй рекомендации:
1. Общая рекомендация (принять/отклонить/доработать)
2. Обоснование решения
3. Ключевые преимущества КП
4. Основные недостатки КП
5. Вопросы для уточнения подрядчику
6. Рекомендации по доработке КП

Верни результат в структурированном формате."""
    }
}

settings = Settings()