# Environments — Phase 2 plan

- Purpose: where the system runs, what data may live there, and how releases move. Audience: user (approver), DevOps. Last verified: 2026-10-09. Owner: project team.
- Sources: SOW §25 (app/security/backup/hosting), REQ-XCUT-003/004, ADR-001. Hosting provider undecided → everything Compose-runnable + cloud-ready, no cloud-only coupling.

## Environments

| Env | Runs on | Deploy | Data | Purpose |
|---|---|---|---|---|
| Local | developer laptop (`infra/docker-compose.local.yml`: Postgres, Redis, Kafka, Keycloak, app) | `docker compose up` + seed script | synthetic seed only | daily dev + integration tests |
| Dev | single server/K8s namespace (auto from `develop`) | CI auto-deploy on green merge | synthetic seed only | shared integration |
| Staging (UAT) | prod-like (manual promote) | manual approval gate | masked/anonymized only — never unmasked prod without written client direction | client UAT (SOW §28.2) |
| Production | agreed target (Phase 7) | manual approval + release tag + rollback plan | real data, restricted RBAC | live (Phase 7+) |

## Config & secrets per env
Separate credentials per env (names in security.md); `.env.example` (fake values) committed, real `.env` never. Staging mirrors prod config (sizes differ). All config changes audited.

## Pipeline (CI on every branch)
`build → unit → integration (real Postgres/Kafka) → lint/type → dependency + secret scan → image → Dev (auto) → Staging (manual) → Prod (manual, Phase 7+)`. Path-filtered jobs per module. Red builds never merge. Observability (Prometheus/Grafana/Jaeger/ELK) from Phase 3.0, not later.

## Backup & recovery (procedure finalized Phase 7, drilled before go-live)
Postgres automated backups (schedule + retention config), restore tested at least once on staging and recorded in `05-operations/backup-restore.md`; recovery procedure + rollback plan written before any prod deploy (SOW §25.3). Backup monitoring under AMC per hosting arrangement (SOW §31.2).

## RFID terminal environments
Simulator in local/dev/staging; real terminal joins at staging when delivered (commissioning notes per §20A); device keys per env; offline-behaviour drill on staging.
