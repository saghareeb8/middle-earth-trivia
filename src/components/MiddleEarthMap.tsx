"use client";

import { motion } from "framer-motion";
import type { Team } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// A geographically faithful (stylised) map of Middle-earth. North is up.
//
// Layout follows Tolkien's geography: the Great Sea to the west, the Misty
// Mountains running north–south through the centre, Mirkwood and the Anduin
// to the east, the White Mountains in the south, and Mordor walled-off in the
// south-east. The quest route traces the journey of the Ring from the Shire
// (north-west) to Mount Doom (south-east).
//
// All artwork is hand-drawn SVG (no copyrighted map assets). To use your own
// licensed map image instead, drop it in as an <image> behind the route group.
// ─────────────────────────────────────────────────────────────────────────

const VIEW_W = 1000;
const VIEW_H = 720;

// Tiny deterministic PRNG so the terrain looks the same on every render.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── The quest route (ordered waypoints, NW → SE) ────────────────────────
interface Waypoint {
  name: string;
  x: number;
  y: number;
  // Label placement hints (hand-tuned to avoid overlap).
  anchor?: "start" | "middle" | "end";
  dx?: number;
  dy?: number;
  major?: boolean;
}

const ROUTE: Waypoint[] = [
  { name: "The Shire", x: 118, y: 208, dy: -16, major: true },
  { name: "Bree", x: 232, y: 236, dy: -14 },
  { name: "Weathertop", x: 340, y: 210, dy: -14 },
  { name: "Rivendell", x: 452, y: 184, dy: -14, major: true },
  { name: "Caradhras", x: 502, y: 268, anchor: "end", dx: -16, dy: 2 },
  { name: "Moria", x: 548, y: 318, dy: 26 },
  { name: "Lothlórien", x: 600, y: 326, anchor: "start", dx: 16, dy: 4 },
  { name: "Argonath", x: 650, y: 420, anchor: "start", dx: 16 },
  { name: "Rauros", x: 658, y: 470, anchor: "start", dx: 16 },
  { name: "Emyn Muil", x: 708, y: 498, dy: -14 },
  { name: "Dead Marshes", x: 752, y: 522, dy: 26 },
  { name: "Black Gate", x: 796, y: 496, dy: -14 },
  { name: "Ithilien", x: 750, y: 572, anchor: "end", dx: -14 },
  { name: "Cirith Ungol", x: 808, y: 596, dy: 26 },
  { name: "Mount Doom", x: 858, y: 556, anchor: "start", dx: 16, dy: 2, major: true },
];

// Cumulative segment lengths → map a 0..1 fraction to a point on the route.
const segLengths = ROUTE.slice(1).map((p, i) =>
  Math.hypot(p.x - ROUTE[i].x, p.y - ROUTE[i].y),
);
const totalLength = segLengths.reduce((s, l) => s + l, 0);

function pointAt(t: number): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, t));
  let target = clamped * totalLength;
  for (let i = 0; i < segLengths.length; i++) {
    if (target <= segLengths[i]) {
      const f = segLengths[i] === 0 ? 0 : target / segLengths[i];
      const a = ROUTE[i];
      const b = ROUTE[i + 1];
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
    target -= segLengths[i];
  }
  const last = ROUTE[ROUTE.length - 1];
  return { x: last.x, y: last.y };
}

const routeD = ROUTE.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

// ── Terrain generators ──────────────────────────────────────────────────
interface Peak {
  x: number;
  y: number;
  s: number;
}

/** A ridge of mountain peaks from (x1,y1) to (x2,y2). */
function ridge(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  count: number,
  size: number,
  seed: number,
): Peak[] {
  const rng = mulberry32(seed);
  const peaks: Peak[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    peaks.push({
      x: x1 + (x2 - x1) * t + (rng() - 0.5) * size * 0.8,
      y: y1 + (y2 - y1) * t + (rng() - 0.5) * size * 0.7,
      s: size * (0.7 + rng() * 0.6),
    });
  }
  // Draw back-to-front so nearer (lower) peaks overlap farther ones.
  return peaks.sort((a, b) => a.y - b.y);
}

function Mountains({
  peaks,
  fill,
  stroke,
}: {
  peaks: Peak[];
  fill: string;
  stroke: string;
}) {
  return (
    <g stroke={stroke} strokeWidth={1} strokeLinejoin="round">
      {peaks.map((p, i) => (
        <g key={i}>
          <path
            d={`M ${p.x - p.s} ${p.y} L ${p.x} ${p.y - p.s * 1.5} L ${p.x + p.s} ${p.y} Z`}
            fill={fill}
          />
          {/* snow/shade highlight on the left face */}
          <path
            d={`M ${p.x} ${p.y - p.s * 1.5} L ${p.x - p.s * 0.32} ${p.y - p.s * 0.45} L ${p.x - p.s * 0.04} ${p.y - p.s * 0.45} Z`}
            fill="#f1e6cd"
            stroke="none"
            opacity={0.7}
          />
        </g>
      ))}
    </g>
  );
}

/** A forest: scattered canopy blobs within an ellipse. */
function Forest({
  cx,
  cy,
  rx,
  ry,
  count,
  color,
  seed,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  count: number;
  color: string;
  seed: number;
}) {
  const rng = mulberry32(seed);
  const blobs = Array.from({ length: count }, () => {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng());
    return {
      x: cx + Math.cos(a) * rx * r,
      y: cy + Math.sin(a) * ry * r,
      s: 7 + rng() * 9,
    };
  });
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx + 6} ry={ry + 6} fill={color} opacity={0.18} />
      {blobs.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.s} fill={color} opacity={0.5} />
      ))}
      {blobs.map((b, i) => (
        <circle key={`d${i}`} cx={b.x - b.s * 0.3} cy={b.y - b.s * 0.3} r={b.s * 0.45} fill={color} opacity={0.7} />
      ))}
    </g>
  );
}

const MISTY = ridge(470, 96, 556, 372, 16, 17, 7);
const WHITE_MTNS = ridge(508, 600, 706, 588, 12, 14, 21);
const MORDOR_N = ridge(742, 452, 928, 458, 13, 14, 33); // Ered Lithui
const MORDOR_W = ridge(744, 470, 786, 632, 10, 14, 44); // Ephel Dúath
const GREY_MTNS = ridge(640, 92, 760, 96, 7, 12, 51);

interface Props {
  teams: Team[];
  winningScore: number;
}

export function MiddleEarthMap({ teams, winningScore }: Props) {
  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto rounded-2xl panel-parchment"
        role="img"
        aria-label="Map of Middle-earth tracing the journey of the Ring from the Shire to Mount Doom, with each team's current position"
      >
        <defs>
          <radialGradient id="land" cx="42%" cy="38%" r="80%">
            <stop offset="0%" stopColor="#efe1c0" />
            <stop offset="100%" stopColor="#cdb37e" />
          </radialGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7d9c97" />
            <stop offset="100%" stopColor="#5e827e" />
          </linearGradient>
          <radialGradient id="mordor" cx="60%" cy="40%" r="80%">
            <stop offset="0%" stopColor="#4a3030" />
            <stop offset="100%" stopColor="#241818" />
          </radialGradient>
          <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Land */}
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#land)" />

        {/* The Great Sea (west) and the Bay of Belfalas (south-west) */}
        <path
          d="M0,0 L62,0 C 74,150 52,300 70,420 C 84,520 150,545 210,592 C 250,624 235,660 300,700 L 0,720 Z"
          fill="url(#sea)"
        />
        <g stroke="#e9dcbf" strokeWidth="1.5" fill="none" opacity="0.4">
          <path d="M24,120 q14,10 0,20" />
          <path d="M30,300 q14,10 0,20" />
          <path d="M120,620 q16,10 0,20" />
          <path d="M180,660 q16,10 0,20" />
        </g>

        {/* Anduin, the Great River — north to the southern delta */}
        <path
          d="M664,108 C 648,190 668,250 650,316 C 636,372 660,420 656,470 C 650,540 612,590 560,648 C 520,690 360,700 300,700"
          fill="none"
          stroke="#6f93a6"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Brandywine, near the Shire */}
        <path
          d="M168,150 C 176,210 156,250 176,300"
          fill="none"
          stroke="#6f93a6"
          strokeWidth="3"
          opacity="0.7"
        />

        {/* Forests */}
        <Forest cx={186} cy={262} rx={26} ry={20} count={16} color="#5d7038" seed={3} />
        <Forest cx={726} cy={186} rx={58} ry={86} count={70} color="#46582f" seed={9} />
        <Forest cx={606} cy={330} rx={26} ry={24} count={22} color="#7d8a3a" seed={12} />
        <Forest cx={566} cy={432} rx={30} ry={34} count={34} color="#4f6630" seed={15} />

        {/* Mountain ranges (drawn before Mordor fill, peaks layered after) */}
        <Mountains peaks={GREY_MTNS} fill="#9a8559" stroke="#5b4423" />
        <Mountains peaks={MISTY} fill="#9a8559" stroke="#5b4423" />
        <Mountains peaks={WHITE_MTNS} fill="#b6a884" stroke="#6b5836" />

        {/* Mordor — walled land in the south-east */}
        <path
          d="M742,452 C 820,440 906,448 936,470 C 952,520 948,600 922,648 C 868,672 800,664 760,636 C 736,560 728,500 742,452 Z"
          fill="url(#mordor)"
          opacity="0.92"
        />
        <Mountains peaks={MORDOR_N} fill="#3a2a2a" stroke="#241616" />
        <Mountains peaks={MORDOR_W} fill="#3a2a2a" stroke="#241616" />
        {/* Barad-dûr */}
        <g transform="translate(905,545)">
          <path d="M-5,8 L-5,-14 L0,-22 L5,-14 L5,8 Z" fill="#1c1212" stroke="#5b4423" strokeWidth="0.8" />
          <circle cx="0" cy="-22" r="2.5" fill="var(--color-ember)" className="animate-ember" />
        </g>

        {/* ── Regional labels (faded, behind the route) ── */}
        <g
          fontFamily="Cinzel, serif"
          fill="#6b5430"
          opacity="0.55"
          style={{ pointerEvents: "none" }}
        >
          <text x="150" y="150" fontSize="20" letterSpacing="6" opacity="0.7">ERIADOR</text>
          <text x="726" y="300" fontSize="20" letterSpacing="6" textAnchor="middle" opacity="0.7">RHOVANION</text>
          <text x="610" y="540" fontSize="17" letterSpacing="5" textAnchor="middle">ROHAN</text>
          <text x="688" y="636" fontSize="17" letterSpacing="5" textAnchor="middle">GONDOR</text>
          <text x="726" y="118" fontSize="13" textAnchor="middle" fontStyle="italic">Mirkwood</text>
          <text x="566" y="436" fontSize="11" textAnchor="middle" fontStyle="italic">Fangorn</text>
          <text x="40" y="400" fontSize="16" letterSpacing="4" fill="#3f5b56" opacity="0.8" transform="rotate(-90 40 400)">THE GREAT SEA</text>
          <text x="612" y="372" fontSize="12" fontStyle="italic" transform="rotate(74 612 372)" opacity="0.8">Anduin</text>
          <text x="486" y="240" fontSize="12" fontStyle="italic" transform="rotate(74 486 240)" opacity="0.85">Misty Mountains</text>
        </g>
        <text
          x="844" y="500" fontFamily="Cinzel, serif" fontSize="22" letterSpacing="7"
          textAnchor="middle" fill="#c25a3a" opacity="0.85" fontWeight="700"
          style={{ pointerEvents: "none" }}
        >
          MORDOR
        </text>

        {/* Compass rose */}
        <g transform="translate(936,70)" opacity="0.7">
          <circle r="22" fill="none" stroke="#7a5a2a" strokeWidth="1" />
          <path d="M0,-22 L4,0 L0,22 L-4,0 Z" fill="#7a5a2a" />
          <path d="M-22,0 L0,4 L22,0 L0,-4 Z" fill="#9a8559" />
          <text x="0" y="-26" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="11" fill="#5b4423">N</text>
        </g>

        {/* ── The quest route ── */}
        <path
          d={routeD}
          fill="none"
          stroke="#3a2c17"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 11"
          opacity="0.9"
        />

        {/* Waypoints */}
        {ROUTE.map((p, i) => {
          const isEnd = i === ROUTE.length - 1;
          return (
            <g key={p.name} style={{ pointerEvents: "none" }}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.major ? 6 : 3.5}
                fill={isEnd ? "var(--color-ember)" : "#3a2c17"}
                className={isEnd ? "animate-ember" : undefined}
              />
              <text
                x={p.x + (p.dx ?? 0)}
                y={p.y + (p.dy ?? -12)}
                textAnchor={p.anchor ?? "middle"}
                fontFamily="Cinzel, serif"
                fontSize={p.major ? 16 : 12}
                fontWeight={p.major ? 700 : 600}
                fill="#2a1d0e"
                stroke="#efe1c0"
                strokeWidth="2.4"
                paintOrder="stroke"
              >
                {p.name}
              </text>
            </g>
          );
        })}

        {/* Team markers */}
        {teams.map((team, i) => {
          const t = winningScore > 0 ? team.score / winningScore : 0;
          const { x, y } = pointAt(t);
          const markerOffset = i === 0 ? -16 : 16;
          const labelY = i === 0 ? -22 : 30;
          return (
            <motion.g
              key={team.id}
              initial={false}
              animate={{ x, y: y + markerOffset }}
              transition={{ type: "spring", stiffness: 60, damping: 16 }}
              filter="url(#markerShadow)"
              style={{ pointerEvents: "none" }}
            >
              <circle r="13" fill={team.color} stroke="#1b1407" strokeWidth="2" />
              <circle r="6" fill="#1b1407" opacity="0.35" />
              <text
                x="0"
                y={labelY}
                textAnchor="middle"
                fontFamily="Cinzel, serif"
                fontSize="14"
                fontWeight="700"
                fill="#2a1d0e"
                stroke="#efe1c0"
                strokeWidth="2.6"
                paintOrder="stroke"
              >
                {team.name}
              </text>
            </motion.g>
          );
        })}

        {/* Decorative inner border */}
        <rect
          x="6" y="6" width={VIEW_W - 12} height={VIEW_H - 12}
          fill="none" stroke="#7a5a2a" strokeWidth="2" rx="14" opacity="0.6"
          style={{ pointerEvents: "none" }}
        />
      </svg>
    </div>
  );
}
