import { useEffect, useState } from "react";
import { cn } from "../utils/cn";

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

export const MobileOptimizations = ({ children }: MobileOptimizationsProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
      
      setIsMobile(isMobileDevice);
      setIsIOS(isIOSDevice);
      setViewportHeight(window.innerHeight);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // iOS Safari viewport height fix
  useEffect(() => {
    if (isIOS) {
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      setVH();
      window.addEventListener('resize', setVH);
      window.addEventListener('orientationchange', setVH);
      
      return () => {
        window.removeEventListener('resize', setVH);
        window.removeEventListener('orientationchange', setVH);
      };
    }
  }, [isIOS]);

  return (
    <div 
      className={cn(
        "mobile-optimized",
        isMobile && "touch-manipulation",
        isIOS && "ios-optimized"
      )}
      style={{
        minHeight: isIOS ? 'calc(var(--vh, 1vh) * 100)' : '100vh',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {children}
    </div>
  );
};

// Mobile-specific utility hooks
export const useMobileOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [screenSize, setScreenSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('lg');

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileDevice = width < 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(isMobileDevice);
      setIsTouch(isTouchDevice);
      
      if (width < 480) setScreenSize('xs');
      else if (width < 640) setScreenSize('sm');
      else if (width < 768) setScreenSize('md');
      else if (width < 1024) setScreenSize('lg');
      else setScreenSize('xl');
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isTouch, screenSize };
};

// Mobile-optimized component wrapper
export const MobileWrapper = ({ 
  children, 
  className = "",
  enableSwipe = false,
  enablePullToRefresh = false 
}: {
  children: React.ReactNode;
  className?: string;
  enableSwipe?: boolean;
  enablePullToRefresh?: boolean;
}) => {
  const { isMobile } = useMobileOptimizations();

  return (
    <div 
      className={cn(
        "mobile-wrapper",
        isMobile && "mobile-optimized",
        enableSwipe && "swipe-enabled",
        enablePullToRefresh && "pull-to-refresh",
        className
      )}
      style={{
        touchAction: enableSwipe ? 'pan-y' : 'manipulation',
        overscrollBehavior: 'contain'
      }}
    >
      {children}
    </div>
  );
};








