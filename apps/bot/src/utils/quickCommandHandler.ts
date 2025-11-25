import { Markup } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";
import { navigationManager } from "./navigationManager";

export interface QuickCommand {
  triggers: string[];
  handler: (ctx: NebulaContext) => Promise<void>;
  contextRelevance: (ctx: NebulaContext) => number;
  description: string;
  category: string;
}

export class QuickCommandHandler {
  private static instance: QuickCommandHandler;
  private commands: QuickCommand[] = [];
  private commandHistory = new Map<string, string[]>(); // User ID -> recent commands

  private constructor() {
    this.initializeCommands();
  }

  static getInstance(): QuickCommandHandler {
    if (!QuickCommandHandler.instance) {
      QuickCommandHandler.instance = new QuickCommandHandler();
    }
    return QuickCommandHandler.instance;
  }

  private getUserId(ctx: NebulaContext): string {
    return ctx.from?.id?.toString() || 'unknown';
  }

  private initializeCommands(): void {
    // Verification commands
    this.addCommand({
      triggers: ['wie verifizierung', 'verifizierung', 'verification', 'handzeichen', 'selfie'],
      handler: this.handleVerificationInfo,
      contextRelevance: (ctx) => ctx.session.onboardingStatus === 'unknown' ? 10 : 5,
      description: 'Verifizierung starten oder Info anzeigen',
      category: 'Verifizierung'
    });

    // Payment commands
    this.addCommand({
      triggers: ['zahlung', 'payment', 'bezahlen', 'bitte zahlung', 'wie bezahlen'],
      handler: this.handlePaymentInfo,
      contextRelevance: (ctx) => ctx.session.onboardingStatus === 'verified' ? 10 : 3,
      description: 'Zahlungsoptionen anzeigen',
      category: 'Zahlungen'
    });

    // Tickets commands
    this.addCommand({
      triggers: ['tickets', 'ticket status', 'meine tickets', 'support'],
      handler: this.handleTicketsInfo,
      contextRelevance: (ctx) => 7,
      description: 'Tickets anzeigen oder Support kontaktieren',
      category: 'Support'
    });

    // User stats/rank
    this.addCommand({
      triggers: ['mein rang', 'rang', 'stats', 'statistiken', 'meine stats'],
      handler: this.handleUserStats,
      contextRelevance: (ctx) => ctx.session.onboardingStatus === 'verified' ? 10 : 2,
      description: 'Deine Statistiken und Rang anzeigen',
      category: 'Profil'
    });

    // FAQ/Help
    this.addCommand({
      triggers: ['hilfe', 'help', 'faq', 'fragen', 'problem'],
      handler: this.handleHelp,
      contextRelevance: (ctx) => 8,
      description: 'Hilfe und FAQ anzeigen',
      category: 'Hilfe'
    });

    // WebApp
    this.addCommand({
      triggers: ['webapp', 'app', 'shop', 'öffnen', 'nebula'],
      handler: this.handleWebApp,
      contextRelevance: (ctx) => ctx.session.onboardingStatus === 'verified' ? 10 : 5,
      description: 'Nebula WebApp öffnen',
      category: 'App'
    });

    // Invite codes
    this.addCommand({
      triggers: ['invite', 'code', 'einladung', 'referral'],
      handler: this.handleInviteCode,
      contextRelevance: (ctx) => ctx.session.onboardingStatus === 'unknown' ? 10 : 3,
      description: 'Invite Code verwenden',
      category: 'Verifizierung'
    });

    // Settings
    this.addCommand({
      triggers: ['einstellungen', 'settings', 'konfiguration'],
      handler: this.handleSettings,
      contextRelevance: (ctx) => 6,
      description: 'Einstellungen öffnen',
      category: 'Einstellungen'
    });
  }

  private addCommand(command: QuickCommand): void {
    this.commands.push(command);
  }

  // Process text input and find matching commands
  async processText(ctx: NebulaContext, text: string): Promise<boolean> {
    const userId = this.getUserId(ctx);
    const normalizedText = text.toLowerCase().trim();

    // Store in command history
    const history = this.commandHistory.get(userId) || [];
    history.unshift(normalizedText);
    this.commandHistory.set(userId, history.slice(0, 10)); // Keep last 10 commands

    // Find best matching command
    const matches = this.findMatches(normalizedText, ctx);
    
    if (matches.length === 0) {
      return false; // No match found
    }

    const bestMatch = matches[0];
    
    try {
      await bestMatch.handler(ctx);
      logger.info("Quick command executed", { 
        userId, 
        command: normalizedText, 
        matchedCommand: bestMatch.triggers[0] 
      });
      return true;
    } catch (error) {
      logger.error("Quick command execution failed", { 
        userId, 
        command: normalizedText, 
        error: String(error) 
      });
      
      // Send error message to user
      try {
        await ctx.reply(
          "❌ **Fehler beim Ausführen des Befehls**\n\n" +
          "Bitte versuche es erneut oder nutze das Menü.",
          Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Hauptmenü", "menu_back")],
            [Markup.button.callback("❓ Hilfe", "simple_help")]
          ])
        );
      } catch (replyError) {
        logger.error("Failed to send error message to user", { error: String(replyError) });
      }
      
      return false;
    }
  }

  private findMatches(text: string, ctx: NebulaContext): QuickCommand[] {
    const matches: { command: QuickCommand; score: number }[] = [];

    for (const command of this.commands) {
      let bestScore = 0;
      
      for (const trigger of command.triggers) {
        const score = this.calculateMatchScore(text, trigger);
        if (score > bestScore) {
          bestScore = score;
        }
      }

      if (bestScore > 0.3) { // Minimum threshold
        const contextRelevance = command.contextRelevance(ctx);
        const finalScore = bestScore * (1 + contextRelevance / 20); // Boost by context relevance
        
        matches.push({ command, score: finalScore });
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .map(m => m.command);
  }

  private calculateMatchScore(text: string, trigger: string): number {
    const textWords = text.split(/\s+/);
    const triggerWords = trigger.split(/\s+/);
    
    let matches = 0;
    let totalWords = Math.max(textWords.length, triggerWords.length);
    
    for (const textWord of textWords) {
      for (const triggerWord of triggerWords) {
        if (textWord.includes(triggerWord) || triggerWord.includes(textWord)) {
          matches++;
          break;
        }
      }
    }
    
    return matches / totalWords;
  }

  // Command handlers
  private async handleVerificationInfo(ctx: NebulaContext): Promise<void> {
    navigationManager.pushScreen(ctx, 'verification_info', 'Verifizierung Info');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🤳 Verifizierung starten", "start_verification")],
      [Markup.button.callback("🔑 Invite Code verwenden", "use_invite")],
      [Markup.button.callback("❓ FAQ Verifizierung", "faq_verification")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    await ctx.reply(
      "🤳 **Verifizierung - Schnellinfo**\n\n" +
      "**So funktioniert's:**\n" +
      "1️⃣ Handzeichen wird zufällig gewählt\n" +
      "2️⃣ Foto mit Handzeichen senden\n" +
      "3️⃣ Team prüft (5-15 Min)\n\n" +
      "**Alternative:** Invite Code für sofortigen Zugang\n\n" +
      "🚀 **Wähle deine Option:**",
      { parse_mode: "Markdown", ...keyboard }
    );
  }

  private async handlePaymentInfo(ctx: NebulaContext): Promise<void> {
    navigationManager.pushScreen(ctx, 'payment_info', 'Zahlungsoptionen');
    
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    let keyboard;
    if (isHttps) {
      keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp("💳 WebApp öffnen", webAppUrl)],
        [Markup.button.callback("❓ FAQ Zahlungen", "faq_payments")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ]);
    } else {
      keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("💳 WebApp öffnen", "open_webapp_payment")],
        [Markup.button.callback("❓ FAQ Zahlungen", "faq_payments")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ]);
    }

    await ctx.reply(
      "💳 **Zahlungsoptionen**\n\n" +
      "**Verfügbare Methoden:**\n" +
      "• 💰 Crypto Voucher (Sofort)\n" +
      "• ₿ Bitcoin (Lightning & On-Chain)\n" +
      "• 💵 Bargeld (Nebula-Schalter)\n" +
      "• 💎 VIP: Auf KO holen\n\n" +
      "ℹ️ **Zahlung erfolgt in der WebApp**\n" +
      "Der Bot zeigt nur Informationen.\n\n" +
      "🚀 **Jetzt bezahlen:**",
      { parse_mode: "Markdown", ...keyboard }
    );
  }

  private async handleTicketsInfo(ctx: NebulaContext): Promise<void> {
    navigationManager.pushScreen(ctx, 'tickets_info', 'Tickets & Support');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🎫 Meine Tickets", "support_list")],
      [Markup.button.callback("🆕 Neues Ticket", "support_new")],
      [Markup.button.callback("💬 Live Chat", "live_chat")],
      [Markup.button.callback("❓ FAQ Support", "support_faq")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    await ctx.reply(
      "🎫 **Tickets & Support**\n\n" +
      "**Deine Support-Optionen:**\n" +
      "• 📋 Alle Tickets anzeigen\n" +
      "• 🆕 Neues Ticket erstellen\n" +
      "• 💬 Live Chat (VIP/Stammkunde)\n" +
      "• ❓ FAQ durchsuchen\n\n" +
      "💎 **VIP-Features:** Direkte Bot-Antworten mit `/reply`\n\n" +
      "🚀 **Wähle eine Option:**",
      { parse_mode: "Markdown", ...keyboard }
    );
  }

  private async handleUserStats(ctx: NebulaContext): Promise<void> {
    navigationManager.pushScreen(ctx, 'user_stats', 'Deine Statistiken');
    
    // Try to fetch real user data
    let userStats = "📊 **Deine Statistiken**\n\n";
    
    try {
      const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/user/${ctx.from?.id}/stats`);
      if (response.ok) {
        const data = await response.json();
        userStats += `🏆 **Rang:** ${data.rank || 'Neuling'}\n`;
        userStats += `🛍️ **Bestellungen:** ${data.orders || 0}\n`;
        userStats += `💰 **Ausgegeben:** €${data.spent || 0}\n`;
        userStats += `🎫 **Tickets:** ${data.tickets || 0}\n`;
        userStats += `👥 **Eingeladen:** ${data.invites || 0}\n\n`;
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      userStats += `🏆 **Rang:** Neuling\n`;
      userStats += `🛍️ **Bestellungen:** 0\n`;
      userStats += `💰 **Ausgegeben:** €0\n`;
      userStats += `🎫 **Tickets:** 0\n`;
      userStats += `👥 **Eingeladen:** 0\n\n`;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("📈 Detaillierte Stats", "detailed_stats")],
      [Markup.button.callback("👥 Affiliate Dashboard", "affiliate_dashboard")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    await ctx.reply(
      userStats + "💡 **Tipp:** Nutze die WebApp für detaillierte Analytics!",
      { parse_mode: "Markdown", ...keyboard }
    );
  }

  private async handleHelp(ctx: NebulaContext): Promise<void> {
    navigationManager.pushScreen(ctx, 'help_main', 'Hilfe & FAQ');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🤳 Verifizierung", "faq_verification")],
      [Markup.button.callback("💳 Zahlungen", "faq_payments")],
      [Markup.button.callback("🎫 Tickets", "faq_tickets")],
      [Markup.button.callback("🎯 Drops & Ränge", "faq_drops_ranks")],
      [Markup.button.callback("👥 Einladungen", "faq_invites")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    await ctx.reply(
      "❓ **Hilfe & FAQ**\n\n" +
      "**Häufige Themen:**\n" +
      "• Verifizierung & Handzeichen\n" +
      "• Zahlungen & Methoden\n" +
      "• Tickets & QR-Codes\n" +
      "• Einladungen & Ränge\n\n" +
      "💬 **Kurze Antworten** – schreib z.B.:\n" +
      "› 'wie verifizierung' • 'bitte zahlung' • 'tickets status'\n\n" +
      "⚡ **Schnellbefehle:** /start • /menu",
      { parse_mode: "Markdown", ...keyboard }
    );
  }

  private async handleWebApp(ctx: NebulaContext): Promise<void> {
    const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
    
    if (ctx.session.onboardingStatus !== 'verified') {
      await ctx.reply(
        "⛔️ **WebApp nicht verfügbar**\n\n" +
        "Du musst zuerst verifiziert werden.\n\n" +
        "🚀 **Verifizierung starten:**",
        Markup.inlineKeyboard([
          [Markup.button.callback("🤳 Verifizierung", "start_verification")],
          [Markup.button.callback("🔑 Invite Code", "use_invite")]
        ])
      );
      return;
    }

    const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
    
    if (isHttps) {
      const webBtn = Markup.button.webApp("🚀 Nebula öffnen", webAppUrl);
      await ctx.reply(
        "🚀 **Nebula WebApp**\n\n" +
        "✅ **Vollzugang verfügbar!**\n\n" +
        "🛍️ Shop • 🎯 Drops • 💳 Zahlungen • 🎫 Tickets",
        { parse_mode: "Markdown", ...webBtn }
      );
    } else {
      await ctx.reply(
        "🚀 **Nebula WebApp**\n\n" +
        "✅ **Vollzugang verfügbar!**\n\n" +
        "🛍️ Shop • 🎯 Drops • 💳 Zahlungen • 🎫 Tickets\n\n" +
        `🌐 **WebApp URL:** ${webAppUrl}\n\n` +
        "💡 **Tipp:** Kopiere den Link in deinen Browser!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
    }
  }

  private async handleInviteCode(ctx: NebulaContext): Promise<void> {
    navigationManager.pushScreen(ctx, 'invite_code', 'Invite Code');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🔑 Code eingeben", "use_invite")],
      [Markup.button.callback("🤳 Verifizierung verwenden", "start_verification")],
      [Markup.button.callback("❓ FAQ Codes", "faq_invite_codes")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    await ctx.reply(
      "🔑 **Invite Code**\n\n" +
      "**Sofortiger Zugang ohne Verifizierung!**\n\n" +
      "**Test-Codes verfügbar:**\n" +
      "• `VIP123` - 5 Verwendungen\n" +
      "• `NEB456` - 3 Verwendungen\n" +
      "• `INV789` - 1 Verwendung\n\n" +
      "💡 **Code eingeben:** Schreibe einfach den Code als Nachricht!",
      { parse_mode: "Markdown", ...keyboard }
    );
  }

  private async handleSettings(ctx: NebulaContext): Promise<void> {
    navigationManager.pushScreen(ctx, 'settings_main', 'Einstellungen');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🔔 Benachrichtigungen", "notification_settings")],
      [Markup.button.callback("🌙 Dark Mode", "dark_mode")],
      [Markup.button.callback("🔒 Datenschutz", "privacy_settings")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);

    await ctx.reply(
      "⚙️ **Einstellungen**\n\n" +
      "**Verfügbare Optionen:**\n" +
      "• 🔔 Benachrichtigungen an/aus\n" +
      "• 🌙 Dark Mode Einstellungen\n" +
      "• 🔒 Datenschutz & Privatsphäre\n\n" +
      "💡 **Tipp:** Einstellungen werden in der WebApp gespeichert!",
      { parse_mode: "Markdown", ...keyboard }
    );
  }

  // Get context-aware suggestions
  getContextSuggestions(ctx: NebulaContext): string[] {
    const currentScreen = navigationManager.getCurrentScreen(ctx);
    const suggestions: string[] = [];

    // Add context-specific suggestions
    if (currentScreen?.screenId === 'verification_info') {
      suggestions.push("wie verifizierung", "handzeichen", "selfie");
    } else if (currentScreen?.screenId === 'payment_info') {
      suggestions.push("bitte zahlung", "wie bezahlen", "zahlungsmethoden");
    } else if (currentScreen?.screenId === 'tickets_info') {
      suggestions.push("tickets status", "meine tickets", "support");
    }

    // Add general suggestions based on user status
    if (ctx.session.onboardingStatus === 'unknown') {
      suggestions.push("wie verifizierung", "invite code", "hilfe");
    } else if (ctx.session.onboardingStatus === 'verified') {
      suggestions.push("mein rang", "tickets", "webapp", "einstellungen");
    }

    return suggestions.slice(0, 3); // Max 3 suggestions
  }

  // Get command history for user
  getCommandHistory(ctx: NebulaContext): string[] {
    const userId = this.getUserId(ctx);
    return this.commandHistory.get(userId) || [];
  }
}

// Export singleton instance
export const quickCommandHandler = QuickCommandHandler.getInstance();
