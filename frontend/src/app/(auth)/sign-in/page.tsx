"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { firebaseAuth, googleAuthProvider } from "@/lib/firebase";
import { GlassCard } from "@/components/ui/GlassCard";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailAuth(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "sign-in") {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? humanizeAuthError(err.message) : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithPopup(firebaseAuth, googleAuthProvider);
      router.push("/dashboard");
    } catch (err) {
      setError("Google sign-in failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4">
      <div className="grid-backdrop absolute inset-0 bg-arc-glow" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-arc-400 to-arc-700 font-display text-xl font-bold text-white shadow-glow-arc">
            A
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-primary">Enter ASCEND</h1>
          <p className="mt-1.5 font-body text-sm text-ink-muted">
            Your character sheet for real-world discipline.
          </p>
        </div>

        <GlassCard padding="lg" glow="arc">
          <div className="mb-5 flex rounded-lg border border-panel-border bg-void/50 p-1">
            <button
              onClick={() => setMode("sign-in")}
              className={`flex-1 rounded-md py-2 font-body text-sm font-semibold transition-colors ${
                mode === "sign-in" ? "bg-arc-500 text-white" : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("sign-up")}
              className={`flex-1 rounded-md py-2 font-body text-sm font-semibold transition-colors ${
                mode === "sign-up" ? "bg-arc-500 text-white" : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="hud-label mb-1.5 block">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2.5 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="hud-label mb-1.5 block">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2.5 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-3 py-2 font-body text-xs text-crimson-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "sign-in" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-panel-border" />
            <span className="hud-label">or</span>
            <div className="h-px flex-1 bg-panel-border" />
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={isSubmitting}
            className="btn-secondary w-full"
            type="button"
          >
            Continue with Google
          </button>
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
  return "Something went wrong. Please try again.";
}
