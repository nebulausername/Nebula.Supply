import { cn } from '../../utils/cn';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'widget';
}

export const SkeletonLoader = ({ className, variant = 'card' }: SkeletonLoaderProps) => {
  const baseClasses = 'animate-pulse bg-white/5 rounded';
  
  const variantClasses = {
    card: 'h-64 w-full',
    text: 'h-4 w-3/4',
    circle: 'h-12 w-12 rounded-full',
    widget: 'h-48 w-full rounded-2xl'
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} />
  );
};

export const CookieWidgetSkeleton = () => {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6">
      <div className="space-y-4">
        <SkeletonLoader variant="circle" className="mx-auto h-16 w-16" />
        <div className="space-y-2">
          <SkeletonLoader variant="text" className="mx-auto h-6 w-32" />
          <SkeletonLoader variant="text" className="mx-auto h-4 w-24" />
        </div>
        <SkeletonLoader variant="text" className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
};

export const FeatureCardSkeleton = () => {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-8">
      <SkeletonLoader variant="circle" className="h-12 w-12 mb-4" />
      <SkeletonLoader variant="text" className="h-6 w-3/4 mb-2" />
      <SkeletonLoader variant="text" className="h-4 w-full mb-1" />
      <SkeletonLoader variant="text" className="h-4 w-5/6" />
    </div>
  );
};

