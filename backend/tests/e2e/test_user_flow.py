#!/usr/bin/env python3
"""
DevAssist Pro End-to-End User Flow Tests
Полное тестирование пользовательского пути
"""
import os
import sys
import asyncio
import json
import tempfile
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import httpx
import pytest
from sqlalchemy.orm import Session

from shared.database import SessionLocal, db_manager
from shared.models import User, Organization, OrganizationMember
from shared.config import settings

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPassword123!"
TEST_USER_NAME = "Test User"

class TestUserFlow:
    """Полный тест пользовательского flow"""
    
    @classmethod
    def setup_class(cls):
        """Подготовка тестового окружения"""
        # Очистка тестовых данных
        cls.cleanup_test_data()
        
    @classmethod
    def teardown_class(cls):
        """Очистка после тестов"""
        cls.cleanup_test_data()
    
    @staticmethod
    def cleanup_test_data():
        """Очистка тестовых данных из БД"""
        with SessionLocal() as db:
            # Удаляем тестового пользователя
            test_user = db.query(User).filter(User.email == TEST_USER_EMAIL).first()
            if test_user:
                # Удаляем связанные данные
                db.query(OrganizationMember).filter(
                    OrganizationMember.user_id == test_user.id
                ).delete()
                db.delete(test_user)
                db.commit()
    
    @pytest.mark.asyncio
    async def test_01_user_registration(self):
        """Тест регистрации нового пользователя"""
        async with httpx.AsyncClient() as client:
            # Регистрация
            response = await client.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD,
                    "full_name": TEST_USER_NAME,
                    "company": "Test Company",
                    "position": "Developer"
                }
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data["email"] == TEST_USER_EMAIL
            assert data["full_name"] == TEST_USER_NAME
            assert "id" in data
            
            # Сохраняем ID пользователя
            self.__class__.user_id = data["id"]
    
    @pytest.mark.asyncio
    async def test_02_user_login(self):
        """Тест входа пользователя"""
        async with httpx.AsyncClient() as client:
            # Логин
            response = await client.post(
                f"{BASE_URL}/api/auth/login",
                data={
                    "username": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            
            # Сохраняем токен
            self.__class__.access_token = data["access_token"]
    
    @pytest.mark.asyncio
    async def test_03_get_user_profile(self):
        """Тест получения профиля пользователя"""
        async with httpx.AsyncClient() as client:
            # Получаем профиль
            response = await client.get(
                f"{BASE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == TEST_USER_EMAIL
            assert data["full_name"] == TEST_USER_NAME
    
    @pytest.mark.asyncio
    async def test_04_create_organization(self):
        """Тест создания организации"""
        async with httpx.AsyncClient() as client:
            # Создаем организацию
            response = await client.post(
                f"{BASE_URL}/api/organizations",
                headers={"Authorization": f"Bearer {self.access_token}"},
                json={
                    "name": "Test Organization",
                    "description": "Organization for testing",
                    "website": "https://test.example.com"
                }
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "Test Organization"
            assert "id" in data
            
            # Сохраняем ID организации
            self.__class__.organization_id = data["id"]
    
    @pytest.mark.asyncio
    async def test_05_create_project(self):
        """Тест создания проекта"""
        async with httpx.AsyncClient() as client:
            # Создаем проект
            response = await client.post(
                f"{BASE_URL}/api/projects",
                headers={"Authorization": f"Bearer {self.access_token}"},
                json={
                    "name": "Test Project",
                    "description": "Test project for KP analysis",
                    "project_type": "residential",
                    "organization_id": self.organization_id
                }
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "Test Project"
            assert data["project_type"] == "residential"
            assert "id" in data
            
            # Сохраняем ID проекта
            self.__class__.project_id = data["id"]
    
    @pytest.mark.asyncio
    async def test_06_upload_document(self):
        """Тест загрузки документа"""
        async with httpx.AsyncClient() as client:
            # Создаем тестовый файл
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write("""Техническое задание на строительство жилого комплекса
                
Требования:
1. Площадь застройки: 10000 м²
2. Этажность: 12-16 этажей
3. Количество квартир: 200-250
4. Парковочные места: 300
5. Детская площадка: обязательно
6. Благоустройство территории: полное
7. Срок выполнения: 24 месяца
8. Бюджет: 500 млн рублей
                """)
                test_file_path = f.name
            
            try:
                # Загружаем файл
                with open(test_file_path, 'rb') as file:
                    response = await client.post(
                        f"{BASE_URL}/api/documents/upload",
                        headers={"Authorization": f"Bearer {self.access_token}"},
                        files={"file": ("tz_test.txt", file, "text/plain")},
                        data={
                            "document_type": "tz",
                            "project_id": self.project_id
                        }
                    )
                
                assert response.status_code == 201
                data = response.json()
                assert data["filename"]
                assert data["document_type"] == "tz"
                assert "id" in data
                
                # Сохраняем ID документа ТЗ
                self.__class__.tz_document_id = data["id"]
                
            finally:
                # Удаляем временный файл
                os.unlink(test_file_path)
    
    @pytest.mark.asyncio
    async def test_07_upload_kp_document(self):
        """Тест загрузки КП документа"""
        async with httpx.AsyncClient() as client:
            # Создаем тестовый КП файл
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write("""Коммерческое предложение на строительство ЖК "Солнечный"
                
Компания: ООО "СтройИнвест"
Контакты: info@stroyinvest.ru, +7 (495) 123-45-67

Предложение:
1. Площадь застройки: 10500 м²
2. Этажность: 14 этажей
3. Количество квартир: 230
4. Парковочные места: 320 (включая подземный паркинг)
5. Детская площадка: 2 современные площадки
6. Благоустройство: полное озеленение, малые архитектурные формы
7. Срок выполнения: 22 месяца
8. Стоимость: 480 млн рублей

Дополнительно:
- Гарантия 5 лет
- Поэтапная оплата
- Опыт работы 15 лет
- Выполнено 25 аналогичных проектов
                """)
                test_file_path = f.name
            
            try:
                # Загружаем КП файл
                with open(test_file_path, 'rb') as file:
                    response = await client.post(
                        f"{BASE_URL}/api/documents/upload",
                        headers={"Authorization": f"Bearer {self.access_token}"},
                        files={"file": ("kp_test.txt", file, "text/plain")},
                        data={
                            "document_type": "kp",
                            "project_id": self.project_id
                        }
                    )
                
                assert response.status_code == 201
                data = response.json()
                assert data["document_type"] == "kp"
                assert "id" in data
                
                # Сохраняем ID документа КП
                self.__class__.kp_document_id = data["id"]
                
            finally:
                os.unlink(test_file_path)
    
    @pytest.mark.asyncio
    async def test_08_analyze_kp(self):
        """Тест анализа КП"""
        async with httpx.AsyncClient() as client:
            # Запускаем анализ
            response = await client.post(
                f"{BASE_URL}/api/analysis/kp",
                headers={"Authorization": f"Bearer {self.access_token}"},
                json={
                    "project_id": self.project_id,
                    "tz_document_id": self.tz_document_id,
                    "kp_document_ids": [self.kp_document_id],
                    "analysis_config": {
                        "criteria": ["technical", "financial", "timeline", "contractor"],
                        "weights": {
                            "technical": 0.3,
                            "financial": 0.3,
                            "timeline": 0.2,
                            "contractor": 0.2
                        }
                    }
                }
            )
            
            assert response.status_code == 202
            data = response.json()
            assert "analysis_id" in data
            assert data["status"] == "processing"
            
            # Сохраняем ID анализа
            self.__class__.analysis_id = data["analysis_id"]
    
    @pytest.mark.asyncio
    async def test_09_check_analysis_status(self):
        """Тест проверки статуса анализа"""
        async with httpx.AsyncClient() as client:
            # Ждем завершения анализа
            max_attempts = 30
            for attempt in range(max_attempts):
                response = await client.get(
                    f"{BASE_URL}/api/analysis/{self.analysis_id}",
                    headers={"Authorization": f"Bearer {self.access_token}"}
                )
                
                assert response.status_code == 200
                data = response.json()
                
                if data["status"] == "completed":
                    assert "results" in data
                    assert "confidence_score" in data
                    assert data["confidence_score"] > 0
                    
                    # Проверяем результаты анализа
                    results = data["results"]
                    assert "compliance_score" in results
                    assert "recommendations" in results
                    break
                    
                elif data["status"] == "failed":
                    pytest.fail(f"Analysis failed: {data.get('error')}")
                
                # Ждем перед следующей попыткой
                await asyncio.sleep(2)
            else:
                pytest.fail("Analysis timeout - not completed in time")
    
    @pytest.mark.asyncio
    async def test_10_generate_report(self):
        """Тест генерации отчета"""
        async with httpx.AsyncClient() as client:
            # Генерируем отчет
            response = await client.post(
                f"{BASE_URL}/api/reports/generate",
                headers={"Authorization": f"Bearer {self.access_token}"},
                json={
                    "analysis_id": self.analysis_id,
                    "report_type": "detailed_analysis",
                    "format": "pdf",
                    "include_sections": [
                        "executive_summary",
                        "detailed_comparison",
                        "risk_assessment",
                        "recommendations"
                    ]
                }
            )
            
            assert response.status_code == 202
            data = response.json()
            assert "report_id" in data
            assert data["status"] == "generating"
            
            # Сохраняем ID отчета
            self.__class__.report_id = data["report_id"]
    
    @pytest.mark.asyncio
    async def test_11_download_report(self):
        """Тест скачивания отчета"""
        async with httpx.AsyncClient() as client:
            # Ждем генерации отчета
            max_attempts = 20
            for attempt in range(max_attempts):
                # Проверяем статус
                response = await client.get(
                    f"{BASE_URL}/api/reports/{self.report_id}/status",
                    headers={"Authorization": f"Bearer {self.access_token}"}
                )
                
                assert response.status_code == 200
                data = response.json()
                
                if data["status"] == "completed":
                    # Скачиваем отчет
                    response = await client.get(
                        f"{BASE_URL}/api/reports/{self.report_id}/download",
                        headers={"Authorization": f"Bearer {self.access_token}"}
                    )
                    
                    assert response.status_code == 200
                    assert response.headers["content-type"] == "application/pdf"
                    assert len(response.content) > 1000  # Проверяем, что файл не пустой
                    break
                    
                elif data["status"] == "failed":
                    pytest.fail(f"Report generation failed: {data.get('error')}")
                
                await asyncio.sleep(1)
            else:
                pytest.fail("Report generation timeout")
    
    @pytest.mark.asyncio
    async def test_12_list_user_projects(self):
        """Тест получения списка проектов пользователя"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BASE_URL}/api/projects",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) > 0
            
            # Проверяем наш проект в списке
            project_ids = [p["id"] for p in data]
            assert self.project_id in project_ids
    
    @pytest.mark.asyncio
    async def test_13_get_usage_statistics(self):
        """Тест получения статистики использования"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BASE_URL}/api/usage/stats",
                headers={"Authorization": f"Bearer {self.access_token}"},
                params={
                    "start_date": (datetime.now() - timedelta(days=7)).isoformat(),
                    "end_date": datetime.now().isoformat()
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "total_requests" in data
            assert "total_cost" in data
            assert "by_provider" in data
    
    @pytest.mark.asyncio
    async def test_14_update_user_profile(self):
        """Тест обновления профиля пользователя"""
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{BASE_URL}/api/auth/profile",
                headers={"Authorization": f"Bearer {self.access_token}"},
                json={
                    "full_name": "Updated Test User",
                    "company": "Updated Company",
                    "position": "Senior Developer",
                    "phone": "+7 (999) 123-45-67"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["full_name"] == "Updated Test User"
            assert data["company"] == "Updated Company"
    
    @pytest.mark.asyncio
    async def test_15_user_logout(self):
        """Тест выхода пользователя"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/auth/logout",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            assert response.status_code == 200
            
            # Проверяем, что токен больше не работает
            response = await client.get(
                f"{BASE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            assert response.status_code == 401


def run_user_flow_tests():
    """Запуск всех тестов user flow"""
    print("🧪 Starting DevAssist Pro User Flow Tests")
    print("=" * 50)
    
    # Запускаем pytest
    pytest.main([__file__, "-v", "--tb=short"])


if __name__ == "__main__":
    run_user_flow_tests()