import { create } from "zustand";
import type { JarvisAction } from "@/lib/api/jarvis";

export interface JarvisMessage {
  id: string;
  role: "user" | "jarvis";
  text: string;
  timestamp: string;
  action?: JarvisAction | null;
}

interface JarvisState {
  isOpen: boolean;
  isMinimized: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  messages: JarvisMessage[];

  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  toggleMinimize: () => void;
  setListening: (listening: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  toggleVoice: () => void;
  addMessage: (msg: Omit<JarvisMessage, "id" | "timestamp"> & { id?: string; timestamp?: string }) => void;
  clearHistory: () => void;
}

const initialMessages: JarvisMessage[] = [
  {
    id: "init-1",
    role: "jarvis",
    text: "JARVIS ONLINE. System operating at peak performance. How can I assist your progression today, Hunter?",
    timestamp: typeof window !== "undefined" ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "12:00 PM",
  },
];

export const useJarvisStore = create<JarvisState>((set) => ({
  isOpen: true,
  isMinimized: false,
  isListening: false,
  isProcessing: false,
  isSpeaking: false,
  voiceEnabled: true,
  messages: initialMessages,

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),
  toggleMinimize: () => set((s) => ({ isMinimized: !s.isMinimized })),
  setListening: (isListening) => set({ isListening }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),

  addMessage: (msg) => {
    const formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMessage: JarvisMessage = {
      id: msg.id || crypto.randomUUID(),
      role: msg.role,
      text: msg.text,
      timestamp: msg.timestamp || formattedTime,
      action: msg.action,
    };
    set((s) => ({ messages: [...s.messages, newMessage] }));
  },

  clearHistory: () => set({ messages: initialMessages }),
}));
