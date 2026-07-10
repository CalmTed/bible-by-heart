# Bible by Heart — mobile app

Hobby project, one small task per session. Before doing ANYTHING, read the shared
docs (they cover this repo AND the API repo at `c:/Code/bbh-api`):

1. `docs/ARCHITECTURE.md` — vision, philosophy, core decisions (the grand context)
2. `docs/CODING_RULES.md` — style rules + reusable component library (reuse, don't recreate)
3. `docs/FILEMAP.md` — where everything lives, both repos
4. `docs/STRATEGY.md` — the master plan; the current task usually comes from here

## Hard rules

- **Never edit `projectdiary.md`** (nor `codingdiary.md` in bbh-api) — Fedir's personal diaries.
- The AI writes to `docs/robotdiary.md` instead: append a dated entry every session.
- Never show error counts to the user in UI — errors are stored for stats/scheduling only.
- Offline-first: no feature may require network/account to use the core app.
- No `any`, no `@ts-ignore`. UI strings always in both `src/l10n/en.ts` and `ua.ts`.

## Win conditions of every task

`npm run lint` ✓ · `npm test` ✓ · `docs/FILEMAP.md` updated if files changed ✓ ·
`docs/robotdiary.md` entry appended ✓ · both l10n files updated for new strings ✓

## Commands

- `npm run lint` — tsc --noEmit + eslint
- `npm test` — jest with coverage
- `npm run dev` — expo start
- `npm run build-dev` — EAS staging Android build
