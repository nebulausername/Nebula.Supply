import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package, Zap } from "lucide-react";
import { useGlobalCartStore } from "../store/globalCart";
import { useAuthStore } from "../store/auth";
import { showToast } from "../store/toast";
import { formatCurrency } from "../utils/currency";
import { cn } from "../utils/cn";
import { isFeatureEnabled } from "../utils/flags";

export const GlobalCart = () => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    items,
    isOpen,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
    closeCart,
    getItemById,
    validateCart
  } = useGlobalCartStore();
  
  const { user } = useAuthStore();

  // Lock body scroll while cart is open for better modal behavior
  useEffect(() => {
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Store previous active element for focus restoration
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      // Focus modal on open
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
      return () => {
        document.body.style.overflow = previousOverflow;
        // Restore focus
        previousActiveElementRef.current?.focus();
      };
    }
  }, [isOpen]);

  // Cleanup timeout and intervals on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeCart();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeCart]);

  // Focus trap - keep focus inside modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const handleQuantityChange = useCallback((id: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setIsAnimating(true);
    updateQuantity(id, Math.max(0, newQuantity));
    setTimeout(() => setIsAnimating(false), 200);
    
    // Show feedback for quantity changes
    if (newQuantity === 0) {
      showToast.info('Artikel entfernt', 'Artikel wurde aus dem Warenkorb entfernt');
    }
  }, [updateQuantity]);

  const handleRemoveItem = useCallback((id: string) => {
    const item = getItemById(id);
    setIsAnimating(true);
    removeItem(id);
    setTimeout(() => setIsAnimating(false), 200);
    
    if (item) {
      showToast.info('Artikel entfernt', `${item.name} wurde aus dem Warenkorb entfernt`);
    }
  }, [getItemById, removeItem]);

  const handleClearCart = useCallback(() => {
    if (items.length === 0) return;
    
    try {
      setIsAnimating(true);
      clearCart();
      setTimeout(() => setIsAnimating(false), 200);
      showToast.info('Warenkorb geleert', 'Alle Artikel wurden entfernt');
    } catch (error) {
      console.error('Error clearing cart:', error);
      showToast.error('Fehler beim Leeren', 'Warenkorb konnte nicht geleert werden');
      setIsAnimating(false);
    }
  }, [clearCart, items.length]);

  const handleCheckout = useCallback(async () => {
    if (items.length === 0) {
      showToast.error('Warenkorb leer', 'Bitte füge Artikel zum Warenkorb hinzu');
      return;
    }

    if (isValidating) {
      return; // Prevent double submission
    }

    setIsValidating(true);
    setValidationProgress(0);
    
    // Clear any existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Progress simulation for better UX - smoother animation
    progressIntervalRef.current = setInterval(() => {
      setValidationProgress(prev => {
        // Exponential easing for smoother progress
        const increment = prev < 50 ? 15 : prev < 80 ? 8 : 3;
        return Math.min(prev + increment, 90);
      });
    }, 150);
    
    // Fallback timeout - if validation takes too long, proceed anyway
    validationTimeoutRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setValidationProgress(100);
      console.warn('Validation timeout - proceeding with checkout');
      showToast.info('Validierung dauerte zu lange', 'Checkout wird fortgesetzt');
      setIsValidating(false);
      closeCart();
      setTimeout(() => {
        navigate('/checkout');
      }, 300);
      validationTimeoutRef.current = null;
    }, 6000); // 6 seconds total timeout
    
    try {
      // Get user ID for validation
      const userId = user?.id || user?.telegramId?.toString() || localStorage.getItem('telegram_id') || 'guest';
      
      // Validate cart server-side before checkout (with 5 second timeout)
      showToast.info('Warenkorb wird geprüft...', 'Preise und Verfügbarkeit werden validiert');
      
      const validationResult = await validateCart(userId, 5000); // 5 second timeout
      
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setValidationProgress(100);
      
      // Clear fallback timeout since validation completed
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
      
      // Show warnings if any (non-blocking) - batch them to avoid spam
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        // Show first warning immediately, batch others
        showToast.info('Hinweis', validationResult.warnings[0]);
        if (validationResult.warnings.length > 1) {
          // Combine remaining warnings
          const remainingWarnings = validationResult.warnings.slice(1).join('; ');
          setTimeout(() => {
            showToast.info('Weitere Hinweise', remainingWarnings);
          }, 1000);
        }
      }
      
      // Always allow checkout - validation errors are warnings, not blockers
      // Only show critical errors as info, don't block
      if (validationResult.errors && validationResult.errors.length > 0) {
        const criticalErrors = validationResult.errors.filter(e => 
          e.field === 'stock' && e.message.includes('Nicht genug Lagerbestand')
        );
        if (criticalErrors.length > 0) {
          const errorMessages = criticalErrors.map(e => e.message).join(', ');
          showToast.warning('Lagerbestand', errorMessages);
        }
      }

      // Check if server total differs significantly from client total
      if (validationResult.serverTotalPrice && Math.abs(validationResult.serverTotalPrice - totalPrice) > 0.01) {
        showToast.info('Preise aktualisiert', `Neuer Gesamtpreis: ${formatCurrency(validationResult.serverTotalPrice, "EUR")}`);
      }
      
      // Small delay to show completion before navigation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Close cart first
      closeCart();
      
      // Navigate to checkout page using React Router
      navigate('/checkout');
    } catch (error: any) {
      // Clear fallback timeout and progress interval
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setValidationProgress(100);
      
      console.error('Error during checkout:', error);
      
      // Even on error, allow checkout to proceed
      showToast.info('Validierung fehlgeschlagen', 'Checkout wird trotzdem fortgesetzt');
      
      closeCart();
      setTimeout(() => {
        navigate('/checkout');
      }, 300);
    } finally {
      // Always reset loading state
      setIsValidating(false);
      setTimeout(() => setValidationProgress(0), 500); // Reset progress after animation
    }
  }, [items.length, closeCart, navigate, validateCart, user, totalPrice, isValidating]);

  // Memoize calculations for performance
  const freeShippingProgress = useMemo(() => {
    const threshold = 25;
    if (totalPrice >= threshold) return 100;
    return Math.min((totalPrice / threshold) * 100, 100);
  }, [totalPrice]);

  const remainingForFreeShipping = useMemo(() => {
    return Math.max(0, 25 - totalPrice);
  }, [totalPrice]);

  // Simple feature flag to allow QA to toggle new cart UI
  const cartUiEnabled = isFeatureEnabled('new_cart_ui', true);
  if (!isOpen || !cartUiEnabled) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Warenkorb"
    >
      <div 
        ref={modalRef}
        className="w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-2xl md:rounded-2xl border border-slate-700 shadow-2xl flex flex-col outline-none overflow-hidden" 
        tabIndex={-1}
      >
        
        {/* Header - Sticky */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700 flex-shrink-0 bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Warenkorb</h2>
              <p className="text-sm text-slate-400">{totalItems} Artikel</p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors touch-target"
            aria-label="Warenkorb schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable with proper constraints */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 overscroll-contain">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center h-full">
              {/* Icon - Optimized */}
              <div className="relative mb-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center border-2 border-slate-600/50">
                  <Package className="h-10 w-10 md:h-12 md:w-12 text-slate-400" strokeWidth={1.5} />
                </div>
                {/* Pulse animation */}
                <div className="absolute inset-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-600/20 animate-ping" />
              </div>
              
              {/* Text */}
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Warenkorb ist leer</h3>
              <p className="text-slate-400 mb-8 max-w-md px-4">
                Füge Produkte hinzu, um zu bezahlen.
              </p>
              
              {/* Shop Button - Geil */}
              <button
                onClick={() => {
                  closeCart();
                  setTimeout(() => {
                    navigate('/shop');
                  }, 200);
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-[#0BF7BC] via-[#0BF7BC] to-emerald-400 text-black rounded-xl font-bold text-base md:text-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-[#0BF7BC]/30 hover:shadow-[#0BF7BC]/50 overflow-hidden touch-target min-h-[56px]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Shop erkunden
                </span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 rounded-xl border border-slate-600 bg-slate-800/50 transition-all duration-200",
                    isAnimating && "scale-95 opacity-75"
                  )}
                >
                  <div className="flex items-center gap-4">
                    
                    {/* Item Image - Optimized with lazy loading */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback on error
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.image-fallback');
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className={`image-fallback w-full h-full ${item.image ? 'hidden' : 'flex'} items-center justify-center`}>
                        <Package className="h-6 w-6 text-slate-500" />
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{item.name}</h3>
                          <p className="text-sm text-slate-400 truncate">{item.variant}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-orange-400">
                              {formatCurrency(item.price, "EUR")}
                            </span>
                            {item.type === 'drop' && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                                Drop
                              </span>
                            )}
                            {item.inviteRequired && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                                Invite
                              </span>
                            )}
                            {item.stock !== undefined && (
                              <>
                                {item.stock === 0 ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                    Ausverkauft
                                  </span>
                                ) : item.stock < 5 ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                    Nur noch {item.stock} verfügbar
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                    Auf Lager
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors ml-2 touch-target"
                          aria-label={`${item.name} entfernen`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center touch-target"
                            aria-label="Menge reduzieren"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-white" aria-label={`Menge: ${item.quantity}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={
                              item.quantity >= Math.min(item.maxQuantity || 10, item.stock || 10) ||
                              (item.stock !== undefined && item.quantity >= item.stock)
                            }
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center touch-target min-w-[44px] min-h-[44px]"
                            aria-label="Menge erhöhen"
                            title={
                              item.stock !== undefined && item.quantity >= item.stock
                                ? 'Maximale verfügbare Menge erreicht'
                                : 'Menge erhöhen'
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">
                            {formatCurrency(item.price * item.quantity, "EUR")}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-slate-400">
                              {item.quantity} × {formatCurrency(item.price, "EUR")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Sticky at bottom, always visible */}
        {items.length > 0 && (
          <div className="p-4 md:p-6 border-t border-slate-700 space-y-4 bg-gradient-to-br from-slate-900 to-slate-800 flex-shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] sticky bottom-0 z-10">
            
            {/* Free Shipping Progress */}
            {totalPrice < 25 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Kostenloser Versand ab 25€</span>
                  <span className="text-green-400 font-semibold">
                    Noch {formatCurrency(remainingForFreeShipping, "EUR")}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                  <div 
                    className="h-2 bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                    role="progressbar"
                    aria-valuenow={freeShippingProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Noch ${formatCurrency(remainingForFreeShipping, "EUR")} bis kostenloser Versand`}
                  />
                </div>
              </div>
            )}
            {totalPrice >= 25 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-400 font-semibold">Kostenloser Versand freigeschaltet! 🎉</span>
              </div>
            )}
            
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Gesamt</span>
              <span className="text-2xl font-bold text-orange-400">
                {formatCurrency(totalPrice, "EUR")}
              </span>
            </div>

            {/* Actions - Prominent Checkout Button */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || isValidating}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 touch-target min-h-[56px]"
                aria-label="Zur Kasse gehen"
              >
                {isValidating ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <span>Wird geprüft...</span>
                      {validationProgress > 0 && (
                        <div className="w-full max-w-[200px] h-1 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-300 ease-out"
                            style={{ width: `${validationProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Zur Kasse ({formatCurrency(totalPrice, "EUR")})</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              <button
                onClick={handleClearCart}
                disabled={items.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-target"
                aria-label="Warenkorb leeren"
              >
                Warenkorb leeren
              </button>
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Kostenloser Versand ab 25€ • Sichere Bezahlung
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
