import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

export function TypingIndicator({ userName, className }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('flex items-center gap-2 text-xs text-muted px-4 py-2', className)}
    >
      <div className="flex items-center gap-1">
        <User className="h-3 w-3" />
        <span>{userName || 'Someone'}</span>
      </div>
      <span>is typing</span>
      <div className="flex gap-1 ml-1">
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
          className="w-1 h-1 rounded-full bg-muted"
        />
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
          className="w-1 h-1 rounded-full bg-muted"
        />
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
          className="w-1 h-1 rounded-full bg-muted"
        />
      </div>
    </motion.div>
  );
}

