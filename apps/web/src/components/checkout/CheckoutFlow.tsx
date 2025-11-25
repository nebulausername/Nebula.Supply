import { useState, useEffect, useMemo, useCallback, ErrorInfo, Component } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Lock, Shield, Truck, CreditCard, MapPin, User, AlertTriangle } from "lucide-react";
import { useMobileOptimizations } from "../MobileOptimizations";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useGlobalCartStore } from "../../store/globalCart";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../store/toast";
import { cn } from "../../utils/cn";

import { CheckoutStep } from "./CheckoutStep";
import { AddressForm } from "./AddressForm";
import { PaymentMethodSelection } from "./PaymentMethodSelection";
import { OrderSummary } from "./OrderSummary";
import { OrderConfirmation } from "./OrderConfirmation";
import { CheckoutProgress } from "./CheckoutProgress";
import { SecurityBadge } from "./SecurityBadge";
import { GamingDiscountSection } from "./GamingDiscountSection";
import { useGamingDiscountStore } from "../../store/gamingDiscounts";

// Error Boundary for Checkout Flow
class CheckoutErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Checkout Error:', error, errorInfo);
    showToast.error('Ein Fehler ist aufgetreten', 'Bitte versuche es erneut oder kontaktiere den Support');
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text mb-2">Ups! Etwas ist schiefgelaufen</h2>
              <p className="text-muted mb-4">Bitte versuche es erneut oder kontaktiere unseren Support.</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-accent text-black rounded-xl font-semibold hover:bg-accent/90 transition-colors"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export type CheckoutStepType = "address" | "payment" | "review" | "confirmation";

export interface CheckoutData {
  // Delivery Type
  deliveryType: "address" | "paketstation";
  
  // Paketstation Information (if deliveryType is "paketstation")
  paketstation?: {
    postnummer: string;
    stationNumber: string;
    city: string;
    postalCode: string;
  };
  
  // Address Information
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  
  // Billing Information
  billingAddress: {
    sameAsShipping: boolean;
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  
  // Payment Information
  paymentMethod: string;
  paymentDetails: Record<string, any>;
  
  // Order Preferences
  deliveryInstructions?: string;
  marketingConsent: boolean;
  termsAccepted: boolean;

  // Cart Information
  cartTotal?: number;
}

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

// A/B Testing Hook for Feature Flags and Experiments
const useABTesting = () => {
  const getExperimentVariant = (experimentName: string): string => {
    // In production, this would check user assignment from your A/B testing service
    // For now, we'll use localStorage for demo purposes
    const stored = localStorage.getItem(`nebula_experiment_${experimentName}`);
    if (stored) return stored;

    // Simple random assignment for demo
    const variants = ['control', 'variant_a', 'variant_b'];
    const assignedVariant = variants[Math.floor(Math.random() * variants.length)];
    localStorage.setItem(`nebula_experiment_${experimentName}`, assignedVariant);
    return assignedVariant;
  };

  const isFeatureEnabled = (featureName: string): boolean => {
    // In production, this would check feature flags from your service
    const enabledFeatures = JSON.parse(localStorage.getItem('nebula_features') || '[]');
    return enabledFeatures.includes(featureName);
  };

  return { getExperimentVariant, isFeatureEnabled };
};

// Simple Analytics Hook for Checkout Tracking
const useCheckoutAnalytics = () => {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    // In production, this would integrate with your analytics service (Google Analytics, Mixpanel, etc.)
    console.log('📊 Analytics Event:', eventName, properties);

    // Example integration points:
    // - window.gtag?.('event', eventName, properties)
    // - analytics.track(eventName, properties)
    // - mixpanel.track(eventName, properties)
  };

  const trackStepView = (step: string, stepNumber: number) => {
    trackEvent('checkout_step_viewed', {
      step,
      step_number: stepNumber,
      timestamp: new Date().toISOString()
    });
  };

  const trackStepCompleted = (step: string, stepNumber: number, timeSpent?: number) => {
    trackEvent('checkout_step_completed', {
      step,
      step_number: stepNumber,
      time_spent: timeSpent,
      timestamp: new Date().toISOString()
    });
  };

  const trackPaymentMethodSelected = (method: string, amount: number) => {
    trackEvent('payment_method_selected', {
      method,
      amount,
      currency: 'EUR',
      timestamp: new Date().toISOString()
    });
  };

  const trackOrderCompleted = (orderId: string, amount: number, paymentMethod: string) => {
    trackEvent('order_completed', {
      order_id: orderId,
      amount,
      currency: 'EUR',
      payment_method: paymentMethod,
      timestamp: new Date().toISOString()
    });
  };

  return {
    trackEvent,
    trackStepView,
    trackStepCompleted,
    trackPaymentMethodSelected,
    trackOrderCompleted
  };
};

export const CheckoutFlow = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useGlobalCartStore();
  const { user } = useAuthStore();
  const { isMobile, screenSize } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const analytics = useCheckoutAnalytics();
  const abTesting = useABTesting();

  const [currentStep, setCurrentStep] = useState<CheckoutStepType>("address");
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(initialCheckoutData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [selectedGamingDiscountId, setSelectedGamingDiscountId] = useState<string | null>(null);

  // A/B Testing: Voice Checkout Experiment
  const voiceCheckoutVariant = abTesting.getExperimentVariant('voice_checkout');
  const isVoiceCheckoutEnabled = abTesting.isFeatureEnabled('voice_checkout');

  // A/B Testing: Enhanced Security Experiment
  const securityVariant = abTesting.getExperimentVariant('enhanced_security');

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
    const stepNumbers = { address: 1, payment: 2, review: 3, confirmation: 4 };
    analytics.trackStepView(currentStep, stepNumbers[currentStep as keyof typeof stepNumbers]);
    setStepStartTime(Date.now());
  }, [currentStep, analytics]);

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

  const steps: Array<{
    id: CheckoutStepType;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    completed: boolean;
  }> = useMemo(() => [
    {
      id: "address",
      title: "Lieferadresse",
      description: "Wo soll deine Bestellung ankommen?",
      icon: MapPin,
      completed: currentStep !== "address" && !!checkoutData.shippingAddress.firstName,
    },
    {
      id: "payment",
      title: "Zahlungsart",
      description: "Wie möchtest du bezahlen?",
      icon: CreditCard,
      completed: currentStep !== "payment" && !!checkoutData.paymentMethod,
    },
    {
      id: "review",
      title: "Bestellung prüfen",
      description: "Überprüfe deine Bestellung",
      icon: CheckCircle,
      completed: currentStep !== "review" && checkoutData.termsAccepted,
    },
    {
      id: "confirmation",
      title: "Bestätigung",
      description: "Deine Bestellung ist unterwegs!",
      icon: Truck,
      completed: currentStep === "confirmation",
    },
  ], [currentStep, checkoutData.shippingAddress.firstName, checkoutData.paymentMethod, checkoutData.termsAccepted]);

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case "address":
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

    // Track step completion
    const stepNumbers = { address: 1, payment: 2, review: 3, confirmation: 4 };
    const timeSpent = Date.now() - stepStartTime;
    analytics.trackStepCompleted(currentStep, stepNumbers[currentStep as keyof typeof stepNumbers], timeSpent);

    triggerHaptic('light');
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id as CheckoutStepType);
    }
  }, [canProceedToNext, currentStep, steps, triggerHaptic, stepStartTime, analytics]);

  const handlePrevious = useCallback(() => {
    triggerHaptic('light');
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id as CheckoutStepType);
    }
  }, [currentStep, steps, triggerHaptic]);

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

      // Track order completion
      analytics.trackOrderCompleted(newOrderId, totalPrice, checkoutData.paymentMethod);

      // Clear cart and saved checkout data
      clearCart();
      localStorage.removeItem("nebula_checkout_data");

      showToast.success(
        "Bestellung erfolgreich!",
        `Deine Bestellung ${newOrderId} wurde aufgegeben`
      );
    } catch (error) {
      showToast.error("Fehler bei der Bestellung", "Bitte versuche es erneut");
      analytics.trackEvent('order_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        step: currentStep,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToShop = () => {
    navigate("/shop");
  };

  if (items.length === 0 && currentStep !== "confirmation") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Truck className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Warenkorb ist leer</h2>
            <p className="text-slate-400 mb-6">Füge Artikel hinzu, um mit dem Checkout fortzufahren</p>
            <button
              onClick={handleBackToShop}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
            >
              Zum Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CheckoutErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={currentStep === "address" ? handleBackToShop : handlePrevious}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white">Checkout</h1>
                <p className="text-sm text-slate-400">
                  {items.length} Artikel • {totalPrice.toFixed(2)}€
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <SecurityBadge />
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Lock className="h-4 w-4" />
                <span>SSL verschlüsselt</span>
                {securityVariant === 'variant_a' && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-green-400">Erweiterte Sicherheit</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(
        "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8",
        isMobile && "py-2"
      )}>
        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8",
          isMobile && "gap-2"
        )}>
          {/* Main Content */}
          <div className={cn(
            "lg:col-span-2 space-y-4 sm:space-y-8",
            isMobile && "space-y-2"
          )}>
            {/* Progress Indicator */}
            <CheckoutProgress steps={steps} currentStep={currentStep} />
            
            {/* Step Content */}
            <div className={cn(
              "bg-slate-800/50 rounded-2xl border border-slate-700 p-4 sm:p-6",
              isMobile && "p-3 rounded-xl"
            )}>
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
                  <div className="space-y-6">
                    {/* Order Summary */}
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className={cn(
              "sticky top-24 space-y-4 sm:space-y-6",
              isMobile && "top-20 space-y-2"
            )}>
              {/* 🎮 Rabatt gegen Cookies – CTA */}
              <div className={cn(
                "bg-slate-800/50 rounded-xl border border-slate-700 p-3 sm:p-4",
                isMobile && "p-2 rounded-lg"
              )}>
                <GamingDiscountSection
                  subtotal={totalPrice}
                  selectedDiscountId={selectedGamingDiscountId}
                  onDiscountSelect={setSelectedGamingDiscountId}
                />
              </div>
              {/* Security Features */}
              <div className={cn(
                "bg-slate-800/50 rounded-xl border border-slate-700 p-3 sm:p-4",
                isMobile && "p-2 rounded-lg"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-5 w-5 text-green-400" />
                  <h3 className="font-semibold text-white">Sicherheit</h3>
                </div>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>SSL-Verschlüsselung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>PCI DSS konform</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>DSGVO konform</span>
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className={cn(
                "bg-slate-800/50 rounded-xl border border-slate-700 p-3 sm:p-4",
                isMobile && "p-2 rounded-lg"
              )}>
                <h3 className="font-semibold text-white mb-2 sm:mb-3">Hilfe benötigt?</h3>
                <p className="text-sm text-slate-400 mb-3 sm:mb-4">
                  Unser Support-Team hilft dir gerne bei Fragen zum Checkout.
                </p>
                <button className={cn(
                  "w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors touch-target",
                  isMobile && "py-4 text-base"
                )}>
                  Support kontaktieren
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </CheckoutErrorBoundary>
  );
};

