import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Badge } from '../Badge';

export interface ActivityStreamItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  tone?: 'success' | 'warning' | 'info';
}

interface ActivityStreamProps {
  items: ActivityStreamItem[];
  className?: string;
}

const toneColors: Record<NonNullable<ActivityStreamItem['tone']>, string> = {
  success: 'border-green-400/40 text-green-200',
  warning: 'border-yellow-400/40 text-yellow-200',
  info: 'border-blue-400/40 text-blue-200'
};

export const ActivityStream: React.FC<ActivityStreamProps> = ({ items, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-white">{item.title}</p>
              {item.timestamp && <span className="text-[11px] text-muted-foreground">{item.timestamp}</span>}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            )}
            {item.tone && (
              <Badge variant="outline" className={cn('mt-2 text-[11px]', toneColors[item.tone])}> {item.tone} </Badge>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
