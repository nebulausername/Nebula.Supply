import { motion } from 'framer-motion';
import { Crown, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';

interface VipUpgradeBannerProps {
  className?: string;
}

export const VipUpgradeBanner = ({ className }: VipUpgradeBannerProps) => {
  const navigate = useNavigate();
  const { triggerHaptic } = useEnhancedTouch();

  const handleUpgrade = () => {
    triggerHaptic('medium');
    navigate('/vip');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4",
        className
      )}
    >
      {/* Animated Glow */}
      <motion.div
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl"
      />

      {/* Content */}
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-8 h-8 text-yellow-500" />
            </motion.div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-bold text-text mb-1">
              🌟 VIP Passive Income freischalten
            </h3>
            <p className="text-xs text-muted">
              Verdiene Cookies auch offline! Ab Nova-Tier verfügbar.
            </p>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 font-semibold text-sm transition-all shadow-lg group"
        >
          <span>Upgrade</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Features List */}
      <div className="relative mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1 text-purple-300">
          <Zap className="w-3 h-3" />
          <span>30-75% CPS</span>
        </div>
        <div className="flex items-center gap-1 text-purple-300">
          <TrendingUp className="w-3 h-3" />
          <span>Bis 12h offline</span>
        </div>
        <div className="flex items-center gap-1 text-purple-300">
          <Crown className="w-3 h-3" />
          <span>VIP-Exklusiv</span>
        </div>
      </div>
    </motion.div>
  );
};




