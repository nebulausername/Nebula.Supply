import { Markup, Telegraf } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";
import { navigationManager } from "../utils/navigationManager";
import { buttonRegistry } from "../utils/buttonRegistry";

export const registerPremiumFeatures = (bot: Telegraf<NebulaContext>) => {
  
  // Premium Support Dashboard
  buttonRegistry.registerAction({
    actionId: "premium_support",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'premium_support', 'Premium Support');
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("🆕 Prioritäts-Ticket", "priority_ticket")],
        [Markup.button.callback("💬 Live Chat", "live_chat")],
        [Markup.button.callback("📋 Meine Tickets", "premium_tickets")],
        [Markup.button.callback("📞 Direkter Kontakt", "direct_contact")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ]);

      await ctx.editMessageText(
        "🎫 **Premium Support**\n\n" +
        "✅ **VIP-Features verfügbar:**\n" +
        "• 🚀 Prioritäts-Support (1-4h)\n" +
        "• 💬 Live Chat mit Agenten\n" +
        "• 📞 Direkter Admin-Kontakt\n" +
        "• 🤖 Bot-Antworten mit /reply\n\n" +
        "💎 **Deine Vorteile:**\n" +
        "• Schnellere Bearbeitung\n" +
        "• Exklusive Features\n" +
        "• Persönlicher Support\n\n" +
        "🚀 **Wähle deine Option:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    },
    requiresVerification: true,
    requiredRank: ["VIP", "Stammkunde"],
    description: "Premium Support Dashboard",
    category: "Premium"
  });

  // Priority Ticket Creation
  buttonRegistry.registerAction({
    actionId: "priority_ticket",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'priority_ticket', 'Prioritäts-Ticket');
      
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback("🛒 Bestellung", "priority_cat_order"),
          Markup.button.callback("💳 Zahlung", "priority_cat_payment")
        ],
        [
          Markup.button.callback("🐛 Technisch", "priority_cat_technical"),
          Markup.button.callback("💎 VIP-Feature", "priority_cat_vip")
        ],
        [Markup.button.callback("🔙 Zurück", "premium_support")]
      ]);

      await ctx.editMessageText(
        "🆕 **Prioritäts-Ticket erstellen**\n\n" +
        "⚡ **VIP-Bearbeitung:** 1-4 Stunden\n" +
        "🎯 **Kategorie wählen:**\n\n" +
        "🛒 **Bestellung** - Bestellprobleme\n" +
        "💳 **Zahlung** - Zahlungsprobleme\n" +
        "🐛 **Technisch** - System-Probleme\n" +
        "💎 **VIP-Feature** - Exklusive Anfragen\n\n" +
        "💡 **Tipp:** Beschreibe dein Problem detailliert!",
        { parse_mode: "Markdown", ...keyboard }
      );
    },
    requiresVerification: true,
    requiredRank: ["VIP", "Stammkunde"],
    description: "Prioritäts-Ticket erstellen",
    category: "Premium"
  });

  // Live Chat
  buttonRegistry.registerAction({
    actionId: "live_chat",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'live_chat', 'Live Chat');
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("💬 Chat starten", "start_live_chat")],
        [Markup.button.callback("📋 Chat-Historie", "chat_history")],
        [Markup.button.callback("🔙 Zurück", "premium_support")]
      ]);

      await ctx.editMessageText(
        "💬 **Live Chat Support**\n\n" +
        "🤖 **Verfügbare Agenten:** 2 online\n" +
        "⏰ **Durchschnittliche Wartezeit:** 2 Minuten\n" +
        "🕐 **Verfügbarkeit:** 24/7\n\n" +
        "💎 **VIP-Features:**\n" +
        "• Sofortige Verbindung\n" +
        "• Prioritäts-Warteschlange\n" +
        "• Erfahrene Agenten\n\n" +
        "🚀 **Chat jetzt starten:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    },
    requiresVerification: true,
    requiredRank: ["VIP", "Stammkunde"],
    description: "Live Chat Support",
    category: "Premium"
  });

  // Premium Payments
  buttonRegistry.registerAction({
    actionId: "premium_payments",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'premium_payments', 'Premium Zahlungen');
      
      // Try to fetch real payment data
      let paymentInfo = "💳 **Premium Zahlungen**\n\n";
      let creditBalance = "€0.00";
      let paymentHistory = "Keine Zahlungen";
      
      try {
        const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/user/${ctx.from?.id}/payments`);
        if (response.ok) {
          const data = await response.json();
          creditBalance = `€${data.balance || 0}`;
          paymentHistory = `${data.recentPayments || 0} Zahlungen`;
        }
      } catch (error) {
        logger.warn("Failed to fetch payment data", { error: String(error) });
      }

      paymentInfo += `💰 **Guthaben:** ${creditBalance}\n`;
      paymentInfo += `📊 **Historie:** ${paymentHistory}\n\n`;
      paymentInfo += `✅ **Verfügbare Methoden:**\n`;
      paymentInfo += `• 💰 Crypto Voucher (Sofort)\n`;
      paymentInfo += `• ₿ Bitcoin (Lightning & On-Chain)\n`;
      paymentInfo += `• 💵 Bargeld (Nebula-Schalter)\n`;
      paymentInfo += `• 💎 VIP-Zahlungen\n\n`;
      paymentInfo += `🎯 **Wähle deine Aktion:**`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("💰 Guthaben aufladen", "add_credits")],
        [Markup.button.callback("📊 Zahlungshistorie", "payment_history")],
        [Markup.button.callback("💎 VIP-Upgrade", "vip_upgrade")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ]);

      await ctx.editMessageText(paymentInfo, { parse_mode: "Markdown", ...keyboard });
    },
    requiresVerification: true,
    description: "Premium Zahlungsoptionen",
    category: "Premium"
  });

  // Add Credits
  buttonRegistry.registerAction({
    actionId: "add_credits",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'add_credits', 'Guthaben aufladen');
      
      const webAppUrl = ctx.config.webAppUrl || "http://localhost:5173";
      const isHttps = webAppUrl.startsWith("https://") && !webAppUrl.includes("localhost");
      
      let keyboard;
      if (isHttps) {
        keyboard = Markup.inlineKeyboard([
          [Markup.button.webApp("💳 WebApp öffnen", webAppUrl)],
          [Markup.button.callback("❓ Zahlungsmethoden", "faq_payments")],
          [Markup.button.callback("🔙 Zurück", "premium_payments")]
        ]);
      } else {
        keyboard = Markup.inlineKeyboard([
          [Markup.button.callback("💳 WebApp öffnen", "open_webapp_payment")],
          [Markup.button.callback("❓ Zahlungsmethoden", "faq_payments")],
          [Markup.button.callback("🔙 Zurück", "premium_payments")]
        ]);
      }

      await ctx.editMessageText(
        "💰 **Guthaben aufladen**\n\n" +
        "🚀 **Schnellste Methode:** WebApp öffnen\n\n" +
        "**Verfügbare Optionen:**\n" +
        "• 💰 Crypto Voucher (Sofort)\n" +
        "• ₿ Bitcoin (Lightning & On-Chain)\n" +
        "• 💵 Bargeld (QR-Code generieren)\n\n" +
        "💡 **Tipp:** Lightning Network ist am schnellsten!",
        { parse_mode: "Markdown", ...keyboard }
      );
    },
    requiresVerification: true,
    description: "Guthaben aufladen",
    category: "Premium"
  });

  // Payment History
  buttonRegistry.registerAction({
    actionId: "payment_history",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'payment_history', 'Zahlungshistorie');
      
      // Try to fetch real payment history
      let historyText = "📊 **Zahlungshistorie**\n\n";
      
      try {
        const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/user/${ctx.from?.id}/payments/history`);
        if (response.ok) {
          const data = await response.json();
          const payments = data.payments || [];
          
          if (payments.length === 0) {
            historyText += "📭 **Keine Zahlungen gefunden**\n\n";
            historyText += "Starte deine erste Zahlung in der WebApp!";
          } else {
            historyText += `📈 **${payments.length} Zahlungen gefunden:**\n\n`;
            
            payments.slice(0, 5).forEach((payment: any, index: number) => {
              const date = new Date(payment.date).toLocaleDateString('de-DE');
              const amount = payment.amount || 0;
              const method = payment.method || 'Unbekannt';
              const status = payment.status === 'completed' ? '✅' : '⏳';
              
              historyText += `${status} **${date}** - €${amount} (${method})\n`;
            });
            
            if (payments.length > 5) {
              historyText += `\n... und ${payments.length - 5} weitere`;
            }
          }
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        historyText += "🔌 **API nicht verfügbar**\n\n";
        historyText += "Bitte nutze die WebApp für detaillierte Historie.";
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Aktualisieren", "payment_history")],
        [Markup.button.callback("🔙 Zurück", "premium_payments")]
      ]);

      await ctx.editMessageText(historyText, { parse_mode: "Markdown", ...keyboard });
    },
    requiresVerification: true,
    description: "Zahlungshistorie anzeigen",
    category: "Premium"
  });

  // VIP Upgrade
  buttonRegistry.registerAction({
    actionId: "vip_upgrade",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'vip_upgrade', 'VIP Upgrade');
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("💎 Jetzt upgraden", "confirm_vip_upgrade")],
        [Markup.button.callback("❓ VIP-Vorteile", "vip_benefits")],
        [Markup.button.callback("🔙 Zurück", "premium_payments")]
      ]);

      await ctx.editMessageText(
        "💎 **VIP Upgrade**\n\n" +
        "🚀 **Aktueller Status:** Kunde\n" +
        "🎯 **Ziel:** VIP-Mitgliedschaft\n\n" +
        "**Erforderlich:**\n" +
        "• 12 Bestellungen ODER\n" +
        "• 20 erfolgreiche Einladungen\n\n" +
        "💎 **VIP-Vorteile:**\n" +
        "• Früher Zugang zu Drops\n" +
        "• Auf KO holen (Später bezahlen)\n" +
        "• Bot-Antworten mit /reply\n" +
        "• Prioritäts-Support\n" +
        "• Exklusive Features\n\n" +
        "🎯 **Dein Fortschritt:**\n" +
        "• Bestellungen: 0/12\n" +
        "• Einladungen: 0/20",
        { parse_mode: "Markdown", ...keyboard }
      );
    },
    requiresVerification: true,
    description: "VIP Upgrade anzeigen",
    category: "Premium"
  });

  // User Stats
  buttonRegistry.registerAction({
    actionId: "user_stats",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'user_stats', 'Deine Statistiken');
      
      // Try to fetch real user stats
      let statsText = "📊 **Deine Statistiken**\n\n";
      
      try {
        const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/user/${ctx.from?.id}/stats`);
        if (response.ok) {
          const data = await response.json();
          
          statsText += `🏆 **Rang:** ${data.rank || 'Neuling'}\n`;
          statsText += `📅 **Mitglied seit:** ${data.memberSince || 'Heute'}\n`;
          statsText += `🛍️ **Bestellungen:** ${data.orders || 0}\n`;
          statsText += `💰 **Ausgegeben:** €${data.spent || 0}\n`;
          statsText += `🎫 **Tickets:** ${data.tickets || 0}\n`;
          statsText += `👥 **Eingeladen:** ${data.invites || 0}\n\n`;
          
          if (data.nextRank) {
            statsText += `🎯 **Nächster Rang:** ${data.nextRank.name}\n`;
            statsText += `📈 **Fortschritt:** ${data.nextRank.progress}%\n\n`;
          }
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        statsText += `🏆 **Rang:** Neuling\n`;
        statsText += `📅 **Mitglied seit:** Heute\n`;
        statsText += `🛍️ **Bestellungen:** 0\n`;
        statsText += `💰 **Ausgegeben:** €0\n`;
        statsText += `🎫 **Tickets:** 0\n`;
        statsText += `👥 **Eingeladen:** 0\n\n`;
        statsText += `💡 **Tipp:** Nutze die WebApp für detaillierte Analytics!`;
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("📈 Detailliert", "detailed_stats")],
        [Markup.button.callback("👥 Affiliate", "affiliate_dashboard")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ]);

      await ctx.editMessageText(statsText, { parse_mode: "Markdown", ...keyboard });
    },
    requiresVerification: true,
    description: "Benutzer-Statistiken anzeigen",
    category: "Premium"
  });

  // Detailed Stats
  buttonRegistry.registerAction({
    actionId: "detailed_stats",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'detailed_stats', 'Detaillierte Statistiken');
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("📊 Wöchentlich", "stats_weekly")],
        [Markup.button.callback("📈 Monatlich", "stats_monthly")],
        [Markup.button.callback("📅 Gesamt", "stats_total")],
        [Markup.button.callback("🔙 Zurück", "user_stats")]
      ]);

      await ctx.editMessageText(
        "📈 **Detaillierte Statistiken**\n\n" +
        "📊 **Zeitraum wählen:**\n\n" +
        "📊 **Wöchentlich** - Letzte 7 Tage\n" +
        "📈 **Monatlich** - Letzter Monat\n" +
        "📅 **Gesamt** - Alle Zeit\n\n" +
        "💡 **Verfügbare Metriken:**\n" +
        "• Bestellungen & Umsatz\n" +
        "• Ticket-Aktivität\n" +
        "• Affiliate-Performance\n" +
        "• Rang-Fortschritt\n\n" +
        "🚀 **Wähle einen Zeitraum:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    },
    requiresVerification: true,
    description: "Detaillierte Statistiken anzeigen",
    category: "Premium"
  });

  // Affiliate Dashboard
  buttonRegistry.registerAction({
    actionId: "affiliate_dashboard",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'affiliate_dashboard', 'Affiliate Dashboard');
      
      // Try to fetch real affiliate data
      let affiliateText = "👥 **Affiliate Dashboard**\n\n";
      
      try {
        const apiUrl = process.env.BOT_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/user/${ctx.from?.id}/affiliate`);
        if (response.ok) {
          const data = await response.json();
          
          affiliateText += `🔗 **Aktive Links:** ${data.activeLinks || 0}\n`;
          affiliateText += `👥 **Eingeladene User:** ${data.invitedUsers || 0}\n`;
          affiliateText += `💰 **Verdient:** €${data.earned || 0}\n`;
          affiliateText += `📈 **Conversion:** ${data.conversionRate || 0}%\n\n`;
          
          if (data.recentActivity && data.recentActivity.length > 0) {
            affiliateText += `📊 **Letzte Aktivität:**\n`;
            data.recentActivity.slice(0, 3).forEach((activity: any) => {
              const date = new Date(activity.date).toLocaleDateString('de-DE');
              affiliateText += `• ${date}: ${activity.description}\n`;
            });
            affiliateText += `\n`;
          }
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        affiliateText += `🔗 **Aktive Links:** 0\n`;
        affiliateText += `👥 **Eingeladene User:** 0\n`;
        affiliateText += `💰 **Verdient:** €0\n`;
        affiliateText += `📈 **Conversion:** 0%\n\n`;
        affiliateText += `💡 **Starte dein Affiliate-Business:**`;
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("🔗 Meine Links", "my_links")],
        [Markup.button.callback("📊 Statistiken", "affiliate_stats")],
        [Markup.button.callback("💰 Auszahlungen", "payouts")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ]);

      await ctx.editMessageText(affiliateText, { parse_mode: "Markdown", ...keyboard });
    },
    requiresVerification: true,
    description: "Affiliate Dashboard anzeigen",
    category: "Affiliate"
  });

  // My Links
  buttonRegistry.registerAction({
    actionId: "my_links",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'my_links', 'Meine Links');
      
      const userId = ctx.from?.id;
      const baseUrl = process.env.BOT_WEB_URL || 'https://t.me/your_bot';
      const referralLink = `${baseUrl}?start=ref_${userId}`;
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.url("🔗 Link teilen", referralLink)],
        [Markup.button.callback("📱 QR-Code", "generate_qr")],
        [Markup.button.callback("📊 Link-Statistiken", "link_stats")],
        [Markup.button.callback("🔙 Zurück", "affiliate_dashboard")]
      ]);

      await ctx.editMessageText(
        "🔗 **Meine Referral-Links**\n\n" +
        `**Hauptlink:**\n\`${referralLink}\`\n\n` +
        "**QR-Code generieren:**\n" +
        "Für einfaches Teilen\n\n" +
        "**Link-Statistiken:**\n" +
        "Klicks, Conversions, etc.\n\n" +
        "💡 **Tipp:** Teile den Link in sozialen Medien!",
        { parse_mode: "Markdown", ...keyboard }
      );
    },
    requiresVerification: true,
    description: "Referral-Links anzeigen",
    category: "Affiliate"
  });

  // Affiliate Stats
  buttonRegistry.registerAction({
    actionId: "affiliate_stats",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'affiliate_stats', 'Affiliate Statistiken');
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("📊 Detailliert", "detailed_affiliate_stats")],
        [Markup.button.callback("📈 Performance", "affiliate_performance")],
        [Markup.button.callback("🔙 Zurück", "affiliate_dashboard")]
      ]);

      await ctx.editMessageText(
        "📊 **Affiliate Statistiken**\n\n" +
        "📈 **Performance-Metriken:**\n" +
        "• Klick-Rate\n" +
        "• Conversion-Rate\n" +
        "• Einnahmen pro Link\n" +
        "• Top-Performing Links\n\n" +
        "🎯 **Optimierung:**\n" +
        "• Beste Zeiten zum Teilen\n" +
        "• Effektivste Kanäle\n" +
        "• A/B Test Ergebnisse\n\n" +
        "🚀 **Wähle eine Kategorie:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    },
    requiresVerification: true,
    description: "Affiliate Statistiken anzeigen",
    category: "Affiliate"
  });

  // Payouts
  buttonRegistry.registerAction({
    actionId: "payouts",
    handler: async (ctx) => {
      navigationManager.pushScreen(ctx, 'payouts', 'Auszahlungen');
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("💰 Auszahlung beantragen", "request_payout")],
        [Markup.button.callback("📋 Historie", "payout_history")],
        [Markup.button.callback("⚙️ Einstellungen", "payout_settings")],
        [Markup.button.callback("🔙 Zurück", "affiliate_dashboard")]
      ]);

      await ctx.editMessageText(
        "💰 **Auszahlungen**\n\n" +
        "💳 **Verfügbares Guthaben:** €0.00\n" +
        "📊 **Mindestbetrag:** €10.00\n" +
        "⏰ **Auszahlungszeit:** 1-3 Werktage\n\n" +
        "**Verfügbare Methoden:**\n" +
        "• Bitcoin (Lightning)\n" +
        "• Banküberweisung\n" +
        "• PayPal\n\n" +
        "🚀 **Wähle eine Aktion:**",
        { parse_mode: "Markdown", ...keyboard }
      );
    },
    requiresVerification: true,
    description: "Auszahlungen verwalten",
    category: "Affiliate"
  });

  logger.info("Premium features registered successfully");
};
