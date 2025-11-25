import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, MapPin, CreditCard, Truck, AlertTriangle, Lock, ShoppingCart } from "lucide-react";
import { useGlobalCartStore } from "../../store/globalCart";
import { useAuthStore } from "../../store/auth";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../MobileOptimizations";
import { showToast } from "../../store/toast";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/currency";

import { CheckoutStep } from "./CheckoutStep";
import { AddressForm } from "./AddressForm";
import { PaymentMethodSelection } from "./PaymentMethodSelection";
import { OrderSummary } from "./OrderSummary";
import { OrderConfirmation } from "./OrderConfirmation";
import { CheckoutProgress } from "./CheckoutProgress";
import { SecurityBadge } from "./SecurityBadge";
import { GamingDiscountSection } from "./GamingDiscountSection";
import { useGamingDiscountStore } from "../../store/gamingDiscounts";

import type { CheckoutStepType, CheckoutData } from "./CheckoutFlow";

const initialCheckoutData: CheckoutData = {
  deliveryType: "address",
  shippingAddress: {
    firstName: "",
    lastName: "",
    address1: "",
    city: "",
    postalCode: "",
    country: "DE",
  },
  billingAddress: {
    sameAsShipping: true,
    firstName: "",
    lastName: "",
    address1: "",
    city: "",
    postalCode: "",
    country: "DE",
  },
  paymentMethod: "",
  paymentDetails: {},
  marketingConsent: false,
  termsAccepted: false,
};

interface MobileCheckoutProps {
  onBack?: () => void;
}

export const MobileCheckout = ({ onBack }: MobileCheckoutProps) => {
  const navigate = useNavigate();
  const { triggerHaptic } = useEnhancedTouch();
  const { isMobile } = useMobileOptimizations();
  const { items, totalPrice, clearCart } = useGlobalCartStore();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<CheckoutStepType>("address");
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(initialCheckoutData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [selectedGamingDiscountId, setSelectedGamingDiscountId] = useState<string | null>(null);

  // Load saved checkout data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("nebula_checkout_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCheckoutData(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn("Failed to load saved checkout data:", error);
      }
    }
  }, []);

  // Track step views for analytics
  useEffect(() => {
    setStepStartTime(Date.now());
  }, [currentStep]);

  // Save checkout data to localStorage
  useEffect(() => {
    localStorage.setItem("nebula_checkout_data", JSON.stringify(checkoutData));
  }, [checkoutData]);

  // Auto-fill user data if available
  useEffect(() => {
    if (user && !checkoutData.shippingAddress.firstName) {
      setCheckoutData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          firstName: user.handle.split(' ')[0] || "",
          lastName: user.handle.split(' ').slice(1).join(' ') || "",
        }
      }));
    }
  }, [user, checkoutData.shippingAddress.firstName]);

  // Update cart total in checkout data
  useEffect(() => {
    setCheckoutData(prev => ({
      ...prev,
      cartTotal: totalPrice,
    }));
  }, [totalPrice]);

  const steps = useMemo(() => [
    {
      id: "address" as CheckoutStepType,
      title: "Lieferadresse",
      description: "Wo soll deine Bestellung ankommen?",
      icon: MapPin,
      completed: currentStep !== "address" && !!checkoutData.shippingAddress.firstName,
    },
    {
      id: "payment" as CheckoutStepType,
      title: "Zahlungsart",
      description: "Wie möchtest du bezahlen?",
      icon: CreditCard,
      completed: currentStep !== "payment" && !!checkoutData.paymentMethod,
    },
    {
      id: "review" as CheckoutStepType,
      title: "Bestellung prüfen",
      description: "Überprüfe deine Bestellung",
      icon: CheckCircle,
      completed: currentStep !== "review" && checkoutData.termsAccepted,
    },
    {
      id: "confirmation" as CheckoutStepType,
      title: "Bestätigung",
      description: "Deine Bestellung ist unterwegs!",
      icon: Truck,
      completed: currentStep === "confirmation",
    },
  ], [currentStep, checkoutData.shippingAddress.firstName, checkoutData.paymentMethod, checkoutData.termsAccepted]);

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case "address":
        if (checkoutData.deliveryType === "paketstation") {
          return !!(
            checkoutData.paketstation?.postnummer &&
            checkoutData.paketstation?.stationNumber &&
            checkoutData.paketstation?.city &&
            checkoutData.paketstation?.postalCode
          );
        }
        return !!(
          checkoutData.shippingAddress.firstName &&
          checkoutData.shippingAddress.lastName &&
          checkoutData.shippingAddress.address1 &&
          checkoutData.shippingAddress.city &&
          checkoutData.shippingAddress.postalCode
        );
      case "payment":
        return !!checkoutData.paymentMethod;
      case "review":
        return checkoutData.termsAccepted;
      default:
        return false;
    }
  };

  const handleNext = useCallback(() => {
    if (!canProceedToNext()) {
      showToast.error("Bitte fülle alle erforderlichen Felder aus", "Einige Informationen fehlen noch");
      triggerHaptic('error');
      return;
    }

    triggerHaptic('light');
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id);
    }
  }, [canProceedToNext, currentStep, steps, triggerHaptic]);

  const handlePrevious = useCallback(() => {
    triggerHaptic('light');
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    } else if (onBack) {
      onBack();
    } else {
      navigate("/shop");
    }
  }, [currentStep, steps, triggerHaptic, onBack, navigate]);

  const handleCompleteOrder = async () => {
    setIsProcessing(true);

    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newOrderId = `NEB-${Date.now().toString(36).toUpperCase()}`;
      setOrderId(newOrderId);
      setCurrentStep("confirmation");

      // Apply Gaming Discount if selected
      if (selectedGamingDiscountId) {
        try {
          const useDiscount = useGamingDiscountStore.getState().useDiscount;
          useDiscount(selectedGamingDiscountId, totalPrice);
        } catch (e) {
          console.warn('Failed to apply gaming discount', e);
        }
      }

      // Clear cart and saved checkout data
      clearCart();
      localStorage.removeItem("nebula_checkout_data");

      showToast.success(
        "Bestellung erfolgreich!",
        `Deine Bestellung ${newOrderId} wurde aufgegeben`
      );
    } catch (error) {
      showToast.error("Fehler bei der Bestellung", "Bitte versuche es erneut");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToShop = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/shop");
    }
  };

  // State for checking cart sync
  const [isCheckingCart, setIsCheckingCart] = useState(true);
  const [cartCheckCount, setCartCheckCount] = useState(0);

  // Debug: Log items on every render
  useEffect(() => {
    console.log('🛒 MobileCheckout items check:', {
      itemsCount: items.length,
      items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
      totalPrice,
      currentStep
    });
  }, [items, totalPrice, currentStep]);

  // Check cart state from multiple sources with delays
  useEffect(() => {
    if (items.length === 0 && currentStep !== "confirmation") {
      const checkCartState = (): boolean => {
        // Check store state
        const storeItems = useGlobalCartStore.getState().items;
        if (storeItems.length > 0) {
          console.log('✅ MobileCheckout: Cart has items in store:', storeItems.length);
          setIsCheckingCart(false);
          return true;
        }
        
        // Check localStorage as fallback
        try {
          const localStorageData = localStorage.getItem('nebula-global-cart');
          if (localStorageData) {
            const parsed = JSON.parse(localStorageData);
            const cartItems = parsed?.state?.items || parsed?.items || [];
            if (cartItems.length > 0) {
              console.log('✅ MobileCheckout: Cart has items in localStorage:', cartItems.length);
              setIsCheckingCart(false);
              return true;
            }
          }
        } catch (parseError) {
          console.warn('⚠️ MobileCheckout: Could not parse localStorage:', parseError);
        }
        
        return false;
      };

      // Check immediately
      if (checkCartState()) return;

      // Check after 500ms
      const timeout1 = setTimeout(() => {
        setCartCheckCount(1);
        if (checkCartState()) return;
      }, 500);

      // Check after 1000ms
      const timeout2 = setTimeout(() => {
        setCartCheckCount(2);
        if (checkCartState()) return;
      }, 1000);

      // Final check after 2000ms
      const timeout3 = setTimeout(() => {
        setCartCheckCount(3);
        setIsCheckingCart(false);
        checkCartState();
      }, 2000);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
    } else {
      setIsCheckingCart(false);
    }
  }, [items.length, currentStep]);

  // Only show empty state if REALLY empty and not in confirmation and not checking
  if (items.length === 0 && currentStep !== "confirmation" && !isCheckingCart) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] flex items-center justify-center p-4 safe-area-full relative z-10">
        <div className="text-center max-w-md w-full">
          {/* Icon - Geil & Größer */}
          <div className="relative mb-8 mx-auto w-fit">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-slate-700/60 to-slate-800/60 flex items-center justify-center border-2 border-slate-600/60 shadow-2xl">
              <AlertTriangle className="h-12 w-12 md:h-14 md:w-14 text-slate-300" strokeWidth={2} />
            </div>
            {/* Enhanced Pulse animation */}
            <div className="absolute inset-0 w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-600/30 animate-ping" />
            <div className="absolute inset-0 w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-500/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          
          {/* Text - Verbessert */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">Warenkorb ist leer</h2>
          <p className="text-slate-300 mb-10 px-4 text-base md:text-lg leading-relaxed">
            Füge Produkte hinzu, um zu bezahlen.
          </p>
          
          {/* Shop Button - Maximiert Geil */}
          <button
            onClick={handleBackToShop}
            className="group relative px-10 py-5 bg-gradient-to-r from-[#0BF7BC] via-[#0BF7BC] to-emerald-400 text-black rounded-2xl font-bold text-lg md:text-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl shadow-[#0BF7BC]/40 hover:shadow-[#0BF7BC]/60 overflow-hidden touch-target min-h-[64px] w-full max-w-sm mx-auto"
          >
            {/* Shimmer effect - Enhanced */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-3">
              <ShoppingCart className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.5} />
              <span>Shop erkunden</span>
            </span>
            
            {/* Pulse glow on hover */}
            <div className="absolute inset-0 rounded-2xl bg-[#0BF7BC]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while checking cart
  if (isCheckingCart && items.length === 0 && currentStep !== "confirmation") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] flex items-center justify-center p-4 safe-area-full relative z-10">
        <div className="text-center max-w-md w-full">
          {/* Loading Icon */}
          <div className="relative mb-8 mx-auto w-fit">
            <div className="w-16 h-16 border-4 border-[#0BF7BC]/30 border-t-[#0BF7BC] rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-emerald-400/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          
          {/* Loading Text */}
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">Wird geladen...</h2>
          <p className="text-slate-400 text-sm md:text-base">
            {cartCheckCount === 0 && 'Warenkorb wird geprüft...'}
            {cartCheckCount === 1 && 'Warenkorb wird synchronisiert...'}
            {cartCheckCount === 2 && 'Finale Prüfung...'}
            {cartCheckCount >= 3 && 'Abschluss...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] safe-area-full w-full relative z-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            {currentStep !== "address" ? (
              <button
                onClick={handlePrevious}
                className="rounded-full p-2 bg-white/5 hover:bg-white/10 transition-colors touch-target"
                aria-label="Zurück"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
            ) : (
              onBack && (
                <button
                  onClick={handlePrevious}
                  className="rounded-full p-2 bg-white/5 hover:bg-white/10 transition-colors touch-target"
                  aria-label="Zurück"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
              )
            )}
            <div>
              <h1 className="text-lg font-bold text-white">Checkout</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{items.length} Artikel</span>
                <span>•</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SecurityBadge />
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-3 pb-3">
          <CheckoutProgress steps={steps} currentStep={currentStep} />
        </div>
      </header>

      {/* Content */}
      <div className="p-3 pb-24">
        {/* Step Content */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-3 mb-4">
          {currentStep === "address" && (
            <CheckoutStep
              title="Lieferadresse"
              description="Wo soll deine Bestellung ankommen?"
              icon={MapPin}
            >
              <AddressForm
                data={checkoutData}
                onChange={setCheckoutData}
                onNext={handleNext}
              />
            </CheckoutStep>
          )}

          {currentStep === "payment" && (
            <CheckoutStep
              title="Zahlungsart"
              description="Wähle deine bevorzugte Zahlungsmethode"
              icon={CreditCard}
            >
              <PaymentMethodSelection
                data={checkoutData}
                onChange={setCheckoutData}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </CheckoutStep>
          )}

          {currentStep === "review" && (
            <CheckoutStep
              title="Bestellung prüfen"
              description="Überprüfe deine Bestellung vor dem Abschluss"
              icon={CheckCircle}
            >
              <div className="space-y-4">
                <OrderSummary
                  items={items}
                  checkoutData={checkoutData}
                  onComplete={handleCompleteOrder}
                  isProcessing={isProcessing}
                  onChange={setCheckoutData}
                  onPrevious={handlePrevious}
                />
              </div>
            </CheckoutStep>
          )}

          {currentStep === "confirmation" && orderId && (
            <OrderConfirmation
              orderId={orderId}
              checkoutData={checkoutData}
              onBackToShop={handleBackToShop}
            />
          )}
        </div>

        {/* Gaming Discount Section - Mobile optimized */}
        {currentStep !== "confirmation" && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-3 mb-4">
            <GamingDiscountSection
              subtotal={totalPrice}
              selectedDiscountId={selectedGamingDiscountId}
              onDiscountSelect={setSelectedGamingDiscountId}
            />
          </div>
        )}
      </div>

      {/* Bottom Safe Area */}
      <div className="h-safe-area-inset-bottom bg-black" />
    </div>
  );
};
