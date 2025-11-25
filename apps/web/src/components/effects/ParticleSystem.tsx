import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

interface ParticleSystemProps {
  trigger: boolean;
  position?: { x: number; y: number };
  color?: string;
  count?: number;
  onComplete?: () => void;
  className?: string;
}

export const ParticleSystem = ({
  trigger,
  position = { x: 0, y: 0 },
  color = '#0BF7BC',
  count = 20,
  onComplete,
  className = ''
}: ParticleSystemProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const lastTriggerRef = useRef<boolean>(false);

  const createParticle = useCallback((x: number, y: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    
    return {
      id: Math.random().toString(36).slice(2),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: Math.random() * 60 + 30, // 30-90 frames
      size: Math.random() * 4 + 2,
      color,
      opacity: 1
    };
  }, [color]);

  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply gravity
      particle.vy += 0.1;
      
      // Update life
      particle.life -= 1 / particle.maxLife;
      particle.opacity = particle.life;
      
      // Draw particle
      if (particle.life > 0) {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      return particle.life > 0;
    });

    // Continue animation if particles exist
    if (particlesRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(updateParticles);
    } else if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const startParticleEffect = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = position.x || rect.width / 2;
    const y = position.y || rect.height / 2;

    // Create particles
    particlesRef.current = Array.from({ length: count }, () => createParticle(x, y));

    // Start animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    updateParticles();
  }, [position, count, createParticle, updateParticles]);

  // Handle trigger
  useEffect(() => {
    if (trigger && !lastTriggerRef.current) {
      startParticleEffect();
    }
    lastTriggerRef.current = trigger;
  }, [trigger, startParticleEffect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: trigger ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </motion.div>
  );
};

// Predefined particle effects for common use cases
export const CelebrationParticles = ({ trigger, onComplete }: { trigger: boolean; onComplete?: () => void }) => (
  <ParticleSystem
    trigger={trigger}
    color="#0BF7BC"
    count={30}
    onComplete={onComplete}
  />
);

export const PurchaseParticles = ({ trigger, onComplete }: { trigger: boolean; onComplete?: () => void }) => (
  <ParticleSystem
    trigger={trigger}
    color="#10B981"
    count={25}
    onComplete={onComplete}
  />
);

export const DropParticles = ({ trigger, onComplete }: { trigger: boolean; onComplete?: () => void }) => (
  <ParticleSystem
    trigger={trigger}
    color="#F59E0B"
    count={35}
    onComplete={onComplete}
  />
);

export const VipParticles = ({ trigger, onComplete }: { trigger: boolean; onComplete?: () => void }) => (
  <ParticleSystem
    trigger={trigger}
    color="#8B5CF6"
    count={40}
    onComplete={onComplete}
  />
);



































































































