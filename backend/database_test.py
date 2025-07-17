#!/usr/bin/env python3
"""
DevAssist Pro Database Testing Script
Тестирование базы данных и миграций
"""
import sys
import os
import asyncio
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from shared.database import db_manager, SessionLocal
from shared.models import (
    User, Organization, OrganizationMember, Project, 
    Document, Analysis, AIUsage, Report
)
from shared.config import db_settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_database_connection():
    """Тест подключения к базе данных"""
    logger.info("Testing database connection...")
    
    try:
        health = db_manager.health_check()
        if health:
            logger.info("✅ Database connection successful")
            return True
        else:
            logger.error("❌ Database connection failed")
            return False
    except Exception as e:
        logger.error(f"❌ Database connection error: {e}")
        return False

def test_table_creation():
    """Тест создания таблиц"""
    logger.info("Testing table creation...")
    
    try:
        # Создаем все таблицы
        db_manager.create_tables()
        logger.info("✅ Tables created successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Table creation failed: {e}")
        return False

def test_crud_operations():
    """Тест CRUD операций"""
    logger.info("Testing CRUD operations...")
    
    try:
        with SessionLocal() as db:
            # Создание организации
            org = Organization(
                name="Test Organization",
                description="Test description",
                subscription_plan="premium",
                monthly_ai_cost_limit=500.0,
                document_limit=200
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            logger.info(f"✅ Created organization: {org.name}")
            
            # Создание пользователя
            user = User(
                email="test@example.com",
                hashed_password="hashed_password_here",
                full_name="Test User",
                is_active=True,
                company="Test Company",
                position="Developer"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"✅ Created user: {user.full_name}")
            
            # Создание членства в организации
            membership = OrganizationMember(
                user_id=user.id,
                organization_id=org.id,
                role="admin",
                is_active=True
            )
            db.add(membership)
            db.commit()
            logger.info("✅ Created organization membership")
            
            # Создание проекта
            project = Project(
                name="Test Project",
                description="Test project description",
                project_type="residential",
                status="planning",
                owner_id=user.id,
                organization_id=org.id
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            logger.info(f"✅ Created project: {project.name}")
            
            # Создание документа
            document = Document(
                filename="test_document.pdf",
                original_filename="Original Test Document.pdf",
                file_size=1024,
                file_type="pdf",
                document_type="tz",
                file_path="/uploads/test_document.pdf",
                uploaded_by_id=user.id,
                project_id=project.id,
                processing_status="completed",
                extracted_text="This is test extracted text"
            )
            db.add(document)
            db.commit()
            db.refresh(document)
            logger.info(f"✅ Created document: {document.filename}")
            
            # Создание анализа
            analysis = Analysis(
                analysis_type="kp_analysis",
                status="completed",
                ai_model="gpt-4",
                ai_provider="openai",
                results={"score": 85, "recommendation": "approve"},
                confidence_score=0.95,
                processing_time=12.5,
                ai_cost=0.15,
                tokens_used=1500,
                project_id=project.id,
                tz_document_id=document.id
            )
            db.add(analysis)
            db.commit()
            db.refresh(analysis)
            logger.info(f"✅ Created analysis: {analysis.analysis_type}")
            
            # Создание записи использования AI
            ai_usage = AIUsage(
                user_id=user.id,
                organization_id=org.id,
                ai_provider="openai",
                ai_model="gpt-4",
                operation_type="analysis",
                tokens_input=800,
                tokens_output=700,
                cost_usd=0.15,
                response_time=12.5,
                analysis_id=analysis.id
            )
            db.add(ai_usage)
            db.commit()
            logger.info("✅ Created AI usage record")
            
            # Создание отчета
            report = Report(
                title="Test Analysis Report",
                report_type="detailed_analysis",
                format="pdf",
                content="<h1>Test Report</h1><p>This is a test report.</p>",
                file_path="/reports/test_report.pdf",
                analysis_id=analysis.id,
                generated_by_id=user.id
            )
            db.add(report)
            db.commit()
            logger.info(f"✅ Created report: {report.title}")
            
            # Тестирование чтения данных
            logger.info("Testing data retrieval...")
            
            # Получение пользователя с организациями
            user_with_orgs = db.query(User).filter(User.id == user.id).first()
            if user_with_orgs:
                logger.info(f"✅ Retrieved user: {user_with_orgs.full_name}")
                logger.info(f"  - Organizations: {len(user_with_orgs.organizations)}")
                logger.info(f"  - Projects: {len(user_with_orgs.projects)}")
                logger.info(f"  - Documents: {len(user_with_orgs.documents)}")
            
            # Получение проекта с документами
            project_with_docs = db.query(Project).filter(Project.id == project.id).first()
            if project_with_docs:
                logger.info(f"✅ Retrieved project: {project_with_docs.name}")
                logger.info(f"  - Documents: {len(project_with_docs.documents)}")
                logger.info(f"  - Analyses: {len(project_with_docs.analyses)}")
            
            # Очистка тестовых данных
            logger.info("Cleaning up test data...")
            db.delete(report)
            db.delete(ai_usage)
            db.delete(analysis)
            db.delete(document)
            db.delete(project)
            db.delete(membership)
            db.delete(user)
            db.delete(org)
            db.commit()
            logger.info("✅ Test data cleaned up")
            
        logger.info("✅ All CRUD operations successful")
        return True
        
    except Exception as e:
        logger.error(f"❌ CRUD operations failed: {e}")
        return False

def test_database_performance():
    """Тест производительности базы данных"""
    logger.info("Testing database performance...")
    
    try:
        with SessionLocal() as db:
            # Тест массовой вставки
            start_time = datetime.now()
            
            # Создаем организацию для теста
            org = Organization(
                name="Performance Test Org",
                description="Performance testing",
                subscription_plan="enterprise"
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            
            # Массовая вставка пользователей
            users = []
            for i in range(100):
                user = User(
                    email=f"user{i}@test.com",
                    hashed_password="test_password",
                    full_name=f"Test User {i}",
                    is_active=True
                )
                users.append(user)
            
            db.add_all(users)
            db.commit()
            
            insert_time = datetime.now() - start_time
            logger.info(f"✅ Inserted 100 users in {insert_time.total_seconds():.3f} seconds")
            
            # Тест запроса
            start_time = datetime.now()
            user_count = db.query(User).filter(User.email.like("user%@test.com")).count()
            query_time = datetime.now() - start_time
            logger.info(f"✅ Queried {user_count} users in {query_time.total_seconds():.3f} seconds")
            
            # Очистка
            db.query(User).filter(User.email.like("user%@test.com")).delete()
            db.delete(org)
            db.commit()
            
        logger.info("✅ Performance test completed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Performance test failed: {e}")
        return False

def test_database_indexes():
    """Тест индексов базы данных"""
    logger.info("Testing database indexes...")
    
    try:
        with SessionLocal() as db:
            # Проверяем, что индексы создались
            result = db.execute("""
                SELECT indexname, tablename 
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                ORDER BY tablename, indexname
            """)
            
            indexes = result.fetchall()
            logger.info(f"✅ Found {len(indexes)} indexes:")
            
            for index in indexes:
                logger.info(f"  - {index.tablename}.{index.indexname}")
            
        logger.info("✅ Index test completed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Index test failed: {e}")
        return False

def run_all_tests():
    """Запуск всех тестов"""
    logger.info("Starting DevAssist Pro Database Tests")
    logger.info("=" * 50)
    
    tests = [
        ("Database Connection", test_database_connection),
        ("Table Creation", test_table_creation),
        ("CRUD Operations", test_crud_operations),
        ("Database Performance", test_database_performance),
        ("Database Indexes", test_database_indexes),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        logger.info(f"\n🧪 Running: {test_name}")
        logger.info("-" * 30)
        
        try:
            if test_func():
                passed += 1
                logger.info(f"✅ {test_name}: PASSED")
            else:
                logger.error(f"❌ {test_name}: FAILED")
        except Exception as e:
            logger.error(f"❌ {test_name}: ERROR - {e}")
    
    logger.info("\n" + "=" * 50)
    logger.info(f"Database Tests Summary: {passed}/{total} passed")
    
    if passed == total:
        logger.info("🎉 All database tests passed!")
        return True
    else:
        logger.error(f"❌ {total - passed} tests failed")
        return False

if __name__ == "__main__":
    if not run_all_tests():
        sys.exit(1)