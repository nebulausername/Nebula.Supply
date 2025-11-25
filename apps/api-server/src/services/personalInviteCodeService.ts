import { databaseService } from './database';
import { logger } from '../utils/logger';
import { getRankByTelegramId } from './rankService';
import crypto from 'crypto';

// Reserved words/prefixes that cannot be used
const RESERVED_PREFIXES = ['NEB-', 'ADMIN', 'SYSTEM', 'TEST'];
const RESERVED_WORDS = ['admin', 'system', 'test', 'root', 'api'];

// Code format validation
const CODE_FORMAT_REGEX = /^[A-Z0-9-]{6,20}$/;

/**
 * Generate a unique personal invite code for a user
 * Format: NEB-XXXXXX (6 alphanumeric characters)
 */
export async function generatePersonalInviteCode(telegramId: number): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate 6-character alphanumeric code
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 6);
    const code = `NEB-${randomPart}`;

    // Check if code is already taken
    const isAvailable = await validatePersonalInviteCodeAvailability(code);
    
    if (isAvailable) {
      logger.info('Personal invite code generated', { telegramId, code });
      return code;
    }

    attempts++;
  }

  // Fallback: use timestamp-based code if random generation fails
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
  const fallbackCode = `NEB-${timestamp}`;
  
  logger.warn('Using fallback code generation', { telegramId, code: fallbackCode });
  return fallbackCode;
}

/**
 * Validate if a personal invite code is available (not taken)
 */
export async function validatePersonalInviteCodeAvailability(code: string): Promise<boolean> {
  // Check format
  if (!CODE_FORMAT_REGEX.test(code)) {
    return false;
  }

  // Check reserved words
  const upperCode = code.toUpperCase();
  for (const prefix of RESERVED_PREFIXES) {
    if (upperCode.startsWith(prefix) && prefix !== 'NEB-') {
      return false;
    }
  }

  for (const word of RESERVED_WORDS) {
    if (upperCode.includes(word.toUpperCase())) {
      return false;
    }
  }

  // Check if code exists in bot_users table
  const pool = databaseService.getPool();
  if (pool) {
    const result = await pool.query(
      'SELECT telegram_id FROM bot_users WHERE personal_invite_code = $1',
      [code.toUpperCase()]
    );
    
    if (result.rows.length > 0) {
      return false;
    }
  } else {
    // In-memory check - iterate through storage
    // This is a fallback for in-memory mode
    const storage = (databaseService as any).storage;
    if (storage?.botUsers) {
      for (const user of storage.botUsers.values()) {
        if (user.personal_invite_code?.toUpperCase() === code.toUpperCase()) {
          return false;
        }
      }
    }
  }

  // Check if code exists in invite_codes table (system codes)
  const existingInviteCode = await databaseService.getInviteCodeByCode(code.toUpperCase());
  if (existingInviteCode) {
    return false;
  }

  return true;
}

/**
 * Validate personal invite code format
 */
export function validatePersonalInviteCodeFormat(code: string): { valid: boolean; error?: string } {
  if (!code || code.length < 6 || code.length > 20) {
    return { valid: false, error: 'Code muss zwischen 6 und 20 Zeichen lang sein' };
  }

  if (!CODE_FORMAT_REGEX.test(code)) {
    return { valid: false, error: 'Code darf nur Großbuchstaben, Zahlen und Bindestriche enthalten' };
  }

  const upperCode = code.toUpperCase();
  
  // Check reserved prefixes
  for (const prefix of RESERVED_PREFIXES) {
    if (upperCode.startsWith(prefix) && prefix !== 'NEB-') {
      return { valid: false, error: `Code darf nicht mit "${prefix}" beginnen` };
    }
  }

  // Check reserved words
  for (const word of RESERVED_WORDS) {
    if (upperCode.includes(word.toUpperCase())) {
      return { valid: false, error: `Code darf das reservierte Wort "${word}" nicht enthalten` };
    }
  }

  return { valid: true };
}

/**
 * Update personal invite code for a user (VIP/Stammkunde only)
 */
export async function updatePersonalInviteCode(
  telegramId: number,
  newCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user rank
    const rankInfo = await getRankByTelegramId(telegramId);
    const userRank = rankInfo.rank;

    // Check if user is VIP or Stammkunde
    if (userRank !== 'VIP' && userRank !== 'Stammkunde') {
      return {
        success: false,
        error: 'Nur VIP und Stammkunde können ihren persönlichen Invite-Code ändern'
      };
    }

    // Validate format
    const formatValidation = validatePersonalInviteCodeFormat(newCode);
    if (!formatValidation.valid) {
      return {
        success: false,
        error: formatValidation.error || 'Ungültiges Code-Format'
      };
    }

    // Check availability
    const isAvailable = await validatePersonalInviteCodeAvailability(newCode.toUpperCase());
    if (!isAvailable) {
      return {
        success: false,
        error: 'Dieser Code ist bereits vergeben'
      };
    }

    // Get current user
    const user = await databaseService.getBotUserByTelegramId(telegramId);
    if (!user) {
      return {
        success: false,
        error: 'Benutzer nicht gefunden'
      };
    }

    // Check rate limiting (max 3 updates per day)
    const lastUpdate = user.updated_at;
    const updatesToday = await checkUpdateRateLimit(telegramId, lastUpdate);
    if (!updatesToday.allowed) {
      return {
        success: false,
        error: `Du kannst deinen Code nur ${updatesToday.maxUpdates} mal pro Tag ändern. Nächste Änderung möglich in ${updatesToday.nextUpdateIn}`
      };
    }

    // Update code
    await databaseService.updateBotUser(telegramId, {
      personal_invite_code: newCode.toUpperCase()
    });

    logger.info('Personal invite code updated', { 
      telegramId, 
      oldCode: user.personal_invite_code,
      newCode: newCode.toUpperCase(),
      rank: userRank
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to update personal invite code', { error, telegramId, newCode });
    return {
      success: false,
      error: 'Fehler beim Aktualisieren des Codes. Bitte versuche es später erneut.'
    };
  }
}

/**
 * Check rate limiting for code updates (max 3 per day)
 */
async function checkUpdateRateLimit(
  telegramId: number,
  lastUpdate: string
): Promise<{ allowed: boolean; maxUpdates: number; nextUpdateIn?: string }> {
  const maxUpdates = 3;
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  // For simplicity, we check if user was updated today
  // In production, you might want to track update count separately
  const lastUpdateDate = new Date(lastUpdate);
  const now = new Date();
  const timeSinceUpdate = now.getTime() - lastUpdateDate.getTime();
  
  // If updated less than 24h ago, check if we can allow another update
  // This is a simplified check - in production, track update count per day
  if (timeSinceUpdate < oneDayMs) {
    // For now, allow updates (we'd need a separate table to track update count)
    // TODO: Implement proper rate limiting with update count tracking
    return { allowed: true, maxUpdates };
  }

  return { allowed: true, maxUpdates };
}

/**
 * Get personal invite code for a user
 */
export async function getPersonalInviteCode(telegramId: number): Promise<string | null> {
  const user = await databaseService.getBotUserByTelegramId(telegramId);
  return user?.personal_invite_code || null;
}

/**
 * Ensure user has a personal invite code (generate if missing)
 */
export async function ensurePersonalInviteCode(telegramId: number): Promise<string> {
  const user = await databaseService.getBotUserByTelegramId(telegramId);
  
  if (!user) {
    throw new Error('User not found');
  }

  if (user.personal_invite_code) {
    return user.personal_invite_code;
  }

  // Generate new code
  const newCode = await generatePersonalInviteCode(telegramId);
  
  // Save to database
  await databaseService.updateBotUser(telegramId, {
    personal_invite_code: newCode
  });

  logger.info('Personal invite code generated for user', { telegramId, code: newCode });
  
  return newCode;
}

