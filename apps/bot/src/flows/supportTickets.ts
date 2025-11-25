import type { Telegraf } from "telegraf";
import type { NebulaContext } from "../types";
import { Markup } from "telegraf";
import { botApiClient } from "../clients/apiClient";
import { rateLimiters, checkRateLimit } from "../middleware/rateLimiter";
import { getCachedTicket, getCachedUserTickets, invalidateTicketCache, invalidateUserTicketsCache } from "../services/ticketCache";
import { generateAutoResponse, routeTicket, determinePriority } from "../services/autoResponse";
import { trackTicketCreated, trackTicketMessage, trackTicketStatusChange } from "../services/ticketAnalytics";
import { notifyTicketCreated, notifyTicketUpdate } from "../services/notifications";
import { logger } from "../logger";

export interface TicketData {
  id: string;
  userId?: string;
  telegramUserId?: string;
  subject: string;
  summary?: string;
  description?: string;
  status: 'open' | 'in_progress' | 'waiting' | 'escalated' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  createdAt: string;
  messages?: Array<{
    id: string;
    text: string;
    from: 'user' | 'agent' | 'bot' | 'system';
    timestamp: string;
    attachments?: any[];
  }>;
}

// Helper function to convert API ticket to TicketData format
function convertApiTicketToTicketData(apiTicket: any): TicketData {
  return {
    id: apiTicket.id,
    userId: apiTicket.userId || apiTicket.telegramUserId,
    telegramUserId: apiTicket.telegramUserId,
    subject: apiTicket.subject,
    summary: apiTicket.summary,
    description: apiTicket.summary || apiTicket.description,
    status: apiTicket.status,
    priority: apiTicket.priority,
    category: apiTicket.category,
    createdAt: apiTicket.createdAt,
    messages: apiTicket.messages || []
  };
}

// Store bot instance for notifications
let botInstance: Telegraf<NebulaContext> | null = null;

export const registerSupportTickets = (bot: Telegraf<NebulaContext>) => {
  botInstance = bot;
  // VIP/Stammkunde: Ticket-Antwort per Befehl
  bot.command("reply", async (ctx) => {
    const text = (ctx.message as any)?.text || "";
    const parts = text.trim().split(/\s+/);
    if (parts.length < 3) {
      await ctx.reply(
        "❌ **Falsche Verwendung**\n\n" +
        "**Korrekte Verwendung:**\n" +
        "`/reply <ticketId> <Nachricht>`\n\n" +
        "**Beispiel:**\n" +
        "`/reply TICKET123 Vielen Dank für die schnelle Antwort!`\n\n" +
        "**Hinweis:** Nur für VIP/Stammkunden verfügbar.",
        { parse_mode: 'Markdown' }
      );
      return;
    }
    const ticketId = parts[1];
    const msgStartIndex = text.indexOf(ticketId) + ticketId.length;
    const message = text.slice(msgStartIndex).trim();

    try {
      const resp: any = await fetch(`${process.env.BOT_API_URL || 'http://localhost:3001/api'}/rank/${ctx.from?.id}`)
        .then(r => r.json())
        .catch(() => null);
      const rank = resp?.data?.rank as string | undefined;
      const allowed = rank === 'VIP' || rank === 'Stammkunde' || (ctx.config.adminIds || []).includes(String(ctx.from?.id));
      if (!allowed) {
        await ctx.reply(
          "⛔️ **Nur für VIP/Stammkunden**\n\n" +
          "**Was ist passiert?**\n" +
          "Diese Funktion ist nur für VIP-Mitglieder und Stammkunden verfügbar.\n\n" +
          "**Lösung:**\n" +
          "1. Nutze die normale Ticket-Funktion\n" +
          "2. Oder werde VIP-Mitglied für erweiterte Features\n\n" +
          "💡 **Tipp:** VIP-Mitglieder haben viele Vorteile!",
          { parse_mode: 'Markdown' }
        );
        return;
      }
    } catch {}

    try {
      await botApiClient.addTicketMessage(ticketId, {
        from: 'bot',
        user_id: String(ctx.from?.id),
        message
      });
      await ctx.reply(
        `✅ **Antwort erfolgreich gesendet!**\n\n` +
        `🎫 **Ticket:** \`${ticketId}\`\n` +
        `💬 **Nachricht:** "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"\n\n` +
        `**Status:** Deine Antwort ist jetzt im Ticket sichtbar.\n` +
        `📱 **Sichtbar in:** WebApp und Telegram\n\n` +
        `💡 **Tipp:** Du kannst jederzeit weitere Antworten senden!`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      await ctx.reply(
        "❌ **Antwort konnte nicht gesendet werden**\n\n" +
        "**Was ist passiert?**\n" +
        "Beim Senden deiner Antwort ist ein Fehler aufgetreten.\n\n" +
        "**Lösung:**\n" +
        "1. Versuche es erneut\n" +
        "2. Oder antworte direkt in der WebApp\n" +
        "3. Falls das Problem weiterhin besteht, erstelle ein neues Ticket\n\n" +
        "💡 **Tipp:** Die WebApp hat alle Ticket-Funktionen!",
        { parse_mode: 'Markdown' }
      );
    }
  });
  
  // 🎫 Main Support Menu
  bot.command('support', async (ctx) => {
    const userId = ctx.from.id.toString();
    
    try {
      const userTickets = await getCachedUserTickets(userId);
      const ticketCount = userTickets.length;
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🆕 Neues Ticket erstellen', 'support_new')],
        [Markup.button.callback('📋 Meine Tickets', 'support_list')],
        [Markup.button.callback('❓ FAQ', 'support_faq')],
        [Markup.button.callback('🔙 Zurück', 'back_to_menu')]
      ]);

      await ctx.reply(
        `🎫 *NEBULA SUPPORT*\n\n` +
        `Willkommen im Support-Bereich!\n` +
        `Du hast aktuell *${ticketCount}* Ticket(s).\n\n` +
        `Wähle eine Option:`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    } catch (error) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🆕 Neues Ticket erstellen', 'support_new')],
        [Markup.button.callback('📋 Meine Tickets', 'support_list')],
        [Markup.button.callback('❓ FAQ', 'support_faq')]
      ]);
      await ctx.reply(
        `🎫 *NEBULA SUPPORT*\n\n` +
        `Willkommen im Support-Bereich!\n\n` +
        `Wähle eine Option:`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    }
  });

  // 🆕 Create New Ticket
  bot.action('support_new', async (ctx) => {
    await ctx.answerCbQuery();
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🛒 Bestellung', 'ticket_cat_order'),
        Markup.button.callback('💳 Zahlung', 'ticket_cat_payment')
      ],
      [
        Markup.button.callback('📦 Versand', 'ticket_cat_shipping'),
        Markup.button.callback('🔄 Rückgabe', 'ticket_cat_return')
      ],
      [
        Markup.button.callback('🐛 Technisch', 'ticket_cat_technical'),
        Markup.button.callback('💬 Sonstiges', 'ticket_cat_other')
      ],
      [Markup.button.callback('🔙 Zurück', 'support_back')]
    ]);

    await ctx.editMessageText(
      `📝 **Neues Ticket erstellen**\n\n` +
      `**So funktioniert's:**\n` +
      `1. Wähle die passende Kategorie\n` +
      `2. Beschreibe dein Problem detailliert\n` +
      `3. Unser Team antwortet schnellstmöglich\n\n` +
      `⏰ **Antwortzeit:** Normalerweise innerhalb von 24 Stunden\n\n` +
      `**Wähle die Kategorie deines Anliegens:**`,
      { parse_mode: 'Markdown', ...keyboard }
    );
  });

  // Category Selection
  const categories = {
    'ticket_cat_order': { name: '🛒 Bestellung', emoji: '🛒' },
    'ticket_cat_payment': { name: '💳 Zahlung', emoji: '💳' },
    'ticket_cat_shipping': { name: '📦 Versand', emoji: '📦' },
    'ticket_cat_return': { name: '🔄 Rückgabe', emoji: '🔄' },
    'ticket_cat_technical': { name: '🐛 Technisch', emoji: '🐛' },
    'ticket_cat_other': { name: '💬 Sonstiges', emoji: '💬' }
  };

  Object.keys(categories).forEach(action => {
    bot.action(action, async (ctx) => {
      await ctx.answerCbQuery();
      const category = categories[action as keyof typeof categories];
      
      ctx.session.ticketCategory = category.name;
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('❌ Abbrechen', 'support_cancel')]
      ]);

      await ctx.editMessageText(
        `${category.emoji} **${category.name}**\n\n` +
        `**Bitte beschreibe dein Anliegen:**\n\n` +
        `**Tipps für eine gute Beschreibung:**\n` +
        `• Was ist das Problem genau?\n` +
        `• Wann ist es aufgetreten?\n` +
        `• Welche Schritte hast du bereits unternommen?\n` +
        `• Gibt es Fehlermeldungen?\n\n` +
        `💡 **Je detaillierter, desto schneller können wir helfen!**\n\n` +
        `Schreibe jetzt deine Nachricht...`,
        { parse_mode: 'Markdown', ...keyboard }
      );

      ctx.session.awaitingTicketDescription = true;
    });
  });

  // Handle ticket description
  bot.on('text', async (ctx, next) => {
    if (ctx.session.awaitingTicketDescription) {
      // Apply rate limiting for ticket creation
      const rateLimitKey = `ticket:create:${ctx.from?.id || 'unknown'}`;
      
      // Check rate limit
      const rateLimitOk = await checkRateLimit(ctx, {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 5,
        key: rateLimitKey,
        onLimitReached: async (ctx) => {
          await ctx.reply(
            `⏱️ **Zu viele Tickets erstellt**\n\n` +
            `**Was ist passiert?**\n` +
            `Du hast bereits 5 Tickets in der letzten Stunde erstellt.\n\n` +
            `**Lösung:**\n` +
            `1. Warte 1 Stunde\n` +
            `2. Versuche es dann erneut\n` +
            `3. Für dringende Anliegen: Nutze die FAQ oder kontaktiere uns direkt\n\n` +
            `💡 **Tipp:** Viele Fragen werden in der FAQ beantwortet!`,
            { parse_mode: 'Markdown', ...keyboard: Markup.inlineKeyboard([
              [Markup.button.callback("❓ FAQ durchsuchen", "support_faq")],
              [Markup.button.callback("🔙 Zurück", "support_back")]
            ]) }
          );
        }
      });

      if (!rateLimitOk) {
        return; // Rate limit exceeded
      }

      const userId = ctx.from.id.toString();
      const description = ctx.message.text;
      const category = ctx.session.ticketCategory || '💬 Sonstiges';
      
      // Extract category name without emoji
      const categoryName = category.replace(/^[^\w\s]+/, '').trim();

      try {
        // Determine priority based on message content and VIP status
        let priority = determinePriority(description, categoryName);
        
        // Check if user is VIP/Stammkunde and upgrade priority
        if (ctx.session.isVipTicket) {
          priority = priority === 'low' ? 'medium' : priority === 'medium' ? 'high' : priority;
          ctx.session.isVipTicket = false;
        }
        
        // Create ticket via API
        const ticket = await botApiClient.createTicket({
          subject: categoryName,
          summary: description,
          priority,
          category: categoryName.toLowerCase().replace(/\s+/g, '_'),
          telegramUserId: userId
        });

        // Execute independent operations in parallel for better performance
        await Promise.allSettled([
          routeTicket(ticket.id, categoryName, priority),
          trackTicketCreated(ticket.id, userId, categoryName, priority, 'telegram'),
          generateAutoResponse(ticket.id, categoryName, userId),
          notifyTicketCreated(botInstance, userId, ticket.id, categoryName)
        ]);

        // Invalidate user tickets cache since we added a new ticket
        await invalidateUserTicketsCache(userId);

        ctx.session.awaitingTicketDescription = false;
        ctx.session.ticketCategory = undefined;

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('📨 Nachricht senden', `ticket_msg_${ticket.id}`)],
          [Markup.button.callback('📋 Ticket Details', `ticket_view_${ticket.id}`)],
          [Markup.button.callback('🔙 Zum Support', 'support_back')]
        ]);

        await ctx.reply(
          `✅ **Ticket erfolgreich erstellt!**\n\n` +
          `🎫 **Ticket-ID:** \`${ticket.id}\`\n` +
          `📁 **Kategorie:** ${category}\n` +
          `🟢 **Status:** Offen\n` +
          `⏰ **Erstellt:** ${new Date().toLocaleString('de-DE')}\n\n` +
          `**Was passiert jetzt?**\n` +
          `Unser Support-Team wurde benachrichtigt und wird sich schnellstmöglich bei dir melden.\n\n` +
          `⏰ **Geschätzte Antwortzeit:** Normalerweise innerhalb von 24 Stunden\n\n` +
          `💡 **Tipp:** Du kannst jederzeit weitere Nachrichten hinzufügen!`,
          { parse_mode: 'Markdown', ...keyboard }
        );
      } catch (error) {
        await ctx.reply(
          `❌ **Fehler beim Erstellen des Tickets**\n\n` +
          `**Was ist passiert?**\n` +
          `Beim Erstellen deines Tickets ist ein Fehler aufgetreten.\n\n` +
          `**Lösung Schritt für Schritt:**\n` +
          `1. Versuche es in 30 Sekunden erneut\n` +
          `2. Prüfe deine Internetverbindung\n` +
          `3. Falls das Problem weiterhin besteht, kontaktiere uns direkt\n\n` +
          `💡 **Tipp:** Meist hilft ein erneuter Versuch!`,
          { parse_mode: 'Markdown', ...keyboard: Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Erneut versuchen", "support_new")],
            [Markup.button.callback("🔙 Zurück", "support_back")]
          ]) }
        );
      }
    } else {
      return next();
    }
  });

  // 📋 List User Tickets
  bot.action('support_list', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id.toString();

    try {
      const userTickets = await getCachedUserTickets(userId);

      if (userTickets.length === 0) {
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('🆕 Neues Ticket', 'support_new')],
          [Markup.button.callback('🔙 Zurück', 'support_back')]
        ]);

        await ctx.editMessageText(
          `📋 **Meine Tickets**\n\n` +
          `**Du hast noch keine Tickets erstellt.**\n\n` +
          `**Was bedeutet das?**\n` +
          `Du hast bisher noch keine Support-Anfragen gestellt.\n\n` +
          `**Nächste Schritte:**\n` +
          `• Erstelle ein neues Ticket, wenn du Hilfe brauchst\n` +
          `• Oder durchsuche die FAQ für häufige Fragen\n\n` +
          `💡 **Tipp:** Die FAQ beantworten viele Fragen sofort!`,
          { parse_mode: 'Markdown', ...keyboard }
        );
        return;
      }

      const buttons = userTickets.map(ticket => {
        const statusEmoji = {
          'open': '🟢',
          'in_progress': '🟡',
          'waiting': '🟠',
          'escalated': '🔴',
          'done': '✅'
        }[ticket.status] || '🟢';

        // Show channel indicator (Telegram or Web)
        const channelIcon = (ticket as any).channel === 'telegram' ? '📱' : '🌐';
        const channelLabel = (ticket as any).channel === 'telegram' ? 'TG' : 'Web';

        return [Markup.button.callback(
          `${statusEmoji} ${channelIcon} ${ticket.id} - ${ticket.subject}`,
          `ticket_view_${ticket.id}`
        )];
      });

      buttons.push([Markup.button.callback('🔙 Zurück', 'support_back')]);

      const keyboard = Markup.inlineKeyboard(buttons);

      // Count tickets by channel
      const telegramCount = userTickets.filter((t: any) => t.channel === 'telegram').length;
      const webCount = userTickets.filter((t: any) => t.channel === 'web' || !t.channel).length;

      await ctx.editMessageText(
        `📋 *Meine Tickets* (${userTickets.length})\n\n` +
        `📱 Telegram: ${telegramCount} | 🌐 Web: ${webCount}\n\n` +
        `Wähle ein Ticket:`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    } catch (error) {
      await ctx.editMessageText(
        `❌ *Fehler beim Laden der Tickets*\n\n` +
        `Bitte versuche es erneut.`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // 👁️ View Ticket Details
  bot.action(/ticket_view_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const ticketId = ctx.match[1];

    try {
      const apiTicket = await getCachedTicket(ticketId);
      
      if (!apiTicket) {
        await ctx.answerCbQuery('Ticket nicht gefunden!');
        return;
      }

      const ticket = convertApiTicketToTicketData(apiTicket);

      const statusEmoji = {
        'open': '🟢 Offen',
        'in_progress': '🟡 In Bearbeitung',
        'waiting': '🟠 Wartet auf Antwort',
        'escalated': '🔴 Eskaliert',
        'done': '✅ Abgeschlossen'
      }[ticket.status] || '🟢 Offen';

      const priorityEmoji = {
        'low': '🟦 Niedrig',
        'medium': '🟨 Mittel',
        'high': '🟧 Hoch',
        'critical': '🟥 Kritisch'
      }[ticket.priority] || '🟨 Mittel';

      let messageHistory = '\n\n*💬 Nachrichten:*\n';
      const messages = ticket.messages || [];
      messages.slice(-5).forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString('de-DE');
        const from = msg.from === 'user' ? '👤 Du' : msg.from === 'agent' || msg.from === 'bot' ? '🎧 Support' : '🤖 System';
        messageHistory += `\n${from} (${time}):\n${msg.text}\n`;
      });

      if (messages.length === 0) {
        messageHistory += '\n_Noch keine Nachrichten_\n';
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('💬 Nachricht senden', `ticket_msg_${ticketId}`)],
        ticket.status !== 'done' ? [Markup.button.callback('✅ Als erledigt markieren', `ticket_close_${ticketId}`)] : [],
        [Markup.button.callback('🔙 Zur Übersicht', 'support_list')]
      ].filter(row => row.length > 0));

      // Get channel info
      const channel = (apiTicket as any).channel || 'web';
      const channelIcon = channel === 'telegram' ? '📱' : '🌐';
      const channelLabel = channel === 'telegram' ? 'Telegram' : 'Web';

      await ctx.editMessageText(
        `🎫 *Ticket Details* ${channelIcon}\n\n` +
        `ID: \`${ticket.id}\`\n` +
        `📁 ${ticket.subject}\n` +
        `📊 Status: ${statusEmoji}\n` +
        `⚡ Priorität: ${priorityEmoji}\n` +
        `📱 Quelle: ${channelLabel}\n` +
        `⏰ ${new Date(ticket.createdAt).toLocaleString('de-DE')}` +
        messageHistory,
        { parse_mode: 'Markdown', ...keyboard }
      );
    } catch (error) {
      await ctx.answerCbQuery('Fehler beim Laden des Tickets!');
    }
  });

  // 💬 Send Message to Ticket
  bot.action(/ticket_msg_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const ticketId = ctx.match[1];
    
    ctx.session.activeTicketId = ticketId;
    ctx.session.awaitingTicketMessage = true;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('❌ Abbrechen', `ticket_view_${ticketId}`)]
    ]);

    await ctx.editMessageText(
      `💬 *Nachricht senden*\n\n` +
      `Ticket: \`${ticketId}\`\n\n` +
      `Schreibe deine Nachricht:`,
      { parse_mode: 'Markdown', ...keyboard }
    );
  });

  // Handle ticket messages
  bot.on('text', async (ctx, next) => {
    if (ctx.session.awaitingTicketMessage && ctx.session.activeTicketId) {
      // Apply rate limiting for ticket messages
      const rateLimitKey = `ticket:message:${ctx.from?.id || 'unknown'}`;
      
      // Check rate limit
      const rateLimitOk = await checkRateLimit(ctx, {
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: 20,
        key: rateLimitKey,
        onLimitReached: async (ctx) => {
          await ctx.reply(
            `⏱️ *Zu viele Nachrichten*\n\n` +
            `Du kannst maximal 20 Nachrichten pro 10 Minuten senden.\n\n` +
            `Bitte warte einen Moment und versuche es erneut.`,
            { parse_mode: 'Markdown' }
          );
        }
      });

      if (!rateLimitOk) {
        return; // Rate limit exceeded
      }

      const ticketId = ctx.session.activeTicketId;
      const userId = ctx.from.id.toString();

      try {
        await botApiClient.addTicketMessage(ticketId, {
          from: 'user',
          user_id: userId,
          message: ctx.message.text
        });

        // Execute cache invalidation and tracking in parallel (non-blocking)
        await Promise.allSettled([
          invalidateTicketCache(ticketId),
          invalidateUserTicketsCache(userId),
          trackTicketMessage(ticketId, userId, 'user', ctx.message.text.length).catch(err => {
            logger.warn('[SupportTickets] Failed to track message', { error: err, ticketId });
          })
        ]);

        ctx.session.awaitingTicketMessage = false;
        ctx.session.activeTicketId = undefined;

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('💬 Weitere Nachricht', `ticket_msg_${ticketId}`)],
          [Markup.button.callback('📋 Ticket Details', `ticket_view_${ticketId}`)],
          [Markup.button.callback('🔙 Zur Übersicht', 'support_list')]
        ]);

        await ctx.reply(
          `✅ **Nachricht erfolgreich gesendet!**\n\n` +
          `**Was ist passiert?**\n` +
          `Deine Nachricht wurde zum Ticket hinzugefügt.\n\n` +
          `**Nächste Schritte:**\n` +
          `• Das Support-Team wurde benachrichtigt\n` +
          `• Du erhältst eine Antwort, sobald das Team antwortet\n` +
          `• Du kannst jederzeit weitere Nachrichten hinzufügen\n\n` +
          `💡 **Tipp:** Je detaillierter deine Nachricht, desto schneller die Hilfe!`,
          { parse_mode: 'Markdown', ...keyboard }
        );
      } catch (error) {
        await ctx.reply(
          `❌ **Fehler beim Senden der Nachricht**\n\n` +
          `**Was ist passiert?**\n` +
          `Beim Senden deiner Nachricht ist ein Fehler aufgetreten.\n\n` +
          `**Lösung Schritt für Schritt:**\n` +
          `1. Versuche es in 30 Sekunden erneut\n` +
          `2. Prüfe deine Internetverbindung\n` +
          `3. Falls das Problem weiterhin besteht, erstelle ein neues Ticket\n\n` +
          `💡 **Tipp:** Meist hilft ein erneuter Versuch!`,
          { parse_mode: 'Markdown', ...keyboard: Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Erneut versuchen", `ticket_msg_${ticketId}`)],
            [Markup.button.callback("🔙 Zurück", "support_back")]
          ]) }
        );
      }
    } else {
      return next();
    }
  });

  // ✅ Close Ticket
  bot.action(/ticket_close_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const ticketId = ctx.match[1];

    try {
      // Get current ticket to track status change
      const currentTicket = await getCachedTicket(ticketId);
      const oldStatus = currentTicket?.status || 'unknown';

      await botApiClient.updateTicketStatus(ticketId, 'done', 'Vom Benutzer als erledigt markiert');

      // Execute operations in parallel
      await Promise.allSettled([
        trackTicketStatusChange(ticketId, oldStatus, 'done', ctx.from.id.toString()),
        notifyTicketUpdate(botInstance, ctx.from.id.toString(), ticketId, 'status_changed', {
          status: 'done'
        }),
        invalidateTicketCache(ticketId),
        invalidateUserTicketsCache(ctx.from.id.toString())
      ]);

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📋 Zur Übersicht', 'support_list')],
        [Markup.button.callback('🔙 Zum Support', 'support_back')]
      ]);

      await ctx.editMessageText(
        `✅ *Ticket geschlossen*\n\n` +
        `Ticket \`${ticketId}\` wurde als erledigt markiert.\n\n` +
        `Vielen Dank für deine Rückmeldung!`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    } catch (error) {
      await ctx.editMessageText(
        `❌ *Fehler beim Schließen des Tickets*\n\n` +
        `Bitte versuche es erneut.`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // ❓ FAQ
  bot.action('support_faq', async (ctx) => {
    await ctx.answerCbQuery();
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📦 Versandzeiten', 'faq_shipping')],
      [Markup.button.callback('💳 Zahlungsmethoden', 'faq_payment')],
      [Markup.button.callback('🔄 Rückgaberecht', 'faq_returns')],
      [Markup.button.callback('📏 Größentabelle', 'faq_sizes')],
      [Markup.button.callback('🔙 Zurück', 'support_back')]
    ]);

    await ctx.editMessageText(
      `❓ *FAQ - Häufige Fragen*\n\n` +
      `Wähle ein Thema:`,
      { parse_mode: 'Markdown', ...keyboard }
    );
  });

  // FAQ Answers
  const faqAnswers = {
    'faq_shipping': {
      title: '📦 Versandzeiten',
      text: `*Versandzeiten*\n\n` +
            `🚚 Deutschland: 2-3 Werktage\n` +
            `🌍 EU: 4-6 Werktage\n` +
            `✈️ International: 7-14 Werktage\n\n` +
            `Alle Bestellungen werden mit Tracking-Nummer versendet.`
    },
    'faq_payment': {
      title: '💳 Zahlungsmethoden',
      text: `*Zahlungsmethoden*\n\n` +
            `✅ Kreditkarte (Visa, Mastercard)\n` +
            `✅ PayPal\n` +
            `✅ Sofortüberweisung\n` +
            `✅ Kryptowährungen (BTC, ETH)\n\n` +
            `Alle Zahlungen sind SSL-verschlüsselt.`
    },
    'faq_returns': {
      title: '🔄 Rückgaberecht',
      text: `*Rückgaberecht*\n\n` +
            `📅 30 Tage Rückgaberecht\n` +
            `💰 Volle Rückerstattung\n` +
            `📦 Kostenloser Rückversand (DE)\n\n` +
            `Artikel müssen ungetragen und mit Etikett sein.`
    },
    'faq_sizes': {
      title: '📏 Größentabelle',
      text: `*Größentabelle*\n\n` +
            `XS: Brust 86-89cm\n` +
            `S: Brust 90-94cm\n` +
            `M: Brust 95-99cm\n` +
            `L: Brust 100-104cm\n` +
            `XL: Brust 105-110cm\n\n` +
            `Bei Fragen: Kontaktiere unseren Support!`
    }
  };

  Object.keys(faqAnswers).forEach(action => {
    bot.action(action, async (ctx) => {
      await ctx.answerCbQuery();
      const faq = faqAnswers[action as keyof typeof faqAnswers];
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🆕 Ticket erstellen', 'support_new')],
        [Markup.button.callback('🔙 Zurück zu FAQ', 'support_faq')]
      ]);

      await ctx.editMessageText(
        `${faq.text}`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    });
  });

  // Back Buttons
  const showSupportHome = async (ctx: NebulaContext) => {
    const userId = ctx.from!.id.toString();
    
    try {
      const userTickets = await getCachedUserTickets(userId);
      const ticketCount = userTickets.length;
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🆕 Neues Ticket erstellen', 'support_new')],
        [Markup.button.callback('📋 Meine Tickets', 'support_list')],
        [Markup.button.callback('❓ FAQ', 'support_faq')],
        [Markup.button.callback('🔙 Zurück', 'menu_back')]
      ]);
      await ctx.reply(
        `🎫 *NEBULA SUPPORT*\n\n` +
        `Willkommen im Support-Bereich!\n` +
        `Du hast aktuell *${ticketCount}* Ticket(s).\n\n` +
        `Wähle eine Option:`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    } catch (error) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🆕 Neues Ticket erstellen', 'support_new')],
        [Markup.button.callback('📋 Meine Tickets', 'support_list')],
        [Markup.button.callback('❓ FAQ', 'support_faq')]
      ]);
      await ctx.reply(
        `🎫 *NEBULA SUPPORT*\n\n` +
        `Willkommen im Support-Bereich!\n\n` +
        `Wähle eine Option:`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    }
  };

  bot.action('support_back', async (ctx) => {
    await ctx.answerCbQuery();
    await showSupportHome(ctx as NebulaContext);
  });

  bot.action('support_cancel', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.awaitingTicketDescription = false;
    ctx.session.awaitingTicketMessage = false;
    ctx.session.ticketCategory = undefined;
    ctx.session.activeTicketId = undefined;
    await ctx.editMessageText('❌ Vorgang abgebrochen.');
  });
};

// Helper functions for backward compatibility (if needed)
export const getTickets = async () => {
  // This is now handled via API, return empty for backward compatibility
  return new Map();
};

export const getUserTickets = async (userId: string) => {
  try {
    const tickets = await botApiClient.getUserTickets(userId);
    return tickets.map(t => t.id);
  } catch (error) {
    return [];
  }
};
