import { useEffect, useRef, useState } from 'react';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { cn } from '../../utils/cn';

// 🎆 Advanced Particle System
export const AdvancedParticleSystem = () => {
  const particles = useCookieClickerStore(state => state.particles);
  const [mountedParticles, setMountedParticles] = useState<typeof particles>([]);
  
  useEffect(() => {
    setMountedParticles(particles);
  }, [particles]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {mountedParticles.map(particle => (
        <ParticleComponent key={particle.id} particle={particle} />
      ))}
    </div>
  );
};

// 🎯 Individual Particle Component
const ParticleComponent = ({ particle }: { particle: any }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: particle.x, y: particle.y });
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const animate = () => {
      setPosition(prev => ({
        x: prev.x + (Math.random() - 0.5) * 2,
        y: prev.y - 2
      }));
    };
    
    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute text-orange-400 font-bold text-lg animate-bounce transition-all duration-2000",
        particle.type === 'critical' && "text-red-500 text-xl font-black animate-pulse",
        particle.type === 'golden' && "text-yellow-400 text-xl font-black animate-spin"
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        opacity: isVisible ? 1 : 0
      }}
    >
      +{Math.floor(particle.value).toLocaleString()}
    </div>
  );
};

// 🌟 Golden Cookie Component
export const GoldenCookieSystem = () => {
  const [goldenCookies, setGoldenCookies] = useState<Array<{
    id: string;
    x: number;
    y: number;
    timestamp: number;
  }>>([]);
  
  const { cookies, clickCookie } = useCookieClickerStore();

  useEffect(() => {
    // Spawn golden cookies every 30-60 seconds
    const spawnInterval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance
        const newCookie = {
          id: Math.random().toString(36).substr(2, 9),
          x: Math.random() * 300 + 100,
          y: Math.random() * 200 + 100,
          timestamp: Date.now()
        };
        setGoldenCookies(prev => [...prev, newCookie]);
        
        // Remove after 10 seconds
        setTimeout(() => {
          setGoldenCookies(prev => prev.filter(c => c.id !== newCookie.id));
        }, 10000);
      }
    }, 30000);

    return () => clearInterval(spawnInterval);
  }, []);

  const handleGoldenCookieClick = (cookieId: string) => {
    // Golden cookie effects
    const effects = [
      { name: 'Lucky!', multiplier: 7, duration: 77 },
      { name: 'Frenzy!', multiplier: 7, duration: 77 },
      { name: 'Click Frenzy!', multiplier: 777, duration: 13 },
      { name: 'Cookie Storm!', multiplier: 1, duration: 13 }
    ];
    
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    // Apply effect (simplified)
    console.log(`Golden cookie effect: ${effect.name} (${effect.multiplier}x for ${effect.duration}s)`);
    
    // Remove the cookie
    setGoldenCookies(prev => prev.filter(c => c.id !== cookieId));
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {goldenCookies.map(cookie => (
        <div
          key={cookie.id}
          className="absolute cursor-pointer text-4xl animate-bounce hover:scale-110 transition-transform duration-200"
          style={{
            left: cookie.x,
            top: cookie.y,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={() => handleGoldenCookieClick(cookie.id)}
        >
          🍪
        </div>
      ))}
    </div>
  );
};

// 🎨 Background Effects
export const BackgroundEffects = () => {
  const { cookiesPerSecond, level, streak } = useCookieClickerStore();
  const [stars, setStars] = useState<Array<{ id: string; x: number; y: number; size: number }>>([]);
  
  useEffect(() => {
    // Generate stars based on game progress
    const newStars = Array.from({ length: Math.min(50, level * 2) }, (_, i) => ({
      id: i.toString(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1
    }));
    setStars(newStars);
  }, [level]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Animated Stars */}
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
      
      {/* Streak Glow Effect */}
      {streak > 10 && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 animate-pulse" />
      )}
      
      {/* High CPS Glow */}
      {cookiesPerSecond > 100 && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" />
      )}
    </div>
  );
};

// 🎵 Sound Effects (Web Audio API)
export const SoundEffects = () => {
  const { soundEnabled, cookiesPerClick, streak } = useCookieClickerStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playClickSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const playCriticalSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  };

  const playStreakSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  };

  // Expose sound functions globally
  useEffect(() => {
    (window as any).playClickSound = playClickSound;
    (window as any).playCriticalSound = playCriticalSound;
    (window as any).playStreakSound = playStreakSound;
  }, [soundEnabled]);

  return null;
};

// 🎯 Performance Optimizer
export const PerformanceOptimizer = () => {
  const { performanceMode, particles, cleanupParticles } = useCookieClickerStore();
  
  useEffect(() => {
    if (performanceMode) {
      // Reduce particle count and cleanup more aggressively
      const interval = setInterval(() => {
        if (particles.length > 10) {
          cleanupParticles();
        }
      }, 500); // More frequent cleanup in performance mode
      
      return () => clearInterval(interval);
    }
  }, [performanceMode, particles, cleanupParticles]);

  return null;
};

// 🎮 Game HUD Overlay
export const GameHUD = () => {
  const { cookies, cookiesPerSecond, level, streak, performanceMode } = useCookieClickerStore();
  
  return (
    <div className="absolute top-4 right-4 z-10 space-y-2">
      {/* Performance Indicator */}
      {performanceMode && (
        <div className="rounded-lg bg-yellow-500/20 border border-yellow-500/30 px-3 py-1 text-xs text-yellow-400">
          Performance Mode
        </div>
      )}
      
      {/* Streak Indicator */}
      {streak > 5 && (
        <div className="rounded-lg bg-orange-500/20 border border-orange-500/30 px-3 py-1 text-xs text-orange-400 animate-pulse">
          🔥 {streak} Streak!
        </div>
      )}
      
      {/* High CPS Indicator */}
      {cookiesPerSecond > 50 && (
        <div className="rounded-lg bg-green-500/20 border border-green-500/30 px-3 py-1 text-xs text-green-400">
          ⚡ {cookiesPerSecond.toFixed(1)} CPS
        </div>
      )}
    </div>
  );
};
