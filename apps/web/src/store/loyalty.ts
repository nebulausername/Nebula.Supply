import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface LoyaltyLevel {
  tier: LoyaltyTier;
  name: string;
  pointsRequired: number;
  benefits: string[];
  color: string;
  icon: string;
}

export interface LoyaltyTransaction {
  id: string;
  type: "earned" | "redeemed" | "expired";
  points: number;
  reason: string;
  timestamp: string;
  orderId?: string;
  description: string;
}

export interface LoyaltyState {
  // Current Status
  currentPoints: number;
  currentTier: LoyaltyTier;
  totalEarned: number;
  totalRedeemed: number;

  // Transactions
  transactions: LoyaltyTransaction[];

  // Actions
  addPoints: (points: number, reason: string, orderId?: string) => void;
  redeemPoints: (points: number, reason: string) => boolean;
  getTierInfo: () => LoyaltyLevel;
  getPointsToNextTier: () => number;
  getTierProgress: () => number;
  canRedeem: (points: number) => boolean;
}

const loyaltyTiers: Record<LoyaltyTier, LoyaltyLevel> = {
  bronze: {
    tier: "bronze",
    name: "Bronze Member",
    pointsRequired: 0,
    benefits: [
      "Grundlegende Mitgliedschaft",
      "Newsletter mit exklusiven Angeboten",
      "Frühzeitiger Zugang zu Sales"
    ],
    color: "from-amber-600 to-amber-800",
    icon: "🥉"
  },
  silver: {
    tier: "silver",
    name: "Silver Elite",
    pointsRequired: 1000,
    benefits: [
      "Alle Bronze Vorteile",
      "10% Rabatt auf alle Produkte",
      "Priority Support",
      "Exklusive Silver-Only Drops"
    ],
    color: "from-slate-400 to-slate-600",
    icon: "🥈"
  },
  gold: {
    tier: "gold",
    name: "Gold VIP",
    pointsRequired: 5000,
    benefits: [
      "Alle Silver Vorteile",
      "15% Rabatt auf alle Produkte",
      "VIP-Only Produkte",
      "Persönlicher Account Manager",
      "Frühzeitiger Zugang zu limitierten Drops"
    ],
    color: "from-yellow-400 to-yellow-600",
    icon: "🥇"
  },
  platinum: {
    tier: "platinum",
    name: "Platinum Legend",
    pointsRequired: 15000,
    benefits: [
      "Alle Gold Vorteile",
      "20% Rabatt auf alle Produkte",
      "Lifetime Warranty auf alle Käufe",
      "Exklusive Platinum Events",
      "Custom Product Requests"
    ],
    color: "from-purple-400 to-purple-600",
    icon: "💎"
  },
  diamond: {
    tier: "diamond",
    name: "Diamond Royalty",
    pointsRequired: 50000,
    benefits: [
      "Alle Platinum Vorteile",
      "25% Rabatt auf alle Produkte",
      "Persönliche Shopping Experience",
      "Unlimited Custom Products",
      "VIP Concierge Service"
    ],
    color: "from-cyan-400 to-cyan-600",
    icon: "💎"
  }
};

const calculateTier = (points: number): LoyaltyTier => {
  if (points >= 50000) return "diamond";
  if (points >= 15000) return "platinum";
  if (points >= 5000) return "gold";
  if (points >= 1000) return "silver";
  return "bronze";
};

const generateTransactionId = (): string => {
  return `loyalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export { loyaltyTiers };
export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      currentPoints: 0,
      currentTier: "bronze",
      totalEarned: 0,
      totalRedeemed: 0,
      transactions: [],

      addPoints: (points: number, reason: string, orderId?: string) => {
        const transaction: LoyaltyTransaction = {
          id: generateTransactionId(),
          type: "earned",
          points,
          reason,
          timestamp: new Date().toISOString(),
          orderId,
          description: `${points} Punkte für ${reason}`
        };

        set((state) => {
          const newPoints = state.currentPoints + points;
          const newTier = calculateTier(newPoints);

          return {
            currentPoints: newPoints,
            currentTier: newTier,
            totalEarned: state.totalEarned + points,
            transactions: [transaction, ...state.transactions].slice(0, 100) // Keep last 100
          };
        });

        console.log(`🏆 Loyalty: Added ${points} points for ${reason}`);
      },

      redeemPoints: (points: number, reason: string) => {
        const { currentPoints, currentTier } = get();

        // Enhanced validation
        if (!points || points <= 0) {
          console.error(`❌ Loyalty: Invalid points amount: ${points}`);
          return false;
        }

        if (!reason || reason.trim().length === 0) {
          console.error(`❌ Loyalty: Reason is required for redemption`);
          return false;
        }

        if (points > currentPoints) {
          console.warn(`❌ Loyalty: Cannot redeem ${points} points, only ${currentPoints} available`);
          return false;
        }

        // Check if redemption would drop below minimum tier points
        const newPoints = currentPoints - points;
        const newTier = calculateTier(newPoints);
        
        // Prevent tier downgrade (optional - can be removed if tier downgrades are allowed)
        if (newTier !== currentTier) {
          const currentTierPoints = loyaltyTiers[currentTier].pointsRequired;
          if (newPoints < currentTierPoints) {
            console.warn(`❌ Loyalty: Redemption would drop tier from ${currentTier} to ${newTier}`);
            // Allow redemption but warn user (or return false to prevent)
          }
        }

        try {
          const transaction: LoyaltyTransaction = {
            id: generateTransactionId(),
            type: "redeemed",
            points: -points,
            reason,
            timestamp: new Date().toISOString(),
            description: `${points} Punkte eingelöst für ${reason}`
          };

          set((state) => {
            const updatedPoints = state.currentPoints - points;
            const updatedTier = calculateTier(updatedPoints);
            
            return {
              currentPoints: updatedPoints,
              currentTier: updatedTier,
              totalRedeemed: state.totalRedeemed + points,
              transactions: [transaction, ...state.transactions].slice(0, 100)
            };
          });

          console.log(`🎁 Loyalty: Redeemed ${points} points for ${reason}. New balance: ${newPoints}`);
          return true;
        } catch (error) {
          console.error(`❌ Loyalty: Error redeeming points:`, error);
          return false;
        }
      },

      getTierInfo: () => {
        const { currentTier } = get();
        return loyaltyTiers[currentTier];
      },

      getPointsToNextTier: () => {
        const { currentPoints, currentTier } = get();

        switch (currentTier) {
          case "bronze": return Math.max(0, 1000 - currentPoints);
          case "silver": return Math.max(0, 5000 - currentPoints);
          case "gold": return Math.max(0, 15000 - currentPoints);
          case "platinum": return Math.max(0, 50000 - currentPoints);
          case "diamond": return 0; // Highest tier
          default: return 0;
        }
      },

      getTierProgress: () => {
        const { currentPoints, currentTier } = get();

        switch (currentTier) {
          case "bronze": return Math.min(100, (currentPoints / 1000) * 100);
          case "silver": return Math.min(100, ((currentPoints - 1000) / 4000) * 100);
          case "gold": return Math.min(100, ((currentPoints - 5000) / 10000) * 100);
          case "platinum": return Math.min(100, ((currentPoints - 15000) / 35000) * 100);
          case "diamond": return 100; // Highest tier
          default: return 0;
        }
      },

      canRedeem: (points: number) => {
        const { currentPoints } = get();
        return points <= currentPoints;
      }
    }),
    {
      name: 'nebula-loyalty',
      partialize: (state) => ({
        currentPoints: state.currentPoints,
        currentTier: state.currentTier,
        totalEarned: state.totalEarned,
        totalRedeemed: state.totalRedeemed,
        transactions: state.transactions
      })
    }
  )
);

// Helper functions for easy point management
export const awardLoyaltyPoints = (userId: string, points: number, reason: string, orderId?: string) => {
  const loyaltyStore = useLoyaltyStore.getState();
  loyaltyStore.addPoints(points, reason, orderId);

  // Broadcast to WebSocket if available
  if (typeof window !== 'undefined' && (window as any).ws) {
    (window as any).ws.send(JSON.stringify({
      type: 'loyalty_points_earned',
      userId,
      points,
      reason,
      orderId
    }));
  }
};

export const redeemLoyaltyPoints = (userId: string, points: number, reason: string) => {
  const loyaltyStore = useLoyaltyStore.getState();
  const success = loyaltyStore.redeemPoints(points, reason);

  if (success && typeof window !== 'undefined' && (window as any).ws) {
    (window as any).ws.send(JSON.stringify({
      type: 'loyalty_points_redeemed',
      userId,
      points,
      reason
    }));
  }

  return success;
};

export const getLoyaltyDiscount = (tier: LoyaltyTier, basePrice: number): number => {
  switch (tier) {
    case "silver": return basePrice * 0.10; // 10% discount
    case "gold": return basePrice * 0.15; // 15% discount
    case "platinum": return basePrice * 0.20; // 20% discount
    case "diamond": return basePrice * 0.25; // 25% discount
    default: return 0;
  }
};




