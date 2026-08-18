import { api } from "@/lib/api-client";
import type { DailyQuestBoard, QuestCompletionResult, QuestHistoryEntry } from "@/types";

export const questApi = {
  getToday: () => api.get<DailyQuestBoard>("/quests/today"),
  logProgress: (questInstanceId: string, deltaValue: number, note?: string) =>
    api.post<QuestCompletionResult>(`/quests/${questInstanceId}/log`, {
      delta_value: deltaValue,
      note,
    }),
  setProgress: (questInstanceId: string, value: number, note?: string) =>
    api.post<QuestCompletionResult>(`/quests/${questInstanceId}/set`, { value, note }),
  getHistory: (days = 30) => api.get<QuestHistoryEntry[]>(`/quests/history?days=${days}`),
};
