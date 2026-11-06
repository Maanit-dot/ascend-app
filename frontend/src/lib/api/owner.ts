import { api } from "@/lib/api-client";
import type { OwnerMetrics, OwnerUserItem, OwnerInstallation, AuditLogEntry, SystemAnnouncement } from "@/types";

export interface OwnerUsersResponse {
  items: OwnerUserItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface OwnerAuditLogsResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SystemHealthData {
  status: string;
  cpu_usage_percent: number;
  memory_total_gb: number;
  memory_used_gb: number;
  memory_percent: number;
  disk_free_gb: number;
  disk_percent: number;
  database_size_mb: number;
  uptime_seconds: number;
  timestamp: string;
}

export const ownerApi = {
  getMetrics: () => api.get<OwnerMetrics>("/owner/metrics"),

  getUsers: (params: { query?: string; status_filter?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set("query", params.query);
    if (params.status_filter) searchParams.set("status_filter", params.status_filter);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return api.get<OwnerUsersResponse>(`/owner/users${qs ? `?${qs}` : ""}`);
  },

  getUserDetail: (userId: string) => api.get<any>(`/owner/users/${userId}`),

  suspendUser: (userId: string, reason: string) =>
    api.post<{ status: string; message: string }>(`/owner/users/${userId}/suspend`, { reason }),

  banUser: (userId: string, reason: string) =>
    api.post<{ status: string; message: string }>(`/owner/users/${userId}/ban`, { reason }),

  restoreUser: (userId: string) =>
    api.post<{ status: string; message: string }>(`/owner/users/${userId}/restore`),

  revokeUserSessions: (userId: string) =>
    api.post<{ status: string; revoked_count: number }>(`/owner/users/${userId}/revoke-sessions`),

  getInstallations: () => api.get<OwnerInstallation[]>("/owner/installations"),

  blockInstallation: (deviceId: string, reason: string) =>
    api.post<{ status: string; message: string }>(`/owner/installations/${deviceId}/block`, { reason }),

  unblockInstallation: (deviceId: string) =>
    api.post<{ status: string; message: string }>(`/owner/installations/${deviceId}/unblock`),

  getFeatures: () => api.get<Record<string, { value: string; active: boolean; desc: string }>>("/owner/features"),

  updateFeature: (flag_key: string, flag_value: string, is_active: boolean, description: string = "") =>
    api.post<{ status: string }>("/owner/features", { flag_key, flag_value, is_active, description }),

  getSystemHealth: () => api.get<SystemHealthData>("/owner/system-health"),

  getAnnouncements: () => api.get<{ maintenance: { active: boolean; message: string }; announcement: SystemAnnouncement | null }>("/owner/announcements"),

  setAnnouncement: (title: string, message: string, variant: string = "info", is_active: boolean = true) =>
    api.post<{ status: string }>("/owner/announcements", { title, message, variant, is_active }),

  toggleMaintenance: (is_maintenance: boolean, message: string) =>
    api.post<{ status: string; maintenance_active: boolean }>("/owner/maintenance", { is_maintenance, message }),

  getAuditLogs: (page: number = 1, limit: number = 50) =>
    api.get<OwnerAuditLogsResponse>(`/owner/audit-logs?page=${page}&limit=${limit}`),
};
