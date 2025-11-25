import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { Building } from '../../types/cookie.types';
import { useCookieStore } from '../../store/cookieStore';
import { useHaptic } from '../../hooks/useHaptic';
import {
  calculateBuildingCost,
  formatNumber,
  canAffordBuilding,
  isUnlocked,
} from '../../utils/cookieCalculations';

interface BuildingCardProps {
  building: Building;
}

// 🏢 Building Card Component

export const BuildingCard: React.FC<BuildingCardProps> = ({ building }) => {
  const { cookies, totalCookiesBaked, purchaseBuilding } = useCookieStore();
  const { hapticPurchase, hapticError } = useHaptic();

  const cost = calculateBuildingCost(building);
  const canAfford = canAffordBuilding(cookies, building);
  const unlocked = isUnlocked(totalCookiesBaked, building.unlockRequirement);

  const handlePurchase = () => {
    if (!unlocked) return;

    if (canAfford) {
      const success = purchaseBuilding(building.id);
      if (success) {
        hapticPurchase();
      }
    } else {
      hapticError();
    }
  };

  if (!unlocked) {
    return (
      <motion.div
        className="relative overflow-hidden rounded-xl bg-gray-200 p-4 dark:bg-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 opacity-50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-300 dark:bg-gray-700">
            <Lock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">???</h3>
            <p className="text-sm text-gray-500">
              Unlock at {formatNumber(building.unlockRequirement)} cookies
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={handlePurchase}
      disabled={!canAfford}
      className={`relative w-full overflow-hidden rounded-xl p-4 text-left transition-all ${
        canAfford
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-lg dark:from-yellow-900/20 dark:to-orange-900/20'
          : 'bg-gray-100 opacity-60 dark:bg-gray-800'
      }`}
      whileHover={canAfford ? { scale: 1.02, y: -2 } : {}}
      whileTap={canAfford ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        {/* Building Icon */}
        <motion.div
          className={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl shadow-md ${
            canAfford
              ? 'bg-gradient-to-br from-yellow-400 to-orange-400'
              : 'bg-gray-300 dark:bg-gray-700'
          }`}
          animate={
            canAfford
              ? {
                  rotate: [0, -5, 5, 0],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {building.icon}
        </motion.div>

        {/* Building Info */}
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">{building.name}</h3>
            {building.count > 0 && (
              <span className="ml-2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-white">
                {building.count}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">{building.description}</p>

          <div className="mt-2 flex items-center justify-between">
            {/* Cost */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Cost:</span>
              <span
                className={`font-mono text-sm font-bold ${
                  canAfford ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatNumber(cost)}
              </span>
            </div>

            {/* Production */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">+</span>
              <span className="font-mono text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                {formatNumber(building.baseProduction)}
              </span>
              <span className="text-xs text-gray-500">/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shine effect on affordable buildings */}
      {canAfford && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </motion.button>
  );
};
