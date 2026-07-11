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
