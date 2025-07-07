import React from 'react';
import {
  BarChart3,
  Brain,
  Clock,
  Trophy,
  TrendingUp,
  Users,
  Zap,
  Target
} from 'lucide-react';

interface StatsDisplaySectionProps {
  isDarkMode: boolean;
}

const StatsDisplaySection: React.FC<StatsDisplaySectionProps> = ({ isDarkMode }) => {

  return (
    <div className="space-y-12 py-8">
      <div className="text-center mb-8">
        <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Аналитика и статистика
        </h3>
        <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Мониторинг производительности AI-системы в реальном времени
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
        {/* Статистика анализа */}
        <div className="space-y-6">
          <h4 className={`text-xl font-semibold text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Статистика анализа
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'}`}>
              <div className="flex justify-center mb-4">
                <BarChart3 className={`w-12 h-12 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                156
              </h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Документов проанализировано
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Последний: 2 часа назад
              </p>
            </div>
            <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'}`}>
              <div className="flex justify-center mb-4">
                <Brain className={`w-12 h-12 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                94.5%
              </h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Средняя точность AI
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Обновлено в реальном времени
              </p>
            </div>
            <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'}`}>
              <div className="flex justify-center mb-4">
                <Trophy className={`w-12 h-12 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                312
              </h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Часов сэкономлено
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                За последний месяц
              </p>
            </div>
          </div>
        </div>

        {/* Производительность */}
        <div className="space-y-6">
          <h4 className={`text-xl font-semibold text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Производительность
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'}`}>
              <div className="flex justify-center mb-4">
                <Clock className={`w-12 h-12 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                2.5 мин
              </h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Среднее время анализа
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Последние 50 анализов
              </p>
            </div>
            <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'}`}>
              <div className="flex justify-center mb-4">
                <Users className={`w-12 h-12 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} />
              </div>
              <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                5
              </h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Экспертов онлайн
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Сейчас активны
              </p>
            </div>
            <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'}`}>
              <div className="flex justify-center mb-4">
                <TrendingUp className={`w-12 h-12 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              </div>
              <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                89%
              </h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Проектов одобрено
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                По итогам анализа
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Дополнительные метрики */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 p-6 rounded-2xl backdrop-blur-md border ${
        isDarkMode 
          ? 'bg-white/[0.02] border-gray-800' 
          : 'bg-black/[0.02] border-gray-200'
      }`}>
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Zap className={`w-8 h-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            99.9%
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Uptime
          </p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Target className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            85+
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Поставщиков
          </p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <BarChart3 className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            23
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Анализов/месяц
          </p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Brain className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            6
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            AI Моделей
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsDisplaySection;