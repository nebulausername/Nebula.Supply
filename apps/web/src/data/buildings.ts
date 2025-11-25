import type { Building } from '../types/cookie.types';

// 🏢 Building Definitions - Balanced for engaging progression

export const BUILDINGS: Omit<Building, 'count'>[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'Auto-clicks the cookie',
    icon: '👆',
    baseCost: 15,
    baseProduction: 0.1,
    costMultiplier: 1.15,
    unlockRequirement: 0,
  },
  {
    id: 'grandma',
    name: 'Grandma',
    description: 'A nice grandma to bake cookies',
    icon: '👵',
    baseCost: 100,
    baseProduction: 1,
    costMultiplier: 1.15,
    unlockRequirement: 0,
  },
  {
    id: 'farm',
    name: 'Cookie Farm',
    description: 'Grows cookie plants',
    icon: '🌾',
    baseCost: 1100,
    baseProduction: 8,
    costMultiplier: 1.15,
    unlockRequirement: 500,
  },
  {
    id: 'mine',
    name: 'Cookie Mine',
    description: 'Mines chocolate chips',
    icon: '⛏️',
    baseCost: 12000,
    baseProduction: 47,
    costMultiplier: 1.15,
    unlockRequirement: 5000,
  },
  {
    id: 'factory',
    name: 'Cookie Factory',
    description: 'Produces cookies en masse',
    icon: '🏭',
    baseCost: 130000,
    baseProduction: 260,
    costMultiplier: 1.15,
    unlockRequirement: 50000,
  },
  {
    id: 'bank',
    name: 'Cookie Bank',
    description: 'Generates cookies from interest',
    icon: '🏦',
    baseCost: 1400000,
    baseProduction: 1400,
    costMultiplier: 1.15,
    unlockRequirement: 500000,
  },
  {
    id: 'temple',
    name: 'Cookie Temple',
    description: 'Summons cookies from the gods',
    icon: '🛕',
    baseCost: 20000000,
    baseProduction: 7800,
    costMultiplier: 1.15,
    unlockRequirement: 5000000,
  },
  {
    id: 'wizard',
    name: 'Wizard Tower',
    description: 'Conjures cookies with magic',
    icon: '🧙',
    baseCost: 330000000,
    baseProduction: 44000,
    costMultiplier: 1.15,
    unlockRequirement: 50000000,
  },
  {
    id: 'spaceship',
    name: 'Cookie Spaceship',
    description: 'Harvests cookies from space',
    icon: '🚀',
    baseCost: 5100000000,
    baseProduction: 260000,
    costMultiplier: 1.15,
    unlockRequirement: 500000000,
  },
  {
    id: 'datacenter',
    name: 'AI Datacenter',
    description: 'AI generates infinite cookies',
    icon: '🤖',
    baseCost: 75000000000,
    baseProduction: 1600000,
    costMultiplier: 1.15,
    unlockRequirement: 5000000000,
  },
  {
    id: 'portal',
    name: 'Cookie Portal',
    description: 'Opens portals to cookie dimensions',
    icon: '🌀',
    baseCost: 1000000000000,
    baseProduction: 10000000,
    costMultiplier: 1.15,
    unlockRequirement: 50000000000,
  },
  {
    id: 'timemachine',
    name: 'Time Machine',
    description: 'Brings cookies from the past',
    icon: '⏰',
    baseCost: 14000000000000,
    baseProduction: 65000000,
    costMultiplier: 1.15,
    unlockRequirement: 500000000000,
  },
];

// Helper to calculate current building cost
export const calculateBuildingCost = (building: Building): number => {
  return Math.floor(building.baseCost * Math.pow(building.costMultiplier, building.count));
};

// Helper to calculate building production with multipliers
export const calculateBuildingProduction = (
  building: Building,
  upgradeMultiplier: number = 1,
  prestigeMultiplier: number = 1
): number => {
  return building.baseProduction * building.count * upgradeMultiplier * prestigeMultiplier;
};
