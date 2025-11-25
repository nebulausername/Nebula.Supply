import { Markup, Telegraf } from 'telegraf';
import type { NebulaContext } from '../types';
import { logger } from '../logger';

export const registerHomeTab = (bot: Telegraf<NebulaContext>) => {
  
  // Set menu button on bot start (persistent home button)
  bot.telegram.setChatMenuButton({
    menuButton: { 
      type: 'commands' // Use commands instead of web_app for localhost compatibility
    }
  }).catch(e => logger.warn('Could not set menu button', { error: String(e) }));

  bot.command('home', async (ctx) => {
    const url = ctx.config.webAppUrl || 'http://localhost:5173';
    const isHttps = /^https:\/\//.test(url) && !/localhost/i.test(url);
    
    const buttons: any[] = [];
    if (isHttps) {
      buttons.push([Markup.button.webApp('🚀 WebApp öffnen', url)]);
    }
    buttons.push(
      [Markup.button.callback('⚙️ Einstellungen', 'open_settings'), Markup.button.callback('❓ FAQ', 'open_faq')],
      [Markup.button.callback('🎫 Support', 'support_home'), Markup.button.callback('👥 Affiliate', 'open_affiliate')],
      [Markup.button.callback('🔙 Hauptmenü', 'menu_back')]
    );

    const message = 
      "🏠 **Nebula Home**\n\n" +
      "Schnellzugriff auf alle Features:\n\n" +
      "🚀 WebApp – Shop & Drops\n" +
      "⚙️ Einstellungen – Notifications\n" +
      "❓ FAQ – Hilfe & Anleitungen\n" +
      "🎫 Support – Tickets\n" +
      "👥 Affiliate – Einladungen";

    await ctx.reply(message, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
  });

  bot.action('support_home', async (ctx) => {
    await ctx.answerCbQuery('🎫 Support...');
    // Delegate to support command
    return ctx.telegram.sendMessage(ctx.chat!.id, '/support').catch(() => {});
  });

  bot.action('open_affiliate', async (ctx) => {
    await ctx.answerCbQuery('👥 Affiliate...');
    const url = ctx.config.webAppUrl || 'http://localhost:5173';
    const isHttps = /^https:\/\//.test(url) && !/localhost/i.test(url);
    
    const message = 
      "👥 **Affiliate Programm**\n\n" +
      "Lade Freunde ein und steige im Rang auf!\n\n" +
      "📊 **Deine Stats:**\n" +
      "• Ref-Link & QR-Code\n" +
      "• Leaderboard\n" +
      "• Fortschritt zum nächsten Rang\n\n" +
      `${isHttps ? '🚀 Öffne die WebApp für Details.' : '🔗 Link: ' + url + '/affiliate'}`;

    const kb: any[] = [];
    if (isHttps) {
      kb.push([Markup.button.webApp('👥 Affiliate öffnen', url + '/affiliate')]);
    }
    kb.push([Markup.button.callback('🔙 Zurück', 'menu_back')]);

    await ctx.reply(message, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(kb) });
  });
};




