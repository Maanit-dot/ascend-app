import { api, setAscendToken, removeAscendToken } from "@/lib/api-client";
import type { AscendUser, PrimaryTrack, UserSessionItem } from "@/types";

export interface RegisterPayload {
  email: string;
  password: string;
  username?: string;
  display_name?: string;
  client_type?: string;
  device_name?: string;
  device_id?: string;
}

export interface LoginPayload {
  login: string;
  password: string;
  client_type?: string;
  device_name?: string;
  device_id?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AscendUser;
}

export const authApi = {
  establishSession: (clientType: string = "website", deviceName: string = "Browser", deviceId?: string) =>
    api.post<AscendUser>("/auth/session", { client_type: clientType, device_name: deviceName, device_id: deviceId }),

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/register", payload);
    if (res?.access_token) {
      setAscendToken(res.access_token);
    }
    return res;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", payload);
    if (res?.access_token) {
      setAscendToken(res.access_token);
    }
    return res;
  },

  getSessions: () => api.get<UserSessionItem[]>("/auth/sessions"),

  revokeSession: (sessionId: string) => api.delete<{ status: string }>(`/auth/sessions/${sessionId}`),

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      removeAscendToken();
    }
  },
};

export const userApi = {
  getMe: () => api.get<AscendUser>("/users/me"),
  onboard: (payload: { display_name: string; timezone: string; primary_track: PrimaryTrack }) =>
    api.post<AscendUser>("/users/onboard", payload),
  updateProfile: (payload: Partial<{ display_name: string; timezone: string; avatar_url: string; active_title_id: string }>) =>
    api.patch<AscendUser>("/users/me", payload),
};
