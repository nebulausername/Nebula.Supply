import { useCallback, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, Mail, MessageCircle, Send, Share2, X } from "lucide-react";
import type { InviteStatus } from "@nebula/shared";

interface InviteShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invite: InviteStatus | null;
}

const buildInviteLink = (invite: InviteStatus | null) => {
  if (!invite?.inviteCode) return "https://nebula.supply";
  const code = encodeURIComponent(invite.inviteCode.trim());
  return `https://nebula.supply/invite/${code}`;
};

const buildShareMessage = (invite: InviteStatus | null) => {
  const rank = invite?.rank ? `Ich bin Rang ${invite.rank}` : "Join mich";
  return `${rank} bei Nebula Supply. Hol dir Zugang zu Drops, Rewards und unserem Telegram Bot.`;
};

export const InviteShareModal = ({ open, onOpenChange, invite }: InviteShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const inviteLink = useMemo(() => buildInviteLink(invite), [invite]);
  const message = useMemo(() => buildShareMessage(invite), [invite]);
  const inviteCode = invite?.inviteCode ?? "-";

  const copyToClipboard = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.warn("invite copy failed", error);
    }
  }, [inviteLink]);

  const openShareTarget = useCallback(
    (url: string) => {
      if (typeof window === "undefined") return;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    []
  );

  const shareOptions = useMemo(
    () => [
      {
        id: "copy",
        label: "Link kopieren",
        description: "Nutze den Link in jeder App",
        icon: copied ? Check : Copy,
        onClick: copyToClipboard
      },
      {
        id: "telegram",
        label: "Telegram teilen",
        description: "Empfohlen fuer schnelle Conversions",
        icon: Send,
        onClick: () =>
          openShareTarget(
            `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(message)}`
          )
      },
      {
        id: "whatsapp",
        label: "WhatsApp teilen",
        description: "Perfekt fuer Crews & Gruppen",
        icon: MessageCircle,
        onClick: () =>
          openShareTarget(
            `https://api.whatsapp.com/send?text=${encodeURIComponent(`${message} ${inviteLink}`)}`
          )
      },
      {
        id: "mail",
        label: "E-Mail senden",
        description: "Personalisiertes Anschreiben vorbereiten",
        icon: Mail,
        onClick: () =>
          openShareTarget(
            `mailto:?subject=${encodeURIComponent("Nebula Invite")}&body=${encodeURIComponent(
              `${message}\n\n${inviteLink}`
            )}`
          )
      }
    ],
    [copied, copyToClipboard, inviteLink, message, openShareTarget]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur" />
        <Dialog.Content className="fixed inset-x-4 top-[8%] z-50 mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#070b0e] shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between border-b border-white/5 px-6 py-5">
            <div>
              <Dialog.Title className="text-xl font-semibold text-text">Freunde einladen</Dialog.Title>
              <Dialog.Description className="text-xs text-muted">
                Teile deinen Link, tracke Conversions und hol dir Rewards.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full border border-white/10 p-1.5 text-muted transition hover:text-text">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="grid gap-6 px-6 py-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted">Invite Link</p>
              <div className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-text md:flex-row md:items-center md:justify-between">
                <div className="break-all font-mono text-xs text-muted md:max-w-[70%]">{inviteLink}</div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-text transition hover:border-accent hover:text-accent"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Kopiert" : "Link kopieren"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    type="button"
                    key={option.id}
                    onClick={option.onClick}
                    className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-accent/60 hover:bg-accent/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text">{option.label}</p>
                        <p className="mt-1 text-xs text-muted">{option.description}</p>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-muted">
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <span className="mt-3 text-[11px] uppercase tracking-wide text-muted">Los geht's</span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text">Invite Code</p>
                <span className="text-xs text-muted">Teile ihn auch offline</span>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/60 px-4 py-3 font-mono text-sm text-text">
                <span>{inviteCode}</span>
                <Share2 className="h-4 w-4 text-muted" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-text">Message Vorschlag</p>
              <p className="mt-2 text-xs text-muted">Passe den Text an deine Crew an, bevor du ihn sendest.</p>
              <textarea
                readOnly
                value={`${message}\n${inviteLink}`}
                className="mt-3 h-24 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-muted focus:outline-none"
              />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
