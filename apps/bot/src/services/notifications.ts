/**
 * Notification Service
 * 
 * Handles push notifications for ticket status updates
 */

import { botApiClient } from '../clients/apiClient';
import { logger } from '../logger';
import type { Telegraf } from 'telegraf';
import type { NebulaContext } from '../types';

interface NotificationConfig {
  enabled: boolean;
  notifyOnStatusChange: boolean;
  notifyOnNewMessage: boolean;
  notifyOnAssignment: boolean;
}

const defaultConfig: NotificationConfig = {
  enabled: true,
  notifyOnStatusChange: true,
  notifyOnNewMessage: true,
  notifyOnAssignment: true
};

/**
 * Send notification to Telegram user about ticket update
 */
export async function notifyTicketUpdate(
  bot: Telegraf<NebulaContext> | null,
  telegramUserId: string,
  ticketId: string,
  type: 'status_changed' | 'new_message' | 'assigned',
  data: {
    status?: string;
    message?: string;
    assignedAgent?: string;
  }
): Promise<void> {
  if (!bot) {
    logger.warn('[Notifications] Bot instance not available');
    return;
  }
  if (!defaultConfig.enabled) {
    return;
  }

  try {
    let message = '';

    switch (type) {
      case 'status_changed':
        if (!defaultConfig.notifyOnStatusChange) return;
        const statusEmoji = {
          'open': '🟢',
          'in_progress': '🟡',
          'waiting': '🟠',
          'escalated': '🔴',
          'done': '✅'
        }[data.status || ''] || '📊';
        message = `${statusEmoji} *Ticket-Update*\n\n` +
          `Ticket \`${ticketId}\` Status geändert:\n` +
          `📊 Neuer Status: ${data.status}\n\n` +
          `Klicke hier, um das Ticket anzuzeigen.`;
        break;

      case 'new_message':
        if (!defaultConfig.notifyOnNewMessage) return;
        message = `💬 *Neue Nachricht*\n\n` +
          `Du hast eine neue Nachricht zu Ticket \`${ticketId}\` erhalten.\n\n` +
          `${data.message ? `"${data.message.slice(0, 100)}${data.message.length > 100 ? '...' : ''}"` : ''}\n\n` +
          `Klicke hier, um zu antworten.`;
        break;

      case 'assigned':
        if (!defaultConfig.notifyOnAssignment) return;
        message = `👤 *Ticket zugewiesen*\n\n` +
          `Ticket \`${ticketId}\` wurde ${data.assignedAgent ? `an ${data.assignedAgent}` : 'einem Agenten'} zugewiesen.\n\n` +
          `Du wirst über Updates informiert.`;
        break;
    }

    if (message) {
      await bot.telegram.sendMessage(parseInt(telegramUserId), message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📋 Ticket anzeigen',
              callback_data: `ticket_view_${ticketId}`
            }
          ]]
        }
      });

      logger.info('[Notifications] Notification sent', { telegramUserId, ticketId, type });
    }
  } catch (error) {
    logger.warn('[Notifications] Failed to send notification', { error, telegramUserId, ticketId });
  }
}

/**
 * Notify user about ticket creation
 */
export async function notifyTicketCreated(
  bot: Telegraf<NebulaContext> | null,
  telegramUserId: string,
  ticketId: string,
  subject: string
): Promise<void> {
  if (!bot) {
    logger.warn('[Notifications] Bot instance not available');
    return;
  }
  if (!defaultConfig.enabled) {
    return;
  }

  try {
    const message = `✅ *Ticket erstellt!*\n\n` +
      `Dein Ticket wurde erfolgreich erstellt:\n\n` +
      `🎫 Ticket-ID: \`${ticketId}\`\n` +
      `📁 Betreff: ${subject}\n\n` +
      `Unser Support-Team wird sich schnellstmöglich melden.`;

    await bot.telegram.sendMessage(parseInt(telegramUserId), message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '📋 Ticket anzeigen',
            callback_data: `ticket_view_${ticketId}`
          }
        ]]
      }
    });
    logger.info('[Notifications] Ticket creation notification sent', { telegramUserId, ticketId, subject });
  } catch (error) {
    logger.warn('[Notifications] Failed to send creation notification', { 
      error: error instanceof Error ? error.message : String(error), 
      telegramUserId,
      ticketId
    });
  }
}

/**
 * Notify admin users about new ticket creation
 */
export async function notifyAdminTicketCreated(
  bot: Telegraf<NebulaContext> | null,
  ticket: {
    id: string;
    subject: string;
    summary?: string;
    priority: string;
    category: string;
    status: string;
    telegramUserId?: string;
    userId?: string;
    createdAt: string;
  },
  adminTelegramIds: (string | number)[]
): Promise<void> {
  if (!bot) {
    logger.warn('[Notifications] Bot instance not available for admin notification', {
      ticketId: ticket.id
    });
    return;
  }
  if (!defaultConfig.enabled) {
    logger.debug('[Notifications] Notifications disabled, skipping admin notification', {
      ticketId: ticket.id
    });
    return;
  }
  if (!adminTelegramIds || adminTelegramIds.length === 0) {
    logger.warn('[Notifications] No admin Telegram IDs configured', {
      ticketId: ticket.id
    });
    return;
  }

  // Validate ticket data
  if (!ticket.id || !ticket.subject) {
    logger.warn('[Notifications] Invalid ticket data for admin notification', {
      ticketId: ticket.id,
      hasSubject: !!ticket.subject
    });
    return;
  }

  // Priority emoji mapping
  const priorityEmoji = {
    'low': '🟢',
    'medium': '🟡',
    'high': '🟠',
    'critical': '🔴'
  }[ticket.priority] || '📋';

  // Category emoji mapping
  const categoryEmoji: Record<string, string> = {
    'order': '📦',
    'payment': '💳',
    'shipping': '🚚',
    'return': '↩️',
    'technical': '🔧',
    'other': '💬'
  };
  const categoryIcon = categoryEmoji[ticket.category] || '📋';

  // Helper function to escape Markdown special characters
  const escapeMarkdown = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    return String(text)
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  };

  // Helper function to convert Markdown to HTML (for fallback)
  const markdownToHtml = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    return String(text)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '\n');
  };

  // Build message with proper escaping
  const buildMessage = (useMarkdown: boolean = true): string => {
    const subject = ticket.subject || 'Neues Ticket';
    const summary = ticket.summary || '';
    const priority = ticket.priority || 'medium';
    const category = ticket.category || 'other';
    const source = ticket.telegramUserId ? 'Telegram' : 'Web-App';
    
    if (useMarkdown) {
      return `🔔 *Neues Ticket erstellt!*\n\n` +
        `${priorityEmoji} *Priorität:* ${priority.toUpperCase()}\n` +
        `${categoryIcon} *Kategorie:* ${category}\n` +
        `🎫 *Ticket-ID:* \`${ticket.id}\`\n` +
        `📁 *Betreff:* ${escapeMarkdown(subject)}\n` +
        `${summary ? `📝 *Beschreibung:* ${escapeMarkdown(summary.slice(0, 100))}${summary.length > 100 ? '...' : ''}\n` : ''}` +
        `${ticket.telegramUserId ? `👤 *User-ID:* \`${ticket.telegramUserId}\`\n` : ''}` +
        `📅 *Erstellt:* ${new Date(ticket.createdAt).toLocaleString('de-DE')}\n\n` +
        `_Ticket wurde über ${source} erstellt_`;
    } else {
      // HTML version
      return `🔔 <b>Neues Ticket erstellt!</b>\n\n` +
        `${priorityEmoji} <b>Priorität:</b> ${priority.toUpperCase()}\n` +
        `${categoryIcon} <b>Kategorie:</b> ${category}\n` +
        `🎫 <b>Ticket-ID:</b> <code>${ticket.id}</code>\n` +
        `📁 <b>Betreff:</b> ${subject.replace(/[<>&]/g, (c) => {
          if (c === '<') return '&lt;';
          if (c === '>') return '&gt;';
          if (c === '&') return '&amp;';
          return c;
        })}\n` +
        `${summary ? `📝 <b>Beschreibung:</b> ${summary.slice(0, 100).replace(/[<>&]/g, (c) => {
          if (c === '<') return '&lt;';
          if (c === '>') return '&gt;';
          if (c === '&') return '&amp;';
          return c;
        })}${summary.length > 100 ? '...' : ''}\n` : ''}` +
        `${ticket.telegramUserId ? `👤 <b>User-ID:</b> <code>${ticket.telegramUserId}</code>\n` : ''}` +
        `📅 <b>Erstellt:</b> ${new Date(ticket.createdAt).toLocaleString('de-DE')}\n\n` +
        `<i>Ticket wurde über ${source} erstellt</i>`;
    }
  };

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '📋 Ticket öffnen',
          url: `${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5273'}?view=tickets&ticket=${ticket.id}`
        }
      ],
      [
        {
          text: '✅ Als erledigt markieren',
          callback_data: `admin_ticket_done_${ticket.id}`
        },
        {
          text: '🔄 Status ändern',
          callback_data: `admin_ticket_status_${ticket.id}`
        }
      ]
    ]
  };

  // Send notification to all admin users with Markdown fallback to HTML
  const notificationPromises = adminTelegramIds.map(async (adminId) => {
    try {
      const adminIdNum = typeof adminId === 'string' ? parseInt(adminId) : adminId;
      if (isNaN(adminIdNum) || adminIdNum <= 0) {
        logger.warn('[Notifications] Invalid admin Telegram ID', { 
          adminId,
          adminIdNum,
          ticketId: ticket.id
        });
        return;
      }

      // Try Markdown first
      let message = buildMessage(true);
      let parseMode: 'Markdown' | 'HTML' = 'Markdown';
      
      try {
        await bot.telegram.sendMessage(adminIdNum, message, {
          parse_mode: parseMode,
          reply_markup: inlineKeyboard
        });
        
        logger.info('[Notifications] Admin ticket creation notification sent (Markdown)', { 
          adminId: adminIdNum, 
          ticketId: ticket.id 
        });
      } catch (markdownError: any) {
        // If Markdown fails, try HTML fallback
        const errorMessage = markdownError?.response?.description || markdownError?.message || String(markdownError);
        
        if (errorMessage.includes('parse') || errorMessage.includes('Markdown') || errorMessage.includes('format')) {
          logger.debug('[Notifications] Markdown parsing failed, trying HTML fallback', {
            adminId: adminIdNum,
            ticketId: ticket.id,
            error: errorMessage
          });
          
          message = buildMessage(false);
          parseMode = 'HTML';
          
          await bot.telegram.sendMessage(adminIdNum, message, {
            parse_mode: 'HTML',
            reply_markup: inlineKeyboard
          });
          
          logger.info('[Notifications] Admin ticket creation notification sent (HTML fallback)', { 
            adminId: adminIdNum, 
            ticketId: ticket.id 
          });
        } else {
          // Re-throw if it's not a parsing error
          throw markdownError;
        }
      }
    } catch (error) {
      logger.error('[Notifications] Failed to send admin notification', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        adminId,
        ticketId: ticket.id
      });
    }
  });

  // Wait for all notifications to complete (don't fail if some fail)
  await Promise.allSettled(notificationPromises);
}

