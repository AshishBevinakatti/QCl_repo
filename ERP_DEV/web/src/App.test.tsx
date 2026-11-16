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
  it("offers only the two role cards, never a password field", () => {
    const { container } = render(<SignIn onSignIn={() => {}} />);
    expect(container.querySelector("input[type=password]")).toBeNull();
    const titles = screen.getAllByRole("button").map((b) => b.querySelector("strong")?.textContent);
    expect(titles).toEqual(["Sales Admin", "Sales Executive"]);
  });

  it("starts the same Keycloak sign-in from every card", () => {
    const onSignIn = vi.fn();
    render(<SignIn onSignIn={onSignIn} />);
    fireEvent.click(screen.getByRole("button", { name: /Sales Executive/ }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });
});

describe("Dashboard", () => {
  it("shows the employee and only the modules /me allows", async () => {
    render(<Dashboard loadMe={() => Promise.resolve(admin)} onSignOut={() => {}} />);
    expect(await screen.findByText("Welcome, Asha Rao")).toBeTruthy();
    expect(screen.getByText(/Sales Admin/)).toBeTruthy(); // the token role, in friendly words
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
