"""
KP Analysis PDF Exporter - Профессиональный экспорт анализа КП в PDF
Поддержка кириллицы, красивое оформление, полная структура анализа
"""
import os
import io
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Union
from pathlib import Path

# ReportLab imports
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, black, white, red, green, blue
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus import Image as RLImage, Frame, PageTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.widgetbase import Widget

# Настройка логирования
logger = logging.getLogger(__name__)

class KPAnalysisPDFExporter:
    """
    Экспортер анализа КП в профессиональный PDF с поддержкой кириллицы
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
        
        # Настройка шрифтов с поддержкой кириллицы
        self._setup_fonts()
        
        # Настройка стилей
        self._setup_styles()
        
        # Лог итогового шрифта
        logger.info(f"🎯 ИТОГОВЫЙ ШРИФТ ДЛЯ КИРИЛЛИЦЫ: {self.font_family}")
    
    def _setup_fonts(self):
        """КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Настройка шрифтов с автоматическим скачиванием DejaVu"""
        logger.info("🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Настраиваем шрифты с поддержкой кириллицы...")
        
        try:
            fonts_dir = Path(__file__).parent / "fonts"
            fonts_dir.mkdir(exist_ok=True)
            
            # Пути к шрифтам DejaVu
            dejavu_regular = fonts_dir / "DejaVuSans.ttf"
            dejavu_bold = fonts_dir / "DejaVuSans-Bold.ttf"
            
            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Автоматическое скачивание шрифтов
            self._download_dejavu_fonts(fonts_dir)
            
            fonts_registered = 0
            
            # Регистрируем шрифты если они есть
            if dejavu_regular.exists() and dejavu_regular.stat().st_size > 50000:
                pdfmetrics.registerFont(TTFont('DejaVu', str(dejavu_regular)))
                logger.info("✅ DejaVu Regular зарегистрирован")
                fonts_registered += 1
            else:
                logger.error("❌ КРИТИЧЕСКАЯ ОШИБКА: DejaVu Regular не найден после скачивания!")
            
            if dejavu_bold.exists() and dejavu_bold.stat().st_size > 50000:
                pdfmetrics.registerFont(TTFont('DejaVu-Bold', str(dejavu_bold)))
                logger.info("✅ DejaVu Bold зарегистрирован")
                fonts_registered += 1
                
            # Если хотя бы один DejaVu шрифт зарегистрирован, используем DejaVu
            if fonts_registered >= 1:
                try:
                    from reportlab.pdfbase.pdfmetrics import registerFontFamily
                    registerFontFamily(
                        'DejaVu',
                        normal='DejaVu' if dejavu_regular.exists() else 'Helvetica',
                        bold='DejaVu-Bold' if dejavu_bold.exists() else 'Helvetica-Bold',
                        italic='DejaVu' if dejavu_regular.exists() else 'Helvetica-Oblique',
                        boldItalic='DejaVu-Bold' if dejavu_bold.exists() else 'Helvetica-BoldOblique'
                    )
                    self.font_family = 'DejaVu'
                    logger.info("✅ ИСПРАВЛЕНО: Семейство шрифтов DejaVu зарегистрировано")
                except Exception as e:
                    logger.warning(f"⚠️ Ошибка регистрации семейства шрифтов: {e}")
                    self.font_family = self._use_fallback_font()
            else:
                # DejaVu шрифты недоступны, используем fallback
                logger.warning("⚠️ DejaVu шрифты недоступны, используем fallback")
                self.font_family = self._use_fallback_font()
                
        except Exception as e:
            logger.error(f"❌ КРИТИЧЕСКАЯ ОШИБКА настройки шрифтов: {e}")
            self.font_family = self._use_fallback_font()
    
    def _setup_styles(self):
        """Настройка стилей для документа"""
        self.styles = getSampleStyleSheet()
        
        # Основной заголовок
        self.styles.add(ParagraphStyle(
            name='MainTitle',
            fontName=f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else 'Helvetica-Bold',
            fontSize=24,
            textColor=self.primary_color,
            alignment=TA_CENTER,
            spaceAfter=20
        ))
        
        # Заголовок раздела
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            fontName=f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else 'Helvetica-Bold',
            fontSize=16,
            textColor=self.primary_color,
            spaceBefore=15,
            spaceAfter=10
        ))
        
        # Подзаголовок
        self.styles.add(ParagraphStyle(
            name='SubHeader',
            fontName=f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else 'Helvetica-Bold',
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
            fontName=f'{self.font_family}-Bold' if self.font_family != 'Helvetica' else 'Helvetica-Bold',
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
    
    def generate_pdf(self, analysis_data: Dict[str, Any], output_path: Optional[str] = None) -> bytes:
        """
        Генерация PDF отчета из данных анализа КП
        
        Args:
            analysis_data: Данные детального анализа КП
            output_path: Путь для сохранения файла (опционально)
        
        Returns:
            bytes: PDF контент в виде байтов
        """
        logger.info("🎯 Начинаем генерацию PDF отчета КП анализа")
        
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
            title="Отчет по анализу КП",
            author="DevAssist Pro",
            subject="Анализ коммерческого предложения"
        )
        
        # Элементы документа
        story = []
        
        # Титульная страница
        story.extend(self._create_title_page(analysis_data))
        story.append(PageBreak())
        
        # Исполнительное резюме
        story.extend(self._create_executive_summary(analysis_data))
        story.append(PageBreak())
        
        # Детальные разделы анализа
        story.extend(self._create_detailed_sections(analysis_data))
        
        # Финансовый анализ
        story.extend(self._create_financial_section(analysis_data))
        story.append(PageBreak())
        
        # Рекомендации
        story.extend(self._create_recommendations(analysis_data))
        
        # Приложения
        story.extend(self._create_appendices(analysis_data))
        
        # Генерируем PDF
        try:
            doc.build(story)
            logger.info("✅ PDF отчет успешно сгенерирован")
        except Exception as e:
            logger.error(f"❌ Ошибка генерации PDF: {e}")
            raise
        
        # Получаем PDF контент
        pdf_content = buffer.getvalue()
        buffer.close()
        
        # Сохраняем файл если указан путь
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(pdf_content)
            logger.info(f"📄 PDF сохранен: {output_path}")
        
        return pdf_content
    
    def _create_title_page(self, data: Dict[str, Any]) -> List[Any]:
        """Создание титульной страницы"""
        elements = []
        
        # Логотип и заголовок
        elements.append(Spacer(1, 1*inch))
        
        # Главный заголовок
        elements.append(Paragraph(
            "ОТЧЕТ ПО АНАЛИЗУ КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ",
            self.styles['MainTitle']
        ))
        elements.append(Spacer(1, 0.5*inch))
        
        # Информация о документе
        tz_name = data.get('tz_name', 'Техническое задание')
        kp_name = data.get('kp_name', 'Коммерческое предложение')
        company_name = data.get('company_name', 'Компания-исполнитель')
        overall_score = data.get('overall_score', 0)
        
        # Таблица с основной информацией
        title_data = [
            ['Техническое задание:', tz_name],
            ['Коммерческое предложение:', kp_name],
            ['Компания-исполнитель:', company_name],
            ['', ''],
            ['Дата анализа:', datetime.now().strftime('%d.%m.%Y %H:%M')],
            ['Общая оценка:', f'{overall_score}/100 {self._get_score_status(overall_score)}'],
        ]
        
        title_table = Table(title_data, colWidths=[5*cm, 10*cm])
        title_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), self.font_family),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('TEXTCOLOR', (0, 0), (0, -1), self.primary_color),
            ('FONTNAME', (0, 0), (0, -1), f'{self.font_family}-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [white, self.gray_light]),
            ('GRID', (0, 0), (-1, -1), 1, self.gray_medium),
        ]))
        
        elements.append(title_table)
        elements.append(Spacer(1, 1*inch))
        
        # Статус анализа
        status_color = self._get_status_color(overall_score)
        status_text = self._get_score_status(overall_score)
        
        elements.append(Paragraph(
            f"<b>СТАТУС АНАЛИЗА: {status_text}</b>",
            ParagraphStyle(
                name='StatusText',
                fontName=f'{self.font_family}-Bold',
                fontSize=14,
                textColor=status_color,
                alignment=TA_CENTER,
                spaceBefore=20
            )
        ))
        
        # Footer
        elements.append(Spacer(1, 2*inch))
        elements.append(Paragraph(
            "───────────────────────────────────────",
            ParagraphStyle(
                name='Divider',
                fontName=self.font_family,
                fontSize=12,
                textColor=self.gray_medium,
                alignment=TA_CENTER
            )
        ))
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph(
            "Сгенерировано: DevAssist Pro v2<br/>www.devassist.pro",
            ParagraphStyle(
                name='Footer',
                fontName=self.font_family,
                fontSize=10,
                textColor=self.gray_medium,
                alignment=TA_CENTER
            )
        ))
        
        return elements
    
    def _create_executive_summary(self, data: Dict[str, Any]) -> List[Any]:
        """Создание исполнительного резюме"""
        elements = []
        
        elements.append(Paragraph("ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ", self.styles['MainTitle']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Сводная таблица оценок по критериям (система 10 критериев из Tender)
        elements.append(Paragraph("Оценка по критериям (Система 10 критериев)", self.styles['SectionHeader']))
        
        # Получаем данные business_analysis с критериями
        business_analysis = data.get('business_analysis', {})
        criteria_scores = business_analysis.get('criteria_scores', {})
        criteria_details = business_analysis.get('criteria_details', {})
        
        # Система 10 критериев из Tender проекта
        criteria_mapping = {
            'technical_compliance': 'Техническое соответствие',
            'functional_completeness': 'Функциональная полнота', 
            'cost_effectiveness': 'Экономическая эффективность',
            'timeline_realism': 'Реалистичность сроков',
            'vendor_reliability': 'Надежность поставщика',
            'solution_quality': 'Качество решения',
            'innovation_approach': 'Инновационность подхода',
            'risk_management': 'Управление рисками',
            'support_maintenance': 'Сопровождение и поддержка',
            'flexibility_adaptability': 'Гибкость и адаптивность'
        }
        
        sections_data = []
        sections_data.append(['КРИТЕРИЙ', 'ОЦЕНКА', 'ВЕС', 'СТАТУС'])  # Заголовок
        
        for criteria_key, criteria_title in criteria_mapping.items():
            score = criteria_scores.get(criteria_key, 0)
            weight = criteria_details.get(criteria_key, {}).get('weight', 0)
            status = self._get_score_status(score)
            weight_str = f"{weight}%" if weight > 0 else "—"
            sections_data.append([criteria_title, f'{score}/100', weight_str, status])
        
        # Добавляем итоговую строку
        overall_score = business_analysis.get('overall_score', 0)
        sections_data.append(['', '', '', ''])  # Пустая строка для разделения
        sections_data.append(['ОБЩАЯ ОЦЕНКА', f'{overall_score}/100', '100%', self._get_score_status(overall_score)])
        
        sections_table = Table(sections_data, colWidths=[6*cm, 2.5*cm, 2*cm, 4.5*cm])
        sections_table.setStyle(TableStyle([
            # Заголовок
            ('FONTNAME', (0, 0), (-1, 0), f'{self.font_family}-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BACKGROUND', (0, 0), (-1, 0), self.primary_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Данные
            ('FONTNAME', (0, 1), (-1, -1), self.font_family),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            
            # Цветовое кодирование строк
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.gray_light]),
            
            # Выделение итоговой строки
            ('FONTNAME', (0, -1), (-1, -1), f'{self.font_family}-Bold'),
            ('BACKGROUND', (0, -1), (-1, -1), self.accent_color),
            ('TEXTCOLOR', (0, -1), (-1, -1), white),
            
            ('GRID', (0, 0), (-1, -1), 1, self.gray_medium),
        ]))
        
        elements.append(sections_table)
        elements.append(Spacer(1, 0.4*inch))
        
        # Финансовая сводка на основе business_analysis
        elements.append(Paragraph("Финансовая сводка", self.styles['SectionHeader']))
        
        # Извлекаем данные из анализа
        cost_analysis = business_analysis.get('cost_analysis', {})
        timeline_analysis = business_analysis.get('timeline_analysis', {})
        
        # Извлекаем summary данные КП
        company_name = data.get('company_name', 'Не определено')
        tech_stack = data.get('tech_stack', 'Не указано')
        pricing = data.get('pricing', 'Не указано')
        timeline = data.get('timeline', 'Не указано')
        
        financial_data = [
            ['Компания:', company_name],
            ['Технологии:', tech_stack],
            ['Стоимость:', pricing],
            ['Сроки:', timeline],
        ]
        
        # Добавляем анализ стоимости если есть
        total_cost = cost_analysis.get('total_cost', 0)
        if total_cost > 0:
            competitiveness = cost_analysis.get('competitiveness', 'unknown')
            comp_text = {
                "competitive": "Конкурентная",
                "market_rate": "Рыночная", 
                "premium": "Премиум",
                "unknown": "Требует анализа"
            }
            financial_data.append(['Конкурентоспособность:', comp_text.get(competitiveness, competitiveness)])
            
            cost_per_day = cost_analysis.get('cost_per_day', 0)
            if cost_per_day > 0:
                financial_data.append(['Стоимость за день:', f'{cost_per_day:,.0f} руб./день'])
        
        # Добавляем анализ сроков
        proposed_timeline = timeline_analysis.get('proposed_timeline', 0)
        if proposed_timeline > 0:
            realism = timeline_analysis.get('realism_assessment', 'unknown')
            realism_text = {
                "realistic": "Реалистичные",
                "questionable": "Сомнительные"
            }
            financial_data.append(['Реалистичность сроков:', realism_text.get(realism, 'Требует оценки')])
        
        financial_table = Table(financial_data, colWidths=[6*cm, 8*cm])
        financial_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), self.font_family),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), self.primary_color),
            ('FONTNAME', (0, 0), (0, -1), f'{self.font_family}-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [white, self.gray_light]),
            ('GRID', (0, 0), (-1, -1), 1, self.gray_medium),
        ]))
        
        elements.append(financial_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Ключевые выводы на основе recommendations и business_analysis
        elements.append(Paragraph("Ключевые выводы", self.styles['SectionHeader']))
        
        # Получаем рекомендации из данных
        recommendations = data.get('recommendations', [])
        identified_issues = business_analysis.get('identified_issues', [])
        
        # Разделяем на положительные и проблемные
        positive_recs = [r for r in recommendations if r.get("type") == "positive"]
        warning_recs = [r for r in recommendations if r.get("type") in ["warning", "danger"]]
        
        if positive_recs:
            elements.append(Paragraph("✅ <b>Сильные стороны:</b>", self.styles['SubHeader']))
            for rec in positive_recs[:5]:  # Максимум 5 пунктов
                title = rec.get('title', '')
                desc = rec.get('description', '')
                text = f"{title}: {desc}" if desc else title
                elements.append(Paragraph(f"• {text}", self.styles['NormalText']))
        else:
            # Fallback на основе оценок критериев
            high_scoring_criteria = [(k, v) for k, v in criteria_scores.items() if v >= 80]
            if high_scoring_criteria:
                elements.append(Paragraph("✅ <b>Сильные стороны:</b>", self.styles['SubHeader']))
                criteria_names = {
                    'technical_compliance': 'Высокое техническое соответствие',
                    'functional_completeness': 'Полное функциональное покрытие',
                    'cost_effectiveness': 'Экономически эффективное предложение',
                    'vendor_reliability': 'Надежный поставщик'
                }
                for criteria, score in high_scoring_criteria[:3]:
                    name = criteria_names.get(criteria, criteria)
                    elements.append(Paragraph(f"• {name} ({score}/100)", self.styles['NormalText']))
        
        if warning_recs or identified_issues:
            elements.append(Paragraph("⚠️ <b>Проблемные вопросы:</b>", self.styles['SubHeader']))
            
            # Добавляем предупреждения из recommendations
            for rec in warning_recs[:3]:  # Максимум 3 пункта
                title = rec.get('title', '')
                desc = rec.get('description', '')
                text = f"{title}: {desc}" if desc else title
                elements.append(Paragraph(f"• {text}", self.styles['NormalText']))
            
            # Добавляем выявленные проблемы
            for issue in identified_issues[:5-len(warning_recs)]:  # Всего максимум 5 пунктов
                elements.append(Paragraph(f"• {issue}", self.styles['NormalText']))
        
        # Итоговая рекомендация
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph("Итоговая рекомендация", self.styles['SectionHeader']))
        
        final_recommendation = data.get('final_recommendation', 'conditional_accept')
        executive_summary = data.get('executive_summary', 'Детальный анализ завершен.')
        
        recommendation_text = self._format_recommendation(final_recommendation)
        
        elements.append(Paragraph(
            f"<b>{recommendation_text}</b>",
            ParagraphStyle(
                name='RecommendationTitle',
                fontName=f'{self.font_family}-Bold',
                fontSize=12,
                textColor=self._get_recommendation_color(final_recommendation),
                spaceBefore=10,
                spaceAfter=10
            )
        ))
        
        elements.append(Paragraph(executive_summary, self.styles['NormalText']))
        
        return elements
    
    def _create_detailed_sections(self, data: Dict[str, Any]) -> List[Any]:
        """Создание детальных разделов анализа"""
        elements = []
        
        elements.append(PageBreak())
        elements.append(Paragraph("ДЕТАЛЬНЫЙ АНАЛИЗ ПО РАЗДЕЛАМ", self.styles['MainTitle']))
        elements.append(Spacer(1, 0.3*inch))
        
        section_mapping = {
            'budget_compliance': 'Бюджетное соответствие',
            'timeline_compliance': 'Временные рамки',
            'technical_compliance': 'Техническое соответствие',
            'team_expertise': 'Команда и экспертиза',
            'functional_coverage': 'Функциональное покрытие',
            'security_quality': 'Безопасность и качество',
            'methodology_processes': 'Методология и процессы',
            'scalability_support': 'Масштабируемость и поддержка',
            'communication_reporting': 'Коммуникации и отчетность',
            'additional_value': 'Дополнительная ценность'
        }
        
        for i, (section_key, section_title) in enumerate(section_mapping.items()):
            if i > 0 and i % 3 == 0:  # Новая страница каждые 3 раздела
                elements.append(PageBreak())
            
            section_data = data.get(section_key, {})
            elements.extend(self._create_section_detail(section_title, section_data))
            elements.append(Spacer(1, 0.4*inch))
        
        return elements
    
    def _create_section_detail(self, title: str, section_data: Dict[str, Any]) -> List[Any]:
        """Создание детального описания раздела"""
        elements = []
        
        score = section_data.get('score', 0)
        description = section_data.get('description', 'Описание раздела отсутствует.')
        key_findings = section_data.get('key_findings', [])
        recommendations = section_data.get('recommendations', [])
        risk_level = section_data.get('risk_level', 'medium')
        
        # Заголовок раздела с оценкой
        score_color = self._get_status_color(score)
        
        header_table = Table([
            [title, f'{score}/100', self._get_score_status(score)]
        ], colWidths=[10*cm, 2*cm, 3*cm])
        
        header_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), f'{self.font_family}-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (-1, -1), self.primary_color),
            ('TEXTCOLOR', (0, 0), (-1, -1), white),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, self.primary_color),
        ]))
        
        elements.append(header_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Описание
        elements.append(Paragraph(description, self.styles['NormalText']))
        elements.append(Spacer(1, 0.15*inch))
        
        # Ключевые находки и рекомендации в две колонки
        if key_findings or recommendations:
            table_data = []
            max_rows = max(len(key_findings), len(recommendations))
            
            # Заголовки
            table_data.append(['🔍 Ключевые находки', '💡 Рекомендации'])
            
            # Данные
            for i in range(max_rows):
                finding = key_findings[i] if i < len(key_findings) else ''
                recommendation = recommendations[i] if i < len(recommendations) else ''
                table_data.append([
                    f'• {finding}' if finding else '',
                    f'• {recommendation}' if recommendation else ''
                ])
            
            detail_table = Table(table_data, colWidths=[7.5*cm, 7.5*cm])
            detail_table.setStyle(TableStyle([
                # Заголовки
                ('FONTNAME', (0, 0), (-1, 0), f'{self.font_family}-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BACKGROUND', (0, 0), (-1, 0), self.gray_light),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.gray_dark),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                
                # Данные
                ('FONTNAME', (0, 1), (-1, -1), self.font_family),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 1), (-1, -1), 5),
                ('RIGHTPADDING', (0, 1), (-1, -1), 5),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                
                ('GRID', (0, 0), (-1, -1), 1, self.gray_medium),
            ]))
            
            elements.append(detail_table)
        
        # Индикатор риска
        risk_colors = {
            'low': self.success_color,
            'medium': self.warning_color,
            'high': self.danger_color
        }
        risk_labels = {
            'low': 'Низкий риск',
            'medium': 'Средний риск',
            'high': 'Высокий риск'
        }
        
        risk_color = risk_colors.get(risk_level, self.warning_color)
        risk_label = risk_labels.get(risk_level, 'Средний риск')
        
        elements.append(Spacer(1, 0.1*inch))
        elements.append(Paragraph(
            f"🎯 <b>Уровень риска: {risk_label}</b>",
            ParagraphStyle(
                name='RiskLevel',
                fontName=f'{self.font_family}-Bold',
                fontSize=10,
                textColor=risk_color,
                alignment=TA_RIGHT
            )
        ))
        
        return elements
    
    def _create_financial_section(self, data: Dict[str, Any]) -> List[Any]:
        """Создание раздела финансового анализа"""
        elements = []
        
        elements.append(Paragraph("ФИНАНСОВЫЙ АНАЛИЗ", self.styles['MainTitle']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Валютная информация
        primary_currency = data.get('primary_currency', {})
        currencies_detected = data.get('currencies_detected', [])
        
        currency_data = [
            ['Параметр', 'Значение']
        ]
        
        if primary_currency:
            currency_data.append([
                'Основная валюта',
                f"{primary_currency.get('name', 'Неизвестно')} ({primary_currency.get('symbol', '?')})"
            ])
        
        currency_data.append(['Обнаружено валют', str(len(currencies_detected))])
        
        if currencies_detected:
            currency_list = ', '.join([
                f"{curr.get('symbol', '?')} ({curr.get('code', 'N/A')})" 
                for curr in currencies_detected[:5]  # Максимум 5 валют
            ])
            currency_data.append(['Список валют', currency_list])
        
        currency_table = Table(currency_data, colWidths=[6*cm, 9*cm])
        currency_table.setStyle(TableStyle([
            # Заголовок
            ('FONTNAME', (0, 0), (-1, 0), f'{self.font_family}-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BACKGROUND', (0, 0), (-1, 0), self.primary_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Данные
            ('FONTNAME', (0, 1), (-1, -1), self.font_family),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 1), (0, -1), self.primary_color),
            ('FONTNAME', (0, 1), (0, -1), f'{self.font_family}-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.gray_light]),
            ('GRID', (0, 0), (-1, -1), 1, self.gray_medium),
        ]))
        
        elements.append(currency_table)
        elements.append(Spacer(1, 0.4*inch))
        
        # Информация о модели анализа
        model_used = data.get('model_used', 'claude-3-5-sonnet-20241022')
        confidence_level = data.get('confidence_level', 85)
        analysis_duration = data.get('analysis_duration', 30)
        
        analysis_info = [
            ['Параметр анализа', 'Значение'],
            ['AI Модель', model_used],
            ['Уровень уверенности', f'{confidence_level}%'],
            ['Время анализа', f'{analysis_duration} секунд'],
            ['Версия анализатора', data.get('analysis_version', '2.0')]
        ]
        
        info_table = Table(analysis_info, colWidths=[6*cm, 9*cm])
        info_table.setStyle(TableStyle([
            # Заголовок
            ('FONTNAME', (0, 0), (-1, 0), f'{self.font_family}-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BACKGROUND', (0, 0), (-1, 0), self.accent_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Данные
            ('FONTNAME', (0, 1), (-1, -1), self.font_family),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 1), (0, -1), self.accent_color),
            ('FONTNAME', (0, 1), (0, -1), f'{self.font_family}-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.gray_light]),
            ('GRID', (0, 0), (-1, -1), 1, self.gray_medium),
        ]))
        
        elements.append(info_table)
        
        return elements
    
    def _create_recommendations(self, data: Dict[str, Any]) -> List[Any]:
        """Создание раздела рекомендаций"""
        elements = []
        
        elements.append(Paragraph("РЕКОМЕНДАЦИИ И СЛЕДУЮЩИЕ ШАГИ", self.styles['MainTitle']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Следующие шаги
        next_steps = data.get('next_steps', [])
        if next_steps:
            elements.append(Paragraph("Рекомендуемые следующие шаги:", self.styles['SectionHeader']))
            
            for i, step in enumerate(next_steps, 1):
                elements.append(Paragraph(
                    f"{i}. {step}",
                    ParagraphStyle(
                        name='StepText',
                        fontName=self.font_family,
                        fontSize=11,
                        textColor=self.gray_dark,
                        spaceBefore=5,
                        spaceAfter=5,
                        leftIndent=20
                    )
                ))
        
        elements.append(Spacer(1, 0.3*inch))
        
        # Итоговое заключение
        final_recommendation = data.get('final_recommendation', 'conditional_accept')
        executive_summary = data.get('executive_summary', '')
        
        elements.append(Paragraph("Итоговое заключение эксперта:", self.styles['SectionHeader']))
        
        recommendation_text = self._format_recommendation(final_recommendation)
        recommendation_color = self._get_recommendation_color(final_recommendation)
        
        elements.append(Paragraph(
            f"<b>{recommendation_text}</b>",
            ParagraphStyle(
                name='FinalRecommendation',
                fontName=f'{self.font_family}-Bold',
                fontSize=14,
                textColor=recommendation_color,
                spaceBefore=15,
                spaceAfter=15,
                alignment=TA_CENTER
            )
        ))
        
        if executive_summary:
            elements.append(Paragraph(executive_summary, self.styles['NormalText']))
        
        return elements
    
    def _create_appendices(self, data: Dict[str, Any]) -> List[Any]:
        """Создание приложений"""
        elements = []
        
        elements.append(PageBreak())
        elements.append(Paragraph("ПРИЛОЖЕНИЯ", self.styles['MainTitle']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Методология анализа
        elements.append(Paragraph("Методология анализа", self.styles['SectionHeader']))
        elements.append(Paragraph(
            "Анализ коммерческого предложения выполнен с использованием искусственного интеллекта "
            f"Claude 3.5 Sonnet и системы DevAssist Pro v2. Анализ включает 10 основных разделов: "
            "бюджетное соответствие, временные рамки, техническое соответствие, команда и экспертиза, "
            "функциональное покрытие, безопасность и качество, методология и процессы, "
            "масштабируемость и поддержка, коммуникации и отчетность, дополнительная ценность.",
            self.styles['NormalText']
        ))
        
        elements.append(Spacer(1, 0.2*inch))
        
        # Контактная информация
        elements.append(Paragraph("Контактная информация", self.styles['SectionHeader']))
        
        contact_data = [
            ['DevAssist Pro', 'Система анализа коммерческих предложений'],
            ['Веб-сайт', 'www.devassist.pro'],
            ['Поддержка', 'support@devassist.pro'],
            ['Дата отчета', datetime.now().strftime('%d.%m.%Y %H:%M:%S')],
        ]
        
        contact_table = Table(contact_data, colWidths=[4*cm, 11*cm])
        contact_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), self.font_family),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), self.primary_color),
            ('FONTNAME', (0, 0), (0, -1), f'{self.font_family}-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [white, self.gray_light]),
            ('GRID', (0, 0), (-1, -1), 1, self.gray_medium),
        ]))
        
        elements.append(contact_table)
        
        return elements
    
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
    
    def _get_status_color(self, score: int) -> HexColor:
        """Получение цвета статуса по баллам"""
        if score >= 85:
            return self.success_color
        elif score >= 70:
            return self.success_color
        elif score >= 55:
            return self.warning_color
        elif score >= 40:
            return self.warning_color
        else:
            return self.danger_color
    
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

    def format_currency(self, amount: Union[float, int], currency_code: str = 'RUB') -> str:
        """Форматирование валюты с поддержкой кириллицы"""
        if amount == 0 or amount is None:
            return 'Не указано'
        
        # Форматирование с разделителями тысяч
        formatted_amount = f"{amount:,.0f}".replace(',', ' ')
        
        # Валютные символы и названия
        currency_formats = {
            'RUB': f"{formatted_amount} ₽",
            'USD': f"${formatted_amount}",
            'EUR': f"€{formatted_amount}",
            'KZT': f"{formatted_amount} ₸",
            'UAH': f"{formatted_amount} ₴",
            'BYN': f"{formatted_amount} Br",
            'KGS': f"{formatted_amount} сом"
        }
        
        return currency_formats.get(currency_code, f"{formatted_amount} {currency_code}")


    def _download_dejavu_fonts(self, fonts_dir: Path):
        """КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Автоматическое скачивание DejaVu шрифтов"""
        logger.info("📥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Скачиваем DejaVu шрифты...")
        
        # URL для скачивания DejaVu шрифтов
        dejavu_urls = {
            "DejaVuSans.ttf": "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans.ttf",
            "DejaVuSans-Bold.ttf": "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans-Bold.ttf"
        }
        
        import urllib.request
        
        for font_file, url in dejavu_urls.items():
            font_path = fonts_dir / font_file
            
            if font_path.exists() and font_path.stat().st_size > 50000:
                logger.info(f"✅ Шрифт уже существует: {font_file}")
                continue
                
            try:
                logger.info(f"📥 Скачиваем: {font_file}")
                
                # Скачиваем с заголовками
                request = urllib.request.Request(url, headers={
                    'User-Agent': 'DevAssist-Pro-PDF-Exporter/2.0'
                })
                
                with urllib.request.urlopen(request, timeout=30) as response:
                    font_data = response.read()
                
                # Сохраняем файл
                with open(font_path, 'wb') as f:
                    f.write(font_data)
                
                if font_path.exists() and font_path.stat().st_size > 50000:
                    logger.info(f"✅ УСПЕШНО скачан: {font_file} ({font_path.stat().st_size} байт)")
                else:
                    logger.error(f"❌ Некорректный размер файла: {font_file}")
                    
            except Exception as e:
                logger.error(f"❌ ОШИБКА скачивания {font_file}: {e}")
    
    def _use_fallback_font(self) -> str:
        """Fallback шрифт для кириллицы когда DejaVu недоступен"""
        logger.warning("⚠️ ИСПОЛЬЗУЕМ FALLBACK для кириллицы...")
        
        try:
            import platform
            
            # Пробуем найти системные шрифты с кириллицей
            if platform.system() == "Windows":
                try:
                    # Windows - Arial
                    pdfmetrics.registerFont(TTFont('SystemCyrillic', 'C:/Windows/Fonts/arial.ttf'))
                    logger.info("✅ Windows Arial зарегистрирован для кириллицы")
                    return 'SystemCyrillic'
                except:
                    pass
                    
            elif platform.system() == "Linux":
                # Linux - Liberation Sans или DejaVu
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
            
            # Последний fallback - Helvetica с предупреждением
            logger.warning("⚠️ ВНИМАНИЕ: Используем Helvetica, кириллица может отображаться неправильно")
            return 'Helvetica'
            
        except Exception as e:
            logger.error(f"❌ Ошибка fallback: {e}")
            return 'Helvetica'


# Singleton instance
kp_pdf_exporter = KPAnalysisPDFExporter()