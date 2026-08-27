# robotdiary — AI session log

> Append one dated entry per session: what was done, decisions made, gotchas found,
> what needs manual verification. Newest at the bottom.
> (`projectdiary.md` is Fedir's personal diary — never write there.)

---

## 2026-07-07

- Bootstrapped the AI workflow: created `docs/ARCHITECTURE.md`, `CODING_RULES.md`,
  `FILEMAP.md`, `STRATEGY.md`, this file, and `CLAUDE.md` in both repos.
- Absorbed and deleted `docs/PLAN.md` (its bug/risk scan lives on in STRATEGY §2–§3).
- Key decisions captured from Fedir's 44-question interview: offline-first is
  constitutional; device is source of truth; error counts hidden from user (stored
  for scheduling only); keep reducer+AsyncStorage; migrate custom navigator to
  react-navigation; shared contract package as a third repo (no monorepo); sync =
  LWW + checksums + incremental history; auth additive/pluggable; bugs before
  features; broken-in-between OK; milestone-based manual testing until 1.0.0.
- Needs manual verification: nothing yet (docs only). Next recommended task:
  STRATEGY §1 — verify CI/CD (EAS staging build + bbh-api staging deploy).

## 2026-07-08

- Fixed the recurring GitHub Actions failures (STRATEGY §1 CI/CD). Root causes:
  1. Workflows used `yarn install --frozen-lockfile`, but the repo is npm-based and
     had **no committed lockfile** (`.gitignore` even ignores `yarn.lock`) — install
     failed before lint ever ran.
  2. Two real peer-dep conflicts blocked a clean install: `react-test-renderer`
     resolved to 19.2.7 while `react` is pinned 19.0.0; and
     `eslint-config-airbnb-typescript@18` wants `@typescript-eslint/*@^7` while we're
     on v8.
  3. Actual lint error: 4 prettier violations in `src/models.ts` (multi-line union
     types) — cosmetic only.
- Fixes: pinned `react-test-renderer@19.0.0` in devDeps; added `.npmrc`
  (`legacy-peer-deps=true`) so install/`npm ci` behave the same locally and in CI;
  generated + committed `package-lock.json`; ran `npm run lint-fix` for the prettier
  errors; rewrote both workflows to npm (`npm ci` + `npm run lint` + `npm test`),
  bumped checkout/setup-node v3→v4, added npm caching, dropped the redundant standalone
  `tsc` step (lint already runs it).
- Verified locally: `npm ci` ✓, `npm run lint` ✓, `npm test` ✓ (21 suites / 35 tests).
- Needs manual verification: push to `staging` and confirm the Actions run goes green
  through build-and-test (the EAS submit jobs need `EXPO_TOKEN` + store credentials —
  out of scope here).
- iOS submit was rejected: Apple requires Xcode 26+ for App Store builds from
  2026-04-28; EAS `auto` image picked Xcode 16 for our SDK 53 / RN 0.79 project.
  Pinned `ios.image` to `macos-sequoia-15.6-xcode-26.0` on both build profiles in
  `eas.json` (conservative Xcode 26; can bump to `macos-tahoe-26.4-xcode-26.4` /
  `latest` if needed). Watch for RN 0.79 build breakage on the newer toolchain — if
  it fails to compile, the real fix is an Expo SDK upgrade.
- Android: no equivalent forced image bump. The analogous recurring Google Play rule
  is target API level, which SDK 53 already satisfies (targets API 35 / Android 15).

## 2026-07-09

- Android Gradle build failed: `:app:checkReleaseAarMetadata` — `core-splashscreen`
  1.2.0-alpha02 requires `compileSdk >= 35`, but `expo-build-properties` in
  `app.config.js` pinned `compileSdkVersion: 34`. Bumped it to 35.
- Also found `minSdkVersion: 35` in the same block — almost certainly a typo (would
  restrict installs to Android 15+, ~all devices excluded). Corrected to 24 (Expo SDK
  53 default). Confirmed with Fedir that Google Play only mandates `targetSdkVersion`
  (35, kept); it places no floor on `minSdkVersion`, and lower = wider reach.
  Final Android SDK config: compileSdk 35 / targetSdk 35 / minSdk 24 / buildTools 35.0.0.
- Needs manual verification: next EAS Android build should get past the AAR-metadata
  check.
- iOS submit failed in CI (build OK, submit step): `ascAppId` missing from the submit
  profile. Added `cli.appVersionSource: "remote"` to `eas.json` (EAS now manages iOS
  buildNumber / Android versionCode — supersedes the local yymmddhh `versionCode` in
  app.config.js). Still blocked on the App Store Connect App ID from Fedir to add the
  `submit.*.ios` block.
- Expo SDK upgrade — Fedir chose the incremental path; did **53 → 54** this session
  (RN 0.79→0.81, React 19.0→19.1). Steps: `expo install expo@^54 --fix`; removed
  vestigial `expo-router` (never imported — app entry is `index.js`→`App.tsx` via
  react-navigation, no `app/` dir; its SDK-54 config plugin would have hijacked the
  entry point); registered `expo-localization` + `expo-secure-store` plugins in
  app.config.js; migrated `src/utils/fileManager.ts` imports to `expo-file-system/legacy`
  (SDK 54 swapped the default FS API); bumped dev tooling (`jest-expo` 54, `@types/react`
  19.1, `eslint-config-expo` 10, `react-test-renderer` 19.1, `@types/jest` 29.5,
  `async-storage` 2.2). Regenerated 2 component snapshots (RN 0.81 dropped an internal
  `hardwareAccelerated` Modal prop — benign).
- Verified: `npm run lint` ✓, `npm test` ✓ (21 suites / 35 tests), `expo-doctor` 16/18
  (the 2 remaining fails are pre-existing tech debt, not from this upgrade: `eas-cli`
  in deps, and `react-native-fs` unmaintained/untested-on-New-Arch + deprecated
  `expo-random`).
- Needs manual verification: EAS build on SDK 54 (native side can't be checked locally).
  Follow-ups for later sessions: continue 54→55→56→57; drop `eas-cli` from deps; replace
  `react-native-fs` (New Arch) and `expo-random` (→ expo-crypto).

## 2026-07-10

- Batch of STRATEGY §2 code bugs (P0 + the concrete P1 list). All pure logic fixes
  with tests; no UI strings, so no l10n change.
- **P1 error counter** (`reduce.ts:340`): `test.en || 0 + 1` parsed as `test.en || 1`
  (JS precedence: `+` binds before `||`). Now `(test.en || 0) + 1`. This is the
  downgrade branch's error tally — the data the whole philosophy depends on.
- **P1 endVerseNum** (`addressFromString.ts:107`): fallback assigned `chapterEnd` to
  the verse field. Reachable value was always `null` today, but the intent was wrong;
  set both end fields to explicit `null`. Added a single-verse regression test.
- **P1 case-mismatch book detection** (`addressFromString.ts:34-42`): the "which
  title matched" check compared a lower-cased string against an original-case title
  (`.includes(t(book.longTitle))`), and `string.indexOf(justBook)` re-ran an
  original-case search — so `GENESIS 1:1` mis-sliced. Rewrote to compare lower-cased
  on both sides and slice by `matchedTitle.length` (the book is guaranteed at index 0
  by the outer `startsWith`). Keeps original-case slice for the returned string.
  Added an upper-case parse test.
- **P0 L11 translation + P1 comparator** (`createL11Tests.ts`): the translation
  filter (`languageFilteredPassages` by `verseTranslation`) was already present and
  correct — the remaining half was the "closest passages" sort, whose comparator read
  only `b` and returned a value independent of `a` (not a valid comparator, so no real
  ordering). Extracted a `proximity(p)` scorer and compared `proximity(b) - proximity(a)`.
  Added `createL11Tests.test.ts` locking the P0 invariant: every option shares the
  target's translation. Marked P0 done.
- **P1 console.error purge**: `addZero.ts` and `aboutSettings.tsx:61` → `logger`.
  Gotcha: `logger` imports `addZero`, so naively logging from `addZero`'s catch risks
  recursion. It's safe here because `logger` only calls `addZero` on ≤2-digit date
  parts (year is not wrapped). Separately, `addZero` *threw* on any 3-digit input
  (`addZero(176)` → `Array(-1)`), silently leaning on the catch; added `Math.max(0, …)`
  so it never throws (outputs unchanged), making the catch genuinely exceptional
  before routing it to the logger. Left `logger.ts`'s own `console.error` (it can't
  log itself). The circular import is call-time only (both bindings used inside
  functions, never at module top level) — safe under Metro/Babel.
- Verified: `npm run lint` ✓, `npm test` ✓ (22 suites / 38 tests, +1 suite +3 tests).
- Still open in §2: P1 login e2e vs the VPS (needs the running API + a device — not
  doable locally); P1 behavior/safety (destructive-action confirms, archive-gated
  delete). Left for their own sessions.

## 2026-07-10 (2) — destructive-action confirms + login flow

Two §2 P1 items in one session (Fedir asked to batch them).

### Destructive-action confirmations + archive-gated delete
- Audited every destructive surface. Already covered: account deletion (type-to-confirm
  modal in `userSettings`), end-session (exit-confirm modal + `beforeRemove` guard in
  `testsScreen`). Archive-gated delete was ALSO already enforced — both the editor
  Remove button and the list swipe-delete only appear when the passage has the ARCHIVED
  tag. So the only real gap was **no confirmation before deleting a passage**.
- The MiniModal + Cancel/confirm pattern was duplicated 3×, so added a reusable
  `ConfirmModal` component (`confirmColor` defaults red) to the library and used it for
  passage deletion in both entry points: PassageEditor renders its own (so the confirm
  sits above the editor Modal), ListScreen holds a `passageIdToRemove` for swipe-delete.
  Left the existing exit/fetch modals alone (refactoring them is the §4.6 unify task,
  not opportunistic work). New l10n key `PassageDeleteConfirmationText` (en+ua).
- Tests: `ConfirmModal.test.tsx` (snapshot + fires onConfirm/onCancel on the right button).

### Login end-to-end (§2 P1)
- Fresh login itself was fine (login POST has no auth header; getUserData uses the
  just-issued token) — the bugs were in the token-refresh path in `fetch.ts`:
  1. **Inverted logic**: on an expired access token it called the refresh endpoint only
     when the refresh token was ALSO expired (server 403s that), and logged the user out
     when the refresh token was still valid. Swapped to: refresh while the refresh token
     is valid, logout when it isn't.
  2. **Refreshed token dropped**: after a successful refresh it updated SecureStore but
     not `headers.Authorization`, so the retried request still carried the old expired
     token. Now applies the new token to the outgoing request (via a mutable
     `currentHeaders`).
- Extracted the duplicated inline JWT decode into `src/utils/isTokenExpired.ts`
  (`decodeJwtPayload` + `isTokenExpired`, malformed/missing → treated as expired) and
  covered it with tests. Removed the now-unused `buffer` import from `fetch.ts`.
- **Verified the contract against bbh-api source** (the part doable without a device):
  login → `{ token, refreshToken }`, refresh → `{ newAccessToken, refreshToken }`,
  getUserData shapes, and status codes (refresh 403s expired refresh-token / 406s a
  still-valid access token) — all match the client, and my fix aligns with those guards.
  `api/version` returns the server package version `0.0.1` == client `API_VERSION`.
- Could NOT do: the live on-device round-trip against the VPS (HOST is an EAS build
  secret; no public domain). That stays Fedir's milestone pass — marked `[~]` in §2.
- Verified: `npm run lint` ✓, `npm test` ✓ (24 suites / 45 tests).

## 2026-07-10 (3) — P2: list virtualization + notification channel l10n

Fedir asked to "do P2 tasks". §2 P2 has three items; I did the two that are
tractable and verifiable off-device, and deferred the third (intent receiver) with
a documented rationale rather than mark it done blind.

### Notification channel name localized (§2 P2)
- `notifications.ts:301` had `name: "Reminders" //TODO translate`. The first arg to
  `setNotificationChannelAsync("Reminders", …)` is the channelId (referenced by
  triggers via `channelId: "Reminders"`) — that must NOT change. Only the user-visible
  `name` is localized.
- Added l10n key `notificationChannelName` (en: "Reminders", ua: "Нагадування").
- `registerForPushNotificationsAsync(langCode = LANGCODE.en)` now builds the name via
  `createT(langCode)`; caller in `useApp.ts` passes `state.settings.langCode`.

### Passage list virtualization + rendering (§2 P2, projectdiary "optimize list")
- `listScreen.tsx` rendered the whole passage list as `ScrollView` + `sortedPassages.map()`
  → every passage mounted regardless of visibility. Converted to `FlatList`
  (`initialNumToRender=10`, `windowSize=11`, `removeClippedSubviews`) so only visible
  rows mount — the actual "more optimized way to render passages list" from the diary.
- Moved the search row OUT of the scroll area (it's now a sticky sibling above the list).
  Deliberate: putting the `TextInput` in `ListHeaderComponent` would refocus/lose the
  keyboard on every keystroke (classic FlatList gotcha). Sticky search is also better UX.
- Hidden-passages count → `ListFooterComponent`. Memoized `allTags` (`useMemo`).
- Did NOT: memoize the filter/sort (search dep recomputes on each keystroke anyway;
  wrapping it forced eslint-indent churn for marginal gain) or `React.memo` the rows
  (`t`/`theme` from `useApp` are recreated each render, so memo wouldn't fire until the
  theme/l10n context refactor §4.3 makes them stable — noted there).
- No `listScreen` snapshot exists, so nothing to regenerate; behavior change is
  structural (virtualization) — SAY: needs Fedir's on-device scroll/keyboard check at
  the next milestone (list scroll, search focus retention, swipe actions still work).

### Intent receiver — DEFERRED (§2 P2 → milestone 0.4.0)
- It's a native task: `plugins/handlingIntents.js` currently pushes a bogus custom
  action (`…PROCESS_TRANSACTION`) instead of `android.intent.action.SEND` + `text/plain`,
  and there's no cold-start reader for the shared text. Verifying any of this needs an
  EAS device build, which can't happen in-session. The JS side already exists
  (`handleTextFromIntent` + `navigateWithState({…, passageText})`), so when it's picked
  up it's mostly native-plugin + a share-intent module. Left `[ ]` in STRATEGY §2 P2.

Verified: `npm run lint` ✓ · `npm test` ✓ (24 suites / 45 tests / 22 snapshots).

## 2026-07-10 (4) — share-intent receiver: found why text never arrived

Fedir asked me to make a best-effort fix so a device build can test whether shared
text actually reaches the app (it opened from the share sheet but had "no text to
manage"), then write him a test checklist.

### Root cause
The Android `SEND`/`text/plain` intent filter was already correct (in
`app.config.js` `android.intentFilters`) — that's why the app showed in the share
sheet and launched. But **nothing ever read `Intent.EXTRA_TEXT`**. `App.tsx` only
listened to `Linking` `"url"` events, and `Linking` only surfaces `VIEW`/URL (deep
link) intents — a `SEND` action carries its payload in `EXTRA_TEXT`, which never
comes through `Linking`. There is no built-in Expo JS API to read it; it needs a
native module.

### Fix
- Added `expo-share-intent@^5.1.1` (v5 targets Expo SDK 54; peers `expo-linking`/
  `expo-constants` already satisfied). It ships a native module that reads the SEND
  intent + a config plugin.
- `app.config.js`: added the plugin `["expo-share-intent", { disableIOS: true,
  androidIntentFilters: ["text/*"] }]`. Android-only (build-dev is Android; iOS share
  extension needs an app-group id + Xcode target — out of scope). Verified via
  `npx expo config --type introspect`: iOS disabled, `text/*` SEND filter added,
  MainActivity `launchMode=singleTask`.
- `App.tsx`: `useShareIntent({ debug, resetOnBackground })`; on `hasShareIntent` it
  `logger.write`s + `toastShow`s the text (test instrumentation — the proof Fedir
  needs) and routes it into the existing add-passage flow via `navigationRef.navigate`.
- `navigator.tsx`: exported `navigationRef` (`createNavigationContainerRef`) so App can
  navigate imperatively; the cold-start case retries until the container is ready.
- Reused existing plumbing: `listScreen` already reads `route.params.passageText` →
  `handleTextFromIntent` (parse address + prefill PassageEditor).

### Deliberately kept (not cleaned up yet — do it AFTER the build confirms arrival)
- The manual SEND filter in `app.config.js` is now redundant (plugin adds an
  equivalent). Kept it so the app is GUARANTEED to stay in the share sheet on a build
  I can't verify; cost is a possible duplicate share-sheet entry (cosmetic).
- `plugins/handlingIntents.js` (bogus `PROCESS_TRANSACTION` action) is dead but left
  untouched to minimize moving parts on this build.
- The `Shared text: …` toast is hardcoded debug output (like the existing devMode
  `Linking` toast), NOT l10n'd — it's temporary. Replace with the proper confirm-modal
  ("minimal scope" spec) once arrival is confirmed.

### Latent bug fixed along the way
`listScreen` called `handleTextFromIntent(passageText)` **during render** (not in an
effect). It calls `setSelectedPassage` with a fresh object each time → an infinite
render loop the moment `passageText` is ever defined. It never fired before because no
intent text ever reached the screen; my routing would have triggered it. Moved it into
`useEffect(..., [passageText])` so it runs once when the shared text arrives.

### Cannot verify in-session
Native behavior needs an EAS build on a real device. `useShareIntent` won't work in
the OLD dev client / Expo Go — Fedir must rebuild (`npm run build-dev`) first. If the
build errors on `expo-share-intent`, the fallback is to remove the plugin + revert
App/navigator (all changes are additive).

Verified here: `npm run lint` ✓ · `npm test` ✓ (24 suites / 45 tests / 22 snapshots) ·
`npx expo config --type introspect` shows the expected manifest mods.

## 2026-07-10 (5) — store-review demo account + login can't accept its password

Fedir submitted `test@bbh.com` / `3m39v023m` to Google Play as reviewer credentials,
but (a) the account didn't exist, and (b) the login screen wouldn't even let him
submit that password. Two-repo fix.

### Why login blocked the password (client)
`loginScreen.tsx` gated the button on `isPasswordValid` — a regex requiring lower+upper
+digit+special, 8–40. `3m39v023m` has no uppercase/special → button permanently
disabled. Those are REGISTER rules; login should accept whatever the account's password
is (server verifies it, and old accounts may predate any rule). Replaced with
`isPasswordEntered = tempPassword.length > 0`; `loginPossible = isEmailValid &&
isPasswordEntered`. Removed the password-rules hint + red/green validity icon logic on
login. No l10n change (kept the now-register-only `passwordRulesLabel` key).

### Auto-provision the demo account (bbh-api)
Accounts are only ever created by `POST /api/user/create` — there was no seed, so the
account genuinely didn't exist on the VPS. Added:
- `constants.ts`: `TEST_USER_UUID/EMAIL/NAME/PASSWORD` (env-overridable; defaults are the
  published review creds — deliberately public, documented as such).
- `base.servise.ts` `ensureTestUser(db)`: idempotent, create-if-missing (ensures the
  users table first so a fresh server self-heals). `isEmailConfirmed=1` so no inbox
  needed. Fixed uuid so the guards below can identify it cheaply.
- `app.ts`: calls `ensureTestUser(db)` in the `listen` callback (runs on every deploy,
  skipped under supertest since it's inside `require.main === module`).

### Protect it (Fedir asked to "think on blocking deletion etc.")
In `user.controller.ts`:
- `removeUserHandler`: 403 if target is `TEST_USER_UUID` — a reviewer can't delete it.
- `editUserHandler`: 403 if target is `TEST_USER_UUID` — can't change its password/profile
  (which would break the published creds).
- `authorizeUserHandler`: the demo email is exempt from the 5-attempts/hour lockout, so a
  fumbling reviewer can't lock themselves out (its password is public anyway, so
  rate-limiting it buys nothing).

### Tests
Added 3 cases to `__tests__/controller/user.controller.test.ts`: provision via
`ensureTestUser` + login with the known creds → 200; edit demo → 403; delete demo → 403.
(Had to `npm install` bbh-api deps first — node_modules was empty; used `--no-package-lock`
since the repo tracks `yarn.lock`, so nothing new was committed to lock state.)

### Env / deploy notes for Fedir
- The demo user is seeded into whatever DB the running server points at, so it appears on
  BOTH staging and production after their next deploy. The account must exist on the same
  env as the build under Play review (prod build → `biblebyheart.app`).
- To rotate the creds without a code change, set `TEST_USER_PASSWORD` (etc.) in that
  server's `.env` — but note the edit-guard means you can't change the password via the
  API/app; change it via env + redeploy (delete the row first, since seed is
  create-if-missing) or temporarily lift the guard.

Verified — client: `npm run lint` ✓ · `npm test` ✓ (24/45/22). bbh-api: `tsc --noEmit` ✓
· `eslint` ✓ · `npm test` ✓ (5 suites / 32 tests, incl. the 3 new demo-account cases).

## 2026-07-10 (6) — demo account was deployed but failing: live DB schema drift

Checked whether the (5) changes were live on the real VPS (via `bbh-api/.agent` SSH
access). They WERE deployed — `origin/production` had the merged PR, both Docker
containers were fresh, and startup logs showed `ensureTestUser` running — but it errored
on BOTH staging and production:
`SQLITE_ERROR: table users has no column named isEmailConfirmed`.

### Root cause: column-name drift
The live `users` table column is **`emailConfirmed`**; all current code (createUsersTable,
createUserHandler, confirmEmailHandler, my ensureTestUser) expects **`isEmailConfirmed`**.
Every other column matched — just this one. The code renamed it at some point but the live
DB (created once via `POST /api/createDB`, `CREATE TABLE IF NOT EXISTS` never migrates) kept
the old name. **This also silently broke user registration on live** (createUser inserts
isEmailConfirmed → 500), not just the demo seed. Production had 1 real user
(fedir.moroz.dev@gmail.com), staging 0.

### Fix applied (with Fedir's approval, prod DB mutation)
On the VPS as root, in /usr/src/bbh-api:
1. Manual backup first (`/usr/local/bin/bbh-db-backup.sh` → `staging_..._201452.db` +
   `production_..._201452.db` in /usr/src/bbh-backups; daily 03:00 backup is a second net).
2. `ALTER TABLE users RENAME COLUMN emailConfirmed TO isEmailConfirmed;` on both DBs
   (guarded: only if old col present + new absent). Data-preserving; fedir's row kept.
3. `docker compose restart production staging` → seed re-ran cleanly:
   "Demo test user provisioned (test@bbh.com)" on both.
Verified: DB rows present (`test@bbh.com | testbbh | confirmed=1 | free`); login 200 on
localhost:2410/2411 AND on public https://biblebyheart.app + https://staging.biblebyheart.app.

### Follow-ups / watch
- No code change was needed (code is correct on `isEmailConfirmed`; the DB was the outlier).
- **Systemic risk**: bbh-api has NO DB migration mechanism. `createUsersTable` is
  `IF NOT EXISTS`, so any future column rename/add in code will again silently diverge from
  the live schema and break inserts. Added to STRATEGY §3 watchlist. A real migration step
  (or an idempotent "ensure columns" on boot) is worth doing before more schema changes.
- Minor: staging/production container logs show a stray `npm error ... nodemon` line from an
  earlier start; containers are Up and serving 200, but the prod entrypoint running under
  `nodemon` is worth revisiting (should be plain `node dist/app.js` in prod).

## 2026-07-11 — on-device test fixes (share intent lands text; reminders channel; 409; version)

Fedir built + tested on device. Result: share intent WORKS — text arrives via toast on
both cold and warm start. Fixed the tractable bugs from his report:

### Share intent didn't fill address/verse, and "clicking list opens address selector"
Same root cause. `handleTextFromIntent` parsed the address + verse text into
`selectedPassage`, then opened the **AddressPicker** (`setAPOpen(true)`). But AddressPicker
is bound to a different state (`selectedAddress`, empty) and its submit rebuilds a fresh
EMPTY passage — so the parsed data was thrown away, and the address selector popping up on
arrival read as "clicking list opens address selector". Fix: open the PassageEditor directly
(`setPEOpen(true)`, and `setAPOpen(false)` to close any first-passage picker) with the
already-parsed `selectedPassage`. That's the intended confirm-before-add step.

### Reminders showed under "Miscellaneous", not the localized "Reminders" channel
The manual-reminder scheduler in `notifications.ts` built its trigger without a `channelId`,
so Android used the default channel. (The auto-time trigger already set it.) Added
`channelId: "Reminders"` to the manual trigger. Note for Fedir: Android caches a channel's
display NAME at creation — the localized name only updates when the channel is first
registered (fresh install / cleared data), which matches what he saw ("works after restart
when it registers"). That's an Android limitation, not a bug.

### Registration 409 was unfriendly
Register showed title "Unable to create user 409" + the raw server statusText. Now:
friendly `netUnableToCreateUser409` ("Couldn't create account") + new
`netUnableToCreateUser409Sub` ("...email or username already exists. Try logging in.")
in en + ua.

### Centralize app version (Fedir's earlier request)
`app.config.js` hardcoded the version (had drifted: package.json 0.1.1 vs config 0.1.0).
Now `const { version } = require("./package.json")` → `version,`. Verified via
`expo config --type public`: resolves to 0.1.1. Bump the version in package.json only.

Verified: `npm run lint` ✓ · `npm test` ✓ (24/45/22) · `expo config` evaluates.

### Reported back to Fedir but NOT done here (triage)
- **Animations "worse than before", wants full rewrite** → that's the planned STRATEGY
  §4.2 (navigator → react-navigation) + §4.8 (candy UI / reanimated) refactor; its own
  milestone (0.2.0/0.3.0), not a quick fix. The FlatList swap may also have changed scroll
  feel — revisit during that refactor.
- **"add login by username but just email"** → ambiguous; asked Fedir to clarify (allow
  login via username too? or drop the username requirement from registration?).
- **Confirmation email never arrives** → NOT app code: the VPS gmail SMTP creds are
  rejected (`535-5.7.8 Username and Password not accepted` seen in server logs). Needs a
  valid Gmail App Password in `.production.env`/`.staging.env` `MAIL_PASS` on the VPS.

## 2026-07-11 (2) — login by email OR username; plan updates (redesign, email)

Follow-up to the on-device report.

### Login by email OR username (Fedir: "requires email, not handy")
- API `authorizeUserHandler`: `SELECT ... WHERE email = ? OR userName = ?` (same value
  bound twice). The client still sends the identifier in the `email` body field, so the
  contract is unchanged and existing email logins keep working. Added a supertest case
  logging in by username (now 33 tests).
- Client `loginScreen.tsx`: field accepts email OR username — `isIdentifierValid =
  isEmailValid || isUserNameValid` (username rule mirrors registration). Placeholder →
  new l10n `provideEmailOrUsernameLabel` (en/ua); dropped the email-only keyboard/
  autocomplete hints.
- Lockout-exempt demo account still works: after the OR-match, `user.email` is still the
  real email, so the `TEST_USER_EMAIL` check is unaffected.

### Plan updates (Fedir asked)
- STRATEGY §4.8: added the 2026-07-11 note that the "animations feel worse / full rewrite"
  feedback IS this candy-UI refactor (+ §4.2 navigator) — its driver, not a separate bug.
  Redesign was already in the plan; just tied the feedback to it.
- STRATEGY §2: added the confirmation-email API task (Gmail SMTP creds rejected on VPS →
  set a valid App Password in `MAIL_PASS` in the env files + restart; env-only, no code;
  suggested a boot-time SMTP-auth check). Also recorded the reminders-channel + login-OR
  fixes as done.

Verified — client: `npm run lint` ✓ · `npm test` ✓ (24/45/22). bbh-api: `tsc` ✓ ·
`eslint` ✓ · `npm test` ✓ (5 suites / 33 tests).

Note: the API login-OR change needs a bbh-api deploy; the client changes need a new build.

## 2026-07-11 (3) — P2 mailer fix: rotate Gmail App Password + boot SMTP check

STRATEGY §2 P2 "Confirmation email not sending". Root cause was known (Gmail rejected
the old creds, `535-5.7.8`); fix is env-only. Fedir supplied a fresh Gmail **App
Password**.

### The fix (env-only, no app-repo code)
- Updated `MAIL_PASS` in `.production.env` + `.staging.env` in BOTH places:
  - locally in `c:/Code/bbh-api` (Edit), and
  - on the VPS via `ssh root@… -i ~/.ssh/id_ed25519`. Wrote back through redirection
    (`sed … > file`) so the original inode's owner/mode are preserved (`deploy:deploy`,
    `600`) — a `sed -i` as root would have flipped ownership to root and broken deploy's
    read. Kept timestamped `.bak` copies during the edit, removed them after.
- `MAIL_LOGIN` was already correct (`biblebyheartapp@gmail.com`), left as-is.
- Restarted both containers (`docker compose restart production staging`). The env is a
  bind-mounted volume consumed via `--env-file`, so a plain restart re-reads it — no
  rebuild/redeploy needed.

### Live verification (real send, from inside the prod container)
- Ran a throwaway script with `node --env-file=/app/.production.env`: `transporter.verify()`
  → **auth accepted**, then `sendMail` to fedir.moroz.dev@gmail.com → **accepted**. Cleaned
  the script up afterwards. This is the first confirmed real email from the server.

### GitHub Actions secrets — NO change needed (Fedir asked mid-task)
Only `VPS_HOST` + `SSH_DEPLOY_KEY` are Actions secrets (SSH deploy). Mail creds live solely
in the gitignored env files on the VPS + local copies; `git reset --hard` on deploy never
touches gitignored files, so they persist.

### Boot-time SMTP check (the suggested hardening — committed, NOT yet deployed)
- `bbh-api/src/utils/email.ts`: added `verifyMailer()` — non-throwing `transporter.verify()`
  that logs `info` on success / `warn` on failure, so bad creds surface on boot instead of
  silently failing per-send.
- `bbh-api/src/app.ts`: call it once at startup after `ensureTestUser` (awaited, non-blocking).
- Tests: 2 cases in `__tests__/utils/email.test.ts` with a mocked transporter (no network).

Verified — bbh-api: `tsc --noEmit` ✓ · `eslint` ✓ · `npm test` ✓ (5 suites / 35 tests).
No bible-by-heart app code changed (docs only: STRATEGY §2 checked off, FILEMAP email.ts/
app.ts descriptions). The env/restart fix is LIVE now; the `verifyMailer` code hardening
awaits the next bbh-api deploy.

## 2026-07-11 (4) — STRATEGY §3 risks: DB migration mechanism + converter-chain coverage

Fedir asked to start §3 (risks watchlist) from the top and take the first two. §3 is mostly
"watch, don't schedule", so most items defer to a refactor/milestone; the two top items had
genuinely actionable, off-device-verifiable work.

### Risk #2 — bbh-api has no DB migration mechanism (the crown jewel, DONE)
Root of the 2026-07-10 prod incident: `CREATE TABLE IF NOT EXISTS` never alters a live table,
so a column added/renamed in code silently diverges from the deployed sqlite and breaks INSERTs.
- `services/base.servise.ts`: added `usersTableColumns` — a declarative authoritative column
  list mirroring `createUsersTable` (name + TEXT/INTEGER type) — and `ensureUsersTableColumns(db)`:
  ensures the table exists, reads `PRAGMA table_info(users)`, and runs `ALTER TABLE users ADD
  COLUMN` for any expected column the live table lacks (logs each add). Idempotent; a no-op on an
  up-to-date DB. Types only — `ALTER ADD COLUMN` can't carry NOT NULL/UNIQUE/PK without a default,
  and a nullable add is all that's needed to stop INSERTs erroring on a missing column (code always
  supplies the value on insert).
- Wired on boot: `app.ts` calls it before `ensureTestUser`; also `ensureTestUser` now calls it
  (replacing its bare `createUsersTable`) so both a fresh and a drifted server converge.
- LIMITATION documented in code + STRATEGY: this ADDS missing columns; it does NOT rename/backfill.
  For a rename it leaves the old column orphaned (harmless) + adds the new one empty. A real
  rename/backfill still needs an explicit one-off migration (suggested: key it on `PRAGMA
  user_version`). Chose the simple "ensure columns" path per the §3 note — zero-maintenance for the
  common ADD case, which is what keeps biting us.
- Tests: `__tests__/services/migration.test.ts` (in-memory DBs, isolated) — fresh DB gets every
  column; a drifted table (has old `emailConfirmed`, lacks `isEmailConfirmed`) gains the missing
  column while preserving its existing row; second run is a no-op. bbh-api now 6 suites / 38 tests.
- NOT yet deployed — ships on the next bbh-api push (like the earlier `verifyMailer` hardening).

### Risk #1 — state converter chain is high-blast-radius (partial: coverage added, bugs logged)
The mitigation the plan names is the §5 backup-prompt feature (a whole 0.1.2 task), so I did the
safest high-value off-device thing instead of editing the boot flow blind: the first regression
tests for the converter chain (§5 calls these "highest-value tests in the repo").
- `__tests__/utils/stateVersionConvert.test.ts`: builds a realistic 0.0.8 state from the real
  `createAppState008()` factory (+ a passage, a finished and an unfinished test) and asserts the
  full chain to current: version → "0.1.0", passages preserved, only finished history kept,
  settings (langCode, leftSwipeTag) carried, auth/account stripped by `to010`, unknown version →
  null. This exercises the recursive `convertState` engine (partialMatch→goodMatch→finalMatch) plus
  `to009` (the complex one) and `to010`. Legacy 0.0.6/0.0.7 hops still uncovered (noted).
- While reading the boot path (`App.tsx` `loadState`) found TWO real safety-net bugs — logged in
  STRATEGY §3 for their own device-verified session (they overlap the §4.2 boot rewrite + §5 backup
  feature, and editing the single most critical data path blind risks the very loss I'm guarding):
  1. The pre-conversion snapshot and the daily backup share ONE key (`STORAGE_BACKUP_NAME`), so
     within 24h `useApp`'s daily backup overwrites the last-known-good raw state with the
     (possibly bad) converted state → a wrong converter's output is unrecoverable after a day.
  2. The critical-error "Restore from backup" hard-rejects any snapshot whose `version !== VERSION`
     — but the pre-conversion snapshot is by definition the OLD version, so restore refuses it
     exactly when you'd need it after a bad conversion. Fix: dedicated never-overwritten pre-convert
     key + let restore accept & re-convert an old-version snapshot.

Verified — bible-by-heart: `npm run lint` ✓ · `npm test` ✓ (25 suites / 50 tests, +1 suite +5).
bbh-api: `tsc --noEmit` ✓ · `eslint` ✓ · `npm test` ✓ (6 suites / 38 tests, +1 suite +5).
No UI strings added → no l10n change. Neither repo's runtime behaviour was changed in a way that
needs a device (migration is off-device-provable; converter change is tests-only) EXCEPT the two
logged boot bugs, which are deferred, not shipped.

## 2026-07-11 (5) — STRATEGY §3 risks: leftSwipeTag, addressFromString ambiguity, getStats + readable auth errors
Cleared three §3 watchlist items plus a Fedir mid-session ask (readable login/register errors).

**1. `settings.leftSwipeTag` dangling after tag removal.** Tags have no registry — they exist only
while a passage carries them — so removing the last passage with a given tag left `leftSwipeTag`
pointing at a tag that no longer appears in the settings Select or anywhere. Fix: a centralized
self-heal in `reduce.ts`'s finalization block (runs for every action): if `leftSwipeTag !==
ARCHIVED_NAME` and no passage carries it, fall back to `ARCHIVED_NAME`. Cheap, covers setPassage /
setPassagesList / removePassage / importPassages and any future passage mutation. Cleared the four
`TODO check on tag removing` comments (initials, models, stateVersionConvert). Test in reduce.test.ts:
set a custom tag → keep while present → remove tag from the passage → heals to ARCHIVED_NAME.

**2. `addressFromString` multiple-match ambiguity.** Several books can be prefixes of the input
(e.g. short title "Jud"/Jude is a prefix of "Judges"). The old code returned the FIRST-matched
`bookIndex` but the LAST-matched number slice / language via shared closure vars — an actual
inconsistency, not just a TODO. Rewrote the matcher to collect ALL candidate matches, then pick the
most specific one (longest matched title; tie-break → the one that actually parsed a number), and
take every returned field from that single chosen match. Regression test: "Judges 1:1" → Judges
(idx 6), not Jude (idx 64). Existing "Gen 1:2-2:3" / uppercase / single-verse tests still pass.

**3. `getStats.ts`.** Implemented `getMaxStroke` (longest run of consecutive active days over all
history; mirrors `getStroke`'s local calendar-day bucketing so the two agree) and wired it into
`getAppStats` (`maxStroke` was hardcoded `0`). Capped `mostOftenAdressErrors` at
`TOP_ADDRESS_ERRORS_LIMIT = 10` (was uncapped → unbounded array as history grows). Tests: max-stroke
over the yesterday+today fixture = 2, empty = 0, appStats.maxStroke = 2, and a 12-distinct-address
history caps to 10. **Deliberately left** the day-average `:291` question ("include missing days or
not?") untouched — it's a real design decision for Fedir and changing it would silently move
displayed stats numbers.

**4. (Fedir mid-session) readable auth errors.** Login/register Alerts were dumping raw
`result.response.statusText` (often empty or technical) as the body. Replaced those bodies with
localized subtitles and added `default` cases so unhandled statuses still inform the user; also added
an Alert to the register `catch` (it previously only logged). New l10n keys in en+ua:
`netWrongCredentials` (login 401), `netCheckDataAndRetry` (400), `netServerErrorSub` (500),
`netSessionExpired` (get-user-data 401), `netTryAgainLater` (default/unexpected + register catch).

Gotcha: the day-string streak logic (`getStroke`/`getMaxStroke`) inherits the known DST/timezone
fragility (§3) — a 25h DST day can look like a break. Kept consistent with the existing `getStroke`
rather than diverging; worth a dedicated timezone regression pass (§5) later.

Verified — `npm run lint` ✓ · `npm test` ✓ (25 suites / 54 tests, +4). l10n: 5 keys × en+ua ✓.
Runtime behaviour changes (swipe-tag heal, stats numbers, auth Alerts) are logic/tests-provable;
the auth Alert copy is worth an eyeball on-device at the next milestone but needs no code verify.

---

## 2026-07-11 (navigator refactor — STRATEGY §4.2/§4.3, WIP)

Big navigator + state-management refactor (Fedir: full context migration, phases 1+2
in one sitting). **Broken-in-between is expected here** — shipped as work-in-progress.

- **Root problem removed:** the entire `AppState` was threaded through react-navigation
  route params (each screen kept its own `useState(route.params)` copy via `useApp`,
  persisted it, and forwarded it with `navigateWithState`; `useApp` also hijacked the
  back gesture to re-navigate home carrying state). That single pattern caused every
  reported pain point (modals/gestures losing edits, no clean save, deep-link/notif-tap
  stubs, header offset).
- **New:** `src/context/AppContext.tsx` — one global `AppProvider` owning state +
  `dispatch` (wraps `reduce`) + persistence + daily backup + notification-response
  handling + theme + `t`. `useAppContext()` replaces `useApp` everywhere.
- **Deleted** `src/screeenManagement.ts` (`navigateWithState`) and `src/utils/useApp.ts`.
  All 9 screens + `settingsLists/userSettings` + `services/fetch.ts` migrated to
  `dispatch(action)` + `navigation.navigate(SCREEN.x, smallParams?)`. Removed all
  `initialParams={{...state}}`; enabled `gestureEnabled`.
- **Deep links wired:** `linking` config on `NavigationContainer`
  (`bbh://`, `bible-by-heart://`, `https://biblebyheart.app` → screens). Notification-tap
  now routes through `navigationRef` instead of the old stub. *(Fedir confirmed on a build:
  intent receiver + deep linking WORK.)* Verified https App Links still need
  `/.well-known/assetlinks.json` served by the API before https opens the app.
- **Editor is now a screen:** `src/screens/PassageScreen.tsx` + reshaped `PassageEditor`
  (Modal → full-screen View). Explicit **Save** button, **dirty-check** discard-confirm on
  back, `isNew` title. Add-from-address path: listScreen navigates
  `SCREEN.passage {address}` / `{passageId}` / `{address,passageText,translationId}` (intent).
  New l10n (en+ua): `Save`, `Discard`, `AddPassageTitle`, `PassageDiscardConfirmText`.
- **Safe-area headers:** `Header.tsx` + `PassageEditor` header use `useSafeAreaInsets()`
  (`paddingTop: insets.top`) so the header clears notches / Dynamic Island. Left the global
  `theme.screen.paddingTop:30` alone to avoid regressing the header-less home/finish screens
  (small extra gap on header screens; can tune later).
- **State-mutation bug fix (Fedir: "adding passage / any state manipulation breaks"):**
  root cause was `App.tsx`'s `useEffect(() => loadState())` with **no dependency array** —
  it re-read storage and re-seeded every render, an infinite async reload loop that pegged
  the JS thread once one shared provider owned state. Now loads exactly once (`didLoad` ref);
  AppProvider is the sole storage writer thereafter. Also froze `PassageScreen`'s source
  passage in a `useState` initializer so it can't mint a new random id per render.

Reanimated NOT installed this session (only gesture-handler, already a dep). Before §4.8
add `react-native-reanimated` + its babel plugin.

Deprioritised by Fedir (noted, not done): settings sub-menus are still modals with a
"strange animation" — convert each to a screen + drop the animation; `UserSettingsList`
renders even when logged out (its `isAutorized` gate is commented out in `settingsScreen`,
pre-existing). Also pending: `npm test` (screen tests need an AppProvider wrapper now),
FILEMAP + STRATEGY checkbox updates.

Verified — `npm run lint` (tsc + eslint) ✓. `npm test` NOT run (screen tests will need a
provider wrapper — follow-up). Needs Fedir's next device build to confirm add-passage +
state mutations now stick.

## 2026-07-11 (navigator refactor cont. — settings modals → screens)

Follow-up to the navigator refactor. Fedir's two flagged bugs + two constants TODOs.

### Settings sub-menus: MiniModal → real stack screens (drop the "strange animation")
Every settings sub-menu used to be a `MiniModal` rendered inline in `settingsScreen`
(and 3 of them nested a *second* modal via `SettingsListWrapper` — a modal-in-modal).
Converted all of them to stack screens so drilling in is a normal push, not a modal slide.
- New shared shell `src/components/SettingsSubScreen.tsx` (View + `Header` w/ back +
  `StatusBar`, optional `headerRight` for an add button) — reused by all 9 screens.
- `settingsListWrapper.tsx` refactored from MiniModal-in-MiniModal to a **non-modal**
  body: list view and per-item editor are two views toggled by local state. Owning
  screen passes data handlers + `handleClose` (= `navigation.goBack`). Added `themeType`
  prop for the StatusBar.
- 9 new screens in `src/screens/` (PascalCase, per CODING_RULES §2 + PassageScreen
  precedent): `ListSettingsScreen`, `TranslationsSettingsScreen`, `TestsSettingsScreen`,
  `TrainModesSettingsScreen`, `NotificationsSettingsScreen`, `RemindersSettingsScreen`,
  `StatsSettingsScreen`, `AboutSettingsScreen`, `UserSettingsScreen`. Each reads
  `useAppContext()` (no state through route params).
- Registered all 9 in `navigator.tsx`; added 9 `SCREEN.settings*` enum members
  (constants.ts). `settingsScreen` now renders simple `action` rows that
  `navigation.navigate(...)` into each sub-screen.
- Removed the 6 old `src/components/settingsLists/*.tsx` (dir now empty). Logic moved
  verbatim into the screens (import/export, dev tools, account delete, etc.).
- **Kept as MiniModals** (they are dialogs, not sub-menus): About's info/legal/
  dev-password/log popups, and the delete-account confirmation in User settings.
- No new l10n — pure structural refactor, all `t()` keys already existed.
- Gotcha: `SettingsListWrapper` already wraps `renderEditItem` in a ScrollView, so the
  train-modes editor now returns a plain `View` (was its own ScrollView → would nest).
- `checkSchedule` reminders effect moved into `RemindersSettingsScreen` (the reducer
  already reconciles the OS schedule on every mutation via `reduce.ts:495`, so this is
  just the "reconcile while viewing reminders" belt-and-suspenders the old modal had).

### Bug: UserSettings shown when logged out (pre-existing, not from the refactor)
The `isAutorized` gate around the user sub-list was commented out in `settingsScreen`.
Re-enabled: the User/account row now only renders when `isAutorized`
(`haveToken && userData.uuid !== null`). Account settings are unreachable logged out.

### constants.ts TODO cleanup (Fedir: "ask if needed" — verified, both stale)
- `autoIncreaseLevel` "not sure whether implemented" — it IS: `reduce.ts:400` bumps the
  level, `TestsSettingsScreen` exposes the checkbox, wired through models/initials/
  converter. Removed the stale comment.
- Commented-out `colors = Platform.select({...})` Material-You block — dead, referenced
  nowhere. Deleted.

Verified — `npm run lint` (tsc + eslint) ✓ · `npm test` 54 passed / 22 snapshots ✓ (no
settings tests existed to update; only `settingsScreen` imported the removed files).
Needs Fedir's next device build to confirm the sub-menus feel right (push/pop instead of
slide-up) and that back navigation lands correctly from the nested list editors.

## 2026-07-11 (navigator refactor — bug/flow re-check, §4.2)

Re-checked the freshly-landed navigator refactor (commit fc3bc11) for bugs and flow
errors before moving further into §4. Read the whole new nav surface: `navigator.tsx`
(react-navigation stack + `linking`), `App.tsx` (share-intent + one-time load),
`AppContext` (notification-tap nav via `navigationRef`), and every screen's
`navigation`/`route` usage. Two real defects found + fixed; two smells confirmed
pre-existing and left alone.

### FIXED — crash: passage list opens with no route params
`listScreen.tsx` did `const { passageText } = route.params;`. react-navigation leaves
`route.params` **undefined** whenever the list is reached without args — which is the
*primary* path (home->list tap `homeScreen:118/146`, `PassageScreen` save `:61`, deep
link `bbh://passages`). Destructuring undefined throws → the passage list crashed on
open. `PassageScreen` already guarded (`route.params ?? {}`); listScreen didn't. Added
the same guard. (Almost certainly why it wasn't caught yet: the refactor is on `staging`,
not device-tested — the earlier diary flagged "needs a device build".)

### FIXED — deep-link flow: `bbh://passage/:passageId` never edited, always "add new"
Deep links deliver path params as **strings**; `PassageScreen` matched `p.id ===
params.passageId` with a strict `===` (number vs string) so `bbh://passage/12` never
found passage 12 and fell through to the create-new branch. Normalised: coerce a string
`passageId` via `Number(...)`, guard `NaN`, then match. Widened `PassageRouteParams.
passageId` to `number | string` so the type tells the truth (number in-app, string via
link). In-app numeric navigation unchanged.

### Confirmed pre-existing, deliberately NOT touched (not from this refactor)
- `ScreenModel.route: any` (`homeScreen.tsx:19`) — from `865b10f "Basic structure"`, not
  the nav refactor. CODING_RULES bans `any` in *new* code and says existing offenders get
  a dedicated pass, not opportunistic fixes. Only 2 screens read `route.params`
  (list/PassageScreen), so a proper `RootStackParamList` + typed screen props is a clean
  small follow-up — do it in the §4.4 typing/rename pass.
- `@ts-ignore` on `navigation.addListener("beforeRemove")` (`testsScreen.tsx:34`) — from
  `4cf5800`, predates the refactor. Same disposition.
- `testsScreen` calls `exitTests()` (which `navigation.navigate`s) during render when
  `!testsActive.length` — pre-existing "navigate during render" smell; left for the
  §4.6 level-component split.

Verified — `npm run lint` (tsc + eslint) ✓ · `npm test` 54 passed / 22 snapshots ✓.
No new files, no new l10n keys (pure bug fix). No screen tests yet (they need an
AppProvider wrapper — still the standing testing follow-up), so both fixes need Fedir's
next device build to confirm: (1) tapping into the passage list no longer crashes, and
(2) `bbh://passage/<id>` opens that passage in the editor.

## 2026-07-11 (shared contract package — STRATEGY §4.1)

Created the third repo, **`bbh-shared`** (`c:/Code/bbh-shared`) — the client↔server
contract both repos will depend on. Standalone package, **not a monorepo** (per
ARCHITECTURE §4). Scope kept deliberately tight ("unify only what's needed"): only
what actually crosses the wire or is duplicated verbatim today. Learning-data models
(full user/passage/history/settings) stay out until the sync feature (§6.2) needs them.

### What's in it
- `apiVersion.ts` — `API_VERSION` (= "0.0.1", matches bbh-api package.json served by
  `GET /api/version`), an `API_COMPATIBILITY` table + `isApiVersionCompatible()`
  (exact-match today, structured so version ranges slot in later without touching
  call sites), `ApiVersionResponse`.
- `endpoints.ts` — `API_ENDPOINTS` as the single source of truth for endpoint paths
  (mirrors the app's `API_LINK` enum and the server's `routes.ts`; keeps the server's
  real — misspelled — `requestPaswordReset` path so the string matches what's served).
- `auth.ts` — request/response DTOs for the user/auth endpoints. These replace the
  app's untyped `Record<string, any>` bodies in `services/fetch.ts`. Plus shared unions
  (`AppLanguage`, `ProfileVisibility`, `DataVisibility`, `UserRights`).
- `primitives.ts` — `AddressType` + `PASSAGELEVEL`/`TESTLEVEL` enums (byte-for-byte
  duplicated in both repos' `constants.ts`/`models.ts` right now).

### Drift found while mapping the contract (worth noting)
- The server's `AppAddressType` declared `endChapterNum`/`endVerseNum` as non-null
  `number`; the app (source of truth, §3.2) allows `null` for single-verse/chapter
  refs. Shared `AddressType` keeps the app's nullable shape — a future consumer of the
  server type will need this widened.
- App auth payloads are currently fully untyped (`Record<string, any>`) — the DTOs are
  the first real typing of that surface.

### Deliberately NOT done this session
Wiring either repo to *consume* the package. It touches CI: both run `npm ci`, which
can't resolve a sibling `file:../bbh-shared` path dep (the other repo isn't checked out
in the Actions runner). Needs a publish/registry decision (npm private pkg vs
`github:` git dep vs path-dep + CI checkout) — that's Fedir's call; the three options
are written up in the package README. Until wired, both repos keep their own copies;
the follow-up per-repo tasks replace those with imports. Broken-in-between: none — this
is purely additive (new repo), the existing app/API are untouched and still build.

### Win conditions
`bbh-shared`: `npm run lint` (tsc) ✓ · `npm test` (node:test, 3/3) ✓ · builds to
`dist/` (CJS + `.d.ts`) ✓. Initial git commit made in the new repo. In this repo:
FILEMAP updated (new "Repo 3" section) + this diary entry. No app code touched → app
lint/test unaffected; no new UI strings → no l10n change.

## 2026-07-11 (wire bbh-shared into both repos — STRATEGY §4.1 cont.)

Published `bbh-shared` to GitHub (public, `github:CalmTed/bbh-shared`) and wired both
repos to consume it as a **git dependency** pinned to tag `#v0.0.1`. Public repo ⇒ no
registry, no CI auth. Initial consumption kept minimal (unify only what's needed); the
bigger swaps (API_LINK, auth DTOs, user models) are deliberately left as follow-ups.

### Gotcha that shaped the design: Yarn 1 ignores a git dep's `prepare`
First attempt shipped `dist/` gitignored and relied on `prepare` (tsc) building on
install. npm does run `prepare` for git deps — **Yarn 1 does not**. bbh-api uses yarn,
so its install produced a `dist`-less package and `require("bbh-shared")` failed.
Fix: **commit `dist/`** (un-ignore it, drop the `prepare` script). Now every consumer
(npm, yarn, EAS) uses the committed build with no build step. Documented the "rebuild
`dist/` before tagging" step in the package README + release checklist. Re-cut tag
`v0.0.1` to the dist-committing commit (force-moved; the tag was minutes old and only
this in-progress wiring referenced it).

### What each repo consumes now
- **app** `src/constants.ts`: `API_VERSION` is now `import { API_VERSION } from
  "bbh-shared"; export { API_VERSION };` (import-then-export form, not `export … from`,
  so babel/Metro can't type-elide the value binding). `initials.ts` + `fetch.ts` still
  import it from `../constants` unchanged.
- **server** `src/models.ts`: `import type { AddressType, PASSAGELEVEL } from
  "bbh-shared"` (both used only in type positions here → `import type`, babel-safe).
  `AppAddressType` is now `export type AppAddressType = AddressType` (back-compat alias).
  This reconciles a real drift: the server type had non-null end fields; the shared
  (app-derived) type allows null.
- **server** `src/constants.ts`: local `PASSAGELEVEL`/`TESTLEVEL` enum defs removed,
  replaced by `export { PASSAGELEVEL, TESTLEVEL } from "bbh-shared"` (TESTLEVEL was
  entirely unused; PASSAGELEVEL only used as a type in models.ts).

### CI — no workflow YAML changes needed
Both pipelines already install from the manifest/lock: app runs `npm ci` (package-lock
updated by `npm install`), bbh-api runs `yarn install` (yarn.lock updated by `yarn
upgrade`). Public git dep ⇒ the Actions runners clone it with no token; committed `dist/`
⇒ no build toolchain needed for the dep at install time.

### Verification (local, mirrors CI)
- **bbh-api**: `yarn lint` (eslint) ✓ · `yarn tsc --noEmit` ✓ · `yarn test` 38/38 ✓
  (constants.ts still 100% coverage — the re-export survives babel).
- **app**: `npm run lint` (tsc + eslint) ✓ · `npm test` 54/54, 22 snapshots ✓.

### Not committed
The consumer-repo changes (package.json + lockfile + the 3 source edits in each) are
left **uncommitted** for Fedir to review/commit — this session only committed inside the
`bbh-shared` repo (its creation + the dist/ change). No new UI strings → no l10n change.

## 2026-07-11 (themed Text component — STRATEGY §4.3, first slice)

### Context
§4.3 is "theme + l10n React contexts: centralize; layered `t("page.title")` keys;
themed `Text` component." The centralize-into-context half already landed during the
§4.2 navigator refactor: `context/AppContext.tsx` is the single source of truth and
already hands out `t` and `theme` via `useAppContext()`. **Screens** consume that;
**base components** still prop-drill `theme`/`t`. This session took the smallest
self-contained, non-breaking slice: the themed `<Text>` primitive.

### What changed
- **New** `src/components/Text.tsx` — themed `<Text>`. Reads `theme` from
  `useAppContext()`; `color` prop selects a semantic color
  (`text` default / `textSecond` / `textDanger` / `mainColor`); caller `style` is
  merged AFTER the color so it still wins; all standard `TextProps` pass through.
  Kills the `color: theme.colors.text` boilerplate hand-threaded onto every RN `<Text>`.
- **`context/AppContext.tsx`** — now `export const AppContext` (was module-private) so
  tests / any narrow provider can supply a context value without mounting the full
  `AppProvider` (which fires storage + notification side effects on mount).
- **New** `__tests__/components/Text.test.tsx` — wraps a bare `AppContext.Provider`
  (value built from `createAppState()` + `getThemeFromScheme`): asserts the default
  primary color resolves per active theme (dark vs light), a semantic `color` resolves,
  and caller `style` overrides the themed color. 3/3.
- Docs: CODING_RULES §7 table + FILEMAP component list get the `Text` row; FILEMAP core
  table gains a `context/AppContext.tsx` line (was undocumented).

### Deliberately NOT done (the larger, riskier remainder of §4.3)
- **Migrating prop-drilled base components** (Header/Button/Checkbox/… ~18 files) off
  `theme`/`t` props onto `useAppContext()` + the new `Text`. Their isolated snapshot
  tests render WITHOUT a provider, so a strict-context `Text` would crash them — that
  migration needs the test harness updated to wrap a provider, best done as its own task.
- **Layered `t("page.title")` keys** — the l10n keys are still flat (`keyof typeof en`).
  Restructuring 20k-line en.ts/ua.ts + every call site is a big, separate task; kept
  out of a "swift" session to avoid a giant risky diff.

### Win conditions
`npm run lint` (tsc + eslint) ✓ · `npm test` (Text 3/3; full suite unaffected) ✓ ·
FILEMAP + CODING_RULES updated ✓ · robotdiary entry ✓ · no new UI strings → l10n
files untouched (correct). No manual on-device step required for this slice.

## 2026-07-11 (§4.3 cont. — test harness + first base-component migration)

Picked up the deferred remainder of §4.3. It's genuinely two large tasks (the diary
above said each warrants its own session); the base-component migration alone is a
266-`theme={...}`-call-site refactor across 36 files — far beyond the "one small task
per session" rule. So I did the foundational, fully-completable **first slice**: build
the missing test harness (the documented blocker) and migrate the lowest-fan-out leaf
primitives off the prop-drilled `theme`. Left the l10n-key restructuring untouched (a
separate huge task).

### Test harness (the unblock)
- New `test-utils/renderWithContext.tsx` (repo ROOT, not `__tests__/` — jest-expo's
  `testMatch` treats *any* file under `__tests__/` as a suite, so a helper there fails
  with "must contain at least one test"). Exports `renderWithContext(ui, { themeType?,
  langCode?, state? })` + `makeContextValue`, wrapping a bare `AppContext.Provider`
  with a synthetic value (no storage/notification side effects, unlike `AppProvider`).
- A context Provider emits no host node, so wrapping an existing snapshot test in it
  leaves the rendered tree — and the snapshot — byte-identical (verified: the only
  `.snap` diff was a describe-name key rename, below).

### Migrated (drop `theme` prop → `useAppContext()`)
`DotIndicator` (2 sites), `Checkbox` (3), `Select` (4), `SelectModal` (4). Chosen for
low fan-out so every call site could be updated in one green diff. Call sites updated:
Button, LevelPicker (DotIndicator); registerScreen, setttingsMenuItem, homeScreen,
RemindersSettingsScreen, TranslationsSettingsScreen, PassageEditor (Checkbox/Select/
SelectModal). `Select`/`SelectModal` are a natural parent→child pair; both still pass
`theme` down to the un-migrated `Button`/`MiniModal` from context.
- The `<Checkbox theme={theme}/>` in `PassageEditor:750` is inside a `{/* */}` comment
  (dead code) — left untouched.

### Tests
- `checkbox.test`, `select.test` → `renderWithContext` (dropped the `theme` prop).
- `settingsMenuItem.test` → `renderWithContext` (SettingsMenuItem itself is NOT migrated
  and keeps its `theme` prop, but it renders the now-context-based Checkbox + SelectModal,
  so its isolated render needs a provider).
- Refactored `Text.test` to reuse the shared harness (was an inline provider) — removes
  the duplication the previous slice left behind.
- Fixed checkbox.test's copy-paste `describe("testing select")` → `"testing checkbox"`;
  that renamed its snapshot key, so `npm test -- -u` pruned the one obsolete entry (the
  View content is unchanged).
- Confirmed no OTHER test transitively renders a migrated component: the Level tests
  render only Input/Button (un-migrated); button.test renders Button without `dot` (no
  DotIndicator). Full suite is green, which is the definitive check.

### Deliberately NOT done (documented remainder)
- The high-fan-out components — `Button`/`IconButton` (89 sites), `setttingsMenuItem`
  (53), `Input` (15), `Header` (9), `AddressPicker`, `LevelPicker`, `PassageEditor`,
  `miniModal`, `weekActivityComponent`, `testNevDott`, `SettingsSubScreen`,
  `settingsListWrapper`, `levels/Level1..5`. Each is its own bounded session now that the
  harness exists (pattern: read `useAppContext()`, drop the prop, update its call sites,
  swap affected tests to `renderWithContext`). Note the `t` prop (21 sites) still rides
  along on some of these — migrate it the same way when its owner is migrated.
- The layered `t("page.title")` l10n restructuring — still a big separate task.

Verified: `npm run lint` ✓ · `npm test` ✓ (26 suites / 57 tests / 22 snapshots). No new
UI strings → l10n untouched. Pure structural refactor (theme SOURCE prop→context, same
values) — no runtime behaviour change, so no on-device step needed for this slice.

## 2026-07-11 (planning — granular session queue to 1.0.0, STRATEGY §8)

Docs-only session. Fedir asked for a granular one-item-per-session plan to 1.0.0,
folding in his latest on-device feedback + the follow-ups scattered through this diary.

- **New STRATEGY §8**: the working queue — ~50 checkboxed sessions grouped by
  milestone (8.1 → 0.2.0 … 8.8 → 1.0.0), each sized for one session, with **(build)**
  markers where a session must end in a version bump + CI staging build so real-life
  testing happens continuously, not just at milestones. §0 protocol now points at §8
  ("take the first unchecked item").
- **New §2 P0**: the ~0.5s lag on EVERY screen render (both dev APK and the published
  Play Store build, even on Pixel 9 Pro). Key triage fact: it reproduces on the
  pre-refactor store build → systemic, NOT caused by the navigator refactor. Planned
  as diagnose-first (8.1.1) then fix in layers (8.1.2 context, 8.1.3 screens) —
  suspects listed, no guess-fixes.
- **Milestones resequenced** (§7): old 0.1.2 "Safety net" folded into 0.2.0 (the nav
  refactor already sits on `staging` — nothing ships without it); intent receiver
  (working since the 07-10/11 sessions) moved from 0.4.0 into 0.2.0 as polish.
  0.2.0 renamed "Fast & solid".
- **Fedir's new tasks placed**: shared-text sanitization incl. URL-stripping +
  untypable-char normalization (8.1.4); book-name aliases Івана=Іоана (8.1.5);
  intent debug-toast → confirm flow + dead-plugin cleanup (8.1.6); AddressPicker
  big-primary one-verse-is-enough button (8.1.7); modal purge starting with filter
  selection (8.2.2); Level-5 similar-chars tolerance (8.2.7 — deliberately paired
  with 8.1.4: sanitize on input, tolerate on comparison).
- **Diary follow-ups absorbed into §8**: boot-backup key + old-version restore
  (8.1.8), legacy converter fixtures (8.1.10), context-migration remainder
  (8.1.11–13), typed nav params (8.1.14), renames (8.1.15), initials defaults
  (8.1.16), bbh-api deploy + assetlinks.json + nodemon→node (8.1.17), reanimated
  install (8.2.1), layered l10n keys (8.2.9), SDK upgrade + deps cleanup
  (8.3.1–2), shared-pkg DTO follow-ups (8.4.1), day-average decision (8.5.3),
  ascAppId (8.7.1), iOS share extension (8.7.3).
- Nothing coded; no files added/removed → FILEMAP untouched; no UI strings → l10n
  untouched. Next session = **8.1.1 diagnose the render lag**.

## 2026-07-11 (8.1.1 diagnose render lag + 8.1.2 context-layer fix)

Did 8.1.1 (diagnosis) and 8.1.2 (context-layer fix) together this session.

### 8.1.1 — Findings (code-level; an on-device profiler run couldn't be done in
this automated session, so these are ranked by expected cost from reading the hot
paths — Fedir's Pixel 9 Pro re-time after the 8.1.2 **(build)** is the confirmation).

All of `state`/`dispatch`/`t`/`theme` come from ONE context (`AppContext.tsx`) that
~20 screens + base components subscribe to. Two compounding problems:

1. **New context-value object every provider render.** The provider passed a fresh
   `{ state, setState, dispatch, t, theme }` literal each render → every
   `useAppContext()` consumer re-renders on every dispatch. (context layer)
2. **`dispatch`, `t`, `theme` all rebuilt every render.** `dispatch` was a fresh
   closure; `t = createT(...)` a fresh closure; `theme = getThemeFromScheme(...)` a
   fresh object — so even a `React.memo`'d child got new props every time and never
   skipped. This is exactly why the 2026-07-10 passage-row memoization was deferred
   "until `t`/`theme` are stable". (context layer)
3. **`JSON.stringify(state)` on EVERY provider render** (as a `useEffect` dep key),
   plus a second full `JSON.parse(JSON.stringify(state))` deep clone in the effect
   body — both O(state size), growing with years of history. A serialize of the
   whole state on every render is a top suspect for a fixed ~0.5s hit. (context layer)
4. **Heavy per-render work in screens** (screen layer → 8.1.3, NOT fixed here):
   - `homeScreen`: `getStroke(state.testsHistory)` recomputed every render;
     `Linking.getInitialURL()` fired every render (async work, no effect guard);
     `LogoBlock`/`MainButtons` declared inside render and used as `<LogoBlock/>` →
     new component types each render → full unmount/remount of those subtrees.
   - `statsScreen` / `calendarScreen`: `getAppStats(state)` recomputed every render
     (O(history)).
   Combined with problem 1, a single dispatch re-renders every mounted screen
   (react-navigation keeps prior screens mounted) and re-runs all their O(history)
   stat computations — the compounding lag.
5. **`App.tsx` `Linking.addEventListener` effect has no dep array** → re-subscribes
   every App render. Minor; noted for the 8.1.3/navigator pass.

Ordered fix list: **(a)** memoize context value + stabilize `dispatch`/`t`/`theme`;
**(b)** drop the per-render `JSON.stringify` persist key → key on `state` ref; clone
only on the daily-backup path — [both done in 8.1.2 below]; **(c)** `React.memo` the
passage rows + `WeekActivity`, now that `t`/`theme` are stable (8.1.3); **(d)** memoize
`getStroke`/`getAppStats` per screen (`useMemo` on the history slice) (8.1.3); **(e)**
hoist `homeScreen`'s inline `LogoBlock`/`MainButtons`, move `Linking.getInitialURL`
into a mount effect (8.1.3); **(f)** `freezeOnBlur`/`detachInactiveScreens` on the
stack so blurred screens stop re-rendering (8.1.3).

### 8.1.2 — Context-layer fix (`src/context/AppContext.tsx`)
- `dispatch` → `useCallback([])` (reducer + `setState` are constant → stable identity).
- `theme` → `useMemo` keyed on `[state.settings.theme, colorScheme]`.
- `t` → `useMemo` keyed on `[langCode]`.
- context `value` → `useMemo` keyed on `[state, dispatch, t, theme]` (setState stable).
- Persist effect: dep `[stateString]` → `[state]`; deleted the per-render top-level
  `JSON.stringify(state)`; moved the `JSON.parse(JSON.stringify(state))` deep clone
  inside the once-a-day backup branch. Fires exactly as before (reducer returns a new
  ref only on real change) but without serializing the whole state every render.

No behaviour change intended — same values, same persist/backup cadence, just stable
identities and far less per-render work. This unblocks the row/component memoization
(fix c). No new files → FILEMAP untouched; no UI strings → l10n untouched.

Verified: `npm run lint` ✓ · `npm test` ✓ (26 suites / 57 tests / 22 snapshots).
**Needs Fedir's device re-time** (this is a **(build)** session): confirm the ~0.5s
per-screen lag drops; if not enough, proceed to 8.1.3 (screen layer, fixes c–f above).

## 2026-07-11 (8.1.3 render lag — screen layer, fixes c–f)

Did the screen-layer half of the render-lag P0: the four fixes (c–f) the 8.1.1
diagnosis queued after the 8.1.2 context-layer work. Now that `t`/`theme`/`dispatch`
have stable identities (8.1.2), `React.memo` can finally bite.

### (c) React.memo the heavy rows/components
- **`ListScreen` `ListItem`** — the big one. The passage list re-renders on every
  dispatch AND on every search keystroke (`searchText` local state), and each render
  re-rendered every visible row. Root blockers to memoizing were: (1) it took the whole
  `state` object (new identity every dispatch), and (2) `renderItem` handed each row a
  fresh `() => handler(passage)` closure. Fixed both: split the base out
  (`ListItemBase` → `const ListItem = React.memo(ListItemBase)`), pass only the
  primitives a row needs — `sort`, `leftSwipeTag`, and a precomputed `addressLanguage`
  (LANGCODE, resolved from the passage's translation) instead of `state`; and made the
  row callbacks stable `useCallback`s that RECEIVE the passage (`onPress(data)` etc.),
  so their identity no longer changes per render. Net: a row now re-renders only when
  its own passage data changes — search typing and unrelated single-passage edits skip
  every untouched row.
- **`WeekActivityComponent` + its leaf `DayActivityBar`** wrapped in `React.memo`
  (+`displayName`). Home re-renders on local state (opening the train-modes picker);
  with stable `state`/`t`/`theme` those re-renders now skip the whole week graph.

### (d) Memoize the O(history) stat walks (useMemo)
- `homeScreen`: `getStroke(state.testsHistory)` → `useMemo(…, [state.testsHistory])`.
- `weekActivityComponent`: `getWeeklyStats(state)` → `useMemo(…, [state.testsHistory])`.
- `statsScreen` + `calendarScreen`: `getAppStats(state)` → `useMemo(…, [state])`. Keyed
  on the whole `state` (immutable — reducer returns a new ref only on real change), so
  it recomputes exactly when state changes and SKIPS on local-state re-renders. Big win
  on calendar, which re-ran the full-history walk on every day/month tap.

### (e) homeScreen inline components + per-render async
- `LogoBlock`/`MainButtons` were `const X = () => (…)` rendered as `<X/>` — a NEW
  component type each render, so React unmounted+remounted those subtrees every time.
  Converted to plain element consts (`logoBlock`/`mainButtons`, rendered `{logoBlock}`).
- `Linking.getInitialURL()` was called in render body (fires async work every render) →
  moved into a mount `useEffect([])`.

### (f) Stack: stop blurred screens re-rendering
- `navigator.tsx` `Stack.Navigator`: added `freezeOnBlur: true` (screenOptions) +
  `detachInactiveScreens`. react-navigation keeps prior screens mounted, so without this
  one dispatch re-rendered EVERY mounted screen and re-ran its stat work; now only the
  focused screen re-renders. (react-native-screens 4.16 / react-navigation v7 — both
  support it.)
- Bonus (8.1.1 finding #5): `App.tsx`'s `Linking.addEventListener` effect had no dep
  array (re-subscribed every render) → keyed on `[state.settings.devModeEnabled]`.

### Notes / gotchas
- No behaviour change intended — pure render/identity optimization (same values, same
  outputs). No new files → FILEMAP untouched; no UI strings → l10n untouched.
- `exhaustive-deps`/`rules-of-hooks` are OFF in this repo's eslint, so the `useMemo`/
  `useCallback`/effect dep arrays here are hand-chosen for correctness, not lint-forced.
- Converting `MainButtons` to an element re-indented its JSX one level; `lint-fix`
  (prettier) reformatted it — no logic change.
- Can't measure the perf win in-session (RN, needs a device build, like every 8.1.x
  step). **Needs Fedir's device re-time** — this + 8.1.2 together should kill the
  ~0.5s per-screen lag. If confirmed, the §2-P0 / §8.1-A render-lag work is done.

Verified: `npm run lint` ✓ · `npm test` ✓ (26 suites / 57 tests / 22 snapshots).

## 2026-07-11 (8.1.4 + 8.1.5 + 8.1.6 — intent-receiver polish)

Did the whole intent-receiver polish batch (§8.1-B) in one session.

### 8.1.4 — sanitize shared text
- New pure util `src/utils/sanitizeSharedText.ts`. Shared payloads come from
  arbitrary apps and the typing test later demands the EXACT character, so it:
  normalizes untypable chars (en/em dash → `-`, curly double/low quotes → `"`,
  curly single/apostrophes → `'`, `…` → `...`, nbsp/narrow-nbsp/thin-space →
  regular space); strips URLs (`https?://` or `www.`); collapses space runs (keeps
  newlines); peels wrapping quotes (`"`, `'`, `«»`) and dangling `:`/`;`/`,` at the
  ends, alternating until stable (a comma can hide a quote and vice-versa).
- Wrapping-quote peel only fires when the quote does NOT reappear inside, so
  `"peace" and "love"` (two spans) is left intact.
- Wired into `listScreen.handleTextFromIntent` as the first step (renamed its arg
  to `rawText`, sanitizes into `text`).
- Tests: `__tests__/utils/sanitizeSharedText.test.ts` — real shared strings incl. a
  YouVersion-style multi-line share + URL. All special chars written as `\u`-derived
  constants so the source stays pure ASCII (no invisible nbsp bytes).

### 8.1.5 — book-name aliases in `addressFromString`
- New data file `src/utils/bookAliases.ts`: per-language abbreviation / spelling-variant
  lists keyed by the book's long-title WORD (readable + index-independent). Includes
  common English abbreviations that differ from the app's own short titles (Mt, Mk, Lk,
  Jn, Gn, Ex, Psalms, Jas, Rv…) and Ukrainian variants — the task's example
  Івана = Іоана/Йоана, plus the correct **Судді** for Judges (the app's UA long title is
  misspelled "Сідді"; aliasing avoids touching the shipped l10n).
- `addressFromString` matching pass now builds candidate titles = `[long, short,
  ...aliases[langcode]]`, filters those the input starts with, and picks the LONGEST
  matched title (kept the existing most-specific-wins tiebreak). No behaviour change for
  existing inputs; the "Judges 1:1" regression test still passes.
- Tests: added an alias block to `addressFromString.test.ts` (one case per alias, en+ua,
  asserting book index + language; plus a "Psalms" specificity case).

### 8.1.6 — intent finish
- Removed the debug toast in `App.tsx` (`toastShow("Shared text: …")`) and the noisy
  `JSON.stringify(shareIntent)` log; kept a concise length-only log line and turned off
  `useShareIntent({ debug })`. The "confirm before add" flow is the existing route into
  the pre-filled passage editor (`SCREEN.passage` with address+text+translationId) — the
  user reviews there and taps Save; no separate modal added (the editor IS the confirm
  surface).
- Removed the now-redundant manual Android SEND intent filter from `app.config.js`
  (expo-share-intent's `androidIntentFilters: ["text/*"]` already declares it) and dropped
  the dead `["./plugins/handlingIntents"]` plugin; `git rm plugins/handlingIntents.js`.

### Notes / gotchas
- No new UI strings → l10n untouched. FILEMAP updated (2 new utils, removed plugin row,
  test index). This is a **(build)** task — needs Fedir's `npm run build-dev` + a device
  build to confirm a real share → sanitize → editor round-trip on-device.
- Scope stayed minimal: `addressFromString` still expects the address at the START of the
  string, so a verse-first YouVersion share still won't auto-parse the reference — that's
  pre-existing and out of scope for this batch.

Verified: `npm run lint` ✓ · `npm test` ✓ (27 suites / 90 tests / 22 snapshots).

### Follow-up (same session): parse address from ANY part of the text
- Per Fedir: `addressFromString` now searches the WHOLE string, not just the start —
  a verse-first YouVersion share ("For God so loved… John 3:16 ESV") auto-detects the
  reference. Replaced the `startsWith` + substring match with a per-title regex
  `escapeRegExp(title) + NUMBER_PATTERN` run via `matchAll`, requiring the title to sit
  on a word boundary (custom `isWordChar` with `\p{L}` — JS `\b` is ASCII-only and would
  break Cyrillic titles). The number pattern must sit immediately after the title, which
  filters out prose occurrences of book words. Existing longest-title tiebreak still picks
  the numbered book (1 John over John) and the most specific alias.
- `handleTextFromIntent` needed no change — it already strips the found `addressString`
  from the text to get the verse body, which now works from mid-string.
- Added tests: reference after a quote (en + ua), "1 John" mid-text, and a negative case
  ("regenerate 1:1" must NOT parse as Genesis). Suite: 27 / 94.

Verified: `npm run lint` ✓ · `npm test` ✓ (27 suites / 94 tests / 22 snapshots).

---

## 2026-07-11 — 8.1.7 AddressPicker one-verse flow

### What
- Reworked the start-verse step of `AddressPicker`. Previously a tap on a start verse
  auto-advanced into range mode (pick end chapter → end verse), and only a hidden
  long-press finished a single verse. Now a tap **selects + highlights** the verse and
  stays put, revealing a bottom footer:
  - PRIMARY green `Button` (`type="main" color="green"`, `APAddVerse` = "Add") → confirms
    the single verse (end filled from start via the existing `handleConfirm`).
  - Secondary transparent `Button` (`APExtendRange` = "Extend range") → steps to
    `endChapterNum` for anyone who actually wants a range.
- Added `APAddVerse` / `APExtendRange` to both `en.ts` and `ua.ts`.

### Why
- One verse is the common case; the old flow buried it behind a long-press and made the
  range the default path. STRATEGY 8.1.7.

### Notes / gotchas
- Implemented by early-returning from `handleListButtonPress` when `addressPart ===
  "startVerseNum"` (no auto-advance) + an `isStartVerseSelected` flag driving the footer
  and the selected-verse highlight. The long-press single-verse shortcut is kept, now
  redundant but harmless.
- Selected verse highlight uses `mainColor` bg + `bg` label color (no `textInverted` in
  the palette). Footer is absolutely positioned over the bottom of the scroll list.
- No new files → FILEMAP unchanged. Two new interaction tests added to
  `AddressPicker.test.tsx` (add-one-verse confirms start==end; extend-range hides the
  footer without confirming). Initial-render snapshot unchanged (footer only appears at
  the verse step).

Verified: `npm run lint` ✓ · `npm test` ✓ (27 suites / 96 tests / 22 snapshots).

## 2026-07-22 — Target Android 16 (API 36) for Play compliance

### What
- `app.config.js` → `expo-build-properties`: `compileSdkVersion` / `targetSdkVersion`
  35 → 36, `buildToolsVersion` `35.0.0` → `36.0.0`. `minSdkVersion` stays 24.

### Why
- Google Play flagged the app: "highest non-compliant target API level is Android 15
  (API 35)"; new releases must target Android 16 (API 36) or higher. The explicit
  build-properties override was pinning us to 35 even though Expo SDK 54 / RN 0.81
  support 36.

### Notes / gotchas
- No `android/` dir in the repo (prebuild happens on EAS), so this is the only place
  the SDK level is declared — nothing else to patch.
- API 36 enforces edge-to-edge; `android.edgeToEdgeEnabled: true` was already set, so
  no layout work expected — still worth eyeballing screens with system bars on a real
  device after the next staging build.
- Not pushed / not built. Next step: `npm run build-dev` (staging → internal track),
  verify, then `npm run build-prod`.
- No source files changed → FILEMAP unchanged, no new l10n strings.

Verified: `npm run lint` ✓ · `npm test` ✓ (27 suites / 96 tests / 22 snapshots) ·
`npx expo config` resolves compileSdk/targetSdk = 36.

---

## 2026-07-22 — docs accuracy pass: FILEMAP `(?)` refinement + STRATEGY §4 status audit

Docs-only session (no source touched). Two halves, per Fedir's ask.

### 1. FILEMAP refinement (STRATEGY §1, last unchecked item)
Diffed `git ls-files` of both repos against every FILEMAP row, then read the files
behind the vague/`(?)` ones instead of guessing.

- **Resolved the three `(?)`**: `src/constants.ts` (now lists what's actually in it —
  state `VERSION` + allowed versions, `API_VERSION` re-export from `bbh-shared`,
  `API_LINK`, storage keys, training tuning constants, the enums, and the
  `COLOR_*`/`THEME_*` palettes), `utils/getPerfectTests.ts` (`getPerfectTestsNumber` =
  newest unbroken run of error-free tests at/above `passage.maxLevel`, compared against
  `PERFECT_TESTS_TO_PROCEED` to level up — it is a level-up gate, not a "streak/score"
  helper as the guess said), bbh-api `README.md` (Fedir's own planned-arch checklist +
  yarn/docker setup, NOT an endpoint reference).
- **Removed two dead rows**: `src/screeenManagement.ts` and `src/utils/useApp.ts` —
  both deleted in fc3bc11 (navigator refactor) but still documented as live.
- **Rewrote stale/thin rows**: `navigator.tsx` (linking config, `freezeOnBlur` +
  `detachInactiveScreens`, background-notification task, `navigationRef` +
  `RootStackParamList`), `storage.ts` (a `react-native-storage` instance over
  AsyncStorage — it is not AppState-specific), `bibleReference.ts` (l10n WORD keys +
  per-chapter verse counts, `chaptersAlternative`), `getStats.ts` / `notifications.ts` /
  `handlePassageExport.ts` / `fileManager.ts` / `randomizers.ts` / `formatDateTime.ts`
  (real export names), `logger.ts` (write/error/readAll/clearAll + capped ring buffer),
  `getThemeFromScheme.ts` (takes `colorScheme` as an argument — deliberately does NOT
  call `useColorScheme`, cf. the polyfill history in §3), `l10n/index.ts` (`createT` +
  the `WORD = keyof typeof en` union), `fetchESV.ts`, `generateTests/*`, `reduce.ts`.
- **Merged the duplicated `app.config.js` rows** into one that also records the
  2026-07-22 compile/target SDK 36 and the full plugin list; added
  `test-utils/renderWithContext.tsx` to the root table.
- Header now states the `(?)` convention AND that none remain as of today.

### 2. STRATEGY status marks
- **§4 got checkboxes** (it had none) with a `[x]` / `[~]` / `[ ]` legend, each status
  verified against source, not memory: **1 shared package [x]**, **2 navigator [x]**
  (with the safe-area top-space fix + the two queued follow-ups 8.1.14/8.2.3 named),
  **3 theme+l10n contexts [~]** (centralize + `Text` + test harness + leaf primitives
  done; high-fan-out components 8.1.11–8.1.13 and layered keys 8.2.9 remain),
  **4 file renames [ ]** — now lists the actual offending filenames so 8.1.15 can start
  cold, **5 [ ]** (no session scheduled yet), **6 [ ] → 8.2.6**, **7 [ ] → 8.2.8**,
  **8 [ ] → 8.2.1–8.2.5**, **9 [~]** standing rule (verified: `base.servise.ts` is still
  the only file in bbh-api that touches sqlite).
- **§3 watchlist**: the `navigator.tsx:28` deep-link/notification-tap stub is DONE —
  `AppContext`'s notification listener dispatches `generateTests` + navigates to
  `SCREEN.test`; what's left at `navigator.tsx:66` is the separate BACKGROUND-notification
  task (logs only). Play-Store target-API item marked done (SDK 36, 2026-07-22).
- **§1** FILEMAP-refinement item checked with a note that the maintenance rule stays live.

### Notes / gotchas
- `getPerfectTests` and `storage.ts` are the two rows whose old descriptions would have
  actively misled a future session — worth the read-before-writing rule.
- Nothing was marked done on trust: every `[x]` above was checked in the source or in
  `git log --diff-filter=D`.
- Queue is unchanged; next session is still **8.1.8 boot-path backup fixes**.

Verified: `npm run lint` ✓ · `npm test` ✓ (27 suites / 96 tests / 22 snapshots) ·
no source files changed → no l10n work, FILEMAP updated (it was the task).

---

## 2026-07-22 — PLAN.md created; STRATEGY §8 retired (planning interview)

### What
Fedir asked for a detailed plan doc, separate from STRATEGY, where completion is
marked — built from a 30-question interview (8 batches). Docs-only session.

- **New `docs/PLAN.md`** — the working queue, all the way to 1.0.0 with graded detail
  (0.2.0/0.3.0 fully specified, later milestones one-liners to expand when active).
  Every step carries **Goal · Files · Acceptance · Risk** and the tags
  `(build)` / `(device)` / `(one-sitting)` / `[api]` / `[shared]`.
- **`STRATEGY.md` §8 replaced by a pointer.** §1–§7 stay as the *why* (bug register,
  risk watchlist, refactor list, testing goals, feature order, milestone table);
  scheduling lives only in PLAN.md. Header + §0 protocol rewritten to match.
- `CLAUDE.md` reading order now lists PLAN.md as #4 (queue) and STRATEGY as #5 (why),
  plus a new hard rule: work found outside the current step is **reported to Fedir**,
  never silently fixed or silently added to the plan (his explicit choice).
- `FILEMAP.md` docs table gains the PLAN.md row.

### Decisions locked (interview answers — PLAN.md §3 holds the table)
Backup goes through the system save/share sheet · pre-conversion snapshot is silent,
the file export is only *offered* · restore accepts old-version snapshots and
re-converts · `fileManager` moves to `expo-file-system` inside the backup step (not
later at 8.3.2) · stats day-average counts **active days only** · **Play release at
0.2.0**, not bundled with Candy UI · reanimated at 8.2.1 · milestone order unchanged ·
context migration stays 3 steps · renames app-repo-only · layered l10n keys kept but
late · Passage/Address abstraction folded into the level split (8.2.6) · a build after
**each** wrapper-rewrite step.

### Structural choices
- IDs are **stable and never renumbered** (new work inserts as `8.1.8a`), so robotdiary
  entries that cite a step ID stay true. Existing 8.1.x IDs carried over unchanged.
- Done steps **leave the queue** into an Archive section, one line each; the full story
  stays here in robotdiary.
- Test backlog interleaved near its risk instead of piling up at 1.0.0: the e2e flow
  test became **8.1.16a** (guards the first store release in a year) and reducer
  coverage **8.4.4a** (just before sync adds actions to `reduce.ts`).
- Two steps were merged per his answers: the expo-file-system swap into 8.1.9, and
  §4.5 Passage/Address into 8.2.6.

### Notes / gotchas
- **Encoding trap:** editing a UTF-8-without-BOM doc via PowerShell `Get-Content` /
  `Out-File` double-encoded every non-ASCII char (`—` → `â€"`). Repaired by re-reading
  as UTF-8, re-encoding the affected span through CP1252 and writing back without BOM.
  **Use the Edit tool for docs**, or .NET `[IO.File]::ReadAllText/WriteAllText` with an
  explicit `UTF8Encoding($false)` — never the PS 5.1 text cmdlets.
- The 2026-07-22 SDK-36 bump is still unbuilt; PLAN.md flags it as riding on the next
  `(build)` step, 8.1.9.
- Next session: **8.1.8 boot-path backup fixes** (device-sensitive, tests first).

Verified: `npm run lint` ✓ · `npm test` ✓ (27 suites / 96 tests / 22 snapshots) ·
docs only, no source or l10n changes.

---

## 2026-08-24 — 8.1.8 boot-path backup fixes

Fedir asked for a bigger-than-usual session, so several PLAN steps ran in parallel
(one worker per disjoint file set, coordinated here). This section covers 8.1.8, the
one with the highest blast radius; the others follow below.

### What (the two bugs from STRATEGY §3)

**(a) One key for two different backups.** The pre-conversion snapshot and the rolling
daily backup both wrote `STORAGE_BACKUP_NAME`, so within 24h of an upgrade the daily
backup — now holding the *converted* (possibly corrupted) state — overwrote the last
known-good raw state. Fixed with a second key, `STORAGE_PRECONVERT_BACKUP_NAME`
("preConvertBackup"), written by `savePreConvertSnapshot` **once and never again**:
per Fedir's call, the OLDEST snapshot is the valuable one, because a converter that
shipped broken would otherwise have every later boot overwrite good data with bad.

**(b) Restore refused the snapshot it had just saved.** The emergency screen compared
`version !== VERSION` and bailed — i.e. it rejected the pre-conversion snapshot (which
is *by definition* old-version), making recovery unreachable exactly after a bad
conversion. `restoreStateFromBackup` now passes a current-version snapshot through and
runs an older one forward through the same `convertState` chain the boot path uses.
The emergency screen offers **both** slots now: "Restore from daily backup" (fresher)
and "Restore pre-update snapshot" (pre-migration truth), both version-tolerant.

### How
- New `src/utils/bootBackup.ts` — `savePreConvertSnapshot` / `restoreStateFromBackup` /
  `loadRestorableBackup`. Extracted from `App.tsx` for one reason: the boot path was
  unreachable by tests while it lived inside a component. All three are **total** — they
  log and resolve instead of throwing, because every caller sits on the cold-start path
  where an unhandled rejection means the app never becomes ready at all. Storage is
  injected through a narrow `BackupStorageModel` so tests drive the empty / present /
  failing cases directly.
- `App.tsx` conversion branch now calls `savePreConvertSnapshot(dataObj)` instead of
  writing the daily-backup key, and logs whether it wrote or found one already.
- `AppContext.tsx` daily-backup write gained the `.catch` it never had (a failed backup
  used to be an unhandled rejection) and a comment saying which slot it owns.
- 12 tests in `__tests__/utils/bootBackup.test.ts`, including explicit regressions for
  both bugs: "never overwrites an existing snapshot", "does not touch the daily backup
  slot", "converts an older-version snapshot forward instead of rejecting it".

### No new l10n strings
The emergency screen deliberately stays raw `react-native` with hardcoded bilingual
labels — it must render when theme/l10n/state code is exactly what's broken, and
`useAppContext()` throws outside a provider. Fedir confirmed that design. (One typo
fixed in passing on the button that was being rewritten anyway: "щоденого" →
"щоденного".)

### Found on the boot path, NOT fixed (reported to Fedir, awaiting his call)
1. **The emergency recovery screen is effectively unreachable.** `App.tsx` wraps its
   return in `try { return <JSX/> } catch` — but creating elements never throws, and a
   function component's try/catch cannot catch its children's render errors. So the
   recovery UI users are told about basically never appears. It needs a real
   `ErrorBoundary` (class component or `react-error-boundary`).
2. **`loadState`'s single trailing `.catch` can wipe real data.** It is attached after
   the success handler, so an error *inside* conversion is indistinguishable from "no
   saved state" — and that branch writes a fresh empty state over `STORAGE_NAME`.
   The narrow fix is a two-argument `.then(onLoaded, onNothingStored)`, but deciding
   what the app should then DO (it can't reach the emergency screen — see 1) makes this
   a step of its own, not a side edit.

Both are the same bug class 8.1.8 was written to kill, but PLAN's own rule for this step
is "never widen it; anything else found here is reported, not fixed."

---

## 2026-08-24 — 8.1.10, 8.1.11–8.1.13, 8.1.16a (multi-step session)

Fedir asked for as much of the queue as one session could carry, and approved running
several steps in parallel on one working tree with disjoint file scopes (PLAN §2's
"broken-in-between is allowed" applies). The session hit its usage limit partway; the
parallel workers all died mid-edit and the tree was left half-migrated. Everything
below describes the **finished, verified** end state after that fallout was cleaned up
by hand. Nothing is committed — Fedir reviews the diff himself.

### 8.1.11 + 8.1.12 + 8.1.13 — context migration, COMPLETE
`Button`/`IconButton`, `Input`, `Header`, `setttingsMenuItem`, `AddressPicker`,
`LevelPicker`, `PassageEditor`, `miniModal`, `SelectModal`, `weekActivityComponent`,
`testNevDott`, `SettingsSubScreen`, `settingsListWrapper` and `levels/Level1..5` all
dropped the `theme` prop; the `t` prop went with them in the same pass. ~277 call
sites across 35 files. STRATEGY §4.3 is now fully done — `CODING_RULES.md` §7 carries
the rule for new code and `FILEMAP.md` records the completion.

**The result that matters: all 22 snapshots matched their stored versions, and no
`.snap` file changed on disk.** That is the acceptance criterion for these three steps
— a context Provider emits no host node, so a purely structural migration must leave
the rendered tree byte-identical. It did.

### 8.1.10 — legacy converter coverage
`__tests__/fixtures/state006.ts` + `state007.ts` hold realistic 0.0.6/0.0.7 states
(passages, history, settings), converted forward and asserted in
`stateVersionConvert.test.ts`. The recursive chain from the oldest allowed version now
reaches `VERSION` under test. No converter bug surfaced.

### 8.1.16a — end-to-end flow test
`__tests__/e2e/flow.test.tsx`: create state → add passage → `generateTests` → answer
with errors → finish → assert stats, driven through the reducer + generators with no
rendering (Fedir's call — a rendered version would break on every UI tweak, and the
whole Candy UI rewrite is next). It asserts explicitly that no error count is exposed.

### Notes / gotchas
- **Jest ate the new fixtures.** `jest-expo`'s default `testMatch` claims *everything*
  under `__tests__/`, so `fixtures/state006.ts` and `state007.ts` were collected as
  suites and failed with "no tests". Fixed with `testPathIgnorePatterns` in
  `package.json`'s jest block. Any future non-suite helper under `__tests__/` needs the
  same treatment — or lives in `test-utils/` at the repo root, like `renderWithContext`.
- **Level tests had to move onto the harness.** `Level1..5.test.tsx` and
  `AddressPicker.test.tsx` still used a bare `render()`; once the components read
  context they threw "useAppContext must be used within an AppProvider". They now use
  `renderWithContext`, and `AddressPicker`'s Ukrainian case passes
  `{ langCode: LANGCODE.ua }` instead of a `t={tUa}` prop.
- **Two `theme={theme}` hits survive a grep of `src/`** — both inside `{/* ... */}`
  JSX comment blocks (`PassageEditor.tsx` reminder toggle, `testsScreen.tsx` dev-mode
  "Pass" button). Dead code that predates the migration; left alone rather than
  silently widening the diff. Recorded in FILEMAP so the next grep doesn't confuse
  anyone.
- `DayActivityBar` (private to `weekActivityComponent.tsx`) was still receiving `theme`
  from its own parent. Migrated too, since 8.1.13 names that file; `theme` from context
  is memoized, so `React.memo` on that row still behaves.

### Needs manual verification (nothing here can be proven off-device)
The migration is snapshot-proven structural, so the risk is not "wrong colors" but
"missing provider at runtime". Worth eyeballing on the next build: the login and
register screens (their `Header`/`IconButton`/`Input` call sites were rewritten last
and are outside every snapshot test), and each of the five level screens in a real
training session.

### Left undone from the intended scope
8.1.14 (typed navigation) was in the stretch plan and was not started — it rewrites
every screen's props and would have collided with the migration. It stays the next
unchecked step after 8.1.9.

---

## 2026-08-24 — docs cleanup: STRATEGY becomes vision, PLAN becomes a roadmap

Fedir's call: the two planning docs had drifted into each other. STRATEGY had grown a
second queue (checkboxes in §1, §2, §4, §5) plus a session-by-session changelog inside
parentheses, and PLAN carried a session protocol, a conventions section and per-step
Goal/Files/Acceptance/Risk blocks. Split cleanly along the line he drew: **STRATEGY is
where we want to be, PLAN is yes/no marks.**

### STRATEGY.md — rewritten, 432 → ~150 lines
- **Every checkbox removed.** No `[x]`, no `[~]`, no `[ ]`.
- **Bug register deleted.** Every entry in it was already fixed; the fix notes are in
  this diary under their dates, which is where history belongs.
- **The dated parenthetical notes are gone** — they were a changelog living in a
  planning doc.
- New shape: what "finished" means (1.0.0 definition) · the milestone ladder · feature
  vision in priority order · technical direction · quality bar · risk watchlist ·
  decisions locked (moved here from PLAN §3, since it is reasoning, not scheduling).
- Only the *open* risks survived into the watchlist. Two of them are the boot-path holes
  found during 8.1.8.

### PLAN.md — rewritten, 380 → ~215 lines
- Steps compressed to a title + a few lines. Goal/Files stayed where it saves a session
  re-deriving them; Acceptance/Risk prose dropped except where it warns of a real trap
  (Windows case-insensitive renames, memoized rows, babel config).
- **`(device)` tags and the milestone device checklists removed** — Fedir asked to stop
  planning around manual real-device testing. Milestones are now "bump, build, release".
- **Dropped from the queue:** 8.1.16 fresh-install defaults, the standalone
  error-message-design unification (clauses removed from 8.2.5 and 8.2.6), and 8.2.9
  layered l10n keys (moved to the post-1.0 pool — a giant mechanical diff worth nothing
  to a user). All three recorded in PLAN "Not scheduled" and in STRATEGY §7 so the
  decisions do not get re-litigated.
- **Added 8.1.9a** (flagged to Fedir, not slipped in silently): the two boot-path
  problems reported at the end of 8.1.8 had never been scheduled. `loadState`'s `.catch`
  treats any load failure as "no state yet" and writes a blank state over storage, and
  the emergency screen sits in a render-time `try/catch`, which React does not use for
  errors thrown by children — so recovery is unreachable. Both are data-loss class and
  belong before the Play release.
- **8.1.9 shrank:** its "swap `fileManager` from `react-native-fs` to `expo-file-system`"
  half is already done — `fileManager.ts` imports `expo-file-system/legacy`, and no
  source file imports `react-native-fs` at all. The dep is dead weight in
  `package.json`; dropping it moved to 8.3.2 with the other dep cleanup.

### Verified against the source, not assumed
Everything still unchecked really is unchecked: `react-native-reanimated` absent,
`RootStackParamList` still `Record<string, object | undefined>`, `homeScreen`'s
`route: any` and `testsScreen`'s `@ts-ignore` still there, screens still camelCase.

### Also updated
`FILEMAP.md` docs table (both descriptions were stale) and `CLAUDE.md` step 5, which
still told the next session STRATEGY held a bug register and a testing queue.

---

## 2026-08-24 — 8.1.9 backup export + restore from file

The safety net finally reaches outside the app. Before today every copy of a user's
data lived in the same AsyncStorage the app could corrupt: the rolling daily backup and
the write-once pre-conversion snapshot from 8.1.8. Both die with the install. This step
adds the copy that survives — a file the user owns.

### What was found first
The feature was already half-built, in the wrong place. `AboutSettingsScreen` had
dev-mode-only "Export state" / "Import state" rows, complete with l10n keys in both
languages, doing `JSON.stringify(state)` → `writeFile` and `JSON.parse` → `convertState`
inline. So the step became *promote and harden*, not *invent*:

- the import switched on `r.mimeType` and silently did nothing for any other type;
- it ran `r.content.replace(/_ /g, " ")` before parsing — a hack that corrupts any real
  `"_ "` inside the JSON;
- no confirmation before replacing the whole state;
- and it was invisible to the ~5 people who actually use the app.

### What was built
- **`src/utils/backupFile.ts`** — split down the middle on purpose. Pure half:
  `serializeBackup` (state → `{app, exportedAt, stateVersion, state}`), `parseBackup`,
  `createBackupFileName`, `readStateVersion`. IO half: `exportBackupFile` /
  `importBackupFile`, the wrapper all three call sites share. Version tolerance is
  delegated to `restoreStateFromBackup` from 8.1.8 rather than re-implemented, so an old
  backup converts forward through the one chain that is already tested.
- **The envelope, and why `parseBackup` also accepts a bare state.** Files written
  before today (the dev export) and anything pasted out of the emergency screen's state
  dump are plain state objects. Refusing them would have made restore useless for
  exactly the person who needed it most, so the parser accepts either shape: if there is
  a `.state` object, use it; otherwise treat the whole document as the state.
- **`BackupOfferModal`** — the post-upgrade offer. Built on `ConfirmModal`
  (`confirmColor="green"`, it is not a destructive action), not a new modal.
- **`App.tsx`** sets the offer inside `savePreConvertSnapshot().then(...)`, *before*
  `convertState` runs, so it appears whether the conversion succeeds or falls back to a
  blank state — in the failure case that raw object is the only copy of the data that
  exists outside storage. It carries the **raw pre-conversion state**, not the converted
  one: a file of the data as the previous build had it is what a broken converter needs.
- **List settings** got the two user-facing rows. Restore decodes *first* and shows the
  `ConfirmModal` with the passage and test counts read out of the decoded file, so the
  confirmation describes the file the user actually picked instead of asking them to
  confirm blind. Applying it is a plain `setState` — AppProvider's persist effect owns
  the storage write (CODING_RULES §4).

### Reported, not slipped in
The dev-mode rows in `AboutSettingsScreen` now delegate to `backupFile` instead of
keeping their own copy of the logic. That file was not in the step's *Files* list. It is
the same feature (leaving a second, worse state-import implementation next to the new
util was not defensible), the `_ `-mangling and the mimeType switch are gone, and dev
import is now version-tolerant. Flagged here and to Fedir rather than done quietly.

### Gotchas for next time
- `writeFile` returns `false` both for "user declined the folder picker" and for a real
  failure, and `readFile` does the same for cancel vs error. Export stays silent on
  `false` (a cancel must not toast an error); import toasts, matching what the passage
  import has always done. Fixing that distinction means changing `fileManager`, which
  belongs to a different step.
- The offer does not persist a "don't ask again" flag and does not need one: it can only
  be set on a boot that converted a state, and the next boot finds a matching version.
- **`(build)` was not completed.** The version bump to 0.1.2 is in `package.json` (the
  single source `app.config.js` reads), but `npm run build-dev` auto-submits to the Play
  staging track, so it is Fedir's to trigger. The SDK-36 native bump from 2026-07-22 is
  still riding along unbuilt; the ⚠️ note at the top of PLAN.md now says so.

### Needs manual verification on a device
Storage Access Framework is the part tests cannot reach: pick a folder, confirm the
`.json` lands there and opens, then restore it back and check the passage list and
stats survive. Worth also restoring a backup exported by an *older* build (the bare-state
shape) to exercise the conversion path, and cancelling both pickers to confirm nothing
is lost. `npm run lint` ✓ · `npm test` ✓ 30 suites / 136 tests / 22 snapshots.

## 2026-08-25 — 8.1.9a boot path cannot eat a state + 8.1.14 typed navigation

Two steps in one session. They share nothing except that both were holes the type
system and React semantics were quietly hiding.

### 8.1.9a — the two data-loss holes

**Hole 1: `.catch` meant "no state yet".** `loadState` read storage and, on *any*
rejection, wrote a blank state on top. react-native-storage rejects with a
`NotFoundError` for a key that was never written — but it rejects the same way for a
`JSON.parse` failure over a half-written record and for a native/disk failure. One
unreadable read of a real install and the data was gone, overwritten by the fresh state
the load path had already seeded in memory.

The fix is a classification, not a try harder: `loadStoredState` in `bootBackup.ts`
returns `{status:"found"|"empty"|"failed"}`, keying "empty" on the error *name*
(`NotFoundError`) and nothing else. `ExpiredError` deliberately counts as a failure —
this app sets `defaultExpires: null` so it cannot fire, and if it ever did it would mean
data exists. On `failed` the boot path now writes **nothing at all** and shows the
emergency screen. A test asserts that no outcome — found, empty, corrupted, backend
failure — ever calls `save`.

**Hole 2: the emergency screen was unreachable.** It sat inside a `try/catch` wrapped
around App's `return (...)`. React does not propagate a child's render error up the
parent's JS call stack — it unmounts the tree and looks for the nearest error boundary.
There was none, so the `catch` could never fire and a broken state rendered a blank app.
New `src/components/ErrorBoundary.tsx` is a real class boundary
(`getDerivedStateFromError` + `componentDidCatch`), with `renderFallback(error, reset)`
so the recovery buttons can clear the caught error after putting a usable state back.
The recovery UI itself moved to `src/components/EmergencyScreen.tsx` because it now has
two entry points (the caught render error, and the failed read).

The extracted screen keeps its raw `react-native` primitives and hardcoded bilingual
strings on purpose: it renders outside `AppProvider`, which is the whole point — it must
work when the state, theme or l10n code is what is broken (CODING_RULES §7).

While in there: `storage.save` after a conversion, and the initial-state write, were
both unguarded promises — a rejection left the app stuck before "ready" forever. Both
have handlers now; a failed persist after conversion runs on the in-memory state instead
of hanging, a failed *initial* write goes to the emergency screen.

### 8.1.14 — typed navigation

`ScreenModel` was `{ route: any; navigation: StackNavigationHelpers }`, and that
navigation type was imported through a literal `node_modules/@react-navigation/stack/
lib/typescript/src/types` path — in two files.

`RootStackParamList` is now a real map of all 19 `SCREEN` members to their params, and
it lives in **`models.ts`**, not `navigator.tsx`. That is the load-bearing choice:
`navigator.tsx` imports every screen, so a screen importing its props type from the
navigator would be a cycle. Screens use `ScreenPropsModel<SCREEN.x>` (an alias of
`StackScreenProps`), so `route.params` is typed per screen; `PassageScreen`'s local
`PassageRouteParams` became `PassageScreenParamsModel` in the param list. The
`@ts-ignore` on `navigation.addListener("beforeRemove", …)` in `testsScreen` is gone —
`beforeRemove` was always there, just not on the loose helpers type. `Header` takes the
real navigation type too, which removed the second raw `node_modules/…` import.

One call site could not be typed the obvious way: `services/fetch.ts`'s forced logout
takes `screen: SCREEN` — the whole union, not a literal — and react-navigation's
`navigate()` distributes its conditional over the union, so no single tuple matches.
`navigation.dispatch(CommonActions.navigate(screen))` is the same action with a plain
`string` name. No cast, no `any`.

### Reported, not slipped in
**`tsc --noEmit` does not cover `__tests__/`.** tsconfig's `include` is
`["*", "src/*", "src/**/*", "plugins/*"]` — `"*"` matches only top-level files, so the
whole test tree is unchecked. This surfaced when the e2e test compiled clean and then
threw `ReferenceError: SCREEN is not defined` at runtime; it is also why `route={{}}`
had been passing to screens whose route type never allowed it. Not fixed here — adding
`__tests__` to `include` will surface a batch of existing type errors and deserves its
own step. Fedir decides where it goes.

### Gotchas for next time
- A boundary's `reset()` re-renders the *same* children element it already holds. That
  is why the restore buttons must put the good state back **before** calling reset —
  reset alone just replays the crash.
- The e2e test now builds screen props through `makeScreenProps(SCREEN.x)`; a
  `StackNavigationProp` has ~20 methods, so a stub is honestly a cast. Keep it in one
  helper rather than casting at each render site.
- 8.1.14 is type-only: no runtime behaviour changed, and the 22 snapshots matching
  unchanged is the evidence. The two real runtime edits are the `CommonActions` dispatch
  above and `String(intentText)` in AppContext's notification handler (the payload is
  untyped data; the param list wants a string).

### Needs manual verification on a device
The boundary and the failed-read path cannot be reached from tests end to end. Worth
provoking once on a device: corrupt the state key (the dev-mode state rows can write a
truncated file back) and confirm the app shows the emergency screen **and leaves the
stored data alone**, then restore from the daily backup and confirm the app continues
without a restart. Also tap through every screen once — the navigation refactor touched
all 19 screens' props, and a wrong `SCREEN` key would now be a compile error, but a
missing back button would not.

`npm run lint` ✓ · `npm test` ✓ 31 suites / 149 tests / 22 snapshots. No build run:
neither step touches native config, and the 0.1.2 + SDK-36 bumps are still waiting on
Fedir's `npm run build-dev` (see the ⚠️ note at the top of PLAN.md).

---

## 2026-08-26 — 8.1.15 File renames to convention

The last naming debt in the app repo. 15 files renamed, 23 import sites rewritten,
**zero logic diff** — no exported identifier, no JSX, no behaviour touched.

Screens → PascalCase: `homeScreen` `listScreen` `testsScreen` `finishScreen`
`statsScreen` `calendarScreen` `settingsScreen` `loginScreen` `registerScreen`.
Components: `miniModal.tsx` → `MiniModal.tsx`, `setttingsMenuItem.tsx` (three t's) →
`SettingsMenuItem.tsx`, `testNevDott.tsx` → `TestNavDot.tsx`, `settingsListWrapper.tsx`
→ `SettingsListWrapper.tsx`, `weekActivityComponent.tsx` → `WeekActivity.tsx`,
`icondata.ts` → `iconData.ts`.

### How the case-only rename was done safely
Windows' filesystem is case-insensitive, so `git mv homeScreen.tsx HomeScreen.tsx` is a
rename onto itself. Every one went through a temp name —
`git mv X X.__tmp && git mv X.__tmp NewX` — and the result was verified against
`git ls-files` (the index, not the directory listing, which would lie about case) plus
`ls -1` for the on-disk casing. `git status` reports all 15 as `R`, so history follows
the files.

### What was deliberately NOT renamed
- **Exported identifiers.** `TestNavDot.tsx` still exports `TestNavDott` and
  `WeekActivity.tsx` still exports `WeekActivityComponent`. CODING_RULES §2 wants the
  file named after its export, so these two are half-done — but renaming identifiers is
  a different diff from renaming files, and the step said zero logic diff. Both are now
  noted in CODING_RULES §2 and FILEMAP so they can't be forgotten.
- **Test filenames.** `button.test.tsx`, `miniModal.test.tsx`, `settingsMenuItem.test.tsx`
  are camelCase, which §2 already allows for non-component modules, so no `.snap` file
  had to move with a test. That is why all 22 snapshots matched with no `.snap` churn —
  the strongest evidence available that this refactor changed nothing.

### Gotchas for next time
- **`sed -i` across the tree makes `git status` lie.** After rewriting imports, ~80 files
  that were never edited showed up as ` M`. They are unchanged: `git diff` on them is
  empty. `core.autocrlf=true` with no `.gitattributes` means git compares a normalized
  copy; those files already had LF-only endings in the working tree and git had been
  skipping the content check on a stale stat cache. Touching them (same bytes, new
  mtime) forced the real comparison and the "LF will be replaced by CRLF" warning. `sed`
  does not rewrite line endings — files that genuinely had CRLF (e.g. `levels/Level1.tsx`)
  stayed clean. Check `git diff --stat`, not `git status`, after a bulk edit here.
- Renames land in the index immediately (`git mv` stages them), so the working tree and
  the index disagree until the import fixes are staged too. Expect `RM` rows.

### Reported, not slipped in
- The two stale exports above (`TestNavDott`, `WeekActivityComponent`) — an identifier
  rename is its own small step if Fedir wants it.
- `__tests__/` filename casing is a coin-flip mix (`AddressPicker.test.tsx` and
  `Text.test.tsx` vs `button.test.tsx` and `header.test.tsx`). Nothing is broken and no
  rule is violated; purely cosmetic. Fedir decides whether it is worth a step.

### Needs manual verification on a device
Nothing specific — but this is a Metro-resolution change, and Metro caches module paths
aggressively on a case-insensitive filesystem. The first `npm run dev` after this should
be started with a cleared cache (`npx expo start -c`) at least once; a stale cache can
resolve `screens/homeScreen` from memory and hide a broken import that CI would catch.

`npm run lint` ✓ · `npm test` ✓ 31 suites / 149 tests / 22 snapshots, no `.snap`
changed. No build run: no native config or dependency touched. The 0.1.2 + SDK-36 bumps
are still waiting on Fedir's `npm run build-dev` (⚠️ note at the top of PLAN.md).

---

## 2026-08-26 — 8.1.15a Naming tail (the two findings 8.1.15 reported)

Fedir approved both out-of-scope items from the previous entry, so they were done as a
follow-up rather than being carried. Same shape as 8.1.15: renames only, no behaviour.

### 1. The last two near-miss exports
`TestNavDot.tsx` exported `TestNavDott` and `WeekActivity.tsx` exported
`WeekActivityComponent` — files renamed in 8.1.15, identifiers left behind. Now
`TestNavDot` / `TestNavDotModel` and `WeekActivity` (including its
`.displayName`, which was still the old string and would have shown up wrong in React
DevTools). 11 call sites across `TestsScreen.tsx`, `HomeScreen.tsx` and
`e2e/flow.test.tsx`. Grepping either old spelling now returns nothing.

Safe because the import paths were already the *new* file names: `s/TestNavDott/TestNavDot/g`
cannot touch `from "../components/TestNavDot"`, and `s/WeekActivityComponent/WeekActivity/g`
cannot touch `from "../components/WeekActivity"`. Doing the file renames first and the
identifier renames second is what made each pass a single unambiguous substitution —
the reverse order would have needed anchored patterns.

### 2. Test filenames match their subjects
Eight camelCase component tests and their snapshots renamed, plus the root smoke test:
`button` `checkbox` `header` `icon` `input` `miniModal` `select`
`settingsMenuItem` → PascalCase, `app.test.tsx` → `App.test.tsx`. Every
`__snapshots__/*.test.tsx.snap` moved with its test in the same temp-name `git mv`
pair. `__tests__/utils/*` already matched their camelCase subjects and were not
touched; `e2e/flow.test.tsx` is a scenario, not a module test, so it stays camelCase.

**Jest resolves snapshots by test filename**, so a `.snap` left behind would not have
failed — it would have silently written a fresh empty snapshot file and reported the 22
as passing. The real check is that the run reported no *written* and no *obsolete*
snapshots (`npm test` prints both). That is the assertion to grep for after any test
rename, not the pass count.

### Rules added so this cannot drift again
CODING_RULES §2 now says the file is named after its export **exactly** (no
near-misses), and adds the missing rule: a test is named after its subject, casing
included, and a snapshot always moves with its test. Both were unwritten conventions
that everything had been half-following.

### Needs manual verification on a device
Nothing beyond 8.1.15's note (start once with `npx expo start -c`). The only runtime
change in this entry is `WeekActivity.displayName`, which is a DevTools label.

`npm run lint` ✓ · `npm test` ✓ 31 suites / 149 tests / 22 snapshots, none written,
none obsolete. No build run: no native config or dependency touched.

## 2026-08-26 — 8.1.17 + 8.1.18 prepared for release (nothing committed)

Fedir asked for both steps *and* explicitly for no commits — "just prepare". So both
boxes stay unchecked in PLAN: the code is on disk and green, but a deploy that has not
been pushed is not a deploy. The handover block at the top of PLAN is the source of
truth for what he still has to do; this entry is why each piece looks the way it does.

### 8.1.17 — the three sub-tasks

**1. The undeployed mailer/migration hardening.** Nothing to write: `verifyMailer` and
`ensureUsersTableColumns` were already correct and already wired into `app.ts`. The
reason they have never run in production is duller than a bug — the two commits that
add them (`c8bd06e`, `09c950a`, 2026-07-11) exist **only in the local clone**.
`origin/staging` and `origin/production` are identical and predate both. So "ship it"
here is literally `git push`, and the risk is that a year from now someone reads
"committed but undeployed" and goes looking for a deploy problem that never existed.
Worth knowing: `git log origin/<branch>..<branch>` is the check, not `git log`.

**2. `/.well-known/assetlinks.json`.** Fedir's answer to "where do I get the signing
fingerprint" was that he doesn't need one, EAS builds and signs the app. That is true
of *signing* and not of *verification*: Android fetches this file and compares the
SHA-256 in it against the certificate that actually signed the installed APK — with
Play App Signing that is Google's app-signing key, which EAS uses but never writes
anywhere the server can read. Without the value the file cannot be correct, so the
value had to become configuration rather than a constant:

- `src/utils/assetLinks.ts` — the pure half. `parseFingerprints` takes the raw env
  string (comma / semicolon / newline separated), uppercases, and **drops** anything
  that is not 32 colon-separated hex pairs. Dropping rather than passing through is
  deliberate: Android rejects the *entire* file if one statement is malformed, so a
  partial list beats a broken one. It logs what it dropped so a typo is findable.
  `buildAssetLinks` returns the `delegate_permission/common.handle_all_urls` statement.
- `routes.ts` — `GET /.well-known/assetlinks.json`, reading
  `process.env.ANDROID_CERT_FINGERPRINTS` **inside the handler**, not at module load.
  That is what makes the supertest case possible at all (a module-load read would bake
  in whatever the env was when jest imported `app.ts`) and it means changing the value
  is an env edit plus a restart, never a rebuild.
- With nothing configured it answers **503, not 404 and not an empty statement**. An
  empty `sha256_cert_fingerprints` array is a *valid-looking* file that silently never
  verifies — the worst possible failure here, because everything looks wired up.
- 5 tests: parse/build incl. the malformed cases, plus 200-with-`application/json` and
  503 through supertest.

**3. nodemon → node.** Fedir chose the wider fix. Both *deployed* compose services
(`staging`, `production`) now run `node --env-file=... ./dist/app.js`; a built image has
no source to watch, and `restart: unless-stopped` already is the supervisor, so nodemon
was a process in the middle that could only add failure modes. `local` keeps it — that
service bind-mounts the source, which is the one place a watcher earns its keep. The
Dockerfile's `CMD` was also wrong in a way nobody would have noticed: it pointed at
`./app.js`, which does not exist (the build emits `./dist/app.js`), and was dead only
because every compose service overrides it. It is now env-agnostic `node ./dist/app.js`
— the compose service picks the environment, the image does not guess.

**`.production.env` survives — verified, not assumed.** The deploy script runs
`git reset --hard origin/production`. That only rewrites *tracked* files, and
`git log --all -- .production.env .staging.env` returns nothing: they have never been
tracked in any branch, on top of being gitignored. There is no `git clean` in the
script either. Both conditions have to hold, so both were checked.

### Also done here: `base.servise.ts` → `base.service.ts`
Not scope creep — STRATEGY §7 and CODING_RULES §2 both say this rename happens
"whenever bbh-api is next touched", and this is that session. 7 import sites plus one
stale mention in a `constants.ts` comment. `servise` → `service` is a real letter
change, so unlike the app-repo renames in 8.1.15 it needed no temp-name dance on
case-insensitive Windows. Both repos now have zero naming offenders; the rule in
CODING_RULES §2 was updated to say so rather than to point at a remaining one.

### 8.1.18 — the bump, and a lockfile that had drifted
`package.json` 0.1.2 → 0.2.0. The find worth recording: `package-lock.json` still said
**0.1.1** in both root `version` fields — the 8.1.9 bump edited `package.json` alone,
and the drift survived because CI has not run since (the app repo has 5 unpushed
commits). Both fields are now 0.2.0, and `npm ci --dry-run` resolves clean, which is
the actual gate — every workflow's first real step is `npm ci`, so a lockfile CI
refuses kills the run before lint, tests or EAS ever start.

### Gotchas for next time
- **Encoding.** `routes.ts` contains `res.send("Вітаю!")` and the docs are full of
  em-dashes; patches went through `node` with explicit utf8 (and re-checked with
  `file`) rather than PowerShell text cmdlets, which double-encode UTF-8 here.
- **CRLF.** `__tests__/app.test.ts` and most docs are CRLF while prettier writes LF.
  `core.autocrlf=true` normalizes on commit so the diff stays clean either way, but a
  literal multi-line anchor match fails unless the needle is converted first.
- `data/test.db` is modified by every test run and is tracked, so it shows up in the
  diff. Pre-existing habit (both 2026-07-11 commits carry it); see the follow-up below.

### Follow-up the same session: the mailer, and an answer about `test.db`

Fedir asked for the SMTP finding to be fixed, and asked what the problem with
`data/test.db` actually is given that it is only a test database. Both below.

**The mailer no longer touches the network.** The obvious fix — inject a fake
transport — only covers *direct* callers of `sendEmail`. Three of the four real
connections came from controller tests hitting `/api/user/requestEmailConfirmation`
and the password-reset routes, which reach the mailer through a controller and cannot
pass anything in. And `email.ts` builds its transporter at module load, so by the time
a test runs, the object already exists. The only place that covers every path,
including routes added later, is the library itself: new `jest.setup.ts`
(`setupFilesAfterEnv`) mocks `nodemailer` so `createTransport` hands back a stub.

`__tests__/utils/email.test.ts` was rewritten rather than left alone, because one of
its cases was actively wrong: *"should return false when sent in testing env"* passed
only because the credentials in `.test.env` are broken. It asserted the state of an
environment, not the behaviour of the code — fix the credentials and the test fails.
It now injects an accepting transport (expect true), a rejecting one (expect false,
and specifically **not** a throw — every `sendEmail` call in `user.controller.ts` is
fired without `await`, so a throw would surface as an unhandled rejection instead of
a failed request), and a spy proving the missing-argument guard returns before it
reaches the transport at all. 4 email tests → 6, suite 48 → 50, run time unchanged at
~3.6s but with zero sockets. The dead `dotenv.config({ path: "../.staging.env" })` at
the top of that file went with it — it pointed outside the repo and loaded nothing
(the same dead line is still at the top of `app.test.ts`; left alone, not in scope).

**`data/test.db`: Fedir is right that there is no correctness problem.** Checked
rather than assumed — deleted the file, ran the full suite: 50/50 pass and sqlite3
recreates it. Nothing reads its contents. The controller suite opens with
`POST /api/createDB` and closes with `DELETE /api/dropDB`, so it builds and tears down
its own schema; the committed file is an **artifact, not a fixture**. It is tracked
only because `.gitignore` says `*.db` and then explicitly `!test.db`.

So the cost is not correctness, it is diff hygiene: every test run rewrites sqlite
page headers, so an unreadable 20KB binary lands in every commit that ran tests, and a
binary conflict between two branches cannot be merged — you pick a side and hope. If
Fedir wants it gone it is two commands (drop the `!test.db` line, `git rm --cached
data/test.db`) and the suite is unaffected. **Not done — his call**, and it is a
one-line `.gitignore` change either way.

### Needs manual verification
- After the bbh-api push **and** the env value: `curl -sI https://biblebyheart.app/.well-known/assetlinks.json`
  must be `200` with `content-type: application/json` and **no redirect** — Android
  fails verification on a 301/302, which a reverse proxy can easily introduce.
  Then reinstall the app and tap an `https://biblebyheart.app/passages` link: it should
  open the app, not the browser. `adb shell pm get-app-links com.CalmTed.bibleByHeart`
  shows the verification state if it does not.
  **Order matters:** Android verifies at *install time* and caches the answer, so the
  file has to be live and correct **before** the 0.2.0 build is installed — otherwise
  the app was told "no" and will keep believing it. Forcing a recheck on an
  already-installed app is `adb shell pm verify-app-links --re-verify com.CalmTed.bibleByHeart`.
  The fingerprint to use is Google's **app signing key** (Play Console → Test and
  release → Setup → App integrity → App signing), not the EAS upload key: Play re-signs
  the delivered APK, so the upload cert is not what the device sees. Add the EAS
  keystore's SHA-256 as a second entry only if App Links should also work on builds
  installed outside Play.
- The production container: confirm it comes up under plain `node` and that
  `ensureUsersTableColumns` + `verifyMailer` log on boot — that is the first proof
  those two have ever run outside a test.

`npm run lint` ✓ both repos · bbh-api `npm test` ✓ 7 suites / **50** tests (was 6/38) ·
app `npm test` ✓ 31 suites / 149 tests / 22 snapshots, none written, none obsolete ·
`npm ci --dry-run` ✓. No build run and no commit made — both are Fedir's to trigger.

### Follow-up: the fingerprint is on the VPS (2026-08-26, same session)

Fedir supplied the Play app-signing SHA-256 and asked for it to be written to the env
file using the credentials in bbh-api's `.agent`. Done as the `deploy` user (it owns
both env files and needs no sudo — root was available but unnecessary).

**The append nearly ate `MAIL_PASS`.** Neither `.production.env` nor `.staging.env`
ended with a newline, so the obvious `echo "KEY=VAL" >> file` would have produced
`MAIL_PASS=<secret>ANDROID_CERT_FINGERPRINTS=…` — one line, mail broken, and nothing
would have complained until the next email failed to send. `printf "\nKEY=%s\n"` is
what was actually used. **Check `tail -c1` before appending to any env file on that
box**; a blank line is harmless to node's `--env-file` parser, a fused line is not.

Guard rails used, worth repeating for any future server edit:
- timestamped copies to `~/env-backups/` — deliberately *outside* `/usr/src/bbh-api`,
  so they cannot show up as untracked files in the deploy checkout;
- the pre-edit md5 of each file was recorded first, then re-checked against
  `head -c <original bytes>` afterwards. Both matched, which proves the edit was purely
  an append and touched no existing secret;
- the value was run through the **built** `dist/utils/assetLinks.js` before being sent,
  not through the source — the artifact production actually loads;
- nothing was restarted. Node reads `--env-file` at process start, so the value is
  inert until the deploy in step 1 rebuilds the container, and that is the correct
  order anyway. Both containers still report `Up 6 weeks`.

**Pre-flight that removed the last real unknown.** `/.well-known/` is exactly the kind
of path a reverse proxy claims for itself (Caddy uses `/.well-known/acme-challenge/`),
and if it did, the endpoint would have been unreachable no matter how correct the code
was. Requesting it today, before deploy, answers that: the 404 comes back as Express's
own `Cannot GET /.well-known/assetlinks.json`, not a Caddy page — so the path proxies
through and only the route is missing. `curl -L` also reported `redirects=0`, the other
thing Android refuses. Both boxes ticked before a line of it ships.

Incidental: production still answers `{"version":"0.0.1"}` and both containers have
been up six weeks, which is independent confirmation that `verifyMailer` and
`ensureUsersTableColumns` have never run outside a test.

**Found, not fixed, needs Fedir's decision:** Caddy serves **`www.biblebyheart.app`**
alongside the bare domain, but the App-Links intent filter in `app.config.js` lists
only `biblebyheart.app`. A shared `www.` link will therefore open the browser, not the
app. Fixing it is a second `data` entry in the intent filter plus a rebuild — so it is
either part of a build step or nothing, not a drive-by edit.

## 2026-08-26 — CI red on both platforms: Node 20 vs eas-cli 22.5.0

Not a step from `PLAN.md` — Fedir reported the GitHub Action failing for Android *and*
iOS, with nothing visible on the EAS side. That last detail is the whole diagnosis: if
EAS shows no build, the run died before `eas build` was ever called, so the problem is
in the runner, not in the build.

The log's real line is buried under a wall of `uuid`/`glob` deprecation warnings:

```
error @oclif/plugin-autocomplete@3.3.0: The engine "node" is incompatible
with this module. Expected version ">=22.0.0". Got "20.20.2"
```

`expo/expo-github-action@v8` was asked for `eas-version: latest`, resolved that to
eas-cli **22.5.0**, and yarn refused to install it because the job's Node was pinned to
**20**. The three EAS jobs (staging Android, staging iOS, production Android) all set up
Node the same way, which is why both platforms went red at once — one shared cause, not
two bugs.

Worth naming the two red herrings the log leads with, so the next reader skips them:
- *"Node 20 is being deprecated… running with Node 24 by default"* is about the Node the
  runner uses to execute action code. It has nothing to do with the Node that `setup-node`
  installs for the job, which is what yarn saw.
- *"Failed to restore: Cache service responded with 400"* is a warning from the action's
  eas-cache. It fails soft — the install proceeded on the very next line.

**Fix:** `node-version: "20"` → `"22.17.0"` in all five `setup-node` steps across both
workflow files. 22.17.0 is not an arbitrary bump — it is exactly what `eas.json` already
pins for the EAS build workers under both the `staging` and `production` profiles, so CI
and the builders now agree on a version instead of drifting apart. Nothing else changed;
`FILEMAP.md` already describes both workflows and no file moved, so it needed no edit.

`npm run lint` ✓ · `npm test` ✓ (31 suites, 149 tests). Neither touches CI, but the bar
is the bar, and it confirms the repo was healthy and only the runner was broken.

**Second change, asked for by Fedir the same session:** pin `eas-version: latest` →
`22.5.0` in all three EAS jobs. `latest` was the standing cause rather than the trigger —
today needed no commit from us to break, an upstream release was enough. 22.5.0 is what
`latest` resolves to right now, so this pins the current state rather than moving it.

He asked to "make sure it will not break other things", so it was verified, not assumed:
- all four flags the workflows pass (`--profile`, `--platform`, `--auto-submit-with-profile`,
  `--non-interactive`) are still present in v22's `oclif.manifest.json`;
- `eas.json` was checked against v22's **actual** schema rather than by eye. Installing
  `@expo/eas-json@22.0.0` (the exact version eas-cli 22.5.0 depends on) and running it over
  the project parsed all five build profiles and all three submit profiles clean, and
  confirmed `appVersionSource: "local"` and `cli.version: ">= 3.12.0"` are still accepted.

**The pin is narrower than it looks, and that is the part worth remembering.** eas-cli
declares `@oclif/plugin-autocomplete: ^3.2.40` — a range spanning 3.2.40 (node >=18) up to
today's 3.3.0 (node >=22). The action runs `yarn add` with **no lockfile** ("info No
lockfile found." is right there in the log), so every transitive dep still resolves to the
newest match on every single run. Pinning eas-cli pins eas-cli and nothing beneath it; a
future 3.x can raise the floor again. **Node 22 is the real fix**; the pin only buys
protection from eas-cli's own majors.

One more trap worth recording: `npm view eas-cli engines` reports `node: ">=20.0.0"`, which
makes 22.5.0 look Node-20-compatible. It is not. The true floor is set by that transitive
oclif plugin, and yarn v1 enforces transitive engines strictly where npm would only warn.
Trusting the top-level `engines` field would have produced exactly the wrong conclusion.

**On "is staging up to date" (his question):** the *source* is. `staging` HEAD carries
API 36 and version 0.2.0, and the only uncommitted files in the tree are the two workflows
and this diary. What is stale is the *artifact*: API 36 landed in `dee46e9` on 2026-08-24,
and CI has been unable to install eas-cli since, so no staging build carrying API 36 has
ever reached the internal track. Nothing is wrong with the branch — the pipeline simply
never ran to completion after that commit.
**Third change — Fedir's decisions on the two open items, same session.**

*Transitive hole → option A, leave it.* Node 22.17.0 is the fix and it stands on its own;
the next break would need some dependency to demand Node 24. No lockfile is fed to the
action's `yarn add`, and that stays true. Deliberate, not overlooked.

*eas-cli in `package.json` → option B, bump `16.13.0` → `22.5.0`, stays in `dependencies`.*
Local and CI now run the same eas-cli instead of drifting six majors apart.

**A correction worth recording, because it nearly cost something.** An earlier note in
this entry called that dependency "dead weight… not what the step invokes". Half right.
True for the workflow's bare `run: eas build`, which is not an npm script. False for
`npm run build-dev` — npm puts `node_modules/.bin` on PATH for scripts, `node_modules/.bin/eas.CMD`
is right there, and `eas` is **not** installed globally on his machine (`command not found`).
Removing it would have broken the documented dev-build command. Option A ("remove it") was
on the table on the strength of that wrong claim. Check what a binary actually resolves to
before calling it unused.

*devDependency inconsistency → fixed.* `@react-navigation/native`, `@react-navigation/stack`
and `@react-native-async-storage/async-storage` moved from `devDependencies` to `dependencies`:
6 runtime imports across `src/` between them. Their own peers (`react-native-screens`,
`react-native-safe-area-context`, `react-native-gesture-handler`) were already in the right
place, which is what confirmed exactly those three were misplaced and nothing else. It built
before only because EAS installs devDependencies; any `npm ci --omit=dev` would have produced
a bundle that dies on import.

**"Make sure the error will not occur next push" — what was actually verified, not assumed:**
- `npm ci` from the regenerated lockfile: **exit 0**. This one matters most — `npm ci` hard-fails
  when `package.json` and `package-lock.json` disagree, so bumping the dependency without
  regenerating the lock would have swapped one red pipeline for another;
- `npm run lint` **exit 0** and `npm test` **exit 0** (31 suites, 149 tests) run *after* that
  clean install, so they reflect the real post-change tree, not a warm one;
- both workflow files parsed as YAML and every job's resolved values read back: five
  `setup-node` steps at 22.17.0, three EAS steps at 22.5.0, no job missed;
- the decisive one — every `engines.node` in the whole eas-cli 22.5.0 tree checked with semver
  against 22.17.0: **312 packages declaring engines, zero incompatible.** The same audit over
  the project tree: **1176 packages, zero incompatible.** The failure class that broke the
  pipeline is proven absent rather than presumed gone.

**Fourth change — `packager: npm` on all three EAS steps.** The audit above had one honest
gap: it resolved with npm while the action installed with yarn. Fedir's call was to close
it by making CI install the CLI the same way the project does. The repo is npm end to end —
`package-lock.json`, `npm ci`, no `yarn.lock` anywhere — so the action reaching for yarn was
the only yarn in the pipeline.

The action's input defaults to `yarn` and runs `<packager> add <name>@<version>` in a temp
dir, then moves the result into the tool cache. `npm add eas-cli@22.5.0` was run exactly that
way before editing anything: exit 0, 517 packages, `node_modules/.bin/eas` present, version
reports 22.5.0. So the simulation from the previous section is now a simulation of the real
command rather than a near-neighbour of it.

Two consequences, and the second is not an improvement:
- the install path stops depending on a package manager nothing else in the repo uses, and
  the log's `warning: Failed to restore: Cache service responded with 400` yarn-cache noise
  should go with it;
- **it changes the failure mode of the hole Fedir chose to leave open.** yarn v1 enforces
  transitive `engines` strictly — that strictness is precisely what turned today's incident
  into a loud, immediate, correctly-diagnosed install failure. npm only warns. If some future
  dependency raises its Node floor again, npm will install it happily and the breakage will
  surface later and further from its cause. Given Node 22.17.0 currently satisfies all 312
  engine declarations in the tree, nothing is broken by this today; it is a trade of early
  loud failure for late quiet failure, made knowingly.

Re-verified after the edit: both files still parse, and every job reads back
`node 22.17.0 | eas 22.5.0 | packager npm | token set` — the `token:` line survived the
insert in all three steps, which was the one thing a blind sed could plausibly have eaten.


## 2026-08-27 — 8.2.1 Install `react-native-reanimated` (0.3.0 Candy UI opens)

Fedir cleared the 0.2.0 milestone (8.1.17 + 8.1.18 shipped) and pointed at 0.3.0:
"reanimated modal, and wrapper rethink", with the standing instruction to stay humble and
careful and to remember that **the target is UX, not passing tests**.

**Versions.** `react-native-reanimated ~4.1.1` (resolved 4.1.7) + `react-native-worklets`
0.5.1, both taken from `expo/bundledNativeModules.json` via `npx expo install` rather than
picked by hand, and both landed in `dependencies` — an earlier diary entry records what it
costs when a runtime dep hides in `devDependencies`. Reanimated 4 needs the New
Architecture; `app.config.js` already has `newArchEnabled: true`, so nothing to change.

**The babel config was NOT touched, and that is the finding of this session.**
`babel-preset-expo` 54.0.11 (`build/index.js:284-291`) auto-appends
`react-native-worklets/plugin` whenever the package resolves, falling back to
`react-native-reanimated/plugin` for v3. So the historically flakiest change in this repo
(STRATEGY §6 — the `react-native-fetch-api` polyfill once broke `useColorScheme()`) turned
out to require no config edit at all. `babel.config.js` is byte-identical to HEAD. A future
session "fixing" a missing plugin by adding it manually would double-apply it — that
warning is now in CODING_RULES §4 and FILEMAP's toolchain row.

**The trivial animation is `MiniModal`'s entrance.** Chosen over a throwaway demo because
MiniModal is the dialog base for **19 files**: one ~15-line change and every confirm,
picker and About dialog in the app gets the new feel at once. The backdrop fades on a
`withTiming`; the card springs up on `withSpring`. Two drivers on purpose — opacity must
not overshoot past 1, while the card's travel is *supposed* to overshoot (~2%, which is
the "candy"). RN's `animationType` went `"slide"` → `"none"`: the entrance is ours now.

Only the **entrance** is animated. An exit needs the modal to stay mounted past
`shown=false`, which is a structural change and belongs to 8.2.2 (Modal purge), not here.

**New `ANIMATION` block in `constants.ts`** (fade ms, spring config, rise distance/scale).
Deliberately introduced now rather than later: if 8.2.2–8.2.5 each invent their own
numbers, the app ends up animated but inconsistent, which reads as assembled rather than
designed. Same discipline as colors coming from the theme.

**How far verification actually got.**

- `npm run lint` exit 0; `npm test` 31 suites / **150** tests / 22 snapshots green.
- Exactly 2 snapshots changed (`MiniModal`, `ConfirmModal`) and the diff was **read before
  being accepted**: `animationType` slide→none plus reanimated's jest metadata. Every
  underlying color and layout value byte-identical. No other suite moved.
- The babel transform was proved directly: `__workletHash`, `__initData` and
  `__stackDetails` all present in `@babel/core` output for a `useAnimatedStyle` callback.
- A full `expo export --platform android`: **1631 modules, no Metro/babel warnings**, and
  the shipped 4.6 MB Hermes bytecode contains `__workletHash` / `WorkletsModule`. That is
  also the real "gesture-handler still fine" evidence — its 4 import sites bundled clean.
- `npm ci` exit 0, checked deliberately because a desynced lockfile is exactly what broke
  CI on 2026-08-26.

**What jest CANNOT show, stated plainly.** The animation does not progress under
jest-expo's mock — `advanceAnimationByTime` is a no-op and `getAnimatedStyle` returns `{}`.
So the new test asserts what is actually provable: the worklet *executes* and computes the
first frame from `ANIMATION` (`opacity 0`, `translateY 16`, `scale 0.94`), read off the
host node's `jestAnimatedStyle.value`. It is a **toolchain canary**, not a library test —
and it was verified to fail by temporarily disabling the plugin (`babel-preset-expo` with
`{worklets:false, reanimated:false}` → `WorkletsError: Failed to create a worklet`), after
which the config was restored and diffed against HEAD. An alarm that never rings is worse
than no alarm.

No `testID` was added to reach the node — `src/` has zero of them today, and one proof
test is not a reason to introduce a new convention into production components silently.

**⚠️ MANUAL VERIFICATION REQUIRED — and it is not optional.**
Reanimated is a **native** module. An existing binary does not contain it, so `npm run dev`
against the old dev client will not merely lack the animation — it can fail outright. The
build must happen before any of this can be seen. Two things to look at on the device:

1. every dialog fades + springs in (settings confirms, level picker, About, delete
   confirmations) — and is smooth on the oldest small Android available;
2. **the failure mode to watch for is an invisible dialog.** The card starts at
   `opacity: 0` by design, so if the native side were missing, dialogs would render blank
   rather than crash. If that happens the animation is not at fault — the native build is.

Version bumped 0.2.0 → **0.2.1** per the PLAN's `(build)` rule. `npm run build-dev` was
**not** run: it carries `--auto-submit-with-profile staging`, i.e. it submits to the Play
internal track, which is Fedir's to trigger. The lockfile bump was done by regenerating via
`npm install` after a first hand-rolled attempt was caught rewriting four *dependency*
entries that legitimately sit at 0.2.0 (`chromium-edge-launcher`, `eastasianwidth`,
`sandbox-cli-detector`, `universalify`) — all four verified back at 0.2.0 afterwards.

**Fedir's UX review of the add-passage flow → 8.2.1a/b/c in PLAN**, not fixed here.
The address-selector complaint was diagnosed while scoping the session:
`AddressPicker.tsx:158-183` builds the header title from `curPartIndex` (which part is
being *edited*) instead of from `tempAddress` (what has been *picked*). The line is
`startVerse = curPartIndex < 3 ? "" : ...`, and since 8.1.7 deliberately stopped
auto-advancing after the start verse, `curPartIndex` stays at 2 forever — so the verse the
user just tapped is structurally unable to appear. Not a styling slip: the title's data
source is wrong. Two more in the same file — the selected verse is a flat `mainColor` fill
where the app's idiom is a gradient ring, and the footer is a `position:absolute` column
that covers the last row of verses.

*Out-of-scope finding, reported not fixed:* `npx expo install --check` flags three
pre-existing drifts unrelated to this work — `expo@54.0.35` (wants ~54.0.37),
`expo-constants@18.0.13` (~18.0.14), `jest-expo@54.0.17` (~54.0.18). Confirmed
pre-existing: the reanimated install touched only those two deps. Fedir decides whether
that becomes a step.

## 2026-08-27 — 8.2.1a AddressPicker ground-up fix

Three defects, one file (`src/components/AddressPicker.tsx`), no new l10n strings.

**1. The header title had the wrong data source.** It was built from `curPartIndex` —
which part is being *edited* — with rungs like `startVerse = curPartIndex < 3 ? "" : …`.
Since 8.1.7 deliberately stops the picker on the start verse instead of auto-advancing,
`curPartIndex` never passes 2, so the verse the user just tapped was structurally unable
to appear. Replaced by a module-level pure `getPickerTitle(address, t)` that reads
`tempAddress`: NaN (or `null`, which the model allows for the two end fields) = not
picked yet, and a fully picked address is handed to `addressToString` so the picker and
the rest of the app spell an address the same way. The in-between range state
("Genesis 1:1-3", end chapter picked, end verse not) is the one case `addressToString`
cannot render — `!endChapterNum` is true for chapter index 0 — so it is formatted here.

**2. Selected verse was a flat `mainColor` fill.** Now the app idiom: a
`gradient1`→`gradient2` LinearGradient with 2px padding over a `bgSecond` inner circle —
the same ring `Button type="outline"` draws. The label keeps `colors.text` instead of
flipping to `colors.bg`. Written up as a rule in CODING_RULES §4 so the rest of 0.3.0
does not reinvent a fill.

**3. The footer covered the last row of verses.** It was `position:absolute; bottom:0`
over a list styled `height:"93%"`. Now the modal has a `flex:1` root column: header,
`flex:1` list, footer as a real row. Two related fixes fell out — `APstyle.listView` was
being applied *twice* (once as the outer container, once as the wrap container inside the
ScrollView, dragging `height:"93%"` in with it), so the wrap styles moved to the
ScrollView's `contentContainerStyle`; and the footer became horizontal, secondary
("Extend range") left, primary ("Add") right.

**Testing.** 5 new tests, 155 total. The title is asserted at every rung (nothing picked →
book → book+chapter → book+chapter+verse), plus the range title and the back button
receding one step. Two gotchas worth remembering:

- `fireEvent.press` walks **up** the tree from the node you hand it, never down. Pressing
  the composite `IconButton` (or the `Icon` inside it) silently does nothing, because
  neither has a press-handling *host* ancestor between it and the header. The back button
  is reached as `UNSAFE_getAllByProps({ accessible: true })[0]` — Pressable's host View.
- On the **composite** `LinearGradient` element `props.colors` is still the string array
  you passed; only the host `ViewManagerAdapter_ExpoLinearGradient` below it carries the
  `processColor`-ed ints. Assert against whichever node you actually queried.

The selected ring is identified in the test as "the only 66px-wide LinearGradient" rather
than by a `testID`, keeping the 8.2.1 decision: `src/` has zero testIDs and a single proof
test is not a reason to start that convention without Fedir saying so.

The two 8.1.7 footer tests were left byte-identical and still pass — the add /
extend-range behaviour is unchanged, only its placement and the title above it.

**Needs manual verification** (no build required — this is JS-only, it rides along on the
8.2.1 reanimated build): on a device, walk book → chapter → verse and check the title
updates at each tap; check the ring reads as "selected" against both themes (light theme's
`gradient1` is yellow `#E7DF0B`, which is louder than dark's green); and scroll to the
bottom of a long chapter (Psalm 119, 176 verses) to confirm the last row is now reachable
above the footer.

## 2026-08-27 — 8.2.1b Translation selector inside the add-passage flow

**The step, plus Fedir's amendment.** PLAN asked for the translation to be the next thing
the user meets after the address, instead of a field further down `PassageEditor`. Fedir
added the half that matters more: *ask only if it is not clear — if there is only one
existing translation, omit the selector.* So this is not "move a field", it is "ask a
question, and only when there is a question".

**The decision is a util, not an `if` in a screen.** `src/utils/getTranslationChoice.ts`
takes `settings.translations` and returns `{ needsChoice, translationId }`:
`needsChoice` is `translations.length > 1`; `translationId` is the default translation,
falling back to the first, and is `undefined` only when the list is empty. That is the
whole rule, and being pure it is the thing the unit tests pin (6 of them) instead of
re-deriving it from rendered UI.

**Flow.** `ListScreen.handleAPSubmit` now: verse-limit check first (unchanged, it just
returns early now instead of nesting) → if `needsChoice`, park the picked address in
`addressAwaitingTranslation` and show a `SelectModal` titled `SelectTranslationTitle`,
preselected on the default translation → on pick, `navigate(SCREEN.passage, { address,
translationId })`. With one translation (or none) nothing is shown and the navigate
happens immediately with the resolved id. Dismissing the modal drops the pending address
and goes nowhere — nothing had been persisted (the flow stays momentary/draft until Save,
as it was).

Reuse, not new machinery: `SelectModal` is the existing modal list picker, so the step
inherits MiniModal's 8.2.1 spring entrance for free, and `translationId` was already a
`PassageScreenParamsModel` field (8.1.14) — no param-list change.

**PassageEditor.** The `Select` moved out of the bottom `selectorsWrapper` (LevelPicker
stays there alone) into its own row directly under the address and above the verse text —
the text is what the translation decides, so it now reads top-to-bottom. Fetch-on-change
(`TRANSLATIONS_TO_FETCH`, the two effects) is untouched, and it keeps working through the
new flow: a new passage arrives with `translationId` already set, so the mount effect
fetches exactly as before.

**One judgment call, flagged for Fedir.** The editor's `Select` is NOT hidden when only
one translation exists, unlike the flow step. Its option list also carries "Other" (=
custom translation, `verseTranslation: null`), so hiding it would leave a user who has
deleted all but one translation with no way to mark a passage as custom-text. The
"omit when clear" rule is applied where the ambiguity actually is — the add flow. Say
the word and the editor row can hide too.

**Also out of scope, reported not fixed:** the share-intent path
(`handleTextFromIntent`) picks a translation by matching the parsed address language and
silently falls back to `undefined` when nothing matches — that is the same "unclear"
situation the new step exists for, but it is a different entry point and 8.2.1b did not
touch it.

**Testing.** 9 new tests, 164 total. The 3 flow tests live in a new
`__tests__/screens/ListScreen.test.tsx` (first screen test in the repo) and drive the
**real** address picker — Genesis → 1 → 1 → "Add" — rather than calling the handler, so
they break if the picker's contract changes. Gotchas: an empty passage list opens the
picker on mount (`addingFirstPassage`), which is what gives the test its entry point for
free; and dismissing the translation modal is fired as `requestClose` on the one `Modal`
with `visible === true` (the picker's is already false by then), since `src/` still has
no testIDs and 8.2.1a's decision not to start that convention holds.

**Needs manual verification** (JS-only, rides the 8.2.1 reanimated build): add a passage
on a fresh install and confirm the translation modal appears right after the last verse
tap and that picking one lands in the editor with the text fetched; delete one
translation in settings and confirm the modal no longer appears at all; and check the
editor's new translation row reads well above the text field in both themes.

## 2026-08-27 — 8.2.1c "Study this one" (the 8.2.1 group closes)

**The question the step actually asked.** PLAN did not ask for a button, it asked for a
decision: is a single-passage drill a stored `TrainModeModel` or a transient session?
The answer is in the shape of `TrainModeModel` itself — every field on it is a *filter*
(translation, includeTags, excludeTags, sort, length, testAsLevel). There is no way to
name a passage. Storing one would have meant adding a field to the state model, which
means version bump + converter + `initials.ts` + prompt-backup flow (all four or
nothing), and all of that for a mode aimed at one passage the user just created and will
never open again. So: **a train mode is a filter, not a target** — that sentence is now a
rule in CODING_RULES §4, because it is what will decide the next such question too.

**What that made it.** A generator plus one reducer action.
`generateStudyOneTests(state, passageId, repeats?)` sits next to `generateTests` and
reuses the whole chain under it — `createTest` picks the test level from the passage's
own `selectedLevel`, `generateATest` fills it. Nothing new was written about levels: the
repeats differ from one another for free, because the library already randomizes inside
a level (l10 vs l11, l20 vs l21, which words go missing, which decoy addresses appear).
`ActionName.generateStudyOneTests` writes `testsActive` and nothing else — where
`ActionName.generateTests` deliberately rewrites `activeTrainModeId` and can rewrite the
default mode's translation, a drill leaves the practice setup exactly as it found it.
That is the assertion the reducer test spends most of its lines on.

**`STUDY_ONE_REPEATS = 3`, and why not 5.** `finishTesting` upgrades a passage when its
perfect stroke exceeds `PERFECT_TESTS_TO_PROCEED` (4). In a normal session a passage
appears once, so four perfect answers cost four sessions across days. A drill of five
would hand out a level upgrade in one sitting, which quietly turns "practice this" into
"skip a week of spaced repetition". Three is several times, and is ≤ the threshold, so a
drill contributes to the stroke like anything else but can never complete one alone. The
constant carries that reasoning in a comment so nobody bumps it to 5 for feel.

**Where the offer lives.** `PassageScreen.handleSave` — the moment the passage is
committed. It is held as `studyOfferPassageId` (the id, not a boolean) so the session is
generated for the passage that was actually saved, and it is gated twice: only when
`isNew`, and only when the passage has text. Editing an existing passage still leaves
straight for the list — the drill is for a passage you have just met, and an edit is not
that moment. A passage saved with no text cannot be tested at any level, so offering
would promise a session that `TestsScreen` would immediately bounce out of; the
generator refuses that case too, independently, since it is a library function.

Reuse, not new machinery: the offer is a `ConfirmModal` with `confirmColor="green"`,
which is the existing non-destructive form of the app's dialog, so it inherits MiniModal's
8.2.1 spring entrance. No new component, no new l10n pattern, no param-list change —
`SCREEN.test` already takes no params, because the session travels in state, not in
navigation.

**Gotchas worth keeping.**
- The two `setState` calls in the accept path (commit the passage, then generate) are
  both functional updaters, so the second runs on the state the first produced. This
  only works because it is `setState(prev => …)`; a `reduce(state, …)` closing over the
  render's `state` would have generated the session from a library that did not contain
  the new passage yet.
- `reduce` JSON round-trips its result, so `NaN` address fields come back as `null`. A
  test asserting "the drill changed no passage" cannot `toEqual` the raw fixture — it has
  to compare against the same round-trip. Cost one red run.
- The screen test needed a **real stateful** context, not `renderWithContext`'s no-op
  `setState`, because the thing under test is precisely that the passage is saved before
  the session is generated. It builds a tiny `AppContext.Provider` over `useState`; the
  rest (dispatch, theme, t) stays inert. Seeding `passageText` in the route params is what
  keeps `PassageEditor`'s mount effect from firing a network fetch.

**Testing.** 15 new tests, 179 total (35 suites). 8 unit on the generator
(`__tests__/utils/generateStudyOneTests.test.ts` — named after the export, following
`createL11Tests.test.ts`, since the module's file is `generateTests/index.ts`), 2 on the
reducer, and 5 in a new `__tests__/screens/PassageScreen.test.tsx` that press the real
editor's Save button rather than calling the handler, so they break if the offer stops
being reachable from where the user is.

**Reported, not fixed (Fedir decides).**
1. `TestsScreen.handleReset` — the dev-mode Reset button and `LevelPicker`'s restart —
   regenerates through `ActionName.generateTests`, i.e. from the active train mode. Reset
   during a drill therefore silently turns it into a normal session. Nothing stores
   "this session was a drill" for it to restart from; giving sessions an origin is a
   real (small) design decision, not a fix to slip in here.
2. A drill is offered only from the add flow. The same session would make sense from a
   row in `ListScreen` ("study this one") for a passage added weeks ago — deliberately
   out of scope, PLAN said "after a passage is added". The generator already takes any
   `passageId`, so that entry point is one `ConfirmModal` away whenever it is wanted.

**Needs manual verification** (JS-only, rides the 8.2.1 reanimated build, and this is the
last third of the add journey — walk all of 8.2.1a→c in one go): add a passage on a fresh
install, and at the offer take **Study it** — expect three tests of that one passage and
then the finish screen; repeat and take **Later** — expect the passage list with no
session; edit an existing passage and confirm nothing is offered; and check the offer's
two buttons read well in both languages and both themes.


## 2026-08-27 — Staging build red: CMake 3.18.1 not in SDK

**Symptom.** `eas build --profile staging` failed at
`:react-native-worklets:configureCMakeRelWithDebInfo[arm64-v8a]` with
`[CXX1300] CMake '3.18.1' was not found in SDK, PATH, or by cmake.dir property.`
First build after 8.2.1 added `react-native-reanimated@4.1.1` + `react-native-worklets@0.5.1`.

**Cause.** `eas.json` pinned, in both the staging and production Android blocks,
`ndk: 25.1.8937393` plus `env: { ANDROID_NDK_VERSION: 25.1.8937393, CMAKE_VERSION: 3.18.1 }`.
Those pins date to `033d5d7`/`e2fc58c` — SDK 53-era workarounds. They were inert because no
dependency compiled C++ from source; everything else consumes prebuilt prefabs. Reanimated and
worklets are the first that do, and their `android/build.gradle` reads the env var directly:
`version = System.getenv("CMAKE_VERSION") ?: "3.22.1"`. So the pin took effect for the first
time and asked for a CMake the EAS image does not ship. The NDK pin was a second, latent
mismatch: `ndkVersion rootProject.ext.ndkVersion` resolves to 27.1.12297006 (the Expo root
project logs it) while the env forced the image onto 25.

**Fix.** Deleted both `android` pin blocks from `eas.json`. Reanimated and worklets now fall
back to CMake 3.22.1, and the NDK comes from the Expo root project (27.1.12297006), which is
what RN 0.81 prefabs are built against.

**Scope.** Config only — no `src/` change, so FILEMAP and l10n are untouched and lint/test were
not re-run for it. Verification is the next staging build.
