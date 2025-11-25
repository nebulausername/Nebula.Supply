import React, { memo, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '../../lib/api/ecommerce';
import type { Category } from '../../lib/api/ecommerce';

interface VirtualizedProductGridProps {
  products: Product[];
  selectedProducts: Set<string>;
  onSelect: (productId: string, checked: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onUpdate: (productId: string, field: string, value: any) => void;
  loadedImages: Set<string>;
  onImageLoad: (id: string) => void;
  categories: Category[];
  containerWidth: number;
  containerHeight: number;
}

export const VirtualizedProductGrid = memo(({
  products,
  selectedProducts,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onAdjustStock,
  onUpdate,
  loadedImages,
  onImageLoad,
  categories,
  containerWidth,
  containerHeight,
}: VirtualizedProductGridProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const lastScrollTop = useRef(0);

  // Calculate grid dimensions - optimized with better breakpoints
  const columnsPerRow = useMemo(() => {
    if (containerWidth >= 1920) return 4; // xl
    if (containerWidth >= 1280) return 3; // lg
    if (containerWidth >= 768) return 2;  // md
    return 1; // sm
  }, [containerWidth]);

  const gap = 16; // Gap between items
  const cardHeight = 400; // Approximate card height
  const rowHeight = cardHeight + gap;
  
  const rowCount = Math.ceil(products.length / columnsPerRow);
  const totalHeight = rowCount * rowHeight;

  // Optimized scroll handler with throttling and direction detection
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    
    // Only update if scroll position changed significantly (performance optimization)
    if (Math.abs(currentScrollTop - lastScrollTop.current) < 5) {
      return;
    }
    
    lastScrollTop.current = currentScrollTop;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(currentScrollTop);
    });
  }, []);

  // Calculate visible range with dynamic overscan based on scroll speed
  const overscan = useMemo(() => {
    // Increase overscan for smoother scrolling
    return 3;
  }, []);

  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      rowCount - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );
    return { startRow, endRow };
  }, [scrollTop, rowHeight, containerHeight, rowCount, overscan]);

  // Get visible products - optimized with memoization
  const visibleProducts = useMemo(() => {
    const visible: Array<{ product: Product; index: number; row: number; col: number }> = [];
    
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = 0; col < columnsPerRow; col++) {
        const index = row * columnsPerRow + col;
        if (index < products.length) {
          visible.push({
            product: products[index],
            index,
            row,
            col,
          });
        }
      }
    }
    
    return visible;
  }, [products, visibleRange, columnsPerRow]);

  // Calculate offset for positioning
  const offsetY = visibleRange.startRow * rowHeight;

  // Intersection Observer for lazy loading images
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const productId = entry.target.getAttribute('data-product-id');
            if (productId && !loadedImages.has(productId)) {
              onImageLoad(productId);
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    const productElements = containerRef.current.querySelectorAll('[data-product-id]');
    productElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [visibleProducts, loadedImages, onImageLoad]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (products.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto w-full"
      style={{ 
        height: containerHeight,
        willChange: 'scroll-position', // Performance hint
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsPerRow}, 1fr)`,
            gap: `${gap}px`,
            padding: `${gap}px`,
            willChange: 'transform', // Performance hint
          }}
        >
          {visibleProducts.map(({ product, index }) => {
            const isSelected = selectedProducts.has(product.id);
            return (
              <div
                key={product.id}
                data-product-id={product.id}
                style={{
                  height: cardHeight,
                  minHeight: cardHeight,
                }}
              >
                <ProductCard
                  product={product}
                  isSelected={isSelected}
                  onSelect={(checked) => onSelect(product.id, checked)}
                  onEdit={() => onEdit(product)}
                  onDelete={() => onDelete(product)}
                  onDuplicate={() => onDuplicate(product)}
                  onAdjustStock={() => onAdjustStock(product)}
                  onUpdate={(field, value) => onUpdate(product.id, field, value)}
                  loadedImages={loadedImages}
                  onImageLoad={onImageLoad}
                  categories={categories}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
VirtualizedProductGrid.displayName = 'VirtualizedProductGrid';
