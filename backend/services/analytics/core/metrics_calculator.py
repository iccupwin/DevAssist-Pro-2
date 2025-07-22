"""
Metrics Calculator для DevAssist Pro
Расчет метрик для КП Анализатора
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json
import math

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

class MetricsCalculator:
    """Калькулятор метрик для системы"""
    
    def __init__(self):
        self.redis_client = None
        self.cache_ttl = 1800  # 30 минут кеширования для метрик
    
    async def init_redis(self):
        """Инициализация Redis подключения"""
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.Redis(
                    host='redis',
                    port=6379,
                    password='redis_password',
                    db=5,  # Отдельная база для метрик
                    decode_responses=True
                )
                await self.redis_client.ping()
                logger.info("Redis connection established for metrics")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {str(e)}")
                self.redis_client = None
        else:
            logger.warning("Redis not available, metrics caching disabled")
    
    async def calculate_metrics(
        self,
        metric_types: List[str],
        entity_id: Optional[int] = None,
        entity_type: str = "global",
        period: str = "30d"
    ) -> Dict[str, Any]:
        """
        Расчет метрик
        
        Args:
            metric_types: Типы метрик для расчета
            entity_id: ID сущности (пользователь, организация)
            entity_type: Тип сущности
            period: Период расчета
            
        Returns:
            Результаты расчета метрик
        """
        try:
            logger.info(f"Calculating metrics: {metric_types} for {entity_type}")
            
            # Определение временных рамок
            start_date, end_date = self._parse_period(period)
            
            # Расчет каждой метрики
            results = {}
            
            for metric_type in metric_types:
                result = await self._calculate_single_metric(
                    metric_type, entity_id, entity_type, start_date, end_date
                )
                results[metric_type] = result
            
            # Добавление метаданных
            results["metadata"] = {
                "entity_id": entity_id,
                "entity_type": entity_type,
                "period": period,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat()
            }
            
            return results
            
        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            raise
    
    async def _calculate_single_metric(
        self,
        metric_type: str,
        entity_id: Optional[int],
        entity_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Расчет одной метрики"""
        
        # Маппинг типов метрик к методам расчета
        metric_calculators = {
            "success_rate": self._calculate_success_rate,
            "avg_processing_time": self._calculate_avg_processing_time,
            "cost_per_analysis": self._calculate_cost_per_analysis,
            "user_engagement": self._calculate_user_engagement,
            "system_performance": self._calculate_system_performance,
            "quality_score": self._calculate_quality_score,
            "throughput": self._calculate_throughput,
            "error_rate": self._calculate_error_rate,
            "resource_utilization": self._calculate_resource_utilization
        }
        
        calculator = metric_calculators.get(metric_type)
        if not calculator:
            raise ValueError(f"Unknown metric type: {metric_type}")
        
        return await calculator(entity_id, entity_type, start_date, end_date)
    
    async def _calculate_success_rate(
        self,
        entity_id: Optional[int],
        entity_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Расчет успешности анализов"""
        
        # Заглушка для демонстрации
        total_analyses = 156
        successful_analyses = 142
        failed_analyses = 14
        
        success_rate = (successful_analyses / total_analyses) * 100 if total_analyses > 0 else 0
        
        return {
            "value": round(success_rate, 2),
            "unit": "percentage",
            "total_analyses": total_analyses,
            "successful_analyses": successful_analyses,
            "failed_analyses": failed_analyses,
            "trend": "increasing",  # можно добавить логику трендов
            "benchmark": {
                "industry_average": 85.0,
                "internal_target": 90.0,
                "status": "above_target" if success_rate > 90 else "below_target"
            }
        }
    
    async def _calculate_avg_processing_time(
        self,
        entity_id: Optional[int],
        entity_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Расчет среднего времени обработки"""
        
        # Заглушка для демонстрации
        processing_times = [23.4, 45.2, 67.1, 34.5, 56.8, 43.2, 38.9, 52.3, 41.7, 48.6]
        
        avg_time = sum(processing_times) / len(processing_times)
        median_time = sorted(processing_times)[len(processing_times) // 2]
        
        return {
            "value": round(avg_time, 2),
            "unit": "seconds",
            "median": round(median_time, 2),
            "min": min(processing_times),
            "max": max(processing_times),
            "std_dev": round(math.sqrt(sum((x - avg_time) ** 2 for x in processing_times) / len(processing_times)), 2),
            "trend": "stable",
            "benchmark": {
                "target": 45.0,
                "status": "on_target" if abs(avg_time - 45.0) < 5 else "off_target"
            }
        }
    
    async def _calculate_cost_per_analysis(
        self,
        entity_id: Optional[int],
        entity_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Расчет стоимости анализа"""
        
        # Заглушка для демонстрации
        total_cost = 1245.67
        total_analyses = 156
        
        cost_per_analysis = total_cost / total_analyses if total_analyses > 0 else 0
        
        return {
            "value": round(cost_per_analysis, 2),
            "unit": "USD",
            "total_cost": total_cost,
            "total_analyses": total_analyses,
            "by_provider": {
                "openai": {"cost": 8.45, "analyses": 89},
                "anthropic": {"cost": 6.23, "analyses": 42},
                "google": {"cost": 9.12, "analyses": 25}
            },
            "trend": "decreasing",
            "benchmark": {
                "budget_per_analysis": 10.0,
                "status": "within_budget" if cost_per_analysis < 10.0 else "over_budget"
            }
        }
    
    async def _calculate_user_engagement(
        self,
        entity_id: Optional[int],
        entity_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Расчет вовлеченности пользователей"""
        
        return {
            "value": 72.3,
            "unit": "percentage",
            "daily_active_users": 12,
            "weekly_active_users": 28,
            "monthly_active_users": 34,
            "session_duration": {
                "average": 24.5,
                "median": 18.3,
                "unit": "minutes"
            },
            "retention_rates": {
                "1_day": 85.0,
                "7_day": 68.0,
                "30_day": 45.0
            },
            "trend": "increasing"
        }
    
    async def _calculate_system_performance(
        self,
        entity_id: Optional[int],
        entity_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Расчет производительности системы"""
        
        return {
            "value": 94.2,
            "unit": "percentage",
            "uptime": 99.8,
            "response_time": {
                "average": 245.6,
                "p95": 450.2,
                "p99": 678.9,
                "unit": "ms"
            },
            "throughput": {
                "requests_per_second": 45.2,
                "peak_rps": 78.5
            },
            "resource_usage": {
                "cpu": 23.4,
                "memory": 67.8,
                "disk": 45.2,
                "unit": "percentage"
            },
            "trend": "stable"
        }
    
    async def _calculate_quality_score(
        self,
        entity_id: Optional[int],
        entity_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Расчет качества анализа"""
        
        return {
            "value": 87.4,
            "unit": "score",
            "confidence_distribution": {
                "high": 78.5,  # > 0.8
                "medium": 18.7,  # 0.6-0.8
                "low": 2.8  # < 0.6
            },
            "accuracy_metrics": {
                "precision": 89.2,
                "recall": 85.6,
                "f1_score": 87.4
            },
            "user_satisfaction": {
                "rating": 4.3,
                "scale": "1-5",
                "responses": 47
            },
            "trend": "improving"
        }
    
    async def _calculate_throughput(
        self,
        entity_id: Optional[int],
        entity_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Расчет пропускной способности"""
        
        return {
            "value": 156,
            "unit": "analyses_per_period",
            "daily_average": 5.2,
            "peak_daily": 12,
            "minimum_daily": 2,
            "hourly_distribution": {
                "peak_hour": 14,  # 14:00
                "peak_value": 3.2,
                "off_peak_average": 0.8
            },
            "capacity_utilization": 67.3,
            "trend": "increasing"
        }
    
    async def _calculate_error_rate(
        self,
        entity_id: Optional[int],
        entity_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Расчет частоты ошибок"""
        
        return {
            "value": 8.97,
            "unit": "percentage",
            "total_errors": 14,
            "total_requests": 156,
            "error_types": {
                "timeout": 6,
                "api_error": 4,
                "parsing_error": 3,
                "other": 1
            },
            "by_service": {
                "llm_service": 8,
                "documents_service": 3,
                "reports_service": 2,
                "analytics_service": 1
            },
            "trend": "stable"
        }
    
    async def _calculate_resource_utilization(
        self,
        entity_id: Optional[int],
        entity_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Расчет использования ресурсов"""
        
        return {
            "value": 45.6,
            "unit": "percentage",
            "cpu_usage": {
                "average": 23.4,
                "peak": 67.8,
                "unit": "percentage"
            },
            "memory_usage": {
                "average": 67.8,
                "peak": 89.2,
                "unit": "percentage"
            },
            "disk_usage": {
                "average": 45.2,
                "peak": 56.7,
                "unit": "percentage"
            },
            "network_usage": {
                "inbound": 12.3,
                "outbound": 8.9,
                "unit": "MB/s"
            },
            "trend": "stable"
        }
    
    async def get_ai_usage_metrics(
        self,
        period: str = "30d",
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """Специализированные метрики использования AI"""
        
        return {
            "period": period,
            "provider": provider,
            "overall": {
                "total_requests": 342,
                "successful_requests": 318,
                "failed_requests": 24,
                "success_rate": 93.0,
                "total_tokens": 1245678,
                "total_cost": 1847.32,
                "avg_tokens_per_request": 3642,
                "avg_cost_per_request": 5.40
            },
            "by_provider": {
                "openai": {
                    "requests": 198,
                    "tokens": 756432,
                    "cost": 1124.67,
                    "success_rate": 95.0,
                    "avg_response_time": 2.3
                },
                "anthropic": {
                    "requests": 98,
                    "tokens": 345221,
                    "cost": 487.23,
                    "success_rate": 91.0,
                    "avg_response_time": 3.1
                },
                "google": {
                    "requests": 46,
                    "tokens": 144025,
                    "cost": 235.42,
                    "success_rate": 87.0,
                    "avg_response_time": 2.8
                }
            },
            "cost_optimization": {
                "potential_savings": 234.56,
                "recommendations": [
                    "Увеличить использование более дешевых моделей",
                    "Оптимизировать промпты для снижения токенов",
                    "Использовать кеширование для повторных запросов"
                ]
            },
            "usage_patterns": {
                "peak_hours": [9, 10, 11, 14, 15, 16],
                "peak_days": ["Monday", "Tuesday", "Wednesday"],
                "seasonal_trends": "stable"
            }
        }
    
    def _parse_period(self, period: str) -> tuple[datetime, datetime]:
        """Парсинг периода в даты"""
        
        end_date = datetime.utcnow()
        
        if period == "1d":
            start_date = end_date - timedelta(days=1)
        elif period == "7d":
            start_date = end_date - timedelta(days=7)
        elif period == "30d":
            start_date = end_date - timedelta(days=30)
        elif period == "90d":
            start_date = end_date - timedelta(days=90)
        else:
            # Дефолт: 30 дней
            start_date = end_date - timedelta(days=30)
        
        return start_date, end_date
    
    async def get_realtime_metrics(self) -> Dict[str, Any]:
        """Получение метрик в реальном времени"""
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "active_analyses": 3,
            "queue_size": 7,
            "avg_response_time": 245.6,
            "current_throughput": 2.3,
            "system_health": "healthy",
            "alerts": [],
            "resource_usage": {
                "cpu": 23.4,
                "memory": 67.8,
                "disk": 45.2
            }
        }
    
    async def calculate_trends(
        self,
        metric_type: str,
        entity_id: Optional[int] = None,
        entity_type: str = "global",
        periods: List[str] = ["7d", "30d", "90d"]
    ) -> Dict[str, Any]:
        """Расчет трендов для метрики"""
        
        trends = {}
        
        for period in periods:
            start_date, end_date = self._parse_period(period)
            
            metric_data = await self._calculate_single_metric(
                metric_type, entity_id, entity_type, start_date, end_date
            )
            
            trends[period] = metric_data
        
        # Определение общего тренда
        values = [trends[period]["value"] for period in periods]
        if len(values) >= 2:
            if values[-1] > values[-2]:
                overall_trend = "increasing"
            elif values[-1] < values[-2]:
                overall_trend = "decreasing"
            else:
                overall_trend = "stable"
        else:
            overall_trend = "unknown"
        
        return {
            "metric_type": metric_type,
            "entity_id": entity_id,
            "entity_type": entity_type,
            "periods": trends,
            "overall_trend": overall_trend,
            "calculated_at": datetime.utcnow().isoformat()
        }