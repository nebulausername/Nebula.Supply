// 🏆 CONTEST TYPES - Weekly, Daily, Seasonal Events!

import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { useCookieClickerStore } from '../../store/cookieClicker';
import {
  Trophy,
  Calendar,
  Clock,
  Flame,
  Gift,
  Star,
  Zap,
  Crown,
  Target
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/cookieFormatters';
import { MonthlyContest } from './MonthlyContest';

export type ContestType = 'monthly' | 'weekly' | 'daily' | 'seasonal';

export interface ContestConfig {
  type: ContestType;
  id: string;
  name: string;
  description: string;
  icon: string;
  duration: number; // in milliseconds
  resetInterval: number; // in milliseconds
  prizes: Array<{
    position: number;
    coins: number;
    premiumInvites?: number;
  }>;
  bonusMultiplier?: number;
}

// 🎯 CONTEST CONFIGS - MAXIMIERT & GEIL!
export const CONTEST_CONFIGS: Record<ContestType, ContestConfig> = {
  monthly: {
    type: 'monthly',
    id: 'monthly',
    name: 'Monatliches Gewinnspiel',
    description: 'Das große monatliche Event mit den besten Preisen!',
    icon: '🏆',
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    resetInterval: 30 * 24 * 60 * 60 * 1000,
    prizes: [
      { position: 1, coins: 50000, premiumInvites: 10 },
      { position: 2, coins: 30000, premiumInvites: 5 },
      { position: 3, coins: 20000, premiumInvites: 3 },
      { position: 4, coins: 10000, premiumInvites: 2 },
      { position: 5, coins: 5000, premiumInvites: 1 },
      { position: 6, coins: 3000 },
      { position: 7, coins: 2000 },
      { position: 8, coins: 1000 },
      { position: 9, coins: 500 },
      { position: 10, coins: 300 },
    ],
  },
  weekly: {
    type: 'weekly',
    id: 'weekly',
    name: 'Wöchentliches Event',
    description: 'Schnelles Event für schnelle Gewinne!',
    icon: '⚡',
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    resetInterval: 7 * 24 * 60 * 60 * 1000,
    prizes: [
      { position: 1, coins: 10000, premiumInvites: 3 },
      { position: 2, coins: 6000, premiumInvites: 2 },
      { position: 3, coins: 4000, premiumInvites: 1 },
      { position: 4, coins: 2000 },
      { position: 5, coins: 1000 },
    ],
    bonusMultiplier: 1.2, // 20% Bonus für aktive Teilnahme
  },
  daily: {
    type: 'daily',
    id: 'daily',
    name: 'Tägliche Challenge',
    description: 'Kleine tägliche Herausforderungen mit schnellen Belohnungen!',
    icon: '🔥',
    duration: 24 * 60 * 60 * 1000, // 1 day
    resetInterval: 24 * 60 * 60 * 1000,
    prizes: [
      { position: 1, coins: 2000 },
      { position: 2, coins: 1000 },
      { position: 3, coins: 500 },
      { position: 4, coins: 300 },
      { position: 5, coins: 200 },
    ],
    bonusMultiplier: 1.5, // 50% Bonus für tägliche Teilnahme
  },
  seasonal: {
    type: 'seasonal',
    id: 'seasonal',
    name: 'Saisonaler Event',
    description: 'Spezielle saisonale Events mit exklusiven Preisen!',
    icon: '❄️',
    duration: 90 * 24 * 60 * 60 * 1000, // 90 days (season)
    resetInterval: 90 * 24 * 60 * 60 * 1000,
    prizes: [
      { position: 1, coins: 100000, premiumInvites: 20, exclusiveUpgrade: 'seasonal_winner' },
      { position: 2, coins: 75000, premiumInvites: 15 },
      { position: 3, coins: 50000, premiumInvites: 10 },
      { position: 4, coins: 30000, premiumInvites: 5 },
      { position: 5, coins: 20000, premiumInvites: 3 },
    ],
    bonusMultiplier: 2.0, // 100% Bonus für saisonale Events
  },
};

// 🏆 CONTEST TYPES COMPONENT - MAXIMIERT & GEIL!
export const ContestTypes = memo(() => {
  const [activeContest, setActiveContest] = useState<ContestType>('monthly');
  const { totalCookies, unlockedAchievements } = useCookieClickerStore();
  
  const getContestTimeRemaining = (type: ContestType): number => {
    const config = CONTEST_CONFIGS[type];
    const now = Date.now();
    
    // Calculate time until next reset
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    
    switch (type) {
      case 'monthly':
        const monthEnd = new Date(now);
        monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return Math.max(0, monthEnd.getTime() - now);
      case 'weekly':
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return Math.max(0, weekEnd.getTime() - now);
      case 'daily':
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        return Math.max(0, dayEnd.getTime() - now);
      case 'seasonal':
        // Seasonal events are special - check current season
        const seasonEnd = new Date(now);
        seasonEnd.setMonth(seasonEnd.getMonth() + 3);
        return Math.max(0, seasonEnd.getTime() - now);
      default:
        return 0;
    }
  };
  
  const formatTimeRemaining = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  
  return (
    <div className="space-y-6">
      {/* Contest Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.values(CONTEST_CONFIGS).map((config) => {
          const timeRemaining = getContestTimeRemaining(config.type);
          const isActive = activeContest === config.type;
          
          return (
            <motion.button
              key={config.type}
              onClick={() => setActiveContest(config.type)}
              className={cn(
                "relative rounded-xl border-2 p-4 text-left transition-all overflow-hidden",
                isActive
                  ? `border-${config.type === 'monthly' ? 'yellow' : config.type === 'weekly' ? 'blue' : config.type === 'daily' ? 'red' : 'purple'}-500/50 bg-gradient-to-br ${config.type === 'monthly' ? 'from-yellow-500/20' : config.type === 'weekly' ? 'from-blue-500/20' : config.type === 'daily' ? 'from-red-500/20' : 'from-purple-500/20'} shadow-lg`
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              )}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              
              <div className="relative z-10">
                <div className="text-3xl mb-2">{config.icon}</div>
                <h3 className="font-bold text-white mb-1">{config.name}</h3>
                <p className="text-xs text-white/60 mb-2">{config.description}</p>
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeRemaining(timeRemaining)}</span>
                </div>
              </div>
              
              {/* Top Prize Preview */}
              {config.prizes[0] && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs">
                    <Trophy className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">
                      {formatNumber(config.prizes[0].coins)} Coins
                    </span>
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Active Contest Content */}
      <div className="mt-6">
        {activeContest === 'monthly' && <MonthlyContest />}
        {/* TODO: Add WeeklyContest, DailyContest, SeasonalContest components */}
        {activeContest !== 'monthly' && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/60">
              {CONTEST_CONFIGS[activeContest].name} - Coming Soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

ContestTypes.displayName = 'ContestTypes';

