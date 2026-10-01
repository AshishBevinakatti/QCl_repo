# Working agreement — how we work

- Purpose: one-page process contract. Audience: all contributors. Last verified: 2026-10-01. Owner: project team.

1. **Phases in order** (0 bootstrap, 1 requirements … 9 go-live support). Never start a phase on your own;
   each ends with report → fresh-developer test → "continue?" → wait for an explicit answer.
2. **One work unit at a time**, through the Rule 3 loop (understand → plan → branch → tests-first →
   slices → verify → document → record → present → ask to commit).
3. **Git**: flow-lite — `main` (releases only) ← `develop` (integration) ← `feature/<unit>-<slug>`.
   No direct commits to `main`/`develop`. Conventional Commits. **Ask before every commit, merge, tag, push.**
   (Q-001: playbook proposes trunk-based instead — skill default applies until the user decides.)
4. **Scope guard**: every requirement traces to SOW § / ERP-01…14 or an approved CR. Add-ons ERP-10…14
   only with confirmed client approval, behind feature flags. Exclusions (§30) are not built.
5. **Records**: append-only DEVLOG/RESOURCES_LOG/OPEN_QUESTIONS/RISKS/DECISIONS/CHANGELOG; STATE.md
   overwritten each session. Docs ride in the same commit as the change they describe.
6. **Honesty**: never claim done/working/tested without having run it and shown evidence.
