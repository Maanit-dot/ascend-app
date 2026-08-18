import { create } from "zustand";

export interface ToastMessage {
  id: string;
  variant: "success" | "info" | "warning" | "danger" | "levelup";
  title: string;
  description?: string;
}

interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;

  activeModal: "levelup" | "boss-defeated" | "hidden-quest" | null;
  openModal: (modal: UIState["activeModal"]) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),

  toasts: [],
  pushToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
