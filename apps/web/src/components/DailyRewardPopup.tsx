import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Flame, Sparkles, Loader2, Clock } from 'lucide-react';
import { useShopStore } from '../store/shop';
import { useToastStore } from '../store/toast';

interface RewardStatus {
  eligible: boolean;
  lastClaimAt: string | null;
  lastClaimDayKey: string | null;
  streak: number;
  totalCoins: number;
  nextEligibleAt: string | null;
  todayDayKey: string;
}

export const DailyRewardPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const addCoins = useShopStore((state) => state.addCoins);
  const addToast = useToastStore((state) => state.addToast);

  // Fetch reward status
  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem('telegram_token');
      if (!token) {
        // User not logged in via Telegram, skip
        return;
      }

      setLoading(true);
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/rewards/status?timezone=${encodeURIComponent(timezone)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch reward status');
        }

        const data = await response.json();
        setStatus(data.data);

        // Show popup if eligible
        if (data.data.eligible) {
          setTimeout(() => setIsOpen(true), 1000);
        }
      } catch (error) {
        console.error('Reward status fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!status || !status.nextEligibleAt) return;

    const updateCountdown = () => {
      const now = Date.now();
      const target = new Date(status.nextEligibleAt!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeUntilNext('Jetzt verfügbar!');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilNext(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const handleClaim = async () => {
    if (!status || !status.eligible) return;

    const token = localStorage.getItem('telegram_token');
    if (!token) {
      addToast({ type: 'error', title: 'Nicht eingeloggt' });
      return;
    }

    setClaiming(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/rewards/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ timezone })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Claim fehlgeschlagen');
      }

      const data = await response.json();
      const { coins, streak, totalCoins, nextEligibleAt } = data.data;

      // Update local coins (optimistic, server is source of truth)
      addCoins(coins);

      // Update status
      setStatus({
        eligible: false,
        lastClaimAt: new Date().toISOString(),
        lastClaimDayKey: status.todayDayKey,
        streak,
        totalCoins,
        nextEligibleAt,
        todayDayKey: status.todayDayKey
      });

      addToast({
        type: 'success',
        title: `🎉 ${coins} Coins erhalten! Streak: ${streak} Tage 🔥`
      });

      // Close popup after 1.5s
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (error) {
      console.error('Reward claim error:', error);
      addToast({
        type: 'error',
        title: 'Claim fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !status) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && status.eligible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => !claiming && setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md rounded-3xl border border-accent/30 bg-gradient-to-br from-black via-purple-900/20 to-black p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative Elements */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Gift className="h-20 w-20 text-accent drop-shadow-[0_0_30px_rgba(11,247,188,0.8)]" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="mt-8 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-2 text-3xl font-bold text-text"
              >
                Tägliche Belohnung!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 text-muted"
              >
                Komm jeden Tag zurück für mehr Coins 🔥
              </motion.p>

              {/* Streak Display */}
              {status.streak > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 flex items-center justify-center gap-2 rounded-full bg-accent/10 px-4 py-2"
                >
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="font-bold text-accent">{status.streak} Tage Streak!</span>
                </motion.div>
              )}

              {/* Reward Amount */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-8 flex items-center justify-center gap-3"
              >
                <Sparkles className="h-8 w-8 text-yellow-400" />
                <span className="text-5xl font-bold gradient-text">
                  {10 + Math.min(status.streak * 5, 50)}
                </span>
                <span className="text-2xl font-semibold text-muted">Coins</span>
              </motion.div>

              {/* Claim Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClaim}
                disabled={claiming}
                className="w-full rounded-full bg-gradient-to-r from-accent to-emerald-500 px-8 py-4 font-bold text-black shadow-lg hover:shadow-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  'Jetzt beanspruchen! 🎉'
                )}
              </motion.button>

              {/* Skip Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={() => setIsOpen(false)}
                className="mt-4 text-sm text-muted hover:text-text transition-colors"
                disabled={claiming}
              >
                Später
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Non-eligible status display (optional, could be a small badge on homepage) */}
      {!status.eligible && status.nextEligibleAt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 right-4 z-40 rounded-2xl border border-accent/20 bg-black/90 backdrop-blur-xl p-4 shadow-xl max-w-xs hidden md:block"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs font-semibold text-text">Nächste Belohnung</p>
              <p className="text-sm text-muted">{timeUntilNext}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
