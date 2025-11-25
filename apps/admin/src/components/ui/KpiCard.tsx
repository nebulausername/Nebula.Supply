import { useEffect, useState } from 'react';
import { Card } from "./Card";
import { logger } from '../../lib/logger';

// Fix für React Import
import React from 'react';

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "cyan";
  isLive?: boolean;
  animate?: boolean;
  onClick?: () => void;
  icon?: string;
  description?: string;
}

export function KpiCard({
  label,
  value,
  delta,
  trend = "neutral",
  color = "blue",
  isLive = false,
  animate = true,
  onClick,
  icon,
  description,
}: KpiCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);

  // Animation trigger wenn Wert sich ändert
  useEffect(() => {
    if (animate && value !== previousValue) {
      setIsAnimating(true);
      logger.logPerformance('kpi_value_changed', {
        label,
        oldValue: previousValue,
        newValue: value
      });

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600);

      setPreviousValue(value);

      return () => clearTimeout(timer);
    }
  }, [value, previousValue, animate, label]);

  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-500/40",
    green: "bg-green-500/10 text-green-400 border-green-500/20 hover:border-green-500/40",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:border-yellow-500/40",
    red: "bg-red-500/10 text-red-400 border-red-500/20 hover:border-red-500/40",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:border-purple-500/40",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/40",
  };

  const trendIcons = {
    up: "↗",
    down: "↘",
    neutral: "→",
  };

  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-gray-400",
  };

  return (
    <Card
      className={`relative p-6 transition-all duration-300 cursor-pointer group ${
        colorClasses[color]
      } ${isAnimating ? 'scale-105' : 'scale-100'} ${
        onClick ? 'hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-3 right-3">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      )}

      <div className="space-y-3">
        {/* Header with Icon and Label */}
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-2xl" role="img" aria-label={label}>
              {icon}
            </span>
          )}
          <div className="flex-1">
            <p className="text-sm font-space-grotesk font-medium text-muted uppercase tracking-wide">
              {label}
            </p>
            {description && (
              <p className="text-xs text-muted/70 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Value */}
        <p className={`text-3xl font-orbitron font-bold text-text transition-all duration-300 ${
          isAnimating ? 'scale-110' : 'scale-100'
        }`}>
          {value}
        </p>

        {/* Delta with trend */}
        {delta && (
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${trendColors[trend]}`}>
              {delta}
            </p>
            <span className={`text-sm ${trendColors[trend]}`}>
              {trendIcons[trend]}
            </span>
          </div>
        )}
      </div>

      {/* Subtle animation overlay */}
      {isAnimating && (
        <div className="absolute inset-0 bg-current opacity-5 animate-pulse rounded-lg pointer-events-none" />
      )}
    </Card>
  );
}
