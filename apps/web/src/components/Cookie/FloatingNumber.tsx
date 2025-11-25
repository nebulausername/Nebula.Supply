import { motion } from 'framer-motion';
import type { TouchEffect } from '../../types/cookie.types';

interface FloatingNumberProps {
  effect: TouchEffect;
}

// ✨ Floating "+X" number animation

export const FloatingNumber: React.FC<FloatingNumberProps> = ({ effect }) => {
  return (
    <motion.div
      initial={{
        x: effect.x,
        y: effect.y,
        opacity: 1,
        scale: 0.5,
      }}
      animate={{
        x: effect.x + effect.velocity.x * 50,
        y: effect.y + effect.velocity.y * 100,
        opacity: 0,
        scale: 1.2,
      }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 1,
        ease: 'easeOut',
      }}
      className="pointer-events-none fixed z-50 font-bold text-yellow-400"
      style={{
        textShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.4)',
        fontSize: Math.min(24 + Math.log10(effect.value + 1) * 8, 48),
      }}
    >
      +{Math.floor(effect.value)}
    </motion.div>
  );
};
