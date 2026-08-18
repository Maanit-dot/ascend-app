# ASCEND Frontend

Next.js 14 (App Router) client for ASCEND — an AI-operating-system-styled
RPG productivity app.

## Stack

- Next.js 14 + TypeScript (strict)
- Tailwind CSS with a custom design token system (`tailwind.config.ts`)
- Framer Motion for animation
- Zustand for client state (`src/store/`)
- Firebase Auth (client SDK) for sign-in, verified server-side by the backend
- Recharts for statistics visualizations
- `next-pwa` for offline support + installability

## Local Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_API_URL + Firebase config
npm run dev
```

Requires the backend running at `NEXT_PUBLIC_API_URL` (defaults to
`http://localhost:8000`).

## Project Layout

```
src/
├── app/                    # App Router routes
│   ├── (auth)/               # Sign-in, onboarding — unauthenticated shell
│   ├── (app)/                 # Dashboard, quests, bosses, ... — guarded shell
│   └── page.tsx                # Public landing page
├── components/
│   ├── ui/                    # Design-system primitives (GlassCard, ProgressBar,
│   │                           AscensionRing, ToastHost)
│   └── layout/                # Sidebar, TopBar, AppProviders
├── features/                # Feature-scoped UI, grouped by domain
│   ├── quests/, bosses/, inventory/, achievements/(page-colocated),
│   │   story/(page-colocated), dashboard/, companion/
├── lib/
│   ├── api/                   # Typed API modules (one per backend router)
│   ├── api-client.ts           # Base fetch wrapper — attaches Firebase ID token
│   ├── firebase.ts             # Firebase client SDK init
│   ├── hooks/                  # useAuthListener
│   └── icon-map.ts, format.ts  # Presentation helpers
├── store/                    # Zustand stores: user, quest board, UI
└── types/                    # Shared TS types, 1:1 with backend Pydantic schemas
```

## Design System

ASCEND's visual identity is built around a **near-black void background**
with **Ascend Violet** (`#7C5CFF`) as the signature accent — also the color
of ARC, the AI companion — paired with cyan (recovery/positive), amber
(XP/level-up), and crimson (danger/boss HP) for semantic states.
Glassmorphism panels (`.glass-panel`, `.glass-panel-raised` in
`globals.css`) are the base surface everywhere. Typography is Space Grotesk
(display/HUD numbers), Inter (body), and JetBrains Mono (stat values,
timestamps — reinforces the "operating system" feel).

The signature visual element is the **Ascension Ring**
(`components/ui/AscensionRing.tsx`) — a segmented circular HUD dial (24
discrete segments, not a smooth arc) used for the level/XP readout on the
dashboard.

## State Management

- `useUserStore` — authenticated user + character profile, patched
  optimistically after quest completions / item use.
- `useQuestBoardStore` — today's quest board, with `logProgress` /
  `setProgress` actions that call the API and update local state in one
  step.
- `useUIStore` — sidebar collapse state, toast queue, modal visibility.

## PWA

`next-pwa` generates the service worker at build time (disabled in dev).
`public/manifest.json` + `public/icons/*` provide installability. Extend
`next.config.js`'s `withPWA` options for custom caching strategies (e.g.
caching the quest board for true offline logging with a background sync
queue) as a follow-up.

## Type Safety

`src/types/index.ts` mirrors every backend Pydantic schema by hand. If you
change a backend schema, update this file in the same PR — there is
currently no codegen step bridging FastAPI's OpenAPI schema to TypeScript;
adding one (e.g. `openapi-typescript`) is a natural next hardening step.
