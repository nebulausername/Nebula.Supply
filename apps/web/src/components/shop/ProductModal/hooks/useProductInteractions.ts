import { useCallback, useState } from "react";
import { useShopStore } from "../../../../store/shop";
import { useGlobalCartStore, addShopItemToCart } from "../../../../store/globalCart";
import { showToast } from "../../../../store/toast";
import type { Product, VariantType } from "@nebula/shared";

interface ProductInteractionsProps {
  product: Product | null;
  selection: Partial<Record<VariantType, string>>;
  isInterested: boolean;
}

// 🎯 Optimierter Hook für alle Interaktionen
export const useProductInteractions = ({ product, selection, isInterested }: ProductInteractionsProps) => {
  const {
    selectVariant,
    selectShippingOption,
    toggleInterest,
    addToCart,
    checkout,
    closeProduct
  } = useShopStore((state) => ({
    selectVariant: state.selectVariant,
    selectShippingOption: state.selectShippingOption,
    toggleInterest: state.toggleInterest,
    addToCart: state.addToCart,
    checkout: state.checkout,
    closeProduct: state.closeProduct
  }));

  // 🎯 Global Cart Store für bessere UX
  const { openCart } = useGlobalCartStore();

  // 🎯 State für Interaktionen
  const [quantity, setQuantity] = useState(1);
  const [shareFeedback, setShareFeedback] = useState<"idle" | "copied" | "shared" | "error">("idle");

  // 🎯 Variant Selection
  const handleVariantSelect = useCallback((variantType: VariantType, optionId: string) => {
    if (!product) return;
    selectVariant(product.id, variantType, optionId);
  }, [product, selectVariant]);

  // 🎯 Shipping Selection
  const handleShippingSelect = useCallback((optionId: string) => {
    if (!product) return;
    selectShippingOption(product.id, optionId);
  }, [product, selectShippingOption]);

  // 🎯 Thumbnail Click
  const handleThumbnailClick = useCallback((mediaId: string, colorValue?: string) => {
    if (!product) return;
    if (colorValue) {
      // Find color option by value and select it
      const colorVariant = product.variants?.find(v => v.type === "color");
      if (colorVariant) {
        const option = colorVariant.options.find(opt => opt.value === colorValue);
        if (option) {
          selectVariant(product.id, "color", option.id);
          return;
        }
      }
    }
    // TODO: Handle manual media selection
  }, [product, selectVariant]);

  // 🎯 Add to Cart - Optimiert mit Global Cart Integration
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    
    try {
      // Add to shop store cart
      addToCart(product.id, quantity);
      
      // Create variant object for global cart
      const variant = {
        label: Object.values(selection).join(' - ') || 'Standard',
        basePrice: product.price,
        price: product.price,
        media: product.media,
        maxQuantity: 10,
        stock: 100
      };
      
      // Add to global cart with better UX
      const success = addShopItemToCart(product, variant, quantity);
      
      if (success) {
        showToast.success(
          'Erfolgreich hinzugefügt!', 
          `${product.name} wurde zum Warenkorb hinzugefügt`
        );
        closeProduct();
      } else {
        showToast.error(
          'Fehler beim Hinzufügen', 
          'Artikel konnte nicht zum Warenkorb hinzugefügt werden'
        );
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast.error(
        'Fehler beim Hinzufügen', 
        'Ein unerwarteter Fehler ist aufgetreten'
      );
    }
  }, [product, quantity, selection, addToCart, closeProduct]);

  // 🎯 Direct Checkout - Optimiert mit besserer UX
  const handleDirectCheckout = useCallback(async () => {
    if (!product) return;
    
    try {
      // Add to shop store cart
      addToCart(product.id, quantity);
      
      // Create variant object for global cart
      const variant = {
        label: Object.values(selection).join(' - ') || 'Standard',
        basePrice: product.price,
        price: product.price,
        media: product.media,
        maxQuantity: 10,
        stock: 100
      };
      
      // Add to global cart
      const success = addShopItemToCart(product, variant, quantity);
      
      if (success) {
        showToast.success(
          'Zur Kasse weitergeleitet', 
          'Warenkorb wird geöffnet...'
        );
        
        // Open global cart for immediate checkout
        openCart();
        closeProduct();
        
        // Navigate to checkout after a short delay
        setTimeout(() => {
          window.location.href = '/checkout';
        }, 1000);
      } else {
        showToast.error(
          'Fehler beim Checkout', 
          'Artikel konnte nicht zur Kasse hinzugefügt werden'
        );
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      showToast.error(
        'Checkout-Fehler', 
        'Ein unerwarteter Fehler ist aufgetreten'
      );
    }
  }, [product, quantity, selection, addToCart, checkout, openCart, closeProduct]);

  // 🎯 Interest Toggle - Optimiert mit Toast Feedback
  const handleInterestToggle = useCallback(() => {
    if (!product) return;
    
    try {
      toggleInterest(product.id);
      
      // Show feedback based on current interest state
      if (isInterested) {
        showToast.info(
          'Interesse entfernt', 
          `${product.name} wurde aus deinen Interessen entfernt`
        );
      } else {
        showToast.success(
          'Interesse hinzugefügt!', 
          `${product.name} wurde zu deinen Interessen hinzugefügt`
        );
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      showToast.error(
        'Fehler beim Aktualisieren', 
        'Interesse konnte nicht aktualisiert werden'
      );
    }
  }, [product, isInterested, toggleInterest]);

  // 🎯 Share Product - Optimiert mit Toast Feedback
  const handleShare = useCallback(async () => {
    if (!product) return;
    
    const sharePayload = {
      title: product.name,
      text: `${product.name} jetzt sichern`,
      url: typeof window !== "undefined" ? window.location.href : undefined
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        setShareFeedback("shared");
        showToast.success(
          'Erfolgreich geteilt!', 
          `${product.name} wurde geteilt`
        );
        return;
      }
      if (navigator.clipboard?.writeText && sharePayload.url) {
        await navigator.clipboard.writeText(sharePayload.url);
        setShareFeedback("copied");
        showToast.success(
          'Link kopiert!', 
          'Produktlink wurde in die Zwischenablage kopiert'
        );
        return;
      }
      setShareFeedback("error");
      showToast.error(
        'Teilen fehlgeschlagen', 
        'Link konnte nicht kopiert werden'
      );
    } catch (error) {
      console.error('Error sharing product:', error);
      setShareFeedback("error");
      showToast.error(
        'Teilen fehlgeschlagen', 
        'Ein Fehler ist beim Teilen aufgetreten'
      );
    }
  }, [product]);

  return {
    quantity,
    setQuantity,
    isInterested,
    shareFeedback,
    setShareFeedback,
    handleVariantSelect,
    handleShippingSelect,
    handleThumbnailClick,
    handleAddToCart,
    handleDirectCheckout,
    handleInterestToggle,
    handleShare
  };
};
