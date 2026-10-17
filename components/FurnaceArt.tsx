import { Brick, iso } from "@/lib/iso";

// The furnace from Bricktown, close up. `.fa-brick` is the brick the log feeds in on every burn.
const B = 0.3;

export function FurnaceArt() {
  const mouth = [iso(1, 3, B + 0.35), iso(3, 3, B + 0.35), iso(3, 3, B + 2), iso(1, 3, B + 2)];
  const [cx, cy] = iso(2, 3, B + 1.1);
  const [sx, sy] = iso(3.4, 1, B + 7);
  return (
    <svg className="furnace-art" viewBox="-330 -360 600 620" aria-hidden="true">
      <defs>
        <radialGradient id="fa-heat" cx="50%" cy="65%" r="65%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="45%" stopColor="#ff9a1f" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <radialGradient id="fa-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9a1f" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ff9a1f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse className="fa-glow" cx={cx} cy={cy + 70} rx={300} ry={150} fill="url(#fa-glow)" />
      <Brick gx={-2} gy={-1} gz={0} lx={9} ly={10} h={B} tone="coal" />
      {[0, 1, 2].map((k) => (
        <Brick key={k} gx={0} gy={0} gz={B + k} lx={4} ly={3} tone={k % 2 ? "coal" : "stone"} studs={k === 2} />
      ))}
      {[3, 4, 5, 6].map((k) => (
        <Brick key={k} gx={2} gy={0} gz={B + k} lx={2} ly={2} tone={k % 2 ? "tomato" : "coal"} studs={k === 6} />
      ))}
      <polygon
        className="fa-mouth"
        points={mouth.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="url(#fa-heat)"
        stroke="#1b1f2d"
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <Brick gx={1.5} gy={5} gz={B} lx={1} ly={1} h={0.35} tone="stone" studs={false} />
      <Brick gx={1} gy={3} gz={B + 0.35} lx={2} ly={4.2} h={0.2} tone="coal" studs={false} />
      <Brick className="fa-brick" gx={1} gy={5.6} gz={B + 0.55} lx={2} ly={1} tone="sun" />
      <Brick gx={1} gy={6.2} gz={B + 0.55} lx={2} ly={1} tone="sky" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} className="fa-ember" cx={sx - 20 + i * 11} cy={sy - 10} r={3 + (i % 2)} fill="#ffb35c" style={{ animationDelay: `${i * 0.55}s` }} />
      ))}
    </svg>
  );
}
