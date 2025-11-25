import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { databaseService } from '../../services/database';
import crypto from 'crypto';

describe('Telegram Auth API', () => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || 'test-bot-token-12345:ABCdefGHIjklMNOpqrsTUVwxyz';

  beforeAll(async () => {
    // Ensure database is initialized
    await databaseService.init();
  });

  afterAll(async () => {
    await databaseService.disconnect();
  });

  function generateValidTelegramData(userId: number, username: string) {
    const authDate = Math.floor(Date.now() / 1000);
    const user = JSON.stringify({
      id: userId,
      username,
      first_name: 'Test',
      last_name: 'User'
    });

    const params: Record<string, string> = {
      user,
      auth_date: authDate.toString()
    };

    // Build data_check_string
    const keys = Object.keys(params).sort();
    const dataCheckString = keys.map((key) => `${key}=${params[key]}`).join('\n');

    // Calculate hash
    const secret = crypto.createHash('sha256').update(botToken).digest();
    const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

    // Build initData
    const initData = new URLSearchParams({ ...params, hash }).toString();

    return { initData, hash, authDate };
  }

  describe('POST /api/auth/telegram/verify', () => {
    it('should verify valid Telegram data and return JWT', async () => {
      const { initData } = generateValidTelegramData(111222333, 'validuser');

      const response = await request(app)
        .post('/api/auth/telegram/verify')
        .send({ initData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.telegramId).toBe(111222333);
      expect(response.body.data.user.username).toBe('validuser');
    });

    it('should reject request without initData', async () => {
      const response = await request(app)
        .post('/api/auth/telegram/verify')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('initData');
    });

    it('should reject invalid hash', async () => {
      const params = new URLSearchParams({
        user: JSON.stringify({ id: 123, username: 'test', first_name: 'Test' }),
        auth_date: Math.floor(Date.now() / 1000).toString(),
        hash: 'invalid-hash-12345'
      });

      const response = await request(app)
        .post('/api/auth/telegram/verify')
        .send({ initData: params.toString() })
        .expect(401);

      expect(response.body.error).toContain('Signatur');
    });

    it('should reject request without user field', async () => {
      const authDate = Math.floor(Date.now() / 1000).toString();
      const params: Record<string, string> = { auth_date: authDate };

      const keys = Object.keys(params).sort();
      const dataCheckString = keys.map((key) => `${key}=${params[key]}`).join('\n');

      const secret = crypto.createHash('sha256').update(botToken).digest();
      const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

      const initData = new URLSearchParams({ ...params, hash }).toString();

      const response = await request(app)
        .post('/api/auth/telegram/verify')
        .send({ initData })
        .expect(400);

      expect(response.body.error).toContain('user');
    });

    it('should create new user on first login', async () => {
      const newUserId = 999888777;
      const { initData } = generateValidTelegramData(newUserId, 'newuser');

      const response = await request(app)
        .post('/api/auth/telegram/verify')
        .send({ initData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.telegramId).toBe(newUserId);

      // Verify user was created
      const user = await databaseService.getBotUserByTelegramId(newUserId);
      expect(user).toBeDefined();
      expect(user?.telegram_id).toBe(newUserId);
      expect(user?.username).toBe('newuser');
    });

    it('should update existing user on subsequent login', async () => {
      const existingUserId = 777666555;

      // First login
      await databaseService.createBotUser({
        telegram_id: existingUserId,
        username: 'oldusername',
        first_name: 'Old',
        last_name: 'Name'
      });

      // Second login with updated info
      const { initData } = generateValidTelegramData(existingUserId, 'newusername');

      const response = await request(app)
        .post('/api/auth/telegram/verify')
        .send({ initData })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user was updated
      const user = await databaseService.getBotUserByTelegramId(existingUserId);
      expect(user?.username).toBe('newusername');
    });

    it('should issue JWT with correct claims', async () => {
      const { initData } = generateValidTelegramData(555444333, 'jwttest');

      const response = await request(app)
        .post('/api/auth/telegram/verify')
        .send({ initData })
        .expect(200);

      const token = response.body.data.token;
      expect(token).toBeDefined();

      // Decode JWT (not verify, just decode to check structure)
      const decoded = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );

      expect(decoded.telegramId).toBe(555444333);
      expect(decoded.username).toBe('jwttest');
      expect(decoded.scope).toContain('webapp');
      expect(decoded.iss).toBe('nebula-api-server');
      expect(decoded.aud).toBe('nebula-web');
    });
  });

  describe('Performance & Security', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => {
        const { initData } = generateValidTelegramData(1000 + i, `user${i}`);
        return request(app)
          .post('/api/auth/telegram/verify')
          .send({ initData });
      });

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should complete verification in under 500ms', async () => {
      const { initData } = generateValidTelegramData(888999000, 'perftest');

      const startTime = Date.now();
      await request(app)
        .post('/api/auth/telegram/verify')
        .send({ initData })
        .expect(200);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });
  });
});


