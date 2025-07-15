import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import DocumentPreview, { DocumentFile } from './DocumentPreview';

const meta: Meta<typeof DocumentPreview> = {
  title: 'Documents/DocumentPreview',
  component: DocumentPreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# DocumentPreview Component

Компонент предпросмотра документов для DevAssist Pro с полным функционалом просмотра, анализа и извлечения текста.

## Особенности
- 🔍 Полноэкранный просмотр документов
- 📄 Поддержка PDF, DOCX, изображений и текстовых файлов  
- 🔎 Zoom, поворот, навигация по страницам
- 📝 Автоматическое извлечение и поиск по тексту
- 🤖 Интеграция с AI-анализом
- 📱 Responsive дизайн для всех устройств
- ⬇️ Функция скачивания документов

## Использование в DevAssist Pro
- **КП Анализатор**: Просмотр ТЗ и коммерческих предложений
- **ТЗ Генератор**: Предпросмотр шаблонов и сгенерированных документов
- **База знаний**: Просмотр справочных материалов
- **Документооборот**: Общий просмотр всех типов документов

## Поддерживаемые форматы
- PDF документы с постраничной навигацией
- Microsoft Word документы (DOCX)
- Изображения (JPG, PNG, GIF)
- Текстовые файлы с подсветкой
        `,
      },
    },
  },
  argTypes: {
    isOpen: {
      control: { type: 'boolean' },
      description: 'Открыт ли предпросмотр',
    },
    showAnalyzeButton: {
      control: { type: 'boolean' },
      description: 'Показывать кнопку анализа',
    },
  },
  args: {
    onClose: action('closed'),
    onAnalyze: action('analyzed'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock файлы для демонстрации
const mockPdfFile: DocumentFile = {
  id: 'pdf-1',
  name: 'Техническое задание - Жилой комплекс Солнечный.pdf',
  type: 'pdf',
  size: 2048576, // 2 MB
  url: '/mock-documents/tz-solnechny.pdf',
  uploadedAt: new Date('2024-01-15'),
  status: 'uploaded' as const,
  pageCount: 15,
  thumbnail: '/mock-thumbnails/pdf-thumb.jpg',
  extractedText: `
ТЕХНИЧЕСКОЕ ЗАДАНИЕ
на строительство жилого комплекса "Солнечный"

1. ОБЩИЕ ПОЛОЖЕНИЯ
1.1. Объект строительства: Многоквартирный жилой дом
1.2. Адрес: г. Москва, ул. Примерная, д. 1
1.3. Назначение: жилое
1.4. Количество этажей: 25 (24 жилых + технический)
1.5. Общая площадь: 15 000 м²

2. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ
2.1. Класс энергоэффективности: A+
2.2. Система отопления: автономная газовая
2.3. Вентиляция: приточно-вытяжная с рекуперацией
2.4. Лифты: 2 пассажирских, 1 грузопассажирский

3. АРХИТЕКТУРНЫЕ РЕШЕНИЯ
3.1. Фасад: навесной вентилируемый
3.2. Материал фасада: керамогранит, композитные панели
3.3. Окна: двухкамерные стеклопакеты в ПВХ профиле
3.4. Балконы: остекленные лоджии на всех этажах

4. ИНЖЕНЕРНЫЕ СИСТЕМЫ
4.1. Электроснабжение: от городской сети 380/220В
4.2. Водоснабжение: от городского водопровода
4.3. Канализация: подключение к городской сети
4.4. Газоснабжение: природный газ низкого давления

5. ТРЕБОВАНИЯ БЕЗОПАСНОСТИ
5.1. Система пожарной сигнализации
5.2. Система оповещения о пожаре
5.3. Дымоудаление из коридоров и лестничных клеток
5.4. Система контроля доступа

6. СРОКИ ВЫПОЛНЕНИЯ РАБОТ
6.1. Начало строительства: 01.03.2024
6.2. Окончание строительства: 30.11.2025
6.3. Общий срок строительства: 21 месяц

7. СТОИМОСТЬ ПРОЕКТА
7.1. Предварительная стоимость: 850 млн рублей
7.2. НДС: включен в стоимость
7.3. Источник финансирования: собственные средства + кредит

Документ подготовлен в соответствии с действующими строительными нормами и правилами.
  `
};

const mockDocxFile: DocumentFile = {
  id: 'docx-1',
  name: 'Коммерческое предложение - ООО СтройИнвест.docx',
  type: 'docx',
  size: 1024768, // 1 MB
  url: '/mock-documents/kp-stroyinvest.docx',
  uploadedAt: new Date('2024-01-20'),
  status: 'uploaded' as const,
  extractedText: `
КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
ООО "СтройИнвест"

Уважаемые партнеры!

Представляем Вашему вниманию коммерческое предложение на выполнение строительно-монтажных работ по объекту "Жилой комплекс Солнечный".

НАША КОМПАНИЯ:
- 15 лет успешной работы на рынке строительства
- Более 50 завершенных объектов жилой недвижимости
- Собственная техническая база и квалифицированные кадры
- Полный комплекс лицензий и разрешений

ПРЕДЛАГАЕМЫЕ УСЛУГИ:
1. Общестроительные работы - 450 млн руб.
2. Инженерные системы - 200 млн руб.
3. Отделочные работы - 150 млн руб.
4. Благоустройство территории - 50 млн руб.

ОБЩАЯ СТОИМОСТЬ: 850 млн рублей (с НДС)

ПРЕИМУЩЕСТВА РАБОТЫ С НАМИ:
✓ Фиксированная цена по договору
✓ Соблюдение сроков строительства
✓ Гарантия качества 5 лет
✓ Страхование строительных рисков
✓ Еженедельная отчетность по ходу работ

СРОКИ ВЫПОЛНЕНИЯ:
- Подготовительные работы: 1 месяц
- Основные СМР: 18 месяцев  
- Пусконаладочные работы: 2 месяца
Общий срок: 21 месяц

УСЛОВИЯ ОПЛАТЫ:
- Аванс: 15% от суммы договора
- Поэтапные платежи согласно графику выполнения работ
- Окончательный расчет: после приемки объекта

Предложение действительно до 28.02.2024.

С уважением,
Генеральный директор ООО "СтройИнвест"
Иванов И.И.
  `
};

const mockImageFile: DocumentFile = {
  id: 'img-1',
  name: 'План участка - Схема застройки.jpg',
  type: 'image',
  size: 3072000, // 3 MB
  url: '/mock-documents/plan-site.jpg',
  uploadedAt: new Date('2024-01-18'),
  status: 'uploaded' as const,
  thumbnail: '/mock-thumbnails/plan-thumb.jpg'
};

// Базовые варианты
export const PDFDocument: Story = {
  args: {
    file: mockPdfFile,
    isOpen: true,
    showAnalyzeButton: true,
  },
};

export const WordDocument: Story = {
  args: {
    file: mockDocxFile,
    isOpen: true,
    showAnalyzeButton: true,
  },
};

export const ImageDocument: Story = {
  args: {
    file: mockImageFile,
    isOpen: true,
    showAnalyzeButton: false,
  },
};

// Примеры использования в модулях DevAssist Pro
export const KPAnalyzerPreview: Story = {
  render: () => {
    const [selectedFile, setSelectedFile] = React.useState<DocumentFile | null>(null);
    const [isOpen, setIsOpen] = React.useState(false);

    const handlePreviewFile = (file: DocumentFile) => {
      setSelectedFile(file);
      setIsOpen(true);
    };

    const documents = [mockPdfFile, mockDocxFile, mockImageFile];

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-bold mb-6">КП Анализатор - Предпросмотр документов</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {documents.map((file) => (
            <div 
              key={file.id}
              className="bg-white p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handlePreviewFile(file)}
            >
              <h3 className="font-medium text-gray-900 mb-2 truncate">{file.name}</h3>
              <p className="text-sm text-gray-500">Нажмите для предпросмотра</p>
            </div>
          ))}
        </div>

        {selectedFile && (
          <DocumentPreview
            file={selectedFile}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onAnalyze={action('start analysis')}
            showAnalyzeButton={true}
          />
        )}
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const TZGeneratorPreview: Story = {
  args: {
    file: {
      ...mockDocxFile,
      name: 'Шаблон ТЗ - Жилой комплекс.docx',
      extractedText: `
ШАБЛОН ТЕХНИЧЕСКОГО ЗАДАНИЯ
на строительство жилого комплекса

[НАЗВАНИЕ ОБЪЕКТА]
[АДРЕС СТРОИТЕЛЬСТВА]

1. ОБЩИЕ ТРЕБОВАНИЯ
1.1. Тип объекта: [УКАЗАТЬ ТИП]
1.2. Количество этажей: [УКАЗАТЬ КОЛИЧЕСТВО]
1.3. Общая площадь: [УКАЗАТЬ ПЛОЩАДЬ]

2. АРХИТЕКТУРНЫЕ РЕШЕНИЯ
2.1. Стилистика фасада: [ОПИСАНИЕ]
2.2. Материалы отделки: [ПЕРЕЧИСЛИТЬ]

3. ИНЖЕНЕРНЫЕ СИСТЕМЫ
3.1. Отопление: [ТИП СИСТЕМЫ]
3.2. Вентиляция: [ТИП СИСТЕМЫ]
3.3. Электроснабжение: [ХАРАКТЕРИСТИКИ]

4. СРОКИ И БЮДЖЕТ
4.1. Срок строительства: [УКАЗАТЬ СРОК]
4.2. Предварительный бюджет: [СУММА]

Данный шаблон может быть автоматически заполнен с помощью AI на основе введенных параметров проекта.
      `
    },
    isOpen: true,
    showAnalyzeButton: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Предпросмотр шаблона технического задания в модуле ТЗ Генератор.',
      },
    },
  },
};

export const WithoutAnalyzeButton: Story = {
  args: {
    file: mockImageFile,
    isOpen: true,
    showAnalyzeButton: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Предпросмотр без кнопки анализа для просто просмотра документов.',
      },
    },
  },
};

export const LargeDocument: Story = {
  args: {
    file: {
      ...mockPdfFile,
      name: 'Большой документ - Проектная документация (150 страниц).pdf',
      pageCount: 150,
      size: 25600000, // 25 MB
      extractedText: mockPdfFile.extractedText + '\n\n[... содержимое 150 страниц документации ...]'
    },
    isOpen: true,
    showAnalyzeButton: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Предпросмотр большого документа с многими страницами.',
      },
    },
  },
};

// Responsive тестирование
export const MobileView: Story = {
  args: {
    file: mockPdfFile,
    isOpen: true,
    showAnalyzeButton: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Предпросмотр документа на мобильном устройстве.',
      },
    },
  },
};

export const TabletView: Story = {
  args: {
    file: mockDocxFile,
    isOpen: true,
    showAnalyzeButton: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Предпросмотр документа на планшете.',
      },
    },
  },
};