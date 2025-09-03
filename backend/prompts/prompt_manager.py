#!/usr/bin/env python3
"""
Менеджер промптов - централизованное управление промптами для AI анализа
"""
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

class PromptManager:
    """Менеджер для загрузки и управления промптами"""
    
    def __init__(self, prompts_dir: Optional[Path] = None):
        """
        Инициализация менеджера промптов
        
        Args:
            prompts_dir: Директория с файлами промптов
        """
        if prompts_dir is None:
            # Автоматическое определение пути к папке prompts
            current_dir = Path(__file__).parent
            self.prompts_dir = current_dir
        else:
            self.prompts_dir = prompts_dir
            
        self._cache = {}  # Кэш загруженных промптов
        self._last_modified = {}  # Время последнего изменения файлов
        
        logger.info(f"PromptManager initialized with directory: {self.prompts_dir}")
    
    def load_prompt_config(self, prompt_type: str, force_reload: bool = False) -> Optional[Dict[str, Any]]:
        """
        Загрузка конфигурации промпта из JSON файла
        
        Args:
            prompt_type: Тип промпта (kp_analysis, tz_analysis, etc.)
            force_reload: Принудительная перезагрузка из файла
            
        Returns:
            Словарь с конфигурацией промпта или None при ошибке
        """
        prompt_file = self.prompts_dir / f"{prompt_type}.json"
        
        if not prompt_file.exists():
            logger.error(f"Prompt file not found: {prompt_file}")
            return None
        
        try:
            # Проверка необходимости перезагрузки
            current_modified = prompt_file.stat().st_mtime
            cache_key = str(prompt_file)
            
            if not force_reload and cache_key in self._cache:
                if self._last_modified.get(cache_key, 0) >= current_modified:
                    logger.debug(f"Using cached prompt config for {prompt_type}")
                    return self._cache[cache_key]
            
            # Загрузка из файла
            with open(prompt_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # Валидация структуры
            if not self._validate_prompt_config(config):
                logger.error(f"Invalid prompt configuration in {prompt_file}")
                return None
            
            # Обновление кэша
            self._cache[cache_key] = config
            self._last_modified[cache_key] = current_modified
            
            logger.info(f"Loaded prompt config: {config['name']} v{config['version']}")
            return config
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in {prompt_file}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error loading prompt config {prompt_file}: {str(e)}")
            return None
    
    def get_system_prompt(self, prompt_type: str) -> Optional[str]:
        """
        Получить системный промпт для указанного типа документа
        
        Args:
            prompt_type: Тип промпта
            
        Returns:
            Текст системного промпта или None
        """
        config = self.load_prompt_config(prompt_type)
        if not config:
            return None
        
        system_prompt = config.get('prompts', {}).get('system_prompt', {})
        return system_prompt.get('text')
    
    def get_user_prompt(self, prompt_type: str) -> Optional[str]:
        """
        Получить пользовательский промпт для указанного типа документа
        
        Args:
            prompt_type: Тип промпта
            
        Returns:
            Текст пользовательского промпта или None
        """
        config = self.load_prompt_config(prompt_type)
        if not config:
            return None
        
        user_prompt = config.get('prompts', {}).get('user_prompt', {})
        return user_prompt.get('text')
    
    def get_validation_prompt(self, prompt_type: str) -> Optional[str]:
        """
        Получить промпт для валидации результатов
        
        Args:
            prompt_type: Тип промпта
            
        Returns:
            Текст промпта валидации или None
        """
        config = self.load_prompt_config(prompt_type)
        if not config:
            return None
        
        validation_prompt = config.get('prompts', {}).get('validation_prompt', {})
        return validation_prompt.get('text')
    
    def get_prompt_settings(self, prompt_type: str) -> Dict[str, Any]:
        """
        Получить настройки для AI запроса (температура, макс токены, таймаут)
        
        Args:
            prompt_type: Тип промпта
            
        Returns:
            Словарь с настройками
        """
        config = self.load_prompt_config(prompt_type)
        if not config:
            return {}
        
        return config.get('settings', {})
    
    def get_all_prompts(self, prompt_type: str) -> Dict[str, str]:
        """
        Получить все промпты для указанного типа документа
        
        Args:
            prompt_type: Тип промпта
            
        Returns:
            Словарь со всеми промптами
        """
        config = self.load_prompt_config(prompt_type)
        if not config:
            return {}
        
        prompts = config.get('prompts', {})
        result = {}
        
        for prompt_name, prompt_data in prompts.items():
            if isinstance(prompt_data, dict) and 'text' in prompt_data:
                result[prompt_name] = prompt_data['text']
        
        return result
    
    def list_available_prompt_types(self) -> List[str]:
        """
        Получить список доступных типов промптов
        
        Returns:
            Список названий типов промптов
        """
        prompt_types = []
        
        for prompt_file in self.prompts_dir.glob("*.json"):
            if prompt_file.stem not in ['__init__', 'template']:
                prompt_types.append(prompt_file.stem)
        
        return sorted(prompt_types)
    
    def get_prompt_metadata(self, prompt_type: str) -> Dict[str, Any]:
        """
        Получить метаданные промпта
        
        Args:
            prompt_type: Тип промпта
            
        Returns:
            Словарь с метаданными
        """
        config = self.load_prompt_config(prompt_type)
        if not config:
            return {}
        
        metadata = {
            'name': config.get('name'),
            'description': config.get('description'),
            'version': config.get('version'),
            'created': config.get('created'),
            'metadata': config.get('metadata', {})
        }
        
        return metadata
    
    def _validate_prompt_config(self, config: Dict[str, Any]) -> bool:
        """
        Валидация структуры конфигурации промпта
        
        Args:
            config: Конфигурация для валидации
            
        Returns:
            True если конфигурация корректна
        """
        required_fields = ['name', 'description', 'version', 'prompts']
        
        for field in required_fields:
            if field not in config:
                logger.error(f"Missing required field: {field}")
                return False
        
        prompts = config.get('prompts', {})
        if not isinstance(prompts, dict):
            logger.error("'prompts' field must be a dictionary")
            return False
        
        # Проверка наличия обязательных промптов
        required_prompts = ['system_prompt', 'user_prompt']
        for prompt_name in required_prompts:
            if prompt_name not in prompts:
                logger.error(f"Missing required prompt: {prompt_name}")
                return False
            
            prompt_data = prompts[prompt_name]
            if not isinstance(prompt_data, dict) or 'text' not in prompt_data:
                logger.error(f"Invalid structure for prompt: {prompt_name}")
                return False
        
        return True
    
    def reload_all_prompts(self) -> int:
        """
        Принудительная перезагрузка всех промптов из файлов
        
        Returns:
            Количество успешно перезагруженных промптов
        """
        self._cache.clear()
        self._last_modified.clear()
        
        reloaded_count = 0
        prompt_types = self.list_available_prompt_types()
        
        for prompt_type in prompt_types:
            if self.load_prompt_config(prompt_type, force_reload=True):
                reloaded_count += 1
        
        logger.info(f"Reloaded {reloaded_count} prompt configurations")
        return reloaded_count
    
    def create_prompt_template(self, template_path: Path) -> bool:
        """
        Создание шаблона для нового промпта
        
        Args:
            template_path: Путь для сохранения шаблона
            
        Returns:
            True если шаблон создан успешно
        """
        template = {
            "name": "Template Prompt",
            "description": "Шаблон для создания нового промпта",
            "version": "1.0",
            "created": datetime.now().strftime("%Y-%m-%d"),
            "prompts": {
                "system_prompt": {
                    "text": "Системный промпт - описание роли и задач AI",
                    "role": "system"
                },
                "user_prompt": {
                    "text": "Пользовательский промпт - конкретные инструкции для анализа",
                    "role": "user"
                },
                "validation_prompt": {
                    "text": "Дополнительные проверки и валидации (опционально)",
                    "role": "user"
                }
            },
            "settings": {
                "temperature": 0.1,
                "max_tokens": 4000,
                "timeout": 120
            },
            "metadata": {
                "industry": "",
                "document_type": "",
                "language": "ru",
                "complexity": "medium"
            }
        }
        
        try:
            with open(template_path, 'w', encoding='utf-8') as f:
                json.dump(template, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Prompt template created: {template_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating prompt template: {str(e)}")
            return False


# Глобальный экземпляр менеджера промптов
prompt_manager = PromptManager()


def get_prompts_for_document_type(document_type: str) -> Dict[str, str]:
    """
    Получить промпты для указанного типа документа
    
    Args:
        document_type: Тип документа ('kp', 'tz', etc.)
        
    Returns:
        Словарь с промптами (system_prompt, user_prompt)
    """
    # Маппинг типов документов к типам промптов
    type_mapping = {
        'kp': 'kp_analysis',
        'tz': 'tz_analysis',
        'commercial_proposal': 'kp_analysis',
        'technical_specification': 'tz_analysis'
    }
    
    prompt_type = type_mapping.get(document_type, document_type + '_analysis')
    
    system_prompt = prompt_manager.get_system_prompt(prompt_type)
    user_prompt = prompt_manager.get_user_prompt(prompt_type)
    
    if not system_prompt or not user_prompt:
        logger.warning(f"Prompts not found for document type: {document_type}")
        # Возврат базовых промптов как fallback
        return {
            'system_prompt': f"Ты эксперт по анализу документов типа {document_type}.",
            'user_prompt': f"Проанализируй документ и верни результат в JSON формате."
        }
    
    return {
        'system_prompt': system_prompt,
        'user_prompt': user_prompt
    }


def get_ai_settings_for_document_type(document_type: str) -> Dict[str, Any]:
    """
    Получить настройки AI для указанного типа документа
    
    Args:
        document_type: Тип документа
        
    Returns:
        Словарь с настройками AI
    """
    type_mapping = {
        'kp': 'kp_analysis',
        'tz': 'tz_analysis'
    }
    
    prompt_type = type_mapping.get(document_type, document_type + '_analysis')
    settings = prompt_manager.get_prompt_settings(prompt_type)
    
    # Настройки по умолчанию
    default_settings = {
        'temperature': 0.1,
        'max_tokens': 4000,
        'timeout': 120
    }
    
    return {**default_settings, **settings}


if __name__ == "__main__":
    # Тест менеджера промптов
    print("=== TESTING PROMPT MANAGER ===")
    
    # Список доступных типов промптов
    available_types = prompt_manager.list_available_prompt_types()
    print(f"Available prompt types: {available_types}")
    
    # Тест загрузки промптов для КП
    if 'kp_analysis' in available_types:
        prompts = get_prompts_for_document_type('kp')
        print(f"\nKP Analysis System Prompt Length: {len(prompts['system_prompt'])}")
        print(f"KP Analysis User Prompt Length: {len(prompts['user_prompt'])}")
        
        settings = get_ai_settings_for_document_type('kp')
        print(f"KP Analysis Settings: {settings}")
    
    # Тест загрузки промптов для ТЗ
    if 'tz_analysis' in available_types:
        prompts = get_prompts_for_document_type('tz')
        print(f"\nTZ Analysis System Prompt Length: {len(prompts['system_prompt'])}")
        print(f"TZ Analysis User Prompt Length: {len(prompts['user_prompt'])}")
        
        settings = get_ai_settings_for_document_type('tz')
        print(f"TZ Analysis Settings: {settings}")
    
    print("\n=== PROMPT MANAGER TEST COMPLETED ===")