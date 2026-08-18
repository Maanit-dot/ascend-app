import { api } from "@/lib/api-client";
import type { AscendUser, PrimaryTrack } from "@/types";

export const authApi = {
  establishSession: () => api.post<AscendUser>("/auth/session"),
};

export const userApi = {
  getMe: () => api.get<AscendUser>("/users/me"),
  onboard: (payload: { display_name: string; timezone: string; primary_track: PrimaryTrack }) =>
    api.post<AscendUser>("/users/onboard", payload),
  updateProfile: (payload: Partial<{ display_name: string; timezone: string; avatar_url: string; active_title_id: string }>) =>
    api.patch<AscendUser>("/users/me", payload),
};
