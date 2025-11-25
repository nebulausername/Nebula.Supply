import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cookie, 
  Zap, 
  Star, 
  Trophy, 
  Coins, 
  Download, 
  Play, 
  Sparkles,
  Smartphone,
  Battery,
  Wifi
} from 'lucide-react';
import { cn } from '../../utils/cn';

// 🎯 Mobile Landing Component
export const MobileLanding = () => {
  const navigate = useNavigate();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // 🎯 PWA Install Detection
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // 🎯 Install PWA
  const handleInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed');
      }
      
      setDeferredPrompt(null);
      setIsInstalling(false);
    }
  };

  // 🎯 Start Game
  const handleStartGame = () => {
    navigate('/mobile-cookie-clicker');
  };

  // 🎯 Animated Counter
  const [cookieCount, setCookieCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCookieCount(prev => prev + Math.floor(Math.random() * 1000) + 100);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleCookieClick = () => {
    setIsAnimating(true);
    setCookieCount(prev => prev + 1);
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] text-text overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-orange-500/10 rounded-full animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-yellow-500/10 rounded-full animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-accent/10 rounded-full animate-pulse delay-500" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="text-8xl animate-bounce">🍪</div>
            <h1 className="text-4xl font-bold text-text">
              Nebula Cookie Clicker
            </h1>
            <p className="text-lg text-muted max-w-sm mx-auto">
              The ultimate mobile cookie clicking experience with haptic feedback, achievements, and offline play!
            </p>
          </div>

          {/* Live Cookie Counter */}
          <div className="space-y-4">
            <div className="text-2xl font-bold text-orange-400">
              {cookieCount.toLocaleString()} cookies baked!
            </div>
            <button
              onClick={handleCookieClick}
              className={cn(
                "relative rounded-full p-6 transition-all duration-200 active:scale-95",
                "bg-gradient-to-br from-orange-400 to-orange-600 shadow-2xl",
                "focus:outline-none focus:ring-4 focus:ring-orange-500/50",
                isAnimating ? "scale-110 shadow-orange-500/50" : "hover:scale-105"
              )}
              style={{ width: '120px', height: '120px' }}
            >
              <div className="text-4xl">🍪</div>
              {isAnimating && (
                <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
              )}
            </button>
            <div className="text-sm text-muted">Tap to bake cookies!</div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 w-full max-w-sm">
            <button
              onClick={handleStartGame}
              className="w-full rounded-xl bg-gradient-to-r from-accent to-accent/80 px-6 py-4 text-lg font-semibold text-black hover:from-accent/90 hover:to-accent/70 transition-all shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <Play className="h-5 w-5" />
                Start Playing
              </div>
            </button>

            {deferredPrompt && (
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full rounded-xl bg-white/10 px-6 py-4 text-lg font-semibold text-text hover:bg-white/20 transition-all border border-white/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <Download className="h-5 w-5" />
                  {isInstalling ? 'Installing...' : 'Install App'}
                </div>
              </button>
            )}
          </div>

          {/* Features Preview */}
          <div className="space-y-4">
            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="text-sm text-muted hover:text-text transition-all"
            >
              {showFeatures ? 'Hide' : 'Show'} Features
            </button>

            {showFeatures && (
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                  <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                  <div className="text-sm font-semibold text-text">Haptic Feedback</div>
                  <div className="text-xs text-muted">Feel every click</div>
                </div>
                
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                  <Trophy className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                  <div className="text-sm font-semibold text-text">Achievements</div>
                  <div className="text-xs text-muted">Unlock rewards</div>
                </div>
                
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                  <Coins className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                  <div className="text-sm font-semibold text-text">Coin System</div>
                  <div className="text-xs text-muted">Earn & spend</div>
                </div>
                
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                  <Smartphone className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                  <div className="text-sm font-semibold text-text">Offline Play</div>
                  <div className="text-xs text-muted">No internet needed</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full">
            <div className="w-1 h-3 bg-white/50 rounded-full mx-auto mt-2 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-16 space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text mb-4">
            Why Choose Mobile?
          </h2>
          <p className="text-muted max-w-md mx-auto">
            Optimized for mobile devices with advanced touch gestures, haptic feedback, and offline support.
          </p>
        </div>

        <div className="space-y-8">
          {/* Feature 1 */}
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-yellow-500/20 p-3">
              <Zap className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">Haptic Feedback</h3>
              <p className="text-sm text-muted">Feel every cookie click with advanced vibration patterns</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-purple-500/20 p-3">
              <Trophy className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">Achievement System</h3>
              <p className="text-sm text-muted">Unlock achievements and earn rewards for your progress</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-500/20 p-3">
              <Smartphone className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">PWA Support</h3>
              <p className="text-sm text-muted">Install as a native app and play offline</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-500/20 p-3">
              <Battery className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">Battery Optimized</h3>
              <p className="text-sm text-muted">Smart performance mode saves battery life</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 py-16 text-center">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-text">
            Ready to Start Baking?
          </h2>
          <p className="text-muted max-w-sm mx-auto">
            Join thousands of players in the ultimate cookie clicking experience!
          </p>
          <button
            onClick={handleStartGame}
            className="rounded-xl bg-gradient-to-r from-accent to-accent/80 px-8 py-4 text-lg font-semibold text-black hover:from-accent/90 hover:to-accent/70 transition-all shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <Play className="h-5 w-5" />
              Start Playing Now
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-8 text-center border-t border-white/10">
        <div className="space-y-2">
          <div className="text-sm text-muted">
            Made with ❤️ for mobile gamers
          </div>
          <div className="text-xs text-muted">
            Optimized for iOS and Android devices
          </div>
        </div>
      </div>
    </div>
  );
};
