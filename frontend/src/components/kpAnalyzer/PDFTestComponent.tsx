/**
 * PDF Test Component for KP Analyzer
 * Used to test the enhanced ReactPDFExporter with sample data
 */

import React from 'react';
import WorkingPDFExporter from './WorkingPDFExporter';

// Sample comprehensive analysis data that matches expected format
const sampleAnalysisData = {
  id: 'test_12345',
  createdAt: new Date().toISOString(),
  documentName: 'Коммерческое предложение по разработке информационной системы.pdf',
  companyName: 'ООО "ТехноСтрой"',
  overallScore: 87,
  confidenceScore: 92,
  processingDuration: 45.7,
  aiModel: 'claude-3-5-sonnet-20241022',
  complianceLevel: 'high',
  
  financials: {
    totalBudget: {
      amount: 5000000,
      symbol: '₽',
      currency: 'RUB'
    },
    currencies: [
      {
        code: 'RUB',
        symbol: '₽',
        name: 'Российский рубль',
        amount: 5000000
      },
      {
        code: 'USD',
        symbol: '$',
        name: 'Доллар США',
        amount: 65000
      }
    ],
    paymentTerms: [
      'Поэтапная оплата по результатам',
      'Предоплата 30%',
      'Окончательный расчет в течение 10 дней'
    ]
  },
  
  sections: {
    budget_compliance: {
      title: 'Бюджетное соответствие',
      score: 92,
      status: 'excellent',
      summary: 'Бюджет проекта соответствует рыночным ценам и ожиданиям заказчика. Стоимость разработки обоснована и включает все необходимые этапы: проектирование, разработку, тестирование и внедрение.',
      keyPoints: [
        'Стоимость проекта: 5 000 000 рублей',
        'Включена поэтапная оплата',
        'Соответствует рыночным ценам',
        'Детализированы все статьи расходов'
      ],
      recommendations: [
        'Зафиксировать окончательную стоимость в договоре',
        'Предусмотреть возможность корректировки при изменении требований',
        'Установить четкие критерии приемки этапов'
      ],
      risk_level: 'low'
    },
    
    timeline_compliance: {
      title: 'Временные рамки',
      score: 78,
      status: 'good',
      summary: 'Сроки выполнения проекта реалистичны и учитывают сложность разработки. Предусмотрены промежуточные этапы и демонстрации результатов.',
      keyPoints: [
        'Общий срок проекта: 6 месяцев',
        'Первая демо-версия через 2 месяца',
        'Поэтапная сдача результатов',
        'Включено время на тестирование'
      ],
      recommendations: [
        'Добавить буферное время для непредвиденных задач',
        'Детализировать план по неделям',
        'Предусмотреть возможность параллельной разработки'
      ],
      risk_level: 'low'
    },
    
    technical_compliance: {
      title: 'Техническое соответствие',
      score: 95,
      status: 'excellent',
      summary: 'Техническое решение полностью соответствует современным стандартам разработки. Выбранный стек технологий надежен и проверен в промышленных проектах.',
      keyPoints: [
        'Backend: Python 3.11, FastAPI, PostgreSQL',
        'Frontend: React 18, TypeScript, Material-UI',
        'Инфраструктура: Docker, Kubernetes, Redis',
        'Современные стандарты безопасности'
      ],
      recommendations: [
        'Рассмотреть возможность использования микросервисной архитектуры',
        'Добавить систему мониторинга и логирования',
        'Предусмотреть автоматизированное тестирование'
      ],
      risk_level: 'low'
    },
    
    team_expertise: {
      title: 'Команда и экспертиза',
      score: 85,
      status: 'excellent',
      summary: 'Состав команды соответствует требованиям проекта. Включены все необходимые специалисты с достаточным уровнем экспертизы.',
      keyPoints: [
        'Руководитель проекта: 1 специалист',
        'Backend разработчики: 3 специалиста',
        'Frontend разработчики: 2 специалиста',
        'DevOps и QA инженеры включены'
      ],
      recommendations: [
        'Предоставить резюме ключевых участников',
        'Определить заместителей для критически важных ролей',
        'Организовать знакомство команды с заказчиком'
      ],
      risk_level: 'medium'
    }
  },
  
  executiveSummary: {
    keyStrengths: [
      'Сильная техническая команда с опытом аналогичных проектов',
      'Современный и надежный технологический стек',
      'Реалистичные сроки и бюджет проекта',
      'Поэтапная методология разработки с промежуточными демонстрациями',
      'Включение всех необходимых этапов: от проектирования до внедрения'
    ],
    
    criticalWeaknesses: [
      'Отсутствует детальный план управления рисками',
      'Не указаны конкретные метрики качества кода',
      'Недостаточно информации о системе резервного копирования',
      'Не описана процедура передачи знаний заказчику'
    ],
    
    recommendation: 'На основе комплексного анализа, система DevAssist Pro рекомендует принять данное коммерческое предложение. Предложение демонстрирует высокий уровень профессионализма, реалистичный подход к планированию и использование современных технологий. Однако рекомендуется дополнительно проработать вопросы управления рисками и детализации технических требований перед подписанием договора.',
    
    nextSteps: [
      'Провести техническое интервью с ключевыми участниками команды',
      'Запросить примеры аналогичных реализованных проектов',
      'Детализировать требования к системе безопасности',
      'Согласовать процедуры приемки результатов по этапам',
      'Подготовить детальное техническое задание',
      'Определить KPI и метрики успешности проекта'
    ]
  }
};

const PDFTestComponent: React.FC = () => {
  const handleExportStart = () => {
    console.log('🔄 Начинается генерация PDF отчета...');
  };

  const handleExportSuccess = (filename: string) => {
    console.log(`✅ PDF отчет успешно создан: ${filename}`);
    alert(`PDF отчет успешно создан и скачан!\nИмя файла: ${filename}`);
  };

  const handleExportError = (error: string) => {
    console.error('❌ Ошибка при создании PDF:', error);
    alert(`Ошибка при создании PDF: ${error}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🧪 Тестирование PDF генератора
        </h2>
        
        <p className="text-gray-600 mb-6">
          Нажмите кнопку ниже для генерации тестового PDF отчета с образцами данных анализа КП.
          Отчет будет содержать все разделы: исполнительное резюме, детальный анализ разделов,
          финансовую информацию и рекомендации.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Тестовые данные:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Компания: {sampleAnalysisData.companyName}</li>
            <li>• Документ: {sampleAnalysisData.documentName}</li>
            <li>• Общая оценка: {sampleAnalysisData.overallScore}/100</li>
            <li>• Уверенность ИИ: {sampleAnalysisData.confidenceScore}%</li>
            <li>• Бюджет проекта: {sampleAnalysisData.financials.totalBudget.amount.toLocaleString('ru-RU')} {sampleAnalysisData.financials.totalBudget.symbol}</li>
          </ul>
        </div>

        <WorkingPDFExporter
          analysisData={sampleAnalysisData}
          filename="Test_KP_Analysis_Report.pdf"
        >
          🔬 Генерировать тестовый PDF отчет
        </WorkingPDFExporter>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">ℹ️ Информация о тесте:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Встроенные шрифты с поддержкой кириллицы (Helvetica)</li>
            <li>• Рабочее решение из DevAssist-Pro-2-final</li>
            <li>• Проверенная генерация PDF с русским текстом</li>
            <li>• Простое и надежное форматирование</li>
            <li>• Таблицы результатов и рекомендации</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PDFTestComponent;