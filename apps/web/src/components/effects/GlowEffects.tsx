import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowEffectProps {
  children: ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  color?: string;
  pulse?: boolean;
  className?: string;
}

export const GlowEffect = ({ 
  children, 
  intensity = 'medium', 
  color = '#0BF7BC',
  pulse = false,
  className = ''
}: GlowEffectProps) => {
  const intensityMap = {
    low: 'shadow-lg',
    medium: 'shadow-xl',
    high: 'shadow-2xl'
  };

  const pulseAnimation = pulse ? {
    animate: {
      boxShadow: [
        `0 0 20px ${color}40`,
        `0 0 40px ${color}60`,
        `0 0 20px ${color}40`
      ]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <motion.div
      className={`${intensityMap[intensity]} ${className}`}
      style={{
        boxShadow: `0 0 20px ${color}40`
      }}
      {...pulseAnimation}
    >
      {children}
    </motion.div>
  );
};

interface PulsingBorderProps {
  children: ReactNode;
  color?: string;
  speed?: number;
  className?: string;
}

export const PulsingBorder = ({ 
  children, 
  color = '#0BF7BC',
  speed = 2,
  className = ''
}: PulsingBorderProps) => {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        borderColor: [
          `${color}40`,
          `${color}80`,
          `${color}40`
        ]
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{
        border: `2px solid ${color}40`
      }}
    >
      {children}
    </motion.div>
  );
};

interface ShimmerEffectProps {
  children: ReactNode;
  color?: string;
  duration?: number;
  className?: string;
}

export const ShimmerEffect = ({ 
  children, 
  color = '#0BF7BC',
  duration = 2,
  className = ''
}: ShimmerEffectProps) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`
        }}
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {children}
    </div>
  );
};

interface HotItemGlowProps {
  children: ReactNode;
  isHot?: boolean;
  className?: string;
}

export const HotItemGlow = ({ 
  children, 
  isHot = false,
  className = ''
}: HotItemGlowProps) => {
  if (!isHot) return <>{children}</>;

  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        boxShadow: [
          '0 0 20px #F59E0B40',
          '0 0 40px #F59E0B60',
          '0 0 20px #F59E0B40'
        ]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-lg"
        animate={{
          background: [
            'radial-gradient(circle, #F59E0B20 0%, transparent 70%)',
            'radial-gradient(circle, #F59E0B40 0%, transparent 70%)',
            'radial-gradient(circle, #F59E0B20 0%, transparent 70%)'
          ]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {children}
    </motion.div>
  );
};

interface NewBadgeGlowProps {
  children: ReactNode;
  isNew?: boolean;
  className?: string;
}

export const NewBadgeGlow = ({ 
  children, 
  isNew = false,
  className = ''
}: NewBadgeGlowProps) => {
  if (!isNew) return <>{children}</>;

  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        boxShadow: [
          '0 0 15px #10B98140',
          '0 0 30px #10B98160',
          '0 0 15px #10B98140'
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className="absolute -inset-1 rounded-lg"
        animate={{
          background: [
            'linear-gradient(45deg, #10B98120, #0BF7BC20)',
            'linear-gradient(45deg, #10B98140, #0BF7BC40)',
            'linear-gradient(45deg, #10B98120, #0BF7BC20)'
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {children}
    </motion.div>
  );
};

// CSS-only glow effects for better performance
export const CSSGlow = ({ 
  children, 
  color = '#0BF7BC',
  intensity = 'medium',
  className = ''
}: { 
  children: ReactNode; 
  color?: string; 
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}) => {
  const intensityMap = {
    low: 'shadow-lg',
    medium: 'shadow-xl',
    high: 'shadow-2xl'
  };

  return (
    <div 
      className={`${intensityMap[intensity]} ${className}`}
      style={{
        boxShadow: `0 0 20px ${color}40`
      }}
    >
      {children}
    </div>
  );
};

// Performance-optimized glow for mobile
export const MobileGlow = ({ 
  children, 
  color = '#0BF7BC',
  className = ''
}: { 
  children: ReactNode; 
  color?: string; 
  className?: string;
}) => {
  return (
    <div 
      className={`shadow-lg ${className}`}
      style={{
        boxShadow: `0 0 10px ${color}30`
      }}
    >
      {children}
    </div>
  );
};




































































































