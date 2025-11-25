import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getProductService } from '../services/productService';
import { logger } from '../utils/logger';
import { cartUpdateRateLimit } from '../middleware/rateLimit';
import { sanitizeBody, checkoutItemValidation } from '../middleware/sanitize';

const router = Router();

// Apply sanitization to all routes
router.use(sanitizeBody);

// Types for API requests/responses
interface CartItem {
  id: string;
  type: 'shop' | 'drop';
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image?: string;
  maxQuantity?: number;
  stock?: number;
  inviteRequired?: boolean;
}

interface CartResponse {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  currency: string;
}

// GET /api/cart - Get current cart
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // In production, get cart from database
    // For demo, return empty cart
    const cartResponse: CartResponse = {
      items: [],
      totalItems: 0,
      totalPrice: 0,
      currency: 'EUR'
    };

    res.json(cartResponse);
  } catch (error) {
    console.error('Cart retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
});

// POST /api/cart/items - Add item to cart
router.post('/items', cartUpdateRateLimit, [
  body('type').isIn(['shop', 'drop']),
  body('name').isString().trim().isLength({ min: 1, max: 200 }),
  body('variant').isString().trim().isLength({ min: 1, max: 100 }),
  body('price').isNumeric().isFloat({ min: 0, max: 1000000 }),
  body('quantity').isInt({ min: 1, max: 100 }),
  body('userId').isString().trim().isLength({ min: 1, max: 100 }),
  body('inviteRequired').optional().isBoolean(),
  body('totalReferrals').optional().isInt({ min: 0, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, name, variant, price, quantity, userId, inviteRequired, totalReferrals, ...itemData } = req.body;

    // Serverseitige Invite-Validierung: Wenn Invite nötig, dann mindestens 1 Referral
    if (inviteRequired && (Number(totalReferrals) || 0) < 1) {
      return res.status(403).json({ error: 'Invite erforderlich: Mindestens 1 erfolgreiche Einladung notwendig' });
    }

    // Generate unique cart item ID
    const itemId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, save to database and update totals
    const cartItem: CartItem = {
      id: itemId,
      type,
      name,
      variant,
      price,
      quantity,
      ...itemData
    };

    // Update cart totals in database
    // For demo, just return success
    res.json({
      success: true,
      item: cartItem,
      message: 'Item added to cart'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/items/:itemId - Update cart item quantity
router.put('/items/:itemId', cartUpdateRateLimit, [
  body('quantity').isInt({ min: 0 }),
  body('userId').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId } = req.params;
    const { quantity, userId } = req.body;

    if (quantity === 0) {
      // Remove item if quantity is 0
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    // In production, update item in database
    res.json({
      success: true,
      itemId,
      quantity,
      message: 'Item quantity updated'
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/items/:itemId - Remove item from cart
router.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // In production, remove item from database
    res.json({
      success: true,
      itemId,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // In production, clear user's cart in database
    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// POST /api/cart/validate - Validate cart items (prices, stock, availability)
router.post('/validate', cartUpdateRateLimit, [
  body('userId').isString().trim().isLength({ min: 1, max: 100 }),
  ...checkoutItemValidation,
  body('items.*.type').isIn(['shop', 'drop'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, userId } = req.body;
    
    // Validate items array exists and is not empty
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        validated: false,
        items: [],
        serverTotalPrice: 0,
        errors: [{ itemId: '', field: 'cart', message: 'Warenkorb ist leer' }],
        warnings: []
      });
    }
    
    const productService = getProductService();
    const validationErrors: Array<{ itemId: string; field: string; message: string }> = [];
    const allWarnings: string[] = [];
    const validatedItems: CartItem[] = [];
    let serverTotalPrice = 0;

    // Validate each item in parallel for better performance
    const validationPromises = items.map(async (item) => {
      try {
        // For shop items, validate against product database
        if (item.type === 'shop') {
          // If product service is not available, skip validation but log warning
          if (!productService) {
            logger.warn('Product service not available, skipping product validation', { itemName: item.name });
            // Allow item but add warning
            return { item, errors: [], warnings: [] };
          }
          
          // Try to find product by name (in production, use productId)
          try {
            // Use Promise.race to timeout product lookup after 2 seconds
            const productLookupPromise = productService.getProducts({ search: item.name, limit: 1 });
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Product lookup timeout')), 2000)
            );
            
            const products = await Promise.race([productLookupPromise, timeoutPromise]) as any;
            const product = products?.products?.[0];
            
            const itemErrors: Array<{ itemId: string; field: string; message: string }> = [];
            const itemWarnings: string[] = [];
            let validatedItem = { ...item };

            if (product) {
              // Validate price - allow small tolerance for rounding (0.01 EUR)
              const priceDiff = Math.abs(product.price - item.price);
              if (priceDiff > 0.01) {
                itemErrors.push({
                  itemId: item.id,
                  field: 'price',
                  message: `Preis geändert: Erwartet ${product.price.toFixed(2)}€, erhalten ${item.price.toFixed(2)}€`
                });
                // Use server price
                validatedItem.price = product.price;
              }

              // Validate stock with optimistic locking check
              const requestedQuantity = item.quantity;
              const availableStock = product.inventory;
              
              if (availableStock < requestedQuantity) {
                itemErrors.push({
                  itemId: item.id,
                  field: 'stock',
                  message: `Nicht genug Lagerbestand: Verfügbar ${availableStock}, angefordert ${requestedQuantity}`
                });
              } else if (availableStock < 5 && availableStock >= requestedQuantity) {
                // Warning for low stock (but still available) - don't block checkout
                itemWarnings.push(`Niedriger Lagerbestand: Nur noch ${availableStock} verfügbar`);
              }

              // Check if product is active
              if (product.status !== 'active') {
                itemErrors.push({
                  itemId: item.id,
                  field: 'status',
                  message: `Produkt ist nicht verfügbar (Status: ${product.status})`
                });
              }

              // Validate variant if product has variants
              if (product.variants && product.variants.length > 0) {
                const variantExists = product.variants.some(v => 
                  v.options?.some(opt => opt.label === item.variant || opt.id === item.variant)
                );
                if (!variantExists) {
                  itemErrors.push({
                    itemId: item.id,
                    field: 'variant',
                    message: `Variante "${item.variant}" existiert nicht für dieses Produkt`
                  });
                }
              }
            } else {
              // Product not found - log warning but allow (might be new product or cache issue)
              logger.warn('Product not found during cart validation', { itemName: item.name, itemId: item.id, type: item.type });
              // Don't block checkout - product might exist but search failed
            }
            
            return { item: validatedItem, errors: itemErrors, warnings: itemWarnings };
          } catch (productError: any) {
            // If product lookup fails or times out, don't block checkout
            logger.warn('Product lookup failed during validation', { 
              error: productError?.message, 
              itemName: item.name, 
              itemId: item.id 
            });
            // Allow item to proceed
            return { item, errors: [], warnings: [] };
          }
        } else {
          // Drop items - basic validation only (price, quantity)
          const itemErrors: Array<{ itemId: string; field: string; message: string }> = [];
          if (item.price <= 0) {
            itemErrors.push({
              itemId: item.id,
              field: 'price',
              message: `Ungültiger Preis für Drop-Item: ${item.price}`
            });
          }
          if (item.quantity <= 0 || item.quantity > 100) {
            itemErrors.push({
              itemId: item.id,
              field: 'quantity',
              message: `Ungültige Menge für Drop-Item: ${item.quantity}`
            });
          }
          return { item, errors: itemErrors, warnings: [] };
        }

        // If we get here, item is valid
        return { item, errors: [], warnings: [] };
      } catch (itemError: any) {
        logger.error('Error validating cart item', { error: itemError?.message, itemId: item.id });
        return {
          item,
          errors: [{
            itemId: item.id,
            field: 'validation',
            message: 'Fehler bei der Validierung dieses Artikels'
          }],
          warnings: []
        };
      }
    });

    // Wait for all validations to complete (with timeout)
    const validationResults = await Promise.allSettled(validationPromises);
    
    // Process results
    validationResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { item, errors, warnings } = result.value;
        validatedItems.push(item);
        serverTotalPrice += item.price * item.quantity;
        validationErrors.push(...errors);
        if (warnings && warnings.length > 0) {
          allWarnings.push(...warnings);
        }
      } else {
        // If validation failed completely, allow item anyway
        const item = items[index];
        if (item) {
          validatedItems.push(item);
          serverTotalPrice += item.price * item.quantity;
        }
        logger.warn('Item validation promise rejected', { itemId: item?.id, error: result.reason });
      }
    });

    // Separate critical errors from warnings
    // Stock errors are warnings if stock is still available
    const criticalErrors = validationErrors.filter(e => 
      e.field !== 'stock' || !e.message.includes('Niedriger Lagerbestand')
    );

    // Return validation result - always allow checkout
    res.json({
      success: true, // Always allow checkout
      validated: true,
      items: validatedItems,
      serverTotalPrice: Math.round(serverTotalPrice * 100) / 100, // Round to 2 decimals
      errors: criticalErrors,
      warnings: allWarnings.length > 0 ? allWarnings : []
    });
  } catch (error: any) {
    logger.error('Cart validation error:', error);
    
    // Return a valid response structure even on error
    // This prevents the client from crashing
    res.status(500).json({ 
      success: false,
      validated: false,
      items: items || [],
      serverTotalPrice: items?.reduce((sum: number, i: any) => sum + (Number(i.price) * Number(i.quantity)), 0) || 0,
      errors: [{ 
        itemId: '', 
        field: 'validation', 
        message: error?.message || 'Fehler bei der Cart-Validierung' 
      }],
      warnings: []
    });
  }
});

// Export router
export default router;


