"use client";

import { useAuthListener } from "@/lib/hooks/useAuthListener";
import { ToastHost } from "@/components/ui/ToastHost";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useAuthListener();

  return (
    <>
      {children}
      <ToastHost />
    </>
  );
}
