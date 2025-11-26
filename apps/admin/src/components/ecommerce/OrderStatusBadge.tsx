import React from 'react';
import { Badge } from '../ui/Badge';
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import { cn } from '../../utils/cn';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  onClick?: () => void;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'outline' as const,
    className: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10',
    description: 'Order is pending payment confirmation'
  },
  processing: {
    label: 'Processing',
    icon: Package,
    variant: 'secondary' as const,
    className: 'text-blue-400 border-blue-400/50 bg-blue-400/10',
    description: 'Order is being prepared for shipment'
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    variant: 'default' as const,
    className: 'text-purple-400 border-purple-400/50 bg-purple-400/10',
    description: 'Order has been shipped and is in transit'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    variant: 'success' as const,
    className: 'text-green-400 border-green-400/50 bg-green-400/10',
    description: 'Order has been successfully delivered'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'text-red-400 border-red-400/50 bg-red-400/10',
    description: 'Order has been cancelled'
  },
  refunded: {
    label: 'Refunded',
    icon: RefreshCw,
    variant: 'destructive' as const,
    className: 'text-orange-400 border-orange-400/50 bg-orange-400/10',
    description: 'Order has been refunded'
  }
};

const sizeConfig = {
  sm: {
    text: 'text-xs',
    icon: 'w-3 h-3',
    padding: 'px-2 py-0.5'
  },
  md: {
    text: 'text-sm',
    icon: 'w-4 h-4',
    padding: 'px-3 py-1'
  },
  lg: {
    text: 'text-base',
    icon: 'w-5 h-5',
    padding: 'px-4 py-2'
  }
};

export function OrderStatusBadge({ 
  status, 
  onClick, 
  className, 
  showIcon = true, 
  size = 'md' 
}: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  const badgeContent = (
    <div className={cn(
      'inline-flex items-center gap-1.5 font-medium',
      sizeStyles.text,
      sizeStyles.padding,
      config.className,
      onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
      className
    )}>
      {showIcon && <Icon className={sizeStyles.icon} />}
      <span>{config.label}</span>
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
        title={config.description}
        aria-label={`${config.label} - Click to edit`}
      >
        {badgeContent}
      </button>
    );
  }

  return (
    <div 
      className="focus:outline-none"
      title={config.description}
      aria-label={config.label}
    >
      {badgeContent}
    </div>
  );
}

// Status indicator dot (smaller version)
export function OrderStatusDot({ 
  status, 
  className 
}: { 
  status: OrderStatus; 
  className?: string; 
}) {
  const config = statusConfig[status];
  
  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full',
        config.className.replace('border-yellow-400/50 bg-yellow-400/10', 'bg-yellow-400'),
        config.className.replace('border-blue-400/50 bg-blue-400/10', 'bg-blue-400'),
        config.className.replace('border-purple-400/50 bg-purple-400/10', 'bg-purple-400'),
        config.className.replace('border-green-400/50 bg-green-400/10', 'bg-green-400'),
        config.className.replace('border-red-400/50 bg-red-400/10', 'bg-red-400'),
        config.className.replace('border-orange-400/50 bg-orange-400/10', 'bg-orange-400'),
        className
      )}
      title={config.description}
      aria-label={config.label}
    />
  );
}

// Status with count (for summary views)
export function OrderStatusWithCount({ 
  status, 
  count, 
  className 
}: { 
  status: OrderStatus; 
  count: number; 
  className?: string; 
}) {
  const config = statusConfig[status];
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <OrderStatusDot status={status} />
      <span className="text-sm text-muted">{config.label}</span>
      <span className="text-sm font-semibold text-text">{count}</span>
    </div>
  );
}

// Status progress indicator
export function OrderStatusProgress({ 
  status, 
  className 
}: { 
  status: OrderStatus; 
  className?: string; 
}) {
  const statusOrder: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(status);
  const isCompleted = status === 'delivered';
  const isCancelled = status === 'cancelled' || status === 'refunded';

  if (isCancelled) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <XCircle className="w-4 h-4 text-red-400" />
        <span className="text-sm text-red-400">Cancelled</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {statusOrder.map((stepStatus, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const config = statusConfig[stepStatus];
        const Icon = config.icon;

        return (
          <React.Fragment key={stepStatus}>
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
              isActive 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-gray-800 text-gray-500 border border-gray-700',
              isCurrent && 'ring-2 ring-blue-500/50'
            )}>
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{config.label}</span>
            </div>
            {index < statusOrder.length - 1 && (
              <div className={cn(
                'w-4 h-0.5 rounded-full transition-colors',
                isActive ? 'bg-blue-500' : 'bg-gray-700'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}























































































