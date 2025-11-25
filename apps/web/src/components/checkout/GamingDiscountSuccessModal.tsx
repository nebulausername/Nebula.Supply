import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, CheckCircle, Cookie } from 'lucide-react';
import { DISCOUNT_TIERS } from '../../store/gamingDiscounts';
import { cn } from '../../utils/cn';

interface GamingDiscountSuccessModalProps {
  isOpen: boolean;
  discountTier: '5%' | '10%' | '15%' | '20%';
  savings: number;
  onClose: () => void;
}

export const GamingDiscountSuccessModal = ({
  isOpen,
  discountTier,
  savings,
  onClose
}: GamingDiscountSuccessModalProps) => {
  const tierConfig = DISCOUNT_TIERS.find(t => t.tier === discountTier);
  
  if (!tierConfig || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop with epic glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Success Card - EPIC! */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ 
            type: 'spring',
            damping: 20,
            stiffness: 300
          }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Epic Glow Effect */}
          <div className={cn(
            "absolute inset-0 rounded-2xl blur-2xl opacity-60",
            `bg-gradient-to-r ${tierConfig.color}`
          )} />
          
          {/* Main Card */}
          <div className="relative bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1e] rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Confetti Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    y: -20, 
                    x: Math.random() * 100 + '%',
                    opacity: 1,
                    scale: Math.random() * 0.5 + 0.5
                  }}
                  animate={{ 
                    y: '120%',
                    rotate: Math.random() * 360,
                    opacity: 0
                  }}
                  transition={{ 
                    duration: Math.random() * 2 + 2,
                    delay: Math.random() * 0.5,
                    ease: 'easeOut'
                  }}
                  className={cn(
                    "absolute w-2 h-2 rounded-full",
                    i % 3 === 0 ? "bg-orange-500" : 
                    i % 3 === 1 ? "bg-yellow-500" : 
                    "bg-green-500"
                  )}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative p-8 text-center space-y-6">
              {/* Epic Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: 'spring',
                  delay: 0.2,
                  damping: 15
                }}
                className="flex justify-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                    className={cn(
                      "absolute inset-0 rounded-full blur-xl opacity-50",
                      `bg-gradient-to-r ${tierConfig.color}`
                    )}
                  />
                  <div className={cn(
                    "relative w-24 h-24 rounded-full flex items-center justify-center",
                    `bg-gradient-to-br ${tierConfig.color} shadow-2xl`
                  )}>
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Epic Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-3xl font-bold gradient-text">EPIC WIN!</h2>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-lg text-muted">Gaming-Rabatt eingelöst!</p>
              </motion.div>

              {/* Savings Display - MASSIVE */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: 'spring',
                  delay: 0.4,
                  damping: 12
                }}
                className={cn(
                  "relative py-6 px-8 rounded-xl",
                  `bg-gradient-to-r ${tierConfig.color}/20 border-2`,
                  `border-${tierConfig.color.split('-')[1]}-500/50`
                )}
              >
                <div className="space-y-1">
                  <div className="text-sm text-muted uppercase tracking-wider">Deine Ersparnis</div>
                  <div className="text-5xl font-black text-green-500">
                    -€{savings.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <span className="text-3xl">{tierConfig.icon}</span>
                    <span>{tierConfig.tier} Gaming-Rabatt</span>
                  </div>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-3 pt-4"
              >
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Cookie className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-muted">Zocken lohnt sich!</span>
                  </div>
                  <div className="text-sm font-semibold text-orange-500">Gespart!</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-muted">Verwendet</span>
                  </div>
                  <div className="text-sm font-semibold text-green-500">Einmalig</div>
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
                  `bg-gradient-to-r ${tierConfig.color} hover:brightness-110`
                )}
              >
                Awesome! 🎮
              </motion.button>

              {/* Info */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-muted"
              >
                Spiele weiter um neue Rabatte freizuschalten!
                <br />
                <span className="text-yellow-500">
                  Der nächste {tierConfig.tier} Rabatt wird schwieriger zu erspielen sein.
                </span>
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


