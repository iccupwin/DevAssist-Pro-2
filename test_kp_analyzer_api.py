#!/usr/bin/env python3
"""
КРИТИЧЕСКИЙ ТЕСТ: Проверка API KP анализатора с исправленной кириллицей
"""
import json
import logging
from datetime import datetime

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_kp_analyzer_api():
    """Тест API KP анализатора"""
    logger.info("🚀 ТЕСТ API KP АНАЛИЗАТОРА С КИРИЛЛИЦЕЙ")
    logger.info("=" * 60)
    
    try:
        import requests
        import time
        
        # URL API
        base_url = "http://localhost:8000"
        analyze_url = f"{base_url}/api/kp-analyzer/analyze"
        export_url = f"{base_url}/api/kp-analyzer/export-pdf"
        
        # Тестовые данные на кириллице
        test_kp_text = """
        КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
        
        Компания: ООО «ТехноЛидер»
        Проект: Разработка веб-портала для агентства недвижимости
        
        ОПИСАНИЕ ПРОЕКТА:
        Разработка современного веб-портала для агентства недвижимости «Премиум Эстейт» 
        с функционалом поиска, просмотра объектов, онлайн-консультаций и CRM системой.
        
        ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ:
        • Backend: Python 3.11, FastAPI
        • Frontend: React 18, TypeScript
        • База данных: PostgreSQL 15
        • Кэширование: Redis
        • Контейнеризация: Docker, Kubernetes
        • Мониторинг: Grafana, Prometheus
        
        ФУНКЦИОНАЛЬНЫЕ ВОЗМОЖНОСТИ:
        1. Каталог недвижимости с расширенным поиском
        2. Личный кабинет клиентов и агентов
        3. Система онлайн-записи на просмотры
        4. CRM для управления клиентской базой
        5. Интеграция с банками для ипотеки
        6. Мобильное приложение для агентов
        
        СТОИМОСТЬ И СРОКИ:
        Общая стоимость проекта: 1 500 000 ₽ (включая НДС)
        Срок выполнения: 90 рабочих дней (3 месяца)
        Гарантия: 12 месяцев
        Техническая поддержка: 50 000 ₽/месяц
        
        ЭТАПЫ ВЫПОЛНЕНИЯ:
        1. Анализ и проектирование (20 дней) - 300 000 ₽
        2. Разработка MVP (40 дней) - 800 000 ₽
        3. Тестирование и доработка (20 дней) - 250 000 ₽
        4. Внедрение и обучение (10 дней) - 150 000 ₽
        
        КОМАНДА ПРОЕКТА:
        • Руководитель проекта: Иванов И.И. (5 лет опыта)
        • Ведущий разработчик: Петров П.П. (7 лет опыта)
        • Frontend разработчик: Сидорова С.С. (4 года опыта)
        • DevOps инженер: Козлов К.К. (6 лет опыта)
        • Тестировщик: Морозова М.М. (3 года опыта)
        
        ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ:
        • SEO оптимизация: 100 000 ₽
        • Настройка аналитики: 50 000 ₽
        • Интеграция с соцсетями: 75 000 ₽
        • Система уведомлений: 125 000 ₽
        
        Предложение действительно до: 31.12.2024
        Контакт: info@technoleader.ru, +7 (495) 123-45-67
        """
        
        test_tz_text = """
        ТЕХНИЧЕСКОЕ ЗАДАНИЕ
        
        Проект: Веб-портал агентства недвижимости «Премиум Эстейт»
        
        ЦЕЛИ ПРОЕКТА:
        1. Создание современного веб-портала для продажи/аренды недвижимости
        2. Автоматизация процессов работы с клиентами
        3. Повышение конверсии и качества обслуживания
        4. Интеграция с внешними сервисами и API
        
        ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ:
        
        1. КАТАЛОГ НЕДВИЖИМОСТИ:
        • Поиск по типу, цене, району, площади
        • Фильтры по характеристикам объектов
        • Карта с геолокацией объектов
        • Фотогалереи и виртуальные туры
        • Сравнение объектов
        
        2. ПОЛЬЗОВАТЕЛЬСКИЕ АККАУНТЫ:
        • Регистрация клиентов и агентов
        • Личные кабинеты с различными правами
        • Избранные объекты и история просмотров
        • Уведомления о новых объектах
        
        3. CRM СИСТЕМА:
        • База клиентов и лидов
        • История взаимодействий
        • Планировщик встреч и звонков
        • Отчетность по продажам
        
        4. ИНТЕГРАЦИИ:
        • API банков для ипотечного кредитования
        • Росреестр для проверки документов
        • Системы онлайн-платежей
        • Email и SMS уведомления
        
        ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
        • Поддержка 1000+ одновременных пользователей
        • Время отклика страниц не более 2 секунд
        • Адаптивный дизайн для мобильных устройств
        • SEO оптимизация и высокая скорость загрузки
        • Безопасность данных и соответствие 152-ФЗ
        • Автоматическое резервное копирование
        
        БЮДЖЕТ: до 2 000 000 ₽
        СРОКИ: не более 4 месяцев
        
        КРИТЕРИИ ОЦЕНКИ ПРЕДЛОЖЕНИЙ:
        • Техническое соответствие (30%)
        • Стоимость проекта (25%)
        • Опыт команды (20%)
        • Сроки выполнения (15%)
        • Дополнительные услуги (10%)
        """
        
        # Подготовка данных для анализа
        analysis_data = {
            "kp_content": test_kp_text,
            "tz_content": test_tz_text,
            "analysis_type": "detailed",
            "export_format": "pdf"
        }
        
        logger.info("📊 Отправляем запрос на анализ КП...")
        
        # Отправляем запрос на анализ
        try:
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            response = requests.post(
                analyze_url, 
                json=analysis_data, 
                headers=headers,
                timeout=120  # 2 минуты таймаут для AI анализа
            )
            
            if response.status_code == 200:
                analysis_result = response.json()
                logger.info("✅ Анализ КП завершен успешно!")
                logger.info(f"📈 Общая оценка: {analysis_result.get('overall_score', 'N/A')}/100")
                
                # Сохраняем результат анализа
                with open('kp_analysis_result.json', 'w', encoding='utf-8') as f:
                    json.dump(analysis_result, f, ensure_ascii=False, indent=2)
                
                logger.info("💾 Результат анализа сохранен в kp_analysis_result.json")
                
                # Проверяем наличие кириллицы в результате
                result_str = json.dumps(analysis_result, ensure_ascii=False)
                if any(ord(char) > 127 for char in result_str):
                    logger.info("✅ Кириллица в JSON ответе обработана корректно")
                else:
                    logger.warning("⚠️ Кириллица в ответе не обнаружена")
                
                # Тестируем экспорт в PDF
                logger.info("📄 Тестируем экспорт в PDF...")
                
                pdf_data = {
                    "analysis_data": analysis_result,
                    "export_options": {
                        "include_charts": True,
                        "include_recommendations": True,
                        "format": "detailed"
                    }
                }
                
                pdf_response = requests.post(
                    export_url,
                    json=pdf_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=60
                )
                
                if pdf_response.status_code == 200:
                    # Сохраняем PDF
                    pdf_filename = f"kp_analysis_cyrillic_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                    
                    with open(pdf_filename, 'wb') as f:
                        f.write(pdf_response.content)
                    
                    logger.info(f"✅ PDF экспорт успешен: {pdf_filename}")
                    logger.info(f"📏 Размер PDF: {len(pdf_response.content):,} байт")
                    
                    # Финальная проверка
                    if len(pdf_response.content) > 50000:
                        logger.info("🎉 КРИТИЧЕСКИЙ ТЕСТ ЗАВЕРШЕН УСПЕШНО!")
                        logger.info("✅ API работает, кириллица обрабатывается корректно")
                        logger.info("📋 Откройте созданный PDF для проверки отображения русского текста")
                        return True
                    else:
                        logger.error("❌ PDF файл слишком мал - возможны проблемы")
                        return False
                else:
                    logger.error(f"❌ Ошибка экспорта PDF: {pdf_response.status_code}")
                    logger.error(pdf_response.text)
                    return False
                
            else:
                logger.error(f"❌ Ошибка анализа: {response.status_code}")
                logger.error(response.text)
                return False
                
        except requests.exceptions.ConnectionError:
            logger.error("❌ ОШИБКА: Не удается подключиться к серверу")
            logger.error("Убедитесь что backend запущен на http://localhost:8000")
            return False
            
        except requests.exceptions.Timeout:
            logger.error("❌ ОШИБКА: Таймаут запроса (анализ занимает слишком много времени)")
            return False
            
    except ImportError:
        logger.error("❌ Для теста нужна библиотека requests: pip install requests")
        return False
        
    except Exception as e:
        logger.error(f"❌ Критическая ошибка теста: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def main():
    """Главная функция теста API"""
    logger.info("🚀 ЗАПУСК КРИТИЧЕСКОГО ТЕСТА API KP АНАЛИЗАТОРА")
    logger.info(f"📅 Время: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}")
    logger.info("=" * 60)
    
    success = test_kp_analyzer_api()
    
    logger.info("")
    logger.info("=" * 60)
    
    if success:
        logger.info("🎉 API ТЕСТ ПРОШЕЛ УСПЕШНО!")
        logger.info("✅ КП анализатор работает с кириллицей корректно")
    else:
        logger.info("❌ API ТЕСТ ЗАВЕРШИЛСЯ С ОШИБКАМИ!")
        logger.info("🔧 Проверьте что backend сервер запущен")
    
    logger.info("=" * 60)

if __name__ == "__main__":
    main()