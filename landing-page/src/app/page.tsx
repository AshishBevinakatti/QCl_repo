import Image from "next/image";
import Link from "next/link";
import Opening from "./opening";
import ConceptFigure from "./concept-figure";
import GallerySlider from "./gallery-slider";
import MotionProvider from "./motion-provider";
import SiteFooter from "./site-footer";
import { ArrowRight, ArrowDown, Sparkles } from "./icons";
import { getScene } from "./resort-assets";
import Reveal from "./reveal";
import LocationActions from "./location-actions";
import LocationMapCard from "./location-map-card";
import HighlightsCards from "./highlights-cards";
import AmenitiesCards from "./amenities-cards";

/* =========================================================================
   1. Data grounded in Resort ERP SRS, Project Report & Loyalty Documents
   ========================================================================= */

const whyChooseUsHighlights = [
  {
    num: "01",
    title: "Six Distinct Dining Outlets",
    desc: "Dedicated pure vegetarian dining, live barbecue grill, open-air courtyard cafe, resto-bar, and an evening bar lounge with separate kitchen operations.",
  },
  {
    num: "02",
    title: "1,000-Pax Celebration Venues",
    desc: "Indoor AC conference hall (100 pax), standard banquet lawn (300 pax), and poolside LED lawn (500 pax) with a transparent zero hall-rental policy.",
  },
  {
    num: "03",
    title: "Six Accommodation Categories",
    desc: "Executive hotel rooms, a luxury Jacuzzi suite, natural timber cottages, dormitory cottages for 10–12 guests, and 24×7 private pool villas.",
  },
  {
    num: "04",
    title: "All-Age Recreation & Adventure",
    desc: "Freshwater main and kids pools, overhead mist rain dance arena, aerial sky cycling, high-glide zipline, and comprehensive indoor sports center.",
  },
  {
    num: "05",
    title: "Prime Northern Karnataka Gateway",
    desc: "Direct National Highway frontage between Hubli and Vijayapur, situated minutes from Almatti Dam, Badami Cave Temples, and Aihole & Pattadakal.",
  },
  {
    num: "06",
    title: "Modern Core Infrastructure",
    desc: "Resort-wide Wi-Fi, 24/7 power backup with dual DG sets, EV charging stations, driver dormitories, and barrier-free wheelchair accessibility.",
  },
];

const amenitiesList = [
  {
    title: "Main Swimming Pool & Kids Pool",
    timing: "07:00 AM – 07:00 PM",
    rating: "4.9",
    statValue: "07 AM – 07 PM",
    statLabel: "Hours",
    image: "/assets/resort/scenes/web/hero-pool-day-desktop-p37.jpg",
    iconKey: "pool" as const,
    lead: "Freshwater resort swimming pool with dedicated shallow splash pool for children.",
    highlights: [
      "4–5 ft depth freshwater main pool with loungers",
      "Adjoining safe shallow splash zone for toddlers",
      "Morning swim window (06:00–10:00 AM) reserved for room guests",
    ],
    rules: [
      "Open to day-outing visitors from 10:00 AM – 05:00 PM",
      "Life jackets available; swimwear mandatory",
    ],
  },
  {
    title: "Spa & Wellness Center",
    timing: "11:00 AM – 11:00 PM",
    rating: "4.9",
    statValue: "11 AM – 11 PM",
    statLabel: "Hours",
    image: "/assets/resort/amenities/spa-wellness.jpg",
    iconKey: "spa" as const,
    lead: "Holistic wellness haven offering traditional Ayurvedic therapies and soothing relaxation.",
    highlights: [
      "Certified Ayurvedic therapies and herbal body massages",
      "Private steam facilities and aromatic relaxation rooms",
      "Custom wellness consultations by trained practitioners",
    ],
    rules: [
      "Prior appointment recommended via resort concierge",
      "Couples treatment suites available upon reservation",
    ],
  },
  {
    title: "Gymnasium & Indoor Games",
    timing: "07:00 AM – 11:00 PM",
    rating: "4.8",
    statValue: "07 AM – 11 PM",
    statLabel: "Hours",
    image: "/assets/resort/amenities/games-gym.jpg",
    iconKey: "gym" as const,
    lead: "Comprehensive fitness gym and multi-activity indoor games lounge for all ages.",
    highlights: [
      "Cardio zone with treadmills, cycles and strength equipment",
      "Full-size snooker, pool, table tennis, carrom & chess",
      "Virtual Reality gaming setup and quiet reading corner",
    ],
    rules: [
      "Complimentary access for all in-house guests",
      "Sports shoes required in fitness facility",
    ],
  },
  {
    title: "Adventure Sports Arena",
    timing: "10:00 AM – 05:00 PM",
    rating: "4.8",
    statValue: "10 AM – 05 PM",
    statLabel: "Hours",
    image: "/assets/resort/amenities/adventure-sports-arena.jpg",
    iconKey: "adventure" as const,
    lead: "Adrenaline-filled outdoor adventure installations across landscaped resort grounds.",
    highlights: [
      "Aerial Sky Cycling suspended above resort terrain",
      "High-glide Zipline crossing open garden spaces",
      "Supervised obstacle activity circuits for adults and youth",
    ],
    rules: [
      "Safety harnesses and trained instructor supervision provided",
      "Included in select day-outing and group celebration packages",
    ],
  },
  {
    title: "Rain Dance Arena",
    timing: "Scheduled Sessions",
    rating: "4.7",
    statValue: "30-Min Beats",
    statLabel: "Session",
    image: "/assets/resort/amenities/rain-dance.jpg",
    iconKey: "raindance" as const,
    lead: "Dynamic overhead rainfall shower zone with synchronized music and party lighting.",
    highlights: [
      "High-pressure overhead mist and warm-water rainfall jets",
      "Dynamic multi-color sound-responsive party lighting",
      "Outdoor sound system for upbeat family & group fun",
    ],
    rules: [
      "Sessions run at scheduled intervals throughout the afternoon",
      "Towel service available adjacent to changing pavilions",
    ],
  },
  {
    title: "Bonfire & Nature Walks",
    timing: "07:00 PM – 11:00 PM",
    rating: "4.9",
    statValue: "07 PM – 11 PM",
    statLabel: "Hours",
    image: "/assets/resort/amenities/bonfire-walks.jpg",
    iconKey: "bonfire" as const,
    lead: "Atmospheric evening campfires and guided morning nature trails along the river bank.",
    highlights: [
      "Nightly open campfire on Butterfly Lawn with acoustic music",
      "Morning guided river walk along scenic Ghataprabha corridor",
      "Fragrant herb gardens and children's botanical discovery path",
    ],
    rules: [
      "Bonfire skewers and warm appetizers available on order",
      "Morning walking tours depart from reception lobby at 07:00 AM",
    ],
  },
  {
    title: "Core Infrastructure & Accessibility",
    timing: "24 Hours Daily",
    rating: "5.0",
    statValue: "24/7 Power",
    statLabel: "Backup",
    image: "/assets/resort/scenes/web/arrival-reception-lounge-p11.webp",
    iconKey: "core" as const,
    lead: "Modern hospitality essentials ensuring seamless comfort, connectivity, and peace of mind.",
    highlights: [
      "High-speed Wi-Fi & 24/7 power backup with dual DG generators",
      "EV vehicle charging stations & spacious guarded parking",
      "Barrier-free wheelchair ramps and accessible pathways throughout",
    ],
    rules: [
      "24-hour front desk, security patrol & CCTV monitoring",
      "Dedicated air-conditioned driver dormitories with wash facilities",
    ],
  },
];

const nearbyAttractions = [
  {
    name: "Almatti Dam & Krishna River Basin (18 km)",
    desc: "One of South India's largest dams on the Krishna River, featuring terraced Mughal gardens, musical dancing fountains, and boating.",
  },
  {
    name: "Badami Cave Temples (55 km)",
    desc: "Renowned 6th-century Chalukyan rock-cut cave temples, Agastya Lake, Bhutanatha Temples, and archaeological museum.",
  },
  {
    name: "Aihole & Pattadakal (60 km)",
    desc: "UNESCO World Heritage cradle of ancient Indian temple architecture, including the 7th-century Durga Temple and Lad Khan Temple.",
  },
];

/* =========================================================================
   2. Main Home Page (13 Sections in Strict Sequence)
   ========================================================================= */

export default function Home() {
  return (
    <MotionProvider>
      <a className="skip-link" href="#story">Skip to content</a>
      <main id="main-content" tabIndex={-1}>

        {/* 1. Hero */}
        <Opening slides={[
          {
            scene: getScene("hero-pool-day-desktop-p37"),
            mobile: getScene("hero-pool-arch-mobile-p35"),
            title: "A stay shaped around time together.",
            label: "Private pool cottage concept",
            alt: "Pool courtyard and illuminated arched seating pavilion at Golden Hills Resort",
            focalPoint: "center 54%",
            mobileFocalPoint: "51% center",
          },
        ]} />

        {/* 2. Brand Story / Welcome */}
        <section id="story" className="story-section wrap" aria-labelledby="story-title" tabIndex={-1}>
          <div className="story-layout">
            <div className="story-content">
              <div className="status-line">
                <p className="section-note">Brand story &amp; welcome</p>
                <span className="section-status">Welcome to Golden Hills</span>
              </div>
              <h2 id="story-title">A family-friendly retreat taking shape in northern Karnataka.</h2>
              <div className="story-prose">
                <p className="story-lead">
                  Promoted by Smt. Asha Bilagi and family, Golden Hills Resort is located at Survey No. 162/2A in Anagawadi Village, Biligi Taluk, within northern Karnataka&rsquo;s historic tourism corridor.
                </p>
                <p>
                  Conceived by Astu Architects and Rajvi Jhaveri, the resort combines comfortable guest rooms and standalone wooden cottages, six specialized dining destinations, 1,000-guest celebration lawns, and all-age recreation.
                </p>
                <p>
                  Situated directly along the National Highway between Hubli and Vijayapur (30 km from Bagalkote town), the resort is envisioned as a serene base where families unwind, milestone celebrations come together, and visitors explore nearby heritage destinations including Almatti Dam, Aihole, and the Badami Cave Temples.
                </p>
              </div>
              <div className="story-badges">
                <span className="story-badge-pill">Biligi Taluk, Bagalkote Dist.</span>
                <span className="story-badge-pill">Astu Architects &amp; Rajvi Jhaveri</span>
                <span className="story-badge-pill">Focus Tourism Destination</span>
              </div>
            </div>

            <div className="story-visual">
              <ConceptFigure
                scene={getScene("arrival-reception-lounge-p11")}
                alt="Double-height reception lounge concept with floor-to-ceiling glass and outdoor landscape views"
                label="Main reception lounge concept"
                sizes="(max-width: 900px) 100vw, 48vw"
              />
            </div>
          </div>
        </section>

        {/* 3. Accommodation Showcase */}
        <section id="stay" className="stay-section wrap" aria-labelledby="stay-title" tabIndex={-1}>
          <div className="showcase-split-layout">
            <div className="showcase-left">
              <div className="status-line">
                <p className="section-note">Accommodations</p>
                <span className="section-status">Six distinct categories</span>
              </div>
              <h2 id="stay-title">Rooms, cottages &amp; private pool villas.</h2>
              <p className="showcase-description">
                Thoughtfully crafted living spaces across Hotel Block 1, the Timber Wellness Enclave, and the Poolside Courtyard with verified 3D perspectives and ensuite washrooms.
              </p>
              <div className="showcase-cta-wrap">
                <Link href="/stay" className="showcase-cta-btn">
                  <span>View accommodations</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <Link href="/stay" className="showcase-right-card" aria-label="Explore all 6 accommodation categories">
              <div className="showcase-media-frame">
                <Image
                  src={getScene("room-queen-bed-p06").src}
                  alt="Golden Hills Resort luxury queen bedroom render"
                  fill
                  sizes="(max-width: 900px) 100vw, 560px"
                  className="showcase-media-img"
                />
                <div className="showcase-card-overlay">
                  <span className="showcase-pill">From ₹4,999 / night · 6 Categories</span>
                </div>
              </div>
              <div className="showcase-card-body">
                <span className="showcase-eyebrow">Hotel Rooms · Timber Cottages · Poolside Villas</span>
                <h3 className="showcase-card-title">Explore All 6 Accommodation Categories</h3>
                <span className="showcase-card-link">
                  View rooms, cottages &amp; floorplans <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* 4. Amenities */}
        <section id="amenities" className="amenities-section wrap" aria-labelledby="amenities-title" tabIndex={-1}>
          <div className="amenities-heading" style={{ marginBottom: "28px" }}>
            <div className="status-line">
              <p className="section-note">Amenities &amp; recreation</p>
              <span className="section-status">For stays &amp; day visits</span>
            </div>
            <h2 id="amenities-title">Recreation, wellness and adventure facilities.</h2>
            <p style={{ marginTop: "12px", color: "var(--color-muted)", maxWidth: "56ch" }}>
              Published operating windows and comprehensive facilities across swimming pools, wellness, adventure games, and core infrastructure.
            </p>
          </div>
          <AmenitiesCards amenities={amenitiesList} />
        </section>

        {/* 5. Dining Showcase */}
        <section id="dining" className="dining-section wrap" aria-labelledby="dining-title" tabIndex={-1}>
          <div className="showcase-split-layout">
            <div className="showcase-left">
              <div className="status-line">
                <p className="section-note">Dining destinations</p>
                <span className="section-status">Six culinary outlets</span>
              </div>
              <h2 id="dining-title">Distinct culinary outlets &amp; separate kitchens.</h2>
              <p className="showcase-description">
                From authentic regional pure vegetarian thalis and live barbecue grills to casual resto-bar dining and poolside coffee, the resort provides complete culinary variety with separate vegetarian and non-vegetarian kitchens.
              </p>
              <div className="showcase-cta-wrap">
                <Link href="/dining" className="showcase-cta-btn">
                  <span>View dining destinations</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <Link href="/dining" className="showcase-right-card" aria-label="Explore all 6 dining destinations">
              <div className="showcase-media-frame">
                <Image
                  src={getScene("dining-veg-seating-p13").src}
                  alt="Golden Hills Resort pure vegetarian dining hall render"
                  fill
                  sizes="(max-width: 900px) 100vw, 560px"
                  className="showcase-media-img"
                />
                <div className="showcase-card-overlay">
                  <span className="showcase-pill">6 Dining Destinations · Separate Kitchens</span>
                </div>
              </div>
              <div className="showcase-card-body">
                <span className="showcase-eyebrow">Pure Veg Kitchen · Multi-Cuisine Grill · Bar Lounge</span>
                <h3 className="showcase-card-title">Explore All 6 Dining Destinations</h3>
                <span className="showcase-card-link">
                  View restaurant menus &amp; timings <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* 6. Experiences Showcase */}
        <section id="experiences" className="dining-section wrap" aria-labelledby="experiences-title" tabIndex={-1}>
          <div className="showcase-split-layout">
            <div className="showcase-left">
              <div className="status-line">
                <p className="section-note">Curated experiences</p>
                <span className="section-status">Seven bespoke moments</span>
              </div>
              <h2 id="experiences-title">Signature moments &amp; full-day outings.</h2>
              <p className="showcase-description">
                From private poolside candlelight gazebos and open-air movie nights under the stars to starlit campfires and bundled full-day recreation packages, discover unforgettable moments tailored for couples, families, and groups.
              </p>
              <div className="showcase-cta-wrap">
                <Link href="/experiences" className="showcase-cta-btn">
                  <span>View curated experiences</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <Link href="/experiences" className="showcase-right-card" aria-label="Explore all 7 signature experiences">
              <div className="showcase-media-frame">
                <Image
                  src={getScene("dusk-pool-candidate-p38").src}
                  alt="Golden Hills Resort poolside candlelight gazebo at dusk"
                  fill
                  sizes="(max-width: 900px) 100vw, 560px"
                  className="showcase-media-img"
                />
                <div className="showcase-card-overlay">
                  <span className="showcase-pill">7 Signature Experiences · Day Packages</span>
                </div>
              </div>
              <div className="showcase-card-body">
                <span className="showcase-eyebrow">Candlelight Gazebos · Starlit Campfires · Day Outings</span>
                <h3 className="showcase-card-title">Explore All 7 Signature Experiences</h3>
                <span className="showcase-card-link">
                  View package pricing &amp; inclusions <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* 7. Room to Gather Showcase */}
        <section id="gatherings" className="stay-section wrap" aria-labelledby="gatherings-title" tabIndex={-1}>
          <div className="showcase-split-layout">
            <div className="showcase-left">
              <div className="status-line">
                <p className="section-note">Room to gather</p>
                <span className="section-status">3 venues · 1,000 pax capacity</span>
              </div>
              <h2 id="gatherings-title">Venues for weddings, conferences &amp; banquets.</h2>
              <p className="showcase-description">
                From climate-controlled indoor conference halls with acoustic timber ceilings to expansive open banquet lawns and poolside celebration decks, Golden Hills Resort accommodates up to 1,000 guests under a transparent zero hall-rental policy.
              </p>
              <div className="showcase-cta-wrap">
                <Link href="/gatherings" className="showcase-cta-btn">
                  <span>View celebration venues</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <Link href="/gatherings" className="showcase-right-card" aria-label="Explore all celebration and banquet venues">
              <div className="showcase-media-frame">
                <Image
                  src={getScene("gatherings-banquet-p03").src}
                  alt="Golden Hills Resort conference and banquet hall render"
                  fill
                  sizes="(max-width: 900px) 100vw, 560px"
                  className="showcase-media-img"
                />
                <div className="showcase-card-overlay">
                  <span className="showcase-pill">3 Venues · 1,000 Pax · Zero Hall Rental</span>
                </div>
              </div>
              <div className="showcase-card-body">
                <span className="showcase-eyebrow">Indoor AC Hall · Open Lawn · Poolside LED Lawn</span>
                <h3 className="showcase-card-title">Explore All Celebration &amp; Banquet Venues</h3>
                <span className="showcase-card-link">
                  View event spaces &amp; catering menus <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* 8. Gallery */}
        <section id="gallery" className="gallery-section wrap" aria-labelledby="gallery-title" tabIndex={-1}>
          <div className="gallery-heading">
            <div className="status-line">
              <p className="section-note">Visual preview</p>
              <span className="section-status">Full image library · 17 perspectives</span>
            </div>
            <h2 id="gallery-title">Architectural design concepts &amp; spaces.</h2>
            <p>Explore all 17 rendered perspectives across private pool villas, cottage gardens, specialized dining rooms, and gathering venues designed by Astu Architects and Rajvi Jhaveri.</p>
          </div>
          <GallerySlider />
        </section>

        {/* 9. Location & Nearby Attractions */}
        <section id="location" className="location-section wrap" aria-labelledby="location-title" tabIndex={-1}>
          <div className="location-copy">
            <p className="section-note">Location &amp; heritage</p>
            <h2 id="location-title">In the historic heart of northern Karnataka.</h2>
            <p>Golden Hills Resort is located at Survey No. 162/2A, Anagawadi Village, Biligi Taluk, Bagalkote District, Karnataka (Coordinates: 16.239532° N, 75.625928° E).</p>
            <LocationActions />
            <p style={{ marginTop: "24px" }}>Situated directly along the National Highway corridor connecting Hubli and Vijayapur (30 km from Bagalkote town), the resort serves as an ideal base for exploring the region&apos;s historic Focus Tourism Destinations:</p>
            <ul className="location-landmarks">
              {nearbyAttractions.map(attraction => (
                <li key={attraction.name}>
                  <strong>{attraction.name}</strong>
                  <span>{attraction.desc}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="location-aside">
            <LocationMapCard />
          </div>
        </section>

        {/* 9. Resort Overview / Why Choose Us */}
        <section id="highlights" className="highlights-section wrap" aria-labelledby="highlights-title" tabIndex={-1}>
          <div className="highlights-heading">
            <div className="status-line">
              <p className="section-note">Resort overview</p>
              <span className="section-status">Why choose us</span>
            </div>
            <h2 id="highlights-title">Hospitality, recreation and celebration in one destination.</h2>
            <p>Everything you need for a restful holiday, milestone gathering, or refreshing day outing in northern Karnataka.</p>
          </div>
          <HighlightsCards items={whyChooseUsHighlights} />
        </section>

        {/* 11. Membership Privileges Teaser (Short, High-Impact & Direct) */}
        <section id="offers" className="membership-teaser-section wrap" aria-labelledby="offers-title" tabIndex={-1}>
          <div className="membership-teaser-card">
            <div className="membership-teaser-media">
              <Image
                src={getScene("dusk-pool-candidate-p38").src}
                alt="Golden Hills Resort evening pool and illuminated cottages"
                fill
                sizes="(max-width: 900px) 100vw, 600px"
                className="membership-teaser-img"
              />
              <div className="membership-teaser-overlay">
                <span className="membership-teaser-badge">
                  <Sparkles size={15} /> 180 Privileges
                </span>
                <span className="membership-teaser-pill">55 Vouchers · 125 Coupons</span>
              </div>
            </div>

            <div className="membership-teaser-content">
              <div className="status-line" style={{ marginBottom: "12px" }}>
                <p className="section-note">Golden Hills Privilege Club</p>
                <span className="section-status">Charter Enrollment Open</span>
              </div>

              <h2 id="offers-title" className="membership-teaser-heading">
                Unlock 180 luxury privileges with the Privilege Club.
              </h2>

              <p className="membership-teaser-lead">
                Receive 55 high-value vouchers and 125 privilege coupons — including 100% complimentary room stays, buy-one-get-one dining buffets, group recreation passes, free banquet rooms, 40% beverage discounts, and an executive welcome keepsake box.
              </p>

              <div className="membership-teaser-features">
                <div className="membership-feature-chip">
                  <span className="chip-bullet">✓</span> 2 Free Room Stays &amp; 10 BOGO Nights
                </div>
                <div className="membership-feature-chip">
                  <span className="chip-bullet">✓</span> 70 Dining, Buffet &amp; Brunch Deals
                </div>
                <div className="membership-feature-chip">
                  <span className="chip-bullet">✓</span> 25 Full-Day Outing Recreation Passes
                </div>
                <div className="membership-feature-chip">
                  <span className="chip-bullet">✓</span> Up to 6 Free Rooms with Banquets
                </div>
                <div className="membership-feature-chip">
                  <span className="chip-bullet">✓</span> 12 Months Validity · Fully Transferable
                </div>
              </div>

              <div className="membership-teaser-action-row">
                <Link href="/membership" className="membership-teaser-btn">
                  <span>Explore 180 Membership Privileges</span>
                  <ArrowRight size={16} />
                </Link>
                <span className="membership-teaser-subtext">
                  Complete voucher ledger &amp; gift kit
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 12. Booking / Contact CTA */}
        <section id="contact" className="closing-section" aria-labelledby="closing-title">
          <div className="closing-media" aria-hidden="true">
            <Image src={getScene("dusk-pool-candidate-p38").src} alt="" fill sizes="100vw" />
          </div>
          <div className="closing-scrim" aria-hidden="true" />
          <div className="closing-inner wrap">
            <div className="closing-copy">
              <p>Stays · Dining · Celebrations · Recreation</p>
              <h2 id="closing-title">Plan your stay in northern Karnataka.</h2>
              <p style={{ marginTop: "12px", color: "var(--color-chalk-82)", fontSize: "14px", maxWidth: "440px" }}>Connect with our concierge or explore our accommodations, dining, and celebration venues to plan your visit to northern Karnataka.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
              <Link className="explore-button closing-cta" href="/plan-ahead#bookings">Explore planning options <ArrowRight size={16} /></Link>
              <a href="#location" style={{ color: "var(--color-chalk)", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>Find us on map <ArrowDown size={14} /></a>
            </div>
          </div>
        </section>

        {/* 13. Footer */}
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
