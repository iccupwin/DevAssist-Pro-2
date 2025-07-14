"""
PDF Generator для DevAssist Pro
Генерация PDF отчетов по результатам анализа КП
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path
import json
import uuid

# Заглушки для PDF библиотек (требуется установка)
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.graphics.shapes import Drawing
    from reportlab.graphics.charts.piecharts import Pie
    from reportlab.graphics.charts.barcharts import VerticalBarChart
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("ReportLab not installed. PDF generation will use mock implementation.")

from .report_generator import ReportGenerator

logger = logging.getLogger(__name__)

class PDFGenerator:
    """Генератор PDF отчетов"""
    
    def __init__(self):
        self.report_generator = ReportGenerator()
        self.output_dir = Path("data/reports")
        self.output_dir.mkdir(exist_ok=True)
        
        # Настройка стилей
        if PDF_AVAILABLE:
            self.styles = getSampleStyleSheet()
            self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Настройка кастомных стилей для PDF"""
        if not PDF_AVAILABLE:
            return
            
        # Стиль для заголовка отчета
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=self.styles['Title'],
            fontSize=20,
            spaceAfter=30,
            alignment=1,  # CENTER
            textColor=colors.HexColor('#2E75D6')
        ))
        
        # Стиль для секций
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.HexColor('#1A1E3A')
        ))
        
        # Стиль для подзаголовков
        self.styles.add(ParagraphStyle(
            name='SubHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=8,
            spaceBefore=12,
            textColor=colors.HexColor('#2E75D6')
        ))
    
    async def generate_kp_analysis_report(
        self,
        analysis_id: int,
        template_name: str = "kp_analysis_default",
        include_charts: bool = True,
        include_raw_data: bool = False
    ) -> str:
        """
        Генерация PDF отчета по анализу КП
        
        Args:
            analysis_id: ID анализа
            template_name: Название шаблона
            include_charts: Включать диаграммы
            include_raw_data: Включать сырые данные
            
        Returns:
            Путь к сгенерированному PDF файлу
        """
        try:
            logger.info(f"Generating PDF report for analysis {analysis_id}")
            
            # Получение данных отчета
            report_data = await self.report_generator.generate_report(
                analysis_id=analysis_id,
                report_format="pdf",
                template_name=template_name,
                include_charts=include_charts,
                include_raw_data=include_raw_data
            )
            
            # Генерация PDF файла
            filename = f"kp_analysis_{analysis_id}_{uuid.uuid4().hex[:8]}.pdf"
            file_path = self.output_dir / filename
            
            if PDF_AVAILABLE:
                await self._generate_pdf_file(report_data, file_path)
            else:
                await self._generate_mock_pdf(report_data, file_path)
            
            logger.info(f"PDF report generated successfully: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error generating PDF report: {str(e)}")
            raise
    
    async def _generate_pdf_file(self, report_data: Dict[str, Any], file_path: Path):
        """Генерация PDF файла с использованием ReportLab"""
        
        # Создание документа
        doc = SimpleDocTemplate(
            str(file_path),
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Контент документа
        story = []
        
        # Заголовок отчета
        title = Paragraph("Анализ коммерческого предложения", self.styles['ReportTitle'])
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Информация о генерации
        generated_at = datetime.fromisoformat(report_data["metadata"]["generated_at"])
        info_text = f"Сгенерировано: {generated_at.strftime('%d.%m.%Y %H:%M')}"
        story.append(Paragraph(info_text, self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Генерация секций
        for section_name, section_data in report_data["sections"].items():
            await self._add_section_to_story(story, section_name, section_data)
        
        # Добавление диаграмм
        if "charts" in report_data:
            await self._add_charts_to_story(story, report_data["charts"])
        
        # Сборка PDF
        doc.build(story)
    
    async def _add_section_to_story(self, story: List, section_name: str, section_data: Dict[str, Any]):
        """Добавление секции в PDF документ"""
        
        # Заголовок секции
        title = Paragraph(section_data["title"], self.styles['SectionHeader'])
        story.append(title)
        
        if section_name == "executive_summary":
            # Резюме
            content = Paragraph(section_data["content"], self.styles['Normal'])
            story.append(content)
            story.append(Spacer(1, 12))
            
            # Ключевые findings
            if "key_findings" in section_data:
                story.append(Paragraph("Ключевые выводы:", self.styles['SubHeader']))
                for finding in section_data["key_findings"]:
                    bullet = Paragraph(f"• {finding}", self.styles['Normal'])
                    story.append(bullet)
                story.append(Spacer(1, 12))
        
        elif section_name == "document_info":
            # Информация о документе в виде таблицы
            info = section_data["content"]
            data = [
                ["Параметр", "Значение"],
                ["Файл", info.get("filename", "—")],
                ["Размер", f"{info.get('file_size', 0) / 1024:.1f} KB"],
                ["Страниц", str(info.get("pages", "—"))],
                ["Загружен", info.get("uploaded_at", "—")[:10]]
            ]
            
            table = Table(data, colWidths=[2*inch, 3*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(table)
            story.append(Spacer(1, 12))
        
        elif section_name == "analysis_results":
            # Результаты анализа
            if "technical_requirements" in section_data:
                tech_req = section_data["technical_requirements"]
                story.append(Paragraph("Техническое соответствие:", self.styles['SubHeader']))
                story.append(Paragraph(f"Оценка соответствия: {tech_req['compliance_score']}%", self.styles['Normal']))
                
                if "missing_requirements" in tech_req:
                    story.append(Paragraph("Отсутствующие требования:", self.styles['Normal']))
                    for req in tech_req["missing_requirements"]:
                        story.append(Paragraph(f"• {req}", self.styles['Normal']))
                story.append(Spacer(1, 12))
            
            if "cost_analysis" in section_data:
                cost_data = section_data["cost_analysis"]
                story.append(Paragraph("Анализ стоимости:", self.styles['SubHeader']))
                story.append(Paragraph(f"Общая стоимость: {cost_data['total_cost']:,} руб.", self.styles['Normal']))
                story.append(Paragraph(f"Конкурентоспособность: {cost_data['competitiveness']}", self.styles['Normal']))
                story.append(Spacer(1, 12))
        
        elif section_name == "recommendations":
            # Рекомендации
            story.append(Paragraph("Рекомендации:", self.styles['SubHeader']))
            for rec in section_data["content"]:
                story.append(Paragraph(f"• {rec}", self.styles['Normal']))
            story.append(Spacer(1, 12))
        
        story.append(Spacer(1, 20))
    
    async def _add_charts_to_story(self, story: List, charts_data: Dict[str, Any]):
        """Добавление диаграмм в PDF документ"""
        
        story.append(Paragraph("Диаграммы", self.styles['SectionHeader']))
        
        for chart_name, chart_data in charts_data.items():
            if chart_data["type"] == "pie":
                await self._add_pie_chart(story, chart_data)
            elif chart_data["type"] == "gauge":
                await self._add_gauge_chart(story, chart_data)
        
        story.append(Spacer(1, 20))
    
    async def _add_pie_chart(self, story: List, chart_data: Dict[str, Any]):
        """Добавление круговой диаграммы"""
        
        # Создание диаграммы
        drawing = Drawing(400, 200)
        pie = Pie()
        pie.x = 50
        pie.y = 50
        pie.width = 100
        pie.height = 100
        
        # Данные для диаграммы
        data = list(chart_data["data"].values())
        labels = list(chart_data["data"].keys())
        
        pie.data = data
        pie.labels = labels
        
        drawing.add(pie)
        story.append(drawing)
        story.append(Spacer(1, 12))
    
    async def _add_gauge_chart(self, story: List, chart_data: Dict[str, Any]):
        """Добавление датчика (gauge chart)"""
        
        # Простая текстовая версия датчика
        value = chart_data["value"]
        max_value = chart_data["max_value"]
        percentage = (value / max_value) * 100
        
        gauge_text = f"{chart_data['title']}: {value}/{max_value} ({percentage:.1f}%)"
        story.append(Paragraph(gauge_text, self.styles['Normal']))
        story.append(Spacer(1, 12))
    
    async def _generate_mock_pdf(self, report_data: Dict[str, Any], file_path: Path):
        """Генерация мок PDF файла (когда ReportLab недоступен)"""
        
        # Простой текстовый файл как заглушка
        content = []
        content.append("DevAssist Pro - Анализ коммерческого предложения")
        content.append("=" * 50)
        content.append("")
        
        generated_at = datetime.fromisoformat(report_data["metadata"]["generated_at"])
        content.append(f"Сгенерировано: {generated_at.strftime('%d.%m.%Y %H:%M')}")
        content.append("")
        
        for section_name, section_data in report_data["sections"].items():
            content.append(f"## {section_data['title']}")
            content.append("")
            
            if section_name == "executive_summary":
                content.append(section_data["content"])
                content.append("")
                content.append("Ключевые выводы:")
                for finding in section_data.get("key_findings", []):
                    content.append(f"- {finding}")
            
            elif section_name == "recommendations":
                content.append("Рекомендации:")
                for rec in section_data["content"]:
                    content.append(f"- {rec}")
            
            content.append("")
        
        # Запись в файл
        with open(file_path, "w", encoding="utf-8") as f:
            f.write("\n".join(content))
        
        logger.info(f"Mock PDF generated: {file_path}")
    
    async def get_available_templates(self) -> List[Dict[str, Any]]:
        """Получение доступных шаблонов PDF"""
        return await self.report_generator.list_templates()