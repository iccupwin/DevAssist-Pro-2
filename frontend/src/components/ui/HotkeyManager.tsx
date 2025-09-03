import React, { useState, useEffect } from 'react';
import { useHotkeys } from '../../hooks/useKeyboardNavigation';
import { Command, X, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HotkeyConfig {
  key: string;
  description: string;
  action: () => void;
  category?: string;
  global?: boolean;
}

interface HotkeyManagerProps {
  hotkeys: HotkeyConfig[];
  showHelp?: boolean;
  className?: string;
}

/**
 * Менеджер горячих клавиш с отображением справки
 */
export const HotkeyManager: React.FC<HotkeyManagerProps> = ({
  hotkeys,
  showHelp = false,
  className
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Создаем объект горячих клавиш для useHotkeys
  const hotkeyMap = React.useMemo(() => {
    const map: Record<string, () => void> = {};
    
    hotkeys.forEach(hotkey => {
      map[hotkey.key] = hotkey.action;
    });
    
    // Добавляем системные горячие клавиши
    map['cmd+/'] = () => setShowHelpModal(true);
    map['?'] = () => setShowHelpModal(true);
    map['escape'] = () => setShowHelpModal(false);
    
    return map;
  }, [hotkeys]);

  // Регистрируем горячие клавиши
  useHotkeys(hotkeyMap);

  // Группируем горячие клавиши по категориям
  const categorizedHotkeys = React.useMemo(() => {
    const categories: Record<string, HotkeyConfig[]> = {};
    
    hotkeys.forEach(hotkey => {
      const category = hotkey.category || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(hotkey);
    });
    
    return categories;
  }, [hotkeys]);

  // Фильтруем горячие клавиши по поисковому запросу
  const filteredHotkeys = React.useMemo(() => {
    if (!searchTerm) return categorizedHotkeys;
    
    const filtered: Record<string, HotkeyConfig[]> = {};
    
    Object.entries(categorizedHotkeys).forEach(([category, categoryHotkeys]) => {
      const matchingHotkeys = categoryHotkeys.filter(hotkey => 
        hotkey.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotkey.key.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingHotkeys.length > 0) {
        filtered[category] = matchingHotkeys;
      }
    });
    
    return filtered;
  }, [categorizedHotkeys, searchTerm]);

  // Форматирование отображения клавиши
  const formatKey = (key: string) => {
    return key
      .replace('cmd', '⌘')
      .replace('ctrl', 'Ctrl')
      .replace('alt', 'Alt')
      .replace('shift', 'Shift')
      .replace('+', ' + ')
      .toUpperCase();
  };

  if (!showHelp && !showHelpModal) {
    return null;
  }

  return (
    <div className={cn('hotkey-manager', className)}>
      {/* Модальное окно справки */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Заголовок */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Command className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Горячие клавиши
                </h2>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Поиск */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Поиск горячих клавиш..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            </div>

            {/* Список горячих клавиш */}
            <div className="p-6 overflow-y-auto max-h-96">
              {Object.entries(filteredHotkeys).map(([category, categoryHotkeys]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryHotkeys.map((hotkey, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {hotkey.description}
                        </span>
                        <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">
                          {formatKey(hotkey.key)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {Object.keys(filteredHotkeys).length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Горячие клавиши не найдены
                </div>
              )}
            </div>

            {/* Футер */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HelpCircle className="w-4 h-4" />
                <span>
                  Нажмите <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">?</kbd> или{' '}
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">⌘/</kbd> для открытия этого окна
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Индикатор горячих клавиш */}
      {showHelp && !showHelpModal && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          Нажмите <kbd className="bg-gray-700 px-1 py-0.5 rounded text-xs">?</kbd> для справки
        </div>
      )}
    </div>
  );
};

/**
 * Провайдер горячих клавиш для всего приложения
 */
export const GlobalHotkeyProvider: React.FC<{
  children: React.ReactNode;
  onNewAnalysis?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onToggleTheme?: () => void;
  onSearch?: () => void;
}> = ({ 
  children, 
  onNewAnalysis, 
  onOpenProfile, 
  onOpenSettings, 
  onToggleTheme,
  onSearch 
}) => {
  const globalHotkeys: HotkeyConfig[] = [
    {
      key: 'cmd+n',
      description: 'Новый анализ',
      action: () => onNewAnalysis?.(),
      category: 'Анализ'
    },
    {
      key: 'cmd+k',
      description: 'Поиск',
      action: () => onSearch?.(),
      category: 'Навигация'
    },
    {
      key: 'cmd+,',
      description: 'Настройки',
      action: () => onOpenSettings?.(),
      category: 'Приложение'
    },
    {
      key: 'cmd+u',
      description: 'Профиль пользователя',
      action: () => onOpenProfile?.(),
      category: 'Пользователь'
    },
    {
      key: 'cmd+shift+t',
      description: 'Переключить тему',
      action: () => onToggleTheme?.(),
      category: 'Приложение'
    },
    {
      key: 'cmd+shift+d',
      description: 'Перейти к дашборду',
      action: () => window.location.href = '/dashboard',
      category: 'Навигация'
    }
  ];

  return (
    <>
      {children}
      <HotkeyManager 
        hotkeys={globalHotkeys} 
        showHelp={process.env.NODE_ENV === 'development'} 
      />
    </>
  );
};

/**
 * Hook для компонентных горячих клавиш
 */
export const useComponentHotkeys = (componentHotkeys: HotkeyConfig[]) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleFocus = () => setIsActive(true);
    const handleBlur = () => setIsActive(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useHotkeys(
    componentHotkeys.reduce((acc, hotkey) => {
      acc[hotkey.key] = hotkey.action;
      return acc;
    }, {} as Record<string, () => void>),
    { enabled: isActive }
  );

  return {
    isActive,
    showHelp: () => console.log('Component hotkeys:', componentHotkeys)
  };
};

export default HotkeyManager;