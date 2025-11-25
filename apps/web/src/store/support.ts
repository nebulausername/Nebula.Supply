import { create } from "zustand";
import type {
  KnowledgeBaseArticle,
  Ticket,
  TicketAutomationInsight,
  TicketMessage,
  TicketMetrics,
  TicketTrendPoint
} from "@nebula/shared";
import {
  fetchKnowledgeBase,
  fetchTicketAutomations,
  fetchTicketMessages,
  fetchTicketMetrics,
  fetchTicketTrend,
  fetchTickets,
  searchTickets,
  subscribeTicketFeed,
  type TicketFeedEvent
} from "../api/support";

interface Filters {
  status: Ticket["status"] | "all";
  priority: Ticket["priority"] | "all";
  search: string;
}

interface SupportState {
  status: "idle" | "loading" | "ready" | "error";
  tickets: Ticket[];
  metrics: TicketMetrics | null;
  trend: TicketTrendPoint[];
  automations: TicketAutomationInsight[];
  knowledgeBase: KnowledgeBaseArticle[];
  messages: Record<string, TicketMessage[]>;
  selectedTicketId: string | null;
  filters: Filters;
  hydrate: () => Promise<void>;
  selectTicket: (ticketId: string | null) => Promise<void>;
  setStatusFilter: (status: Filters["status"]) => void;
  setPriorityFilter: (priority: Filters["priority"]) => void;
  setSearch: (search: string) => Promise<void>;
  handleFeedEvent: (event: TicketFeedEvent) => void;
}

const initialFilters: Filters = {
  status: "all",
  priority: "all",
  search: ""
};

export const useSupportStore = create<SupportState>((set, get) => ({
  status: "idle",
  tickets: [],
  metrics: null,
  trend: [],
  automations: [],
  knowledgeBase: [],
  messages: {},
  selectedTicketId: null,
  filters: initialFilters,
  hydrate: async () => {
    try {
      set({ status: "loading" });
      const [tickets, metrics, trend, automations, knowledgeBase] = await Promise.all([
        fetchTickets(),
        fetchTicketMetrics(),
        fetchTicketTrend(),
        fetchTicketAutomations(),
        fetchKnowledgeBase()
      ]);

      set({
        tickets,
        metrics,
        trend,
        automations,
        knowledgeBase,
        status: "ready",
        selectedTicketId: tickets[0]?.id ?? null
      });

      if (tickets[0]) {
        const primeMessages = await fetchTicketMessages(tickets[0].id);
        set((state) => ({
          messages: { ...state.messages, [tickets[0].id]: primeMessages }
        }));
      }
    } catch (error) {
      console.error("Failed to hydrate support store", error);
      set({ status: "error" });
    }
  },
  selectTicket: async (ticketId) => {
    set({ selectedTicketId: ticketId });
    if (!ticketId) return;

    if (!get().messages[ticketId]) {
      const messages = await fetchTicketMessages(ticketId);
      set((state) => ({
        messages: { ...state.messages, [ticketId]: messages }
      }));
    }
  },
  setStatusFilter: (status) => {
    set((state) => ({ filters: { ...state.filters, status } }));
  },
  setPriorityFilter: (priority) => {
    set((state) => ({ filters: { ...state.filters, priority } }));
  },
  setSearch: async (search) => {
    set((state) => ({ filters: { ...state.filters, search } }));
    const results = await searchTickets(search);
    set((state) => ({
      tickets: results,
      selectedTicketId: results.length ? results[0].id : state.selectedTicketId
    }));
    if (results.length) {
      const firstId = results[0].id;
      if (!get().messages[firstId]) {
        const primeMessages = await fetchTicketMessages(firstId);
        set((state) => ({
          messages: { ...state.messages, [firstId]: primeMessages }
        }));
      }
    }
  },
  handleFeedEvent: (event) => {
    if (event.type === "message") {
      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === event.ticketId
            ? {
                ...ticket,
                lastMessageAt: event.message.createdAt,
                updatedAt: event.message.createdAt,
                unreadCount: ticket.unreadCount + 1
              }
            : ticket
        ),
        messages: {
          ...state.messages,
          [event.ticketId]: [...(state.messages[event.ticketId] ?? []), event.message]
        }
      }));
      return;
    }

    if (event.type === "assignment") {
      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === event.ticketId
            ? { ...ticket, assignedAgent: event.assignedAgent, updatedAt: event.timestamp }
            : ticket
        )
      }));
      return;
    }

    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === event.ticketId
          ? { ...ticket, status: event.status, updatedAt: event.timestamp }
          : ticket
      )
    }));
  }
}));

let unsubscribe: (() => void) | null = null;

export const startSupportFeed = () => {
  if (unsubscribe) return;
  unsubscribe = subscribeTicketFeed((event) => {
    useSupportStore.getState().handleFeedEvent(event);
  });
};

export const stopSupportFeed = () => {
  if (!unsubscribe) return;
  unsubscribe();
  unsubscribe = null;
};

export const selectFilteredTickets = (state: SupportState): Ticket[] => {
  const { tickets, filters } = state;
  return tickets.filter((ticket) => {
    const matchesStatus = filters.status === "all" || ticket.status === filters.status;
    const matchesPriority = filters.priority === "all" || ticket.priority === filters.priority;
    return matchesStatus && matchesPriority;
  });
};

export const selectSelectedTicketMessages = (state: SupportState): TicketMessage[] => {
  const ticketId = state.selectedTicketId;
  if (!ticketId) return [];
  return state.messages[ticketId] ?? [];
};
