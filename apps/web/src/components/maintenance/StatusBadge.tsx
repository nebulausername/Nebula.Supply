import { motion } from "framer-motion";
import { Wrench, AlertTriangle, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "../../utils/cn";

type StatusMode = 'maintenance' | 'update' | 'emergency' | 'none';

interface StatusBadgeProps {
  mode: StatusMode;
  className?: string;
}

const statusConfig: Record<StatusMode, {
  icon: typeof Wrench;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  maintenance: {
    icon: Wrench,
    label: 'Wartung',
    color: 'text-[#0BF7BC]',
    bgColor: 'bg-[#0BF7BC]/10',
    borderColor: 'border-[#0BF7BC]/30'
  },
  update: {
    icon: Zap,
    label: 'Update',
    color: 'text-[#FBBF24]',
    bgColor: 'bg-[#FBBF24]/10',
    borderColor: 'border-[#FBBF24]/30'
  },
  emergency: {
    icon: AlertTriangle,
    label: 'Notfall',
    color: 'text-[#F87171]',
    bgColor: 'bg-[#F87171]/10',
    borderColor: 'border-[#F87171]/30'
  },
  none: {
    icon: CheckCircle2,
    label: 'Online',
    color: 'text-[#34D399]',
    bgColor: 'bg-[#34D399]/10',
    borderColor: 'border-[#34D399]/30'
  }
};

export const StatusBadge = ({ mode, className }: StatusBadgeProps) => {
  const config = statusConfig[mode];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
        "border backdrop-blur-xl",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn("w-4 h-4", config.color)} />
      <span className={cn("text-sm font-semibold", config.color)}>
        {config.label}
      </span>
    </motion.div>
  );
};

