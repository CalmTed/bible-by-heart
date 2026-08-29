# Bible by Heart — Architecture & Philosophy

> Read this first, every session. It is the grand context for **both** projects:
> the mobile app (`c:/Code/bible-by-heart`) and the API server (`c:/Code/bbh-api`).
> This file changes rarely — only when a core decision changes.

---

## 1. What this is

**Bible by Heart** is a mobile app for memorizing Bible passages, built and maintained
as a **hobby project** by one person (Fedir), developed in small one-task-at-a-time
sessions with AI assistance. It is live on Google Play (~5 real active users:
Ukrainian friends + one American believer). iOS is prepared via EAS but not yet published.

There is **no deadline**. Quality and joy of working on it matter more than speed.

**Definition of "finished" (v1.0.0):** a real userbase-ready app on both Android and
iOS with OAuth login, no major bugs, working premium payment, and multi-device sync.
Groups/friends/feed are optional and come later.

**Money goal:** modest — premium subscription should eventually cover hosting
(> $150/year). Donations are not the model; premium features are.

## 2. Product philosophy (non-negotiable)

1. **Real results, not empty hope.** The app must objectively show that the user is
   actually learning, not gamify time-spent. No vanity metrics. Stats exist to serve
   real-life memorization.
2. **Errors are pleasant, and their count is hidden.** This is a BIG one: the user
   must never see the exact number of their errors. Errors are recorded in full detail
   in history — but only *used internally* to decide which passages need more
   repetition, which words are hardest, and to grade difficulty. The user sees
   guidance ("this passage needs repeating"), never a shameful counter. Making an
   error must feel like a normal, pleasant part of learning.
3. **Easier to use in real life.** Features are judged by whether they help someone
   actually memorize and recall scripture away from the phone (the "black box"
   address-learning method, stroke counter, difficulty levels).
4. **For believers.** The app doesn't try to convert or entertain; it serves people
   who already want to learn scripture.

## 3. Technical philosophy (constitutional rules)

1. **Offline-first, forever.** The app must be 100% functional with no internet and
   no account: learning, history, stats — everything is saved locally. The server
   exists only for: multi-device **sync**, future **friendship/social**, **support**
   channels, and **payments**. If the server dies, the app must not care.
2. **Device is the source of truth.** The server is a synced backup / relay, never
   the master copy of learning data.
3. **Version compatibility policy:**
   - The app tracks compatible API versions. If the API version is too old/new →
     sync is disabled, but the app remains fully usable offline (including staying
     logged in locally).
   - On app upgrade, local state is migrated by the versioned state converter chain
     (`stateVersionConvert.ts`). This mechanism is kept permanently. Every state
     model bump MUST ship a converter, and the user is prompted to save a backup
     before migration (and can restore from one).
4. **Sync design (target, not yet implemented):**
   - Last-write-wins per data part, verified with checksums.
   - State is split into parts; **history** (the biggest part) syncs incrementally —
     each learning session appends only new records, then count/timestamps/checksum
     are verified. Big syncs show an animated progress bar.
   - No forcible merge UI; conflicts resolve automatically (LWW), integrity by checksum.
5. **Storage-agnostic API.** The API stays on sqlite for now, but data access goes
   through a service layer (`base.service.ts`) so a future Postgres migration is a
   swap, not a rewrite.
6. **Auth is additive and pluggable.** Email/password exists. Google Sign-In is added
   *alongside* it (never required), designed so other providers (Apple ID) plug in
   the same way. Login is never a prerequisite for using the app.

## 4. System overview

```
┌────────────────────────────┐        ┌──────────────────────────────┐
│  bible-by-heart (mobile)   │  HTTPS │  bbh-api (VPS)               │
│  Expo / React Native / TS  │◄──────►│  Express / TS / sqlite       │
│  reducer + AsyncStorage    │  JWT   │  Docker Compose, staging+prod│
│  offline-first, all logic  │        │  auth, sync, email, static   │
└────────────────────────────┘        └──────────────────────────────┘
        │                                        │
        │ EAS build (GitHub Actions CI)          │ GitHub Actions → Docker deploy
        ▼                                        ▼
  Google Play (live) / App Store (ready)   VPS staging + production
```

- **Planned third package:** a shared types/contract package used by both repos
  (client↔server request/response types, API version constants, checksum logic).
  NOT a monorepo merge — a third repo/package both depend on.
- **Web version (someday, low priority):** the Expo web build served as a static
  client from the API server itself.

## 5. Mobile app architecture (bible-by-heart)

- **Stack:** Expo SDK 53, React Native 0.79, React 19, TypeScript (strict, no `any`).
- **State:** single global `AppState` + one reducer (`src/utils/reduce.ts`), persisted
  to AsyncStorage (`src/storage.ts`), accessed via `useApp` hook. This pattern STAYS —
  it works and is tested. Don't introduce Redux/Zustand/etc.
- **Navigation:** currently a custom navigator (`src/navigator.tsx` +
  `screeenManagement.ts`). **Direction: replace with standard react-navigation**
  (already in devDeps) during the navigator refactor. New code shouldn't deepen
  the custom navigator.
- **Data model:** `src/models.ts` (AppState, Passage, Address, History, Settings…),
  initial values in `src/initials.ts`, versioned migrations in
  `src/utils/stateVersionConvert.ts`.
- **Learning engine:** `src/utils/generateTests/` generates per-level tests
  (levels 1–5, internally 10/11/20/21/30/40/50); level components render them
  (`src/components/levels/L10..L50.tsx`, one file per level); results flow through the reducer into
  history and stats (`src/utils/getStats.ts`).
- **i18n:** `src/l10n/` (en + ua). UI strings are ALWAYS translated in both.
  Code, comments, docs — English only.
- **Theme:** dark/light via `getThemeFromScheme`; direction: centralize theme and
  l10n into React contexts (planned refactor).
- **UI direction:** current visual style is the baseline. The planned ground-up UI
  wrapper refactor aims for a "candy" feel — react-native-reanimated, rich gesture
  interactions, modern but unique look — working on ALL screens: old small Androids,
  tablets, foldables.

## 6. API architecture (bbh-api)

- **Stack:** Express 4 + TypeScript, zod validation, JWT (access+refresh), bcryptjs,
  nodemailer (confirmation/reset emails), pino logging, sqlite3, Docker Compose.
- **Layout:** `routes.ts` → middleware (`requireUser`, `validateResource`) →
  `controller/` → `services/` (generic `base.service.ts` + `user.service.ts`) →
  sqlite. Schemas in `schema/`, types in `models.ts`.
- **Environments:** `.staging.env` / `.production.env`; GitHub Actions workflows
  deploy staging and production containers to the VPS.
- **Static:** privacy policy, ToS, account-deletion pages (Play Store requirements),
  plus `/.well-known/assetlinks.json` — the Digital Asset Links statement that lets
  verified `https://biblebyheart.app` links open the Android app rather than the browser.

## 7. Delivery & environments

- **CI/CD exists for both** (GitHub Actions; EAS builds with staging/production
  profiles for the app; Docker deploys for the API). It was set up before the
  year-long pause — treat as "should work, needs verification".
- **Release rhythm:** small tasks merge continuously; **version milestones** (defined
  in STRATEGY.md) are where big manual testing happens — real phone + staging build —
  until 1.0.0.
- Branches: `production` is main; `staging` used for staged work.

## 8. Payments (future, be accurate here)

Goal: premium subscription paid as comfortably as possible. Note for planning:
digital subscriptions inside a Play Store / App Store app **must** go through
Google Play Billing / Apple In-App Purchase (Google Pay / Apple Pay as standalone
buttons are only allowed for physical goods). The comfort of "pay with the
platform sheet" is exactly what IAP subscriptions provide. Research task lives
in STRATEGY.md §6.

## 9. The documents of this project

| File | Purpose | Who writes it |
|---|---|---|
| `docs/ARCHITECTURE.md` | this file — vision, philosophy, core decisions | AI, rarely, on decision changes |
| `docs/CODING_RULES.md` | style rules + reusable component library | AI, when rules/components change |
| `docs/FILEMAP.md` | map of every file in both repos | AI, **every time a file is added/removed/repurposed** (win condition of each task) |
| `docs/STRATEGY.md` | the master plan: workflow, bugs, risks, refactors, testing, features | AI, as tasks complete |
| `docs/robotdiary.md` | AI session log — what was done, decisions, gotchas | AI, append every session |
| `projectdiary.md` | **Fedir's personal diary — NEVER edit it** | Fedir only |
