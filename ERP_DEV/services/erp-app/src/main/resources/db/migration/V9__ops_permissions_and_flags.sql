-- V9: observability/ops console Phase 1 — read-only ops roles, permissions and module flags.
-- Forward-only. Ops roles are separate from the resort OPS (facilities) role.
-- Phase 1 uses *_READ permissions only; write permissions arrive with their features.

INSERT INTO role_permission (role, permission) VALUES
  ('OPS_VIEWER', 'ops.read'),
  ('OPS_VIEWER', 'ops.integrations.read'),
  ('OPS_VIEWER', 'ops.flags.read'),
  ('OPS_VIEWER', 'ops.metrics.read'),
  ('OPS_VIEWER', 'ops.alerts.read'),
  ('OPS_DEVELOPER', 'ops.read'),
  ('OPS_DEVELOPER', 'ops.integrations.read'),
  ('OPS_DEVELOPER', 'ops.flags.read'),
  ('OPS_DEVELOPER', 'ops.metrics.read'),
  ('OPS_DEVELOPER', 'ops.alerts.read'),
  ('OPS_DEVELOPER', 'ops.logs.read'),
  ('OPS_DEVELOPER', 'ops.traces.read'),
  ('OPS_DEVELOPER', 'ops.jobs.read'),
  ('OPS_OPERATOR', 'ops.read'),
  ('OPS_OPERATOR', 'ops.integrations.read'),
  ('OPS_OPERATOR', 'ops.flags.read'),
  ('OPS_OPERATOR', 'ops.metrics.read'),
  ('OPS_OPERATOR', 'ops.alerts.read'),
  ('OPS_OPERATOR', 'ops.incidents.read'),
  ('OPS_OPERATOR', 'ops.jobs.read'),
  ('OPS_OPERATOR', 'ops.deployments.read'),
  ('OPS_ADMIN', 'ops.read'),
  ('OPS_ADMIN', 'ops.integrations.read'),
  ('OPS_ADMIN', 'ops.flags.read'),
  ('OPS_ADMIN', 'ops.metrics.read'),
  ('OPS_ADMIN', 'ops.alerts.read'),
  ('OPS_ADMIN', 'ops.logs.read'),
  ('OPS_ADMIN', 'ops.traces.read'),
  ('OPS_ADMIN', 'ops.jobs.read'),
  ('OPS_ADMIN', 'ops.incidents.read'),
  ('OPS_ADMIN', 'ops.deployments.read'),
  ('OPS_ADMIN', 'ops.audit.read'),
  ('OPS_APPROVER', 'ops.read'),
  ('OPS_APPROVER', 'ops.integrations.read'),
  ('OPS_APPROVER', 'ops.flags.read'),
  ('OPS_APPROVER', 'ops.metrics.read'),
  ('OPS_APPROVER', 'ops.alerts.read'),
  ('OPS_APPROVER', 'ops.logs.read'),
  ('OPS_APPROVER', 'ops.traces.read'),
  ('OPS_APPROVER', 'ops.jobs.read'),
  ('OPS_APPROVER', 'ops.incidents.read'),
  ('OPS_APPROVER', 'ops.deployments.read'),
  ('OPS_APPROVER', 'ops.audit.read');

-- Optional add-ons stay off until separately approved (Q-005, Module 2 plan).
INSERT INTO app_config (config_key, config_value) VALUES
  ('module.restaurant.enabled', 'false'),
  ('module.guest_portal.enabled', 'false'),
  ('module.whatsapp.enabled', 'false');
