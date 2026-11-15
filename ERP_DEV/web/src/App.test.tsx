import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Dashboard, SignIn } from "./App";
import type { Me } from "./api";

afterEach(cleanup);

const admin: Me = {
  employee: { id: "1", firstName: "Asha", lastName: "Rao", email: "a@example.test", username: "asha.rao", jobRole: "ADMIN", status: "ACTIVE" },
  roles: ["ADMIN"], permissions: ["employees.read"], modules: ["dashboard", "employees", "audit"],
};

describe("SignIn", () => {
  it("only offers a redirect to Keycloak, never a password field", () => {
    const onSignIn = vi.fn();
    const { container } = render(<SignIn onSignIn={onSignIn} />);
    expect(container.querySelector("input[type=password]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSignIn).toHaveBeenCalled();
  });
});

describe("Dashboard", () => {
  it("shows the employee and only the modules /me allows", async () => {
    render(<Dashboard loadMe={() => Promise.resolve(admin)} onSignOut={() => {}} />);
    expect(await screen.findByText("Welcome, Asha Rao")).toBeTruthy();
    const links = screen.getAllByRole("link").map((a) => a.textContent);
    expect(links).toEqual(["Dashboard", "Employees", "Audit log"]);
  });

  it("explains when the ERP record is missing", async () => {
    render(<Dashboard loadMe={() => Promise.resolve({ ...admin, employee: null })} onSignOut={() => {}} />);
    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it("signs out", async () => {
    const onSignOut = vi.fn();
    render(<Dashboard loadMe={() => Promise.resolve(admin)} onSignOut={onSignOut} />);
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalled();
  });
});
