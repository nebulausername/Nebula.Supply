import { WebSocketServer } from '../websocket/server';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import type { Category } from '@nebula/shared';
import { getProductService } from './productService';

// Extended Category interface for admin management
export interface AdminCategory extends Category {
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  metaTags?: Record<string, string>;
  imageUrl?: string;
  parentId?: string; // For hierarchical categories
  children?: AdminCategory[]; // Child categories
}

export interface CategoryFilters {
  featured?: boolean;
  search?: string;
  parentId?: string;
  sortBy?: 'name' | 'order' | 'products' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CategoryMetrics {
  totalCategories: number;
  featuredCategories: number;
  totalProducts: number;
  averageProductsPerCategory: number;
  topCategories: Array<{ categoryId: string; name: string; productCount: number; revenue: number }>;
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  totalProducts: number;
  totalRevenue: number;
  averagePrice: number;
  productTypes: {
    shop: number;
    drop: number;
  };
  lowProducts: boolean;
  highPerformance: boolean;
}

export class CategoryService {
  private wsServer: WebSocketServer;

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  // Create new category
  async createCategory(categoryData: Partial<AdminCategory>): Promise<AdminCategory> {
    try {
      const now = new Date().toISOString();
      const category: AdminCategory = {
        id: this.generateCategoryId(),
        slug: (categoryData.slug as any) || this.generateSlug(categoryData.name || '') as any,
        name: categoryData.name || '',
        description: categoryData.description || '',
        icon: categoryData.icon || '📦',
        order: categoryData.order || 0,
        featured: categoryData.featured || false,
        subItems: categoryData.subItems || [],
        type: categoryData.type || 'shop',
        createdAt: now,
        updatedAt: now,
        publishedAt: categoryData.featured ? now : undefined,
        seoTitle: categoryData.seoTitle,
        seoDescription: categoryData.seoDescription,
        seoKeywords: categoryData.seoKeywords,
        metaTags: categoryData.metaTags,
        imageUrl: categoryData.imageUrl,
        parentId: categoryData.parentId,
        ...categoryData
      };

      const createdCategory = await databaseService.create<AdminCategory>('categories', category);

      // Broadcast category created event
      await this.broadcastCategoryUpdate('category:created', {
        categoryId: createdCategory.id,
        category: createdCategory,
        timestamp: now
      });

      logger.info('Category created', { categoryId: createdCategory.id, name: createdCategory.name });
      return createdCategory;
    } catch (error) {
      logger.error('Failed to create category', { error: error.message, categoryData });
      throw error;
    }
  }

  // Get categories with filters
  async getCategories(filters: CategoryFilters = {}): Promise<{ categories: AdminCategory[]; total: number; metrics: CategoryMetrics }> {
    try {
      const allCategories = await databaseService.findMany<AdminCategory>('categories');
      
      let filteredCategories = allCategories;

      // Apply filters
      if (filters.featured !== undefined) {
        filteredCategories = filteredCategories.filter(category => category.featured === filters.featured);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredCategories = filteredCategories.filter(category =>
          category.name.toLowerCase().includes(searchTerm) ||
          category.description?.toLowerCase().includes(searchTerm) ||
          category.slug.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.parentId !== undefined) {
        if (filters.parentId === null) {
          // Get root categories (no parent)
          filteredCategories = filteredCategories.filter(category => !category.parentId);
        } else {
          filteredCategories = filteredCategories.filter(category => category.parentId === filters.parentId);
        }
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredCategories.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (filters.sortBy) {
            case 'name':
              aValue = a.name;
              bValue = b.name;
              break;
            case 'order':
              aValue = a.order || 0;
              bValue = b.order || 0;
              break;
            case 'products':
              // This would require product count calculation
              aValue = 0;
              bValue = 0;
              break;
            case 'createdAt':
              aValue = new Date(a.createdAt);
              bValue = new Date(b.createdAt);
              break;
            default:
              aValue = a.order || 0;
              bValue = b.order || 0;
          }

          const order = filters.sortOrder === 'desc' ? -1 : 1;
          return aValue > bValue ? order : aValue < bValue ? -order : 0;
        });
      }

      // Apply pagination
      const total = filteredCategories.length;
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      const paginatedCategories = filteredCategories.slice(offset, offset + limit);

      // Calculate metrics
      const metrics = await this.calculateCategoryMetrics(allCategories);

      return {
        categories: paginatedCategories,
        total,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get categories', { error: error.message, filters });
      throw error;
    }
  }

  // Get single category
  async getCategory(categoryId: string): Promise<AdminCategory | null> {
    try {
      const category = await databaseService.findById<AdminCategory>('categories', categoryId);
      return category;
    } catch (error) {
      logger.error('Failed to get category', { error: error.message, categoryId });
      throw error;
    }
  }

  // Get category with children (hierarchical)
  async getCategoryTree(parentId?: string): Promise<AdminCategory[]> {
    try {
      const allCategories = await databaseService.findMany<AdminCategory>('categories');
      
      const rootCategories = parentId
        ? allCategories.filter(c => c.parentId === parentId)
        : allCategories.filter(c => !c.parentId);

      // Recursively build tree
      const buildTree = (parent: AdminCategory): AdminCategory => {
        const children = allCategories.filter(c => c.parentId === parent.id);
        return {
          ...parent,
          children: children.map(buildTree)
        };
      };

      return rootCategories.map(buildTree);
    } catch (error) {
      logger.error('Failed to get category tree', { error: error.message, parentId });
      throw error;
    }
  }

  // Update category
  async updateCategory(categoryId: string, updates: Partial<AdminCategory>): Promise<AdminCategory> {
    try {
      const category = await this.getCategory(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      const now = new Date().toISOString();
      const updatedCategory = await databaseService.update<AdminCategory>('categories', categoryId, {
        ...updates,
        updatedAt: now,
        publishedAt: updates.featured && !category.featured 
          ? now 
          : category.publishedAt
      });

      if (!updatedCategory) {
        throw new Error('Failed to update category');
      }

      // Broadcast update
      await this.broadcastCategoryUpdate('category:updated', {
        categoryId,
        changes: updates,
        category: updatedCategory,
        timestamp: now
      });

      logger.info('Category updated', { categoryId, updates });
      return updatedCategory;
    } catch (error) {
      logger.error('Failed to update category', { error: error.message, categoryId, updates });
      throw error;
    }
  }

  // Update category order
  async updateCategoryOrder(categoryId: string, order: number): Promise<AdminCategory> {
    try {
      return await this.updateCategory(categoryId, { order });
    } catch (error) {
      logger.error('Failed to update category order', { error: error.message, categoryId, order });
      throw error;
    }
  }

  // Bulk update category order
  async bulkUpdateCategoryOrder(updates: Array<{ categoryId: string; order: number }>): Promise<{ success: number; failed: number }> {
    const result = { success: 0, failed: 0 };

    for (const update of updates) {
      try {
        await this.updateCategoryOrder(update.categoryId, update.order);
        result.success++;
      } catch (error) {
        result.failed++;
        logger.error('Failed to update category order in bulk', { error: error.message, update });
      }
    }

    // Broadcast bulk update
    await this.broadcastCategoryUpdate('category:bulk_order_updated', {
      updates,
      result,
      timestamp: new Date().toISOString()
    });

    logger.info('Bulk category order update completed', result);
    return result;
  }

  // Delete category
  async deleteCategory(categoryId: string): Promise<boolean> {
    try {
      const category = await this.getCategory(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Check if category has children
      const allCategories = await databaseService.findMany<AdminCategory>('categories');
      const hasChildren = allCategories.some(c => c.parentId === categoryId);
      
      if (hasChildren) {
        throw new Error('Cannot delete category with child categories');
      }

      // Check if category has products
      const productService = getProductService();
      if (productService) {
        const { products } = await productService.getProducts({ categoryId });
        if (products.length > 0) {
          throw new Error('Cannot delete category with products');
        }
      }

      await databaseService.delete('categories', categoryId);

      // Broadcast deletion
      await this.broadcastCategoryUpdate('category:deleted', {
        categoryId,
        timestamp: new Date().toISOString()
      });

      logger.info('Category deleted', { categoryId });
      return true;
    } catch (error) {
      logger.error('Failed to delete category', { error: error.message, categoryId });
      throw error;
    }
  }

  // Get category analytics
  async getCategoryAnalytics(categoryId: string): Promise<CategoryAnalytics> {
    try {
      const category = await this.getCategory(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      const productService = getProductService();
      if (!productService) {
        throw new Error('Product service not available');
      }

      const { products } = await productService.getProducts({ categoryId });
      const totalProducts = products.length;
      const shopProducts = products.filter(p => p.type === 'shop').length;
      const dropProducts = products.filter(p => p.type === 'drop').length;
      const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.inventory), 0);
      const averagePrice = totalProducts > 0 
        ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts 
        : 0;

      return {
        categoryId,
        categoryName: category.name,
        totalProducts,
        totalRevenue,
        averagePrice,
        productTypes: {
          shop: shopProducts,
          drop: dropProducts
        },
        lowProducts: totalProducts < 5,
        highPerformance: totalProducts > 20
      };
    } catch (error) {
      logger.error('Failed to get category analytics', { error: error.message, categoryId });
      throw error;
    }
  }

  // Calculate category metrics
  async calculateCategoryMetrics(categories: AdminCategory[]): Promise<CategoryMetrics> {
    const totalCategories = categories.length;
    const featuredCategories = categories.filter(c => c.featured).length;

    // Get product counts per category
    const productService = getProductService();
    let totalProducts = 0;
    const topCategories: Array<{ categoryId: string; name: string; productCount: number; revenue: number }> = [];

    if (productService) {
      for (const category of categories) {
        try {
          const { products } = await productService.getProducts({ categoryId: category.id });
          const productCount = products.length;
          const revenue = products.reduce((sum, p) => sum + (p.price * p.inventory), 0);
          
          totalProducts += productCount;
          
          topCategories.push({
            categoryId: category.id,
            name: category.name,
            productCount,
            revenue
          });
        } catch (error) {
          logger.warn('Failed to get products for category', { categoryId: category.id, error: error.message });
        }
      }
    }

    // Sort by product count
    topCategories.sort((a, b) => b.productCount - a.productCount);

    const averageProductsPerCategory = totalCategories > 0 ? totalProducts / totalCategories : 0;

    return {
      totalCategories,
      featuredCategories,
      totalProducts,
      averageProductsPerCategory,
      topCategories: topCategories.slice(0, 10) // Top 10
    };
  }

  // Generate slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Broadcast category update
  private async broadcastCategoryUpdate(eventType: string, data: any): Promise<void> {
    try {
      if (this.wsServer) {
        this.wsServer.broadcast(eventType, data);
      }
    } catch (error) {
      logger.error('Failed to broadcast category update', { error: error.message, eventType, data });
    }
  }

  // Generate unique IDs
  private generateCategoryId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
let categoryServiceInstance: CategoryService | null = null;

export const createCategoryService = (wsServer: WebSocketServer): CategoryService => {
  if (!categoryServiceInstance) {
    categoryServiceInstance = new CategoryService(wsServer);
  }
  return categoryServiceInstance;
};

export const getCategoryService = (): CategoryService | null => categoryServiceInstance;

