import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getWebSocketClient } from './client';
import { logger } from '../logger';

export interface DropEvent {
  type: 'drop:created' | 'drop:updated' | 'drop:deleted' | 'drop:stock_changed' | 'drop:status_changed' | 'drop:progress_updated';
  dropId: string;
  drop?: any;
  changes?: any[];
  variantId?: string;
  oldStock?: number;
  newStock?: number;
  oldStatus?: string;
  newStatus?: string;
  progress?: number;
  totalStock?: number;
  soldCount?: number;
  timestamp: string;
  adminId?: string;
}

export interface UseRealtimeDropsOptions {
  enabled?: boolean;
  filters?: {
    dropIds?: string[];
    status?: string;
    access?: string;
    search?: string;
  };
  onDropCreated?: (event: DropEvent) => void;
  onDropUpdated?: (event: DropEvent) => void;
  onDropDeleted?: (event: DropEvent) => void;
  onStockChanged?: (event: DropEvent) => void;
  onStatusChanged?: (event: DropEvent) => void;
  onProgressUpdated?: (event: DropEvent) => void;
}

export const useRealtimeDrops = (options: UseRealtimeDropsOptions = {}) => {
  const queryClient = useQueryClient();
  const wsClient = getWebSocketClient();
  const optionsRef = useRef(options);
  const isSubscribedRef = useRef(false);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Handle drop events and update React Query cache
  const handleDropEvent = useCallback((event: DropEvent) => {
    const { type, dropId, drop, changes, adminId } = event;

    logger.info('Received drop event', { type, dropId, adminId });

    switch (type) {
      case 'drop:created':
        // Invalidate drops list to refetch with new drop
        queryClient.invalidateQueries({ queryKey: ['drops', 'list'] });
        optionsRef.current.onDropCreated?.(event);
        break;

      case 'drop:updated':
        // Update specific drop in cache
        queryClient.setQueryData(['drops', 'detail', dropId], drop);
        
        // Invalidate drops list to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['drops', 'list'] });
        
        // Update any cached drop data
        queryClient.setQueriesData(
          { queryKey: ['drops'] },
          (oldData: any) => {
            if (!oldData?.data) return oldData;
            
            return {
              ...oldData,
              data: oldData.data.map((d: any) => 
                d.id === dropId ? { ...d, ...drop } : d
              )
            };
          }
        );
        
        optionsRef.current.onDropUpdated?.(event);
        break;

      case 'drop:deleted':
        // Remove drop from cache
        queryClient.removeQueries({ queryKey: ['drops', 'detail', dropId] });
        
        // Invalidate drops list
        queryClient.invalidateQueries({ queryKey: ['drops', 'list'] });
        
        optionsRef.current.onDropDeleted?.(event);
        break;

      case 'drop:stock_changed':
        // Update stock in cache
        queryClient.setQueriesData(
          { queryKey: ['drops'] },
          (oldData: any) => {
            if (!oldData?.data) return oldData;
            
            return {
              ...oldData,
              data: oldData.data.map((d: any) => {
                if (d.id === dropId) {
                  return {
                    ...d,
                    variants: d.variants.map((v: any) => 
                      v.id === event.variantId 
                        ? { ...v, stock: event.newStock }
                        : v
                    )
                  };
                }
                return d;
              })
            };
          }
        );
        
        optionsRef.current.onStockChanged?.(event);
        break;

      case 'drop:status_changed':
        // Update status in cache
        queryClient.setQueriesData(
          { queryKey: ['drops'] },
          (oldData: any) => {
            if (!oldData?.data) return oldData;
            
            return {
              ...oldData,
              data: oldData.data.map((d: any) => 
                d.id === dropId ? { ...d, status: event.newStatus } : d
              )
            };
          }
        );
        
        optionsRef.current.onStatusChanged?.(event);
        break;

      case 'drop:progress_updated':
        // Update progress in cache
        queryClient.setQueriesData(
          { queryKey: ['drops'] },
          (oldData: any) => {
            if (!oldData?.data) return oldData;
            
            return {
              ...oldData,
              data: oldData.data.map((d: any) => 
                d.id === dropId 
                  ? { 
                      ...d, 
                      progress: event.progress,
                      totalStock: event.totalStock,
                      soldCount: event.soldCount
                    } 
                  : d
              )
            };
          }
        );
        
        optionsRef.current.onProgressUpdated?.(event);
        break;
    }
  }, [queryClient]);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!options.enabled) return;

    // Subscribe to drop events
    wsClient.on('drop:created', handleDropEvent);
    wsClient.on('drop:updated', handleDropEvent);
    wsClient.on('drop:deleted', handleDropEvent);
    wsClient.on('drop:stock_changed', handleDropEvent);
    wsClient.on('drop:status_changed', handleDropEvent);
    wsClient.on('drop:progress_updated', handleDropEvent);

    // Subscribe to drops with filters
    if (!isSubscribedRef.current) {
      wsClient.subscribeToDrops(options.filters);
      isSubscribedRef.current = true;
    }

    return () => {
      wsClient.off('drop:created', handleDropEvent);
      wsClient.off('drop:updated', handleDropEvent);
      wsClient.off('drop:deleted', handleDropEvent);
      wsClient.off('drop:stock_changed', handleDropEvent);
      wsClient.off('drop:status_changed', handleDropEvent);
      wsClient.off('drop:progress_updated', handleDropEvent);
    };
  }, [options.enabled, options.filters, handleDropEvent, wsClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSubscribedRef.current) {
        wsClient.unsubscribeFromDrops();
        isSubscribedRef.current = false;
      }
    };
  }, [wsClient]);

  return {
    isConnected: wsClient.isConnected,
    connectionStatus: wsClient.connectionStatus,
    forceReconnect: wsClient.forceReconnect.bind(wsClient)
  };
};

// Hook for subscribing to a specific drop
export const useRealtimeDrop = (dropId: string, options: Omit<UseRealtimeDropsOptions, 'filters'> = {}) => {
  const queryClient = useQueryClient();
  const wsClient = getWebSocketClient();
  const optionsRef = useRef(options);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleDropEvent = useCallback((event: DropEvent) => {
    if (event.dropId !== dropId) return;

    logger.info('Received drop event for specific drop', { type: event.type, dropId });

    switch (event.type) {
      case 'drop:updated':
        queryClient.setQueryData(['drops', 'detail', dropId], event.drop);
        optionsRef.current.onDropUpdated?.(event);
        break;

      case 'drop:deleted':
        queryClient.removeQueries({ queryKey: ['drops', 'detail', dropId] });
        optionsRef.current.onDropDeleted?.(event);
        break;

      case 'drop:stock_changed':
        queryClient.setQueryData(['drops', 'detail', dropId], (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            variants: oldData.variants.map((v: any) => 
              v.id === event.variantId 
                ? { ...v, stock: event.newStock }
                : v
            )
          };
        });
        optionsRef.current.onStockChanged?.(event);
        break;

      case 'drop:status_changed':
        queryClient.setQueryData(['drops', 'detail', dropId], (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, status: event.newStatus };
        });
        optionsRef.current.onStatusChanged?.(event);
        break;
    }
  }, [queryClient, dropId]);

  useEffect(() => {
    if (!options.enabled) return;

    wsClient.on('drop:updated', handleDropEvent);
    wsClient.on('drop:deleted', handleDropEvent);
    wsClient.on('drop:stock_changed', handleDropEvent);
    wsClient.on('drop:status_changed', handleDropEvent);

    if (!isSubscribedRef.current) {
      wsClient.subscribeToDrop(dropId);
      isSubscribedRef.current = true;
    }

    return () => {
      wsClient.off('drop:updated', handleDropEvent);
      wsClient.off('drop:deleted', handleDropEvent);
      wsClient.off('drop:stock_changed', handleDropEvent);
      wsClient.off('drop:status_changed', handleDropEvent);
    };
  }, [options.enabled, handleDropEvent, wsClient, dropId]);

  useEffect(() => {
    return () => {
      if (isSubscribedRef.current) {
        wsClient.unsubscribeFromDrop(dropId);
        isSubscribedRef.current = false;
      }
    };
  }, [wsClient, dropId]);

  return {
    isConnected: wsClient.isConnected,
    connectionStatus: wsClient.connectionStatus,
    forceReconnect: wsClient.forceReconnect.bind(wsClient)
  };
};






