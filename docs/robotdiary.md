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
