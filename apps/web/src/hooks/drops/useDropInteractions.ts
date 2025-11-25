import { useCallback } from 'react';
import type { Drop, DropVariant } from '@nebula/shared';
import { useDropsStore } from '../../store/drops';
import { useShopStore } from '../../store/shop';
import { addDropItemToCart, useGlobalCartStore } from '../../store/globalCart';
import { hasDropAccess } from '../../utils/inviteAccess';
import { showToast } from '../../store/toast';
import { useEnhancedTouch } from '../useEnhancedTouch';

/**
 * 🎯 Centralized Drop Interaction Logic Hook
 * Handles all drop-related interactions with haptic feedback and toast notifications
 */
export const useDropInteractions = (drop: Drop) => {
  const { triggerHaptic } = useEnhancedTouch();
  const { interests, toggleInterest } = useDropsStore();
  const { invite } = useShopStore();
  const { addItem } = useGlobalCartStore();

  // 🎯 Add to Cart
  const handleAddToCart = useCallback((variant: DropVariant, quantity: number) => {
    const inviteRequired = variant?.inviteRequired ?? drop.inviteRequired;
    const canPreorder = hasDropAccess(invite as any, !!inviteRequired);

    if (!canPreorder) {
      triggerHaptic('error');
      showToast.error("Nicht verfügbar", "Für diesen Drop benötigst du eine Einladung");
      return false;
    }

    if (!variant) {
      triggerHaptic('error');
      showToast.error("Fehler", "Bitte wähle eine Variante aus");
      return false;
    }

    triggerHaptic('success');
    const success = addDropItemToCart(drop, variant, quantity);

    if (success) {
      showToast.success(
        'Zum Warenkorb hinzugefügt!',
        `${quantity}x ${variant.label} wurde zum Warenkorb hinzugefügt`
      );
      return true;
    } else {
      triggerHaptic('error');
      showToast.error("Fehler", "Konnte nicht zum Warenkorb hinzugefügt werden");
      return false;
    }
  }, [drop, invite, triggerHaptic]);

  // 🎯 Toggle Interest
  const handleToggleInterest = useCallback(() => {
    triggerHaptic('light');
    toggleInterest(drop.id);
    
    const isInterested = interests[drop.id] !== undefined ? !interests[drop.id] : true;
    
    showToast.success(
      isInterested ? '⭐ Interesse gemerkt!' : 'Interesse entfernt',
      isInterested 
        ? 'Du erhältst Updates zu diesem Drop'
        : 'Du erhältst keine Updates mehr'
    );
  }, [drop.id, interests, toggleInterest, triggerHaptic]);

  // 🎯 Share Drop
  const handleShare = useCallback(async () => {
    triggerHaptic('light');
    
    const sharePayload = {
      title: drop.name,
      text: `${drop.name} jetzt bei Nebula Supply sichern!`,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        triggerHaptic('success');
        showToast.success('Geteilt!', 'Drop wurde erfolgreich geteilt');
        return true;
      }
      
      if (navigator.clipboard?.writeText && sharePayload.url) {
        await navigator.clipboard.writeText(sharePayload.url);
        triggerHaptic('success');
        showToast.success('Link kopiert!', 'Drop-Link wurde in die Zwischenablage kopiert');
        return true;
      }
      
      triggerHaptic('warning');
      showToast.warning('Nicht unterstützt', 'Teilen wird auf diesem Gerät nicht unterstützt');
      return false;
    } catch (error) {
      console.error('Share failed:', error);
      triggerHaptic('error');
      return false;
    }
  }, [drop.name, triggerHaptic]);

  // 🎯 Quick Buy (bypasses modal)
  const handleQuickBuy = useCallback((variant: DropVariant, quantity: number = 1) => {
    triggerHaptic('medium');
    return handleAddToCart(variant, quantity);
  }, [handleAddToCart, triggerHaptic]);

  // 🎯 Check Access
  const checkAccess = useCallback((variant?: DropVariant) => {
    const inviteRequired = variant?.inviteRequired ?? drop.inviteRequired;
    return hasDropAccess(invite as any, !!inviteRequired);
  }, [drop.inviteRequired, invite]);

  const interestCount = interests[drop.id] ?? drop.interestCount;
  const isInterested = interests[drop.id] !== undefined;

  return {
    handleAddToCart,
    handleToggleInterest,
    handleShare,
    handleQuickBuy,
    checkAccess,
    interestCount,
    isInterested,
    hasInviteAccess: invite?.hasInvite ?? false,
  };
};


