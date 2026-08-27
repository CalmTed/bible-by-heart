# Coding Rules & Component Library

> Applies to both repos (mobile app + bbh-api). Read alongside `ARCHITECTURE.md`.
> When a rule and existing code disagree, the rule wins for NEW code; renaming/fixing
> old code happens via the refactor tasks in `STRATEGY.md`, not opportunistically.

---

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
  `addressToString.ts`, `stateVersionConvert.ts`.
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
  Address logic in particular already exists (`addressToString`, `addressFromString`,
  `addressDistance`, `addressDifference`, `addressOrder`).
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
- **Haptics/sound:** respect `settings.hapticsEnabled` (a util that auto-checks it
  is a planned refactor).
- **Theme:** all colors come from the theme object (`getThemeFromScheme`), never
  hex literals in components.
- **Selected state is a gradient outline, not a flat fill.** The app's idiom for "this
  one is chosen" is a `gradient1`→`gradient2` ring (2px `padding` on a LinearGradient)
  over a `bgSecond` inner surface — what `Button type="outline"` draws. A solid
  `mainColor` background is not it; 8.2.1a removed the last one (`AddressPicker`).
- **Animations (new UI work):** react-native-reanimated + gesture-handler are the
  standard. No `Animated` from RN core in new code. Installed in 8.2.1 (reanimated 4 +
  `react-native-worklets`); **never add the worklets/reanimated plugin to
  `babel.config.js`** — `babel-preset-expo` applies it automatically when the package is
  installed, and a manual entry double-applies it.
- **Motion values come from `ANIMATION` in `constants.ts`, never inline numbers.**
  Duration, spring config, rise distance and start scale live there so every animated
  surface springs identically; per-component magic numbers are what make an animated app
  feel assembled rather than designed. Same principle as colors coming from the theme.
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
| Button | `src/components/Button.tsx` | standard app button (title, onPress, disabled, style variants) |
| IconButton/Icon | `src/components/Icon.tsx` + `iconData.ts` | SVG icon set by name |
| Input | `src/components/Input.tsx` | themed text input |
| Checkbox | `src/components/Checkbox.tsx` | themed checkbox row |
| Select | `src/components/Select.tsx` | dropdown-style selector |
| SelectModal | `src/components/SelectModal.tsx` | modal list picker |
| MiniModal | `src/components/MiniModal.tsx` | small confirm/content modal (base for confirmations) — and, since 8.2.1, the app's **animated dialog surface**: backdrop fades on a timing, the card springs up from `ANIMATION.riseDistance`/`riseScale`, and RN's platform `animationType` is `"none"` because the entrance is ours. 19 call sites inherit it, so animate dialogs by going through MiniModal, not by hand-rolling one. Shared values reset on close — RN's `<Modal>` unmounts its children but MiniModal itself stays mounted, so without the reset a reopen would start already finished |
| ConfirmModal | `src/components/ConfirmModal.tsx` | reusable destructive-action confirmation (text + cancel/confirm; `confirmColor` defaults red) — use before any delete/irreversible action |
| ErrorBoundary | `src/components/ErrorBoundary.tsx` | the only thing that catches a render error thrown by a child (a `try/catch` around a parent's `return` never will). `renderFallback(error, reset)`; `reset()` clears the caught error, so recovery UI calls it **after** putting a usable state back. Dependency-free on purpose — no context, no themed components — so it survives a broken theme/l10n |
| EmergencyScreen | `src/components/EmergencyScreen.tsx` | the last-resort recovery UI (restore from either backup slot, dump state, ask for help, erase). Rendered by `App.tsx` from two places: the `ErrorBoundary` fallback and a **failed** state read on boot. Renders outside `AppProvider` by design → raw RN primitives + hardcoded bilingual strings, the one place `t()`/theme do not apply. Feature-specific, not a base component |
| BackupOfferModal | `src/components/BackupOfferModal.tsx` | the one-shot post-upgrade "save a backup file?" offer (8.1.9). Rendered by `App.tsx` inside the provider, shown only on a boot that converted a state, dismissible and never blocking. Feature-specific — not a base component to build on |
| Header | `src/components/Header.tsx` | screen header with back/actions |
| AddressPicker | `src/components/AddressPicker.tsx` | Bible address (book/chapter/verse) picker. Since 8.2.1a: the header title is derived from `tempAddress` (NaN = unpicked) and a complete address is handed to `addressToString` — never from which part is being *edited*; the selected verse wears the gradient-outline idiom; the single-verse footer is a real row in the layout flow, so it cannot cover the last row of verses |
| LevelPicker | `src/components/LevelPicker.tsx` | passage level selector with dots |
| PassageEditor | `src/components/PassageEditor.tsx` | full passage add/edit UI. Since 8.2.1b the translation `Select` sits directly under the address and above the verse text it decides — not among the bottom selectors; a NEW passage usually arrives with it already answered by the add flow |
| DotIndicator | `src/components/DotIndicator.tsx` | progress dots |
| TestNavDot | `src/components/TestNavDot.tsx` | per-test navigation dot in session |
| WeekActivity | `src/components/WeekActivity.tsx` | weekly activity graph |
| SettingsMenuItem | `src/components/SettingsMenuItem.tsx` | settings row (label/action/checkbox/select/textinput/taglist) |
| SettingsSubScreen | `src/components/SettingsSubScreen.tsx` | shared shell (View + Header w/ back + StatusBar) for every settings sub-menu screen; optional `headerRight` (e.g. add button) |
| SettingsListWrapper | `src/components/SettingsListWrapper.tsx` | reusable editable-list screen body (translations/reminders/train-modes); non-modal — list & per-item editor are two views toggled by local state |
| Level test screens | `src/components/levels/Level1..5.tsx` | one component per test level |

Key utils (check before writing a helper): `addressToString`, `addressFromString`,
`addressDistance`, `addressDifference`, `addressOrder`, `formatDateTime`,
`secondsToString`, `addZero`, `randomizers`, `getSimularity`, `getStats`,
`getPerfectTests`, `levelsConvertion`, `toastShow`, `notifications`, `fileManager`,
`handlePassageExport`, `bootBackup`, `backupFile`, `getTranslationChoice`,
`generateStudyOneTests`.

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
