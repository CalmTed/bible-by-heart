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
