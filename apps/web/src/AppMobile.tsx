import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NebulaLoader } from "./components/ui/NebulaLoader";
import { useMobileOptimizations } from "./components/MobileOptimizations";
import { useToastStore } from "./store/toast";
import { useTelegramIntegration } from "./utils/telegramIntegration";
import { useBotCommandHandler } from "./utils/botCommandHandler";
import { springConfigs } from "./utils/springConfigs";

// Mobile Pages
import { MobileShopPage } from "./pages/MobileShopPage";
import { MobileProfilePage } from "./pages/MobileProfilePage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { Landing } from "./components/Landing";

// Mobile Layout Component
const MobileLayout = ({ children }: { children: React.ReactNode }) => {
  const { isMobile } = useMobileOptimizations();
  const { toasts, removeToast } = useToastStore();
  const { initializeTelegram, loadTelegramScript } = useTelegramIntegration();
  const { executeCommand } = useBotCommandHandler();

  // Initialize Telegram WebApp
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

  // Handle Bot Commands from URL
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#06060A] to-[#050505] text-white">
      {/* Toast Notifications */}
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={springConfigs.snappy}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{toast.title}</h4>
                  <p className="text-sm text-gray-300">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={springConfigs.smooth}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Mobile Routes Component
const MobileRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={springConfigs.smooth}
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/shop" element={<MobileShopPage />} />
          <Route path="/profile" element={<MobileProfilePage />} />
          <Route path="/drops" element={<MobileShopPage />} />
          <Route path="/vip" element={<MobileProfilePage />} />
          <Route path="/affiliate" element={<MobileProfilePage />} />
          <Route path="/support" element={<MobileProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cart" element={<MobileShopPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Mobile App Component
export const AppMobile = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate app loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) return <NebulaLoader label="Lädt…" />;

  return (
    <ErrorBoundary>
      <MobileLayout>
        <MobileRoutes />
      </MobileLayout>
    </ErrorBoundary>
  );
};




