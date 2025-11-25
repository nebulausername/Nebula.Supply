import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminOnly } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { shopRealtimeEvents } from '../../websocket/shopEvents';

const router = Router();

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

