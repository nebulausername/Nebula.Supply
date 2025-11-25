import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "../../utils/cn";

interface DropCountdownProps {
  deadlineAt: string; // ISO date string
  countdownType?: "short" | "extended";
  className?: string;
  variant?: "mobile" | "desktop" | "auto"; // Auto detects based on viewport
}

export const DropCountdown = ({ 
  deadlineAt, 
  countdownType = "short",
  className,
  variant = "auto"
}: DropCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const effectiveVariant = variant === "auto" ? (isMobile ? "mobile" : "desktop") : variant;

  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadline = new Date(deadlineAt).getTime();
      const now = new Date().getTime();
      const difference = deadline - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        });
        return;
      }

      setIsExpired(false);
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference
      });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt]);

  if (!timeLeft) {
    return null;
  }

  if (isExpired) {
    return (
      <div className={cn(
        "flex items-center gap-2 bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2",
        effectiveVariant === "mobile" ? "px-2 py-1.5 text-xs" : "px-4 py-2.5",
        className
      )}>
        <Clock className={cn(
          "text-red-400 animate-pulse",
          effectiveVariant === "mobile" ? "h-3 w-3" : "h-4 w-4"
        )} />
        <span className={cn(
          "text-red-300 font-semibold",
          effectiveVariant === "mobile" ? "text-xs" : "text-sm"
        )}>Abgelaufen</span>
      </div>
    );
  }

  // Determine urgency level
  const hoursLeft = timeLeft.total / (1000 * 60 * 60);
  const isUrgent = hoursLeft < 24; // Less than 24 hours
  const isWarning = hoursLeft < 48 && hoursLeft >= 24; // Less than 48 hours but more than 24
  const isCritical = hoursLeft < 3; // Less than 3 hours

  // 🎯 Mobile: Compact format
  if (effectiveVariant === "mobile") {
    let displayText = "";
    let colorClass = "";
    let glowClass = "";

    if (timeLeft.days > 0) {
      displayText = `${timeLeft.days}d ${timeLeft.hours}h`;
      colorClass = "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border-cyan-400/40 text-cyan-300";
      glowClass = "shadow-cyan-500/20";
    } else if (timeLeft.hours > 0) {
      displayText = `${timeLeft.hours}h ${timeLeft.minutes}m`;
      colorClass = isUrgent 
        ? "bg-gradient-to-r from-red-500/25 to-orange-500/25 border-red-400/50 text-red-300"
        : "bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-400/40 text-orange-300";
      glowClass = isUrgent ? "shadow-red-500/30" : "shadow-orange-500/20";
    } else {
      displayText = `${timeLeft.minutes}m ${timeLeft.seconds}s`;
      colorClass = "bg-gradient-to-r from-red-500/30 to-red-600/30 border-red-400/60 text-red-200";
      glowClass = "shadow-red-500/40";
    }

    return (
      <div className={cn(
        "flex items-center gap-1.5 rounded-lg px-2 py-1.5 border backdrop-blur-md transition-all duration-300",
        "font-bold text-xs whitespace-nowrap",
        colorClass,
        isUrgent && "animate-pulse",
        isCritical && "animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]",
        glowClass,
        className
      )}>
        <Clock className={cn(
          "shrink-0",
          isUrgent ? "animate-pulse" : "",
          effectiveVariant === "mobile" ? "h-3 w-3" : "h-4 w-4"
        )} />
        <span>{displayText}</span>
      </div>
    );
  }

  // 🎯 Desktop: Premium detailed format
  let displayText = "";
  let colorClass = "";
  let glowClass = "";
  let borderGlow = "";

  if (timeLeft.days > 0) {
    const daysText = timeLeft.days === 1 ? "Tag" : "Tage";
    const hoursText = timeLeft.hours === 1 ? "Stunde" : "Stunden";
    displayText = `Noch ${timeLeft.days} ${daysText}, ${timeLeft.hours} ${hoursText}`;
    colorClass = "bg-gradient-to-br from-cyan-500/20 via-cyan-600/20 to-cyan-500/20 border-cyan-400/40 text-cyan-300";
    glowClass = "shadow-cyan-500/20";
    borderGlow = "shadow-[0_0_20px_rgba(6,182,212,0.3)]";
  } else if (timeLeft.hours > 0) {
    const hoursText = timeLeft.hours === 1 ? "Stunde" : "Stunden";
    const minutesText = timeLeft.minutes === 1 ? "Minute" : "Minuten";
    displayText = `Noch ${timeLeft.hours} ${hoursText}, ${timeLeft.minutes} ${minutesText}`;
    
    if (isUrgent) {
      colorClass = "bg-gradient-to-br from-red-500/25 via-orange-500/25 to-red-500/25 border-red-400/50 text-red-300";
      glowClass = "shadow-red-500/30";
      borderGlow = "shadow-[0_0_30px_rgba(239,68,68,0.4)]";
    } else {
      colorClass = "bg-gradient-to-br from-orange-500/20 via-orange-600/20 to-orange-500/20 border-orange-400/40 text-orange-300";
      glowClass = "shadow-orange-500/20";
      borderGlow = "shadow-[0_0_20px_rgba(251,146,60,0.3)]";
    }
  } else {
    const minutesText = timeLeft.minutes === 1 ? "Minute" : "Minuten";
    const secondsText = timeLeft.seconds === 1 ? "Sekunde" : "Sekunden";
    displayText = `Noch ${timeLeft.minutes} ${minutesText}, ${timeLeft.seconds} ${secondsText}`;
    colorClass = "bg-gradient-to-br from-red-500/30 via-red-600/30 to-red-500/30 border-red-400/60 text-red-200";
    glowClass = "shadow-red-500/40";
    borderGlow = "shadow-[0_0_40px_rgba(239,68,68,0.6)]";
  }

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl px-5 py-3 border backdrop-blur-xl transition-all duration-300",
      "font-bold text-sm whitespace-nowrap relative overflow-hidden",
      colorClass,
      glowClass,
      borderGlow,
      isUrgent && "animate-pulse",
      isCritical && "animate-pulse",
      className
    )}
    style={{
      boxShadow: isCritical 
        ? '0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        : isUrgent
        ? '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(251, 146, 60, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        : '0 0 15px rgba(6, 182, 212, 0.3), 0 0 30px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    }}>
      {/* Animated gradient background */}
      <div className={cn(
        "absolute inset-0 opacity-20",
        isUrgent 
          ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-[shimmer_2s_ease-in-out_infinite]"
          : "bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500"
      )} />
      
      <Clock className={cn(
        "relative z-10 shrink-0",
        isUrgent && "animate-pulse",
        "h-5 w-5"
      )} />
      <span className="relative z-10">{displayText}</span>

      {/* Pulse ring for critical urgency */}
      {isCritical && (
        <div className="absolute inset-0 rounded-xl border-2 border-red-400/60 animate-ping opacity-20" />
      )}
    </div>
  );
};