"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { authApi } from "@/lib/api/auth";
import { useUserStore } from "@/store/useUserStore";

/**
 * Subscribes to Firebase auth state once at the app root. On sign-in, calls
 * the backend `/auth/session` endpoint to JIT-provision/sync the local
 * profile and populate the user store. On sign-out, clears it.
 */
export function useAuthListener(): void {
  const setUser = useUserStore((s) => s.setUser);
  const setLoading = useUserStore((s) => s.setLoading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }
      setLoading(true);
      try {
        const profile = await authApi.establishSession();
        setUser(profile);
      } catch (error) {
        console.error("Failed to establish ASCEND session:", error);
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);
}
