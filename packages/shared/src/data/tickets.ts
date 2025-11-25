import type {
  KnowledgeBaseArticle,
  Ticket,
  TicketAutomationInsight,
  TicketMessage,
  TicketMetrics,
  TicketTrendPoint
} from "../types";

export const tickets: Ticket[] = [
  {
    id: "T-582",
    subject: "Lieferung verzoegert",
    summary: "Tracking haengt seit drei Tagen bei DHL fest.",
    status: "waiting",
    priority: "high",
    createdAt: "2025-09-18T08:42:00.000Z",
    updatedAt: "2025-09-20T11:15:00.000Z",
    telegramUserHash: "#f7a1",
    channel: "telegram",
    category: "shipping",
    tags: ["dhl", "vip"],
    lastMessageAt: "2025-09-20T09:55:00.000Z",
    slaDueAt: "2025-09-20T12:00:00.000Z",
    waitingSince: "2025-09-19T17:30:00.000Z",
    assignedAgent: "Lea",
    unreadCount: 2,
    sentiment: "negative",
    satisfaction: null,
    escalatedAt: "2025-09-20T10:45:00.000Z"
  },
  {
    id: "T-581",
    subject: "Coin Rueckerstattung",
    summary: "Auto Refund wurde nicht angewendet.",
    status: "in_progress",
    priority: "medium",
    createdAt: "2025-09-17T16:12:00.000Z",
    updatedAt: "2025-09-20T10:10:00.000Z",
    telegramUserHash: "#d2bc",
    channel: "telegram",
    category: "payment",
    tags: ["coins", "refund"],
    lastMessageAt: "2025-09-20T10:05:00.000Z",
    slaDueAt: "2025-09-20T14:00:00.000Z",
    assignedAgent: "Marco",
    unreadCount: 0,
    sentiment: "neutral",
    satisfaction: null
  },
  {
    id: "T-579",
    subject: "Produkt verfuegbar?",
    summary: "Frage nach Restock des Peach Ice Drops.",
    status: "open",
    priority: "low",
    createdAt: "2025-09-19T19:20:00.000Z",
    updatedAt: "2025-09-19T19:20:00.000Z",
    telegramUserHash: "#ab83",
    channel: "telegram",
    category: "product",
    tags: ["restock"],
    lastMessageAt: "2025-09-19T19:20:00.000Z",
    slaDueAt: "2025-09-21T08:00:00.000Z",
    unreadCount: 1,
    sentiment: "neutral",
    satisfaction: null
  },
  {
    id: "T-575",
    subject: "Checkout Fehler",
    summary: "Fehlercode 1207 waehrend Apple Pay.",
    status: "escalated",
    priority: "critical",
    createdAt: "2025-09-16T09:02:00.000Z",
    updatedAt: "2025-09-20T09:30:00.000Z",
    telegramUserHash: "#91fe",
    channel: "telegram",
    category: "payment",
    tags: ["checkout", "bug"],
    lastMessageAt: "2025-09-20T09:22:00.000Z",
    slaDueAt: "2025-09-20T11:00:00.000Z",
    assignedAgent: "Ops-Team",
    unreadCount: 3,
    sentiment: "negative",
    satisfaction: null,
    escalatedAt: "2025-09-20T09:25:00.000Z"
  },
  {
    id: "T-571",
    subject: "Adresse aktualisieren",
    summary: "Kundin hat neue Lieferadresse gesendet.",
    status: "done",
    priority: "low",
    createdAt: "2025-09-15T14:05:00.000Z",
    updatedAt: "2025-09-19T13:45:00.000Z",
    telegramUserHash: "#c3dd",
    channel: "telegram",
    category: "shipping",
    tags: ["address"],
    lastMessageAt: "2025-09-19T13:30:00.000Z",
    unreadCount: 0,
    sentiment: "positive",
    satisfaction: 4.8
  }
];

export const ticketMessages: TicketMessage[] = [
  {
    id: "TM-001",
    ticketId: "T-582",
    authorType: "customer",
    body: "Hey Team, mein Paket haengt seit Dienstag. Gibt es ein Update?",
    createdAt: "2025-09-18T08:42:00.000Z",
    via: "telegram",
    sentiment: "negative"
  },
  {
    id: "TM-002",
    ticketId: "T-582",
    authorType: "automation",
    body: "Wir haben dein Ticket erhalten und checken den Versandstatus. Du bekommst sofort ein Update.",
    createdAt: "2025-09-18T08:42:15.000Z",
    via: "telegram"
  },
  {
    id: "TM-003",
    ticketId: "T-582",
    authorType: "agent",
    authorName: "Lea",
    body: "Ich habe DHL kontaktiert - es gibt einen Scan von heute 09:40 Uhr. Zustellung voraussichtlich morgen.",
    createdAt: "2025-09-20T09:55:00.000Z",
    via: "internal",
    isPrivate: true
  },
  {
    id: "TM-004",
    ticketId: "T-581",
    authorType: "customer",
    body: "Coins wurden nicht gutgeschrieben nach meiner letzten Bestellung.",
    createdAt: "2025-09-17T16:12:00.000Z",
    via: "telegram",
    sentiment: "neutral"
  },
  {
    id: "TM-005",
    ticketId: "T-581",
    authorType: "agent",
    authorName: "Marco",
    body: "Danke fuer den Hinweis! Ich habe die Bestellung geprueft und eine manuelle Gutschrift vorbereitet.",
    createdAt: "2025-09-20T10:05:00.000Z",
    via: "telegram"
  },
  {
    id: "TM-006",
    ticketId: "T-575",
    authorType: "customer",
    body: "Apple Pay bricht mit Fehler 1207 ab.",
    createdAt: "2025-09-16T09:02:00.000Z",
    via: "telegram",
    sentiment: "negative"
  },
  {
    id: "TM-007",
    ticketId: "T-575",
    authorType: "system",
    body: "Ticket wurde auf Eskalationsstufe Level 2 gesetzt.",
    createdAt: "2025-09-20T09:25:00.000Z",
    via: "internal"
  }
];

export const ticketMetrics: TicketMetrics = {
  open: 7,
  waiting: 3,
  inProgress: 5,
  escalated: 2,
  doneToday: 14,
  avgFirstResponseMinutes: 6,
  avgResolutionMinutes: 94,
  automationDeflectionRate: 0.42,
  satisfactionScore: 4.6
};

export const ticketTrend: TicketTrendPoint[] = [
  { timestamp: "2025-09-20T08:00:00.000Z", open: 8, waiting: 4, escalated: 1 },
  { timestamp: "2025-09-20T10:00:00.000Z", open: 7, waiting: 3, escalated: 2 },
  { timestamp: "2025-09-20T12:00:00.000Z", open: 6, waiting: 3, escalated: 2 }
];

export const ticketAutomations: TicketAutomationInsight[] = [
  { id: "auto-routing", label: "SLA Routing", value: "92% on target", trend: "+4%" },
  { id: "auto-replies", label: "Auto Replies", value: "68 deflected", trend: "+9" },
  { id: "sentiment-alerts", label: "Sentiment Alerts", value: "5 triggered", trend: "-2" }
];

export const knowledgeBaseArticles: KnowledgeBaseArticle[] = [
  {
    id: "kb-001",
    title: "Tracking stuck bei DHL",
    summary: "Schritt fuer Schritt Guide fuer Pakete ohne Scan innerhalb von 48h.",
    tags: ["shipping", "dhl", "delay"],
    lastUpdated: "2025-09-18T12:00:00.000Z",
    confidence: 0.91,
    views: 432,
    helpfulVotes: 387,
    link: "https://support.nebula/kb/dhl-delay"
  },
  {
    id: "kb-002",
    title: "Coins nach Bestellung gutschreiben",
    summary: "Automations Flow und manuelle Workarounds fuer Coin Rueckerstattungen.",
    tags: ["coins", "payment"],
    lastUpdated: "2025-09-16T09:15:00.000Z",
    confidence: 0.87,
    views: 295,
    helpfulVotes: 241
  },
  {
    id: "kb-003",
    title: "Apple Pay Fehler 1207",
    summary: "Quickfix Checklist und Eskalations Leitfaden fuer Zahlungsabbrueche.",
    tags: ["payment", "checkout"],
    lastUpdated: "2025-09-15T08:33:00.000Z",
    confidence: 0.79,
    views: 188,
    helpfulVotes: 150
  }
];
