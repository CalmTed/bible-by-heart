# PLAN — the roadmap

> The only file where work is marked done. `[ ]` = not done, `[x]` = done.
> One box = one session. **Take the first unchecked box** unless Fedir says otherwise.
> The *why* behind the order lives in `STRATEGY.md`; the story of each session goes to
> `robotdiary.md`. Neither of them carries checkboxes.

**Rules**

- Win conditions, every step: `npm run lint` ✓ · `npm test` ✓ · `FILEMAP.md` updated if
  files changed ✓ · `robotdiary.md` entry appended, **both blocks** (what was done, and
  the friction) ✓ · new UI strings in **both** `en.ts` and `ua.ts` ✓.
- IDs are stable and never renumbered — new work is inserted as `8.1.9a`. IDs may read
  out of order.
- Tags: `(build)` ends with a version bump + `npm run build-dev` · `(one-sitting)`
  splitting it would be worse · `[api]` / `[shared]` = the other repo.
- **A finished step is deleted from this file.** No archive, no dates, no story here —
  what happened lives only in `robotdiary.md`, under the date.
- Work found outside the current step's scope: **report it and ask Fedir.** Don't fix it
  silently, don't add a step silently.
- Build cadence: any session touching native config or dependencies ends with a build;
  otherwise a patch bump + staging build every ~4–6 sessions.

---

## 0.4.0 — Accounts+

- [ ] **8.3.1 Expo SDK upgrade** (54 → current, if the jump is documented-safe) (build)
- [ ] aditional issues fix:  
      - __tests__/ is checked by nothing. tsconfig.json include is ["*","src/*","src/*","src/**/*","plugins/*"] (note the duplicated entry) and lint is eslint ./src/ — so tests get neither tsc nor eslint. test-utils/ is uncovered too
      - @ts-ignore in src/ — Button, Input, TestNavDot, WeekActivity, initials ×2, models ×2, CalendarScreen — against a rule that bans them
      - MiniModal has no statusBarTranslucent — its backdrop is full-screen, so on Android the dim stops short of the status bar
      - LevelPicker.handleLabelPress opens with a dead if: if (!isNaN(passageLevelFromTestLevel)) { // return; } — so the picker opens mid-session and lets the level be changed
      - TestsScreen builds try-durations from new Date().getTime() during render (lines 291/295), so a recorded duration is "time between two renders" and a first-time-correct test stores an unclosed try
      - L40 compares typed text raw — targetText.trim().startsWith(passageText.trim()), ===, and toLowerCase().startsWith for word options
      - PassageEditor's fetch proposition is a hand-rolled ConfirmModal (raw MiniModal + text + Cancel/green confirm)
      - Address.parse rejects a dot after an abbreviation — Ів. 3:16 and Jn. 3:16 don't resolve, Ів 3:16 does
      - sanitizeSharedText leaves a leading dash — Пс 23:1 — «текст» arrives as — «текст»
      - Timezone/DST streak math can drop a day (a 25h day reads as a break)
      - The text endpoints are unauthenticated and unrated — the ESV proxy is an open door onto your quota - will need device id to check rate
      - data/test.db is tracked and rewritten by every test run — an unreadable 20 KB binary in every commit, unmergeable on conflict --- drop it add autogeneration on device when not exists
      - www.biblebyheart.app is not in the App-Links filter (only the bare host, app.config.js:92), though Caddy serves it
      - bDeuLong reads "Deoteronomy" in en.ts (and ua.ts) — visible in the UI. bibleBooks.ts spells it correctly on purpose, so the two now differ --- rename bDeuLong
      - ukr-turk's meta has no chapterCount — the catalogue reports null --- count and add
      - isApiVersionCompatible() in bbh-shared is dead code — fetch.ts:158 compares versionData.version === API_VERSION raw, so the API_COMPATIBILITY range table never runs and the first contract bump hard-fails every older app
      - The "outdated app" alert (fetch.ts:161 and :190) is a hardcoded Ukrainian title + English body, not t() from l10n

      

- [ ] **8.3.2 Deps cleanup** — drop the unused `react-native-fs`, `expo-random` →
      `expo-crypto`, `eas-cli` out of dependencies (build)
- [ ] **8.3.3 Google auth — decision doc** (pluggable provider interface, Apple ID must
      slot in later; `expo-auth-session` vs native; token exchange with bbh-api)
- [ ] **8.3.4 [api] Google auth endpoint** — provider-agnostic `/api/user/oauth`, verify
      the Google ID token, issue the same JWT pair, supertest coverage - link account if registered with simple email
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

- [ ] **8.5.2 Finish-screen session data** — what was trained, time, level-ups, what
      needs repeating, **without** error counts; l10n en+ua
- [ ] **8.5.3 Stats correctness pass** — day-average over *active days only*
      (`getStats.ts:330`), streak/timezone-DST regression tests (build)
- [ ] **8.5.5 Offer the next level the moment it is reached** — when a passage earns a
      new level, propose moving up to it **then**, not the next time the passage comes
      round, and not merely whenever it would be possible. `finishTesting` already
      computes the moment (`reduce.ts:385` sets `isNewLevelAwalible` on exactly that
      transition), so this is the offer, not the detection. It belongs with the finish
      screen 8.5.2 builds, which is where a level-up has somewhere to be said. Interacts
      with the `autoIncreaseLevel` default — if the level rises on its own, this becomes
      a notice rather than a question. l10n en+ua.
- [ ] **8.5.4 🏁 0.6.0**

## 0.7.0 — Premium

- [ ] **8.6.1 IAP research + decision doc** (`expo-iap` / RevenueCat / raw Play Billing;
      subscription product setup; entitlement model)
- [ ] **8.6.2 Entitlement flag** in AppState + bbh-api user record + endpoint; state
      version bump + converter + tests
- [ ] **8.6.3 Play Billing integration** + purchase/restore flows + premium gate (build)
- [ ] **8.6.4 🏁 0.7.0**

## 0.8.0 — iOS

> The app is **already published on the App Store**. What is left here is iOS feature
> parity, not the release itself.

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

Retired IDs, never to be re-added: **8.5.1** (pluggable text-source interface — bbh-api
serving every translation *is* that interface) and **8.2.9** (layered `t("page.title")`
l10n keys). Also dropped: fresh-install default tags/train-modes (`initials.ts`), and the
standalone error-message-design unification — fix messages where a step already touches
them. The post-1.0 pool lives in `STRATEGY.md`.
