import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  size: number;
}

interface ConfettiProps {
  trigger?: boolean;
  count?: number;
  colors?: string[];
  duration?: number;
}

export const Confetti = ({
  trigger = false,
  count = 50,
  colors = ['#0BF7BC', '#A855F7', '#EC4899', '#F59E0B', '#10B981'],
  duration = 3000
}: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      size: Math.random() * 10 + 5
    }));

    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [trigger, count, colors, duration]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map(piece => (
          <motion.div
            key={piece.id}
            className="absolute rounded-sm"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size,
            }}
            initial={{
              y: -10,
              rotate: piece.rotation,
              opacity: 1
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: piece.rotation + 360,
              x: piece.x + (Math.random() - 0.5) * 200,
              opacity: [1, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: duration / 1000,
              ease: 'easeIn',
              delay: Math.random() * 0.5
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
