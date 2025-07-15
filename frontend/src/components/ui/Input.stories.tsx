import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { Input } from './Input';
import { 
  Mail, 
  Lock, 
  Search as SearchIcon, 
  User, 
  Phone, 
  Calendar, 
  DollarSign, 
  FileText,
  Building,
  MapPin
} from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Input Component

Универсальный компонент поля ввода для DevAssist Pro с поддержкой различных типов, иконок и валидации.

## Особенности
- 🎯 Поддержка различных типов полей (text, email, password, number, date, tel)
- 🖼️ Иконки слева или справа от поля
- ✅ Встроенная валидация с отображением ошибок
- 💡 Подсказки и вспомогательный текст
- 🌗 Поддержка светлой и темной темы
- ♿ Полная поддержка accessibility
- 📱 Адаптивность для мобильных устройств

## Использование в модулях DevAssist Pro
- **Авторизация**: Поля email, пароль, восстановление пароля
- **КП Анализатор**: Поиск по файлам, фильтры, настройки анализа
- **ТЗ Генератор**: Заполнение параметров проекта, технических требований
- **Оценка проектов**: Ввод финансовых показателей, сроков
- **Маркетинг планировщик**: Настройки кампаний, бюджеты, целевая аудитория
- **База знаний**: Поиск по материалам, теги, категории
        `,
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'date', 'search'],
      description: 'Тип поля ввода',
    },
    iconPosition: {
      control: { type: 'select' },
      options: ['left', 'right'],
      description: 'Позиция иконки',
    },
    isDarkMode: {
      control: { type: 'boolean' },
      description: 'Темная тема',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Отключить поле',
    },
    label: {
      control: { type: 'text' },
      description: 'Подпись поля',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder текст',
    },
    helperText: {
      control: { type: 'text' },
      description: 'Вспомогательный текст',
    },
    error: {
      control: { type: 'text' },
      description: 'Текст ошибки',
    },
  },
  args: {
    onChange: action('changed'),
    onFocus: action('focused'),
    onBlur: action('blurred'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Базовые варианты
export const Default: Story = {
  args: {
    label: 'Название проекта',
    placeholder: 'Введите название проекта',
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'example@company.com',
    icon: Mail,
    type: 'email',
  },
};

export const Password: Story = {
  args: {
    label: 'Пароль',
    placeholder: 'Введите пароль',
    icon: Lock,
    type: 'password',
  },
};

export const SearchInput: Story = {
  args: {
    placeholder: 'Поиск по файлам КП...',
    icon: SearchIcon,
    type: 'search',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Бюджет проекта',
    placeholder: '1000000',
    helperText: 'Укажите предварительный бюджет в рублях',
    icon: DollarSign,
    type: 'number',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'example@company.com',
    icon: Mail,
    type: 'email',
    error: 'Неверный формат email адреса',
    value: 'invalid-email',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Поле только для чтения',
    value: 'Нельзя изменить',
    disabled: true,
  },
};

// Разные типы полей
export const PhoneNumber: Story = {
  args: {
    label: 'Телефон',
    placeholder: '+7 (999) 123-45-67',
    icon: Phone,
    type: 'tel',
  },
};

export const DateInput: Story = {
  args: {
    label: 'Дата начала проекта',
    icon: Calendar,
    type: 'date',
  },
};

export const NumberInput: Story = {
  args: {
    label: 'Площадь (м²)',
    placeholder: '1000',
    icon: Building,
    type: 'number',
    helperText: 'Общая площадь объекта',
  },
};

// Позиция иконки
export const IconRight: Story = {
  args: {
    label: 'Адрес объекта',
    placeholder: 'г. Москва, ул. Примерная, д. 1',
    icon: MapPin,
    iconPosition: 'right',
  },
};

// Примеры использования в модулях DevAssist Pro
export const AuthenticationFields: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Авторизация</h3>
      <Input
        label="Email"
        placeholder="your.email@company.com"
        icon={Mail}
        type="email"
      />
      <Input
        label="Пароль"
        placeholder="Введите пароль"
        icon={Lock}
        type="password"
        helperText="Минимум 8 символов"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const KPAnalyzerFields: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">КП Анализатор - Поля</h3>
      <Input
        label="Поиск по файлам"
        placeholder="Найти файл КП..."
        icon={SearchIcon}
        type="search"
      />
      <Input
        label="Название тендера"
        placeholder="Строительство жилого комплекса"
        icon={FileText}
      />
      <Input
        label="Максимальная цена (₽)"
        placeholder="50000000"
        icon={DollarSign}
        type="number"
        helperText="Начальная максимальная цена контракта"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const TZGeneratorFields: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">ТЗ Генератор - Поля</h3>
      <Input
        label="Заказчик"
        placeholder="ООО 'Строительная компания'"
        icon={Building}
      />
      <Input
        label="Объект строительства"
        placeholder="Жилой комплекс 'Солнечный'"
        icon={Building}
      />
      <Input
        label="Адрес объекта"
        placeholder="г. Москва, ул. Примерная, д. 1"
        icon={MapPin}
      />
      <Input
        label="Площадь застройки (м²)"
        placeholder="5000"
        icon={Building}
        type="number"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const ProjectEvaluationFields: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Оценка проектов - Поля</h3>
      <Input
        label="Инвестиции (₽)"
        placeholder="100000000"
        icon={DollarSign}
        type="number"
        helperText="Общий объем инвестиций"
      />
      <Input
        label="Срок окупаемости (лет)"
        placeholder="5"
        type="number"
        helperText="Планируемый срок окупаемости"
      />
      <Input
        label="Ставка дисконтирования (%)"
        placeholder="12"
        type="number"
        helperText="Используется для расчета NPV"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Валидация и ошибки
export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Состояния валидации</h3>
      <Input
        label="Корректное поле"
        value="Правильное значение"
        icon={User}
      />
      <Input
        label="Поле с ошибкой"
        value="invalid-email"
        icon={Mail}
        type="email"
        error="Неверный формат email адреса"
      />
      <Input
        label="Поле с подсказкой"
        placeholder="Введите значение"
        icon={FileText}
        helperText="Это поле обязательно для заполнения"
      />
      <Input
        label="Отключенное поле"
        value="Нельзя изменить"
        disabled
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Темная тема
export const DarkTheme: Story = {
  args: {
    label: 'Поле в темной теме',
    placeholder: 'Введите текст...',
    icon: User,
    isDarkMode: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story: any) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

// Светлая тема
export const LightTheme: Story = {
  args: {
    label: 'Поле в светлой теме',
    placeholder: 'Введите текст...',
    icon: User,
    isDarkMode: false,
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};