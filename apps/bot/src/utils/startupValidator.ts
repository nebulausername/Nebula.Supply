/**
 * Startup Validator
 * Validates bot configuration and provides helpful setup guidance
 */

import { logger } from "../logger";
import { appConfig } from "../config";
import { validateBotToken } from "./botValidator";

export interface StartupValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validate complete bot configuration
 */
export const validateBotStartup = async (): Promise<StartupValidation> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check bot token
  if (!appConfig.botToken || appConfig.botToken === 'your_bot_token_here') {
    errors.push('❌ BOT_TOKEN nicht gesetzt oder ungültig');
    suggestions.push('1. Gehe zu @BotFather auf Telegram');
    suggestions.push('2. Sende `/newbot` und erstelle einen neuen Bot');
    suggestions.push('3. Kopiere den Token und setze ihn in `apps/bot/.env`');
  } else {
    // Test bot token
    const tokenValidation = await validateBotToken(appConfig.botToken);
    if (!tokenValidation.isValid) {
      errors.push(`❌ Bot Token ungültig: ${tokenValidation.message}`);
    } else {
      logger.info('Bot token validation successful', {
        botId: tokenValidation.info?.botId,
        username: tokenValidation.info?.username
      });
    }
  }

  // Check admin IDs
  if (!appConfig.adminIds || appConfig.adminIds.length === 0) {
    warnings.push('⚠️ Keine ADMIN_IDS gesetzt');
    suggestions.push('1. Gehe zu @userinfobot auf Telegram');
    suggestions.push('2. Sende `/start` um deine User-ID zu bekommen');
    suggestions.push('3. Füge sie zu ADMIN_IDS in `.env` hinzu');
  }

  // Check JWT secret
  if (!appConfig.jwtSecret || appConfig.jwtSecret === 'your_secure_random_32_character_secret_key_here') {
    warnings.push('⚠️ JWT_SECRET nicht gesetzt');
    suggestions.push('1. Generiere einen sicheren 32+ Zeichen Secret');
    suggestions.push('2. Setze ihn in `.env` für WebApp-Authentifizierung');
  }

  // Check web app URL
  if (!appConfig.webAppUrl || appConfig.webAppUrl === 'http://localhost:5173') {
    if (appConfig.nodeEnv === 'production') {
      warnings.push('⚠️ WEB_APP_URL sollte in Production eine HTTPS-URL sein');
    }
  }

  // Check Redis connection (if configured)
  if (appConfig.redisUrl) {
    try {
      // Simple Redis connection test would go here
      logger.info('Redis URL configured', { url: appConfig.redisUrl });
    } catch (error) {
      warnings.push('⚠️ Redis-Verbindung fehlgeschlagen, verwende Memory-Store');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

/**
 * Print startup validation results
 */
export const printStartupValidation = (validation: StartupValidation): void => {
  console.log('\n🔍 **Nebula Bot Startup Validation**\n');

  if (validation.errors.length > 0) {
    console.log('❌ **KRITISCHE FEHLER:**');
    validation.errors.forEach(error => console.log(`  ${error}`));
    console.log('');
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️ **WARNUNGEN:**');
    validation.warnings.forEach(warning => console.log(`  ${warning}`));
    console.log('');
  }

  if (validation.suggestions.length > 0) {
    console.log('💡 **LÖSUNGEN:**');
    validation.suggestions.forEach(suggestion => console.log(`  ${suggestion}`));
    console.log('');
  }

  if (validation.isValid) {
    console.log('✅ **Bot-Konfiguration ist gültig!**');
    console.log('🚀 **Bot kann gestartet werden.**\n');
  } else {
    console.log('❌ **Bot kann nicht gestartet werden.**');
    console.log('🔧 **Bitte behebe die Fehler und versuche es erneut.**\n');
  }
};

/**
 * Interactive setup helper
 */
export const interactiveSetup = async (): Promise<boolean> => {
  console.log('\n🤖 **Nebula Bot Setup Helper**\n');
  
  const validation = await validateBotStartup();
  printStartupValidation(validation);

  if (!validation.isValid) {
    console.log('📋 **Setup-Anleitung:**');
    console.log('1. Lies die BOT_SETUP_GUIDE.md');
    console.log('2. Folge den Anweisungen');
    console.log('3. Starte den Bot erneut\n');
    return false;
  }

  return true;
};


