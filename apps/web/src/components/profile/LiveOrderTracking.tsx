import React, { useEffect, useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Activity,
  TrendingUp,
  Wifi,
  AlertCircle,
  WifiOff
} from 'lucide-react';
import { usePaymentWebSocket } from '../../hooks/usePaymentWebSocket';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../utils/cn';

interface OrderTrackingItem {
  id: string;
  orderId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  currentStep: number;
  totalSteps: number;
  steps: TrackingStep[];
  timestamp: string;
  items: string[];
}

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  eta?: string;
}

export const LiveOrderTracking: React.FC = () => {
  const { user } = useAuthStore();
  const { orderUpdates, isConnected } = usePaymentWebSocket(undefined, undefined, user?.id);
  const [orders, setOrders] = useState<OrderTrackingItem[]>([]);

  // Initialize with mock data
  useEffect(() => {
    if (user) {
      const mockOrders: OrderTrackingItem[] = [
        {
          id: 'order_1',
          orderId: 'NEB-ABC123',
          status: 'shipped',
          trackingNumber: '1Z999AA1234567890',
          carrier: 'DHL',
          estimatedDelivery: '2024-01-15',
          currentStep: 3,
          totalSteps: 4,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          items: ['Nebula Runner V2 Aurora-40', 'Starter Bundle'],
          steps: [
            {
              id: 'ordered',
              title: 'Bestellt',
              description: 'Bestellung erhalten',
              status: 'completed',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'processing',
              title: 'In Bearbeitung',
              description: 'Artikel werden vorbereitet',
              status: 'completed',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'shipped',
              title: 'Versendet',
              description: 'Paket ist unterwegs',
              status: 'current',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              eta: 'Morgen, 14:00-16:00'
            },
            {
              id: 'delivered',
              title: 'Zugestellt',
              description: 'Paket wurde zugestellt',
              status: 'pending'
            }
          ]
        },
        {
          id: 'order_2',
          orderId: 'NEB-DEF456',
          status: 'processing',
          currentStep: 2,
          totalSteps: 4,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          items: ['Galaxy Runner V2 Aurora-40'],
          steps: [
            {
              id: 'ordered',
              title: 'Bestellt',
              description: 'Bestellung erhalten',
              status: 'completed',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
            },
            {
              id: 'processing',
              title: 'In Bearbeitung',
              description: 'Bitcoin-Zahlung wird bestätigt',
              status: 'current'
            },
            {
              id: 'shipped',
              title: 'Versendet',
              description: 'Paket wird versendet',
              status: 'pending'
            },
            {
              id: 'delivered',
              title: 'Zugestellt',
              description: 'Paket wurde zugestellt',
              status: 'pending'
            }
          ]
        }
      ];
      setOrders(mockOrders);
    }
  }, [user]);

  // Update orders based on live updates
  useEffect(() => {
    setOrders(prevOrders => {
      const updatedOrders = [...prevOrders];

      orderUpdates.forEach(update => {
        const existingOrder = updatedOrders.find(o => o.orderId === update.orderId);

        if (existingOrder) {
          // Update existing order
          existingOrder.status = update.data.status || existingOrder.status;
          existingOrder.trackingNumber = update.data.trackingNumber || existingOrder.trackingNumber;
          existingOrder.carrier = update.data.carrier || existingOrder.carrier;

          // Update steps
          if (update.data.trackingSteps) {
            existingOrder.steps = update.data.trackingSteps.map((step: any, index: number) => ({
              id: step.id || `step_${index}`,
              title: step.title,
              description: step.description,
              status: step.completed ? 'completed' : step.current ? 'current' : 'pending',
              timestamp: step.completed ? step.completedAt : undefined,
              eta: step.eta
            }));
          }
        }
      });

      return updatedOrders;
    });
  }, [orderUpdates]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-400 bg-green-400/20';
      case 'shipped': return 'text-blue-400 bg-blue-400/20';
      case 'processing': return 'text-orange-400 bg-orange-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'shipped': return <Truck className="h-5 w-5 text-blue-400" />;
      case 'processing': return <Activity className="h-5 w-5 text-orange-400 animate-pulse" />;
      case 'cancelled': return <AlertCircle className="h-5 w-5 text-red-400" />;
      default: return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Bestellungen</h3>
          <p className="text-sm text-slate-400">Live-Tracking deiner Bestellungen</p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-400">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Live Updates Banner */}
      {orderUpdates.length > 0 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2 text-orange-400">
            <TrendingUp className="h-4 w-4 animate-pulse" />
            <span className="font-medium">Live-Updates aktiv</span>
            <span className="text-sm">({orderUpdates.length} Updates)</span>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Keine Bestellungen vorhanden</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{order.orderId}</span>
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                      getStatusColor(order.status)
                    )}>
                      {getStatusIcon(order.status)}
                      <span>{getStatusText(order.status)}</span>
                    </div>
                  </div>

                  <div className="text-sm text-slate-400">
                    {order.items.length} Artikel • {new Date(order.timestamp).toLocaleDateString('de-DE')}
                  </div>

                  {order.trackingNumber && (
                    <div className="text-xs text-blue-400 mt-1">
                      📦 {order.carrier}: {order.trackingNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="space-y-3">
                {order.steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      step.status === 'completed' && "bg-green-400/20 text-green-400",
                      step.status === 'current' && "bg-orange-400/20 text-orange-400",
                      step.status === 'pending' && "bg-slate-700 text-slate-400"
                    )}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : step.status === 'current' ? (
                        <Activity className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={cn(
                          "font-medium",
                          step.status === 'completed' && "text-green-400",
                          step.status === 'current' && "text-orange-400",
                          step.status === 'pending' && "text-slate-400"
                        )}>
                          {step.title}
                        </h4>
                        {step.timestamp && (
                          <span className="text-xs text-slate-500">
                            {new Date(step.timestamp).toLocaleTimeString('de-DE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-400 mt-1">{step.description}</p>

                      {step.eta && step.status === 'current' && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-orange-400">
                          <Clock className="h-3 w-3" />
                          <span>ETA: {step.eta}</span>
                        </div>
                      )}
                    </div>

                    {/* Connecting Line */}
                    {index < order.steps.length - 1 && (
                      <div className={cn(
                        "absolute left-4 w-0.5 h-8 mt-8",
                        step.status === 'completed' ? "bg-green-400" : "bg-slate-700"
                      )} style={{ marginLeft: '-16px' }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Fortschritt</span>
                  <span>{order.currentStep}/{order.totalSteps}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(order.currentStep / order.totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'delivered': return 'Zugestellt';
    case 'shipped': return 'Versendet';
    case 'processing': return 'In Bearbeitung';
    case 'cancelled': return 'Storniert';
    default: return 'Ausstehend';
  }
};


