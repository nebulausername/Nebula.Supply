// 🏆 CONTEST SERVICE - API Layer für Gewinnspiel System
// Bereit für Backend Integration

export interface ContestParticipant {
  id: string;
  userId?: string;
  name: string;
  cookies: number;
  achievements: number;
  rank: number;
  joinedAt: string;
  lastUpdate: string;
}

export interface ContestLeaderboard {
  participants: ContestParticipant[];
  totalParticipants: number;
  playerRank: number | null;
  lastUpdated: string;
}

export interface ContestStatus {
  id: string;
  phase: 'open' | 'active' | 'finalized' | 'closed';
  startDate: string;
  endDate: string;
  participantCount: number;
  commitHash?: string;
  revealValue?: string;
  winners?: Array<{
    participantId: string;
    position: number;
    prize: number;
  }>;
}

export interface JoinContestResponse {
  success: boolean;
  participantId?: string;
  message?: string;
}

/**
 * Join a contest
 * In production: POST /api/contests/:contestId/join
 */
export async function joinContest(contestId: string, playerData: {
  totalCookies: number;
  achievements: number;
  level: number;
}): Promise<JoinContestResponse> {
  // TODO: Replace with real API call
  try {
    // Mock implementation
    const response = await fetch(`/api/contests/${contestId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playerData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to join contest');
    }
    
    return await response.json();
  } catch (error) {
    // Fallback to mock data for now
    console.warn('Contest API not available, using mock data:', error);
    return {
      success: true,
      participantId: `participant_${Date.now()}`,
      message: 'Successfully joined contest (mock)'
    };
  }
}

/**
 * Get contest leaderboard
 * In production: GET /api/contests/:contestId/leaderboard
 */
export async function getLeaderboard(contestId: string): Promise<ContestLeaderboard> {
  try {
    const response = await fetch(`/api/contests/${contestId}/leaderboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    
    return await response.json();
  } catch (error) {
    // Fallback to mock data
    console.warn('Contest API not available, using mock data:', error);
    return {
      participants: [],
      totalParticipants: 0,
      playerRank: null,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Get player rank in contest
 * In production: GET /api/contests/:contestId/rank/:playerId
 */
export async function getPlayerRank(contestId: string, playerId: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/contests/${contestId}/rank/${playerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch player rank');
    }
    
    const data = await response.json();
    return data.rank ?? null;
  } catch (error) {
    console.warn('Contest API not available:', error);
    return null;
  }
}

/**
 * Get contest status
 * In production: GET /api/contests/:contestId
 */
export async function getContestStatus(contestId: string): Promise<ContestStatus> {
  try {
    const response = await fetch(`/api/contests/${contestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch contest status');
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Contest API not available, using mock data:', error);
    // Return mock contest status
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return {
      id: contestId,
      phase: 'active',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      endDate: endOfMonth.toISOString(),
      participantCount: 1250,
    };
  }
}

/**
 * Finalize contest and generate winners (Admin/Owner only)
 * In production: POST /api/contests/:contestId/finalize
 */
export async function finalizeContest(contestId: string): Promise<ContestStatus> {
  try {
    const response = await fetch(`/api/contests/${contestId}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to finalize contest');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to finalize contest:', error);
    throw error;
  }
}

/**
 * Validate participant data (Anti-Cheat)
 * In production: POST /api/contests/:contestId/validate
 */
export async function validateParticipant(contestId: string, playerData: {
  totalCookies: number;
  cookies: number;
  cookiesPerSecond: number;
  timePlayed: number;
  clicks: number;
}): Promise<{ valid: boolean; reason?: string }> {
  try {
    const response = await fetch(`/api/contests/${contestId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playerData),
    });
    
    if (!response.ok) {
      return { valid: false, reason: 'Validation failed' };
    }
    
    return await response.json();
  } catch (error) {
    // For now, allow all participants (will be validated server-side)
    console.warn('Validation API not available:', error);
    return { valid: true };
  }
}

/**
 * Poll for leaderboard updates
 * Returns a function to stop polling
 */
export function pollLeaderboard(
  contestId: string,
  onUpdate: (leaderboard: ContestLeaderboard) => void,
  interval: number = 5000
): () => void {
  let isPolling = true;
  
  const poll = async () => {
    if (!isPolling) return;
    
    try {
      const leaderboard = await getLeaderboard(contestId);
      onUpdate(leaderboard);
    } catch (error) {
      console.error('Error polling leaderboard:', error);
    }
    
    if (isPolling) {
      setTimeout(poll, interval);
    }
  };
  
  poll();
  
  return () => {
    isPolling = false;
  };
}

