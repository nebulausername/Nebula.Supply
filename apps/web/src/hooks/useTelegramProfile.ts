import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { useWebSocket } from './useWebSocket';

export interface TelegramUserData {
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

interface UseTelegramProfileOptions {
  enabled?: boolean;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
}

/**
 * Hook to fetch and manage Telegram profile data with real-time updates
 */
export const useTelegramProfile = (options: UseTelegramProfileOptions = {}) => {
  const {
    enabled = true,
    autoSync = true,
    syncInterval = 60000 // 1 minute default
  } = options;

  const { user } = useAuthStore();
  const [telegramData, setTelegramData] = useState<TelegramUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const syncInProgressRef = useRef(false);

  // Extract Telegram ID from user
  const getTelegramId = useCallback((): number | null => {
    if (!user?.id) return null;
    
    // Check if user.id is in format "tg:123456"
    const tgMatch = String(user.id).match(/^tg:(\d+)$/);
    if (tgMatch) {
      return parseInt(tgMatch[1], 10);
    }
    
    // Try to get from localStorage as fallback
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('telegram_id');
      if (storedId) {
        return parseInt(storedId, 10);
      }
    }
    
    return null;
  }, [user?.id]);

  // Fetch Telegram user data from API with retry logic and better error handling
  const fetchTelegramData = useCallback(async (telegramId: number, retryCount = 0): Promise<TelegramUserData | null> => {
    if (syncInProgressRef.current) return null;
    syncInProgressRef.current = true;
    
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // Start with 1 second
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('telegram_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${apiUrl}/api/bot/users/telegram/${telegramId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle different error types
      if (!response.ok) {
        // Distinguish between auth errors and other errors
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed - token may be invalid or expired');
        }
        
        if (response.status === 404) {
          // User not found - try alternative endpoint
          const altResponse = await fetch(`${apiUrl}/api/auth/telegram/user`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!altResponse.ok) {
            // If alternative also fails, check if it's a network error
            if (altResponse.status >= 500) {
              throw new Error(`Server error: ${altResponse.status}`);
            }
            throw new Error(`Failed to fetch Telegram data: ${response.status}`);
          }

          const altData = await altResponse.json();
          if (altData.data?.user) {
            const userData = altData.data.user;
            return {
              telegramId: userData.telegramId || telegramId,
              firstName: userData.firstName || '',
              lastName: userData.lastName,
              username: userData.username,
              photoUrl: userData.photoUrl || userData.photo_url,
            };
          }
        }
        
        // For other errors, retry with exponential backoff
        if (retryCount < MAX_RETRIES && response.status >= 500) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchTelegramData(telegramId, retryCount + 1);
        }
        
        throw new Error(`Failed to fetch Telegram data: ${response.status}`);
      }

      const data = await response.json();
      if (data.data) {
        const userData = data.data;
        return {
          telegramId: userData.telegramId || telegramId,
          firstName: userData.firstName || '',
          lastName: userData.lastName,
          username: userData.username,
          photoUrl: userData.photoUrl || userData.photo_url,
        };
      }

      return null;
    } catch (err) {
      // Retry on network errors with exponential backoff
      if (retryCount < MAX_RETRIES && err instanceof TypeError && err.message.includes('fetch')) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchTelegramData(telegramId, retryCount + 1);
      }
      
      // Log error with context
      if (import.meta.env.DEV) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorType = err instanceof TypeError ? 'Network Error' : 
                         err instanceof Error && err.message.includes('401') ? 'Auth Error' : 
                         'API Error';
        console.warn(`[useTelegramProfile] ${errorType}:`, {
          message: errorMessage,
          telegramId,
          retryCount,
        });
      }
      return null;
    } finally {
      syncInProgressRef.current = false;
    }
  }, []);

  // Try to get Telegram data from localStorage (stored during login)
  const getStoredTelegramData = useCallback((): TelegramUserData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('telegram_user_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        const telegramId = getTelegramId();
        if (telegramId && parsed.telegramId === telegramId) {
          return parsed;
        }
      }
    } catch (err) {
      // Ignore parse errors
    }
    
    return null;
  }, [getTelegramId]);

  // Store Telegram data in localStorage
  const storeTelegramData = useCallback((data: TelegramUserData) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('telegram_user_data', JSON.stringify(data));
      } catch (err) {
        // Ignore storage errors
      }
    }
  }, []);

  // Sync Telegram data
  const syncTelegramData = useCallback(async () => {
    if (!enabled) return;
    
    const telegramId = getTelegramId();
    if (!telegramId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // First try to get from localStorage for instant display
    const storedData = getStoredTelegramData();
    if (storedData) {
      setTelegramData(storedData);
      setIsLoading(false);
    }

    // Then fetch fresh data from API
    try {
      const freshData = await fetchTelegramData(telegramId);
      if (freshData) {
        setTelegramData(freshData);
        storeTelegramData(freshData);
        setLastSync(new Date());
      } else if (!storedData) {
        // No fresh data and no stored data - try to construct from available info
        const fallbackData: TelegramUserData = {
          telegramId,
          firstName: user?.username?.split(' ')[0] || 'User',
          username: user?.username || undefined,
        };
        setTelegramData(fallbackData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync Telegram data';
      setError(errorMessage);
      
      // Only set fallback if we don't have stored data
      if (!storedData) {
        // Use fallback if no stored data
        const fallbackData: TelegramUserData = {
          telegramId,
          firstName: user?.username?.split(' ')[0] || 'User',
          username: user?.username || undefined,
        };
        setTelegramData(fallbackData);
      }
      
      // Log error for debugging (only in dev mode)
      if (import.meta.env.DEV) {
        console.warn('[useTelegramProfile] Sync failed:', {
          error: errorMessage,
          telegramId,
          hasStoredData: !!storedData,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, getTelegramId, fetchTelegramData, getStoredTelegramData, storeTelegramData, user?.username]);

  // WebSocket message handler for real-time updates
  interface WebSocketProfileMessage {
    type: 'profile:telegram_updated' | 'profile:name_updated' | 'profile:avatar_updated';
    data?: {
      telegramId?: number;
      firstName?: string;
      lastName?: string;
      username?: string;
      photoUrl?: string;
      photo_url?: string;
    };
  }

  const handleWebSocketMessage = useCallback((message: WebSocketProfileMessage | { type: string; data?: any }) => {
    if (message.type === 'profile:telegram_updated' || message.type === 'profile:name_updated' || message.type === 'profile:avatar_updated') {
      const telegramId = getTelegramId();
      const profileMessage = message as WebSocketProfileMessage;
      if (telegramId && profileMessage.data?.telegramId === telegramId) {
        const updatedData: TelegramUserData = {
          telegramId,
          firstName: profileMessage.data.firstName || telegramData?.firstName || 'User',
          lastName: profileMessage.data.lastName || telegramData?.lastName,
          username: profileMessage.data.username || telegramData?.username,
          photoUrl: profileMessage.data.photoUrl || profileMessage.data.photo_url || telegramData?.photoUrl,
        };
        setTelegramData(updatedData);
        storeTelegramData(updatedData);
        setLastSync(new Date());
      }
    }
  }, [getTelegramId, telegramData, storeTelegramData]);

  // WebSocket connection
  const { isConnected, sendMessage } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    enabled: enabled && autoSync,
    onMessage: handleWebSocketMessage,
  });

  // Subscribe to Telegram profile updates
  useEffect(() => {
    if (isConnected && sendMessage) {
      const telegramId = getTelegramId();
      if (telegramId) {
        sendMessage({
          type: 'subscribe:telegram_profile',
          data: { telegramId }
        });
      }
    }
  }, [isConnected, sendMessage, getTelegramId]);

  // Initial sync
  useEffect(() => {
    if (enabled) {
      syncTelegramData();
    }
  }, [enabled]); // Only run on mount/enabled change

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync || !enabled) return;

    const interval = setInterval(() => {
      syncTelegramData();
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, enabled, syncInterval, syncTelegramData]);

  // Get display name (firstName + lastName or username)
  const displayName = useCallback((): string => {
    if (!telegramData) return user?.username || 'User';
    if (telegramData.firstName && telegramData.lastName) {
      return `${telegramData.firstName} ${telegramData.lastName}`;
    }
    return telegramData.firstName || telegramData.username || user?.username || 'User';
  }, [telegramData, user?.username]);

  // Get full name
  const fullName = useCallback((): string => {
    if (!telegramData) return user?.username || 'User';
    const parts = [telegramData.firstName, telegramData.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : telegramData.username || user?.username || 'User';
  }, [telegramData, user?.username]);

  return {
    telegramData,
    displayName: displayName(),
    fullName: fullName(),
    avatar: telegramData?.photoUrl || null,
    firstName: telegramData?.firstName || null,
    lastName: telegramData?.lastName || null,
    username: telegramData?.username || null,
    telegramId: telegramData?.telegramId || null,
    isLoading,
    error,
    lastSync,
    isConnected,
    syncTelegramData,
    clearError: useCallback(() => setError(null), []),
  };
};

