// 🧮 Cookie Calculation Utilities

import type { Building, Upgrade, CookieState } from '../types/cookie.types';

/**
 * Calculate current cost of a building based on owned count
 */
export const calculateBuildingCost = (building: Building): number => {
  return Math.floor(building.baseCost * Math.pow(building.costMultiplier, building.count));
};

/**
 * Calculate total Cookies Per Second from all buildings
 */
export const calculateTotalCPS = (
  buildings: Building[],
  upgrades: Upgrade[],
  prestigeMultiplier: number = 1
): number => {
  let totalCPS = 0;

  // Global CPS multipliers from upgrades
  const globalCPSMultiplier = upgrades
    .filter((u) => u.purchased && u.type === 'cps' && u.multiplier)
    .reduce((acc, u) => acc * (u.multiplier || 1), 1);

  buildings.forEach((building) => {
    if (building.count === 0) return;

    // Get building-specific multipliers from upgrades
    const buildingMultiplier = upgrades
      .filter((u) => u.purchased && u.buildingId === building.id && u.multiplier)
      .reduce((acc, u) => acc * (u.multiplier || 1), 1);

    const buildingCPS =
      building.baseProduction *
      building.count *
      buildingMultiplier *
      globalCPSMultiplier *
      prestigeMultiplier;

    totalCPS += buildingCPS;
  });

  return totalCPS;
};

/**
 * Calculate Cookies Per Click with upgrades
 */
export const calculateCPC = (upgrades: Upgrade[], baseMultiplier: number = 1): number => {
  const cpcMultiplier = upgrades
    .filter((u) => u.purchased && u.type === 'cpc' && u.multiplier)
    .reduce((acc, u) => acc * (u.multiplier || 1), 1);

  return baseMultiplier * cpcMultiplier;
};

/**
 * Calculate Prestige Points from total cookies baked
 */
export const calculatePrestigePoints = (totalCookiesBaked: number): number => {
  return Math.floor(Math.sqrt(totalCookiesBaked / 1e12));
};

/**
 * Calculate Prestige Multiplier from prestige points
 */
export const calculatePrestigeMultiplier = (prestigePoints: number): number => {
  return 1 + prestigePoints * 0.01; // 1% bonus per prestige point
};

/**
 * Format large numbers in a readable way
 */
export const formatNumber = (num: number): string => {
  if (num < 1000) return Math.floor(num).toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num < 1000000000000000) return (num / 1000000000000).toFixed(1) + 'T';
  return (num / 1000000000000000).toFixed(1) + 'Q';
};

/**
 * Format number with commas for display
 */
export const formatNumberWithCommas = (num: number): string => {
  return Math.floor(num).toLocaleString('en-US');
};

/**
 * Check if upgrade is affordable
 */
export const canAffordUpgrade = (cookies: number, upgrade: Upgrade): boolean => {
  return cookies >= upgrade.cost && !upgrade.purchased;
};

/**
 * Check if building is affordable
 */
export const canAffordBuilding = (cookies: number, building: Building): boolean => {
  const cost = calculateBuildingCost(building);
  return cookies >= cost;
};

/**
 * Check if content is unlocked based on total cookies baked
 */
export const isUnlocked = (totalCookiesBaked: number, requirement: number): boolean => {
  return totalCookiesBaked >= requirement;
};

/**
 * Generate unique ID for touch effects
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Detect device performance capability
 */
export const detectPerformanceMode = (): 'high' | 'medium' | 'low' => {
  // @ts-ignore - navigator.deviceMemory might not be available
  const ram = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 2;

  if (ram >= 4 && cores >= 4) return 'high';
  if (ram >= 2 && cores >= 2) return 'medium';
  return 'low';
};

/**
 * Get performance config based on mode
 */
export const getPerformanceConfig = (
  mode: 'high' | 'medium' | 'low'
): {
  particles: boolean;
  particleCount: number;
  animations: 'full' | 'reduced' | 'minimal';
  shadows: boolean;
  blurEffects: boolean;
} => {
  const configs = {
    high: {
      particles: true,
      particleCount: 50,
      animations: 'full' as const,
      shadows: true,
      blurEffects: true,
    },
    medium: {
      particles: true,
      particleCount: 20,
      animations: 'reduced' as const,
      shadows: false,
      blurEffects: true,
    },
    low: {
      particles: false,
      particleCount: 0,
      animations: 'minimal' as const,
      shadows: false,
      blurEffects: false,
    },
  };

  return configs[mode];
};
