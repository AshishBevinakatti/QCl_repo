import Image from "next/image";
import Link from "next/link";
import { logo } from "./resort-assets";
import { ArrowUp } from "./icons";

const exploreLinks = [
  { href: "/#vision", label: "The vision" },
  { href: "/#cottages", label: "Cottage studies" },
  { href: "/#dining", label: "Dining" },
  { href: "/#spaces", label: "Arrival & interiors" },
  { href: "/#gatherings", label: "Gatherings" },
];

const planLinks = [
  { href: "/plan-ahead#bookings", label: "Book Now" },
  { href: "/plan-ahead#login", label: "Login" },
  { href: "/plan-ahead#enquiries", label: "Enquire" },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" aria-label="Golden Hills Resort, home">
              <Image src={logo} alt="" width={2360} height={1120} sizes="132px" />
            </Link>
            <p>Golden Hills Resort is a working name for this local concept preview. All property imagery is an artist&rsquo;s impression; designs remain subject to change.</p>
          </div>

          <nav className="footer-col" aria-label="Explore the resort">
            <h2>Explore</h2>
            <div className="footer-list">
              {exploreLinks.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            </div>
          </nav>

          <nav className="footer-col" aria-label="Plan ahead">
            <h2>Plan ahead</h2>
            <div className="footer-list">
              {planLinks.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            </div>
          </nav>
        </div>

        <div className="footer-bottom">
          <p>Bookings, guest accounts and official enquiry channels are not open while the resort is in development.</p>
          <a className="back-top" href="#top">Back to top <ArrowUp /></a>
        </div>
      </div>
    </footer>
  );
}
