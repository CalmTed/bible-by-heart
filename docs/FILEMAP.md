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

### `src/screens/`

| File | Description |
|---|---|
| `homeScreen.tsx` | main screen: stroke/streak, week activity, entry to test/list/stats |
| `listScreen.tsx` | passage list: search, filters, sort, swipe actions, editor entry |
| `testsScreen.tsx` | training session: renders generated tests per level, navigation dots |
| `finishScreen.tsx` | session results screen (feature: show dynamic session data) |
| `statsScreen.tsx` | global + per-passage statistics |
| `calendarScreen.tsx` | month/day activity calendar view |
| `settingsScreen.tsx` | settings hub (app + user sections) |
| `loginScreen.tsx` | email/password login vs API (P1: finish & verify e2e) |
| `registerScreen.tsx` | account registration vs API |

### `src/components/`

See the component library table in `CODING_RULES.md` §7 for descriptions:
`AddressPicker` `Button` `Checkbox` `ConfirmModal` `DotIndicator` `Header`
`Icon`+`icondata.ts` `Input` `LevelPicker` `PassageEditor` `Select` `SelectModal`
`miniModal` `settingsListWrapper` `setttingsMenuItem` `testNevDott`
`weekActivityComponent`

| Subdir | Description |
|---|---|
| `levels/Level1..5.tsx` | render one test type each (options / address / word blocks / typing…) |
| `settingsLists/aboutSettings.tsx` | about + version + copyright pages |
| `settingsLists/listSettings.tsx` | list behavior settings (left-swipe tag etc.) |
| `settingsLists/notificationsSettings.tsx` | reminders list (time, days) |
| `settingsLists/statsSettings.tsx` | stats-related settings (?) |
| `settingsLists/testsSettings.tsx` | train modes customization |
| `settingsLists/userSettings.tsx` | account: user data, translations, sessions, delete account |

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
| components | AddressPicker, button, checkbox, ConfirmModal, header, icon, input, miniModal, select, settingsMenuItem (+snapshots) |
| levels | Level1–5 (+snapshots) |
| utils | addressFromString, createL11Tests, getNumberOfVerses, getStats, handlePassageExport, isTokenExpired, notifications, reduce |

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

## Planned third package (not yet created)

`bbh-shared` (name TBD): client↔server contract — request/response types, API
version compatibility table, checksum/sync primitives. Used by both repos.
See STRATEGY §4.1.
