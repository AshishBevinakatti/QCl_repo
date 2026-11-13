import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "../site-footer";
import { ArrowLeft } from "../icons";
import { logo } from "../resort-assets";
import PortalForms from "./portal-forms";

export const metadata: Metadata = {
  title: "Guest Portal & Inquiries | Golden Hills Resort",
  description: "Official guest account access and booking inquiry portal for Golden Hills Resort.",
};

export default function PlanAheadPage() {
  return (
    <>
      <header className="plan-header">
        <div className="wrap plan-header-inner">
          <Link href="/" className="plan-back"><ArrowLeft /> Preview</Link>
          <Link href="/" className="plan-logo" aria-label="Golden Hills Resort, return to concept preview">
            <Image src={logo} alt="Golden Hills Resort" width={2360} height={1120} priority sizes="114px" />
          </Link>
          <Link href="/#vision" className="plan-vision">The vision</Link>
        </div>
      </header>
      <main id="top" className="plan-main">
        <section className="plan-intro wrap" aria-labelledby="plan-title">
          <p className="plan-kicker">Integrated Guest Portal</p>
          <h1 id="plan-title">Plan your stay,<br />seamlessly.</h1>
          <p>
            Experience Golden Hills. Submit your reservation request, register your guest account,
            or check inquiry updates directly with our on-duty Sales team.
          </p>
        </section>

        {/* Live Interactive Portal Forms */}
        <PortalForms />

        <aside className="plan-note wrap" aria-label="Concept imagery notice">
          <span>Golden Hills Resort</span>
          <p>All property imagery is artist’s impression. Inquiries are processed directly through our secure sales and reservation team.</p>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
