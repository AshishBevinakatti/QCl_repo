"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { logoLight } from "./resort-assets";
import { useMotionPreference } from "./motion-provider";

/* The membership card, built in code rather than photographed (unit 3.19).
 * This is the page's one bright element: brass foil on forest board, a
 * serial number and the real wordmark. It leans toward the pointer so it
 * reads as an object with weight, not a picture of one. */

export default function MembershipCard({ vouchers, coupons }: { vouchers: number; coupons: number }) {
  const reduced = useMotionPreference();
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function lean(event: React.PointerEvent) {
    if (reduced || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    setTilt({ x: -py * 9, y: px * 12 });
  }

  const pad = (n: number) => String(n).padStart(3, "0");

  return (
    <div
      className="mcard-stage"
      onPointerMove={lean}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div
        ref={ref}
        className="mcard"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="mcard-face">
          <div className="mcard-top">
            <Image src={logoLight} alt="" width={132} height={44} className="mcard-logo" />
            <span className="mcard-kind">Charter member</span>
          </div>

          <div className="mcard-chip" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <div className="mcard-foot">
            <p className="mcard-serial">{pad(vouchers)} <i>/</i> {pad(coupons)}</p>
            <p className="mcard-serial-label">Vouchers / coupons</p>
          </div>
        </div>
        <span className="mcard-sheen" aria-hidden="true" />
      </div>
      <p className="mcard-caption">Card artwork is indicative</p>
    </div>
  );
}
