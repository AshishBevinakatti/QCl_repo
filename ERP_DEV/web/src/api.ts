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
