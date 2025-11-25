import { memo, ReactNode } from "react";

interface AnimatedTransitionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
  duration?: number;
}

// 🎯 Animierte Transition-Komponente
export const AnimatedTransition = memo(({ 
  children, 
  className = "",
  delay = 0,
  direction = "fade",
  duration = 300
}: AnimatedTransitionProps) => {
  const getAnimationClasses = () => {
    const baseClasses = "transition-all ease-out";
    const durationClass = `duration-${duration}`;
    
    switch (direction) {
      case "up":
        return `${baseClasses} ${durationClass} animate-in slide-in-from-bottom-4 fade-in`;
      case "down":
        return `${baseClasses} ${durationClass} animate-in slide-in-from-top-4 fade-in`;
      case "left":
        return `${baseClasses} ${durationClass} animate-in slide-in-from-right-4 fade-in`;
      case "right":
        return `${baseClasses} ${durationClass} animate-in slide-in-from-left-4 fade-in`;
      case "fade":
      default:
        return `${baseClasses} ${durationClass} animate-in fade-in`;
    }
  };

  return (
    <div 
      className={`${getAnimationClasses()} ${className}`}
      style={{ 
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
});

AnimatedTransition.displayName = 'AnimatedTransition';
