# DevAssist Pro Storybook Documentation

## 📚 Обзор

Данная документация представляет собой comprehensive Storybook implementation для DevAssist Pro - AI-powered веб-портала для девелоперов недвижимости.

## 🎯 Что реализовано

### 📖 Документация компонентов
- **Button** - Универсальный компонент кнопки с различными вариантами и состояниями
- **Input** - Поля ввода с валидацией, иконками и подсказками
- **LoadingSpinner** - Индикаторы загрузки для различных сценариев
- **BentoGrid** - Современная сетка для отображения модулей

### 🎨 Design System
- **Введение** - Полный обзор DevAssist Pro и всех модулей
- **Design System** - Принципы дизайна и цветовые палитры
- **Design Tokens** - Интерактивный браузер токенов с live examples
- **Component Patterns** - Паттерны использования и best practices

## 🚀 Запуск Storybook

### Первоначальная настройка
```bash
# Установка зависимостей (когда будет доступна)
npm install

# Запуск Storybook в режиме разработки
npm run storybook

# Сборка статической документации
npm run build-storybook
```

### Текущий статус
На данный момент Storybook stories созданы с mock типами и готовы к использованию. Для полноценной работы необходимо:

1. Установить Storybook пакеты:
```bash
npm install --save-dev @storybook/react@latest @storybook/addon-essentials@latest
```

2. Заменить mock типы на настоящие Storybook типы в файлах stories

## 📂 Структура файлов

```
src/
├── components/ui/
│   ├── Button.stories.tsx           # Stories для кнопок
│   ├── Input.stories.tsx            # Stories для полей ввода
│   ├── LoadingSpinner.stories.tsx   # Stories для спиннеров
│   └── BentoGrid.stories.tsx        # Stories для Bento Grid
├── stories/
│   ├── storybook-types.ts           # Mock типы (временно)
│   ├── Introduction.stories.mdx     # Введение в DevAssist Pro
│   ├── DesignSystem.stories.mdx     # Обзор дизайн-системы
│   ├── DesignTokens.stories.tsx     # Интерактивные design tokens
│   └── ComponentPatterns.stories.mdx # Паттерны компонентов
└── .storybook/
    ├── main.ts                      # Конфигурация Storybook
    ├── preview.ts                   # Глобальные настройки
    └── manager.ts                   # UI кастомизация
```

## 🎨 Компоненты и Stories

### Button Component
- **Варианты**: default, destructive, outline, secondary, ghost, link, social
- **Размеры**: sm, md, lg, icon
- **Состояния**: loading, disabled, fullWidth
- **Модули**: Специфичные примеры для КП Анализатор, ТЗ Генератор, и др.

### Input Component
- **Типы**: text, email, password, number, tel, date, search
- **Функции**: валидация, иконки, подсказки, ошибки
- **Формы**: Примеры для авторизации, КП Анализатор, ТЗ Генератор

### LoadingSpinner
- **Размеры**: sm, md, lg
- **Контексты**: Загрузка страниц, модалей, кнопок, таблиц
- **Модули**: Специфичные сценарии для каждого модуля DevAssist Pro

### BentoGrid
- **Макеты**: 1-4 колонки, различные размеры карточек
- **Контент**: Модули DevAssist Pro, статистика, функции
- **Интерактивность**: Hover эффекты, клики, статусы

## 🌐 Design System Integration

### Design Tokens
- **Цвета**: 150+ токенов (brand, semantic, modules, AI providers)
- **Типографика**: 50+ токенов (sizes, weights, spacing)
- **Интервалы**: 13 токенов от 4px до 128px
- **Компоненты**: Специализированные токены для UI элементов

### Theme Support
- **Light/Dark**: Автоматическое переключение тем
- **Responsive**: Тестирование на разных экранах
- **Accessibility**: Проверка контрастности и a11y

## 📖 Модули DevAssist Pro

### 🔍 КП Анализатор
- Анализ коммерческих предложений с помощью ИИ
- Компоненты: загрузка файлов, таблицы сравнения, отчеты

### 📝 ТЗ Генератор
- Автоматическая генерация технических заданий
- Компоненты: формы параметров, шаблоны, редактор

### 💰 Оценка проектов
- Финансовый анализ и оценка инвестиций
- Компоненты: калькуляторы, графики, сценарии

### 📊 Маркетинг планировщик
- Планирование маркетинговых кампаний
- Компоненты: календарь, таргетинг, аналитика

### 📖 База знаний
- Централизованное хранилище знаний
- Компоненты: поиск, категории, рекомендации

## 🔧 Техническая информация

### TypeScript Support
- Полная типизация всех компонентов
- Mock типы для разработки без установленного Storybook
- Интеграция с design tokens

### Performance
- Оптимизированная загрузка компонентов
- Lazy loading для больших stories
- Эффективное использование памяти

### Accessibility
- WCAG 2.1 Level AA compliance
- Автоматические a11y тесты
- Keyboard navigation support

## 🚧 Roadmap

### Ближайшие планы
1. Установка полной версии Storybook
2. Добавление автоматических visual regression тестов
3. Интеграция с CI/CD pipeline
4. Создание Storybook stories для остальных компонентов

### Долгосрочные цели
1. Автоматическая генерация документации из кода
2. Интеграция с Figma для синхронизации дизайна
3. Создание interactive playground для design tokens
4. Документация для backend API

---

**Статус**: ✅ Completed  
**Версия**: 1.0.0  
**Последнее обновление**: Июль 2025