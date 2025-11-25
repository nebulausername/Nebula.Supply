import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import { cn } from "../../utils/cn";

interface CountdownTimerProps {
  endTime: Date | number;
  onExpire?: () => void;
  variant?: "default" | "urgent" | "flash";
  showIcon?: boolean;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const CountdownTimer = ({ 
  endTime, 
  onExpire,
  variant = "default",
  showIcon = true,
  className 
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = typeof endTime === 'number' ? endTime : endTime.getTime();
      const now = Date.now();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        onExpire?.();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, total: difference });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (timeLeft.total <= 0) {
    return (
      <div className={cn("text-sm text-red-400 font-bold", className)}>
        Abgelaufen!
      </div>
    );
  }

  const isUrgent = timeLeft.total < 3600000; // < 1 hour
  const isFlash = variant === "flash";

  const config = {
    default: {
      bg: "from-blue-500/20 to-purple-500/20",
      border: "border-blue-400/40",
      text: "text-blue-200",
      icon: Clock
    },
    urgent: {
      bg: "from-orange-500/20 to-red-500/20",
      border: "border-orange-400/40",
      text: "text-orange-200",
      icon: Zap
    },
    flash: {
      bg: "from-red-500/20 to-pink-500/20",
      border: "border-red-400/40",
      text: "text-red-200",
      icon: Zap
    }
  };

  const currentVariant = isUrgent ? "urgent" : variant;
  const { bg, border, text, icon: Icon } = config[currentVariant];

  return (
    <motion.div
      animate={isUrgent ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: 1,
        repeat: isUrgent ? Infinity : 0,
        ease: "easeInOut"
      }}
      className={cn(
        "inline-flex items-center gap-3 px-4 py-2 rounded-xl",
        `bg-gradient-to-r ${bg}`,
        `border ${border}`,
        "backdrop-blur-sm",
        className
      )}
    >
      {showIcon && (
        <motion.div
          animate={{
            rotate: isFlash ? [0, 360] : 0
          }}
          transition={{
            duration: 2,
            repeat: isFlash ? Infinity : 0,
            ease: "linear"
          }}
        >
          <Icon className={cn("h-5 w-5", text)} />
        </motion.div>
      )}
      
      <div className="flex items-center gap-2">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center">
            <span className={cn("text-lg font-bold text-white")}>{timeLeft.days}</span>
            <span className={cn("text-xs", text)}>Tage</span>
          </div>
        )}
        
        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
          <>
            {timeLeft.days > 0 && <span className={cn("text-white", text)}>:</span>}
            <div className="flex flex-col items-center">
              <span className={cn("text-lg font-bold text-white")}>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className={cn("text-xs", text)}>Std</span>
            </div>
          </>
        )}
        
        <span className={cn("text-white", text)}>:</span>
        <div className="flex flex-col items-center">
          <span className={cn("text-lg font-bold text-white")}>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className={cn("text-xs", text)}>Min</span>
        </div>
        
        <span className={cn("text-white", text)}>:</span>
        <div className="flex flex-col items-center">
          <motion.span
            key={timeLeft.seconds}
            initial={{ scale: 1.2, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("text-lg font-bold text-white")}
          >
            {String(timeLeft.seconds).padStart(2, '0')}
          </motion.span>
          <span className={cn("text-xs", text)}>Sek</span>
        </div>
      </div>
    </motion.div>
  );
};

