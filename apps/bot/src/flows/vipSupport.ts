/**
 * VIP/Stammkunde Support Features
 * 
 * Enhanced support features for VIP and Stammkunde users
 */

import type { Telegraf } from "telegraf";
import type { NebulaContext } from "../types";
import { Markup } from "telegraf";
import { botApiClient } from "../clients/apiClient";
import { logger } from "../logger";
import { getCachedUserTickets } from "../services/ticketCache";

/**
 * Check if user is VIP or Stammkunde
 */
async function isVipOrStammkunde(ctx: NebulaContext): Promise<boolean> {
  try {
    const resp: any = await fetch(`${process.env.BOT_API_URL || 'http://localhost:3001/api'}/rank/${ctx.from?.id}`)
      .then(r => r.json())
      .catch(() => null);
    const rank = resp?.data?.rank as string | undefined;
    return rank === 'VIP' || rank === 'Stammkunde' || (ctx.config.adminIds || []).includes(String(ctx.from?.id));
  } catch {
    return false;
  }
}

export const registerVipSupport = (bot: Telegraf<NebulaContext>) => {
  // Enhanced /reply command with more features
  bot.command("vipreply", async (ctx) => {
    const isVip = await isVipOrStammkunde(ctx);
    if (!isVip) {
      await ctx.reply("⛔️ Nur VIP/Stammkunden können diesen Befehl verwenden.");
      return;
    }

    const text = (ctx.message as any)?.text || "";
    const parts = text.trim().split(/\s+/);
    
    if (parts.length < 3) {
      await ctx.reply(
        `💎 *VIP Reply*\n\n` +
        `Usage: /vipreply <ticketId> <Nachricht>\n\n` +
        `Erweiterte Features:\n` +
        `• Priorisierte Bearbeitung\n` +
        `• Direkte Benachrichtigung\n` +
        `• Erweiterte Formatierung`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const ticketId = parts[1];
    const msgStartIndex = text.indexOf(ticketId) + ticketId.length;
    const message = text.slice(msgStartIndex).trim();

    try {
      await botApiClient.addTicketMessage(ticketId, {
        from: 'bot',
        user_id: String(ctx.from?.id),
        message: `💎 VIP Reply:\n\n${message}`
      });

      // Update ticket priority to high for VIP replies
      await botApiClient.updateTicket(ticketId, {
        priority: 'high'
      });

      await ctx.reply(
        `✅ **VIP Reply gesendet!**\n\n` +
        `🎫 Ticket: \`${ticketId}\`\n` +
        `💎 Status: Priorisiert\n` +
        `💬 Nachricht: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"\n\n` +
        `📱 Sichtbar in der WebApp.`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      await ctx.reply("❌ Konnte VIP Reply nicht senden.");
    }
  });

  // VIP Support Menu
  bot.command("vipsupport", async (ctx) => {
    const isVip = await isVipOrStammkunde(ctx);
    if (!isVip) {
      await ctx.reply("⛔️ Nur VIP/Stammkunden können diesen Bereich nutzen.");
      return;
    }

    const userId = ctx.from.id.toString();
    const userTickets = await getCachedUserTickets(userId);
    const openTickets = userTickets.filter(t => t.status !== 'done').length;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🆕 Neues Ticket (Priorisiert)', 'vip_new_ticket')],
      [Markup.button.callback('📋 Meine Tickets', 'support_list')],
      [Markup.button.callback('💎 VIP Reply', 'vip_reply_menu')],
      [Markup.button.callback('📊 Ticket-Statistiken', 'vip_stats')],
      [Markup.button.callback('🔙 Zurück', 'back_to_menu')]
    ]);

    await ctx.reply(
      `💎 *VIP SUPPORT*\n\n` +
      `Willkommen im VIP-Support-Bereich!\n\n` +
      `📊 Status:\n` +
      `• Offene Tickets: ${openTickets}\n` +
      `• Priorität: Hoch\n` +
      `• Antwortzeit: < 2 Stunden\n\n` +
      `Wähle eine Option:`,
      { parse_mode: 'Markdown', ...keyboard }
    );
  });

  // VIP New Ticket (with high priority)
  bot.action('vip_new_ticket', async (ctx) => {
    const isVip = await isVipOrStammkunde(ctx);
    if (!isVip) {
      await ctx.answerCbQuery('Nur für VIP/Stammkunden');
      return;
    }

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
      [Markup.button.callback('🔙 Zurück', 'vipsupport_back')]
    ]);

    await ctx.editMessageText(
      `💎 *VIP Ticket erstellen*\n\n` +
      `Dein Ticket wird automatisch mit hoher Priorität behandelt.\n\n` +
      `Wähle die Kategorie:`,
      { parse_mode: 'Markdown', ...keyboard }
    );

    // Mark session for VIP ticket creation
    ctx.session.isVipTicket = true;
  });
};

