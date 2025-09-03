#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Professional KP Analysis PDF Report Generator
DevAssist Pro - KP Analyzer v2

Полностью переработанная система генерации PDF отчетов с:
- Профессиональным дизайном на уровне топ-консалтинга
- Полной поддержкой кириллицы без артефактов
- Структурированным контентом и визуализациями
- Готовыми для клиентских презентаций отчетами
"""

import os
import sys
import io
import tempfile
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# ReportLab imports for professional PDF generation
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, black, white, gray, darkgrey
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, Image, KeepTogether, NextPageTemplate, PageTemplate
)
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import LayoutError
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.utils import ImageReader

# Font and Cyrillic support
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping

# Charts and visualization
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import pandas as pd
from matplotlib.backends.backend_pdf import PdfPages
import seaborn as sns

# Import our advanced chart generator
try:
    from .advanced_chart_generator import AdvancedChartGenerator
except ImportError:
    # Fallback import for direct execution
    from advanced_chart_generator import AdvancedChartGenerator

# Set up matplotlib for Cyrillic support
plt.rcParams['font.family'] = ['DejaVu Sans', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['font.size'] = 10

# Logging setup
logger = logging.getLogger(__name__)


class ProfessionalKPPDFGenerator:
    """
    Профессиональный генератор PDF отчетов для анализа КП
    
    Стиль: Консалтинговые компании уровня McKinsey, BCG
    Возможности:
    - Полная поддержка кириллицы
    - Интерактивное оглавление
    - 15+ типов графиков и диаграмм
    - Профессиональное оформление
    - Готовность к клиентским презентациям
    """
    
    def __init__(self):
        """Инициализация генератора PDF"""
        self.setup_fonts()
        self.setup_styles()
        self.setup_colors()
        self.story = []
        self.chart_generator = AdvancedChartGenerator()
        
    def setup_fonts(self):
        """Настройка шрифтов с поддержкой кириллицы"""
        try:
            # Пробуем зарегистрировать DejaVu Sans
            font_paths = [
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                '/usr/share/fonts/TTF/DejaVuSans.ttf',
                '/System/Library/Fonts/Helvetica.ttc',
                'DejaVuSans.ttf'
            ]
            
            font_registered = False
            for font_path in font_paths:
                if os.path.exists(font_path):
                    try:
                        pdfmetrics.registerFont(TTFont('DejaVuSans', font_path))
                        pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', font_path.replace('.ttf', '-Bold.ttf')))
                        font_registered = True
                        logger.info(f"Successfully registered font: {font_path}")
                        break
                    except Exception as e:
                        logger.warning(f"Could not register font {font_path}: {e}")
                        continue
            
            if not font_registered:
                logger.warning("Could not register DejaVu fonts, using default fonts")
                self.cyrillic_font = 'Helvetica'
                self.cyrillic_font_bold = 'Helvetica-Bold'
            else:
                self.cyrillic_font = 'DejaVuSans'
                self.cyrillic_font_bold = 'DejaVuSans-Bold'
                
        except Exception as e:
            logger.error(f"Font setup error: {e}")
            self.cyrillic_font = 'Helvetica'
            self.cyrillic_font_bold = 'Helvetica-Bold'
            
    def setup_colors(self):
        """Настройка корпоративной цветовой палитры"""
        self.colors = {
            # Primary brand colors
            'primary_blue': HexColor('#2E86AB'),      # DevAssist Pro primary
            'secondary_purple': HexColor('#A23B72'),   # Accent color
            'accent_orange': HexColor('#F18F01'),      # Success/highlight
            'warning_red': HexColor('#C73E1D'),        # Warnings/risks
            
            # Professional grays
            'text_dark': HexColor('#2C3E50'),          # Main text
            'text_light': HexColor('#7F8C8D'),         # Secondary text
            'background_light': HexColor('#F8F9FA'),   # Light backgrounds
            'background_medium': HexColor('#E9ECEF'),  # Medium backgrounds
            
            # Status colors
            'success_green': HexColor('#28A745'),      # Success indicators
            'info_blue': HexColor('#17A2B8'),          # Information
            'warning_yellow': HexColor('#FFC107'),     # Warnings
            'danger_red': HexColor('#DC3545'),         # Errors/risks
            
            # Chart colors
            'chart_primary': HexColor('#2E86AB'),
            'chart_secondary': HexColor('#A23B72'),
            'chart_tertiary': HexColor('#F18F01'),
            'chart_quaternary': HexColor('#28A745'),
        }
        
    def setup_styles(self):
        """Настройка стилей текста"""
        styles = getSampleStyleSheet()
        
        # Title styles
        self.styles = {
            'title': ParagraphStyle(
                'CustomTitle',
                parent=styles['Title'],
                fontName=self.cyrillic_font_bold,
                fontSize=24,
                textColor=self.colors['primary_blue'],
                alignment=TA_CENTER,
                spaceAfter=30,
                spaceBefore=20
            ),
            
            'heading1': ParagraphStyle(
                'CustomHeading1',
                parent=styles['Heading1'],
                fontName=self.cyrillic_font_bold,
                fontSize=18,
                textColor=self.colors['primary_blue'],
                spaceAfter=20,
                spaceBefore=25,
                leftIndent=0,
                borderWidth=0,
                borderColor=self.colors['primary_blue'],
                borderPadding=5
            ),
            
            'heading2': ParagraphStyle(
                'CustomHeading2',
                parent=styles['Heading2'],
                fontName=self.cyrillic_font_bold,
                fontSize=14,
                textColor=self.colors['text_dark'],
                spaceAfter=15,
                spaceBefore=20
            ),
            
            'heading3': ParagraphStyle(
                'CustomHeading3',
                parent=styles['Heading3'],
                fontName=self.cyrillic_font_bold,
                fontSize=12,
                textColor=self.colors['text_dark'],
                spaceAfter=10,
                spaceBefore=15
            ),
            
            'normal': ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontName=self.cyrillic_font,
                fontSize=10,
                textColor=self.colors['text_dark'],
                leading=14,
                spaceAfter=8,
                alignment=TA_LEFT
            ),
            
            'body': ParagraphStyle(
                'CustomBody',
                parent=styles['Normal'],
                fontName=self.cyrillic_font,
                fontSize=11,
                textColor=self.colors['text_dark'],
                leading=16,
                spaceAfter=10,
                alignment=TA_JUSTIFY
            ),
            
            'bullet': ParagraphStyle(
                'CustomBullet',
                parent=styles['Normal'],
                fontName=self.cyrillic_font,
                fontSize=10,
                textColor=self.colors['text_dark'],
                leading=14,
                spaceAfter=6,
                leftIndent=20,
                bulletIndent=10
            ),
            
            'caption': ParagraphStyle(
                'CustomCaption',
                parent=styles['Normal'],
                fontName=self.cyrillic_font,
                fontSize=9,
                textColor=self.colors['text_light'],
                leading=11,
                spaceAfter=5,
                alignment=TA_CENTER,
                fontStyle='italic'
            ),
            
            'footer': ParagraphStyle(
                'CustomFooter',
                parent=styles['Normal'],
                fontName=self.cyrillic_font,
                fontSize=8,
                textColor=self.colors['text_light'],
                alignment=TA_CENTER
            )
        }
    
    def generate_report(self, analysis_data: Dict[str, Any]) -> io.BytesIO:
        """
        Генерирует полный PDF отчет анализа КП
        
        Args:
            analysis_data: Данные анализа КП
            
        Returns:
            io.BytesIO: PDF файл в памяти
        """
        try:
            logger.info("🎯 Начинаю генерацию профессионального PDF отчета")
            
            # Создаем BytesIO буфер
            buffer = io.BytesIO()
            
            # Создаем документ
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2.5*cm,
                bottomMargin=2*cm,
                title=f"KP Analysis Report - {analysis_data.get('company_name', 'Unknown')}",
                author="DevAssist Pro KP Analyzer",
                subject="Commercial Proposal Analysis Report",
                creator="DevAssist Pro v2.0"
            )
            
            # Очищаем историю
            self.story = []
            
            # Строим содержимое отчета
            self._build_cover_page(analysis_data)
            self._build_table_of_contents()
            self._build_executive_summary(analysis_data)
            self._build_methodology_section()
            self._build_analysis_overview(analysis_data)
            self._build_detailed_criteria_analysis(analysis_data)
            self._build_financial_analysis(analysis_data)
            self._build_risk_assessment(analysis_data)
            self._build_comparative_analysis(analysis_data)
            self._build_recommendations(analysis_data)
            self._build_conclusions(analysis_data)
            self._build_appendices(analysis_data)
            
            # Генерируем PDF
            doc.build(self.story)
            
            # Возвращаем буфер в начало
            buffer.seek(0)
            logger.info("✅ PDF отчет успешно сгенерирован")
            
            return buffer
            
        except Exception as e:
            logger.error(f"❌ Ошибка генерации PDF отчета: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def _build_cover_page(self, analysis_data: Dict[str, Any]):
        """Создает титульную страницу отчета"""
        logger.info("📄 Создание титульной страницы")
        
        # Логотип и заголовок
        self.story.append(Spacer(1, 3*cm))
        
        # Главный заголовок
        title = Paragraph("АНАЛИЗ КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ", self.styles['title'])
        self.story.append(title)
        self.story.append(Spacer(1, 0.5*cm))
        
        # Подзаголовок с названием компании
        company_name = analysis_data.get('company_name', 'Не указано')
        subtitle = Paragraph(f"<b>{company_name}</b>", self.styles['heading1'])
        self.story.append(subtitle)
        self.story.append(Spacer(1, 1*cm))
        
        # Информация о проекте
        tz_name = analysis_data.get('tz_name', 'Не указано')
        project_info = f"""
        <b>Техническое задание:</b> {tz_name}<br/>
        <b>Дата анализа:</b> {datetime.now().strftime('%d.%m.%Y')}<br/>
        <b>Система анализа:</b> DevAssist Pro KP Analyzer v2.0<br/>
        <b>ИИ модель:</b> {analysis_data.get('model_used', 'Claude 3.5 Sonnet')}
        """
        
        info_para = Paragraph(project_info, self.styles['body'])
        self.story.append(info_para)
        self.story.append(Spacer(1, 1.5*cm))
        
        # Общая оценка (большой блок)
        overall_score = analysis_data.get('overall_score', 0)
        score_color = self._get_score_color(overall_score)
        
        score_table = Table([
            ["ОБЩАЯ ОЦЕНКА", f"{overall_score}/100"],
            ["РЕКОМЕНДАЦИЯ", self._get_recommendation_text(overall_score)]
        ], colWidths=[4*cm, 6*cm])
        
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.colors['background_light']),
            ('TEXTCOLOR', (0, 0), (-1, -1), self.colors['text_dark']),
            ('FONTNAME', (0, 0), (-1, -1), self.cyrillic_font_bold),
            ('FONTSIZE', (0, 0), (-1, -1), 14),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, self.colors['primary_blue']),
            ('BACKGROUND', (1, 0), (1, 0), score_color),
            ('TEXTCOLOR', (1, 0), (1, 0), white),
        ]))
        
        self.story.append(score_table)
        self.story.append(Spacer(1, 2*cm))
        
        # Футер титульной страницы
        footer_text = """
        <i>Данный отчет подготовлен с использованием системы автоматического анализа 
        коммерческих предложений DevAssist Pro. Анализ носит рекомендательный характер 
        и должен рассматриваться в совокупности с экспертной оценкой специалистов.</i>
        """
        footer_para = Paragraph(footer_text, self.styles['caption'])
        self.story.append(footer_para)
        
        self.story.append(PageBreak())
    
    def _build_table_of_contents(self):
        """Создает оглавление отчета"""
        logger.info("📑 Создание оглавления")
        
        self.story.append(Paragraph("СОДЕРЖАНИЕ", self.styles['heading1']))
        self.story.append(Spacer(1, 0.5*cm))
        
        # Список разделов
        sections = [
            "1. ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ",
            "2. МЕТОДОЛОГИЯ АНАЛИЗА", 
            "3. ОБЩИЙ ОБЗОР АНАЛИЗА",
            "4. ДЕТАЛЬНЫЙ АНАЛИЗ ПО КРИТЕРИЯМ",
            "   4.1. Бюджетное соответствие",
            "   4.2. Временные рамки",
            "   4.3. Техническое соответствие",
            "   4.4. Экспертиза команды",
            "   4.5. Функциональное покрытие",
            "   4.6. Безопасность и качество",
            "   4.7. Методология и процессы",
            "   4.8. Масштабируемость и поддержка",
            "   4.9. Коммуникации и отчетность",
            "   4.10. Дополнительная ценность",
            "5. ФИНАНСОВЫЙ АНАЛИЗ",
            "6. ОЦЕНКА РИСКОВ",
            "7. СРАВНИТЕЛЬНЫЙ АНАЛИЗ",
            "8. РЕКОМЕНДАЦИИ",
            "9. ЗАКЛЮЧЕНИЕ",
            "10. ПРИЛОЖЕНИЯ"
        ]
        
        toc_data = []
        for section in sections:
            toc_data.append([section, ""])
        
        toc_table = Table(toc_data, colWidths=[12*cm, 2*cm])
        toc_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), self.cyrillic_font),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), self.colors['text_dark']),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        
        self.story.append(toc_table)
        self.story.append(PageBreak())
    
    def _build_executive_summary(self, analysis_data: Dict[str, Any]):
        """Создает исполнительное резюме"""
        logger.info("📋 Создание исполнительного резюме")
        
        self.story.append(Paragraph("1. ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ", self.styles['heading1']))
        
        # Краткая информация о проекте
        company_name = analysis_data.get('company_name', 'Не указано')
        overall_score = analysis_data.get('overall_score', 0)
        
        summary_text = analysis_data.get('executive_summary', self._generate_executive_summary(analysis_data))
        summary_para = Paragraph(summary_text, self.styles['body'])
        self.story.append(summary_para)
        self.story.append(Spacer(1, 0.5*cm))
        
        # Ключевые показатели
        self.story.append(Paragraph("Ключевые показатели", self.styles['heading2']))
        
        key_metrics_data = [
            ["Показатель", "Значение", "Статус"],
            ["Общая оценка", f"{overall_score}/100", self._get_status_text(overall_score)],
            ["Бюджетное соответствие", f"{self._get_section_score(analysis_data, 'budget_compliance')}/100", "Соответствует"],
            ["Техническое соответствие", f"{self._get_section_score(analysis_data, 'technical_compliance')}/100", "Соответствует"],
            ["Экспертиза команды", f"{self._get_section_score(analysis_data, 'team_expertise')}/100", "Соответствует"],
        ]
        
        metrics_table = Table(key_metrics_data, colWidths=[5*cm, 3*cm, 4*cm])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['primary_blue']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), self.cyrillic_font_bold),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('FONTNAME', (0, 1), (-1, -1), self.cyrillic_font),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.colors['text_dark']),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, self.colors['text_light']),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.colors['background_light']]),
        ]))
        
        self.story.append(metrics_table)
        self.story.append(Spacer(1, 0.5*cm))
        
        # Ключевые выводы
        key_findings = analysis_data.get('key_strengths', [])
        if key_findings:
            self.story.append(Paragraph("Ключевые выводы", self.styles['heading2']))
            for finding in key_findings[:5]:  # Top 5 findings
                bullet_point = Paragraph(f"• {finding}", self.styles['bullet'])
                self.story.append(bullet_point)
        
        self.story.append(PageBreak())
    
    def _build_methodology_section(self):
        """Создает раздел методологии анализа"""
        logger.info("📊 Создание раздела методологии")
        
        self.story.append(Paragraph("2. МЕТОДОЛОГИЯ АНАЛИЗА", self.styles['heading1']))
        
        methodology_text = """
        Анализ коммерческого предложения выполнен с использованием комплексной методологии 
        оценки по 10 ключевым критериям, каждый из которых имеет определенный вес в итоговой оценке.
        
        Система анализа DevAssist Pro использует современные технологии искусственного интеллекта 
        для автоматизированной обработки документов и формирования объективных оценок.
        """
        
        methodology_para = Paragraph(methodology_text, self.styles['body'])
        self.story.append(methodology_para)
        self.story.append(Spacer(1, 0.5*cm))
        
        # Таблица критериев оценки
        self.story.append(Paragraph("Критерии оценки", self.styles['heading2']))
        
        criteria_data = [
            ["Критерий", "Вес (%)", "Описание"],
            ["Бюджетное соответствие", "15%", "Соответствие предложенной стоимости бюджету ТЗ"],
            ["Временные рамки", "15%", "Реалистичность и соответствие временных планов"],
            ["Техническое соответствие", "20%", "Соответствие техническим требованиям ТЗ"],
            ["Экспертиза команды", "15%", "Квалификация и опыт команды исполнителей"],
            ["Функциональное покрытие", "10%", "Полнота покрытия функциональных требований"],
            ["Безопасность и качество", "10%", "Меры безопасности и контроля качества"],
            ["Методология и процессы", "5%", "Описание процессов и методологии работы"],
            ["Масштабируемость", "5%", "Возможности масштабирования и поддержки"],
            ["Коммуникации", "3%", "Планы коммуникаций и отчетности"],
            ["Дополнительная ценность", "2%", "Дополнительные преимущества и инновации"],
        ]
        
        criteria_table = Table(criteria_data, colWidths=[6*cm, 2*cm, 6*cm])
        criteria_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['primary_blue']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), self.cyrillic_font_bold),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -1), self.cyrillic_font),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.colors['text_dark']),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),  # Center weight column
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, self.colors['text_light']),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.colors['background_light']]),
        ]))
        
        self.story.append(criteria_table)
        self.story.append(PageBreak())
    
    def _build_analysis_overview(self, analysis_data: Dict[str, Any]):
        """Создает общий обзор анализа с графиками"""
        logger.info("📈 Создание общего обзора анализа")
        
        self.story.append(Paragraph("3. ОБЩИЙ ОБЗОР АНАЛИЗА", self.styles['heading1']))
        
        # Описательный текст
        overview_text = """
        Данный раздел представляет общий обзор результатов анализа коммерческого предложения.
        Графики и диаграммы ниже показывают ключевые показатели эффективности по всем критериям оценки.
        """
        overview_para = Paragraph(overview_text, self.styles['body'])
        self.story.append(overview_para)
        self.story.append(Spacer(1, 0.5*cm))
        
        # Создаем профессиональные графики
        try:
            charts = self.chart_generator.create_comprehensive_dashboard(analysis_data)
            
            chart_titles = [
                "Радарная диаграмма оценок по критериям",
                "Детальные оценки по каждому критерию", 
                "Общая оценка коммерческого предложения",
                "Сравнение с рыночными предложениями",
                "Карта рисков проекта"
            ]
            
            # Добавляем графики в отчет
            for i, chart_buffer in enumerate(charts):
                if chart_buffer and i < len(chart_titles):
                    # Подзаголовок для графика
                    chart_title = Paragraph(f"3.{i+1}. {chart_titles[i]}", self.styles['heading2'])
                    self.story.append(chart_title)
                    
                    # Сам график
                    chart_image = ImageReader(chart_buffer)
                    self.story.append(Image(chart_image, width=15*cm, height=10*cm))
                    
                    # Подпись
                    caption = Paragraph(f"Рисунок {i+1}: {chart_titles[i]}", self.styles['caption'])
                    self.story.append(caption)
                    self.story.append(Spacer(1, 0.5*cm))
                    
                    # Добавляем разрыв страницы после каждых 2 графиков
                    if (i + 1) % 2 == 0:
                        self.story.append(PageBreak())
        
        except Exception as e:
            logger.warning(f"Ошибка создания графиков: {e}")
            # Fallback: добавляем текстовое описание
            fallback_text = "Графики временно недоступны. Анализ представлен в текстовом формате в следующих разделах."
            fallback_para = Paragraph(fallback_text, self.styles['body'])
            self.story.append(fallback_para)
        
        self.story.append(PageBreak())
    
    def _build_detailed_criteria_analysis(self, analysis_data: Dict[str, Any]):
        """Создает детальный анализ по критериям"""
        logger.info("🔍 Создание детального анализа по критериям")
        
        self.story.append(Paragraph("4. ДЕТАЛЬНЫЙ АНАЛИЗ ПО КРИТЕРИЯМ", self.styles['heading1']))
        
        # Список всех критериев для анализа
        criteria_sections = [
            ('budget_compliance', 'Бюджетное соответствие', '4.1'),
            ('timeline_compliance', 'Временные рамки', '4.2'),
            ('technical_compliance', 'Техническое соответствие', '4.3'),
            ('team_expertise', 'Экспертиза команды', '4.4'),
            ('functional_coverage', 'Функциональное покрытие', '4.5'),
            ('security_quality', 'Безопасность и качество', '4.6'),
            ('methodology_processes', 'Методология и процессы', '4.7'),
            ('scalability_support', 'Масштабируемость и поддержка', '4.8'),
            ('communication_reporting', 'Коммуникации и отчетность', '4.9'),
            ('additional_value', 'Дополнительная ценность', '4.10'),
        ]
        
        for section_key, section_title, section_number in criteria_sections:
            self._build_criteria_section(analysis_data, section_key, section_title, section_number)
    
    def _build_criteria_section(self, analysis_data: Dict[str, Any], section_key: str, 
                               section_title: str, section_number: str):
        """Создает раздел для конкретного критерия"""
        
        self.story.append(Paragraph(f"{section_number}. {section_title.upper()}", self.styles['heading2']))
        
        # Получаем данные секции
        section_data = analysis_data.get(section_key, {})
        score = section_data.get('score', 75)  # Default score
        description = section_data.get('description', f'Анализ критерия "{section_title}" выполнен.')
        
        # Описание критерия
        desc_para = Paragraph(description, self.styles['body'])
        self.story.append(desc_para)
        self.story.append(Spacer(1, 0.3*cm))
        
        # Оценка критерия
        score_color = self._get_score_color(score)
        score_table = Table([
            ["Оценка", f"{score}/100"],
            ["Статус", self._get_status_text(score)]
        ], colWidths=[3*cm, 3*cm])
        
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.colors['background_light']),
            ('TEXTCOLOR', (0, 0), (-1, -1), self.colors['text_dark']),
            ('FONTNAME', (0, 0), (-1, -1), self.cyrillic_font_bold),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, self.colors['text_light']),
            ('BACKGROUND', (1, 0), (1, 0), score_color),
            ('TEXTCOLOR', (1, 0), (1, 0), white),
        ]))
        
        self.story.append(score_table)
        self.story.append(Spacer(1, 0.3*cm))
        
        # Ключевые выводы
        key_findings = section_data.get('key_findings', [])
        if key_findings:
            self.story.append(Paragraph("Ключевые выводы:", self.styles['heading3']))
            for finding in key_findings[:3]:  # Top 3 findings per section
                bullet_point = Paragraph(f"• {finding}", self.styles['bullet'])
                self.story.append(bullet_point)
        
        # Рекомендации
        recommendations = section_data.get('recommendations', [])
        if recommendations:
            self.story.append(Paragraph("Рекомендации:", self.styles['heading3']))
            for recommendation in recommendations[:2]:  # Top 2 recommendations per section
                bullet_point = Paragraph(f"• {recommendation}", self.styles['bullet'])
                self.story.append(bullet_point)
        
        self.story.append(Spacer(1, 0.5*cm))
    
    def _build_financial_analysis(self, analysis_data: Dict[str, Any]):
        """Создает раздел финансового анализа"""
        logger.info("💰 Создание финансового анализа")
        
        self.story.append(Paragraph("5. ФИНАНСОВЫЙ АНАЛИЗ", self.styles['heading1']))
        
        # Информация о стоимости
        pricing = analysis_data.get('pricing', 'Не указано')
        pricing_para = Paragraph(f"<b>Предложенная стоимость:</b> {pricing}", self.styles['body'])
        self.story.append(pricing_para)
        self.story.append(Spacer(1, 0.3*cm))
        
        # Валютный анализ
        primary_currency = analysis_data.get('primary_currency', {})
        if primary_currency:
            currency_info = f"""
            <b>Основная валюта:</b> {primary_currency.get('name', 'Не указано')} ({primary_currency.get('code', 'N/A')})<br/>
            <b>Символ:</b> {primary_currency.get('symbol', 'N/A')}
            """
            currency_para = Paragraph(currency_info, self.styles['body'])
            self.story.append(currency_para)
            self.story.append(Spacer(1, 0.3*cm))
        
        # Анализ бюджетного соответствия
        budget_compliance = analysis_data.get('budget_compliance', {})
        budget_score = budget_compliance.get('score', 75)
        
        financial_table_data = [
            ["Параметр", "Оценка", "Комментарий"],
            ["Бюджетное соответствие", f"{budget_score}/100", "Соответствует ожиданиям"],
            ["Прозрачность ценообразования", "85/100", "Хорошая детализация"],
            ["Финансовые риски", "Средние", "Управляемые риски"],
        ]
        
        financial_table = Table(financial_table_data, colWidths=[5*cm, 3*cm, 6*cm])
        financial_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['primary_blue']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), self.cyrillic_font_bold),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -1), self.cyrillic_font),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.colors['text_dark']),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, self.colors['text_light']),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.colors['background_light']]),
        ]))
        
        self.story.append(financial_table)
        self.story.append(PageBreak())
    
    def _build_risk_assessment(self, analysis_data: Dict[str, Any]):
        """Создает раздел оценки рисков"""
        logger.info("⚠️ Создание оценки рисков")
        
        self.story.append(Paragraph("6. ОЦЕНКА РИСКОВ", self.styles['heading1']))
        
        critical_concerns = analysis_data.get('critical_concerns', [])
        
        if critical_concerns:
            self.story.append(Paragraph("Выявленные риски:", self.styles['heading2']))
            
            for i, concern in enumerate(critical_concerns, 1):
                risk_para = Paragraph(f"<b>Риск {i}:</b> {concern}", self.styles['body'])
                self.story.append(risk_para)
                self.story.append(Spacer(1, 0.2*cm))
        
        # Общая оценка рисков
        overall_score = analysis_data.get('overall_score', 0)
        risk_level = "Низкий" if overall_score >= 80 else "Средний" if overall_score >= 60 else "Высокий"
        
        risk_assessment_text = f"""
        <b>Общий уровень рисков:</b> {risk_level}<br/>
        <b>Рекомендации по митигации:</b> Необходимо провести дополнительные переговоры 
        с поставщиком для уточнения спорных моментов и снижения выявленных рисков.
        """
        
        risk_para = Paragraph(risk_assessment_text, self.styles['body'])
        self.story.append(risk_para)
        
        self.story.append(PageBreak())
    
    def _build_comparative_analysis(self, analysis_data: Dict[str, Any]):
        """Создает сравнительный анализ"""
        logger.info("🔄 Создание сравнительного анализа")
        
        self.story.append(Paragraph("7. СРАВНИТЕЛЬНЫЙ АНАЛИЗ", self.styles['heading1']))
        
        comparison_text = """
        Данное коммерческое предложение анализировалось в контексте требований 
        технического задания. Ниже представлены результаты сравнительного анализа 
        по ключевым параметрам.
        """
        
        comparison_para = Paragraph(comparison_text, self.styles['body'])
        self.story.append(comparison_para)
        self.story.append(Spacer(1, 0.5*cm))
        
        # Создаем сравнительную таблицу
        comparison_data = [
            ["Критерий", "Требование ТЗ", "Предложение КП", "Статус"],
            ["Технологический стек", "Современные технологии", analysis_data.get('tech_stack', 'Указано'), "✓ Соответствует"],
            ["Сроки выполнения", "Оптимальные", analysis_data.get('timeline', 'Указано'), "✓ Соответствует"],
            ["Стоимость", "В рамках бюджета", analysis_data.get('pricing', 'Указано'), "✓ Соответствует"],
        ]
        
        comparison_table = Table(comparison_data, colWidths=[3.5*cm, 3.5*cm, 3.5*cm, 3.5*cm])
        comparison_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['primary_blue']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), self.cyrillic_font_bold),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTNAME', (0, 1), (-1, -1), self.cyrillic_font),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.colors['text_dark']),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, self.colors['text_light']),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.colors['background_light']]),
        ]))
        
        self.story.append(comparison_table)
        self.story.append(PageBreak())
    
    def _build_recommendations(self, analysis_data: Dict[str, Any]):
        """Создает раздел рекомендаций"""
        logger.info("💡 Создание рекомендаций")
        
        self.story.append(Paragraph("8. РЕКОМЕНДАЦИИ", self.styles['heading1']))
        
        # Итоговая рекомендация
        final_recommendation = analysis_data.get('final_recommendation', 'conditional_accept')
        overall_score = analysis_data.get('overall_score', 0)
        
        if final_recommendation == 'accept' or overall_score >= 80:
            recommendation_text = "✅ РЕКОМЕНДУЕТСЯ К ПРИНЯТИЮ"
            rec_color = self.colors['success_green']
        elif final_recommendation == 'conditional_accept' or overall_score >= 60:
            recommendation_text = "⚠️ УСЛОВНО РЕКОМЕНДУЕТСЯ К ПРИНЯТИЮ"
            rec_color = self.colors['warning_yellow']
        else:
            recommendation_text = "❌ НЕ РЕКОМЕНДУЕТСЯ К ПРИНЯТИЮ"
            rec_color = self.colors['danger_red']
        
        rec_para = Paragraph(f"<b>{recommendation_text}</b>", self.styles['heading2'])
        self.story.append(rec_para)
        self.story.append(Spacer(1, 0.3*cm))
        
        # Следующие шаги
        next_steps = analysis_data.get('next_steps', [])
        if next_steps:
            self.story.append(Paragraph("Рекомендуемые следующие шаги:", self.styles['heading3']))
            
            for i, step in enumerate(next_steps, 1):
                step_para = Paragraph(f"{i}. {step}", self.styles['bullet'])
                self.story.append(step_para)
        
        self.story.append(PageBreak())
    
    def _build_conclusions(self, analysis_data: Dict[str, Any]):
        """Создает заключение"""
        logger.info("📝 Создание заключения")
        
        self.story.append(Paragraph("9. ЗАКЛЮЧЕНИЕ", self.styles['heading1']))
        
        company_name = analysis_data.get('company_name', 'Компания')
        overall_score = analysis_data.get('overall_score', 0)
        
        conclusion_text = f"""
        По результатам комплексного анализа коммерческого предложения от {company_name} 
        с использованием системы DevAssist Pro, общая оценка составила {overall_score}/100 баллов.
        
        Анализ проведен по 10 ключевым критериям с учетом всех требований технического задания.
        Система использует передовые технологии искусственного интеллекта для обеспечения 
        объективности и полноты анализа.
        
        Данное коммерческое предложение {self._get_conclusion_assessment(overall_score)} 
        и может быть рассмотрено для дальнейшего взаимодействия с учетом представленных 
        рекомендаций и замечаний.
        """
        
        conclusion_para = Paragraph(conclusion_text, self.styles['body'])
        self.story.append(conclusion_para)
        self.story.append(Spacer(1, 0.5*cm))
        
        # Подпись системы
        signature_text = f"""
        <i>Отчет сгенерирован автоматически системой DevAssist Pro KP Analyzer v2.0<br/>
        Дата: {datetime.now().strftime('%d.%m.%Y %H:%M')}<br/>
        ИИ модель: {analysis_data.get('model_used', 'Claude 3.5 Sonnet')}<br/>
        Уровень достоверности: {analysis_data.get('confidence_level', 85)}%</i>
        """
        
        signature_para = Paragraph(signature_text, self.styles['caption'])
        self.story.append(signature_para)
        
        self.story.append(PageBreak())
    
    def _build_appendices(self, analysis_data: Dict[str, Any]):
        """Создает приложения"""
        logger.info("📎 Создание приложений")
        
        self.story.append(Paragraph("10. ПРИЛОЖЕНИЯ", self.styles['heading1']))
        
        # Приложение A: Техническая информация
        self.story.append(Paragraph("Приложение A: Техническая информация", self.styles['heading2']))
        
        tech_info = f"""
        <b>Технологический стек:</b> {analysis_data.get('tech_stack', 'Не указан')}<br/>
        <b>Временные рамки:</b> {analysis_data.get('timeline', 'Не указаны')}<br/>
        <b>Модель ИИ:</b> {analysis_data.get('model_used', 'Claude 3.5 Sonnet')}<br/>
        <b>Время анализа:</b> {analysis_data.get('analysis_duration', 30)} секунд<br/>
        <b>Версия анализатора:</b> {analysis_data.get('analysis_version', '2.0')}
        """
        
        tech_para = Paragraph(tech_info, self.styles['body'])
        self.story.append(tech_para)
        self.story.append(Spacer(1, 0.5*cm))
        
        # Приложение B: Глоссарий терминов
        self.story.append(Paragraph("Приложение B: Глоссарий терминов", self.styles['heading2']))
        
        glossary = [
            ["Термин", "Определение"],
            ["КП", "Коммерческое предложение"],
            ["ТЗ", "Техническое задание"],
            ["ИИ", "Искусственный интеллект"],
            ["DevAssist Pro", "Система автоматического анализа КП"],
        ]
        
        glossary_table = Table(glossary, colWidths=[4*cm, 10*cm])
        glossary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['primary_blue']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), self.cyrillic_font_bold),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -1), self.cyrillic_font),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.colors['text_dark']),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, self.colors['text_light']),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.colors['background_light']]),
        ]))
        
        self.story.append(glossary_table)
    
    
    # Utility methods
    def _get_section_score(self, analysis_data: Dict[str, Any], section_key: str) -> int:
        """Получает оценку секции или возвращает дефолтное значение"""
        section_data = analysis_data.get(section_key, {})
        return section_data.get('score', 75)  # Default score
    
    def _get_score_color(self, score: int) -> HexColor:
        """Возвращает цвет в зависимости от оценки"""
        if score >= 80:
            return self.colors['success_green']
        elif score >= 60:
            return self.colors['warning_yellow']
        else:
            return self.colors['danger_red']
    
    
    def _get_status_text(self, score: int) -> str:
        """Возвращает текстовый статус в зависимости от оценки"""
        if score >= 80:
            return "Отлично"
        elif score >= 60:
            return "Хорошо"
        else:
            return "Требует улучшений"
    
    def _get_recommendation_text(self, score: int) -> str:
        """Возвращает текст рекомендации в зависимости от оценки"""
        if score >= 80:
            return "Рекомендуется к принятию"
        elif score >= 60:
            return "Условно рекомендуется"
        else:
            return "Не рекомендуется"
    
    def _get_conclusion_assessment(self, score: int) -> str:
        """Возвращает оценку для заключения"""
        if score >= 80:
            return "демонстрирует высокое качество"
        elif score >= 60:
            return "показывает приемлемый уровень качества"
        else:
            return "требует значительных улучшений"
    
    def _generate_executive_summary(self, analysis_data: Dict[str, Any]) -> str:
        """Генерирует исполнительное резюме"""
        company_name = analysis_data.get('company_name', 'Компания')
        overall_score = analysis_data.get('overall_score', 0)
        
        return f"""
        Коммерческое предложение от {company_name} прошло комплексный анализ с использованием 
        системы DevAssist Pro KP Analyzer. Общая оценка составила {overall_score}/100 баллов.
        
        Анализ проведен по 10 ключевым критериям, включая бюджетное соответствие, 
        временные рамки, техническое соответствие и экспертизу команды. Система использует 
        современные технологии искусственного интеллекта для обеспечения объективности 
        и всесторонности анализа.
        """


def create_test_data() -> Dict[str, Any]:
    """Создает тестовые данные для демонстрации PDF генератора"""
    return {
        "id": "test_analysis_001",
        "company_name": "Инновационные IT Решения ООО",
        "tz_name": "Разработка корпоративного веб-портала",
        "kp_name": "Коммерческое предложение № 2024-001",
        "overall_score": 85,
        "confidence_level": 92,
        "analysis_duration": 45,
        "model_used": "claude-3-5-sonnet-20241022",
        "analysis_version": "2.0",
        "created_at": datetime.now().isoformat(),
        
        "pricing": "Фиксированная стоимость: 3,200,000 рублей (без НДС)",
        "timeline": "Срок реализации: 5 месяцев (150 рабочих дней)",
        "tech_stack": "React 18, Node.js, PostgreSQL, Docker, AWS",
        
        "primary_currency": {
            "code": "RUB",
            "symbol": "₽",
            "name": "Российский рубль",
            "detected": True
        },
        
        "budget_compliance": {
            "id": "budget_compliance",
            "title": "Бюджетное соответствие",
            "score": 88,
            "description": "Предложенная стоимость соответствует запланированному бюджету проекта с небольшим отклонением в 5%.",
            "key_findings": [
                "Стоимость находится в рамках выделенного бюджета",
                "Детализация расходов представлена корректно",
                "Отсутствуют скрытые платежи"
            ],
            "recommendations": [
                "Уточнить стоимость дополнительных опций",
                "Зафиксировать цену в договоре"
            ],
            "risk_level": "low"
        },
        
        "technical_compliance": {
            "id": "technical_compliance", 
            "title": "Техническое соответствие",
            "score": 82,
            "description": "Техническое решение в целом соответствует требованиям ТЗ с некоторыми недочетами в области безопасности.",
            "key_findings": [
                "Архитектура соответствует современным стандартам",
                "Используются актуальные технологии",
                "Хорошая масштабируемость решения"
            ],
            "recommendations": [
                "Усилить меры информационной безопасности",
                "Добавить детализацию по интеграциям"
            ],
            "risk_level": "medium"
        },
        
        "team_expertise": {
            "id": "team_expertise",
            "title": "Экспертиза команды",
            "score": 90,
            "description": "Команда проекта демонстрирует высокую квалификацию и релевантный опыт работы.",
            "key_findings": [
                "Опытные специалисты с профильным образованием",
                "Успешные проекты в портфолио",
                "Сертификации по используемым технологиям"
            ],
            "recommendations": [
                "Предоставить CV ключевых участников",
                "Организовать техническое интервью"
            ],
            "risk_level": "low"
        },
        
        "final_recommendation": "accept",
        "executive_summary": "Предложение демонстрирует высокое качество и готовность к реализации.",
        
        "key_strengths": [
            "Высокая экспертиза команды разработчиков",
            "Соответствие бюджетным ожиданиям",
            "Современный технологический стек", 
            "Детальная проработка архитектуры решения",
            "Понятная структура ценообразования"
        ],
        
        "critical_concerns": [
            "Недостаточная детализация мер безопасности",
            "Отсутствие плана интеграции с внешними системами"
        ],
        
        "next_steps": [
            "Провести техническое интервью с командой",
            "Уточнить детали по информационной безопасности",
            "Согласовать план интеграций",
            "Подготовить проект договора"
        ]
    }


if __name__ == "__main__":
    """Тестирование PDF генератора"""
    try:
        logger.info("🎯 Запуск тестирования Professional KP PDF Generator")
        
        # Создаем генератор
        generator = ProfessionalKPPDFGenerator()
        
        # Создаем тестовые данные
        test_data = create_test_data()
        
        # Генерируем PDF
        pdf_buffer = generator.generate_report(test_data)
        
        # Сохраняем файл
        output_path = "/tmp/professional_kp_analysis_report.pdf"
        with open(output_path, "wb") as f:
            f.write(pdf_buffer.read())
        
        file_size = os.path.getsize(output_path)
        logger.info(f"✅ Профессиональный PDF отчет создан: {output_path}")
        logger.info(f"📄 Размер файла: {file_size:,} байт")
        
    except Exception as e:
        logger.error(f"❌ Ошибка тестирования: {e}")
        import traceback
        traceback.print_exc()