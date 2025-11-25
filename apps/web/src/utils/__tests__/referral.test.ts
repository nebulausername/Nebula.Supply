import { describe, expect, it } from "vitest";
import type { ReferralCampaign, InviteStatus } from "@nebula/shared";
import { buildReferralProgress } from "../referral";

const campaign: ReferralCampaign = {
  id: "ref-test",
  title: "Test",
  missions: [
    { id: "m1", required: 1, rewardLabel: "-20 €" },
    { id: "m2", required: 3, rewardLabel: "-50%" }
  ]
};

const invite: InviteStatus = {
  userId: "user",
  hasInvite: true,
  inviteCode: "CODE",
  availableInvites: 2,
  totalReferrals: 2,
  rank: "Nebula"
};

describe("buildReferralProgress", () => {
  it("marks missions as completed or active based on referrals", () => {
    const result = buildReferralProgress(campaign, invite);
    expect(result[0].status).toBe("completed");
    expect(result[1].status).toBe("active");
    expect(result[1].remaining).toBe(1);
  });
});
