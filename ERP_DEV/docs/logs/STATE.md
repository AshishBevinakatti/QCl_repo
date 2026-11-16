# Project State
Updated: 2026-11-16T15:16:45+05:30
Phase: 1. Work unit: **Gold Membership increment (SOW ERP-05)**, plan approved 2026-11-16 (`docs/03-phases/phase-1/inc-membership-PLAN.md`, D-116…D-125, Q-030…Q-037). Runs before increment 2 (leads).
Branch: `feature/phase1-membership` (from `feature/phase1-fresh-start` @ f22f828). Nothing pushed (token needs `workflow` scope).

Done:
1. S0 housekeeping: commits 9a58edb (mobile/HTTPS), 4dee064 (role cards + Employees UI), 4772b89 (landing page = Ritvik 2c164d9 + local map fix; an unfinished merge from 16 Nov 00:04 was dropped with `git merge --quit`), f22f828 (logs). Hard delete reverted (D-125).
2. S0b one public origin split by path (D-124): Caddy `proxy` on :8088, ERP under `/erp/`, `ERP_WEB_URL`, Next `allowedDevOrigins`; verified locally (DEVLOG). **Uncommitted, awaiting Ashish's review and commit approval.**

Next action:
1. Ashish: restart access-service (so `ERP_WEB_URL` loads) and restart ngrok as `ngrok http 8088 --url=weaponless-bertie-hyperorganically.ngrok-free.dev`.
2. Phone test: `/` landing, `/erp/` staff sign-in, refresh, sign-out back to `/erp/`, Employees loads; staff invite link lands on `/erp/`.
3. Commit S0b (ask first). Then S1: V2 migration + membership core in access-service, tests first.

Running locally: compose postgres, keycloak, redis, mailpit, proxy; access-service :8091 (old process, without ERP_WEB_URL), api-gateway :8082, web :5173, landing :3000, ngrok → :5173 (to be switched to :8088).
Caveats: `skills-lock.json` (from Ritvik's branch) is untracked on purpose. The landing page still calls `http://localhost:8082` by default for portal APIs; S6 switches it to same-origin `/api`.
