# Housekeeping & Room Readiness

- Purpose: cleaning tasks + live room status feeding reception. Audience: architects, Phase 3.3 builders. Last verified: 2026-10-09. Owner: project team.
- SOW: §19. REQs: REQ-HSK-001. Status: baselined.

## Business rules
1. Checkout → dirty task auto-created; cleaning → inspection → ready flips room status; reception sees within seconds (SOW §19 workflow).
2. Tasks assigned to staff; supervisor monitors; progress tracked; maintenance issues raised as maintenance requests (link, not duplicate).
3. Room status is single source of truth — front-office check-in reads it, never a copy.

## Data model
`housekeeping_task` (id, room_id, assignee, status: todo→doing→inspect→done, notes) · room status derived + cached for board.

## API/screens
`GET /api/v1/housekeeping/board` · `POST /api/v1/housekeeping/tasks` · `PATCH /api/v1/housekeeping/tasks/{id}`; board (room grid + status), task list, supervisor view, reports.

## Permissions
Housekeeping: tasks. Supervisor: assign/verify. Reception: read status (no task edits).

## Events/audit
`hsk.task-created/assigned/started/inspected/ready`, room-status flips with actor.

## Tests
Checkout-creates-task test, ready-flips-status test, reception-visibility test.

## Change history
- 2026-10-09: Phase 1 baseline from SOW §19.
