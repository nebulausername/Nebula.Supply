/**
 * LoyaltyCard Component
 * 
 * Displays user loyalty program status including:
 * - Current tier and points
 * - Progress to next tier with animated progress ring
 * - Tier benefits and statistics
 * - Transaction history
 * - Real-time updates via WebSocket
 * - Mobile-responsive design
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Star,
  Gift,
  TrendingUp,
  Award,
  Zap,
  Coins,
  Calendar,
  ShoppingBag,
  Users,
  MessageCircle,
  Sparkles,
  ChevronRight,
  Package,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { useLoyaltyStore, loyaltyTiers, LoyaltyTier } from '../../store/loyalty';
import { cn } from '../../utils/cn';
import { useLoyaltyRealtime } from '../../hooks/useLoyaltyRealtime';
import { useAuthStore } from '../../store/auth';

interface LoyaltyCardProps {
  compact?: boolean;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ compact = false }) => {
  const { user } = useAuthStore();
  const {
    currentPoints,
    currentTier,
    totalEarned,
    totalRedeemed,
    transactions,
    getTierInfo,
    getPointsToNextTier,
    getTierProgress
  } = useLoyaltyStore();

  // Realtime updates for loyalty
  const loyaltyRealtime = useLoyaltyRealtime({
    userId: user?.id,
    enabled: !!user?.id
  });

  const tierInfo = getTierInfo();
  const pointsToNext = getPointsToNextTier();
  const progressPercent = getTierProgress();
  const [showTransactions, setShowTransactions] = useState(false);
  const [previousTier, setPreviousTier] = useState<LoyaltyTier>(currentTier);
  const [showTierUpgrade, setShowTierUpgrade] = useState(false);

  // Detect tier upgrade
  useEffect(() => {
    if (currentTier !== previousTier) {
      const tierOrder: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const currentIndex = tierOrder.indexOf(currentTier);
      const previousIndex = tierOrder.indexOf(previousTier);
      
      if (currentIndex > previousIndex) {
        setShowTierUpgrade(true);
        setTimeout(() => setShowTierUpgrade(false), 5000);
      }
      setPreviousTier(currentTier);
    }
  }, [currentTier, previousTier]);

  const getTierGradient = (tier: LoyaltyTier) => {
    switch (tier) {
      case 'diamond': return 'from-cyan-400 via-blue-500 to-purple-600';
      case 'platinum': return 'from-purple-400 via-pink-500 to-purple-600';
      case 'gold': return 'from-yellow-400 via-orange-500 to-yellow-600';
      case 'silver': return 'from-slate-300 via-slate-400 to-slate-600';
      default: return 'from-amber-600 via-orange-600 to-amber-800';
    }
  };

  const getTierGlow = (tier: LoyaltyTier) => {
    switch (tier) {
      case 'diamond': return 'shadow-cyan-500/50';
      case 'platinum': return 'shadow-purple-500/50';
      case 'gold': return 'shadow-yellow-500/50';
      case 'silver': return 'shadow-slate-400/50';
      default: return 'shadow-amber-500/50';
    }
  };

  const getNextTierInfo = () => {
    const tierOrder: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tierOrder.indexOf(currentTier);
    if (currentIndex < tierOrder.length - 1) {
      return loyaltyTiers[tierOrder[currentIndex + 1]];
    }
    return null;
  };

  const nextTier = getNextTierInfo();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned': return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'redeemed': return <Gift className="h-4 w-4 text-blue-400" />;
      case 'expired': return <Zap className="h-4 w-4 text-red-400" />;
      default: return <Coins className="h-4 w-4 text-slate-400" />;
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-white/10 p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-xl bg-gradient-to-br",
                getTierGradient(currentTier),
                `shadow-lg ${getTierGlow(currentTier)}`
              )}
            >
              {tierInfo.icon}
            </motion.div>
            <div>
              <h3 className="font-bold text-white">{tierInfo.name}</h3>
              <p className="text-sm text-gray-400">{currentPoints.toLocaleString()} Punkte</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Fortschritt</span>
            <span className="text-white font-medium">{pointsToNext.toLocaleString()} Punkte</span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-2 rounded-full bg-gradient-to-r",
                getTierGradient(currentTier),
                `shadow-lg ${getTierGlow(currentTier)}`
              )}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier Upgrade Animation */}
      <AnimatePresence>
        {showTierUpgrade && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className={cn(
              "relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 p-8",
              `bg-gradient-to-br ${getTierGradient(currentTier)}/20`,
              `border-${currentTier === 'diamond' ? 'cyan' : currentTier === 'platinum' ? 'purple' : currentTier === 'gold' ? 'yellow' : 'slate'}-500/50`,
              `shadow-2xl ${getTierGlow(currentTier)}`
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            <div className="relative z-10 text-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-4"
              >
                <Sparkles className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-2">
                🎉 Tier Upgrade!
              </h2>
              <p className="text-xl text-white/90 font-semibold">
                Du bist jetzt {tierInfo.name}!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Status Card with 3D Effect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-slate-900/95 via-purple-900/30 to-slate-900/95 border border-white/10 shadow-2xl p-4 md:p-8 group"
      >
        {/* Animated Background Gradient */}
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-cyan-500/10 opacity-50"
          style={{ backgroundSize: '200% 200%' }}
        />

        {/* Glow Effect */}
        <div className={cn(
          "absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500",
          `bg-gradient-to-r ${getTierGradient(currentTier)}`
        )} />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
            <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
              {/* 3D Tier Icon with Rotation */}
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "w-16 h-16 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-3xl md:text-4xl bg-gradient-to-br shadow-2xl flex-shrink-0",
                  getTierGradient(currentTier),
                  getTierGlow(currentTier)
                )}
                style={{
                  transform: 'perspective(1000px) rotateY(-5deg)',
                  boxShadow: `0 20px 60px -10px rgba(0, 0, 0, 0.5), 0 0 40px -10px currentColor`
                }}
              >
                {tierInfo.icon}
              </motion.div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl md:text-4xl font-black text-white mb-1 md:mb-2 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  {tierInfo.name}
                </h2>
                <p className="text-sm md:text-lg text-gray-400 font-medium">{tierInfo.tier.toUpperCase()} Status</p>
              </div>
            </div>

            <div className="text-left md:text-right w-full md:w-auto">
              <motion.div
                key={currentPoints}
                initial={{ scale: 1.2, y: -10 }}
                animate={{ scale: 1, y: 0 }}
                className="text-3xl md:text-5xl font-black bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent mb-1"
              >
                {currentPoints.toLocaleString()}
              </motion.div>
              <div className="text-xs md:text-sm text-gray-400 font-medium">Loyalty Punkte</div>
            </div>
          </div>

          {/* Progress Ring Visualization */}
          <div className="relative mb-8">
            {nextTier && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 font-medium">
                  Fortschritt zu {nextTier.name}
                </span>
                <span className="text-white font-bold text-lg">
                  {pointsToNext.toLocaleString()} Punkte
                </span>
              </div>
            )}

            {/* Circular Progress Ring */}
            <div className="relative w-full h-24 md:h-32 flex items-center justify-center">
              <svg className="w-24 h-24 md:w-32 md:h-32 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="8"
                />
                {/* Progress Circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#tierGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progressPercent / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="tierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={currentTier === 'diamond' ? '#22d3ee' : currentTier === 'platinum' ? '#a855f7' : currentTier === 'gold' ? '#fbbf24' : currentTier === 'silver' ? '#94a3b8' : '#f59e0b'} />
                    <stop offset="100%" stopColor={currentTier === 'diamond' ? '#8b5cf6' : currentTier === 'platinum' ? '#ec4899' : currentTier === 'gold' ? '#f97316' : currentTier === 'silver' ? '#475569' : '#d97706'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-black text-white">{progressPercent.toFixed(0)}%</div>
                  <div className="text-[10px] md:text-xs text-gray-400">Fortschritt</div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {tierInfo.benefits.slice(0, 4).map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
              <div className="text-2xl font-black text-emerald-400 mb-1">{totalEarned.toLocaleString()}</div>
              <div className="text-xs text-gray-400 font-medium">Verdiente Punkte</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <div className="text-2xl font-black text-blue-400 mb-1">{totalRedeemed.toLocaleString()}</div>
              <div className="text-xs text-gray-400 font-medium">Eingelöste Punkte</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Transactions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-white/10 shadow-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            Transaktionshistorie
          </h3>
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            {showTransactions ? 'Ausblenden' : 'Anzeigen'}
            <ChevronRight className={cn("h-4 w-4 transition-transform", showTransactions && "rotate-90")} />
          </button>
        </div>

        <AnimatePresence>
          {showTransactions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Noch keine Transaktionen</p>
                </div>
              ) : (
                transactions.slice(0, 10).map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "p-2.5 rounded-lg",
                        transaction.type === 'earned' ? "bg-emerald-500/20" : transaction.type === 'redeemed' ? "bg-blue-500/20" : "bg-red-500/20"
                      )}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white mb-1">{transaction.description}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          {transaction.orderId && (
                            <>
                              <Package className="h-3 w-3" />
                              <span>Bestellung #{transaction.orderId.slice(-8)}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(transaction.timestamp).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={cn(
                        "text-xl font-black",
                        transaction.points > 0 ? "text-emerald-400" : "text-blue-400"
                      )}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Punkte</div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
