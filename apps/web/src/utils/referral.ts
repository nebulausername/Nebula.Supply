import type { InviteStatus, ReferralCampaign } from "@nebula/shared";

export type ReferralProgressStatus = "locked" | "active" | "completed";

export interface ReferralMissionProgress {
  id: string;
  required: number;
  achieved: number;
  remaining: number;
  rewardLabel: string;
  description?: string;
  rewardValue?: number;
  bonusProductId?: string;
  status: ReferralProgressStatus;
  progress: number;
}

export const buildReferralProgress = (
  campaign: ReferralCampaign | undefined,
  invite: InviteStatus | null
): ReferralMissionProgress[] => {
  if (!campaign) return [];
  const totalReferrals = invite?.totalReferrals ?? 0;
  const sorted = [...campaign.missions].sort((a, b) => a.required - b.required);

  return sorted.map((mission, index) => {
    const previousRequirement = index === 0 ? 0 : sorted[index - 1].required;
    const status: ReferralProgressStatus = totalReferrals >= mission.required
      ? "completed"
      : totalReferrals >= previousRequirement
      ? "active"
      : "locked";
    const achieved = Math.min(totalReferrals, mission.required);
    const remaining = Math.max(0, mission.required - totalReferrals);
    const progress = Math.min(1, mission.required === 0 ? 1 : achieved / mission.required);

    return {
      id: mission.id,
      required: mission.required,
      achieved,
      remaining,
      rewardLabel: mission.rewardLabel,
      description: mission.description,
      rewardValue: mission.rewardValue,
      bonusProductId: mission.bonusProductId,
      status,
      progress
    };
  });
};
