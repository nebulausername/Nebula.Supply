import { motion } from 'framer-motion';
import { useDevModeStore } from '../../store/devMode';
import { cn } from '../../utils/cn';
import { Code2 } from 'lucide-react';

export const DevModeIndicator = () => {
  const isActive = useDevModeStore(state => state.isActive && state.checkExpiry());

  if (!isActive) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-4 left-4 z-50"
    >
      <motion.div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-gradient-to-r from-purple-500/20 to-blue-500/20",
          "border border-purple-500/30 backdrop-blur-sm",
          "text-purple-300 text-xs font-bold uppercase tracking-wider"
        )}
        animate={{
          boxShadow: [
            "0_0_10px_rgba(147,51,234,0.3)",
            "0_0_20px_rgba(147,51,234,0.5)",
            "0_0_10px_rgba(147,51,234,0.3)"
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Code2 className="h-3 w-3" />
        <span>DEV MODE</span>
      </motion.div>
    </motion.div>
  );
};








































