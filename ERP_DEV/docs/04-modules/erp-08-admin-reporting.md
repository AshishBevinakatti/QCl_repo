# ERP-08 — Administration & Reporting

- Purpose: central dashboard, users/RBAC, reports + exports, config panel, audit viewer. Audience: architects, ERP-08 builders. Last verified: 2026-10-09. Owner: project team.
- SOW: §11 + §§22–23. REQs: REQ-ERP08-001…006. Phases: 3.0 (auth/RBAC/audit/config shell) + 3.7 (dashboards/reports). Status: baselined.

## Actors/roles
SuperAdmin (full), Resort Manager (dashboards/reports/approvals), Reception, Membership, Accounts, Housekeeping — per SOW §22 + `[ASSUMED]` matrix in REQUIREMENTS (client to confirm).

## Business rules
1. RBAC deny-by-default, enforced server-side (never UI-only); every role/permission has a test (engineering rule).
2. Permission verbs: view/create/edit/delete-where-authorized/approve/export/configure/report-access (SOW §22).
3. Reports reconcile: dashboard numbers = module reports for same filters (acceptance rule).
4. Exports (Excel/CSV/PDF) match on-screen totals; large exports via job, not request-timeout.
5. All config changes (rates/tax/tiers/hours/templates) audited + effective-dated.
6. Audit log is append-only and viewable/exportable by authorized roles.

## Data model
`app_user` (id, name, role, status) · `role_permission` (role, permission) · `app_config` (key, value json, effective_from, actor) · audit derived from module event logs (single viewer).

## API endpoints
`GET /api/v1/admin/overview` · `CRUD /api/v1/admin/users` · `CRUD /api/v1/admin/roles` · `GET /api/v1/reports/{reservations|occupancy|revenue|payments|refunds|membership|rfid|operations}?filters=` · `POST /api/v1/exports` (job) · `GET /api/v1/audit?filters=` · `CRUD /api/v1/config/{key}`.

## Screens
Master dashboard, user/role management, report library (filters + totals + export buttons), config panel per domain, audit viewer.

## Permissions
As matrix: SuperAdmin full; Manager approve + reports; others least-privilege per REQ-ERP08-002. Export/configure are separate permissions.

## Configuration options
Everything in REQ-ERP08-005; each key versioned + audited.

## Integrations/adapters
All module report providers; export workers (Excel/CSV/PDF); auth (sessions/JWT — Phase 2 ADR); notification on export-job completion.

## Events/audit entries
`user.created/disabled`, `role.changed`, `config.changed`, `report.exported`, `login/logout/failed-login`.

## Tests
RBAC matrix tests (deny-by-default), reconciliation spot-checks, export-totals tests, config-audit tests, pagination tests (no N+1).

## Known limits
Role matrix assumed until client confirms; report depth grows with Phases 3–4 (folio/OTA/RFID feeds).

## Change history
- 2026-10-09: Phase 1 baseline from SOW §§11/22/23 + assumed role matrix.
