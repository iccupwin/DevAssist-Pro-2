/**
 * Enhanced Mock API Service - Предоставляет реалистичные mock данные для тестирования КП Анализатора
 * Симулирует все функции backend API с реалистичными задержками и ответами
 */

import { AnalysisResult as OldAnalysisResult, ComplianceAnalysis, KPSummary, PreliminaryRecommendation } from './apiClient';
import { 
  KPSummaryData, 
  ComparisonAIResult as ComparisonResult, 
  RecommendationResult,
  KPAnalysisResult,
  KPAnalysisProgress as AnalysisProgress 
} from '../types/kpAnalyzer';

// Генератор случайных данных для тестирования
const generateMockAnalysis = (kpName: string, companyName: string): OldAnalysisResult => {
  const complianceScore = Math.floor(Math.random() * 40) + 60; // 60-100%
  
  const mockCompliance: ComplianceAnalysis = {
    compliance_score: complianceScore,
    missing_requirements: [
      'Детализация API документации',
      'Схема базы данных',
      'План тестирования'
    ].slice(0, Math.floor(Math.random() * 3)),
    additional_features: [
      'Дополнительные аналитические отчеты',
      'Интеграция с внешними системами',
      'Расширенная система уведомлений'
    ].slice(0, Math.floor(Math.random() * 3)),
    sections: [
      { name: 'Техническое решение', compliance: complianceScore + Math.random() * 10 - 5, details: 'Соответствует требованиям с небольшими замечаниями' },
      { name: 'Функциональность', compliance: complianceScore + Math.random() * 10 - 5, details: 'Полностью покрывает требования' },
      { name: 'Безопасность', compliance: complianceScore + Math.random() * 10 - 5, details: 'Базовые меры безопасности реализованы' },
    ]
  };

  const mockRecommendation: PreliminaryRecommendation = {
    strength: [
      'Качественное техническое решение',
      'Опытная команда разработчиков',
      'Детальная проработка архитектуры'
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    weakness: [
      'Высокая стоимость реализации',
      'Длительные сроки разработки',
      'Недостаточная детализация тестирования'
    ].slice(0, Math.floor(Math.random() * 2)),
    summary: `${companyName} предлагает ${complianceScore > 80 ? 'качественное' : 'приемлемое'} решение с соответствием ${complianceScore}% требований ТЗ.`
  };

  return {
    tz_name: 'Техническое задание на разработку веб-портала',
    kp_name: kpName,
    company_name: companyName,
    tech_stack: 'React, Node.js, PostgreSQL, Docker',
    pricing: `${Math.floor(Math.random() * 500 + 800)} тыс. руб.`,
    timeline: `${Math.floor(Math.random() * 3 + 2)} месяца`,
    comparison_result: mockCompliance,
    preliminary_recommendation: mockRecommendation,
    ratings: {
      technical: Math.floor(Math.random() * 3) + 3,
      price: Math.floor(Math.random() * 3) + 3,
      timeline: Math.floor(Math.random() * 3) + 3,
      experience: Math.floor(Math.random() * 3) + 3,
    },
    comments: {
      technical: 'Техническое решение соответствует современным стандартам',
      price: 'Цена находится в среднем диапазоне рынка',
      timeline: 'Реалистичные сроки реализации',
      experience: 'Команда имеет релевантный опыт',
    }
  };
};

const mockCompanies = [
  'ООО "ТехноСофт"',
  'ООО "ДиджиталПро"',
  'ООО "ИнфоСистемы"',
  'ООО "КодЛаб"',
  'ООО "ВебСтудия"',
];

// Константы для симуляции реалистичного API
const MOCK_DELAY_MIN = 1500; // Минимальная задержка
const MOCK_DELAY_MAX = 3000; // Максимальная задержка

// Утилита для симуляции задержки API
const simulateApiDelay = (min = MOCK_DELAY_MIN, max = MOCK_DELAY_MAX): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Mock данные для технологий
const MOCK_TECH_STACKS = [
  'React, Node.js, PostgreSQL, Docker',
  'Vue.js, Python, MongoDB, Kubernetes',
  'Angular, .NET Core, SQL Server, Azure',
  'React Native, Spring Boot, MySQL, AWS',
  'Flutter, Django, Redis, GCP',
  'Next.js, FastAPI, PostgreSQL, Docker Swarm',
  'Laravel, Vue.js, MySQL, DigitalOcean',
  'Symfony, React, PostgreSQL, Heroku'
];

// Mock данные для ценообразования
const generateMockPricing = (): string => {
  const basePrice = Math.floor(Math.random() * 8000000) + 2000000; // От 2 до 10 млн
  const format = Math.random() > 0.5 ? 'фиксированная цена' : 'почасовая оплата';
  
  if (format === 'фиксированная цена') {
    return `${basePrice.toLocaleString('ru-RU')} руб. фиксированная цена`;
  } else {
    const hourlyRate = Math.floor(Math.random() * 3000) + 2000; // От 2000 до 5000 руб/час
    const hours = Math.floor(basePrice / hourlyRate);
    return `${hourlyRate.toLocaleString('ru-RU')} руб/час (~${hours} часов)`;
  }
};

// Mock данные для сроков
const MOCK_TIMELINES = [
  '3 месяца',
  '4-5 месяцев',
  '6 месяцев',
  '8-10 месяцев',
  '12 месяцев',
  '18 месяцев',
  '2-3 этапа по 4 месяца',
  '5 спринтов по 6 недель'
];

// Mock данные для опыта
const generateMockExperience = (): string => {
  const projects = Math.floor(Math.random() * 50) + 10;
  const years = Math.floor(Math.random() * 15) + 3;
  const teamSize = Math.floor(Math.random() * 20) + 5;
  
  return `${projects} проектов за ${years} лет работы, команда ${teamSize} разработчиков`;
};

export const mockApiService = {
  // Загрузка файлов
  async uploadFiles(files: {
    tzFile?: File;
    kpFiles?: File[];
    additionalFiles?: File[];
  }): Promise<{
    success: boolean;
    data: {
      tz_file: { filePath: string; originalName: string } | null;
      kp_files: { filePath: string; originalName: string }[];
      additional_files: { filePath: string; originalName: string }[];
    };
    error?: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      data: {
        tz_file: files.tzFile ? {
          filePath: `/uploads/tz/${files.tzFile.name}`,
          originalName: files.tzFile.name
        } : null,
        kp_files: files.kpFiles?.map(file => ({
          filePath: `/uploads/kp/${file.name}`,
          originalName: file.name
        })) || [],
        additional_files: files.additionalFiles?.map(file => ({
          filePath: `/uploads/additional/${file.name}`,
          originalName: file.name
        })) || []
      }
    };
  },

  // Анализ одного КП
  async analyzeKP(
    tzFile: string,
    kpFile: string,
    additionalFiles?: string[],
    modelId?: string
  ): Promise<{ success: boolean; data: OldAnalysisResult; error?: string }> {
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const kpName = `КП_${Math.floor(Math.random() * 100)}.pdf`;
    const companyName = mockCompanies[Math.floor(Math.random() * mockCompanies.length)];
    
    return {
      success: true,
      data: generateMockAnalysis(kpName, companyName)
    };
  },

  // Сравнение всех КП
  async compareAllKP(
    analysisResults: OldAnalysisResult[],
    modelId?: string
  ): Promise<{ success: boolean; data: string; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const sorted = [...analysisResults].sort((a, b) => 
      b.comparison_result.compliance_score - a.comparison_result.compliance_score
    );

    const comparisonText = `
## 📊 Сравнительный анализ коммерческих предложений

### 🏆 Рейтинг предложений:

${sorted.map((result, index) => `
**${index + 1}. ${result.company_name}**
- Соответствие ТЗ: ${result.comparison_result.compliance_score}%
- Стоимость: ${result.pricing}
- Сроки: ${result.timeline}
- Технологии: ${result.tech_stack}

*Краткая оценка:* ${result.preliminary_recommendation.summary}
`).join('\n')}

### 📋 Общие выводы:

- Лучшее предложение: **${sorted[0].company_name}** с соответствием ${sorted[0].comparison_result.compliance_score}%
- Средняя стоимость: ${Math.round(sorted.reduce((sum, r) => sum + parseInt(r.pricing.replace(/\D/g, '')), 0) / sorted.length)} тыс. руб.
- Средние сроки: ${Math.round(sorted.reduce((sum, r) => sum + parseInt(r.timeline.replace(/\D/g, '')), 0) / sorted.length)} месяцев

### 🎯 Рекомендации:

1. **Техническая экспертиза**: Все предложения требуют дополнительной технической проработки
2. **Бюджет**: Рассмотрите возможность оптимизации бюджета с лидирующими компаниями
3. **Сроки**: Обратите внимание на реалистичность предложенных временных рамок
    `;

    return {
      success: true,
      data: comparisonText
    };
  },

  // Генерация финального отчета
  async generateReport(
    analysisResults: OldAnalysisResult[],
    modelId?: string
  ): Promise<{ success: boolean; data: string; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 4000));

    const bestResult = analysisResults.reduce((best, current) => 
      current.comparison_result.compliance_score > best.comparison_result.compliance_score ? current : best
    );

    const reportText = `
# 📋 Итоговый отчет по анализу коммерческих предложений

## 🎯 Цель анализа
Выбор оптимального исполнителя для разработки веб-портала на основе анализа соответствия техническому заданию.

## 📊 Анализируемые предложения
Проанализировано **${analysisResults.length}** коммерческих предложений от различных компаний.

## 🏆 Рекомендуемое решение

### ${bestResult.company_name}
- **Соответствие ТЗ:** ${bestResult.comparison_result.compliance_score}%
- **Стоимость:** ${bestResult.pricing}
- **Сроки реализации:** ${bestResult.timeline}
- **Технический стек:** ${bestResult.tech_stack}

### Преимущества:
${bestResult.preliminary_recommendation.strength.map(s => `- ${s}`).join('\n')}

### Риски:
${bestResult.preliminary_recommendation.weakness.map(w => `- ${w}`).join('\n')}

## 📈 Детальный анализ

### Критерии оценки:
1. **Техническое соответствие** (40%)
2. **Стоимость реализации** (25%)
3. **Сроки выполнения** (20%)
4. **Опыт команды** (15%)

### Результаты по компаниям:
${analysisResults.map((result, index) => `
#### ${index + 1}. ${result.company_name}
- Общая оценка: ${result.comparison_result.compliance_score}%
- Стоимость: ${result.pricing}
- Срок: ${result.timeline}
- Замечания: ${result.preliminary_recommendation.summary}
`).join('\n')}

## 🎯 Заключение и рекомендации

1. **Выбор исполнителя:** Рекомендуется ${bestResult.company_name} как наиболее соответствующий требованиям проекта.

2. **Следующие шаги:**
   - Провести техническое интервью с командой
   - Уточнить детали реализации спорных моментов
   - Согласовать план поэтапной разработки
   - Заключить договор с детализированными требованиями

3. **Контроль рисков:**
   - Установить промежуточные контрольные точки
   - Предусмотреть штрафные санкции за нарушение сроков
   - Включить требования по документированию кода

---
*Отчет сгенерирован автоматически на основе AI-анализа предоставленных документов*
    `;

    return {
      success: true,
      data: reportText
    };
  },

  // Проверка здоровья сервиса
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  },

  // ============== НОВЫЕ МЕТОДЫ ДЛЯ КП АНАЛИЗАТОРА ==============

  /**
   * Симуляция извлечения структурированных данных из КП
   */
  async extractKPSummaryData(kpText: string, fileName: string): Promise<KPSummaryData> {
    await simulateApiDelay();
    
    const companyIndex = Math.floor(Math.random() * mockCompanies.length);
    const techIndex = Math.floor(Math.random() * MOCK_TECH_STACKS.length);
    const timelineIndex = Math.floor(Math.random() * MOCK_TIMELINES.length);
    
    return {
      company_name: mockCompanies[companyIndex],
      tech_stack: MOCK_TECH_STACKS[techIndex],
      pricing: generateMockPricing(),
      timeline: MOCK_TIMELINES[timelineIndex],
      experience: generateMockExperience(),
      approach: `Комплексный подход к разработке с использованием современных методологий. ${fileName.includes('agile') ? 'Agile/Scrum методология' : 'Waterfall методология'} с еженедельными ретроспективами.`,
      team_structure: `Команда включает: тимлид, ${Math.floor(Math.random() * 3) + 2} frontend разработчика, ${Math.floor(Math.random() * 3) + 2} backend разработчика, DevOps инженер, QA тестировщик, UI/UX дизайнер.`,
      guarantees: `Гарантия ${Math.floor(Math.random() * 12) + 12} месяцев на разработанное ПО, техническая поддержка 24/7, SLA 99.5% аптайма.`,
      risks: fileName.includes('риск') || Math.random() > 0.7 ? 
        'Выявлены потенциальные риски в интеграции с внешними системами и масштабировании нагрузки.' :
        'Основные риски минимизированы благодаря опыту команды и проверенным технологиям.',
      additional_services: Math.random() > 0.5 ? 
        'Включены дополнительные услуги: техническая документация, обучение пользователей, миграция данных.' :
        'Базовая поставка без дополнительных услуг.'
    };
  },

  /**
   * Симуляция сравнения ТЗ и КП
   */
  async compareTzKp(tzText: string, kpText: string, fileName: string): Promise<ComparisonResult> {
    await simulateApiDelay(2000, 4000); // Более длительная операция
    
    // Генерируем реалистичные оценки
    const compliance = Math.floor(Math.random() * 40) + 60; // 60-100%
    const technical = Math.floor(Math.random() * 35) + 65; // 65-100%
    const commercial = Math.floor(Math.random() * 30) + 70; // 70-100%
    const experience = Math.floor(Math.random() * 25) + 75; // 75-100%
    const timeline = Math.floor(Math.random() * 20) + 80; // 80-100%
    
    // Общий балл как weighted average
    const overall_score = Math.round(
      compliance * 0.3 + 
      technical * 0.25 + 
      commercial * 0.2 + 
      experience * 0.15 + 
      timeline * 0.1
    );

    const strengths = [
      'Полное соответствие функциональным требованиям',
      'Современный технологический стек',
      'Конкурентоспособная цена',
      'Реалистичные сроки выполнения',
      'Опытная команда разработчиков'
    ].slice(0, Math.floor(Math.random() * 3) + 2);

    const weaknesses = [
      'Недостаточно детально описана архитектура системы',
      'Отсутствуют детали по тестированию',
      'Не указаны метрики производительности',
      'Недостаточно информации о безопасности'
    ].slice(0, Math.floor(Math.random() * 2) + 1);

    const recommendations = [
      'Запросить дополнительную техническую документацию',
      'Уточнить детали по интеграции с существующими системами',
      'Обсудить план миграции данных',
      'Определить ключевые метрики производительности'
    ].slice(0, Math.floor(Math.random() * 2) + 2);

    return {
      overall_score,
      compliance_percentage: compliance,
      technical_score: technical,
      commercial_score: commercial,
      experience_score: experience,
      timeline_score: timeline,
      strengths,
      weaknesses,
      recommendations,
      detailed_analysis: `Предложение от компании демонстрирует ${overall_score > 80 ? 'высокий' : overall_score > 60 ? 'средний' : 'низкий'} уровень соответствия требованиям ТЗ. ${fileName.includes('лучш') ? 'Особенно сильны позиции в техническом решении.' : 'Требуется доработка ряда технических аспектов.'}`
    };
  },

  /**
   * Симуляция генерации рекомендаций
   */
  async generateKPRecommendation(
    analysisResults: KPAnalysisResult[], 
    tzText: string
  ): Promise<RecommendationResult> {
    await simulateApiDelay(3000, 5000); // Самая длительная операция
    
    // Сортируем результаты по общему баллу
    const sortedResults = [...analysisResults].sort((a, b) => b.score - a.score);
    const topResult = sortedResults[0];
    const worstResult = sortedResults[sortedResults.length - 1];
    
    const executive_summary = `
Проведен анализ ${analysisResults.length} коммерческих предложений на соответствие техническому заданию. 
Лучший результат показало предложение "${topResult.kpFileName}" с общим баллом ${topResult.score}%.
Худший результат у "${worstResult.kpFileName}" - ${worstResult.score}%.
Средний балл по всем предложениям: ${Math.round(analysisResults.reduce((sum, r) => sum + r.score, 0) / analysisResults.length)}%.
    `.trim();

    const detailed_comparison = analysisResults.map(result => `
**${result.kpFileName}** (${result.score}%)
- Техническое соответствие: ${result.analysis.technical}%
- Коммерческие условия: ${result.analysis.commercial}%
- Опыт команды: ${result.analysis.experience}%
- Сроки: ${result.analysis.timeline || 'Не указано'}%
    `).join('\n');

    const risk_analysis = `
Основные риски проекта:
- Интеграционные риски: ${Math.random() > 0.5 ? 'Средние' : 'Низкие'}
- Технические риски: ${Math.random() > 0.5 ? 'Низкие' : 'Средние'}
- Бюджетные риски: ${topResult.score > 80 ? 'Низкие' : 'Средние'}
- Временные риски: ${analysisResults.some(r => r.analysis.timeline && r.analysis.timeline > 80) ? 'Низкие' : 'Средние'}
    `;

    const final_recommendation = topResult.score > 85 
      ? `Рекомендуется выбрать предложение "${topResult.kpFileName}" как наиболее соответствующее требованиям.`
      : topResult.score > 70
      ? `Предложение "${topResult.kpFileName}" рекомендуется с условием доработки выявленных недостатков.`
      : `Ни одно из предложений не достигает высокого уровня соответствия. Рекомендуется повторный запрос предложений.`;

    return {
      executive_summary,
      detailed_comparison,
      risk_analysis,
      final_recommendation,
      recommended_vendor: topResult.kpFileName,
      confidence_level: topResult.score > 85 ? 'Высокий' : topResult.score > 70 ? 'Средний' : 'Низкий'
    };
  },

  /**
   * Симуляция полного анализа КП с прогрессом
   */
  async analyzeKPDocument(
    tzText: string,
    kpText: string,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<KPAnalysisResult> {
    // Шаг 1: Извлечение данных (30%)
    onProgress?.(10);
    await simulateApiDelay(1000, 2000);
    onProgress?.(30);
    
    const summaryData = await this.extractKPSummaryData(kpText, fileName);
    
    // Шаг 2: Сравнение с ТЗ (70%)
    onProgress?.(50);
    await simulateApiDelay(1500, 2500);
    onProgress?.(70);
    
    const comparisonResult = await this.compareTzKp(tzText, kpText, fileName);
    
    // Шаг 3: Финализация (100%)
    onProgress?.(90);
    await simulateApiDelay(500, 1000);
    onProgress?.(100);

    return {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      kpFileName: fileName,
      score: comparisonResult.overall_score,
      extractedData: summaryData,
      analysis: {
        compliance: comparisonResult.compliance_percentage,
        technical: comparisonResult.technical_score,
        commercial: comparisonResult.commercial_score,
        experience: comparisonResult.experience_score,
        timeline: comparisonResult.timeline_score,
        strengths: comparisonResult.strengths,
        weaknesses: comparisonResult.weaknesses,
        recommendations: comparisonResult.recommendations,
        detailedAnalysis: comparisonResult.detailed_analysis
      },
      timestamp: new Date(),
      status: 'completed' as const
    };
  },

  /**
   * Симуляция анализа нескольких КП
   */
  async analyzeAllKPDocuments(
    tzText: string,
    kpFiles: { text: string; fileName: string }[],
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<KPAnalysisResult[]> {
    const results: KPAnalysisResult[] = [];
    const totalKPs = kpFiles.length;

    for (let i = 0; i < kpFiles.length; i++) {
      const kpFile = kpFiles[i];
      
      // Обновляем общий прогресс
      onProgress?.({
        currentKP: kpFile.fileName,
        progress: Math.round((i / totalKPs) * 100),
        totalKPs,
        completedKPs: i,
        isAnalyzing: true
      });

      // Анализируем каждый КП с внутренним прогрессом
      const result = await this.analyzeKPDocument(
        tzText,
        kpFile.text,
        kpFile.fileName,
        (kpProgress: number) => {
          const overallProgress = Math.round(((i + kpProgress / 100) / totalKPs) * 100);
          onProgress?.({
            currentKP: kpFile.fileName,
            progress: overallProgress,
            totalKPs,
            completedKPs: i,
            isAnalyzing: true
          });
        }
      );

      results.push(result);
    }

    // Завершение анализа
    onProgress?.({
      currentKP: '',
      progress: 100,
      totalKPs,
      completedKPs: totalKPs,
      isAnalyzing: false
    });

    return results;
  },

  /**
   * Симуляция загрузки файла и извлечения текста
   */
  async extractTextFromFile(file: File): Promise<string> {
    await simulateApiDelay(500, 1500);
    
    const fileName = file.name.toLowerCase();
    
    // Генерируем mock контент на основе имени файла
    if (fileName.includes('тз') || fileName.includes('техническое') || fileName.includes('задание')) {
      return `
Техническое задание на разработку веб-приложения

1. ОБЩИЕ ТРЕБОВАНИЯ
Необходимо разработать современное веб-приложение с использованием актуальных технологий.

2. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ
- Система авторизации и регистрации пользователей
- Личный кабинет пользователя
- Административная панель
- API для мобильного приложения
- Интеграция с внешними сервисами

3. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ
- Frontend: React.js или Vue.js
- Backend: Node.js, Python (Django/FastAPI) или .NET Core
- База данных: PostgreSQL или MySQL
- Deployment: Docker, Kubernetes
- Безопасность: HTTPS, JWT токены, защита от CSRF/XSS

4. ТРЕБОВАНИЯ К ПРОИЗВОДИТЕЛЬНОСТИ
- Время загрузки страницы не более 3 секунд
- Поддержка 1000+ одновременных пользователей
- 99.5% uptime

5. БЮДЖЕТ И СРОКИ
Бюджет: до 10 000 000 рублей
Срок выполнения: 6-8 месяцев
      `.trim();
    }
    
    if (fileName.includes('кп') || fileName.includes('предложение') || fileName.includes('коммерческое')) {
      const companyName = mockCompanies[Math.floor(Math.random() * mockCompanies.length)];
      return `
Коммерческое предложение от ${companyName}

ОПИСАНИЕ КОМПАНИИ
${companyName} - ведущая IT-компания с опытом разработки более 50 проектов.
Команда состоит из опытных разработчиков и дизайнеров.

ПРЕДЛАГАЕМОЕ РЕШЕНИЕ
Мы предлагаем разработать современное веб-приложение с использованием:
- Frontend: ${MOCK_TECH_STACKS[Math.floor(Math.random() * MOCK_TECH_STACKS.length)]}
- Архитектура: микросервисная
- Развертывание: Docker + Kubernetes

КОММЕРЧЕСКИЕ УСЛОВИЯ
Стоимость: ${generateMockPricing()}
Срок выполнения: ${MOCK_TIMELINES[Math.floor(Math.random() * MOCK_TIMELINES.length)]}

ГАРАНТИИ
- Гарантия 12 месяцев
- Техническая поддержка 24/7
- Бесплатные обновления в течение 6 месяцев

ОПЫТ КОМАНДЫ
${generateMockExperience()}
      `.trim();
    }

    // Для других файлов - общий текст
    return `Извлеченный текст из файла: ${file.name}\n\nЭто mock содержимое для тестирования функциональности системы. В реальной системе здесь будет содержимое загруженного документа.`;
  }
};