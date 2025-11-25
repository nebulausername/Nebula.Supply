/**
 * Bot Authentication Hook
 * Manages authentication state from Telegram Bot
 */

import { useEffect, useState } from 'react';
import {
  parseTelegramData,
  isBotVerified,
  getBotUser,
  initBotIntegration,
  BotUser
} from '../utils/botIntegration';

export interface BotAuthState {
  isAuthenticated: boolean;
  isVerified: boolean;
  user: BotUser | null;
  isLoading: boolean;
  error: string | null;
}

export const useBotAuth = () => {
  const [state, setState] = useState<BotAuthState>({
    isAuthenticated: false,
    isVerified: false,
    user: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Initialize bot integration
        initBotIntegration();

        // Parse Telegram data
        const data = parseTelegramData();
        
        if (!data) {
          setState({
            isAuthenticated: false,
            isVerified: false,
            user: null,
            isLoading: false,
            error: 'No Telegram data found'
          });
          return;
        }

        // Check if user is verified
        const verified = isBotVerified();
        const user = getBotUser();

        setState({
          isAuthenticated: true,
          isVerified: verified,
          user,
          isLoading: false,
          error: null
        });

        console.log('Bot auth state:', { 
          isAuthenticated: true, 
          isVerified: verified, 
          user: user?.first_name 
        });

      } catch (error) {
        console.error('Bot auth check failed:', error);
        setState({
          isAuthenticated: false,
          isVerified: false,
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    checkAuth();
  }, []);

  return state;
};



