import { memo } from "react";
import type { Product } from "@nebula/shared";
import { formatCurrency } from "../../../utils/currency";

interface ProductPricingProps {
  product: Product;
  isMobile: boolean;
}

// 🎯 Optimierte Pricing-Komponente
export const ProductPricing = memo(({ product, isMobile }: ProductPricingProps) => {
  const formatPrice = (value: number, currency: string) => 
    formatCurrency(value, "de-DE", currency);

  return (
    <section id="pricing" className={`${isMobile ? 'min-h-[60vh] p-4' : 'min-h-screen p-6 md:p-8'} bg-gradient-to-br from-[#0a0a0a] to-[#050505]`}>
      <div className={`${isMobile ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
        <div className={`${isMobile ? 'space-y-4' : 'space-y-8'}`}>
          <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-text`}>
            Mengenrabatte
          </h2>
          
          {product.pricingTiers?.length ? (
            <div className="grid gap-4">
              {product.pricingTiers.map((tier) => (
                <div 
                  key={tier.minQuantity} 
                  className={`rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 ${
                    isMobile ? 'p-4' : 'p-6'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-text">
                        ab {tier.minQuantity} Stück
                      </h3>
                      <p className="text-muted">Mengenrabatt</p>
                    </div>
                    <span className="text-2xl font-bold text-accent">
                      {formatPrice(tier.price, product.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-lg text-muted">Keine Mengenrabatte verfügbar</p>
                <p className="text-sm text-muted/70">
                  Kontaktiere uns für individuelle Angebote bei größeren Mengen
                </p>
              </div>
            </div>
          )}

          {/* 🎯 Preisvergleich */}
          <div className={`mt-6 rounded-2xl border border-accent/20 bg-accent/5 ${
            isMobile ? 'p-4' : 'p-6'
          }`}>
            <h3 className={`font-semibold text-text mb-3 ${
              isMobile ? 'text-base' : 'text-lg'
            }`}>Preisvergleich</h3>
            <div className="grid gap-2">
              <div className={`flex justify-between items-center rounded-lg bg-white/5 ${
                isMobile ? 'p-2' : 'p-3'
              }`}>
                <span className="text-muted text-sm">Einzelpreis</span>
                <span className="text-text font-semibold text-sm">
                  {formatPrice(product.price, product.currency)}
                </span>
              </div>
              <div className={`flex justify-between items-center rounded-lg bg-white/5 ${
                isMobile ? 'p-2' : 'p-3'
              }`}>
                <span className="text-muted text-sm">Bulk-Preis (10+ Stück)</span>
                <span className="text-accent font-semibold text-sm">
                  {formatPrice(product.price * 0.9, product.currency)}
                </span>
              </div>
              <div className={`flex justify-between items-center rounded-lg bg-accent/10 border border-accent/20 ${
                isMobile ? 'p-2' : 'p-3'
              }`}>
                <span className="text-text font-semibold text-sm">Ersparnis</span>
                <span className="text-accent font-bold text-sm">
                  {formatPrice(product.price * 0.1, product.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

ProductPricing.displayName = 'ProductPricing';
