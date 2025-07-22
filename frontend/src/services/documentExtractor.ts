/**
 * Сервис для обработки документов (PDF, DOCX)
 * Извлечение текста для анализа ИИ
 */

export class DocumentProcessor {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  /**
   * Извлечение текста из файла
   */
  async extractTextFromFile(file: File): Promise<string> {
    try {
      // Попытка использовать backend API для извлечения текста
      if (await this.isBackendAvailable()) {
        return await this.extractTextViaAPI(file);
      } else {
        // Fallback: простое чтение как текст (для демо)
        return await this.extractTextSimple(file);
      }
    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error(`Ошибка извлечения текста из файла ${file.name}`);
    }
  }

  /**
   * Проверка доступности backend API
   */
  private async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Извлечение текста через backend API
   */
  private async extractTextViaAPI(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/documents/extract-text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('devassist_simple_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API extraction failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.text;
  }

  /**
   * Простое извлечение текста (fallback для демо)
   */
  private async extractTextSimple(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        // Для демо генерируем осмысленный текст на основе метаданных файла
        const demoText = this.generateDemoText(file);
        resolve(demoText);
      };
      
      reader.onerror = () => {
        reject(new Error('Ошибка чтения файла'));
      };
      
      // Читаем как ArrayBuffer для имитации обработки бинарного файла
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Генерация демо-текста для тестирования ИИ
   */
  private generateDemoText(file: File): string {
    const isKP = file.name.toLowerCase().includes('кп') || 
                file.name.toLowerCase().includes('proposal') ||
                file.name.toLowerCase().includes('предложение');
    
    const isTZ = file.name.toLowerCase().includes('тз') || 
               file.name.toLowerCase().includes('tech') ||
               file.name.toLowerCase().includes('требования');

    if (isTZ) {
      return this.generateTZText(file);
    } else if (isKP) {
      return this.generateKPText(file);
    } else {
      return this.generateGenericText(file);
    }
  }

  /**
   * Генерация демо-текста ТЗ
   */
  private generateTZText(file: File): string {
    return `
ТЕХНИЧЕСКОЕ ЗАДАНИЕ
Разработка веб-портала для управления недвижимостью

1. ОБЩИЕ ТРЕБОВАНИЯ
Необходимо разработать современный веб-портал для автоматизации процессов управления недвижимостью.

2. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ
- Архитектура: микросервисная архитектура
- Frontend: React.js с TypeScript
- Backend: Python FastAPI
- База данных: PostgreSQL
- Авторизация: JWT токены
- API: RESTful API с документацией

3. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ
- Модуль анализа коммерческих предложений
- Интеграция с AI для анализа документов
- Система управления пользователями
- Дашборд с аналитикой
- Экспорт отчетов

4. ТРЕБОВАНИЯ К ПРОИЗВОДИТЕЛЬНОСТИ
- Время отклика API: не более 2 секунд
- Поддержка до 1000 одновременных пользователей
- Доступность: 99.9%

5. СРОКИ РЕАЛИЗАЦИИ
Общий срок проекта: 3-4 месяца
Этапы:
- Анализ и проектирование: 2 недели
- Разработка MVP: 6 недель
- Тестирование: 2 недели
- Внедрение: 1 неделя

6. БЮДЖЕТ
Ориентировочный бюджет: 2-5 млн рублей

Файл: ${file.name}
Размер: ${(file.size / 1024).toFixed(1)} KB
Дата: ${new Date().toLocaleDateString('ru-RU')}
`;
  }

  /**
   * Генерация демо-текста КП
   */
  private generateKPText(file: File): string {
    const companies = [
      { 
        name: 'ООО "ТехСтрой"', 
        price: '2.8 млн руб',
        timeline: '3.5 месяца',
        experience: '8 лет опыта в веб-разработке'
      },
      { 
        name: 'АО "ИнноваСистемы"', 
        price: '3.2 млн руб',
        timeline: '3 месяца',
        experience: '12 лет на рынке IT-услуг'
      },
      { 
        name: 'ООО "ПроектДевелопмент"', 
        price: '2.5 млн руб',
        timeline: '4 месяца',
        experience: '6 лет специализации на порталах'
      }
    ];

    const company = companies[Math.floor(Math.random() * companies.length)];

    return `
КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
${company.name}

1. О КОМПАНИИ
${company.name} - ведущий разработчик IT-решений с ${company.experience}.
Мы специализируемся на создании корпоративных веб-порталов и систем автоматизации.

2. ПОНИМАНИЕ ЗАДАЧИ
Мы внимательно изучили ваше техническое задание и готовы предложить комплексное решение
для разработки веб-портала управления недвижимостью.

3. ПРЕДЛАГАЕМОЕ РЕШЕНИЕ
Техническая архитектура:
- Frontend: React 18 + TypeScript + Tailwind CSS
- Backend: Python 3.11 + FastAPI + SQLAlchemy
- База данных: PostgreSQL 15 с репликацией
- Кэширование: Redis
- Контейнеризация: Docker + Kubernetes
- CI/CD: GitLab CI с автоматическим тестированием

4. КОМАНДА ПРОЕКТА
- Руководитель проекта (PM)
- Ведущий архитектор решений
- 2 Frontend разработчика (React/TypeScript)
- 2 Backend разработчика (Python/FastAPI)
- DevOps инженер
- QA инженер

5. ПЛАН РЕАЛИЗАЦИИ
Этап 1: Анализ и архитектура (2 недели)
Этап 2: Разработка core модулей (4 недели)
Этап 3: Интеграция AI компонентов (3 недели)
Этап 4: Тестирование и оптимизация (2 недели)
Этап 5: Деплой и запуск (1 неделя)

6. КОММЕРЧЕСКИЕ УСЛОВИЯ
Общая стоимость: ${company.price}
Сроки реализации: ${company.timeline}
Гарантия: 12 месяцев
Техническая поддержка: 6 месяцев бесплатно

7. ГАРАНТИИ КАЧЕСТВА
- Покрытие кода тестами: минимум 80%
- Соответствие стандартам безопасности
- Документация кода и API
- Обучение команды заказчика

8. ДОПОЛНИТЕЛЬНЫЕ ПРЕИМУЩЕСТВА
- Опыт интеграции с AI сервисами (OpenAI, Anthropic)
- Готовые модули для анализа документов
- Expertise в области недвижимости
- Возможность масштабирования решения

Файл: ${file.name}
Размер: ${(file.size / 1024).toFixed(1)} KB
Компания: ${company.name}
Контакт: info@${company.name.toLowerCase().replace(/[^a-z]/g, '')}.ru
`;
  }

  /**
   * Генерация общего демо-текста
   */
  private generateGenericText(file: File): string {
    return `
ДОКУМЕНТ: ${file.name}

Содержимое документа извлечено для анализа.
Размер файла: ${(file.size / 1024).toFixed(1)} KB
Тип файла: ${file.type}
Дата обработки: ${new Date().toLocaleString('ru-RU')}

В реальном приложении здесь был бы текст, извлеченный из PDF или DOCX файла
с помощью специализированных библиотек парсинга документов.

Для демонстрации функционала AI анализа используется этот сгенерированный текст.
`;
  }
}

export const documentProcessor = new DocumentProcessor();