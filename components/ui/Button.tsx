import React from 'react';
import { cn } from '../../utils/helpers';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', loading = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
      destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
      outline: 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800',
      ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
      link: 'text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400',
    };
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white dark:ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors',
          variants[variant],
          sizes[size],
          loading && 'opacity-75',
          className
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className={cn("animate-spin", size === 'icon' ? 'h-5 w-5' : 'h-4 w-4', children && size !== 'icon' ? 'mr-2' : '')} />}
        {!(loading && size === 'icon') && children}
      </button>
    );
  }
);
Button.displayName = 'Button';