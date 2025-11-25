import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getWebSocketServer } from '../websocket/server';
import { databaseService } from '../services/database';

const router = Router();

// Types for API requests/responses
interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'expired';
  points: number;
  reason: string;
  orderId?: string;
  timestamp: string;
  description: string;
}

interface LoyaltyTier {
  tier: string;
  name: string;
  pointsRequired: number;
  benefits: string[];
  color: string;
  icon: string;
}

interface LoyaltyResponse {
  userId: string;
  currentPoints: number;
  currentTier: string;
  totalEarned: number;
  totalRedeemed: number;
  tierInfo: LoyaltyTier;
  pointsToNextTier: number;
  tierProgress: number;
  transactions: LoyaltyTransaction[];
}

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'shipping' | 'product' | 'vip';
  available: boolean;
  estimatedValue?: number;
}

// GET /api/loyalty/:userId - Get user's loyalty status
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // In production, get loyalty data from database
    // For demo, return mock data
    const loyaltyResponse: LoyaltyResponse = {
      userId,
      currentPoints: 1250,
      currentTier: 'silver',
      totalEarned: 1500,
      totalRedeemed: 250,
      tierInfo: {
        tier: 'silver',
        name: 'Silver Elite',
        pointsRequired: 1000,
        benefits: [
          '10% Rabatt auf alle Produkte',
          'Priority Support',
          'Exklusive Silver-Only Drops'
        ],
        color: 'from-slate-400 to-slate-600',
        icon: '🥈'
      },
      pointsToNextTier: 3750, // To reach Gold (5000)
      tierProgress: 25, // 1250/5000 * 100
      transactions: [
        {
          id: 'txn_1',
          userId,
          type: 'earned',
          points: 100,
          reason: 'Bestellung #NEB-ABC123',
          orderId: 'NEB-ABC123',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: '100 Punkte für Bestellung erhalten'
        },
        {
          id: 'txn_2',
          userId,
          type: 'redeemed',
          points: -200,
          reason: '10% Rabatt eingelöst',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: '200 Punkte für 10% Rabatt eingelöst'
        }
      ]
    };

    res.json(loyaltyResponse);
  } catch (error) {
    console.error('Loyalty retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve loyalty data' });
  }
});

// POST /api/loyalty/:userId/points - Add points to user
router.post('/:userId/points', [
  body('points').isInt({ min: 1 }),
  body('reason').isString().notEmpty(),
  body('orderId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { points, reason, orderId } = req.body;

    // In production, add points to database
    const transaction: LoyaltyTransaction = {
      id: `loyalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'earned',
      points,
      reason,
      orderId,
      timestamp: new Date().toISOString(),
      description: `${points} Punkte für ${reason} erhalten`
    };

    // Update user's total points and tier if necessary
    res.json({
      success: true,
      transaction,
      message: `${points} points added for ${reason}`
    });
  } catch (error) {
    console.error('Add loyalty points error:', error);
    res.status(500).json({ error: 'Failed to add loyalty points' });
  }
});

// POST /api/loyalty/:userId/redeem - Redeem points for reward
router.post('/:userId/redeem', [
  body('rewardId').isString().notEmpty(),
  body('points').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { rewardId, points } = req.body;

    // Check if user has enough points
    // In production, check database

    if (points > 1250) { // Mock check
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Redeem points and activate reward
    const transaction: LoyaltyTransaction = {
      id: `redeem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'redeemed',
      points: -points,
      reason: `Reward: ${rewardId}`,
      timestamp: new Date().toISOString(),
      description: `${points} Punkte für Belohnung eingelöst`
    };

    res.json({
      success: true,
      transaction,
      rewardActivated: true,
      message: `Reward ${rewardId} activated`
    });
  } catch (error) {
    console.error('Redeem loyalty points error:', error);
    res.status(500).json({ error: 'Failed to redeem loyalty points' });
  }
});

// GET /api/loyalty/rewards - Get available rewards
router.get('/rewards', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    // In production, get rewards from database based on user's tier
    const rewards: Reward[] = [
      {
        id: 'discount_10',
        title: '10% Rabatt auf nächste Bestellung',
        description: 'Erhalte 10% Rabatt auf deine nächste Bestellung (max. €50)',
        pointsCost: 500,
        category: 'discount',
        available: true,
        estimatedValue: 50
      },
      {
        id: 'free_shipping',
        title: 'Kostenloser Versand',
        description: 'Kostenloser Versand für deine nächste Bestellung',
        pointsCost: 300,
        category: 'shipping',
        available: true
      },
      {
        id: 'priority_support',
        title: 'Priority Support für 30 Tage',
        description: 'Erhalte vorrangigen Support für alle Anfragen',
        pointsCost: 200,
        category: 'vip',
        available: true
      },
      {
        id: 'mystery_box',
        title: 'Mystery Product Box',
        description: 'Erhalte eine Überraschungs-Box mit exklusiven Produkten',
        pointsCost: 1000,
        category: 'product',
        available: true,
        estimatedValue: 150
      }
    ];

    res.json({ rewards });
  } catch (error) {
    console.error('Rewards retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve rewards' });
  }
});

// POST /api/loyalty/:userId/adjust-points - Admin: Manually adjust loyalty points (for delays, etc.)
router.post('/:userId/adjust-points', [
  body('points').isInt(),
  body('reason').isString().notEmpty(),
  body('orderId').optional().isString(),
  body('multiplier').optional().isFloat({ min: 0.1, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { points, reason, orderId, multiplier } = req.body;

    // In production, adjust points in database
    // If multiplier is provided, calculate points based on order value
    let finalPoints = points;
    if (multiplier && orderId) {
      // Get order value and apply multiplier
      // This would require order lookup in production
      // For now, use provided points
    }

    // Get current loyalty status to calculate new tier
    const userLoyalty = await databaseService.findOne<{ userId: string; currentPoints: number; currentTier: string }>('loyalty', {
      userId
    });

    const newPoints = (userLoyalty?.currentPoints || 0) + finalPoints;
    
    // Calculate new tier based on points
    let newTier = 'bronze';
    if (newPoints >= 50000) newTier = 'diamond';
    else if (newPoints >= 15000) newTier = 'platinum';
    else if (newPoints >= 5000) newTier = 'gold';
    else if (newPoints >= 1000) newTier = 'silver';

    const transaction: LoyaltyTransaction = {
      id: `adjust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: finalPoints > 0 ? 'earned' : 'redeemed',
      points: finalPoints,
      reason: `Admin Anpassung: ${reason}`,
      orderId,
      timestamp: new Date().toISOString(),
      description: `${finalPoints > 0 ? '+' : ''}${finalPoints} Punkte (Admin Anpassung: ${reason})`
    };

    // Update loyalty record in database
    if (userLoyalty) {
      await databaseService.update('loyalty', userId, {
        currentPoints: newPoints,
        currentTier: newTier,
        updatedAt: new Date().toISOString()
      });
    } else {
      await databaseService.create('loyalty', {
        userId,
        currentPoints: newPoints,
        currentTier: newTier,
        totalEarned: finalPoints > 0 ? finalPoints : 0,
        totalRedeemed: finalPoints < 0 ? Math.abs(finalPoints) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Broadcast WebSocket event
    try {
      const wsServer = getWebSocketServer();
      if (wsServer) {
        await wsServer.broadcastLoyaltyPointsAdjusted(userId, finalPoints, `Admin Anpassung: ${reason}`, orderId);
        
        // Check if tier changed
        if (userLoyalty && userLoyalty.currentTier !== newTier) {
          await wsServer.broadcastLoyaltyTierUpgraded(userId, userLoyalty.currentTier, newTier);
        }
      }
    } catch (error) {
      console.error('WebSocket broadcast error:', error);
      // Don't fail the request if WebSocket fails
    }

    res.json({
      success: true,
      transaction,
      message: `Points adjusted: ${finalPoints > 0 ? '+' : ''}${finalPoints} points`
    });
  } catch (error) {
    console.error('Adjust loyalty points error:', error);
    res.status(500).json({ error: 'Failed to adjust loyalty points' });
  }
});

// GET /api/loyalty/tiers - Get loyalty tiers
router.get('/tiers', async (req, res) => {
  try {
    const tiers: LoyaltyTier[] = [
      {
        tier: 'bronze',
        name: 'Bronze Member',
        pointsRequired: 0,
        benefits: [
          'Grundlegende Mitgliedschaft',
          'Newsletter mit exklusiven Angeboten',
          'Frühzeitiger Zugang zu Sales'
        ],
        color: 'from-amber-600 to-amber-800',
        icon: '🥉'
      },
      {
        tier: 'silver',
        name: 'Silver Elite',
        pointsRequired: 1000,
        benefits: [
          'Alle Bronze Vorteile',
          '10% Rabatt auf alle Produkte',
          'Priority Support',
          'Exklusive Silver-Only Drops'
        ],
        color: 'from-slate-400 to-slate-600',
        icon: '🥈'
      },
      {
        tier: 'gold',
        name: 'Gold VIP',
        pointsRequired: 5000,
        benefits: [
          'Alle Silver Vorteile',
          '15% Rabatt auf alle Produkte',
          'VIP-Only Produkte',
          'Persönlicher Account Manager'
        ],
        color: 'from-yellow-400 to-yellow-600',
        icon: '🥇'
      },
      {
        tier: 'platinum',
        name: 'Platinum Legend',
        pointsRequired: 15000,
        benefits: [
          'Alle Gold Vorteile',
          '20% Rabatt auf alle Produkte',
          'Lifetime Warranty',
          'Exklusive Platinum Events'
        ],
        color: 'from-purple-400 to-purple-600',
        icon: '💎'
      }
    ];

    res.json({ tiers });
  } catch (error) {
    console.error('Tiers retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve loyalty tiers' });
  }
});

// Export router
export default router;


