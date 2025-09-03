#!/usr/bin/env python3
"""
Тест полного пайплайна анализа через API
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_auth():
    """Тест аутентификации"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@devassist.pro", 
        "password": "admin123"
    })
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            token = data.get('token') or data.get('access_token')
            if token:
                print(f"AUTH SUCCESS: Token received {token[:20]}...")
                return token
    
    print(f"AUTH FAILED: {response.status_code} - {response.text}")
    return None

def test_document_upload(token):
    """Тест загрузки документа"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Используем существующий тестовый файл
    with open("demo_kp.txt", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Загружаем как файл
    files = {"file": ("demo_kp.txt", content, "text/plain")}
    data = {
        "document_type": "kp",
        "description": "Test commercial proposal upload"
    }
    
    response = requests.post(f"{BASE_URL}/api/documents/upload", headers=headers, files=files, data=data)
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            doc_id = result['data']['document_id']
            print(f"UPLOAD SUCCESS: Document ID {doc_id}")
            return doc_id
    
    print(f"UPLOAD FAILED: {response.status_code} - {response.text}")
    return None

def test_document_analysis(token, document_id):
    """Тест анализа документа"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "analysis_type": "comprehensive",
        "include_recommendations": True,
        "model_config": {
            "provider": "anthropic",
            "model": "claude-3-5-sonnet-20241022",
            "temperature": 0.1,
            "max_tokens": 2000
        }
    }
    
    response = requests.post(f"{BASE_URL}/api/documents/{document_id}/analyze", headers=headers, json=data)
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            analysis_id = result['data']['analysis_id']
            print(f"ANALYSIS STARTED: Analysis ID {analysis_id}")
            return analysis_id
    
    print(f"ANALYSIS FAILED: {response.status_code} - {response.text}")
    return None

def test_report_generation(token, analysis_id):
    """Тест генерации отчетов"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Тест PDF отчета
    response = requests.post(f"{BASE_URL}/api/reports/generate/pdf", headers=headers, json={"analysis_id": analysis_id})
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"PDF REPORT SUCCESS: {result['download_url']}")
        else:
            print(f"PDF REPORT FAILED: {result}")
    else:
        print(f"PDF REQUEST FAILED: {response.status_code}")
    
    # Тест Excel отчета
    response = requests.post(f"{BASE_URL}/api/reports/generate/excel", headers=headers, json={"analysis_id": analysis_id})
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"EXCEL REPORT SUCCESS: {result['download_url']}")
            return True
    else:
        print(f"EXCEL REQUEST FAILED: {response.status_code}")
    
    return False

def main():
    """Полный тест пайплайна"""
    print("TESTING FULL PIPELINE...")
    print("=" * 50)
    
    # Шаг 1: Аутентификация
    print("Step 1: Authentication")
    token = test_auth()
    if not token:
        return False
    
    # Шаг 2: Загрузка документа
    print("\nStep 2: Document Upload")
    document_id = test_document_upload(token)
    if not document_id:
        return False
    
    # Шаг 3: Анализ документа с реальным AI
    print("\nStep 3: AI Analysis")
    analysis_id = test_document_analysis(token, document_id)
    if not analysis_id:
        return False
    
    # Небольшая пауза для обработки
    print("Waiting for analysis to complete...")
    time.sleep(3)
    
    # Шаг 4: Генерация отчетов
    print("\nStep 4: Report Generation")
    reports_success = test_report_generation(token, analysis_id)
    
    if reports_success:
        print("\n" + "=" * 50)
        print("SUCCESS: Full pipeline completed!")
        print("AI integration is working correctly.")
        return True
    else:
        print("\nPIPELINE FAILED at report generation")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)