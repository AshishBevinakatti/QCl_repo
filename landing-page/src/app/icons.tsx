import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & { size?: number };

function Icon({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </Icon>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

export function ArrowDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" />
      <path d="m18 13-6 6-6-6" />
    </Icon>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function ChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export function ArrowUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </Icon>
  );
}

/* =========================================================================
   Amenity & Facility Icons (P1 Enrichment)
   ========================================================================= */

export function PoolWaves(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 7c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 17c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </Icon>
  );
}

export function SpaLotus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3c-1.5 3-4 6-4 9a4 4 0 0 0 8 0c0-3-2.5-6-4-9Z" />
      <path d="M8 12c-2.5-1-5 0-6 2 2 3 5 3 7 1" />
      <path d="M16 12c2.5-1 5 0 6 2-2 3-5 3-7 1" />
      <path d="M6 19a10 10 0 0 0 12 0" />
    </Icon>
  );
}

export function GymFitness(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 5v14M18 5v14M4 8v8M20 8v8M6 12h12" />
    </Icon>
  );
}

export function AdventureCompass(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,7 15,12 12,17 9,12" />
    </Icon>
  );
}

export function RainDanceMist(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" />
      <path d="M8 17v3M12 16v4M16 17v3" />
    </Icon>
  );
}

export function BonfireFlame(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2c1.5 3.5 3.5 5 3.5 8a4.5 4.5 0 0 1-9 0c0-3.5 3.5-5.5 3.5-8Z" />
      <path d="M4 21l16-4M20 21l-16-4" />
    </Icon>
  );
}

export function CoreUtilities(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </Icon>
  );
}

/* =========================================================================
   Membership & Privilege Icons
   ========================================================================= */

export function BedDouble(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M12 4v6" />
      <path d="M2 17h20" />
    </Icon>
  );
}

export function Utensils(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
      <path d="M15 11v11" />
      <path d="M5 2v4a3 3 0 0 0 3 3h1v13" />
    </Icon>
  );
}

export function WineGlass(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 22h8" />
      <path d="M12 15v7" />
      <path d="M12 15a5 5 0 0 0 5-5V2H7v8a5 5 0 0 0 5 5Z" />
    </Icon>
  );
}

export function TicketVoucher(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 9a3 3 0 0 1 0 6v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a3 3 0 0 1 0-6V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 3v18" strokeDasharray="3 3" />
    </Icon>
  );
}

export function Sparkles(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </Icon>
  );
}

export function ShieldCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function Clock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  );
}

export function Users(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}
