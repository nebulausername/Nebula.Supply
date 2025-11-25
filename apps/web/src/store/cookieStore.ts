import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CookieState } from '../types/cookie.types';
import { BUILDINGS } from '../data/buildings';
import { UPGRADES } from '../data/upgrades';
import { ACHIEVEMENTS } from '../data/achievements';
import {
  calculateBuildingCost,
  calculateTotalCPS,
  calculateCPC,
  calculatePrestigePoints,
  calculatePrestigeMultiplier,
  detectPerformanceMode,
  generateId,
} from '../utils/cookieCalculations';

// 🍪 Main Cookie Game Store with Zustand

const initialState = {
  cookies: 0,
  cookiesPerSecond: 0,
  cookiesPerClick: 1,
  totalCookiesBaked: 0,
  prestigePoints: 0,
  prestigeMultiplier: 1,
  
  buildings: BUILDINGS.map((b) => ({ ...b, count: 0 })),
  upgrades: [...UPGRADES],
  achievements: [...ACHIEVEMENTS],
  
  touchEffects: [],
  
  settings: {
    soundEnabled: true,
    musicEnabled: false,
    vibrationEnabled: true,
    hapticFeedback: true,
    particlesEnabled: true,
    performanceMode: detectPerformanceMode(),
    theme: 'auto' as const,
  },
  
  stats: {
    totalCookiesBaked: 0,
    totalClicks: 0,
    sessionDuration: 0,
    clicksPerSecond: 0,
    maxCookiesPerSecond: 0,
    buildingsPurchased: 0,
    upgradesPurchased: 0,
    achievementsUnlocked: 0,
    goldenCookiesClicked: 0,
    prestigeLevel: 0,
  },
};

export const useCookieStore = create<CookieState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Add cookies (from clicking or passive generation)
      addCookie: (amount: number, fromClick = false) => {
        set((state) => {
          const newCookies = state.cookies + amount;
          const newTotal = state.totalCookiesBaked + amount;

          // Update stats
          const newStats = { ...state.stats };
          if (fromClick) {
            newStats.totalClicks += 1;
          }
          newStats.totalCookiesBaked = newTotal;

          // Check for new achievements
          const updatedAchievements = state.achievements.map((achievement) => {
            if (achievement.unlocked) return achievement;

            let shouldUnlock = false;

            switch (achievement.category) {
              case 'milestone':
                shouldUnlock = newTotal >= achievement.requirement;
                break;
              case 'special':
                if (achievement.id === 'special-6' || achievement.id === 'special-7') {
                  shouldUnlock = newStats.totalClicks >= achievement.requirement;
                }
                break;
            }

            if (shouldUnlock) {
              newStats.achievementsUnlocked += 1;
              return { ...achievement, unlocked: true };
            }

            return achievement;
          });

          return {
            cookies: newCookies,
            totalCookiesBaked: newTotal,
            stats: newStats,
            achievements: updatedAchievements,
          };
        });
      },

      // Purchase a building
      purchaseBuilding: (buildingId: string) => {
        const state = get();
        const buildingIndex = state.buildings.findIndex((b) => b.id === buildingId);
        
        if (buildingIndex === -1) return false;

        const building = state.buildings[buildingIndex];
        const cost = calculateBuildingCost(building);

        if (state.cookies < cost) return false;

        set((state) => {
          const newBuildings = [...state.buildings];
          newBuildings[buildingIndex] = {
            ...building,
            count: building.count + 1,
          };

          const newCPS = calculateTotalCPS(
            newBuildings,
            state.upgrades,
            state.prestigeMultiplier
          );

          const newStats = {
            ...state.stats,
            buildingsPurchased: state.stats.buildingsPurchased + 1,
            maxCookiesPerSecond: Math.max(state.stats.maxCookiesPerSecond, newCPS),
          };

          return {
            cookies: state.cookies - cost,
            buildings: newBuildings,
            cookiesPerSecond: newCPS,
            stats: newStats,
          };
        });

        return true;
      },

      // Purchase an upgrade
      purchaseUpgrade: (upgradeId: string) => {
        const state = get();
        const upgradeIndex = state.upgrades.findIndex((u) => u.id === upgradeId);
        
        if (upgradeIndex === -1) return false;

        const upgrade = state.upgrades[upgradeIndex];

        if (state.cookies < upgrade.cost || upgrade.purchased) return false;

        set((state) => {
          const newUpgrades = [...state.upgrades];
          newUpgrades[upgradeIndex] = {
            ...upgrade,
            purchased: true,
          };

          const newCPS = calculateTotalCPS(
            state.buildings,
            newUpgrades,
            state.prestigeMultiplier
          );

          const newCPC = calculateCPC(newUpgrades);

          const newStats = {
            ...state.stats,
            upgradesPurchased: state.stats.upgradesPurchased + 1,
            maxCookiesPerSecond: Math.max(state.stats.maxCookiesPerSecond, newCPS),
          };

          return {
            cookies: state.cookies - upgrade.cost,
            upgrades: newUpgrades,
            cookiesPerSecond: newCPS,
            cookiesPerClick: newCPC,
            stats: newStats,
          };
        });

        return true;
      },

      // Unlock achievement
      unlockAchievement: (achievementId: string) => {
        set((state) => {
          const newAchievements = state.achievements.map((achievement) =>
            achievement.id === achievementId
              ? { ...achievement, unlocked: true }
              : achievement
          );

          return {
            achievements: newAchievements,
            stats: {
              ...state.stats,
              achievementsUnlocked: state.stats.achievementsUnlocked + 1,
            },
          };
        });
      },

      // Add touch effect for animation
      addTouchEffect: (x: number, y: number, value: number) => {
        const id = generateId();
        set((state) => ({
          touchEffects: [
            ...state.touchEffects,
            {
              id,
              x,
              y,
              value,
              timestamp: Date.now(),
              velocity: { x: (Math.random() - 0.5) * 2, y: -2 },
            },
          ],
        }));

        // Auto-remove after animation duration
        setTimeout(() => {
          get().removeTouchEffect(id);
        }, 1000);
      },

      // Remove touch effect
      removeTouchEffect: (id: string) => {
        set((state) => ({
          touchEffects: state.touchEffects.filter((effect) => effect.id !== id),
        }));
      },

      // Update settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Calculate current CPS
      calculateCPS: () => {
        const state = get();
        return calculateTotalCPS(state.buildings, state.upgrades, state.prestigeMultiplier);
      },

      // Prestige system
      prestige: () => {
        const state = get();
        const newPrestigePoints = calculatePrestigePoints(state.totalCookiesBaked);
        
        if (newPrestigePoints === 0) return;

        const totalPrestigePoints = state.prestigePoints + newPrestigePoints;
        const newMultiplier = calculatePrestigeMultiplier(totalPrestigePoints);

        set({
          ...initialState,
          prestigePoints: totalPrestigePoints,
          prestigeMultiplier: newMultiplier,
          settings: state.settings,
          stats: {
            ...initialState.stats,
            prestigeLevel: state.stats.prestigeLevel + 1,
          },
        });
      },

      // Reset game
      reset: () => {
        set(initialState);
      },

      // Load game from storage (handled by persist middleware)
      loadGame: () => {
        // Handled automatically by persist middleware
      },

      // Save game to storage (handled by persist middleware)
      saveGame: () => {
        // Handled automatically by persist middleware
      },
    }),
    {
      name: 'nebula-cookie-clicker-v2',
      version: 1,
    }
  )
);

// Auto-save every 10 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    // Trigger a save by getting the state
    useCookieStore.persist.rehydrate();
  }, 10000);
}
