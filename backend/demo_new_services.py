#!/usr/bin/env python3
"""
DevAssist Pro - Демонстрация новых сервисов
Запуск Reports и Analytics сервисов для тестирования
"""
import asyncio
import json
from datetime import datetime
import sys
import os

# Добавляем путь к shared модулям
sys.path.append('/Users/atai/Documents/DevAssist-Pro-1/backend/services/reports')
sys.path.append('/Users/atai/Documents/DevAssist-Pro-1/backend/services/analytics')
sys.path.append('/Users/atai/Documents/DevAssist-Pro-1/backend/shared')

async def test_reports_service():
    """Тест Reports Service"""
    print("\n🗂️  Reports Service Demo")
    print("=" * 40)
    
    try:
        # Импорт компонентов Reports Service
        from core.report_generator import ReportGenerator
        from core.pdf_generator import PDFGenerator
        from core.excel_generator import ExcelGenerator
        from core.template_manager import TemplateManager
        
        # Создание экземпляров
        report_gen = ReportGenerator()
        pdf_gen = PDFGenerator()
        excel_gen = ExcelGenerator()
        template_mgr = TemplateManager()
        
        print("✅ Reports Service компоненты загружены")
        
        # Тест генерации отчета
        print("\n📊 Тест генерации отчета:")
        analysis_id = 12345
        
        report_data = await report_gen.generate_report(
            analysis_id=analysis_id,
            report_format="pdf",
            template_name="kp_analysis_default",
            include_charts=True,
            include_raw_data=False
        )
        
        print(f"✅ Отчет сгенерирован для анализа {analysis_id}")
        print(f"   Секций: {len(report_data.get('sections', {}))}")
        print(f"   Включены диаграммы: {report_data.get('metadata', {}).get('include_charts', False)}")
        
        # Тест шаблонов
        print("\n📝 Доступные шаблоны:")
        templates = await template_mgr.list_templates()
        for i, template in enumerate(templates[:3], 1):
            print(f"   {i}. {template['name']} ({len(template['sections'])} секций)")
        
        # Тест PDF генерации (мок версия)
        print("\n📄 Тест PDF генерации:")
        pdf_path = await pdf_gen.generate_kp_analysis_report(
            analysis_id=analysis_id,
            template_name="kp_analysis_default",
            include_charts=True
        )
        print(f"✅ PDF файл создан: {pdf_path}")
        
        # Тест Excel генерации (мок версия)
        print("\n📊 Тест Excel генерации:")
        excel_path = await excel_gen.generate_kp_analysis_report(
            analysis_id=analysis_id,
            include_charts=True
        )
        print(f"✅ Excel файл создан: {excel_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка в Reports Service: {str(e)}")
        return False

async def test_analytics_service():
    """Тест Analytics Service"""
    print("\n📈 Analytics Service Demo")
    print("=" * 40)
    
    try:
        # Импорт компонентов Analytics Service
        from core.analytics_processor import AnalyticsProcessor
        from core.metrics_calculator import MetricsCalculator
        from core.data_aggregator import DataAggregator
        from core.statistics_generator import StatisticsGenerator
        
        # Создание экземпляров
        analytics_proc = AnalyticsProcessor()
        metrics_calc = MetricsCalculator()
        data_agg = DataAggregator()
        stats_gen = StatisticsGenerator()
        
        print("✅ Analytics Service компоненты загружены")
        
        # Тест обработки аналитики
        print("\n📊 Тест обработки аналитики:")
        analytics_result = await analytics_proc.process_analytics(
            data_type="analyses",
            aggregation_type="count"
        )
        
        print(f"✅ Аналитика обработана:")
        print(f"   Всего анализов: {analytics_result.get('total_analyses', 0)}")
        print(f"   Успешных: {analytics_result.get('successful_analyses', 0)}")
        print(f"   Успешность: {analytics_result.get('success_rate', 0)}%")
        
        # Тест расчета метрик
        print("\n⚡ Тест расчета метрик:")
        metrics_result = await metrics_calc.calculate_metrics(
            metric_types=["success_rate", "avg_processing_time", "cost_per_analysis"],
            entity_type="global",
            period="30d"
        )
        
        print(f"✅ Метрики рассчитаны:")
        for metric, data in metrics_result.items():
            if metric != "metadata" and isinstance(data, dict):
                value = data.get('value', 'N/A')
                unit = data.get('unit', '')
                print(f"   {metric}: {value} {unit}")
        
        # Тест агрегации данных
        print("\n🔄 Тест агрегации данных:")
        user_analytics = await data_agg.aggregate_user_data(period="30d")
        
        print(f"✅ Данные пользователей агрегированы:")
        print(f"   Всего пользователей: {user_analytics.get('total_users', 0)}")
        print(f"   Активных: {user_analytics.get('active_users', 0)}")
        print(f"   Новых: {user_analytics.get('new_users', 0)}")
        
        # Тест статистики дашборда
        print("\n📊 Тест статистики дашборда:")
        dashboard_stats = await stats_gen.generate_dashboard_statistics(period="30d")
        
        print(f"✅ Статистика дашборда сгенерирована:")
        print(f"   Разделов: {len(dashboard_stats)}")
        
        overview = dashboard_stats.get('overview', {})
        if overview:
            print(f"   Проектов: {overview.get('total_projects', 0)}")
            print(f"   Анализов: {overview.get('total_analyses', 0)}")
            print(f"   Документов: {overview.get('total_documents', 0)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка в Analytics Service: {str(e)}")
        return False

async def test_integration():
    """Тест интеграции сервисов"""
    print("\n🔗 Integration Test")
    print("=" * 40)
    
    try:
        # Создаем экземпляры для интеграции
        from core.analytics_processor import AnalyticsProcessor
        from core.report_generator import ReportGenerator
        
        analytics_proc = AnalyticsProcessor()
        report_gen = ReportGenerator()
        
        # Получаем аналитику
        analytics_data = await analytics_proc.process_analytics(
            data_type="analyses",
            aggregation_type="count"
        )
        
        # Используем данные аналитики для отчета
        analysis_id = analytics_data.get('total_analyses', 100)
        report_data = await report_gen.generate_report(
            analysis_id=analysis_id,
            report_format="pdf",
            include_charts=True
        )
        
        print("✅ Интеграция работает:")
        print(f"   Аналитика → Отчет: анализ #{analysis_id}")
        print(f"   Секций в отчете: {len(report_data.get('sections', {}))}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка интеграции: {str(e)}")
        return False

async def main():
    """Главная функция демо"""
    print("🎯 DevAssist Pro - Демонстрация новых сервисов")
    print("=" * 50)
    print(f"Время запуска: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Проверяем наличие базовых сервисов
    print("\n🔍 Проверка инфраструктуры:")
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, password='redis_password')
        r.ping()
        print("✅ Redis доступен")
    except Exception as e:
        print("❌ Redis недоступен - запустите 'docker-compose up -d redis'")
    
    try:
        import asyncpg
        # Заглушка для проверки PostgreSQL
        print("✅ PostgreSQL драйвер доступен")
    except Exception as e:
        print("❌ PostgreSQL драйвер недоступен")
    
    # Запускаем тесты
    results = {}
    
    results['reports'] = await test_reports_service()
    results['analytics'] = await test_analytics_service()
    results['integration'] = await test_integration()
    
    # Итоги
    print("\n" + "=" * 50)
    print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
    print("=" * 50)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    for service, result in results.items():
        status = "✅ ПРОЙДЕН" if result else "❌ ОШИБКА"
        print(f"{service.upper():>15}: {status}")
    
    print("-" * 50)
    print(f"ИТОГО: {passed_tests}/{total_tests} тестов пройдено")
    
    if passed_tests == total_tests:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Сервисы работают корректно.")
        print("\n🚀 Следующие шаги:")
        print("   1. Запустите полную систему: make start")
        print("   2. Откройте API документацию: http://localhost:8000/docs")
        print("   3. Проведите интеграционные тесты")
    else:
        print(f"\n⚠️  {total_tests - passed_tests} тест(ов) завершились ошибкой.")
        print("Проверьте логи выше для диагностики.")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)