// 🏆 CONTEST SCORING SYSTEM - Multi-Factor Scoring mit Bonuses

export interface ScoringFactors {
  totalCookies: number;
  achievements: number;
  buildings: Record<string, number>;
  cookiesPerSecond: number;
  activeTime: number; // in seconds
  clicks: number;
  level: number;
}

export interface ScoringWeights {
  cookies: number;        // Default: 0.6 (60%)
  achievements: number;  // Default: 0.2 (20%)
  efficiency: number;   // Default: 0.1 (10%)
  activeTime: number;   // Default: 0.1 (10%)
}

export interface ScoreResult {
  baseScore: number;
  bonuses: {
    dailyStreak?: number;
    weeklyMilestone?: number;
    efficiency?: number;
    activeTime?: number;
  };
  totalScore: number;
  breakdown: {
    cookies: number;
    achievements: number;
    efficiency: number;
    activeTime: number;
    bonuses: number;
  };
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  cookies: 0.6,
  achievements: 0.2,
  efficiency: 0.1,
  activeTime: 0.1,
};

/**
 * Calculate building efficiency score
 * Higher efficiency = better building management
 */
function calculateBuildingEfficiency(
  buildings: Record<string, number>,
  cookiesPerSecond: number,
  totalCookies: number
): number {
  const totalBuildings = Object.values(buildings).reduce((sum, count) => sum + count, 0);
  
  if (totalBuildings === 0 || totalCookies === 0) return 0;
  
  // Efficiency = CPS per building * (total buildings / total cookies ratio)
  const efficiency = (cookiesPerSecond / Math.max(totalBuildings, 1)) * (totalBuildings / totalCookies);
  
  // Normalize to 0-1 scale
  return Math.min(efficiency * 1000, 1);
}

/**
 * Calculate active time bonus
 * Rewards consistent active play
 */
function calculateActiveTimeBonus(activeTime: number): number {
  // Max bonus at 10 hours of active play
  const maxTime = 10 * 60 * 60; // 10 hours in seconds
  const normalizedTime = Math.min(activeTime / maxTime, 1);
  
  return normalizedTime * 0.5; // Max 50% bonus
}

/**
 * Calculate daily streak bonus
 */
function calculateDailyStreakBonus(activeDays: number): number {
  // Active day = at least 1 hour of play
  const maxStreak = 30; // Max streak for full month
  const normalizedStreak = Math.min(activeDays / maxStreak, 1);
  
  return normalizedStreak * 0.2; // Max 20% bonus
}

/**
 * Calculate weekly milestone bonus
 */
function calculateWeeklyMilestoneBonus(week: number): number {
  // Week 1-4 of the month
  if (week <= 1) return 0.05;  // 5% bonus for first week
  if (week <= 2) return 0.10;  // 10% bonus for second week
  if (week <= 3) return 0.15;  // 15% bonus for third week
  return 0.20; // 20% bonus for fourth week
}

/**
 * Calculate contest score with all factors
 */
export function calculateContestScore(
  factors: ScoringFactors,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoreResult {
  // Base score components
  const cookieScore = Math.log10(factors.totalCookies + 1) * 1000 * weights.cookies;
  const achievementScore = factors.achievements * 1000000 * weights.achievements;
  
  // Building efficiency
  const efficiency = calculateBuildingEfficiency(
    factors.buildings,
    factors.cookiesPerSecond,
    factors.totalCookies
  );
  const efficiencyScore = efficiency * 1000000 * weights.efficiency;
  
  // Active time bonus
  const activeTimeBonus = calculateActiveTimeBonus(factors.activeTime);
  const activeTimeScore = factors.activeTime / 3600 * 10000 * weights.activeTime; // Per hour
  
  // Base score sum
  const baseScore = cookieScore + achievementScore + efficiencyScore + activeTimeScore;
  
  // Calculate bonuses
  const dailyStreakBonus = calculateDailyStreakBonus(Math.floor(factors.activeTime / 86400));
  const currentWeek = Math.floor((Date.now() - new Date().setDate(1)) / (7 * 24 * 60 * 60 * 1000)) + 1;
  const weeklyMilestoneBonus = calculateWeeklyMilestoneBonus(currentWeek);
  
  const totalBonusMultiplier = 1 + dailyStreakBonus + weeklyMilestoneBonus;
  
  // Apply bonuses
  const bonuses = {
    dailyStreak: dailyStreakBonus,
    weeklyMilestone: weeklyMilestoneBonus,
    efficiency: efficiency,
    activeTime: activeTimeBonus,
  };
  
  const totalScore = baseScore * totalBonusMultiplier;
  
  return {
    baseScore,
    bonuses,
    totalScore: Math.floor(totalScore),
    breakdown: {
      cookies: Math.floor(cookieScore),
      achievements: Math.floor(achievementScore),
      efficiency: Math.floor(efficiencyScore),
      activeTime: Math.floor(activeTimeScore),
      bonuses: Math.floor(totalScore - baseScore),
    },
  };
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  if (score >= 1e12) return `${(score / 1e12).toFixed(2)}T`;
  if (score >= 1e9) return `${(score / 1e9).toFixed(2)}B`;
  if (score >= 1e6) return `${(score / 1e6).toFixed(2)}M`;
  if (score >= 1e3) return `${(score / 1e3).toFixed(2)}K`;
  return Math.floor(score).toLocaleString();
}

