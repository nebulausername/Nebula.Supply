import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Users } from "lucide-react";
import { cn } from "../../utils/cn";

interface LiveViewerCounterProps {
  productId?: string;
  baseCount?: number;
  className?: string;
}

export const LiveViewerCounter = ({ 
  productId, 
  baseCount = 137, 
  className 
}: LiveViewerCounterProps) => {
  const [viewerCount, setViewerCount] = useState(baseCount);
  const [isIncreasing, setIsIncreasing] = useState(true);

  useEffect(() => {
    // Simuliere realistische Viewer-Schwankungen
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 8) - 3; // -3 bis +5
        const newCount = Math.max(baseCount - 20, Math.min(baseCount + 50, prev + change));
        setIsIncreasing(change > 0);
        return newCount;
      });
    }, 3000 + Math.random() * 2000); // 3-5 Sekunden

    return () => clearInterval(interval);
  }, [baseCount]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-red-500/20 to-orange-500/20",
        "border border-red-400/30 backdrop-blur-sm",
        className
      )}
    >
      <div className="relative">
        <Eye className="h-4 w-4 text-red-400" />
        <motion.div
          className="absolute inset-0 bg-red-400 rounded-full blur-md"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <AnimatePresence mode="wait">
        <motion.span
          key={viewerCount}
          initial={{ y: isIncreasing ? 10 : -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: isIncreasing ? -10 : 10, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-bold text-white"
        >
          {viewerCount}
        </motion.span>
      </AnimatePresence>
      
      <span className="text-xs text-red-200">
        schauen gerade
      </span>
    </motion.div>
  );
};

