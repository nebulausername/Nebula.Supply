import { io, Socket } from 'socket.io-client';
import type { NebulaContext } from '../types';
import { logger } from '../logger';
import { notifyTicketUpdate, notifyTicketCreated } from '../services/notifications';

export type BotRealtimeEvents =
  | 'drop:created'
  | 'drop:updated'
  | 'drop:stock_changed'
  | 'drop:status_changed'
  | 'product:trending'
  | 'product:hyped'
  | 'event:starting_soon'
  | 'event:live'
  | 'ticket:created'
  | 'ticket:updated'
  | 'ticket:status_changed'
  | 'ticket:message_added';

let socket: Socket | null = null;
let botInstance: any = null;

export function connectRealtime(config: { baseUrl: string }, bot?: any): Socket {
  if (socket) return socket;
  socket = io(config.baseUrl, { transports: ['websocket'], reconnection: true });
  if (bot) botInstance = bot;
  
  socket.on('connect', () => {
    logger.info('Realtime connected');
    
    // Subscribe to ticket events for notifications
    socket?.emit('subscribe:tickets', {});
  });

  socket.on('disconnect', () => {
    logger.warn('Realtime disconnected');
  });

  // Handle ticket events for notifications
  socket.on('ticket:created', (data: any) => {
    try {
      logger.info('[BotRealtime] Received ticket:created event', {
        hasData: !!data,
        hasTicket: !!data?.ticket,
        ticketId: data?.ticketId || data?.ticket?.id || data?.id
      });

      // Validate event data structure
      if (!data) {
        logger.warn('[BotRealtime] Invalid ticket:created event data (no data)', { data });
        return;
      }

      const ticket = data?.ticket || data;
      
      // Validate ticket has required fields
      if (!ticket || !ticket.id) {
        logger.warn('[BotRealtime] Invalid ticket:created event data (missing ticket.id)', { data });
        return;
      }

      logger.debug('[BotRealtime] Processing ticket creation notification', {
        ticketId: ticket.id,
        hasTelegramUserId: !!ticket.telegramUserId,
        hasBotInstance: !!botInstance
      });
      
      // Notify user if ticket has telegramUserId
      if (ticket.telegramUserId && botInstance) {
        const telegramUserIdStr = String(ticket.telegramUserId);
        logger.info('[BotRealtime] Sending user notification for ticket creation', {
          ticketId: ticket.id,
          telegramUserId: telegramUserIdStr
        });
        
        notifyTicketCreated(
          botInstance,
          telegramUserIdStr,
          ticket.id,
          ticket.subject || ticket.summary || 'Neues Ticket'
        ).catch(err => {
          logger.error('[BotRealtime] Failed to send ticket creation notification to user', {
            error: err instanceof Error ? err.message : String(err),
            errorStack: err instanceof Error ? err.stack : undefined,
            ticketId: ticket.id,
            telegramUserId: telegramUserIdStr
          });
        });
      } else if (ticket.telegramUserId && !botInstance) {
        logger.warn('[BotRealtime] Cannot send user notification: bot instance not available', {
          ticketId: ticket.id,
          telegramUserId: ticket.telegramUserId
        });
      }
      
      // Notify admins about new ticket (always notify admins, regardless of channel)
      if (botInstance && ticket) {
        // Get admin IDs from environment or config
        const adminIdsEnv = process.env.ADMIN_TELEGRAM_IDS || '';
        const adminIds = adminIdsEnv 
          ? adminIdsEnv.split(',').map(id => id.trim()).filter(Boolean)
          : [];
        
        if (adminIds.length > 0) {
          logger.info('[BotRealtime] Sending admin notification for ticket creation', {
            ticketId: ticket.id,
            adminCount: adminIds.length
          });

          const { notifyAdminTicketCreated } = require('../services/notifications');
          notifyAdminTicketCreated(
            botInstance,
            {
              id: ticket.id,
              subject: ticket.subject || ticket.summary || 'Neues Ticket',
              summary: ticket.summary || '',
              priority: ticket.priority || 'medium',
              category: ticket.category || 'other',
              status: ticket.status || 'open',
              telegramUserId: ticket.telegramUserId,
              userId: ticket.userId,
              createdAt: ticket.createdAt || new Date().toISOString()
            },
            adminIds
          ).catch(err => {
            logger.error('[BotRealtime] Failed to send admin ticket creation notification', {
              error: err instanceof Error ? err.message : String(err),
              errorStack: err instanceof Error ? err.stack : undefined,
              ticketId: ticket.id,
              adminCount: adminIds.length
            });
          });
        } else {
          logger.debug('[BotRealtime] No admin Telegram IDs configured, skipping admin notification', {
            ticketId: ticket.id
          });
        }
      } else if (!botInstance) {
        logger.warn('[BotRealtime] Cannot send admin notification: bot instance not available', {
          ticketId: ticket.id
        });
      }
    } catch (error) {
      logger.error('[BotRealtime] Error handling ticket:created event', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        data
      });
    }
  });

  socket.on('ticket:status_changed', (data: any) => {
    const { ticketId, newStatus, ticket } = data || {};
    const telegramUserId = ticket?.telegramUserId || data?.telegramUserId;
    if (telegramUserId && botInstance && ticketId) {
      notifyTicketUpdate(
        botInstance,
        telegramUserId,
        ticketId,
        'status_changed',
        { status: newStatus }
      ).catch(err => {
        logger.warn('Failed to send ticket status notification', { error: err });
      });
    }
  });

  socket.on('ticket:message_added', (data: any) => {
    const { ticketId, message, ticket } = data || {};
    const telegramUserId = ticket?.telegramUserId || data?.telegramUserId;
    // Only notify if message is from agent/bot (not from user)
    if (telegramUserId && botInstance && ticketId && message?.from !== 'user') {
      notifyTicketUpdate(
        botInstance,
        telegramUserId,
        ticketId,
        'new_message',
        { message: message?.text || message?.message }
      ).catch(err => {
        logger.warn('Failed to send ticket message notification', { error: err });
      });
    }
  });

  return socket;
}

export function onEvent<T = any>(event: BotRealtimeEvents, handler: (data: T) => void) {
  socket?.on(event, handler);
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}

// Helper: send notification to user if they have enabled it
export async function sendNotificationToUser(telegramId: number, message: string, keyboard?: any) {
  if (!botInstance) return;
  try {
    await botInstance.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown', reply_markup: keyboard });
    logger.info('Notification sent', { telegramId, message: message.slice(0, 50) });
  } catch (e) {
    logger.warn('Failed to send notification', { telegramId, error: String(e) });
  }
}




