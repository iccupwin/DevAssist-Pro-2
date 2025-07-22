import React from 'react';
import {
  FileCheck,
  Clock,
  DollarSign,
  ThumbsUp
} from 'lucide-react';

interface QuickStatsSectionProps {
  isDarkMode: boolean;
}

const QuickStatsSection: React.FC<QuickStatsSectionProps> = ({ isDarkMode }) => {

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Ключевые показатели
          </h3>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Основные метрики эффективности AI-анализа
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'}`}>
            <div className="flex justify-center mb-4">
              <FileCheck className={`w-12 h-12 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              156
            </h4>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              КП обработано
            </p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              ↑ 23% к предыдущему месяцу
            </p>
          </div>

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
              Быстрее на 40%
            </p>
          </div>

          <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'}`}>
            <div className="flex justify-center mb-4">
              <DollarSign className={`w-12 h-12 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            </div>
            <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ₽2.4M
            </h4>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Сэкономлено
            </p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              За счет автоматизации
            </p>
          </div>
        </div>

        {/* Дополнительные быстрые метрики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' 
              : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'
          }`}>
            <div className="flex justify-center mb-4">
              <ThumbsUp className={`w-12 h-12 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              89%
            </h4>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Успешность рекомендаций
            </p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Процент одобренных проектов
            </p>
          </div>

          <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' 
              : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'
          }`}>
            <div className="flex justify-center mb-4">
              <FileCheck className={`w-12 h-12 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              94.5%
            </h4>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Точность AI анализа
            </p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Средняя точность всех моделей
            </p>
          </div>

          <div className={`p-6 rounded-2xl backdrop-blur-md border text-center transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-white/[0.02] border-gray-800 hover:bg-white/[0.05]' 
              : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'
          }`}>
            <div className="flex justify-center mb-4">
              <Clock className={`w-12 h-12 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
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
    </div>
  );
};

export default QuickStatsSection;