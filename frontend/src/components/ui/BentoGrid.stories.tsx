import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import BentoGrid, { BentoItem } from './BentoGrid';
import { 
  FileText, 
  PenTool, 
  Calculator, 
  BarChart3, 
  BookOpen,
  Zap,
  Users,
  Target,
  TrendingUp,
  Search,
  Globe,
  Shield,
  Cloud,
  Smartphone,
  Brain,
  Building
} from 'lucide-react';

const meta: Meta<typeof BentoGrid> = {
  title: 'UI/BentoGrid',
  component: BentoGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# BentoGrid Component

Современная сетка-компонент в стиле Bento для отображения модулей и функций DevAssist Pro.

## Особенности
- 🎨 Современный glassmorphism дизайн
- 📱 Адаптивная сетка (1 колонка на мобильных, 3 на десктопе)
- ✨ Плавные анимации при hover
- 🎯 Поддержка различных размеров карточек (colSpan, rowSpan)
- 🏷️ Система тегов и статусов
- 🌗 Поддержка темной темы
- ⚡ Интерактивные карточки с callback'ами

## Использование в DevAssist Pro
- **Главная страница**: Отображение доступных модулей
- **Дашборды**: Группировка функций по категориям
- **Каталоги**: Презентация возможностей системы
- **Навигация**: Визуальная навигация по разделам
        `,
      },
    },
  },
  argTypes: {
    items: {
      description: 'Массив элементов для отображения в сетке',
    },
    className: {
      control: { type: 'text' },
      description: 'Дополнительные CSS классы',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Базовые данные для модулей DevAssist Pro
const devAssistModules: BentoItem[] = [
  {
    title: 'КП Анализатор',
    description: 'Анализ коммерческих предложений с помощью ИИ для принятия решений в тендерах',
    icon: <FileText className="w-6 h-6 text-blue-600" />,
    status: 'Активен',
    tags: ['ИИ', 'Анализ', 'Тендеры'],
    meta: 'v2.1',
    cta: 'Начать анализ →',
    onClick: action('КП Анализатор clicked'),
  },
  {
    title: 'ТЗ Генератор',
    description: 'Автоматическая генерация технических заданий на основе шаблонов и ИИ',
    icon: <PenTool className="w-6 h-6 text-green-600" />,
    status: 'Активен',
    tags: ['Генерация', 'ТЗ', 'Шаблоны'],
    meta: 'v1.8',
    cta: 'Создать ТЗ →',
    onClick: action('ТЗ Генератор clicked'),
  },
  {
    title: 'Оценка проектов',
    description: 'Финансовый анализ и оценка инвестиционной привлекательности проектов',
    icon: <Calculator className="w-6 h-6 text-purple-600" />,
    status: 'Активен',
    tags: ['Финансы', 'NPV', 'IRR'],
    meta: 'v1.5',
    cta: 'Рассчитать →',
    colSpan: 2,
    onClick: action('Оценка проектов clicked'),
  },
  {
    title: 'Маркетинг планировщик',
    description: 'Планирование и управление маркетинговыми кампаниями недвижимости',
    icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
    status: 'Beta',
    tags: ['Маркетинг', 'Кампании'],
    meta: 'v0.9',
    cta: 'Планировать →',
    onClick: action('Маркетинг планировщик clicked'),
  },
  {
    title: 'База знаний',
    description: 'Централизованное хранилище знаний и материалов по недвижимости',
    icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
    status: 'Активен',
    tags: ['Знания', 'Поиск', 'ИИ'],
    meta: 'v2.0',
    cta: 'Искать →',
    onClick: action('База знаний clicked'),
  },
];

// Расширенные функции
const advancedFeatures: BentoItem[] = [
  {
    title: 'ИИ Ассистент',
    description: 'Умный помощник для решения задач недвижимости',
    icon: <Brain className="w-6 h-6 text-purple-600" />,
    status: 'Скоро',
    tags: ['GPT-4', 'Claude', 'Gemini'],
    colSpan: 2,
    hasPersistentHover: true,
    onClick: action('ИИ Ассистент clicked'),
  },
  {
    title: 'Аналитика',
    description: 'Продвинутая аналитика по всем проектам',
    icon: <TrendingUp className="w-6 h-6 text-green-600" />,
    status: 'Активен',
    tags: ['Дашборды', 'Метрики'],
    onClick: action('Аналитика clicked'),
  },
  {
    title: 'Интеграции',
    description: 'Подключение к внешним системам и API',
    icon: <Globe className="w-6 h-6 text-blue-600" />,
    status: 'Beta',
    tags: ['API', 'Интеграция'],
    onClick: action('Интеграции clicked'),
  },
  {
    title: 'Безопасность',
    description: 'Защита данных и соответствие требованиям',
    icon: <Shield className="w-6 h-6 text-red-600" />,
    status: 'Активен',
    tags: ['Безопасность', 'GDPR'],
    onClick: action('Безопасность clicked'),
  },
  {
    title: 'Мобильное приложение',
    description: 'Доступ к функциям с мобильных устройств',
    icon: <Smartphone className="w-6 h-6 text-indigo-600" />,
    status: 'Скоро',
    tags: ['Mobile', 'PWA'],
    onClick: action('Мобильное приложение clicked'),
  },
];

export const Default: Story = {
  args: {
    items: devAssistModules,
  },
};

export const ModuleDashboard: Story = {
  args: {
    items: devAssistModules,
  },
  parameters: {
    docs: {
      description: {
        story: 'Основные модули DevAssist Pro на главной странице дашборда.',
      },
    },
  },
};

export const AdvancedFeatures: Story = {
  args: {
    items: advancedFeatures,
  },
  parameters: {
    docs: {
      description: {
        story: 'Расширенные функции и интеграции системы.',
      },
    },
  },
};

export const MixedSizes: Story = {
  args: {
    items: [
      {
        title: 'Главный модуль',
        description: 'Основной функционал занимающий больше места в сетке',
        icon: <Zap className="w-6 h-6 text-yellow-600" />,
        status: 'Активен',
        tags: ['Главный'],
        colSpan: 2,
        rowSpan: 2,
        hasPersistentHover: true,
        onClick: action('Главный модуль clicked'),
      },
      ...devAssistModules.slice(0, 4),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Пример использования карточек разных размеров.',
      },
    },
  },
};

export const WithoutInteraction: Story = {
  args: {
    items: devAssistModules.map(item => ({
      ...item,
      onClick: undefined,
      cta: undefined,
    })),
  },
  parameters: {
    docs: {
      description: {
        story: 'Статичные карточки без интерактивности.',
      },
    },
  },
};

export const DifferentStatuses: Story = {
  args: {
    items: [
      {
        title: 'Активный модуль',
        description: 'Полностью функциональный модуль',
        icon: <FileText className="w-6 h-6 text-blue-600" />,
        status: 'Активен',
        tags: ['Готов'],
        onClick: action('Активный модуль clicked'),
      },
      {
        title: 'Бета версия',
        description: 'Модуль в стадии тестирования',
        icon: <PenTool className="w-6 h-6 text-green-600" />,
        status: 'Beta',
        tags: ['Тестирование'],
        onClick: action('Бета версия clicked'),
      },
      {
        title: 'Скоро',
        description: 'Модуль в разработке',
        icon: <Calculator className="w-6 h-6 text-purple-600" />,
        status: 'Скоро',
        tags: ['Разработка'],
        onClick: action('Скоро clicked'),
      },
      {
        title: 'Кастомный статус',
        description: 'Модуль с особым статусом',
        icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
        status: 'Премиум',
        tags: ['Особый'],
        onClick: action('Кастомный статус clicked'),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Различные статусы модулей с соответствующей цветовой кодировкой.',
      },
    },
  },
};

export const TeamDashboard: Story = {
  args: {
    items: [
      {
        title: 'Команда',
        description: 'Управление пользователями и ролями',
        icon: <Users className="w-6 h-6 text-blue-600" />,
        status: 'Активен',
        tags: ['Пользователи', 'Роли'],
        meta: '12 активных',
        onClick: action('Команда clicked'),
      },
      {
        title: 'Проекты',
        description: 'Активные проекты и их статус',
        icon: <Building className="w-6 h-6 text-green-600" />,
        status: 'Активен',
        tags: ['Проекты', 'Статус'],
        meta: '8 проектов',
        colSpan: 2,
        onClick: action('Проекты clicked'),
      },
      {
        title: 'Цели',
        description: 'Отслеживание KPI и целей',
        icon: <Target className="w-6 h-6 text-red-600" />,
        status: 'Активен',
        tags: ['KPI', 'Цели'],
        meta: '85% выполнено',
        onClick: action('Цели clicked'),
      },
      {
        title: 'Поиск',
        description: 'Глобальный поиск по системе',
        icon: <Search className="w-6 h-6 text-purple-600" />,
        status: 'Активен',
        tags: ['Поиск', 'ИИ'],
        onClick: action('Поиск clicked'),
      },
      {
        title: 'Облако',
        description: 'Синхронизация и резервные копии',
        icon: <Cloud className="w-6 h-6 text-cyan-600" />,
        status: 'Активен',
        tags: ['Синхронизация'],
        meta: '2.1 ГБ',
        onClick: action('Облако clicked'),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Дашборд для управления командой и проектами.',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {
    items: devAssistModules,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Отображение BentoGrid в темной теме.',
      },
    },
  },
  decorators: [
    (Story: any) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const Minimal: Story = {
  args: {
    items: [
      {
        title: 'Анализ',
        description: 'Анализ документов',
        icon: <FileText className="w-6 h-6 text-blue-600" />,
        onClick: action('Анализ clicked'),
      },
      {
        title: 'Генерация',
        description: 'Создание ТЗ',
        icon: <PenTool className="w-6 h-6 text-green-600" />,
        onClick: action('Генерация clicked'),
      },
      {
        title: 'Расчеты',
        description: 'Финансовые расчеты',
        icon: <Calculator className="w-6 h-6 text-purple-600" />,
        onClick: action('Расчеты clicked'),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Минималистичная версия с базовой информацией.',
      },
    },
  },
};

export const SingleColumn: Story = {
  args: {
    items: devAssistModules,
    className: 'md:grid-cols-1 max-w-2xl',
  },
  parameters: {
    docs: {
      description: {
        story: 'Отображение в одну колонку для узких контейнеров.',
      },
    },
  },
};

export const FourColumns: Story = {
  args: {
    items: advancedFeatures,
    className: 'md:grid-cols-4',
  },
  parameters: {
    docs: {
      description: {
        story: 'Отображение в четыре колонки для широких экранов.',
      },
    },
  },
};