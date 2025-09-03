import React, { useEffect, useRef } from 'react';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { cn } from '../../lib/utils';

interface KeyboardNavigableListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isFocused: boolean) => React.ReactNode;
  onSelect?: (item: T, index: number) => void;
  onEscape?: () => void;
  className?: string;
  itemClassName?: string;
  focusedItemClassName?: string;
  orientation?: 'horizontal' | 'vertical' | 'both';
  circular?: boolean;
  ariaLabel: string;
}

/**
 * Список с поддержкой клавиатурной навигации
 */
export function KeyboardNavigableList<T>({
  items,
  renderItem,
  onSelect,
  onEscape,
  className,
  itemClassName,
  focusedItemClassName,
  orientation = 'vertical',
  circular = true,
  ariaLabel
}: KeyboardNavigableListProps<T>) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const { focusedIndex, setFocusedIndex } = useKeyboardNavigation(items, {
    circular,
    orientation,
    onSelect: (index, item) => onSelect?.(item, index),
    onEscape
  });

  // Фокусируем элемент при изменении индекса
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < itemRefs.current.length) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const handleItemClick = (index: number) => {
    setFocusedIndex(index);
    onSelect?.(items[index], index);
  };

  const handleItemFocus = (index: number) => {
    setFocusedIndex(index);
  };

  return (
    <div
      className={cn(
        'focus:outline-none',
        orientation === 'horizontal' && 'flex flex-row',
        orientation === 'vertical' && 'flex flex-col',
        className
      )}
      role="list"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const isFocused = index === focusedIndex;
        
        return (
          <div
            key={index}
            ref={el => itemRefs.current[index] = el}
            role="listitem"
            tabIndex={isFocused ? 0 : -1}
            onClick={() => handleItemClick(index)}
            onFocus={() => handleItemFocus(index)}
            className={cn(
              'focus:outline-none cursor-pointer',
              itemClassName,
              isFocused && focusedItemClassName
            )}
            aria-selected={isFocused}
          >
            {renderItem(item, index, isFocused)}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Меню с клавиатурной навигацией
 */
export const KeyboardNavigableMenu: React.FC<{
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }>;
  onClose?: () => void;
  className?: string;
}> = ({ items, onClose, className }) => {
  const enabledItems = items.filter(item => !item.disabled);

  return (
    <KeyboardNavigableList
      items={enabledItems}
      ariaLabel="Menu"
      onEscape={onClose}
      onSelect={(item) => item.onClick?.()}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1',
        className
      )}
      itemClassName="px-4 py-2 text-sm transition-colors"
      focusedItemClassName="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
      renderItem={(item, _, isFocused) => (
        <div className="flex items-center gap-3">
          {item.icon && (
            <span className={cn(
              'w-4 h-4',
              isFocused ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            )}>
              {item.icon}
            </span>
          )}
          <span className={cn(
            isFocused ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
          )}>
            {item.label}
          </span>
        </div>
      )}
    />
  );
};

/**
 * Табы с клавиатурной навигацией
 */
export const KeyboardNavigableTabs: React.FC<{
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
  }>;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}> = ({ tabs, defaultTab, onChange, className }) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

  const handleTabSelect = (tab: typeof tabs[0]) => {
    setActiveTab(tab.id);
    onChange?.(tab.id);
  };

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={cn('w-full', className)}>
      <KeyboardNavigableList
        items={tabs}
        ariaLabel="Tabs"
        orientation="horizontal"
        onSelect={handleTabSelect}
        className="flex border-b border-gray-200 dark:border-gray-700"
        itemClassName="px-4 py-2 text-sm font-medium transition-colors border-b-2 border-transparent"
        focusedItemClassName="text-blue-600 dark:text-blue-400"
        renderItem={(tab, _, isFocused) => {
          const isActive = tab.id === activeTab;
          
          return (
            <div
              className={cn(
                'px-4 py-2',
                isActive && 'border-b-2 border-blue-600 dark:border-blue-400',
                isFocused && 'ring-2 ring-blue-500 ring-offset-2'
              )}
              role="tab"
              aria-selected={isActive}
            >
              {tab.label}
            </div>
          );
        }}
      />
      
      <div
        role="tabpanel"
        className="mt-4"
        aria-label={`${activeTab} content`}
      >
        {activeContent}
      </div>
    </div>
  );
};

/**
 * Grid с клавиатурной навигацией
 */
export const KeyboardNavigableGrid: React.FC<{
  items: any[];
  columns: number;
  renderCell: (item: any, index: number, isFocused: boolean) => React.ReactNode;
  onSelect?: (item: any, index: number) => void;
  gap?: number;
  className?: string;
}> = ({ items, columns, renderCell, onSelect, gap = 4, className }) => {
  return (
    <KeyboardNavigableList
      items={items}
      ariaLabel="Grid"
      orientation="both"
      onSelect={onSelect}
      className={cn(
        'grid',
        className
      )}
      itemClassName="focus:ring-2 focus:ring-blue-500 rounded-lg transition-all"
      focusedItemClassName="scale-105 shadow-lg"
      renderItem={renderCell}
    />
  );
};

export default KeyboardNavigableList;