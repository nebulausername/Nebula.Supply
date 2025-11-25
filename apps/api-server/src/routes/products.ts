import { Router } from 'express';
import { body, validationResult, query } from 'express-validator';
import { getProductService } from '../services/productService';
import { logger } from '../utils/logger';
import { adminOnly } from '../middleware/auth';
import { shopRealtimeEvents } from '../websocket/shopEvents';

const router = Router();

// Helper function to generate products for a category (inline implementation)
function generateProductsForCategoryInline(options: {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryDescription?: string;
  count?: number;
}): any[] {
  const {
    categoryId,
    categoryName,
    categoryIcon = '📦',
    categoryDescription = '',
    count = 2 + Math.floor(Math.random() * 2), // 2-3 products
  } = options;

  // Determine base price based on category
  const name = categoryName.toLowerCase();
  let basePrice = 80; // Default
  if (name.includes('sneaker') || name.includes('schuh') || name.includes('shoe')) {
    basePrice = 120;
  } else if (name.includes('kleidung') || name.includes('clothing') || name.includes('jacke') || name.includes('hoodie')) {
    basePrice = 80;
  } else if (name.includes('accessoire') || name.includes('accessory') || name.includes('uhr') || name.includes('watch')) {
    basePrice = 150;
  } else if (name.includes('tasche') || name.includes('bag') || name.includes('rucksack')) {
    basePrice = 100;
  } else if (name.includes('tech') || name.includes('smartphone')) {
    basePrice = 50;
  }

  const products: any[] = [];
  const suffixes = ['Pro', 'Premium', 'Classic', 'Elite', 'Standard'];
  const colors = ['Schwarz', 'Weiß', 'Grau', 'Blau', 'Rot'];

  for (let i = 0; i < count; i++) {
    const productName = i === 0 
      ? `${categoryName} ${suffixes[0]}`
      : i === 1
      ? `${categoryName} ${colors[i - 1]}`
      : `${categoryName} ${suffixes[i % suffixes.length]} ${colors[i % colors.length]}`;
    
    const price = basePrice + (Math.random() * 50 - 25);
    const categoryPrefix = categoryName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 3);
    const sku = `${categoryPrefix}-${String(i + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;

    const descriptions = [
      `Premium ${categoryName.toLowerCase()} mit hochwertigen Materialien und zeitlosem Design.`,
      `Exklusives ${categoryName.toLowerCase()} mit besonderen Details und moderner Ästhetik.`,
      `Hochwertiges ${categoryName.toLowerCase()} für den anspruchsvollen Geschmack.`,
    ];

    const hasSizes = name.includes('sneaker') || name.includes('schuh') || name.includes('shoe') || 
                     name.includes('kleidung') || name.includes('clothing');

    const variants: any[] = [
      {
        type: 'color',
        name: 'Farbe',
        options: [
          { id: 'col-black', label: 'Schwarz', value: 'black', swatch: '#111827' },
          { id: 'col-white', label: 'Weiß', value: 'white', swatch: '#FFFFFF' },
          { id: 'col-grey', label: 'Grau', value: 'grey', swatch: '#6B7280' },
        ],
      },
    ];

    if (hasSizes) {
      variants.push({
        type: 'size',
        name: 'Größe',
        options: [
          { id: 'size-40', label: '40', value: '40' },
          { id: 'size-41', label: '41', value: '41' },
          { id: 'size-42', label: '42', value: '42' },
          { id: 'size-43', label: '43', value: '43' },
          { id: 'size-44', label: '44', value: '44' },
        ],
      });
    }

    products.push({
      name: productName,
      categoryId,
      sku,
      description: descriptions[i % descriptions.length] + (categoryDescription ? ` ${categoryDescription}` : ''),
      price: Math.round(price * 100) / 100,
      currency: 'EUR',
      inventory: Math.floor(Math.random() * 50) + 10, // 10-60 stock
      status: 'active',
      featured: i === 0,
      access: 'standard',
      type: 'shop',
      variants,
      media: [{
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop&crop=center',
        alt: productName,
      }],
      badges: i === 0 ? ['Neu'] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return products;
}

// GET /api/products - Get products with filters
router.get('/', [
  query('status').optional().isString(),
  query('categoryId').optional().isString(),
  query('search').optional().isString(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('featured').optional().isBoolean(),
  query('access').optional().isString(),
  query('type').optional().isString(),
  query('inStock').optional().isBoolean(),
  query('lowStock').optional().isBoolean(),
  query('sortBy').optional().isIn(['name', 'price', 'inventory', 'createdAt', 'updatedAt', 'popularity']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productService = getProductService();
    if (!productService) {
      return res.status(500).json({ error: 'Product service not available' });
    }

    const filters = {
      status: req.query.status ? req.query.status.toString().split(',') : undefined,
      categoryId: req.query.categoryId as string,
      search: req.query.search as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      featured: req.query.featured ? req.query.featured === 'true' : undefined,
      access: req.query.access ? req.query.access.toString().split(',') : undefined,
      type: req.query.type ? req.query.type.toString().split(',') : undefined,
      inStock: req.query.inStock ? req.query.inStock === 'true' : undefined,
      lowStock: req.query.lowStock ? req.query.lowStock === 'true' : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await productService.getProducts(filters);

    res.json({
      success: true,
      data: result.products,
      total: result.total,
      metrics: result.metrics,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: result.products.length === filters.limit
      }
    });
  } catch (error) {
    logger.error('Failed to get products', { error: error.message, query: req.query });
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const productService = getProductService();
    if (!productService) {
      return res.status(500).json({ error: 'Product service not available' });
    }

    const { id } = req.params;
    const product = await productService.getProduct(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Failed to get product', { error: error.message, productId: req.params.id });
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// POST /api/products - Create product (Admin only)
router.post('/', adminOnly, [
  body('name').isString().notEmpty(),
  body('categoryId').isString().notEmpty(),
  body('sku').optional().isString(),
  body('description').optional().isString(),
  body('price').isNumeric().isFloat({ min: 0 }),
  body('currency').optional().isString(),
  body('inventory').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'draft', 'archived']),
  body('type').optional().isIn(['shop', 'drop']),
  body('featured').optional().isBoolean(),
  body('access').optional().isIn(['free', 'limited', 'vip', 'standard'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productService = getProductService();
    if (!productService) {
      return res.status(500).json({ error: 'Product service not available' });
    }

    const product = await productService.createProduct(req.body);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });

    shopRealtimeEvents.productCreated({
      productId: product.id,
      product,
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id
    });
  } catch (error) {
    logger.error('Product creation error', { error: error.message, body: req.body });
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', adminOnly, [
  body('name').optional().isString(),
  body('categoryId').optional().isString(),
  body('sku').optional().isString(),
  body('description').optional().isString(),
  body('price').optional().isNumeric().isFloat({ min: 0 }),
  body('inventory').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'draft', 'archived']),
  body('featured').optional().isBoolean(),
  body('access').optional().isIn(['free', 'limited', 'vip', 'standard'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productService = getProductService();
    if (!productService) {
      return res.status(500).json({ error: 'Product service not available' });
    }

    const { id } = req.params;
    const updatedProduct = await productService.updateProduct(id, req.body);

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });

    shopRealtimeEvents.productUpdated({
      productId: id,
      product: updatedProduct,
      changes: req.body,
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id
    });
  } catch (error) {
    logger.error('Product update error', { error: error.message, productId: req.params.id });
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const productService = getProductService();
    if (!productService) {
      return res.status(500).json({ error: 'Product service not available' });
    }

    const { id } = req.params;
    await productService.deleteProduct(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

    shopRealtimeEvents.productDeleted({
      productId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Product deletion error', { error: error.message, productId: req.params.id });
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// PATCH /api/products/:id/variants - Update product variants (Admin only)
router.patch('/:id/variants', adminOnly, [
  body('variants').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productService = getProductService();
    if (!productService) {
      return res.status(500).json({ error: 'Product service not available' });
    }

    const { id } = req.params;
    const { variants } = req.body;

    const updatedProduct = await productService.updateProductVariants(id, variants);

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product variants updated successfully'
    });

    shopRealtimeEvents.productUpdated({
      productId: id,
      product: updatedProduct,
      changes: { variants },
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id
    });
  } catch (error) {
    logger.error('Product variants update error', { error: error.message, productId: req.params.id });
    res.status(500).json({ error: 'Failed to update product variants' });
  }
});

// PATCH /api/products/:id/variant-stock - Update variant stock (Admin only)
router.patch('/:id/variant-stock', adminOnly, [
  body('variantStocks').isArray({ min: 1 }),
  body('variantStocks.*.variantId').isString().notEmpty(),
  body('variantStocks.*.stock').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productService = getProductService();
    if (!productService) {
      return res.status(500).json({ error: 'Product service not available' });
    }

    const { id } = req.params;
    const { variantStocks } = req.body;

    const updatedProduct = await productService.updateVariantStock(id, variantStocks);

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Variant stock updated successfully'
    });

    const timestamp = new Date().toISOString();
    shopRealtimeEvents.productUpdated({
      productId: id,
      product: updatedProduct,
      changes: { variantStocks },
      timestamp,
      userId: (req as any).user?.id
    });
  } catch (error) {
    logger.error('Variant stock update error', { error: error.message, productId: req.params.id });
    res.status(500).json({ error: 'Failed to update variant stock' });
  }
});

// POST /api/products/:id/images - Upload product images (Admin only)
router.post('/:id/images', adminOnly, [
  body('images').isArray({ min: 1 }),
  body('images.*.url').isString().notEmpty(),
  body('images.*.alt').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productService = getProductService();
    if (!productService) {
      return res.status(500).json({ error: 'Product service not available' });
    }

    const { id } = req.params;
    const { images } = req.body;

    const updatedProduct = await productService.uploadProductImages(id, images);

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product images uploaded successfully'
    });
  } catch (error) {
    logger.error('Product image upload error', { error: error.message, productId: req.params.id });
    res.status(500).json({ error: 'Failed to upload product images' });
  }
});

// POST /api/products/bulk - Bulk import products (Admin only)
router.post('/bulk', adminOnly, [
  body('products').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productService = getProductService();
    if (!productService) {
      return res.status(500).json({ error: 'Product service not available' });
    }

    const { products } = req.body;

    const result = await productService.bulkImportProducts(products);

    res.json({
      success: true,
      data: result,
      message: `Bulk import completed: ${result.success} successful, ${result.failed} failed`
    });
  } catch (error) {
    logger.error('Bulk product import error', { error: error.message });
    res.status(500).json({ error: 'Failed to bulk import products' });
  }
});

// POST /api/products/bulk-generate - Generate products for categories (Admin only)
router.post('/bulk-generate', adminOnly, [
  body('categories').isArray({ min: 1 }),
  body('categories.*.id').isString().notEmpty(),
  body('categories.*.name').isString().notEmpty(),
  body('categories.*.icon').optional().isString(),
  body('categories.*.description').optional().isString(),
  body('count').optional().isInt({ min: 1, max: 10 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { categories, count = 2 } = req.body;
    const productService = getProductService();
    
    if (!productService) {
      return res.status(500).json({ 
        success: false,
        error: 'Product service not available' 
      });
    }

    const result = {
      success: true,
      created: 0,
      failed: 0,
      errors: [] as Array<{ category: string; error: string }>,
      products: [] as any[],
    };

    // Generate and create products for each category
    for (const category of categories) {
      try {
        // Generate products inline (since we can't import from admin package)
        const generatedProducts = generateProductsForCategoryInline({
          categoryId: category.id,
          categoryName: category.name,
          categoryIcon: category.icon,
          categoryDescription: category.description,
          count: count || (2 + Math.floor(Math.random() * 2)), // 2-3 products
        });

        // Create products
        for (const product of generatedProducts) {
          try {
            const createdProduct = await productService.createProduct(product);
            result.products.push(createdProduct);
            result.created++;
            
            // Emit realtime event
            shopRealtimeEvents.productCreated({
              productId: createdProduct.id,
              product: createdProduct,
              timestamp: new Date().toISOString(),
              userId: (req as any).user?.id
            });
          } catch (error: any) {
            result.failed++;
            result.errors.push({
              category: category.name,
              error: error.message || 'Unknown error',
            });
            logger.error(`Failed to create product for category ${category.name}`, { error, product });
          }
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          category: category.name,
          error: error.message || 'Unknown error',
        });
        logger.error(`Failed to generate products for category ${category.name}`, { error });
      }
    }

    res.json({
      success: result.success && result.failed === 0,
      data: result,
      message: `Generated ${result.created} products for ${categories.length} categories`
    });
  } catch (error: any) {
    logger.error('Bulk product generation error', { error: error.message });
    res.status(500).json({ 
      success: false,
      error: 'Failed to bulk generate products',
      message: error.message 
    });
  }
});

// POST /api/products/:id/duplicate - Duplicate product (Admin only)
router.post('/:id/duplicate', adminOnly, [
  body('newName').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productService = getProductService();
    if (!productService) {
      return res.status(500).json({ error: 'Product service not available' });
    }

    const { id } = req.params;
    const { newName } = req.body;

    const duplicatedProduct = await productService.duplicateProduct(id, newName);

    res.json({
      success: true,
      data: duplicatedProduct,
      message: 'Product duplicated successfully'
    });
  } catch (error) {
    logger.error('Product duplication error', { error: error.message, productId: req.params.id });
    res.status(500).json({ error: 'Failed to duplicate product' });
  }
});

// Export router
export default router;


