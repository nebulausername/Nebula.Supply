import React from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card } from '../Card';
import { motion } from 'framer-motion';

interface BarChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  bars: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  title?: string;
  description?: string;
  height?: number;
  formatValue?: (value: number) => string;
  formatXAxis?: (value: any) => string;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  className?: string;
  colorGradient?: string[];
}

const CustomTooltip = ({ active, payload, label, formatValue }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl"
    >
      <p className="text-sm font-medium text-white mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.name}:</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {formatValue ? formatValue(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

export function BarChart({
  data,
  xKey,
  bars,
  title,
  description,
  height = 400,
  formatValue,
  formatXAxis,
  showGrid = true,
  showLegend = true,
  horizontal = false,
  stacked = false,
  className = '',
  colorGradient,
}: BarChartProps) {
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

  const gradient = colorGradient || [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // purple-500
    '#06b6d4', // cyan-500
  ];

  return (
    <Card className={`p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart 
          data={data} 
          layout={horizontal ? 'vertical' : 'horizontal'}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255, 255, 255, 0.05)" 
              {...(horizontal ? { horizontal: true } : { vertical: false })}
            />
          )}
          
          {horizontal ? (
            <>
              <YAxis
                type="category"
                dataKey={xKey}
                stroke="rgba(255, 255, 255, 0.3)"
                tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}
                tickFormatter={formatXAxis}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              />
              <XAxis
                type="number"
                stroke="rgba(255, 255, 255, 0.3)"
                tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}
                tickFormatter={formatValue}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                stroke="rgba(255, 255, 255, 0.3)"
                tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}
                tickFormatter={formatXAxis}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              />
              <YAxis
                stroke="rgba(255, 255, 255, 0.3)"
                tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}
                tickFormatter={formatValue}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              />
            </>
          )}
          
          <Tooltip 
            content={<CustomTooltip formatValue={formatValue} />}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
          />
          
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
              formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            />
          )}
          
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              radius={[8, 8, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
            >
              {colorGradient && (
                data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={gradient[idx % gradient.length]} />
                ))
              )}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </Card>
  );
}

