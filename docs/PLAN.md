# PLAN — the working queue

> **This is the file that gets checked off.** One checkbox = one session.
> `STRATEGY.md` keeps the *why* (vision, bug register, risk watchlist, refactor list,
> milestone table); this file keeps the *what next*, and it is the only place where
> work is marked done.
>
> Take the **first unchecked step** unless Fedir says otherwise.
> Shaped by the 2026-07-22 planning interview (30 questions) — the answers are locked
> in §3 so no session has to re-ask them.

---

## 0. How a session runs

1. Read `CLAUDE.md` → `ARCHITECTURE.md`, `CODING_RULES.md`, `FILEMAP.md`, then this file.
   Open `STRATEGY.md` only when a step points at one of its sections.
2. Do the first unchecked step. One step per session.
3. Win conditions (every step, no exceptions):
   `npm run lint` ✓ · `npm test` ✓ · `FILEMAP.md` updated if files changed ✓ ·
   `robotdiary.md` entry appended ✓ · new UI strings in **both** `en.ts` and `ua.ts` ✓.
4. Move the finished step into **§13 Archive** with its date and a one-line result.
   The full story goes in `robotdiary.md`, never here.

## 1. Conventions

- **IDs are stable and never renumbered.** New work found mid-flight is inserted as
  `8.1.8a`, `8.2.3a` … so a robotdiary entry citing a step ID stays true forever.
  IDs may therefore read out of order — that is expected.
- **Tags** in a step title:
  - `(build)` — ends with a version bump + `npm run build-dev` (EAS staging).
  - `(device)` — Fedir must confirm something on a real phone before it is truly done.
  - `(one-sitting)` — splitting it would be worse than doing it whole.
  - `[api]` — the session works in `c:/Code/bbh-api`. `[shared]` — `c:/Code/bbh-shared`.
    Untagged = the mobile app repo.
- **Every step carries:** Goal · Files · Acceptance · Risk. Nothing else.
- **Done steps leave the queue** and appear in §9 Archive, so the list above is always
  only what is left.

## 2. Standing rules

- **Build cadence:** any session that touches native config or dependencies ends with a
  build; otherwise a patch bump + staging build every ~4–6 sessions.
- **New findings:** if a session uncovers work outside its scope — **report it and ask
  Fedir**; do not silently fix it and do not silently insert a step. He decides whether
  it becomes a step, a bug in `STRATEGY.md` §2, or a watchlist line in §3.
- **Tests:** no global coverage target. The rule is per-session — *touching a file means
  leaving tests behind*. Test items from `STRATEGY.md` §5 are scheduled next to the code
  they protect, not saved up for 1.0.0.
- **Manual testing:** `(device)` steps + a full checklist at each milestone step
  (8.1.18, 8.2.10, …).
- **Broken-in-between** is allowed across a multi-step refactor — say so in robotdiary.

## 3. Decisions locked 2026-07-22 (do not re-ask)

These came from the planning interview and are already baked into the steps below.

| Topic | Decision |
|---|---|
| Backup destination | System save/share sheet — user picks Drive/Files/wherever. Survives uninstall. |
| Backup trigger | **Silent** pre-conversion snapshot always; a dismissible prompt then *offers* a file export. Safety never depends on tapping right. |
| Restore | Accepts an **old-version** snapshot and re-converts it forward through `convertState`. |
| File I/O | Move `fileManager` to `expo-file-system` **as part of** the backup step — don't build a new feature on `react-native-fs`, which is being removed anyway. |
| Stats day-average (`getStats.ts:291`) | Average over **days actually trained** only. Never punishes a skipped day (philosophy §2.2). |
| Play release | Release at **0.2.0** — do not wait for Candy UI. SDK-36 compliance is already overdue. |
| Reanimated | Installed at 8.2.1, the start of Candy UI. Not earlier. |
| Milestone order | Unchanged: Accounts+ → Sync → Content → Premium → iOS. |
| Context migration | 3 steps (Button → menuItem/Input/Header → the rest), as planned. |
| File renames | App repo only; `bbh-api`'s `base.servise.ts` is renamed whenever bbh-api is next touched. |
| Layered l10n keys | Kept, but late (0.3.0) and allowed to slip. |
| Passage/Address abstraction | Folded into the level-component split (8.2.6), not a standalone refactor. |
| Candy-UI validation | A build after **each** wrapper-rewrite step — animation feel can't be judged from tests. |

---

## 4. → 0.2.0 "Fast & solid"

Render-lag P0 and the intent-receiver polish are already done (§9). What is left is the
safety net, the foundations, and the first store release in a year.

> ⚠️ **Unbuilt native change pending:** the 2026-07-22 SDK-36 bump (`app.config.js`,
> compile/target 36) has never been built. It rides on the next `(build)` step — 8.1.9.

- [ ] **8.1.9 Backup export + restore-from-file** (build) (device)
      **Goal:** on a state-version upgrade, offer to save a backup file; add
      export/restore entries in settings. Includes swapping `fileManager` from
      `react-native-fs` to `expo-file-system`.
      **Files:** `src/utils/fileManager.ts` (expo-file-system), `package.json`,
      `src/context/AppContext.tsx` or `App.tsx` (upgrade detection + prompt),
      `src/screens/ListSettingsScreen.tsx` (export/restore rows — import/export already
      lives there), `src/components/ConfirmModal.tsx` (reuse for the destructive
      restore), `src/l10n/en.ts` + `ua.ts`, tests for the pure parts.
      **Acceptance:** upgrade shows a dismissible prompt offering a file export (never
      blocking); the file goes through the system save/share sheet; settings can export
      any time and restore from a picked file; restore is behind a `ConfirmModal` and
      re-converts old versions (8.1.8); passage import/export still works after the
      file-layer swap; both l10n files updated; staging build pushed — it also carries
      the pending SDK-36 change; device: export a file, wipe data, restore it.
      **Risk:** native dependency change (needs the build to verify) plus a destructive
      restore path. Keep write and read symmetric and covered by tests.

- [ ] **8.1.14 Typed navigation**
      **Goal:** a real `RootStackParamList` with per-screen params; remove
      `ScreenModel.route: any` (homeScreen) and the `@ts-ignore` in testsScreen.
      **Files:** `src/navigator.tsx`, every screen's props, `src/models.ts`.
      **Acceptance:** `RootStackParamList` maps each `SCREEN` to its actual params
      (`{ passageId }`, `{ address, passageText, translationId }`, …); no `any`, no
      `@ts-ignore` in navigation code; `navigationRef.navigate` calls type-check.
      **Risk:** low runtime risk, medium compile churn.

- [ ] **8.1.15 File renames to convention** (one-sitting)
      **Goal:** `CODING_RULES.md` §2 naming, app repo only. Pure `git mv` + import
      fixes, no logic changes.
      **Files:** screens `homeScreen/listScreen/testsScreen/finishScreen/statsScreen/
      calendarScreen/settingsScreen/loginScreen/registerScreen.tsx` → PascalCase;
      components `miniModal.tsx` → `MiniModal.tsx`, `setttingsMenuItem.tsx` →
      `SettingsMenuItem.tsx` (typo dies here), `testNevDott.tsx` → `TestNavDot.tsx`,
      `settingsListWrapper.tsx` → `SettingsListWrapper.tsx`,
      `weekActivityComponent.tsx` → `WeekActivity.tsx`, `icondata.ts` → `iconData.ts`;
      all imports; `FILEMAP.md` + `CODING_RULES.md` §2/§7 tables.
      **Acceptance:** zero logic diff (`git diff` shows only paths and import lines);
      lint + full suite green; snapshot files renamed with their tests.
      **Risk:** Windows is case-insensitive — use `git mv` (two-step via a temp name if
      git balks) and verify the case actually changed in `git ls-files`. Do NOT bundle
      any other change into this diff.

- [ ] **8.1.16 Fresh-install defaults** (`initials.ts:130`)
      **Goal:** a new install starts with sensible default tags and train-modes instead
      of empty lists.
      **Files:** `src/initials.ts`, `src/l10n/en.ts` + `ua.ts` (default tag names),
      `__tests__/utils/reduce.test.ts` or a new initials test.
      **Acceptance:** a fresh state has the default train-mode(s) and the `Archived`
      tag wired consistently with `settings.leftSwipeTag`; existing users are
      unaffected (no converter change); both l10n files updated.
      **Risk:** touches the state shape's defaults — must not alter existing states.

- [ ] **8.1.17 [api] Deploy session**
      **Goal:** ship the two committed-but-undeployed hardenings and unblock https App
      Links.
      **Files:** `bbh-api` — deploy pipeline; serve `/.well-known/assetlinks.json`;
      `Dockerfile`/compose entrypoint.
      **Acceptance:** `verifyMailer` + `ensureUsersTableColumns` running on the VPS
      (verify in logs); `https://biblebyheart.app/.well-known/assetlinks.json` returns
      the app's signing fingerprint so verified App Links open the app; production
      container runs plain `node dist/app.js`, not `nodemon`; app-side deep link tested
      after the next build.
      **Risk:** production deploy. Check `.production.env` is untouched and the mail
      creds survive.

- [ ] **8.1.18 🏁 MILESTONE 0.2.0 — minor bump, staging build, Play release** (build) (device)
      **Goal:** ship it. Minor version bump, staging build, Fedir's full device pass,
      then the production build + Play submission (compliance: target API 36).
      **Files:** `app.config.js` / `package.json` version, `docs/robotdiary.md`
      checklist entry.
      **Acceptance — Fedir's device checklist:** launch speed on Pixel 9 Pro (the ~0.5s
      lag must be gone) · passage-list scroll feel + sticky search focus · share text
      from another app → confirm → passage added · `bbh://train` and a notification tap
      both open training · https App Link opens the app (needs 8.1.17) · backup export
      + restore round-trip · login with email AND username · reminders appear under the
      localized channel · both languages · system bars OK under API-36 edge-to-edge.
      **Risk:** first store release in a year — expect Play review friction.

## 5. → 0.3.0 "Candy UI"

The animation rewrite. Acceptance is *feel*, so every wrapper step ends with a build.

- [ ] **8.2.1 Install `react-native-reanimated`** (build)
      **Goal:** dependency + babel plugin in, a trivial animation proven to compile and
      run in a dev build.
      **Files:** `package.json`, `babel.config.js`, one throwaway animated view.
      **Acceptance:** dev build runs; no Metro/babel warnings; gesture-handler still fine.
      **Risk:** native/babel config — historically the flakiest kind of change here
      (see the `react-native-fetch-api` polyfill story, STRATEGY §3).

- [ ] **8.2.2 Modal purge**
      **Goal:** audit every remaining full-screen `MiniModal`; convert sub-menu-like
      ones (filter/tag selection in listScreen first) to screens or anchored popups.
      Real dialogs — confirms, About popups — stay modals.
      **Files:** `src/screens/listScreen.tsx`, `src/components/miniModal.tsx`, any
      screen still rendering a full-screen modal.
      **Acceptance:** a written list of every MiniModal use with its verdict; the
      filter/tag picker no longer slides in as a modal; no behaviour lost.
      **Risk:** medium — touches navigation shape again.

- [ ] **8.2.3 Wrapper rewrite — screen transitions + `Header`** (build) (device)
      **Goal:** an explicit reanimated / `cardStyleInterpolator` transition instead of
      the platform default, consistent across devices; retune the FlatList scroll feel.
      **Files:** `src/navigator.tsx`, `src/components/Header.tsx`,
      `src/screens/listScreen.tsx`.
      **Acceptance:** same transition on the old Samsung and the Pixel 9 Pro; no broken
      tail-end of the push animation (Fedir's 2026-07-11 report); device confirms it
      feels better than pre-refactor, which is the whole point of 0.3.0.
      **Risk:** subjective acceptance — expect one iteration after device feedback.

- [ ] **8.2.4 Wrapper rewrite — home screen + passage-list interactions** (build) (device)
      **Goal:** gestures, swipe actions, springy feedback; responsive from small old
      Androids to tablets/foldables.
      **Files:** `src/screens/homeScreen.tsx`, `listScreen.tsx`,
      `src/components/weekActivityComponent.tsx`.
      **Acceptance:** swipe actions feel deliberate; layout holds at small phone,
      tablet and foldable widths; no regression in list virtualization or row memoization.
      **Risk:** the row memoization from 8.1.3 is easy to break — keep props primitive.

- [ ] **8.2.5 Wrapper rewrite — tests/levels screens + finish-screen shell** (build) (device)
      **Goal:** the training loop gets the same treatment; finish screen becomes a shell
      ready for real session data (8.5.2).
      **Files:** `src/screens/testsScreen.tsx`, `finishScreen.tsx`,
      `src/components/levels/Level1..5.tsx`.
      **Acceptance:** no navigate-during-render smells left; transitions between tests
      feel continuous; error messaging visually unified.
      **Risk:** the training loop is the core product — regressions here are worst.

- [ ] **8.2.6 Split level components + Passage/Address abstraction**
      **Goal:** one file per level with a unified error-message design, and — since this
      is where sentence/word logic is handled anyway — introduce the `Passage`/`Address`
      methods (`getSentences()`, address math as methods) that replace scattered utils
      gradually (STRATEGY §4.5).
      **Files:** `src/components/levels/*`, `src/models.ts`,
      `src/utils/address*.ts`, `src/utils/generateTests/*`.
      **Acceptance:** each level is self-contained; the new methods are used by at least
      the level components and the generators they replace; old utils either delegate to
      the methods or are deleted; tests per level generator still green.
      **Risk:** two refactors in one step — if it grows, split it and tell Fedir.

- [ ] **8.2.7 Level 5 similar-chars tolerance**
      **Goal:** an equivalence list (dash variants, quote/apostrophe variants, ellipsis,
      і/i lookalikes, diacritic case) used by the L5 comparator so near-identical
      characters aren't counted as errors — gentler, per philosophy §2.2.
      **Files:** `src/utils/generateTests/createL50Test.ts`,
      `src/components/levels/Level5.tsx`, a new equivalence util + unit tests.
      **Acceptance:** one unit test per equivalence pair; complements 8.1.4
      (sanitize on input) by tolerating on comparison.
      **Risk:** low — but do not silently widen tolerance to real misspellings.

- [ ] **8.2.8 Haptics/sound util**
      **Goal:** one util that checks `settings.hapticsEnabled` / `soundsEnabled` itself;
      replace every scattered call.
      **Files:** new `src/utils/feedback.ts`, all current haptics call sites,
      `src/constants.ts` (`VIBRATION_PATTERNS`).
      **Acceptance:** no component reads the haptics setting directly; disabling
      haptics silences everything (test it).
      **Risk:** low.

- [ ] **8.2.9 Layered l10n keys** `t("page.title")` (one-sitting, may slip)
      **Goal:** restructure `en.ts`/`ua.ts` (~470 keys each) into layered keys + update
      every call site.
      **Files:** `src/l10n/*`, every screen and component.
      **Acceptance:** `WORD` typing still catches a missing key at compile time; both
      files structurally identical; no string lost (count before/after).
      **Risk:** giant mechanical diff. Allowed to slip to any later gap.

- [ ] **8.2.10 🏁 MILESTONE 0.3.0 — minor bump, device pass, Play release** (build) (device)
      **Acceptance — checklist:** animation feel on both the old Samsung and the Pixel
      (the acceptance criterion) · every screen at phone/tablet/foldable width · training
      loop end-to-end · no modal left where a screen belongs · both languages.

## 6. → 0.4.0 "Accounts+"

- [ ] **8.3.1 Expo SDK upgrade** (54 → current, if the jump is documented-safe) (build)
- [ ] **8.3.2 Deps cleanup** — drop `eas-cli` from deps, `expo-random` → `expo-crypto`
      (`react-native-fs` is already gone as of 8.1.9) (build)
- [ ] **8.3.3 Google auth — decision doc** (pluggable provider interface, Apple ID must
      slot in later; `expo-auth-session` vs native; token exchange with bbh-api)
- [ ] **8.3.4 [api] Google auth endpoint** — provider-agnostic `/api/user/oauth`, verify
      Google ID token, issue the same JWT pair, supertest coverage
- [ ] **8.3.5 Google auth — client** (alongside email/password, never required) (build)
- [ ] **8.3.6 🏁 MILESTONE 0.4.0** — both auth paths, fresh install, SDK-upgrade smoke (device)

## 7. → 0.5.0 "Sync"

- [ ] **8.4.1 [shared] Shared-pkg follow-ups** — app `API_LINK` → `API_ENDPOINTS`, auth
      `Record<string, any>` → shared DTOs, reconcile the divergent user models; release
      bbh-shared v0.0.2 and re-pin both repos
- [ ] **8.4.2 Sync design doc** — state split into parts, LWW + checksum per part,
      incremental history protocol; concrete request/response shapes
- [ ] **8.4.3 [shared] Checksum/sync primitives** + unit tests (v0.0.3)
- [ ] **8.4.4 [api] Sync endpoints** (part get/put, history append/verify) + supertest
      coverage of all routes including failure cases
- [ ] **8.4.4a Reducer full action coverage** — scheduled here on purpose: the sync
      engine is about to add actions to `reduce.ts`, so lock current behaviour first
- [ ] **8.4.5 Client sync engine — parts** (settings/passages), with the api-version
      compat gate (sync off ≠ app broken)
- [ ] **8.4.6 Client sync engine — incremental history** + animated progress bar
- [ ] **8.4.7 Sync UI in settings** (status, last sync, manual trigger), l10n en+ua (build)
- [ ] **8.4.8 🏁 MILESTONE 0.5.0** — two-device manual sync test is the acceptance
      criterion (device)

## 8. → 0.6.0 "Content & finish"

- [ ] **8.5.1 Pluggable text-source interface** (generalize `fetchESV.ts`) so a Ukrainian
      translation becomes config + one fetcher file once permission is secured
- [ ] **8.5.2 Finish-screen session data** — what was trained, time, level-ups, what needs
      repeating, **without** error counts; l10n en+ua
- [ ] **8.5.3 Stats correctness pass** — implement the day-average as *active days only*
      (§3), add streak/timezone-DST regression tests (the "import drops days" bug class) (build)
- [ ] **8.5.4 🏁 MILESTONE 0.6.0** (device)

## 9. → 0.7.0 "Premium"

- [ ] **8.6.1 IAP research + decision doc** (`expo-iap` / RevenueCat / raw Play Billing;
      subscription product setup; entitlement model)
- [ ] **8.6.2 Entitlement flag** in AppState + bbh-api user record + endpoint; state
      version bump + converter + tests
- [ ] **8.6.3 Play Billing integration** + purchase/restore flows + premium gate (build)
- [ ] **8.6.4 🏁 MILESTONE 0.7.0** — a real test purchase on device (device)

## 10. → 0.8.0 "iOS"

- [ ] **8.7.1 App Store Connect setup** — `ascAppId` into the eas.json submit profile,
      TestFlight build green (build)
- [ ] **8.7.2 Apple ID login** through the 8.3.3 provider interface (App Store rules
      require it once Google login exists on iOS)
- [ ] **8.7.3 iOS share extension** — the `expo-share-intent` iOS half that was
      `disableIOS`'d, plus the app-group id
- [ ] **8.7.4 iOS-specific fixes pass** (safe areas, gestures, notifications) from
      TestFlight feedback
- [ ] **8.7.5 🏁 MILESTONE 0.8.0 — App Store publish** (device)

## 11. → 1.0.0 "Finished"

- [ ] **8.8.3 Hardening / bug-triage buffer** — whatever the milestones surfaced
- [ ] **8.8.4 🏁 1.0.0** — both stores, sync + payment live, no major bugs

*(8.8.1 reducer coverage moved to 8.4.4a and 8.8.2 the e2e flow test to 8.1.16a — both
now sit next to the risk they protect, per §2.)*

## 12. Unscheduled pool (post-1.0.0)

Broadcast/update messages · feedback form · friends/feed/groups · achievements ·
smarter notifications · home-screen dynamic stat labels · accessibility pass ·
prove-imported-passage flow · seasonal icons · web version (Expo web served by bbh-api,
`[P3, fun]` — experiment only).

---

## 13. Archive — completed steps

Newest first. One line each; the full story is in `docs/robotdiary.md` under the date.

- [x] **8.1.13** Context migration, the rest + `t` prop retired — 2026-08-24 · STRATEGY
      §4.3 COMPLETE. No component in `src/` takes `theme` or `t` any more.
- [x] **8.1.12** Context migration, `settingsMenuItem` + `Input` + `Header` — 2026-08-24.
- [x] **8.1.11** Context migration, `Button` + `IconButton` — 2026-08-24 · ~277 call
      sites across 35 files over the three steps; **all 22 snapshots matched and no
      `.snap` file changed** — the migration is provably behaviour-neutral.
- [x] **8.1.16a** End-to-end flow test — 2026-08-24 · `__tests__/e2e/flow.test.tsx`
      drives create → add passage → generate → answer with errors → finish → stats
      through the reducer + generators (no rendering), asserting no error count leaks.
- [x] **8.1.10** Legacy converter coverage — 2026-08-24 · `__tests__/fixtures/state006.ts`
      + `state007.ts` converted forward and asserted; the recursive chain from the oldest
      allowed version reaches `VERSION` under test. No converter bug found.
- [x] **8.1.8** Boot-path backup fixes — 2026-08-24 · new write-once
      `STORAGE_PRECONVERT_BACKUP_NAME` key split from the rolling daily backup; restore
      accepts an older snapshot and converts it forward; emergency screen now offers both
      slots; new `src/utils/bootBackup.ts` + 12 tests. Two further boot-path problems
      found and reported, not fixed (unreachable emergency screen; `loadState`'s
      catch-all can write a blank state over real data).
- [x] **2026-07-22 · docs** — PLAN.md created from the 30-question planning interview;
      STRATEGY §8 retired in favour of this file.
- [x] **2026-07-22 · docs** — FILEMAP `(?)` accuracy pass + STRATEGY §4 status audit.
- [x] **2026-07-22 · compliance** — target/compile SDK 35 → 36 (Play flagged API 35).
      Not yet built; rides on 8.1.9.
- [x] **8.1.7** AddressPicker one-verse flow — 2026-07-11 · primary "Add" + secondary
      "Extend range"; l10n en+ua; 2 new tests.
- [x] **8.1.6** Intent finish — 2026-07-11 · debug toast removed, manual SEND filter and
      the dead `handlingIntents.js` plugin deleted. Device round-trip still unconfirmed.
- [x] **8.1.5** Book-name variants in `addressFromString` — 2026-07-11 · new
      `bookAliases.ts`, one test per alias.
- [x] **8.1.4** Sanitize shared text — 2026-07-11 · new `sanitizeSharedText.ts`
      (dashes/quotes/ellipsis/nbsp, URL strip, quote peeling) + tests.
- [x] **8.1.3** Render-lag fix part 2, screen layer — 2026-07-11 · `React.memo` rows,
      memoized O(history) stat walks, hoisted inline components, `freezeOnBlur`.
- [x] **8.1.2** Render-lag fix part 1, context layer — 2026-07-11 · memoized AppContext
      value, stable `t`/`theme`, persist effect off `JSON.stringify`.
- [x] **8.1.1** Diagnose the ~0.5s render lag — 2026-07-11 · findings + ordered fix list.

**Before the queue existed** (2026-07-10/11): the P0/P1 bug sweep, login verification,
the navigator + AppContext refactor, the settings-modals→screens conversion, the themed
`Text` component + test harness, the shared `bbh-shared` package, and the bbh-api
hardening — all recorded with their notes in `STRATEGY.md` §2–§4 and `robotdiary.md`.
