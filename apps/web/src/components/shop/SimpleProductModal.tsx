import { memo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X, Heart, ShoppingCart, Share2, Minus, Plus, Star, Truck, Shield, Zap, Info, Package, Percent } from "lucide-react";
import { useShopStore } from "../../store/shop";
import { useGlobalCartStore } from "../../store/globalCart";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../MobileOptimizations";
import { formatCurrency } from "../../utils/currency";
import { SmartCartConfirmation } from "./SmartCartConfirmation";
import { showToast } from "../../store/toast";

// 🎯 MAXIMIERT GEILE ALTE MODAL - OHNE HOOK-PROBLEME
export const SimpleProductModal = memo(() => {
  const navigate = useNavigate();
  // 🚀 ALLE HOOKS AM ANFANG - KEINE BEDINGUNGEN!
  const { selectedProductId, closeProduct, products, selectVariant, interestedProducts, toggleInterest } = useShopStore((state) => ({
    selectedProductId: state.selectedProductId,
    closeProduct: state.closeProduct,
    products: state.products,
    selectVariant: state.selectVariant,
    interestedProducts: state.interestedProducts,
    toggleInterest: state.toggleInterest
  }));

  const { addItem, openCart, totalPrice } = useGlobalCartStore((state) => ({
    addItem: state.addItem,
    openCart: state.openCart,
    totalPrice: state.totalPrice
  }));
  const { triggerHaptic } = useEnhancedTouch();
  const { isMobile } = useMobileOptimizations();

  // 🎯 State Management - ALLE HOOKS KONSISTENT
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedShipping, setSelectedShipping] = useState<string>('germany');
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalStateRef = useRef({ isClosing: false, isOpen: false, hasProduct: false });
  const addToCartButtonRef = useRef<HTMLButtonElement>(null);
  const [productRating] = useState(() => ({
    stars: 4.8,
    count: Math.floor(Math.random() * 100) + 50
  }));
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // 🎯 SMART CART CONFIRMATION STATES
  const [showSmartCartConfirmation, setShowSmartCartConfirmation] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');
  const [addedProductPrice, setAddedProductPrice] = useState(0);
  const [addedProductImage, setAddedProductImage] = useState('');
  const [isClosingModal, setIsClosingModal] = useState(false);

  // 🎯 Update refs when state changes
  useEffect(() => {
    modalStateRef.current.isClosing = isClosingModal;
    modalStateRef.current.isOpen = showSmartCartConfirmation;
    modalStateRef.current.hasProduct = !!selectedProductId;
  }, [isClosingModal, showSmartCartConfirmation, selectedProductId]);

  // 🎯 Cleanup: Cancel timeout when product modal closes
  useEffect(() => {
    if (!selectedProductId) {
      // Cancel any pending confirmation
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
      }
      // Reset all states
      setShowSmartCartConfirmation(false);
      setIsClosingModal(false);
      setAddedProductName('');
      setAddedProductPrice(0);
      setAddedProductImage('');
      modalStateRef.current = { isClosing: false, isOpen: false, hasProduct: false };
    }
  }, [selectedProductId]);


  // 🎯 Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeProduct();
      }
      if (e.key === 'Tab' && e.shiftKey) {
        // Handle shift+tab navigation
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeProduct]);

  // 🎯 Product finden - NUR wenn selectedProductId existiert
  const product = selectedProductId ? products.find(p => p.id === selectedProductId) : null;

  // 🎯 ALLE HOOKS MÜSSEN VOR BEDINGTEM RETURN STEHEN!
  // Product-spezifische Effects - IMMER ausführen
  useEffect(() => {
    if (!product) {
      // Reset state when no product
      setQuantity(1);
      setSelectedColor(null);
      setSelectedSize(null);
      setCurrentImageIndex(0);
      setActiveTab('overview');
      setImageLoading(true);
      return;
    }
    
    // Set initial selections
    const colorVariant = product.variants?.find(v => v.type === 'color');
    const sizeVariant = product.variants?.find(v => v.type === 'size');
    if (colorVariant?.options[0]) setSelectedColor(colorVariant.options[0].id);
    if (sizeVariant?.options[0]) setSelectedSize(sizeVariant.options[0].id);
  }, [product]);

  // Get variants - IMMER ausführen
  const colorVariant = product?.variants?.find(v => v.type === 'color');
  const sizeVariant = product?.variants?.find(v => v.type === 'size');
  const selectedColorOption = colorVariant?.options.find(opt => opt.id === selectedColor);
  const selectedSizeOption = sizeVariant?.options.find(opt => opt.id === selectedSize);

  // Get current image with loading state - IMMER ausführen
  const media = product?.media || [];
  const currentImage = media.find(media => media.color === selectedColorOption?.value) || media[currentImageIndex] || media[0];
  
  // Reset image loading when image changes - IMMER ausführen
  useEffect(() => {
    if (currentImage?.url) {
      setImageLoading(true);
      setImageError(false);
      // Auto-hide loading after 3 seconds as fallback
      const timeout = setTimeout(() => {
        setImageLoading(false);
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      setImageLoading(false);
      setImageError(true);
    }
  }, [currentImage]);

  // Calculate final price - IMMER ausführen
  const finalPrice = product?.price || 0;
  const stock = product?.inventory || 50;

  // 🎯 Quantity Options (1, 3, 5, 10 Stück) - IMMER ausführen
  const quantityOptions = [1, 3, 5, 10];
  const selectedQuantityOption = quantityOptions.find(q => q === quantity) || 1;

  // 🎯 Bulk Pricing - IMMER ausführen
  const getBulkPrice = (qty: number) => {
    if (qty >= 10) return finalPrice * 0.85; // 15% Rabatt
    if (qty >= 5) return finalPrice * 0.90;  // 10% Rabatt
    if (qty >= 3) return finalPrice * 0.95;  // 5% Rabatt
    return finalPrice;
  };

  // 🎯 ENHANCED HANDLER - Optimiert und robuster
  const handleAddToCart = useCallback(async () => {
    // Early validation
    if (isAddingToCart) {
      console.log('⚠️ Already adding to cart, ignoring');
      return;
    }
    
    if (!product) {
      console.error('❌ No product selected');
      showToast.error('Fehler', 'Kein Produkt ausgewählt');
      return;
    }
    
    if (stock <= 0) {
      console.error('❌ No stock available');
      showToast.error('Nicht verfügbar', 'Dieser Artikel ist ausverkauft');
      return;
    }
    
    if (quantity <= 0) {
      console.error('❌ Invalid quantity');
      showToast.error('Fehler', 'Ungültige Menge');
      return;
    }
    
    console.log('✅ Starting add to cart process', { 
      product: product.name, 
      quantity, 
      stock,
      price: getBulkPrice(quantity)
    });
    
    // Set loading state
    setIsAddingToCart(true);
    triggerHaptic('heavy');
    
    try {
      const shippingInfo = getShippingInfo();
      const variantString = `${selectedColorOption?.label || 'Standard'} - ${selectedSizeOption?.label || 'One Size'}`;
      const bulkPrice = getBulkPrice(quantity);
      
      // Validate bulk price
      if (isNaN(bulkPrice) || bulkPrice <= 0) {
        throw new Error('Invalid price calculation');
      }
      
      console.log('📦 Adding item to cart:', {
        name: product.name,
        variant: variantString,
        quantity,
        price: bulkPrice,
        stock,
        image: currentImage?.url
      });
      
      // Add to cart
      addItem({
        type: 'shop',
        name: product.name,
        variant: variantString,
        price: bulkPrice,
        quantity,
        image: currentImage?.url || product.media?.[0]?.url,
        color: selectedColorOption?.value,
        maxQuantity: stock,
        stock: stock,
        inviteRequired: (product as any).inviteRequired || false,
        shipping: {
          type: shippingInfo.type,
          cost: shippingInfo.price,
          days: shippingInfo.days,
          country: selectedShipping
        }
      } as any);
      
      console.log('✅ Item added to cart successfully');
      
      // Wait for Zustand persist to sync to localStorage
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify cart state was saved
      const cartState = useGlobalCartStore.getState();
      console.log('🔍 Cart state after add:', {
        itemsCount: cartState.items.length,
        totalItems: cartState.totalItems,
        items: cartState.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity }))
      });
      
      // Explicitly ensure localStorage is updated
      try {
        const persistData = {
          state: {
            items: cartState.items,
            totalItems: cartState.totalItems,
            totalPrice: cartState.totalPrice
          },
          version: 0
        };
        localStorage.setItem('nebula-global-cart', JSON.stringify(persistData));
        console.log('💾 Cart explicitly saved after addItem');
      } catch (storageError) {
        console.error('❌ Failed to save cart after addItem:', storageError);
      }
      
      // 🎯 SMART CART CONFIRMATION - Set product data
      setAddedProductName(product.name);
      setAddedProductPrice(bulkPrice);
      setAddedProductImage(currentImage?.url || product.media?.[0]?.url || '');
      
      // 🎯 Success feedback
      triggerHaptic('success');
      
      // Clear any existing timeout
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
      }
      
      // Reset loading state after a short delay to show success animation
      setTimeout(() => {
        setIsAddingToCart(false);
        
        // Show smart cart confirmation - ensure it shows on mobile
        confirmationTimeoutRef.current = setTimeout(() => {
          if (!modalStateRef.current.isClosing && !modalStateRef.current.isOpen) {
            console.log('✅ Showing SmartCartConfirmation with verified cart state');
            setShowSmartCartConfirmation(true);
            modalStateRef.current.isOpen = true;
            modalStateRef.current.hasProduct = true;
          } else {
            console.log('⚠️ SmartCartConfirmation blocked:', {
              isClosing: modalStateRef.current.isClosing,
              isOpen: modalStateRef.current.isOpen
            });
          }
          confirmationTimeoutRef.current = null;
        }, 100); // Reduced delay for faster show on mobile
      }, 400); // Reduced delay for faster feedback
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      setIsAddingToCart(false);
      showToast.error(
        'Fehler beim Hinzufügen', 
        error instanceof Error ? error.message : 'Artikel konnte nicht zum Warenkorb hinzugefügt werden'
      );
      triggerHaptic('error');
    }
  }, [product, selectedColorOption, selectedSizeOption, quantity, currentImage, stock, addItem, triggerHaptic, isAddingToCart, selectedShipping, finalPrice]);

  // 🎯 ENHANCED DIRECT EVENT LISTENER FOR MOBILE BUTTON - BYPASSES RADIX UI
  useEffect(() => {
    if (!isMobile || !addToCartButtonRef.current) return;

    const button = addToCartButtonRef.current;
    let isProcessing = false;
    
    const handleDirectClick = async (e: MouseEvent | TouchEvent | PointerEvent) => {
      // Prevent default and stop propagation
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Prevent double-clicks
      if (isProcessing) {
        console.log('⚠️ Already processing, ignoring click');
        return;
      }
      
      // Get current values directly from refs/state to avoid stale closures
      const currentProduct = product;
      const currentStock = stock;
      const currentIsAdding = isAddingToCart;
      
      console.log('🔥 DIRECT BUTTON EVENT', { 
        isAddingToCart: currentIsAdding, 
        stock: currentStock, 
        hasProduct: !!currentProduct,
        quantity 
      });
      
      // Validation checks
      if (currentIsAdding || currentStock <= 0 || !currentProduct) {
        console.log('⚠️ Direct click blocked:', { 
          isAddingToCart: currentIsAdding, 
          stock: currentStock, 
          hasProduct: !!currentProduct 
        });
        return;
      }
      
      // Set processing flag
      isProcessing = true;
      
      try {
        // Haptic feedback
        triggerHaptic('heavy');
        
        // Call handleAddToCart
        await handleAddToCart();
      } catch (error) {
        console.error('Error in direct click handler:', error);
        showToast.error('Fehler', 'Artikel konnte nicht hinzugefügt werden');
      } finally {
        // Reset processing flag after a short delay
        setTimeout(() => {
          isProcessing = false;
        }, 1000);
      }
    };

    // Add event listeners with better options
    const options = { capture: true, passive: false };
    
    button.addEventListener('click', handleDirectClick, options);
    button.addEventListener('touchend', handleDirectClick, options);
    button.addEventListener('pointerup', handleDirectClick, options);

    return () => {
      button.removeEventListener('click', handleDirectClick, options);
      button.removeEventListener('touchend', handleDirectClick, options);
      button.removeEventListener('pointerup', handleDirectClick, options);
    };
  }, [isMobile, isAddingToCart, product, stock, quantity, handleAddToCart, triggerHaptic]);

  const handleInterestToggle = useCallback(() => {
    if (!product) return;
    
    triggerHaptic('light');
    const isInterested = interestedProducts[product.id] !== undefined;
    toggleInterest(product.id);
    
    // Show feedback
    if (isInterested) {
      showToast.info(
        'Interesse entfernt',
        `${product.name} wurde aus deinen Interessen entfernt`
      );
    } else {
      showToast.success(
        '⭐ Interesse hinzugefügt!',
        `${product.name} wurde zu deinen Interessen hinzugefügt`
      );
      triggerHaptic('success');
    }
  }, [product, interestedProducts, toggleInterest, triggerHaptic]);

  // 🎯 SMART RECOMMENDATION HANDLER
  const handleAddRecommendedProduct = useCallback((productId: string) => {
    const recommendedProduct = products.find(p => p.id === productId);
    if (!recommendedProduct) return;

    triggerHaptic('medium');
    
    // Add recommended product to cart
    addItem({
      type: 'shop',
      name: recommendedProduct.name,
      variant: 'Standard',
      price: recommendedProduct.price,
      quantity: 1,
      image: recommendedProduct.media?.[0]?.url,
      color: recommendedProduct.media?.[0]?.color,
      maxQuantity: 10,
      stock: recommendedProduct.inventory || 50,
      inviteRequired: (recommendedProduct as any).inviteRequired || false,
      shipping: {
        type: 'Deutschland',
        cost: 0,
        days: '1-5 Werktage',
        country: 'germany'
      }
    } as any);

    // Update cart total for display
    setTimeout(() => {
      triggerHaptic('success');
    }, 200);
  }, [products, addItem, triggerHaptic]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    
    triggerHaptic('light');
    
    const sharePayload = {
      title: product.name,
      text: `${product.name} - Jetzt bei Nebula Supply sichern!`,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    try {
      // Try Web Share API first
      if (navigator.share && navigator.canShare?.(sharePayload)) {
        await navigator.share(sharePayload);
        triggerHaptic('success');
        showToast.success(
          'Erfolgreich geteilt!',
          `${product.name} wurde geteilt`
        );
        return;
      }
      
      // Fallback to clipboard
      if (navigator.clipboard?.writeText && sharePayload.url) {
        await navigator.clipboard.writeText(sharePayload.url);
        triggerHaptic('success');
        showToast.success(
          'Link kopiert!',
          'Produktlink wurde in die Zwischenablage kopiert'
        );
        return;
      }
      
      // If clipboard fails, show error
      triggerHaptic('warning');
      showToast.warning(
        'Teilen nicht möglich',
        'Teilen wird auf diesem Gerät nicht unterstützt'
      );
    } catch (error: any) {
      // User cancelled share
      if (error.name === 'AbortError') {
        return;
      }
      
      // Try clipboard as fallback if share failed
      if (sharePayload.url) {
        try {
          await navigator.clipboard.writeText(sharePayload.url);
          triggerHaptic('success');
          showToast.success(
            'Link kopiert!',
            'Produktlink wurde in die Zwischenablage kopiert'
          );
          return;
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError);
        }
      }
      
      console.error('Share error:', error);
      triggerHaptic('error');
      showToast.error(
        'Teilen fehlgeschlagen',
        'Der Link konnte nicht geteilt werden'
      );
    }
  }, [product, triggerHaptic]);

  const handleVariantSelect = useCallback((variantType: 'color' | 'size', optionId: string) => {
    if (!product) return;
    triggerHaptic('light');
    if (variantType === 'color') {
      setSelectedColor(optionId);
    } else {
      setSelectedSize(optionId);
    }
    selectVariant(product.id, variantType, optionId);
  }, [product, selectVariant, triggerHaptic]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    triggerHaptic('light');
    setQuantity(Math.max(1, Math.min(newQuantity, stock)));
  }, [stock, triggerHaptic]);

  // 🎯 Verfügbare Lieferorte basierend auf Produkt-ID (jedes Produkt unterschiedlich)
  const getAvailableShippingLocations = useCallback(() => {
    if (!product) return [];
    
    // Deterministische Berechnung basierend auf Produkt-ID für verschiedene Kombinationen
    const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variation = seed % 3;
    
    if (variation === 0) {
      // Nur China
      return [
        { location: 'China', flag: '🇨🇳', days: '7-14 Werktage', color: 'text-red-400' }
      ];
    } else if (variation === 1) {
      // Nur Deutschland
      return [
        { location: 'Deutschland', flag: '🇩🇪', days: '1-5 Werktage', color: 'text-green-400' }
      ];
    } else {
      // Beide Länder
      return [
        { location: 'Deutschland', flag: '🇩🇪', days: '1-5 Werktage', color: 'text-green-400' },
        { location: 'China', flag: '🇨🇳', days: '7-14 Werktage', color: 'text-red-400' }
      ];
    }
  }, [product]);

  const availableLocations = getAvailableShippingLocations();
  const primaryLocation = availableLocations[0]; // Erster Ort als primär

  // 🎯 Versand Handler (nicht mehr benötigt, aber für Kompatibilität behalten)
  const handleShippingSelect = useCallback((shippingType: string) => {
    triggerHaptic('light');
    setSelectedShipping(shippingType);
  }, [triggerHaptic]);

  // 🎯 Versand Berechnung für Länder - KORRIGIERT
  const getShippingInfo = useCallback((shippingType?: string) => {
    const orderValue = product ? (getBulkPrice(quantity) * quantity) : 0;
    const currentShipping = shippingType || selectedShipping;
    
    if (currentShipping === 'germany') {
      const shippingCost = orderValue >= 50 ? 0 : (orderValue >= 25 ? 5 : 10);
      return {
        type: 'Deutschland',
        price: shippingCost,
        days: '1-5 Werktage',
        description: shippingCost === 0 ? 'Kostenlos ab 50€' : `${shippingCost}€ Versand`,
        flag: '🇩🇪',
        color: 'text-green-400'
      };
    }
    
    if (currentShipping === 'europe') {
      const shippingCost = orderValue >= 75 ? 0 : 15;
      return {
        type: 'Europa',
        price: shippingCost,
        days: '3-7 Werktage',
        description: shippingCost === 0 ? 'Kostenlos ab 75€' : '15€ Versand',
        flag: '🇪🇺',
        color: 'text-blue-400'
      };
    }
    
    if (currentShipping === 'china') {
      const shippingCost = orderValue >= 100 ? 0 : 25;
      return {
        type: 'China',
        price: shippingCost,
        days: '7-14 Werktage',
        description: shippingCost === 0 ? 'Kostenlos ab 100€' : '25€ Versand',
        flag: '🇨🇳',
        color: 'text-red-400'
      };
    }
    
    return {
      type: 'Deutschland',
      price: 0,
      days: '1-5 Werktage',
      description: 'Kostenloser Versand',
      flag: '🇩🇪',
      color: 'text-green-400'
    };
  }, [selectedShipping, quantity, product]);

  // 🎯 Tab Navigation - IMMER ausführen
  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: Info },
    { id: 'details', label: 'Details', icon: Package },
    { id: 'shipping', label: 'Versand', icon: Truck },
    { id: 'pricing', label: 'Rabatte', icon: Percent },
  ];

  // 🎯 Produkt-Herkunft basierend auf verfügbaren Lieferorten
  const getProductOrigin = useCallback(() => {
    if (!primaryLocation) {
      return { country: 'china', flag: '🇨🇳', color: 'text-red-400', name: 'China' };
    }
    return { 
      country: primaryLocation.location.toLowerCase().includes('deutschland') ? 'germany' : 'china',
      flag: primaryLocation.flag, 
      color: primaryLocation.color, 
      name: primaryLocation.location 
    };
  }, [primaryLocation]);

  const productOrigin = getProductOrigin();

  // 🎯 Early return NACH ALLEN HOOKS
  if (!product) return null;

  return (
    <Dialog.Root open={!!selectedProductId} onOpenChange={closeProduct}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content 
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            isMobile ? 'p-0' : 'p-4'
          }`}
          onInteractOutside={(e) => {
            // Don't prevent if clicking the button
            const target = e.target as HTMLElement;
            if (addToCartButtonRef.current?.contains(target)) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            // Allow closing on mobile by tapping outside
            if (isMobile) {
              e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => {
            // Don't prevent if clicking the button
            const target = e.target as HTMLElement;
            if (addToCartButtonRef.current?.contains(target)) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            // Prevent default to allow touch interactions
            if (isMobile) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Don't prevent if clicking the button (shouldn't happen, but safety)
            if (addToCartButtonRef.current?.contains(e.target as HTMLElement)) {
              e.preventDefault();
            }
          }}
        >
          {/* Accessibility: Dialog Title (visually hidden) */}
          <Dialog.Title className="sr-only">
            {product ? `Produktdetails: ${product.name}` : 'Produktdetails'}
          </Dialog.Title>
          
          {/* Accessibility: Dialog Description */}
          <Dialog.Description className="sr-only">
            {product 
              ? `Details und Informationen zu ${product.name}. Preis: ${formatCurrency(product.price, 'de-DE', product.currency || 'EUR')}. ${product.description || ''}`
              : 'Produktdetails und Informationen'
            }
          </Dialog.Description>
          <div className={`relative w-full ${
            isMobile 
              ? 'max-w-none h-[100vh] max-h-[100vh] rounded-none' 
              : 'max-w-7xl max-h-[95vh] rounded-3xl'
          } overflow-hidden bg-gradient-to-br from-black via-[#0a0a0a] to-[#050505] border border-white/10 shadow-2xl flex flex-col`}
          onClick={(e) => {
            // Prevent clicks on the container from bubbling
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            // Allow touch events on mobile
            e.stopPropagation();
          }}
        >
            
            {/* 🎯 ENHANCED FLOATING TAB NAVIGATION */}
            <div className={`fixed ${
              isMobile ? 'top-2' : 'top-4'
            } left-1/2 transform -translate-x-1/2 z-[60]`}>
              <div className={`flex items-center ${
                isMobile ? 'gap-2 px-3 py-2.5' : 'gap-1 px-4 py-3'
              } bg-black/90 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl shadow-black/50`}>
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveTab(tab.id);
                      }}
                      className={`group relative flex items-center ${
                        isMobile ? 'gap-2.5 px-4 py-2.5' : 'gap-2 px-4 py-2'
                      } rounded-full transition-all duration-500 ease-out ${
                        isActive
                          ? 'bg-gradient-to-r from-accent to-emerald-400 text-black scale-110 shadow-lg shadow-accent/30'
                          : 'text-muted hover:text-text hover:bg-white/10 hover:scale-105 hover:shadow-lg hover:shadow-white/10'
                      }`}
                      aria-label={`${tab.label} Tab`}
                      aria-pressed={isActive}
                      role="tab"
                      tabIndex={isActive ? 0 : -1}
                    >
                      {/* 🎯 Active Indicator */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse shadow-lg shadow-accent/50" />
                      )}
                      
                      {/* 🎯 Icon with Animation */}
                      <div className={`transition-all duration-300 ${
                        isActive ? 'scale-110 rotate-3' : 'group-hover:scale-105 group-hover:rotate-1'
                      }`}>
                        <Icon size={isMobile ? 18 : 16} />
                      </div>
                      
                      {/* 🎯 Label with Typography */}
                      <span className={`${isMobile ? 'text-sm' : 'text-xs'} font-semibold transition-all duration-300 ${
                        isActive ? 'text-black font-bold' : 'font-medium'
                      }`}>
                        {tab.label}
                      </span>
                      
                      {/* 🎯 Hover Glow Effect */}
                      <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-accent/20 to-emerald-400/20' 
                          : 'group-hover:bg-white/5'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Header */}
            <div className={`flex items-center justify-between flex-shrink-0 border-b border-white/10 ${
              isMobile ? 'p-6 pt-20' : 'p-6'
            }`}>
              <div className="flex items-center gap-4">
                <h2 className={`${isMobile ? 'text-3xl' : 'text-2xl'} font-bold text-text`}>{product.name}</h2>
                {product.badges && product.badges.length > 0 && (
                  <div className="flex gap-2">
                    {product.badges.slice(0, 2).map((badge, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product) {
                      handleInterestToggle();
                    }
                  }}
                  disabled={!product}
                  className={`rounded-full ${
                    isMobile ? 'p-3.5 min-w-[44px] min-h-[44px]' : 'p-3'
                  } transition-all duration-300 touch-target disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                    product && interestedProducts[product.id]
                      ? 'bg-accent/20 text-accent shadow-[0_0_20px_rgba(11,247,188,0.3)]' 
                      : 'bg-white/5 text-muted hover:bg-white/10 hover:text-accent'
                  }`}
                  aria-label="Interesse"
                >
                  <Heart className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} ${product && interestedProducts[product.id] ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product) {
                      handleShare();
                    }
                  }}
                  disabled={!product}
                  className={`rounded-full ${
                    isMobile ? 'p-3.5 min-w-[44px] min-h-[44px]' : 'p-3'
                  } bg-white/5 text-muted hover:bg-white/10 hover:text-accent transition-all duration-300 touch-target disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                  aria-label="Teilen"
                >
                  <Share2 className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
                </button>
                <button
                  onClick={closeProduct}
                  className={`rounded-full ${
                    isMobile ? 'p-3.5 min-w-[44px] min-h-[44px]' : 'p-3'
                  } hover:bg-white/10 transition-all duration-300 flex items-center justify-center touch-target`}
                  aria-label="Schließen"
                >
                  <X className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
                </button>
              </div>
            </div>

            {/* 🎯 ENHANCED CONTENT WITH SMOOTH TRANSITIONS */}
            <div className={`flex-1 overflow-y-auto ${isMobile ? 'overscroll-contain pb-32' : ''}`}>
              <div className={`${isMobile ? 'p-6 space-y-8 pb-8' : 'p-8 space-y-10'}`}>
                
                {/* 🎯 OVERVIEW TAB WITH ANIMATION */}
                <div className={`transition-all duration-700 ease-out ${
                  activeTab === 'overview' 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4 pointer-events-none absolute'
                }`}>
                  {activeTab === 'overview' && (
                    <div className={isMobile ? 'flex flex-col space-y-8' : 'grid grid-cols-2 gap-12'}>
                  {/* Product Images */}
                      <div className={isMobile ? 'space-y-6' : 'space-y-8'}>
                         <div className="relative group">
                           {/* 🎯 ROBUST IMAGE LOADING */}
                           <div className={`w-full ${
                             isMobile ? 'h-[50vh] min-h-[400px]' : 'h-[600px]'
                           } rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-br from-accent/10 to-emerald-400/10 relative`}>
                                 {!imageError && currentImage?.url ? (
                                   <img
                                     src={currentImage.url}
                                     alt={product.name}
                                     className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                                     loading="eager"
                                     decoding="async"
                                     onLoad={() => {
                                       console.log('✅ Main product image loaded:', currentImage.url);
                                       setImageLoading(false);
                                       setImageError(false);
                                     }}
                                     onError={() => {
                                       console.log('❌ Main product image failed:', currentImage.url);
                                       setImageLoading(false);
                                       setImageError(true);
                                     }}
                                   />
                                 ) : (
                               <div className="w-full h-full flex items-center justify-center">
                                 <div className="text-center">
                                   <Package className="h-16 w-16 text-accent/50 mx-auto mb-4" />
                                   <p className="text-muted">Bild nicht verfügbar</p>
                                   <button 
                                     onClick={() => {
                                       setImageError(false);
                                       setImageLoading(true);
                                     }}
                                     className="mt-2 px-3 py-1 bg-accent/20 text-accent rounded-lg text-sm hover:bg-accent/30 transition-colors"
                                   >
                                     Erneut versuchen
                                   </button>
                                 </div>
                               </div>
                             )}
                             
                             {/* 🎯 LOADING OVERLAY */}
                             {imageLoading && (
                               <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                 <div className="text-center">
                                   <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                   <p className="text-sm text-white">Bild wird geladen...</p>
                                 </div>
                               </div>
                             )}
                           </div>
                      {media.length > 1 && (
                            <div className={`absolute bottom-4 left-4 right-4 flex ${
                              isMobile ? 'gap-3' : 'gap-2'
                            } overflow-x-auto`}>
                          {media.slice(0, 4).map((mediaItem, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                                  className={`${isMobile ? 'w-20 h-20 min-w-[80px]' : 'w-16 h-16'} rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                    index === currentImageIndex 
                                      ? 'border-accent shadow-[0_0_20px_rgba(11,247,188,0.3)]' 
                                      : 'border-white/20 hover:border-accent/50'
                              }`}
                            >
                                  <img
                                    src={mediaItem.url}
                                    alt={mediaItem.alt || product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                    onLoad={() => {
                                      console.log('✅ Thumbnail loaded:', mediaItem.url);
                                    }}
                                    onError={(e) => {
                                      console.log('❌ Thumbnail failed:', mediaItem.url);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                      <div className={isMobile ? 'space-y-8' : 'space-y-10'}>
                    {/* Price & Stock */}
                    <div className="flex items-center justify-between">
                      <div>
                            <span className="text-4xl font-bold text-text">
                              {formatCurrency(getBulkPrice(quantity), 'de-DE', product.currency)}
                        </span>
                            {quantity > 1 && (
                              <p className="text-sm text-accent font-semibold">
                                {formatCurrency(finalPrice, 'de-DE', product.currency)} × {quantity} = {formatCurrency(getBulkPrice(quantity) * quantity, 'de-DE', product.currency)}
                              </p>
                            )}
                        {stock <= 5 && stock > 0 && (
                              <p className="text-sm text-orange-400 font-semibold">Nur noch {stock} verfügbar!</p>
                        )}
                      </div>
                      <div className="text-right">
                             <div className="flex items-center gap-2 text-sm text-muted">
                               <Star className="h-4 w-4 fill-current text-yellow-400" />
                               <span className="font-semibold">{productRating.stars}</span>
                               <span>({productRating.count} Bewertungen)</span>
                             </div>
                      </div>
                    </div>

                        {/* 🎯 ENHANCED QUANTITY OPTIONS (1, 3, 5, 10 Stück) */}
                      <div>
                          <h3 className="text-xl font-semibold text-text mb-4">Anzahl wählen</h3>
                         <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                           {quantityOptions.map((qty) => {
                             const isSelected = quantity === qty;
                             const bulkPrice = getBulkPrice(qty);
                             const savings = qty > 1 ? (finalPrice * qty) - (bulkPrice * qty) : 0;
                             
                             return (
                               <button
                                 key={qty}
                                 onClick={() => {
                                   triggerHaptic('medium');
                                   handleQuantityChange(qty);
                                 }}
                                 className={`group relative rounded-xl border-2 transition-all duration-500 ease-out ${
                                   isMobile ? 'p-5 min-h-[100px]' : 'p-4 min-h-[80px]'
                                 } hover:scale-105 touch-target ${
                                   isSelected
                                     ? 'border-accent bg-gradient-to-br from-accent/20 to-emerald-400/20 shadow-[0_0_30px_rgba(11,247,188,0.3)] scale-105'
                                     : 'border-white/10 bg-white/5 hover:border-accent/40 hover:bg-gradient-to-br hover:from-accent/5 hover:to-emerald-400/5 hover:shadow-lg hover:shadow-accent/10'
                                 }`}
                               >
                                  {/* 🎯 Selection Indicator */}
                                  {isSelected && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/50">
                                      <div className="w-2 h-2 bg-black rounded-full" />
                                    </div>
                                  )}
                                  
                                  {/* 🎯 Quantity Number with Animation */}
                                  <div className="text-center">
                                    <div className={`text-2xl font-bold transition-all duration-300 ${
                                      isSelected ? 'text-accent scale-110' : 'text-text group-hover:text-accent'
                                    }`}>
                                      {qty}
                                    </div>
                                    <div className="text-sm text-muted group-hover:text-text transition-colors duration-300">
                                      Stück
                                    </div>
                                    
                                    {/* 🎯 Bulk Price with Animation */}
                                    {qty > 1 && (
                                      <div className="text-xs text-accent font-semibold mt-1 transition-all duration-300 group-hover:scale-105">
                                        {formatCurrency(bulkPrice, 'de-DE', product.currency)}/Stück
                      </div>
                    )}
                                    
                                    {/* 🎯 Savings with Glow Effect */}
                                    {savings > 0 && (
                                      <div className="text-xs text-green-400 font-bold mt-1 transition-all duration-300 group-hover:scale-105 group-hover:text-green-300">
                                        💰 Spare {formatCurrency(savings, 'de-DE', product.currency)}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* 🎯 Hover Glow Effect */}
                                  <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                                    isSelected 
                                      ? 'bg-gradient-to-br from-accent/10 to-emerald-400/10' 
                                      : 'group-hover:bg-gradient-to-br group-hover:from-accent/5 group-hover:to-emerald-400/5'
                                  }`} />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                    {/* Variants */}
                    {colorVariant && (
                      <div>
                            <h3 className="text-xl font-semibold text-text mb-4">Farbe</h3>
                            <div className={`flex ${isMobile ? 'gap-4' : 'gap-3'} flex-wrap`}>
                          {colorVariant.options.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleVariantSelect('color', option.id)}
                                  className={`flex items-center gap-3 ${
                                    isMobile ? 'px-5 py-4 min-h-[56px]' : 'px-4 py-3'
                                  } rounded-xl border transition-all duration-300 ${
                                selectedColor === option.id
                                      ? 'border-accent bg-accent/10 text-accent shadow-[0_0_20px_rgba(11,247,188,0.2)]'
                                      : 'border-white/10 bg-white/5 text-muted hover:border-accent/30 hover:bg-accent/5'
                              }`}
                            >
                              {option.swatch && (
                                <div
                                      className="w-5 h-5 rounded-full border-2 border-white/20"
                                  style={{ backgroundColor: option.swatch }}
                                />
                              )}
                                  <span className="font-medium">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {sizeVariant && (
                      <div>
                            <h3 className="text-xl font-semibold text-text mb-4">Größe</h3>
                            <div className={`flex ${isMobile ? 'gap-4' : 'gap-3'} flex-wrap`}>
                          {sizeVariant.options.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleVariantSelect('size', option.id)}
                                  className={`${
                                    isMobile ? 'px-6 py-4 min-h-[56px]' : 'px-6 py-3'
                                  } rounded-xl border transition-all duration-300 font-medium ${
                                selectedSize === option.id
                                      ? 'border-accent bg-accent/10 text-accent shadow-[0_0_20px_rgba(11,247,188,0.2)]'
                                      : 'border-white/10 bg-white/5 text-muted hover:border-accent/30 hover:bg-accent/5'
                              }`}
                            >
                                  {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                         {/* 🎯 ENHANCED FEATURES WITH ORIGIN */}
                         <div className="space-y-4">
                           {/* Lieferzeit & Lieferort */}
                           <div className="p-4 bg-gradient-to-r from-accent/5 to-emerald-400/5 rounded-xl border border-accent/20">
                             <div className="space-y-3">
                               {availableLocations.map((loc, index) => (
                                 <div key={index} className="flex items-center gap-3">
                                   <span className="text-2xl">{loc.flag}</span>
                                   <div className="flex-1">
                                     <div className="text-sm text-muted">Lieferort</div>
                                     <div className={`font-bold ${loc.color}`}>{loc.location}</div>
                                   </div>
                                   <div className="text-right">
                                     <div className="text-sm text-muted">Lieferzeit</div>
                                     <div className={`font-bold ${loc.color}`}>{loc.days}</div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                           
                           {/* Features Grid */}
                           <div className="grid grid-cols-2 gap-4">
                             <div className="flex items-center gap-3 text-muted">
                               <Truck className="h-5 w-5 text-accent" />
                               <span>Kostenloser Versand</span>
                             </div>
                             <div className="flex items-center gap-3 text-muted">
                               <Shield className="h-5 w-5 text-accent" />
                               <span>2 Jahre Garantie</span>
                             </div>
                             <div className="flex items-center gap-3 text-muted">
                               <Zap className="h-5 w-5 text-accent" />
                               <span>Schnelle Lieferung</span>
                             </div>
                             <div className="flex items-center gap-3 text-muted">
                               <Star className="h-5 w-5 text-accent" />
                               <span>Premium Qualität</span>
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>
                  )}
                </div>

                 {/* 🎯 DETAILS TAB WITH ANIMATION */}
                 <div className={`transition-all duration-700 ease-out ${
                   activeTab === 'details' 
                     ? 'opacity-100 translate-y-0' 
                     : 'opacity-0 translate-y-4 pointer-events-none absolute'
                 }`}>
                   {activeTab === 'details' && (
                     <div className="space-y-8">
                       <h2 className="text-3xl font-bold text-text">Produktdetails</h2>
                       
                       {/* 🎯 ENHANCED DESCRIPTION */}
                       {product.description && (
                         <div className="space-y-6">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                               <Package className="h-4 w-4 text-accent" />
                             </div>
                             <h3 className="text-2xl font-bold text-text">Produktbeschreibung</h3>
                           </div>
                           <div className="p-6 bg-gradient-to-br from-accent/5 to-emerald-400/5 rounded-2xl border border-accent/20">
                             <p className="text-lg text-text leading-relaxed font-medium">{product.description}</p>
                             
                             {/* 🎯 ENHANCED DESCRIPTION ADDITIONS */}
                             <div className="mt-6 space-y-4">
                               <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                                 <h4 className="font-bold text-text mb-2">✨ Warum dieses Produkt?</h4>
                                 <p className="text-sm text-muted leading-relaxed">
                                   Dieses Produkt wurde sorgfältig ausgewählt und bietet die perfekte Balance zwischen Qualität, 
                                   Funktionalität und Design. Es ist ideal für alle, die Wert auf Premium-Qualität legen.
                                 </p>
                               </div>
                               
                               <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                                 <h4 className="font-bold text-text mb-2">🎯 Perfekt für Sie, wenn...</h4>
                                 <ul className="text-sm text-muted space-y-1">
                                   <li>• Sie hochwertige Produkte schätzen</li>
                                   <li>• Sie auf Nachhaltigkeit achten</li>
                                   <li>• Sie langlebige Qualität suchen</li>
                                   <li>• Sie modernes Design lieben</li>
                                 </ul>
                               </div>
                             </div>
                           </div>
                         </div>
                       )}
                       
                       {/* 🎯 PREMIUM FEATURES */}
                       <div className="space-y-6">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                             <Star className="h-4 w-4 text-accent" />
                           </div>
                           <h3 className="text-2xl font-bold text-text">Premium Features</h3>
                         </div>
                         <div className="grid gap-4">
                           <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-accent/5 to-emerald-400/5 p-6 hover:border-accent/30 transition-all duration-300">
                             <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                               <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                                 <div className="w-2 h-2 bg-black rounded-full"></div>
                               </div>
                             </div>
                             <div className="flex-1">
                               <h4 className="text-lg font-bold text-text">Premium Materialien</h4>
                               <p className="text-sm text-muted">Hochwertige Komponenten für maximale Langlebigkeit</p>
                             </div>
                             <div className="text-accent font-bold">✓</div>
                           </div>
                           
                           <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-accent/5 to-emerald-400/5 p-6 hover:border-accent/30 transition-all duration-300">
                             <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                               <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                                 <div className="w-2 h-2 bg-black rounded-full"></div>
                               </div>
                             </div>
                             <div className="flex-1">
                               <h4 className="text-lg font-bold text-text">Nachhaltige Produktion</h4>
                               <p className="text-sm text-muted">Umweltfreundlich und ressourcenschonend hergestellt</p>
                             </div>
                             <div className="text-accent font-bold">✓</div>
                           </div>
                           
                           <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-accent/5 to-emerald-400/5 p-6 hover:border-accent/30 transition-all duration-300">
                             <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                               <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                                 <div className="w-2 h-2 bg-black rounded-full"></div>
                               </div>
                             </div>
                             <div className="flex-1">
                               <h4 className="text-lg font-bold text-text">2 Jahre Garantie</h4>
                               <p className="text-sm text-muted">Vollständige Herstellergarantie für Ihre Sicherheit</p>
                             </div>
                             <div className="text-accent font-bold">✓</div>
                           </div>
                         </div>
                       </div>

                       {/* 🎯 TECHNICAL SPECS */}
                       <div className="space-y-6">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                             <Zap className="h-4 w-4 text-accent" />
                           </div>
                           <h3 className="text-2xl font-bold text-text">Technische Daten</h3>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                             <div className="text-sm text-muted mb-1">Gewicht</div>
                             <div className="text-lg font-bold text-text">0.5 kg</div>
                           </div>
                           <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                             <div className="text-sm text-muted mb-1">Abmessungen</div>
                             <div className="text-lg font-bold text-text">15×10×5 cm</div>
                           </div>
                           <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                             <div className="text-sm text-muted mb-1">Material</div>
                             <div className="text-lg font-bold text-text">Premium</div>
                           </div>
                           <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                             <div className="text-sm text-muted mb-1">Farbe</div>
                             <div className="text-lg font-bold text-text">Mehrere</div>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>

                 {/* 🎯 SHIPPING TAB WITH ANIMATION */}
                 <div className={`transition-all duration-700 ease-out ${
                   activeTab === 'shipping' 
                     ? 'opacity-100 translate-y-0' 
                     : 'opacity-0 translate-y-4 pointer-events-none absolute'
                 }`}>
                   {activeTab === 'shipping' && (
                     <div className="space-y-8">
                       <h2 className="text-3xl font-bold text-text">Versandinformationen</h2>
                       
                       {/* Lieferzeit & Lieferort Anzeige */}
                       <div className="grid gap-4">
                         {availableLocations.map((loc, index) => (
                           <div
                             key={index}
                             className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/5 via-accent/5 to-accent/5 p-6 transition-all duration-300"
                           >
                             <div className="flex items-center justify-between">
                               <div className="space-y-2">
                                 <div className="flex items-center gap-3">
                                   <span className="text-3xl">{loc.flag}</span>
                                   <h3 className="text-xl font-semibold text-text">Lieferort</h3>
                                 </div>
                                 <div className={`text-lg font-bold ${loc.color} ml-12`}>{loc.location}</div>
                               </div>
                               <div className="text-right space-y-2">
                                 <div className="text-sm text-muted">Lieferzeit</div>
                                 <div className={`text-xl font-bold ${loc.color}`}>{loc.days}</div>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>

                      {/* 🎯 OPTIMIERTE VERSAND-INFORMATIONEN */}
                      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-accent/5 to-emerald-400/5 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                            <Truck className="h-4 w-4 text-accent" />
                          </div>
                          <h3 className="text-xl font-bold text-text">Versandinformationen</h3>
                        </div>
                        
                        <div className="grid gap-4">
                          {/* Verfügbare Lieferorte */}
                          {availableLocations.map((loc, index) => (
                            <div key={index} className="p-4 bg-black/20 rounded-xl border border-accent/20">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{loc.flag}</span>
                                <div className="flex-1">
                                  <div className={`font-bold ${loc.color}`}>{loc.location}</div>
                                  <div className="text-sm text-muted">{loc.days}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Allgemeine Versand-Info */}
                          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-3'}`}>
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              <span>Sichere Verpackung</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              <span>Tracking verfügbar</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              <span>30 Tage Rückgaberecht</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              <span>Versicherter Versand</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🎯 PRICING TAB WITH ANIMATION */}
                <div className={`transition-all duration-700 ease-out ${
                  activeTab === 'pricing' 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4 pointer-events-none absolute'
                }`}>
                  {activeTab === 'pricing' && (
                    <div className="space-y-8">
                      <h2 className="text-3xl font-bold text-text">Mengenrabatte</h2>
                      
                      <div className="grid gap-4">
                        {quantityOptions.map((qty) => {
                          const bulkPrice = getBulkPrice(qty);
                          const savings = qty > 1 ? (finalPrice * qty) - (bulkPrice * qty) : 0;
                          const isSelected = quantity === qty;
                          
                          return (
                            <div 
                              key={qty}
                              className={`rounded-2xl border-2 transition-all duration-300 p-6 ${
                                isSelected
                                  ? 'border-accent bg-accent/10 shadow-xl shadow-accent/20'
                                  : 'border-white/10 bg-white/5 hover:border-accent/40 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                  <h3 className="text-xl font-semibold text-text">
                                    {qty} Stück
                                  </h3>
                                  <p className="text-muted">
                                    {qty === 1 ? 'Einzelpreis' : 'Mengenrabatt'}
                                  </p>
                                  {savings > 0 && (
                                    <p className="text-sm text-accent font-semibold">
                                      Spare {formatCurrency(savings, 'de-DE', product.currency)}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="text-2xl font-bold text-accent">
                                    {formatCurrency(bulkPrice, 'de-DE', product.currency)}
                                  </span>
                                  <div className="text-sm text-muted">pro Stück</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
                        <h3 className="font-semibold text-text mb-3 text-lg">Preisvergleich</h3>
                        <div className="grid gap-2">
                          <div className="flex justify-between items-center rounded-lg bg-white/5 p-3">
                            <span className="text-muted text-sm">Einzelpreis</span>
                            <span className="text-text font-semibold text-sm">
                              {formatCurrency(finalPrice, 'de-DE', product.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center rounded-lg bg-white/5 p-3">
                            <span className="text-muted text-sm">Bulk-Preis (10+ Stück)</span>
                            <span className="text-accent font-semibold text-sm">
                              {formatCurrency(finalPrice * 0.85, 'de-DE', product.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center rounded-lg bg-accent/10 border border-accent/20 p-3">
                            <span className="text-text font-semibold text-sm">Max. Ersparnis</span>
                            <span className="text-accent font-bold text-sm">
                              {formatCurrency(finalPrice * 0.15, 'de-DE', product.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                 {/* 🎯 OPTIMIERTE PRODUKT-EMPFEHLUNGEN */}
                 <div className="pt-6 border-t border-white/10">
                   <div className="mb-6">
                     <h3 className="text-xl font-bold text-text mb-4">Ähnliche Produkte</h3>
                     <div className="grid grid-cols-2 gap-4">
                       {products
                         .filter(recProduct => recProduct.id !== product.id) // Aktuelles Produkt ausschließen
                         .filter(recProduct => {
                           // 🎯 SMARTE ÄHNLICHKEITS-FILTER
                           const currentPrice = product.price;
                           const recPrice = recProduct.price;
                           const priceDiff = Math.abs(currentPrice - recPrice);
                           
                           // Ähnliche Preiskategorie (±30% vom aktuellen Preis)
                           const isSimilarPrice = priceDiff <= currentPrice * 0.3;
                           
                           // Ähnliche Kategorie (basierend auf Name-Keywords)
                           const currentKeywords = product.name.toLowerCase().split(' ');
                           const recKeywords = recProduct.name.toLowerCase().split(' ');
                           const hasCommonKeywords = currentKeywords.some(keyword => 
                             keyword.length > 3 && recKeywords.includes(keyword)
                           );
                           
                           return isSimilarPrice || hasCommonKeywords;
                         })
                         .slice(0, 2)
                         .map((recProduct) => (
                           <div 
                             key={recProduct.id} 
                             className="group cursor-pointer"
                             onClick={() => {
                               triggerHaptic('light');
                               closeProduct();
                               // Öffne das ähnliche Produkt
                               setTimeout(() => {
                                 useShopStore.getState().openProduct(recProduct.id);
                               }, 100);
                             }}
                           >
                             <div className="relative overflow-hidden rounded-xl bg-black/30 border border-white/10 hover:border-accent/30 transition-all duration-300">
                               {/* 🎯 ENHANCED BILDER FÜR ÄHNLICHE PRODUKTE */}
                               <div className="aspect-square relative bg-gradient-to-br from-accent/10 to-emerald-400/10 overflow-hidden">
                                 {(() => {
                                   // Debug: Log product data
                                   console.log('Similar product:', recProduct.name, 'Media:', recProduct.media);
                                   
                                   if (recProduct.media && recProduct.media.length > 0 && recProduct.media[0].url) {
                                     return (
                                       <img
                                         src={recProduct.media[0].url}
                                         alt={recProduct.name}
                                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                         loading="lazy"
                                         decoding="async"
                                         onLoad={() => {
                                           console.log('✅ Similar product image loaded:', recProduct.name);
                                         }}
                                         onError={(e) => {
                                           console.log('❌ Similar product image failed:', recProduct.name, recProduct.media[0].url);
                                           e.currentTarget.style.display = 'none';
                                           // Show fallback
                                           const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                           if (fallback) fallback.classList.remove('hidden');
                                         }}
                                       />
                                     );
                                   } else {
                                     console.log('⚠️ No media for similar product:', recProduct.name);
                                   }
                                   
                                   return (
                                     <div className="w-full h-full flex items-center justify-center">
                                       <div className="text-center">
                                         <Package className="h-12 w-12 text-accent/50 mx-auto mb-2" />
                                         <p className="text-xs text-muted">Kein Bild</p>
                                       </div>
                                     </div>
                                   );
                                 })()}
                                 
                                 {/* 🎯 FALLBACK FÜR FEHLGESCHLAGENE BILDER */}
                                 <div className="hidden absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-emerald-400/10">
                                   <div className="text-center">
                                     <Package className="h-12 w-12 text-accent/50 mx-auto mb-2" />
                                     <p className="text-xs text-muted">Bild nicht verfügbar</p>
                                   </div>
                                 </div>
                               </div>
                               <div className="p-3">
                                 <h4 className="font-semibold text-text text-sm truncate">{recProduct.name}</h4>
                                 <p className="text-accent font-bold text-sm">{formatCurrency(recProduct.price, 'de-DE', 'EUR')}</p>
                                 <div className="flex items-center gap-1 mt-1">
                                   <Star className="h-3 w-3 fill-current text-yellow-400" />
                                   <span className="text-xs text-muted">4.{Math.floor(Math.random() * 5) + 5}</span>
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))}
                     </div>
                   </div>
                 </div>

                 {/* 🎯 ENHANCED ACTIONS WITH GEILE ANIMATION */}
                 {isMobile ? (
                   <div 
                     className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-br from-black via-[#0a0a0a] to-[#050505] px-6 py-4 border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.95)]"
                     style={{
                       paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'
                     }}
                   >
                       <button
                       ref={addToCartButtonRef}
                       type="button"
                       onClick={(e) => {
                         // Prevent default behavior
                         e.preventDefault();
                         e.stopPropagation();
                         
                         // Early return if disabled
                         if (isAddingToCart || stock <= 0 || !product) {
                           return;
                         }
                         
                         // Execute add to cart
                         try {
                           triggerHaptic('heavy');
                           handleAddToCart();
                         } catch (error) {
                           console.error('Error in onClick handler:', error);
                           showToast.error('Fehler', 'Artikel konnte nicht hinzugefügt werden');
                         }
                       }}
                       onTouchStart={(e) => {
                         // Prevent double-firing on touch devices
                         e.stopPropagation();
                         if (!isAddingToCart && stock > 0 && product) {
                           triggerHaptic('light');
                         }
                       }}
                       onTouchEnd={(e) => {
                         // Handle touch end - let onClick handle the actual action
                         e.stopPropagation();
                       }}
                       disabled={isAddingToCart || stock <= 0 || !product}
                       className="group relative w-full flex items-center justify-center gap-4 py-7 px-8 text-lg min-h-[64px] rounded-2xl bg-[#4ade80] text-black font-bold hover:bg-[#45d178] active:scale-[0.97] active:bg-[#3dd16a] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 shadow-lg hover:shadow-xl disabled:hover:shadow-lg overflow-hidden touch-target select-none"
                       style={{
                         touchAction: 'manipulation',
                         WebkitTapHighlightColor: 'transparent',
                         WebkitUserSelect: 'none',
                         userSelect: 'none',
                         pointerEvents: 'auto',
                         cursor: isAddingToCart || stock <= 0 || !product ? 'not-allowed' : 'pointer',
                         zIndex: 1000,
                         position: 'relative',
                         willChange: 'transform'
                       }}
                       aria-label="Artikel zum Warenkorb hinzufügen"
                       aria-disabled={isAddingToCart || stock <= 0 || !product}
                     >
                     {/* Success Glow Effect */}
                     {isAddingToCart && (
                       <motion.div
                         className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-emerald-500/30 rounded-2xl"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: [0, 1, 0] }}
                         transition={{ duration: 1, repeat: Infinity }}
                       />
                     )}
                     
                     {/* Hover Glow */}
                     <div className="absolute inset-0 bg-gradient-to-r from-green-300/20 to-emerald-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     
                     {isAddingToCart ? (
                       <motion.div 
                         className="flex items-center gap-3 relative z-10"
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         transition={{ duration: 0.2 }}
                       >
                         <div className="relative">
                           <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                           <div className="absolute inset-0 w-6 h-6 border-3 border-white/30 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                         </div>
                         <span className="font-bold animate-pulse">Hinzufügen...</span>
                       </motion.div>
                     ) : (
                       <motion.div 
                         className="flex items-center gap-4 relative z-10 w-full justify-center"
                         initial={{ opacity: 1 }}
                         whileHover={{ scale: 1.02 }}
                         transition={{ duration: 0.2 }}
                       >
                         <motion.div
                           whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                           transition={{ duration: 0.5 }}
                         >
                           <ShoppingCart className="h-6 w-6" strokeWidth={2.5} />
                         </motion.div>
                         <div className="flex flex-col items-start">
                           <span className="text-base font-semibold leading-tight">
                             {quantity} Stück für {formatCurrency(getBulkPrice(quantity) * quantity, 'de-DE', product?.currency || 'EUR')}
                           </span>
                           <span className="text-base font-bold leading-tight">hinzufügen</span>
                         </div>
                         
                         {/* Success Checkmark on Hover */}
                         <motion.div
                           className="absolute right-4 opacity-0 group-hover:opacity-100"
                           initial={{ scale: 0, rotate: -180 }}
                           whileHover={{ scale: 1, rotate: 0 }}
                           transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                         >
                           <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                             <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                             </svg>
                           </div>
                         </motion.div>
                       </motion.div>
                     )}
                     
                     {/* Ripple Effect on Click */}
                     {!isAddingToCart && (
                       <motion.div
                         className="absolute inset-0 rounded-2xl bg-white/30"
                         initial={{ scale: 0, opacity: 0.6 }}
                         whileTap={{ scale: 2, opacity: 0 }}
                         transition={{ duration: 0.6 }}
                       />
                     )}
                   </button>
                   </div>
                 ) : (
                   <div className="flex gap-4 pt-6 border-t border-white/10">
                     <button
                       ref={addToCartButtonRef}
                       type="button"
                       onClick={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         if (isAddingToCart || stock <= 0 || !product) return;
                         triggerHaptic('heavy');
                         handleAddToCart();
                       }}
                       disabled={isAddingToCart || stock <= 0 || !product}
                       className="group relative flex-1 flex items-center justify-center gap-3 py-6 px-8 text-xl rounded-2xl bg-gradient-to-r from-accent to-emerald-400 text-black font-bold hover:from-accent/90 hover:to-emerald-400/90 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(11,247,188,0.3)] hover:shadow-[0_0_60px_rgba(11,247,188,0.5)] hover:scale-105 disabled:hover:scale-100 overflow-hidden touch-target"
                     >
                       {isAddingToCart ? (
                         <div className="flex items-center gap-3">
                           <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                           <span className="animate-pulse font-bold">Hinzufügen...</span>
                         </div>
                       ) : (
                         <>
                           <ShoppingCart className="h-6 w-6" />
                           <span>
                             {quantity} Stück für {formatCurrency(getBulkPrice(quantity) * quantity, 'de-DE', product.currency)} hinzufügen
                           </span>
                         </>
                       )}
                     </button>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* 🎯 SMART CART CONFIRMATION MODAL */}
      <SmartCartConfirmation
        isOpen={showSmartCartConfirmation && !isClosingModal}
        onClose={() => {
          if (modalStateRef.current.isClosing) return;
          triggerHaptic('light');
          // Cancel pending confirmation timeout
          if (confirmationTimeoutRef.current) {
            clearTimeout(confirmationTimeoutRef.current);
            confirmationTimeoutRef.current = null;
          }
          // Update ref immediately
          modalStateRef.current.isClosing = true;
          modalStateRef.current.isOpen = false;
          setIsClosingModal(true);
          setShowSmartCartConfirmation(false);
          // Reset after animation
          setTimeout(() => {
            setIsClosingModal(false);
            modalStateRef.current.isClosing = false;
          }, 800);
        }}
        onContinueShopping={() => {
          if (modalStateRef.current.isClosing) return;
          triggerHaptic('medium');
          
          // Cancel pending confirmation timeout IMMEDIATELY
          if (confirmationTimeoutRef.current) {
            clearTimeout(confirmationTimeoutRef.current);
            confirmationTimeoutRef.current = null;
          }
          
          // Update ref immediately to prevent any reopening
          modalStateRef.current.isClosing = true;
          modalStateRef.current.isOpen = false;
          modalStateRef.current.hasProduct = false;
          
          // Update state
          setIsClosingModal(true);
          setShowSmartCartConfirmation(false);
          
          // Clear all states immediately
          setAddedProductName('');
          setAddedProductPrice(0);
          setAddedProductImage('');
          
          // Close product modal first
          closeProduct();
          
          // Navigate immediately (no delay needed)
          navigate('/shop');
          
          // Keep isClosingModal true for 3 seconds to absolutely prevent reopening
          setTimeout(() => {
            setIsClosingModal(false);
            modalStateRef.current.isClosing = false;
          }, 3000);
        }}
        onGoToCheckout={() => {
          console.log('🎯 onGoToCheckout called');
          
          if (modalStateRef.current.isClosing) {
            console.log('⚠️ Checkout blocked: modal is closing');
            return;
          }
          
          console.log('✅ Checkout process started');
          triggerHaptic('heavy');
          
          // Cancel pending confirmation timeout IMMEDIATELY
          if (confirmationTimeoutRef.current) {
            clearTimeout(confirmationTimeoutRef.current);
            confirmationTimeoutRef.current = null;
          }
          
          // Update ref immediately to prevent any reopening
          modalStateRef.current.isClosing = true;
          modalStateRef.current.isOpen = false;
          modalStateRef.current.hasProduct = false;
          
          // Update state
          setIsClosingModal(true);
          setShowSmartCartConfirmation(false);
          
          // Clear all states immediately
          setAddedProductName('');
          setAddedProductPrice(0);
          setAddedProductImage('');
          
          // Close product modal
          closeProduct();
          
          // NAVIGATION: Try multiple methods with immediate execution
          console.log('🚀 Starting navigation to checkout...');
          
          // Method 1: Try React Router navigation first
          try {
            console.log('📍 Method 1: React Router navigate');
            navigate('/checkout', { replace: false });
          } catch (error) {
            console.error('❌ React Router navigation failed:', error);
          }
          
          // Method 2: Use window.location as primary fallback (more reliable)
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            if (window.location.pathname !== '/checkout') {
              console.log('📍 Method 2: window.location.href');
              window.location.href = '/checkout';
            } else {
              console.log('✅ Already on checkout page');
            }
          });
          
          // Method 3: Force navigation after short delay (ultimate fallback)
          setTimeout(() => {
            if (window.location.pathname !== '/checkout') {
              console.log('📍 Method 3: Force navigation fallback');
              window.location.replace('/checkout');
            }
          }, 100);
          
          // Keep isClosingModal true for 3 seconds to absolutely prevent reopening
          setTimeout(() => {
            setIsClosingModal(false);
            modalStateRef.current.isClosing = false;
          }, 3000);
        }}
        onAddRecommendedProduct={handleAddRecommendedProduct}
        productName={addedProductName}
        productPrice={addedProductPrice}
        productImage={addedProductImage}
        cartTotal={totalPrice}
        freeShippingThreshold={50}
        recommendedProducts={products
          .filter(p => p.id !== product?.id)
          .slice(0, 3)
          .map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.media?.[0]?.url,
            badge: p.badges?.[0]
          }))
        }
      />
    </Dialog.Root>
  );
});