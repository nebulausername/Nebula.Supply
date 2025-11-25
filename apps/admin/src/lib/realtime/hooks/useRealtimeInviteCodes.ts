import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';

export interface InviteCodeEvent {
  type: 'invite:code_created' | 'invite:code_used' | 'invite:code_expired' | 'invite:bulk_generated';
  codeId?: string;
  code?: any;
  userId?: string;
  count?: number;
  timestamp: string;
}

export interface UseRealtimeInviteCodesOptions extends UseRealtimeOptions {
  filters?: {
    codeIds?: string[];
  };
  onCodeCreated?: (event: InviteCodeEvent) => void;
  onCodeUsed?: (event: InviteCodeEvent) => void;
  onCodeExpired?: (event: InviteCodeEvent) => void;
  onBulkGenerated?: (event: InviteCodeEvent) => void;
}

export function useRealtimeInviteCodes(options: UseRealtimeInviteCodesOptions = {}) {
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

  const handleEvent = useCallback((event: InviteCodeEvent) => {
    logger.info('[useRealtimeInviteCodes] Event received:', event.type);

    switch (event.type) {
      case 'invite:code_created':
        queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
        optionsRef.current.onCodeCreated?.(event);
        break;
      case 'invite:code_used':
        queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
        if (event.codeId) {
          queryClient.invalidateQueries({ queryKey: ['inviteCodes', event.codeId] });
        }
        optionsRef.current.onCodeUsed?.(event);
        break;
      case 'invite:code_expired':
        queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
        if (event.codeId) {
          queryClient.invalidateQueries({ queryKey: ['inviteCodes', event.codeId] });
        }
        optionsRef.current.onCodeExpired?.(event);
        break;
      case 'invite:bulk_generated':
        queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
        optionsRef.current.onBulkGenerated?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToInviteCodes(options.filters);

    const unsubscribeCodeCreated = subscribe('invite:code_created', handleEvent);
    const unsubscribeCodeUsed = subscribe('invite:code_used', handleEvent);
    const unsubscribeCodeExpired = subscribe('invite:code_expired', handleEvent);
    const unsubscribeBulkGenerated = subscribe('invite:bulk_generated', handleEvent);

    return () => {
      unsubscribeCodeCreated();
      unsubscribeCodeUsed();
      unsubscribeCodeExpired();
      unsubscribeBulkGenerated();
      client.unsubscribeFromInviteCodes();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

