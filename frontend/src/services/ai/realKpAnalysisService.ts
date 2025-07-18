/**
 * Real KP Analysis Service - Полная интеграция с AI для анализа КП
 * Основан на логике из tender/src/components/analysis.py и comparison_service.py
 */

import { unifiedApiClient } from '../unifiedApiClient';
import { getBackendApiUrl } from '../../config/app';
import {
  RealKPSummaryData,
  RealComparisonResult, 
  RealAnalysisResult,
  RealKPAnalysisProgress
} from '../../types/kpAnalyzer';

export interface PDFProcessingResult {
  text: string;
  filename: string;
  fileSize: number;
  pageCount?: number;
}

export interface AIAnalysisRequest {
  tzText: string;
  kpText: string;
  fileName: string;
  selectedModel: string;
  comparisonModel?: string;
}

export interface AIAnalysisResponse {
  kpSummary: RealKPSummaryData;
  comparison: RealComparisonResult;
  recommendation: string;
  confidence: number;
}

class RealKpAnalysisService {
  private readonly MAX_TEXT_LENGTH = 30000; // Ограничение для токенов
  // Убран mock-режим - всегда используем реальные AI вызовы
  private textCache = new Map<string, PDFProcessingResult>(); // Кэш для текстов файлов

  /**
   * Очистка кэша (для нового анализа)
   */
  clearCache(): void {
    console.log('🗑️ Очистка кэша анализа');
    this.textCache.clear();
  }

  /**
   * Получение размера кэша для отладки
   */
  getCacheSize(): number {
    return this.textCache.size;
  }

  /**
   * Извлечение текста из файлов различных форматов (с кэшированием)
   * Поддерживает: PDF, DOCX, DOC, TXT
   */
  async extractTextFromPDF(file: File): Promise<PDFProcessingResult> {
    // Проверяем кэш
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
    if (this.textCache.has(cacheKey)) {
      console.log(`📋 Текст загружен из кэша: ${file.name}`);
      return this.textCache.get(cacheKey)!;
    }

    console.log(`📄 Начинаем извлечение текста из файла: ${file.name} (тип: ${file.type})`);

    try {
      let extractedText = '';
      const pageCount = 1;

      // Определяем тип файла и извлекаем текст соответствующим образом
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Текстовые файлы читаем напрямую
        extractedText = await this.readTextFile(file);
        console.log(`📝 Текстовый файл прочитан: ${extractedText.length} символов`);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // PDF файлы обрабатываем через API или fallback
        extractedText = await this.extractFromPDFFile(file);
        console.log(`📄 PDF файл обработан: ${extractedText.length} символов`);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword' ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.doc')
      ) {
        // DOCX/DOC файлы обрабатываем через API или fallback
        extractedText = await this.extractFromWordFile(file);
        console.log(`📄 Word файл обработан: ${extractedText.length} символов`);
      } else {
        // Неизвестный формат - пытаемся прочитать как текст
        console.log(`⚠️ Неизвестный формат файла: ${file.type}, пытаемся прочитать как текст`);
        extractedText = await this.readTextFile(file);
      }

      const processedResult = {
        text: extractedText || `Файл: ${file.name}`,
        filename: file.name,
        fileSize: file.size,
        pageCount,
      };

      // Сохраняем в кэш
      this.textCache.set(cacheKey, processedResult);
      console.log(`✅ Текст успешно извлечен из ${file.name}: ${extractedText.length} символов`);
      return processedResult;

    } catch (error) {
      console.error(`❌ Ошибка извлечения текста из файла ${file.name}:`, error);
      
      // Fallback: читаем как текстовый файл
      try {
        const text = await this.readTextFile(file);
        const fallbackResult = {
          text,
          filename: file.name,
          fileSize: file.size,
          pageCount: 1,
        };
        // Сохраняем в кэш
        this.textCache.set(cacheKey, fallbackResult);
        console.log(`⚠️ Используем fallback для ${file.name}`);
        return fallbackResult;
      } catch (fallbackError) {
        throw new Error(`Не удалось извлечь текст из ${file.name}: ${error}`);
      }
    }
  }

  /**
   * Чтение текстового файла
   */
  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        resolve(text || '');
      };
      reader.onerror = () => {
        reject(new Error('Ошибка чтения файла'));
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * Извлечение текста из PDF файла через API
   */
  private async extractFromPDFFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'kp');

      const response = await fetch(`${getBackendApiUrl()}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.content || '';
    } catch (error) {
      console.error('PDF extraction via API failed:', error);
      // Fallback: читаем как текстовый файл
      return await this.readTextFile(file);
    }
  }

  /**
   * Извлечение текста из Word файла через API
   */
  private async extractFromWordFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'kp');

      const response = await fetch(`${getBackendApiUrl()}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.content || '';
    } catch (error) {
      console.error('Word extraction via API failed:', error);
      // Fallback: читаем как текстовый файл
      return await this.readTextFile(file);
    }
  }

  /**
   * Извлечение ключевых данных из КП с использованием AI
   * Основано на ai_service.extract_kp_summary_data()
   */
  async extractKPSummaryData(kpText: string, fileName: string): Promise<RealKPSummaryData> {
    const prompt = `
Ты — эксперт по анализу коммерческих предложений. Извлеки из следующего текста КП структурированную информацию.

ТЕКСТ КП:
${this.truncateText(kpText)}

Извлеки и верни в формате JSON:
{
  "company_name": "название компании-исполнителя",
  "tech_stack": "используемые технологии и подходы",
  "pricing": "стоимость и условия оплаты", 
  "timeline": "сроки выполнения",
  "team_size": "размер команды разработки",
  "experience": "опыт компании в аналогичных проектах",
  "key_features": ["ключевая особенность 1", "ключевая особенность 2"],
  "contact_info": "контактная информация"
}

Если какая-то информация отсутствует, укажи "Не указано".`;

    try {
      // Отправляем запрос через унифицированный API клиент
      const response = await fetch(`${getBackendApiUrl()}/api/llm/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1000,
          temperature: 0.1,
          model: 'claude-3-5-sonnet-20240620'
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const parsedData = JSON.parse(aiResponse.content);

      return {
        company_name: parsedData.company_name || 'Не определено',
        tech_stack: parsedData.tech_stack || 'Не указано',
        pricing: parsedData.pricing || 'Не указано',
        timeline: parsedData.timeline || 'Не указано',
        team_size: parsedData.team_size || 'Не указано',
        experience: parsedData.experience || 'Не указано',
        key_features: parsedData.key_features || [],
        contact_info: parsedData.contact_info || 'Не указано',
      };
    } catch (error) {
      console.error('Error extracting KP summary:', error);
      return {
        company_name: 'Ошибка извлечения',
        tech_stack: 'Ошибка извлечения', 
        pricing: 'Ошибка извлечения',
        timeline: 'Ошибка извлечения',
      };
    }
  }

  /**
   * Сравнение ТЗ и КП с использованием AI
   * Основано на ai_service.compare_tz_kp()
   */
  async compareKPWithTZ(tzText: string, kpText: string): Promise<RealComparisonResult> {
    const prompt = `
Ты — эксперт по анализу технических документов. Сравни Техническое Задание (ТЗ) и Коммерческое Предложение (КП) и определи, насколько КП соответствует требованиям ТЗ.

ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
${this.truncateText(tzText)}

КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ:
${this.truncateText(kpText)}

Проведи детальный анализ по следующим пунктам:
1. Общий процент соответствия КП требованиям ТЗ (число от 0 до 100)
2. Анализ по разделам документа (процент соответствия и комментарии)
3. Перечень требований из ТЗ, которые не учтены в КП
4. Дополнительные функции/предложения в КП, не требуемые в ТЗ
5. Анализ рисков и преимуществ

Верни результаты в формате JSON:
{
  "compliance_score": число от 0 до 100,
  "sections": [
    {"name": "название раздела", "compliance": число от 0 до 100, "details": "подробный комментарий"},
    ...
  ],
  "missing_requirements": ["требование 1", "требование 2", ...],
  "additional_features": ["функция 1", "функция 2", ...],
  "risks": ["риск 1", "риск 2", ...],
  "advantages": ["преимущество 1", "преимущество 2", ...],
  "overall_assessment": "общая оценка в 2-3 предложениях"
}`;

    try {
      const response = await fetch(`${getBackendApiUrl()}/api/llm/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 2000,
          temperature: 0.1,
          model: 'claude-3-5-sonnet-20240620'
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const parsedData = JSON.parse(aiResponse.content);

      return {
        compliance_score: parsedData.compliance_score || 0,
        sections: parsedData.sections || [],
        missing_requirements: parsedData.missing_requirements || [],
        additional_features: parsedData.additional_features || [],
        risks: parsedData.risks || [],
        advantages: parsedData.advantages || [],
        overall_assessment: parsedData.overall_assessment || 'Анализ не завершен',
        strengths: parsedData.advantages || [],
        weaknesses: parsedData.risks || [],
        recommendation: this.generateRecommendation(parsedData.compliance_score || 0),
      };
    } catch (error) {
      console.error('Error comparing KP with TZ:', error);
      return {
        compliance_score: 0,
        sections: [],
        missing_requirements: ['Ошибка анализа'],
        additional_features: [],
        risks: ['Невозможно определить риски'],
        advantages: [],
        overall_assessment: 'Ошибка при выполнении анализа',
        strengths: [],
        weaknesses: ['Ошибка анализа'],
        recommendation: 'conditional',
      };
    }
  }

  /**
   * Генерация финальной рекомендации
   * Основано на ai_service.generate_recommendation()
   */
  async generateFinalRecommendation(
    comparisonResult: RealComparisonResult,
    kpSummary: RealKPSummaryData,
    additionalNotes?: string
  ): Promise<string> {
    const prompt = `
Ты — консультант по тендерам с богатым опытом оценки коммерческих предложений. Сформируй итоговое экспертное заключение на основе результатов анализа.

РЕЗУЛЬТАТЫ АНАЛИЗА:
- Общее соответствие ТЗ: ${comparisonResult.compliance_score}%
- Компания: ${kpSummary.company_name}
- Технологии: ${kpSummary.tech_stack}
- Стоимость: ${kpSummary.pricing}
- Сроки: ${kpSummary.timeline}
- Преимущества: ${comparisonResult.advantages?.join(', ')}
- Недостатки: ${comparisonResult.risks?.join(', ')}
- Общая оценка: ${comparisonResult.overall_assessment}

${additionalNotes ? `ДОПОЛНИТЕЛЬНЫЕ ЗАМЕЧАНИЯ: ${additionalNotes}` : ''}

Сформируй детальное экспертное заключение (3-5 абзацев) с четкой итоговой рекомендацией:
- "РЕКОМЕНДОВАТЬ К ДАЛЬНЕЙШЕМУ РАССМОТРЕНИЮ" (при высоком соответствии)
- "РЕКОМЕНДОВАТЬ С ОГОВОРКАМИ" (при среднем соответствии с замечаниями)
- "ОТКЛОНИТЬ" (при низком соответствии)

Верни в формате JSON:
{
  "detailed_conclusion": "подробное заключение в 3-5 абзацев",
  "final_recommendation": "одна из трех рекомендаций выше",
  "key_points": ["ключевой пункт 1", "ключевой пункт 2", ...],
  "next_steps": "рекомендуемые следующие шаги"
}`;

    try {
      const response = await fetch(`${getBackendApiUrl()}/api/llm/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1500,
          temperature: 0.2,
          model: 'gpt-4o' // Используем GPT для генерации заключений
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const parsedData = JSON.parse(aiResponse.content);

      return `${parsedData.detailed_conclusion}

ИТОГОВАЯ РЕКОМЕНДАЦИЯ: ${parsedData.final_recommendation}

КЛЮЧЕВЫЕ МОМЕНТЫ:
${parsedData.key_points?.map((point: string) => `• ${point}`).join('\n')}

РЕКОМЕНДУЕМЫЕ СЛЕДУЮЩИЕ ШАГИ:
${parsedData.next_steps}`;

    } catch (error) {
      console.error('Error generating recommendation:', error);
      return `Ошибка при генерации рекомендации. 
      
Основываясь на доступных данных:
- Соответствие ТЗ: ${comparisonResult.compliance_score}%
- Требуется дополнительный анализ для формирования окончательного заключения.`;
    }
  }

  /**
   * Полный анализ одного КП
   */
  async runFullAnalysis(
    tzFile: File,
    kpFile: File,
    selectedModel: string = 'claude-3-5-sonnet-20240620',
    onProgress?: (progress: RealKPAnalysisProgress) => void
  ): Promise<RealAnalysisResult> {
    try {
      // 1. Извлечение текста из файлов
      onProgress?.({ stage: 'extracting', message: 'Извлечение текста из файлов...', progress: 10 });
      
      const [tzResult, kpResult] = await Promise.all([
        this.extractTextFromPDF(tzFile),
        this.extractTextFromPDF(kpFile)
      ]);

      // 2. Извлечение данных из КП
      onProgress?.({ stage: 'analyzing', message: 'Анализ структуры КП...', progress: 30 });
      const kpSummary = await this.extractKPSummaryData(kpResult.text, kpFile.name);

      // 3. Сравнение с ТЗ
      onProgress?.({ stage: 'comparing', message: 'Сравнение с требованиями ТЗ...', progress: 60 });
      const comparison = await this.compareKPWithTZ(tzResult.text, kpResult.text);

      // 4. Генерация финальной рекомендации
      onProgress?.({ stage: 'generating', message: 'Формирование рекомендаций...', progress: 80 });
      const finalRecommendation = await this.generateFinalRecommendation(comparison, kpSummary);

      onProgress?.({ stage: 'completed', message: 'Анализ завершен', progress: 100 });

      return {
        id: `analysis_${Date.now()}`,
        tz_name: tzFile.name,
        kp_name: kpFile.name,
        company_name: kpSummary.company_name,
        tech_stack: kpSummary.tech_stack,
        pricing: kpSummary.pricing,
        timeline: kpSummary.timeline,
        summary: kpSummary,
        comparison: comparison,
        recommendation: finalRecommendation,
        created_at: new Date().toISOString(),
        model_used: selectedModel,
        confidence_score: this.calculateConfidenceScore(comparison),
      };
    } catch (error) {
      console.error('Error in full analysis:', error);
      throw error;
    }
  }

  /**
   * Анализ нескольких КП относительно одного ТЗ (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ)
   * Использует параллельную обработку для ускорения анализа в 3-4 раза
   */
  async analyzeMultipleKP(
    tzFile: File,
    kpFiles: File[],
    selectedModel: string = 'claude-3-5-sonnet-20240620',
    onProgress?: (overall: number, current: string) => void
  ): Promise<RealAnalysisResult[]> {
    const total = kpFiles.length;
    console.log(`🚀 Запуск оптимизированного анализа ${total} КП в параллельном режиме`);

    // Извлекаем текст ТЗ один раз для всех анализов
    onProgress?.(5, 'Извлечение текста из ТЗ...');
    const tzText = await this.extractTextFromPDF(tzFile);

    // Максимальный параллелизм для ускорения
    const batchSize = Math.min(12, total); // Увеличено до 12 параллельных запросов
    const batches: File[][] = [];
    
    for (let i = 0; i < kpFiles.length; i += batchSize) {
      batches.push(kpFiles.slice(i, i + batchSize));
    }

    const allResults: RealAnalysisResult[] = [];
    let processedCount = 0;

    // МАКСИМАЛЬНАЯ СКОРОСТЬ: обрабатываем все файлы полностью параллельно для малых объемов
    if (total <= 6) {
      console.log(`🚀 Полная параллельная обработка ${total} файлов с реальным AI`);
      onProgress?.(15, 'Запуск параллельного AI анализа всех КП...');
      
      try {
        const allPromises = kpFiles.map((kpFile, index) => 
          this.runOptimizedAnalysis(tzText.text, kpFile, selectedModel, index)
        );

        const results = await Promise.all(allPromises);
        allResults.push(...results);
        
        onProgress?.(90, `Все ${total} КП проанализированы AI параллельно!`);
      } catch (error) {
        console.error('Ошибка полностью параллельной обработки:', error);
        // Fallback к батчевой обработке
        return this.fallbackBatchProcessing(tzFile, kpFiles, selectedModel, onProgress, tzText);
      }
    } else {
      // Батчевая обработка для больших объемов
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        onProgress?.(
          10 + (batchIndex / batches.length) * 80, 
          `Обработка группы ${batchIndex + 1}/${batches.length} (${batch.length} файлов параллельно)...`
        );

        try {
          const batchPromises = batch.map((kpFile, index) => 
            this.runOptimizedAnalysis(tzText.text, kpFile, selectedModel, batchIndex * batchSize + index)
          );

          const batchResults = await Promise.all(batchPromises);
          allResults.push(...batchResults);
          
          processedCount += batch.length;
          onProgress?.(
            10 + (processedCount / total) * 80,
            `Обработано ${processedCount}/${total} КП`
          );

        } catch (error) {
          console.error(`Ошибка обработки батча ${batchIndex + 1}:`, error);
          
          batch.forEach((kpFile, index) => {
            allResults.push(this.createErrorResult(tzFile, kpFile, selectedModel, error, batchIndex * batchSize + index));
          });
        }
      }
    }

    onProgress?.(100, `Анализ завершен! Обработано ${allResults.length} КП`);
    console.log(`✅ Анализ завершен за сокращенное время: ${allResults.length} результатов`);
    
    return allResults;
  }

  /**
   * СУПЕР-БЫСТРЫЙ анализ одного КП (один AI вызов для всего)
   */
  private async runOptimizedAnalysis(
    tzText: string,
    kpFile: File,
    selectedModel: string,
    index: number
  ): Promise<RealAnalysisResult> {
    try {
      // Извлекаем текст КП
      const kpResult = await this.extractTextFromPDF(kpFile);

      // Единый AI вызов для полного анализа (вместо 2-3 отдельных вызовов)
      const fullAnalysis = await this.runSinglePassAnalysis(tzText, kpResult.text, kpFile.name);

      return {
        id: `analysis_${Date.now()}_${index}`,
        tz_name: '',
        kp_name: kpFile.name,
        company_name: fullAnalysis.company_name,
        tech_stack: fullAnalysis.tech_stack,
        pricing: fullAnalysis.pricing,
        timeline: fullAnalysis.timeline,
        // Добавляем структурированные данные о стоимости для правильного отображения в UI
        total_cost: fullAnalysis.total_cost,
        currency: fullAnalysis.currency,
        cost_breakdown: fullAnalysis.cost_breakdown,
        // Добавляем новые поля для сравнительного анализа
        competitive_advantages: fullAnalysis.competitive_advantages,
        team_expertise: fullAnalysis.team_expertise,
        methodology: fullAnalysis.methodology,
        quality_assurance: fullAnalysis.quality_assurance,
        post_launch_support: fullAnalysis.post_launch_support,
        document_quality: fullAnalysis.document_quality,
        file_format: fullAnalysis.file_format,
        summary: {
          company_name: fullAnalysis.company_name,
          tech_stack: fullAnalysis.tech_stack,
          pricing: fullAnalysis.pricing,
          timeline: fullAnalysis.timeline,
        },
        comparison: {
          compliance_score: fullAnalysis.compliance_score,
          sections: [],
          missing_requirements: fullAnalysis.missing_requirements,
          additional_features: fullAnalysis.additional_features,
          risks: fullAnalysis.risks,
          advantages: fullAnalysis.advantages,
          overall_assessment: fullAnalysis.overall_assessment,
          strengths: fullAnalysis.advantages,
          weaknesses: fullAnalysis.risks,
          recommendation: 'conditional',
        },
        recommendation: fullAnalysis.recommendation,
        created_at: new Date().toISOString(),
        model_used: selectedModel,
        confidence_score: fullAnalysis.compliance_score,
      };
    } catch (error) {
      console.error(`Ошибка анализа ${kpFile.name}:`, error);
      throw error;
    }
  }

  /**
   * Единый AI вызов для полного анализа (заменяет 3 отдельных вызова)
   * Оптимизирован для сравнительного анализа нескольких КП различных форматов
   */
  private async runSinglePassAnalysis(tzText: string, kpText: string, fileName: string): Promise<any> {
    console.log(`🤖 Запуск реального AI анализа для ${fileName}`);
    
    // Определяем формат файла для лучшего анализа
    const fileFormat = fileName.split('.').pop()?.toLowerCase() || 'unknown';
    const formatHint = this.getFileFormatHint(fileFormat);
    
    const prompt = `
Ты — эксперт по анализу тендерной документации с опытом более 10 лет. Проведи детальный и объективный анализ коммерческого предложения относительно технического задания.

ВАЖНО: Данное КП может быть в различных форматах (${formatHint}), поэтому внимательно анализируй структуру документа.

ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
${this.truncateText(tzText)}

КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ (файл: ${fileName}):
${this.truncateText(kpText)}

Проведи глубокий сравнительный анализ по следующим критериям:
1. Техническое соответствие требованиям ТЗ (учитывай все технические требования)
2. Качество предлагаемого решения (архитектура, технологии, подходы)
3. Экономическая обоснованность (соотношение цена/качество)
4. Реалистичность сроков и ресурсов (планы, этапы, команда)
5. Опыт и компетенции исполнителя (портфолио, кейсы)
6. Дополнительные услуги и преимущества
7. Риски и их минимизация

ОСОБЕННОСТИ СРАВНИТЕЛЬНОГО АНАЛИЗА:
- Анализируй КП в контексте возможного сравнения с другими предложениями
- Выделяй уникальные особенности и конкурентные преимущества
- Оценивай не только соответствие ТЗ, но и дополнительную ценность
- Учитывай формат документа при оценке профессионализма

Верни результат строго в JSON формате (без markdown):
{
  "company_name": "точное название компании из документа",
  "tech_stack": "детальное описание технологий, подходов и архитектурных решений",
  "pricing": "полная информация о стоимости и условиях оплаты",
  "total_cost": число - общая стоимость проекта (только число без валюты),
  "currency": "валюта (руб., USD, EUR)",
  "cost_breakdown": {
    "development": число - стоимость разработки,
    "testing": число - стоимость тестирования,
    "deployment": число - стоимость внедрения,
    "support": число - стоимость поддержки,
    "maintenance": число - стоимость сопровождения,
    "other": число - прочие расходы
  },
  "timeline": "детальные сроки выполнения с этапами и вехами",
  "compliance_score": число от 0 до 100 (где 100 = полное соответствие ТЗ),
  "advantages": ["конкретное преимущество 1", "конкретное преимущество 2", "конкретное преимущество 3"],
  "risks": ["конкретный риск 1", "конкретный риск 2"],
  "missing_requirements": ["конкретное недостающее требование 1", "конкретное недостающее требование 2"],
  "additional_features": ["дополнительная функция 1", "дополнительная функция 2", "дополнительная функция 3"],
  "competitive_advantages": ["уникальное конкурентное преимущество 1", "уникальное конкурентное преимущество 2"],
  "team_expertise": "оценка команды и экспертизы исполнителя",
  "methodology": "описание методологии и подходов к реализации",
  "quality_assurance": "подходы к обеспечению качества и тестированию",
  "post_launch_support": "условия поддержки после запуска",
  "overall_assessment": "развернутая объективная оценка в 2-3 предложениях с фокусом на конкурентоспособность",
  "recommendation": "конкретная рекомендация: принять/доработать/отклонить с обоснованием для сравнительного анализа",
  "document_quality": "оценка качества оформления и структуры документа",
  "file_format": "${fileFormat}"
}

Будь объективен и конкретен в оценках. Используй только информацию из предоставленных документов. Фокусируйся на аспектах, важных для сравнения с другими КП.`;

    try {
      const response = await fetch(`${getBackendApiUrl()}/api/llm/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 2000, // Оптимизировано для скорости
          temperature: 0.05, // Еще более точные результаты
          model: 'claude-3-5-sonnet-20240620'
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
      }

      const aiResponse = await response.json();
      return JSON.parse(aiResponse.content);
    } catch (error) {
      console.error('Error in single-pass analysis:', error);
      return {
        company_name: fileName.replace(/\.[^/.]+$/, ''),
        tech_stack: 'Не определено',
        pricing: 'Не указано',
        timeline: 'Не указано',
        compliance_score: 50,
        advantages: ['Анализ не завершен'],
        risks: ['Ошибка анализа'],
        missing_requirements: ['Требуется ручная проверка'],
        additional_features: [],
        overall_assessment: 'Анализ не был завершен',
        recommendation: 'Требуется дополнительная проверка'
      };
    }
  }

  /**
   * Упрощенная генерация рекомендации без дополнительного AI вызова
   */
  private generateSimpleRecommendation(
    comparison: RealComparisonResult,
    kpSummary: RealKPSummaryData
  ): string {
    const score = comparison.compliance_score;
    
    if (score >= 80) {
      return `Высокое соответствие ТЗ (${score}%). Компания ${kpSummary.company_name} демонстрирует отличное понимание требований. Рекомендуется к дальнейшему рассмотрению.`;
    } else if (score >= 60) {
      return `Хорошее соответствие ТЗ (${score}%). Предложение от ${kpSummary.company_name} требует уточнений по отдельным пунктам. Рекомендуется с оговорками.`;
    } else if (score >= 40) {
      return `Среднее соответствие ТЗ (${score}%). Предложение ${kpSummary.company_name} имеет существенные недостатки. Требует серьезной доработки.`;
    } else {
      return `Низкое соответствие ТЗ (${score}%). Предложение от ${kpSummary.company_name} не отвечает основным требованиям. Рекомендуется к отклонению.`;
    }
  }

  /**
   * Создание результата с ошибкой
   */
  private createErrorResult(
    tzFile: File,
    kpFile: File,
    selectedModel: string,
    error: any,
    index: number
  ): RealAnalysisResult {
    return {
      id: `error_${Date.now()}_${index}`,
      tz_name: tzFile.name,
      kp_name: kpFile.name,
      company_name: 'Ошибка анализа',
      tech_stack: 'Ошибка анализа',
      pricing: 'Ошибка анализа',
      timeline: 'Ошибка анализа',
      summary: {
        company_name: 'Ошибка анализа',
        tech_stack: 'Ошибка анализа',
        pricing: 'Ошибка анализа',
        timeline: 'Ошибка анализа',
      },
      comparison: {
        compliance_score: 0,
        sections: [],
        missing_requirements: ['Ошибка анализа'],
        additional_features: [],
        risks: ['Ошибка при выполнении анализа'],
        advantages: [],
        overall_assessment: 'Анализ не был завершен из-за ошибки',
        strengths: [],
        weaknesses: ['Ошибка анализа'],
        recommendation: 'conditional',
      },
      recommendation: `Ошибка при анализе файла ${kpFile.name}: ${error}`,
      created_at: new Date().toISOString(),
      model_used: selectedModel,
      confidence_score: 0,
    };
  }

  // Вспомогательные методы
  private truncateText(text: string): string {
    return text.length > this.MAX_TEXT_LENGTH 
      ? text.substring(0, this.MAX_TEXT_LENGTH) + '...'
      : text;
  }

  /**
   * Получение подсказки по формату файла для AI анализа
   */
  private getFileFormatHint(fileFormat: string): string {
    switch (fileFormat) {
      case 'pdf':
        return 'PDF документ - обычно хорошо структурированный с графическими элементами';
      case 'docx':
      case 'doc':
        return 'Word документ - может содержать таблицы, списки и форматирование';
      case 'txt':
        return 'текстовый файл - простой формат без форматирования';
      default:
        return 'неизвестный формат - анализируй как обычный текст';
    }
  }

  private generateRecommendation(score: number): 'accept' | 'conditional' | 'reject' {
    if (score >= 75) return 'accept';
    if (score >= 50) return 'conditional';
    return 'reject';
  }

  private calculateConfidenceScore(comparison: RealComparisonResult): number {
    // Простая логика расчета уверенности на основе полноты анализа
    const sectionsScore = comparison.sections?.length > 0 ? 0.3 : 0;
    const requirementsScore = comparison.missing_requirements?.length !== undefined ? 0.2 : 0;
    const featuresScore = comparison.additional_features?.length !== undefined ? 0.2 : 0;
    const assessmentScore = comparison.overall_assessment?.length > 10 ? 0.3 : 0;
    
    return Math.round((sectionsScore + requirementsScore + featuresScore + assessmentScore) * 100);
  }

  private extractCompanyFromFileName(fileName: string): string {
    // Удаляем расширение
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Ищем паттерны компаний
    const patterns = [
      /(?:КП|kp)[_\s-]*(.+)/i,
      /(.+?)(?:_кп|_kp)/i,
      /компания[_\s-]*(.+)/i,
      /(.+?)(?:_предложение)/i
    ];
    
    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Если паттерн не найден, берем первые слова
    const words = nameWithoutExt.split(/[\s_-]+/);
    return words.slice(0, 2).join(' ') || 'Неизвестная компания';
  }

  /**
   * Fallback метод для батчевой обработки при ошибках параллельной
   */
  private async fallbackBatchProcessing(
    tzFile: File,
    kpFiles: File[],
    selectedModel: string,
    onProgress?: (overall: number, current: string) => void,
    tzText?: PDFProcessingResult
  ): Promise<RealAnalysisResult[]> {
    console.log('🔄 Переход к fallback батчевой обработке');
    
    const results: RealAnalysisResult[] = [];
    const total = kpFiles.length;
    
    for (let i = 0; i < total; i++) {
      const kpFile = kpFiles[i];
      onProgress?.((i / total) * 100, `Fallback: анализ ${i + 1}/${total}: ${kpFile.name}`);
      
      try {
        if (!tzText) {
          tzText = await this.extractTextFromPDF(tzFile);
        }
        const result = await this.runOptimizedAnalysis(tzText.text, kpFile, selectedModel, i);
        results.push(result);
      } catch (error) {
        results.push(this.createErrorResult(tzFile, kpFile, selectedModel, error, i));
      }
    }
    
    return results;
  }
}

export const realKpAnalysisService = new RealKpAnalysisService();
export default realKpAnalysisService;