import type { RoomCategory } from "./stay-cards";

export const roomTypes: RoomCategory[] = [
  {
    name: "Premium Rooms — Queen",
    zone: "Hotel Block 1",
    specs: "Main Building · Queen Bed · Up to 2 Adults",
    lead: "Comfortable air-conditioned executive room overlooking lush resort gardens, tailored for couples and business travelers.",
    startingTariff: "₹4,999",
    tariffUnit: "/ night",
    taxNote: "Excl. 12% GST",
    highlights: [
      "250 sq. ft with garden views and outside ventilation",
      "Upholstered platform queen bed & dedicated luggage storage",
      "Full dressing vanity and modern ensuite rain shower",
    ],
    mealPlans: ["EP (Room Only)", "CP (Breakfast)", "MAP (Half Board)", "AP (Full Board)"],
    policyNotes: [
      "Starting base tariff: ₹4,999 / night (Excl. 12% GST)",
      "Rollaway extra bed available (+₹600 / night)",
      "24-hour in-room dining and daily housekeeping included",
    ],
    images: [
      {
        sceneId: "room-queen-bed-p06",
        label: "Queen Master Bed",
        alt: "Architectural 3D render of Hotel Deluxe Room showing master queen bed, wood paneled wall, ambient sconces, and timber ceiling",
      },
      {
        sceneId: "room-queen-elevation-p07",
        label: "Room Elevation & Vanity",
        alt: "Architectural 3D render showing hotel queen room front elevation with dressing console, accent wall, and luggage credenza",
      },
      {
        sceneId: "room-queen-angle-p08",
        label: "Bedroom Corner View",
        alt: "Architectural 3D render of queen room highlighting bedside lighting and room perspective",
      },
      {
        sceneId: "room-queen-console-p09",
        label: "Media Wall & Desk",
        alt: "Architectural 3D render showing executive desk and integrated entertainment console",
      },
      {
        sceneId: "washroom-vanity-p16",
        label: "Ensuite Deluxe Washroom",
        alt: "Architectural 3D render of ensuite washroom featuring luxury marble counter, backlit mirror, and glass rain shower",
      },
    ],
  },
  {
    name: "Premium Rooms — Twin",
    zone: "Hotel Block 1",
    specs: "Main Building · Twin Beds · Up to 2 Adults",
    lead: "Dual-bed executive room tailored for corporate delegates, golf getaways, and traveling friends.",
    startingTariff: "₹4,999",
    tariffUnit: "/ night",
    taxNote: "Excl. 12% GST",
    highlights: [
      "Two plush twin single beds with acoustic timber backing",
      "Integrated fluted timber console & ergonomic workspace",
      "Ensuite bathroom with distinct wet/dry dressing zones",
    ],
    mealPlans: ["EP (Room Only)", "CP (Breakfast)", "MAP (Half Board)", "AP (Full Board)"],
    policyNotes: [
      "Starting base tariff: ₹4,999 / night (Excl. 12% GST)",
      "Rollaway extra bed available (+₹600 / night)",
      "High-speed optical Wi-Fi and power connectivity hubs",
    ],
    images: [
      {
        sceneId: "room-twin-beds-p10",
        label: "Twin Beds Layout",
        alt: "Architectural 3D render of Hotel Deluxe Twin Room showing two plush beds with upholstered acoustic headboard and dual side tables",
      },
      {
        sceneId: "room-twin-study-p11",
        label: "Executive Study Desk",
        alt: "Architectural 3D render of twin room executive workstation desk, wall-mounted entertainment console, and storage millwork",
      },
      {
        sceneId: "room-twin-view-p12",
        label: "Twin Bedroom View",
        alt: "Architectural 3D render of twin bedroom showing expansive window and natural illumination",
      },
      {
        sceneId: "room-twin-wardrobe-p13",
        label: "Wardrobe & Entry Foyer",
        alt: "Architectural 3D render of twin room entrance foyer, wardrobe millwork, and luggage station",
      },
      {
        sceneId: "washroom-twin-shower-p17",
        label: "Ensuite Shower & Vanity",
        alt: "Architectural 3D render of twin room ensuite washroom with glass shower stall and contemporary chrome fittings",
      },
    ],
  },
  {
    name: "Suite Room",
    zone: "Hotel Block 1",
    specs: "Main Building · Master King Bed · Up to 2 Adults",
    lead: "Expansive luxury master suite featuring an open-plan layout, private living lounge, and panoramic garden vistas.",
    startingTariff: "₹7,999",
    tariffUnit: "/ night",
    taxNote: "Excl. 12% GST",
    highlights: [
      "Thermostat-controlled in-room Jacuzzi whirlpool bath",
      "Dedicated living room lounge with sofa and dining console",
      "Private attached sit-out terrace overlooking hillside greenery",
    ],
    mealPlans: ["EP (Room Only)", "CP (Breakfast)", "MAP (Half Board)", "AP (Full Board)"],
    policyNotes: [
      "Starting base tariff: ₹7,999 / night (Excl. 12% GST)",
      "Includes thermostat-controlled Jacuzzi whirlpool bath",
      "Complimentary welcome fruit basket & luxury bathrobes",
      "Rollaway extra bed available (+₹600 / night)",
    ],
    images: [
      {
        sceneId: "suite-master-bed-p18",
        label: "Master Suite King Bed",
        alt: "Architectural 3D render of Hotel Master Suite showing expansive king bed, luxury headboard architecture, and panoramic garden glazing",
      },
      {
        sceneId: "suite-master-panoramic-p21",
        label: "Master Bedroom Panoramic View",
        alt: "Architectural 3D render of suite bedroom overlooking hillside garden outlook",
      },
      {
        sceneId: "suite-lounge-living-p24",
        label: "Private Living Lounge",
        alt: "Architectural 3D render of Suite living room with sectional sofa seating, coffee table, and relaxation area",
      },
      {
        sceneId: "suite-dining-table-p26",
        label: "Private Dining Space",
        alt: "Architectural 3D render of suite dedicated private dining suite and credenza console",
      },
      {
        sceneId: "washroom-suite-deluxe-p29",
        label: "Master Suite Deluxe Washroom",
        alt: "Architectural 3D render of master suite luxury washroom featuring custom stone vanity, backlit mirror, and glass stall",
      },
    ],
  },
  {
    name: "Wooden Cottages — Standard",
    zone: "Timber Wellness Zone · Block 2",
    specs: "Standalone Cottage · Queen Bed · Up to 2 Adults",
    lead: "Independent timber cottage crafted from natural treated wood, nestled in the peaceful wellness enclave.",
    startingTariff: "₹5,999",
    tariffUnit: "/ night",
    taxNote: "Excl. 12% GST",
    highlights: [
      "Independent standalone treated timber architecture",
      "Private covered sit-out entry porch & stone garden pathway",
      "High exposed timber rafters & private ensuite bathroom",
    ],
    mealPlans: ["EP (Room Only)", "CP (Breakfast)", "MAP (Half Board)", "AP (Full Board)"],
    policyNotes: [
      "Starting base tariff: ₹5,999 / night (Excl. 12% GST)",
      "Direct walking access to Ayurvedic spa, gym, and nature trails",
      "Rollaway extra bed available (+₹600 / night)",
      "Quiet wellness enclave with perimeter butterfly gardens",
    ],
    images: [
      {
        sceneId: "cottage-entry-p32",
        label: "Cottage Porch & Garden Path",
        alt: "Architectural 3D render of standalone wooden cottage exterior entrance, covered porch, and natural stone garden walkway",
      },
      {
        sceneId: "cottage-std-bed-p40",
        label: "Timber Cottage Bedroom",
        alt: "Architectural 3D render of timber cottage interior featuring exposed wooden rafters, rustic queen bed, and ambient lamps",
      },
      {
        sceneId: "cottage-std-console-p41",
        label: "Timber Console & Wardrobe",
        alt: "Architectural 3D render of cottage interior with handcrafted timber media console, dressing table, and wardrobe nook",
      },
      {
        sceneId: "washroom-luxury-p42",
        label: "Ensuite Cottage Washroom",
        alt: "Architectural 3D render of cottage luxury ensuite washroom with rustic stone and timber accents",
      },
    ],
  },
  {
    name: "Wooden Cottages — Dormitory",
    zone: "Timber Wellness Zone · Block 2",
    specs: "Group Cottage · Bunker Beds · 10–12 Guests",
    lead: "Spacious independent timber group cottage designed for family reunions, youth excursions, and corporate retreats.",
    startingTariff: "₹8,999",
    tariffUnit: "/ night",
    taxNote: "Full Unit · 10–12 Pax",
    highlights: [
      "10–12 comfortable bunker beds with individual charging ports",
      "Multiple ensuite rain shower and washroom cubicles",
      "High wooden ceilings set within private landscaped grounds",
    ],
    mealPlans: ["CP (Breakfast Included)", "MAP (Half Board)", "AP (Full Group Catering)"],
    policyNotes: [
      "Full dormitory unit tariff: ₹8,999 / night (Excl. 12% GST)",
      "Priced for entire unit up to 10–12 guests (not charged per bed)",
      "Full-unit private booking with dedicated personal lockers",
      "Ideal base for milestone celebrations and team retreats",
    ],
    images: [
      {
        sceneId: "cottage-terrace-seating-p44",
        label: "Covered Veranda Lounge",
        alt: "Architectural 3D render of group cottage covered wooden veranda with woven relaxation seating and peaceful garden outlook",
      },
      {
        sceneId: "cottage-dorm-bath-p39",
        label: "Cottage Bedroom & Bath Flow",
        alt: "Architectural 3D render of group cottage layout showing open multi-bed flow, stone washbasins, and open ensuite area",
      },
      {
        sceneId: "washroom-shower-p16",
        label: "Ensuite Rain Shower Cubicles",
        alt: "Architectural 3D render of spacious multi-cubicle rain shower and washroom facility",
      },
    ],
  },
  {
    name: "Poolside Cottages",
    zone: "Poolside Enclave",
    specs: "Poolside Cottage · Queen Bed · Up to 2 Adults",
    lead: "Exclusive standalone cottage situated right beside the pool courtyard with a shaded terrace lounge and direct water access.",
    startingTariff: "₹11,999",
    tariffUnit: "/ night",
    taxNote: "Excl. 12% GST",
    highlights: [
      "Direct private poolside terrace access with shaded daybed lounge",
      "Covered timber living pavilion beside the pool for tranquil relaxation",
      "Secluded boundary garden ensuring absolute privacy and peace",
    ],
    mealPlans: ["EP (Room Only)", "CP (Breakfast)", "MAP (Half Board)", "AP (Full Board)"],
    policyNotes: [
      "Starting base tariff: ₹11,999 / night (Excl. 12% GST)",
      "Exclusive 24×7 pool access & dedicated in-villa room service",
      "Sole accommodation category with pet-friendly accommodation privilege",
      "Rollaway extra bed available (+₹600 / night)",
    ],
    images: [
      {
        sceneId: "cottage-pool-terrace-p34",
        label: "Poolside Terrace & Daybed",
        alt: "Architectural 3D render of poolside cottage exterior with covered timber deck, relaxation armchairs, and direct pool access",
      },
      {
        sceneId: "dusk-pool-candidate-p38",
        label: "Poolside Cottages at Dusk",
        alt: "Architectural 3D render of poolside cottages at twilight with warm lantern illumination reflecting across the swimming pool",
      },
      {
        sceneId: "hero-pool-day-desktop-p37",
        label: "Daylight Pool Courtyard",
        alt: "Architectural 3D render of central resort infinity pool and poolside cottages along the stone colonnade under natural daylight",
      },
      {
        sceneId: "washroom-twin-vanity-p17",
        label: "Poolside Ensuite Washroom",
        alt: "Architectural 3D render of poolside cottage ensuite washroom featuring stone vanity and designer mirror",
      },
    ],
  },
];

