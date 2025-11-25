import { useMemo, useState } from "react";
import { Copy, Gift, Link2, PartyPopper } from "lucide-react";
import type { InviteStatus, ReferralCampaign } from "@nebula/shared";
import { buildReferralProgress } from "../../utils/referral";

interface ReferralMissionCardProps {
  campaign?: ReferralCampaign;
  invite: InviteStatus | null;
  dense?: boolean;
}

const missionStatusLabel = (status: string) => {
  if (status === "completed") return "Erfüllt";
  if (status === "active") return "Aktiv";
  return "Gesperrt";
};

const MissionRow = ({
  label,
  status,
  progress,
  remaining,
  description,
  dense
}: {
  label: string;
  status: string;
  progress: number;
  remaining: number;
  description?: string;
  dense?: boolean;
}) => (
  <div
    className={`${
      dense
        ? "space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-muted"
        : "space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-muted"
    }`}
  >
    <div className="flex items-center justify-between text-text">
      <span className="font-medium">{label}</span>
      <span className={`text-[11px] uppercase ${status === "completed" ? "text-accent" : "text-muted"}`}>
        {missionStatusLabel(status)}
      </span>
    </div>
    {description ? <p>{description}</p> : null}
    <div className="flex items-center justify-between">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-accent" style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>
      {remaining > 0 ? <span className="ml-3 text-[11px] text-muted">Noch {remaining}</span> : null}
    </div>
  </div>
);

export const ReferralMissionCard = ({ campaign, invite, dense }: ReferralMissionCardProps) => {
  const [copied, setCopied] = useState(false);
  const missions = useMemo(() => buildReferralProgress(campaign, invite), [campaign, invite]);

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText || !invite?.inviteCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(invite.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.warn("copy failed", error);
    }
  };

  if (!campaign) return null;

  const containerClasses = dense
    ? "space-y-3 rounded-2xl border border-white/10 bg-[#050505] p-4"
    : "space-y-4 rounded-2xl border border-white/10 bg-[#050505] p-5";

  return (
    <section className={containerClasses} aria-labelledby="product-referral">
      <header className="space-y-1" id="product-referral">
        <p className="text-[11px] uppercase tracking-wide text-muted">Rewards</p>
        <div className="flex items-center gap-2 text-lg font-semibold text-text">
          <Gift className="h-5 w-5 text-accent" />
          {campaign.title}
        </div>
        {campaign.description ? <p className="text-[11px] text-muted">{campaign.description}</p> : null}
      </header>

      <div className="space-y-2">
        {missions.map((mission) => (
          <MissionRow
            key={mission.id}
            label={mission.rewardLabel}
            status={mission.status}
            progress={mission.progress}
            remaining={mission.remaining}
            description={mission.description}
            dense={dense}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
        >
          {copied ? <PartyPopper className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Invite kopiert" : invite?.inviteCode ? "Invite-Link kopieren" : "Keine Invites verfügbar"}
        </button>
        {campaign.expiresAt ? (
          <p className="text-center text-[11px] text-muted">
            Läuft aus am {new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(new Date(campaign.expiresAt))}
          </p>
        ) : null}
        {campaign.termsUrl ? (
          <a
            href={campaign.termsUrl}
            className="flex items-center justify-center gap-2 text-[11px] text-muted underline transition hover:text-text"
          >
            <Link2 className="h-3.5 w-3.5" /> Teilnahmebedingungen
          </a>
        ) : null}
      </div>
    </section>
  );
};
