import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedGradientProps {
  children?: ReactNode;
  className?: string;
  colors?: string[];
  duration?: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  size?: number;
}

export const AnimatedGradient = ({
  children,
  className = '',
  colors = ['#0BF7BC', '#A855F7', '#EC4899'],
  duration = 5,
  direction = 'diagonal',
  size = 200
}: AnimatedGradientProps) => {
  const gradientDirection = {
    horizontal: 'to right',
    vertical: 'to bottom',
    diagonal: 'to bottom right'
  }[direction];

  const backgroundSize = {
    horizontal: `${size * 2}% ${size}%`,
    vertical: `${size}% ${size * 2}%`,
    diagonal: `${size * 2}% ${size * 2}%`
  }[direction];

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        background: `linear-gradient(${gradientDirection}, ${colors.join(', ')})`,
        backgroundSize,
      }}
      animate={{
        backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedGradientText = ({
  children,
  className = '',
  colors = ['#0BF7BC', '#A855F7', '#EC4899'],
  duration = 3
}: {
  children: ReactNode;
  className?: string;
  colors?: string[];
  duration?: number;
}) => {
  return (
    <motion.span
      className={`bg-clip-text text-transparent bg-gradient-to-r ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: '200% 100%'
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      {children}
    </motion.span>
  );
};
