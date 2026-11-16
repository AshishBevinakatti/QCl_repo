# Project State
Updated: 2026-11-16T15:46:34+05:30
Phase: 1. Work unit: **Gold Membership increment (SOW ERP-05)**, plan approved 2026-11-16 (`docs/03-phases/phase-1/inc-membership-PLAN.md`, D-116…D-125, Q-030…Q-037). Runs before increment 2 (leads).
Branch: `feature/phase1-membership` (from `feature/phase1-fresh-start` @ f22f828). Nothing pushed (token needs `workflow` scope).

Done:
1. S0 housekeeping: commits 9a58edb (mobile/HTTPS), 4dee064 (role cards + Employees UI), 4772b89 (landing page = Ritvik 2c164d9 + local map fix; an unfinished merge from 16 Nov 00:04 was dropped with `git merge --quit`), f22f828 (logs). Hard delete reverted (D-125).
2. S0b one public origin split by path (D-124): committed 97c5e0c; ngrok now → :8088.
3. S1 membership core + S2 gateway routes/upload limit + live realm permissions: committed 4267d1b (V2 migration already applied to the dev DB).
4. S5 staff ERP Memberships screen: built, web 32/32, lint/build clean. **Uncommitted, awaiting commit approval; not yet tried live.**

Next action:
1. Ashish: approve the S5 commit.
2. Ashish: restart access-service and api-gateway (they still run the pre-S1 code; `.env` has MEMBERSHIP_PROOF_KEY), sign out/in on the ERP (new `memberships.*` permissions), then live test on the phone: Sales Executive registers with a camera screenshot → Manager/Admin verifies in the queue.
3. Then S3: gh-guests realm + activation SPI spike (Testcontainers Keycloak) + thin guest-service; then S4 portal API, S6 landing page.

Running locally: compose postgres, keycloak, redis, mailpit, proxy; access-service :8091 (old process, without ERP_WEB_URL), api-gateway :8082, web :5173, landing :3000, ngrok → :5173 (to be switched to :8088).
Caveats: `skills-lock.json` (from Ritvik's branch) is untracked on purpose. The landing page still calls `http://localhost:8082` by default for portal APIs; S6 switches it to same-origin `/api`.
