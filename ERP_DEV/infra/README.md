# infra — local and deployment infrastructure

Planned for increment 1 (not created yet):
- `docker-compose.yml`: PostgreSQL 16 (databases `keycloak`, `access_db`, `guest_db`, `lead_db`, `notification_db`, each with its own user), Keycloak 24 (`start-dev --import-realm`), Kafka 3.7 (KRaft), Redis 7, Mailpit (SMTP 1025 / UI 8025; needs approval, Q-023).
- `keycloak/gh-staff-realm.json`: realm import built from `docs/02-architecture/identity/KEYCLOAK-SETUP.md`, with secrets as `${ENV}` placeholders only.
- `postgres/init/`: creates the per-service databases and least-privilege users.

Secrets come from `ERP_DEV/.env` (git-ignored). Never commit real values.
