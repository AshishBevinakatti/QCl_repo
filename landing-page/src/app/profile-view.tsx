"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { portalApi } from "./portal-client";
import { linkSampleMembership, sampleBookings, signOut, splitBookings, useSession, type Booking } from "./guest-session";
import ProfileSignIn from "./profile-sign-in";
import BookletUsage from "./booklet-usage";
import { Sketch } from "./pencil";
import { ArrowRight } from "./icons";
import { MoreUpcoming, NextStay, PastPostcards } from "./profile-stays";

/* /profile (unit 3.30): the signed-in guest's bookings, upcoming and past,
 * and their membership booklet. Bookings for an email account are the guest's
 * real requests from the ERP lead service; the membership-ID session and all
 * membership usage are sample data, labelled where they appear. */

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function ProfileView() {
  const session = useSession();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    if (session.kind === "sample") {
      // Sample session: sample bookings, known in the browser only.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookings(sampleBookings());
      return;
    }
    let live = true;
    portalApi.getMyInquiries(session.user.token)
      .then((list) => { if (live) { setBookings(list); setError(null); } })
      .catch(() => { if (live) { setBookings([]); setError("We could not load your bookings just now. Please refresh in a moment."); } });
    return () => { live = false; };
  }, [session]);

  if (!session) {
    return (
      <section className="prof-out wrap" aria-labelledby="prof-title">
        <div className="prof-out-text">
          <p className="prof-kicker">Members’ sign in</p>
          <h1 id="prof-title">Your card, your stays, your booklet</h1>
          <p>Sign in with your email or membership ID to see what is left in your booklet and every stay, upcoming and past.</p>
          <Sketch name="cottage" className="prof-out-sketch" />
        </div>
        <ProfileSignIn />
      </section>
    );
  }

  const { upcoming, past } = splitBookings(bookings ?? []);
  const first = session.user.name.split(" ")[0];
  const membership = session.membership;

  return (
    <div className="prof wrap">
      <header className="prof-head">
        <div>
          <p className="prof-kicker">Your profile</p>
          <h1>Hello, {first}</h1>
          {session.kind === "sample" && <p className="prof-sample">Preview with sample data</p>}
        </div>
        <button type="button" className="prof-out-btn" onClick={signOut}>Sign out</button>
      </header>

      <section className="prof-sec" aria-labelledby="prof-up">
        <h2 id="prof-up">Your next stay</h2>
        {bookings === null ? <p className="prof-empty">Loading your bookings…</p>
          : upcoming.length ? (
            <>
              <NextStay b={upcoming[0]} />
              {upcoming.length > 1 && <MoreUpcoming list={upcoming.slice(1)} />}
            </>
          )
          : (
            <div className="prof-empty-card">
              <Sketch name="hills" />
              <p>No upcoming stays yet</p>
              <Link href="/stay" className="prof-link">Choose a room <ArrowRight size={15} /></Link>
            </div>
          )}
        {error && <p className="prof-error" role="alert">{error}</p>}
      </section>

      {past.length > 0 && (
        <section className="prof-sec" aria-labelledby="prof-past">
          <div className="prof-sec-head">
            <h2 id="prof-past">Where you have stayed</h2>
            <span>{past.length} {past.length === 1 ? "stay" : "stays"}</span>
          </div>
          <PastPostcards list={past} />
        </section>
      )}

      <section className="prof-sec" aria-labelledby="prof-mem">
        <h2 id="prof-mem">Membership</h2>
        {membership ? (
          <>
            <p className="prof-mem-line">
              {membership.membershipNo} · valid until {fmt(membership.validTo)}
            </p>
            <BookletUsage membership={membership} />
            <Link href="/membership#your-card" className="prof-link">See your card <ArrowRight size={15} /></Link>
          </>
        ) : (
          <LinkMembership name={session.user.name} />
        )}
      </section>
    </div>
  );
}

function LinkMembership({ name }: { name: string }) {
  const [no, setNo] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="prof-link-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^[A-Za-z0-9-]{4,}$/.test(no.trim())) return setErr("Enter your membership ID, for example GHR-CM-0427.");
        linkSampleMembership(name, no.trim().toUpperCase());
      }}
    >
      <p>Not linked to a membership. If you are a member, add your membership ID to see your booklet.</p>
      <label>
        <span>Membership ID</span>
        <input value={no} onChange={(e) => setNo(e.target.value)} autoCapitalize="characters" autoCorrect="off" placeholder="GHR-CM-0427" />
      </label>
      <p className="psign-note">Preview: linking shows sample usage until the ERP records redemptions.</p>
      {err && <p className="psign-error" role="alert">{err}</p>}
      <div className="prof-link-actions">
        <button type="submit" className="psign-btn">Link membership</button>
        <Link href="/membership#inquire" className="prof-link">Become a member <ArrowRight size={15} /></Link>
      </div>
    </form>
  );
}
