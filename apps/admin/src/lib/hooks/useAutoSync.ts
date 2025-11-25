/**
 * Auto-Sync Hook
 * 
 * Automatically synchronizes frontend data (categories and products) to backend
 * on first load. Uses localStorage to track sync status.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncAllFromFrontend, type SyncResult } from '../api/syncFrontendData';
import { logger } from '../logger';
import { productsApi } from '../api/ecommerce';
import type { Category } from '../api/ecommerce';

const SYNC_STORAGE_KEY = 'nebula_shop_synced';
const SYNC_VERSION_KEY = 'nebula_shop_sync_version';
const CURRENT_SYNC_VERSION = '1.0';

export interface UseAutoSyncOptions {
  enabled?: boolean;
  autoFillEmptyCategories?: boolean;
  timeout?: number; // Timeout in milliseconds (default: 60000 = 60s)
  maxRetries?: number; // Maximum retry attempts (default: 3)
  retryDelay?: number; // Base delay for retries in milliseconds (default: 1000)
  retryBackoff?: 'linear' | 'exponential'; // Retry backoff strategy (default: 'exponential')
  validateResults?: boolean; // Validate sync results before marking as successful (default: true)
  onSyncComplete?: (result: { categories: SyncResult; products: SyncResult }) => void;
  onSyncError?: (error: Error) => void;
  onAutoFillComplete?: (result: { filled: number; failed: number }) => void;
}

export interface UseAutoSyncResult {
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: Date | null;
  retryCount: number;
  triggerSync: () => Promise<void>;
  triggerAutoFill: (categories: Category[]) => Promise<void>;
}

/**
 * Hook for automatic frontend-backend synchronization
 */
export function useAutoSync(options: UseAutoSyncOptions = {}): UseAutoSyncResult {
  const {
    enabled = true,
    autoFillEmptyCategories = true,
    timeout = 60000, // 60 seconds default timeout
    maxRetries = 3,
    retryDelay = 1000,
    retryBackoff = 'exponential',
    validateResults = true,
    onSyncComplete,
    onSyncError,
    onAutoFillComplete,
  } = options;

  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasSyncedRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const syncInProgressRef = useRef(false); // Prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Store callbacks in refs to avoid dependency issues
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Check if already synced - use ref to avoid dependency issues
  const hasSyncedRefFn = useRef(() => {
    if (typeof window === 'undefined') return false;
    const synced = localStorage.getItem(SYNC_STORAGE_KEY);
    const version = localStorage.getItem(SYNC_VERSION_KEY);
    // Reset if version changed
    if (version !== CURRENT_SYNC_VERSION) {
      localStorage.removeItem(SYNC_STORAGE_KEY);
      localStorage.setItem(SYNC_VERSION_KEY, CURRENT_SYNC_VERSION);
      return false;
    }
    return synced === 'true';
  });

  // Mark as synced - use ref to avoid dependency issues
  const markAsSyncedRefFn = useRef(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SYNC_STORAGE_KEY, 'true');
    localStorage.setItem(SYNC_VERSION_KEY, CURRENT_SYNC_VERSION);
    setLastSyncTime(new Date());
  });

  // Auto-fill empty categories with products
  const triggerAutoFill = useCallback(async (categories: Category[]) => {
    if (!optionsRef.current.autoFillEmptyCategories || categories.length === 0) return;

    const emptyCategories = categories.filter(cat => (cat.totalProducts || 0) === 0);
    if (emptyCategories.length === 0) return;

    logger.info(`Auto-filling ${emptyCategories.length} empty categories with products`);

    // Process in batches of 3
    const batchSize = 3;
    let filled = 0;
    let failed = 0;

    for (let i = 0; i < emptyCategories.length; i += batchSize) {
      const batch = emptyCategories.slice(i, i + batchSize);
      
      try {
        const response = await productsApi.bulkGenerateProducts(
          batch.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            description: cat.description,
          })),
          2 + Math.floor(Math.random() * 2) // 2-3 products per category
        );

        if (response.data?.success) {
          filled += response.data.data.created;
          failed += response.data.data.failed;
          
          // Batch invalidate queries together for better performance
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['products'] }),
            queryClient.invalidateQueries({ queryKey: ['categories'] }),
          ]);
        }
      } catch (error: any) {
        logger.error('Auto-fill error for batch', { error, batch: batch.map(c => c.name) });
        failed += batch.length;
      }

      // Small delay between batches to avoid overwhelming the server
      if (i + batchSize < emptyCategories.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    logger.info(`Auto-fill completed: ${filled} products created, ${failed} failed`);
    optionsRef.current.onAutoFillComplete?.({ filled, failed });
  }, [queryClient]);

  // Trigger sync manually with improved robustness
  const triggerSync = useCallback(async () => {
    // Prevent race conditions - check if sync is already in progress
    if (syncInProgressRef.current || isSyncing) {
      logger.warn('Sync already in progress, skipping duplicate request');
      return;
    }

    // Create abort controller for timeout handling
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    syncInProgressRef.current = true;
    setIsSyncing(true);
    setSyncStatus('syncing');
    setRetryCount(0);

    let attempts = 0;
    const effectiveMaxRetries = optionsRef.current.maxRetries ?? maxRetries;
    const effectiveRetryDelay = optionsRef.current.retryDelay ?? retryDelay;
    const effectiveRetryBackoff = optionsRef.current.retryBackoff ?? retryBackoff;
    const effectiveTimeout = optionsRef.current.timeout ?? timeout;
    const effectiveValidateResults = optionsRef.current.validateResults ?? validateResults;

    // Timeout handler
    const timeoutId = setTimeout(() => {
      abortController.abort();
      logger.warn('Sync timeout exceeded', { timeout: effectiveTimeout });
    }, effectiveTimeout);

    while (attempts < effectiveMaxRetries) {
      try {
        // Check if aborted
        if (abortController.signal.aborted) {
          throw new Error('Sync aborted due to timeout');
        }

        logger.info('Starting automatic frontend-backend sync', { 
          attempt: attempts + 1,
          maxRetries: effectiveMaxRetries,
        });
        
        // Create a promise that can be aborted
        const syncPromise = syncAllFromFrontend({
          overwrite: false,
          skipDuplicates: true,
          dryRun: false,
        });

        // Race between sync and abort signal
        const result = await Promise.race([
          syncPromise,
          new Promise<never>((_, reject) => {
            if (abortController.signal.aborted) {
              reject(new Error('Sync aborted'));
            }
            abortController.signal.addEventListener('abort', () => {
              reject(new Error('Sync aborted'));
            });
          }),
        ]);

        // Validate results if enabled
        if (effectiveValidateResults) {
          const isValid = result.success && 
            result.categories.total > 0 && 
            result.products.total > 0 &&
            (result.categories.created > 0 || result.categories.updated > 0 || result.categories.skipped > 0) &&
            (result.products.created > 0 || result.products.updated > 0 || result.products.skipped > 0);

          if (!isValid) {
            logger.warn('Sync results validation failed', {
              categories: result.categories,
              products: result.products,
            });
            // Don't throw, but log warning
          }
        }

        if (result.success) {
          clearTimeout(timeoutId);
          logger.info('Auto-sync completed successfully', {
            categories: {
              created: result.categories.created,
              updated: result.categories.updated,
              skipped: result.categories.skipped,
              errors: result.categories.errors.length,
            },
            products: {
              created: result.products.created,
              updated: result.products.updated,
              skipped: result.products.skipped,
              errors: result.products.errors.length,
            },
          });
          
          markAsSyncedRefFn.current();
          setSyncStatus('success');
          setRetryCount(0);
          
          // Batch invalidate queries together for better performance
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['products'] }),
            queryClient.invalidateQueries({ queryKey: ['categories'] }),
          ]);
          
          optionsRef.current.onSyncComplete?.(result);
          
          // Auto-fill empty categories after sync
          if (optionsRef.current.autoFillEmptyCategories) {
            // Wait a bit for queries to update, then fetch categories
            setTimeout(async () => {
              try {
                const categoriesResponse = await queryClient.fetchQuery({
                  queryKey: ['categories', { type: 'shop' }],
                  queryFn: async () => {
                    const { categoriesApi } = await import('../api/ecommerce');
                    return categoriesApi.getCategories({ type: 'shop' });
                  },
                });
                
                const categories = categoriesResponse?.data || [];
                await triggerAutoFill(categories);
              } catch (error) {
                logger.error('Failed to fetch categories for auto-fill', { error });
              }
            }, 1000);
          }
          
          break;
        } else {
          throw new Error('Sync returned success: false');
        }
      } catch (error: any) {
        attempts++;
        setRetryCount(attempts);
        
        // Check if it's an abort error (timeout)
        if (error.message === 'Sync aborted' || error.message === 'Sync aborted due to timeout') {
          logger.error('Auto-sync aborted due to timeout', { 
            timeout: effectiveTimeout,
            attempts,
          });
          setSyncStatus('error');
          optionsRef.current.onSyncError?.(new Error(`Sync timeout after ${effectiveTimeout}ms`));
          break;
        }

        logger.warn(`Auto-sync attempt ${attempts} failed`, { 
          error: error.message || error,
          attempt: attempts,
          maxRetries: effectiveMaxRetries,
        });

        if (attempts >= effectiveMaxRetries) {
          clearTimeout(timeoutId);
          logger.error('Auto-sync failed after max retries', { 
            error: error.message || error,
            attempts,
            maxRetries: effectiveMaxRetries,
          });
          setSyncStatus('error');
          optionsRef.current.onSyncError?.(error instanceof Error ? error : new Error(error?.message || 'Unknown error'));
        } else {
          // Calculate delay based on backoff strategy
          let delay: number;
          if (effectiveRetryBackoff === 'exponential') {
            delay = effectiveRetryDelay * Math.pow(2, attempts - 1);
          } else {
            delay = effectiveRetryDelay * attempts;
          }
          
          logger.info(`Retrying sync in ${delay}ms`, { 
            attempt: attempts + 1,
            delay,
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    clearTimeout(timeoutId);
    syncInProgressRef.current = false;
    setIsSyncing(false);
    abortControllerRef.current = null;
  }, [isSyncing, queryClient, triggerAutoFill, maxRetries, retryDelay, retryBackoff, timeout, validateResults]);

  // Auto-sync on mount if needed - only run once
  useEffect(() => {
    if (!optionsRef.current.enabled || hasSyncedRef.current || !isInitialMountRef.current) return;
    isInitialMountRef.current = false;

    // Check if already synced
    if (hasSyncedRefFn.current()) {
      logger.info('Shop already synced, skipping auto-sync');
      hasSyncedRef.current = true;
      return;
    }

    // Check if backend has data
    const checkBackendData = async () => {
      try {
        const { categoriesApi } = await import('../api/ecommerce');
        const categoriesResponse = await categoriesApi.getCategories({ type: 'shop' });
        
        // If backend has categories, mark as synced
        if (categoriesResponse?.data && categoriesResponse.data.length > 0) {
          logger.info('Backend already has categories, marking as synced');
          markAsSyncedRefFn.current();
          hasSyncedRef.current = true;
          return;
        }

        // No backend data, trigger sync
        logger.info('No backend data found, triggering auto-sync');
        hasSyncedRef.current = true;
        await triggerSync();
      } catch (error: any) {
        // If API fails, assume no data and try sync anyway
        logger.warn('Failed to check backend data, attempting sync', { error });
        hasSyncedRef.current = true;
        await triggerSync();
      }
    };

    checkBackendData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    isSyncing,
    syncStatus,
    lastSyncTime,
    retryCount,
    triggerSync,
    triggerAutoFill,
  };
}

