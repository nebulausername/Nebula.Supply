/**
 * 🤖 Telegram WebApp Integration
 * 
 * WAS MACHT DIESE INTEGRATION?
 * 
 * Die Telegram WebApp Integration verbindet deine Web-App mit dem Telegram Bot.
 * Wenn ein User die App IN Telegram öffnet (nicht im Browser), kann die App:
 * 
 * 1. ✅ NATIVE TELEGRAM FEATURES nutzen:
 *    - Haupt-Button unten im Telegram-Interface anzeigen
 *    - Zurück-Button für Navigation
 *    - Alerts/Confirmations direkt in Telegram anzeigen
 *    - Theme-Farben automatisch anpassen
 *    - User-Daten automatisch vom Bot erhalten
 * 
 * 2. ✅ BOT KOMMUNIKATION:
 *    - Befehle vom Bot empfangen und ausführen
 *    - Daten an den Bot zurücksenden
 *    - User-Authentifizierung über Telegram
 * 
 * 3. ✅ SEAMLESS USER EXPERIENCE:
 *    - App öffnet sich nahtlos im Telegram-Interface
 *    - Kein zusätzlicher Login nötig (User ist automatisch eingeloggt)
 *    - Native Telegram-Buttons und -Features
 * 
 * WIE FUNKTIONIERT ES?
 * 
 * - Wenn User die App IN Telegram öffnet → Telegram lädt automatisch das WebApp Script
 * - Die App erkennt Telegram und initialisiert die Integration
 * - Wenn User die App im Browser öffnet → läuft normal ohne Telegram-Features
 * 
 * BEISPIEL:
 * User klickt auf Bot-Button "Shop öffnen" → App öffnet sich in Telegram → 
 * Telegram WebApp wird initialisiert → Haupt-Button "🚀 Zum Shop" erscheint unten
 */
import { useBotCommands } from './botCommands';

// Telegram WebApp type definition (for internal use)
type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: any) => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
  sendData: (data: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  showPopup: (params: any, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup: (params: any, callback?: (text: string) => void) => void;
  closeScanQrPopup: () => void;
  readTextFromClipboard: (callback?: (text: string) => void) => void;
  requestWriteAccess: (callback?: (granted: boolean) => void) => void;
  requestContact: (callback?: (granted: boolean, contact?: any) => void) => void;
  initData: string;
  initDataUnsafe: any;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: any;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  isVerticalSwipesEnabled: boolean;
  isHorizontalSwipesEnabled: boolean;
};

// Note: Window.Telegram is declared as 'any' in TelegramLoginButton.tsx
// We use type assertion internally to get proper typing

export const useTelegramIntegration = () => {
  const { executeCommand, getAvailableCommands } = useBotCommands();

  // Check Telegram WebApp version and feature support
  const checkTelegramFeatures = (tg: TelegramWebApp) => {
    const version = tg.version || '0.0';
    const versionParts = version.split('.').map(Number);
    const majorVersion = versionParts[0] || 0;
    const minorVersion = versionParts[1] || 0;
    
    // Version 6.0+ has limited feature support
    const isVersion6Plus = majorVersion >= 6;
    
    return {
      supportsClosingConfirmation: !isVersion6Plus,
      supportsHeaderColor: !isVersion6Plus,
      supportsBackgroundColor: !isVersion6Plus,
      supportsBackButton: !isVersion6Plus,
      supportsMainButton: true, // Always supported
      version,
      majorVersion,
      minorVersion
    };
  };

  const initializeTelegram = async (retries = 5, delay = 200) => {
    if (typeof window === 'undefined') {
      return null;
    }

    // Try to wait for Telegram WebApp to load
    for (let i = 0; i < retries; i++) {
      if (window.Telegram?.WebApp) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (!window.Telegram?.WebApp) {
      // Silently return null if not in Telegram environment
      // Only log in development mode
      if (import.meta.env.DEV) {
        console.debug('Telegram WebApp not available - running in standalone mode');
      }
      return null;
    }

    const tg = window.Telegram?.WebApp as TelegramWebApp | undefined;
    if (!tg) return null;
    
    // Check feature support based on version
    const features = checkTelegramFeatures(tg);
    
    if (import.meta.env.DEV) {
      console.debug(`Telegram WebApp Version: ${features.version}`, features);
    }
    
    try {
      // Configure WebApp appearance (only if supported)
      if (features.supportsClosingConfirmation) {
        try {
          tg.enableClosingConfirmation();
        } catch (e) {
          // Silently ignore if not supported
        }
      }
      
      if (features.supportsHeaderColor) {
        try {
          tg.setHeaderColor('#000000');
        } catch (e) {
          // Silently ignore if not supported
        }
      }
      
      if (features.supportsBackgroundColor) {
        try {
          tg.setBackgroundColor('#000000');
        } catch (e) {
          // Silently ignore if not supported
        }
      }
      
      // Expand to full height (always supported)
      try {
        tg.expand();
      } catch (e) {
        // Some versions handle expand differently
      }
      
      // Setup main button (always supported)
      if (tg.MainButton) {
        tg.MainButton.setText('🚀 Zum Shop');
        tg.MainButton.color = '#0BF7BC';
        tg.MainButton.textColor = '#000000';
        
        // Main button click handler
        tg.MainButton.onClick(() => {
          executeCommand('shop');
        });
        
        // Show main button
        tg.MainButton.show();
      }
      
      // Back button (only if supported)
      if (features.supportsBackButton && tg.BackButton) {
        try {
          tg.BackButton.onClick(() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              tg.close();
            }
          });
          tg.BackButton.show();
        } catch (e) {
          // BackButton not available in this version
        }
      }
    
      // Handle data from bot (commands passed via initData)
      if (tg.initData) {
        try {
          const data = new URLSearchParams(tg.initData);
          const command = data.get('command');
          if (command) {
            executeCommand(command);
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Error parsing initData:', error);
          }
        }
      }
      
      // Send available commands to bot (so bot knows what commands are available)
      try {
        const commands = getAvailableCommands();
        tg.sendData(JSON.stringify({
          type: 'commands_available',
          commands: commands.map(cmd => ({
            command: cmd.command,
            description: cmd.description,
            keywords: cmd.keywords
          }))
        }));
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to send commands to bot:', error);
        }
      }
      
      // Notify Telegram that WebApp is ready (should be called last)
      tg.ready();
      
      // Expand WebApp to full height after initialization
      setTimeout(() => {
        try {
          tg.expand();
        } catch (e) {
          // Some Telegram versions handle expand differently
        }
      }, 100);
      
      if (import.meta.env.DEV) {
        console.log(`✅ Telegram WebApp initialized successfully (v${features.version})`);
      }
      return tg;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error initializing Telegram WebApp:', error);
      }
      return null;
    }
  };

  // Load Telegram WebApp script if not already loaded (for standalone/testing)
  const loadTelegramScript = (): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }
      
      // Check if already loaded
      if (window.Telegram?.WebApp) {
        resolve();
        return;
      }
      
      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="telegram-web-app"]');
      if (existingScript) {
        // Wait for existing script to load
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => resolve());
        return;
      }
      
      // Load Telegram WebApp script
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.async = true;
      
      script.onload = () => {
        if (import.meta.env.DEV) {
          console.debug('Telegram WebApp script loaded');
        }
        resolve();
      };
      
      script.onerror = () => {
        if (import.meta.env.DEV) {
          console.debug('Failed to load Telegram WebApp script - running in standalone mode');
        }
        resolve(); // Still resolve, app works without it
      };
      
      document.head.appendChild(script);
    });
  };

  const sendCommandToBot = (command: string, data?: any) => {
    if (!window.Telegram?.WebApp) {
      if (import.meta.env.DEV) {
        console.debug('Cannot send command to bot - Telegram WebApp not available');
      }
      return;
    }
    
    try {
      window.Telegram.WebApp.sendData(JSON.stringify({
        type: 'command',
        command,
        data
      }));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to send command to bot:', error);
      }
    }
  };

  const showBotMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    if (!window.Telegram?.WebApp) {
      // Fallback to browser alert if not in Telegram
      if (import.meta.env.DEV) {
        console.log(`[${type.toUpperCase()}] ${message}`);
      }
      return;
    }
    
    try {
      const tg = window.Telegram.WebApp;
      
      switch (type) {
        case 'success':
          tg.showAlert(`✅ ${message}`);
          break;
        case 'warning':
          tg.showAlert(`⚠️ ${message}`);
          break;
        case 'error':
          tg.showAlert(`❌ ${message}`);
          break;
        default:
          tg.showAlert(`ℹ️ ${message}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to show bot message:', error);
      }
    }
  };

  const requestContact = (): Promise<{ granted: boolean; contact: any }> => {
    return new Promise((resolve) => {
      if (window.Telegram?.WebApp?.requestContact) {
        window.Telegram.WebApp.requestContact((granted: boolean, contact?: any) => {
          resolve({ granted, contact: contact || null });
        });
      } else {
        resolve({ granted: false, contact: null });
      }
    });
  };

  const openTelegramLink = (url: string) => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return {
    initializeTelegram,
    loadTelegramScript,
    sendCommandToBot,
    showBotMessage,
    requestContact,
    openTelegramLink,
    isTelegramAvailable: typeof window !== 'undefined' && !!window.Telegram?.WebApp
  };
};




