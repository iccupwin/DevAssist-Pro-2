#!/usr/bin/env python3
"""
Демонстрация возможностей DevAssist Pro (монолитная версия)
"""
import requests
import json
import time
from pathlib import Path

BASE_URL = "http://localhost:8000"

def demo_kp_analysis():
    """Демонстрация анализа КП"""
    print("📊 ДЕМО: Анализ коммерческого предложения")
    print("=" * 50)
    
    # Создаем тестовое КП
    kp_content = """
    КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
    ООО "ТехноСтрой"
    
    Предмет: Разработка системы управления недвижимостью
    
    ОПИСАНИЕ ПРОЕКТА:
    Создание современной веб-платформы для управления коммерческой 
    недвижимостью с интеграцией CRM, аналитики и отчетности.
    
    ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
    - Backend: Python/FastAPI
    - Frontend: React/TypeScript  
    - База данных: PostgreSQL
    - Кеширование: Redis
    - Контейнеризация: Docker
    
    ЭТАПЫ ВЫПОЛНЕНИЯ:
    1. Анализ требований (2 недели)
    2. Проектирование архитектуры (1 неделя)
    3. Разработка backend (6 недель)
    4. Разработка frontend (4 недели)
    5. Интеграция и тестирование (2 недели)
    6. Развертывание и запуск (1 неделя)
    
    СТОИМОСТЬ: 850,000 рублей
    СРОКИ: 16 недель (4 месяца)
    
    ГАРАНТИИ:
    - Гарантия на разработку: 12 месяцев
    - Техническая поддержка: 6 месяцев бесплатно
    - Обучение персонала: включено
    
    КОМАНДА:
    - Проект-менеджер: 1 чел.
    - Backend разработчики: 2 чел.
    - Frontend разработчик: 1 чел.
    - DevOps инженер: 1 чел.
    - Тестировщик: 1 чел.
    
    ПРЕИМУЩЕСТВА:
    - Опыт работы 8+ лет
    - Более 50 успешных проектов
    - Собственная методология разработки
    - Сертифицированные специалисты
    
    Контакты:
    Email: info@technostroy.ru
    Телефон: +7 (495) 123-45-67
    """
    
    # Сохраняем файл
    kp_file = Path("demo_kp.txt")
    with open(kp_file, 'w', encoding='utf-8') as f:
        f.write(kp_content)
    
    print("📄 Создано тестовое КП:")
    print(f"   • Файл: {kp_file.name}")
    print(f"   • Размер: {len(kp_content)} символов")
    print(f"   • Тип: Разработка ПО")
    
    print("\n🔍 Отправляем на анализ...")
    
    try:
        # Отправляем файл на анализ
        with open(kp_file, 'rb') as f:
            files = {'file': (kp_file.name, f, 'text/plain')}
            response = requests.post(f"{BASE_URL}/api/kp-analyzer/full-analysis", 
                                   files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()['data']
            
            # Показываем результаты анализа
            print("\n✅ АНАЛИЗ ЗАВЕРШЕН!")
            print("-" * 30)
            
            # Информация о документе
            document = data['document']
            print(f"📄 Документ загружен:")
            print(f"   • ID: {document['document_id']}")
            print(f"   • Размер: {document['size']} байт")
            print(f"   • Время загрузки: {document['uploaded_at'][:19]}")
            
            # Результаты анализа
            analysis = data['analysis']
            results = analysis['results']
            
            print(f"\n🔍 Результаты анализа (ID: {analysis['analysis_id']}):")
            print(f"   • Качество предложения: {results['quality_score']:.1f}%")
            print(f"   • Соответствие требованиям: {results['compliance_score']:.1f}%")
            print(f"   • Конкурентоспособность: {results['competitiveness_score']:.1f}%")
            print(f"   • Время обработки: {analysis['processing_time']:.1f} сек")
            print(f"   • AI модель: {analysis['ai_provider']} ({analysis['model_used']})")
            
            print(f"\n📋 Краткое заключение:")
            print(f"   {results['summary']}")
            
            print(f"\n💡 Ключевые моменты:")
            for i, point in enumerate(results['key_points'], 1):
                print(f"   {i}. {point}")
            
            print(f"\n🔧 Рекомендации:")
            for i, rec in enumerate(results['recommendations'], 1):
                print(f"   {i}. {rec}")
            
            # Информация об отчетах
            reports = data['reports']
            print(f"\n📊 Сгенерированы отчеты:")
            print(f"   • PDF отчет: {reports['pdf']['filename']}")
            print(f"     Скачать: {BASE_URL}{reports['pdf']['download_url']}")
            print(f"   • Excel данные: {reports['excel']['filename']}")
            print(f"     Скачать: {BASE_URL}{reports['excel']['download_url']}")
            
            return True
            
        else:
            print(f"❌ Ошибка анализа: HTTP {response.status_code}")
            if response.text:
                print(f"   Детали: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при анализе: {e}")
        return False
    
    finally:
        # Удаляем тестовый файл
        kp_file.unlink(missing_ok=True)

def demo_analytics():
    """Демонстрация аналитики"""
    print("\n📈 ДЕМО: Аналитика и метрики")
    print("=" * 50)
    
    try:
        # Получаем статистику дашборда
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard?period=30d", timeout=10)
        
        if response.status_code == 200:
            data = response.json()['data']
            overview = data['overview']
            
            print("📊 Общая статистика (30 дней):")
            print(f"   • Проектов: {overview['total_projects']}")
            print(f"   • Анализов: {overview['total_analyses']}")
            print(f"   • Документов: {overview['total_documents']}")
            print(f"   • Пользователей: {overview['total_users']}")
            print(f"   • Успешность: {overview['success_rate']:.1f}%")
            print(f"   • Среднее время обработки: {overview['avg_processing_time']:.1f} сек")
            
            # Показываем метрики
            metrics = data['metrics']
            print(f"\n💰 Финансовые метрики:")
            print(f"   • Общие расходы: ${metrics['total_cost']:.2f}")
            print(f"   • Стоимость за анализ: ${metrics['avg_cost_per_analysis']:.2f}")
            
            # Диаграммы
            print(f"\n📈 Доступные диаграммы:")
            for chart in data['charts']:
                print(f"   • {chart['title']} ({chart['type']})")
            
            return True
        else:
            print(f"❌ Ошибка получения аналитики: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка аналитики: {e}")
        return False

def demo_system_status():
    """Демонстрация системного статуса"""
    print("\n⚙️  ДЕМО: Статус системы")
    print("=" * 50)
    
    try:
        # Статус системы
        response = requests.get(f"{BASE_URL}/api/admin/status", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"🖥️  Статус системы: {data['status'].upper()}")
            print(f"📱 Версия: {data['version']}")
            print(f"⏱️  Время работы: {data['uptime']}")
            
            print(f"\n🔧 Состояние сервисов:")
            for service, status in data['services'].items():
                emoji = "✅" if status == "healthy" else "❌"
                print(f"   • {service.capitalize()}: {emoji} {status}")
            
            return True
        else:
            print(f"❌ Ошибка получения статуса: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка статуса: {e}")
        return False

def main():
    """Главная функция демонстрации"""
    print("🎯 DevAssist Pro - Полная демонстрация")
    print("=" * 60)
    print("🚀 Демонстрация всех возможностей КП Анализатора")
    print()
    
    # Проверяем доступность
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Приложение недоступно!")
            print("   Запустите: python3 app.py")
            return False
    except:
        print("❌ Приложение не запущено!")
        print("   Запустите: python3 app.py") 
        return False
    
    print("✅ Приложение доступно, начинаем демонстрацию...\n")
    
    # Демонстрации
    demos = [
        demo_kp_analysis,
        demo_analytics, 
        demo_system_status
    ]
    
    success_count = 0
    for demo_func in demos:
        try:
            if demo_func():
                success_count += 1
        except Exception as e:
            print(f"❌ Ошибка в демо: {e}")
        
        time.sleep(1)  # Пауза между демо
    
    # Итоги
    print("\n" + "=" * 60)
    print("🎊 ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА!")
    print("=" * 60)
    
    if success_count == len(demos):
        print("✅ Все функции работают корректно!")
        print("\n🌐 Полезные ссылки:")
        print(f"   • API документация: {BASE_URL}/docs")
        print(f"   • Интерактивная документация: {BASE_URL}/redoc")
        print(f"   • Health Check: {BASE_URL}/health")
        
        print("\n🎯 DevAssist Pro готов к использованию!")
        return True
    else:
        print(f"⚠️  Некоторые функции работают с ошибками")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)