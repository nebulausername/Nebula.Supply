import { Markup, Telegraf } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";

// Invite-Code Management
interface InviteCode {
  code: string;
  createdBy: string; // Admin ID
  createdAt: Date;
  expiresAt?: Date;
  maxUses: number;
  usedCount: number;
  usedBy: number[]; // User IDs
  isActive: boolean;
  description?: string;
}

// In-Memory Storage für Invite-Codes (in Production: Database)
const inviteCodes = new Map<string, InviteCode>();

// Rate Limiting für Code-Validierung
const codeValidationAttempts = new Map<number, { count: number; lastAttempt: Date }>();
const MAX_ATTEMPTS_PER_MINUTE = 5;

// Sofort verfügbare Test-Codes
const initializeTestCodes = () => {
  // VIP Test Code - 5 Verwendungen
  inviteCodes.set("VIP123", {
    code: "VIP123",
    createdBy: "system",
    createdAt: new Date(),
    expiresAt: undefined,
    maxUses: 5,
    usedCount: 0,
    usedBy: [],
    isActive: true,
    description: "VIP Test Code - 5 Verwendungen"
  });

  // NEB Test Code - 3 Verwendungen, 24h gültig
  inviteCodes.set("NEB456", {
    code: "NEB456", 
    createdBy: "system",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    maxUses: 3,
    usedCount: 0,
    usedBy: [],
    isActive: true,
    description: "NEB Test Code - 3 Verwendungen, 24h gültig"
  });

  // INV Test Code - 1 Verwendung
  inviteCodes.set("INV789", {
    code: "INV789",
    createdBy: "system", 
    createdAt: new Date(),
    expiresAt: undefined,
    maxUses: 1,
    usedCount: 0,
    usedBy: [],
    isActive: true,
    description: "INV Test Code - 1 Verwendung"
  });

  logger.info("Test invite codes initialized", { 
    codes: Array.from(inviteCodes.keys()),
    total: inviteCodes.size 
  });
};

// Test-Codes beim Start initialisieren
initializeTestCodes();

// System-Health Check
export function getSystemHealth() {
  const stats = getInviteCodeStats();
  const now = new Date();
  
  return {
    status: 'healthy',
    timestamp: now.toISOString(),
    inviteCodes: {
      total: stats.total,
      active: stats.active,
      usageRate: Math.round(stats.usageRate * 100) / 100
    },
    memory: {
      codesInMemory: inviteCodes.size,
      validationAttempts: codeValidationAttempts.size
    },
    uptime: process.uptime(),
    version: '2.0.0'
  };
}

// Cleanup-System für abgelaufene Codes
const cleanupExpiredCodes = () => {
  const now = new Date();
  let cleanedCount = 0;
  
  for (const [code, inviteCode] of inviteCodes.entries()) {
    if (inviteCode.expiresAt && inviteCode.expiresAt < now) {
      inviteCodes.delete(code);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.info("Cleaned up expired invite codes", { cleanedCount });
  }
};

// Cleanup alle 5 Minuten
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

export const registerInviteSystem = (bot: Telegraf<NebulaContext>) => {
  
  // Invite-Code verwenden
  bot.action("use_invite", async (ctx) => {
    await ctx.answerCbQuery("🔑 Invite-Code...");
    ctx.session.awaitingInvite = true;
    
    await ctx.reply(
      "🔑 **Invite-Code eingeben**\n\n" +
      "**Was ist ein Invite-Code?**\n" +
      "Ein Invite-Code gibt dir sofortigen Zugang zu Nebula ohne Verifizierungsfoto.\n\n" +
      "**So funktioniert's:**\n" +
      "1. Gib deinen Code ein (Groß- oder Kleinschreibung egal)\n" +
      "2. Der Code wird sofort geprüft\n" +
      "3. Du erhältst sofortigen Zugang\n\n" +
      "**Code-Format:**\n" +
      "• Mindestens 6 Zeichen\n" +
      "• Groß- und Kleinbuchstaben\n" +
      "• Zahlen und Buchstaben\n" +
      "• Beispiel: `VIP123` oder `NEB456`\n\n" +
      "⚡ **Sofortige Verarbeitung** – dein Code wird sofort validiert!\n\n" +
      "❓ **Frage:** Wie bekomme ich einen Invite-Code?\n" +
      "Schreib einfach diese Frage und du bekommst eine Antwort!",
      Markup.inlineKeyboard((() => {
        const rows: any[] = [];
        rows.push([Markup.button.callback("❓ Hilfe & FAQ", "help_faq")]);
        rows.push([Markup.button.callback("🔙 Zurück", "menu_back")]);
        return rows;
      })())
    );
  });

  // Invite-Code Text Handler
  bot.on("text", async (ctx, next) => {
    if (!ctx.session.awaitingInvite) {
      return next();
    }
    
    const code = ctx.message.text.trim().toUpperCase();
    const userId = ctx.from?.id;
    
    if (!userId) {
      await ctx.reply(
        "⚠️ **Systemfehler erkannt**\n\n" +
        "**Was ist passiert?**\n" +
        "Deine Benutzer-ID konnte nicht ermittelt werden.\n\n" +
        "**Lösung Schritt für Schritt:**\n" +
        "1. Starte den Bot neu mit /start\n" +
        "2. Versuche es erneut\n" +
        "3. Falls das Problem weiterhin besteht, kontaktiere den Support\n\n" +
        "💡 **Tipp:** Meist hilft ein Neustart!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Bot neu starten", "menu_back")],
          [Markup.button.callback("🎫 Support kontaktieren", "support_new")]
        ])
      );
      return;
    }

    // Rate Limiting prüfen
    const now = new Date();
    const userAttempts = codeValidationAttempts.get(userId);
    
    if (userAttempts) {
      const timeDiff = now.getTime() - userAttempts.lastAttempt.getTime();
      if (timeDiff < 60000) { // 1 Minute
        if (userAttempts.count >= MAX_ATTEMPTS_PER_MINUTE) {
          await ctx.reply(
            "⏰ **Rate Limit erreicht**\n\n" +
            "**Was ist passiert?**\n" +
            "Du hast zu viele Code-Versuche in kurzer Zeit gemacht.\n\n" +
            "**Lösung:**\n" +
            "1. Warte 1 Minute\n" +
            "2. Versuche es dann erneut\n" +
            "3. Prüfe den Code auf Tippfehler\n\n" +
            "💡 **Tipp:** Kopiere den Code direkt, um Tippfehler zu vermeiden!",
            Markup.inlineKeyboard([
              [Markup.button.callback("🔙 Zurück", "menu_back")],
              [Markup.button.callback("❓ Hilfe & FAQ", "help_faq")]
            ])
          );
          return;
        }
        userAttempts.count++;
      } else {
        // Reset nach 1 Minute
        userAttempts.count = 1;
        userAttempts.lastAttempt = now;
      }
    } else {
      codeValidationAttempts.set(userId, { count: 1, lastAttempt: now });
    }

    // Code validieren - erst in-memory, dann API-Server
    let inviteCode = inviteCodes.get(code);
    let codeFromAPI = false;
    
    // API-Integration: Prüfe Code über API-Server
    if (!inviteCode) {
      try {
        const apiUrl = process.env.BOT_API_URL || process.env.API_URL || 'http://localhost:3001';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        try {
          const response = await fetch(`${apiUrl}/api/bot/invite-codes/code/${encodeURIComponent(code)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const apiCode = data.data;
              // Konvertiere API-Format zu Bot-Format
              inviteCode = {
                code: apiCode.code,
                createdBy: apiCode.created_by || 'system',
                createdAt: new Date(apiCode.created_at),
                expiresAt: apiCode.expires_at ? new Date(apiCode.expires_at) : undefined,
                maxUses: apiCode.max_uses || 1,
                usedCount: apiCode.used_count || 0,
                usedBy: Array.isArray(apiCode.used_by) ? apiCode.used_by.map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id) : [],
                isActive: apiCode.is_active !== false,
                description: apiCode.metadata?.description
              };
              codeFromAPI = true;
              // Cache in-memory für schnelleren Zugriff
              inviteCodes.set(code, inviteCode);
              logger.info("Invite code loaded from API", { code, userId });
            }
          } else if (response.status === 404) {
            // Code nicht gefunden - das ist OK, weiter mit normaler Fehlermeldung
            logger.debug("Invite code not found in API", { code, userId });
          } else {
            logger.warn("API error when checking invite code", { 
              code, 
              userId, 
              status: response.status 
            });
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            logger.warn("API request timeout when checking invite code", { code, userId });
          } else {
            throw fetchError;
          }
        }
      } catch (error: any) {
        // API-Fehler - nicht kritisch, nutze in-memory System als Fallback
        logger.warn("Failed to check invite code via API, using in-memory fallback", { 
          code, 
          userId, 
          error: error.message || String(error) 
        });
      }
    }
    
    if (!inviteCode) {
      await ctx.reply(
        "🔍 **Code nicht gefunden**\n\n" +
        "**Was ist passiert?**\n" +
        "Der eingegebene Code existiert nicht in unserem System.\n\n" +
        "**Mögliche Ursachen:**\n" +
        "• Tippfehler im Code (Groß-/Kleinschreibung prüfen)\n" +
        "• Code wurde bereits gelöscht oder deaktiviert\n" +
        "• Code ist noch nicht aktiviert\n" +
        "• Code wurde falsch kopiert\n\n" +
        "**Lösung Schritt für Schritt:**\n" +
        "1. Prüfe den Code auf Tippfehler\n" +
        "2. Kopiere den Code direkt (nicht abtippen)\n" +
        "3. Versuche es erneut\n" +
        "4. Oder nutze die Foto-Verifizierung\n\n" +
        "💡 **Tipp:** Groß- und Kleinschreibung wird ignoriert!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔑 Code erneut eingeben", "use_invite")],
          [Markup.button.callback("🤳 Foto-Verifizierung", "start_verification")],
          [Markup.button.callback("❓ Hilfe & FAQ", "help_faq")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
      return;
    }

    // Code-Status prüfen
    if (!inviteCode.isActive) {
      await ctx.reply(
        "🚫 **Code deaktiviert**\n\n" +
        "**Was ist passiert?**\n" +
        "Dieser Code wurde von einem Administrator deaktiviert.\n\n" +
        "**Status:** Inaktiv\n" +
        "**Grund:** Administrativer Eingriff\n\n" +
        "**Lösung:**\n" +
        "1. Nutze einen anderen Invite-Code\n" +
        "2. Oder starte die Foto-Verifizierung\n\n" +
        "💡 **Tipp:** Foto-Verifizierung ist immer verfügbar!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔑 Neuen Code eingeben", "use_invite")],
          [Markup.button.callback("🤳 Foto-Verifizierung", "start_verification")],
          [Markup.button.callback("❓ Hilfe & FAQ", "help_faq")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
      return;
    }

    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      await ctx.reply(
        "⏰ **Code abgelaufen**\n\n" +
        "**Was ist passiert?**\n" +
        "Dieser Code ist zeitlich begrenzt und bereits abgelaufen.\n\n" +
        `📅 **Ablaufdatum:** ${inviteCode.expiresAt.toLocaleDateString('de-DE')}\n` +
        `🕐 **Ablaufzeit:** ${inviteCode.expiresAt.toLocaleTimeString('de-DE')}\n\n` +
        "**Lösung:**\n" +
        "1. Nutze einen anderen Invite-Code\n" +
        "2. Oder starte die Foto-Verifizierung\n\n" +
        "💡 **Tipp:** Foto-Verifizierung hat keine Ablaufzeit!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔑 Neuen Code eingeben", "use_invite")],
          [Markup.button.callback("🤳 Foto-Verifizierung", "start_verification")],
          [Markup.button.callback("❓ Hilfe & FAQ", "help_faq")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
      return;
    }

    if (inviteCode.usedCount >= inviteCode.maxUses) {
      await ctx.reply(
        "📊 **Code ausgeschöpft**\n\n" +
        "**Was ist passiert?**\n" +
        "Dieser Code hat bereits die maximale Anzahl an Verwendungen erreicht.\n\n" +
        `🔢 **Verwendungen:** ${inviteCode.usedCount}/${inviteCode.maxUses}\n` +
        `📋 **Status:** Maximale Nutzung erreicht\n\n` +
        "**Lösung:**\n" +
        "1. Nutze einen anderen Invite-Code\n" +
        "2. Oder starte die Foto-Verifizierung\n\n" +
        "💡 **Tipp:** Foto-Verifizierung ist immer verfügbar!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔑 Neuen Code eingeben", "use_invite")],
          [Markup.button.callback("🤳 Foto-Verifizierung", "start_verification")],
          [Markup.button.callback("❓ Hilfe & FAQ", "help_faq")],
          [Markup.button.callback("🔙 Zurück", "menu_back")]
        ])
      );
      return;
    }

    if (inviteCode.usedBy.includes(userId)) {
    await ctx.reply(
        "✅ **Code bereits verwendet**\n\n" +
        "**Was ist passiert?**\n" +
        "Du hast diesen Code bereits erfolgreich verwendet.\n\n" +
        "📋 **Status:** Du bist bereits verifiziert!\n" +
        "👤 **Deine Verwendung:** Registriert\n\n" +
        "**Keine erneute Verwendung nötig** – du hast bereits vollen Zugang!\n\n" +
        "🚀 **Nächste Schritte:**",
          (() => {
            const url = ctx.config.webAppUrl || "http://localhost:5173";
            const rows: any[] = [];
            if (/^https:\/\//.test(url) && !/localhost/i.test(url)) {
              rows.push([Markup.button.webApp("🚀 WebView öffnen", url)]);
            }
            rows.push([Markup.button.callback("🎯 Hauptmenü", "menu_back")]);
            return { reply_markup: { inline_keyboard: rows } } as any;
          })()
      );
      return;
    }

    // Code erfolgreich verwenden
    try {
      // API-Sync: Code-Verwendung an API melden
      if (codeFromAPI) {
        try {
          const apiUrl = process.env.BOT_API_URL || process.env.API_URL || 'http://localhost:3001';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const response = await fetch(`${apiUrl}/api/bot/invite-codes/${encodeURIComponent(code)}/use`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                user_id: userId.toString(),
                used_by: userId.toString()
              }),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                // Update von API-Daten
                const updatedCode = data.data;
                inviteCode.usedCount = updatedCode.used_count || inviteCode.usedCount + 1;
                inviteCode.usedBy = Array.isArray(updatedCode.used_by) 
                  ? updatedCode.used_by.map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id)
                  : [...inviteCode.usedBy, userId];
                inviteCodes.set(code, inviteCode);
                logger.info("Invite code used via API", { 
                  code, 
                  userId, 
                  usedCount: inviteCode.usedCount,
                  maxUses: inviteCode.maxUses
                });
              }
            } else {
              // API-Fehler, aber Code trotzdem lokal verwenden
              logger.warn("API sync failed, using local storage", { 
                code, 
                userId, 
                status: response.status 
              });
              inviteCode.usedCount++;
              inviteCode.usedBy.push(userId);
              inviteCodes.set(code, inviteCode);
            }
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
              logger.warn("API request timeout when using invite code", { code, userId });
            } else {
              throw fetchError;
            }
            // Timeout - nutze lokale Speicherung
            inviteCode.usedCount++;
            inviteCode.usedBy.push(userId);
            inviteCodes.set(code, inviteCode);
          }
        } catch (apiError: any) {
          // API-Fehler nicht kritisch - nutze lokale Speicherung
          logger.warn("API sync error, using local storage", { 
            code, 
            userId, 
            error: apiError.message || String(apiError) 
          });
          inviteCode.usedCount++;
          inviteCode.usedBy.push(userId);
          inviteCodes.set(code, inviteCode);
        }
      } else {
        // Nur in-memory Code
        inviteCode.usedCount++;
        inviteCode.usedBy.push(userId);
        inviteCodes.set(code, inviteCode);
      }
      
      logger.info("Invite code used successfully", { 
        code, 
        userId, 
        usedCount: inviteCode.usedCount,
        maxUses: inviteCode.maxUses,
        storage: codeFromAPI ? "api-synced" : "local-memory"
      });
    } catch (error: any) {
      logger.error("Failed to use invite code", { 
        code, 
        userId, 
        error: error.message || String(error) 
      });
      
      await ctx.reply(
        "⚠️ **Systemfehler erkannt**\n\n" +
        "**Was ist passiert?**\n" +
        "Beim Verarbeiten deines Codes ist ein Fehler aufgetreten.\n\n" +
        "**Lösung Schritt für Schritt:**\n" +
        "1. Warte 30 Sekunden\n" +
        "2. Versuche es erneut\n" +
        "3. Prüfe den Code auf Tippfehler\n" +
        "4. Falls das Problem weiterhin besteht, nutze die Foto-Verifizierung\n\n" +
        "💡 **Tipp:** Foto-Verifizierung ist eine zuverlässige Alternative!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Erneut versuchen", "use_invite")],
          [Markup.button.callback("🤳 Foto-Verifizierung", "start_verification")],
          [Markup.button.callback("❓ Hilfe & FAQ", "help_faq")],
          [Markup.button.callback("🏠 Hauptmenü", "menu_back")]
        ])
      );
      return;
    }

    // User verifizieren
    ctx.session.inviteCode = code;
    ctx.session.onboardingStatus = "verified";
    ctx.session.awaitingInvite = false;

    // Admin-Benachrichtigung
    await notifyAdmins(ctx, `🎉 **Neue Verifizierung!**\n\n👤 **User:** ${ctx.from?.first_name} (${userId})\n🔑 **Code:** ${code}\n⏰ **Zeit:** ${new Date().toLocaleString()}\n\n📊 **Code-Statistik:**\n• Verwendungen: ${inviteCode.usedCount}/${inviteCode.maxUses}\n• Erstellt: ${inviteCode.createdAt.toLocaleDateString()}\n• Status: ${inviteCode.isActive ? 'Aktiv' : 'Inaktiv'}`);

    await ctx.reply(
      "🎉 **Verifizierung erfolgreich!**\n\n" +
      "✅ **Status:** Vollständig verifiziert\n" +
      "🔑 **Code:** " + code + "\n" +
      "⏰ **Zeit:** " + new Date().toLocaleString('de-DE') + "\n\n" +
      "🚀 **Willkommen im Nebula Club!**\n\n" +
      "**Deine Vorteile:**\n" +
      "• 🛍️ Vollzugang zur WebApp\n" +
      "• 🎫 Premium Ticket-System\n" +
      "• 💳 Alle Zahlungsoptionen\n" +
      "• 🎯 Exklusive Limited Edition Drops\n" +
      "• 💎 Erweiterte Features\n\n" +
      "⚡ **Sofort einsatzbereit!**",
      (() => {
        const rows: any[] = [];
        const url = ctx.config.webAppUrl || "http://localhost:5173";
        if (/^https:\/\//.test(url) && !/localhost/i.test(url)) {
          rows.push([Markup.button.webApp("🚀 WebView öffnen", url)]);
        }
        rows.push([Markup.button.callback("🎯 Hauptmenü", "menu_back")]);
        return { reply_markup: { inline_keyboard: rows } } as any;
      })()
    );
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

};

// Invite-Code erstellen (für Admin)
export function createInviteCode(
  code: string,
  createdBy: string,
  maxUses: number = 1,
  expiresInHours?: number,
  description?: string
): InviteCode {
  const inviteCode: InviteCode = {
    code: code.toUpperCase(),
    createdBy,
    createdAt: new Date(),
    expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : undefined,
    maxUses,
    usedCount: 0,
    usedBy: [],
    isActive: true,
    description
  };

  inviteCodes.set(code.toUpperCase(), inviteCode);

  // API-Sync temporär deaktiviert - nutze nur lokale Speicherung
  // TODO: API-Sync wieder aktivieren wenn API-Server verfügbar
  
  logger.info("Invite code created successfully", { 
    code: inviteCode.code,
    createdBy,
    maxUses,
    expiresAt: inviteCode.expiresAt?.toISOString(),
    storage: "local-memory"
  });

  return inviteCode;
}

// Invite-Code deaktivieren (für Admin)
export function deactivateInviteCode(code: string): boolean {
  const inviteCode = inviteCodes.get(code.toUpperCase());
  if (inviteCode) {
    inviteCode.isActive = false;
    inviteCodes.set(code.toUpperCase(), inviteCode);
    return true;
  }
  return false;
}

// Alle Invite-Codes abrufen (für Admin)
export function getAllInviteCodes(): InviteCode[] {
  return Array.from(inviteCodes.values());
}

// Aktive Invite-Codes abrufen (für Admin)
export function getActiveInviteCodes(): InviteCode[] {
  return Array.from(inviteCodes.values()).filter(code => code.isActive);
}

// Invite-Code Statistiken (für Admin)
export function getInviteCodeStats() {
  const allCodes = getAllInviteCodes();
  const activeCodes = getActiveInviteCodes();
  const expiredCodes = allCodes.filter(code => code.expiresAt && code.expiresAt < new Date());
  
  const totalUses = allCodes.reduce((sum, code) => sum + code.usedCount, 0);
  const totalMaxUses = allCodes.reduce((sum, code) => sum + code.maxUses, 0);
  
  return {
    total: allCodes.length,
    active: activeCodes.length,
    expired: expiredCodes.length,
    totalUses,
    totalMaxUses,
    usageRate: totalMaxUses > 0 ? (totalUses / totalMaxUses) * 100 : 0,
    averageUsesPerCode: allCodes.length > 0 ? totalUses / allCodes.length : 0,
    mostUsedCode: allCodes.reduce((max, code) => code.usedCount > max.usedCount ? code : max, allCodes[0] || null)
  };
}

// Erweiterte Admin-Statistiken
export function getDetailedInviteStats() {
  const stats = getInviteCodeStats();
  const allCodes = getAllInviteCodes();
  
  return {
    ...stats,
    codesByStatus: {
      active: allCodes.filter(c => c.isActive && (!c.expiresAt || c.expiresAt > new Date())).length,
      inactive: allCodes.filter(c => !c.isActive).length,
      expired: allCodes.filter(c => c.expiresAt && c.expiresAt < new Date()).length,
      fullyUsed: allCodes.filter(c => c.usedCount >= c.maxUses).length
    },
    recentActivity: allCodes
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(code => ({
        code: code.code,
        created: code.createdAt,
        uses: code.usedCount,
        maxUses: code.maxUses
      }))
  };
}
