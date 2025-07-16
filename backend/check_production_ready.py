#!/usr/bin/env python3
"""
🚨 Скрипт проверки готовности к production
DevAssist Pro - Production Security Validator
"""

import os
import sys
import re
from pathlib import Path
from typing import List, Dict, Any

def check_environment_variables() -> Dict[str, Any]:
    """Проверка переменных окружения"""
    errors = []
    warnings = []
    
    # Критичные переменные
    critical_vars = [
        'JWT_SECRET_KEY',
        'DATABASE_URL', 
        'REDIS_URL',
        'ANTHROPIC_API_KEY',
        'ADMIN_PASSWORD'
    ]
    
    # Проверка наличия критичных переменных
    for var in critical_vars:
        if not os.getenv(var):
            errors.append(f"❌ Отсутствует переменная окружения: {var}")
        else:
            # Проверка на дефолтные значения
            value = os.getenv(var)
            if var == 'JWT_SECRET_KEY' and 'change_in_production' in value:
                errors.append(f"❌ {var} содержит дефолтное значение!")
            elif var == 'ADMIN_PASSWORD' and value == 'admin123':
                errors.append(f"❌ {var} содержит дефолтный пароль!")
            elif var == 'DATABASE_URL' and 'devassist_password' in value:
                errors.append(f"❌ {var} содержит дефолтный пароль!")
            elif var == 'REDIS_URL' and 'redis_password' in value:
                errors.append(f"❌ {var} содержит дефолтный пароль!")
            elif var == 'ANTHROPIC_API_KEY' and 'your_' in value:
                warnings.append(f"⚠️ {var} может содержать placeholder")
    
    # Проверка environment
    env = os.getenv('ENVIRONMENT', 'development')
    if env == 'production':
        # Дополнительные проверки для production
        if 'localhost' in os.getenv('ALLOWED_ORIGINS', ''):
            errors.append("❌ ALLOWED_ORIGINS не может содержать localhost в production!")
        
        if os.getenv('DEBUG', 'false').lower() == 'true':
            warnings.append("⚠️ DEBUG не должен быть включен в production")
    
    return {
        'errors': errors,
        'warnings': warnings,
        'environment': env
    }

def check_hardcoded_secrets() -> Dict[str, Any]:
    """Поиск hardcoded секретов в коде"""
    errors = []
    warnings = []
    
    # Паттерны для поиска
    patterns = [
        (r'password.*=.*["\'].*["\']', 'Hardcoded password found'),
        (r'secret.*=.*["\'].*["\']', 'Hardcoded secret found'),
        (r'api_key.*=.*["\'].*["\']', 'Hardcoded API key found'),
        (r'localhost:\d+', 'Hardcoded localhost URL found'),
        (r'admin123', 'Default admin password found'),
        (r'devassist_password', 'Default database password found'),
        (r'redis_password', 'Default redis password found'),
    ]
    
    # Поиск в Python файлах
    for py_file in Path('.').rglob('*.py'):
        if 'check_production_ready.py' in str(py_file):
            continue
            
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()
                for pattern, message in patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        errors.append(f"❌ {py_file}: {message}")
        except Exception as e:
            warnings.append(f"⚠️ Не удалось прочитать {py_file}: {e}")
    
    return {
        'errors': errors,
        'warnings': warnings
    }

def check_config_files() -> Dict[str, Any]:
    """Проверка конфигурационных файлов"""
    errors = []
    warnings = []
    
    # Проверка .env файлов
    env_files = ['.env', '.env.production', '.env.local']
    for env_file in env_files:
        if os.path.exists(env_file):
            try:
                with open(env_file, 'r') as f:
                    content = f.read()
                    if 'admin123' in content:
                        errors.append(f"❌ {env_file} содержит дефолтный пароль admin123")
                    if 'your_' in content and 'api_key' in content:
                        warnings.append(f"⚠️ {env_file} может содержать placeholder API keys")
            except Exception as e:
                warnings.append(f"⚠️ Не удалось прочитать {env_file}: {e}")
    
    # Проверка что .env не в git
    if os.path.exists('.gitignore'):
        with open('.gitignore', 'r') as f:
            gitignore_content = f.read()
            if '.env' not in gitignore_content:
                errors.append("❌ .env файл не добавлен в .gitignore!")
    
    return {
        'errors': errors,
        'warnings': warnings
    }

def check_dependencies() -> Dict[str, Any]:
    """Проверка зависимостей"""
    errors = []
    warnings = []
    
    # Проверка requirements.txt
    if os.path.exists('requirements.txt'):
        with open('requirements.txt', 'r') as f:
            reqs = f.read()
            # Проверка на development зависимости
            dev_deps = ['pytest', 'debug', 'test']
            for dep in dev_deps:
                if dep in reqs.lower():
                    warnings.append(f"⚠️ requirements.txt содержит dev зависимость: {dep}")
    
    return {
        'errors': errors,
        'warnings': warnings
    }

def main():
    """Основная функция проверки"""
    print("🔍 Проверка готовности DevAssist Pro к production...")
    print("=" * 60)
    
    all_errors = []
    all_warnings = []
    
    # Проверка переменных окружения
    print("\n1. Проверка переменных окружения...")
    env_check = check_environment_variables()
    all_errors.extend(env_check['errors'])
    all_warnings.extend(env_check['warnings'])
    
    # Проверка hardcoded секретов
    print("\n2. Поиск hardcoded секретов...")
    secrets_check = check_hardcoded_secrets()
    all_errors.extend(secrets_check['errors'])
    all_warnings.extend(secrets_check['warnings'])
    
    # Проверка конфигурационных файлов
    print("\n3. Проверка конфигурационных файлов...")
    config_check = check_config_files()
    all_errors.extend(config_check['errors'])
    all_warnings.extend(config_check['warnings'])
    
    # Проверка зависимостей
    print("\n4. Проверка зависимостей...")
    deps_check = check_dependencies()
    all_errors.extend(deps_check['errors'])
    all_warnings.extend(deps_check['warnings'])
    
    # Результаты
    print("\n" + "=" * 60)
    print("📊 РЕЗУЛЬТАТЫ ПРОВЕРКИ:")
    print("=" * 60)
    
    if all_errors:
        print("\n🚨 КРИТИЧЕСКИЕ ОШИБКИ:")
        for error in all_errors:
            print(f"  {error}")
    
    if all_warnings:
        print("\n⚠️ ПРЕДУПРЕЖДЕНИЯ:")
        for warning in all_warnings:
            print(f"  {warning}")
    
    if not all_errors and not all_warnings:
        print("\n✅ Проект готов к production!")
        return 0
    elif not all_errors:
        print("\n✅ Критических ошибок не найдено, но есть предупреждения")
        return 0
    else:
        print(f"\n❌ Найдено {len(all_errors)} критических ошибок!")
        print("❌ Проект НЕ готов к production!")
        return 1

if __name__ == "__main__":
    sys.exit(main())