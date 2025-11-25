/**
 * LoyaltyRewards Component
 * 
 * Displays available loyalty rewards with:
 * - Category filtering
 * - Point redemption with optimistic updates
 * - Enhanced error handling and validation
 * - Animated reward cards with hover effects
 * - Mobile-optimized layout
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Percent,
  Truck,
  Crown,
  Star,
  Zap,
  Coins,
  CheckCircle,
  AlertCircle,
  Package,
  ArrowUpRight
} from 'lucide-react';
import { useLoyaltyStore } from '../../store/loyalty';
import { useAuthStore } from '../../store/auth';
import { showToast } from '../../store/toast';
import { cn } from '../../utils/cn';
import { useLoyaltyRealtime } from '../../hooks/useLoyaltyRealtime';

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  icon: React.ReactNode;
  category: 'discount' | 'shipping' | 'product' | 'vip';
  available: boolean;
}

export const LoyaltyRewards: React.FC = () => {
  const { user } = useAuthStore();
  const { currentPoints, canRedeem, redeemPoints } = useLoyaltyStore();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'discount' | 'shipping' | 'product' | 'vip'>('all');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Realtime updates for loyalty (points will update automatically via store)
  useLoyaltyRealtime({
    userId: user?.id,
    enabled: !!user?.id
  });

  const rewards: Reward[] = [
    {
      id: 'discount_10',
      title: '10% Rabatt auf nächste Bestellung',
      description: 'Erhalte 10% Rabatt auf deine nächste Bestellung (max. €50)',
      pointsCost: 500,
      icon: <Percent className="h-6 w-6 text-green-400" />,
      category: 'discount',
      available: true
    },
    {
      id: 'discount_15',
      title: '15% Rabatt auf nächste Bestellung',
      description: 'Erhalte 15% Rabatt auf deine nächste Bestellung (max. €75)',
      pointsCost: 750,
      icon: <Percent className="h-6 w-6 text-blue-400" />,
      category: 'discount',
      available: true
    },
    {
      id: 'free_shipping',
      title: 'Kostenloser Versand',
      description: 'Kostenloser Versand für deine nächste Bestellung',
      pointsCost: 300,
      icon: <Truck className="h-6 w-6 text-purple-400" />,
      category: 'shipping',
      available: true
    },
    {
      id: 'priority_support',
      title: 'Priority Support für 30 Tage',
      description: 'Erhalte vorrangigen Support für alle Anfragen',
      pointsCost: 200,
      icon: <Crown className="h-6 w-6 text-yellow-400" />,
      category: 'vip',
      available: true
    },
    {
      id: 'mystery_box',
      title: 'Mystery Product Box',
      description: 'Erhalte eine Überraschungs-Box mit exklusiven Produkten',
      pointsCost: 1000,
      icon: <Gift className="h-6 w-6 text-orange-400" />,
      category: 'product',
      available: true
    },
    {
      id: 'early_access',
      title: 'Frühzeitiger Zugang zu Drops',
      description: '24h früher Zugang zu neuen Produkt-Drops',
      pointsCost: 800,
      icon: <Zap className="h-6 w-6 text-cyan-400" />,
      category: 'vip',
      available: true
    }
  ];

  const filteredRewards = selectedCategory === 'all'
    ? rewards
    : rewards.filter(reward => reward.category === selectedCategory);

  const handleRedeem = async (reward: Reward) => {
    // Enhanced validation
    if (!user?.id) {
      showToast.error(
        'Fehler',
        'Du musst angemeldet sein, um Belohnungen einzulösen'
      );
      return;
    }

    if (!canRedeem(reward.pointsCost)) {
      showToast.error(
        'Nicht genügend Punkte',
        `Du benötigst ${reward.pointsCost} Punkte für diese Belohnung. Du hast aktuell ${currentPoints} Punkte.`
      );
      return;
    }

    if (!reward.available) {
      showToast.error(
        'Belohnung nicht verfügbar',
        'Diese Belohnung ist derzeit nicht verfügbar'
      );
      return;
    }

    setRedeemingId(reward.id);

    // Optimistic update: Show success immediately
    const optimisticSuccess = redeemPoints(
      reward.pointsCost,
      `Eingelöst: ${reward.title}`
    );

    if (!optimisticSuccess) {
      setRedeemingId(null);
      showToast.error(
        'Einlösung fehlgeschlagen',
        'Die Belohnung konnte nicht aktiviert werden. Bitte versuche es erneut.'
      );
      return;
    }

    // Show success toast immediately (optimistic)
    showToast.success(
      'Belohnung eingelöst!',
      `${reward.title} wurde erfolgreich aktiviert`
    );

    try {
      // Here you would typically make an API call to activate the reward
      // For now, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`🎁 Activating reward: ${reward.id} for user ${user.id}`);
      
      // If API call fails, we could rollback the optimistic update here
      // For now, we assume success since the store update already happened
    } catch (error) {
      console.error('Error activating reward:', error);
      
      // Rollback optimistic update on error
      // Note: This would require a rollback function in the store
      // For now, we just show an error but keep the optimistic update
      showToast.error(
        'Aktivierung fehlgeschlagen',
        'Die Belohnung wurde eingelöst, aber die Aktivierung ist fehlgeschlagen. Bitte kontaktiere den Support.'
      );
    } finally {
      setRedeemingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'discount': return <Percent className="h-4 w-4" />;
      case 'shipping': return <Truck className="h-4 w-4" />;
      case 'product': return <Gift className="h-4 w-4" />;
      case 'vip': return <Crown className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'discount': return 'Rabatte';
      case 'shipping': return 'Versand';
      case 'product': return 'Produkte';
      case 'vip': return 'VIP';
      default: return 'Alle';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Loyalty Belohnungen</h2>
        <p className="text-slate-400">
          Löse deine Punkte gegen exklusive Belohnungen ein
        </p>
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="flex items-center justify-center gap-2">
            <Coins className="h-5 w-5 text-orange-400" />
            <span className="text-xl font-bold text-orange-400">
              {currentPoints.toLocaleString()} Punkte verfügbar
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { id: 'all', label: 'Alle', icon: <Star className="h-4 w-4" /> },
          { id: 'discount', label: 'Rabatte', icon: <Percent className="h-4 w-4" /> },
          { id: 'shipping', label: 'Versand', icon: <Truck className="h-4 w-4" /> },
          { id: 'product', label: 'Produkte', icon: <Gift className="h-4 w-4" /> },
          { id: 'vip', label: 'VIP', icon: <Crown className="h-4 w-4" /> }
        ].map((category) => (
          <motion.button
            key={category.id}
            onClick={() => setSelectedCategory(category.id as any)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              selectedCategory === category.id
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg ring-2 ring-offset-2 ring-offset-slate-900 ring-orange-500/50"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
          >
            {category.icon}
            {category.label}
          </motion.button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRewards.map((reward, index) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className={cn(
              "p-6 rounded-xl border transition-all relative overflow-hidden group",
              reward.available
                ? "bg-slate-800/50 border-slate-700 hover:border-orange-500/50 hover:bg-slate-700/50 shadow-lg hover:shadow-orange-500/20"
                : "bg-slate-900/50 border-slate-600 opacity-60"
            )}
          >
            {/* Hover glow effect */}
            {reward.available && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
            )}
            <div className="flex items-start gap-4">
              <motion.div 
                className={cn(
                  "p-3 rounded-lg",
                  reward.available
                    ? "bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-orange-500/20 group-hover:to-orange-600/20 transition-all"
                    : "bg-slate-800"
                )}
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                {reward.icon}
              </motion.div>

              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{reward.title}</h3>
                <p className="text-sm text-slate-400 mb-3">{reward.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-orange-400" />
                    <span className="font-bold text-orange-400">
                      {reward.pointsCost.toLocaleString()}
                    </span>
                    <span className="text-sm text-slate-400">Punkte</span>
                  </div>

                  <motion.button
                    onClick={() => handleRedeem(reward)}
                    disabled={!reward.available || !canRedeem(reward.pointsCost) || redeemingId === reward.id}
                    whileHover={reward.available && canRedeem(reward.pointsCost) ? { scale: 1.05 } : {}}
                    whileTap={reward.available && canRedeem(reward.pointsCost) ? { scale: 0.95 } : {}}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 relative overflow-hidden",
                      reward.available && canRedeem(reward.pointsCost)
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/50"
                        : "bg-slate-700 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {redeemingId === reward.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Einlösen...
                      </>
                    ) : (
                      <>
                        <Gift className="h-4 w-4" />
                        Einlösen
                      </>
                    )}
                  </motion.button>
                </div>

                {!canRedeem(reward.pointsCost) && reward.available && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    Nicht genügend Punkte verfügbar
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredRewards.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Keine Belohnungen in dieser Kategorie verfügbar</p>
        </div>
      )}

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-blue-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
        <div className="relative flex items-start gap-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            <CheckCircle className="h-6 w-6 text-blue-400 mt-0.5" />
          </motion.div>
          <div className="text-sm">
            <p className="font-bold text-white mb-2 text-base">Wie verdiene ich Punkte?</p>
            <ul className="space-y-2 text-blue-300">
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-400" />
                <span>Automatisch bei erfolgreich abgeschlossenen Bestellungen</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-white">1 Punkt pro 100€ Bestellwert</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-blue-400" />
                <span>Punkte werden automatisch vergeben, sobald die Bestellung als geliefert markiert wird</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};




