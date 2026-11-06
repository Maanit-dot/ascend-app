import { api } from "@/lib/api-client";

export interface SystemTelemetry {
  cpu_percent: number;
  cpu_temp_c?: number | null;
  ram_percent: number;
  ram_used_gb: number;
  ram_total_gb: number;
  storage_percent: number;
  storage_used_gb: number;
  storage_total_gb: number;
  download_kbps: number;
  upload_kbps: number;
  network_up: boolean;
  battery_percent?: number | null;
  battery_plugged?: boolean | null;
  uptime_seconds?: number;
  gpu_name?: string | null;
  gpu_percent?: number | null;
  gpu_temp_c?: number | null;
  gpu_vram_used_mb?: number | null;
  gpu_vram_total_mb?: number | null;
  error?: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  status: string;
}

export interface RoutineStep {
  type: string;
  target: string;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  steps: RoutineStep[];
  linked_quest?: string | null;
  xp_bonus?: number;
}

export interface Fact {
  key: string;
  value: string;
}

export interface ActionEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  result: string;
}

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
  board_refresh?: boolean;
  xp_reward?: number;
  category?: string;
  unit?: string;
  query?: string;
  results?: { title: string; snippet?: string; url?: string; video_id?: string; thumbnail?: string }[];
  city?: string;
  data?: any;
  language?: string;
  code?: string;
  explanation?: string;
  complexity?: string;
  message?: string;
  time_text?: string;
  app?: string;
  status?: string;
  filepath?: string;
  filename?: string;
  volume_action?: string;
  window_action?: string;
  file_action?: string;
  path?: string;
  items?: string[];
  origin?: string;
  destination?: string;
  date?: string;
  search_url?: string;
  analysis?: string;
  thumbnail_b64?: string;
  files_created?: string[];
  project_dir?: string;
}

export interface JarvisResponse {
  reply: string;
  action?: JarvisAction | null;
  audio_base64?: string | null;
  confirmation_required?: boolean | null;
  confirmation?: {
    type: string;
    action_name: string;
    target?: string;
  } | null;
}

export const jarvisApi = {
  sendCommand: async (command: string, confirmationAnswer?: string, history?: { role: string; text: string }[]) => {
    try {
      return await api.post<JarvisResponse>("/jarvis/command", {
        command,
        confirmation_answer: confirmationAnswer,
        history,
      });
    } catch (err) {
      console.error("[JARVIS] Backend request failed:", err);
      return buildOfflineResponse(command);
    }
  },

  getTelemetry: async () => {
    try {
      return await api.get<SystemTelemetry>("/jarvis/telemetry");
    } catch (err) {
      return null;
    }
  },

  getProcesses: async (limit = 15) => {
    try {
      return await api.get<ProcessInfo[]>(`/jarvis/processes?limit=${limit}`);
    } catch (err) {
      return [];
    }
  },

  getAvailableApps: async () => {
    try {
      return await api.get<{ apps: string[] }>("/jarvis/apps");
    } catch (err) {
      return { apps: [] };
    }
  },

  launchApp: async (app: string) => {
    return await api.post<{ status: string; message: string }>("/jarvis/launch-app", { app });
  },

  closeApp: async (app: string) => {
    return await api.post<{ status: string; message: string }>("/jarvis/close-app", { app });
  },

  switchWindow: async (target: string) => {
    return await api.post<{ status: string; message: string }>("/jarvis/switch-window", { target });
  },

  setVolume: async (action: string, value?: number) => {
    return await api.post<{ status: string; message: string }>("/jarvis/volume", { action, value });
  },

  setPower: async (action: string) => {
    return await api.post<{ status: string; message: string }>("/jarvis/power", { action });
  },

  setWallpaper: async (image: string) => {
    return await api.post<{ status: string; message: string }>("/jarvis/wallpaper", { image });
  },

  getRoutines: async () => {
    try {
      return await api.get<{ routines: Routine[] }>("/jarvis/routines");
    } catch (err) {
      return { routines: [] };
    }
  },

  createRoutine: async (payload: { name: string; steps: RoutineStep[]; description?: string; linked_quest?: string; xp_bonus?: number }) => {
    return await api.post<{ status: string; routine: Routine }>("/jarvis/routines", payload);
  },

  updateRoutine: async (id: string, payload: { name: string; steps: RoutineStep[]; description?: string; linked_quest?: string; xp_bonus?: number }) => {
    return await api.put<{ status: string; routine: Routine }>(`/jarvis/routines/${id}`, payload);
  },

  deleteRoutine: async (id: string) => {
    return await api.delete<{ status: string; deleted: boolean }>(`/jarvis/routines/${id}`);
  },

  runRoutine: async (id: string) => {
    return await api.post<{ status: string; summary: string; step_results: string[] }>(`/jarvis/routines/${id}/run`, {});
  },

  getMemory: async () => {
    try {
      return await api.get<{ enabled: boolean; facts: Fact[]; long_term: any }>("/jarvis/memory");
    } catch (err) {
      return { enabled: true, facts: [], long_term: {} };
    }
  },

  addFact: async (key: string, value: string) => {
    return await api.post<{ status: string; key: string; value: string }>("/jarvis/memory/fact", { key, value });
  },

  deleteFact: async (key: string) => {
    return await api.delete<{ status: string; deleted: boolean }>(`/jarvis/memory/fact/${encodeURIComponent(key)}`);
  },

  toggleMemory: async (enabled: boolean) => {
    return await api.post<{ status: string; enabled: boolean }>("/jarvis/memory/toggle", { enabled });
  },

  getActionHistory: async (limit = 30) => {
    try {
      return await api.get<{ actions: ActionEntry[] }>(`/jarvis/actions?limit=${limit}`);
    } catch (err) {
      return { actions: [] };
    }
  },

  getPermissions: async () => {
    try {
      return await api.get<{ permissions: Record<string, boolean> }>("/jarvis/permissions");
    } catch (err) {
      return { permissions: {} };
    }
  },

  setPermission: async (scope: string, granted: boolean) => {
    return await api.post<{ scope: string; granted: boolean }>("/jarvis/permissions", { scope, granted });
  },

  listFiles: async (path?: string) => {
    try {
      return await api.post<{ files: any[] }>("/jarvis/files/list", { path });
    } catch (err) {
      return { files: [] };
    }
  },

  searchFiles: async (query: string, root?: string) => {
    return await api.post<{ results: any[] }>("/jarvis/files/search", { query, root });
  },

  createFolder: async (location: string, name: string) => {
    return await api.post<{ status: string; message: string }>("/jarvis/files/create-folder", { location, name });
  },

  organizeFolder: async (location?: string) => {
    return await api.post<{ status: string; message: string; moved_files: number }>("/jarvis/files/organize", { location });
  },

  deleteFile: async (path: string) => {
    return await api.post<{ status: string; message: string }>("/jarvis/files/delete", { path });
  },

  processFile: async (filePath: string, action = "auto", params = {}) => {
    return await api.post<any>("/jarvis/files/process", { file_path: filePath, action, params });
  },

  scanVision: async (angle = "screen", instruction = "Describe what is visible.") => {
    return await api.post<{ status: string; analysis: string; thumbnail_b64?: string }>("/jarvis/vision/scan", { angle, instruction });
  },

  synthesizeVoice: async (text: string) => {
    return await api.post<{ audio_base64: string }>("/jarvis/voice/synthesize", { text });
  },

  transcribeVoice: async (audioBase64: string) => {
    return await api.post<{ transcript: string }>("/jarvis/voice/transcribe", { audio_base64: audioBase64 });
  },

  setBrightness: async (action: string, value?: number) => {
    return await api.post<{ status: string; message: string }>("/jarvis/brightness", { action, value });
  },

  openTaskManager: async () => {
    return await api.post<{ status: string; message: string }>("/jarvis/task-manager");
  },

  controlWindow: async (action: string) => {
    return await api.post<{ status: string; message: string }>("/jarvis/window", { action });
  },

  getWakeword: async () => {
    return await api.get<{ enabled: boolean }>("/jarvis/voice/wakeword");
  },

  setWakeword: async (enabled: boolean) => {
    return await api.post<{ enabled: boolean }>("/jarvis/voice/wakeword", { enabled });
  },

  runCode: async (code: string, language = "python") => {
    return await api.post<{ status: string; stdout?: string; stderr?: string; returncode?: number }>("/jarvis/dev/run", { code, language });
  },

  buildCode: async (goal: string, language = "python") => {
    return await api.post<any>("/jarvis/dev/build", { goal, language });
  },

  createProject: async (description: string, name?: string) => {
    return await api.post<any>("/jarvis/dev/project", { description, name });
  },

  checkHealth: async () => {
    try {
      const res = await api.get<{ status: string }>("/health");
      return res?.status === "healthy";
    } catch {
      return false;
    }
  },

  getApiKeysStatus: async () => {
    try {
      return await api.get<{
        gemini_configured: boolean;
        gemini_masked: string;
        openrouter_configured: boolean;
        openrouter_masked: string;
        offline_fallback_active: boolean;
      }>("/jarvis/config/api-keys");
    } catch {
      return {
        gemini_configured: false,
        gemini_masked: "",
        openrouter_configured: false,
        openrouter_masked: "",
        offline_fallback_active: true,
      };
    }
  },

  saveApiKeys: async (geminiKey?: string, openrouterKey?: string) => {
    return await api.post<any>("/jarvis/config/api-keys", {
      gemini_api_key: geminiKey,
      openrouter_api_key: openrouterKey,
    });
  },
};

function buildOfflineResponse(command: string): JarvisResponse {
  const cmd = command.toLowerCase().trim();
  const requiresLiveData =
    cmd.includes("level") ||
    cmd.includes("xp") ||
    cmd.includes("quest") ||
    cmd.includes("stat") ||
    cmd.includes("streak") ||
    cmd.includes("rank") ||
    cmd.includes("title") ||
    cmd.includes("progress");

  if (requiresLiveData) {
    return {
      reply: "Backend offline. Live ASCEND Hunter progression data cannot be queried until the system connection is restored.",
      action: null,
    };
  }

  return {
    reply: `Command "${command}" acknowledged in offline mode. Please verify the ASCEND backend agent is active.`,
    action: null,
  };
}
