/**
 * React PDF Exporter - Professional PDF generation with @react-pdf/renderer
 * Based on working implementation from DevAssist-Pro-2-final
 * Supports Cyrillic text with built-in fonts
 */

import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { FileDown, Loader } from 'lucide-react';
import { ComprehensiveAnalysisResult } from '../../types/analysis.types';

// Пока не регистрируем кастомные шрифты - используем встроенные
// React-PDF имеет встроенную поддержку кириллицы

// Тестовая функция для проверки отображения кириллицы
const CYRILLIC_TEST_TEXT = 'Анализ коммерческого предложения — тест кириллицы: АБВГДЕЁ ЖЗИ КЛМНОПР СТУФХЦЧШЩЪЫЬЭЮЯ абвгдеё жзийклмнопр стуфхцчшщъыьэюя 1234567890';

console.log('PDF Exporter: Cyrillic test text -', CYRILLIC_TEST_TEXT);

// PDF Styles with proper Cyrillic support - Enhanced professional design
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica', // Встроенный шрифт с надежной поддержкой кириллицы
    fontSize: 10,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '3 solid #2E75D6',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E75D6',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 10,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    border: '1 solid #e5e7eb',
  },
  sectionHighlight: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff7ed',
    borderRadius: 4,
    border: '2 solid #f59e0b',
    borderLeft: '6 solid #f59e0b',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    borderLeft: '4 solid #2E75D6',
    paddingLeft: 12,
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  sectionTitleHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E75D6',
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 4,
    border: '2 solid #2E75D6',
  },
  text: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 5,
    lineHeight: 1.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  column: {
    flex: 1,
    paddingHorizontal: 5,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 25,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    padding: 8,
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    textAlign: 'left',
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    border: '2 solid #e5e7eb',
    borderRadius: 8,
    padding: 18,
    margin: 6,
    textAlign: 'center',
    minWidth: 130,
    // Note: shadow properties are not supported in @react-pdf/renderer
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 'bold',
  },
  statusBadge: {
    fontSize: 10,
    color: 'white',
    backgroundColor: '#22c55e',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  budgetCard: {
    backgroundColor: '#f0f9ff',
    border: '2 solid #3b82f6',
    borderRadius: 8,
    padding: 15,
    margin: 5,
    textAlign: 'center',
    flex: 1,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  recommendations: {
    backgroundColor: '#f0fdf4',
    border: '2 solid #22c55e',
    borderLeft: '4 solid #22c55e',
    padding: 15,
    marginTop: 10,
    borderRadius: 4,
  },
  recommendationItem: {
    fontSize: 9,
    marginBottom: 5,
    paddingLeft: 15,
    color: '#166534',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#64748B',
    borderTop: '2 solid #e5e7eb',
    paddingTop: 12,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 30,
    fontSize: 8,
    color: '#9ca3af',
  },
  watermark: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    fontSize: 8,
    color: '#d1d5db',
    // Note: transform rotate is not supported in @react-pdf/renderer
    // The watermark will be displayed horizontally instead
  },
  keyPoints: {
    backgroundColor: '#fff7ed',
    border: '1 solid #fed7aa',
    borderRadius: 4,
    padding: 10,
    marginTop: 10,
  },
  keyPointItem: {
    fontSize: 9,
    marginBottom: 3,
    paddingLeft: 10,
    color: '#9a3412',
  },
  executiveSummary: {
    backgroundColor: '#fef3c7',
    border: '2 solid #f59e0b',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
    // Note: shadow properties are not supported in @react-pdf/renderer
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 12,
    textAlign: 'center',
    borderBottom: '1 solid #f59e0b',
    paddingBottom: 8,
  },
  criticalSection: {
    backgroundColor: '#fee2e2',
    border: '2 solid #ef4444',
    borderLeft: '6 solid #ef4444',
    borderRadius: 4,
    padding: 15,
    marginTop: 15,
  },
  successSection: {
    backgroundColor: '#f0fdf4',
    border: '2 solid #22c55e',
    borderLeft: '6 solid #22c55e',
    borderRadius: 4,
    padding: 15,
    marginTop: 15,
  },
});

// Helper function to get score color
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

// Адаптер для преобразования данных в нужный формат
const normalizeAnalysisData = (data: any) => {
  return {
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    documentName: data.documentName || data.document_name || 'Документ не указан',
    companyName: data.companyName || data.company_name || 'Компания не указана',
    overallScore: data.overallScore || data.overall_score || 0,
    confidenceScore: data.confidenceScore || data.confidence_score || 0,
    processingDuration: data.processingDuration || data.processing_duration || 0,
    aiModel: data.aiModel || data.ai_model || 'claude-3-haiku-20240307',
    complianceLevel: data.complianceLevel || data.compliance_level || 'unknown',
    financials: data.financials || {
      totalBudget: null,
      currencies: [],
      paymentTerms: []
    },
    sections: data.sections || {},
    executiveSummary: data.executiveSummary || data.executive_summary || {
      keyStrengths: [],
      criticalWeaknesses: [],
      recommendation: 'Рекомендация не доступна',
      nextSteps: []
    }
  };
};

// Main PDF Document Component
const AnalysisPDFDocument = ({ 
  analysisData: rawData,
  options = {}
}: { 
  analysisData: any;
  options?: {
    includeDetails?: boolean;
    includeCharts?: boolean;
    includeTables?: boolean;
  };
}) => {
  const analysisData = normalizeAnalysisData(rawData);
  
  return (
    <Document>
      {/* Title Page */}
      <Page size="A4" style={styles.page}>
        {/* Enhanced Professional Header */}
        <View style={styles.header}>
          <Text style={styles.title}>DevAssist Pro v2</Text>
          <Text style={styles.companyTitle}>
            Система анализа коммерческих предложений
          </Text>
          <Text style={[styles.title, { fontSize: 20, color: '#1f2937', marginTop: 20 }]}>
            ОТЧЕТ ПО АНАЛИЗУ КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ
          </Text>
          
          {/* Document Info Table */}
          <View style={[styles.table, { marginTop: 20 }]}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableHeader, { flex: 2 }]}>Параметр</Text>
              <Text style={[styles.tableCell, styles.tableHeader, { flex: 3 }]}>Значение</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', color: '#2E75D6' }]}>Дата анализа:</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>{new Date(analysisData.createdAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', color: '#2E75D6' }]}>Документ КП:</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>{analysisData.documentName}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', color: '#2E75D6' }]}>Компания-исполнитель:</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>{analysisData.companyName}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', color: '#2E75D6' }]}>AI Модель:</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>{analysisData.aiModel}</Text>
            </View>
          </View>
        </View>

      {/* Cyrillic Test Section for debugging */}
      <View style={[styles.section, { backgroundColor: '#f0f9ff', marginBottom: 10 }]}>
        <Text style={[styles.sectionTitle, { color: '#1e40af' }]}>🧪 ТЕСТ КИРИЛЛИЦЫ</Text>
        <Text style={[styles.text, { fontSize: 9, color: '#1e40af' }]}>
          {CYRILLIC_TEST_TEXT}
        </Text>
        <Text style={[styles.text, { fontSize: 8, color: '#64748b', marginTop: 5 }]}>
          Шрифт: Helvetica | Если текст выше отображается корректно, поддержка кириллицы работает
        </Text>
      </View>

      {/* Executive Summary - Professional Design */}
      <View style={styles.sectionHighlight}>
        <Text style={styles.sectionTitleHighlight}>📊 ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ</Text>
        
        {/* Enhanced Score Cards with Status Indicators */}
        <View style={styles.row}>
          <View style={[styles.scoreCard, { backgroundColor: getScoreColor(analysisData.overallScore) }]}>
            <Text style={[styles.scoreValue, { color: '#ffffff' }]}>
              {analysisData.overallScore}/100
            </Text>
            <Text style={[styles.scoreLabel, { color: '#ffffff' }]}>
              Общая оценка
            </Text>
            <Text style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 8 }]}>
              {analysisData.overallScore >= 80 ? '✅ Отлично' : 
               analysisData.overallScore >= 60 ? '⚠️ Хорошо' : 
               '❌ Требует внимания'}
            </Text>
          </View>
          
          <View style={[styles.scoreCard, { backgroundColor: '#3b82f6' }]}>
            <Text style={[styles.scoreValue, { color: '#ffffff' }]}>
              {analysisData.confidenceScore}%
            </Text>
            <Text style={[styles.scoreLabel, { color: '#ffffff' }]}>
              Уверенность ИИ
            </Text>
            <Text style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 8 }]}>
              {analysisData.confidenceScore >= 90 ? 'Высокая' : 
               analysisData.confidenceScore >= 70 ? 'Средняя' : 'Низкая'}
            </Text>
          </View>
          
          <View style={[styles.scoreCard, { backgroundColor: '#8b5cf6' }]}>
            <Text style={[styles.scoreValue, { color: '#ffffff' }]}>
              {Math.round(analysisData.processingDuration)}с
            </Text>
            <Text style={[styles.scoreLabel, { color: '#ffffff' }]}>
              Время анализа
            </Text>
            <Text style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 8 }]}>
              ⚡ Быстро
            </Text>
          </View>
        </View>

        {/* Compliance and Analysis Info */}
        <View style={[styles.table, { marginTop: 15 }]}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#2E75D6' }]}>Уровень соответствия требованиям:</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold', 
              color: analysisData.complianceLevel === 'high' ? '#22c55e' : 
                    analysisData.complianceLevel === 'medium' ? '#f59e0b' : '#ef4444' 
            }]}>
              {analysisData.complianceLevel === 'high' ? '✅ Высокий' : 
               analysisData.complianceLevel === 'medium' ? '⚠️ Средний' : 
               analysisData.complianceLevel === 'low' ? '❌ Низкий' : '❓ Требует анализа'}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#2E75D6' }]}>Модель искусственного интеллекта:</Text>
            <Text style={styles.tableCell}>{analysisData.aiModel}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#2E75D6' }]}>Статус обработки:</Text>
            <Text style={[styles.tableCell, { color: '#22c55e', fontWeight: 'bold' }]}>✅ Анализ завершен успешно</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Financial Analysis */}
      {analysisData.financials && (analysisData.financials.totalBudget || analysisData.financials.currencies?.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 ФИНАНСОВЫЙ АНАЛИЗ</Text>
          
          <View style={styles.row}>
            {analysisData.financials.totalBudget && (
              <View style={[styles.budgetCard, { backgroundColor: '#f0fdf4', borderColor: '#22c55e' }]}>
                <Text style={[styles.budgetAmount, { color: '#16a34a' }]}>
                  {typeof analysisData.financials.totalBudget.amount === 'number' 
                    ? analysisData.financials.totalBudget.amount.toLocaleString('ru-RU')
                    : 'Не указано'} {analysisData.financials.totalBudget.symbol || '₽'}
                </Text>
                <Text style={[styles.scoreLabel, { fontWeight: 'bold' }]}>💰 Общий бюджет проекта</Text>
                <Text style={[styles.statusBadge, { backgroundColor: '#22c55e', marginTop: 5 }]}>
                  Основная валюта
                </Text>
              </View>
            )}
            
            <View style={[styles.budgetCard, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
              <Text style={[styles.budgetAmount, { color: '#d97706' }]}>
                {analysisData.financials.currencies?.length || 0}
              </Text>
              <Text style={[styles.scoreLabel, { fontWeight: 'bold' }]}>🌍 Валют обнаружено</Text>
              <Text style={[styles.statusBadge, { backgroundColor: '#f59e0b', marginTop: 5 }]}>
                {analysisData.financials.currencies?.length > 1 ? 'Многовалютный' : 'Одна валюта'}
              </Text>
            </View>
            
            <View style={[styles.budgetCard, { backgroundColor: '#f0f9ff', borderColor: '#3b82f6' }]}>
              <Text style={[styles.budgetAmount, { color: '#2563eb' }]}>
                {analysisData.financials.paymentTerms?.length || 0}
              </Text>
              <Text style={[styles.scoreLabel, { fontWeight: 'bold' }]}>📋 Условий оплаты</Text>
              <Text style={[styles.statusBadge, { backgroundColor: '#3b82f6', marginTop: 5 }]}>
                Найдено
              </Text>
            </View>
          </View>

          {/* Currency Details */}
          {analysisData.financials.currencies && analysisData.financials.currencies.length > 0 && (
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableHeader]}>Валюта</Text>
                <Text style={[styles.tableCell, styles.tableHeader]}>Сумма</Text>
                <Text style={[styles.tableCell, styles.tableHeader]}>Тип</Text>
              </View>
              {analysisData.financials.currencies.slice(0, 5).map((currency: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{currency?.code || currency?.symbol || 'Неизвестно'}</Text>
                  <Text style={styles.tableCell}>
                    {typeof currency?.amount === 'number' 
                      ? currency.amount.toLocaleString('ru-RU') 
                      : 'Не указано'} {currency?.symbol || '₽'}
                  </Text>
                  <Text style={styles.tableCell}>Основная</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Enhanced Footer */}
      <View style={styles.footer}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2E75D6' }}>DevAssist Pro v2 - Система анализа коммерческих предложений</Text>
        <Text style={{ fontSize: 8, marginTop: 2 }}>🌐 www.devassist.pro | 📧 support@devassist.pro</Text>
        <Text style={{ fontSize: 8, marginTop: 2 }}>Дата создания отчета: {new Date().toLocaleString('ru-RU', { 
          year: 'numeric', month: 'long', day: 'numeric', 
          hour: '2-digit', minute: '2-digit', second: '2-digit' 
        })}</Text>
      </View>
      
      {/* Page Number */}
      <View style={styles.pageNumber}>
        <Text>Стр. 1</Text>
      </View>
    </Page>

    {/* Enhanced Sections Analysis Pages */}
    {analysisData.sections && Object.entries(analysisData.sections).map(([sectionKey, sectionData]: [string, any], index: number) => (
      <Page key={sectionKey} size="A4" style={styles.page}>
        {/* Enhanced Section Header */}
        <View style={styles.header}>
          <Text style={styles.sectionTitleHighlight}>
            {sectionData?.title || sectionKey || 'РАЗДЕЛ АНАЛИЗА'}
          </Text>
          
          {/* Section Score Card */}
          <View style={[styles.scoreCard, { 
            backgroundColor: getScoreColor(sectionData?.score || 0),
            marginVertical: 10,
            alignSelf: 'center'
          }]}>
            <Text style={[styles.scoreValue, { color: '#ffffff', fontSize: 32 }]}>
              {sectionData?.score || 0}/100
            </Text>
            <Text style={[styles.scoreLabel, { color: '#ffffff', fontSize: 12 }]}>
              ОЦЕНКА РАЗДЕЛА
            </Text>
            <Text style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 8 }]}>
              {sectionData?.status === 'excellent' ? '✅ Отлично' :
               sectionData?.status === 'good' ? '✅ Хорошо' :
               sectionData?.status === 'warning' ? '⚠️ Внимание' :
               sectionData?.status === 'critical' ? '❌ Критично' : '❓ В процессе'}
            </Text>
          </View>
        </View>

        {/* Enhanced Section Analysis */}
        <View style={sectionData?.score >= 80 ? styles.successSection : 
                     sectionData?.score >= 60 ? styles.section : styles.criticalSection}>
          <Text style={styles.sectionTitle}>🔍 ДЕТАЛЬНЫЙ АНАЛИЗ РАЗДЕЛА</Text>
          <Text style={[styles.text, { fontSize: 11, lineHeight: 1.6 }]}>
            {sectionData?.summary || sectionData?.detailed_analysis || 'Анализ данного раздела находится в процессе обработки. Пожалуйста, обратитесь к техническим специалистам для получения подробной информации.'}
          </Text>
          
          {/* Risk Assessment */}
          {sectionData?.risk_level && (
            <View style={{ marginTop: 10, padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 4 }}>
              <Text style={[styles.text, { fontWeight: 'bold', color: '#dc2626' }]}>
                🚨 Уровень риска: {sectionData.risk_level === 'high' ? 'ВЫСОКИЙ' :
                                  sectionData.risk_level === 'medium' ? 'СРЕДНИЙ' : 'НИЗКИЙ'}
              </Text>
            </View>
          )}
        </View>

        {/* Key Points */}
        {sectionData?.keyPoints && Array.isArray(sectionData.keyPoints) && sectionData.keyPoints.length > 0 && (
          <View style={styles.keyPoints}>
            <Text style={[styles.sectionTitle, { fontSize: 12, color: '#9a3412', borderColor: '#fed7aa' }]}>
              Ключевые моменты
            </Text>
            {sectionData.keyPoints.slice(0, 8).map((point: any, pointIndex: number) => (
              <Text key={pointIndex} style={styles.keyPointItem}>
                • {String(point)}
              </Text>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {sectionData?.recommendations && Array.isArray(sectionData.recommendations) && sectionData.recommendations.length > 0 && (
          <View style={styles.recommendations}>
            <Text style={[styles.sectionTitle, { fontSize: 12, color: '#166534', borderColor: '#22c55e' }]}>
              Рекомендации
            </Text>
            {sectionData.recommendations.slice(0, 6).map((rec: any, recIndex: number) => (
              <Text key={recIndex} style={styles.recommendationItem}>
                • {typeof rec === 'string' ? rec : rec?.text || 'Рекомендация'}
              </Text>
            ))}
          </View>
        )}

        {/* Enhanced Page Footer */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>DevAssist Pro v2 - Детальный анализ КП</Text>
          <Text style={{ fontSize: 8, marginTop: 2 }}>Раздел: {sectionData?.title || sectionKey}</Text>
        </View>
        
        {/* Page Number */}
        <View style={styles.pageNumber}>
          <Text>Стр. {index + 2}</Text>
        </View>
      </Page>
    ))}

    {/* Enhanced Final Executive Summary Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.sectionTitleHighlight}>📋 ИТОГОВОЕ ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ</Text>
        
        {/* Final Score Summary */}
        <View style={[styles.scoreCard, { 
          backgroundColor: getScoreColor(analysisData.overallScore),
          alignSelf: 'center',
          marginVertical: 15
        }]}>
          <Text style={[styles.scoreValue, { color: '#ffffff', fontSize: 36 }]}>
            {analysisData.overallScore}/100
          </Text>
          <Text style={[styles.scoreLabel, { color: '#ffffff', fontSize: 14, fontWeight: 'bold' }]}>
            ИТОГОВАЯ ОЦЕНКА ПРОЕКТА
          </Text>
        </View>
      </View>

      {/* Strengths */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ключевые сильные стороны</Text>
        {analysisData.executiveSummary.keyStrengths && Array.isArray(analysisData.executiveSummary.keyStrengths) && 
         analysisData.executiveSummary.keyStrengths.length > 0 ? (
          analysisData.executiveSummary.keyStrengths.map((strength: any, index: number) => (
            <Text key={index} style={[styles.text, { paddingLeft: 10 }]}>
              • {String(strength)}
            </Text>
          ))
        ) : (
          <Text style={styles.text}>Сильные стороны не определены</Text>
        )}
      </View>

      {/* Weaknesses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Критические недостатки</Text>
        {analysisData.executiveSummary.criticalWeaknesses && Array.isArray(analysisData.executiveSummary.criticalWeaknesses) &&
         analysisData.executiveSummary.criticalWeaknesses.length > 0 ? (
          analysisData.executiveSummary.criticalWeaknesses.map((weakness: any, index: number) => (
            <Text key={index} style={[styles.text, { paddingLeft: 10 }]}>
              • {String(weakness)}
            </Text>
          ))
        ) : (
          <Text style={styles.text}>Критические недостатки не выявлены</Text>
        )}
      </View>

      {/* Enhanced Final Recommendation */}
      <View style={styles.executiveSummary}>
        <Text style={styles.summaryTitle}>🎯 ИТОГОВАЯ РЕКОМЕНДАЦИЯ ЭКСПЕРТА</Text>
        
        {/* Recommendation Status */}
        <View style={{ textAlign: 'center', marginBottom: 15 }}>
          <Text style={[styles.scoreValue, { 
            color: analysisData.overallScore >= 80 ? '#22c55e' : 
                   analysisData.overallScore >= 60 ? '#f59e0b' : '#ef4444',
            fontSize: 18
          }]}>
            {analysisData.overallScore >= 80 ? '✅ РЕКОМЕНДУЕТСЯ К ПРИНЯТИЮ' :
             analysisData.overallScore >= 60 ? '⚠️ ПРИНЯТЬ С ОГОВОРКАМИ' : 
             '❌ НЕ РЕКОМЕНДУЕТСЯ'}
          </Text>
        </View>
        
        <Text style={[styles.text, { fontSize: 12, lineHeight: 1.8, textAlign: 'justify' }]}>
          {analysisData.executiveSummary.recommendation || 
           'На основе проведенного комплексного анализа коммерческого предложения, система DevAssist Pro рекомендует принять взвешенное решение с учетом выявленных сильных и слабых сторон предложения.'}
        </Text>
        
        {/* Next Steps */}
        {analysisData.executiveSummary.nextSteps && Array.isArray(analysisData.executiveSummary.nextSteps) && 
         analysisData.executiveSummary.nextSteps.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.summaryTitle, { fontSize: 12 }]}>Следующие шаги:</Text>
            {analysisData.executiveSummary.nextSteps.map((step: any, index: number) => (
              <Text key={index} style={[styles.text, { paddingLeft: 10, fontSize: 10 }]}>
                {index + 1}. {String(step)}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Final Page Footer */}
      <View style={styles.footer}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2E75D6' }}>🎯 АНАЛИЗ ЗАВЕРШЕН УСПЕШНО</Text>
        <Text style={{ fontSize: 9, marginTop: 2 }}>DevAssist Pro v2 - Профессиональная система анализа КП</Text>
        <Text style={{ fontSize: 8, marginTop: 2 }}>Контакты: support@devassist.pro | +7 (800) 123-45-67</Text>
      </View>
      
      {/* Final Page Number */}
      <View style={styles.pageNumber}>
        <Text>Финальная стр.</Text>
      </View>
      
      {/* Professional Watermark */}
      <View style={styles.watermark}>
        <Text>DevAssist Pro v2</Text>
      </View>
    </Page>
  </Document>
  );
};

// PDF Export Button Component
interface ReactPDFExporterProps {
  analysisData: any; // Гибкий тип для работы с различными форматами данных
  filename?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  options?: {
    includeDetails?: boolean;
    includeCharts?: boolean;
    includeTables?: boolean;
  };
  onExportStart?: () => void;
  onExportSuccess?: (filename: string) => void;
  onExportError?: (error: string) => void;
}

const ReactPDFExporter: React.FC<ReactPDFExporterProps> = ({
  analysisData,
  filename,
  className = '',
  children,
  variant = 'primary',
  size = 'md',
  options = {
    includeDetails: true,
    includeCharts: true,
    includeTables: true,
  },
  onExportStart,
  onExportSuccess,
  onExportError,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAndDownloadPDF = async () => {
    if (!analysisData) {
      onExportError?.('Нет данных для экспорта');
      return;
    }

    setIsGenerating(true);
    onExportStart?.();
    
    try {
      const doc = <AnalysisPDFDocument analysisData={analysisData} options={options} />;
      const blob = await pdf(doc).toBlob();
      
      const fileName = filename || `DevAssist_Pro_KP_Analysis_${analysisData.id || Date.now()}_${new Date().toISOString().split('T')[0]}.pdf`;
      saveAs(blob, fileName);
      
      onExportSuccess?.(fileName);
    } catch (error) {
      console.error('PDF generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при генерации PDF';
      onExportError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonClasses = () => {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  };

  return (
    <button
      onClick={generateAndDownloadPDF}
      disabled={isGenerating || !analysisData}
      className={getButtonClasses()}
    >
      {isGenerating ? (
        <>
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          Генерация PDF...
        </>
      ) : (
        children || (
          <>
            <FileDown className="w-4 h-4 mr-2" />
            📄 Экспорт PDF
          </>
        )
      )}
    </button>
  );
};

export default ReactPDFExporter;
export { AnalysisPDFDocument };