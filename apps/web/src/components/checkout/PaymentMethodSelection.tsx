import { useState, lazy, Suspense } from "react";
import {
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Shield,
  Clock,
  Zap,
  Bitcoin,
  Banknote,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2
} from "lucide-react";
import { CheckoutData } from "./CheckoutFlow";
import { cn } from "../../utils/cn";

// Lazy load heavy payment components for better performance
const CashPaymentFlow = lazy(() => import("./CashPaymentFlow").then(module => ({ default: module.CashPaymentFlow })));
const BtcPaymentView = lazy(() => import("./BtcPaymentView").then(module => ({ default: module.BtcPaymentView })));
const CryptoVoucherView = lazy(() => import("./CryptoVoucherView").then(module => ({ default: module.CryptoVoucherView })));

// Loading component for lazy loaded payment methods
const PaymentMethodLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
      <span className="text-slate-300">Lade Zahlungsmethode...</span>
    </div>
  </div>
);

interface PaymentMethodSelectionProps {
  data: CheckoutData;
  onChange: (data: CheckoutData) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const paymentMethods = [
  {
    id: "btc_chain",
    name: "Bitcoin (BTC)",
    description: "Taproot-Adresse für hohe Privatsphäre",
    icon: Bitcoin,
    badge: "Empfohlen",
    badgeColor: "bg-orange-500/20 text-orange-400",
    features: ["Taproot Addresses", "Keine KYC", "Schnell"],
    anonymity: "high",
    fee: "Dynamisch",
    eta: "10-30 Minuten"
  },
  {
    id: "crypto_voucher",
    name: "Crypto Voucher",
    description: "Kaufe Voucher, sende Code",
    icon: Banknote,
    badge: "Flexibel",
    badgeColor: "bg-purple-500/20 text-purple-400",
    features: ["Bar bezahlbar", "Prepaid möglich", "Keine Krypto nötig"],
    anonymity: "medium",
    fee: "Keine",
    eta: "Sofort"
  },
  {
    id: "cash_meetup",
    name: "Barzahlung",
    description: "Selfie-Verifikation + Safe-Meet Treffpunkt",
    icon: Smartphone,
    badge: "Lokal",
    badgeColor: "bg-yellow-500/20 text-yellow-400",
    features: ["100% Anonym", "Bar bezahlen", "Persönlich"],
    anonymity: "high",
    fee: "Keine",
    eta: "Nach Termin"
  }
];

const getAnonymityIcon = (level: string) => {
  switch (level) {
    case "high":
      return <Shield className="h-4 w-4 text-green-400" />;
    case "medium":
      return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    case "low":
      return <Info className="h-4 w-4 text-blue-400" />;
    default:
      return <Info className="h-4 w-4 text-slate-400" />;
  }
};

const getAnonymityText = (level: string) => {
  switch (level) {
    case "high":
      return "Maximale Privatsphäre";
    case "medium":
      return "Moderate Privatsphäre";
    case "low":
      return "Standard Privatsphäre";
    default:
      return "Unbekannt";
  }
};

export const PaymentMethodSelection = ({ data, onChange, onNext, onPrevious }: PaymentMethodSelectionProps) => {
  const [selectedMethod, setSelectedMethod] = useState(data.paymentMethod);
  const [showCashFlow, setShowCashFlow] = useState(false);
  const [showBtcPayment, setShowBtcPayment] = useState(false);
  const [showVoucherView, setShowVoucherView] = useState(false);

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    onChange({
      ...data,
      paymentMethod: methodId,
      paymentDetails: {},
    });
  };

  const handleNext = () => {
    if (!selectedMethod) {
      return;
    }
    
    // Wenn Bargeld ausgewählt wurde, zeige den Cash Flow
    if (selectedMethod === "cash_meetup") {
      setShowCashFlow(true);
      return;
    }

    // Wenn BTC ausgewählt wurde, zeige die BTC Payment View
    if (selectedMethod === "btc_chain") {
      setShowBtcPayment(true);
      return;
    }

    // Wenn Crypto Voucher ausgewählt wurde, zeige die Voucher View
    if (selectedMethod === "crypto_voucher") {
      setShowVoucherView(true);
      return;
    }

    onNext();
  };

  const handleCashComplete = () => {
    setShowCashFlow(false);
    onNext();
  };

  const handleCashCancel = () => {
    setShowCashFlow(false);
    setSelectedMethod("");
  };

  const handleBtcPaymentComplete = (txHash: string) => {
    setShowBtcPayment(false);
    // Here you would typically verify the transaction and proceed
    console.log('BTC payment completed with txHash:', txHash);
    onNext();
  };

  const handleBtcPaymentCancel = () => {
    setShowBtcPayment(false);
    setSelectedMethod("");
  };

  const handleVoucherValidated = (result: any) => {
    setShowVoucherView(false);
    // Here you would typically verify the voucher and proceed
    console.log('Voucher validated:', result);
    onNext();
  };

  const handleVoucherCancel = () => {
    setShowVoucherView(false);
    setSelectedMethod("");
  };

  // Zeige Cash Flow wenn aktiv
  if (showCashFlow) {
    return (
      <Suspense fallback={<PaymentMethodLoader />}>
        <CashPaymentFlow
          data={data}
          amount={data.cartTotal || 0}
          onComplete={handleCashComplete}
          onCancel={handleCashCancel}
        />
      </Suspense>
    );
  }

  // Zeige BTC Payment wenn aktiv
  if (showBtcPayment) {
    return (
      <Suspense fallback={<PaymentMethodLoader />}>
        <BtcPaymentView
          amount={data.cartTotal || 0}
          orderId={`order_${Date.now()}`}
          onPaymentDetected={handleBtcPaymentComplete}
          onCancel={handleBtcPaymentCancel}
        />
      </Suspense>
    );
  }

  // Zeige Crypto Voucher wenn aktiv
  if (showVoucherView) {
    return (
      <Suspense fallback={<PaymentMethodLoader />}>
        <CryptoVoucherView
          amount={data.cartTotal || 0}
          onVoucherValidated={handleVoucherValidated}
          onCancel={handleVoucherCancel}
        />
      </Suspense>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <div
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={cn(
                "relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                isSelected
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
              )}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="h-6 w-6 text-orange-400" />
                </div>
              )}

              {/* Badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("px-3 py-1 rounded-full text-xs font-medium", method.badgeColor)}>
                  {method.badge}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  {getAnonymityIcon(method.anonymity)}
                  <span>{getAnonymityText(method.anonymity)}</span>
                </div>
              </div>

              {/* Method Info */}
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-slate-700">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{method.name}</h3>
                  <p className="text-sm text-slate-400">{method.description}</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-4">
                {method.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Info */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{method.eta}</span>
                </div>
                <div>
                  {method.fee !== "Keine" && (
                    <span>Fee: {method.fee}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Method Details */}
      {selectedMethod && (
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="font-semibold text-white mb-4">Zahlungsdetails</h3>
          
          {selectedMethod === "btc_chain" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Bitcoin className="h-5 w-5 text-orange-400" />
                  <span className="font-medium text-orange-400">Bitcoin Zahlung</span>
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  Du erhältst eine einmalige Taproot-Adresse, die automatisch über Bitomatics Nodes gemixt wird.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Maximale Privatsphäre durch Coin-Mixing</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Empfohlene Fee wird dynamisch berechnet</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Bestätigung nach 1 Block (10-30 Minuten)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedMethod === "crypto_voucher" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Banknote className="h-5 w-5 text-purple-400" />
                  <span className="font-medium text-purple-400">Crypto Voucher</span>
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  Kaufe einen Krypto-Voucher (z.B. bei dundle.com) und sende den Code.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Bar oder Prepaid bezahlbar</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Keine Krypto-Kenntnisse nötig</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Sofortige Bestätigung nach Code-Check</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedMethod === "cash_meetup" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Smartphone className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium text-yellow-400">Bargeld Treffen</span>
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  Selfie-Verifikation + Treffpunkt-Vorschlag durch unser Staff.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>100% Anonyme Barzahlung</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Safe-Meet Partner</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Persönlicher Service</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-700">
        <button
          onClick={onPrevious}
          className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Zurück</span>
        </button>

        <button
          onClick={handleNext}
          disabled={!selectedMethod}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300",
            selectedMethod
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105 shadow-lg"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          )}
        >
          <span>Bestellung prüfen</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};