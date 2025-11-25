import { Markup, Telegraf } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";
import { createInviteCode, deactivateInviteCode, getAllInviteCodes, getActiveInviteCodes, getInviteCodeStats } from "./inviteSystem";
import { getAllVerificationSessions, getPendingVerificationSessions, updateVerificationStatus } from "./verificationSystem";
import { registerPerformanceDashboard } from "./performanceDashboard";
// import { botApiClient } from "../clients/apiClient"; // Temporär deaktiviert

export const registerAdminDashboard = (bot: Telegraf<NebulaContext>) => {
  // Register performance dashboard
  registerPerformanceDashboard(bot);
  
  // Admin-Dashboard Hauptmenü
  bot.command("admin", async (ctx) => {
    const adminIds = ctx.config.adminIds || [];
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.reply("⛔️ **Admin-Zugriff verweigert**\n\nNur verifizierte Admins haben Zugriff auf dieses Panel.");
      return;
    }

    logger.info("Admin dashboard accessed", { userId: ctx.from?.id });

    const stats = getInviteCodeStats();
    const pendingVerifications = getPendingVerificationSessions().length;

    await ctx.reply(
      "⚙️ **Admin Dashboard**\n\n" +
      "📊 **Übersicht:**\n" +
      `• 🔑 Invite-Codes: ${stats.total} (${stats.active} aktiv)\n` +
      `• 🤳 Pending Verifizierungen: ${pendingVerifications}\n` +
      `• 📈 Nutzungsrate: ${stats.usageRate.toFixed(1)}%\n\n` +
      "🔧 **Verfügbare Aktionen:**",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔑 Invite-Codes", "admin_invite_codes")],
        [Markup.button.callback("🤳 Verifizierungs-Queue", "admin_verification_queue")],
        [Markup.button.callback("📊 Performance", "performance")],
        [Markup.button.callback("🚨 Alerts", "alerts")],
        [Markup.button.callback("📊 Statistiken", "admin_stats")],
        [Markup.button.callback("🔙 Zurück", "menu_back")]
      ])
    );
  });

  // Invite-Code Management
  bot.action("admin_invite_codes", async (ctx) => {
    await ctx.answerCbQuery("🔑 Invite-Codes...");
    
    const activeCodes = getActiveInviteCodes();
    const stats = getInviteCodeStats();

    await ctx.reply(
      "🔑 **Invite-Code Management**\n\n" +
      "📊 **Statistiken:**\n" +
      `• Gesamt: ${stats.total}\n` +
      `• Aktiv: ${stats.active}\n` +
      `• Verwendungen: ${stats.totalUses}/${stats.totalMaxUses}\n` +
      `• Nutzungsrate: ${stats.usageRate.toFixed(1)}%\n\n` +
      "🔧 **Aktionen:**",
      Markup.inlineKeyboard([
        [Markup.button.callback("🆕 Neuen Code erstellen", "admin_create_invite")],
        [Markup.button.callback("📋 Alle Codes anzeigen", "admin_list_invites")],
        [Markup.button.callback("🔙 Zurück", "admin")]
      ])
    );
  });

  // Neuen Invite-Code erstellen
  bot.action("admin_create_invite", async (ctx) => {
    await ctx.answerCbQuery("🆕 Neuen Code erstellen...");
    
    await ctx.reply(
      "🆕 **Invite-Code Generator**\n\n" +
      "📋 **Verfügbare Parameter:**\n" +
      "• Code (erforderlich)\n" +
      "• Max. Verwendungen (optional)\n" +
      "• Gültigkeitsdauer in Stunden (optional)\n\n" +
      "⚡ **Sofortige Aktivierung**\n" +
      "Codes werden sofort erstellt und sind verwendbar.\n\n" +
      "🔧 **Verwendung:**\n" +
      "`/createinvite [CODE] [VERWENDUNGEN] [STUNDEN]`",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔙 Zurück", "admin_invite_codes")]
      ])
    );
  });

  // Invite-Code erstellen Command
  bot.command("createinvite", async (ctx) => {
    const adminIds = ctx.config.adminIds || [];
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.reply("⛔️ Nur Admins können Invite-Codes erstellen.");
      return;
    }

    const args = ctx.message.text.split(" ").slice(1);
    const code = args[0];
    const maxUses = parseInt(args[1]) || 1;
    const expiresInHours = parseInt(args[2]);

    if (!code) {
      await ctx.reply(
        "⚠️ **Parameter fehlt**\n\n" +
        "📋 **Erforderlich:** Code-Name\n" +
        "🔧 **Syntax:** `/createinvite <code> [maxUses] [expiresInHours]`\n\n" +
        "💡 **Hinweis:** Code muss mindestens 6 Zeichen lang sein",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Zurück", "admin_invite_codes")]
        ])
      );
      return;
    }

    if (code.length < 6) {
      await ctx.reply(
        "📏 **Code zu kurz**\n\n" +
        "⚠️ **Minimum:** 6 Zeichen erforderlich\n" +
        `📊 **Aktuell:** ${code.length} Zeichen\n\n` +
        "💡 **Tipp:** Verwende einen längeren Code für bessere Sicherheit",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Zurück", "admin_invite_codes")]
        ])
      );
      return;
    }

    try {
      const inviteCode = createInviteCode(
        code,
        ctx.from.first_name || "Admin",
        maxUses,
        expiresInHours,
        `Erstellt von ${ctx.from.first_name}`
      );

      // API-Sync temporär deaktiviert - nutze nur lokale Speicherung
      // TODO: API-Sync wieder aktivieren wenn API-Server verfügbar
      
      logger.info("Invite code created by admin", { 
        code: inviteCode.code,
        admin: ctx.from.first_name,
        maxUses,
        expiresInHours,
        storage: "local-memory"
      });

      await ctx.reply(
        "🎉 **Code erfolgreich erstellt!**\n\n" +
        `🔑 **Code:** \`${inviteCode.code}\`\n` +
        `📊 **Verwendungen:** ${inviteCode.maxUses} verfügbar\n` +
        `⏰ **Gültigkeit:** ${inviteCode.expiresAt ? inviteCode.expiresAt.toLocaleString() : "Unbegrenzt"}\n` +
        `👤 **Erstellt von:** ${ctx.from.first_name}\n` +
        `📅 **Erstellt:** ${inviteCode.createdAt.toLocaleString()}\n\n` +
        "⚡ **Status:** Sofort aktiv und einsatzbereit!\n" +
        "🚀 **Bereit für Verwendung**",
        Markup.inlineKeyboard([
          [Markup.button.callback("📊 Code-Statistiken", "admin_invite_codes")],
          [Markup.button.callback("🔙 Admin-Menü", "admin_dashboard")]
        ])
      );
    } catch (error) {
      await ctx.reply(
        "⚠️ **Erstellungsfehler**\n\n" +
        "🔧 **Problem:** Code konnte nicht erstellt werden\n" +
        "📋 **Details:** " + String(error) + "\n\n" +
        "🔄 **Lösung:** Versuche es erneut oder kontaktiere den Support",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Zurück", "admin_invite_codes")]
        ])
      );
    }
  });

  // Alle Invite-Codes anzeigen
  bot.action("admin_list_invites", async (ctx) => {
    await ctx.answerCbQuery("📋 Alle Codes...");
    
    const allCodes = getAllInviteCodes();
    
    if (allCodes.length === 0) {
      await ctx.reply(
        "📋 **Keine Invite-Codes vorhanden**\n\n" +
        "Erstelle den ersten Code mit `/createinvite <code>`",
        Markup.inlineKeyboard([
          [Markup.button.callback("🆕 Neuen Code erstellen", "admin_create_invite")],
          [Markup.button.callback("🔙 Zurück", "admin_invite_codes")]
        ])
      );
      return;
    }

    const codesList = allCodes.slice(0, 10).map((code: any) => {
      const status = code.isActive ? "✅" : "❌";
      const expires = code.expiresAt ? ` (bis ${code.expiresAt.toLocaleDateString()})` : "";
      return `${status} **${code.code}** - ${code.usedCount}/${code.maxUses}${expires}`;
    }).join("\n");

    await ctx.reply(
      "📋 **Alle Invite-Codes**\n\n" +
      codesList +
      (allCodes.length > 10 ? `\n\n... und ${allCodes.length - 10} weitere` : ""),
      Markup.inlineKeyboard([
        [Markup.button.callback("🆕 Neuen Code erstellen", "admin_create_invite")],
        [Markup.button.callback("🔙 Zurück", "admin_invite_codes")]
      ])
    );
  });

  // Verifizierungs-Queue Management
  bot.action("admin_verification_queue", async (ctx) => {
    await ctx.answerCbQuery("🤳 Verifizierungs-Queue...");
    
    const pendingVerifications = getPendingVerificationSessions();
    const allVerifications = getAllVerificationSessions();

    await ctx.reply(
      "🤳 **Verifizierungs-Queue**\n\n" +
      "📊 **Aktuelle Queue:**\n" +
      `• ⏳ Pending: ${pendingVerifications.length}\n` +
      `• ✅ Genehmigt: ${allVerifications.filter((s: any) => s.status === "approved").length}\n` +
      `• ❌ Abgelehnt: ${allVerifications.filter((s: any) => s.status === "rejected").length}\n\n` +
      "🔄 **Aktionen:**",
      Markup.inlineKeyboard([
        [Markup.button.callback("⏳ Pending anzeigen", "admin_pending_verifications")],
        [Markup.button.callback("📋 Alle Verifizierungen", "admin_all_verifications")],
        [Markup.button.callback("🔙 Zurück", "admin")]
      ])
    );
  });

  // Pending Verifizierungen anzeigen
  bot.action("admin_pending_verifications", async (ctx) => {
    await ctx.answerCbQuery("⏳ Pending Verifizierungen...");
    
    const pendingVerifications = getPendingVerificationSessions();
    
    if (pendingVerifications.length === 0) {
      await ctx.reply(
        "⏳ **Keine pending Verifizierungen**\n\n" +
        "Alle Verifizierungen sind abgeschlossen.",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Zurück", "admin_verification_queue")]
        ])
      );
      return;
    }

    // Zeige die ersten 3 pending Verifizierungen mit Fotos
    const displayCount = Math.min(3, pendingVerifications.length);
    
    for (let i = 0; i < displayCount; i++) {
      const verification = pendingVerifications[i];
      const timeAgo = Math.floor((Date.now() - verification.createdAt.getTime()) / 60000);
      
      let message = `**${i + 1}. ${verification.handSignEmoji} ${verification.handSign}**\n\n`;
      message += `👤 **User:** ${verification.userId}\n`;
      message += `⏰ **Wartezeit:** ${timeAgo} Min\n`;
      message += `🆔 **Session:** ${verification.id}\n`;
      message += `🔄 **Handzeichen-Änderungen:** ${verification.handSignChanges}/${verification.maxHandSignChanges}\n`;
      message += `📋 **Anleitung:** ${verification.handSignInstructions}\n\n`;
      message += `🔍 **Anforderungen prüfen:**\n`;
      message += `• 👤 Gesicht sichtbar?\n`;
      message += `• 🤳 Handzeichen erkennbar?\n`;
      message += `• 📱 Gute Qualität?`;

      // Foto senden wenn verfügbar
      if (verification.photoUrl) {
        try {
          await ctx.telegram.sendPhoto(ctx.from?.id || 0, verification.photoUrl, {
            caption: message,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Sofort genehmigen", callback_data: `admin_approve_${verification.id}` },
                  { text: "❌ Sofort ablehnen", callback_data: `admin_reject_${verification.id}` }
                ],
                [
                  { text: "📋 Details anzeigen", callback_data: `admin_details_${verification.id}` },
                  { text: "🔄 Status prüfen", callback_data: `admin_status_${verification.id}` }
                ],
                [
                  { text: "📊 Admin Dashboard", callback_data: "admin" }
                ]
              ]
            }
          });
        } catch (error) {
          // Fallback: Text mit Foto-Link
          await ctx.reply(
            message + `\n\n📸 **Foto:** [Hier klicken](${verification.photoUrl})`,
            Markup.inlineKeyboard([
              [
                Markup.button.callback("✅ Sofort genehmigen", `admin_approve_${verification.id}`),
                Markup.button.callback("❌ Sofort ablehnen", `admin_reject_${verification.id}`)
              ],
              [
                Markup.button.callback("📋 Details anzeigen", `admin_details_${verification.id}`),
                Markup.button.callback("🔄 Status prüfen", `admin_status_${verification.id}`)
              ],
              [Markup.button.callback("📊 Admin Dashboard", "admin")]
            ])
          );
        }
      } else {
        await ctx.reply(
          message + `\n\n📸 **Foto:** Noch nicht gesendet`,
          Markup.inlineKeyboard([
            [
              Markup.button.callback("✅ Sofort genehmigen", `admin_approve_${verification.id}`),
              Markup.button.callback("❌ Sofort ablehnen", `admin_reject_${verification.id}`)
            ],
            [
              Markup.button.callback("📋 Details anzeigen", `admin_details_${verification.id}`),
              Markup.button.callback("🔄 Status prüfen", `admin_status_${verification.id}`)
            ],
            [Markup.button.callback("📊 Admin Dashboard", "admin")]
          ])
        );
      }
    }

    // Bulk-Aktionen
    if (pendingVerifications.length > 0) {
      await ctx.reply(
        `🔧 **Bulk-Aktionen für ${pendingVerifications.length} Verifizierungen:**`,
        Markup.inlineKeyboard([
          [Markup.button.callback("✅ Alle genehmigen", "admin_approve_all_verifications")],
          [Markup.button.callback("❌ Alle ablehnen", "admin_reject_all_verifications")],
          [Markup.button.callback("🔄 Aktualisieren", "admin_pending_verifications")],
          [Markup.button.callback("🔙 Zurück", "admin_verification_queue")]
        ])
      );
    }
  });

  // Alle Verifizierungen anzeigen
  bot.action("admin_all_verifications", async (ctx) => {
    await ctx.answerCbQuery("📋 Alle Verifizierungen...");
    
    const allVerifications = getAllVerificationSessions();
    
    if (allVerifications.length === 0) {
      await ctx.reply(
        "📋 **Keine Verifizierungen vorhanden**\n\n" +
        "Warte auf die ersten Verifizierungen von Usern.",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Zurück", "admin_verification_queue")]
        ])
      );
      return;
    }

    const approved = allVerifications.filter((v: any) => v.status === "approved").length;
    const rejected = allVerifications.filter((v: any) => v.status === "rejected").length;
    const pending = allVerifications.filter((v: any) => v.status === "pending_review").length;

    await ctx.reply(
      "📋 **Alle Verifizierungen**\n\n" +
      "📊 **Statistiken:**\n" +
      `• ✅ Genehmigt: ${approved}\n` +
      `• ❌ Abgelehnt: ${rejected}\n` +
      `• ⏳ Pending: ${pending}\n` +
      `• 📈 Gesamt: ${allVerifications.length}\n\n` +
      "🔧 **Aktionen:**",
      Markup.inlineKeyboard([
        [Markup.button.callback("⏳ Pending anzeigen", "admin_pending_verifications")],
        [Markup.button.callback("🔄 Aktualisieren", "admin_all_verifications")],
        [Markup.button.callback("🔙 Zurück", "admin_verification_queue")]
      ])
    );
  });

  // Alle Verifizierungen genehmigen
  bot.action("admin_approve_all_verifications", async (ctx) => {
    await ctx.answerCbQuery("✅ Alle genehmigen...");
    
    const pendingVerifications = getPendingVerificationSessions();
    
    if (pendingVerifications.length === 0) {
      await ctx.reply("✅ **Keine pending Verifizierungen zum Genehmigen.**");
      return;
    }

    let approvedCount = 0;
    for (const verification of pendingVerifications) {
      try {
        updateVerificationStatus(verification.id, "approved", "Bulk-Approval durch Admin");
        approvedCount++;
      } catch (error) {
        logger.error("Failed to approve verification", { sessionId: verification.id, error: String(error) });
      }
    }

    await ctx.reply(
      `✅ **${approvedCount} Verifizierungen genehmigt!**\n\n` +
      "Alle User wurden benachrichtigt und haben jetzt Zugang zur WebApp.",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Aktualisieren", "admin_pending_verifications")],
        [Markup.button.callback("🔙 Zurück", "admin_verification_queue")]
      ])
    );
  });

  // Alle Verifizierungen ablehnen
  bot.action("admin_reject_all_verifications", async (ctx) => {
    await ctx.answerCbQuery("❌ Alle ablehnen...");
    
    const pendingVerifications = getPendingVerificationSessions();
    
    if (pendingVerifications.length === 0) {
      await ctx.reply("❌ **Keine pending Verifizierungen zum Ablehnen.**");
      return;
    }

    let rejectedCount = 0;
    for (const verification of pendingVerifications) {
      try {
        updateVerificationStatus(verification.id, "rejected", "Bulk-Rejection durch Admin");
        rejectedCount++;
      } catch (error) {
        logger.error("Failed to reject verification", { sessionId: verification.id, error: String(error) });
      }
    }

    await ctx.reply(
      `❌ **${rejectedCount} Verifizierungen abgelehnt!**\n\n` +
      "Alle User wurden benachrichtigt und können einen neuen Versuch starten.",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Aktualisieren", "admin_pending_verifications")],
        [Markup.button.callback("🔙 Zurück", "admin_verification_queue")]
      ])
    );
  });

  // Details für einzelne Verifizierung
  bot.action(/^admin_details_(.+)$/, async (ctx) => {
    const sessionId = ctx.match[1];
    const adminIds = ctx.config.adminIds || [];
    
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.answerCbQuery("⛔️ Nur Admins können Details anzeigen.");
      return;
    }

    await ctx.answerCbQuery("📋 Details anzeigen...");
    
    try {
      const allVerifications = getAllVerificationSessions();
      const verification = allVerifications.find((v: any) => v.id === sessionId);
      
      if (!verification) {
        await ctx.reply("❌ Verifizierung nicht gefunden.");
        return;
      }

      const timeAgo = Math.floor((Date.now() - verification.createdAt.getTime()) / 60000);
      const expiresIn = Math.floor((verification.expiresAt.getTime() - Date.now()) / 60000);

      let message = `📋 **Verifizierungs-Details**\n\n`;
      message += `🆔 **Session:** ${verification.id}\n`;
      message += `👤 **User:** ${verification.userId}\n`;
      message += `🎯 **Handzeichen:** ${verification.handSignEmoji} ${verification.handSign}\n`;
      message += `📋 **Anleitung:** ${verification.handSignInstructions}\n`;
      message += `📊 **Status:** ${verification.status}\n`;
      message += `⏰ **Erstellt:** ${verification.createdAt.toLocaleString()}\n`;
      message += `⏳ **Läuft ab:** ${verification.expiresAt.toLocaleString()}\n`;
      message += `🕐 **Wartezeit:** ${timeAgo} Min\n`;
      message += `⏰ **Verbleibt:** ${expiresIn} Min\n`;
      message += `🔄 **Handzeichen-Änderungen:** ${verification.handSignChanges}/${verification.maxHandSignChanges}\n`;
      
      if (verification.photoUrl) {
        message += `📸 **Foto:** Verfügbar\n`;
      } else {
        message += `📸 **Foto:** Nicht gesendet\n`;
      }
      
      if (verification.adminNotes) {
        message += `📝 **Admin-Notizen:** ${verification.adminNotes}\n`;
      }

      // Foto senden wenn verfügbar
      if (verification.photoUrl) {
        try {
          await ctx.telegram.sendPhoto(ctx.from.id, verification.photoUrl, {
            caption: message,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Genehmigen", callback_data: `admin_approve_${verification.id}` },
                  { text: "❌ Ablehnen", callback_data: `admin_reject_${verification.id}` }
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
            message + `\n\n📸 **Foto:** [Hier klicken](${verification.photoUrl})`,
            Markup.inlineKeyboard([
              [
                Markup.button.callback("✅ Genehmigen", `admin_approve_${verification.id}`),
                Markup.button.callback("❌ Ablehnen", `admin_reject_${verification.id}`)
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
              Markup.button.callback("✅ Genehmigen", `admin_approve_${verification.id}`),
              Markup.button.callback("❌ Ablehnen", `admin_reject_${verification.id}`)
            ],
            [Markup.button.callback("🔙 Zurück", "admin_pending_verifications")]
          ])
        );
      }
      
    } catch (error) {
      await ctx.reply(`❌ **Fehler beim Laden der Details:** ${String(error)}`);
    }
  });

  // Statistiken
  bot.action("admin_stats", async (ctx) => {
    await ctx.answerCbQuery("📊 Statistiken...");
    
    const inviteStats = getInviteCodeStats();
    const allVerifications = getAllVerificationSessions();
    const pendingVerifications = getPendingVerificationSessions();

    const approved = allVerifications.filter((v: any) => v.status === "approved").length;
    const rejected = allVerifications.filter((v: any) => v.status === "rejected").length;
    const pending = pendingVerifications.length;
    
    // Einfache Statistiken
    const today = new Date();
    const todayVerifications = allVerifications.filter((v: any) => 
      v.createdAt.toDateString() === today.toDateString()
    ).length;

    await ctx.reply(
      "📊 **Admin Dashboard**\n\n" +
      "🔑 **Invite-Codes:**\n" +
      `• Gesamt: ${inviteStats.total}\n` +
      `• Aktiv: ${inviteStats.active}\n` +
      `• Verwendungen: ${inviteStats.totalUses}/${inviteStats.totalMaxUses}\n\n` +
      "🤳 **Verifizierungen:**\n" +
      `• ✅ Genehmigt: ${approved}\n` +
      `• ❌ Abgelehnt: ${rejected}\n` +
      `• ⏳ Pending: ${pending}\n` +
      `• 📈 Gesamt: ${allVerifications.length}\n\n` +
      "⏰ **Heute:** ${todayVerifications} Verifizierungen\n\n" +
      "📈 **Erfolgsrate:** " + (allVerifications.length > 0 ? `${((approved / allVerifications.length) * 100).toFixed(1)}%` : "0%"),
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Aktualisieren", "admin_stats")],
        [Markup.button.callback("🔙 Zurück", "admin")]
      ])
    );
  });
};