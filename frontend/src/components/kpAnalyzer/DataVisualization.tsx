import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { KPAnalysisResult } from '../../types/kpAnalyzer';
import { 
  getComplianceScore, 
  getCompanyName, 
  getFileName, 
  getAnalysis,
  getExtractedData
} from '../../utils/kpAnalyzerUtils';

interface DataVisualizationProps {
  results: KPAnalysisResult[];
  className?: string;
}

export const DataVisualization: React.FC<DataVisualizationProps> = ({
  results,
  className = ''
}) => {
  // Подготовка данных для диаграмм
  const chartData = useMemo(() => {
    if (!results.length) return [];

    return results.map(result => {
      const extractedData = getExtractedData(result);
      const analysis = getAnalysis(result);
      const companyName = getCompanyName(result);
      
      return {
        name: companyName.length > 15 
          ? companyName.substring(0, 15) + '...'
          : companyName,
        fullName: companyName,
        score: getComplianceScore(result),
        compliance: analysis.compliance,
        technical: analysis.technical,
        commercial: analysis.commercial,
        experience: analysis.experience,
        pricing: extractedData.pricing.includes('руб') 
          ? parseInt(extractedData.pricing.replace(/\D/g, '')) / 1000000 
          : Math.random() * 10 + 2,
        fileName: getFileName(result)
      };
    });
  }, [results]);

  // Данные для радарной диаграммы (средние показатели)
  const radarData = useMemo(() => {
    if (!results.length) return [];

    const avgCompliance = results.reduce((sum, r) => sum + getAnalysis(r).compliance, 0) / results.length;
    const avgTechnical = results.reduce((sum, r) => sum + getAnalysis(r).technical, 0) / results.length;
    const avgCommercial = results.reduce((sum, r) => sum + getAnalysis(r).commercial, 0) / results.length;
    const avgExperience = results.reduce((sum, r) => sum + getAnalysis(r).experience, 0) / results.length;

    return [
      { subject: 'Соответствие ТЗ', A: avgCompliance, fullMark: 100 },
      { subject: 'Техническая часть', A: avgTechnical, fullMark: 100 },
      { subject: 'Коммерческие условия', A: avgCommercial, fullMark: 100 },
      { subject: 'Опыт команды', A: avgExperience, fullMark: 100 }
    ];
  }, [results]);

  // Данные для пирога (распределение по рейтингам)
  const pieData = useMemo(() => {
    if (!results.length) return [];

    const high = results.filter(r => getComplianceScore(r) >= 80).length;
    const medium = results.filter(r => getComplianceScore(r) >= 60 && getComplianceScore(r) < 80).length;
    const low = results.filter(r => getComplianceScore(r) < 60).length;

    return [
      { name: 'Высокий рейтинг (80%+)', value: high, color: '#10B981' },
      { name: 'Средний рейтинг (60-79%)', value: medium, color: '#F59E0B' },
      { name: 'Низкий рейтинг (<60%)', value: low, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [results]);

  // Кастомный тултип
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{data.fullName || label}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: pld.color }}>
              {`${pld.dataKey === 'pricing' ? 'Стоимость' : pld.dataKey}: ${pld.value}${pld.dataKey === 'pricing' ? ' млн руб.' : '%'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!results.length) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center ${className}`}>
        <div className="text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">Нет данных для визуализации</h3>
          <p>Проведите анализ КП для отображения диаграмм и графиков</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Аналитика и визуализация</h3>
        </div>
        <p className="text-gray-600">
          Графическое представление результатов анализа {results.length} коммерческих предложений
        </p>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Средний балл',
            value: `${Math.round(results.reduce((sum, r) => sum + getComplianceScore(r), 0) / results.length)}%`,
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
          },
          {
            label: 'Лучший результат',
            value: `${Math.max(...results.map(r => getComplianceScore(r)))}%`,
            icon: Activity,
            color: 'text-green-600',
            bg: 'bg-green-50'
          },
          {
            label: 'Анализированных КП',
            value: results.length.toString(),
            icon: BarChart3,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
          },
          {
            label: 'Качественных предложений',
            value: results.filter(r => getComplianceScore(r) >= 80).length.toString(),
            icon: PieChartIcon,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
          }
        ].map((metric, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${metric.bg}`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Диаграммы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Столбчатая диаграмма - Общие баллы */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Общие баллы КП</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
              />
              <YAxis stroke="#666" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Радарная диаграмма - Средние показатели */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Средние показатели по критериям</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f0f0f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar 
                dataKey="A" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Дополнительные диаграммы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Пирог - Распределение по рейтингам */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Распределение по рейтингам</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value, percent }) => `${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Линейная диаграмма - Детальные показатели */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Детальные показатели по критериям</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
              />
              <YAxis stroke="#666" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="compliance" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Соответствие"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="technical" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Техническая часть"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="commercial" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Коммерческая часть"
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="experience" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Опыт"
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Анализ стоимости */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Анализ стоимости предложений</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              stroke="#666"
              angle={-45}
              textAnchor="end"
              height={60}
              fontSize={12}
            />
            <YAxis stroke="#666" label={{ value: 'Млн руб.', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value: any) => [`${value.toFixed(1)} млн руб.`, 'Стоимость']}
              labelFormatter={(label) => `Компания: ${label}`}
            />
            <Bar dataKey="pricing" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};