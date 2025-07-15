/**
 * Tables Components Export
 * Интерактивные таблицы сопоставления КП для DevAssist Pro
 */

// Базовый интерактивный компонент таблицы
export { InteractiveTable } from './InteractiveTable';
export type { TableColumn, TableFilter, InteractiveTableProps } from './InteractiveTable';

// Специализированная таблица сравнения КП
export { ComparisonTable } from './ComparisonTable';
export { default as ComparisonTableDefault } from './ComparisonTable';

// Матрица критериев оценки
export { CriteriaMatrix } from './CriteriaMatrix';
export { default as CriteriaMatrixDefault } from './CriteriaMatrix';

// Рейтинговая таблица
export { RankingTable } from './RankingTable';
export { default as RankingTableDefault } from './RankingTable';

// Основной компонент интерактивного сравнения
export { InteractiveComparison } from './InteractiveComparison';
export { default as InteractiveComparisonDefault } from './InteractiveComparison';

// Переэкспорт типов для удобства использования
export type {
  // Типы из InteractiveComparison
  UnifiedKPProposal
} from './InteractiveComparison';

// Общие типы для всех компонентов таблиц
export interface BaseKPProposal {
  id: string;
  companyName: string;
  proposalName: string;
  status: 'evaluated' | 'pending' | 'rejected';
  overallScore: number;
  recommendation: 'recommend' | 'conditional' | 'not_recommend';
}