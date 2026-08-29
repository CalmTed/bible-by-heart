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
| `models.ts` | ALL data model types: AppState, Passage, Address, history, settings, action types — **plus the navigation types** (8.1.14): `RootStackParamList` (every `SCREEN` → its params), `PassageScreenParamsModel` / `ListScreenParamsModel`, `ScreenPropsModel<T>` (a screen's `{route, navigation}`) and `RootStackNavigationModel`, plus `LevelComponentModel` (8.2.6 — the four props every level component takes; it used to live inside `Level1.tsx`, so every other level imported its props type from an unrelated level). They live here, not in `navigator.tsx`, because the navigator imports every screen — a screen importing its props type from there would be a cycle |
| `initials.ts` | initial/default values for every state version. `createAppState010` is the live one — 8.2.32 turned `autoIncreaseLevel` on there and **only** there: `createAppState009` is the historical shape, and `stateVersionConvert` carries the field across, so an existing user keeps whatever they had |
| `constants.ts` | app-wide constants: `VERSION` (state model — **not** the app version; `APP_VERSION`, added in 8.2.32, reads the real one back out of `expoConfig`, which `app.config.js` takes from `package.json`, and is what the About screen shows) + `alowedStateVersions`, `API_VERSION` (re-exported from `bbh-shared`) + `API_LINK` endpoint enum, storage keys (`STORAGE_NAME`/`STORAGE_BACKUP_NAME` rolling daily/`STORAGE_PRECONVERT_BACKUP_NAME` write-once pre-migration snapshot/`STORAGE_LOGGER`, token names), training tuning (`PERFECT_TESTS_TO_PROCEED`, `STUDY_ONE_REPEATS`, `ERRORS_TO_DOWNGRADE`, `MAX_L50_TRIES`, sentence rules), enums (`SCREEN`, `SETTINGS`, `LANGCODE`, `THEMETYPE`, `SORTINGOPTION`, `STATSMETRICS`, `TESTLEVEL`, `PASSAGELEVEL`), vibration patterns, `ANIMATION` (the 0.3.0 motion vocabulary — fade duration, spring config, rise distance/scale, stagger delay, `pressScale`, `headerDropDistance` — 8.2.29: the Header falls from the top edge over *half* the content's travel, because rising with it read as scrambled; every reanimated surface pulls from it so the app springs the same way — plus the 8.2.28 gesture geometry `swipeThreshold` / `pullTrigger` / `pullMax`), `LAYOUT` (`maxContentWidth` — where the app's one column stops growing on a foldable or tablet, 8.2.4; `headerHeight`, moved here in 8.2.28 so `screenTransition.ts` can size a gesture band by the bar without importing `Header.tsx`, which would close the loop navigator → Header → AppContext → navigator. `Header.tsx` still exports `HEADER_HEIGHT`, now reading it from here), `STATE_PERSIST_DEBOUNCE` (8.2.20 — the coalescing window for the state persist), and the palettes `COLOR_DARK`/`COLOR_LIGHT` + `THEME_DARK`/`THEME_LIGHT` StyleSheets |
| `bibleReference.ts` | Bible structure data: 66 books as `{ titleShort, longTitle }` l10n WORD keys + `chapters` (verse count per chapter, `chaptersAlternative` where translations differ) |
| `navigator.tsx` | react-navigation stack typed with `RootStackParamList` from `models.ts` (8.1.14): all screens, `headerShown:false`, `freezeOnBlur` + `detachInactiveScreens` (render-lag fix 8.1.3), the four 8.2.28 destination presets (settings from the left, the list from the right, practice from the top, stats from the bottom) — each also `detachPreviousScreen: false`, which is what keeps home attached *and unfrozen* underneath so a pop has nothing left to render inside its own animation, and practice alone `gestureEnabled: false`, because its inverted-vertical dismissal would start in the answer block, `linking` config for `bbh://` / `bible-by-heart://` / `https://biblebyheart.app` deep links, the `ReactNavigation.RootParamList` global augmentation (so `useNavigation`/`useRoute` are typed app-wide), and the background-notification TaskManager task. Exports `navigationRef` (imperative navigation from outside the tree: share intent in `App.tsx`, notification taps in `AppContext`) |
| `storage.ts` | single `react-native-storage` instance over AsyncStorage (`defaultExpires: null`), default-exported; every persist/load goes through it |
| `context/AppContext.tsx` | global app context: single source of truth for `state`/`dispatch` + provides `t` (l10n) and `theme`; persists state + the rolling daily backup (`STORAGE_BACKUP_NAME`; the pre-migration snapshot is a separate write-once key owned by the boot path); wires notification-response handling. Since 8.2.20 the persist is **coalesced** — at most one write per `STATE_PERSIST_DEBOUNCE`, flushed on `AppState` background/inactive and on unmount — and it is also where a state that cannot be serialized is caught: `storage.save` stringifies synchronously, so it needs a `try` as well as a `.catch`. Exports `AppProvider`, `useAppContext`, and `AppContext` (for tests/narrow providers) |

### `src/screens/`

> All screen files are `PascalCase.tsx` since 8.1.15 (2026-08-26) — the rename was
> file-level only, every exported component name and every line of logic is unchanged.

| File | Description |
|---|---|
| `HomeScreen.tsx` | main screen: stroke/streak, week activity, entry to test/list/stats. Since 8.2.4 the button column is sized by its contents rather than `flex: 1` (which it carried twice over, so on a short phone the last button fell off the screen edge) and capped at `LAYOUT.maxContentWidth`; the logo block is the one that gives when the screen is short. 8.2.31 gave the column a rhythm: logo / week activity / buttons sit in one `space-between` column, and the mark is a share of the window height (`LOGO_HEIGHT_SHARE`, floored so it stays a logo on a short phone, capped by `LAYOUT.maxContentWidth` on a foldable) instead of a flat 255×160. It used to be centred inside a `flex: 1` box, which collected every pixel of slack into two equal voids. 8.2.28 wrapped the column in `HomeSwipe`: the same four destinations the buttons reach, reachable with the finger and from the edge each of them arrives from, and `startPractice` is now one function that the button and the pull both call (more than one train mode still asks which — a swipe may not pick for the user) |
| `ListScreen.tsx` | passage list: search, filter/sort entry points, swipe actions, editor entry. Since 8.2.2 the filter button navigates to `FiltersScreen`; the sort button opened an `AnchoredPopup` under itself until 8.2.37 replaced it with the app's ordinary `SelectModal` (titled, dimmed, centred — the anchored popup read as broken and had nothing visible to point at). Owns the add flow, a one-way sequence held in a single `AddFlowStep` (8.2.1d): a translation `SelectModal` → the address picker → `SCREEN.passage` with `{address, translationId}`. The translation step comes first because translations disagree on verse numbering, and it is skipped silently when `getTranslationChoice` says the answer is not already clear (8.2.1b). Backing out of the picker returns to the translation step when there is one. Rows swipe on `ReanimatedSwipeable` since 8.2.4 (RN-core `Animated` gone): the action panels are a module-level `SwipeActionPanel` driven by the swipe's own `progress`, each action closes the panel it was tapped in, and the row's `Pressable` sits *inside* the swipeable so a tap on a revealed panel no longer opens the editor. The search + list column stops at `LAYOUT.maxContentWidth`. 8.2.21 memoized the filter and the sorted `data` the FlatList reads, and hoisted `invertedTags` out of the per-passage callback that was rebuilding it P times |
| `FiltersScreen.tsx` | 8.2.2 — passage-list filters (selected level / max level / tags / translations). Was a MiniModal with a ScrollView inside `ListScreen`, i.e. a sub-menu in a dialog's clothes. Dispatches `toggleFilter`; the filters live in app state, so nothing is handed back to the list |
| `TestsScreen.tsx` | training session: picks the level component for the active test, owns the dot bar and the one way out. Since 8.2.5: the dot bar is `TestNavBar`, a **module-level** component (it used to be built inside the render body, so the whole header remounted on every answer); the level is looked up in a `Record<TESTLEVEL, FC<LevelComponentModel>>` instead of seven near-identical conditional blocks; the session body is wrapped in `Entrance` keyed on the test id, so moving to the next test arrives instead of blinking, and capped at `LAYOUT.maxContentWidth`; the hand-rolled exit dialog is a `ConfirmModal` |
| `FinishScreen.tsx` | end of a training session — since 8.2.5 a **shell** for the real session data 8.5.2 will add: bare `Header` (device top margin, no bar) over a scrolling body over a Continue button that stays put. The body's `flexGrow` + centring keeps the cup exactly where it was while there is nothing else in it; the old `flex: 4` hero over a `flex: 1` button could not have hosted a summary at all. Hero and button enter through `Entrance`, the button staggered behind the cup |
| `StatsScreen.tsx` | global + per-passage statistics |
| `CalendarScreen.tsx` | month/day activity calendar view. 8.2.27: the day view's container was `height: "100%"` while sitting *below* a `Header`, so its bottom hung off the screen by the header's height and the last tests of a day were unreachable — `flex: 1` now, and the `marginBottom: 100` that had been standing in for the missing room is `LAYOUT.scrollBottomGap` |
| `SettingsScreen.tsx` | settings hub: language/theme selects + rows that navigate to the sub-menu screens below (was: rendered each sub-list inline as a MiniModal). User row gated behind `isAutorized` |
| `PassageScreen.tsx` | add/edit a passage (former `ListScreen` editor modal; reads AppContext, draft committed on save). Since 8.2.1c it also closes the add journey: saving a **new** passage that has text offers a "study this one" drill (a `ConfirmModal`) → `generateStudyOneTests` + `SCREEN.test`; declining, or editing an existing passage, goes to the list as before |
| `ListSettingsScreen.tsx` | List settings sub-menu (left-swipe tag, translations link, passage import/export, **whole-state backup export + restore-from-file** — restore decodes first, then shows a `ConfirmModal` with the file's passage/test counts before the swap, 8.1.9). Was `settingsLists/listSettings` MiniModal |
| `TranslationsSettingsScreen.tsx` | Translations editable list (nested under List settings). Was a modal-in-modal via `SettingsListWrapper` |
| `TestsSettingsScreen.tsx` | Tests settings sub-menu (haptics, auto-increase level, train-modes link). Was `settingsLists/testsSettings` MiniModal |
| `TrainModesSettingsScreen.tsx` | Train-modes editable list (nested under Tests settings). Was a modal-in-modal via `SettingsListWrapper` |
| `NotificationsSettingsScreen.tsx` | Reminders settings sub-menu (enable, smart time, reminders link, dev test). Was `settingsLists/notificationsSettings` MiniModal |
| `RemindersSettingsScreen.tsx` | Reminders editable list (nested under Reminders settings). Was a modal-in-modal via `SettingsListWrapper` |
| `StatsSettingsScreen.tsx` | Stats settings sub-menu (weekly metric). Was `settingsLists/statsSettings` MiniModal |
| `AboutSettingsScreen.tsx` | About + legal + dev-mode sub-menu. Was `settingsLists/aboutSettings` MiniModal; the inner About/legal/dev-password dialogs stay MiniModals (8.2.2 verdict: they are dialogs), while the log viewer left for `LogSettingsScreen`. Its dev-mode state export/import rows delegate to `utils/backupFile` since 8.1.9 (same file format as the user-facing backup, no confirmation — dev only) |
| `UserSettingsScreen.tsx` | Account settings (email/profile/data visibility, delete account). Was `settingsLists/userSettings` MiniModal; delete-confirm stays a MiniModal — 8.2.2 kept it a dialog but dropped the `width/height: 100%` sizing that made it a screen in disguise, and swapped its back arrow for a close cross |
| `LogSettingsScreen.tsx` | 8.2.2 — dev-mode log viewer (list, export, clear), reached from About settings. Was a MiniModal styled to fill the screen. Its read effect now runs on mount only; the old one listed its own result among its dependencies and re-read forever |
| `LoginScreen.tsx` | email/password login vs API (P1: finish & verify e2e) |
| `RegisterScreen.tsx` | account registration vs API |

### `src/components/`

See the component library table in `CODING_RULES.md` §7 for descriptions:
`Text` `AddressPicker` `BackupFileOpener` `BackupOfferModal` `BackupRestoreModal` `Button`
`Checkbox` `ConfirmModal` `DotIndicator` `EmergencyScreen` `Entrance` `ErrorBoundary` `Header`
`HomeSwipe`
`Icon`+`iconData.ts` `Input` `LevelPicker` `MiniModal` `PassageEditor` `Select` `SelectModal`
`SettingsListWrapper` `SettingsMenuItem` `SettingsSubScreen` `TestNavDot` `WeekActivity`

`AnchoredPopup` was **deleted in 8.2.37** — its only caller, the passages-list sort
menu, became an ordinary `SelectModal`. The app has two surfaces again: screens and
dialogs.

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

One `theme={theme}` occurrence survives inside a `{/* ... */}` JSX comment block
(`PassageEditor.tsx` reminder toggle) — dead code that predates the migration, left
untouched to keep the diff honest. A grep for `theme={` will hit it; it is not a live
call site. The second one (`TestsScreen.tsx`'s commented-out dev-mode "Pass" button)
went with the 8.2.5 rewrite of that screen.

`Header.tsx` — **the** app header since 8.2.3, and the only caller of
`useSafeAreaInsets` in the codebase. Props are `title` / `onBack` / `backIcon` /
`right` / `children`; it springs in on mount, staggered behind the screen transition, falling from the
top edge over `ANIMATION.headerDropDistance` — half of what the content underneath
travels (8.2.29: rising with the content read as the two scrambling past each other).
Every screen and the one full-screen modal (`AddressPicker`) reaches it — directly, or
through `SettingsSubScreen`, `SettingsListWrapper` or `PassageEditor`. 8.2.3 deleted
three hand-rolled copies of it (`SettingsSubScreen`, `PassageEditor` with its own
`insets.top` and a magic `60`, `AddressPicker` with a fixed `paddingTop: 50`) and the
flat `paddingTop: 30` on `theme.screen` that every header screen was sitting on top of.
Rendered bare (`<Header />`, as home and the finish screen do) it is the device's top
margin and nothing else. Exports `HEADER_HEIGHT`.

`Button.tsx` — every button in the app, `IconButton` included. Since 8.2.4 it owns
the press spring; since 8.2.30 it owns it *only on flat buttons*: expo-linear-gradient
bakes its ramp at layout size, so scaling a gradient button stretches the ramp instead
of scaling it and the button visibly drops out mid-press. `hasGradient` (not
`transparent`, not `color="gray"`) decides, and the press handlers are simply not
attached on those, so "does this one animate" is answerable from the tree. 8.2.32 also
reordered `gradientColors` so `transparent` wins over `disabled` — a dead icon button
used to draw a `bg`→`bgSecond` plate under itself, which is the "shadow" on the
calendar's month arrows.

`Entrance.tsx` — 8.2.5, the app's shared arrival as a wrapper: fade on a timing +
rise on the `ANIMATION` spring, no scale. Two callers today (`TestsScreen`'s session
body keyed on the test id, `FinishScreen`'s hero and its staggered button), and the
place any future surface goes instead of hand-rolling a `useSharedValue` pair.
`Header.tsx` keeps its own copy on purpose — its animated view *is* the bar.

`HomeSwipe.tsx` — 8.2.28, home's four swipes. Wraps the home column in one
`Gesture.Pan` and reports which way the finger went (`onSwipe`), gated by which
directions currently lead anywhere (`available` — an empty library has nothing to
practise and nothing for stats to be about). The dominant axis decides, so a diagonal
drag resolves to one destination instead of two or none; the thresholds are
`ANIMATION.swipeThreshold` and, for the pull, the longer `ANIMATION.pullTrigger`,
because that gesture *starts a training session* rather than opening a screen. Pulling
down draws a pull-to-reload chevron that follows the finger at half speed and flips at
the distance that will fire it. The gesture carries a `withTestId`
(`HOME_SWIPE_TEST_ID`) because a gesture is not a node in the tree and
`getByGestureTestId` is how a test reaches one. Deliberately not memoized: `onSwipe`
closes over the caller's current state, so a cached gesture would keep answering with
the previous render's.

`SettingsSubScreen.tsx` — shared shell (View + Header with back + StatusBar) for
every settings sub-menu screen, and since 8.2.2 for the two non-settings screens the
modal purge produced (`FiltersScreen`, `LogSettingsScreen`): anything reached by
drilling in gets this shell rather than a hand-rolled header. `SettingsListWrapper.tsx` — reusable editable-list
body (translations/reminders/train-modes), now non-modal: list and per-item editor
are two views toggled by local state (was a MiniModal-in-MiniModal). The old
`settingsLists/` sub-list components were converted into the settings sub-screens
in `src/screens/` and removed.

| Subdir | Description |
|---|---|
| `levels/L10.tsx` `L11.tsx` `L20.tsx` `L21.tsx` `L30.tsx` `L40.tsx` `L50.tsx` | one file per test level, each named after its only export (8.2.6 split `Level1.tsx`/`Level2.tsx`, which held two components each). They render one test type each (options / address / word blocks / typing…) and read the passage's text only through `Passage`. Since 8.2.5 none of them answers a test from its render body: a test whose passage was deleted renders an empty `View` and lets `TestsScreen` leave the session (`L30` used to submit it as *correct*, mid-render; `L10` used to crash on it, fixed 8.2.6), and `L30`'s safety valve for a test with no missing words fires from an effect keyed on the passage **id**. Their shared props type `LevelComponentModel` lives in `models.ts` |
| `levels/levelLayout.ts` | 8.2.35 — the one arrangement all seven level components fill: **prompt** (content-sized, never `flex: 1`, scrolls when the passage is long), **answer** (takes everything the prompt left), **action** (bottom of the screen, stretched to the column). A stylesheet and not a wrapper on purpose — the 8.2.6 split made the level files small enough to each hold their own arrangement, and a wrapper would have to take the three blocks as props to do the same job. Also the one place the column's side gutter is written, which is what the L3 chips were missing |
| `levels/SentenceContext.tsx` | 8.2.6 — the sentences either side of the range being typed (L40, L50), over `Passage.getContextBefore`/`getContextAfter`. `side="before"\|"after"` decides which end wears the "..."; renders nothing when the test has no range |
| `levels/NoOptions.tsx` | 8.2.38 — what a level renders when its generator handed it no options: one line of `TestNoOptionsText` where the answers would be. Used by `L10` and `L11`. Deliberately has no skip button — what a skipped test does to the level-up maths is 8.2.36's decision |

### `src/services/`

| File | Description |
|---|---|
| `fetch.ts` | API client: auth endpoints, token refresh (expired-access→refresh via `isTokenExpired`), APIversion check, error handling. Its `logoutMethods` takes **no `state`** since 8.2.24 — the call is awaited, so any snapshot handed in is stale by the time the forced logout runs, and writing it back rolled the whole app one step backwards (this is what made a language change undo itself). It resets through a functional `setState` updater instead |
| `fetchESV.ts` | fetch passage text from the ESV API (token from `expoConfig.extra.ESVTOKEN`; no token → empty string, so the app still works offline/unconfigured). The template for the pluggable text-source interface in STRATEGY §6.3 |

### `src/l10n/`

| File | Description |
|---|---|
| `index.ts` | `createT(langCode)` → `t(word)` lookup (falls back to the key itself); exports the `WORD` union = `keyof typeof en`, so a key missing from `en.ts` is a type error |
| `en.ts` / `ua.ts` | English / Ukrainian UI strings, flat key→string maps (always update both; ~470 keys each) |

### `src/utils/`

| File | Description |
|---|---|
| `reduce.ts` | THE reducer: every state change (passages, tests, history, settings, user); finalization block also self-heals a dangling `settings.leftSwipeTag` and the dev-mode expiry. 8.2.20 took the `JSON.parse(JSON.stringify(state))` off the end of **every** action — the untouched parts of the state now come back by identity, and the serialization guard it was doing lives on the `AppContext` persist path, which stringifies the same object anyway. That made the finalization block copy-on-write: most branches share `settings` with the previous state, so the heals had been writing into already-rendered state, and the O(passages) tag scan now runs only when passages or settings actually moved |
| `stateVersionConvert.ts` | chained migrations between state model versions — `versionsConvertionTable` + recursive `convertState` (`__tests__/utils/stateVersionConvert.test.ts` locks the current-era 0.0.8→0.1.0 chain) |
| `backupFile.ts` | the user-owned half of the safety net (8.1.9) — the only copy that survives an uninstall. Pure part: `serializeBackup` (state → `{app, exportedAt, stateVersion, state}` envelope), `parseBackup` (envelope **or** a bare state object → runnable state, version-tolerant via `restoreStateFromBackup`), `createBackupFileName`, `readStateVersion`. IO part shared by all three call sites (post-upgrade offer, List-settings rows, dev rows): `exportBackupFile` / `importBackupFile` — both total, they toast and resolve instead of throwing. 8.2.34 made a backup the app's **own kind of file**: `BACKUP_FILE_EXTENSION` (`bbhbackup`) + `BACKUP_FILE_MIME` (`application/vnd.biblebyheart.backup+json`), declared in `app.config.js` so Android offers the app when one is opened; `BACKUP_LEGACY_MIMES` keeps every pre-8.2.34 `.json` backup pickable forever. `parseBackupEnvelope` is `parseBackup` plus the file's date (`parseBackup` is now a thin wrapper), and `readBackupFromUri` is the opened-file path |
| `bootBackup.ts` | the boot path's safety net (8.1.8 + 8.1.9a): `loadStoredState(key?)` → `{status:"found"\|"empty"\|"failed"}` — the read classifier that stops a failed read from being mistaken for a fresh install (with `isKeyMissingError`, which keys on the `NotFoundError` *name*); `savePreConvertSnapshot` (write-once into `STORAGE_PRECONVERT_BACKUP_NAME`, never overwrites), `restoreStateFromBackup` (accepts an OLDER snapshot and converts it forward), `loadRestorableBackup(key)`. All total — they log and resolve instead of throwing, because every caller is on the cold-start path |
| `getStats.ts` | all stats calculation: `getStroke` / `getMaxStroke` (current + longest day streak), `getWeeklyStats` (home week bars), `getPassageStats`, `getAppStats` (stats + calendar screens), `getTimeBoundStats`. Callers memoize these — they walk the whole history. 8.2.21 made the two stroke functions linear: a shared `testDayKey` + a `Set` for unique days instead of `arr.slice(0, i).includes(v)` per record, and the current stroke is counted as the leading run rather than built as a whole boolean array and trimmed |
| `getPerfectTests.ts` | `getPerfectTestsNumber(history, passage)` — length of the newest unbroken run of error-free tests at/above the passage's `maxLevel`; compared against `PERFECT_TESTS_TO_PROCEED` to level a passage up. 8.2.21 added `getPerfectTestsNumbers(history, passages)`, the same answer for every passage from one pass that buckets the history by `pi` — what `finishTesting` calls, because the single-passage form filtered *and* sorted the whole history once per passage |
| `getSimularity.ts` | string similarity (answer checking) |
| `levelsConvertion.ts` | passageLevel ↔ testLevel conversion |
| `address.ts` | 8.2.6 — **everything an address can do**, as one namespace over plain `AddressType` data: `Address.format` (address → human string), `.parse` (finds the reference ANYWHERE in a text — title + chapter:verse, word-boundary-guarded — picks the most specific book, matches per-book aliases from `bookAliases.ts`), `.equals` (open end = starts where it ends, spelled either `null` — persisted, JSON has no NaN — or `NaN` — what `AddressPicker` hands around, folded together since 8.2.20 removed the reducer clone that used to normalize one into the other; **pure**, the old `getAddressDifference` assigned to its arguments and so edited passages inside app state), `.distance`, `.order`, `.versesCount`. Replaces `addressToString` / `addressFromString` / `addressDistance` / `addressDifference` / `addressOrder` / `getNumberOfVerses`, all deleted |
| `passage.ts` | 8.2.6 — everything the app knows about a passage's **text**: `Passage.getSentences` (one definition, punctuation kept, so the pieces `joinSentences` back into readable text), `.getRangeText` / `.getRangeDisplayText` (what a stored `sentenceRange` means, to recall and to read), `.getContextBefore` / `.getContextAfter`, `.getWords` (whitespace collapsed, so a stored word index means the same word to the generator and to the renderer), `.sameWord` (8.2.26 — two words are the same when their letters and digits are, so L3's bank accepts "good." for "good"; equality, not similarity), `.getFirstWords`, `.getVersesCount`, `.countEnglishVerses` (was `getNumberOfEnglishVerses`), and the 8.2.7 typing tolerance — `.foldTypeable` (untypeable characters mapped to the ones a keyboard has, strictly 1:1 so an index survives the fold), `.typedEquals` (whether what was typed IS the passage: folded, case-blind, punctuation and whitespace runs ignored) and `.typedPrefixLength` (how much of the target was typed right from the start, which is what level 5 trims a failed attempt back to). The nine inline `split(SENTENCE_SEPARATOR)` copies — four different filters, three different joins — all come here now |
| `bookAliases.ts` | Per-language abbreviation / spelling-variant lists per book (keyed by long-title WORD), consumed by `Address.parse` in addition to the localized titles |
| `sanitizeSharedText.ts` | Pure cleaner for share-sheet text: normalizes untypable chars (dashes, curly quotes, nbsp, ellipsis), strips URLs + wrapping quotes + dangling separators. 8.2.33 added the two shapes other Bible apps stamp on a share: bracketed verse numbers (`[1]`, `[3:16]` — **digits only**, because `[words]` is real editorial apparatus in the bundled translations) and a leading translation code, which is only stripped when it stands apart from the verse (`ESV [1] …`, `ESV: …`, `ESV` alone on the first line) — "LORD is my shepherd" must survive. Used by `ListScreen.handleTextFromIntent` |
| `getTranslationChoice.ts` | 8.2.1b — `getTranslationChoice(translations)` → `{needsChoice, translationId}`: whether the add-passage flow must ask for a translation (only with more than one) and which one it uses/preselects (the default, else the first). Used by `ListScreen` to decide which step the add flow opens on (8.2.1d) |
| `feedback.ts` | 8.2.8 — the one place that decides whether the phone may buzz. `feedback(settings, patternName)` checks `hapticsEnabled` itself; eleven call sites across five level screens used to write the guard by hand and two (the list row's long press, the address picker's verse long press) had simply forgotten it. Sound is not wired yet — `soundsEnabled` will be read here and nowhere else |
| `fileManager.ts` | `writeFile`/`readFile` — import/export files via the document picker — plus `readFileAtUri` (8.2.34), which reads a file the app was HANDED by an Android VIEW intent rather than one the user picked. `readFile` no longer refuses a file whose provider reports no MIME type: a `.bbhbackup` often has none, and the content decides |
| `handlePassageExport.ts` | passage export/import serialization (`passagesToLSV`/`arrayToLSV`/`LSVToArray`/`arrayToPassages`) + dedupe |
| `notifications.ts` | reminders: `schedulePushNotification`, `getAutoTimeTrigger` (smart time), `checkSchedule` (re-plan on state change), `registerForPushNotificationsAsync` (permissions + localized Android channel) |
| `formatDateTime.ts` (`timeStringFromMS`/`dateToString`/`timeToString`) / `secondsToString.ts` / `addZero.ts` | formatting helpers |
| `randomizers.ts` | `randomRange`/`randomItem`/`randomListRange` — used by test generation |
| `getThemeFromScheme.ts` | `getThemeFromScheme(themeType, colorScheme)` → `{ theme, colors }` (dark/light, `auto` resolved from the passed OS scheme — never calls `useColorScheme` itself, see §3 polyfill history); exports `ThemeAndColorsModel` |
| `toastShow.ts` | toast notifications |
| `screenTransition.ts` | 8.2.3 — the app's screen transitions, given **a direction per destination** in 8.2.28. `candyTransitions` is the four edges (`right` / `left` / `top` / `bottom`): each carries the `gestureDirection` that decides both which edge the card comes from and which way the dismissing swipe runs, plus the interpolator for its axis (`forCandyCard` / `forCandyCardVertical` — one factory, differing only in `translateX` vs `translateY`). A capped travel, a parallax shove on the card underneath, an early fade and a 12% overlay dim, all riding one `ANIMATION.spring` clamped against overshoot. `inverted` — the multiplier the stack derives from the direction name — is what turns "from the right" into "from the left" without a second interpolator, and what mirrors the whole thing in RTL. The vertical pair narrows `gestureResponseDistance` to `LAYOUT.headerHeight`: at the library's 135px default the dismissing drag reaches into the stats list, so a scroll near the top would pop the screen. `candyTransition` (= the `right` preset) stays the navigator-wide default. Replaces `@react-navigation/stack`'s `Platform.Version`-picked preset, which made the same app slide on one Android and zoom on another |
| `logger.ts` | app logger — `logger.write`/`.error`/`.readAll`/`.clearAll`; appends to a `STORAGE_LOGGER` array capped at `LOGGER_MAX_ARRAY_SIZE`, read by the dev-mode log viewer |
| `isTokenExpired.ts` | JWT payload decode + expiry check (used by `services/fetch.ts` auth/refresh) |
| `generateTests/index.ts` | `getLastTestedByPassage` (8.2.21 — one pass over the history for every passage's last test time; reading it used to mean filtering and sorting the whole history once per passage, which was the delay before a session started) + `getPassagesByTrainMode` (which passages are due) + `generateTests`/`generateATest` — orchestrates per-passage test generation by level. Also `generateStudyOneTests(state, passageId, repeats?)` (8.2.1c): the "study this one" drill — one passage repeated `STUDY_ONE_REPEATS` times at its own selected level, in one session, reading no train mode at all. And `canOfferPassageOptions` (8.2.36) — the rule for every level that asks the user to PICK a passage: l11/l21 draw their decoys from the library, so below `MIN_TEST_OPTIONS` in the target's own translation each falls back to the address half of its own level (l10/l20), which needs no library. The two magic `passages.length < 4` in `generateATest` were that rule, written twice and counting the wrong pool |
| `generateTests/createL10Test.ts` … `createL50Test.ts` | one generator per test level (10, 11, 20/21 in `createL2XTest`, 30, 40; `createL50Test` = `createL40Test` today). `createL10Test.ts` also owns the shared `CreateTestInputModel` / `CreateTestMethodModel` types |
| `generateTests/getErrorGradedSentences.ts` | pick hardest sentences from error history |
| `generateTests/getWordsFromErrors.ts` | pick hardest words from error history |

### `src/svg/`

`daggetLogo.tsx` (app logo), `finishCup.tsx` (finish screen trophy), `manger.tsx` (seasonal Christmas icon)

### `__tests__/`

| Area | Files |
|---|---|
| smoke | `App.test.tsx` |
| components | AddressPicker, AnchoredPopup, Button, Checkbox, ConfirmModal, Entrance, ErrorBoundary, Header, HomeSwipe, Icon, Input, MiniModal, Select, SettingsMenuItem, Text (+snapshots) — 8.1.15a renamed the eight camelCase leftovers and their `.snap` files so every test matches its subject's casing (CODING_RULES §2). `Header.test.tsx` is behavioural, not a snapshot: 8.2.3 found the old one wrapped the Header in a bare `SafeAreaProvider`, which renders nothing until it knows the insets — so it had been snapshotting an empty tree and asserting nothing at all. It now pins the device inset, the bare-Header margin, the back/right/children contract and the one-line title. `Button.test.tsx` gained the 8.2.4 press worklet: its resting frame through a real worklet (the toolchain canary, but for the one component every button in the app is) and a guard that the animated wrapper did not cost the press itself. `Entrance.test.tsx` (8.2.5) is the same canary for the shared arrival wrapper — its first frame through a real worklet, the caller's layout style surviving the merge, and exactly one animated view however many children it wraps. 8.2.29 turned `Header.test.tsx`'s entrance into an assertion: the frame it starts from is *above* its seat and shorter than `riseDistance`. 8.2.30/8.2.32 added two to `Button.test.tsx`: a gradient button carries no press handlers at all while a flat one carries exactly one, and a disabled transparent button stays transparent. `TestNavDot.test.tsx` (8.2.35) pins the session dot as one centred 18px circle in both states — the Pressable used to have no size of its own, so the gradient sized to its 13px child and the CURRENT dot, which has none, to nothing. `Input.test.tsx` pins `grow`: flat by default, `flex: 1` on both outer views when asked. `AddressPicker.test.tsx` pins the 8.2.32 `confirmTitle` — the level screens open the same picker to *answer* a test, where "Add" is a lie — and that case is deliberately the **last** `it` in the file, because the two snapshots above it carry react-test-renderer `nativeID` counters that renumber when anything is inserted ahead of them. `HomeSwipe.test.tsx` (8.2.28) drives real gestures through `react-native-gesture-handler/jest-utils` (`fireGestureHandler` + `getByGestureTestId`): each direction reaching its destination, a twitch reaching none, the pull asking more than the other three, a diagonal resolving to one axis, and a direction that leads nowhere firing nothing. Every drag is **awaited** — the handler is a worklet and `runOnJS` hands the call back to the JS thread, so a synchronous assertion right after the release always sees zero calls |
| context | `context/AppContext.test.tsx` (8.2.20) — the coalesced persist: nothing written until the window closes, several actions in one window collapsing to one write carrying the *last* state, and the pending state flushed on `AppState` background and on unmount. Mocks `src/storage` and `src/navigator` (importing the real navigator would pull every screen into the suite) |
| levels | `levelLayout.test.tsx` (8.2.35) — the shared arrangement, held structurally: every level's root is `levelLayout.screen`, every level has the block that grows, the prompt takes no fixed share of the screen, and the chips share the action block's left edge. `L10`–`L50` (+snapshots), one suite per level file since 8.2.6, all rendering the shared `fixtures/levelPassages.ts` passage. `L30.test.tsx` also carries the 8.2.5 render-purity guards: a deleted passage is never answered, an unplayable test (no missing words) is passed exactly **once** across re-renders — which is the observable difference between an effect and a render body — and a playable one is left alone. `L10.test.tsx` pins the 8.2.6 guard: a test whose passage is gone renders instead of reading `.verseText` off `undefined`, and the 8.2.38 one: a level handed no options says so (`NoOptions`) instead of drawing half a screen. `L30.test.tsx` also carries the test level 3 never had (8.2.26): across 75 generated tests over three passage shapes, every missing word renders `color: "transparent"` and every readable word is one that was not taken out — plus the two paths that reveal words on purpose (the answer has moved on to the address; a finished test being reviewed) |
| utils | address (parse + versesCount + the purity of `equals`), generateATest (8.2.36 — at library sizes 1, 2 and 3 no level ever asks the user to pick a verse out of a list that holds only the answer, and the address half of the same level is always there to ask instead), passage (sentences/ranges/context/words, 8.2.6), backupFile, bootBackup, createL11Tests, generateStudyOneTests, getStats, getTranslationChoice, handlePassageExport, isTokenExpired, notifications, reduce, sanitizeSharedText (8.2.33 added the verse-number and translation-code shapes, including the ones that must NOT be stripped), screenTransition (8.2.28 — each edge's gesture direction, which axis its card moves on, that it starts outside the edge it is named after and lands at 0, the travel cap, and the narrowed vertical gesture band), stateVersionConvert. `passage.test.ts` carries the 8.2.7 table as **one test per pair** — every dash, quote, apostrophe, space and Cyrillic/Latin homoglyph asserted in both directions, plus the ellipsis, the decomposed letter, and the guards that a misspelling is still wrong and that two different Ukrainian letters are never folded onto each other. `createL11Tests.test.ts` also carries 8.2.38: a four-passage library with one passage on another translation yields a test whose `l` matches the `d` it was given, from both ends. `historyScans.test.ts` (8.2.21) is the odd one out — a scenario suite, not a subject: it keeps the four scans 8.2.21 replaced as an oracle and asserts the shipped ones agree with them on a deterministic 5 000-record history, the size at which `getStroke` cost 42 ms on a desktop. `reduce.test.ts` also pins 8.2.20: untouched state comes back by identity, and a passage-only action does not write into the previous state's `settings` |
| screens | `screens/HomeScreen.test.tsx` — the 8.2.31 column (the mark growing with the screen, floored, capped, and the slack spent as spacing rather than as voids) and the 8.2.28 swipes (each direction reaching its screen, the pull starting a session exactly as the button does, and an empty library offering only the two directions that lead somewhere). `screens/FiltersScreen.test.tsx` — the filters screen (8.2.2): every section the modal had, the empty-tags case, level/tag toggles landing in the right filter, and leaving by `goBack` instead of a dismiss. `screens/ListScreen.test.tsx` — the toolbar after the purge (8.2.2: the filter button navigates instead of opening anything, the sort popup opens and closes on pick) and the add-passage flow (8.2.1d) driven through the real address picker: the translation is asked for before any verse number is on screen, skipped when there is only one, dismissing it goes nowhere, and the picker's back lands on the translation step (or closes the flow when that step was skipped), plus the row interactions (8.2.4) over a real stateful context: what each swipe action says and writes, archiving dropping the row out of the default view, the delete confirm still standing between a swipe and a lost passage, and a tap on the row still reaching the editor. jest cannot perform the drag itself — but ReanimatedSwipeable keeps both panels in the tree behind an opacity of 0, so their labels and handlers are reachable. `screens/PassageScreen.test.tsx` — the study-one offer (8.2.1c) driven through the real editor's Save: offered on a new passage with text, generates a one-passage session and opens training, declined goes to the list, never offered on an edit or on an empty passage. `screens/TestsScreen.test.tsx` (8.2.5) — the training session over a real stateful context, driven through L10 because its right answer is one button press: which test opens (the first *unfinished* one), the dot bar moving between them and refusing a dot the user has not reached, answering advancing to the next test, the last answer committing to history and opening the finish screen, and the cross → confirm → session thrown away / kept. It mocks only `useIsFocused` out of `@react-navigation/native` (`requireActual` for the rest — AppContext pulls in the navigator). `screens/FinishScreen.test.tsx` (8.2.5) — the shell: the congratulation and its way out, the bare `Header` (asserted bare by having no props at all), and the scrolling body 8.5.2 will fill |
| services | `services/fetchLogout.test.ts` (8.2.24) — the forced logout `fetchAPI` runs when both tokens are expired: it must write through an updater rather than a captured snapshot, and a language picked while the request was in flight must survive it. Mocks `expo-secure-store` |
| e2e | `e2e/flow.test.tsx` — the release guard (8.1.16a): one test drives create state → add passage → `generateTests` → answer with errors → finish → assert stats, through the reducer + generators only (no rendering), plus an explicit assertion that no error count is exposed |
| fixtures | `fixtures/levelPassages.ts` — the passage every level suite renders (`makeLevelPassage` / `makeLevelState` / `makeStateWith`), 8.2.6: it used to be copied into all five level tests, four times over in the level 1 one. `fixtures/state006.ts`, `fixtures/state007.ts` — realistic legacy states (passages, history, settings) for the 8.1.10 converter hops. **Not test suites**: `package.json`'s jest `testPathIgnorePatterns` excludes `__tests__/fixtures/`, otherwise jest's default `testMatch` picks them up and fails them as suites with no tests |

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
