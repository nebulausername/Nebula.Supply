import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi, inventoryApi, analyticsApi } from './ecommerce';
import type { Product, ProductFilters, Category, BestsellerProduct } from './ecommerce';
import { queryKeys } from './hooks';
import { logger } from '../logger';
import { validateProduct, sanitizeProduct, validateProducts, validateCategories } from '../utils/frontendDataValidator';

// ==================== FRONTEND PRODUCTS FALLBACK ====================

/**
 * Transform frontend product from @nebula/shared to API format
 * Enhanced with validation and better field mapping
 */
function transformFrontendProduct(frontendProduct: any): Product {
  // Validate product first
  const validation = validateProduct(frontendProduct, { strict: false });
  
  if (!validation.isValid && validation.errors.length > 0) {
    logger.warn('Invalid frontend product detected', {
      productId: frontendProduct.id,
      errors: validation.errors,
    });
  }

  if (validation.warnings.length > 0) {
    logger.debug('Product validation warnings', {
      productId: frontendProduct.id,
      warnings: validation.warnings,
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
  } as Product;
}

/**
 * Get frontend products from @nebula/shared as fallback
 */
async function getFrontendProductsFallback(filters?: ProductFilters): Promise<{
  data: Product[];
  total: number;
  _source: 'frontend';
  _syncStatus: {
    backend: number;
    frontend: number;
    total: number;
  };
  pagination?: any;
  metrics?: any;
}> {
  try {
    // Dynamically import to avoid issues if shared package structure changes
    const { products: frontendProducts } = await import('@nebula/shared');
    
    if (!frontendProducts || !Array.isArray(frontendProducts)) {
      logger.warn('Frontend products not available or invalid format');
      return {
        data: [],
        total: 0,
        _source: 'frontend',
        _syncStatus: { backend: 0, frontend: 0, total: 0 }
      };
    }
    
    // Validate all products first
    const validation = validateProducts(frontendProducts, {
      checkDuplicates: true,
      strict: false,
    });

    if (validation.totalErrors > 0) {
      logger.warn('Frontend products validation found errors', {
        totalErrors: validation.totalErrors,
        totalWarnings: validation.totalWarnings,
        duplicates: validation.duplicates,
        invalidCount: validation.invalid.length,
      });
    }

    if (validation.duplicates.length > 0) {
      logger.warn('Duplicate product IDs found', { duplicates: validation.duplicates });
    }

    // Transform only valid products
    let transformedProducts = validation.valid.map(transformFrontendProduct);
    
    // Log invalid products for debugging
    if (validation.invalid.length > 0) {
      logger.debug('Invalid products skipped', {
        count: validation.invalid.length,
        samples: validation.invalid.slice(0, 5).map((inv) => ({
          id: inv.product?.id,
          errors: inv.errors,
        })),
      });
    }
    
    // Apply filters if provided
    if (filters) {
      // Category filter
      if (filters.categoryId) {
        transformedProducts = transformedProducts.filter(p => p.categoryId === filters.categoryId);
      }
      
      // Status filter
      if (filters.status && filters.status.length > 0) {
        transformedProducts = transformedProducts.filter(p => 
          filters.status!.includes(p.status)
        );
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        transformedProducts = transformedProducts.filter(p =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.sku.toLowerCase().includes(searchTerm)
        );
      }
      
      // Price range filter
      if (filters.minPrice !== undefined) {
        transformedProducts = transformedProducts.filter(p => p.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        transformedProducts = transformedProducts.filter(p => p.price <= filters.maxPrice!);
      }
      
      // Featured filter
      if (filters.featured !== undefined) {
        transformedProducts = transformedProducts.filter(p => p.featured === filters.featured);
      }
      
      // In stock filter
      if (filters.inStock) {
        transformedProducts = transformedProducts.filter(p => p.inventory > 0);
      }
      
      // Low stock filter
      if (filters.lowStock) {
        transformedProducts = transformedProducts.filter(p => p.inventory > 0 && p.inventory < 10);
      }
      
      // Type filter (already handled by excludeDrops in effectiveFilters)
      if (filters.type && filters.type.length > 0) {
        transformedProducts = transformedProducts.filter(p => 
          filters.type!.includes(p.type || 'shop')
        );
      }
      
      // Sort
      if (filters.sortBy) {
        transformedProducts.sort((a, b) => {
          let aVal: any, bVal: any;
          
          switch (filters.sortBy) {
            case 'name':
              aVal = a.name.toLowerCase();
              bVal = b.name.toLowerCase();
              break;
            case 'price':
              aVal = a.price;
              bVal = b.price;
              break;
            case 'inventory':
              aVal = a.inventory;
              bVal = b.inventory;
              break;
            case 'createdAt':
              aVal = new Date(a.createdAt).getTime();
              bVal = new Date(b.createdAt).getTime();
              break;
            case 'updatedAt':
              aVal = new Date(a.updatedAt).getTime();
              bVal = new Date(b.updatedAt).getTime();
              break;
            default:
              return 0;
          }
          
          if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }
      
      // Pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      const total = transformedProducts.length;
      transformedProducts = transformedProducts.slice(offset, offset + limit);
      
      return {
        data: transformedProducts,
        total,
        _source: 'frontend',
        _syncStatus: {
          backend: 0,
          frontend: total,
          total
        },
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total
        },
        metrics: {
          totalProducts: total,
          activeProducts: transformedProducts.filter(p => p.status === 'active').length,
          lowStockProducts: transformedProducts.filter(p => p.inventory > 0 && p.inventory < 10).length,
          outOfStockProducts: transformedProducts.filter(p => p.inventory === 0).length
        }
      };
    }
    
    // No filters, return all products
    return {
      data: transformedProducts,
      total: transformedProducts.length,
      _source: 'frontend',
      _syncStatus: {
        backend: 0,
        frontend: transformedProducts.length,
        total: transformedProducts.length
      },
      pagination: {
        limit: transformedProducts.length,
        offset: 0,
        hasMore: false
      },
      metrics: {
        totalProducts: transformedProducts.length,
        activeProducts: transformedProducts.filter(p => p.status === 'active').length,
        lowStockProducts: transformedProducts.filter(p => p.inventory > 0 && p.inventory < 10).length,
        outOfStockProducts: transformedProducts.filter(p => p.inventory === 0).length
      }
    };
  } catch (error) {
    logger.error('Failed to load frontend products fallback', { error });
    return {
      data: [],
      total: 0,
      _source: 'frontend',
      _syncStatus: { backend: 0, frontend: 0, total: 0 }
    };
  }
}

// ==================== FRONTEND CATEGORIES FALLBACK ====================

/**
 * Transform frontend category from @nebula/shared to API format
 */
function transformFrontendCategory(frontendCategory: any): Category {
  return {
    id: frontendCategory.id || `cat-${Date.now()}`,
    slug: frontendCategory.slug || frontendCategory.id || '',
    name: frontendCategory.name || 'Unnamed Category',
    description: frontendCategory.description || '',
    icon: frontendCategory.icon || '📦',
    order: frontendCategory.order ?? 0,
    featured: frontendCategory.featured || false,
    type: frontendCategory.type || 'shop',
    parentId: frontendCategory.parentId || null,
    createdAt: frontendCategory.createdAt || new Date().toISOString(),
    updatedAt: frontendCategory.updatedAt || new Date().toISOString(),
    ...(frontendCategory.subItems && Array.isArray(frontendCategory.subItems) && {
      subItems: frontendCategory.subItems.map((child: any) => transformFrontendCategory(child)),
    }),
  } as Category;
}

/**
 * Get frontend categories from @nebula/shared as fallback
 */
async function getFrontendCategoriesFallback(filters?: any): Promise<{
  data: Category[];
  total: number;
  _source: 'frontend';
  _syncStatus: {
    backend: number;
    frontend: number;
    total: number;
  };
}> {
  try {
    // Dynamically import to avoid issues if shared package structure changes
    const { categories: frontendCategories } = await import('@nebula/shared');
    
    if (!frontendCategories || !Array.isArray(frontendCategories)) {
      logger.warn('Frontend categories not available or invalid format');
      return {
        data: [],
        total: 0,
        _source: 'frontend',
        _syncStatus: { backend: 0, frontend: 0, total: 0 }
      };
    }
    
    // Validate all categories first
    const validation = validateCategories(frontendCategories, {
      checkDuplicates: true,
      strict: false,
    });

    if (validation.totalErrors > 0) {
      logger.warn('Frontend categories validation found errors', {
        totalErrors: validation.totalErrors,
        totalWarnings: validation.totalWarnings,
        duplicates: validation.duplicates,
        invalidCount: validation.invalid.length,
      });
    }

    if (validation.duplicates.length > 0) {
      logger.warn('Duplicate category IDs found', { duplicates: validation.duplicates });
    }

    // Transform only valid categories
    let transformedCategories = validation.valid.map(transformFrontendCategory);
    
    // Apply filters if provided
    if (filters) {
      // Type filter
      if (filters.type) {
        transformedCategories = transformedCategories.filter(c => c.type === filters.type);
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        transformedCategories = transformedCategories.filter(c =>
          c.name.toLowerCase().includes(searchTerm) ||
          c.description?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Featured filter
      if (filters.featured !== undefined) {
        transformedCategories = transformedCategories.filter(c => c.featured === filters.featured);
      }
      
      // Sort
      if (filters.sortBy) {
        transformedCategories.sort((a, b) => {
          let aVal: any, bVal: any;
          
          switch (filters.sortBy) {
            case 'name':
              aVal = a.name.toLowerCase();
              bVal = b.name.toLowerCase();
              break;
            case 'order':
              aVal = a.order;
              bVal = b.order;
              break;
            case 'createdAt':
              aVal = new Date(a.createdAt).getTime();
              bVal = new Date(b.createdAt).getTime();
              break;
            default:
              return 0;
          }
          
          if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }
    
    return {
      data: transformedCategories,
      total: transformedCategories.length,
      _source: 'frontend',
      _syncStatus: {
        backend: 0,
        frontend: transformedCategories.length,
        total: transformedCategories.length
      }
    };
  } catch (error) {
    logger.error('Failed to load frontend categories fallback', { error });
    return {
      data: [],
      total: 0,
      _source: 'frontend',
      _syncStatus: { backend: 0, frontend: 0, total: 0 }
    };
  }
}

// ==================== PRODUCT HOOKS ====================

// Get all products with filters
export const useProducts = (filters?: ProductFilters & { excludeDrops?: boolean }) => {
  const effectiveFilters = filters ? {
    ...filters,
    // Exclude drops if requested
    ...(filters.excludeDrops ? { type: 'shop' } : {})
  } : undefined;
  
  return useQuery({
    queryKey: queryKeys.products.list(effectiveFilters),
    queryFn: async () => {
      try {
        const backendResult = await productsApi.getProducts(effectiveFilters);
        
        // If backend has products, return them
        if (backendResult?.data && backendResult.data.length > 0) {
          return {
            ...backendResult,
            _source: 'backend' as const,
            _syncStatus: {
              backend: backendResult.data.length,
              frontend: 0,
              total: backendResult.data.length
            }
          };
        }
        
        // Backend returned empty, fallback to frontend products
        logger.info('Backend returned empty products, falling back to frontend products');
        return await getFrontendProductsFallback(effectiveFilters);
      } catch (error: any) {
        // Check if in demo mode
        const token = localStorage.getItem('nebula_access_token');
        const isDemo = token?.startsWith('demo-') || false;
        
        // Enhanced error handling with better messages
        if (error?.status === 401) {
          // Bei Demo-Mode: Ignoriere 401, kein Logout
          if (isDemo) {
            logger.warn('401 error in demo mode - falling back to frontend products', { error });
            return await getFrontendProductsFallback(effectiveFilters);
          }
          
          // Nur bei echtem 401 und nicht Demo: Clear auth
          localStorage.removeItem('nebula_access_token');
          localStorage.removeItem('nebula_refresh_token');
          if (typeof window !== 'undefined') {
            const { useAuthStore } = await import('../store/auth');
            const authState = useAuthStore.getState();
            // Nur clear wenn nicht Demo
            if (!authState.isDemoMode) {
              authState._clearAuth();
              window.location.reload();
            }
          }
          throw new Error('Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.');
        } else if (error?.status === 403) {
          throw new Error('Keine Berechtigung zum Abrufen der Produkte.');
        } else if (error?.status === 404) {
          // 404 might mean endpoint doesn't exist, try frontend fallback
          logger.info('404 error - falling back to frontend products');
          return await getFrontendProductsFallback(effectiveFilters);
        } else if (error?.status === 500) {
          // Server error, try frontend fallback
          logger.warn('500 error - falling back to frontend products', { error });
          return await getFrontendProductsFallback(effectiveFilters);
        } else if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('Failed to fetch')) {
          // Network error - fallback to frontend products
          logger.info('Network error - falling back to frontend products');
          return await getFrontendProductsFallback(effectiveFilters);
        } else if (error?.message?.includes('timeout')) {
          // Timeout - try frontend fallback
          logger.warn('Timeout error - falling back to frontend products');
          return await getFrontendProductsFallback(effectiveFilters);
        }
        // For other errors, try frontend fallback as last resort
        logger.warn('Unknown error - falling back to frontend products', { error });
        return await getFrontendProductsFallback(effectiveFilters);
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - increased for better performance
    gcTime: 15 * 60 * 1000, // 15 minutes - keep data longer in cache
    placeholderData: (previousData) => previousData, // Use previous data as placeholder for instant UI
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (except 429 rate limit)
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter: 1s, 2s, 4s
      const baseDelay = 1000 * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 1000;
      return Math.min(baseDelay + jitter, 10000);
    },
    // Better error handling
    throwOnError: false, // Don't throw, let components handle errors
    refetchOnWindowFocus: false, // Disabled for better performance
    refetchOnReconnect: true,
    refetchOnMount: false, // Only refetch if data is stale
    select: (data) => {
      // Additional client-side filtering for drops if needed
      if (filters?.excludeDrops && data?.data) {
        return {
          ...data,
          data: data.data.filter((p: any) => p.type !== 'drop')
        };
      }
      // Ensure _source and _syncStatus are preserved
      return {
        ...data,
        _source: (data as any)._source || 'backend',
        _syncStatus: (data as any)._syncStatus || {
          backend: data?.data?.length || 0,
          frontend: 0,
          total: data?.data?.length || 0
        }
      };
    },
  });
};

// Get products with infinite scroll (cursor-based pagination)
export const useInfiniteProducts = (filters?: Omit<ProductFilters, 'offset' | 'limit'>) => {
  return useInfiniteQuery({
    queryKey: queryKeys.products.infinite(filters),
    queryFn: ({ pageParam = 0 }) => {
      return productsApi.getProducts({
        ...filters,
        offset: pageParam,
        limit: 50,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + (page.data?.length || 0), 0);
      if (lastPage.pagination?.hasMore) {
        return totalLoaded;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes (optimized)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      products: data.pages.flatMap(page => page.data || []),
      total: data.pages[0]?.total || 0,
    }),
  });
};

// Get single product
export const useProduct = (productId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => productsApi.getProduct(productId),
    enabled: enabled && !!productId,
    select: (data) => data.data,
  });
};

// Create product with optimistic updates
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: Partial<Product>) => productsApi.createProduct(product),
    onMutate: async (newProduct) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.list() });
      
      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(queryKeys.products.list());
      
      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticProduct: Product = {
        id: tempId,
        name: newProduct.name || 'Neues Produkt',
        categoryId: newProduct.categoryId || '',
        sku: newProduct.sku || `SKU-${tempId}`,
        description: newProduct.description || '',
        price: newProduct.price || 0,
        currency: newProduct.currency || 'EUR',
        inventory: newProduct.inventory || 0,
        status: (newProduct.status as any) || 'draft',
        featured: newProduct.featured || false,
        access: newProduct.access || 'standard',
        type: newProduct.type || 'shop',
        variants: newProduct.variants || [],
        media: newProduct.media || [],
        badges: newProduct.badges || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newProduct
      };
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.products.list(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: [optimisticProduct, ...old.data],
          total: (old.total || old.data.length) + 1
        };
      });
      
      return { previousProducts, tempId };
    },
    onError: (err, newProduct, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products.list(), context.previousProducts);
      }
      logger.error('Failed to create product', { error: err, product: newProduct });
    },
    onSuccess: (data, variables, context) => {
      // Replace temporary product with real one
      queryClient.setQueryData(queryKeys.products.list(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((p: Product) => 
            p.id === context?.tempId ? data.data : p
          )
        };
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.metrics });
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (except 429 rate limit)
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      // Retry up to 2 times for network/server errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s
      return 1000 * Math.pow(2, attemptIndex);
    },
  });
};

// Update product with optimistic updates
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, product }: { id: string; product: Partial<Product> }) =>
      productsApi.updateProduct(id, product),
    onMutate: async ({ id, product }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.list() });
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(id) });

      // Snapshot previous values
      const previousProducts = queryClient.getQueryData(queryKeys.products.list());
      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(id));

      // Optimistically update
      queryClient.setQueryData(queryKeys.products.detail(id), (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, ...product } };
      });

      queryClient.setQueryData(queryKeys.products.list(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((p: Product) => p.id === id ? { ...p, ...product } : p)
        };
      });

      return { previousProducts, previousProduct };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products.list(), context.previousProducts);
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(variables.id), context.previousProduct);
      }
      logger.error('Failed to update product', { error: err, productId: variables.id });
    },
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => 1000 * Math.pow(2, attemptIndex),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() });
    },
  });
};

// Delete product with optimistic updates
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => productsApi.deleteProduct(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.list() });
      const previousProducts = queryClient.getQueryData(queryKeys.products.list());
      
      queryClient.setQueryData(queryKeys.products.list(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((p: Product) => p.id !== productId)
        };
      });

      return { previousProducts };
    },
    onError: (err, productId, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products.list(), context.previousProducts);
      }
      logger.error('Failed to delete product', { error: err, productId });
    },
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => 1000 * Math.pow(2, attemptIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
    },
  });
};

// Update product variants
export const useUpdateProductVariants = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, variants }: { id: string; variants: any[] }) =>
      productsApi.updateProductVariants(id, variants),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(id) });
    },
  });
};

// Update variant stock
export const useUpdateVariantStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, variantStocks }: { id: string; variantStocks: Array<{ variantId: string; stock: number }> }) =>
      productsApi.updateVariantStock(id, variantStocks),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() });
    },
  });
};

// Upload product images
export const useUploadProductImages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, images }: { id: string; images: Array<{ url: string; alt?: string }> }) =>
      productsApi.uploadProductImages(id, images),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },
  });
};

// Bulk import products
export const useBulkImportProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (products: Partial<Product>[]) => productsApi.bulkImportProducts(products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.metrics });
    },
  });
};

// Duplicate product
export const useDuplicateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName?: string }) =>
      productsApi.duplicateProduct(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
    },
  });
};

// Bulk generate products for categories
export const useBulkGenerateProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categories, count }: { categories: Array<{ id: string; name: string; icon?: string; description?: string }>; count?: number }) =>
      productsApi.bulkGenerateProducts(categories, count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
    },
  });
};

// ==================== CATEGORY HOOKS ====================

// Get all categories with frontend fallback
export const useCategories = (filters?: any & { type?: 'shop' | 'drop' }) => {
  const effectiveFilters = filters || {};
  
  return useQuery({
    queryKey: queryKeys.categories.list({ ...effectiveFilters, type: effectiveFilters.type }),
    queryFn: async () => {
      try {
        const backendResult = await categoriesApi.getCategories(effectiveFilters);
        
        // If backend has categories, return them
        if (backendResult?.data && backendResult.data.length > 0) {
          return {
            ...backendResult,
            _source: 'backend' as const,
            _syncStatus: {
              backend: backendResult.data.length,
              frontend: 0,
              total: backendResult.data.length
            }
          };
        }
        
        // Backend returned empty, fallback to frontend categories
        logger.info('Backend returned empty categories, falling back to frontend categories');
        return await getFrontendCategoriesFallback(effectiveFilters);
      } catch (error: any) {
        // Check if in demo mode
        const token = localStorage.getItem('nebula_access_token');
        const isDemo = token?.startsWith('demo-') || false;
        
        // Enhanced error handling with better messages
        if (error?.status === 401) {
          // Bei Demo-Mode: Ignoriere 401, kein Logout
          if (isDemo) {
            logger.warn('401 error in demo mode - falling back to frontend categories', { error });
            return await getFrontendCategoriesFallback(effectiveFilters);
          }
          
          // Nur bei echtem 401 und nicht Demo: Clear auth
          localStorage.removeItem('nebula_access_token');
          localStorage.removeItem('nebula_refresh_token');
          if (typeof window !== 'undefined') {
            const { useAuthStore } = await import('../store/auth');
            const authState = useAuthStore.getState();
            // Nur clear wenn nicht Demo
            if (!authState.isDemoMode) {
              authState._clearAuth();
              window.location.reload();
            }
          }
          throw new Error('Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.');
        } else if (error?.status === 403) {
          throw new Error('Keine Berechtigung zum Abrufen der Kategorien.');
        } else if (error?.status === 404) {
          // 404 might mean endpoint doesn't exist, try frontend fallback
          logger.info('404 error - falling back to frontend categories');
          return await getFrontendCategoriesFallback(effectiveFilters);
        } else if (error?.status === 500) {
          // Server error, try frontend fallback
          logger.warn('500 error - falling back to frontend categories', { error });
          return await getFrontendCategoriesFallback(effectiveFilters);
        } else if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('Failed to fetch')) {
          // Network error - fallback to frontend categories
          logger.info('Network error - falling back to frontend categories');
          return await getFrontendCategoriesFallback(effectiveFilters);
        } else if (error?.message?.includes('timeout')) {
          // Timeout - try frontend fallback
          logger.warn('Timeout error - falling back to frontend categories');
          return await getFrontendCategoriesFallback(effectiveFilters);
        }
        // For other errors, try frontend fallback as last resort
        logger.warn('Unknown error - falling back to frontend categories', { error });
        return await getFrontendCategoriesFallback(effectiveFilters);
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    gcTime: 15 * 60 * 1000, // 15 minutes - keep data longer in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Only refetch if data is stale
    placeholderData: (previousData) => previousData, // Use previous data as placeholder for instant UI
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (except 429 rate limit)
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter: 1s, 2s, 4s
      const baseDelay = 1000 * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 1000;
      return Math.min(baseDelay + jitter, 10000);
    },
    throwOnError: false, // Don't throw, let components handle errors
    select: (data) => {
      // Ensure _source and _syncStatus are preserved
      const result = {
        ...data,
        _source: (data as any)._source || 'backend',
        _syncStatus: (data as any)._syncStatus || {
          backend: data?.data?.length || 0,
          frontend: 0,
          total: data?.data?.length || 0
        }
      };
      
      // Client-side filtering by type if needed
      if (effectiveFilters.type && result.data) {
        return {
          ...result,
          data: result.data.filter((cat: any) => {
            // If category has type field, filter by it
            if (cat.type) return cat.type === effectiveFilters.type;
            // Otherwise, infer from category name or other fields
            // This is a fallback - backend should handle this ideally
            return true;
          })
        };
      }
      return result;
    },
  });
};

// Get category tree
export const useCategoryTree = (parentId?: string) => {
  return useQuery({
    queryKey: queryKeys.categories.tree(parentId),
    queryFn: () => categoriesApi.getCategoryTree(parentId),
    staleTime: 60 * 1000,
    select: (data) => data.data,
  });
};

// Get single category
export const useCategory = (categoryId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.categories.detail(categoryId),
    queryFn: () => categoriesApi.getCategory(categoryId),
    enabled: enabled && !!categoryId,
    select: (data) => data.data,
  });
};

// Get category analytics
export const useCategoryAnalytics = (categoryId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.categories.analytics(categoryId),
    queryFn: () => categoriesApi.getCategoryAnalytics(categoryId),
    enabled: enabled && !!categoryId,
    staleTime: 60 * 1000,
    select: (data) => data.data,
  });
};

// Create category with optimistic updates
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category: Partial<Category>) => categoriesApi.createCategory(category),
    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.list() });
      const previousCategories = queryClient.getQueryData(queryKeys.categories.list());
      
      const tempId = `temp-${Date.now()}`;
      const optimisticCategory: Category = {
        id: tempId,
        slug: newCategory.slug || `category-${tempId}`,
        name: newCategory.name || 'Neue Kategorie',
        description: newCategory.description || '',
        icon: newCategory.icon || '📦',
        order: newCategory.order || 0,
        featured: newCategory.featured || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newCategory
      };
      
      queryClient.setQueryData(queryKeys.categories.list(), (old: any) => {
        if (!old) return [optimisticCategory];
        if (Array.isArray(old)) return [...old, optimisticCategory];
        if (old.data) return { ...old, data: [...old.data, optimisticCategory] };
        return old;
      });
      
      return { previousCategories, tempId };
    },
    onError: (err, newCategory, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(queryKeys.categories.list(), context.previousCategories);
      }
      logger.error('Failed to create category', { error: err, category: newCategory });
    },
    onSuccess: (data, variables, context) => {
      // Replace temporary category with real one
      queryClient.setQueryData(queryKeys.categories.list(), (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((c: Category) => c.id === context?.tempId ? data.data : c);
        }
        if (old.data) {
          return {
            ...old,
            data: old.data.map((c: Category) => c.id === context?.tempId ? data.data : c)
          };
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.tree() });
    },
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => 1000 * Math.pow(2, attemptIndex),
  });
};

// Update category
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, category }: { id: string; category: Partial<Category> }) =>
      categoriesApi.updateCategory(id, category),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.tree() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(id) });
    },
  });
};

// Update category order
export const useUpdateCategoryOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, order }: { id: string; order: number }) =>
      categoriesApi.updateCategoryOrder(id, order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.tree() });
    },
  });
};

// Bulk update category order
export const useBulkUpdateCategoryOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Array<{ categoryId: string; order: number }>) =>
      categoriesApi.bulkUpdateCategoryOrder(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.tree() });
    },
  });
};

// Delete category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => categoriesApi.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.tree() });
    },
  });
};

// ==================== INVENTORY HOOKS ====================

// Get inventory
export const useInventory = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.inventory.list(filters),
    queryFn: () => inventoryApi.getInventory(filters),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    select: (data) => data.data,
  });
};

// Get low stock items
export const useLowStockItems = (threshold?: number) => {
  return useQuery({
    queryKey: queryKeys.inventory.lowStock(threshold),
    queryFn: () => inventoryApi.getLowStockItems(threshold),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    select: (data) => data.data,
  });
};

// Get stock history
export const useStockHistory = (productId: string, limit?: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.inventory.history(productId, limit),
    queryFn: () => inventoryApi.getStockHistory(productId, limit),
    enabled: enabled && !!productId,
    staleTime: 15 * 1000,
    select: (data) => data.data,
  });
};

// Adjust stock
export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, adjustment, reason, location }: { 
      productId: string; 
      adjustment: number; 
      reason?: string; 
      location?: string;
    }) =>
      inventoryApi.adjustStock(productId, adjustment, reason, location),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.history(productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
    },
  });
};

// Reserve stock
export const useReserveStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity, orderId }: { productId: string; quantity: number; orderId: string }) =>
      inventoryApi.reserveStock(productId, quantity, orderId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(productId) });
    },
  });
};

// Release stock
export const useReleaseStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity, orderId }: { productId: string; quantity: number; orderId: string }) =>
      inventoryApi.releaseStock(productId, quantity, orderId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(productId) });
    },
  });
};

// Configure auto-reorder
export const useConfigureAutoReorder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: {
      productId: string;
      enabled?: boolean;
      reorderPoint?: number;
      reorderQuantity?: number;
      supplier?: string;
      leadTime?: number;
    }) => inventoryApi.configureAutoReorder(config),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.autoReorder });
    },
  });
};

// Check auto-reorder
export const useCheckAutoReorder = () => {
  return useQuery({
    queryKey: queryKeys.inventory.autoReorder,
    queryFn: () => inventoryApi.checkAutoReorder(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
};

// ==================== ANALYTICS HOOKS ====================

// Get sales analytics
export const useSalesAnalytics = (params?: {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.analytics.sales(params),
    queryFn: () => analyticsApi.getSalesAnalytics(params),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    select: (data) => data.data,
  });
};

// Get revenue reports
export const useRevenueReports = (startDate: string, endDate: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.analytics.revenue(startDate, endDate),
    queryFn: () => analyticsApi.getRevenueReports(startDate, endDate),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 60 * 1000,
    select: (data) => data.data,
  });
};

// Get bestsellers
export const useBestsellers = (params?: {
  limit?: number;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.analytics.bestsellers(params),
    queryFn: () => analyticsApi.getBestsellers(params),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    select: (data) => data.data,
  });
};

// Get category performance
export const useCategoryPerformance = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.analytics.categoryPerformance(params),
    queryFn: () => analyticsApi.getCategoryPerformance(params),
    staleTime: 2 * 60 * 1000,
    select: (data) => data.data,
  });
};

// Get customer analytics
export const useCustomerAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.analytics.customers,
    queryFn: () => analyticsApi.getCustomerAnalytics(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    select: (data) => data.data,
  });
};

// Get dashboard metrics with improved error handling
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard,
    queryFn: async () => {
      try {
        const response = await analyticsApi.getDashboardMetrics();
        return response;
      } catch (error) {
        logger.error('Failed to fetch dashboard metrics', { error });
        // Return default structure to prevent crashes
        return {
          data: {
            todayRevenue: 0,
            todayOrders: 0,
            weekRevenue: 0,
            weekOrders: 0,
            monthRevenue: 0,
            monthOrders: 0,
            pendingOrders: 0,
            lowStockItems: 0,
            activeCustomers: 0,
            conversionRate: 0,
            averageOrderValue: 0,
            revenue: { today: 0, growth: 0 },
            orders: { pending: 0, total: 0 },
            inventory: { lowStock: 0, total: 0 },
            analytics: { liveVisitors: 0, visitorGrowth: 0 }
          }
        };
      }
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refresh every minute for real-time feel
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1 second between retries
    select: (data) => {
      // Ensure data structure exists
      if (!data || !data.data) {
        return {
          todayRevenue: 0,
          todayOrders: 0,
          weekRevenue: 0,
          weekOrders: 0,
          monthRevenue: 0,
          monthOrders: 0,
          pendingOrders: 0,
          lowStockItems: 0,
          activeCustomers: 0,
          conversionRate: 0,
          averageOrderValue: 0,
        };
      }
      return data.data;
    },
  });
};

