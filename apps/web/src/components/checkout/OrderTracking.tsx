import { useState, useEffect } from "react";
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { checkoutService, OrderStatus } from "../../api/checkoutService";
import { cn } from "../../utils/cn";

interface OrderTrackingProps {
  orderId: string;
  onClose?: () => void;
}

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle,
};

const statusColors = {
  pending: "text-yellow-400",
  confirmed: "text-blue-400",
  processing: "text-orange-400",
  shipped: "text-purple-400",
  delivered: "text-green-400",
  cancelled: "text-red-400",
};

const statusLabels = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
  processing: "Wird bearbeitet",
  shipped: "Versendet",
  delivered: "Zugestellt",
  cancelled: "Storniert",
};

export const OrderTracking = ({ orderId, onClose }: OrderTrackingProps) => {
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await checkoutService.getOrderStatus(orderId);
      setOrderStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Bestellinformationen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatus();
  }, [orderId]);

  const handleRefresh = () => {
    fetchOrderStatus();
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 mx-auto mb-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Lade Bestellstatus...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Fehler</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!orderStatus) {
    return (
      <div className="p-6 text-center">
        <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Bestellung nicht gefunden</h3>
        <p className="text-slate-400">Die Bestellung konnte nicht gefunden werden.</p>
      </div>
    );
  }

  const StatusIcon = statusIcons[orderStatus.status];
  const statusColor = statusColors[orderStatus.status];
  const statusLabel = statusLabels[orderStatus.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bestellverfolgung</h2>
          <p className="text-slate-400">Bestellung {orderId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Current Status */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          <div className={cn("p-3 rounded-full bg-slate-700", statusColor)}>
            <StatusIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{statusLabel}</h3>
            <p className="text-slate-400">
              {orderStatus.status === "delivered" 
                ? "Deine Bestellung wurde erfolgreich zugestellt!"
                : orderStatus.status === "shipped"
                ? "Deine Bestellung ist unterwegs"
                : orderStatus.status === "processing"
                ? "Deine Bestellung wird vorbereitet"
                : orderStatus.status === "confirmed"
                ? "Deine Zahlung wurde bestätigt"
                : "Deine Bestellung wird bearbeitet"
              }
            </p>
          </div>
        </div>

        {orderStatus.trackingNumber && (
          <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Tracking-Nummer</p>
                <p className="font-mono text-white">{orderStatus.trackingNumber}</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors">
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">Verfolgen</span>
              </button>
            </div>
          </div>
        )}

        {orderStatus.estimatedDelivery && (
          <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-400">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Geschätzte Lieferung: {new Date(orderStatus.estimatedDelivery).toLocaleDateString("de-DE", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Bestellverlauf</h3>
        
        <div className="space-y-4">
          {orderStatus.updates.map((update, index) => {
            const UpdateIcon = statusIcons[update.status as keyof typeof statusIcons] || Package;
            const updateColor = statusColors[update.status as keyof typeof statusColors] || "text-slate-400";
            const isLast = index === orderStatus.updates.length - 1;
            
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="relative">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                    isLast ? "bg-orange-500 border-orange-500" : "bg-slate-700 border-slate-600"
                  )}>
                    <UpdateIcon className={cn("h-4 w-4", isLast ? "text-white" : updateColor)} />
                  </div>
                  {!isLast && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-slate-600" />
                  )}
                </div>
                
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-white">
                      {statusLabels[update.status as keyof typeof statusLabels] || update.status}
                    </h4>
                    <span className="text-sm text-slate-400">
                      {new Date(update.timestamp).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-1">{update.message}</p>
                  {update.location && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" />
                      <span>{update.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <button className="flex-1 py-3 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">
          Support kontaktieren
        </button>
        <button className="flex-1 py-3 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">
          Rechnung herunterladen
        </button>
      </div>
    </div>
  );
};

