import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/Badge';
import { Zap, Users } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LiveUpdateIndicatorProps {
  isLive?: boolean;
  lastUpdate?: Date;
  editingUsers?: string[];
  className?: string;
}

export const LiveUpdateIndicator: React.FC<LiveUpdateIndicatorProps> = ({
  isLive = true,
  lastUpdate,
  editingUsers = [],
  className,
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else if (seconds < 3600) {
        setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (!isLive && !editingUsers.length && !lastUpdate) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isLive && (
        <Badge
          variant="outline"
          className="border-green-500/30 bg-green-500/10 text-green-400 animate-pulse"
        >
          <Zap className="w-3 h-3 mr-1" />
          Live
        </Badge>
      )}
      
      {editingUsers.length > 0 && (
        <Badge
          variant="outline"
          className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
        >
          <Users className="w-3 h-3 mr-1" />
          {editingUsers.length} editing
        </Badge>
      )}
      
      {lastUpdate && timeAgo && (
        <span className="text-xs text-muted-foreground">
          Updated {timeAgo}
        </span>
      )}
    </div>
  );
};

