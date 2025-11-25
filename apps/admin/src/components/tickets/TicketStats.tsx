import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, Users, BarChart3, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useMobile } from '../../hooks/useMobile';
import { TicketStatsCharts } from './TicketStatsCharts';
import type { TicketStats as TicketStatsType } from './types';
import { cn } from '../../utils/cn';

interface TicketStatsProps {
  stats?: TicketStatsType;
}

// Default stats to prevent undefined errors
const defaultStats: TicketStatsType = {
  total: 0,
  open: 0,
  waiting: 0,
  inProgress: 0,
  escalated: 0,
  done: 0,
  doneToday: 0,
  avgFirstResponseMinutes: 0,
  avgResolutionMinutes: 0,
  slaCompliance: 0,
  byCategory: {} as Record<string, number>,
  byPriority: {} as Record<string, number>,
  satisfactionScore: 0,
};

export function TicketStats({ stats }: TicketStatsProps) {
  const { isMobile, isTablet } = useMobile();
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [showCharts, setShowCharts] = useState(false);
  
  // Use default stats if stats is undefined
  const safeStats = stats || defaultStats;
  
  // Calculate trends (mock data for now - would come from API)
  const trends = {
    open: { value: 0, isPositive: true },
    inProgress: { value: 0, isPositive: false },
    waiting: { value: 0, isPositive: true },
    escalated: { value: 0, isPositive: false },
  };
  
  const slaComplianceColor = safeStats.slaCompliance >= 90 
    ? 'text-green-400' 
    : safeStats.slaCompliance >= 70 
    ? 'text-yellow-400' 
    : 'text-red-400';

  const satisfactionColor = safeStats.satisfactionScore >= 4.5
    ? 'text-green-400'
    : safeStats.satisfactionScore >= 3.5
    ? 'text-yellow-400'
    : 'text-red-400';

  // On mobile, show horizontal scrollable cards
  if (isMobile) {
    return (
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text">Statistics</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2"
            aria-label={isExpanded ? 'Collapse stats' : 'Expand stats'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {isExpanded ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface/50 rounded-lg p-2">
                <div className="text-xs text-muted mb-1">Total</div>
                <div className="text-lg font-bold text-text">{safeStats.total}</div>
              </div>
              <div className="bg-surface/50 rounded-lg p-2">
                <div className="text-xs text-muted mb-1 flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Open
                </div>
                <div className="text-lg font-bold text-green-400">{safeStats.open}</div>
              </div>
            </div>
            <div className="overflow-x-auto -mx-3 px-3">
              <div className="flex gap-2 min-w-max">
                <div className="bg-surface/50 rounded-lg p-2 min-w-[100px]">
                  <div className="text-xs text-muted mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    In Progress
                  </div>
                  <div className="text-lg font-bold text-blue-400">{safeStats.inProgress}</div>
                </div>
                <div className="bg-surface/50 rounded-lg p-2 min-w-[100px]">
                  <div className="text-xs text-muted mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Waiting
                  </div>
                  <div className="text-lg font-bold text-yellow-400">{safeStats.waiting}</div>
                </div>
                <div className="bg-surface/50 rounded-lg p-2 min-w-[100px]">
                  <div className="text-xs text-muted mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Escalated
                  </div>
                  <div className="text-lg font-bold text-red-400">{safeStats.escalated}</div>
                </div>
                <div className="bg-surface/50 rounded-lg p-2 min-w-[100px]">
                  <div className="text-xs text-muted mb-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Done Today
                  </div>
                  <div className="text-lg font-bold text-gray-400">{safeStats.doneToday}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div>
                <div className="text-xs text-muted mb-1">Avg Response</div>
                <div className="text-sm font-semibold text-text">
                  {safeStats.avgFirstResponseMinutes}m
                </div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Avg Resolution</div>
                <div className="text-sm font-semibold text-text">
                  {Math.round(safeStats.avgResolutionMinutes / 60)}h {safeStats.avgResolutionMinutes % 60}m
                </div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">SLA Compliance</div>
                <div className={cn('text-sm font-semibold', slaComplianceColor)}>
                  {safeStats.slaCompliance}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Satisfaction</div>
                <div className={cn('text-sm font-semibold', satisfactionColor)}>
                  {safeStats.satisfactionScore.toFixed(1)}/5.0
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 px-3">
            <div className="flex gap-2 min-w-max">
              <div className="bg-surface/50 rounded-lg p-2 min-w-[80px]">
                <div className="text-xs text-muted mb-1">Total</div>
                <div className="text-base font-bold text-text">{safeStats.total}</div>
              </div>
              <div className="bg-surface/50 rounded-lg p-2 min-w-[80px]">
                <div className="text-xs text-muted mb-1">Open</div>
                <div className="text-base font-bold text-green-400">{safeStats.open}</div>
              </div>
              <div className="bg-surface/50 rounded-lg p-2 min-w-[80px]">
                <div className="text-xs text-muted mb-1">In Progress</div>
                <div className="text-base font-bold text-blue-400">{safeStats.inProgress}</div>
              </div>
              <div className="bg-surface/50 rounded-lg p-2 min-w-[80px]">
                <div className="text-xs text-muted mb-1">Waiting</div>
                <div className="text-base font-bold text-yellow-400">{safeStats.waiting}</div>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className={cn(
        'grid gap-4',
        isTablet ? 'grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
      )}>
        {/* Total */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <div className="text-sm text-muted mb-1">Total</div>
          <div className="text-2xl font-bold text-text">{safeStats.total}</div>
        </motion.div>

        {/* Open */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="group cursor-pointer hover:bg-surface/20 rounded-lg p-2 -m-2 transition-colors"
        >
          <div className="text-sm text-muted mb-1 flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Open
            {trends.open.value !== 0 && (
              <span className={cn(
                'text-xs flex items-center gap-0.5 ml-1',
                trends.open.isPositive ? 'text-green-400' : 'text-red-400'
              )}>
                {trends.open.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trends.open.value)}%
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-green-400">{safeStats.open}</div>
        </motion.div>

        {/* In Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-sm text-muted mb-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            In Progress
          </div>
          <div className="text-2xl font-bold text-blue-400">{safeStats.inProgress}</div>
        </motion.div>

        {/* Waiting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="text-sm text-muted mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Waiting
          </div>
          <div className="text-2xl font-bold text-yellow-400">{safeStats.waiting}</div>
        </motion.div>

        {/* Escalated */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-sm text-muted mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Escalated
          </div>
          <div className="text-2xl font-bold text-red-400">{safeStats.escalated}</div>
        </motion.div>

        {/* Done Today */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="text-sm text-muted mb-1 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Done Today
          </div>
          <div className="text-2xl font-bold text-gray-400">{safeStats.doneToday}</div>
        </motion.div>
      </div>

      {/* Charts Toggle */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <h3 className="text-sm font-semibold text-text">Analytics</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCharts(!showCharts)}
          className="h-8 px-3"
        >
          <Sparkles className={cn('h-4 w-4 mr-2', showCharts && 'text-accent')} />
          <span className="text-xs">{showCharts ? 'Hide' : 'Show'} Charts</span>
        </Button>
      </div>

      {/* Charts Section */}
      <AnimatePresence>
        {showCharts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <TicketStatsCharts stats={safeStats} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10">
        {/* Avg Response Time */}
        <div>
          <div className="text-xs text-muted mb-1">Avg Response</div>
          <div className="text-lg font-semibold text-text">
            {safeStats.avgFirstResponseMinutes}m
            {safeStats.avgFirstResponseMinutes < 120 && safeStats.avgFirstResponseMinutes > 0 && (
              <Badge variant="success" className="ml-2 text-xs">Good</Badge>
            )}
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div>
          <div className="text-xs text-muted mb-1">Avg Resolution</div>
          <div className="text-lg font-semibold text-text">
            {Math.round(safeStats.avgResolutionMinutes / 60)}h {safeStats.avgResolutionMinutes % 60}m
          </div>
        </div>

        {/* SLA Compliance */}
        <div>
          <div className="text-xs text-muted mb-1">SLA Compliance</div>
          <div className={cn('text-lg font-semibold', slaComplianceColor)}>
            {safeStats.slaCompliance}%
          </div>
        </div>

        {/* Satisfaction */}
        <div>
          <div className="text-xs text-muted mb-1">Satisfaction</div>
          <div className={cn('text-lg font-semibold', satisfactionColor)}>
            {safeStats.satisfactionScore.toFixed(1)}/5.0
          </div>
        </div>
      </div>
    </Card>
  );
}


