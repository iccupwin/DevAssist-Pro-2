"""
Analytics Processor для DevAssist Pro
Основной процессор для обработки аналитических данных
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json
import hashlib
import uuid
from pathlib import Path

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

class AnalyticsProcessor:
    """Основной процессор аналитики"""
    
    def __init__(self):
        self.redis_client = None
        self.cache_ttl = 3600  # 1 час кеширования
        self.output_dir = Path("data/analytics")
        self.output_dir.mkdir(exist_ok=True)
    
    async def init_redis(self):
        """Инициализация Redis подключения"""
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.Redis(
                    host='redis',
                    port=6379,
                    password='redis_password',
                    db=4,  # Отдельная база для аналитики
                    decode_responses=True
                )
                await self.redis_client.ping()
                logger.info("Redis connection established for analytics")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {str(e)}")
                self.redis_client = None
        else:
            logger.warning("Redis not available, caching disabled")
    
    async def process_analytics(
        self,
        data_type: str,
        filters: Optional[Dict[str, Any]] = None,
        date_range: Optional[Dict[str, datetime]] = None,
        aggregation_type: str = "count"
    ) -> Dict[str, Any]:
        """
        Обработка аналитических данных
        
        Args:
            data_type: Тип данных для анализа
            filters: Фильтры для данных
            date_range: Диапазон дат
            aggregation_type: Тип агрегации
            
        Returns:
            Результат аналитики
        """
        try:
            logger.info(f"Processing analytics for {data_type}")
            
            # Генерация ключа кеша
            cache_key = self._generate_cache_key(data_type, filters, date_range, aggregation_type)
            
            # Попытка получить из кеша
            cached_result = await self._get_from_cache(cache_key)
            if cached_result:
                logger.info(f"Analytics data served from cache: {cache_key}")
                return cached_result
            
            # Обработка данных
            result = await self._process_analytics_data(
                data_type, filters, date_range, aggregation_type
            )
            
            # Кеширование результата
            await self._save_to_cache(cache_key, result)
            
            result["cache_key"] = cache_key
            return result
            
        except Exception as e:
            logger.error(f"Error processing analytics: {str(e)}")
            raise
    
    async def _process_analytics_data(
        self,
        data_type: str,
        filters: Optional[Dict[str, Any]],
        date_range: Optional[Dict[str, datetime]],
        aggregation_type: str
    ) -> Dict[str, Any]:
        """Обработка аналитических данных"""
        
        # Определение обработчика по типу данных
        processors = {
            "analyses": self._process_analyses_analytics,
            "documents": self._process_documents_analytics,
            "users": self._process_users_analytics,
            "projects": self._process_projects_analytics,
            "ai_usage": self._process_ai_usage_analytics
        }
        
        processor = processors.get(data_type)
        if not processor:
            raise ValueError(f"Unknown data type: {data_type}")
        
        return await processor(filters, date_range, aggregation_type)
    
    async def _process_analyses_analytics(
        self,
        filters: Optional[Dict[str, Any]],
        date_range: Optional[Dict[str, datetime]],
        aggregation_type: str
    ) -> Dict[str, Any]:
        """Аналитика по анализам КП"""
        
        # Заглушка для демонстрации
        return {
            "total_analyses": 156,
            "successful_analyses": 142,
            "failed_analyses": 14,
            "success_rate": 91.0,
            "avg_processing_time": 45.2,
            "total_cost": 1245.67,
            "avg_cost_per_analysis": 7.99,
            "by_provider": {
                "openai": {
                    "count": 89,
                    "success_rate": 94.0,
                    "avg_cost": 8.45
                },
                "anthropic": {
                    "count": 42,
                    "success_rate": 88.0,
                    "avg_cost": 6.23
                },
                "google": {
                    "count": 25,
                    "success_rate": 84.0,
                    "avg_cost": 9.12
                }
            },
            "by_period": {
                "daily": [
                    {"date": "2025-01-10", "count": 12, "success_rate": 92.0},
                    {"date": "2025-01-11", "count": 15, "success_rate": 87.0},
                    {"date": "2025-01-12", "count": 18, "success_rate": 94.0},
                    {"date": "2025-01-13", "count": 21, "success_rate": 91.0},
                    {"date": "2025-01-14", "count": 16, "success_rate": 89.0}
                ]
            },
            "top_users": [
                {"user_id": 1, "name": "Иван Петров", "analyses_count": 23},
                {"user_id": 2, "name": "Мария Сидорова", "analyses_count": 19},
                {"user_id": 3, "name": "Алексей Козлов", "analyses_count": 17}
            ]
        }
    
    async def _process_documents_analytics(
        self,
        filters: Optional[Dict[str, Any]],
        date_range: Optional[Dict[str, datetime]],
        aggregation_type: str
    ) -> Dict[str, Any]:
        """Аналитика по документам"""
        
        return {
            "total_documents": 298,
            "processed_documents": 284,
            "failed_processing": 14,
            "processing_success_rate": 95.3,
            "avg_file_size": 2.4,  # MB
            "by_type": {
                "pdf": {"count": 189, "success_rate": 96.0},
                "docx": {"count": 78, "success_rate": 94.0},
                "txt": {"count": 31, "success_rate": 97.0}
            },
            "by_size": {
                "small": {"count": 120, "range": "< 1MB", "success_rate": 98.0},
                "medium": {"count": 142, "range": "1-5MB", "success_rate": 94.0},
                "large": {"count": 36, "range": "> 5MB", "success_rate": 89.0}
            },
            "upload_trends": [
                {"date": "2025-01-10", "count": 28},
                {"date": "2025-01-11", "count": 35},
                {"date": "2025-01-12", "count": 42},
                {"date": "2025-01-13", "count": 38},
                {"date": "2025-01-14", "count": 33}
            ]
        }
    
    async def _process_users_analytics(
        self,
        filters: Optional[Dict[str, Any]],
        date_range: Optional[Dict[str, datetime]],
        aggregation_type: str
    ) -> Dict[str, Any]:
        """Аналитика по пользователям"""
        
        return {
            "total_users": 47,
            "active_users": 34,
            "new_users_this_month": 8,
            "activity_rate": 72.3,
            "avg_analyses_per_user": 3.3,
            "by_organization": {
                "ООО Стройинвест": {"users": 12, "analyses": 89},
                "ГК Развитие": {"users": 8, "analyses": 45},
                "СК Монолит": {"users": 6, "analyses": 22}
            },
            "user_engagement": {
                "daily_active": 12,
                "weekly_active": 28,
                "monthly_active": 34
            },
            "retention_rate": {
                "7_day": 78.0,
                "30_day": 65.0,
                "90_day": 52.0
            }
        }
    
    async def _process_projects_analytics(
        self,
        filters: Optional[Dict[str, Any]],
        date_range: Optional[Dict[str, datetime]],
        aggregation_type: str
    ) -> Dict[str, Any]:
        """Аналитика по проектам"""
        
        return {
            "total_projects": 89,
            "active_projects": 67,
            "completed_projects": 18,
            "paused_projects": 4,
            "avg_documents_per_project": 3.3,
            "avg_analyses_per_project": 1.8,
            "by_status": {
                "planning": {"count": 23, "percentage": 25.8},
                "analysis": {"count": 31, "percentage": 34.8},
                "execution": {"count": 13, "percentage": 14.6},
                "completed": {"count": 18, "percentage": 20.2},
                "paused": {"count": 4, "percentage": 4.5}
            },
            "project_duration": {
                "avg_days": 45.2,
                "median_days": 38.0,
                "distribution": {
                    "0-30": 34,
                    "31-60": 28,
                    "61-90": 19,
                    "90+": 8
                }
            }
        }
    
    async def _process_ai_usage_analytics(
        self,
        filters: Optional[Dict[str, Any]],
        date_range: Optional[Dict[str, datetime]],
        aggregation_type: str
    ) -> Dict[str, Any]:
        """Аналитика по использованию AI"""
        
        return {
            "total_requests": 342,
            "successful_requests": 318,
            "failed_requests": 24,
            "success_rate": 93.0,
            "total_tokens": 1245678,
            "total_cost": 1847.32,
            "avg_tokens_per_request": 3642,
            "avg_cost_per_request": 5.40,
            "by_provider": {
                "openai": {
                    "requests": 198,
                    "tokens": 756432,
                    "cost": 1124.67,
                    "success_rate": 95.0
                },
                "anthropic": {
                    "requests": 98,
                    "tokens": 345221,
                    "cost": 487.23,
                    "success_rate": 91.0
                },
                "google": {
                    "requests": 46,
                    "tokens": 144025,
                    "cost": 235.42,
                    "success_rate": 87.0
                }
            },
            "cost_trends": [
                {"date": "2025-01-10", "cost": 67.34},
                {"date": "2025-01-11", "cost": 89.12},
                {"date": "2025-01-12", "cost": 156.78},
                {"date": "2025-01-13", "cost": 134.56},
                {"date": "2025-01-14", "cost": 98.45}
            ]
        }
    
    async def get_kp_analysis_analytics(
        self,
        period: str = "30d",
        aggregation: str = "day"
    ) -> Dict[str, Any]:
        """Специализированная аналитика для КП Анализатора"""
        
        return {
            "period": period,
            "aggregation": aggregation,
            "summary": {
                "total_analyses": 156,
                "success_rate": 91.0,
                "avg_confidence_score": 0.87,
                "avg_processing_time": 45.2,
                "total_cost": 1245.67
            },
            "trends": {
                "analyses_by_day": [
                    {"date": "2025-01-10", "count": 12, "success_rate": 92.0},
                    {"date": "2025-01-11", "count": 15, "success_rate": 87.0},
                    {"date": "2025-01-12", "count": 18, "success_rate": 94.0},
                    {"date": "2025-01-13", "count": 21, "success_rate": 91.0},
                    {"date": "2025-01-14", "count": 16, "success_rate": 89.0}
                ],
                "cost_by_day": [
                    {"date": "2025-01-10", "cost": 67.34},
                    {"date": "2025-01-11", "cost": 89.12},
                    {"date": "2025-01-12", "cost": 156.78},
                    {"date": "2025-01-13", "cost": 134.56},
                    {"date": "2025-01-14", "cost": 98.45}
                ]
            },
            "quality_metrics": {
                "avg_confidence": 0.87,
                "high_confidence_analyses": 123,  # > 0.8
                "medium_confidence_analyses": 28,  # 0.6-0.8
                "low_confidence_analyses": 5  # < 0.6
            },
            "performance_metrics": {
                "avg_processing_time": 45.2,
                "fastest_analysis": 12.3,
                "slowest_analysis": 156.7,
                "timeout_rate": 2.1
            }
        }
    
    async def export_analytics_data(
        self,
        data: Dict[str, Any],
        format: str = "json"
    ) -> Dict[str, Any]:
        """Экспорт аналитических данных"""
        
        export_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if format == "json":
            filename = f"analytics_export_{timestamp}.json"
            file_path = self.output_dir / filename
            
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            
        elif format == "csv":
            filename = f"analytics_export_{timestamp}.csv"
            file_path = self.output_dir / filename
            
            # Простая CSV версия
            with open(file_path, "w", encoding="utf-8") as f:
                f.write("metric,value\n")
                for key, value in data.items():
                    if isinstance(value, (int, float, str)):
                        f.write(f"{key},{value}\n")
        
        else:
            raise ValueError(f"Unsupported export format: {format}")
        
        return {
            "export_id": export_id,
            "file_path": str(file_path),
            "download_url": f"/download/{filename}",
            "record_count": len(data)
        }
    
    def _generate_cache_key(
        self,
        data_type: str,
        filters: Optional[Dict[str, Any]],
        date_range: Optional[Dict[str, datetime]],
        aggregation_type: str
    ) -> str:
        """Генерация ключа кеша"""
        
        key_data = {
            "data_type": data_type,
            "filters": filters or {},
            "date_range": {
                "start": date_range.get("start").isoformat() if date_range and date_range.get("start") else None,
                "end": date_range.get("end").isoformat() if date_range and date_range.get("end") else None
            } if date_range else None,
            "aggregation_type": aggregation_type
        }
        
        key_string = json.dumps(key_data, sort_keys=True)
        return f"analytics:{hashlib.md5(key_string.encode()).hexdigest()}"
    
    async def _get_from_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Получение данных из кеша"""
        
        if not self.redis_client:
            return None
        
        try:
            cached_data = await self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Error getting from cache: {str(e)}")
        
        return None
    
    async def _save_to_cache(self, cache_key: str, data: Dict[str, Any]):
        """Сохранение данных в кеш"""
        
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(data, default=str)
            )
        except Exception as e:
            logger.error(f"Error saving to cache: {str(e)}")
    
    async def clear_cache(self, cache_key: Optional[str] = None) -> bool:
        """Очистка кеша"""
        
        if not self.redis_client:
            return False
        
        try:
            if cache_key:
                # Очистка конкретного ключа
                result = await self.redis_client.delete(cache_key)
                return result > 0
            else:
                # Очистка всех ключей аналитики
                pattern = "analytics:*"
                keys = await self.redis_client.keys(pattern)
                if keys:
                    await self.redis_client.delete(*keys)
                return True
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return False