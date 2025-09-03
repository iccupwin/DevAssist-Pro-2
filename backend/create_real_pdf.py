#!/usr/bin/env python3
"""Создание настоящего PDF файла с помощью reportlab"""

def create_real_pdf():
    """Создает настоящий PDF файл"""
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    
    filename = "test_kp_real.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    
    # Добавляем текст
    y_position = 750
    
    text_lines = [
        "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ",
        "",
        "Компания: ООО 'ТехноСтрой'",
        "Дата: 04.08.2025",
        "",
        "1. ОПИСАНИЕ ПРОЕКТА",
        "Разработка информационной системы для управления",
        "строительными проектами.",
        "",
        "2. ТЕХНОЛОГИИ",
        "- Backend: Python, FastAPI",
        "- Frontend: React, TypeScript",
        "- База данных: PostgreSQL",
        "- Инфраструктура: Docker, Kubernetes",
        "",
        "3. КОМАНДА",
        "- Руководитель проекта: 1 человек",
        "- Backend разработчики: 3 человека",
        "- Frontend разработчики: 2 человека",
        "- DevOps инженер: 1 человек",
        "",
        "4. СТОИМОСТЬ",
        "Общая стоимость проекта: 5 000 000 рублей",
        "- Проектирование: 500 000 руб",
        "- Разработка: 3 500 000 руб",
        "- Тестирование: 500 000 руб",
        "- Внедрение и поддержка: 500 000 руб",
        "",
        "5. ГАРАНТИИ",
        "- Гарантийная поддержка: 12 месяцев",
        "- Исправление критических ошибок: в течение 24 часов",
        "- Обучение пользователей включено в стоимость"
    ]
    
    for line in text_lines:
        c.drawString(50, y_position, line)
        y_position -= 20
        if y_position < 50:  # Переходим на новую страницу если места нет
            c.showPage()
            y_position = 750
    
    c.save()
    print(f"Настоящий PDF создан: {filename}")
    return filename

if __name__ == "__main__":
    create_real_pdf()
    print("Настоящий PDF готов!")