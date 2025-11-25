import { demoUser, type UserProfile } from "@nebula/shared";

export const STORAGE_KEY = "nebula-user";

const parseFromQuery = (): UserProfile | null => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (!token) return null;
  const handle = params.get("handle") ?? demoUser.handle;
  const country = params.get("country") ?? demoUser.country;
  const coins = Number.parseInt(params.get("coins") ?? `${demoUser.coins}`, 10) || demoUser.coins;
  const rank = params.get("rank") ?? demoUser.rank;
  const inviteCode = params.get("invite") ?? demoUser.inviteCode;

  return {
    id: `user-${token}`,
    handle,
    country,
    coins,
    rank,
    inviteCode,
    avatarUrl: demoUser.avatarUrl
  };
};

export const bootstrapAuth = async (): Promise<UserProfile | null> => {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as UserProfile;
    } catch (error) {
      console.warn("Failed to parse stored user", error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  const userFromQuery = parseFromQuery();
  if (userFromQuery) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userFromQuery));
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    return userFromQuery;
  }

  if (import.meta.env.DEV) {
    console.log("DEV mode: Auto-login with demo user");
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
    return demoUser;
  }

  return null;
};

export const clearAuth = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};

