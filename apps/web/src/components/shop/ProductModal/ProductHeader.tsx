import { memo } from "react";
import type { Product } from "@nebula/shared";
import { ProductNavigation } from "./ProductNavigation";

interface ProductHeaderProps {
  product: Product;
  isMobile: boolean;
  onClose: () => void;
}

// 🎯 Optimierte Header-Komponente
export const ProductHeader = memo(({ product, isMobile, onClose }: ProductHeaderProps) => {
  return (
    <>
      {/* 🎯 Floating Navigation - nur für Desktop */}
      {!isMobile && <ProductNavigation isMobile={isMobile} />}
      
      {/* 🎯 Product Title */}
      <div className={`${isMobile ? 'p-4 pb-2' : 'p-6 pb-4'} border-b border-white/10`}>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-text mb-2`}>
          {product.name}
        </h1>
        
        {/* 🎯 Badges */}
        {product.badges?.length ? (
          <div className="flex flex-wrap gap-2">
            {product.badges.map((badge) => (
              <span 
                key={badge} 
                className="rounded-full bg-accent/20 text-accent px-3 py-1 text-sm font-semibold border border-accent/30"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
});

ProductHeader.displayName = 'ProductHeader';
