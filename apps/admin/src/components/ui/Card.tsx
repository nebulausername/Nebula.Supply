import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { useTouchFeedback } from '../../hooks/useTouchFeedback';
import { useMobile } from '../../hooks/useMobile';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'elevated' | 'glassmorphic';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', interactive = false, padding = 'md', onClick, ...props }, ref) => {
    const { triggerHaptic } = useTouchFeedback();
    const { isTouch } = useMobile();

    const variants = {
      default: 'bg-surface/70 border border-white/5 rounded-2xl',
      outline: 'bg-transparent border border-white/10 rounded-xl',
      ghost: 'bg-transparent border-none rounded-xl',
      elevated: 'bg-surface border border-white/10 rounded-2xl shadow-lg',
      glassmorphic: 'bg-black/40 border border-neon/20 backdrop-blur-xl rounded-2xl'
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };

    const interactiveClasses = interactive
      ? 'cursor-pointer transition-all duration-200 hover:border-neon/30 hover:shadow-neon active:scale-[0.98]'
      : '';

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (interactive && isTouch) {
        triggerHaptic('light');
      }
      onClick?.(e);
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          paddingClasses[padding],
          interactiveClasses,
          className
        )}
        onClick={interactive ? handleClick : onClick}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
