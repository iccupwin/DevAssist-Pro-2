/**
 * RecentActivityFeed Storybook Stories
 * Демонстрация компонента ленты активности пользователя
 */

import type { Meta, StoryObj } from '@storybook/react';
import { RecentActivityFeed } from './RecentActivityFeed';

const meta: Meta<typeof RecentActivityFeed> = {
  title: 'DevAssist Pro/Main/RecentActivityFeed',
  component: RecentActivityFeed,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## Recent Activity Feed

Компонент ленты активности пользователя согласно ТЗ DevAssist Pro.

### Функциональность:
- 📋 Отображение последних действий пользователя
- 🔄 Автообновление в реальном времени
- 🔍 Фильтрация по типу активности
- 📱 Адаптивный дизайн
- ⏱️ Относительное время (X минут назад)
- 🎨 Цветовая кодировка по типу события
- 📄 Пагинация для больших списков

### Типы активности:
- 📄 Загрузка документов
- 🔄 Начало анализа
- ✅ Завершение анализа  
- 📊 Создание отчётов
- 🏗️ Создание проектов
- ⚙️ Изменение настроек
- 👤 Регистрация пользователей
        `
      }
    }
  },
  argTypes: {
    projectId: {
      control: { type: 'number' },
      description: 'ID проекта для фильтрации активности'
    },
    limit: {
      control: { type: 'range', min: 5, max: 50, step: 5 },
      description: 'Количество элементов для загрузки'
    },
    showFilters: {
      control: { type: 'boolean' },
      description: 'Показывать фильтры по типу активности'
    },
    showHeader: {
      control: { type: 'boolean' },
      description: 'Показывать заголовок компонента'
    },
    autoRefresh: {
      control: { type: 'boolean' },
      description: 'Автообновление активности'
    },
    refreshInterval: {
      control: { type: 'range', min: 10, max: 300, step: 10 },
      description: 'Интервал автообновления в секундах'
    }
  }
};

export default meta;
type Story = StoryObj<typeof RecentActivityFeed>;

/**
 * Стандартная лента активности как в Dashboard
 */
export const Default: Story = {
  args: {
    limit: 8,
    showFilters: false,
    showHeader: true,
    autoRefresh: false,
    refreshInterval: 30
  }
};

/**
 * Полная лента с фильтрами и всеми возможностями
 */
export const WithFilters: Story = {
  args: {
    limit: 10,
    showFilters: true,
    showHeader: true,
    autoRefresh: false,
    refreshInterval: 60
  }
};

/**
 * Компактная версия без заголовка
 */
export const Compact: Story = {
  args: {
    limit: 5,
    showFilters: false,
    showHeader: false,
    autoRefresh: false
  }
};

/**
 * Активность конкретного проекта
 */
export const ProjectActivity: Story = {
  args: {
    projectId: 1,
    limit: 15,
    showFilters: true,
    showHeader: true,
    autoRefresh: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Лента активности для конкретного проекта. Показывает только события связанные с выбранным проектом.'
      }
    }
  }
};

/**
 * С автообновлением для реального времени
 */
export const WithAutoRefresh: Story = {
  args: {
    limit: 8,
    showFilters: true,
    showHeader: true,
    autoRefresh: true,
    refreshInterval: 30
  },
  parameters: {
    docs: {
      description: {
        story: 'Лента с автообновлением каждые 30 секунд. Индикатор показывает статус автообновления.'
      }
    }
  }
};

/**
 * Мобильная версия
 */
export const Mobile: Story = {
  args: {
    limit: 6,
    showFilters: false,
    showHeader: true,
    autoRefresh: false,
    className: 'max-w-sm'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Адаптивная версия для мобильных устройств с упрощённым интерфейсом.'
      }
    }
  }
};

/**
 * Тёмная тема
 */
export const DarkTheme: Story = {
  args: {
    limit: 8,
    showFilters: true,
    showHeader: true,
    autoRefresh: false
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'Лента активности в тёмной теме приложения.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="dark bg-gray-900 p-6 rounded-lg">
        <Story />
      </div>
    )
  ]
};

/**
 * Состояние загрузки
 */
export const Loading: Story = {
  args: {
    limit: 10,
    showFilters: true,
    showHeader: true
  },
  parameters: {
    mockData: {
      delay: 5000 // Имитация долгой загрузки
    },
    docs: {
      description: {
        story: 'Состояние загрузки с индикатором прогресса.'
      }
    }
  }
};

/**
 * Пустое состояние
 */
export const Empty: Story = {
  args: {
    limit: 10,
    showFilters: true,
    showHeader: true
  },
  parameters: {
    mockData: {
      empty: true // Имитация пустого ответа
    },
    docs: {
      description: {
        story: 'Пустое состояние когда нет активности для отображения.'
      }
    }
  }
};