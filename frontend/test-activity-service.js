// Comprehensive test for activity service
// Run this in the browser console after starting the app

// Create test data that matches the ComparisonResult structure
const testComparisonData = [
  {
    id: "comparison_1735123456789",
    results: [
      {
        id: "result_1",
        fileName: "proposal_tech_company_a.pdf",
        companyName: "ТехСофт ООО",
        complianceScore: 85,
        overallRating: 4.2,
        strengths: ["Опыт работы с крупными проектами", "Конкурентная цена"],
        weaknesses: ["Сжатые сроки выполнения"],
        detailedAnalysis: "Хорошее соответствие требованиям ТЗ",
        analyzedAt: "2024-12-25T10:30:00Z",
        model: "claude-3-5-sonnet-20241022"
      },
      {
        id: "result_2",
        fileName: "proposal_dev_company_b.pdf", 
        companyName: "ИнноДев Системы",
        complianceScore: 92,
        overallRating: 4.6,
        strengths: ["Высокое качество решений", "Соблюдение сроков"],
        weaknesses: ["Высокая стоимость"],
        detailedAnalysis: "Отличное соответствие всем требованиям",
        analyzedAt: "2024-12-25T10:31:00Z",
        model: "claude-3-5-sonnet-20241022"
      }
    ],
    ranking: [
      {
        kpId: "result_2",
        rank: 1,
        totalScore: 92,
        summary: "Лучший выбор по качеству и срокам"
      },
      {
        kpId: "result_1",
        rank: 2,
        totalScore: 85,
        summary: "Хорошее соотношение цена-качество"
      }
    ],
    summary: "Сравнение 2 коммерческих предложений по разработке веб-портала",
    recommendations: [
      "Рекомендуется выбрать ИнноДев Системы",
      "Рассмотреть возможность снижения стоимости"
    ],
    riskAssessment: "Низкий риск при выборе ИнноДев Системы",
    bestChoice: "ИнноДев Системы",
    comparisonMatrix: [
      {
        criterion: "Техническое соответствие",
        scores: { "result_1": 85, "result_2": 95 }
      },
      {
        criterion: "Стоимость",
        scores: { "result_1": 90, "result_2": 75 }
      }
    ],
    analyzedAt: "2024-12-25T10:32:00Z",
    model: "claude-3-5-sonnet-20241022",
    recommendation: {
      winner: "ИнноДев Системы",
      reasoning: "Лучшее соотношение качества и соблюдения сроков, высокое техническое соответствие",
      alternatives: ["ТехСофт ООО"]
    }
  },
  {
    id: "comparison_1735120000000",
    results: [
      {
        id: "result_3",
        fileName: "proposal_mobile_dev.pdf",
        companyName: "МобиТех Разработка",
        complianceScore: 78,
        overallRating: 3.9,
        strengths: ["Специализация на мобильных приложениях"],
        weaknesses: ["Ограниченный опыт с веб-решениями"],
        detailedAnalysis: "Частичное соответствие требованиям",
        analyzedAt: "2024-12-25T09:15:00Z",
        model: "gpt-4o"
      }
    ],
    ranking: [
      {
        kpId: "result_3",
        rank: 1,
        totalScore: 78,
        summary: "Единственное предложение"
      }
    ],
    summary: "Анализ 1 коммерческого предложения для мобильного приложения",
    recommendations: ["Требуется дополнительная экспертиза"],
    riskAssessment: "Средний риск из-за недостатка опыта",
    bestChoice: "МобиТех Разработка",
    comparisonMatrix: [],
    analyzedAt: "2024-12-25T09:16:00Z",
    model: "gpt-4o",
    recommendation: {
      winner: "МобиТех Разработка",
      reasoning: "Единственное предложение, требует дополнительной проверки",
      alternatives: []
    }
  }
];

// Clear existing data and save test data
localStorage.removeItem('kp_analyzer_history');
localStorage.setItem('kp_analyzer_history', JSON.stringify(testComparisonData));

console.log('✅ Test data saved to localStorage');
console.log('📊 Data structure:', testComparisonData);

// Test parsing manually
try {
  const historyData = localStorage.getItem('kp_analyzer_history');
  if (historyData) {
    const history = JSON.parse(historyData);
    console.log('📋 Parsed history:', history);
    
    // Test the activity service parsing logic
    const activities = history.map((item, index) => {
      const analysisId = item.id || `analysis_${index + 1}`;
      const kpResults = item.results || [];
      const ranking = item.ranking || [];
      
      let avgScore = 0;
      if (kpResults.length > 0) {
        avgScore = kpResults.reduce((acc, r) => acc + (r.complianceScore || r.overallRating || 0), 0) / kpResults.length;
      } else if (ranking.length > 0) {
        avgScore = ranking.reduce((acc, r) => acc + (r.totalScore || 0), 0) / ranking.length;
      }
      
      const documentsCount = kpResults.length || ranking.length;
      const createdAt = item.analyzedAt || item.createdAt || new Date().toISOString();
      
      return {
        id: analysisId,
        title: 'Анализ КП завершён',
        description: `Анализ ${documentsCount} коммерческих предложений успешно завершён с результатом ${avgScore.toFixed(1)}%`,
        created_at: createdAt,
        model_used: item.model || 'unknown',
        best_choice: item.bestChoice || item.recommendation?.winner || 'N/A'
      };
    });
    
    console.log('🎯 Generated activities:', activities);
  }
} catch (error) {
  console.error('❌ Error testing parsing:', error);
}

console.log('🔄 Now refresh the page to see the activity feed update');