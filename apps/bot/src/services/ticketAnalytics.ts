/**
 * Ticket Analytics Service
 * 
 * Tracks and analyzes ticket metrics for reporting and optimization
 */

import { botApiClient } from '../clients/apiClient';
import { logger } from '../logger';

interface TicketMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResponseTime: number; // in minutes
  averageResolutionTime: number; // in minutes
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  ticketsByStatus: Record<string, number>;
}

/**
 * Track ticket creation event
 */
export async function trackTicketCreated(
  ticketId: string,
  userId: string,
  category: string,
  priority: string,
  channel: 'telegram' | 'web' = 'telegram'
): Promise<void> {
  try {
    await botApiClient.sendAnalyticsEvent({
      user_id: userId,
      event_type: 'ticket_created',
      event_data: {
        ticketId,
        category,
        priority,
        channel,
        timestamp: new Date().toISOString()
      }
    });
    logger.debug('[TicketAnalytics] Ticket creation tracked', { ticketId, userId, category, priority, channel });
  } catch (error) {
    logger.warn('[TicketAnalytics] Failed to track ticket creation', { 
      error: error instanceof Error ? error.message : String(error), 
      ticketId,
      userId,
      category
    });
  }
}

/**
 * Track ticket message event
 */
export async function trackTicketMessage(
  ticketId: string,
  userId: string,
  from: 'user' | 'agent' | 'bot' | 'system',
  messageLength: number
): Promise<void> {
  try {
    await botApiClient.sendAnalyticsEvent({
      user_id: userId,
      event_type: 'ticket_message',
      event_data: {
        ticketId,
        from,
        messageLength,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.warn('[TicketAnalytics] Failed to track ticket message', { 
      error: error instanceof Error ? error.message : String(error), 
      ticketId,
      userId,
      from
    });
  }
}

/**
 * Track ticket status change
 */
export async function trackTicketStatusChange(
  ticketId: string,
  oldStatus: string,
  newStatus: string,
  userId?: string
): Promise<void> {
  try {
    await botApiClient.sendAnalyticsEvent({
      user_id: userId || 'system',
      event_type: 'ticket_status_changed',
      event_data: {
        ticketId,
        oldStatus,
        newStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.warn('[TicketAnalytics] Failed to track status change', { 
      error: error instanceof Error ? error.message : String(error), 
      ticketId,
      oldStatus,
      newStatus,
      userId
    });
  }
}

/**
 * Get ticket metrics (aggregated statistics)
 */
export async function getTicketMetrics(): Promise<TicketMetrics> {
  try {
    // In production, this would fetch from analytics database
    // For now, return basic structure
    return {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      averageResponseTime: 0,
      averageResolutionTime: 0,
      ticketsByCategory: {},
      ticketsByPriority: {},
      ticketsByStatus: {}
    };
  } catch (error) {
    logger.error('[TicketAnalytics] Failed to get metrics', { error });
    throw error;
  }
}

