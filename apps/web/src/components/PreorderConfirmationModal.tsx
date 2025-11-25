import { useState, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { 
  AlertTriangle, 
  CheckCircle, 
  CreditCard, 
  X, 
  Shield, 
  Clock,
  Package,
  Truck,
  Users
} from "lucide-react";
import type { DropReservation, InviteStatus } from "@nebula/shared";
import { formatCurrency } from "../utils/currency";
import { cn } from "../utils/cn";

interface PreorderConfirmationProps {
  reservation: DropReservation | null;
  inviteStatus: InviteStatus | null;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const PREORDER_WARNING = `
⚠️ PREORDER IST VERBINDLICH

• Du bestätigst eine verbindliche Bestellung
• Zahlung wird sofort abgebucht
• Stornierung nur in Ausnahmefällen möglich
• Preorder kann nicht rückgängig gemacht werden

Bist du sicher, dass du fortfahren möchtest?
`;

const formatPrice = (value: number, currency: string) => 
  formatCurrency(value, "de-DE", currency);

export const PreorderConfirmationModal = ({
  reservation,
  inviteStatus,
  onConfirm,
  onCancel,
  isProcessing = false
}: PreorderConfirmationProps) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  const canConfirm = useMemo(() => {
    console.log('🔍 PreorderConfirmation canConfirm check:', {
      reservation: !!reservation,
      inviteRequired: reservation?.inviteRequired,
      hasInvite: inviteStatus?.hasInvite,
      acceptedTerms,
      isProcessing
    });
    
    if (!reservation) return false;
    if (reservation.inviteRequired && inviteStatus && !inviteStatus.hasInvite) return false;
    const result = acceptedTerms && !isProcessing;
    
    console.log('🎯 canConfirm result:', result);
    return result;
  }, [reservation, inviteStatus, acceptedTerms, isProcessing]);

  const estimatedDelivery = useMemo(() => {
    if (!reservation) return "Auf Anfrage";
    // Simple estimation based on variant type
    if (reservation.variantLabel.includes("VIP")) return "48-72h";
    if (reservation.variantLabel.includes("Express")) return "24-48h";
    return "3-7 Tage";
  }, [reservation]);

  if (!reservation) return null;

  return (
    <Dialog.Root open={Boolean(reservation)} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur" />
        <Dialog.Content className="fixed inset-x-4 top-[10%] z-50 mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B0B12] to-[#050505] shadow-2xl focus:outline-none">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div className="space-y-2">
                <Dialog.Title className="text-2xl font-bold text-text">
                  Preorder bestätigen
                </Dialog.Title>
                <p className="text-sm text-muted">
                  Verbindliche Bestellung für {reservation.dropName}
                </p>
              </div>
              <Dialog.Close className="rounded-full border border-white/10 p-2 text-muted transition hover:text-text">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            {/* Warning Banner */}
            {showWarning && (
              <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-amber-400">Verbindliche Bestellung</h3>
                    <p className="text-sm text-amber-400/80">
                      Diese Preorder ist verbindlich. Die Zahlung wird sofort abgebucht und kann nur in Ausnahmefällen storniert werden.
                    </p>
                    <button
                      onClick={() => setShowWarning(false)}
                      className="text-xs text-amber-400/60 hover:text-amber-400 transition"
                    >
                      Verstanden, ausblenden
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reservation Details */}
            <div className="mb-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-3 text-lg font-semibold text-text">Bestelldetails</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Drop</span>
                    <span className="font-semibold text-text">{reservation.dropName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Variante</span>
                    <span className="font-semibold text-text">{reservation.variantLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Menge</span>
                    <span className="font-semibold text-text">{reservation.quantity}x</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Einzelpreis</span>
                    <span className="font-semibold text-text">
                      {formatPrice(reservation.unitPrice, reservation.currency)}
                    </span>
                  </div>
                  {reservation.shippingCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Versand</span>
                      <span className="font-semibold text-text">
                        {formatPrice(reservation.shippingCost, reservation.currency)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-text">Gesamt</span>
                      <span className="text-xl font-bold text-accent">
                        {formatPrice(reservation.total, reservation.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text">
                  <Truck className="h-5 w-5" />
                  Lieferinformationen
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Geschätzte Lieferzeit</span>
                    <span className="font-semibold text-text">{estimatedDelivery}</span>
                  </div>
                  {reservation.shippingLabel && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Versandart</span>
                      <span className="font-semibold text-text">{reservation.shippingLabel}</span>
                    </div>
                  )}
                  {reservation.originLabel && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Fulfillment</span>
                      <span className="font-semibold text-text">{reservation.originLabel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invite Status */}
              {reservation.inviteRequired && (
                <div className={cn(
                  "rounded-2xl border p-4",
                  inviteStatus?.hasInvite
                    ? "border-accent/30 bg-accent/10"
                    : "border-red-400/30 bg-red-400/10"
                )}>
                  <div className="flex items-center gap-3">
                    {inviteStatus?.hasInvite ? (
                      <CheckCircle className="h-5 w-5 text-accent" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    )}
                    <div>
                      <h3 className={cn(
                        "font-semibold",
                        inviteStatus?.hasInvite ? "text-accent" : "text-red-400"
                      )}>
                        {inviteStatus?.hasInvite ? "Invite bestätigt" : "Invite erforderlich"}
                      </h3>
                      <p className="text-sm text-muted">
                        {inviteStatus?.hasInvite
                          ? `Zugang bestätigt (Rang: ${inviteStatus.rank}).` 
                          : "Du benötigst mindestens 1 erfolgreiche Einladung, um diesen Drop zu bestellen."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="mb-6">
              <div 
                className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg border border-white/10 hover:border-accent/30 transition-all"
                onClick={() => setAcceptedTerms(!acceptedTerms)}
              >
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    e.stopPropagation();
                    console.log('📋 Terms checkbox changed:', e.target.checked);
                    setAcceptedTerms(e.target.checked);
                  }}
                  className="mt-1 h-5 w-5 rounded border-2 border-white/20 bg-black/50 text-accent focus:ring-2 focus:ring-accent/40 transition-all group-hover:border-accent/50 cursor-pointer"
                />
                <div className="text-sm text-muted group-hover:text-white transition-colors">
                  <p>
                    <span className="font-semibold text-white">Ich bestätige, dass ich die{" "}
                    <a href="#" className="text-accent hover:text-accent/80 underline">
                      Allgemeinen Geschäftsbedingungen
                    </a>{" "}
                    und{" "}
                    <a href="#" className="text-accent hover:text-accent/80 underline">
                      Widerrufsbelehrung
                    </a>{" "}
                    gelesen habe und akzeptiere.</span>
                  </p>
                  <p className="mt-1 text-xs text-muted/80">
                    Diese Preorder ist verbindlich und kann nur in Ausnahmefällen storniert werden.
                  </p>
                </div>
              </div>
              
              {/* Visual feedback when terms not accepted */}
              {!acceptedTerms && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-400/20">
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold">Bitte akzeptiere die Bedingungen um fortzufahren</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  console.log('🎯 PreorderConfirmation Button clicked:', { canConfirm, acceptedTerms, isProcessing });
                  if (canConfirm) {
                    onConfirm();
                  }
                }}
                disabled={!canConfirm}
                className={cn(
                  "flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  canConfirm
                    ? "bg-accent text-black hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/30"
                    : "cursor-not-allowed bg-surface/40 text-muted"
                )}
                title={!acceptedTerms ? "Bitte akzeptiere die Bedingungen" : !canConfirm ? "Bestellung nicht möglich" : "Bestellung bestätigen"}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    Verarbeite...
                  </div>
                ) : !acceptedTerms ? (
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Bedingungen akzeptieren
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Jetzt bestellen!
                  </div>
                )}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
