import { useMemo } from 'react';
import { useGamingDiscountStore } from '../store/gamingDiscounts';
import { useCookieClickerStore } from '../store/cookieClicker';

/**
 * Custom Hook für Gaming Discounts
 * Kombiniert Cookie Clicker State mit Gaming Discount State
 */
export const useGamingDiscounts = () => {
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  
  const {
    availableDiscounts,
    usedDiscounts,
    activeDiscountId,
    redemptionHistory,
    claimDiscount,
    useDiscount,
    setActiveDiscount,
    getProgressToNextDiscount,
    getRequiredCookies,
    getAvailableDiscount,
    hasAvailableDiscounts,
    getTotalSavings
  } = useGamingDiscountStore();

  // Berechne ob ein Rabatt bald verfügbar ist (>= 90%)
  const hasNearlyAvailableDiscount = useMemo(() => {
    const tiers: Array<'5%' | '10%' | '15%' | '20%'> = ['5%', '10%', '15%', '20%'];
    return tiers.some(tier => {
      const progress = getProgressToNextDiscount(tier);
      return !progress.canClaim && progress.percentage >= 90;
    });
  }, [getProgressToNextDiscount, totalCookies]);

  // Aktuell aktiver Rabatt
  const activeDiscount = useMemo(() => {
    if (!activeDiscountId) return null;
    return availableDiscounts.find(d => d.id === activeDiscountId) || null;
  }, [activeDiscountId, availableDiscounts]);

  // Stats
  const stats = useMemo(() => ({
    totalAvailable: availableDiscounts.length,
    totalUsed: usedDiscounts.length,
    totalSavings: getTotalSavings(),
    totalRedemptions: Object.values(redemptionHistory).reduce((sum, count) => sum + count, 0)
  }), [availableDiscounts, usedDiscounts, redemptionHistory, getTotalSavings]);

  return {
    // State
    totalCookies,
    cookiesPerSecond,
    availableDiscounts,
    usedDiscounts,
    activeDiscount,
    redemptionHistory,
    stats,
    
    // Computed
    hasAvailableDiscounts: hasAvailableDiscounts(),
    hasNearlyAvailableDiscount,
    
    // Actions
    claimDiscount,
    useDiscount,
    setActiveDiscount,
    getProgressToNextDiscount,
    getRequiredCookies,
    getAvailableDiscount
  };
};



