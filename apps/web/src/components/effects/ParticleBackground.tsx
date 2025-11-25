import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface ParticleBackgroundProps {
  particleCount?: number;
  speed?: number;
  colors?: string[];
  className?: string;
  reducedMotion?: boolean;
  interactive?: boolean;
}

export const ParticleBackground = ({
  particleCount = 50,
  speed = 0.5,
  colors = ['#0BF7BC', '#8B5CF6', '#EC4899', '#F59E0B'],
  className = '',
  reducedMotion = false,
  interactive = true
}: ParticleBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize particles
  const initParticles = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const { width, height } = canvas;
    
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }, [particleCount, speed, colors]);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Set canvas size
  useEffect(() => {
    if (canvasRef.current && dimensions.width && dimensions.height) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      
      initParticles();
    }
  }, [dimensions, initParticles]);

  // Mouse tracking
  useEffect(() => {
    if (!interactive || !canvasRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  // Animation loop
  useEffect(() => {
    if (reducedMotion || !canvasRef.current || !dimensions.width || !dimensions.height) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Boundary collision
        if (particle.x < 0 || particle.x > dimensions.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > dimensions.height) particle.vy *= -1;

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(dimensions.width, particle.x));
        particle.y = Math.max(0, Math.min(dimensions.height, particle.y));

        // Mouse interaction
        if (interactive) {
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 100;

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            particle.vx -= (dx / distance) * force * 0.1;
            particle.vy -= (dy / distance) * force * 0.1;
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();

        // Draw connections
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 150;

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = (1 - distance / maxDistance) * 0.2;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      ctx.globalAlpha = 1;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, reducedMotion, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// Simplified version for static backgrounds
export const StaticParticleBackground = ({
  particleCount = 30,
  colors = ['#0BF7BC', '#8B5CF6', '#EC4899'],
  className = ''
}: {
  particleCount?: number;
  colors?: string[];
  className?: string;
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {Array.from({ length: particleCount }).map((_, i) => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              backgroundColor: color,
              opacity: Math.random() * 0.5 + 0.2
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        );
      })}
    </div>
  );
};

