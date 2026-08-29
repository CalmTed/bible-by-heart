# Coding Rules & Component Library

> Applies to both repos (mobile app + bbh-api). Read alongside `ARCHITECTURE.md`.
> When a rule and existing code disagree, the rule wins for NEW code; renaming/fixing
> old code happens via the refactor tasks in `STRATEGY.md`, not opportunistically.

---

## 0. The machine

- Windows, PowerShell. Both repos are developed and tested here, not on a Unix box.
- **There is no Python installed.** Not `python`, not `python3`, not `py` — nothing.
  Never reach for a throwaway Python script to inspect a file, transform data, or
  compute something; it fails on the spot and the attempt is pure noise. Use Node
  (`node -e`, a `.ts` script, a jest test) or the shell.
- **Never edit these docs with PowerShell text cmdlets** (`Set-Content`,
  `Add-Content`, `-replace` piped back to a file). They re-encode UTF-8 and turn
  every em dash and every Ukrainian string in the file into mojibake. Edit them with
  the editor/file tools.

## 1. Language & types

- **TypeScript strict. `any` is banned** in new code (no `as any`, no implicit any).
  No `@ts-ignore` — fix the type instead. If a third-party type is broken, wrap it
  in one typed adapter function and contain the ugliness there.
- All code, comments, commit messages, docs: **English**. Ukrainian appears only as
  UI strings inside `src/l10n/ua.ts`.
- Every user-facing string goes through l10n (`t(...)`) and must be added to **both**
  `en.ts` and `ua.ts` in the same task. Never hardcode UI text.

## 2. File naming (target convention)

- **Components & screens:** `PascalCase.tsx` — `Button.tsx`, `HomeScreen.tsx`.
- **Non-component modules (utils, services, config):** `camelCase.ts` —
  `address.ts`, `stateVersionConvert.ts`.
- **The app repo has no offenders left** — 8.1.15 (2026-08-26) renamed the last of them
  (9 screens, `miniModal`, `setttingsMenuItem`, `testNevDott`, `settingsListWrapper`,
  `weekActivityComponent`, `icondata`), and 8.1.17 (2026-08-26) closed the last one in
  bbh-api: `base.servise.ts` → `base.service.ts`, 7 import sites. **Neither repo has an
  offender left.** New files are born conventional; never rename as a side effect of
  unrelated work, it pollutes diffs.
- One component per file; **the file is named after its export, exactly** — no
  near-misses. 8.1.15a (2026-08-26) closed the last two: `TestNavDott` → `TestNavDot`,
  `WeekActivityComponent` → `WeekActivity`.
- **Tests are named after their subject, casing included:** `Button.tsx` →
  `Button.test.tsx`, `getStats.ts` → `getStats.test.ts`, and a snapshot file always
  moves with its test (`__snapshots__/Button.test.tsx.snap`). A scenario test with no
  single subject is camelCase after the scenario — `e2e/flow.test.tsx`.

## 3. Reuse before create (strict)

- **Never create a new base UI component without checking the library below.**
  If an existing component almost fits — extend it (new prop/variant), don't fork it.
- Same for utils: check `src/utils/` before writing date/address/string helpers.
  **Address logic and passage-text logic each have exactly one home** (8.2.6):
  `utils/address.ts` (`Address.format` / `.parse` / `.equals` / `.distance` /
  `.order` / `.versesCount`) and `utils/passage.ts` (`Passage.getSentences` /
  `.joinSentences` / `.getRangeText` / `.getRangeDisplayText` / `.getContextBefore` /
  `.getContextAfter` / `.getWords` / `.sameWord` / `.getFirstWords` / `.getVersesCount` /
  `.countEnglishVerses` / `.foldTypeable` / `.typedEquals` / `.typedPrefixLength`).
  Extend the namespace; never start a `verseText.split(" ")` or a JSON.stringify
  address comparison of your own.
- New shared component/util = update the library table below + `FILEMAP.md` in the
  same task.

## 4. Patterns to follow (mobile app)

- **State changes go through the reducer** (`src/utils/reduce.ts`) via typed actions.
  No component writes to storage directly.
- **Never show error counts to the user** (see ARCHITECTURE §2.2). Errors are stored
  in history and used for scheduling/difficulty only.
- **Logging:** use `src/utils/logger.ts` — never `console.log/error` (two legacy
  `console.error` remain in `addZero.ts` and `aboutSettings.tsx`; kill on sight).
- **Errors:** critical paths (storage, reducer, rendering roots) wrap in try/catch
  and log; user sees a translated toast (`toastShow.ts`) or Alert — translated.
- **Haptics/sound: call `feedback(settings, name)` and nothing else (8.2.8).**
  `utils/feedback.ts` reads `hapticsEnabled` itself, so no component imports
  `Vibration` or `VIBRATION_PATTERNS` any more. The hand-written
  `if (state.settings.hapticsEnabled) { Vibration.vibrate(...) }` appeared eleven times
  and **two of them had forgotten the check** — a setting that only holds where somebody
  remembered to read it is not a setting. A new buzz means a new named pattern in
  `VIBRATION_PATTERNS`, never a bare number at the call site. Sound will be wired in the
  same one function when there is a player.
- **Theme:** all colors come from the theme object (`getThemeFromScheme`), never
  hex literals in components.
- **Selected state is a gradient outline, not a flat fill.** The app's idiom for "this
  one is chosen" is a `gradient1`→`gradient2` ring (2px `padding` on a LinearGradient)
  over a `bgSecond` inner surface — what `Button type="outline"` draws. A solid
  `mainColor` background is not it; 8.2.1a removed the last one (`AddressPicker`).
- **Two surfaces, and which one a thing is (8.2.2, narrowed by 8.2.37).** Before reaching
  for a modal, decide what the surface actually is:
  · **Screen** — anything list-like, scrolling, or multi-section, i.e. anything the user
    *navigates into*. It gets a `SCREEN` member and `SettingsSubScreen` as its shell.
    A modal with a `ScrollView` in it, or one styled `width/height: 100%`, is a screen
    that has not been written yet.
  · **Dialog** (`MiniModal` / `ConfirmModal` / `SelectModal`) — a question, a
    confirmation, a short piece of text, or a short list of choices. It interrupts on
    purpose, so it dims, and it is as big as what it says and no bigger.
  8.2.2 had a third — an `AnchoredPopup` hanging off the control that opened it, with no
  dim. One surface ever used it (the passages-list sort menu) and on a device it read as
  broken: five options each centred at their own width, nothing dimmed behind it, and no
  visible control it appeared to come from. 8.2.37 made it a `SelectModal` and deleted the
  component. **A short list of choices is a dialog**; do not reintroduce an anchored one.
- **One `Header`, and the top margin is the device's (8.2.3).** Every screen and every
  full-screen surface draws `src/components/Header.tsx` — directly, or through
  `SettingsSubScreen` / `SettingsListWrapper` / `PassageEditor`. Never hand-roll a
  header row: a back `IconButton`, a `theme.headerText` title and an action button
  arranged in a `flexDirection: "row"` view **is** `Header`, and three copies of it is
  how the app ended up with three different bar heights and two different title
  typographies.
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
    the status bar and the inset is counted twice (same reason `AnchoredPopup` needs it).
- **A scroll area under a `Header` takes `flex: 1`, never a percentage (8.2.27).** A
  `height: "100%"` (or `"93%"`) sibling of the Header is 100% of the *whole screen* laid
  out *below* the bar, so its bottom hangs off the device by the header's height and the
  last rows of the list simply cannot be reached. Two screens had exactly that — the
  passage editor (level-5 stats were cut at "Level 5" plus one row) and the calendar's
  day view — and both had papered over it with a guessed `marginBottom`. Percentages
  cannot see the bar; flex can. And every scrolling surface ends with
  `contentContainerStyle={theme.theme.scrollContent}` (`LAYOUT.scrollBottomGap`), so the
  last row clears the screen edge instead of ending flush against it, identically
  everywhere.

- **One screen transition, not the platform's (8.2.3) — but a direction per destination
  (8.2.28).** `utils/screenTransition.ts` exports `candyTransitions`, one preset per edge,
  and `candyTransition` (the `right` one) spread into the navigator's `screenOptions` as
  the default. Without any of it `@react-navigation/stack` picks a preset from
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
- **Animations (new UI work):** react-native-reanimated + gesture-handler are the
  standard. No `Animated` from RN core in new code. Installed in 8.2.1 (reanimated 4 +
  `react-native-worklets`); **never add the worklets/reanimated plugin to
  `babel.config.js`** — `babel-preset-expo` applies it automatically when the package is
  installed, and a manual entry double-applies it.
- **Press feedback belongs to `Button`, not to a screen (8.2.4).** Every button in the
  app is that one component, so its press spring is written once and reaches ~277 call
  sites — a screen that wants a springier button is a screen that should be using
  `Button`. Same leverage argument as MiniModal owning the dialog entrance (8.2.1).
- **A swipeable row's `Pressable` goes INSIDE the swipeable**, wrapping the row content
  and nothing else. Wrapping the whole `Swipeable` puts the action panels inside the
  row's press area, so a tap on the empty part of a revealed panel fires the row's
  `onPress` — 8.2.4 found exactly that in the passage list. And **an action closes the
  panel it was tapped in** (`swipeableMethods.close()`): every one of them rewrites its
  own label, so a panel left open is a button that has silently become its opposite.
- **A swipe action panel is a component, not an element** returned inline from
  `renderLeftActions`/`renderRightActions`. `ReanimatedSwipeable` *calls* those
  callbacks rather than rendering them, so a `useAnimatedStyle` written inside one is a
  hook in a plain function. `SwipeActionPanel` in `ListScreen.tsx` is the pattern —
  module level, so it is one component type for the whole list.
- **Every component is declared at module level — never inside another render (8.2.5).**
  A component defined during render is a *new component type* on every render, so React
  unmounts and remounts its whole subtree each time the parent re-renders: state inside
  it is lost, effects re-run, and any entrance animation restarts. `TestsScreen` had its
  dot row written that way (`const DottList = () => ...` in the render body, used as
  `<DottList />`), so the entire training-session header remounted on every answer. It is
  `TestNavBar` at module level now. This is the general rule the `SwipeActionPanel` one
  above is a special case of.
- **Nothing is submitted, dispatched or navigated from a render body (8.2.5).** A render
  must be free to run twice and produce the same tree. `TestsScreen` learned this the
  hard way in 2026-07 — a redirect that ran during render pushed Home on top of the
  finish screen and the user never saw their results — and `Level3` was still doing it
  as late as 8.2.5, answering a test *as correct* mid-render whenever its passage was
  missing. If a surface has to act on what it just found out, it acts in an effect. A
  test whose passage is gone renders nothing and lets `TestsScreen`'s focus-gated effect
  leave the session; every level component now does exactly that.
- **An effect that acts on app state keys on IDs, not on objects (8.2.5).**
  `state.passages.find(...)` hands back a new object identity every time the state is
  replaced, so `useEffect(..., [targetPassage])` re-fires on every unrelated state
  change. `[targetPassage?.id]` fires when the passage actually changed.
- **The training screen dispatches to a level through a `Record<TESTLEVEL, …>` (8.2.5)**,
  not seven `test.l === TESTLEVEL.lXX && <LXX … />` lines. The Record is exhaustive over
  the enum, so adding a level is a type error until it is answered. The lookup is still
  read as possibly-missing: a stored test carrying a level this build does not know must
  render an empty session the cross can leave, not throw into the `ErrorBoundary`.
- **The app is one column, and on a wide screen it stops (8.2.4).** `LAYOUT.maxContentWidth`
  in `constants.ts` is where content stops growing on a foldable or tablet; a surface
  that would otherwise stretch a verse across the whole panel caps at it rather than
  picking its own number. Bars span (the `Header`), columns do not.
- **A surface that arrives is wrapped in `Entrance`, not hand-animated (8.2.5).** The
  fade + rise is written once there, so everything that enters the app enters at the
  same speed with the same overshoot. `replayKey` replays it when a surface swaps its
  *content* without unmounting (the training session moving to the next test);
  `delayMs` staggers it behind something already moving. Only `Header` still rolls its
  own — the animated view there *is* the bar, with its own inset and layout, so wrapping
  it would add a node under all eleven of its tests for no motion that differs.
- **Motion values come from `ANIMATION` in `constants.ts`, never inline numbers.**
  Duration, spring config, rise distance and start scale live there so every animated
  surface springs identically; per-component magic numbers are what make an animated app
  feel assembled rather than designed. Same principle as colors coming from the theme.
  Gesture geometry joined it in 8.2.28 (`swipeThreshold`, `pullTrigger`, `pullMax`): how
  far a finger must travel before it means something is the same kind of number, and the
  second surface that takes a swipe has to feel like the first.
- **A gesture that acts asks more of the finger than one that navigates (8.2.28).** Three
  of home's four swipes open a screen and cost `ANIMATION.swipeThreshold`; the fourth
  *generates a training session*, so it costs `ANIMATION.pullTrigger` and draws a
  pull-to-reload arrow while it is being pulled. A destructive or committing gesture with
  the same trigger distance as a navigating one is a gesture the user falls into.
- **A swipe never picks something the button would have asked about.** Home's pull calls
  the same `startPractice` the Practice button does, and with more than one train mode
  enabled that still opens the picker. A gesture is a shortcut to the *question*, never an
  answer to it on the user's behalf.
- **What jest can and cannot prove about a gesture (8.2.28).** It can drive one:
  `react-native-gesture-handler/jest-utils` (`fireGestureHandler` + `getByGestureTestId`,
  which needs a `.withTestId(...)` on the gesture, since a gesture is not a node in the
  tree). What it cannot do is run it on the UI thread — so **await the drag**: the handler
  is a worklet and `runOnJS` hands the call back to the JS thread, which means a
  synchronous assertion right after the release always sees zero calls. Whether the
  gesture feels right is still the device's answer, which is why 8.2.28 is `(build)`.
- **What jest can and cannot prove about an animation.** It can prove the worklet
  *executes* — read the host node's `jestAnimatedStyle.value` and assert the first frame
  (see `MiniModal.test.tsx`). It cannot prove *progression*: jest-expo's mock never
  advances frames, so `advanceAnimationByTime` is a no-op. Travel and feel are verified
  on a device by the build the step ends with — which is why every wrapper step is
  tagged `(build)`.
- **A train mode is a filter, not a target.** `TrainModeModel` selects a *slice* of the
  library (translation, tags, sort, length) and can't name a passage. So a mode that
  trains specific passages is not a stored train mode — it is a generator plus a reducer
  action that writes `testsActive` and nothing else. `generateStudyOneTests` (8.2.1c) is
  the pattern: it leaves `activeTrainModeId` and `trainModesList` untouched, so a drill
  can never quietly rewrite the user's practice setup the way
  `ActionName.generateTests` deliberately does. Adding a mode this way costs no state
  version bump.
- **A level screen is three blocks, out of one stylesheet (8.2.35).** `levels/levelLayout.ts`
  is the arrangement every level component fills: **prompt** (what the test gives you -
  content-sized, never `flex: 1`, scrolling when the passage is long), **answer** (what it
  asks of you - takes everything the prompt did not, which is what keeps an empty band out
  of the middle of the screen), **action** (what finishes it - pinned to the bottom,
  stretched to the column, the same place on all seven components). The five screens each
  solved this privately before and agreed on none of it: level 2's SUBMIT sat at ~75% of the
  height with a third of the screen empty above it, level 5 fitted everything into the top
  45%, the action button was centred on one and left-aligned on the next, and the verse box
  was a third of the screen tall whether it held one line or ten. It is a **stylesheet, not a
  wrapper**: the 8.2.6 split made the level files small enough to hold their own arrangement,
  and a wrapper would have to take the three blocks as props to do the same job.
- **A test that offers options offers `MIN_TEST_OPTIONS` of them, or it is not that level
  (8.2.36).** One option cannot be got wrong and is still recorded as a pass, which is what
  the level-up maths counts. Levels whose options are other *passages* (l11, l21) can only
  draw decoys from the library, so `canOfferPassageOptions` counts them **inside the
  target's own translation** - the pool they actually come from - and below the minimum each
  falls back to the half of its own level that asks about the **address** (l10 synthesizes
  decoys from the address space, l20 asks in the picker). Skipping substitutes, never
  removes: a session never loses a test, it only changes which half of the level it asks.
- **What the user typed is compared through `Passage.typedEquals`, never with `===`
  (8.2.7).** Level 5 grades character by character, so a character the phone keyboard
  cannot produce makes a passage unlearnable: the user types the only thing they can
  type and is told they are wrong, forever. The curly apostrophe, the em dash, the
  guillemets, the nbsp and the Cyrillic letters that are drawn exactly like Latin ones
  are all in real passages today — `sanitizeSharedText` (8.1.4) folds them on the way
  IN and 8.2.11 will fold them at the API, but **neither reaches a passage already
  sitting in somebody's state, and nothing may rewrite their text behind their back**.
  So the tolerance lives on the comparison, and it lives in one place.
  · It is **equality, not resemblance** — the same line `sameWord` draws. A misspelling
    is still wrong, and two different Ukrainian letters are never folded onto each
    other. Widening this to "close enough" would delete the level.
  · The fold is **strictly 1:1**, because `typedPrefixLength` maps an index in the
    folded text back to an index in the real one. A mapping that changes the length (the
    ellipsis → three dots) belongs in the ignored punctuation instead.
  · A new equivalence is a new row in `TYPING_EQUIVALENTS` **plus its own test** — the
    suite is one `it` per pair, asserted in both directions.
- **An address and a passage's text are asked, never re-derived (8.2.6).** Six util
  files named after verbs (`addressToString`, `addressDifference`, `addressOrder`…)
  and nine inline `verseText.split(...)` copies became `Address` and `Passage` — two
  namespaces of pure functions over the plain JSON that app state is (never classes:
  a passage in AsyncStorage cannot carry methods). The duplication was not a tidiness
  problem: the test generator counted a passage's sentences with one filter and stored
  a `sentenceRange`, the level component resolved it with another, and the two could
  disagree about which sentence index 2 is. Same for word indexes — the generator
  collapsed double spaces, the renderer did not. One definition each, and both sides
  call it.
- **State model changes:** bump version + write converter in `stateVersionConvert.ts`
  + update `initials.ts` + prompt-backup flow. All four or nothing.
- **Navigation is typed** (8.1.14). A screen's props are `ScreenPropsModel<SCREEN.x>`
  (from `models.ts`), never a hand-rolled `{ route: any }`. A new screen means: a
  `SCREEN` member, a line in `RootStackParamList`, and a `Stack.Screen` — the param
  list is what makes the first two impossible to forget. Params carry small
  identifying args only; app state lives in AppContext.
- **The boot path never overwrites state it could not read.** `bootBackup.loadStoredState`
  classifies a read as found / empty / failed; only "empty" (a `NotFoundError`) may be
  followed by a write. Anything else goes to `EmergencyScreen` with storage untouched.

## 5. Patterns to follow (bbh-api)

- Flow: route → `validateResource(zodSchema)` → controller → service → db.
  Controllers stay thin; logic lives in services.
- All input validated with zod schemas in `src/schema/`.
- Data access only through the service layer (keeps sqlite swappable — ARCHITECTURE §3.5).
- Log with pino (`utils/logger.ts`); never leak secrets/tokens into logs.
- **No test opens a network socket.** `jest.setup.ts` mocks nodemailer globally; a
  suite that needs the real thing's behaviour injects its own transport (`sendEmail`
  and `verifyMailer` both take one). Anything new that talks to the outside world gets
  the same treatment — a test that fails because someone's credentials expired is not
  testing the code.
- Auth: `requireUser` middleware; JWT utils in `utils/jwt.ts`.
- **Per-environment values come from the env file, never the repo** — `.staging.env` /
  `.production.env` are untracked and have never been tracked, which is the only reason
  the VPS deploy's `git reset --hard` cannot eat them. Read them *inside* the handler,
  not at module load, so a value is testable and a container restart is enough to change
  it (`ANDROID_CERT_FINGERPRINTS` in `routes.ts` is the pattern).
- **The deployed containers run plain `node`**, not `nodemon` — a built image has no
  source to watch and Docker's restart policy is the supervisor. Only the `local`
  compose service, which bind-mounts the source, keeps a watcher.

## 6. Testing & verification (win conditions)

Every task is done only when:

1. `npm run lint` passes (tsc + eslint) in the touched repo.
2. `npm test` passes; new logic gets tests (utils and reducer changes ALWAYS get tests).
3. `docs/FILEMAP.md` updated if files were added/removed/repurposed.
4. `docs/robotdiary.md` got a dated entry (what/why/gotchas).
5. UI strings exist in both `en.ts` and `ua.ts`.

Manual on-phone testing is done by Fedir at version milestones (STRATEGY §5), not
per task — but SAY in the diary entry what needs manual verification.

## 7. Component library (mobile)

Reuse these. Extend, don't duplicate.

> **No component takes `theme` or `t` as a prop.** The STRATEGY §4.3 migration
> finished 2026-08-24 (sessions 8.1.11–8.1.13): every component reads them via
> `useAppContext()`. New components MUST do the same — never reintroduce a `theme`
> or `t` prop, and never prop-drill them to a child. Consequence for tests: anything
> rendering app UI goes through `test-utils/renderWithContext.tsx`, because
> `useAppContext()` throws without a provider. The single exception is
> `EmergencyScreen.tsx` (the crash screen), which renders outside the provider by
> design and therefore stays on raw `react-native` primitives with hardcoded
> bilingual strings.

| Component | File | What it is / key props |
|---|---|---|
| Text | `src/components/Text.tsx` | themed `<Text>` — defaults to primary text color; `color` prop selects a semantic color (`text`/`textSecond`/`textDanger`/`mainColor`); caller `style` overrides. Use instead of RN `<Text>` in new code (STRATEGY §4.3) |
| Button | `src/components/Button.tsx` | standard app button (title, onPress, disabled, style variants) — and since 8.2.4 the app's **press feedback**: it sinks to `ANIMATION.pressScale` on press-in and springs back on press-out, on the shared `ANIMATION.spring`. A disabled `Pressable` never fires those, so a dead button never moves. Every button in the app is this component, so this is the only place that behaviour is written |
| IconButton/Icon | `src/components/Icon.tsx` + `iconData.ts` | SVG icon set by name |
| Input | `src/components/Input.tsx` | themed text input. `grow` (8.2.35) puts `flex: 1` on the input's own two outer views, so it fills the height its parent gives it — `wrapperStyle` reaches the gradient *inside* those views and grows nothing, which is why the levels where typing IS the answer (L40, L50) had a fixed band with empty screen under it |
| Checkbox | `src/components/Checkbox.tsx` | themed checkbox row |
| Select | `src/components/Select.tsx` | dropdown-style selector |
| SelectModal | `src/components/SelectModal.tsx` | modal list picker |
| Entrance | `src/components/Entrance.tsx` | 8.2.5 — the app's shared arrival, as a wrapper. Fades on a timing and rises `ANIMATION.riseDistance` on the shared spring; deliberately **no** scale (MiniModal's card grows out of a dimmed screen, a full-width block of text scaling up reads as the page zooming). `replayKey` replays the entrance when the wrapped content changes without unmounting — the training session's next test; `delayMs` staggers it behind something already in motion — the finish screen's Continue button behind its cup. `style` is the wrapper's own layout, because it is a real view in the tree. Shared values reset to 0 before every run: `withTiming(1)` from a value already at 1 is not an animation, so a replay without the reset silently does nothing (the same trap MiniModal has on reopen) |
| MiniModal | `src/components/MiniModal.tsx` | small confirm/content modal (base for confirmations) — and, since 8.2.1, the app's **animated dialog surface**: backdrop fades on a timing, the card springs up from `ANIMATION.riseDistance`/`riseScale`, and RN's platform `animationType` is `"none"` because the entrance is ours. Every dialog in the app inherits it (directly, or through `ConfirmModal` / `SelectModal`), so animate dialogs by going through MiniModal, not by hand-rolling one. 8.2.2 took two surfaces off it — they were never dialogs. Shared values reset on close — RN's `<Modal>` unmounts its children but MiniModal itself stays mounted, so without the reset a reopen would start already finished |
| ConfirmModal | `src/components/ConfirmModal.tsx` | reusable destructive-action confirmation (text + cancel/confirm; `confirmColor` defaults red) — use before any delete/irreversible action |
| ErrorBoundary | `src/components/ErrorBoundary.tsx` | the only thing that catches a render error thrown by a child (a `try/catch` around a parent's `return` never will). `renderFallback(error, reset)`; `reset()` clears the caught error, so recovery UI calls it **after** putting a usable state back. Dependency-free on purpose — no context, no themed components — so it survives a broken theme/l10n |
| EmergencyScreen | `src/components/EmergencyScreen.tsx` | the last-resort recovery UI (restore from either backup slot, dump state, ask for help, erase). Rendered by `App.tsx` from two places: the `ErrorBoundary` fallback and a **failed** state read on boot. Renders outside `AppProvider` by design → raw RN primitives + hardcoded bilingual strings, the one place `t()`/theme do not apply. Feature-specific, not a base component |
| BackupRestoreModal | `src/components/BackupRestoreModal.tsx` | 8.2.34 — the one place "restore this backup?" is asked, shared by the settings row and by a backup opened from outside the app. Takes the decoded-but-NOT-applied `ParsedBackupModel`; says what would **change** (the file's date, then each count as `now → after`) rather than only what the file holds, because "12 passages" never told the user they currently have 40. Feature-specific, built on `ConfirmModal` |
| BackupFileOpener | `src/components/BackupFileOpener.tsx` | 8.2.34 — no UI of its own: it listens for the `content://` / `file://` URI Android hands over when a `.bbhbackup` file is opened (cold start via `getInitialURL`, running app via the `url` event), decodes it with `readBackupFromUri` and shows `BackupRestoreModal`. Rendered by `App.tsx` **inside** `AppProvider`, because restoring writes the state the provider owns — App's own `state` stops being the truth the moment the provider mounts |
| BackupOfferModal | `src/components/BackupOfferModal.tsx` | the one-shot post-upgrade "save a backup file?" offer (8.1.9). Rendered by `App.tsx` inside the provider, shown only on a boot that converted a state, dismissible and never blocking. Feature-specific — not a base component to build on |
| Header | `src/components/Header.tsx` | **the** app header — `title`/`onBack`/`backIcon`/`right`/`children`; springs in behind the screen transition; the only caller of `useSafeAreaInsets`, and bare (`<Header />`) it is just the device's top margin. Exports `HEADER_HEIGHT` |
| HomeSwipe | `src/components/HomeSwipe.tsx` | 8.2.28 — home's four swipes, as a wrapper round the home column. `onSwipe(direction)` + `available` (the directions that currently lead somewhere; a swipe toward one that does not fires nothing, and "down" also decides whether the pull arrow exists). One `Gesture.Pan`, dominant axis wins, `ANIMATION.swipeThreshold` for the three that navigate and the longer `ANIMATION.pullTrigger` for the pull that starts a session. Feature-specific: home is the only screen with four destinations beyond four edges |
| AddressPicker | `src/components/AddressPicker.tsx` | Bible address (book/chapter/verse) picker. Since 8.2.1a: the header title is derived from `tempAddress` (NaN = unpicked) and a complete address is handed to `Address.format` — never from which part is being *edited*; the selected verse wears the gradient-outline idiom; the single-verse footer is a real row in the layout flow, so it cannot cover the last row of verses |
| LevelPicker | `src/components/LevelPicker.tsx` | passage level selector with dots |
| PassageEditor | `src/components/PassageEditor.tsx` | full passage add/edit UI. Since 8.2.1b the translation `Select` sits directly under the address and above the verse text it decides — not among the bottom selectors; a NEW passage usually arrives with it already answered by the add flow |
| DotIndicator | `src/components/DotIndicator.tsx` | progress dots |
| TestNavDot | `src/components/TestNavDot.tsx` | per-test navigation dot in session |
| WeekActivity | `src/components/WeekActivity.tsx` | weekly activity graph |
| SettingsMenuItem | `src/components/SettingsMenuItem.tsx` | settings row (label/action/checkbox/select/textinput/taglist) |
| SettingsSubScreen | `src/components/SettingsSubScreen.tsx` | shared shell (View + Header w/ back + StatusBar) for every settings sub-menu screen — and since 8.2.2 for every drilled-into screen, settings or not (`FiltersScreen`, `LogSettingsScreen`); optional `headerRight` (e.g. add button) |
| SettingsListWrapper | `src/components/SettingsListWrapper.tsx` | reusable editable-list screen body (translations/reminders/train-modes); non-modal — list & per-item editor are two views toggled by local state |
| Level test screens | `src/components/levels/L10..L50.tsx` | one component per test level, one file per component, named after it exactly (8.2.6 — `Level1.tsx`/`Level2.tsx` used to hold two each). Props: `LevelComponentModel` from `models.ts`. Verse text comes from `Passage`, addresses from `Address` |
| levelLayout | `src/components/levels/levelLayout.ts` | 8.2.35 — the shared level arrangement as a stylesheet (`screen` / `prompt` / `answer` / `action`, plus the column's one gutter). Not a component: see the rule in §4. Every level file styles its three blocks from here and keeps only what is genuinely its own |
| SentenceContext | `src/components/levels/SentenceContext.tsx` | 8.2.6 — the sentences either side of the stretch being typed (L40, L50), which both drew inline and identically. `side="before"` ends with an ellipsis, `side="after"` starts with one, and the far end only gets one when there is more passage than is shown; nothing renders when the test has no sentence range |

Key utils (check before writing a helper): `Address` (`address.ts`),
`Passage` (`passage.ts`), `formatDateTime`,
`secondsToString`, `addZero`, `randomizers`, `getSimularity`, `getStats`,
`getPerfectTests`, `levelsConvertion`, `toastShow`, `notifications`, `fileManager`,
`handlePassageExport`, `bootBackup`, `backupFile`, `getTranslationChoice`,
`generateStudyOneTests`, `feedback`.

> **Backups have exactly two owners.** `bootBackup.ts` = copies inside storage (the
> write-once pre-conversion snapshot + the version-tolerant restore). `backupFile.ts`
> = copies in a file the user owns (serialize/parse the envelope + the shared export /
> import IO). Anything that reads or writes app data as a file goes through
> `backupFile`; never hand-roll `JSON.stringify(state)` + `writeFile` again.

## 8. Git & workflow

- Small, self-contained commits; message says what and why. Broken-in-between states
  are acceptable during multi-task refactors, but say so in robotdiary.
- `production` is the main branch; feature work may go via `staging`.
- Never commit secrets (`.env` files in bbh-api are local/VPS only).
- **Never edit `projectdiary.md`** (or bbh-api's `codingdiary.md`) — those are
  Fedir's personal diaries. The AI diary is `docs/robotdiary.md`.
