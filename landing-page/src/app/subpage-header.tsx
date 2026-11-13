"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { logo } from "./resort-assets";
import { ArrowRight } from "./icons";

const navLinks = [
  { href: "/stay", label: "Stay" },
  { href: "/dining", label: "Dining" },
  { href: "/experiences", label: "Experiences" },
  { href: "/gatherings", label: "Gatherings" },
  { href: "/membership", label: "Membership" },
  { href: "/#amenities", label: "Amenities" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#location", label: "Location" },
  { href: "/#story", label: "Story" },
];

const mobileExploreLinks = [
  { href: "/", label: "Home" },
  { href: "/stay", label: "Stay (Accommodations)" },
  { href: "/dining", label: "Dining & Lounges" },
  { href: "/experiences", label: "Signature Experiences" },
  { href: "/gatherings", label: "Gatherings & Banquets" },
  { href: "/membership", label: "Membership Privileges" },
  { href: "/#amenities", label: "Amenities & Recreation" },
  { href: "/#gallery", label: "Resort Gallery" },
  { href: "/#location", label: "Location & Heritage" },
  { href: "/#story", label: "Brand Story" },
];

export default function SubpageHeader() {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }
    function onResize() {
      if (window.innerWidth >= 1120 && menu.current) menu.current.open = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  function close() {
    if (menu.current) menu.current.open = false;
  }

  return (
    <header className="site-navbar-header" role="banner">
      <div className="wrap site-navbar-inner">
        {/* Top-Left Corner: Brand Logo */}
        <Link href="/" className="site-navbar-logo" aria-label="Golden Hills Resort, return home">
          <Image
            src={logo}
            alt="Golden Hills Resort"
            width={2360}
            height={1120}
            priority
            sizes="136px"
          />
        </Link>

        {/* Center: Clean & Readable Desktop Navigation Buttons */}
        <nav className="site-navbar-links" aria-label="Main resort navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`site-navbar-link ${isActive ? "site-navbar-link--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Primary Call to Action & Mobile Menu */}
        <div className="site-navbar-actions">
          <Link href="/plan-ahead#bookings" className="site-navbar-cta">
            Plan your stay
          </Link>

          <details ref={menu} className="opening-menu site-navbar-mobile-menu">
            <summary aria-label="Toggle navigation menu">
              <span className="opening-menu-label">Menu</span>
              <span className="opening-menu-lines" aria-hidden="true">
                <i />
                <i />
              </span>
            </summary>
            <nav className="opening-mobile-nav" aria-label="Mobile navigation">
              <div className="wrap opening-mobile-nav-inner">
                <div className="opening-mobile-group">
                  <p>Explore Golden Hills</p>
                  {mobileExploreLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={close}>
                      {link.label}
                      <ArrowRight />
                    </Link>
                  ))}
                </div>
                <div className="opening-mobile-group opening-mobile-actions">
                  <p>Reservations &amp; Access</p>
                  <Link href="/plan-ahead#bookings" onClick={close}>
                    Plan your stay
                    <ArrowRight />
                  </Link>
                  <Link href="/#location" onClick={close}>
                    Resort Location
                    <ArrowRight />
                  </Link>
                </div>
                <p className="opening-mobile-note">
                  Golden Hills Resort · Stay · Dine · Gather · Biligi, Bagalkote
                </p>
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

