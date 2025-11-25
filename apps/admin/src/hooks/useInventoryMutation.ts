import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastHelpers } from '../components/ui/Toast';
import { logger } from '../lib/logger';
import { api } from '../lib/api/client';
import { InventoryUpdate } from '../schemas/api';

interface UseInventoryMutationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useInventoryMutation = (options?: UseInventoryMutationOptions) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToastHelpers();
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, any>>(new Map());

  const updateInventoryMutation = useMutation({
    mutationFn: async (update: InventoryUpdate) => {
      return api.patch(`/api/inventory/${update.productId}`, {
        quantity: update.quantity,
        operation: update.operation,
        reason: update.reason,
        version: update.version
      });
    },
    onMutate: async (update: InventoryUpdate) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['inventory', update.productId] });

      // Snapshot the previous value
      const previousInventory = queryClient.getQueryData(['inventory', update.productId]);

      // Optimistically update the cache
      queryClient.setQueryData(['inventory', update.productId], (old: any) => {
        if (!old) return old;

        let newQuantity = old.quantity;
        switch (update.operation) {
          case 'set':
            newQuantity = update.quantity;
            break;
          case 'add':
            newQuantity = old.quantity + update.quantity;
            break;
          case 'subtract':
            newQuantity = Math.max(0, old.quantity - update.quantity);
            break;
        }

        return {
          ...old,
          quantity: newQuantity,
          version: (old.version || 0) + 1
        };
      });

      // Store optimistic update for potential rollback
      setOptimisticUpdates(prev => new Map(prev).set(update.productId, {
        ...update,
        previousValue: previousInventory,
        timestamp: Date.now()
      }));

      logger.logUserAction('inventory_optimistic_update', {
        productId: update.productId,
        operation: update.operation,
        quantity: update.quantity
      });

      return { previousInventory, update };
    },
    onSuccess: (data, variables) => {
      // Remove optimistic update
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(variables.productId);
        return newMap;
      });

      // Invalidate and refetch inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      success(
        'Inventory Updated',
        `Product inventory updated successfully`
      );

      logger.logUserAction('inventory_update_success', {
        productId: variables.productId,
        operation: variables.operation,
        quantity: variables.quantity
      });

      options?.onSuccess?.(data);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousInventory) {
        queryClient.setQueryData(['inventory', variables.productId], context.previousInventory);
      }

      // Remove optimistic update
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(variables.productId);
        return newMap;
      });

      // Handle specific error types
      if (error.status === 409) {
        showError(
          'Concurrency Conflict',
          'Inventory was modified by another user. Please refresh and try again.'
        );
      } else if (error.status === 400) {
        showError(
          'Invalid Update',
          error.message || 'Invalid inventory update request'
        );
      } else {
        showError(
          'Update Failed',
          'Could not update inventory. Please try again.'
        );
      }

      logger.error('Inventory update failed', {
        productId: variables.productId,
        operation: variables.operation,
        quantity: variables.quantity,
        error
      });

      options?.onError?.(error);
    }
  });

  const bulkUpdateInventoryMutation = useMutation({
    mutationFn: async (updates: InventoryUpdate[]) => {
      return api.patch('/api/inventory/bulk', { updates });
    },
    onSuccess: (data, variables) => {
      // Invalidate all inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      success(
        'Bulk Update Successful',
        `Updated inventory for ${variables.length} products`
      );

      logger.logUserAction('bulk_inventory_update_success', {
        productCount: variables.length,
        operations: variables.map(u => u.operation)
      });

      options?.onSuccess?.(data);
    },
    onError: (error, variables) => {
      showError(
        'Bulk Update Failed',
        'Some inventory updates failed. Please check individual products.'
      );

      logger.error('Bulk inventory update failed', {
        productCount: variables.length,
        error
      });

      options?.onError?.(error);
    }
  });

  const reserveInventoryMutation = useMutation({
    mutationFn: async ({ productId, quantity, orderId }: { productId: string; quantity: number; orderId: string }) => {
      return api.post(`/api/inventory/${productId}/reserve`, {
        quantity,
        orderId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.productId] });
      
      success(
        'Inventory Reserved',
        `Reserved ${variables.quantity} units for order ${variables.orderId.slice(-8)}`
      );

      logger.logUserAction('inventory_reservation_success', {
        productId: variables.productId,
        quantity: variables.quantity,
        orderId: variables.orderId
      });
    },
    onError: (error, variables) => {
      if (error.status === 409) {
        showError(
          'Insufficient Stock',
          'Not enough inventory available for reservation'
        );
      } else {
        showError(
          'Reservation Failed',
          'Could not reserve inventory'
        );
      }

      logger.error('Inventory reservation failed', {
        productId: variables.productId,
        quantity: variables.quantity,
        orderId: variables.orderId,
        error
      });
    }
  });

  const releaseInventoryMutation = useMutation({
    mutationFn: async ({ productId, orderId }: { productId: string; orderId: string }) => {
      return api.delete(`/api/inventory/${productId}/reserve/${orderId}`);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.productId] });
      
      success(
        'Reservation Released',
        `Released inventory reservation for order ${variables.orderId.slice(-8)}`
      );

      logger.logUserAction('inventory_reservation_release', {
        productId: variables.productId,
        orderId: variables.orderId
      });
    },
    onError: (error, variables) => {
      showError(
        'Release Failed',
        'Could not release inventory reservation'
      );

      logger.error('Inventory reservation release failed', {
        productId: variables.productId,
        orderId: variables.orderId,
        error
      });
    }
  });

  return {
    updateInventory: updateInventoryMutation.mutate,
    updateInventoryAsync: updateInventoryMutation.mutateAsync,
    isUpdatingInventory: updateInventoryMutation.isPending,
    
    bulkUpdateInventory: bulkUpdateInventoryMutation.mutate,
    bulkUpdateInventoryAsync: bulkUpdateInventoryMutation.mutateAsync,
    isBulkUpdating: bulkUpdateInventoryMutation.isPending,
    
    reserveInventory: reserveInventoryMutation.mutate,
    reserveInventoryAsync: reserveInventoryMutation.mutateAsync,
    isReserving: reserveInventoryMutation.isPending,
    
    releaseInventory: releaseInventoryMutation.mutate,
    releaseInventoryAsync: releaseInventoryMutation.mutateAsync,
    isReleasing: releaseInventoryMutation.isPending,
    
    optimisticUpdates: Array.from(optimisticUpdates.values())
  };
};



