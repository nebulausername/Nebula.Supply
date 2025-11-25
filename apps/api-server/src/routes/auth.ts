import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { databaseService } from '../services/database';
import { ensurePersonalInviteCode } from '../services/personalInviteCodeService';
import crypto from 'crypto';

const router = Router();

// POST /api/auth/login - Benutzer anmelden
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password').isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen haben')
], asyncHandler(async (req: Request, res: Response) => {
  // Validation prüfen
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validierungsfehler', 400, 'VALIDATION_ERROR');
  }

  const { email, password } = req.body;

  logger.info('Login attempt', { email });

  // Finde Benutzer in Datenbank
  const users = await databaseService.findMany('users');
  const user = users.find(u => u.email === email);

  if (!user) {
    throw createError('Ungültige Anmeldedaten', 401, 'INVALID_CREDENTIALS');
  }

  // Prüfe Passwort
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError('Ungültige Anmeldedaten', 401, 'INVALID_CREDENTIALS');
  }

  // Aktualisiere letzte Anmeldung
  await databaseService.update('users', user.id, {
    lastLogin: new Date().toISOString()
  });

  // Erstelle JWT Token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    },
    process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    {
      expiresIn: '8h', // Token gültig für 8 Stunden
      issuer: 'nebula-api-server',
      audience: 'nebula-admin-dashboard'
    }
  );

  // Erstelle Refresh Token
  const refreshToken = jwt.sign(
    {
      id: user.id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production',
    {
      expiresIn: '7d', // Refresh Token gültig für 7 Tage
      issuer: 'nebula-api-server',
      audience: 'nebula-admin-dashboard'
    }
  );

  logger.info('Login successful', {
    userId: user.id,
    email: user.email,
    role: user.role
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      tokens: {
        accessToken: token,
        refreshToken: refreshToken,
        expiresIn: 8 * 60 * 60 // Sekunden
      }
    },
    message: 'Erfolgreich angemeldet'
  });
}));

// POST /api/auth/refresh - Token erneuern
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError('Refresh Token erforderlich', 401, 'REFRESH_TOKEN_MISSING');
  }

  try {
    // Verifiziere Refresh Token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production'
    ) as any;

    if (decoded.type !== 'refresh') {
      throw createError('Ungültiger Refresh Token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Hole Benutzer-Daten
    const users = await databaseService.findMany('users');
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
      throw createError('Benutzer nicht gefunden', 401, 'USER_NOT_FOUND');
    }

    // Erstelle neuen Access Token
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      {
        expiresIn: '8h',
        issuer: 'nebula-api-server',
        audience: 'nebula-admin-dashboard'
      }
    );

    logger.info('Token refreshed', { userId: user.id });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 8 * 60 * 60 // Sekunden
      },
      message: 'Token erfolgreich erneuert'
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Ungültiger Refresh Token', 401, 'INVALID_REFRESH_TOKEN');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw createError('Refresh Token abgelaufen', 401, 'REFRESH_TOKEN_EXPIRED');
    }
    throw error;
  }
}));

// POST /api/auth/logout - Abmelden
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // Hier könnten wir eine Blacklist für Tokens implementieren
  // Für jetzt einfach erfolgreich antworten

  logger.info('Logout', { userId: req.user?.id });

  res.json({
    success: true,
    message: 'Erfolgreich abgemeldet'
  });
}));

// GET /api/auth/me - Aktuelle Benutzer-Info
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Nicht authentifiziert', 401);
  }

  const users = await databaseService.findMany('users');
  const user = users.find(u => u.id === req.user!.id);

  if (!user) {
    throw createError('Benutzer nicht gefunden', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    }
  });
}));

// POST /api/auth/change-password - Passwort ändern
router.post('/change-password', [
  body('currentPassword').isLength({ min: 6 }).withMessage('Aktuelles Passwort erforderlich'),
  body('newPassword').isLength({ min: 6 }).withMessage('Neues Passwort muss mindestens 6 Zeichen haben'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwörter stimmen nicht überein');
    }
    return true;
  })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validierungsfehler', 400, 'VALIDATION_ERROR');
  }

  if (!req.user) {
    throw createError('Nicht authentifiziert', 401);
  }

  const { currentPassword, newPassword } = req.body;

  const users = await databaseService.findMany('users');
  const user = users.find(u => u.id === req.user!.id);

  if (!user) {
    throw createError('Benutzer nicht gefunden', 404, 'USER_NOT_FOUND');
  }

  // Prüfe aktuelles Passwort
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw createError('Aktuelles Passwort ist falsch', 400, 'INVALID_CURRENT_PASSWORD');
  }

  // Hash neues Passwort
  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Aktualisiere Passwort
  await databaseService.update('users', user.id, {
    password: hashedNewPassword
  });

  logger.info('Password changed', { userId: user.id });

  res.json({
    success: true,
    message: 'Passwort erfolgreich geändert'
  });
}));

export { router as authRoutes };

// --- Telegram WebApp Verification ---

// Helper to build Telegram data_check_string per docs
function buildDataCheckString(params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  return keys.map((key) => `${key}=${params[key]}`).join('\n');
}

// POST /api/auth/telegram/verify
router.post('/telegram/verify', asyncHandler(async (req: Request, res: Response) => {
  const { initData } = req.body as { initData?: string };
  if (!initData) {
    throw createError('initData erforderlich', 400, 'INIT_DATA_MISSING');
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw createError('Server nicht konfiguriert (TELEGRAM_BOT_TOKEN fehlt)', 500, 'SERVER_MISCONFIGURED');
  }

  // Parse initData as URLSearchParams (Telegram.WebApp.initData)
  const params = new URLSearchParams(initData);
  const hash = params.get('hash') || '';
  params.delete('hash');

  // Convert to record and stringify values
  const data: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    data[key] = value;
  }

  const dataCheckString = buildDataCheckString(data);

  // secret = sha256(BOT_TOKEN)
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (computed !== hash) {
    logger.warn('Telegram verify failed: hash mismatch');
    throw createError('Ungültige Telegram Signatur', 401, 'TELEGRAM_INVALID_SIGNATURE');
  }

  // Parse user
  const userStr = params.get('user');
  if (!userStr) {
    throw createError('Telegram user fehlt', 400, 'TELEGRAM_USER_MISSING');
  }

  let tgUser: { id: number; username?: string; first_name?: string; last_name?: string };
  try {
    tgUser = JSON.parse(userStr);
  } catch {
    throw createError('Telegram user ungültig', 400, 'TELEGRAM_USER_PARSE_ERROR');
  }

  // Upsert bot user
  let botUser = await databaseService.getBotUserByTelegramId(tgUser.id);
  if (!botUser) {
    botUser = await databaseService.createBotUser({
      telegram_id: tgUser.id,
      username: tgUser.username,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name,
      verified_at: new Date().toISOString()
    });
  } else {
    await databaseService.updateBotUser(tgUser.id, {
      username: tgUser.username,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name,
      verified_at: botUser.verified_at || new Date().toISOString()
    });
  }

  // Ensure user has a personal invite code (generate if missing)
  let personalInviteCode: string | null = null;
  try {
    personalInviteCode = await ensurePersonalInviteCode(tgUser.id);
    logger.info('Personal invite code ensured for user', { telegramId: tgUser.id, code: personalInviteCode });
  } catch (error) {
    logger.error('Failed to ensure personal invite code', { error, telegramId: tgUser.id });
    // Don't fail the verification if code generation fails
  }

  // Issue JWT for web app
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
  const accessToken = jwt.sign(
    {
      sub: `tg:${tgUser.id}`,
      telegramId: tgUser.id,
      username: tgUser.username || null,
      scope: ['webapp']
    },
    jwtSecret,
    { expiresIn: '12h', issuer: 'nebula-api-server', audience: 'nebula-web' }
  );

  res.json({
    success: true,
    data: {
      token: accessToken,
      user: {
        telegramId: tgUser.id,
        username: tgUser.username || null,
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
        personalInviteCode: personalInviteCode
      }
    }
  });
}));
