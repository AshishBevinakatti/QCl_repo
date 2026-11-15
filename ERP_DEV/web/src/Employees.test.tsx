import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Employees, type Employee } from "./Employees";
import { ApiError } from "./api";

afterEach(cleanup);

const ravi: Employee = { id: "e1", firstName: "Ravi", lastName: "Kumar", email: "ravi@example.test", username: "ravi.kumar",
  mobile: "+919876543210", jobRole: "SALES_EXECUTIVE", status: "INVITED", statusReason: null, identityLinked: true };
const stuck: Employee = { ...ravi, id: "e2", username: "stuck", status: "INVITE_EMAIL_FAILED", statusReason: "Invite email could not be sent" };

function fakeRequest(handlers: Record<string, (init?: RequestInit) => unknown>) {
  return vi.fn(async (path: string, init?: RequestInit) => {
    const h = Object.entries(handlers).find(([p]) => path.startsWith(p));
    if (!h) throw new Error("unexpected " + path);
    return h[1](init);
  }) as unknown as <T>(path: string, init?: RequestInit) => Promise<T>;
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("Employees", () => {
  it("lists employees with readable account status", async () => {
    render(<Employees request={fakeRequest({ "/api/v1/admin/employees": () => ({ items: [ravi, stuck], page: 0, size: 100, total: 2 }) })} canManage />);
    expect(await screen.findByText("Invited")).toBeTruthy();
    expect(screen.getByText("Invite email failed — Invite email could not be sent")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Retry" })).toHaveLength(1);
  });

  it("hides the add form and retry for read-only users (MANAGER)", async () => {
    render(<Employees request={fakeRequest({ "/api/v1/admin/employees": () => ({ items: [stuck], page: 0, size: 100, total: 1 }) })} canManage={false} />);
    await screen.findByText("stuck");
    expect(screen.queryByRole("form", { name: "Add employee" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("creates with an Idempotency-Key and shows the invite message", async () => {
    let sent: RequestInit | undefined;
    const request = fakeRequest({
      "/api/v1/admin/employees?": () => ({ items: [], page: 0, size: 100, total: 0 }),
      "/api/v1/admin/employees": (init) => { sent = init; return { ...ravi }; },
    });
    render(<Employees request={request} canManage />);
    fill("First name", "Ravi"); fill("Last name", "Kumar"); fill("Email", "ravi@example.test");
    fill("Username", "ravi.kumar"); fill("Mobile (e.g. +91 98765 43210)", "+91 98765 43210");
    fireEvent.click(screen.getByRole("button", { name: "Add employee" }));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("was invited");
    expect(new Headers(sent!.headers).get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.parse(sent!.body as string)).toMatchObject({ email: "ravi@example.test", jobRole: "SALES_EXECUTIVE", whatsappOptIn: false });
  });

  it("shows the server's field errors next to the inputs", async () => {
    const request = fakeRequest({
      "/api/v1/admin/employees?": () => ({ items: [], page: 0, size: 100, total: 0 }),
      "/api/v1/admin/employees": () => { throw new ApiError(400, { code: "VALIDATION_FAILED", message: "Some fields are invalid.", fields: { mobile: "international format" } } as never); },
    });
    render(<Employees request={request} canManage />);
    fill("First name", "A"); fill("Last name", "B"); fill("Email", "a@b.test"); fill("Username", "ab1"); fill("Mobile (e.g. +91 98765 43210)", "123");
    fireEvent.click(screen.getByRole("button", { name: "Add employee" }));
    expect(await screen.findByText("international format")).toBeTruthy();
  });
});
