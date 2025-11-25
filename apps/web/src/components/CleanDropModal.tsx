import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Minus,
  Plus,
  Truck,
  Heart,
  Share2,
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";
import { useDropsStore, useSelectedDrop } from "../store/drops";
import { useShopStore } from "../store/shop";
import { useUserInterestsStore } from "../store/userInterests";
import { Badge } from "./Badge";
import { ProductImage } from "./media/ProductImage";
import { PreorderConfirmationModal } from "./PreorderConfirmationModal";
import { formatCurrency } from "../utils/currency";
import { DropSmartCartConfirmation } from "./drops/DropSmartCartConfirmation";
import { getDynamicDeliveryTime, getPrimaryDeliveryOrigin, getSimplifiedOriginLabel } from "../utils/deliveryTimes";
import { useGlobalCartStore } from "../store/globalCart";
import { checkoutSingleVariant } from "../utils/checkoutDrop";
import { hasDropAccess } from "../utils/inviteAccess";
import { showToast } from "../store/toast";

const formatPrice = (value: number, currency: string) =>
  formatCurrency(value, "de-DE", currency);

export const CleanDropModal = () => {
  const navigate = useNavigate();
  const [showReservationToast, setShowReservationToast] = useState(false);
  const [showPreorderConfirmation, setShowPreorderConfirmation] = useState(false);
  const [isProcessingPreorder, setIsProcessingPreorder] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showDropSmartCartConfirmation, setShowDropSmartCartConfirmation] = useState(false);
  const [addedItems, setAddedItems] = useState<Array<{ variantLabel: string; quantity: number; price: number }>>([]);
  const [totalAddedPrice, setTotalAddedPrice] = useState(0);

  const selected = useSelectedDrop();
  const drop = selected?.drop;
  const selection = selected?.selection;
  const lastReservation = selected?.lastReservation;
  const { invite } = useShopStore();

  const {
    closeDrop,
    setVariant,
    setQuantity,
    incrementQuantity,
    startPreorder,
    clearReservation,
    toggleInterest
  } = useDropsStore((state) => ({
    closeDrop: state.closeDrop,
    setVariant: state.setVariant,
    setQuantity: state.setQuantity,
    incrementQuantity: state.incrementQuantity,
    startPreorder: state.startPreorder,
    clearReservation: state.clearReservation,
    toggleInterest: state.toggleInterest
  }));

  const mediaList = selection?.variant.media ?? [];
  const heroMedia = useMemo(() => {
    if (!mediaList.length) return null;
    return mediaList[0];
  }, [mediaList]);

  const quantity = selection?.quantity ?? 1;
  const minQuantity = selection?.minQuantity ?? 1;
  const maxQuantity = selection?.maxQuantity ?? minQuantity;
  const unitPrice = selection?.variant.basePrice ?? 0;
  const currency = drop?.currency ?? "EUR";
  const subtotal = unitPrice * quantity;
  const total = subtotal;
  const isWaitlistOnly = selection?.variant.gate?.mode === "waitlist";
  const inviteRequired = selection?.variant.inviteRequired ?? drop?.inviteRequired;
  const canPreorder = hasDropAccess(invite as any, !!inviteRequired);

  useEffect(() => {
    setShowPreorderConfirmation(false);
    clearReservation();
  }, [drop?.id, clearReservation]);

  // Scroll Progress Tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInterested = () => {
    if (!drop) return;
    toggleInterest(drop.id);
    // Sync with userInterestsStore
    const { toggleDropInterest } = useUserInterestsStore.getState();
    toggleDropInterest(drop.id);
  };

  const handleVariantSelect = (variantId: string) => {
    if (!drop) return;
    setVariant(drop.id, variantId);
  };

  const handleQuantityInput = (value: string) => {
    if (!drop) return;
    if (!value) {
      setQuantity(drop.id, minQuantity);
      return;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    setQuantity(drop.id, parsed);
  };

  const handlePreorder = () => {
    if (!drop) return;
    const reservation = startPreorder(drop.id);
    if (reservation) {
      setShowPreorderConfirmation(true);
    }
  };

  const handleConfirmPreorder = async () => {
    console.log('🎯 handleConfirmPreorder called:', { drop: !!drop, selection: !!selection });
    if (!drop || !selection) return;
    setIsProcessingPreorder(true);
    try {
      const result = await checkoutSingleVariant({
        drop,
        variant: selection.variant as any,
        quantity: selection.quantity ?? 1,
        invite,
        openCart: false // We'll handle cart open via confirmation
      });

      console.log('🛒 checkoutSingleVariant result:', result);

      if (result.ok && result.itemsAdded.length > 0) {
        console.log('✅ Checkout successful, showing confirmation');
        setAddedItems(result.itemsAdded);
        setTotalAddedPrice(result.totalPrice);
        setShowPreorderConfirmation(false);

        setTimeout(() => {
          setShowDropSmartCartConfirmation(true);
          setTimeout(() => {
            closeDrop();
            useGlobalCartStore.getState().openCart();
          }, 1200);
        }, 100);
      } else {
        console.log('❌ Checkout failed:', result);
        showToast.error('Fehler', 'Artikel konnte nicht hinzugefügt werden');
      }
    } catch (error) {
      console.error('❌ Preorder failed:', error);
      showToast.error('Fehler', 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsProcessingPreorder(false);
    }
  };

  const handleCancelPreorder = () => {
    setShowPreorderConfirmation(false);
    clearReservation();
  };

  const handleShare = async () => {
    if (!drop) return;
    const sharePayload = {
      title: drop.name,
      text: `${drop.name} jetzt sichern`,
      url: typeof window !== "undefined" ? window.location.href : undefined
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }
      if (navigator.clipboard?.writeText && sharePayload.url) {
        await navigator.clipboard.writeText(sharePayload.url);
      }
    } catch (error) {
      console.error("share failed", error);
    }
  };

  if (!drop || !selection) return null;

  // Reset confirmation state when modal fully closes
  useEffect(() => {
    if (!drop) {
      setShowDropSmartCartConfirmation(false);
      setAddedItems([]);
      setTotalAddedPrice(0);
    }
  }, [drop]);

  // 🎯 REMOVED: Auto-close timeout - User soll selbst entscheiden!
  // Kein automatisches Schließen mehr - Modal bleibt offen bis User interagiert

  return (
    <>
      <Dialog.Root open={Boolean(drop)} onOpenChange={(open) => {
        if (!open) {
          closeDrop();
          clearReservation();
        }
      }}>
        <Dialog.Portal>
          {/* 🎯 Premium Overlay mit animiertem Gradient - Enhanced Multi-Layer */}
          <Dialog.Overlay 
            className="fixed inset-0 z-50 transition-all duration-700 ease-out bg-gradient-to-br from-black/96 via-slate-900/96 to-black/96 backdrop-blur-2xl before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#0BF7BC]/8 before:via-transparent before:to-orange-500/8 before:animate-pulse after:absolute after:inset-0 after:bg-gradient-to-tr after:from-transparent after:via-cyan-500/5 after:to-transparent after:animate-pulse"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(11, 247, 188, 0.05) 0%, rgba(255, 165, 0, 0.02) 30%, rgba(0, 0, 0, 0.96) 70%)'
            }}
          />
          
          {/* 🎯 Glowing Border Effect außerhalb - Multi-Layer System - Enhanced Premium */}
          <div 
            className="fixed inset-0 z-[49] pointer-events-none bg-gradient-to-r from-[#0BF7BC]/25 via-orange-500/25 to-[#0BF7BC]/25 animate-pulse"
            style={{
              clipPath: 'inset(15% 20% 15% 20% round 2rem)',
              filter: 'blur(70px)',
              animation: 'pulse-glow 3s ease-in-out infinite'
            }}
          />

          {/* 🎯 Additional Outer Glow Layer - Enhanced Premium */}
          <div 
            className="fixed inset-0 z-[48] pointer-events-none bg-gradient-to-br from-[#0BF7BC]/15 via-transparent to-orange-500/15"
            style={{
              filter: 'blur(110px)',
              transform: 'scale(1.18)'
            }}
          />

          {/* 🎯 Third Glow Layer für mehr Tiefe - Enhanced */}
          <div 
            className="fixed inset-0 z-[47] pointer-events-none bg-gradient-to-tr from-cyan-500/8 via-transparent to-orange-500/8"
            style={{
              filter: 'blur(130px)',
              transform: 'scale(1.25)'
            }}
          />

          {/* 🎯 Fourth Glow Layer - Subtle Depth */}
          <div 
            className="fixed inset-0 z-[46] pointer-events-none bg-gradient-to-br from-[#0BF7BC]/5 via-transparent to-orange-500/5"
            style={{
              filter: 'blur(150px)',
              transform: 'scale(1.3)'
            }}
          />
          
          <Dialog.Content className="fixed z-50 mx-auto flex w-full h-full md:max-w-5xl md:h-[92vh] md:top-[4vh] md:left-1/2 md:transform md:-translate-x-1/2 overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 shadow-[0_0_120px_rgba(11,247,188,0.2),0_0_60px_rgba(255,165,0,0.15),0_30px_90px_rgba(0,0,0,0.95)] focus:outline-none md:rounded-3xl border-2 border-slate-700/80 md:border-[#0BF7BC]/20 backdrop-blur-2xl transition-all duration-700 ease-out animate-scale-in relative"
            style={{
              boxShadow: '0 0 140px rgba(11, 247, 188, 0.2), 0 0 80px rgba(255, 165, 0, 0.15), 0 35px 100px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.4), 0 0 200px rgba(11, 247, 188, 0.05)'
            }}
          >
            {/* 🎯 Live Countdown - Sichtbar von außen auf Modal - Premium Design - Mit Fallback */}
            {(() => {
              // Helper: Get deadline with fallback
              const getDeadline = () => {
                if (drop?.deadlineAt) return drop.deadlineAt;
                if (drop?.preorderDeadline) return drop.preorderDeadline;
                if (drop?.status === 'active') {
                  const fallback = new Date();
                  fallback.setDate(fallback.getDate() + 14);
                  return fallback.toISOString();
                }
                return null;
              };
              
              const deadline = getDeadline();
              const shouldShow = drop && drop.status === 'active' && deadline;
              
              if (!shouldShow) return null;
              
              return (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] animate-[fadeIn_0.5s_ease-out] pointer-events-none">
                  {/* 🎯 Mobile: Kompakt */}
                  <div className="md:hidden">
                    <DropCountdown 
                      deadlineAt={deadline} 
                      countdownType={drop.countdownType || (deadline ? (() => {
                        const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysLeft <= 7 ? "short" : "extended";
                      })() : "short")}
                      variant="mobile"
                      className="bg-black/95 backdrop-blur-xl border-2 border-white/40 shadow-[0_0_30px_rgba(11,247,188,0.6),0_0_60px_rgba(11,247,188,0.4)] px-4 py-2 rounded-xl font-bold"
                    />
                  </div>
                  {/* 🎯 Desktop: Ausführlich */}
                  <div className="hidden md:block">
                    <DropCountdown 
                      deadlineAt={deadline} 
                      countdownType={drop.countdownType || (deadline ? (() => {
                        const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysLeft <= 7 ? "short" : "extended";
                      })() : "short")}
                      variant="desktop"
                      className="bg-black/95 backdrop-blur-xl border-2 border-white/40 shadow-[0_0_40px_rgba(11,247,188,0.5),0_0_80px_rgba(11,247,188,0.3)] px-6 py-4 rounded-xl font-bold"
                    />
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-1 flex-col md:flex-row overflow-hidden min-h-0">
              
              {/* 🎨 Main Content - Left - Scrollable */}
              <div 
                className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" 
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
              >
                {/* 🎯 Hero Section - First scrollable element */}
                <section className="relative min-h-[60vh] md:min-h-[70vh] p-6 md:p-8 flex flex-col items-center justify-center text-center">
                  {/* 🎨 Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-orange-500/10 to-green-500/20 rounded-3xl" />
                  
                  {/* 🎯 Product Title */}
                  <div className="relative z-10 mb-8">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight">
                      {drop.name}
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-200 font-medium">
                      {selection.variant.label} · <span className="text-orange-400 font-bold">{selection.variant.flavor}</span>
                    </p>
                  </div>

                  {/* 🎯 Product Image */}
                  {heroMedia && (
                    <div className="relative z-10 mb-8">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                        <ProductImage
                          src={heroMedia.url}
                          alt={heroMedia.alt}
                          fallbackColor="#f97316"
                          overlayLabel={selection.variant.label}
                          aspectRatio="4 / 3"
                          priority
                          className="w-full max-w-md"
                        />
                      </div>
                    </div>
                  )}

                  {/* 🎯 Action Buttons */}
                  <div className="relative z-10 flex flex-wrap items-center gap-4 justify-center">
                    <button
                      onClick={handleInterested}
                      className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 backdrop-blur-sm rounded-xl px-6 py-3 text-white transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50 hover:scale-105"
                    >
                      <Heart className="h-5 w-5" />
                      <span className="font-semibold">Interesse</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 backdrop-blur-sm rounded-xl px-6 py-3 text-white transition-all duration-300 border border-green-400/30 hover:border-green-400/50 hover:scale-105"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="font-semibold">Teilen</span>
                    </button>
                  </div>
                </section>

                {/* 🎯 Product Details */}
                <section className="p-6 md:p-8">
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-6">Drop Details</h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                        <h3 className="text-xl font-semibold text-white mb-4">Spezifikationen</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Flavor:</span>
                            <span className="text-white font-semibold">{selection.variant.flavor}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Min. Menge:</span>
                            <span className="text-white font-semibold">{selection.variant.minQuantity}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Max. Menge:</span>
                            <span className="text-white font-semibold">{selection.variant.maxQuantity ?? drop.maxPerUser ?? "Unbegrenzt"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Verfügbarer Stock:</span>
                            <span className="text-white font-semibold">{selection.variant.stock}</span>
                          </div>
                          
                          {/* Dynamic Delivery Time & Origin */}
                          {(() => {
                            const dynamicDeliveryTime = getDynamicDeliveryTime(selection.variant);
                            const primaryOrigin = getPrimaryDeliveryOrigin(selection.variant);
                            return (
                              <div className="space-y-2 pt-3 border-t border-white/20">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-300" />
                                  <div className="flex-1">
                                    <span className="text-xs text-blue-200">Lieferzeit:</span>
                                    <span className="text-sm font-bold text-blue-100 ml-2">{dynamicDeliveryTime}</span>
                                  </div>
                                </div>
                                {primaryOrigin && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-green-300" />
                                    <div className="flex-1">
                                      <span className="text-xs text-green-200">Lieferort:</span>
                                      <span className="text-sm font-bold text-green-100 ml-2">
                                        {getSimplifiedOriginLabel(primaryOrigin)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                        <h3 className="text-xl font-semibold text-white mb-4">Preisübersicht</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Einzelpreis:</span>
                            <span className="text-white font-semibold">{formatPrice(unitPrice, currency)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Menge:</span>
                            <span className="text-white font-semibold">{quantity}x</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Zwischensumme:</span>
                            <span className="text-white font-semibold">{formatPrice(subtotal, currency)}</span>
                          </div>
                          <div className="border-t border-white/20 pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold text-white">Gesamt:</span>
                              <span className="text-2xl font-bold text-orange-400">{formatPrice(total, currency)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* 🎯 Sidebar - Right */}
              <aside className="w-full md:w-[400px] border-t md:border-t-0 md:border-l border-blue-500/20 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 overflow-y-auto min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                
                {/* 🎯 Varianten Auswahl */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-white">Sorten</h3>
                  <div className="space-y-3">
                    {drop.variants.map((variant) => {
                      const isActive = variant.id === selection.variantId;
                      const disabled = variant.stock <= 0;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => handleVariantSelect(variant.id)}
                          disabled={disabled}
                          className={`w-full rounded-xl border p-4 text-left transition-all duration-300 ${
                            isActive
                              ? "border-orange-400 bg-orange-400/10 text-white shadow-lg shadow-orange-400/25"
                              : "border-white/20 text-blue-200 hover:border-orange-400/50 hover:text-white hover:bg-orange-400/5"
                          } ${disabled ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{variant.label}</p>
                              {variant.description && (
                                <p className="text-sm text-blue-200 mt-1">{variant.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white">{formatPrice(variant.basePrice, currency)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 🎯 Menge Auswahl */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Menge</h3>
                    <span className="text-sm text-blue-200">Min {minQuantity} · Max {maxQuantity}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => drop && incrementQuantity(drop.id, -1)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition hover:border-orange-400/50 hover:bg-orange-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={quantity <= minQuantity}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={minQuantity}
                      max={maxQuantity}
                      value={quantity}
                      onChange={(event) => handleQuantityInput(event.target.value)}
                      className="h-10 w-full rounded-lg border border-white/20 bg-white/5 text-center text-lg font-semibold text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => drop && incrementQuantity(drop.id, 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition hover:border-orange-400/50 hover:bg-orange-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={quantity >= maxQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 🎯 Preorder Button */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handlePreorder}
                    disabled={isWaitlistOnly}
                    className={`w-full flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-lg font-bold transition-all duration-300 ${
                      canPreorder
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25"
                        : "border border-orange-400/40 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <Truck className="h-6 w-6" />
                    <span>
                      {isWaitlistOnly ? "Waitlist beitreten" : unitPrice === 0 ? "Gratis sichern" : "Preorder sichern"}
                    </span>
                  </button>
                </div>
              </aside>
            </div>
            
            <Dialog.Close className="absolute right-4 top-4 rounded-full border border-white/20 p-2 text-white hover:text-orange-400 transition-colors">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 🎯 Preorder Confirmation Modal */}
      <PreorderConfirmationModal
        reservation={lastReservation ?? null}
        inviteStatus={invite}
        onConfirm={handleConfirmPreorder}
        onCancel={handleCancelPreorder}
        isProcessing={isProcessingPreorder}
      />

      {/* 🎯 Drop Smart Cart Confirmation (Desktop) */}
      {showDropSmartCartConfirmation && (
        <DropSmartCartConfirmation
          isOpen={showDropSmartCartConfirmation}
          onClose={() => setShowDropSmartCartConfirmation(false)}
          onContinueShopping={() => {
            setShowDropSmartCartConfirmation(false);
            closeDrop();
            showToast.success('✅ Im Warenkorb!', `${addedItems.length} ${addedItems.length === 1 ? 'Sorte ist' : 'Sorten sind'} jetzt in deinem Warenkorb`);
          }}
          onGoToCart={() => {
            setShowDropSmartCartConfirmation(false);
            closeDrop();
            showToast.success('🎉 Erfolgreich hinzugefügt!', `${addedItems.length} ${addedItems.length === 1 ? 'Sorte wurde' : 'Sorten wurden'} zum Warenkorb hinzugefügt`);
            setTimeout(() => useGlobalCartStore.getState().openCart(), 500);
          }}
          onGoToCheckout={() => {
            setShowDropSmartCartConfirmation(false);
            closeDrop();
            showToast.success('🎉 Erfolgreich hinzugefügt!', `${addedItems.length} ${addedItems.length === 1 ? 'Sorte wurde' : 'Sorten wurden'} zum Warenkorb hinzugefügt`);
            setTimeout(() => navigate('/checkout'), 300);
          }}
          addedItems={addedItems}
          totalAddedPrice={totalAddedPrice}
          cartTotal={useGlobalCartStore.getState().totalPrice}
          freeShippingThreshold={50}
          dropName={drop.name}
        />
      )}
    </>
  );
};

