import { redirect } from "next/navigation";

/**
 * Root route.
 *
 * There was previously no `page.tsx` directly under `src/app/` — only the
 * route groups `(app)/` and `(auth)/`, which don't create a URL segment of
 * their own. That meant visiting `/` had no matching route at all and Next.js
 * returned its default 404, and the sign-in flow was never reached because
 * the app itself was unreachable at its own root URL.
 *
 * `/dashboard` is inside the `(app)` route group, whose layout
 * (`src/app/(app)/layout.tsx`) already guards every child route: it checks
 * Firebase auth state via `useUserStore` and client-redirects to `/sign-in`
 * if the user isn't authenticated, or to `/onboarding` if they haven't
 * finished onboarding yet. Redirecting "/" here reuses that existing guard
 * instead of duplicating auth-check logic in a second place.
 */
export default function RootPage() {
  redirect("/dashboard");
}
