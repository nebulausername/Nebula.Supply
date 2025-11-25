import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';

export interface ImageEvent {
  type: 'image:uploaded' | 'image:processed' | 'image:optimized' | 'image:deleted';
  imageId: string;
  image?: any;
  progress?: number;
  timestamp: string;
}

export interface UseRealtimeImagesOptions extends UseRealtimeOptions {
  filters?: {
    imageIds?: string[];
  };
  onUploaded?: (event: ImageEvent) => void;
  onProcessed?: (event: ImageEvent) => void;
  onOptimized?: (event: ImageEvent) => void;
  onDeleted?: (event: ImageEvent) => void;
}

export function useRealtimeImages(options: UseRealtimeImagesOptions = {}) {
  const queryClient = useQueryClient();
  const { subscribe, unsubscribe, isConnected, client } = useRealtime({
    enabled: options.enabled,
    onConnect: options.onConnect,
    onDisconnect: options.onDisconnect,
    onError: options.onError
  });

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleEvent = useCallback((event: ImageEvent) => {
    logger.info('[useRealtimeImages] Event received:', event.type);

    switch (event.type) {
      case 'image:uploaded':
        queryClient.invalidateQueries({ queryKey: ['images'] });
        optionsRef.current.onUploaded?.(event);
        break;
      case 'image:processed':
        if (event.imageId) {
          queryClient.invalidateQueries({ queryKey: ['images', event.imageId] });
        }
        optionsRef.current.onProcessed?.(event);
        break;
      case 'image:optimized':
        if (event.imageId) {
          queryClient.invalidateQueries({ queryKey: ['images', event.imageId] });
        }
        optionsRef.current.onOptimized?.(event);
        break;
      case 'image:deleted':
        queryClient.invalidateQueries({ queryKey: ['images'] });
        queryClient.removeQueries({ queryKey: ['images', event.imageId] });
        optionsRef.current.onDeleted?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToImages(options.filters);

    const unsubscribeUploaded = subscribe('image:uploaded', handleEvent);
    const unsubscribeProcessed = subscribe('image:processed', handleEvent);
    const unsubscribeOptimized = subscribe('image:optimized', handleEvent);
    const unsubscribeDeleted = subscribe('image:deleted', handleEvent);

    return () => {
      unsubscribeUploaded();
      unsubscribeProcessed();
      unsubscribeOptimized();
      unsubscribeDeleted();
      client.unsubscribeFromImages();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

