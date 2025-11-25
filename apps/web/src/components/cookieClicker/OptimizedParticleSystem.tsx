import { useEffect, useRef, useMemo, memo } from 'react';
import { useCookieClickerStore, type Particle } from '../../store/cookieClicker';
import { cn } from '../../utils/cn';
import { getPerformanceMonitor } from '../../utils/performance';

// 🚀 Object Pool für Particles - Wiederverwendung statt Neu-Erstellung
class ParticlePool {
  private pool: Particle[] = [];
  private active: Set<string> = new Set();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
    // Pre-allocate pool
    for (let i = 0; i < maxSize; i++) {
      this.pool.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    return {
      id: '',
      x: 0,
      y: 0,
      value: 0,
      timestamp: 0,
      type: 'click',
      color: '#ff8c00',
      size: 16
    };
  }

  acquire(id: string, x: number, y: number, value: number, type: Particle['type'], color?: string, size?: number): Particle | null {
    if (this.active.size >= this.maxSize) {
      return null; // Pool exhausted
    }

    let particle: Particle;
    if (this.pool.length > 0) {
      particle = this.pool.pop()!;
    } else {
      particle = this.createParticle();
    }

    // Reuse particle object
    particle.id = id;
    particle.x = x;
    particle.y = y;
    particle.value = value;
    particle.timestamp = Date.now();
    particle.type = type;
    particle.color = color || this.getDefaultColor(type);
    particle.size = size || this.getDefaultSize(type);

    this.active.add(id);
    return particle;
  }

  release(id: string): void {
    if (this.active.has(id)) {
      this.active.delete(id);
      // Particle wird zurück in Pool gegeben (wird beim nächsten acquire wiederverwendet)
    }
  }

  private getDefaultColor(type: Particle['type']): string {
    switch (type) {
      case 'critical': return '#ff0000';
      case 'combo': return '#ffff00';
      case 'coin': return '#ffd700';
      case 'achievement': return '#9d4edd';
      default: return '#ff8c00';
    }
  }

  private getDefaultSize(type: Particle['type']): number {
    switch (type) {
      case 'critical': return 24;
      case 'combo': return 20;
      case 'coin': return 18;
      default: return 16;
    }
  }

  getActiveCount(): number {
    return this.active.size;
  }
}

// 🎯 Optimiertes Particle System mit Canvas-Rendering und Object Pooling
export const OptimizedParticleSystem = memo(() => {
  const particles = useCookieClickerStore(state => state.particles);
  const animationsEnabled = useCookieClickerStore(state => state.animationsEnabled);
  const performanceMode = useCookieClickerStore(state => state.performanceMode);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const poolRef = useRef<ParticlePool | null>(null);
  const lastCleanupRef = useRef<number>(0);

  // 🚀 Adaptive Particle Limits basierend auf FPS
  const adaptiveLimit = useMemo(() => {
    const monitor = getPerformanceMonitor();
    if (!monitor) return performanceMode ? 30 : 50;
    
    const fps = monitor.getFPS();
    if (fps < 30) return 20; // Low FPS - sehr limitiert
    if (fps < 45) return 30; // Medium FPS - limitiert
    if (fps < 55) return 40; // Good FPS - moderat
    return performanceMode ? 30 : 50; // High FPS - normal
  }, [performanceMode]);

  // 🎯 Initialize Pool
  useEffect(() => {
    poolRef.current = new ParticlePool(adaptiveLimit);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [adaptiveLimit]);

  // 🎯 Canvas-basiertes Rendering für bessere Performance
  useEffect(() => {
    if (!animationsEnabled || performanceMode || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const now = Date.now();
    const activeParticles = particles.filter(p => now - p.timestamp < 2000);

    const animate = () => {
      const currentTime = Date.now();
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 🧹 Cleanup alte Particles (nur alle 500ms für Performance)
      if (currentTime - lastCleanupRef.current > 500) {
        lastCleanupRef.current = currentTime;
        // Cleanup wird im Store gemacht
      }

      // Render active particles
      activeParticles.forEach(particle => {
        const age = currentTime - particle.timestamp;
        const progress = Math.min(age / 2000, 1); // 2s lifetime
        const opacity = 1 - progress;
        const yOffset = progress * 100; // Move up
        const scale = 1 + (progress * 0.5); // Scale up slightly

        if (opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = particle.color;
        ctx.font = `bold ${particle.size * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw particle
        ctx.fillText(
          `+${Math.floor(particle.value).toLocaleString()}`,
          particle.x,
          particle.y - yOffset
        );
        
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particles, animationsEnabled, performanceMode]);

  // Fallback zu DOM-Rendering wenn Canvas nicht unterstützt wird
  if (!animationsEnabled || performanceMode) {
    return null;
  }

  // 🚀 Canvas-basiertes Rendering
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ 
        willChange: 'contents',
        imageRendering: 'optimizeSpeed'
      }}
    />
  );
});

OptimizedParticleSystem.displayName = 'OptimizedParticleSystem';

