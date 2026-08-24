# STRATEGY — the master plan (the *why*)

> **The working queue moved.** Since 2026-07-22 the ordered, checkbox-per-session list
> lives in **`docs/PLAN.md`** — that is the only file where work is marked done. This
> file keeps the reasoning behind it: the bug register (§2), the risk watchlist (§3),
> the refactor list (§4), the testing goals (§5), the feature order (§6) and the
> milestone table (§7). A step in `PLAN.md` points back here when it needs the why.
> Order of the epochs: **workflow → bugs → safety → refactors → testing → features.**
> Bugs before features — confirmed.

Legend: **P0** critical · **P1** high · **P2** medium · **P3** later ·
`[D]` from projectdiary · `[C]` found in code scan (2026-07-07) · `[F]` from Fedir directly.

---

## 0. How work happens (session protocol)

1. Session starts → AI reads `CLAUDE.md` → `ARCHITECTURE.md`, `CODING_RULES.md`,
   `FILEMAP.md`, `PLAN.md`, and whichever section here the current step points at.
2. One task per session, sized to fit comfortably under ~100k context. If a task is
   genuinely better done whole (e.g. a state-model migration), it is tagged
   **(one-sitting)**. The task itself comes from **`docs/PLAN.md`** — take the first
   unchecked step unless Fedir says otherwise.
3. Win conditions for every task: lint ✓ tests ✓ FILEMAP updated ✓ robotdiary entry ✓
   both l10n files ✓ (details in `CODING_RULES.md` §6).
4. Broken-in-between is allowed across a refactor's tasks; note it in robotdiary.
5. Fedir tests manually on a real phone + deployed staging build at **version
   milestones** (§7), not per task.

---

## 1. AI workflow setup

- [x] `docs/ARCHITECTURE.md` — vision & philosophy
- [x] `docs/CODING_RULES.md` — rules + component library
- [x] `docs/FILEMAP.md` — both repos mapped
- [x] `docs/STRATEGY.md` — this file
- [x] `docs/robotdiary.md` — AI session log
- [x] `CLAUDE.md` in both repos pointing here
- [x] **Verify CI/CD still works after the year pause:** trigger an EAS staging build
  (`build-dev`) and a bbh-api staging deploy; fix what broke. *(Do this before the
  first milestone — everything downstream depends on it.)*
- [x] Refine `FILEMAP.md` `(?)` descriptions as files get touched (ongoing, free).
  *(2026-07-22: full accuracy pass — every remaining `(?)` resolved by reading the source
  (`src/constants.ts`, `utils/getPerfectTests.ts`, bbh-api `README.md`), two dead rows
  removed (`screeenManagement.ts`, `utils/useApp.ts` — deleted in the fc3bc11 navigator
  refactor), stale rows rewritten (`navigator.tsx`, `storage.ts`, `bibleReference.ts`,
  `getStats.ts`, `logger.ts`, `notifications.ts`, `l10n/index.ts`, `fetchESV.ts`,
  `generateTests/*`), the duplicate `app.config.js` row merged (now also records
  target/compile SDK 36), and `test-utils/renderWithContext.tsx` added to the root table.
  FILEMAP now states explicitly that no `(?)` remain. The maintenance rule stays — keep
  updating lines as files are touched.)*

## 2. Bugs

### P0

- [x] **~0.5s lag on EVERY screen render** `[F, on-device 2026-07-11]` — reproduces on
  both the dev APK and the published Play Store build, and not only on weak phones but
  on a Pixel 9 Pro. Present in the pre-refactor store build → systemic, predates the
  navigator refactor. MAJOR. Suspects to profile (don't guess-fix): unmemoized
  `AppContext` value re-rendering the whole tree on every dispatch; `getTheme`/`createT`
  recreated per render; per-render StyleSheet creation; synchronous AsyncStorage writes;
  screen re-mounts on navigate. Diagnose first, then fix — sessions 8.1.1–8.1.3.
- [x] **Level 11 wrong translation** `[D]` — level 11 test shows answer options in a
  different translation/language than the passage. Open since 2023-11-25.
  Code: `src/utils/generateTests/createL11Tests.ts`. Filter option-source passages
  by the target passage's translation. *(2026-07-10: filter was already present;
  confirmed + regression test added `createL11Tests.test.ts`; comparator fixed too.)*

### P1 — concrete code bugs (from 2026-07-07 source scan, verified by reading)

- [x] **Error counter never increments** `[C]` — `src/utils/reduce.ts:340`:
  `test.en || 0 + 1` parses as `test.en || 1`; must be `(test.en || 0) + 1`.
  Silently corrupts error stats — the very data the philosophy depends on.
  *(2026-07-10 fixed.)*
- [x] **`endVerseNum` gets a chapter number** `[C]` — `src/utils/addressFromString.ts:107`:
  when no end verse, `chapterEnd` is assigned to the verse field. Corrupts parsed
  addresses (matters for import + intent). *(2026-07-10 fixed → explicit null + test.)*
- [x] **L11 wrong-answer sort comparator broken** `[C]` —
  `createL11Tests.ts:47-61`: comparator computes bias from `b` only → not a valid
  sort; "closest passages" aren't actually closest. Fix together with the P0 above.
  *(2026-07-10 fixed → extracted `proximity(p)` scorer.)*
- [x] **Case-mismatch in book detection** `[C]` — `addressFromString.ts:36-39`:
  mixed lower/original-case matching mis-slices input like `GENESIS 1:1`.
  *(2026-07-10 fixed + upper-case test.)*
- [x] **Finish + verify login end-to-end** `[D]` — register done; login started
  Jul/Aug 2025, never verified against the (new) VPS API. `loginScreen.tsx`,
  `services/fetch.ts`. Verify against the freshly installed VPS.
  *(2026-07-10: fixed two token-refresh bugs in `fetch.ts` — inverted refresh/logout
  branches, and the refreshed access token never being applied to the outgoing
  request. Extracted `isTokenExpired` util (+tests). Verified the login/refresh/version
  client↔server contract by reading bbh-api source: fields + status codes all match,
  API_VERSION 0.0.1 == server package version. )*

### P1 — behavior bugs / unfinished safety

- [x] **Finish screen always skipped** `[F, on-device 2026-07-11]` — after the last
  test the results/finish screen flashed and Home landed on top of it (reachable only
  by pressing back). Regression from the state refactor: `finishTesting` empties the
  now-global `state.testsActive`, so the still-mounted `testsScreen` re-rendered into
  its "no active tests → go home" guard and called `exitTests()` **during render**,
  overriding the just-issued `navigate(testResults)`.
  *(2026-07-11: moved that redirect out of render into a `useIsFocused`-gated effect —
  it no-ops while results/finish is focused, still redirects home when you press back
  onto an emptied session. Both render-time `exitTests()` guards are now pure
  render-safety returns. lint+tests green; needs device confirmation.)*
- [x] Confirmation dialogs before all destructive actions (delete passage, delete
  account/data, end session) — partially done, finish the rest `[D]`.
  *(2026-07-10: account-delete + end-session already confirmed; added a reusable
  `ConfirmModal` and gated passage deletion (editor button + list swipe) behind it.)*
- [x] Only allow deleting a passage when archived; hide delete otherwise `[D]`.
  *(2026-07-10: verified already enforced — editor Remove button and swipe-delete both
  only appear when the passage carries the ARCHIVED tag.)*
- [x] Two legacy `console.error` → logger (`addZero.ts:10`, `aboutSettings.tsx:61`) `[C]`.
  *(2026-07-10 fixed; also hardened `addZero` to not throw on 3-digit input.)*

### P2

- [x] Share/intent receiver — **minimal** scope `[F]`: receive shared text → parse
  address/text (`addressFromString`) → confirm modal → add passage. No language
  detection magic.
  *(2026-07-10: ROOT CAUSE found — the share intent filter was fine (app opened from
  the share sheet) but nothing read `Intent.EXTRA_TEXT`; `Linking` only surfaces
  VIEW/URL intents, never SEND. Added `expo-share-intent@^5.1.1` (native reader for
  SEND/text) + its config plugin (Android only, `disableIOS`). `App.tsx` now reads the
  shared text via `useShareIntent`, toasts+logs it (test instrumentation), and routes
  it into the existing add-passage flow (`navigationRef.navigate(listPassage,
  {passageText})` → `listScreen.handleTextFromIntent`). **Needs Fedir's device build to
  confirm text actually arrives** — can't be verified in-session. Once confirmed:
  replace the debug toast with the proper confirm-modal, and clean up the now-redundant
  manual SEND filter in `app.config.js` + the dead `plugins/handlingIntents.js`.)*
- [x] Passage list rendering bug + performance `[D]` (`projectdiary.md:113,158`).
  *(2026-07-10: virtualized the passage list — `ScrollView`+`.map()` (mounted every
  passage) → `FlatList`; search bar moved out of the scroll area (now sticky, which
  also dodges the header-refocus bug of putting a `TextInput` in `ListHeaderComponent`);
  memoized `allTags`. Hidden-count moved to `ListFooterComponent`. Deeper row
  memoization awaits the theme/l10n context refactor (§4.3) which makes `t`/`theme`
  stable.)*
- [x] Notification channel name "Reminders" not localized (`notifications.ts:301`) `[C]`.
  *(2026-07-10: added `notificationChannelName` l10n key (en/ua); channel `name` now
  localized via `createT(langCode)`; channelId stays "Reminders". Caller in `useApp.ts`
  passes `state.settings.langCode`.)*
- [x] Reminders shown under "Miscellaneous", not the localized "Reminders" channel
  `[F, on-device 2026-07-11]`.
  *(2026-07-11: the manual-reminder trigger had no `channelId`; added `channelId:
  "Reminders"`. Android caches a channel's display name at creation, so the localized
  name only refreshes on fresh install / cleared data — expected, not a bug.)*
- [x] Login should accept email OR username `[F, on-device 2026-07-11]` — requiring email
  only was "not handy".
  *(2026-07-11: client login field accepts either (email-regex OR username-regex); API
  `authorizeUserHandler` matches `WHERE email = ? OR userName = ?`.)*
- [x] **Confirmation email not sending (bbh-api)** `[F, on-device 2026-07-11]` — Gmail SMTP
  rejects the server creds (`535-5.7.8 Username and Password not accepted`, seen in VPS logs).
  Fix is env-only (secrets not in git): put a valid Gmail **App Password** in `MAIL_PASS`
  (+ correct `MAIL_LOGIN`) in `.production.env` / `.staging.env` on the VPS, then restart.
  *(2026-07-11: rotated `MAIL_PASS` to a fresh Gmail App Password in both env files —
  locally AND on the VPS (owner/mode preserved: deploy:deploy 600) — then restarted both
  containers. `MAIL_LOGIN` was already correct. Verified LIVE from inside the production
  container: `transporter.verify()` → auth accepted, and a real test email was sent +
  accepted for fedir.moroz.dev@gmail.com. GitHub Actions secrets need NO change — only
  `VPS_HOST`/`SSH_DEPLOY_KEY` live there; mail creds are VPS-only, gitignored, and survive
  `git reset --hard`. Also added the suggested boot check: `verifyMailer()` in `email.ts`
  (non-throwing SMTP `verify()`, logs info/warn) called once from `app.ts` startup, +2 unit
  tests. This code hardening is committed but NOT yet deployed — deploy at next bbh-api push.)*

## 3. Risks & potential problems (watchlist)

Not scheduled work — check the relevant item whenever touching its area.

- **State converter chain is high-blast-radius** — every model bump needs a converter;
  a wrong converter destroys years of user stats. Mitigation is §5 backup-prompt task.
  *(2026-07-11: added the first regression coverage — `stateVersionConvert.test.ts` locks
  the current-era chain 0.0.8→0.0.9→0.1.0 (the recursive engine + `to009`/`to010`):
  version progression, passages preserved, only-finished history kept, settings carried,
  auth stripped, unknown version → null. Legacy 0.0.6/0.0.7 hops still uncovered.
  While reading the boot path found two real safety-net bugs to fix (own session, needs
  a device build): (a) the pre-conversion snapshot and the daily backup share ONE key
  `STORAGE_BACKUP_NAME`, so a bad converter's output overwrites the last-known-good raw
  state within 24h — give the pre-convert snapshot its own never-overwritten key; (b) the
  emergency "Restore from backup" (`App.tsx`) hard-rejects any snapshot whose
  `version !== VERSION` — i.e. it refuses the pre-conversion snapshot it just saved, which
  is old-version — so restore is unreachable exactly after a bad conversion; make restore
  accept + re-convert an old-version snapshot. Overlaps the §4.2 boot rewrite + §5 backup
  feature — do them together.)*
  *(2026-08-24, step 8.1.8: both bugs FIXED. (a) `STORAGE_PRECONVERT_BACKUP_NAME`
  ("preConvertBackup") is now a second, separate key; `savePreConvertSnapshot` writes it
  **once and never overwrites**, so the oldest known-good raw state survives a whole chain
  of bad converters, and the rolling daily backup can no longer bury it. (b) restore goes
  through `restoreStateFromBackup`, which passes a current-version snapshot through and runs
  an older one forward through `convertState` instead of rejecting it; the emergency screen
  now offers BOTH slots (daily backup + pre-update snapshot). New `src/utils/bootBackup.ts`
  holds all three helpers so the boot path is unit-testable — 12 tests in
  `__tests__/utils/bootBackup.test.ts`. Still needs Fedir's over-install device check.
  Two further boot-path problems were found and deliberately NOT fixed (outside this step's
  scope, per PLAN §2) — reported to Fedir 2026-08-24, awaiting his call on where they go.)*
- [x] **bbh-api has NO DB migration mechanism** — `createUsersTable` is `CREATE TABLE IF NOT
  EXISTS`, so it never alters an existing live table. Any column rename/add in code
  silently diverges from the deployed sqlite schema and breaks INSERTs (this already
  bit us 2026-07-10: live `emailConfirmed` vs code `isEmailConfirmed` broke registration
  + the review-account seed; fixed with a manual `ALTER TABLE RENAME COLUMN` on the VPS).
  *(2026-07-11: added an idempotent "ensure columns exist" step — `usersTableColumns`
  (declarative authoritative list mirroring `createUsersTable`) + `ensureUsersTableColumns(db)`
  which runs `ALTER TABLE users ADD COLUMN` for any missing column. Called on boot in
  `app.ts` before `ensureTestUser`, and from inside `ensureTestUser` itself, so both a fresh
  and a drifted server converge. Self-heals the common ADD case; a RENAME still leaves the
  old column orphaned + adds the new one empty (needs an explicit one-off migration keyed on
  `PRAGMA user_version` — noted in code). Covered by `migration.test.ts`. NOT yet deployed —
  ships on next bbh-api push.)*
- [x] `settings.leftSwipeTag` dangling after tag removal — TODOs in 4 places
  (`initials.ts:97,158,409,454`, `models.ts:596`).
  *(2026-07-11: tags have no registry — they exist only while a passage carries them —
  so removing the last passage with a tag left `leftSwipeTag` pointing at nothing.
  Added a centralized self-heal in `reduce.ts`'s finalization block: if `leftSwipeTag`
  is not `ARCHIVED_NAME` and no passage carries it, fall back to `ARCHIVED_NAME`. Covers
  every passage-mutating action; TODO comments cleared; reduce.test.ts covers it.)*
- [x] `addressFromString` multiple-match ambiguity (`:58`) — matters more once intent/import works.
  *(2026-07-11: several books can be prefixes of the input ("Jud"/Jude is a prefix of
  "Judges"). Old code took the first-matched bookIndex but the LAST-matched number slice —
  an inconsistency. Rewrote matching to collect all candidates then pick the most specific
  (longest matched title; tie → the one that parsed a number), with all returned fields
  from that single match. Regression test: "Judges 1:1" → Judges (idx 6), not Jude (idx 64).)*
- `getStats.ts`: ~~`maxStroke` not implemented (`:419`)~~, ~~top-errors uncapped (`:152`)~~,
  day-average uncertain (`:291`) — correctness + perf risk as history grows.
  *(2026-07-11: implemented `getMaxStroke` (longest consecutive-day run, mirrors
  `getStroke`'s day bucketing) — wired into `getAppStats`. Capped `mostOftenAdressErrors`
  at `TOP_ADDRESS_ERRORS_LIMIT` (10). Both covered in getStats.test.ts. The day-average
  question (`:291`, "include missing days or not?") is a deliberate design decision left
  for Fedir — untouched so displayed stats don't silently change.)*
- [x] ~~`navigator.tsx:28` deep-link/notification-tap into training is a stub~~ — resolved
  by the §4.2 navigator refactor. `linking` config on `NavigationContainer` maps
  `bbh://` / `bible-by-heart://` / `https://biblebyheart.app` to screens, and
  `AppContext`'s `addNotificationResponseReceivedListener` dispatches `generateTests`
  then `navigationRef.navigate(SCREEN.test)` (shared-text taps route to
  `SCREEN.listPassage`). Fedir confirmed both on a device build. What remains is
  unrelated to this stub: the `//TODO handle open training` at `navigator.tsx:66` sits on
  the BACKGROUND notification TaskManager task, which only logs/toasts today, and https
  App Links still need `/.well-known/assetlinks.json` served by the API (§8.1.17).
- Historical fragility `[D]`: `react-native-fetch-api` polyfill once broke
  `useColorScheme()`; EAS autolinking failures; timezone/streak drops days on import.
  Add regression tests when touching those areas.
- ~~`constants.ts:100,255` unverified TODO constants~~; `initials.ts:130` missing default
  tags/train-modes on fresh install.
  *(2026-07-11: both constants TODOs resolved — `autoIncreaseLevel` verified implemented
  (reduce.ts:400 + Tests settings checkbox), stale comment removed; dead Material-You
  `Platform.select` colors block deleted. `initials.ts:130` still open.)*
- Dependency staleness after the pause: Expo SDK 53 / RN 0.79 will age; plan one
  SDK upgrade per year max, at a milestone boundary.
- [x] Play Store compliance: target-API-level deadlines for updates; check current
  requirement before the first re-release (0.1.1).
  *(2026-07-22: Play flagged "highest non-compliant target API level is Android 15 (API 35)".
  `app.config.js` → `expo-build-properties` compile/target SDK 35 → **36**, buildTools
  36.0.0, min stays 24 — the explicit override was pinning us below what Expo SDK 54 /
  RN 0.81 already support. `android.edgeToEdgeEnabled` was already true, so API 36's
  edge-to-edge enforcement needs no layout work — still eyeball system bars on the next
  staging build. Not built/pushed yet: `build-dev` → verify → `build-prod`. Re-check the
  requirement again before each yearly re-release.)*

## 4. Refactors & centralization

Order matters — each unlocks the next. Big manual test at each milestone.

Status audited 2026-07-22 against the source: `[x]` landed · `[~]` partially landed
(the remainder has its own §8 sessions) · `[ ]` not started.

1. [x] **Shared contract package** (`bbh-shared`, third repo/package — NOT a monorepo) `[F]`:
   client↔server request/response types, API version compatibility table, checksum/
   sync primitives. Both repos consume it. Do BEFORE sync feature work.
   *(2026-07-11: package CREATED at `c:/Code/bbh-shared` — standalone TS pkg, builds to
   `dist/` (CJS + d.ts), node:test on the version-compat helper. Contents kept minimal:
   `API_VERSION` + `API_COMPATIBILITY` + `isApiVersionCompatible()`, `API_ENDPOINTS`
   (paths single-source), auth request/response DTOs (replace the app's
   `Record<string,any>`), and the verbatim-duplicated `AddressType`/`PASSAGELEVEL`/
   `TESTLEVEL`. Checksum/sync primitives deferred to §6.2 when their shape is known.
   **DONE — published + wired (public GitHub repo, git dependency).**
   `github:CalmTed/bbh-shared#v0.0.1` in both repos (public ⇒ no registry/CI-auth). Note:
   `dist/` is committed because **Yarn 1 doesn't run a git dep's `prepare`** (bbh-api uses
   yarn), so building-on-install isn't portable — consumers use the committed build. Both
   repos verified green after wiring (bbh-api: eslint+tsc+38 jest; app: tsc+eslint+54 jest).
   Initial consumption: app `API_VERSION`, server `AddressType`/`PASSAGELEVEL`/`TESTLEVEL`.
   The address-nullability drift is now reconciled (server `AppAddressType` = shared
   nullable `AddressType`). **Follow-up per-repo tasks:** migrate the app's `API_LINK` →
   `API_ENDPOINTS` and the auth `Record<string,any>` bodies → the shared DTOs; reconcile
   the divergent user models — do these alongside the sync feature (§6.2). Release flow:
   bump version, `npm run build`, commit `dist/`, tag, bump `#tag` in both repos.)*
2. [x] **Navigator → standard react-navigation** `[D/F]`: replace custom
   `navigator.tsx`/`screeenManagement.ts`; add deep linking (fixes notification-tap
   and intent entry); remove top-space bug. **(one-sitting task per screen group)**
   *(2026-07-11, commits fc3bc11 + e45c568 — DONE. The real root problem was that the
   whole `AppState` travelled through route params; killing that (→ `AppContext`) is what
   fixed the modal/gesture/edit-loss symptoms. `screeenManagement.ts` (`navigateWithState`)
   and `utils/useApp.ts` deleted; all screens on one `createStackNavigator`; settings
   sub-menus converted from MiniModals to real screens; passage editor became
   `PassageScreen`; deep links + notification-tap wired via `navigationRef` (§3, device-
   confirmed); top-space fixed with `useSafeAreaInsets()` in `Header`/`PassageEditor` —
   the global `theme.screen.paddingTop:30` was deliberately left, so header screens keep a
   small extra gap to tune during §4.8. Remaining follow-ups, each already queued: typed
   `RootStackParamList` (8.1.14) and the screen-transition animation (8.2.3).)*
3. [~] **Theme + l10n React contexts** `[D]`: centralize; move to layered
   `t("page.title")` keys; themed `Text` component.
   *(2026-07-11: the centralize half is DONE — `context/AppContext.tsx` is the single
   source of `state`/`dispatch`/`theme`/`t`, screens consume `useAppContext()`, memoized
   in 8.1.2. Themed `Text` component DONE. Test harness `test-utils/renderWithContext.tsx`
   DONE (was the blocker), and the low-fan-out primitives `DotIndicator`/`Checkbox`/
   `Select`/`SelectModal` migrated off the `theme` prop. REMAINDER: the high-fan-out
   components (8.1.11–8.1.13, ~180 call sites) and the layered `t("page.title")` key
   restructuring (8.2.9).)*
   *(2026-08-24: the prop-drilling half is **DONE** — 8.1.11–8.1.13 landed together.
   Every component now reads `theme`/`t` from `useAppContext()`; ~277 call sites across
   35 files removed. Proof it was purely structural: all 22 snapshots matched and no
   `.snap` file changed. `CODING_RULES.md` §7 now forbids reintroducing either prop.
   The only remainder of this whole item is the layered `t("page.title")` key
   restructuring (8.2.9), which is scheduled late and allowed to slip.)*
4. [ ] **File renames to convention** (`CODING_RULES.md` §2): one dedicated task,
   pure `git mv` + import fixes, no logic changes. → session **8.1.15**. Current
   offenders: `homeScreen/listScreen/testsScreen/finishScreen/statsScreen/calendarScreen/
   settingsScreen/loginScreen/registerScreen.tsx`, `miniModal.tsx`,
   `setttingsMenuItem.tsx` (also a typo), `testNevDott.tsx` (also a typo),
   `settingsListWrapper.tsx`, `weekActivityComponent.tsx`, `icondata.ts`; bbh-api
   `base.servise.ts`.
5. [ ] **Passage/Address abstraction** `[D]`: methods like `getSentences()`, address
   math as methods — replaces scattered utils gradually. *(Not started; no §8 session
   yet — schedule it when the address utils next hurt.)*
6. [ ] **Split level components / unify error-message design** `[D]`. → session **8.2.6**.
7. [ ] **Haptics/sound util** that auto-checks settings `[D]`. → session **8.2.8**.
8. [ ] **Ground-up UI wrapper refactor** `[F]` — the "candy" one: reanimated +
   gesture-handler everywhere, springy modern-but-unique interactions, responsive
   from small old Androids to tablets/foldables. Current visual style is the
   baseline, not a constraint. Do AFTER navigator + theme contexts (it builds on both).
   Note: reanimated/gesture-handler must be added to dependencies properly first.
   *(2026-07-11 on-device: Fedir reports current animations feel WORSE than before and
   wants a full rewrite of navigator + wrappers + views with reanimated. This refactor
   (together with §4.2) IS that rewrite — treat the animation regression as its driver,
   not a separate bug. The 2026-07-10 FlatList swap may also have changed list-scroll
   feel; re-tune it here.)*
9. [~] **API: keep storage-agnostic** — any new endpoint goes through the service layer;
   stay on sqlite until real scale demands otherwise. *(Standing rule, not a one-off task.
   Holds today: `services/base.servise.ts` is the only place that touches sqlite;
   controllers go through `user.service.ts`. Re-check it whenever an endpoint is added —
   next at the sync endpoints, 8.4.4.)*

## 5. Testing — "as much coverage as possible"

- [ ] **Backup before migration** `[F]`: on state-version upgrade, prompt to save a
  backup file; settings option to restore from backup. Ship this EARLY (0.1.x) —
  it de-risks every later refactor.
- [ ] Reducer: full action coverage in `reduce.test.ts` (it's the heart).
- [ ] Test generation: one test per level generator, incl. the L11 translation fix
  as a regression test.
- [x] `stateVersionConvert`: a fixture state per historical version, converted
  forward, asserted. Highest-value tests in the repo.
  *(2026-08-24, 8.1.10: `__tests__/fixtures/state006.ts` + `state007.ts` cover the legacy
  hops; the recursive chain from the oldest allowed version reaches `VERSION` asserted.)*
- [ ] Stats: streak/timezone regression tests (the "import drops days" bug class).
- [ ] `fetch.ts` auth flows against a mocked API; bbh-api: supertest coverage of all
  routes (register/login/refresh/edit/delete + failure cases).
- [x] End-to-end flow test: create state → add passage → generate tests → submit
  answers (with errors) → finish → stats correct → error counts NEVER rendered.
  *(2026-08-24, 8.1.16a: `__tests__/e2e/flow.test.tsx`, driven through the reducer +
  generators rather than rendered screens — Fedir's call, so the Candy UI rewrite can't
  break it. Includes the explicit no-error-count assertion.)*
- [ ] At each version milestone: Fedir's manual pass on real phone + staging build
  (checklist per milestone kept in robotdiary).
- Coverage is currently ~35%, concentrated in components/utils. Push it up with
  every touched file: touching a file = leaving tests behind.

## 6. Features — in user priority order

1. **Google auth** `[F]`: added ALONGSIDE email/password (never required), built as
   a pluggable provider interface so Apple ID slots in later. Client + bbh-api
   endpoint + token handling. (Apple ID becomes required by App Store rules once
   any social login exists on iOS — plan both together.)
2. **Basic data sync** `[F]` (design in ARCHITECTURE §3.4): split state into parts;
   last-write-wins with checksum verification; history syncs incrementally
   (append-only new records + count/time/checksum verify) with animated progress bar.
   No forcible merge. Requires: shared contract package (§4.1) first, API version
   compat table, sync endpoints in bbh-api, sync UI in settings.
3. **Ukrainian translation text fetching** `[F]`: build the *capability* — a
   pluggable text-source interface like `fetchESV.ts` — so when Fedir secures
   permission for a Ukrainian translation, adding it is config + one fetcher file.
4. **Learning workflow finish screen** `[F]`: show dynamic session data on
   `finishScreen.tsx` — what was trained, time, progress/level-ups, what needs
   repeating — WITHOUT exposing error counts (philosophy §2.2).
5. **Payments — premium subscription** `[F]`: goal >$150/year to cover hosting.
   Reality check: in-app digital subscriptions MUST use Google Play Billing /
   Apple IAP (that's also what gives users the comfortable platform payment sheet —
   Google Pay-style UX comes for free). First task is research + a thin
   `expo-iap`/RevenueCat-style decision doc, then entitlement flag in state + API.
6. **Web version** `[P3, fun]`: Expo web build served as a static client by bbh-api.
   Try only after 1.0.0-critical work; treat as experiment.

Later pool (unordered, post-1.0.0): broadcast/update messages, feedback form,
friends/feed/groups, achievements, smarter notifications, home-screen dynamic stat
labels, accessibility pass, prove-imported-passage flow, seasonal icons.

## 7. Version milestones (big-test checkpoints until 1.0.0)

Each milestone = Fedir does full manual testing on a real phone + staging build.
Resequenced 2026-07-11: the old **0.1.2 — Safety net** is folded into **0.2.0**
(the navigator refactor is already on `staging`, so nothing can ship without it),
and the intent receiver — already working — moved from 0.4.0 into 0.2.0 as polish.

| Version | Content | Sections |
|---|---|---|
| **0.1.1 — Revival** ✓ | CI/CD verified; P0 + P1 code bugs fixed; login verified vs new VPS; console.error purge | §1, §2 |
| **0.2.0 — Fast & solid** | render-lag P0 fixed; intent-receiver polish (sanitize/aliases/confirm); safety net (backup-before-migration, boot fixes); context migrations done; typed nav; file renames | §2, §4.1–4.4, §5 |
| **0.3.0 — Candy UI** | reanimated ground-up wrapper refactor (gestures, all screen sizes); split level components; modal purge; L5 similar-chars; address-picker UX | §4.6–4.8 |
| **0.4.0 — Accounts+** | Expo SDK upgrade + deps cleanup; Google auth (pluggable providers) | §6.1, §3 |
| **0.5.0 — Sync** | basic data sync with incremental history + checksums; shared-pkg follow-ups | §6.2, §4.1 |
| **0.6.0 — Content & finish** | Ukrainian text-source capability; finish-screen session data | §6.3, §6.4 |
| **0.7.0 — Premium** | subscription via Play Billing (+ App Store prep) | §6.5 |
| **0.8.0 — iOS** | App Store account, Apple ID login, iOS share extension, iOS-specific fixes, publish | §6.1 |
| **1.0.0 — Finished** | no major bugs, both stores, sync + payment live | all |

## 8. The working queue — moved to `docs/PLAN.md`

The granular one-checkbox-per-session queue that used to live here was moved to
**`docs/PLAN.md`** on 2026-07-22, so there is exactly one place to check a box.
`PLAN.md` carries every remaining step (Goal / Files / Acceptance / Risk each), the
`(build)` / `(device)` / `(one-sitting)` / `[api]` / `[shared]` tags, the milestone
device-checklists, the decisions locked in the 2026-07-22 planning interview, and an
archive of everything already finished — including sessions 8.1.1–8.1.7, whose IDs are
unchanged and still referenced by `robotdiary.md`.

**Take the first unchecked step in `docs/PLAN.md`.** Nothing is scheduled here any
more; §2–§7 above stay as the reasoning those steps refer back to.

---

_Keep §2–§7 current as reality changes: check off bugs and risks here, keep the
milestone table honest, record new bugs/risks as they are found. Scheduling — the order
sessions actually happen in — belongs to `docs/PLAN.md`. When reality diverges (new
bugs, Fedir feedback), insert steps there rather than silently reordering._