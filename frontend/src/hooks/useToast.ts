import { useState, useCallback } from 'react';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = {
      id,
      duration: 5000,
      type: 'info',
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
    
    return id;
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);
  
  // Convenience methods
  const success = useCallback((message: string, options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) => {
    return addToast({ ...options, message, type: 'success' });
  }, [addToast]);
  
  const error = useCallback((message: string, options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) => {
    return addToast({ ...options, message, type: 'error' });
  }, [addToast]);
  
  const warning = useCallback((message: string, options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) => {
    return addToast({ ...options, message, type: 'warning' });
  }, [addToast]);
  
  const info = useCallback((message: string, options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) => {
    return addToast({ ...options, message, type: 'info' });
  }, [addToast]);
  
  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info
  };
};

export default useToast;