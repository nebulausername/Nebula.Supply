import { useState, useEffect, useRef, memo, useMemo } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { AnimatedCounter } from "../../components/effects/AnimatedCounter";
import { GlowEffect, PulsingBorder } from "../../components/effects/GlowEffects";
import { TrendIndicator } from "../../components/stats/TrendIndicator";
import { HistoricalChart } from "../../components/stats/HistoricalChart";
import { glassmorphismCard } from "../../utils/glassmorphism";
import { cn } from "../../utils/cn";

// Remove the old AnimatedCounter since we're importing the enhanced one

export const StatsCard = memo(({ 
  stat, 
  index, 
  reducedMotion,
  liveValue,
  showPulse = false,
  previousValue,
  historicalData
}: { 
  stat: any; 
  index: number; 
  reducedMotion: boolean;
  liveValue?: number;
  showPulse?: boolean;
  previousValue?: number;
  historicalData?: Array<{ timestamp: number; value: number }>;
}) => {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [hovered, setHovered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    if (isInView) {
      controls.start({ opacity: 1, y: 0, scale: 1 });
    }
  }, [isInView, controls]);

  // Handle live value updates
  useEffect(() => {
    if (liveValue !== undefined && liveValue !== stat.value) {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [liveValue, stat.value]);

  const displayValue = liveValue !== undefined ? liveValue : stat.value;

  return (
    <GlowEffect
      intensity={isUpdating ? 'high' : 'medium'}
      color={stat.color.split(' ')[1] || '#0BF7BC'}
      pulse={showPulse || isUpdating}
    >
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={controls}
        transition={{
          delay: index * 0.15,
          duration: 0.6,
          type: "spring",
          stiffness: 100
        }}
        whileHover={reducedMotion ? {} : {
          scale: 1.08,
          rotateY: 8,
          rotateX: -2,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25
          }
        }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className={cn(
          "group relative overflow-hidden cursor-pointer",
          glassmorphismCard({ blur: 'lg', opacity: 0.15, border: true, shadow: true })
        )}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
        role="article"
        aria-label={`${stat.label}: ${displayValue}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Handle keyboard interaction
          }
        }}
      >
      {/* Animated Background Glow */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-30 transition-all duration-500`}
        animate={hovered ? { opacity: 0.3, scale: 1.1 } : { opacity: 0, scale: 1 }}
        style={{ transformOrigin: 'center' }}
      />

      {/* Floating Particles Effect */}
      {!reducedMotion && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${stat.color.split(' ')[1]}`}
              style={{
                top: `${20 + i * 15}%`,
                left: `${15 + i * 12}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      )}

      {/* Enhanced Content */}
      <div className="relative z-10 p-6">
        {/* Icon with Rotation Animation */}
        <motion.div
          className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-25 inline-block mb-6 relative`}
          whileHover={reducedMotion ? {} : {
            rotate: [0, -5, 5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={hovered ? { rotate: 360 } : {}}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <stat.icon className="h-8 w-8 text-accent drop-shadow-lg" />
          </motion.div>

          {/* Pulsing Ring */}
          <motion.div
            className={`absolute inset-0 rounded-2xl border-2 ${stat.color.split(' ')[1]} opacity-0`}
            animate={hovered ? {
              scale: [1, 1.2, 1],
              opacity: [0, 0.6, 0]
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>

        {/* Animated Value */}
        <motion.div
          className="mb-3"
          animate={hovered ? { scale: 1.05 } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent">
            {(() => {
              if (typeof displayValue === 'object') {
                return displayValue;
              }

              const rawValue = displayValue;
              const hasPercentSuffix = typeof rawValue === 'string' && rawValue.includes('%');
              const numericValue = typeof rawValue === 'string'
                ? Number.parseFloat(rawValue.replace(/[^0-9.-]/g, ''))
                : Number(rawValue ?? 0);

              if (Number.isNaN(numericValue)) {
                return rawValue;
              }

              return (
                <AnimatedCounter
                  end={numericValue}
                  suffix={hasPercentSuffix ? '%' : ''}
                  color={stat.color.split(' ')[1] || '#0BF7BC'}
                  showPulse={isUpdating}
                />
              );
            })()}
          </div>
          <p className="text-sm text-muted font-medium uppercase tracking-wide">
            {stat.label}
          </p>
        </motion.div>

        {/* Enhanced Trend Indicator */}
        <div className="mt-4 space-y-2">
          {(stat.change || previousValue !== undefined) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 + 0.5 }}
              className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20"
            >
              {previousValue !== undefined ? (
                <TrendIndicator
                  value={displayValue}
                  previousValue={previousValue}
                  size="sm"
                />
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </motion.div>
                  <span className="text-sm font-bold text-green-400">
                    {stat.change}
                  </span>
                </>
              )}
            </motion.div>
          )}

          {/* Historical Chart Toggle */}
          {historicalData && historicalData.length > 0 && (
            <motion.button
              onClick={() => setShowChart(!showChart)}
              className="w-full text-xs text-muted hover:text-accent transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showChart ? 'Chart ausblenden' : 'Verlauf anzeigen'}
            </motion.button>
          )}

          {/* Historical Chart */}
          {showChart && historicalData && historicalData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <HistoricalChart
                data={historicalData}
                color={stat.color.split(' ')[1] || '#0BF7BC'}
                height={40}
                showPoints={true}
              />
            </motion.div>
          )}
        </div>

        {/* Hover Glow Effect */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`}
        />
      </div>

        {/* Bottom Gradient Bar */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.15 + 0.8, duration: 0.8 }}
          style={{ transformOrigin: 'left' }}
        />
      </motion.div>
    </GlowEffect>
  );
});

StatsCard.displayName = 'StatsCard';
