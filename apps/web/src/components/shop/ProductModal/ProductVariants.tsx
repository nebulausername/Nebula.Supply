import { memo } from "react";
import type { Product, ProductVariant, VariantType, VariantOption } from "@nebula/shared";

const VARIANT_LABELS: Record<VariantType, string> = {
  color: "Farbe",
  size: "Größe"
};

interface VariantSelectorProps {
  variant: ProductVariant;
  selected?: string;
  accentColor: string;
  onSelect: (variantType: VariantType, optionId: string) => void;
}

// 🎯 Optimierte Variant-Selector-Komponente
const VariantSelector = memo(({ variant, selected, accentColor, onSelect }: VariantSelectorProps) => {
  const heading = VARIANT_LABELS[variant.type] ?? variant.name;

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-muted font-medium">{heading}</p>
      <div className="flex flex-wrap gap-2">
        {variant.options.map((option) => {
          const isActive = selected === option.id;
          const baseClasses = "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-300 min-h-[44px]";
          const stateClasses = isActive
            ? "bg-accent text-black shadow-lg shadow-accent/20 scale-105"
            : "bg-white/5 text-muted hover:bg-white/10 hover:text-text hover:border-accent/40 hover:scale-102 hover:shadow-md";
          
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(variant.type, option.id)}
              className={`${baseClasses} ${stateClasses}`}
              style={{ borderColor: isActive ? accentColor : "rgba(255,255,255,0.12)" }}
              aria-pressed={isActive}
            >
              {variant.type === "color" ? (
                <span
                  className="h-5 w-5 rounded-full border-2 border-white/30 shadow-sm"
                  style={{ backgroundColor: option.swatch ?? accentColor }}
                />
              ) : null}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

VariantSelector.displayName = 'VariantSelector';

interface ProductVariantsProps {
  product: Product;
  selection: Partial<Record<VariantType, string>>;
  accentColor: string;
  onVariantSelect: (variantType: VariantType, optionId: string) => void;
}

// 🎯 Optimierte Variants-Komponente
export const ProductVariants = memo(({ 
  product, 
  selection, 
  accentColor, 
  onVariantSelect 
}: ProductVariantsProps) => {
  if (!product.variants?.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      {product.variants.map((variant) => (
        <VariantSelector
          key={`${product.id}-${variant.type}`}
          variant={variant}
          selected={selection[variant.type]}
          accentColor={accentColor}
          onSelect={onVariantSelect}
        />
      ))}
    </div>
  );
});

ProductVariants.displayName = 'ProductVariants';
