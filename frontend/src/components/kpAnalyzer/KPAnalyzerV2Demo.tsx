/**
 * Demo component to test KP Analyzer v2 with TZ vs KP comparison
 * Standalone component for testing new functionality
 */

import React from 'react';
import { Brain, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const KPAnalyzerV2Demo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full inline-block mb-4">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 КП Анализатор v2 - ОБНОВЛЕНО!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Теперь с полноценным сравнительным анализом ТЗ vs КП!
          </p>
        </div>

        {/* What's New */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ✅ Что добавлено в v2:
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">📄 Загрузка ТЗ</h3>
                  <p className="text-gray-600 text-sm">Отдельная зона для Технического Задания</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">📋 Множественные КП</h3>
                  <p className="text-gray-600 text-sm">Загрузка до 5 коммерческих предложений</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">🔍 Сравнительный анализ</h3>
                  <p className="text-gray-600 text-sm">Детальное сравнение КП с требованиями ТЗ</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">⚡ Валидация</h3>
                  <p className="text-gray-600 text-sm">Проверка обязательных файлов</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">📊 Новые метрики</h3>
                  <p className="text-gray-600 text-sm">Процент соответствия ТЗ, анализ отклонений</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">💡 Улучшенный UI</h3>
                  <p className="text-gray-600 text-sm">Раздельные зоны загрузки, индикаторы статуса</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Process Flow */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🚀 Как работает новый процесс
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Загружаете ТЗ</h3>
              <p className="text-gray-600">
                Техническое задание становится базисом для сравнения. 
                <strong className="text-blue-600"> Обязательный файл!</strong>
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Добавляете КП</h3>
              <p className="text-gray-600">
                Одно или несколько коммерческих предложений для анализа против ТЗ.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Получаете сравнение</h3>
              <p className="text-gray-600">
                Детальное сравнение каждого КП с требованиями ТЗ, оценка соответствия.
              </p>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            💯 Что получаете в результате:
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">%</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Процент соответствия ТЗ</h3>
                <p className="text-gray-600">Точная оценка того, насколько каждое КП соответствует техническому заданию</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Детальное сравнение по разделам</h3>
                <p className="text-gray-600">Анализ каждого раздела КП против соответствующих требований ТЗ</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Выявление отклонений и пробелов</h3>
                <p className="text-gray-600">Что отсутствует в КП или не соответствует требованиям ТЗ</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">→</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Рекомендации по улучшению</h3>
                <p className="text-gray-600">Конкретные советы как доработать КП для лучшего соответствия ТЗ</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <a 
            href="/kp-analyzer-v2" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            <Brain className="w-6 h-6 mr-3" />
            🚀 Попробовать КП Анализатор v2
          </a>
        </div>
      </div>
    </div>
  );
};

export default KPAnalyzerV2Demo;