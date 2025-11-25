import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NebulaLoaderProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  minDurationMs?: number;
}

const sizeToPixels: Record<string, number> = {
  sm: 32,
  md: 48,
  lg: 64
};

export function NebulaLoader({
  size = "md",
  label = "Lädt…",
  minDurationMs = 750
}: NebulaLoaderProps) {
  const [visible, setVisible] = useState(true);
  const start = useRef<number>(Date.now());

  // Consumers can unmount this component whenever their work is done.
  // We ensure a minimal display time to avoid flash.
  useEffect(() => {
    const elapsed = Date.now() - start.current;
    const remaining = Math.max(0, minDurationMs - elapsed);
    const t = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(t);
  }, [minDurationMs]);

  const px = sizeToPixels[size] ?? sizeToPixels.md;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="text-center"
          >
            <motion.div
              className="mx-auto mb-4 rounded-full border-2 border-white/20 border-t-transparent"
              style={{ width: px, height: px }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            />
            <div className="text-sm text-white/70 tracking-wide">
              <span className="animate-pulse">{label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}











































































