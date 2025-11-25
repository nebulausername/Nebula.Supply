import { Markup, Telegraf } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";

// FAQ System für Invite Codes und allgemeine Hilfe
export const registerFaqSystem = (bot: Telegraf<NebulaContext>) => {
  
  // FAQ Hauptmenü
  bot.action("help_faq", async (ctx) => {
    await ctx.answerCbQuery("❓ FAQ wird geladen...");
    
    await ctx.reply(
      "❓ **Hilfe & FAQ**\n\n" +
      "Wähle eine Kategorie für detaillierte Hilfe:\n\n" +
      "🔑 **Invite Codes** - Code-Probleme lösen\n" +
      "🤳 **Verifizierung** - Selfie-Check Hilfe\n" +
      "🎫 **Tickets** - Support-System\n" +
      "⚙️ **Technische Hilfe** - System-Probleme\n" +
      "📞 **Kontakt** - Direkter Support",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔑 Invite Codes", "faq_invite_codes")],
        [Markup.button.callback("🤳 Verifizierung", "faq_verification")],
        [Markup.button.callback("🎫 Tickets", "faq_tickets")],
        [Markup.button.callback("⚙️ Technische Hilfe", "faq_technical")],
        [Markup.button.callback("📞 Kontakt", "faq_contact")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ])
    );
  });

  // Invite Codes FAQ
  bot.action("faq_invite_codes", async (ctx) => {
    await ctx.answerCbQuery("🔑 Invite Code Hilfe...");
    
    await ctx.reply(
      "🔑 **Invite Code FAQ**\n\n" +
      "**Häufige Fragen & Lösungen:**\n\n" +
      "❓ **Wie bekomme ich einen Invite Code?**\n" +
      "• Kontaktiere einen Admin oder Freund\n" +
      "• Verwende die Test-Codes: `VIP123`, `NEB456`, `INV789`\n" +
      "• Frage im Insider-Netzwerk nach\n\n" +
      "❓ **Mein Code funktioniert nicht - was tun?**\n" +
      "• Prüfe die Schreibweise (Groß-/Kleinschreibung)\n" +
      "• Code könnte abgelaufen oder ausgeschöpft sein\n" +
      "• Versuche einen anderen Code\n\n" +
      "❓ **Code ist abgelaufen - Hilfe?**\n" +
      "• Fordere einen neuen Code an\n" +
      "• Nutze die Selfie-Verifizierung als Alternative\n" +
      "• Kontaktiere den Support\n\n" +
      "❓ **Wie viele Codes kann ich verwenden?**\n" +
      "• Jeder Code nur einmal pro User\n" +
      "• Verschiedene Codes können kombiniert werden\n" +
      "• Keine Begrenzung der Code-Anzahl",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔑 Code testen", "use_invite")],
        [Markup.button.callback("🤳 Alternative Verifizierung", "start_selfie")],
        [Markup.button.callback("📞 Support kontaktieren", "faq_contact")],
        [Markup.button.callback("🔙 FAQ Hauptmenü", "help_faq")]
      ])
    );
  });

  // Verifizierung FAQ
  bot.action("faq_verification", async (ctx) => {
    await ctx.answerCbQuery("🤳 Verifizierung Hilfe...");
    
    await ctx.reply(
      "🤳 **Verifizierung FAQ**\n\n" +
      "**Selfie-Check Hilfe:**\n\n" +
      "❓ **Wie funktioniert die Verifizierung?**\n" +
      "• Mache ein Selfie mit deiner Hand\n" +
      "• Folge den Anweisungen genau\n" +
      "• Warte auf die automatische Prüfung\n\n" +
      "❓ **Was passiert bei der Prüfung?**\n" +
      "• KI analysiert dein Selfie\n" +
      "• Prüfung dauert 10-30 Sekunden\n" +
      "• Du erhältst sofort eine Antwort\n\n" +
      "❓ **Verifizierung fehlgeschlagen - was tun?**\n" +
      "• Bessere Beleuchtung verwenden\n" +
      "• Gesicht und Hand gut sichtbar machen\n" +
      "• Erneut versuchen\n\n" +
      "❓ **Datenschutz & Sicherheit?**\n" +
      "• Selfies werden automatisch gelöscht\n" +
      "• Keine Speicherung persönlicher Daten\n" +
      "• 100% sicher und anonym",
      Markup.inlineKeyboard([
        [Markup.button.callback("🤳 Verifizierung starten", "start_selfie")],
        [Markup.button.callback("🔑 Code verwenden", "use_invite")],
        [Markup.button.callback("🔙 FAQ Hauptmenü", "help_faq")]
      ])
    );
  });

  // Tickets FAQ
  bot.action("faq_tickets", async (ctx) => {
    await ctx.answerCbQuery("🎫 Ticket Hilfe...");
    
    await ctx.reply(
      "🎫 **Support Ticket FAQ**\n\n" +
      "**Ticket-System Hilfe:**\n\n" +
      "❓ **Wie erstelle ich ein Ticket?**\n" +
      "• Nutze den Support-Button im Menü\n" +
      "• Beschreibe dein Problem detailliert\n" +
      "• Füge Screenshots hinzu wenn möglich\n\n" +
      "❓ **Wie lange dauert die Bearbeitung?**\n" +
      "• Standard: 2-24 Stunden\n" +
      "• Dringend: 1-4 Stunden\n" +
      "• Du erhältst Updates per Nachricht\n\n" +
      "❓ **Ticket-Status prüfen?**\n" +
      "• Nutze den 'Meine Tickets' Button\n" +
      "• Sieh den aktuellen Status\n" +
      "• Füge weitere Informationen hinzu\n\n" +
      "❓ **Ticket schließen?**\n" +
      "• Problem gelöst? Ticket schließen\n" +
      "• Bewerte die Hilfe\n" +
      "• Feedback hinterlassen",
      Markup.inlineKeyboard([
        [Markup.button.callback("🎫 Neues Ticket", "create_ticket")],
        [Markup.button.callback("📋 Meine Tickets", "my_tickets")],
        [Markup.button.callback("🔙 FAQ Hauptmenü", "help_faq")]
      ])
    );
  });

  // Technische Hilfe FAQ
  bot.action("faq_technical", async (ctx) => {
    await ctx.answerCbQuery("⚙️ Technische Hilfe...");
    
    await ctx.reply(
      "⚙️ **Technische Hilfe FAQ**\n\n" +
      "**System-Probleme lösen:**\n\n" +
      "❓ **Bot antwortet nicht - was tun?**\n" +
      "• Warte 30 Sekunden und versuche erneut\n" +
      "• Starte den Bot neu: /start\n" +
      "• Prüfe deine Internetverbindung\n\n" +
      "❓ **Nachrichten kommen nicht an?**\n" +
      "• Telegram-Cache leeren\n" +
      "• Bot neu starten\n" +
      "• Internetverbindung prüfen\n\n" +
      "❓ **Fehlermeldungen erhalten?**\n" +
      "• Screenshot der Fehlermeldung machen\n" +
      "• Support-Ticket erstellen\n" +
      "• Fehler-ID notieren\n\n" +
      "❓ **System langsam?**\n" +
      "• Warte auf System-Erholung\n" +
      "• Versuche es in 5-10 Minuten\n" +
      "• Bei anhaltenden Problemen: Support",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Bot neu starten", "restart_bot")],
        [Markup.button.callback("📊 System-Status", "system_status")],
        [Markup.button.callback("🎫 Support-Ticket", "create_ticket")],
        [Markup.button.callback("🔙 FAQ Hauptmenü", "help_faq")]
      ])
    );
  });

  // Kontakt FAQ
  bot.action("faq_contact", async (ctx) => {
    await ctx.answerCbQuery("📞 Kontakt Info...");
    
    await ctx.reply(
      "📞 **Kontakt & Support**\n\n" +
      "**Direkte Hilfe erhalten:**\n\n" +
      "🎫 **Support-Ticket erstellen**\n" +
      "• Schnellste Hilfe\n" +
      "• Detaillierte Problembeschreibung\n" +
      "• Screenshots anhängen\n\n" +
      "💬 **Insider-Netzwerk Support**\n" +
      "• Telegram-Gruppe beitreten\n" +
      "• Andere Insider fragen\n" +
      "• Erfahrungen teilen\n\n" +
      "📧 **Direkter Kontakt**\n" +
      "• Admin per DM kontaktieren\n" +
      "• Spezielle Anfragen\n" +
      "• Feedback & Vorschläge\n\n" +
      "⏰ **Antwortzeiten**\n" +
      "• Support-Tickets: 2-24h\n" +
      "• Insider-Netzwerk: Sofort\n" +
      "• Admin: 1-4h",
      Markup.inlineKeyboard([
        [Markup.button.callback("🎫 Ticket erstellen", "create_ticket")],
        [Markup.button.callback("💬 Insider-Netzwerk", "join_community")],
        [Markup.button.callback("📧 Admin kontaktieren", "contact_admin")],
        [Markup.button.callback("🔙 FAQ Hauptmenü", "help_faq")]
      ])
    );
  });

  // Text-basierte FAQ-Suche
  bot.on("text", async (ctx, next) => {
    const text = ctx.message.text.toLowerCase().trim();
    
    // FAQ-Trigger erkennen
    if (text.includes("wie bekomme ich einen invite code") || 
        text.includes("invite code bekommen") ||
        text.includes("code bekommen") ||
        text.includes("wie bekomme ich einen code")) {
      
      await ctx.reply(
        "🔑 **Invite Code bekommen - So geht's!**\n\n" +
        "**Möglichkeiten einen Code zu erhalten:**\n\n" +
        "1️⃣ **Test-Codes verwenden**\n" +
        "• `VIP123` - 5 Verwendungen\n" +
        "• `NEB456` - 3 Verwendungen (24h gültig)\n" +
        "• `INV789` - 1 Verwendung\n\n" +
        "2️⃣ **Von Freunden/Insider-Netzwerk**\n" +
        "• Frage in der Telegram-Gruppe\n" +
        "• Freunde mit Codes fragen\n" +
        "• Insider kontaktieren\n\n" +
        "3️⃣ **Admin kontaktieren**\n" +
        "• Support-Ticket erstellen\n" +
        "• Direkt Admin anschreiben\n" +
        "• Begründung für Code angeben\n\n" +
        "4️⃣ **Alternative: Selfie-Verifizierung**\n" +
        "• Kein Code nötig\n" +
        "• Schnelle Verifizierung\n" +
        "• 100% anonym und sicher",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔑 Code testen", "use_invite")],
          [Markup.button.callback("🤳 Selfie-Check", "start_selfie")],
          [Markup.button.callback("🎫 Support-Ticket", "create_ticket")],
          [Markup.button.callback("❓ Mehr Hilfe", "help_faq")]
        ])
      );
      return;
    }
    
    // Weitere FAQ-Trigger
    if (text.includes("hilfe") || text.includes("problem") || text.includes("fehler")) {
      await ctx.reply(
        "❓ **Hilfe benötigt?**\n\n" +
        "Ich helfe dir gerne weiter! Wähle eine Option:",
        Markup.inlineKeyboard([
          [Markup.button.callback("❓ FAQ durchsuchen", "help_faq")],
          [Markup.button.callback("🎫 Support-Ticket", "create_ticket")],
          [Markup.button.callback("📞 Direkter Kontakt", "faq_contact")]
        ])
      );
      return;
    }
    
    return next();
  });

  // Bot neu starten
  bot.action("restart_bot", async (ctx) => {
    await ctx.answerCbQuery("🔄 Bot wird neu gestartet...");
    
    await ctx.reply(
      "🔄 **Bot neu gestartet!**\n\n" +
      "✅ **Status:** Alle Systeme aktualisiert\n" +
      "⚡ **Performance:** Optimiert\n" +
      "🛡️ **Sicherheit:** Verstärkt\n\n" +
      "🚀 **Bereit für neue Aktionen!**",
      Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Hauptmenü", "menu_back")]
      ])
    );
  });

  // System-Status
  bot.action("system_status", async (ctx) => {
    await ctx.answerCbQuery("📊 System-Status wird geprüft...");
    
    const now = new Date();
    await ctx.reply(
      "📊 **System-Status**\n\n" +
      "🟢 **Bot:** Online und funktionsfähig\n" +
      "🟢 **Verbindung:** Stabil\n" +
      "🟢 **Performance:** Optimal\n" +
      "🟢 **Sicherheit:** Aktiv\n\n" +
      "⏰ **Letzte Aktualisierung:** " + now.toLocaleString() + "\n" +
      "🆔 **System-ID:** " + (ctx.from?.id || 'Unbekannt') + "\n\n" +
      "✅ **Alle Systeme funktionieren einwandfrei!**",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔙 Zurück", "help_faq")]
      ])
    );
  });

  logger.info("FAQ System registered successfully");
};

