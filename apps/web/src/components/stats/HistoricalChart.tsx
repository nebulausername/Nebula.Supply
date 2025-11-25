import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface HistoricalDataPoint {
  timestamp: number;
  value: number;
}

interface HistoricalChartProps {
  data: HistoricalDataPoint[];
  color?: string;
  height?: number;
  showPoints?: boolean;
  className?: string;
}

export const HistoricalChart = memo(({
  data,
  color = '#0BF7BC',
  height = 40,
  showPoints = true,
  className = ''
}: HistoricalChartProps) => {
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = data.map((point, index) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = 100 - ((point.value - min) / range) * 100;
      return { x, y, value: point.value };
    });

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return { pathData, points, min, max };
  }, [data]);

  if (!chartData || data.length < 2) {
    return (
      <div className={`h-${height} flex items-center justify-center text-xs text-muted ${className}`}>
        Keine Daten verfügbar
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <motion.path
          d={`${chartData.pathData} L 100 100 L 0 100 Z`}
          fill={`url(#gradient-${color})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Line */}
        <motion.path
          d={chartData.pathData}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Data points */}
        {showPoints && chartData.points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="1"
            fill={color}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          />
        ))}
      </svg>

      {/* Min/Max labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-muted px-1">
        <span>{chartData.min}</span>
        <span>{chartData.max}</span>
      </div>
    </div>
  );
});

HistoricalChart.displayName = 'HistoricalChart';

