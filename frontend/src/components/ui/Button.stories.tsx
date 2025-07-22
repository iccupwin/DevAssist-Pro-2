import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Универсальный компонент кнопки с поддержкой различных вариантов и размеров.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Визуальный стиль кнопки',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Размер кнопки',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Отключить кнопку',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Рендерить как дочерний элемент',
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Основные варианты
export const Default: Story = {
  args: {
    children: 'Кнопка',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Удалить',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Отмена',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Сохранить как черновик',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Закрыть',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Подробнее',
  },
};

// Размеры
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Маленькая',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Большая',
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    children: '✕',
  },
};

// Состояния
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Недоступна',
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <span className="animate-spin mr-2">⏳</span>
        Загрузка...
      </>
    ),
  },
};

// Группа кнопок
export const ButtonGroup: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="outline">Отмена</Button>
      <Button>Сохранить</Button>
      <Button variant="destructive">Удалить</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Пример группы кнопок с разными вариантами.',
      },
    },
  },
};

// Все варианты в одном месте
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Button>Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Все доступные варианты кнопок.',
      },
    },
  },
};

// Все размеры
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">⚙</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Все доступные размеры кнопок.',
      },
    },
  },
};