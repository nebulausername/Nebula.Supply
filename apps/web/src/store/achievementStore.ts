import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACHIEVEMENTS as initialAchievements } from "../data/achievements";
import type { Achievement } from "../types/cookie.types";

interface ExtendedAchievement extends Achievement {
  currentProgress?: number;
}

interface AchievementState {
  achievements: ExtendedAchievement[];
  unlockedCount: number;
  totalCount: number;

  // Actions
  checkAchievements: (gameState: any) => void;
  unlockAchievement: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  getAchievementById: (id: string) => ExtendedAchievement | undefined;
  getUnlockedAchievements: () => ExtendedAchievement[];
  getAchievementsByCategory: (category: string) => ExtendedAchievement[];
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: initialAchievements.map(achievement => ({
        ...achievement,
        currentProgress: 0,
        unlocked: false
      })) as ExtendedAchievement[],
      unlockedCount: 0,
      totalCount: initialAchievements.length,

      checkAchievements: (gameState) => {
        const { achievements, updateProgress, unlockAchievement } = get();

        achievements.forEach(achievement => {
          if (achievement.unlocked) return;

          let shouldUnlock = false;
          let progress = 0;

          switch (achievement.category) {
            case 'milestone':
              // Check cookie milestones
              progress = gameState.totalCookiesBaked;
              shouldUnlock = progress >= achievement.requirement;
              break;

            case 'building':
              // Check building counts
              const buildingType = achievement.id.split('-')[1]; // e.g., "cursor", "grandma"
              const buildingCount = gameState.buildings[buildingType]?.count || 0;
              progress = buildingCount;
              shouldUnlock = buildingCount >= achievement.requirement;
              break;

            case 'special':
              // Special achievements (playtime, clicks, etc.)
              if (achievement.id.includes('playtime')) {
                progress = gameState.totalPlayTime;
                shouldUnlock = progress >= achievement.requirement;
              } else if (achievement.id.includes('clicks')) {
                progress = gameState.totalClicks;
                shouldUnlock = progress >= achievement.requirement;
              }
              break;
          }

          if (progress > 0) {
            updateProgress(achievement.id, progress);
          }

          if (shouldUnlock && !achievement.unlocked) {
            unlockAchievement(achievement.id);
          }
        });
      },

      unlockAchievement: (id) => {
        set((state) => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === id
              ? { ...achievement, unlocked: true }
              : achievement
          ),
          unlockedCount: state.unlockedCount + 1
        }));
      },

      updateProgress: (id, progress) => {
        set((state) => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === id
              ? { ...achievement, currentProgress: progress }
              : achievement
          )
        }));
      },

      getAchievementById: (id) => {
        return get().achievements.find(achievement => achievement.id === id);
      },

      getUnlockedAchievements: () => {
        return get().achievements.filter(achievement => achievement.unlocked);
      },

      getAchievementsByCategory: (category) => {
        return get().achievements.filter(achievement => achievement.category === category);
      }
    }),
    {
      name: 'nebula-achievements',
      partialize: (state) => ({
        achievements: state.achievements,
        unlockedCount: state.unlockedCount
      })
    }
  )
);
