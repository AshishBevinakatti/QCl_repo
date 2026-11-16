import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Memberships, type Member } from "./Memberships";
import { ApiError, type Me } from "./api";

afterEach(cleanup);

const seMe: Me = {
  employee: { id: "emp-1", firstName: "Sam", lastName: "One", email: "sam@example.test", username: "sam.one", jobRole: "SALES_EXECUTIVE", status: "ACTIVE" },
  roles: ["SALES_EXECUTIVE"], permissions: ["memberships.register", "memberships.read_own"], modules: ["dashboard", "memberships"],
};
const mgrMe: Me = {
  ...seMe,
  employee: { ...seMe.employee!, id: "emp-9", firstName: "Mohan", lastName: "Mgr", username: "mohan.mgr", jobRole: "MANAGER" },
  roles: ["MANAGER"],
  permissions: ["memberships.register", "memberships.read_own", "memberships.read_all", "memberships.verify"],
};

const pending: Member = {
  id: "m1", membershipId: "GRH-LM-0101", firstName: "Rohan", lastName: "Sharma", dob: "1990-05-17", mobile: "+919876543210",
  email: "rohan@example.test", address: "12 MG Road", tier: "GOLD", status: "PENDING_VERIFICATION",
  enrolledBy: { employeeId: "emp-1", name: "Sam One", username: "sam.one" }, decidedBy: null, decidedAt: null,
  validFrom: null, validUntil: null, accountStatus: "NOT_PROVISIONED", createdAt: "2026-11-16T10:00:00Z",
  payment: { type: "SCAN_QR", amount: "25000.00", currency: "INR", transactionId: "UTR1", status: "PENDING", rejectionReason: null,
    verifiedBy: null, decidedAt: null, proof: { fileName: "upi.png", contentType: "image/png", sizeBytes: 10, sha256: "ab" } },
};

type Handler = (init?: RequestInit) => unknown;
function fakeRequest(handlers: Record<string, Handler>) {
  return vi.fn(async (path: string, init?: RequestInit) => {
    // longest matching prefix wins, so "/x/next-number" beats "/x"
    const h = Object.entries(handlers).filter(([p]) => path.startsWith(p)).sort((a, b) => b[0].length - a[0].length)[0];
    if (!h) throw new Error("unexpected " + path);
    return h[1](init);
  }) as unknown as <T>(path: string, init?: RequestInit) => Promise<T>;
}

const page = (items: Member[], pendingCount: number | null = null) => ({ items, page: 0, size: 50, total: items.length, pendingCount });

function fill(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillCustomer() {
  fill("First name", "Rohan"); fill("Last name", "Sharma"); fill("Date of birth", "1990-05-17");
  fill(/Mobile/, "+91 98765 43210"); fill("Email", "rohan@example.test"); fill("Complete address", "12 MG Road, Vijayapura");
  fill("Amount received (₹)", "25000");
}

describe("Memberships — Sales Executive", () => {
  it("shows a provisional ID, the locked executive card and no verification queue", async () => {
    render(<Memberships me={seMe} request={fakeRequest({
      "/api/v1/sales/memberships/next-number": () => ({ membershipId: "GRH-LM-0107", provisional: true }),
      "/api/v1/sales/memberships": () => page([]),
    })} />);
    expect(await screen.findByText("GRH-LM-0107")).toBeTruthy();
    expect(screen.getByText(/provisional/i)).toBeTruthy();
    const card = screen.getByRole("group", { name: "Sales executive" });
    expect(within(card).getByText("Sam One")).toBeTruthy();
    expect(within(card).getByText("sam.one")).toBeTruthy();
    expect(screen.queryByRole("tab", { name: /Verification queue/ })).toBeNull();
  });

  it("registers a cash member as multipart with an idempotency key and shows the assigned ID", async () => {
    let sent: RequestInit | undefined;
    render(<Memberships me={seMe} request={fakeRequest({
      "/api/v1/sales/memberships/next-number": () => ({ membershipId: "GRH-LM-0101", provisional: true }),
      "/api/v1/sales/memberships": (init) => {
        if (init?.method === "POST") { sent = init; return { ...pending, membershipId: "GRH-LM-0102", payment: { ...pending.payment, type: "CASH", proof: null } }; }
        return page([]);
      },
    })} />);
    await screen.findByText("GRH-LM-0101");
    fillCustomer();
    fireEvent.click(screen.getByRole("button", { name: "Register member" }));
    expect(await screen.findByText(/GRH-LM-0102 is registered/)).toBeTruthy();
    const body = sent!.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("paymentType")).toBe("CASH");
    expect(body.get("amount")).toBe("25000");
    expect(body.get("email")).toBe("rohan@example.test");
    expect(new Headers(sent!.headers).get("Idempotency-Key")).toMatch(/[0-9a-f-]{36}/);
  });

  it("asks for a transaction ID only for card", async () => {
    render(<Memberships me={seMe} request={fakeRequest({
      "/api/v1/sales/memberships/next-number": () => ({ membershipId: "GRH-LM-0101", provisional: true }),
      "/api/v1/sales/memberships": () => page([]),
    })} />);
    await screen.findByText("GRH-LM-0101");
    expect(screen.queryByLabelText(/Transaction ID/)).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: /Card/ }));
    expect(screen.getByLabelText("Transaction ID")).toBeTruthy();
  });

  it("Scan QR offers gallery and camera, previews the screenshot and can remove it", async () => {
    render(<Memberships me={seMe} request={fakeRequest({
      "/api/v1/sales/memberships/next-number": () => ({ membershipId: "GRH-LM-0101", provisional: true }),
      "/api/v1/sales/memberships": () => page([]),
    })} />);
    await screen.findByText("GRH-LM-0101");
    fireEvent.click(screen.getByRole("radio", { name: /Scan QR/ }));
    const camera = screen.getByLabelText("Open camera") as HTMLInputElement;
    expect(camera.getAttribute("capture")).toBe("environment");
    expect(camera.accept).toBe("image/*");
    expect((screen.getByLabelText("Choose from gallery") as HTMLInputElement).getAttribute("capture")).toBeNull();
    expect(screen.getByText(/QR not configured|Scan to pay/)).toBeTruthy();

    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "upi.png", { type: "image/png" });
    fireEvent.change(camera, { target: { files: [file] } });
    expect(await screen.findByRole("img", { name: "Payment screenshot preview" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryByRole("img", { name: "Payment screenshot preview" })).toBeNull();
  });

  it("does not send Scan QR without a screenshot", async () => {
    const request = fakeRequest({
      "/api/v1/sales/memberships/next-number": () => ({ membershipId: "GRH-LM-0101", provisional: true }),
      "/api/v1/sales/memberships": () => page([]),
    });
    render(<Memberships me={seMe} request={request} />);
    await screen.findByText("GRH-LM-0101");
    fillCustomer();
    fireEvent.click(screen.getByRole("radio", { name: /Scan QR/ }));
    fireEvent.click(screen.getByRole("button", { name: "Register member" }));
    expect(await screen.findByText("Add the payment screenshot (gallery or camera).")).toBeTruthy();
    expect((request as unknown as { mock: { calls: unknown[][] } }).mock.calls.some(([, i]) => (i as RequestInit | undefined)?.method === "POST")).toBe(false);
  });

  it("shows the server's field errors next to the fields", async () => {
    render(<Memberships me={seMe} request={fakeRequest({
      "/api/v1/sales/memberships/next-number": () => ({ membershipId: "GRH-LM-0101", provisional: true }),
      "/api/v1/sales/memberships": (init) => {
        if (init?.method === "POST") throw new ApiError(400, { code: "VALIDATION_FAILED", message: "Some fields are invalid.", fields: { email: "Enter a valid email address." } } as never);
        return page([]);
      },
    })} />);
    await screen.findByText("GRH-LM-0101");
    fillCustomer();
    fireEvent.click(screen.getByRole("button", { name: "Register member" }));
    expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
  });

  it("lists my members", async () => {
    render(<Memberships me={seMe} request={fakeRequest({
      "/api/v1/sales/memberships/next-number": () => ({ membershipId: "GRH-LM-0102", provisional: true }),
      "/api/v1/sales/memberships": () => page([pending]),
    })} />);
    fireEvent.click(await screen.findByRole("tab", { name: /My members/ }));
    expect(await screen.findByText("Rohan Sharma")).toBeTruthy();
    expect(screen.getByText("Awaiting verification")).toBeTruthy();
  });
});

describe("Memberships — verification queue (Manager)", () => {
  it("shows the pending badge, opens the review and verifies", async () => {
    let verified = false;
    const other = { ...pending, enrolledBy: { employeeId: "emp-1", name: "Sam One", username: "sam.one" } };
    render(<Memberships me={mgrMe} request={fakeRequest({
      "/api/v1/sales/memberships/next-number": () => ({ membershipId: "GRH-LM-0102", provisional: true }),
      "/api/v1/sales/memberships": () => page([]),
      "/api/v1/admin/memberships/m1/proof": () => new Blob([new Uint8Array([1])], { type: "image/png" }),
      "/api/v1/admin/memberships/m1/verify": () => { verified = true; return { ...other, status: "ACTIVE" }; },
      "/api/v1/admin/memberships": () => page(verified ? [] : [other], verified ? 0 : 1),
    })} />);
    const tab = await screen.findByRole("tab", { name: /Verification queue/ });
    expect(within(tab).getByText("1")).toBeTruthy();
    fireEvent.click(tab);
    fireEvent.click(await screen.findByRole("button", { name: "Review GRH-LM-0101" }));
    const dialog = await screen.findByRole("dialog", { name: /GRH-LM-0101/ });
    expect(within(dialog).getByText("₹25,000.00")).toBeTruthy();
    expect(await within(dialog).findByRole("img", { name: "Payment screenshot" })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Verify & activate" }));
    await waitFor(() => expect(verified).toBe(true));
  });

  it("rejecting needs a reason", async () => {
    let body: string | undefined;
    render(<Memberships me={mgrMe} request={fakeRequest({
      "/api/v1/sales/memberships/next-number": () => ({ membershipId: "GRH-LM-0102", provisional: true }),
      "/api/v1/sales/memberships": () => page([]),
      "/api/v1/admin/memberships/m1/proof": () => new Blob([new Uint8Array([1])], { type: "image/png" }),
      "/api/v1/admin/memberships/m1/reject": (init) => { body = init?.body as string; return { ...pending, status: "REJECTED" }; },
      "/api/v1/admin/memberships": () => page([pending], 1),
    })} />);
    fireEvent.click(await screen.findByRole("tab", { name: /Verification queue/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Review GRH-LM-0101" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject" }));
    const confirm = within(dialog).getByRole("button", { name: "Confirm rejection" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText("Reason for rejecting"), { target: { value: "UTR not found in bank statement" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(JSON.parse(body!)).toEqual({ reason: "UTR not found in bank statement" }));
  });

  it("does not offer Verify on a registration the viewer enrolled", async () => {
    const mine = { ...pending, enrolledBy: { employeeId: "emp-9", name: "Mohan Mgr", username: "mohan.mgr" } };
    render(<Memberships me={mgrMe} request={fakeRequest({
      "/api/v1/sales/memberships/next-number": () => ({ membershipId: "GRH-LM-0102", provisional: true }),
      "/api/v1/sales/memberships": () => page([]),
      "/api/v1/admin/memberships/m1/proof": () => new Blob([new Uint8Array([1])], { type: "image/png" }),
      "/api/v1/admin/memberships": () => page([mine], 1),
    })} />);
    fireEvent.click(await screen.findByRole("tab", { name: /Verification queue/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Review GRH-LM-0101" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Verify & activate" })).toBeNull();
    expect(within(dialog).getByText(/You enrolled this member/)).toBeTruthy();
  });
});
