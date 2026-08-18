import { api } from "@/lib/api-client";

export interface JarvisAction {
  type: string;
  action_name?: string;
  quest_id?: string;
  quest_title?: string;
  old_target?: number;
  new_target?: number;
  time_budget_minutes?: number;
  summary?: string;
  target?: string;
}

export interface JarvisResponse {
  reply: string;
  action?: JarvisAction | null;
}

export const jarvisApi = {
  sendCommand: async (command: string, history?: { role: string; text: string }[]) => {
    try {
      return await api.post<JarvisResponse>("/jarvis/command", { command, history });
    } catch (err) {
      // Log to console so developers can see the real backend error.
      console.error("[JARVIS] Backend request failed:", err);
      return buildOfflineResponse(command);
    }
  },
};

/**
 * Offline fallback — shown only when the backend is unreachable.
 *
 * Rules:
 * - NEVER fabricate ASCEND statistics (level, XP, stats, titles).
 *   Those values only exist in the backend database; guessing them is wrong.
 * - NEVER fabricate quest lists — the backend owns those too.
 * - General-knowledge answers that don't require ASCEND data are acceptable
 *   only when the answer is factually certain and not user-specific.
 */
function buildOfflineResponse(command: string): JarvisResponse {
  const cmd = command.toLowerCase().trim();

  // Detect ASCEND-specific queries that need live DB data and cannot be
  // answered offline. Tell the user clearly rather than returning fake values.
  const requiresLiveData =
    cmd.includes("level") ||
    cmd.includes("xp") ||
    cmd.includes("quest") ||
    cmd.includes("stat") ||
    cmd.includes("streak") ||
    cmd.includes("rank") ||
    cmd.includes("title") ||
    cmd.includes("progress") ||
    cmd.includes("optimize") ||
    cmd.includes("workload") ||
    cmd.includes("change") ||
    cmd.includes("update") ||
    cmd.includes("reduce") ||
    cmd.includes("increase") ||
    cmd.includes("set ");

  if (requiresLiveData) {
    return {
      reply:
        "⚠️ **JARVIS Offline** — The ASCEND backend is currently unreachable.\n\n" +
        "Your live progression data (level, XP, quests, stats) cannot be read or modified while offline.\n\n" +
        "Please ensure the backend server is running at `http://localhost:8000` and try again.",
      action: { type: "BACKEND_UNAVAILABLE" },
    };
  }

  // For general-knowledge questions, acknowledge the offline state but give a
  // minimal, factually safe response when we can. Otherwise redirect to retry.
  return {
    reply:
      "⚠️ **JARVIS Offline** — The ASCEND backend is currently unreachable.\n\n" +
      "General AI answers require the backend to be running (it routes your question to the configured LLM).\n\n" +
      "Please start the backend server (`uvicorn app.main:app --reload`) and try again.",
    action: { type: "BACKEND_UNAVAILABLE" },
  };
}
