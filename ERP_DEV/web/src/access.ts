/**
 * Unit 3.15 — which screen needs which permission (SOW ERP-08).
 * Permissions come from the server (GET /api/v1/me, role_permission table);
 * the server enforces them too, so this file only decides what to show.
 */
import type { View } from './dashboard';

export type Perms = ReadonlySet<string>;

const VIEW_PERMISSIONS: Record<View, string[]> = {
  dashboard: ['frontdesk:view'],
  leads: ['leads:manage'],
  reservations: ['bookings:view'],
  guests: ['guests:view'],
  rooms: ['frontdesk:view'],
  check: ['stays:checkin'],
  billing: ['payments:collect', 'invoices:manage'],
  requests: ['housekeeping:tasks'],
  housekeeping: ['housekeeping:tasks'],
  reports: ['reports:view', 'reports:financial'],
  ops: ['ops.read'],
  settings: ['config:manage'],
};

/** First allowed screen wins: managers and reception land on the dashboard, every other department on its own desk. */
const LANDING_ORDER: View[] = ['dashboard', 'leads', 'housekeeping', 'billing', 'guests', 'ops', 'reservations'];

export function can(perms: Perms, ...wanted: string[]): boolean {
  return perms.has('*') || wanted.some((p) => perms.has(p));
}

export function canSee(view: View, perms: Perms): boolean {
  return can(perms, ...VIEW_PERMISSIONS[view]);
}

/** Null when the account has no workspace at all. */
export function landingView(perms: Perms): View | null {
  return LANDING_ORDER.find((v) => canSee(v, perms)) ?? null;
}

const DEPARTMENTS: Record<string, string> = {
  SUPERADMIN: 'Administrator',
  MANAGER: 'Management',
  RECEPTION: 'Front office',
  SALES_EXEC: 'Sales',
  SALES_SUPERVISOR: 'Sales supervisor',
  HOUSEKEEPING: 'Housekeeping',
  ACCOUNTS: 'Accounts',
  MEMBERSHIP: 'Membership',
  OPS_VIEWER: 'Operations',
  OPS_DEVELOPER: 'Operations',
  OPS_OPERATOR: 'Operations',
  OPS_ADMIN: 'Operations',
  OPS_APPROVER: 'Operations',
};

/** "Sales · Front office"; Keycloak default roles (offline_access …) are ignored. */
export function departmentLabel(roles: string[]): string {
  const labels = [...new Set(roles.map((r) => DEPARTMENTS[r]).filter(Boolean))];
  return labels.join(' · ') || 'Staff';
}

/**
 * Dev-only "Preview as" personas with SAMPLE permissions (mirror of the V2/V9/V11
 * seeds at the time of writing). Never used for a signed-in user.
 */
export const PREVIEW_PERSONAS: { id: string; label: string; roles: string[]; permissions: string[] }[] = [
  {
    id: 'manager', label: 'Management', roles: ['MANAGER'],
    permissions: [
      'frontdesk:view', 'bookings:view', 'bookings:create', 'bookings:edit', 'stays:checkin',
      'guests:view', 'guests:edit', 'payments:collect', 'invoices:manage', 'refunds:manage',
      'reports:view', 'reports:financial', 'housekeeping:tasks', 'leads:manage',
    ],
  },
  {
    id: 'reception', label: 'Front office', roles: ['RECEPTION'],
    permissions: ['frontdesk:view', 'bookings:view', 'bookings:create', 'bookings:edit', 'stays:checkin',
      'guests:view', 'guests:edit', 'payments:collect'],
  },
  { id: 'sales', label: 'Sales', roles: ['SALES_EXEC'], permissions: ['leads:manage', 'guests:view'] },
  { id: 'housekeeping', label: 'Housekeeping', roles: ['HOUSEKEEPING'], permissions: ['housekeeping:tasks'] },
  {
    id: 'accounts', label: 'Accounts', roles: ['ACCOUNTS'],
    permissions: ['payments:collect', 'invoices:manage', 'refunds:manage', 'reports:financial'],
  },
  { id: 'ops', label: 'Operations', roles: ['OPS_VIEWER'], permissions: ['ops.read'] },
];
