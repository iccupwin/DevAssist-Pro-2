#!/usr/bin/env python3
"""
Тест реальной AI интеграции с валидными ключами
"""
import os
import asyncio
import sys
from pathlib import Path

# Добавляем текущую директорию в путь
sys.path.append(str(Path(__file__).parent))

from services.llm.providers.anthropic_provider import AnthropicProvider
from prompts.prompt_manager import PromptManager

async def test_anthropic_integration():
    """Тест интеграции с Anthropic Claude"""
    
    print("🧪 Тестирование интеграции с Anthropic Claude...")
    
    # Инициализация провайдера
    provider = AnthropicProvider()
    prompt_manager = PromptManager()
    
    # Загружаем промпты для KP анализа
    try:
        prompts = prompt_manager.get_prompts_for_document_type('kp_analysis')
        system_prompt = prompts.get('system_prompt', 'Ты эксперт по анализу коммерческих предложений.')
        
        print(f"✅ Промпты загружены: {len(system_prompt)} символов")
    except Exception as e:
        print(f"⚠️ Ошибка загрузки промптов: {e}")
        system_prompt = "Ты эксперт по анализу коммерческих предложений в строительной сфере."
    
    # Тестовый документ для анализа
    test_document = """
    КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
    ОТ: ООО "СтройТест"
    Объект: Жилой дом 
    Стоимость: 500 млн рублей
    Срок: 18 месяцев
    Опыт: 10 лет в строительстве
    """
    
    try:
        # Отправляем запрос к Claude
        print("📤 Отправляем запрос к Claude API...")
        
        response = await provider.generate_completion(
            messages=[
                {"role": "user", "content": f"Проанализируй это коммерческое предложение и дай краткую оценку:\n\n{test_document}"}
            ],
            system=system_prompt,
            max_tokens=500,
            temperature=0.1
        )
        
        print("✅ УСПЕШНАЯ ИНТЕГРАЦИЯ С CLAUDE!")
        print(f"📝 Ответ Claude ({len(response)} символов):")
        print("=" * 50)
        print(response[:300] + "..." if len(response) > 300 else response)
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"❌ ОШИБКА интеграции с Claude: {e}")
        return False

async def test_full_analysis_pipeline():
    """Тест полного пайплайна анализа документов"""
    
    print("\n🔄 Тестирование полного пайплайна анализа...")
    
    try:
        from services.documents.core.enhanced_ai_analyzer import EnhancedAIAnalyzer
        
        analyzer = EnhancedAIAnalyzer()
        
        # Читаем тестовое КП
        kp_file = Path("demo_kp.txt")
        if kp_file.exists():
            kp_content = kp_file.read_text(encoding='utf-8')
            print(f"✅ Загружен файл КП: {len(kp_content)} символов")
        else:
            print("⚠️ Файл demo_kp.txt не найден, используем тестовые данные")
            kp_content = "Тестовое коммерческое предложение на строительные работы стоимостью 500 млн руб."
        
        # Запускаем анализ
        print("📊 Запускаем полный анализ КП...")
        
        result = await analyzer.analyze_document(
            content=kp_content,
            document_type="kp",
            analysis_type="comprehensive"
        )
        
        print("✅ ПОЛНЫЙ АНАЛИЗ ЗАВЕРШЕН!")
        print(f"📈 Общий балл: {result.get('overall_score', 'N/A')}/100")
        print(f"🎯 Количество рекомендаций: {len(result.get('recommendations', []))}")
        print(f"🔍 Ключевые находки: {len(result.get('key_findings', []))}")
        
        # Показываем краткую сводку
        if 'summary' in result:
            print(f"📋 Краткая сводка: {result['summary'][:200]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ ОШИБКА полного анализа: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Главная функция тестирования"""
    print("TESTING AI INTEGRATION DEVASSIST PRO")
    print("=" * 60)
    
    # Проверяем переменные окружения
    anthropic_key = os.getenv('ANTHROPIC_API_KEY', '')
    if not anthropic_key or anthropic_key == 'sk-ant-your-anthropic-api-key-here':
        print("❌ ANTHROPIC_API_KEY не настроен!")
        return False
    
    print(f"✅ Anthropic API ключ найден: {anthropic_key[:20]}...")
    
    # Тест 1: Прямая интеграция с Claude
    claude_success = await test_anthropic_integration()
    
    # Тест 2: Полный пайплайн анализа (если первый тест прошел)
    if claude_success:
        pipeline_success = await test_full_analysis_pipeline()
        
        if pipeline_success:
            print("\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!")
            print("✅ AI интеграция готова к production")
            return True
    
    print("\n❌ Некоторые тесты не прошли")
    return False

if __name__ == "__main__":
    # Загружаем переменные окружения
    from dotenv import load_dotenv
    load_dotenv()
    
    # Запускаем тесты
    success = asyncio.run(main())
    sys.exit(0 if success else 1)