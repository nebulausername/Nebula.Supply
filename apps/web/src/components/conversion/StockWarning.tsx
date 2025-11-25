import { motion } from "framer-motion";
import { AlertTriangle, Flame, TrendingUp } from "lucide-react";
import { cn } from "../../utils/cn";

interface StockWarningProps {
  stock: number;
  threshold?: number;
  variant?: "warning" | "critical" | "hot";
  className?: string;
}

export const StockWarning = ({ 
  stock, 
  threshold = 20, 
  variant = "warning",
  className 
}: StockWarningProps) => {
  if (stock > threshold) return null;

  const isCritical = stock <= 5;
  const isHot = variant === "hot";

  const config = {
    warning: {
      bg: "from-yellow-500/20 to-orange-500/20",
      border: "border-yellow-400/40",
      icon: AlertTriangle,
      iconColor: "text-yellow-400",
      text: "text-yellow-200"
    },
    critical: {
      bg: "from-red-500/20 to-red-600/20",
      border: "border-red-400/40",
      icon: AlertTriangle,
      iconColor: "text-red-400",
      text: "text-red-200"
    },
    hot: {
      bg: "from-orange-500/20 to-red-500/20",
      border: "border-orange-400/40",
      icon: Flame,
      iconColor: "text-orange-400",
      text: "text-orange-200"
    }
  };

  const currentVariant = isCritical ? "critical" : variant;
  const { bg, border, icon: Icon, iconColor, text } = config[currentVariant];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        `bg-gradient-to-r ${bg}`,
        `border ${border}`,
        "backdrop-blur-sm",
        className
      )}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: isCritical ? [0, -10, 10, 0] : 0
        }}
        transition={{
          duration: isCritical ? 0.5 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Icon className={cn("h-4 w-4", iconColor)} />
      </motion.div>
      
      <div className="flex flex-col">
        <span className={cn("text-xs font-bold", text)}>
          {isCritical ? "Fast ausverkauft!" : isHot ? "Mega gefragt!" : "Limitiert!"}
        </span>
        <span className={cn("text-xs", text)}>
          Nur noch <strong>{stock}</strong> verfügbar
        </span>
      </div>
    </motion.div>
  );
};

