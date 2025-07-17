#!/bin/bash

# Быстрый запуск DevAssist Pro на Ubuntu
echo "🚀 Быстрый запуск DevAssist Pro"
echo "==============================="

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Запустите: ./ubuntu-setup.sh"
    exit 1
fi

# Создание .env файла
if [ ! -f ".env" ]; then
    echo "⚙️ Создание конфигурации..."
    cp .env.production .env
    
    echo "📝 ВАЖНО: Настройте .env файл с вашими данными:"
    echo "1. Измените пароли POSTGRES_PASSWORD и REDIS_PASSWORD"
    echo "2. Добавьте API ключи: ANTHROPIC_API_KEY, OPENAI_API_KEY"
    echo "3. Укажите ваш домен в REACT_APP_API_URL"
    echo ""
    echo "Хотите отредактировать сейчас? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        nano .env
    fi
fi

# Запуск только backend и frontend (без лишних сервисов)
echo "🏃 Запуск основных сервисов..."

# Создание упрощенного docker-compose файла для быстрого старта
cat > docker-compose.quick-start.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: devassist_postgres
    environment:
      POSTGRES_DB: devassist_pro
      POSTGRES_USER: devassist_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-devassist_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  # API Gateway (Backend)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.monolith
    container_name: devassist_backend
    environment:
      - DATABASE_URL=postgresql://devassist_user:${POSTGRES_PASSWORD:-devassist_password}@postgres:5432/devassist_pro
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    restart: unless-stopped

  # React Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: devassist_frontend
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  # Streamlit Demo
  streamlit:
    build:
      context: .
      dockerfile: Dockerfile.streamlit
    container_name: devassist_streamlit
    environment:
      - API_BASE_URL=http://backend:8000
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    ports:
      - "8501:8501"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Запуск сервисов
docker-compose -f docker-compose.quick-start.yml up -d --build

echo "⏳ Ожидание запуска сервисов..."
sleep 30

# Проверка статуса
echo "📊 Статус сервисов:"
docker-compose -f docker-compose.quick-start.yml ps

echo ""
echo "🎉 DevAssist Pro запущен!"
echo "========================="
echo "🌐 React Frontend: http://$(curl -s ifconfig.me):3000"
echo "🔗 Backend API: http://$(curl -s ifconfig.me):8000"
echo "📊 API Docs: http://$(curl -s ifconfig.me):8000/docs"  
echo "🎯 Streamlit Demo: http://$(curl -s ifconfig.me):8501"
echo ""
echo "📋 Полезные команды:"
echo "docker-compose -f docker-compose.quick-start.yml logs -f  # Логи"
echo "docker-compose -f docker-compose.quick-start.yml restart  # Перезапуск"
echo "docker-compose -f docker-compose.quick-start.yml down     # Остановка"