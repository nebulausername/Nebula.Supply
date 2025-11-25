import { useEffect, useRef, useCallback, useState } from 'react';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { Battery, Wifi, Signal, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

// 🎯 Mobile Performance Metrics
interface MobilePerformanceMetrics {
  batteryLevel: number;
  connectionType: string;
  memoryUsage: number;
  fps: number;
  touchLatency: number;
  isLowPowerMode: boolean;
  isSlowConnection: boolean;
  recommendations: string[];
}

// 🎯 Mobile Performance Optimizer
export const MobilePerformanceOptimizer = () => {
  const { performanceMode, togglePerformanceMode } = useCookieClickerStore();
  const [metrics, setMetrics] = useState<MobilePerformanceMetrics>({
    batteryLevel: 100,
    connectionType: 'unknown',
    memoryUsage: 0,
    fps: 60,
    touchLatency: 0,
    isLowPowerMode: false,
    isSlowConnection: false,
    recommendations: []
  });

  const [isVisible, setIsVisible] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const touchStartRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // 🎯 Battery API
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setMetrics(prev => ({
          ...prev,
          batteryLevel: Math.round(battery.level * 100),
          isLowPowerMode: battery.level < 0.2
        }));

        battery.addEventListener('levelchange', () => {
          setMetrics(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isLowPowerMode: battery.level < 0.2
          }));
        });
      });
    }
  }, []);

  // 🎯 Connection API
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      setMetrics(prev => ({
        ...prev,
        connectionType: connection.effectiveType || 'unknown',
        isSlowConnection: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
      }));

      connection.addEventListener('change', () => {
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.effectiveType || 'unknown',
          isSlowConnection: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
        }));
      });
    }
  }, []);

  // 🎯 FPS Monitor
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;
    
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      
      setMetrics(prev => ({
        ...prev,
        fps
      }));
    }
    
    if (animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(measureFPS);
    }
  }, []);

  // 🎯 Memory Monitor
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(usage * 100)
      }));
    }
  }, []);

  // 🎯 Touch Latency Monitor
  const measureTouchLatency = useCallback(() => {
    const handleTouchStart = () => {
      touchStartRef.current = performance.now();
    };

    const handleTouchEnd = () => {
      const latency = performance.now() - touchStartRef.current;
      setMetrics(prev => ({
        ...prev,
        touchLatency: Math.round(latency)
      }));
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // 🎯 Performance Recommendations
  const generateRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (metrics.batteryLevel < 20) {
      recommendations.push('Enable Performance Mode to save battery');
    }

    if (metrics.fps < 30) {
      recommendations.push('Reduce visual effects for better performance');
    }

    if (metrics.memoryUsage > 80) {
      recommendations.push('Close other apps to free up memory');
    }

    if (metrics.touchLatency > 100) {
      recommendations.push('Touch response is slow - try restarting the app');
    }

    if (metrics.isSlowConnection) {
      recommendations.push('Slow connection detected - some features may be limited');
    }

    setMetrics(prev => ({
      ...prev,
      recommendations
    }));
  }, [metrics.batteryLevel, metrics.fps, metrics.memoryUsage, metrics.touchLatency, metrics.isSlowConnection]);

  // 🎯 Start Monitoring
  useEffect(() => {
    if (isVisible) {
      animationFrameRef.current = requestAnimationFrame(measureFPS);
      
      const memoryInterval = setInterval(measureMemory, 2000);
      const recommendationsInterval = setInterval(generateRecommendations, 5000);
      
      const cleanupTouch = measureTouchLatency();
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        clearInterval(memoryInterval);
        clearInterval(recommendationsInterval);
        cleanupTouch();
      };
    }
  }, [isVisible, measureFPS, measureMemory, measureTouchLatency, generateRecommendations]);

  // 🎯 Auto-optimize based on conditions
  useEffect(() => {
    if (metrics.batteryLevel < 15 && !performanceMode) {
      togglePerformanceMode();
    }
  }, [metrics.batteryLevel, performanceMode, togglePerformanceMode]);

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          isVisible 
            ? "bg-accent/20 text-accent" 
            : "bg-white/10 text-muted hover:bg-white/20"
        )}
      >
        <Zap className="h-4 w-4" />
        {isVisible ? 'Hide' : 'Show'} Mobile Performance
      </button>

      {/* Performance Metrics */}
      {isVisible && (
        <div className="space-y-3">
          {/* Device Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className={cn(
              "rounded-lg border p-3",
              metrics.batteryLevel < 20 
                ? "border-red-500/30 bg-red-500/5" 
                : metrics.batteryLevel < 50
                ? "border-yellow-500/30 bg-yellow-500/5"
                : "border-green-500/30 bg-green-500/5"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <Battery className="h-4 w-4" />
                <span className="text-xs text-muted">Battery</span>
              </div>
              <div className="text-lg font-bold">
                {metrics.batteryLevel}%
              </div>
              {metrics.isLowPowerMode && (
                <div className="text-xs text-red-400">Low Power Mode</div>
              )}
            </div>

            <div className={cn(
              "rounded-lg border p-3",
              metrics.isSlowConnection 
                ? "border-red-500/30 bg-red-500/5" 
                : "border-green-500/30 bg-green-500/5"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="h-4 w-4" />
                <span className="text-xs text-muted">Connection</span>
              </div>
              <div className="text-lg font-bold">
                {metrics.connectionType.toUpperCase()}
              </div>
              {metrics.isSlowConnection && (
                <div className="text-xs text-red-400">Slow Connection</div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className={cn(
              "rounded-lg border p-3",
              metrics.fps >= 50 ? "border-green-500/30 bg-green-500/5" : 
              metrics.fps >= 30 ? "border-yellow-500/30 bg-yellow-500/5" : "border-red-500/30 bg-red-500/5"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <Signal className="h-4 w-4" />
                <span className="text-xs text-muted">FPS</span>
              </div>
              <div className="text-lg font-bold">
                {metrics.fps}
              </div>
            </div>

            <div className={cn(
              "rounded-lg border p-3",
              metrics.memoryUsage < 50 ? "border-green-500/30 bg-green-500/5" : 
              metrics.memoryUsage < 80 ? "border-yellow-500/30 bg-yellow-500/5" : "border-red-500/30 bg-red-500/5"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted">Memory</span>
              </div>
              <div className="text-lg font-bold">
                {metrics.memoryUsage}%
              </div>
            </div>
          </div>

          {/* Touch Latency */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted">Touch Latency</span>
            </div>
            <div className={cn(
              "text-lg font-bold",
              metrics.touchLatency < 50 ? "text-green-400" : 
              metrics.touchLatency < 100 ? "text-yellow-400" : "text-red-400"
            )}>
              {metrics.touchLatency}ms
            </div>
          </div>

          {/* Recommendations */}
          {metrics.recommendations.length > 0 && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Recommendations</span>
              </div>
              <div className="space-y-1">
                {metrics.recommendations.map((recommendation, index) => (
                  <div key={index} className="text-xs text-yellow-300">
                    • {recommendation}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Mode Status */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Performance Mode</span>
              <div className={cn(
                "rounded-full px-2 py-1 text-xs font-medium",
                performanceMode 
                  ? "bg-yellow-500/20 text-yellow-400" 
                  : "bg-green-500/20 text-green-400"
              )}>
                {performanceMode ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div className="mt-1 text-xs text-muted">
              {performanceMode 
                ? 'Optimized for mobile performance' 
                : 'Full visual effects enabled'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🎯 Mobile Performance Hooks
export const useMobilePerformance = () => {
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Battery monitoring
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setIsLowPowerMode(battery.level < 0.2);
        
        battery.addEventListener('levelchange', () => {
          setIsLowPowerMode(battery.level < 0.2);
        });
      });
    }

    // Connection monitoring
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setIsSlowConnection(
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g'
      );

      connection.addEventListener('change', () => {
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g'
        );
      });
    }
  }, []);

  return {
    isLowPowerMode,
    isSlowConnection
  };
};
