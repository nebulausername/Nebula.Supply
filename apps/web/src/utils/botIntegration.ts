/**
 * Bot Integration Utilities
 * Handles communication between Web App and Telegram Bot
 */

export interface BotUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_premium?: boolean;
}

export interface BotAuthData {
  user: BotUser;
  auth_date: number;
  hash: string;
}

/**
 * Parse Telegram WebApp init data
 */
export const parseTelegramData = (): BotAuthData | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get init data from Telegram WebApp
    const initData = (window as any).Telegram?.WebApp?.initData;
    if (!initData) return null;

    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    const authDate = params.get('auth_date');
    const hash = params.get('hash');

    if (!userStr || !authDate || !hash) return null;

    return {
      user: JSON.parse(userStr),
      auth_date: parseInt(authDate),
      hash
    };
  } catch (error) {
    console.error('Failed to parse Telegram data:', error);
    return null;
  }
};

/**
 * Check if user is verified via bot
 */
export const isBotVerified = (): boolean => {
  const data = parseTelegramData();
  if (!data) return false;

  // Check if auth date is recent (within 24 hours)
  const now = Math.floor(Date.now() / 1000);
  const authDate = data.auth_date;
  const isRecent = (now - authDate) < 24 * 60 * 60; // 24 hours

  return isRecent;
};

/**
 * Get bot user info
 */
export const getBotUser = (): BotUser | null => {
  const data = parseTelegramData();
  return data?.user || null;
};

/**
 * Send data to bot
 */
export const sendToBot = (data: any): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.sendData) {
      webApp.sendData(JSON.stringify(data));
    }
  } catch (error) {
    console.error('Failed to send data to bot:', error);
  }
};

/**
 * Close WebApp and return to bot
 */
export const closeWebApp = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.close) {
      webApp.close();
    }
  } catch (error) {
    console.error('Failed to close WebApp:', error);
  }
};

/**
 * Show bot confirmation
 */
export const showBotAlert = (message: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.showAlert) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  } catch (error) {
    console.error('Failed to show bot alert:', error);
    alert(message);
  }
};

/**
 * Show bot confirmation dialog
 */
export const showBotConfirm = (message: string, callback: (confirmed: boolean) => void): void => {
  if (typeof window === 'undefined') {
    callback(confirm(message));
    return;
  }
  
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.showConfirm) {
      webApp.showConfirm(message, callback);
    } else {
      callback(confirm(message));
    }
  } catch (error) {
    console.error('Failed to show bot confirm:', error);
    callback(confirm(message));
  }
};

/**
 * Enable/disable WebApp closing confirmation
 */
export const setClosingConfirmation = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.enableClosingConfirmation) {
      webApp.enableClosingConfirmation(enabled);
    }
  } catch (error) {
    console.error('Failed to set closing confirmation:', error);
  }
};

/**
 * Set WebApp header color
 */
export const setHeaderColor = (color: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.setHeaderColor) {
      webApp.setHeaderColor(color);
    }
  } catch (error) {
    console.error('Failed to set header color:', error);
  }
};

/**
 * Set WebApp background color
 */
export const setBackgroundColor = (color: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.setBackgroundColor) {
      webApp.setBackgroundColor(color);
    }
  } catch (error) {
    console.error('Failed to set background color:', error);
  }
};

/**
 * Expand WebApp to full height
 */
export const expandWebApp = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.expand) {
      webApp.expand();
    }
  } catch (error) {
    console.error('Failed to expand WebApp:', error);
  }
};

/**
 * Initialize WebApp integration
 */
export const initBotIntegration = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp) {
      // Configure WebApp
      webApp.ready();
      webApp.expand();
      
      // Set Nebula theme colors
      setHeaderColor('#0BF7BC'); // Nebula green
      setBackgroundColor('#000000'); // Black background
      
      // Enable closing confirmation for important actions
      setClosingConfirmation(true);
      
      console.log('Bot integration initialized');
    }
  } catch (error) {
    console.error('Failed to initialize bot integration:', error);
  }
};



