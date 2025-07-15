# PDF Export для КП Анализатора

Система экспорта результатов анализа коммерческих предложений в PDF формат.

## Компоненты

### PDFExportService
Основной сервис генерации PDF отчетов с использованием jsPDF.

**Функциональность:**
- Создание PDF документов с корпоративным дизайном
- Поддержка различных шаблонов отчетов
- Отслеживание прогресса генерации
- Валидация данных и обработка ошибок
- Настройка внешнего вида и содержания

**Методы:**
- `exportComparison()` - экспорт сравнительного анализа
- `setProgressCallback()` - установка отслеживания прогресса

### PDFExportButton
React компонент кнопки экспорта с интегрированным диалогом настроек.

**Свойства:**
```typescript
interface PDFExportButtonProps {
  results: AnalysisResult[];           // Результаты анализа
  comparison?: ComparisonResult;       // Данные сравнения
  disabled?: boolean;                  // Отключение кнопки
  variant?: 'primary' | 'secondary' | 'outline';  // Стиль кнопки
  size?: 'sm' | 'md' | 'lg';          // Размер кнопки
  showText?: boolean;                  // Показывать текст
  className?: string;                  // Дополнительные CSS классы
  onExportStart?: () => void;          // Callback начала экспорта
  onExportComplete?: (result: PDFExportResult) => void;  // Callback завершения
  onExportError?: (error: Error) => void;  // Callback ошибки
}
```

**Варианты использования:**
- `<PDFExportButton />` - полная кнопка с текстом
- `<PDFExportIconButton />` - только иконка
- `<PDFExportMenuItem />` - элемент меню

### PDFExportDialog
Модальное окно настроек экспорта с вкладками.

**Вкладки:**
1. **Шаблон** - выбор типа отчета (краткий/подробный/исполнительный)
2. **Настройки** - формат, ориентация, содержание
3. **Оформление** - цвета, шрифты, дополнительные опции

## Типы данных

### PDFExportOptions
Настройки экспорта документа:
```typescript
interface PDFExportOptions {
  format: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape';
  includeCharts: boolean;
  includeDetailedAnalysis: boolean;
  includeAppendices: boolean;
  includeExecutiveSummary: boolean;
  logoUrl?: string;
  watermark?: string;
  companyName?: string;
  projectName?: string;
  customTitle?: string;
}
```

### PDFStylingOptions
Настройки внешнего вида:
```typescript
interface PDFStylingOptions {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: 'Helvetica' | 'Arial' | 'Times';
  fontSize: {
    title: number;
    heading: number;
    body: number;
    caption: number;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  lineHeight: number;
  showPageNumbers: boolean;
  showWatermark: boolean;
}
```

### AnalysisResult
Данные результата анализа КП:
```typescript
interface AnalysisResult {
  id: string;
  companyName: string;
  complianceScore: number;
  technicalRating: number;
  financialRating: number;
  timelineRating: number;
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedAnalysis: string;
  analyzedAt: string;
  model: string;
  fileName?: string;
  pricing?: number;
  timeline?: string;
}
```

## Шаблоны отчетов

### Краткий отчет (brief)
- Титульная страница
- Исполнительное резюме
- Сравнительная таблица
- Диаграммы

### Подробный отчет (detailed)
- Титульная страница
- Исполнительное резюме
- Сравнительный анализ
- Детальный анализ каждого КП
- Диаграммы и графики
- Приложения

### Исполнительный отчет (executive)
- Титульная страница
- Исполнительное резюме
- Ключевые рекомендации
- Сравнительная таблица

## Структура PDF документа

### 1. Титульная страница
- Заголовок отчета
- Название проекта
- Дата создания
- Количество КП
- Информация о компании
- Логотип (опционально)

### 2. Исполнительное резюме
- Основная статистика
- Средний балл соответствия
- Лучшее предложение
- Сводная таблица результатов

### 3. Сравнительный анализ
- Сводка сравнения
- Ранжирование предложений
- Рекомендации по выбору

### 4. Детальный анализ (для каждого КП)
- Общая информация
- Оценки по критериям
- Сильные стороны
- Слабые стороны
- Рекомендации

### 5. Приложения
- Методология оценки
- Глоссарий терминов
- Техническая информация

## Использование

### Базовое использование
```tsx
import { PDFExportButton } from './components/kpAnalyzer';

function MyComponent() {
  const results = [/* результаты анализа */];
  
  return (
    <PDFExportButton
      results={results}
      onExportComplete={(result) => {
        console.log(`PDF создан: ${result.filename}`);
      }}
    />
  );
}
```

### Интеграция в существующий компонент
```tsx
// В DetailedReportViewer.tsx
<PDFExportButton
  results={analysisData?.analysis_results?.map(result => ({
    id: result.id || `result-${Math.random()}`,
    companyName: result.company_name || 'Неизвестная компания',
    overallRating: result.score || 0,
    // ... другие поля
  })) || []}
  comparison={{
    summary: 'Проведен детальный анализ',
    ranking: /* ранжирование */,
    recommendations: ['Рекомендации'],
    bestChoice: 'Лучший выбор',
    analyzedAt: new Date().toISOString()
  }}
  className="w-full"
  variant="secondary"
/>
```

### Программный экспорт
```tsx
import { pdfExportService } from './services/pdfExportService';

async function exportToPDF() {
  try {
    // Настройка отслеживания прогресса
    pdfExportService.setProgressCallback((progress) => {
      console.log(`${progress.progress}%: ${progress.message}`);
    });
    
    // Экспорт
    const result = await pdfExportService.exportComparison(
      results,
      comparison,
      { format: 'A4', orientation: 'portrait' },
      { primaryColor: '#2563eb' }
    );
    
    // Скачивание
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    
  } catch (error) {
    console.error('Ошибка экспорта:', error);
  }
}
```

## Отслеживание прогресса

Система поддерживает отслеживание прогресса генерации:

```typescript
interface PDFGenerationProgress {
  stage: 'initializing' | 'processing' | 'rendering' | 'finalizing' | 'complete';
  progress: number;  // 0-100
  message: string;
  currentSection?: string;
  errors?: string[];
}
```

## Обработка ошибок

Система включает валидацию и обработку ошибок:

- `NO_DATA` - отсутствуют данные для экспорта
- `INVALID_OPTIONS` - неверные настройки
- `GENERATION_FAILED` - ошибка генерации PDF
- `FILE_TOO_LARGE` - файл слишком большой
- `BROWSER_NOT_SUPPORTED` - браузер не поддерживается

## Настройки по умолчанию

```typescript
const DEFAULT_PDF_OPTIONS: PDFExportOptions = {
  format: 'A4',
  orientation: 'portrait',
  includeCharts: true,
  includeDetailedAnalysis: true,
  includeAppendices: true,
  includeExecutiveSummary: true,
  companyName: 'DevAssist Pro',
  projectName: 'Анализ коммерческих предложений',
};

const DEFAULT_STYLING_OPTIONS: PDFStylingOptions = {
  primaryColor: '#2563eb',
  secondaryColor: '#6b7280',
  accentColor: '#059669',
  fontFamily: 'Helvetica',
  fontSize: {
    title: 24,
    heading: 16,
    body: 12,
    caption: 10,
  },
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  lineHeight: 1.5,
  showPageNumbers: true,
  showWatermark: false,
};
```

## Ограничения

1. **Кириллица**: Требует дополнительной настройки шрифтов
2. **Размер файла**: Большие отчеты могут занимать много памяти
3. **Производительность**: Генерация может занимать время
4. **Совместимость**: Требует современный браузер

## Планы развития

- [ ] Поддержка кириллических шрифтов
- [ ] Диаграммы и графики
- [ ] Шаблоны с изображениями
- [ ] Экспорт в Word формат
- [ ] Пакетная обработка
- [ ] Предварительный просмотр