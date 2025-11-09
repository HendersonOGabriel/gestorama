import React from 'react';
import { cn } from '../../utils/helpers';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', onCheckedChange, ...props }, ref) => {
    
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      // Call the custom onCheckedChange handler with the boolean value
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
      // Call the original onChange handler if it was passed in props
      if (props.onChange) {
        props.onChange(event);
      }
    };
    
    return (
      <input 
        type="checkbox"
        ref={ref}
        className={cn("h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:checked:bg-indigo-500 dark:checked:border-indigo-500", className)}
        {...props}
        onChange={handleChange}
      />
    );
  }
);
Checkbox.displayName = 'Checkbox';
