# React-PDF Export Components

Компоненты для генерации PDF отчетов с полной поддержкой русского языка.

## Компоненты

### PDFReport
Основной React-PDF компонент для генерации отчета анализа КП.

**Особенности:**
- ✅ Полная поддержка кириллицы через Google Fonts (Open Sans)
- ✅ Современный дизайн с профессиональным форматированием
- ✅ Автоматическая нумерация страниц
- ✅ Цветовая индикация рекомендаций
- ✅ Поддержка всех секций отчета

### ReactPDFExportService
Сервис для управления генерацией PDF с прогрессом и обработкой ошибок.

**Методы:**
- `exportComparison()` - экспорт сравнительного анализа
- `exportSingle()` - экспорт одного результата
- `downloadPDF()` - скачивание файла
- `previewPDF()` - предпросмотр в новой вкладке

### PDFTestButton
Тестовый компонент для проверки генерации PDF с тестовыми данными.

## Использование

```tsx
import { PDFTestButton, generatePDF } from '@/components/pdf';

// Тестовая кнопка
<PDFTestButton />

// Прямая генерация PDF
const pdfBlob = await generatePDF(results, comparison, options);
```

## Примеры данных

Компонент ожидает данные в формате:

```typescript
interface AnalysisResult {
  id: string;
  companyName: string;
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  // ... другие поля
}
```

## Настройки

```typescript
const options = {
  format: 'A4',
  orientation: 'portrait',
  includeDetailedAnalysis: true,
  includeAppendices: true,
  includeExecutiveSummary: true,
  projectName: 'Название проекта',
  companyName: 'Название компании'
};
```

## Преимущества перед jsPDF

- **Нативная поддержка Unicode** - никаких проблем с кириллицей
- **React-компоненты** - легко поддерживать и расширять
- **Лучший дизайн** - профессиональный внешний вид
- **Веб-шрифты** - автоматическая загрузка шрифтов
- **Оптимизация** - лучшая производительность