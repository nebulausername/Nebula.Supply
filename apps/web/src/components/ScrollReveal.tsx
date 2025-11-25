import { useEffect, useRef, ReactNode } from 'react';
import { motion, useInView, useAnimation, Variants } from 'framer-motion';
import { cn } from '../utils/cn';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  distance?: number;
  className?: string;
  once?: boolean;
  amount?: number;
  stagger?: number;
  reducedMotion?: boolean;
}

const defaultVariants: Record<string, Variants> = {
  up: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  },
  down: {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 }
  },
  left: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 }
  },
  right: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 }
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }
};

export const ScrollReveal = ({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  distance = 50,
  className,
  once = true,
  amount = 0.3,
  stagger,
  reducedMotion = false
}: ScrollRevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    } else if (!once) {
      controls.start('hidden');
    }
  }, [isInView, controls, once]);

  const variants = reducedMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 }
      }
    : {
        ...defaultVariants[direction],
        hidden: {
          ...defaultVariants[direction].hidden,
          ...(direction === 'up' || direction === 'down'
            ? { y: direction === 'up' ? distance : -distance }
            : { x: direction === 'left' ? distance : -distance })
        }
      };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={{
        duration: reducedMotion ? 0 : duration,
        delay: reducedMotion ? 0 : delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

interface ScrollRevealStaggerProps {
  children: ReactNode[];
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  distance?: number;
  className?: string;
  once?: boolean;
  amount?: number;
  stagger?: number;
  reducedMotion?: boolean;
}

export const ScrollRevealStagger = ({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  distance = 50,
  className,
  once = true,
  amount = 0.3,
  stagger = 0.1,
  reducedMotion = false
}: ScrollRevealStaggerProps) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once, amount });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    } else if (!once) {
      controls.start('hidden');
    }
  }, [isInView, controls, once]);

  const variants = reducedMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 }
      }
    : {
        hidden: {
          ...defaultVariants[direction].hidden,
          ...(direction === 'up' || direction === 'down'
            ? { y: direction === 'up' ? distance : -distance }
            : { x: direction === 'left' ? distance : -distance })
        },
        visible: {
          ...defaultVariants[direction].visible,
          transition: {
            staggerChildren: stagger
          }
        }
      };

  const itemVariants = reducedMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 }
      }
    : {
        hidden: {
          ...defaultVariants[direction].hidden,
          ...(direction === 'up' || direction === 'down'
            ? { y: direction === 'up' ? distance : -distance }
            : { x: direction === 'left' ? distance : -distance })
        },
        visible: {
          ...defaultVariants[direction].visible
        }
      };

  return (
    <motion.div
      ref={containerRef}
      initial="hidden"
      animate={controls}
      variants={variants}
      className={cn(className)}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          transition={{
            duration: reducedMotion ? 0 : duration,
            delay: reducedMotion ? 0 : delay,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

