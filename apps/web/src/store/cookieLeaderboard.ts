import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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

interface CookieLeaderboardState {
  // Leaderboard data by type
  leaderboards: {
    totalCookies: LeaderboardPlayer[];
    cps: LeaderboardPlayer[];
    timePlayed: LeaderboardPlayer[];
  };
  
  // Current active category
  activeType: LeaderboardType;
  
  // Loading states
  isLoading: boolean;
  lastUpdate: string | null;
  
  // Fake hype stats
  onlinePlayerCount: number;
  totalPlayerCount: number;
  
  // Actions
  setActiveType: (type: LeaderboardType) => void;
  updateLeaderboard: (type: LeaderboardType, players: LeaderboardPlayer[]) => void;
  setLoading: (loading: boolean) => void;
  clearLeaderboards: () => void;
  updatePlayerCounts: (online: number, total: number) => void;
}

// Generate random player count within realistic range
const generateRandomPlayerCount = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const useCookieLeaderboardStore = create<CookieLeaderboardState>()(
  immer((set) => ({
    leaderboards: {
      totalCookies: [],
      cps: [],
      timePlayed: []
    },
    activeType: 'totalCookies',
    isLoading: false,
    lastUpdate: null,
    onlinePlayerCount: generateRandomPlayerCount(847, 2341),
    totalPlayerCount: generateRandomPlayerCount(15000, 25000),

    setActiveType: (type) => {
      set((state) => {
        state.activeType = type;
      });
    },

    updateLeaderboard: (type, players) => {
      set((state) => {
        state.leaderboards[type] = players;
        state.lastUpdate = new Date().toISOString();
        state.isLoading = false;
      });
    },

    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    clearLeaderboards: () => {
      set((state) => {
        state.leaderboards = {
          totalCookies: [],
          cps: [],
          timePlayed: []
        };
        state.lastUpdate = null;
      });
    },

    updatePlayerCounts: (online, total) => {
      set((state) => {
        state.onlinePlayerCount = online;
        state.totalPlayerCount = total;
      });
    }
  }))
);

