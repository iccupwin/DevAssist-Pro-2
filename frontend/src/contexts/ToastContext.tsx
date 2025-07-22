import React, { createContext, useContext, useState, ReactNode } from 'react';
import RegistrationToast from '../components/ui/RegistrationToast';

type ToastState = {
  isVisible: boolean;
  userName?: string;
  email?: string;
};

type ToastContextType = {
  showRegistrationToast: (userName: string, email: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({ isVisible: false });

  const showRegistrationToast = (userName: string, email: string) => {
    setToast({ isVisible: true, userName, email });
  };

  const handleClose = () => setToast({ ...toast, isVisible: false });

  return (
    <ToastContext.Provider value={{ showRegistrationToast }}>
      {children}
      <RegistrationToast
        isVisible={toast.isVisible}
        onClose={handleClose}
        userName={toast.userName}
        email={toast.email}
        duration={5000}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}; 