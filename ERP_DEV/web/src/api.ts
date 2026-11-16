// Calls the API gateway with the employee's access token (AUTHENTICATION.md §5 "React token and session handling").
import { config } from "./config";
import type { Session } from "./auth";

export class ForbiddenError extends Error {}
export class SessionEndedError extends Error {}

export interface ApiErrorBody {
  code: string;
  message: string;
  correlationId?: string;
}

export class ApiError extends Error {
  constructor(public status: number, public body: ApiErrorBody | null) {
    super(body?.message ?? `Request failed (${status})`);
  }
}

export function createApi(session: Session, fetchFn: typeof fetch = fetch) {
  async function send(path: string, init: RequestInit, token: string) {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    // FormData (file uploads) must keep the browser's own multipart Content-Type with its boundary.
    if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetchFn(config.apiUrl + path, { ...init, headers });
  }

  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let token: string;
    try {
      token = await session.token();
    } catch {
      await session.login();
      throw new SessionEndedError();
    }
    let res = await send(path, init, token);
    if (res.status === 401) {
      // One refresh and retry; a second 401 means the session is over.
      try {
        res = await send(path, init, await session.refresh());
      } catch {
        await session.login();
        throw new SessionEndedError();
      }
      if (res.status === 401) {
        await session.login();
        throw new SessionEndedError();
      }
    }
    if (res.status === 403) throw new ForbiddenError();
    if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
    if (res.status === 204) return undefined as T;
    // Images (e.g. a payment screenshot) come back as a Blob; everything else is JSON.
    if ((res.headers.get("Content-Type") ?? "").startsWith("image/")) return (await res.blob()) as T;
    return (await res.json()) as T;
  };
}

export interface Me {
  employee: { id: string; firstName: string; lastName: string; email: string; username: string; jobRole: string; status: string } | null;
  roles: string[];
  permissions: string[];
  modules: string[];
}
