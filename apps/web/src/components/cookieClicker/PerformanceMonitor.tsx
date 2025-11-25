import { useEffect, useState, useRef, useCallback } from 'react';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { Activity, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

// 🎯 Performance Metrics Interface
interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  particleCount: number;
  renderTime: number;
  gameLoopTime: number;
  isHealthy: boolean;
  warnings: string[];
}

// 🎯 Performance Monitor Component
export const PerformanceMonitor = () => {
  const { performanceMode, particles, cookiesPerSecond } = useCookieClickerStore();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    particleCount: 0,
    renderTime: 0,
    gameLoopTime: 0,
    isHealthy: true,
    warnings: []
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(0);
  const gameLoopStartRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // 🎯 FPS Counter
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;
    
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      
      setMetrics(prev => ({
        ...prev,
        fps,
        particleCount: particles.length
      }));
    }
    
    if (animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(measureFPS);
    }
  }, [particles.length]);

  // 🎯 Memory Usage Monitor
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

  // 🎯 Render Time Monitor
  const measureRenderTime = useCallback(() => {
    renderStartRef.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartRef.current;
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime * 100) / 100
      }));
    };
  }, []);

  // 🎯 Game Loop Time Monitor
  const measureGameLoopTime = useCallback(() => {
    gameLoopStartRef.current = performance.now();
    
    return () => {
      const gameLoopTime = performance.now() - gameLoopStartRef.current;
      setMetrics(prev => ({
        ...prev,
        gameLoopTime: Math.round(gameLoopTime * 100) / 100
      }));
    };
  }, []);

  // 🎯 Health Check
  const checkHealth = useCallback(() => {
    const warnings: string[] = [];
    let isHealthy = true;

    // FPS Check
    if (metrics.fps < 30) {
      warnings.push('Low FPS detected');
      isHealthy = false;
    }

    // Memory Check
    if (metrics.memoryUsage > 80) {
      warnings.push('High memory usage');
      isHealthy = false;
    }

    // Particle Count Check
    if (particles.length > 100 && !performanceMode) {
      warnings.push('Too many particles');
      isHealthy = false;
    }

    // Render Time Check
    if (metrics.renderTime > 16) {
      warnings.push('Slow rendering');
      isHealthy = false;
    }

    // Game Loop Time Check
    if (metrics.gameLoopTime > 10) {
      warnings.push('Slow game loop');
      isHealthy = false;
    }

    setMetrics(prev => ({
      ...prev,
      isHealthy,
      warnings
    }));
  }, [metrics.fps, metrics.memoryUsage, metrics.renderTime, metrics.gameLoopTime, particles.length, performanceMode]);

  // 🎯 Start Monitoring
  useEffect(() => {
    if (isVisible) {
      animationFrameRef.current = requestAnimationFrame(measureFPS);
      
      const memoryInterval = setInterval(measureMemory, 1000);
      const healthInterval = setInterval(checkHealth, 2000);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        clearInterval(memoryInterval);
        clearInterval(healthInterval);
      };
    }
  }, [isVisible, measureFPS, measureMemory, checkHealth]);

  // 🎯 Performance Optimizations
  const optimizePerformance = useCallback(() => {
    const { cleanupParticles, togglePerformanceMode } = useCookieClickerStore.getState();
    
    // Clean up particles if too many
    if (particles.length > 50) {
      cleanupParticles();
    }
    
    // Enable performance mode if FPS is low
    if (metrics.fps < 30 && !performanceMode) {
      togglePerformanceMode();
    }
  }, [particles.length, metrics.fps, performanceMode]);

  // 🎯 Auto-optimize when performance is poor
  useEffect(() => {
    if (metrics.warnings.length > 2) {
      optimizePerformance();
    }
  }, [metrics.warnings.length, optimizePerformance]);

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
        <Activity className="h-4 w-4" />
        {isVisible ? 'Hide' : 'Show'} Performance Monitor
      </button>

      {/* Performance Metrics */}
      {isVisible && (
        <div className="space-y-3">
          {/* Health Status */}
          <div className={cn(
            "rounded-lg border p-3",
            metrics.isHealthy 
              ? "border-green-500/30 bg-green-500/5" 
              : "border-red-500/30 bg-red-500/5"
          )}>
            <div className="flex items-center gap-2">
              {metrics.isHealthy ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              )}
              <span className={cn(
                "text-sm font-medium",
                metrics.isHealthy ? "text-green-400" : "text-red-400"
              )}>
                {metrics.isHealthy ? 'Performance Healthy' : 'Performance Issues Detected'}
              </span>
            </div>
            
            {metrics.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {metrics.warnings.map((warning, index) => (
                  <div key={index} className="text-xs text-red-400">
                    • {warning}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-muted">FPS</span>
              </div>
              <div className={cn(
                "text-lg font-bold",
                metrics.fps >= 50 ? "text-green-400" : 
                metrics.fps >= 30 ? "text-yellow-400" : "text-red-400"
              )}>
                {metrics.fps}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted">Memory</span>
              </div>
              <div className={cn(
                "text-lg font-bold",
                metrics.memoryUsage < 50 ? "text-green-400" : 
                metrics.memoryUsage < 80 ? "text-yellow-400" : "text-red-400"
              )}>
                {metrics.memoryUsage}%
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted">Particles</span>
              </div>
              <div className={cn(
                "text-lg font-bold",
                particles.length < 20 ? "text-green-400" : 
                particles.length < 50 ? "text-yellow-400" : "text-red-400"
              )}>
                {particles.length}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted">Render Time</span>
              </div>
              <div className={cn(
                "text-lg font-bold",
                metrics.renderTime < 8 ? "text-green-400" : 
                metrics.renderTime < 16 ? "text-yellow-400" : "text-red-400"
              )}>
                {metrics.renderTime}ms
              </div>
            </div>
          </div>

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
                ? 'Optimized for better performance' 
                : 'Full visual effects enabled'
              }
            </div>
          </div>

          {/* Auto-Optimization */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Auto-Optimization</span>
              <button
                onClick={optimizePerformance}
                className="rounded-lg bg-accent/20 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/30 transition-all"
              >
                Optimize Now
              </button>
            </div>
            <div className="mt-1 text-xs text-muted">
              Automatically optimizes performance when issues are detected
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🎯 Performance Hooks
export const usePerformanceMonitor = () => {
  const measureRenderTime = useCallback(() => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`Render time: ${end - start}ms`);
    };
  }, []);

  const measureGameLoopTime = useCallback(() => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`Game loop time: ${end - start}ms`);
    };
  }, []);

  return {
    measureRenderTime,
    measureGameLoopTime
  };
};

