import { memo, useMemo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { LineChart, BarChart3, Download, Calendar, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToPDF, formatDateForExport } from '../../lib/utils/export';
import { useKPIs, useTrends } from '../../lib/api/hooks';
import { useToast } from '../ui/Toast';
import { logger } from '../../lib/logger';

interface KPIDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiData: {
    label: string;
    value: string;
    delta?: string;
    trend?: 'up' | 'down' | 'neutral';
    description?: string;
  };
  timeRange?: 'today' | 'week' | 'month' | 'custom';
  onTimeRangeChange?: (range: 'today' | 'week' | 'month' | 'custom') => void;
}

// Mock data for trend graph - in production, fetch from API
const generateTrendData = (timeRange: string) => {
  const days = timeRange === 'today' ? 24 : timeRange === 'week' ? 7 : 30;
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString(),
    value: Math.floor(Math.random() * 1000) + 500
  }));
};

export const KPIDetailModal = memo(function KPIDetailModal({
  isOpen,
  onClose,
  kpiData,
  timeRange = 'week',
  onTimeRangeChange
}: KPIDetailModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();
  const { data: kpisData } = useKPIs();
  const timeRangeParam = timeRange === 'today' ? '24h' : timeRange === 'week' ? '7d' : '30d';
  const { data: trendsData } = useTrends(timeRangeParam, 'all');
  
  const trendData = useMemo(() => {
    // Use real trend data if available, otherwise fall back to mock data
    if (trendsData?.data?.points) {
      return trendsData.data.points.map((point: any) => ({
        date: point.date || point.timestamp,
        value: point.value || point[kpiData.label.toLowerCase().replace(/\s+/g, '_')] || 0
      }));
    }
    return generateTrendData(timeRange);
  }, [trendsData, timeRange, kpiData.label]);

  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const exportData = {
        headers: ['Date', kpiData.label, 'Change'],
        rows: trendData.map((point, index) => {
          const prevValue = index > 0 ? trendData[index - 1].value : point.value;
          const change = index > 0 ? ((point.value - prevValue) / prevValue * 100).toFixed(2) + '%' : '0%';
          return [
            formatDateForExport(point.date),
            point.value,
            change
          ];
        }),
        title: `${kpiData.label} - ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Report`,
        metadata: {
          'Generated': formatDateForExport(new Date()),
          'Current Value': kpiData.value,
          'Trend': kpiData.trend || 'neutral',
          'Time Range': timeRange,
          ...(kpiData.delta && { 'Delta': kpiData.delta }),
          ...(kpiData.description && { 'Description': kpiData.description }),
        }
      };

      const filename = `kpi_${kpiData.label.toLowerCase().replace(/\s+/g, '_')}_${timeRange}`;

      if (format === 'csv') {
        exportToCSV(exportData, filename);
        showToast({ type: 'success', title: 'CSV exported successfully' });
      } else if (format === 'pdf') {
        exportToPDF(exportData, filename);
        showToast({ type: 'success', title: 'PDF export opened in print dialog' });
      }

      logger.info('KPI exported', { format, kpiLabel: kpiData.label, timeRange });
    } catch (error) {
      logger.error('Failed to export KPI', { error, format, kpiLabel: kpiData.label });
      showToast({ 
        type: 'error', 
        title: 'Export failed', 
        message: 'Failed to export data. Please try again.' 
      });
    } finally {
      setIsExporting(false);
    }
  }, [kpiData, trendData, timeRange, showToast]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{kpiData.label} - Detailed View</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Time Range:</span>
            <div className="flex gap-2">
              {(['today', 'week', 'month'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTimeRangeChange?.(range)}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Current Value */}
          <div className="p-6 rounded-lg border border-white/10 bg-black/20">
            <div className="text-sm text-muted-foreground mb-2">Current Value</div>
            <div className="text-4xl font-bold text-white">{kpiData.value}</div>
            {kpiData.delta && (
              <div className="text-sm text-muted-foreground mt-2">{kpiData.delta}</div>
            )}
            {kpiData.description && (
              <div className="text-sm text-muted-foreground mt-3">{kpiData.description}</div>
            )}
          </div>

          {/* Trend Graph */}
          <div className="p-6 rounded-lg border border-white/10 bg-black/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Trend Analysis</h3>
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Line Chart</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {trendData.map((point, index) => {
                const height = (point.value / 1000) * 100;
                return (
                  <motion.div
                    key={index}
                    className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.02 }}
                    title={`${point.value} on ${new Date(point.date).toLocaleDateString()}`}
                  />
                );
              })}
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              {timeRange === 'today' ? 'Last 24 hours' : 
               timeRange === 'week' ? 'Last 7 days' : 
               'Last 30 days'}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-white/10 bg-black/20">
              <div className="text-xs text-muted-foreground mb-1">Average</div>
              <div className="text-xl font-semibold text-white">
                {Math.round(trendData.reduce((a, b) => a + b.value, 0) / trendData.length)}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-black/20">
              <div className="text-xs text-muted-foreground mb-1">Peak</div>
              <div className="text-xl font-semibold text-white">
                {Math.max(...trendData.map(d => d.value))}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-black/20">
              <div className="text-xs text-muted-foreground mb-1">Growth</div>
              <div className={`text-xl font-semibold ${
                kpiData.trend === 'up' ? 'text-green-400' :
                kpiData.trend === 'down' ? 'text-red-400' :
                'text-white'
              }`}>
                {kpiData.trend === 'up' ? '↑' : kpiData.trend === 'down' ? '↓' : '→'}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

