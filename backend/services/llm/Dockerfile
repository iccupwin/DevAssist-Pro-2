FROM python:3.11-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Создание рабочей директории
WORKDIR /app

# Копирование и установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование shared библиотеки
COPY ../shared /app/shared

# Копирование исходного кода
COPY . .

# Создание непривилегированного пользователя
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Открытие порта
EXPOSE 8002

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Команда запуска
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]