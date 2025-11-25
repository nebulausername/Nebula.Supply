import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminOnly } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { shopRealtimeEvents } from '../../websocket/shopEvents';

const router = Router();

// In-memory store for sync jobs (in production, use Redis or database)
const syncJobs = new Map<string, any>();

// Generate unique sync ID
const generateSyncId = () => `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// POST /api/admin/shop/sync - Initiate shop synchronization
router.post('/sync', [
  adminOnly,
  body('items').isArray().notEmpty(),
  body('items.*.productId').optional().isString(),
  body('items.*.dropId').optional().isString(),
  body('items.*.direction').isIn(['product_to_drop', 'drop_to_product', 'bidirectional']),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid request', 
      details: errors.array() 
    });
  }

  const { items } = req.body;
  const syncId = generateSyncId();

  // Create sync job
  const syncJob = {
    syncId,
    state: 'pending' as const,
    progress: 0,
    startedAt: new Date().toISOString(),
    items: items.map((item: any) => ({
      ...item,
      status: 'pending' as const,
      message: 'Waiting to sync...'
    })),
    conflicts: [],
    logs: [{
      timestamp: new Date().toISOString(),
      message: `Sync job created with ${items.length} item(s)`,
      level: 'info' as const
    }]
  };

  syncJobs.set(syncId, syncJob);

  // Emit realtime event
  shopRealtimeEvents.emit('sync:started', {
    syncId,
    itemCount: items.length
  });

  // Process sync asynchronously (simplified - in production, use a job queue)
  processSyncJob(syncId, items).catch((error) => {
    logger.error('Sync job failed', { syncId, error });
    const job = syncJobs.get(syncId);
    if (job) {
      job.state = 'failed';
      job.logs.push({
        timestamp: new Date().toISOString(),
        message: `Sync failed: ${error.message}`,
        level: 'error' as const
      });
      syncJobs.set(syncId, job);
      shopRealtimeEvents.emit('sync:failed', { syncId, error: error.message });
    }
  });

  res.json({
    success: true,
    syncId,
    status: syncJob
  });
}));

// GET /api/admin/shop/sync/status - Get sync status
router.get('/sync/status', [
  adminOnly,
  query('syncId').optional().isString(),
  query('itemId').optional().isString(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid parameters', 
      details: errors.array() 
    });
  }

  const { syncId, itemId } = req.query;

  if (syncId) {
    const job = syncJobs.get(syncId as string);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Sync job not found'
      });
    }
    return res.json({
      success: true,
      status: job
    });
  }

  if (itemId) {
    // Find sync job containing this item
    for (const [id, job] of syncJobs.entries()) {
      const item = job.items.find((i: any) => 
        (i.productId === itemId || i.dropId === itemId)
      );
      if (item) {
        return res.json({
          success: true,
          syncId: id,
          status: job,
          item
        });
      }
    }
    return res.status(404).json({
      success: false,
      error: 'Item not found in any sync job'
    });
  }

  return res.status(400).json({
    success: false,
    error: 'Either syncId or itemId must be provided'
  });
}));

// POST /api/admin/shop/sync/resolve - Resolve sync conflict
router.post('/sync/resolve', [
  adminOnly,
  body('conflictId').isString().notEmpty(),
  body('resolution').isIn(['product', 'drop', 'manual']),
  body('value').optional(),
  body('notes').optional().isString(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid request', 
      details: errors.array() 
    });
  }

  const { conflictId, resolution, value, notes } = req.body;

  // Find conflict in sync jobs
  let conflictFound = false;
  for (const [syncId, job] of syncJobs.entries()) {
    const conflict = job.conflicts?.find((c: any) => c.conflictId === conflictId);
    if (conflict) {
      conflictFound = true;
      conflict.resolution = resolution;
      conflict.resolvedAt = new Date().toISOString();
      if (value !== undefined) {
        conflict.resolvedValue = value;
      }
      if (notes) {
        conflict.notes = notes;
      }

      job.logs.push({
        timestamp: new Date().toISOString(),
        message: `Conflict ${conflictId} resolved with resolution: ${resolution}`,
        level: 'info' as const
      });

      syncJobs.set(syncId, job);

      // Emit realtime event
      shopRealtimeEvents.emit('sync:conflict_resolved', {
        syncId,
        conflictId,
        resolution
      });

      // Continue sync if all conflicts are resolved
      if (job.state === 'conflict' && job.conflicts?.every((c: any) => c.resolution)) {
        job.state = 'in_progress';
        processSyncJob(syncId, job.items).catch((error) => {
          logger.error('Sync job failed after conflict resolution', { syncId, error });
        });
      }

      return res.json({
        success: true,
        conflict,
        syncId
      });
    }
  }

  if (!conflictFound) {
    return res.status(404).json({
      success: false,
      error: 'Conflict not found'
    });
  }
}));

// Helper function to process sync job (simplified implementation)
async function processSyncJob(syncId: string, items: any[]) {
  const job = syncJobs.get(syncId);
  if (!job) return;

  job.state = 'in_progress';
  syncJobs.set(syncId, job);

  shopRealtimeEvents.emit('sync:progress', {
    syncId,
    progress: 0,
    state: 'in_progress'
  });

  // Simulate sync process
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemIndex = job.items.findIndex((j: any) => 
      j.productId === item.productId && j.dropId === item.dropId
    );

    if (itemIndex >= 0) {
      try {
        // Simulate sync operation
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check for conflicts (simplified - in production, compare actual data)
        const hasConflict = Math.random() > 0.8; // 20% chance of conflict

        if (hasConflict) {
          job.items[itemIndex].status = 'conflict';
          job.items[itemIndex].message = 'Conflict detected in field: name';
          
          if (!job.conflicts) job.conflicts = [];
          job.conflicts.push({
            conflictId: `conflict_${Date.now()}_${i}`,
            productId: item.productId,
            dropId: item.dropId,
            field: 'name',
            productValue: 'Product Name',
            dropValue: 'Drop Name',
            resolution: undefined
          });

          job.state = 'conflict';
        } else {
          job.items[itemIndex].status = 'synced';
          job.items[itemIndex].message = 'Successfully synced';
        }

        job.progress = Math.round(((i + 1) / items.length) * 100);
        syncJobs.set(syncId, job);

        shopRealtimeEvents.emit('sync:progress', {
          syncId,
          progress: job.progress,
          state: job.state,
          currentItem: i + 1,
          totalItems: items.length
        });
      } catch (error: any) {
        job.items[itemIndex].status = 'failed';
        job.items[itemIndex].message = error.message || 'Sync failed';
        logger.error('Item sync failed', { syncId, item, error });
      }
    }
  }

  // Mark as completed if no conflicts
  if (job.state !== 'conflict') {
    job.state = 'completed';
    job.completedAt = new Date().toISOString();
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: 'Sync job completed successfully',
      level: 'info' as const
    });

    shopRealtimeEvents.emit('sync:completed', {
      syncId,
      itemCount: items.length
    });
  }

  syncJobs.set(syncId, job);
}

// Helper function to anonymize data (remove personal/user data)
function anonymizeData(data: any): any {
  const anonymized = { ...data };
  
  // Remove personal/user fields
  delete anonymized.userId;
  delete anonymized.user;
  delete anonymized.customerId;
  delete anonymized.customer;
  delete anonymized.orderHistory;
  delete anonymized.purchaseHistory;
  delete anonymized.email;
  delete anonymized.phone;
  delete anonymized.address;
  delete anonymized.personalInfo;
  delete anonymized.userData;
  
  // Keep only product-related data
  const allowedFields = [
    'id', 'name', 'description', 'price', 'images', 'variants', 
    'stock', 'category', 'tags', 'sku', 'status', 'createdAt', 'updatedAt'
  ];
  
  const cleaned: any = {};
  for (const field of allowedFields) {
    if (anonymized[field] !== undefined) {
      cleaned[field] = anonymized[field];
    }
  }
  
  return cleaned;
}

// POST /api/admin/shop/sync/anonymous - Anonymous sync
router.post('/sync/anonymous', [
  adminOnly,
  body('direction').isIn(['shop_to_drops', 'drops_to_shop', 'bidirectional']),
  body('options').optional().isObject(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid request', 
      details: errors.array() 
    });
  }

  const { direction, options } = req.body;
  const syncId = generateSyncId();

  logger.info('Anonymous sync initiated', { syncId, direction, options });

  // Create sync job with anonymization flags
  const syncJob = {
    syncId,
    state: 'pending' as const,
    progress: 0,
    startedAt: new Date().toISOString(),
    direction,
    anonymous: true,
    items: [],
    conflicts: [],
    stats: {
      itemsSynced: 0,
      itemsSkipped: 0,
      itemsFailed: 0,
      conflicts: 0
    },
    logs: [{
      timestamp: new Date().toISOString(),
      message: `Anonymous sync job created (${direction})`,
      level: 'info' as const
    }]
  };

  syncJobs.set(syncId, syncJob);

  // Emit realtime event
  shopRealtimeEvents.emit('sync:started', {
    syncId,
    anonymous: true,
    direction
  });

  // Process anonymous sync asynchronously
  processAnonymousSyncJob(syncId, direction, options || {}).catch((error) => {
    logger.error('Anonymous sync job failed', { syncId, error });
    const job = syncJobs.get(syncId);
    if (job) {
      job.state = 'failed';
      job.logs.push({
        timestamp: new Date().toISOString(),
        message: `Anonymous sync failed: ${error.message}`,
        level: 'error' as const
      });
      syncJobs.set(syncId, job);
      shopRealtimeEvents.emit('sync:failed', { syncId, error: error.message });
    }
  });

  res.json({
    success: true,
    syncId,
    status: syncJob
  });
}));

// Helper function to process anonymous sync job
async function processAnonymousSyncJob(syncId: string, direction: string, options: any) {
  const job = syncJobs.get(syncId);
  if (!job) return;

  job.state = 'in_progress';
  syncJobs.set(syncId, job);

  shopRealtimeEvents.emit('sync:progress', {
    syncId,
    progress: 0,
    state: 'in_progress',
    type: 'sync_progress'
  });

  try {
    // Simulate fetching products/drops and anonymizing
    // In production, this would fetch from database and apply anonymization
    const mockItems = Array.from({ length: 10 }, (_, i) => ({
      id: `item_${i}`,
      name: `Item ${i}`,
      type: i % 2 === 0 ? 'product' : 'drop'
    }));

    let processed = 0;
    for (let i = 0; i < mockItems.length; i++) {
      const item = mockItems[i];
      
      // Anonymize data
      const anonymized = anonymizeData(item);
      
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      processed++;
      job.stats.itemsSynced++;
      job.progress = Math.round((processed / mockItems.length) * 100);
      
      syncJobs.set(syncId, job);
      
      shopRealtimeEvents.emit('sync:progress', {
        syncId,
        progress: job.progress,
        state: 'in_progress',
        type: 'sync_progress'
      });
    }

    // Mark as completed
    job.state = 'completed';
    job.completedAt = new Date().toISOString();
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: `Anonymous sync completed: ${job.stats.itemsSynced} items synced`,
      level: 'info' as const
    });

    syncJobs.set(syncId, job);

    shopRealtimeEvents.emit('sync:completed', {
      syncId,
      stats: job.stats,
      type: 'sync_complete'
    });
  } catch (error: any) {
    job.state = 'failed';
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: `Anonymous sync failed: ${error.message}`,
      level: 'error' as const
    });
    syncJobs.set(syncId, job);
    
    shopRealtimeEvents.emit('sync:error', {
      syncId,
      message: error.message,
      type: 'sync_error'
    });
  }
}

// ==================== FRONTEND-BACKEND SYNC ====================

// POST /api/admin/sync/categories - Sync categories from frontend
router.post('/categories', [
  adminOnly,
  body('overwrite').optional().isBoolean(),
  body('skipDuplicates').optional().isBoolean(),
  body('dryRun').optional().isBoolean(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid request', 
      details: errors.array() 
    });
  }

  const { overwrite = false, skipDuplicates = true, dryRun = false } = req.body;

  try {
    // Import frontend categories
    const { categories: frontendCategories } = await import('@nebula/shared');
    
    if (!frontendCategories || !Array.isArray(frontendCategories)) {
      return res.status(400).json({
        success: false,
        error: 'Frontend categories not available or invalid format'
      });
    }

    const { getCategoryService } = await import('../../services/categoryService');
    const categoryService = getCategoryService();
    
    if (!categoryService) {
      return res.status(500).json({
        success: false,
        error: 'Category service not available'
      });
    }

    // Get existing categories
    const existingCategories = await categoryService.getCategories({ type: 'shop' });
    const existingMap = new Map(
      existingCategories.map((cat: any) => [cat.id, cat])
    );

    const result = {
      success: true,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ item: string; error: string }>,
      total: frontendCategories.length,
    };

    // Process each category
    for (const frontendCategory of frontendCategories) {
      try {
        const transformedCategory = {
          id: frontendCategory.id,
          slug: frontendCategory.slug || frontendCategory.id,
          name: frontendCategory.name,
          description: frontendCategory.description || '',
          icon: frontendCategory.icon || '📦',
          order: frontendCategory.order || 0,
          featured: frontendCategory.featured || false,
          type: 'shop',
        };

        const existing = existingMap.get(transformedCategory.id!);

        if (existing && skipDuplicates && !overwrite) {
          result.skipped++;
          continue;
        }

        if (dryRun) {
          if (existing) {
            result.updated++;
          } else {
            result.created++;
          }
          continue;
        }

        if (existing) {
          if (overwrite) {
            await categoryService.updateCategory(transformedCategory.id!, transformedCategory);
            result.updated++;
          } else {
            result.skipped++;
          }
        } else {
          await categoryService.createCategory(transformedCategory);
          result.created++;
        }
      } catch (error: any) {
        result.errors.push({
          item: frontendCategory.name || frontendCategory.id,
          error: error.message || 'Unknown error',
        });
        logger.error(`Failed to sync category: ${frontendCategory.name}`, { error });
      }
    }

    // Emit realtime event
    shopRealtimeEvents.emit('sync:categories_completed', {
      result,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Category sync failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync categories',
    });
  }
}));

// POST /api/admin/sync/products - Sync products from frontend
router.post('/products', [
  adminOnly,
  body('overwrite').optional().isBoolean(),
  body('skipDuplicates').optional().isBoolean(),
  body('dryRun').optional().isBoolean(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid request', 
      details: errors.array() 
    });
  }

  const { overwrite = false, skipDuplicates = true, dryRun = false } = req.body;

  try {
    // Import frontend products
    const { products: frontendProducts } = await import('@nebula/shared');
    
    if (!frontendProducts || !Array.isArray(frontendProducts)) {
      return res.status(400).json({
        success: false,
        error: 'Frontend products not available or invalid format'
      });
    }

    const { getProductService } = await import('../../services/productService');
    const productService = getProductService();
    
    if (!productService) {
      return res.status(500).json({
        success: false,
        error: 'Product service not available'
      });
    }

    // Get existing products
    const existingProducts = await productService.getProducts({ limit: 10000 });
    const existingById = new Map(
      existingProducts.map((prod: any) => [prod.id, prod])
    );
    const existingBySku = new Map(
      existingProducts.map((prod: any) => [prod.sku, prod])
    );

    const result = {
      success: true,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ item: string; error: string }>,
      total: frontendProducts.length,
    };

    // Process each product
    for (const frontendProduct of frontendProducts) {
      try {
        const transformedProduct = {
          id: frontendProduct.id,
          name: frontendProduct.name,
          categoryId: frontendProduct.categoryId,
          sku: frontendProduct.sku || `SKU-${frontendProduct.id}`,
          description: frontendProduct.description || '',
          price: frontendProduct.price || 0,
          currency: frontendProduct.currency || 'EUR',
          inventory: frontendProduct.inventory || 0,
          status: frontendProduct.inventory > 0 ? 'active' : 'inactive',
          featured: frontendProduct.isNew || frontendProduct.featured || false,
          access: frontendProduct.access || 'standard',
          type: 'shop',
          variants: frontendProduct.variants || [],
          media: frontendProduct.media || [],
          badges: frontendProduct.badges || [],
        };

        const existingProductById = existingById.get(transformedProduct.id!);
        const existingProductBySku = transformedProduct.sku 
          ? existingBySku.get(transformedProduct.sku)
          : null;

        if ((existingProductById || existingProductBySku) && skipDuplicates && !overwrite) {
          result.skipped++;
          continue;
        }

        if (dryRun) {
          if (existingProductById || existingProductBySku) {
            result.updated++;
          } else {
            result.created++;
          }
          continue;
        }

        if (existingProductById) {
          if (overwrite) {
            await productService.updateProduct(transformedProduct.id!, transformedProduct);
            result.updated++;
          } else {
            result.skipped++;
          }
        } else if (existingProductBySku) {
          if (overwrite) {
            await productService.updateProduct(existingProductBySku.id, transformedProduct);
            result.updated++;
          } else {
            result.skipped++;
          }
        } else {
          await productService.createProduct(transformedProduct);
          result.created++;
        }
      } catch (error: any) {
        result.errors.push({
          item: frontendProduct.name || frontendProduct.id,
          error: error.message || 'Unknown error',
        });
        logger.error(`Failed to sync product: ${frontendProduct.name}`, { error });
      }
    }

    // Emit realtime event
    shopRealtimeEvents.emit('sync:products_completed', {
      result,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Product sync failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync products',
    });
  }
}));

export default router;


