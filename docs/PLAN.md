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

---

## 0.3.0 — Candy UI

The animation rewrite. Every wrapper step ends with a build, because feel cannot be
judged from tests.

> Fedir's 2026-08-27 review of the live add-passage flow produced 8.2.1a–8.2.1c — one
> user journey: pick an address, pick a translation, start learning it. All three are
> done (2026-08-27); the journey holds together only on a device, so it is the first
> thing to walk on the next build.

> Fedir's 2026-08-28 additions: 8.2.1d closes the add-passage journey, and 8.2.11–8.2.15
> pull the text-source work **into 0.3.0** (it was 8.5.1 in 0.6.0). bbh-api now carries
> four full Ukrainian translations as JSON, so this milestone ships real Ukrainian text —
> §3.3 of `STRATEGY.md` is no longer waiting on permission.

- [ ] **8.2.7 Level 5 similar-chars tolerance**
      An equivalence list (dash variants, quote/apostrophe variants, ellipsis, і/i
      lookalikes, diacritic case) used by the L5 comparator, one unit test per pair.
      Complements 8.1.4 (sanitize on input) by tolerating on comparison. Do not widen
      tolerance to real misspellings. It is not made redundant by 8.2.11 normalizing at
      the API: passages **already saved** in a user's state keep whatever characters they
      were stored with, and nothing may rewrite them behind his back.

- [ ] **8.2.8 Haptics/sound util**
      One `src/utils/feedback.ts` that checks `hapticsEnabled` / `soundsEnabled` itself;
      no component reads those settings directly.

- [ ] **8.2.11 [api] Passage text endpoint — the bundled translations**
      The four Ukrainian JSONs in `bbh-api/src/translations/` (`ukr-hom`, `ukr-kul`,
      `ukr-ogi`, `ukr-turk` — meta + book names + full verse text) become a served
      resource: a catalogue endpoint listing available translations with their metadata
      and book-name maps, and a passage endpoint answering an address with text. Goes
      through the service layer like everything else (`STRATEGY.md` §4), zod schema on
      the query, supertest coverage including a bad address and an unknown translation.
      Decide and write down how the files are loaded — lazily per translation, not four
      30k-verse blobs held in memory on boot.
      **Text must come out typeable — this is not cosmetic.** Learning ends in typing the
      verse by hand, and the L5 comparator demands the *exact* character, so anything a
      phone keyboard cannot produce makes a passage unlearnable.
      **A whitelist, not a blacklist** (Fedir, 2026-08-28) — only necessary characters
      survive, so a character nobody anticipated fails closed instead of reaching a user.
      The whitelist is **per language**, which is the whole point (see the defect below):
      · `uk` → the 33 Ukrainian letters in both cases, and nothing else Cyrillic
      · `en` → `A–Z a–z`
      · both → `0–9`, space, and the basic punctuation `.` `,` `:` `;` `!` `?` `-` `'` `"`
      **Order matters: fold, then validate.** First map the typographic variants to their
      ASCII equivalents with the *same table* `src/utils/sanitizeSharedText.ts` (8.1.4)
      already uses — `—` (10 283) and `–` (190) → `-`; `’` (3 267) → `'`; `«` `»`
      (3 193 / 3 188), `“` `”` (1 914 / 1 908), `„` (11) → `"`; `…` (1 955) → `...` — so
      one definition of "typeable" serves both repos. Then drop the editorial apparatus
      Fedir approved: `[` `]` (872), `*` (92), `|` and `_` (one each), and — same class,
      same rule — `(` `)` (1 694). Marks go, the words between them stay.
      Only then validate against the whitelist. **A leftover is a data defect, not
      something to silently strip** — the run must report it with book/chapter/verse.
      *Known defects it will report (found 2026-08-28, ~45 spots):* OCR damage where a
      Latin or Russian letter replaced a Cyrillic one mid-word — `госпzдї` (ukr-kul
      Gen 24:23), `заповmт` (Gen 17:14), `Райдугr` (Gen 9:13), `IIIеванія` (ukr-hom
      Neh 9:5, three Latin `I` for `Ш`), `Iсус` (Luk 24:15, Latin `I`), `Хіэл` (1Kin
      16:34, Russian `э`). These are untypeable *and* wrong text; fix them in the source
      JSONs as part of this step, one at a time — a homoglyph cannot be mapped blindly.
      Normalize **once at the API**, so no client can serve untypeable text, and cover it
      with a test that walks every verse of every translation and asserts the output uses
      nothing outside that translation's whitelist.

- [ ] **8.2.12 [api] ESV through the same endpoint — proxy, never a store**
      ESV joins the catalogue as one more translation id, so the client makes the same
      `api.bbh.app` call for it as for the Ukrainian ones. **The key is read from the
      env file at request time** (`STRATEGY.md` §4) and lives nowhere else — not in a
      constant, not in this file, not in anything git indexes; confirm `.env` and
      `.agent` are both still ignored before committing. bbh-api is a **pure proxy**:
      the upstream response is passed through and **no passage text is written to disk,
      to sqlite, or to a cache** — a supertest asserts that, so a later "let's cache it"
      cannot land quietly. Upstream failure maps to a clean error, never a 500 body with
      the key in it. The upstream response goes through the **same normalizer as 8.2.11**
      before it is returned — ESV text is typed by hand exactly like the Ukrainian text,
      and normalizing a response in flight is not storing it.

- [ ] **8.2.13 Client text source — one call for every translation**
      `src/services/fetchESV.ts` becomes a source-agnostic `fetchPassageText` over
      `API_LINK`, and `ESVTOKEN` leaves the app entirely (`app.config.js` extra + any
      EAS secret) — the client must never hold the key again. Translations come from the
      catalogue, so a Ukrainian translation is selectable in the passage editor and
      `TRANSLATIONS_TO_FETCH` stops being a hardcoded `[1]`. Per-translation verse
      numbering is what 8.2.1d cleared the way for. l10n en+ua; the offline rule stands —
      no text source means no text, never a broken app.

- [ ] **8.2.14 Book-name variants, on-device**
      Extend `src/utils/bookAliases.ts` (8.1.5) into a fuller local table of book-name
      spellings and abbreviations, harvested from the four translations' `books` maps
      plus the common third-party forms, so shared/typed text resolves to an address
      **without a network call**. Stays a shipped constant, not a download. One test per
      added variant, and no alias may collide with another book.

- [ ] **8.2.15 [api] Landing page**
      A single static HTML page in `bbh-api/static/`, in the app's visual style, with a
      short description and store buttons — Play now, App Store slot left dark until
      8.7.5. Alongside the existing privacy/terms/account-deletion pages and linked to
      them. Plain HTML + inline CSS, no build step, no framework, responsive from phone
      to desktop.

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

**8.5.1 Pluggable text-source interface** was superseded on 2026-08-28 and its ID retired:
bbh-api serving the translations (8.2.11–8.2.13) *is* the pluggable source, and it happens
in 0.3.0 instead of 0.6.0. Nothing was dropped — the capability moved a milestone earlier.

Post-1.0 pool lives in `STRATEGY.md` §3. Dropped from the queue on 2026-08-24:
fresh-install default tags/train-modes (`initials.ts:130`), the standalone
error-message-design unification, and layered `t("page.title")` l10n keys (8.2.9).

---

## Archive

Newest first. One line each; the full story is in `docs/robotdiary.md` under the date.

- [x] **8.2.6** Split level components + Passage/Address abstraction — 2026-08-29 · both
      halves done in one sitting; the second half is what made the first worth doing.
      **(1) Seven level files**, each named after its only export — `Level1.tsx` and
      `Level2.tsx` held two components each, and `LevelComponentModel` lived inside
      `Level1.tsx`, so every other level imported its props type from an unrelated level
      (it is in `models.ts` now). `SentenceContext.tsx` took the context-sentences block
      L40 and L50 each drew inline. **(2) `utils/address.ts` and `utils/passage.ts`** —
      two namespaces of pure functions over plain JSON (never classes: state is
      AsyncStorage JSON). Seven util files were deleted and ~25 call sites moved over.
      The duplication was hiding real disagreements: sentences were split with four
      different filters and joined three different ways, so a `sentenceRange` written by
      a generator did not always mean the same slice to the level that resolved it; word
      indexes were collapsed by the generator and not by the renderer; `getAddressDifference`
      **mutated the passage addresses it compared**, inside app state. All three are fixed
      by there being one definition. Found and fixed on the way: L10 crashed on a test
      whose passage had been deleted. 254 tests ✓, snapshots regenerated. **Needs a
      device walk of a sliced test** (see robotdiary).
- [x] **8.2.5** Wrapper rewrite — tests/levels screens + finish-screen shell — 2026-08-28 ·
      the training loop got the same treatment, and three real defects came out of reading
      it honestly. **(1) The dot row was a component declared inside `TestsScreen`'s render
      body** — a new component type every render, so React remounted the whole session
      header (gradients and all) on every answer. It is `TestNavBar` at module level now,
      and CODING_RULES §4 gained the general rule that the 8.2.4 `SwipeActionPanel` one is
      a special case of. **(2) Seven near-identical `test.l === TESTLEVEL.lXX && <LXX …/>`
      blocks became a `Record<TESTLEVEL, FC<LevelComponentModel>>`** — exhaustive, so a new
      level is a type error until answered, but read as possibly-missing so an unknown
      stored level renders a leaveable session instead of throwing. **(3) `Level3` answered
      a test from its render body**, and three things were wrong with it: it ran during
      render (the class of bug that made the finish screen get skipped in July), its guard
      `!missingWords` was `![]` and had therefore never once fired, and the half that *was*
      live submitted a test whose passage had been deleted as **correct**. Now: a deleted
      passage renders nothing and lets `TestsScreen` leave the session (what every other
      level already did), and the real valve — a test with no missing words — fires from an
      effect keyed on the passage **id**, because `passages.find(...)` hands back a new
      object identity on every state change and an identity dep would re-submit forever.
      **New `Entrance`** (`components/Entrance.tsx`): the app's arrival written once — fade
      on a timing, rise on the shared spring, deliberately no scale — with `replayKey` (the
      session body is keyed on the test id, so the next test arrives rather than blinks) and
      `delayMs` (the finish button staggered behind its cup). `Header` keeps its own copy on
      purpose; its animated view *is* the bar. **The finish screen is a shell**: bare Header
      → scrolling body (`flexGrow` + centring, so the cup stays put while it is empty and a
      summary scrolls when 8.5.2 fills it) → a Continue button that stays put; no session
      data invented here. Plus the exit dialog became a `ConfirmModal` (one of 8.2.2's two
      hand-rolled confirms), `LAYOUT.maxContentWidth` on both surfaces, and two dead styles
      + the commented-out dev "Pass" button removed. 19 new tests (10 `TestsScreen` — it had
      none at all before, driven through L10 over a real stateful context; 3 `Entrance`;
      3 `FinishScreen`; 3 `Level3` render-purity, of which "passed once across re-renders"
      is the one that proves effect-not-render); no new l10n strings, no snapshots retaken.
      0.2.3 → 0.2.4, lint ✓, 229 tests ✓.
- [x] **8.2.4** Wrapper rewrite — home + passage-list interactions — 2026-08-28 · three
      changes, each picked for leverage rather than surface. **(1) Press feedback lives in
      `Button`** — it sinks to the new `ANIMATION.pressScale` on press-in and springs back
      on press-out, which upgrades every button in the app at once (~277 call sites, and
      the home screen is nothing but these). Same argument as MiniModal owning the dialog
      entrance in 8.2.1. **(2) The passage rows moved to `ReanimatedSwipeable`**, so the
      last RN-core `Animated` in the list is gone and the action panels are driven by the
      swipe's own `progress` instead of sitting fully formed behind the row: a module-level
      `SwipeActionPanel` (a component, because the render callbacks are *called*, so a hook
      written inline there would be a hook in a plain function) clamps progress at 1 and
      trails the row out from under it. Two interaction defects fell out on the way — an
      action left its panel open even though every one of them rewrites its own label
      ("Archive" → "Unarchive"), and the row's `Pressable` wrapped the *whole* swipeable,
      so a tap on the empty part of a revealed panel opened the editor. Both fixed; both
      now rules in CODING_RULES §4. **(3) Layout small→foldable:** new
      `LAYOUT.maxContentWidth` caps the list column (search field and rows together — the
      `Header` still spans, a bar is not a column) and the home button column. Home's
      buttons were `flex: 1` *twice over* — the same style on a wrapper and on the column
      inside it — so on a short phone they got exactly half the leftover space and the last
      one fell off the edge; content-sized now, with the logo block absorbing the squeeze.
      Row props stayed primitive, so the 8.1.3 `React.memo` still holds. 6 new tests (3
      Button, 4 row interactions, driven through a real stateful context because a swipe
      action only proves anything if what it writes comes back into the list); no new l10n
      strings — nothing gained or lost a word. 9 snapshots retaken, all of them the same
      one-line change (the Button's outer `View` became an `Animated.View`). 0.2.2 → 0.2.3,
      lint ✓, 210 tests ✓.
- [x] **8.2.3** Wrapper rewrite — screen transitions + `Header` — 2026-08-28 · picked up
      from a session that ran out of budget mid-step, which had written
      `utils/screenTransition.ts` and the new `Header` API but wired up neither: the
      transition was imported by nothing and the Header's eight call sites still passed
      the old props, so every settings sub-screen rendered an empty bar. Finished:
      `candyTransition` spread into the navigator (explicit options override v7's
      `Platform.Version` preset; `cardOverlayEnabled` set, since it defaults off on iOS),
      `ANIMATION.staggerMs` added, all call sites migrated. **Then, at Fedir's ask, a full
      header sweep:** `theme.screen`'s flat `paddingTop: 30` removed — every header screen
      had been wearing it *on top of* its real device inset — and the three hand-rolled
      headers (`SettingsSubScreen`, `PassageEditor` with its own `insets.top`,
      `AddressPicker` with a fixed `paddingTop: 50`) all replaced by `Header`, which is now
      the only caller of `useSafeAreaInsets`. A bare `<Header />` = the device margin and no
      bar, so home and the finish screen need no exception. All 21 screens + the one
      full-screen modal go through it. `Header.test.tsx` was found to be testing nothing —
      a bare `SafeAreaProvider` renders no children, so it had been snapshotting an empty
      tree — and is now 11 behavioural tests. FlatList scroll retuned around the search
      field above it. 0.2.1 → 0.2.2, 204 tests ✓. Reported: `__tests__` is covered by
      neither tsc nor eslint, which is why the dead test could never have failed.
- [x] **8.2.2** Modal purge — 2026-08-28 · all 18 modal surfaces audited against a rule
      this step wrote down (CODING_RULES §4): **screen** for anything list-like or
      scrolling, **anchored popup** for a one-tap toolbar choice, **dialog** for a
      question or a short text. Four moved. `ListScreen`'s filters became
      `FiltersScreen` (a stack screen — the filters live in app state, so nothing is
      handed back); its sort became the app's first `AnchoredPopup`, a new base
      component that hangs off the button, does **not** dim behind it (that omission is
      the difference from `MiniModal`, whose dim says "answer me first"), and closes on
      pick. The dev log viewer became `LogSettingsScreen`, which killed a self-feeding
      read effect on the way. The delete-account confirm stayed a dialog but lost the
      `width/height: 100%` that made it a screen in disguise. **`AddressPicker` is a
      recorded exception:** it is a screen by the rule, but its flow's back stack lives
      in its caller and would have to move into the navigator — a step of its own.
      13 new tests, no new l10n strings, 194 tests ✓. Two out-of-scope findings reported
      in `robotdiary.md`: the hand-rolled confirms in `PassageEditor` and `TestsScreen`
      that could be `ConfirmModal`, and the `AddressPicker` conversion.
- [x] **8.2.1d** Translation step moves *before* the address picker — 2026-08-28 · order
      is now translation → address → editor, because translations disagree on verse
      numbering. The two booleans (`isAPOpen` + a held `addressAwaitingTranslation`)
      became one `AddFlowStep` = `"closed" | "translation" | "address"`, so two steps
      can never be open at once, plus a `flowTranslationId` the flow carries to the
      editor. **The flow gained a real back stack:** the picker's back at the book list
      lands on the translation step instead of closing everything (and still closes it
      when that step was skipped) — the one behaviour change to walk on a device. The
      picker's own title/back walk (8.1.7 / 8.2.1a) is untouched: `AddressPicker.tsx`
      needed no change at all, the reorder is entirely in its caller.
      `getTranslationChoice` unchanged — `needsChoice` now picks the *opening* step.
      The 3 flow tests rewritten for the new order + 2 new back-stack tests (5 in
      `ListScreen.test.tsx`); no new files, no new l10n strings. 181 tests ✓.
- [x] **8.2.1c** "Study this one" — single-passage learning mode — 2026-08-27 · saving a
      **new** passage that has text now offers a drill on that passage alone
      (`ConfirmModal`, green confirm) → `SCREEN.test`; declining, or editing an existing
      passage, goes to the list as before. **Transient session, not a stored
      `TrainModeModel`:** a train mode is a filter over the library and cannot name a
      passage, so storing one would have cost a state version bump for a mode aimed at a
      passage the user will never reuse. New `generateStudyOneTests(state, passageId,
      repeats?)` + `ActionName.generateStudyOneTests`, which writes `testsActive` and
      nothing else — `activeTrainModeId`/`trainModesList` survive a drill untouched.
      `STUDY_ONE_REPEATS = 3`, deliberately ≤ `PERFECT_TESTS_TO_PROCEED` so one drill
      alone cannot hand out a level upgrade. 15 new tests (8 generator, 2 reducer, 5
      driving the real editor's Save in a new `__tests__/screens/PassageScreen.test.tsx`);
      3 new l10n keys (en+ua). 179 tests ✓. **The whole 8.2.1 group is closed.**
- [x] **8.2.1b** Translation selector inside the add-passage flow — 2026-08-27 · the
      translation is now met right after the address, **and only when the answer is
      not already clear** (Fedir's amendment): `getTranslationChoice(translations)`
      decides — more than one translation → a `SelectModal` between the address picker
      and the editor; one (or none) → it is chosen silently and the step never appears.
      In `PassageEditor` the `Select` moved from the bottom selector row to directly
      under the address, above the verse text it decides. New util + 9 tests (6 unit,
      3 driving the real add flow through the picker in a new
      `__tests__/screens/ListScreen.test.tsx`); new l10n key `SelectTranslationTitle`
      (en+ua). 164 tests ✓.
- [x] **8.2.1a** AddressPicker ground-up fix — 2026-08-27 · three defects in one file.
      (1) The header title now comes from `tempAddress` (NaN = unpicked) through a pure
      `getPickerTitle`, with a complete address handed to `addressToString` — the old
      `curPartIndex` source could never show the just-tapped start verse, because 8.1.7
      stops there on purpose. (2) The selected verse wears the app's gradient-outline
      idiom (`gradient1`→`gradient2` ring over `bgSecond`) instead of a flat
      `mainColor` fill. (3) The footer is a real horizontal row in the layout flow under
      a `flex:1` list, so the `height:"93%"` + absolute-footer combination that covered
      the last row of verses is gone. 5 new tests (title per pick step, range title, back,
      gradient ring, in-flow-footer snapshot); the two 8.1.7 footer tests still pass
      untouched. No new l10n strings. 155 tests ✓.
- [x] **8.2.1** Install `react-native-reanimated` — 2026-08-27 · reanimated `~4.1.1`
      (4.1.7) + `react-native-worklets` 0.5.1 at the SDK-54-pinned versions, both in
      `dependencies`. **No babel config change:** `babel-preset-expo` 54.0.11
      auto-applies `react-native-worklets/plugin` when the package is present. The
      trivial animation is `MiniModal`'s entrance (fade + spring rise), which upgrades
      every dialog in the app at once — 19 call sites — and replaces RN's platform
      `animationType="slide"`. New `ANIMATION` block in `constants.ts` is the single
      source of motion values for the rest of 0.3.0. Verified: lint ✓, 150 tests ✓,
      a full `expo export` Android bundle (1631 modules, no Metro/babel warnings) with
      `__workletHash` present in the Hermes bytecode, and `npm ci` exit 0.
      Version 0.2.0 → 0.2.1; **the build itself is Fedir's to trigger** (`build-dev`
      auto-submits to Play), and it is required — reanimated is a native module, so the
      animation cannot appear in an existing binary.
- [x] **8.1.18** 🏁 0.2.0 — minor bump, staging build, Play release — shipped.
- [x] **8.1.17** [api] Deploy session — shipped (assetlinks endpoint, `verifyMailer` +
      `ensureUsersTableColumns` deployed, deployed services off `nodemon`,
      `base.servise.ts` → `base.service.ts`).
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
