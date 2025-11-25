import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 🎯 Mobile Detection Hook
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Screen size detection
      const isMobileScreen = window.innerWidth <= 768;
      const isTabletScreen = window.innerWidth > 768 && window.innerWidth <= 1024;
      
      // Touch detection
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // User agent detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      setIsMobile(isMobileScreen || isMobileUA);
      setIsTablet(isTabletScreen && !isMobileUA);
      setIsTouchDevice(isTouch);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet, isTouchDevice };
};

// 🎯 Mobile Redirect Component
export const MobileRedirect = () => {
  const navigate = useNavigate();
  const { isMobile, isTouchDevice } = useMobileDetection();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect if we're on mobile and haven't redirected yet
    if ((isMobile || isTouchDevice) && !hasRedirected) {
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on mobile page
      if (!currentPath.includes('mobile-cookie-clicker')) {
        setHasRedirected(true);
        navigate('/mobile-cookie-clicker', { replace: true });
      }
    }
  }, [isMobile, isTouchDevice, hasRedirected, navigate]);

  return null;
};

// 🎯 Device Info Component
export const DeviceInfo = () => {
  const { isMobile, isTablet, isTouchDevice } = useMobileDetection();
  const [showInfo, setShowInfo] = useState(false);

  if (!showInfo) {
    return (
      <button
        onClick={() => setShowInfo(true)}
        className="fixed bottom-4 left-4 z-50 rounded-full bg-black/50 p-2 text-white"
      >
        📱
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-lg bg-black/90 p-3 text-xs text-white">
      <div className="space-y-1">
        <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
        <div>Tablet: {isTablet ? 'Yes' : 'No'}</div>
        <div>Touch: {isTouchDevice ? 'Yes' : 'No'}</div>
        <div>Screen: {window.innerWidth}x{window.innerHeight}</div>
        <div>User Agent: {navigator.userAgent.slice(0, 20)}...</div>
      </div>
      <button
        onClick={() => setShowInfo(false)}
        className="mt-2 rounded bg-white/20 px-2 py-1 text-xs"
      >
        Close
      </button>
    </div>
  );
};
