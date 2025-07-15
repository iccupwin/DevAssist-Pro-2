import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Button } from './Button';
import { Play, Download, Settings, Trash2, Plus, Eye } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Button Component

Универсальный компонент кнопки для DevAssist Pro с поддержкой различных вариантов, размеров и состояний.

## Особенности
- 🎨 Множество вариантов стилизации (default, destructive, outline, secondary, ghost, link, social)
- 📏 Различные размеры (sm, default, lg, icon)
- 🔄 Состояние загрузки с анимацией
- 🖼️ Поддержка иконок из Lucide React
- ♿ Полная поддержка accessibility
- 🌗 Поддержка темной темы
- 📱 Адаптивность для мобильных устройств

## Использование в модулях DevAssist Pro
- **КП Анализатор**: Кнопки анализа, загрузки файлов, экспорта отчетов
- **ТЗ Генератор**: Кнопки генерации, сохранения шаблонов
- **Оценка проектов**: Кнопки расчета, сравнения вариантов
- **Маркетинг планировщик**: Кнопки создания кампаний, публикации
- **База знаний**: Кнопки поиска, добавления материалов
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'social'],
      description: 'Стиль кнопки',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'icon'],
      description: 'Размер кнопки',
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Показать состояние загрузки',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Отключить кнопку',
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Растянуть на всю ширину',
    },
    children: {
      control: { type: 'text' },
      description: 'Текст кнопки',
    },
  },
  args: {
    onClick: action('clicked'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Базовые варианты
export const Default: Story = {
  args: {
    children: 'Анализировать КП',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Удалить файл',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Отменить',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Сохранить черновик',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Настройки',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Подробнее',
  },
};

export const Social: Story = {
  args: {
    variant: 'social',
    children: 'Войти через Google',
  },
};

// Размеры
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Малая кнопка',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Большая кнопка',
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    icon: Settings,
    children: '',
  },
};

// С иконками
export const WithIcon: Story = {
  args: {
    icon: Download,
    children: 'Скачать отчет',
  },
};

export const PlayButton: Story = {
  args: {
    icon: Play,
    children: 'Запустить анализ',
    variant: 'default',
  },
};

export const AddButton: Story = {
  args: {
    icon: Plus,
    children: 'Добавить файл',
    variant: 'outline',
  },
};

// Состояния
export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Анализируем...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Недоступно',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Во всю ширину',
  },
  parameters: {
    layout: 'padded',
  },
};

// Примеры использования в модулях DevAssist Pro
export const KPAnalyzerButtons: Story = {
  render: () => (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold mb-4">КП Анализатор - Кнопки</h3>
      <div className="flex flex-wrap gap-2">
        <Button icon={Plus}>Загрузить ТЗ</Button>
        <Button icon={Plus} variant="outline">Добавить КП</Button>
        <Button icon={Play}>Начать анализ</Button>
        <Button icon={Download} variant="secondary">Экспорт PDF</Button>
        <Button icon={Eye} variant="ghost">Предпросмотр</Button>
        <Button icon={Trash2} variant="destructive" size="sm">Удалить</Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const TZGeneratorButtons: Story = {
  render: () => (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold mb-4">ТЗ Генератор - Кнопки</h3>
      <div className="flex flex-wrap gap-2">
        <Button>Генерировать ТЗ</Button>
        <Button variant="outline">Использовать шаблон</Button>
        <Button variant="secondary" icon={Download}>Сохранить шаблон</Button>
        <Button variant="ghost">Предпросмотр</Button>
        <Button variant="link">Справка по заполнению</Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const ProjectEvaluationButtons: Story = {
  render: () => (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold mb-4">Оценка проектов - Кнопки</h3>
      <div className="flex flex-wrap gap-2">
        <Button>Рассчитать NPV</Button>
        <Button variant="outline">Анализ рисков</Button>
        <Button variant="secondary">Сравнить варианты</Button>
        <Button variant="ghost" icon={Settings}>Настройки модели</Button>
        <Button variant="link">Методология расчета</Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Адаптивность
export const ResponsiveButtons: Story = {
  render: () => (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold mb-4">Адаптивные кнопки</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <Button fullWidth>Мобильная кнопка</Button>
        <Button fullWidth variant="outline">Планшетная кнопка</Button>
        <Button fullWidth variant="secondary">Десктопная кнопка</Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};

// Темная тема
export const DarkTheme: Story = {
  args: {
    children: 'Кнопка в темной теме',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      story: {
        inline: false,
        height: '100px',
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