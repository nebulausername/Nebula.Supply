import { Skeleton, SkeletonCard, SkeletonTable, SkeletonText } from './Skeleton';
import { LoadingSpinner, LoadingOverlay, LoadingButton, ProgressIndicator, InlineLoading } from './Skeleton';
import { cn } from '../../utils/cn';

// Page Loading State
export function PageLoadingState({ 
  message = 'Loading page...',
  showSkeleton = false 
}: { 
  message?: string;
  showSkeleton?: boolean;
}) {
  if (showSkeleton) {
    return (
      <div className="space-y-6 p-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Table Loading State
export function TableLoadingState({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}: { 
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={200} height={24} />
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={100} height={36} />
            <Skeleton variant="rectangular" width={100} height={36} />
          </div>
        </div>
      )}
      <SkeletonTable rows={rows} columns={columns} />
    </div>
  );
}

// Card Grid Loading State
export function CardGridLoadingState({ 
  count = 6,
  columns = 3 
}: { 
  count?: number;
  columns?: number;
}) {
  return (
    <div
      className={cn(
        'grid gap-6',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// List Loading State
export function ListLoadingState({ 
  items = 5,
  showAvatar = false 
}: { 
  items?: number;
  showAvatar?: boolean;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-white/10 rounded-lg">
          {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Form Loading State
export function FormLoadingState({ 
  fields = 4 
}: { 
  fields?: number;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width={100} height={16} />
          <Skeleton variant="rectangular" width="100%" height={40} />
        </div>
      ))}
      <div className="flex gap-2 justify-end">
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </div>
    </div>
  );
}

// Export all loading components
export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonText,
  LoadingSpinner,
  LoadingOverlay,
  LoadingButton,
  ProgressIndicator,
  InlineLoading,
};

