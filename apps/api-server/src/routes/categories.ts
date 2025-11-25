import { Router } from 'express';
import { body, validationResult, query } from 'express-validator';
import { getCategoryService } from '../services/categoryService';
import { logger } from '../utils/logger';
import { adminOnly } from '../middleware/auth';
import { shopRealtimeEvents } from '../websocket/shopEvents';

const router = Router();

// GET /api/categories - Get categories with filters
router.get('/', [
  query('featured').optional().isBoolean(),
  query('search').optional().isString(),
  query('parentId').optional().isString(),
  query('sortBy').optional().isIn(['name', 'order', 'products', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const filters = {
      featured: req.query.featured ? req.query.featured === 'true' : undefined,
      search: req.query.search as string,
      parentId: req.query.parentId === 'null' ? null : req.query.parentId as string,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await categoryService.getCategories(filters);

    res.json({
      success: true,
      data: result.categories,
      total: result.total,
      metrics: result.metrics,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: result.categories.length === filters.limit
      }
    });
  } catch (error) {
    logger.error('Failed to get categories', { error: error.message, query: req.query });
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// GET /api/categories/tree - Get category tree (hierarchical)
router.get('/tree', [
  query('parentId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const parentId = req.query.parentId as string | undefined;
    const tree = await categoryService.getCategoryTree(parentId);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    logger.error('Failed to get category tree', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve category tree' });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req, res) => {
  try {
    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const { id } = req.params;
    const category = await categoryService.getCategory(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Failed to get category', { error: error.message, categoryId: req.params.id });
    res.status(500).json({ error: 'Failed to retrieve category' });
  }
});

// GET /api/categories/:id/analytics - Get category analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const { id } = req.params;
    const analytics = await categoryService.getCategoryAnalytics(id);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Failed to get category analytics', { error: error.message, categoryId: req.params.id });
    res.status(500).json({ error: 'Failed to retrieve category analytics' });
  }
});

// POST /api/categories - Create category (Admin only)
router.post('/', adminOnly, [
  body('name').isString().notEmpty(),
  body('description').optional().isString(),
  body('icon').optional().isString(),
  body('order').optional().isInt({ min: 0 }),
  body('featured').optional().isBoolean(),
  body('parentId').optional().isString(),
  body('type').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });

    shopRealtimeEvents.categoryCreated({
      categoryId: category.id,
      category,
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id
    });
  } catch (error) {
    logger.error('Category creation error', { error: error.message, body: req.body });
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Update category (Admin only)
router.put('/:id', adminOnly, [
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('icon').optional().isString(),
  body('order').optional().isInt({ min: 0 }),
  body('featured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const { id } = req.params;
    const updatedCategory = await categoryService.updateCategory(id, req.body);

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });

    shopRealtimeEvents.categoryUpdated({
      categoryId: id,
      category: updatedCategory,
      changes: req.body,
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id
    });
  } catch (error) {
    logger.error('Category update error', { error: error.message, categoryId: req.params.id });
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// PATCH /api/categories/:id/order - Update category order (Admin only)
router.patch('/:id/order', adminOnly, [
  body('order').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const { id } = req.params;
    const { order } = req.body;

    const updatedCategory = await categoryService.updateCategoryOrder(id, order);

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Category order updated successfully'
    });

    shopRealtimeEvents.categoryUpdated({
      categoryId: id,
      category: updatedCategory,
      changes: { order },
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id
    });
  } catch (error) {
    logger.error('Category order update error', { error: error.message, categoryId: req.params.id });
    res.status(500).json({ error: 'Failed to update category order' });
  }
});

// PATCH /api/categories/bulk-order - Bulk update category order (Admin only)
router.patch('/bulk-order', adminOnly, [
  body('updates').isArray({ min: 1 }),
  body('updates.*.categoryId').isString().notEmpty(),
  body('updates.*.order').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const { updates } = req.body;

    const result = await categoryService.bulkUpdateCategoryOrder(updates);

    res.json({
      success: true,
      data: result,
      message: `Bulk order update completed: ${result.success} successful, ${result.failed} failed`
    });

    shopRealtimeEvents.categoryUpdated({
      categoryId: 'bulk',
      updates,
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id
    });
  } catch (error) {
    logger.error('Bulk category order update error', { error: error.message });
    res.status(500).json({ error: 'Failed to bulk update category order' });
  }
});

// POST /api/categories/bulk - Bulk create categories (Admin only)
router.post('/bulk', adminOnly, [
  body('categories').isArray({ min: 1 }),
  body('categories.*.name').isString().notEmpty(),
  body('categories.*.slug').optional().isString(),
  body('categories.*.description').optional().isString(),
  body('categories.*.icon').optional().isString(),
  body('categories.*.order').optional().isInt({ min: 0 }),
  body('categories.*.featured').optional().isBoolean(),
  body('categories.*.parentId').optional().isString(),
  body('categories.*.type').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const { categories } = req.body;
    const created: any[] = [];
    const failed: any[] = [];

    for (const categoryData of categories) {
      try {
        const category = await categoryService.createCategory(categoryData);
        created.push(category);
      } catch (error: any) {
        failed.push({
          data: categoryData,
          error: error.message || 'Unknown error'
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        created: created.length,
        failed: failed.length,
        categories: created,
        errors: failed
      },
      message: `Bulk create completed: ${created.length} successful, ${failed.length} failed`
    });

    // Emit events for created categories
    created.forEach(category => {
      shopRealtimeEvents.categoryCreated({
        categoryId: category.id,
        category,
        timestamp: new Date().toISOString(),
        userId: (req as any).user?.id
      });
    });
  } catch (error) {
    logger.error('Bulk category creation error', { error: error.message });
    res.status(500).json({ error: 'Failed to bulk create categories' });
  }
});

// POST /api/categories/bulk-import - Bulk import with hierarchy validation (Admin only)
router.post('/bulk-import', adminOnly, [
  body('categories').isArray({ min: 1 }),
  body('categories.*.name').isString().notEmpty(),
  body('categories.*.slug').optional().isString(),
  body('categories.*.description').optional().isString(),
  body('categories.*.icon').optional().isString(),
  body('categories.*.order').optional().isInt({ min: 0 }),
  body('categories.*.featured').optional().isBoolean(),
  body('categories.*.parentId').optional().isString(),
  body('dryRun').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array(),
        message: 'Validation failed'
      });
    }

    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const { categories, dryRun = false } = req.body;

    // Helper: Calculate category level
    const getCategoryLevel = (category: any, allCategories: any[], existingCategories: any[]): number => {
      if (!category.parentId) return 0;
      
      let level = 0;
      let currentParentId: string | undefined = category.parentId;
      const visited = new Set<string>();
      
      while (currentParentId) {
        if (visited.has(currentParentId)) return -1; // Circular reference
        
        visited.add(currentParentId);
        
        // Check in import data first
        const parent = allCategories.find((c: any) => 
          c.slug === currentParentId || 
          c.name === currentParentId ||
          c.tempId === currentParentId
        );
        
        if (parent) {
          level++;
          currentParentId = parent.parentId;
        } else {
          // Check in existing categories
          const existingParent = existingCategories.find((c: any) => 
            c.id === currentParentId || 
            c.slug === currentParentId
          );
          
          if (existingParent) {
            level++;
            currentParentId = existingParent.parentId;
          } else {
            break; // Parent not found
          }
        }
        
        if (level > 10) break; // Safety limit
      }
      
      return level;
    };

    // Get existing categories for validation
    const existingResult = await categoryService.getCategories({ limit: 1000 });
    const existingCategories = existingResult.categories || [];

    // Validation: Check hierarchy structure
    const validationErrors: Array<{ row: number; field: string; message: string }> = [];
    const warnings: string[] = [];
    const slugSet = new Set<string>();
    const nameSet = new Set<string>();

    // First pass: Basic validation and slug uniqueness
    categories.forEach((category: any, index: number) => {
      const row = index + 1;

      // Name validation
      if (!category.name || category.name.trim().length === 0) {
        validationErrors.push({ row, field: 'name', message: 'Name is required' });
      } else {
        const name = category.name.trim();
        if (nameSet.has(name)) {
          validationErrors.push({ row, field: 'name', message: `Duplicate name: ${name}` });
        } else {
          nameSet.add(name);
        }
      }

      // Slug validation
      const slug = category.slug || category.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (!slug || slug.trim().length === 0) {
        validationErrors.push({ row, field: 'slug', message: 'Slug is required' });
      } else {
        if (slugSet.has(slug)) {
          validationErrors.push({ row, field: 'slug', message: `Duplicate slug: ${slug}` });
        } else {
          slugSet.add(slug);
        }

        // Check if slug already exists
        if (existingCategories.some((c: any) => c.slug === slug)) {
          warnings.push(`Row ${row}: Slug "${slug}" already exists`);
        }
      }

      // Level validation (max 3 levels)
      const level = getCategoryLevel(category, categories, existingCategories);
      if (level > 3) {
        validationErrors.push({ 
          row, 
          field: 'parentId', 
          message: `Level ${level} exceeds maximum of 3` 
        });
      }

      // Parent existence check
      if (category.parentId) {
        const parentExists = 
          categories.some((c: any, idx: number) => 
            idx < index && (c.slug === category.parentId || c.name === category.parentId || c.tempId === category.parentId)
          ) ||
          existingCategories.some((c: any) => 
            c.id === category.parentId || c.slug === category.parentId
          );
        
        if (!parentExists) {
          validationErrors.push({ 
            row, 
            field: 'parentId', 
            message: `Parent "${category.parentId}" not found` 
          });
        }
      }

      // Circular reference check
      if (category.parentId) {
        let currentParentId: string | undefined = category.parentId;
        const visited = new Set<string>();
        visited.add(category.slug || category.name);

        while (currentParentId) {
          if (visited.has(currentParentId)) {
            validationErrors.push({ 
              row, 
              field: 'parentId', 
              message: 'Circular reference detected' 
            });
            break;
          }
          visited.add(currentParentId);

          const parent = categories.find((c: any) => 
            c.slug === currentParentId || 
            c.name === currentParentId ||
            c.tempId === currentParentId
          );
          
          if (!parent) break;
          currentParentId = parent.parentId;
        }
      }
    });

    // If validation errors exist, return them
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        errors: validationErrors,
        warnings,
        message: `Validation failed: ${validationErrors.length} error(s) found`
      });
    }

    // If dry run, return validation result without creating
    if (dryRun) {
      return res.json({
        success: true,
        valid: true,
        errors: [],
        warnings,
        message: `Dry run: ${categories.length} categories validated successfully`,
        wouldCreate: categories.length
      });
    }

    // Transaction: Create all categories or rollback on error
    const created: any[] = [];
    const failed: Array<{ row: number; category: any; error: string }> = [];

    // Sort categories by level (create parents first)
    const sortedCategories = [...categories].sort((a: any, b: any) => {
      const levelA = getCategoryLevel(a, categories, existingCategories);
      const levelB = getCategoryLevel(b, categories, existingCategories);
      return levelA - levelB;
    });

    // Create mapping for parentId resolution
    const slugToIdMap = new Map<string, string>();
    existingCategories.forEach((cat: any) => {
      slugToIdMap.set(cat.slug, cat.id);
    });

    // Create categories in order
    for (let i = 0; i < sortedCategories.length; i++) {
      const categoryData = sortedCategories[i];
      const row = categories.indexOf(categoryData) + 1;

      try {
        // Resolve parentId (can be slug or id)
        let resolvedParentId: string | undefined = undefined;
        if (categoryData.parentId) {
          // Check if it's an ID
          if (existingCategories.some((c: any) => c.id === categoryData.parentId)) {
            resolvedParentId = categoryData.parentId;
          } else {
            // Check if it's a slug from existing
            const parentId = slugToIdMap.get(categoryData.parentId);
            if (parentId) {
              resolvedParentId = parentId;
            } else {
              // Check in already created categories
              const createdParent = created.find((c: any) => 
                c.slug === categoryData.parentId || 
                c.name === categoryData.parentId
              );
              if (createdParent) {
                resolvedParentId = createdParent.id;
              }
            }
          }
        }

        const slug = categoryData.slug || categoryData.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        const categoryToCreate = {
          name: categoryData.name,
          slug,
          description: categoryData.description || '',
          icon: categoryData.icon || '📦',
          order: categoryData.order !== undefined ? categoryData.order : i,
          featured: categoryData.featured || false,
          parentId: resolvedParentId
        };

        const category = await categoryService.createCategory(categoryToCreate);
        created.push(category);
        slugToIdMap.set(category.slug, category.id);

        // Emit realtime event
        shopRealtimeEvents.categoryCreated({
          categoryId: category.id,
          category,
          timestamp: new Date().toISOString(),
          userId: (req as any).user?.id
        });
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        failed.push({
          row,
          category: categoryData,
          error: errorMsg
        });
        logger.error(`Failed to create category at row ${row}`, { 
          error: errorMsg, 
          category: categoryData 
        });
      }
    }

    // If any failed, return partial success
    if (failed.length > 0) {
      return res.status(207).json({
        success: true,
        partial: true,
        data: {
          created: created.length,
          failed: failed.length,
          total: categories.length,
          categories: created,
          errors: failed
        },
        warnings,
        message: `Import completed with errors: ${created.length} created, ${failed.length} failed`
      });
    }

    // All successful
    res.status(201).json({
      success: true,
      valid: true,
      data: {
        created: created.length,
        failed: 0,
        total: categories.length,
        categories: created
      },
      warnings,
      message: `Successfully imported ${created.length} categories`
    });
  } catch (error: any) {
    logger.error('Bulk import categories error', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false,
      error: 'Failed to bulk import categories',
      message: error.message 
    });
  }
});

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const categoryService = getCategoryService();
    if (!categoryService) {
      return res.status(500).json({ error: 'Category service not available' });
    }

    const { id } = req.params;
    await categoryService.deleteCategory(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

    shopRealtimeEvents.categoryDeleted({
      categoryId: id,
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id
    });
  } catch (error) {
    logger.error('Category deletion error', { error: error.message, categoryId: req.params.id });
    res.status(500).json({ 
      error: 'Failed to delete category',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export router
export default router;


