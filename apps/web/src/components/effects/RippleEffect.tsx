import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  duration?: number;
}

export const RippleEffect = ({ 
  children, 
  className = '', 
  color = 'rgba(255, 255, 255, 0.5)',
  duration = 600
}: RippleEffectProps) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleIdRef = useRef(0);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleIdRef.current++;

    setRipples(prev => [...prev, { id, x, y }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, duration);
  }, [duration]);

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: color,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            width: 200,
            height: 200,
            opacity: [0.6, 0]
          }}
          transition={{
            duration: duration / 1000,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
};

