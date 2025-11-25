import type { ClientContext } from "../types";

export interface TicketSummary {
  id: string;
  name: string;
  startsAt: string;
  inventory: number;
}

export interface TicketClient {
  listUpcoming: () => Promise<TicketSummary[]>;
  reserve: (ticketId: string) => Promise<void>;
}

export const createTicketClient = (context: ClientContext): TicketClient => {
  if (!context.config.ticketsBaseUrl) {
    return {
      listUpcoming: async () => {
        throw new Error("Ticket service URL not configured");
      },
      reserve: async () => {
        throw new Error("Ticket service URL not configured");
      }
    };
  }

  // Mock implementation for development
  return {
    async listUpcoming() {
      // Mock upcoming tickets
      return [
        {
          id: "ticket_galaxy_drop",
          name: "Galaxy Runner V2 Drop",
          startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          inventory: 150
        },
        {
          id: "ticket_hyperwave_tee",
          name: "Hyperwave Tee Collection",
          startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          inventory: 300
        },
        {
          id: "ticket_quantum_cap",
          name: "Quantum Cap Limited",
          startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          inventory: 75
        }
      ];
    },
    async reserve(ticketId: string) {
      // Mock reservation - always succeeds for demo
      console.log(`Mock reservation created for ticket: ${ticketId}`);
    }
  };
};
