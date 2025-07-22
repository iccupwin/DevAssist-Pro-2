import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { KPAnalyzerMain } from './KPAnalyzerMain';

const meta = {
  title: 'KP Analyzer/Main',
  component: KPAnalyzerMain,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Главный компонент КП Анализатора - центральная часть системы анализа коммерческих предложений.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    analysisMode: {
      control: { type: 'select' },
      options: ['upload', 'analysis', 'results'],
      description: 'Текущий режим анализатора',
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Состояние загрузки',
    },
  },
} satisfies Meta<typeof KPAnalyzerMain>;

export default meta;
type Story = StoryObj<typeof meta>;

// Режим загрузки файлов
export const UploadMode: Story = {
  args: {
    analysisMode: 'upload',
    isLoading: false,
    onFileUpload: fn(),
    onStartAnalysis: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Режим загрузки документов ТЗ и КП.',
      },
    },
  },
};

// Режим анализа
export const AnalysisMode: Story = {
  args: {
    analysisMode: 'analysis',
    isLoading: true,
    analysisProgress: 45,
    currentStep: 'Анализ технических требований',
    onCancelAnalysis: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Режим выполнения анализа с прогрессом.',
      },
    },
  },
};

// Режим результатов
export const ResultsMode: Story = {
  args: {
    analysisMode: 'results',
    isLoading: false,
    analysisResults: {
      complianceScore: 85,
      technicalScore: 90,
      financialScore: 80,
      timelineScore: 85,
      contractorScore: 88,
      recommendations: [
        'Уточнить сроки поставки материалов',
        'Запросить детализацию по гарантийным обязательствам',
        'Проверить соответствие техническим требованиям раздела 3.2',
      ],
      risks: [
        'Превышение бюджета на 15%',
        'Возможная задержка на 2 недели',
      ],
      strengths: [
        'Опытная команда исполнителей',
        'Качественные материалы',
        'Подробная техническая документация',
      ],
    },
    onExportReport: fn(),
    onStartNewAnalysis: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Режим отображения результатов анализа с оценками и рекомендациями.',
      },
    },
  },
};

// Состояние ошибки
export const ErrorState: Story = {
  args: {
    analysisMode: 'upload',
    error: {
      message: 'Ошибка обработки файла',
      details: 'Не удалось извлечь текст из PDF документа. Попробуйте другой формат.',
    },
    onRetry: fn(),
    onClearError: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Состояние ошибки с возможностью повторной попытки.',
      },
    },
  },
};

// Демо с реальными данными
export const Demo: Story = {
  render: () => {
    const mockProps = {
      analysisMode: 'results' as const,
      isLoading: false,
      analysisResults: {
        complianceScore: 87,
        technicalScore: 92,
        financialScore: 85,
        timelineScore: 82,
        contractorScore: 90,
        recommendations: [
          'Рекомендуется принять предложение с условием уточнения сроков',
          'Запросить дополнительные гарантии по разделу благоустройства',
          'Согласовать поэтапную схему оплаты',
        ],
        risks: [
          'Минимальный риск превышения сроков на 1-2 недели',
          'Возможное удорожание материалов на 3-5%',
        ],
        strengths: [
          'Превосходное соотношение цена/качество',
          'Команда с опытом реализации аналогичных проектов',
          'Полное соответствие техническому заданию',
          'Конкурентные сроки выполнения',
        ],
      },
      uploadedFiles: {
        tz: { name: 'ТЗ_Жилой_комплекс.pdf', size: 2048000, uploadedAt: new Date() },
        kp: [
          { name: 'КП_СтройИнвест.pdf', size: 1536000, uploadedAt: new Date() },
          { name: 'КП_ГлавСтрой.docx', size: 512000, uploadedAt: new Date() },
        ],
      },
      onExportReport: fn(),
      onStartNewAnalysis: fn(),
    };

    return <KPAnalyzerMain {...mockProps} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Демонстрация компонента с реалистичными данными анализа.',
      },
    },
  },
};

// Мобильная версия
export const Mobile: Story = {
  ...Demo,
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Адаптивная версия для мобильных устройств.',
      },
    },
  },
};

// Темная тема
export const DarkTheme: Story = {
  ...Demo,
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Компонент в темной теме.',
      },
    },
  },
};