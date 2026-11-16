# Decisions (append-only)

Earlier decisions D-001…: `archive/hotel-draft:ERP_DEV/docs/logs/DECISIONS.md`. They don't apply to this baseline.

| ID | Date | Decision | By | Reason / source |
|---|---|---|---|---|
| D-101 | 2026-11-15 | Restart the ERP as a new Phase 1; archive the old ERP on `archive/hotel-draft` + tag; landing page unchanged | Ashish | ADR-003 |
| D-102 | 2026-11-15 | Keep the same tech stack as the archived ERP | Ashish | ADR-001 (version upgrade still open, Q-020) |
| D-103 | 2026-11-15 | Keycloak is the only employee identity provider; no custom OTP/JWT/password store | Ashish | ADR-002; Blueprint §18 |
| D-104 | 2026-11-15 | Phase 1 follows the Blueprint scope: no booking, room allocation or payment collection | Ashish | Blueprint §7/§8 |
| D-105 | 2026-11-15 | Blueprint microservices (gateway, access, guest, lead, notification) with Kafka outbox and Redis | Ashish | ADR-001 |
| D-106 | 2026-11-15 | Follow-ups, status machine, SLA, reassignment, conversion and CMS are deferred to later Phase 1 increments | Ashish | "we will add new feature later" |
| D-107 | 2026-11-15 | Gateway listens on :8082 so the unchanged landing page reaches it with its default URL | Agent (proposed) | ARCHITECTURE §2 |
| D-108 | 2026-11-15 | Permissions are Keycloak `erp-api` client roles inside composite realm roles, not a PostgreSQL table | Agent (proposed) | AUTHENTICATION §3 |
| D-109 | 2026-11-15 | Employee profiles live in `access-service` (the Blueprint "Access Control" service) until HR & Workforce exists | Agent (proposed) | Q-028 |
| D-110 | 2026-11-15 | The resource folder used is `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce` (the rule path doesn't exist) | Agent (proposed) | Q-001 |
| D-111 | 2026-11-15 | D-110 confirmed: the official resource root is `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce`; rules updated | Ashish | Q-001 answer |
| D-112 | 2026-11-15 | Upgrade to current supported releases of the same stack products (answers Q-020; supersedes the version column of ADR-001) | Ashish | R-002 |
| D-113 | 2026-11-15 | Employee onboarding/activation/deactivation: ADMIN only (answers Q-029) | Ashish | Least privilege |
| D-114 | 2026-11-15 | Guest register/login: guest-service passes through to Keycloak `gh-guests`; password grant allowed only on the dedicated guest client (answers Q-003) | Ashish | Landing page unchanged; Blueprint "no second password store" |
| D-115 | 2026-11-15 | Versions fixed: Spring Boot 4.1.2 (departs from Blueprint wording "Spring Boot 3"; 3.x has no open-source support since 2026-06-30), Keycloak 26.8.2, PostgreSQL 18.7, Redis 8.10.3, TypeScript 7.0.2, others newest stable (ADR-001 update) | Ashish | Q-020 |
| D-116 | 2026-11-16 | Gold Membership increment (SOW ERP-05) is built **before** increment 2 (leads); reverses phase1_plan §7 deferral of payment-screenshot upload and "Sales Executive has no payment access" for membership payments only | Ashish | Pasted master plan; "go with the plan" |
| D-117 | 2026-11-16 | Membership IDs use the client series `GRH-LM-0101 … GRH-LM-5100`, assigned gap-free when the registration is saved | Ashish | `LM Mem ID.xlsx`, `Golden_Hills_Resort_Loyalty_Voucher_Numbers_5000.xlsx` |
| D-118 | 2026-11-16 | ADMIN and MANAGER verify/reject membership payments; nobody verifies a registration they enrolled | Ashish | Least privilege, separation of duties |
| D-119 | 2026-11-16 | Customer login = Authorization Code + PKCE on Keycloak `gh-guests`. **Supersedes D-114** (password pass-through) | Ashish | Same identity for landing page, future mobile app and customer web app |
| D-120 | 2026-11-16 | Membership, payment records and APIs in access-service/access_db; a thin guest-service owns guest identity provisioning; no membership copy in guest_db; memberships linked by Keycloak user id | Ashish | Pasted plan + architecture |
| D-121 | 2026-11-16 | Customer emails: one Golden Hills welcome email (member ID + secure set-password link) sent by Keycloak through the configured SMTP; never a password by email; no SMS/WhatsApp | Ashish | — |
| D-122 | 2026-11-16 | After setting the password the customer is signed in automatically (no second login); implemented with a Keycloak activation extension (one-time hashed token + PKCE flow) | Ashish | Frictionless onboarding |
| D-123 | 2026-11-16 | UI: no existing feature removed. Landing login keeps its layout (email → Keycloak); OTP/Booking-ID tabs shown as "Coming soon"; fake offline logins removed; amenities from config (TBC); ledger from `membership-data.ts`; voucher QR deferred; Ritvik's /profile and /membership member screens get real data; Membership-ID tab stays a labelled preview; real members show 0 used; sample ID placeholder uses `GRH-LM-0000` | Ashish | Session 2026-11-16 questions |
| D-124 | 2026-11-16 | One public ngrok HTTPS domain for everything, split by path behind a Caddy proxy: landing `/`, staff ERP `/erp/`, Keycloak `/realms` + `/resources`, API `/api` | Ashish | Only one ngrok domain available |
| D-125 | 2026-11-16 | Uncommitted hard-delete employee feature reverted; deactivation stays the only way to remove access (ARCHITECTURE §4, AUTHENTICATION §7) | Ashish | Keeps the audit trail |
