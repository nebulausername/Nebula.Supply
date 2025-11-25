import { api } from './client';
import type { Product, Category } from '@nebula/shared';

// API Product type (from backend)
export interface ApiProduct {
  id: string;
  name: string;
  categoryId: string;
  sku: string;
  description: string;
  price: number;
  currency: string;
  inventory: number;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  featured?: boolean;
  access?: 'free' | 'limited' | 'vip' | 'standard';
  type?: 'shop' | 'drop';
  variants?: any[];
  media?: Array<{ url: string; alt?: string }>;
  badges?: string[];
  createdAt: string;
  updatedAt: string;
  isBundle?: boolean;
  bundleProducts?: string[];
  // Additional fields for mapping
  brandId?: string;
  brandSlug?: string;
  seriesId?: string;
  seriesSlug?: string;
  leadTime?: any;
  shippingOptions?: any[];
  defaultShippingOptionId?: string;
  tags?: string[];
  interest?: number;
  popularity?: number;
  isNew?: boolean;
}

export interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  children?: ApiCategory[];
}

export interface ProductFilters {
  status?: string[];
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  access?: string[];
  type?: string[];
  inStock?: boolean;
  lowStock?: boolean;
  sortBy?: 'name' | 'price' | 'inventory' | 'createdAt' | 'updatedAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Transform API product to frontend Product format
function transformApiProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    categoryId: apiProduct.categoryId,
    sku: apiProduct.sku,
    description: apiProduct.description || '',
    price: apiProduct.price,
    currency: apiProduct.currency || 'EUR',
    inventory: apiProduct.inventory || 0,
    interest: apiProduct.interest || 0,
    variants: apiProduct.variants || [],
    media: apiProduct.media || [],
    badges: apiProduct.badges || [],
    shippingOptions: apiProduct.shippingOptions || [],
    defaultShippingOptionId: apiProduct.defaultShippingOptionId,
    brandId: apiProduct.brandId,
    brandSlug: apiProduct.brandSlug,
    seriesId: apiProduct.seriesId,
    seriesSlug: apiProduct.seriesSlug,
    tags: apiProduct.tags || [],
    popularity: apiProduct.popularity || 0,
    isNew: apiProduct.isNew || false,
    leadTime: apiProduct.leadTime || { min: 1, max: 3, unit: 'weeks' },
    // Map status
    isActive: apiProduct.status === 'active',
    isOutOfStock: (apiProduct.inventory || 0) === 0,
    isFeatured: apiProduct.featured || false,
    // Map access
    access: apiProduct.access || 'standard',
    // Map type
    type: apiProduct.type || 'shop',
  } as Product;
}

// Transform API category to frontend Category format
function transformApiCategory(apiCategory: ApiCategory): Category {
  return {
    id: apiCategory.id,
    slug: apiCategory.slug,
    name: apiCategory.name,
    description: apiCategory.description || '',
    icon: apiCategory.icon || '',
    order: apiCategory.order || 0,
    featured: apiCategory.featured || false,
    parentId: apiCategory.parentId,
    children: apiCategory.children?.map(transformApiCategory),
    subItems: [], // Will be populated from children if needed
  } as Category;
}

export const shopApi = {
  /**
   * Get products from backend API
   * Falls back to empty array on error
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.status) {
        filters.status.forEach(s => queryParams.append('status', s));
      }
      if (filters?.categoryId) {
        queryParams.append('categoryId', filters.categoryId);
      }
      if (filters?.search) {
        queryParams.append('search', filters.search);
      }
      if (filters?.minPrice !== undefined) {
        queryParams.append('minPrice', filters.minPrice.toString());
      }
      if (filters?.maxPrice !== undefined) {
        queryParams.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters?.featured !== undefined) {
        queryParams.append('featured', filters.featured.toString());
      }
      if (filters?.access) {
        filters.access.forEach(a => queryParams.append('access', a));
      }
      if (filters?.type) {
        filters.type.forEach(t => queryParams.append('type', t));
      }
      if (filters?.inStock !== undefined) {
        queryParams.append('inStock', filters.inStock.toString());
      }
      if (filters?.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      if (filters?.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder);
      }
      if (filters?.limit) {
        queryParams.append('limit', filters.limit.toString());
      }
      if (filters?.offset) {
        queryParams.append('offset', filters.offset.toString());
      }

      // Only fetch active shop products for public shop
      queryParams.append('status', 'active');
      queryParams.append('type', 'shop');

      const queryString = queryParams.toString();
      const url = `/api/admin/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<ApiProduct[]>(url);
      
      if (response.success && Array.isArray(response.data)) {
        return response.data.map(transformApiProduct);
      }
      
      return [];
    } catch (error: any) {
      console.warn('[ShopAPI] Failed to fetch products from backend:', error.message || error);
      // Return empty array on error - will fallback to mock data
      return [];
    }
  },

  /**
   * Get categories from backend API
   * Falls back to empty array on error
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get<ApiCategory[]>('/api/admin/categories?type=shop');
      
      if (response.success && Array.isArray(response.data)) {
        return response.data.map(transformApiCategory).sort((a, b) => a.order - b.order);
      }
      
      return [];
    } catch (error: any) {
      console.warn('[ShopAPI] Failed to fetch categories from backend:', error.message || error);
      // Return empty array on error - will fallback to mock data
      return [];
    }
  },

  /**
   * Get single product by ID
   */
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const response = await api.get<ApiProduct>(`/api/admin/products/${productId}`);
      
      if (response.success && response.data) {
        return transformApiProduct(response.data);
      }
      
      return null;
    } catch (error: any) {
      console.warn('[ShopAPI] Failed to fetch product:', error.message || error);
      return null;
    }
  },
};

