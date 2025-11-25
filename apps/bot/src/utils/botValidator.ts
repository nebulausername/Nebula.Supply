/**
 * Bot Token Validator
 * Validates bot token and provides helpful error messages
 */

import { logger } from "../logger";

export interface BotTokenInfo {
  isValid: boolean;
  botId?: number;
  username?: string;
  firstName?: string;
  error?: string;
}

/**
 * Validate bot token format
 */
export const validateBotTokenFormat = (token: string): boolean => {
  // Bot token format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
  const tokenRegex = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;
  return tokenRegex.test(token);
};

/**
 * Test bot token with Telegram API
 */
export const testBotToken = async (token: string): Promise<BotTokenInfo> => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data: any = await response.json();

    if (!response.ok) {
      return {
        isValid: false,
        error: `HTTP ${response.status}: ${data.description || 'Unknown error'}`
      };
    }

    if (!data.ok) {
      return {
        isValid: false,
        error: data.description || 'Bot API error'
      };
    }

    return {
      isValid: true,
      botId: data.result.id,
      username: data.result.username,
      firstName: data.result.first_name
    };

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
};

/**
 * Get helpful error message for common issues
 */
export const getTokenErrorMessage = (error: string): string => {
  if (error.includes('401')) {
    return '❌ **Bot Token ungültig!**\n\n' +
           '**Lösung:**\n' +
           '1. Gehe zu @BotFather auf Telegram\n' +
           '2. Sende `/newbot`\n' +
           '3. Erstelle einen neuen Bot\n' +
           '4. Kopiere den neuen Token\n' +
           '5. Ersetze den Token in `apps/bot/.env`';
  }

  if (error.includes('404')) {
    return '❌ **Bot nicht gefunden!**\n\n' +
           '**Lösung:**\n' +
           '1. Prüfe den Bot-Token\n' +
           '2. Bot wurde möglicherweise gelöscht\n' +
           '3. Erstelle einen neuen Bot bei @BotFather';
  }

  if (error.includes('Network')) {
    return '❌ **Netzwerk-Fehler!**\n\n' +
           '**Lösung:**\n' +
           '1. Prüfe deine Internet-Verbindung\n' +
           '2. Prüfe Firewall-Einstellungen\n' +
           '3. Versuche es erneut';
  }

  return `❌ **Unbekannter Fehler:** ${error}`;
};

/**
 * Validate and test bot token with detailed feedback
 */
export const validateBotToken = async (token: string): Promise<{
  isValid: boolean;
  info?: BotTokenInfo;
  message?: string;
}> => {
  // Check format first
  if (!validateBotTokenFormat(token)) {
    return {
      isValid: false,
      message: '❌ **Bot Token Format ungültig!**\n\n' +
               '**Erwartetes Format:** `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`\n' +
               '**Aktueller Token:** `' + token.substring(0, 10) + '...`\n\n' +
               '**Lösung:**\n' +
               '1. Gehe zu @BotFather\n' +
               '2. Sende `/newbot`\n' +
               '3. Kopiere den kompletten Token'
    };
  }

  // Test with Telegram API
  const info = await testBotToken(token);

  if (!info.isValid) {
    return {
      isValid: false,
      info,
      message: getTokenErrorMessage(info.error || 'Unknown error')
    };
  }

  return {
    isValid: true,
    info,
    message: `✅ **Bot Token gültig!**\n\n` +
             `🤖 **Bot:** @${info.username} (${info.firstName})\n` +
             `🆔 **ID:** ${info.botId}\n` +
             `🚀 **Status:** Bereit zum Starten!`
  };
};


