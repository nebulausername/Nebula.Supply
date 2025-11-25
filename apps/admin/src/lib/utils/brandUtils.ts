import type { Category } from '../../lib/api/ecommerce';
import { SNEAKER_HIERARCHY } from './productTemplates';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  category: Category;
  models: Model[];
  productCount: number;
  totalValue: number;
  averagePrice: number;
  totalStock: number;
}

export interface Model {
  id: string;
  name: string;
  slug: string;
  category: Category;
  brandId: string;
  brandName: string;
  productCount: number;
  totalValue: number;
  averagePrice: number;
  totalStock: number;
}

export interface BrandStats {
  brand: Brand;
  totalProducts: number;
  totalRevenue: number;
  averagePrice: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  topModels: Array<{ model: Model; productCount: number }>;
}

export interface BrandColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  badge: string;
}

// Brand-spezifische Farben
export const BRAND_COLORS: Record<string, BrandColorScheme> = {
  'NIKE': {
    primary: 'from-orange-500/20 to-red-500/20',
    secondary: 'border-orange-500/30',
    accent: 'text-orange-400',
    badge: 'bg-orange-500/20 border-orange-500/50 text-orange-300'
  },
  'AIR JORDAN': {
    primary: 'from-red-500/20 to-black/20',
    secondary: 'border-red-500/30',
    accent: 'text-red-400',
    badge: 'bg-red-500/20 border-red-500/50 text-red-300'
  },
  'NOCTA': {
    primary: 'from-blue-500/20 to-purple-500/20',
    secondary: 'border-blue-500/30',
    accent: 'text-blue-400',
    badge: 'bg-blue-500/20 border-blue-500/50 text-blue-300'
  },
  'MAISON MARGIELA': {
    primary: 'from-white/20 to-gray-500/20',
    secondary: 'border-white/30',
    accent: 'text-white',
    badge: 'bg-white/20 border-white/50 text-white'
  },
  'CHANEL': {
    primary: 'from-yellow-500/20 to-black/20',
    secondary: 'border-yellow-500/30',
    accent: 'text-yellow-400',
    badge: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
  },
  'LV': {
    primary: 'from-amber-500/20 to-brown-500/20',
    secondary: 'border-amber-500/30',
    accent: 'text-amber-400',
    badge: 'bg-amber-500/20 border-amber-500/50 text-amber-300'
  }
};

/**
 * Findet die SNEAKER Hauptkategorie
 */
export function findSneakerCategory(categories: Category[]): Category | null {
  return categories.find(
    cat => cat.slug === 'sneaker' || cat.name.toLowerCase() === 'sneaker'
  ) || null;
}

/**
 * Extrahiert alle Brands aus den Kategorien (Level 1 unter SNEAKER)
 */
export function extractBrands(
  categories: Category[],
  products: any[] = []
): Brand[] {
  const sneakerCategory = findSneakerCategory(categories);
  if (!sneakerCategory) return [];

  const brands: Brand[] = [];
  const brandCategories = categories.filter(
    cat => cat.parentId === sneakerCategory.id
  );

  for (const brandCategory of brandCategories) {
    const models = extractModels(categories, brandCategory.id, products);
    const brandProducts = getProductsForCategory(products, brandCategory.id, categories);
    
    const brand: Brand = {
      id: brandCategory.id,
      name: brandCategory.name,
      slug: brandCategory.slug,
      category: brandCategory,
      models,
      productCount: brandProducts.length,
      totalValue: brandProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.inventory || 0)), 0),
      averagePrice: brandProducts.length > 0
        ? brandProducts.reduce((sum, p) => sum + (p.price || 0), 0) / brandProducts.length
        : 0,
      totalStock: brandProducts.reduce((sum, p) => sum + (p.inventory || 0), 0)
    };

    brands.push(brand);
  }

  return brands.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Extrahiert alle Modelle für eine Brand (Level 2 unter Brand)
 */
export function extractModels(
  categories: Category[],
  brandId: string,
  products: any[] = []
): Model[] {
  const models: Model[] = [];
  const modelCategories = categories.filter(cat => cat.parentId === brandId);
  const brandCategory = categories.find(cat => cat.id === brandId);

  for (const modelCategory of modelCategories) {
    const modelProducts = getProductsForCategory(products, modelCategory.id, categories);
    
    const model: Model = {
      id: modelCategory.id,
      name: modelCategory.name,
      slug: modelCategory.slug,
      category: modelCategory,
      brandId: brandId,
      brandName: brandCategory?.name || 'Unknown',
      productCount: modelProducts.length,
      totalValue: modelProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.inventory || 0)), 0),
      averagePrice: modelProducts.length > 0
        ? modelProducts.reduce((sum, p) => sum + (p.price || 0), 0) / modelProducts.length
        : 0,
      totalStock: modelProducts.reduce((sum, p) => sum + (p.inventory || 0), 0)
    };

    models.push(model);
  }

  return models.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Holt alle Produkte für eine Kategorie (inkl. Unterkategorien)
 */
export function getProductsForCategory(
  products: any[],
  categoryId: string,
  allCategories: Category[]
): any[] {
  const categoryIds = new Set<string>([categoryId]);
  
  // Finde alle Unterkategorien
  const findChildren = (parentId: string) => {
    const children = allCategories.filter(cat => cat.parentId === parentId);
    children.forEach(child => {
      categoryIds.add(child.id);
      findChildren(child.id);
    });
  };
  
  findChildren(categoryId);
  
  return products.filter(p => p.categoryId && categoryIds.has(p.categoryId));
}

/**
 * Berechnet Brand-Statistiken
 */
export function calculateBrandStats(
  brand: Brand,
  products: any[]
): BrandStats {
  const brandProducts = getProductsForCategory(products, brand.id, [brand.category]);
  const lowStockCount = brandProducts.filter(p => (p.inventory || 0) < 10).length;
  const outOfStockCount = brandProducts.filter(p => (p.inventory || 0) === 0).length;
  
  const topModels = brand.models
    .map(model => ({
      model,
      productCount: model.productCount
    }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 5);

  return {
    brand,
    totalProducts: brand.productCount,
    totalRevenue: brand.totalValue,
    averagePrice: brand.averagePrice,
    totalStock: brand.totalStock,
    lowStockCount,
    outOfStockCount,
    topModels
  };
}

/**
 * Filtert Produkte nach Brand
 */
export function filterProductsByBrand(
  products: any[],
  brandId: string,
  categories: Category[]
): any[] {
  return getProductsForCategory(products, brandId, categories);
}

/**
 * Filtert Produkte nach mehreren Brands
 */
export function filterProductsByBrands(
  products: any[],
  brandIds: string[],
  categories: Category[]
): any[] {
  if (brandIds.length === 0) return products;
  
  const filtered: any[] = [];
  for (const brandId of brandIds) {
    filtered.push(...filterProductsByBrand(products, brandId, categories));
  }
  
  // Entferne Duplikate
  const uniqueIds = new Set(filtered.map(p => p.id));
  return filtered.filter((p, index, self) => 
    self.findIndex(prod => prod.id === p.id) === index
  );
}

/**
 * Filtert Produkte nach Model
 */
export function filterProductsByModel(
  products: any[],
  modelId: string,
  categories: Category[]
): any[] {
  return getProductsForCategory(products, modelId, categories);
}

/**
 * Findet Brand für eine Kategorie
 */
export function findBrandForCategory(
  categoryId: string,
  categories: Category[]
): Brand | null {
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return null;

  const sneakerCategory = findSneakerCategory(categories);
  if (!sneakerCategory) return null;

  // Wenn die Kategorie direkt unter SNEAKER ist, ist es eine Brand
  if (category.parentId === sneakerCategory.id) {
    const models = extractModels(categories, category.id);
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      category,
      models,
      productCount: 0,
      totalValue: 0,
      averagePrice: 0,
      totalStock: 0
    };
  }

  // Wenn die Kategorie ein Model ist, finde die Brand
  if (category.parentId) {
    const brandCategory = categories.find(cat => cat.id === category.parentId);
    if (brandCategory && brandCategory.parentId === sneakerCategory.id) {
      const models = extractModels(categories, brandCategory.id);
      return {
        id: brandCategory.id,
        name: brandCategory.name,
        slug: brandCategory.slug,
        category: brandCategory,
        models,
        productCount: 0,
        totalValue: 0,
        averagePrice: 0,
        totalStock: 0
      };
    }
  }

  return null;
}

/**
 * Findet Model für eine Kategorie
 */
export function findModelForCategory(
  categoryId: string,
  categories: Category[]
): Model | null {
  const category = categories.find(cat => cat.id === categoryId);
  if (!category || !category.parentId) return null;

  const brandCategory = categories.find(cat => cat.id === category.parentId);
  if (!brandCategory) return null;

  const sneakerCategory = findSneakerCategory(categories);
  if (!sneakerCategory || brandCategory.parentId !== sneakerCategory.id) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    category,
    brandId: brandCategory.id,
    brandName: brandCategory.name,
    productCount: 0,
    totalValue: 0,
    averagePrice: 0,
    totalStock: 0
  };
}

/**
 * Holt Brand-Farbe-Schema
 */
export function getBrandColor(brandName: string): BrandColorScheme {
  return BRAND_COLORS[brandName.toUpperCase()] || {
    primary: 'from-gray-500/20 to-gray-600/20',
    secondary: 'border-gray-500/30',
    accent: 'text-gray-400',
    badge: 'bg-gray-500/20 border-gray-500/50 text-gray-300'
  };
}

/**
 * Prüft ob alle Brands aus SNEAKER_HIERARCHY vorhanden sind
 */
export function validateBrands(categories: Category[]): {
  missing: string[];
  existing: string[];
  completeness: number;
} {
  const sneakerCategory = findSneakerCategory(categories);
  if (!sneakerCategory) {
    return {
      missing: SNEAKER_HIERARCHY.brands.map(b => b.name),
      existing: [],
      completeness: 0
    };
  }

  const existingBrands = extractBrands(categories);
  const existingNames = new Set(existingBrands.map(b => b.name.toUpperCase()));
  const expectedNames = new Set(SNEAKER_HIERARCHY.brands.map(b => b.name.toUpperCase()));

  const missing = SNEAKER_HIERARCHY.brands
    .filter(b => !existingNames.has(b.name.toUpperCase()))
    .map(b => b.name);

  const existing = Array.from(existingNames);

  const completeness = expectedNames.size > 0
    ? (existingNames.size / expectedNames.size) * 100
    : 0;

  return {
    missing,
    existing,
    completeness: Math.round(completeness)
  };
}

/**
 * Prüft ob alle Modelle für eine Brand vorhanden sind
 */
export function validateModels(
  brandName: string,
  categories: Category[]
): {
  missing: string[];
  existing: string[];
  completeness: number;
} {
  const brandDef = SNEAKER_HIERARCHY.brands.find(
    b => b.name.toUpperCase() === brandName.toUpperCase()
  );
  if (!brandDef) {
    return { missing: [], existing: [], completeness: 0 };
  }

  const sneakerCategory = findSneakerCategory(categories);
  if (!sneakerCategory) {
    return {
      missing: brandDef.models,
      existing: [],
      completeness: 0
    };
  }

  const brands = extractBrands(categories);
  const brand = brands.find(b => b.name.toUpperCase() === brandName.toUpperCase());
  
  if (!brand) {
    return {
      missing: brandDef.models,
      existing: [],
      completeness: 0
    };
  }

  const existingModelNames = new Set(brand.models.map(m => m.name.toUpperCase()));
  const expectedModelNames = new Set(brandDef.models.map(m => m.toUpperCase()));

  const missing = brandDef.models.filter(
    m => !existingModelNames.has(m.toUpperCase())
  );

  const existing = Array.from(existingModelNames);

  const completeness = expectedModelNames.size > 0
    ? (existingModelNames.size / expectedModelNames.size) * 100
    : 0;

  return {
    missing,
    existing,
    completeness: Math.round(completeness)
  };
}

/**
 * Sucht nach Brands (Fuzzy Search)
 */
export function searchBrands(
  brands: Brand[],
  searchTerm: string
): Brand[] {
  if (!searchTerm.trim()) return brands;

  const term = searchTerm.toLowerCase();
  return brands.filter(brand =>
    brand.name.toLowerCase().includes(term) ||
    brand.slug.toLowerCase().includes(term) ||
    brand.models.some(model => 
      model.name.toLowerCase().includes(term)
    )
  );
}

/**
 * Sortiert Brands nach verschiedenen Kriterien
 */
export function sortBrands(
  brands: Brand[],
  sortBy: 'name' | 'products' | 'revenue' | 'stock' = 'name',
  order: 'asc' | 'desc' = 'asc'
): Brand[] {
  const sorted = [...brands].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'products':
        comparison = a.productCount - b.productCount;
        break;
      case 'revenue':
        comparison = a.totalValue - b.totalValue;
        break;
      case 'stock':
        comparison = a.totalStock - b.totalStock;
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

