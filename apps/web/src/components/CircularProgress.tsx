import { motion } from 'framer-motion';

export interface CircularProgressProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'w-20 h-20',
    radius: 32,
    strokeWidth: 6,
    fontSize: 'text-lg',
    labelSize: 'text-[10px]'
  },
  md: {
    container: 'w-24 h-24',
    radius: 40,
    strokeWidth: 8,
    fontSize: 'text-2xl',
    labelSize: 'text-xs'
  },
  lg: {
    container: 'w-32 h-32',
    radius: 56,
    strokeWidth: 10,
    fontSize: 'text-3xl',
    labelSize: 'text-sm'
  }
};

export const CircularProgress = ({
  value,
  max,
  label,
  color = '#0BF7BC',
  size = 'md',
  showPercentage = false,
  className = ''
}: CircularProgressProps) => {
  const config = sizeConfig[size as keyof typeof sizeConfig] || sizeConfig.md;
  const circumference = 2 * Math.PI * config.radius;
  const percentage = Math.min((value / max) * 100, 100);
  const progress = (percentage / 100) * circumference;
  const dashOffset = circumference - progress;

  // Center coordinates (assuming 96px viewBox for consistency)
  const center = 48;

  return (
    <div className={`relative ${config.container} ${className}`}>
      <svg 
        className="w-full h-full -rotate-90"
        viewBox="0 0 96 96"
      >
        {/* Background Circle */}
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={config.strokeWidth}
          fill="none"
        />

        {/* Progress Circle with Animation */}
        <motion.circle
          cx={center}
          cy={center}
          r={config.radius}
          stroke={color}
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ 
            duration: 1.5, 
            ease: 'easeOut',
            delay: 0.2
          }}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`
          }}
        />

        {/* Glow effect at the end of progress */}
        {percentage > 0 && (
          <motion.circle
            cx={center}
            cy={center}
            r={config.radius}
            stroke={color}
            strokeWidth={config.strokeWidth + 2}
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ 
              strokeDashoffset: dashOffset,
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              strokeDashoffset: { duration: 1.5, ease: 'easeOut', delay: 0.2 },
              opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            }}
            strokeLinecap="round"
            opacity={0.3}
          />
        )}
      </svg>

      {/* Center Content */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <p className={`${config.fontSize} font-bold text-text`}>
          {showPercentage ? `${Math.round(percentage)}%` : value}
        </p>
        <p className={`${config.labelSize} text-muted text-center leading-tight mt-0.5`}>
          {label}
        </p>
      </motion.div>

      {/* Pulse effect when complete */}
      {percentage >= 100 && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: color }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </div>
  );
};



