/**
 * File Upload Flow for Telegram Bot
 * 
 * Handles file uploads (photos, documents) for tickets
 */

import type { Telegraf } from "telegraf";
import type { NebulaContext } from "../types";
import { Markup } from "telegraf";
import { botApiClient } from "../clients/apiClient";
import { logger } from "../logger";

export const registerFileUpload = (bot: Telegraf<NebulaContext>) => {
  // Handle photo uploads
  bot.on('photo', async (ctx) => {
    if (!ctx.session.activeTicketId) {
      await ctx.reply(
        `📸 *Foto erhalten*\n\n` +
        `Um ein Foto zu einem Ticket hinzuzufügen, öffne zuerst ein Ticket und wähle "📎 Datei anhängen".`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const ticketId = ctx.session.activeTicketId;
    const userId = ctx.from.id.toString();
    const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Get largest photo

    try {
      // Get file info from Telegram
      const file = await ctx.telegram.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

      // Add message with attachment
      await botApiClient.addTicketMessage(ticketId, {
        from: 'user',
        user_id: userId,
        message: `📸 Foto angehängt`,
        attachments: [{
          type: 'photo',
          file_id: photo.file_id,
          file_url: fileUrl,
          file_size: photo.file_size,
          width: photo.width,
          height: photo.height
        }]
      });

      await ctx.reply(
        `✅ *Foto hinzugefügt!*\n\n` +
        `Das Foto wurde zum Ticket \`${ticketId}\` hinzugefügt.`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('[FileUpload] Error uploading photo', { error, ticketId });
      await ctx.reply(
        `❌ *Fehler beim Hochladen*\n\n` +
        `Das Foto konnte nicht hinzugefügt werden. Bitte versuche es erneut.`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // Handle document uploads
  bot.on('document', async (ctx) => {
    if (!ctx.session.activeTicketId) {
      await ctx.reply(
        `📎 *Dokument erhalten*\n\n` +
        `Um ein Dokument zu einem Ticket hinzuzufügen, öffne zuerst ein Ticket und wähle "📎 Datei anhängen".`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const ticketId = ctx.session.activeTicketId;
    const userId = ctx.from.id.toString();
    const document = ctx.message.document;

    // Check file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (document.file_size && document.file_size > maxSize) {
      await ctx.reply(
        `❌ *Datei zu groß*\n\n` +
        `Die Datei ist zu groß (max. 20MB). Bitte verwende eine kleinere Datei.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    try {
      // Get file info from Telegram
      const file = await ctx.telegram.getFile(document.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

      // Add message with attachment
      await botApiClient.addTicketMessage(ticketId, {
        from: 'user',
        user_id: userId,
        message: `📎 Datei angehängt: ${document.file_name || 'Unbenannt'}`,
        attachments: [{
          type: 'document',
          file_id: document.file_id,
          file_url: fileUrl,
          file_name: document.file_name,
          mime_type: document.mime_type,
          file_size: document.file_size
        }]
      });

      await ctx.reply(
        `✅ *Datei hinzugefügt!*\n\n` +
        `Die Datei wurde zum Ticket \`${ticketId}\` hinzugefügt.`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('[FileUpload] Error uploading document', { error, ticketId });
      await ctx.reply(
        `❌ *Fehler beim Hochladen*\n\n` +
        `Die Datei konnte nicht hinzugefügt werden. Bitte versuche es erneut.`,
        { parse_mode: 'Markdown' }
      );
    }
  });
};

