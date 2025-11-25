import {
  knowledgeBaseArticles as knowledgeBaseSeed,
  ticketAutomations as ticketAutomationSeed,
  ticketMessages as ticketMessageSeed,
  ticketMetrics as ticketMetricSeed,
  tickets as ticketSeed,
  ticketTrend as ticketTrendSeed,
  type KnowledgeBaseArticle,
  type Ticket,
  type TicketAutomationInsight,
  type TicketMessage,
  type TicketMetrics,
  type TicketTrendPoint
} from "@nebula/shared";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchTickets = async (): Promise<Ticket[]> => {
  await delay(220);
  return ticketSeed
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const fetchTicketMetrics = async (): Promise<TicketMetrics> => {
  await delay(150);
  return { ...ticketMetricSeed };
};

export const fetchTicketMessages = async (ticketId: string): Promise<TicketMessage[]> => {
  await delay(160);
  return ticketMessageSeed
    .filter((message) => message.ticketId === ticketId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const fetchTicketTrend = async (): Promise<TicketTrendPoint[]> => {
  await delay(120);
  return ticketTrendSeed.slice();
};

export const fetchTicketAutomations = async (): Promise<TicketAutomationInsight[]> => {
  await delay(110);
  return ticketAutomationSeed.slice();
};

export const fetchKnowledgeBase = async (): Promise<KnowledgeBaseArticle[]> => {
  await delay(180);
  return knowledgeBaseSeed.slice();
};

export type TicketFeedEvent =
  | { type: "status"; ticketId: string; status: Ticket["status"]; timestamp: string }
  | { type: "assignment"; ticketId: string; assignedAgent: string; timestamp: string }
  | { type: "message"; ticketId: string; message: TicketMessage };

type TicketFeedListener = (event: TicketFeedEvent) => void;

let feedListeners: TicketFeedListener[] = [];
let heartbeat: ReturnType<typeof setInterval> | null = null;

const emit = (event: TicketFeedEvent) => {
  feedListeners.forEach((listener) => listener(event));
};

export const subscribeTicketFeed = (listener: TicketFeedListener) => {
  feedListeners.push(listener);

  if (!heartbeat) {
    heartbeat = setInterval(() => {
      const ticket = ticketSeed[Math.floor(Math.random() * ticketSeed.length)];
      if (!ticket) return;

      const eventTypes: TicketFeedEvent["type"][] = ["status", "assignment", "message"];
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      if (type === "status") {
        const statuses: Ticket["status"][] = ["open", "in_progress", "waiting", "escalated", "done"];
        emit({
          type,
          ticketId: ticket.id,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (type === "assignment") {
        const agents = ["Lea", "Marco", "Ops-Team", "Val"];
        emit({
          type,
          ticketId: ticket.id,
          assignedAgent: agents[Math.floor(Math.random() * agents.length)],
          timestamp: new Date().toISOString()
        });
        return;
      }

      emit({
        type,
        ticketId: ticket.id,
        message: {
          id: `TM-${Math.random().toString(36).slice(2, 8)}`,
          ticketId: ticket.id,
          authorType: "customer",
          body: "Kurzes Update aus dem Simulationsfeed.",
          createdAt: new Date().toISOString(),
          via: "telegram",
          sentiment: "neutral"
        }
      });
    }, 15000);
  }

  return () => {
    feedListeners = feedListeners.filter((cb) => cb !== listener);
    if (feedListeners.length === 0 && heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };
};

export const searchTickets = async (query: string): Promise<Ticket[]> => {
  await delay(200);
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return fetchTickets();
  }

  return ticketSeed.filter((ticket) => {
    return (
      ticket.id.toLowerCase().includes(normalized) ||
      ticket.subject.toLowerCase().includes(normalized) ||
      ticket.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  });
};
