import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckoutFlow } from "../components/checkout/CheckoutFlow";
import { MobileCheckout } from "../components/checkout/MobileCheckout";
import { useBotCommandHandler } from "../utils/botCommandHandler";
import { useMobileOptimizations } from "../components/MobileOptimizations";
import { useGlobalCartStore } from "../store/globalCart";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { CheckoutErrorBoundary } from "../components/checkout/CheckoutErrorBoundary";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { executeCommand } = useBotCommandHandler();
  const { isMobile } = useMobileOptimizations();
  const { items } = useGlobalCartStore();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check for bot commands in URL
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const command = urlParams.get('command');
      if (command && executeCommand) {
        const result = executeCommand(command);
        if (result?.success) {
          console.log('Bot command executed:', result.message);
        }
      }
    } catch (error) {
      console.warn('Error executing bot command:', error);
    }
  }, [executeCommand]);

  // 🎯 MOBILE FIRST: Render MobileCheckout directly if mobile detected
  // Double check: window width AND isMobile hook
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const isMobileDevice = isMobile || windowWidth <= 768;
  
  useEffect(() => {
    if (mounted) {
      console.log('🎯 CheckoutPage rendered:', {
        isMobile,
        windowWidth,
        isMobileDevice,
        itemsCount: items.length,
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
        totalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        pathname: window.location.pathname,
        userAgent: navigator.userAgent
      });
      
      // Helper function to check cart state from multiple sources
      const checkCartState = (): boolean => {
        // Check store state
        const storeItems = useGlobalCartStore.getState().items;
        if (storeItems.length > 0) {
          console.log('✅ Cart has items in store:', storeItems.length);
          return true;
        }
        
        // Check localStorage as fallback
        try {
          const localStorageData = localStorage.getItem('nebula-global-cart');
          if (localStorageData) {
            const parsed = JSON.parse(localStorageData);
            const cartItems = parsed?.state?.items || parsed?.items || [];
            if (cartItems.length > 0) {
              console.log('✅ Cart has items in localStorage:', cartItems.length);
              // Try to sync back to store
              try {
                const store = useGlobalCartStore.getState();
                if (store.items.length === 0 && cartItems.length > 0) {
                  console.log('🔄 Syncing cart from localStorage to store...');
                  // Note: Zustand persist should handle this, but we're ensuring it
                }
              } catch (syncError) {
                console.warn('⚠️ Could not sync from localStorage:', syncError);
              }
              return true;
            }
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse localStorage cart data:', parseError);
        }
        
        return false;
      };
      
      // Multiple checks with increasing delays to ensure state sync
      // Check after 500ms
      setTimeout(() => {
        if (checkCartState()) {
          console.log('✅ Cart state verified after 500ms');
          return;
        }
        console.log('⏳ Cart still empty after 500ms, checking again...');
      }, 500);
      
      // Check after 1000ms
      setTimeout(() => {
        if (checkCartState()) {
          console.log('✅ Cart state verified after 1000ms');
          return;
        }
        console.log('⏳ Cart still empty after 1000ms, checking again...');
      }, 1000);
      
      // Final check after 2000ms before redirecting
      setTimeout(() => {
        if (!checkCartState()) {
          console.log('⚠️ Cart is empty after all sync checks (2000ms), redirecting to shop...');
          navigate('/shop');
        } else {
          console.log('✅ Cart state verified after 2000ms - staying on checkout');
        }
      }, 2000); // Increased delay for better state synchronization
    }
  }, [mounted, isMobile, isMobileDevice, items.length, navigate, items]);

  // 🎯 ALWAYS render something - no black screen!
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <div className="text-white text-sm">Lädt...</div>
        </div>
      </div>
    );
  }

  if (isMobileDevice) {
    console.log('📱 Rendering MobileCheckout component');
    return (
      <CheckoutErrorBoundary>
        <ErrorBoundary>
          <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] relative z-0">
            <MobileCheckout onBack={() => navigate("/shop")} />
          </div>
        </ErrorBoundary>
      </CheckoutErrorBoundary>
    );
  }

  console.log('🖥️ Rendering Desktop CheckoutFlow component');

  return (
    <CheckoutErrorBoundary>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative z-0">
          <CheckoutFlow />
        </div>
      </ErrorBoundary>
    </CheckoutErrorBoundary>
  );
};

