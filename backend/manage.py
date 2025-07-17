#!/usr/bin/env python3
"""
DevAssist Pro Database Management Script
Управление базой данных и миграциями для DevAssist Pro
"""
import sys
import os
import argparse
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
from shared.config import db_settings
from shared.database import db_manager, SessionLocal
from shared.models import Base, User, Organization, OrganizationMember
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_alembic_config():
    """Получение конфигурации Alembic"""
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("script_location", "migrations")
    alembic_cfg.set_main_option("sqlalchemy.url", db_settings.postgres_url)
    return alembic_cfg

def create_database():
    """Создание базы данных если она не существует"""
    # Подключаемся к postgres для создания базы
    base_url = db_settings.postgres_url.rsplit('/', 1)[0]
    db_name = db_settings.postgres_url.rsplit('/', 1)[1]
    
    engine = create_engine(f"{base_url}/postgres")
    
    with engine.connect() as conn:
        # Устанавливаем autocommit для создания базы данных
        conn.execute(text("COMMIT"))
        
        # Проверяем существование базы данных
        result = conn.execute(text(
            "SELECT 1 FROM pg_database WHERE datname = :db_name"
        ), {"db_name": db_name})
        
        if not result.fetchone():
            logger.info(f"Creating database: {db_name}")
            conn.execute(text(f"CREATE DATABASE {db_name}"))
            logger.info("Database created successfully")
        else:
            logger.info(f"Database {db_name} already exists")
    
    engine.dispose()

def drop_database():
    """Удаление базы данных"""
    base_url = db_settings.postgres_url.rsplit('/', 1)[0]
    db_name = db_settings.postgres_url.rsplit('/', 1)[1]
    
    engine = create_engine(f"{base_url}/postgres")
    
    with engine.connect() as conn:
        conn.execute(text("COMMIT"))
        
        # Закрываем все подключения к базе данных
        conn.execute(text("""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = :db_name AND pid <> pg_backend_pid()
        """), {"db_name": db_name})
        
        # Удаляем базу данных
        conn.execute(text(f"DROP DATABASE IF EXISTS {db_name}"))
        logger.info(f"Database {db_name} dropped successfully")
    
    engine.dispose()

def init_migrations():
    """Инициализация миграций Alembic"""
    logger.info("Initializing Alembic migrations...")
    alembic_cfg = get_alembic_config()
    command.init(alembic_cfg, "migrations")
    logger.info("Migrations initialized")

def create_migration(message: str):
    """Создание новой миграции"""
    logger.info(f"Creating migration: {message}")
    alembic_cfg = get_alembic_config()
    command.revision(alembic_cfg, message=message, autogenerate=True)
    logger.info("Migration created successfully")

def upgrade_database(revision: str = "head"):
    """Применение миграций"""
    logger.info(f"Upgrading database to revision: {revision}")
    alembic_cfg = get_alembic_config()
    command.upgrade(alembic_cfg, revision)
    logger.info("Database upgraded successfully")

def downgrade_database(revision: str):
    """Откат миграций"""
    logger.info(f"Downgrading database to revision: {revision}")
    alembic_cfg = get_alembic_config()
    command.downgrade(alembic_cfg, revision)
    logger.info("Database downgraded successfully")

def show_migration_history():
    """Показать историю миграций"""
    alembic_cfg = get_alembic_config()
    command.history(alembic_cfg, verbose=True)

def show_current_revision():
    """Показать текущую ревизию"""
    alembic_cfg = get_alembic_config()
    command.current(alembic_cfg, verbose=True)

def check_database_health():
    """Проверка здоровья базы данных"""
    logger.info("Checking database health...")
    
    try:
        health = db_manager.health_check()
        if health:
            logger.info("✅ Database is healthy")
            return True
        else:
            logger.error("❌ Database health check failed")
            return False
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def seed_database():
    """Заполнение базы данных начальными данными"""
    logger.info("Seeding database with initial data...")
    
    with SessionLocal() as db:
        # Создание тестовой организации
        test_org = db.query(Organization).filter(Organization.name == "DevAssist Pro Demo").first()
        if not test_org:
            test_org = Organization(
                name="DevAssist Pro Demo",
                description="Демонстрационная организация",
                subscription_plan="premium",
                monthly_ai_cost_limit=1000.0,
                document_limit=1000
            )
            db.add(test_org)
            db.commit()
            db.refresh(test_org)
            logger.info("Created demo organization")
        
        # Создание админ пользователя
        admin_user = db.query(User).filter(User.email == "admin@devassist.pro").first()
        if not admin_user:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            
            admin_user = User(
                email="admin@devassist.pro",
                hashed_password=pwd_context.hash("admin123"),
                full_name="Администратор системы",
                is_active=True,
                is_superuser=True,
                is_verified=True,
                company="DevAssist Pro",
                position="Системный администратор"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            logger.info("Created admin user")
            
            # Добавляем админа в организацию
            org_member = OrganizationMember(
                user_id=admin_user.id,
                organization_id=test_org.id,
                role="owner",
                is_active=True
            )
            db.add(org_member)
            db.commit()
            logger.info("Added admin to demo organization")
        
        logger.info("Database seeded successfully")

def reset_database():
    """Полный сброс базы данных"""
    logger.info("Resetting database...")
    
    try:
        # Удаляем все таблицы
        db_manager.drop_tables()
        logger.info("All tables dropped")
        
        # Применяем все миграции
        upgrade_database()
        
        # Заполняем начальными данными
        seed_database()
        
        logger.info("✅ Database reset completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Database reset failed: {e}")
        raise

def backup_database(backup_file: str):
    """Создание бэкапа базы данных"""
    logger.info(f"Creating database backup: {backup_file}")
    
    # Используем pg_dump для создания бэкапа
    import subprocess
    
    cmd = [
        "pg_dump",
        db_settings.postgres_url,
        "-f", backup_file,
        "--verbose",
        "--no-owner",
        "--no-privileges"
    ]
    
    try:
        subprocess.run(cmd, check=True)
        logger.info(f"✅ Database backup created: {backup_file}")
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Backup failed: {e}")
        raise

def restore_database(backup_file: str):
    """Восстановление базы данных из бэкапа"""
    logger.info(f"Restoring database from: {backup_file}")
    
    if not os.path.exists(backup_file):
        logger.error(f"❌ Backup file not found: {backup_file}")
        return
    
    import subprocess
    
    # Сначала очищаем базу данных
    reset_database()
    
    # Восстанавливаем из бэкапа
    cmd = [
        "psql",
        db_settings.postgres_url,
        "-f", backup_file,
        "--verbose"
    ]
    
    try:
        subprocess.run(cmd, check=True)
        logger.info(f"✅ Database restored from: {backup_file}")
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Restore failed: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description="DevAssist Pro Database Management")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Database commands
    subparsers.add_parser("create-db", help="Create database")
    subparsers.add_parser("drop-db", help="Drop database")
    subparsers.add_parser("health", help="Check database health")
    subparsers.add_parser("seed", help="Seed database with initial data")
    subparsers.add_parser("reset", help="Reset database (drop all tables and recreate)")
    
    # Migration commands
    subparsers.add_parser("init", help="Initialize migrations")
    
    create_parser = subparsers.add_parser("migrate", help="Create new migration")
    create_parser.add_argument("message", help="Migration message")
    
    upgrade_parser = subparsers.add_parser("upgrade", help="Apply migrations")
    upgrade_parser.add_argument("--revision", default="head", help="Target revision")
    
    downgrade_parser = subparsers.add_parser("downgrade", help="Downgrade migrations")
    downgrade_parser.add_argument("revision", help="Target revision")
    
    subparsers.add_parser("history", help="Show migration history")
    subparsers.add_parser("current", help="Show current revision")
    
    # Backup commands
    backup_parser = subparsers.add_parser("backup", help="Create database backup")
    backup_parser.add_argument("file", help="Backup file path")
    
    restore_parser = subparsers.add_parser("restore", help="Restore database from backup")
    restore_parser.add_argument("file", help="Backup file path")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == "create-db":
            create_database()
        elif args.command == "drop-db":
            drop_database()
        elif args.command == "health":
            if not check_database_health():
                sys.exit(1)
        elif args.command == "seed":
            seed_database()
        elif args.command == "reset":
            reset_database()
        elif args.command == "init":
            init_migrations()
        elif args.command == "migrate":
            create_migration(args.message)
        elif args.command == "upgrade":
            upgrade_database(args.revision)
        elif args.command == "downgrade":
            downgrade_database(args.revision)
        elif args.command == "history":
            show_migration_history()
        elif args.command == "current":
            show_current_revision()
        elif args.command == "backup":
            backup_database(args.file)
        elif args.command == "restore":
            restore_database(args.file)
        else:
            parser.print_help()
            
    except Exception as e:
        logger.error(f"Command failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()