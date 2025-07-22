/**
 * React-PDF компонент для генерации отчета анализа КП
 * DevAssist Pro
 */

import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font,
  pdf 
} from '@react-pdf/renderer';
import { AnalysisResult, ComparisonResult, PDFExportOptions } from '../../types/pdfExport';

// Пока не регистрируем кастомные шрифты - используем встроенные
// React-PDF имеет встроенную поддержку кириллицы

// Стили для PDF документа
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: '40 30 50 30', // top right bottom left
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.6,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#2563eb',
    marginBottom: 15,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 5,
  },
  text: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 5,
  },
  bold: {
    fontWeight: 600,
  },
  projectInfo: {
    backgroundColor: '#f8fafc',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 600,
  },
  tableCol: {
    width: '33.33%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 8,
  },
  tableCell: {
    fontSize: 10,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#6b7280',
  },
  list: {
    marginLeft: 15,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  listBullet: {
    width: 10,
    fontSize: 12,
  },
  listText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  recommendation: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  recommendationPositive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  recommendationNeutral: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
  },
  recommendationNegative: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
});

interface PDFReportProps {
  results: AnalysisResult[];
  comparison?: ComparisonResult;
  options: PDFExportOptions;
}

export const PDFReport: React.FC<PDFReportProps> = ({ results, comparison, options }) => {
  const avgScore = results.reduce((sum, r) => sum + (r.overallRating || 0), 0) / results.length;
  const bestKP = results.reduce((best, current) => 
    (current.overallRating || 0) > (best.overallRating || 0) ? current : best
  );

  const getRecommendationStyle = (rating: number) => {
    if (rating >= 80) return [styles.recommendation, styles.recommendationPositive];
    if (rating >= 60) return [styles.recommendation, styles.recommendationNeutral];
    return [styles.recommendation, styles.recommendationNegative];
  };

  const getRecommendationText = (rating: number) => {
    if (rating >= 80) return 'Рекомендуется';
    if (rating >= 60) return 'Условно';
    return 'Не рекомендуется';
  };

  return (
    <Document>
      {/* Титульная страница */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>
            {options.customTitle || 'Отчет по анализу коммерческих предложений'}
          </Text>
          <Text style={styles.subtitle}>
            {options.projectName || 'Анализ КП'}
          </Text>
        </View>

        <View style={styles.projectInfo}>
          <Text style={styles.text}>
            <Text style={styles.bold}>Дата создания:</Text> {new Date().toLocaleDateString('ru-RU')}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Количество КП:</Text> {results.length}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Компания:</Text> {options.companyName || 'DevAssist Pro'}
          </Text>
          <Text style={styles.text}>
            Анализ выполнен с использованием искусственного интеллекта
          </Text>
        </View>

        {/* Исполнительное резюме */}
        {options.includeExecutiveSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Исполнительное резюме</Text>
            <Text style={styles.text}>
              Проанализировано {results.length} коммерческих предложений.
            </Text>
            <Text style={styles.text}>
              Средний балл соответствия: {avgScore.toFixed(1)}%.
            </Text>
            <Text style={styles.text}>
              Лучшее предложение: {bestKP.companyName} ({bestKP.overallRating || 0}%).
            </Text>
          </View>
        )}

        {/* Сводная таблица результатов */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сводная таблица результатов</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Компания</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Балл</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Рекомендация</Text>
              </View>
            </View>
            {results.map((result, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{result.companyName}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{result.overallRating || 0}%</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {getRecommendationText(result.overallRating || 0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
          `Страница ${pageNumber} из ${totalPages}`
        } fixed />
      </Page>

      {/* Сравнительный анализ */}
      {comparison && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Сравнительный анализ</Text>
            <Text style={styles.text}>
              {comparison.summary || 'Сравнительный анализ проведен'}
            </Text>
            
            {comparison.recommendations && comparison.recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Рекомендации</Text>
                <View style={styles.list}>
                  {comparison.recommendations.map((rec, index) => (
                    <View style={styles.listItem} key={index}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
            `Страница ${pageNumber} из ${totalPages}`
          } fixed />
        </Page>
      )}

      {/* Детальный анализ каждого КП */}
      {options.includeDetailedAnalysis && results.map((result, index) => (
        <Page size="A4" style={styles.page} key={index}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Детальный анализ: {result.companyName}
            </Text>
            
            <View style={styles.projectInfo}>
              <Text style={styles.text}>
                <Text style={styles.bold}>Файл:</Text> {result.fileName || 'Не указан'}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>Дата анализа:</Text> {new Date(result.analyzedAt).toLocaleDateString('ru-RU')}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>AI модель:</Text> {result.model}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>Общий балл:</Text> {result.overallRating || 0}%
              </Text>
            </View>

            <View style={getRecommendationStyle(result.overallRating || 0)}>
              <Text style={[styles.text, styles.bold]}>
                Рекомендация: {getRecommendationText(result.overallRating || 0)}
              </Text>
            </View>

            {/* Сильные стороны */}
            {result.strengths && result.strengths.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.text, styles.bold]}>Сильные стороны:</Text>
                <View style={styles.list}>
                  {result.strengths.map((strength, idx) => (
                    <View style={styles.listItem} key={idx}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{strength}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Слабые стороны */}
            {result.weaknesses && result.weaknesses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.text, styles.bold]}>Слабые стороны:</Text>
                <View style={styles.list}>
                  {result.weaknesses.map((weakness, idx) => (
                    <View style={styles.listItem} key={idx}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{weakness}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
            `Страница ${pageNumber} из ${totalPages}`
          } fixed />
        </Page>
      ))}

      {/* Приложения */}
      {options.includeAppendices && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Приложения</Text>
            
            <Text style={[styles.text, styles.bold]}>A. Методология оценки</Text>
            <Text style={styles.text}>
              Анализ проводится с использованием искусственного интеллекта по следующим критериям:
            </Text>
            
            <View style={styles.list}>
              <View style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>Техническое соответствие (30%)</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>Финансовая привлекательность (25%)</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>Реалистичность сроков (20%)</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>Качество предложения (15%)</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>Надежность поставщика (10%)</Text>
              </View>
            </View>
          </View>

          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
            `Страница ${pageNumber} из ${totalPages}`
          } fixed />
        </Page>
      )}
    </Document>
  );
};

// Экспорт функции для генерации PDF
export const generatePDF = async (
  results: AnalysisResult[],
  comparison?: ComparisonResult,
  options: Partial<PDFExportOptions> = {}
): Promise<Blob> => {
  const fullOptions = {
    format: 'A4' as const,
    orientation: 'portrait' as const,
    includeCharts: false,
    includeDetailedAnalysis: true,
    includeAppendices: true,
    includeExecutiveSummary: true,
    ...options
  };

  const doc = <PDFReport results={results} comparison={comparison} options={fullOptions} />;
  const pdfBlob = await pdf(doc).toBlob();
  
  return pdfBlob;
};