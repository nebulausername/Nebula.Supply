import { Markup, Telegraf } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext, OnboardingStatus } from "../types";
import { navigationManager } from "../utils/navigationManager";
import { quickCommandHandler } from "../utils/quickCommandHandler";
import { buttonRegistry } from "../utils/buttonRegistry";
import { checkAndUpdateUserVerificationStatus } from "./verificationSystem";

/**
 * User display information interface
 * Contains all relevant data for personalized greetings
 */
interface UserDisplayInfo {
  displayName: string;
  hasName: boolean;
  isPhoneNumber: boolean;
  greetingType: 'name' | 'username' | 'phone';
}

/**
 * Intelligently detects and formats user display name
 * 
 * Priority order:
 * 1. First name + Last name (full name)
 * 2. First name only
 * 3. Username (if not a phone number pattern)
 * 4. Phone number (with special handling message)
 * 5. Fallback to generic greeting
 * 
 * @param ctx - Telegram bot context
 * @returns UserDisplayInfo with display name and metadata
 */
const getUserDisplayName = (ctx: NebulaContext): UserDisplayInfo => {
  const from = ctx.from;
  
  // Safety check: no user data available
  if (!from) {
    return {
      displayName: "dort",
      hasName: false,
      isPhoneNumber: false,
      greetingType: 'name'
    };
  }

  const firstName = from.first_name?.trim();
  const lastName = from.last_name?.trim();
  const username = from.username?.trim();
  
  // Check if we have a proper name (first_name or last_name)
  const hasFirstName = !!firstName && firstName.length > 0;
  const hasLastName = !!lastName && lastName.length > 0;
  
  // Priority 1: Full name (first + last)
  if (hasFirstName && hasLastName) {
    return {
      displayName: `${firstName} ${lastName}`,
      hasName: true,
      isPhoneNumber: false,
      greetingType: 'name'
    };
  }
  
  // Priority 2: First name only
  if (hasFirstName) {
    return {
      displayName: firstName,
      hasName: true,
      isPhoneNumber: false,
      greetingType: 'name'
    };
  }
  
  // Priority 3: Username (if it's not a phone number pattern)
  // Improved phone number pattern: 
  // - Starts with optional + or country code
  // - Contains at least 7 digits (minimum for a phone number)
  // - May contain spaces, dashes, parentheses for formatting
  const phoneNumberPattern = /^\+?[\d\s\-()]{7,}$/;
  const hasMinimumDigits = (str: string) => (str.match(/\d/g) || []).length >= 7;
  
  if (username) {
    const isPhoneLike = phoneNumberPattern.test(username) && hasMinimumDigits(username);
    
    if (!isPhoneLike) {
      // Valid username (not a phone number)
      return {
        displayName: username,
        hasName: false,
        isPhoneNumber: false,
        greetingType: 'username'
      };
    }
  }
  
  // Priority 4: Phone number detected or no identifying info
  const looksLikePhone = username ? (phoneNumberPattern.test(username) && hasMinimumDigits(username)) : false;
  const hasNoIdentifyingInfo = !hasFirstName && !username;
  
  if (looksLikePhone || hasNoIdentifyingInfo) {
    // Try to get phone number from user object if available
    // Note: Telegram API doesn't always provide phone_number in bot context
    // Format phone number for display if it's very long
    let phoneNumber = (from as any).phone_number || username;
    
    if (!phoneNumber || phoneNumber === "deine Telefonnummer") {
      // Better fallback - don't show generic text, use a more natural approach
      phoneNumber = null; // Will trigger special handling in message
    }
    
    return {
      displayName: phoneNumber || "dein Profil",
      hasName: false,
      isPhoneNumber: true,
      greetingType: 'phone'
    };
  }
  
  // Priority 5: Fallback
  return {
    displayName: "dort",
    hasName: false,
    isPhoneNumber: false,
    greetingType: 'name'
  };
};

/**
 * Formats a professional welcome message based on user status and name availability
 * 
 * Handles different user states:
 * - Verified users: Warm, personal greeting with full feature access
 * - Awaiting verification: Status update with next steps
 * - New users: Welcoming message with clear onboarding path
 * - Phone number only: Professional message encouraging name setup
 * 
 * @param ctx - Telegram bot context
 * @param status - Current onboarding status of the user
 * @returns Formatted welcome message string
 */
const formatWelcomeMessage = (ctx: NebulaContext, status: OnboardingStatus): string => {
  const userInfo = getUserDisplayName(ctx);
  const botName = ctx.config.botName || "Nebula";
  
  // Handle phone number case with professional message
  if (userInfo.isPhoneNumber && userInfo.greetingType === 'phone') {
    const phoneDisplay = userInfo.displayName;
    const hasPhoneNumber = phoneDisplay && phoneDisplay !== "dein Profil";
    
    // Different messages based on whether we have actual phone number or just no name
    if (hasPhoneNumber) {
      return `👋 **Herzlich willkommen bei ${botName}!**\n\n` +
             `📱 Ich sehe aktuell deine Telefonnummer: \`${phoneDisplay}\`\n\n` +
             `💡 **Persönlichere Begrüßung:**\n` +
             `Du kannst deinen Namen jederzeit in deinen Telegram-Einstellungen ändern. ` +
             `Ich würde dich gerne mit deinem Namen begrüßen, damit unsere Kommunikation persönlicher wird.\n\n` +
             `⚙️ **So änderst du es:**\n` +
             `1. Öffne Telegram Einstellungen (☰ Menü → Einstellungen)\n` +
             `2. Gehe zu "Profil bearbeiten"\n` +
             `3. Füge deinen Vor- und Nachnamen hinzu\n\n` +
             `🚀 **Bis dahin:** Lass uns mit der Verifizierung starten!`;
    } else {
      // No phone number visible, just no name set
      return `👋 **Herzlich willkommen bei ${botName}!**\n\n` +
             `Willkommen bei deiner exklusiven Platform für Premium Drops und Events.\n\n` +
             `💡 **Persönlichere Begrüßung:**\n` +
             `Ich würde dich gerne mit deinem Namen begrüßen! ` +
             `Du kannst deinen Namen jederzeit in deinen Telegram-Einstellungen hinzufügen.\n\n` +
             `⚙️ **So fügst du deinen Namen hinzu:**\n` +
             `1. Öffne Telegram Einstellungen (☰ Menü → Einstellungen)\n` +
             `2. Gehe zu "Profil bearbeiten"\n` +
             `3. Füge deinen Vor- und Nachnamen hinzu\n\n` +
             `🚀 **Lass uns starten:** Beginne mit der Verifizierung!`;
    }
  }
  
  // Verified users - warm, personal greeting
  if (status === "verified") {
    if (userInfo.hasName) {
      return `🎉 **Herzlich willkommen zurück, ${userInfo.displayName}!**\n\n` +
             `✅ **Status:** Vollständig verifiziert\n` +
             `🚀 **Zugang:** Premium Features verfügbar\n\n` +
             `🛍️ **Shop:** Vollzugang zu allen Produkten\n` +
             `🎯 **Drops:** Exklusive Limited Editions\n` +
             `💎 **VIP:** Erweiterte Funktionen\n\n` +
             `🎮 **Wähle deine Aktion:**`;
    } else {
      return `🎉 **Willkommen zurück, ${userInfo.displayName}!**\n\n` +
             `✅ **Status:** Vollständig verifiziert\n` +
             `🚀 **Zugang:** Premium Features verfügbar\n\n` +
             `🛍️ **Shop:** Vollzugang zu allen Produkten\n` +
             `🎯 **Drops:** Exklusive Limited Editions\n` +
             `💎 **VIP:** Erweiterte Funktionen\n\n` +
             `🎮 **Wähle deine Aktion:**`;
    }
  }
  
  // Awaiting verification
  if (status === "awaiting_verification") {
    if (userInfo.hasName) {
      return `⏳ **Hallo ${userInfo.displayName}, deine Verifizierung läuft!**\n\n` +
             `**Was passiert jetzt?**\n` +
             `Dein Foto wird von unserem Team geprüft. Das dauert normalerweise 1-2 Stunden.\n\n` +
             `🔔 **Du erhältst eine Benachrichtigung**, sobald die Prüfung abgeschlossen ist.\n\n` +
             `💡 **Schnellerer Weg:** Nutze einen Invite-Code für sofortigen Zugang!\n\n` +
             `🎯 **Nächste Schritte:**`;
    } else {
      return `⏳ **Deine Verifizierung läuft!**\n\n` +
             `**Was passiert jetzt?**\n` +
             `Dein Foto wird von unserem Team geprüft. Das dauert normalerweise 1-2 Stunden.\n\n` +
             `🔔 **Du erhältst eine Benachrichtigung**, sobald die Prüfung abgeschlossen ist.\n\n` +
             `💡 **Schnellerer Weg:** Nutze einen Invite-Code für sofortigen Zugang!\n\n` +
             `🎯 **Nächste Schritte:**`;
    }
  }
  
  // New users - welcoming message with clear next steps
  if (status === "unknown") {
    if (userInfo.hasName) {
      return `🌟 **Herzlich willkommen, ${userInfo.displayName}!**\n\n` +
             `Willkommen bei ${botName} – deiner exklusiven Platform für Premium Drops und Events.\n\n` +
             `**So funktioniert's:**\n` +
             `1. 🤳 Starte mit der Verifizierung (Foto mit Handzeichen)\n` +
             `2. 🔑 Oder nutze einen Invite-Code für sofortigen Zugang\n` +
             `3. 🚀 Erhalte Zugang zum Shop und allen Features\n\n` +
             `💎 **Was dich erwartet:**\n` +
             `• 🎯 Exklusive Limited Edition Drops\n` +
             `• 🎫 Premium Tickets für Events\n` +
             `• 💳 Sichere Zahlungsmethoden\n` +
             `• 💎 VIP-Features für Stammkunden\n\n` +
             `🎮 **Lass uns starten:**`;
    } else if (userInfo.greetingType === 'username') {
      return `🌟 **Herzlich willkommen, @${userInfo.displayName}!**\n\n` +
             `Willkommen bei ${botName} – deiner exklusiven Platform für Premium Drops und Events.\n\n` +
             `**So funktioniert's:**\n` +
             `1. 🤳 Starte mit der Verifizierung (Foto mit Handzeichen)\n` +
             `2. 🔑 Oder nutze einen Invite-Code für sofortigen Zugang\n` +
             `3. 🚀 Erhalte Zugang zum Shop und allen Features\n\n` +
             `💎 **Was dich erwartet:**\n` +
             `• 🎯 Exklusive Limited Edition Drops\n` +
             `• 🎫 Premium Tickets für Events\n` +
             `• 💳 Sichere Zahlungsmethoden\n` +
             `• 💎 VIP-Features für Stammkunden\n\n` +
             `🎮 **Lass uns starten:**`;
    } else {
      return `🌟 **Herzlich willkommen bei ${botName}!**\n\n` +
             `Willkommen bei deiner exklusiven Platform für Premium Drops und Events.\n\n` +
             `**So funktioniert's:**\n` +
             `1. 🤳 Starte mit der Verifizierung (Foto mit Handzeichen)\n` +
             `2. 🔑 Oder nutze einen Invite-Code für sofortigen Zugang\n` +
             `3. 🚀 Erhalte Zugang zum Shop und allen Features\n\n` +
             `💎 **Was dich erwartet:**\n` +
             `• 🎯 Exklusive Limited Edition Drops\n` +
             `• 🎫 Premium Tickets für Events\n` +
             `• 💳 Sichere Zahlungsmethoden\n` +
             `• 💎 VIP-Features für Stammkunden\n\n` +
             `🎮 **Lass uns starten:**`;
    }
  }
  
  // Fallback
  return `🌟 **Willkommen bei ${botName}!**\n\n` +
         `Sichere dir Zugang zum Shop – starte mit der Verifizierung.\n\n` +
         `🎯 **Wähle eine Option:**`;
};

/**
 * Main menu registration function
 * Sets up all command handlers and action handlers for the simplified menu system
 */
export const registerSimplifiedMenu = (bot: Telegraf<NebulaContext>) => {
  /**
   * Builds appropriate WebApp button based on URL scheme
   * Uses WebApp button for HTTPS (production), callback button for HTTP/localhost (development)
   * 
   * @param ctx - Telegram bot context
   * @param label - Button label text
   * @returns Telegram button object or null
   */
  const buildWebAppButton = (ctx: NebulaContext, label: string) => {
    try {
      const url = ctx.config.webAppUrl || "http://localhost:5173";
      const isHttps = url.startsWith("https://") && !url.includes("localhost");
      
      if (isHttps) {
        return Markup.button.webApp(label, url);
      } else {
        // For localhost/HTTP, use callback button instead
        return Markup.button.callback(label, "open_webapp");
      }
    } catch (error) {
      logger.warn("Failed to build WebApp button", { error: String(error) });
      return null;
    }
  };
  
  /**
   * /start command handler - Enhanced with professional greetings and navigation
   * 
   * Features:
   * - Intelligent name detection and personalized greetings
   * - Referral tracking support
   * - Verification status checking
   * - Professional welcome messages based on user state
   * - Optimized button layouts
   */
  bot.start(async (ctx) => {
    try {
      logger.info("Received /start (simplified)", { 
        userId: ctx.from?.id,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name
      });
      
      // Clear navigation history for new session
      navigationManager.clearHistory(ctx);
      
      // Referral tracking: check for ref_ payload
      try {
        const payload = (ctx as any).startPayload || '';
        if (payload && payload.startsWith('ref_') && ctx.from?.id) {
          const inviterId = payload.slice(4);
          logger.info('Referral detected', { inviterId, invitedId: ctx.from.id });
          // Create pending referral in DB (non-blocking)
          const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001/api';
          fetch(`${apiUrl}/bot/analytics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'referral_click',
              user_id: String(ctx.from.id),
              event_data: { inviter_id: inviterId, invited_telegram_id: ctx.from.id }
            })
          }).catch(err => logger.warn('Failed to track referral', { error: String(err) }));
        }
      } catch (err) {
        logger.warn('Referral tracking error', { error: String(err) });
      }
      
      // Push to navigation stack
      navigationManager.pushScreen(ctx, 'main_menu', 'Hauptmenü');
      
      // Check if user has approved verification and update session if needed
      if (ctx.from?.id && ctx.session.onboardingStatus !== "verified") {
        try {
          const hasApprovedVerification = checkAndUpdateUserVerificationStatus(ctx.from.id);
          if (hasApprovedVerification) {
            ctx.session.onboardingStatus = "verified";
            logger.info("User verification status updated to verified", { userId: ctx.from.id });
          }
        } catch (verificationError) {
          logger.warn("Failed to check verification status", { 
            error: String(verificationError),
            userId: ctx.from.id 
          });
        }
      }
      
      // Use new professional welcome message system
      // Cache user info to avoid multiple calls
      const welcomeMessage = formatWelcomeMessage(ctx, ctx.session.onboardingStatus);
      
      // Prüfen ob User bereits verifiziert ist - NUR HAUPTMENÜ
      if (ctx.session.onboardingStatus === "verified") {
        const keyboard = getVerifiedUserMenu(ctx);
        try {
          await ctx.reply(welcomeMessage, {
            parse_mode: "Markdown",
            reply_markup: keyboard.reply_markup
          });
        } catch (replyError) {
          logger.warn("Failed to send verified user message, trying without markdown", {
            error: String(replyError),
            userId: ctx.from?.id
          });
          // Fallback: try without markdown if markdown parsing fails
          try {
            await ctx.reply(welcomeMessage.replace(/\*\*/g, '').replace(/`/g, ''), {
              reply_markup: keyboard.reply_markup
            });
          } catch (fallbackError) {
            logger.error("Failed to send fallback message", {
              error: String(fallbackError),
              userId: ctx.from?.id
            });
            // Last resort: send simple message
            await ctx.reply(
              "🎉 Willkommen zurück! Nutze die Buttons unten, um zu navigieren.",
              { reply_markup: keyboard.reply_markup }
            ).catch(() => {
              logger.error("Complete message send failure", { userId: ctx.from?.id });
            });
          }
        }
        return;
      }
      
      // Für neue oder unverified Users
      const keyboard = getSimplifiedMenu(ctx);
      try {
        await ctx.reply(welcomeMessage, {
          parse_mode: "Markdown",
          reply_markup: keyboard.reply_markup
        });
      } catch (replyError) {
        logger.warn("Failed to send welcome message, trying without markdown", {
          error: String(replyError),
          userId: ctx.from?.id
        });
        // Fallback: try without markdown if markdown parsing fails
        try {
          await ctx.reply(welcomeMessage.replace(/\*\*/g, '').replace(/`/g, ''), {
            reply_markup: keyboard.reply_markup
          });
        } catch (fallbackError) {
          logger.error("Failed to send fallback message", {
            error: String(fallbackError),
            userId: ctx.from?.id
          });
          // Last resort: send simple message
          await ctx.reply(
            "🌟 Willkommen! Nutze die Buttons unten, um zu starten.",
            { reply_markup: keyboard.reply_markup }
          ).catch(() => {
            logger.error("Complete message send failure", { userId: ctx.from?.id });
          });
        }
      }
      
      logger.info("/start completed successfully", { 
        userId: ctx.from?.id,
        status: ctx.session.onboardingStatus 
      });
      
    } catch (error) {
      logger.error("/start command error", { 
        error: String(error),
        userId: ctx.from?.id,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Fallback-Nachricht bei Fehler mit verbesserter Fehlerbehandlung
      try {
        const userInfo = getUserDisplayName(ctx);
        const errorMessage = userInfo.hasName 
          ? `❌ **Hallo ${userInfo.displayName},**\n\nEin Fehler ist aufgetreten.\n\nBitte versuche es erneut mit /start oder kontaktiere den Support.`
          : "❌ **Ein Fehler ist aufgetreten.**\n\nBitte versuche es erneut mit /start oder kontaktiere den Support.";
        
        try {
          await ctx.reply(
            errorMessage,
            {
              parse_mode: "Markdown",
              reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback("🔄 Erneut versuchen", "menu_back")]
              ]).reply_markup
            }
          );
        } catch (markdownError) {
          // Fallback without markdown
          await ctx.reply(
            errorMessage.replace(/\*\*/g, ''),
            {
              reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback("🔄 Erneut versuchen", "menu_back")]
              ]).reply_markup
            }
          );
        }
      } catch (fallbackError) {
        logger.error("Failed to send error message", { 
          error: String(fallbackError),
          originalError: String(error)
        });
        // Last resort: very simple message
        try {
          await ctx.reply(
            "❌ Ein Fehler ist aufgetreten. Bitte versuche es mit /start erneut.",
            Markup.inlineKeyboard([
              [Markup.button.callback("🔄 Erneut versuchen", "menu_back")]
            ])
          );
        } catch (lastResortError) {
          logger.error("Complete error handling failure", { 
            error: String(lastResortError),
            userId: ctx.from?.id
          });
        }
      }
    }
  });

  /**
   * Legacy function for verified user message formatting
   * Now uses the new formatWelcomeMessage system for consistency
   * 
   * @param ctx - Telegram bot context
   * @returns Formatted message for verified users
   */
  const formatVerifiedUserMessage = (ctx: NebulaContext): string => {
    return formatWelcomeMessage(ctx, "verified");
  };

  /**
   * Builds optimized menu layout for verified users
   * Features clear visual hierarchy with primary, secondary, and tertiary actions
   * 
   * @param ctx - Telegram bot context
   * @returns Inline keyboard markup for verified users
   */
  const getVerifiedUserMenu = (ctx: NebulaContext) => {
    const buttons: any[] = [];
    
    // WebApp Button (wenn HTTPS) - Hauptaktion prominent
    const webBtn = buildWebAppButton(ctx, "🚀 Nebula öffnen");
    if (webBtn) {
      buttons.push([webBtn]);
    }
    
    // Premium Features - Primäre Aktionen
    buttons.push([
      Markup.button.callback("🎫 Support", "premium_support"),
      Markup.button.callback("💳 Zahlungen", "premium_payments")
    ]);
    
    // VIP Features - Sekundäre Features
    buttons.push([
      Markup.button.callback("👥 Affiliate", "affiliate_dashboard"),
      Markup.button.callback("📊 Statistiken", "user_stats")
    ]);
    
    // Settings & Hilfe - Tertiäre Optionen
    buttons.push([
      Markup.button.callback("⚙️ Einstellungen", "premium_settings"),
      Markup.button.callback("❓ FAQ", "smart_faq")
    ]);
    
    return Markup.inlineKeyboard(buttons);
  };

  /**
   * Legacy function for start message formatting
   * Now uses the new formatWelcomeMessage system for consistency
   * 
   * @param ctx - Telegram bot context
   * @returns Formatted start message based on user status
   */
  const formatStartMessageSimplified = (ctx: NebulaContext): string => {
    return formatWelcomeMessage(ctx, ctx.session.onboardingStatus);
  };

  /**
   * Builds optimized menu layout with clear visual hierarchy
   * Adapts button layout based on user onboarding status
   * 
   * Layout principles:
   * - Primary actions: Full-width, prominent placement
   * - Secondary actions: Grouped horizontally
   * - Tertiary actions: Less prominent, grouped at bottom
   * 
   * @param ctx - Telegram bot context
   * @returns Inline keyboard markup optimized for user status
   */
  const getSimplifiedMenu = (ctx: NebulaContext) => {
    const buttons: any[] = [];
    
    // Für neue User: Verifizierung als Hauptaktion
    if (ctx.session.onboardingStatus === "unknown") {
      // Hauptaktionen - prominent platziert
      buttons.push([
        Markup.button.callback("🤳 Verifizierung starten", "start_verification")
      ]);
      buttons.push([
        Markup.button.callback("🔑 Invite Code verwenden", "use_invite")
      ]);
      // Hilfe - sekundär
      buttons.push([
        Markup.button.callback("❓ Hilfe & FAQ", "simple_help")
      ]);
    }
    // Für verifizierte User: WebApp + Hauptfeatures
    else if (ctx.session.onboardingStatus === "verified") {
      const openBtn = buildWebAppButton(ctx, "🚀 Nebula öffnen");
      if (openBtn) {
        buttons.push([openBtn]);
      }
      // Primäre Features
      buttons.push([
        Markup.button.callback("🎫 Tickets", "simple_tickets"),
        Markup.button.callback("💳 Zahlungen", "simple_pay")
      ]);
      // Sekundäre Optionen
      buttons.push([
        Markup.button.callback("⚙️ Einstellungen", "open_settings"),
        Markup.button.callback("❓ FAQ", "simple_help")
      ]);
    }
    // Für User in Verifizierung: Status & Alternativen
    else {
      // Hauptaktion - Status prüfen
      buttons.push([
        Markup.button.callback("🤳 Verifizierungsstatus prüfen", "check_verification_status")
      ]);
      // Alternative Option
      buttons.push([
        Markup.button.callback("🔑 Invite Code verwenden", "use_invite")
      ]);
      // Hilfe
      buttons.push([
        Markup.button.callback("❓ Hilfe & Support", "simple_help")
      ]);
    }
    
    return Markup.inlineKeyboard(buttons);
  };

  // Menu Command - Optimiert
  bot.command("menu", async (ctx) => {
    try {
      logger.info("Received /menu (simplified)", { userId: ctx.from?.id });
      const keyboard = getSimplifiedMenu(ctx);
      await ctx.reply(formatStartMessageSimplified(ctx), {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup
      });
      logger.info("/menu completed successfully", { userId: ctx.from?.id });
    } catch (error) {
      logger.error("/menu command error", { 
        error: String(error),
        userId: ctx.from?.id 
      });
      await ctx.reply(
        "❌ Fehler beim Laden des Menüs. Versuche /start",
        Markup.inlineKeyboard([[Markup.button.callback("🔄 Erneut versuchen", "menu_back")]])
      ).catch(() => {});
    }
  });

  // Tickets Handler
  bot.action("simple_tickets", async (ctx) => {
    await ctx.answerCbQuery("🎫 Tickets...");
    const lines: string[] = [];
    lines.push("🎫 **Tickets**\n");
    lines.push("Synchron mit WebApp: Live-Status, QR-Codes, Event-Details.");
    lines.push("\n");
    lines.push("🗨️ Antworten auf Tickets erfolgen in der WebApp.");
    lines.push("💎 Ab VIP: Antworten auch direkt im Bot per Befehlen möglich.");
    await ctx.reply(lines.join("\n"), (() => {
      const btn = buildWebAppButton(ctx, "🎫 Tickets öffnen (WebView)");
      const rows: any[] = [];
      if (btn) rows.push([btn]);
      rows.push([Markup.button.callback("🔙 Zurück", "menu_back")]);
      return Markup.inlineKeyboard(rows);
    })());
  });

  // Pay Handler
  bot.action("simple_pay", async (ctx) => {
    await ctx.answerCbQuery("💳 Zahlen...");
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const paymentUrl = `${webAppUrl}/payment`;
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    const lines: string[] = [];
    lines.push("💳 **Zahlungsoptionen**\n");
    lines.push("**Verfügbare Methoden:**\n");
    lines.push("• 💰 Crypto Voucher (Sofort)\n");
    lines.push("• ₿ Bitcoin (Lightning & On-Chain)\n");
    lines.push("• 💵 Bargeld (Nebula-Schalter)\n");
    lines.push("• 💎 VIP: Auf KO holen\n\n");
    lines.push("ℹ️ **Zahlung erfolgt in der WebApp**\n");
    lines.push("Der Bot zeigt nur Informationen.");
    
    const buttons: any[] = [];
    if (isHttps) {
      // HTTPS: WebApp Button (öffnet direkt in Telegram)
      buttons.push([Markup.button.webApp("💳 WebApp öffnen", paymentUrl)]);
    } else {
      // Localhost: URL Button (öffnet im Browser) + Callback für bessere UX
      buttons.push([Markup.button.url("💳 WebApp öffnen", paymentUrl)]);
      buttons.push([Markup.button.callback("🔄 Seite aktualisieren", "open_webapp_payment")]);
    }
    buttons.push([Markup.button.callback("❓ FAQ Zahlungen", "faq_payments")]);
    buttons.push([Markup.button.callback("🔙 Zurück", "menu_back")]);
    
    await ctx.reply(lines.join("\n"), {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  });

  // Hilfe Handler
  bot.action("simple_help", async (ctx) => {
    await ctx.answerCbQuery("❓ Hilfe...");
    const lines: string[] = [];
    lines.push("❓ **Hilfe & FAQ**\n");
    lines.push("Häufige Themen:");
    lines.push("• Verifizierung & Handzeichen");
    lines.push("• Zahlungen & Methoden (Info)");
    lines.push("• Tickets & QR-Codes");
    lines.push("• Einladungen & Ränge");
    lines.push("\n");
    lines.push("💬 **Kurze Antworten** – schreib z.B.:\n› 'wie verifizierung' • 'bitte zahlung' • 'tickets status'");
    lines.push("\n");
    lines.push("⚡ **Schnellbefehle:** /start • /menu");
    await ctx.reply(lines.join("\n"), Markup.inlineKeyboard([
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]));
  });

  // Smart back navigation - Enhanced with navigation manager
  bot.action("menu_back", async (ctx) => {
    try {
      await ctx.answerCbQuery("🔙 Zurück...");
      
      // Check if we can go back
      if (navigationManager.canGoBack(ctx)) {
        const previousScreen = navigationManager.popScreen(ctx);
        if (previousScreen) {
          logger.info("Navigated back to previous screen", { 
            userId: ctx.from?.id,
            screenId: previousScreen.screenId,
            title: previousScreen.title
          });
          
          // Handle the previous screen
          await handleScreenNavigation(ctx, previousScreen.screenId);
          return;
        }
      }
      
      // Fallback to main menu
      navigationManager.pushScreen(ctx, 'main_menu', 'Hauptmenü');
      
      if (ctx.session.onboardingStatus === "verified") {
        const keyboard = getVerifiedUserMenu(ctx);
        await ctx.editMessageText(formatVerifiedUserMessage(ctx), {
          parse_mode: "Markdown",
          reply_markup: keyboard.reply_markup 
        });
      } else {
        const keyboard = getSimplifiedMenu(ctx);
        await ctx.editMessageText(formatStartMessageSimplified(ctx), {
          parse_mode: "Markdown",
          reply_markup: keyboard.reply_markup 
        });
      }
      
      logger.info("Smart back navigation completed", { 
        userId: ctx.from?.id,
        currentScreen: navigationManager.getCurrentScreen(ctx)?.screenId 
      });
    } catch (error) {
      logger.error("menu_back error", { 
        error: String(error),
        userId: ctx.from?.id 
      });
      // Fallback: Neue Nachricht senden wenn Edit fehlschlägt
      try {
        await ctx.answerCbQuery("⚠️ Aktualisierung fehlgeschlagen");
        if (ctx.session.onboardingStatus === "verified") {
          const keyboard = getVerifiedUserMenu(ctx);
          await ctx.reply(formatVerifiedUserMessage(ctx), {
            parse_mode: "Markdown",
            reply_markup: keyboard.reply_markup 
          });
        } else {
          const keyboard = getSimplifiedMenu(ctx);
          await ctx.reply(formatStartMessageSimplified(ctx), {
            parse_mode: "Markdown",
            reply_markup: keyboard.reply_markup 
          });
        }
      } catch (fallbackError) {
        await ctx.answerCbQuery("❌ Fehler. Nutze /start").catch(() => {});
      }
    }
  });

  // ===== WEBAPP BUTTON HANDLERS =====
  
  // WebApp Payment Handler - Optimiert für localhost und HTTPS
  bot.action("open_webapp_payment", async (ctx) => {
    await ctx.answerCbQuery("💳 WebApp wird geöffnet...");
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const paymentUrl = `${webAppUrl}/payment`;
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    // Erstelle Button der direkt zur Zahlungsseite führt
    const keyboard = Markup.inlineKeyboard([
      isHttps 
        ? [Markup.button.webApp("💳 WebApp öffnen", paymentUrl)]
        : [Markup.button.url("💳 WebApp öffnen", paymentUrl)],
      [Markup.button.callback("❓ FAQ Zahlungen", "faq_payments")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);
    
    const message = "💳 **Zahlungsoptionen**\n\n" +
      "**Verfügbare Methoden:**\n" +
      "• 💰 Crypto Voucher (Sofort)\n" +
      "• ₿ Bitcoin (Lightning & On-Chain)\n" +
      "• 💵 Bargeld (Nebula-Schalter)\n" +
      "• 💎 VIP: Auf KO holen\n\n" +
      "ℹ️ **Zahlung erfolgt in der WebApp**\n" +
      "Der Bot zeigt nur Informationen.\n\n" +
      (isHttps 
        ? "🚀 **Klicke auf den Button unten, um die WebApp direkt in Telegram zu öffnen!**"
        : `📱 **Klicke auf den Link-Button, um die WebApp in deinem Browser zu öffnen!**\n\n🔗 **Link:** ${paymentUrl}`);
    
    try {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup
      });
    } catch (error) {
      // Falls edit fehlschlägt (z.B. bei neuer Nachricht), sende neue Nachricht
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup
      });
    }
  });
  
  // WebApp Shop Handler
  bot.action("open_webapp_shop", async (ctx) => {
    await ctx.answerCbQuery("🛍️ Shop wird geöffnet...");
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const shopUrl = `${webAppUrl}/shop`;
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    const keyboard = Markup.inlineKeyboard([
      isHttps 
        ? [Markup.button.webApp("🛍️ Shop öffnen", shopUrl)]
        : [Markup.button.url("🛍️ Shop öffnen", shopUrl)],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);
    
    try {
      await ctx.editMessageText(
        "🛍️ **Nebula Shop**\n\n" +
        "🌐 **Shop öffnen:**\n" +
        (isHttps 
          ? "Klicke auf den Button unten, um den Shop direkt in Telegram zu öffnen!\n\n"
          : `📱 **Für localhost:** Klicke auf den Link-Button, um den Shop in deinem Browser zu öffnen!\n\n` +
            `🔗 **Link:** ${shopUrl}\n\n`) +
        "**Verfügbare Produkte:**\n" +
        "• 🎯 Exklusive Drops\n" +
        "• 🎫 Premium Tickets\n" +
        "• 💎 VIP-Mitgliedschaften",
        { parse_mode: "Markdown", ...keyboard }
      );
    } catch (error) {
      await ctx.reply(
        "🛍️ **Nebula Shop**\n\n" +
        "🌐 **Shop öffnen:**\n" +
        (isHttps 
          ? "Klicke auf den Button unten, um den Shop direkt in Telegram zu öffnen!\n\n"
          : `📱 **Für localhost:** Klicke auf den Link-Button, um den Shop in deinem Browser zu öffnen!\n\n` +
            `🔗 **Link:** ${shopUrl}\n\n`) +
        "**Verfügbare Produkte:**\n" +
        "• 🎯 Exklusive Drops\n" +
        "• 🎫 Premium Tickets\n" +
        "• 💎 VIP-Mitgliedschaften",
        { parse_mode: "Markdown", ...keyboard }
      );
    }
  });
  
  // WebApp Tickets Handler
  bot.action("open_webapp_tickets", async (ctx) => {
    await ctx.answerCbQuery("🎫 Tickets wird geöffnet...");
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const ticketsUrl = `${webAppUrl}/tickets`;
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    const keyboard = Markup.inlineKeyboard([
      isHttps 
        ? [Markup.button.webApp("🎫 Tickets öffnen", ticketsUrl)]
        : [Markup.button.url("🎫 Tickets öffnen", ticketsUrl)],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);
    
    try {
      await ctx.editMessageText(
        "🎫 **Nebula Tickets**\n\n" +
        "🌐 **Tickets öffnen:**\n" +
        (isHttps 
          ? "Klicke auf den Button unten, um deine Tickets direkt in Telegram zu öffnen!\n\n"
          : `📱 **Für localhost:** Klicke auf den Link-Button, um deine Tickets in deinem Browser zu öffnen!\n\n` +
            `🔗 **Link:** ${ticketsUrl}\n\n`) +
        "**Verfügbare Features:**\n" +
        "• 📋 Alle Tickets anzeigen\n" +
        "• 🆕 Neues Ticket erstellen\n" +
        "• 📱 QR-Codes für Events",
        { parse_mode: "Markdown", ...keyboard }
      );
    } catch (error) {
      await ctx.reply(
        "🎫 **Nebula Tickets**\n\n" +
        "🌐 **Tickets öffnen:**\n" +
        (isHttps 
          ? "Klicke auf den Button unten, um deine Tickets direkt in Telegram zu öffnen!\n\n"
          : `📱 **Für localhost:** Klicke auf den Link-Button, um deine Tickets in deinem Browser zu öffnen!\n\n` +
            `🔗 **Link:** ${ticketsUrl}\n\n`) +
        "**Verfügbare Features:**\n" +
        "• 📋 Alle Tickets anzeigen\n" +
        "• 🆕 Neues Ticket erstellen\n" +
        "• 📱 QR-Codes für Events",
        { parse_mode: "Markdown", ...keyboard }
      );
    }
  });

  // WebApp General Handler - Optimiert für localhost
  bot.action("open_webapp", async (ctx) => {
    await ctx.answerCbQuery("🚀 WebApp wird geöffnet...");
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    // Für localhost: URL-Button verwenden (öffnet im Browser)
    // Für HTTPS: WebApp-Button verwenden (öffnet in Telegram)
    const keyboard = Markup.inlineKeyboard([
      isHttps 
        ? [Markup.button.webApp("🚀 Nebula öffnen", webAppUrl)]
        : [Markup.button.url("🚀 Nebula öffnen", webAppUrl)],
      [Markup.button.callback("🛍️ Shop", "open_webapp_shop")],
      [Markup.button.callback("🎫 Tickets", "open_webapp_tickets")],
      [Markup.button.callback("💳 Zahlungen", "open_webapp_payment")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);
    
    try {
      await ctx.editMessageText(
        "🚀 **Nebula WebApp**\n\n" +
        "🌐 **WebApp öffnen:**\n" +
        (isHttps 
          ? "Klicke auf den Button unten, um die WebApp direkt in Telegram zu öffnen!\n\n"
          : `📱 **Für localhost:** Klicke auf den Link-Button, um die WebApp in deinem Browser zu öffnen!\n\n` +
            `🔗 **Link:** ${webAppUrl}\n\n`) +
        "**Verfügbare Features:**\n" +
        "• 🛍️ Shop durchsuchen\n" +
        "• 🎯 Drops anzeigen\n" +
        "• 💳 Zahlungen verwalten\n" +
        "• 🎫 Tickets verwalten\n" +
        "• 👥 Affiliate Dashboard",
        { parse_mode: "Markdown", ...keyboard }
      );
    } catch (error) {
      // Fallback: Neue Nachricht senden wenn Edit fehlschlägt
      await ctx.reply(
        "🚀 **Nebula WebApp**\n\n" +
        "🌐 **WebApp öffnen:**\n" +
        (isHttps 
          ? "Klicke auf den Button unten, um die WebApp direkt in Telegram zu öffnen!\n\n"
          : `📱 **Für localhost:** Klicke auf den Link-Button, um die WebApp in deinem Browser zu öffnen!\n\n` +
            `🔗 **Link:** ${webAppUrl}\n\n`) +
        "**Verfügbare Features:**\n" +
        "• 🛍️ Shop durchsuchen\n" +
        "• 🎯 Drops anzeigen\n" +
        "• 💳 Zahlungen verwalten\n" +
        "• 🎫 Tickets verwalten\n" +
        "• 👥 Affiliate Dashboard",
        { parse_mode: "Markdown", ...keyboard }
      );
    }
  });

  // ===== PREMIUM BUTTON HANDLERS =====

  // Premium Support - Optimiert mit WebApp-Integration
  bot.action("premium_support", async (ctx) => {
    await ctx.answerCbQuery("🎫 Premium Support...");
    
    navigationManager.pushScreen(ctx, 'premium_support', 'Premium Support');
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const ticketsUrl = `${webAppUrl}/tickets`;
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    const keyboard = Markup.inlineKeyboard([
      isHttps 
        ? [Markup.button.webApp("🎫 Tickets in WebApp öffnen", ticketsUrl)]
        : [Markup.button.url("🎫 Tickets in WebApp öffnen", ticketsUrl)],
      [Markup.button.callback("🆕 Neues Ticket", "support_new")],
      [Markup.button.callback("📋 Meine Tickets", "support_list")],
      [Markup.button.callback("💬 Live Chat", "live_chat")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    try {
      await ctx.editMessageText(
        "🎫 **Premium Support**\n\n" +
        "✅ **VIP-Features verfügbar:**\n" +
        "• Prioritäts-Support\n" +
        "• Live Chat mit Support\n" +
        "• Direkte Bot-Antworten mit `/reply`\n" +
        "• Erweiterte Ticket-Features\n\n" +
        "🚀 **Wähle deine Option:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    } catch (error) {
      await ctx.reply(
        "🎫 **Premium Support**\n\n" +
        "✅ **VIP-Features verfügbar:**\n" +
        "• Prioritäts-Support\n" +
        "• Live Chat mit Support\n" +
        "• Direkte Bot-Antworten mit `/reply`\n" +
        "• Erweiterte Ticket-Features\n\n" +
        "🚀 **Wähle deine Option:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    }
  });

  // Premium Payments - Optimiert mit WebApp-Integration
  bot.action("premium_payments", async (ctx) => {
    await ctx.answerCbQuery("💳 Zahlungsoptionen...");
    
    navigationManager.pushScreen(ctx, 'premium_payments', 'Premium Zahlungen');
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const paymentUrl = `${webAppUrl}/payment`;
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    const keyboard = Markup.inlineKeyboard([
      isHttps 
        ? [Markup.button.webApp("💳 Zahlungen in WebApp öffnen", paymentUrl)]
        : [Markup.button.url("💳 Zahlungen in WebApp öffnen", paymentUrl)],
      [Markup.button.callback("💰 Guthaben aufladen", "add_credits")],
      [Markup.button.callback("📊 Zahlungshistorie", "payment_history")],
      [Markup.button.callback("💎 VIP-Upgrade", "vip_upgrade")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    try {
      await ctx.editMessageText(
        "💳 **Premium Zahlungen**\n\n" +
        "✅ **Verfügbare Methoden:**\n" +
        "• 💰 Crypto Voucher (Sofort)\n" +
        "• ₿ Bitcoin (Lightning & On-Chain)\n" +
        "• 💵 Bargeld (Nebula-Schalter)\n" +
        "• 💎 VIP: Auf KO holen\n\n" +
        "🎯 **Wähle deine Aktion:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    } catch (error) {
      await ctx.reply(
        "💳 **Premium Zahlungen**\n\n" +
        "✅ **Verfügbare Methoden:**\n" +
        "• 💰 Crypto Voucher (Sofort)\n" +
        "• ₿ Bitcoin (Lightning & On-Chain)\n" +
        "• 💵 Bargeld (Nebula-Schalter)\n" +
        "• 💎 VIP: Auf KO holen\n\n" +
        "🎯 **Wähle deine Aktion:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    }
  });

  // Affiliate Dashboard - Optimiert mit WebApp-Integration
  bot.action("affiliate_dashboard", async (ctx) => {
    await ctx.answerCbQuery("👥 Affiliate Dashboard...");
    
    navigationManager.pushScreen(ctx, 'affiliate_dashboard', 'Affiliate Dashboard');
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const affiliateUrl = `${webAppUrl}/affiliate`;
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    const keyboard = Markup.inlineKeyboard([
      isHttps 
        ? [Markup.button.webApp("👥 Affiliate in WebApp öffnen", affiliateUrl)]
        : [Markup.button.url("👥 Affiliate in WebApp öffnen", affiliateUrl)],
      [Markup.button.callback("🔗 Meine Links", "my_links")],
      [Markup.button.callback("📊 Statistiken", "affiliate_stats")],
      [Markup.button.callback("💰 Auszahlungen", "payouts")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    try {
      await ctx.editMessageText(
        "👥 **Affiliate Dashboard**\n\n" +
        "🎯 **Deine Performance:**\n" +
        "• 🔗 Aktive Links: 0\n" +
        "• 👥 Eingeladene User: 0\n" +
        "• 💰 Verdient: €0.00\n" +
        "• 📈 Conversion: 0%\n\n" +
        "🚀 **Starte dein Affiliate-Business:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    } catch (error) {
      await ctx.reply(
        "👥 **Affiliate Dashboard**\n\n" +
        "🎯 **Deine Performance:**\n" +
        "• 🔗 Aktive Links: 0\n" +
        "• 👥 Eingeladene User: 0\n" +
        "• 💰 Verdient: €0.00\n" +
        "• 📈 Conversion: 0%\n\n" +
        "🚀 **Starte dein Affiliate-Business:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    }
  });

  // User Stats - Optimiert mit API-Integration
  bot.action("user_stats", async (ctx) => {
    await ctx.answerCbQuery("📊 Statistiken werden geladen...");
    
    navigationManager.pushScreen(ctx, 'user_stats', 'Statistiken');
    
    // Try to fetch real stats from API
    let stats = {
      memberSince: "Heute",
      orders: 0,
      spent: "€0.00",
      tickets: 0,
      rank: "Neuling",
      nextRank: "Stammkunde (€100)"
    };
    
    try {
      const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/users/${ctx.from?.id}/stats`);
      if (response.ok) {
        const data = await response.json() as { data?: any };
        if (data.data) {
          stats = {
            memberSince: data.data.memberSince || stats.memberSince,
            orders: data.data.orders || stats.orders,
            spent: data.data.spent || stats.spent,
            tickets: data.data.tickets || stats.tickets,
            rank: data.data.rank || stats.rank,
            nextRank: data.data.nextRank || stats.nextRank
          };
        }
      }
    } catch (error) {
      logger.warn("Failed to fetch user stats", { error: String(error), userId: ctx.from?.id });
    }
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🔄 Aktualisieren", "user_stats")],
      [Markup.button.callback("📈 Detailliert", "detailed_stats")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    try {
      await ctx.editMessageText(
        "📊 **Deine Statistiken**\n\n" +
        "🎯 **Aktivität:**\n" +
        `• 📅 Mitglied seit: ${stats.memberSince}\n` +
        `• 🛍️ Bestellungen: ${stats.orders}\n` +
        `• 💰 Ausgegeben: ${stats.spent}\n` +
        `• 🎫 Tickets: ${stats.tickets}\n\n` +
        `🏆 **Rang:** ${stats.rank}\n` +
        `💎 **Nächster Rang:** ${stats.nextRank}`,
        { parse_mode: "Markdown", ...keyboard }
      );
    } catch (error) {
      await ctx.reply(
        "📊 **Deine Statistiken**\n\n" +
        "🎯 **Aktivität:**\n" +
        `• 📅 Mitglied seit: ${stats.memberSince}\n` +
        `• 🛍️ Bestellungen: ${stats.orders}\n` +
        `• 💰 Ausgegeben: ${stats.spent}\n` +
        `• 🎫 Tickets: ${stats.tickets}\n\n` +
        `🏆 **Rang:** ${stats.rank}\n` +
        `💎 **Nächster Rang:** ${stats.nextRank}`,
        { parse_mode: "Markdown", ...keyboard }
      );
    }
  });

  // Premium Settings - Optimiert mit WebApp-Integration
  bot.action("premium_settings", async (ctx) => {
    await ctx.answerCbQuery("⚙️ Einstellungen...");
    
    navigationManager.pushScreen(ctx, 'premium_settings', 'Einstellungen');
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const settingsUrl = `${webAppUrl}/settings`;
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    const keyboard = Markup.inlineKeyboard([
      isHttps 
        ? [Markup.button.webApp("⚙️ Einstellungen in WebApp öffnen", settingsUrl)]
        : [Markup.button.url("⚙️ Einstellungen in WebApp öffnen", settingsUrl)],
      [Markup.button.callback("🔔 Benachrichtigungen", "notification_settings")],
      [Markup.button.callback("🌙 Dark Mode", "dark_mode")],
      [Markup.button.callback("🔒 Datenschutz", "privacy_settings")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    try {
      await ctx.editMessageText(
        "⚙️ **Premium Einstellungen**\n\n" +
        "🔔 **Benachrichtigungen:** Aktiviert\n" +
        "🌙 **Dark Mode:** System\n" +
        "🔒 **Datenschutz:** Standard\n\n" +
        "🎯 **Passe deine Erfahrung an:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    } catch (error) {
      await ctx.reply(
        "⚙️ **Premium Einstellungen**\n\n" +
        "🔔 **Benachrichtigungen:** Aktiviert\n" +
        "🌙 **Dark Mode:** System\n" +
        "🔒 **Datenschutz:** Standard\n\n" +
        "🎯 **Passe deine Erfahrung an:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    }
  });

  // Smart FAQ - Optimiert mit Navigation
  bot.action("smart_faq", async (ctx) => {
    await ctx.answerCbQuery("❓ Smart FAQ...");
    
    navigationManager.pushScreen(ctx, 'smart_faq', 'FAQ');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🛍️ Bestellungen", "faq_orders")],
      [Markup.button.callback("💳 Zahlungen", "faq_payments")],
      [Markup.button.callback("🎯 Drops", "faq_drops")],
      [Markup.button.callback("💎 VIP", "faq_vip")],
      [Markup.button.callback("🤳 Verifizierung", "faq_verification")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    try {
      await ctx.editMessageText(
        "❓ **Smart FAQ**\n\n" +
        "🤖 **KI-gestützte Hilfe**\n" +
        "Finde schnell Antworten auf deine Fragen!\n\n" +
        "💡 **Tipp:** Du kannst auch einfach deine Frage schreiben!\n\n" +
        "📚 **Kategorien:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    } catch (error) {
      await ctx.reply(
        "❓ **Smart FAQ**\n\n" +
        "🤖 **KI-gestützte Hilfe**\n" +
        "Finde schnell Antworten auf deine Fragen!\n\n" +
        "💡 **Tipp:** Du kannst auch einfach deine Frage schreiben!\n\n" +
        "📚 **Kategorien:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    }
  });

  // ===== VIP COMMANDS =====
  
  // VIP Reply Command (für Stammkunden/VIP)
  bot.command("reply", async (ctx) => {
    const text = (ctx.message as any)?.text || "";
    const parts = text.trim().split(/\s+/);
    if (parts.length < 3) {
      await ctx.reply(
        "💎 **VIP Reply Command**\n\n" +
        "**Usage:** `/reply <ticketId> <Nachricht>`\n\n" +
        "**Beispiel:**\n" +
        "`/reply TK-123456 Hallo, das Problem ist gelöst!`\n\n" +
        "🎯 **Nur für VIP/Stammkunden verfügbar**",
        { parse_mode: "Markdown" }
      );
      return;
    }
    
    const ticketId = parts[1];
    const message = text.slice(text.indexOf(ticketId) + ticketId.length).trim();
    
    // Prüfe VIP-Status
    try {
      const resp: any = await fetch(`${process.env.BOT_API_URL || 'http://localhost:3001/api'}/rank/${ctx.from?.id}`)
        .then(r => r.json())
        .catch(() => null);
      const rank = resp?.data?.rank as string | undefined;
      const allowed = rank === 'VIP' || rank === 'Stammkunde' || (ctx.config.adminIds || []).includes(String(ctx.from?.id));
      
      if (!allowed) {
        await ctx.reply(
          "⛔️ **VIP-Feature**\n\n" +
          "Dieser Befehl ist nur für VIP/Stammkunden verfügbar.\n\n" +
          "💎 **Upgrade zu VIP für:**\n" +
          "• Direkte Bot-Antworten\n" +
          "• Prioritäts-Support\n" +
          "• Exklusive Features",
          { parse_mode: "Markdown" }
        );
        return;
      }
    } catch {}
    
    // Sende Reply
    try {
      const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiUrl}/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'bot', user_id: String(ctx.from?.id), message })
      });
      
      await ctx.reply(
        "✅ **VIP Reply gesendet!**\n\n" +
        `🎫 **Ticket:** \`${ticketId}\`\n` +
        `💬 **Nachricht:** "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"\n\n` +
        "📱 **Sichtbar in der WebApp**",
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      await ctx.reply(
        "❌ **Reply fehlgeschlagen**\n\n" +
        "Bitte versuche es erneut oder nutze die WebApp.",
        { parse_mode: 'Markdown' }
      );
    }
  });

  // Stats Command
  bot.command("stats", async (ctx) => {
    const adminIds = ctx.config.adminIds || [];
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.reply("⛔️ Nur Admins können Statistiken abrufen.");
      return;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("📊 Bot Stats", "bot_stats")],
      [Markup.button.callback("👥 User Stats", "user_stats")],
      [Markup.button.callback("🎫 Ticket Stats", "ticket_stats")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    await ctx.reply(
      "📊 **Admin Statistiken**\n\n" +
      "Wähle eine Kategorie:",
      { parse_mode: "Markdown", ...keyboard }
    );
  });

  // Invite Command
  bot.command("invite", async (ctx) => {
    const adminIds = ctx.config.adminIds || [];
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.reply("⛔️ Nur Admins können Invite-Codes erstellen.");
      return;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🆕 Code erstellen", "create_invite")],
      [Markup.button.callback("📋 Alle Codes", "list_invites")],
      [Markup.button.callback("📊 Statistiken", "invite_stats")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    await ctx.reply(
      "🔑 **Invite-Code Management**\n\n" +
      "Verwalte Invite-Codes für neue User:",
      { parse_mode: "Markdown", ...keyboard }
    );
  });

  // Screen navigation handler
  const handleScreenNavigation = async (ctx: NebulaContext, screenId: string) => {
    try {
      switch (screenId) {
        case 'main_menu':
          if (ctx.session.onboardingStatus === "verified") {
            const keyboard = getVerifiedUserMenu(ctx);
            await ctx.editMessageText(formatVerifiedUserMessage(ctx), {
              parse_mode: "Markdown",
              reply_markup: keyboard.reply_markup 
            });
          } else {
            const keyboard = getSimplifiedMenu(ctx);
            await ctx.editMessageText(formatStartMessageSimplified(ctx), {
              parse_mode: "Markdown",
              reply_markup: keyboard.reply_markup 
            });
          }
          break;
        case 'faq_main':
          // Trigger FAQ main screen
          await ctx.answerCbQuery("FAQ wird geladen...");
          // This would be handled by the FAQ flow
          break;
        case 'payment_info':
          // Handle payment info screen
          await ctx.editMessageText(
            "💳 **Zahlungsoptionen**\n\n" +
            "**Verfügbare Methoden:**\n" +
            "• 💰 Crypto Voucher (Sofort)\n" +
            "• ₿ Bitcoin (Lightning & On-Chain)\n" +
            "• 💵 Bargeld (Nebula-Schalter)\n" +
            "• 💎 VIP: Auf KO holen\n\n" +
            "ℹ️ **Zahlung erfolgt in der WebApp**\n" +
            "Der Bot zeigt nur Informationen.",
            Markup.inlineKeyboard([
              [Markup.button.callback("💳 WebApp öffnen", "open_webapp_payment")],
              [Markup.button.callback("❓ FAQ Zahlungen", "faq_payments")],
              [Markup.button.callback("🔙 Zurück", "menu_back")]
            ])
          );
          break;
        case 'tickets_info':
          // Handle tickets info screen
          await ctx.editMessageText(
            "🎫 **Tickets & Support**\n\n" +
            "**Deine Support-Optionen:**\n" +
            "• 📋 Alle Tickets anzeigen\n" +
            "• 🆕 Neues Ticket erstellen\n" +
            "• 💬 Live Chat (VIP/Stammkunde)\n" +
            "• ❓ FAQ durchsuchen\n\n" +
            "💎 **VIP-Features:** Direkte Bot-Antworten mit `/reply`",
            Markup.inlineKeyboard([
              [Markup.button.callback("🎫 Meine Tickets", "support_list")],
              [Markup.button.callback("🆕 Neues Ticket", "support_new")],
              [Markup.button.callback("💬 Live Chat", "live_chat")],
              [Markup.button.callback("❓ FAQ Support", "support_faq")],
              [Markup.button.callback("🔙 Zurück", "menu_back")]
            ])
          );
          break;
        default:
          logger.warn("Unknown screen navigation", { screenId, userId: ctx.from?.id });
          // Fallback to main menu
          if (ctx.session.onboardingStatus === "verified") {
            const keyboard = getVerifiedUserMenu(ctx);
            await ctx.editMessageText(formatVerifiedUserMessage(ctx), {
              parse_mode: "Markdown",
              reply_markup: keyboard.reply_markup 
            });
          } else {
            const keyboard = getSimplifiedMenu(ctx);
            await ctx.editMessageText(formatStartMessageSimplified(ctx), {
              parse_mode: "Markdown",
              reply_markup: keyboard.reply_markup 
            });
          }
      }
    } catch (error) {
      logger.error("Screen navigation failed", { screenId, error: String(error), userId: ctx.from?.id });
      // Fallback to main menu on error
      if (ctx.session.onboardingStatus === "verified") {
        const keyboard = getVerifiedUserMenu(ctx);
        await ctx.editMessageText(formatVerifiedUserMessage(ctx), {
          parse_mode: "Markdown",
          reply_markup: keyboard.reply_markup 
        });
      } else {
        const keyboard = getSimplifiedMenu(ctx);
        await ctx.editMessageText(formatStartMessageSimplified(ctx), {
          parse_mode: "Markdown",
          reply_markup: keyboard.reply_markup 
        });
      }
    }
  };

  // KI-Chatbot für häufige Fragen (Enhanced with quick command integration)
  const aiResponses = {
    "was ist nebula": "🌟 **Nebula** ist eine exklusive Platform für Premium Drops und Events!\n\n🎯 **Was wir bietet:**\n• 🤳 Handzeichen-Verifizierung\n• 🎫 Premium Tickets\n• 💳 Crypto & Bargeld Zahlungen\n• 🚀 Exklusive Events\n\n💡 **Tipp:** Starte mit `/start` für die Verifizierung!",
    
    "wie funktioniert verifizierung": "🤳 **Verifizierung erklärt:**\n\n1️⃣ **Handzeichen:** Zufälliges Handzeichen wird gewählt\n2️⃣ **Foto:** Sende ein Foto mit dem Handzeichen\n3️⃣ **Prüfung:** Unser Team prüft dein Foto kurzfristig\n\n✅ **Nach Verifizierung:**\n• Voller Zugang zum Shop\n• Drops nach erster Bestellung oder erfolgreicher Einladung\n\n🚀 **Starte jetzt:** Nutze die Buttons im Menü!",
    
    "wie bezahle ich": "💳 **Zahlungsoptionen:**\n\n💰 **Crypto Voucher:**\n• Sofortige Credits\n• Einfach einlösen\n\n₿ **Bitcoin:**\n• Lightning Network\n• On-Chain verfügbar\n• Live-Status\n\n💵 **Bargeld:**\n• Am Nebula-Schalter\n• Mit Handzeichen-Verifizierung\n• QR-Code generieren\n\n🚀 **Schnellzahlung:** Nutze den 'Zahlen' Button!",
    
    "wo sind meine tickets": "🎫 **Deine Tickets:**\n\n📱 **WebApp:** Alle Tickets und QR-Codes\n🔔 **Benachrichtigungen:** Automatische Updates\n\n🚀 **Zugang:**\n• Nach Verifizierung verfügbar\n• Direkt über WebApp-Button\n• Alle Features freigeschaltet\n\n💡 **Jetzt verfügbar:** Öffne die WebApp!",
    
    "bot funktioniert nicht": "🔧 **Bot-Problem beheben:**\n\n1️⃣ **Bot neu starten:**\n• `/start` - Bot neu initialisieren\n• `/menu` - Hauptmenü öffnen\n\n2️⃣ **Cache leeren:**\n• Bot beenden und neu starten\n• Session wird zurückgesetzt\n\n3️⃣ **Support kontaktieren:**\n• Admin-Panel verfügbar\n• WebApp Support\n\n💡 **Häufige Lösung:** `/start` löst die meisten Probleme!",
    
    "default": "🤖 **KI-Support:**\n\n❓ **Ich verstehe deine Frage nicht ganz.**\n\n💡 **Häufige Fragen:**\n• 'was ist nebula'\n• 'wie funktioniert verifizierung'\n• 'wie bezahle ich'\n• 'wo sind meine tickets'\n• 'bot funktioniert nicht'\n\n🔍 **Oder nutze:**\n• `/start` - Bot neu starten\n• `/menu` - Hauptmenü\n\n💬 **Spezifische Frage?** Formuliere sie anders!"
  };

  // Enhanced Text Handler with Quick Command Integration
  bot.on("text", async (ctx, next) => {
    const message = ctx.message.text.toLowerCase().trim();
    
    // Invite-Code Handler
    if (ctx.session.awaitingInvite) {
      const code = ctx.message.text.trim();
      const isValid = code.startsWith("VIP") || code.length > 6;
      
      if (isValid) {
        ctx.session.inviteCode = code;
        ctx.session.onboardingStatus = "verified";
        ctx.session.awaitingInvite = false;
        
        // Update navigation
        navigationManager.pushScreen(ctx, 'invite_success', 'Invite Code Erfolg');
        
        await ctx.reply(
          "✅ **Invite-Code gültig!**\n\n" +
          "🎉 **Willkommen im Nebula Club!**\n" +
          "Du hast jetzt Zugang zu allen Features.\n\n" +
          "🚀 **Was jetzt möglich ist:**\n" +
          "• WebApp vollständig nutzen\n" +
          "• Premium Tickets kaufen\n" +
          "• Alle Zahlungsmethoden\n\n" +
          `🔑 **Verwendeter Code:** ${code}`,
          Markup.inlineKeyboard([
            [Markup.button.webApp("🚀 Nebula öffnen", ctx.config.webAppUrl || "http://localhost:5173")],
            [Markup.button.callback("🎯 Hauptmenü", "menu_back")]
          ])
        );
      } else {
        ctx.session.inviteCode = undefined;
        ctx.session.onboardingStatus = "unknown";
        await ctx.reply(
          "❌ **Invite-Code ungültig**\n\n" +
          "Bitte prüfe deinen Code oder fordere einen neuen an.\n\n" +
          "💡 **Gültige Codes:**\n" +
          "• Beginnen mit 'VIP'\n" +
          "• Haben 6+ Zeichen",
          Markup.inlineKeyboard([
            [Markup.button.callback("🔑 Neuen Code eingeben", "use_invite")],
            [Markup.button.callback("🤳 Verifizierung verwenden", "start_verification")],
            [Markup.button.callback("🔙 Zurück", "menu_back")]
          ])
        );
      }
      return;
    }

    // Try quick command handler first
    const quickCommandHandled = await quickCommandHandler.processText(ctx, message);
    if (quickCommandHandled) {
      return; // Quick command was handled
    }

    // Fallback to AI chatbot for questions
    const isQuestion = message.includes("?") || 
                      message.includes("wie") || 
                      message.includes("was") || 
                      message.includes("wo") || 
                      message.includes("wann") || 
                      message.includes("warum") ||
                      message.includes("help") ||
                      message.includes("hilfe");

    if (!isQuestion) {
      return next();
    }

    // Find matching response
    let response = aiResponses.default;
    
    for (const [key, value] of Object.entries(aiResponses)) {
      if (key === "default") continue;
      
      if (message.includes(key)) {
        response = value;
        break;
      }
    }

    // Send AI response with context-aware suggestions
    const suggestions = quickCommandHandler.getContextSuggestions(ctx);
    const suggestionText = suggestions.length > 0 
      ? `\n\n💡 **Schnelltipps:** ${suggestions.join(' • ')}`
      : '';

    await ctx.reply(
      response + suggestionText,
      { 
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback("❓ Weitere Fragen", "simple_help")],
          [Markup.button.callback("🔙 Zurück zum Menü", "menu_back")]
        ]).reply_markup
      }
    );

    logger.info("AI Support response sent", { 
      userId: ctx.from?.id, 
      question: message,
      responseKey: Object.keys(aiResponses).find(key => message.includes(key)) || "default",
      suggestions: suggestions.length
    });
  });
};