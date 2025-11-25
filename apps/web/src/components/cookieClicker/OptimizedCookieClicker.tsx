import { useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useCookieClickerStore } from '../../store/cookieClicker';
// Performance optimizations - inline implementation for now
import { PerformanceMonitor } from './PerformanceMonitor';
import { CoinIntegration } from './CoinIntegration';
import { AchievementSystem } from './AchievementSystem';
import { Cookie, Zap, Star, Building, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber, formatTime } from '../../utils/cookieFormatters';

// 🍪 Optimized Cookie Clicker Main Component
export const OptimizedCookieClicker = memo(() => {
  // 🚀 Performance: Selektive Subscriptions statt gesamter Store
  const cookies = useCookieClickerStore(state => state.cookies);
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const cookiesPerClick = useCookieClickerStore(state => state.cookiesPerClick);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const level = useCookieClickerStore(state => state.level);
  const xp = useCookieClickerStore(state => state.xp);
  const xpToNextLevel = useCookieClickerStore(state => state.xpToNextLevel);
  const streak = useCookieClickerStore(state => state.streak);
  const maxStreak = useCookieClickerStore(state => state.maxStreak);
  const clicks = useCookieClickerStore(state => state.clicks);
  const timePlayed = useCookieClickerStore(state => state.timePlayed);
  const prestigeLevel = useCookieClickerStore(state => state.prestigeLevel);
  const prestigePoints = useCookieClickerStore(state => state.prestigePoints);
  const performanceMode = useCookieClickerStore(state => state.performanceMode);
  const soundEnabled = useCookieClickerStore(state => state.soundEnabled);
  const animationsEnabled = useCookieClickerStore(state => state.animationsEnabled);
  
  // Actions
  const clickCookie = useCookieClickerStore(state => state.clickCookie);
  const buyBuilding = useCookieClickerStore(state => state.buyBuilding);
  const buyUpgrade = useCookieClickerStore(state => state.buyUpgrade);
  const prestige = useCookieClickerStore(state => state.prestige);
  const togglePerformanceMode = useCookieClickerStore(state => state.togglePerformanceMode);
  const toggleSound = useCookieClickerStore(state => state.toggleSound);
  const toggleAnimations = useCookieClickerStore(state => state.toggleAnimations);

  const cookieRef = useRef<HTMLButtonElement>(null);
  const lastClickTimeRef = useRef(0);
  const clickCooldownRef = useRef(false);

  // 🎯 Optimized Click Handler
  const handleCookieClick = useCallback((event: React.MouseEvent) => {
    const now = Date.now();
    
    // Prevent rapid clicking (debounce)
    if (now - lastClickTimeRef.current < 50) return;
    if (clickCooldownRef.current) return;
    
    try {
      const target = event.currentTarget;
      if (!target) return;
      
      clickCooldownRef.current = true;
      lastClickTimeRef.current = now;
      
      const rect = target.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        clickCookie(x, y);
      }
      
      // Reset cooldown
      setTimeout(() => {
        clickCooldownRef.current = false;
      }, 50);
    } catch (error) {
      // Silently handle DOM errors
      if (import.meta.env.DEV) {
        console.debug('Cookie click handler error:', error);
      }
      clickCooldownRef.current = false;
    }
  }, [clickCookie]);

  // 🎯 Keyboard Support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (cookieRef.current) {
          const rect = cookieRef.current.getBoundingClientRect();
          const x = rect.width / 2;
          const y = rect.height / 2;
          clickCookie(x, y);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [clickCookie]);

  // 🎯 Memoized Formatierte Werte für Performance
  const formattedCookies = useMemo(() => formatNumber(cookies), [cookies]);
  const formattedCookiesPerClick = useMemo(() => formatNumber(cookiesPerClick), [cookiesPerClick]);
  const formattedCookiesPerSecond = useMemo(() => formatNumber(cookiesPerSecond), [cookiesPerSecond]);
  const formattedTotalCookies = useMemo(() => formatNumber(totalCookies), [totalCookies]);
  const formattedTimePlayed = useMemo(() => formatTime(timePlayed), [timePlayed]);
  const xpProgress = useMemo(() => (xp / xpToNextLevel) * 100, [xp, xpToNextLevel]);
  const canPrestige = useMemo(() => totalCookies >= 1000000, [totalCookies]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] text-text">
      {/* Performance Optimizations - TODO: Implement */}
      {/* <PerformanceOptimizations /> */}
      {/* <GameLoopOptimizer /> */}

      {/* Particle System - TODO: Implement */}
      {/* <OptimizedParticleSystem /> */}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-text">
            🍪 Nebula Cookie Clicker
          </h1>
          <p className="text-muted">
            Click the cookie to earn cookies and build your empire!
          </p>
        </div>

        {/* Main Game Area */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Game Stats */}
          <div className="space-y-6">
            {/* Cookie Display */}
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-6 text-center">
              <div className="mb-4 text-6xl">🍪</div>
              <div className="mb-2 text-3xl font-bold text-orange-400">
                {formattedCookies}
              </div>
              <div className="text-sm text-muted">cookies</div>
              <div className="mt-2 text-lg font-semibold text-accent">
                +{formattedCookiesPerClick} per click
              </div>
              <div className="text-sm text-muted">
                +{formattedCookiesPerSecond} per second
              </div>
            </div>

            {/* Game Stats */}
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 text-lg font-semibold text-text">Game Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Total Cookies:</span>
                    <span className="text-text">{formattedTotalCookies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Total Clicks:</span>
                    <span className="text-text">{clicks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Current Streak:</span>
                    <span className="text-text">{streak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Max Streak:</span>
                    <span className="text-text">{maxStreak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Time Played:</span>
                    <span className="text-text">{formattedTimePlayed}</span>
                  </div>
                </div>
              </div>

              {/* Level Progress */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 text-lg font-semibold text-text">Level Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Level {level}</span>
                    <span className="text-text">{xp} / {xpToNextLevel} XP</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, xpProgress)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Prestige */}
              {canPrestige && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-purple-400">Prestige</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Prestige Level:</span>
                      <span className="text-purple-400">{prestigeLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Prestige Points:</span>
                      <span className="text-purple-400">{prestigePoints}</span>
                    </div>
                    <button
                      onClick={prestige}
                      className="w-full rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/30 transition-all"
                    >
                      Prestige Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Column - Cookie */}
          <div className="flex flex-col items-center space-y-6">
            {/* Cookie Button */}
            <div className="relative">
              <button
                ref={cookieRef}
                onClick={handleCookieClick}
                className={cn(
                  "relative rounded-full p-8 transition-all duration-200 hover:scale-105 active:scale-95",
                  "bg-gradient-to-br from-orange-400 to-orange-600 shadow-2xl",
                  "focus:outline-none focus:ring-4 focus:ring-orange-500/50"
                )}
                style={{ width: '200px', height: '200px' }}
              >
                <div className="text-6xl">🍪</div>
                {streak > 0 && (
                  <div className="absolute -top-2 -right-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    {streak}
                  </div>
                )}
              </button>
              
              {/* Click Instructions */}
              <div className="mt-4 text-center text-sm text-muted">
                Click the cookie or press Space/Enter
              </div>
            </div>

            {/* Performance Monitor */}
            <PerformanceMonitor />
          </div>

          {/* Right Column - Systems */}
          <div className="space-y-6">
            {/* Coin Integration */}
            <CoinIntegration />

            {/* Achievement System */}
            <AchievementSystem />

            {/* Settings */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-4 text-lg font-semibold text-text">Settings</h3>
              <div className="space-y-3">
                <button
                  onClick={togglePerformanceMode}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
                    performanceMode 
                      ? "bg-yellow-500/20 text-yellow-400" 
                      : "bg-white/10 text-muted hover:bg-white/20"
                  )}
                >
                  <span>Performance Mode</span>
                  <Zap className="h-4 w-4" />
                </button>
                
                <button
                  onClick={toggleSound}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
                    soundEnabled 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-white/10 text-muted hover:bg-white/20"
                  )}
                >
                  <span>Sound Effects</span>
                  <Settings className="h-4 w-4" />
                </button>
                
                <button
                  onClick={toggleAnimations}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
                    animationsEnabled 
                      ? "bg-blue-500/20 text-blue-400" 
                      : "bg-white/10 text-muted hover:bg-white/20"
                  )}
                >
                  <span>Animations</span>
                  <Star className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedCookieClicker.displayName = 'OptimizedCookieClicker';

