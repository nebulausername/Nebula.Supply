import { motion } from 'framer-motion';
import { TrendingUp, MousePointerClick } from 'lucide-react';
import { useCookieStore } from '../../store/cookieStore';
import { formatNumber } from '../../utils/cookieCalculations';

// 📊 Top Stats Bar Component

export const StatsBar: React.FC = () => {
  const { cookiesPerSecond, totalCookiesBaked } = useCookieStore();

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-lg dark:from-gray-900/80 dark:to-gray-900/40"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* CPS Display */}
          <motion.div
            className="flex items-center gap-2 rounded-lg bg-white/60 px-4 py-2 shadow-md backdrop-blur-sm dark:bg-gray-800/60"
            whileHover={{ scale: 1.05 }}
          >
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">per second</span>
              <span className="font-mono text-lg font-bold text-green-600 dark:text-green-400">
                {formatNumber(cookiesPerSecond)}
              </span>
            </div>
          </motion.div>

          {/* Total Baked */}
          <motion.div
            className="flex items-center gap-2 rounded-lg bg-white/60 px-4 py-2 shadow-md backdrop-blur-sm dark:bg-gray-800/60"
            whileHover={{ scale: 1.05 }}
          >
            <MousePointerClick className="h-5 w-5 text-yellow-500" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">total baked</span>
              <span className="font-mono text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {formatNumber(totalCookiesBaked)}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
