/**
 * Реальный AI сервис для анализа документов
 * Интеграция с Anthropic Claude, OpenAI GPT, Google Gemini
 */

import { ComparisonResult as KPComparisonResult } from '../../types/kpAnalyzer';

interface AIAnalysisRequest {
  tzText: string;
  kpText: string;
  fileName: string;
  model: string;
}

interface AIAnalysisResult {
  id: string;
  fileName: string;
  model: string;
  complianceScore: number;
  criteriaAnalysis: Array<{
    criterion: string;
    score: number;
    comment: string;
    met: boolean;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: {
    overallRating: 'excellent' | 'good' | 'satisfactory' | 'poor';
    keyFindings: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface ComparisonRequest {
  results: AIAnalysisResult[];
  model: string;
}

interface ComparisonResult {
  id: string;
  results: AIAnalysisResult[];
  ranking: Array<{
    fileName: string;
    rank: number;
    totalScore: number;
    summary: string;
  }>;
  recommendation: {
    winner: string;
    reasoning: string;
  };
}

export class RealAIService {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  /**
   * Анализ КП с помощью выбранной AI модели
   */
  async analyzeKPWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(request.tzText, request.kpText);
      
      let aiResponse: string;
      
      // Выбираем провайдера AI на основе модели
      if (request.model.startsWith('claude')) {
        aiResponse = await this.callClaudeAPI(prompt, request.model);
      } else if (request.model.startsWith('gpt')) {
        aiResponse = await this.callOpenAIAPI(prompt, request.model);
      } else if (request.model.startsWith('gemini')) {
        aiResponse = await this.callGeminiAPI(prompt, request.model);
      } else {
        throw new Error(`Неподдерживаемая модель: ${request.model}`);
      }
      
      // Парсим ответ AI и возвращаем структурированный результат
      return this.parseAIResponse(aiResponse, request.fileName, request.model);
      
    } catch (error) {
      console.error('AI Analysis failed:', error);
      throw new Error(`Ошибка анализа с ${request.model}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Сравнение результатов с помощью AI
   */
  async compareResultsWithAI(request: ComparisonRequest): Promise<KPComparisonResult> {
    try {
      const prompt = this.buildComparisonPrompt(request.results);
      
      let aiResponse: string;
      
      if (request.model.startsWith('claude')) {
        aiResponse = await this.callClaudeAPI(prompt, request.model);
      } else if (request.model.startsWith('gpt')) {
        aiResponse = await this.callOpenAIAPI(prompt, request.model);
      } else if (request.model.startsWith('gemini')) {
        aiResponse = await this.callGeminiAPI(prompt, request.model);
      } else {
        throw new Error(`Неподдерживаемая модель: ${request.model}`);
      }
      
      return this.parseComparisonResponse(aiResponse, request.results, request.model);
      
    } catch (error) {
      console.error('AI Comparison failed:', error);
      throw new Error(`Ошибка сравнения с ${request.model}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Вызов Anthropic Claude API
   */
  private async callClaudeAPI(prompt: string, model: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/ai/claude/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('devassist_simple_token')}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Вызов OpenAI GPT API
   */
  private async callOpenAIAPI(prompt: string, model: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/ai/openai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('devassist_simple_token')}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Вызов Google Gemini API
   */
  private async callGeminiAPI(prompt: string, model: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/ai/gemini/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('devassist_simple_token')}`,
      },
      body: JSON.stringify({
        model: model,
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 4000,
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Построение промпта для анализа КП
   */
  private buildAnalysisPrompt(tzText: string, kpText: string): string {
    return `
Ты - эксперт по анализу коммерческих предложений. Проанализируй данное КП в соответствии с техническим заданием.

ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
${tzText}

КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ:
${kpText}

Проведи детальный анализ по следующим критериям:
1. Техническое соответствие - насколько КП соответствует техническим требованиям ТЗ
2. Ценовое предложение - конкурентоспособность и обоснованность цены
3. Сроки выполнения - реалистичность и соответствие требованиям
4. Качество команды - опыт и квалификация исполнителей
5. Опыт и портфолио - релевантный опыт в данной сфере
6. Гарантии и поддержка - качество постпроектного обслуживания

Верни результат в формате JSON:
{
  "complianceScore": число от 0 до 100,
  "criteriaAnalysis": [
    {
      "criterion": "название критерия",
      "score": число от 0 до 100,
      "comment": "подробный комментарий по критерию",
      "met": true/false
    }
  ],
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "weaknesses": ["слабая сторона 1", "слабая сторона 2"],
  "recommendations": ["рекомендация 1", "рекомендация 2"],
  "summary": {
    "overallRating": "excellent/good/satisfactory/poor",
    "keyFindings": ["ключевой вывод 1", "ключевой вывод 2"],
    "riskLevel": "low/medium/high"
  }
}

Будь объективен и конструктивен в оценках.
`;
  }

  /**
   * Построение промпта для сравнения результатов
   */
  private buildComparisonPrompt(results: AIAnalysisResult[]): string {
    const resultsText = results.map((result, index) => `
КП ${index + 1}: ${result.fileName}
Общий балл: ${result.complianceScore}%
Критерии: ${result.criteriaAnalysis.map(c => `${c.criterion}: ${c.score}%`).join(', ')}
Сильные стороны: ${result.strengths.join(', ')}
Слабые стороны: ${result.weaknesses.join(', ')}
`).join('\n');

    return `
Ты - эксперт по тендерному анализу. Проанализируй результаты оценки коммерческих предложений и определи победителя.

РЕЗУЛЬТАТЫ АНАЛИЗА КП:
${resultsText}

Задачи:
1. Ранжируй КП от лучшего к худшему
2. Определи победителя и обоснуй выбор
3. Укажи альтернативные варианты

Верни результат в формате JSON:
{
  "ranking": [
    {
      "fileName": "имя файла",
      "rank": порядковый номер,
      "totalScore": общий балл,
      "summary": "краткое описание позиции"
    }
  ],
  "recommendation": {
    "winner": "имя файла победителя",
    "reasoning": "подробное обоснование выбора победителя"
  }
}

Учитывай не только общий балл, но и качественные характеристики каждого предложения.
`;
  }

  /**
   * Парсинг ответа AI для анализа
   */
  private parseAIResponse(aiResponse: string, fileName: string, model: string): AIAnalysisResult {
    try {
      // Извлекаем JSON из ответа AI (может быть обернут в markdown)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI не вернул валидный JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName,
        model,
        complianceScore: parsed.complianceScore || 0,
        criteriaAnalysis: parsed.criteriaAnalysis || [],
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        recommendations: parsed.recommendations || [],
        summary: parsed.summary || {
          overallRating: 'satisfactory',
          keyFindings: [],
          riskLevel: 'medium'
        }
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Ошибка обработки ответа AI');
    }
  }

  /**
   * Парсинг ответа AI для сравнения
   */
  private parseComparisonResponse(aiResponse: string, results: AIAnalysisResult[], model: string): KPComparisonResult {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI не вернул валидный JSON для сравнения');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        id: `comparison_${Date.now()}`,
        results: results as any, // Type conversion for now to avoid complex type mapping
        ranking: parsed.ranking || [],
        summary: parsed.summary || 'Сравнение коммерческих предложений выполнено',
        recommendations: parsed.recommendations || [],
        riskAssessment: parsed.riskAssessment || 'Анализ рисков не выполнен',
        bestChoice: parsed.bestChoice || results[0]?.fileName || 'Не определен',
        comparisonMatrix: parsed.comparisonMatrix || [],
        analyzedAt: new Date().toISOString(),
        model: model,
        recommendation: parsed.recommendation || {
          winner: results[0]?.fileName || '',
          reasoning: 'Автоматический выбор по наивысшему баллу',
          alternatives: results.slice(1).map(r => r.fileName || 'Unnamed')
        }
      };
    } catch (error) {
      console.error('Failed to parse comparison response:', error);
      throw new Error('Ошибка обработки результатов сравнения');
    }
  }
}

export const realAIService = new RealAIService();