/**
 * Shared types for Daily Rewards system
 * Used by both web app and API server
 */

export interface DailyRewardStatus {
  eligible: boolean;
  lastClaimAt: string | null;
  lastClaimDayKey: string | null;
  streak: number;
  totalCoins: number;
  nextEligibleAt: string | null;
  todayDayKey: string;
}

export interface DailyRewardClaimResponse {
  coins: number;
  streak: number;
  totalCoins: number;
  nextEligibleAt: string;
}

export interface TelegramUser {
  telegramId: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
}

export interface TelegramAuthResponse {
  token: string;
  user: TelegramUser;
}

export interface TelegramVerifyRequest {
  initData: string;
}

export interface RewardClaimRequest {
  timezone?: string;
}



