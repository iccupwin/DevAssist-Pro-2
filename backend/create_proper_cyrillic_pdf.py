#!/usr/bin/env python3
"""Создание PDF с правильной кириллицей для тестирования"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping
import os

def create_proper_cyrillic_pdf():
    """Создает PDF с правильной кириллической кодировкой"""
    filename = "test_proper_cyrillic.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    
    # Используем DejaVu Sans - шрифт с полной поддержкой кириллицы
    try:
        # Пробуем найти системный шрифт
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/System/Library/Fonts/Arial.ttf",
            "C:\\Windows\\Fonts\\arial.ttf"
        ]
        
        font_registered = False
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    pdfmetrics.registerFont(TTFont('DejaVuSans', font_path))
                    c.setFont('DejaVuSans', 12)
                    font_registered = True
                    print(f"Используем шрифт: {font_path}")
                    break
                except:
                    continue
        
        if not font_registered:
            # Fallback на встроенный шрифт
            c.setFont("Helvetica", 12)
            print("Используем встроенный шрифт Helvetica")
            
    except Exception as e:
        print(f"Ошибка регистрации шрифта: {e}")
        c.setFont("Helvetica", 12)
    
    # Кириллический текст в правильной кодировке
    y_position = 750
    
    text_lines = [
        "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ",
        "",
        "Компания: ООО «ТехноСтрой»",
        "Дата: 04 августа 2025 года",
        "",
        "УВАЖАЕМЫЕ КОЛЛЕГИ!",
        "",
        "Представляем Вам коммерческое предложение на разработку",
        "информационной системы для управления строительными проектами.",
        "",
        "1. ОПИСАНИЕ ПРОЕКТА",
        "Создание современной веб-платформы с использованием передовых",
        "технологий для автоматизации бизнес-процессов в строительстве.",
        "",
        "2. ТЕХНОЛОГИЧЕСКИЙ СТЕК",
        "• Backend: Python 3.11, FastAPI, PostgreSQL",
        "• Frontend: React 18, TypeScript, Material-UI",
        "• Инфраструктура: Docker, Kubernetes, Redis",
        "• Интеграции: REST API, WebSocket, OAuth 2.0",
        "",
        "3. КОМАНДА РАЗРАБОТЧИКОВ",
        "• Руководитель проекта: 1 специалист",
        "• Backend разработчики: 3 специалиста",
        "• Frontend разработчики: 2 специалиста",
        "• DevOps инженер: 1 специалист",
        "• QA инженер: 1 специалист",
        "",
        "4. ФИНАНСОВЫЕ УСЛОВИЯ",
        "Общая стоимость разработки: 5 000 000 рублей",
        "",
        "Детализация по этапам:",
        "• Техническое проектирование: 500 000 руб.",
        "• Основная разработка: 3 500 000 руб.",
        "• Тестирование и отладка: 500 000 руб.",
        "• Внедрение и обучение: 500 000 руб.",
        "",
        "5. ВРЕМЕННЫЕ РАМКИ",
        "Полный цикл разработки: 6 месяцев",
        "Первая демо-версия через: 2 месяца",
        "",
        "6. ГАРАНТИЙНЫЕ ОБЯЗАТЕЛЬСТВА",
        "• Техническая поддержка: 12 месяцев",
        "• Устранение критических ошибок: 24 часа",
        "• Обновления безопасности: включены",
        "• Обучение персонала: включено в стоимость",
        "",
        "С уважением,",
        "Команда ООО «ТехноСтрой»",
        "Телефон: +7 (495) 123-45-67",
        "Email: info@technostroy.ru",
        "",
        "ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:",
        "Российские символы: АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
        "Строчные буквы: абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
        "Цифры и знаки: 1234567890 №₽%*+-=()[]{}!@#$%^&*()"
    ]
    
    for line in text_lines:
        try:
            # Явно указываем кодировку UTF-8
            if isinstance(line, str):
                text_to_draw = line
            else:
                text_to_draw = str(line)
            
            c.drawString(50, y_position, text_to_draw)
            
        except Exception as e:
            print(f"Ошибка при добавлении строки '{line}': {e}")
            # Fallback - пробуем ASCII версию
            ascii_line = line.encode('ascii', 'replace').decode('ascii')
            c.drawString(50, y_position, ascii_line)
        
        y_position -= 20
        if y_position < 50:  # Переходим на новую страницу
            c.showPage()
            if font_registered:
                c.setFont('DejaVuSans', 12)
            else:
                c.setFont("Helvetica", 12)
            y_position = 750
    
    c.save()
    print(f"PDF с правильной кириллицей создан: {filename}")
    return filename

if __name__ == "__main__":
    create_proper_cyrillic_pdf()
    print("PDF с кириллическим текстом в правильной кодировке готов!")