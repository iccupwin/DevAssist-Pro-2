import type { Meta, StoryObj } from '@storybook/react';
import LoadingSpinner from './LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# LoadingSpinner Component

Компонент индикатора загрузки для DevAssist Pro с различными размерами и настройками.

## Особенности
- 🎯 Три размера: small, medium, large
- 📝 Опциональный текст загрузки
- 🎨 Настраиваемые стили через className
- 🔄 Плавная анимация вращения
- 🌗 Поддержка темной и светлой темы
- ♿ Accessibility поддержка

## Использование в модулях DevAssist Pro
- **КП Анализатор**: Индикация процесса анализа файлов
- **ТЗ Генератор**: Загрузка шаблонов и генерация документов
- **Оценка проектов**: Расчет финансовых показателей
- **Маркетинг планировщик**: Обработка данных кампаний
- **База знаний**: Поиск и индексация материалов
- **Авторизация**: Процесс входа в систему
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Размер спиннера',
    },
    text: {
      control: { type: 'text' },
      description: 'Текст загрузки',
    },
    className: {
      control: { type: 'text' },
      description: 'Дополнительные CSS классы',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Базовые размеры
export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

// С текстом
export const WithText: Story = {
  args: {
    size: 'md',
    text: 'Загрузка...',
  },
};

export const AnalyzeText: Story = {
  args: {
    size: 'lg',
    text: 'Анализируем КП...',
  },
};

export const ProcessingText: Story = {
  args: {
    size: 'md',
    text: 'Обрабатываем документы',
  },
};

// Примеры использования в модулях DevAssist Pro
export const KPAnalyzerLoading: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <h3 className="text-lg font-semibold mb-4">КП Анализатор - Состояния загрузки</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Загрузка файлов</h4>
          <LoadingSpinner size="sm" text="Загружаем файлы..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Анализ документов</h4>
          <LoadingSpinner size="md" text="Анализируем ТЗ и КП..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Генерация отчета</h4>
          <LoadingSpinner size="md" text="Формируем отчет..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Экспорт PDF</h4>
          <LoadingSpinner size="sm" text="Экспортируем в PDF..." />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const TZGeneratorLoading: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <h3 className="text-lg font-semibold mb-4">ТЗ Генератор - Состояния загрузки</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Загрузка шаблонов</h4>
          <LoadingSpinner size="sm" text="Загружаем шаблоны..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">ИИ генерация</h4>
          <LoadingSpinner size="lg" text="Генерируем ТЗ с помощью ИИ..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Проверка требований</h4>
          <LoadingSpinner size="md" text="Проверяем соответствие..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Сохранение</h4>
          <LoadingSpinner size="sm" text="Сохраняем документ..." />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const ProjectEvaluationLoading: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <h3 className="text-lg font-semibold mb-4">Оценка проектов - Состояния загрузки</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Расчет NPV</h4>
          <LoadingSpinner size="md" text="Рассчитываем чистую приведенную стоимость..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Анализ рисков</h4>
          <LoadingSpinner size="md" text="Анализируем проектные риски..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Сценарное моделирование</h4>
          <LoadingSpinner size="lg" text="Строим сценарии развития..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Формирование отчета</h4>
          <LoadingSpinner size="md" text="Генерируем финансовый отчет..." />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const AuthenticationLoading: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <h3 className="text-lg font-semibold mb-4">Авторизация - Состояния загрузки</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Вход в систему</h4>
          <LoadingSpinner size="sm" text="Проверяем учетные данные..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Регистрация</h4>
          <LoadingSpinner size="sm" text="Создаем аккаунт..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Социальная авторизация</h4>
          <LoadingSpinner size="md" text="Подключаемся к Google..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Сброс пароля</h4>
          <LoadingSpinner size="sm" text="Отправляем письмо..." />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Полноэкранная загрузка
export const FullScreenLoading: Story = {
  render: () => (
    <div className="h-96 w-full bg-gray-50 flex items-center justify-center rounded-lg">
      <LoadingSpinner size="lg" text="Инициализируем DevAssist Pro..." />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Встроенная загрузка
export const InlineLoading: Story = {
  render: () => (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold">Статус модулей</h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 border rounded">
          <span>КП Анализатор</span>
          <LoadingSpinner size="sm" />
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded">
          <span>ТЗ Генератор</span>
          <span className="text-green-600">✓ Готов</span>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded">
          <span>Оценка проектов</span>
          <LoadingSpinner size="sm" />
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded">
          <span>База знаний</span>
          <span className="text-green-600">✓ Готов</span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Темная тема
export const DarkTheme: Story = {
  args: {
    size: 'lg',
    text: 'Загрузка в темной теме...',
    className: 'text-white',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story: any) => (
      <div className="dark bg-gray-900 p-8 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

// Кастомизированные спиннеры
export const CustomizedSpinners: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <h3 className="text-lg font-semibold mb-4">Кастомизированные спиннеры</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <LoadingSpinner size="md" className="text-blue-600" />
          <p className="text-sm mt-2">Синий</p>
        </div>
        
        <div className="text-center">
          <LoadingSpinner size="md" className="text-green-600" />
          <p className="text-sm mt-2">Зеленый</p>
        </div>
        
        <div className="text-center">
          <LoadingSpinner size="md" className="text-purple-600" />
          <p className="text-sm mt-2">Фиолетовый</p>
        </div>
        
        <div className="text-center">
          <LoadingSpinner size="md" className="text-red-600" />
          <p className="text-sm mt-2">Красный</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};