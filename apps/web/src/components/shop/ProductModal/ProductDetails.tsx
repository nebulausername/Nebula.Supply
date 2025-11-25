import { memo } from "react";
import type { Product } from "@nebula/shared";

interface ProductDetailsProps {
  product: Product;
  isMobile: boolean;
}

// 🎯 Optimierte Details-Komponente
export const ProductDetails = memo(({ product, isMobile }: ProductDetailsProps) => {
  return (
    <section id="details" className={`${isMobile ? 'min-h-[60vh] p-4' : 'min-h-screen p-6 md:p-8'} bg-gradient-to-br from-[#0a0a0a] to-[#050505]`}>
      <div className={`${isMobile ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
        <div className={`${isMobile ? 'space-y-4' : 'space-y-8'}`}>
          <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-text`}>
            Produktdetails
          </h2>
          
          {/* 🎯 Beschreibung */}
          {product.description && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-text">Beschreibung</h3>
              <p className="text-lg text-muted leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
          
          {/* 🎯 Spezifikationen */}
          {(product as any).specifications && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-text">Spezifikationen</h3>
              <div className="grid gap-3">
                {Object.entries((product as any).specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-4 rounded-xl border border-white/10 bg-white/5">
                    <span className="text-muted font-medium">{key}:</span>
                    <span className="text-text font-semibold">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🎯 Features */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-text">Features</h3>
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1'}`}>
              <div className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 ${
                isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-text">Premium Materialien</span>
              </div>
              <div className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 ${
                isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-text">Nachhaltige Produktion</span>
              </div>
              <div className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 ${
                isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-text">2 Jahre Garantie</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

ProductDetails.displayName = 'ProductDetails';
