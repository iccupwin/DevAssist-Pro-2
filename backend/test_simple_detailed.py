#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Простой тест для нового endpoint /api/llm/analyze-detailed
"""
import requests
import json

def test_analyze_detailed():
    """Тест endpoint /api/llm/analyze-detailed"""
    print("=" * 60)
    print("ТЕСТ: /api/llm/analyze-detailed")
    print("=" * 60)
    
    test_data = {
        "tz_content": "Техническое задание: Создать веб-приложение для анализа коммерческих предложений",
        "kp_content": "Коммерческое предложение: Компания ТехСофт предлагает создание веб-приложения за 1,000,000 рублей в течение 3 месяцев с командой из 5 разработчиков.",
        "model": "claude-3-5-sonnet-20241022"
    }
    
    try:
        print("Отправляем запрос...")
        response = requests.post(
            "http://127.0.0.1:8000/api/llm/analyze-detailed",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("SUCCESS! Endpoint работает!")
            print(f"Analysis ID: {result.get('analysis_id', 'N/A')}")
            print(f"Success: {result.get('success', False)}")
            print(f"Model Used: {result.get('model_used', 'N/A')}")
            print(f"Processing Time: {result.get('processing_time', 'N/A')}s")
            print(f"Fallback Mode: {result.get('fallback_mode', False)}")
            
            if result.get('detailed_analysis'):
                analysis = result['detailed_analysis']
                print(f"Overall Score: {analysis.get('overall_score', 'N/A')}")
                print(f"Executive Summary: {analysis.get('executive_summary', 'N/A')[:100]}...")
                
            return True
        else:
            print(f"ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"EXCEPTION: {e}")
        return False

if __name__ == "__main__":
    success = test_analyze_detailed()
    if success:
        print("\nРЕЗУЛЬТАТ: ENDPOINT ВОССТАНОВЛЕН И РАБОТАЕТ!")
        print("Frontend теперь может отправлять данные к ИИ!")
    else:
        print("\nРЕЗУЛЬТАТ: Требуется дополнительная диагностика.")