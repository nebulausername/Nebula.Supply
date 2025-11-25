import { motion } from "framer-motion";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "../../utils/cn";
import type { MaintenanceStatus } from "../../api/status";

interface UpdateCardProps {
  update: MaintenanceStatus['updates'][0];
  index: number;
}

const updateTypeConfig = {
  info: {
    icon: Info,
    color: 'text-[#0BF7BC]',
    bgColor: 'bg-[#0BF7BC]/10',
    borderColor: 'border-[#0BF7BC]/20'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-[#FBBF24]',
    bgColor: 'bg-[#FBBF24]/10',
    borderColor: 'border-[#FBBF24]/20'
  },
  success: {
    icon: CheckCircle2,
    color: 'text-[#34D399]',
    bgColor: 'bg-[#34D399]/10',
    borderColor: 'border-[#34D399]/20'
  }
};

export const UpdateCard = ({ update, index }: UpdateCardProps) => {
  const config = updateTypeConfig[update.type];
  const Icon = config.icon;
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `vor ${diffHours} Std`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl",
        "border backdrop-blur-xl",
        config.bgColor,
        config.borderColor
      )}
    >
      <div className={cn("flex-shrink-0 mt-0.5", config.color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm text-white/90 leading-relaxed">
          {update.message}
        </p>
        <p className="text-xs text-white/40">
          {formatTime(update.timestamp)}
        </p>
      </div>
    </motion.div>
  );
};

