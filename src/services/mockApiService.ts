/**
 * Mock API Service для разработки и тестирования
 */

import { AnalysisResult, ComplianceAnalysis, KPSummary, PreliminaryRecommendation } from './apiClient';

// Генератор случайных данных для тестирования
const generateMockAnalysis = (kpName: string, companyName: string): AnalysisResult => {
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
  ): Promise<{ success: boolean; data: AnalysisResult; error?: string }> {
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
    analysisResults: AnalysisResult[],
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
    analysisResults: AnalysisResult[],
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
  }
};