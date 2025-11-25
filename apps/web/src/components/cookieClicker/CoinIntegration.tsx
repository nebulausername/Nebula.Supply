import React, { useState, useEffect, useCallback } from 'react';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { useShopStore } from '../../store/shop';
import { useGlobalCartStore } from '../../store/globalCart';
import { cn } from '../../utils/cn';
import { ShoppingCart, Coins, TrendingUp, Zap, Star, Crown } from 'lucide-react';

// 🪙 COIN INTEGRATION - BALANCIERT & SCHWIERIGER!
export const CoinIntegration: React.FC = React.memo(() => {
  const { coins, coinMultiplier, coinShopDiscounts, buyCoinShopDiscount } = useCookieClickerStore();
  const { products } = useShopStore();
  // const { drops } = useGlobalCartStore(); // Temporarily disabled
  const [activeTab, setActiveTab] = useState<'overview' | 'shop' | 'discounts'>('overview');

  // 🎯 COIN SHOP DISCOUNTS - EXTREM SCHWIERIG!
  const availableDiscounts = [
    {
      id: 'product_discount_5',
      name: '5% Produkt Rabatt',
      description: '5% Rabatt auf alle Shop Produkte',
      discountPercent: 5,
      cost: 5000, // 5x TEURER!
      icon: '🛍️',
      type: 'product'
    },
    {
      id: 'product_discount_10',
      name: '10% Produkt Rabatt',
      description: '10% Rabatt auf alle Shop Produkte',
      discountPercent: 10,
      cost: 25000, // 5x TEURER!
      icon: '🛒',
      type: 'product'
    },
    {
      id: 'product_discount_15',
      name: '15% Produkt Rabatt',
      description: '15% Rabatt auf alle Shop Produkte',
      discountPercent: 15,
      cost: 75000, // 5x TEURER!
      icon: '💸',
      type: 'product'
    },
    {
      id: 'drop_discount_10',
      name: '10% Drop Rabatt',
      description: '10% Rabatt auf alle Drops',
      discountPercent: 10,
      cost: 10000, // 5x TEURER!
      icon: '🎁',
      type: 'drop'
    },
    {
      id: 'drop_discount_20',
      name: '20% Drop Rabatt',
      description: '20% Rabatt auf alle Drops',
      discountPercent: 20,
      cost: 40000, // 5x TEURER!
      icon: '🎊',
      type: 'drop'
    },
    {
      id: 'drop_discount_30',
      name: '30% Drop Rabatt',
      description: '30% Rabatt auf alle Drops',
      discountPercent: 30,
      cost: 125000, // 5x TEURER!
      icon: '🎉',
      type: 'drop'
    }
  ];

  // 🎯 DISCOUNT KAUFEN - EINFACH!
  const handleBuyDiscount = useCallback((discountId: string, cost: number) => {
    if (coins >= cost) {
      buyCoinShopDiscount(discountId, 0, cost); // 0 = discount wird automatisch berechnet
    }
  }, [coins, buyCoinShopDiscount]);

  // 🎯 AKTIVE DISCOUNTS ANZEIGEN
  const activeDiscounts = Object.entries(coinShopDiscounts).filter(([_, discount]) => discount > 0);

  return (
    <div className="space-y-6">
      {/* 🪙 COIN OVERVIEW - GEIL! */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Coins className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text">Coin System</h3>
              <p className="text-sm text-muted">Verdiene Coins durch Klicken!</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-500">{coins.toLocaleString()}</div>
            <div className="text-sm text-muted">Coins</div>
          </div>
        </div>

        {/* 🎯 COIN STATS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted">Multiplier</span>
            </div>
            <div className="text-lg font-bold text-green-500">{coinMultiplier}x</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted">Aktive Rabatte</span>
            </div>
            <div className="text-lg font-bold text-blue-500">{activeDiscounts.length}</div>
          </div>
        </div>
      </div>

      {/* 🎯 COIN SHOP TABS */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-200",
            activeTab === 'overview'
              ? "bg-yellow-500 text-black"
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
          Übersicht
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-200",
            activeTab === 'shop'
              ? "bg-yellow-500 text-black"
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
          Coin Shop
        </button>
        <button
          onClick={() => setActiveTab('discounts')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-200",
            activeTab === 'discounts'
              ? "bg-yellow-500 text-black"
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
          Rabatte
        </button>
      </div>

      {/* 🎯 OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="text-lg font-bold text-text mb-4">Wie funktioniert das Coin System?</h4>
            <div className="space-y-3 text-sm text-muted">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Klicke Kekse um Coins zu verdienen</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Coins werden durch Klicken und Gebäude verdient</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Kaufe Rabatte im Coin Shop</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Rabatte gelten für alle Produkte und Drops</span>
              </div>
            </div>
          </div>

          {/* 🎯 AKTIVE RABATTE */}
          {activeDiscounts.length > 0 && (
            <div className="bg-white/5 rounded-xl p-6">
              <h4 className="text-lg font-bold text-text mb-4">Aktive Rabatte</h4>
              <div className="space-y-2">
                {activeDiscounts.map(([discountId, discountPercent]) => {
                  const discount = availableDiscounts.find((d: any) => d.id === discountId);
                  if (!discount) return null;
                  
                  return (
                    <div key={discountId} className="flex items-center justify-between bg-green-500/10 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{discount.icon}</span>
                        <div>
                          <div className="font-medium text-text">{discount.name}</div>
                          <div className="text-sm text-muted">{discount.description}</div>
                        </div>
                      </div>
                      <div className="text-green-500 font-bold">+{discountPercent}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🎯 SHOP TAB */}
      {activeTab === 'shop' && (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="text-lg font-bold text-text mb-4">Coin Shop</h4>
            <p className="text-sm text-muted mb-6">Kaufe Rabatte mit deinen Coins!</p>
            
            <div className="grid gap-4">
              {availableDiscounts.map((discount: any) => {
                const hasDiscount = coinShopDiscounts[discount.id] > 0;
                const canAfford = coins >= discount.cost;
                
                return (
                  <div
                    key={discount.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all duration-200",
                      canAfford && !hasDiscount
                        ? "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 cursor-pointer"
                        : "border-white/10 bg-white/5 cursor-not-allowed opacity-50"
                    )}
                    onClick={() => !hasDiscount && canAfford && handleBuyDiscount(discount.id, discount.cost)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{discount.icon}</span>
                        <div>
                          <h3 className="font-semibold text-text">{discount.name}</h3>
                          <p className="text-xs text-muted">{discount.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-accent">{discount.cost.toLocaleString()} Coins</div>
                        {hasDiscount ? (
                          <div className="text-xs text-green-400">Gekauft!</div>
                        ) : (
                          <div className="text-xs text-red-400">EXTREM TEURER!</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🎯 DISCOUNTS TAB */}
      {activeTab === 'discounts' && (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="text-lg font-bold text-text mb-4">Rabatt Übersicht</h4>
            <p className="text-sm text-muted mb-6">Alle verfügbaren Rabatte im Überblick</p>
            
            <div className="grid gap-4">
              {availableDiscounts.map((discount: any) => {
                const hasDiscount = coinShopDiscounts[discount.id] > 0;
                
                return (
                  <div
                    key={discount.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all duration-200",
                      hasDiscount
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{discount.icon}</span>
                        <div>
                          <h3 className="font-semibold text-text">{discount.name}</h3>
                          <p className="text-xs text-muted">{discount.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-accent">{discount.cost.toLocaleString()} Coins</div>
                        {hasDiscount ? (
                          <div className="text-xs text-green-400">Aktiv!</div>
                        ) : (
                          <div className="text-xs text-muted">Nicht gekauft</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});