import { memo, useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useShopStore } from "../../../store/shop";
import { ProductHeader } from "./ProductHeader";
import { ProductGallery } from "./ProductGallery";
import { MobileProductGallery } from "./MobileProductGallery";
import { ProductDetails } from "./ProductDetails";
import { ProductVariants } from "./ProductVariants";
import { ProductPricing } from "./ProductPricing";
import { ProductShipping } from "./ProductShipping";
import { ProductActions } from "./ProductActions";
import { MobileProductActions } from "./MobileProductActions";
import { ProductSidebar } from "./ProductSidebar";
import { ProductModalErrorBoundary } from "./ProductModalErrorBoundary";
import { ProductSkeleton } from "./ProductSkeleton";
import { useProductModalData } from "./hooks/useProductModalData";
import { useProductCalculations } from "./hooks/useProductCalculations";
import { useProductInteractions } from "./hooks/useProductInteractions";
import { useLoadingStates } from "./hooks/useLoadingStates";
import { AnimatedTransition } from "./AnimatedTransition";
import { StaggeredAnimation } from "./StaggeredAnimation";
import { LoadingSpinner } from "./LoadingSpinner";

// 🎯 Optimierte Hauptkomponente - nur noch Container-Logic
export const ProductModal = memo(() => {
  const { selectedProductId, closeProduct } = useShopStore((state) => ({
    selectedProductId: state.selectedProductId,
    closeProduct: state.closeProduct
  }));

  // 🚀 Custom Hooks für saubere Separation of Concerns
  const productData = useProductModalData(selectedProductId);
  const calculations = useProductCalculations(productData);
  const interactions = useProductInteractions({
    ...productData,
    isInterested: productData.product ? useShopStore.getState().interestedProducts[productData.product.id] || false : false
  });
  const loadingStates = useLoadingStates();

  // 📱 Mobile State Management
  const [isMobile, setIsMobile] = useState(false);
  const [modalHeight, setModalHeight] = useState('90vh');

  // 🎯 Responsive Height Calculation
  useEffect(() => {
    const updateHeight = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const isMobileView = vw < 768;
      setIsMobile(isMobileView);
      
      if (isMobileView) {
        setModalHeight(`${vh * 0.95}px`);
      } else {
        const maxHeight = Math.min(vh * 0.9, 800);
        setModalHeight(`${maxHeight}px`);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // 🎯 Close Handler mit Memoization
  const handleClose = useCallback(() => {
    closeProduct();
  }, [closeProduct]);

  if (!productData.product) {
    return null;
  }

  return (
    <Dialog.Root open={Boolean(productData.product)} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur" />
        <Dialog.Content 
          className={`fixed z-50 mx-auto flex w-full flex-col overflow-hidden border border-white/10 bg-gradient-to-br from-[#0B0B12] to-[#050505] shadow-2xl focus:outline-none ${
            isMobile 
              ? 'inset-0 rounded-none max-h-screen' 
              : 'inset-x-4 top-[3%] bottom-[3%] max-w-6xl rounded-3xl'
          }`}
          style={{ height: modalHeight }}
        >
          <ProductModalErrorBoundary>
            {loadingStates.isProductLoading ? (
              <ProductSkeleton isMobile={isMobile} />
            ) : (
              <AnimatedTransition direction="fade" duration={500}>
          {/* 🎯 Header mit Navigation */}
          <ProductHeader 
            product={productData.product}
            isMobile={isMobile}
            onClose={handleClose}
          />

          {/* 🎯 Main Content Area */}
          {isMobile ? (
            /* 🎯 Mobile Layout - Alles in einer Spalte */
            <div className="flex-1 overflow-y-auto scroll-smooth bg-gradient-to-br from-[#050505] to-[#0a0a0a]">
              <MobileProductGallery 
                product={productData.product}
                activeMedia={calculations.activeMedia}
                fallbackColor={calculations.fallbackColor}
                onThumbnailClick={interactions.handleThumbnailClick}
                // Pass variants and actions props to include them in overview section
                selection={productData.selection}
                accentColor={calculations.accentColor}
                onVariantSelect={interactions.handleVariantSelect}
                quantity={interactions.quantity}
                minQuantity={1}
                maxQuantity={Math.max(25, 1 * 5)}
                quickOptions={[1, 3, 5, 10]}
                isInterested={productData.isInterested}
                shareFeedback={interactions.shareFeedback}
                onQuantityChange={interactions.setQuantity}
                onAddToCart={interactions.handleAddToCart}
                onDirectCheckout={interactions.handleDirectCheckout}
                onInterestToggle={interactions.handleInterestToggle}
                onShare={interactions.handleShare}
              />
              
              <div className="space-y-2">
                <ProductDetails 
                  product={productData.product}
                  isMobile={isMobile}
                />
                
                <ProductShipping 
                  product={productData.product}
                  selectedShippingOption={productData.shippingSelection}
                  onShippingSelect={interactions.handleShippingSelect}
                  isMobile={isMobile}
                />
                
                <ProductPricing 
                  product={productData.product}
                  isMobile={isMobile}
                />
              </div>
            </div>
          ) : (
            /* 🎯 Desktop Layout - Zwei Spalten */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* 🎯 Left Content - Scrollable */}
              <div className="flex-1 overflow-y-auto scroll-smooth bg-gradient-to-br from-[#050505] to-[#0a0a0a] border-r border-white/10">
                <ProductGallery 
                  product={productData.product}
                  activeMedia={calculations.activeMedia}
                  fallbackColor={calculations.fallbackColor}
                  onThumbnailClick={interactions.handleThumbnailClick}
                  isMobile={isMobile}
                />
                
                <ProductDetails 
                  product={productData.product}
                  isMobile={isMobile}
                />
                
                <ProductShipping 
                  product={productData.product}
                  selectedShippingOption={productData.shippingSelection}
                  onShippingSelect={interactions.handleShippingSelect}
                  isMobile={isMobile}
                />
                
                <ProductPricing 
                  product={productData.product}
                  isMobile={isMobile}
                />
              </div>

              {/* 🎯 Right Sidebar - Sticky */}
              <ProductSidebar
                product={productData.product}
                selection={productData.selection}
                calculations={calculations}
                interactions={interactions}
                isMobile={isMobile}
              />
            </div>
          )}

          {/* 🎯 Close Button */}
          <Dialog.Close className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-muted transition hover:text-text">
            <X className="h-4 w-4" />
          </Dialog.Close>
              </AnimatedTransition>
            )}
          </ProductModalErrorBoundary>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
});

ProductModal.displayName = 'ProductModal';
