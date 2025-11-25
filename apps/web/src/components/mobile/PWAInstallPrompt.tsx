import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { triggerHaptic } = useEnhancedTouch();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds if not dismissed
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      triggerHaptic('success');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [triggerHaptic]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    triggerHaptic('medium');
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
      setShowPrompt(false);
    } else {
      console.log('PWA installation dismissed');
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isInstalled || !showPrompt) return null;

  // iOS Install Instructions
  if (isIOS) {
    return (
      <div className={cn(
        "fixed bottom-20 left-4 right-4 z-50",
        "bg-gradient-to-br from-[#111827] to-[#0A0A0A]",
        "border border-[#0BF7BC]/30 rounded-2xl shadow-2xl",
        "p-4 animate-slide-up",
        "safe-bottom"
      )}>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Smartphone className="w-8 h-8 text-[#0BF7BC]" />
          </div>
          <div>
            <h3 className="font-bold text-white mb-1">
              Als App installieren
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Installiere Nebula Cookie Clicker auf deinem iPhone:
            </p>
            <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
              <li>Tippe auf das <span className="font-bold">Teilen</span> Symbol</li>
              <li>Scrolle und wähle <span className="font-bold">"Zum Home-Bildschirm"</span></li>
              <li>Tippe auf <span className="font-bold">"Hinzufügen"</span></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop Install Prompt
  return (
    <div className={cn(
      "fixed bottom-20 left-4 right-4 z-50",
      "bg-gradient-to-br from-[#111827] to-[#0A0A0A]",
      "border border-[#0BF7BC]/30 rounded-2xl shadow-2xl",
      "p-4 animate-slide-up",
      "safe-bottom"
    )}>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#0BF7BC] to-[#61F4F4] flex items-center justify-center">
          <Download className="w-6 h-6 text-black" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">
            Als App installieren
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Installiere Nebula Cookie Clicker für schnellen Zugriff und Offline-Nutzung!
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg",
                "bg-gradient-to-r from-[#0BF7BC] to-[#61F4F4]",
                "text-black font-semibold text-sm",
                "transition-transform active:scale-95",
                "shadow-lg shadow-[#0BF7BC]/30"
              )}
            >
              Installieren
            </button>
            <button
              onClick={handleDismiss}
              className={cn(
                "px-4 py-2 rounded-lg",
                "bg-white/5 hover:bg-white/10",
                "text-gray-300 font-medium text-sm",
                "transition-colors"
              )}
            >
              Später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎯 Install Button Component (for manual placement)
export const InstallButton = ({ className }: { className?: string }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { triggerHaptic } = useEnhancedTouch();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    triggerHaptic('medium');
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setCanInstall(false);
    }

    setDeferredPrompt(null);
  };

  if (!canInstall) return null;

  return (
    <button
      onClick={handleInstall}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg",
        "bg-gradient-to-r from-[#0BF7BC] to-[#61F4F4]",
        "text-black font-semibold",
        "transition-transform hover:scale-105 active:scale-95",
        "shadow-lg shadow-[#0BF7BC]/30",
        className
      )}
    >
      <Download className="w-4 h-4" />
      <span>App installieren</span>
    </button>
  );
};


