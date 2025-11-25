import { create } from "zustand";
import type { UserProfile } from "@nebula/shared";
import { bootstrapAuth, clearAuth, STORAGE_KEY } from "../api/auth";

interface AuthState {
  status: "loading" | "authenticated" | "guest";
  user: UserProfile | null;
  hydrate: () => Promise<void>;
  setUser: (user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  hydrate: async () => {
    console.log("Auth: Starting hydration...");
    try {
      const user = await bootstrapAuth();
      console.log("Auth: Bootstrap result:", user);
      if (user) {
        console.log("Auth: Setting authenticated state");
        set({ user, status: "authenticated" });
      } else {
        console.log("Auth: Setting guest state");
        set({ user: null, status: "guest" });
      }
    } catch (error) {
      console.error("Auth: Hydration error:", error);
      set({ user: null, status: "guest" });
    }
  },
  setUser: (user) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ user, status: "authenticated" });
  },
  logout: () => {
    clearAuth();
    set({ user: null, status: "guest" });
  }
}));

