import { useState, useMemo } from "react";
import type { VipTier } from "../../types/vip";

interface VipAchievementsProps {
  currentTier: VipTier;
  vipScore: number;
  className?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'drops' | 'social' | 'loyalty' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirements: {
    type: 'drops_purchased' | 'invites_sent' | 'tier_reached' | 'score_achieved' | 'time_spent';
    target: number;
    current?: number;
  };
  unlocked: boolean;
  unlockedAt?: string;
  tier: VipTier;
}

const achievements: Achievement[] = [
  // Drop Achievements
  {
    id: 'first-drop',
    title: 'Erster VIP-Drop',
    description: 'Dein erster exklusiver VIP-Kauf',
    icon: '🎁',
    category: 'drops',
    rarity: 'common',
    points: 50,
    requirements: { type: 'drops_purchased', target: 1 },
    unlocked: true,
    unlockedAt: '2024-01-15',
    tier: 'Comet'
  },
  {
    id: 'drop-collector',
    title: 'Drop Collector',
    description: 'Sammle 10 verschiedene VIP-Drops',
    icon: '🏆',
    category: 'drops',
    rarity: 'rare',
    points: 200,
    requirements: { type: 'drops_purchased', target: 10 },
    unlocked: false,
    tier: 'Nova'
  },
  {
    id: 'vip-master',
    title: 'VIP Master',
    description: 'Erreiche 50 VIP-Käufe insgesamt',
    icon: '👑',
    category: 'drops',
    rarity: 'epic',
    points: 500,
    requirements: { type: 'drops_purchased', target: 50 },
    unlocked: false,
    tier: 'Supernova'
  },

  // Social Achievements
  {
    id: 'first-invite',
    title: 'Erster Invite',
    description: 'Lade dein erstes Mitglied ein',
    icon: '👥',
    category: 'social',
    rarity: 'common',
    points: 25,
    requirements: { type: 'invites_sent', target: 1 },
    unlocked: true,
    unlockedAt: '2024-01-10',
    tier: 'Comet'
  },
  {
    id: 'community-builder',
    title: 'Community Builder',
    description: 'Lade 10 Mitglieder erfolgreich ein',
    icon: '🌟',
    category: 'social',
    rarity: 'rare',
    points: 150,
    requirements: { type: 'invites_sent', target: 10 },
    unlocked: false,
    tier: 'Nova'
  },

  // Loyalty Achievements
  {
    id: 'nova-reached',
    title: 'Nova erreicht!',
    description: 'Steige zum Nova-Tier auf',
    icon: '💫',
    category: 'loyalty',
    rarity: 'rare',
    points: 300,
    requirements: { type: 'tier_reached', target: 2 }, // Nova is tier 2
    unlocked: true,
    unlockedAt: '2024-02-01',
    tier: 'Nova'
  },
  {
    id: 'score-master',
    title: 'Score Master',
    description: 'Erreiche 5000 VIP-Punkte',
    icon: '⭐',
    category: 'loyalty',
    rarity: 'epic',
    points: 400,
    requirements: { type: 'score_achieved', target: 5000 },
    unlocked: false,
    tier: 'Supernova'
  },

  // Special Achievements
  {
    id: 'early-adopter',
    title: 'Early Adopter',
    description: 'Sei unter den ersten 100 VIP-Mitgliedern',
    icon: '🚀',
    category: 'special',
    rarity: 'legendary',
    points: 1000,
    requirements: { type: 'time_spent', target: 30 }, // Days since registration
    unlocked: false,
    tier: 'Galaxy'
  }
];

const rarityColors = {
  common: {
    bg: 'from-gray-900/20 to-gray-800/20',
    border: 'border-gray-400/30',
    text: 'text-gray-300',
    badge: 'bg-gray-600 text-white'
  },
  rare: {
    bg: 'from-blue-900/20 to-cyan-900/20',
    border: 'border-blue-400/30',
    text: 'text-blue-300',
    badge: 'bg-blue-500 text-white'
  },
  epic: {
    bg: 'from-purple-900/20 to-pink-900/20',
    border: 'border-purple-400/30',
    text: 'text-purple-300',
    badge: 'bg-purple-500 text-white'
  },
  legendary: {
    bg: 'from-yellow-900/20 to-orange-900/20',
    border: 'border-yellow-400/30',
    text: 'text-yellow-300',
    badge: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black'
  }
};

const categoryIcons = {
  drops: '🛒',
  social: '👥',
  loyalty: '⭐',
  special: '🏆'
};

export const VipAchievements = ({ currentTier, vipScore, className = "" }: VipAchievementsProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  // Filter achievements based on current tier and filters
  const filteredAchievements = useMemo(() => {
    let filtered = achievements;

    // Filter by tier - show achievements for current tier and below
    const tierOrder = ['Comet', 'Nova', 'Supernova', 'Galaxy'];
    const currentTierIndex = tierOrder.indexOf(currentTier);

    filtered = filtered.filter(achievement => {
      const achievementTierIndex = tierOrder.indexOf(achievement.tier);
      return achievementTierIndex <= currentTierIndex;
    });

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(achievement => achievement.category === selectedCategory);
    }

    // Filter by unlocked status
    if (showOnlyUnlocked) {
      filtered = filtered.filter(achievement => achievement.unlocked);
    }

    return filtered;
  }, [currentTier, selectedCategory, showOnlyUnlocked]);

  // Calculate progress for each achievement
  const achievementsWithProgress = useMemo(() => {
    return filteredAchievements.map(achievement => {
      let progress = 0;
      let current = 0;

      switch (achievement.requirements.type) {
        case 'drops_purchased':
          // This would need actual data from store
          current = 12; // Mock data
          break;
        case 'invites_sent':
          current = 8; // Mock data
          break;
        case 'tier_reached':
          current = achievement.requirements.target <= 2 ? achievement.requirements.target : 1;
          break;
        case 'score_achieved':
          current = Math.min(vipScore, achievement.requirements.target);
          break;
        case 'time_spent':
          current = 45; // Mock days
          break;
      }

      progress = Math.min((current / achievement.requirements.target) * 100, 100);

      return {
        ...achievement,
        progress,
        current,
        isAlmostComplete: progress >= 80 && !achievement.unlocked
      };
    });
  }, [filteredAchievements, vipScore]);

  const categories = [
    { id: 'all', name: 'Alle', icon: '✨', count: filteredAchievements.length },
    { id: 'drops', name: 'Drops', icon: '🛒', count: filteredAchievements.filter(a => a.category === 'drops').length },
    { id: 'social', name: 'Social', icon: '👥', count: filteredAchievements.filter(a => a.category === 'social').length },
    { id: 'loyalty', name: 'Loyalty', icon: '⭐', count: filteredAchievements.filter(a => a.category === 'loyalty').length },
    { id: 'special', name: 'Special', icon: '🏆', count: filteredAchievements.filter(a => a.category === 'special').length }
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-4xl font-bold text-white mb-4">
          VIP Achievements
        </h2>
        <p className="text-purple-300 max-w-3xl mx-auto">
          Sammle Achievements, verdiene Punkte und zeige deine VIP-Reise.
          Jedes Achievement bringt dich näher an höhere Tier-Stufen.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap justify-center gap-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2
                ${selectedCategory === category.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-black/20 text-purple-300 hover:text-white hover:bg-purple-600/20 border border-purple-400/20'
                }
              `}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                {category.count}
              </span>
            </button>
          ))}
        </div>

        {/* Toggle Filter */}
        <button
          onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
          className={`
            px-4 py-2 rounded-xl font-semibold transition-all duration-300
            ${showOnlyUnlocked
              ? 'bg-green-600 text-white'
              : 'bg-black/20 text-purple-300 hover:text-white hover:bg-purple-600/20 border border-purple-400/20'
            }
          `}
        >
          {showOnlyUnlocked ? '✅ Nur freigeschaltet' : '🔓 Alle anzeigen'}
        </button>
      </div>

      {/* Achievement Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30">
          <div className="text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-white mb-1">
              {achievementsWithProgress.filter(a => a.unlocked).length}
            </div>
            <div className="text-green-300 text-sm">
              Freigeschaltet
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
          <div className="text-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-white mb-1">
              {achievementsWithProgress.filter(a => a.progress >= 80 && !a.unlocked).length}
            </div>
            <div className="text-blue-300 text-sm">
              Fast fertig
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30">
          <div className="text-center">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-2xl font-bold text-white mb-1">
              {achievementsWithProgress.reduce((sum, a) => sum + a.points, 0).toLocaleString('de-DE')}
            </div>
            <div className="text-purple-300 text-sm">
              Mögliche Punkte
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
          <div className="text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-white mb-1">
              {Math.round(achievementsWithProgress.filter(a => a.unlocked).length / achievementsWithProgress.length * 100)}%
            </div>
            <div className="text-orange-300 text-sm">
              Completion Rate
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievementsWithProgress.map((achievement) => {
          const achievementRarityColors = rarityColors[achievement.rarity];
          const isUnlocked = achievement.unlocked;
          const isAlmostComplete = achievement.isAlmostComplete;

          return (
            <div
              key={achievement.id}
              className={`
                relative group transition-all duration-300
                ${isUnlocked ? 'opacity-100' : 'opacity-75'}
                ${isAlmostComplete ? 'ring-2 ring-yellow-400/50' : ''}
              `}
            >
              <div className={`
                relative p-6 rounded-2xl border-2 backdrop-blur-xl h-full
                ${achievementRarityColors.bg} ${achievementRarityColors.border}
                ${isUnlocked ? 'hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20' : ''}
              `}>
                {/* Rarity Badge */}
                <div className="absolute -top-3 left-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${achievementRarityColors.badge}`}>
                    {achievement.rarity.toUpperCase()}
                  </div>
                </div>

                {/* Achievement Icon */}
                <div className="text-5xl mb-4 text-center">
                  {achievement.icon}
                </div>

                {/* Achievement Info */}
                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold text-white mb-2`}>
                    {achievement.title}
                  </h3>
                  <p className={`${achievementRarityColors.text} text-sm mb-4`}>
                    {achievement.description}
                  </p>

                  {/* Tier Badge */}
                  <div className={`
                    inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3
                    ${achievement.tier === 'Galaxy' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                      achievement.tier === 'Supernova' ? 'bg-orange-500/20 text-orange-400 border border-orange-400/30' :
                      achievement.tier === 'Nova' ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-400/30'}
                  `}>
                    {achievement.tier} VIP
                  </div>

                  {/* Progress Bar */}
                  {!isUnlocked && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`${achievementRarityColors.text} text-sm`}>
                          Fortschritt
                        </span>
                        <span className={`${achievementRarityColors.text} text-sm`}>
                          {achievement.current}/{achievement.requirements.target}
                        </span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            achievement.progress >= 100 ? 'bg-green-400' :
                            achievement.progress >= 80 ? 'bg-yellow-400' :
                            achievement.progress >= 50 ? 'bg-blue-400' : 'bg-purple-400'
                          }`}
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Points Reward */}
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-white font-bold">
                      {achievement.points} Punkte
                    </span>
                  </div>

                  {/* Unlocked Badge */}
                  {isUnlocked && (
                    <div className="absolute top-4 right-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    </div>
                  )}

                  {/* Almost Complete Badge */}
                  {isAlmostComplete && !isUnlocked && (
                    <div className="absolute top-4 right-4">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-black text-sm">!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Achievement Summary */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Deine Achievement-Statistiken
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-xl font-bold text-white">
                {achievementsWithProgress.filter(a => a.unlocked).length}
              </div>
              <div className="text-purple-300 text-sm">
                Freigeschaltet
              </div>
            </div>

            <div>
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-xl font-bold text-white">
                {achievementsWithProgress.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)}
              </div>
              <div className="text-purple-300 text-sm">
                Verdiente Punkte
              </div>
            </div>

            <div>
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-xl font-bold text-white">
                {Math.round(achievementsWithProgress.filter(a => a.unlocked).length / achievementsWithProgress.length * 100)}%
              </div>
              <div className="text-purple-300 text-sm">
                Completion
              </div>
            </div>

            <div>
              <div className="text-3xl mb-2">🚀</div>
              <div className="text-xl font-bold text-white">
                {currentTier}
              </div>
              <div className="text-purple-300 text-sm">
                Aktueller Rang
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




