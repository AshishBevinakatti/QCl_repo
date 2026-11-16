# Project State
Updated: 2026-11-16T16:57:51+05:30
Phase: 1. Work unit: **Gold Membership increment (SOW ERP-05)**, plan approved 2026-11-16 (`docs/03-phases/phase-1/inc-membership-PLAN.md`, D-116…D-125, Q-030…Q-037). Runs before increment 2 (leads).
Branch: `feature/phase1-membership` (from `feature/phase1-fresh-start` @ f22f828). Nothing pushed (token needs `workflow` scope).

Done:
1. S0 housekeeping: commits 9a58edb (mobile/HTTPS), 4dee064 (role cards + Employees UI), 4772b89 (landing page = Ritvik 2c164d9 + local map fix; an unfinished merge from 16 Nov 00:04 was dropped with `git merge --quit`), f22f828 (logs). Hard delete reverted (D-125).
2. S0b one public origin split by path (D-124): committed 97c5e0c; ngrok now → :8088.
3. S1 membership core + S2 gateway routes/upload limit + live realm permissions: committed 4267d1b (V2 migration already applied to the dev DB).
4. S5 staff ERP Memberships screen: committed 4da643a.
5. S3 CODE COMPLETE, uncommitted: Keycloak extension (ActivationFlowIT 5/5), realm gh-guests, guest-service (9/9), access-service welcome + resend (51/51), web resend button (33/33), CI realm checks, docs (MEMBER-LOGIN.md). Not live yet. Handoff: `docs/03-phases/phase-1/inc-membership-HANDOFF.md` (S3 section is older than this line; DEVLOG has the latest).

Next action:
1. Ashish: approve the S3 commit.
2. Ashish: approve the live steps: kcadm `guests.provision` on gh-staff (KEYCLOAK-SETUP §5.5); create guest_db/guest_svc on the live volume (DAY-ONE §5); recreate Keycloak (`docker compose … up -d keycloak`) to import gh-guests with the extension; start guest-service; restart access-service and api-gateway.
3. Live test: verify a member → welcome email in the inbox (SMTP_*) → link → set password once → lands signed in on /membership (works only after S6 adds /member/activate; until then the link's landing page doesn't exist — check the Keycloak side with the link manually).
4. Then S4 (portal API + gateway multi-issuer), S6 (landing page), S7 (phone end to end, report).

Running locally: compose postgres, keycloak, redis, mailpit, proxy; access-service :8091 (old process, without ERP_WEB_URL), api-gateway :8082, web :5173, landing :3000, ngrok → :5173 (to be switched to :8088).
Caveats: `skills-lock.json` (from Ritvik's branch) is untracked on purpose. The landing page still calls `http://localhost:8082` by default for portal APIs; S6 switches it to same-origin `/api`.
