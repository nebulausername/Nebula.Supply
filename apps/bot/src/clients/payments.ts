import type { ClientContext } from "../types";

export type PaymentMethod = "crypto_voucher" | "btc" | "cash";

export interface PaymentIntent {
  id: string;
  method: PaymentMethod;
  amountFiat: number;
  currency: string;
  expiresAt?: string;
  status: "pending" | "confirmed" | "failed";
}

export interface PaymentsClient {
  createIntent: (payload: {
    method: PaymentMethod;
    amountFiat: number;
    currency: string;
  }) => Promise<PaymentIntent>;
  fetchIntent: (intentId: string) => Promise<PaymentIntent>;
}

export const createPaymentsClient = (context: ClientContext): PaymentsClient => {
  if (!context.config.paymentsBaseUrl) {
    return {
      createIntent: async () => {
        throw new Error("Payments service URL not configured");
      },
      fetchIntent: async () => {
        throw new Error("Payments service URL not configured");
      }
    };
  }

  // Mock implementation for development
  return {
    async createIntent(payload) {
      const intentId = `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: intentId,
        method: payload.method,
        amountFiat: payload.amountFiat,
        currency: payload.currency,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        status: "pending" as const
      };
    },
    async fetchIntent(intentId: string) {
      // Mock: Randomly confirm payments for demo
      const isConfirmed = Math.random() > 0.4; // 60% confirmation rate
      return {
        id: intentId,
        method: "btc" as PaymentMethod,
        amountFiat: 99.99,
        currency: "EUR",
        status: isConfirmed ? "confirmed" as const : "pending" as const
      };
    }
  };
};
