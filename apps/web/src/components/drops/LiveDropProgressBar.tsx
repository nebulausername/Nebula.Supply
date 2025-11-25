import { memo, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

interface LiveDropProgressBarProps {
  dropId: string;
  dropName: string;
  currentStock: number;
  maxStock?: number;
  progress?: number;
  status: 'available' | 'coming_soon' | 'sold_out' | 'ended';
  releaseDate?: string;
  endDate?: string;
  onStockChange?: (newStock: number) => void;
  showCountdown?: boolean;
}

export const LiveDropProgressBar = memo(({
  dropId,
  dropName,
  currentStock,
  maxStock,
  progress = 0,
  status,
  releaseDate,
  endDate,
  onStockChange,
  showCountdown = true
}: LiveDropProgressBarProps) => {
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isLowStock, setIsLowStock] = useState(false);
  const [previousStock, setPreviousStock] = useState(currentStock);
  const [stockChange, setStockChange] = useState<number | null>(null);

  // Calculate stock percentage
  const stockPercentage = useMemo(() => {
    if (!maxStock || maxStock === 0) return 0;
    return Math.min(100, (currentStock / maxStock) * 100);
  }, [currentStock, maxStock]);

  // Countdown timer
  useEffect(() => {
    if (!showCountdown || !endDate) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endDate, showCountdown]);

  // Detect stock changes
  useEffect(() => {
    if (previousStock !== currentStock) {
      const change = currentStock - previousStock;
      setStockChange(change);
      setIsLowStock(currentStock <= (maxStock || 100) * 0.2);
      
      if (onStockChange) {
        onStockChange(currentStock);
      }

      // Clear stock change indicator after 3 seconds
      setTimeout(() => setStockChange(null), 3000);
      setPreviousStock(currentStock);
    }
  }, [currentStock, previousStock, maxStock, onStockChange]);

  // Animated stock counter
  const { formattedCount } = useCountUp({
    end: currentStock,
    start: previousStock,
    duration: 1000,
    enabled: true
  });

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return isLowStock ? 'from-orange-500 to-red-500' : 'from-emerald-500 to-teal-500';
      case 'coming_soon':
        return 'from-blue-500 to-cyan-500';
      case 'sold_out':
        return 'from-gray-500 to-slate-500';
      case 'ended':
        return 'from-red-500 to-orange-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return isLowStock ? 'Niedriger Bestand' : 'Verfügbar';
      case 'coming_soon':
        return 'Kommt bald';
      case 'sold_out':
        return 'Ausverkauft';
      case 'ended':
        return 'Beendet';
      default:
        return 'Unbekannt';
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text truncate">{dropName}</h4>
          <p className="text-xs text-muted">{getStatusText()}</p>
        </div>
        {stockChange !== null && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                stockChange > 0
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {stockChange > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{stockChange > 0 ? '+' : ''}{stockChange}</span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-accent">{formattedCount}</span>
            {maxStock && (
              <>
                <span className="text-muted">/</span>
                <span className="text-muted">{maxStock}</span>
              </>
            )}
            <span className="text-muted">verfügbar</span>
          </div>
          <span className="text-muted">{Math.round(stockPercentage)}%</span>
        </div>

        <div className="relative h-3 overflow-hidden rounded-full bg-black/50">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r ${getStatusColor()} opacity-20`} />
          
          {/* Progress fill */}
          <motion.div
            className={`h-full bg-gradient-to-r ${getStatusColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${stockPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </motion.div>

          {/* Low stock indicator */}
          {isLowStock && status === 'available' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <AlertCircle className="h-4 w-4 text-orange-400" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Countdown Timer */}
      {showCountdown && timeRemaining && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2"
        >
          <Clock className="h-4 w-4 text-accent" />
          <div className="flex items-center gap-2 text-xs font-mono">
            {timeRemaining.days > 0 && (
              <span className="text-text">
                {timeRemaining.days}d
              </span>
            )}
            <span className="text-accent">
              {String(timeRemaining.hours).padStart(2, '0')}:
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
          </div>
        </motion.div>
      )}

      {/* Release Progress (for coming_soon) */}
      {status === 'coming_soon' && progress !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Release Progress</span>
            <span className="text-accent font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-black/50">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

LiveDropProgressBar.displayName = 'LiveDropProgressBar';

