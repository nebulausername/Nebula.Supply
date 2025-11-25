import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { Rocket, Zap, Star, TrendingUp } from "lucide-react";
import { cn } from "../utils/cn";

interface EnhancedDropsButtonProps {
  className?: string;
  variant?: "default" | "featured" | "mobile";
  showLiveIndicator?: boolean;
  dropCount?: number;
}

const PARTICLE_PRESETS = [
  { left: "16%", top: "24%", delay: "0s" },
  { left: "38%", top: "12%", delay: "0.2s" },
  { left: "62%", top: "32%", delay: "0.35s" },
  { left: "78%", top: "18%", delay: "0.5s" },
  { left: "28%", top: "66%", delay: "0.65s" },
  { left: "54%", top: "74%", delay: "0.8s" }
];

export const EnhancedDropsButton = ({
  className,
  variant = "default",
  showLiveIndicator = true,
  dropCount = 0
}: EnhancedDropsButtonProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const particles = useMemo(() => PARTICLE_PRESETS, []);
  const shouldAnimate = !prefersReducedMotion && isHovered;

  const baseClasses = "group relative overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

  const variantClasses: Record<Required<EnhancedDropsButtonProps>["variant"], string> = {
    default: "rounded-full px-6 py-3 text-sm font-semibold",
    featured: "rounded-2xl px-8 py-4 text-base font-bold",
    mobile: "w-full rounded-2xl px-6 py-4 text-sm font-semibold"
  };

  const getGradientClasses = () => {
    if (variant === "featured") {
      return "bg-gradient-to-r from-accent via-emerald-400 to-teal-500 text-black shadow-[0_0_40px_rgba(11,247,188,0.35)] hover:shadow-[0_0_60px_rgba(11,247,188,0.5)]";
    }
    return "border border-accent/30 bg-gradient-to-r from-accent/20 to-accent/10 text-accent hover:bg-accent/25 hover:border-accent/50";
  };

  return (
    <Link
      to="/drops"
      className={cn(
        baseClasses,
        variantClasses[variant],
        getGradientClasses(),
        !prefersReducedMotion && "hover:scale-[1.03] active:scale-95",
        className
      )}
      onMouseEnter={() => {
        if (!prefersReducedMotion) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-emerald-400/20 to-teal-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {showLiveIndicator && dropCount > 0 && (
        <div className="absolute -top-1 -right-1 flex items-center gap-1">
          <span
            className={cn(
              "inline-flex h-3 w-3 rounded-full bg-red-500",
              !prefersReducedMotion && "animate-ping"
            )}
            aria-hidden
          />
          <span className={cn("text-xs font-bold text-red-500", !prefersReducedMotion && "animate-pulse")}>LIVE</span>
        </div>
      )}

      <div className="relative z-10 flex items-center gap-3">
        <div className="relative">
          <Rocket
            className={cn(
              "h-5 w-5 transition-transform duration-300",
              variant === "featured" && "h-6 w-6",
              shouldAnimate && "rotate-12 scale-110"
            )}
          />

          {shouldAnimate && (
            <>
              <Star className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 animate-ping" aria-hidden />
              <Zap className="absolute -bottom-1 -left-1 h-2 w-2 text-blue-400 animate-bounce" aria-hidden />
            </>
          )}
        </div>

        <div className="flex flex-col">
          <span className="flex items-center gap-2">
            Drops
            {variant === "featured" && (
              <TrendingUp className={cn("h-4 w-4", !prefersReducedMotion && "animate-pulse")} aria-hidden />
            )}
          </span>
          {variant === "featured" && <span className="text-xs opacity-80">Live Releases</span>}
        </div>

        {dropCount > 0 && (
          <div className="ml-auto">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {dropCount > 99 ? "99+" : dropCount}
            </div>
          </div>
        )}
      </div>

      <div
        className="absolute inset-0 rounded-inherit border-2 border-transparent bg-gradient-to-r from-accent via-emerald-400 to-teal-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "xor" }}
        aria-hidden
      />

      {shouldAnimate && (
        <div className="absolute inset-0 overflow-hidden rounded-inherit" aria-hidden>
          {particles.map((particle, index) => (
            <span
              key={index}
              className="absolute h-1 w-1 rounded-full bg-accent"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: "1.8s"
              }}
            />
          ))}
        </div>
      )}
    </Link>
  );
};
