
import React from 'react';
import { cn } from '../../utils/helpers';

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300', className)}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';