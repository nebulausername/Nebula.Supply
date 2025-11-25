export type LeaderboardType = 'totalCookies' | 'cps' | 'timePlayed';

export interface LeaderboardPlayer {
  userId: string;
  nickname: string | null;
  rank: number;
  totalCookies: number;
  cookiesPerSecond: number;
  timePlayed: number;
  avatarUrl: string | null;
}

export interface CookieStats {
  totalCookies: number;
  cookiesPerSecond: number;
  timePlayed: number;
  avatarUrl?: string | null;
}

export interface NicknameCheckResponse {
  hasNickname: boolean;
  nickname: string | null;
  canChange: boolean;
}

// Fetch leaderboard
export async function fetchLeaderboard(type: LeaderboardType): Promise<LeaderboardPlayer[]> {
  const response = await fetch(`/api/cookie/leaderboard?type=${type}&limit=100`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  
  const data = await response.json();
  return data.data || [];
}

// Save stats
export async function saveStats(stats: CookieStats): Promise<void> {
  // Try multiple token sources
  const token = 
    localStorage.getItem('auth_token') || 
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('telegram_token') ||
    sessionStorage.getItem('telegram_token');
  
  const response = await fetch('/api/cookie/stats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    credentials: 'include',
    body: JSON.stringify(stats)
  });
  
  if (!response.ok) {
    // Silently fail for stats - don't interrupt gameplay
    if (import.meta.env.DEV) {
      const error = await response.json().catch(() => ({ message: 'Failed to save stats' }));
      console.warn('Failed to save stats:', error.message || 'Failed to save stats');
    }
    // Don't throw - stats sync is not critical
    return;
  }
}

// Set nickname
export async function setNickname(nickname: string): Promise<{ nickname: string }> {
  // Try multiple token sources
  const token = 
    localStorage.getItem('auth_token') || 
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('telegram_token') ||
    sessionStorage.getItem('telegram_token');
  
  const response = await fetch('/api/cookie/nickname', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    credentials: 'include',
    body: JSON.stringify({ nickname })
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to set nickname';
    try {
      const errorData = await response.json();
      // Extract error message from different possible formats
      errorMessage = errorData.error || errorData.message || errorData.data?.error || errorMessage;
      
      // Handle specific error codes
      if (response.status === 401) {
        errorMessage = 'Du musst dich zuerst mit Telegram anmelden. Bitte gehe zur Startseite und klicke auf den Telegram-Login-Button.';
      } else if (response.status === 409) {
        errorMessage = 'Nickname bereits vergeben';
      } else if (response.status === 403) {
        errorMessage = 'Nickname kann nur von VIP oder Stammkunde geändert werden';
      } else if (response.status === 400) {
        errorMessage = errorMessage || 'Ungültiger Nickname';
      }
    } catch (e) {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data.data;
}

// Check if nickname exists
export async function checkNicknameExists(nickname: string): Promise<boolean> {
  const response = await fetch(`/api/cookie/nickname/check?nickname=${encodeURIComponent(nickname)}`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    return false;
  }
  
  // This endpoint doesn't exist yet, so we'll use the leaderboard to check
  // For now, return false (will be handled by backend validation)
  return false;
}

// Check if nickname is set
export async function checkNicknameSet(): Promise<NicknameCheckResponse> {
  // Try multiple token sources
  const token = 
    localStorage.getItem('auth_token') || 
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('telegram_token') ||
    sessionStorage.getItem('telegram_token');
  
  const response = await fetch('/api/cookie/nickname/check', {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    // If not authenticated, return default (no nickname)
    if (response.status === 401) {
      return {
        hasNickname: false,
        nickname: null,
        canChange: false
      };
    }
    // For other errors, also return default
    return {
      hasNickname: false,
      nickname: null,
      canChange: false
    };
  }
  
  const data = await response.json();
  return data.data || {
    hasNickname: false,
    nickname: null,
    canChange: false
  };
}

