import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { useVipStore } from './vip';
import { useAuthStore } from './auth';

// 🍪 GEILE COOKIE CLICKER TYPES - DEUTSCH & SÜCHTIG!
export interface CookieClickerState {
  // 🎯 KERN STATS - DAS WICHTIGE ZEUG
  cookies: number;
  totalCookies: number;
  cookiesPerClick: number;
  cookiesPerSecond: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  maxStreak: number;
  
  // 🎮 SPIEL FORTSCHRITT
  clicks: number;
  timePlayed: number;
  lastSaveTime: number;
  prestigeLevel: number;
  prestigePoints: number;
  
  // 🏗️ GEBÄUDE & UPGRADES
  upgrades: Record<string, boolean>;
  buildings: Record<string, number>;
  achievements: string[];
  
  // 🪙 COIN SYSTEM - NEU!
  coins: number;
  coinMultiplier: number;
  coinShopDiscounts: Record<string, number>; // Produkt ID -> Rabatt %
  
  // 🏆 ACHIEVEMENT SYSTEM - NEU!
  unlockedAchievements: string[];
  achievementNotifications: AchievementNotification[];
  
  // 🏅 LEADERBOARD SYSTEM - NEU!
  playerName: string;
  playerRank: number;
  
  // ✨ VISUELLE EFFEKTE - GEIL!
  particles: Particle[];
  goldenCookies: GoldenCookie[];
  lastClickTime: number;
  
  // 🎵 EINSTELLUNGEN - EINFACH & GEIL
  soundEnabled: boolean;
  animationsEnabled: boolean;
  performanceMode: boolean;
  
  // 🎮 ACTIVE SYSTEM - NEU!
  isActiveSession: boolean;
  sessionStartTime: number;
  totalActiveTime: number;
  lastPauseTime: number | null;
  
  // 🌟 VIP PASSIVE INCOME - NEU!
  hasVipPassiveIncome: boolean;
  offlineCpsMultiplier: number;
  vipTier: string | null;
  
  // Actions
  clickCookie: (x: number, y: number) => void;
  buyBuilding: (buildingId: string) => void;
  buyUpgrade: (upgradeId: string) => void;
  tick: () => void;
  prestige: () => void;
  toggleSound: () => void;
  toggleAnimations: () => void;
  togglePerformanceMode: () => void;
  cleanupParticles: () => void;
  
  // 🪙 COIN ACTIONS - NEU!
  earnCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  buyCoinShopDiscount: (productId: string, discountPercent: number, cost: number) => void;
  
  // 🎮 GAMING DISCOUNT ACTIONS - NEU!
  spendCookiesForDiscount: (amount: number) => void;
  
  // 🏆 ACHIEVEMENT ACTIONS - NEU!
  unlockAchievement: (achievementId: string) => void;
  checkAchievements: () => void;
  clearAchievementNotifications: () => void;
  
  // 🏅 LEADERBOARD ACTIONS - NEU!
  updatePlayerName: (name: string) => void;
  updatePlayerRank: () => void;
  syncStatsToServer: () => Promise<void>;
  
  // 🎮 ACTIVE SYSTEM ACTIONS - NEU!
  pauseSession: () => void;
  resumeSession: () => void;
  updateActiveStatus: (isActive: boolean) => void;
  checkVipStatus: () => void;
  calculateOfflineProgress: (secondsOffline: number) => number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  value: number;
  timestamp: number;
  type: 'click' | 'golden' | 'critical' | 'combo' | 'coin' | 'achievement';
  color?: string;
  size?: number;
}

export interface GoldenCookie {
  id: string;
  x: number;
  y: number;
  timestamp: number;
  effect: string;
  duration: number;
}

export interface AchievementNotification {
  id: string;
  achievementId: string;
  timestamp: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'nebula';
}

// 🎯 MILESTONE RARITY MAPPING - Legacy Support
export type MilestoneRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'nebula';
export type LegacyRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export const mapLegacyRarity = (rarity: string): MilestoneRarity => {
  // Legacy mapping für alte Rarities
  const legacyMapping: Record<string, MilestoneRarity> = {
    'genesis': 'common',
    'ascension': 'uncommon',
    'transcendence': 'rare',
    'divinity': 'epic',
    'cosmos': 'legendary',
    'mythic': 'legendary'
  };
  
  // Wenn es bereits eine neue Rarity ist, direkt zurückgeben
  if (['common', 'uncommon', 'rare', 'epic', 'legendary', 'nebula'].includes(rarity)) {
    return rarity as MilestoneRarity;
  }
  
  return legacyMapping[rarity] || 'common';
};

export interface Building {
  id: string;
  name: string;
  baseCost: number;
  baseCps: number;
  description: string;
  icon: string;
}

export interface Upgrade {
  id: string;
  name: string;
  cost: number;
  description: string;
  effect: string;
  icon: string;
  requirement?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'nebula';
  requirement: number;
  reward: number; // Coins
}

export interface LeaderboardPlayer {
  id: string;
  name: string;
  cookies: number;
  level: number;
  prestige: number;
  rank: number;
  avatar: string;
  isReal: boolean;
}

// 🏗️ GEBÄUDE - DEUTSCHE NAMEN & GEILE BESCHREIBUNGEN! (×3 CPS für Active System)
export const BUILDINGS: Building[] = [
  {
    id: 'cursor',
    name: 'Klicker',
    baseCost: 15,
    baseCps: 0.3,  // ×3
    description: 'Klickt automatisch alle 10 Sekunden!',
    icon: '🖱️'
  },
  {
    id: 'grandma',
    name: 'Oma',
    baseCost: 100,
    baseCps: 3,  // ×3
    description: 'Eine nette Oma die fleißig Kekse backt!',
    icon: '👵'
  },
  {
    id: 'farm',
    name: 'Bauernhof',
    baseCost: 1100,
    baseCps: 24,  // ×3
    description: 'Baut Keks-Pflanzen an!',
    icon: '🚜'
  },
  {
    id: 'mine',
    name: 'Mine',
    baseCost: 12000,
    baseCps: 141,  // ×3
    description: 'Gräbt Keks-Teig und Schokoladen-Chips aus!',
    icon: '⛏️'
  },
  {
    id: 'factory',
    name: 'Fabrik',
    baseCost: 130000,
    baseCps: 780,  // ×3
    description: 'Produziert massenhaft Kekse!',
    icon: '🏭'
  },
  {
    id: 'bank',
    name: 'Bank',
    baseCost: 1400000,
    baseCps: 4200,  // ×3
    description: 'Verdient Kekse durch Zinsen!',
    icon: '🏦'
  },
  {
    id: 'temple',
    name: 'Tempel',
    baseCost: 20000000,
    baseCps: 23400,  // ×3
    description: 'Voll mit kostbarer, alter Schokolade!',
    icon: '🏛️'
  },
  {
    id: 'wizard_tower',
    name: 'Zauberturm',
    baseCost: 330000000,
    baseCps: 132000,  // ×3
    description: 'Beschwört Kekse mit Zauberformeln!',
    icon: '🧙'
  },
  {
    id: 'shipment',
    name: 'Raumschiff',
    baseCost: 5100000000,
    baseCps: 780000,  // ×3
    description: 'Bringt Kekse aus dem Weltall!',
    icon: '🚀'
  },
  {
    id: 'alchemy_lab',
    name: 'Alchemie-Labor',
    baseCost: 75000000000,
    baseCps: 4800000,  // ×3
    description: 'Verwandelt Blei in goldene Kekse!',
    icon: '⚗️'
  }
];

// ⚡ UPGRADES - DEUTSCHE NAMEN & GEILE EFFEKTE!
export const UPGRADES: Upgrade[] = [
  {
    id: 'reinforced_index',
    name: 'Verstärkter Zeigefinger',
    cost: 100,
    description: 'Dein Finger ist doppelt so stark!',
    effect: 'cookiesPerClick *= 2',
    icon: '👆'
  },
  {
    id: 'carpal_tunnel_prevention_cream',
    name: 'Karpaltunnel-Creme',
    cost: 500,
    description: 'Dein Finger ist doppelt so stark!',
    effect: 'cookiesPerClick *= 2',
    icon: '🧴'
  },
  {
    id: 'ambidextrous',
    name: 'Beidhändig',
    cost: 10000,
    description: 'Beide Hände klicken gleichzeitig!',
    effect: 'cookiesPerClick *= 2',
    icon: '🤲'
  },
  {
    id: 'thousand_fingers',
    name: 'Tausend Finger',
    cost: 100000,
    description: 'Tausend Finger klicken für dich!',
    effect: 'cookiesPerClick *= 2',
    icon: '👐'
  },
  {
    id: 'million_fingers',
    name: 'Million Finger',
    cost: 1000000,
    description: 'Eine Million Finger klicken!',
    effect: 'cookiesPerClick *= 2',
    icon: '👐👐'
  },
  {
    id: 'billion_fingers',
    name: 'Milliarde Finger',
    cost: 10000000,
    description: 'Eine Milliarde Finger klicken!',
    effect: 'cookiesPerClick *= 2',
    icon: '👐👐👐'
  }
];

// 🏆 MILESTONES - EPISCHE MEILENSTEINE! (Früher: Achievements)
export const ACHIEVEMENTS: Achievement[] = [
  // GEWÖHNLICH - Der Anfang der Reise
  {
    id: 'first_click',
    name: 'Erster Klick',
    description: 'Der erste Klick, der Beginn einer Legende!',
    icon: '🍪',
    rarity: 'common',
    requirement: 1,
    reward: 10
  },
  {
    id: 'hundred_cookies',
    name: 'Keim des Reichtums',
    description: 'Die ersten 100 Kekse - dein Vermögen wächst!',
    icon: '🌱',
    rarity: 'common',
    requirement: 100,
    reward: 25
  },
  {
    id: 'thousand_cookies',
    name: 'Erste Blüte',
    description: 'Tausend Kekse gesammelt - die Saat ist gesät!',
    icon: '🌸',
    rarity: 'common',
    requirement: 1000,
    reward: 50
  },
  {
    id: 'first_building',
    name: 'Grundstein gelegt',
    description: 'Dein erstes Gebäude - der Grundstein des Imperiums!',
    icon: '🏗️',
    rarity: 'common',
    requirement: 1,
    reward: 30
  },
  
  // UNGEWÖHNLICH - Der Aufstieg beginnt
  {
    id: 'million_cookies',
    name: 'Aufstieg zur Million',
    description: 'Eine Million Kekse - du steigst auf!',
    icon: '📈',
    rarity: 'uncommon',
    requirement: 1000000,
    reward: 100
  },
  {
    id: 'combo_master',
    name: 'Combo-Meister',
    description: '50x Combo erreicht - deine Geschwindigkeit steigt!',
    icon: '⚡',
    rarity: 'uncommon',
    requirement: 50,
    reward: 150
  },
  {
    id: 'level_10',
    name: 'Erleuchteter Klicker',
    description: 'Level 10 erreicht - neue Horizonte erwarten dich!',
    icon: '🌟',
    rarity: 'uncommon',
    requirement: 10,
    reward: 200
  },
  
  // SELTEN - Über die Grenzen hinaus
  {
    id: 'billion_cookies',
    name: 'Milliarden-Meister',
    description: 'Eine Milliarde Kekse - du übersteigst alle Grenzen!',
    icon: '💎',
    rarity: 'rare',
    requirement: 1000000000,
    reward: 500
  },
  {
    id: 'prestige_master',
    name: 'Prestige-Meister',
    description: 'Dein erster Prestige - du beginnst von Neuem, stärker als je zuvor!',
    icon: '♻️',
    rarity: 'rare',
    requirement: 1,
    reward: 1000
  },
  {
    id: 'level_50',
    name: 'Höhere Stufe',
    description: 'Level 50 erreicht - du übersteigst die gewöhnlichen Grenzen!',
    icon: '✨',
    rarity: 'rare',
    requirement: 50,
    reward: 750
  },
  
  // EPISCH - Mächtige Errungenschaften
  {
    id: 'trillion_cookies',
    name: 'Billionen-Schatz',
    description: 'Eine Billion Kekse - ein Schatz epischen Ausmaßes!',
    icon: '👑',
    rarity: 'epic',
    requirement: 1000000000000,
    reward: 2500
  },
  {
    id: 'combo_legend',
    name: 'Epische Geschwindigkeit',
    description: '100x Combo erreicht - deine Geschwindigkeit ist episch!',
    icon: '🔥',
    rarity: 'epic',
    requirement: 100,
    reward: 2000
  },
  {
    id: 'level_100',
    name: 'Epische Stufe',
    description: 'Level 100 erreicht - du hast epische Macht erlangt!',
    icon: '💫',
    rarity: 'epic',
    requirement: 100,
    reward: 3000
  },
  
  // LEGENDÄR - Legendäre Macht
  {
    id: 'quadrillion_cookies',
    name: 'Legendärer Reichtum',
    description: 'Eine Quadrillion Kekse - dein Vermögen ist legendär!',
    icon: '🌌',
    rarity: 'legendary',
    requirement: 1000000000000000,
    reward: 10000
  },
  {
    id: 'combo_myth',
    name: 'Legendäre Geschwindigkeit',
    description: '500x Combo erreicht - du bewegst dich mit legendärer Geschwindigkeit!',
    icon: '🚀',
    rarity: 'legendary',
    requirement: 500,
    reward: 15000
  },
  {
    id: 'level_1000',
    name: 'Legendäre Stufe',
    description: 'Level 1000 erreicht - du hast legendäre Macht erlangt!',
    icon: '⭐',
    rarity: 'legendary',
    requirement: 1000,
    reward: 20000
  },
  
  // NEBULA - Das Allerbeste!
  {
    id: 'quintillion_cookies',
    name: 'Nebula-Meister',
    description: 'Eine Quintillion Kekse - du hast Nebula-Level erreicht!',
    icon: '🌠',
    rarity: 'nebula',
    requirement: 1000000000000000000,
    reward: 50000
  },
  {
    id: 'combo_nebula',
    name: 'Nebula-Geschwindigkeit',
    description: '1000x Combo erreicht - du bewegst dich mit Nebula-Geschwindigkeit!',
    icon: '⚡',
    rarity: 'nebula',
    requirement: 1000,
    reward: 40000
  },
  {
    id: 'level_nebula',
    name: 'Nebula-Stufe',
    description: 'Level 5000 erreicht - du hast die ultimative Nebula-Macht erlangt!',
    icon: '🌟',
    rarity: 'nebula',
    requirement: 5000,
    reward: 60000
  }
];

// 🪙 COIN SHOP DISCOUNTS - BALANCIERTE RABATTE!
export const COIN_SHOP_DISCOUNTS = [
  {
    id: 'product_discount_5',
    name: '5% Produkt Rabatt',
    description: '5% Rabatt auf alle Shop Produkte',
    discountPercent: 5,
    cost: 500,
    icon: '🛍️',
    type: 'product'
  },
  {
    id: 'product_discount_10',
    name: '10% Produkt Rabatt',
    description: '10% Rabatt auf alle Shop Produkte',
    discountPercent: 10,
    cost: 2000,
    icon: '🛒',
    type: 'product'
  },
  {
    id: 'product_discount_15',
    name: '15% Produkt Rabatt',
    description: '15% Rabatt auf alle Shop Produkte',
    discountPercent: 15,
    cost: 5000,
    icon: '💸',
    type: 'product'
  },
  {
    id: 'drop_discount_10',
    name: '10% Drop Rabatt',
    description: '10% Rabatt auf alle Drops',
    discountPercent: 10,
    cost: 1000,
    icon: '🎁',
    type: 'drop'
  },
  {
    id: 'drop_discount_20',
    name: '20% Drop Rabatt',
    description: '20% Rabatt auf alle Drops',
    discountPercent: 20,
    cost: 3000,
    icon: '🎊',
    type: 'drop'
  },
  {
    id: 'drop_discount_30',
    name: '30% Drop Rabatt',
    description: '30% Rabatt auf alle Drops',
    discountPercent: 30,
    cost: 8000,
    icon: '🎉',
    type: 'drop'
  }
];

// 🏅 FAKE LEADERBOARD PLAYERS - GEILE NAMEN!
export const FAKE_LEADERBOARD_PLAYERS: LeaderboardPlayer[] = [
  {
    id: 'player_1',
    name: 'CookieMonster',
    cookies: 15000000000,
    level: 45,
    prestige: 3,
    rank: 1,
    avatar: '🍪',
    isReal: false
  },
  {
    id: 'player_2',
    name: 'KeksKaiser',
    cookies: 12000000000,
    level: 42,
    prestige: 2,
    rank: 2,
    avatar: '👑',
    isReal: false
  },
  {
    id: 'player_3',
    name: 'SchokoKönig',
    cookies: 9500000000,
    level: 38,
    prestige: 2,
    rank: 3,
    avatar: '🍫',
    isReal: false
  },
  {
    id: 'player_4',
    name: 'KeksKrieger',
    cookies: 7800000000,
    level: 35,
    prestige: 1,
    rank: 4,
    avatar: '⚔️',
    isReal: false
  },
  {
    id: 'player_5',
    name: 'CookieCrusher',
    cookies: 6200000000,
    level: 32,
    prestige: 1,
    rank: 5,
    avatar: '💥',
    isReal: false
  },
  {
    id: 'player_6',
    name: 'KeksKönigin',
    cookies: 4800000000,
    level: 28,
    prestige: 1,
    rank: 6,
    avatar: '👸',
    isReal: false
  },
  {
    id: 'player_7',
    name: 'SchokoSultan',
    cookies: 3600000000,
    level: 25,
    prestige: 0,
    rank: 7,
    avatar: '🕌',
    isReal: false
  },
  {
    id: 'player_8',
    name: 'CookieCzar',
    cookies: 2800000000,
    level: 22,
    prestige: 0,
    rank: 8,
    avatar: '🏰',
    isReal: false
  },
  {
    id: 'player_9',
    name: 'KeksKaiserin',
    cookies: 2100000000,
    level: 19,
    prestige: 0,
    rank: 9,
    avatar: '👑',
    isReal: false
  },
  {
    id: 'player_10',
    name: 'SchokoShogun',
    cookies: 1500000000,
    level: 16,
    prestige: 0,
    rank: 10,
    avatar: '🗾',
    isReal: false
  }
];

// 🎮 GEILE COOKIE CLICKER STORE - BALANCIERT & SCHWIERIGER!
export const useCookieClickerStore = create<CookieClickerState>()(
  persist(
    immer((set, get) => ({
      // 🎯 ANFANGS STATS - FRISCH GESTARTET!
      cookies: 0,
      totalCookies: 0,
      cookiesPerClick: 1,
      cookiesPerSecond: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
      streak: 0,
      maxStreak: 0,
      clicks: 0,
      timePlayed: 0,
      lastSaveTime: Date.now(),
      prestigeLevel: 0,
      prestigePoints: 0,
      upgrades: {},
      buildings: {},
      achievements: [],
      particles: [],
      goldenCookies: [],
      lastClickTime: 0,
      soundEnabled: true,
      animationsEnabled: true,
      performanceMode: false,
      
      // 🪙 COIN SYSTEM - NEU!
      coins: 0,
      coinMultiplier: 1,
      coinShopDiscounts: {},

      // 🏆 ACHIEVEMENT SYSTEM - NEU!
      unlockedAchievements: [],
      achievementNotifications: [],

      // 🏅 LEADERBOARD SYSTEM - NEU!
      playerName: 'Spieler',
      playerRank: 999,
      
      // 🎮 ACTIVE SYSTEM - NEU!
      isActiveSession: true,           // Start aktiv
      sessionStartTime: Date.now(),
      totalActiveTime: 0,
      lastPauseTime: null,
      
      // 🌟 VIP PASSIVE INCOME - NEU!
      hasVipPassiveIncome: false,      // Check on load
      offlineCpsMultiplier: 0,         // 0 = kein VIP
      vipTier: null,

      // 🍪 COOKIE KLICKEN - SCHWIERIGER! (Optimiert mit Batch Updates)
      clickCookie: (x: number, y: number) => {
        set((state) => {
          const now = Date.now();
          const timeSinceLastClick = now - state.lastClickTime;
          
          // 🎯 COOKIES BERECHNEN - WENIGER COOKIES!
          let cookiesGained = state.cookiesPerClick;
          
          // 🎲 KRITISCHER TREFFER (10% CHANCE) - WENIGER OFT!
          const isCritical = Math.random() < 0.10; // 10% statt 15%
          if (isCritical) {
            cookiesGained *= 10; // 10x statt 20x - WENIGER!
          }
          
          // 🔥 COMBO SYSTEM - WENIGER BONUS! CAP BEI 2X!
          let newStreak = state.streak;
          if (timeSinceLastClick < 2000) { // 2 Sekunden für Combo
            newStreak++;
            state.maxStreak = Math.max(state.maxStreak, newStreak);
            
            // 🎯 COMBO MULTIPLIER - WENIGER BONUS! MAX 2X TOTAL!
            const baseComboMultiplier = 1 + (newStreak * 0.10); // 10% statt 15%
            const cappedComboMultiplier = Math.min(2.0, baseComboMultiplier); // CAP bei 2x!
            cookiesGained *= cappedComboMultiplier;
          } else {
            newStreak = 0; // Combo verloren!
          }
          
          // 🎯 BATCH UPDATE: Alle Stats in einem Update
          const xpGained = Math.floor(cookiesGained / 10); // 10 statt 5 - WENIGER XP!
          const coinsEarned = Math.floor(cookiesGained / 5000) * state.coinMultiplier; // 5000 statt 1000 - EXTREM WENIGER!
          
          // 🎯 STATS UPDATEN - BATCH
          state.cookies += cookiesGained;
          state.totalCookies += cookiesGained;
          state.clicks++;
          state.lastClickTime = now;
          state.streak = newStreak;
          state.xp += xpGained;
          
          if (coinsEarned > 0) {
            state.coins += coinsEarned;
          }
          
          // 🎉 LEVEL UP CHECK - In Batch Update integriert
          const shouldLevelUp = state.xp >= state.xpToNextLevel;
          if (shouldLevelUp) {
            state.level++;
            state.xp = 0;
            state.xpToNextLevel = Math.floor(state.xpToNextLevel * 1.3); // 1.3x statt 1.2x - SCHWIERIGER!
            
            // 🎁 LEVEL UP BONUS - WENIGER!
            state.cookiesPerClick += 1; // 1 statt 2 - WENIGER BONUS!
            state.coins += state.level * 2; // 2 statt 5 - WENIGER COINS!
          }
          
          // ✨ PARTICLE EFFECTS - GEIL! (Nur wenn Animationen aktiv)
          if (state.animationsEnabled && !state.performanceMode) {
            const particleType = isCritical ? 'critical' : 
                                newStreak >= 10 ? 'combo' : 
                                coinsEarned > 0 ? 'coin' : 'click';
            
            // 🚀 Performance: Nur Particles hinzufügen wenn unter Limit
            if (state.particles.length < 50) {
              state.particles.push({
                id: Math.random().toString(36).substr(2, 9),
                x,
                y,
                value: cookiesGained,
                timestamp: now,
                type: particleType,
                color: particleType === 'critical' ? '#ff0000' : 
                       particleType === 'combo' ? '#ffff00' :
                       particleType === 'coin' ? '#ffd700' : '#ff8c00',
                size: particleType === 'critical' ? 24 : 
                      particleType === 'combo' ? 20 : 16
              });
            } else {
              // 🧹 CLEANUP: Ersetze älteste Particle statt alle zu löschen
              const oldestIndex = state.particles.findIndex(
                p => now - p.timestamp > 2000
              );
              if (oldestIndex !== -1) {
                state.particles[oldestIndex] = {
                  id: Math.random().toString(36).substr(2, 9),
                  x,
                  y,
                  value: cookiesGained,
                  timestamp: now,
                  type: particleType,
                  color: particleType === 'critical' ? '#ff0000' : 
                         particleType === 'combo' ? '#ffff00' :
                         particleType === 'coin' ? '#ffd700' : '#ff8c00',
                  size: particleType === 'critical' ? 24 : 
                        particleType === 'combo' ? 20 : 16
                };
              }
            }
          }
        });
        
        // ✅ ACHIEVEMENT CHECK - NACH DEM STATE UPDATE! (Außerhalb von set für bessere Performance)
        // Deferred check um State-Update nicht zu blockieren
        requestAnimationFrame(() => {
          get().checkAchievements();
        });
      },

      // 🏗️ GEBÄUDE KAUFEN - INVESTITION! (Optimiert mit Batch Updates)
      buyBuilding: (buildingId: string) => {
        set((state) => {
          const building = BUILDINGS.find(b => b.id === buildingId);
          if (!building) return;
          
          const owned = state.buildings[buildingId] || 0;
          const cost = Math.floor(building.baseCost * Math.pow(1.2, owned)); // 1.2 statt 1.15 - TEURER!
          
          if (state.cookies >= cost) {
            // 🎯 BATCH UPDATE: Alle Änderungen in einem Update
            state.cookies -= cost;
            state.buildings[buildingId] = (state.buildings[buildingId] || 0) + 1;
            
            // 🎯 CPS NEU BERECHNEN - Optimiert: Nur wenn sich etwas geändert hat
            const newCount = state.buildings[buildingId];
            const cpsIncrease = building.baseCps;
            state.cookiesPerSecond += cpsIncrease; // Additiv statt komplett neu berechnen
          }
        });
        
        // ✅ ACHIEVEMENT CHECK - Deferred für bessere Performance
        requestAnimationFrame(() => {
          get().checkAchievements();
        });
      },

      // ⚡ UPGRADE KAUFEN - POWER UP! (Optimiert mit Batch Updates)
      buyUpgrade: (upgradeId: string) => {
        set((state) => {
          const upgrade = UPGRADES.find(u => u.id === upgradeId);
          if (!upgrade) return;
          
          if (state.cookies >= upgrade.cost && !state.upgrades[upgradeId]) {
            // 🎯 BATCH UPDATE: Alle Änderungen in einem Update
            state.cookies -= upgrade.cost;
            state.upgrades[upgradeId] = true;
            
            // 🎯 UPGRADE EFFEKT ANWENDEN
            if (upgrade.effect.includes('cookiesPerClick')) {
              state.cookiesPerClick *= 2;
            }
          }
        });
        
        // ✅ ACHIEVEMENT CHECK - Deferred für bessere Performance
        requestAnimationFrame(() => {
          get().checkAchievements();
        });
      },

      // 🎯 ACTIVE TICK SYSTEM - DELTA-TIME BASIERT für bessere Performance! (Optimiert)
      tick: () => {
        set((state) => {
          const now = Date.now();
          const deltaTime = Math.min((now - state.lastSaveTime) / 1000, 1.0); // Cap bei 1s für Stabilität
          
          // 🎮 CHECK: Ist Session aktiv?
          if (!state.isActiveSession) {
            // Pausiert - keine Cookies! Nur timestamp aktualisieren
            state.lastSaveTime = now;
            return;
          }
          
          // 🌟 VIP OFFLINE PROGRESS (Einmalig beim Resume)
          if (state.hasVipPassiveIncome && state.lastPauseTime) {
            const offlineTime = (now - state.lastPauseTime) / 1000;
            const offlineCookies = state.calculateOfflineProgress(offlineTime);
            
            if (offlineCookies > 0) {
              state.cookies += offlineCookies;
              state.totalCookies += offlineCookies;
            }
            
            state.lastPauseTime = null; // Reset nach einmaliger Berechnung
          }
          
          // 🍪 AUTOMATISCHE COOKIES (Nur bei aktiver Session!) - BATCH UPDATE
          if (state.cookiesPerSecond > 0) {
            const cookiesGained = state.cookiesPerSecond * deltaTime;
            const xpGained = Math.floor(cookiesGained / 20);
            const coinsGained = Math.floor(cookiesGained / 10000) * state.coinMultiplier;
            
            // 🎯 BATCH UPDATE: Alle Stats in einem Update
            state.cookies += cookiesGained;
            state.totalCookies += cookiesGained;
            state.xp += xpGained;
            
            if (coinsGained > 0) {
              state.coins += coinsGained;
            }
            
            // 🎉 LEVEL UP CHECK - In Batch Update integriert
            if (state.xp >= state.xpToNextLevel) {
              state.level++;
              state.xp = 0;
              state.xpToNextLevel = Math.floor(state.xpToNextLevel * 1.3);
              state.cookiesPerClick += 1;
              state.coins += state.level * 2;
            }
          }
          
          // 🎯 BATCH UPDATE: Time tracking
          state.timePlayed += deltaTime;
          state.totalActiveTime += deltaTime; // Track aktive Zeit
          state.lastSaveTime = now;
          
          // 🧹 PARTICLE CLEANUP - Optimiert: Nur wenn nötig
          if (state.animationsEnabled && state.particles.length > 0) {
            // 🚀 Performance: Nur filtern wenn Particles älter als 2s
            const cutoffTime = now - 2000;
            const needsCleanup = state.particles.some(p => p.timestamp < cutoffTime);
            
            if (needsCleanup) {
              state.particles = state.particles.filter(
                p => p.timestamp >= cutoffTime
              );
            }
            
            // Zusätzliches Limit für Sicherheit
            if (state.particles.length > 50) {
              state.particles = state.particles.slice(-50);
            }
          }
        });
        
        // ✅ ACHIEVEMENT CHECK - Deferred für bessere Performance (nur alle 5 Ticks)
        const tickCount = (get().clicks + get().timePlayed) % 5;
        if (tickCount === 0) {
          requestAnimationFrame(() => {
            get().checkAchievements();
          });
        }
      },

      // 🏆 PRESTIGE SYSTEM - NEUSTART MIT BONUS!
      prestige: () => {
        set((state) => {
          if (state.totalCookies >= 1000000) {
            const prestigePoints = Math.floor(state.totalCookies / 1000000);
            state.prestigeLevel++;
            state.prestigePoints += prestigePoints;
            
            // 🎯 GAME RESET - ABER MIT BONUS!
            state.cookies = 0;
            state.totalCookies = 0;
            state.cookiesPerClick = 1 + (prestigePoints * 0.1); // 0.1 statt 0.2 - WENIGER BONUS!
            state.cookiesPerSecond = 0;
            state.level = 1;
            state.xp = 0;
            state.xpToNextLevel = 1000;
            state.streak = 0;
            state.clicks = 0;
            state.upgrades = {};
            state.buildings = {};
            state.achievements = [];
            state.particles = [];
            state.goldenCookies = [];
            
          // 🪙 COINS BLEIBEN - WICHTIG!
          // state.coins bleibt erhalten
        }
      });
      
      // ✅ ACHIEVEMENT CHECK - NACH DEM STATE UPDATE!
      get().checkAchievements();
    },

      // ⚙️ EINSTELLUNGEN - EINFACH!
      toggleSound: () => {
        set((state) => {
          state.soundEnabled = !state.soundEnabled;
        });
      },

      toggleAnimations: () => {
        set((state) => {
          state.animationsEnabled = !state.animationsEnabled;
        });
      },

      togglePerformanceMode: () => {
        set((state) => {
          state.performanceMode = !state.performanceMode;
        });
      },

      // 🧹 PARTICLE CLEANUP
      // 🧹 PARTICLE CLEANUP - DEBOUNCED für Performance (alle 2s)
      cleanupParticles: () => {
        set((state) => {
          const now = Date.now();
          state.particles = state.particles.filter(
            p => now - p.timestamp < 4000
          );
        });
      },

      // 🪙 COIN ACTIONS - NEU!
      earnCoins: (amount: number) => {
        set((state) => {
          state.coins += amount * state.coinMultiplier;
        });
      },

      spendCoins: (amount: number) => {
        const state = get();
        if (state.coins >= amount) {
          set((state) => {
            state.coins -= amount;
          });
          return true;
        }
        return false;
      },

      buyCoinShopDiscount: (productId: string, discountPercent: number, cost: number) => {
        set((state) => {
          if (state.coins >= cost) {
            state.coins -= cost;
            state.coinShopDiscounts[productId] = discountPercent;
          }
        });
      },

      // 🎮 GAMING DISCOUNT ACTIONS - NEU! NUR VON AKTUELLEN COOKIES!
      spendCookiesForDiscount: (amount: number) => {
        set((state) => {
          // ✅ Ziehe NUR von aktuellen Cookies ab (nicht von totalCookies)
          // Man muss die Cookies wirklich haben um einen Rabatt zu kaufen!
          if (state.cookies >= amount) {
            state.cookies -= amount;
          }
        });
      },

      // 🏆 ACHIEVEMENT ACTIONS - NEU!
      unlockAchievement: (achievementId: string) => {
        set((state) => {
          if (!state.unlockedAchievements.includes(achievementId)) {
            const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
            if (achievement) {
              state.unlockedAchievements.push(achievementId);
              state.coins += achievement.reward;
              
              // 🎉 ACHIEVEMENT NOTIFICATION!
              state.achievementNotifications.push({
                id: Math.random().toString(36).substring(2, 11),
                achievementId,
                timestamp: Date.now(),
                rarity: achievement.rarity
              });
            }
          }
        });
      },

      checkAchievements: () => {
        const state = get();
        const achievementsToUnlock: string[] = [];
        
        ACHIEVEMENTS.forEach(achievement => {
          // Skip if already unlocked
          if (state.unlockedAchievements.includes(achievement.id)) return;
          
          let shouldUnlock = false;
          
          // 🎯 INTELLIGENTES ACHIEVEMENT-CHECKING
          // Cookies-based achievements
          if (achievement.id.includes('cookies') && achievement.id !== 'first_click') {
            shouldUnlock = state.totalCookies >= achievement.requirement;
          }
          // Clicks-based achievements
          else if (achievement.id === 'first_click') {
            shouldUnlock = state.clicks >= achievement.requirement;
          }
          // Building achievements
          else if (achievement.id.includes('building')) {
            const totalBuildings = Object.values(state.buildings).reduce((sum, count) => sum + count, 0);
            shouldUnlock = totalBuildings >= achievement.requirement;
          }
          // Combo achievements
          else if (achievement.id.includes('combo')) {
            shouldUnlock = state.maxStreak >= achievement.requirement;
          }
          // Level achievements
          else if (achievement.id.includes('level')) {
            shouldUnlock = state.level >= achievement.requirement;
          }
          // Prestige achievements
          else if (achievement.id.includes('prestige')) {
            shouldUnlock = state.prestigeLevel >= achievement.requirement;
          }
          
          if (shouldUnlock) {
            achievementsToUnlock.push(achievement.id);
          }
        });
        
        // Unlock all achievements that should be unlocked
        achievementsToUnlock.forEach(achievementId => {
          get().unlockAchievement(achievementId);
        });
      },

      clearAchievementNotifications: () => {
        set((state) => {
          state.achievementNotifications = [];
        });
      },

      // 🏅 LEADERBOARD ACTIONS - NEU!
      updatePlayerName: (name: string) => {
        set((state) => {
          state.playerName = name;
        });
      },

      updatePlayerRank: () => {
        set((state) => {
          // Simple ranking based on total cookies
          const allPlayers = [...FAKE_LEADERBOARD_PLAYERS, {
            id: 'current_player',
            name: state.playerName,
            cookies: state.totalCookies,
            level: state.level,
            prestige: state.prestigeLevel,
            rank: 0,
            avatar: '🍪',
            isReal: true
          }];
          
          allPlayers.sort((a, b) => b.cookies - a.cookies);
          const playerIndex = allPlayers.findIndex(p => p.id === 'current_player');
          state.playerRank = playerIndex + 1;
        });
      },

      // 🍪 SYNC STATS TO SERVER - Leaderboard Integration (Optimiert mit Batching & Optimistic Updates)
      syncStatsToServer: async () => {
        const state = get();
        const user = useAuthStore.getState().user;
        
        if (!user?.id) {
          return; // User not authenticated
        }

        try {
          // 🚀 Optimistic Update - UI sofort aktualisieren, Server-Sync im Hintergrund
          const { optimizedCookieClickerApi } = await import('../api/optimizedCookieClickerApi');
          
          // Avatar will be fetched from profile by backend
          await optimizedCookieClickerApi.saveStatsOptimistic({
            totalCookies: state.totalCookies,
            cookiesPerSecond: state.cookiesPerSecond,
            timePlayed: state.timePlayed,
            avatarUrl: null // Backend will fetch from profile
          });
        } catch (error) {
          // Silently fail - don't interrupt gameplay
          if (import.meta.env.DEV) {
            console.error('Failed to sync stats to server:', error);
          }
        }
      },

      // 🎮 ACTIVE SYSTEM ACTIONS - NEU!
      pauseSession: () => {
        set((state) => {
          state.isActiveSession = false;
          state.lastPauseTime = Date.now();
        });
      },

      resumeSession: () => {
        set((state) => {
          state.isActiveSession = true;
          state.sessionStartTime = Date.now();
        });
      },

      updateActiveStatus: (isActive: boolean) => {
        set((state) => {
          if (isActive && !state.isActiveSession) {
            // Resume
            state.isActiveSession = true;
            state.sessionStartTime = Date.now();
          } else if (!isActive && state.isActiveSession) {
            // Pause
            state.isActiveSession = false;
            state.lastPauseTime = Date.now();
          }
        });
      },

      // 🌟 VIP STATUS CHECK - Prüft echten VIP-Status aus Auth
      checkVipStatus: () => {
        const user = useAuthStore.getState().user;
        const isVip = user?.rank === 'VIP';
        const vipTier = useVipStore.getState().currentTier;
        
        // 🎯 WICHTIG: Nur wenn User wirklich VIP ist, können sie passive Einnahmen nutzen
        if (!isVip) {
          set({
            hasVipPassiveIncome: false,
            offlineCpsMultiplier: 0,
            vipTier: null
          });
          return;
        }
        
        // VIP Passive Income ab Nova-Tier (nur für echte VIPs)
        const hasPassive = ['Nova', 'Supernova', 'Galaxy'].includes(vipTier);
        
        // Multiplier & Max Hours basierend auf Tier
        const multiplierMap: Record<string, number> = {
          'Nova': 0.3,       // 30% CPS offline, 4h max
          'Supernova': 0.5,  // 50% CPS offline, 8h max
          'Galaxy': 0.75     // 75% CPS offline, 12h max
        };
        const multiplier = multiplierMap[vipTier || ''] || 0;
        
        set({
          hasVipPassiveIncome: hasPassive,
          offlineCpsMultiplier: multiplier,
          vipTier: vipTier
        });
      },

      // 🍪 OFFLINE PROGRESS BERECHNUNG (VIP Only)
      calculateOfflineProgress: (secondsOffline: number) => {
        const state = get();
        
        // 🎯 Doppelte Prüfung: VIP-Status im Store UND echten VIP-Status prüfen
        const user = useAuthStore.getState().user;
        const isVip = user?.rank === 'VIP';
        
        // Nicht-VIP: Keine offline cookies
        if (!isVip || !state.hasVipPassiveIncome) {
          return 0;
        }
        
        // Max Offline Time per Tier
        const maxOfflineHours = {
          'Nova': 4,
          'Supernova': 8,
          'Galaxy': 12
        }[state.vipTier || ''] || 0;
        
        const maxOfflineSeconds = maxOfflineHours * 60 * 60;
        const cappedTime = Math.min(secondsOffline, maxOfflineSeconds);
        
        // Berechne Offline Cookies mit reduzierter Rate
        return Math.floor(state.cookiesPerSecond * cappedTime * state.offlineCpsMultiplier);
      }
    })),
    {
      name: 'nebula-cookie-clicker',
      version: 7, // Bumped for Boss System Removal
      // 🚀 Performance: Nur wichtige Daten persistieren (Particles nicht)
      partialize: (state) => ({
        cookies: state.cookies,
        totalCookies: state.totalCookies,
        cookiesPerClick: state.cookiesPerClick,
        cookiesPerSecond: state.cookiesPerSecond,
        level: state.level,
        xp: state.xp,
        xpToNextLevel: state.xpToNextLevel,
        streak: state.streak,
        maxStreak: state.maxStreak,
        clicks: state.clicks,
        timePlayed: state.timePlayed,
        lastSaveTime: state.lastSaveTime,
        prestigeLevel: state.prestigeLevel,
        prestigePoints: state.prestigePoints,
        upgrades: state.upgrades,
        buildings: state.buildings,
        achievements: state.achievements,
        coins: state.coins,
        coinMultiplier: state.coinMultiplier,
        coinShopDiscounts: state.coinShopDiscounts,
        unlockedAchievements: state.unlockedAchievements,
        playerName: state.playerName,
        playerRank: state.playerRank,
        isActiveSession: state.isActiveSession,
        sessionStartTime: state.sessionStartTime,
        totalActiveTime: state.totalActiveTime,
        lastPauseTime: state.lastPauseTime,
        hasVipPassiveIncome: state.hasVipPassiveIncome,
        offlineCpsMultiplier: state.offlineCpsMultiplier,
        vipTier: state.vipTier,
        soundEnabled: state.soundEnabled,
        animationsEnabled: state.animationsEnabled,
        performanceMode: state.performanceMode
        // Particles & Golden Cookies nicht persistieren (temporäre Daten)
      })
    }
  )
);