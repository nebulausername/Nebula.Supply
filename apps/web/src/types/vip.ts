export type VipTier = 'Comet' | 'Nova' | 'Supernova' | 'Galaxy';

export interface TierRequirement {
  invitesNeeded: number;
  purchasesNeeded: number;
  communityPoints: number;
  minSpend?: number;
}

export interface VipBenefit {
  id: string;
  category: 'shopping' | 'support' | 'community' | 'rewards';
  title: string;
  description: string;
  icon: string;
  available: number;
  used: number;
  maxPerMonth?: number;
  tier: VipTier;
}

export interface VipAnalytics {
  totalDrops: number;
  totalSpent: number;
  vipScoreHistory: Array<{ date: string; score: number }>;
  tierProgression: Array<{ date: string; tier: VipTier }>;
  communityActivity: {
    challengesCompleted: number;
    forumPosts: number;
    helpTickets: number;
    referralCount: number;
  };
  comparison: {
    percentileRank: number;
    dropsAboveAverage: number;
    scoreAboveAverage: number;
  };
}

export interface VipCommunityData {
  featuredMembers: Array<{
    id: string;
    handle: string;
    tier: VipTier;
    avatar?: string;
    achievement: string;
  }>;
  activeChallenges: Array<{
    id: string;
    title: string;
    description: string;
    reward: string;
    participants: number;
    endsAt: string;
  }>;
  recentAchievements: Array<{
    id: string;
    member: string;
    achievement: string;
    earnedAt: string;
  }>;
}

export interface VipState {
  currentTier: VipTier;
  vipScore: number;
  tierProgress: {
    current: number;
    next: number;
    requirements: TierRequirement[];
  };
  benefits: VipBenefit[];
  analytics: VipAnalytics;
  community: VipCommunityData;
  isLoading: boolean;
  lastUpdated: string;

  // Actions
  updateVipScore: (newScore: number) => void;
  useBenefit: (benefitId: string) => void;
  refreshData: () => Promise<void>;
}




