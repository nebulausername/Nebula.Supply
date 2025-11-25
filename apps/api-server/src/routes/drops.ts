import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { drops as initialDrops } from '../../../web/src/data/drops';
import { revolutionaryDrops } from '../../../web/src/data/revolutionaryDrops';

const router = Router();

// 🎯 Rate limiting for external API
const interestRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many interest requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🎯 Types for drops and interests
interface Variant {
  id?: string;
  label: string;
  basePrice: number;
  stock: number;
  sold?: number;
  sku?: string;
  image?: string;
  description?: string;
}

interface Drop {
  id: string;
  name: string;
  description?: string;
  badge?: string;
  access: 'free' | 'limited' | 'vip' | 'standard';
  status?: string;
  variants: Variant[];
  interestCount?: number;
  createdAt?: string;
}

interface ExternalInterest {
  id: string;
  dropId: string;
  source: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const externalInterests: ExternalInterest[] = [];

// Helper function for generating unique IDs
const generateInterestId = (): string => 
  `interest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 🎯 CORS headers for external access
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  next();
});

// 🎯 GET /api/drops - Public drop catalog with filtering
router.get('/', generalRateLimit, [
  query('filter').optional().isIn(['all', 'free', 'limited', 'vip', 'standard']),
  query('search').optional().isString(),
  query('sort').optional().isIn(['name', 'price', 'popularity', 'availability', 'newest']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid query parameters', details: errors.array() });
    }

    const { filter = 'all', search, sort = 'popularity', limit = 20, offset = 0 } = req.query;

    let drops = [...revolutionaryDrops, ...initialDrops];

    // Apply filtering
    if (filter !== 'all') {
      const filterMap: Record<string, (drop: Drop) => boolean> = {
        free: (drop) => drop.access === 'free',
        limited: (drop) => drop.access === 'limited',
        vip: (drop) => drop.access === 'vip',
        standard: (drop) => drop.access === 'standard'
      };
      drops = drops.filter(filterMap[filter]);
    }

    // Apply search
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      drops = drops.filter(drop => {
        return drop.name.toLowerCase().includes(searchTerm) ||
               drop.variants.some((v: Variant) => v.label.toLowerCase().includes(searchTerm)) ||
               drop.badge?.toLowerCase().includes(searchTerm);
      });
    }

    // Apply sorting
    drops.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          const aPrice = Math.min(...a.variants.map((v: Variant) => v.basePrice));
          const bPrice = Math.min(...b.variants.map((v: Variant) => v.basePrice));
          return aPrice - bPrice;
        case 'popularity':
          return (b.interestCount || 0) - (a.interestCount || 0);
        case 'availability':
          const aStock = Math.max(...a.variants.map((v: Variant) => v.stock));
          const bStock = Math.max(...b.variants.map((v: Variant) => v.stock));
          return bStock - aStock;
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    // Apply pagination
    const paginatedDrops = drops.slice(offset as number, (offset as number) + (limit as number));

    res.json({
      success: true,
      data: paginatedDrops,
      pagination: {
        total: drops.length,
        limit: limit as number,
        offset: offset as number,
        hasMore: (offset as number) + (limit as number) < drops.length
      },
      filters: {
        applied: { filter, search, sort },
        available: {
          filters: ['all', 'free', 'limited', 'vip', 'standard'],
          sorts: ['name', 'price', 'popularity', 'availability', 'newest']
        }
      }
    });
  } catch (error) {
    console.error('Error fetching drops:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🎯 GET /api/drops/featured - Curated drops for external widgets
router.get('/featured', generalRateLimit, async (req, res) => {
  try {
    // Get featured drops (high interest, limited availability, etc.)
    const featuredDrops = [...revolutionaryDrops, ...initialDrops]
      .filter(drop => drop.interestCount > 5 || drop.access === 'limited')
      .sort((a, b) => (b.interestCount || 0) - (a.interestCount || 0))
      .slice(0, 6);

    res.json({
      success: true,
      data: featuredDrops,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching featured drops:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🎯 GET /api/drops/:id - Get specific drop details
router.get('/:id', generalRateLimit, [
  param('id').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid drop ID', details: errors.array() });
    }

    const { id } = req.params;
    const drop = [...revolutionaryDrops, ...initialDrops].find(d => d.id === id);

    if (!drop) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    res.json({
      success: true,
      data: drop,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching drop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🎯 POST /api/drops/:id/interest - External interest toggle
router.post('/:id/interest', interestRateLimit, [
  param('id').isString().notEmpty(),
  body('source').optional().isString(),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request data', details: errors.array() });
    }

    const { id } = req.params;
    const { source = 'external', metadata } = req.body;

    // Verify drop exists
    const drop = [...revolutionaryDrops, ...initialDrops].find(d => d.id === id);
    if (!drop) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    // Check for API key if provided
    const apiKey = req.headers['x-api-key'];
    if (apiKey && !process.env.EXTERNAL_API_KEYS?.split(',').includes(apiKey as string)) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Create interest record
    const interest: ExternalInterest = {
      id: generateInterestId(),
      dropId: id,
      source,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date().toISOString(),
      metadata
    };

    externalInterests.push(interest);

    // Keep only recent interests (last 1000)
    if (externalInterests.length > 1000) {
      externalInterests.splice(0, externalInterests.length - 1000);
    }

    res.json({
      success: true,
      message: 'Interest recorded successfully',
      data: {
        dropId: id,
        interestId: interest.id,
        timestamp: interest.timestamp
      }
    });
  } catch (error) {
    console.error('Error recording interest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🎯 GET /api/drops/:id/interest/status - Interest status check
router.get('/:id/interest/status', generalRateLimit, [
  param('id').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid drop ID', details: errors.array() });
    }

    const { id } = req.params;

    // Verify drop exists
    const drop = [...revolutionaryDrops, ...initialDrops].find(d => d.id === id);
    if (!drop) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    // Get recent interests for this drop (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentInterests = externalInterests.filter(
      interest => interest.dropId === id && interest.timestamp > oneDayAgo
    );

    // Get total interest count (including internal)
    const totalInterest = (drop.interestCount || 0) + recentInterests.length;

    res.json({
      success: true,
      data: {
        dropId: id,
        totalInterest,
        recentInterest: recentInterests.length,
        lastInterest: recentInterests[recentInterests.length - 1]?.timestamp || null,
        sources: [...new Set(recentInterests.map(i => i.source))]
      }
    });
  } catch (error) {
    console.error('Error fetching interest status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🎯 GET /api/drops/interest/stats - Global interest statistics
router.get('/interest/stats', generalRateLimit, async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const recentInterests = externalInterests.filter(i => i.timestamp > oneDayAgo);
    const weeklyInterests = externalInterests.filter(i => i.timestamp > oneWeekAgo);

    // Group by drop
    const dropStats = recentInterests.reduce((acc, interest) => {
      acc[interest.dropId] = (acc[interest.dropId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by source
    const sourceStats = recentInterests.reduce((acc, interest) => {
      acc[interest.source] = (acc[interest.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        daily: {
          total: recentInterests.length,
          byDrop: dropStats,
          bySource: sourceStats
        },
        weekly: {
          total: weeklyInterests.length
        },
        trends: {
          // Simple trend calculation
          dailyTrend: recentInterests.length > (weeklyInterests.length / 7) ? 'up' : 'down'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching interest stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
