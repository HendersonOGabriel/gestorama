import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const focusableElementsSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, className, ...props }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onOpenChange(false);
    }
    if (event.key === 'Tab') {
      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(focusableElementsSelector);
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    }
  }, [onOpenChange]);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement;
    const rootElement = document.getElementById('root');

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(focusableElementsSelector);
        firstFocusable?.focus();
      }, 100);
      
      rootElement?.setAttribute('aria-hidden', 'true');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus();
      rootElement?.removeAttribute('aria-hidden');
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={cn(
          "relative flex flex-col w-full max-w-lg max-h-[90vh] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-lg rounded-lg",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
      >
        {children}
         <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-9 w-9 rounded-full"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Button>
      </div>
    </div>
  );
};

export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn("flex-1 overflow-y-auto min-h-0", className)} {...props}>{children}</div>
);

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div className="mb-4 text-center" {...props}>{children}</div>
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, ...props }) => (
  <h2 className="text-xl font-semibold" {...props}>{children}</h2>
);

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn("flex justify-end gap-2 pt-4", className)} {...props}>{children}</div>
);