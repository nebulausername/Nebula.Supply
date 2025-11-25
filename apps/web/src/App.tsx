import { useEffect, useState, lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TabBar } from "./components/TabBar";
import { GlobalCart } from "./components/GlobalCart";
import { OptimizedMobileCart } from "./components/shop/OptimizedMobileCart";
import { CartFab } from "./components/shop/CartFab";
import { VipFloatingTab } from "./components/vip/VipFloatingTab";
import { ToastManager } from "./components/Toast";
import { useToastStore } from "./store/toast";
import { useGlobalCartStore } from "./store/globalCart";
import { useGamingDiscountStore } from "./store/gamingDiscounts";
import { Cookie, Home, Rocket, ShoppingCart, User } from "lucide-react";
import { MobileOptimizations } from "./components/MobileOptimizations";
import { 
  PullToRefresh, 
  PWAInstallPrompt
} from "./components/mobile";
import { MobileBottomNav } from "./components/mobile/MobileBottomNav";
import { useEnhancedTouch } from "./hooks/useEnhancedTouch";
import { MobilePerformanceMonitor } from "./components/mobile/MobilePerformanceMonitor";
import { NebulaLoader } from "./components/ui/NebulaLoader";
import { useMobileOptimizations } from "./components/MobileOptimizations";
import { cn } from "./utils/cn";
import { getRouteTransition, useScrollRestoration } from "./utils/pageTransitions";
import { useTelegramIntegration } from "./utils/telegramIntegration";
import { BotCommandHandler } from "./components/BotCommandHandler";
import { BotResponseHandler } from "./components/BotResponseHandler";
import { useBotCommandHandler } from "./utils/botCommandHandler";
import { useAuthStore } from "./store/auth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Landing } from "./components/Landing";
import { Footer } from "./components/Footer";
import { useMaintenanceMode } from "./hooks/useMaintenanceMode";

// Lazy load all pages for code splitting
const HomePageOptimized = lazy(() => import("./pages/HomePageOptimized").then(m => ({ default: m.HomePageOptimized })));
const DropsPage = lazy(() => import("./pages/DropsPage").then(m => ({ default: m.DropsPage })));
const ShopPage = lazy(() => import("./pages/ShopPage").then(m => ({ default: m.ShopPage })));
const CategoryShopPage = lazy(() => import("./pages/CategoryShopPage").then(m => ({ default: m.CategoryShopPage })));
const VipPage = lazy(() => import("./pages/VipPage").then(m => ({ default: m.VipPage })));
const VipTiersPage = lazy(() => import("./pages/VipTiersPage").then(m => ({ default: m.VipTiersPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const SupportPage = lazy(() => 
  import("./pages/SupportPage")
    .then(m => ({ default: m.SupportPage || m.default }))
    .catch(error => {
      console.error('Failed to load SupportPage:', error);
      // Return a fallback component
      return { 
        default: () => (
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Fehler beim Laden</h1>
              <p className="text-gray-400 mb-4">Die Support-Seite konnte nicht geladen werden.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
              >
                Seite neu laden
              </button>
            </div>
          </div>
        )
      };
    })
);
const CartPage = lazy(() => import("./pages/CartPage").then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then(m => ({ default: m.CheckoutPage })));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage").then(m => ({ default: m.OrderTrackingPage })));
const EndToEndTestPage = lazy(() => import("./pages/EndToEndTestPage").then(m => ({ default: m.EndToEndTestPage })));
const CartDebug = lazy(() => import("./components/debug/CartDebug").then(m => ({ default: m.CartDebug })));
const CookieClickerPage = lazy(() => 
  import("./pages/CookieClickerPage")
    .then(m => ({ default: m.CookieClickerPage }))
    .catch(error => {
      console.error('Failed to load CookieClickerPage:', error);
      // Return a fallback component
      return { 
        default: () => (
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Fehler beim Laden</h1>
              <p className="text-gray-400 mb-4">Die Cookie Clicker Seite konnte nicht geladen werden.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
              >
                Seite neu laden
              </button>
            </div>
          </div>
        )
      };
    })
);
const MobileCookieClickerPage = lazy(() => import("./pages/MobileCookieClickerPage").then(m => ({ default: m.MobileCookieClickerPage })));
const CookieClickerV2 = lazy(() => import("./pages/CookieClickerV2").then(m => ({ default: m.CookieClickerV2 })));
const LandingPage = lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })));
const ExternalInterestDemo = lazy(() => import("./pages/ExternalInterestDemo").then(m => ({ default: m.ExternalInterestDemo })));
const AffiliatePage = lazy(() => import("./pages/AffiliatePage").then(m => ({ default: m.AffiliatePage })));
const ImpressumPage = lazy(() => import("./pages/legal/ImpressumPage").then(m => ({ default: m.ImpressumPage })));
const AGBPage = lazy(() => import("./pages/legal/AGBPage").then(m => ({ default: m.AGBPage })));
const DatenschutzPage = lazy(() => import("./pages/legal/DatenschutzPage").then(m => ({ default: m.DatenschutzPage })));
const WiderrufPage = lazy(() => import("./pages/legal/WiderrufPage").then(m => ({ default: m.WiderrufPage })));
const VersandPage = lazy(() => import("./pages/legal/VersandPage").then(m => ({ default: m.VersandPage })));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage").then(m => ({ default: m.MaintenancePage })));
const MaintenanceControl = lazy(() => import("./pages/admin/MaintenanceControl").then(m => ({ default: m.MaintenanceControl })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-black">
    <NebulaLoader label="Lade Seite..." />
  </div>
);

const AppLayout = () => {
  const { toasts, removeToast } = useToastStore();
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const { isOpen: isCartOpen, openCart, closeCart, totalItems } = useGlobalCartStore();
  const hasAvailableDiscounts = useGamingDiscountStore(state => state.hasAvailableDiscounts());
  const availableDiscounts = useGamingDiscountStore(state => state.availableDiscounts);
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🎯 Auto-detect active tab from route
  const getActiveTabFromRoute = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/shop') return 'shop';
    if (path === '/drops') return 'drops';
    if (path === '/cookie-clicker' || path === '/mobile-cookie-clicker') return 'cookie-clicker';
    if (path === '/profile') return 'profile';
    return 'home';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromRoute());
  
  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromRoute());
  }, [location.pathname]);
  const { saveScrollPosition, restoreScrollPosition } = useScrollRestoration();
  const { initializeTelegram, loadTelegramScript } = useTelegramIntegration();
  const { executeCommand } = useBotCommandHandler();

  // 🎯 Handle Refresh
  const handleRefresh = async () => {
    triggerHaptic('light');
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  // 🎯 Initialize Telegram WebApp
  useEffect(() => {
    const init = async () => {
      // Try to load Telegram script if not available
      await loadTelegramScript();
      
      // Initialize Telegram WebApp (will retry automatically)
      const tg = await initializeTelegram();
      if (tg && import.meta.env.DEV) {
        console.log('✅ Telegram WebApp ready');
      }
    };
    init();
  }, [initializeTelegram, loadTelegramScript]);

  // 🎯 Handle Bot Commands from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success && result.action) {
        result.action();
      }
    }
  }, [executeCommand]);

  // 🎯 Navigation Items für Mobile - Basic Version mit Icons
  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" /> },
    { id: 'shop', label: 'Shop', icon: <ShoppingCart className="w-6 h-6" /> },
    { id: 'drops', label: 'Drops', icon: <Rocket className="w-6 h-6" /> },
    { id: 'cookie-clicker', label: 'Game', icon: <Cookie className="w-6 h-6" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-6 h-6" /> }
  ];

  return (
    <MobileOptimizations>
      <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] text-text safe-area-full">
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
        
        {/* Mobile Performance Monitor - Disabled for production */}
        {/* <MobilePerformanceMonitor /> */}
        
        {/* Mobile-First Layout */}
        {isMobile ? (
          <div className="flex flex-col min-h-screen">
            {/* Header für Mobile */}
            <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 safe-top">
              <div className="flex items-center justify-between px-4 py-3">
                <h1 className="text-xl font-bold gradient-text">Nebula</h1>
                <div className="flex items-center gap-2">
                  {/* Gaming Rabatt Button */}
                  {hasAvailableDiscounts && (
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        navigate('/cookie-clicker');
                      }}
                      className="relative p-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 transition-all touch-target animate-pulse"
                    >
                      <Cookie className="h-5 w-5 text-green-500" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-black">
                        <span className="text-[10px] font-bold text-white">
                          {availableDiscounts.length}
                        </span>
                      </div>
                    </button>
                  )}
                  
                  {/* Cart Button */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      openCart();
                    }}
                    className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors touch-target"
                  >
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {/* Badge */}
                  {totalItems > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-black">
                      <span className="text-xs font-bold text-white">
                          {totalItems}
                      </span>
                    </div>
                  )}
                  </button>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto">
              <PullToRefresh onRefresh={handleRefresh}>
                <div className="pb-20">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={location.pathname}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={getRouteTransition('forward')}
                      transition={{ type: "spring", stiffness: 200, damping: 25, mass: 1 }}
                    >
                      <Outlet />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </PullToRefresh>
            </main>

            {/* Mobile Bottom Navigation (correct variant) */}
            <MobileBottomNav
              items={mobileNavItems}
              activeItem={activeTab}
              onItemChange={(tab) => {
                triggerHaptic('light');
                setActiveTab(tab);
                // Navigate using React Router (SPA - no reload!)
                const routes: Record<string, string> = {
                  'home': '/',
                  'shop': '/shop',
                  'drops': '/drops',
                  'cookie-clicker': '/cookie-clicker',
                  'profile': '/profile'
                };
                if (routes[tab]) {
                  navigate(routes[tab]);
                }
              }}
            />

            {/* Mobile Cart FAB */}
            <CartFab />

            {/* Floating VIP Tab */}
            <VipFloatingTab />

            {/* Mobile Cart Bottom Sheet */}
            <OptimizedMobileCart isOpen={isCartOpen} onClose={closeCart} />
          </div>
        ) : (
          /* Desktop Layout */
          <div className="relative min-h-screen">
            <TabBar />
            <div className="pt-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={getRouteTransition('forward')}
                  transition={{ type: "spring", stiffness: 200, damping: 25, mass: 1 }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
            <GlobalCart />
            <Footer />
            
            {/* Floating VIP Tab */}
            <VipFloatingTab />
          </div>
        )}

        {/* Toast Manager */}
        <ToastManager toasts={toasts} onClose={removeToast} />
        
        {/* Background Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(circle_at_top,rgba(11,247,188,0.35),transparent_70%)]" />
      </div>
    </MobileOptimizations>
  );
};

const AppRoutes = () => (
  <ErrorBoundary>
    <BotCommandHandler />
    <BotResponseHandler />
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={
          <Suspense fallback={<PageLoader />}>
            <HomePageOptimized />
          </Suspense>
        } />
        <Route path="home" element={
          <Suspense fallback={<PageLoader />}>
            <HomePageOptimized />
          </Suspense>
        } />
        <Route path="shop" element={
          <Suspense fallback={<PageLoader />}>
            <ShopPage />
          </Suspense>
        } />
        <Route path="shop/:categorySlug" element={
          <Suspense fallback={<PageLoader />}>
            <CategoryShopPage />
          </Suspense>
        } />
        <Route path="shop/:categorySlug/:brandSlug" element={
          <Suspense fallback={<PageLoader />}>
            <CategoryShopPage />
          </Suspense>
        } />
        <Route path="shop/:categorySlug/:brandSlug/:seriesSlug" element={
          <Suspense fallback={<PageLoader />}>
            <CategoryShopPage />
          </Suspense>
        } />
        <Route path="drops" element={
          <Suspense fallback={<PageLoader />}>
            <DropsPage />
          </Suspense>
        } />
        <Route path="vip" element={
          <Suspense fallback={<PageLoader />}>
            <VipPage />
          </Suspense>
        } />
        <Route path="vip/tiers" element={
          <Suspense fallback={<PageLoader />}>
            <VipTiersPage />
          </Suspense>
        } />
        <Route path="affiliate" element={
          <Suspense fallback={<PageLoader />}>
            <AffiliatePage />
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        } />
        <Route path="cart" element={
          <Suspense fallback={<PageLoader />}>
            <CartPage />
          </Suspense>
        } />
        <Route path="checkout" element={
          <Suspense fallback={<PageLoader />}>
            <CheckoutPage />
          </Suspense>
        } />
        <Route path="order/:orderId" element={
          <Suspense fallback={<PageLoader />}>
            <OrderTrackingPage />
          </Suspense>
        } />
        <Route path="support" element={
          <Suspense fallback={<PageLoader />}>
            <SupportPage />
          </Suspense>
        } />
        <Route path="cookie-clicker" element={
          <Suspense fallback={<PageLoader />}>
            <CookieClickerPage />
          </Suspense>
        } />
        <Route path="mobile-cookie-clicker" element={
          <Suspense fallback={<PageLoader />}>
            <MobileCookieClickerPage />
          </Suspense>
        } />
        <Route path="cookie-clicker-v2" element={
          <Suspense fallback={<PageLoader />}>
            <CookieClickerV2 />
          </Suspense>
        } />
        <Route path="landingpage" element={
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        } />
        <Route path="end-to-end-test" element={
          <Suspense fallback={<PageLoader />}>
            <EndToEndTestPage />
          </Suspense>
        } />
        <Route path="debug-cart" element={
          <Suspense fallback={<PageLoader />}>
            <CartDebug />
          </Suspense>
        } />
        <Route path="external-interest-demo" element={
          <Suspense fallback={<PageLoader />}>
            <ExternalInterestDemo />
          </Suspense>
        } />
        <Route path="impressum" element={
          <Suspense fallback={<PageLoader />}>
            <ImpressumPage />
          </Suspense>
        } />
        <Route path="agb" element={
          <Suspense fallback={<PageLoader />}>
            <AGBPage />
          </Suspense>
        } />
        <Route path="datenschutz" element={
          <Suspense fallback={<PageLoader />}>
            <DatenschutzPage />
          </Suspense>
        } />
        <Route path="widerruf" element={
          <Suspense fallback={<PageLoader />}>
            <WiderrufPage />
          </Suspense>
        } />
        <Route path="versand" element={
          <Suspense fallback={<PageLoader />}>
            <VersandPage />
          </Suspense>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      {/* Maintenance route - outside AppLayout to hide navigation */}
      <Route path="/maintenance" element={
        <Suspense fallback={<PageLoader />}>
          <MaintenancePage />
        </Suspense>
      } />
      {/* Maintenance Control - Admin Interface */}
      <Route path="/admin/maintenance" element={
        <Suspense fallback={<PageLoader />}>
          <MaintenanceControl />
        </Suspense>
      } />
      {/* Direct checkout route as fallback */}
      <Route path="/checkout" element={
        <Suspense fallback={<PageLoader />}>
          <CheckoutPage />
        </Suspense>
      } />
    </Routes>
    {/* Debug Component - nur in DEV Mode */}
    {import.meta.env.DEV && (
      <Suspense fallback={null}>
        <CartDebug />
      </Suspense>
    )}
  </ErrorBoundary>
);

// Global minimal loader used while auth/store hydrates
const LoadingScreen = () => <NebulaLoader label="Nebula lädt…" />;

export default function App() {
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);
  
  // Check maintenance mode
  useMaintenanceMode();

  // 🎯 PWA Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            if (import.meta.env.DEV) {
              console.log('Service Worker registered:', registration);
            }
          })
          .catch((registrationError) => {
            console.error('Service Worker registration failed:', registrationError);
          });
      });
    }
  }, []);

  // 🎯 Auth Hydration
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("App: Starting hydration...");
    }
    hydrate().catch((error) => {
      console.error("Auth hydrate failed", error);
      // Force guest mode on error
      useAuthStore.setState({ status: "guest" });
    });
  }, [hydrate]);

  if (import.meta.env.DEV) {
    console.log("App: Current status:", status);
  }

  if (status === "loading") {
    if (import.meta.env.DEV) {
      console.log("App: Showing loading screen");
    }
    return <LoadingScreen />;
  }
  
  if (status === "guest") {
    if (import.meta.env.DEV) {
      console.log("App: Guest mode");
    }
    // In DEV mode, auto-login with demo user
    if (import.meta.env.DEV) {
      console.log("Auto-login in DEV mode");
      return <AppRoutes />;
    }
    return <Landing />;
  }
  
  if (import.meta.env.DEV) {
    console.log("App: Authenticated, showing routes");
  }
  return <AppRoutes />;
}

