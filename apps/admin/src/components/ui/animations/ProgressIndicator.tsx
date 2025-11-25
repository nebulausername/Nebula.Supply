import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

interface ProgressIndicatorProps {
  value: number;
  label?: string;
  className?: string;
  color?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  label,
  className,
  color = '#38bdf8'
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: color }}
          animate={{ width: `${Math.min(100, Math.max(0, internalValue))}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-white/60">{Math.round(internalValue)}%</p>
    </div>
  );
};

