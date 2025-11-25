import { ReactNode } from 'react';
import { useMobileOptimizations } from '../MobileOptimizations';
import { useMobilePerformance } from './MobilePerformanceMonitor';
import { cn } from '../../utils/cn';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  enablePullToRefresh?: boolean;
  enableSwipeGestures?: boolean;
  showHeader?: boolean;
  headerTitle?: string;
  headerActions?: ReactNode;
}

export const MobileLayout = ({
  children,
  className,
  enablePullToRefresh = true,
  enableSwipeGestures = false,
  showHeader = true,
  headerTitle = "Nebula",
  headerActions
}: MobileLayoutProps) => {
  const { isMobile, screenSize } = useMobileOptimizations();
  const { shouldReduceAnimations, shouldUseSimpleLayout } = useMobilePerformance();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className={cn(
      "flex flex-col min-h-screen",
      "bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505]",
      "safe-area-full",
      className
    )}>
      {/* Header */}
      {showHeader && (
        <header className={cn(
          "sticky top-0 z-40",
          "bg-black/80 backdrop-blur-xl",
          "border-b border-white/10",
          "safe-top",
          shouldReduceAnimations && "transition-none"
        )}>
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className={cn(
              "text-xl font-bold gradient-text",
              shouldUseSimpleLayout && "text-lg"
            )}>
              {headerTitle}
            </h1>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto",
        "scrollbar-hide",
        enableSwipeGestures && "swipe-enabled",
        enablePullToRefresh && "pull-to-refresh"
      )}>
        <div className={cn(
          "pb-20", // Space for bottom nav
          shouldUseSimpleLayout && "px-2"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
};

// 🎯 Mobile Page Wrapper
export const MobilePage = ({ 
  children, 
  title,
  actions,
  className 
}: { 
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
}) => {
  return (
    <MobileLayout
      headerTitle={title}
      headerActions={actions}
      className={className}
    >
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </MobileLayout>
  );
};

// 🎯 Mobile Card Component
export const MobileCard = ({ 
  children, 
  className,
  interactive = false,
  onClick 
}: { 
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}) => {
  return (
    <div
      className={cn(
        "glass-effect rounded-2xl p-4",
        "border border-white/10",
        "shadow-lg shadow-black/20",
        interactive && [
          "active-feedback cursor-pointer",
          "hover:bg-white/5",
          "transition-all duration-200"
        ],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// 🎯 Mobile Button Component
export const MobileButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false
}: { 
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const baseClasses = cn(
    "touch-target rounded-xl font-semibold",
    "transition-all duration-200",
    "active:scale-95",
    !disabled && "active-feedback",
    disabled && "opacity-50 cursor-not-allowed"
  );

  const variantClasses = {
    primary: "bg-gradient-to-r from-[#0BF7BC] to-[#61F4F4] text-black shadow-lg shadow-[#0BF7BC]/30",
    secondary: "bg-white/10 text-white border border-white/20",
    danger: "bg-red-500/20 text-red-400 border border-red-500/30",
    ghost: "text-white hover:bg-white/10"
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg"
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};


