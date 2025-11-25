import React from "react";
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
  ExternalLink,
  Snowflake,
  Medal,
  Gem,
  Timer,
  ChevronRight,
  Lock,
  Unlock,
  Activity,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Award as AwardIcon,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useOptimizedInvite, useAccessibility } from "../hooks/useOptimizedInvite";
import { InviteErrorBoundary } from "./InviteErrorBoundary";
import {
  resolveInviteProgress,
  INVITE_RANK_TIERS,
  INVITE_ACHIEVEMENTS,
  SEASONAL_EVENTS,
  TEAM_CHALLENGES,
  PREMIUM_INVITE_FEATURES,
  DAILY_QUESTS,
  STREAK_CONFIG,
  LEADERBOARD_CONFIGS,
  type DailyQuest,
  type SeasonalEvent,
  type TeamChallenge,
  type LeaderboardConfig
} from "../config/invite";

interface MegaInviteSystemProps {
  invite: any;
  coinsBalance: number;
  onShare?: () => void;
}


// 🎯 OPTIMIZED MEGA INVITE SYSTEM COMPONENT
export const MegaInviteSystem: React.FC<MegaInviteSystemProps> = ({ invite, coinsBalance, onShare }) => {
  // Use optimized hook for better performance and error handling
  const inviteData = useOptimizedInvite(invite, coinsBalance);
  const accessibility = useAccessibility();

  // Error state handling
  if (inviteData.error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <div className="p-3 rounded-xl bg-red-500/20 w-fit mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">Fehler aufgetreten</h3>
        <p className="text-sm text-muted mb-4">{inviteData.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-accent text-black font-medium hover:bg-accent/80 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  // Loading state
  if (inviteData.loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-3 text-muted">Lade Invite System...</span>
      </div>
    );
  }

  return (
    <MegaInviteSystemContent
      inviteData={inviteData}
      accessibility={accessibility}
      onShare={onShare}
    />
  );
};

// 🎯 MAIN CONTENT COMPONENT (separated for better performance)
interface MegaInviteSystemContentProps {
  inviteData: ReturnType<typeof useOptimizedInvite>;
  accessibility: ReturnType<typeof useAccessibility>;
  onShare?: () => void;
}

const MegaInviteSystemContent: React.FC<MegaInviteSystemContentProps> = ({
  inviteData,
  accessibility,
  onShare
}) => {
  const {
    progress,
    currentTier,
    nextTier,
    userQuests,
    userStreak,
    leaderboardEntries,
    activeEvent,
    activeChallenges,
    availablePremiumFeatures,
    activeTab,
    copied,
    streakActive,
    loading,
    handleTabChange,
    handleCopyInvite,
    handleShare,
    setStreakActive,
    getRankColor,
    getDifficultyColor,
    getTrendIcon
  } = inviteData;

  return (
    <div className="space-y-6">
      {/* Enhanced Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 overflow-x-auto">
        {[
          { id: 'overview', label: 'Übersicht', icon: BarChart3 },
          { id: 'quests', label: 'Quests', icon: Target },
          { id: 'streaks', label: 'Streaks', icon: Flame },
          { id: 'leaderboards', label: 'Rangliste', icon: Trophy },
          { id: 'social', label: 'Social', icon: Users },
          { id: 'premium', label: 'Premium', icon: Gem }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
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
                  <p className="text-2xl font-bold text-purple-400">{userStreak.current}</p>
                  <p className="text-xs text-white/70">Streak</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-yellow-400">{userQuests.filter(q => q.repeatable).length}</p>
                  <p className="text-xs text-white/70">Aktive Quests</p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Quests Preview */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/20">
                  <Target className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text">Tägliche Quests</h3>
                  <p className="text-sm text-muted">Erledige Missionen für Extra Rewards</p>
                </div>
              </div>
              <button
                onClick={() => handleTabChange('quests')}
                className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
              >
                <span>Alle anzeigen</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {userQuests.slice(0, 2).map((quest) => (
                <div key={quest.id} className={`relative overflow-hidden rounded-xl border ${getDifficultyColor(quest.difficulty)} p-4`}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{quest.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-text">{quest.name}</h4>
                      <p className="text-xs text-muted">{quest.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs text-yellow-400">+{quest.rewards.coins}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(quest.difficulty)}`}>
                          {quest.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Status */}
          <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/20">
                  <Flame className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text">Invite Streak</h3>
                  <p className="text-sm text-muted">{userStreak.current} Tage aktiv</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStreakActive(!streakActive)}
                  className={`p-2 rounded-lg transition-colors ${
                    streakActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {streakActive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                </button>
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <RotateCcw className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-white/5">
                <p className="text-xl font-bold text-orange-400">{userStreak.current}</p>
                <p className="text-xs text-muted">Aktuelle</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <p className="text-xl font-bold text-green-400">{userStreak.longest}</p>
                <p className="text-xs text-muted">Beste</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <p className="text-xl font-bold text-purple-400">{userStreak.multiplier}x</p>
                <p className="text-xs text-muted">Bonus</p>
              </div>
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20">
                  <Trophy className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text">Leaderboard</h3>
                  <p className="text-sm text-muted">Top Inviter diese Woche</p>
                </div>
              </div>
              <button
                onClick={() => handleTabChange('leaderboards')}
                className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
              >
                <span>Vollständig</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {leaderboardEntries.slice(0, 3).map((entry) => (
                <div key={entry.userId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-emerald-400 flex items-center justify-center text-xs font-bold text-black">
                    {entry.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text">{entry.username}</p>
                      {getTrendIcon(entry.trend)}
                    </div>
                    <p className="text-xs text-muted">{entry.team} • {entry.score} Punkte</p>
                  </div>
                  <div className="flex gap-1">
                    {entry.badges.map((badge, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions - Enhanced */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-accent hover:bg-accent/80 transition-all duration-300 hover:scale-105 text-black"
            >
              <Share2 className="h-5 w-5" />
              <span className="font-medium">Invite teilen</span>
            </button>
            <button 
              onClick={() => handleTabChange('premium')}
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all duration-300 hover:scale-105"
            >
              <Award className="h-5 w-5 text-purple-400" />
              <span className="font-medium text-purple-400">Belohnungen</span>
            </button>
            <button 
              onClick={() => handleTabChange('social')}
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all duration-300 hover:scale-105"
            >
              <Users className="h-5 w-5 text-blue-400" />
              <span className="font-medium text-blue-400">Team</span>
            </button>
            <button 
              onClick={() => handleTabChange('quests')}
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-all duration-300 hover:scale-105"
            >
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
                  onClick={() => handleTabChange('social')}
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

      {/* Quests Tab */}
      {activeTab === 'quests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-text">🎯 Tägliche Quests</h3>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Target className="h-4 w-4" />
              <span>{userQuests.length} aktiv</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {userQuests.map((quest) => (
              <div key={quest.id} className={`relative overflow-hidden rounded-xl border ${getDifficultyColor(quest.difficulty)} p-4`}>
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{quest.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-text">{quest.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(quest.difficulty)}`}>
                        {quest.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-muted mb-3">{quest.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs text-yellow-400">+{quest.rewards.coins}</span>
                        </div>
                        {quest.rewards.bonus && (
                          <div className="flex items-center gap-1">
                            <AwardIcon className="h-3 w-3 text-purple-400" />
                            <span className="text-xs text-purple-400">{quest.rewards.bonus}</span>
                          </div>
                        )}
                      </div>
                      <button className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 transition-colors">
                        <span>Starten</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streaks Tab */}
      {activeTab === 'streaks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-text">🔥 Streak System</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStreakActive(!streakActive)}
                className={`p-2 rounded-lg transition-colors ${
                  streakActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {streakActive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              </button>
              <span className={`text-sm ${streakActive ? 'text-green-400' : 'text-red-400'}`}>
                {streakActive ? 'Aktiv' : 'Pausiert'}
              </span>
            </div>
          </div>

          {/* Current Streak */}
          <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-8 text-center">
            <div className="mb-4">
              <div className="text-6xl mb-2">🔥</div>
              <h3 className="text-3xl font-bold text-text mb-2">{userStreak.current} Tage</h3>
              <p className="text-lg text-orange-400">Aktuelle Streak</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-2xl font-bold text-green-400">{userStreak.longest}</p>
                <p className="text-sm text-muted">Beste Streak</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-2xl font-bold text-purple-400">{userStreak.multiplier}x</p>
                <p className="text-sm text-muted">Bonus</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-2xl font-bold text-yellow-400">+{STREAK_CONFIG.streakRewards.daily}</p>
                <p className="text-sm text-muted">Pro Tag</p>
              </div>
            </div>
          </div>

          {/* Streak Milestones */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <h4 className="text-lg font-semibold text-text mb-4">Nächste Meilensteine</h4>
            <div className="space-y-3">
              {Object.entries(STREAK_CONFIG.streakAchievements).map(([days, achievement]) => (
                <div key={days} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-emerald-400 flex items-center justify-center text-xs font-bold text-black">
                      {days}
                    </div>
                    <div>
                      <p className="font-medium text-text">{achievement}</p>
                      <p className="text-xs text-muted">Tage Streak</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">+{STREAK_CONFIG.streakMultipliers[parseInt(days)] * 100}%</p>
                    <p className="text-xs text-muted">Bonus</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboards Tab */}
      {activeTab === 'leaderboards' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-text">🏆 Leaderboards</h3>

          <div className="space-y-4">
            {LEADERBOARD_CONFIGS.map((config) => (
              <div key={config.id} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                      <Trophy className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-text">{config.name}</h4>
                      <p className="text-sm text-muted">{config.description}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    config.live ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {config.live ? 'Live' : 'Offline'}
                  </span>
                </div>

                {/* Top 3 */}
                <div className="space-y-3 mb-4">
                  {leaderboardEntries.slice(0, 3).map((entry) => (
                    <div key={entry.userId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        entry.rank === 2 ? 'bg-gray-500/20 text-gray-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {entry.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text">{entry.username}</p>
                          {getTrendIcon(entry.trend)}
                        </div>
                        <p className="text-xs text-muted">{entry.team} • {entry.score} Punkte</p>
                      </div>
                      <div className="flex gap-1">
                        {entry.badges.map((badge, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rewards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-sm font-medium text-green-400">Top 1</p>
                    <p className="text-xs text-muted">{config.rewards.top1}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-sm font-medium text-blue-400">Teilnahme</p>
                    <p className="text-xs text-muted">{config.rewards.participation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-text">👥 Social Features</h3>

          {/* Team Overview */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <h4 className="text-lg font-semibold text-text mb-4">Dein Team</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-2xl font-bold text-accent">{progress.totalReferrals}</p>
                <p className="text-sm text-muted">Team Mitglieder</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-2xl font-bold text-green-400">94%</p>
                <p className="text-sm text-muted">Aktivitätsrate</p>
              </div>
            </div>
          </div>

          {/* Active Challenges */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <h4 className="text-lg font-semibold text-text mb-4">Aktive Challenges</h4>
            <div className="space-y-3">
              {activeChallenges.map((challenge) => (
                <div key={challenge.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-text">{challenge.name}</p>
                    <p className="text-xs text-muted">{challenge.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">{challenge.progress}%</p>
                    <p className="text-xs text-muted">Fortschritt</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-colors">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="font-medium text-blue-400">Team Chat</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-colors">
              <Share2 className="h-5 w-5 text-green-400" />
              <span className="font-medium text-green-400">Erfolg teilen</span>
            </button>
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
