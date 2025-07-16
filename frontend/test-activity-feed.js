// Test script to create sample KP analysis data for activity feed testing
const testData = [
  {
    id: "comparison_1735123456789",
    results: [
      {
        id: "result_1",
        fileName: "proposal_1.pdf",
        companyName: "Компания А",
        complianceScore: 85,
        overallRating: 4.2,
        strengths: ["Опыт", "Цена"],
        weaknesses: ["Сроки"]
      },
      {
        id: "result_2",  
        fileName: "proposal_2.pdf",
        companyName: "Компания Б",
        complianceScore: 92,
        overallRating: 4.6,
        strengths: ["Качество", "Сроки"],
        weaknesses: ["Цена"]
      }
    ],
    ranking: [
      {
        kpId: "result_2",
        rank: 1,
        totalScore: 92,
        summary: "Лучший по качеству"
      },
      {
        kpId: "result_1", 
        rank: 2,
        totalScore: 85,
        summary: "Хорошая цена"
      }
    ],
    summary: "Сравнение 2 коммерческих предложений",
    recommendations: ["Рекомендуется Компания Б"],
    riskAssessment: "Низкий риск",
    bestChoice: "Компания Б",
    comparisonMatrix: [],
    analyzedAt: new Date().toISOString(),
    model: "claude-3-5-sonnet-20241022",
    recommendation: {
      winner: "Компания Б",
      reasoning: "Лучшее соотношение качества и сроков",
      alternatives: ["Компания А"]
    }
  }
];

// Save test data to localStorage
localStorage.setItem('kp_analyzer_history', JSON.stringify(testData));
console.log('Test data saved to localStorage');

// Test the activity service parsing
// This would be run in the browser console
console.log('Testing activity service parsing...');