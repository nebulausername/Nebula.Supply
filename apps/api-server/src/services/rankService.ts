import { databaseService } from './database';
import { logger } from '../utils/logger';

export type UserRank =
  | 'Nutzer (Nicht verifiziert)'
  | 'Nutzer (Verifiziert)'
  | 'Kunde'
  | 'Kunde+'
  | 'Stammkunde'
  | 'VIP';

export interface RankInfo {
  rank: UserRank;
  nextRank?: UserRank;
  progress?: {
    ordersNeeded?: number;
    invitesNeeded?: number;
    revenueNeeded?: number;
    premiumInvitesNeeded?: number;
    normalInvitesNeeded?: number;
  };
}

export interface VipUnlockCriteria {
  revenueEur: number;
  premiumInvites: number;
  normalInvites: number;
}

export const VIP_UNLOCK_THRESHOLDS: VipUnlockCriteria = {
  revenueEur: 50,
  premiumInvites: 15,
  normalInvites: 30
};

export function computeRank(orders: number, invites: number): UserRank {
  const cond = (o: number, i: number) => orders >= o || invites >= i;
  if (cond(12, 20)) return 'VIP';
  if (cond(5, 10)) return 'Stammkunde';
  if (cond(3, 6)) return 'Kunde+';
  if (cond(1, 3)) return 'Kunde';
  return 'Nutzer (Verifiziert)';
}

export function checkVipUnlockEligibility(
  revenueEur: number,
  premiumInvites: number,
  normalInvites: number
): boolean {
  // 1a: ODER-Logik - mindestens eines der Kriterien erfüllt
  return (
    revenueEur >= VIP_UNLOCK_THRESHOLDS.revenueEur ||
    premiumInvites >= VIP_UNLOCK_THRESHOLDS.premiumInvites ||
    normalInvites >= VIP_UNLOCK_THRESHOLDS.normalInvites
  );
}

export function computeNextRank(orders: number, invites: number): RankInfo {
  const current = computeRank(orders, invites);
  const thresholds: Array<{ rank: UserRank; orders: number; invites: number }> = [
    { rank: 'Nutzer (Verifiziert)', orders: 0, invites: 0 },
    { rank: 'Kunde', orders: 1, invites: 3 },
    { rank: 'Kunde+', orders: 3, invites: 6 },
    { rank: 'Stammkunde', orders: 5, invites: 10 },
    { rank: 'VIP', orders: 12, invites: 20 }
  ];

  const idx = thresholds.findIndex((t) => t.rank === current);
  const next = thresholds[idx + 1];
  if (!next) {
    return { rank: current };
  }
  return {
    rank: current,
    nextRank: next.rank,
    progress: {
      ordersNeeded: Math.max(0, next.orders - orders),
      invitesNeeded: Math.max(0, next.invites - invites)
    }
  };
}

export async function getRankByTelegramId(telegramId: number): Promise<RankInfo & { 
  orders: number; 
  invites: number;
  revenueEur: number;
  premiumInvites: number;
  normalInvites: number;
  isVip: boolean;
  commissionPercentage: number;
}> {
  const aggregates = await databaseService.getUserAggregatesByTelegramId(telegramId);
  const orders = aggregates?.orders_count ?? 0;
  const invites = aggregates?.invites_success_count ?? 0;
  const revenueEur = aggregates?.total_revenue_eur ?? 0;
  const premiumInvites = aggregates?.premium_invites_count ?? 0;
  const normalInvites = invites - premiumInvites; // normal invites = total - premium
  const commissionPercentage = aggregates?.commission_percentage ?? 5.00;
  
  // Check VIP unlock eligibility
  const isVipEligible = checkVipUnlockEligibility(revenueEur, premiumInvites, normalInvites);
  
  // If eligible but not unlocked yet, unlock VIP
  if (isVipEligible && !aggregates?.vip_unlocked_at) {
    await unlockVipRank(telegramId);
  }
  
  // Determine rank - VIP takes precedence if unlocked
  let rank: UserRank = 'Nutzer (Verifiziert)';
  if (aggregates?.vip_unlocked_at || isVipEligible) {
    rank = 'VIP';
  } else {
    rank = computeRank(orders, invites);
  }
  
  const info = computeNextRankForVip(orders, invites, revenueEur, premiumInvites, normalInvites, rank);
  
  return { 
    ...info, 
    orders, 
    invites,
    revenueEur,
    premiumInvites,
    normalInvites,
    isVip: rank === 'VIP',
    commissionPercentage
  };
}

async function unlockVipRank(telegramId: number): Promise<void> {
  try {
    const aggregates = await databaseService.getUserAggregatesByTelegramId(telegramId);
    if (aggregates?.vip_unlocked_at) {
      // Already unlocked
      return;
    }
    
    // Unlock VIP
    await databaseService.updateUserAggregates(telegramId, {
      vip_unlocked_at: new Date().toISOString()
    });
    
    // Award invites on unlock: 15 Premium or 30 Normal
    // Award based on how they unlocked
    const premiumInvites = aggregates?.premium_invites_count ?? 0;
    const revenueEur = aggregates?.total_revenue_eur ?? 0;
    const normalInvites = (aggregates?.invites_success_count ?? 0) - premiumInvites;
    
    if (premiumInvites >= VIP_UNLOCK_THRESHOLDS.premiumInvites) {
      // Unlocked via premium invites - award 15 premium invites
      await databaseService.updateUserAggregates(telegramId, {
        premium_invites_count: premiumInvites + 15
      });
    } else if (revenueEur >= VIP_UNLOCK_THRESHOLDS.revenueEur) {
      // Unlocked via revenue - award 30 normal invites
      await databaseService.updateUserAggregates(telegramId, {
        invites_success_count: (aggregates?.invites_success_count ?? 0) + 30
      });
    } else if (normalInvites >= VIP_UNLOCK_THRESHOLDS.normalInvites) {
      // Unlocked via normal invites - award 30 normal invites
      await databaseService.updateUserAggregates(telegramId, {
        invites_success_count: (aggregates?.invites_success_count ?? 0) + 30
      });
    }
    
    logger.info(`VIP rank unlocked for telegram user ${telegramId}`);
  } catch (error) {
    logger.error(`Failed to unlock VIP rank for ${telegramId}:`, error);
    throw error;
  }
}

function computeNextRankForVip(
  orders: number,
  invites: number,
  revenueEur: number,
  premiumInvites: number,
  normalInvites: number,
  currentRank: UserRank
): RankInfo {
  // If already VIP, no next rank
  if (currentRank === 'VIP') {
    return { rank: 'VIP' };
  }
  
  // Check VIP eligibility
  const isVipEligible = checkVipUnlockEligibility(revenueEur, premiumInvites, normalInvites);
  if (isVipEligible) {
    return {
      rank: currentRank,
      nextRank: 'VIP',
      progress: {
        ordersNeeded: 0,
        invitesNeeded: 0,
        revenueNeeded: 0,
        premiumInvitesNeeded: 0,
        normalInvitesNeeded: 0
      }
    };
  }
  
  // Otherwise use standard progression
  const standardInfo = computeNextRank(orders, invites);
  
  // Calculate progress to VIP
  const revenueNeeded = Math.max(0, VIP_UNLOCK_THRESHOLDS.revenueEur - revenueEur);
  const premiumInvitesNeeded = Math.max(0, VIP_UNLOCK_THRESHOLDS.premiumInvites - premiumInvites);
  const normalInvitesNeeded = Math.max(0, VIP_UNLOCK_THRESHOLDS.normalInvites - normalInvites);
  
  return {
    ...standardInfo,
    progress: {
      ...standardInfo.progress,
      revenueNeeded,
      premiumInvitesNeeded,
      normalInvitesNeeded
    }
  };
}








