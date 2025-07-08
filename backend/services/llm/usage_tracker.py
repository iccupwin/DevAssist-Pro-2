"""
Отслеживание использования и затрат AI для LLM Service DevAssist Pro
Согласно ТЗ Этап 4: Cost tracking и AI usage мониторинг
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
import aioredis
import json

from ..shared.llm_models import (
    AIRequest as AIRequestModel, UsageStatistics, AIModel, 
    ProviderStatus, AIConfiguration
)
from ..shared.llm_schemas import AIProvider, TaskType
from .config import settings

logger = logging.getLogger(__name__)

class UsageTracker:
    """Трекер использования AI согласно ТЗ"""
    
    def __init__(self):
        self.redis_client: Optional[aioredis.Redis] = None
        self.daily_limits = {}
        self.monthly_limits = {}
    
    async def init_redis(self):
        """Инициализация Redis для real-time трекинга"""
        try:
            self.redis_client = aioredis.from_url(settings.REDIS_URL)
            await self.redis_client.ping()
            logger.info("Usage tracker Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis for usage tracking: {e}")
            self.redis_client = None
    
    async def track_request(
        self,
        user_id: Optional[int],
        organization_id: Optional[int],
        provider: AIProvider,
        model: str,
        task_type: TaskType,
        prompt_tokens: int,
        completion_tokens: int,
        cost_usd: float,
        response_time: float,
        success: bool = True
    ):
        """Отслеживание запроса к AI согласно ТЗ"""
        
        current_time = datetime.now()
        today = current_time.date()
        
        # Обновление счетчиков в Redis для real-time мониторинга
        if self.redis_client:
            await self._update_redis_counters(
                user_id, organization_id, provider, task_type, 
                prompt_tokens + completion_tokens, cost_usd, today
            )
        
        # Проверка лимитов
        if user_id or organization_id:
            limit_exceeded = await self._check_limits(user_id, organization_id, cost_usd, today)
            if limit_exceeded:
                logger.warning(f"Usage limit exceeded for user {user_id}/org {organization_id}")
        
        # Агрегация данных для записи в БД (выполняется асинхронно)
        asyncio.create_task(self._aggregate_daily_stats(
            user_id, organization_id, provider, task_type, 
            prompt_tokens + completion_tokens, cost_usd, response_time, success, today
        ))
    
    async def _update_redis_counters(
        self,
        user_id: Optional[int],
        organization_id: Optional[int],
        provider: AIProvider,
        task_type: TaskType,
        total_tokens: int,
        cost_usd: float,
        date_key: date
    ):
        """Обновление счетчиков в Redis"""
        try:
            pipe = self.redis_client.pipeline()
            date_str = date_key.isoformat()
            
            # Глобальные счетчики
            pipe.hincrby(f"usage:global:{date_str}", "requests", 1)
            pipe.hincrby(f"usage:global:{date_str}", "tokens", total_tokens)
            pipe.hincrbyfloat(f"usage:global:{date_str}", "cost", cost_usd)
            
            # Счетчики по провайдерам
            pipe.hincrby(f"usage:provider:{provider.value}:{date_str}", "requests", 1)
            pipe.hincrby(f"usage:provider:{provider.value}:{date_str}", "tokens", total_tokens)
            pipe.hincrbyfloat(f"usage:provider:{provider.value}:{date_str}", "cost", cost_usd)
            
            # Счетчики по пользователям
            if user_id:
                pipe.hincrby(f"usage:user:{user_id}:{date_str}", "requests", 1)
                pipe.hincrby(f"usage:user:{user_id}:{date_str}", "tokens", total_tokens)
                pipe.hincrbyfloat(f"usage:user:{user_id}:{date_str}", "cost", cost_usd)
            
            # Счетчики по организациям
            if organization_id:
                pipe.hincrby(f"usage:org:{organization_id}:{date_str}", "requests", 1)
                pipe.hincrby(f"usage:org:{organization_id}:{date_str}", "tokens", total_tokens)
                pipe.hincrbyfloat(f"usage:org:{organization_id}:{date_str}", "cost", cost_usd)
            
            # Установка TTL (30 дней)
            for key in [
                f"usage:global:{date_str}",
                f"usage:provider:{provider.value}:{date_str}",
                f"usage:user:{user_id}:{date_str}" if user_id else None,
                f"usage:org:{organization_id}:{date_str}" if organization_id else None
            ]:
                if key:
                    pipe.expire(key, 30 * 24 * 3600)  # 30 дней
            
            await pipe.execute()
            
        except Exception as e:
            logger.error(f"Failed to update Redis counters: {e}")
    
    async def _check_limits(
        self,
        user_id: Optional[int],
        organization_id: Optional[int],
        cost_usd: float,
        date_key: date
    ) -> bool:
        """Проверка лимитов использования"""
        
        if not self.redis_client:
            return False
        
        try:
            date_str = date_key.isoformat()
            month_str = date_key.strftime("%Y-%m")
            
            # Проверка дневных лимитов пользователя
            if user_id:
                daily_cost = await self.redis_client.hget(f"usage:user:{user_id}:{date_str}", "cost")
                daily_cost = float(daily_cost) if daily_cost else 0.0
                
                # Получение лимита пользователя
                user_daily_limit = self.daily_limits.get(f"user:{user_id}", settings.DAILY_COST_LIMIT)
                
                if daily_cost + cost_usd > user_daily_limit:
                    return True
            
            # Проверка месячных лимитов организации
            if organization_id:
                monthly_cost = 0.0
                
                # Суммирование стоимости за месяц
                for day in range(1, 32):
                    try:
                        day_date = date_key.replace(day=day)
                        if day_date.month != date_key.month:
                            break
                        
                        day_str = day_date.isoformat()
                        day_cost = await self.redis_client.hget(f"usage:org:{organization_id}:{day_str}", "cost")
                        monthly_cost += float(day_cost) if day_cost else 0.0
                        
                    except ValueError:
                        # Недопустимый день месяца
                        break
                
                org_monthly_limit = self.monthly_limits.get(f"org:{organization_id}", settings.MONTHLY_COST_LIMIT)
                
                if monthly_cost + cost_usd > org_monthly_limit:
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to check limits: {e}")
            return False
    
    async def _aggregate_daily_stats(
        self,
        user_id: Optional[int],
        organization_id: Optional[int],
        provider: AIProvider,
        task_type: TaskType,
        total_tokens: int,
        cost_usd: float,
        response_time: float,
        success: bool,
        date_key: date
    ):
        """Агрегация дневной статистики для записи в БД"""
        
        # Эта функция будет вызываться периодически для агрегации данных
        # Пока просто логируем для отладки
        logger.debug(f"Aggregating stats: user={user_id}, org={organization_id}, "
                    f"provider={provider.value}, tokens={total_tokens}, cost=${cost_usd:.4f}")
    
    async def get_usage_stats(
        self,
        user_id: Optional[int] = None,
        organization_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        provider: Optional[AIProvider] = None
    ) -> Dict[str, Any]:
        """Получение статистики использования"""
        
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        stats = {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "summary": {
                "total_requests": 0,
                "total_tokens": 0,
                "total_cost": 0.0,
                "average_response_time": 0.0
            },
            "by_provider": {},
            "by_task_type": {},
            "daily_breakdown": []
        }
        
        if self.redis_client:
            try:
                # Получение данных из Redis
                current_date = start_date
                while current_date <= end_date:
                    date_str = current_date.isoformat()
                    
                    # Определение ключа для запроса
                    if user_id:
                        key = f"usage:user:{user_id}:{date_str}"
                    elif organization_id:
                        key = f"usage:org:{organization_id}:{date_str}"
                    else:
                        key = f"usage:global:{date_str}"
                    
                    day_data = await self.redis_client.hgetall(key)
                    
                    if day_data:
                        requests = int(day_data.get(b'requests', 0))
                        tokens = int(day_data.get(b'tokens', 0))
                        cost = float(day_data.get(b'cost', 0.0))
                        
                        stats["summary"]["total_requests"] += requests
                        stats["summary"]["total_tokens"] += tokens
                        stats["summary"]["total_cost"] += cost
                        
                        stats["daily_breakdown"].append({
                            "date": date_str,
                            "requests": requests,
                            "tokens": tokens,
                            "cost": cost
                        })
                    
                    current_date += timedelta(days=1)
                
            except Exception as e:
                logger.error(f"Failed to get usage stats from Redis: {e}")
        
        return stats
    
    async def get_real_time_metrics(self) -> Dict[str, Any]:
        """Получение метрик в реальном времени"""
        
        today = date.today().isoformat()
        metrics = {
            "today": {
                "requests": 0,
                "tokens": 0,
                "cost": 0.0
            },
            "providers": {},
            "last_updated": datetime.now().isoformat()
        }
        
        if self.redis_client:
            try:
                # Глобальные метрики за сегодня
                global_data = await self.redis_client.hgetall(f"usage:global:{today}")
                if global_data:
                    metrics["today"]["requests"] = int(global_data.get(b'requests', 0))
                    metrics["today"]["tokens"] = int(global_data.get(b'tokens', 0))
                    metrics["today"]["cost"] = float(global_data.get(b'cost', 0.0))
                
                # Метрики по провайдерам
                for provider in AIProvider:
                    provider_data = await self.redis_client.hgetall(f"usage:provider:{provider.value}:{today}")
                    if provider_data:
                        metrics["providers"][provider.value] = {
                            "requests": int(provider_data.get(b'requests', 0)),
                            "tokens": int(provider_data.get(b'tokens', 0)),
                            "cost": float(provider_data.get(b'cost', 0.0))
                        }
                
            except Exception as e:
                logger.error(f"Failed to get real-time metrics: {e}")
        
        return metrics
    
    async def set_user_limits(
        self,
        user_id: int,
        daily_cost_limit: Optional[float] = None,
        monthly_cost_limit: Optional[float] = None
    ):
        """Установка лимитов для пользователя"""
        
        if daily_cost_limit is not None:
            self.daily_limits[f"user:{user_id}"] = daily_cost_limit
        
        if monthly_cost_limit is not None:
            self.monthly_limits[f"user:{user_id}"] = monthly_cost_limit
        
        logger.info(f"Updated limits for user {user_id}: daily=${daily_cost_limit}, monthly=${monthly_cost_limit}")
    
    async def set_organization_limits(
        self,
        organization_id: int,
        daily_cost_limit: Optional[float] = None,
        monthly_cost_limit: Optional[float] = None
    ):
        """Установка лимитов для организации"""
        
        if daily_cost_limit is not None:
            self.daily_limits[f"org:{organization_id}"] = daily_cost_limit
        
        if monthly_cost_limit is not None:
            self.monthly_limits[f"org:{organization_id}"] = monthly_cost_limit
        
        logger.info(f"Updated limits for organization {organization_id}: daily=${daily_cost_limit}, monthly=${monthly_cost_limit}")
    
    async def generate_usage_report(
        self,
        user_id: Optional[int] = None,
        organization_id: Optional[int] = None,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Генерация детального отчета об использовании"""
        
        end_date = date.today()
        start_date = end_date - timedelta(days=period_days)
        
        stats = await self.get_usage_stats(user_id, organization_id, start_date, end_date)
        
        # Дополнительные вычисления
        if stats["summary"]["total_requests"] > 0:
            stats["summary"]["average_cost_per_request"] = stats["summary"]["total_cost"] / stats["summary"]["total_requests"]
            stats["summary"]["average_tokens_per_request"] = stats["summary"]["total_tokens"] / stats["summary"]["total_requests"]
        else:
            stats["summary"]["average_cost_per_request"] = 0.0
            stats["summary"]["average_tokens_per_request"] = 0.0
        
        # Тренды
        if len(stats["daily_breakdown"]) >= 7:
            recent_week = stats["daily_breakdown"][-7:]
            previous_week = stats["daily_breakdown"][-14:-7] if len(stats["daily_breakdown"]) >= 14 else []
            
            recent_avg = sum(day["cost"] for day in recent_week) / len(recent_week)
            
            if previous_week:
                previous_avg = sum(day["cost"] for day in previous_week) / len(previous_week)
                if previous_avg > 0:
                    trend_percent = ((recent_avg - previous_avg) / previous_avg) * 100
                    stats["trends"] = {
                        "cost_trend_percent": round(trend_percent, 2),
                        "trend_direction": "up" if trend_percent > 0 else "down" if trend_percent < 0 else "stable"
                    }
        
        return stats