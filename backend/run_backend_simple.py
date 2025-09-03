#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Простой запуск backend без проблем с кодировкой
"""

import os
import sys
import uvicorn
from pathlib import Path

# Добавляем пути
sys.path.insert(0, str(Path(__file__).parent))

# Устанавливаем переменные окружения для предотвращения проблем с кодировкой
os.environ['PYTHONIOENCODING'] = 'utf-8'

print("Starting DevAssist Pro Backend...")
print("Available endpoints:")
print("  - Health: http://localhost:8001/health")
print("  - PDF Test: http://localhost:8001/api/test/cyrillic-pdf")
print("  - Document Upload: http://localhost:8001/api/documents/upload")

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info"
    )