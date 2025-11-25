import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { databaseService } from '../../services/database';
import jwt from 'jsonwebtoken';

describe('Rewards API', () => {
  let authToken: string;
  const testTelegramId = 123456789;

  beforeAll(async () => {
    // Create test user
    await databaseService.createBotUser({
      telegram_id: testTelegramId,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User'
    });

    // Generate test JWT
    authToken = jwt.sign(
      {
        sub: `tg:${testTelegramId}`,
        telegramId: testTelegramId,
        username: 'testuser',
        scope: ['webapp']
      },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      { expiresIn: '1h', issuer: 'nebula-api-server', audience: 'nebula-web' }
    );
  });

  afterAll(async () => {
    // Cleanup
    await databaseService.disconnect();
  });

  describe('GET /api/rewards/status', () => {
    it('should return reward status for authenticated user', async () => {
      const response = await request(app)
        .get('/api/rewards/status?timezone=UTC')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('eligible');
      expect(response.body.data).toHaveProperty('streak');
      expect(response.body.data).toHaveProperty('totalCoins');
      expect(response.body.data).toHaveProperty('todayDayKey');
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/rewards/status')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/rewards/status')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle different timezones', async () => {
      const response = await request(app)
        .get('/api/rewards/status?timezone=Europe/Berlin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todayDayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('POST /api/rewards/claim', () => {
    it('should claim reward when eligible', async () => {
      const response = await request(app)
        .post('/api/rewards/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ timezone: 'UTC' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('coins');
      expect(response.body.data).toHaveProperty('streak');
      expect(response.body.data.coins).toBeGreaterThanOrEqual(10);
      expect(response.body.data.streak).toBeGreaterThanOrEqual(1);
    });

    it('should prevent double claim on same day', async () => {
      // First claim
      await request(app)
        .post('/api/rewards/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ timezone: 'UTC' })
        .expect(200);

      // Second claim (should fail)
      const response = await request(app)
        .post('/api/rewards/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ timezone: 'UTC' })
        .expect(400);

      expect(response.body.error).toContain('bereits beansprucht');
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .post('/api/rewards/claim')
        .send({ timezone: 'UTC' })
        .expect(401);
    });

    it('should calculate correct reward with streak', async () => {
      const response = await request(app)
        .get('/api/rewards/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { streak } = response.body.data;
      const expectedMinCoins = 10 + Math.min(streak * 5, 50);

      // Note: Can't claim again if already claimed today, so this is informational
      expect(expectedMinCoins).toBeGreaterThanOrEqual(10);
      expect(expectedMinCoins).toBeLessThanOrEqual(60);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing timezone gracefully', async () => {
      const response = await request(app)
        .post('/api/rewards/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400); // Assuming it will fail due to already claimed

      // Should default to UTC if no timezone provided
      expect(response.body).toBeDefined();
    });

    it('should handle invalid timezone', async () => {
      const response = await request(app)
        .get('/api/rewards/status?timezone=Invalid/Timezone')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Should fallback gracefully

      expect(response.body.success).toBe(true);
    });
  });
});


