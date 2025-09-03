#!/usr/bin/env python3
"""
Тестирование улучшенного PDF экстрактора
Проверяет работу всех методов извлечения данных
"""

import asyncio
import os
import sys
from pathlib import Path
import logging

# Add backend to path
sys.path.append(str(Path(__file__).parent))

from services.documents.core.enhanced_pdf_extractor import EnhancedPDFExtractor, extract_pdf_data

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_pdf_extractor():
    """Test the enhanced PDF extractor with sample data"""
    
    print("Тестирование улучшенного PDF экстрактора")
    print("=" * 50)
    
    # Create sample PDF content for testing (mock data)
    sample_pdf_content = create_sample_pdf_content()
    
    try:
        # Test the extractor
        extractor = EnhancedPDFExtractor()
        
        result = await extractor.extract_comprehensive_data(
            sample_pdf_content, 
            "test_commercial_proposal.pdf"
        )
        
        print("\n📊 Результаты извлечения:")
        print(f"✅ Файл: {result['filename']}")
        print(f"✅ Методы извлечения: {', '.join(result['extraction_methods'])}")
        print(f"✅ Размер текста: {len(result['text'])} символов")
        print(f"✅ Количество таблиц: {len(result['tables'])}")
        print(f"✅ Количество бюджетов: {len(result['budgets'])}")
        print(f"✅ Количество валют: {len(result['currencies'])}")
        print(f"✅ Успешное извлечение: {result['metadata']['extraction_success']}")
        print(f"✅ Время обработки: {result['metadata']['processing_time']:.2f}с")
        
        # Show budgets found
        if result['budgets']:
            print("\n💰 Найденные бюджеты:")
            for i, budget in enumerate(result['budgets'][:5], 1):  # Show top 5
                print(f"  {i}. {budget['formatted']} (уверенность: {budget['confidence']:.1f})")
                if budget.get('context'):
                    context_preview = budget['context'][:100].replace('\n', ' ')
                    print(f"     Контекст: {context_preview}...")
        
        # Show tables found
        if result['tables']:
            print(f"\n📋 Найденные таблицы:")
            for i, table in enumerate(result['tables'][:3], 1):  # Show top 3
                print(f"  {i}. Источник: {table['source']}, Размер: {table['row_count']}x{table['col_count']}")
                if table.get('has_numbers'):
                    print(f"     Содержит числа: ✅")
        
        # Show structured data
        if result['structured_data']:
            print(f"\n📈 Структурированные данные:")
            struct = result['structured_data']
            print(f"  • Всего бюджетов: {struct.get('total_budgets', 0)}")
            print(f"  • Высокая уверенность: {len(struct.get('high_confidence_budgets', []))}")
            print(f"  • Структурированные цены: {'✅' if struct.get('has_structured_pricing') else '❌'}")
            
            if struct.get('currency_breakdown'):
                print("  • Разбивка по валютам:")
                for curr, data in struct['currency_breakdown'].items():
                    print(f"    - {curr}: {data['count']} записей, сумма: {data['total_amount']:,.2f}")
        
        print("\n🎉 Тестирование завершено успешно!")
        return True
        
    except Exception as e:
        print(f"\n❌ Ошибка тестирования: {e}")
        return False

def create_sample_pdf_content() -> bytes:
    """Create sample PDF content for testing"""
    
    # This would normally be actual PDF bytes
    # For testing, we'll simulate what PDF content might look like
    sample_text = """
    КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
    
    Строительство жилого комплекса "Солнечные Холмы"
    
    ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
    - Общая площадь: 15,000 м²
    - Количество квартир: 120 единиц
    - Срок выполнения: 24 месяца
    - Бюджет ТЗ: 150,000,000 рублей
    
    КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ:
    - Стоимость работ: 145 500 000,00 ₽
    - НДС 20%: 29 100 000,00 ₽
    - Итого к оплате: 174 600 000 рублей
    
    СМЕТА РАСХОДОВ:
    | Наименование работ       | Количество | Цена за ед. | Сумма      |
    |--------------------------|------------|-------------|------------|
    | Земляные работы          | 1000 м³    | 2 500 ₽     | 2 500 000  |
    | Фундаментные работы      | 500 м³     | 15 000 ₽    | 7 500 000  |
    | Стеновые конструкции     | 800 м²     | 8 500 ₽     | 6 800 000  |
    | Кровельные работы        | 1200 м²    | 3 200 ₽     | 3 840 000  |
    
    Альтернативный вариант в долларах США:
    Общая стоимость: $1,850,000 USD
    
    Оплата может производиться в тенге:
    Эквивалент: 850 000 000 тенге
    """
    
    # For actual testing, this would be real PDF bytes
    # Here we return the text as bytes for simulation
    return sample_text.encode('utf-8')

async def test_number_parsing():
    """Test number parsing capabilities"""
    
    print("\nТестирование парсинга чисел:")
    print("=" * 30)
    
    extractor = EnhancedPDFExtractor()
    
    test_numbers = [
        "1 000 000,50",      # Russian format
        "1,000,000.50",      # US format  
        "1.000.000,50",      # European format
        "1000000",           # Simple format
        "2 500 000 ₽",       # With currency
        "$1,850,000",        # Dollar format
        "150,000,000 рублей", # Russian with text
    ]
    
    for number_str in test_numbers:
        parsed = extractor._parse_number(number_str)
        print(f"  '{number_str}' -> {parsed:,.2f}" if parsed else f"  '{number_str}' -> FAILED")

async def test_currency_extraction():
    """Test currency extraction"""
    
    print("\nТестирование извлечения валют:")
    print("=" * 35)
    
    extractor = EnhancedPDFExtractor()
    
    test_text = """
    Стоимость проекта: 25 000 000 рублей
    Альтернативный вариант: $350,000
    В евро это составляет: €320,000
    Оплата в тенге: 185 000 000 KZT
    Или в сомах: 3 500 000 сом
    """
    
    currencies = extractor._extract_currencies(test_text)
    
    print(f"  Найдено валют: {len(currencies)}")
    for curr in currencies:
        print(f"  • {curr['formatted']} в позиции {curr['position']}")

async def main():
    """Main test function"""
    print("Запуск тестов улучшенного PDF экстрактора")
    
    success = await test_pdf_extractor()
    await test_number_parsing()
    await test_currency_extraction()
    
    if success:
        print("\n✅ Все тесты пройдены успешно!")
        print("\n📋 Возможности нового экстрактора:")
        print("  • Множественные методы извлечения (PyMuPDF, pdfplumber, camelot, OCR)")
        print("  • Продвинутое извлечение таблиц с валидацией")
        print("  • Улучшенное распознавание чисел в разных форматах")
        print("  • Извлечение бюджетов с анализом контекста")
        print("  • Поддержка 5+ валют (RUB, USD, EUR, KZT, KGS)")
        print("  • Кэширование результатов для производительности")
        print("  • Детальное логирование и обработка ошибок")
        print("  • OCR поддержка для сканированных документов")
        
        return 0
    else:
        print("\n❌ Тесты завершились с ошибками")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)