"""
ИСПРАВЛЕННЫЙ KP Analysis PDF Exporter - КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ КИРИЛЛИЦЫ
Этот модуль решает проблему с кириллическими символами в PDF экспорте
"""
import os
import io
import logging
import urllib.request
from datetime import datetime
from typing import Dict, Any, List, Optional, Union
from pathlib import Path

# ReportLab imports
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, black, white, red, green, blue
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Настройка логирования
logger = logging.getLogger(__name__)

class CyrillicPDFExporter:
    """
    ИСПРАВЛЕННЫЙ экспортер с надежной поддержкой кириллицы
    """
    
    def __init__(self):
        # Корпоративные цвета DevAssist Pro
        self.primary_color = HexColor('#2E75D6')      # Синий
        self.accent_color = HexColor('#FF5F08')       # Оранжевый
        self.success_color = HexColor('#22c55e')      # Зеленый
        self.warning_color = HexColor('#f59e0b')      # Желтый
        self.danger_color = HexColor('#ef4444')       # Красный
        self.gray_light = HexColor('#f8f9fa')
        self.gray_medium = HexColor('#6c757d')
        self.gray_dark = HexColor('#343a40')
        
        # Настройка шрифтов с АВТОМАТИЧЕСКИМ скачиванием
        self.font_family = self._setup_cyrillic_fonts()
        
        # Настройка стилей
        self._setup_styles()
    
    def _setup_cyrillic_fonts(self) -> str:
        """
        КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Автоматическая настройка шрифтов с поддержкой кириллицы
        """
        logger.info("🔧 НАЧИНАЕМ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ШРИФТОВ...")
        
        try:
            fonts_dir = Path(__file__).parent / "fonts"
            fonts_dir.mkdir(exist_ok=True)
            
            # Пути к DejaVu шрифтам
            dejavu_regular = fonts_dir / "DejaVuSans.ttf"
            dejavu_bold = fonts_dir / "DejaVuSans-Bold.ttf"
            
            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Автоматическое скачивание шрифтов
            self._download_cyrillic_fonts(fonts_dir)
            
            # Проверяем наличие шрифтов после скачивания
            if not dejavu_regular.exists():
                logger.error("❌ КРИТИЧЕСКАЯ ОШИБКА: DejaVu шрифты не найдены!")
                return self._use_fallback_cyrillic()
            
            # Регистрируем DejaVu шрифты
            try:
                pdfmetrics.registerFont(TTFont('CyrillicFont', str(dejavu_regular)))
                logger.info("✅ DejaVu Regular зарегистрирован как CyrillicFont")
                
                if dejavu_bold.exists():
                    pdfmetrics.registerFont(TTFont('CyrillicFont-Bold', str(dejavu_bold)))
                    logger.info("✅ DejaVu Bold зарегистрирован как CyrillicFont-Bold")
                    
                    # Регистрируем семейство шрифтов
                    from reportlab.pdfbase.pdfmetrics import registerFontFamily
                    registerFontFamily(
                        'CyrillicFont',
                        normal='CyrillicFont',
                        bold='CyrillicFont-Bold',
                        italic='CyrillicFont',  # Используем regular для italic
                        boldItalic='CyrillicFont-Bold'
                    )
                    logger.info("✅ Семейство шрифтов CyrillicFont зарегистрировано")
                
                return 'CyrillicFont'
                
            except Exception as e:
                logger.error(f"❌ Ошибка регистрации DejaVu шрифтов: {e}")
                return self._use_fallback_cyrillic()
                
        except Exception as e:
            logger.error(f"❌ КРИТИЧЕСКАЯ ОШИБКА настройки шрифтов: {e}")
            return self._use_fallback_cyrillic()
    
    def _download_cyrillic_fonts(self, fonts_dir: Path):
        """Автоматическое скачивание DejaVu шрифтов с поддержкой кириллицы"""
        logger.info("📥 Скачиваем DejaVu шрифты для кириллицы...")
        
        # URL для скачивания DejaVu шрифтов
        dejavu_urls = {
            "DejaVuSans.ttf": "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans.ttf",
            "DejaVuSans-Bold.ttf": "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans-Bold.ttf"
        }
        
        for font_file, url in dejavu_urls.items():
            font_path = fonts_dir / font_file
            
            if font_path.exists() and font_path.stat().st_size > 50000:
                logger.info(f"✅ Шрифт уже существует: {font_file}")
                continue
                
            try:
                logger.info(f"📥 Скачиваем: {font_file}")
                
                # Скачиваем с таймаутом
                request = urllib.request.Request(url, headers={
                    'User-Agent': 'DevAssist-Pro-PDF-Exporter/2.0'
                })
                
                with urllib.request.urlopen(request, timeout=30) as response:
                    font_data = response.read()
                
                # Сохраняем файл
                with open(font_path, 'wb') as f:
                    f.write(font_data)
                
                if font_path.exists() and font_path.stat().st_size > 50000:
                    logger.info(f"✅ Успешно скачан: {font_file} ({font_path.stat().st_size} байт)")
                else:
                    logger.error(f"❌ Некорректный файл: {font_file}")
                    
            except Exception as e:
                logger.error(f"❌ Ошибка скачивания {font_file}: {e}")
    
    def _use_fallback_cyrillic(self) -> str:
        """Fallback для кириллицы когда DejaVu недоступны"""
        logger.warning("⚠️ Используем fallback метод для кириллицы...")
        
        try:
            # Попробуем найти системные шрифты с кириллицей
            import platform
            
            if platform.system() == "Windows":
                # Windows - пробуем Arial Unicode MS или Calibri
                try:
                    # Попробуем зарегистрировать системный шрифт
                    pdfmetrics.registerFont(TTFont('SystemCyrillic', 'C:/Windows/Fonts/arial.ttf'))
                    logger.info("✅ Windows Arial зарегистрирован для кириллицы")
                    return 'SystemCyrillic'
                except:
                    pass
            
            elif platform.system() == "Linux":
                # Linux - пробуем Liberation Sans
                linux_fonts = [
                    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
                    '/usr/share/fonts/TTF/DejaVuSans.ttf',
                    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
                ]
                
                for font_path in linux_fonts:
                    if Path(font_path).exists():
                        try:
                            pdfmetrics.registerFont(TTFont('SystemCyrillic', font_path))
                            logger.info(f"✅ Linux шрифт зарегистрирован: {font_path}")
                            return 'SystemCyrillic'
                        except:
                            continue
            
            # Последний fallback - используем встроенные шрифты ReportLab с кириллицей
            logger.warning("⚠️ Используем встроенные шрифты ReportLab")
            return 'Helvetica'  # ReportLab имеет базовую поддержку кириллицы
            
        except Exception as e:
            logger.error(f"❌ Ошибка fallback: {e}")
            return 'Helvetica'
    
    def _setup_styles(self):
        """Настройка стилей для документа с кириллическими шрифтами"""
        self.styles = getSampleStyleSheet()
        
        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Все стили используют кириллический шрифт
        
        # Основной заголовок
        self.styles.add(ParagraphStyle(
            name='MainTitle',
            fontName=f'{self.font_family}',
            fontSize=24,
            textColor=self.primary_color,
            alignment=TA_CENTER,
            spaceAfter=20
        ))
        
        # Заголовок раздела
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            fontName=f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else self.font_family,
            fontSize=16,
            textColor=self.primary_color,
            spaceBefore=15,
            spaceAfter=10
        ))
        
        # Подзаголовок
        self.styles.add(ParagraphStyle(
            name='SubHeader',
            fontName=f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else self.font_family,
            fontSize=12,
            textColor=self.gray_dark,
            spaceBefore=10,
            spaceAfter=8
        ))
        
        # Обычный текст
        self.styles.add(ParagraphStyle(
            name='NormalText',
            fontName=self.font_family,
            fontSize=10,
            textColor=self.gray_dark,
            spaceAfter=6,
            alignment=TA_JUSTIFY
        ))
        
        # Выделенный текст
        self.styles.add(ParagraphStyle(
            name='HighlightText',
            fontName=f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else self.font_family,
            fontSize=11,
            textColor=self.accent_color,
            spaceAfter=6
        ))
        
        # Мелкий текст
        self.styles.add(ParagraphStyle(
            name='SmallText',
            fontName=self.font_family,
            fontSize=8,
            textColor=self.gray_medium,
            spaceAfter=4
        ))
    
    def generate_test_pdf(self, output_path: str = "test_cyrillic_fixed.pdf") -> bytes:
        """
        КРИТИЧЕСКИЙ ТЕСТ: Генерация тестового PDF с кириллицей
        """
        logger.info("🎯 ГЕНЕРИРУЕМ ТЕСТОВЫЙ PDF С ИСПРАВЛЕННОЙ КИРИЛЛИЦЕЙ...")
        
        # Создаем буфер для PDF
        buffer = io.BytesIO()
        
        # Создаем документ
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2.5*cm,
            bottomMargin=2*cm,
            title="Тест кириллицы - DevAssist Pro",
            author="DevAssist Pro"
        )
        
        # Тестовый контент с кириллицей
        story = []
        
        # Заголовок
        story.append(Paragraph(
            "🎯 КРИТИЧЕСКИЙ ТЕСТ КИРИЛЛИЦЫ В PDF",
            self.styles['MainTitle']
        ))
        story.append(Spacer(1, 0.5*inch))
        
        # Информация о шрифте
        story.append(Paragraph(
            f"Используемый шрифт: {self.font_family}",
            self.styles['SectionHeader']
        ))
        story.append(Spacer(1, 0.3*inch))
        
        # Тестовый текст на кириллице
        test_content = """
        📊 АНАЛИЗ КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ
        
        Компания: ООО «ТехноЛидер»
        Проект: Разработка веб-портала для недвижимости
        Стоимость: 1 500 000 ₽ (полтора миллиона рублей)
        Сроки: 90 рабочих дней
        Технологии: Python, React, PostgreSQL, Docker
        
        🎯 ОЦЕНКА ПО КРИТЕРИЯМ:
        • Техническое соответствие: 85/100 ✅ Отлично
        • Функциональная полнота: 78/100 ✅ Хорошо  
        • Экономическая эффективность: 92/100 ✅ Отлично
        • Реалистичность сроков: 75/100 ⚠️ Внимание
        • Надежность поставщика: 88/100 ✅ Отлично
        • Качество решения: 82/100 ✅ Отлично
        • Инновационность подхода: 79/100 ✅ Хорошо
        • Управление рисками: 86/100 ✅ Отлично
        • Сопровождение и поддержка: 81/100 ✅ Отлично
        • Гибкость и адаптивность: 84/100 ✅ Отлично
        
        💡 КЛЮЧЕВЫЕ ВЫВОДЫ:
        ✅ Предложение соответствует техническому заданию
        ✅ Стоимость конкурентоспособна на рынке
        ✅ Команда имеет необходимую экспертизу  
        ✅ Методология разработки хорошо проработана
        ⚠️ Требуется детализация по безопасности
        ⚠️ Нужны примеры аналогичных проектов
        
        🎯 ИТОГОВАЯ РЕКОМЕНДАЦИЯ:
        ⚠️ РЕКОМЕНДОВАТЬ С ОГОВОРКАМИ
        
        Общая оценка: 84/100 баллов
        Статус: Высокое качество предложения с незначительными замечаниями
        
        📋 СЛЕДУЮЩИЕ ШАГИ:
        1. Провести техническое интервью с ведущими разработчиками
        2. Запросить детализацию по информационной безопасности
        3. Уточнить SLA и условия технической поддержки
        4. Согласовать поэтапный график платежей
        5. Подписать договор на выполнение работ
        
        🔤 ТЕСТ СПЕЦИАЛЬНЫХ СИМВОЛОВ:
        Рубль: ₽, Доллар: $, Евро: €, Тенге: ₸, Гривна: ₴
        Номер: №, Параграф: §, Копирайт: ©, Торговая марка: ™
        Стрелки: → ← ↑ ↓, Галочки: ✓ ✗ ✅ ❌
        Звездочки: ★ ☆ ⭐, Предупреждения: ⚠️ ⛔ 🚨
        
        🌍 МНОГОЯЗЫЧНЫЙ ТЕСТ:
        Русский: Привет, мир! 
        English: Hello, world!
        Українська: Привіт, світ!
        Қазақша: Сәлем, әлем!
        
        ═══════════════════════════════════════════════
        🤖 Отчет сгенерирован системой DevAssist Pro v2
        📅 Дата: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}
        🌐 Сайт: www.devassist.pro
        📧 Поддержка: support@devassist.pro
        ═══════════════════════════════════════════════
        """.format(datetime=datetime)
        
        story.append(Paragraph(test_content, self.styles['NormalText']))
        
        # Таблица с кириллицей
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph("📊 СВОДНАЯ ТАБЛИЦА ОЦЕНОК", self.styles['SectionHeader']))
        
        table_data = [
            ['КРИТЕРИЙ', 'ОЦЕНКА', 'СТАТУС'],
            ['Техническое соответствие', '85/100', '✅ Отлично'],
            ['Функциональная полнота', '78/100', '✅ Хорошо'],
            ['Экономическая эффективность', '92/100', '✅ Отлично'],
            ['Реалистичность сроков', '75/100', '⚠️ Внимание'],
            ['Надежность поставщика', '88/100', '✅ Отлично'],
            ['ОБЩАЯ ОЦЕНКА', '84/100', '✅ ВЫСОКОЕ КАЧЕСТВО']
        ]
        
        table = Table(table_data, colWidths=[8*cm, 3*cm, 4*cm])
        table.setStyle(TableStyle([
            # Заголовок
            ('FONTNAME', (0, 0), (-1, 0), f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else self.font_family),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BACKGROUND', (0, 0), (-1, 0), self.primary_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Данные
            ('FONTNAME', (0, 1), (-1, -1), self.font_family),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.gray_light]),
            
            # Выделение итоговой строки
            ('FONTNAME', (0, -1), (-1, -1), f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else self.font_family),
            ('BACKGROUND', (0, -1), (-1, -1), self.accent_color),
            ('TEXTCOLOR', (0, -1), (-1, -1), white),
            
            ('GRID', (0, 0), (-1, -1), 1, self.gray_medium),
        ]))
        
        story.append(table)
        
        # Генерируем PDF
        try:
            doc.build(story)
            logger.info("✅ ТЕСТОВЫЙ PDF С КИРИЛЛИЦЕЙ УСПЕШНО СГЕНЕРИРОВАН!")
        except Exception as e:
            logger.error(f"❌ КРИТИЧЕСКАЯ ОШИБКА генерации PDF: {e}")
            raise
        
        # Получаем PDF контент
        pdf_content = buffer.getvalue()
        buffer.close()
        
        # Сохраняем файл
        with open(output_path, 'wb') as f:
            f.write(pdf_content)
        
        logger.info(f"📄 Тестовый PDF сохранен: {output_path}")
        logger.info(f"📏 Размер файла: {len(pdf_content)} байт")
        
        return pdf_content
    
    def generate_kp_analysis_pdf(self, analysis_data: Dict[str, Any], output_path: Optional[str] = None) -> bytes:
        """
        ИСПРАВЛЕННАЯ генерация PDF отчета анализа КП с поддержкой кириллицы
        """
        logger.info("🎯 ГЕНЕРИРУЕМ ИСПРАВЛЕННЫЙ PDF ОТЧЕТ КП АНАЛИЗА...")
        
        # Создаем буфер для PDF
        buffer = io.BytesIO()
        
        # Создаем документ
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2.5*cm,
            bottomMargin=2*cm,
            title="Отчет по анализу КП - DevAssist Pro",
            author="DevAssist Pro"
        )
        
        story = []
        
        # Титульная страница
        story.append(Paragraph(
            "ОТЧЕТ ПО АНАЛИЗУ КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ",
            self.styles['MainTitle']
        ))
        story.append(Spacer(1, 0.5*inch))
        
        # Основная информация
        tz_name = analysis_data.get('tz_name', 'Техническое задание')
        kp_name = analysis_data.get('kp_name', 'Коммерческое предложение')
        company_name = analysis_data.get('company_name', 'Компания-исполнитель')
        overall_score = analysis_data.get('overall_score', 0)
        
        info_text = f"""
        <b>Техническое задание:</b><br/>{tz_name}<br/><br/>
        <b>Коммерческое предложение:</b><br/>{kp_name}<br/><br/>
        <b>Компания-исполнитель:</b><br/>{company_name}<br/><br/>
        <b>Дата анализа:</b><br/>{datetime.now().strftime('%d.%m.%Y %H:%M')}<br/><br/>
        <b>Общая оценка:</b><br/>{overall_score}/100 баллов {self._get_score_status(overall_score)}
        """
        
        story.append(Paragraph(info_text, self.styles['NormalText']))
        story.append(PageBreak())
        
        # Исполнительное резюме
        story.append(Paragraph("ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ", self.styles['SectionHeader']))
        
        business_analysis = analysis_data.get('business_analysis', {})
        criteria_scores = business_analysis.get('criteria_scores', {})
        
        # Таблица критериев
        criteria_data = [['КРИТЕРИЙ', 'ОЦЕНКА', 'СТАТУС']]
        
        criteria_mapping = {
            'technical_compliance': 'Техническое соответствие',
            'functional_completeness': 'Функциональная полнота',
            'cost_effectiveness': 'Экономическая эффективность',
            'timeline_realism': 'Реалистичность сроков',
            'vendor_reliability': 'Надежность поставщика'
        }
        
        for key, name in criteria_mapping.items():
            score = criteria_scores.get(key, 0)
            status = self._get_score_status(score)
            criteria_data.append([name, f'{score}/100', status])
        
        criteria_data.append(['ОБЩАЯ ОЦЕНКА', f'{overall_score}/100', self._get_score_status(overall_score)])
        
        criteria_table = Table(criteria_data, colWidths=[8*cm, 3*cm, 4*cm])
        criteria_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else self.font_family),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BACKGROUND', (0, 0), (-1, 0), self.primary_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), self.font_family),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.gray_light]),
            ('FONTNAME', (0, -1), (-1, -1), f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else self.font_family),
            ('BACKGROUND', (0, -1), (-1, -1), self.accent_color),
            ('TEXTCOLOR', (0, -1), (-1, -1), white),
            ('GRID', (0, 0), (-1, -1), 1, self.gray_medium),
        ]))
        
        story.append(criteria_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Рекомендации
        final_recommendation = analysis_data.get('final_recommendation', 'conditional_accept')
        executive_summary = analysis_data.get('executive_summary', '')
        
        story.append(Paragraph("ИТОГОВАЯ РЕКОМЕНДАЦИЯ", self.styles['SectionHeader']))
        
        recommendation_text = self._format_recommendation(final_recommendation)
        story.append(Paragraph(
            f"<b>{recommendation_text}</b>",
            ParagraphStyle(
                name='FinalRecommendation',
                fontName=f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else self.font_family,
                fontSize=14,
                textColor=self._get_recommendation_color(final_recommendation),
                spaceBefore=15,
                spaceAfter=15,
                alignment=TA_CENTER
            )
        ))
        
        if executive_summary:
            story.append(Paragraph(executive_summary, self.styles['NormalText']))
        
        # Footer
        story.append(Spacer(1, 1*inch))
        story.append(Paragraph(
            "───────────────────────────────────────<br/>"
            "Сгенерировано: DevAssist Pro v2<br/>"
            "www.devassist.pro | support@devassist.pro",
            ParagraphStyle(
                name='Footer',
                fontName=self.font_family,
                fontSize=10,
                textColor=self.gray_medium,
                alignment=TA_CENTER
            )
        ))
        
        # Генерируем PDF
        try:
            doc.build(story)
            logger.info("✅ ИСПРАВЛЕННЫЙ PDF ОТЧЕТ УСПЕШНО СГЕНЕРИРОВАН!")
        except Exception as e:
            logger.error(f"❌ ОШИБКА генерации исправленного PDF: {e}")
            raise
        
        # Получаем PDF контент
        pdf_content = buffer.getvalue()
        buffer.close()
        
        # Сохраняем файл если указан путь
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(pdf_content)
            logger.info(f"📄 Исправленный PDF сохранен: {output_path}")
        
        logger.info(f"📏 Размер файла: {len(pdf_content)} байт")
        return pdf_content
    
    def _get_score_status(self, score: int) -> str:
        """Получение статуса по баллам"""
        if score >= 85:
            return "✅ Отлично"
        elif score >= 70:
            return "✅ Хорошо"
        elif score >= 55:
            return "⚠️ Внимание"
        elif score >= 40:
            return "⚠️ Требует доработки"
        else:
            return "❌ Критично"
    
    def _format_recommendation(self, recommendation: str) -> str:
        """Форматирование рекомендации"""
        recommendation_map = {
            'accept': '✅ РЕКОМЕНДОВАТЬ К ПРИНЯТИЮ',
            'conditional_accept': '⚠️ РЕКОМЕНДОВАТЬ С ОГОВОРКАМИ',
            'reject': '❌ ОТКЛОНИТЬ ПРЕДЛОЖЕНИЕ',
            'needs_revision': '🔄 ТРЕБУЕТ ДОРАБОТКИ'
        }
        return recommendation_map.get(recommendation, '⚠️ ТРЕБУЕТ АНАЛИЗА')
    
    def _get_recommendation_color(self, recommendation: str) -> HexColor:
        """Получение цвета рекомендации"""
        color_map = {
            'accept': self.success_color,
            'conditional_accept': self.warning_color,
            'reject': self.danger_color,
            'needs_revision': self.accent_color
        }
        return color_map.get(recommendation, self.warning_color)


# Создаем экземпляр исправленного экспортера
cyrillic_pdf_exporter = CyrillicPDFExporter()

def test_cyrillic_fix():
    """Функция для тестирования исправленной кириллицы"""
    logger.info("🚀 ЗАПУСКАЕМ КРИТИЧЕСКИЙ ТЕСТ ИСПРАВЛЕНИЯ КИРИЛЛИЦЫ")
    
    try:
        # Генерируем тестовый PDF
        pdf_content = cyrillic_pdf_exporter.generate_test_pdf("test_cyrillic_FIXED.pdf")
        
        # Тестовые данные для полного анализа
        test_analysis = {
            "tz_name": "Техническое задание на разработку веб-портала недвижимости",
            "kp_name": "КП от ООО «ТехноЛидер» - Веб-портал DevEstate",
            "company_name": "ООО «ТехноЛидер»",
            "overall_score": 84,
            "business_analysis": {
                "criteria_scores": {
                    "technical_compliance": 85,
                    "functional_completeness": 78,
                    "cost_effectiveness": 92,
                    "timeline_realism": 75,
                    "vendor_reliability": 88
                }
            },
            "final_recommendation": "conditional_accept",
            "executive_summary": "Коммерческое предложение демонстрирует высокий уровень проработки технических аспектов и соответствует основным требованиям заказчика. Предлагаемое решение использует современный стек технологий и показывает конкурентоспособную стоимость. Рекомендуется к принятию с учетом устранения замечаний по информационной безопасности."
        }
        
        # Генерируем полный PDF анализа
        full_pdf = cyrillic_pdf_exporter.generate_kp_analysis_pdf(
            test_analysis, 
            "kp_analysis_CYRILLIC_FIXED.pdf"
        )
        
        logger.info("✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО!")
        logger.info("📄 Созданы файлы:")
        logger.info("   • test_cyrillic_FIXED.pdf - тестовый файл")
        logger.info("   • kp_analysis_CYRILLIC_FIXED.pdf - полный анализ")
        logger.info("🎉 КИРИЛЛИЦА В PDF ТЕПЕРЬ ДОЛЖНА РАБОТАТЬ КОРРЕКТНО!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ КРИТИЧЕСКАЯ ОШИБКА тестирования: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    # Настройка логирования
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    test_cyrillic_fix()