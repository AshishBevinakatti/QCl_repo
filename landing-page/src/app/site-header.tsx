"use client";

import { motion, type MotionValue } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight } from "./icons";

const resortLinks = [
  { href: "#cottages", label: "Stay" },
  { href: "#dining", label: "Dining" },
  { href: "#spaces", label: "Experiences" },
  { href: "#gatherings", label: "Gather" },
  { href: "#vision", label: "About" },
];

const menuActions = [
  { href: "/plan-ahead#bookings", label: "Book Now" },
  { href: "/plan-ahead#login", label: "Login" },
  { href: "/plan-ahead#enquiries", label: "Enquire" },
];

export default function SiteHeader({ enhanced, revealed, chrome, children }: {
  enhanced: boolean; revealed: boolean; chrome: MotionValue<number>;
  children: ReactNode;
}) {
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
    <header className="site-header opening-masthead" role="banner" data-settled={revealed || undefined}>
      <motion.div className="opening-chrome" inert={enhanced && !revealed} style={enhanced ? { opacity: chrome } : undefined}>
        <div className="wrap opening-nav-row">
          <nav className="opening-desktop opening-nav-left" aria-label="Resort navigation">
            {resortLinks.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
          </nav>
          <nav className="opening-desktop opening-nav-right" aria-label="Account and enquiries">
            <Link href="/plan-ahead#login">Login</Link>
            <Link className="opening-book-action" href="/plan-ahead#bookings">Book Now</Link>
          </nav>
          <Link className="opening-mobile-book" href="/plan-ahead#bookings">Book Now</Link>
          <a className="opening-fallback-brand" href="#top">Golden Hills</a>
          <details ref={menu} className="opening-menu">
            <summary><span className="opening-menu-label">Menu</span><span className="opening-menu-lines" aria-hidden="true"><i /><i /></span></summary>
            <nav className="opening-mobile-nav" aria-label="Mobile navigation">
              <div className="wrap opening-mobile-nav-inner">
                <div className="opening-mobile-group"><p>Explore the resort</p>
                  {resortLinks.map(link => <a key={link.href} href={link.href} onClick={close}>{link.label}<ArrowRight /></a>)}
                </div>
                <div className="opening-mobile-group opening-mobile-actions"><p>Plan ahead</p>
                  {menuActions.map(link => <Link key={link.href} href={link.href} onClick={close}>{link.label}<ArrowRight /></Link>)}
                </div>
                <p className="opening-mobile-note">Bookings and guest accounts are not available while the resort is in development.</p>
              </div>
            </nav>
          </details>
        </div>
      </motion.div>
      {children}
    </header>
  );
}
