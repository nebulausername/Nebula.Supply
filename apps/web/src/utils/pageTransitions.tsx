// 🎯 Page Transition Utilities
// Smooth, app-like transitions between routes

import React from "react";
import { motion, Variants } from "framer-motion";
import { springConfigs } from "./springConfigs";

// Route transition variants based on direction
export const getRouteTransition = (
  direction: "forward" | "back" | "up" | "down" = "forward"
) => {
  switch (direction) {
    case "forward":
      return {
        initial: {
          opacity: 0,
          x: 300,
          scale: 0.95,
        },
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
        },
        exit: {
          opacity: 0,
          x: -300,
          scale: 0.95,
        },
        transition: springConfigs.smooth,
      };

    case "back":
      return {
        initial: {
          opacity: 0,
          x: -300,
          scale: 0.95,
        },
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
        },
        exit: {
          opacity: 0,
          x: 300,
          scale: 0.95,
        },
        transition: springConfigs.smooth,
      };

    case "up":
      return {
        initial: {
          opacity: 0,
          y: 100,
          scale: 0.95,
        },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
        },
        exit: {
          opacity: 0,
          y: 100,
          scale: 0.95,
        },
        transition: springConfigs.smooth,
      };

    case "down":
      return {
        initial: {
          opacity: 0,
          y: -100,
          scale: 0.95,
        },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
        },
        exit: {
          opacity: 0,
          y: -100,
          scale: 0.95,
        },
        transition: springConfigs.smooth,
      };

    default:
      return {
        initial: {
          opacity: 0,
          x: 300,
          scale: 0.95,
        },
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
        },
        exit: {
          opacity: 0,
          x: -300,
          scale: 0.95,
        },
        transition: springConfigs.smooth,
      };
  }
};

// Shared element transition variants
export const sharedElementVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springConfigs.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: springConfigs.quick,
  },
};

// Layout transition for smooth resizing
export const layoutTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// Page wrapper component with transitions
export const PageTransition = ({
  children,
  direction = "forward",
  className = "",
}: {
  children: React.ReactNode;
  direction?: "forward" | "back" | "up" | "down";
  className?: string;
}) => {
  const transition = getRouteTransition(direction);

  return (
    <motion.div
      className={className}
      initial={transition.initial}
      animate={transition.animate}
      exit={transition.exit}
      transition={transition.transition}
      layout
    >
      {children}
    </motion.div>
  );
};

// Staggered list animation
export const StaggeredList = ({
  children,
  className = "",
  staggerDelay = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) => {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// Staggered item component
export const StaggeredItem = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={className}
      variants={{
        initial: {
          opacity: 0,
          y: 20,
          scale: 0.95,
        },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
        },
      }}
      transition={springConfigs.gentle}
    >
      {children}
    </motion.div>
  );
};

// Predictive preloading hook
export const usePreloadRoute = () => {
  const preloadRoute = (route: string) => {
    // Preload the route component
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    import(/* @vite-ignore */ `../pages/${route}Page`).catch(() => {
      // Route doesn't exist, ignore
    });
  };

  return { preloadRoute };
};

// Scroll position restoration
export const useScrollRestoration = () => {
  const saveScrollPosition = (key: string) => {
    const scrollY = window.scrollY;
    sessionStorage.setItem(`scroll-${key}`, scrollY.toString());
  };

  const restoreScrollPosition = (key: string) => {
    const savedScrollY = sessionStorage.getItem(`scroll-${key}`);
    if (savedScrollY) {
      window.scrollTo(0, parseInt(savedScrollY));
    }
  };

  return { saveScrollPosition, restoreScrollPosition };
};

// View Transitions API Support (progressive enhancement)
export const useViewTransition = () => {
  const startViewTransition = (callback: () => void) => {
    if ('startViewTransition' in document) {
      // @ts-ignore - View Transitions API
      document.startViewTransition(callback);
    } else {
      callback();
    }
  };

  return { startViewTransition };
};

// Shared Element Transition Helper
export const createSharedElementTransition = (sharedId: string) => {
  return {
    layoutId: sharedId,
    transition: layoutTransition
  };
};

// Enhanced Page Transition with View Transitions API
export const EnhancedPageTransition = ({
  children,
  direction = "forward",
  className = "",
  sharedElementId,
}: {
  children: React.ReactNode;
  direction?: "forward" | "back" | "up" | "down";
  className?: string;
  sharedElementId?: string;
}) => {
  const transition = getRouteTransition(direction);
  const { startViewTransition } = useViewTransition();

  React.useEffect(() => {
    startViewTransition(() => {
      // Transition is handled by View Transitions API
    });
  }, []);

  return (
    <motion.div
      className={className}
      initial={transition.initial}
      animate={transition.animate}
      exit={transition.exit}
      transition={transition.transition}
      layout={!!sharedElementId}
      {...(sharedElementId && createSharedElementTransition(sharedElementId))}
    >
      {children}
    </motion.div>
  );
};






