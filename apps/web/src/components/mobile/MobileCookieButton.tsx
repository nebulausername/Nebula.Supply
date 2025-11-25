import { useState, useRef, useEffect } from 'react';
import { Cookie, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';

interface MobileCookieButtonProps {
  onClick: (x: number, y: number) => void;
  cookiesPerClick: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
}

export const MobileCookieButton = ({
  onClick,
  cookiesPerClick,
  size = 'lg',
  disabled = false,
  className
}: MobileCookieButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { triggerHaptic } = useEnhancedTouch();
  const rippleIdRef = useRef(0);

  // Size variants
  const sizeClasses = {
    sm: 'w-32 h-32 sm:w-36 sm:h-36',
    md: 'w-40 h-40 sm:w-48 sm:h-48',
    lg: 'w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64',
    xl: 'w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80'
  };

  const iconSizes = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-32 h-32'
  };

  // Handle click/touch
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Trigger haptic feedback
    triggerHaptic('medium');

    // Add ripple effect
    const rippleId = rippleIdRef.current++;
    setRipples(prev => [...prev, { id: rippleId, x, y }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);

    // Press animation
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 100);

    // Call onClick handler
    onClick(x, y);
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      disabled={disabled}
      className={cn(
        // Size
        sizeClasses[size],
        // Layout
        "relative flex items-center justify-center",
        "rounded-full",
        // Touch optimizations
        "touch-none select-none",
        "-webkit-tap-highlight-color: transparent",
        // Background
        "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600",
        // Shadow
        "shadow-2xl shadow-orange-500/50",
        // Transform
        "transition-all duration-150 ease-out",
        isPressed ? "scale-90" : "scale-100",
        !disabled && "hover:scale-105 active:scale-90",
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed",
        // Glow effect
        "before:absolute before:inset-0 before:rounded-full",
        "before:bg-gradient-to-br before:from-white/20 before:to-transparent",
        "before:animate-pulse",
        className
      )}
      aria-label={`Click to earn ${cookiesPerClick} cookies`}
    >
      {/* Animated border glow */}
      <div className={cn(
        "absolute inset-0 rounded-full",
        "bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500",
        "animate-spin-slow opacity-50 blur-sm",
        isPressed && "animate-ping"
      )} 
      style={{ animationDuration: '3s' }}
      />

      {/* Inner circle */}
      <div className={cn(
        "relative z-10 flex items-center justify-center",
        "w-full h-full rounded-full",
        "bg-gradient-to-br from-orange-400 to-orange-600",
        "border-4 border-orange-300/30"
      )}>
        {/* Cookie Icon */}
        <Cookie className={cn(
          iconSizes[size],
          "text-amber-100 drop-shadow-2xl",
          "transition-transform duration-150",
          isPressed ? "rotate-12" : "rotate-0"
        )} />

        {/* Sparkles */}
        <Sparkles 
          className="absolute top-4 right-4 w-6 h-6 text-yellow-300 animate-pulse" 
          style={{ animationDuration: '2s' }}
        />
        <Sparkles 
          className="absolute bottom-4 left-4 w-4 h-4 text-yellow-300 animate-pulse" 
          style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}
        />
      </div>

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* Cookies per click indicator */}
      <div className={cn(
        "absolute -bottom-8 left-1/2 -translate-x-1/2",
        "px-3 py-1 rounded-full",
        "bg-gradient-to-r from-orange-500 to-red-500",
        "border border-orange-300/30",
        "shadow-lg shadow-orange-500/50",
        "whitespace-nowrap"
      )}>
        <span className="text-xs sm:text-sm font-bold text-white">
          +{cookiesPerClick.toLocaleString()} 🍪
        </span>
      </div>
    </button>
  );
};

// 🎯 Cookie Button Stats Overlay
export const CookieButtonStats = ({
  totalClicks,
  streak,
  multiplier
}: {
  totalClicks: number;
  streak: number;
  multiplier: number;
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-12">
      {/* Total Clicks */}
      <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur">
        <div className="text-xs text-gray-400">Clicks</div>
        <div className="text-sm font-bold text-white">{totalClicks.toLocaleString()}</div>
      </div>

      {/* Streak */}
      {streak > 1 && (
        <div className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 backdrop-blur animate-pulse">
          <div className="text-xs text-orange-300">Streak</div>
          <div className="text-sm font-bold text-orange-400">🔥 {streak}x</div>
        </div>
      )}

      {/* Multiplier */}
      {multiplier > 1 && (
        <div className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 backdrop-blur">
          <div className="text-xs text-green-300">Multiplier</div>
          <div className="text-sm font-bold text-green-400">✨ {multiplier}x</div>
        </div>
      )}
    </div>
  );
};


