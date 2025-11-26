import { logger } from '../utils/logger';

interface CashVerificationData {
  id: string;
  userId: string;
  orderId: string;
  handSign: string;
  handSignEmoji: string;
  photoUrl: string;
  createdAt: string;
}

interface TicketNotificationData {
  id: string;
  subject: string;
  summary?: string;
  priority: string;
  category: string;
  status: string;
  telegramUserId?: string;
  userId?: string;
  createdAt: string;
}

class TelegramNotificationService {
  private botToken: string;
  private adminChatId: string;
  private adminTelegramIds: string[];
  private enabled: boolean;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
    const adminIdsEnv = process.env.ADMIN_TELEGRAM_IDS || '';
    this.adminTelegramIds = adminIdsEnv 
      ? adminIdsEnv.split(',').map(id => id.trim()).filter(Boolean)
      : [];
    this.enabled = process.env.ADMIN_NOTIFICATION_ENABLED !== 'false';

    if (!this.botToken) {
      logger.warn('Telegram notification service not configured properly (missing TELEGRAM_BOT_TOKEN)');
      this.enabled = false;
    }
  }

  async sendCashVerificationAlert(verification: CashVerificationData): Promise<void> {
    if (!this.enabled) {
      logger.info('Telegram notifications disabled, skipping', { verificationId: verification.id });
      return;
    }

    try {
      const message = this.formatVerificationMessage(verification);
      const inlineKeyboard = this.createInlineKeyboard(verification.id);

      // Send message with photo
      const telegramApiUrl = `https://api.telegram.org/bot${this.botToken}/sendPhoto`;
      
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.adminChatId,
          photo: verification.photoUrl,
          caption: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: inlineKeyboard
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
      }

      logger.info('Telegram notification sent successfully', {
        verificationId: verification.id,
        adminChatId: this.adminChatId
      });

    } catch (error) {
      logger.error('Failed to send Telegram notification', {
        error,
        verificationId: verification.id
      });
      // Don't throw - notifications should not break the main flow
    }
  }

  private formatVerificationMessage(verification: CashVerificationData): string {
    return `
🚨 <b>Neue Barzahlung Verifikation</b>

${verification.handSignEmoji} <b>Handzeichen:</b> ${verification.handSign}

👤 <b>User ID:</b> <code>${verification.userId}</code>
📦 <b>Order ID:</b> <code>${verification.orderId}</code>
🆔 <b>Verifikations-ID:</b> <code>${verification.id}</code>

⏰ <b>Hochgeladen:</b> ${new Date(verification.createdAt).toLocaleString('de-DE')}

Bitte prüfe das Selfie und bestätige, dass das Handzeichen korrekt ist.
    `.trim();
  }

  private createInlineKeyboard(verificationId: string): any[][] {
    return [
      [
        {
          text: '✅ Genehmigen',
          callback_data: `approve_cash_${verificationId}`
        },
        {
          text: '❌ Ablehnen',
          callback_data: `reject_cash_${verificationId}`
        }
      ],
      [
        {
          text: '👁️ Im Dashboard öffnen',
          url: `${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5174'}/dashboard?view=bot`
        }
      ]
    ];
  }

  async handleCallbackQuery(callbackQuery: any): Promise<void> {
    const callbackData = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    try {
      if (callbackData.startsWith('approve_cash_')) {
        const verificationId = callbackData.replace('approve_cash_', '');
        await this.processApproval(verificationId, chatId, messageId);
      } else if (callbackData.startsWith('reject_cash_')) {
        const verificationId = callbackData.replace('reject_cash_', '');
        await this.processRejection(verificationId, chatId, messageId);
      }
    } catch (error) {
      logger.error('Failed to handle callback query', { error, callbackData });
    }
  }

  private async processApproval(verificationId: string, chatId: string, messageId: number): Promise<void> {
    // TODO: Call API to approve verification
    // await fetch(`${apiUrl}/api/bot/cash-verifications/${verificationId}/status`, {
    //   method: 'PATCH',
    //   body: JSON.stringify({ status: 'approved', admin_notes: 'Approved via Telegram' })
    // });

    logger.info('Cash verification approved via Telegram', { verificationId });

    // Update message
    await this.updateMessage(chatId, messageId, '✅ Verifikation genehmigt!');
  }

  private async processRejection(verificationId: string, chatId: string, messageId: number): Promise<void> {
    // TODO: Call API to reject verification
    // await fetch(`${apiUrl}/api/bot/cash-verifications/${verificationId}/status`, {
    //   method: 'PATCH',
    //   body: JSON.stringify({ status: 'rejected', admin_notes: 'Rejected via Telegram' })
    // });

    logger.info('Cash verification rejected via Telegram', { verificationId });

    // Update message
    await this.updateMessage(chatId, messageId, '❌ Verifikation abgelehnt!');
  }

  private async updateMessage(chatId: string, messageId: number, text: string): Promise<void> {
    const telegramApiUrl = `https://api.telegram.org/bot${this.botToken}/editMessageCaption`;
    
    await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        caption: text,
        parse_mode: 'HTML'
      })
    });
  }

  /**
   * Send ticket creation notification to all admin users
   */
  async sendTicketCreatedNotification(ticket: TicketNotificationData): Promise<void> {
    if (!this.enabled) {
      logger.debug('Telegram notifications disabled, skipping ticket notification', { ticketId: ticket.id });
      return;
    }

    if (!this.botToken) {
      logger.warn('Cannot send ticket notification: TELEGRAM_BOT_TOKEN not configured');
      return;
    }

    // Get admin IDs - prefer ADMIN_TELEGRAM_IDS, fallback to ADMIN_CHAT_ID
    const adminIds = this.adminTelegramIds.length > 0 
      ? this.adminTelegramIds 
      : (this.adminChatId ? [this.adminChatId] : []);

    if (adminIds.length === 0) {
      logger.warn('[TelegramNotification] No admin Telegram IDs configured, skipping ticket notification', {
        ticketId: ticket.id,
        hasAdminTelegramIds: this.adminTelegramIds.length > 0,
        hasAdminChatId: !!this.adminChatId
      });
      return;
    }

    // Log notification attempt
    logger.info('[TelegramNotification] Sending ticket creation notification', {
      ticketId: ticket.id,
      adminCount: adminIds.length,
      priority: ticket.priority,
      category: ticket.category,
      source: ticket.telegramUserId ? 'telegram' : 'web'
    });

    // Priority emoji mapping
    const priorityEmoji: Record<string, string> = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🟠',
      'critical': '🔴'
    };

    // Category emoji mapping (case-insensitive)
    const categoryEmoji: Record<string, string> = {
      'order': '📦',
      'bestellung': '📦',
      'payment': '💳',
      'zahlung': '💳',
      'shipping': '🚚',
      'versand': '🚚',
      'return': '↩️',
      'rückgabe': '↩️',
      'technical': '🔧',
      'technisch': '🔧',
      'other': '💬',
      'sonstiges': '💬'
    };

    const priorityIcon = priorityEmoji[ticket.priority.toLowerCase()] || '📋';
    const categoryKey = ticket.category.toLowerCase().trim();
    const categoryIcon = categoryEmoji[categoryKey] || '📋';

    const message = `🔔 *Neues Ticket erstellt!*\n\n` +
      `${priorityIcon} *Priorität:* ${ticket.priority.toUpperCase()}\n` +
      `${categoryIcon} *Kategorie:* ${ticket.category}\n` +
      `🎫 *Ticket-ID:* \`${ticket.id}\`\n` +
      `📁 *Betreff:* ${ticket.subject}\n` +
      `${ticket.summary ? `📝 *Beschreibung:* ${ticket.summary.slice(0, 100)}${ticket.summary.length > 100 ? '...' : ''}\n` : ''}` +
      `${ticket.telegramUserId ? `👤 *Telegram User-ID:* \`${ticket.telegramUserId}\`\n` : ''}` +
      `${ticket.userId && ticket.userId !== ticket.telegramUserId ? `👤 *User-ID:* \`${ticket.userId}\`\n` : ''}` +
      `📅 *Erstellt:* ${new Date(ticket.createdAt).toLocaleString('de-DE')}\n\n` +
      `_Ticket wurde über ${ticket.telegramUserId ? 'Telegram' : 'Web-App'} erstellt_`;

    const adminDashboardUrl = process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5273';
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: '📋 Ticket öffnen',
            url: `${adminDashboardUrl}?view=tickets&ticket=${ticket.id}`
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

    // Helper function to escape Markdown special characters (more robust)
    const escapeMarkdown = (text: string): string => {
      if (!text || typeof text !== 'string') return '';
      // Escape special Markdown characters
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

    // Escape user input in message (but keep emojis and formatting)
    let escapedMessage: string;
    try {
      escapedMessage = message
        .replace(/\*([^*]+)\*/g, (match, content) => `*${escapeMarkdown(content)}*`)
        .replace(/`([^`]+)`/g, (match, content) => `\`${escapeMarkdown(content)}\``);
    } catch (error) {
      logger.warn('[TelegramNotification] Failed to escape Markdown, using original message', {
        error: error instanceof Error ? error.message : String(error),
        ticketId: ticket.id
      });
      escapedMessage = message;
    }

    // Send notification to all admin users with retry logic and HTML fallback
    const sendWithRetry = async (adminId: string | number, retries = 3): Promise<void> => {
      const adminIdNum = typeof adminId === 'string' ? parseInt(adminId) : adminId;
      if (isNaN(adminIdNum)) {
        logger.warn('[TelegramNotification] Invalid admin Telegram ID', { adminId });
        return;
      }

      // Validate admin ID is positive number
      if (adminIdNum <= 0) {
        logger.warn('[TelegramNotification] Invalid admin Telegram ID (must be positive)', { adminId, adminIdNum });
        return;
      }

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const telegramApiUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          // Try Markdown first
          let parseMode: 'Markdown' | 'HTML' = 'Markdown';
          let messageText = escapedMessage;
          
          const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: adminIdNum,
              text: messageText,
              parse_mode: parseMode,
              reply_markup: inlineKeyboard
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const errorDescription = errorData?.description || errorData?.error || 'Unknown error';
            
            // If Markdown parsing failed, try HTML fallback
            if (errorDescription.includes('parse') || errorDescription.includes('Markdown') || errorDescription.includes('format')) {
              if (attempt === 1) {
                logger.debug('[TelegramNotification] Markdown parsing failed, trying HTML fallback', {
                  adminId: adminIdNum,
                  ticketId: ticket.id,
                  error: errorDescription
                });
                
                // Convert to HTML and retry immediately
                parseMode = 'HTML';
                messageText = markdownToHtml(message);
                
                const htmlResponse = await fetch(telegramApiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    chat_id: adminIdNum,
                    text: messageText,
                    parse_mode: 'HTML',
                    reply_markup: inlineKeyboard
                  }),
                  signal: controller.signal
                });

                if (htmlResponse.ok) {
                  logger.info('[TelegramNotification] Admin ticket creation notification sent (HTML fallback)', {
                    adminId: adminIdNum,
                    ticketId: ticket.id,
                    attempt
                  });
                  return; // Success with HTML
                }
              }
            }
            
            throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
          }

          logger.info('[TelegramNotification] Admin ticket creation notification sent', {
            adminId: adminIdNum,
            ticketId: ticket.id,
            attempt,
            parseMode
          });
          return; // Success, exit retry loop
        } catch (error) {
          const isTimeout = error instanceof Error && error.name === 'AbortError';
          const isLastAttempt = attempt === retries;
          
          if (isLastAttempt) {
            logger.error('[TelegramNotification] Failed to send admin notification after retries', {
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined,
              adminId: adminIdNum,
              ticketId: ticket.id,
              attempts: retries,
              isTimeout
            });
            return; // Give up after all retries
          }

          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          logger.debug('[TelegramNotification] Retrying notification', {
            adminId: adminIdNum,
            attempt,
            retries,
            delay,
            isTimeout,
            error: error instanceof Error ? error.message : String(error)
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    const notificationPromises = adminIds.map(adminId => sendWithRetry(adminId));

    // Wait for all notifications to complete (don't fail if some fail)
    await Promise.allSettled(notificationPromises);
  }

  /**
   * Send ticket message notification to user when agent replies
   */
  async sendTicketMessageNotification(
    ticket: {
      id: string;
      subject: string;
      telegramUserId?: string;
      userId?: string;
    },
    message: {
      text: string;
      senderName?: string;
      timestamp: string;
    }
  ): Promise<void> {
    if (!this.enabled) {
      logger.debug('Telegram notifications disabled, skipping ticket message notification', { ticketId: ticket.id });
      return;
    }

    if (!this.botToken) {
      logger.warn('Cannot send ticket message notification: TELEGRAM_BOT_TOKEN not configured');
      return;
    }

    // Get user Telegram ID - prefer telegramUserId, fallback to userId
    const userTelegramId = ticket.telegramUserId || ticket.userId;
    
    if (!userTelegramId) {
      logger.debug('[TelegramNotification] No Telegram user ID for ticket, skipping notification', {
        ticketId: ticket.id,
        hasTelegramUserId: !!ticket.telegramUserId,
        hasUserId: !!ticket.userId
      });
      return;
    }

    const userIdNum = typeof userTelegramId === 'string' ? parseInt(userTelegramId) : userTelegramId;
    if (isNaN(userIdNum) || userIdNum <= 0) {
      logger.warn('[TelegramNotification] Invalid user Telegram ID', { userTelegramId, ticketId: ticket.id });
      return;
    }

    logger.info('[TelegramNotification] Sending ticket message notification', {
      ticketId: ticket.id,
      userId: userIdNum,
      messageLength: message.text.length
    });

    // Format message
    const messagePreview = message.text.length > 150 
      ? message.text.slice(0, 150) + '...' 
      : message.text;

    const notificationMessage = `💬 *Neue Nachricht zu deinem Ticket*\n\n` +
      `🎫 *Ticket:* \`${ticket.id}\`\n` +
      `📁 *Betreff:* ${this.escapeMarkdown(ticket.subject)}\n\n` +
      `💬 *Nachricht:*\n${this.escapeMarkdown(messagePreview)}\n\n` +
      `👤 *Von:* ${message.senderName ? this.escapeMarkdown(message.senderName) : 'Support Team'}\n` +
      `⏰ *Zeit:* ${new Date(message.timestamp).toLocaleString('de-DE')}\n\n` +
      `_Antworte direkt hier oder öffne das Ticket in der App._`;

    // Create inline keyboard with quick actions
    const webAppUrl = process.env.WEB_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: '📋 Ticket öffnen',
            url: `${webAppUrl}/profile?tab=tickets&ticket=${ticket.id}`
          }
        ],
        [
          {
            text: '💬 Antworten',
            callback_data: `ticket_reply_${ticket.id}`
          },
          {
            text: '📋 Alle Tickets',
            callback_data: 'support_list'
          }
        ]
      ]
    };

    // Send notification with retry logic
    const sendWithRetry = async (retries = 3): Promise<void> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const telegramApiUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          // Try Markdown first
          let parseMode: 'Markdown' | 'HTML' = 'Markdown';
          let messageText = notificationMessage;
          
          const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: userIdNum,
              text: messageText,
              parse_mode: parseMode,
              reply_markup: inlineKeyboard
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const errorDescription = errorData?.description || errorData?.error || 'Unknown error';
            
            // If user blocked the bot or chat doesn't exist, don't retry
            if (errorDescription.includes('blocked') || 
                errorDescription.includes('chat not found') ||
                errorDescription.includes('user is deactivated')) {
              logger.warn('[TelegramNotification] User cannot receive messages', {
                userId: userIdNum,
                ticketId: ticket.id,
                error: errorDescription
              });
              return; // Don't retry
            }
            
            // If Markdown parsing failed, try HTML fallback
            if ((errorDescription.includes('parse') || errorDescription.includes('Markdown') || errorDescription.includes('format')) && attempt === 1) {
              logger.debug('[TelegramNotification] Markdown parsing failed, trying HTML fallback', {
                userId: userIdNum,
                ticketId: ticket.id,
                error: errorDescription
              });
              
              // Convert to HTML and retry immediately
              parseMode = 'HTML';
              messageText = this.markdownToHtml(notificationMessage);
              
              const htmlResponse = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: userIdNum,
                  text: messageText,
                  parse_mode: 'HTML',
                  reply_markup: inlineKeyboard
                }),
                signal: controller.signal
              });

              if (htmlResponse.ok) {
                logger.info('[TelegramNotification] Ticket message notification sent (HTML fallback)', {
                  userId: userIdNum,
                  ticketId: ticket.id,
                  attempt
                });
                return; // Success with HTML
              }
            }
            
            throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
          }

          logger.info('[TelegramNotification] Ticket message notification sent', {
            userId: userIdNum,
            ticketId: ticket.id,
            attempt,
            parseMode
          });
          return; // Success, exit retry loop
        } catch (error) {
          const isTimeout = error instanceof Error && error.name === 'AbortError';
          const isLastAttempt = attempt === retries;
          
          if (isLastAttempt) {
            logger.error('[TelegramNotification] Failed to send ticket message notification after retries', {
              error: error instanceof Error ? error.message : String(error),
              userId: userIdNum,
              ticketId: ticket.id,
              attempts: retries,
              isTimeout
            });
            return; // Give up after all retries
          }

          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          logger.debug('[TelegramNotification] Retrying ticket message notification', {
            userId: userIdNum,
            attempt,
            retries,
            delay,
            isTimeout,
            error: error instanceof Error ? error.message : String(error)
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    // Send notification (don't await - fire and forget)
    sendWithRetry().catch(error => {
      logger.error('[TelegramNotification] Unhandled error in ticket message notification', {
        error: error instanceof Error ? error.message : String(error),
        ticketId: ticket.id
      });
    });
  }

  private escapeMarkdown(text: string): string {
    if (!text || typeof text !== 'string') return '';
    // Escape special Markdown characters
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
  }

  private markdownToHtml(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return String(text)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '\n');
  }
}

export const telegramNotificationService = new TelegramNotificationService();





