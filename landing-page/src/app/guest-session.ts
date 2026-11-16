"use client";

import { useSyncExternalStore } from "react";
import { portalApi, type GuestUser, type InquiryRecord } from "./portal-client";
import { membershipCategories } from "./membership-data";

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
 * logins to member records. */

export type SampleMembership = {
  membershipNo: string;
  holder: string;
  validTo: string;
  /** Per booklet part (membership-data.ts ids): how many vouchers / coupons
   *  are marked used. Sample figures, not ERP data. */
  used: Record<string, { vouchers: number; coupons: number }>;
};

export type Session = {
  kind: "guest" | "sample";
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

export function makeSampleMembership(holder: string, membershipNo = "GHR-CM-0427"): SampleMembership {
  const validTo = new Date();
  validTo.setMonth(validTo.getMonth() + 8);
  return { membershipNo, holder, validTo: validTo.toISOString().slice(0, 10), used: sampleUsage() };
}

/* --- Store ----------------------------------------------------------------
 * localStorage holds the session; a custom event lets every component on the
 * page update together when someone signs in or out. */

let cache: Session | null | undefined;
let cacheKey = "";

function read(): Session | null {
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
  portalApi.logout();
  try {
    localStorage.removeItem(KIND_KEY);
    localStorage.removeItem(MEMBER_KEY);
  } catch { /* ignore */ }
  announce();
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
