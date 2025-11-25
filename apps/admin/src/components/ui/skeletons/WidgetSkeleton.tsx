import { Skeleton, SkeletonCard, SkeletonText } from '../Skeleton';
import { Card } from '../Card';
import { cn } from '../../../utils/cn';

interface WidgetSkeletonProps {
  variant?: 'kpi' | 'chart' | 'list' | 'table' | 'card';
  className?: string;
}

export function WidgetSkeleton({ variant = 'card', className }: WidgetSkeletonProps) {
  switch (variant) {
    case 'kpi':
      return (
        <Card className={cn('p-6', className)}>
          <div className="space-y-4">
            <Skeleton variant="text" width={120} height={16} />
            <Skeleton variant="rectangular" width="100%" height={48} />
            <div className="flex items-center gap-2">
              <Skeleton variant="text" width={80} height={14} />
              <Skeleton variant="circular" width={16} height={16} />
            </div>
          </div>
        </Card>
      );
    
    case 'chart':
      return (
        <Card className={cn('p-6', className)}>
          <div className="space-y-4">
            <Skeleton variant="text" width={150} height={20} />
            <Skeleton variant="rectangular" width="100%" height={200} />
            <div className="flex justify-between">
              <Skeleton variant="text" width={60} height={12} />
              <Skeleton variant="text" width={60} height={12} />
            </div>
          </div>
        </Card>
      );
    
    case 'list':
      return (
        <Card className={cn('p-6', className)}>
          <div className="space-y-3">
            <Skeleton variant="text" width={100} height={18} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="circular" width={32} height={32} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="70%" height={14} />
                  <Skeleton variant="text" width="50%" height={12} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    
    case 'table':
      return (
        <Card className={cn('p-6', className)}>
          <div className="space-y-4">
            <Skeleton variant="text" width={120} height={18} />
            <div className="space-y-2">
              {/* Header */}
              <div className="flex gap-4">
                <Skeleton variant="text" width="25%" height={16} />
                <Skeleton variant="text" width="25%" height={16} />
                <Skeleton variant="text" width="25%" height={16} />
                <Skeleton variant="text" width="25%" height={16} />
              </div>
              {/* Rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton variant="text" width="25%" height={14} />
                  <Skeleton variant="text" width="25%" height={14} />
                  <Skeleton variant="text" width="25%" height={14} />
                  <Skeleton variant="text" width="25%" height={14} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      );
    
    case 'card':
    default:
      return <SkeletonCard className={className} />;
  }
}

