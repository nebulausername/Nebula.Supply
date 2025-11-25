import { useState, useEffect } from "react";
import { useGlobalCartStore } from "../../store/globalCart";
import { useLoyaltyStore, awardLoyaltyPoints } from "../../store/loyalty";
import { useAuthStore } from "../../store/auth";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../MobileOptimizations";
import { ArrowLeft, CreditCard, Smartphone, Lock, Truck, Shield, CheckCircle, Coins, ShoppingCart } from "lucide-react";
import { formatCurrency } from "../../utils/currency";

export const GlobalCheckout = () => {
  const { triggerHaptic } = useEnhancedTouch();
  const { isMobile } = useMobileOptimizations();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const cartState = useGlobalCartStore();
  const { items, totalPrice, totalItems, clearCart, openCart } = cartState;
  const { user } = useAuthStore();
  const { currentPoints, currentTier, getTierInfo } = useLoyaltyStore();

  // Debug: Log cart state
  console.log('🛒 Checkout cart state:', {
    itemsCount: items.length,
    totalItems,
    totalPrice,
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      quantity: item.quantity,
      price: item.price
    }))
  });

  useEffect(() => {
    if (items.length === 0 && step > 1) {
      setStep(1);
    }
  }, [items.length, step]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
            <ShoppingCart className="h-10 w-10 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">Warenkorb ist leer</h1>
            <p className="text-muted mb-6">Füge Produkte hinzu, um fortzufahren</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-accent text-black rounded-xl font-semibold hover:bg-accent/90 transition-colors"
          >
            Zurück zum Shop
          </button>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    triggerHaptic('medium');
    setStep(2);
  };

  const handleCompleteOrder = async () => {
    setIsProcessing(true);
    triggerHaptic('success');

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    clearCart();

    // Award loyalty points
    if (user && totalPrice > 0) {
      const pointsEarned = Math.floor(totalPrice / 10); // 1 point per €10
      console.log(`🏆 Awarding ${pointsEarned} loyalty points for order worth €${totalPrice}`);

      awardLoyaltyPoints(
        user.id,
        pointsEarned,
        `Bestellung abgeschlossen (€${totalPrice})`,
        `order_${Date.now()}`
      );
    }

    setStep(3);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="rounded-full p-2 hover:bg-white/10 transition-colors touch-target"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold gradient-text">Checkout</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Step 1: Review Order */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-accent">1</span>
              </div>
              <h2 className="text-2xl font-bold text-text">Bestellung überprüfen</h2>
            </div>
            
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-white/10">
                  <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-8 h-8 bg-accent/20 rounded" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text">{item.name}</h3>
                    <p className="text-sm text-muted">{item.variant}</p>
                    <p className="text-sm text-muted">Anzahl: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-text">{formatCurrency(item.price * item.quantity, 'de-DE', 'EUR')}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-text">Gesamt</span>
                <span className="text-2xl font-bold text-accent">{formatCurrency(totalPrice, 'de-DE', 'EUR')}</span>
              </div>
              <p className="text-sm text-muted mt-1">{totalItems} Artikel</p>

              {/* Loyalty Points Preview */}
              {user && totalPrice > 0 && (
                <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-orange-400" />
                    <span className="text-slate-300">
                      Verdiene <span className="font-bold text-orange-400">
                        {Math.floor(totalPrice / 10)} Loyalty-Punkte
                      </span> mit dieser Bestellung
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Aktueller Status: {getTierInfo().name} • {currentPoints} Punkte
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-accent text-black rounded-xl font-bold text-lg hover:bg-accent/90 transition-colors touch-target"
            >
              Zur Zahlung
            </button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-accent">2</span>
              </div>
              <h2 className="text-2xl font-bold text-text">Zahlungsmethode</h2>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-4 rounded-xl border transition-colors ${
                  paymentMethod === 'card' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-white/10 bg-black/30 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium text-text">Kreditkarte</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`w-full p-4 rounded-xl border transition-colors ${
                  paymentMethod === 'paypal' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-white/10 bg-black/30 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5" />
                  <span className="font-medium text-text">PayPal</span>
                </div>
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-black/20 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Truck className="h-4 w-4" />
                <span>Kostenloser Versand</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Shield className="h-4 w-4" />
                <span>SSL Verschlüsselung</span>
              </div>
            </div>

            <button
              onClick={handleCompleteOrder}
              disabled={isProcessing}
              className="w-full py-4 bg-accent text-black rounded-xl font-bold text-lg hover:bg-accent/90 transition-colors touch-target flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Wird bearbeitet...</span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  <span>Bestellung abschließen</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text mb-2">Bestellung erfolgreich!</h2>
              <p className="text-muted">Deine Bestellung wurde bearbeitet. Du erhältst eine Bestätigung per E-Mail.</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/shop'}
                className="w-full py-4 bg-accent text-black rounded-xl font-bold text-lg hover:bg-accent/90 transition-colors touch-target"
              >
                Weiter einkaufen
              </button>
              <button
                onClick={() => window.location.href = '/profile'}
                className="w-full py-3 bg-white/5 text-text rounded-xl font-semibold hover:bg-white/10 transition-colors touch-target"
              >
                Zum Profil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};




