import { memo } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "accent" | "white" | "muted";
  className?: string;
  text?: string;
}

// 🎯 Optimierte Loading Spinner Komponente
export const LoadingSpinner = memo(({ 
  size = "md", 
  color = "accent", 
  className = "",
  text
}: LoadingSpinnerProps) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-6 h-6";
      case "lg":
        return "w-8 h-8";
      case "xl":
        return "w-12 h-12";
      default:
        return "w-6 h-6";
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "accent":
        return "border-accent/30 border-t-accent";
      case "white":
        return "border-white/30 border-t-white";
      case "muted":
        return "border-muted/30 border-t-muted";
      default:
        return "border-accent/30 border-t-accent";
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className={`${getSizeClasses()} ${getColorClasses()} border-2 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="text-sm text-muted animate-pulse">{text}</p>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
