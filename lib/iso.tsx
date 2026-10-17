import type { CSSProperties } from "react";

// Isometric (2:1 dimetric) projection for stud-and-tube toy bricks.
// One grid unit = one stud pitch. Heights are in brick units.
export const W = 64;
export const H = 32;
export const Z = 38;

export type Pt = [number, number];
export const iso = (gx: number, gy: number, gz: number): Pt => [
  ((gx - gy) * W) / 2,
  ((gx + gy) * H) / 2 - gz * Z,
];
const pts = (a: Pt[]) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

export type ToneName =
  | "tomato"
  | "sun"
  | "mint"
  | "sky"
  | "snow"
  | "stone"
  | "coal"
  | "plate"
  | "cobalt";

type Tone = { top: string; left: string; right: string; stud: string };

export const TONES: Record<ToneName, Tone> = {
  tomato: { top: "#f56b4f", left: "#e2452d", right: "#ad301d", stud: "#ff8d73" },
  sun: { top: "#ffd75e", left: "#f7bb22", right: "#c98d08", stud: "#ffe48c" },
  mint: { top: "#52d8a8", left: "#26b583", right: "#198462", stud: "#7be6bf" },
  sky: { top: "#7fc9ff", left: "#47a9f5", right: "#2a7cc4", stud: "#a6d9ff" },
  snow: { top: "#f8fafd", left: "#dde3ee", right: "#b3bdd0", stud: "#ffffff" },
  stone: { top: "#8a92a8", left: "#6a7289", right: "#4b5268", stud: "#9ea6bb" },
  coal: { top: "#4d5368", left: "#383d50", right: "#262a3a", stud: "#5d647a" },
  plate: { top: "#2a8a62", left: "#1f6e4e", right: "#165339", stud: "#36a175" },
  cobalt: { top: "#5577f2", left: "#2348d4", right: "#17329c", stud: "#7290f7" },
};

const RX = 0.707 * 0.3 * W;
const RY = 0.707 * 0.3 * H;
const STUD_H = 9;

export function Stud({ x, y, tone }: { x: number; y: number; tone: Tone }) {
  return (
    <>
      <path
        d={`M${x - RX},${y - STUD_H}L${x - RX},${y}A${RX},${RY} 0 0 0 ${x + RX},${y}L${x + RX},${y - STUD_H}Z`}
        fill={tone.left}
      />
      <ellipse cx={x} cy={y - STUD_H} rx={RX} ry={RY} fill={tone.stud} />
    </>
  );
}

export type BrickSpec = {
  gx: number;
  gy: number;
  gz: number;
  lx?: number;
  ly?: number;
  h?: number;
  tone: ToneName;
  studs?: boolean;
  layer?: number;
};

type BrickProps = BrickSpec & { className?: string; style?: CSSProperties };

export function Brick({
  gx,
  gy,
  gz,
  lx = 2,
  ly = 1,
  h = 1,
  tone,
  studs = true,
  className,
  style,
}: BrickProps) {
  const t = TONES[tone];
  const zt = gz + h;
  const top = pts([iso(gx, gy, zt), iso(gx + lx, gy, zt), iso(gx + lx, gy + ly, zt), iso(gx, gy + ly, zt)]);
  const right = pts([iso(gx + lx, gy, zt), iso(gx + lx, gy + ly, zt), iso(gx + lx, gy + ly, gz), iso(gx + lx, gy, gz)]);
  const left = pts([iso(gx, gy + ly, zt), iso(gx + lx, gy + ly, zt), iso(gx + lx, gy + ly, gz), iso(gx, gy + ly, gz)]);
  const cells: Pt[] = [];
  if (studs) {
    const order: [number, number][] = [];
    for (let i = 0; i < lx; i++) for (let j = 0; j < ly; j++) order.push([i, j]);
    order.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
    for (const [i, j] of order) cells.push(iso(gx + i + 0.5, gy + j + 0.5, zt));
  }
  return (
    <g className={className} style={style}>
      <polygon points={left} fill={t.left} stroke="rgba(12,18,48,.28)" strokeWidth={1} strokeLinejoin="round" />
      <polygon points={right} fill={t.right} stroke="rgba(12,18,48,.28)" strokeWidth={1} strokeLinejoin="round" />
      <polygon points={top} fill={t.top} stroke="rgba(255,255,255,.18)" strokeWidth={1} strokeLinejoin="round" />
      {cells.map(([x, y], i) => (
        <Stud key={i} x={x} y={y} tone={t} />
      ))}
    </g>
  );
}

// Deterministic RNG so server and client render the same pile.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PILE_TONES: ToneName[] = ["tomato", "sun", "mint", "sky", "snow", "sun", "tomato", "sky"];

// A stepped heap of bricks: each layer shrinks by one stud on alternating sides.
export function makePile(seed: number, ox: number, oy: number, size = 8, layers = 8): BrickSpec[] {
  const r = rng(seed);
  const out: BrickSpec[] = [];
  for (let k = 0; k < layers; k++) {
    const x0 = Math.floor(k / 2);
    const x1 = size - Math.ceil(k / 2);
    const y0 = Math.ceil(k / 2);
    const y1 = size - Math.floor(k / 2);
    if (x1 - x0 < 1 || y1 - y0 < 1) break;
    const used = new Set<string>();
    const free = (x: number, y: number) => x >= x0 && x < x1 && y >= y0 && y < y1 && !used.has(`${x},${y}`);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (!free(x, y)) continue;
        let lx = 1;
        let ly = 1;
        const roll = r();
        if (roll < 0.18 && free(x + 1, y) && free(x, y + 1) && free(x + 1, y + 1)) {
          lx = 2;
          ly = 2;
        } else if (roll < 0.6 && free(x + 1, y)) lx = 2;
        else if (free(x, y + 1)) ly = 2;
        else if (free(x + 1, y)) lx = 2;
        for (let i = 0; i < lx; i++) for (let j = 0; j < ly; j++) used.add(`${x + i},${y + j}`);
        out.push({
          gx: ox + x,
          gy: oy + y,
          gz: k,
          lx,
          ly,
          tone: PILE_TONES[Math.floor(r() * PILE_TONES.length)],
          layer: k,
        });
      }
    }
  }
  return out.sort(
    (a, b) =>
      a.gz - b.gz ||
      a.gx + (a.lx ?? 2) / 2 + a.gy + (a.ly ?? 1) / 2 - (b.gx + (b.lx ?? 2) / 2 + b.gy + (b.ly ?? 1) / 2),
  );
}
