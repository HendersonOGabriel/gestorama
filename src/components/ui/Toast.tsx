import React, { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: ToastProps[];
  removeToast: (id: string) => void;
}

const Toast: React.FC<ToastProps & { onDismiss: (id: string) => void }> = ({ id, message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 5000); // 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertTriangle className="w-5 h-5 text-red-500" />,
  };

  const baseClasses = 'relative w-full max-w-sm p-4 overflow-hidden rounded-lg shadow-lg pointer-events-auto animate-toast-in';
  const typeClasses = {
    success: 'bg-green-50 dark:bg-green-900/50 border-l-4 border-green-500',
    error: 'bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500',
  };

  return (
    <div className={cn(baseClasses, typeClasses[type])}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 flex-1">
          <p className={cn('text-sm font-medium', type === 'error' ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200')}>
            {type === 'error' ? 'Erro' : 'Sucesso'}
          </p>
          <p className={cn('mt-1 text-sm', type === 'error' ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300')}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => onDismiss(id)}
            className={cn('inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2', type === 'error' ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-800 focus:ring-red-600 focus:ring-offset-red-50' : 'text-green-500 hover:bg-green-100 dark:hover:bg-green-800 focus:ring-green-600 focus:ring-offset-green-50')}
          >
            <span className="sr-only">Fechar</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};


export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={removeToast} />
        ))}
      </div>
    </div>
  );
};
