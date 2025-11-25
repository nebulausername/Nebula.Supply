import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Sparkles, ArrowRight } from 'lucide-react';
import { FreeShippingBadge } from './FreeShippingBadge';
import { formatCurrency } from '../../utils/currency';
import { useGlobalCartStore } from '../../store/globalCart';
import { cn } from '../../utils/cn';

interface FreeShippingHeroProps {
  threshold?: number;
  className?: string;
  sticky?: boolean;
}

export const FreeShippingHero = memo(({
  threshold = 25,
  className,
  sticky = false
}: FreeShippingHeroProps) => {
  const items = useGlobalCartStore((state) => state.items);
  
  const cartTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const progress = useMemo(() => {
    return Math.min(100, (cartTotal / threshold) * 100);
  }, [cartTotal, threshold]);

  const remaining = Math.max(0, threshold - cartTotal);
  const isComplete = progress >= 100;
  const isClose = remaining > 0 && remaining <= 5; // Within 5€

  if (isComplete) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            'w-full rounded-2xl border border-green-500/30',
            'bg-gradient-to-r from-green-500/20 to-emerald-400/20',
            'backdrop-blur-sm p-4 md:p-6',
            sticky && 'sticky top-4 z-10',
            className
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <Truck className="w-6 h-6 text-green-400" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Gratisversand freigeschaltet!
                  <motion.span
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                  </motion.span>
                </h3>
                <p className="text-sm text-green-200">
                  Deine Bestellung wird kostenlos versendet
                </p>
              </div>
            </div>
            <FreeShippingBadge progress={100} size="lg" />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'w-full rounded-2xl border',
        isClose
          ? 'border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-yellow-500/20'
          : 'border-accent/30 bg-gradient-to-r from-accent/20 to-emerald-400/20',
        'backdrop-blur-sm p-4 md:p-6',
        sticky && 'sticky top-4 z-10',
        className
      )}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              isClose ? 'bg-orange-500/20' : 'bg-accent/20'
            )}
          >
            <Truck className={cn('w-6 h-6', isClose ? 'text-orange-400' : 'text-accent')} />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">
              {isClose ? 'Fast geschafft!' : 'Gratisversand ab ' + formatCurrency(threshold, 'de-DE', 'EUR')}
            </h3>
            <p className="text-sm text-muted">
              {isClose
                ? `Noch ${formatCurrency(remaining, 'de-DE', 'EUR')} für kostenlosen Versand!`
                : `Füge noch ${formatCurrency(remaining, 'de-DE', 'EUR')} hinzu für kostenlosen Versand`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full md:w-64 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>{formatCurrency(cartTotal, 'de-DE', 'EUR')}</span>
            <span>{formatCurrency(threshold, 'de-DE', 'EUR')}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                isClose
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                  : 'bg-gradient-to-r from-accent to-emerald-400'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          {isClose && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-xs text-orange-400 font-medium"
            >
              <ArrowRight className="w-3 h-3" />
              <span>So nah dran!</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

FreeShippingHero.displayName = 'FreeShippingHero';

