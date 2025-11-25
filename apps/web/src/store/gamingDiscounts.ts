import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useCookieClickerStore } from './cookieClicker';
import { trackEvent } from '../utils/analytics';

// 🎮 GAMING DISCOUNT TYPES
export interface GamingDiscount {
  id: string;
  tier: '5%' | '10%' | '15%' | '20%';
  discountPercent: number;
  coinsCost: number;
  claimedAt: number;
  usedAt?: number;
  orderValue?: number;
  savings?: number;
}

export interface DiscountTierConfig {
  tier: '5%' | '10%' | '15%' | '20%';
  discountPercent: number;
  baseCost: number;
  difficultyMultiplier: number;
  icon: string;
  color: string;
  description: string;
}

export interface ProgressToNextDiscount {
  tier: '5%' | '10%' | '15%' | '20%';
  currentCoins: number;
  requiredCoins: number;
  percentage: number;
  missing: number;
  canClaim: boolean;
}

export interface GamingDiscountState {
  // 💎 Verfügbare Rabatte (eingelöst aber noch nicht verwendet)
  availableDiscounts: GamingDiscount[];
  
  // 📊 Redemption History (wie oft wurde jeder Tier eingelöst)
  redemptionHistory: Record<string, number>;
  
  // 📜 Verwendete Rabatte (für Statistiken)
  usedDiscounts: GamingDiscount[];
  
  // 🎯 Aktuell aktiver Rabatt im Checkout
  activeDiscountId: string | null;
  
  // Actions
  claimDiscount: (tier: '5%' | '10%' | '15%' | '20%') => boolean;
  useDiscount: (discountId: string, orderValue: number) => void;
  setActiveDiscount: (discountId: string | null) => void;
  getProgressToNextDiscount: (tier: '5%' | '10%' | '15%' | '20%') => ProgressToNextDiscount;
  getRequiredCoins: (tier: '5%' | '10%' | '15%' | '20%') => number;
  getAvailableDiscount: (tier: '5%' | '10%' | '15%' | '20%') => GamingDiscount | null;
  hasAvailableDiscounts: () => boolean;
  getTotalSavings: () => number;
  reset: () => void;
}

// 🎯 DISCOUNT TIER CONFIGURATIONS (Coins-basiert, 10x Reduktion für balancierte Kosten)
export const DISCOUNT_TIERS: DiscountTierConfig[] = [
  {
    tier: '5%',
    discountPercent: 5,
    baseCost: 3500,  // 10x Reduktion von 35k Cookies
    difficultyMultiplier: 0.5,
    icon: '🎮',
    color: 'from-blue-500 to-cyan-500',
    description: 'Starter Rabatt - Perfekt für den Einstieg!'
  },
  {
    tier: '10%',
    discountPercent: 10,
    baseCost: 17500,  // 10x Reduktion von 175k Cookies
    difficultyMultiplier: 0.6,
    icon: '🎯',
    color: 'from-purple-500 to-pink-500',
    description: 'Fortgeschrittener Rabatt - Lohnt sich!'
  },
  {
    tier: '15%',
    discountPercent: 15,
    baseCost: 70000,  // 10x Reduktion von 700k Cookies
    difficultyMultiplier: 0.7,
    icon: '💎',
    color: 'from-orange-500 to-red-500',
    description: 'Premium Rabatt - Für echte Grinder!'
  },
  {
    tier: '20%',
    discountPercent: 20,
    baseCost: 350000,  // 10x Reduktion von 3.5M Cookies
    difficultyMultiplier: 0.8,
    icon: '👑',
    color: 'from-yellow-500 to-amber-500',
    description: 'Legendary Rabatt - Die ultimative Belohnung!'
  }
];

// 🎮 GAMING DISCOUNT STORE
export const useGamingDiscountStore = create<GamingDiscountState>()(
  persist(
    immer((set, get) => ({
      availableDiscounts: [],
      redemptionHistory: {},
      usedDiscounts: [],
      activeDiscountId: null,

      // 🎯 RABATT EINLÖSEN (Claim) - MIT COINS!
      claimDiscount: (tier) => {
        const state = get();
        const cookieStore = useCookieClickerStore.getState();
        const currentCoins = cookieStore.coins;
        
        // Validiere Tier
        const tierConfig = DISCOUNT_TIERS.find(t => t.tier === tier);
        if (!tierConfig) {
          console.warn(`Invalid tier: ${tier}`);
          return false;
        }

        // Berechne erforderliche Coins basierend auf Redemption History
        const requiredCoins = state.getRequiredCoins(tier);
        
        // Validierung: Genug Coins vorhanden?
        if (currentCoins < requiredCoins) {
          console.debug(`Insufficient coins. Required: ${requiredCoins}, Available: ${currentCoins}`);
          return false;
        }

        // Validierung: Bereits ein Rabatt dieser Stufe verfügbar?
        const existingDiscount = state.availableDiscounts.find(d => d.tier === tier);
        if (existingDiscount) {
          console.debug(`Discount tier ${tier} already available`);
          return false;
        }

        // Erstelle neuen Rabatt mit eindeutiger ID
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).slice(2, 9);
        const newDiscount: GamingDiscount = {
          id: `gaming-discount-${timestamp}-${randomSuffix}`,
          tier,
          discountPercent: tierConfig.discountPercent,
          coinsCost: requiredCoins,
          claimedAt: timestamp
        };

        // Ziehe Coins ab (vor dem State-Update für bessere Fehlerbehandlung)
        const spendSuccess = cookieStore.spendCoins(requiredCoins);
        if (!spendSuccess) {
          console.error('Failed to spend coins - transaction aborted');
          return false;
        }

        // Update State nach erfolgreichem Coin-Abzug
        set((state) => {
          state.availableDiscounts.push(newDiscount);
          state.redemptionHistory[tier] = (state.redemptionHistory[tier] || 0) + 1;
        });

        // Analytics Tracking
        const redemptionCount = (state.redemptionHistory[tier] || 0) + 1;
        trackEvent('gaming_discount_claimed', {
          tier,
          coins_spent: requiredCoins,
          redemption_count: redemptionCount
        });

        console.log(`✅ Claimed ${tier} discount for ${requiredCoins} coins!`);
        return true;
      },

      // 🛒 RABATT VERWENDEN (Im Checkout)
      useDiscount: (discountId, orderValue) => {
        // Validierung: Order Value muss positiv sein
        if (!orderValue || orderValue <= 0) {
          console.warn(`Invalid order value: ${orderValue}`);
          return;
        }

        let usedDiscount: GamingDiscount | null = null;

        set((state) => {
          const discount = state.availableDiscounts.find(d => d.id === discountId);
          if (!discount) {
            console.warn(`Discount not found: ${discountId}`);
            return;
          }

          // Berechne Ersparnisse (abgerundet)
          const savings = Math.floor(orderValue * (discount.discountPercent / 100));

          // Update Discount mit Timestamp
          const usedAt = Date.now();
          discount.usedAt = usedAt;
          discount.orderValue = orderValue;
          discount.savings = savings;

          // Speichere für Analytics
          usedDiscount = { ...discount };

          // Verschiebe zu used (optimiert: filter statt find + filter)
          state.usedDiscounts.push(discount);
          state.availableDiscounts = state.availableDiscounts.filter(d => d.id !== discountId);
          
          // Clear active discount if it was this one
          if (state.activeDiscountId === discountId) {
            state.activeDiscountId = null;
          }
        });

        // Analytics Tracking (nur wenn Discount gefunden wurde)
        if (usedDiscount) {
          trackEvent('gaming_discount_redeemed', {
            tier: usedDiscount.tier,
            order_value: orderValue,
            savings: usedDiscount.savings || 0
          });
        }
      },

      // 🎯 Setze aktiven Rabatt für Checkout
      setActiveDiscount: (discountId) => {
        set({ activeDiscountId: discountId });
      },

      // 📊 Berechne Fortschritt zum nächsten Rabatt - MIT AKTUELLEN COINS!
      getProgressToNextDiscount: (tier) => {
        const state = get();
        const cookieStore = useCookieClickerStore.getState();
        const currentCoins = Math.max(0, cookieStore.coins || 0);
        const requiredCoins = state.getRequiredCoins(tier);
        
        // Schutz vor Division durch Null
        const safeRequiredCoins = Math.max(1, requiredCoins);
        const percentage = Math.min(100, Math.max(0, (currentCoins / safeRequiredCoins) * 100));
        const missing = Math.max(0, safeRequiredCoins - currentCoins);
        
        // Prüfe ob bereits ein Rabatt dieses Tiers verfügbar ist
        const hasAvailableTier = state.availableDiscounts.some(d => d.tier === tier);
        const canClaim = currentCoins >= safeRequiredCoins && !hasAvailableTier;

        return {
          tier,
          currentCoins,
          requiredCoins: safeRequiredCoins,
          percentage: Math.round(percentage * 100) / 100, // Runde auf 2 Dezimalstellen
          missing,
          canClaim
        };
      },

      // 💰 Berechne erforderliche Coins mit progressiver Schwierigkeit
      getRequiredCoins: (tier) => {
        const state = get();
        const tierConfig = DISCOUNT_TIERS.find(t => t.tier === tier);
        if (!tierConfig) {
          console.warn(`Tier config not found for: ${tier}`);
          return 0;
        }

        const redemptions = Math.max(0, state.redemptionHistory[tier] || 0);
        const baseCost = Math.max(0, tierConfig.baseCost);
        const multiplier = Math.max(0, tierConfig.difficultyMultiplier);

        // Formel: baseCost × (1 + redemptions × multiplier)
        // Schutz vor negativen Werten und Overflow
        const calculatedCost = baseCost * (1 + redemptions * multiplier);
        return Math.max(0, Math.floor(calculatedCost));
      },

      // 🔍 Finde verfügbaren Rabatt eines Tiers
      getAvailableDiscount: (tier) => {
        const state = get();
        return state.availableDiscounts.find(d => d.tier === tier) || null;
      },

      // ✨ Check ob verfügbare Rabatte vorhanden
      hasAvailableDiscounts: () => {
        return get().availableDiscounts.length > 0;
      },

      // 💸 Berechne Gesamt-Ersparnisse (optimiert mit reduce)
      getTotalSavings: () => {
        const state = get();
        return state.usedDiscounts.reduce((sum, discount) => {
          return sum + (discount.savings || 0);
        }, 0);
      },

      // 🔄 Reset (für Testing)
      reset: () => {
        set({
          availableDiscounts: [],
          redemptionHistory: {},
          usedDiscounts: [],
          activeDiscountId: null
        });
      }
    })),
    {
      name: 'gaming-discounts-storage',
      version: 1
    }
  )
);

// 🎯 HELPER FUNCTIONS

/**
 * Normalisiert einen numerischen Wert zu einer sicheren, gültigen Zahl
 * @param value - Der zu normalisierende Wert
 * @returns Eine gültige, nicht-negative Ganzzahl
 */
const normalizeNumber = (value?: number | null): number => {
  if (value == null) return 0;
  const numValue = Number(value);
  if (typeof numValue !== 'number' || Number.isNaN(numValue) || !isFinite(numValue)) {
    return 0;
  }
  return Math.max(0, Math.floor(numValue));
};

/**
 * Formatiert eine Zahl mit Locale-String (de-DE) mit Fallback
 * @param value - Die zu formatierende Zahl
 * @returns Formatierter String
 */
const formatWithLocale = (value: number): string => {
  try {
    return value.toLocaleString('de-DE');
  } catch {
    return value.toString();
  }
};

/**
 * Formatiert eine Zahl in kompakter Darstellung (K/M)
 * @param value - Die zu formatierende Zahl
 * @returns Formatierter String (z.B. "1.5K", "2.3M")
 */
const formatCompact = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return formatWithLocale(value);
};

/**
 * Formatiert Cookie-Werte für die Anzeige
 * @param cookies - Anzahl der Cookies (kann null/undefined sein)
 * @returns Formatierter String
 */
export const formatCookies = (cookies?: number | null): string => {
  return formatCompact(normalizeNumber(cookies));
};

/**
 * Formatiert Coin-Werte für die Anzeige
 * @param coins - Anzahl der Coins (kann null/undefined sein)
 * @returns Formatierter String
 */
export const formatCoins = (coins?: number | null): string => {
  return formatCompact(normalizeNumber(coins));
};

/**
 * Findet den nächsten erreichbaren Discount-Tier
 * @returns Der nächste verfügbare Tier oder null wenn keiner gefunden wird
 */
export const getNextAvailableTier = (): DiscountTierConfig | null => {
  const state = useGamingDiscountStore.getState();
  const cookieStore = useCookieClickerStore.getState();
  const currentCoins = Math.max(0, cookieStore.coins || 0);

  // Erstelle Set für schnelleren Lookup (O(1) statt O(n))
  const availableTiers = new Set(state.availableDiscounts.map(d => d.tier));

  // Finde den nächsten Tier der:
  // 1. Noch nicht verfügbar ist
  // 2. Mindestens 50% des Weges erreicht ist
  const progressThreshold = 0.5; // 50% Fortschritt
  
  for (const tier of DISCOUNT_TIERS) {
    if (!availableTiers.has(tier.tier)) {
      const required = state.getRequiredCoins(tier.tier);
      const progress = required > 0 ? currentCoins / required : 0;
      
      if (progress >= progressThreshold) {
        return tier;
      }
    }
  }

  // Fallback: Erster Tier wenn keiner erreichbar ist
  return DISCOUNT_TIERS[0] || null;
};



