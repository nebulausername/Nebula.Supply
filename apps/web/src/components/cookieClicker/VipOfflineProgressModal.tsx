import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Sparkles, Crown, TrendingUp, Clock } from 'lucide-react';
import { formatCookies } from '../../store/gamingDiscounts';
import { cn } from '../../utils/cn';

interface VipOfflineProgressModalProps {
  isOpen: boolean;
  offlineCookies: number;
  offlineSeconds: number;
  vipMultiplier: number;
  vipTier: string;
  onClose: () => void;
}

export const VipOfflineProgressModal = ({
  isOpen,
  offlineCookies,
  offlineSeconds,
  vipMultiplier,
  vipTier,
  onClose
}: VipOfflineProgressModalProps) => {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const tierColors = {
    'Nova': 'from-purple-500 to-pink-500',
    'Supernova': 'from-orange-500 to-red-500',
    'Galaxy': 'from-yellow-500 to-amber-500'
  }[vipTier] || 'from-purple-500 to-pink-500';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Epic Glow */}
          <div className={cn(
            "absolute inset-0 rounded-2xl blur-3xl opacity-50",
            `bg-gradient-to-r ${tierColors}`
          )} />

          {/* Card */}
          <div className="relative bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1e] rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Animated Stars */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    y: -20,
                    x: `${Math.random() * 100}%`,
                    opacity: 0
                  }}
                  animate={{ 
                    y: '120%',
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1, 1, 0.5]
                  }}
                  transition={{ 
                    duration: Math.random() * 3 + 2,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                  className="absolute"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </motion.div>
              ))}
            </div>

            {/* Content */}
            <div className="relative p-8 text-center space-y-6">
              {/* VIP Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className={cn(
                      "absolute inset-0 rounded-full blur-xl opacity-40",
                      `bg-gradient-to-r ${tierColors}`
                    )}
                  />
                  <div className={cn(
                    "relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl",
                    `bg-gradient-to-br ${tierColors}`
                  )}>
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <h2 className="text-3xl font-bold gradient-text">
                  🌟 Willkommen zurück, VIP!
                </h2>
                <p className="text-muted">Während du weg warst...</p>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.4 }}
                className="space-y-4"
              >
                {/* Offline Cookies */}
                <div className={cn(
                  "relative py-6 px-8 rounded-xl border-2",
                  `bg-gradient-to-r ${tierColors}/20`,
                  `border-${tierColors.split('-')[1]}-500/50`
                )}>
                  <div className="space-y-1">
                    <div className="text-xs text-muted uppercase tracking-wider">Verdiente Cookies</div>
                    <div className="text-4xl font-black text-orange-500">
                      +{formatCookies(offlineCookies)}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex flex-col items-center gap-1">
                      <Clock className="w-4 h-4 text-cyan-500" />
                      <div className="text-xs text-muted">Zeit</div>
                      <div className="text-sm font-semibold text-text">{formatTime(offlineSeconds)}</div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex flex-col items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <div className="text-xs text-muted">VIP Rate</div>
                      <div className="text-sm font-semibold text-purple-400">
                        {(vipMultiplier * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex flex-col items-center gap-1">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <div className="text-xs text-muted">Tier</div>
                      <div className="text-sm font-semibold text-yellow-400">{vipTier}</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 justify-center text-sm text-purple-300">
                  <Sparkles className="w-4 h-4" />
                  <span>VIP Passive Income läuft im Hintergrund!</span>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all",
                  `bg-gradient-to-r ${tierColors} hover:brightness-110`
                )}
              >
                Weiter zocken! 🍪
              </motion.button>

              {/* Small Info */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-muted"
              >
                Deine VIP-Benefits laufen auch offline weiter.
                <br />
                Maximale Offline-Zeit:{' '}
                {vipMultiplier === 0.3 ? '4 Stunden' : 
                 vipMultiplier === 0.5 ? '8 Stunden' : 
                 '12 Stunden'}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};




