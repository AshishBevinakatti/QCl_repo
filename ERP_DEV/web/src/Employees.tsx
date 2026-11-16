// Employees admin (api.md §3; AUTHENTICATION §4, §8). The backend checks permissions; this only hides what can't be used.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError } from "./api";

export interface Employee {
  id: string; firstName: string; lastName: string; email: string; username: string; mobile: string;
  jobRole: string; status: string; statusReason: string | null; identityLinked: boolean;
}
interface Page<T> { items: T[]; page: number; size: number; total: number }
type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export const STATUS_LABELS: Record<string, string> = {
  PENDING_PROVISIONING: "Setting up",
  INVITED: "Invited",
  INVITE_EMAIL_FAILED: "Invite email failed",
  ACTIVE: "Active",
  DISABLED: "Disabled",
};
const ROLES = ["SALES_EXECUTIVE", "MANAGER", "ADMIN"];
const ROLE_LABELS: Record<string, string> = { SALES_EXECUTIVE: "Sales executive", MANAGER: "Manager", ADMIN: "Administrator" };
const ROLE_DESCRIPTIONS: Record<string, string> = {
  SALES_EXECUTIVE: "Front desk, guest bookings & enquiries",
  MANAGER: "Resort operations & shift oversight",
  ADMIN: "Security, employee roles & audit logs",
};
const EMPTY = { firstName: "", lastName: "", email: "", username: "", mobile: "", jobRole: "SALES_EXECUTIVE", whatsappOptIn: false };

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "GH";
}

export function Employees({ request, canManage, canAssignRoles = false }: { request: Request; canManage: boolean; canAssignRoles?: boolean }) {
  const [list, setList] = useState<Employee[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    request<Page<Employee>>("/api/v1/admin/employees?size=100").then((p) => setList(p.items), (e: Error) => setError(e.message));
  }, [request]);
  useEffect(load, [load]);

  async function act(path: string, init: RequestInit = { method: "POST" }) {
    setError(null);
    try {
      await request(path, init);
    } catch (e) {
      setError((e as Error).message);
    }
    load();
  }
  const base = (id: string) => `/api/v1/admin/employees/${id}`;
  // A reason is required for account changes; it goes into the audit trail (AUTHENTICATION §7).
  const withReason = (question: string, send: (reason: string) => void) => {
    const reason = window.prompt(question)?.trim();
    if (reason) send(reason);
  };
  const setActive = (e: Employee, active: boolean) => withReason(
    active ? `Why reactivate ${e.firstName} ${e.lastName}?` : `Why deactivate ${e.firstName} ${e.lastName}? They will be signed out everywhere.`,
    (reason) => void act(`${base(e.id)}/status`, { method: "PATCH", body: JSON.stringify({ active, reason }) }));
  const changeRole = (e: Employee, role: string) => withReason(`Why change ${e.firstName}'s role to ${role}?`,
    (reason) => void act(`${base(e.id)}/role`, { method: "PUT", body: JSON.stringify({ role, reason }) }));
  const filtered = list?.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${e.firstName} ${e.lastName}`.toLowerCase().includes(q)
      || e.username.toLowerCase().includes(q)
      || e.email.toLowerCase().includes(q)
      || (ROLE_LABELS[e.jobRole] ?? e.jobRole).toLowerCase().includes(q);
  });

  return (
    <section>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Employees</h1>
        <p>Manage staff accounts, assign operational roles, and oversee onboarding status.</p>
      </div>

      {canManage && <AddEmployee request={request} onCreated={load} />}

      {error && <p role="alert">{error}</p>}

      {!list ? (
        <p>Loading…</p>
      ) : (
        <div className="table-card">
          <div className="table-header-bar">
            <div className="table-title-group">
              <h2>Team Roster</h2>
              <span className="count-badge">
                {list.length} {list.length === 1 ? "Employee" : "Employees"}
              </span>
            </div>
            <div className="search-input-wrapper">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="search"
                placeholder="Search by name, email, or role…"
                value={search}
                onChange={(ev) => setSearch(ev.target.value)}
                aria-label="Filter employees"
              />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filtered ?? []).map((e) => {
                  const statusKey = e.status.toLowerCase();
                  return (
                    <tr key={e.id}>
                      <td>
                        <div className="user-cell">
                          <div className="row-avatar">{getInitials(e.firstName, e.lastName)}</div>
                          <div className="row-user-info">
                            <span className="row-name">{e.firstName} {e.lastName}</span>
                            <span className="row-sub">{e.mobile}</span>
                          </div>
                        </div>
                      </td>
                      <td>{e.username}</td>
                      <td>{e.email}</td>
                      <td>
                        <span className={`role-badge role-${e.jobRole.toLowerCase()}`}>
                          {ROLE_LABELS[e.jobRole] ?? e.jobRole}
                        </span>
                      </td>
                      <td title={e.statusReason ?? ""}>
                        <span className={`status-pill status-${statusKey}`}>
                          <span className="status-dot"></span>
                          <span>
                            {STATUS_LABELS[e.status] ?? e.status}
                            {e.statusReason ? ` — ${e.statusReason}` : ""}
                          </span>
                        </span>
                      </td>
                      <td className="actions" style={{ justifyContent: "flex-end" }}>
                        {canManage && (e.status === "PENDING_PROVISIONING" || (e.status === "INVITE_EMAIL_FAILED" && !e.identityLinked)) && (
                          <button className="btn-secondary" onClick={() => void act(`${base(e.id)}/retry-provisioning`)}>
                            Retry
                          </button>
                        )}
                        {canManage && e.identityLinked && (e.status === "INVITED" || e.status === "INVITE_EMAIL_FAILED") && (
                          <button className="btn-outline" onClick={() => void act(`${base(e.id)}/resend-invite`)}>
                            Resend invite
                          </button>
                        )}
                        {canManage && e.identityLinked && e.status !== "DISABLED" && (
                          <button className="btn-secondary" onClick={() => setActive(e, false)}>
                            Deactivate
                          </button>
                        )}
                        {canManage && e.status === "DISABLED" && (
                          <button className="btn-outline" onClick={() => setActive(e, true)}>
                            Activate
                          </button>
                        )}
                        {canAssignRoles && e.identityLinked && (
                          <select aria-label={`Role for ${e.username}`} value={e.jobRole} onChange={(ev) => changeRole(e, ev.target.value)}>
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function AddEmployee({ request, onCreated }: { request: Request; onCreated: () => void }) {
  const [form, setForm] = useState(EMPTY);
  // One key per submission: a double click or network retry can't create the employee twice.
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY) => (v: string | boolean) => setForm({ ...form, [k]: v });

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true); setFields({}); setMessage(null);
    try {
      const e = await request<Employee>("/api/v1/admin/employees", {
        method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(form),
      });
      setMessage(e.status === "INVITED"
        ? `${e.firstName} ${e.lastName} was invited. They will get an email to verify their address and set a password.`
        : `${e.firstName} ${e.lastName} was saved. ${e.statusReason ?? "Account setup will finish automatically."}`);
      setForm(EMPTY); setKey(crypto.randomUUID()); onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setFields((err.body as { fields?: Record<string, string> } | null)?.fields ?? {});
        if (err.status !== 422) setKey(crypto.randomUUID()); // corrected input = a new request
      }
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const input = (k: "firstName" | "lastName" | "email" | "username" | "mobile", label: string, type = "text", placeholder = "") => (
    <label>{label}
      <input
        type={type}
        required
        value={form[k]}
        placeholder={placeholder}
        onChange={(e) => set(k)(e.target.value)}
        aria-invalid={!!fields[k]}
      />
      {fields[k] && <small role="alert">{fields[k]}</small>}
    </label>
  );

  return (
    <div className="form-card">
      <div className="form-header">
        <div>
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            Add employee
          </h2>
          <p>Provide contact details and assign resort operational roles. Keycloak sends an account activation invite.</p>
        </div>
      </div>

      <form onSubmit={(e) => void submit(e)} aria-label="Add employee">
        <div className="form-row two-col">
          {input("firstName", "First name", "text", "e.g. Rohan")}
          {input("lastName", "Last name", "text", "e.g. Sharma")}
        </div>

        <div className="form-row three-col">
          {input("email", "Email", "email", "name@example.com")}
          {input("username", "Username", "text", "e.g. rohan")}
          {input("mobile", "Mobile (e.g. +91 98765 43210)", "tel", "+91 98765 43210")}
        </div>

        <fieldset className="role-cards-container">
          <legend>Job role</legend>
          <div className="role-cards">
            {ROLES.map((r) => {
              const isSelected = form.jobRole === r;
              return (
                <label key={r} className={`role-card${isSelected ? " selected" : ""}`}>
                  <div className="role-card-header">
                    <span>{ROLE_LABELS[r]}</span>
                    <input
                      type="radio"
                      name="jobRole"
                      value={r}
                      checked={isSelected}
                      onChange={() => set("jobRole")(r)}
                    />
                  </div>
                  <small>{r}</small>
                  <span className="role-desc">{ROLE_DESCRIPTIONS[r]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="form-footer">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.whatsappOptIn}
              onChange={(e) => set("whatsappOptIn")(e.target.checked)}
            />
            <span>WhatsApp notifications</span>
          </label>

          <button type="submit" disabled={busy}>
            {busy ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
                Add employee
              </>
            )}
          </button>
        </div>

        {message && <p role="status">{message}</p>}
      </form>
    </div>
  );
}

interface AuditEntry { id: string; occurredAt: string; actor: string; action: string; entityId: string | null; reason: string | null; outcome: string }

export function AuditLog({ request }: { request: Request }) {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    request<Page<AuditEntry>>("/api/v1/admin/audit?size=100").then((p) => setRows(p.items), (e: Error) => setError(e.message));
  }, [request]);

  return (
    <section>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Audit log</h1>
        <p>Immutable record of system security, employee access changes, and role assignments.</p>
      </div>

      {error && <p role="alert">{error}</p>}

      {!rows ? (
        <p>Loading…</p>
      ) : (
        <div className="table-card">
          <div className="table-header-bar">
            <div className="table-title-group">
              <h2>Security Events</h2>
              <span className="count-badge">{rows.length} Events Logged</span>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>What</th>
                  <th>Reason</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isSuccess = r.outcome.toUpperCase() === "SUCCESS";
                  return (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>
                        {new Date(r.occurredAt).toLocaleString()}
                      </td>
                      <td>
                        <strong style={{ color: "var(--ink)" }}>{r.actor}</strong>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.85rem", background: "var(--bg)", padding: "0.2rem 0.5rem", borderRadius: "4px", border: "1px solid var(--line)" }}>
                          {r.action}
                        </code>
                      </td>
                      <td>{r.reason ?? "—"}</td>
                      <td>
                        <span className={`status-pill ${isSuccess ? "status-active" : "status-failed"}`}>
                          <span className="status-dot"></span>
                          {r.outcome}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
