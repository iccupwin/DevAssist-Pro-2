#!/usr/bin/env python3
"""
Monitoring & Metrics System - МОНИТОРИНГ И МЕТРИКИ
Система сбора метрик, мониторинга производительности и health checks
"""
import os
import time
import logging
import psutil
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque
import json
from dataclasses import dataclass, asdict

import redis
import asyncpg
from fastapi import Request, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

logger = logging.getLogger(__name__)

@dataclass
class SystemMetrics:
    """Системные метрики"""
    timestamp: str
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_available_mb: float
    disk_percent: float
    disk_used_gb: float
    disk_free_gb: float
    load_average: List[float]
    uptime_seconds: float

@dataclass  
class ApplicationMetrics:
    """Метрики приложения"""
    timestamp: str
    total_requests: int
    active_users: int
    documents_processed: int
    reports_generated: int
    ai_requests_made: int
    average_response_time: float
    error_rate: float
    cache_hit_rate: float

@dataclass
class BusinessMetrics:
    """Бизнес-метрики"""
    timestamp: str
    daily_active_users: int
    documents_analyzed_today: int
    total_cost_analyzed: float
    average_analysis_score: float
    success_rate: float
    revenue_today: float

# Prometheus метрики
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'endpoint'])
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')
DOCUMENT_PROCESSING_TIME = Histogram('document_processing_seconds', 'Document processing time', ['document_type'])
AI_REQUEST_DURATION = Histogram('ai_request_duration_seconds', 'AI request duration', ['provider'])
ERROR_COUNT = Counter('errors_total', 'Total errors', ['error_type'])

# System metrics
SYSTEM_CPU = Gauge('system_cpu_percent', 'CPU usage percentage')
SYSTEM_MEMORY = Gauge('system_memory_percent', 'Memory usage percentage')
SYSTEM_DISK = Gauge('system_disk_percent', 'Disk usage percentage')

class PerformanceTracker:
    """Трекер производительности"""
    
    def __init__(self):
        # Хранилище метрик (последние 24 часа)
        self.request_times = defaultdict(deque)
        self.error_counts = defaultdict(int)
        self.processing_times = deque(maxlen=1000)
        self.active_requests = set()
        
        # Счетчики
        self.total_requests = 0
        self.total_documents = 0
        self.total_reports = 0
        
    def start_request(self, request_id: str, endpoint: str) -> None:
        """Начало отслеживания запроса"""
        self.active_requests.add(request_id)
        self.total_requests += 1
        
        # Prometheus
        REQUEST_COUNT.labels(method="POST", endpoint=endpoint, status="processing").inc()
        
    def end_request(self, request_id: str, endpoint: str, duration: float, status_code: int) -> None:
        """Завершение отслеживания запроса"""
        self.active_requests.discard(request_id)
        
        # Сохранение времени отклика
        current_time = time.time()
        self.request_times[endpoint].append((current_time, duration))
        
        # Очистка старых данных (>24 часа)
        cutoff_time = current_time - 86400
        while (self.request_times[endpoint] and 
               self.request_times[endpoint][0][0] < cutoff_time):
            self.request_times[endpoint].popleft()
        
        # Prometheus
        REQUEST_DURATION.labels(method="POST", endpoint=endpoint).observe(duration)
        REQUEST_COUNT.labels(
            method="POST", 
            endpoint=endpoint, 
            status=str(status_code)
        ).inc()
        
    def record_error(self, error_type: str, endpoint: str) -> None:
        """Запись ошибки"""
        self.error_counts[f"{endpoint}:{error_type}"] += 1
        ERROR_COUNT.labels(error_type=error_type).inc()
        
    def record_document_processing(self, document_type: str, processing_time: float) -> None:
        """Запись обработки документа"""
        self.total_documents += 1
        self.processing_times.append(processing_time)
        DOCUMENT_PROCESSING_TIME.labels(document_type=document_type).observe(processing_time)
        
    def record_report_generation(self) -> None:
        """Запись генерации отчета"""
        self.total_reports += 1
        
    def get_average_response_time(self, endpoint: Optional[str] = None) -> float:
        """Получение среднего времени отклика"""
        if endpoint:
            times = [duration for _, duration in self.request_times[endpoint]]
        else:
            times = []
            for endpoint_times in self.request_times.values():
                times.extend([duration for _, duration in endpoint_times])
        
        return sum(times) / len(times) if times else 0.0
    
    def get_error_rate(self, window_hours: int = 1) -> float:
        """Получение коэффициента ошибок"""
        total_errors = sum(self.error_counts.values())
        return total_errors / max(self.total_requests, 1) * 100

class SystemMonitor:
    """Системный монитор"""
    
    def __init__(self):
        self.start_time = time.time()
        
    def get_system_metrics(self) -> SystemMetrics:
        """Получение системных метрик"""
        
        # CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory
        memory = psutil.virtual_memory()
        
        # Disk
        disk = psutil.disk_usage('/')
        
        # Load average (Unix-like systems)
        try:
            load_avg = list(os.getloadavg())
        except (OSError, AttributeError):
            load_avg = [0.0, 0.0, 0.0]  # Windows fallback
        
        # Uptime
        uptime = time.time() - self.start_time
        
        # Update Prometheus metrics
        SYSTEM_CPU.set(cpu_percent)
        SYSTEM_MEMORY.set(memory.percent)
        SYSTEM_DISK.set(disk.percent)
        
        return SystemMetrics(
            timestamp=datetime.now().isoformat(),
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            memory_used_mb=memory.used / 1024 / 1024,
            memory_available_mb=memory.available / 1024 / 1024,
            disk_percent=disk.percent,
            disk_used_gb=disk.used / 1024 / 1024 / 1024,
            disk_free_gb=disk.free / 1024 / 1024 / 1024,
            load_average=load_avg,
            uptime_seconds=uptime
        )

class HealthChecker:
    """Проверка состояния сервисов"""
    
    def __init__(self):
        self.db_pool = None
        self.redis_client = None
        
    async def init_connections(self):
        """Инициализация соединений для health checks"""
        try:
            # PostgreSQL connection
            db_url = os.getenv("POSTGRES_URL", "postgresql://devassist:devassist_password@localhost:5432/devassist_pro")
            self.db_pool = await asyncpg.create_pool(db_url, min_size=1, max_size=2)
            
            # Redis connection
            redis_url = os.getenv("REDIS_URL", "redis://:redis_password@localhost:6379/0")
            self.redis_client = redis.from_url(redis_url)
            
        except Exception as e:
            logger.error(f"Health checker init error: {e}")
    
    async def check_database(self) -> Dict[str, Any]:
        """Проверка состояния базы данных"""
        try:
            if not self.db_pool:
                return {"status": "error", "message": "Database pool not initialized"}
                
            async with self.db_pool.acquire() as conn:
                result = await conn.fetchval("SELECT 1")
                latency_start = time.time()
                await conn.fetchval("SELECT pg_database_size(current_database())")
                latency = (time.time() - latency_start) * 1000
                
                return {
                    "status": "healthy",
                    "latency_ms": round(latency, 2),
                    "connection_pool_size": self.db_pool.get_size(),
                    "checked_at": datetime.now().isoformat()
                }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "error",
                "message": str(e),
                "checked_at": datetime.now().isoformat()
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Проверка состояния Redis"""
        try:
            if not self.redis_client:
                return {"status": "error", "message": "Redis client not initialized"}
                
            latency_start = time.time()
            await asyncio.get_event_loop().run_in_executor(None, self.redis_client.ping)
            latency = (time.time() - latency_start) * 1000
            
            info = await asyncio.get_event_loop().run_in_executor(None, self.redis_client.info, "memory")
            
            return {
                "status": "healthy",
                "latency_ms": round(latency, 2),
                "memory_used_mb": info.get("used_memory", 0) / 1024 / 1024,
                "checked_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return {
                "status": "error", 
                "message": str(e),
                "checked_at": datetime.now().isoformat()
            }
    
    async def check_ai_services(self) -> Dict[str, Any]:
        """Проверка состояния AI сервисов"""
        ai_status = {}
        
        # Проверка наличия API ключей
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        openai_key = os.getenv("OPENAI_API_KEY", "")
        google_key = os.getenv("GOOGLE_API_KEY", "")
        
        ai_status["anthropic"] = {
            "configured": bool(anthropic_key and not anthropic_key.startswith("demo")),
            "status": "configured" if anthropic_key and not anthropic_key.startswith("demo") else "demo_mode"
        }
        
        ai_status["openai"] = {
            "configured": bool(openai_key and not openai_key.startswith("demo")),
            "status": "configured" if openai_key and not openai_key.startswith("demo") else "demo_mode"
        }
        
        ai_status["google"] = {
            "configured": bool(google_key and not google_key.startswith("demo")),
            "status": "configured" if google_key and not google_key.startswith("demo") else "demo_mode"
        }
        
        return ai_status
    
    async def comprehensive_health_check(self) -> Dict[str, Any]:
        """Комплексная проверка состояния"""
        health_status = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "healthy",
            "services": {}
        }
        
        # Проверка базы данных
        db_health = await self.check_database()
        health_status["services"]["database"] = db_health
        
        # Проверка Redis
        redis_health = await self.check_redis()
        health_status["services"]["redis"] = redis_health
        
        # Проверка AI сервисов
        ai_health = await self.check_ai_services()
        health_status["services"]["ai"] = ai_health
        
        # Системные метрики
        system_monitor = SystemMonitor()
        system_metrics = system_monitor.get_system_metrics()
        health_status["system"] = asdict(system_metrics)
        
        # Определение общего статуса
        if (db_health["status"] == "error" or 
            redis_health["status"] == "error" or
            system_metrics.cpu_percent > 90 or
            system_metrics.memory_percent > 90):
            health_status["overall_status"] = "unhealthy"
        elif (system_metrics.cpu_percent > 70 or 
              system_metrics.memory_percent > 70):
            health_status["overall_status"] = "degraded"
        
        return health_status

class MetricsCollector:
    """Сборщик метрик"""
    
    def __init__(self):
        self.performance_tracker = PerformanceTracker()
        self.system_monitor = SystemMonitor()
        self.health_checker = HealthChecker()
        
        # История метрик
        self.metrics_history = deque(maxlen=1440)  # 24 часа по 1 минуте
        
    async def collect_application_metrics(self) -> ApplicationMetrics:
        """Сбор метрик приложения"""
        
        return ApplicationMetrics(
            timestamp=datetime.now().isoformat(),
            total_requests=self.performance_tracker.total_requests,
            active_users=len(self.performance_tracker.active_requests),  # Approximation
            documents_processed=self.performance_tracker.total_documents,
            reports_generated=self.performance_tracker.total_reports,
            ai_requests_made=0,  # TODO: implement AI request tracking
            average_response_time=self.performance_tracker.get_average_response_time(),
            error_rate=self.performance_tracker.get_error_rate(),
            cache_hit_rate=0.0  # TODO: implement cache hit tracking
        )
    
    async def collect_business_metrics(self) -> BusinessMetrics:
        """Сбор бизнес-метрик"""
        
        # TODO: Implement database queries for business metrics
        return BusinessMetrics(
            timestamp=datetime.now().isoformat(),
            daily_active_users=0,
            documents_analyzed_today=0,
            total_cost_analyzed=0.0,
            average_analysis_score=0.0,
            success_rate=0.0,
            revenue_today=0.0
        )
    
    async def collect_all_metrics(self) -> Dict[str, Any]:
        """Сбор всех метрик"""
        
        system_metrics = self.system_monitor.get_system_metrics()
        app_metrics = await self.collect_application_metrics()
        business_metrics = await self.collect_business_metrics()
        health_status = await self.health_checker.comprehensive_health_check()
        
        all_metrics = {
            "timestamp": datetime.now().isoformat(),
            "system": asdict(system_metrics),
            "application": asdict(app_metrics),
            "business": asdict(business_metrics),
            "health": health_status
        }
        
        # Сохранение в историю
        self.metrics_history.append(all_metrics)
        
        return all_metrics
    
    def get_metrics_history(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Получение истории метрик"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        filtered_metrics = []
        for metrics in self.metrics_history:
            metrics_time = datetime.fromisoformat(metrics["timestamp"])
            if metrics_time >= cutoff_time:
                filtered_metrics.append(metrics)
        
        return filtered_metrics

# Глобальные экземпляры
performance_tracker = PerformanceTracker()
system_monitor = SystemMonitor()
health_checker = HealthChecker()
metrics_collector = MetricsCollector()

# Middleware для отслеживания производительности
class MetricsMiddleware:
    """Middleware для сбора метрик"""
    
    def __init__(self):
        self.performance_tracker = performance_tracker
    
    async def __call__(self, request: Request, call_next) -> Response:
        # Начало отслеживания
        request_id = f"{id(request)}_{time.time()}"
        endpoint = str(request.url.path)
        
        self.performance_tracker.start_request(request_id, endpoint)
        start_time = time.time()
        
        try:
            # Выполнение запроса
            response = await call_next(request)
            
            # Завершение отслеживания
            duration = time.time() - start_time
            self.performance_tracker.end_request(
                request_id, endpoint, duration, response.status_code
            )
            
            # Добавление метрик в заголовки ответа
            response.headers["X-Response-Time"] = f"{duration:.3f}s"
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Запись ошибки
            duration = time.time() - start_time
            self.performance_tracker.end_request(request_id, endpoint, duration, 500)
            self.performance_tracker.record_error(type(e).__name__, endpoint)
            raise

# Функции для FastAPI endpoints
async def get_prometheus_metrics() -> str:
    """Получение метрик в формате Prometheus"""
    return generate_latest()

async def get_health_status() -> Dict[str, Any]:
    """Получение статуса здоровья системы"""
    return await health_checker.comprehensive_health_check()

async def get_system_metrics() -> Dict[str, Any]:
    """Получение системных метрик"""
    return asdict(system_monitor.get_system_metrics())

async def get_all_metrics() -> Dict[str, Any]:
    """Получение всех метрик"""
    return await metrics_collector.collect_all_metrics()

# Инициализация при старте приложения
async def init_monitoring():
    """Инициализация системы мониторинга"""
    try:
        await health_checker.init_connections()
        logger.info("Monitoring system initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize monitoring: {e}")