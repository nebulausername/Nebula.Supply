import { useEffect, useRef } from 'react';
import { useGamingDiscountStore, DISCOUNT_TIERS } from '../store/gamingDiscounts';
import { useCookieClickerStore } from '../store/cookieClicker';
import { useToastStore } from '../store/toast';

/**
 * Hook für automatische Gaming-Discount Notifications
 * Zeigt Toasts bei wichtigen Milestones
 */
export const useGamingDiscountNotifications = () => {
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const getProgressToNextDiscount = useGamingDiscountStore(state => state.getProgressToNextDiscount);
  const hasAvailableDiscounts = useGamingDiscountStore(state => state.hasAvailableDiscounts());
  const availableDiscounts = useGamingDiscountStore(state => state.availableDiscounts);
  const addToast = useToastStore(state => state.addToast);
  
  const notifiedTiers = useRef<Set<string>>(new Set());
  const notifiedAvailable = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Check für 90% Progress Notifications
    DISCOUNT_TIERS.forEach(tier => {
      const progress = getProgressToNextDiscount(tier.tier);
      const notificationKey = `${tier.tier}-90`;
      
      // Zeige Toast bei 90% aber noch nicht claimable
      if (progress.percentage >= 90 && !progress.canClaim && !notifiedTiers.current.has(notificationKey)) {
        notifiedTiers.current.add(notificationKey);
        
        addToast({
          type: 'info',
          title: `${tier.icon} Fast geschafft!`,
          message: `Nur noch ${Math.floor(progress.missing)} Cookies bis zum ${tier.tier} Rabatt!`,
          duration: 5000
        });
      }
      
      // Reset notification wenn User wieder unter 90% fällt
      if (progress.percentage < 90) {
        notifiedTiers.current.delete(notificationKey);
      }
    });

    // Check für verfügbare Rabatte
    availableDiscounts.forEach(discount => {
      if (!notifiedAvailable.current.has(discount.id)) {
        notifiedAvailable.current.add(discount.id);
        
        const tierConfig = DISCOUNT_TIERS.find(t => t.tier === discount.tier);
        if (tierConfig) {
          addToast({
            type: 'success',
            title: `${tierConfig.icon} ${discount.tier} Rabatt verfügbar!`,
            message: `Löse ihn im Checkout ein und spare Geld!`,
            duration: 8000
          });
        }
      }
    });

    // Cleanup: Entferne Notifications für nicht mehr verfügbare Rabatte
    const currentIds = new Set(availableDiscounts.map(d => d.id));
    notifiedAvailable.current.forEach(id => {
      if (!currentIds.has(id)) {
        notifiedAvailable.current.delete(id);
      }
    });
  }, [totalCookies, getProgressToNextDiscount, availableDiscounts, addToast, hasAvailableDiscounts]);
};


