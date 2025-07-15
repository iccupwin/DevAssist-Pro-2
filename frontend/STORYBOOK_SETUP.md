# 📚 Storybook Setup для DevAssist Pro

## ✅ Быстрый запуск

### Windows PowerShell:
```powershell
cd F:\DevAssitPro\DevAssist-Pro\frontend
npm run storybook
```

### Альтернативно:
```powershell
npx storybook dev -p 6006 --no-open
```

### Затем откройте в браузере:
```
http://localhost:6006
```

## 📋 Что включено в Storybook:

### 🔧 UI Components:
- **Button** - 15+ вариантов кнопок для всех модулей
- **Input** - 20+ типов полей ввода 
- **LoadingSpinner** - 10+ состояний загрузки
- **BentoGrid** - 12+ макетов сетки

### 🎨 Design System:
- **Design Tokens** - Полная система токенов дизайна
- **Colors** - 150+ цветовых токенов
- **Typography** - Типографические стили
- **Spacing** - Система отступов
- **Shadows** - Набор теней

### 🏢 DevAssist Pro Modules:
- **КП Анализатор** - Компоненты анализа коммерческих предложений
- **ТЗ Генератор** - UI для генерации технических заданий
- **Оценка проектов** - Финансовые формы и расчеты
- **Маркетинг планировщик** - Интерфейсы планирования кампаний
- **База знаний** - Поиск и навигация по материалам

## 🔧 Команды:

```bash
# Запуск development сервера
npm run storybook

# Сборка статической версии
npm run build-storybook

# Альиас для запуска
npm run docs
```

## 📁 Структура файлов:

```
.storybook/
├── main.ts          # Основная конфигурация
├── preview.ts       # Настройки превью
└── tsconfig.json    # TypeScript конфигурация

src/
├── components/ui/
│   ├── Button.stories.tsx
│   ├── Input.stories.tsx
│   ├── LoadingSpinner.stories.tsx
│   └── BentoGrid.stories.tsx
└── stories/
    └── DesignTokens.stories.tsx
```

## ⚡ Возможности:

- **Интерактивная документация** - Живые примеры компонентов
- **Controls** - Изменение props в реальном времени
- **Dark/Light Theme** - Переключение тем
- **Responsive Design** - Тестирование на разных экранах
- **Accessibility** - Проверка доступности
- **Actions** - Логирование событий

## 🐛 Устранение проблем:

### Если команда `storybook` не найдена:
```bash
npx storybook dev -p 6006 --no-open
```

### Если порт 6006 занят:
```bash
npx storybook dev -p 6007 --no-open
```

### Если TypeScript ошибки:
```bash
npm run type-check
```

## 🚀 Готово к использованию!

Storybook настроен и готов для разработки компонентов DevAssist Pro.