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
