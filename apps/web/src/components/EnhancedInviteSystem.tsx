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
  ArrowRight
} from "lucide-react";
import { resolveInviteProgress, INVITE_RANK_TIERS } from "../config/invite";

interface EnhancedInviteSystemProps {
  invite: any;
  coinsBalance: number;
  onShare?: () => void;
}

export const EnhancedInviteSystem = ({ invite, coinsBalance, onShare }: EnhancedInviteSystemProps) => {
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState(7); // Beispiel Streak
  const [dailyReward, setDailyReward] = useState(25); // Beispiel tägliche Belohnung

  const progress = resolveInviteProgress(invite);
  const currentTier = progress.current;
  const nextTier = progress.next;

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
    switch (rankId) {
      case 'seed': return 'text-green-400';
      case 'comet': return 'text-blue-400';
      case 'orbit': return 'text-purple-400';
      case 'nova': return 'text-yellow-400';
      case 'supernova': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  const getRankBgColor = (rankId: string) => {
    switch (rankId) {
      case 'seed': return 'from-green-500/20 to-emerald-500/20';
      case 'comet': return 'from-blue-500/20 to-cyan-500/20';
      case 'orbit': return 'from-purple-500/20 to-pink-500/20';
      case 'nova': return 'from-yellow-500/20 to-orange-500/20';
      case 'supernova': return 'from-pink-500/20 to-red-500/20';
      default: return 'from-gray-500/20 to-gray-600/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header mit aktuellem Rank */}
      <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${getRankBgColor(currentTier.id)} p-6`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm font-medium ${getRankColor(currentTier.id)} mb-1`}>
                {currentTier.label}
              </p>
              <h3 className="text-xl font-bold text-text">{currentTier.headline}</h3>
            </div>
            <div className="p-3 rounded-xl bg-white/20">
              <Trophy className={`h-6 w-6 ${getRankColor(currentTier.id)}`} />
            </div>
          </div>

          {/* Progress Bar zu nächstem Rank */}
          {nextTier && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-muted mb-2">
                <span>Fortschritt zu {nextTier.label}</span>
                <span>{progress.invitesToNext} Invites verbleibend</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-2 bg-gradient-to-r ${getRankColor(currentTier.id)} transition-all duration-500`}
                  style={{ width: `${progress.progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Aktuelle Belohnungen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-white/5">
              <p className="text-lg font-bold text-accent">{currentTier.perks.length}</p>
              <p className="text-xs text-muted">Perks</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/5">
              <p className="text-lg font-bold text-green-400">{coinsBalance}</p>
              <p className="text-xs text-muted">Coins</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/5">
              <p className="text-lg font-bold text-purple-400">{progress.totalReferrals}</p>
              <p className="text-xs text-muted">Team</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Code & Sharing */}
      {invite?.inviteCode && (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
          <h4 className="text-lg font-semibold text-text mb-4">Dein Invite Code</h4>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="font-mono text-sm text-accent">{invite?.inviteCode}</p>
            </div>
            <button
              onClick={handleCopyInvite}
              className="p-3 rounded-xl bg-accent hover:bg-accent/80 transition-colors"
            >
              {copied ? (
                <CheckCircle className="h-5 w-5 text-black" />
              ) : (
                <Copy className="h-5 w-5 text-black" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <span>{invite?.availableInvites || 0} Invites verfügbar</span>
            <button
              onClick={onShare}
              className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Teilen</span>
            </button>
          </div>
        </div>
      )}

      {/* Daily Streak & Rewards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">Daily Streak</span>
          </div>
          <p className="text-2xl font-bold text-text">{streak}</p>
          <p className="text-xs text-muted">Tage aktiv</p>
        </div>

        <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Daily Reward</span>
          </div>
          <p className="text-2xl font-bold text-text">+{dailyReward}</p>
          <p className="text-xs text-muted">Coins heute</p>
        </div>
      </div>

      {/* Perks Übersicht */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
        <h4 className="text-lg font-semibold text-text mb-4">Deine Perks</h4>
        <div className="space-y-3">
          {currentTier.perks.map((perk, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className={`p-1.5 rounded-lg ${getRankColor(currentTier.id).replace('text-', 'bg-').replace('-400', '-500/20')}`}>
                <Star className={`h-3 w-3 ${getRankColor(currentTier.id)}`} />
              </div>
              <span className="text-sm text-text">{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-accent hover:bg-accent/80 transition-colors">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">Team anzeigen</span>
        </button>
        <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-colors">
          <Award className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-400">Rewards</span>
        </button>
      </div>
    </div>
  );
};









