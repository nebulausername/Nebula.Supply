import React from 'react';
import { cn } from '../../../utils/cn';

interface LiveBadgeProps {
  label?: string;
  color?: 'green' | 'red' | 'blue' | 'yellow';
  className?: string;
}

const colorMap: Record<Required<LiveBadgeProps>['color'], string> = {
  green: 'bg-green-400',
  red: 'bg-red-400',
  blue: 'bg-blue-400',
  yellow: 'bg-yellow-300'
};

export const LiveBadge: React.FC<LiveBadgeProps> = ({ label = 'Live', color = 'green', className }) => {
  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80', className)}>
      <span className={cn('relative flex h-2 w-2', colorMap[color])}>
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', colorMap[color])} />
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', colorMap[color])} />
      </span>
      {label}
    </div>
  );
};

