#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enhanced KP PDF Export Service с поддержкой кириллицы
Основано на рабочем коде из Tender проекта

Функции:
- Создание PDF отчетов с поддержкой кириллических символов
- Экспорт анализа КП в профессиональном формате
- Графики и таблицы с корректным отображением русского текста
- Интеграция с существующим KP Analyzer
"""

import matplotlib
# Настройка backend для работы без GUI
matplotlib.use('Agg')

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.backends.backend_pdf import PdfPages
import numpy as np
import pandas as pd
from io import BytesIO
import base64
from datetime import datetime
import os
import json
import logging
from typing import Dict, List, Optional, Any

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Настройка matplotlib для поддержки кириллицы
plt.rcParams['font.family'] = ['DejaVu Sans', 'sans-serif']  # Шрифт с поддержкой кириллицы
plt.rcParams['axes.unicode_minus'] = False  # Исправление отображения минусов


class EnhancedKPPDFExporter:
    """
    Улучшенный PDF экспортер для анализа КП с поддержкой кириллицы
    """
    
    def __init__(self):
        self.brand_colors = {
            "primary": "#2E75D6",
            "secondary": "#1A1E3A", 
            "accent": "#FF5F08",
            "success": "#4CAF50",
            "warning": "#FFC107",
            "danger": "#FF5252",
            "text": "#0F172A"
        }
        
    def export_kp_analysis_to_pdf(self, analysis_data: Dict[str, Any]) -> BytesIO:
        """
        Экспортирует результаты анализа КП в PDF файл
        
        Args:
            analysis_data: Словарь с результатами анализа КП
            
        Returns:
            BytesIO: PDF файл в формате BytesIO
        """
        try:
            logger.info("Начало создания PDF отчета КП")
            
            # Создаем BytesIO буфер для PDF
            buffer = BytesIO()
            
            # Извлекаем данные из результатов анализа
            kp_name = analysis_data.get("kp_name", "Не указано")
            company_name = analysis_data.get("company_name", kp_name)
            tz_name = analysis_data.get("tz_name", "Не указано")
            comparison_result = analysis_data.get("comparison_result", {})
            ratings = analysis_data.get("ratings", {})
            pricing = analysis_data.get("pricing", "Не указано")
            timeline = analysis_data.get("timeline", "Не указано")
            tech_stack = analysis_data.get("tech_stack", "Не указано")
            
            compliance_score = comparison_result.get("compliance_score", 0)
            missing_requirements = comparison_result.get("missing_requirements", [])
            additional_features = comparison_result.get("additional_features", [])
            
            preliminary_recommendation = analysis_data.get("preliminary_recommendation", {})
            strengths = preliminary_recommendation.get("strength", [])
            weaknesses = preliminary_recommendation.get("weakness", [])
            
            # Создаем PDF документ
            with PdfPages(buffer) as pdf:
                # Страница 1: Титульный лист
                self._create_title_page(pdf, company_name, tz_name)
                
                # Страница 2: Резюме и ключевые показатели
                self._create_summary_page(pdf, company_name, compliance_score, 
                                       strengths, weaknesses, pricing, timeline)
                
                # Страница 3: Детальный анализ соответствия
                self._create_compliance_analysis_page(pdf, comparison_result, tech_stack)
                
                # Страница 4: Рейтинги и оценки
                if ratings:
                    self._create_ratings_page(pdf, ratings, compliance_score)
                
                # Страница 5: Финансовый анализ и рекомендации
                self._create_financial_analysis_page(pdf, pricing, timeline, strengths, weaknesses)
                
                # Страница 6: Заключение и следующие шаги
                self._create_conclusion_page(pdf, company_name, compliance_score, 
                                          len(missing_requirements), len(additional_features))
            
            # Возвращаем буфер в начальную позицию
            buffer.seek(0)
            logger.info("PDF отчет успешно создан")
            return buffer
            
        except Exception as e:
            logger.error(f"Ошибка при создании PDF отчета: {e}")
            raise e
    
    def _create_title_page(self, pdf: PdfPages, company_name: str, tz_name: str):
        """Создает титульную страницу PDF отчета"""
        fig, ax = plt.subplots(figsize=(11, 8.5))
        ax.axis('off')
        
        # Заголовок отчета
        ax.text(0.5, 0.85, 'АНАЛИЗ КОММЕРЧЕСКОГО', 
                ha='center', va='center', fontsize=24, fontweight='bold',
                color=self.brand_colors["primary"])
        ax.text(0.5, 0.78, 'ПРЕДЛОЖЕНИЯ', 
                ha='center', va='center', fontsize=24, fontweight='bold',
                color=self.brand_colors["primary"])
        
        # Информация о компании
        ax.text(0.5, 0.65, f'Компания: {company_name}', 
                ha='center', va='center', fontsize=16, fontweight='bold')
        
        ax.text(0.5, 0.58, f'ТЗ: {tz_name}', 
                ha='center', va='center', fontsize=14)
        
        # Дата создания
        current_date = datetime.now().strftime("%d.%m.%Y %H:%M")
        ax.text(0.5, 0.45, f'Дата анализа: {current_date}', 
                ha='center', va='center', fontsize=12, style='italic')
        
        # Декоративный элемент
        rect = patches.Rectangle((0.1, 0.25), 0.8, 0.05, 
                               linewidth=0, facecolor=self.brand_colors["accent"], alpha=0.8)
        ax.add_patch(rect)
        
        # Подпись системы
        ax.text(0.5, 0.15, 'DevAssist Pro - KP Analyzer', 
                ha='center', va='center', fontsize=14, 
                color=self.brand_colors["secondary"])
        
        ax.text(0.5, 0.08, 'Автоматизированная система анализа коммерческих предложений', 
                ha='center', va='center', fontsize=10, style='italic',
                color='gray')
        
        plt.tight_layout()
        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)
    
    def _create_summary_page(self, pdf: PdfPages, company_name: str, compliance_score: float,
                           strengths: List[str], weaknesses: List[str], 
                           pricing: str, timeline: str):
        """Создает страницу с резюме и ключевыми показателями"""
        fig = plt.figure(figsize=(11, 8.5))
        
        # Заголовок страницы
        fig.suptitle('РЕЗЮМЕ И КЛЮЧЕВЫЕ ВЫВОДЫ', fontsize=18, fontweight='bold', y=0.95)
        
        # Создаем сетку подграфиков
        gs = fig.add_gridspec(3, 2, height_ratios=[1, 1.5, 1], hspace=0.4, wspace=0.3)
        
        # 1. Общая оценка соответствия (круговая диаграмма)
        ax1 = fig.add_subplot(gs[0, 0])
        self._create_compliance_gauge(ax1, compliance_score)
        ax1.set_title('Соответствие ТЗ (%)', fontweight='bold')
        
        # 2. Ключевая информация
        ax2 = fig.add_subplot(gs[0, 1])
        ax2.axis('off')
        ax2.text(0.1, 0.8, f'Компания: {company_name}', fontsize=12, fontweight='bold')
        ax2.text(0.1, 0.6, f'Стоимость: {pricing}', fontsize=11)
        ax2.text(0.1, 0.4, f'Сроки: {timeline}', fontsize=11)
        
        # Определяем рекомендацию
        if compliance_score >= 80:
            recommendation = "✅ Рекомендовано к принятию"
            rec_color = self.brand_colors["success"]
        elif compliance_score >= 60:
            recommendation = "⚠️ Требует доработки"
            rec_color = self.brand_colors["warning"]
        else:
            recommendation = "❌ Не рекомендовано"
            rec_color = self.brand_colors["danger"]
        
        ax2.text(0.1, 0.2, 'Рекомендация:', fontsize=11, fontweight='bold')
        ax2.text(0.1, 0.05, recommendation, fontsize=10, color=rec_color, fontweight='bold')
        
        # 3. Сильные стороны
        ax3 = fig.add_subplot(gs[1, 0])
        ax3.axis('off')
        ax3.text(0.1, 0.9, 'СИЛЬНЫЕ СТОРОНЫ:', fontsize=12, fontweight='bold', 
                color=self.brand_colors["success"])
        
        y_pos = 0.8
        for i, strength in enumerate(strengths[:5]):  # Показываем до 5 сильных сторон
            ax3.text(0.1, y_pos, f'• {strength}', fontsize=10, wrap=True)
            y_pos -= 0.15
        
        if not strengths:
            ax3.text(0.1, 0.7, '• Не выявлено', fontsize=10, style='italic', color='gray')
        
        # 4. Слабые стороны
        ax4 = fig.add_subplot(gs[1, 1])
        ax4.axis('off')
        ax4.text(0.1, 0.9, 'СЛАБЫЕ СТОРОНЫ:', fontsize=12, fontweight='bold', 
                color=self.brand_colors["danger"])
        
        y_pos = 0.8
        for i, weakness in enumerate(weaknesses[:5]):  # Показываем до 5 слабых сторон
            ax4.text(0.1, y_pos, f'• {weakness}', fontsize=10, wrap=True)
            y_pos -= 0.15
        
        if not weaknesses:
            ax4.text(0.1, 0.7, '• Не выявлено', fontsize=10, style='italic', color='gray')
        
        # 5. Итоговая оценка
        ax5 = fig.add_subplot(gs[2, :])
        ax5.axis('off')
        
        # Создаем прямоугольник для итоговой оценки
        rect = patches.Rectangle((0.1, 0.3), 0.8, 0.4, 
                               linewidth=2, facecolor=self.brand_colors["primary"], 
                               alpha=0.1, edgecolor=self.brand_colors["primary"])
        ax5.add_patch(rect)
        
        ax5.text(0.5, 0.6, 'ИТОГОВАЯ ОЦЕНКА', ha='center', fontsize=14, fontweight='bold')
        
        if compliance_score >= 80:
            summary_text = f"Предложение от '{company_name}' демонстрирует высокую степень соответствия ТЗ ({compliance_score}%) и рекомендуется к принятию."
        elif compliance_score >= 60:
            summary_text = f"Предложение от '{company_name}' показывает среднюю степень соответствия ТЗ ({compliance_score}%) и требует доработки ключевых моментов."
        else:
            summary_text = f"Предложение от '{company_name}' имеет низкую степень соответствия ТЗ ({compliance_score}%) и не рекомендуется к принятию."
        
        ax5.text(0.5, 0.4, summary_text, ha='center', va='center', fontsize=11, 
                wrap=True, bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8))
        
        plt.tight_layout()
        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)
    
    def _create_compliance_analysis_page(self, pdf: PdfPages, comparison_result: Dict, tech_stack: str):
        """Создает страницу с детальным анализом соответствия"""
        fig = plt.figure(figsize=(11, 8.5))
        fig.suptitle('ДЕТАЛЬНЫЙ АНАЛИЗ СООТВЕТСТВИЯ', fontsize=18, fontweight='bold', y=0.95)
        
        gs = fig.add_gridspec(2, 2, hspace=0.4, wspace=0.3)
        
        # 1. График соответствия по разделам
        ax1 = fig.add_subplot(gs[0, :])
        sections = comparison_result.get("sections", [])
        
        if sections:
            section_names = [section["name"] for section in sections]
            section_scores = [section["compliance"] for section in sections]
            
            bars = ax1.barh(section_names, section_scores, color=self.brand_colors["primary"], alpha=0.7)
            ax1.set_xlabel('Соответствие (%)')
            ax1.set_title('Соответствие по разделам ТЗ', fontweight='bold', pad=20)
            ax1.set_xlim(0, 100)
            
            # Добавляем значения на столбцы
            for i, bar in enumerate(bars):
                width = bar.get_width()
                ax1.text(width + 1, bar.get_y() + bar.get_height()/2, 
                        f'{width}%', ha='left', va='center', fontweight='bold')
        else:
            ax1.text(0.5, 0.5, 'Данные по разделам отсутствуют', 
                    ha='center', va='center', transform=ax1.transAxes, 
                    fontsize=12, style='italic')
            ax1.axis('off')
        
        # 2. Пропущенные требования
        ax2 = fig.add_subplot(gs[1, 0])
        ax2.axis('off')
        ax2.text(0.1, 0.9, 'ПРОПУЩЕННЫЕ ТРЕБОВАНИЯ:', fontsize=12, fontweight='bold', 
                color=self.brand_colors["danger"])
        
        missing_requirements = comparison_result.get("missing_requirements", [])
        y_pos = 0.8
        for i, req in enumerate(missing_requirements[:6]):  # Показываем до 6 требований
            ax2.text(0.1, y_pos, f'• {req}', fontsize=9, wrap=True)
            y_pos -= 0.12
        
        if not missing_requirements:
            ax2.text(0.1, 0.7, '• Не выявлено', fontsize=10, style='italic', color='gray')
        elif len(missing_requirements) > 6:
            ax2.text(0.1, y_pos, f'... и еще {len(missing_requirements) - 6} требований', 
                    fontsize=9, style='italic')
        
        # 3. Дополнительные функции
        ax3 = fig.add_subplot(gs[1, 1])
        ax3.axis('off')
        ax3.text(0.1, 0.9, 'ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ:', fontsize=12, fontweight='bold', 
                color=self.brand_colors["success"])
        
        additional_features = comparison_result.get("additional_features", [])
        y_pos = 0.8
        for i, feature in enumerate(additional_features[:6]):  # Показываем до 6 функций
            ax3.text(0.1, y_pos, f'• {feature}', fontsize=9, wrap=True)
            y_pos -= 0.12
        
        if not additional_features:
            ax3.text(0.1, 0.7, '• Не выявлено', fontsize=10, style='italic', color='gray')
        elif len(additional_features) > 6:
            ax3.text(0.1, y_pos, f'... и еще {len(additional_features) - 6} функций', 
                    fontsize=9, style='italic')
        
        plt.tight_layout()
        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)
    
    def _create_ratings_page(self, pdf: PdfPages, ratings: Dict[str, float], compliance_score: float):
        """Создает страницу с рейтингами и оценками"""
        fig = plt.figure(figsize=(11, 8.5))
        fig.suptitle('РЕЙТИНГИ И ОЦЕНКИ', fontsize=18, fontweight='bold', y=0.95)
        
        gs = fig.add_gridspec(2, 2, hspace=0.4, wspace=0.3)
        
        # 1. Радарная диаграмма рейтингов
        ax1 = fig.add_subplot(gs[0, 0], projection='polar')
        self._create_radar_chart(ax1, ratings)
        ax1.set_title('Оценки по критериям', fontweight='bold', pad=20)
        
        # 2. Столбчатая диаграмма рейтингов
        ax2 = fig.add_subplot(gs[0, 1])
        criteria = list(ratings.keys())
        values = list(ratings.values())
        
        bars = ax2.bar(range(len(criteria)), values, color=self.brand_colors["accent"], alpha=0.7)
        ax2.set_xticks(range(len(criteria)))
        ax2.set_xticklabels([c.replace('_', '\n') for c in criteria], rotation=45, ha='right')
        ax2.set_ylabel('Оценка (1-10)')
        ax2.set_ylim(0, 10)
        ax2.set_title('Детальные оценки', fontweight='bold')
        
        # Добавляем значения на столбцы
        for bar, value in zip(bars, values):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                    f'{value:.1f}', ha='center', va='bottom', fontweight='bold')
        
        # 3. Общая оценка
        ax3 = fig.add_subplot(gs[1, :])
        ax3.axis('off')
        
        avg_rating = sum(ratings.values()) / len(ratings)
        overall_score = (avg_rating * 10 + compliance_score) / 2
        
        ax3.text(0.5, 0.8, 'ОБЩАЯ ОЦЕНКА ПРЕДЛОЖЕНИЯ', ha='center', fontsize=16, fontweight='bold')
        
        # Создаем визуальную шкалу общей оценки
        bar_width = 0.6
        bar_height = 0.1
        bar_x = 0.5 - bar_width/2
        bar_y = 0.5
        
        # Фон шкалы
        bg_rect = patches.Rectangle((bar_x, bar_y), bar_width, bar_height, 
                                  facecolor='lightgray', alpha=0.3)
        ax3.add_patch(bg_rect)
        
        # Заполненная часть шкалы
        fill_width = bar_width * (overall_score / 100)
        if overall_score >= 75:
            fill_color = self.brand_colors["success"]
        elif overall_score >= 60:
            fill_color = self.brand_colors["warning"]
        else:
            fill_color = self.brand_colors["danger"]
        
        fill_rect = patches.Rectangle((bar_x, bar_y), fill_width, bar_height, 
                                    facecolor=fill_color, alpha=0.8)
        ax3.add_patch(fill_rect)
        
        # Текст с оценкой
        ax3.text(0.5, 0.35, f'{overall_score:.1f} / 100', ha='center', fontsize=24, fontweight='bold')
        
        # Расшифровка оценки
        if overall_score >= 75:
            score_text = "ОТЛИЧНОЕ ПРЕДЛОЖЕНИЕ"
            score_color = self.brand_colors["success"]
        elif overall_score >= 60:
            score_text = "ХОРОШЕЕ ПРЕДЛОЖЕНИЕ С ОГОВОРКАМИ"
            score_color = self.brand_colors["warning"]
        else:
            score_text = "ПРЕДЛОЖЕНИЕ ТРЕБУЕТ СЕРЬЕЗНОЙ ДОРАБОТКИ"
            score_color = self.brand_colors["danger"]
        
        ax3.text(0.5, 0.2, score_text, ha='center', fontsize=12, 
                fontweight='bold', color=score_color)
        
        plt.tight_layout()
        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)
    
    def _create_financial_analysis_page(self, pdf: PdfPages, pricing: str, timeline: str,
                                      strengths: List[str], weaknesses: List[str]):
        """Создает страницу с финансовым анализом"""
        fig = plt.figure(figsize=(11, 8.5))
        fig.suptitle('ФИНАНСОВЫЙ АНАЛИЗ И РЕКОМЕНДАЦИИ', fontsize=18, fontweight='bold', y=0.95)
        
        gs = fig.add_gridspec(3, 2, height_ratios=[1, 1, 1.2], hspace=0.4, wspace=0.3)
        
        # 1. Информация о стоимости
        ax1 = fig.add_subplot(gs[0, 0])
        ax1.axis('off')
        ax1.text(0.1, 0.8, 'СТОИМОСТЬ:', fontsize=14, fontweight='bold', 
                color=self.brand_colors["primary"])
        ax1.text(0.1, 0.6, pricing, fontsize=12, wrap=True)
        
        # Анализ ценовой модели
        if "фиксированная" in pricing.lower():
            model_type = "Fixed Price"
            model_desc = "Фиксированная цена обеспечивает\nпредсказуемость затрат"
        elif "t&m" in pricing.lower():
            model_type = "Time & Materials"
            model_desc = "Модель T&M обеспечивает\nгибкость при изменениях"
        else:
            model_type = "Смешанная модель"
            model_desc = "Комбинированный подход\nк ценообразованию"
        
        ax1.text(0.1, 0.3, f'Модель: {model_type}', fontsize=10, fontweight='bold')
        ax1.text(0.1, 0.1, model_desc, fontsize=9, style='italic')
        
        # 2. Информация о сроках
        ax2 = fig.add_subplot(gs[0, 1])
        ax2.axis('off')
        ax2.text(0.1, 0.8, 'СРОКИ РЕАЛИЗАЦИИ:', fontsize=14, fontweight='bold', 
                color=self.brand_colors["primary"])
        ax2.text(0.1, 0.6, timeline, fontsize=12, wrap=True)
        
        # Анализ реалистичности сроков
        ax2.text(0.1, 0.3, 'Оценка сроков:', fontsize=10, fontweight='bold')
        ax2.text(0.1, 0.1, 'Требует дополнительной\nверификации с экспертами', 
                fontsize=9, style='italic')
        
        # 3-4. Сравнение с рынком и рисков (заглушки)
        ax3 = fig.add_subplot(gs[1, 0])
        ax3.axis('off')
        ax3.text(0.1, 0.8, 'СРАВНЕНИЕ С РЫНКОМ:', fontsize=12, fontweight='bold')
        ax3.text(0.1, 0.6, '• Анализ рыночных цен\n• Сопоставимые предложения\n• Отраслевые стандарты', 
                fontsize=10)
        ax3.text(0.1, 0.2, '(Требует дополнительных\nданных для полного анализа)', 
                fontsize=9, style='italic', color='gray')
        
        ax4 = fig.add_subplot(gs[1, 1])
        ax4.axis('off')
        ax4.text(0.1, 0.8, 'ФИНАНСОВЫЕ РИСКИ:', fontsize=12, fontweight='bold', 
                color=self.brand_colors["warning"])
        
        risks = [
            '• Риск превышения бюджета',
            '• Скрытые расходы',
            '• Изменение требований',
            '• Валютные колебания'
        ]
        
        y_pos = 0.6
        for risk in risks:
            ax4.text(0.1, y_pos, risk, fontsize=10)
            y_pos -= 0.1
        
        # 5. Рекомендации по переговорам
        ax5 = fig.add_subplot(gs[2, :])
        ax5.axis('off')
        
        # Создаем рамку для рекомендаций
        rect = patches.Rectangle((0.05, 0.1), 0.9, 0.8, 
                               linewidth=2, facecolor=self.brand_colors["accent"], 
                               alpha=0.1, edgecolor=self.brand_colors["accent"])
        ax5.add_patch(rect)
        
        ax5.text(0.5, 0.85, 'РЕКОМЕНДАЦИИ ПО ПЕРЕГОВОРАМ', ha='center', fontsize=14, fontweight='bold')
        
        # Формируем ключевые пункты для переговоров на основе слабых сторон
        negotiation_points = weaknesses[:3] if weaknesses else ["Уточнить детали реализации"]
        
        ax5.text(0.1, 0.7, 'Ключевые пункты для обсуждения:', fontsize=12, fontweight='bold')
        
        y_pos = 0.6
        for i, point in enumerate(negotiation_points, 1):
            ax5.text(0.1, y_pos, f'{i}. {point}', fontsize=11)
            y_pos -= 0.1
        
        ax5.text(0.1, 0.3, 'Рекомендуемые действия:', fontsize=12, fontweight='bold')
        ax5.text(0.1, 0.2, '• Запросить детализацию стоимости по этапам', fontsize=10)
        ax5.text(0.1, 0.1, '• Обсудить возможности оптимизации сроков', fontsize=10)
        
        plt.tight_layout()
        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)
    
    def _create_conclusion_page(self, pdf: PdfPages, company_name: str, compliance_score: float,
                              missing_count: int, additional_count: int):
        """Создает заключительную страницу с итогами и следующими шагами"""
        fig = plt.figure(figsize=(11, 8.5))
        fig.suptitle('ЗАКЛЮЧЕНИЕ И СЛЕДУЮЩИЕ ШАГИ', fontsize=18, fontweight='bold', y=0.95)
        
        gs = fig.add_gridspec(3, 1, height_ratios=[1.5, 1, 1], hspace=0.4)
        
        # 1. Итоговое заключение
        ax1 = fig.add_subplot(gs[0])
        ax1.axis('off')
        
        # Создаем рамку для заключения
        rect = patches.Rectangle((0.05, 0.1), 0.9, 0.8, 
                               linewidth=2, facecolor=self.brand_colors["primary"], 
                               alpha=0.1, edgecolor=self.brand_colors["primary"])
        ax1.add_patch(rect)
        
        ax1.text(0.5, 0.8, 'ИТОГОВОЕ ЗАКЛЮЧЕНИЕ', ha='center', fontsize=16, fontweight='bold')
        
        # Формируем текст заключения
        if compliance_score >= 80:
            conclusion_text = f"""Коммерческое предложение от '{company_name}' демонстрирует высокий уровень 
соответствия техническому заданию ({compliance_score}%). Предложение содержит {additional_count} 
дополнительных функций и имеет всего {missing_count} непокрытых требований.

РЕКОМЕНДАЦИЯ: Предложение рекомендуется к принятию с возможными 
незначительными доработками."""
        elif compliance_score >= 60:
            conclusion_text = f"""Коммерческое предложение от '{company_name}' показывает средний уровень 
соответствия техническому заданию ({compliance_score}%). Выявлено {missing_count} непокрытых 
требований, что требует дополнительного обсуждения с поставщиком.

РЕКОМЕНДАЦИЯ: Предложение может быть принято после доработки 
ключевых замечаний и проведения переговоров."""
        else:
            conclusion_text = f"""Коммерческое предложение от '{company_name}' имеет низкий уровень 
соответствия техническому заданию ({compliance_score}%). Большое количество непокрытых 
требований ({missing_count}) создает высокие риски для проекта.

РЕКОМЕНДАЦИЯ: Предложение не рекомендуется к принятию без 
существенной доработки или следует рассмотреть альтернативы."""
        
        ax1.text(0.5, 0.45, conclusion_text, ha='center', va='center', fontsize=11,
                bbox=dict(boxstyle="round,pad=0.5", facecolor='white', alpha=0.9))
        
        # 2. Следующие шаги
        ax2 = fig.add_subplot(gs[1])
        ax2.axis('off')
        
        ax2.text(0.1, 0.8, 'РЕКОМЕНДУЕМЫЕ СЛЕДУЮЩИЕ ШАГИ:', fontsize=14, fontweight='bold',
                color=self.brand_colors["secondary"])
        
        if compliance_score >= 80:
            next_steps = [
                "1. Подготовить проект договора",
                "2. Согласовать финальный план работ",
                "3. Определить ключевые вехи проекта",
                "4. Назначить ответственных с обеих сторон"
            ]
        elif compliance_score >= 60:
            next_steps = [
                "1. Провести встречу с поставщиком",
                "2. Обсудить непокрытые требования",
                "3. Запросить доработку предложения",
                "4. Рассмотреть возможности оптимизации"
            ]
        else:
            next_steps = [
                "1. Уведомить поставщика о недостатках",
                "2. Запросить кардинальную доработку",
                "3. Рассмотреть альтернативные варианты",
                "4. Провести дополнительный тендер"
            ]
        
        y_pos = 0.6
        for step in next_steps:
            ax2.text(0.1, y_pos, step, fontsize=11)
            y_pos -= 0.1
        
        # 3. Информация о документе
        ax3 = fig.add_subplot(gs[2])
        ax3.axis('off')
        
        # Разделительная линия
        ax3.axhline(y=0.8, color='gray', linestyle='-', alpha=0.3)
        
        ax3.text(0.1, 0.6, 'ИНФОРМАЦИЯ О ДОКУМЕНТЕ:', fontsize=10, fontweight='bold')
        ax3.text(0.1, 0.45, f'Дата создания: {datetime.now().strftime("%d.%m.%Y %H:%M")}', fontsize=9)
        ax3.text(0.1, 0.35, 'Система: DevAssist Pro - KP Analyzer', fontsize=9)
        ax3.text(0.1, 0.25, 'Версия анализа: 2.0', fontsize=9)
        
        ax3.text(0.1, 0.1, 'ПРИМЕЧАНИЕ: Данный анализ носит рекомендательный характер и должен', fontsize=8, style='italic')
        ax3.text(0.1, 0.05, 'рассматриваться в совокупности с экспертной оценкой специалистов.', fontsize=8, style='italic')
        
        plt.tight_layout()
        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)
    
    def _create_compliance_gauge(self, ax, score: float):
        """Создает круговую диаграмму для отображения соответствия"""
        # Определяем цвет на основе оценки
        if score >= 80:
            color = self.brand_colors["success"]
        elif score >= 60:
            color = self.brand_colors["warning"]
        else:
            color = self.brand_colors["danger"]
        
        # Создаем круговую диаграмму
        sizes = [score, 100 - score]
        colors = [color, 'lightgray']
        
        wedges, texts = ax.pie(sizes, colors=colors, startangle=90, 
                              wedgeprops=dict(width=0.3))
        
        # Добавляем текст в центр
        ax.text(0, 0, f'{score}%', ha='center', va='center', 
               fontsize=16, fontweight='bold')
        
        ax.axis('equal')
    
    def _create_radar_chart(self, ax, ratings: Dict[str, float]):
        """Создает радарную диаграмму для рейтингов"""
        criteria = list(ratings.keys())
        values = list(ratings.values())
        
        # Количество критериев
        N = len(criteria)
        
        # Углы для каждого критерия
        angles = [n / float(N) * 2 * np.pi for n in range(N)]
        angles += angles[:1]  # Замыкаем диаграмму
        
        # Значения (замыкаем для построения)
        values += values[:1]
        
        # Строим радарную диаграмму
        ax.plot(angles, values, 'o-', linewidth=2, color=self.brand_colors["primary"])
        ax.fill(angles, values, alpha=0.25, color=self.brand_colors["primary"])
        
        # Добавляем подписи критериев
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels([c.replace('_', '\n') for c in criteria])
        
        # Устанавливаем диапазон
        ax.set_ylim(0, 10)
        ax.set_yticks([2, 4, 6, 8, 10])
        ax.grid(True)


def create_test_analysis_data():
    """Создает тестовые данные для проверки PDF экспорта"""
    return {
        "kp_name": "test_kp.pdf",
        "company_name": "Тестовая IT-компания",
        "tz_name": "Разработка веб-портала",
        "comparison_result": {
            "compliance_score": 85,
            "missing_requirements": [
                "Интеграция с системой аутентификации",
                "Мобильная версия приложения",
                "Система уведомлений"
            ],
            "additional_features": [
                "Дашборд аналитики",
                "API для внешних систем",
                "Система резервного копирования"
            ],
            "sections": [
                {"name": "Функциональные\nтребования", "compliance": 90},
                {"name": "Технические\nтребования", "compliance": 80},
                {"name": "Требования к\nбезопасности", "compliance": 75},
                {"name": "Требования к\nинтерфейсу", "compliance": 95}
            ]
        },
        "ratings": {
            "technical_compliance": 8.5,
            "functional_completeness": 7.8,
            "cost_effectiveness": 8.2,
            "timeline_realism": 7.5,
            "vendor_reliability": 8.0
        },
        "pricing": "Фиксированная цена: 2,500,000 рублей (без НДС)",
        "timeline": "Срок реализации: 4 месяца (120 рабочих дней)",
        "tech_stack": "React, Node.js, PostgreSQL, Docker",
        "preliminary_recommendation": {
            "strength": [
                "Высокое качество технического решения",
                "Современный стек технологий",
                "Хорошее понимание требований заказчика",
                "Конкурентная цена"
            ],
            "weakness": [
                "Отсутствует мобильная версия",
                "Недостаточная проработка системы безопасности",
                "Не указана интеграция с внешними системами"
            ]
        }
    }


if __name__ == "__main__":
    """Тестирование PDF экспортера"""
    try:
        # Создаем экземпляр экспортера
        exporter = EnhancedKPPDFExporter()
        
        # Создаем тестовые данные
        test_data = create_test_analysis_data()
        
        # Создаем PDF отчет
        print("Создание тестового PDF отчета...")
        pdf_buffer = exporter.export_kp_analysis_to_pdf(test_data)
        
        # Сохраняем PDF файл
        output_path = "/tmp/test_kp_analysis_report.pdf"
        with open(output_path, "wb") as f:
            f.write(pdf_buffer.read())
        
        print(f"✅ PDF отчет успешно создан: {output_path}")
        print(f"📄 Размер файла: {os.path.getsize(output_path)} байт")
        
    except Exception as e:
        print(f"❌ Ошибка при создании PDF: {e}")
        import traceback
        traceback.print_exc()