# File Map — bible-by-heart + bbh-api

> Covers BOTH repos so every session has the whole picture.
> **Maintenance rule (win condition of every task):** when you add, remove, or
> change the purpose of a file — update its line here in the same task.
> Descriptions marked `(?)` were inferred from names, not verified by reading.

---

## Repo 1: `c:/Code/bible-by-heart` — mobile app (Expo / React Native / TS)

### Root

| File | Description |
|---|---|
| `App.tsx` | App entry: loads state, wires navigator, splash, error boundary; reads Android share-intent text (`useShareIntent`) and routes it into the add-passage flow |
| `index.js` | RN registry entry point |
| `app.config.js` | Expo config (name, icons, plugins, env-driven variants) |
| `eas.json` | EAS build profiles (staging, production) |
| `babel.config.js` / `metro.config.js` | build toolchain config |
| `eslint.config.js` / `tsconfig.json` | lint + TS config |
| `jest.setup.js` | jest mocks/setup (preset jest-expo, config in package.json) |
| `package.json` | scripts: dev, lint, test, build-dev/-prod (EAS) |
| `package-lock.json` | committed npm lockfile — CI runs `npm ci` against it |
| `.npmrc` | `legacy-peer-deps=true` — required to install (peer-dep conflicts: react-test-renderer, airbnb-typescript vs tseslint v8) |
| `.github/workflows/submitStagingToPlayMarket.yml` / `submitProductionToPlayMarket.yml` | CI: on push to staging/production, run `npm ci` + lint + test, then EAS build/submit |
| `projectdiary.md` | **Fedir's personal diary — never edit** |
| `readme.md` | public description + (stale) roadmap |
| `plugins/handlingIntents.js` | Expo config plugin adding a (bogus) custom intent action; now dead — share-intent receiving is handled by `expo-share-intent`. Slated for removal |
| `app.config.js` plugins | includes `expo-share-intent` (Android only, `disableIOS`, `androidIntentFilters: ["text/*"]`): native reader for SEND/text shares + sets MainActivity `launchMode=singleTask` |
| `assets/` | icons, splash, notification images (prod + dev variants) |

### `docs/` — AI working docs

| File | Description |
|---|---|
| `ARCHITECTURE.md` | vision, philosophy, core technical decisions (read first) |
| `CODING_RULES.md` | style rules + reusable component/util library |
| `FILEMAP.md` | this file |
| `STRATEGY.md` | master plan: workflow, bugs, risks, refactors, testing, features |
| `robotdiary.md` | AI session log (append every session) |

### `src/` — core

| File | Description |
|---|---|
| `models.ts` | ALL data model types: AppState, Passage, Address, history, settings, action types |
| `initials.ts` | initial/default values for every state version |
| `constants.ts` | app-wide constants (levels, limits, API version, colors?) |
| `bibleReference.ts` | Bible structure data: books, chapter/verse counts |
| `navigator.tsx` | react-navigation stack setup; exports `navigationRef` for imperative navigation from outside the tree (e.g. share-intent handling in `App.tsx`) |
| `screeenManagement.ts` | screen enum/stack helpers for the custom navigator |
| `storage.ts` | AsyncStorage read/write of AppState |
| `context/AppContext.tsx` | global app context: single source of truth for `state`/`dispatch` + provides `t` (l10n) and `theme`; persists state + daily backup; wires notification-response handling. Exports `AppProvider`, `useAppContext`, and `AppContext` (for tests/narrow providers) |

### `src/screens/`

| File | Description |
|---|---|
| `homeScreen.tsx` | main screen: stroke/streak, week activity, entry to test/list/stats |
| `listScreen.tsx` | passage list: search, filters, sort, swipe actions, editor entry |
| `testsScreen.tsx` | training session: renders generated tests per level, navigation dots |
| `finishScreen.tsx` | session results screen (feature: show dynamic session data) |
| `statsScreen.tsx` | global + per-passage statistics |
| `calendarScreen.tsx` | month/day activity calendar view |
| `settingsScreen.tsx` | settings hub: language/theme selects + rows that navigate to the sub-menu screens below (was: rendered each sub-list inline as a MiniModal). User row gated behind `isAutorized` |
| `PassageScreen.tsx` | add/edit a passage (former listScreen editor modal; reads AppContext, draft committed on save) |
| `ListSettingsScreen.tsx` | List settings sub-menu (left-swipe tag, translations link, passage import/export). Was `settingsLists/listSettings` MiniModal |
| `TranslationsSettingsScreen.tsx` | Translations editable list (nested under List settings). Was a modal-in-modal via `SettingsListWrapper` |
| `TestsSettingsScreen.tsx` | Tests settings sub-menu (haptics, auto-increase level, train-modes link). Was `settingsLists/testsSettings` MiniModal |
| `TrainModesSettingsScreen.tsx` | Train-modes editable list (nested under Tests settings). Was a modal-in-modal via `SettingsListWrapper` |
| `NotificationsSettingsScreen.tsx` | Reminders settings sub-menu (enable, smart time, reminders link, dev test). Was `settingsLists/notificationsSettings` MiniModal |
| `RemindersSettingsScreen.tsx` | Reminders editable list (nested under Reminders settings). Was a modal-in-modal via `SettingsListWrapper` |
| `StatsSettingsScreen.tsx` | Stats settings sub-menu (weekly metric). Was `settingsLists/statsSettings` MiniModal |
| `AboutSettingsScreen.tsx` | About + legal + dev-mode sub-menu. Was `settingsLists/aboutSettings` MiniModal; inner info/password/log dialogs stay MiniModals |
| `UserSettingsScreen.tsx` | Account settings (email/profile/data visibility, delete account). Was `settingsLists/userSettings` MiniModal; delete-confirm stays a MiniModal |
| `loginScreen.tsx` | email/password login vs API (P1: finish & verify e2e) |
| `registerScreen.tsx` | account registration vs API |

### `src/components/`

See the component library table in `CODING_RULES.md` §7 for descriptions:
`Text` `AddressPicker` `Button` `Checkbox` `ConfirmModal` `DotIndicator` `Header`
`Icon`+`icondata.ts` `Input` `LevelPicker` `PassageEditor` `Select` `SelectModal`
`miniModal` `SettingsSubScreen` `settingsListWrapper` `setttingsMenuItem`
`testNevDott` `weekActivityComponent`

`Text.tsx` — themed `<Text>` wrapper (STRATEGY §4.3): reads the theme from
`AppContext` and applies the semantic text color, so callers stop hand-threading
`color: theme.colors.text` onto every RN `<Text>`. Requires the AppProvider (or, in
tests, a bare `AppContext.Provider` — now exported from `context/AppContext.tsx`).

STRATEGY §4.3 base-component migration (in progress): `DotIndicator`, `Checkbox`,
`Select`, `SelectModal` no longer take a `theme` prop — they read it from
`useAppContext()`. Call sites dropped `theme={...}`; the components now require a
provider (see `test-utils/renderWithContext.tsx`). Still prop-drilled and pending
migration: `Button`/`IconButton`, `Input`, `setttingsMenuItem`, `Header`,
`AddressPicker`, `LevelPicker`, `miniModal`, `weekActivityComponent`, `testNevDott`,
`PassageEditor`, `SettingsSubScreen`, `settingsListWrapper`, `levels/Level1..5`.

`SettingsSubScreen.tsx` — shared shell (View + Header with back + StatusBar) for
every settings sub-menu screen. `settingsListWrapper.tsx` — reusable editable-list
body (translations/reminders/train-modes), now non-modal: list and per-item editor
are two views toggled by local state (was a MiniModal-in-MiniModal). The old
`settingsLists/` sub-list components were converted into the settings sub-screens
in `src/screens/` and removed.

| Subdir | Description |
|---|---|
| `levels/Level1..5.tsx` | render one test type each (options / address / word blocks / typing…) |

### `src/services/`

| File | Description |
|---|---|
| `fetch.ts` | API client: auth endpoints, token refresh (expired-access→refresh via `isTokenExpired`), APIversion check, error handling |
| `fetchESV.ts` | fetch passage text from ESV API |

### `src/l10n/`

| File | Description |
|---|---|
| `index.ts` | `t()` translation lookup by lang code |
| `en.ts` / `ua.ts` | English / Ukrainian UI strings (always update both) |

### `src/utils/`

| File | Description |
|---|---|
| `reduce.ts` | THE reducer: every state change (passages, tests, history, settings, user) |
| `useApp.ts` | hook wiring state + dispatch to components |
| `stateVersionConvert.ts` | chained migrations between state model versions (`__tests__/utils/stateVersionConvert.test.ts` locks the current-era 0.0.8→0.1.0 chain) |
| `getStats.ts` | all stats calculation (streak, scores, heatmap, per-level) |
| `getPerfectTests.ts` | perfect-run detection for streak/score (?) |
| `getSimularity.ts` | string similarity (answer checking) |
| `levelsConvertion.ts` | passageLevel ↔ testLevel conversion |
| `addressToString.ts` / `addressFromString.ts` | Address ↔ human string; parser picks the most specific book on prefix ambiguity |
| `addressDistance.ts` / `addressDifference.ts` / `addressOrder.ts` | address math for test generation/sorting |
| `getNumberOfVerses.ts` / `getNumberOfEnglishVerses.ts` | verse counting for limits |
| `fileManager.ts` | import/export files (txt/json) via document picker |
| `handlePassageExport.ts` | passage export/import serialization + dedupe |
| `notifications.ts` | reminders scheduling/permissions (expo-notifications) |
| `formatDateTime.ts` / `secondsToString.ts` / `addZero.ts` | formatting helpers |
| `randomizers.ts` | shuffle/random helpers for test generation |
| `getThemeFromScheme.ts` | dark/light theme object |
| `toastShow.ts` | toast notifications |
| `logger.ts` | app logger (+ log viewer storage for debugging) |
| `isTokenExpired.ts` | JWT payload decode + expiry check (used by `services/fetch.ts` auth/refresh) |
| `generateTests/index.ts` | orchestrates per-passage test generation by level |
| `generateTests/createL10Test.ts` … `createL50Test.ts` | one generator per level (10,11,2X,30,40,50) |
| `generateTests/getErrorGradedSentences.ts` | pick hardest sentences from error history |
| `generateTests/getWordsFromErrors.ts` | pick hardest words from error history |

### `src/svg/`

`daggetLogo.tsx` (app logo), `finishCup.tsx` (finish screen trophy), `manger.tsx` (seasonal Christmas icon)

### `__tests__/`

| Area | Files |
|---|---|
| smoke | `app.test.tsx` |
| components | AddressPicker, button, checkbox, ConfirmModal, header, icon, input, miniModal, select, settingsMenuItem, Text (+snapshots) |
| levels | Level1–5 (+snapshots) |
| utils | addressFromString, createL11Tests, getNumberOfVerses, getStats, handlePassageExport, isTokenExpired, notifications, reduce |

`test-utils/renderWithContext.tsx` (repo root, outside `__tests__/` so jest doesn't
treat it as a suite) — shared helper that renders a component under an
`AppContext.Provider` with a synthetic value (no side effects). `renderWithContext(ui,
{ themeType?, langCode?, state? })`; used by every test whose render tree contains a
§4.3-migrated component (Text, Checkbox, Select/SelectModal, settingsMenuItem).

---

## Repo 2: `c:/Code/bbh-api` — API server (Express / TS / sqlite)

### Root

| File | Description |
|---|---|
| `Dockerfile` / `docker-compose.yml` | containerization; compose services incl. `local` |
| `.github/workflows/deploy-staging.yml` / `deploy-production.yml` | CI deploy to VPS |
| `.staging.env` / `.production.env` / `.test.env` / `.env` | per-env secrets (never commit new secrets) |
| `babel.config.json` / `tsconfig.json` / `jest.config.ts` / `.eslintrc.json` / `.prettierrc` | toolchain |
| `package.json` | scripts: dev (babel watch + node watch), build, test, docker, genKey |
| `codingdiary.md` | **Fedir's personal diary — never edit** |
| `README.md` | API docs/setup (?) |
| `data/test.db` | sqlite test database |
| `static/` | privacy policy, ToS, account-deletion pages, favicon, logo (store compliance) |

### `src/`

| File | Description |
|---|---|
| `app.ts` | Express bootstrap: middleware, routes, static, listen; on startup calls `ensureUsersTableColumns` (schema self-heal) → `ensureTestUser` (demo account) → `verifyMailer` (non-blocking SMTP auth check) |
| `routes.ts` | all route definitions → controllers |
| `constants.ts` | API constants (login limits, token times) + `TEST_USER_*` demo-account credentials (env-overridable) |
| `models.ts` | server-side types |
| `controller/user.controller.ts` | auth/user handlers: register, login, refresh, edit, delete, email confirm/reset; demo account (`TEST_USER_UUID`) is blocked from edit/delete + exempt from login lockout |
| `middleware/requireUser.ts` | JWT auth guard |
| `middleware/validateResource.ts` | zod request validation |
| `schema/user.schema.ts` | zod schemas for user endpoints |
| `services/base.servise.ts` | generic sqlite CRUD service (storage-agnostic layer); `createUsersTable`, `dropDB`, `ensureTestUser` (idempotent demo-account seed), and `usersTableColumns` + `ensureUsersTableColumns` (idempotent "ensure columns exist" migration — self-heals schema drift, STRATEGY §3) |
| `services/user.service.ts` | user-specific db logic |
| `utils/jwt.ts` | sign/verify access + refresh tokens |
| `utils/email.ts` | nodemailer confirmation/reset emails (`sendEmail`) + `verifyMailer` boot-time SMTP auth check; creds from `MAIL_LOGIN`/`MAIL_PASS` env |
| `utils/logger.ts` | pino logger |

### `__tests__/`

`app.test.ts`, `controller/user.controller.test.ts`, `services/base.service.test.ts`,
`services/migration.test.ts` (ensureUsersTableColumns: fresh-DB create, adds missing
column preserving rows, idempotent), `utils/email.test.ts`, `utils/jwt.test.ts`

---

## Repo 3: `c:/Code/bbh-shared` — shared contract package (standalone, TS)

Created 2026-07-11 (STRATEGY §4.1). Client↔server contract both repos depend on —
NOT a monorepo. Published public at `github:CalmTed/bbh-shared`, consumed as a **git
dependency** pinned to a tag (`#v0.0.1`). `dist/` is **committed** (Yarn 1 doesn't run
a git dep's `prepare`), so consumers need no build step. Zero runtime deps; `tsc` →
`dist/` (CJS + `.d.ts`); `node:test`.

**Consumed by (as of 2026-07-11):**
- app `src/constants.ts` — `API_VERSION` re-exported from `bbh-shared` (was a local const).
- server `src/models.ts` — `AddressType` + `PASSAGELEVEL` from `bbh-shared`; local
  `AppAddressType` is now an alias of the shared type.
- server `src/constants.ts` — `PASSAGELEVEL`/`TESTLEVEL` re-exported from `bbh-shared`
  (local enum defs removed).

Not yet migrated (future per-repo tasks): the app's `API_LINK` enum → `API_ENDPOINTS`,
auth request/response bodies → the `bbh-shared` DTOs (replacing `Record<string,any>` in
`services/fetch.ts`), and reconciling the divergent user models.

| File | Description |
|---|---|
| `src/apiVersion.ts` | `API_VERSION` (== bbh-api package version), `API_COMPATIBILITY` table, `isApiVersionCompatible()`, `ApiVersionResponse` |
| `src/endpoints.ts` | `API_ENDPOINTS` — endpoint paths, single source of truth (mirrors app `API_LINK` + server routes) |
| `src/auth.ts` | request/response DTOs for user/auth endpoints (replace the app's `Record<string,any>`) + shared unions (`AppLanguage`, `ProfileVisibility`, `DataVisibility`, `UserRights`) |
| `src/primitives.ts` | `AddressType` (nullable end fields) + `PASSAGELEVEL`/`TESTLEVEL` enums (duplicated verbatim in both repos today) |
| `src/index.ts` | barrel re-export |
| `src/apiVersion.test.ts` | `node:test` coverage of the version-compat helper |
| `package.json` / `tsconfig.json` / `README.md` / `.gitignore` | package config; README documents contents + the three consumption options |
