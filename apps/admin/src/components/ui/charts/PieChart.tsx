import React from 'react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card } from '../Card';
import { motion } from 'framer-motion';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  description?: string;
  height?: number;
  formatValue?: (value: number) => string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // purple-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
];

const CustomTooltip = ({ active, payload, formatValue }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const total = payload[0].payload.percent || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.payload.fill }}
        />
        <p className="text-sm font-medium text-white">{data.name}</p>
      </div>
      <p className="text-lg font-bold text-white">
        {formatValue ? formatValue(data.value) : data.value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {(total * 100).toFixed(1)}% of total
      </p>
    </motion.div>
  );
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-sm font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function PieChart({
  data,
  title,
  description,
  height = 400,
  formatValue,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 120,
  className = '',
  colors,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      </Card>
    );
  }

  const chartColors = colors || DEFAULT_COLORS;

  // Add colors to data if not present
  const enrichedData = data.map((item, index) => ({
    ...item,
    fill: item.color || chartColors[index % chartColors.length],
  }));

  return (
    <Card className={`p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={enrichedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {enrichedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill}
                stroke="rgba(0, 0, 0, 0.8)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip formatValue={formatValue} />}
          />
          {showLegend && (
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry: any) => (
                <span className="text-sm text-muted-foreground">
                  {value} ({formatValue ? formatValue(entry.payload.value) : entry.payload.value})
                </span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </Card>
  );
}

