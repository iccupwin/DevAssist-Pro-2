#\!/bin/bash

# Fix Frontend - Исправление React frontend на сервере
set -e

echo "🔧 Исправление React frontend..."

# 1. Установка недостающих Tailwind плагинов
echo "Установка Tailwind плагинов..."
cd frontend
npm install --save-dev @tailwindcss/forms @tailwindcss/typography

# 2. Исправление TypeScript ошибок
echo "Исправление TypeScript ошибок..."
if [ -f "src/components/performance/LazyRoutes.tsx" ]; then
    sed -i 's/<MainPage \/>/<MainPage currentStep="upload" onStepChange={() => {}} \/>/g' src/components/performance/LazyRoutes.tsx
    sed -i 's/<LazyComponent {...props} \/>/<LazyComponent {...(props as any)} \/>/g' src/components/performance/LazyRoutes.tsx
fi

if [ -f "src/components/ui/AccessibleForm.tsx" ]; then
    sed -i 's/React.cloneElement(child, {/React.cloneElement(child as React.ReactElement<any>, {/g' src/components/ui/AccessibleForm.tsx
fi

if [ -f "src/components/debug/PerformanceMonitor.tsx" ]; then
    sed -i 's/<Component {...props} ref={ref} \/>/<Component {...(props as any)} ref={ref} \/>/g' src/components/debug/PerformanceMonitor.tsx
fi

# 3. Очистка кэша
echo "Очистка кэша..."
rm -rf node_modules/.cache .cache

# 4. Перезапуск контейнеров
echo "Перезапуск контейнеров..."
cd ..
docker compose -f docker-compose.production.yml restart nginx app

echo "Ожидание 30 сек..."
sleep 30

# 5. Проверка
echo "Проверка сайта..."
curl -s -o /dev/null -w "%{http_code}" http://46.149.71.162/

echo "✅ Готово\! Проверьте http://46.149.71.162/"
SCRIPT < /dev/null
