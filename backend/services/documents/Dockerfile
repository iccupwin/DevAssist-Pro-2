# Documents Service Dockerfile
FROM python:3.11-slim

# Установка системных зависимостей для обработки документов
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-rus \
    poppler-utils \
    libreoffice \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Установка рабочей директории
WORKDIR /app

# Копирование requirements и установка зависимостей
COPY services/documents/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование shared модулей
COPY shared /app/shared

# Копирование кода приложения
COPY services/documents .

# Создание директорий для данных
RUN mkdir -p data/uploads data/processed

# Создание непривилегированного пользователя
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Открытие порта
EXPOSE 8003

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# Запуск приложения
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]