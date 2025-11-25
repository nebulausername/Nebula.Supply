import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { useTouchFeedback } from '../../hooks/useTouchFeedback';
import { useMobile } from '../../hooks/useMobile';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'success';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  enableHaptic?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', enableHaptic = true, onClick, ...props }, ref) => {
    const { triggerHaptic } = useTouchFeedback();
    const { isTouch } = useMobile();

    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95 hover:scale-105 hover:shadow-lg';

    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      success: 'bg-green-500 text-white hover:bg-green-600'
    };

    const sizeClasses = {
      sm: 'h-9 px-3 text-sm min-h-touch min-w-touch',
      md: 'h-10 py-2 px-4 min-h-touch min-w-touch',
      lg: 'h-11 px-8 min-h-touch-lg min-w-touch-lg'
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableHaptic && isTouch) {
        triggerHaptic('light');
      }
      onClick?.(e);
    };

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        onClick={handleClick}
        aria-label={props['aria-label'] || (typeof props.children === 'string' ? props.children : undefined)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';


