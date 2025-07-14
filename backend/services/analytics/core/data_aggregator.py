"""
Data Aggregator для DevAssist Pro
Агрегация данных для аналитики
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)

class DataAggregator:
    """Агрегатор данных для аналитики"""
    
    def __init__(self):
        self.aggregation_functions = {
            "sum": sum,
            "avg": lambda x: sum(x) / len(x) if x else 0,
            "count": len,
            "max": max,
            "min": min,
            "median": lambda x: sorted(x)[len(x) // 2] if x else 0
        }
    
    async def aggregate_user_data(
        self,
        period: str = "30d",
        aggregation: str = "day"
    ) -> Dict[str, Any]:
        """Агрегация данных пользователей"""
        
        # Заглушка для демонстрации
        return {
            "total_users": 47,
            "active_users": 34,
            "new_users": 8,
            "user_activity": {
                "daily_active": [
                    {"date": "2025-01-10", "count": 12},
                    {"date": "2025-01-11", "count": 15},
                    {"date": "2025-01-12", "count": 18},
                    {"date": "2025-01-13", "count": 16},
                    {"date": "2025-01-14", "count": 14}
                ],
                "registrations": [
                    {"date": "2025-01-10", "count": 1},
                    {"date": "2025-01-11", "count": 2},
                    {"date": "2025-01-12", "count": 0},
                    {"date": "2025-01-13", "count": 3},
                    {"date": "2025-01-14", "count": 2}
                ]
            },
            "user_segments": {
                "power_users": 8,  # > 10 анализов
                "regular_users": 19,  # 3-10 анализов
                "casual_users": 20  # < 3 анализов
            },
            "engagement_levels": {
                "high": 12,  # ежедневная активность
                "medium": 16,  # еженедельная активность
                "low": 6  # месячная активность
            }
        }
    
    async def aggregate_analysis_data(
        self,
        period: str = "30d",
        aggregation: str = "day",
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Агрегация данных анализов"""
        
        return {
            "total_analyses": 156,
            "successful_analyses": 142,
            "failed_analyses": 14,
            "analysis_trends": {
                "by_day": [
                    {"date": "2025-01-10", "total": 12, "success": 11, "failed": 1},
                    {"date": "2025-01-11", "total": 15, "success": 13, "failed": 2},
                    {"date": "2025-01-12", "total": 18, "success": 17, "failed": 1},
                    {"date": "2025-01-13", "total": 21, "success": 19, "failed": 2},
                    {"date": "2025-01-14", "total": 16, "success": 14, "failed": 2}
                ],
                "by_hour": [
                    {"hour": 9, "count": 8},
                    {"hour": 10, "count": 12},
                    {"hour": 11, "count": 15},
                    {"hour": 14, "count": 18},
                    {"hour": 15, "count": 21},
                    {"hour": 16, "count": 16}
                ]
            },
            "analysis_types": {
                "kp_analysis": 134,
                "comparison": 22
            },
            "processing_times": {
                "avg": 45.2,
                "median": 38.5,
                "p95": 78.9,
                "p99": 125.3
            },
            "confidence_scores": {
                "avg": 0.87,
                "distribution": {
                    "high": 78.5,
                    "medium": 18.7,
                    "low": 2.8
                }
            }
        }
    
    async def aggregate_document_data(
        self,
        period: str = "30d",
        aggregation: str = "day",
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Агрегация данных документов"""
        
        return {
            "total_documents": 298,
            "processed_documents": 284,
            "failed_processing": 14,
            "document_trends": {
                "uploads_by_day": [
                    {"date": "2025-01-10", "count": 28},
                    {"date": "2025-01-11", "count": 35},
                    {"date": "2025-01-12", "count": 42},
                    {"date": "2025-01-13", "count": 38},
                    {"date": "2025-01-14", "count": 33}
                ],
                "processing_by_day": [
                    {"date": "2025-01-10", "processed": 27, "failed": 1},
                    {"date": "2025-01-11", "processed": 33, "failed": 2},
                    {"date": "2025-01-12", "processed": 40, "failed": 2},
                    {"date": "2025-01-13", "processed": 36, "failed": 2},
                    {"date": "2025-01-14", "processed": 31, "failed": 2}
                ]
            },
            "document_types": {
                "pdf": {"count": 189, "success_rate": 96.0},
                "docx": {"count": 78, "success_rate": 94.0},
                "txt": {"count": 31, "success_rate": 97.0}
            },
            "file_sizes": {
                "avg_mb": 2.4,
                "distribution": {
                    "small": 120,  # < 1MB
                    "medium": 142,  # 1-5MB
                    "large": 36  # > 5MB
                }
            },
            "processing_performance": {
                "avg_time": 12.3,
                "success_rate": 95.3,
                "error_rate": 4.7
            }
        }
    
    async def aggregate_cost_data(
        self,
        period: str = "30d",
        aggregation: str = "day",
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Агрегация данных затрат"""
        
        return {
            "total_cost": 1847.32,
            "avg_cost_per_analysis": 5.40,
            "cost_trends": {
                "by_day": [
                    {"date": "2025-01-10", "cost": 67.34},
                    {"date": "2025-01-11", "cost": 89.12},
                    {"date": "2025-01-12", "cost": 156.78},
                    {"date": "2025-01-13", "cost": 134.56},
                    {"date": "2025-01-14", "cost": 98.45}
                ],
                "monthly_projection": 2245.67
            },
            "cost_breakdown": {
                "by_provider": {
                    "openai": {"cost": 1124.67, "percentage": 60.9},
                    "anthropic": {"cost": 487.23, "percentage": 26.4},
                    "google": {"cost": 235.42, "percentage": 12.7}
                },
                "by_service": {
                    "llm_service": {"cost": 1645.23, "percentage": 89.1},
                    "documents_service": {"cost": 156.78, "percentage": 8.5},
                    "reports_service": {"cost": 45.31, "percentage": 2.4}
                }
            },
            "cost_optimization": {
                "potential_savings": 234.56,
                "efficiency_score": 78.4
            }
        }
    
    async def aggregate_performance_data(
        self,
        period: str = "30d",
        aggregation: str = "day",
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Агрегация данных производительности"""
        
        return {
            "system_uptime": 99.8,
            "avg_response_time": 245.6,
            "throughput": 45.2,
            "performance_trends": {
                "response_time_by_day": [
                    {"date": "2025-01-10", "avg": 234.5, "p95": 456.7},
                    {"date": "2025-01-11", "avg": 245.3, "p95": 478.9},
                    {"date": "2025-01-12", "avg": 267.8, "p95": 523.4},
                    {"date": "2025-01-13", "avg": 238.9, "p95": 445.6},
                    {"date": "2025-01-14", "avg": 251.2, "p95": 467.8}
                ],
                "throughput_by_hour": [
                    {"hour": 9, "rps": 12.3},
                    {"hour": 10, "rps": 18.7},
                    {"hour": 11, "rps": 25.4},
                    {"hour": 14, "rps": 34.8},
                    {"hour": 15, "rps": 42.1},
                    {"hour": 16, "rps": 38.9}
                ]
            },
            "resource_usage": {
                "cpu": {"avg": 23.4, "peak": 67.8},
                "memory": {"avg": 67.8, "peak": 89.2},
                "disk": {"avg": 45.2, "peak": 56.7}
            },
            "error_rates": {
                "overall": 2.3,
                "by_service": {
                    "api_gateway": 1.2,
                    "llm_service": 3.1,
                    "documents_service": 1.8,
                    "reports_service": 0.9
                }
            }
        }
    
    async def aggregate_by_time_period(
        self,
        data: List[Dict[str, Any]],
        time_field: str,
        aggregation: str = "day",
        value_field: str = "value",
        aggregation_func: str = "sum"
    ) -> List[Dict[str, Any]]:
        """Универсальная агрегация по временным периодам"""
        
        # Группировка данных по временным периодам
        grouped_data = defaultdict(list)
        
        for item in data:
            timestamp = item.get(time_field)
            if not timestamp:
                continue
            
            # Определение периода группировки
            if aggregation == "hour":
                period_key = timestamp.strftime("%Y-%m-%d %H:00")
            elif aggregation == "day":
                period_key = timestamp.strftime("%Y-%m-%d")
            elif aggregation == "week":
                period_key = timestamp.strftime("%Y-W%W")
            elif aggregation == "month":
                period_key = timestamp.strftime("%Y-%m")
            else:
                period_key = timestamp.strftime("%Y-%m-%d")
            
            grouped_data[period_key].append(item.get(value_field, 0))
        
        # Применение функции агрегации
        func = self.aggregation_functions.get(aggregation_func, sum)
        
        result = []
        for period, values in grouped_data.items():
            result.append({
                "period": period,
                "value": func(values),
                "count": len(values)
            })
        
        return sorted(result, key=lambda x: x["period"])
    
    async def aggregate_by_category(
        self,
        data: List[Dict[str, Any]],
        category_field: str,
        value_field: str = "value",
        aggregation_func: str = "sum"
    ) -> Dict[str, Any]:
        """Агрегация по категориям"""
        
        grouped_data = defaultdict(list)
        
        for item in data:
            category = item.get(category_field)
            if category:
                grouped_data[category].append(item.get(value_field, 0))
        
        func = self.aggregation_functions.get(aggregation_func, sum)
        
        result = {}
        for category, values in grouped_data.items():
            result[category] = {
                "value": func(values),
                "count": len(values)
            }
        
        return result
    
    async def calculate_percentiles(
        self,
        data: List[float],
        percentiles: List[int] = [50, 90, 95, 99]
    ) -> Dict[str, float]:
        """Расчет перцентилей"""
        
        if not data:
            return {f"p{p}": 0.0 for p in percentiles}
        
        sorted_data = sorted(data)
        result = {}
        
        for p in percentiles:
            index = int((p / 100) * len(sorted_data))
            if index >= len(sorted_data):
                index = len(sorted_data) - 1
            result[f"p{p}"] = sorted_data[index]
        
        return result
    
    async def calculate_moving_average(
        self,
        data: List[Dict[str, Any]],
        window_size: int = 7,
        value_field: str = "value"
    ) -> List[Dict[str, Any]]:
        """Расчет скользящего среднего"""
        
        if len(data) < window_size:
            return data
        
        result = []
        
        for i in range(window_size - 1, len(data)):
            window_data = data[i - window_size + 1:i + 1]
            values = [item.get(value_field, 0) for item in window_data]
            avg_value = sum(values) / len(values)
            
            result.append({
                **data[i],
                "moving_average": avg_value
            })
        
        return result
    
    async def detect_anomalies(
        self,
        data: List[float],
        threshold: float = 2.0
    ) -> Dict[str, Any]:
        """Обнаружение аномалий в данных"""
        
        if len(data) < 2:
            return {"anomalies": [], "threshold": threshold}
        
        # Расчет статистик
        mean = sum(data) / len(data)
        variance = sum((x - mean) ** 2 for x in data) / (len(data) - 1)
        std_dev = variance ** 0.5
        
        # Поиск аномалий
        anomalies = []
        for i, value in enumerate(data):
            z_score = abs(value - mean) / std_dev if std_dev > 0 else 0
            if z_score > threshold:
                anomalies.append({
                    "index": i,
                    "value": value,
                    "z_score": z_score,
                    "type": "high" if value > mean else "low"
                })
        
        return {
            "anomalies": anomalies,
            "threshold": threshold,
            "statistics": {
                "mean": mean,
                "std_dev": std_dev,
                "total_points": len(data),
                "anomaly_count": len(anomalies)
            }
        }
    
    async def generate_summary_statistics(
        self,
        data: List[float]
    ) -> Dict[str, Any]:
        """Генерация сводной статистики"""
        
        if not data:
            return {
                "count": 0,
                "sum": 0,
                "mean": 0,
                "median": 0,
                "min": 0,
                "max": 0,
                "std_dev": 0
            }
        
        sorted_data = sorted(data)
        count = len(data)
        sum_val = sum(data)
        mean = sum_val / count
        median = sorted_data[count // 2]
        min_val = min(data)
        max_val = max(data)
        
        # Стандартное отклонение
        variance = sum((x - mean) ** 2 for x in data) / (count - 1) if count > 1 else 0
        std_dev = variance ** 0.5
        
        return {
            "count": count,
            "sum": sum_val,
            "mean": mean,
            "median": median,
            "min": min_val,
            "max": max_val,
            "std_dev": std_dev,
            "percentiles": await self.calculate_percentiles(data)
        }