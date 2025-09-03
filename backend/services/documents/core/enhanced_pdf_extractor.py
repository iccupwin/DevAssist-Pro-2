"""
Расширенный экстрактор PDF документов для DevAssist Pro
Решает проблемы извлечения данных из коммерческих предложений

Features:
- Множественные методы извлечения (PyMuPDF -> pdfplumber -> camelot -> OCR)
- Продвинутое извлечение таблиц
- Улучшенное распознавание сумм и чисел
- Обработка сканированных документов
- Кэширование результатов
- Детальное логирование и валидация
"""

import os
import re
import json
import logging
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from io import BytesIO
import asyncio
from datetime import datetime

# Core PDF libraries
import PyPDF2
import pdfplumber
import fitz  # PyMuPDF
import camelot

# Optional imports with fallbacks
try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

try:
    import chardet
    CHARDET_AVAILABLE = True
except ImportError:
    CHARDET_AVAILABLE = False

logger = logging.getLogger(__name__)

class EnhancedPDFExtractor:
    """Улучшенный экстрактор PDF с множественными методами извлечения"""
    
    def __init__(self, cache_dir: Optional[Path] = None):
        """
        Initialize extractor
        
        Args:
            cache_dir: Directory for caching extraction results
        """
        self.cache_dir = cache_dir or Path("/tmp/pdf_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Number format patterns for better recognition
        self.number_patterns = [
            # Russian format: 1 000 000,50
            r'(\d{1,3}(?:\s\d{3})*(?:,\d{2})?)',
            # US format: 1,000,000.50
            r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            # Simple format: 1000000.50 or 1000000,50
            r'(\d+(?:[,.]?\d{2})?)',
            # With separators: 1.000.000,50
            r'(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
        ]
        
        # Currency patterns with context
        self.currency_patterns = {
            'RUB': [
                r'(\d+(?:[\s,\.]\d{3})*(?:[,\.]\d{2})?)\s*(?:руб(?:лей?)?|₽|RUB)',
                r'(?:руб(?:лей?)?|₽|RUB)\s*(\d+(?:[\s,\.]\d{3})*(?:[,\.]\d{2})?)',
            ],
            'USD': [
                r'\$\s*(\d+(?:[\s,\.]\d{3})*(?:[,\.]\d{2})?)',
                r'(\d+(?:[\s,\.]\d{3})*(?:[,\.]\d{2})?)\s*(?:USD|долл(?:аров?)?)',
            ],
            'EUR': [
                r'€\s*(\d+(?:[\s,\.]\d{3})*(?:[,\.]\d{2})?)',
                r'(\d+(?:[\s,\.]\d{3})*(?:[,\.]\d{2})?)\s*(?:EUR|евро)',
            ],
            'KGS': [
                r'(\d+(?:[\s,\.]\d{3})*(?:[,\.]\d{2})?)\s*(?:сом|KGS)',
            ],
            'KZT': [
                r'(\d+(?:[\s,\.]\d{3})*(?:[,\.]\d{2})?)\s*(?:тенге|₸|KZT)',
            ]
        }
        
        # Keywords for budget context detection
        self.budget_keywords = [
            'стоимость', 'цена', 'бюджет', 'итого', 'сумма', 'всего', 
            'общая стоимость', 'полная стоимость', 'budget', 'total', 'cost'
        ]
    
    async def extract_comprehensive_data(
        self, 
        file_content: bytes, 
        filename: str,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Comprehensive PDF data extraction
        
        Args:
            file_content: PDF file content as bytes
            filename: Original filename
            use_cache: Whether to use caching
            
        Returns:
            Dict with extracted data including text, tables, budgets, etc.
        """
        # Check cache first
        cache_key = self._get_cache_key(file_content, filename)
        if use_cache:
            cached_result = await self._load_from_cache(cache_key)
            if cached_result:
                logger.info(f"📦 Using cached data for {filename}")
                return cached_result
        
        logger.info(f"🔍 Starting comprehensive PDF extraction for {filename}")
        
        extraction_result = {
            "filename": filename,
            "extraction_timestamp": datetime.now().isoformat(),
            "extraction_methods": [],
            "text": "",
            "tables": [],
            "budgets": [],
            "currencies": [],
            "structured_data": {},
            "metadata": {
                "page_count": 0,
                "file_size": len(file_content),
                "extraction_success": False,
                "processing_time": 0
            }
        }
        
        start_time = datetime.now()
        
        try:
            # Step 1: Try PyMuPDF for modern PDFs
            pymupdf_result = await self._extract_with_pymupdf(file_content)
            if pymupdf_result['success']:
                extraction_result['text'] = pymupdf_result['text']
                extraction_result['metadata']['page_count'] = pymupdf_result['page_count']
                extraction_result['extraction_methods'].append('pymupdf')
                logger.info("✅ PyMuPDF extraction successful")
            
            # Step 2: Use pdfplumber for table extraction
            pdfplumber_result = await self._extract_tables_with_pdfplumber(file_content)
            if pdfplumber_result['success']:
                extraction_result['tables'].extend(pdfplumber_result['tables'])
                if not extraction_result['text']:  # Fallback text
                    extraction_result['text'] = pdfplumber_result['text']
                extraction_result['extraction_methods'].append('pdfplumber')
                logger.info(f"✅ pdfplumber: extracted {len(pdfplumber_result['tables'])} tables")
            
            # Step 3: Try camelot for advanced table extraction
            camelot_result = await self._extract_tables_with_camelot(file_content, filename)
            if camelot_result['success']:
                extraction_result['tables'].extend(camelot_result['tables'])
                extraction_result['extraction_methods'].append('camelot')
                logger.info(f"✅ camelot: extracted {len(camelot_result['tables'])} additional tables")
            
            # Step 4: Fallback to PyPDF2 if needed
            if not extraction_result['text']:
                pypdf2_result = await self._extract_with_pypdf2(file_content)
                if pypdf2_result['success']:
                    extraction_result['text'] = pypdf2_result['text']
                    extraction_result['extraction_methods'].append('pypdf2')
                    logger.info("✅ PyPDF2 fallback successful")
            
            # Step 5: OCR fallback for scanned documents
            if not extraction_result['text'] and OCR_AVAILABLE:
                ocr_result = await self._extract_with_ocr(file_content)
                if ocr_result['success']:
                    extraction_result['text'] = ocr_result['text']
                    extraction_result['extraction_methods'].append('ocr')
                    logger.info("✅ OCR extraction successful")
            
            # Step 6: Extract financial data
            if extraction_result['text']:
                extraction_result['budgets'] = self._extract_budget_data(
                    extraction_result['text'], 
                    extraction_result['tables']
                )
                extraction_result['currencies'] = self._extract_currencies(extraction_result['text'])
                extraction_result['structured_data'] = self._structure_financial_data(
                    extraction_result['text'],
                    extraction_result['tables'],
                    extraction_result['budgets']
                )
            
            # Mark as successful if we extracted anything meaningful
            extraction_result['metadata']['extraction_success'] = bool(
                extraction_result['text'] or 
                extraction_result['tables'] or 
                extraction_result['budgets']
            )
            
        except Exception as e:
            logger.error(f"❌ Comprehensive extraction failed: {e}")
            extraction_result['metadata']['error'] = str(e)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        extraction_result['metadata']['processing_time'] = processing_time
        
        logger.info(f"📊 Extraction complete: {len(extraction_result['text'])} chars, "
                   f"{len(extraction_result['tables'])} tables, "
                   f"{len(extraction_result['budgets'])} budgets in {processing_time:.2f}s")
        
        # Cache successful results
        if use_cache and extraction_result['metadata']['extraction_success']:
            await self._save_to_cache(cache_key, extraction_result)
        
        return extraction_result
    
    async def _extract_with_pymupdf(self, file_content: bytes) -> Dict[str, Any]:
        """Extract text using PyMuPDF (fitz)"""
        try:
            pdf_document = fitz.open(stream=file_content, filetype="pdf")
            text = ""
            
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                page_text = page.get_text()
                if page_text:
                    text += page_text + "\n"
            
            pdf_document.close()
            
            return {
                'success': True,
                'text': text.strip(),
                'page_count': pdf_document.page_count if 'pdf_document' in locals() else 0
            }
            
        except Exception as e:
            logger.warning(f"⚠️ PyMuPDF extraction failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _extract_tables_with_pdfplumber(self, file_content: bytes) -> Dict[str, Any]:
        """Extract tables and text using pdfplumber"""
        try:
            tables = []
            text = ""
            
            with pdfplumber.open(BytesIO(file_content)) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Extract text
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                    
                    # Extract tables with improved settings
                    page_tables = page.extract_tables(table_settings={
                        "vertical_strategy": "lines_strict",
                        "horizontal_strategy": "lines_strict",
                        "snap_tolerance": 3,
                        "keep_blank_chars": True
                    })
                    
                    for table_idx, table in enumerate(page_tables or []):
                        if table and len(table) > 1:
                            # Clean and validate table
                            cleaned_table = self._clean_table_data(table)
                            if cleaned_table:
                                tables.append({
                                    "source": "pdfplumber",
                                    "page": page_num + 1,
                                    "table_id": f"pdfplumber_p{page_num}_{table_idx}",
                                    "data": cleaned_table,
                                    "row_count": len(cleaned_table),
                                    "col_count": len(cleaned_table[0]) if cleaned_table else 0,
                                    "has_numbers": self._table_has_numbers(cleaned_table)
                                })
            
            return {
                'success': True,
                'tables': tables,
                'text': text.strip()
            }
            
        except Exception as e:
            logger.warning(f"⚠️ pdfplumber extraction failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _extract_tables_with_camelot(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Extract tables using camelot-py for advanced table detection"""
        try:
            # Save to temporary file (camelot requires file path)
            temp_file = self.cache_dir / f"temp_{hash(filename)}_{datetime.now().timestamp()}.pdf"
            temp_file.write_bytes(file_content)
            
            tables = []
            
            try:
                # Try lattice method first (for tables with lines)
                camelot_tables = camelot.read_pdf(
                    str(temp_file), 
                    flavor='lattice',
                    pages='all'
                )
                
                for i, table in enumerate(camelot_tables):
                    if table.accuracy > 50:  # Only use tables with decent accuracy
                        df = table.df
                        if not df.empty:
                            table_data = df.values.tolist()
                            # Add headers if available
                            if not df.columns.empty:
                                table_data.insert(0, df.columns.tolist())
                            
                            tables.append({
                                "source": "camelot_lattice",
                                "table_id": f"camelot_lattice_{i}",
                                "data": table_data,
                                "row_count": len(table_data),
                                "col_count": len(table_data[0]) if table_data else 0,
                                "accuracy": table.accuracy,
                                "has_numbers": self._table_has_numbers(table_data)
                            })
                
                # Try stream method for tables without lines
                if len(tables) == 0:
                    camelot_tables = camelot.read_pdf(
                        str(temp_file), 
                        flavor='stream',
                        pages='all'
                    )
                    
                    for i, table in enumerate(camelot_tables):
                        if table.accuracy > 30:  # Lower threshold for stream
                            df = table.df
                            if not df.empty:
                                table_data = df.values.tolist()
                                tables.append({
                                    "source": "camelot_stream",
                                    "table_id": f"camelot_stream_{i}",
                                    "data": table_data,
                                    "row_count": len(table_data),
                                    "col_count": len(table_data[0]) if table_data else 0,
                                    "accuracy": table.accuracy,
                                    "has_numbers": self._table_has_numbers(table_data)
                                })
                
            finally:
                # Cleanup temp file
                if temp_file.exists():
                    temp_file.unlink()
            
            return {
                'success': True,
                'tables': tables
            }
            
        except Exception as e:
            logger.warning(f"⚠️ camelot extraction failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _extract_with_pypdf2(self, file_content: bytes) -> Dict[str, Any]:
        """Fallback extraction with PyPDF2"""
        try:
            pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
            text = ""
            
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            return {
                'success': True,
                'text': text.strip()
            }
            
        except Exception as e:
            logger.warning(f"⚠️ PyPDF2 extraction failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _extract_with_ocr(self, file_content: bytes) -> Dict[str, Any]:
        """OCR extraction for scanned PDFs"""
        if not OCR_AVAILABLE:
            return {'success': False, 'error': 'OCR not available'}
        
        try:
            # Convert PDF to images and OCR each page
            pdf_document = fitz.open(stream=file_content, filetype="pdf")
            text = ""
            
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                
                # Convert to image
                pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))  # High resolution
                img_data = pix.tobytes("png")
                img = Image.open(BytesIO(img_data))
                
                # OCR the image
                page_text = pytesseract.image_to_string(
                    img, 
                    lang='rus+eng',  # Support Russian and English
                    config='--psm 6'  # Assume uniform block of text
                )
                
                if page_text.strip():
                    text += page_text + "\n"
            
            pdf_document.close()
            
            return {
                'success': True,
                'text': text.strip()
            }
            
        except Exception as e:
            logger.warning(f"⚠️ OCR extraction failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def _clean_table_data(self, table_data: List[List[str]]) -> List[List[str]]:
        """Clean and validate table data"""
        if not table_data:
            return []
        
        cleaned_table = []
        
        for row in table_data:
            if not row:
                continue
                
            # Clean each cell
            cleaned_row = []
            for cell in row:
                if cell is None:
                    cleaned_cell = ""
                else:
                    cleaned_cell = str(cell).strip()
                cleaned_row.append(cleaned_cell)
            
            # Only keep rows that have at least one non-empty cell
            if any(cell for cell in cleaned_row):
                cleaned_table.append(cleaned_row)
        
        # Remove tables that are too small or empty
        if len(cleaned_table) < 2:
            return []
        
        return cleaned_table
    
    def _table_has_numbers(self, table_data: List[List[str]]) -> bool:
        """Check if table contains numerical data"""
        for row in table_data:
            for cell in row:
                if self._extract_number_from_text(str(cell)):
                    return True
        return False
    
    def _extract_budget_data(self, text: str, tables: List[Dict]) -> List[Dict[str, Any]]:
        """Extract budget/financial data from text and tables"""
        budgets = []
        
        # Extract from text
        for currency, patterns in self.currency_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE | re.UNICODE)
                
                for match in matches:
                    amount_str = match.group(1)
                    amount = self._parse_number(amount_str)
                    
                    if amount and amount > 1000:  # Minimum threshold for budgets
                        # Check if it's in budget context
                        context = text[max(0, match.start()-100):match.end()+100].lower()
                        is_budget_context = any(kw in context for kw in self.budget_keywords)
                        
                        budgets.append({
                            "amount": amount,
                            "currency": currency,
                            "formatted": f"{amount:,.2f} {currency}",
                            "original_text": match.group(0),
                            "context": context,
                            "source": "text",
                            "is_budget_context": is_budget_context,
                            "confidence": 0.8 if is_budget_context else 0.5,
                            "position": match.start()
                        })
        
        # Extract from tables
        for table in tables:
            if table.get('has_numbers'):
                table_budgets = self._extract_budget_from_table(table['data'])
                budgets.extend(table_budgets)
        
        # Sort by confidence and amount
        budgets.sort(key=lambda x: (x['confidence'], x['amount']), reverse=True)
        
        # Remove duplicates based on similar amounts
        unique_budgets = self._deduplicate_budgets(budgets)
        
        return unique_budgets
    
    def _extract_budget_from_table(self, table_data: List[List[str]]) -> List[Dict[str, Any]]:
        """Extract budget data from table structure"""
        budgets = []
        
        for row_idx, row in enumerate(table_data):
            for col_idx, cell in enumerate(row):
                amount = self._extract_number_from_text(str(cell))
                if amount and amount > 1000:
                    
                    # Detect currency from cell or nearby cells
                    currency = self._detect_currency_in_context(str(cell), row, table_data)
                    
                    # Get row context for description
                    row_context = " | ".join([str(c) for c in row if c])
                    
                    budgets.append({
                        "amount": amount,
                        "currency": currency or "RUB",  # Default to RUB
                        "formatted": f"{amount:,.2f} {currency or 'RUB'}",
                        "source": "table",
                        "table_position": f"row_{row_idx}_col_{col_idx}",
                        "row_context": row_context,
                        "confidence": 0.7,
                        "is_budget_context": True
                    })
        
        return budgets
    
    def _extract_currencies(self, text: str) -> List[Dict[str, Any]]:
        """Extract all currency mentions from text"""
        currencies = []
        
        for currency, patterns in self.currency_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE | re.UNICODE)
                
                for match in matches:
                    amount_str = match.group(1)
                    amount = self._parse_number(amount_str)
                    
                    if amount:
                        currencies.append({
                            "currency": currency,
                            "amount": amount,
                            "formatted": f"{amount:,.2f} {currency}",
                            "original_text": match.group(0),
                            "position": match.start(),
                            "context": text[max(0, match.start()-30):match.end()+30]
                        })
        
        return currencies
    
    def _parse_number(self, number_str: str) -> Optional[float]:
        """Parse number string in various formats"""
        if not number_str:
            return None
        
        # Remove all non-numeric characters except commas and periods
        clean_str = re.sub(r'[^\d,.]', '', number_str.strip())
        
        if not clean_str:
            return None
        
        try:
            # Handle different number formats
            if ',' in clean_str and '.' in clean_str:
                # Both separators present, determine which is decimal
                if clean_str.rfind(',') > clean_str.rfind('.'):
                    # Comma is decimal separator: 1.000,50
                    clean_str = clean_str.replace('.', '').replace(',', '.')
                else:
                    # Period is decimal separator: 1,000.50
                    clean_str = clean_str.replace(',', '')
            elif ',' in clean_str:
                # Only comma - could be thousands or decimal
                parts = clean_str.split(',')
                if len(parts[-1]) <= 2 and len(parts) > 1:
                    # Decimal separator: 1000,50
                    clean_str = clean_str.replace(',', '.')
                else:
                    # Thousands separator: 1,000,000
                    clean_str = clean_str.replace(',', '')
            
            return float(clean_str)
            
        except ValueError:
            return None
    
    def _extract_number_from_text(self, text: str) -> Optional[float]:
        """Extract first valid number from text"""
        for pattern in self.number_patterns:
            match = re.search(pattern, text)
            if match:
                return self._parse_number(match.group(1))
        return None
    
    def _detect_currency_in_context(
        self, 
        cell: str, 
        row: List[str], 
        table_data: List[List[str]]
    ) -> Optional[str]:
        """Detect currency from cell context"""
        
        # Check the cell itself
        for currency, patterns in self.currency_patterns.items():
            for pattern in patterns:
                if re.search(pattern, cell, re.IGNORECASE):
                    return currency
        
        # Check other cells in the same row
        row_text = " ".join([str(c) for c in row])
        for currency, patterns in self.currency_patterns.items():
            for pattern in patterns:
                if re.search(pattern, row_text, re.IGNORECASE):
                    return currency
        
        # Check table headers (first row)
        if table_data:
            header_text = " ".join([str(c) for c in table_data[0]])
            for currency, patterns in self.currency_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, header_text, re.IGNORECASE):
                        return currency
        
        return None
    
    def _structure_financial_data(
        self, 
        text: str, 
        tables: List[Dict], 
        budgets: List[Dict]
    ) -> Dict[str, Any]:
        """Structure financial data for analysis"""
        
        structured_data = {
            "total_budgets": len(budgets),
            "high_confidence_budgets": [b for b in budgets if b['confidence'] > 0.7],
            "currency_breakdown": {},
            "largest_amount": None,
            "smallest_amount": None,
            "table_count": len(tables),
            "has_structured_pricing": len([t for t in tables if t.get('has_numbers', False)]) > 0
        }
        
        if budgets:
            # Currency breakdown
            currency_counts = {}
            for budget in budgets:
                curr = budget['currency']
                if curr not in currency_counts:
                    currency_counts[curr] = {'count': 0, 'total_amount': 0}
                currency_counts[curr]['count'] += 1
                currency_counts[curr]['total_amount'] += budget['amount']
            
            structured_data['currency_breakdown'] = currency_counts
            
            # Min/Max amounts
            amounts = [b['amount'] for b in budgets]
            structured_data['largest_amount'] = max(amounts)
            structured_data['smallest_amount'] = min(amounts)
        
        return structured_data
    
    def _deduplicate_budgets(self, budgets: List[Dict]) -> List[Dict]:
        """Remove duplicate budget entries based on similar amounts"""
        if not budgets:
            return []
        
        unique_budgets = []
        
        for budget in budgets:
            is_duplicate = False
            
            for existing in unique_budgets:
                # Consider duplicates if amounts are within 5% of each other
                amount_diff = abs(budget['amount'] - existing['amount'])
                threshold = existing['amount'] * 0.05
                
                if amount_diff <= threshold and budget['currency'] == existing['currency']:
                    # Keep the one with higher confidence
                    if budget['confidence'] > existing['confidence']:
                        unique_budgets.remove(existing)
                        unique_budgets.append(budget)
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_budgets.append(budget)
        
        return unique_budgets
    
    def _get_cache_key(self, file_content: bytes, filename: str) -> str:
        """Generate cache key for file"""
        content_hash = hashlib.md5(file_content).hexdigest()
        return f"{filename}_{content_hash}.json"
    
    async def _load_from_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Load extraction result from cache"""
        cache_file = self.cache_dir / cache_key
        
        if cache_file.exists():
            try:
                with cache_file.open('r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load cache {cache_key}: {e}")
        
        return None
    
    async def _save_to_cache(self, cache_key: str, data: Dict[str, Any]) -> None:
        """Save extraction result to cache"""
        cache_file = self.cache_dir / cache_key
        
        try:
            with cache_file.open('w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.debug(f"Cached extraction result: {cache_key}")
        except Exception as e:
            logger.warning(f"Failed to save cache {cache_key}: {e}")

# Convenience function for easy usage
async def extract_pdf_data(
    file_content: bytes, 
    filename: str, 
    cache_dir: Optional[Path] = None
) -> Dict[str, Any]:
    """
    Extract comprehensive data from PDF file
    
    Args:
        file_content: PDF file content as bytes
        filename: Original filename
        cache_dir: Optional cache directory
        
    Returns:
        Dict with extracted text, tables, budgets, and metadata
    """
    extractor = EnhancedPDFExtractor(cache_dir)
    return await extractor.extract_comprehensive_data(file_content, filename)