import { motion } from "framer-motion";
import { HelpCircle, Sparkles } from "lucide-react";
import { cn } from "../../utils/cn";

interface MysteryProductCardProps {
  index?: number;
  variant?: "shop" | "drop";
}

export const MysteryProductCard = ({ index = 0, variant = "shop" }: MysteryProductCardProps) => {
  const isDrop = variant === "drop";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-white/5 to-white/[0.02]",
        "border border-white/10 backdrop-blur-xl",
        "hover:border-[#0BF7BC]/30 hover:shadow-lg hover:shadow-[#0BF7BC]/10",
        "transition-all duration-300",
        isDrop ? "aspect-square" : "aspect-[4/3]"
      )}
    >
      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0BF7BC]/5 via-transparent to-[#FF5EDB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Product Image Area - White Placeholder with Question Mark */}
      <div className="relative aspect-square bg-white/10 flex items-center justify-center overflow-hidden">
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
        
        {/* Question Mark Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
          className="relative z-10"
        >
          <HelpCircle className="w-16 h-16 md:w-20 md:h-20 text-white/30" strokeWidth={1.5} />
        </motion.div>
        
        {/* Subtle Glow Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(11,247,188,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      {/* Product Info */}
      <div className="p-4 md:p-5 space-y-2 relative z-10">
        {/* Mystery Badge */}
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0BF7BC]/10 border border-[#0BF7BC]/20"
          >
            <Sparkles className="w-3 h-3 text-[#0BF7BC]" />
            <span className="text-xs font-medium text-[#0BF7BC]">Coming Soon</span>
          </motion.div>
        </div>
        
        {/* Mystery Name */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.4 }}
          className="space-y-1"
        >
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-16 bg-white/5 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
        </motion.div>
        
        {/* Mystery Price */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.5 }}
          className="flex items-center gap-2"
        >
          <div className="h-5 w-20 bg-white/10 rounded animate-pulse" style={{ animationDelay: '0.3s' }} />
        </motion.div>
      </div>
      
      {/* Hover Overlay Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

