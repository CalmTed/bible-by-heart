# Coding Rules & Component Library

> Applies to both repos (mobile app + bbh-api). Read alongside `ARCHITECTURE.md`.
> When a rule and existing code disagree, the rule wins for NEW code; fixing old code
> happens in a step of its own, never opportunistically.
> Rules are written in the present tense and carry no history — what happened, and when,
> lives only in `robotdiary.md`.

---

## 0. The machine

- Windows, PowerShell. Both repos are developed and tested here, not on a Unix box.
- **There is no Python installed.** Not `python`, not `python3`, not `py` — nothing.
  Never reach for a throwaway Python script to inspect a file, transform data, or
  compute something; it fails on the spot and the attempt is pure noise. Use Node
  (`node -e`, a `.ts` script, a jest test) or the shell.
- **Never edit the docs with PowerShell text cmdlets** (`Set-Content`, `Add-Content`,
  `-replace` piped back to a file). They re-encode UTF-8 and turn every em dash and every
  Ukrainian string into mojibake. Use the editor/file tools, or Node with explicit utf8.
- **Diff a scripted bulk edit before believing it.** Copy the files first, run the script,
  then diff against the copy. A regex written for one shape reaches shapes you did not
  picture — a plan-ID pattern also matches a state version.

## 1. Language & types

- **TypeScript strict. `any` is banned** in new code (no `as any`, no implicit any).
  No `@ts-ignore` — fix the type instead. If a third-party type is broken, wrap it
  in one typed adapter function and contain the ugliness there.
- All code, comments, commit messages, docs: **English**. Ukrainian appears only as
  UI strings inside `src/l10n/ua.ts`.
- Every user-facing string goes through l10n (`t(...)`) and must be added to **both**
  `en.ts` and `ua.ts` in the same task. Never hardcode UI text.

## 2. Comments

- **A comment never cites a document.** No plan step IDs, no `§` section numbers, no
  `PLAN.md` / `STRATEGY.md` / `ARCHITECTURE.md` / `CODING_RULES.md` / `robotdiary.md`
  references, no dates. Docs are reorganized and steps are deleted when they are done, so
  a citation rots while the code it explains stays true.
- Say **what the code does and why it is shaped that way**, in the present tense. "The
  Pressable is inside the swipeable, so a tap on a revealed panel is not a row press" is
  worth writing; "8.2.4 moved it" is not. Where the reasoning is a mistake worth not
  repeating, describe the mistake without dating it: "it used to wrap the whole
  swipeable, which put the panels inside the row's press area".
- The same goes for test titles: they name behaviour, never a step.

## 3. File naming

- **Components & screens:** `PascalCase.tsx` — `Button.tsx`, `HomeScreen.tsx`.
- **Non-component modules (utils, services, config):** `camelCase.ts` —
  `address.ts`, `stateVersionConvert.ts`.
- One component per file, and **the file is named after its export, exactly** — no
  near-misses. Neither repo has an offender left; new files are born conventional. Never
  rename as a side effect of unrelated work, it pollutes the diff.
- **Tests are named after their subject, casing included:** `Button.tsx` →
  `Button.test.tsx`, `getStats.ts` → `getStats.test.ts`, and a snapshot file always
  moves with its test (`__snapshots__/Button.test.tsx.snap`). Jest resolves snapshots by
  test filename, so a stray `.snap` fails *silently* — after any test rename the check is
  "none written, none obsolete", not the pass count. A scenario test with no single
  subject is camelCase after the scenario — `e2e/flow.test.tsx`.

## 4. Reuse before create (strict)

- **Never create a new base UI component without checking the library below.**
  If an existing component almost fits — extend it (new prop/variant), don't fork it.
- Same for utils: check `src/utils/` before writing date/address/string helpers.
  **Address logic and passage-text logic each have exactly one home:**
  `utils/address.ts` (`Address.format` / `.parse` / `.equals` / `.distance` /
  `.order` / `.versesCount`) and `utils/passage.ts` (`Passage.getSentences` /
  `.joinSentences` / `.getRangeText` / `.getRangeDisplayText` / `.getContextBefore` /
  `.getContextAfter` / `.getWords` / `.sameWord` / `.getFirstWords` / `.getVersesCount` /
  `.countEnglishVerses` / `.foldTypeable` / `.typedEquals` / `.typedPrefixLength`).
  Extend the namespace; never start a `verseText.split(" ")` or a JSON.stringify
  address comparison of your own.
- **An address and a passage's text are asked, never re-derived.** The duplication this
  rule replaced was not a tidiness problem: the test generator counted a passage's
  sentences with one filter and stored a `sentenceRange`, the level component resolved it
  with another, and the two could disagree about which sentence index 2 is. Same for word
  indexes — the generator collapsed double spaces, the renderer did not. One definition
  each, and both sides call it.
- New shared component/util = update the library table below + `FILEMAP.md` in the
  same task.

## 5. Patterns to follow (mobile app)

- **State changes go through the reducer** (`src/utils/reduce.ts`) via typed actions.
  No component writes to storage directly.
- **Never show error counts to the user.** Errors are stored in history and used for
  scheduling and difficulty only.
- **Logging:** use `src/utils/logger.ts` — never `console.log/error` (two legacy
  `console.error` remain in `addZero.ts` and `aboutSettings.tsx`; kill on sight).
- **Errors:** critical paths (storage, reducer, rendering roots) wrap in try/catch
  and log; the user sees a translated toast (`toastShow.ts`) or Alert — translated.
- **Haptics/sound: call `feedback(settings, name)` and nothing else.**
  `utils/feedback.ts` reads `hapticsEnabled` itself, so no component imports `Vibration`
  or `VIBRATION_PATTERNS`. The hand-written
  `if (state.settings.hapticsEnabled) { Vibration.vibrate(...) }` appeared eleven times
  and **two of them had forgotten the check** — a setting that only holds where somebody
  remembered to read it is not a setting. A new buzz means a new named pattern in
  `VIBRATION_PATTERNS`, never a bare number at the call site.
- **Theme:** all colors come from the theme object (`getThemeFromScheme`), never
  hex literals in components.
- **Selected state is a gradient outline, not a flat fill.** The app's idiom for "this
  one is chosen" is a `gradient1`→`gradient2` ring (2px `padding` on a LinearGradient)
  over a `bgSecond` inner surface — what `Button type="outline"` draws. A solid
  `mainColor` background is not it.
- **Two surfaces, and a thing is exactly one of them.** Before reaching for a modal,
  decide what the surface actually is:
  · **Screen** — anything list-like, scrolling, or multi-section, i.e. anything the user
    *navigates into*. It gets a `SCREEN` member and `SettingsSubScreen` as its shell.
    A modal with a `ScrollView` in it, or one styled `width/height: 100%`, is a screen
    that has not been written yet.
  · **Dialog** (`MiniModal` / `ConfirmModal` / `SelectModal`) — a question, a
    confirmation, a short piece of text, or a short list of choices. It interrupts on
    purpose, so it dims, and it is as big as what it says and no bigger.
  There is deliberately no third, anchored surface. One existed for the passages-list
  sort menu and read as broken on a device: five options each centred at their own width,
  nothing dimmed behind it, and no visible control it appeared to come from. **A short
  list of choices is a dialog**; do not reintroduce an anchored one.
- **One `Header`, and the top margin is the device's.** Every screen and every
  full-screen surface draws `src/components/Header.tsx` — directly, or through
  `SettingsSubScreen` / `SettingsListWrapper` / `PassageEditor`. Never hand-roll a header
  row: a back `IconButton`, a `theme.headerText` title and an action button arranged in a
  `flexDirection: "row"` view **is** `Header`, and three copies of it is how the app ended
  up with three bar heights and two title typographies.
  · `title` + `onBack` + `right`, or `children` for a bar with no plain title (the
    training session's dots). `backIcon` only when the surface is *left* rather than
    returned from — the training session's cross.
  · **`Header` is the only place `useSafeAreaInsets` may be called.** The app is
    `edgeToEdgeEnabled`, so it draws under the status bar and cutout; a fixed number is
    a header behind the camera on one phone and floating on another. A screen must not
    add its own top padding, and `theme.screen` must not carry one either — it used to
    have a flat `paddingTop: 30` that every header screen wore *on top of* its real
    inset, which is exactly the bug this rule exists to prevent.
  · A screen with no bar of its own (home, the finish screen) still renders a bare
    `<Header />`. With nothing in it, it reserves the device inset and no bar — so
    "every screen goes through the Header" has no exceptions to remember.
  · A full-screen `<Modal>` needs `statusBarTranslucent`, or Android lays it out below
    the status bar and the inset is counted twice.
- **A scroll area under a `Header` takes `flex: 1`, never a percentage.** A
  `height: "100%"` (or `"93%"`) sibling of the Header is 100% of the *whole screen* laid
  out *below* the bar, so its bottom hangs off the device by the header's height and the
  last rows simply cannot be reached. Two screens had exactly that, and both had papered
  over it with a guessed `marginBottom`. Percentages cannot see the bar; flex can. And
  every scrolling surface ends with `contentContainerStyle={theme.theme.scrollContent}`
  (`LAYOUT.scrollBottomGap`), so the last row clears the screen edge identically
  everywhere.
- **One screen transition, not the platform's — but a direction per destination.**
  `utils/screenTransition.ts` exports `candyTransitions`, one preset per edge, and
  `candyTransition` (the `right` one) spread into the navigator's `screenOptions` as the
  default. Without any of it `@react-navigation/stack` picks a preset from
  `Platform.Version`, so the same app slides on one Android and zooms on another. Explicit
  `cardStyleInterpolator` / `transitionSpec` in options override the named preset, so
  nothing else has to change — but set `cardOverlayEnabled` rather than letting it
  default, which is `false` on iOS.
  · **A destination's edge is written once, and the gesture that asks for it runs the same
    way.** Settings lives to the left of home, the list to the right, practice above, stats
    below; `gestureDirection` decides both which edge a card enters from and which way its
    dismissal drags, so the pairing cannot come apart. Home's `HomeSwipe` reads the same
    four names. A screen that arrives from a new edge takes a preset from
    `candyTransitions`; it does not write its own interpolator.
  · **A vertical card's dismissal starts within `gestureResponseDistance` of the edge it
    came from, and the library's default is 135px** — deep enough to swallow the top of a
    scrolling list, so a drag meant to scroll pops the screen. The bar is the one band up
    there that never scrolls (`LAYOUT.headerHeight`). Where even that is not safe, the
    screen takes `gestureEnabled: false` instead: practice arrives from the top, so its
    dismissal would start in the answer block, and a mis-flicked answer must not throw a
    training session away. That surface is left through the cross in its header.
  · **`detachPreviousScreen: false` on a destination is a performance option, not a
    presentation one.** The stack detaches the screen under the top one, and a detached
    screen is also a *frozen* one — so popping back to it unfreezes it and runs its whole
    first render inside the pop animation, which is exactly when the JS thread has none to
    spare. The four screens home reaches all carry it, so home is already drawn when the
    card comes off it.
- **Animations:** react-native-reanimated + gesture-handler are the standard. No
  `Animated` from RN core in new code. **Never add the worklets/reanimated plugin to
  `babel.config.js`** — `babel-preset-expo` applies it automatically when the package is
  installed, and a manual entry double-applies it.
- **Press feedback belongs to `Button`, not to a screen.** Every button in the app is
  that one component, so its press spring is written once and reaches ~277 call sites — a
  screen that wants a springier button is a screen that should be using `Button`. Same
  leverage argument as MiniModal owning the dialog entrance.
- **A swipeable row's `Pressable` goes INSIDE the swipeable**, wrapping the row content
  and nothing else. Wrapping the whole `Swipeable` puts the action panels inside the
  row's press area, so a tap on the empty part of a revealed panel fires the row's
  `onPress`. And **an action closes the panel it was tapped in**
  (`swipeableMethods.close()`): every one of them rewrites its own label, so a panel left
  open is a button that has silently become its opposite.
- **A swipe action panel is a component, not an element** returned inline from
  `renderLeftActions`/`renderRightActions`. `ReanimatedSwipeable` *calls* those
  callbacks rather than rendering them, so a `useAnimatedStyle` written inside one is a
  hook in a plain function. `SwipeActionPanel` in `ListScreen.tsx` is the pattern —
  module level, so it is one component type for the whole list.
- **Every component is declared at module level — never inside another render.**
  A component defined during render is a *new component type* on every render, so React
  unmounts and remounts its whole subtree each time the parent re-renders: state inside
  it is lost, effects re-run, and any entrance animation restarts. `TestsScreen` had its
  dot row written that way (`const DottList = () => ...` in the render body, used as
  `<DottList />`), so the entire training-session header remounted on every answer. The
  `SwipeActionPanel` rule above is a special case of this one.
- **Nothing is submitted, dispatched or navigated from a render body.** A render must be
  free to run twice and produce the same tree. A redirect that ran during render once
  pushed Home on top of the finish screen and the user never saw their results; `Level3`
  answered a test *as correct* mid-render whenever its passage was missing. If a surface
  has to act on what it just found out, it acts in an effect. A test whose passage is gone
  renders nothing and lets `TestsScreen`'s focus-gated effect leave the session.
- **An effect that acts on app state keys on IDs, not on objects.**
  `state.passages.find(...)` hands back a new object identity every time the state is
  replaced, so `useEffect(..., [targetPassage])` re-fires on every unrelated state
  change. `[targetPassage?.id]` fires when the passage actually changed.
- **The training screen dispatches to a level through a `Record<TESTLEVEL, …>`**, not
  seven `test.l === TESTLEVEL.lXX && <LXX … />` lines. The Record is exhaustive over the
  enum, so adding a level is a type error until it is answered. The lookup is still read
  as possibly-missing: a stored test carrying a level this build does not know must render
  an empty session the cross can leave, not throw into the `ErrorBoundary`.
- **The app is one column, and on a wide screen it stops.** `LAYOUT.maxContentWidth`
  in `constants.ts` is where content stops growing on a foldable or tablet; a surface
  that would otherwise stretch a verse across the whole panel caps at it rather than
  picking its own number. Bars span (the `Header`), columns do not.
- **A surface that arrives is wrapped in `Entrance`, not hand-animated.** The fade + rise
  is written once there, so everything that enters the app enters at the same speed with
  the same overshoot. `replayKey` replays it when a surface swaps its *content* without
  unmounting (the training session moving to the next test); `delayMs` staggers it behind
  something already moving. Only `Header` rolls its own — the animated view there *is* the
  bar, with its own inset and layout, so wrapping it would add a node under all eleven of
  its tests for no motion that differs.
- **Motion values come from `ANIMATION` in `constants.ts`, never inline numbers.**
  Duration, spring config, rise distance and start scale live there so every animated
  surface springs identically; per-component magic numbers are what make an animated app
  feel assembled rather than designed. Same principle as colors coming from the theme.
  Gesture geometry lives there too (`swipeThreshold`, `pullTrigger`, `pullMax`): how far a
  finger must travel before it means something is the same kind of number, and the second
  surface that takes a swipe has to feel like the first.
- **A gesture that acts asks more of the finger than one that navigates.** Three of home's
  four swipes open a screen and cost `ANIMATION.swipeThreshold`; the fourth *generates a
  training session*, so it costs `ANIMATION.pullTrigger` and draws a pull-to-reload arrow
  while it is being pulled. A destructive or committing gesture with the same trigger
  distance as a navigating one is a gesture the user falls into.
- **A swipe never picks something the button would have asked about.** Home's pull calls
  the same `startPractice` the Practice button does, and with more than one train mode
  enabled that still opens the picker. A gesture is a shortcut to the *question*, never an
  answer to it on the user's behalf.
- **A train mode is a filter, not a target.** `TrainModeModel` selects a *slice* of the
  library (translation, tags, sort, length) and cannot name a passage. So a mode that
  trains specific passages is not a stored train mode — it is a generator plus a reducer
  action that writes `testsActive` and nothing else. `generateStudyOneTests` is the
  pattern: it leaves `activeTrainModeId` and `trainModesList` untouched, so a drill can
  never quietly rewrite the user's practice setup the way `ActionName.generateTests`
  deliberately does. Adding a mode this way costs no state version bump.
- **A level screen is three blocks, out of one stylesheet.** `levels/levelLayout.ts` is
  the arrangement every level component fills: **prompt** (what the test gives you —
  content-sized, never `flex: 1`, scrolling when the passage is long), **answer** (what it
  asks of you — takes everything the prompt did not, which is what keeps an empty band out
  of the middle of the screen), **action** (what finishes it — pinned to the bottom,
  stretched to the column, the same place on all seven components). It is a **stylesheet,
  not a wrapper**: one file per level keeps them small enough to hold their own
  arrangement, and a wrapper would have to take the three blocks as props to do the same
  job.
- **A test that offers options offers `MIN_TEST_OPTIONS` of them, or it is not that
  level.** One option cannot be got wrong and is still recorded as a pass, which is what
  the level-up maths counts. Levels whose options are other *passages* (l11, l21) can only
  draw decoys from the library, so `canOfferPassageOptions` counts them **inside the
  target's own translation** — the pool they actually come from — and below the minimum
  each falls back to the half of its own level that asks about the **address** (l10
  synthesizes decoys from the address space, l20 asks in the picker). Skipping
  substitutes, never removes: a session never loses a test, it only changes which half of
  the level it asks.
- **A generator stamps the level it wrote, never inherits it.** `createL10Test` returns
  `l: TESTLEVEL.l10` whatever it was called with, because it is also L11's fallback and a
  test labelled l11 carrying l10 payload renders an address and nothing under it.
- **What the user typed is compared through `Passage.typedEquals`, never with `===`.**
  Level 5 grades character by character, so a character the phone keyboard cannot produce
  makes a passage unlearnable: the user types the only thing they can type and is told
  they are wrong, forever. The curly apostrophe, the em dash, the guillemets, the nbsp and
  the Cyrillic letters drawn exactly like Latin ones are all in real passages today —
  `sanitizeSharedText` folds them on the way IN and the API folds them at the source, but
  **neither reaches a passage already sitting in somebody's state, and nothing may rewrite
  their text behind their back**. So the tolerance lives on the comparison, in one place.
  · It is **equality, not resemblance** — the same line `sameWord` draws. A misspelling
    is still wrong, and two different Ukrainian letters are never folded onto each
    other. Widening this to "close enough" would delete the level.
  · The fold is **strictly 1:1**, because `typedPrefixLength` maps an index in the
    folded text back to an index in the real one. A mapping that changes the length (the
    ellipsis → three dots) belongs in the ignored punctuation instead.
  · A new equivalence is a new row in `TYPING_EQUIVALENTS` **plus its own test** — the
    suite is one `it` per pair, asserted in both directions.
- **State model changes:** bump version + write a converter in `stateVersionConvert.ts`
  + update `initials.ts` + the prompt-backup flow. All four or nothing.
- **Navigation is typed.** A screen's props are `ScreenPropsModel<SCREEN.x>`
  (from `models.ts`), never a hand-rolled `{ route: any }`. A new screen means: a
  `SCREEN` member, a line in `RootStackParamList`, and a `Stack.Screen` — the param
  list is what makes the first two impossible to forget. Params carry small
  identifying args only; app state lives in AppContext.
- **The boot path never overwrites state it could not read.** `bootBackup.loadStoredState`
  classifies a read as found / empty / failed; only "empty" (a `NotFoundError`) may be
  followed by a write. Anything else goes to `EmergencyScreen` with storage untouched.
- **A forced logout resets through a functional updater, never a captured snapshot.**
  `fetchAPI` is awaited, so any state handed to it is stale by the time it runs, and
  writing it back rolls the whole app one step backwards — that is what made a language
  change undo itself. The only whole-object writes left are the backup restores, where the
  object came out of a file rather than off a closure.

## 6. Patterns to follow (bbh-api)

- Flow: route → `validateResource(zodSchema)` → controller → service → db.
  Controllers stay thin; logic lives in services.
- All input validated with zod schemas in `src/schema/`.
- Data access only through the service layer (keeps sqlite swappable).
- Log with pino (`utils/logger.ts`); never leak secrets/tokens into logs.
- **No test opens a socket.** `jest.setup.ts` mocks nodemailer globally and replaces
  `global.fetch` with one that throws the URL back at you; a suite that needs the real
  behaviour injects its own transport or fetch and restores it. Anything new that talks to
  the outside world gets the same treatment — a test that fails because someone's
  credentials expired is not testing the code.
- Auth: `requireUser` middleware; JWT utils in `utils/jwt.ts`.
- **Per-environment values come from the env file, never the repo** — `.staging.env` /
  `.production.env` are untracked and have never been tracked, which is the only reason
  the VPS deploy's `git reset --hard` cannot eat them. Read them *inside* the handler,
  not at module load, so a value is testable and a container restart is enough to change
  it (`ANDROID_CERT_FINGERPRINTS` in `routes.ts` is the pattern).
- **Those env files are single-file bind mounts**, which bind the *inode*: any edit that
  replaces the file (`sed -i`, `mv`, an editor's write-then-rename) silently detaches the
  mount and the container keeps serving the old content. Append in place, and check
  `tail -c1` first — neither file is guaranteed to end in a newline.
- **The deployed containers run plain `node`**, not `nodemon` — a built image has no
  source to watch and Docker's restart policy is the supervisor. Only the `local`
  compose service, which bind-mounts the source, keeps a watcher.
- **Served passage text is normalized once, at the API**: fold → drop the editorial
  apparatus → per-language whitelist. A character outside the whitelist is **reported with
  its book/chapter/verse, never stripped quietly** — that is what surfaced OCR homoglyphs
  a blacklist would have shipped forever.

## 7. Testing & verification (win conditions)

Every task is done only when:

1. `npm run lint` passes (tsc + eslint) in the touched repo.
2. `npm test` passes; new logic gets tests (utils and reducer changes ALWAYS get tests).
3. `docs/FILEMAP.md` is updated if files were added, removed or repurposed.
4. `docs/robotdiary.md` got its dated entry — **both blocks**, ≤300 characters each: what
   was done, and the friction (AI errors, misreadings, redos, round trips; `none` when the
   session was clean). The friction block is not optional and is not padding: it is the
   only record of how these sessions go wrong, and the failure list at the top of that
   file is built from it.
5. UI strings exist in both `en.ts` and `ua.ts`.

Manual on-phone testing is Fedir's, at version milestones, not per task — but SAY in the
diary entry what needs verifying on a device.

**What a test can and cannot prove here:**

- **An animation:** jest can prove the worklet *executes* — read the host node's
  `jestAnimatedStyle.value` and assert the first frame (see `MiniModal.test.tsx`). It
  cannot prove *progression*: jest-expo's mock never advances frames, so
  `advanceAnimationByTime` is a no-op. Travel and feel are the device's answer, which is
  why every wrapper step ends with a build.
- **A gesture:** `react-native-gesture-handler/jest-utils` can drive one
  (`fireGestureHandler` + `getByGestureTestId`, which needs a `.withTestId(...)`, since a
  gesture is not a node in the tree). What it cannot do is run it on the UI thread — so
  **await the drag**: the handler is a worklet and `runOnJS` hands the call back to the JS
  thread, which means a synchronous assertion right after the release always sees zero
  calls.
- **A structural refactor:** unchanged snapshots are the proof. A context provider emits
  no host node, so a purely structural migration must leave the rendered tree
  byte-identical.
- **`tsc` does not see `__tests__/`** (tsconfig's `include` misses it) and eslint only
  runs over `./src/`. A green suite is not a green tree: a test can assert against props
  that do not exist, and a call with the wrong number of arguments passes.

## 8. Component library (mobile)

Reuse these. Extend, don't duplicate.

> **No component takes `theme` or `t` as a prop.** Every component reads them via
> `useAppContext()`. New components MUST do the same — never reintroduce a `theme`
> or `t` prop, and never prop-drill them to a child. Consequence for tests: anything
> rendering app UI goes through `test-utils/renderWithContext.tsx`, because
> `useAppContext()` throws without a provider. The single exception is
> `EmergencyScreen.tsx` (the crash screen), which renders outside the provider by
> design and therefore stays on raw `react-native` primitives with hardcoded
> bilingual strings.

| Component | File | What it is / key props |
|---|---|---|
| Text | `src/components/Text.tsx` | themed `<Text>` — defaults to the primary text color; `color` selects a semantic color (`text`/`textSecond`/`textDanger`/`mainColor`); caller `style` overrides. Use instead of RN `<Text>` |
| Button | `src/components/Button.tsx` | the app's button (title, onPress, disabled, style variants) **and its press feedback**: it sinks to `ANIMATION.pressScale` on press-in and springs back on the shared `ANIMATION.spring`. A disabled `Pressable` never fires those, so a dead button never moves. Not attached at all on a gradient button: expo-linear-gradient bakes its ramp at layout size, so scaling one stretches the ramp and the button visibly drops out mid-press |
| IconButton/Icon | `src/components/Icon.tsx` + `iconData.ts` | SVG icon set by name |
| Input | `src/components/Input.tsx` | themed text input. `grow` puts `flex: 1` on the input's own two outer views, so it fills the height its parent gives it — `wrapperStyle` reaches the gradient *inside* those views and grows nothing, which is why the levels where typing IS the answer (L40, L50) need it |
| Checkbox | `src/components/Checkbox.tsx` | themed checkbox row |
| Select | `src/components/Select.tsx` | dropdown-style selector |
| SelectModal | `src/components/SelectModal.tsx` | modal list picker — the app's answer to any short list of choices |
| Entrance | `src/components/Entrance.tsx` | the app's shared arrival, as a wrapper. Fades on a timing and rises `ANIMATION.riseDistance` on the shared spring; deliberately **no** scale (MiniModal's card grows out of a dimmed screen; a full-width block of text scaling up reads as the page zooming). `replayKey` replays it when the wrapped content changes without unmounting; `delayMs` staggers it behind something already in motion. Shared values reset to 0 before every run: `withTiming(1)` from a value already at 1 is not an animation, so a replay without the reset silently does nothing |
| MiniModal | `src/components/MiniModal.tsx` | the app's animated dialog surface and the base of every dialog: backdrop fades on a timing, the card springs up from `ANIMATION.riseDistance`/`riseScale`, and RN's platform `animationType` is `"none"` because the entrance is ours. Animate a dialog by going through MiniModal, not by hand-rolling one. Shared values reset on close — RN's `<Modal>` unmounts its children but MiniModal itself stays mounted, so without the reset a reopen would start already finished |
| ConfirmModal | `src/components/ConfirmModal.tsx` | reusable confirmation (text + cancel/confirm; `confirmColor` defaults red) — use before any delete or irreversible action |
| ErrorBoundary | `src/components/ErrorBoundary.tsx` | the only thing that catches a render error thrown by a child (a `try/catch` around a parent's `return` never will). `renderFallback(error, reset)`; `reset()` clears the caught error, so recovery UI calls it **after** putting a usable state back. Dependency-free on purpose — no context, no themed components — so it survives a broken theme/l10n |
| EmergencyScreen | `src/components/EmergencyScreen.tsx` | the last-resort recovery UI (restore from either backup slot, dump state, ask for help, erase). Rendered by `App.tsx` from two places: the `ErrorBoundary` fallback and a **failed** state read on boot. Renders outside `AppProvider` by design → raw RN primitives + hardcoded bilingual strings |
| BackupRestoreModal | `src/components/BackupRestoreModal.tsx` | the one place "restore this backup?" is asked, shared by the settings row and by a backup opened from outside the app. Takes the decoded-but-NOT-applied `ParsedBackupModel`; says what would **change** (the file's date, then each count as `now → after`), because "12 passages" never told the user they currently have 40 |
| BackupFileOpener | `src/components/BackupFileOpener.tsx` | no UI of its own: it listens for the `content://` / `file://` URI Android hands over when a `.bbhbackup` file is opened (cold start via `getInitialURL`, running app via the `url` event), decodes it and shows `BackupRestoreModal`. Rendered **inside** `AppProvider`, because restoring writes the state the provider owns |
| BackupOfferModal | `src/components/BackupOfferModal.tsx` | the one-shot post-upgrade "save a backup file?" offer. Shown only on a boot that converted a state, dismissible and never blocking |
| Header | `src/components/Header.tsx` | **the** app header — `title`/`onBack`/`backIcon`/`right`/`children`; falls into place from the top edge behind the screen transition; the only caller of `useSafeAreaInsets`, and bare (`<Header />`) it is just the device's top margin. Exports `HEADER_HEIGHT` |
| HomeSwipe | `src/components/HomeSwipe.tsx` | home's four swipes, as a wrapper round the home column. `onSwipe(direction)` + `available` (the directions that currently lead somewhere; a swipe toward one that does not fires nothing, and "down" also decides whether the pull arrow exists). One `Gesture.Pan`, dominant axis wins, `ANIMATION.swipeThreshold` for the three that navigate and the longer `ANIMATION.pullTrigger` for the pull that starts a session |
| AddressPicker | `src/components/AddressPicker.tsx` | Bible address (book/chapter/verse) picker. The header title is derived from `tempAddress` (NaN = unpicked) and a complete address goes to `Address.format` — never from which part is being *edited*; the selected verse wears the gradient-outline idiom; the single-verse footer is a real row in the layout flow, so it cannot cover the last row of verses. `confirmTitle` names what the primary button does, because a level screen opens the same picker to ANSWER a test |
| LevelPicker | `src/components/LevelPicker.tsx` | passage level selector with dots |
| PassageEditor | `src/components/PassageEditor.tsx` | full passage add/edit UI. The translation `Select` sits directly under the address and above the verse text it decides; whether text can be fetched is asked of the catalogue (shipped copy first, live one when it answers) instead of a hardcoded id list, and a failed fetch says so once and leaves the field to type in |
| DotIndicator | `src/components/DotIndicator.tsx` | progress dots |
| TestNavDot | `src/components/TestNavDot.tsx` | per-test navigation dot in a session; the `Pressable` **is** the dot, so the gradient resolves against a view with a size |
| WeekActivity | `src/components/WeekActivity.tsx` | weekly activity graph |
| SettingsMenuItem | `src/components/SettingsMenuItem.tsx` | settings row (label/action/checkbox/select/textinput/taglist) |
| SettingsSubScreen | `src/components/SettingsSubScreen.tsx` | shared shell (View + Header w/ back + StatusBar) for every drilled-into screen, settings or not; optional `headerRight` |
| SettingsListWrapper | `src/components/SettingsListWrapper.tsx` | reusable editable-list screen body (translations/reminders/train-modes); non-modal — list and per-item editor are two views toggled by local state |
| Level test screens | `src/components/levels/L10..L50.tsx` | one component per test level, one file per component, named after it exactly. Props: `LevelComponentModel` from `models.ts`. Verse text comes from `Passage`, addresses from `Address` |
| levelLayout | `src/components/levels/levelLayout.ts` | the shared level arrangement as a stylesheet (`screen` / `prompt` / `answer` / `action`, plus the column's one gutter). Not a component: see the rule in §5 |
| SentenceContext | `src/components/levels/SentenceContext.tsx` | the sentences either side of the stretch being typed (L40, L50). `side="before"` ends with an ellipsis, `side="after"` starts with one, and the far end only gets one when there is more passage than is shown; nothing renders when the test has no sentence range |
| NoOptions | `src/components/levels/NoOptions.tsx` | what a level renders when its generator handed it no options. Deliberately no skip button — a "passed" test nobody answered corrupts the level-up maths |

Key utils (check before writing a helper): `Address` (`address.ts`),
`Passage` (`passage.ts`), `formatDateTime`, `secondsToString`, `addZero`, `randomizers`,
`getSimularity`, `getStats`, `getPerfectTests`, `levelsConvertion`, `toastShow`,
`notifications`, `fileManager`, `handlePassageExport`, `bootBackup`, `backupFile`,
`getTranslationChoice`, `sanitizeSharedText`, `parseSharedPassage`, `translation`,
`generateStudyOneTests`, `feedback`, `screenTransition`.

> **Backups have exactly two owners.** `bootBackup.ts` = copies inside storage (the
> write-once pre-conversion snapshot + the version-tolerant restore). `backupFile.ts`
> = copies in a file the user owns (serialize/parse the envelope + the shared export /
> import IO). Anything that reads or writes app data as a file goes through
> `backupFile`; never hand-roll `JSON.stringify(state)` + `writeFile` again.

## 9. Git & workflow

- Small, self-contained commits; the message says what and why. Broken-in-between states
  are acceptable during a multi-task refactor, but say so in the diary.
- **Never commit or push.** Fedir reviews the whole diff and commits it himself.
- `production` is the main branch; feature work may go via `staging`.
- Never commit secrets (`.env` files in bbh-api are local/VPS only).
- **Never edit `projectdiary.md`** (or bbh-api's `codingdiary.md`) — those are
  Fedir's personal diaries. The AI diary is `docs/robotdiary.md`.
