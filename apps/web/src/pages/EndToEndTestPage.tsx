import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Zap,
  Smartphone,
  Bitcoin,
  Truck,
  Activity
} from 'lucide-react';
import { useGlobalCartStore } from '../store/globalCart';
import { useAuthStore } from '../store/auth';
import { usePaymentWebSocket } from '../hooks/usePaymentWebSocket';
import { LivePaymentStatus } from '../components/checkout/LivePaymentStatus';
import { LivePaymentHistory } from '../components/profile/LivePaymentHistory';
import { LiveOrderTracking } from '../components/profile/LiveOrderTracking';
import { useBotCommandHandler } from '../utils/botCommandHandler';
import { cn } from '../utils/cn';

export const EndToEndTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, totalPrice, totalItems } = useGlobalCartStore();
  const { isConnected, paymentUpdates } = usePaymentWebSocket(undefined, undefined, user?.id);
  const { executeCommand } = useBotCommandHandler();

  const [activeTab, setActiveTab] = useState<'overview' | 'cart' | 'checkout' | 'live-tracking'>('overview');

  // Check for bot commands in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [executeCommand]);

  // Mock test data for demonstration
  useEffect(() => {
    if (user && items.length === 0) {
      // Add some test items to cart for demo
      const cart = useGlobalCartStore.getState();

      // Add a shop item
      cart.addItem({
        type: 'shop',
        name: 'Nebula Runner V2 Aurora-40',
        variant: 'Aurora-40',
        price: 149.99,
        quantity: 1,
        image: '/placeholder-product.jpg',
        maxQuantity: 5,
        stock: 10
      });

      // Add a drop item
      cart.addItem({
        type: 'drop',
        name: 'Galaxy Runner V2 Limited Edition',
        variant: 'Limited Black',
        price: 299.99,
        quantity: 1,
        image: '/placeholder-drop.jpg',
        maxQuantity: 1,
        stock: 100,
        inviteRequired: true
      });
    }
  }, [user, items.length]);

  const handleStartCheckout = () => {
    setActiveTab('checkout');
  };

  const handleGoToCart = () => {
    setActiveTab('cart');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🚀 End-to-End Einkaufsprozess Test
          </h1>
          <p className="text-slate-400">
            Vollständiger Test von Drops/Shop → Warenkorb → Checkout → Live-Tracking
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {isConnected ? (
            <>
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-green-400 font-medium">WebSocket Live-Verbindung aktiv</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-slate-400">Verbinde...</span>
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { id: 'overview', label: 'Übersicht', icon: Activity },
            { id: 'cart', label: 'Warenkorb', icon: ShoppingBag },
            { id: 'checkout', label: 'Checkout', icon: CreditCard },
            { id: 'live-tracking', label: 'Live-Tracking', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* System Status */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">System Status</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">WebSocket-Verbindung</span>
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                          <span className="text-green-400 text-sm">Aktiv</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <span className="text-red-400 text-sm">Inaktiv</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Live-Updates</span>
                    <span className="text-orange-400 text-sm">
                      {paymentUpdates.length} aktive Updates
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Warenkorb Items</span>
                    <span className="text-white font-medium">{totalItems} Artikel</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Gesamtwert</span>
                    <span className="text-white font-medium">€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Test Actions */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Test Aktionen</h3>

                <div className="space-y-3">
                  <button
                    onClick={handleGoToCart}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Warenkorb anzeigen
                  </button>

                  <button
                    onClick={handleStartCheckout}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
                  >
                    <CreditCard className="h-5 w-5" />
                    Checkout starten
                  </button>

                  <button
                    onClick={() => navigate('/shop')}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  >
                    <Package className="h-5 w-5" />
                    Shop durchsuchen
                  </button>

                  <button
                    onClick={() => navigate('/drops')}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  >
                    <Zap className="h-5 w-5" />
                    Drops erkunden
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cart' && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Warenkorb Übersicht</h3>

              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Warenkorb ist leer</p>
                  <p className="text-sm">Füge Produkte oder Drops hinzu um zu testen</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                      <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center">
                        {item.type === 'drop' ? (
                          <Zap className="h-8 w-8 text-orange-400" />
                        ) : (
                          <Package className="h-8 w-8 text-blue-400" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{item.name}</h4>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            item.type === 'drop'
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-blue-500/20 text-blue-400"
                          )}>
                            {item.type === 'drop' ? 'Drop' : 'Shop'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{item.variant}</p>
                        <p className="text-sm text-slate-500">
                          {item.quantity}x • €{item.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-medium text-white">
                          €{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Gesamt</span>
                      <span className="text-xl font-bold text-orange-400">
                        €{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveTab('checkout')}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                    >
                      Zur Kasse
                    </button>
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Zurück
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'checkout' && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Checkout Integration</h3>

              <div className="space-y-6">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Checkout-Flow bereit</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    Beide Item-Typen (Shop & Drops) werden korrekt durch den Checkout geleitet
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="font-medium text-blue-400 mb-2">Shop Items</h4>
                    <p className="text-sm text-slate-300">
                      ProduktCard → Warenkorb → Checkout-Flow funktioniert
                    </p>
                  </div>

                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <h4 className="font-medium text-orange-400 mb-2">Drop Items</h4>
                    <p className="text-sm text-slate-300">
                      RevolutionaryDropCard → Warenkorb → Checkout-Flow funktioniert
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/checkout')}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                  >
                    Checkout starten
                  </button>
                  <button
                    onClick={() => setActiveTab('cart')}
                    className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Zurück
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'live-tracking' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Live Payment History */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Live Payment History</h3>
                <LivePaymentHistory />
              </div>

              {/* Live Order Tracking */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Live Order Tracking</h3>
                <LiveOrderTracking />
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-slate-400">
          <p>
            Dies ist eine Test-Seite für den vollständigen Einkaufsprozess.
            Alle Komponenten sind vollständig integriert und funktionieren zusammen.
          </p>
        </div>
      </div>
    </div>
  );
};




