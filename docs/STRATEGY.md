# STRATEGY — the master plan

> The single source of truth for what to do and in what order.
> Supersedes the old `docs/PLAN.md` (fully absorbed here) and the readme roadmap.
> Fedir derives specific per-part plans from this file when a part becomes active.
> Order of the epochs: **workflow → bugs → safety → refactors → testing → features.**
> Bugs before features — confirmed.

Legend: **P0** critical · **P1** high · **P2** medium · **P3** later ·
`[D]` from projectdiary · `[C]` found in code scan (2026-07-07) · `[F]` from Fedir directly.

---

## 0. How work happens (session protocol)

1. Session starts → AI reads `CLAUDE.md` → `ARCHITECTURE.md`, `CODING_RULES.md`,
   `FILEMAP.md`, and the active section here.
2. One task per session, sized to fit comfortably under ~100k context. If a task is
   genuinely better done whole (e.g. a state-model migration), the plan says so
   explicitly on that task: **(one-sitting task)**. The task itself comes from the
   **§8 granular queue** — take the first unchecked item unless Fedir says otherwise.
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
- [ ] **Verify CI/CD still works after the year pause:** trigger an EAS staging build
  (`build-dev`) and a bbh-api staging deploy; fix what broke. *(Do this before the
  first milestone — everything downstream depends on it.)*
- [ ] Refine `FILEMAP.md` `(?)` descriptions as files get touched (ongoing, free).

## 2. Bugs

### P0

- [ ] **~0.5s lag on EVERY screen render** `[F, on-device 2026-07-11]` — reproduces on
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
- `navigator.tsx:28` deep-link/notification-tap into training is a stub — resolve
  during navigator refactor.
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
- Play Store compliance: target-API-level deadlines for updates; check current
  requirement before the first re-release (0.1.1).

## 4. Refactors & centralization

Order matters — each unlocks the next. Big manual test at each milestone.

1. **Shared contract package** (`bbh-shared`, third repo/package — NOT a monorepo) `[F]`:
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
2. **Navigator → standard react-navigation** `[D/F]`: replace custom
   `navigator.tsx`/`screeenManagement.ts`; add deep linking (fixes notification-tap
   and intent entry); remove top-space bug. **(one-sitting task per screen group)**
3. **Theme + l10n React contexts** `[D]`: centralize; move to layered
   `t("page.title")` keys; themed `Text` component.
4. **File renames to convention** (`CODING_RULES.md` §2): one dedicated task,
   pure `git mv` + import fixes, no logic changes.
5. **Passage/Address abstraction** `[D]`: methods like `getSentences()`, address
   math as methods — replaces scattered utils gradually.
6. **Split level components / unify error-message design** `[D]`.
7. **Haptics/sound util** that auto-checks settings `[D]`.
8. **Ground-up UI wrapper refactor** `[F]` — the "candy" one: reanimated +
   gesture-handler everywhere, springy modern-but-unique interactions, responsive
   from small old Androids to tablets/foldables. Current visual style is the
   baseline, not a constraint. Do AFTER navigator + theme contexts (it builds on both).
   Note: reanimated/gesture-handler must be added to dependencies properly first.
   *(2026-07-11 on-device: Fedir reports current animations feel WORSE than before and
   wants a full rewrite of navigator + wrappers + views with reanimated. This refactor
   (together with §4.2) IS that rewrite — treat the animation regression as its driver,
   not a separate bug. The 2026-07-10 FlatList swap may also have changed list-scroll
   feel; re-tune it here.)*
9. **API: keep storage-agnostic** — any new endpoint goes through the service layer;
   stay on sqlite until real scale demands otherwise.

## 5. Testing — "as much coverage as possible"

- [ ] **Backup before migration** `[F]`: on state-version upgrade, prompt to save a
  backup file; settings option to restore from backup. Ship this EARLY (0.1.x) —
  it de-risks every later refactor.
- [ ] Reducer: full action coverage in `reduce.test.ts` (it's the heart).
- [ ] Test generation: one test per level generator, incl. the L11 translation fix
  as a regression test.
- [ ] `stateVersionConvert`: a fixture state per historical version, converted
  forward, asserted. Highest-value tests in the repo.
- [ ] Stats: streak/timezone regression tests (the "import drops days" bug class).
- [ ] `fetch.ts` auth flows against a mocked API; bbh-api: supertest coverage of all
  routes (register/login/refresh/edit/delete + failure cases).
- [ ] End-to-end flow test: create state → add passage → generate tests → submit
  answers (with errors) → finish → stats correct → error counts NEVER rendered.
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

## 8. Granular session plan to 1.0.0 (one checkbox = one session)

> The working queue. Take the FIRST unchecked item unless Fedir says otherwise.
> Derived from §2–§6 + robotdiary follow-ups + Fedir's 2026-07-11 on-device feedback.
> Items marked **(build)** end with a version bump + `build-dev` push so real-life
> testing happens continuously, not only at milestones.
>
> **Version & real-life-testing policy:** any session touching native config or
> dependencies ends with a patch bump + CI staging build **(build)**. Otherwise bump
> a patch + push a staging build every ~4–6 sessions. Milestone = minor bump + Fedir's
> full manual pass (checklist kept in robotdiary).

### 8.1 → 0.2.0 "Fast & solid"

**A. The render-lag P0 (do first — it's live in the store)**

- [x] **8.1.1 Diagnose the ~0.5s screen-render lag.** Profile, don't guess: React
  Profiler / `console.time` on screen mount in a dev build. Check the §2-P0 suspect
  list (context value identity, `getTheme`/`createT` per render, StyleSheet-in-render,
  AsyncStorage writes, screen remounts). Deliverable: written findings + ordered fix
  list in robotdiary. No fixes yet.
  *(2026-07-11: findings + ordered fix list in robotdiary. Root causes: single
  AppContext handing a fresh value + fresh `dispatch`/`t`/`theme` every render →
  whole subscriber tree re-renders per dispatch and no `React.memo` can skip; a
  per-render `JSON.stringify(state)` (O(history)) as the persist-effect key; heavy
  per-render `getStroke`/`getAppStats` in home/stats/calendar. Context-layer causes
  fixed in 8.1.2; screen-layer (memo rows, memo stats, hoist inline components,
  freezeOnBlur) deferred to 8.1.3.)*
- [x] **8.1.2 Lag fix, part 1 — context layer.** Per findings; expected shape: memoize
  the `AppContext` value, split state/dispatch contexts if needed, stabilize `t`/`theme`
  (this also unlocks the row-memoization deferred on 2026-07-10). **(build)** — Fedir
  re-times on Pixel 9 Pro.
  *(2026-07-11: `AppContext.tsx` — `dispatch`→`useCallback`, `theme`/`t`/value→`useMemo`,
  and persist effect keyed on `state` ref instead of a per-render `JSON.stringify` (clone
  only on the daily-backup path). Stable `t`/`theme` unblock the row memoization (8.1.3).
  lint+tests green. Kept single context — a full state/dispatch split wasn't needed for
  the memo unlock and would touch every call site; revisit in 8.1.3 only if consumers
  re-rendering is still the bottleneck. **Build + device re-time is Fedir's to trigger**
  — `npm run build-dev` (billable EAS staging build) + patch bump.)*
- [x] **8.1.3 Lag fix, part 2 — screen layer** (only if 8.1.2 isn't enough): `React.memo`
  heavy rows/components, `freezeOnBlur`/`detachInactiveScreens`, lazy screen mount.
  *(2026-07-11: did fixes c–f from the 8.1.1 ordered list. (c) `React.memo` the passage
  `ListItem` — pass primitives (`sort`/`leftSwipeTag`/`addressLanguage`) + stable
  `useCallback` handlers instead of the whole `state`, so a row only re-renders when its
  OWN passage changes (search typing no longer re-renders every visible row); also
  `React.memo` `WeekActivityComponent`+`DayActivityBar`. (d) `useMemo` the O(history)
  stat walks: `getStroke` (home), `getWeeklyStats` (week activity, keyed on
  `state.testsHistory`), `getAppStats` (stats + calendar, keyed on `state` — skips
  recompute on local-state re-renders like day/month selection). (e) home's inline
  `LogoBlock`/`MainButtons` were new component TYPES each render (full remount) → now
  plain elements; `Linking.getInitialURL` moved from per-render into a mount effect.
  (f) `freezeOnBlur` + `detachInactiveScreens` on the stack so blurred-but-mounted
  screens stop re-rendering on every dispatch. Plus App.tsx's `Linking.addEventListener`
  effect got its missing dep array. lint+tests green (26/57/22). Device re-time is
  Fedir's; if the ~0.5s is gone, 8.1.A is done.)*

**B. Intent-receiver polish (Fedir's on-device feedback batch)**

- [ ] **8.1.4 Sanitize shared text** (`listScreen.handleTextFromIntent` path): trim;
  strip wrapping quotes (`«»`, `""`, `“”`, `‘’`); strip dangling `:`/`;`/`,` at ends;
  **normalize untypable chars** — em/en dash → `-`, curly quotes/apostrophes → straight,
  ellipsis `…` → `...`, nbsp → space — because the typing test demands the exact char.
  Also **strip URLs** from the shared text (share payloads usually append a link).
  Pure util + unit tests with real shared strings (YouVersion etc.).
- [ ] **8.1.5 Book-name variants in `addressFromString`**: alias list per book
  (Івана = Іоана and similar uk spelling variants; common en abbreviations), applied in
  the candidate-matching pass. Tests per alias.
- [ ] **8.1.6 Intent finish**: replace the debug toast with the intended confirm flow;
  remove the now-redundant manual SEND filter in `app.config.js` and the dead
  `plugins/handlingIntents.js`. **(build)**
- [ ] **8.1.7 AddressPicker one-verse flow**: after a single verse is picked, show a
  big colored PRIMARY "add" button by default — one verse is enough — with a clearly
  secondary affordance to extend the range. l10n en+ua.

**C. Safety net (the old 0.1.2, still owed)**

- [ ] **8.1.8 Boot-path backup fixes** (§3 logged 2026-07-11): give the pre-conversion
  snapshot its own never-overwritten storage key; make "Restore from backup" accept an
  old-version snapshot and re-convert it. Device-sensitive — careful, tests first.
- [ ] **8.1.9 Backup-before-migration prompt** (§5): on state-version upgrade prompt to
  save a backup file; settings option to restore from a backup file. **(build)**
- [ ] **8.1.10 Legacy converter coverage**: fixture states for 0.0.6/0.0.7, converted
  forward, asserted (completes the 2026-07-11 converter test work).

**D. Foundations completion (§4.3/§4.4 remainder)**

- [ ] **8.1.11 Context migration — `Button` + `IconButton`** (~89 call sites; the
  pattern from 2026-07-11: read `useAppContext()`, drop `theme` prop, update call
  sites, swap tests to `renderWithContext`).
- [ ] **8.1.12 Context migration — `settingsMenuItem` + `Input` + `Header`** (~77 sites).
- [ ] **8.1.13 Context migration — the rest**: `AddressPicker`, `LevelPicker`,
  `PassageEditor`, `miniModal`, `weekActivityComponent`, `testNevDott`,
  `SettingsSubScreen`, `settingsListWrapper`, `levels/Level1..5`; retire the `t` prop.
- [ ] **8.1.14 Typed navigation**: `RootStackParamList` + typed screen props; removes
  `ScreenModel.route: any` (homeScreen) and the `@ts-ignore` in testsScreen.
- [ ] **8.1.15 File renames to convention** (CODING_RULES §2): pure `git mv` + import
  fixes, no logic. **(one-sitting task)**
- [ ] **8.1.16 Fresh-install defaults** (`initials.ts:130`): default tags/train-modes
  on first launch.
- [ ] **8.1.17 bbh-api deploy session**: push the two committed-not-deployed hardenings
  (`verifyMailer`, `ensureUsersTableColumns`); serve `/.well-known/assetlinks.json` so
  https App Links open the app; switch the prod container entrypoint from `nodemon` to
  plain `node dist/app.js`.
- [ ] **8.1.18 🏁 MILESTONE 0.2.0**: bump minor, staging build, Fedir's full device
  pass (checklist in robotdiary: scroll feel, search focus, intent → confirm → add,
  deep links, backup/restore, login).

### 8.2 → 0.3.0 "Candy UI"

- [ ] **8.2.1 Install `react-native-reanimated`** + babel plugin, verify a trivial
  animation compiles in a dev build. Native change → **(build)**.
- [ ] **8.2.2 Modal purge**: audit every remaining full-screen `MiniModal`; convert the
  **filter/tag selection** (listScreen) and any other sub-menu-like ones to screens or
  anchored non-fullscreen popups. Real dialogs (confirms, About popups) stay modals.
- [ ] **8.2.3 Wrapper rewrite — navigation transitions + Header** (reanimated springs;
  fixes "animations feel worse"; retune the FlatList scroll feel from 2026-07-10).
  *(Device feedback 2026-07-11, after the 8.1.2 build: the default card transition now
  reads fine on an old Samsung — it fades — but on the Pixel 9 Pro it does a same-side
  push that runs faster yet **looks broken at the tail end of the animation**. Replace
  the stack's screen-transition animation here rather than tweak it: define an explicit
  custom `cardStyleInterpolator` / reanimated transition instead of relying on the
  platform default, so it's consistent across devices. Keep this in mind when doing the
  wrapper rewrite.)*
- [ ] **8.2.4 Wrapper rewrite — home screen + passage list interactions** (gestures,
  swipe actions, responsive small-Android → tablet/foldable).
- [ ] **8.2.5 Wrapper rewrite — tests/levels screens + finish screen shell.** **(build)**
- [ ] **8.2.6 Split level components** (§4.6): one file per level, unify error-message
  design; fixes the testsScreen navigate-during-render smell.
- [ ] **8.2.7 Level 5 similar-chars tolerance**: equivalence list (dash variants, quote/
  apostrophe variants, ellipsis, і/i lookalikes, case of diacritics) used by the L5
  comparator (`createL50Test.ts` / `Level5.tsx`) so near-identical chars aren't counted
  as errors — gentler, per philosophy §2.2. Complements 8.1.4 (sanitize on input,
  tolerate on comparison). Unit tests per pair.
- [ ] **8.2.8 Haptics/sound util** (§4.7): auto-checks settings; replace scattered calls.
- [ ] **8.2.9 Layered l10n keys** `t("page.title")` (§4.3 remainder): restructure
  en.ts/ua.ts + call sites. Big mechanical diff — **(one-sitting task)**, can slip
  to any later gap if 0.3.0 runs long.
- [ ] **8.2.10 🏁 MILESTONE 0.3.0**: minor bump, staging build, Fedir's device pass
  (animation feel is the acceptance criterion) + Play Store release of the accumulated
  0.2.0+0.3.0 work.

### 8.3 → 0.4.0 "Accounts+"

- [ ] **8.3.1 Expo SDK upgrade** (54 → 55, or straight to current if the jump is
  documented-safe), per the one-per-year-at-milestone-boundary rule. **(build)**
- [ ] **8.3.2 Deps cleanup**: drop `eas-cli` from deps; replace `react-native-fs`
  (unmaintained, New-Arch risk) with `expo-file-system`; `expo-random` → `expo-crypto`.
  **(build)**
- [ ] **8.3.3 Google auth — decision doc**: pluggable-provider interface design
  (Apple ID must slot in later), library choice (`expo-auth-session` vs native), token
  exchange flow vs bbh-api. Doc only, Fedir signs off.
- [ ] **8.3.4 Google auth — bbh-api**: provider-agnostic endpoint (`/api/user/oauth`),
  verify Google ID token, issue the same JWT pair; supertest coverage.
- [ ] **8.3.5 Google auth — client**: Google sign-in button alongside email/password
  (never required); wire through the provider interface; l10n en+ua. **(build)**
- [ ] **8.3.6 🏁 MILESTONE 0.4.0**: minor bump, device pass (both auth paths, fresh
  install, SDK-upgrade smoke).

### 8.4 → 0.5.0 "Sync"

- [ ] **8.4.1 Shared-pkg follow-ups** (§4.1 debt): migrate app `API_LINK` →
  `API_ENDPOINTS`; auth `Record<string, any>` bodies → shared DTOs; reconcile the
  divergent user models. Release bbh-shared v0.0.2 (bump, build dist, tag, re-pin).
- [ ] **8.4.2 Sync design doc**: state split into parts; LWW + checksum per part;
  incremental history protocol (append + count/time/checksum verify). Extends
  ARCHITECTURE §3.4 into concrete request/response shapes in bbh-shared.
- [ ] **8.4.3 Checksum/sync primitives in bbh-shared** + unit tests (v0.0.3).
- [ ] **8.4.4 bbh-api sync endpoints** (part get/put, history append/verify) +
  supertest coverage of all routes incl. failure cases (§5 item).
- [ ] **8.4.5 Client sync engine — parts** (settings/passages): LWW exchange, checksum
  verify, api-version compat gate (sync disabled ≠ app broken, §3-constitutional).
- [ ] **8.4.6 Client sync engine — incremental history** + animated progress bar.
- [ ] **8.4.7 Sync UI in settings** (status, last sync, manual trigger) l10n en+ua.
  **(build)**
- [ ] **8.4.8 🏁 MILESTONE 0.5.0**: minor bump; two-device manual sync test is the
  acceptance criterion.

### 8.5 → 0.6.0 "Content & finish"

- [ ] **8.5.1 Pluggable text-source interface** (generalize `fetchESV.ts`), so a
  Ukrainian translation = config + one fetcher file once permission is secured.
- [ ] **8.5.2 Finish screen session data** (§6.4): what was trained, time, level-ups,
  what needs repeating — WITHOUT error counts (philosophy §2.2). l10n en+ua.
- [ ] **8.5.3 Stats correctness pass**: decide the day-average question with Fedir
  (`getStats.ts:291`), add streak/timezone-DST regression tests (§5). **(build)**
- [ ] **8.5.4 🏁 MILESTONE 0.6.0**: minor bump, device pass.

### 8.6 → 0.7.0 "Premium"

- [ ] **8.6.1 IAP research + decision doc**: `expo-iap` / RevenueCat / raw Play
  Billing; subscription product setup; entitlement model. Doc only.
- [ ] **8.6.2 Entitlement flag** in AppState + bbh-api (user record + endpoint);
  converter bump + tests.
- [ ] **8.6.3 Play Billing integration** + purchase/restore flows + premium gate on
  the chosen features. **(build)**
- [ ] **8.6.4 🏁 MILESTONE 0.7.0**: minor bump; real test purchase on device.

### 8.7 → 0.8.0 "iOS"

- [ ] **8.7.1 App Store Connect setup**: ascAppId into `eas.json` submit profile
  (unblocks the CI submit step from 2026-07-09), TestFlight build green. **(build)**
- [ ] **8.7.2 Apple ID login** through the 8.3.3 provider interface (required by App
  Store rules once Google login exists on iOS).
- [ ] **8.7.3 iOS share extension** for the intent receiver (app-group id + the
  `expo-share-intent` iOS half that was `disableIOS`'d).
- [ ] **8.7.4 iOS-specific fixes pass** (safe areas, gestures, notifications) from
  TestFlight feedback.
- [ ] **8.7.5 🏁 MILESTONE 0.8.0**: App Store publish.

### 8.8 → 1.0.0 "Finished"

- [ ] **8.8.1 Reducer full action coverage** in `reduce.test.ts` (§5).
- [ ] **8.8.2 End-to-end flow test** (§5): create state → add passage → generate tests
  → answer with errors → finish → stats correct → error counts NEVER rendered.
- [ ] **8.8.3 Hardening/bug-triage buffer** — whatever the milestones surfaced.
- [ ] **8.8.4 🏁 1.0.0**: both stores, sync + payment live, no major bugs.

---

_Update this file as tasks complete (check boxes, move bugs). §8 is the working
queue; when reality diverges (new bugs, Fedir feedback), insert sessions rather
than silently reordering._
