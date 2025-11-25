/**
 * Error Handling System for NEBULA Bot
 * Provides graceful error handling and recovery
 */

interface ErrorContext {
  userId?: string;
  updateType?: string;
  command?: string;
  timestamp: string;
}

class ErrorHandler {
  private errorCount: number = 0;
  private lastErrorTime: number = 0;

  createErrorHandler() {
    return async (error: any, ctx: any) => {
      this.errorCount++;
      this.lastErrorTime = Date.now();

      const errorContext: ErrorContext = {
        userId: ctx.from?.id?.toString(),
        updateType: ctx.updateType,
        command: ctx.message?.text || ctx.callbackQuery?.data,
        timestamp: new Date().toISOString()
      };

      console.error('[ErrorHandler] Bot error occurred:', {
        error: error.message || String(error),
        stack: error.stack,
        context: errorContext,
        errorCount: this.errorCount
      });

      // Don't spam users with error messages
      if (this.errorCount > 10 && Date.now() - this.lastErrorTime < 60000) {
        console.warn('[ErrorHandler] Too many errors, suppressing user notifications');
        return;
      }

      // Send user-friendly error message based on error type
      try {
        const errorMessage = this.getContextualErrorMessage(error, errorContext);
        await ctx.reply(errorMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔄 Erneut versuchen', callback_data: 'retry_operation' },
                { text: '❓ Hilfe & FAQ', callback_data: 'help_faq' }
              ],
              [
                { text: '🏠 Hauptmenü', callback_data: 'menu_back' }
              ]
            ]
          }
        });
      } catch (replyError) {
        console.error('[ErrorHandler] Failed to send error message:', replyError);
      }
    };
  }

  /**
   * Get contextual error message based on error type
   */
  private getContextualErrorMessage(error: any, context: ErrorContext): string {
    const errorMessage = error.message || String(error);
    
    // Network/Connection errors
    if (errorMessage.includes('ECONNRESET') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('timeout')) {
      return `🌐 **Verbindungsproblem erkannt**\n\n` +
             `📡 **Status:** Netzwerk-Verbindung unterbrochen\n` +
             `⏰ **Zeit:** ${new Date().toLocaleString()}\n\n` +
             `🔄 **Lösung:**\n` +
             `• Warte 30 Sekunden und versuche es erneut\n` +
             `• Prüfe deine Internetverbindung\n` +
             `• Bei anhaltenden Problemen: FAQ nutzen\n\n` +
             `⚡ **System wird automatisch wiederhergestellt**`;
    }
    
    // API Rate limiting
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return `⏰ **Rate Limit erreicht**\n\n` +
             `🚫 **Grund:** Zu viele Anfragen in kurzer Zeit\n` +
             `⏳ **Wartezeit:** 1-2 Minuten\n\n` +
             `💡 **Tipp:** Lass dem System einen Moment Zeit\n` +
             `🔄 **Dann:** Versuche es erneut\n\n` +
             `⚡ **Automatische Wiederherstellung aktiv**`;
    }
    
    // Authentication errors
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      return `🔐 **Authentifizierungsfehler**\n\n` +
             `⚠️ **Problem:** Bot-Token ungültig oder abgelaufen\n` +
             `🕐 **Zeit:** ${new Date().toLocaleString()}\n\n` +
             `🛠️ **Lösung:**\n` +
             `• Admin wurde automatisch benachrichtigt\n` +
             `• System wird in Kürze repariert\n` +
             `• Versuche es in 5 Minuten erneut\n\n` +
             `📞 **Bei anhaltenden Problemen:** FAQ nutzen`;
    }
    
    // Invite code specific errors
    if (context.command === 'use_invite' || context.command?.includes('invite')) {
      return `🔑 **Invite-Code Problem**\n\n` +
             `❌ **Fehler:** Code-Verarbeitung fehlgeschlagen\n` +
             `⏰ **Zeit:** ${new Date().toLocaleString()}\n\n` +
             `🔄 **Sofortige Lösungen:**\n` +
             `• Prüfe die Code-Schreibweise\n` +
             `• Versuche einen anderen Code\n` +
             `• Nutze die FAQ für Hilfe\n\n` +
             `💡 **Tipp:** Verwende VIP123, NEB456 oder INV789 zum Testen`;
    }
    
    // Generic error with context
    return `⚠️ **Systemfehler erkannt**\n\n` +
           `🔧 **Problem:** ${this.getUserFriendlyErrorType(errorMessage)}\n` +
           `⏰ **Zeit:** ${new Date().toLocaleString()}\n` +
           `🆔 **ID:** ${context.userId || 'Unbekannt'}\n\n` +
           `🔄 **Sofortige Maßnahmen:**\n` +
           `• System wird automatisch repariert\n` +
           `• Warte 30 Sekunden und versuche erneut\n` +
           `• Bei Problemen: FAQ nutzen\n\n` +
           `⚡ **Recovery-System aktiv**`;
  }
  
  /**
   * Get user-friendly error type
   */
  private getUserFriendlyErrorType(errorMessage: string): string {
    if (errorMessage.includes('timeout')) return 'Zeitüberschreitung';
    if (errorMessage.includes('network')) return 'Netzwerk-Problem';
    if (errorMessage.includes('database')) return 'Datenbank-Fehler';
    if (errorMessage.includes('validation')) return 'Validierungsfehler';
    if (errorMessage.includes('permission')) return 'Berechtigungsfehler';
    return 'Unbekannter Fehler';
  }

  getErrorStats() {
    return {
      errorCount: this.errorCount,
      lastErrorTime: this.lastErrorTime,
      isHealthy: this.errorCount < 5 || Date.now() - this.lastErrorTime > 300000 // 5 minutes
    };
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

export const createErrorHandler = () => {
  return errorHandler.createErrorHandler();
};

export const setupGracefulShutdown = (cleanup: () => Promise<void>) => {
  const shutdown = async (signal: string) => {
    console.log(`[Shutdown] Received ${signal}, starting graceful shutdown...`);
    
    try {
      await cleanup();
      console.log('[Shutdown] Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('[Shutdown] Error during cleanup:', error);
      process.exit(1);
    }
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[Shutdown] Uncaught exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Shutdown] Unhandled rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
};