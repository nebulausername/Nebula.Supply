// 🎁 PRIZE CLAIM SYSTEM - Automatische Preisverteilung & Celebration!

import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookieClickerStore } from '../../store/cookieClicker';
import {
  Gift,
  Trophy,
  Coins,
  Award,
  Sparkles,
  CheckCircle,
  X,
  Star,
  Crown,
  Zap
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/cookieFormatters';

export interface Prize {
  id: string;
  contestId: string;
  position: number;
  coins: number;
  premiumInvites?: number;
  exclusiveUpgrade?: string;
  claimedAt?: string;
  claimed: boolean;
}

interface PrizeClaimProps {
  prizes: Prize[];
  isOpen: boolean;
  onClose: () => void;
  onClaim: (prizeId: string) => Promise<void>;
}

// 🎁 PRIZE CLAIM COMPONENT - MAXIMIERT & GEIL!
export const PrizeClaim = memo(({ prizes, isOpen, onClose, onClaim }: PrizeClaimProps) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedPrizes, setClaimedPrizes] = useState<Set<string>>(new Set());
  const [celebrationActive, setCelebrationActive] = useState(false);
  const { coins, earnCoins } = useCookieClickerStore();
  
  const unclaimedPrizes = prizes.filter(p => !p.claimed && !claimedPrizes.has(p.id));
  const hasUnclaimedPrizes = unclaimedPrizes.length > 0;
  
  const handleClaim = async (prize: Prize) => {
    if (claimingId || prize.claimed) return;
    
    setClaimingId(prize.id);
    
    try {
      await onClaim(prize.id);
      
      // Add coins directly to store
      if (prize.coins > 0) {
        earnCoins(prize.coins);
      }
      
      setClaimedPrizes(prev => new Set([...prev, prize.id]));
      setCelebrationActive(true);
      
      // Celebration animation
      setTimeout(() => {
        setCelebrationActive(false);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to claim prize:', error);
      alert('Fehler beim Einlösen des Preises');
    } finally {
      setClaimingId(null);
    }
  };
  
  const handleClaimAll = async () => {
    if (claimingId || unclaimedPrizes.length === 0) return;
    
    for (const prize of unclaimedPrizes) {
      await handleClaim(prize);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between claims
    }
  };
  
  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };
  
  const getPositionColor = (position: number) => {
    if (position === 1) return 'from-yellow-500 to-orange-500';
    if (position === 2) return 'from-gray-400 to-gray-600';
    if (position === 3) return 'from-orange-600 to-orange-800';
    return 'from-blue-500 to-purple-500';
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        
        {/* Celebration Particles */}
        {celebrationActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  rotate: 0
                }}
                animate={{
                  y: -200,
                  opacity: 0,
                  scale: [1, 1.5, 0.5],
                  rotate: [0, 360],
                  x: (Math.random() - 0.5) * 200
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
              >
                {['🎉', '🎊', '✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 6)]}
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl rounded-3xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-red-500/20 backdrop-blur-xl p-8 shadow-2xl"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Trophy className="w-10 h-10 text-yellow-400" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold text-white">🎁 Preise einlösen</h2>
                <p className="text-white/70 text-sm">
                  {hasUnclaimedPrizes 
                    ? `${unclaimedPrizes.length} unbeanstandete Preise verfügbar`
                    : 'Alle Preise wurden eingelöst!'}
                </p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>
          </div>
          
          {/* Prize List */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {prizes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60">Noch keine Preise verfügbar</p>
              </div>
            ) : (
              prizes.map((prize) => (
                <motion.div
                  key={prize.id}
                  className={cn(
                    "relative rounded-xl border-2 p-4 transition-all",
                    prize.claimed || claimedPrizes.has(prize.id)
                      ? "border-green-500/50 bg-green-500/10 opacity-75"
                      : `border-${getPositionColor(prize.position).split('-')[1]}-500/50 bg-gradient-to-r ${getPositionColor(prize.position)}/10`
                  )}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={!prize.claimed && !claimedPrizes.has(prize.id) ? { scale: 1.02 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Position Badge */}
                      <motion.div
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
                          prize.position === 1 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black" :
                          prize.position === 2 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-black" :
                          prize.position === 3 ? "bg-gradient-to-br from-orange-500 to-orange-700 text-white" :
                          "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                        )}
                        animate={!prize.claimed && !claimedPrizes.has(prize.id) ? {
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {getPositionIcon(prize.position)}
                      </motion.div>
                      
                      {/* Prize Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg">
                            Platz {prize.position}
                          </h3>
                          {(prize.claimed || claimedPrizes.has(prize.id)) && (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-yellow-400">
                            <Coins className="w-4 h-4" />
                            <span className="font-semibold">{formatNumber(prize.coins)} Coins</span>
                          </div>
                          {prize.premiumInvites && (
                            <div className="flex items-center gap-2 text-purple-400 text-sm">
                              <Star className="w-4 h-4" />
                              <span>{prize.premiumInvites} Premium Invites</span>
                            </div>
                          )}
                          {prize.exclusiveUpgrade && (
                            <div className="flex items-center gap-2 text-blue-400 text-sm">
                              <Crown className="w-4 h-4" />
                              <span>Exklusives Upgrade</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Claim Button */}
                    {!prize.claimed && !claimedPrizes.has(prize.id) && (
                      <motion.button
                        onClick={() => handleClaim(prize)}
                        disabled={!!claimingId}
                        className={cn(
                          "px-6 py-3 rounded-xl font-bold text-white shadow-lg relative overflow-hidden",
                          `bg-gradient-to-r ${getPositionColor(prize.position)}`
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {claimingId === prize.id ? (
                          <motion.div
                            className="flex items-center gap-2"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Sparkles className="w-4 h-4" />
                            Einlösen...
                          </motion.div>
                        ) : (
                          <>
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                            <span className="relative z-10 flex items-center gap-2">
                              <Gift className="w-4 h-4" />
                              Einlösen
                            </span>
                          </>
                        )}
                      </motion.button>
                    )}
                    
                    {/* Claimed Badge */}
                    {(prize.claimed || claimedPrizes.has(prize.id)) && (
                      <div className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/50">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          {/* Claim All Button */}
          {hasUnclaimedPrizes && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <motion.button
                onClick={handleClaimAll}
                disabled={!!claimingId}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Alle Preise einlösen ({unclaimedPrizes.length})
                </span>
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

PrizeClaim.displayName = 'PrizeClaim';

