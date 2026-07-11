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
   explicitly on that task: **(one-sitting task)**.
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
- `constants.ts:100,255` unverified TODO constants; `initials.ts:130` missing default
  tags/train-modes on fresh install.
- Dependency staleness after the pause: Expo SDK 53 / RN 0.79 will age; plan one
  SDK upgrade per year max, at a milestone boundary.
- Play Store compliance: target-API-level deadlines for updates; check current
  requirement before the first re-release (0.1.1).

## 4. Refactors & centralization

Order matters — each unlocks the next. Big manual test at each milestone.

1. **Shared contract package** (`bbh-shared`, third repo/package — NOT a monorepo) `[F]`:
   client↔server request/response types, API version compatibility table, checksum/
   sync primitives. Both repos consume it. Do BEFORE sync feature work.
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

| Version | Content | Sections |
|---|---|---|
| **0.1.1 — Revival** | CI/CD verified; P0 + P1 code bugs fixed; login verified vs new VPS; console.error purge | §1, §2 |
| **0.1.2 — Safety net** | backup-before-migration; crash-report triage; destructive-action confirms; archive-gated delete; reducer+converter test coverage | §2, §5 |
| **0.2.0 — Foundations** | shared contract package; navigator → react-navigation + deep links; theme/l10n contexts; file renames | §4.1–4.4 |
| **0.3.0 — Candy UI** | ground-up UI wrapper refactor (reanimated, gestures, all screen sizes); split level components | §4.8 |
| **0.4.0 — Accounts+** | Google auth (pluggable providers); minimal intent receiver | §6.1, §2-P2 |
| **0.5.0 — Sync** | basic data sync with incremental history + checksums | §6.2 |
| **0.6.0 — Content & finish** | Ukrainian text-source capability; finish-screen session data | §6.3, §6.4 |
| **0.7.0 — Premium** | subscription via Play Billing (+ App Store prep) | §6.5 |
| **0.8.0 — iOS** | App Store account, Apple ID login, iOS-specific fixes, publish | §6.1 |
| **1.0.0 — Finished** | no major bugs, both stores, sync + payment live | all |

---

_Update this file as tasks complete (check boxes, move bugs). Detailed per-part
plans are derived from here by Fedir when a section becomes active._
