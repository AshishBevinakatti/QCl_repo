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
  constructor(status: number, message: string, code?: string, details?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isAuthError(err: unknown): boolean {
  return err instanceof HttpError && err.status === 401;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') || (BASE && path.startsWith(BASE)) ? path : `${BASE}${path}`;
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type') && init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  const token = await getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await globalThis.fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string; code?: string; details?: Record<string, string>;
    };
    if (res.status === 401) {
      throw new HttpError(401, 'Not signed in — use Staff log in.', body.code, body.details);
    }
    if (res.status >= 500) {
      throw new HttpError(
        res.status,
        'Server error — your login is fine, but the backend may be missing its login config (runbook: docs/05-operations/keycloak.md).',
      );
    }
    throw new HttpError(res.status, body.message ?? `Request failed: ${res.status}`, body.code, body.details);
  }
  return res;
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
  idType: string | null;
  preferences: string;
  status: string;
  mergedIntoId: string | null;
  memberId: string | null;
}

export interface GuestPage {
  items: GuestDto[];
  page: number;
  total: number;
}

export async function searchGuests(q: string): Promise<GuestPage> {
  const res = await apiFetch(`/api/v1/guests?search=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`guests failed: ${res.status}`);
  return res.json();
}

export async function guestById(id: string): Promise<GuestDto> {
  const res = await apiFetch(`/api/v1/guests/${id}`);
  if (!res.ok) throw new Error(`guest failed: ${res.status}`);
  return res.json();
}

export interface ReservationSummary {
  id: string;
  guestId: string;
  categoryId: string;
  checkinDate: string;
  checkoutDate: string;
  status: string;
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
export async function createGuest(name: string, phone: string): Promise<GuestDto> {
  const res = await apiFetch('/api/v1/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `create failed: ${res.status}`);
  }
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
export interface DashboardDto {
  date: string;
  arrivals: string[];
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
  reservationId?: string; folioId?: string; amount?: number;
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

export async function confirmPayment(gatewayRef: string, signature: string): Promise<void> {
  const res = await apiFetch('/api/v1/payments/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gatewayRef, signature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `confirm failed: ${res.status}`);
  }
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
