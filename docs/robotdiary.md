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
