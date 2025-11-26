import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Filter,
  Download,
  Search,
  Coins,
  Gift,
  Trophy,
  Users,
  Package,
  Award,
  Zap,
  TrendingUp,
  Calendar,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useProfileRealtime } from '../../hooks/useProfileRealtime';
import { useMobileOptimizations } from '../MobileOptimizations';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { springConfigs } from '../../utils/springConfigs';
import { memo } from 'react';

export interface ActivityItem {
  id: string;
  type: 'coins' | 'drop' | 'achievement' | 'invite' | 'purchase' | 'rank' | 'streak';
  title: string;
  description: string;
  amount?: number;
  icon: React.ReactNode;
  timestamp: Date;
  color: string;
}

type ActivityFilter = 'all' | 'coins' | 'drop' | 'achievement' | 'invite' | 'purchase';

const ActivityTypeIcon = {
  coins: Coins,
  drop: Gift,
  achievement: Trophy,
  invite: Users,
  purchase: Package,
  rank: Award,
  streak: Zap,
};

const ActivityTypeColor = {
  coins: 'text-yellow-400 bg-yellow-500/20',
  drop: 'text-green-400 bg-green-500/20',
  achievement: 'text-purple-400 bg-purple-500/20',
  invite: 'text-blue-400 bg-blue-500/20',
  purchase: 'text-accent bg-accent/20',
  rank: 'text-cyan-400 bg-cyan-500/20',
  streak: 'text-orange-400 bg-orange-500/20',
};

export const ActivityTimeline = memo(() => {
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const { recentActivity } = useProfileRealtime({ enabled: true });
  
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Transform realtime activity to ActivityItem format
  const activities = useMemo<ActivityItem[]>(() => {
    const transformed = recentActivity.map((activity) => {
      const Icon = ActivityTypeIcon[activity.type] || Activity;
      return {
        id: activity.id,
        type: activity.type,
        title: activity.message,
        description: activity.message,
        amount: activity.amount,
        icon: <Icon className="w-5 h-5" />,
        timestamp: new Date(activity.timestamp),
        color: ActivityTypeColor[activity.type] || 'text-gray-400 bg-gray-500/20',
      };
    });

    // Add mock activities for demonstration if no real activities
    if (transformed.length === 0) {
      return [
        {
          id: '1',
          type: 'coins',
          title: 'Coins verdient',
          description: '+50 Coins durch Daily Login',
          amount: 50,
          icon: <Coins className="w-5 h-5" />,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          color: ActivityTypeColor.coins,
        },
        {
          id: '2',
          type: 'drop',
          title: 'Drop gewonnen',
          description: 'Nebula Vape Pro',
          icon: <Gift className="w-5 h-5" />,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          color: ActivityTypeColor.drop,
        },
        {
          id: '3',
          type: 'achievement',
          title: 'Achievement freigeschaltet',
          description: 'Drop Master',
          icon: <Trophy className="w-5 h-5" />,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          color: ActivityTypeColor.achievement,
        },
      ];
    }

    return transformed;
  }, [recentActivity]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (activeFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.type === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.title.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [activities, activeFilter, searchQuery]);

  const handleFilterChange = useCallback((filter: ActivityFilter) => {
    triggerHaptic('light');
    setActiveFilter(filter);
    setShowFilters(false);
  }, [triggerHaptic]);

  const handleExport = useCallback(() => {
    triggerHaptic('light');
    // TODO: Implement export functionality
    const csv = [
      ['Type', 'Title', 'Description', 'Amount', 'Timestamp'].join(','),
      ...filteredActivities.map((activity) =>
        [
          activity.type,
          activity.title,
          activity.description,
          activity.amount || '',
          activity.timestamp.toISOString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredActivities, triggerHaptic]);

  const formatTimestamp = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} Min`;
    if (hours < 24) return `vor ${hours} Std`;
    if (days < 7) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    return date.toLocaleDateString('de-DE');
  }, []);

  // Infinite scroll setup
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // TODO: Load more activities
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            Aktivität
          </h2>
          <p className="text-sm text-gray-400">
            Deine letzten Aktivitäten und Ereignisse
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => {
              triggerHaptic('light');
              setShowFilters(!showFilters);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "p-2 rounded-xl bg-white/5 border border-white/10",
              "hover:bg-white/10 transition-colors",
              "touch-target",
              showFilters && "bg-white/10"
            )}
            aria-label="Filter"
          >
            <Filter className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            onClick={handleExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "p-2 rounded-xl bg-white/5 border border-white/10",
              "hover:bg-white/10 transition-colors",
              "touch-target"
            )}
            aria-label="Exportieren"
          >
            <Download className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Aktivität suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full pl-10 pr-4 py-3 rounded-xl",
            "bg-white/5 border border-white/10",
            "text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          )}
        />
      </div>

      {/* Filter Pills */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {(['all', 'coins', 'drop', 'achievement', 'invite', 'purchase'] as ActivityFilter[]).map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    "touch-target",
                    activeFilter === filter
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  {filter === 'all' ? 'Alle' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Keine Aktivitäten gefunden</p>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Versuche eine andere Suche' : 'Deine Aktivitäten werden hier angezeigt'}
              </p>
            </motion.div>
          ) : (
            filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative flex items-start gap-4 p-4 rounded-2xl",
                  "bg-white/5 border border-white/10",
                  "hover:bg-white/10 transition-colors",
                  "cursor-pointer"
                )}
                onClick={() => {
                  triggerHaptic('light');
                  setExpandedItem(expandedItem === activity.id ? null : activity.id);
                }}
              >
                {/* Timeline Line */}
                {index < filteredActivities.length - 1 && (
                  <div className="absolute left-7 top-12 w-0.5 h-full bg-white/10" />
                )}

                {/* Icon */}
                <div className={cn(
                  "relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  activity.color
                )}>
                  {activity.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {activity.title}
                    </h3>
                    {activity.amount && (
                      <span className={cn(
                        "text-sm font-bold flex-shrink-0",
                        activity.type === 'coins' ? "text-yellow-400" : "text-green-400"
                      )}>
                        {activity.amount > 0 ? '+' : ''}{activity.amount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{activity.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(activity.timestamp)}</span>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedItem === activity.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-white/10"
                      >
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Typ:</span>
                            <span className="text-white capitalize">{activity.type}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Zeitpunkt:</span>
                            <span className="text-white">
                              {activity.timestamp.toLocaleString('de-DE')}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <ChevronRight className={cn(
                  "w-5 h-5 text-gray-400 flex-shrink-0 transition-transform",
                  expandedItem === activity.id && "rotate-90"
                )} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-10" />
    </div>
  );
});

ActivityTimeline.displayName = 'ActivityTimeline';

