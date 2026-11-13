import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "../site-footer";
import SubpageHeader from "../subpage-header";
import ExperiencesCards from "../experiences-cards";
import { resortExperiences } from "../experiences-data";
import { ArrowRight } from "../icons";
import { impression } from "../resort-assets";

export const metadata: Metadata = {
  title: "Curated Experiences & Day Outings | Golden Hills Resort",
  description:
    "Explore bespoke resort moments at Golden Hills Resort, Biligi. From private poolside candlelight gazebos and starlit campfires to full-day recreation packages.",
};

export default function ExperiencesPage() {
  return (
    <>
      <SubpageHeader />

      <main id="top" className="subpage-main" style={{ background: "var(--color-paper)", minHeight: "calc(100svh - 88px)", paddingBottom: "96px" }}>
        {/* Intro Hero */}
        <section className="subpage-intro wrap" style={{ paddingTop: "clamp(48px, 6vw, 88px)", paddingBottom: "48px" }}>
          <div style={{ maxWidth: "800px" }}>
            <div className="status-line" style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
              <span className="section-note" style={{ fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-gold-muted)" }}>
                Curated Moments
              </span>
              <span className="section-status" style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "99px", background: "rgba(184, 150, 90, 0.12)", color: "var(--color-gold-muted)" }}>
                Seven Signature Experiences
              </span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 52px)", lineHeight: "1.15", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-ink)", marginBottom: "20px" }}>
              Signature moments &amp; full-day outings.
            </h1>
            <p style={{ fontSize: "var(--type-body)", lineHeight: "var(--leading-body)", color: "var(--color-muted)", margin: 0 }}>
              Tailored for couples, families, and celebratory groups across scenic outdoor gazebos, hillside lawns, and recreation arenas. Explore private candlelit poolside dinners, open-air cinema under the stars, guided bonfire campfires, and bundled full-day outing escapes.
            </p>
          </div>
        </section>

        {/* Experience Cards Grid */}
        <section className="wrap" aria-label="Resort Curated Experiences List" style={{ marginTop: "16px" }}>
          <ExperiencesCards experiences={resortExperiences} />
        </section>

        {/* Plan Ahead Callout Banner */}
        <section className="wrap" style={{ marginTop: "72px" }}>
          <div
            style={{
              padding: "clamp(36px, 5vw, 56px)",
              borderRadius: "16px",
              background: "var(--color-forest)",
              color: "var(--color-chalk)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
              border: "1px solid rgba(255, 250, 243, 0.12)",
            }}
          >
            <div style={{ maxWidth: "560px" }}>
              <span style={{ fontSize: "var(--type-label)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--color-brass)", display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Reservations &amp; Custom Itineraries
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 2.8vw, 34px)", fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 12px 0", color: "var(--color-chalk)" }}>
                Planning a milestone celebration or private date?
              </h2>
              <p style={{ margin: 0, color: "var(--color-forest-soft)", fontSize: "var(--type-small)", lineHeight: "1.6" }}>
                Our hospitality concierge coordinates bespoke poolside gazebo setups, acoustic music, private film screenings, or group day-outing packages tailored to your schedule.
              </p>
            </div>
            <Link
              href="/plan-ahead#experiences"
              className="opening-book-action"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "var(--tracking-nav)",
                background: "var(--color-chalk)",
                color: "var(--color-forest)",
                borderRadius: "8px",
                textDecoration: "none",
                transition: "background-color 0.18s var(--ease-out)",
              }}
            >
              Inquire about experiences <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <aside className="plan-note wrap" style={{ marginTop: "32px", fontSize: "12px", color: "var(--color-muted)", textAlign: "center" }}>
          <span>{impression}</span>
        </aside>
      </main>

      <SiteFooter />
    </>
  );
}

