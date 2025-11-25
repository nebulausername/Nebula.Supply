import { useState } from "react";
import { X, Users, Share2, Copy, Check, Crown, Sparkles } from "lucide-react";
import { cn } from "../utils/cn";

interface InviteRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSuccess?: () => void;
  dropName?: string;
}

export const InviteRequiredModal = ({ 
  isOpen, 
  onClose, 
  onInviteSuccess,
  dropName = "diesem Drop"
}: InviteRequiredModalProps) => {
  const [copied, setCopied] = useState(false);
  const [inviteCode] = useState("NEBULA2024");

  const handleCopyInvite = async () => {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'NebulaOrderBot';
    const inviteLink = `https://t.me/${botUsername.toLowerCase()}?start=${inviteCode}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy invite link:", error);
    }
  };

  const handleShareInvite = async () => {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'NebulaOrderBot';
    const shareData = {
      title: "Nebula Supply - Exklusive Drops",
      text: `Lade dich zu ${dropName} ein! Verwende meinen Invite-Code: ${inviteCode}`,
      url: `https://t.me/${botUsername.toLowerCase()}?start=${inviteCode}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        onInviteSuccess?.();
      } else {
        await handleCopyInvite();
      }
    } catch (error) {
      console.error("Failed to share invite:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="relative p-6 border-b border-slate-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Exklusiver Zugang erforderlich</h2>
              <p className="text-sm text-slate-400">Premium Drop - Invite benötigt!</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Info */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-purple-400 font-semibold text-sm mb-2">🎯 Premium Drop</p>
              <p className="text-slate-300 text-sm">
                <strong>{dropName}</strong> ist nur für eingeladene Nutzer verfügbar.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-700/50">
              <p className="text-slate-300 text-sm mb-2">
                <strong>Vorteile mit Invite:</strong>
              </p>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• Exklusive Drops vorzubestellen</li>
                <li>• Früher Zugang zu neuen Sorten</li>
                <li>• Spezielle Preise und Angebote</li>
              </ul>
            </div>
          </div>

          {/* Invite Code */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Dein Invite-Code</label>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-600">
              <span className="flex-1 font-mono text-lg font-bold text-orange-400">
                {inviteCode}
              </span>
              <button
                onClick={handleCopyInvite}
                className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  copied
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Invite-Link kopiert!
              </p>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Deine Vorteile:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                <Sparkles className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-slate-300">Kostenlose Drops bestellen</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                <Crown className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-slate-300">Exklusive VIP-Drops</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                <Users className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-slate-300">Belohnungen für erfolgreiche Invites</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleShareInvite}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:scale-105 shadow-lg"
            >
              <Share2 className="h-5 w-5" />
              <span>Invite teilen</span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Später einladen
            </button>
          </div>

          {/* Help */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Teile deinen Invite-Code über Telegram, WhatsApp oder andere Apps
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
