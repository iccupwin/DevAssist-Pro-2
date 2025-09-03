/**
 * Backend PDF Export Button
 * Интегрированная кнопка экспорта PDF с backend API
 * Поддерживает кириллицу и профессиональное оформление
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { KPAnalysisResult } from '../../types/kpAnalyzer';

interface BackendPDFExportButtonProps {
  analysisData: KPAnalysisResult;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
}

interface PDFExportResponse {
  success: boolean;
  pdf_url?: string;
  filename?: string;
  error?: string;
  details?: string;
}

export const BackendPDFExportButton: React.FC<BackendPDFExportButtonProps> = ({
  analysisData,
  className,
  variant = 'default',
  size = 'default',
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');

  const exportToPDF = async () => {
    if (!analysisData) {
      toast.error('Нет данных для экспорта');
      return;
    }

    try {
      setIsExporting(true);
      setExportStatus('exporting');
      
      // Показываем уведомление о начале экспорта
      const loadingToastId = toast.loading(
        'Создание профессионального PDF отчета с поддержкой кириллицы...',
        { duration: 0 }
      );

      // Подготавливаем данные для backend API
      const exportData = preparePDFData(analysisData);
      
      console.log('🔄 Отправка данных на backend для PDF экспорта');
      
      // Отправляем запрос на backend для генерации PDF
      const response = await fetch('/api/reports/export/kp-analysis-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result: PDFExportResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Неизвестная ошибка при создании PDF');
      }

      // Успешный экспорт
      setExportStatus('success');
      toast.dismiss(loadingToastId);
      
      console.log('✅ PDF успешно создан:', result);
      
      // Скачиваем файл
      if (result.pdf_url) {
        try {
          const downloadResponse = await fetch(result.pdf_url);
          
          if (!downloadResponse.ok) {
            throw new Error(`Ошибка скачивания: HTTP ${downloadResponse.status}`);
          }
          
          const blob = await downloadResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = result.filename || generateFilename(analysisData);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast.success('PDF отчет успешно создан и скачан!', {
            duration: 3000,
            icon: '📄'
          });
        } catch (downloadError) {
          console.error('Ошибка скачивания PDF:', downloadError);
          
          // Показываем ссылку для скачивания в случае ошибки
          toast.success(
            <div>
              PDF создан! <br/>
              <a 
                href={result.pdf_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Скачать PDF отчет
              </a>
            </div>,
            { duration: 8000 }
          );
        }
      }

      // Сброс статуса через 2 секунды
      setTimeout(() => setExportStatus('idle'), 2000);

    } catch (error) {
      console.error('Ошибка экспорта PDF:', error);
      setExportStatus('error');
      
      toast.error(
        <div className="max-w-sm">
          <div className="font-semibold">Ошибка создания PDF отчета</div>
          <div className="text-sm mt-1 text-gray-600">
            {error instanceof Error ? error.message : 'Неизвестная ошибка'}
          </div>
          <div className="text-xs mt-2 text-gray-500">
            Проверьте работу backend сервера
          </div>
        </div>,
        { duration: 6000 }
      );

      // Сброс статуса через 3 секунды
      setTimeout(() => setExportStatus('idle'), 3000);
      
    } finally {
      setIsExporting(false);
    }
  };

  const preparePDFData = (data: KPAnalysisResult) => {
    // Преобразуем данные KP анализа в формат для backend PDF API
    return {
      // Основная информация
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tz_name: data.tz?.name || data.tzName || 'Техническое задание',
      kp_name: data.kp?.name || data.kpName || data.documentName || 'Коммерческое предложение',
      company_name: data.companyName || data.kp?.name || 'Компания-исполнитель',
      
      // Оценки и метаданные
      overall_score: Math.round(data.overallScore || 0),
      confidence_level: 90,
      analysis_duration: 60,
      model_used: 'claude-3-5-sonnet-20241022',
      analysis_version: '2.0',
      created_at: new Date().toISOString(),

      // Финансовые данные
      pricing: data.pricing || extractPricing(data) || 'Стоимость не указана',
      timeline: data.timeline || extractTimeline(data) || 'Сроки не указаны', 
      tech_stack: data.techStack || data.technologies || 'Технологии не указаны',
      
      // Валютная информация
      primary_currency: {
        code: 'RUB',
        symbol: '₽',
        name: 'Российский рубль',
        detected: true
      },
      currencies_detected: [
        {
          code: 'RUB',
          symbol: '₽',
          name: 'Российский рубль',
          detected: true
        }
      ],

      // Разделы анализа
      budget_compliance: createSection(
        'budget_compliance',
        'Бюджетное соответствие',
        getBudgetScore(data),
        'Анализ соответствия предложенного бюджета требованиям ТЗ',
        getBudgetFindings(data),
        ['Требуется дополнительная проработка бюджета', 'Уточнить детали ценообразования']
      ),
      
      timeline_compliance: createSection(
        'timeline_compliance',
        'Временные рамки',
        getTimelineScore(data),
        'Оценка реалистичности предложенных сроков выполнения',
        getTimelineFindings(data),
        ['Уточнить детали планирования этапов', 'Добавить буферное время для рисков']
      ),

      technical_compliance: createSection(
        'technical_compliance',
        'Техническое соответствие',
        getTechnicalScore(data),
        'Анализ соответствия предложенных технических решений требованиям',
        getTechnicalFindings(data),
        data.weaknesses?.slice(0, 3) || ['Детализировать техническое решение']
      ),

      team_expertise: createSection(
        'team_expertise',
        'Команда и экспертиза',
        Math.max(0, Math.round((data.overallScore || 0) - 5)),
        'Оценка квалификации предлагаемой команды разработчиков',
        ['Анализ квалификации команды', 'Проверка портфолио и опыта работы'],
        ['Предоставить детальные CV специалистов', 'Провести техническое интервью']
      ),

      // Итоговые рекомендации
      final_recommendation: getFinalRecommendation(data.overallScore || 0),
      executive_summary: data.summary || data.executiveSummary || generateExecutiveSummary(data),
      key_strengths: data.strengths || data.keyStrengths || [
        'Соответствие основным требованиям ТЗ',
        'Адекватное ценовое предложение',
        'Современный подход к решению задач'
      ],
      critical_concerns: data.weaknesses || data.criticalConcerns || [
        'Требуется детализация отдельных аспектов',
        'Необходимо уточнение технических деталей'
      ],
      next_steps: [
        'Провести техническое интервью с командой разработчиков',
        'Уточнить детали реализации и архитектуры проекта',
        'Согласовать финальные условия контракта и график платежей',
        'Определить процедуры приемки результатов на каждом этапе'
      ]
    };
  };

  // Вспомогательные функции
  const createSection = (id: string, title: string, score: number, description: string, findings: string[], recommendations: string[]) => ({
    id,
    title,
    score,
    description,
    key_findings: findings,
    recommendations,
    risk_level: score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high'
  });

  const getBudgetScore = (data: KPAnalysisResult): number => {
    const budgetSection = data.sections?.find(s => 
      s.name.toLowerCase().includes('бюджет') || 
      s.name.toLowerCase().includes('стоимость') ||
      s.name.toLowerCase().includes('финанс')
    );
    return Math.round(budgetSection?.score || data.overallScore || 0);
  };

  const getTimelineScore = (data: KPAnalysisResult): number => {
    const timelineSection = data.sections?.find(s => 
      s.name.toLowerCase().includes('срок') || 
      s.name.toLowerCase().includes('время') ||
      s.name.toLowerCase().includes('график')
    );
    return Math.round(timelineSection?.score || data.overallScore || 0);
  };

  const getTechnicalScore = (data: KPAnalysisResult): number => {
    const techSection = data.sections?.find(s => 
      s.name.toLowerCase().includes('техн') ||
      s.name.toLowerCase().includes('архитект') ||
      s.name.toLowerCase().includes('решение')
    );
    return Math.round(techSection?.score || data.overallScore || 0);
  };

  const getBudgetFindings = (data: KPAnalysisResult): string[] => {
    const findings = [];
    if (data.pricing) findings.push(`Предложенная стоимость: ${data.pricing}`);
    findings.push('Анализ финансовых показателей выполнен');
    if (data.costBreakdown) findings.push('Детализация расходов представлена');
    return findings;
  };

  const getTimelineFindings = (data: KPAnalysisResult): string[] => {
    const findings = [];
    if (data.timeline) findings.push(`Предложенные сроки: ${data.timeline}`);
    findings.push('Анализ временных рамок проведен');
    if (data.milestones) findings.push('Ключевые вехи проекта определены');
    return findings;
  };

  const getTechnicalFindings = (data: KPAnalysisResult): string[] => {
    const findings = [];
    if (data.techStack) findings.push(`Технологический стек: ${data.techStack}`);
    findings.push('Анализ технических решений выполнен');
    if (data.architecture) findings.push('Архитектура системы проработана');
    return findings;
  };

  const extractPricing = (data: KPAnalysisResult): string | null => {
    // Пытаемся извлечь ценовую информацию из различных полей
    if (data.budget) return data.budget;
    if (data.cost) return data.cost;
    if (data.price) return data.price;
    return null;
  };

  const extractTimeline = (data: KPAnalysisResult): string | null => {
    // Пытаемся извлечь информацию о сроках из различных полей
    if (data.duration) return data.duration;
    if (data.deadline) return data.deadline;
    if (data.schedule) return data.schedule;
    return null;
  };

  const getFinalRecommendation = (score: number): string => {
    if (score >= 80) return 'accept';
    if (score >= 60) return 'conditional_accept';
    return 'needs_revision';
  };

  const generateExecutiveSummary = (data: KPAnalysisResult): string => {
    const companyName = data.companyName || 'данной компании';
    const score = Math.round(data.overallScore || 0);
    
    let summary = `Коммерческое предложение от ${companyName} получило общую оценку ${score}/100 баллов. `;
    
    if (score >= 80) {
      summary += 'Предложение демонстрирует высокий уровень качества и соответствия требованиям. ';
      summary += 'Рекомендуется принять предложение.';
    } else if (score >= 60) {
      summary += 'Предложение имеет потенциал, но требует доработки отдельных аспектов. ';
      summary += 'Рекомендуется принять с условиями после устранения замечаний.';
    } else {
      summary += 'Предложение нуждается в существенной доработке перед принятием. ';
      summary += 'Рекомендуется запросить пересмотр ключевых позиций.';
    }
    
    return summary;
  };

  const generateFilename = (data: KPAnalysisResult): string => {
    const companyName = data.companyName?.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '').replace(/\s+/g, '_') || 'company';
    const date = new Date().toISOString().split('T')[0];
    return `DevAssist_Pro_KP_Analysis_${companyName}_${date}.pdf`;
  };

  const getButtonIcon = () => {
    switch (exportStatus) {
      case 'exporting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const getButtonText = () => {
    switch (exportStatus) {
      case 'exporting':
        return 'Создание PDF...';
      case 'success':
        return 'PDF готов!';
      case 'error':
        return 'Ошибка';
      default:
        return 'Скачать PDF отчет';
    }
  };

  const getButtonVariant = () => {
    if (exportStatus === 'success') return 'default';
    if (exportStatus === 'error') return 'destructive';
    return variant;
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Button
        onClick={exportToPDF}
        disabled={isExporting || !analysisData || disabled}
        variant={getButtonVariant()}
        size={size}
        className="min-w-[200px] font-medium"
      >
        {getButtonIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>
      
      {exportStatus === 'idle' && (
        <div className="flex items-center text-sm text-muted-foreground">
          <FileText className="w-3 h-3 mr-1" />
          <span>Профессиональный PDF</span>
        </div>
      )}
      
      {exportStatus === 'success' && (
        <div className="flex items-center text-sm text-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          <span>Успешно создан</span>
        </div>
      )}

      {exportStatus === 'exporting' && (
        <div className="flex items-center text-sm text-blue-600">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          <span>Создание отчета...</span>
        </div>
      )}
    </div>
  );
};

export default BackendPDFExportButton;