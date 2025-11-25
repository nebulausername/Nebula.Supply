// 🎯 Spring Animation Configurations
// Natural, app-like motion with physics-based animations

export const springConfigs = {
  // Gentle spring for subtle interactions
  gentle: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8
  },
  
  // Snappy spring for buttons and quick actions
  snappy: {
    type: "spring",
    stiffness: 500,
    damping: 25,
    mass: 0.6
  },
  
  // Smooth spring for page transitions
  smooth: {
    type: "spring",
    stiffness: 200,
    damping: 25,
    mass: 1
  },
  
  // Bouncy spring for success animations
  bouncy: {
    type: "spring",
    stiffness: 400,
    damping: 20,
    mass: 0.8
  },
  
  // Wobbly spring for playful interactions
  wobbly: {
    type: "spring",
    stiffness: 180,
    damping: 12,
    mass: 1.2
  },
  
  // Quick spring for micro-interactions
  quick: {
    type: "spring",
    stiffness: 600,
    damping: 35,
    mass: 0.4
  }
} as const;

// Page transition variants
export const pageTransitions = {
  // Slide in from right (default)
  slideIn: {
    initial: { 
      opacity: 0, 
      x: 300,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      x: 0,
      scale: 1
    },
    exit: { 
      opacity: 0, 
      x: -300,
      scale: 0.95
    },
    transition: springConfigs.smooth
  },
  
  // Slide up from bottom (mobile)
  slideUp: {
    initial: { 
      opacity: 0, 
      y: 100,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1
    },
    exit: { 
      opacity: 0, 
      y: 100,
      scale: 0.95
    },
    transition: springConfigs.smooth
  },
  
  // Fade with scale (modals)
  fadeScale: {
    initial: { 
      opacity: 0, 
      scale: 0.8
    },
    animate: { 
      opacity: 1, 
      scale: 1
    },
    exit: { 
      opacity: 0, 
      scale: 0.8
    },
    transition: springConfigs.gentle
  },
  
  // Slide down (dropdowns)
  slideDown: {
    initial: { 
      opacity: 0, 
      y: -20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.95
    },
    transition: springConfigs.quick
  }
} as const;

// Stagger animation variants
export const staggerVariants = {
  // Stagger children with delay
  container: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },
  
  // Individual item animation
  item: {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1
    },
    transition: springConfigs.gentle
  },
  
  // Quick stagger for lists
  quickContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05
      }
    }
  },
  
  quickItem: {
    initial: { 
      opacity: 0, 
      y: 10,
      scale: 0.98
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1
    },
    transition: springConfigs.quick
  }
} as const;

// Micro-interaction variants
export const microInteractions = {
  // Button press
  buttonPress: {
    whileTap: { 
      scale: 0.95,
      transition: springConfigs.quick
    },
    whileHover: { 
      scale: 1.02,
      transition: springConfigs.gentle
    }
  },
  
  // Card hover
  cardHover: {
    whileHover: { 
      y: -4,
      scale: 1.02,
      transition: springConfigs.gentle
    },
    whileTap: { 
      scale: 0.98,
      transition: springConfigs.quick
    }
  },
  
  // Icon bounce
  iconBounce: {
    whileHover: { 
      scale: 1.1,
      rotate: 5,
      transition: springConfigs.bouncy
    },
    whileTap: { 
      scale: 0.9,
      transition: springConfigs.quick
    }
  },
  
  // Floating animation
  floating: {
    animate: {
      y: [-4, 4, -4],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
} as const;

// Performance-aware animation settings
export const getPerformanceAwareConfig = (isLowPerformance: boolean) => {
  if (isLowPerformance) {
    return {
      ...springConfigs.gentle,
      stiffness: 200,
      damping: 40,
      mass: 1.2
    };
  }
  return springConfigs.gentle;
};

// Reduced motion support
export const getReducedMotionConfig = () => ({
  type: "tween" as const,
  duration: 0.2,
  ease: "easeOut"
});




