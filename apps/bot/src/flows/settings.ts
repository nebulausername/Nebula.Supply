import { Markup, Telegraf } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";
import { navigationManager } from "../utils/navigationManager";

export const registerSettings = (bot: Telegraf<NebulaContext>) => {
  
  bot.action("open_settings", async (ctx) => {
    await ctx.answerCbQuery("⚙️ Einstellungen...");
    navigationManager.pushScreen(ctx, 'settings_main', 'Einstellungen');
    
    const settings = ctx.session.notificationSettings || {
      dropAlerts: true,
      eventReminders: true,
      systemNotifications: true,
      vipNotifications: true,
      darkMode: false,
      language: 'de'
    };
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🔔 Benachrichtigungen", "notification_settings")],
      [Markup.button.callback("🌙 Dark Mode", "dark_mode")],
      [Markup.button.callback("🔒 Datenschutz", "privacy_settings")],
      [Markup.button.callback("🌍 Sprache", "language_settings")],
      [Markup.button.callback("👤 WebApp Profil", "settings_webapp_profile")],
      [Markup.button.callback("🔙 Zurück", "menu_back")]
    ]);
    
    const message = 
      "⚙️ **Einstellungen**\n\n" +
      "Verwalte deine Benachrichtigungen und Präferenzen.\n\n" +
      "**Verfügbare Optionen:**\n" +
      "• 🔔 Benachrichtigungen an/aus\n" +
      "• 🌙 Dark Mode Einstellungen\n" +
      "• 🔒 Datenschutz & Privatsphäre\n" +
      "• 🌍 Sprache wählen\n" +
      "• 👤 WebApp Profil verwalten\n\n" +
      "💡 **Tipp:** Einstellungen werden in der WebApp gespeichert!";
    
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

  // Notification Settings
  bot.action("notification_settings", async (ctx) => {
    await ctx.answerCbQuery("🔔 Benachrichtigungen...");
    navigationManager.pushScreen(ctx, 'notification_settings', 'Benachrichtigungen');
    
    const settings = ctx.session.notificationSettings || {
      dropAlerts: true,
      eventReminders: true,
      systemNotifications: true,
      vipNotifications: true
    };
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          `${settings.dropAlerts ? '✅' : '❌'} Drop-Benachrichtigungen`,
          'settings_toggle_drops'
        )
      ],
      [
        Markup.button.callback(
          `${settings.eventReminders ? '✅' : '❌'} Event-Erinnerungen`,
          'settings_toggle_events'
        )
      ],
      [
        Markup.button.callback(
          `${settings.systemNotifications ? '✅' : '❌'} System-Benachrichtigungen`,
          'settings_toggle_system'
        )
      ],
      [
        Markup.button.callback(
          `${settings.vipNotifications ? '✅' : '❌'} VIP-Benachrichtigungen`,
          'settings_toggle_vip'
        )
      ],
      [Markup.button.callback("🔙 Zurück", "open_settings")]
    ]);
    
    const message = 
      "🔔 **Benachrichtigungen**\n\n" +
      "Verwalte deine Benachrichtigungseinstellungen.\n\n" +
      "**Aktuelle Einstellungen:**\n" +
      `${settings.dropAlerts ? '✅' : '❌'} Drop-Benachrichtigungen\n` +
      `${settings.eventReminders ? '✅' : '❌'} Event-Erinnerungen\n` +
      `${settings.systemNotifications ? '✅' : '❌'} System-Benachrichtigungen\n` +
      `${settings.vipNotifications ? '✅' : '❌'} VIP-Benachrichtigungen\n\n` +
      "💡 Klicke auf eine Option zum Umschalten.";
    
    await ctx.editMessageText(message, { parse_mode: "Markdown", ...keyboard });
  });

  // Dark Mode Settings
  bot.action("dark_mode", async (ctx) => {
    await ctx.answerCbQuery("🌙 Dark Mode...");
    navigationManager.pushScreen(ctx, 'dark_mode', 'Dark Mode');
    
    const settings = ctx.session.notificationSettings || {};
    const darkMode = settings.darkMode || false;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🌙 Dark Mode aktivieren", "settings_toggle_dark")],
      [Markup.button.callback("☀️ Light Mode aktivieren", "settings_toggle_light")],
      [Markup.button.callback("🔄 System folgen", "settings_toggle_auto")],
      [Markup.button.callback("🔙 Zurück", "open_settings")]
    ]);
    
    const message = 
      "🌙 **Dark Mode Einstellungen**\n\n" +
      `**Aktueller Modus:** ${darkMode ? '🌙 Dark' : '☀️ Light'}\n\n` +
      "**Verfügbare Optionen:**\n" +
      "• 🌙 Dark Mode - Immer dunkel\n" +
      "• ☀️ Light Mode - Immer hell\n" +
      "• 🔄 System folgen - Automatisch\n\n" +
      "💡 **Hinweis:** Diese Einstellung betrifft die WebApp.";
    
    await ctx.editMessageText(message, { parse_mode: "Markdown", ...keyboard });
  });

  // Privacy Settings
  bot.action("privacy_settings", async (ctx) => {
    await ctx.answerCbQuery("🔒 Datenschutz...");
    navigationManager.pushScreen(ctx, 'privacy_settings', 'Datenschutz');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("📊 Daten exportieren", "export_data")],
      [Markup.button.callback("🗑️ Daten löschen", "delete_data")],
      [Markup.button.callback("📋 Datenschutzerklärung", "privacy_policy")],
      [Markup.button.callback("🔙 Zurück", "open_settings")]
    ]);
    
    const message = 
      "🔒 **Datenschutz & Privatsphäre**\n\n" +
      "Verwalte deine persönlichen Daten.\n\n" +
      "**Verfügbare Optionen:**\n" +
      "• 📊 Daten exportieren - Alle deine Daten herunterladen\n" +
      "• 🗑️ Daten löschen - Account und Daten unwiderruflich löschen\n" +
      "• 📋 Datenschutzerklärung - Unsere Datenschutzrichtlinien\n\n" +
      "💡 **Wichtig:** Daten werden sicher und verschlüsselt gespeichert.";
    
    await ctx.editMessageText(message, { parse_mode: "Markdown", ...keyboard });
  });

  // Language Settings
  bot.action("language_settings", async (ctx) => {
    await ctx.answerCbQuery("🌍 Sprache...");
    navigationManager.pushScreen(ctx, 'language_settings', 'Sprache');
    
    const settings = ctx.session.notificationSettings || {};
    const language = settings.language || 'de';
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🇩🇪 Deutsch", "settings_lang_de")],
      [Markup.button.callback("🇺🇸 English", "settings_lang_en")],
      [Markup.button.callback("🔙 Zurück", "open_settings")]
    ]);
    
    const message = 
      "🌍 **Sprache wählen**\n\n" +
      `**Aktuelle Sprache:** ${language === 'de' ? '🇩🇪 Deutsch' : '🇺🇸 English'}\n\n` +
      "**Verfügbare Sprachen:**\n" +
      "• 🇩🇪 Deutsch - Vollständig verfügbar\n" +
      "• 🇺🇸 English - Teilweise verfügbar\n\n" +
      "💡 **Hinweis:** Sprache wird für Bot und WebApp angewendet.";
    
    await ctx.editMessageText(message, { parse_mode: "Markdown", ...keyboard });
  });

  // Toggle handlers
  bot.action("settings_toggle_drops", async (ctx) => {
    const settings = ctx.session.notificationSettings || {};
    settings.dropAlerts = !settings.dropAlerts;
    ctx.session.notificationSettings = settings;
    await ctx.answerCbQuery(`Drop-Benachrichtigungen ${settings.dropAlerts ? 'aktiviert' : 'deaktiviert'}`);
    // Refresh
    const fakeUpdate = { ...ctx.update, callback_query: { ...ctx.callbackQuery, data: 'open_settings' } } as any;
    return bot.handleUpdate(fakeUpdate);
  });

  bot.action("settings_toggle_events", async (ctx) => {
    const settings = ctx.session.notificationSettings || {};
    settings.eventReminders = !settings.eventReminders;
    ctx.session.notificationSettings = settings;
    await ctx.answerCbQuery(`Event-Erinnerungen ${settings.eventReminders ? 'aktiviert' : 'deaktiviert'}`);
    const fakeUpdate = { ...ctx.update, callback_query: { ...ctx.callbackQuery, data: 'open_settings' } } as any;
    return bot.handleUpdate(fakeUpdate);
  });

  bot.action("settings_toggle_system", async (ctx) => {
    const settings = ctx.session.notificationSettings || {};
    settings.systemNotifications = !settings.systemNotifications;
    ctx.session.notificationSettings = settings;
    await ctx.answerCbQuery(`System-Benachrichtigungen ${settings.systemNotifications ? 'aktiviert' : 'deaktiviert'}`);
    const fakeUpdate = { ...ctx.update, callback_query: { ...ctx.callbackQuery, data: 'open_settings' } } as any;
    return bot.handleUpdate(fakeUpdate);
  });

  bot.action("settings_toggle_vip", async (ctx) => {
    const settings = ctx.session.notificationSettings || {};
    settings.vipNotifications = !settings.vipNotifications;
    ctx.session.notificationSettings = settings;
    await ctx.answerCbQuery(`VIP-Benachrichtigungen ${settings.vipNotifications ? 'aktiviert' : 'deaktiviert'}`);
    const fakeUpdate = { ...ctx.update, callback_query: { ...ctx.callbackQuery, data: 'open_settings' } } as any;
    return bot.handleUpdate(fakeUpdate);
  });

  bot.action("settings_webapp_profile", async (ctx) => {
    await ctx.answerCbQuery("👤 Profil öffnen...");
    const url = ctx.config.webAppUrl || "http://localhost:5173";
    const isHttps = /^https:\/\//.test(url) && !/localhost/i.test(url);
    
    if (isHttps) {
      await ctx.reply("👤 **Profil in WebApp öffnen**", Markup.inlineKeyboard([
        [Markup.button.webApp("👤 Profil öffnen", `${url}/profile`)],
        [Markup.button.callback("🔙 Zurück", "open_settings")]
      ]));
    } else {
      await ctx.reply(
        `👤 **Profil-Link:**\n${url}/profile\n\nÖffne den Link in deinem Browser.`,
        Markup.inlineKeyboard([[Markup.button.callback("🔙 Zurück", "open_settings")]])
      );
    }
  });
};





