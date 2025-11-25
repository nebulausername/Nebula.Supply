import type { InviteActivity, InviteStatus } from "../types";

export const inviteStatusMock: InviteStatus = {
  userId: "user-123",
  hasInvite: true,
  inviteCode: "NEBULA-GALAXY",
  availableInvites: 2,
  totalReferrals: 5,
  rank: "Comet"
};

export const inviteActivityMock: InviteActivity[] = [
  {
    id: "act-101",
    inviteeHandle: "@luna",
    channel: "telegram",
    status: "rewarded",
    sentAt: "2025-09-10T14:12:00.000Z",
    activatedAt: "2025-09-10T15:34:00.000Z",
    coinsAwarded: 150,
    remindersSent: 1,
    lastReminderAt: "2025-09-10T15:00:00.000Z"
  },
  {
    id: "act-102",
    inviteeHandle: "@orion",
    channel: "whatsapp",
    status: "activated",
    sentAt: "2025-09-12T09:05:00.000Z",
    activatedAt: "2025-09-13T18:21:00.000Z",
    coinsPending: 80,
    remindersSent: 0
  },
  {
    id: "act-103",
    inviteeHandle: "@nova",
    channel: "direct",
    status: "pending",
    sentAt: "2025-09-15T20:45:00.000Z",
    coinsPending: 50,
    remindersSent: 1,
    lastReminderAt: "2025-09-16T08:00:00.000Z"
  },
  {
    id: "act-104",
    inviteeHandle: "@zenith",
    channel: "email",
    status: "pending",
    sentAt: "2025-09-17T07:32:00.000Z",
    coinsPending: 50,
    remindersSent: 0
  },
  {
    id: "act-105",
    inviteeHandle: "@sol",
    channel: "telegram",
    status: "rewarded",
    sentAt: "2025-09-05T12:05:00.000Z",
    activatedAt: "2025-09-05T12:45:00.000Z",
    coinsAwarded: 120,
    remindersSent: 0
  },
  {
    id: "act-106",
    inviteeHandle: "@aurora",
    channel: "qr",
    status: "activated",
    sentAt: "2025-09-14T10:14:00.000Z",
    activatedAt: "2025-09-14T10:42:00.000Z",
    coinsPending: 60,
    remindersSent: 0
  }
];
