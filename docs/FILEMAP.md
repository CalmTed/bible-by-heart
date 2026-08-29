# File Map — bible-by-heart + bbh-api + bbh-shared

> Covers all three repos so every session has the whole picture.
> **Maintenance rule (win condition of every task):** when you add, remove or repurpose a
> file, update its line here in the same task.
> Descriptions say what a file **is**, in the present tense. Why it became that way is in
> `robotdiary.md`; the rules it obeys are in `CODING_RULES.md`.

---

## Repo 1: `c:/Code/bible-by-heart` — mobile app (Expo / React Native / TS)

### Root

| File | Description |
|---|---|
| `App.tsx` | entry: loads state once through `bootBackup.loadStoredState` (a failed read writes nothing and shows `EmergencyScreen`), converts it forward when the version differs, offers a backup file of the raw pre-conversion state, wires navigator + splash, wraps the tree in `ErrorBoundary`, and routes Android share-intent text into the add-passage flow |
| `index.js` | RN registry entry point |
| `app.config.js` | Expo config (name, icons, staging/prod variants, `extra.HOST`; **no text-source key** — the server holds it). Android App-Links VIEW filter + the `.bbhbackup` MIME filter. Plugins: `expo-build-properties` (compile/target SDK 36, min 24 — the only place the Android SDK level is declared), `expo-share-intent` (Android only, `text/*`), `expo-localization`, `expo-secure-store`, `expo-notifications` |
| `eas.json` | EAS build + submit profiles (staging, production) |
| `babel.config.js` / `metro.config.js` | build toolchain. **Deliberately bare**: `babel-preset-expo` applies `react-native-worklets/plugin` itself, and a manual entry double-applies it |
| `eslint.config.js` / `tsconfig.json` | lint + TS config. `include` does **not** cover `__tests__/`, so tests are typechecked by nothing |
| `jest.setup.js` / `package.json` (jest block) | jest mocks + config (preset jest-expo, `testPathIgnorePatterns` for the fixtures) |
| `package.json` / `package-lock.json` | scripts (dev, lint, test, build-dev/-prod) + the committed lockfile CI runs `npm ci` against |
| `.npmrc` | `legacy-peer-deps=true` — required to install |
| `.github/workflows/submitStagingToPlayMarket.yml` · `submitProductionToPlayMarket.yml` | CI: `npm ci` + lint + test, then EAS build/submit. Node 22.17.0, eas-cli pinned, packager npm |
| `projectdiary.md` | **Fedir's personal diary — never edit** |
| `readme.md` | public description + roadmap |
| `test-utils/renderWithContext.tsx` | renders a component under an `AppContext.Provider` with a synthetic value and no side effects. Lives outside `__tests__/`, where jest would collect it as a suite. Every test that renders app UI goes through it |
| `assets/` | icons, splash, notification images (prod + dev variants) |

### `docs/`

| File | Description |
|---|---|
| `ARCHITECTURE.md` | vision, philosophy, core technical decisions (read first) |
| `CODING_RULES.md` | style rules + the reusable component/util library |
| `FILEMAP.md` | this file |
| `PLAN.md` | the roadmap — one checkbox = one session. The only file where work is marked done, and a finished step is deleted from it |
| `STRATEGY.md` | the destination — what "finished" means, the milestone ladder, feature and technical direction, quality bar, risks, locked decisions |
| `robotdiary.md` | the AI session log, and the only file that carries history |

### `src/` — core

| File | Description |
|---|---|
| `models.ts` | every data model type: AppState, Passage, Address, history, settings, actions (`TranslationModel.sourceId` is the id the API knows a translation by, `null` for the user's own). Also the navigation types — `RootStackParamList`, `ScreenPropsModel<T>`, per-screen param models — which live here rather than in `navigator.tsx`, which imports every screen. And `LevelComponentModel`, the four props every level takes |
| `initials.ts` | default values for every state version; `createAppState010` is the live one. `getDefaultTranslations` is built from `BUNDLED_TRANSLATION_SOURCES`, and `SHIPPED_TRANSLATION_IDS` fixes their local ids forever — every passage stores one in `verseTranslation` |
| `constants.ts` | `VERSION` (state model) + `alowedStateVersions`; `APP_VERSION` (the real app version, read back from `expoConfig`); `API_VERSION` + the `API_LINK` endpoint enum; `BUNDLED_TRANSLATION_SOURCES` (the shipped copy of the API catalogue); storage keys; training tuning (`PERFECT_TESTS_TO_PROCEED`, `MIN_TEST_OPTIONS`, `STUDY_ONE_REPEATS`, `ERRORS_TO_DOWNGRADE`, `MAX_L50_TRIES`); the enums; `VIBRATION_PATTERNS`; `ANIMATION` (the whole motion vocabulary — durations, spring, rise/press/header distances, stagger, gesture geometry); `LAYOUT` (`maxContentWidth`, `headerHeight`, `scrollBottomGap`); `STATE_PERSIST_DEBOUNCE`; the `COLOR_*`/`THEME_*` palettes |
| `bibleReference.ts` | Bible structure: 66 books as `{titleShort, longTitle}` l10n keys + verse counts per chapter (`chaptersAlternative` where translations differ) |
| `navigator.tsx` | the react-navigation stack, typed by `RootStackParamList`: every screen, `headerShown: false`, `freezeOnBlur`, the four destination presets (settings from the left, list from the right, practice from the top, stats from the bottom) each with `detachPreviousScreen: false` so a pop has nothing left to render, `gestureEnabled: false` on practice, `linking` for `bbh://` / `https://biblebyheart.app`, and the background-notification task. Exports `navigationRef` |
| `storage.ts` | the single `react-native-storage` instance over AsyncStorage (`defaultExpires: null`); every load/persist goes through it |
| `context/AppContext.tsx` | the one source of `state`/`dispatch`, and where `t` and `theme` come from. Persists the state (coalesced to one write per `STATE_PERSIST_DEBOUNCE`, flushed when the app backgrounds), takes the rolling daily backup, handles notification taps. Exports `AppProvider`, `useAppContext`, `AppContext` |

### `src/screens/`

| File | Description |
|---|---|
| `HomeScreen.tsx` | stroke, week activity, and the way into practice/list/stats. One `space-between` column capped at `LAYOUT.maxContentWidth`, the logo sized as a share of the window; wrapped in `HomeSwipe`, whose four directions reach the same four destinations the buttons do |
| `ListScreen.tsx` | the passage list: search, filter and sort entry points, swipeable rows, editor entry. Owns the add flow as one `AddFlowStep` (translation → address → editor), the translation step skipped when there is nothing to ask. Rows are `ReanimatedSwipeable` with a module-level `SwipeActionPanel`; the filter and the sorted data are memoized |
| `FiltersScreen.tsx` | passage-list filters (level, max level, tags, translations); dispatches `toggleFilter` and hands nothing back, because filters live in app state |
| `TestsScreen.tsx` | the training session: the dot bar (`TestNavBar`), the level lookup through a `Record<TESTLEVEL, FC<LevelComponentModel>>`, the session body in an `Entrance` keyed on the test id, and the one way out (a `ConfirmModal` behind the header cross) |
| `FinishScreen.tsx` | end of a session: bare `Header` over a scrolling body over a Continue button that stays put — the shell the session summary will fill |
| `StatsScreen.tsx` | global + per-passage statistics |
| `CalendarScreen.tsx` | month/day activity calendar |
| `SettingsScreen.tsx` | settings hub: language/theme + rows into the sub-screens. The account row is gated on `isAutorized` |
| `PassageScreen.tsx` | add/edit a passage; the draft is committed on Save. Saving a **new** passage that has text offers a single-passage drill |
| `ListSettingsScreen.tsx` | list settings: left-swipe tag, translations link, passage import/export, whole-state backup export and restore-from-file |
| `TranslationsSettingsScreen.tsx` · `TrainModesSettingsScreen.tsx` · `RemindersSettingsScreen.tsx` | editable lists over `SettingsListWrapper` |
| `TestsSettingsScreen.tsx` · `NotificationsSettingsScreen.tsx` · `StatsSettingsScreen.tsx` | sub-menus (haptics/auto-level, reminders, weekly metric) |
| `AboutSettingsScreen.tsx` | about, legal and dev mode; its inner about/legal/dev-password dialogs stay `MiniModal`s, and its dev state export/import goes through `utils/backupFile` |
| `UserSettingsScreen.tsx` | account settings and deletion (a dialog, sized to its text) |
| `LogSettingsScreen.tsx` | dev-mode log viewer (list, export, clear); reads on mount and after a clear |
| `LoginScreen.tsx` / `RegisterScreen.tsx` | email-or-username login and registration against the API |

### `src/components/`

Descriptions live in the component library table in `CODING_RULES.md`:
`AddressPicker` `BackupFileOpener` `BackupOfferModal` `BackupRestoreModal` `Button`
`Checkbox` `ConfirmModal` `DotIndicator` `EmergencyScreen` `Entrance` `ErrorBoundary`
`Header` `HomeSwipe` `Icon` + `iconData.ts` `Input` `LevelPicker` `MiniModal`
`PassageEditor` `Select` `SelectModal` `SettingsListWrapper` `SettingsMenuItem`
`SettingsSubScreen` `TestNavDot` `Text` `WeekActivity`.

No component takes `theme` or `t` as a prop; every one reads them from `useAppContext()`,
so every rendering test needs `renderWithContext`. The single exception is
`EmergencyScreen.tsx`, which renders outside the provider by design and therefore uses raw
`react-native` primitives and hardcoded bilingual strings.

| Subdir | Description |
|---|---|
| `levels/L10..L50.tsx` | one file per test level, each named after its only export. They render one test type each and read passage text only through `Passage`. None answers a test from its render body: a test whose passage is gone renders an empty `View` and lets `TestsScreen` leave the session |
| `levels/levelLayout.ts` | the arrangement all seven levels fill — **prompt** (content-sized, scrolls when long), **answer** (takes the rest), **action** (pinned to the bottom, stretched to the column) — plus the column's one side gutter. A stylesheet, not a wrapper |
| `levels/SentenceContext.tsx` | the sentences either side of the range being typed (L40, L50), over `Passage.getContextBefore`/`getContextAfter` |
| `levels/NoOptions.tsx` | what L10/L11 render when the generator handed them no options. Deliberately no skip button |

### `src/services/`

| File | Description |
|---|---|
| `fetch.ts` | API client: auth endpoints, token refresh through `isTokenExpired`, API-version check, error handling. Its forced logout resets through a functional `setState` updater — never a captured snapshot, which would roll the app back a step |
| `fetchPassageText.ts` | the app's only text source: `fetchPassageText(address, sourceId)` and `fetchTranslationCatalogue()`, which falls back to `BUNDLED_TRANSLATION_SOURCES`. The request carries **no authorization of its own** — the key lives on the server |

### `src/l10n/`

| File | Description |
|---|---|
| `index.ts` | `createT(langCode)` → `t(word)`; exports `WORD = keyof typeof en`, so a key missing from `en.ts` is a type error |
| `en.ts` / `ua.ts` | English / Ukrainian UI strings, flat key→string maps, ~470 keys each. Always update both |

### `src/utils/`

| File | Description |
|---|---|
| `reduce.ts` | THE reducer: every state change goes through it. The finalization block self-heals a dangling `settings.leftSwipeTag` and the dev-mode expiry, copy-on-write, so untouched parts of the state come back by identity |
| `stateVersionConvert.ts` | chained state migrations: `versionsConvertionTable` + recursive `convertState`. Newest hop `to011` gives every translation a `sourceId` and merges in the bundled catalogue |
| `backupFile.ts` | the user-owned half of the safety net. Pure: `serializeBackup` / `parseBackup` / `parseBackupEnvelope` (envelope **or** bare state, version-tolerant) / `createBackupFileName` / `readStateVersion`. IO: `exportBackupFile` / `importBackupFile` / `readBackupFromUri`, all total. A backup is the app's own file type (`.bbhbackup`, `BACKUP_FILE_MIME`), with `BACKUP_LEGACY_MIMES` keeping older `.json` copies pickable |
| `bootBackup.ts` | the boot path's safety net: `loadStoredState` → `found`/`empty`/`failed` (keyed on the `NotFoundError` name), `savePreConvertSnapshot` (write-once), `restoreStateFromBackup` (accepts an older snapshot and converts it forward), `loadRestorableBackup`. All total — they log and resolve |
| `address.ts` | everything an address can do, as one namespace over plain data: `Address.format`, `.parse` (finds a reference anywhere in a text, most specific book wins, aliases included, regexes built once on the first parse), `.equals` (pure; an open end is `null` or `NaN`), `.distance`, `.order`, `.versesCount` |
| `passage.ts` | everything the app knows about a passage's text: `getSentences` (punctuation kept, so pieces rejoin), `getRangeText` / `getRangeDisplayText`, `getContextBefore` / `getContextAfter`, `getWords` (whitespace collapsed, so an index means one word to generator and renderer), `sameWord`, `getFirstWords`, `getVersesCount`, `countEnglishVerses`, and the typing tolerance `foldTypeable` / `typedEquals` / `typedPrefixLength` |
| `bookAliases.ts` | per-language abbreviations and spelling variants per book (314 of them), consumed by `Address.parse`. A shipped constant — resolving a reference never needs the network. Its test generates one case per spelling and holds two rules: no spelling names two books, no entry repeats a shipped title |
| `translation.ts` | catalogue logic, pure: `isFetchableTranslation`, `mergeCatalogueIntoTranslations` (appends only what the app has never seen, never on an id in use), plus the share stamp — `TRANSLATION_ALIASES`, `FOREIGN_TRANSLATION_CODES` and `takeSharedTranslation`, which only takes names the app knows and only where a stamp goes |
| `sanitizeSharedText.ts` | pure cleaner for share-sheet text: folds untypeable characters, strips URLs, wrapping quotes and dangling separators, bracketed verse numbers (digits only) and a leading translation code that stands apart from the verse |
| `parseSharedPassage.ts` | a share payload → `{address, passageText, translationId}`. The order is the design: take the stamp off the RAW text, sanitize, parse the address, cut it out, sanitize again |
| `getTranslationChoice.ts` | `{needsChoice, translationId}` — whether the add flow must ask, and what it preselects |
| `generateTests/` | the test generators: `index.ts` (`generateTests`, `generateStudyOneTests`, `generateATest`, `getPassagesByTrainMode`, `getLastTestedByPassage`, `canOfferPassageOptions`) plus one `createLxxTest` per level, `getErrorGradedSentences` and `getWordsFromErrors`. `createL10Test` stamps its own level, because it is also L11's fallback |
| `getStats.ts` | `getStroke` / `getMaxStroke` (current and longest day streak, linear, sharing one `testDayKey`), `getWeeklyStats`, `getPassageStats`, `getAppStats`, `getTimeBoundStats`. Callers memoize these — they walk the whole history |
| `getPerfectTests.ts` | `getPerfectTestsNumber(history, passage)`, the newest unbroken run of error-free tests at or above `maxLevel`, and `getPerfectTestsNumbers(history, passages)`, the same answer for every passage in one pass |
| `feedback.ts` | the one place that decides whether the phone may buzz: `feedback(settings, patternName)` reads `hapticsEnabled` itself. Sound will be wired here and nowhere else |
| `screenTransition.ts` | `candyTransitions` — one preset per edge — and `candyTransition`, the default spread into the navigator. One interpolator factory over two axes; the vertical gesture band is one `LAYOUT.headerHeight` deep |
| `getThemeFromScheme.ts` | `(themeType, colorScheme)` → `{theme, colors}`; never calls `useColorScheme` itself |
| `notifications.ts` | reminders: `schedulePushNotification`, `getAutoTimeTrigger`, `checkSchedule`, `registerForPushNotificationsAsync` (permissions + the localized Android channel) |
| `fileManager.ts` | `writeFile` / `readFile` through the document picker, plus `readFileAtUri` for a file the app was handed by an intent. A file whose provider reports no MIME type is accepted — the content decides |
| `handlePassageExport.ts` | passage export/import serialization (`passagesToLSV` / `arrayToLSV` / `LSVToArray` / `arrayToPassages`) + dedupe |
| `logger.ts` | `write` / `error` / `readAll` / `clearAll` over a capped ring buffer. Never `console.log` |
| `isTokenExpired.ts` | `decodeJwtPayload` + `isTokenExpired` (malformed or missing = expired) |
| `getSimularity.ts` / `levelsConvertion.ts` / `randomizers.ts` / `toastShow.ts` | string similarity; passageLevel ↔ testLevel; `randomRange`/`randomItem`/`randomListRange`; toasts |
| `formatDateTime.ts` / `secondsToString.ts` / `addZero.ts` | formatting helpers |

### `src/svg/`

`daggetLogo.tsx` (the app mark), `finishCup.tsx` (finish-screen trophy), `manger.tsx`
(December variant of the mark). The two mark files take a `height` and derive the width
from the artwork's own ratio.

### `__tests__/`

| Area | Files |
|---|---|
| smoke | `App.test.tsx` |
| components | AddressPicker, BackupRestoreModal, Button, Checkbox, ConfirmModal, Entrance, ErrorBoundary, Header, HomeSwipe, Icon, Input, MiniModal, Select, SettingsMenuItem, TestNavDot, Text (+ snapshots) |
| levels | `levels/L10..L50.test.tsx` (+ snapshots) and `levels/levelLayout.test.tsx`, which holds the three-block arrangement structurally |
| context | `context/AppContext.test.tsx` — the coalesced persist |
| screens | FiltersScreen, FinishScreen, HomeScreen, ListScreen, PassageScreen, TestsScreen — driven over a real stateful context where the assertion is about what the reducer did |
| services | `fetchLogout.test.ts` (the forced logout writes through an updater), `fetchPassageText.test.ts` (no headers, the catalogue's fallback) |
| utils | address, backupFile, bookAliases, bootBackup, createL11Tests, feedback, generateATest, generateStudyOneTests, getStats, getTranslationChoice, handlePassageExport, historyScans (the shipped scans held against the naive ones on a 5 000-record history), isTokenExpired, notifications, parseSharedPassage, passage, reduce, sanitizeSharedText, screenTransition, stateVersionConvert, translation |
| e2e | `e2e/flow.test.tsx` — create state → add passages → generate → answer with errors → finish → stats, purely through the reducer and generators, and the guard that no error count is ever rendered |
| fixtures | `levelPassages.ts` (the passage every level suite renders), `state006.ts` / `state007.ts` (realistic legacy states for the converter chain). Excluded from `testMatch` |

---

## Repo 2: `c:/Code/bbh-api` — API server (Express / TS / sqlite)

### Root

| File | Description |
|---|---|
| `Dockerfile` / `docker-compose.yml` | three compose services: `local` (source bind-mounted, keeps `nodemon`), `staging` and `production`, which run plain `node ./dist/app.js` under Docker's restart policy. The env files are **single-file bind mounts**, so they must be appended to in place, never replaced |
| `.github/workflows/deploy-staging.yml` / `deploy-production.yml` | CI deploy to the VPS (`git reset --hard` + rebuild) |
| `.staging.env` / `.production.env` / `.test.env` / `.env` | per-environment secrets. All but `.test.env` are gitignored and have never been tracked, which is what makes the deploy's hard reset safe |
| `jest.setup.ts` | `setupFilesAfterEnv`: mocks nodemailer and replaces `global.fetch` with one that throws, so **no suite can open a socket** |
| `babel.config.json` / `tsconfig.json` / `jest.config.ts` / `.eslintrc.json` / `.prettierrc` | toolchain |
| `package.json` | scripts: dev, build, test, docker, genKey |
| `codingdiary.md` | **Fedir's personal diary — never edit** |
| `README.md` | Fedir's own architecture checklist + setup commands. Not an endpoint reference |
| `data/test.db` | sqlite test database — a build artifact, not a fixture: the suite creates and drops its own schema |
| `static/` | the landing page (`index.html`, plain HTML + inline CSS/SVG, en+uk in its own markup), privacy policy, ToS, account-deletion pages, favicon, logo, `robots.txt` |

### `src/`

| File | Description |
|---|---|
| `app.ts` | Express bootstrap: middleware, `recordRequest`, routes, static, listen. On startup: `ensureUsersTableColumns` → `ensureTestUser` → `verifyMailer` |
| `routes.ts` | every route → its controller, plus `/static`, `GET /stats` and `GET /.well-known/assetlinks.json`, which reads its fingerprints from the env **inside the handler** |
| `constants.ts` | login limits, token lifetimes, `TEST_USER_*` demo credentials (env-overridable), `ANDROID_PACKAGE_NAME`, `MAX_PASSAGE_VERSES` |
| `models.ts` | server-side types (`AppAddressType` is an alias of the shared `AddressType`) |
| `bibleBooks.ts` | the 66 books in the app's own order — a `bookIndex` is an index into that order on both sides of the wire — each with the code a translation file uses |
| `translations/*.json` | the four bundled Ukrainian translations (`ukr-hom`, `ukr-kul`, `ukr-ogi`, `ukr-turk`), ~7 MB each: `meta` + `books` + `verses[book][chapter][verse]` |
| `controller/user.controller.ts` | register, login, refresh, edit, delete, email confirm/reset. The demo account is blocked from edit/delete and exempt from the login lockout |
| `controller/translation.controller.ts` | the catalogue (ESV appears only where a key is configured) and the passage endpoint |
| `middleware/requireUser.ts` / `validateResource.ts` | JWT guard; zod request validation |
| `schema/user.schema.ts` / `translation.schema.ts` | zod schemas. `getPassageSchema` is an `AddressType` flattened onto the query string, zero-based like the app's own model |
| `services/base.service.ts` | generic sqlite CRUD (the storage-agnostic layer), `createUsersTable`, `dropDB`, `ensureTestUser`, and `ensureUsersTableColumns` — the idempotent "add what the live table lacks" step. It adds columns; a rename still needs an explicit migration |
| `services/user.service.ts` | user-specific db logic |
| `services/translation.service.ts` | the bundled translations as a served resource. The loading policy is written at the top of the file: nothing at boot, `meta` + `books` kept once opened, `verses` in a single hot slot |
| `services/esv.service.ts` | ESV as one more catalogue id — a proxy that reads the key at request time and stores nothing. No memo map, deliberately |
| `utils/normalizeVerseText.ts` | what makes served text typeable: fold → strip apparatus → per-language whitelist, a leftover reported with book/chapter/verse rather than removed quietly |
| `utils/assetLinks.ts` | `parseFingerprints` (drops anything that is not 32 colon-separated hex pairs, because Android rejects a file with one bad statement) + `buildAssetLinks` |
| `utils/stats.ts` | the `/stats` page: `recordRequest` middleware + `renderStatsPage`. In memory, capped, escaped, `noindex`, nothing user-identifying |
| `utils/jwt.ts` / `email.ts` / `logger.ts` | tokens; `sendEmail` + `verifyMailer`; pino |

### `__tests__/`

`app.test.ts` (incl. the assetlinks endpoint, landing page, stats, robots.txt),
`controller/user.controller.test.ts`, `controller/translation.controller.test.ts` (both
endpoints end to end, and the ESV proxy against a mocked fetch: normalization in flight,
nothing written to disk or sqlite, two requests → two upstream calls, an upstream 401
mapped to a 502 whose body does not carry the key), `services/base.service.test.ts`,
`services/migration.test.ts`, `services/translation.service.test.ts` (including a walk over
every verse of every translation asserting the whitelist holds), `utils/assetLinks.test.ts`,
`utils/normalizeVerseText.test.ts`, `utils/email.test.ts`, `utils/jwt.test.ts`.

---

## Repo 3: `c:/Code/bbh-shared` — shared contract package (standalone, TS)

The client↔server contract both repos depend on — **not** a monorepo. Public at
`github:CalmTed/bbh-shared`, consumed as a git dependency pinned to a tag. `dist/` is
**committed**, because Yarn 1 does not run a git dep's `prepare`, so consumers need no
build step. Zero runtime deps; `tsc` → `dist/` (CJS + `.d.ts`); `node:test`.

Consumed today: the app's `constants.ts` re-exports `API_VERSION`; the server's
`models.ts` takes `AddressType` + `PASSAGELEVEL` and its `constants.ts` re-exports
`PASSAGELEVEL`/`TESTLEVEL`. Still local, pending a v0.0.2: the app's `API_LINK` enum, the
auth DTOs, and the two divergent user models.

| File | Description |
|---|---|
| `src/apiVersion.ts` | `API_VERSION`, `API_COMPATIBILITY`, `isApiVersionCompatible()`, `ApiVersionResponse` |
| `src/endpoints.ts` | `API_ENDPOINTS` — endpoint paths, one source of truth |
| `src/auth.ts` | request/response DTOs for the user/auth endpoints + shared unions |
| `src/primitives.ts` | `AddressType` (nullable end fields) + the `PASSAGELEVEL`/`TESTLEVEL` enums |
| `src/index.ts` / `src/apiVersion.test.ts` | barrel re-export; `node:test` coverage of the compat helper |
| `package.json` / `tsconfig.json` / `README.md` | package config; the README carries the release checklist (rebuild `dist/` before tagging) |
