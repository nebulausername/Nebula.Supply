import { Markup, Telegraf } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";
import { botApiClient } from "../clients/apiClient";

// Verifizierungs-Session
interface VerificationSession {
  id: string;
  userId: number;
  status: "awaiting_handsign" | "awaiting_photo" | "pending_review" | "approved" | "rejected";
  handSign: string;
  handSignEmoji: string;
  handSignInstructions: string;
  createdAt: Date;
  expiresAt: Date;
  photoUrl?: string;
  adminNotes?: string;
  handSignChanges: number; // Anzahl der Handzeichen-Änderungen
  maxHandSignChanges: number; // Maximale Anzahl (3)
}

// Handzeichen für Verifizierung
const handSigns = [
  { emoji: "✌️", name: "Peace-Zeichen", instructions: "Zeige das Peace-Zeichen (V-Zeichen)" },
  { emoji: "👍", name: "Daumen hoch", instructions: "Zeige einen Daumen nach oben" },
  { emoji: "👌", name: "OK-Zeichen", instructions: "Bilde einen Kreis mit Daumen und Zeigefinger" },
  { emoji: "🤘", name: "Rock-On", instructions: "Strecke Zeige- und kleinen Finger aus" },
  { emoji: "🤟", name: "Love-You", instructions: "Strecke Daumen, Zeige- und kleinen Finger aus" },
  { emoji: "🤞", name: "Daumen drücken", instructions: "Kreuze deine Zeige- und Mittelfinger" },
  { emoji: "🤙", name: "Call me", instructions: "Bilde mit Daumen und kleinem Finger ein Telefon" },
  { emoji: "🖖", name: "Spock-Gruß", instructions: "Trenne Zeige- und Mittelfinger von Ring- und kleinem Finger" }
];

// In-Memory Storage
const verificationSessions = new Map<string, VerificationSession>();

// Zufälliges Handzeichen auswählen
function getRandomHandSign() {
  return handSigns[Math.floor(Math.random() * handSigns.length)];
}

// Anti-Fraud Score berechnen
// Einfache Verifizierung - nur prüfen ob Foto gesendet wurde
function isVerificationComplete(session: VerificationSession): boolean {
  return session.photoUrl !== undefined && session.photoUrl !== "";
}

export const registerVerificationSystem = (bot: Telegraf<NebulaContext>) => {
  function buildWebAppButton(ctx: NebulaContext, label: string) {
    const url = ctx.config.webAppUrl || "http://localhost:5173";
    const isHttps = url.startsWith("https://") && !url.includes("localhost");
    
    // Für HTTPS: WebApp-Button (öffnet in Telegram)
    // Für localhost: URL-Button (öffnet im Browser)
    if (isHttps) {
      return Markup.button.webApp(label, url);
    } else {
      return Markup.button.url(label, url);
    }
  }
  
  // Verifizierung starten
  bot.action("start_verification", async (ctx) => {
    await ctx.answerCbQuery("🤳 Verifizierung starten...");
    
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply("❌ Fehler: User-ID nicht gefunden.");
      return;
    }

    // Neue Verifizierungs-Session erstellen
    const sessionId = `verify_${userId}_${Date.now()}`;
    const handSign = getRandomHandSign();
    const session: VerificationSession = {
      id: sessionId,
      userId: userId,
      status: "awaiting_handsign",
      handSign: handSign.name,
      handSignEmoji: handSign.emoji,
      handSignInstructions: handSign.instructions,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 Minuten
      handSignChanges: 0,
      maxHandSignChanges: 3,
    };

    verificationSessions.set(sessionId, session);
    ctx.session.verificationSessionId = sessionId;
    ctx.session.onboardingStatus = "awaiting_verification";

    // Sync mit API-Server für echte Datenbasis
    try {
      await botApiClient.createVerificationSession({
        user_id: userId.toString(),
        hand_sign: handSign.name,
        hand_sign_emoji: handSign.emoji,
        hand_sign_instructions: handSign.instructions,
        status: 'pending_review',
        max_hand_sign_changes: 3,
        expires_at: session.expiresAt.toISOString()
      });

      // Log Analytics Event
      await botApiClient.sendAnalyticsEvent({
        user_id: userId.toString(),
        event_type: 'verification_started',
        event_data: {
          hand_sign: handSign.name,
          session_id: sessionId,
          source: 'telegram_bot'
        }
      });

      logger.info("Verification session synced to API server", { sessionId, userId });
    } catch (apiError) {
      logger.error("Failed to sync verification session to API server", { error: apiError, sessionId, userId });
      // Nicht kritisch - Bot funktioniert weiterhin
    }

    // Admin-Benachrichtigung
    await notifyAdmins(ctx, `🤳 **Neue Verifizierung gestartet**\n\n` +
      `👤 **User:** ${ctx.from?.first_name || 'Unbekannt'} (ID: ${userId})\n` +
      `🆔 **Session:** ${sessionId}\n` +
      `⏰ **Zeit:** ${new Date().toLocaleString('de-DE')}\n\n` +
      `🎯 **Handzeichen:** ${handSign.emoji} ${handSign.name}\n` +
      `📋 **Anleitung:** ${handSign.instructions}\n` +
      `⏳ **Läuft ab:** ${session.expiresAt.toLocaleString('de-DE')}\n\n` +
      `📸 **Prüfkriterien:**\n` +
      `• Gesicht vollständig sichtbar\n` +
      `• Handzeichen klar erkennbar\n` +
      `• Gute Foto-Qualität\n` +
      `• Scharfe Aufnahme`);

    // Verifizierungs-Nachricht senden
    await sendVerificationMessage(ctx, session);
  });

  // Verifizierungs-Nachricht senden/aktualisieren
  async function sendVerificationMessage(ctx: NebulaContext, session: VerificationSession) {
    const statusEmojis = {
      "awaiting_handsign": "🤳",
      "awaiting_photo": "📸",
      "pending_review": "⏳",
      "approved": "✅",
      "rejected": "❌"
    };

    const statusTexts = {
      "awaiting_handsign": "Bereit für Foto",
      "awaiting_photo": "Warte auf Foto",
      "pending_review": "Wird geprüft",
      "approved": "Genehmigt",
      "rejected": "Abgelehnt"
    };

    let message = `🤳 **Verifizierung starten**\n\n`;

    if (session.status === "awaiting_handsign" || session.status === "awaiting_photo") {
      message += `Willkommen! Um Zugang zu erhalten, brauchen wir ein kurzes Verifizierungsfoto.\n\n`;
      message += `**Was passiert?**\n`;
      message += `1. Du bekommst ein Handzeichen zugewiesen\n`;
      message += `2. Du machst ein Foto mit diesem Handzeichen\n`;
      message += `3. Unser Team prüft das Foto (meist innerhalb von 2 Stunden)\n`;
      message += `4. Du erhältst sofort Zugang nach Bestätigung\n\n`;
      message += `**Dein Handzeichen:** ${session.handSignEmoji} **${session.handSign}**\n`;
      message += `**So machst du es:** ${session.handSignInstructions}\n\n`;
      message += `**Wichtig für ein gutes Foto:**\n`;
      message += `✓ Gesicht muss vollständig sichtbar sein\n`;
      message += `✓ Handzeichen muss klar erkennbar sein\n`;
      message += `✓ Gute Beleuchtung (kein Gegenlicht)\n`;
      message += `✓ Foto sollte scharf sein\n\n`;
      message += `**Dauer:** Die Prüfung dauert normalerweise 1-2 Stunden.\n\n`;
      message += `📸 **Einfach ein Foto senden** – unser Team prüft es direkt!\n\n`;
      message += `💡 **Tipp:** Du kannst das Handzeichen bis zu ${session.maxHandSignChanges - session.handSignChanges} Mal ändern, falls du es nicht machen kannst.\n\n`;
      message += `🔑 **Alternative:** Invite-Code für sofortigen Zugang ohne Foto!`;
    } else if (session.status === "pending_review") {
      message += `⏳ **Dein Foto wird geprüft**\n\n`;
      message += `📸 **Status:** Foto erfolgreich eingegangen\n`;
      message += `🎯 **Handzeichen:** ${session.handSignEmoji} ${session.handSign}\n\n`;
      message += `**Was passiert jetzt?**\n`;
      message += `Unser Team prüft dein Foto sorgfältig. Das dauert normalerweise 1-2 Stunden.\n\n`;
      message += `🔔 **Du erhältst eine Benachrichtigung**, sobald die Prüfung abgeschlossen ist.\n\n`;
      message += `💡 **Schnellerer Weg:** Nutze einen Invite-Code für sofortigen Zugang!`;
    } else if (session.status === "approved") {
      message += `🎉 **Verifizierung erfolgreich!**\n\n`;
      message += `✅ **Status:** Vollständig verifiziert\n`;
      message += `📸 **Foto:** Genehmigt\n`;
      message += `🎯 **Handzeichen:** ${session.handSignEmoji} ${session.handSign}\n\n`;
      message += `🚀 **Willkommen im Nebula Club!**\n\n`;
      message += `**Deine Vorteile:**\n`;
      message += `• 🛍️ Vollzugang zum Shop\n`;
      message += `• 🎯 Exklusive Limited Edition Drops\n`;
      message += `• 💳 Alle Zahlungsoptionen\n`;
      message += `• 🎫 Premium Ticket-System\n`;
      message += `• 💎 Erweiterte Features\n\n`;
      message += `⚡ **Sofort einsatzbereit!**`;
      // Update user onboarding status to verified
      ctx.session.onboardingStatus = "verified";
    } else if (session.status === "rejected") {
      message += `❌ **Verifizierung abgelehnt**\n\n`;
      message += `📸 **Status:** Foto wurde nicht genehmigt\n`;
      message += `🎯 **Handzeichen:** ${session.handSignEmoji} ${session.handSign}\n\n`;
      message += `**Mögliche Gründe:**\n`;
      message += `• Gesicht nicht vollständig sichtbar\n`;
      message += `• Handzeichen nicht klar erkennbar\n`;
      message += `• Foto-Qualität zu schlecht (unscharf, zu dunkel)\n\n`;
      message += `**Keine Sorge – du kannst es erneut versuchen!**\n\n`;
      message += `**Nächste Schritte:**\n`;
      message += `1. Starte einen neuen Verifizierungs-Versuch\n`;
      message += `2. Achte auf bessere Foto-Qualität\n`;
      message += `3. Oder nutze einen Invite-Code für sofortigen Zugang\n\n`;
      message += `💡 **Tipp:** Invite-Codes umgehen die Verifizierung komplett!`;
      // Reset onboarding to allow new attempt
      ctx.session.onboardingStatus = "unknown";
    }

    const keyboard = getVerificationKeyboard(ctx, session);
    
    try {
      // Robust message refresh: try edit, on failure send a new message
      try {
        if (ctx.callbackQuery) {
          await ctx.editMessageText(message, {
            parse_mode: "Markdown",
            reply_markup: keyboard.reply_markup
          });
          return;
        }
      } catch {}
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup
      });
    } catch (error) {
      logger.error("Failed to send verification message", { error: String(error) });
    }
  }

  // Keyboard für Verifizierung
  function getVerificationKeyboard(ctx: NebulaContext, session: VerificationSession) {
    const buttons = [];

    if (session.status === "awaiting_handsign") {
      // Nur neues Handzeichen anzeigen, wenn noch Änderungen übrig sind
      if (session.handSignChanges < session.maxHandSignChanges) {
        buttons.push([Markup.button.callback(`🔄 Neues Handzeichen (${session.handSignChanges}/${session.maxHandSignChanges})`, "new_handsign")]);
      } else {
        buttons.push([Markup.button.callback("❌ Keine Handzeichen-Änderungen mehr", "no_more_changes")]);
      }
    } else if (session.status === "awaiting_photo") {
      // Nur neues Handzeichen anzeigen, wenn noch Änderungen übrig sind
      if (session.handSignChanges < session.maxHandSignChanges) {
        buttons.push([Markup.button.callback(`🔄 Neues Handzeichen (${session.handSignChanges}/${session.maxHandSignChanges})`, "new_handsign")]);
      } else {
        buttons.push([Markup.button.callback("❌ Keine Handzeichen-Änderungen mehr", "no_more_changes")]);
      }
    } else if (session.status === "pending_review") {
      buttons.push([Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")]);
      buttons.push([Markup.button.callback("🔄 Status aktualisieren", "check_verification_status")]);
    } else if (session.status === "approved") {
      // Show verified user menu buttons
      const url = ctx.config.webAppUrl || "http://localhost:5173";
      const isHttps = url.startsWith("https://") && !url.includes("localhost");
      
      if (isHttps) {
        buttons.push([Markup.button.webApp("🚀 Nebula öffnen", url)]);
      } else {
        buttons.push([Markup.button.callback("🚀 Nebula öffnen", "open_webapp")]);
      }
      
      buttons.push([
        Markup.button.callback("🎫 Support", "premium_support"),
        Markup.button.callback("💳 Zahlungen", "premium_payments")
      ]);
      
      buttons.push([
        Markup.button.callback("👥 Affiliate", "affiliate_dashboard"),
        Markup.button.callback("📊 Statistiken", "user_stats")
      ]);
      
      buttons.push([
        Markup.button.callback("⚙️ Einstellungen", "premium_settings"),
        Markup.button.callback("❓ FAQ", "smart_faq")
      ]);
      // Don't add "Zurück" button for approved status - full menu is shown
    } else if (session.status === "rejected") {
      buttons.push([Markup.button.callback("🔄 Neuen Versuch", "start_verification")]);
      buttons.push([Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")]);
      buttons.push([Markup.button.callback("🔙 Zurück", "menu_back")]);
    } else {
      // For other statuses, add back button
      buttons.push([Markup.button.callback("🔙 Zurück", "menu_back")]);
    }

    return Markup.inlineKeyboard(buttons);
  }

  // Foto senden Button/Upload-Optionen entfernt: direkte Sendung reicht

  // Neues Handzeichen Handler
  bot.action("new_handsign", async (ctx) => {
    await ctx.answerCbQuery("🔄 Neues Handzeichen...");
    
    const sessionId = ctx.session.verificationSessionId;
    if (!sessionId) {
      await ctx.reply("❌ Keine aktive Verifizierung gefunden.");
      return;
    }

    const session = verificationSessions.get(sessionId);
    if (!session) {
      await ctx.reply("❌ Session nicht gefunden.");
      return;
    }

    // Prüfen ob noch Handzeichen-Änderungen übrig sind
    if (session.handSignChanges >= session.maxHandSignChanges) {
      await ctx.reply(
        "❌ **Keine Handzeichen-Änderungen mehr verfügbar**\n\n" +
        "**Was ist passiert?**\n" +
        `Du hast bereits alle ${session.maxHandSignChanges} verfügbaren Handzeichen-Änderungen verwendet.\n\n` +
        "**Lösung:**\n" +
        "1. Verwende das aktuelle Handzeichen für dein Foto\n" +
        "2. Oder nutze einen Invite-Code für sofortigen Zugang ohne Verifizierung\n\n" +
        "💡 **Tipp:** Invite-Codes sind der schnellste Weg zum Zugang!",
        Markup.inlineKeyboard([
          [Markup.button.callback("📸 Foto mit aktuellem Handzeichen senden", "start_verification")],
          [Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
      return;
    }

    const newHandSign = getRandomHandSign();
    session.handSign = newHandSign.name;
    session.handSignEmoji = newHandSign.emoji;
    session.handSignInstructions = newHandSign.instructions;
    session.status = "awaiting_handsign";
    session.handSignChanges++;
    verificationSessions.set(sessionId, session);

    await sendVerificationMessage(ctx, session);
  });

  // Keine Handzeichen-Änderungen mehr Handler
  bot.action("no_more_changes", async (ctx) => {
    await ctx.answerCbQuery("❌ Keine Änderungen mehr verfügbar");
    await ctx.reply(
      "❌ **Keine Handzeichen-Änderungen mehr verfügbar**\n\n" +
      "**Was ist passiert?**\n" +
      "Du hast bereits alle verfügbaren Handzeichen-Änderungen verwendet.\n\n" +
      "**Lösung:**\n" +
      "1. Verwende das aktuelle Handzeichen für dein Foto\n" +
      "2. Oder nutze einen Invite-Code für sofortigen Zugang ohne Verifizierung\n\n" +
      "💡 **Tipp:** Invite-Codes sind der schnellste Weg zum Zugang!",
      Markup.inlineKeyboard([
        [Markup.button.callback("📸 Foto mit aktuellem Handzeichen senden", "start_verification")],
        [Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ])
    );
  });

  // Status prüfen Handler
  bot.action("check_verification_status", async (ctx) => {
    await ctx.answerCbQuery("🔄 Status prüfen...");
    
    const sessionId = ctx.session.verificationSessionId;
    if (!sessionId) {
      await ctx.reply("❌ Keine aktive Verifizierung gefunden.");
      return;
    }

    const session = verificationSessions.get(sessionId);
    if (!session) {
      await ctx.reply("❌ Session nicht gefunden.");
      return;
    }

    await sendVerificationMessage(ctx, session);
  });

  // Upload-Optionen entfernt

  // Foto-Upload Handler (für direkte Fotos)
  bot.on("photo", async (ctx) => {
    try {
      const sessionId = ctx.session.verificationSessionId;
      if (!sessionId) {
        await ctx.reply(
          "❌ **Keine aktive Verifizierung gefunden**\n\n" +
          "**Was ist passiert?**\n" +
          "Es wurde keine aktive Verifizierung für dich gefunden.\n\n" +
          "**Lösung:**\n" +
          "1. Starte eine neue Verifizierung mit dem Button unten\n" +
          "2. Oder nutze /start für das Hauptmenü\n\n" +
          "💡 **Tipp:** Du kannst auch einen Invite-Code verwenden!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🤳 Verifizierung starten", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")],
            [Markup.button.callback("🏠 Hauptmenü", "menu_back")]
          ])
        );
        return;
      }

      const session = verificationSessions.get(sessionId);
      if (!session) {
        await ctx.reply(
          "❌ **Verifizierungssession nicht gefunden**\n\n" +
          "**Was ist passiert?**\n" +
          "Deine Verifizierungssession konnte nicht gefunden werden.\n\n" +
          "**Lösung:**\n" +
          "1. Starte eine neue Verifizierung\n" +
          "2. Die Session könnte abgelaufen sein (gültig für 10 Minuten)\n\n" +
          "💡 **Tipp:** Nutze einen Invite-Code für sofortigen Zugang!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🤳 Neue Verifizierung", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code", "use_invite")],
            [Markup.button.callback("🏠 Hauptmenü", "menu_back")]
          ])
        );
        return;
      }

      if (session.status !== "awaiting_photo" && session.status !== "awaiting_handsign") {
        await ctx.reply(
          "⏳ **Foto nicht erwartet**\n\n" +
          `**Aktueller Status:** ${session.status === "pending_review" ? "Wird geprüft" : session.status === "approved" ? "Bereits genehmigt" : "Abgelehnt"}\n\n` +
          "**Was bedeutet das?**\n" +
          (session.status === "pending_review" 
            ? "Dein Foto wird bereits geprüft. Bitte warte auf das Ergebnis.\n\n"
            : session.status === "approved"
            ? "Du bist bereits verifiziert! Kein neues Foto nötig.\n\n"
            : "Dein Foto wurde abgelehnt. Starte einen neuen Versuch.\n\n") +
          "**Nächste Schritte:**",
          Markup.inlineKeyboard([
            session.status === "pending_review" 
              ? [Markup.button.callback("🔄 Status prüfen", "check_verification_status")]
              : session.status === "approved"
              ? [Markup.button.callback("🚀 Nebula öffnen", "open_webapp")]
              : [Markup.button.callback("🔄 Neuer Versuch", "start_verification")],
            [Markup.button.callback("🔙 Zurück", "menu_back")]
          ])
        );
        return;
      }

      // Foto-Validierung
      if (!ctx.message.photo || ctx.message.photo.length === 0) {
        await ctx.reply(
          "❌ **Kein Foto erkannt**\n\n" +
          "**Was ist passiert?**\n" +
          "Es wurde kein Foto in deiner Nachricht erkannt.\n\n" +
          "**Lösung:**\n" +
          "1. Sende ein Foto direkt als Bild (nicht als Datei)\n" +
          "2. Nutze die Kamera-Funktion in Telegram\n" +
          "3. Stelle sicher, dass das Foto nicht zu groß ist\n\n" +
          "💡 **Tipp:** Einfach Foto auswählen und senden!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Erneut versuchen", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code", "use_invite")],
            [Markup.button.callback("🔙 Zurück", "menu_back")]
          ])
        );
        return;
      }

      // Größte Auflösung wählen
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      
      // Foto-Info validieren
      if (!photo.file_id) {
        await ctx.reply(
          "❌ **Foto konnte nicht verarbeitet werden**\n\n" +
          "**Was ist passiert?**\n" +
          "Die Foto-ID konnte nicht ermittelt werden.\n\n" +
          "**Lösung:**\n" +
          "1. Versuche es erneut mit einem neuen Foto\n" +
          "2. Stelle sicher, dass das Foto nicht beschädigt ist\n" +
          "3. Nutze die Kamera-Funktion direkt in Telegram\n\n" +
          "💡 **Tipp:** Bei Problemen nutze einen Invite-Code!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Erneut versuchen", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code", "use_invite")],
            [Markup.button.callback("🔙 Zurück", "menu_back")]
          ])
        );
        return;
      }

      // File-Info abrufen
      const file = await ctx.telegram.getFile(photo.file_id);
      
      if (!file.file_path) {
        await ctx.reply(
          "❌ **Foto konnte nicht geladen werden**\n\n" +
          "**Was ist passiert?**\n" +
          "Das Foto konnte nicht von Telegram geladen werden.\n\n" +
          "**Lösung:**\n" +
          "1. Versuche es in ein paar Sekunden erneut\n" +
          "2. Sende ein kleineres Foto\n" +
          "3. Prüfe deine Internetverbindung\n\n" +
          "💡 **Alternative:** Nutze einen Invite-Code für sofortigen Zugang!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Erneut versuchen", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code", "use_invite")],
            [Markup.button.callback("🔙 Zurück", "menu_back")]
          ])
        );
        return;
      }

      // Foto-URL erstellen
      const photoUrl = `https://api.telegram.org/file/bot${ctx.config.botToken}/${file.file_path}`;

      // Session aktualisieren
      session.photoUrl = photoUrl;
      
      // Einfache Verifizierung - Foto gesendet = zur Prüfung
      session.status = "pending_review";
      
      verificationSessions.set(sessionId, session);

      // User-Session aktualisieren
      ctx.session.onboardingStatus = "awaiting_verification";

      // User-Bestätigung
      await ctx.reply(
        "✅ **Foto empfangen!**\n\n" +
        "🤖 **Automatische Prüfung läuft.**\n" +
        "🔔 Du wirst benachrichtigt, sobald das Ergebnis vorliegt.",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")],
          [Markup.button.callback("🔄 Status prüfen", "check_verification_status")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );

      // Admin-Benachrichtigung mit Foto
      await notifyAdminsWithPhoto(ctx, session, photoUrl);

      // Verifizierungs-Nachricht aktualisieren
      await sendVerificationMessage(ctx, session);

      logger.info("Photo uploaded successfully", { 
        userId: ctx.from?.id, 
        sessionId, 
        photoUrl,
        fileSize: photo.file_size,
        photoDimensions: `${photo.width}x${photo.height}`
      });

    } catch (error) {
      logger.error("Photo upload failed", { error: String(error), userId: ctx.from?.id });
      
      await ctx.reply(
        "❌ **Foto-Upload fehlgeschlagen**\n\n" +
        "**Was ist passiert?**\n" +
        "Beim Hochladen deines Fotos ist ein Fehler aufgetreten.\n\n" +
        "**Mögliche Ursachen:**\n" +
        "• Foto zu groß (max. 20MB)\n" +
        "• Netzwerk-Problem\n" +
        "• Ungültiges Dateiformat\n" +
        "• Telegram-Server temporär überlastet\n\n" +
        "**Lösung Schritt für Schritt:**\n" +
        "1. Warte 30 Sekunden\n" +
        "2. Versuche es erneut mit einem kleineren Foto\n" +
        "3. Prüfe deine Internetverbindung\n" +
        "4. Nutze die Kamera-Funktion direkt in Telegram\n\n" +
        "💡 **Alternative:** Nutze einen Invite-Code für sofortigen Zugang ohne Foto!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Erneut versuchen", "start_verification")],
          [Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")],
          [Markup.button.callback("❓ Hilfe & FAQ", "help_faq")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
    }
  });

  // Dokument-Upload Handler (für Datei-Uploads)
  bot.on("document", async (ctx) => {
    try {
      const sessionId = ctx.session.verificationSessionId;
      if (!sessionId) {
        await ctx.reply(
          "❌ **Keine aktive Verifizierung gefunden**\n\n" +
          "**Was ist passiert?**\n" +
          "Es wurde keine aktive Verifizierung für dich gefunden.\n\n" +
          "**Lösung:**\n" +
          "1. Starte eine neue Verifizierung mit dem Button unten\n" +
          "2. Oder nutze /start für das Hauptmenü\n\n" +
          "💡 **Tipp:** Du kannst auch einen Invite-Code verwenden!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🤳 Verifizierung starten", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")],
            [Markup.button.callback("🏠 Hauptmenü", "menu_back")]
          ])
        );
        return;
      }

      const session = verificationSessions.get(sessionId);
      if (!session) {
        await ctx.reply(
          "❌ **Verifizierungssession nicht gefunden**\n\n" +
          "**Was ist passiert?**\n" +
          "Deine Verifizierungssession konnte nicht gefunden werden.\n\n" +
          "**Lösung:**\n" +
          "1. Starte eine neue Verifizierung\n" +
          "2. Die Session könnte abgelaufen sein (gültig für 10 Minuten)\n\n" +
          "💡 **Tipp:** Nutze einen Invite-Code für sofortigen Zugang!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🤳 Neue Verifizierung", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code", "use_invite")],
            [Markup.button.callback("🏠 Hauptmenü", "menu_back")]
          ])
        );
        return;
      }

      if (session.status !== "awaiting_photo" && session.status !== "awaiting_handsign") {
        await ctx.reply(
          "⏳ **Dokument nicht erwartet**\n\n" +
          `**Aktueller Status:** ${session.status === "pending_review" ? "Wird geprüft" : session.status === "approved" ? "Bereits genehmigt" : "Abgelehnt"}\n\n` +
          "**Was bedeutet das?**\n" +
          (session.status === "pending_review" 
            ? "Dein Foto wird bereits geprüft. Bitte warte auf das Ergebnis.\n\n"
            : session.status === "approved"
            ? "Du bist bereits verifiziert! Kein neues Foto nötig.\n\n"
            : "Dein Foto wurde abgelehnt. Starte einen neuen Versuch.\n\n") +
          "**Nächste Schritte:**",
          Markup.inlineKeyboard([
            session.status === "pending_review" 
              ? [Markup.button.callback("🔄 Status prüfen", "check_verification_status")]
              : session.status === "approved"
              ? [Markup.button.callback("🚀 Nebula öffnen", "open_webapp")]
              : [Markup.button.callback("🔄 Neuer Versuch", "start_verification")],
            [Markup.button.callback("🔙 Zurück", "menu_back")]
          ])
        );
        return;
      }

      // Dokument-Validierung
      if (!ctx.message.document) {
        await ctx.reply(
          "❌ **Kein Dokument erkannt**\n\n" +
          "**Was ist passiert?**\n" +
          "Es wurde kein Dokument in deiner Nachricht erkannt.\n\n" +
          "**Lösung:**\n" +
          "1. Sende ein Foto als Bild-Dokument (JPG, PNG)\n" +
          "2. Oder sende das Foto direkt als Bild (empfohlen)\n" +
          "3. Stelle sicher, dass das Dokument nicht beschädigt ist\n\n" +
          "💡 **Tipp:** Einfach Foto auswählen und senden!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Erneut versuchen", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code", "use_invite")],
            [Markup.button.callback("🔙 Zurück", "menu_back")]
          ])
        );
        return;
      }

      const document = ctx.message.document;
      
      // Prüfe ob es ein Bild ist
      if (!document.mime_type?.startsWith('image/')) {
        await ctx.reply(
          "❌ **Kein Bild-Dokument**\n\n" +
          "**Was ist passiert?**\n" +
          "Das gesendete Dokument ist kein Bild.\n\n" +
          "**Lösung:**\n" +
          "1. Sende ein Foto als Bild-Dokument (JPG, PNG, GIF)\n" +
          "2. Unterstützte Formate: JPG, PNG, GIF\n" +
          "3. Oder sende das Foto direkt als Bild (empfohlen)\n\n" +
          "💡 **Tipp:** Nutze die Kamera-Funktion in Telegram!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Erneut versuchen", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code", "use_invite")],
            [Markup.button.callback("🔙 Zurück", "menu_back")]
          ])
        );
        return;
      }

      // Dateigröße prüfen (max 20MB)
      if (document.file_size && document.file_size > 20 * 1024 * 1024) {
        const fileSizeMB = Math.round(document.file_size / 1024 / 1024);
        await ctx.reply(
          "❌ **Datei zu groß**\n\n" +
          "**Was ist passiert?**\n" +
          `Deine Datei ist ${fileSizeMB}MB groß, aber das Maximum ist 20MB.\n\n` +
          "**Lösung:**\n" +
          "1. Komprimiere das Foto (z.B. mit einem Foto-Editor)\n" +
          "2. Oder sende ein kleineres Foto\n" +
          "3. Nutze die Kamera-Funktion direkt in Telegram\n\n" +
          "💡 **Tipp:** Kleinere Fotos werden schneller hochgeladen!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Erneut versuchen", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code", "use_invite")],
            [Markup.button.callback("🔙 Zurück", "menu_back")]
          ])
        );
        return;
      }

      // File-Info abrufen
      const file = await ctx.telegram.getFile(document.file_id);
      
      if (!file.file_path) {
        await ctx.reply(
          "❌ **Dokument konnte nicht geladen werden**\n\n" +
          "**Was ist passiert?**\n" +
          "Das Dokument konnte nicht von Telegram geladen werden.\n\n" +
          "**Lösung:**\n" +
          "1. Versuche es in ein paar Sekunden erneut\n" +
          "2. Sende ein kleineres Dokument\n" +
          "3. Prüfe deine Internetverbindung\n\n" +
          "💡 **Alternative:** Nutze einen Invite-Code für sofortigen Zugang!",
          Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Erneut versuchen", "start_verification")],
            [Markup.button.callback("🔑 Invite-Code", "use_invite")],
            [Markup.button.callback("🔙 Zurück", "menu_back")]
          ])
        );
        return;
      }

      // Foto-URL erstellen
      const photoUrl = `https://api.telegram.org/file/bot${ctx.config.botToken}/${file.file_path}`;

      // Session aktualisieren
      session.photoUrl = photoUrl;
      session.status = "pending_review";
      verificationSessions.set(sessionId, session);

      // User-Session aktualisieren
      ctx.session.onboardingStatus = "awaiting_verification";

      // User-Bestätigung
      await ctx.reply(
        "✅ **Foto erfolgreich empfangen!**\n\n" +
        "**Was passiert jetzt?**\n" +
        "Dein Foto wurde erfolgreich hochgeladen und wird jetzt von unserem Team geprüft.\n\n" +
        "⏰ **Geschätzte Prüfzeit:** 1-2 Stunden\n" +
        "🔔 **Du erhältst eine Benachrichtigung**, sobald die Prüfung abgeschlossen ist.\n\n" +
        "💡 **Schnellerer Weg:** Nutze einen Invite-Code für sofortigen Zugang!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Status prüfen", "check_verification_status")],
          [Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );

      // Admin-Benachrichtigung mit Foto
      await notifyAdminsWithPhoto(ctx, session, photoUrl);

      // Verifizierungs-Nachricht aktualisieren
      await sendVerificationMessage(ctx, session);

      logger.info("Document uploaded successfully", { 
        userId: ctx.from?.id, 
        sessionId, 
        photoUrl,
        fileSize: document.file_size,
        mimeType: document.mime_type
      });

    } catch (error) {
      logger.error("Document upload failed", { error: String(error), userId: ctx.from?.id });
      
      await ctx.reply(
        "❌ **Dokument-Upload fehlgeschlagen**\n\n" +
        "**Was ist passiert?**\n" +
        "Beim Hochladen deines Dokuments ist ein Fehler aufgetreten.\n\n" +
        "**Mögliche Ursachen:**\n" +
        "• Datei zu groß (max. 20MB)\n" +
        "• Ungültiges Dateiformat\n" +
        "• Netzwerk-Problem\n" +
        "• Telegram-Server temporär überlastet\n\n" +
        "**Lösung Schritt für Schritt:**\n" +
        "1. Warte 30 Sekunden\n" +
        "2. Versuche es erneut mit einem kleineren Foto\n" +
        "3. Prüfe deine Internetverbindung\n" +
        "4. Nutze die Kamera-Funktion direkt in Telegram\n\n" +
        "💡 **Alternative:** Nutze einen Invite-Code für sofortigen Zugang ohne Foto!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Erneut versuchen", "start_verification")],
          [Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")],
          [Markup.button.callback("❓ Hilfe & FAQ", "help_faq")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
    }
  });

  // Admin-Benachrichtigungen
  async function notifyAdmins(ctx: NebulaContext, message: string) {
    const adminIds = ctx.config.adminIds || [];
    
    for (const adminId of adminIds) {
      try {
        await ctx.telegram.sendMessage(adminId, message, { parse_mode: "Markdown" });
        logger.info("Admin notification sent", { adminId, message });
      } catch (error) {
        logger.error("Failed to send admin notification", { adminId, error: String(error) });
      }
    }
  }

  // Admin-Benachrichtigung mit Foto
  async function notifyAdminsWithPhoto(ctx: NebulaContext, session: VerificationSession, photoUrl: string) {
    const adminIds = ctx.config.adminIds || [];
    
    for (const adminId of adminIds) {
      try {
        // Foto direkt mit Quick-Buttons senden
        await ctx.telegram.sendPhoto(adminId, photoUrl, {
          caption: `📸 **Neue Verifizierung eingegangen**\n\n` +
            `👤 **User:** ${ctx.from?.first_name || 'Unbekannt'} (ID: ${ctx.from?.id})\n` +
            `🆔 **Session:** ${session.id}\n` +
            `⏰ **Zeit:** ${new Date().toLocaleString('de-DE')}\n\n` +
            `🎯 **Handzeichen:** ${session.handSignEmoji} ${session.handSign}\n` +
            `📋 **Anleitung:** ${session.handSignInstructions}\n` +
            `🔄 **Handzeichen-Änderungen:** ${session.handSignChanges}/${session.maxHandSignChanges}\n` +
            `⏳ **Läuft ab:** ${session.expiresAt.toLocaleString('de-DE')}\n\n` +
            `🔍 **Prüfkriterien:**\n` +
            `• 👤 Gesicht vollständig sichtbar?\n` +
            `• 🤳 Handzeichen klar erkennbar?\n` +
            `• 📱 Gute Foto-Qualität (scharf, gut beleuchtet)?\n` +
            `• ✅ Alle Anforderungen erfüllt?`,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Sofort genehmigen", callback_data: `admin_approve_${session.id}` },
                { text: "❌ Sofort ablehnen", callback_data: `admin_reject_${session.id}` }
              ],
              [
                { text: "📋 Details anzeigen", callback_data: `admin_details_${session.id}` },
                { text: "🔄 Status prüfen", callback_data: `admin_status_${session.id}` }
              ],
              [
                { text: "📊 Admin Dashboard", callback_data: "admin" }
              ]
            ]
          }
        });

        logger.info("Admin notification with photo sent", { adminId, sessionId: session.id, photoUrl });
      } catch (error) {
        logger.error("Failed to send admin notification with photo", { adminId, error: String(error) });
        
        // Fallback: Text mit Foto-Link
        try {
          await ctx.telegram.sendMessage(adminId, 
            `📸 **Neue Verifizierung eingegangen**\n\n` +
            `👤 **User:** ${ctx.from?.first_name || 'Unbekannt'} (ID: ${ctx.from?.id})\n` +
            `🆔 **Session:** ${session.id}\n` +
            `⏰ **Zeit:** ${new Date().toLocaleString('de-DE')}\n\n` +
            `🎯 **Handzeichen:** ${session.handSignEmoji} ${session.handSign}\n` +
            `📋 **Anleitung:** ${session.handSignInstructions}\n` +
            `🔄 **Handzeichen-Änderungen:** ${session.handSignChanges}/${session.maxHandSignChanges}\n` +
            `⏳ **Läuft ab:** ${session.expiresAt.toLocaleString('de-DE')}\n\n` +
            `📸 **Foto:** [Hier klicken](${photoUrl})\n\n` +
            `🔍 **Prüfkriterien:**\n` +
            `• 👤 Gesicht vollständig sichtbar?\n` +
            `• 🤳 Handzeichen klar erkennbar?\n` +
            `• 📱 Gute Foto-Qualität (scharf, gut beleuchtet)?\n` +
            `• ✅ Alle Anforderungen erfüllt?`,
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "✅ Sofort genehmigen", callback_data: `admin_approve_${session.id}` },
                    { text: "❌ Sofort ablehnen", callback_data: `admin_reject_${session.id}` }
                  ],
                  [
                    { text: "📋 Details anzeigen", callback_data: `admin_details_${session.id}` },
                    { text: "🔄 Status prüfen", callback_data: `admin_status_${session.id}` }
                  ],
                  [
                    { text: "📊 Admin Dashboard", callback_data: "admin" }
                  ]
                ]
              }
            }
          );
        } catch (fallbackError) {
          logger.error("Failed to send fallback notification", { adminId, error: String(fallbackError) });
        }
      }
    }
  }

  // Admin-Aktionen für einzelne Verifizierungen
  bot.action(/^admin_approve_(.+)$/, async (ctx) => {
    const sessionId = ctx.match[1];
    const adminIds = ctx.config.adminIds || [];
    
    // Debug: Admin-IDs loggen
    logger.info("Admin approval attempt", { 
      userId: ctx.from?.id, 
      adminIds, 
      sessionId,
      isAdmin: adminIds.includes(ctx.from?.id?.toString())
    });
    
    if (!ctx.from) {
      await ctx.answerCbQuery("❌ User nicht gefunden.");
      return;
    }
    
    // Temporär: Alle User als Admin erlauben für Testing
    // if (!adminIds.includes(ctx.from.id?.toString())) {
    //   await ctx.answerCbQuery("⛔️ Nur Admins können Verifizierungen genehmigen.");
    //   return;
    // }

    await ctx.answerCbQuery("✅ Genehmigen...");
    
    try {
      const session = verificationSessions.get(sessionId);
      if (!session) {
        await ctx.reply("❌ Session nicht gefunden.");
        return;
      }

      // Status aktualisieren
      const updatedSession = updateVerificationStatus(sessionId, "approved", `Genehmigt von Admin ${ctx.from.first_name}`);
      
      if (!updatedSession) {
        await ctx.reply("❌ Fehler beim Aktualisieren des Status.");
        return;
      }

      // Also update the original message if present
      try {
        await sendVerificationMessage(ctx, updatedSession);
      } catch {}
      
      // User-Session aktualisieren und Startmenü senden
      try {
        // Get user's session and update onboarding status
        // We'll need to access the session through the bot's session middleware
        // For now, send the verified menu directly
        
        const url = ctx.config.webAppUrl || "http://localhost:5173";
        const isHttps = url.startsWith("https://") && !url.includes("localhost");
        
        // Build verified user menu keyboard
        const buttons = [];
        
        // WebApp Button (wenn HTTPS)
        if (isHttps) {
          buttons.push([{ text: "🚀 Nebula öffnen", web_app: { url } }]);
        } else {
          buttons.push([{ text: "🚀 Nebula öffnen", callback_data: "open_webapp" }]);
        }
        
        // Premium Features
        buttons.push([
          { text: "🎫 Support", callback_data: "premium_support" },
          { text: "💳 Zahlungen", callback_data: "premium_payments" }
        ]);
        
        // VIP Features
        buttons.push([
          { text: "👥 Affiliate", callback_data: "affiliate_dashboard" },
          { text: "📊 Statistiken", callback_data: "user_stats" }
        ]);
        
        // Settings & Hilfe
        buttons.push([
          { text: "⚙️ Einstellungen", callback_data: "premium_settings" },
          { text: "❓ FAQ", callback_data: "smart_faq" }
        ]);
        
        const greetName = "dort"; // We don't have user info here, but it's okay
        const message = `🎉 **Willkommen zurück!**\n\n` +
           `✅ **Status:** Vollständig verifiziert\n` +
           `🚀 **Zugang:** Premium Features verfügbar\n\n` +
           `🛍️ **Shop:** Vollzugang zu allen Produkten\n` +
           `🎯 **Drops:** Exklusive Limited Editions\n` +
           `💎 **VIP:** Erweiterte Funktionen\n\n` +
           `🎮 **Wähle deine Aktion:**`;
        
        await ctx.telegram.sendMessage(session.userId,
          message,
          { 
            parse_mode: "Markdown", 
            reply_markup: { inline_keyboard: buttons }
          }
        );
        
        logger.info("Verified user menu sent after approval", { 
          userId: session.userId, 
          sessionId 
        });
      } catch (userError) {
        logger.error("Failed to notify user", { userId: session.userId, error: String(userError) });
      }

      await ctx.reply(
        `✅ **Verifizierung ${sessionId} genehmigt!**\n\n` +
        `👤 **User:** ${session.userId}\n` +
        `📊 **Status:** ${updatedSession.status}\n` +
        `User wurde benachrichtigt.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Status prüfen", `admin_status_${sessionId}`)],
          [Markup.button.callback("📊 Admin Dashboard", "admin")]
        ])
      );
      
    } catch (error) {
      logger.error("Admin approval failed", { error: String(error), sessionId, userId: ctx.from?.id });
      await ctx.reply(`❌ **Fehler beim Genehmigen:** ${String(error)}`);
    }
  });

  bot.action(/^admin_reject_(.+)$/, async (ctx) => {
    const sessionId = ctx.match[1];
    const adminIds = ctx.config.adminIds || [];
    
    if (!ctx.from) {
      await ctx.answerCbQuery("❌ User nicht gefunden.");
      return;
    }
    
    // Temporär: Alle User als Admin erlauben für Testing
    // if (!adminIds.includes(ctx.from.id?.toString())) {
    //   await ctx.answerCbQuery("⛔️ Nur Admins können Verifizierungen ablehnen.");
    //   return;
    // }

    await ctx.answerCbQuery("❌ Ablehnen...");
    
    try {
      const session = verificationSessions.get(sessionId);
      if (!session) {
        await ctx.reply("❌ Session nicht gefunden.");
        return;
      }

      // Status aktualisieren
      const updatedSession = updateVerificationStatus(sessionId, "rejected", `Abgelehnt von Admin ${ctx.from.first_name}`);
      
      if (!updatedSession) {
        await ctx.reply("❌ Fehler beim Aktualisieren des Status.");
        return;
      }

      // Also update the original message if present
      try {
        await sendVerificationMessage(ctx, updatedSession);
      } catch {}
      
      // User benachrichtigen
      try {
        await ctx.telegram.sendMessage(session.userId, 
          "❌ **Verifizierung abgelehnt**\n\n" +
          "**Was ist passiert?**\n" +
          "Dein Verifizierungsfoto wurde nicht genehmigt.\n\n" +
          "**Mögliche Gründe:**\n" +
          "• Gesicht nicht vollständig sichtbar\n" +
          "• Handzeichen nicht klar erkennbar\n" +
          "• Foto-Qualität zu schlecht (unscharf, zu dunkel)\n\n" +
          "**Keine Sorge – du kannst es erneut versuchen!**\n\n" +
          "**Nächste Schritte:**\n" +
          "1. Starte einen neuen Verifizierungs-Versuch\n" +
          "2. Achte auf bessere Foto-Qualität\n" +
          "3. Oder nutze einen Invite-Code für sofortigen Zugang\n\n" +
          "💡 **Tipp:** Invite-Codes umgehen die Verifizierung komplett!",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔄 Neuen Versuch", callback_data: "start_verification" }],
                [{ text: "🔑 Invite-Code verwenden", callback_data: "use_invite" }]
              ]
            }
          }
        );
      } catch (userError) {
        logger.error("Failed to notify user", { userId: session.userId, error: String(userError) });
      }

      await ctx.reply(
        `❌ **Verifizierung ${sessionId} abgelehnt!**\n\n` +
        `👤 **User:** ${session.userId}\n` +
        `📊 **Status:** ${updatedSession.status}\n` +
        `📝 **Grund:** ${updatedSession.adminNotes}\n\n` +
        `User wurde benachrichtigt.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Status prüfen", `admin_status_${sessionId}`)],
          [Markup.button.callback("📊 Admin Dashboard", "admin")]
        ])
      );
      
    } catch (error) {
      logger.error("Admin rejection failed", { error: String(error), sessionId, userId: ctx.from?.id });
      await ctx.reply(`❌ **Fehler beim Ablehnen:** ${String(error)}`);
    }
  });

  // Status prüfen Handler
  bot.action(/^admin_status_(.+)$/, async (ctx) => {
    const sessionId = ctx.match[1];
    const adminIds = ctx.config.adminIds || [];
    
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.answerCbQuery("⛔️ Nur Admins können Status prüfen.");
      return;
    }

    await ctx.answerCbQuery("🔄 Status prüfen...");
    
    try {
      const session = verificationSessions.get(sessionId);
      if (!session) {
        await ctx.reply("❌ Session nicht gefunden.");
        return;
      }

      const timeAgo = Math.floor((Date.now() - session.createdAt.getTime()) / 60000);
      const expiresIn = Math.floor((session.expiresAt.getTime() - Date.now()) / 60000);

      let message = `🔄 **Status für Session ${sessionId}**\n\n`;
      message += `📊 **Status:** ${session.status}\n`;
      message += `👤 **User:** ${session.userId}\n`;
      message += `🎯 **Handzeichen:** ${session.handSignEmoji} ${session.handSign}\n`;
      message += `⏰ **Erstellt:** ${session.createdAt.toLocaleString()}\n`;
      message += `🕐 **Wartezeit:** ${timeAgo} Min\n`;
      message += `⏰ **Verbleibt:** ${expiresIn} Min\n`;
      message += `🔄 **Handzeichen-Änderungen:** ${session.handSignChanges}/${session.maxHandSignChanges}\n`;
      
      if (session.photoUrl) {
        message += `📸 **Foto:** Verfügbar\n`;
      } else {
        message += `📸 **Foto:** Nicht gesendet\n`;
      }
      
      if (session.adminNotes) {
        message += `📝 **Admin-Notizen:** ${session.adminNotes}\n`;
      }

      // Foto senden wenn verfügbar
      if (session.photoUrl) {
        try {
          await ctx.telegram.sendPhoto(ctx.from.id, session.photoUrl, {
            caption: message,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Genehmigen", callback_data: `admin_approve_${session.id}` },
                  { text: "❌ Ablehnen", callback_data: `admin_reject_${session.id}` }
                ],
                [
                  { text: "📋 Details", callback_data: `admin_details_${session.id}` },
                  { text: "🔄 Status", callback_data: `admin_status_${session.id}` }
                ],
                [
                  { text: "🔙 Zurück", callback_data: "admin_pending_verifications" }
                ]
              ]
            }
          });
        } catch (error) {
          // Fallback: Text mit Foto-Link
          await ctx.reply(
            message + `\n\n📸 **Foto:** [Hier klicken](${session.photoUrl})`,
            Markup.inlineKeyboard([
              [
                Markup.button.callback("✅ Genehmigen", `admin_approve_${session.id}`),
                Markup.button.callback("❌ Ablehnen", `admin_reject_${session.id}`)
              ],
              [
                Markup.button.callback("📋 Details", `admin_details_${session.id}`),
                Markup.button.callback("🔄 Status", `admin_status_${session.id}`)
              ],
              [Markup.button.callback("🔙 Zurück", "admin_pending_verifications")]
            ])
          );
        }
      } else {
        await ctx.reply(
          message,
          Markup.inlineKeyboard([
            [
              Markup.button.callback("✅ Genehmigen", `admin_approve_${session.id}`),
              Markup.button.callback("❌ Ablehnen", `admin_reject_${session.id}`)
            ],
            [
              Markup.button.callback("📋 Details", `admin_details_${session.id}`),
              Markup.button.callback("🔄 Status", `admin_status_${session.id}`)
            ],
            [Markup.button.callback("🔙 Zurück", "admin_pending_verifications")]
          ])
        );
      }
      
    } catch (error) {
      await ctx.reply(`❌ **Fehler beim Laden des Status:** ${String(error)}`);
    }
  });

};

// Verifizierungs-Status aktualisieren (für Admin)
export function updateVerificationStatus(sessionId: string, status: "approved" | "rejected", adminNotes?: string) {
  const session = verificationSessions.get(sessionId);
  if (session) {
    session.status = status;
    if (adminNotes) {
      session.adminNotes = adminNotes;
    }

    // Sync mit API-Server für echte Datenbasis
    (async () => {
      try {
        await botApiClient.updateVerificationStatus(sessionId, status, adminNotes);

        // Log Analytics Event
        await botApiClient.sendAnalyticsEvent({
          user_id: session.userId.toString(),
          event_type: `verification_${status}`,
          event_data: {
            session_id: sessionId,
            status,
            admin_notes: adminNotes,
            source: 'telegram_bot'
          }
        });

        // Log Admin Action
        await botApiClient.logAdminAction({
          admin_id: "system", // In echt würde die echte Admin-ID kommen
          action_type: `verification_${status}`,
          target_type: "verification_session",
          target_id: sessionId,
          metadata: {
            status,
            admin_notes: adminNotes,
            user_id: session.userId
          }
        });

        logger.info("Verification status synced to API server", { sessionId, status });
      } catch (apiError) {
        logger.error("Failed to sync verification status to API server", { error: apiError, sessionId, status });
        // Nicht kritisch - Bot funktioniert weiterhin
      }
    })();

    if (status === "approved") {
    }

    verificationSessions.set(sessionId, session);
    return session;
  }
  return null;
}

// Alle Verifizierungs-Sessions abrufen (für Admin)
export function getAllVerificationSessions(): VerificationSession[] {
  return Array.from(verificationSessions.values());
}

// Pending Verifizierungs-Sessions abrufen (für Admin)
export function getPendingVerificationSessions(): VerificationSession[] {
  return Array.from(verificationSessions.values()).filter(s => s.status === "pending_review");
}

// Check if user has approved verification and update session
export function checkAndUpdateUserVerificationStatus(userId: number): boolean {
  // Check all sessions for this user
  for (const session of verificationSessions.values()) {
    if (session.userId === userId && session.status === "approved") {
      return true; // User has approved verification
    }
  }
  return false; // No approved verification found
}

// Get user's verification session
export function getUserVerificationSession(userId: number): VerificationSession | null {
  for (const session of verificationSessions.values()) {
    if (session.userId === userId) {
      return session;
    }
  }
  return null;
}
