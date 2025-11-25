import type { ClientContext } from "../types";

export interface SelfieSession {
  sessionId: string;
  status: "pending" | "approved" | "rejected";
  expiresAt?: string;
  url?: string;
}

export interface IdentityClient {
  requestSelfieSession: (telegramId: number) => Promise<SelfieSession>;
  fetchStatus: (sessionId: string) => Promise<SelfieSession>;
}

export const createIdentityClient = (context: ClientContext): IdentityClient => {
  if (!context.config.identityBaseUrl) {
    return {
      requestSelfieSession: async () => {
        throw new Error("Identity service URL not configured");
      },
      fetchStatus: async () => {
        throw new Error("Identity service URL not configured");
      }
    };
  }

  // Mock implementation for development
  return {
    async requestSelfieSession(telegramId: number) {
      const sessionId = `selfie_${telegramId}_${Date.now()}`;
      return {
        sessionId,
        status: "pending" as const,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        url: context.config.webAppUrl ? `${context.config.webAppUrl}/selfie?session=${sessionId}` : undefined
      };
    },
    async fetchStatus(sessionId: string) {
      // Mock: Randomly approve/reject for demo
      const isApproved = Math.random() > 0.3; // 70% approval rate
      return {
        sessionId,
        status: isApproved ? "approved" as const : "rejected" as const,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      };
    }
  };
};
