# robotdiary — AI session log

> Append one dated entry per session: what was done, decisions made, gotchas found,
> what needs manual verification. Newest at the bottom.
> (`projectdiary.md` is Fedir's personal diary — never write there.)

---

## 2026-07-07

- Bootstrapped the AI workflow: created `docs/ARCHITECTURE.md`, `CODING_RULES.md`,
  `FILEMAP.md`, `STRATEGY.md`, this file, and `CLAUDE.md` in both repos.
- Absorbed and deleted `docs/PLAN.md` (its bug/risk scan lives on in STRATEGY §2–§3).
- Key decisions captured from Fedir's 44-question interview: offline-first is
  constitutional; device is source of truth; error counts hidden from user (stored
  for scheduling only); keep reducer+AsyncStorage; migrate custom navigator to
  react-navigation; shared contract package as a third repo (no monorepo); sync =
  LWW + checksums + incremental history; auth additive/pluggable; bugs before
  features; broken-in-between OK; milestone-based manual testing until 1.0.0.
- Needs manual verification: nothing yet (docs only). Next recommended task:
  STRATEGY §1 — verify CI/CD (EAS staging build + bbh-api staging deploy).

## 2026-07-08

- Fixed the recurring GitHub Actions failures (STRATEGY §1 CI/CD). Root causes:
  1. Workflows used `yarn install --frozen-lockfile`, but the repo is npm-based and
     had **no committed lockfile** (`.gitignore` even ignores `yarn.lock`) — install
     failed before lint ever ran.
  2. Two real peer-dep conflicts blocked a clean install: `react-test-renderer`
     resolved to 19.2.7 while `react` is pinned 19.0.0; and
     `eslint-config-airbnb-typescript@18` wants `@typescript-eslint/*@^7` while we're
     on v8.
  3. Actual lint error: 4 prettier violations in `src/models.ts` (multi-line union
     types) — cosmetic only.
- Fixes: pinned `react-test-renderer@19.0.0` in devDeps; added `.npmrc`
  (`legacy-peer-deps=true`) so install/`npm ci` behave the same locally and in CI;
  generated + committed `package-lock.json`; ran `npm run lint-fix` for the prettier
  errors; rewrote both workflows to npm (`npm ci` + `npm run lint` + `npm test`),
  bumped checkout/setup-node v3→v4, added npm caching, dropped the redundant standalone
  `tsc` step (lint already runs it).
- Verified locally: `npm ci` ✓, `npm run lint` ✓, `npm test` ✓ (21 suites / 35 tests).
- Needs manual verification: push to `staging` and confirm the Actions run goes green
  through build-and-test (the EAS submit jobs need `EXPO_TOKEN` + store credentials —
  out of scope here).
