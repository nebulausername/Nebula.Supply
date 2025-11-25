// 🍪 Core Cookie Clicker Types

export interface Building {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  baseProduction: number; // Cookies per second
  count: number;
  costMultiplier: number;
  unlockRequirement: number; // Required total cookies baked
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  type: 'cpc' | 'cps' | 'building' | 'special';
  multiplier?: number;
  buildingId?: string; // For building-specific upgrades
  purchased: boolean;
  unlockRequirement: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'speed' | 'building' | 'special';
  requirement: number;
  unlocked: boolean;
  hidden?: boolean; // Secret achievements
}

export interface TouchEffect {
  id: string;
  x: number;
  y: number;
  value: number;
  timestamp: number;
  velocity: { x: number; y: number };
}

export interface GameStats {
  totalCookiesBaked: number;
  totalClicks: number;
  sessionDuration: number;
  clicksPerSecond: number;
  maxCookiesPerSecond: number;
  buildingsPurchased: number;
  upgradesPurchased: number;
  achievementsUnlocked: number;
  goldenCookiesClicked: number;
  prestigeLevel: number;
}

export interface CookieState {
  // Core values
  cookies: number;
  cookiesPerSecond: number;
  cookiesPerClick: number;
  totalCookiesBaked: number;
  prestigePoints: number;
  prestigeMultiplier: number;
  
  // Game content
  buildings: Building[];
  upgrades: Upgrade[];
  achievements: Achievement[];
  
  // UI state
  touchEffects: TouchEffect[];
  
  // Settings
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    vibrationEnabled: boolean;
    hapticFeedback: boolean;
    particlesEnabled: boolean;
    performanceMode: 'high' | 'medium' | 'low';
    theme: 'light' | 'dark' | 'auto';
  };
  
  // Statistics
  stats: GameStats;
  
  // Actions
  addCookie: (amount: number, fromClick?: boolean) => void;
  purchaseBuilding: (buildingId: string) => boolean;
  purchaseUpgrade: (upgradeId: string) => boolean;
  unlockAchievement: (achievementId: string) => void;
  addTouchEffect: (x: number, y: number, value: number) => void;
  removeTouchEffect: (id: string) => void;
  updateSettings: (settings: Partial<CookieState['settings']>) => void;
  calculateCPS: () => number;
  prestige: () => void;
  reset: () => void;
  loadGame: () => void;
  saveGame: () => void;
}

export interface GoldenCookie {
  id: string;
  x: number;
  y: number;
  type: 'multiply' | 'frenzy' | 'bonus' | 'storm';
  value: number;
  duration: number;
  spawnedAt: number;
}

export interface PowerUp {
  type: 'frenzy' | 'multiply' | 'storm';
  multiplier: number;
  endsAt: number;
}

export type PerformanceMode = 'high' | 'medium' | 'low';

export interface PerformanceConfig {
  particles: boolean;
  particleCount: number;
  animations: 'full' | 'reduced' | 'minimal';
  shadows: boolean;
  blurEffects: boolean;
}
