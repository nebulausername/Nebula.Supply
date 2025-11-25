import { motion } from 'framer-motion';
import { Package, Share2, Gift, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';

interface QuickActionsProps {
  onOrdersClick: () => void;
  onInviteClick: () => void;
  onRewardsClick: () => void;
  className?: string;
}

export const QuickActions = ({ 
  onOrdersClick, 
  onInviteClick, 
  onRewardsClick,
  className 
}: QuickActionsProps) => {
  const actions = [
    {
      id: 'orders',
      label: 'Bestellungen',
      icon: Package,
      onClick: onOrdersClick,
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-600',
    },
    {
      id: 'invite',
      label: 'Einladen',
      icon: Share2,
      onClick: onInviteClick,
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'from-purple-600 to-pink-600',
    },
    {
      id: 'rewards',
      label: 'Belohnungen',
      icon: Gift,
      onClick: onRewardsClick,
      gradient: 'from-orange-500 to-amber-500',
      hoverGradient: 'from-orange-600 to-amber-600',
    },
  ];

  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          onClick={action.onClick}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.2 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative overflow-hidden rounded-xl p-4 min-h-[88px]',
            'bg-gradient-to-br backdrop-blur-sm',
            'border border-white/10 hover:border-white/20',
            'transition-all duration-150 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-slate-900',
            'group'
          )}
          style={{
            background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
          }}
        >
          {/* Background Gradient */}
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity',
            action.gradient
          )} />
          
          {/* Hover Effect */}
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity',
            action.hoverGradient
          )} />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-2">
            <action.icon className="w-6 h-6 text-white" strokeWidth={2} />
            <span className="text-sm font-semibold text-white">
              {action.label}
            </span>
          </div>

          {/* Shine Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </div>
        </motion.button>
      ))}
    </div>
  );
};




