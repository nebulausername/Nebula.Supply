import { memo } from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../utils/cn';

interface TicketLoadingSkeletonProps {
  count?: number;
  variant?: 'card' | 'list';
}

export const TicketLoadingSkeleton = memo(function TicketLoadingSkeleton({ 
  count = 5, 
  variant = 'card' 
}: TicketLoadingSkeletonProps) {
  if (variant === 'list') {
    return (
      <Card className="overflow-hidden" variant="glassmorphic">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface/30 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Skeleton variant="rectangular" width={20} height={20} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left">
                  <Skeleton variant="text" width={100} height={16} />
                </th>
                <th className="px-4 py-3 text-left">
                  <Skeleton variant="text" width={80} height={16} />
                </th>
                <th className="px-4 py-3 text-left">
                  <Skeleton variant="text" width={70} height={16} />
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <Skeleton variant="text" width={90} height={16} />
                </th>
                <th className="px-4 py-3 text-left">
                  <Skeleton variant="text" width={100} height={16} />
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <Skeleton variant="text" width={80} height={16} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <Skeleton variant="rectangular" width={20} height={20} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <Skeleton variant="text" width={120} height={14} />
                      <Skeleton variant="text" width={200} height={12} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton variant="text" width={60} height={16} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <Skeleton variant="text" width={70} height={14} />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton variant="text" width={100} height={14} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Skeleton variant="text" width={80} height={14} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card 
          key={i} 
          variant="glassmorphic" 
          className={cn(
            'p-4 animate-pulse',
            'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
            'backdrop-blur-xl border border-white/10',
            'shadow-lg shadow-black/20'
          )}
        >
          <div className="flex items-start gap-3">
            <Skeleton variant="rectangular" width={20} height={20} className="rounded mt-1" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton variant="text" width={120} height={12} />
                  <Skeleton variant="text" width="80%" height={16} />
                </div>
                <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton variant="rectangular" width={70} height={20} className="rounded-full" />
                <Skeleton variant="rectangular" width={60} height={20} className="rounded-full" />
                <Skeleton variant="rectangular" width={50} height={20} className="rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton variant="text" width={80} height={12} />
                <Skeleton variant="text" width={100} height={12} />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

