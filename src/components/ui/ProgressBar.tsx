import React from 'react';
import { cn } from '../../utils/helpers';

interface ProgressBarProps {
  value: number; // The progress value (0 to 100)
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className }) => {
  const progress = Math.max(0, Math.min(100, value)); // Clamp value between 0 and 100

  return (
    <div className={cn("w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden", className)}>
      <div
        className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
