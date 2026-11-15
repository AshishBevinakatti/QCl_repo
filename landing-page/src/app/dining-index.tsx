"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { DiningOutlet } from "./dining-cards";
import { hoursLabel, outletSlug, statusAt, useNow } from "./dining-hours";
import { getScene } from "./resort-assets";
import { useMotionPreference } from "./motion-provider";
import { MenuButton } from "./dining-menu";

/* The hero's index of the six outlets (unit 3.20). Each row jumps to that
 * outlet's section below. With a fine pointer, the outlet's photograph
 * follows the cursor while a row is hovered — a preview, not the place to
 * look at it (the sections below show it large and open it full screen).
 *
 * Motion: the preview moves by transform only, eased toward the cursor in a
 * rAF loop that stops once it has caught up. Hover-only, so touch and
 * reduced motion never see it. */

export default function DiningIndex({ outlets }: { outlets: DiningOutlet[] }) {
  const now = useNow();
  const reduced = useMotionPreference();
  const [active, setActive] = useState<number | null>(null);
  const [fine, setFine] = useState(false);
  const preview = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const frame = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    // A browser-only fact; reading it during render would not hydrate.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFine(media.matches);
    const onChange = () => setFine(media.matches);
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const follow = !reduced && fine;

  const tick = () => {
    const el = preview.current;
    if (!el) return;
    const p = pos.current;
    const t = target.current;
    p.x += (t.x - p.x) * 0.18;
    p.y += (t.y - p.y) * 0.18;
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    frame.current = Math.abs(t.x - p.x) + Math.abs(t.y - p.y) > 0.5 ? requestAnimationFrame(tick) : 0;
  };

  const onMove = (e: React.PointerEvent) => {
    if (!follow) return;
    target.current = { x: e.clientX, y: e.clientY };
    if (active === null) pos.current = { ...target.current };
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  };

  return (
    <div className="dindex" onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
      <ol className="dindex-list">
        {outlets.map((outlet, index) => {
          const status = now === null ? null : statusAt(outlet.openWindows, now);
          return (
            <li key={outlet.name} className="dindex-item" style={{ "--i": index } as React.CSSProperties}>
              <a
                href={`#${outletSlug(outlet.name)}`}
                className="dindex-row"
                onPointerEnter={() => setActive(index)}
                onFocus={() => setActive(null)}
              >
                <span className="dindex-num">{String(index + 1).padStart(2, "0")}</span>
                <span className="dindex-name">{outlet.name}</span>
                <span className="dindex-hours">{hoursLabel(outlet.openWindows)}</span>
                <span className="dindex-status">
                  {status && (
                    <span className={`dstatus${status.open ? " is-open" : ""}`}>{status.label}</span>
                  )}
                </span>
              </a>
              <MenuButton index={index} name={outlet.name} />
            </li>
          );
        })}
      </ol>

      {follow && (
        <div className={`dindex-preview${active !== null ? " is-on" : ""}`} ref={preview} aria-hidden="true">
          <div className="dindex-preview-frame">
            {outlets.map((outlet, index) => (
              <Image
                key={outlet.name}
                {...getScene(outlet.sceneId)}
                alt=""
                sizes="320px"
                className={index === active ? "is-shown" : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
