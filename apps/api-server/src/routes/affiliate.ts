import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { databaseService } from '../services/database';

const router = Router();

router.get('/overview', async (req, res) => {
  try {
    const inviterId = req.query.userId as string | undefined;
    if (!inviterId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const overview = await databaseService.getAffiliateOverview(inviterId);
    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/referrals', [query('userId').isString().notEmpty()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid query', details: errors.array() });
    }
    const inviterId = req.query.userId as string;
    const list = await databaseService.getReferrals(inviterId);
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/leaderboard', async (_req, res) => {
  try {
    const board = await databaseService.getReferralLeaderboard(20);
    res.json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;








