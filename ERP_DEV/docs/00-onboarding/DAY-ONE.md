# Day One — new developer guide

- Last checked: 2026-11-15, Milestone 1. **Only the commands marked ✅ have actually been run.** The backend and staff web app don't exist yet (increment 1); their run steps will be added here and checked from a clean clone at that time.

## 1. What you are working on
The Golden Hills Resort ERP, built by QuantumCLK Technologies. Phase 1 connects the public website (guest registers and inquires) to the staff ERP (employees log in with Keycloak; Sales Executives claim leads). Read in this order: `docs/README.md` → `phase1_plan.md` → `ARCHITECTURE.md` → `identity/AUTHENTICATION.md`.

## 2. Prerequisites
| Tool | Version | Why |
|---|---|---|
| Git | any recent | |
| Node.js | ≥ 20.9 (✅ checked with 24.22.0) | landing page; staff web later |
| Java | 21 (Temurin) | backend services (increment 1) |
| Maven | 3.9+ | backend builds (increment 1) |
| Docker + Compose v2 | recent | PostgreSQL, Keycloak, Kafka, Redis, Mailpit (increment 1) |

## 3. Get the code
```bash
git clone https://github.com/AshishBevinakatti/QCl_repo.git
cd QCl_repo
git switch feature/phase1-fresh-start   # until it is merged into main
```

## 4. Landing page (the only runnable app today)
```bash
cd landing-page
npm ci
npm run typecheck     # ✅ exit 0 on 2026-11-15
npm run dev           # http://localhost:3000
```
- `npm run lint` currently reports 4 errors that were already there (Q-004). Don't fix them as a side job, because the landing page is frozen in Phase 1.
- Guest register/login/inquiry calls go to `http://localhost:8082/api/v1/portal` (the gateway, increment 1/2). Until then those forms show a connection error. That is expected.
- If `node_modules` is a symlink to a folder outside the project, `npm run build` fails with *"Symlink … points out of the filesystem root"*. Use a real `npm ci` install instead.

## 5. Your first change (docs-only for now)
1. Create a branch: `git switch -c docs/<short-slug>`.
2. Edit a doc, keeping the "why" and the source next to each rule.
3. Add an entry to `docs/logs/DEVLOG.md` (append only) and update `docs/logs/STATE.md`.
4. Commit with Conventional Commits, e.g. `docs(core): clarify lead claim rule`. Every commit, merge and push needs the project owner's approval.

## 6. Rules you must know on day one
- Client documents live only in the resource folder (read-only); `docs/01-requirements/source-extracts/` holds hash-stamped text copies. Never commit raw client files, personal data or secrets.
- Never commit `.env`. Secrets come from environment variables; CI runs a gitleaks secret scan.
- No custom login, password, OTP or token code: Keycloak owns identity (ADR-002).
- Phase 1 has no booking or payment features (phase1_plan.md §1.3).
