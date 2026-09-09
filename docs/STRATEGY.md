# STRATEGY — where we want to be

> This file is the **destination**: what "finished" means, why the features are ordered
> the way they are, and which risks to keep an eye on. It contains **no checkboxes, no
> scheduling and no history** — the roadmap with yes/no marks is `docs/PLAN.md`, and what
> happened is `docs/robotdiary.md`.
>
> Product & technical philosophy: `docs/ARCHITECTURE.md`. Not repeated here.

---

## 1. What "finished" means (1.0.0)

Bible by Heart is finished when a stranger can install it from either store and use it
for years without an account, and when Fedir can stop paying for it out of pocket:

- **Both stores.** Google Play and the App Store, both live and compliant.
- **The training loop feels good.** Animated, responsive from an old small Android to a
  foldable — the "candy UI" bar.
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
| 0.1.1 — Revival | CI/CD alive again, P0/P1 bugs dead, login verified against the VPS |
| 0.2.0 — Fast & solid | render lag gone, intent receiver polished, backup/restore safety net, a boot path that cannot eat a state, typed navigation, files renamed — and the first store release in a year |
| **0.3.0 — Candy UI + text sources** | reanimated rewrite of transitions, gestures and list feel; modals purged where a screen belongs; level components split — **and** bbh-api becomes the one text source: four bundled Ukrainian translations, ESV proxied behind the same call |
| **0.4.0 — Accounts+** | Expo SDK current, dead deps gone, Google auth behind a pluggable provider interface |
| **0.5.0 — Sync** | state split into parts, LWW + checksums, incremental history, sync UI |
| **0.6.0 — Content & finish** | real finish-screen session data, stats correctness, the level-up offer |
| **0.7.0 — Premium** | subscription via Play Billing, entitlement in state + API |
| **0.8.0 — iOS** | Apple ID login, iOS share extension, iOS fixes pass — the App Store listing is already live |
| **1.0.0 — Finished** | both stores, sync + payment live, no major bugs |

The Play release happens at 0.2.0 — it does not wait for Candy UI. Store target-API
compliance is not something to be late on, and a year without an update is worse than an
un-animated app.

## 3. Feature vision (in user priority order)

1. **Google auth** — added *alongside* email/password, never required. Built as a
   pluggable provider interface, because Apple ID becomes mandatory on iOS the moment
   any social login exists there. Plan both together, ship Google first.
2. **Data sync** — state split into parts; last-write-wins with a checksum per part;
   history syncs incrementally (append-only records + count/time/checksum verify) with a
   progress bar. **No forcible merge.** Design in `ARCHITECTURE.md`. Depends on the
   shared contract package and an API version compatibility gate: sync being off must
   never mean the app is broken.
3. **Translation text** — the bundled translations sit in `bbh-api/src/translations/` as
   full-text JSON, so the capability and the content arrive together. The pluggable
   source *is* bbh-api — the client makes one call for any translation, and ESV is one id
   among them instead of a direct third-party call from the phone. Two rules govern it:
   the ESV key lives only in the API's env file, and the API is a **proxy that stores no
   passage text**.
4. **Finish-screen session data** — what was trained, how long, level-ups, what needs
   repeating. **Never error counts.**
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
  links and notification taps through `navigationRef`, no app state in route params, and
  a typed `RootStackParamList`. What remains is keeping the transitions *ours*.
- **Theme and l10n come from context, never props.**
- **Candy UI is a rewrite, not a polish pass.** reanimated + gesture-handler everywhere,
  springy and deliberate, responsive from small old Androids to tablets and foldables.
- **One home per concern.** `Address` and `Passage` own everything about an address and a
  passage's text; `feedback` owns whether the phone may buzz; `ANIMATION` and `LAYOUT` own
  every motion and layout number. A second copy of any of them is a bug waiting for a
  disagreement.
- **The API stays storage-agnostic.** Every endpoint goes through the service layer;
  sqlite stays until real scale says otherwise. Re-check this at each new endpoint.
- **The API server is a plain process in a container.** No process manager inside the
  image; Docker restarts it. Anything environment-specific is an env-file value read at
  request time, not a committed constant.
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
- A green suite is not a green tree while `__tests__/` is typechecked by nothing —
  closing that hole will surface a batch of existing errors and deserves its own step.

## 6. Risk watchlist

Not scheduled work — read the relevant line whenever touching its area.

- **The state converter chain is the highest-blast-radius code in the repo.** Every
  model bump needs a converter, and a wrong one is silent and permanent. Mitigations in
  place: fixture-per-version regression tests, a write-once pre-conversion snapshot that
  the rolling daily backup can no longer bury, and a restore path that accepts an
  *older* snapshot and converts it forward.
- **The boot path must never overwrite what it could not read.** The read is classified
  found/empty/failed and only a real `NotFoundError` may be followed by a write, and the
  recovery UI sits behind a real `ErrorBoundary`. Keep the invariant — any new code on the
  cold-start path that writes state after a caught error re-opens it.
- **bbh-api has no real migration mechanism.** `createUsersTable` is
  `CREATE TABLE IF NOT EXISTS`, so it never alters a live table. An idempotent
  "ensure columns exist" step covers the ADD case; a RENAME still needs an explicit
  one-off migration keyed on `PRAGMA user_version`.
- **Native/babel config changes are historically the flakiest thing here** — a fetch
  polyfill once broke `useColorScheme()`, EAS autolinking has failed before, and stale
  SDK-era pins in `eas.json` only surfaced when a dependency first compiled C++. Anything
  touching `app.config.js`, babel or native deps ends with a build.
- **The CI toolchain drifts on its own.** The EAS action installs the CLI with no
  lockfile, so a transitive dependency can raise its Node floor without a commit from us.
  Node and eas-cli are pinned; check them when a pipeline goes red before anything ran.
- **Play target-API deadlines move every year.** Re-check the current requirement before
  every re-release; the store flags non-compliance rather than warning ahead.
- **Timezone/DST and streak math drops days on import.** Old bug class, still uncovered
  by tests; add regression tests when the stats correctness pass happens.
- **Dependency staleness.** One Expo SDK upgrade per year, at a milestone boundary,
  never mid-refactor.
- **The text endpoints are unauthenticated**, so the ESV proxy is an open door onto
  Fedir's quota and the API has no rate limiter. A note, not an alarm, at five users —
  but it is the thing that changes when the store listing carries the API with it.
- `navigator.tsx` — the background-notification TaskManager still only logs; opening
  training from a background notification is unimplemented (foreground taps work).

## 7. Decisions locked (do not re-ask)

| Topic | Decision |
|---|---|
| Backup destination | System save/share sheet — the user picks Drive/Files/wherever. Survives uninstall. |
| Backup trigger | **Silent** pre-conversion snapshot always; a dismissible prompt then *offers* a file export. Safety never depends on tapping the right button. |
| Restore | Accepts an **old-version** snapshot and re-converts it forward through `convertState`. |
| Stats day-average | Average over **days actually trained** only. Never punishes a skipped day. |
| Play release | At **0.2.0**, not after Candy UI. |
| Milestone order | Accounts+ → Sync → Content → Premium → iOS. |
| File renames | Done in both repos. Nothing left to rename. |
| Passage/Address abstraction | Folded into the level-component split, not a standalone refactor. |
| Layered l10n keys | Post-1.0. Mechanical, large, and worth nothing to a user. |
| Fresh-install defaults | Dropped — an empty tag/train-mode list on first run is acceptable. |
| Error-message design unification | Dropped as a scheduled item; fix messages where a step already touches them. |
| Text sources | **bbh-api serves every translation**, ESV included, through one call. The app never holds the ESV key. The API is a proxy and **stores no passage text**. |
| Translation before address | The translation is picked *before* the address picker — numbering differs between translations, so it must be settled before a verse number is shown. |
| Numbering | **A translation numbers its own chapters and verses**, generated from the text the API serves (~4 KB each) and shipped on-device for the bundled ones. No shared table can be right about five translations at once; `chaptersAlternative` was the attempt and goes. `bibleReference` keeps the book list, the book order and the title keys, and its `chapters` becomes the KJV table it was trying to be. |
| Canon scope | **Every translation carries the 66 books and their canonical chapters, and nothing else.** The deuterocanonical books and the chapters appended to canonical ones — Ps 151, Dan 13–14, Esth 11, 2Chr 37 — are *deleted from the translation files*, not kept and filtered: a translation that had them originally is no exception. Chapter *divisions* still differ freely (Joel in three chapters or four, Mal in three or four), and verses inside a canonical chapter are never filtered — Dan 3 running to 100 verses is that chapter in that translation. |
| Book-name variants | A shipped on-device table, never a lookup — address recognition from shared text must work offline. |
| Typeable text | **Every text source normalizes to characters a phone keyboard can produce**, at the API, with the same folding table as `sanitizeSharedText.ts`. Learning ends in typing by hand and L5 demands the exact character, so an em dash or a curly quote makes a passage unlearnable. Already-saved passages are never rewritten — the L5 comparator tolerates those instead. |
| Whitelist, not blacklist | The typeable set is defined by **what is allowed** — per language (Ukrainian letters *or* Latin, never both), digits, space, `.` `,` `:` `;` `!` `?` `-` `'` `"`. Fold variants first, then validate; a character outside the list is **reported as a data defect, never silently stripped**. This is what surfaced the OCR homoglyphs (`госпzдї`, `Iсус`) that a blacklist would have shipped forever. |
| UCVNTR | The label the app shipped for hand-typed Ukrainian text is not one of the four bundled translations and is not guessed at; it is no longer a shipped default. |
| Синодальний | Public domain, so **bundled** like the Ukrainian four rather than proxied like ESV: `rus-syn`, shipped id 7, third in the catalogue, ~7.5 MB. Source and licence chain in §3. |
| Address language ≠ interface language | One enum did both jobs; a Russian translation needs the first and must not touch the second. The address language becomes its own type, a superset of `LANGCODE`, with book titles from a book-name table rather than a UI dictionary. **No third `l10n` file.** |
| Interface languages | English and Ukrainian, and never a third — the Синодальний is a compromise on the *text*, not an invitation to localize the app into Russian. A phone set to Russian opens the app in **Ukrainian**; a phone that is neither Ukrainian nor Russian opens it in English. |
| The picker speaks the address language | The address picker names its books in the **translation's** language, from the same book-name table the display, the export and the parser share — pick "Иоанна", see "Иоанна 3:16". It is the picker that was out of step, not the four screens around it. |
| Verse counting | `versesCount` counts in the **passage's own translation numbering**, never the KJV table — a chapter that ends at a different verse is exactly what the numbering exists to know. Passages already saved keep the `versesNumber` they were saved with. |
| Docs | `PLAN.md` carries no archive, and no doc but `robotdiary.md` carries history. Comments cite no document. |

## 8. Judgement — the calls this document cannot list

**Common sense before flexibility.** The app cannot be infinitely accommodating and does
not try to be. Who would learn 1 Esdras or Enoch by heart? Nobody — so those books are
not carried, not declared, not filtered, and no mechanism is built to hold them "just in
case". Cost with no reader is still cost. The same question settles the ones nobody
anticipated: not "could the data model express it", but "would a believer memorizing
scripture ever want it".

**Synergy over autonomy, at the price of a round trip.** When Fedir's reasoning is
unclear it is neither guessed at nor silently followed. Say so, and say it *before*
writing anything:

> There are several things I keep trying to say that it seems you don't quite
> understand. Are you sure you want to add that feature…?

Being confronted about a question that makes no sense is welcome — he asked for it in
those words. Building the wrong thing because nobody asked is not: it costs more than
any number of questions, and it costs the same whether the misunderstanding was his or
the AI's. Stopping to ask is never the expensive option.
