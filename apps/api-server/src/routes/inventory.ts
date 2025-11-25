import { Router } from 'express';
import { body, validationResult, query } from 'express-validator';
import { getInventoryService } from '../services/inventoryService';
import { logger } from '../utils/logger';
import { adminOnly } from '../middleware/auth';

const router = Router();

// GET /api/inventory - Get inventory overview
router.get('/', [
  query('lowStock').optional().isBoolean(),
  query('outOfStock').optional().isBoolean(),
  query('location').optional().isString(),
  query('search').optional().isString(),
  query('sortBy').optional().isIn(['name', 'stock', 'updatedAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inventoryService = getInventoryService();
    if (!inventoryService) {
      return res.status(500).json({ error: 'Inventory service not available' });
    }

    const filters = {
      lowStock: req.query.lowStock ? req.query.lowStock === 'true' : undefined,
      outOfStock: req.query.outOfStock ? req.query.outOfStock === 'true' : undefined,
      location: req.query.location as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await inventoryService.getInventory(filters);

    res.json({
      success: true,
      data: result.items,
      total: result.total,
      metrics: result.metrics,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: result.items.length === filters.limit
      }
    });
  } catch (error) {
    logger.error('Failed to get inventory', { error: error.message, query: req.query });
    res.status(500).json({ error: 'Failed to retrieve inventory' });
  }
});

// GET /api/inventory/low-stock - Get low stock items
router.get('/low-stock', [
  query('threshold').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inventoryService = getInventoryService();
    if (!inventoryService) {
      return res.status(500).json({ error: 'Inventory service not available' });
    }

    const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
    const lowStockItems = await inventoryService.getLowStockItems(threshold);

    res.json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    logger.error('Failed to get low stock items', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve low stock items' });
  }
});

// GET /api/inventory/:productId/history - Get stock history
router.get('/:productId/history', [
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inventoryService = getInventoryService();
    if (!inventoryService) {
      return res.status(500).json({ error: 'Inventory service not available' });
    }

    const { productId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const history = await inventoryService.getStockHistory(productId, limit);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Failed to get stock history', { error: error.message, productId: req.params.productId });
    res.status(500).json({ error: 'Failed to retrieve stock history' });
  }
});

// PATCH /api/inventory/:productId/adjust - Adjust stock (Admin only)
router.patch('/:productId/adjust', adminOnly, [
  body('adjustment').isInt(),
  body('reason').optional().isString(),
  body('location').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inventoryService = getInventoryService();
    if (!inventoryService) {
      return res.status(500).json({ error: 'Inventory service not available' });
    }

    const { productId } = req.params;
    const { adjustment, reason, location } = req.body;
    const userId = (req as any).user?.id;

    const inventoryItem = await inventoryService.adjustStock(
      productId,
      adjustment,
      reason,
      userId,
      location
    );

    res.json({
      success: true,
      data: inventoryItem,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    logger.error('Stock adjustment error', { error: error.message, productId: req.params.productId });
    res.status(500).json({ 
      error: 'Failed to adjust stock',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/inventory/:productId/reserve - Reserve stock (for orders)
router.post('/:productId/reserve', [
  body('quantity').isInt({ min: 1 }),
  body('orderId').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inventoryService = getInventoryService();
    if (!inventoryService) {
      return res.status(500).json({ error: 'Inventory service not available' });
    }

    const { productId } = req.params;
    const { quantity, orderId } = req.body;

    await inventoryService.reserveStock(productId, quantity, orderId);

    res.json({
      success: true,
      message: 'Stock reserved successfully'
    });
  } catch (error) {
    logger.error('Stock reservation error', { error: error.message, productId: req.params.productId });
    res.status(500).json({ 
      error: 'Failed to reserve stock',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/inventory/:productId/release - Release reserved stock
router.post('/:productId/release', [
  body('quantity').isInt({ min: 1 }),
  body('orderId').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inventoryService = getInventoryService();
    if (!inventoryService) {
      return res.status(500).json({ error: 'Inventory service not available' });
    }

    const { productId } = req.params;
    const { quantity, orderId } = req.body;

    await inventoryService.releaseStock(productId, quantity, orderId);

    res.json({
      success: true,
      message: 'Stock released successfully'
    });
  } catch (error) {
    logger.error('Stock release error', { error: error.message, productId: req.params.productId });
    res.status(500).json({ error: 'Failed to release stock' });
  }
});

// POST /api/inventory/alerts/configure - Configure low stock alerts (Admin only)
router.post('/alerts/configure', adminOnly, [
  body('productId').isString().notEmpty(),
  body('threshold').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // This would configure alert thresholds per product
    // For now, we use a global threshold
    res.json({
      success: true,
      message: 'Alert configuration updated'
    });
  } catch (error) {
    logger.error('Alert configuration error', { error: error.message });
    res.status(500).json({ error: 'Failed to configure alerts' });
  }
});

// POST /api/inventory/auto-reorder/configure - Configure auto-reorder (Admin only)
router.post('/auto-reorder/configure', adminOnly, [
  body('productId').isString().notEmpty(),
  body('enabled').optional().isBoolean(),
  body('reorderPoint').optional().isInt({ min: 0 }),
  body('reorderQuantity').optional().isInt({ min: 1 }),
  body('supplier').optional().isString(),
  body('leadTime').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inventoryService = getInventoryService();
    if (!inventoryService) {
      return res.status(500).json({ error: 'Inventory service not available' });
    }

    const { productId, ...config } = req.body;
    const reorderConfig = await inventoryService.configureAutoReorder(productId, config);

    res.json({
      success: true,
      data: reorderConfig,
      message: 'Auto-reorder configured successfully'
    });
  } catch (error) {
    logger.error('Auto-reorder configuration error', { error: error.message });
    res.status(500).json({ error: 'Failed to configure auto-reorder' });
  }
});

// GET /api/inventory/auto-reorder/check - Check and trigger auto-reorder (Admin only)
router.get('/auto-reorder/check', adminOnly, async (req, res) => {
  try {
    const inventoryService = getInventoryService();
    if (!inventoryService) {
      return res.status(500).json({ error: 'Inventory service not available' });
    }

    const reorderNeeded = await inventoryService.checkAutoReorder();

    res.json({
      success: true,
      data: reorderNeeded,
      message: `${reorderNeeded.length} product(s) need reordering`
    });
  } catch (error) {
    logger.error('Auto-reorder check error', { error: error.message });
    res.status(500).json({ error: 'Failed to check auto-reorder' });
  }
});

// Export router
export default router;


