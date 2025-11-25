import { motion } from "framer-motion";
import { Zap, TrendingUp } from "lucide-react";
import { cn } from "../../utils/cn";

interface EnhancedProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  showMilestones?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EnhancedProgressBar = ({ 
  progress, 
  showPercentage = true,
  showMilestones = true,
  animated = true,
  size = 'lg',
  className 
}: EnhancedProgressBarProps) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  };
  
  const milestones = [
    { value: 25, label: 'Start' },
    { value: 50, label: 'Hälfte' },
    { value: 75, label: 'Fast fertig' },
    { value: 100, label: 'Fertig!' }
  ];
  
  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'from-red-500 to-orange-500';
    if (progress < 50) return 'from-orange-500 to-yellow-500';
    if (progress < 75) return 'from-yellow-500 to-[#0BF7BC]';
    return 'from-[#0BF7BC] to-[#34D399]';
  };
  
  const getProgressGlow = (progress: number) => {
    if (progress < 25) return 'shadow-[0_0_20px_rgba(239,68,68,0.5)]';
    if (progress < 50) return 'shadow-[0_0_20px_rgba(251,191,36,0.5)]';
    if (progress < 75) return 'shadow-[0_0_20px_rgba(11,247,188,0.5)]';
    return 'shadow-[0_0_30px_rgba(11,247,188,0.8)]';
  };
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header mit Percentage & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={animated ? {
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {clampedProgress < 100 ? (
              <Zap className="w-5 h-5 text-[#0BF7BC]" />
            ) : (
              <TrendingUp className="w-5 h-5 text-[#34D399]" />
            )}
          </motion.div>
          <span className="text-sm font-medium text-white/80">
            {clampedProgress < 100 ? 'In Bearbeitung' : 'Abgeschlossen'}
          </span>
        </div>
        
        {showPercentage && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-baseline gap-1"
          >
            <span className="text-2xl font-bold font-mono bg-gradient-to-r from-[#0BF7BC] to-[#61F4F4] bg-clip-text text-transparent">
              {Math.round(clampedProgress)}
            </span>
            <span className="text-sm text-white/40">%</span>
          </motion.div>
        )}
      </div>
      
      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background Track */}
        <div className={cn(
          "relative w-full rounded-full overflow-hidden",
          "bg-gradient-to-r from-white/5 to-white/10",
          "border border-white/10",
          sizeClasses[size]
        )}>
          {/* Animated Background Pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.05) 10px,
                rgba(255,255,255,0.05) 20px
              )`
            }}
          />
          
          {/* Progress Fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{
              duration: animated ? 1.5 : 0,
              ease: [0.16, 1, 0.3, 1]
            }}
            className={cn(
              "relative h-full rounded-full",
              `bg-gradient-to-r ${getProgressColor(clampedProgress)}`,
              getProgressGlow(clampedProgress)
            )}
          >
            {/* Shimmer Effect */}
            <motion.div
              animate={animated ? {
                x: ['-100%', '200%']
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{ width: '50%' }}
            />
            
            {/* Glow Pulse */}
            <motion.div
              animate={animated ? {
                opacity: [0.5, 1, 0.5]
              } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
            />
          </motion.div>
        </div>
        
        {/* Milestones */}
        {showMilestones && (
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-1">
            {milestones.map((milestone) => (
              <div
                key={milestone.value}
                className="relative flex flex-col items-center"
                style={{ left: `${milestone.value}%`, transform: 'translateX(-50%)' }}
              >
                {/* Milestone Dot */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: clampedProgress >= milestone.value ? 1.2 : 0.8,
                    opacity: clampedProgress >= milestone.value ? 1 : 0.3
                  }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "w-3 h-3 rounded-full border-2 absolute -top-7",
                    clampedProgress >= milestone.value 
                      ? "bg-[#0BF7BC] border-[#0BF7BC] shadow-[0_0_10px_rgba(11,247,188,0.8)]" 
                      : "bg-white/10 border-white/20"
                  )}
                />
                
                {/* Milestone Label */}
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap mt-2",
                  clampedProgress >= milestone.value 
                    ? "text-[#0BF7BC]" 
                    : "text-white/30"
                )}>
                  {milestone.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Progress Stats */}
      <div className="flex items-center justify-between text-xs text-white/40 pt-6">
        <span>Start</span>
        <span className="text-white/60 font-medium">
          {clampedProgress < 100 ? `${100 - clampedProgress}% verbleibend` : 'Abgeschlossen ✓'}
        </span>
        <span>Ende</span>
      </div>
    </div>
  );
};


