/**
 * Product Generator for Categories
 * 
 * Generates 2-3 products per category based on category name, icon, and description
 */

import type { Product } from '../../lib/api/ecommerce';
import { generateProductsForSeries } from '@nebula/shared';

export interface GenerateProductsOptions {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryDescription?: string;
  count?: number; // Default: 2-3 products
}

/**
 * Generate products for a category
 */
export function generateProductsForCategory(options: GenerateProductsOptions): Partial<Product>[] {
  const {
    categoryId,
    categoryName,
    categoryIcon = '📦',
    categoryDescription = '',
    count = Math.floor(Math.random() * 2) + 2, // 2-3 products
  } = options;

  // Determine base price based on category
  const basePrice = getBasePriceForCategory(categoryName);
  
  // Generate product names based on category
  const productNames = generateProductNames(categoryName, count);
  
  // Generate products
  const products: Partial<Product>[] = [];

  for (let i = 0; i < count; i++) {
    const productName = productNames[i];
    const price = basePrice + (Math.random() * 50 - 25); // ±25 EUR variation
    const sku = generateSKU(categoryName, i + 1);
    
    products.push({
      name: productName,
      categoryId,
      sku,
      description: generateDescription(categoryName, productName, categoryDescription),
      price: Math.round(price * 100) / 100, // Round to 2 decimals
      currency: 'EUR',
      inventory: Math.floor(Math.random() * 50) + 10, // 10-60 stock
      status: 'active',
      featured: i === 0, // First product is featured
      access: 'standard',
      type: 'shop',
      variants: generateVariants(categoryName),
      media: generateMedia(productName),
      badges: i === 0 ? ['Neu'] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return products;
}

/**
 * Get base price for category
 */
function getBasePriceForCategory(categoryName: string): number {
  const name = categoryName.toLowerCase();
  
  if (name.includes('sneaker') || name.includes('schuh') || name.includes('shoe')) {
    return 120;
  } else if (name.includes('kleidung') || name.includes('clothing') || name.includes('jacke') || name.includes('hoodie')) {
    return 80;
  } else if (name.includes('accessoire') || name.includes('accessory') || name.includes('uhr') || name.includes('watch')) {
    return 150;
  } else if (name.includes('tasche') || name.includes('bag') || name.includes('rucksack')) {
    return 100;
  } else if (name.includes('tech') || name.includes('smartphone')) {
    return 50;
  } else {
    return 80; // Default
  }
}

/**
 * Generate product names based on category
 */
function generateProductNames(categoryName: string, count: number): string[] {
  const names: string[] = [];
  const baseName = categoryName;
  
  // Common suffixes/prefixes
  const suffixes = ['Pro', 'Premium', 'Classic', 'Elite', 'Standard', 'Plus', 'Max'];
  const colors = ['Schwarz', 'Weiß', 'Grau', 'Blau', 'Rot', 'Grün'];
  const styles = ['Modern', 'Vintage', 'Sport', 'Casual', 'Elegant'];
  
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      names.push(`${baseName} ${suffixes[0]}`);
    } else if (i === 1) {
      names.push(`${baseName} ${colors[i - 1]}`);
    } else {
      const suffix = suffixes[i % suffixes.length];
      const color = colors[i % colors.length];
      names.push(`${baseName} ${suffix} ${color}`);
    }
  }
  
  return names;
}

/**
 * Generate SKU
 */
function generateSKU(categoryName: string, index: number): string {
  const categoryPrefix = categoryName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 3);
  
  return `${categoryPrefix}-${String(index).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
}

/**
 * Generate description
 */
function generateDescription(categoryName: string, productName: string, categoryDescription: string): string {
  const descriptions = [
    `Premium ${categoryName.toLowerCase()} mit hochwertigen Materialien und zeitlosem Design.`,
    `Exklusives ${categoryName.toLowerCase()} mit besonderen Details und moderner Ästhetik.`,
    `Hochwertiges ${categoryName.toLowerCase()} für den anspruchsvollen Geschmack.`,
    `Stylisches ${categoryName.toLowerCase()} mit Premium-Finish und unverwechselbarem Design.`,
  ];
  
  const baseDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  if (categoryDescription) {
    return `${baseDescription} ${categoryDescription}`;
  }
  
  return baseDescription;
}

/**
 * Generate variants (color, size)
 */
function generateVariants(categoryName: string): any[] {
  const name = categoryName.toLowerCase();
  const hasSizes = name.includes('sneaker') || name.includes('schuh') || name.includes('shoe') || 
                   name.includes('kleidung') || name.includes('clothing');
  
  const variants: any[] = [];
  
  // Color variant
  const colors = [
    { id: 'col-black', label: 'Schwarz', value: 'black', swatch: '#111827' },
    { id: 'col-white', label: 'Weiß', value: 'white', swatch: '#FFFFFF' },
    { id: 'col-grey', label: 'Grau', value: 'grey', swatch: '#6B7280' },
    { id: 'col-blue', label: 'Blau', value: 'blue', swatch: '#3B82F6' },
  ];
  
  variants.push({
    type: 'color',
    name: 'Farbe',
    options: colors.slice(0, Math.min(3, colors.length)),
  });
  
  // Size variant (for shoes and clothing)
  if (hasSizes) {
    const sizes = [
      { id: 'size-40', label: '40', value: '40' },
      { id: 'size-41', label: '41', value: '41' },
      { id: 'size-42', label: '42', value: '42' },
      { id: 'size-43', label: '43', value: '43' },
      { id: 'size-44', label: '44', value: '44' },
    ];
    
    variants.push({
      type: 'size',
      name: 'Größe',
      options: sizes,
    });
  }
  
  return variants;
}

/**
 * Generate media (placeholder images)
 */
function generateMedia(productName: string): Array<{ url: string; alt?: string }> {
  // Use placeholder images - in production, these would be actual product images
  return [
    {
      url: `https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop&crop=center`,
      alt: productName,
    },
  ];
}

/**
 * Generate products for multiple categories
 */
export function generateProductsForCategories(
  categories: Array<{ id: string; name: string; icon?: string; description?: string }>
): Partial<Product>[] {
  const allProducts: Partial<Product>[] = [];
  
  for (const category of categories) {
    const products = generateProductsForCategory({
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryDescription: category.description,
    });
    allProducts.push(...products);
  }
  
  return allProducts;
}

