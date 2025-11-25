import { memo } from "react";
import type { Product, VariantType } from "@nebula/shared";
import { formatCurrency } from "../../../utils/currency";
import { ProductVariants } from "./ProductVariants";
import { ProductActions } from "./ProductActions";
import { MobileProductActions } from "./MobileProductActions";

interface ProductSidebarProps {
  product: Product;
  selection: Partial<Record<VariantType, string>>;
  calculations: {
    accentColor: string;
    unitPrice: number;
    totalPrice: number;
    shippingCost: number;
    shippingAdjustment: number;
    activeShippingOption: any;
    variantSummary: string;
  };
  interactions: {
    quantity: number;
    setQuantity: (value: number) => void;
    isInterested: boolean;
    shareFeedback: "idle" | "copied" | "shared" | "error";
    handleVariantSelect: (variantType: VariantType, optionId: string) => void;
    handleAddToCart: () => void;
    handleDirectCheckout: () => void;
    handleInterestToggle: () => void;
    handleShare: () => void;
  };
  isMobile: boolean;
}

// 🎯 Optimierte Sidebar-Komponente
export const ProductSidebar = memo(({ 
  product, 
  selection, 
  calculations, 
  interactions, 
  isMobile 
}: ProductSidebarProps) => {
  const formatPrice = (value: number, currency: string) => 
    formatCurrency(value, "de-DE", currency);

  const minQuantity = 1;
  const maxQuantity = Math.max(25, minQuantity * 5);
  const quickQuantityOptions = [1, 3, 5, 10].filter(value => value >= minQuantity && value <= maxQuantity);

  const shippingTone = calculations.shippingAdjustment === 0 
    ? "text-muted" 
    : calculations.shippingAdjustment > 0 
    ? "text-amber-400" 
    : "text-accent";

  const shippingAdjustmentDetail = !product || calculations.shippingAdjustment === 0
    ? "Versand kostenlos"
    : `${calculations.shippingAdjustment > 0 ? "+" : "-"} ${formatPrice(Math.abs(calculations.shippingAdjustment), product.currency)} Versand`;

  const shippingAdjustmentShort = !product || calculations.shippingAdjustment === 0
    ? "Kostenlos"
    : `${calculations.shippingAdjustment > 0 ? "+" : "-"} ${formatPrice(Math.abs(calculations.shippingAdjustment), product.currency)}`;

  return (
    <aside className={`flex w-full flex-col gap-6 border-t border-white/10 bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-sm text-sm text-muted md:w-[360px] md:border-t-0 md:border-l md:overflow-y-auto md:max-h-full ${
      isMobile ? 'p-4' : 'p-6'
    }`}>
      
      {/* 🎯 Pricing Summary */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Preis pro Einheit</p>
            <p className="text-2xl font-semibold text-text">
              {formatPrice(calculations.unitPrice, product.currency)}
            </p>
            <p className="text-xs text-muted">Basis: {formatPrice(calculations.unitPrice * interactions.quantity, product.currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted">Gesamt</p>
            <span className="text-3xl font-bold text-text transition-all duration-300">
              {formatPrice(calculations.totalPrice * interactions.quantity, product.currency)}
            </span>
            <p className={`text-sm font-medium ${shippingTone} transition-all duration-300`}>
              {shippingAdjustmentDetail}
            </p>
          </div>
        </div>
        
        {/* 🎯 Price Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <span className="text-muted">Versand</span>
            <span className={`font-bold transition-all duration-300 ${shippingTone}`}>
              {shippingAdjustmentShort}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <span className="text-muted">Route</span>
            <span className="text-text font-medium">
              {calculations.activeShippingOption?.label ?? "Standard"}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <span className="text-muted">Lieferzeit</span>
            <span className="text-text font-medium">
              {calculations.activeShippingOption?.leadTime ?? "Auf Anfrage"}
            </span>
          </div>
        </div>
      </div>

      {/* 🎯 Variants */}
      <ProductVariants
        product={product}
        selection={selection}
        accentColor={calculations.accentColor}
        onVariantSelect={interactions.handleVariantSelect}
      />

      {/* 🎯 Actions */}
      {isMobile ? (
        <MobileProductActions
          quantity={interactions.quantity}
          minQuantity={minQuantity}
          maxQuantity={maxQuantity}
          quickOptions={quickQuantityOptions}
          accentColor={calculations.accentColor}
          isInterested={interactions.isInterested}
          shareFeedback={interactions.shareFeedback}
          onQuantityChange={interactions.setQuantity}
          onAddToCart={interactions.handleAddToCart}
          onDirectCheckout={interactions.handleDirectCheckout}
          onInterestToggle={interactions.handleInterestToggle}
          onShare={interactions.handleShare}
        />
      ) : (
        <ProductActions
          quantity={interactions.quantity}
          minQuantity={minQuantity}
          maxQuantity={maxQuantity}
          quickOptions={quickQuantityOptions}
          accentColor={calculations.accentColor}
          isInterested={interactions.isInterested}
          shareFeedback={interactions.shareFeedback}
          isMobile={isMobile}
          onQuantityChange={interactions.setQuantity}
          onAddToCart={interactions.handleAddToCart}
          onDirectCheckout={interactions.handleDirectCheckout}
          onInterestToggle={interactions.handleInterestToggle}
          onShare={interactions.handleShare}
        />
      )}
    </aside>
  );
});

ProductSidebar.displayName = 'ProductSidebar';
