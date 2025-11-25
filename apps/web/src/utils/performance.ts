// 🚀 Performance Utilities - Optimierte Helper für bessere Performance

/**
 * Debounce function - Verzögert Funktionsaufrufe
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - Begrenzt Funktionsaufrufe
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * RAF Throttle - Nutzt RequestAnimationFrame für optimale Performance
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Batch State Updates - Sammelt mehrere Updates für bessere Performance
 */
export class StateBatcher {
  private updates: Array<() => void> = [];
  private rafId: number | null = null;
  
  add(update: () => void) {
    this.updates.push(update);
    this.schedule();
  }
  
  private schedule() {
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.flush();
        this.rafId = null;
      });
    }
  }
  
  flush() {
    const updates = this.updates;
    this.updates = [];
    updates.forEach(update => update());
  }
}

/**
 * Performance Monitor - Überwacht FPS und Render-Zeiten
 */
export class PerformanceMonitor {
  private fps: number = 60;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private renderTimes: number[] = [];
  
  tick() {
    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastTime;
    
    if (delta >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }
  }
  
  recordRenderTime(time: number) {
    this.renderTimes.push(time);
    if (this.renderTimes.length > 60) {
      this.renderTimes.shift();
    }
  }
  
  getFPS(): number {
    return this.fps;
  }
  
  getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return sum / this.renderTimes.length;
  }
  
  isPerformanceGood(): boolean {
    return this.fps >= 55 && this.getAverageRenderTime() < 16;
  }
}

/**
 * Initialize Performance Monitoring - Startet Performance-Tracking
 */
let globalPerformanceMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitoring(): void {
  // Nur im Development oder wenn explizit aktiviert
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
    globalPerformanceMonitor = new PerformanceMonitor();
    
    // Start FPS tracking
    const trackFPS = () => {
      if (globalPerformanceMonitor) {
        globalPerformanceMonitor.tick();
        requestAnimationFrame(trackFPS);
      }
    };
    requestAnimationFrame(trackFPS);
    
    // Log performance metrics periodically (only in dev)
    if (import.meta.env.DEV) {
      setInterval(() => {
        if (globalPerformanceMonitor) {
          const fps = globalPerformanceMonitor.getFPS();
          const avgRenderTime = globalPerformanceMonitor.getAverageRenderTime();
          const isGood = globalPerformanceMonitor.isPerformanceGood();
          
          if (!isGood) {
            console.warn(`⚠️ Performance Warning: FPS=${fps}, Avg Render=${avgRenderTime.toFixed(2)}ms`);
          }
        }
      }, 5000); // Check every 5 seconds
    }
  }
}

/**
 * Get Global Performance Monitor Instance
 */
export function getPerformanceMonitor(): PerformanceMonitor | null {
  return globalPerformanceMonitor;
}
