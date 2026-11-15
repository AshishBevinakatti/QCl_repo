"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* Draws each pencil sketch once, the first time it scrolls into view
 * (unit 3.22). Sketches start visible; only once this runs does the page get
 * .sketch-js, which hides the strokes until they are drawn — so without
 * JavaScript, or with reduced motion, the drawings are simply there.
 * Re-scans on every route change because client navigation brings new
 * sketches without a reload. Sketches marked .sketch-manual are driven by
 * their own component (the opening's side drawings follow scroll progress). */

export default function SketchObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("sketch-js");

    const observer = new IntersectionObserver((records) => {
      for (const r of records) {
        if (!r.isIntersecting) continue;
        r.target.classList.add("is-drawn");
        observer.unobserve(r.target);
      }
    }, { threshold: 0.35 });

    for (const el of document.querySelectorAll(".sketch:not(.is-drawn):not(.sketch-manual)")) observer.observe(el);
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
