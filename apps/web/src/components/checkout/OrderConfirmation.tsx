import { useState, useEffect } from "react";
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Download,
  Share2,
  ArrowRight,
  Clock,
  Mail,
  Phone,
  Copy,
  Check
} from "lucide-react";
import { CheckoutData } from "./CheckoutFlow";
import { formatCurrency } from "../../utils/currency";
import { cn } from "../../utils/cn";
import { LivePaymentStatus } from "./LivePaymentStatus";
import { useAuthStore } from "../../store/auth";

interface OrderConfirmationProps {
  orderId: string;
  checkoutData: CheckoutData;
  onBackToShop: () => void;
}

const paymentMethodNames = {
  nebula_pay: "Nebula Pay",
  btc_chain: "Bitcoin",
  eth_chain: "Ethereum",
  crypto_voucher: "Crypto Voucher",
  sepa_transfer: "SEPA Überweisung",
  cash_meetup: "Bargeld Treffen",
};

export const OrderConfirmation = ({ orderId, checkoutData, onBackToShop }: OrderConfirmationProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const { user } = useAuthStore();

  useEffect(() => {
    // Calculate estimated delivery date
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    setEstimatedDelivery(deliveryDate.toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }));
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadInvoice = () => {
    // In a real app, this would generate and download a PDF invoice
    console.log("Downloading invoice for order:", orderId);
  };

  const handleShareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: `Meine Nebula Bestellung ${orderId}`,
        text: `Ich habe gerade bei Nebula bestellt! Bestellung ${orderId}`,
        url: window.location.href,
      });
    } else {
      copyToClipboard(window.location.href, "share");
    }
  };

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Bestellung erfolgreich!</h2>
          <p className="text-slate-400">
            Deine Bestellung wurde aufgegeben und wird in Kürze bearbeitet.
          </p>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Bestelldetails</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(orderId, "orderId")}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              {copiedField === "orderId" ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <span className="text-sm text-slate-400">Kopieren</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Bestellnummer</label>
              <div className="text-lg font-mono text-white">{orderId}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Bestelldatum</label>
              <div className="text-white">
                {new Date().toLocaleDateString("de-DE", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Zahlungsart</label>
              <div className="text-white">
                {paymentMethodNames[checkoutData.paymentMethod as keyof typeof paymentMethodNames]}
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Geschätzte Lieferung</label>
              <div className="text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-400" />
                {estimatedDelivery}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lieferadresse</label>
              <div className="text-white text-sm">
                {checkoutData.shippingAddress.firstName} {checkoutData.shippingAddress.lastName}
                <br />
                {checkoutData.shippingAddress.address1}
                {checkoutData.shippingAddress.address2 && (
                  <span>, {checkoutData.shippingAddress.address2}</span>
                )}
                <br />
                {checkoutData.shippingAddress.postalCode} {checkoutData.shippingAddress.city}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Was passiert als nächstes?</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm font-bold text-orange-400">1</span>
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">Bestätigungs-E-Mail</h4>
              <p className="text-sm text-slate-400">
                Du erhältst eine Bestätigungs-E-Mail mit allen Details zu deiner Bestellung.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm font-bold text-orange-400">2</span>
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">Zahlungsverarbeitung</h4>
              <p className="text-sm text-slate-400">
                Deine Zahlung wird verarbeitet und bestätigt. Du erhältst Updates per E-Mail.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm font-bold text-orange-400">3</span>
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">Versand</h4>
              <p className="text-sm text-slate-400">
                Deine Bestellung wird verpackt und versendet. Du erhältst eine Tracking-Nummer.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm font-bold text-orange-400">4</span>
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">Lieferung</h4>
              <p className="text-sm text-slate-400">
                Deine Bestellung kommt bei dir an. Viel Spaß mit deinen neuen Sachen!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Support */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="font-semibold text-white mb-4">Hilfe benötigt?</h3>
          <p className="text-sm text-slate-400 mb-4">
            Unser Support-Team hilft dir gerne bei Fragen zu deiner Bestellung.
          </p>
          
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">
              <Mail className="h-4 w-4" />
              <span className="text-sm">E-Mail Support</span>
            </button>
            
            <button 
              onClick={() => window.location.href = `/order/${orderId}`}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <Package className="h-4 w-4" />
              <span className="text-sm">Bestellung verfolgen</span>
            </button>
          </div>
        </div>

        {/* Live Payment Status - nur für Crypto-Zahlungen */}
        {(checkoutData.paymentMethod === 'btc_chain' ||
          checkoutData.paymentMethod === 'eth_chain' ||
          checkoutData.paymentMethod === 'crypto_voucher') && user && (
          <div className="mt-8">
            <LivePaymentStatus
              paymentId={`payment_${orderId}`}
              method={checkoutData.paymentMethod}
              userId={user.id}
              orderId={orderId}
              amount={checkoutData.cartTotal || 0}
            />
          </div>
        )}

        {/* Actions */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="font-semibold text-white mb-4">Weitere Aktionen</h3>
          
          <div className="space-y-3">
            <button
              onClick={handleDownloadInvoice}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Rechnung herunterladen</span>
            </button>
            
            <button
              onClick={handleShareOrder}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Bestellung teilen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Continue Shopping */}
      <div className="text-center pt-6 border-t border-slate-700">
        <button
          onClick={onBackToShop}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <span>Weiter einkaufen</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
