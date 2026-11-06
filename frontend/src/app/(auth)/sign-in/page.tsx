"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { motion } from "framer-motion";
import { Loader2, User as UserIcon, Mail, Sparkles, ShieldCheck } from "lucide-react";
import { firebaseAuth, googleAuthProvider } from "@/lib/firebase";
import { GlassCard } from "@/components/ui/GlassCard";
import { authApi } from "@/lib/api/auth";
import { useUserStore } from "@/store/useUserStore";

type AuthMethod = "google" | "email" | "username";
type AuthMode = "sign-in" | "sign-up";

export default function SignInPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);

  const [method, setMethod] = useState<AuthMethod>("username");
  const [mode, setMode] = useState<AuthMode>("sign-in");

  // Form fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(firebaseAuth)
      .then(async (result) => {
        if (result?.user) {
          try {
            const profile = await authApi.establishSession();
            setUser(profile);
          } catch {}
          router.push("/dashboard");
        }
      })
      .catch((err) => {
        console.error("[Auth] Redirect result error:", err);
      });
  }, [router, setUser]);

  // Handle Username & Password Authentication
  async function handleUsernameAuth(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "sign-in") {
        const res = await authApi.login({
          login: loginIdentifier.trim(),
          password,
          client_type: "website",
          device_name: "Web Browser",
        });
        setUser(res.user);
        router.push("/dashboard");
      } else {
        const res = await authApi.register({
          email: email.trim(),
          username: username.trim(),
          password,
          display_name: displayName.trim() || username.trim(),
          client_type: "website",
          device_name: "Web Browser",
        });
        setUser(res.user);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Email & Password Authentication (supports native fallback + Firebase)
  async function handleEmailAuth(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "sign-in") {
        try {
          // Attempt Firebase Auth
          await signInWithEmailAndPassword(firebaseAuth, email, password);
          const profile = await authApi.establishSession();
          setUser(profile);
        } catch (firebaseErr: any) {
          // Fallback to ASCEND backend auth
          const res = await authApi.login({
            login: email.trim(),
            password,
            client_type: "website",
            device_name: "Web Browser",
          });
          setUser(res.user);
        }
      } else {
        try {
          await createUserWithEmailAndPassword(firebaseAuth, email, password);
          const profile = await authApi.establishSession();
          setUser(profile);
        } catch (firebaseErr: any) {
          const res = await authApi.register({
            email: email.trim(),
            password,
            display_name: displayName.trim() || email.split("@")[0],
            client_type: "website",
            device_name: "Web Browser",
          });
          setUser(res.user);
        }
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err instanceof Error ? humanizeAuthError(err.message) : "Authentication error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Google OAuth
  async function handleGoogleAuth() {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithPopup(firebaseAuth, googleAuthProvider);
      const profile = await authApi.establishSession();
      setUser(profile);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("[Auth] Google sign-in error:", err);
      if (err?.code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(firebaseAuth, googleAuthProvider);
          return;
        } catch (redirectErr: any) {
          setError(humanizeAuthError(redirectErr?.code || redirectErr?.message || ""));
        }
      } else {
        setError(humanizeAuthError(err?.code || err?.message || "Google sign-in failed."));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4 py-8">
      <div className="grid-backdrop absolute inset-0 bg-arc-glow" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-arc-400 to-arc-700 font-display text-xl font-bold text-white shadow-glow-arc">
            A
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-primary">Enter ASCEND</h1>
          <p className="mt-1 font-body text-xs text-ink-muted">
            Universal AI Operating System & Expandable Product Ecosystem
          </p>
        </div>

        <GlassCard padding="lg" glow="arc">
          {/* Method Selector: Username | Email | Google */}
          <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg border border-panel-border bg-void/50 p-1">
            <button
              onClick={() => { setMethod("username"); setError(null); }}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-body text-xs font-semibold transition-colors ${
                method === "username" ? "bg-arc-500 text-white shadow-glow-arc-sm" : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <UserIcon className="h-3 w-3" />
              Username
            </button>
            <button
              onClick={() => { setMethod("email"); setError(null); }}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-body text-xs font-semibold transition-colors ${
                method === "email" ? "bg-arc-500 text-white shadow-glow-arc-sm" : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <Mail className="h-3 w-3" />
              Email
            </button>
            <button
              onClick={() => { setMethod("google"); setError(null); }}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-body text-xs font-semibold transition-colors ${
                method === "google" ? "bg-arc-500 text-white shadow-glow-arc-sm" : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Google
            </button>
          </div>

          {/* Mode Selector for Username / Email (Sign In vs Sign Up) */}
          {method !== "google" && (
            <div className="mb-5 flex rounded-lg border border-panel-border/60 bg-void/30 p-1">
              <button
                type="button"
                onClick={() => { setMode("sign-in"); setError(null); }}
                className={`flex-1 rounded py-1.5 font-body text-xs font-medium transition-colors ${
                  mode === "sign-in" ? "bg-white/10 text-white font-semibold" : "text-ink-faint hover:text-ink-primary"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("sign-up"); setError(null); }}
                className={`flex-1 rounded py-1.5 font-body text-xs font-medium transition-colors ${
                  mode === "sign-up" ? "bg-white/10 text-white font-semibold" : "text-ink-faint hover:text-ink-primary"
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* METHOD 1: USERNAME AUTH */}
          {method === "username" && (
            <form onSubmit={handleUsernameAuth} className="space-y-3.5">
              {mode === "sign-in" ? (
                <div>
                  <label className="hud-label mb-1 block">Username or Email</label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
                    placeholder="e.g. shadow_hunter"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="hud-label mb-1 block">ASCEND Username</label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
                      placeholder="Choose unique username"
                    />
                  </div>
                  <div>
                    <label className="hud-label mb-1 block">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="hud-label mb-1 block">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
                      placeholder="Hunter Name (optional)"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="hud-label mb-1 block">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
                  placeholder="••••••••••••"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-3 py-2 font-body text-xs text-crimson-400">
                  {error}
                </p>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "sign-in" ? "Sign In to ASCEND" : "Create Account"}
              </button>
            </form>
          )}

          {/* METHOD 2: EMAIL AUTH */}
          {method === "email" && (
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              <div>
                <label className="hud-label mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              {mode === "sign-up" && (
                <div>
                  <label className="hud-label mb-1 block">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
                    placeholder="Your Display Name"
                  />
                </div>
              )}

              <div>
                <label className="hud-label mb-1 block">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
                  placeholder="••••••••••••"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-3 py-2 font-body text-xs text-crimson-400">
                  {error}
                </p>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "sign-in" ? "Sign In" : "Register with Email"}
              </button>
            </form>
          )}

          {/* METHOD 3: GOOGLE AUTH */}
          {method === "google" && (
            <div className="space-y-4 py-2">
              <p className="font-body text-xs text-ink-secondary text-center leading-relaxed">
                Connect seamlessly with your Google Account. Grants instantaneous access across ASCEND Website and Desktop.
              </p>

              {error && (
                <p className="rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-3 py-2 font-body text-xs text-crimson-400">
                  {error}
                </p>
              )}

              <button
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2.5 py-2.5"
                type="button"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-panel-border/40 flex items-center justify-between text-[11px] text-ink-faint">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-arc-400" />
              Shared Web & Desktop Account
            </span>
            <span>ASCEND v4.0.0</span>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function humanizeAuthError(message: string): string {
  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
    return "Incorrect email or password.";
  }
  if (message.includes("auth/email-already-in-use")) {
    return "An account already exists with this email.";
  }
  if (message.includes("auth/weak-password")) {
    return "Password must be at least 6 characters.";
  }
  if (message.includes("auth/popup-closed-by-user") || message.includes("popup-closed")) {
    return "Sign-in cancelled: Google popup was closed.";
  }
  if (message.includes("auth/popup-blocked")) {
    return "Popup blocked by browser. Please enable popups or try again.";
  }
  if (message.includes("auth/unauthorized-domain")) {
    return "This domain is not authorized for Google sign-in in Firebase Console.";
  }
  if (message.includes("auth/operation-not-allowed")) {
    return "Google sign-in is not enabled in Firebase Console.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Network error. Please check your internet connection.";
  }
  return message || "Something went wrong. Please try again.";
}
