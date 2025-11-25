import { useEffect, useRef } from "react";
import { useAchievementStore } from "../store/achievementStore";
import { useSound } from "./useSound";

interface GameState {
  totalCookiesBaked: number;
  totalClicks: number;
  totalPlayTime: number;
  buildings: Record<string, { count: number }>;
  achievements: any[];
}

export const useAchievements = (gameState: GameState) => {
  const { checkAchievements, achievements, unlockAchievement } = useAchievementStore();
  const { playSound } = useSound();
  const lastCheckedState = useRef<GameState | null>(null);
  const lastUnlockedCount = useRef<number>(0);

  // Check for new achievements
  useEffect(() => {
    if (!gameState) return;

    // Avoid checking on every render - only check when state actually changes
    if (lastCheckedState.current &&
        JSON.stringify(lastCheckedState.current) === JSON.stringify(gameState)) {
      return;
    }

    checkAchievements(gameState);
    lastCheckedState.current = { ...gameState };
  }, [gameState, checkAchievements]);

  // Listen for achievement unlocks and trigger effects
  useEffect(() => {
    const currentUnlockedCount = achievements.filter(a => a.unlocked).length;

    if (currentUnlockedCount > lastUnlockedCount.current) {
      // New achievement unlocked!
      const newAchievements = achievements.filter(
        a => a.unlocked && !lastCheckedState.current?.achievements?.find(
          (prev: any) => prev.id === a.id && prev.unlocked
        )
      );

      newAchievements.forEach(achievement => {
        // Play achievement sound
        playSound('achievement');

        // Trigger haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate([50, 100, 50]);
        }

        console.log(`🎉 Achievement unlocked: ${achievement.name}`);
      });

      lastUnlockedCount.current = currentUnlockedCount;
    }
  }, [achievements, playSound]);

  // Helper functions for achievement-related actions
  const getAchievementProgress = (id: string) => {
    const achievement = achievements.find(a => a.id === id);
    return achievement?.currentProgress || 0;
  };

  const isAchievementUnlocked = (id: string) => {
    const achievement = achievements.find(a => a.id === id);
    return achievement?.unlocked || false;
  };

  const getUnlockedAchievements = () => {
    return achievements.filter(a => a.unlocked);
  };

  const getAchievementsByCategory = (category: string) => {
    return achievements.filter(a => a.category === category);
  };

  return {
    achievements,
    getAchievementProgress,
    isAchievementUnlocked,
    getUnlockedAchievements,
    getAchievementsByCategory,
    unlockedCount: achievements.filter(a => a.unlocked).length,
    totalCount: achievements.length
  };
};
