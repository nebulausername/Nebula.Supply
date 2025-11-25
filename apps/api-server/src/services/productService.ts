import { WebSocketServer } from '../websocket/server';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import type { Product, ProductVariant, ProductMedia } from '@nebula/shared';

// Extended Product interface for admin management
export interface AdminProduct extends Product {
  status: 'active' | 'inactive' | 'draft' | 'archived';
  featured?: boolean;
  access?: 'free' | 'limited' | 'vip' | 'standard';
  type?: 'shop' | 'drop';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  metaTags?: Record<string, string>;
  bundleProducts?: string[]; // Array of product IDs for bundle products
  isBundle?: boolean;
  bundlePrice?: number; // Special price for bundle (if different from sum)
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

export interface ProductMetrics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  draftProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventory: number;
  totalValue: number;
  averagePrice: number;
  featuredProducts: number;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; product: any; error: string }>;
  imported: AdminProduct[];
}

export interface VariantStock {
  variantId: string;
  stock: number;
  sku?: string;
}

export class ProductService {
  private wsServer: WebSocketServer;

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  // Create new product
  async createProduct(productData: Partial<AdminProduct>): Promise<AdminProduct> {
    try {
      const now = new Date().toISOString();
      const product: AdminProduct = {
        id: this.generateProductId(),
        name: productData.name || '',
        categoryId: productData.categoryId || '',
        sku: productData.sku || this.generateSKU(),
        description: productData.description || '',
        price: productData.price || 0,
        currency: productData.currency || 'EUR',
        leadTime: productData.leadTime || '1-2 weeks',
        inventory: productData.inventory || 0,
        interest: productData.interest || 0,
        variants: productData.variants || [],
        media: productData.media || [],
        badges: productData.badges || [],
        shippingOptions: productData.shippingOptions || [],
        status: productData.status || 'draft',
        featured: productData.featured || false,
        access: productData.access || 'standard',
        type: productData.type || 'shop',
        bundleProducts: productData.bundleProducts || [],
        isBundle: productData.isBundle || false,
        bundlePrice: productData.bundlePrice,
        seoTitle: productData.seoTitle,
        seoDescription: productData.seoDescription,
        seoKeywords: productData.seoKeywords,
        metaTags: productData.metaTags,
        createdAt: now,
        updatedAt: now,
        publishedAt: productData.status === 'active' ? now : undefined,
        ...productData
      };

      const createdProduct = await databaseService.create<AdminProduct>('products', product);

      // Broadcast product created event
      await this.broadcastProductUpdate('product:created', {
        productId: createdProduct.id,
        product: createdProduct,
        timestamp: now
      });

      logger.info('Product created', { productId: createdProduct.id, name: createdProduct.name });
      return createdProduct;
    } catch (error) {
      logger.error('Failed to create product', { error: error.message, productData });
      throw error;
    }
  }

  // Get products with filters
  async getProducts(filters: ProductFilters = {}): Promise<{ products: AdminProduct[]; total: number; metrics: ProductMetrics }> {
    try {
      const allProducts = await databaseService.findMany<AdminProduct>('products');
      
      let filteredProducts = allProducts;

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        filteredProducts = filteredProducts.filter(product => filters.status!.includes(product.status));
      }

      if (filters.categoryId) {
        filteredProducts = filteredProducts.filter(product => product.categoryId === filters.categoryId);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm) ||
          product.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.price >= filters.minPrice!);
      }

      if (filters.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.price <= filters.maxPrice!);
      }

      if (filters.featured !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.featured === filters.featured);
      }

      if (filters.access && filters.access.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          product.access && filters.access!.includes(product.access)
        );
      }

      if (filters.type && filters.type.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          product.type && filters.type!.includes(product.type)
        );
      }

      if (filters.inStock !== undefined) {
        filteredProducts = filteredProducts.filter(product => 
          filters.inStock ? product.inventory > 0 : product.inventory === 0
        );
      }

      if (filters.lowStock !== undefined) {
        filteredProducts = filteredProducts.filter(product => 
          filters.lowStock ? product.inventory > 0 && product.inventory < 10 : product.inventory >= 10
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredProducts.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (filters.sortBy) {
            case 'name':
              aValue = a.name;
              bValue = b.name;
              break;
            case 'price':
              aValue = a.price;
              bValue = b.price;
              break;
            case 'inventory':
              aValue = a.inventory;
              bValue = b.inventory;
              break;
            case 'createdAt':
              aValue = new Date(a.createdAt);
              bValue = new Date(b.createdAt);
              break;
            case 'updatedAt':
              aValue = new Date(a.updatedAt);
              bValue = new Date(b.updatedAt);
              break;
            case 'popularity':
              aValue = a.popularity || 0;
              bValue = b.popularity || 0;
              break;
            default:
              aValue = a.name;
              bValue = b.name;
          }

          const order = filters.sortOrder === 'desc' ? -1 : 1;
          return aValue > bValue ? order : aValue < bValue ? -order : 0;
        });
      }

      // Apply pagination
      const total = filteredProducts.length;
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      const paginatedProducts = filteredProducts.slice(offset, offset + limit);

      // Calculate metrics
      const metrics = await this.calculateProductMetrics(allProducts);

      return {
        products: paginatedProducts,
        total,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get products', { error: error.message, filters });
      throw error;
    }
  }

  // Get single product
  async getProduct(productId: string): Promise<AdminProduct | null> {
    try {
      const product = await databaseService.findById<AdminProduct>('products', productId);
      return product;
    } catch (error) {
      logger.error('Failed to get product', { error: error.message, productId });
      throw error;
    }
  }

  // Update product
  async updateProduct(productId: string, updates: Partial<AdminProduct>): Promise<AdminProduct> {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const now = new Date().toISOString();
      const updatedProduct = await databaseService.update<AdminProduct>('products', productId, {
        ...updates,
        updatedAt: now,
        publishedAt: updates.status === 'active' && product.status !== 'active' 
          ? now 
          : product.publishedAt
      });

      if (!updatedProduct) {
        throw new Error('Failed to update product');
      }

      // Broadcast update
      await this.broadcastProductUpdate('product:updated', {
        productId,
        changes: updates,
        product: updatedProduct,
        timestamp: now
      });

      logger.info('Product updated', { productId, updates });
      return updatedProduct;
    } catch (error) {
      logger.error('Failed to update product', { error: error.message, productId, updates });
      throw error;
    }
  }

  // Delete product
  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      await databaseService.delete('products', productId);

      // Broadcast deletion
      await this.broadcastProductUpdate('product:deleted', {
        productId,
        timestamp: new Date().toISOString()
      });

      logger.info('Product deleted', { productId });
      return true;
    } catch (error) {
      logger.error('Failed to delete product', { error: error.message, productId });
      throw error;
    }
  }

  // Update product variants
  async updateProductVariants(productId: string, variants: ProductVariant[]): Promise<AdminProduct> {
    try {
      return await this.updateProduct(productId, { variants });
    } catch (error) {
      logger.error('Failed to update product variants', { error: error.message, productId });
      throw error;
    }
  }

  // Update variant stock
  async updateVariantStock(productId: string, variantStocks: VariantStock[]): Promise<AdminProduct> {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Update variant stocks
      if (product.variants) {
        product.variants = product.variants.map(variant => {
          const stockUpdate = variantStocks.find(vs => vs.variantId === variant.name);
          if (stockUpdate) {
            // Find the option and update its stock
            variant.options = variant.options.map(option => {
              if (option.id === stockUpdate.variantId) {
                return { ...option, stock: stockUpdate.stock };
              }
              return option;
            });
          }
          return variant;
        });
      }

      // Recalculate total inventory
      const totalInventory = this.calculateTotalInventory(product);
      
      return await this.updateProduct(productId, {
        variants: product.variants,
        inventory: totalInventory
      });
    } catch (error) {
      logger.error('Failed to update variant stock', { error: error.message, productId });
      throw error;
    }
  }

  // Upload product images
  async uploadProductImages(productId: string, images: ProductMedia[]): Promise<AdminProduct> {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const updatedMedia = [...(product.media || []), ...images];
      
      return await this.updateProduct(productId, { media: updatedMedia });
    } catch (error) {
      logger.error('Failed to upload product images', { error: error.message, productId });
      throw error;
    }
  }

  // Bulk import products
  async bulkImportProducts(products: Partial<AdminProduct>[]): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      imported: []
    };

    for (let i = 0; i < products.length; i++) {
      try {
        const product = await this.createProduct(products[i]);
        result.success++;
        result.imported.push(product);
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          product: products[i],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Broadcast bulk import
    await this.broadcastProductUpdate('product:bulk_imported', {
      result,
      timestamp: new Date().toISOString()
    });

    logger.info('Bulk product import completed', result);
    return result;
  }

  // Duplicate product
  async duplicateProduct(productId: string, newName?: string): Promise<AdminProduct> {
    try {
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const duplicated: Partial<AdminProduct> = {
        ...product,
        id: undefined, // Will be generated
        name: newName || `${product.name} (Copy)`,
        sku: this.generateSKU(),
        status: 'draft',
        featured: false,
        createdAt: undefined,
        updatedAt: undefined
      };

      delete (duplicated as any).id;
      delete (duplicated as any).createdAt;
      delete (duplicated as any).updatedAt;

      return await this.createProduct(duplicated);
    } catch (error) {
      logger.error('Failed to duplicate product', { error: error.message, productId });
      throw error;
    }
  }

  // Calculate product metrics
  async calculateProductMetrics(products: AdminProduct[]): Promise<ProductMetrics> {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const inactiveProducts = products.filter(p => p.status === 'inactive').length;
    const draftProducts = products.filter(p => p.status === 'draft').length;
    const lowStockProducts = products.filter(p => p.inventory > 0 && p.inventory < 10).length;
    const outOfStockProducts = products.filter(p => p.inventory === 0).length;
    
    const totalInventory = products.reduce((sum, p) => sum + p.inventory, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.inventory), 0);
    const averagePrice = totalProducts > 0 
      ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts 
      : 0;
    const featuredProducts = products.filter(p => p.featured).length;

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      draftProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventory,
      totalValue,
      averagePrice,
      featuredProducts
    };
  }

  // Calculate total inventory from variants
  private calculateTotalInventory(product: AdminProduct): number {
    if (!product.variants || product.variants.length === 0) {
      return product.inventory || 0;
    }

    let total = 0;
    for (const variant of product.variants) {
      for (const option of variant.options) {
        total += option.stock || 0;
      }
    }
    return total;
  }

  // Broadcast product update
  private async broadcastProductUpdate(eventType: string, data: any): Promise<void> {
    try {
      if (this.wsServer) {
        this.wsServer.broadcast(eventType, data);
      }
    } catch (error) {
      logger.error('Failed to broadcast product update', { error: error.message, eventType, data });
    }
  }

  // Generate unique IDs
  private generateProductId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSKU(): string {
    return `SKU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
}

// Export singleton instance
let productServiceInstance: ProductService | null = null;

export const createProductService = (wsServer: WebSocketServer): ProductService => {
  if (!productServiceInstance) {
    productServiceInstance = new ProductService(wsServer);
  }
  return productServiceInstance;
};

export const getProductService = (): ProductService | null => productServiceInstance;


