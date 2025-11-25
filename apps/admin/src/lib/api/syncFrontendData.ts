/**
 * Frontend-Backend Synchronisation
 * 
 * Synchronisiert Kategorien und Produkte vom Frontend (@nebula/shared) zum Backend
 */

import { logger } from '../logger';
import { categoriesApi, productsApi } from './ecommerce';
import { api } from './client';
import type { Category, Product } from './ecommerce';
import { 
  validateCategory, 
  sanitizeCategory, 
  validateCategories, 
  validateProductCategoryReferences,
  validateProduct,
  sanitizeProduct,
} from '../utils/frontendDataValidator';

// ==================== TYPES ====================

export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ item: string; error: string }>;
  total: number;
}

export interface SyncOptions {
  overwrite?: boolean; // Überschreibe existierende Items
  skipDuplicates?: boolean; // Überspringe Duplikate
  dryRun?: boolean; // Nur simulieren, keine Änderungen
}

// ==================== CATEGORY SYNC ====================

/**
 * Transform frontend category to backend format
 * Enhanced with validation and better field mapping
 */
function transformFrontendCategory(frontendCategory: any): Partial<Category> {
  // Validate category first
  const validation = validateCategory(frontendCategory, { strict: false });
  
  if (!validation.isValid && validation.errors.length > 0) {
    logger.warn('Invalid frontend category detected', {
      categoryId: frontendCategory.id,
      errors: validation.errors,
    });
  }

  if (validation.warnings.length > 0) {
    logger.debug('Category validation warnings', {
      categoryId: frontendCategory.id,
      warnings: validation.warnings,
    });
  }

  // Sanitize and transform
  const sanitized = sanitizeCategory(frontendCategory);

  // Enhanced transformation with all available fields
  return {
    ...sanitized,
    // Map subItems if available (for hierarchical categories)
    ...(frontendCategory.subItems && Array.isArray(frontendCategory.subItems) && {
      subItems: frontendCategory.subItems,
    }),
    // Map parentId if available
    ...(frontendCategory.parentId && { parentId: frontendCategory.parentId }),
    // Map children if available
    ...(frontendCategory.children && Array.isArray(frontendCategory.children) && {
      children: frontendCategory.children.map((child: any) => transformFrontendCategory(child)),
    }),
  };
}

/**
 * Sync categories from frontend to backend
 * Enhanced with validation and better error messages
 */
export async function syncCategoriesFromFrontend(
  options: SyncOptions = {}
): Promise<SyncResult> {
  try {
    // Validate frontend categories before sync
    try {
      const { categories: frontendCategories } = await import('@nebula/shared');
      
      if (!frontendCategories || !Array.isArray(frontendCategories)) {
        throw new Error('Frontend categories not available or invalid format');
      }

      // Validate categories
      const validation = validateCategories(frontendCategories, {
        checkDuplicates: true,
        strict: false,
      });

      if (validation.totalErrors > 0) {
        logger.warn('Category validation found errors before sync', {
          totalErrors: validation.totalErrors,
          totalWarnings: validation.totalWarnings,
          duplicates: validation.duplicates,
        });
      }

      if (validation.duplicates.length > 0) {
        logger.warn('Duplicate category IDs found', { duplicates: validation.duplicates });
      }

      // Log validation summary
      if (validation.invalid.length > 0) {
        logger.info('Invalid categories will be skipped during sync', {
          invalidCount: validation.invalid.length,
          validCount: validation.valid.length,
        });
      }
    } catch (validationError: any) {
      logger.warn('Category validation failed, proceeding with sync anyway', { error: validationError });
    }

    // Use API endpoint for sync
    const response = await api.post<{ success: boolean; data: SyncResult }>('/api/admin/sync/categories', {
      overwrite: options.overwrite,
      skipDuplicates: options.skipDuplicates,
      dryRun: options.dryRun,
    });

    if (response.data?.success && response.data?.data) {
      const result = response.data.data;
      
      // Enhanced logging with detailed error information
      if (result.errors.length > 0) {
        logger.warn('Category sync completed with errors', {
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errorCount: result.errors.length,
          errors: result.errors.slice(0, 10), // Log first 10 errors
        });
      } else {
        logger.info('Category sync completed successfully', {
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          total: result.total,
        });
      }
      
      return result;
    }

    throw new Error('Sync failed: Invalid response from server');
  } catch (error: any) {
    // Enhanced error messages with specific field information
    let errorMessage = 'Unknown error';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.details) {
      errorMessage = `Validation error: ${error.response.data.details.map((d: any) => d.msg || d).join(', ')}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    logger.error('Category sync failed', { 
      error: errorMessage,
      status: error.response?.status,
      details: error.response?.data,
    });

    return {
      success: false,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [{ 
        item: 'all', 
        error: errorMessage,
      }],
      total: 0,
    };
  }
}

// ==================== PRODUCT SYNC ====================

/**
 * Transform frontend product to backend format
 * Enhanced with validation and better field mapping
 */
function transformFrontendProduct(frontendProduct: any): Partial<Product> {
  // Validate product first
  const validation = validateProduct(frontendProduct, { strict: false });
  
  if (!validation.isValid && validation.errors.length > 0) {
    logger.warn('Invalid frontend product detected during sync', {
      productId: frontendProduct.id,
      errors: validation.errors,
    });
  }

  // Sanitize and transform
  const sanitized = sanitizeProduct(frontendProduct);

  // Enhanced transformation with all available fields
  return {
    ...sanitized,
    // Map additional frontend fields
    tags: frontendProduct.tags || sanitized.badges || [],
    // Map leadTime if available
    ...(frontendProduct.leadTime && { leadTime: frontendProduct.leadTime }),
    // Map interest/popularity if available
    ...(frontendProduct.interest !== undefined && { interest: frontendProduct.interest }),
    ...(frontendProduct.popularity !== undefined && { popularity: frontendProduct.popularity }),
    // Map brand/series if available
    ...(frontendProduct.brandId && { brandId: frontendProduct.brandId }),
    ...(frontendProduct.brandSlug && { brandSlug: frontendProduct.brandSlug }),
    ...(frontendProduct.seriesId && { seriesId: frontendProduct.seriesId }),
    ...(frontendProduct.seriesSlug && { seriesSlug: frontendProduct.seriesSlug }),
    // Map shipping options if available
    ...(frontendProduct.shippingOptions && { shippingOptions: frontendProduct.shippingOptions }),
    ...(frontendProduct.defaultShippingOptionId && { defaultShippingOptionId: frontendProduct.defaultShippingOptionId }),
    // Map pricing tiers if available
    ...(frontendProduct.pricingTiers && { pricingTiers: frontendProduct.pricingTiers }),
    // Map additional metadata
    ...(frontendProduct.limitedUntil && { limitedUntil: frontendProduct.limitedUntil }),
    ...(frontendProduct.onRequest !== undefined && { onRequest: frontendProduct.onRequest }),
    ...(frontendProduct.maxPerUser !== undefined && { maxPerUser: frontendProduct.maxPerUser }),
  };
}

/**
 * Sync products from frontend to backend
 * Enhanced with validation and better error messages
 */
export async function syncProductsFromFrontend(
  options: SyncOptions = {}
): Promise<SyncResult> {
  try {
    // Validate frontend products before sync
    try {
      const { products: frontendProducts } = await import('@nebula/shared');
      
      if (!frontendProducts || !Array.isArray(frontendProducts)) {
        throw new Error('Frontend products not available or invalid format');
      }

      // Validate products
      const validation = validateProducts(frontendProducts, {
        checkDuplicates: true,
        strict: false,
      });

      if (validation.totalErrors > 0) {
        logger.warn('Product validation found errors before sync', {
          totalErrors: validation.totalErrors,
          totalWarnings: validation.totalWarnings,
          duplicates: validation.duplicates,
        });
      }

      if (validation.duplicates.length > 0) {
        logger.warn('Duplicate product IDs found', { duplicates: validation.duplicates });
      }

      // Validate category references
      const { categories: frontendCategories } = await import('@nebula/shared');
      if (frontendCategories && Array.isArray(frontendCategories)) {
        const refValidation = validateProductCategoryReferences(validation.valid, frontendCategories);
        
        if (refValidation.invalid.length > 0) {
          logger.warn('Products with invalid category references found', {
            invalidCount: refValidation.invalid.length,
            samples: refValidation.invalid.slice(0, 5).map((inv) => ({
              productId: inv.product?.id,
              categoryId: inv.categoryId,
              error: inv.error,
            })),
          });
        }
      }

      // Log validation summary
      if (validation.invalid.length > 0) {
        logger.info('Invalid products will be skipped during sync', {
          invalidCount: validation.invalid.length,
          validCount: validation.valid.length,
        });
      }
    } catch (validationError: any) {
      logger.warn('Product validation failed, proceeding with sync anyway', { error: validationError });
    }

    // Use API endpoint for sync
    const response = await api.post<{ success: boolean; data: SyncResult }>('/api/admin/sync/products', {
      overwrite: options.overwrite,
      skipDuplicates: options.skipDuplicates,
      dryRun: options.dryRun,
    });

    if (response.data?.success && response.data?.data) {
      const result = response.data.data;
      
      // Enhanced logging with detailed error information
      if (result.errors.length > 0) {
        logger.warn('Product sync completed with errors', {
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errorCount: result.errors.length,
          errors: result.errors.slice(0, 10), // Log first 10 errors
        });
      } else {
        logger.info('Product sync completed successfully', {
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          total: result.total,
        });
      }
      
      return result;
    }

    throw new Error('Sync failed: Invalid response from server');
  } catch (error: any) {
    // Enhanced error messages with specific field information
    let errorMessage = 'Unknown error';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.details) {
      errorMessage = `Validation error: ${error.response.data.details.map((d: any) => d.msg || d).join(', ')}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    logger.error('Product sync failed', { 
      error: errorMessage,
      status: error.response?.status,
      details: error.response?.data,
    });

    return {
      success: false,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [{ 
        item: 'all', 
        error: errorMessage,
      }],
      total: 0,
    };
  }
}

// ==================== FULL SYNC ====================

/**
 * Sync both categories and products from frontend
 */
export async function syncAllFromFrontend(
  options: SyncOptions = {}
): Promise<{
  categories: SyncResult;
  products: SyncResult;
  success: boolean;
}> {
  logger.info('Starting full sync from frontend', options);

  const categories = await syncCategoriesFromFrontend(options);
  const products = await syncProductsFromFrontend(options);

  const success = categories.success && products.success;

  logger.info('Full sync completed', {
    categories,
    products,
    success,
  });

  return {
    categories,
    products,
    success,
  };
}

