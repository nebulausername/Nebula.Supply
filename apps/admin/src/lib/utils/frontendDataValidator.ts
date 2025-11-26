/**
 * Frontend Data Validator
 * 
 * Validates and sanitizes frontend data from @nebula/shared
 */

import { logger } from '../logger';
import type { Product, Category } from '../api/ecommerce';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationOptions {
  strict?: boolean; // If true, fail on warnings
  allowMissingFields?: boolean; // If true, allow missing optional fields
  checkDuplicates?: boolean; // Check for duplicate IDs
  validateReferences?: boolean; // Validate category references in products
}

/**
 * Validate a single product
 */
export function validateProduct(
  product: any,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!product.id || typeof product.id !== 'string') {
    errors.push('Product missing or invalid id');
  }

  if (!product.name || typeof product.name !== 'string') {
    errors.push(`Product ${product.id || 'unknown'}: missing or invalid name`);
  }

  if (product.price === undefined || typeof product.price !== 'number' || product.price < 0) {
    errors.push(`Product ${product.id || 'unknown'}: missing or invalid price`);
  }

  if (product.categoryId === undefined || typeof product.categoryId !== 'string') {
    errors.push(`Product ${product.id || 'unknown'}: missing or invalid categoryId`);
  }

  // Optional but recommended fields
  if (!product.sku) {
    warnings.push(`Product ${product.id || 'unknown'}: missing SKU`);
  }

  if (!product.description) {
    warnings.push(`Product ${product.id || 'unknown'}: missing description`);
  }

  if (product.inventory === undefined || typeof product.inventory !== 'number') {
    warnings.push(`Product ${product.id || 'unknown'}: missing or invalid inventory (defaulting to 0)`);
  }

  // Type validation
  if (product.currency && typeof product.currency !== 'string') {
    warnings.push(`Product ${product.id || 'unknown'}: invalid currency type`);
  }

  if (product.media && !Array.isArray(product.media)) {
    warnings.push(`Product ${product.id || 'unknown'}: media should be an array`);
  }

  if (product.variants && !Array.isArray(product.variants)) {
    warnings.push(`Product ${product.id || 'unknown'}: variants should be an array`);
  }

  // Check for circular references in variants
  if (product.variants && Array.isArray(product.variants)) {
    product.variants.forEach((variant: any, index: number) => {
      if (variant && typeof variant === 'object' && variant.productId === product.id) {
        warnings.push(`Product ${product.id || 'unknown'}: variant ${index} has circular reference`);
      }
    });
  }

  return {
    isValid: errors.length === 0 && (options.strict ? warnings.length === 0 : true),
    errors,
    warnings,
  };
}

/**
 * Validate a single category
 */
export function validateCategory(
  category: any,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!category.id || typeof category.id !== 'string') {
    errors.push('Category missing or invalid id');
  }

  if (!category.name || typeof category.name !== 'string') {
    errors.push(`Category ${category.id || 'unknown'}: missing or invalid name`);
  }

  // Optional but recommended fields
  if (!category.slug && !category.id) {
    warnings.push(`Category ${category.id || 'unknown'}: missing slug`);
  }

  if (!category.icon) {
    warnings.push(`Category ${category.id || 'unknown'}: missing icon`);
  }

  if (category.order === undefined || typeof category.order !== 'number') {
    warnings.push(`Category ${category.id || 'unknown'}: missing or invalid order (defaulting to 0)`);
  }

  return {
    isValid: errors.length === 0 && (options.strict ? warnings.length === 0 : true),
    errors,
    warnings,
  };
}

/**
 * Validate multiple products
 */
export function validateProducts(
  products: any[],
  options: ValidationOptions = {}
): {
  valid: Product[];
  invalid: Array<{ product: any; errors: string[]; warnings: string[] }>;
  duplicates: string[];
  totalErrors: number;
  totalWarnings: number;
} {
  const valid: Product[] = [];
  const invalid: Array<{ product: any; errors: string[]; warnings: string[] }> = [];
  const seenIds = new Set<string>();
  const duplicates: string[] = [];

  let totalErrors = 0;
  let totalWarnings = 0;

  products.forEach((product) => {
    // Check for duplicates
    if (options.checkDuplicates && product.id) {
      if (seenIds.has(product.id)) {
        duplicates.push(product.id);
        invalid.push({
          product,
          errors: [`Duplicate product ID: ${product.id}`],
          warnings: [],
        });
        totalErrors++;
        return;
      }
      seenIds.add(product.id);
    }

    const result = validateProduct(product, options);
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    if (result.isValid) {
      valid.push(product as Product);
    } else {
      invalid.push({
        product,
        errors: result.errors,
        warnings: result.warnings,
      });
    }
  });

  return {
    valid,
    invalid,
    duplicates,
    totalErrors,
    totalWarnings,
  };
}

/**
 * Validate multiple categories
 */
export function validateCategories(
  categories: any[],
  options: ValidationOptions = {}
): {
  valid: Category[];
  invalid: Array<{ category: any; errors: string[]; warnings: string[] }>;
  duplicates: string[];
  totalErrors: number;
  totalWarnings: number;
} {
  const valid: Category[] = [];
  const invalid: Array<{ category: any; errors: string[]; warnings: string[] }> = [];
  const seenIds = new Set<string>();
  const duplicates: string[] = [];

  let totalErrors = 0;
  let totalWarnings = 0;

  categories.forEach((category) => {
    // Check for duplicates
    if (options.checkDuplicates && category.id) {
      if (seenIds.has(category.id)) {
        duplicates.push(category.id);
        invalid.push({
          category,
          errors: [`Duplicate category ID: ${category.id}`],
          warnings: [],
        });
        totalErrors++;
        return;
      }
      seenIds.add(category.id);
    }

    const result = validateCategory(category, options);
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    if (result.isValid) {
      valid.push(category as Category);
    } else {
      invalid.push({
        category,
        errors: result.errors,
        warnings: result.warnings,
      });
    }
  });

  return {
    valid,
    invalid,
    duplicates,
    totalErrors,
    totalWarnings,
  };
}

/**
 * Validate product category references
 */
export function validateProductCategoryReferences(
  products: any[],
  categories: any[]
): {
  valid: any[];
  invalid: Array<{ product: any; categoryId: string; error: string }>;
} {
  const categoryIds = new Set(categories.map((c) => c.id));
  const valid: any[] = [];
  const invalid: Array<{ product: any; categoryId: string; error: string }> = [];

  products.forEach((product) => {
    if (!product.categoryId) {
      invalid.push({
        product,
        categoryId: '',
        error: 'Missing categoryId',
      });
      return;
    }

    if (!categoryIds.has(product.categoryId)) {
      invalid.push({
        product,
        categoryId: product.categoryId,
        error: `Category ${product.categoryId} not found`,
      });
      return;
    }

    valid.push(product);
  });

  return { valid, invalid };
}

/**
 * Sanitize product data - remove invalid fields and set defaults
 */
export function sanitizeProduct(product: any): Partial<Product> {
  const sanitized: any = {
    id: product.id || `temp-${Date.now()}-${Math.random()}`,
    name: product.name || 'Unnamed Product',
    categoryId: product.categoryId || '',
    sku: product.sku || `SKU-${product.id || 'unknown'}`,
    description: product.description || '',
    price: typeof product.price === 'number' && product.price >= 0 ? product.price : 0,
    currency: product.currency || 'EUR',
    inventory: typeof product.inventory === 'number' && product.inventory >= 0 ? product.inventory : 0,
    status: product.inventory > 0 ? 'active' : 'inactive',
    featured: product.isNew || product.featured || false,
    access: product.access || 'standard',
    type: product.type || 'shop',
    variants: Array.isArray(product.variants) ? product.variants : [],
    media: Array.isArray(product.media) ? product.media : [],
    badges: Array.isArray(product.badges) ? product.badges : [],
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
  };

  // Remove circular references
  if (sanitized.variants) {
    sanitized.variants = sanitized.variants.map((variant: any) => {
      const clean = { ...variant };
      if (clean.productId === sanitized.id) {
        delete clean.productId;
      }
      return clean;
    });
  }

  return sanitized;
}

/**
 * Sanitize category data - remove invalid fields and set defaults
 */
export function sanitizeCategory(category: any): Partial<Category> {
  return {
    id: category.id || `temp-${Date.now()}-${Math.random()}`,
    slug: category.slug || category.id || `category-${Date.now()}`,
    name: category.name || 'Unnamed Category',
    description: category.description || '',
    icon: category.icon || '📦',
    order: typeof category.order === 'number' ? category.order : 0,
    featured: category.featured || false,
    type: category.type || 'shop',
    createdAt: category.createdAt || new Date().toISOString(),
    updatedAt: category.updatedAt || new Date().toISOString(),
  };
}












