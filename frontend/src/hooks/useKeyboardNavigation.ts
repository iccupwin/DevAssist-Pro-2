import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook для управления клавиатурной навигацией
 */
export const useKeyboardNavigation = (
  items: any[],
  options?: {
    circular?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    onSelect?: (index: number, item: any) => void;
    onEscape?: () => void;
    disabled?: boolean;
  }
) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const {
    circular = true,
    orientation = 'vertical',
    onSelect,
    onEscape,
    disabled = false
  } = options || {};

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled || items.length === 0) return;

    const { key } = event;
    let newIndex = focusedIndex;

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = focusedIndex + 1;
          if (newIndex >= items.length) {
            newIndex = circular ? 0 : items.length - 1;
          }
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = focusedIndex - 1;
          if (newIndex < 0) {
            newIndex = circular ? items.length - 1 : 0;
          }
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = focusedIndex + 1;
          if (newIndex >= items.length) {
            newIndex = circular ? 0 : items.length - 1;
          }
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = focusedIndex - 1;
          if (newIndex < 0) {
            newIndex = circular ? items.length - 1 : 0;
          }
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          onSelect?.(focusedIndex, items[focusedIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        onEscape?.();
        setFocusedIndex(-1);
        break;

      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;

      default:
        return;
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
    }
  }, [focusedIndex, items, circular, orientation, onSelect, onEscape, disabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    focusedIndex,
    setFocusedIndex,
    resetFocus: () => setFocusedIndex(-1),
    focusNext: () => {
      const newIndex = focusedIndex + 1;
      setFocusedIndex(newIndex >= items.length ? (circular ? 0 : items.length - 1) : newIndex);
    },
    focusPrevious: () => {
      const newIndex = focusedIndex - 1;
      setFocusedIndex(newIndex < 0 ? (circular ? items.length - 1 : 0) : newIndex);
    }
  };
};

/**
 * Hook для управления фокусом элемента
 */
export const useFocusManagement = () => {
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);

  const registerElement = useCallback((element: HTMLElement | null) => {
    if (element && !focusableElementsRef.current.includes(element)) {
      focusableElementsRef.current.push(element);
    }
  }, []);

  const unregisterElement = useCallback((element: HTMLElement) => {
    const index = focusableElementsRef.current.indexOf(element);
    if (index > -1) {
      focusableElementsRef.current.splice(index, 1);
    }
  }, []);

  const focusElement = useCallback((index: number) => {
    const element = focusableElementsRef.current[index];
    if (element) {
      element.focus();
      setCurrentFocusIndex(index);
    }
  }, []);

  const focusNext = useCallback(() => {
    const nextIndex = (currentFocusIndex + 1) % focusableElementsRef.current.length;
    focusElement(nextIndex);
  }, [currentFocusIndex, focusElement]);

  const focusPrevious = useCallback(() => {
    const prevIndex = currentFocusIndex === 0 
      ? focusableElementsRef.current.length - 1 
      : currentFocusIndex - 1;
    focusElement(prevIndex);
  }, [currentFocusIndex, focusElement]);

  return {
    registerElement,
    unregisterElement,
    focusElement,
    focusNext,
    focusPrevious,
    currentFocusIndex
  };
};

/**
 * Hook для ловушки фокуса (focus trap)
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Сохраняем текущий активный элемент
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Фокусируем первый элемент
    firstElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Возвращаем фокус на предыдущий элемент
      previousActiveElement.current?.focus();
    };
  }, [isActive]);

  return containerRef;
};

/**
 * Hook для горячих клавиш
 */
export const useHotkeys = (
  hotkeys: Record<string, () => void>,
  options?: {
    enabled?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
  }
) => {
  const { enabled = true, preventDefault = true, stopPropagation = false } = options || {};

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = getHotkeyString(event);
      const handler = hotkeys[key];

      if (handler) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hotkeys, enabled, preventDefault, stopPropagation]);
};

/**
 * Получение строки горячей клавиши из события
 */
const getHotkeyString = (event: KeyboardEvent): string => {
  const parts: string[] = [];
  
  if (event.ctrlKey || event.metaKey) parts.push('cmd');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  
  const key = event.key?.toLowerCase() || '';
  if (key) {
    parts.push(key);
  }
  
  return parts.join('+');
};

/**
 * Hook для роуминга фокуса (перемещение фокуса между секциями)
 */
export const useFocusRoaming = (sections: string[]) => {
  const [currentSection, setCurrentSection] = useState(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'F6') {
      event.preventDefault();
      const nextSection = (currentSection + 1) % sections.length;
      setCurrentSection(nextSection);
      
      // Фокусируем первый элемент в секции
      const sectionElement = document.querySelector(`[data-section="${sections[nextSection]}"]`);
      const firstFocusable = sectionElement?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [currentSection, sections]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    currentSection,
    focusSection: (index: number) => {
      if (index >= 0 && index < sections.length) {
        setCurrentSection(index);
      }
    }
  };
};

export default useKeyboardNavigation;