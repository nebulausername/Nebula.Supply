import { useEffect, useCallback, useRef, useState } from 'react';
import { useWebSocket } from '../websocket/client';
import { logger } from '../logger';

export interface OrderUpdateEvent {
  type: 'order:created' | 'order:updated' | 'order:status_changed' | 'order:tracking_updated' | 'order:bulk_updated';
  orderId: string;
  order?: any;
  oldStatus?: string;
  newStatus?: string;
  trackingInfo?: any;
  changes?: any;
  timestamp: string;
}

export interface OrderUpdateCallbacks {
  onOrderCreated?: (order: any) => void;
  onOrderUpdated?: (orderId: string, changes: any) => void;
  onStatusChanged?: (orderId: string, oldStatus: string, newStatus: string, trackingInfo?: any) => void;
  onTrackingUpdated?: (orderId: string, trackingInfo: any) => void;
  onBulkUpdated?: (orderIds: string[], updates: any, results: any) => void;
}

export function useOrderUpdates(callbacks: OrderUpdateCallbacks = {}) {
  const { wsManager, isConnected } = useWebSocket();
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Handle order created event
  const handleOrderCreated = useCallback((data: any) => {
    logger.logUserAction('order_created_websocket', { orderId: data.orderId });
    callbacksRef.current.onOrderCreated?.(data.order);
  }, []);

  // Handle order updated event
  const handleOrderUpdated = useCallback((data: any) => {
    logger.logUserAction('order_updated_websocket', { orderId: data.orderId, changes: data.changes });
    callbacksRef.current.onOrderUpdated?.(data.orderId, data.changes);
  }, []);

  // Handle status changed event
  const handleStatusChanged = useCallback((data: any) => {
    logger.logUserAction('order_status_changed_websocket', { 
      orderId: data.orderId, 
      oldStatus: data.oldStatus, 
      newStatus: data.newStatus 
    });
    callbacksRef.current.onStatusChanged?.(data.orderId, data.oldStatus, data.newStatus, data.trackingInfo);
  }, []);

  // Handle tracking updated event
  const handleTrackingUpdated = useCallback((data: any) => {
    logger.logUserAction('order_tracking_updated_websocket', { orderId: data.orderId, trackingInfo: data.trackingInfo });
    callbacksRef.current.onTrackingUpdated?.(data.orderId, data.trackingInfo);
  }, []);

  // Handle bulk updated event
  const handleBulkUpdated = useCallback((data: any) => {
    logger.logUserAction('order_bulk_updated_websocket', { 
      orderIds: data.orderIds, 
      updates: data.updates, 
      results: data.results 
    });
    callbacksRef.current.onBulkUpdated?.(data.orderIds, data.updates, data.results);
  }, []);

  // Subscribe to order events
  useEffect(() => {
    if (!wsManager || !isConnected) return;

    // Subscribe to general order events
    wsManager.on('order:created', handleOrderCreated);
    wsManager.on('order:updated', handleOrderUpdated);
    wsManager.on('order:status_changed', handleStatusChanged);
    wsManager.on('order:tracking_updated', handleTrackingUpdated);
    wsManager.on('order:bulk_updated', handleBulkUpdated);

    // Cleanup listeners
    return () => {
      wsManager.off('order:created', handleOrderCreated);
      wsManager.off('order:updated', handleOrderUpdated);
      wsManager.off('order:status_changed', handleStatusChanged);
      wsManager.off('order:tracking_updated', handleTrackingUpdated);
      wsManager.off('order:bulk_updated', handleBulkUpdated);
    };
  }, [wsManager, isConnected, handleOrderCreated, handleOrderUpdated, handleStatusChanged, handleTrackingUpdated, handleBulkUpdated]);

  // Subscribe to specific order events
  const subscribeToOrder = useCallback((orderId: string) => {
    if (!wsManager || !isConnected) return;

    wsManager.on(`order:${orderId}`, handleOrderUpdated);
    logger.logUserAction('subscribed_to_order', { orderId });
  }, [wsManager, isConnected, handleOrderUpdated]);

  // Unsubscribe from specific order events
  const unsubscribeFromOrder = useCallback((orderId: string) => {
    if (!wsManager || !isConnected) return;

    wsManager.off(`order:${orderId}`, handleOrderUpdated);
    logger.logUserAction('unsubscribed_from_order', { orderId });
  }, [wsManager, isConnected, handleOrderUpdated]);

  // Subscribe to orders with filters
  const subscribeToOrders = useCallback((filters: any) => {
    if (!wsManager || !isConnected) return;

    // Subscribe to general order events
    wsManager.on('order:created', handleOrderCreated);
    wsManager.on('order:updated', handleOrderUpdated);
    wsManager.on('order:status_changed', handleStatusChanged);
    wsManager.on('order:tracking_updated', handleTrackingUpdated);
    wsManager.on('order:bulk_updated', handleBulkUpdated);
    logger.logUserAction('subscribed_to_orders', { filters });
  }, [wsManager, isConnected, handleOrderCreated, handleOrderUpdated, handleStatusChanged, handleTrackingUpdated, handleBulkUpdated]);

  // Unsubscribe from all order events
  const unsubscribeFromOrders = useCallback(() => {
    if (!wsManager || !isConnected) return;

    wsManager.off('order:created', handleOrderCreated);
    wsManager.off('order:updated', handleOrderUpdated);
    wsManager.off('order:status_changed', handleStatusChanged);
    wsManager.off('order:tracking_updated', handleTrackingUpdated);
    wsManager.off('order:bulk_updated', handleBulkUpdated);
    logger.logUserAction('unsubscribed_from_orders');
  }, [wsManager, isConnected, handleOrderCreated, handleOrderUpdated, handleStatusChanged, handleTrackingUpdated, handleBulkUpdated]);

  return {
    isConnected,
    subscribeToOrder,
    unsubscribeFromOrder,
    subscribeToOrders,
    unsubscribeFromOrders
  };
}

// Hook for optimistic updates
export function useOptimisticOrderUpdates() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, any>>(new Map());

  const addOptimisticUpdate = useCallback((orderId: string, update: any) => {
    setOptimisticUpdates(prev => new Map(prev).set(orderId, update));
  }, []);

  const removeOptimisticUpdate = useCallback((orderId: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(orderId);
      return newMap;
    });
  }, []);

  const getOptimisticUpdate = useCallback((orderId: string) => {
    return optimisticUpdates.get(orderId);
  }, [optimisticUpdates]);

  const clearAllOptimisticUpdates = useCallback(() => {
    setOptimisticUpdates(new Map());
  }, []);

  return {
    optimisticUpdates,
    addOptimisticUpdate,
    removeOptimisticUpdate,
    getOptimisticUpdate,
    clearAllOptimisticUpdates
  };
}

// Hook for order notifications
export function useOrderNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
    orderId?: string;
  }>>([]);

  const addNotification = useCallback((notification: Omit<typeof notifications[0], 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only last 10 notifications
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => prev.filter(n => 
        Date.now() - new Date(n.timestamp).getTime() < 5000
      ));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
}
