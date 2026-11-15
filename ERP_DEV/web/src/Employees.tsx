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
const EMPTY = { firstName: "", lastName: "", email: "", username: "", mobile: "", jobRole: "SALES_EXECUTIVE", whatsappOptIn: false };

export function Employees({ request, canManage, canAssignRoles = false }: { request: Request; canManage: boolean; canAssignRoles?: boolean }) {
  const [list, setList] = useState<Employee[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <section>
      <h1>Employees</h1>
      {canManage && <AddEmployee request={request} onCreated={load} />}
      {error && <p role="alert">{error}</p>}
      {!list ? <p>Loading…</p> : (
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Account</th><th></th></tr></thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td>{e.firstName} {e.lastName}</td><td>{e.username}</td><td>{e.email}</td><td>{e.jobRole}</td>
                <td title={e.statusReason ?? ""}>{STATUS_LABELS[e.status] ?? e.status}{e.statusReason ? ` — ${e.statusReason}` : ""}</td>
                <td className="actions">
                  {canManage && (e.status === "PENDING_PROVISIONING" || e.status === "INVITE_EMAIL_FAILED" && !e.identityLinked) &&
                    <button onClick={() => void act(`${base(e.id)}/retry-provisioning`)}>Retry</button>}
                  {canManage && e.identityLinked && (e.status === "INVITED" || e.status === "INVITE_EMAIL_FAILED") &&
                    <button onClick={() => void act(`${base(e.id)}/resend-invite`)}>Resend invite</button>}
                  {canManage && e.identityLinked && e.status !== "DISABLED" && <button onClick={() => setActive(e, false)}>Deactivate</button>}
                  {canManage && e.status === "DISABLED" && <button onClick={() => setActive(e, true)}>Activate</button>}
                  {canAssignRoles && e.identityLinked && (
                    <select aria-label={`Role for ${e.username}`} value={e.jobRole} onChange={(ev) => changeRole(e, ev.target.value)}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

  const input = (k: "firstName" | "lastName" | "email" | "username" | "mobile", label: string, type = "text") => (
    <label>{label}
      <input type={type} required value={form[k]} onChange={(e) => set(k)(e.target.value)} aria-invalid={!!fields[k]} />
      {fields[k] && <small role="alert">{fields[k]}</small>}
    </label>
  );

  return (
    <form onSubmit={(e) => void submit(e)} aria-label="Add employee">
      <h2>Add employee</h2>
      {input("firstName", "First name")}{input("lastName", "Last name")}
      {input("email", "Email", "email")}{input("username", "Username")}{input("mobile", "Mobile (e.g. +91 98765 43210)", "tel")}
      <label>Job role
        <select value={form.jobRole} onChange={(e) => set("jobRole")(e.target.value)}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <label><input type="checkbox" checked={form.whatsappOptIn} onChange={(e) => set("whatsappOptIn")(e.target.checked)} /> WhatsApp notifications</label>
      <button type="submit" disabled={busy}>{busy ? "Saving…" : "Add employee"}</button>
      {message && <p role="status">{message}</p>}
    </form>
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
      <h1>Audit log</h1>
      {error && <p role="alert">{error}</p>}
      {!rows ? <p>Loading…</p> : (
        <table>
          <thead><tr><th>When</th><th>Who</th><th>What</th><th>Reason</th><th>Outcome</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td>{new Date(r.occurredAt).toLocaleString()}</td><td>{r.actor}</td><td>{r.action}</td><td>{r.reason ?? ""}</td><td>{r.outcome}</td></tr>
          ))}</tbody>
        </table>
      )}
    </section>
  );
}
