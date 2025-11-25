import { useState, useEffect } from "react";
import {
  Users,
  Star,
  Zap,
  TrendingUp,
  Crown,
  Gift,
  Flame,
  Trophy,
  Target,
  Award,
  Share2,
  Copy,
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
  History,
  Settings,
  ExternalLink,
  Snowflake,
  Medal,
  Gem,
  Sparkles,
  Rocket,
  Timer,
  ChevronRight,
  Lock,
  Unlock
} from "lucide-react";
import {
  resolveInviteProgress,
  INVITE_RANK_TIERS,
  INVITE_ACHIEVEMENTS,
  SEASONAL_EVENTS,
  TEAM_CHALLENGES,
  PREMIUM_INVITE_FEATURES,
  type InviteAchievement,
  type SeasonalEvent,
  type TeamChallenge
} from "../config/invite";

interface UltraInviteSystemProps {
  invite: any;
  coinsBalance: number;
  onShare?: () => void;
}

export const UltraInviteSystem = ({ invite, coinsBalance, onShare }: UltraInviteSystemProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'events' | 'challenges' | 'premium'>('overview');
  const [copied, setCopied] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SeasonalEvent | null>(null);

  const progress = resolveInviteProgress(invite);
  const currentTier = progress.current;
  const nextTier = progress.next;

  // Beispiel Daten
  const userAchievements = INVITE_ACHIEVEMENTS.slice(0, 3); // Erste 3 unlocked
  const activeEvent = SEASONAL_EVENTS.find(e => e.active);
  const activeChallenges = TEAM_CHALLENGES.filter(c => c.status === 'active');
  const availablePremiumFeatures = PREMIUM_INVITE_FEATURES.filter(f =>
    currentTier.id !== 'seed' // Nicht für Seed Rank verfügbar
  );

  const handleCopyInvite = async () => {
    if (invite?.inviteCode) {
      try {
        await navigator.clipboard.writeText(invite.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const getRankColor = (rankId: string) => {
    const tier = INVITE_RANK_TIERS.find(t => t.id === rankId);
    return tier?.color || 'gray';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
      case 'rare': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'epic': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'legendary': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'mythic': return 'text-pink-400 border-pink-500/30 bg-pink-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 overflow-x-auto">
        {[
          { id: 'overview', label: 'Übersicht', icon: BarChart3 },
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'events', label: 'Events', icon: Snowflake },
          { id: 'challenges', label: 'Challenges', icon: Target },
          { id: 'premium', label: 'Premium', icon: Gem }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent text-black shadow-lg'
                : 'text-muted hover:text-text hover:bg-white/5'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab - Enhanced */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Current Rank Card - Enhanced */}
          <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${getRankColor(currentTier.id) === 'rainbow' ? 'from-purple-500/20 via-pink-500/20 to-red-500/20' : `from-${getRankColor(currentTier.id)}-500/20 to-${getRankColor(currentTier.id)}-600/20`} p-8`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className={`text-sm font-medium mb-2 ${
                    currentTier.id === 'supernova' ? 'text-pink-400' :
                    currentTier.id === 'nova' ? 'text-yellow-400' :
                    currentTier.id === 'orbit' ? 'text-purple-400' :
                    currentTier.id === 'comet' ? 'text-blue-400' : 'text-green-400'
                  }`}>
                    {currentTier.label}
                  </p>
                  <h3 className="text-2xl font-bold text-text">{currentTier.headline}</h3>
                </div>
                <div className={`p-4 rounded-2xl bg-white/20`}>
                  <Trophy className={`h-8 w-8 ${
                    currentTier.id === 'supernova' ? 'text-pink-400' :
                    currentTier.id === 'nova' ? 'text-yellow-400' :
                    currentTier.id === 'orbit' ? 'text-purple-400' :
                    currentTier.id === 'comet' ? 'text-blue-400' : 'text-green-400'
                  }`} />
                </div>
              </div>

              {/* Enhanced Progress */}
              {nextTier && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-white/70 mb-3">
                    <span>Fortschritt zu {nextTier.label}</span>
                    <span>{progress.invitesToNext} Invites verbleibend</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
                    <div
                      className={`h-3 bg-gradient-to-r transition-all duration-700 ${
                        currentTier.id === 'supernova' ? 'from-pink-400 to-red-400' :
                        currentTier.id === 'nova' ? 'from-yellow-400 to-orange-400' :
                        currentTier.id === 'orbit' ? 'from-purple-400 to-pink-400' :
                        currentTier.id === 'comet' ? 'from-blue-400 to-cyan-400' : 'from-green-400 to-emerald-400'
                      }`}
                      style={{ width: `${progress.progress * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-white/50">
                    {Math.round(progress.progress * 100)}% abgeschlossen
                  </div>
                </div>
              )}

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-accent">{progress.totalReferrals}</p>
                  <p className="text-xs text-white/70">Team Größe</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-green-400">{currentTier.rewards.coinsPerInvite}</p>
                  <p className="text-xs text-white/70">Coins/Invite</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-purple-400">{currentTier.rewards.bonusDrops}</p>
                  <p className="text-xs text-white/70">Bonus Drops</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-yellow-400">{userAchievements.length}</p>
                  <p className="text-xs text-white/70">Achievements</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Enhanced */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-accent hover:bg-accent/80 transition-all duration-300 hover:scale-105">
              <Share2 className="h-5 w-5" />
              <span className="font-medium">Invite teilen</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all duration-300 hover:scale-105">
              <Award className="h-5 w-5 text-purple-400" />
              <span className="font-medium text-purple-400">Belohnungen</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all duration-300 hover:scale-105">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="font-medium text-blue-400">Team</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-all duration-300 hover:scale-105">
              <Trophy className="h-5 w-5 text-green-400" />
              <span className="font-medium text-green-400">Challenges</span>
            </button>
          </div>

          {/* Active Event Teaser */}
          {activeEvent && (
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <Snowflake className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text">{activeEvent.name}</h3>
                    <p className="text-sm text-blue-400">Aktives Event</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('events')}
                  className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  <span>Mehr erfahren</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted mb-4">{activeEvent.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">{activeEvent.rewards.multiplier}x Multiplier</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-400">{activeEvent.challenges.length} Challenges</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-text">🏆 Achievements</h3>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Trophy className="h-4 w-4" />
              <span>{userAchievements.length} / {INVITE_ACHIEVEMENTS.length} unlocked</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {userAchievements.map((achievement) => (
              <div key={achievement.id} className={`relative overflow-hidden rounded-xl border ${getRarityColor(achievement.rarity)} p-4`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-text">{achievement.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    <p className="text-sm text-muted mb-2">{achievement.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span className="text-yellow-400">+{achievement.rewards.coins} Coins</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Medal className="h-3 w-3 text-purple-400" />
                        <span className="text-purple-400">{achievement.rewards.badge}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Locked Achievements Preview */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 opacity-60">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/10">
                  <Lock className="h-6 w-6 text-white/50" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white/50">Mehr Achievements verfügbar</h4>
                  <p className="text-sm text-white/30">Erreiche höhere Ranks für mehr Achievements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-text">🎄 Saisonale Events</h3>

          {activeEvent && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Snowflake className="h-8 w-8 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-text">{activeEvent.name}</h4>
                  <p className="text-sm text-muted">{activeEvent.description}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Event Multiplier</span>
                  </div>
                  <p className="text-2xl font-bold text-text">{activeEvent.rewards.multiplier}x</p>
                  <p className="text-xs text-muted">Auf alle Rewards</p>
                </div>

                <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">Spezial Rewards</span>
                  </div>
                  <p className="text-lg font-bold text-text">{activeEvent.rewards.specialRewards.length}</p>
                  <p className="text-xs text-muted">Exklusive Items</p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-lg font-semibold text-text">Event Challenges</h5>
                {activeEvent.challenges.map((challenge) => (
                  <div key={challenge.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <p className="font-medium text-text">{challenge.name}</p>
                      <p className="text-xs text-muted">{challenge.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">+{challenge.reward}</p>
                      <p className="text-xs text-muted">Coins</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!activeEvent && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
              <div className="p-4 rounded-xl bg-white/10 w-fit mx-auto mb-4">
                <Clock className="h-8 w-8 text-white/50" />
              </div>
              <h4 className="text-lg font-semibold text-text mb-2">Keine aktiven Events</h4>
              <p className="text-sm text-muted">Bleibe dran für zukünftige saisonale Events!</p>
            </div>
          )}
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-text">🎯 Team Challenges</h3>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Target className="h-4 w-4" />
              <span>{activeChallenges.length} aktiv</span>
            </div>
          </div>

          <div className="space-y-4">
            {activeChallenges.map((challenge) => (
              <div key={challenge.id} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      challenge.type === 'collective' ? 'bg-blue-500/20' :
                      challenge.type === 'competitive' ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                      <Target className={`h-6 w-6 ${
                        challenge.type === 'collective' ? 'text-blue-400' :
                        challenge.type === 'competitive' ? 'text-red-400' : 'text-green-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-text">{challenge.name}</h4>
                      <p className="text-sm text-muted">{challenge.description}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    challenge.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    challenge.status === 'upcoming' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {challenge.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-muted mb-2">
                    <span>Fortschritt</span>
                    <span>{challenge.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-2 transition-all duration-500 ${
                        challenge.type === 'collective' ? 'bg-blue-400' :
                        challenge.type === 'competitive' ? 'bg-red-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${challenge.progress}%` }}
                    />
                  </div>
                </div>

                {/* Rewards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-xl bg-white/5">
                    <p className="text-lg font-bold text-green-400">{challenge.rewards.individual}</p>
                    <p className="text-xs text-muted">Individual</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/5">
                    <p className="text-lg font-bold text-blue-400">{challenge.rewards.team}</p>
                    <p className="text-xs text-muted">Team</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/5">
                    <p className="text-sm font-bold text-purple-400">{challenge.duration}</p>
                    <p className="text-xs text-muted">Tage</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium Tab */}
      {activeTab === 'premium' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-text">💎 Premium Features</h3>

          <div className="grid gap-4 md:grid-cols-2">
            {availablePremiumFeatures.map((feature) => (
              <div key={feature.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30 p-6">
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  currentTier.id === 'supernova' ? 'from-pink-500/10 to-red-500/10' :
                  currentTier.id === 'nova' ? 'from-yellow-500/10 to-orange-500/10' :
                  'from-purple-500/10 to-pink-500/10'
                }`} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/20">
                        <Gem className={`h-6 w-6 ${
                          currentTier.id === 'supernova' ? 'text-pink-400' :
                          currentTier.id === 'nova' ? 'text-yellow-400' : 'text-purple-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text">{feature.name}</h4>
                        <p className="text-xs text-muted">{feature.unlockRequirement}</p>
                      </div>
                    </div>

                    {feature.cost?.premium ? (
                      <div className="flex items-center gap-1 text-xs text-purple-400">
                        <Crown className="h-3 w-3" />
                        <span>Premium</span>
                      </div>
                    ) : feature.cost?.coins ? (
                      <div className="text-right">
                        <p className="text-sm font-bold text-accent">{feature.cost.coins}</p>
                        <p className="text-xs text-muted">Coins</p>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Unlock className="h-4 w-4 text-green-400" />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted mb-4">{feature.description}</p>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-text">Benefits:</p>
                    {feature.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-muted">
                        <div className="w-1 h-1 rounded-full bg-accent" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};









