import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BadgeInfo, AlertTriangle, PartyPopper, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface Notification {
  id: string;
  type: string;
  message: string;
}

interface NotificationBellProps {
  notifications: Notification[];
  onClear: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications = [], onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClear();
  }, [onClear]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
       if (event.key === 'Tab') {
          const focusableElements = dropdownRef.current?.querySelectorAll<HTMLElement>('button');
          if (!focusableElements || focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (!event.shiftKey && document.activeElement === lastElement) {
              firstElement.focus();
              event.preventDefault();
          }
          if (event.shiftKey && document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
          }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => dropdownRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success': return <PartyPopper className="w-5 h-5 text-green-500" />;
      default: return <BadgeInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const notificationCount = notifications.length;

  return (
    <div className="relative">
      <Button 
        ref={triggerRef}
        variant="ghost" 
        size="icon" 
        onClick={handleToggle} 
        className="relative"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={notificationCount > 0 ? `${notificationCount} novas notificações` : 'Nenhuma notificação nova'}
      >
        <Bell className="w-5 h-5" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900" aria-hidden="true">
            {notificationCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
        <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div 
            ref={dropdownRef}
            className="absolute top-12 right-0 z-50 w-80 max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg flex flex-col" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notifications-heading"
            tabIndex={-1}
          >
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h4 id="notifications-heading" className="font-semibold">Notificações</h4>
              {notificationCount > 0 && (
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={onClear}>Limpar tudo</Button>
              )}
            </div>
            {notificationCount === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">Nenhuma notificação nova.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 flex-1 overflow-y-auto">
                {notifications.map(notif => (
                  <div key={notif.id} className="p-3 flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1"><p className="text-sm leading-relaxed">{notif.message}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;