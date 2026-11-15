import type { CSSProperties } from "react";

/* Pencil drawings (unit 3.22). A small set of line sketches from the resort's
 * own world: the pool courtyard, a cottage, a thali, the banquet lawn, the
 * zipline, a Chalukyan temple, the hills, a bonfire and a banyan tree.
 *
 * Every stroke has pathLength=1 so it can be drawn in when scrolled into view
 * (SketchObserver adds .is-drawn). Each stroke is laid twice, the second a
 * faint offset copy, and both run through the #pencil filter so the line
 * wobbles and doubles like graphite rather than a vector. Decorative only. */

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;

const DRAWINGS = {
  pool: [
    "M20 102 V56 Q20 30 45 30 Q70 30 70 56 V102",
    "M28 82 H62 M28 82 V102 M62 82 V102",
    "M34 64 q11 -12 22 0",
    "M100 102 V70 H182 V102",
    "M100 86 H140 M140 70 V86 M120 86 V102 M160 86 V102 M140 94 H182 M160 70 V78",
    "M118 80 q7 4 7 24 M138 80 q7 4 7 24 M158 80 q7 4 7 24",
    "M8 104 H192 L180 130 H20 Z",
    "M36 116 q10 -3 20 0 t20 0 M96 122 q10 -3 20 0 t20 0 M126 112 q8 -3 16 0",
    "M84 102 q-6 -20 -16 -28 M84 102 q2 -22 10 -32 M84 102 q8 -14 20 -18",
  ],
  cottage: [
    "M34 62 L100 18 L166 62",
    "M44 60 L100 24 L156 60",
    "M60 50 l8 -5 M72 42 l8 -5 M120 38 l8 5 M132 46 l8 5",
    "M50 60 V108 H150 V60",
    "M88 108 V76 H112 V108 M100 76 V108",
    "M60 72 H78 V90 H60 Z M69 72 V90 M122 72 H140 V90 H122 Z M131 72 V90",
    "M28 108 H196 M28 114 H150",
    "M154 116 H196 L190 132 H160 Z M166 124 q6 -2 12 0",
    "M22 110 Q20 82 26 56 M26 56 q-14 -2 -22 8 M26 56 q12 -6 22 2 M26 56 q-4 -12 -14 -16 M26 56 q8 -10 18 -10",
  ],
  thali: [
    circle(100, 74, 56),
    circle(100, 74, 49),
    circle(70, 54, 11) + " " + circle(92, 40, 11),
    circle(116, 40, 11) + " " + circle(136, 56, 11),
    circle(82, 94, 18),
    "M74 88 q4 -3 8 0 M86 100 q4 -3 8 0",
    ellipse(124, 94, 17, 11),
    "M116 92 l5 -2 M126 89 l5 1 M120 99 l5 -2 M130 97 l4 1",
  ],
  banquet: [
    "M10 30 Q55 50 100 30 Q145 50 190 30",
    circle(32, 38, 2.5) + " " + circle(55, 41, 2.5) + " " + circle(78, 38, 2.5),
    circle(122, 38, 2.5) + " " + circle(145, 41, 2.5) + " " + circle(168, 38, 2.5),
    "M10 30 V122 M190 30 V122",
    ellipse(62, 104, 24, 6) + " M62 110 V122 M54 122 H70",
    ellipse(138, 104, 24, 6) + " M138 110 V122 M130 122 H146",
    "M62 98 V88 M58 88 q4 -7 8 0 M138 98 V88 M134 88 q4 -7 8 0",
    "M32 112 q-2 -12 4 -18 M92 112 q2 -12 -4 -18 M108 112 q-2 -12 4 -18 M168 112 q2 -12 -4 -18",
    "M0 124 H200",
  ],
  zipline: [
    "M0 112 Q40 82 80 102 T160 92 T200 102",
    "M24 122 L34 40 L44 122 M27 96 H41 M30 70 H38 M26 40 H44",
    "M34 40 Q110 70 186 98",
    "M106 64 h10 M111 64 V74",
    circle(111, 79, 4) + " M111 83 L109 97 M109 97 L103 106 M109 97 L115 105 M111 86 L107 76 M111 86 L115 76",
    "M186 98 V124 M180 124 H192",
    "M140 30 q4 -4 8 0 q4 -4 8 0 M160 20 q3 -3 6 0 q3 -3 6 0",
  ],
  temple: [
    "M16 120 H184 M26 112 H174 M26 112 V120 M174 112 V120",
    "M40 112 V76 M58 112 V76 M76 112 V76 M124 112 V76 M142 112 V76 M160 112 V76",
    "M32 76 H168 M36 70 H164",
    "M70 70 L80 38 Q92 22 104 38 L114 70",
    "M76 56 H108 M73 63 H111 M79 46 H105",
    "M92 28 V20 " + circle(92, 17, 2.5),
    "M84 120 V130 H116 V120 M88 125 H112",
    "M90 112 V84 Q92 78 94 84 V112",
  ],
  hills: [
    "M6 104 Q60 40 104 74 Q132 52 194 104",
    "M58 104 Q110 64 160 104",
    "M96 66 Q118 48 132 70",
    circle(156, 40, 12),
    "M36 42 q4 -4 8 0 q4 -4 8 0 M60 30 q3 -3 6 0 q3 -3 6 0",
    "M0 118 q50 -6 100 0 t100 0",
    "M20 128 q40 -4 80 0 t80 0",
  ],
  bonfire: [
    ellipse(100, 118, 46, 8),
    "M66 120 L134 98 M66 98 L134 120",
    "M100 104 q-18 -20 0 -46 q4 18 12 22 q6 -12 0 -24 q18 16 6 48",
    "M94 102 q-6 -12 4 -22 q2 10 8 12",
    circle(84, 46, 1.5) + " " + circle(118, 38, 1.5) + " " + circle(104, 28, 1.5),
    "M20 120 q6 -16 18 -16 q10 0 12 16 M150 120 q4 -16 16 -16 q12 0 14 16",
  ],
  tree: [
    "M92 124 Q96 90 90 70 M108 124 Q104 90 112 70",
    "M40 74 Q30 50 56 44 Q60 22 90 28 Q110 10 134 26 Q164 22 166 48 Q186 58 170 76 Q150 88 120 80 Q100 90 80 82 Q56 90 40 74 Z",
    "M60 52 q10 -6 20 0 M110 34 q10 -6 20 0 M140 56 q8 -4 16 0",
    "M62 84 V120 M72 86 V114 M150 82 V118 M140 84 V110",
    "M16 124 H184",
  ],
  palm: [
    "M70 136 Q64 96 80 52 M120 136 Q130 104 116 66",
    "M74 120 h7 M72 100 h8 M75 80 h7 M123 118 h7 M124 98 h7 M120 82 h6",
    "M80 52 q-22 -6 -40 8 M80 52 q-14 -20 -36 -22 M80 52 q6 -22 26 -30",
    "M80 52 q22 -4 36 10 M80 52 q2 14 -6 30",
    "M116 66 q-16 -14 -34 -12 M116 66 q14 -18 34 -16 M116 66 q20 2 30 18",
    "M28 136 H172",
  ],
  lantern: [
    "M100 0 V24",
    "M84 24 H116 M88 18 H112",
    "M84 24 L78 60 Q100 74 122 60 L116 24",
    "M92 24 L90 64 M108 24 L110 66",
    circle(100, 44, 5),
    "M88 68 L84 94 M100 71 V102 M112 68 L116 94",
    "M150 0 V40 M142 40 H158 L154 62 Q150 66 146 62 Z M150 66 V80",
  ],
  picnic: [
    "M30 118 L60 92 H170 L190 118 Z",
    "M48 102 H178 M40 110 H184",
    "M86 92 V74 H124 V92 M92 74 Q105 56 118 74",
    "M86 83 H124 M98 74 V92 M110 74 V92",
    ellipse(150, 104, 10, 3) + " M62 102 v-7 h8 v7",
    "M18 118 Q24 84 18 60",
    "M18 60 q-16 -4 -12 -20 q4 -16 22 -12 q14 -10 24 4 q12 8 0 22 q-10 10 -34 6",
    "M140 30 q4 -4 8 0 q4 -4 8 0",
  ],
  cinema: [
    "M50 20 H150 V80 H50 Z",
    "M64 66 q18 -16 36 -4 t36 -6",
    "M60 80 V112 M140 80 V112",
    "M30 122 q0 -16 16 -16 q16 0 16 16 Z M84 122 q0 -16 16 -16 q16 0 16 16 Z M138 122 q0 -16 16 -16 q16 0 16 16 Z",
    "M178 16 a10 10 0 1 0 8 18 a8 8 0 1 1 -8 -18",
    "M18 18 h6 M21 15 v6 M30 44 h4 M32 42 v4 M168 56 h4 M170 54 v4",
    "M8 124 H192",
  ],
} as const;

export type SketchName = keyof typeof DRAWINGS;

export function Sketch({ name, className = "", label }: { name: SketchName; className?: string; label?: string }) {
  const paths = DRAWINGS[name];
  return (
    <svg
      className={`sketch ${className}`}
      viewBox="0 0 200 140"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
    >
      <g filter="url(#pencil)">
        {paths.map((d, i) => (
          <path key={i} d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />
        ))}
        <g className="sketch-ghost" transform="translate(0.8 0.6)">
          {paths.map((d, i) => (
            <path key={i} d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/** The filter every sketch uses: a little turbulence displaces each line so it
 *  reads as drawn by hand. Rendered once, in the root layout. */
export function PencilDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
