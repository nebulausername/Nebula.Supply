import { useState } from "react";
import { 
  Package, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Shield,
  Truck,
  Clock,
  Zap,
  Edit3,
  Trash2
} from "lucide-react";
import { useGlobalCartStore } from "../../store/globalCart";
import { CheckoutData } from "./CheckoutFlow";
import { formatCurrency } from "../../utils/currency";
import { cn } from "../../utils/cn";

interface OrderSummaryProps {
  items: any[];
  checkoutData: CheckoutData;
  onComplete: () => void;
  isProcessing: boolean;
  onChange?: (data: CheckoutData) => void;
  onPrevious?: () => void;
}

const paymentMethodIcons = {
  nebula_pay: Zap,
  btc_chain: Package,
  eth_chain: Package,
  crypto_voucher: Package,
  sepa_transfer: CreditCard,
  cash_meetup: Package,
};

const paymentMethodNames = {
  nebula_pay: "Nebula Pay",
  btc_chain: "Bitcoin",
  eth_chain: "Ethereum",
  crypto_voucher: "Crypto Voucher",
  sepa_transfer: "SEPA Überweisung",
  cash_meetup: "Bargeld Treffen",
};

export const OrderSummary = ({ items, checkoutData, onComplete, isProcessing, onChange, onPrevious }: OrderSummaryProps) => {
  const { totalPrice, totalItems } = useGlobalCartStore();
  const [termsAccepted, setTermsAccepted] = useState(checkoutData.termsAccepted);
  const [marketingConsent, setMarketingConsent] = useState(checkoutData.marketingConsent);

  const shippingCost = totalPrice >= 25 ? 0 : 4.99;
  const subtotal = totalPrice;
  const total = subtotal + shippingCost;

  const PaymentIcon = paymentMethodIcons[checkoutData.paymentMethod as keyof typeof paymentMethodIcons] || Package;

  const handleComplete = () => {
    if (!termsAccepted) {
      return;
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
          <Package className="h-5 w-5 text-orange-400" />
          Bestellte Artikel ({totalItems})
        </h3>
        
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-600 flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-slate-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate">{item.name}</h4>
                <p className="text-sm text-slate-400 truncate">{item.variant}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-300">Anzahl: {item.quantity}</span>
                  {item.type === 'drop' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                      Drop
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-white">
                  {formatCurrency(item.price * item.quantity, "EUR")}
                </div>
                {item.quantity > 1 && (
                  <div className="text-xs text-slate-400">
                    {item.quantity} × {formatCurrency(item.price, "EUR")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
          <MapPin className="h-5 w-5 text-blue-400" />
          Lieferadresse
        </h3>
        
        <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
          <div className="text-white font-medium">
            {checkoutData.shippingAddress.firstName} {checkoutData.shippingAddress.lastName}
          </div>
          {checkoutData.shippingAddress.company && (
            <div className="text-slate-300">{checkoutData.shippingAddress.company}</div>
          )}
          <div className="text-slate-300">
            {checkoutData.shippingAddress.address1}
            {checkoutData.shippingAddress.address2 && (
              <span>, {checkoutData.shippingAddress.address2}</span>
            )}
          </div>
          <div className="text-slate-300">
            {checkoutData.shippingAddress.postalCode} {checkoutData.shippingAddress.city}
          </div>
          <div className="text-slate-300">{checkoutData.shippingAddress.country}</div>
          {checkoutData.shippingAddress.phone && (
            <div className="text-slate-300 mt-1">{checkoutData.shippingAddress.phone}</div>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-purple-400" />
          Zahlungsart
        </h3>
        
        <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-600">
              <PaymentIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-white">
                {paymentMethodNames[checkoutData.paymentMethod as keyof typeof paymentMethodNames]}
              </div>
              <div className="text-sm text-slate-400">
                {checkoutData.paymentMethod === "nebula_pay" && "Schnellste und sicherste Option"}
                {checkoutData.paymentMethod === "btc_chain" && "Taproot-Adresse, automatisch gemixt"}
                {checkoutData.paymentMethod === "eth_chain" && "Stealth Vault, frische Adresse"}
                {checkoutData.paymentMethod === "crypto_voucher" && "Kaufe Voucher, sende Code"}
                {checkoutData.paymentMethod === "sepa_transfer" && "Klassische Banküberweisung"}
                {checkoutData.paymentMethod === "cash_meetup" && "Selfie + Safe-Meet Treffpunkt"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Instructions */}
      {checkoutData.deliveryInstructions && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-3">
            <Truck className="h-5 w-5 text-green-400" />
            Lieferhinweise
          </h3>
          
          <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
            <p className="text-slate-300">{checkoutData.deliveryInstructions}</p>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Preisübersicht</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Zwischensumme</span>
            <span className="text-white">{formatCurrency(subtotal, "EUR")}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Versand</span>
            <span className="text-white">
              {shippingCost === 0 ? (
                <span className="text-green-400">Kostenlos</span>
              ) : (
                formatCurrency(shippingCost, "EUR")
              )}
            </span>
          </div>
          
          {shippingCost > 0 && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Truck className="h-4 w-4" />
                <span>Kostenloser Versand ab 25€ verfügbar</span>
              </div>
            </div>
          )}
          
          <div className="border-t border-slate-600 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Gesamt</span>
              <span className="text-xl font-bold text-orange-400">
                {formatCurrency(total, "EUR")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              if (onChange) {
                onChange({
                  ...checkoutData,
                  termsAccepted: e.target.checked,
                });
              }
            }}
            className="w-5 h-5 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2 mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-slate-300">
            Ich habe die{" "}
            <a href="/terms" className="text-orange-400 hover:text-orange-300 underline">
              Allgemeinen Geschäftsbedingungen
            </a>{" "}
            und die{" "}
            <a href="/privacy" className="text-orange-400 hover:text-orange-300 underline">
              Datenschutzerklärung
            </a>{" "}
            gelesen und akzeptiere sie. *
          </label>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="marketing"
            checked={marketingConsent}
            onChange={(e) => {
              setMarketingConsent(e.target.checked);
              if (onChange) {
                onChange({
                  ...checkoutData,
                  marketingConsent: e.target.checked,
                });
              }
            }}
            className="w-5 h-5 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2 mt-0.5"
          />
          <label htmlFor="marketing" className="text-sm text-slate-300">
            Ich möchte über neue Produkte, Drops und exklusive Angebote per E-Mail informiert werden.
            (Optional)
          </label>
        </div>
      </div>

      {/* Security Features */}
      <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="h-5 w-5 text-green-400" />
          <h4 className="font-medium text-white">Sichere Bestellung</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>SSL-Verschlüsselung</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>DSGVO konform</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>Sichere Zahlung</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-700">
        <button
          onClick={onPrevious || (() => window.history.back())}
          className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors touch-target"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Zurück</span>
        </button>

        <button
          onClick={handleComplete}
          disabled={!termsAccepted || isProcessing}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 touch-target",
            termsAccepted && !isProcessing
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105 shadow-lg"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Wird verarbeitet...</span>
            </>
          ) : (
            <>
              <span>Bestellung abschließen</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

