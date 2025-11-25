import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, User, Tag, AlertTriangle, CheckCircle, ArrowRight, UserPlus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { useMobile } from '../../hooks/useMobile';

interface ActivityEntry {
  id: string;
  type: 'status_changed' | 'priority_changed' | 'assigned' | 'replied' | 'created' | 'tag_added' | 'note_added';
  timestamp: string;
  user?: string;
  description: string;
  changes?: {
    field: string;
    from: string;
    to: string;
  }[];
}

interface TicketActivityLogProps {
  activities: ActivityEntry[];
  isLoading?: boolean;
}

const getActivityIcon = (type: ActivityEntry['type']) => {
  switch (type) {
    case 'status_changed':
      return <ArrowRight className="h-4 w-4 text-blue-400" />;
    case 'priority_changed':
      return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    case 'assigned':
      return <UserPlus className="h-4 w-4 text-purple-400" />;
    case 'replied':
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    case 'created':
      return <CheckCircle className="h-4 w-4 text-blue-400" />;
    case 'tag_added':
      return <Tag className="h-4 w-4 text-orange-400" />;
    case 'note_added':
      return <Tag className="h-4 w-4 text-gray-400" />;
    default:
      return <Clock className="h-4 w-4 text-muted" />;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
};

const groupActivitiesByDate = (activities: ActivityEntry[]) => {
  const groups: { [key: string]: ActivityEntry[] } = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.timestamp);
    const dateKey = date.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
  });
  
  return groups;
};

export const TicketActivityLog = memo(function TicketActivityLog({
  activities,
  isLoading,
}: TicketActivityLogProps) {
  const { isMobile } = useMobile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-muted border-t-accent rounded-full animate-spin" />
          <span className="text-sm text-muted">Loading activity...</span>
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-surface/50 flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-muted" />
        </div>
        <p className="text-sm text-muted">No activity yet</p>
        <p className="text-xs text-muted mt-1">Activity log will appear here</p>
      </div>
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);
  const sortedDates = Object.keys(groupedActivities).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime(); // Most recent first
  });

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent/30 via-primary/20 to-transparent" />
      
      <div className="space-y-6">
        {sortedDates.map((dateKey, dateIndex) => (
          <div key={dateKey} className="space-y-4">
            {/* Date Separator */}
            {sortedDates.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 my-6"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 border-2 border-accent/30 flex items-center justify-center backdrop-blur-sm">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
                </div>
                <span className="text-sm font-semibold text-text px-3 py-1 rounded-full bg-surface/50 border border-white/10">
                  {dateKey}
                </span>
                <div className="flex-1">
                  <div className="h-px bg-gradient-to-l from-white/20 via-white/10 to-transparent" />
                </div>
              </motion.div>
            )}

            {/* Activities for this date - Timeline View */}
            {groupedActivities[dateKey].map((activity, index) => {
              const isLast = index === groupedActivities[dateKey].length - 1;
              const isFirst = index === 0;
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (dateIndex * 0.1) + (index * 0.05) }}
                  className="relative flex gap-4"
                >
                  {/* Timeline Dot & Line */}
                  <div className="flex-shrink-0 relative">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      'bg-gradient-to-br from-surface/60 to-surface/40',
                      'backdrop-blur-sm border-2 border-white/20',
                      'shadow-lg shadow-black/20',
                      'relative z-10'
                    )}>
                      {getActivityIcon(activity.type)}
                    </div>
                    {!isLast && (
                      <div className="absolute left-1/2 top-8 w-0.5 h-full bg-gradient-to-b from-white/20 to-transparent transform -translate-x-1/2" />
                    )}
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 min-w-0 pb-4">
                    <Card
                      variant="glassmorphic"
                      className={cn(
                        'p-3',
                        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                        'backdrop-blur-xl border border-white/10',
                        'hover:border-accent/30 transition-all duration-200',
                        'shadow-md hover:shadow-lg'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-text flex-1">
                          {activity.description}
                        </p>
                        <span className="text-xs text-muted flex-shrink-0 whitespace-nowrap">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>

                      {/* User */}
                      {activity.user && (
                        <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
                          <User className="h-3 w-3" />
                          <span>{activity.user}</span>
                        </div>
                      )}

                      {/* Changes */}
                      {activity.changes && activity.changes.length > 0 && (
                        <div className="mt-2 space-y-1.5 pt-2 border-t border-white/10">
                          {activity.changes.map((change, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs bg-surface/40 rounded-lg px-2.5 py-1.5"
                            >
                              <span className="text-muted capitalize font-medium">{change.field}:</span>
                              <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-400">
                                {change.from}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-muted" />
                              <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
                                {change.to}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

