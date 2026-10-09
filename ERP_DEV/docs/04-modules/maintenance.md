# Maintenance & Service Requests

- Purpose: central workflow for maintenance + guest service requests. Audience: architects, Phase 4.3 builders. Last verified: 2026-10-09. Owner: project team.
- SOW: §20. REQs: REQ-HSK-002. Status: baselined (lite; guest-portal routing stubbed since ERP-10 excluded).

## Business rules
Request → department → assign → in-progress → resolved → closed + history/reports (SOW §20 example workflow). Priority + status mandatory; resolution notes required to close.

## Data model
`service_request` (id, source: housekeeping/guest-staff, department, assignee, priority, status, notes, room/facility ref).

## API/screens
`CRUD /api/v1/service-requests` + assign/resolve/close actions; queue board, reports.

## Permissions
Staff: create. Department heads: assign. Assignee: resolve. Manager: close + reports.

## Events/audit
Each transition audited with actor + note.

## Change history
- 2026-10-09: Phase 1 baseline from SOW §20.
