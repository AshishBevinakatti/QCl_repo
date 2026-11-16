"use client";

import Link from "next/link";
import { useSession, signOut } from "./guest-session";
import BookletUsage from "./booklet-usage";
import ProfileSignIn from "./profile-sign-in";
import { ArrowRight } from "./icons";

/* The membership page's own section for members (unit 3.30), under the card.
 * Signed in with a membership: what is used and what is left. Signed in
 * without one: a pointer to link it on the profile. Signed out: a compact
 * sign-in, so a member never has to leave the page. */

export default function MembershipMine() {
  const session = useSession();

  return (
    <section id="your-card" className="wrap mem-mine" aria-labelledby="mine-title">
      {session?.membership ? (
        <>
          <div className="mem-mine-head">
            <div>
              <p className="mem-kicker">Your booklet</p>
              <h2 id="mine-title">{session.membership.holder.split(" ")[0]}, here is what is left</h2>
            </div>
            <div className="mem-mine-actions">
              <Link href="/profile" className="mem-mine-link">Bookings and profile <ArrowRight size={15} /></Link>
              <button type="button" className="mem-mine-out" onClick={signOut}>Sign out</button>
            </div>
          </div>
          <BookletUsage membership={session.membership} />
        </>
      ) : session ? (
        <div className="mem-mine-head">
          <div>
            <p className="mem-kicker">Your booklet</p>
            <h2 id="mine-title">Link your membership to see your booklet</h2>
          </div>
          <Link href="/profile" className="mem-mine-link">Link it on your profile <ArrowRight size={15} /></Link>
        </div>
      ) : (
        <div className="mem-mine-out-grid">
          <div>
            <p className="mem-kicker">Already a member?</p>
            <h2 id="mine-title">Sign in to see your card and what is left in your booklet</h2>
          </div>
          <ProfileSignIn compact />
        </div>
      )}
    </section>
  );
}
