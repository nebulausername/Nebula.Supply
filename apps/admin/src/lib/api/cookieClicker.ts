const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token') || 
         sessionStorage.getItem('auth_token') ||
         null;
};

// API Response types
export interface CookiePlayer {
  userId: string;
  nickname: string | null;
  totalCookies: number;
  cookiesPerSecond: number;
  timePlayed: number;
  avatarUrl: string | null;
  lastUpdated: string;
  createdAt: string;
}

export interface CookiePlayersResponse {
  players: CookiePlayer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CookieStats {
  totalPlayers: number;
  activePlayers24h: number;
  activePlayers7d: number;
  activePlayers30d: number;
  totalCookiesGenerated: number;
  averageCPS: number;
  averagePlaytime: number;
  topPlayer: {
    userId: string;
    nickname: string | null;
    totalCookies: number;
  } | null;
}

export interface CookieAnalytics extends CookieStats {
  range: '24h' | '7d' | '30d' | 'all';
  growthRate: {
    players24h: number;
    players7d: number;
    players30d: number;
  };
  engagement: {
    averageSessionTime: number;
    averageCPS: number;
    totalCookiesPerPlayer: number;
  };
}

// API Functions
export async function getCookieStats(): Promise<CookieStats> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cookie stats');
  }

  const data = await response.json();
  return data.data;
}

export interface PlayerFilters {
  minCookies?: string;
  maxCookies?: string;
  minCPS?: string;
  maxCPS?: string;
  minTimePlayed?: string;
  maxTimePlayed?: string;
  hasNickname?: boolean | null;
  vipStatus?: boolean | null;
  minPrestigeLevel?: string;
  maxPrestigeLevel?: string;
  minAchievements?: string;
  maxAchievements?: string;
  lastLoginDays?: string;
  filterLogic?: 'AND' | 'OR';
}

export async function getCookiePlayers(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'totalCookies' | 'cookiesPerSecond' | 'timePlayed' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
  filters?: PlayerFilters;
}): Promise<CookiePlayersResponse> {
  const token = getAuthToken();
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const response = await fetch(`${API_URL}/api/admin/cookie/players?${queryParams}`, {
    method: params.filters ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: params.filters ? JSON.stringify({ filters: params.filters }) : undefined,
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cookie players');
  }

  const data = await response.json();
  return data.data;
}

export async function getCookiePlayer(userId: string): Promise<CookiePlayer> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player');
  }

  const data = await response.json();
  return data.data;
}

export async function resetPlayerProgress(userId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}/reset`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to reset player progress');
  }
}

export async function banPlayer(userId: string, reason: string, banned: boolean = true): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}/ban`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason, banned }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to ban player');
  }
}

export async function adjustPlayerStats(userId: string, stats: {
  totalCookies?: number;
  cookiesPerSecond?: number;
  timePlayed?: number;
}): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/leaderboard/adjust`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, stats }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to adjust player stats');
  }
}

export async function resetLeaderboard(type?: 'totalCookies' | 'cps' | 'timePlayed'): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/leaderboard/reset`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to reset leaderboard');
  }
}

export async function getCookieAnalytics(range: '24h' | '7d' | '30d' | 'all' = '7d'): Promise<CookieAnalytics> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/analytics?range=${range}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  const data = await response.json();
  return data.data;
}

export interface PlayerHistoryEntry {
  timestamp: string;
  event: string;
  data: any;
}

export interface PlayerAchievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
  progress: number;
  maxProgress: number;
}

export interface PlayerDetailedStats {
  buildings: Array<{ id: string; name: string; owned: number; totalCps: number }>;
  upgrades: Array<{ id: string; name: string; owned: boolean }>;
  prestige: {
    level: number;
    points: number;
    history: Array<{ timestamp: string; level: number; points: number }>;
  };
  vip: {
    hasVip: boolean;
    tier: number;
    passiveIncome: number;
    unlockedAt: string | null;
  };
  sessions: Array<{
    startTime: string;
    endTime: string | null;
    duration: number;
    cookiesGained: number;
  }>;
  cookieHistory: Array<{
    timestamp: string;
    cookies: number;
    cps: number;
  }>;
}

export async function getCookiePlayerHistory(userId: string, limit: number = 100): Promise<PlayerHistoryEntry[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}/history?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player history');
  }

  const data = await response.json();
  return data.data;
}

export async function getCookiePlayerAchievements(userId: string): Promise<PlayerAchievement[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}/achievements`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player achievements');
  }

  const data = await response.json();
  return data.data;
}

export async function getCookiePlayerDetailedStats(userId: string): Promise<PlayerDetailedStats | null> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch detailed player stats');
  }

  const data = await response.json();
  return data.data;
}

export interface PlayerNote {
  id: number;
  note: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerTag {
  id: number;
  tag: string;
  adminId: string;
  createdAt: string;
}

export async function getCookiePlayerNotes(userId: string): Promise<PlayerNote[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}/notes`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player notes');
  }

  const data = await response.json();
  return data.data;
}

export async function addCookiePlayerNote(userId: string, note: string): Promise<PlayerNote> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}/notes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ note }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to add player note');
  }

  const data = await response.json();
  return data.data;
}

export async function updateCookiePlayerNote(noteId: number, note: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/notes/${noteId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ note }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to update player note');
  }
}

export async function deleteCookiePlayerNote(noteId: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/notes/${noteId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to delete player note');
  }
}

export async function getCookiePlayerTags(userId: string): Promise<PlayerTag[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}/tags`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player tags');
  }

  const data = await response.json();
  return data.data;
}

export async function addCookiePlayerTag(userId: string, tag: string): Promise<PlayerTag> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}/tags`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tag }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to add player tag');
  }

  const data = await response.json();
  return data.data;
}

export async function removeCookiePlayerTag(userId: string, tag: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/player/${userId}/tags/${encodeURIComponent(tag)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to remove player tag');
  }
}

export interface BulkOperationResult {
  success: string[];
  failed: Array<{ userId: string; error: string }>;
}

export async function bulkOperation(action: 'reset' | 'ban' | 'unban' | 'adjust_stats' | 'add_tag' | 'remove_tag', userIds: string[], data?: any): Promise<BulkOperationResult> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/players/bulk`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, userIds, data }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to perform bulk operation');
  }

  const result = await response.json();
  return result.data;
}

export interface Season {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonReward {
  id: number;
  seasonId: number;
  rankMin: number;
  rankMax: number;
  rewardType: string;
  rewardAmount: number;
  rewardDescription: string;
  distributed: boolean;
  createdAt: string;
}

export async function getSeasons(): Promise<Season[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/seasons`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch seasons');
  }

  const data = await response.json();
  return data.data;
}

export async function getSeason(seasonId: number): Promise<Season & { leaderboard: any[]; rewards: SeasonReward[] }> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/seasons/${seasonId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch season');
  }

  const data = await response.json();
  return data.data;
}

export async function createSeason(data: {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}): Promise<Season> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/seasons`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to create season');
  }

  const result = await response.json();
  return result.data;
}

export async function updateSeason(seasonId: number, updates: Partial<Season>): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/seasons/${seasonId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to update season');
  }
}

export async function deleteSeason(seasonId: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/seasons/${seasonId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to delete season');
  }
}

export async function snapshotSeasonLeaderboard(seasonId: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/seasons/${seasonId}/snapshot`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to create season snapshot');
  }
}

export async function createSeasonReward(seasonId: number, data: {
  rankMin: number;
  rankMax: number;
  rewardType: string;
  rewardAmount: number;
  rewardDescription?: string;
}): Promise<SeasonReward> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/seasons/${seasonId}/rewards`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to create season reward');
  }

  const result = await response.json();
  return result.data;
}

export async function distributeSeasonRewards(seasonId: number): Promise<{ distributedCount: number }> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/seasons/${seasonId}/distribute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to distribute season rewards');
  }

  const result = await response.json();
  return result.data;
}

// Custom Leaderboards API
export interface CustomLeaderboard {
  id: number;
  name: string;
  description: string | null;
  metric: string;
  filter: {
    vipOnly: boolean;
    minPrestige: number | null;
    minAchievements: number | null;
  };
  isPublic: boolean;
  isTemporary: boolean;
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CustomLeaderboardRanking {
  userId: string;
  nickname: string | null;
  rank: number;
  metricValue: number;
}

export async function getCustomLeaderboards(): Promise<CustomLeaderboard[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/custom-leaderboards`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch custom leaderboards');
  }

  const result = await response.json();
  return result.data;
}

export async function getCustomLeaderboard(leaderboardId: number): Promise<CustomLeaderboard & { rankings?: CustomLeaderboardRanking[] }> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/custom-leaderboards/${leaderboardId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch custom leaderboard');
  }

  const result = await response.json();
  return result.data;
}

export async function createCustomLeaderboard(data: {
  name: string;
  description?: string;
  metric: string;
  filter?: {
    vipOnly?: boolean;
    minPrestige?: number;
    minAchievements?: number;
  };
  isPublic: boolean;
  isTemporary: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<CustomLeaderboard> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/custom-leaderboards`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to create custom leaderboard');
  }

  const result = await response.json();
  return result.data;
}

export async function updateCustomLeaderboard(leaderboardId: number, updates: {
  name?: string;
  description?: string;
  metric?: string;
  filter?: {
    vipOnly?: boolean;
    minPrestige?: number;
    minAchievements?: number;
  };
  isPublic?: boolean;
  isTemporary?: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<CustomLeaderboard> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/custom-leaderboards/${leaderboardId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update custom leaderboard');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteCustomLeaderboard(leaderboardId: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/custom-leaderboards/${leaderboardId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to delete custom leaderboard');
  }
}

export async function getCustomLeaderboardRankings(leaderboardId: number, limit: number = 100): Promise<CustomLeaderboardRanking[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/admin/cookie/custom-leaderboards/${leaderboardId}/rankings?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch custom leaderboard rankings');
  }

  const result = await response.json();
  return result.data;
}






































