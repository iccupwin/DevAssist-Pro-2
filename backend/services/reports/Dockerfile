FROM python:3.11-slim

WORKDIR /app

# Копирование requirements
COPY requirements.txt .

# Установка Python зависимостей без дополнительных системных пакетов
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir fastapi uvicorn pydantic redis requests

# Копирование кода приложения
COPY . .

# Создание директорий для данных
RUN mkdir -p data/reports data/exports data/templates

# Expose port
EXPOSE 8005

# Команда запуска
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8005"]