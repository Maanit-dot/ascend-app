import { api } from "@/lib/api-client";
import type { AppModule } from "@/types";

export const modulesApi = {
  getRegistry: () => api.get<AppModule[]>("/modules/registry"),

  toggleModule: (moduleId: string, is_enabled: boolean) =>
    api.post<{ status: string; is_enabled: boolean }>(`/modules/${moduleId}/toggle`, { is_enabled }),

  configureModule: (moduleId: string, payload: {
    is_connected?: boolean;
    account_identifier?: string;
    credentials?: string;
    settings_data?: Record<string, any>;
  }) => api.post<{ status: string; is_connected: boolean; account_identifier?: string }>(`/modules/${moduleId}/configure`, payload),

  executeAction: (moduleId: string, actionId: string, params?: Record<string, any>) =>
    api.post<any>(`/modules/${moduleId}/execute`, { action_id: actionId, params }),

  requestIntegration: (payload: { app_name: string; description: string; category?: string }) =>
    api.post<{ status: string; message: string }>("/modules/request", payload),
};
