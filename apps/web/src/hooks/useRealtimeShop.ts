import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket, type WebSocketMessage } from './useWebSocket';
import { useShopStore } from '../store/shop';
import type { Product } from '@nebula/shared';

export interface ProductUpdateEvent {
  type: 'product:updated' | 'product:created' | 'product:deleted' | 'product:stock_changed';
  data: {
    productId: string;
    product?: Product;
    changes?: Record<string, any>;
    previousStock?: number;
    newStock?: number;
    timestamp: string;
  };
}

export interface UseRealtimeShopOptions {
  enabled?: boolean;
  onProductUpdated?: (event: ProductUpdateEvent) => void;
  onProductCreated?: (event: ProductUpdateEvent) => void;
  onProductDeleted?: (event: ProductUpdateEvent) => void;
  onProductStockChanged?: (event: ProductUpdateEvent) => void;
}

/**
 * Hook for real-time product updates via WebSocket
 * Listens to product events from backend and updates ShopStore automatically
 */
export const useRealtimeShop = (options: UseRealtimeShopOptions = {}) => {
  const { 
    enabled = true,
    onProductUpdated,
    onProductCreated,
    onProductDeleted,
    onProductStockChanged
  } = options;

  const shopStore = useShopStore();
  const optionsRef = useRef(options);
  
  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Get WebSocket URL from environment or use default
  const getWebSocketUrl = useCallback(() => {
    // Use VITE_WS_URL if available, otherwise construct from API URL
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `${wsProtocol}://${wsHost}/ws`;
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Check if message is a product event
    if (
      message.type === 'product:updated' ||
      message.type === 'product:created' ||
      message.type === 'product:deleted' ||
      message.type === 'product:stock_changed'
    ) {
      // Handle both message formats:
      // 1. { type: 'product:updated', data: { productId, product, ... } }
      // 2. { type: 'product:updated', productId, product, ... } (direct payload)
      const eventData = message.data || message;
      
      const event: ProductUpdateEvent = {
        type: message.type as ProductUpdateEvent['type'],
        data: {
          productId: eventData.productId || (message as any).productId,
          product: eventData.product || (message as any).product,
          changes: eventData.changes || (message as any).changes,
          previousStock: eventData.previousStock || (message as any).previousStock,
          newStock: eventData.newStock || (message as any).newStock,
          timestamp: eventData.timestamp || (message as any).timestamp || new Date().toISOString()
        }
      };

      const { productId, product, changes, previousStock, newStock } = event.data;

      if (!productId) {
        console.warn('[useRealtimeShop] Received product event without productId:', event);
        return;
      }

      switch (event.type) {
        case 'product:updated':
          // Update product in store
          if (product) {
            shopStore.updateProduct(productId, product);
          } else if (changes) {
            // Partial update with changes
            shopStore.updateProduct(productId, changes);
          }
          optionsRef.current.onProductUpdated?.(event);
          break;

        case 'product:created':
          // Add new product to store
          if (product) {
            shopStore.addProduct(product);
          }
          optionsRef.current.onProductCreated?.(event);
          break;

        case 'product:deleted':
          // Remove product from store
          shopStore.removeProduct(productId);
          optionsRef.current.onProductDeleted?.(event);
          break;

        case 'product:stock_changed':
          // Update product stock
          if (newStock !== undefined) {
            shopStore.updateProduct(productId, { inventory: newStock });
          }
          optionsRef.current.onProductStockChanged?.(event);
          break;
      }
    }
  }, [shopStore]);

  // WebSocket connection
  const { isConnected, lastMessage } = useWebSocket({
    url: getWebSocketUrl(),
    enabled,
    onMessage: handleMessage,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
  });

  // Handle lastMessage changes to trigger updates
  useEffect(() => {
    if (lastMessage) {
      handleMessage(lastMessage);
    }
  }, [lastMessage, handleMessage]);

  return {
    isConnected,
    lastMessage,
  };
};

