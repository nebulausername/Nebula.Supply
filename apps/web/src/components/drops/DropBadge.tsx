import { memo } from 'react';
import { cn } from '../../utils/cn';
import { Crown, Flame, Sparkles, Star, Lock, Users, Clock, Zap } from 'lucide-react';
import type { Drop } from '@nebula/shared';

export type BadgeType = 
  | 'VIP' 
  | 'Limited' 
  | 'Kostenlos' 
  | 'Drop' 
  | 'Locked'
  | 'Popular'
  | 'New'
  | 'Ending Soon';

interface DropBadgeProps {
  type: BadgeType | Drop['badge'];
  label?: string;
  showIcon?: boolean;
  showGlow?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'glass';
  className?: string;
}

/**
 * 🎨 Enhanced Badge System Component
 * Features: Icons, animations, tooltips, glow effects
 */
export const DropBadge = memo(({
  type,
  label,
  showIcon = true,
  showGlow = true,
  size = 'md',
  variant = 'glass',
  className
}: DropBadgeProps) => {
  // Icon mapping
  const iconMap: Record<string, React.ReactNode> = {
    'VIP': <Crown className="w-full h-full" />,
    'Limited': <Flame className="w-full h-full" />,
    'LIMITED': <Flame className="w-full h-full" />,
    'Kostenlos': <Sparkles className="w-full h-full" />,
    'Drop': <Zap className="w-full h-full" />,
    'Locked': <Lock className="w-full h-full" />,
    'Popular': <Users className="w-full h-full" />,
    'New': <Star className="w-full h-full" />,
    'Ending Soon': <Clock className="w-full h-full" />
  };

  // Color schemes
  const colorSchemes: Record<string, {
    solid: string;
    outline: string;
    glass: string;
    glow: string;
  }> = {
    'VIP': {
      solid: 'bg-[#FF5EDB] text-white',
      outline: 'border-[#FF5EDB] text-[#FF5EDB]',
      glass: 'bg-[#FF5EDB]/20 border-[#FF5EDB]/30 text-[#FF5EDB] backdrop-blur-sm',
      glow: 'badge-vip-glow'
    },
    'Limited': {
      solid: 'bg-amber-500 text-white',
      outline: 'border-amber-500 text-amber-500',
      glass: 'bg-amber-500/20 border-amber-500/30 text-amber-400 backdrop-blur-sm',
      glow: 'badge-limited-glow'
    },
    'LIMITED': {
      solid: 'bg-amber-500 text-white',
      outline: 'border-amber-500 text-amber-500',
      glass: 'bg-amber-500/20 border-amber-500/30 text-amber-400 backdrop-blur-sm',
      glow: 'badge-limited-glow'
    },
    'Kostenlos': {
      solid: 'bg-green-500 text-white',
      outline: 'border-green-500 text-green-500',
      glass: 'bg-green-500/20 border-green-500/30 text-green-400 backdrop-blur-sm',
      glow: 'badge-glow'
    },
    'Drop': {
      solid: 'bg-accent text-black',
      outline: 'border-accent text-accent',
      glass: 'bg-accent/20 border-accent/30 text-accent backdrop-blur-sm',
      glow: 'badge-glow'
    },
    'Locked': {
      solid: 'bg-gray-500 text-white',
      outline: 'border-gray-500 text-gray-400',
      glass: 'bg-gray-500/20 border-gray-500/30 text-gray-400 backdrop-blur-sm',
      glow: ''
    },
    'Popular': {
      solid: 'bg-blue-500 text-white',
      outline: 'border-blue-500 text-blue-400',
      glass: 'bg-blue-500/20 border-blue-500/30 text-blue-400 backdrop-blur-sm',
      glow: 'badge-glow'
    },
    'New': {
      solid: 'bg-accent text-black',
      outline: 'border-accent text-accent',
      glass: 'bg-accent/20 border-accent/30 text-accent backdrop-blur-sm',
      glow: 'badge-glow'
    },
    'Ending Soon': {
      solid: 'bg-red-500 text-white',
      outline: 'border-red-500 text-red-400',
      glass: 'bg-red-500/20 border-red-500/30 text-red-400 backdrop-blur-sm',
      glow: 'badge-glow'
    }
  };

  // Size classes
  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2'
  };

  const iconSizeClasses = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  const badgeType = type as string;
  const scheme = colorSchemes[badgeType] || colorSchemes['Drop'];
  const icon = iconMap[badgeType];
  const displayLabel = label || badgeType;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold border transition-all duration-300',
        'hover:scale-105 active:scale-95',
        sizeClasses[size],
        scheme[variant],
        showGlow && scheme.glow,
        className
      )}
    >
      {showIcon && icon && (
        <span className={iconSizeClasses[size]}>
          {icon}
        </span>
      )}
      <span>{displayLabel}</span>
    </span>
  );
});

DropBadge.displayName = 'DropBadge';

// Convenience exports for common badges
export const VIPBadge = (props: Omit<DropBadgeProps, 'type'>) => (
  <DropBadge type="VIP" {...props} />
);

export const LimitedBadge = (props: Omit<DropBadgeProps, 'type'>) => (
  <DropBadge type="Limited" {...props} />
);

export const FreeBadge = (props: Omit<DropBadgeProps, 'type'>) => (
  <DropBadge type="Kostenlos" {...props} />
);

export const NewBadge = (props: Omit<DropBadgeProps, 'type'>) => (
  <DropBadge type="New" {...props} />
);





