import { useQuery } from '@tanstack/react-query';
import type { Drop, Product } from '@nebula/shared';

export interface PlatformStats {
  liveDrops: number;
  activeUsers: number;
  totalProducts: number;
  liveOrders: number;
  revenue: number;
  totalOrders: number;
}

export interface HomepageData {
  stats: PlatformStats;
  featuredDrops: Drop[];
  trendingProducts: Product[];
  recentActivities: any[];
}

/**
 * Fetch all homepage data in parallel
 */
export const fetchHomepageData = async (): Promise<HomepageData> => {
  // For now, return mock data since backend endpoints aren't ready
  // Replace with real API calls when backend is deployed
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    stats: {
      liveDrops: 12,
      activeUsers: 523,
      totalProducts: 48,
      liveOrders: 15,
      revenue: 12500,
      totalOrders: 3240
    },
    featuredDrops: [], // Will be populated from store
    trendingProducts: [], // Will be populated from store
    recentActivities: []
  };
};

/**
 * Fetch platform statistics
 */
export const fetchStats = async (): Promise<PlatformStats> => {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  } catch (error) {
    console.error('[API] Stats fetch failed:', error);
    // Return mock data as fallback
    return {
      liveDrops: 12,
      activeUsers: 523,
      totalProducts: 48,
      liveOrders: 15,
      revenue: 12500,
      totalOrders: 3240
    };
  }
};

/**
 * Fetch featured drops
 */
export const fetchFeaturedDrops = async (): Promise<Drop[]> => {
  const maxRetries = 3;
  const retryDelay = 1000;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('/api/drops/featured', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 503 || response.status === 504) {
          // Service unavailable or timeout - retry
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            continue;
          }
        }
        throw new Error(`Failed to fetch featured drops: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      // Don't log connection errors on first attempt (might be normal)
      if (attempt === maxRetries - 1) {
        console.warn('[API] Featured drops fetch failed after retries:', error?.message || error);
      }
      
      // If it's the last attempt, return empty array
      if (attempt === maxRetries - 1) {
        return [];
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  return [];
};

/**
 * Fetch trending products
 */
export const fetchTrendingProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch('/api/products/trending');
    if (!response.ok) throw new Error('Failed to fetch trending products');
    return await response.json();
  } catch (error) {
    console.error('[API] Trending products fetch failed:', error);
    return [];
  }
};

/**
 * React Query Hook for homepage data
 * Automatically refetches every 30 seconds to keep data fresh
 */
export const useHomepageData = (options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) => {
  return useQuery({
    queryKey: ['homepage'],
    queryFn: fetchHomepageData,
    refetchInterval: options?.refetchInterval ?? 30000, // 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    enabled: options?.enabled ?? true,
    retry: 2,
    retryDelay: 1000
  });
};

/**
 * React Query Hook for live stats only
 */
export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 5000
  });
};



