# File Map — bible-by-heart + bbh-api

> Covers BOTH repos so every session has the whole picture.
> **Maintenance rule (win condition of every task):** when you add, remove, or
> change the purpose of a file — update its line here in the same task.
> Descriptions marked `(?)` are inferred from names, not verified by reading —
> resolve them when you touch the file (STRATEGY §1). **As of 2026-07-22 there are
> none: every line below was verified against the source.**

---

## Repo 1: `c:/Code/bible-by-heart` — mobile app (Expo / React Native / TS)

### Root

| File | Description |
|---|---|
| `App.tsx` | App entry: loads state once through `bootBackup.loadStoredState` (which separates "no key" from "read failed" — a failed read writes **nothing** and shows `EmergencyScreen` instead, 8.1.9a), converts it forward when the version differs (snapshotting the raw state first via `utils/bootBackup`, then offering a one-shot file export of that raw snapshot through `BackupOfferModal`, 8.1.9), wires navigator + splash, and wraps the whole tree in `ErrorBoundary` whose fallback is the same `EmergencyScreen` (two restore slots — daily backup + pre-update snapshot — both version-tolerant, 8.1.8); reads Android share-intent text (`useShareIntent`) and routes it into the add-passage flow |
| `index.js` | RN registry entry point |
| `app.config.js` | Expo config (name, icons, env-driven staging/prod variants, extra secrets, Android App-Links VIEW filter) + plugins: `expo-build-properties` (compile/target SDK **36**, min 24 — the only place the Android SDK level is declared, there is no `android/` dir), `expo-share-intent` (Android only, `disableIOS`, `androidIntentFilters: ["text/*"]` — declares the SEND filter itself and sets MainActivity `launchMode=singleTask`), `expo-localization`, `expo-secure-store`, `expo-notifications` |
| `eas.json` | EAS build profiles (staging, production) |
| `babel.config.js` / `metro.config.js` | build toolchain config. **Deliberately bare** — `babel-preset-expo` 54 auto-applies `react-native-worklets/plugin` whenever the package is installed, so reanimated needs no entry here. Adding one by hand double-applies it (8.2.1) |
| `eslint.config.js` / `tsconfig.json` | lint + TS config |
| `jest.setup.js` | jest mocks/setup (preset jest-expo, config in package.json) |
| `package.json` | scripts: dev, lint, test, build-dev/-prod (EAS) |
| `package-lock.json` | committed npm lockfile — CI runs `npm ci` against it |
| `.npmrc` | `legacy-peer-deps=true` — required to install (peer-dep conflicts: react-test-renderer, airbnb-typescript vs tseslint v8) |
| `.github/workflows/submitStagingToPlayMarket.yml` / `submitProductionToPlayMarket.yml` | CI: on push to staging/production, run `npm ci` + lint + test, then EAS build/submit |
| `projectdiary.md` | **Fedir's personal diary — never edit** |
| `readme.md` | public description + (stale) roadmap |
| `test-utils/renderWithContext.tsx` | test helper (outside `__tests__/` so jest doesn't treat it as a suite) — see the `__tests__/` section below |
| `assets/` | icons, splash, notification images (prod + dev variants) |

### `docs/` — AI working docs

| File | Description |
|---|---|
| `ARCHITECTURE.md` | vision, philosophy, core technical decisions (read first) |
| `CODING_RULES.md` | style rules + reusable component/util library |
| `FILEMAP.md` | this file |
| `PLAN.md` | **the roadmap** — one checkbox = one session, grouped by version milestone, `(build)`/`(one-sitting)`/`[api]`/`[shared]` tags, plus an archive of finished steps. The only file where work is marked done |
| `STRATEGY.md` | **the vision** — what "finished" means, the milestone ladder, feature vision, technical direction, quality bar, risk watchlist, locked decisions. No checkboxes, no scheduling |
| `robotdiary.md` | AI session log (append every session) |

### `src/` — core

| File | Description |
|---|---|
| `models.ts` | ALL data model types: AppState, Passage, Address, history, settings, action types — **plus the navigation types** (8.1.14): `RootStackParamList` (every `SCREEN` → its params), `PassageScreenParamsModel` / `ListScreenParamsModel`, `ScreenPropsModel<T>` (a screen's `{route, navigation}`) and `RootStackNavigationModel`. They live here, not in `navigator.tsx`, because the navigator imports every screen — a screen importing its props type from there would be a cycle |
| `initials.ts` | initial/default values for every state version |
| `constants.ts` | app-wide constants: `VERSION` (state model) + `alowedStateVersions`, `API_VERSION` (re-exported from `bbh-shared`) + `API_LINK` endpoint enum, storage keys (`STORAGE_NAME`/`STORAGE_BACKUP_NAME` rolling daily/`STORAGE_PRECONVERT_BACKUP_NAME` write-once pre-migration snapshot/`STORAGE_LOGGER`, token names), training tuning (`PERFECT_TESTS_TO_PROCEED`, `STUDY_ONE_REPEATS`, `ERRORS_TO_DOWNGRADE`, `MAX_L50_TRIES`, sentence rules), enums (`SCREEN`, `SETTINGS`, `LANGCODE`, `THEMETYPE`, `SORTINGOPTION`, `STATSMETRICS`, `TESTLEVEL`, `PASSAGELEVEL`), vibration patterns, `ANIMATION` (the 0.3.0 motion vocabulary — fade duration, spring config, rise distance/scale; every reanimated surface pulls from it so the app springs the same way), and the palettes `COLOR_DARK`/`COLOR_LIGHT` + `THEME_DARK`/`THEME_LIGHT` StyleSheets |
| `bibleReference.ts` | Bible structure data: 66 books as `{ titleShort, longTitle }` l10n WORD keys + `chapters` (verse count per chapter, `chaptersAlternative` where translations differ) |
| `navigator.tsx` | react-navigation stack typed with `RootStackParamList` from `models.ts` (8.1.14): all screens, `headerShown:false`, `freezeOnBlur` + `detachInactiveScreens` (render-lag fix 8.1.3), `linking` config for `bbh://` / `bible-by-heart://` / `https://biblebyheart.app` deep links, the `ReactNavigation.RootParamList` global augmentation (so `useNavigation`/`useRoute` are typed app-wide), and the background-notification TaskManager task. Exports `navigationRef` (imperative navigation from outside the tree: share intent in `App.tsx`, notification taps in `AppContext`) |
| `storage.ts` | single `react-native-storage` instance over AsyncStorage (`defaultExpires: null`), default-exported; every persist/load goes through it |
| `context/AppContext.tsx` | global app context: single source of truth for `state`/`dispatch` + provides `t` (l10n) and `theme`; persists state + the rolling daily backup (`STORAGE_BACKUP_NAME`; the pre-migration snapshot is a separate write-once key owned by the boot path); wires notification-response handling. Exports `AppProvider`, `useAppContext`, and `AppContext` (for tests/narrow providers) |

### `src/screens/`

> All screen files are `PascalCase.tsx` since 8.1.15 (2026-08-26) — the rename was
> file-level only, every exported component name and every line of logic is unchanged.

| File | Description |
|---|---|
| `HomeScreen.tsx` | main screen: stroke/streak, week activity, entry to test/list/stats |
| `ListScreen.tsx` | passage list: search, filters, sort, swipe actions, editor entry. Owns the add flow: address picker → (8.2.1b) a translation `SelectModal`, shown only when `getTranslationChoice` says the answer is not already clear → `SCREEN.passage` with `{address, translationId}` |
| `TestsScreen.tsx` | training session: renders generated tests per level, navigation dots |
| `FinishScreen.tsx` | session results screen (feature: show dynamic session data) |
| `StatsScreen.tsx` | global + per-passage statistics |
| `CalendarScreen.tsx` | month/day activity calendar view |
| `SettingsScreen.tsx` | settings hub: language/theme selects + rows that navigate to the sub-menu screens below (was: rendered each sub-list inline as a MiniModal). User row gated behind `isAutorized` |
| `PassageScreen.tsx` | add/edit a passage (former `ListScreen` editor modal; reads AppContext, draft committed on save). Since 8.2.1c it also closes the add journey: saving a **new** passage that has text offers a "study this one" drill (a `ConfirmModal`) → `generateStudyOneTests` + `SCREEN.test`; declining, or editing an existing passage, goes to the list as before |
| `ListSettingsScreen.tsx` | List settings sub-menu (left-swipe tag, translations link, passage import/export, **whole-state backup export + restore-from-file** — restore decodes first, then shows a `ConfirmModal` with the file's passage/test counts before the swap, 8.1.9). Was `settingsLists/listSettings` MiniModal |
| `TranslationsSettingsScreen.tsx` | Translations editable list (nested under List settings). Was a modal-in-modal via `SettingsListWrapper` |
| `TestsSettingsScreen.tsx` | Tests settings sub-menu (haptics, auto-increase level, train-modes link). Was `settingsLists/testsSettings` MiniModal |
| `TrainModesSettingsScreen.tsx` | Train-modes editable list (nested under Tests settings). Was a modal-in-modal via `SettingsListWrapper` |
| `NotificationsSettingsScreen.tsx` | Reminders settings sub-menu (enable, smart time, reminders link, dev test). Was `settingsLists/notificationsSettings` MiniModal |
| `RemindersSettingsScreen.tsx` | Reminders editable list (nested under Reminders settings). Was a modal-in-modal via `SettingsListWrapper` |
| `StatsSettingsScreen.tsx` | Stats settings sub-menu (weekly metric). Was `settingsLists/statsSettings` MiniModal |
| `AboutSettingsScreen.tsx` | About + legal + dev-mode sub-menu. Was `settingsLists/aboutSettings` MiniModal; inner info/password/log dialogs stay MiniModals. Its dev-mode state export/import rows delegate to `utils/backupFile` since 8.1.9 (same file format as the user-facing backup, no confirmation — dev only) |
| `UserSettingsScreen.tsx` | Account settings (email/profile/data visibility, delete account). Was `settingsLists/userSettings` MiniModal; delete-confirm stays a MiniModal |
| `LoginScreen.tsx` | email/password login vs API (P1: finish & verify e2e) |
| `RegisterScreen.tsx` | account registration vs API |

### `src/components/`

See the component library table in `CODING_RULES.md` §7 for descriptions:
`Text` `AddressPicker` `BackupOfferModal` `Button` `Checkbox` `ConfirmModal`
`DotIndicator` `EmergencyScreen` `ErrorBoundary` `Header` `Icon`+`iconData.ts` `Input`
`LevelPicker` `MiniModal` `PassageEditor` `Select` `SelectModal` `SettingsListWrapper`
`SettingsMenuItem` `SettingsSubScreen` `TestNavDot` `WeekActivity`

All component files are `PascalCase.tsx` (`iconData.ts` is data, not a component) since
8.1.15 (2026-08-26), and since 8.1.15a every file name matches its export exactly —
`TestNavDott` → `TestNavDot` and `WeekActivityComponent` → `WeekActivity` were the last
two near-misses. Grep for either old spelling and you will find nothing.

`Text.tsx` — themed `<Text>` wrapper (STRATEGY §4.3): reads the theme from
`AppContext` and applies the semantic text color, so callers stop hand-threading
`color: theme.colors.text` onto every RN `<Text>`. Requires the AppProvider (or, in
tests, a bare `AppContext.Provider` — now exported from `context/AppContext.tsx`).

STRATEGY §4.3 base-component migration — **COMPLETE** (2026-08-24, sessions
8.1.11–8.1.13). No component in `src/` takes `theme` or `t` as a prop any more; every
one reads them from `useAppContext()`, and all ~277 `theme={...}` / `t={...}` call
sites are gone. Consequence: **every** component now requires a provider above it —
tests use `test-utils/renderWithContext.tsx`, never a bare `render()`.

The one deliberate exception is `EmergencyScreen.tsx` (the crash screen, extracted out
of `App.tsx` in 8.1.9a): it renders *outside* `AppProvider` (that is the point — it must
work when state/theme code is broken), so it keeps raw `react-native` primitives and
hardcoded bilingual strings. `useAppContext()` still throws without a provider, on
purpose, so a missing provider anywhere else is a loud failure rather than a silent
fallback theme.

Two `theme={theme}` occurrences survive inside `{/* ... */}` JSX comment blocks
(`PassageEditor.tsx` reminder toggle, `TestsScreen.tsx` dev-mode "Pass" button) — dead
code that predates the migration, left untouched to keep the diff honest. A grep for
`theme={` will hit them; they are not live call sites.

`SettingsSubScreen.tsx` — shared shell (View + Header with back + StatusBar) for
every settings sub-menu screen. `SettingsListWrapper.tsx` — reusable editable-list
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
| `fetchESV.ts` | fetch passage text from the ESV API (token from `expoConfig.extra.ESVTOKEN`; no token → empty string, so the app still works offline/unconfigured). The template for the pluggable text-source interface in STRATEGY §6.3 |

### `src/l10n/`

| File | Description |
|---|---|
| `index.ts` | `createT(langCode)` → `t(word)` lookup (falls back to the key itself); exports the `WORD` union = `keyof typeof en`, so a key missing from `en.ts` is a type error |
| `en.ts` / `ua.ts` | English / Ukrainian UI strings, flat key→string maps (always update both; ~470 keys each) |

### `src/utils/`

| File | Description |
|---|---|
| `reduce.ts` | THE reducer: every state change (passages, tests, history, settings, user); finalization block also self-heals a dangling `settings.leftSwipeTag` |
| `stateVersionConvert.ts` | chained migrations between state model versions — `versionsConvertionTable` + recursive `convertState` (`__tests__/utils/stateVersionConvert.test.ts` locks the current-era 0.0.8→0.1.0 chain) |
| `backupFile.ts` | the user-owned half of the safety net (8.1.9) — the only copy that survives an uninstall. Pure part: `serializeBackup` (state → `{app, exportedAt, stateVersion, state}` envelope), `parseBackup` (envelope **or** a bare state object → runnable state, version-tolerant via `restoreStateFromBackup`), `createBackupFileName`, `readStateVersion`. IO part shared by all three call sites (post-upgrade offer, List-settings rows, dev rows): `exportBackupFile` / `importBackupFile` — both total, they toast and resolve instead of throwing |
| `bootBackup.ts` | the boot path's safety net (8.1.8 + 8.1.9a): `loadStoredState(key?)` → `{status:"found"\|"empty"\|"failed"}` — the read classifier that stops a failed read from being mistaken for a fresh install (with `isKeyMissingError`, which keys on the `NotFoundError` *name*); `savePreConvertSnapshot` (write-once into `STORAGE_PRECONVERT_BACKUP_NAME`, never overwrites), `restoreStateFromBackup` (accepts an OLDER snapshot and converts it forward), `loadRestorableBackup(key)`. All total — they log and resolve instead of throwing, because every caller is on the cold-start path |
| `getStats.ts` | all stats calculation: `getStroke` / `getMaxStroke` (current + longest day streak), `getWeeklyStats` (home week bars), `getPassageStats`, `getAppStats` (stats + calendar screens), `getTimeBoundStats`. Callers memoize these — they walk the whole history |
| `getPerfectTests.ts` | `getPerfectTestsNumber(history, passage)` — length of the newest unbroken run of error-free tests at/above the passage's `maxLevel`; compared against `PERFECT_TESTS_TO_PROCEED` to level a passage up |
| `getSimularity.ts` | string similarity (answer checking) |
| `levelsConvertion.ts` | passageLevel ↔ testLevel conversion |
| `addressToString.ts` / `addressFromString.ts` | Address ↔ human string; parser finds the reference ANYWHERE in the text (title + chapter:verse, word-boundary-guarded), picks the most specific book, and matches per-book aliases from `bookAliases.ts` |
| `bookAliases.ts` | Per-language abbreviation / spelling-variant lists per book (keyed by long-title WORD), consumed by `addressFromString` in addition to the localized titles |
| `sanitizeSharedText.ts` | Pure cleaner for share-sheet text: normalizes untypable chars (dashes, curly quotes, nbsp, ellipsis), strips URLs + wrapping quotes + dangling separators. Used by `ListScreen.handleTextFromIntent` |
| `getTranslationChoice.ts` | 8.2.1b — `getTranslationChoice(translations)` → `{needsChoice, translationId}`: whether the add-passage flow must ask for a translation (only with more than one) and which one it uses/preselects (the default, else the first). Used by `ListScreen.handleAPSubmit` |
| `addressDistance.ts` / `addressDifference.ts` / `addressOrder.ts` | address math for test generation/sorting |
| `getNumberOfVerses.ts` / `getNumberOfEnglishVerses.ts` | verse counting for limits (localized vs English chapter numbering) |
| `fileManager.ts` | `writeFile`/`readFile` — import/export files (txt/json) via document picker |
| `handlePassageExport.ts` | passage export/import serialization (`passagesToLSV`/`arrayToLSV`/`LSVToArray`/`arrayToPassages`) + dedupe |
| `notifications.ts` | reminders: `schedulePushNotification`, `getAutoTimeTrigger` (smart time), `checkSchedule` (re-plan on state change), `registerForPushNotificationsAsync` (permissions + localized Android channel) |
| `formatDateTime.ts` (`timeStringFromMS`/`dateToString`/`timeToString`) / `secondsToString.ts` / `addZero.ts` | formatting helpers |
| `randomizers.ts` | `randomRange`/`randomItem`/`randomListRange` — used by test generation |
| `getThemeFromScheme.ts` | `getThemeFromScheme(themeType, colorScheme)` → `{ theme, colors }` (dark/light, `auto` resolved from the passed OS scheme — never calls `useColorScheme` itself, see §3 polyfill history); exports `ThemeAndColorsModel` |
| `toastShow.ts` | toast notifications |
| `logger.ts` | app logger — `logger.write`/`.error`/`.readAll`/`.clearAll`; appends to a `STORAGE_LOGGER` array capped at `LOGGER_MAX_ARRAY_SIZE`, read by the dev-mode log viewer |
| `isTokenExpired.ts` | JWT payload decode + expiry check (used by `services/fetch.ts` auth/refresh) |
| `generateTests/index.ts` | `getPassagesByTrainMode` (which passages are due) + `generateTests`/`generateATest` — orchestrates per-passage test generation by level. Also `generateStudyOneTests(state, passageId, repeats?)` (8.2.1c): the "study this one" drill — one passage repeated `STUDY_ONE_REPEATS` times at its own selected level, in one session, reading no train mode at all |
| `generateTests/createL10Test.ts` … `createL50Test.ts` | one generator per test level (10, 11, 20/21 in `createL2XTest`, 30, 40; `createL50Test` = `createL40Test` today). `createL10Test.ts` also owns the shared `CreateTestInputModel` / `CreateTestMethodModel` types |
| `generateTests/getErrorGradedSentences.ts` | pick hardest sentences from error history |
| `generateTests/getWordsFromErrors.ts` | pick hardest words from error history |

### `src/svg/`

`daggetLogo.tsx` (app logo), `finishCup.tsx` (finish screen trophy), `manger.tsx` (seasonal Christmas icon)

### `__tests__/`

| Area | Files |
|---|---|
| smoke | `App.test.tsx` |
| components | AddressPicker, Button, Checkbox, ConfirmModal, ErrorBoundary, Header, Icon, Input, MiniModal, Select, SettingsMenuItem, Text (+snapshots) — 8.1.15a renamed the eight camelCase leftovers and their `.snap` files so every test matches its subject's casing (CODING_RULES §2) |
| levels | Level1–5 (+snapshots) |
| utils | addressFromString, backupFile, bootBackup, createL11Tests, generateStudyOneTests, getNumberOfVerses, getStats, getTranslationChoice, handlePassageExport, isTokenExpired, notifications, reduce, sanitizeSharedText, stateVersionConvert |
| screens | `screens/ListScreen.test.tsx` — the add-passage flow (8.2.1b) driven through the real address picker: asks for the translation when several exist, skips it when one does, navigates nowhere when dismissed. `screens/PassageScreen.test.tsx` — the study-one offer (8.2.1c) driven through the real editor's Save: offered on a new passage with text, generates a one-passage session and opens training, declined goes to the list, never offered on an edit or on an empty passage |
| e2e | `e2e/flow.test.tsx` — the release guard (8.1.16a): one test drives create state → add passage → `generateTests` → answer with errors → finish → assert stats, through the reducer + generators only (no rendering), plus an explicit assertion that no error count is exposed |
| fixtures | `fixtures/state006.ts`, `fixtures/state007.ts` — realistic legacy states (passages, history, settings) for the 8.1.10 converter hops. **Not test suites**: `package.json`'s jest `testPathIgnorePatterns` excludes `__tests__/fixtures/`, otherwise jest's default `testMatch` picks them up and fails them as suites with no tests |

`test-utils/renderWithContext.tsx` (repo root, outside `__tests__/` so jest doesn't
treat it as a suite) — shared helper that renders a component under an
`AppContext.Provider` with a synthetic value (no side effects). `renderWithContext(ui,
{ themeType?, langCode?, state? })`. As of the 8.1.11–8.1.13 migration **every**
component reads `theme`/`t` from context, so any test that renders app UI goes through
this helper rather than a bare `render()`.

---

## Repo 2: `c:/Code/bbh-api` — API server (Express / TS / sqlite)

### Root

| File | Description |
|---|---|
| `Dockerfile` / `docker-compose.yml` | containerization. Three compose services: `local` (source bind-mounted, keeps `nodemon` for the file watch), `staging` and `production` — the deployed two run **plain `node --env-file=... ./dist/app.js`** since 8.1.17; there is no source to watch in a built image and Docker's `restart: unless-stopped` is the supervisor. The Dockerfile's default `CMD` is env-agnostic `node ./dist/app.js` (it used to point at a non-existent `./app.js` under `nodemon`; every service overrides it anyway) |
| `.github/workflows/deploy-staging.yml` / `deploy-production.yml` | CI deploy to VPS |
| `.staging.env` / `.production.env` / `.test.env` / `.env` | per-env secrets (never commit new secrets). All but `.test.env` are gitignored and **have never been tracked in any branch**, which is why the VPS deploy's `git reset --hard origin/<branch>` cannot touch `.production.env` (verified 8.1.17). `ANDROID_CERT_FINGERPRINTS` (comma-separated SHA-256, from Play Console → Setup → App integrity) lives here — it is what `/.well-known/assetlinks.json` serves |
| `babel.config.json` / `tsconfig.json` / `jest.config.ts` / `.eslintrc.json` / `.prettierrc` | toolchain |
| `jest.setup.ts` | `setupFilesAfterEnv` — mocks **nodemailer** for every suite so no test can open an SMTP socket (2026-08-26). `utils/email.ts` builds its transporter at module load and the mail-sending routes reach it through a controller, so `sendEmail`'s `customTransporer` parameter cannot cover those paths; replacing the library is the one place that does. Mailer behaviour is still asserted for real in `__tests__/utils/email.test.ts` via injected transports |
| `package.json` | scripts: dev (babel watch + node watch), build, test, docker, genKey |
| `codingdiary.md` | **Fedir's personal diary — never edit** |
| `README.md` | Fedir's own planned-arch checklist (version/auth/user done; sync, feedback, payment, broadcast open) + yarn/docker/test setup commands. Not an endpoint reference |
| `data/test.db` | sqlite test database — a **build artifact, not a fixture**: the controller suite creates its own table (`POST /api/createDB`) and drops it again at the end, and sqlite3 recreates the file when missing. Verified 2026-08-26 by deleting it and running the suite: 50/50 pass. It is tracked only because `.gitignore` has an explicit `!test.db` under `*.db`, so every test run puts an unreadable binary blob in the diff |
| `static/` | privacy policy, ToS, account-deletion pages, favicon, logo (store compliance) |

### `src/`

| File | Description |
|---|---|
| `app.ts` | Express bootstrap: middleware, routes, static, listen; on startup calls `ensureUsersTableColumns` (schema self-heal) → `ensureTestUser` (demo account) → `verifyMailer` (non-blocking SMTP auth check) |
| `routes.ts` | all route definitions → controllers, plus the two static-ish endpoints: `/static` and **`GET /.well-known/assetlinks.json`** (8.1.17) — the Digital Asset Links statement that lets verified `https://biblebyheart.app` App Links open the Android app instead of the browser. Reads `ANDROID_CERT_FINGERPRINTS` **lazily, per request** (so the env file is the only place it is configured and tests can drive it); 503 + a logged warning when unset, rather than serving a statement with an empty fingerprint list |
| `constants.ts` | API constants (login limits, token times) + `TEST_USER_*` demo-account credentials (env-overridable) + `ANDROID_PACKAGE_NAME` (must match `android.package` in the app's `app.config.js`) |
| `models.ts` | server-side types |
| `controller/user.controller.ts` | auth/user handlers: register, login, refresh, edit, delete, email confirm/reset; demo account (`TEST_USER_UUID`) is blocked from edit/delete + exempt from login lockout |
| `middleware/requireUser.ts` | JWT auth guard |
| `middleware/validateResource.ts` | zod request validation |
| `schema/user.schema.ts` | zod schemas for user endpoints |
| `services/base.service.ts` | generic sqlite CRUD service (storage-agnostic layer); `createUsersTable`, `dropDB`, `ensureTestUser` (idempotent demo-account seed), and `usersTableColumns` + `ensureUsersTableColumns` (idempotent "ensure columns exist" migration — self-heals schema drift, STRATEGY §3) |
| `services/user.service.ts` | user-specific db logic |
| `utils/jwt.ts` | sign/verify access + refresh tokens |
| `utils/email.ts` | nodemailer confirmation/reset emails (`sendEmail`) + `verifyMailer` boot-time SMTP auth check; creds from `MAIL_LOGIN`/`MAIL_PASS` env |
| `utils/assetLinks.ts` | the pure half of the App-Links endpoint (8.1.17): `parseFingerprints` (comma/semicolon/newline separated env value → normalized uppercase SHA-256 list, silently dropping anything that is not 32 colon-separated hex pairs — one malformed statement makes Android reject the **whole** file, so a partial list beats a broken one) and `buildAssetLinks` (→ the `delegate_permission/common.handle_all_urls` statement array) |
| `utils/logger.ts` | pino logger |

### `__tests__/`

`app.test.ts`, `controller/user.controller.test.ts`, `services/base.service.test.ts`,
`services/migration.test.ts` (ensureUsersTableColumns: fresh-DB create, adds missing
column preserving rows, idempotent), `utils/assetLinks.test.ts` (parse/build, incl. the
malformed-entry cases), `utils/email.test.ts`, `utils/jwt.test.ts`. `app.test.ts` also
covers the assetlinks endpoint end to end (200 + `application/json` when configured,
503 when not).

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
