"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { authApi, userApi } from "@/lib/api/auth";
import { getAscendToken, removeAscendToken } from "@/lib/api-client";
import { useUserStore } from "@/store/useUserStore";

import type { AscendUser } from "@/types";

/**
 * Subscribes to auth state once at the app root.
 * Supports both native ASCEND JWT tokens and Firebase Auth.
 */
export function useAuthListener(): void {
  const setUser = useUserStore((s) => s.setUser);
  const setLoading = useUserStore((s) => s.setLoading);

  useEffect(() => {
    let isCancelled = false;

    async function checkNativeAuth(): Promise<boolean> {
      const nativeToken = getAscendToken();
      if (!nativeToken) return false;

      try {
        setLoading(true);
        const user = await userApi.getMe();
        if (!isCancelled && user) {
          setUser(user);
          setLoading(false);
          return true;
        }
      } catch (err: any) {
        console.warn("[Auth] Native token invalid or expired:", err);
        removeAscendToken();
      }
      return false;
    }

    checkNativeAuth().then((hasNativeUser) => {
      if (hasNativeUser || isCancelled) return;

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        if (isCancelled) return;
        if (!firebaseUser) {
          if (!getAscendToken()) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        setLoading(true);

        let profile: AscendUser | null = null;
        try {
          profile = await authApi.establishSession();
        } catch (error) {
          console.warn("[Auth] Initial session sync failed, retrying in 1.5s...", error);
          try {
            await new Promise((res) => setTimeout(res, 1500));
            profile = await authApi.establishSession();
          } catch (retryError) {
            console.warn("[Auth] Backend unreachable, using client profile fallback:", retryError);
          }
        }

        if (profile && !isCancelled) {
          setUser(profile);
        } else if (!isCancelled) {
          // Fallback user object using Firebase identity so user stays signed in
          const fallbackUser: AscendUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            display_name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Ascender",
            avatar_url: firebaseUser.photoURL || null,
            is_onboarded: true,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
            primary_track: "hybrid",
            created_at: new Date().toISOString(),
            character: {
              id: `char-${firebaseUser.uid.slice(0, 8)}`,
              level: 1,
              current_xp: 0,
              total_xp_earned: 0,
              xp_required_for_next_level: 1000,
              xp_progress_percent: 0,
              stats: {
                knowledge: 10,
                strength: 10,
                stamina: 10,
                recovery: 10,
                focus: 10,
                discipline: 10,
                consistency: 10,
                agility: 10,
                speed: 10,
                potential: 10,
                luck: 10,
                mental_fortitude: 10,
              },
              current_streak_days: 0,
              longest_streak_days: 0,
              last_quest_completed_date: null,
              active_title_id: null,
              difficulty_multiplier: 1.0,
              burnout_risk_score: 0,
            },
          };
          setUser(fallbackUser);
        }
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    });

    return () => {
      isCancelled = true;
    };
  }, [setUser, setLoading]);
}
