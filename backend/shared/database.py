"""
Database utilities для DevAssist Pro
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from typing import Generator
import logging

from .config import db_settings
from .models import Base

logger = logging.getLogger(__name__)

# Создание движка базы данных
engine = create_engine(
    db_settings.postgres_url,
    poolclass=QueuePool,
    pool_size=db_settings.postgres_pool_size,
    max_overflow=db_settings.postgres_max_overflow,
    pool_timeout=db_settings.postgres_pool_timeout,
    pool_recycle=db_settings.postgres_pool_recycle,
    echo=False  # Включить для отладки SQL запросов
)

# Создание session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """Создание всех таблиц в базе данных"""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

def drop_tables():
    """Удаление всех таблиц из базы данных"""
    Base.metadata.drop_all(bind=engine)
    logger.info("Database tables dropped successfully")

def get_db() -> Generator[Session, None, None]:
    """
    Dependency для получения сессии базы данных
    Используется в FastAPI зависимостях
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager для получения сессии базы данных
    Используется в обычном коде Python
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

class DatabaseManager:
    """Менеджер для работы с базой данных"""
    
    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal
    
    def create_tables(self):
        """Создание всех таблиц"""
        create_tables()
    
    def drop_tables(self):
        """Удаление всех таблиц"""
        drop_tables()
    
    def get_session(self) -> Session:
        """Получение новой сессии"""
        return SessionLocal()
    
    def health_check(self) -> bool:
        """Проверка здоровья базы данных"""
        try:
            with self.get_session() as session:
                session.execute("SELECT 1")
                return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False

# Глобальный экземпляр менеджера
db_manager = DatabaseManager()