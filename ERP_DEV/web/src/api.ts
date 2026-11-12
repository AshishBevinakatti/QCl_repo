/**
 * Typed API client for the erp-app contract (see docs/02-architecture/api.md).
 * Generated-from-OpenAPI comes in Phase 3.1+; this hand client covers the
 * 3.0 shell endpoints with the same envelope/error shapes.
 */
const BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Single fetch entry point: same-origin/dev-proxy path handling plus the
 * staff JWT when logged in (Keycloak SSO). Server enforces roles; the token
 * here only identifies the caller.
 *
 * Errors carry their HTTP status (HttpError) so screens can tell "log in"
 * (401) apart from "server is misconfigured" (5xx) — lesson 2026-10-10.
 */
import { getToken } from './auth';

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: Record<string, string>;
  requestId?: string;
  constructor(
    status: number,
    message: string,
    code?: string,
    details?: Record<string, string>,
    requestId?: string,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export function isAuthError(err: unknown): boolean {
  return err instanceof HttpError && err.status === 401;
}

/**
 * Today's date as YYYY-MM-DD in the resort's business timezone (Asia/Kolkata).
 * The backend gates all day-level logic on this zone (BookingService.ZONE);
 * the browser's UTC date desynced screens between 00:00–05:30 IST — fixed in 3.8.
 */
export function businessToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') || (BASE && path.startsWith(BASE)) ? path : `${BASE}${path}`;
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type') && init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('X-Request-Id')) {
    headers.set('X-Request-Id', newRequestId());
  }
  const token = await getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await globalThis.fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string; code?: string; details?: Record<string, string>; requestId?: string;
    };
    if (res.status === 401) {
      throw new HttpError(
        401, 'Not signed in — use Staff log in.', body.code, body.details, body.requestId,
      );
    }
    if (res.status >= 500) {
      throw new HttpError(
        res.status,
        'Server error — your login is fine, but the backend may be missing its login config (runbook: docs/05-operations/keycloak.md).',
        body.code,
        body.details,
        body.requestId,
      );
    }
    throw new HttpError(
      res.status,
      body.message ?? `Request failed: ${res.status}`,
      body.code,
      body.details,
      body.requestId,
    );
  }
  return res;
}

function newRequestId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export interface CategoryDto {
  id: string;
  name: string;
  basePricePaise: number;
  currency: string;
  capacity: number;
}

export interface CategoryPage {
  items: CategoryDto[];
  page: number;
  total: number;
}

export async function apiHealth(): Promise<{ status: string; service: string }> {
  const res = await apiFetch(`${BASE}/api/v1/health`);
  if (!res.ok) throw new Error(`health failed: ${res.status}`);
  return res.json();
}

export async function listCategories(): Promise<CategoryPage> {
  const res = await apiFetch(`${BASE}/api/v1/room-categories`);
  if (!res.ok) throw new Error(`categories failed: ${res.status}`);
  return res.json();
}

export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export interface GuestDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  idType: string | null;
  preferences: string;
  status: string;
  mergedIntoId: string | null;
  memberId: string | null;
}

export interface GuestProfileGuest {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  idType: string | null;
  status: string;
  memberId: string | null;
}

export interface GuestMembership {
  id: string;
  membershipNo: string;
  tier: string;
  status: string;
  validFrom: string | null;
  validTo: string;
  points: number;
}

export interface GuestReservation {
  reservationId: string;
  reference: string;
  status: string;
  source: string;
  categoryId: string;
  categoryName: string | null;
  checkinDate: string;
  checkoutDate: string;
  nights: number;
  roomId: string | null;
  roomNo: string | null;
  roomStatus: string | null;
  stayId: string | null;
  stayStatus: string | null;
  checkinAt: string | null;
  checkoutAt: string | null;
}

export interface GuestInvoice {
  id: string;
  status: string;
  totalPaise: number;
  issuedAt: string | null;
}

export interface GuestPaymentAlert {
  paymentId: string;
  status: string;
  amountPaise: number;
  createdAt: string;
}

export interface GuestBilling {
  folioId: string | null;
  stayId: string | null;
  status: string | null;
  chargesPaise: number;
  paymentsPaise: number;
  creditsPaise: number;
  outstandingPaise: number;
  advanceDuePaise: number | null;
  advancePaidPaise: number | null;
  invoice: GuestInvoice | null;
  paymentAlerts: GuestPaymentAlert[];
}

export interface GuestAlert {
  severity: string;
  text: string;
  ref: string | null;
}

export interface GuestPreference {
  key: string;
  label: string;
  value: string;
}

export interface GuestProfileDto {
  guest: GuestProfileGuest;
  membership: GuestMembership | null;
  currentStay: GuestReservation | null;
  nextReservation: GuestReservation | null;
  operationalState: string;
  reservations: GuestReservation[];
  reservationTotal: number;
  billing: GuestBilling;
  alerts: GuestAlert[];
  preferences: GuestPreference[];
}

export interface GuestPage {
  items: GuestDto[];
  page: number;
  total: number;
}

export async function searchGuests(q: string, page = 0, size = 20): Promise<GuestPage> {
  const params = new URLSearchParams({ search: q, page: String(page), size: String(size) });
  const res = await apiFetch(`/api/v1/guests?${params}`);
  if (!res.ok) throw new Error(`guests failed: ${res.status}`);
  return res.json();
}

export async function guestById(id: string): Promise<GuestDto> {
  const res = await apiFetch(`/api/v1/guests/${id}`);
  if (!res.ok) throw new Error(`guest failed: ${res.status}`);
  return res.json();
}

export async function guestProfile(id: string): Promise<GuestProfileDto> {
  const res = await apiFetch(`/api/v1/guests/${id}/profile`);
  return res.json();
}

export interface ReservationSummary {
  id: string;
  guestId: string;
  categoryId: string;
  checkinDate: string;
  checkoutDate: string;
  status: string;
  advanceDuePaise: number;
}

/** Desk aid: bookings overlapping a date, so ids are visible (no memorising). */
export async function listReservations(date?: string, status?: string): Promise<ReservationSummary[]> {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (status) params.set('status', status);
  const res = await apiFetch(`/api/v1/reservations?${params}`);
  if (!res.ok) throw new Error(`reservations failed: ${res.status}`);
  const page = (await res.json()) as { items: ReservationSummary[] };
  return page.items;
}
export async function createGuest(name: string, phone: string, email?: string): Promise<GuestDto> {
  const res = await apiFetch('/api/v1/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(email ? { name, phone, email } : { name, phone }),
  });
  return res.json();
}

export interface GuestUpdate {
  name?: string;
  phone?: string;
  email?: string | null;
  idType?: string | null;
  reason?: string;
}

export async function updateGuest(id: string, body: GuestUpdate): Promise<GuestDto> {
  const res = await apiFetch(`/api/v1/guests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export interface AvailabilityDto {
  categoryId: string;
  from: string;
  to: string;
  totalRooms: number;
  booked: number;
  available: number;
}

export async function availability(categoryId: string, from: string, to: string): Promise<AvailabilityDto> {
  const res = await apiFetch(`/api/v1/availability?categoryId=${categoryId}&from=${from}&to=${to}`);
  if (!res.ok) throw new Error(`availability failed: ${res.status}`);
  return res.json();
}

export interface ReservationDto {
  id: string;
  guestId: string;
  categoryId: string;
  checkinDate: string;
  checkoutDate: string;
  nights: number;
  quotedTotalPaise: number;
  advanceDuePaise: number;
  status: string;
}
/** 3.8: arrivals arrive enriched from the dashboard endpoint (single batch). */
export interface ArrivalDto {
  id: string;
  guestName: string;
  category: string;
  checkinDate: string;
  checkoutDate: string;
  status: string;
  advanceDuePaise: number;
}

export interface DashboardDto {
  date: string;
  arrivals: ArrivalDto[];
  inHouse: string[];
  rooms: { id: string; roomNo: string; status: string }[];
  occupancy: { categoryId: string; category: string; total: number; occupied: number; free: number }[];
}

export async function dashboard(date: string): Promise<DashboardDto> {
  const res = await apiFetch(`/api/v1/front-office/dashboard?date=${date}`);
  if (!res.ok) throw new Error(`dashboard failed: ${res.status}`);
  return res.json();
}

export interface StayDto {
  id: string;
  reservationId: string;
  roomId: string;
  status: string;
}

async function stayAction(url: string, body: unknown): Promise<StayDto> {
  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `stay action failed: ${res.status}`);
  }
  return res.json();
}

export const checkIn = (reservationId: string, roomId?: string) =>
  stayAction('/api/v1/stays/check-in', { reservationId, ...(roomId ? { roomId } : {}) });
export const checkOut = (stayId: string) => stayAction(`/api/v1/stays/${stayId}/check-out`, {});
export const transferStay = (stayId: string, toRoomId: string, reason?: string) =>
  stayAction(`/api/v1/stays/${stayId}/transfer`, { toRoomId, reason });
export const walkIn = (name: string, phone: string, categoryId: string) =>
  stayAction('/api/v1/walk-ins', { name, phone, categoryId });

export interface TaskDto {
  id: string;
  roomId: string;
  assignee: string | null;
  status: string;
}

export interface RoomBoard {
  roomId: string;
  roomNo: string;
  status: string;
  openTasks: number;
}

export async function board(): Promise<RoomBoard[]> {
  const res = await apiFetch('/api/v1/housekeeping/board');
  if (!res.ok) throw new Error(`board failed: ${res.status}`);
  return res.json();
}
export async function advanceTask(id: string): Promise<TaskDto> {
  const res = await apiFetch(`/api/v1/housekeeping/tasks/${id}/advance`, { method: 'PATCH' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `advance failed: ${res.status}`);
  }
  return res.json();
}

export interface FolioDto {
  id: string;
  entries: { sourceType: string; sourceId: string; amountPaise: number }[];
  outstandingPaise: number;
}

export async function folioByStay(stayId: string): Promise<FolioDto> {
  const res = await apiFetch(`/api/v1/folios?stayId=${stayId}`);
  if (!res.ok) throw new Error(`folio failed: ${res.status}`);
  return res.json();
}

export interface InitiateDto {
  paymentId: string;
  gatewayRef: string;
  amountPaise: number;
  signature: string;
  replayed: boolean;
}

export async function initiatePayment(body: {
  reservationId?: string; folioId?: string; amount?: number; idempotencyKey?: string;
}): Promise<InitiateDto> {
  const res = await apiFetch('/api/v1/payments/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `initiate failed: ${res.status}`);
  }
  return res.json();
}

export interface CapturedPaymentDto {
  id: string;
  bookingId: string | null;
  amountPaise: number;
  status: string;
  gatewayRef: string;
}

export async function confirmPayment(gatewayRef: string, signature: string): Promise<CapturedPaymentDto> {
  const res = await apiFetch('/api/v1/payments/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gatewayRef, signature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `confirm failed: ${res.status}`);
  }
  return res.json();
}
export async function requestRefund(paymentId: string, amountPaise: number, reason: string) {
  const res = await apiFetch('/api/v1/refunds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, amountPaise, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `refund failed: ${res.status}`);
  }
  return res.json();
}

export interface MemberDto {
  id: string;
  guestId: string;
  membershipNo: string;
  tier: string;
  status: string;
  validTo: string;
  points: number;
}

export async function enrollMember(guestId: string): Promise<MemberDto> {
  const res = await apiFetch('/api/v1/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `enroll failed: ${res.status}`);
  }
  return res.json();
}

export async function memberDashboard(id: string): Promise<MemberDto> {
  const res = await apiFetch(`/api/v1/members/${id}`);
  if (!res.ok) throw new Error(`member failed: ${res.status}`);
  return res.json();
}

export async function redeemPoints(memberId: string, folioId: string, points: number): Promise<MemberDto> {
  const res = await apiFetch(`/api/v1/members/${memberId}/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folioId, points }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `redeem failed: ${res.status}`);
  }
  return res.json();
}
export async function bookRoom(
  name: string, phone: string, categoryId: string, from: string, to: string, promo?: string,
): Promise<ReservationDto> {
  const res = await apiFetch('/api/v1/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({
      newGuest: { name, phone }, categoryId, checkinDate: from, checkoutDate: to,
      ...(promo ? { promoCode: promo } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `booking failed: ${res.status}`);
  }
  return res.json();
}

/** 3.8 short-ref search: the 8-char ref shown on every row is the id prefix. */
export async function searchReservationsByRef(ref: string): Promise<ReservationSummary[]> {
  const res = await apiFetch(`/api/v1/reservations/search?ref=${encodeURIComponent(ref)}`);
  if (!res.ok) throw new Error(`reservation search failed: ${res.status}`);
  const page = (await res.json()) as { items: ReservationSummary[] };
  return page.items;
}

/** Desk confirm: hold → confirmed (backend advance gate; a 422 tells what is missing). */
export async function confirmReservation(id: string): Promise<ReservationDto> {
  const res = await apiFetch(`/api/v1/reservations/${id}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `confirm failed: ${res.status}`);
  }
  return res.json();
}

export interface EnrichedReservation {
  id: string;
  ref: string;
  guestName: string;
  category: string;
  checkinDate: string;
  checkoutDate: string;
  status: string;
  advanceDuePaise: number;
}

/**
 * 3.8: list DTOs already carry dates/status/advance — only guest names are
 * missing. One guest lookup per row (≤8), no per-row reservation refetch.
 */
export async function enrichSummaries(
  items: ReservationSummary[], categories: CategoryDto[],
): Promise<EnrichedReservation[]> {
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';
  return Promise.all(items.map(async (r) => {
    let guestName = '—';
    try {
      guestName = (await guestById(r.guestId)).name;
    } catch { /* keep placeholder */ }
    return {
      id: r.id, ref: r.id.slice(0, 8), guestName, category: catName(r.categoryId),
      checkinDate: r.checkinDate, checkoutDate: r.checkoutDate, status: r.status,
      advanceDuePaise: r.advanceDuePaise,
    };
  }));
}

/** Short human-friendly booking ref for the desk (full UUID stays one click away). */
export function shortRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export interface DepartureDto {
  stayId: string;
  reservationId: string;
  guestName: string;
  roomNo: string;
  checkinDate: string;
  checkoutDate: string;
  nights: number;
  outstandingPaise: number;
  status: string;
}

export async function departures(date: string): Promise<DepartureDto[]> {
  const res = await apiFetch(`/api/v1/departures?date=${date}`);
  if (!res.ok) throw new Error(`departures failed: ${res.status}`);
  return res.json();
}

export interface InHouseDto {
  stayId: string;
  guestName: string;
  roomNo: string;
  checkoutDate: string | null;
  status: string;
}

export async function inHouseGuests(): Promise<InHouseDto[]> {
  const res = await apiFetch('/api/v1/in-house');
  if (!res.ok) throw new Error(`in-house failed: ${res.status}`);
  return res.json();
}

export interface AlertDto {
  severity: string;
  text: string;
  ref: string;
}

export async function alerts(): Promise<AlertDto[]> {
  const res = await apiFetch('/api/v1/alerts');
  if (!res.ok) throw new Error(`alerts failed: ${res.status}`);
  return res.json();
}

/* ---------------- Ops console (Phase 1: read-only) ---------------- */

export interface OpsSource {
  id: string;
  state: string;
  configured: boolean;
  observedAt: string;
  lastSuccessAt: string | null;
  detail: string;
}

export interface OpsTelemetry {
  configured: boolean;
  stale: boolean;
  lastCheckedAt: string;
  sources: OpsSource[];
}

export interface OpsService {
  name: string;
  version: string;
  state: string;
  observedAt: string;
  uptimeSeconds: number;
  database: { state: string; latencyMs: number };
}

export interface OpsStatus {
  generatedAt: string;
  state: string;
  environment: string;
  service: OpsService;
  telemetry: OpsTelemetry;
  links: Record<string, string>;
}

export interface OpsFlag {
  key: string;
  value: string;
  type: string;
  updatedBy: string;
  updatedAt: string | null;
}

export interface OpsFlags {
  generatedAt: string;
  items: OpsFlag[];
}

export interface OpsAuditEntry {
  id: string;
  actor: string;
  action: string;
  objectType: string;
  objectId: string;
  before: string | null;
  after: string | null;
  reason: string | null;
  createdAt: string;
}

export interface OpsAuditPage {
  items: OpsAuditEntry[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export async function opsStatus(): Promise<OpsStatus> {
  const res = await apiFetch('/api/v1/ops/status');
  return res.json();
}

export async function opsIntegrations(): Promise<OpsTelemetry> {
  const res = await apiFetch('/api/v1/ops/integrations');
  return res.json();
}

export async function opsFlags(): Promise<OpsFlags> {
  const res = await apiFetch('/api/v1/ops/flags');
  return res.json();
}

export async function opsAudit(
  page = 0,
  size = 25,
  action?: string,
  days = 7,
): Promise<OpsAuditPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size), days: String(days) });
  if (action) params.set('action', action);
  const res = await apiFetch(`/api/v1/ops/audit?${params}`);
  return res.json();
}
