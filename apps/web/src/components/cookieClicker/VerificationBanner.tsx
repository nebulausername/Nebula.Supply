import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, X, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { useBotAuth } from '../../hooks/useBotAuth';
import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

export const VerificationBanner = () => {
  const { isVerified, isLoading } = useBotAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Check if banner was dismissed in session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('verificationBannerDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, []);

  // Don't show if verified, loading, or dismissed
  if (isVerified || isLoading || isDismissed || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem('verificationBannerDismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative mb-6 rounded-2xl border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-xl overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Animated Background Gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              backgroundSize: '200% 100%'
            }}
          />

          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl" />

          {/* Sparkle Effects */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-yellow-400"
                style={{
                  left: `${15 + (i % 4) * 25}%`,
                  top: `${20 + Math.floor(i / 4) * 60}%`,
                }}
                animate={{
                  scale: [0, 2, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>

          <div className="relative z-10 p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <motion.div
                className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center border-2 border-yellow-400/50 backdrop-blur-sm flex-shrink-0"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  boxShadow: '0 0 20px rgba(234, 179, 8, 0.5)'
                }}
              >
                <Shield className="w-7 h-7 text-yellow-400" />
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <span>Verifizierung erforderlich</span>
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                  </motion.span>
                </h3>
                <p className="text-sm text-white/80 mb-4">
                  Verifiziere dich über Telegram, um alle Features zu nutzen und am Leaderboard teilzunehmen.
                </p>

                {/* Steps */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <div className="w-5 h-5 rounded-full bg-yellow-500/30 border border-yellow-400/50 flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-400 font-bold">1</span>
                    </div>
                    <span>Öffne unseren Telegram-Bot</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <div className="w-5 h-5 rounded-full bg-yellow-500/30 border border-yellow-400/50 flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-400 font-bold">2</span>
                    </div>
                    <span>Führe die Verifizierung durch</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <div className="w-5 h-5 rounded-full bg-yellow-500/30 border border-yellow-400/50 flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-400 font-bold">3</span>
                    </div>
                    <span>Kehre hierher zurück und genieße alle Features</span>
                  </div>
                </div>

                {/* Action Button */}
                <motion.a
                  href="https://t.me/your_bot_username"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                    "bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold",
                    "hover:from-yellow-600 hover:to-orange-600",
                    "transition-all shadow-lg shadow-yellow-500/30",
                    "backdrop-blur-sm border-2 border-yellow-400/50"
                  )}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    boxShadow: '0 4px 15px rgba(234, 179, 8, 0.4)'
                  }}
                >
                  <span>Jetzt verifizieren</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
              </div>

              {/* Close Button */}
              <motion.button
                onClick={handleDismiss}
                className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Glow Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 60px rgba(234, 179, 8, 0.3)'
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};














































