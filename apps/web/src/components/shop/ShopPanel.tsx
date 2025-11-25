import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { useCookieStore } from '../../store/cookieStore';
import { BuildingCard } from './BuildingCard';

interface ShopPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// 🛍️ Shop Panel Component - Mobile Bottom Sheet Style

export const ShopPanel: React.FC<ShopPanelProps> = ({ isOpen, onClose }) => {
  const { buildings } = useCookieStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900"
          >
            {/* Handle Bar */}
            <div className="flex items-center justify-center py-3">
              <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-yellow-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Buildings</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Building List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-3 pb-6">
                {buildings.map((building) => (
                  <BuildingCard key={building.id} building={building} />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
