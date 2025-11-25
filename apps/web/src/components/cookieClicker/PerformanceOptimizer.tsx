import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '../../utils/cn';

// 🚀 PERFORMANCE OPTIMIZER - MAXIMIERT & GEIL!
export const PerformanceOptimizer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [performanceMode, setPerformanceMode] = useState(false);
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const [isLowEnd, setIsLowEnd] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(0);
  const renderEndRef = useRef(0);

  // 🎯 PERFORMANCE MONITORING - GEIL!
  useEffect(() => {
    const monitorPerformance = () => {
      const now = performance.now();
      frameCountRef.current++;

      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      // 🎯 MEMORY USAGE - GEIL!
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage(memory.usedJSHeapSize / memory.jsHeapSizeLimit);
      }

      // 🎯 LOW END DETECTION - GEIL!
      const isLowEndDevice =
        navigator.hardwareConcurrency <= 2 ||
        (navigator as any).deviceMemory <= 4 ||
        fps < 30;

      setIsLowEnd(isLowEndDevice);

      if (isLowEndDevice && !performanceMode) {
        setPerformanceMode(true);
      }

      requestAnimationFrame(monitorPerformance);
    };

    requestAnimationFrame(monitorPerformance);
  }, [fps, performanceMode]);

  // 🎯 RENDER TIME MONITORING - GEIL!
  useEffect(() => {
    renderStartRef.current = performance.now();
    
    return () => {
      renderEndRef.current = performance.now();
      setRenderTime(renderEndRef.current - renderStartRef.current);
    };
  });

  // 🎯 PERFORMANCE OPTIMIZATIONS - GEIL!
  const optimizations = {
    // 🎯 DEBOUNCING - GEIL!
    debounce: <T extends (...args: any[]) => any>(
      func: T,
      delay: number
    ): ((...args: Parameters<T>) => void) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
      };
    },

    // 🎯 THROTTLING - GEIL!
    throttle: <T extends (...args: any[]) => any>(
      func: T,
      delay: number
    ): ((...args: Parameters<T>) => void) => {
      let lastCall = 0;
      return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          func(...args);
        }
      };
    },

    // 🎯 MEMOIZATION - GEIL!
    memoize: <T extends (...args: any[]) => any>(func: T): T => {
      const cache = new Map();
      return ((...args: Parameters<T>) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
          return cache.get(key);
        }
        const result = func(...args);
        cache.set(key, result);
        return result;
      }) as T;
    },

    // 🎯 LAZY LOADING - GEIL!
    lazyLoad: (element: HTMLElement, callback: () => void) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              callback();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(element);
    },

    // 🎯 VIRTUAL SCROLLING - GEIL!
    virtualScroll: (container: HTMLElement, items: any[], itemHeight: number) => {
      const containerHeight = container.clientHeight;
      const visibleItems = Math.ceil(containerHeight / itemHeight) + 2;
      const scrollTop = container.scrollTop;
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleItems, items.length);

      return {
        startIndex,
        endIndex,
        visibleItems: items.slice(startIndex, endIndex),
        totalHeight: items.length * itemHeight,
        offsetY: startIndex * itemHeight
      };
    },

    // 🎯 OBJECT POOLING - GEIL!
    objectPool: function <T>(createFn: () => T, resetFn: (obj: T) => void) {
      const pool: T[] = [];
      
      return {
        get: (): T => {
          if (pool.length > 0) {
            return pool.pop()!;
          }
          return createFn();
        },
        release: (obj: T) => {
          resetFn(obj);
          pool.push(obj);
        }
      };
    }
  };

  // 🎯 PERFORMANCE COMPONENTS - GEIL!
  const PerformanceComponents = {
    // 🎯 LAZY COMPONENT - GEIL!
    LazyComponent: ({ 
      children, 
      fallback, 
      threshold = 0.1 
    }: { 
      children: React.ReactNode; 
      fallback?: React.ReactNode; 
      threshold?: number; 
    }) => {
      const [isVisible, setIsVisible] = useState(false);
      const elementRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        if (elementRef.current) {
          optimizations.lazyLoad(elementRef.current, () => {
            setIsVisible(true);
          });
        }
      }, []);

      return (
        <div ref={elementRef}>
          {isVisible ? children : fallback}
        </div>
      );
    },

    // 🎯 VIRTUAL LIST - GEIL!
    VirtualList: ({ 
      items, 
      itemHeight, 
      renderItem, 
      containerHeight = 400 
    }: { 
      items: any[]; 
      itemHeight: number; 
      renderItem: (item: any, index: number) => React.ReactNode; 
      containerHeight?: number; 
    }) => {
      const [scrollTop, setScrollTop] = useState(0);
      const containerRef = useRef<HTMLDivElement>(null);

      const virtualData = useMemo(() => {
        if (containerRef.current) {
          return optimizations.virtualScroll(containerRef.current, items, itemHeight);
        }
        return { startIndex: 0, endIndex: items.length, visibleItems: items, totalHeight: 0, offsetY: 0 };
      }, [items, itemHeight, scrollTop]);

      const handleScroll = useCallback(
        optimizations.throttle((e: React.UIEvent<HTMLDivElement>) => {
          setScrollTop(e.currentTarget.scrollTop);
        }, 16),
        []
      );

      return (
        <div
          ref={containerRef}
          className="overflow-auto"
          style={{ height: containerHeight }}
          onScroll={handleScroll}
        >
          <div style={{ height: virtualData.totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${virtualData.offsetY}px)` }}>
              {virtualData.visibleItems.map((item, index) => 
                renderItem(item, virtualData.startIndex + index)
              )}
            </div>
          </div>
        </div>
      );
    },

    // 🎯 MEMOIZED COMPONENT - GEIL!
    MemoizedComponent: React.memo(({ 
      children, 
      dependencies 
    }: { 
      children: React.ReactNode; 
      dependencies: any[]; 
    }) => {
      return <>{children}</>;
    })
  };

  // 🎯 PERFORMANCE SETTINGS - GEIL!
  const performanceSettings = {
    // 🎯 RENDER OPTIMIZATIONS - GEIL!
    render: {
      batchUpdates: true,
      concurrentMode: true,
      suspense: true,
      errorBoundaries: true
    },

    // 🎯 MEMORY OPTIMIZATIONS - GEIL!
    memory: {
      garbageCollection: true,
      objectPooling: true,
      weakReferences: true,
      compression: true
    },

    // 🎯 NETWORK OPTIMIZATIONS - GEIL!
    network: {
      compression: true,
      caching: true,
      prefetching: true,
      lazyLoading: true
    },

    // 🎯 ANIMATION OPTIMIZATIONS - GEIL!
    animation: {
      hardwareAcceleration: true,
      willChange: true,
      transform3d: true,
      backfaceVisibility: 'hidden'
    }
  };

  return (
    <div className="performance-optimizer">
      {/* 🎯 PERFORMANCE MONITOR - GEIL! */}
      <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-green-400">FPS: {fps}</div>
            <div className="text-blue-400">Memory: {Math.round(memoryUsage * 100)}%</div>
            <div className="text-yellow-400">Render: {Math.round(renderTime)}ms</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              fps >= 60 ? "bg-green-500" : fps >= 30 ? "bg-yellow-500" : "bg-red-500"
            )}></div>
            <div className={cn(
              "w-2 h-2 rounded-full",
              memoryUsage < 0.5 ? "bg-green-500" : memoryUsage < 0.8 ? "bg-yellow-500" : "bg-red-500"
            )}></div>
            <div className={cn(
              "w-2 h-2 rounded-full",
              renderTime < 16 ? "bg-green-500" : renderTime < 33 ? "bg-yellow-500" : "bg-red-500"
            )}></div>
          </div>
        </div>
      </div>

      {/* 🎯 PERFORMANCE CONTROLS - GEIL! */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setPerformanceMode(!performanceMode)}
          className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            performanceMode 
              ? "bg-red-500 text-white" 
              : "bg-green-500 text-white"
          )}
        >
          {performanceMode ? '🚀 Performance' : '⚡ Normal'}
        </button>
      </div>

      {/* 🎯 LOW END WARNING - GEIL! */}
      {isLowEnd && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-yellow-500/20 text-yellow-200 p-3 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>Low-end device detected. Performance mode enabled.</span>
          </div>
        </div>
      )}

      {/* 🎯 CHILDREN - GEIL! */}
      <div className={cn(
        performanceMode && "performance-mode",
        isLowEnd && "low-end-mode"
      )}>
        {children}
      </div>
    </div>
  );
};

// 🚀 PERFORMANCE HOOKS - GEIL!
export const usePerformance = () => {
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const monitor = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage(memory.usedJSHeapSize / memory.jsHeapSizeLimit);
      }

      requestAnimationFrame(monitor);
    };

    requestAnimationFrame(monitor);
  }, []);

  return { fps, memoryUsage, renderTime };
};

// 🚀 PERFORMANCE UTILITIES - GEIL!
export const PerformanceUtils = {
  // 🎯 MEASURE RENDER TIME - GEIL!
  measureRenderTime: (componentName: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${componentName} render time: ${end - start}ms`);
    };
  },

  // 🎯 MEMORY USAGE - GEIL!
  getMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
      };
    }
    return null;
  },

  // 🎯 FPS COUNTER - GEIL!
  getFPS: () => {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = now;
        return fps;
      }
      
      requestAnimationFrame(countFrame);
    };

    requestAnimationFrame(countFrame);
  }
};

export default PerformanceOptimizer;

