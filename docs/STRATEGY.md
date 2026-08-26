# STRATEGY — where we want to be

> This file is the **destination**: what "finished" means, why the features are ordered
> the way they are, and which risks to keep an eye on. It contains **no checkboxes and
> no scheduling** — the roadmap with yes/no marks is `docs/PLAN.md`, the only file where
> work is marked done. History of what happened lives in `docs/robotdiary.md`.
>
> Product & technical philosophy: `docs/ARCHITECTURE.md` §2–§3. Not repeated here.

---

## 1. What "finished" means (1.0.0)

Bible by Heart is finished when a stranger can install it from either store and use it
for years without an account, and when Fedir can stop paying for it out of pocket:

- **Both stores.** Google Play (live, target-API compliant) and the App Store.
- **The training loop feels good.** Animated, responsive from an old small Android to a
  foldable — the "candy UI" bar, not the current baseline.
- **Nothing is ever lost.** Backup before every migration, restore from a file, and an
  optional account that syncs the same state across devices.
- **It pays its hosting.** A premium subscription through the platform billing sheets,
  target >$150/year.
- **No major bugs.** The training loop, the stats and the state converter chain are the
  three things that must never be wrong.

Everything below is in service of that list. Anything that is not is post-1.0.

## 2. The milestone ladder

The order is deliberate: make it *fast and safe*, then make it *feel good*, then add
*accounts*, then *sync*, then *content*, then *money*, then *iOS*. Each rung is a store
release, not an internal checkpoint.

| Version | What it delivers |
|---|---|
| 0.1.1 — Revival ✓ | CI/CD alive again, P0/P1 bugs dead, login verified against the new VPS |
| **0.2.0 — Fast & solid** | render lag gone, intent receiver polished, backup/restore safety net, boot path that cannot eat a state, typed navigation, files renamed — **and the first store release in a year** |
| **0.3.0 — Candy UI** | reanimated rewrite of transitions, gestures and list feel; modals purged where a screen belongs; level components split |
| **0.4.0 — Accounts+** | Expo SDK current, dead deps gone, Google auth behind a pluggable provider interface |
| **0.5.0 — Sync** | state split into parts, LWW + checksums, incremental history, sync UI |
| **0.6.0 — Content & finish** | pluggable text sources (Ukrainian translation when permission lands), real finish-screen session data, stats correctness |
| **0.7.0 — Premium** | subscription via Play Billing, entitlement in state + API |
| **0.8.0 — iOS** | App Store account, Apple ID login, iOS share extension, publish |
| **1.0.0 — Finished** | both stores, sync + payment live, no major bugs |

Play release happens at **0.2.0** — it does not wait for Candy UI. SDK-36 compliance is
already overdue and a year without an update is worse than an un-animated app.

## 3. Feature vision (in user priority order)

1. **Google auth** — added *alongside* email/password, never required. Built as a
   pluggable provider interface, because Apple ID becomes mandatory on iOS the moment
   any social login exists there. Plan both together, ship Google first.
2. **Data sync** — state split into parts; last-write-wins with a checksum per part;
   history syncs incrementally (append-only records + count/time/checksum verify) with a
   progress bar. **No forcible merge.** Design in `ARCHITECTURE.md` §3.4. Depends on the
   shared contract package and an API version compatibility gate: sync being off must
   never mean the app is broken.
3. **Ukrainian translation text** — the deliverable is the *capability*: a pluggable
   text-source interface generalized out of `fetchESV.ts`, so that when permission for a
   Ukrainian translation is secured, adding it is config plus one fetcher file.
4. **Finish-screen session data** — what was trained, how long, level-ups, what needs
   repeating. **Never error counts** (`ARCHITECTURE.md` §2.2).
5. **Premium subscription** — in-app digital subscriptions must go through Google Play
   Billing / Apple IAP; that is also what gives users the familiar platform payment
   sheet. Research first, entitlement flag in state + API second, billing last.
6. **Web version** — Expo web served statically by bbh-api. `[P3, fun]`, experiment
   only, post-1.0.

Post-1.0 pool, unordered: broadcast/update messages, feedback form, friends/feed/groups,
achievements, smarter notifications, home-screen dynamic stat labels, accessibility
pass, prove-imported-passage flow, seasonal icons, layered `t("page.title")` l10n keys.

## 4. Technical direction

Where the codebase is heading, independent of any one step:

- **The custom navigator is gone** and stays gone — one `createStackNavigator`, deep
  links and notification taps through `navigationRef`, no app state in route params.
  It is *typed* as of 2026-08-25 (`RootStackParamList` in `models.ts`); what remains is
  making the transitions *ours*.
- **Theme and l10n come from context, never props.** Done as of 2026-08-24; the rule is
  in `CODING_RULES.md` §7 so it cannot creep back.
- **Candy UI is a rewrite, not a polish pass.** reanimated + gesture-handler everywhere,
  springy and deliberate, responsive from small old Androids to tablets and foldables.
  The current visual style is the baseline, not a constraint.
- **Passage/Address become objects with methods** (`getSentences()`, address math)
  instead of a scattered pile of utils. This happens where the logic already lives — the
  level-component split — not as a standalone refactor.
- **One util per cross-cutting concern.** Haptics/sound reads the settings itself; no
  component checks `hapticsEnabled` on its own.
- **The API stays storage-agnostic.** Every endpoint goes through the service layer;
  sqlite stays until real scale says otherwise. Re-check this at each new endpoint.
- **The API server is a plain process in a container.** No process manager inside the
  image (nodemon was removed from the deployed services in 8.1.17); Docker restarts it.
  Anything environment-specific is an env-file value read at request time, not a
  committed constant.
- **The shared contract package (`bbh-shared`) is the single source of truth** for
  client↔server types, endpoint paths and the API compatibility table. Both repos
  consume the committed `dist/` from a git tag (Yarn 1 will not run a git dep's
  `prepare`, so building-on-install is not portable).

## 5. Quality bar

- **Touching a file means leaving tests behind.** No global coverage target, no saving
  tests up for 1.0 — they are written next to the code they protect.
- **The three highest-value test targets**, in order: the state converter chain (a wrong
  converter destroys years of a user's stats), the reducer (it is the heart), the test
  generators (one per level).
- **Error counts are stored, never rendered.** The end-to-end flow test asserts this
  explicitly, so a UI rewrite cannot leak them.
- `npm run lint` and `npm test` green is a precondition of every step, not a phase.

## 6. Risk watchlist

Not scheduled work — read the relevant line whenever touching its area.

- **The state converter chain is the highest-blast-radius code in the repo.** Every
  model bump needs a converter, and a wrong one is silent and permanent. Mitigations in
  place: fixture-per-version regression tests, a write-once pre-conversion snapshot that
  the rolling daily backup can no longer bury, and a restore path that accepts an
  *older* snapshot and converts it forward.
- **The boot path must never overwrite what it could not read.** Closed 2026-08-25
  (8.1.9a): the read is classified found/empty/failed and only a real `NotFoundError`
  may be followed by a write, and the recovery UI sits behind a real `ErrorBoundary`
  instead of a render-time `try/catch` React never uses. Keep the invariant — any new
  code on the cold-start path that writes state after a caught error re-opens it.
- **bbh-api has no real migration mechanism.** `createUsersTable` is
  `CREATE TABLE IF NOT EXISTS`, so it never alters a live table. An idempotent
  "ensure columns exist" step covers the ADD case; a RENAME still needs an explicit
  one-off migration keyed on `PRAGMA user_version`.
- **Native/babel config changes are historically the flakiest thing here** — the
  `react-native-fetch-api` polyfill once broke `useColorScheme()`, and EAS autolinking
  has failed before. Anything touching `app.config.js`, babel or native deps ends with a
  build.
- **Play target-API deadlines move every year.** Re-check the current requirement before
  every re-release; the store flags non-compliance rather than warning ahead.
- **Timezone/DST and streak math drops days on import.** Old bug class, still uncovered
  by tests; add regression tests when the stats correctness pass happens.
- **Dependency staleness.** One Expo SDK upgrade per year, at a milestone boundary,
  never mid-refactor.
- `navigator.tsx:66` — the background-notification TaskManager still only logs; opening
  training from a background notification is unimplemented (foreground taps work).

## 7. Decisions locked (do not re-ask)

From the 2026-07-07 and 2026-07-22 planning interviews, plus 2026-08-24.

| Topic | Decision |
|---|---|
| Backup destination | System save/share sheet — the user picks Drive/Files/wherever. Survives uninstall. |
| Backup trigger | **Silent** pre-conversion snapshot always; a dismissible prompt then *offers* a file export. Safety never depends on tapping the right button. |
| Restore | Accepts an **old-version** snapshot and re-converts it forward through `convertState`. |
| Stats day-average | Average over **days actually trained** only. Never punishes a skipped day (`ARCHITECTURE.md` §2.2). |
| Play release | At **0.2.0**, not after Candy UI. |
| Reanimated | Installed at the start of Candy UI, not earlier. |
| Milestone order | Accounts+ → Sync → Content → Premium → iOS. |
| File renames | Done in both repos — bbh-api's `base.servise.ts` became `base.service.ts` in 8.1.17 (2026-08-26). Nothing left to rename. |
| Passage/Address abstraction | Folded into the level-component split, not a standalone refactor. |
| Layered l10n keys | Post-1.0. Mechanical, large, and worth nothing to a user. |
| Fresh-install defaults | Dropped — an empty tag/train-mode list on first run is acceptable. |
| Error-message design unification | Dropped as a scheduled item; fix messages where a step already touches them. |
