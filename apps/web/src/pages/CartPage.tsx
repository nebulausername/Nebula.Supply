import { useEffect, useMemo, useState } from "react";
import type { Product } from "@nebula/shared";
import { AlertCircle, CheckCircle2, Minus, Plus, Trash2 } from "lucide-react";
import { useShopStore } from "../store/shop";
import { MobileCart } from "../components/shop/MobileCart";
import { useGlobalCartStore } from "../store/globalCart";
import { useMobileOptimizations } from "../components/MobileOptimizations";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { GamingRabattCTA } from "../components/checkout/GamingRabattCTA";
import { GamingDiscountSuccessModal } from "../components/checkout/GamingDiscountSuccessModal";
import { useGamingDiscountStore } from "../store/gamingDiscounts";
import { useBotCommandHandler } from "../utils/botCommandHandler";

const formatLeadTime = (leadTime: Product["leadTime"]) => {
  switch (leadTime) {
    case "same_day":
      return "Versand heute";
    case "2_days":
      return "Lieferzeit 2-4 Tage";
    case "1_week":
      return "Lieferzeit ca. 1 Woche";
    case "preorder":
      return "Preorder – Auslieferung nach Launch";
    default:
      return "Lieferzeit nach Bestätigung";
  }
};

export const CartPage = () => {
  const { isMobile } = useMobileOptimizations();
  const { executeCommand } = useBotCommandHandler();
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [discountSource, setDiscountSource] = useState<'coin' | 'gaming' | null>(null);
  const [showGamingSuccess, setShowGamingSuccess] = useState(false);
  const [usedGamingDiscount, setUsedGamingDiscount] = useState<{tier: '5%' | '10%' | '15%' | '20%', savings: number} | null>(null);
  const gamingDiscount = useGamingDiscountStore(state => 
    state.activeDiscountId ? state.availableDiscounts.find(d => d.id === state.activeDiscountId) : null
  );
  const setActiveGamingDiscount = useGamingDiscountStore(state => state.setActiveDiscount);

  // Use global cart instead of shop cart
  const {
    items: cart,
    totalItems,
    totalPrice,
    removeItem: removeFromCart,
    updateQuantity: updateCartQuantity,
    clearCart,
    getItemById
  } = useGlobalCartStore();

  const {
    products,
    coinRewards,
    coinsBalance,
    selectedRewardId,
    selectReward,
    clearReward,
    checkout,
    checkoutStatus,
    checkoutError,
    resetCheckoutStatus,
    orders,
    paymentMethods,
    selectedPaymentMethod,
    setPaymentMethod,
    paymentSession,
    clearPaymentSession
  } = useShopStore((state) => ({
    products: state.products,
    coinRewards: state.coinRewards,
    coinsBalance: state.coinsBalance,
    selectedRewardId: state.selectedRewardId,
    selectReward: state.selectReward,
    clearReward: state.clearReward,
    checkout: state.checkout,
    checkoutStatus: state.checkoutStatus,
    checkoutError: state.checkoutError,
    resetCheckoutStatus: state.resetCheckoutStatus,
    orders: state.orders,
    paymentMethods: state.paymentMethods,
    selectedPaymentMethod: state.selectedPaymentMethod,
    setPaymentMethod: state.setPaymentMethod,
    paymentSession: state.paymentSession,
    clearPaymentSession: state.clearPaymentSession
  }));

  // Use global cart for mobile cart component
  const globalCartItems = useGlobalCartStore((state) => state.items);
  const globalCartTotal = useGlobalCartStore((state) => state.totalPrice);

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check for bot commands in URL
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [executeCommand]);

  const lineItems = useMemo(() => {
    return cart
      .map((entry) => {
        const product = products.find((item) => item.id === (entry as any).productId);
        if (!product) return null;
        const variantLabels: string[] = [];
        product.variants?.forEach((variant) => {
          const optionId = (entry as any).selectedOptions?.[variant.type];
          const option = variant.options.find((opt) => opt.id === optionId);
          if (option) {
            variantLabels.push(`${variant.name}: ${option.label}`);
          }
        });
        return {
          product,
          quantity: entry.quantity,
          total: product.price * entry.quantity,
          variantLabels
        };
      })
      .filter((item): item is { product: typeof products[number]; quantity: number; total: number; variantLabels: string[] } => Boolean(item));
  }, [cart, products]);

  const subtotal = useMemo(() => lineItems.reduce((acc, item) => acc + item.total, 0), [lineItems]);
  
  // Coin Rewards
  const reward = coinRewards.find((tier) => tier.id === selectedRewardId) ?? null;
  const coinDiscount = reward ? reward.discountValue : 0;
  
  // Gaming Discounts
  const gamingDiscountValue = gamingDiscount 
    ? Math.floor(subtotal * (gamingDiscount.discountPercent / 100))
    : 0;
  
  // Total Discount (nur eine Quelle gleichzeitig)
  const discount = discountSource === 'gaming' ? gamingDiscountValue : coinDiscount;
  const total = Math.max(0, subtotal - discount);
  const coinsEarned = subtotal > 0 ? 100 + Math.ceil(subtotal * 0.05) : 0;

  const availableRewards = useMemo(
    () =>
      coinRewards.map((tier) => {
        const meetsSpend = subtotal >= tier.minSpend;
        const hasCoins = coinsBalance >= tier.coins;
        return {
          tier,
          eligible: meetsSpend && hasCoins,
          missingCoins: Math.max(0, tier.coins - coinsBalance),
          missingSpend: Math.max(0, tier.minSpend - subtotal)
        };
      }),
    [coinRewards, subtotal, coinsBalance]
  );

  const lastOrder = orders[0] ?? null;

  useEffect(() => {
    if (checkoutStatus === "succeeded") {
      // 🎮 GAMING-RABATT VERWENDEN! (EPIC!)
      if (discountSource === 'gaming' && gamingDiscount) {
        const useDiscount = useGamingDiscountStore.getState().useDiscount;
        useDiscount(gamingDiscount.id, subtotal);
        
        // Store info für Epic Success Modal
        setUsedGamingDiscount({
          tier: gamingDiscount.tier,
          savings: gamingDiscountValue
        });
        
        // Zeige Gaming Success Modal statt normalen Success
        setShowGamingSuccess(true);
        
        // Reset discount source
        setDiscountSource(null);
        setActiveGamingDiscount(null);
      } else {
        // Normaler Success (Coin-Rabatt oder kein Rabatt)
        setShowSuccess(true);
      }
      
      resetCheckoutStatus();
    }
  }, [checkoutStatus, resetCheckoutStatus, discountSource, gamingDiscount, subtotal, gamingDiscountValue, setActiveGamingDiscount]);

  const handleCheckout = async () => {
    // Validierung: Check ob Rabatt-Quelle gewählt wurde
    if (discountSource === 'gaming' && !gamingDiscount) {
      alert('Bitte wähle einen Gaming-Rabatt aus oder deaktiviere die Gaming-Rabatt Option.');
      return;
    }
    
    await checkout();
  };

  const handleDismissSuccess = () => {
    setShowSuccess(false);
    clearPaymentSession();
  };

  const handleDismissError = () => resetCheckoutStatus();

  // Mobile Cart Button
  if (isMobile) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505]">
        {/* 🎮 EPIC GAMING SUCCESS MODAL */}
        {showGamingSuccess && usedGamingDiscount && (
          <GamingDiscountSuccessModal
            isOpen={showGamingSuccess}
            discountTier={usedGamingDiscount.tier}
            savings={usedGamingDiscount.savings}
            onClose={() => {
              setShowGamingSuccess(false);
              setUsedGamingDiscount(null);
              clearPaymentSession();
            }}
          />
        )}

        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text">Warenkorb</h1>
              <p className="text-sm text-muted">
                {cart.length} Artikel • {formatCurrency(total)}
              </p>
            </div>

            {globalCartItems.length > 0 && (
              <button
                onClick={() => setShowMobileCart(true)}
                className="relative rounded-full bg-accent p-3 text-black hover:brightness-110 transition-all touch-target"
              >
                <ShoppingBag className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {globalCartItems.length}
                </div>
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="p-4 pb-24">
          {showSuccess && lastOrder && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 text-success">
              <CheckCircle2 className="mt-1 h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-success">Checkout bestätigt</p>
                <p className="text-xs text-success/80">
                  Order {lastOrder.id} · Betrag {formatCurrency(lastOrder.total)} · Coins +{lastOrder.coinsEarned}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismissSuccess}
                className="text-xs uppercase tracking-wide text-success hover:text-success/80"
              >
                OK
              </button>
            </div>
          )}

          {checkoutError && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-danger">
              <AlertCircle className="mt-1 h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger">Checkout fehlgeschlagen</p>
                <p className="text-xs text-danger/80">{checkoutError}</p>
              </div>
              <button
                type="button"
                onClick={handleDismissError}
                className="text-xs uppercase tracking-wide text-danger hover:text-danger/80"
              >
                OK
              </button>
            </div>
          )}

          {lineItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-white/5 p-12 mb-6">
                <ShoppingBag className="h-16 w-16 text-muted" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">Dein Warenkorb ist leer</h2>
              <p className="text-muted mb-8 max-w-md">
                Entdecke unsere exklusiven Kollektionen und füge deine Favoriten hinzu, um Coins zu verdienen.
              </p>
              <button
                onClick={() => window.location.href = '/shop'}
                className="rounded-xl bg-accent px-8 py-4 text-base font-semibold text-black hover:brightness-110 transition-all touch-target"
              >
                Shop erkunden
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              {lineItems.map(({ product, quantity, total, variantLabels }) => (
                <div
                  key={product.id}
                  className="bg-black/30 rounded-xl p-4 border border-white/5"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-black/50 rounded-lg overflow-hidden flex-shrink-0">
                      {product.media?.[0] ? (
                        <img
                          src={product.media[0].url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text truncate">{product.name}</h3>
                      <p className="text-sm text-muted truncate">{product.description}</p>

                      {!!variantLabels.length && (
                        <div className="mt-1 text-xs text-muted">
                          {variantLabels.join(", ")}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 bg-black/50 rounded-full p-1">
                          <button
                            onClick={() => updateCartQuantity(product.id, Math.max(0, quantity - 1))}
                            className="rounded-full p-1 bg-white/10 hover:bg-white/20 transition-colors touch-target"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 py-1 text-sm font-semibold text-text">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(product.id, quantity + 1)}
                            className="rounded-full p-1 bg-white/10 hover:bg-white/20 transition-colors touch-target"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-text">{formatCurrency(total)}</p>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-xs text-danger hover:text-danger/80 transition-colors touch-target mt-1"
                          >
                            Entfernen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Order Summary */}
              <div className="bg-black/50 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold text-text mb-3">Zusammenfassung</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Zwischensumme</span>
                    <span className="text-text">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Rabatt</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-accent">
                    <span>Coins verdienen</span>
                    <span>+{coinsEarned}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2">
                    <div className="flex justify-between text-lg font-bold text-text">
                      <span>Gesamt</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutStatus === "processing"}
                  className="w-full mt-4 rounded-xl bg-accent py-4 text-base font-semibold text-black hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 transition-all touch-target"
                >
                  {checkoutStatus === "processing" ? "Verarbeitung..." : "Checkout starten"}
                  <ArrowRight className="inline ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Cart Sheet */}
        <MobileCart
          isOpen={showMobileCart}
          onClose={() => setShowMobileCart(false)}
        />

        {/* Bottom Safe Area */}
        <div className="h-safe-area-inset-bottom bg-black" />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-24 pt-16 text-sm text-muted">
      {/* 🎮 EPIC GAMING SUCCESS MODAL */}
      {showGamingSuccess && usedGamingDiscount && (
        <GamingDiscountSuccessModal
          isOpen={showGamingSuccess}
          discountTier={usedGamingDiscount.tier}
          savings={usedGamingDiscount.savings}
          onClose={() => {
            setShowGamingSuccess(false);
            setUsedGamingDiscount(null);
            clearPaymentSession();
          }}
        />
      )}

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-text">Preorder Basket</h1>
        <p>
          Sammle Produkte, berechne Coins und starte den Nebula Pay Checkout mit garantiertem Idempotency-Key.
        </p>
      </div>

      {showSuccess && lastOrder && (
        <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 text-success">
          <CheckCircle2 className="mt-1 h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-success">Checkout bestätigt</p>
            <p className="text-xs text-success/80">
              Order {lastOrder.id} · Betrag {formatCurrency(lastOrder.total)} · Coins +{lastOrder.coinsEarned}
            </p>
            <p className="text-xs text-success/70">Payment Reference: {lastOrder.payment.reference}</p>
          </div>
          <button
            type="button"
            onClick={handleDismissSuccess}
            className="text-xs uppercase tracking-wide text-success hover:text-success/80"
          >
            Schließen
          </button>
        </div>
      )}

      {checkoutError && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-danger">
          <AlertCircle className="mt-1 h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-danger">Checkout fehlgeschlagen</p>
            <p className="text-xs text-danger/80">{checkoutError}</p>
          </div>
          <button
            type="button"
            onClick={handleDismissError}
            className="text-xs uppercase tracking-wide text-danger hover:text-danger/80"
          >
            OK
          </button>
        </div>
      )}

      {lineItems.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm">
          Dein Warenkorb ist leer. Füge Produkte über den Shop oder die Drops hinzu, um Coins zu sichern.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-4">
            {lineItems.map(({ product, quantity, total, variantLabels }) => (
              <article
                key={product.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-text">{product.name}</h3>
                  <p>{product.description}</p>
                  {!!variantLabels.length && (
                    <ul className="text-xs text-muted/80">
                      {variantLabels.map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-muted/70">{formatLeadTime(product.leadTime)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-3 py-1">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(product.id, Math.max(0, quantity - 1))}
                      className="rounded-full p-1 text-text transition hover:bg-white/10"
                      aria-label="Menge reduzieren"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm text-text">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(product.id, quantity + 1)}
                      className="rounded-full p-1 text-text transition hover:bg-white/10"
                      aria-label="Menge erhöhen"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text">{formatCurrency(total)}</p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      className="mt-1 flex items-center gap-1 text-xs text-muted transition hover:text-danger"
                    >
                      <Trash2 className="h-3 w-3" /> Entfernen
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="space-y-5 rounded-2xl border border-white/10 bg-black/25 p-5 text-sm">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-text">Zusammenfassung</h2>
              <div className="flex items-center justify-between">
                <span>Zwischensumme</span>
                <span className="text-text">{formatCurrency(subtotal)}</span>
              </div>
              {reward && (
                <div className="flex items-center justify-between text-accent">
                  <span>Reward {reward.reward}</span>
                  <span>-{formatCurrency(reward.discountValue)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-semibold text-text">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted">Coin Übersicht</p>
              <div className="flex items-center justify-between">
                <span>Aktuelles Guthaben</span>
                <span className="text-text">{coinsBalance} Coins</span>
              </div>
              {reward && (
                <div className="flex items-center justify-between text-accent">
                  <span>Redeem</span>
                  <span>-{reward.coins} Coins</span>
                </div>
              )}
              {coinsEarned > 0 && (
                <div className="flex items-center justify-between text-success">
                  <span>Earn nach Bezahlung</span>
                  <span>+{coinsEarned} Coins</span>
                </div>
              )}
            </div>

            {/* 🎮 ZOCKEN GEGEN RABATT - GEIL! */}
            <GamingRabattCTA
              subtotal={subtotal}
              selectedDiscountId={discountSource === 'gaming' ? useGamingDiscountStore.getState().activeDiscountId : null}
              onDiscountSelect={(id) => {
                if (id) {
                  setDiscountSource('gaming');
                  clearReward(); // Clear coin rewards
                } else {
                  setDiscountSource(null);
                }
              }}
            />

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted">Coin-Rewards</p>
              <div className="space-y-2">
                {availableRewards.map(({ tier, eligible, missingCoins, missingSpend }) => {
                  const isSelected = tier.id === selectedRewardId;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          clearReward();
                          setDiscountSource(null);
                        } else {
                          selectReward(tier.id);
                          setDiscountSource('coin');
                          setActiveGamingDiscount(null); // Clear gaming discount
                        }
                      }}
                      disabled={!eligible && !isSelected}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        isSelected
                          ? "border-accent/40 bg-accent/15 text-accent"
                          : eligible
                          ? "border-white/10 bg-white/5 text-text hover:border-accent/40 hover:text-accent"
                          : "border-white/5 bg-white/5 text-muted/70"
                      }`}
                    >
                      <p className="text-sm font-semibold">{tier.reward}</p>
                      <p className="text-xs text-muted">
                        {tier.coins} Coins · Mindestumsatz {formatCurrency(tier.minSpend)}
                        {!eligible && missingCoins > 0 && ` · ${missingCoins} Coins fehlen`}
                        {!eligible && missingSpend > 0 && ` · ${formatCurrency(missingSpend)} bis Mindestwert`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted">Zahlungsart</p>
              <div className="space-y-2">
                {paymentMethods.map((method) => {
                  const active = method.id === selectedPaymentMethod;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-accent/60 bg-accent/15 text-accent"
                          : "border-white/10 bg-white/5 text-muted hover:border-accent/30 hover:text-accent"
                      }`}
                    >
                      <p className="text-sm font-semibold text-text">{method.label}</p>
                      <p className="text-xs text-muted/80">{method.description}</p>
                      <p className="text-[11px] text-muted/60">Settlement: {method.settlementEta}{method.feeHint ? ` · ${method.feeHint}` : ""}</p>
                      <p className="text-[11px] text-muted/50">Anonymität: {method.anonymity === "high" ? "hoch" : method.anonymity === "medium" ? "mittel" : "niedrig"}{method.requiresReview ? " · Staff Review" : ""}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutStatus === "processing"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutStatus === "processing" ? "Nebula Pay wird vorbereitet..." : "Checkout starten"}
            </button>

            {paymentSession && (
              <div className="space-y-3 rounded-xl border border-accent/30 bg-black/20 p-4 text-xs text-muted">
                {(() => {
                  const label = paymentMethods.find((cfg) => cfg.id === paymentSession.method)?.label ?? paymentSession.method;
                  const statusLabel =
                    paymentSession.status === "confirmed"
                      ? "bestätigt"
                      : paymentSession.status === "awaiting_review"
                      ? "Review ausstehend"
                      : "ausstehend";
                  const statusTone = paymentSession.status === "confirmed" ? "text-success" : paymentSession.status === "awaiting_review" ? "text-warning" : "text-warning";
                  return (
                    <div className="flex items-center justify-between text-sm text-text">
                      <span>Zahlung {label}</span>
                      <span className={statusTone}>{statusLabel}</span>
                    </div>
                  );
                })()}
                <p className="font-mono text-sm text-text">Reference {paymentSession.reference}</p>
                {paymentSession.address && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                    <p className="text-muted">Adresse / Wallet</p>
                    <p className="break-all font-mono text-text">{paymentSession.address}</p>
                    {paymentSession.memo && <p className="mt-1 text-muted">Memo: {paymentSession.memo}</p>}
                  </div>
                )}
                {paymentSession.qrCode && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                    <p className="text-muted">URI / QR Payload</p>
                    <p className="break-all font-mono text-text">{paymentSession.qrCode}</p>
                  </div>
                )}
                {paymentSession.voucherHint && (
                  <div className="rounded-xl border border-accent/20 bg-accent/10 p-3 text-xs text-accent">
                    {paymentSession.voucherHint}
                  </div>
                )}
                <ul className="space-y-1">
                  {paymentSession.instructions.map((instruction) => (
                    <li key={instruction}>• {instruction}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted/70">Session läuft bis {new Date(paymentSession.expiresAt).toLocaleTimeString()}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};











