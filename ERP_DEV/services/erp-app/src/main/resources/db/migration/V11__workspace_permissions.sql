-- V11: every erp-app endpoint is now checked against role_permission (@perm.has).
-- [ASSUMED] Q-003 — placeholder defaults until the client's roles matrix arrives.
-- They reproduce the access the controllers granted before this unit, plus:
-- sales roles (leads + view-only guests), MEMBERSHIP guest lookup, and read
-- endpoints that were open to any logged-in user are now limited to the roles that use them.

INSERT INTO role_permission (role, permission) VALUES
  ('RECEPTION', 'frontdesk:view'), ('RECEPTION', 'bookings:view'), ('RECEPTION', 'members:enroll'),
  ('RECEPTION', 'members:view'), ('RECEPTION', 'members:redeem'), ('RECEPTION', 'config:view'),
  ('MEMBERSHIP', 'guests:view'), ('MEMBERSHIP', 'members:view'), ('MEMBERSHIP', 'members:redeem'),
  ('MEMBERSHIP', 'members:renew'),
  ('ACCOUNTS', 'members:view'), ('ACCOUNTS', 'members:redeem'), ('ACCOUNTS', 'config:view'),
  ('SALES_EXEC', 'leads:manage'), ('SALES_EXEC', 'guests:view'),
  ('SALES_SUPERVISOR', 'leads:manage'), ('SALES_SUPERVISOR', 'guests:view'),
  ('MANAGER', 'frontdesk:view'), ('MANAGER', 'bookings:view'), ('MANAGER', 'bookings:create'),
  ('MANAGER', 'bookings:edit'), ('MANAGER', 'stays:checkin'), ('MANAGER', 'guests:view'),
  ('MANAGER', 'guests:edit'), ('MANAGER', 'guests:merge'), ('MANAGER', 'payments:collect'),
  ('MANAGER', 'invoices:manage'), ('MANAGER', 'refunds:manage'), ('MANAGER', 'reports:financial'),
  ('MANAGER', 'members:enroll'), ('MANAGER', 'members:link'), ('MANAGER', 'members:view'),
  ('MANAGER', 'members:redeem'), ('MANAGER', 'members:renew'), ('MANAGER', 'housekeeping:tasks'),
  ('MANAGER', 'leads:manage'), ('MANAGER', 'config:view');
