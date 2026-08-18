import { create } from "zustand";
import { questApi } from "@/lib/api/quests";
import type { DailyQuestBoard, QuestInstance } from "@/types";

interface QuestBoardState {
  board: DailyQuestBoard | null;
  isLoading: boolean;
  error: string | null;
  lastCompletionResult: { xpAwarded: number; leveledUp: boolean; newLevel: number; unlocks: string[] } | null;

  fetchToday: () => Promise<void>;
  logProgress: (questId: string, delta: number) => Promise<void>;
  setProgress: (questId: string, value: number) => Promise<void>;
  updateQuestTarget: (questTitleOrId: string, newTarget: number) => void;
  optimizeWorkload: (minutes: number) => void;
  clearCompletionResult: () => void;
}

/** Replaces one quest instance wherever it lives — inside any category section, optional, or hidden. */
function replaceQuest(board: DailyQuestBoard, updated: QuestInstance): DailyQuestBoard {
  const replaceIn = (list: QuestInstance[]) =>
    list.map((q) => (q.id === updated.id ? updated : q));

  return {
    ...board,
    categories: board.categories.map((section) => ({
      ...section,
      quests: replaceIn(section.quests),
    })),
    optional: replaceIn(board.optional),
    hidden: replaceIn(board.hidden),
  };
}

/** Completion percent is based on all mandatory quests across every category section. */
function recomputeCompletionPercent(board: DailyQuestBoard): number {
  const allMandatory = board.categories.flatMap((section) => section.quests);
  const total = allMandatory.length;
  if (total === 0) return 0;
  const completed = allMandatory.filter((q) => q.is_completed).length;
  return Math.round((completed / total) * 1000) / 10;
}

export const useQuestBoardStore = create<QuestBoardState>((set, get) => ({
  board: null,
  isLoading: false,
  error: null,
  lastCompletionResult: null,

  fetchToday: async () => {
    set({ isLoading: true, error: null });
    try {
      const board = await questApi.getToday();
      set({ board, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load quests", isLoading: false });
    }
  },

  logProgress: async (questId, delta) => {
    const { board } = get();
    if (!board) return;
    try {
      const result = await questApi.logProgress(questId, delta);
      const updatedBoard = replaceQuest(board, result.quest);
      set({
        board: { ...updatedBoard, completion_percent: recomputeCompletionPercent(updatedBoard) },
        lastCompletionResult: result.leveled_up
          ? {
              xpAwarded: result.xp_awarded,
              leveledUp: result.leveled_up,
              newLevel: result.new_level,
              unlocks: result.unlocks,
            }
          : null,
      });
    } catch {
      // Local optimistic update fallback
      const updatedCategories = board.categories.map((section) => ({
        ...section,
        quests: section.quests.map((q) => {
          if (q.id === questId) {
            const nextVal = Math.min(q.target_value, q.current_value + delta);
            return { ...q, current_value: nextVal, is_completed: nextVal >= q.target_value };
          }
          return q;
        }),
      }));
      const updatedBoard = { ...board, categories: updatedCategories };
      set({ board: { ...updatedBoard, completion_percent: recomputeCompletionPercent(updatedBoard) } });
    }
  },

  setProgress: async (questId, value) => {
    const { board } = get();
    if (!board) return;
    try {
      const result = await questApi.setProgress(questId, value);
      const updatedBoard = replaceQuest(board, result.quest);
      set({
        board: { ...updatedBoard, completion_percent: recomputeCompletionPercent(updatedBoard) },
        lastCompletionResult: result.leveled_up
          ? {
              xpAwarded: result.xp_awarded,
              leveledUp: result.leveled_up,
              newLevel: result.new_level,
              unlocks: result.unlocks,
            }
          : null,
      });
    } catch {
      // Fallback
    }
  },

  updateQuestTarget: (questTitleOrId: string, newTarget: number) => {
    const { board } = get();
    if (!board) return;

    const term = questTitleOrId.toLowerCase();
    const updatedCategories = board.categories.map((section) => ({
      ...section,
      quests: section.quests.map((q) => {
        const matches = q.id === questTitleOrId ||
                        q.template.name.toLowerCase().includes(term) ||
                        term.includes(q.template.name.toLowerCase().replace("questions", "").trim());
        if (matches) {
          const isDone = q.current_value >= newTarget;
          // Keep XP proportional to the target change, mirroring the
          // backend's recompute_xp_for_target (xp scales linearly with
          // target). q.xp_reward / q.target_value is always equal to the
          // template's base_xp_reward / base_target ratio, so this never
          // compounds across repeated changes.
          const newXpReward = q.target_value > 0
            ? Math.max(1, Math.round(q.xp_reward * (newTarget / q.target_value)))
            : q.xp_reward;
          return {
            ...q,
            target_value: newTarget,
            xp_reward: newXpReward,
            is_completed: isDone,
          };
        }
        return q;
      }),
    }));

    const updatedBoard = { ...board, categories: updatedCategories };
    set({
      board: { ...updatedBoard, completion_percent: recomputeCompletionPercent(updatedBoard) },
    });
  },

  optimizeWorkload: (minutes: number) => {
    const { board } = get();
    if (!board) return;

    const scaleFactor = minutes <= 60 ? 0.5 : minutes <= 90 ? 0.7 : 0.85;

    const updatedCategories = board.categories.map((section) => ({
      ...section,
      quests: section.quests.map((q) => {
        if (!q.is_completed && q.target_value > 1) {
          const newTarget = Math.max(1, Math.round(q.target_value * scaleFactor));
          const newXpReward = q.target_value > 0
            ? Math.max(1, Math.round(q.xp_reward * (newTarget / q.target_value)))
            : q.xp_reward;
          return {
            ...q,
            target_value: newTarget,
            xp_reward: newXpReward,
            is_completed: q.current_value >= newTarget,
          };
        }
        return q;
      }),
    }));

    const updatedBoard = { ...board, categories: updatedCategories };
    set({
      board: { ...updatedBoard, completion_percent: recomputeCompletionPercent(updatedBoard) },
    });
  },

  clearCompletionResult: () => set({ lastCompletionResult: null }),
}));
