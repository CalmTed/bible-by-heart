# robotdiary — AI session log

> The **only** file that carries history. Rules live in `CODING_RULES.md`, the queue in
> `PLAN.md`, the destination in `STRATEGY.md` — none of them may keep a changelog.
>
> **One entry per session, newest at the bottom, two blocks, 300 characters each:**
>
> - **Done** — what changed and why it is shaped that way.
> - **Friction** — AI errors, misreadings, wrong guesses, anything that cost a redo or a
>   round trip with Fedir. `none` when the session was clean. Never skipped: this block
>   is what the pattern list below is built from.
>
> Over budget = rewrite shorter, not a third block. Detail that must survive belongs in
> the code as a comment or in `CODING_RULES.md` as a rule.

---

## Recurring AI failures (2026-08-29, from ~65 sessions)

Read before starting. Every one of these cost at least one redo or one round trip.

1. **Asserting instead of checking.** "eas-cli is dead weight" (it is what `npm run
   build-dev` resolves to), "the App Store slot is unpublished" (the step carried a live
   product link). A link, a binary, a file on disk is evidence about the world and
   outranks any sentence written earlier — including one in these docs.
2. **Fixing the suspected cause, not the measured one.** L3's hidden words were blamed on
   the word-index disagreement (proved innocent by 1 500 generated tests); the reducer was
   blamed for the lag (the clone around it was the cost). Measure first, then fix.
3. **Blind tooling holes swallow the check.** `__tests__/` is typechecked by neither tsc
   nor eslint — reported five times over four sessions, still open; it let a test assert
   props that do not exist and a zero-argument call to a three-argument function pass.
   A green suite is not a green tree.
4. **A test that tests nothing.** `Header.test.tsx` snapshotted an empty provider for
   months; an email test passed only because the credentials were broken. If a rewrite
   cannot make a test fail, the test was never watching.
5. **Bulk edits over-reach.** A regex written for plan IDs also ate state versions; a
   PowerShell doc edit double-encoded every em dash. Diff a scripted rewrite against a
   snapshot before believing it.
6. **Ambiguity answered instead of asked.** "Which state was that screenshot in?" and
   "is UCVNTR one of the four?" each blocked half a step for days — but guessing would
   have shipped wrong data. Ask early, keep working on the half that does not depend on it.
7. **Long sessions die mid-edit.** Usage limits killed parallel workers and left the tree
   half-migrated twice. Land the highest-risk step first and verify it before widening.
8. **Scope creep dressed as tidiness.** Fedir's standing rule exists because of this:
   report what you find, do not fix it, do not add it to the plan yourself.

---

## Sessions

**2026-07-07 — bootstrap.** The five docs + CLAUDE.md in both repos, from a 44-question
interview. Locked: offline-first is constitutional, the device is the source of truth,
error counts stay hidden, the reducer stays, the navigator moves to react-navigation,
sync is LWW + checksums.
*Friction:* none.

**2026-07-08 — CI alive.** Actions failed before lint: workflows ran yarn on an npm repo
with no committed lockfile. Pinned `react-test-renderer@19.0.0`, added `.npmrc`
(legacy-peer-deps), committed `package-lock.json`, rewrote both workflows to `npm ci`.
iOS submit needed Xcode 26 → pinned `ios.image`.
*Friction:* none.

**2026-07-09 — SDK 53 → 54.** Android build died on `compileSdkVersion: 34`; found
`minSdkVersion: 35` beside it — a typo that would have excluded almost every device →
24. Then the Expo upgrade: dropped vestigial `expo-router`, moved `fileManager` to
`expo-file-system/legacy`, bumped test tooling.
*Friction:* none.

**2026-07-10 — logic bugs.** `test.en || 0 + 1` parsed as `test.en || 1` (precedence) —
the error tally the whole philosophy rests on. Plus `endVerseNum` fallback, a case-mismatch
book match, L11's comparator that read only one operand, and `console.error` → logger.
*Friction:* none.

**2026-07-10 (2) — confirms + login.** Only real gap was deleting a passage unconfirmed →
new `ConfirmModal`, used twice. Token refresh was inverted (refreshed only when the refresh
token was also expired) and dropped the new token before the retry. `isTokenExpired.ts`
extracted.
*Friction:* none.

**2026-07-10 (3) — P2.** Passage list `ScrollView` + `.map()` → `FlatList`; search moved
out of the scroll area (a `TextInput` in `ListHeaderComponent` loses focus per keystroke).
Notification channel name localized — the channelId must not change. Intent receiver
deferred: native, unverifiable in-session.
*Friction:* none.

**2026-07-10 (4) — why shared text never arrived.** The SEND filter was right; nothing ever
read `Intent.EXTRA_TEXT`, and `Linking` only surfaces VIEW/URL. Added `expo-share-intent`
+ routed it into the add flow. Found `handleTextFromIntent` running during render — an
infinite loop the moment text ever arrived.
*Friction:* none.

**2026-07-10 (5) — store-review demo account.** Login gated on REGISTER password rules, so
the reviewer's password could not be typed → login now accepts any non-empty password.
bbh-api seeds `test@bbh.com` idempotently, guards it against edit/delete, exempts it from
lockout.
*Friction:* none.

**2026-07-10 (6) — live DB drift.** The seed errored on both hosts: the live column is
`emailConfirmed`, all code says `isEmailConfirmed`, and `CREATE TABLE IF NOT EXISTS` never
migrates — user registration had been broken on production. Backed up, renamed the column
on both DBs with Fedir's approval, restarted.
*Friction:* none.

**2026-07-11 — device report.** Share intent works. Parsed text was thrown away because the
flow opened the AddressPicker (bound to different state) instead of the editor. Reminder
trigger had no `channelId`. Friendly 409 copy. `app.config.js` now reads the version from
`package.json` (they had drifted).
*Friction:* none.

**2026-07-11 (2) — login by email OR username.** One `WHERE email = ? OR userName = ?`,
client validates either shape, contract unchanged. Fedir's "requires email, not handy".
*Friction:* the ask was ambiguous ("add login by username but just email") and had to be
sent back for clarification before anything was written.

**2026-07-11 (3) — mailer.** Gmail rejected the old creds (535-5.7.8). Rotated `MAIL_PASS`
in both env files locally and on the VPS (written through redirection to preserve the
inode's owner/mode), restarted, sent a real email from inside the container. Added
non-throwing `verifyMailer()` on boot.
*Friction:* none.

**2026-07-11 (4) — migrations + converter tests.** `ensureUsersTableColumns` (PRAGMA
table_info → ADD COLUMN) closes the drift class from 07-10; renames still need an explicit
migration. First regression tests for the state converter chain. Two boot-path data-loss
holes found and **logged, not fixed**.
*Friction:* none.

**2026-07-11 (5) — three risks.** `leftSwipeTag` self-heals in the reducer's finalization
block. `addressFromString` collected all candidate matches and picked the most specific
("Judges" over "Jud"). `getMaxStroke` implemented, address errors capped. Localized auth
error bodies (5 keys, en+ua).
*Friction:* none.

**2026-07-11 — navigator refactor (WIP, broken-in-between).** The whole `AppState` used to
travel in route params. One `AppProvider` owns state, dispatch, persistence, theme and `t`;
`screeenManagement.ts` and `useApp.ts` deleted; deep links wired; the editor became a
screen. Root of "state manipulation breaks": `loadState` in an effect with **no dep array**.
*Friction:* none.

**2026-07-11 — settings modals → screens.** Nine sub-menus were MiniModals, three of them
modal-in-modal. All became stack screens over a new `SettingsSubScreen`; `SettingsListWrapper`
lost its modal. Dialogs (about/legal/dev password/delete confirm) stayed. Re-enabled the
`isAutorized` gate on user settings.
*Friction:* none.

**2026-07-11 — post-refactor re-check.** `route.params` is undefined on the primary path, so
`ListScreen`'s destructure crashed the list on open. Deep links deliver params as strings, so
`bbh://passage/12` never matched a numeric id. Both fixed; three pre-existing smells confirmed
and left.
*Friction:* both bugs shipped to `staging` unnoticed because the refactor was never device-
tested — the re-check was the test.

**2026-07-11 — bbh-shared created.** Third repo, not a monorepo: `API_VERSION` +
compatibility table, endpoint paths, auth DTOs, `AddressType`/level enums. Scope kept to what
crosses the wire. Found drift: the server's address type was non-null where the app allows
null.
*Friction:* none.

**2026-07-11 — bbh-shared wired in.** Consumed as a git dep pinned to `#v0.0.1`.
**Yarn 1 does not run a git dep's `prepare`**, so the first attempt shipped a `dist`-less
package to bbh-api. Fix: commit `dist/`, drop `prepare`. Both repos green, consumer changes
left uncommitted.
*Friction:* one full redo of the packaging design after the yarn discovery.

**2026-07-11 — themed `Text`.** The smallest slice of the theme/l10n context work: a `<Text>`
that reads the theme itself, `color` selecting a semantic colour, caller style still winning.
`AppContext` exported so tests can provide a value without the provider's side effects.
*Friction:* none.

**2026-07-11 — test harness + leaf migration.** `test-utils/renderWithContext.tsx` at the repo
root (jest-expo claims *everything* under `__tests__/` as a suite). Migrated the four lowest-
fan-out components off the `theme` prop. A context provider emits no host node, so snapshots
stayed byte-identical — that is the acceptance test.
*Friction:* none.

**2026-07-11 — planning: the session queue.** ~50 one-session steps to 1.0.0, `(build)`
markers, milestones resequenced, Fedir's feedback placed. New P0: ~0.5 s render lag on every
screen, reproducing on the pre-refactor store build — systemic, so diagnose before fixing.
*Friction:* none.

**2026-07-11 — 8.1.1 + 8.1.2 render lag, context layer.** Diagnosis: a fresh context value
every render, `dispatch`/`t`/`theme` rebuilt each time, and `JSON.stringify(state)` as an
effect dep key plus a deep clone in the body. Fixed all four with `useCallback`/`useMemo`
and by keying the persist on the state reference.
*Friction:* no device profiler available, so the ranking was read off the hot paths — Fedir's
re-time was the only confirmation.

**2026-07-11 — 8.1.3 render lag, screen layer.** `React.memo` on the passage row (primitive
props + stable callbacks) and `WeekActivity`; `useMemo` on the O(history) stat walks; home's
inline components hoisted to elements; `freezeOnBlur` + `detachInactiveScreens` so a dispatch
stops re-rendering every mounted screen.
*Friction:* none.

**2026-07-11 — 8.1.4–8.1.6 intent polish.** `sanitizeSharedText` (fold untypeable chars,
strip URLs, peel wrapping quotes only when they do not reappear inside), `bookAliases.ts`,
debug toast and the dead plugin removed. Then per Fedir: `addressFromString` searches the
whole string, word-boundary aware for Cyrillic (`\b` is ASCII-only).
*Friction:* none.

**2026-07-11 — 8.1.7 one verse is enough.** A tap on the start verse selects and stays,
revealing a primary "Add" and a secondary "Extend range"; the long-press shortcut stayed,
now redundant. Two l10n keys.
*Friction:* none.

**2026-07-22 — Play compliance.** compile/target SDK 35 → 36, buildTools 36.0.0; minSdk 24.
The explicit build-properties override was what pinned us below the store's floor.
*Friction:* none.

**2026-07-22 — docs accuracy pass.** Diffed `git ls-files` against every FILEMAP row and
**read** the files behind the vague ones: two dead rows removed, the three `(?)` resolved,
a dozen stale descriptions rewritten. `getPerfectTests` is a level-up gate, not a streak
helper — the old guess would have misled a session.
*Friction:* none.

**2026-07-22 — PLAN.md created.** A 30-question interview produced the queue; STRATEGY kept
the *why* and lost its scheduling. IDs are stable forever. Backup/restore, day-average and
release-timing decisions locked.
*Friction:* editing a UTF-8-without-BOM doc through PowerShell `Get-Content`/`Out-File`
double-encoded every non-ASCII character in STRATEGY.md; repaired by hand, rule written down.

**2026-08-24 — 8.1.8 boot backups.** Two backups shared one key, so within a day the daily
copy ate the pre-conversion snapshot; and restore rejected any snapshot whose version differed
— i.e. exactly the one it had saved. New write-once key + version-tolerant restore in
`bootBackup.ts`, extracted from `App.tsx` so tests can reach it.
*Friction:* none.

**2026-08-24 — 8.1.10–8.1.13 + 8.1.16a.** Context migration finished: ~277 call sites, 35
files, **no snapshot moved** — the acceptance criterion for a structural change. Legacy
converter fixtures (0.0.6/0.0.7) and the first end-to-end flow test, driven purely through
the reducer.
*Friction:* the session hit its usage limit; parallel workers died mid-edit and left the tree
half-migrated, cleaned up by hand. Jest also collected the new fixtures as suites.

**2026-08-24 — docs split.** STRATEGY had grown a second queue and a changelog; PLAN had
grown a protocol. STRATEGY is now vision-only (432 → ~150 lines), PLAN is marks only. Three
items dropped from the queue, 8.1.9a added openly rather than slipped in.
*Friction:* none.

**2026-08-24 — 8.1.9 backup files.** Found half-built in dev-mode rows, with a
`replace(/_ /g, " ")` that corrupts real JSON and no confirmation. Promoted it:
`backupFile.ts` split pure/IO, an envelope that still accepts a bare state (old exports,
the emergency dump), and a post-upgrade offer carrying the **raw pre-conversion** state.
*Friction:* the dev-mode rows were outside the step's file list; delegating them to the new
util was flagged after the fact rather than asked first.

**2026-08-25 — 8.1.9a + 8.1.14.** `loadState`'s trailing `.catch` treated a corrupt read
as "nothing stored" and wrote a blank state over it — reads are classified
found/empty/failed now, and only `NotFoundError` may be followed by a write. The emergency
screen sat in a `try/catch` React never uses, so it got a real boundary.
*Friction:* discovered `tsc` never sees `__tests__/` — a typed test had been passing
`route={{}}` for months. Reported, not fixed.

**2026-08-26 — 8.1.15 renames.** 15 files to convention, 23 import sites, zero logic diff.
Case-only renames on Windows need a temp name (`git mv X X.__tmp && git mv X.__tmp NewX`) and
verification against `git ls-files`, not the directory listing.
*Friction:* `sed -i` across the tree made `git status` list ~80 unchanged files (stat cache +
autocrlf) — check `git diff --stat` after a bulk edit here.

**2026-08-26 — 8.1.15a naming tail.** Fedir approved both reported findings:
`TestNavDott` → `TestNavDot`, `WeekActivityComponent` → `WeekActivity`, eight test files
renamed with their snapshots. **Jest resolves snapshots by test filename**, so a stray
`.snap` fails silently — the check is "none written, none obsolete".
*Friction:* none.

**2026-08-26 — 8.1.17 + 8.1.18 release prep (nothing committed).** The "undeployed" API
hardening existed only in the local clone — `git log origin/b..b` is the check.
`assetlinks.json` reads its fingerprints from the env **inside the handler** and answers
503 rather than an empty statement. nodemon out of the deployed services.
*Friction:* the mailer fix first tried injecting a transport, which cannot reach controller
routes — the real fix is mocking nodemailer globally in `jest.setup.ts`.

**2026-08-26 — CI red on both platforms.** `eas-version: latest` resolved to eas-cli 22.5.0,
whose transitive `@oclif/plugin-autocomplete` demands Node ≥22 while the jobs pinned 20. Node
→ 22.17.0 (what `eas.json` already pins), eas-cli pinned, packager switched to npm. Verified
by semver over all 312 engine declarations.
*Friction:* called the local `eas-cli` dependency "dead weight" — it is what `npm run
build-dev` resolves to, and removing it would have broken the documented command. Corrected
mid-session.

**2026-08-27 — 8.2.1 reanimated.** `~4.1.1` + worklets, from Expo's bundled versions.
**`babel-preset-expo` applies the worklets plugin itself** — adding it by hand
double-applies it. The first animation is MiniModal's entrance, which 19 files inherit.
New `ANIMATION` block, and a toolchain canary test.
*Friction:* a hand-rolled lockfile bump rewrote four dependency versions that legitimately sat
at 0.2.0; regenerated with `npm install` instead.

**2026-08-27 — 8.2.1a AddressPicker.** The header title was built from *which part is being
edited*, which 8.1.7 froze at 2, so the picked verse could never appear → a pure
`getPickerTitle(address, t)`. The selected verse became the app's gradient ring; the absolute
footer became a real row, so it stopped covering the last verses.
*Friction:* none.

**2026-08-27 — 8.2.1b translation selector.** Fedir's amendment made it a decision, not a
field: ask only when there is a question. `getTranslationChoice` is a pure util, so the rule
is unit-tested rather than re-derived from UI.
*Friction:* none.

**2026-08-27 — 8.2.1c study this one.** A train mode is a *filter*, not a target — so a
single-passage drill is a generator plus one reducer action, not a stored mode and not a state
version bump. `STUDY_ONE_REPEATS = 3`, deliberately ≤ the level-up threshold so a drill can
never hand out an upgrade in one sitting.
*Friction:* none.

**2026-08-27 — staging build red.** `eas.json` pinned NDK 25 and CMake 3.18.1 as SDK-53-era
workarounds; inert until reanimated became the first dependency to compile C++ from source.
Both pin blocks deleted.
*Friction:* none.

**2026-08-27 — iOS build moved.** The staging workflow was firing a *production* iOS build on
every staging push, submitting with a profile that has no iOS block. Moved to the production
workflow.
*Friction:* none.

**2026-08-28 — planning: five tasks.** bbh-api already holds four full Ukrainian translations
as JSON, so capability and content ship together: the text-source work moved from 0.6.0 into
0.3.0 and 8.5.1 was retired. Landing page scheduled beside it.
*Friction:* none.

**2026-08-28 — typeable text.** Counted every non-alphanumeric code point in the four
translations (10 283 em dashes, 3 267 curly apostrophes…) instead of writing "remove strange
characters". Normalization goes at the API, using the app's own folding table.
*Friction:* none.

**2026-08-28 — whitelist over blacklist.** Fedir's change of approach paid for itself at
once: a whitelist forces a full character inventory, which exposed ~45 stray Latin
letters inside Ukrainian words (`госпzдї`, `Iсус`) — OCR damage a punctuation blacklist
would have shipped forever.
*Friction:* none.

**2026-08-28 — 8.2.1d translation first.** Translations disagree on verse numbering, so the
translation must be settled before a verse number is shown. Two booleans became one
`AddFlowStep`, and back now walks the flow instead of closing it. `AddressPicker` was not
touched at all.
*Friction:* none.

**2026-08-28 — 8.2.2 modal purge.** Audited all 18 modal surfaces against a written rule:
filters and the log viewer became screens, the delete-account dialog lost its `100%` sizing,
sorting became an anchored popup. The full-screen `AddressPicker` is a deliberate exception —
its back stack lives in its caller.
*Friction:* none.

**2026-08-28 — 8.2.3 one transition, one header.** Picked up a previous session's half-done
work (design written, nothing wired, tree red). `theme.screen` carried a flat `paddingTop: 30`
that every header screen wore *on top of* its real inset; two screens hand-rolled their own
header. Now one `Header`, the only caller of `useSafeAreaInsets`.
*Friction:* `Header.test.tsx` had been snapshotting an empty `SafeAreaProvider` — it could
never have failed. Rewritten to 11 behavioural tests.

**2026-08-28 — 8.2.4 home + list.** Three changes, each written once and landing everywhere:
the press spring inside `Button` (~277 sites), swipe panels driven by the swipe's own
progress, and `LAYOUT.maxContentWidth`. Two older defects fell out — an action left its
panel open, and the row's `Pressable` wrapped the panels.
*Friction:* none.

**2026-08-28 — 8.2.5 training loop.** The dot row was a component declared during
render, so every answer remounted it. Seven `&&` lines became an exhaustive `Record`. L3
answered a test **as correct, during render**, when its passage was missing, and its
`!missingWords` guard could never fire.
*Friction:* the effect's first dep array keyed on the passage *object*, which is a new identity
on every state change — caught by a test asserting it submits once.

**2026-08-29 — 8.2.6 seven level files, Address + Passage.** The duplication was hiding real
bugs: four different sentence filters (so the generator and the renderer could disagree
about which sentence was asked for), three joins, two word-index counts, and an address
helper that **mutated `state.passages`** while comparing. Seven util files deleted.
*Friction:* none.

**2026-08-29 (b) — planning after the APK walk.** Fedir asked whether the reducer should be
replaced. Benchmarked instead: the reducer body does not appear in the numbers. The costs are
a per-action deep clone, an undebounced full stringify, and O(n²) history scans (42 ms at
5 000 records). No store library moves any of them.
*Friction:* none.

**2026-08-29 (c) — 8.2.20 + 8.2.21.** Clone removed (identity is the proof), the
settings heals made copy-on-write, the persist coalesced with a background flush. Four
scans became one pass each. **The clone had been normalizing `NaN` to `null`** — without
it a new passage stopped equalling its stored copy.
*Friction:* none.

**2026-08-29 (d) — six steps.** `APP_VERSION` reads the real app version (About had
shown the *state* version for six releases); gradient buttons stop animating instead of
vanishing; the header falls; L10 stamps its own level; and seven `setState(<stale
snapshot>)` sites — why picking a language undid itself.
*Friction:* 8.2.26 ended blocked on a question only Fedir can answer (which state the screenshot
was in); the suspected cause was disproved by 1 500 generated tests.

**2026-08-29 (e) — six steps.** `feedback(settings, name)` — the haptics guard was
written out eleven times and **two call sites had none**. `height: "93%"` under a Header
is 93% of the *whole* screen → `flex: 1`. Sorting became a `SelectModal`, so
`AnchoredPopup` died. A backup is now a file type the OS knows.
*Friction:* none.

**2026-08-29 (f) — 8.2.25, 8.2.36, 8.2.35.** Tag filters are a plain hide-list (untagged rows
stopped vanishing) and the list says what narrows it. `MIN_TEST_OPTIONS`: l11/l21 fall back to
their address half instead of offering one option. `levelLayout.ts` gives all seven levels one
prompt/answer/action arrangement.
*Friction:* none.

**2026-08-29 (g) — 8.2.28 + 8.2.7.** One `gestureDirection` per destination decides both
the edge a card enters from and the way its dismissal drags; the vertical band defaulted
to 135 px and swallowed list scrolling. Then 42 typing equivalences: a stored `—` or `’`
made a passage unlearnable at level 5.
*Friction:* three tests failed before it was clear that `runOnJS` hops to the JS thread — every
gesture assertion has to await a tick.

**2026-08-29 (h) — 8.2.11 + 8.2.12 [api].** Catalogue + passage endpoints over the
bundled JSONs, zero-based on the wire like the app's model. Loading: nothing at boot,
`meta` kept, `verses` in one hot slot. Fold → strip → whitelist, and **28 verses of OCR
damage repaired**. ESV is a proxy that stores nothing.
*Friction:* none.

**2026-08-29 (i) — VPS.** `ESV_API_KEY` appended to both env files as `deploy`. Single-file
bind mounts bind the **inode**, so any edit that replaces the file silently detaches the mount:
append in place only. Nothing restarted — the deployed code cannot use the key yet.
*Friction:* none.

**2026-08-29 — 8.2.13 + 8.2.14.** `fetchESV` became `fetchPassageText`; the app sends no
headers at all and `ESVTOKEN` left the config. A translation now names its source, so state
went 0.1.1 with `to011`, and one merge serves both the upgrade and a new server translation.
25 book spellings became 314, one generated test each.
*Friction:* the alias suite took 17 s because `Address.parse` rebuilt ~580 regexes per call —
built once now, and parsing is faster than before the aliases existed.

**2026-08-29 — 8.2.15 [api] landing + stats.** One self-contained HTML file: the app's dark
palette, its gradient, copy ordered by what exists nowhere else, both store buttons live,
en+uk in the markup with a 15-line language script. `GET /stats` is in-memory, capped, escaped,
`noindex`.
*Friction:* rendered the App Store button dark on the strength of a sentence in the step, while
the step's own link proved the app was published. A live link outranks prose.

**2026-08-29 — docs: iOS is published.** ARCHITECTURE §1/§4 and STRATEGY §1/§2 corrected; no
plan box ticked, because marking steps done is Fedir's call.
*Friction:* none.

**2026-08-29 — 8.2.39 shared parsing.** A trailing "ESV" reached the editor as part of
the verse, and the translation was guessed from the address language — hopeless with
four Ukrainian ones. `takeSharedTranslation` reads only names the app knows, only where
a stamp goes, so "The LORD is my shepherd" keeps its LORD.
*Friction:* none.

**2026-08-29 — 8.2.10 pre-release doc pass (not the release).** Every plan ID, `§` and
doc citation stripped from ~105 source files and their test titles; PLAN lost its
470-line archive; this diary was rewritten to the format above and given the failure
list; the other four docs lost their history. The dropped UCVNTR default settled the two
red tests.
*Friction:* the strip regex matched `\d+\.\d+\.\d+`, so it also ate legitimate **state**
versions (`before 0.1.1`, `new in 0.0.8`) and left half-sentences behind; caught only by
diffing against a pre-edit snapshot, and restored by hand.
