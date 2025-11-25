import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { getAnalyticsService } from '../services/analyticsService';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/analytics/sales - Get sales analytics
router.get('/sales', [
  query('period').optional().isIn(['day', 'week', 'month', 'year']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const analyticsService = getAnalyticsService();
    if (!analyticsService) {
      return res.status(500).json({ error: 'Analytics service not available' });
    }

    const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
    const dateRange = req.query.startDate && req.query.endDate
      ? {
          startDate: req.query.startDate as string,
          endDate: req.query.endDate as string
        }
      : undefined;

    const salesData = await analyticsService.getSalesAnalytics(period, dateRange);

    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    logger.error('Failed to get sales analytics', { error: error.message, query: req.query });
    res.status(500).json({ error: 'Failed to retrieve sales analytics' });
  }
});

// GET /api/analytics/revenue - Get revenue reports
router.get('/revenue', [
  query('startDate').isISO8601(),
  query('endDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const analyticsService = getAnalyticsService();
    if (!analyticsService) {
      return res.status(500).json({ error: 'Analytics service not available' });
    }

    const dateRange = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };

    const revenueReport = await analyticsService.getRevenueReports(dateRange);

    res.json({
      success: true,
      data: revenueReport
    });
  } catch (error) {
    logger.error('Failed to get revenue reports', { error: error.message, query: req.query });
    res.status(500).json({ error: 'Failed to retrieve revenue reports' });
  }
});

// GET /api/analytics/bestsellers - Get bestseller products
router.get('/bestsellers', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const analyticsService = getAnalyticsService();
    if (!analyticsService) {
      return res.status(500).json({ error: 'Analytics service not available' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const dateRange = req.query.startDate && req.query.endDate
      ? {
          startDate: req.query.startDate as string,
          endDate: req.query.endDate as string
        }
      : undefined;

    const bestsellers = await analyticsService.getBestsellers(limit, dateRange);

    res.json({
      success: true,
      data: bestsellers
    });
  } catch (error) {
    logger.error('Failed to get bestsellers', { error: error.message, query: req.query });
    res.status(500).json({ error: 'Failed to retrieve bestsellers' });
  }
});

// GET /api/analytics/categories - Get category performance
router.get('/categories', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const analyticsService = getAnalyticsService();
    if (!analyticsService) {
      return res.status(500).json({ error: 'Analytics service not available' });
    }

    const dateRange = req.query.startDate && req.query.endDate
      ? {
          startDate: req.query.startDate as string,
          endDate: req.query.endDate as string
        }
      : undefined;

    const categoryPerformance = await analyticsService.getCategoryPerformance(dateRange);

    res.json({
      success: true,
      data: categoryPerformance
    });
  } catch (error) {
    logger.error('Failed to get category performance', { error: error.message, query: req.query });
    res.status(500).json({ error: 'Failed to retrieve category performance' });
  }
});

// GET /api/analytics/customers - Get customer analytics
router.get('/customers', async (req, res) => {
  try {
    const analyticsService = getAnalyticsService();
    if (!analyticsService) {
      return res.status(500).json({ error: 'Analytics service not available' });
    }

    const customerAnalytics = await analyticsService.getCustomerAnalytics();

    res.json({
      success: true,
      data: customerAnalytics
    });
  } catch (error) {
    logger.error('Failed to get customer analytics', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve customer analytics' });
  }
});

// GET /api/analytics/dashboard - Get real-time dashboard metrics
router.get('/dashboard', async (req, res) => {
  try {
    const analyticsService = getAnalyticsService();
    if (!analyticsService) {
      return res.status(500).json({ error: 'Analytics service not available' });
    }

    const dashboardMetrics = await analyticsService.getDashboardMetrics();

    res.json({
      success: true,
      data: dashboardMetrics
    });
  } catch (error) {
    logger.error('Failed to get dashboard metrics', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
});

// Export router
export default router;


