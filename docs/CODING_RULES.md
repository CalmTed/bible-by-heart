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
- Existing offenders (`homeScreen.tsx`, `miniModal.tsx`, `setttingsMenuItem.tsx`,
  `testNevDott.tsx`, `settingsListWrapper.tsx`, `screeenManagement.ts`,
  `base.servise.ts`…) get renamed in a dedicated refactor task (STRATEGY §4) —
  don't rename them as a side effect of unrelated work, it pollutes diffs.
- One component per file; the file is named after its default export.

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
- **Animations (new UI work):** react-native-reanimated + gesture-handler are the
  standard. No `Animated` from RN core in new code.
- **State model changes:** bump version + write converter in `stateVersionConvert.ts`
  + update `initials.ts` + prompt-backup flow. All four or nothing.

## 5. Patterns to follow (bbh-api)

- Flow: route → `validateResource(zodSchema)` → controller → service → db.
  Controllers stay thin; logic lives in services.
- All input validated with zod schemas in `src/schema/`.
- Data access only through the service layer (keeps sqlite swappable — ARCHITECTURE §3.5).
- Log with pino (`utils/logger.ts`); never leak secrets/tokens into logs.
- Auth: `requireUser` middleware; JWT utils in `utils/jwt.ts`.

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

| Component | File | What it is / key props |
|---|---|---|
| Button | `src/components/Button.tsx` | standard app button (title, onPress, disabled, style variants) |
| IconButton/Icon | `src/components/Icon.tsx` + `icondata.ts` | SVG icon set by name |
| Input | `src/components/Input.tsx` | themed text input |
| Checkbox | `src/components/Checkbox.tsx` | themed checkbox row |
| Select | `src/components/Select.tsx` | dropdown-style selector |
| SelectModal | `src/components/SelectModal.tsx` | modal list picker |
| MiniModal | `src/components/miniModal.tsx` | small confirm/content modal (base for confirmations) |
| ConfirmModal | `src/components/ConfirmModal.tsx` | reusable destructive-action confirmation (text + cancel/confirm; `confirmColor` defaults red) — use before any delete/irreversible action |
| Header | `src/components/Header.tsx` | screen header with back/actions |
| AddressPicker | `src/components/AddressPicker.tsx` | Bible address (book/chapter/verse) picker |
| LevelPicker | `src/components/LevelPicker.tsx` | passage level selector with dots |
| PassageEditor | `src/components/PassageEditor.tsx` | full passage add/edit UI |
| DotIndicator | `src/components/DotIndicator.tsx` | progress dots |
| TestNavDott | `src/components/testNevDott.tsx` | per-test navigation dot in session |
| WeekActivity | `src/components/weekActivityComponent.tsx` | weekly activity graph |
| SettingsMenuItem | `src/components/setttingsMenuItem.tsx` | settings row (checkbox/select/modal-opener) |
| SettingsListWrapper | `src/components/settingsListWrapper.tsx` | wrapper for settings sublists |
| Level test screens | `src/components/levels/Level1..5.tsx` | one component per test level |

Key utils (check before writing a helper): `addressToString`, `addressFromString`,
`addressDistance`, `addressDifference`, `addressOrder`, `formatDateTime`,
`secondsToString`, `addZero`, `randomizers`, `getSimularity`, `getStats`,
`getPerfectTests`, `levelsConvertion`, `toastShow`, `notifications`, `fileManager`,
`handlePassageExport`.

## 8. Git & workflow

- Small, self-contained commits; message says what and why. Broken-in-between states
  are acceptable during multi-task refactors, but say so in robotdiary.
- `production` is the main branch; feature work may go via `staging`.
- Never commit secrets (`.env` files in bbh-api are local/VPS only).
- **Never edit `projectdiary.md`** (or bbh-api's `codingdiary.md`) — those are
  Fedir's personal diaries. The AI diary is `docs/robotdiary.md`.
