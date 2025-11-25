/**
 * Realtime Configuration
 * 
 * Um Echtzeit-Features zu aktivieren:
 * 1. Starte den WebSocket-Server (api-server)
 * 2. Setze ENABLE_REALTIME auf true
 * 3. Passe WEBSOCKET_URL an, falls nötig
 */

export const REALTIME_CONFIG = {
  // Aktiviere Echtzeit-Features (WebSocket-Server muss laufen)
  ENABLE_REALTIME: true,
  
  // WebSocket Server URL
  WEBSOCKET_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  
  // Auto-Refresh Intervall (Fallback wenn WebSocket nicht verfügbar)
  AUTO_REFRESH_INTERVAL: 30000, // 30 Sekunden
  
  // Aktiviere Auto-Refresh als Fallback
  ENABLE_AUTO_REFRESH: false,
  
  // Debug-Modus (zeigt Console-Logs)
  DEBUG: import.meta.env.DEV,
};

/**
 * Prüft ob Echtzeit-Features verfügbar sind
 */
export const isRealtimeAvailable = () => {
  return REALTIME_CONFIG.ENABLE_REALTIME && typeof WebSocket !== 'undefined';
};

/**
 * Gibt die WebSocket-URL zurück
 */
export const getWebSocketUrl = () => {
  return REALTIME_CONFIG.WEBSOCKET_URL;
};




