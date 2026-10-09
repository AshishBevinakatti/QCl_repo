/**
 * Typed API client for the erp-app contract (see docs/02-architecture/api.md).
 * Generated-from-OpenAPI comes in Phase 3.1+; this hand client covers the
 * 3.0 shell endpoints with the same envelope/error shapes.
 */
const BASE = import.meta.env.VITE_API_URL ?? '';

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
  const res = await fetch(`${BASE}/api/v1/health`);
  if (!res.ok) throw new Error(`health failed: ${res.status}`);
  return res.json();
}

export async function listCategories(): Promise<CategoryPage> {
  const res = await fetch(`${BASE}/api/v1/room-categories`);
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
}

export interface GuestPage {
  items: GuestDto[];
  page: number;
  total: number;
}

export async function searchGuests(q: string): Promise<GuestPage> {
  const res = await fetch(`/api/v1/guests?search=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`guests failed: ${res.status}`);
  return res.json();
}
export async function createGuest(name: string, phone: string): Promise<GuestDto> {
  const res = await fetch('/api/v1/guests', {
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
  const res = await fetch(`/api/v1/availability?categoryId=${categoryId}&from=${from}&to=${to}`);
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
  const res = await fetch(`/api/v1/front-office/dashboard?date=${date}`);
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
  const res = await fetch(url, {
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
  const res = await fetch('/api/v1/housekeeping/board');
  if (!res.ok) throw new Error(`board failed: ${res.status}`);
  return res.json();
}

export async function advanceTask(id: string): Promise<TaskDto> {
  const res = await fetch(`/api/v1/housekeeping/tasks/${id}/advance`, { method: 'PATCH' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `advance failed: ${res.status}`);
  }
  return res.json();
}
export async function bookRoom(
  name: string, phone: string, categoryId: string, from: string, to: string, promo?: string,
): Promise<ReservationDto> {
  const res = await fetch('/api/v1/reservations', {
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
