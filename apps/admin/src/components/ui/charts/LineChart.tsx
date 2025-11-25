import React from 'react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart as RechartsAreaChart
} from 'recharts';
import { Card } from '../Card';
import { motion } from 'framer-motion';

interface LineChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
    strokeWidth?: number;
  }>;
  title?: string;
  description?: string;
  height?: number;
  formatValue?: (value: number) => string;
  formatXAxis?: (value: any) => string;
  showGrid?: boolean;
  showLegend?: boolean;
  showArea?: boolean;
  className?: string;
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
              className="w-3 h-3 rounded-full"
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

export function LineChart({
  data,
  xKey,
  lines,
  title,
  description,
  height = 400,
  formatValue,
  formatXAxis,
  showGrid = true,
  showLegend = true,
  showArea = false,
  className = '',
}: LineChartProps) {
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

  const ChartComponent = showArea ? RechartsAreaChart : RechartsLineChart;

  return (
    <Card className={`p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255, 255, 255, 0.05)" 
              vertical={false}
            />
          )}
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
          <Tooltip 
            content={<CustomTooltip formatValue={formatValue} />}
            cursor={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          />
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            />
          )}
          {lines.map((line, index) => 
            showArea ? (
              <Area
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color}
                fill={line.color}
                fillOpacity={0.1}
                strokeWidth={line.strokeWidth || 2}
                dot={{ fill: line.color, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
              />
            ) : (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color}
                strokeWidth={line.strokeWidth || 2}
                dot={{ fill: line.color, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </Card>
  );
}

