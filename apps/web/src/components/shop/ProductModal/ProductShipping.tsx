import { memo, useState } from "react";
import type { Product } from "@nebula/shared";
import { formatCurrency } from "../../../utils/currency";
import { LandShippingModal } from "../LandShippingModal";
import { Truck, Info } from "lucide-react";
import { motion } from "framer-motion";

interface ProductShippingProps {
  product: Product;
  selectedShippingOption: string | null;
  onShippingSelect: (optionId: string) => void;
  isMobile: boolean;
}

// 🎯 Optimierte Shipping-Komponente
export const ProductShipping = memo(({ 
  product, 
  selectedShippingOption, 
  onShippingSelect, 
  isMobile 
}: ProductShippingProps) => {
  const [landShippingModalOpen, setLandShippingModalOpen] = useState(false);
  const formatPrice = (value: number, currency: string) => 
    formatCurrency(value, "de-DE", currency);

  // Find land shipping option
  const landShippingOption = product.shippingOptions.find(
    (opt) => opt.landShipping && opt.showLandShippingBadge
  );

  return (
    <section id="shipping" className={`${isMobile ? 'min-h-[60vh] p-4' : 'min-h-screen p-6 md:p-8'} bg-gradient-to-br from-[#050505] to-[#0a0a0a]`}>
      <div className={`${isMobile ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
        <div className={`${isMobile ? 'space-y-4' : 'space-y-8'}`}>
          <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-text`}>
            Versandoptionen
          </h2>
          
          {product.shippingOptions.length ? (
            <div className="grid gap-4">
              {product.shippingOptions.map((option) => {
                const isSelected = selectedShippingOption === option.id;
                const adjustment = option.priceAdjustment ?? 0;
                const adjustmentLabel =
                  adjustment === 0
                    ? "Kostenlos"
                    : `${adjustment > 0 ? "+" : "-"} ${formatPrice(Math.abs(adjustment), option.currency)}`;
                const leadTimeLabel = option.leadTime
                  ? typeof option.leadTime === 'object' 
                    ? `${(option.leadTime as any).min}${(option.leadTime as any).max ? `-${(option.leadTime as any).max}` : ""} ${(option.leadTime as any).unit}`
                    : option.leadTime
                  : "Sofort verfügbar";
                
                return (
                  <button
                    key={option.id}
                    onClick={() => onShippingSelect(option.id)}
                    className={`group w-full rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.02] ${
                      isMobile ? 'p-4 min-h-[60px]' : 'p-6'
                    } ${
                      isSelected
                        ? "border-accent bg-accent/10 shadow-xl shadow-accent/20"
                        : "border-white/10 hover:border-accent/40 hover:bg-white/5 hover:shadow-lg hover:shadow-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-text">{option.label}</h3>
                        <p className="text-muted">{leadTimeLabel}</p>
                        {option.description && (
                          <p className="text-sm text-muted/70">{option.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${
                          adjustment === 0 ? "text-accent" : "text-amber-400"
                        }`}>
                          {adjustmentLabel}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-amber-400/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚚</span>
                </div>
                <p className="text-lg text-muted">Keine Versandoptionen verfügbar</p>
                <p className="text-sm text-muted/70">
                  Kontaktiere uns für individuelle Versandlösungen
                </p>
              </div>
            </div>
          )}

          {/* 🎯 Landweg-Versand Badge */}
          {landShippingOption && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-xl border border-orange-500/30 bg-orange-500/10 ${
                isMobile ? 'p-4' : 'p-5'
              }`}
            >
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-text">Versand auf dem Landweg</span>
                    <button
                      onClick={() => setLandShippingModalOpen(true)}
                      className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                      <Info className="w-4 h-4 text-orange-400" />
                    </button>
                  </div>
                  {landShippingOption.landShippingDeliveryRange && (
                    <p className="text-sm text-muted">
                      Lieferung: {landShippingOption.landShippingDeliveryRange}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 🎯 Versand-Info */}
          <div className={`mt-6 rounded-2xl border border-white/10 bg-white/5 ${
            isMobile ? 'p-4' : 'p-6'
          }`}>
            <h3 className={`font-semibold text-text mb-3 ${
              isMobile ? 'text-base' : 'text-lg'
            }`}>Versandinformationen</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-muted text-sm">Kostenloser Versand ab 50€</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-muted text-sm">Sichere Verpackung</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-muted text-sm">Tracking verfügbar</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-muted text-sm">30 Tage Rückgaberecht</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Land Shipping Modal */}
      <LandShippingModal
        isOpen={landShippingModalOpen}
        onClose={() => setLandShippingModalOpen(false)}
        deliveryRange={landShippingOption?.landShippingDeliveryRange}
        message={landShippingOption?.landShippingMessage}
      />
    </section>
  );
});

ProductShipping.displayName = 'ProductShipping';
