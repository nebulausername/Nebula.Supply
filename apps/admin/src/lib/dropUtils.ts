import type { Drop } from '@nebula/shared';

/**
 * Utility functions for Drop management
 */

export interface DropFilter {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notIn';
  value: any;
}

export interface DropSort {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Apply filters to drops array
 */
export function filterDrops(
  drops: Drop[],
  filters: DropFilter[]
): Drop[] {
  return drops.filter((drop) => {
    return filters.every((filter) => {
      const fieldValue = getNestedField(drop, filter.field);
      
      switch (filter.operator) {
        case 'equals':
          return fieldValue === filter.value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'gt':
          return Number(fieldValue) > Number(filter.value);
        case 'lt':
          return Number(fieldValue) < Number(filter.value);
        case 'gte':
          return Number(fieldValue) >= Number(filter.value);
        case 'lte':
          return Number(fieldValue) <= Number(filter.value);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(fieldValue);
        case 'notIn':
          return Array.isArray(filter.value) && !filter.value.includes(fieldValue);
        default:
          return true;
      }
    });
  });
}

/**
 * Sort drops array
 */
export function sortDrops(drops: Drop[], sort: DropSort): Drop[] {
  const sorted = [...drops];
  
  sorted.sort((a, b) => {
    const aValue = getNestedField(a, sort.field);
    const bValue = getNestedField(b, sort.field);
    
    // Handle null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    
    // Compare values
    let comparison = 0;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }
    
    return sort.direction === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

/**
 * Get nested field value from object
 */
function getNestedField(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => {
    return current?.[prop];
  }, obj);
}

/**
 * Search drops with fuzzy matching
 */
export function searchDrops(drops: Drop[], searchTerm: string): Drop[] {
  if (!searchTerm.trim()) return drops;
  
  const term = searchTerm.toLowerCase();
  
  return drops.filter((drop) => {
    // Search in name
    if (drop.name.toLowerCase().includes(term)) return true;
    
    // Search in badge
    if (drop.badge?.toLowerCase().includes(term)) return true;
    
    // Search in description
    if (drop.shortDescription?.toLowerCase().includes(term)) return true;
    
    // Search in flavor tag
    if (drop.flavorTag?.toLowerCase().includes(term)) return true;
    
    // Search in variants
    if (drop.variants?.some((v) => 
      v.label.toLowerCase().includes(term) ||
      v.description?.toLowerCase().includes(term)
    )) return true;
    
    return false;
  });
}

/**
 * Calculate drop statistics
 */
export function calculateDropStats(drops: Drop[]) {
  const stats = {
    total: drops.length,
    active: 0,
    inactive: 0,
    soldOut: 0,
    scheduled: 0,
    totalStock: 0,
    totalSold: 0,
    totalRevenue: 0,
    totalInterest: 0,
    byAccess: {
      free: 0,
      standard: 0,
      limited: 0,
      vip: 0,
    },
    byStatus: {
      active: 0,
      inactive: 0,
      sold_out: 0,
      scheduled: 0,
    },
  };
  
  drops.forEach((drop) => {
    // Count by status
    if (drop.status === 'active') stats.active++;
    if (drop.status === 'inactive') stats.inactive++;
    if (drop.status === 'sold_out') stats.soldOut++;
    if (drop.status === 'scheduled') stats.scheduled++;
    
    // Count by access
    if (drop.access === 'free') stats.byAccess.free++;
    if (drop.access === 'standard') stats.byAccess.standard++;
    if (drop.access === 'limited') stats.byAccess.limited++;
    if (drop.access === 'vip') stats.byAccess.vip++;
    
    // Calculate stock and revenue
    const stock = drop.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
    const sold = drop.variants?.reduce((sum, v) => sum + (v.sold || 0), 0) || 0;
    const revenue = drop.variants?.reduce((sum, v) => 
      sum + ((v.sold || 0) * (v.price || 0)), 0) || 0;
    
    stats.totalStock += stock;
    stats.totalSold += sold;
    stats.totalRevenue += revenue;
    stats.totalInterest += drop.interestCount || 0;
  });
  
  return stats;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-green-400',
    inactive: 'text-gray-400',
    sold_out: 'text-red-400',
    scheduled: 'text-yellow-400',
  };
  return colors[status] || 'text-gray-400';
}

/**
 * Get access color
 */
export function getAccessColor(access: string): string {
  const colors: Record<string, string> = {
    free: 'text-green-400',
    standard: 'text-blue-400',
    limited: 'text-yellow-400',
    vip: 'text-purple-400',
  };
  return colors[access] || 'text-gray-400';
}

/**
 * Check if drop is low stock
 */
export function isLowStock(drop: Drop, threshold: number = 10): boolean {
  const availableStock = drop.variants?.reduce((sum, v) => 
    sum + Math.max(0, (v.stock || 0) - (v.sold || 0)), 0) || 0;
  return availableStock <= threshold && availableStock > 0;
}

/**
 * Check if drop is out of stock
 */
export function isOutOfStock(drop: Drop): boolean {
  const availableStock = drop.variants?.reduce((sum, v) => 
    sum + Math.max(0, (v.stock || 0) - (v.sold || 0)), 0) || 0;
  return availableStock === 0;
}

/**
 * Get available stock for drop
 */
export function getAvailableStock(drop: Drop): number {
  return drop.variants?.reduce((sum, v) => 
    sum + Math.max(0, (v.stock || 0) - (v.sold || 0)), 0) || 0;
}

/**
 * Get total stock for drop
 */
export function getTotalStock(drop: Drop): number {
  return drop.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
}

/**
 * Get total sold for drop
 */
export function getTotalSold(drop: Drop): number {
  return drop.variants?.reduce((sum, v) => sum + (v.sold || 0), 0) || 0;
}

/**
 * Get revenue for drop
 */
export function getRevenue(drop: Drop): number {
  return drop.variants?.reduce((sum, v) => 
    sum + ((v.sold || 0) * (v.price || 0)), 0) || 0;
}

/**
 * Get progress percentage
 */
export function getProgress(drop: Drop): number {
  const total = getTotalStock(drop);
  const sold = getTotalSold(drop);
  if (total === 0) return 0;
  return (sold / total) * 100;
}

/**
 * Export drops to CSV
 */
export function exportDropsToCSV(drops: Drop[], fields: string[]): string {
  const headers = fields.join(',');
  const rows = drops.map((drop) => {
    return fields.map((field) => {
      const value = getNestedField(drop, field);
      // Escape commas and quotes
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });
  
  return [headers, ...rows].join('\n');
}

/**
 * Export drops to JSON
 */
export function exportDropsToJSON(drops: Drop[], fields: string[]): string {
  const data = drops.map((drop) => {
    const exported: Record<string, any> = {};
    fields.forEach((field) => {
      exported[field] = getNestedField(drop, field);
    });
    return exported;
  });
  
  return JSON.stringify(data, null, 2);
}

/**
 * Clone drop object
 */
export function cloneDrop(drop: Drop): Omit<Drop, 'id' | 'createdAt'> {
  const cloned = { ...drop };
  delete (cloned as any).id;
  delete (cloned as any).createdAt;
  delete (cloned as any).updatedAt;
  
  // Clone variants
  if (cloned.variants) {
    cloned.variants = cloned.variants.map((v) => {
      const variant = { ...v };
      delete (variant as any).id;
      return variant;
    });
  }
  
  return cloned;
}

/**
 * Validate drop data
 */
export function validateDrop(drop: Partial<Drop>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!drop.name || drop.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!drop.variants || drop.variants.length === 0) {
    errors.push('At least one variant is required');
  }
  
  if (drop.variants) {
    drop.variants.forEach((variant, index) => {
      if (!variant.label) {
        errors.push(`Variant ${index + 1}: Label is required`);
      }
      if (variant.price == null || variant.price < 0) {
        errors.push(`Variant ${index + 1}: Valid price is required`);
      }
      if (variant.stock == null || variant.stock < 0) {
        errors.push(`Variant ${index + 1}: Valid stock is required`);
      }
    });
  }
  
  if (drop.minQuantity != null && drop.minQuantity < 1) {
    errors.push('Minimum quantity must be at least 1');
  }
  
  if (drop.maxPerUser != null && drop.maxPerUser < 1) {
    errors.push('Max per user must be at least 1');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate drop preview data
 */
export function generateDropPreview(drop: Partial<Drop>): Partial<Drop> {
  return {
    ...drop,
    id: `preview_${Date.now()}`,
    status: drop.status || 'draft',
    interestCount: 0,
    progress: 0,
  };
}

