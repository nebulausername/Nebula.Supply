/**
 * Auto Response Service
 * 
 * Provides automatic responses and ticket routing based on
 * ticket content, category, and user status.
 */

import { botApiClient } from '../clients/apiClient';
import { logger } from '../logger';

interface AutoResponseConfig {
  enabled: boolean;
  responseDelay: number; // Delay in milliseconds before sending auto-response
  templates: Record<string, string>;
}

const defaultConfig: AutoResponseConfig = {
  enabled: true,
  responseDelay: 2000, // 2 seconds
  templates: {
    order: `Vielen Dank für deine Anfrage zu deiner Bestellung! 🛒\n\nUnser Team prüft deine Anfrage und wird sich schnellstmöglich bei dir melden.\n\nFalls du dringende Fragen hast, kannst du jederzeit weitere Nachrichten hinzufügen.`,
    payment: `Vielen Dank für deine Zahlungsanfrage! 💳\n\nWir prüfen deine Anfrage und melden uns innerhalb von 24 Stunden bei dir.\n\nBei dringenden Zahlungsproblemen kannst du uns auch direkt kontaktieren.`,
    shipping: `Vielen Dank für deine Versandanfrage! 📦\n\nWir prüfen den Status deiner Sendung und melden uns schnellstmöglich bei dir.\n\nDu kannst deine Tracking-Nummer auch in deinem Account einsehen.`,
    return: `Vielen Dank für deine Rückgabeanfrage! 🔄\n\nWir bearbeiten deine Anfrage und melden uns innerhalb von 48 Stunden bei dir.\n\nBitte halte deine Bestellnummer bereit.`,
    technical: `Vielen Dank für deine technische Anfrage! 🐛\n\nUnser technisches Team prüft dein Problem und wird sich schnellstmöglich bei dir melden.\n\nFalls möglich, füge bitte Screenshots hinzu.`,
    other: `Vielen Dank für deine Anfrage! 💬\n\nUnser Support-Team hat deine Nachricht erhalten und wird sich schnellstmöglich bei dir melden.\n\nWir bearbeiten alle Anfragen in der Reihenfolge des Eingangs.`
  }
};

/**
 * Generate automatic response based on ticket category
 */
export async function generateAutoResponse(
  ticketId: string,
  category: string,
  userId: string
): Promise<void> {
  if (!defaultConfig.enabled) {
    return;
  }

  try {
    // Get appropriate template
    const templateKey = category.toLowerCase().replace(/\s+/g, '_');
    const template = defaultConfig.templates[templateKey] || defaultConfig.templates.other;

    // Wait for configured delay
    await new Promise(resolve => setTimeout(resolve, defaultConfig.responseDelay));

    // Send auto-response
    await botApiClient.addTicketMessage(ticketId, {
      from: 'system',
      user_id: 'system',
      message: template
    });

    // Update ticket status to in_progress
    await botApiClient.updateTicket(ticketId, {
      status: 'in_progress'
    });

    logger.info('[AutoResponse] Auto-response sent', { ticketId, category, userId });
  } catch (error) {
    logger.error('[AutoResponse] Error sending auto-response', { 
      error: error instanceof Error ? error.message : String(error), 
      ticketId, 
      category,
      userId 
    });
    // Don't throw - auto-response failure shouldn't block ticket creation
  }
}

/**
 * Route ticket to appropriate agent based on category
 */
export async function routeTicket(
  ticketId: string,
  category: string,
  priority: 'low' | 'medium' | 'high' | 'critical'
): Promise<string | null> {
  try {
    // Simple routing logic - in production, use more sophisticated assignment
    const categoryRouting: Record<string, string> = {
      order: 'Support-Team',
      payment: 'Finance-Team',
      shipping: 'Logistics-Team',
      return: 'Support-Team',
      technical: 'Tech-Team',
      other: 'Support-Team'
    };

    const assignedAgent = categoryRouting[category.toLowerCase().replace(/\s+/g, '_')] || 'Support-Team';

    // Update ticket with assignment
    await botApiClient.updateTicket(ticketId, {
      assignedAgent
    });

    logger.info('[AutoResponse] Ticket routed', { ticketId, category, assignedAgent, priority });
    return assignedAgent;
  } catch (error) {
    logger.error('[AutoResponse] Error routing ticket', { 
      error: error instanceof Error ? error.message : String(error), 
      ticketId,
      category,
      priority
    });
    return null;
  }
}

/**
 * Determine priority based on keywords in message
 */
export function determinePriority(
  message: string,
  category: string
): 'low' | 'medium' | 'high' | 'critical' {
  const messageLower = message.toLowerCase();

  // Critical keywords
  const criticalKeywords = ['kritisch', 'dringend', 'sofort', 'notfall', 'broken', 'down'];
  if (criticalKeywords.some(keyword => messageLower.includes(keyword))) {
    return 'critical';
  }

  // High priority keywords
  const highKeywords = ['wichtig', 'schnell', 'urgent', 'problem', 'fehler'];
  if (highKeywords.some(keyword => messageLower.includes(keyword))) {
    return 'high';
  }

  // Category-based priority
  if (category.toLowerCase().includes('payment') || category.toLowerCase().includes('zahlung')) {
    return 'high';
  }

  return 'medium';
}

