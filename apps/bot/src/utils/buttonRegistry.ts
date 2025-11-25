import { Markup } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";

export interface ButtonAction {
  actionId: string;
  handler: (ctx: NebulaContext) => Promise<void>;
  requiredRank?: string[];
  requiresVerification?: boolean;
  apiEndpoint?: string;
  description: string;
  category: string;
}

export interface ButtonConfig {
  loadingText?: string;
  errorText?: string;
  fallbackAction?: string;
  requiresApi?: boolean;
}

export class ButtonRegistry {
  private static instance: ButtonRegistry;
  private actions = new Map<string, ButtonAction>();
  private configs = new Map<string, ButtonConfig>();

  private constructor() {}

  static getInstance(): ButtonRegistry {
    if (!ButtonRegistry.instance) {
      ButtonRegistry.instance = new ButtonRegistry();
    }
    return ButtonRegistry.instance;
  }

  // Register a button action
  registerAction(action: ButtonAction, config?: ButtonConfig): void {
    this.actions.set(action.actionId, action);
    if (config) {
      this.configs.set(action.actionId, config);
    }
    
    logger.info("Button action registered", { 
      actionId: action.actionId, 
      category: action.category,
      requiresVerification: action.requiresVerification,
      requiredRank: action.requiredRank 
    });
  }

  // Execute a button action with full error handling
  async executeAction(ctx: NebulaContext, actionId: string): Promise<boolean> {
    const action = this.actions.get(actionId);
    const config = this.configs.get(actionId);

    if (!action) {
      logger.warn("Unknown button action", { actionId, userId: ctx.from?.id });
      await this.handleUnknownAction(ctx, actionId);
      return false;
    }

    // Check requirements
    const requirementsCheck = await this.checkRequirements(ctx, action);
    if (!requirementsCheck.allowed) {
      await this.handleRequirementFailure(ctx, action, requirementsCheck.reason);
      return false;
    }

    // Show loading state
    if (config?.loadingText) {
      await ctx.answerCbQuery(config.loadingText);
    } else {
      await ctx.answerCbQuery("⏳ Wird geladen...");
    }

    try {
      // Execute the action
      await action.handler(ctx);
      
      logger.info("Button action executed successfully", { 
        actionId, 
        userId: ctx.from?.id,
        category: action.category 
      });
      return true;
    } catch (error) {
      logger.error("Button action execution failed", { 
        actionId, 
        userId: ctx.from?.id,
        error: String(error) 
      });
      
      await this.handleActionError(ctx, action, error, config);
      return false;
    }
  }

  // Check if user meets action requirements
  private async checkRequirements(ctx: NebulaContext, action: ButtonAction): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check verification requirement
    if (action.requiresVerification && ctx.session.onboardingStatus !== 'verified') {
      return {
        allowed: false,
        reason: 'Verification required'
      };
    }

    // Check rank requirement
    if (action.requiredRank && action.requiredRank.length > 0) {
      try {
        const userRank = await this.getUserRank(ctx);
        if (!userRank || !action.requiredRank.includes(userRank)) {
          return {
            allowed: false,
            reason: `Rank required: ${action.requiredRank.join(' or ')}`
          };
        }
      } catch (error) {
        logger.warn("Failed to check user rank", { error: String(error) });
        // Allow action if rank check fails (graceful degradation)
      }
    }

    return { allowed: true };
  }

  // Get user rank from API
  private async getUserRank(ctx: NebulaContext): Promise<string | null> {
    try {
      const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/rank/${ctx.from?.id}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      return data.data?.rank || null;
    } catch (error) {
      logger.warn("Failed to fetch user rank", { error: String(error) });
      return null;
    }
  }

  // Handle unknown action
  private async handleUnknownAction(ctx: NebulaContext, actionId: string): Promise<void> {
    await ctx.answerCbQuery("❌ Unbekannte Aktion");
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🔙 Zurück", "menu_back")],
      [Markup.button.callback("❓ FAQ", "open_faq")],
      [Markup.button.callback("🎫 Support", "support_new")]
    ]);

    await ctx.reply(
      "❌ **Unbekannte Aktion**\n\n" +
      "**Was ist passiert?**\n" +
      `Die Aktion \`${actionId}\` ist nicht verfügbar oder wurde nicht gefunden.\n\n` +
      "**Lösung Schritt für Schritt:**\n" +
      "1. Nutze /start für das Hauptmenü\n" +
      "2. Oder durchsuche die FAQ für Hilfe\n" +
      "3. Falls das Problem weiterhin besteht, kontaktiere den Support\n\n" +
      "💡 **Tipp:** Meist hilft ein Neustart mit /start!",
      { parse_mode: "Markdown", ...keyboard }
    );
  }

  // Handle requirement failure
  private async handleRequirementFailure(ctx: NebulaContext, action: ButtonAction, reason: string): Promise<void> {
    await ctx.answerCbQuery("⛔️ Nicht verfügbar");

    let message = "⛔️ **Aktion nicht verfügbar**\n\n";
    let buttons = [];

    if (reason === 'Verification required') {
      message += "**Was ist passiert?**\n";
      message += "Du musst zuerst verifiziert werden, um diese Funktion zu nutzen.\n\n";
      message += "**Lösung:**\n";
      message += "1. Starte die Verifizierung mit einem Foto\n";
      message += "2. Oder nutze einen Invite-Code für sofortigen Zugang\n\n";
      message += "💡 **Tipp:** Invite-Codes sind der schnellste Weg!";
      buttons = [
        [Markup.button.callback("🤳 Verifizierung starten", "start_verification")],
        [Markup.button.callback("🔑 Invite-Code verwenden", "use_invite")],
        [Markup.button.callback("❓ Hilfe & FAQ", "open_faq")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ];
    } else if (reason.startsWith('Rank required:')) {
      const requiredRanks = reason.replace('Rank required: ', '');
      message += "**Was ist passiert?**\n";
      message += `Diese Funktion ist nur für ${requiredRanks} verfügbar.\n\n`;
      message += "**Lösung:**\n";
      message += "1. Werde VIP oder Stammkunde\n";
      message += "2. Erfülle die Anforderungen (Bestellungen oder Einladungen)\n\n";
      message += "💎 **VIP-Vorteile:**\n";
      message += "• Erweiterte Features\n";
      message += "• Prioritäts-Support\n";
      message += "• Exklusive Inhalte\n";
      message += "• Früher Zugang zu Drops";
      buttons = [
        [Markup.button.callback("💎 VIP Upgrade", "vip_upgrade")],
        [Markup.button.callback("📊 Meine Statistiken", "user_stats")],
        [Markup.button.callback("❓ Hilfe & FAQ", "open_faq")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ];
    } else {
      message += "**Was ist passiert?**\n";
      message += `Diese Aktion ist aktuell nicht verfügbar.\n\n`;
      message += `**Grund:** ${reason}\n\n`;
      message += "**Lösung:**\n";
      message += "1. Versuche es später erneut\n";
      message += "2. Kontaktiere den Support für Hilfe\n";
      message += "3. Prüfe die FAQ für weitere Informationen\n\n";
      message += "💡 **Tipp:** Meist hilft ein Neustart!";
      buttons = [
        [Markup.button.callback("🎫 Support kontaktieren", "support_new")],
        [Markup.button.callback("❓ FAQ durchsuchen", "open_faq")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ];
    }

    const keyboard = Markup.inlineKeyboard(buttons);
    await ctx.reply(message, { parse_mode: "Markdown", ...keyboard });
  }

  // Handle action error
  private async handleActionError(ctx: NebulaContext, action: ButtonAction, error: any, config?: ButtonConfig): Promise<void> {
    const errorMessage = config?.errorText || "Ein Fehler ist aufgetreten";
    await ctx.answerCbQuery("❌ Fehler");

    let message = `❌ **${errorMessage}**\n\n`;
    message += `**Aktion:** ${action.description}\n\n`;

    // Add specific error handling
    if (config?.requiresApi && error.message?.includes('fetch')) {
      message += "**Was ist passiert?**\n";
      message += "Die Verbindung zum Server ist fehlgeschlagen.\n\n";
      message += "**Lösung Schritt für Schritt:**\n";
      message += "1. Prüfe deine Internetverbindung\n";
      message += "2. Warte 30 Sekunden\n";
      message += "3. Versuche es erneut\n";
      message += "4. Falls das Problem weiterhin besteht, kontaktiere den Support\n\n";
      message += "💡 **Tipp:** Meist hilft ein erneuter Versuch!";
    } else if (error.message?.includes('timeout')) {
      message += "**Was ist passiert?**\n";
      message += "Die Aktion hat zu lange gedauert.\n\n";
      message += "**Lösung Schritt für Schritt:**\n";
      message += "1. Warte 30 Sekunden\n";
      message += "2. Versuche es erneut\n";
      message += "3. Prüfe deine Internetverbindung\n";
      message += "4. Falls das Problem weiterhin besteht, kontaktiere den Support\n\n";
      message += "💡 **Tipp:** Bei langsamer Verbindung kann es länger dauern!";
    } else {
      message += "**Was ist passiert?**\n";
      message += "Beim Ausführen der Aktion ist ein technischer Fehler aufgetreten.\n\n";
      message += "**Lösung Schritt für Schritt:**\n";
      message += "1. Versuche es in 30 Sekunden erneut\n";
      message += "2. Starte den Bot neu mit /start\n";
      message += "3. Falls das Problem weiterhin besteht, kontaktiere den Support\n\n";
      message += "💡 **Unser Team wurde benachrichtigt** – wir kümmern uns darum!";
    }

    // Add fallback action if available
    const buttons = [];
    if (config?.fallbackAction) {
      buttons.push([Markup.button.callback("🔄 Erneut versuchen", config.fallbackAction)]);
    }
    buttons.push([Markup.button.callback("🔙 Zurück", "menu_back")]);
    buttons.push([Markup.button.callback("🎫 Support kontaktieren", "support_new")]);
    buttons.push([Markup.button.callback("❓ FAQ durchsuchen", "open_faq")]);

    const keyboard = Markup.inlineKeyboard(buttons);
    await ctx.reply(message, { parse_mode: "Markdown", ...keyboard });
  }

  // Get all actions for a category
  getActionsByCategory(category: string): ButtonAction[] {
    return Array.from(this.actions.values()).filter(action => action.category === category);
  }

  // Get action info
  getAction(actionId: string): ButtonAction | undefined {
    return this.actions.get(actionId);
  }

  // Check if action exists
  hasAction(actionId: string): boolean {
    return this.actions.has(actionId);
  }

  // Get all registered actions
  getAllActions(): ButtonAction[] {
    return Array.from(this.actions.values());
  }

  // Get actions available for user
  async getAvailableActions(ctx: NebulaContext): Promise<ButtonAction[]> {
    const availableActions: ButtonAction[] = [];

    for (const action of this.actions.values()) {
      const requirementsCheck = await this.checkRequirements(ctx, action);
      if (requirementsCheck.allowed) {
        availableActions.push(action);
      }
    }

    return availableActions;
  }
}

// Export singleton instance
export const buttonRegistry = ButtonRegistry.getInstance();

// Helper function to register common button patterns
export function registerCommonButtons(): void {
  // FAQ buttons
  buttonRegistry.registerAction({
    actionId: "faq_verification",
    handler: async (ctx) => {
      const message = 
        "🤳 **Verifizierung – FAQ**\n\n" +
        "**Wie funktioniert die Verifizierung?**\n" +
        "1. Handzeichen wird zufällig gewählt\n" +
        "2. Sende ein Foto mit dem Handzeichen\n" +
        "3. Unser Team prüft dein Foto (normalerweise 1-2 Stunden)\n\n" +
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
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ]);
      
      await ctx.reply(message, { parse_mode: "Markdown", ...keyboard });
    },
    description: "Verifizierung FAQ anzeigen",
    category: "FAQ"
  });

  buttonRegistry.registerAction({
    actionId: "faq_payments",
    handler: async (ctx) => {
      const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
      const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
      
      const message = 
        "💳 **Zahlungen – FAQ**\n\n" +
        "**Welche Zahlungsmethoden gibt es?**\n" +
        "• 💵 Bargeld (am Schalter)\n" +
        "• 💰 CryptoVoucher (Sofort)\n" +
        "• ₿ Bitcoin (Lightning & On-Chain)\n" +
        "• 💎 Auf KO holen (ab Stammkunde/VIP)\n\n" +
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
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ]);
      } else {
        keyboard = Markup.inlineKeyboard([
          [Markup.button.callback("💳 WebApp öffnen", "open_webapp_payment")],
          [Markup.button.callback("💰 Guthaben aufladen", "add_credits")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ]);
      }
      
      await ctx.reply(message, { parse_mode: "Markdown", ...keyboard });
    },
    description: "Zahlungen FAQ anzeigen",
    category: "FAQ"
  });

  // Navigation buttons
  buttonRegistry.registerAction({
    actionId: "menu_back",
    handler: async (ctx) => {
      // Navigate back using navigation manager or show main menu
      const { navigationManager } = await import("../utils/navigationManager");
      if (navigationManager.canGoBack(ctx)) {
        const previousScreen = navigationManager.popScreen(ctx);
        if (previousScreen) {
          // Try to handle the previous screen
          const { handleScreenNavigation } = await import("../flows/simplifiedMenu");
          if (handleScreenNavigation) {
            await handleScreenNavigation(ctx, previousScreen.screenId);
            return;
          }
        }
      }
      // Fallback: Show main menu
      await ctx.reply(
        "🏠 **Hauptmenü**\n\n" +
        "Willkommen zurück! Wähle eine Option:",
        Markup.inlineKeyboard([
          [Markup.button.callback("🤳 Verifizierung", "start_verification")],
          [Markup.button.callback("🔑 Invite-Code", "use_invite")],
          [Markup.button.callback("🎫 Support", "support_new")],
          [Markup.button.callback("❓ FAQ", "open_faq")]
        ])
      );
    },
    description: "Zurück navigieren",
    category: "Navigation"
  });

  // Support buttons
  buttonRegistry.registerAction({
    actionId: "support_new",
    handler: async (ctx) => {
      // Redirect to support command handler
      const { registerSupportTickets } = await import("../flows/supportTickets");
      // The support_new action is handled in supportTickets.ts
      // This is just a redirect
      await ctx.reply(
        "🎫 **Neues Ticket erstellen**\n\n" +
        "**So funktioniert's:**\n" +
        "1. Wähle die passende Kategorie\n" +
        "2. Beschreibe dein Problem detailliert\n" +
        "3. Unser Team antwortet schnellstmöglich\n\n" +
        "⏰ **Antwortzeit:** Normalerweise innerhalb von 24 Stunden\n\n" +
        "**Nutze /support für das vollständige Ticket-System!**",
        Markup.inlineKeyboard([
          [Markup.button.callback("🎫 Support öffnen", "support_new")],
          [Markup.button.callback("❓ FAQ", "open_faq")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
    },
    description: "Neues Support Ticket erstellen",
    category: "Support"
  }, {
    loadingText: "🎫 Ticket wird erstellt...",
    errorText: "Ticket-Erstellung fehlgeschlagen",
    fallbackAction: "support_new"
  });

  // Premium buttons - These are already implemented in premiumFeatures.ts
  // Just register them here for button registry access
  buttonRegistry.registerAction({
    actionId: "premium_support",
    handler: async (ctx) => {
      // This is handled in premiumFeatures.ts
      await ctx.reply(
        "🎫 **Premium Support**\n\n" +
        "**VIP-Features verfügbar:**\n" +
        "• 🚀 Prioritäts-Support (1-4h)\n" +
        "• 💬 Live Chat mit Agenten\n" +
        "• 📞 Direkter Admin-Kontakt\n" +
        "• 🤖 Bot-Antworten mit /reply\n\n" +
        "**Nutze die Premium-Features im Hauptmenü!**",
        Markup.inlineKeyboard([
          [Markup.button.callback("🎫 Premium Support", "premium_support")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
    },
    requiresVerification: true,
    requiredRank: ["VIP", "Stammkunde"],
    description: "Premium Support Dashboard",
    category: "Premium"
  });

  buttonRegistry.registerAction({
    actionId: "affiliate_dashboard",
    handler: async (ctx) => {
      // This is handled in premiumFeatures.ts
      await ctx.reply(
        "👥 **Affiliate Dashboard**\n\n" +
        "**Was ist das Affiliate-System?**\n" +
        "Teile deinen persönlichen Ref-Link und verdiene Belohnungen!\n\n" +
        "**Wie funktioniert's?**\n" +
        "1. Teile deinen Ref-Link\n" +
        "2. Jemand nutzt den Link\n" +
        "3. Du erhältst Belohnungen\n\n" +
        "**Nutze die Affiliate-Features im Hauptmenü!**",
        Markup.inlineKeyboard([
          [Markup.button.callback("👥 Affiliate Dashboard", "affiliate_dashboard")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
    },
    requiresVerification: true,
    description: "Affiliate Dashboard anzeigen",
    category: "Affiliate"
  });
}































































