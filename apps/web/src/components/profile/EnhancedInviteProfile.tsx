import { useState, useMemo, useCallback } from "react";
import {
  Users,
  Zap,
  Crown,
  Gift,
  Trophy,
  Share2,
  Copy,
  CheckCircle,
  BarChart3,
  History
} from "lucide-react";
import { resolveInviteProgress } from "../../config/invite";
import { cn } from "../../utils/cn";

interface EnhancedInviteProfileProps {
  invite: any;
  coinsBalance: number;
}

export const EnhancedInviteProfile = ({ invite, coinsBalance }: EnhancedInviteProfileProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards'>('overview');
  const [copied, setCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // Memoize progress calculation
  const progress = useMemo(() => resolveInviteProgress(invite), [invite]);
  const currentTier = progress.current;
  const nextTier = progress.next;

  // Stats für Overview - memoized
  const stats = useMemo(() => ({
    totalInvites: progress.totalReferrals,
    successfulInvites: Math.floor(progress.totalReferrals * 0.8),
    conversionRate: 0.8,
    totalEarned: coinsBalance + 1500, // Beispiel
  }), [progress.totalReferrals, coinsBalance]);

  // Generate QR Code URL - memoized
  const inviteUrl = useMemo(() => 
    `https://nebulasupply.com/invite/${invite?.inviteCode || 'NEBULA2025'}`,
    [invite?.inviteCode]
  );
  const qrCodeUrl = useMemo(() => 
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`,
    [inviteUrl]
  );

  const handleCopyInvite = useCallback(async () => {
    if (invite?.inviteCode) {
      try {
        await navigator.clipboard.writeText(invite.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, [invite?.inviteCode]);

  const handleShareInvite = useCallback(async () => {
    const shareText = `Join Nebula Supply and get exclusive access to limited drops! Use my invite code: ${invite?.inviteCode || 'NEBULA2025'}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Nebula Supply',
          text: shareText,
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled or share failed - fallback to copy
        if (err instanceof Error && !err.message.includes('AbortError')) {
          console.error('Share failed:', err);
        }
        handleCopyInvite();
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyInvite();
    }
  }, [invite?.inviteCode, inviteUrl, handleCopyInvite]);

  // Share via specific platform
  const handleShareVia = useCallback((platform: 'whatsapp' | 'telegram' | 'email' | 'twitter') => {
    const shareText = `Join Nebula Supply and get exclusive access to limited drops! Use my invite code: ${invite?.inviteCode || 'NEBULA2025'}`;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(inviteUrl);

    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Join%20Nebula%20Supply&body=${encodedText}%20${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  }, [invite?.inviteCode, inviteUrl]);

  return (
    <div className={cn(
      "space-y-4 sm:space-y-6"
    )}>
      {/* Tab Navigation */}
      <div className={cn(
        "flex items-center gap-2 rounded-xl bg-white/5 backdrop-blur-xl",
        "p-1",
        "overflow-x-auto scrollbar-hide snap-x snap-mandatory"
      )}>
        {[
          { id: 'overview', label: 'Übersicht', icon: BarChart3 },
          { id: 'rewards', label: 'Belohnungen', icon: Gift }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300 touch-target snap-start",
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5',
              "px-4 sm:px-5 md:px-6",
              "py-2 sm:py-2.5 md:py-3",
              "text-xs sm:text-sm",
              "min-h-[44px]"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Current Rank Card */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/20",
            "p-4 sm:p-5 md:p-6"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-purple-400 mb-1">
                    {currentTier.label}
                  </p>
                  <h3 className={cn(
                    "font-bold text-white",
                    "text-lg sm:text-xl md:text-2xl"
                  )}>{currentTier.headline}</h3>
                </div>
                <Trophy className={cn(
                  "text-purple-400",
                  "h-6 w-6 sm:h-8 sm:w-8"
                )} />
              </div>

              {/* Progress */}
              {nextTier && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>Fortschritt zu {nextTier.label}</span>
                    <span>{progress.invitesToNext} verbleibend</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-2 bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                      style={{ width: `${progress.progress * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className={cn(
                "grid gap-3 sm:gap-4",
                "grid-cols-3"
              )}>
                <div className={cn(
                  "text-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10",
                  "p-2 sm:p-3"
                )}>
                  <p className={cn(
                    "font-bold text-accent",
                    "text-base sm:text-lg"
                  )}>{stats.totalInvites}</p>
                  <p className="text-xs text-gray-400">Gesendet</p>
                </div>
                <div className={cn(
                  "text-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10",
                  "p-2 sm:p-3"
                )}>
                  <p className={cn(
                    "font-bold text-green-400",
                    "text-base sm:text-lg"
                  )}>{stats.successfulInvites}</p>
                  <p className="text-xs text-gray-400">Erfolgreich</p>
                </div>
                <div className={cn(
                  "text-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10",
                  "p-2 sm:p-3"
                )}>
                  <p className={cn(
                    "font-bold text-purple-400",
                    "text-base sm:text-lg"
                  )}>{Math.round(stats.conversionRate * 100)}%</p>
                  <p className="text-xs text-gray-400">Conversion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className={cn(
              "grid gap-3 sm:gap-4",
              "grid-cols-1",
              "sm:grid-cols-3"
            )}>
              <button 
                onClick={handleShareInvite}
                className={cn(
                  "group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 touch-target",
                  "p-3 sm:p-4",
                  "min-h-[44px]"
                )}
              >
                <Share2 className="h-5 w-5 text-white" />
                <span className="font-medium text-white text-sm sm:text-base">Teilen</span>
              </button>
              <button 
                onClick={handleCopyInvite}
                className={cn(
                  "group relative flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 touch-target",
                  "p-3 sm:p-4",
                  "min-h-[44px]"
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="font-medium text-green-400 text-sm sm:text-base">Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 text-white" />
                    <span className="font-medium text-white text-sm sm:text-base">Kopieren</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowQRCode(!showQRCode)}
                className={cn(
                  "group relative flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 touch-target",
                  "p-3 sm:p-4",
                  "min-h-[44px]"
                )}
              >
                <BarChart3 className="h-5 w-5 text-white" />
                <span className="font-medium text-white text-sm sm:text-base">QR-Code</span>
              </button>
            </div>

            {/* Share via specific platforms */}
            <div className={cn(
              "grid gap-2",
              "grid-cols-2",
              "sm:grid-cols-2",
              "md:grid-cols-4"
            )}>
              {[
                { platform: 'whatsapp' as const, label: 'WhatsApp', color: 'from-green-500 to-emerald-500' },
                { platform: 'telegram' as const, label: 'Telegram', color: 'from-blue-500 to-cyan-500' },
                { platform: 'email' as const, label: 'Email', color: 'from-gray-500 to-slate-500' },
                { platform: 'twitter' as const, label: 'Twitter', color: 'from-sky-500 to-blue-500' },
              ].map(({ platform, label, color }) => (
                <button
                  key={platform}
                  onClick={() => handleShareVia(platform)}
                  className={cn(
                    "rounded-xl hover:opacity-90 transition-all duration-300 text-white font-medium touch-target",
                    color,
                    "p-2.5 sm:p-3",
                    "text-xs sm:text-sm",
                    "min-h-[44px]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* QR Code Display */}
          {showQRCode && (
            <div className={cn(
              "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
              "p-4 sm:p-5 md:p-6"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
              <div className="relative z-10 flex flex-col items-center">
                <p className="text-sm text-gray-400 mb-4">Scanne den QR-Code zum Einladen</p>
                <div className={cn(
                  "bg-white rounded-2xl",
                  "p-3 sm:p-4"
                )}>
                  <img 
                    src={qrCodeUrl} 
                    alt="Invite QR Code" 
                    className={cn(
                      "w-full h-auto",
                      "max-w-[180px] sm:max-w-[200px] md:max-w-[240px]",
                      "mx-auto"
                    )}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Code: <span className="font-mono text-accent">{invite?.inviteCode || 'NEBULA2025'}</span>
                </p>
              </div>
            </div>
          )}

          {/* Invite Code Display */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
            "p-4 sm:p-5 md:p-6"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
            <div className="relative z-10">
              <p className="text-sm text-gray-400 mb-2">Dein Invite-Code</p>
              <div className="flex items-center gap-3">
                <code className={cn(
                  "flex-1 rounded-xl bg-black/40 text-accent font-mono font-bold tracking-wider border border-accent/20",
                  "px-3 sm:px-4",
                  "py-2 sm:py-3",
                  "text-base sm:text-lg",
                  "break-all"
                )}>
                  {invite?.inviteCode || 'NEBULA2025'}
                </code>
                <button
                  onClick={handleCopyInvite}
                  className={cn(
                    "rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-colors touch-target",
                    "p-2.5 sm:p-3",
                    "min-h-[44px] min-w-[44px]"
                  )}
                  aria-label="Code kopieren"
                >
                  {copied ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5 text-accent" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className={cn(
            "grid gap-4",
            "grid-cols-1",
            "sm:grid-cols-2",
            "md:grid-cols-2"
          )}>
            <div className={cn(
              "relative overflow-hidden rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl",
              "p-4 sm:p-5"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Verdiente Coins</span>
                </div>
                <p className={cn(
                  "font-bold text-white mb-1",
                  "text-2xl sm:text-3xl"
                )}>{stats.totalEarned}</p>
                <p className="text-xs text-gray-400">Insgesamt verdient</p>
              </div>
            </div>

            <div className={cn(
              "relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl",
              "p-3 sm:p-4 md:p-5"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">Nächster Bonus</span>
                </div>
                <p className={cn(
                  "font-bold text-white mb-1",
                  "text-2xl sm:text-3xl"
                )}>+150</p>
                <p className="text-xs text-gray-400">Bei nächstem Invite</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-purple-400" />
                Belohnungs-Historie
              </h3>
              <div className="space-y-3">
                {[
                  { date: "Heute", type: "Daily Login", amount: "+25 Coins", status: "claimed", icon: Zap },
                  { date: "Gestern", type: "Invite Success", amount: "+100 Coins", status: "claimed", icon: Users },
                  { date: "Vor 2 Tagen", type: "Rank Up", amount: "+500 Coins", status: "claimed", icon: Trophy }
                ].map((reward, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                      <reward.icon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{reward.type}</p>
                      <p className="text-xs text-gray-400">{reward.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">{reward.amount}</p>
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        <span>{reward.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};









