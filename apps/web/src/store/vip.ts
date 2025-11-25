import { create } from "zustand";
import type { VipState, VipTier, TierRequirement, VipBenefit, VipAnalytics, VipCommunityData } from "../types/vip";

// Mock data for development - in production this would come from API
const mockTierRequirements: Record<VipTier, TierRequirement[]> = {
  Comet: [
    { invitesNeeded: 3, purchasesNeeded: 1, communityPoints: 50 },
    { invitesNeeded: 5, purchasesNeeded: 2, communityPoints: 100, minSpend: 50 }
  ],
  Nova: [
    { invitesNeeded: 8, purchasesNeeded: 3, communityPoints: 200, minSpend: 100 },
    { invitesNeeded: 12, purchasesNeeded: 5, communityPoints: 350, minSpend: 150 }
  ],
  Supernova: [
    { invitesNeeded: 15, purchasesNeeded: 8, communityPoints: 500, minSpend: 250 },
    { invitesNeeded: 20, purchasesNeeded: 12, communityPoints: 750, minSpend: 400 }
  ],
  Galaxy: [] // Highest tier - no progression
};

const mockBenefits: VipBenefit[] = [
  {
    id: "priority-access",
    category: "shopping",
    title: "Priority Access",
    description: "Erhalte frühzeitigen Zugang zu limitierten Drops",
    icon: "⚡",
    available: 5,
    used: 2,
    maxPerMonth: 10,
    tier: "Nova"
  },
  {
    id: "dedicated-support",
    category: "support",
    title: "Dedicated VIP Support",
    description: "Persönlicher Support-Kanal mit garantierten Antwortzeiten",
    icon: "🎯",
    available: 1,
    used: 0,
    tier: "Nova"
  },
  {
    id: "exclusive-discount",
    category: "shopping",
    title: "VIP Discount",
    description: "Automatische 15% Rabatt auf alle VIP-Drops",
    icon: "💎",
    available: 1,
    used: 0,
    tier: "Supernova"
  },
  {
    id: "beta-access",
    category: "community",
    title: "Beta Product Access",
    description: "Frühzeitiger Zugang zu neuen Produkten und Features",
    icon: "🚀",
    available: 3,
    used: 1,
    maxPerMonth: 5,
    tier: "Galaxy"
  }
];

const mockAnalytics: VipAnalytics = {
  totalDrops: 12,
  totalSpent: 485.50,
  vipScoreHistory: [
    { date: "2024-01-01", score: 1200 },
    { date: "2024-01-15", score: 1450 },
    { date: "2024-02-01", score: 1680 },
    { date: "2024-02-15", score: 1950 },
    { date: "2024-03-01", score: 2340 }
  ],
  tierProgression: [
    { date: "2023-12-01", tier: "Comet" },
    { date: "2024-01-15", tier: "Nova" },
    { date: "2024-02-20", tier: "Supernova" }
  ],
  communityActivity: {
    challengesCompleted: 8,
    forumPosts: 23,
    helpTickets: 3,
    referralCount: 12
  },
  comparison: {
    percentileRank: 78,
    dropsAboveAverage: 3,
    scoreAboveAverage: 340
  }
};

const mockCommunity: VipCommunityData = {
  featuredMembers: [
    { id: "1", handle: "NebulaPioneer", tier: "Galaxy", achievement: "Erster Galaxy-Tier Member" },
    { id: "2", handle: "DropMaster", tier: "Supernova", achievement: "100+ Drops gesammelt" },
    { id: "3", handle: "CommunityHelper", tier: "Nova", achievement: "Top Community Contributor" }
  ],
  activeChallenges: [
    {
      id: "vip-referral-challenge",
      title: "VIP Referral Sprint",
      description: "Lade 3 neue Member ein und erhalte exklusive VIP-Benefits",
      reward: "Priority Access +500 VIP Points",
      participants: 47,
      endsAt: "2024-03-31"
    },
    {
      id: "drops-collector",
      title: "Drop Collector",
      description: "Sammle 5 verschiedene VIP-Drops diesen Monat",
      reward: "Exklusives Badge + VIP Discount",
      participants: 23,
      endsAt: "2024-03-15"
    }
  ],
  recentAchievements: [
    { id: "1", member: "NebulaPioneer", achievement: "Galaxy Tier erreicht", earnedAt: "2024-03-01" },
    { id: "2", member: "DropMaster", achievement: "100 Drops Milestone", earnedAt: "2024-02-28" },
    { id: "3", member: "CommunityHelper", achievement: "Top Contributor", earnedAt: "2024-02-25" }
  ]
};

export const useVipStore = create<VipState>((set, get) => ({
  currentTier: "Nova",
  vipScore: 2340,
  tierProgress: {
    current: 2340,
    next: 3000,
    requirements: mockTierRequirements.Nova
  },
  benefits: mockBenefits,
  analytics: mockAnalytics,
  community: mockCommunity,
  isLoading: false,
  lastUpdated: new Date().toISOString(),

  // Actions
  updateVipScore: (newScore: number) => {
    const state = get();
    const scoreDiff = newScore - state.vipScore;

    // Check for tier progression
    const tierOrder: VipTier[] = ['Comet', 'Nova', 'Supernova', 'Galaxy'];
    const currentTierIndex = tierOrder.indexOf(state.currentTier);
    let newTier = state.currentTier;

    if (scoreDiff > 0 && currentTierIndex < tierOrder.length - 1) {
      // Check if user qualifies for next tier
      const nextTier = tierOrder[currentTierIndex + 1];
      const nextTierRequirements = mockTierRequirements[nextTier];

      if (nextTierRequirements.length === 0 || newScore >= state.tierProgress.next) {
        newTier = nextTier;
      }
    }

    set({
      vipScore: newScore,
      currentTier: newTier,
      tierProgress: {
        current: newScore,
        next: newTier === 'Galaxy' ? newScore : newScore + 500, // Simplified progression
        requirements: mockTierRequirements[newTier] || []
      },
      analytics: {
        ...state.analytics,
        vipScoreHistory: [
          ...state.analytics.vipScoreHistory,
          { date: new Date().toISOString(), score: newScore }
        ]
      },
      lastUpdated: new Date().toISOString()
    });
  },

  useBenefit: (benefitId: string) => {
    set((state) => ({
      benefits: state.benefits.map(benefit =>
        benefit.id === benefitId
          ? { ...benefit, used: benefit.used + 1, available: benefit.available - 1 }
          : benefit
      ),
      lastUpdated: new Date().toISOString()
    }));
  },

  refreshData: async () => {
    set({ isLoading: true });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, fetch fresh data from API
    set({
      isLoading: false,
      lastUpdated: new Date().toISOString()
    });
  }
}));




