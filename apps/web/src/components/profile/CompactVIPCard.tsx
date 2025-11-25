import { motion } from 'framer-motion';
import { Crown, ArrowRight, Sparkles, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useState } from 'react';

interface CompactVIPCardProps {
  currentTier: string;
  currentInvites: number;
  requiredInvites: number;
  nextReward: string;
  nextRewardAmount: number;
  onInviteClick: () => void;
  className?: string;
}

export const CompactVIPCard = ({
  currentTier,
  currentInvites,
  requiredInvites,
  nextReward,
  nextRewardAmount,
  onInviteClick,
  className
}: CompactVIPCardProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const progress = Math.min((currentInvites / requiredInvites) * 100, 100);
  const remaining = Math.max(requiredInvites - currentInvites, 0);

  const tierConfig = {
    bronze: { emoji: '🥉', color: 'from-amber-600 to-amber-800', textColor: 'text-amber-400' },
    silver: { emoji: '🥈', color: 'from-slate-400 to-slate-600', textColor: 'text-slate-300' },
    gold: { emoji: '🥇', color: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-400' },
    platinum: { emoji: '💎', color: 'from-purple-400 to-purple-600', textColor: 'text-purple-400' },
    diamond: { emoji: '💎', color: 'from-cyan-400 to-cyan-600', textColor: 'text-cyan-400' },
  };

  const config = tierConfig[currentTier.toLowerCase() as keyof typeof tierConfig] || tierConfig.bronze;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/10',
        'bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl',
        'p-4 sm:p-5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.emoji}</span>
          <div>
            <h3 className={cn('text-base font-bold', config.textColor)}>
              {currentTier} VIP
            </h3>
            <p className="text-xs text-gray-400">
              {currentInvites}/{requiredInvites} Einladungen
            </p>
          </div>
        </div>

        {/* Info Tooltip */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Info className="w-4 h-4 text-gray-400" />
          </button>
          
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg bg-slate-800 border border-white/10 shadow-xl z-50"
            >
              <p className="text-xs text-gray-300 mb-2 font-medium">VIP Vorteile:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Exklusive Drops & Early Access</li>
                <li>• Bonus Coins bei Bestellungen</li>
                <li>• Priority Support</li>
                <li>• Spezielle Rabatte</li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn(
              'h-2 rounded-full bg-gradient-to-r relative',
              config.color
            )}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-400">
            {remaining > 0 ? `Noch ${remaining} bis ${nextReward}` : 'Maximales Level erreicht!'}
          </span>
          <span className={cn('text-xs font-semibold', config.textColor)}>
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Next Reward */}
      {remaining > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-xs font-medium text-emerald-400">Nächste Belohnung</p>
              <p className="text-xs text-gray-300">+{nextRewardAmount} Coins</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <motion.button
        onClick={onInviteClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
          'bg-gradient-to-r font-semibold text-white text-sm',
          'transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-slate-900',
          config.color,
          'hover:shadow-lg'
        )}
      >
        <Share2 className="w-4 h-4" />
        <span>Freunde einladen</span>
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};




