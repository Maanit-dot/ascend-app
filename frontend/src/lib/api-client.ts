import { firebaseAuth } from "@/lib/firebase";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const cleanApiUrl = rawApiUrl.replace(/\/+$/, "").replace(/\/api\/v1\/?$/, "");
const API_BASE = `${cleanApiUrl}/api/v1`;

export const TOKEN_STORAGE_KEY = "ascend_auth_token";

export function getAscendToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAscendToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function removeAscendToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  // 1. Check for native ASCEND token
  const nativeToken = getAscendToken();
  if (nativeToken) {
    return { Authorization: `Bearer ${nativeToken}` };
  }

  // 2. Fallback to Firebase token
  const user = firebaseAuth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken(true);
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  cache?: RequestCache;
}

/**
 * Core request helper - every feature-level API module (quests, bosses,
 * inventory, owner, modules) is built on top of this single function.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const authHeader = await getAuthHeader();

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errJson = await response.json();
      detail = errJson.detail ?? detail;
    } catch {
      /* response body wasn't JSON - keep statusText */
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
