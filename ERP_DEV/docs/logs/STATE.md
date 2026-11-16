# Project State
Updated: 2026-11-16T17:20:50+05:30
Phase: 1. Work unit: **Gold Membership increment (SOW ERP-05)**, plan approved 2026-11-16 (`docs/03-phases/phase-1/inc-membership-PLAN.md`, D-116…D-125, Q-030…Q-037). Runs before increment 2 (leads).
Branch: `feature/phase1-membership` (from `feature/phase1-fresh-start` @ f22f828). Nothing pushed (token needs `workflow` scope).

Done:
1. S0 housekeeping: commits 9a58edb (mobile/HTTPS), 4dee064 (role cards + Employees UI), 4772b89 (landing page = Ritvik 2c164d9 + local map fix; an unfinished merge from 16 Nov 00:04 was dropped with `git merge --quit`), f22f828 (logs). Hard delete reverted (D-125).
2. S0b one public origin split by path (D-124): committed 97c5e0c; ngrok now → :8088.
3. S1 membership core + S2 gateway routes/upload limit + live realm permissions: committed 4267d1b (V2 migration already applied to the dev DB).
4. S5 staff ERP Memberships screen: committed 4da643a.
5. S3 committed (f9be13b, 6044e6b) and LIVE: gh-guests imported with the extension, guests.provision on live gh-staff, guest_db created, guest-service running on :8092.
6. S4 portal API + gateway portal chain (D-126): built, access-service 57/57, gateway 15/15. **Uncommitted, awaiting approval.**

Next action:
1. Ashish: restart access-service and api-gateway (new code S1–S3); sign out/in on the ERP.
2. Live test of the ERP side: register → verify → welcome email arrives (use a real inbox you own). The link's landing page (/member/activate) comes with S6.
3. Commit S4 (ask). Then S6 landing page (keycloak-js PKCE, /member/activate, Ritvik's /membership + /profile wired to real data, login-portal changes per D-123); S7 phone end to end + report.

Running locally: compose postgres, keycloak (with gh-guests + extension), redis, mailpit, proxy; guest-service :8092 (started by Claude, log ERP_DEV/logs/guest-service.out); access-service :8091 (old process, without ERP_WEB_URL), api-gateway :8082, web :5173, landing :3000, ngrok → :5173 (to be switched to :8088).
Caveats: `skills-lock.json` (from Ritvik's branch) is untracked on purpose. The landing page still calls `http://localhost:8082` by default for portal APIs; S6 switches it to same-origin `/api`.
