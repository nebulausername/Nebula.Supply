import { cn } from "../utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "ghost";
  className?: string;
}

export const Badge = ({ children, variant = "secondary", className }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide",
      variant === "primary" && "bg-accent text-black",
      variant === "secondary" && "bg-surface/80 text-muted border border-muted/30",
      variant === "accent" && "bg-accentSecondary/20 text-accentSecondary border border-accentSecondary/40",
      variant === "ghost" && "border border-white/15 bg-transparent text-muted",
      className
    )}
  >
    {children}
  </span>
);
