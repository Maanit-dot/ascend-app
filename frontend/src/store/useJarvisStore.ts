import { create } from "zustand";
import {
  jarvisApi,
  type JarvisAction,
  type SystemTelemetry,
  type ProcessInfo,
  type Routine,
  type Fact,
  type ActionEntry,
} from "@/lib/api/jarvis";

export interface JarvisMessage {
  id: string;
  role: "user" | "jarvis";
  text: string;
  timestamp: string;
  action?: JarvisAction | null;
  audio_base64?: string | null;
}

export type AIState = "idle" | "listening" | "thinking" | "speaking" | "error";

export type CommandCenterTab =
  | "home"
  | "conversations"
  | "desktop"
  | "system"
  | "automations"
  | "memory"
  | "files"
  | "activity"
  | "settings";

interface JarvisStoreState {
  isOpen: boolean;
  isCommandCenterOpen: boolean;
  activeTab: CommandCenterTab;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  aiState: AIState;
  audioLevel: number;
  messages: JarvisMessage[];
  pendingConfirmation: any | null;

  // System and Data State
  telemetry: SystemTelemetry | null;
  processes: ProcessInfo[];
  routines: Routine[];
  facts: Fact[];
  permissions: Record<string, boolean>;
  activityLog: ActionEntry[];
  isBackendOnline: boolean;

  // Mutators
  setOpen: (open: boolean) => void;
  setCommandCenterOpen: (open: boolean) => void;
  setActiveTab: (tab: CommandCenterTab) => void;
  setListening: (listening: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setAiState: (state: AIState) => void;
  setAudioLevel: (level: number) => void;
  toggleVoice: () => void;
  setPendingConfirmation: (conf: any | null) => void;
  addMessage: (msg: Omit<JarvisMessage, "id" | "timestamp"> & { id?: string; timestamp?: string }) => void;
  clearHistory: () => void;

  // Remote data fetchers
  fetchTelemetry: () => Promise<void>;
  fetchProcesses: () => Promise<void>;
  fetchRoutines: () => Promise<void>;
  fetchMemory: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  fetchActivityLog: () => Promise<void>;
  checkBackendHealth: () => Promise<boolean>;
}

const initialMessages: JarvisMessage[] = [
  {
    id: "init-1",
    role: "jarvis",
    text: "ARC ONLINE. Systems operational across all sectors. How can I assist your ascent today, Hunter?",
    timestamp: typeof window !== "undefined" ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "12:00 PM",
  },
];

export const useJarvisStore = create<JarvisStoreState>((set, get) => ({
  isOpen: true,
  isCommandCenterOpen: false,
  activeTab: "home",
  isListening: false,
  isProcessing: false,
  isSpeaking: false,
  voiceEnabled: true,
  aiState: "idle",
  audioLevel: 0,
  messages: initialMessages,
  pendingConfirmation: null,

  telemetry: null,
  processes: [],
  routines: [],
  facts: [],
  permissions: {},
  activityLog: [],
  isBackendOnline: true,

  setOpen: (isOpen) => set({ isOpen }),
  setCommandCenterOpen: (isCommandCenterOpen) => set({ isCommandCenterOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setListening: (isListening) => {
    set({
      isListening,
      aiState: isListening ? "listening" : get().isProcessing ? "thinking" : get().isSpeaking ? "speaking" : "idle",
    });
  },
  setProcessing: (isProcessing) => {
    set({
      isProcessing,
      aiState: isProcessing ? "thinking" : get().isSpeaking ? "speaking" : get().isListening ? "listening" : "idle",
    });
  },
  setSpeaking: (isSpeaking) => {
    set({
      isSpeaking,
      aiState: isSpeaking ? "speaking" : get().isListening ? "listening" : get().isProcessing ? "thinking" : "idle",
    });
  },
  setAiState: (aiState) => set({ aiState }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),
  setPendingConfirmation: (pendingConfirmation) => set({ pendingConfirmation }),

  addMessage: (msg) => {
    const formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMessage: JarvisMessage = {
      id: msg.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`),
      role: msg.role,
      text: msg.text,
      timestamp: msg.timestamp || formattedTime,
      action: msg.action,
      audio_base64: msg.audio_base64,
    };
    set((s) => ({ messages: [...s.messages, newMessage] }));
  },

  clearHistory: () => set({ messages: initialMessages }),

  checkBackendHealth: async () => {
    const online = await jarvisApi.checkHealth();
    set({ isBackendOnline: online });
    return online;
  },

  fetchTelemetry: async () => {
    const data = await jarvisApi.getTelemetry();
    if (data) {
      set({ telemetry: data, isBackendOnline: true });
    } else {
      set({ telemetry: null, isBackendOnline: false });
    }
  },

  fetchProcesses: async () => {
    const data = await jarvisApi.getProcesses(15);
    if (data) set({ processes: data });
  },

  fetchRoutines: async () => {
    const data = await jarvisApi.getRoutines();
    if (data?.routines) set({ routines: data.routines });
  },

  fetchMemory: async () => {
    const data = await jarvisApi.getMemory();
    if (data?.facts) set({ facts: data.facts });
  },

  fetchPermissions: async () => {
    const data = await jarvisApi.getPermissions();
    if (data?.permissions) set({ permissions: data.permissions });
  },

  fetchActivityLog: async () => {
    const data = await jarvisApi.getActionHistory(30);
    if (data?.actions) set({ activityLog: data.actions });
  },
}));
