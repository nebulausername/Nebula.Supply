import { useCallback, useMemo } from 'react';
import { useCookieClickerStore } from '../store/cookieClicker';
import { BUILDINGS, UPGRADES } from '../store/cookieClicker';
import { shallow } from 'zustand/shallow';

// 🎯 Optimierte Store-Selektoren für bessere Performance
// Verwendet shallow equality checks um unnötige Re-Renders zu vermeiden

/**
 * Hook für optimierte Cookie Clicker Store-Selektoren
 * Verwendet shallow equality checks und memoization für bessere Performance
 */
export const useOptimizedCookieClickerStore = () => {
  // 🎯 Memoized Selektoren für verschiedene Bereiche
  
  // Core Stats - einzelne Werte (kein shallow nötig)
  const useCookies = () => useCookieClickerStore(state => state.cookies);
  const useTotalCookies = () => useCookieClickerStore(state => state.totalCookies);
  const useCookiesPerClick = () => useCookieClickerStore(state => state.cookiesPerClick);
  const useCookiesPerSecond = () => useCookieClickerStore(state => state.cookiesPerSecond);
  const useLevel = () => useCookieClickerStore(state => state.level);
  const useXp = () => useCookieClickerStore(state => state.xp);
  const useXpToNextLevel = () => useCookieClickerStore(state => state.xpToNextLevel);
  const useStreak = () => useCookieClickerStore(state => state.streak);
  const useCoins = () => useCookieClickerStore(state => state.coins);
  
  // 🎯 Shallow Equality für Objekte und Arrays
  const useBuildings = useCallback(() => {
    return useCookieClickerStore(state => state.buildings, shallow);
  }, []);
  
  const useUpgrades = useCallback(() => {
    return useCookieClickerStore(state => state.upgrades, shallow);
  }, []);
  
  const useParticles = useCallback(() => {
    return useCookieClickerStore(state => state.particles, shallow);
  }, []);
  
  // 🎯 Memoized Berechnungen - Building Costs
  const useBuildingData = useCallback(() => {
    const buildings = useCookieClickerStore(state => state.buildings, shallow);
    const cookies = useCookieClickerStore(state => state.cookies);
    
    return useMemo(() => {
      return BUILDINGS.map(building => {
        const owned = buildings[building.id] || 0;
        const cost = Math.floor(building.baseCost * Math.pow(1.2, owned));
        const canAfford = cookies >= cost;
        
        return { building, owned, cost, canAfford };
      });
    }, [buildings, cookies]);
  }, []);
  
  // 🎯 Memoized Berechnungen - Upgrade Availability
  const useUpgradeData = useCallback(() => {
    const upgrades = useCookieClickerStore(state => state.upgrades, shallow);
    const cookies = useCookieClickerStore(state => state.cookies);
    
    return useMemo(() => {
      return UPGRADES.map(upgrade => {
        const owned = upgrades[upgrade.id] || false;
        const canAfford = cookies >= upgrade.cost && !owned;
        
        return { upgrade, owned, canAfford };
      });
    }, [upgrades, cookies]);
  }, []);
  
  // 🎯 Memoized Available Upgrades
  const useAvailableUpgrades = useCallback(() => {
    const upgradeData = useUpgradeData();
    return useMemo(() => {
      return upgradeData.filter(u => !u.owned && u.canAfford);
    }, [upgradeData]);
  }, [useUpgradeData]);
  
  // 🎯 Actions - nur die benötigten Actions
  const useActions = useCallback(() => {
    return useCookieClickerStore(state => ({
      clickCookie: state.clickCookie,
      buyBuilding: state.buyBuilding,
      buyUpgrade: state.buyUpgrade,
      tick: state.tick,
      prestige: state.prestige,
      toggleSound: state.toggleSound,
      toggleAnimations: state.toggleAnimations,
      togglePerformanceMode: state.togglePerformanceMode,
      syncStatsToServer: state.syncStatsToServer,
    }), shallow);
  }, []);
  
  // 🎯 Settings - zusammengefasst für bessere Performance
  const useSettings = useCallback(() => {
    return useCookieClickerStore(state => ({
      soundEnabled: state.soundEnabled,
      animationsEnabled: state.animationsEnabled,
      performanceMode: state.performanceMode,
    }), shallow);
  }, []);
  
  // 🎯 Stats - zusammengefasst
  const useStats = useCallback(() => {
    return useCookieClickerStore(state => ({
      clicks: state.clicks,
      timePlayed: state.timePlayed,
      maxStreak: state.maxStreak,
      prestigeLevel: state.prestigeLevel,
      prestigePoints: state.prestigePoints,
    }), shallow);
  }, []);
  
  // 🎯 Session & VIP Status
  const useSessionStatus = useCallback(() => {
    return useCookieClickerStore(state => ({
      isActiveSession: state.isActiveSession,
      hasVipPassiveIncome: state.hasVipPassiveIncome,
      offlineCpsMultiplier: state.offlineCpsMultiplier,
      vipTier: state.vipTier,
      totalActiveTime: state.totalActiveTime,
    }), shallow);
  }, []);
  
  return {
    // Core Stats
    useCookies,
    useTotalCookies,
    useCookiesPerClick,
    useCookiesPerSecond,
    useLevel,
    useXp,
    useXpToNextLevel,
    useStreak,
    useCoins,
    
    // Objects/Arrays (shallow)
    useBuildings,
    useUpgrades,
    useParticles,
    
    // Memoized Calculations
    useBuildingData,
    useUpgradeData,
    useAvailableUpgrades,
    
    // Grouped Selectors
    useActions,
    useSettings,
    useStats,
    useSessionStatus,
  };
};

