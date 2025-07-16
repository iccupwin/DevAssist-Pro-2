/**
 * Безопасная версия React-PDF компонента с транслитерацией
 * DevAssist Pro
 */

import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet,
  pdf 
} from '@react-pdf/renderer';
import { AnalysisResult, ComparisonResult, PDFExportOptions } from '../../types/pdfExport';

// Функция транслитерации
const transliterate = (text: string): string => {
  const translitMap: Record<string, string> = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z',
    'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
    'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return text.replace(/[а-яёА-ЯЁ]/g, char => translitMap[char] || char);
};

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
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 15,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
});

interface PDFReportSafeProps {
  results: AnalysisResult[];
  comparison?: ComparisonResult;
  options: PDFExportOptions;
}

export const PDFReportSafe: React.FC<PDFReportSafeProps> = ({ results, comparison, options }) => {
  const avgScore = results.reduce((sum, r) => sum + (r.overallRating || 0), 0) / results.length;
  const bestKP = results.reduce((best, current) => 
    (current.overallRating || 0) > (best.overallRating || 0) ? current : best
  );

  const getRecommendationText = (rating: number) => {
    if (rating >= 80) return transliterate('Рекомендуется');
    if (rating >= 60) return transliterate('Условно');
    return transliterate('Не рекомендуется');
  };

  return (
    <Document>
      {/* Титульная страница */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>
            {transliterate(options.customTitle || 'Отчет по анализу коммерческих предложений')}
          </Text>
          <Text style={styles.subtitle}>
            {transliterate(options.projectName || 'Анализ КП')}
          </Text>
        </View>

        <View style={styles.projectInfo}>
          <Text style={styles.text}>
            <Text style={styles.bold}>{transliterate('Дата создания:')} </Text>
            {new Date().toLocaleDateString('ru-RU')}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>{transliterate('Количество КП:')} </Text>
            {results.length}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>{transliterate('Компания:')} </Text>
            {options.companyName || 'DevAssist Pro'}
          </Text>
          <Text style={styles.text}>
            {transliterate('Анализ выполнен с использованием искусственного интеллекта')}
          </Text>
        </View>

        {/* Исполнительное резюме */}
        {options.includeExecutiveSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{transliterate('Исполнительное резюме')}</Text>
            <Text style={styles.text}>
              {transliterate(`Проанализировано ${results.length} коммерческих предложений.`)}
            </Text>
            <Text style={styles.text}>
              {transliterate(`Средний балл соответствия: ${avgScore.toFixed(1)}%.`)}
            </Text>
            <Text style={styles.text}>
              {transliterate(`Лучшее предложение: ${bestKP.companyName} (${bestKP.overallRating || 0}%).`)}
            </Text>
          </View>
        )}

        {/* Сводная таблица результатов */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{transliterate('Сводная таблица результатов')}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{transliterate('Компания')}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{transliterate('Балл')}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{transliterate('Рекомендация')}</Text>
              </View>
            </View>
            {results.map((result, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{transliterate(result.companyName)}</Text>
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
          `${transliterate('Страница')} ${pageNumber} ${transliterate('из')} ${totalPages}`
        } fixed />
      </Page>

      {/* Детальный анализ каждого КП */}
      {options.includeDetailedAnalysis && results.map((result, index) => (
        <Page size="A4" style={styles.page} key={index}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {transliterate(`Детальный анализ: ${result.companyName}`)}
            </Text>
            
            <View style={styles.projectInfo}>
              <Text style={styles.text}>
                <Text style={styles.bold}>{transliterate('Файл:')} </Text>
                {transliterate(result.fileName || 'Не указан')}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>{transliterate('Дата анализа:')} </Text>
                {new Date(result.analyzedAt).toLocaleDateString('ru-RU')}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>{transliterate('AI модель:')} </Text>
                {result.model}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.bold}>{transliterate('Общий балл:')} </Text>
                {result.overallRating || 0}%
              </Text>
            </View>

            {/* Сильные стороны */}
            {result.strengths && result.strengths.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.text, styles.bold]}>{transliterate('Сильные стороны:')}</Text>
                <View style={styles.list}>
                  {result.strengths.map((strength, idx) => (
                    <View style={styles.listItem} key={idx}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{transliterate(strength)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Слабые стороны */}
            {result.weaknesses && result.weaknesses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.text, styles.bold]}>{transliterate('Слабые стороны:')}</Text>
                <View style={styles.list}>
                  {result.weaknesses.map((weakness, idx) => (
                    <View style={styles.listItem} key={idx}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{transliterate(weakness)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
            `${transliterate('Страница')} ${pageNumber} ${transliterate('из')} ${totalPages}`
          } fixed />
        </Page>
      ))}

      {/* Приложения */}
      {options.includeAppendices && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{transliterate('Приложения')}</Text>
            
            <Text style={[styles.text, styles.bold]}>{transliterate('A. Методология оценки')}</Text>
            <Text style={styles.text}>
              {transliterate('Анализ проводится с использованием искусственного интеллекта по следующим критериям:')}
            </Text>
            
            <View style={styles.list}>
              <View style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{transliterate('Техническое соответствие (30%)')}</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{transliterate('Финансовая привлекательность (25%)')}</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{transliterate('Реалистичность сроков (20%)')}</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{transliterate('Качество предложения (15%)')}</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{transliterate('Надежность поставщика (10%)')}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
            `${transliterate('Страница')} ${pageNumber} ${transliterate('из')} ${totalPages}`
          } fixed />
        </Page>
      )}
    </Document>
  );
};

// Экспорт функции для генерации PDF с транслитерацией
export const generatePDFSafe = async (
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

  const doc = <PDFReportSafe results={results} comparison={comparison} options={fullOptions} />;
  const pdfBlob = await pdf(doc).toBlob();
  
  return pdfBlob;
};