import { useEffect, useState } from 'react';
import { useMobileOptimizations } from '../MobileOptimizations';
import { cn } from '../../utils/cn';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  batteryLevel?: number;
  connectionType?: string;
  isLowPowerMode?: boolean;
}

export const MobilePerformanceMonitor = () => {
  const { isMobile, screenSize } = useMobileOptimizations();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    batteryLevel: undefined,
    connectionType: 'unknown',
    isLowPowerMode: false
  });
  const [showMetrics, setShowMetrics] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);

  // 🎯 Performance Monitoring
  useEffect(() => {
    if (!isMobile) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrame: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationFrame = requestAnimationFrame(measureFPS);
    };

    animationFrame = requestAnimationFrame(measureFPS);

    // Memory monitoring
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        setMetrics(prev => ({ ...prev, memoryUsage: usage }));
      }
    };

    const memoryInterval = setInterval(checkMemory, 2000);

    // Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setMetrics(prev => ({
          ...prev,
          batteryLevel: battery.level,
          isLowPowerMode: battery.charging === false && battery.level < 0.2
        }));
      });
    }

    // Connection API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setMetrics(prev => ({
        ...prev,
        connectionType: connection.effectiveType || 'unknown'
      }));
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      clearInterval(memoryInterval);
    };
  }, [isMobile]);

  // 🎯 Auto-optimization based on metrics
  useEffect(() => {
    const shouldOptimize = 
      metrics.fps < 30 || 
      metrics.memoryUsage > 0.8 || 
      metrics.isLowPowerMode ||
      metrics.connectionType === 'slow-2g' ||
      metrics.connectionType === '2g';

    setIsOptimized(shouldOptimize);

    if (shouldOptimize) {
      // Apply performance optimizations
      document.body.classList.add('performance-mode');
      
      // Reduce animations
      const style = document.createElement('style');
      style.textContent = `
        .performance-mode * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.body.classList.remove('performance-mode');
    }
  }, [metrics]);

  // 🎯 Show metrics in development
  useEffect(() => {
    if (import.meta.env.DEV && isMobile) {
      setShowMetrics(true);
    }
  }, [isMobile]);

  if (!isMobile || !showMetrics) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-xl rounded-lg p-3 text-xs font-mono border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isOptimized ? "bg-yellow-500" : "bg-green-500"
        )} />
        <span className="text-white font-bold">
          {isOptimized ? 'OPTIMIZED' : 'NORMAL'}
        </span>
      </div>
      
      <div className="space-y-1 text-gray-300">
        <div>FPS: <span className={cn(
          metrics.fps >= 50 ? "text-green-400" : 
          metrics.fps >= 30 ? "text-yellow-400" : "text-red-400"
        )}>{metrics.fps}</span></div>
        
        <div>Memory: <span className={cn(
          metrics.memoryUsage < 0.5 ? "text-green-400" : 
          metrics.memoryUsage < 0.8 ? "text-yellow-400" : "text-red-400"
        )}>{(metrics.memoryUsage * 100).toFixed(1)}%</span></div>
        
        <div>Screen: <span className="text-blue-400">{screenSize}</span></div>
        
        {metrics.batteryLevel !== undefined && (
          <div>Battery: <span className={cn(
            metrics.batteryLevel > 0.5 ? "text-green-400" : 
            metrics.batteryLevel > 0.2 ? "text-yellow-400" : "text-red-400"
          )}>{(metrics.batteryLevel * 100).toFixed(0)}%</span></div>
        )}
        
        <div>Connection: <span className="text-purple-400">{metrics.connectionType}</span></div>
      </div>
    </div>
  );
};

// 🎯 Performance Optimizer Hook
export const useMobilePerformance = () => {
  const { isMobile, screenSize } = useMobileOptimizations();
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    // Detect low-end device
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    const isLowEndDevice = cores <= 4 && memory <= 4;

    setIsLowEnd(isLowEndDevice);

    // Apply optimizations for low-end devices
    if (isLowEndDevice) {
      // Reduce particle effects
      document.documentElement.style.setProperty('--particle-count', '5');
      // Reduce animation complexity
      document.documentElement.style.setProperty('--animation-duration', '0.2s');
    }
  }, [isMobile]);

  return {
    isLowEnd,
    shouldReduceAnimations: isLowEnd || screenSize === 'xs',
    shouldReduceParticles: isLowEnd,
    shouldUseSimpleLayout: screenSize === 'xs'
  };
};


