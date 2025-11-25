import type { InviteStatus } from "@nebula/shared";

export interface InviteRankTier {
  id: string;
  label: string;
  minReferrals: number;
  headline: string;
  perks: string[];
  color: string;
  rewards: {
    coinsPerInvite: number;
    bonusDrops: number;
    priority: string;
    specialPerks: string[];
  };
  requirements?: string[];
}

export interface InviteProgressSnapshot {
  current: InviteRankTier;
  next?: InviteRankTier;
  progress: number;
  invitesToNext: number;
  totalReferrals: number;
}

export const INVITE_RANK_TIERS: InviteRankTier[] = [
  {
    id: "seed",
    label: "🌱 Seed",
    minReferrals: 0,
    headline: "Starte deine Nebula Crew",
    color: "green",
    perks: ["Grundlegender Zugang", "Invite Link aktivieren", "Team-Übersicht"],
    rewards: {
      coinsPerInvite: 50,
      bonusDrops: 0,
      priority: "normal",
      specialPerks: ["Basic Dashboard", "Community Access"]
    }
  },
  {
    id: "comet",
    label: "☄️ Comet",
    minReferrals: 3,
    headline: "Du ziehst die ersten Orbits an",
    color: "blue",
    perks: ["Extra Loot Drops bei neuen Kampagnen", "Zugang zu Invite Streaks", "Priorisierter Support"],
    rewards: {
      coinsPerInvite: 75,
      bonusDrops: 1,
      priority: "high",
      specialPerks: ["Advanced Analytics", "Priority Queue", "Streak Bonuses"]
    }
  },
  {
    id: "orbit",
    label: "🛸 Orbit",
    minReferrals: 7,
    headline: "Dein Netzwerk dreht schneller",
    color: "purple",
    perks: ["Doppelte Rewards bei Spotlight Events", "Early Access zu neuen Kategorien", "VIP Community Zugang"],
    rewards: {
      coinsPerInvite: 100,
      bonusDrops: 2,
      priority: "very-high",
      specialPerks: ["Exclusive Drops", "Team Challenges", "VIP Events"]
    }
  },
  {
    id: "nova",
    label: "⭐ Nova",
    minReferrals: 15,
    headline: "Fast an der Supernova",
    color: "gold",
    perks: ["Exklusive Drops vor allen anderen", "Legendäre Bundles", "Team Meetups"],
    rewards: {
      coinsPerInvite: 150,
      bonusDrops: 3,
      priority: "maximum",
      specialPerks: ["Legendary Rewards", "Founder Perks", "Premium Support"]
    }
  },
  {
    id: "supernova",
    label: "💥 Supernova",
    minReferrals: 30,
    headline: "Maximum Nebula Power",
    color: "rainbow",
    perks: ["Maximale Rewards", "Founder Status", "Exklusive Events", "Lifetime VIP"],
    rewards: {
      coinsPerInvite: 200,
      bonusDrops: 5,
      priority: "legendary",
      specialPerks: ["Infinite Rewards", "God Mode", "Eternal Fame", "Nebula Council"]
    }
  }
];

const findTierForRank = (rank: string | undefined, totalReferrals: number) => {
  if (!rank) {
    return INVITE_RANK_TIERS.reduce((acc, tier) => (tier.minReferrals <= totalReferrals ? tier : acc), INVITE_RANK_TIERS[0]);
  }
  const normalized = rank.trim().toLowerCase();
  const byLabel = INVITE_RANK_TIERS.find(
    (tier) => tier.id === normalized || tier.label.toLowerCase() === normalized
  );
  if (byLabel) return byLabel;
  return INVITE_RANK_TIERS.reduce((acc, tier) => (tier.minReferrals <= totalReferrals ? tier : acc), INVITE_RANK_TIERS[0]);
};

export const resolveInviteProgress = (invite: InviteStatus | null): InviteProgressSnapshot => {
  const totalReferrals = invite?.totalReferrals ?? 0;
  const currentTier = findTierForRank(invite?.rank, totalReferrals);
  const tierIndex = INVITE_RANK_TIERS.findIndex((tier) => tier.id === currentTier.id);
  const nextTier = INVITE_RANK_TIERS[tierIndex + 1];

  if (!nextTier) {
    return {
      current: currentTier,
      next: undefined,
      progress: 1,
      invitesToNext: 0,
      totalReferrals
    };
  }

  const inviteWindow = nextTier.minReferrals - currentTier.minReferrals || 1;
  const invitesIntoTier = totalReferrals - currentTier.minReferrals;
  const progress = Math.min(1, Math.max(0, invitesIntoTier / inviteWindow));

  return {
    current: currentTier,
    next: nextTier,
    progress,
    invitesToNext: Math.max(0, nextTier.minReferrals - totalReferrals),
    totalReferrals
  };
};

// 🎯 ERWEITERTES ACHIEVEMENT SYSTEM
export interface InviteAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social' | 'growth' | 'quality' | 'special' | 'seasonal';
  requirements: {
    type: 'invites' | 'successful_invites' | 'streak' | 'team_size' | 'conversion_rate' | 'special';
    value: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'alltime';
  };
  rewards: {
    coins: number;
    badge: string;
    special?: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  hidden?: boolean;
}

export const INVITE_ACHIEVEMENTS: InviteAchievement[] = [
  // Social Achievements
  {
    id: "first_blood",
    name: "Erstes Blut",
    description: "Sende deinen ersten Invite",
    icon: "🎯",
    category: "social",
    requirements: { type: "invites", value: 1 },
    rewards: { coins: 100, badge: "Rookie" },
    rarity: "common"
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Sende 10 Invites in einer Woche",
    icon: "🦋",
    category: "social",
    requirements: { type: "invites", value: 10, timeframe: "weekly" },
    rewards: { coins: 500, badge: "Connector" },
    rarity: "rare"
  },
  {
    id: "network_king",
    name: "Network King",
    description: "Baue ein Team mit 50 Mitgliedern auf",
    icon: "👑",
    category: "social",
    requirements: { type: "team_size", value: 50 },
    rewards: { coins: 2000, badge: "Network King", special: "Exclusive Title" },
    rarity: "legendary"
  },

  // Growth Achievements
  {
    id: "rising_star",
    name: "Rising Star",
    description: "Erreiche 80% Conversion Rate",
    icon: "⭐",
    category: "growth",
    requirements: { type: "conversion_rate", value: 0.8 },
    rewards: { coins: 1000, badge: "Conversion Master" },
    rarity: "epic"
  },
  {
    id: "viral_master",
    name: "Viral Master",
    description: "Erziele 100 erfolgreiche Invites",
    icon: "🔥",
    category: "growth",
    requirements: { type: "successful_invites", value: 100 },
    rewards: { coins: 5000, badge: "Viral Legend", special: "Golden Badge" },
    rarity: "mythic"
  },

  // Quality Achievements
  {
    id: "quality_over_quantity",
    name: "Quality over Quantity",
    description: "Erreiche 95% Conversion Rate",
    icon: "💎",
    category: "quality",
    requirements: { type: "conversion_rate", value: 0.95 },
    rewards: { coins: 1500, badge: "Quality Expert" },
    rarity: "epic"
  },

  // Seasonal Achievements
  {
    id: "winter_champion",
    name: "Winter Champion",
    description: "Top 10 in der Winter Season",
    icon: "❄️",
    category: "seasonal",
    requirements: { type: "special", value: 1 },
    rewards: { coins: 3000, badge: "Winter Hero", special: "Seasonal Badge" },
    rarity: "legendary",
    hidden: true
  }
];

// 🎄 SAISONALE EVENTS
export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  theme: string;
  rewards: {
    multiplier: number;
    specialRewards: string[];
    leaderboardBonus: number;
  };
  challenges: {
    id: string;
    name: string;
    description: string;
    target: number;
    reward: number;
  }[];
  active: boolean;
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: "winter_festival",
    name: "❄️ Winter Festival",
    description: "Sammle Schneeflocken durch Invites und tausche sie gegen exklusive Belohnungen!",
    startDate: "2024-12-01",
    endDate: "2024-12-31",
    theme: "winter",
    rewards: {
      multiplier: 1.5,
      specialRewards: ["Snowflake Badge", "Winter Avatar", "Exclusive Drop"],
      leaderboardBonus: 1000
    },
    challenges: [
      { id: "snow_collector", name: "Snow Collector", description: "Sammle 50 Schneeflocken", target: 50, reward: 500 },
      { id: "winter_storm", name: "Winter Storm", description: "10 Invites in einem Tag", target: 10, reward: 1000 },
      { id: "frost_king", name: "Frost King", description: "Top 5 in der Season", target: 5, reward: 2500 }
    ],
    active: true
  }
];

// 👥 TEAM CHALLENGES
export interface TeamChallenge {
  id: string;
  name: string;
  description: string;
  type: 'collective' | 'competitive' | 'cooperative';
  target: {
    type: 'total_invites' | 'avg_conversion' | 'team_growth';
    value: number;
  };
  duration: number; // in Tagen
  rewards: {
    individual: number;
    team: number;
    bonus?: string;
  };
  participants: string[];
  progress: number;
  status: 'upcoming' | 'active' | 'completed';
}

export const TEAM_CHALLENGES: TeamChallenge[] = [
  {
    id: "mega_growth",
    name: "Mega Growth Challenge",
    description: "Wachst gemeinsam als Team um 200 neue Mitglieder",
    type: "collective",
    target: { type: "team_growth", value: 200 },
    duration: 14,
    rewards: {
      individual: 1000,
      team: 5000,
      bonus: "Team Trophy"
    },
    participants: [],
    progress: 45,
    status: "active"
  },
  {
    id: "conversion_wars",
    name: "Conversion Wars",
    description: "Wer erreicht die höchste Conversion Rate?",
    type: "competitive",
    target: { type: "avg_conversion", value: 0.9 },
    duration: 7,
    rewards: {
      individual: 2000,
      team: 1000,
      bonus: "Conversion Champion Badge"
    },
    participants: [],
    progress: 0,
    status: "upcoming"
  }
];

// 📊 ADVANCED ANALYTICS
export interface InviteAnalytics {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data: {
    totalInvites: number;
    successfulInvites: number;
    conversionRate: number;
    averageTimeToConvert: number;
    topPerformingDays: string[];
    growthTrend: 'up' | 'down' | 'stable';
    projectedNextMonth: number;
    rankComparison: {
      currentRank: number;
      previousRank: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  insights: string[];
  recommendations: string[];
}

// 🎯 DAILY QUESTS SYSTEM
export interface DailyQuest {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'invites' | 'social' | 'quality' | 'team' | 'special';
  requirements: {
    type: string;
    target: number;
    timeframe: 'daily' | 'session';
  };
  rewards: {
    coins: number;
    bonus?: string;
    streakBonus?: number;
  };
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  repeatable: boolean;
}

export const DAILY_QUESTS: DailyQuest[] = [
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Sende 5 Invites in einer Stunde",
    icon: "⚡",
    category: "invites",
    requirements: { type: "invites", target: 5, timeframe: "session" },
    rewards: { coins: 100, streakBonus: 25 },
    difficulty: "medium",
    repeatable: true
  },
  {
    id: "quality_hunter",
    name: "Quality Hunter",
    description: "Erreiche 90% Conversion Rate heute",
    icon: "🎯",
    category: "quality",
    requirements: { type: "conversion_rate", target: 0.9, timeframe: "daily" },
    rewards: { coins: 200, bonus: "Quality Badge" },
    difficulty: "hard",
    repeatable: false
  },
  {
    id: "team_player",
    name: "Team Player",
    description: "Hilf 3 Teammitgliedern beim Inviten",
    icon: "🤝",
    category: "team",
    requirements: { type: "team_assists", target: 3, timeframe: "daily" },
    rewards: { coins: 150, streakBonus: 50 },
    difficulty: "easy",
    repeatable: true
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Teile deinen Erfolg auf Social Media",
    icon: "🦋",
    category: "social",
    requirements: { type: "social_share", target: 1, timeframe: "daily" },
    rewards: { coins: 75, bonus: "Social Badge" },
    difficulty: "easy",
    repeatable: true
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "Halte eine 7-Tage Invite Streak",
    icon: "🔥",
    category: "special",
    requirements: { type: "streak", target: 7, timeframe: "daily" },
    rewards: { coins: 500, bonus: "Streak Master Badge", streakBonus: 100 },
    difficulty: "expert",
    repeatable: false
  }
];

// 🔥 ENHANCED STREAK SYSTEM
export interface StreakSystem {
  currentStreak: number;
  longestStreak: number;
  streakRewards: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  streakMultipliers: {
    [key: number]: number; // Tage -> Multiplier
  };
  streakAchievements: {
    [key: number]: string; // Tage -> Achievement Name
  };
}

export const STREAK_CONFIG: StreakSystem = {
  currentStreak: 0,
  longestStreak: 0,
  streakRewards: {
    daily: 25,
    weekly: 200,
    monthly: 1000
  },
  streakMultipliers: {
    3: 1.2,   // 3 Tage = 20% Bonus
    7: 1.5,   // 7 Tage = 50% Bonus
    14: 2.0,  // 14 Tage = 100% Bonus
    30: 3.0   // 30 Tage = 200% Bonus
  },
  streakAchievements: {
    3: "Getting Started",
    7: "On Fire",
    14: "Unstoppable",
    30: "Legend",
    100: "Centurion"
  }
};

// 🏆 ENHANCED LEADERBOARDS
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  badges: string[];
  team?: string;
  country?: string;
}

export interface LeaderboardConfig {
  id: string;
  name: string;
  description: string;
  type: 'global' | 'weekly' | 'monthly' | 'team' | 'country' | 'seasonal';
  metric: 'total_invites' | 'successful_invites' | 'conversion_rate' | 'team_size' | 'coins_earned';
  timeframe: 'alltime' | 'weekly' | 'monthly' | 'daily';
  rewards: {
    top1: string;
    top3: string;
    top10: string;
    participation: string;
  };
  live: boolean;
}

export const LEADERBOARD_CONFIGS: LeaderboardConfig[] = [
  {
    id: "global_alltime",
    name: "Hall of Fame",
    description: "Die besten Inviter aller Zeiten",
    type: "global",
    metric: "total_invites",
    timeframe: "alltime",
    rewards: {
      top1: "Legendary Badge + 10000 Coins",
      top3: "Epic Badge + 5000 Coins",
      top10: "Rare Badge + 2000 Coins",
      participation: "Participation Badge"
    },
    live: true
  },
  {
    id: "weekly_champions",
    name: "Weekly Champions",
    description: "Diese Woche die aktivsten Inviter",
    type: "weekly",
    metric: "successful_invites",
    timeframe: "weekly",
    rewards: {
      top1: "Champion Badge + 2000 Coins",
      top3: "Weekly Hero Badge + 1000 Coins",
      top10: "Weekly Badge + 500 Coins",
      participation: "Weekly Participant Badge"
    },
    live: true
  },
  {
    id: "team_kings",
    name: "Team Kings",
    description: "Die stärksten Teams",
    type: "team",
    metric: "team_size",
    timeframe: "alltime",
    rewards: {
      top1: "Team Legend Badge + Team Boost",
      top3: "Team Champion Badge",
      top10: "Team Badge",
      participation: "Team Member Badge"
    },
    live: true
  }
];

// 🎁 PREMIUM FEATURES
export interface PremiumInviteFeature {
  id: string;
  name: string;
  description: string;
  unlockRequirement: string;
  benefits: string[];
  cost?: {
    coins?: number;
    premium?: boolean;
  };
}

export const PREMIUM_INVITE_FEATURES: PremiumInviteFeature[] = [
  {
    id: "custom_invite_codes",
    name: "Custom Invite Codes",
    description: "Erstelle personalisierte Invite Codes mit deinem Namen",
    unlockRequirement: "Orbit Rank oder höher",
    benefits: ["Branded Codes", "Higher Conversion", "Premium Analytics"],
    cost: { premium: true }
  },
  {
    id: "advanced_analytics",
    name: "Advanced Analytics Pro",
    description: "Detaillierte Einblicke in deine Invite Performance",
    unlockRequirement: "Nova Rank",
    benefits: ["Heat Maps", "Conversion Funnels", "A/B Testing"],
    cost: { coins: 5000 }
  },
  {
    id: "team_booster",
    name: "Team Booster",
    description: "Verdopple die Rewards für dein gesamtes Team",
    unlockRequirement: "Supernova Rank",
    benefits: ["2x Team Rewards", "Priority Matching", "Exclusive Teams"],
    cost: { coins: 10000, premium: true }
  },
  {
    id: "invite_booster",
    name: "Invite Booster",
    description: "3x Rewards für eine Woche",
    unlockRequirement: "Comet Rank oder höher",
    benefits: ["3x Coin Rewards", "3x Drop Rewards", "Priority Queue"],
    cost: { coins: 2000 }
  },
  {
    id: "custom_branding",
    name: "Custom Branding",
    description: "Eigenes Logo und Design auf deinen Invites",
    unlockRequirement: "Nova Rank",
    benefits: ["Custom Logo", "Brand Colors", "Personalized Templates"],
    cost: { premium: true }
  }
];
