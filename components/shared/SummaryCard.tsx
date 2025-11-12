import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../utils/helpers';

interface SummaryCardProps {
  title: string;
  value: string;
  // FIX: Explicitly typed the icon prop to ensure it accepts a className, resolving a TypeScript error where icon.props was treated as 'unknown'.
  icon: React.ReactElement<{ className?: string }>;
  colorClass?: string;
  className?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, colorClass = 'text-indigo-500', className }) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</CardTitle>
      {/* FIX: Removed colorClass from the icon span to allow the icon itself (e.g., ChangeIndicator) to control its color. */}
      <span>
        {React.cloneElement(icon, { className: cn('w-5 h-5', icon.props.className) })}
      </span>
    </CardHeader>
    <CardContent className="text-center">
      <div className={`text-lg sm:text-xl font-bold ${colorClass} break-words`}>{value}</div>
    </CardContent>
  </Card>
);

export default SummaryCard;