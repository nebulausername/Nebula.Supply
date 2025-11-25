import { useState, useMemo } from "react";
import type { VipTier } from "../../types/vip";
import type { Drop } from "@nebula/shared";

interface VipPriorityQueueProps {
  drops: Drop[];
  currentTier: VipTier;
  className?: string;
}

interface QueueItem {
  drop: Drop;
  position: number;
  estimatedWait: string;
  priorityLevel: number;
  queueSize: number;
}

export const VipPriorityQueue = ({ drops, currentTier, className = "" }: VipPriorityQueueProps) => {
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);

  // Mock priority queue data
  const queueItems: QueueItem[] = useMemo(() => {
    const lockedDrops = drops.filter(drop =>
      drop.status === 'locked' && drop.interestCount > 50
    );

    return lockedDrops.map((drop, index) => ({
      drop,
      position: Math.floor(Math.random() * 50) + 1,
      estimatedWait: `${Math.floor(Math.random() * 7) + 1} Tage`,
      priorityLevel: getPriorityLevel(currentTier, drop),
      queueSize: Math.floor(Math.random() * 100) + 20
    }));
  }, [drops, currentTier]);

  const getPriorityLevel = (tier: VipTier, drop: Drop): number => {
    const tierOrder = ['Comet', 'Nova', 'Supernova', 'Galaxy'];
    const tierIndex = tierOrder.indexOf(tier);

    // Higher tier = higher priority
    return tierIndex + 1;
  };

  const getTierColor = (tier: VipTier) => {
    switch (tier) {
      case 'Galaxy': return 'from-yellow-500 to-orange-500';
      case 'Supernova': return 'from-orange-500 to-red-500';
      case 'Nova': return 'from-purple-500 to-pink-500';
      case 'Comet': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (queueItems.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-2xl font-bold text-white mb-4">
          Priority Queue
        </h3>
        <p className="text-purple-300">
          Aktuell sind alle VIP-Drops verfügbar. Die Warteliste ist leer!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-3xl font-bold text-white mb-4">
          VIP Priority Queue
        </h2>
        <p className="text-purple-300 max-w-2xl mx-auto">
          Ausverkaufte Premium-Drops mit Warteliste. Als VIP-Mitglied hast du
          priorisierten Zugang zu limitierten Releases.
        </p>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl p-6 border border-red-400/30">
          <div className="text-center">
            <div className="text-3xl mb-2">⏰</div>
            <div className="text-2xl font-bold text-white mb-1">
              {queueItems.length}
            </div>
            <div className="text-red-300 text-sm">
              Wartende Drops
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-400/30">
          <div className="text-center">
            <div className="text-3xl mb-2">👑</div>
            <div className="text-2xl font-bold text-white mb-1">
              {getPriorityLevel(currentTier, {} as Drop)}
            </div>
            <div className="text-yellow-300 text-sm">
              Deine Priorität
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30">
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold text-white mb-1">
              {queueItems.reduce((sum, item) => sum + item.queueSize, 0)}
            </div>
            <div className="text-green-300 text-sm">
              Wartende User
            </div>
          </div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        {queueItems.map((item, index) => (
          <div
            key={item.drop.id}
            className={`
              relative p-6 rounded-2xl border-2 backdrop-blur-xl transition-all duration-300 cursor-pointer
              ${selectedQueue === item.drop.id
                ? 'bg-purple-900/30 border-purple-400 scale-105'
                : 'bg-black/20 border-purple-400/20 hover:border-purple-400/40 hover:scale-102'
              }
            `}
            onClick={() => setSelectedQueue(selectedQueue === item.drop.id ? null : item.drop.id)}
          >
            {/* Priority Badge */}
            <div className="absolute -top-3 left-4">
              <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getTierColor(currentTier)} text-white`}>
                Priorität #{item.priorityLevel}
              </div>
            </div>

            {/* Drop Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-2xl font-bold">
                  {item.drop.badge === 'VIP' ? '💎' : item.drop.badge === 'Limitiert' ? '⚡' : '🛒'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {item.drop.name}
                  </h3>
                  <p className="text-purple-300 text-sm">
                    {item.drop.flavorTag} • {item.drop.price}€
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-400">Warteliste</div>
                <div className="text-lg font-bold text-white">
                  #{item.position}
                </div>
              </div>
            </div>

            {/* Queue Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-purple-300 text-sm">Position</div>
                <div className="text-white font-semibold">#{item.position}</div>
              </div>

              <div className="text-center">
                <div className="text-purple-300 text-sm">Wartezeit</div>
                <div className="text-white font-semibold">{item.estimatedWait}</div>
              </div>

              <div className="text-center">
                <div className="text-purple-300 text-sm">Wartende</div>
                <div className="text-white font-semibold">{item.queueSize}</div>
              </div>

              <div className="text-center">
                <div className="text-purple-300 text-sm">Priorität</div>
                <div className="text-white font-semibold">#{item.priorityLevel}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105">
                Benachrichtigen lassen
              </button>

              <button className="px-4 py-3 bg-black/30 hover:bg-black/50 text-purple-300 hover:text-white rounded-xl transition-all duration-300 border border-purple-400/30">
                Details
              </button>
            </div>

            {/* Expanded Details */}
            {selectedQueue === item.drop.id && (
              <div className="mt-6 pt-6 border-t border-purple-400/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-semibold mb-3">Drop-Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-300">Originalpreis:</span>
                        <span className="text-white">{item.drop.price}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Verfügbarkeit:</span>
                        <span className="text-white">Ausverkauft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Interessierte:</span>
                        <span className="text-white">{item.drop.interestCount}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-3">VIP-Vorteile</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-300">Priority-Zugang bei Neuauflage</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-300">Exklusive Benachrichtigungen</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-purple-300">VIP-Preisgarantie</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* VIP Priority Explanation */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">
            Wie funktioniert die Priority Queue?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <span className="text-white font-semibold">Ausverkauf</span>
              </div>
              <p className="text-purple-300 text-sm">
                Wenn ein Drop ausverkauft ist, wird automatisch eine Warteliste erstellt.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <span className="text-white font-semibold">VIP-Priorität</span>
              </div>
              <p className="text-purple-300 text-sm">
                Höhere VIP-Tier erhalten automatisch bessere Positionen in der Warteliste.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <span className="text-white font-semibold">Benachrichtigung</span>
              </div>
              <p className="text-purple-300 text-sm">
                Du wirst automatisch benachrichtigt, sobald der Drop wieder verfügbar ist.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




