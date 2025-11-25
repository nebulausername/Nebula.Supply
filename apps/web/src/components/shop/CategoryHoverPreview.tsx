import { memo, useEffect, useState, useRef } from "react";
import type { Product } from "@nebula/shared";
import { motion, AnimatePresence } from "framer-motion";
import { ProductImage } from "../media/ProductImage";

interface CategoryHoverPreviewProps {
  categoryId: string | null;
  products: Product[];
  isVisible: boolean;
}

export const CategoryHoverPreview = memo(
  ({ categoryId, products, isVisible }: CategoryHoverPreviewProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Reset index when category changes
    useEffect(() => {
      setCurrentIndex(0);
    }, [categoryId]);

    // Rotate through products every 2.5 seconds when visible
    useEffect(() => {
      if (!isVisible || products.length === 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }, 2500);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [isVisible, products.length]);

    // Get current product and its image
    const currentProduct = products[currentIndex];
    const currentImage = currentProduct?.media?.[0];

    if (!isVisible || !currentProduct || !currentImage) {
      return null;
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`${categoryId}-${currentIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed right-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          style={{
            maxWidth: "400px",
            width: "min(400px, 30vw)",
          }}
        >
          <div className="relative bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            {/* Product Image */}
            <div className="relative aspect-square mb-4 overflow-hidden rounded-xl">
              <ProductImage
                src={currentImage.url}
                alt={currentImage.alt || currentProduct.name}
                aspectRatio="1 / 1"
                className="w-full h-full"
                priority={true}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Product Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white line-clamp-2">
                {currentProduct.name}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">
                {currentProduct.description}
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xl font-bold text-white">
                  {new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: currentProduct.currency || "EUR",
                  }).format(currentProduct.price)}
                </span>
                {currentProduct.badges && currentProduct.badges.length > 0 && (
                  <div className="flex gap-1">
                    {currentProduct.badges.slice(0, 2).map((badge, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Counter */}
            {products.length > 1 && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                <span className="text-xs font-medium text-white">
                  {currentIndex + 1} / {products.length}
                </span>
              </div>
            )}

            {/* Progress Indicator */}
            {products.length > 1 && (
              <div className="absolute bottom-4 left-6 right-6 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-yellow-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

CategoryHoverPreview.displayName = "CategoryHoverPreview";


