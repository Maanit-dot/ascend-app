import { api } from "@/lib/api-client";
import type {
  Achievement,
  AppNotification,
  Boss,
  BossParticipation,
  BurnoutInsight,
  InventoryItem,
  StoryChapter,
  Title,
  WeakSubject,
} from "@/types";

export const bossApi = {
  getActive: () => api.get<Boss[]>("/bosses/active"),
  getMyParticipations: () => api.get<BossParticipation[]>("/bosses/my-participations"),
  claimReward: (bossId: string) =>
    api.post<{ xp_awarded: number; leveled_up: boolean; new_level: number; item_granted: string | null }>(
      `/bosses/${bossId}/claim-reward`
    ),
};

export const inventoryApi = {
  list: () => api.get<InventoryItem[]>("/inventory"),
  use: (inventoryItemId: string) =>
    api.post<{ effect: string; detail: string }>("/inventory/use", {
      inventory_item_id: inventoryItemId,
    }),
};

export const achievementApi = {
  list: () => api.get<Achievement[]>("/achievements"),
  listTitles: () => api.get<Title[]>("/achievements/titles"),
};

export const storyApi = {
  listChapters: () => api.get<StoryChapter[]>("/story/chapters"),
};

export const notificationApi = {
  list: (unreadOnly = false) => api.get<AppNotification[]>(`/notifications?unread_only=${unreadOnly}`),
  markRead: (id: string) => api.post<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ success: boolean }>("/notifications/read-all"),
};

export const aiApi = {
  getBurnout: () => api.get<BurnoutInsight>("/ai/burnout"),
  getWeakSubjects: (subjectAccuracy: Record<string, number>) =>
    api.post<WeakSubject[]>("/ai/weak-subjects", { subject_accuracy: subjectAccuracy }),
  companionChat: (message: string) => api.post<{ reply: string }>("/ai/companion/chat", { message }),
};
export const userApi = {
  updateProfile: (body: { active_title_id?: string }) =>
    api.patch("/users/me", body),
};