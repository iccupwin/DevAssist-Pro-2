"""
Тесты для Text Extractor
"""
import pytest
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, patch

from ..core.text_extractor import TextExtractor


class TestTextExtractor:
    """Тесты для извлечения текста из документов"""
    
    @pytest.fixture
    def extractor(self):
        """Фикстура для создания экстрактора"""
        return TextExtractor()
    
    @pytest.fixture
    def temp_txt_file(self):
        """Создание временного текстового файла"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            f.write("Тестовый текст для проверки извлечения.\nВторая строка текста.")
            temp_path = Path(f.name)
        
        yield temp_path
        
        # Очистка
        if temp_path.exists():
            temp_path.unlink()
    
    def test_supported_formats(self, extractor):
        """Тест поддерживаемых форматов"""
        assert ".pdf" in extractor.supported_formats
        assert ".docx" in extractor.supported_formats
        assert ".txt" in extractor.supported_formats
    
    def test_extract_from_txt_sync(self, extractor, temp_txt_file):
        """Тест синхронного извлечения из TXT"""
        text = extractor.extract_text_sync(temp_txt_file)
        
        assert "Тестовый текст" in text
        assert "Вторая строка" in text
    
    @pytest.mark.asyncio
    async def test_extract_from_txt_async(self, extractor, temp_txt_file):
        """Тест асинхронного извлечения из TXT"""
        text = await extractor.extract_text_async(temp_txt_file)
        
        assert "Тестовый текст" in text
        assert "Вторая строка" in text
    
    def test_validate_file_success(self, extractor, temp_txt_file):
        """Тест успешной валидации файла"""
        is_valid = extractor.validate_file(temp_txt_file)
        assert is_valid is True
    
    def test_validate_file_not_exists(self, extractor):
        """Тест валидации несуществующего файла"""
        fake_path = Path("/nonexistent/file.txt")
        is_valid = extractor.validate_file(fake_path)
        assert is_valid is False
    
    def test_validate_file_unsupported_format(self, extractor):
        """Тест валидации неподдерживаемого формата"""
        with tempfile.NamedTemporaryFile(suffix='.xyz', delete=False) as f:
            temp_path = Path(f.name)
        
        try:
            is_valid = extractor.validate_file(temp_path)
            assert is_valid is False
        finally:
            if temp_path.exists():
                temp_path.unlink()
    
    def test_get_document_info(self, extractor, temp_txt_file):
        """Тест получения информации о документе"""
        info = extractor.get_document_info(temp_txt_file)
        
        assert info["filename"] == temp_txt_file.name
        assert info["file_type"] == ".txt"
        assert info["is_supported"] is True
        assert "file_size" in info
        assert "created_at" in info
        assert "modified_at" in info
    
    @pytest.mark.asyncio
    async def test_extract_unsupported_format(self, extractor):
        """Тест извлечения из неподдерживаемого формата"""
        with tempfile.NamedTemporaryFile(suffix='.xyz', delete=False) as f:
            temp_path = Path(f.name)
        
        try:
            with pytest.raises(ValueError, match="Unsupported file format"):
                await extractor.extract_text_async(temp_path)
        finally:
            if temp_path.exists():
                temp_path.unlink()
    
    @patch('PyPDF2.PdfReader')
    def test_extract_from_pdf_mock(self, mock_pdf_reader, extractor):
        """Тест извлечения из PDF с мокингом"""
        # Настройка мока
        mock_page = Mock()
        mock_page.extract_text.return_value = "Текст из PDF документа"
        
        mock_reader_instance = Mock()
        mock_reader_instance.pages = [mock_page]
        mock_pdf_reader.return_value = mock_reader_instance
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            temp_path = Path(f.name)
        
        try:
            text = extractor._extract_text_from_pdf_sync(temp_path)
            assert "Текст из PDF документа" in text
        finally:
            if temp_path.exists():
                temp_path.unlink()
    
    @patch('docx.Document')
    def test_extract_from_docx_mock(self, mock_docx, extractor):
        """Тест извлечения из DOCX с мокингом"""
        # Настройка мока
        mock_paragraph = Mock()
        mock_paragraph.text = "Параграф из DOCX документа"
        
        mock_doc = Mock()
        mock_doc.paragraphs = [mock_paragraph]
        mock_doc.tables = []
        mock_docx.return_value = mock_doc
        
        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as f:
            temp_path = Path(f.name)
        
        try:
            text = extractor._extract_text_from_docx_sync(temp_path)
            assert "Параграф из DOCX документа" in text
        finally:
            if temp_path.exists():
                temp_path.unlink()
    
    def test_extract_different_encodings(self, extractor):
        """Тест извлечения текста с разными кодировками"""
        # Создание файла с кодировкой cp1251
        test_text = "Тест кодировки"
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='cp1251') as f:
            f.write(test_text)
            temp_path = Path(f.name)
        
        try:
            # Должно корректно обработать файл с другой кодировкой
            text = extractor._extract_text_from_txt_sync(temp_path)
            assert len(text) > 0  # Хотя бы что-то извлечено
        finally:
            if temp_path.exists():
                temp_path.unlink()


@pytest.mark.asyncio
async def test_text_extractor_integration():
    """Интеграционный тест экстрактора"""
    extractor = TextExtractor()
    
    # Создание тестового файла
    test_content = "Интеграционный тест\nТестирование полного цикла извлечения текста"
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(test_content)
        temp_path = Path(f.name)
    
    try:
        # Тест валидации
        assert extractor.validate_file(temp_path) is True
        
        # Тест информации о файле
        info = extractor.get_document_info(temp_path)
        assert info["is_supported"] is True
        
        # Тест извлечения
        text = await extractor.extract_text_async(temp_path)
        assert "Интеграционный тест" in text
        assert "полного цикла" in text
        
    finally:
        if temp_path.exists():
            temp_path.unlink()


if __name__ == "__main__":
    pytest.main([__file__])