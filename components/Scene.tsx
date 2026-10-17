import { Brick, iso, makePile, rng, type ToneName } from "@/lib/iso";

// Bricktown: the box-art scene. The heap is circulating supply, the furnace is the burn address.
// Every animated part carries a class so the scroll timeline can drive it.

const BASE = 0.3;
const ORIGIN = { x: 1050, y: 330 };
const PILE = makePile(7, 6, 11, 8, 8);
const PILE_MAX = Math.max(...PILE.map((b) => b.layer ?? 0));

function skyline(seed: number, from: number, to: number, base: number, min: number, max: number) {
  const r = rng(seed);
  const out: { x: number; w: number; h: number }[] = [];
  let x = from;
  while (x < to) {
    const w = 56 + Math.floor(r() * 4) * 28;
    out.push({ x, w, h: min + r() * (max - min) });
    x += w + 6 + r() * 18;
  }
  return out.map((b) => ({ ...b, y: base - b.h }));
}
const FAR = skyline(3, -40, 1840, 720, 90, 230);
const NEAR = skyline(11, -20, 1840, 760, 50, 150);

function Skyline({ blocks, className, fill, studFill }: { blocks: ReturnType<typeof skyline>; className: string; fill: string; studFill: string }) {
  return (
    <g className={className}>
      {blocks.map((b, i) => {
        const studs = Math.floor(b.w / 28);
        return (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h + 300} rx={3} fill={fill} />
            {Array.from({ length: studs }, (_, s) => (
              <rect key={s} x={b.x + 6 + s * 28} y={b.y - 7} width={16} height={8} rx={2} fill={studFill} />
            ))}
          </g>
        );
      })}
    </g>
  );
}

export function Scene({ variant, viewBox, fit = "slice" }: { variant: "story" | "box"; viewBox?: string; fit?: "slice" | "meet" }) {
  const story = variant === "story";
  const heat = `heat-${variant}`;
  const mouth = [iso(11.5, 6, BASE + 0.45), iso(13.5, 6, BASE + 0.45), iso(13.5, 6, BASE + 2.3), iso(11.5, 6, BASE + 2.3)];
  const [cx, cy] = iso(12.5, 6, BASE + 1.3);
  const [chx, chy] = iso(14, 3, BASE + 8);
  const [lcx, lcy] = iso(21, 11, BASE);
  const [lpx, lpy] = iso(25, 8, BASE);

  return (
    <svg
      className={`scene scene--${variant}`}
      viewBox={viewBox ?? (story ? "0 0 1800 1000" : "470 90 1260 820")}
      preserveAspectRatio={`xMidYMid ${fit}`}
      role="img"
      aria-label={
        story
          ? "Bricktown: a heap of toy bricks next to a brick furnace, with fee stacks and a conveyor between them"
          : "Box art: a heap of colorful toy bricks beside a brick furnace on a green baseplate"
      }
    >
      <defs>
        <radialGradient id={heat} cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="45%" stopColor="#ff9a1f" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <radialGradient id={`${heat}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9a1f" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#ff9a1f" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className="sun" cx={860} cy={170} r={58} fill="#ffd75e" />
      <Skyline blocks={FAR} className="skyline-far" fill="var(--skyline-far)" studFill="var(--skyline-far)" />
      <Skyline blocks={NEAR} className="skyline-near" fill="var(--skyline-near)" studFill="var(--skyline-near)" />

      <g transform={`translate(${ORIGIN.x} ${ORIGIN.y})`}>
        <Brick gx={4} gy={2} gz={0} lx={21} ly={18} h={BASE} tone="plate" />

        {/* furnace */}
        {[0, 1, 2, 3].map((k) => (
          <Brick key={k} gx={10} gy={2} gz={BASE + k} lx={5} ly={4} tone={k % 2 ? "coal" : "stone"} studs={k === 3} />
        ))}
        {[4, 5, 6, 7].map((k) => (
          <Brick key={k} gx={13} gy={2} gz={BASE + k} lx={2} ly={2} tone={k % 2 ? "tomato" : "coal"} studs={k === 7} />
        ))}
        <ellipse className="furnace-glow" cx={cx} cy={cy + 40} rx={190} ry={90} fill={`url(#${heat}-glow)`} opacity={story ? 0.25 : 0.55} />
        <polygon
          className="furnace-mouth"
          points={mouth.map(([x, y]) => `${x},${y}`).join(" ")}
          fill={`url(#${heat})`}
          stroke="#262a3a"
          strokeWidth={6}
          strokeLinejoin="round"
          opacity={story ? 0.55 : 0.9}
        />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} className="puff" cx={chx + i * 10} cy={chy - 20 - i * 34} r={18 + i * 9} fill="var(--smoke)" opacity={story ? 0 : 0.55 - i * 0.12} />
        ))}

        {/* conveyor from heap to furnace */}
        <Brick gx={12} gy={7.5} gz={BASE} lx={1} ly={1} h={0.4} tone="stone" studs={false} />
        <Brick gx={12} gy={9.5} gz={BASE} lx={1} ly={1} h={0.4} tone="stone" studs={false} />
        <Brick gx={11.5} gy={6} gz={BASE + 0.4} lx={2} ly={5} h={0.22} tone="coal" studs={false} />
        {story &&
          (["tomato", "sky", "sun", "mint"] as ToneName[]).map((t, i) => (
            <Brick key={i} className="belt-b" gx={11.5} gy={9.6} gz={BASE + 0.62} lx={2} ly={1} tone={t} />
          ))}

        {PILE.map((b, i) => (
          <Brick
            key={i}
            {...b}
            gz={b.gz + BASE}
            className={`pile-b${(b.layer ?? 0) >= PILE_MAX - 2 ? " pile-burn" : ""}${(b.layer ?? 0) === PILE_MAX - 3 ? " pile-lift" : ""}`}
          />
        ))}

        {story && (
          <>
            {Array.from({ length: 7 }, (_, i) => (
              <Brick key={i} className="fee-b fee-c" gx={19} gy={9} gz={BASE + i} lx={2} ly={2} tone="sun" />
            ))}
            {Array.from({ length: 3 }, (_, i) => (
              <Brick key={i} className="fee-b fee-p" gx={23} gy={6} gz={BASE + i} lx={2} ly={2} tone="sky" />
            ))}
            <g className="fee-label">
              <text x={lcx - 20} y={lcy + 44} className="scene-label fee-label-c" textAnchor="middle">
                70% creator
              </text>
              <text x={lpx - 20} y={lpy + 44} className="scene-label" textAnchor="middle">
                30% Pons
              </text>
            </g>
          </>
        )}
      </g>
    </svg>
  );
}
