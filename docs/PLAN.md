# PLAN — the roadmap

> The only file where work is marked done. `[ ]` = not done, `[x]` = done.
> One box = one session. **Take the first unchecked box** unless Fedir says otherwise.
> The *why* behind the order lives in `STRATEGY.md`; the story of each session goes to
> `robotdiary.md`. Neither of them carries checkboxes.

**Rules**

- Win conditions, every step: `npm run lint` ✓ · `npm test` ✓ · `FILEMAP.md` updated if
  files changed ✓ · `robotdiary.md` entry appended ✓ · new UI strings in **both**
  `en.ts` and `ua.ts` ✓.
- IDs are stable and never renumbered — new work is inserted as `8.1.9a`, so a
  robotdiary entry citing a step ID stays true forever. IDs may read out of order.
- Tags: `(build)` ends with a version bump + `npm run build-dev` · `(one-sitting)`
  splitting it would be worse · `[api]` / `[shared]` = the other repo.
- A finished step moves to its Archive as one line with its date.
- Work found outside the current step's scope: **report it and ask Fedir.** Don't fix it
  silently, don't add a step silently.
- Build cadence: any session touching native config or dependencies ends with a build;
  otherwise a patch bump + staging build every ~4–6 sessions.

> ⚠️ **0.2.0 is prepared in both working trees and NOTHING is committed** (2026-08-26,
> at Fedir's instruction). Nothing below is checked off because nothing has landed yet.
> Both repos are lint ✓ / test ✓ on disk; the release is three manual acts, and the
> order is load-bearing — Android verifies App Links at *install time* and caches the
> answer, so the assetlinks file must be live and correct before the 0.2.0 build is
> installed:
>
> 1. **bbh-api** — review + commit the working tree, push `staging` (redeploys the VPS
>    staging container only, no store involved), verify, then merge into `production`.
>    That push is what finally deploys `verifyMailer` + `ensureUsersTableColumns`, which
>    have sat in two *local-only* commits since 2026-07-11.
> 2. ~~**Set `ANDROID_CERT_FINGERPRINTS`** on the VPS~~ — **done 2026-08-26.** Fedir
>    supplied the Play app-signing SHA-256 and it is appended to both
>    `/usr/src/bbh-api/.production.env` and `.staging.env` (600 deploy:deploy, backups in
>    `~/env-backups/`). Inert until step 1 restarts the container, which is the right
>    order. Pre-flight checked at the same time: Caddy proxies `/.well-known/` **through**
>    to the app (today's 404 body is Express's own `Cannot GET`, not Caddy's) and the
>    https URL takes **no redirect** — the two things Android would have failed on.
> 3. **bible-by-heart** — commit (version already bumped to 0.2.0, lockfile synced) and
>    push `staging`, which fires the EAS staging build **and auto-submits** to the Play
>    internal track. Then `production` for the store release. Fedir triggers both,
>    because they submit on their own.
>
> This also clears the older backlog: the SDK-36 bump (2026-07-22) and the 0.1.2 bump
> from 8.1.9 have been waiting on a build since then — 0.2.0 carries both.

---

## 0.2.0 — Fast & solid *(ships to Play)*

- [ ] **8.1.17 [api] Deploy session** — *code prepared 2026-08-26, uncommitted*
      Ship the committed-but-undeployed `verifyMailer` + `ensureUsersTableColumns`;
      serve `/.well-known/assetlinks.json` with the app's signing fingerprint so https
      App Links open the app; production container runs plain `node dist/app.js`, not
      `nodemon`. Check `.production.env` survives untouched.
      *Done on disk:* the assetlinks endpoint + `utils/assetLinks.ts` + 5 tests, both
      deployed compose services off `nodemon`, the Dockerfile's dead `CMD`, and (per the
      STRATEGY §7 standing decision, since this session touched the repo)
      `base.servise.ts` → `base.service.ts`. `.production.env` verified safe: it has
      never been tracked in any branch, so the deploy's `git reset --hard` cannot see it.
      *Riding along, approved by Fedir the same session:* the test suite no longer opens
      SMTP sockets — new `jest.setup.ts` mocks nodemailer, and `email.test.ts` injects
      transports instead of relying on `.test.env` credentials being broken (48 → 50
      tests). `data/test.db` was asked about and left alone: proven to be an artifact,
      not a fixture (suite passes with it deleted), so it is diff hygiene, not a bug.
      *Left:* the push, and the `ANDROID_CERT_FINGERPRINTS` value on the VPS.

- [ ] **8.1.18 🏁 0.2.0 — minor bump, staging build, Play release** (build)
      Version bump, staging build, then production build + Play submission (compliance:
      target API 36). First store release in a year — expect review friction.
      *Done on disk:* `package.json` 0.1.2 → 0.2.0, and `package-lock.json`'s two root
      `version` fields synced with it — they still said 0.1.1, drift left by the 8.1.9
      bump, and CI runs `npm ci` against that lockfile.
      *Left:* everything that submits — both builds and the Play release.

## 0.3.0 — Candy UI

The animation rewrite. Every wrapper step ends with a build, because feel cannot be
judged from tests.

- [ ] **8.2.1 Install `react-native-reanimated`** (build)
      Dependency + babel plugin, one trivial animation proven to compile and run.
      Gesture-handler still fine, no Metro/babel warnings.
      *Watch:* native/babel config is historically the flakiest change in this repo.

- [ ] **8.2.2 Modal purge**
      Audit every full-screen `MiniModal`; convert sub-menu-like ones (filter/tag
      selection in `ListScreen` first) to screens or anchored popups. Real dialogs —
      confirms, About — stay modals. Output includes the written verdict list.

- [ ] **8.2.3 Wrapper rewrite — screen transitions + `Header`** (build)
      An explicit reanimated / `cardStyleInterpolator` transition instead of the
      platform default, consistent across devices; retune the FlatList scroll feel.
      *Files:* `navigator.tsx`, `Header.tsx`, `ListScreen.tsx`.

- [ ] **8.2.4 Wrapper rewrite — home + passage-list interactions** (build)
      Gestures, swipe actions, springy feedback; layout holds from small phone to
      foldable. Keep row props primitive — the `React.memo` row memoization from 8.1.3
      is easy to break.

- [ ] **8.2.5 Wrapper rewrite — tests/levels screens + finish-screen shell** (build)
      The training loop gets the same treatment; finish screen becomes a shell ready for
      real session data (8.5.2). No navigate-during-render smells left.
      *Risk:* the training loop is the core product — regressions here are the worst.

- [ ] **8.2.6 Split level components + Passage/Address abstraction**
      One file per level, and — since this is where sentence/word logic already lives —
      introduce the `Passage`/`Address` methods (`getSentences()`, address math) that
      replace the scattered utils. Old utils delegate or die.
      *Risk:* two refactors in one step — if it grows, split it and tell Fedir.

- [ ] **8.2.7 Level 5 similar-chars tolerance**
      An equivalence list (dash variants, quote/apostrophe variants, ellipsis, і/i
      lookalikes, diacritic case) used by the L5 comparator, one unit test per pair.
      Complements 8.1.4 (sanitize on input) by tolerating on comparison. Do not widen
      tolerance to real misspellings.

- [ ] **8.2.8 Haptics/sound util**
      One `src/utils/feedback.ts` that checks `hapticsEnabled` / `soundsEnabled` itself;
      no component reads those settings directly.

- [ ] **8.2.10 🏁 0.3.0 — minor bump, build, Play release** (build)

## 0.4.0 — Accounts+

- [ ] **8.3.1 Expo SDK upgrade** (54 → current, if the jump is documented-safe) (build)
- [ ] **8.3.2 Deps cleanup** — drop the unused `react-native-fs`, `expo-random` →
      `expo-crypto`, `eas-cli` out of dependencies (build)
- [ ] **8.3.3 Google auth — decision doc** (pluggable provider interface, Apple ID must
      slot in later; `expo-auth-session` vs native; token exchange with bbh-api)
- [ ] **8.3.4 [api] Google auth endpoint** — provider-agnostic `/api/user/oauth`, verify
      the Google ID token, issue the same JWT pair, supertest coverage
- [ ] **8.3.5 Google auth — client** (alongside email/password, never required) (build)
- [ ] **8.3.6 🏁 0.4.0**

## 0.5.0 — Sync

- [ ] **8.4.1 [shared] Shared-pkg follow-ups** — app `API_LINK` → `API_ENDPOINTS`, auth
      `Record<string, any>` → shared DTOs, reconcile the divergent user models; release
      bbh-shared v0.0.2 and re-pin both repos
- [ ] **8.4.2 Sync design doc** — state split into parts, LWW + checksum per part,
      incremental history protocol; concrete request/response shapes
- [ ] **8.4.3 [shared] Checksum/sync primitives** + unit tests (v0.0.3)
- [ ] **8.4.4 [api] Sync endpoints** (part get/put, history append/verify) + supertest
      coverage including failure cases
- [ ] **8.4.4a Reducer full action coverage** — scheduled here on purpose: the sync
      engine is about to add actions to `reduce.ts`, so lock current behaviour first
- [ ] **8.4.5 Client sync engine — parts** (settings/passages) with the api-version
      compat gate (sync off ≠ app broken)
- [ ] **8.4.6 Client sync engine — incremental history** + animated progress bar
- [ ] **8.4.7 Sync UI in settings** (status, last sync, manual trigger), l10n en+ua (build)
- [ ] **8.4.8 🏁 0.5.0**

## 0.6.0 — Content & finish

- [ ] **8.5.1 Pluggable text-source interface** (generalize `fetchESV.ts`) so a Ukrainian
      translation becomes config + one fetcher file once permission is secured
- [ ] **8.5.2 Finish-screen session data** — what was trained, time, level-ups, what
      needs repeating, **without** error counts; l10n en+ua
- [ ] **8.5.3 Stats correctness pass** — day-average over *active days only*
      (`getStats.ts:330`), streak/timezone-DST regression tests (build)
- [ ] **8.5.4 🏁 0.6.0**

## 0.7.0 — Premium

- [ ] **8.6.1 IAP research + decision doc** (`expo-iap` / RevenueCat / raw Play Billing;
      subscription product setup; entitlement model)
- [ ] **8.6.2 Entitlement flag** in AppState + bbh-api user record + endpoint; state
      version bump + converter + tests
- [ ] **8.6.3 Play Billing integration** + purchase/restore flows + premium gate (build)
- [ ] **8.6.4 🏁 0.7.0**

## 0.8.0 — iOS

- [ ] **8.7.1 App Store Connect setup** — `ascAppId` into the eas.json submit profile,
      TestFlight build green (build)
- [ ] **8.7.2 Apple ID login** through the 8.3.3 provider interface (App Store rules
      require it once Google login exists on iOS)
- [ ] **8.7.3 iOS share extension** — the `expo-share-intent` iOS half that was
      `disableIOS`'d, plus the app-group id
- [ ] **8.7.4 iOS-specific fixes pass** (safe areas, gestures, notifications)
- [ ] **8.7.5 🏁 0.8.0 — App Store publish**

## 1.0.0 — Finished

- [ ] **8.8.3 Hardening / bug-triage buffer** — whatever the milestones surfaced
- [ ] **8.8.4 🏁 1.0.0** — both stores, sync + payment live, no major bugs

## Not scheduled

Post-1.0 pool lives in `STRATEGY.md` §3. Dropped from the queue on 2026-08-24:
fresh-install default tags/train-modes (`initials.ts:130`), the standalone
error-message-design unification, and layered `t("page.title")` l10n keys (8.2.9).

---

## Archive

Newest first. One line each; the full story is in `docs/robotdiary.md` under the date.

- [x] **8.1.15a** Naming tail — 2026-08-26 · the two out-of-scope findings 8.1.15
      reported, both approved by Fedir: the last near-miss exports renamed
      (`TestNavDott` → `TestNavDot`, `WeekActivityComponent` → `WeekActivity`, incl.
      the `displayName`), and the eight camelCase component tests + their `.snap`
      files renamed to match their subjects (`app.test.tsx` → `App.test.tsx` too).
      CODING_RULES §2 gained the two rules that make both permanent.
- [x] **8.1.15** File renames to convention — 2026-08-26 · 15 files renamed through a
      temp name (Windows case-insensitivity), 23 import sites rewritten. Screens are
      PascalCase, `MiniModal`/`SettingsMenuItem`/`TestNavDot`/`SettingsListWrapper`/
      `WeekActivity`/`iconData` renamed; git recorded all 15 as pure renames, zero
      logic diff, all 22 snapshots matched and no `.snap` file moved or changed. The
      app repo now has no naming offenders; bbh-api's `base.servise.ts` is the last one.
- [x] **8.1.14** Typed navigation — 2026-08-25 · real `RootStackParamList` (all 19
      screens) + `ScreenPropsModel<SCREEN.x>` + `RootStackNavigationModel`, all in
      `models.ts` (the navigator imports every screen, so they cannot live there).
      `ScreenModel.route: any`, both raw `node_modules/@react-navigation/...` imports and
      the `beforeRemove` `@ts-ignore` are gone; type-only, all 22 snapshots unchanged.
- [x] **8.1.9a** Boot path cannot eat a state — 2026-08-25 · `loadStoredState`
      classifies a read as found/empty/failed, so only a real `NotFoundError` may be
      followed by a write; a failed read leaves storage untouched and shows the recovery
      UI. New `ErrorBoundary` (the render-time `try/catch` could never fire) + the
      emergency screen extracted to `EmergencyScreen.tsx`; 13 new tests.
- [x] **8.1.9** Backup export + restore from file — 2026-08-24 · new
      `src/utils/backupFile.ts` (envelope serialize/parse, version-tolerant, 14 tests) +
      `BackupOfferModal`; export/restore rows in List settings, restore behind a
      `ConfirmModal` that names the file's contents; the boot path offers a one-shot
      export of the raw pre-conversion snapshot; the dev-mode state rows now share the
      same writer. Version bumped 0.1.1 → 0.1.2 — **the staging build has not been run**
      (see the ⚠️ note at the top).
- [x] **docs** — PLAN/STRATEGY split cleaned: STRATEGY became vision-only (no
      checkboxes, no session log), PLAN became a plain roadmap — 2026-08-24.
- [x] **8.1.13** Context migration, the rest + `t` prop retired — 2026-08-24. No
      component in `src/` takes `theme` or `t` any more.
- [x] **8.1.12** Context migration, `settingsMenuItem` + `Input` + `Header` — 2026-08-24.
- [x] **8.1.11** Context migration, `Button` + `IconButton` — 2026-08-24 · ~277 call
      sites across 35 files over the three steps; all 22 snapshots matched and no
      `.snap` file changed — the migration is provably behaviour-neutral.
- [x] **8.1.16a** End-to-end flow test — 2026-08-24 · `__tests__/e2e/flow.test.tsx`
      drives create → add passage → generate → answer with errors → finish → stats
      through the reducer + generators, asserting no error count leaks.
- [x] **8.1.10** Legacy converter coverage — 2026-08-24 · fixtures `state006` +
      `state007` converted forward; the chain from the oldest allowed version reaches
      `VERSION` under test.
- [x] **8.1.8** Boot-path backup fixes — 2026-08-24 · write-once
      `STORAGE_PRECONVERT_BACKUP_NAME` split from the rolling daily backup; restore
      accepts an older snapshot and converts it forward; new `src/utils/bootBackup.ts`
      + 12 tests. Two further boot-path problems found → now step 8.1.9a.
- [x] **docs** — PLAN.md created from the 30-question planning interview; FILEMAP `(?)`
      accuracy pass; STRATEGY §4 status audit — 2026-07-22.
- [x] **compliance** — target/compile SDK 35 → 36 (Play flagged API 35) — 2026-07-22.
      Not yet built; rides on 8.1.9.
- [x] **8.1.7** AddressPicker one-verse flow — 2026-07-11 · primary "Add" + secondary
      "Extend range"; l10n en+ua; 2 new tests.
- [x] **8.1.6** Intent finish — 2026-07-11 · debug toast removed, manual SEND filter and
      the dead `handlingIntents.js` plugin deleted.
- [x] **8.1.5** Book-name variants in `addressFromString` — 2026-07-11 · new
      `bookAliases.ts`, one test per alias.
- [x] **8.1.4** Sanitize shared text — 2026-07-11 · new `sanitizeSharedText.ts`
      (dashes/quotes/ellipsis/nbsp, URL strip, quote peeling) + tests.
- [x] **8.1.3** Render-lag fix part 2, screen layer — 2026-07-11 · `React.memo` rows,
      memoized O(history) stat walks, hoisted inline components, `freezeOnBlur`.
- [x] **8.1.2** Render-lag fix part 1, context layer — 2026-07-11 · memoized AppContext
      value, stable `t`/`theme`, persist effect off `JSON.stringify`.
- [x] **8.1.1** Diagnose the ~0.5s render lag — 2026-07-11 · findings + ordered fix list.

**Before the queue existed** (2026-07-10/11): the P0/P1 bug sweep (error counter,
`endVerseNum`, L11 comparator + translation filter, book-name case matching), login
verification + token-refresh fixes, the navigator + AppContext refactor, settings
modals → screens, the themed `Text` component + test harness, the shared `bbh-shared`
package, the share/intent receiver, list virtualization, localized notification channel,
login by email OR username, the bbh-api mail credentials + `verifyMailer` +
`ensureUsersTableColumns` hardening. Full notes in `robotdiary.md`.
