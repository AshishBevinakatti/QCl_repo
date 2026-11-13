import type { Metadata } from "next";
import Link from "next/link";
import SubpageHeader from "../subpage-header";
import SiteFooter from "../site-footer";
import MembershipCards from "../membership-cards";
import MembershipInquiryForm from "./membership-inquiry-form";
import { ArrowRight, TicketVoucher, ShieldCheck, Sparkles } from "../icons";

export const metadata: Metadata = {
  title: "Privilege Club & Membership | Golden Hills Resort",
  description:
    "Explore 180 exclusive loyalty privileges at Golden Hills Resort, Biligi. Unlock 55 vouchers and 125 discount coupons across complimentary stays, gourmet dining, private banquets, and spa therapies.",
};

export default function MembershipPage() {
  return (
    <>
      <SubpageHeader />

      <main id="top" className="subpage-main mem-page-main">
        {/* Intro Hero Section */}
        <section className="subpage-intro wrap mem-intro-section" aria-labelledby="mem-title">
          <div className="mem-hero-content">
            <div className="status-line">
              <span className="section-note">Golden Hills Privilege Club</span>
              <span className="section-status">180 Exclusive Benefits</span>
            </div>

            <h1 id="mem-title" className="mem-hero-h1">
              Privilege membership crafted for discerning guests.
            </h1>

            <p className="mem-hero-lead">
              The Golden Hills Resort Privilege Club unlocks a curated package of <strong>55 high-value vouchers</strong> and <strong>125 privilege coupons</strong> across our 7 core resort amenities: complimentary cottage stays, gourmet family dining, full-day recreation outings, private celebrations, poolside beverages, and Ayurvedic spa therapies.
            </p>

            {/* Quick Stats Highlights */}
            <div className="mem-stats-strip">
              <div className="mem-stat-cell">
                <span className="mem-stat-num">180</span>
                <span className="mem-stat-lbl">Total Privileges</span>
              </div>
              <div className="mem-stat-divider" aria-hidden="true" />
              <div className="mem-stat-cell">
                <span className="mem-stat-num">55</span>
                <span className="mem-stat-lbl">VIP Vouchers</span>
              </div>
              <div className="mem-stat-divider" aria-hidden="true" />
              <div className="mem-stat-cell">
                <span className="mem-stat-num">125</span>
                <span className="mem-stat-lbl">Savings Coupons</span>
              </div>
              <div className="mem-stat-divider" aria-hidden="true" />
              <div className="mem-stat-cell">
                <span className="mem-stat-num">12 Mos</span>
                <span className="mem-stat-lbl">Full Validity</span>
              </div>
              <div className="mem-stat-divider" aria-hidden="true" />
              <div className="mem-stat-cell">
                <span className="mem-stat-num">100%</span>
                <span className="mem-stat-lbl">Transferable</span>
              </div>
            </div>

            <div className="mem-hero-actions">
              <Link href="#inquire" className="site-navbar-cta" style={{ padding: "12px 28px", fontSize: "14.5px" }}>
                Inquire For Membership <ArrowRight size={15} />
              </Link>
              <Link href="#explore" className="mem-explore-link">
                Explore All 7 Categories Below
              </Link>
            </div>
          </div>
        </section>

        {/* Interactive Privilege Cards Grid & Categories */}
        <section id="explore" className="mem-categories-section">
          <MembershipCards />
        </section>

        {/* Membership Enrollment & Inquiry Section */}
        <section id="inquire" className="wrap mem-inquiry-section" aria-labelledby="inquire-title">
          <div className="mem-inquiry-grid">
            <div className="mem-inquiry-info">
              <span className="mem-kicker">Charter Member Intake</span>
              <h2 id="inquire-title" className="mem-inquiry-heading">
                Reserve your membership privileges today.
              </h2>
              <p className="mem-inquiry-text">
                Pre-opening charter memberships are allocated on a prioritized basis. Register your interest below to receive the complete loyalty prospectus, voucher booklet details, and charter pricing directly from our guest relations team.
              </p>

              <div className="mem-perks-checklist">
                <div className="mem-perk-row">
                  <ShieldCheck size={18} />
                  <span>Immediate digital voucher ledger upon enrollment</span>
                </div>
                <div className="mem-perk-row">
                  <Sparkles size={18} />
                  <span>Executive Welcome Keepsake Box delivered to your doorstep</span>
                </div>
                <div className="mem-perk-row">
                  <TicketVoucher size={18} />
                  <span>Dedicated Club Concierge for priority room &amp; banquet reservations</span>
                </div>
              </div>
            </div>

            <div className="mem-inquiry-form-wrapper">
              <MembershipInquiryForm />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

