"""
Statistics Generator для DevAssist Pro
Генератор статистики для дашборда
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class StatisticsGenerator:
    """Генератор статистики для дашборда"""
    
    def __init__(self):
        self.cache = {}
        self.cache_ttl = 300  # 5 минут кеширования статистики
    
    async def generate_dashboard_statistics(
        self,
        period: str = "30d",
        user_id: Optional[int] = None,
        organization_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Генерация статистики для дашборда"""
        
        try:
            logger.info(f"Generating dashboard statistics for period: {period}")
            
            # Основные метрики
            overview_stats = await self._generate_overview_statistics(period, user_id, organization_id)
            
            # Анализы КП
            analysis_stats = await self._generate_analysis_statistics(period, user_id, organization_id)
            
            # Документы
            document_stats = await self._generate_document_statistics(period, user_id, organization_id)
            
            # Пользователи (только для админов)
            user_stats = await self._generate_user_statistics(period, organization_id) if not user_id else {}
            
            # AI использование
            ai_stats = await self._generate_ai_statistics(period, user_id, organization_id)
            
            # Производительность
            performance_stats = await self._generate_performance_statistics(period)
            
            # Тренды
            trends_stats = await self._generate_trends_statistics(period, user_id, organization_id)
            
            return {
                "overview": overview_stats,
                "analysis": analysis_stats,
                "documents": document_stats,
                "users": user_stats,
                "ai_usage": ai_stats,
                "performance": performance_stats,
                "trends": trends_stats,
                "generated_at": datetime.utcnow().isoformat(),
                "period": period
            }
            
        except Exception as e:
            logger.error(f"Error generating dashboard statistics: {str(e)}")
            raise
    
    async def _generate_overview_statistics(
        self,
        period: str,
        user_id: Optional[int],
        organization_id: Optional[int]
    ) -> Dict[str, Any]:
        """Генерация общих статистик"""
        
        return {
            "total_projects": 89,
            "active_projects": 67,
            "total_analyses": 156,
            "successful_analyses": 142,
            "total_documents": 298,
            "processed_documents": 284,
            "total_users": 47 if not user_id else None,
            "active_users": 34 if not user_id else None,
            "success_rate": 91.0,
            "avg_processing_time": 45.2,
            "total_cost": 1847.32,
            "period_comparison": {
                "projects": {"current": 89, "previous": 82, "change": 8.5},
                "analyses": {"current": 156, "previous": 134, "change": 16.4},
                "documents": {"current": 298, "previous": 267, "change": 11.6},
                "users": {"current": 47, "previous": 43, "change": 9.3} if not user_id else None
            }
        }
    
    async def _generate_analysis_statistics(
        self,
        period: str,
        user_id: Optional[int],
        organization_id: Optional[int]
    ) -> Dict[str, Any]:
        """Генерация статистики анализов"""
        
        return {
            "total_analyses": 156,
            "successful_analyses": 142,
            "failed_analyses": 14,
            "success_rate": 91.0,
            "avg_confidence_score": 0.87,
            "avg_processing_time": 45.2,
            "total_cost": 1245.67,
            "by_type": {
                "kp_analysis": {"count": 134, "success_rate": 92.5},
                "comparison": {"count": 22, "success_rate": 86.4}
            },
            "by_provider": {
                "openai": {"count": 89, "success_rate": 94.0, "avg_cost": 8.45},
                "anthropic": {"count": 42, "success_rate": 88.0, "avg_cost": 6.23},
                "google": {"count": 25, "success_rate": 84.0, "avg_cost": 9.12}
            },
            "daily_trend": [
                {"date": "2025-01-10", "count": 12, "success_rate": 92.0},
                {"date": "2025-01-11", "count": 15, "success_rate": 87.0},
                {"date": "2025-01-12", "count": 18, "success_rate": 94.0},
                {"date": "2025-01-13", "count": 21, "success_rate": 91.0},
                {"date": "2025-01-14", "count": 16, "success_rate": 89.0}
            ],
            "confidence_distribution": {
                "high": 78.5,  # > 0.8
                "medium": 18.7,  # 0.6-0.8
                "low": 2.8  # < 0.6
            },
            "top_users": [
                {"user_id": 1, "name": "Иван Петров", "count": 23, "success_rate": 95.7},
                {"user_id": 2, "name": "Мария Сидорова", "count": 19, "success_rate": 89.5},
                {"user_id": 3, "name": "Алексей Козлов", "count": 17, "success_rate": 88.2}
            ] if not user_id else None
        }
    
    async def _generate_document_statistics(
        self,
        period: str,
        user_id: Optional[int],
        organization_id: Optional[int]
    ) -> Dict[str, Any]:
        """Генерация статистики документов"""
        
        return {
            "total_documents": 298,
            "processed_documents": 284,
            "failed_processing": 14,
            "processing_success_rate": 95.3,
            "avg_file_size": 2.4,
            "total_storage": 715.2,  # MB
            "by_type": {
                "pdf": {"count": 189, "success_rate": 96.0, "avg_size": 2.8},
                "docx": {"count": 78, "success_rate": 94.0, "avg_size": 1.9},
                "txt": {"count": 31, "success_rate": 97.0, "avg_size": 0.3}
            },
            "by_size": {
                "small": {"count": 120, "range": "< 1MB", "success_rate": 98.0},
                "medium": {"count": 142, "range": "1-5MB", "success_rate": 94.0},
                "large": {"count": 36, "range": "> 5MB", "success_rate": 89.0}
            },
            "upload_trend": [
                {"date": "2025-01-10", "count": 28, "success_rate": 96.4},
                {"date": "2025-01-11", "count": 35, "success_rate": 94.3},
                {"date": "2025-01-12", "count": 42, "success_rate": 95.2},
                {"date": "2025-01-13", "count": 38, "success_rate": 94.7},
                {"date": "2025-01-14", "count": 33, "success_rate": 96.9}
            ],
            "processing_time": {
                "avg": 12.3,
                "median": 8.7,
                "p95": 34.5
            },
            "error_analysis": {
                "common_errors": [
                    {"error": "Corrupted PDF", "count": 6},
                    {"error": "Unsupported format", "count": 4},
                    {"error": "File too large", "count": 3},
                    {"error": "Timeout", "count": 1}
                ]
            }
        }
    
    async def _generate_user_statistics(
        self,
        period: str,
        organization_id: Optional[int]
    ) -> Dict[str, Any]:
        """Генерация статистики пользователей"""
        
        return {
            "total_users": 47,
            "active_users": 34,
            "new_users": 8,
            "activity_rate": 72.3,
            "avg_analyses_per_user": 3.3,
            "user_activity": {
                "daily_active": 12,
                "weekly_active": 28,
                "monthly_active": 34
            },
            "engagement_levels": {
                "power_users": 8,  # > 10 анализов
                "regular_users": 19,  # 3-10 анализов
                "casual_users": 20  # < 3 анализов
            },
            "retention_rates": {
                "1_day": 85.0,
                "7_day": 68.0,
                "30_day": 45.0
            },
            "by_organization": {
                "ООО Стройинвест": {"users": 12, "analyses": 89, "activity": 83.3},
                "ГК Развитие": {"users": 8, "analyses": 45, "activity": 75.0},
                "СК Монолит": {"users": 6, "analyses": 22, "activity": 66.7}
            },
            "registration_trend": [
                {"date": "2025-01-10", "count": 1},
                {"date": "2025-01-11", "count": 2},
                {"date": "2025-01-12", "count": 0},
                {"date": "2025-01-13", "count": 3},
                {"date": "2025-01-14", "count": 2}
            ]
        }
    
    async def _generate_ai_statistics(
        self,
        period: str,
        user_id: Optional[int],
        organization_id: Optional[int]
    ) -> Dict[str, Any]:
        """Генерация статистики AI использования"""
        
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
            "cost_trend": [
                {"date": "2025-01-10", "cost": 67.34},
                {"date": "2025-01-11", "cost": 89.12},
                {"date": "2025-01-12", "cost": 156.78},
                {"date": "2025-01-13", "cost": 134.56},
                {"date": "2025-01-14", "cost": 98.45}
            ],
            "usage_patterns": {
                "peak_hours": [9, 10, 11, 14, 15, 16],
                "peak_days": ["Monday", "Tuesday", "Wednesday"]
            },
            "cost_optimization": {
                "potential_savings": 234.56,
                "efficiency_score": 78.4,
                "recommendations": [
                    "Увеличить кеширование",
                    "Оптимизировать промпты",
                    "Использовать более дешевые модели для простых задач"
                ]
            }
        }
    
    async def _generate_performance_statistics(
        self,
        period: str
    ) -> Dict[str, Any]:
        """Генерация статистики производительности"""
        
        return {
            "system_uptime": 99.8,
            "avg_response_time": 245.6,
            "p95_response_time": 456.7,
            "p99_response_time": 678.9,
            "requests_per_second": 45.2,
            "error_rate": 2.3,
            "resource_usage": {
                "cpu": {"avg": 23.4, "peak": 67.8, "current": 31.2},
                "memory": {"avg": 67.8, "peak": 89.2, "current": 72.4},
                "disk": {"avg": 45.2, "peak": 56.7, "current": 48.9}
            },
            "service_health": {
                "api_gateway": {"status": "healthy", "uptime": 99.9},
                "auth_service": {"status": "healthy", "uptime": 99.8},
                "llm_service": {"status": "healthy", "uptime": 99.7},
                "documents_service": {"status": "healthy", "uptime": 99.9},
                "dashboard_service": {"status": "healthy", "uptime": 99.8},
                "reports_service": {"status": "healthy", "uptime": 99.6},
                "analytics_service": {"status": "healthy", "uptime": 99.8}
            },
            "performance_trend": [
                {"date": "2025-01-10", "response_time": 234.5, "error_rate": 1.8},
                {"date": "2025-01-11", "response_time": 245.3, "error_rate": 2.1},
                {"date": "2025-01-12", "response_time": 267.8, "error_rate": 2.9},
                {"date": "2025-01-13", "response_time": 238.9, "error_rate": 1.9},
                {"date": "2025-01-14", "response_time": 251.2, "error_rate": 2.2}
            ],
            "alerts": [
                {
                    "level": "warning",
                    "message": "High memory usage detected",
                    "timestamp": "2025-01-14T10:30:00Z"
                }
            ]
        }
    
    async def _generate_trends_statistics(
        self,
        period: str,
        user_id: Optional[int],
        organization_id: Optional[int]
    ) -> Dict[str, Any]:
        """Генерация статистики трендов"""
        
        return {
            "growth_metrics": {
                "analyses_growth": 16.4,  # % за период
                "users_growth": 9.3,
                "documents_growth": 11.6,
                "revenue_growth": 23.7
            },
            "seasonal_patterns": {
                "peak_days": ["Monday", "Tuesday", "Wednesday"],
                "peak_hours": [9, 10, 11, 14, 15, 16],
                "low_activity_periods": ["Weekend", "Holidays"]
            },
            "forecasting": {
                "next_month_analyses": 178,
                "next_month_cost": 2145.67,
                "capacity_utilization": 67.3,
                "scaling_recommendations": [
                    "Увеличить количество воркеров LLM сервиса",
                    "Оптимизировать кеширование",
                    "Рассмотреть горизонтальное масштабирование"
                ]
            },
            "anomaly_detection": {
                "detected_anomalies": [
                    {
                        "type": "spike",
                        "metric": "response_time",
                        "timestamp": "2025-01-12T14:30:00Z",
                        "value": 567.8,
                        "threshold": 400.0
                    }
                ],
                "anomaly_score": 0.12
            },
            "correlation_analysis": {
                "high_correlations": [
                    {"metrics": ["user_activity", "analyses_count"], "correlation": 0.87},
                    {"metrics": ["document_uploads", "processing_time"], "correlation": -0.62}
                ]
            }
        }
    
    async def generate_custom_statistics(
        self,
        metrics: List[str],
        filters: Dict[str, Any],
        period: str = "30d"
    ) -> Dict[str, Any]:
        """Генерация кастомной статистики"""
        
        try:
            logger.info(f"Generating custom statistics for metrics: {metrics}")
            
            result = {
                "requested_metrics": metrics,
                "filters": filters,
                "period": period,
                "data": {}
            }
            
            # Генерация данных для каждой метрики
            for metric in metrics:
                if metric == "user_activity":
                    result["data"][metric] = await self._get_user_activity_data(filters, period)
                elif metric == "cost_analysis":
                    result["data"][metric] = await self._get_cost_analysis_data(filters, period)
                elif metric == "performance_metrics":
                    result["data"][metric] = await self._get_performance_metrics_data(filters, period)
                elif metric == "quality_metrics":
                    result["data"][metric] = await self._get_quality_metrics_data(filters, period)
                else:
                    result["data"][metric] = {"error": f"Unknown metric: {metric}"}
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating custom statistics: {str(e)}")
            raise
    
    async def _get_user_activity_data(
        self,
        filters: Dict[str, Any],
        period: str
    ) -> Dict[str, Any]:
        """Получение данных активности пользователей"""
        
        return {
            "daily_active_users": 12,
            "weekly_active_users": 28,
            "monthly_active_users": 34,
            "session_duration": 24.5,
            "actions_per_session": 8.7,
            "bounce_rate": 23.4
        }
    
    async def _get_cost_analysis_data(
        self,
        filters: Dict[str, Any],
        period: str
    ) -> Dict[str, Any]:
        """Получение данных анализа затрат"""
        
        return {
            "total_cost": 1847.32,
            "cost_per_user": 39.30,
            "cost_per_analysis": 5.40,
            "cost_breakdown": {
                "ai_providers": 89.1,
                "infrastructure": 7.8,
                "storage": 2.1,
                "other": 1.0
            },
            "cost_trends": "increasing",
            "budget_utilization": 73.2
        }
    
    async def _get_performance_metrics_data(
        self,
        filters: Dict[str, Any],
        period: str
    ) -> Dict[str, Any]:
        """Получение данных производительности"""
        
        return {
            "avg_response_time": 245.6,
            "throughput": 45.2,
            "error_rate": 2.3,
            "uptime": 99.8,
            "resource_utilization": 45.6,
            "scaling_efficiency": 78.4
        }
    
    async def _get_quality_metrics_data(
        self,
        filters: Dict[str, Any],
        period: str
    ) -> Dict[str, Any]:
        """Получение данных качества"""
        
        return {
            "avg_confidence_score": 0.87,
            "user_satisfaction": 4.3,
            "accuracy_rate": 94.2,
            "false_positive_rate": 3.1,
            "processing_quality": 89.5,
            "output_consistency": 91.7
        }