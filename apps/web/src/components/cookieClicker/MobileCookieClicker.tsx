import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { cn } from '../../utils/cn';
import { 
  Cookie, 
  TrendingUp, 
  Zap, 
  Star, 
  Crown, 
  Coins, 
  Trophy, 
  Settings,
  Play,
  Pause,
  RotateCcw,
  ShoppingCart,
  Gift,
  Users
} from 'lucide-react';
import { CoinIntegration } from './CoinIntegration';
import { AchievementSystem } from './AchievementSystem';
import { LeaderboardSystem } from './LeaderboardSystem';
import { DesignSystem, DesignUtils } from './DesignSystem';
import { MobileUXOptimizer, useMobileUX } from './MobileUXOptimizer';
import { AnimationSystem, useAnimation } from './AnimationSystem';
import { PerformanceOptimizer } from './PerformanceOptimizer';

// 🍪 MOBILE COOKIE CLICKER - SCHWIERIGER & GEILER!
export const MobileCookieClicker: React.FC = React.memo(() => {
  const {
    cookies,
    totalCookies,
    cookiesPerClick,
    cookiesPerSecond,
    level,
    xp,
    xpToNextLevel,
    streak,
    maxStreak,
    clicks,
    timePlayed,
    prestigeLevel,
    prestigePoints,
    buildings,
    upgrades,
    coins,
    coinMultiplier,
    clickCookie,
    buyBuilding,
    buyUpgrade,
    tick,
    prestige,
    toggleSound,
    toggleAnimations,
    cleanupParticles,
    soundEnabled,
    animationsEnabled,
    particles,
    goldenCookies
  } = useCookieClickerStore();

  // 🎯 CPS STATISTIKEN - NEU!
  const [maxCPS, setMaxCPS] = useState(0);
  const [currentCPS, setCurrentCPS] = useState(0);

  // 🎯 UX HOOKS - GEIL!
  const { isMobile, isPortrait, hapticEnabled } = useMobileUX();
  const { setAnimationsEnabled, reducedMotion } = useAnimation();

  const [activeTab, setActiveTab] = useState<'game' | 'buildings' | 'upgrades' | 'prestige' | 'coins' | 'achievements' | 'leaderboard'>('game');
  const [isLongPress, setIsLongPress] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const cookieRef = useRef<HTMLButtonElement>(null);

  // 🎯 GAME LOOP - SCHWIERIGER!
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000); // 1 Sekunde statt 100ms - SCHWIERIGER!

    return () => clearInterval(interval);
  }, [tick]);

  // 🎯 CPS STATISTIKEN UPDATEN - NEU!
  useEffect(() => {
    setCurrentCPS(cookiesPerSecond);
    if (cookiesPerSecond > maxCPS) {
      setMaxCPS(cookiesPerSecond);
    }
  }, [cookiesPerSecond, maxCPS]);

  // 🎯 PARTICLE CLEANUP
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupParticles();
    }, 2000);

    return () => clearInterval(interval);
  }, [cleanupParticles]);

  // 🎯 COOKIE KLICKEN - SCHWIERIGER!
  const handleCookieClick = useCallback((x: number, y: number) => {
    clickCookie(x, y);
    
    // 🎯 VISUAL FEEDBACK - GEIL!
    if (animationsEnabled) {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 200);
    }
  }, [clickCookie, animationsEnabled]);

  // 🎯 CLICK HANDLER - FÜR ONCLICK!
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!cookieRef.current) return;
    
    try {
      const rect = cookieRef.current.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        handleCookieClick(x, y);
      }
    } catch (error) {
      // Silently handle DOM errors (element not found, etc.)
      if (import.meta.env.DEV) {
        console.debug('Cookie click handler error:', error);
      }
    }
  }, [handleCookieClick]);

  // 🎯 TOUCH HANDLING - MOBILE OPTIMIERT!
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!cookieRef.current || !e.touches[0]) return;
    
    try {
      const touch = e.touches[0];
      const rect = cookieRef.current.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        handleCookieClick(x, y);
      }
    } catch (error) {
      // Silently handle DOM errors
      if (import.meta.env.DEV) {
        console.debug('Touch handler error:', error);
      }
    }
  }, [handleCookieClick]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsLongPress(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);

  // 🎯 LONG PRESS - MOBILE FEATURE!
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!cookieRef.current) return;
    
    try {
      const rect = cookieRef.current.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        handleCookieClick(x, y);
      }
    } catch (error) {
      // Silently handle DOM errors
      if (import.meta.env.DEV) {
        console.debug('Mouse down handler error:', error);
      }
    }
  }, [handleCookieClick]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  }, []);

  // 🎯 FORMATTING - DEUTSCH!
  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 🎯 BUILDINGS - DEUTSCHE NAMEN!
  const BUILDINGS = [
    { id: 'cursor', name: 'Klicker', cost: 15, cps: 0.1, icon: '🖱️' },
    { id: 'grandma', name: 'Oma', cost: 100, cps: 1, icon: '👵' },
    { id: 'farm', name: 'Bauernhof', cost: 1100, cps: 8, icon: '🚜' },
    { id: 'mine', name: 'Mine', cost: 12000, cps: 47, icon: '⛏️' },
    { id: 'factory', name: 'Fabrik', cost: 130000, cps: 260, icon: '🏭' },
    { id: 'bank', name: 'Bank', cost: 1400000, cps: 1400, icon: '🏦' },
    { id: 'temple', name: 'Tempel', cost: 20000000, cps: 7800, icon: '🏛️' },
    { id: 'wizard_tower', name: 'Zauberturm', cost: 330000000, cps: 44000, icon: '🧙' },
    { id: 'shipment', name: 'Raumschiff', cost: 5100000000, cps: 260000, icon: '🚀' },
    { id: 'alchemy_lab', name: 'Alchemie-Labor', cost: 75000000000, cps: 1600000, icon: '⚗️' }
  ];

  // 🎯 UPGRADES - DEUTSCHE NAMEN!
  const UPGRADES = [
    { id: 'reinforced_index', name: 'Verstärkter Zeigefinger', cost: 100, icon: '👆' },
    { id: 'carpal_tunnel_prevention_cream', name: 'Karpaltunnel-Creme', cost: 500, icon: '🧴' },
    { id: 'ambidextrous', name: 'Beidhändig', cost: 10000, icon: '🤲' },
    { id: 'thousand_fingers', name: 'Tausend Finger', cost: 100000, icon: '👐' },
    { id: 'million_fingers', name: 'Million Finger', cost: 1000000, icon: '👐👐' },
    { id: 'billion_fingers', name: 'Milliarde Finger', cost: 10000000, icon: '👐👐👐' }
  ];

  return (
    <MobileUXOptimizer>
      <AnimationSystem>
        <PerformanceOptimizer>
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* 🎯 HEADER - MOBILE OPTIMIERT! */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cookie className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold">Cookie Clicker</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted">Level {level}</div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </div>
          
          {/* 🎯 COOKIE STATS - KOMPAKT! */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/10 rounded-lg p-2">
              <div className="text-orange-500 font-bold">{formatNumber(cookies)}</div>
              <div className="text-xs text-muted">Kekse</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <div className="text-yellow-500 font-bold">{formatNumber(coins)}</div>
              <div className="text-xs text-muted">Coins</div>
        </div>
        </div>
        </div>
      </div>

      {/* 🎯 MAIN CONTENT */}
      <div className="px-4 py-6">
        {/* 🍪 COOKIE BUTTON - GEIL! */}
        <div className="flex justify-center mb-8">
        <button
          ref={cookieRef}
            onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          className={cn(
            "relative rounded-full p-6 transition-all duration-200 active:scale-95",
            "bg-gradient-to-br from-orange-400 to-orange-600 shadow-2xl",
            "focus:outline-none focus:ring-4 focus:ring-orange-500/50",
              isLongPress ? "scale-110 shadow-orange-500/50" : "hover:scale-105",
              isClicked && "animate-cookie-bounce"
          )}
          style={{ width: '150px', height: '150px' }}
        >
          <div className="text-5xl">🍪</div>
          {streak > 0 && (
            <div className="absolute -top-2 -right-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white animate-pulse">
              {streak}
            </div>
          )}
          {isLongPress && (
            <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
          )}
            {isClicked && (
              <div className="absolute inset-0 rounded-full border-4 border-orange-400 animate-ripple" />
          )}
        </button>
      </div>

        {/* 🎯 GAME STATS - KOMPAKT! */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted">Pro Klick</span>
            </div>
            <div className="text-lg font-bold text-blue-500">{formatNumber(cookiesPerClick)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted">Aktuell CPS</span>
            </div>
            <div className="text-lg font-bold text-green-500">{formatNumber(currentCPS)}</div>
          </div>
        </div>

        {/* 🎯 CPS STATISTIKEN - NEU! */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted">Höchster CPS</span>
            </div>
            <div className="text-lg font-bold text-yellow-500">{formatNumber(maxCPS)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-muted">Level</span>
            </div>
            <div className="text-lg font-bold text-purple-500">{level}</div>
        </div>
      </div>

        {/* 🎯 XP PROGRESS - GEIL! */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted mb-2">
            <span>XP Fortschritt</span>
            <span>{xp}/{xpToNextLevel}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${(xp / xpToNextLevel) * 100}%` }}
          />
        </div>
      </div>

        {/* 🎯 MOBILE NAVIGATION - GEIL! */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('game')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === 'game'
                ? "bg-orange-500 text-black"
                : "bg-white/10 text-muted hover:bg-white/20"
            )}
          >
            🎮 Spiel
          </button>
          <button
            onClick={() => setActiveTab('buildings')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === 'buildings'
                ? "bg-orange-500 text-black"
                : "bg-white/10 text-muted hover:bg-white/20"
            )}
          >
            🏗️ Gebäude
          </button>
        <button
            onClick={() => setActiveTab('upgrades')}
          className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === 'upgrades'
                ? "bg-orange-500 text-black"
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
            ⚡ Upgrades
        </button>
        <button
            onClick={() => setActiveTab('prestige')}
          className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === 'prestige'
                ? "bg-orange-500 text-black"
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
            👑 Prestige
        </button>
        <button
            onClick={() => setActiveTab('coins')}
          className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === 'coins'
                ? "bg-orange-500 text-black"
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
            🪙 Coins
        </button>
        <button
            onClick={() => setActiveTab('achievements')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === 'achievements'
                ? "bg-orange-500 text-black"
                : "bg-white/10 text-muted hover:bg-white/20"
            )}
          >
            🏆 Erfolge
        </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === 'leaderboard'
                ? "bg-orange-500 text-black"
                : "bg-white/10 text-muted hover:bg-white/20"
            )}
          >
            🏅 Leaderboard
          </button>
        </div>

        {/* 🎯 TAB CONTENT */}
        {activeTab === 'game' && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4">
              <h3 className="text-lg font-bold mb-3">Spiel Statistiken</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted">Klicks</div>
                  <div className="font-bold">{clicks.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted">Spielzeit</div>
                  <div className="font-bold">{formatTime(timePlayed)}</div>
                </div>
                <div>
                  <div className="text-muted">Combo</div>
                  <div className="font-bold text-red-500">{streak}x</div>
                </div>
                <div>
                  <div className="text-muted">Max Combo</div>
                  <div className="font-bold text-red-500">{maxStreak}x</div>
                </div>
      </div>
    </div>

            {/* 🎯 CPS STATISTIKEN DETAILS - NEU! */}
            <div className="bg-white/10 rounded-xl p-4">
              <h3 className="text-lg font-bold mb-3">CPS Statistiken</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted">Aktueller CPS</div>
                  <div className="font-bold text-green-500">{formatNumber(currentCPS)}</div>
                </div>
                <div>
                  <div className="text-muted">Höchster CPS</div>
                  <div className="font-bold text-yellow-500">{formatNumber(maxCPS)}</div>
                </div>
                <div>
                  <div className="text-muted">CPS Fortschritt</div>
                  <div className="font-bold text-blue-500">
                    {maxCPS > 0 ? `${Math.round((currentCPS / maxCPS) * 100)}%` : '0%'}
                  </div>
                </div>
          <div>
                  <div className="text-muted">CPS Multiplier</div>
                  <div className="font-bold text-purple-500">{coinMultiplier}x</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'buildings' && (
          <div className="space-y-3">
            {BUILDINGS.map((building) => {
              const owned = buildings[building.id] || 0;
              const cost = Math.floor(building.cost * Math.pow(1.15, owned));
              const canAfford = cookies >= cost;
              
              return (
                <div
                  key={building.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all duration-200",
                    canAfford
                      ? "border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 cursor-pointer"
                      : "border-white/10 bg-white/5 cursor-not-allowed opacity-50"
                  )}
                  onClick={() => canAfford && buyBuilding(building.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{building.icon}</span>
                      <div>
                        <h3 className="font-semibold text-text">{building.name}</h3>
                        <p className="text-xs text-muted">+{building.cps} Kekse/Sekunde</p>
                        <p className="text-xs text-muted">Besessen: {owned}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-accent">{formatNumber(cost)}</div>
                      <div className="text-xs text-muted">Kekse</div>
                    </div>
                  </div>
        </div>
              );
            })}
      </div>
        )}

        {activeTab === 'upgrades' && (
          <div className="space-y-3">
            {UPGRADES.map((upgrade) => {
              const hasUpgrade = upgrades[upgrade.id] || false;
              const canAfford = cookies >= upgrade.cost;
              
              return (
                <div
                  key={upgrade.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all duration-200",
                    canAfford && !hasUpgrade
                      ? "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer"
                      : "border-white/10 bg-white/5 cursor-not-allowed opacity-50"
                  )}
                  onClick={() => canAfford && !hasUpgrade && buyUpgrade(upgrade.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{upgrade.icon}</span>
                      <div>
                        <h3 className="font-semibold text-text">{upgrade.name}</h3>
                        <p className="text-xs text-muted">Verdoppelt deine Klick-Power!</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-accent">{formatNumber(upgrade.cost)}</div>
                      <div className="text-xs text-muted">Kekse</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'prestige' && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4">
              <h3 className="text-lg font-bold mb-3">Prestige System</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Prestige Level</span>
                  <span className="font-bold text-purple-500">{prestigeLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Prestige Punkte</span>
                  <span className="font-bold text-purple-500">{prestigePoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Benötigt für Prestige</span>
                  <span className="font-bold text-orange-500">1.000.000 Kekse</span>
                </div>
              </div>
              
              {totalCookies >= 1000000 && (
                <button
                  onClick={() => setShowPrestigeModal(true)}
                  className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Prestige machen!
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'coins' && (
          <CoinIntegration />
        )}

        {activeTab === 'achievements' && (
          <AchievementSystem />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardSystem />
        )}
      </div>

      {/* 🎯 PRESTIGE MODAL */}
      {showPrestigeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-sm w-full border border-white/20">
            <h3 className="text-xl font-bold mb-4">Prestige bestätigen</h3>
            <p className="text-muted mb-6">
              Du verlierst alle Kekse, Gebäude und Upgrades, aber erhältst {Math.floor(totalCookies / 1000000)} Prestige Punkte!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPrestigeModal(false)}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  prestige();
                  setShowPrestigeModal(false);
                }}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
              >
                Prestige!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 PARTICLE EFFECTS - GEIL! */}
      {animationsEnabled && particles.map((particle) => (
        <div
          key={particle.id}
          className="fixed pointer-events-none z-40 animate-ping"
          style={{
            left: particle.x,
            top: particle.y,
            color: particle.color || '#ff8c00',
            fontSize: particle.size || 16,
            fontWeight: 'bold'
          }}
        >
          +{formatNumber(particle.value)}
        </div>
      ))}
          </div>
        </PerformanceOptimizer>
      </AnimationSystem>
    </MobileUXOptimizer>
  );
});