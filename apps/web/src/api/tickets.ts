import type { TicketData, Message, TicketPriority, TicketStatus } from "../components/support/types";
import { api } from "../lib/api/client";

type ApiTicketStatus = "open" | "waiting" | "in_progress" | "escalated" | "done";
type ApiTicketPriority = "low" | "medium" | "high" | "critical";

type ApiTicketMessage = {
  id: string;
  text: string;
  from: "user" | "agent" | "system";
  timestamp: string;
  senderName?: string;
  attachments?: Array<{
    id: string;
    url: string;
    name: string;
    type: string;
  }>;
};

type ApiTicket = {
  id: string;
  userId?: string;
  telegramUserId?: string;
  subject: string;
  summary: string;
  status: ApiTicketStatus;
  priority: ApiTicketPriority;
  category?: string;
  tags?: string[];
  channel?: string;
  createdAt: string;
  updatedAt: string;
  messages?: ApiTicketMessage[];
};

export type CreateTicketPayload = {
  subject: string;
  summary: string;
  priority?: TicketPriority;
  category: string;
  tags?: string[];
  telegramUserId?: string | number;
  userId?: string | number;
  sessionId?: string; // Session ID for anonymous users
  channel?: "web" | "telegram" | "api";
};

export type TicketReplyPayload = {
  message: string;
  from?: "user" | "agent";
  userId: string | number;
};

export type FetchTicketsOptions = {
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  assignedAgent?: string;
  limit?: number;
  offset?: number;
  telegramUserId?: string | number;
  userId?: string | number;
};

const normalizeStatus = (status?: string): TicketStatus => {
  if (!status) return "open";
  if (status === "done" || status === "waiting") return status;
  if (status === "in_progress") return "in_progress";
  return "open";
};

const normalizePriority = (priority?: string): TicketPriority => {
  if (!priority) return "medium";
  if (priority === "critical") return "critical";
  if (priority === "high") return "high";
  if (priority === "low") return "low";
  return "medium";
};

const mapMessage = (message: ApiTicketMessage): Message => ({
  id: message.id,
  text: message.text,
  from: message.from,
  timestamp: message.timestamp,
  senderName: message.senderName,
});

const mapTicket = (ticket: ApiTicket): TicketData => ({
  id: ticket.id,
  userId: ticket.userId || ticket.telegramUserId || "unknown",
  subject: ticket.subject,
  description: ticket.summary,
  status: normalizeStatus(ticket.status),
  priority: normalizePriority(ticket.priority),
  createdAt: ticket.createdAt,
  messages: (ticket.messages || []).map(mapMessage),
  category: ticket.category,
});

const buildQueryString = (options?: FetchTicketsOptions): string => {
  if (!options) return "";
  const params = new URLSearchParams();

  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }
  if (options.priority && options.priority !== "all") {
    params.set("priority", options.priority);
  }
  if (options.assignedAgent) {
    params.set("assignedAgent", options.assignedAgent);
  }
  if (typeof options.limit === "number") {
    params.set("limit", String(options.limit));
  }
  if (typeof options.offset === "number") {
    params.set("offset", String(options.offset));
  }
  if (options.userId) {
    params.set("userId", String(options.userId));
  }
  if (options.telegramUserId) {
    params.set("telegramUserId", String(options.telegramUserId));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Extract Telegram ID from user identifier
 */
const extractTelegramId = (userIdentifier?: string | number): string | number | null => {
  if (!userIdentifier) return null;
  
  // If it's already a number, return it
  if (typeof userIdentifier === 'number') return userIdentifier;
  
  // If it's in format "tg:123456", extract the number
  const tgMatch = String(userIdentifier).match(/^tg:(\d+)$/);
  if (tgMatch) {
    return tgMatch[1];
  }
  
  // Try to get from localStorage as fallback
  if (typeof window !== 'undefined') {
    const storedId = localStorage.getItem('telegram_id');
    if (storedId) {
      return storedId;
    }
  }
  
  // Return as-is if it's already a valid string/number
  return userIdentifier;
};

/**
 * Fetch tickets for the current user (filtered client-side as fallback)
 */
export const fetchUserTickets = async (options?: FetchTicketsOptions): Promise<TicketData[]> => {
  const userIdentifier = options?.userId ?? options?.telegramUserId;
  
  // If no user identifier provided, return empty array (guest/anonymous user)
  if (!userIdentifier) {
    console.log('[fetchUserTickets] No user identifier provided, returning empty array');
    return [];
  }

  const telegramId = extractTelegramId(userIdentifier as string | number);

  // Try user-specific endpoint first if telegramId exists
  // This endpoint returns tickets from both Telegram and Web sources
  if (telegramId) {
    try {
      const response = await api.get<{ success: boolean; data: ApiTicket[] }>(`/api/tickets/user/${encodeURIComponent(String(telegramId))}`);
      // Handle wrapped response format: { success: true, data: [...] }
      let tickets: ApiTicket[] = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          tickets = response.data;
        } else if (Array.isArray(response)) {
          tickets = response;
        } else if (response.data && Array.isArray(response.data)) {
          tickets = response.data;
        }
      }
      
      // Map and return tickets (includes both Telegram and Web tickets)
      return tickets.map(mapTicket);
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      const errorMessage = error?.message || String(error) || 'Unknown error';
      
      // Handle 401/403 as "not authenticated" - return empty array silently
      if (status === 401 || status === 403) {
        if (import.meta.env.DEV) {
          console.debug('[fetchUserTickets] User not authenticated, returning empty array', {
            telegramId,
            status
          });
        }
        return [];
      }
      
      // Handle 404 as "no tickets" - return empty array immediately
      if (status === 404) {
        return [];
      }
      
      // For other errors, try fallback query-based approach
      // Only log in dev mode and not for auth errors
      if (import.meta.env.DEV && status !== 401 && status !== 403) {
        if (!errorMessage.toLowerCase().includes('404') && !errorMessage.toLowerCase().includes('not found')) {
          console.warn('[fetchUserTickets] User endpoint failed, trying fallback query', {
            telegramId,
            error: errorMessage,
            status
          });
        }
      }
      
      // Check if it's a 404 by message content (for cases where status might not be set)
      const errorMessageLower = errorMessage.toLowerCase();
      if (errorMessageLower.includes('404') || errorMessageLower.includes('not found')) {
        return [];
      }
      
      // For 401/403, don't try fallback - just return empty
      if (errorMessageLower.includes('401') || errorMessageLower.includes('403') || 
          errorMessageLower.includes('unauthorized') || errorMessageLower.includes('authentifizierung')) {
        return [];
      }
    }
  }

  // Fallback: query-based approach (only if user endpoint failed or no telegramId)
  try {
    const query = buildQueryString(options);
    const response = await api.get<{ success: boolean; data: ApiTicket[] }>(`/api/tickets${query}`);
    
    // Handle wrapped response format
    let tickets: ApiTicket[] = [];
    if (response && typeof response === 'object') {
      if (Array.isArray(response.data)) {
        tickets = response.data;
      } else if (Array.isArray(response)) {
        tickets = response;
      } else if (response.data && Array.isArray(response.data)) {
        tickets = response.data;
      }
    }
    
    return tickets.map(mapTicket);
  } catch (error: any) {
    const status = error?.status || error?.response?.status;
    const errorMessage = String(error?.message || error || '').toLowerCase();
    
    // Handle 401/403 as "not authenticated" - return empty array silently
    if (status === 401 || status === 403 || 
        errorMessage.includes('401') || errorMessage.includes('403') ||
        errorMessage.includes('unauthorized') || errorMessage.includes('authentifizierung')) {
      if (import.meta.env.DEV) {
        console.debug('[fetchUserTickets] Query-based fetch: User not authenticated', { status });
      }
      return [];
    }
    
    // Handle 404 as "no tickets"
    if (status === 404 || errorMessage.includes('404') || errorMessage.includes('not found')) {
      return [];
    }
    
    // Log other errors in dev mode (but not auth errors)
    if (import.meta.env.DEV && status !== 401 && status !== 403) {
      console.error('[fetchUserTickets] Query-based fetch failed:', {
        status,
        error: error?.message || String(error)
      });
    }
    
    // Return empty array for graceful degradation
    return [];
  }
};

/**
 * Fetch single ticket with detail messages
 */
export const fetchTicket = async (ticketId: string): Promise<TicketData | null> => {
  if (!ticketId) return null;
  const response = await api.get<ApiTicket>(`/api/tickets/${ticketId}`);
  if (!response.data) {
    return null;
  }
  return mapTicket(response.data);
};

/**
 * Create a new ticket for logged-in user
 */
export const createTicket = async (payload: CreateTicketPayload): Promise<TicketData> => {
  // Extract telegram ID from userId if it's in format "tg:123456"
  const telegramUserId = payload.telegramUserId ?? extractTelegramId(payload.userId as string | number);
  
  // Ensure we have a userId or sessionId for anonymous users
  const userId = payload.userId || (typeof window !== 'undefined' 
    ? localStorage.getItem('nebula_support_session') 
    : null);
  
  // Extract sessionId if userId is a session ID (starts with "anon_")
  const sessionId = userId && String(userId).startsWith('anon_') ? userId : undefined;
  const finalUserId = sessionId ? undefined : userId;
  
  try {
    const response = await api.post<ApiTicket>("/api/tickets", {
      subject: payload.subject,
      summary: payload.summary,
      priority: payload.priority || "medium",
      category: payload.category,
      tags: payload.tags || [],
      telegramUserId: telegramUserId ? String(telegramUserId) : undefined,
      userId: finalUserId,
      sessionId: sessionId, // Send sessionId for anonymous users
      channel: payload.channel || "web",
    });

    // API returns { success: true, data: ticket }
    // The api.post already returns ApiResponse<T> which is { success: boolean, data: T }
    // So response.data is the ticket object directly
    const ticketData = response.data;
    
    if (!ticketData) {
      const errorMessage = response.message || "Ticket creation failed - keine Daten erhalten";
      if (import.meta.env.DEV) {
        console.error('[createTicket] No ticket data in response:', { response, payload });
      }
      throw new Error(errorMessage);
    }

    // Validate that we got a ticket object with required fields
    if (!ticketData.id || !ticketData.subject) {
      if (import.meta.env.DEV) {
        console.error('[createTicket] Invalid ticket data structure:', ticketData);
      }
      throw new Error("Ungültige Ticket-Daten erhalten");
    }

    return mapTicket(ticketData);
  } catch (error: any) {
    // Enhanced error handling - extract detailed error messages
    // Check for validation errors with details array
    if (error?.data?.details && Array.isArray(error.data.details)) {
      const validationErrors = error.data.details
        .map((detail: any) => {
          if (typeof detail === 'string') return detail;
          return `${detail.field || 'field'}: ${detail.message || detail.msg || 'invalid'}`;
        })
        .join(', ');
      throw new Error(`Validierungsfehler: ${validationErrors}`);
    }
    
    // Check for error message in data.error (from errorHandler)
    if (error?.data?.error) {
      throw new Error(error.data.error);
    }
    
    // Check for error message in data.message
    if (error?.data?.message) {
      throw new Error(error.data.message);
    }
    
    // Check for direct message property
    if (error?.message) {
      throw error;
    }
    
    // Fallback to statusText or generic error
    const errorMessage = error?.statusText || error?.status 
      ? `Fehler ${error.status}: ${error.statusText || 'Unbekannter Fehler'}`
      : "Unbekannter Fehler beim Erstellen des Tickets";
    
    throw new Error(errorMessage);
  }
};

/**
 * Append reply to a ticket (VIP replies or standard web replies)
 */
export const addTicketReply = async (
  ticketId: string,
  payload: TicketReplyPayload
): Promise<TicketData> => {
  // Extract telegram ID from userId if it's in format "tg:123456"
  const telegramUserId = extractTelegramId(payload.userId as string | number);
  const userIdForApi = telegramUserId ? String(telegramUserId) : String(payload.userId);
  
  const response = await api.post<{ message: ApiTicketMessage; ticket: ApiTicket }>(`/api/tickets/${ticketId}/replies`, {
    from: payload.from || "user",
    user_id: userIdForApi,
    message: payload.message,
  });

  // API returns { success: true, data: { message, ticket } }
  const responseData = response.data as { message?: ApiTicketMessage; ticket?: ApiTicket };
  const updatedTicket = responseData?.ticket;
  
  if (!updatedTicket) {
    throw new Error("Ticket reply failed: No ticket data in response");
  }

  return mapTicket(updatedTicket);
};

export const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<TicketData> => {
  const response = await api.post<ApiTicket>(`/api/tickets/${ticketId}/status`, {
    status,
  });

  if (!response.data) {
    throw new Error('Ticket status update failed');
  }

  return mapTicket(response.data);
};

/**
 * Generate shareable link for ticket
 */
export const generateTicketShareLink = async (ticketId: string): Promise<{ shareLink: string; shareToken: string; expiresAt: string }> => {
  const response = await api.post<{ shareLink: string; shareToken: string; expiresAt: string }>(`/api/tickets/${ticketId}/share`);
  
  if (!response.data) {
    throw new Error('Failed to generate share link');
  }

  return response.data;
};


