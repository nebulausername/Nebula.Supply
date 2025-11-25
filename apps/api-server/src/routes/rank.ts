import { Router } from 'express';
import { databaseService } from '../services/database';
import { getRankByTelegramId } from '../services/rankService';

const router = Router();

router.get('/me', async (req, res) => {
  try {
    const tg = (req as any).user?.telegram_id || req.query.telegram_id;
    if (!tg) return res.status(400).json({ error: 'telegram_id required' });
    const info = await getRankByTelegramId(Number(tg));
    res.json({ success: true, data: info });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:telegramId', async (req, res) => {
  try {
    const tg = Number(req.params.telegramId);
    const info = await getRankByTelegramId(tg);
    res.json({ success: true, data: info });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;







