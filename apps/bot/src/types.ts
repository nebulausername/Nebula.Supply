import type { Context } from "telegraf";
import type { AppConfig } from "./config";

export type OnboardingStatus = "unknown" | "awaiting_verification" | "verified" | "rejected";

export interface SessionState {
  memberId?: string;
  inviteCode?: string;
  onboardingStatus: OnboardingStatus;
  lastInteractionAt?: string;
  pendingOrderId?: string;
  awaitingInvite?: boolean;
  verificationSessionId?: string;
  cashPaymentSessionId?: string;
  verificationStatus?: string;
  inviteStatus?: string;
  // Support Ticket System
  awaitingTicketDescription?: boolean;
  awaitingTicketMessage?: boolean;
  ticketCategory?: string;
  activeTicketId?: string;
  isVipTicket?: boolean;
  // Notification Settings
  notificationSettings?: {
    dropAlerts?: boolean;
    eventReminders?: boolean;
    systemNotifications?: boolean;
    vipNotifications?: boolean;
  };
}

export interface NebulaContext extends Context {
  config: AppConfig;
  session: SessionState;
}

export interface ClientContext {
  config: AppConfig;
}
