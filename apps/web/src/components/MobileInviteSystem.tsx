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
  Share2,
  Copy,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { resolveInviteProgress, INVITE_RANK_TIERS } from "../config/invite";

interface MobileInviteSystemProps {
  invite: any;
  coinsBalance: number;
  onShare?: () => void;
}

export const MobileInviteSystem = ({ invite, coinsBalance, onShare }: MobileInviteSystemProps) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
      case 'seed': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'comet': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'orbit': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'nova': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'supernova': return 'text-pink-400 border-pink-500/30 bg-pink-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Invite Card */}
      <div className={`relative overflow-hidden rounded-2xl border ${getRankColor(currentTier.id)} p-4`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20">
                <Trophy className={`h-5 w-5 ${getRankColor(currentTier.id).split(' ')[0].replace('text-', 'text-').replace('-400', '-400')}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${getRankColor(currentTier.id).split(' ')[0]}`}>
                  {currentTier.label}
                </p>
                <p className="text-xs text-white/70">{currentTier.headline}</p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-white" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {nextTier && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                <span>Zu {nextTier.label}</span>
                <span>{progress.invitesToNext} übrig</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className={`h-1.5 bg-gradient-to-r ${getRankColor(currentTier.id).split(' ')[0].replace('text-', 'from-').replace('-400', '-400')} transition-all duration-500`}
                  style={{ width: `${progress.progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-accent">{progress.totalReferrals}</p>
              <p className="text-xs text-white/70">Team</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-green-400">{coinsBalance}</p>
              <p className="text-xs text-white/70">Coins</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-purple-400">{Math.round(progress.progress * 100)}%</p>
              <p className="text-xs text-white/70">Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          {/* Invite Code */}
          {invite?.inviteCode && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Dein Invite Code</h4>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="font-mono text-xs text-accent">{invite?.inviteCode}</p>
                </div>
                <button
                  onClick={handleCopyInvite}
                  className="p-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-black" />
                  ) : (
                    <Copy className="h-4 w-4 text-black" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-white/70">
                <span>{invite?.availableInvites || 0} Invites verfügbar</span>
                <button
                  onClick={onShare}
                  className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors"
                >
                  <Share2 className="h-3 w-3" />
                  <span>Teilen</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-accent hover:bg-accent/80 transition-colors">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Team</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-colors">
              <Gift className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Rewards</span>
            </button>
          </div>

          {/* Perks Preview */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Deine Perks</h4>
            <div className="space-y-2">
              {currentTier.perks.slice(0, 3).map((perk, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <Star className={`h-3 w-3 ${getRankColor(currentTier.id).split(' ')[0].replace('text-', 'text-').replace('-400', '-400')}`} />
                  <span className="text-xs text-white">{perk}</span>
                </div>
              ))}
              {currentTier.perks.length > 3 && (
                <p className="text-xs text-white/50 text-center">
                  +{currentTier.perks.length - 3} weitere Perks
                </p>
              )}
            </div>
          </div>

          {/* Daily Streak */}
          <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">Daily Streak</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-white">7 Tage</p>
              <p className="text-xs text-white/70">+25 Coins täglich</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Quick Actions */}
      {!expanded && (
        <div className="grid grid-cols-3 gap-2">
          <button className="flex items-center justify-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <Share2 className="h-3 w-3 text-accent" />
            <span className="text-xs text-white">Teilen</span>
          </button>
          <button className="flex items-center justify-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <Users className="h-3 w-3 text-purple-400" />
            <span className="text-xs text-white">Team</span>
          </button>
          <button className="flex items-center justify-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <Gift className="h-3 w-3 text-green-400" />
            <span className="text-xs text-white">Rewards</span>
          </button>
        </div>
      )}
    </div>
  );
};









