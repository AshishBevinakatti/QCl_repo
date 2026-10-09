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
