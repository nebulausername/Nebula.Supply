import { Markup, Telegraf } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";
import { navigationManager } from "../utils/navigationManager";
import { quickCommandHandler } from "../utils/quickCommandHandler";

export const registerFAQ = (bot: Telegraf<NebulaContext>) => {
  
  bot.action("open_faq", async (ctx) => {
    await ctx.answerCbQuery("❓ FAQ...");
    navigationManager.pushScreen(ctx, 'faq_main', 'FAQ Hauptmenü');
    
    // Get context-aware suggestions
    const suggestions = quickCommandHandler.getContextSuggestions(ctx);
    const suggestionText = suggestions.length > 0 
      ? `\n💡 **Schnelltipps:** ${suggestions.join(' • ')}`
      : '';
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🤳 Verifizierung", "faq_verification")],
      [Markup.button.callback("💳 Zahlungen", "faq_payments")],
      [Markup.button.callback("🎫 Tickets", "faq_tickets")],
      [Markup.button.callback("🎯 Drops & Ränge", "faq_drops_ranks")],
      [Markup.button.callback("👥 Einladungen", "faq_invites")],
      [Markup.button.callback("🔍 FAQ Suche", "faq_search")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);
    
    const message = 
      "❓ **FAQ – Häufige Fragen**\n\n" +
      "Wähle ein Thema:\n\n" +
      "🤳 **Verifizierung** - Handzeichen & Selfie\n" +
      "💳 **Zahlungen** - Methoden & Sicherheit\n" +
      "🎫 **Tickets** - Support & QR-Codes\n" +
      "🎯 **Drops & Ränge** - VIP & Belohnungen\n" +
      "👥 **Einladungen** - Affiliate & Codes\n\n" +
      "💬 **Quick-Suche:** Schreib einfach deine Frage!" +
      suggestionText;
    
    try {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, { parse_mode: "Markdown", ...keyboard });
      } else {
        await ctx.reply(message, { parse_mode: "Markdown", ...keyboard });
      }
    } catch {
      await ctx.reply(message, { parse_mode: "Markdown", ...keyboard });
    }
  });

  // Verifizierung FAQ
  bot.action("faq_verification", async (ctx) => {
    await ctx.answerCbQuery();
    navigationManager.pushScreen(ctx, 'faq_verification', 'FAQ Verifizierung');
    
    const message = 
      "🤳 **Verifizierung – FAQ**\n\n" +
      "**Wie funktioniert die Verifizierung?**\n" +
      "1. Handzeichen wird zufällig gewählt\n" +
      "2. Sende ein Foto mit dem Handzeichen\n" +
      "3. Unser Team prüft dein Foto\n\n" +
      "**Wie lange dauert die Prüfung?**\n" +
      "Normalerweise 5-15 Minuten. Du erhältst eine Benachrichtigung.\n\n" +
      "**Was passiert nach der Genehmigung?**\n" +
      "✅ Vollständiger Zugang zum Shop\n" +
      "🎯 Drops: Nach erster Bestellung oder erfolgreicher Einladung\n\n" +
      "**Kann ich das Handzeichen ändern?**\n" +
      "Ja, bis zu 3x während einer Session.\n\n" +
      "**Alternativen:**\n" +
      "Invite-Code für sofortigen Zugang (ohne Foto).";
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🚀 Verifizierung starten", "start_verification")],
      [Markup.button.callback("🔑 Invite Code verwenden", "use_invite")],
      [Markup.button.callback("❓ Weitere Fragen", "faq_verification_advanced")],
      [Markup.button.callback("🔙 Zurück zu FAQ", "open_faq")]
    ]);
    
    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      ...keyboard
    });
  });

  // Zahlungen FAQ
  bot.action("faq_payments", async (ctx) => {
    await ctx.answerCbQuery();
    navigationManager.pushScreen(ctx, 'faq_payments', 'FAQ Zahlungen');
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    const message = 
      "💳 **Zahlungen – FAQ**\n\n" +
      "**Welche Zahlungsmethoden gibt es?**\n" +
      "• Bargeld (am Schalter)\n" +
      "• CryptoVoucher\n" +
      "• Bitcoin (Lightning & On-Chain)\n" +
      "• Auf KO holen (ab Stammkunde/VIP)\n\n" +
      "**Wo zahle ich?**\n" +
      "Ausschließlich in unserer WebApp. Der Bot zeigt nur Infos.\n\n" +
      "**Was ist 'Auf KO holen'?**\n" +
      "Später bezahlen – nur für Stammkunden und VIP verfügbar.\n\n" +
      "**Sicherheit?**\n" +
      "Alle Zahlungen sind verschlüsselt und sicher.";
    
    let keyboard;
    if (isHttps) {
      keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp("💳 WebApp öffnen", webAppUrl)],
        [Markup.button.callback("💰 Guthaben aufladen", "add_credits")],
        [Markup.button.callback("📊 Zahlungshistorie", "payment_history")],
        [Markup.button.callback("❓ Weitere Fragen", "faq_payments_advanced")],
        [Markup.button.callback("🔙 Zurück zu FAQ", "open_faq")]
      ]);
    } else {
      keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("💳 WebApp öffnen", "open_webapp_payment")],
        [Markup.button.callback("💰 Guthaben aufladen", "add_credits")],
        [Markup.button.callback("📊 Zahlungshistorie", "payment_history")],
        [Markup.button.callback("❓ Weitere Fragen", "faq_payments_advanced")],
        [Markup.button.callback("🔙 Zurück zu FAQ", "open_faq")]
      ]);
    }
    
    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      ...keyboard
    });
  });

  // Tickets FAQ
  bot.action("faq_tickets", async (ctx) => {
    await ctx.answerCbQuery();
    const message = 
      "🎫 **Tickets – FAQ**\n\n" +
      "**Wo sehe ich meine Tickets?**\n" +
      "In der WebApp – live synchronisiert mit Status, QR-Codes und Event-Details.\n\n" +
      "**Wie antworte ich auf Tickets?**\n" +
      "Standard: In der WebApp antworten.\n" +
      "💎 VIP/Stammkunde: Auch direkt im Bot mit /reply möglich.\n\n" +
      "**Bot-Antwort Beispiel:**\n" +
      "`/reply TK-123456 Danke für die schnelle Hilfe!`\n\n" +
      "**Ticket-Status:**\n" +
      "🟢 Offen • 🟡 In Bearbeitung • 🟠 Wartet • ✅ Erledigt";
    
    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔙 Zurück zu FAQ", "open_faq")]
      ])
    });
  });

  // Drops & Ränge FAQ
  bot.action("faq_drops_ranks", async (ctx) => {
    await ctx.answerCbQuery();
    const message = 
      "🎯 **Drops & Ränge – FAQ**\n\n" +
      "**Wann habe ich Zugang zu Drops?**\n" +
      "Nach deiner ersten Bestellung oder einer erfolgreichen Einladung.\n\n" +
      "**Welche Ränge gibt es?**\n" +
      "• Nutzer (Nicht verifiziert)\n" +
      "• Nutzer (Verifiziert) – Shop-Zugang\n" +
      "• Kunde – 1 Bestellung oder 3 Einladungen\n" +
      "• Kunde+ – 3 Bestellungen oder 6 Einladungen\n" +
      "• Stammkunde – 5 Bestellungen oder 10 Einladungen\n" +
      "• VIP – 12 Bestellungen oder 20 Einladungen\n\n" +
      "**VIP-Vorteile:**\n" +
      "• Früher Zugang zu Drops\n" +
      "• Auf KO holen\n" +
      "• Ticket-Antworten im Bot";
    
    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔙 Zurück zu FAQ", "open_faq")]
      ])
    });
  });

  // Einladungen FAQ
  bot.action("faq_invites", async (ctx) => {
    await ctx.answerCbQuery();
    navigationManager.pushScreen(ctx, 'faq_invites', 'FAQ Einladungen');
    
    const message = 
      "👥 **Einladungen – FAQ**\n\n" +
      "**Wie funktioniert das Einladungssystem?**\n" +
      "Teile deinen persönlichen Ref-Link. Wenn jemand darüber den Bot startet, zählt es als Einladung.\n\n" +
      "**Wann ist eine Einladung 'erfolgreich'?**\n" +
      "Erst wenn der Eingeladene das erste Mal mit dem Bot interagiert (/start oder Nachricht).\n\n" +
      "**Wo finde ich meinen Ref-Link?**\n" +
      "In der WebApp unter 'Affiliate' – mit QR-Code zum Teilen.\n\n" +
      "**Belohnungen?**\n" +
      "Erfolgreiche Einladungen zählen zum Rang-Fortschritt:\n" +
      "• 3 Einladungen → Kunde\n" +
      "• 6 Einladungen → Kunde+\n" +
      "• 10 Einladungen → Stammkunde\n" +
      "• 20 Einladungen → VIP\n\n" +
      "**Leaderboard:**\n" +
      "Top-Inviter in der WebApp unter 'Affiliate'.";
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🔗 Meine Links", "my_links")],
      [Markup.button.callback("📊 Affiliate Stats", "affiliate_stats")],
      [Markup.button.callback("❓ Weitere Fragen", "faq_invites_advanced")],
      [Markup.button.callback("🔙 Zurück zu FAQ", "open_faq")]
    ]);
    
    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      ...keyboard
    });
  });

  // FAQ Search
  bot.action("faq_search", async (ctx) => {
    await ctx.answerCbQuery();
    navigationManager.pushScreen(ctx, 'faq_search', 'FAQ Suche');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🔍 Verifizierung suchen", "search_verification")],
      [Markup.button.callback("🔍 Zahlungen suchen", "search_payments")],
      [Markup.button.callback("🔍 Tickets suchen", "search_tickets")],
      [Markup.button.callback("🔍 Drops suchen", "search_drops")],
      [Markup.button.callback("🔙 Zurück zu FAQ", "open_faq")]
    ]);
    
    const message = 
      "🔍 **FAQ Suche**\n\n" +
      "**Kategorien durchsuchen:**\n\n" +
      "🔍 **Verifizierung** - Handzeichen, Selfie, Codes\n" +
      "🔍 **Zahlungen** - Methoden, Sicherheit, Guthaben\n" +
      "🔍 **Tickets** - Support, QR-Codes, Status\n" +
      "🔍 **Drops** - VIP, Ränge, Belohnungen\n\n" +
      "💡 **Tipp:** Du kannst auch direkt fragen!\n" +
      "Schreib einfach: 'wie verifizierung' oder 'bitte zahlung'";
    
    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      ...keyboard
    });
  });

  // Advanced FAQ sections
  bot.action("faq_verification_advanced", async (ctx) => {
    await ctx.answerCbQuery();
    navigationManager.pushScreen(ctx, 'faq_verification_advanced', 'FAQ Verifizierung Erweitert');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("❓ Handzeichen ändern", "faq_handsign_change")],
      [Markup.button.callback("❓ Verifizierung fehlgeschlagen", "faq_verification_failed")],
      [Markup.button.callback("❓ Datenschutz", "faq_verification_privacy")],
      [Markup.button.callback("🔙 Zurück", "faq_verification")]
    ]);
    
    const message = 
      "❓ **Verifizierung - Erweiterte Fragen**\n\n" +
      "**Häufige Probleme:**\n\n" +
      "❓ **Handzeichen ändern** - Wie oft möglich?\n" +
      "❓ **Verifizierung fehlgeschlagen** - Was tun?\n" +
      "❓ **Datenschutz** - Was passiert mit Fotos?\n\n" +
      "💡 **Wähle eine Frage für detaillierte Antworten:**";
    
    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      ...keyboard
    });
  });

  bot.action("faq_payments_advanced", async (ctx) => {
    await ctx.answerCbQuery();
    navigationManager.pushScreen(ctx, 'faq_payments_advanced', 'FAQ Zahlungen Erweitert');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("❓ Bitcoin Lightning", "faq_lightning")],
      [Markup.button.callback("❓ Auf KO holen", "faq_ko_holen")],
      [Markup.button.callback("❓ Guthaben verwalten", "faq_credits")],
      [Markup.button.callback("🔙 Zurück", "faq_payments")]
    ]);
    
    const message = 
      "❓ **Zahlungen - Erweiterte Fragen**\n\n" +
      "**Spezielle Themen:**\n\n" +
      "❓ **Bitcoin Lightning** - Schnelle Zahlungen\n" +
      "❓ **Auf KO holen** - Später bezahlen\n" +
      "❓ **Guthaben verwalten** - Aufladen & Auszahlen\n\n" +
      "💡 **Wähle ein Thema für detaillierte Infos:**";
    
    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      ...keyboard
    });
  });

  bot.action("faq_invites_advanced", async (ctx) => {
    await ctx.answerCbQuery();
    navigationManager.pushScreen(ctx, 'faq_invites_advanced', 'FAQ Einladungen Erweitert');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("❓ Link teilen", "faq_share_links")],
      [Markup.button.callback("❓ Belohnungen", "faq_invite_rewards")],
      [Markup.button.callback("❓ Tracking", "faq_invite_tracking")],
      [Markup.button.callback("🔙 Zurück", "faq_invites")]
    ]);
    
    const message = 
      "❓ **Einladungen - Erweiterte Fragen**\n\n" +
      "**Detaillierte Infos:**\n\n" +
      "❓ **Link teilen** - Beste Strategien\n" +
      "❓ **Belohnungen** - Was verdienst du?\n" +
      "❓ **Tracking** - Statistiken verstehen\n\n" +
      "💡 **Wähle ein Thema für mehr Details:**";
    
    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      ...keyboard
    });
  });

  // Text handler for FAQ search
  bot.on("text", async (ctx, next) => {
    const currentScreen = navigationManager.getCurrentScreen(ctx);
    
    // Only handle FAQ search if we're in FAQ context
    if (currentScreen?.screenId.startsWith('faq_')) {
      const text = ctx.message.text.toLowerCase().trim();
      
      // Check if it's a question
      const isQuestion = text.includes("?") || 
                        text.includes("wie") || 
                        text.includes("was") || 
                        text.includes("wo") || 
                        text.includes("wann") || 
                        text.includes("warum");
      
      if (isQuestion) {
        // Try to process with quick command handler
        const handled = await quickCommandHandler.processText(ctx, text);
        if (handled) {
          return; // Command was handled
        }
        
        // Fallback: Show FAQ search results
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback("🔍 Verifizierung", "faq_verification")],
          [Markup.button.callback("🔍 Zahlungen", "faq_payments")],
          [Markup.button.callback("🔍 Tickets", "faq_tickets")],
          [Markup.button.callback("🔙 Zurück zu FAQ", "open_faq")]
        ]);
        
        await ctx.reply(
          "🔍 **FAQ Suche**\n\n" +
          `**Deine Frage:** "${text}"\n\n` +
          "💡 **Mögliche Antworten:**\n" +
          "• Verifizierung & Handzeichen\n" +
          "• Zahlungen & Methoden\n" +
          "• Tickets & Support\n\n" +
          "🚀 **Wähle eine Kategorie:**",
          { parse_mode: "Markdown", ...keyboard }
        );
        return;
      }
    }
    
    return next();
  });

  // Bestellungen FAQ
  bot.action("faq_orders", async (ctx) => {
    await ctx.answerCbQuery();
    navigationManager.pushScreen(ctx, 'faq_orders', 'FAQ Bestellungen');
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const shopUrl = `${webAppUrl}/shop`;
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    const message = 
      "🛍️ **Bestellungen – FAQ**\n\n" +
      "**Wie bestelle ich?**\n" +
      "1. Durchsuche den Shop in der WebApp\n" +
      "2. Wähle dein Produkt\n" +
      "3. Bezahle mit einer verfügbaren Methode\n" +
      "4. Erhalte deine Bestätigung\n\n" +
      "**Wo sehe ich meine Bestellungen?**\n" +
      "In der WebApp unter 'Meine Bestellungen'.\n\n" +
      "**Versand & Lieferung:**\n" +
      "• Digitale Produkte: Sofort verfügbar\n" +
      "• Physische Produkte: Versandinfo in der Bestätigung\n\n" +
      "**Rückgabe?**\n" +
      "Kontaktiere den Support für Rückgaben.";
    
    const keyboard = Markup.inlineKeyboard([
      isHttps 
        ? [Markup.button.webApp("🛍️ Shop öffnen", shopUrl)]
        : [Markup.button.url("🛍️ Shop öffnen", shopUrl)],
      [Markup.button.callback("🔙 Zurück zu FAQ", "smart_faq")]
    ]);
    
    try {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        ...keyboard
      });
    } catch (error) {
      await ctx.reply(message, {
        parse_mode: "Markdown",
        ...keyboard
      });
    }
  });

  // Drops FAQ (Alias für faq_drops_ranks)
  bot.action("faq_drops", async (ctx) => {
    await ctx.answerCbQuery();
    navigationManager.pushScreen(ctx, 'faq_drops', 'FAQ Drops');
    
    const message = 
      "🎯 **Drops – FAQ**\n\n" +
      "**Wann habe ich Zugang zu Drops?**\n" +
      "Nach deiner ersten Bestellung oder einer erfolgreichen Einladung.\n\n" +
      "**Was sind Drops?**\n" +
      "Exklusive Limited-Edition Produkte, die nur für kurze Zeit verfügbar sind.\n\n" +
      "**VIP-Vorteile bei Drops:**\n" +
      "• Früher Zugang (Early Access)\n" +
      "• Exklusive Drops nur für VIP\n" +
      "• Priorität bei limitierten Editionen\n\n" +
      "**Wie erfahre ich von neuen Drops?**\n" +
      "Aktiviere Drop-Benachrichtigungen in den Einstellungen!";
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("📊 Ränge & System", "faq_drops_ranks")],
      [Markup.button.callback("🔙 Zurück zu FAQ", "smart_faq")]
    ]);
    
    try {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        ...keyboard
      });
    } catch (error) {
      await ctx.reply(message, {
        parse_mode: "Markdown",
        ...keyboard
      });
    }
  });

  // VIP FAQ
  bot.action("faq_vip", async (ctx) => {
    await ctx.answerCbQuery();
    navigationManager.pushScreen(ctx, 'faq_vip', 'FAQ VIP');
    
    const message = 
      "💎 **VIP – FAQ**\n\n" +
      "**Wie werde ich VIP?**\n" +
      "• 12 Bestellungen ODER\n" +
      "• 20 erfolgreiche Einladungen\n\n" +
      "**VIP-Vorteile:**\n" +
      "• 🎯 Früher Zugang zu Drops\n" +
      "• 💳 Auf KO holen (Später bezahlen)\n" +
      "• 🎫 Ticket-Antworten direkt im Bot mit `/reply`\n" +
      "• ⚡ Prioritäts-Support\n" +
      "• 🎁 Exklusive VIP-Drops\n\n" +
      "**Wie sehe ich meinen Rang?**\n" +
      "Nutze den Button '📊 Statistiken' im Hauptmenü!\n\n" +
      "**Ränge im Überblick:**\n" +
      "• Kunde: 1 Bestellung oder 3 Einladungen\n" +
      "• Kunde+: 3 Bestellungen oder 6 Einladungen\n" +
      "• Stammkunde: 5 Bestellungen oder 10 Einladungen\n" +
      "• VIP: 12 Bestellungen oder 20 Einladungen";
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("📊 Drops & Ränge", "faq_drops_ranks")],
      [Markup.button.callback("🔙 Zurück zu FAQ", "smart_faq")]
    ]);
    
    try {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        ...keyboard
      });
    } catch (error) {
      await ctx.reply(message, {
        parse_mode: "Markdown",
        ...keyboard
      });
    }
  });

  logger.info("Enhanced FAQ system registered successfully");
};





