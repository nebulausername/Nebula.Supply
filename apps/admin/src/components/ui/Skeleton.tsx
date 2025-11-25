import { cn } from '../../utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  className,
  style,
  ...props
}: SkeletonProps) {
  const baseClasses = 'bg-white/10 rounded';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1rem' : '1.5rem'),
        ...style
      }}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  );
}

// Skeleton Loader Components
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 space-y-3", className)}>
      <Skeleton variant="rectangular" height={200} />
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width="25%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} variant="text" width="25%" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonTableRow({ columns = 4, className }: { columns?: number; className?: string }) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, j) => (
        <td key={j} className="px-4 py-3">
          <Skeleton variant="text" width="100%" />
        </td>
      ))}
    </tr>
  );
}

// Loading States Components
export function LoadingSpinner({ 
  size = 'md', 
  className 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-white/20 border-t-neon',
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

export function LoadingOverlay({ 
  message = 'Loading...',
  showSpinner = true 
}: { 
  message?: string;
  showSpinner?: boolean;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-3">
        {showSpinner && <LoadingSpinner size="lg" />}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function LoadingButton({
  isLoading,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
}) {
  return (
    <button
      className={cn('relative', className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </span>
      )}
      <span className={cn(isLoading && 'opacity-0')}>{children}</span>
    </button>
  );
}

// Progress Indicator
export function ProgressIndicator({
  progress,
  showPercentage = true,
  className,
}: {
  progress: number; // 0-100
  showPercentage?: boolean;
  className?: string;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-neon transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-muted-foreground text-right">
          {Math.round(clampedProgress)}%
        </p>
      )}
    </div>
  );
}

// Inline Loading State
export function InlineLoading({ 
  message = 'Loading...',
  size = 'sm'
}: { 
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <LoadingSpinner size={size} />
      <span className="text-sm">{message}</span>
    </div>
  );
}
