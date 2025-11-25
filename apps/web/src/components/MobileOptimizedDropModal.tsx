import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Minus,
  Plus,
  Truck,
  Heart,
  Share2,
  CheckCircle,
  Crown,
  Flame,
  Sparkles,
  Star,
  ArrowRight,
  ShoppingCart,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  Grid3x3,
  List,
  Check,
  Clock
} from "lucide-react";
import { useDropsStore, useSelectedDrop } from "../store/drops";
import { useShopStore } from "../store/shop";
import { useUserInterestsStore } from "../store/userInterests";
import { Badge } from "./Badge";
import { ProductImage } from "./media/ProductImage";
import { InviteRequiredModal } from "./InviteRequiredModal";
import { DropSmartCartConfirmation } from "./drops/DropSmartCartConfirmation";
import { DropCountdown } from "./drops/DropCountdown";
import { PreorderInfo } from "./drops/PreorderInfo";
import { getDynamicDeliveryTime, getPrimaryDeliveryOrigin, getSimplifiedOriginLabel } from "../utils/deliveryTimes";
import { useGlobalCartStore } from "../store/globalCart";
import { checkoutDrop } from "../utils/checkoutDrop";
import { showToast } from "../store/toast";
import { formatCurrency } from "../utils/currency";
import { cn } from "../utils/cn";
import { QuantityControl } from "./drops/QuantityControl";
import { useEnhancedTouch } from "../hooks/useEnhancedTouch";

const formatPrice = (value: number, currency: string) =>
  formatCurrency(value, "de-DE", currency);

// 🎯 Mobile-Optimized Drop Modal
export const MobileOptimizedDropModal = () => {
  const [showReservationToast, setShowReservationToast] = useState(false);
  const [showPreorderConfirmation, setShowPreorderConfirmation] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isProcessingPreorder, setIsProcessingPreorder] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero' | 'variants' | 'preorder'>('hero');
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [isInterested, setIsInterested] = useState(false);
  const [isTogglingInterest, setIsTogglingInterest] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // 🎯 Smart Cart Confirmation State
  const [showDropSmartCartConfirmation, setShowDropSmartCartConfirmation] = useState(false);
  const [addedItems, setAddedItems] = useState<Array<{ variantLabel: string; quantity: number; price: number }>>([]);
  const [totalAddedPrice, setTotalAddedPrice] = useState(0);

  // 🎯 Variants Search/Filter/Sort State
  const [variantSearchQuery, setVariantSearchQuery] = useState("");
  const [variantFilter, setVariantFilter] = useState<'all' | 'available' | 'invite-required' | 'low-stock'>('all');
  const [variantSort, setVariantSort] = useState<'price-asc' | 'price-desc' | 'name-asc' | 'stock-desc'>('price-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const { triggerHaptic } = useEnhancedTouch();

  const selected = useSelectedDrop();
  const drop = selected?.drop;
  const selection = selected?.selection;

  // 🎯 Helper: Get deadline for countdown with fallback
  const getDeadlineForDrop = useCallback((dropParam: typeof drop): string | null => {
    if (!dropParam) return null;
    
    // Priorität 1: deadlineAt
    if (dropParam.deadlineAt) return dropParam.deadlineAt;
    
    // Priorität 2: preorderDeadline
    if (dropParam.preorderDeadline) return dropParam.preorderDeadline;
    
    // Priorität 3: Fallback (14 Tage ab jetzt für verfügbare Drops)
    if (dropParam.status === 'available') {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 14);
      return fallback.toISOString();
    }
    
    return null;
  }, []);

  // 🎯 Calculate deadline once
  const dropDeadline = useMemo(() => getDeadlineForDrop(drop), [drop, getDeadlineForDrop]);
  const shouldShowCountdown = drop && drop.status === 'available' && dropDeadline;

  // 🎯 Sync isInterested with userInterestsStore on mount
  useEffect(() => {
    if (drop) {
      const { dropInterests } = useUserInterestsStore.getState();
      setIsInterested(dropInterests.includes(drop.id));
    }
  }, [drop]);

  const {
    setQuantity,
    incrementQuantity,
    setShipping,
    setOrigin,
    toggleInterest,
    interests,
    closeDrop,
    setVariant
  } = useDropsStore();

  const { invite } = useShopStore();

  // 🎯 Smart variant selection with auto-quantity
  const selectedVariant = useMemo(() => {
    if (!drop) return null;
    
    // If we have selected variants, use the first one for display
    if (selectedVariants.size > 0) {
      const firstVariantId = Array.from(selectedVariants)[0];
      return drop.variants.find(v => v.id === firstVariantId) ?? drop.variants[0];
    }
    
    // Fallback to selection or first variant
    if (selection?.variantId) {
      return drop.variants.find(v => v.id === selection.variantId) ?? drop.variants[0];
    }
    
    return drop.variants[0];
  }, [drop, selection?.variantId, selectedVariants]);

  // 🎯 Individual variant quantities
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});

  const currentQuantity = selection?.quantity ?? 1;
  const currentShipping = selection?.shippingOption?.id;
  const currentOrigin = selection?.originOption?.id;

  // 🎯 Auto-calculate quantity when variants change
  useEffect(() => {
    if (drop && selectedVariants.size > 0) {
      const newQuantity = selectedVariants.size;
      if (currentQuantity !== newQuantity) {
        setQuantity(drop.id, newQuantity);
      }
    }
  }, [selectedVariants.size, drop, currentQuantity, setQuantity]);

  // 🎯 Memoize total price calculation for performance
  const totalPrice = useMemo(() => {
    if (selectedVariants.size === 0) return 0;
    
    return Array.from(selectedVariants).reduce((total, variantId) => {
      const variant = drop?.variants.find(v => v.id === variantId);
      const quantityPerVariant = variantQuantities[variantId] ?? 1;
      return total + ((variant?.basePrice ?? 0) * quantityPerVariant);
    }, 0);
  }, [selectedVariants, variantQuantities, drop?.variants]);

  // 🎯 Filter and sort variants
  const filteredAndSortedVariants = useMemo(() => {
    if (!drop) return [];
    
    let filtered = drop.variants.filter(variant => {
      // Search filter
      if (variantSearchQuery) {
        const query = variantSearchQuery.toLowerCase();
        const matchesSearch = 
          variant.label.toLowerCase().includes(query) ||
          variant.description?.toLowerCase().includes(query) ||
          variant.flavor?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Filter options
      switch (variantFilter) {
        case 'available':
          return variant.stock > 0;
        case 'invite-required':
          return variant.inviteRequired === true;
        case 'low-stock':
          return variant.stock > 0 && variant.stock <= 10;
        default:
          return true;
      }
    });
    
    // Sort variants
    filtered.sort((a, b) => {
      switch (variantSort) {
        case 'price-asc':
          return a.basePrice - b.basePrice;
        case 'price-desc':
          return b.basePrice - a.basePrice;
        case 'name-asc':
          return a.label.localeCompare(b.label);
        case 'stock-desc':
          return b.stock - a.stock;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [drop, variantSearchQuery, variantFilter, variantSort]);

  // 🎯 Intelligent quantity calculation - REMOVED (not used in multi-variant system)

  const handleVariantSelect = (variantId: string) => {
    if (!drop) return;
    
    // Toggle variant selection
    const newSelectedVariants = new Set(selectedVariants);
    if (newSelectedVariants.has(variantId)) {
      newSelectedVariants.delete(variantId);
      // Remove quantity for deselected variant
      const newQuantities = { ...variantQuantities };
      delete newQuantities[variantId];
      setVariantQuantities(newQuantities);
    } else {
      newSelectedVariants.add(variantId);
      // Set default quantity of 1 for new variant
      setVariantQuantities(prev => ({
        ...prev,
        [variantId]: 1
      }));
    }
    setSelectedVariants(newSelectedVariants);
    
    // Auto-calculate total quantity based on selected variants (1 per variant)
    const totalQuantity = newSelectedVariants.size;
    
    // Update quantity if we have selected variants
    if (totalQuantity > 0) {
      setQuantity(drop.id, totalQuantity);
    } else {
      // Reset to default quantity if no variants selected
      setQuantity(drop.id, 1);
    }
    
    // Set the first selected variant as the main variant
    if (newSelectedVariants.size > 0) {
      const firstVariantId = Array.from(newSelectedVariants)[0];
      setVariant(drop.id, firstVariantId);
    }
    
    console.log('Selected variants:', Array.from(newSelectedVariants), 'Total quantity:', totalQuantity);
    // Do NOT auto-switch to "Bestellen"; stay on "Sorten" so users can pick multiple variants
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!drop) return;
    
    const totalSelectedVariants = selectedVariants.size;
    
    // If no variants selected, set minimum quantity
    if (totalSelectedVariants === 0) {
      setQuantity(drop.id, 1);
      return;
    }
    
    // Ensure quantity is at least the number of selected variants
    const minQuantity = totalSelectedVariants;
    const maxQuantity = totalSelectedVariants * 10; // Max 10 per variant
    
    // Validate quantity is a positive number
    if (isNaN(newQuantity) || newQuantity < 0 || !Number.isInteger(newQuantity)) {
      console.warn('Invalid quantity:', newQuantity);
      return;
    }
    
    const clampedQuantity = Math.max(minQuantity, Math.min(newQuantity, maxQuantity));
    setQuantity(drop.id, clampedQuantity);
    
    console.log('Quantity changed:', newQuantity, 'Selected variants:', totalSelectedVariants, 'Clamped quantity:', clampedQuantity);
  };

  // 🎯 Handle individual variant quantity changes
  const handleVariantQuantityChange = (variantId: string, newQuantity: number) => {
    if (!drop) return;
    
    const variant = drop.variants.find(v => v.id === variantId);
    if (!variant) return;
    
    const minQty = variant.minQuantity ?? 1;
    const maxQty = Math.min(variant.maxQuantity ?? 10, variant.stock);
    
    // Validate quantity
    if (isNaN(newQuantity) || newQuantity < 0 || !Number.isInteger(newQuantity)) {
      console.warn('Invalid variant quantity:', newQuantity);
      return;
    }
    
    const clampedQuantity = Math.max(minQty, Math.min(newQuantity, maxQty));
    
    setVariantQuantities(prev => ({
      ...prev,
      [variantId]: clampedQuantity
    }));
    
    // Update total quantity
    const totalQuantity = Object.values({
      ...variantQuantities,
      [variantId]: clampedQuantity
    }).reduce((sum, qty) => sum + qty, 0);
    
    setQuantity(drop.id, totalQuantity);
    
    console.log(`Variant ${variantId} quantity changed to:`, clampedQuantity, 'Total:', totalQuantity);
  };

  // 🎯 Handle add to cart directly (like Shop flow)
  const handleAddToCart = async () => {
    console.log('🚀 handleAddToCart called', {
      drop: drop?.name,
      selectedVariantsSize: selectedVariants.size,
      variantQuantities
    });
    
    if (!drop || selectedVariants.size === 0) {
      console.warn('⚠️ No drop or no variants selected');
      showToast.error('Fehler', 'Bitte wähle mindestens eine Sorte aus');
      return;
    }
    
    // Check if any selected variant requires invite
    const selectedVariantsList = Array.from(selectedVariants);
    const requiresInvite = selectedVariantsList.some(variantId => {
      const variant = drop.variants.find(v => v.id === variantId);
      return variant?.inviteRequired;
    });
    
    if (requiresInvite && !(invite?.hasInvite ?? false)) {
      console.log('❌ Invite required but not available - showing invite modal');
      setShowInviteModal(true);
      return;
    }
    
    setIsProcessingPreorder(true);
    triggerHaptic('medium');
    
    try {
      // Build checkout lines from selected variants
      const lines = Array.from(selectedVariants).map(variantId => {
        const variant = drop.variants.find(v => v.id === variantId);
        const quantity = variantQuantities[variantId] ?? 1;
        return { variant: variant!, quantity };
      }).filter(line => line.variant);
      
      console.log('🛒 Calling checkoutDrop with lines:', lines.length);
      
      // Use unified checkout
      const result = await checkoutDrop({
        drop,
        lines,
        invite,
        openCart: false, // We'll handle cart open via confirmation
        skipAccessCheck: true
      });
      
      console.log('✅ CheckoutDrop result:', result);
      
      if (result.ok) {
        console.log('🎉 Checkout successful!', { 
          itemsAdded: result.itemsAdded.length,
          totalPrice: result.totalPrice 
        });
        
        // Show Smart Cart Confirmation directly
        setAddedItems(result.itemsAdded);
        setTotalAddedPrice(result.totalPrice);
        setShowDropSmartCartConfirmation(true);
        triggerHaptic('success');
        
        // Show success toast
        showToast.success(
          '🎉 Erfolgreich hinzugefügt!',
          `${result.itemsAdded.length} ${result.itemsAdded.length === 1 ? 'Sorte wurde' : 'Sorten wurden'} zum Warenkorb hinzugefügt`
        );
      } else {
        console.error('❌ Checkout failed:', result);
        showToast.error('Fehler', 'Artikel konnten nicht hinzugefügt werden');
        triggerHaptic('error');
      }
    } catch (error) {
      console.error('❌ Checkout error:', error);
      showToast.error('Fehler', 'Ein unerwarteter Fehler ist aufgetreten');
      triggerHaptic('error');
    } finally {
      setIsProcessingPreorder(false);
    }
  };

  // 🎯 Bulk select/deselect all variants
  const handleSelectAll = () => {
    if (!drop) return;
    triggerHaptic('medium');
    
    if (selectedVariants.size === filteredAndSortedVariants.length) {
      // Deselect all
      setSelectedVariants(new Set());
      setVariantQuantities({});
    } else {
      // Select all
      const newSelectedVariants = new Set<string>();
      const newQuantities: Record<string, number> = {};
      
      filteredAndSortedVariants.forEach(variant => {
        newSelectedVariants.add(variant.id);
        newQuantities[variant.id] = variant.minQuantity ?? 1;
      });
      
      setSelectedVariants(newSelectedVariants);
      setVariantQuantities(newQuantities);
      
      // Update total quantity
      const totalQty = Object.values(newQuantities).reduce((sum, qty) => sum + qty, 0);
      setQuantity(drop.id, totalQty);
      
      if (newSelectedVariants.size > 0) {
        const firstVariantId = Array.from(newSelectedVariants)[0];
        setVariant(drop.id, firstVariantId);
      }
    }
  };

  // 🎯 Reset states when modal closes
  useEffect(() => {
    if (!drop) {
      // Only reset if confirmation is not showing
      if (!showDropSmartCartConfirmation) {
        console.log('🔄 Resetting all states - drop modal closed');
        setAddedItems([]);
        setTotalAddedPrice(0);
        setSelectedVariants(new Set());
        setVariantQuantities({});
        setVariantSearchQuery("");
        setVariantFilter('all');
        setVariantSort('price-asc');
      } else {
        console.log('⏸️ Skipping reset - confirmation modal is showing');
      }
    }
  }, [drop, showDropSmartCartConfirmation]);

  // 🎯 REMOVED: Auto-close timeout - User soll selbst entscheiden!
  // Kein automatisches Schließen mehr - Modal bleibt offen bis User interagiert

  const handleInterest = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!drop) {
      showToast.warning('Fehler', 'Drop konnte nicht gefunden werden');
      return;
    }
    
    if (isTogglingInterest) {
      return; // Prevent double-click
    }
    
    console.log('✅ handleInterest: Starting', { dropId: drop.id, currentInterested: isInterested });
    
    setIsTogglingInterest(true);
    triggerHaptic('medium');
    
    const newInterested = !isInterested;
    
    // Optimistic update
    setIsInterested(newInterested);
    
    try {
      // Toggle interest in drops store
      if (toggleInterest) {
        toggleInterest(drop.id);
      }
      
      // Sync with userInterestsStore
      try {
        const { toggleDropInterest } = useUserInterestsStore.getState();
        if (toggleDropInterest) {
          toggleDropInterest(drop.id);
        }
      } catch (storeError) {
        console.warn('⚠️ userInterestsStore sync failed:', storeError);
        // Continue even if sync fails
      }
      
      console.log('✅ handleInterest: Success', { newInterested });
      
      // Show feedback
      if (newInterested) {
        showToast.success('⭐ Interesse gezeigt!', `${drop.name} wurde zu deinen Interessen hinzugefügt`);
        triggerHaptic('success');
      } else {
        showToast.info('Interesse entfernt', `${drop.name} wurde aus deinen Interessen entfernt`);
      }
    } catch (error) {
      console.error('❌ handleInterest: Error', error);
      // Revert on error
      setIsInterested(!newInterested);
      showToast.error('Fehler', 'Interesse konnte nicht aktualisiert werden');
      triggerHaptic('error');
    } finally {
      setIsTogglingInterest(false);
    }
  }, [drop, isInterested, isTogglingInterest, toggleInterest, triggerHaptic]);

  const handleShare = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!drop) {
      showToast.warning('Fehler', 'Drop konnte nicht gefunden werden');
      return;
    }
    
    if (isSharing) {
      return; // Prevent double-click
    }
    
    console.log('✅ handleShare: Starting', { dropId: drop.id });
    
    setIsSharing(true);
    triggerHaptic('medium');
    
    const sharePayload = {
      title: drop.name || 'Premium Drop',
      text: `${drop.name} jetzt sichern bei Nebula Supply - ${selectedVariant?.label || 'Premium Drop'}`,
      url: typeof window !== "undefined" ? window.location.href : undefined
    };

    try {
      // Try Web Share API first (native share)
      if (navigator.share && navigator.canShare?.(sharePayload)) {
        await navigator.share(sharePayload);
        console.log('✅ handleShare: Shared via native API');
        showToast.success('Erfolgreich geteilt!', `${drop.name} wurde geteilt`);
        triggerHaptic('success');
        return;
      }
      
      // Fallback to clipboard
      if (navigator.clipboard?.writeText && sharePayload.url) {
        await navigator.clipboard.writeText(sharePayload.url);
        console.log('✅ handleShare: Copied to clipboard');
        showToast.success('Link kopiert!', 'Der Link wurde in die Zwischenablage kopiert');
        triggerHaptic('success');
        return;
      }
      
      // If both fail, try to create a shareable text
      if (sharePayload.url) {
        // Show instructions to user
        showToast.info(
          'Teilen',
          'Bitte kopiere den Link manuell aus der Adressleiste'
        );
        triggerHaptic('warning');
      } else {
        showToast.warning(
          'Teilen nicht möglich',
          'Teilen wird auf diesem Gerät nicht unterstützt'
        );
        triggerHaptic('error');
      }
    } catch (error: any) {
      // User cancelled share dialog
      if (error?.name === 'AbortError') {
        console.log('ℹ️ handleShare: User cancelled');
        return;
      }
      
      // Try clipboard as fallback if share failed
      if (sharePayload.url) {
        try {
          await navigator.clipboard.writeText(sharePayload.url);
          console.log('✅ handleShare: Fallback to clipboard succeeded');
          showToast.success('Link kopiert!', 'Der Link wurde in die Zwischenablage kopiert');
          triggerHaptic('success');
          return;
        } catch (clipboardError) {
          console.error('❌ handleShare: Clipboard fallback also failed', clipboardError);
        }
      }
      
      console.error("❌ handleShare: Error", error);
      showToast.error('Teilen fehlgeschlagen', 'Der Link konnte nicht geteilt werden');
      triggerHaptic('error');
    } finally {
      setIsSharing(false);
    }
  }, [drop, selectedVariant, triggerHaptic, isSharing]);

  // Check if any selected variant requires invite
  const canPreorder = useMemo(() => {
    if (selectedVariants.size === 0 || !drop) return false;
    const selectedVariantsList = Array.from(selectedVariants);
    const requiresInvite = selectedVariantsList.some(variantId => {
      const variant = drop.variants.find(v => v.id === variantId);
      return variant?.inviteRequired;
    });
    const totalReferrals = invite?.totalReferrals ?? 0;
    return !requiresInvite || totalReferrals >= 1;
  }, [selectedVariants, drop, invite?.totalReferrals]);
  const isFree = selectedVariant?.basePrice === 0;
  const isVip = drop?.badge === 'VIP' || selectedVariant?.gate?.mode === 'vip';
  const isLimited = drop?.badge === 'Limitiert' || selectedVariant?.gate?.mode === 'waitlist';

  const getAccessIcon = (access: string) => {
    switch (access) {
      case 'vip': return <Crown className="h-4 w-4" />;
      case 'limited': return <Flame className="h-4 w-4" />;
      case 'free': return <Sparkles className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  if (!drop) return null;

  return (
    <>
      <Dialog.Root open={!!drop} onOpenChange={() => closeDrop()}>
        <Dialog.Portal>
          {/* 🎯 Premium Overlay mit animiertem Gradient - Enhanced Multi-Layer */}
          <Dialog.Overlay 
            className={cn(
              "fixed inset-0 z-50 transition-all duration-700 ease-out",
              "bg-gradient-to-br from-black/96 via-slate-900/96 to-black/96",
              "backdrop-blur-2xl",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#0BF7BC]/8 before:via-transparent before:to-orange-500/8",
              "before:animate-pulse",
              "after:absolute after:inset-0 after:bg-gradient-to-tr after:from-transparent after:via-cyan-500/5 after:to-transparent",
              "after:animate-pulse",
              showDropSmartCartConfirmation ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
            )}
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(11, 247, 188, 0.05) 0%, rgba(255, 165, 0, 0.02) 30%, rgba(0, 0, 0, 0.96) 70%)'
            }}
          />
          
          {/* 🎯 Glowing Border Effect außerhalb - Multi-Layer System - Enhanced */}
          <div 
            className={cn(
              "fixed inset-0 z-[49] pointer-events-none transition-opacity duration-700",
              "bg-gradient-to-r from-[#0BF7BC]/25 via-orange-500/25 to-[#0BF7BC]/25",
              "animate-pulse",
              showDropSmartCartConfirmation ? "opacity-0" : "opacity-100"
            )}
            style={{
              clipPath: 'inset(0% 10% 10% 10% round 2rem)',
              filter: 'blur(70px)',
              animation: 'pulse-glow 3s ease-in-out infinite'
            }}
          />

          {/* 🎯 Additional Outer Glow Layer - Enhanced Premium */}
          <div 
            className={cn(
              "fixed inset-0 z-[48] pointer-events-none transition-opacity duration-700",
              "bg-gradient-to-br from-[#0BF7BC]/15 via-transparent to-orange-500/15",
              showDropSmartCartConfirmation ? "opacity-0" : "opacity-100"
            )}
            style={{
              filter: 'blur(110px)',
              transform: 'scale(1.18)'
            }}
          />

          {/* 🎯 Third Glow Layer für mehr Tiefe - Enhanced */}
          <div 
            className={cn(
              "fixed inset-0 z-[47] pointer-events-none transition-opacity duration-700",
              "bg-gradient-to-tr from-cyan-500/8 via-transparent to-orange-500/8",
              showDropSmartCartConfirmation ? "opacity-0" : "opacity-100"
            )}
            style={{
              filter: 'blur(130px)',
              transform: 'scale(1.25)'
            }}
          />

          {/* 🎯 Fourth Glow Layer - Subtle Depth */}
          <div 
            className={cn(
              "fixed inset-0 z-[46] pointer-events-none transition-opacity duration-700",
              "bg-gradient-to-br from-[#0BF7BC]/5 via-transparent to-orange-500/5",
              showDropSmartCartConfirmation ? "opacity-0" : "opacity-100"
            )}
            style={{
              filter: 'blur(150px)',
              transform: 'scale(1.3)'
            }}
          />
          
          <Dialog.Content 
            className={cn(
              "fixed inset-0 z-50 flex flex-col md:items-center md:justify-center md:p-6",
              "transition-all duration-700 ease-out",
              showDropSmartCartConfirmation ? "pointer-events-none opacity-0 scale-95" : "pointer-events-auto opacity-100 scale-100"
            )}
            aria-describedby="drop-modal-description"
          >
            <Dialog.Title className="sr-only">{drop.name}</Dialog.Title>
            <Dialog.Description id="drop-modal-description" className="sr-only">
              Wähle deine gewünschten Sorten und Mengen aus
            </Dialog.Description>
            
            {/* 🎯 Live Countdown - Sichtbar von außen auf Modal - Premium Design - Mit Fallback */}
            {shouldShowCountdown && dropDeadline && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] animate-[fadeIn_0.5s_ease-out] pointer-events-none">
                {/* 🎯 Mobile: Kompakt */}
                <div className="md:hidden">
                  <DropCountdown 
                    deadlineAt={dropDeadline} 
                    countdownType={drop.countdownType || (dropDeadline ? (() => {
                      const daysLeft = Math.ceil((new Date(dropDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return daysLeft <= 7 ? "short" : "extended";
                    })() : "short")}
                    variant="mobile"
                    className="bg-black/95 backdrop-blur-xl border-2 border-white/40 shadow-[0_0_30px_rgba(11,247,188,0.6),0_0_60px_rgba(11,247,188,0.4)] px-4 py-2 rounded-xl font-bold"
                  />
                </div>
                {/* 🎯 Desktop: Ausführlich */}
                <div className="hidden md:block">
                  <DropCountdown 
                    deadlineAt={dropDeadline} 
                    countdownType={drop.countdownType || (dropDeadline ? (() => {
                      const daysLeft = Math.ceil((new Date(dropDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return daysLeft <= 7 ? "short" : "extended";
                    })() : "short")}
                    variant="desktop"
                    className="bg-black/95 backdrop-blur-xl border-2 border-white/40 shadow-[0_0_40px_rgba(11,247,188,0.5),0_0_80px_rgba(11,247,188,0.3)] px-6 py-4 rounded-xl font-bold"
                  />
                </div>
              </div>
            )}

            {/* 🎯 Premium Modal Container mit Glow & Shadow */}
            <div className={cn(
              "flex-1 md:flex-none w-full md:max-w-5xl md:max-h-[92vh]",
              "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95",
              "rounded-3xl md:rounded-3xl",
              "border-2 border-slate-700/80",
              "shadow-[0_0_80px_rgba(11,247,188,0.15),0_20px_60px_rgba(0,0,0,0.8)]",
              "backdrop-blur-2xl",
              "flex flex-col safe-area-inset",
              "relative",
              "animate-slide-up md:animate-scale-in",
              "before:absolute before:inset-0 before:rounded-3xl",
              "before:bg-gradient-to-br before:from-[#0BF7BC]/10 before:via-transparent before:to-orange-500/10",
              "before:opacity-0 before:transition-opacity before:duration-500",
              "hover:before:opacity-100",
              "after:absolute after:inset-[2px] after:rounded-[22px]",
              "after:bg-gradient-to-br after:from-slate-900 after:to-slate-800",
              "after:z-[-1]"
            )}
            style={{
              boxShadow: '0 0 120px rgba(11, 247, 188, 0.15), 0 0 60px rgba(255, 165, 0, 0.1), 0 30px 80px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(0, 0, 0, 0.3)'
            }}>
              {/* 🎯 Mobile Header - Sticky with Better Spacing - Fixed */}
              <div className="flex-shrink-0">
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 pb-3 border-b border-slate-700/80 md:hidden bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl safe-area-top shadow-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">{getAccessIcon(drop.badge)}</div>
                  <span className="text-base font-bold text-white truncate">{drop.name}</span>
                </div>
                <Dialog.Close 
                  className={cn(
                    "p-2.5 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35",
                    "text-white transition-all duration-200 touch-target",
                    "min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 ml-2",
                    "shadow-lg hover:scale-110 active:scale-95"
                  )}
                  onClick={() => triggerHaptic('light')}
                >
                  <X className="h-5 w-5" />
                </Dialog.Close>
                </div>

                {/* 🎯 Desktop Header - Fixed */}
                <div className="hidden md:flex items-center justify-between p-6 border-b border-slate-700/80 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">{getAccessIcon(drop.badge)}</div>
                  <h2 className="text-3xl font-bold text-white">{drop.name}</h2>
                  <Badge variant={isVip ? "accent" : isLimited ? "accent" : isFree ? "accent" : "primary"}>{drop.badge}</Badge>
                </div>
                <Dialog.Close 
                  className={cn(
                    "p-3 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30",
                    "text-white transition-all duration-200",
                    "shadow-lg hover:scale-110 active:scale-95",
                    "min-w-[44px] min-h-[44px] flex items-center justify-center"
                  )}
                  onClick={() => triggerHaptic('light')}
                >
                  <X className="h-6 w-6" />
                </Dialog.Close>
                </div>

                {/* 🎯 Mobile Navigation - Fixed */}
                <div className="sticky top-[57px] z-10 flex md:hidden border-b border-slate-700/80 bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl safe-area-top shadow-md">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveSection('hero');
                  }}
                  className={cn(
                    "flex-1 py-3.5 px-4 text-sm font-bold transition-all duration-200 touch-target min-h-[48px] relative",
                    "active:scale-[0.98]",
                    activeSection === 'hero' 
                      ? "text-orange-400 border-b-2 border-orange-400 bg-gradient-to-b from-orange-400/15 to-transparent shadow-sm" 
                      : "text-slate-400 active:text-white active:bg-white/10"
                  )}
                >
                  Produkt
                  {activeSection === 'hero' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-lg shadow-orange-400/50" />
                  )}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveSection('variants');
                  }}
                  className={cn(
                    "flex-1 py-3.5 px-4 text-sm font-bold transition-all duration-200 touch-target min-h-[48px] relative",
                    "active:scale-[0.98]",
                    activeSection === 'variants' 
                      ? "text-orange-400 border-b-2 border-orange-400 bg-gradient-to-b from-orange-400/15 to-transparent shadow-sm" 
                      : "text-slate-400 active:text-white active:bg-white/10"
                  )}
                >
                  Sorten
                  {activeSection === 'variants' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-lg shadow-orange-400/50" />
                  )}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveSection('preorder');
                  }}
                  className={cn(
                    "flex-1 py-3.5 px-4 text-sm font-bold transition-all duration-200 touch-target min-h-[48px] relative",
                    "active:scale-[0.98]",
                    activeSection === 'preorder' 
                      ? "text-orange-400 border-b-2 border-orange-400 bg-gradient-to-b from-orange-400/15 to-transparent shadow-sm" 
                      : "text-slate-400 active:text-white active:bg-white/10"
                  )}
                >
                  Bestellen
                  {activeSection === 'preorder' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-lg shadow-orange-400/50" />
                    )}
                  </button>
                </div>
              </div>

              {/* 🎯 Content - Scrollable Area */}
              <div 
                className="flex-1 overflow-y-auto overflow-x-hidden safe-area-bottom pb-safe overscroll-contain min-h-0 relative" 
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
                onScroll={(e) => {
                  // Optional: Track scroll position for analytics or UI enhancements
                  const target = e.currentTarget;
                  const scrollProgress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
                  // Could use this for scroll indicators
                }}
              >
                {/* 🎯 Scroll Progress Indicator - Top */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0BF7BC]/50 to-transparent opacity-0 transition-opacity duration-300 pointer-events-none z-50" />
                {/* 🎯 Hero Section - Always visible, first scrollable element */}
                <div className={cn(
                  "p-4 md:p-6",
                  activeSection !== 'hero' && window.innerWidth < 768 && "hidden"
                )}>
                    <div className="grid gap-6 md:grid-cols-2">
                      
                      {/* 🎯 Product Image */}
                      <div className="space-y-4">
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 group/image shadow-2xl border border-slate-700/50 hover:border-[#0BF7BC]/30 transition-all duration-500">
                          {selectedVariant?.media?.[0] && (
                            <>
                              <ProductImage
                                src={selectedVariant.media[0].url}
                                alt={selectedVariant.media[0].alt}
                                fallbackColor={selectedVariant.media[0].dominantColor ?? "#0BF7BC"}
                                overlayLabel={selectedVariant.label}
                                aspectRatio="1 / 1"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-110 group-hover/image:brightness-110"
                              />
                              {/* 🎯 Image Glow Effect on Hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0BF7BC]/10 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </>
                          )}
                          
                          {/* 🎯 Status Badges - Enhanced with animations */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
                            {isFree && (
                              <div className="flex items-center gap-1 bg-green-500/20 backdrop-blur-sm text-green-400 px-2 py-1 rounded-full text-xs font-bold border border-green-400/30 shadow-lg shadow-green-500/20 animate-[fadeIn_0.5s_ease-out] hover:scale-110 transition-transform duration-200">
                                <Sparkles className="h-3 w-3 animate-pulse" />
                                GRATIS
                              </div>
                            )}
                            {isVip && (
                              <div className="flex items-center gap-1 bg-purple-500/20 backdrop-blur-sm text-purple-400 px-2 py-1 rounded-full text-xs font-bold border border-purple-400/30 shadow-lg shadow-purple-500/20 animate-[fadeIn_0.5s_ease-out] hover:scale-110 transition-transform duration-200">
                                <Crown className="h-3 w-3" />
                                VIP
                              </div>
                            )}
                            {isLimited && (
                              <div className="flex items-center gap-1 bg-orange-500/20 backdrop-blur-sm text-orange-400 px-2 py-1 rounded-full text-xs font-bold border border-orange-400/30 shadow-lg shadow-orange-500/20 animate-[fadeIn_0.5s_ease-out] hover:scale-110 transition-transform duration-200">
                                <Flame className="h-3 w-3 animate-pulse" />
                                LIMITED
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 🎯 Product Info */}
                        <div className="space-y-3">
                          <h3 className="text-xl font-bold text-white">{selectedVariant?.label}</h3>
                          <p className="text-slate-300 text-sm">{selectedVariant?.description}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span>Geschmack: {selectedVariant?.flavor}</span>
                            <span>•</span>
                            <span>Min: {selectedVariant?.minQuantity ?? 1}</span>
                            <span>•</span>
                            <span>Max: {selectedVariant?.maxQuantity ?? 10}</span>
                          </div>
                        </div>
                      </div>

                      {/* 🎯 Product Details */}
                      <div className="space-y-6">
                        {/* 🎯 Preorder Info - Prominent */}
                        {drop.minimumOrders !== undefined && drop.preorderStatus && (
                          <PreorderInfo
                            minimumOrders={drop.minimumOrders}
                            currentOrders={drop.currentOrders ?? 0}
                            preorderStatus={drop.preorderStatus}
                            preorderDeadline={drop.preorderDeadline}
                          />
                        )}
                        
                        {/* 🎯 Price - Enhanced */}
                        <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-[#0BF7BC]/30 hover:shadow-lg hover:shadow-[#0BF7BC]/10 transition-all duration-300">
                          {/* 🎯 Price Label - Premium */}
                          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#0BF7BC]/20 to-cyan-500/20 border border-[#0BF7BC]/30">
                              <Star className="h-3.5 w-3.5 text-[#0BF7BC]" />
                            </div>
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                              Preis von diesem Produkt
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-4xl font-black text-white drop-shadow-lg">
                              {formatPrice(selectedVariant?.basePrice ?? 0, drop.currency ?? "EUR")}
                            </span>
                            {selectedVariant?.priceCompareAt && (
                              <>
                                <span className="text-xl text-slate-500 line-through font-medium">
                                  {formatPrice(selectedVariant.priceCompareAt, drop.currency ?? "EUR")}
                                </span>
                                <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm font-bold border border-green-500/40">
                                  -{Math.round((1 - (selectedVariant.basePrice / selectedVariant.priceCompareAt)) * 100)}%
                                </span>
                              </>
                            )}
                          </div>
                          {isFree && (
                            <p className="text-sm text-green-400 font-semibold flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              Kostenloser Zugang - Invite erforderlich
                            </p>
                          )}
                        </div>

                        {/* 🎯 Progress - Enhanced with animation */}
                        <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-orange-400/30 transition-all duration-300">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300 font-medium">Fortschritt</span>
                            <span className="text-white font-bold text-lg tabular-nums">
                              {(() => {
                                // 🎯 Bruchzahl: currentOrders/minimumOrders
                                if (drop.minimumOrders !== undefined) {
                                  const current = drop.currentOrders ?? 0;
                                  return `${current}/${drop.minimumOrders}`;
                                }
                                // Fallback: Berechne aus progress (0-1) wenn keine Preorder-Daten
                                // Typische minimumOrders: 10, 15, 20
                                // Berechne: current = progress * minimum, wähle typisches minimum
                                const progressPercent = drop.progress * 100;
                                // Wähle ein typisches minimum (10, 15, 20) basierend auf progress
                                let estimatedMinimum = 10;
                                if (progressPercent > 0) {
                                  // Versuche ein sinnvolles Verhältnis zu finden
                                  // z.B. 23% könnte 3/13 ≈ 23%, oder 5/22 ≈ 23% sein
                                  // Vereinfacht: nimm 10, 15 oder 20 als minimum
                                  const commonMinimums = [10, 15, 20];
                                  // Finde das beste passende minimum
                                  estimatedMinimum = commonMinimums.find(min => {
                                    const current = Math.round(progressPercent / 100 * min);
                                    const calcProgress = (current / min) * 100;
                                    return Math.abs(calcProgress - progressPercent) < 5; // max 5% Abweichung
                                  }) || 10;
                                }
                                const estimatedCurrent = Math.round(progressPercent / 100 * estimatedMinimum);
                                return `${estimatedCurrent}/${estimatedMinimum}`;
                              })()}
                            </span>
                          </div>
                          <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden shadow-inner relative">
                            <div 
                              className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-orange-500/50 relative overflow-hidden"
                              style={{ width: `${drop.progress * 100}%` }}
                            >
                              {/* 🎯 Shimmer effect for progress */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite] translate-x-[-100%]" 
                                style={{ 
                                  animation: 'shimmer 2s ease-in-out infinite',
                                  transform: `translateX(${drop.progress * 100}%)`
                                }}
                              />
                            </div>
                          </div>

                          {/* 🎯 Premium Countdown - UX Owner Level - Unter Fortschritt - Mobile & Desktop Responsive - Mit Fallback */}
                          {shouldShowCountdown && dropDeadline && (
                            <div className="pt-4 mt-4 border-t border-white/10 animate-[fadeIn_0.5s_ease-out]">
                              {/* Label mit Icon - Premium Design */}
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/25 to-orange-600/25 border border-orange-400/40 shadow-lg shadow-orange-500/20 animate-pulse">
                                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                                </div>
                                <span className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-wide">
                                  Zeit bis Drop endet
                                </span>
                              </div>
                              
                              {/* 🎯 Mobile Countdown - Kompakt - Premium Design */}
                              <div className="md:hidden">
                                <div className="bg-gradient-to-br from-orange-500/20 via-orange-600/20 to-orange-500/20 rounded-xl p-3.5 border-2 border-orange-400/40 backdrop-blur-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-300">
                                  <div className="flex justify-center">
                                    <DropCountdown
                                      deadlineAt={dropDeadline}
                                      countdownType={drop.countdownType || (dropDeadline ? (() => {
                                        const daysLeft = Math.ceil((new Date(dropDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        return daysLeft <= 7 ? "short" : "extended";
                                      })() : "short")}
                                      variant="mobile"
                                      className="justify-center bg-transparent border-0 shadow-none font-bold text-sm"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* 🎯 Desktop Countdown - Ausführlich - Premium Design */}
                              <div className="hidden md:block">
                                <div className="bg-gradient-to-br from-orange-500/20 via-orange-600/20 to-orange-500/20 rounded-xl p-5 border-2 border-orange-400/40 backdrop-blur-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-300">
                                  <div className="flex justify-center">
                                    <DropCountdown
                                      deadlineAt={dropDeadline}
                                      countdownType={drop.countdownType || (dropDeadline ? (() => {
                                        const daysLeft = Math.ceil((new Date(dropDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        return daysLeft <= 7 ? "short" : "extended";
                                      })() : "short")}
                                      variant="desktop"
                                      className="w-full max-w-none justify-center bg-transparent border-0 shadow-none text-lg md:text-xl font-bold"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 🎯 Actions */}
                        <div className="space-y-3">
                          <button
                            onClick={(e) => handleInterest(e)}
                            disabled={!drop || isTogglingInterest}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all duration-300",
                              "min-h-[48px] touch-target relative overflow-hidden",
                              "hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#0BF7BC] focus:ring-offset-2 focus:ring-offset-slate-900",
                              isInterested
                                ? "bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 border-2 border-orange-400/60 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
                                : "bg-white/10 text-white hover:bg-white/20 border-2 border-white/30 hover:border-white/50 hover:shadow-lg hover:shadow-white/10",
                              isTogglingInterest && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            {/* 🎯 Ripple effect on click */}
                            <span className="absolute inset-0 bg-white/10 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
                            {isTogglingInterest ? (
                              <>
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span>Wird aktualisiert...</span>
                              </>
                            ) : (
                              <>
                                <Heart className={cn("h-5 w-5 transition-all relative z-10", isInterested && "fill-current scale-110 animate-[pulse_0.6s_ease-in-out]")} />
                                <span className="relative z-10">{isInterested ? "Interessiert" : "Interesse zeigen"}</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={(e) => handleShare(e)}
                            disabled={!drop || isSharing}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all duration-300",
                              "min-h-[48px] touch-target relative overflow-hidden",
                              "bg-white/10 text-white hover:bg-white/20 border-2 border-white/30 hover:border-white/50",
                              "hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-white/10",
                              "focus:outline-none focus:ring-2 focus:ring-[#0BF7BC] focus:ring-offset-2 focus:ring-offset-slate-900",
                              isSharing && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            {/* 🎯 Ripple effect */}
                            <span className="absolute inset-0 bg-white/10 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
                            {isSharing ? (
                              <>
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin relative z-10" />
                                <span className="relative z-10">Wird geteilt...</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="h-5 w-5 relative z-10" />
                                <span className="relative z-10">Teilen</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                </div>

                {/* 🎯 Variants Section */}
                <div className={cn(
                  "p-4 md:p-6 border-t border-slate-700",
                  activeSection !== 'variants' && window.innerWidth < 768 && "hidden"
                )}>
                  <div className="space-y-4">
                      {/* 🎯 Header with Search and Controls */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white">Verfügbare Sorten</h3>
                          <div className="flex items-center gap-2">
                            {/* View Mode Toggle (Desktop only) */}
                            {window.innerWidth >= 768 && (
                              <>
                                <button
                                  onClick={() => {
                                    triggerHaptic('light');
                                    setViewMode('grid');
                                  }}
                                  className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    viewMode === 'grid'
                                      ? "bg-[#0BF7BC]/20 text-[#0BF7BC]"
                                      : "bg-white/10 text-slate-400 hover:text-white"
                                  )}
                                  aria-label="Grid-Ansicht"
                                >
                                  <Grid3x3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    triggerHaptic('light');
                                    setViewMode('list');
                                  }}
                                  className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    viewMode === 'list'
                                      ? "bg-[#0BF7BC]/20 text-[#0BF7BC]"
                                      : "bg-white/10 text-slate-400 hover:text-white"
                                  )}
                                  aria-label="Liste-Ansicht"
                                >
                                  <List className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* 🎯 Search Bar */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Sorten suchen..."
                            value={variantSearchQuery}
                            onChange={(e) => setVariantSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0BF7BC] focus:border-[#0BF7BC] transition-all"
                          />
                        </div>
                        
                        {/* 🎯 Filter and Sort Bar */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Bulk Select Button */}
                          <button
                            onClick={handleSelectAll}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target min-h-[44px]",
                              selectedVariants.size === filteredAndSortedVariants.length && filteredAndSortedVariants.length > 0
                                ? "bg-[#0BF7BC]/20 text-[#0BF7BC] border border-[#0BF7BC]/40"
                                : "bg-white/10 text-slate-300 hover:bg-white/20 border border-slate-600"
                            )}
                          >
                            {selectedVariants.size === filteredAndSortedVariants.length && filteredAndSortedVariants.length > 0 ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">
                              {selectedVariants.size === filteredAndSortedVariants.length && filteredAndSortedVariants.length > 0 ? 'Alle abwählen' : 'Alle auswählen'}
                            </span>
                          </button>
                          
                          {/* Filter Dropdown */}
                          <div className="relative flex-1 min-w-[120px]">
                            <button
                              onClick={() => {
                                triggerHaptic('light');
                                setShowFilterMenu(!showFilterMenu);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 border-2 border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm font-medium touch-target min-h-[44px] hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <Filter className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                {variantFilter === 'all' ? 'Alle' : 
                                 variantFilter === 'available' ? 'Verfügbar' :
                                 variantFilter === 'invite-required' ? 'Invite' : 'Wenig Lager'}
                              </span>
                            </button>
                            
                            {showFilterMenu && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setShowFilterMenu(false)}
                                />
                                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden">
                                  {[
                                    { value: 'all', label: 'Alle Sorten' },
                                    { value: 'available', label: 'Verfügbar' },
                                    { value: 'low-stock', label: 'Wenig Lager' },
                                    { value: 'invite-required', label: 'Invite erforderlich' }
                                  ].map((filter) => (
                                    <button
                                      key={filter.value}
                                      onClick={() => {
                                        triggerHaptic('light');
                                        setVariantFilter(filter.value as any);
                                        setShowFilterMenu(false);
                                      }}
                                      className={cn(
                                        "w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2",
                                        variantFilter === filter.value
                                          ? "bg-[#0BF7BC]/20 text-[#0BF7BC]"
                                          : "text-slate-300 hover:bg-white/10"
                                      )}
                                    >
                                      {variantFilter === filter.value && (
                                        <Check className="h-4 w-4" />
                                      )}
                                      <span>{filter.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Sort Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                triggerHaptic('light');
                                const sortOptions: typeof variantSort[] = ['price-asc', 'price-desc', 'name-asc', 'stock-desc'];
                                const currentIndex = sortOptions.indexOf(variantSort);
                                const nextIndex = (currentIndex + 1) % sortOptions.length;
                                setVariantSort(sortOptions[nextIndex]);
                              }}
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 border-2 border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm font-medium touch-target min-h-[44px] hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <ArrowUpDown className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                {variantSort === 'price-asc' ? 'Preis ↑' :
                                 variantSort === 'price-desc' ? 'Preis ↓' :
                                 variantSort === 'name-asc' ? 'Name A-Z' : 'Lager ↓'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* 🎯 Variants Grid/List */}
                      <div className={cn(
                        viewMode === 'grid'
                          ? "grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                          : "flex flex-col gap-3"
                      )}>
                        {filteredAndSortedVariants.length === 0 ? (
                          <div className="col-span-full py-12 text-center">
                            <Search className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">Keine Sorten gefunden</p>
                            <p className="text-slate-500 text-sm mt-2">Versuche andere Suchbegriffe oder Filter</p>
                          </div>
                        ) : (
                          filteredAndSortedVariants.map((variant) => (
                            <button
                              key={variant.id}
                              onClick={() => {
                                triggerHaptic('medium');
                                handleVariantSelect(variant.id);
                              }}
                              className={cn(
                                "rounded-2xl border-2 transition-all duration-300 text-left relative focus:outline-none focus:ring-2 focus:ring-[#0BF7BC] focus:ring-offset-2 focus:ring-offset-slate-900 group touch-target",
                                viewMode === 'grid'
                                  ? "p-4 min-h-[180px] flex flex-col hover:scale-105 active:scale-[0.98]"
                                  : "p-4 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] min-h-[64px]",
                                selectedVariants.has(variant.id)
                                  ? "border-[#0BF7BC] bg-gradient-to-br from-[#0BF7BC]/25 to-cyan-500/15 shadow-2xl shadow-[#0BF7BC]/40 ring-2 ring-[#0BF7BC]/30"
                                  : "border-slate-600 bg-slate-800/50 hover:border-[#0BF7BC]/60 hover:shadow-xl hover:shadow-[#0BF7BC]/20 hover:bg-slate-800/70"
                              )}
                              aria-pressed={selectedVariants.has(variant.id)}
                              aria-label={`${variant.label} ${selectedVariants.has(variant.id) ? 'abwählen' : 'auswählen'}`}
                            >
                              {/* Selected Indicator */}
                              {selectedVariants.has(variant.id) && (
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center z-10 shadow-lg shadow-orange-500/50 ring-2 ring-orange-400/30">
                                  <Check className="h-5 w-5 text-white" />
                                </div>
                              )}
                              
                              {/* Variant Image (if available) */}
                              {variant.media?.[0] && viewMode === 'grid' && (
                                <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-slate-700 to-slate-800">
                                  <ProductImage
                                    src={variant.media[0].url}
                                    alt={variant.media[0].alt || variant.label}
                                    fallbackColor={variant.media[0].dominantColor ?? "#0BF7BC"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              <div className={cn(
                                "space-y-2 flex-1 flex flex-col",
                                viewMode === 'list' && "flex-row items-center gap-4"
                              )}>
                                <div className={cn(
                                  "flex items-center justify-between",
                                  viewMode === 'list' && "flex-1"
                                )}>
                                  <h4 className="font-semibold text-white text-sm truncate">{variant.label}</h4>
                                  <span className="text-xs font-bold text-orange-400 whitespace-nowrap ml-2">
                                    {formatPrice(variant.basePrice, drop.currency ?? "EUR")}
                                  </span>
                                </div>
                                <p className={cn(
                                  "text-xs text-slate-400",
                                  viewMode === 'grid' ? "line-clamp-2 flex-1" : "line-clamp-1"
                                )}>{variant.description}</p>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 truncate">{variant.flavor}</span>
                                    <span className={cn(
                                      "text-xs font-medium ml-2",
                                      variant.stock > 50 ? "text-green-400" : 
                                      variant.stock > 10 ? "text-yellow-400" : 
                                      variant.stock > 0 ? "text-orange-400" :
                                      "text-red-400"
                                    )}>
                                      {variant.stock > 0 ? `${variant.stock} Stück` : 'Ausverkauft'}
                                    </span>
                                  </div>
                                  {variant.inviteRequired && (
                                    <div className="flex items-center gap-1">
                                      <Crown className="h-3 w-3 text-purple-400" />
                                      <span className="text-xs text-purple-400">Invite erforderlich</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      
                      {/* 🎯 Results Summary */}
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-slate-400">
                          {filteredAndSortedVariants.length} {filteredAndSortedVariants.length === 1 ? 'Sorte' : 'Sorten'} gefunden
                          {variantSearchQuery && ` für "${variantSearchQuery}"`}
                        </p>
                        {selectedVariants.size > 0 && (
                          <p className="text-[#0BF7BC] font-semibold">
                            {selectedVariants.size} {selectedVariants.size === 1 ? 'Sorte' : 'Sorten'} ausgewählt
                          </p>
                        )}
                      </div>
                    </div>
                </div>

                {/* 🎯 Preorder Section */}
                <div className={cn(
                  "p-4 md:p-6 border-t border-slate-700",
                  activeSection !== 'preorder' && window.innerWidth < 768 && "hidden"
                )}>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Bestellen</h3>
                        {selectedVariants.size > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0BF7BC]/20 border border-[#0BF7BC]/40">
                            <span className="text-[#0BF7BC] text-sm font-semibold">
                              {selectedVariants.size} {selectedVariants.size === 1 ? 'Sorte' : 'Sorten'} ausgewählt
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* 🎯 Individual Variant Quantities with QuantityControl */}
                      {selectedVariants.size > 0 && (
                        <div className="space-y-4">
                          <label className="text-sm font-medium text-slate-300">Mengen pro Sorte</label>
                          <div className="space-y-4">
                            {Array.from(selectedVariants).map(variantId => {
                              const variant = drop?.variants.find(v => v.id === variantId);
                              if (!variant) return null;
                              
                              const quantity = variantQuantities[variantId] ?? 1;
                              const minQty = variant.minQuantity ?? 1;
                              const maxQty = Math.min(variant.maxQuantity ?? 10, variant.stock);
                              
                              return (
                                <div key={variantId} className="p-4 rounded-xl bg-slate-800/30 border border-slate-600 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="text-sm font-semibold text-white mb-1">{variant.label}</h4>
                                      <p className="text-xs text-slate-400">{variant.flavor} • {variant.stock} verfügbar</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-[#0BF7BC]">
                                        {formatPrice(variant.basePrice * quantity, drop.currency ?? "EUR")}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {formatPrice(variant.basePrice, drop.currency ?? "EUR")} pro Stück
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* 🎯 QuantityControl Component */}
                                  <QuantityControl
                                    value={quantity}
                                    min={minQty}
                                    max={maxQty}
                                    onChange={(newQty) => handleVariantQuantityChange(variantId, newQty)}
                                    showSlider={maxQty > 5}
                                    showPresets={maxQty >= 5}
                                    presets={[1, 3, 5, Math.min(10, maxQty)].filter(p => p <= maxQty)}
                                    size="md"
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600">
                            <p className="text-sm text-slate-300 font-medium">
                              Gesamt: <span className="text-[#0BF7BC] font-bold">
                                {Object.values(variantQuantities).reduce((sum, qty) => sum + qty, 0)} Stück
                              </span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 🎯 Total Price - MEGA GEIL */}
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0BF7BC]/20 via-cyan-500/10 to-blue-500/20 border-2 border-[#0BF7BC]/30 backdrop-blur-xl relative overflow-hidden">
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0BF7BC]/5 via-cyan-400/10 to-[#0BF7BC]/5 animate-pulse" />
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg text-white font-semibold">💰 Gesamtpreis</span>
                            <div className="text-right">
                              <div className="text-4xl font-black text-[#0BF7BC] drop-shadow-[0_0_10px_rgba(11,247,188,0.5)]">
                                {selectedVariants.size > 0 ? formatPrice(totalPrice, drop.currency ?? "EUR") : "0,00 €"}
                              </div>
                              {selectedVariants.size > 1 && (
                                <div className="text-sm text-cyan-300 font-medium mt-1">
                                  {Math.floor(currentQuantity / selectedVariants.size)} Stück pro Sorte
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Savings Indicator */}
                          {selectedVariants.size > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#0BF7BC]/20">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-cyan-200">✨ {selectedVariants.size} Sorten ausgewählt</span>
                                <span className="text-green-400 font-bold">
                                  {Object.values(variantQuantities).reduce((sum, qty) => sum + qty, 0)} Stück gesamt
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 🎯 Add to Cart Button - Like Shop Flow */}
                      <button
                        onClick={handleAddToCart}
                        disabled={!canPreorder || selectedVariants.size === 0 || isProcessingPreorder}
                        className={cn(
                          "w-full flex items-center justify-center gap-3 py-5 px-6 rounded-2xl font-black text-xl transition-all duration-300 relative overflow-hidden group min-h-[56px] touch-target",
                          canPreorder && selectedVariants.size > 0 && !isProcessingPreorder
                            ? "bg-gradient-to-r from-[#0BF7BC] via-cyan-400 to-[#0BF7BC] text-black hover:scale-[1.03] active:scale-[0.97] shadow-2xl shadow-[#0BF7BC]/50 hover:shadow-[#0BF7BC]/70"
                            : "bg-slate-700/50 text-slate-400 cursor-not-allowed border-2 border-slate-600"
                        )}
                        style={{
                          backgroundSize: canPreorder && selectedVariants.size > 0 && !isProcessingPreorder ? '200% 100%' : '100% 100%',
                          animation: canPreorder && selectedVariants.size > 0 && !isProcessingPreorder ? 'gradient-shift 3s ease infinite' : 'none'
                        }}
                      >
                        {/* Glow Effect */}
                        {canPreorder && selectedVariants.size > 0 && !isProcessingPreorder && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                            style={{
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 2s infinite'
                            }}
                          />
                        )}
                        
                        {isProcessingPreorder ? (
                          <>
                            <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin relative z-10" />
                            <span className="relative z-10 font-semibold">Wird hinzugefügt...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className={cn(
                              "h-7 w-7 relative z-10 transition-transform",
                              canPreorder && selectedVariants.size > 0 && "group-hover:scale-110"
                            )} />
                            <span className="relative z-10">
                              {selectedVariants.size === 0 
                                ? "🎯 Wähle deine Sorten!" 
                                : !canPreorder 
                                  ? "🔒 Invite erforderlich" 
                                  : `🛒 In den Warenkorb - ${formatPrice(totalPrice, drop.currency ?? "EUR")}`
                              }
                            </span>
                            {canPreorder && selectedVariants.size > 0 && (
                              <ArrowRight className="h-7 w-7 relative z-10 group-hover:translate-x-1 transition-transform" />
                            )}
                          </>
                        )}
                      </button>

                      {!canPreorder && (
                        <p className="text-sm text-orange-400 text-center">
                          Du benötigst einen aktiven Invite für diese Sorte
                        </p>
                      )}
                    </div>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 🎯 Drop Smart Cart Confirmation - OUTSIDE DIALOG SYSTEM */}
      {showDropSmartCartConfirmation && (
        <DropSmartCartConfirmation
          isOpen={showDropSmartCartConfirmation}
          onClose={() => {
            console.log('❌ Close clicked');
            setShowDropSmartCartConfirmation(false);
          }}
          onContinueShopping={() => {
            console.log('🔄 Continue shopping - closing everything and going back to drops');
            setShowDropSmartCartConfirmation(false);
            closeDrop(); // Close the drop modal, goes back to drops page
            
            // Show confirmation toast
            showToast.success(
              '✅ Im Warenkorb!',
              `${addedItems.length} ${addedItems.length === 1 ? 'Sorte ist' : 'Sorten sind'} jetzt in deinem Warenkorb`
            );
          }}
          onGoToCart={() => {
            console.log('🛒 Going to cart');
            // Close confirmation first
            setShowDropSmartCartConfirmation(false);
            closeDrop(); // Close drop modal
            
            // Show success toast
            showToast.success(
              '🎉 Erfolgreich hinzugefügt!',
              `${addedItems.length} ${addedItems.length === 1 ? 'Sorte wurde' : 'Sorten wurden'} zum Warenkorb hinzugefügt`
            );
            
            // Open cart AFTER confirmation is closed (longer delay to ensure modal is closed)
            setTimeout(() => {
              console.log('📦 Opening cart now - confirmation closed');
              useGlobalCartStore.getState().openCart();
            }, 800);
          }}
          onGoToCheckout={() => {
            console.log('✅ Going to checkout');
            setShowDropSmartCartConfirmation(false);
            closeDrop(); // Close drop modal first
            
            // Show success toast
            showToast.success(
              '🎉 Erfolgreich hinzugefügt!',
              `${addedItems.length} ${addedItems.length === 1 ? 'Sorte wurde' : 'Sorten wurden'} zum Warenkorb hinzugefügt`
            );
            
            // Navigate to checkout - DO NOT open cart modal!
            setTimeout(() => {
              console.log('🛒 Navigating to checkout');
              window.location.href = '/checkout';
            }, 300);
          }}
          addedItems={addedItems}
          totalAddedPrice={totalAddedPrice}
          cartTotal={useGlobalCartStore.getState().totalPrice}
          freeShippingThreshold={50}
          dropName={drop?.name ?? ''}
          dropImage={selectedVariant?.media?.[0]?.url}
        />
      )}

      {showReservationToast && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
          <div className="flex items-center gap-3 p-4 bg-green-500/20 border border-green-400/40 rounded-xl backdrop-blur-sm">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <div>
              <p className="font-semibold text-green-400">Preorder erfolgreich!</p>
              <p className="text-sm text-green-300">Deine Bestellung wurde reserviert</p>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 Invite Required Modal */}
      <InviteRequiredModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSuccess={() => {
          setShowInviteModal(false);
          // Optionally trigger a refresh or update
        }}
        dropName={drop?.name}
      />
    </>
  );
};
