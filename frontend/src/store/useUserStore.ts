import { create } from "zustand";
import type { AscendUser } from "@/types";

interface UserState {
  user: AscendUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AscendUser | null) => void;
  setLoading: (loading: boolean) => void;
  /** Applies a partial character update in place — used after quest completion, item use, etc. */
  patchCharacter: (patch: Partial<AscendUser["character"]>) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  patchCharacter: (patch) =>
    set((state) =>
      state.user
        ? { user: { ...state.user, character: { ...state.user.character, ...patch } } }
        : state
    ),
  reset: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
