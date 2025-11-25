import { motion } from 'framer-motion';

export interface AnimatedProgressBarProps {
  value: number;
  max?: number;
  showPulse?: boolean;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  color?: string;
  backgroundColor?: string;
  className?: string;
}

const heightConfig = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
};

export const AnimatedProgressBar = ({
  value,
  max = 100,
  showPulse = false,
  showLabel = true,
  height = 'md',
  color = 'from-accent to-emerald-400',
  backgroundColor = 'bg-white/10',
  className = ''
}: AnimatedProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const shouldPulse = showPulse && percentage > 90;

  return (
    <div className={`relative w-full ${className}`}>
      <div className={`relative ${heightConfig[height]} w-full rounded-full ${backgroundColor} overflow-hidden`}>
        {/* Progress Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 1.5, 
            ease: [0.4, 0, 0.2, 1] // Custom easing for smooth animation
          }}
          className={`h-full bg-gradient-to-r ${color} relative`}
        >
          {/* Pulse Effect */}
          {shouldPulse && (
            <>
              <motion.div
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute inset-0 bg-white/30"
              />
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            </>
          )}

          {/* Shimmer Effect */}
          {percentage > 0 && percentage < 100 && (
            <motion.div
              className="absolute inset-0"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'linear'
              }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
              }}
            />
          )}
        </motion.div>

        {/* Percentage Label */}
        {showLabel && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span 
              className={`text-xs font-bold text-white drop-shadow-lg ${
                percentage < 15 ? 'ml-auto mr-2' : ''
              }`}
              style={{
                textShadow: '0 1px 3px rgba(0,0,0,0.8)'
              }}
            >
              {Math.round(percentage)}%
            </span>
          </motion.div>
        )}
      </div>

      {/* Completion Celebration */}
      {percentage >= 100 && (
        <motion.div
          className="absolute -inset-1 rounded-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0, 0.5, 0],
            scale: [0.8, 1.1, 1.2]
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut'
          }}
          style={{
            background: `linear-gradient(90deg, transparent, ${color.includes('accent') ? '#0BF7BC' : '#34D399'}, transparent)`,
            filter: 'blur(8px)'
          }}
        />
      )}
    </div>
  );
};



