# 📄 Document Components

Комплексная система компонентов для управления и предпросмотра документов в DevAssist Pro.

## 🗂️ Структура компонентов

### DocumentPreview
Полнофункциональный компонент предпросмотра документов с расширенными возможностями.

**Функциональность:**
- 🔍 Zoom (50% - 300%) и поворот документов
- 📄 Постраничная навигация для PDF
- 📝 Автоматическое извлечение и поиск по тексту
- 🖼️ Поддержка PDF, DOCX, изображений
- 🤖 Интеграция с AI-анализом
- 📱 Полностью responsive дизайн
- ⬇️ Скачивание документов
- 🌓 Поддержка темной/светлой темы

**Пример использования:**
```tsx
import { DocumentPreview } from '@/components/documents';

<DocumentPreview
  file={selectedFile}
  isOpen={isPreviewOpen}
  onClose={() => setIsPreviewOpen(false)}
  onAnalyze={handleStartAnalysis}
  showAnalyzeButton={true}
/>
```

### DocumentCard
Компонент карточки документа для отображения в списках и сетках.

**Функциональность:**
- 🖼️ Thumbnail или иконка типа файла
- 📊 Статус анализа с индикаторами
- 📝 Метаинформация (размер, дата, страницы)
- ⚡ Быстрые действия (просмотр, анализ, удаление)
- 🎨 Hover эффекты и анимации
- 📱 Адаптивный дизайн

**Пример использования:**
```tsx
import { DocumentCard } from '@/components/documents';

<DocumentCard
  file={document}
  onPreview={handlePreview}
  onAnalyze={handleAnalyze}
  onDelete={handleDelete}
  analysisStatus="completed"
/>
```

### DocumentList
Компонент списка документов с полным функционалом управления.

**Функциональность:**
- 🔍 Поиск по названию документов
- 🏷️ Фильтрация по типу файлов
- 📊 Сортировка (имя, дата, размер, тип)
- 🔀 Переключение вида (сетка/список)
- 📤 Интеграция с загрузкой файлов
- 📊 Batch операции
- 📈 Статистика и подсчеты

**Пример использования:**
```tsx
import { DocumentList } from '@/components/documents';

<DocumentList
  documents={documents}
  onAnalyze={handleAnalyze}
  onDelete={handleDelete}
  onUpload={handleUpload}
  analysisStatuses={analysisStatuses}
  title="Документы проекта"
/>
```

## 📊 Типы и интерфейсы

### DocumentFile
Основной интерфейс документа:

```typescript
interface DocumentFile {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'image';
  size: number;
  url: string;
  uploadedAt: Date;
  pageCount?: number;
  extractedText?: string;
  thumbnail?: string;
}
```

### AnalysisStatus
Статусы анализа документов:

```typescript
type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'error';
```

## 🎯 Использование в модулях DevAssist Pro

### КП Анализатор
```tsx
// Просмотр ТЗ и коммерческих предложений
<DocumentList
  documents={[tzDocument, ...kpDocuments]}
  title="КП Анализатор - Документы"
  onAnalyze={handleAnalyzeDocument}
  analysisStatuses={analysisStatuses}
/>
```

### ТЗ Генератор
```tsx
// Управление шаблонами и сгенерированными документами
<DocumentList
  documents={templates}
  title="ТЗ Генератор - Шаблоны"
  showUpload={false}
  emptyMessage="Создайте первый шаблон ТЗ"
/>
```

### База знаний
```tsx
// Справочные материалы и документация
<DocumentList
  documents={knowledgeBase}
  title="База знаний - Справочные материалы"
  showUpload={false}
  onAnalyze={undefined} // Без анализа для справочных материалов
/>
```

### Оценка проектов
```tsx
// Финансовые модели и аналитические документы
<DocumentList
  documents={evaluationDocs}
  title="Оценка проектов - Аналитические документы"
  onAnalyze={handleFinancialAnalysis}
/>
```

## 🎨 Стилизация и темизация

Компоненты используют дизайн-токены DevAssist Pro:

```css
/* Основные цвета */
--color-primary: var(--brand-primary-500);
--color-secondary: var(--brand-secondary-500);

/* Статусы анализа */
--status-completed: var(--semantic-success-500);
--status-processing: var(--semantic-info-500);
--status-error: var(--semantic-error-500);
--status-pending: var(--semantic-warning-500);
```

## 📱 Responsive Design

Компоненты адаптированы для всех устройств:

- **Mobile** (< 768px): Оптимизированные touch-интерфейсы
- **Tablet** (768px - 1024px): Балансированный макет
- **Desktop** (> 1024px): Полный функционал

## 🚀 Performance оптимизации

- **Lazy Loading**: Компоненты загружаются по требованию
- **Virtual Scrolling**: Для больших списков документов
- **Image Optimization**: Автоматическая оптимизация thumbnails
- **Caching**: Кеширование извлеченного текста
- **Debouncing**: Для поиска и фильтров

## 🔧 Интеграция с AI

Компоненты готовы для интеграции с AI-провайдерами:

```typescript
// Пример интеграции с анализом
const handleAnalyze = async (file: DocumentFile) => {
  try {
    setAnalysisStatus(file.id, 'processing');
    const result = await aiService.analyzeDocument(file);
    setAnalysisStatus(file.id, 'completed');
    showResults(result);
  } catch (error) {
    setAnalysisStatus(file.id, 'error');
    showError(error.message);
  }
};
```

## 📖 Storybook документация

Полная интерактивная документация доступна в Storybook:

```bash
npm run storybook
```

Включает:
- Все варианты компонентов
- Примеры использования в модулях
- Interactive controls
- Responsive тестирование
- Accessibility проверки

## 🧪 Тестирование

```bash
# Unit тесты
npm test -- --testPathPattern=documents

# Storybook тесты
npm run test-storybook

# Visual regression тесты
npm run chromatic
```

## 🔗 Связанные компоненты

- **FileUpload**: Загрузка документов с drag & drop
- **LoadingSpinner**: Индикаторы загрузки и обработки
- **Button**: Действия и навигация
- **Input**: Поиск и фильтрация
- **Modal**: Полноэкранные окна предпросмотра

## 📈 Roadmap

### Ближайшие улучшения
- [ ] PDF.js интеграция для лучшего рендеринга PDF
- [ ] OCR для сканированных документов
- [ ] Batch загрузка и обработка
- [ ] Аннотации и комментарии
- [ ] Совместное редактирование
- [ ] Version control для документов

### Планируемые функции
- [ ] AI-powered поиск по содержимому
- [ ] Автоматическая категоризация
- [ ] Smart recommendations
- [ ] Integration с внешними storage (Google Drive, OneDrive)
- [ ] Workflow automation
- [ ] Advanced analytics

---

**Последнее обновление:** 10 июля 2025  
**Версия компонентов:** 1.0.0  
**Совместимость:** DevAssist Pro Frontend v2.0+