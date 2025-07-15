import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import DocumentList from './DocumentList';
import { DocumentFile } from './DocumentPreview';

const meta: Meta<typeof DocumentList> = {
  title: 'Documents/DocumentList',
  component: DocumentList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# DocumentList Component

Компонент списка документов с полным функционалом управления, поиска и фильтрации для DevAssist Pro.

## Особенности
- 📋 Отображение документов в виде сетки или списка
- 🔍 Поиск по названию файлов
- 🏷️ Фильтрация по типу документов
- 📊 Сортировка по имени, дате, размеру
- 📱 Responsive дизайн для всех устройств
- 🎯 Статусы анализа документов
- ⚡ Быстрые действия (просмотр, анализ, удаление)

## Использование в DevAssist Pro
- **КП Анализатор**: Управление ТЗ и коммерческими предложениями
- **ТЗ Генератор**: Библиотека шаблонов и сгенерированных документов
- **База знаний**: Каталог справочных материалов
- **Документооборот**: Центральное хранилище всех документов проекта

## Поддерживаемые функции
- Drag & Drop загрузка файлов
- Предпросмотр документов
- Batch операции над несколькими файлами
- Интеграция с AI-анализом
- History версий документов
        `,
      },
    },
  },
  argTypes: {
    documents: {
      description: 'Массив документов для отображения',
    },
    showUpload: {
      control: { type: 'boolean' },
      description: 'Показывать кнопку загрузки',
    },
    title: {
      control: { type: 'text' },
      description: 'Заголовок списка документов',
    },
    emptyMessage: {
      control: { type: 'text' },
      description: 'Сообщение при отсутствии документов',
    },
  },
  args: {
    onAnalyze: action('analyze document'),
    onDelete: action('delete document'), 
    onUpload: action('upload new document'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock данные для демонстрации
const mockDocuments: DocumentFile[] = [
  {
    id: 'doc-1',
    name: 'Техническое задание - Жилой комплекс Солнечный.pdf',
    type: 'pdf',
    size: 2048576,
    url: '/mock/tz-solnechny.pdf',
    uploadedAt: new Date('2024-01-15'),
    status: 'uploaded' as const,
    pageCount: 15,
    thumbnail: '/mock/thumbnails/pdf-1.jpg',
    extractedText: 'Техническое задание на строительство...'
  },
  {
    id: 'doc-2',
    name: 'КП - ООО СтройИнвест.docx',
    type: 'docx',
    size: 1024768,
    url: '/mock/kp-stroyinvest.docx',
    uploadedAt: new Date('2024-01-20'),
    status: 'uploaded' as const,
    extractedText: 'Коммерческое предложение от ООО СтройИнвест...'
  },
  {
    id: 'doc-3',
    name: 'КП - ООО МонолитСтрой.pdf',
    type: 'pdf',
    size: 1536000,
    url: '/mock/kp-monolitstroy.pdf',
    uploadedAt: new Date('2024-01-22'),
    status: 'uploaded' as const,
    pageCount: 8,
    extractedText: 'Коммерческое предложение от ООО МонолитСтрой...'
  },
  {
    id: 'doc-4',
    name: 'Планы участка - Схема застройки.jpg',
    type: 'image',
    size: 3072000,
    url: '/mock/plan-site.jpg',
    uploadedAt: new Date('2024-01-18'),
    status: 'uploaded' as const,
    thumbnail: '/mock/thumbnails/plan-1.jpg'
  },
  {
    id: 'doc-5',
    name: 'Смета - Предварительные расчеты.xlsx',
    type: 'docx', // Using docx as placeholder for Excel
    size: 512000,
    url: '/mock/smeta-calculations.xlsx',
    uploadedAt: new Date('2024-01-25'),
    status: 'uploaded' as const,
    extractedText: 'Предварительные сметные расчеты...'
  },
  {
    id: 'doc-6',
    name: 'КП - ГК Основа (альтернативное предложение).pdf',
    type: 'pdf',
    size: 2304000,
    url: '/mock/kp-osnova.pdf',
    uploadedAt: new Date('2024-01-28'),
    status: 'uploaded' as const,
    pageCount: 12,
    extractedText: 'Альтернативное коммерческое предложение...'
  }
];

const mockAnalysisStatuses = {
  'doc-1': 'completed' as const,
  'doc-2': 'processing' as const,
  'doc-3': 'pending' as const,
  'doc-4': undefined,
  'doc-5': 'error' as const,
  'doc-6': 'completed' as const,
};

// Базовые варианты
export const Default: Story = {
  args: {
    documents: mockDocuments,
    analysisStatuses: mockAnalysisStatuses,
  },
};

export const EmptyState: Story = {
  args: {
    documents: [],
    title: 'Документы проекта',
    emptyMessage: 'Документы не загружены',
  },
};

export const WithoutUpload: Story = {
  args: {
    documents: mockDocuments.slice(0, 3),
    analysisStatuses: mockAnalysisStatuses,
    showUpload: false,
    title: 'Результаты анализа',
  },
};

// Примеры использования в модулях DevAssist Pro
export const KPAnalyzerDocuments: Story = {
  args: {
    documents: [
      mockDocuments[0], // ТЗ
      mockDocuments[1], // КП 1
      mockDocuments[2], // КП 2  
      mockDocuments[5], // КП 3
    ],
    analysisStatuses: {
      'doc-1': 'completed',
      'doc-2': 'completed', 
      'doc-3': 'processing',
      'doc-6': 'pending',
    },
    title: 'КП Анализатор - Документы',
    emptyMessage: 'Загрузите ТЗ и коммерческие предложения для анализа',
  },
  parameters: {
    docs: {
      description: {
        story: 'Документы в модуле КП Анализатор с различными статусами анализа.',
      },
    },
  },
};

export const TZGeneratorTemplates: Story = {
  args: {
    documents: [
      {
        id: 'template-1',
        name: 'Шаблон ТЗ - Жилой комплекс.docx',
        type: 'docx',
        size: 256000,
        url: '/templates/tz-residential.docx',
        uploadedAt: new Date('2024-01-10'),
        extractedText: 'Шаблон технического задания для жилых комплексов...'
      },
      {
        id: 'template-2', 
        name: 'Шаблон ТЗ - Офисное здание.docx',
        type: 'docx',
        size: 284000,
        url: '/templates/tz-office.docx',
        uploadedAt: new Date('2024-01-12'),
    status: 'uploaded' as const,
        extractedText: 'Шаблон технического задания для офисных зданий...'
      },
      {
        id: 'generated-1',
        name: 'ТЗ - ЖК Солнечный (сгенерировано).pdf',
        type: 'pdf',
        size: 1024000,
        url: '/generated/tz-solnechny-gen.pdf',
        uploadedAt: new Date('2024-01-30'),
        pageCount: 25,
        extractedText: 'Автоматически сгенерированное техническое задание...'
      }
    ],
    title: 'ТЗ Генератор - Шаблоны и документы',
    emptyMessage: 'Создайте первый шаблон технического задания',
  },
  parameters: {
    docs: {
      description: {
        story: 'Шаблоны и сгенерированные документы в модуле ТЗ Генератор.',
      },
    },
  },
};

export const ProjectEvaluationDocuments: Story = {
  args: {
    documents: [
      {
        id: 'eval-1',
        name: 'Финансовая модель - ЖК Солнечный.xlsx',
        type: 'docx', // Using docx as Excel placeholder
        size: 2048000,
        url: '/evaluation/financial-model.xlsx',
        uploadedAt: new Date('2024-01-20'),
    status: 'uploaded' as const,
        extractedText: 'Финансовая модель проекта с расчетом NPV, IRR...'
      },
      {
        id: 'eval-2',
        name: 'Отчет по рискам проекта.pdf',
        type: 'pdf',
        size: 1536000,
        url: '/evaluation/risk-report.pdf',
        uploadedAt: new Date('2024-01-25'),
    status: 'uploaded' as const,
        pageCount: 18,
        extractedText: 'Анализ рисков инвестиционного проекта...'
      },
      {
        id: 'eval-3',
        name: 'Маркетинговое исследование рынка.docx',
        type: 'docx',
        size: 3072000,
        url: '/evaluation/market-research.docx',
        uploadedAt: new Date('2024-01-28'),
    status: 'uploaded' as const,
        extractedText: 'Исследование рынка недвижимости в районе...'
      }
    ],
    analysisStatuses: {
      'eval-1': 'completed',
      'eval-2': 'completed', 
      'eval-3': 'processing',
    },
    title: 'Оценка проектов - Аналитические документы',
    emptyMessage: 'Загрузите документы для финансового анализа проекта',
  },
  parameters: {
    docs: {
      description: {
        story: 'Документы для финансового анализа в модуле Оценка проектов.',
      },
    },
  },
};

export const KnowledgeBaseDocuments: Story = {
  args: {
    documents: [
      {
        id: 'kb-1',
        name: 'СНиП 2.08.01-89 - Жилые здания.pdf',
        type: 'pdf',
        size: 5120000,
        url: '/knowledge/snip-residential.pdf',
        uploadedAt: new Date('2024-01-05'),
        pageCount: 156,
        extractedText: 'Строительные нормы и правила для жилых зданий...'
      },
      {
        id: 'kb-2',
        name: 'Методические рекомендации по ценообразованию.docx',
        type: 'docx',
        size: 1024000,
        url: '/knowledge/pricing-guidelines.docx',
        uploadedAt: new Date('2024-01-08'),
        extractedText: 'Методические рекомендации по ценообразованию...'
      },
      {
        id: 'kb-3',
        name: 'Альбом типовых решений - Фасады.pdf',
        type: 'pdf',
        size: 15360000,
        url: '/knowledge/facade-solutions.pdf',
        uploadedAt: new Date('2024-01-12'),
    status: 'uploaded' as const,
        pageCount: 89,
        extractedText: 'Альбом типовых архитектурных решений...'
      }
    ],
    title: 'База знаний - Справочные материалы',
    emptyMessage: 'Добавьте справочные материалы и нормативные документы',
    showUpload: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Справочная документация в модуле База знаний.',
      },
    },
  },
};

// Состояния и функциональность
export const LoadingState: Story = {
  args: {
    documents: mockDocuments,
    analysisStatuses: {
      'doc-1': 'processing',
      'doc-2': 'processing',
      'doc-3': 'processing',
      'doc-4': 'processing',
      'doc-5': 'processing',
      'doc-6': 'processing',
    },
    title: 'Анализируем документы...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Состояние списка во время массового анализа документов.',
      },
    },
  },
};

export const ErrorStates: Story = {
  args: {
    documents: mockDocuments,
    analysisStatuses: {
      'doc-1': 'error',
      'doc-2': 'error',
      'doc-3': 'error',
      'doc-4': undefined,
      'doc-5': 'error',
      'doc-6': 'error',
    },
    title: 'Документы с ошибками анализа',
  },
  parameters: {
    docs: {
      description: {
        story: 'Отображение документов с ошибками при анализе.',
      },
    },
  },
};

export const LargeDocumentCollection: Story = {
  args: {
    documents: Array.from({ length: 24 }, (_, i) => ({
      id: `doc-${i + 1}`,
      name: `Документ ${i + 1} - ${['ТЗ', 'КП', 'Смета', 'План', 'Отчет'][i % 5]}.${['pdf', 'docx', 'pdf', 'jpg', 'pdf'][i % 5]}`,
      type: (['pdf', 'docx', 'pdf', 'image', 'pdf'] as const)[i % 5],
      size: Math.floor(Math.random() * 5000000) + 500000,
      url: `/mock/doc-${i + 1}`,
      uploadedAt: new Date(2024, 0, Math.floor(Math.random() * 30) + 1),
      pageCount: Math.floor(Math.random() * 50) + 5,
      extractedText: `Содержимое документа ${i + 1}...`
    })),
    title: 'Большая коллекция документов',
  },
  parameters: {
    docs: {
      description: {
        story: 'Управление большим количеством документов с pagination.',
      },
    },
  },
};

// Responsive тестирование
export const MobileView: Story = {
  args: {
    documents: mockDocuments.slice(0, 4),
    analysisStatuses: mockAnalysisStatuses,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Отображение списка документов на мобильном устройстве.',
      },
    },
  },
};

export const TabletView: Story = {
  args: {
    documents: mockDocuments,
    analysisStatuses: mockAnalysisStatuses,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Отображение списка документов на планшете.',
      },
    },
  },
};