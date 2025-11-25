import { useState, useEffect } from "react";
import { useVipWebSocket } from "../../hooks/useVipWebSocket";
import type { VipTier } from "../../types/vip";

interface VipLiveActivityFeedProps {
  currentTier: VipTier;
  className?: string;
}

interface ActivityItem {
  id: string;
  type: 'achievement' | 'tier_upgrade' | 'drop_purchase' | 'benefit_used' | 'community_event';
  user: {
    handle: string;
    tier: VipTier;
    avatar?: string;
  };
  message: string;
  timestamp: string;
  icon: string;
  highlight?: boolean;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'achievement',
    user: { handle: 'NebulaPioneer', tier: 'Galaxy' },
    message: 'hat das "VIP Master" Achievement freigeschaltet!',
    timestamp: new Date(Date.now() - 3000).toISOString(),
    icon: '🏆',
    highlight: true
  },
  {
    id: '2',
    type: 'tier_upgrade',
    user: { handle: 'DropMaster', tier: 'Supernova' },
    message: 'ist zum Supernova-Tier aufgestiegen!',
    timestamp: new Date(Date.now() - 8000).toISOString(),
    icon: '🌟',
    highlight: true
  },
  {
    id: '3',
    type: 'drop_purchase',
    user: { handle: 'CommunityHelper', tier: 'Nova' },
    message: 'hat einen exklusiven VIP-Drop erworben',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    icon: '🛒'
  },
  {
    id: '4',
    type: 'benefit_used',
    user: { handle: 'ShopVeteran', tier: 'Nova' },
    message: 'hat Priority Access für einen limitierten Drop genutzt',
    timestamp: new Date(Date.now() - 25000).toISOString(),
    icon: '⚡'
  },
  {
    id: '5',
    type: 'community_event',
    user: { handle: 'NebulaTeam', tier: 'Galaxy' },
    message: 'VIP Flash Sale gestartet - 30% Rabatt auf alle Drops!',
    timestamp: new Date(Date.now() - 35000).toISOString(),
    icon: '🎉',
    highlight: true
  }
];

const activityTypeColors = {
  achievement: {
    bg: 'from-yellow-900/20 to-orange-900/20',
    border: 'border-yellow-400/30',
    text: 'text-yellow-300',
    icon: 'bg-yellow-500'
  },
  tier_upgrade: {
    bg: 'from-purple-900/20 to-pink-900/20',
    border: 'border-purple-400/30',
    text: 'text-purple-300',
    icon: 'bg-purple-500'
  },
  drop_purchase: {
    bg: 'from-green-900/20 to-emerald-900/20',
    border: 'border-green-400/30',
    text: 'text-green-300',
    icon: 'bg-green-500'
  },
  benefit_used: {
    bg: 'from-blue-900/20 to-cyan-900/20',
    border: 'border-blue-400/30',
    text: 'text-blue-300',
    icon: 'bg-blue-500'
  },
  community_event: {
    bg: 'from-red-900/20 to-pink-900/20',
    border: 'border-red-400/30',
    text: 'text-red-300',
    icon: 'bg-gradient-to-r from-red-500 to-pink-500'
  }
};

const tierIcons: Record<VipTier, string> = {
  Comet: '🌟',
  Nova: '💫',
  Supernova: '✨',
  Galaxy: '🌌'
};

export const VipLiveActivityFeed = ({ currentTier, className = "" }: VipLiveActivityFeedProps) => {
  const { isConnected, lastMessage, connectionStatus } = useVipWebSocket();
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);
  const [showAll, setShowAll] = useState(false);

  // Add real-time activities from WebSocket
  useEffect(() => {
    if (lastMessage) {
      const newActivity: ActivityItem = {
        id: `ws-${Date.now()}`,
        type: mapWebSocketTypeToActivity(lastMessage.type),
        user: { handle: 'System', tier: 'Galaxy' },
        message: formatWebSocketMessage(lastMessage),
        timestamp: lastMessage.timestamp,
        icon: getActivityIcon(lastMessage.type),
        highlight: lastMessage.priority === 'high'
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
    }
  }, [lastMessage]);

  const mapWebSocketTypeToActivity = (wsType: string): ActivityItem['type'] => {
    switch (wsType) {
      case 'achievement_unlocked': return 'achievement';
      case 'tier_update': return 'tier_upgrade';
      case 'community_event': return 'community_event';
      case 'drop_available': return 'drop_purchase';
      case 'score_update': return 'achievement';
      default: return 'community_event';
    }
  };

  const formatWebSocketMessage = (message: any): string => {
    switch (message.type) {
      case 'achievement_unlocked':
        return `hat "${message.data.title}" freigeschaltet!`;
      case 'tier_update':
        return `ist zum ${message.data.newTier}-Tier aufgestiegen!`;
      case 'community_event':
        return message.data.description;
      case 'score_update':
        return `hat ${message.data.scoreIncrease} VIP-Punkte erhalten!`;
      default:
        return 'VIP-Aktivität erkannt';
    }
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'achievement_unlocked': return '🏆';
      case 'tier_update': return '🌟';
      case 'community_event': return '🎉';
      case 'score_update': return '⭐';
      default: return '📢';
    }
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📡</div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Live VIP Activity Feed
            </h3>
            <p className="text-purple-300 text-sm">
              Echtzeit-Aktivitäten der VIP-Community
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`
            w-3 h-3 rounded-full animate-pulse
            ${isConnected ? 'bg-green-400' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}
          `} />
          <span className={`text-sm ${
            isConnected ? 'text-green-300' : connectionStatus === 'connecting' ? 'text-yellow-300' : 'text-red-300'
          }`}>
            {isConnected ? 'Live' : connectionStatus === 'connecting' ? 'Verbinde...' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {displayedActivities.map((activity, index) => {
          const colors = activityTypeColors[activity.type];

          return (
            <div
              key={activity.id}
              className={`
                relative p-4 rounded-xl border backdrop-blur-xl transition-all duration-300
                ${colors.bg} ${colors.border}
                ${activity.highlight ? 'ring-2 ring-yellow-400/50 animate-pulse' : ''}
                ${index === 0 ? 'scale-105' : ''}
              `}
            >
              {/* Activity Icon */}
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-full ${colors.icon} flex items-center justify-center text-white font-bold`}>
                  {activity.icon}
                </div>

                <div className="flex-1 min-w-0">
                  {/* User Info */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-white font-semibold">
                      {activity.user.handle}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      activity.user.tier === 'Galaxy' ? 'bg-yellow-500/20 text-yellow-400' :
                      activity.user.tier === 'Supernova' ? 'bg-orange-500/20 text-orange-400' :
                      activity.user.tier === 'Nova' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {tierIcons[activity.user.tier]} {activity.user.tier}
                    </span>
                  </div>

                  {/* Message */}
                  <p className={`${colors.text} text-sm mb-2`}>
                    {activity.message}
                  </p>

                  {/* Timestamp */}
                  <p className="text-gray-400 text-xs">
                    {new Date(activity.timestamp).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Highlight Badge */}
                {activity.highlight && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-black text-xs">★</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More / Show All */}
      {!showAll && activities.length > 5 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Alle Aktivitäten anzeigen ({activities.length})
          </button>
        </div>
      )}

      {showAll && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(false)}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            Weniger anzeigen
          </button>
        </div>
      )}

      {/* Real-time Stats */}
      <div className="bg-gradient-to-r from-black/40 to-purple-900/20 backdrop-blur-xl rounded-2xl p-4 border border-purple-400/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">👥</div>
            <div className="text-lg font-bold text-white">
              {Math.floor(Math.random() * 50) + 20}
            </div>
            <div className="text-purple-300 text-xs">
              Aktive VIPs
            </div>
          </div>

          <div>
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-lg font-bold text-white">
              {Math.floor(Math.random() * 15) + 5}
            </div>
            <div className="text-purple-300 text-xs">
              Aktivitäten/h
            </div>
          </div>

          <div>
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-lg font-bold text-white">
              {Math.floor(Math.random() * 8) + 3}
            </div>
            <div className="text-purple-300 text-xs">
              Achievements/h
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




