/**
 * Storybook stories для ResultsVisualization
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ResultsVisualization } from './ResultsVisualization';

const meta: Meta<typeof ResultsVisualization> = {
  title: 'Components/Visualization/ResultsVisualization',
  component: ResultsVisualization,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Компонент визуализации результатов анализа КП с поддержкой 4 видов отображения: обзор, сравнение, критерии и бюджет.'
      }
    }
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Заголовок компонента'
    },
    showFilters: {
      control: 'boolean',
      description: 'Показывать фильтры'
    },
    showExportOptions: {
      control: 'boolean',
      description: 'Показывать опции экспорта'
    }
  }
};

export default meta;
type Story = StoryObj<typeof ResultsVisualization>;

// Демонстрационные данные
const mockResults = [
  {
    id: '1',
    companyName: 'ТехСофт',
    proposalName: 'Разработка CRM системы',
    overallScore: 87.5,
    maxScore: 100,
    criteria: {
      technical: 90,
      commercial: 85,
      timeline: 88,
      experience: 92,
      compliance: 83,
    },
    budget: {
      total: 2500000,
      breakdown: {
        development: 1500000,
        testing: 400000,
        deployment: 300000,
        support: 250000,
        other: 50000,
      },
    },
    metadata: {
      submissionDate: '2024-01-15',
      evaluationDate: '2024-01-20',
      evaluator: 'И. Петров',
      status: 'evaluated' as const,
    },
  },
  {
    id: '2',
    companyName: 'ИнноДев',
    proposalName: 'ERP система',
    overallScore: 79.2,
    maxScore: 100,
    criteria: {
      technical: 85,
      commercial: 75,
      timeline: 80,
      experience: 82,
      compliance: 74,
    },
    budget: {
      total: 3200000,
      breakdown: {
        development: 2000000,
        testing: 600000,
        deployment: 350000,
        support: 200000,
        other: 50000,
      },
    },
    metadata: {
      submissionDate: '2024-01-16',
      evaluationDate: '2024-01-21',
      evaluator: 'А. Сидорова',
      status: 'evaluated' as const,
    },
  },
  {
    id: '3',
    companyName: 'БизнесСолюшн',
    proposalName: 'Модернизация ИТ',
    overallScore: 72.8,
    maxScore: 100,
    criteria: {
      technical: 70,
      commercial: 78,
      timeline: 75,
      experience: 68,
      compliance: 73,
    },
    budget: {
      total: 1800000,
      breakdown: {
        development: 1000000,
        testing: 300000,
        deployment: 250000,
        support: 200000,
        other: 50000,
      },
    },
    metadata: {
      submissionDate: '2024-01-17',
      evaluationDate: '2024-01-22',
      evaluator: 'С. Козлов',
      status: 'evaluated' as const,
    },
  },
];

export const Default: Story = {
  args: {
    results: mockResults,
    title: 'Визуализация результатов анализа КП',
    showFilters: true,
    showExportOptions: true,
  }
};

export const SingleResult: Story = {
  args: {
    results: [mockResults[0]],
    title: 'Анализ одного КП',
    showFilters: false,
    showExportOptions: true,
  }
};

export const WithoutFilters: Story = {
  args: {
    results: mockResults,
    title: 'Визуализация без фильтров',
    showFilters: false,
    showExportOptions: false,
  }
};

export const EmptyState: Story = {
  args: {
    results: [],
    title: 'Пустое состояние',
    showFilters: true,
    showExportOptions: true,
  }
};