import { Router } from 'express';
import { adminOnly } from '../../middleware/auth';
import { databaseService } from '../../services/database';
import { logger } from '../../utils/logger';

const router = Router();

// Get commission for a user
router.get('/user/:telegramId', adminOnly as any, async (req, res) => {
  try {
    const telegramId = Number(req.params.telegramId);
    if (!telegramId || isNaN(telegramId)) {
      return res.status(400).json({ error: 'Invalid telegram_id' });
    }

    const aggregates = await databaseService.getUserAggregatesByTelegramId(telegramId);
    if (!aggregates) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        telegramId,
        commissionPercentage: aggregates.commission_percentage ?? 5.00,
        totalRevenueEur: aggregates.total_revenue_eur ?? 0
      }
    });
  } catch (error) {
    logger.error('Failed to get commission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update commission for a user (per-customer commission configuration)
router.patch('/user/:telegramId', adminOnly as any, async (req, res) => {
  try {
    const telegramId = Number(req.params.telegramId);
    const { commissionPercentage } = req.body;

    if (!telegramId || isNaN(telegramId)) {
      return res.status(400).json({ error: 'Invalid telegram_id' });
    }

    if (commissionPercentage === undefined || commissionPercentage === null) {
      return res.status(400).json({ error: 'commissionPercentage is required' });
    }

    const commission = Number(commissionPercentage);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      return res.status(400).json({ error: 'commissionPercentage must be between 0 and 100' });
    }

    const updated = await databaseService.updateUserAggregates(telegramId, {
      commission_percentage: commission
    });

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Commission updated for user ${telegramId}: ${commission}%`);

    res.json({
      success: true,
      data: {
        telegramId,
        commissionPercentage: updated.commission_percentage ?? 5.00
      }
    });
  } catch (error) {
    logger.error('Failed to update commission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users with commission info (for admin overview)
router.get('/users', adminOnly as any, async (req, res) => {
  try {
    // This is a simplified version - in production you'd want pagination
    // For now, we'll return a summary
    res.json({
      success: true,
      data: {
        message: 'Use /user/:telegramId to get individual user commission info'
      }
    });
  } catch (error) {
    logger.error('Failed to get commission users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

