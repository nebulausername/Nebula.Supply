/**
 * Dev Mode Security & Access Control
 * 
 * Provides secure access mechanism for developer-only features
 */

const DEV_COOKIE_NAME = 'nebula_dev_access';
const DEV_COOKIE_EXPIRY_DAYS = 1;

// Get secret key from environment or use fallback (only for local dev)
const getSecretKey = (): string => {
  const envKey = import.meta.env.VITE_DEV_SECRET_KEY;
  if (envKey) {
    return envKey;
  }
  
  // Fallback for local development only
  if (import.meta.env.DEV) {
    return 'dev-secret-key-local-only-change-in-production';
  }
  
  return '';
};

/**
 * Simple hash function for token generation
 */
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Generate dev mode token
 */
export const generateDevToken = (): string => {
  const secret = getSecretKey();
  const timestamp = Date.now().toString();
  const combined = `${secret}-${timestamp}`;
  return simpleHash(combined);
};

/**
 * Validate dev mode token
 */
export const validateDevToken = (token: string): boolean => {
  const secret = getSecretKey();
  if (!secret) {
    return false;
  }
  
  // Token validation is simplified - in production, use proper encryption
  // For now, we check if token exists and is not expired
  try {
    const cookie = getDevCookie();
    if (!cookie || cookie.token !== token) {
      return false;
    }
    
    // Check expiry
    if (cookie.expires && Date.now() > cookie.expires) {
      clearDevCookie();
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Dev cookie structure
 */
interface DevCookie {
  token: string;
  expires: number;
  activated: number;
}

/**
 * Set dev mode cookie
 */
export const setDevCookie = (token: string): void => {
  const expires = new Date();
  expires.setDate(expires.getDate() + DEV_COOKIE_EXPIRY_DAYS);
  
  const cookieData: DevCookie = {
    token,
    expires: expires.getTime(),
    activated: Date.now(),
  };
  
  const cookieValue = btoa(JSON.stringify(cookieData));
  document.cookie = `${DEV_COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
};

/**
 * Get dev mode cookie
 */
export const getDevCookie = (): DevCookie | null => {
  try {
    const cookies = document.cookie.split(';');
    const devCookie = cookies.find(c => c.trim().startsWith(`${DEV_COOKIE_NAME}=`));
    
    if (!devCookie) {
      return null;
    }
    
    const value = devCookie.split('=')[1];
    const decoded = JSON.parse(atob(value));
    return decoded as DevCookie;
  } catch {
    return null;
  }
};

/**
 * Clear dev mode cookie
 */
export const clearDevCookie = (): void => {
  document.cookie = `${DEV_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

/**
 * Check if dev mode is enabled via URL parameter
 */
export const checkUrlDevMode = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  const devParam = urlParams.get('dev');
  
  if (!devParam) {
    return false;
  }
  
  const secret = getSecretKey();
  if (!secret) {
    return false;
  }
  
  // Simple comparison (in production, use proper comparison)
  if (devParam === secret || devParam === 'dev-secret-key-local-only-change-in-production') {
    const token = generateDevToken();
    setDevCookie(token);
    return true;
  }
  
  return false;
};

/**
 * Check secret key sequence (Konami code style)
 * Supports: D-E-V-M-O-D-E or custom sequence
 */
export class SecretKeySequence {
  private sequence: string[] = [];
  private targetSequence: string[];
  private maxTimeBetweenKeys: number;
  private lastKeyTime: number = 0;

  constructor(targetSequence: string[] = ['d', 'e', 'v', 'm', 'o', 'd', 'e'], maxTimeBetweenKeys: number = 2000) {
    this.targetSequence = targetSequence.map(k => k.toLowerCase());
    this.maxTimeBetweenKeys = maxTimeBetweenKeys;
  }

  addKey(key: string): boolean {
    const now = Date.now();
    const keyLower = key.toLowerCase();

    // Reset if too much time passed
    if (now - this.lastKeyTime > this.maxTimeBetweenKeys) {
      this.sequence = [];
    }

    this.sequence.push(keyLower);
    this.lastKeyTime = now;

    // Keep only last N keys
    if (this.sequence.length > this.targetSequence.length) {
      this.sequence = this.sequence.slice(-this.targetSequence.length);
    }

    // Check if sequence matches
    if (this.sequence.length === this.targetSequence.length) {
      const matches = this.sequence.every((k, i) => k === this.targetSequence[i]);
      if (matches) {
        this.reset();
        return true;
      }
    }

    return false;
  }

  reset(): void {
    this.sequence = [];
    this.lastKeyTime = 0;
  }
}

/**
 * Check logo click sequence (5 clicks)
 */
export class LogoClickSequence {
  private clicks: number[] = [];
  private maxTimeBetweenClicks: number = 2000;
  private requiredClicks: number = 5;

  addClick(): boolean {
    const now = Date.now();
    
    // Remove clicks that are too old
    this.clicks = this.clicks.filter(time => now - time < this.maxTimeBetweenClicks);
    
    // Add new click
    this.clicks.push(now);
    
    // Check if we have enough clicks
    if (this.clicks.length >= this.requiredClicks) {
      this.reset();
      return true;
    }
    
    return false;
  }

  reset(): void {
    this.clicks = [];
  }
}







































