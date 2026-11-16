"use client";

import { useSyncExternalStore } from "react";
import { portalApi, type GuestUser, type InquiryRecord, type PortalMembership } from "./portal-client";
import { membershipCategories } from "./membership-data";
import { accessToken, initAuth, profile, signOutKeycloak } from "./guest-auth";

/* Who is signed in on the website, shared by /profile, the membership page
 * and the header (unit 3.30).
 *
 * Two kinds of session:
 * - "guest": a real ERP portal account (email + password via the lead
 *   service). Bookings come from the ERP.
 * - "sample": the membership-ID sign-in. The ERP has no website login by
 *   membership number, and does not record which booklet vouchers a member has
 *   used (its ERP-05 module tracks points and tiers only), so this session is
 *   SAMPLE DATA, and every screen that shows it says so.
 *
 * Membership on a guest account is also sample until the ERP links website
 * logins to member records.
 *
 * Since the Gold Membership increment (D-119…D-123) there is also a REAL
 * session: signed in with Keycloak (gh-guests, PKCE; guest-auth.ts). If the
 * account has a verified Gold Membership the kind is "member" and
 * `membership` is real (number, holder, validity, enrolling executive); usage
 * is 0 because the ERP does not record redemptions yet. Without a membership
 * the kind is "guest". The sample session above is unchanged. */

export type SampleMembership = {
  membershipNo: string;
  holder: string;
  validTo: string;
  /** True for a verified Gold Membership from the ERP (not sample data). */
  real?: boolean;
  validFrom?: string;
  /** The Sales Executive who enrolled the member; mobile only if they share it. */
  executive?: { name: string; username: string; mobile: string | null };
  /** Per booklet part (membership-data.ts ids): how many vouchers / coupons
   *  are marked used. Sample figures, not ERP data. */
  used: Record<string, { vouchers: number; coupons: number }>;
};

export type Session = {
  kind: "guest" | "sample" | "member";
  user: GuestUser;
  membership: SampleMembership | null;
};

const MEMBER_KEY = "ghr_sample_membership";
const KIND_KEY = "ghr_session_kind";
const EVENT = "ghr-session";

/** A plausible spread of use: some of every part, more of the cheap coupons. */
function sampleUsage(): SampleMembership["used"] {
  const used: SampleMembership["used"] = {};
  membershipCategories.forEach((c, i) => {
    used[c.id] = {
      vouchers: Math.min(c.vouchersCount, Math.round(c.vouchersCount * [0.25, 0.4, 0.2, 0.6, 0.1, 0, 0.5][i % 7])),
      coupons: Math.min(c.couponsCount, Math.round(c.couponsCount * [0, 0.3, 0.35, 0.2, 0, 0.25, 0.5][i % 7])),
    };
  });
  return used;
}

export function makeSampleMembership(holder: string, membershipNo = "GRH-LM-0000"): SampleMembership {
  const validTo = new Date();
  validTo.setMonth(validTo.getMonth() + 8);
  return { membershipNo, holder, validTo: validTo.toISOString().slice(0, 10), used: sampleUsage() };
}

/* --- Store ----------------------------------------------------------------
 * localStorage holds the session; a custom event lets every component on the
 * page update together when someone signs in or out. */

let cache: Session | null | undefined;
let cacheKey = "";

/* --- Real (Keycloak) session ------------------------------------------------
 * Loaded once per page: keycloak-js finishes a sign-in redirect or silently
 * checks the session, then the membership is fetched with the token. */

let real: Session | null = null;
let realStarted = false;

/** "2027-11-16T10:00:00Z" -> "2027-11-16" in resort time (IST). */
function istDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function toMembership(m: PortalMembership): SampleMembership {
  const used: SampleMembership["used"] = {};
  membershipCategories.forEach((c) => { used[c.id] = { vouchers: 0, coupons: 0 }; });
  return {
    membershipNo: m.membershipId,
    holder: `${m.firstName} ${m.lastName}`.trim(),
    validFrom: istDate(m.validFrom),
    validTo: istDate(m.validUntil),
    used,
    real: true,
    executive: m.enrolledBy,
  };
}

async function loadReal() {
  if (!(await initAuth())) return;
  const p = profile();
  const token = await accessToken();
  if (!p || !token) return;
  let membership: SampleMembership | null = null;
  try {
    const m = await portalApi.getMyMembership(token);
    membership = m ? toMembership(m) : null;
  } catch {
    /* membership service unreachable: signed in, membership unknown */
  }
  real = {
    kind: membership ? "member" : "guest",
    user: { guestId: p.sub, name: p.name || p.email, email: p.email, phone: "", token },
    membership,
  };
  announce();
  // Arrived from the welcome email (or a sign-in started on the membership page): show the card.
  const url = new URL(window.location.href);
  if (url.searchParams.get("welcome") === "1") {
    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", url.pathname + url.search + "#your-card");
    setTimeout(() => document.getElementById("your-card")?.scrollIntoView({ behavior: "smooth" }), 300);
  }
}

function read(): Session | null {
  if (real) return real;
  const user = portalApi.getStoredUser();
  let kind: Session["kind"] = "guest";
  let membership: SampleMembership | null = null;
  try {
    kind = localStorage.getItem(KIND_KEY) === "sample" ? "sample" : "guest";
    const raw = localStorage.getItem(MEMBER_KEY);
    membership = raw ? (JSON.parse(raw) as SampleMembership) : null;
  } catch {
    /* storage blocked: treat as signed out */
  }
  const key = JSON.stringify([user, kind, membership]);
  if (key === cacheKey && cache !== undefined) return cache;
  cacheKey = key;
  cache = user ? { kind, user, membership } : null;
  return cache;
}

function subscribe(callback: () => void) {
  if (!realStarted) {
    realStarted = true;
    void loadReal();
  }
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

/** The signed-in session, or null. Always null on the server and during
 *  hydration, so the first paint matches the prerendered page. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

function announce() {
  window.dispatchEvent(new Event(EVENT));
}

export function startGuestSession(user: GuestUser) {
  portalApi.setStoredUser(user);
  try { localStorage.setItem(KIND_KEY, "guest"); } catch { /* ignore */ }
  announce();
}

export function startSampleSession(membershipNo: string) {
  const membership = makeSampleMembership("Sample Member", membershipNo);
  portalApi.setStoredUser({
    guestId: `sample-${membershipNo}`,
    name: membership.holder,
    email: "",
    phone: "",
    token: "",
  });
  try {
    localStorage.setItem(KIND_KEY, "sample");
    localStorage.setItem(MEMBER_KEY, JSON.stringify(membership));
  } catch { /* ignore */ }
  announce();
}

/** Attach a sample membership to the signed-in guest account. */
export function linkSampleMembership(holder: string, membershipNo: string) {
  try { localStorage.setItem(MEMBER_KEY, JSON.stringify(makeSampleMembership(holder, membershipNo))); } catch { /* ignore */ }
  announce();
}

export function signOut() {
  const wasReal = real !== null;
  real = null;
  portalApi.logout();
  try {
    localStorage.removeItem(KIND_KEY);
    localStorage.removeItem(MEMBER_KEY);
  } catch { /* ignore */ }
  announce();
  // A real session also ends at Keycloak, then comes back to this page.
  if (wasReal) void signOutKeycloak(window.location.pathname);
}

/* --- Bookings -------------------------------------------------------------- */

export type Booking = InquiryRecord & { sample?: boolean };

/** Booking requests split around today by check-out date. */
export function splitBookings(list: Booking[]) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = list.filter((b) => b.checkoutDate >= today).sort((a, b) => a.checkinDate.localeCompare(b.checkinDate));
  const past = list.filter((b) => b.checkoutDate < today).sort((a, b) => b.checkinDate.localeCompare(a.checkinDate));
  return { upcoming, past };
}

/** Sample bookings for the membership-ID (sample) session only. */
export function sampleBookings(): Booking[] {
  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const base = { name: "Sample Member", email: "", phone: "", priority: "NORMAL", slaDeadline: "", slaBreached: false, sample: true };
  return [
    { ...base, id: "s1", publicReference: "SAMPLE-1", checkinDate: day(21), checkoutDate: day(23), roomCategory: "Poolside Cottage", guestCount: 2, status: "CONFIRMED", createdAt: day(-3) },
    { ...base, id: "s2", publicReference: "SAMPLE-2", checkinDate: day(-40), checkoutDate: day(-38), roomCategory: "Suite Room", guestCount: 2, status: "COMPLETED", createdAt: day(-60) },
    { ...base, id: "s3", publicReference: "SAMPLE-3", checkinDate: day(-95), checkoutDate: day(-94), roomCategory: "Premium Room — Queen", guestCount: 2, status: "COMPLETED", createdAt: day(-110) },
  ];
}
