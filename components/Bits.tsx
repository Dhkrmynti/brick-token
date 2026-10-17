import { Brick, type ToneName } from "@/lib/iso";

function zig(x0: number, x1: number, y: number, tooth: number, up: boolean) {
  let d = "";
  const n = Math.round(Math.abs(x1 - x0) / tooth);
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const xm = x0 + step * (i + 0.5);
    const xe = x0 + step * (i + 1);
    d += `L${xm.toFixed(1)},${(up ? y - 6 : y + 6).toFixed(1)}L${xe.toFixed(1)},${y}`;
  }
  return d;
}

// A sealed, numbered parts bag with a few bricks inside.
export function Bag({ n, label, tones, className = "" }: { n: number; label: string; tones: ToneName[]; className?: string }) {
  const body = `M14,28${zig(14, 206, 28, 16, true)}L206,262${zig(206, 14, 262, 16, false)}Z`;
  return (
    <figure className={`bag ${className}`}>
      <svg viewBox="0 0 220 290" aria-hidden="true">
        <path d={body} className="bag__film" />
        <rect x={14} y={40} width={192} height={10} className="bag__seal" />
        <g transform="translate(118 168) scale(.62)">
          <Brick gx={-1} gy={0} gz={0} lx={2} ly={2} tone={tones[0]} />
          <Brick gx={1.4} gy={0.2} gz={0} lx={2} ly={1} tone={tones[1]} />
          <Brick gx={-0.6} gy={0.4} gz={1} lx={2} ly={1} tone={tones[2]} />
        </g>
        <path d="M40,70 C 36,130 38,190 46,236" className="bag__shine" />
        <circle cx={62} cy={96} r={30} className="bag__dot" />
        <text x={62} y={108} textAnchor="middle" className="bag__num">
          {n}
        </text>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}
