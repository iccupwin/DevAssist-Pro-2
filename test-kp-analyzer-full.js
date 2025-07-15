#!/usr/bin/env node

/**
 * Автоматизированный тест КП анализатора
 * Проверяет полный цикл: загрузка файлов → AI анализ → результаты
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';

// Тестовые документы
const TEST_TZ = `ТЕХНИЧЕСКОЕ ЗАДАНИЕ
Разработка системы управления проектами

ЦЕЛЬ: Создание веб-платформы для управления проектами и задачами

ФУНКЦИИ:
1. Авторизация пользователей
2. Создание и управление проектами
3. Система задач и подзадач
4. Календарь и дедлайны
5. Отчеты и аналитика

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
- Frontend: React, TypeScript
- Backend: Python/Django или Node.js
- База данных: PostgreSQL
- Развертывание: Docker

БЮДЖЕТ: до 2,000,000 рублей
СРОКИ: не более 4 месяцев
КОМАНДА: минимум 5 разработчиков`;

const TEST_KP = `КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
ООО "ТехРешения"

ПРЕДЛОЖЕНИЕ: Разработка системы управления проектами "ProjectFlow"

О КОМПАНИИ:
5 лет на рынке разработки
Портфолио: 30+ успешных проектов

КОМАНДА:
- Проектный менеджер
- Архитектор решений  
- 2 Frontend разработчика (React)
- 2 Backend разработчика (Python)
- DevOps инженер
- QA инженер

ТЕХНОЛОГИИ:
- Frontend: React 18, TypeScript, Material-UI
- Backend: Python Django, Django REST Framework
- База данных: PostgreSQL 14
- Контейнеризация: Docker, Docker Compose
- CI/CD: GitLab

ЭТАПЫ:
1. Планирование и дизайн (3 недели)
2. Backend разработка (6 недель)
3. Frontend разработка (8 недель)
4. Интеграция и тестирование (3 недели)

СТОИМОСТЬ: 1,800,000 рублей
СРОКИ: 20 недель
ГАРАНТИЯ: 12 месяцев`;

class KPAnalyzerTester {
  constructor() {
    this.results = {
      backend_health: false,
      frontend_health: false,
      file_upload: false,
      ai_analysis: false,
      real_ai_confirmed: false,
      full_cycle: false
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'info': '📝',
      'success': '✅', 
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📝';
    
    console.log(`${prefix} ${timestamp} ${message}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkBackendHealth() {
    try {
      this.log('Проверка состояния backend...', 'info');
      const response = await fetch(`${BACKEND_URL}/health`);
      
      if (response.ok) {
        const data = await response.json();
        this.log(`Backend здоров: ${data.service}`, 'success');
        this.results.backend_health = true;
        return true;
      } else {
        this.log(`Backend недоступен: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Ошибка подключения к backend: ${error.message}`, 'error');
      return false;
    }
  }

  async checkFrontendHealth() {
    try {
      this.log('Проверка состояния frontend...', 'info');
      const response = await fetch(FRONTEND_URL);
      
      if (response.ok) {
        this.log('Frontend доступен', 'success');
        this.results.frontend_health = true;
        return true;
      } else {
        this.log(`Frontend недоступен: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Ошибка подключения к frontend: ${error.message}`, 'error');
      return false;
    }
  }

  async testFileUpload() {
    try {
      this.log('Тестирование загрузки файлов...', 'info');
      
      // Создаем временные файлы
      fs.writeFileSync('/tmp/test_tz_auto.txt', TEST_TZ);
      fs.writeFileSync('/tmp/test_kp_auto.txt', TEST_KP);

      // Загрузка ТЗ
      const tzForm = new FormData();
      tzForm.append('file', fs.createReadStream('/tmp/test_tz_auto.txt'));
      tzForm.append('document_type', 'tz');

      const tzResponse = await fetch(`${BACKEND_URL}/api/documents/upload`, {
        method: 'POST',
        body: tzForm
      });

      if (!tzResponse.ok) {
        throw new Error(`TZ upload failed: ${tzResponse.status}`);
      }

      const tzResult = await tzResponse.json();
      this.log(`ТЗ загружено: ID ${tzResult.data.document_id}`, 'success');

      // Загрузка КП
      const kpForm = new FormData();
      kpForm.append('file', fs.createReadStream('/tmp/test_kp_auto.txt'));
      kpForm.append('document_type', 'kp');

      const kpResponse = await fetch(`${BACKEND_URL}/api/documents/upload`, {
        method: 'POST',
        body: kpForm
      });

      if (!kpResponse.ok) {
        throw new Error(`KP upload failed: ${kpResponse.status}`);
      }

      const kpResult = await kpResponse.json();
      this.log(`КП загружено: ID ${kpResult.data.document_id}`, 'success');
      
      this.results.file_upload = true;
      return { tzId: tzResult.data.document_id, kpId: kpResult.data.document_id };

    } catch (error) {
      this.log(`Ошибка загрузки файлов: ${error.message}`, 'error');
      return null;
    } finally {
      // Очистка временных файлов
      try {
        fs.unlinkSync('/tmp/test_tz_auto.txt');
        fs.unlinkSync('/tmp/test_kp_auto.txt');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  async testAIAnalysis() {
    try {
      this.log('Тестирование AI анализа...', 'info');
      
      const prompt = `Проанализируй КП и дай краткую оценку:
      
КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ:
${TEST_KP}

Извлеки: компанию, команду, стоимость, сроки. Ответь JSON:
{"company": "...", "team_size": N, "price": "...", "timeline": "..."}`;

      const response = await fetch(`${BACKEND_URL}/api/llm/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 200,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const result = await response.json();
      this.log('AI анализ выполнен успешно', 'success');
      this.log(`Токенов использовано: ${result.tokens_used}`, 'info');
      
      // Проверяем, что это не моковые данные
      const isRealAI = !result.content.includes('ООО "Инновационные Решения"') && 
                      !result.content.includes('React, TypeScript, Node.js, PostgreSQL');
      
      if (isRealAI) {
        this.log('✨ Подтверждено: используется реальный AI API!', 'success');
        this.results.real_ai_confirmed = true;
      } else {
        this.log('⚠️ Возможно, используются моковые данные', 'warning');
      }

      this.results.ai_analysis = true;
      return result;

    } catch (error) {
      this.log(`Ошибка AI анализа: ${error.message}`, 'error');
      return null;
    }
  }

  async testFullCycle() {
    try {
      this.log('Тестирование полного цикла анализа...', 'info');
      
      // Комплексный AI анализ
      const fullPrompt = `Проведи полный анализ КП vs ТЗ:

ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
${TEST_TZ}

КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ:
${TEST_KP}

Дай оценку соответствия (0-100%) и итоговую рекомендацию.
Формат: JSON с полями budget_fit, timeline_fit, tech_fit, overall_score, decision.`;

      const response = await fetch(`${BACKEND_URL}/api/llm/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 400,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`Full cycle analysis failed: ${response.status}`);
      }

      const result = await response.json();
      this.log('Полный цикл анализа завершен', 'success');
      this.log(`Результат: ${result.content.substring(0, 100)}...`, 'info');
      
      this.results.full_cycle = true;
      return result;

    } catch (error) {
      this.log(`Ошибка полного цикла: ${error.message}`, 'error');
      return null;
    }
  }

  async runAllTests() {
    this.log('🚀 Запуск полного тестирования КП анализатора', 'info');
    this.log('='.repeat(60), 'info');

    // 1. Проверка backend
    const backendOk = await this.checkBackendHealth();
    if (!backendOk) {
      this.log('❌ Backend недоступен - тестирование остановлено', 'error');
      return this.results;
    }

    // 2. Проверка frontend  
    const frontendOk = await this.checkFrontendHealth();
    if (!frontendOk) {
      this.log('⚠️ Frontend недоступен - продолжаем без UI тестов', 'warning');
    }

    // 3. Тест загрузки файлов
    const uploadResult = await this.testFileUpload();
    if (!uploadResult) {
      this.log('❌ Загрузка файлов не работает', 'error');
    }

    await this.sleep(2000);

    // 4. Тест AI анализа
    const aiResult = await this.testAIAnalysis();
    if (!aiResult) {
      this.log('❌ AI анализ не работает', 'error');
    }

    await this.sleep(2000);

    // 5. Тест полного цикла
    const fullCycleResult = await this.testFullCycle();
    if (!fullCycleResult) {
      this.log('❌ Полный цикл не работает', 'error');
    }

    // Итоговый отчет
    this.log('='.repeat(60), 'info');
    this.log('📊 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ', 'info');
    this.log('='.repeat(60), 'info');
    
    Object.entries(this.results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      const testName = test.replace(/_/g, ' ').toUpperCase();
      this.log(`${testName}: ${status}`, passed ? 'success' : 'error');
    });

    const passedTests = Object.values(this.results).filter(Boolean).length;
    const totalTests = Object.keys(this.results).length;
    
    this.log('='.repeat(60), 'info');
    this.log(`🎯 РЕЗУЛЬТАТ: ${passedTests}/${totalTests} тестов пройдено`, 
      passedTests === totalTests ? 'success' : 'warning');
    
    if (this.results.real_ai_confirmed) {
      this.log('💰 ВНИМАНИЕ: Реальный AI API активен - деньги списываются!', 'warning');
    }

    return this.results;
  }
}

// Запуск тестирования
if (require.main === module) {
  const tester = new KPAnalyzerTester();
  tester.runAllTests()
    .then(results => {
      const success = Object.values(results).every(Boolean);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Критическая ошибка тестирования:', error);
      process.exit(1);
    });
}

module.exports = KPAnalyzerTester;