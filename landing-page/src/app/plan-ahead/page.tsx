import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "../site-footer";
import SubpageHeader from "../subpage-header";
import PreOpeningForm from "./pre-opening-form";
import PortalForms from "./portal-forms";
import { ArrowRight } from "../icons";

export const metadata: Metadata = {
  title: "Guest Portal & Plan Your Stay | Golden Hills Resort",
  description: "Official guest account access, reservation inquiries, and booking portal for Golden Hills Resort, Biligi.",
};

export default function PlanAheadPage() {
  return (
    <>
      <SubpageHeader />
      <main id="top" className="plan-main">
        <section className="plan-intro wrap" aria-labelledby="plan-title">
          <p className="plan-kicker">Integrated Guest Portal</p>
          <h1 id="plan-title">Plan your stay,<br />seamlessly.</h1>
          <p>
            Experience Golden Hills. Submit your reservation request, register your guest account,
            or check inquiry updates directly with our on-duty Sales and Front Desk teams.
          </p>
        </section>

        {/* Live Interactive Portal Forms (Connected to ERP Lead & Guest Portal Microservice) */}
        <PortalForms />

        <div className="plan-statuses wrap" style={{ marginTop: "64px" }}>
          <section id="bookings" className="plan-status" aria-labelledby="bookings-title" tabIndex={-1}>
            <p>Accommodations &amp; Meal Plans</p>
            <h2 id="bookings-title">Rooms, cottages &amp; private pool villas.</h2>
            <p>Golden Hills Resort offers Premium Rooms (Queen &amp; Twin variants), an expansive Suite Room with in-room Jacuzzi, standalone Wooden Cottages in the wellness zone, a group Dormitory Cottage for 10–12 guests, and Private Pool Cottages. Tariffs support EP (Room Only), CP (Breakfast), MAP (Half Board), and AP (Full Board) meal plans.</p>
            <Link href="/stay">Explore room details &amp; features <ArrowRight /></Link>
          </section>

          <section id="experiences" className="plan-status" aria-labelledby="experiences-title" tabIndex={-1}>
            <p>Recreation &amp; Outings</p>
            <h2 id="experiences-title">Day outings, wellness &amp; signature experiences.</h2>
            <p>Explore the 10:00 AM – 05:00 PM Full-Day Outing package featuring swimming pool access, rain dance arena, indoor games center, sky cycling, zipline, and 3 bundled meals. Curated mystery experiences include poolside gazebo candlelight dinners, outdoor movie nights, and Ayurvedic spa therapies.</p>
            <Link href="/experiences">See experiences &amp; day packages <ArrowRight /></Link>
          </section>

          <section id="enquiries" className="plan-status" aria-labelledby="enquiries-title" tabIndex={-1}>
            <p>Events &amp; Banquets</p>
            <h2 id="enquiries-title">Three venues with zero hall-rental fee.</h2>
            <p>For destination weddings, corporate seminars, and private celebrations, the resort offers 3 dedicated venues with combined capacity for up to 1,000 guests: 100-pax Indoor Conference Hall, 300-pax Banquet Lawn, and 500-pax Poolside LED Screen Lawn. Bookings operate on a zero hall-rental policy charged strictly per plate.</p>
            <Link href="/gatherings">Explore event spaces <ArrowRight /></Link>
          </section>
        </div>

        <div className="wrap" style={{ marginTop: "48px" }}>
          <PreOpeningForm />
        </div>

        <aside className="plan-note wrap" aria-label="Concept imagery notice">
          <span>Golden Hills Resort</span>
          <p>All property visuals are artist’s architectural impressions by Astu Architects and Rajvi Jhaveri. Inquiries and reservations are processed directly through our secure ERP sales system.</p>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
