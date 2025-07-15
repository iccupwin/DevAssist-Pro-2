import React from 'react';
import BentoGrid, { BentoItem } from '../ui/BentoGrid';
import StatsDisplaySection from './StatsDisplaySection';
import QuickStatsSection from './QuickStatsSection';
import { 
  FileText, 
  Brain, 
  BarChart3, 
  Trophy, 
  Clock, 
  Users, 
  Target,
  TrendingUp,
  Database,
  Zap,
  Settings,
  Shield
} from 'lucide-react';

interface BentoSectionProps {
  onStepChange: (step: string) => void;
  isDarkMode: boolean;
}

const BentoSection: React.FC<BentoSectionProps> = ({ onStepChange, isDarkMode }) => {
  const bentoItems: BentoItem[] = [
    {
      title: "КП Анализатор",
      description: "AI-powered анализ коммерческих предложений против технических заданий с детальными рекомендациями",
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      status: "Активен",
      tags: ["AI", "Анализ", "ТЗ"],
      colSpan: 2,
      meta: "156 документов проанализировано",
      cta: "Начать анализ",
      hasPersistentHover: true,
      onClick: () => onStepChange('upload')
    },
    {
      title: "AI Статистика",
      description: "Мониторинг производительности AI моделей и точности анализа в реальном времени",
      icon: <Brain className="w-6 h-6 text-purple-600" />,
      status: "Online",
      tags: ["Мониторинг", "AI"],
      meta: "94.5% точность",
      cta: "Подробнее"
    },
    {
      title: "Сравнительная аналитика",
      description: "Комплексное сравнение КП с визуализацией данных и интерактивными диаграммами",
      icon: <BarChart3 className="w-6 h-6 text-green-600" />,
      tags: ["Аналитика", "Визуализация"],
      meta: "23 анализа в этом месяце"
    },
    {
      title: "Рейтинги поставщиков",
      description: "Автоматическое ранжирование подрядчиков на основе AI анализа и исторических данных",
      icon: <Trophy className="w-6 h-6 text-yellow-600" />,
      tags: ["Рейтинг", "Поставщики"],
      meta: "85+ поставщиков в базе"
    },
    {
      title: "Быстрый анализ",
      description: "Экспресс-режим для срочных тендеров с результатами за 2-3 минуты",
      icon: <Clock className="w-6 h-6 text-orange-600" />,
      tags: ["Быстро", "Экспресс"],
      meta: "Средн. время: 2.5 мин"
    },
    {
      title: "ТЗ Генератор",
      description: "Автоматическая генерация технических заданий с помощью AI на основе шаблонов и требований",
      icon: <Target className="w-6 h-6 text-indigo-600" />,
      status: "Скоро",
      tags: ["Генерация", "ТЗ"],
      colSpan: 1,
      rowSpan: 1
    },
    {
      title: "Оценка проектов",
      description: "Мультикритериальный анализ и прогнозирование рисков девелоперских проектов",
      icon: <TrendingUp className="w-6 h-6 text-cyan-600" />,
      status: "Скоро",
      tags: ["Проекты", "Риски"],
      colSpan: 2,
      meta: "Q2 2025",
      cta: "Узнать больше"
    },
    {
      title: "База знаний",
      description: "Накопление опыта и AI-поиск по документам всех проектов компании",
      icon: <Database className="w-6 h-6 text-slate-600" />,
      status: "Скоро",
      tags: ["База", "Поиск"]
    },
    {
      title: "Команда управления",
      description: "Управление пользователями, ролями и доступом к различным модулям системы",
      icon: <Users className="w-6 h-6 text-rose-600" />,
      tags: ["Команда", "Доступ"],
      meta: "5 активных пользователей"
    },
    {
      title: "Автоматизация",
      description: "Настройка автоматических уведомлений, отчетов и интеграций с внешними системами",
      icon: <Zap className="w-6 h-6 text-violet-600" />,
      tags: ["Автоматизация"],
      colSpan: 2
    },
    {
      title: "Настройки системы",
      description: "Конфигурация AI моделей, настройка критериев оценки и персонализация интерфейса",
      icon: <Settings className="w-6 h-6 text-gray-600" />,
      tags: ["Настройки"]
    },
    {
      title: "Безопасность",
      description: "Аудит действий, управление API ключами и контроль доступа к конфиденциальной информации",
      icon: <Shield className="w-6 h-6 text-emerald-600" />,
      tags: ["Безопасность", "Аудит"],
      meta: "100% зашифровано"
    }
  ];

  return (
    <div className="space-y-16">
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          DevAssist Pro Portal
        </h2>
        <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          AI-powered веб-портал для автоматизации всех ключевых процессов в девелопменте недвижимости
        </p>
      </div>

      {/* Быстрая статистика */}
      <QuickStatsSection isDarkMode={isDarkMode} />
      
      <BentoGrid 
        items={bentoItems} 
        className="mb-12"
      />

      {/* Детальная статистика с Display Cards */}
      <StatsDisplaySection isDarkMode={isDarkMode} />
      
      <div className={`text-center p-6 rounded-2xl backdrop-blur-md border ${
        isDarkMode 
          ? 'bg-white/[0.02] border-gray-800 text-gray-400' 
          : 'bg-black/[0.02] border-gray-200 text-gray-600'
      }`}>
        <p className="text-sm">
          Выберите модуль для начала работы или загрузите документы для анализа КП
        </p>
      </div>
    </div>
  );
};

export default BentoSection;