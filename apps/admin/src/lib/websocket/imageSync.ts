import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './client';
import { logger } from '../logger';

interface ProductMedia {
  id: string;
  url: string;
  color?: string;
  alt?: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    quality: number;
  };
}

interface ImageSyncEvents {
  'product:image_updated': {
    productId: string;
    images: ProductMedia[];
    timestamp: string;
  };
  'drop:hero_image_updated': {
    dropId: string;
    heroImageUrl: string;
    timestamp: string;
  };
  'product:media_reordered': {
    productId: string;
    media: ProductMedia[];
    timestamp: string;
  };
  'product:primary_image_changed': {
    productId: string;
    primaryImageId: string;
    timestamp: string;
  };
  'product:image_deleted': {
    productId: string;
    imageId: string;
    timestamp: string;
  };
}

interface ImageSyncState {
  isConnected: boolean;
  lastSync: string | null;
  syncErrors: number;
  pendingUpdates: Set<string>;
}

// 🎯 Image Sync Hook
export const useImageSync = (productId: string) => {
  const { wsManager, connectionStatus } = useWebSocket();
  const [images, setImages] = useState<ProductMedia[]>([]);
  const [syncState, setSyncState] = useState<ImageSyncState>({
    isConnected: connectionStatus.connected,
    lastSync: null,
    syncErrors: 0,
    pendingUpdates: new Set()
  });

  // 🔄 Update sync state when connection changes
  useEffect(() => {
    setSyncState(prev => ({
      ...prev,
      isConnected: connectionStatus.connected
    }));
  }, [connectionStatus.connected]);

  // 📡 WebSocket Event Handlers
  const handleImageUpdated = useCallback((data: ImageSyncEvents['product:image_updated']) => {
    if (data.productId === productId) {
      setImages(data.images);
      setSyncState(prev => ({
        ...prev,
        lastSync: data.timestamp,
        pendingUpdates: new Set([...prev.pendingUpdates].filter(id => id !== productId))
      }));
      
      logger.info('Product images updated via WebSocket', {
        productId: data.productId,
        imageCount: data.images.length,
        timestamp: data.timestamp
      });
    }
  }, [productId]);

  const handleHeroImageUpdated = useCallback((data: ImageSyncEvents['drop:hero_image_updated']) => {
    if (data.dropId === productId) {
      setImages(prev => prev.map(img => 
        img.id === 'hero' 
          ? { ...img, url: data.heroImageUrl }
          : img
      ));
      
      setSyncState(prev => ({
        ...prev,
        lastSync: data.timestamp
      }));
      
      logger.info('Drop hero image updated via WebSocket', {
        dropId: data.dropId,
        heroImageUrl: data.heroImageUrl,
        timestamp: data.timestamp
      });
    }
  }, [productId]);

  const handleMediaReordered = useCallback((data: ImageSyncEvents['product:media_reordered']) => {
    if (data.productId === productId) {
      setImages(data.media);
      setSyncState(prev => ({
        ...prev,
        lastSync: data.timestamp
      }));
      
      logger.info('Product media reordered via WebSocket', {
        productId: data.productId,
        mediaCount: data.media.length,
        timestamp: data.timestamp
      });
    }
  }, [productId]);

  const handlePrimaryImageChanged = useCallback((data: ImageSyncEvents['product:primary_image_changed']) => {
    if (data.productId === productId) {
      setImages(prev => prev.map(img => ({
        ...img,
        isPrimary: img.id === data.primaryImageId
      })));
      
      setSyncState(prev => ({
        ...prev,
        lastSync: data.timestamp
      }));
      
      logger.info('Primary image changed via WebSocket', {
        productId: data.productId,
        primaryImageId: data.primaryImageId,
        timestamp: data.timestamp
      });
    }
  }, [productId]);

  const handleImageDeleted = useCallback((data: ImageSyncEvents['product:image_deleted']) => {
    if (data.productId === productId) {
      setImages(prev => prev.filter(img => img.id !== data.imageId));
      setSyncState(prev => ({
        ...prev,
        lastSync: data.timestamp
      }));
      
      logger.info('Image deleted via WebSocket', {
        productId: data.productId,
        imageId: data.imageId,
        timestamp: data.timestamp
      });
    }
  }, [productId]);

  // 🔌 WebSocket Event Subscription
  useEffect(() => {
    if (!wsManager) return;

    // Subscribe to image events
    wsManager.on('product:image_updated', handleImageUpdated);
    wsManager.on('drop:hero_image_updated', handleHeroImageUpdated);
    wsManager.on('product:media_reordered', handleMediaReordered);
    wsManager.on('product:primary_image_changed', handlePrimaryImageChanged);
    wsManager.on('product:image_deleted', handleImageDeleted);

    // Subscribe to specific product
    if (wsManager.isConnected) {
      wsManager.socket?.emit('subscribe:product_images', { productId });
    }

    return () => {
      wsManager.off('product:image_updated', handleImageUpdated);
      wsManager.off('drop:hero_image_updated', handleHeroImageUpdated);
      wsManager.off('product:media_reordered', handleMediaReordered);
      wsManager.off('product:primary_image_changed', handlePrimaryImageChanged);
      wsManager.off('product:image_deleted', handleImageDeleted);
      
      if (wsManager.isConnected) {
        wsManager.socket?.emit('unsubscribe:product_images', { productId });
      }
    };
  }, [wsManager, productId, handleImageUpdated, handleHeroImageUpdated, handleMediaReordered, handlePrimaryImageChanged, handleImageDeleted]);

  // 📤 Sync Actions
  const syncImages = useCallback(async (newImages: ProductMedia[]) => {
    if (!wsManager?.isConnected) {
      logger.warn('Cannot sync images: WebSocket not connected');
      return;
    }

    try {
      setSyncState(prev => ({
        ...prev,
        pendingUpdates: new Set([...prev.pendingUpdates, productId])
      }));

      wsManager.socket?.emit('product:update_images', {
        productId,
        images: newImages,
        timestamp: new Date().toISOString()
      });

      logger.info('Images sync initiated', { productId, imageCount: newImages.length });
    } catch (error) {
      logger.error('Failed to sync images:', error);
      setSyncState(prev => ({
        ...prev,
        syncErrors: prev.syncErrors + 1,
        pendingUpdates: new Set([...prev.pendingUpdates].filter(id => id !== productId))
      }));
    }
  }, [wsManager, productId]);

  const syncImageReorder = useCallback(async (reorderedImages: ProductMedia[]) => {
    if (!wsManager?.isConnected) {
      logger.warn('Cannot sync image reorder: WebSocket not connected');
      return;
    }

    try {
      wsManager.socket?.emit('product:reorder_images', {
        productId,
        media: reorderedImages,
        timestamp: new Date().toISOString()
      });

      logger.info('Image reorder sync initiated', { productId, imageCount: reorderedImages.length });
    } catch (error) {
      logger.error('Failed to sync image reorder:', error);
    }
  }, [wsManager, productId]);

  const syncPrimaryImage = useCallback(async (primaryImageId: string) => {
    if (!wsManager?.isConnected) {
      logger.warn('Cannot sync primary image: WebSocket not connected');
      return;
    }

    try {
      wsManager.socket?.emit('product:set_primary_image', {
        productId,
        primaryImageId,
        timestamp: new Date().toISOString()
      });

      logger.info('Primary image sync initiated', { productId, primaryImageId });
    } catch (error) {
      logger.error('Failed to sync primary image:', error);
    }
  }, [wsManager, productId]);

  const syncImageDelete = useCallback(async (imageId: string) => {
    if (!wsManager?.isConnected) {
      logger.warn('Cannot sync image delete: WebSocket not connected');
      return;
    }

    try {
      wsManager.socket?.emit('product:delete_image', {
        productId,
        imageId,
        timestamp: new Date().toISOString()
      });

      logger.info('Image delete sync initiated', { productId, imageId });
    } catch (error) {
      logger.error('Failed to sync image delete:', error);
    }
  }, [wsManager, productId]);

  return {
    images,
    setImages,
    syncState,
    syncImages,
    syncImageReorder,
    syncPrimaryImage,
    syncImageDelete,
    isConnected: syncState.isConnected,
    lastSync: syncState.lastSync,
    syncErrors: syncState.syncErrors,
    hasPendingUpdates: syncState.pendingUpdates.has(productId)
  };
};

// 🎯 Global Image Sync Hook for multiple products
export const useGlobalImageSync = () => {
  const { wsManager, connectionStatus } = useWebSocket();
  const [globalSyncState, setGlobalSyncState] = useState({
    isConnected: connectionStatus.connected,
    lastGlobalSync: null as string | null,
    totalSyncEvents: 0,
    syncErrors: 0
  });

  // 📊 Global sync statistics
  const handleGlobalImageEvent = useCallback((eventType: string, data: any) => {
    setGlobalSyncState(prev => ({
      ...prev,
      lastGlobalSync: data.timestamp || new Date().toISOString(),
      totalSyncEvents: prev.totalSyncEvents + 1
    }));

    logger.info(`Global image sync event: ${eventType}`, data);
  }, []);

  useEffect(() => {
    if (!wsManager) return;

    // Subscribe to all image events
    const eventTypes = [
      'product:image_updated',
      'drop:hero_image_updated',
      'product:media_reordered',
      'product:primary_image_changed',
      'product:image_deleted'
    ];

    eventTypes.forEach(eventType => {
      wsManager.on(eventType, (data) => handleGlobalImageEvent(eventType, data));
    });

    return () => {
      eventTypes.forEach(eventType => {
        wsManager.off(eventType, handleGlobalImageEvent);
      });
    };
  }, [wsManager, handleGlobalImageEvent]);

  useEffect(() => {
    setGlobalSyncState(prev => ({
      ...prev,
      isConnected: connectionStatus.connected
    }));
  }, [connectionStatus.connected]);

  return {
    ...globalSyncState,
    isConnected: globalSyncState.isConnected
  };
};

// 🎯 Image Sync Status Component Hook
export const useImageSyncStatus = () => {
  const globalSync = useGlobalImageSync();
  
  const getStatusColor = useCallback(() => {
    if (!globalSync.isConnected) return 'text-red-400';
    if (globalSync.syncErrors > 0) return 'text-yellow-400';
    return 'text-green-400';
  }, [globalSync.isConnected, globalSync.syncErrors]);

  const getStatusText = useCallback(() => {
    if (!globalSync.isConnected) return 'Offline';
    if (globalSync.syncErrors > 0) return 'Sync Issues';
    return 'Synced';
  }, [globalSync.isConnected, globalSync.syncErrors]);

  return {
    ...globalSync,
    statusColor: getStatusColor(),
    statusText: getStatusText()
  };
};





