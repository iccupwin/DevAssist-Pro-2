// Debug script to test activity service
const data = localStorage.getItem('kp_analyzer_history');
console.log('Raw localStorage data:', data);

if (data) {
  try {
    const parsed = JSON.parse(data);
    console.log('Parsed data:', parsed);
    console.log('Number of items:', parsed.length);
    
    if (parsed.length > 0) {
      console.log('First item structure:', parsed[0]);
      console.log('First item keys:', Object.keys(parsed[0]));
    }
  } catch (e) {
    console.error('Parse error:', e);
  }
} else {
  console.log('No data found in localStorage');
}

// Test the activity service logic
console.log('\n=== Testing Activity Service Logic ===');
const mockData = [
  {
    id: 'test_analysis_1',
    results: [
      { complianceScore: 85.5, overallRating: 4.2 },
      { complianceScore: 78.3, overallRating: 3.9 }
    ],
    ranking: [
      { totalScore: 85.5, rank: 1 },
      { totalScore: 78.3, rank: 2 }
    ],
    analyzedAt: '2024-01-15T10:30:00Z',
    model: 'claude-3.5-sonnet',
    bestChoice: 'Company A',
    recommendation: { winner: 'Company A' }
  }
];

// Test processing
const processedActivity = mockData.map((item, index) => {
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
    type: 'ANALYSIS_COMPLETED',
    title: 'Анализ КП завершён',
    description: `Анализ ${documentsCount} коммерческих предложений успешно завершён с результатом ${avgScore.toFixed(1)}%`,
    user_id: 1,
    analysis_id: analysisId,
    created_at: createdAt,
    updated_at: createdAt,
    project_metadata: {
      compliance_score: avgScore,
      documents_count: documentsCount,
      model_used: item.model || 'unknown',
      best_choice: item.bestChoice || item.recommendation?.winner || 'N/A'
    }
  };
});

console.log('Processed activity:', processedActivity);