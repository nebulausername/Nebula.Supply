import { useEffect, useState } from 'react';
import { MobileCookieClicker } from '../components/cookieClicker/MobileCookieClicker';
import { MobilePerformanceOptimizer } from '../components/cookieClicker/MobilePerformanceOptimizer';
import { useMobilePerformance } from '../components/cookieClicker/MobilePerformanceOptimizer';
import { useBotCommandHandler } from '../utils/botCommandHandler';

// 🎯 Mobile Cookie Clicker Page
export const MobileCookieClickerPage = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { isLowPowerMode, isSlowConnection } = useMobilePerformance();
  const { executeCommand } = useBotCommandHandler();

  // Check for bot commands in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [executeCommand]);

  // 🎯 PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 🎯 Install PWA
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed');
      } else {
        console.log('PWA installation declined');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  // 🎯 Viewport Meta Tag for Mobile
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(meta);
    }
  }, []);

  // 🎯 Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Mobile Cookie Clicker */}
      <MobileCookieClicker />

      {/* Performance Optimizer (Hidden by default) */}
      <div className="fixed bottom-20 right-4 z-40">
        <MobilePerformanceOptimizer />
      </div>

      {/* PWA Install Prompt */}
      {showInstallPrompt && !isInstalled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text">Install App</h3>
              <p className="text-xs text-muted">Get the full mobile experience</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-black hover:bg-accent/80 transition-all"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-muted hover:text-text transition-all"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Low Power Mode Warning */}
      {isLowPowerMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 backdrop-blur-lg border-b border-yellow-500/30 p-3">
          <div className="flex items-center gap-2">
            <div className="text-yellow-400">⚠️</div>
            <div className="text-sm text-yellow-100">
              Low battery detected - Performance mode enabled
            </div>
          </div>
        </div>
      )}

      {/* Slow Connection Warning */}
      {isSlowConnection && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/90 backdrop-blur-lg border-b border-red-500/30 p-3">
          <div className="flex items-center gap-2">
            <div className="text-red-400">📶</div>
            <div className="text-sm text-red-100">
              Slow connection - Some features may be limited
            </div>
          </div>
        </div>
      )}

      {/* Mobile-specific CSS */}
      <style>{`
        /* Prevent zoom on input focus */
        input, textarea, select {
          font-size: 16px !important;
        }

        /* Hide scrollbars on mobile */
        ::-webkit-scrollbar {
          display: none;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        /* Prevent text selection on game elements */
        .game-element {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }

        /* Optimize for mobile performance */
        * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Safe area for notched devices */
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }

        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Mobile-specific animations */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Dark mode optimizations */
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #000000;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .text-muted {
            color: #ffffff !important;
          }
        }
      `}</style>
    </div>
  );
};
