// "BRICK" built from extruded bricks: bold 2-stud strokes, a top face and studs wherever nothing sits on top,
// a side face wherever nothing sits to the right.

const GLYPHS: Record<string, string[]> = {
  B: ["111110", "110011", "110011", "111110", "110011", "110011", "111110"],
  R: ["111110", "110011", "110011", "111110", "111100", "110110", "110011"],
  I: ["1111", "0110", "0110", "0110", "0110", "0110", "1111"],
  C: ["011111", "110000", "110000", "110000", "110000", "110000", "011111"],
  K: ["110011", "110110", "111100", "111000", "111100", "110110", "110011"],
};

const FACES = [
  { face: "#e2452d", top: "#f56b4f", side: "#ad301d", stud: "#ff8d73" },
  { face: "#f7bb22", top: "#ffd75e", side: "#c98d08", stud: "#ffe48c" },
  { face: "#26b583", top: "#52d8a8", side: "#198462", stud: "#7be6bf" },
  { face: "#47a9f5", top: "#7fc9ff", side: "#2a7cc4", stud: "#a6d9ff" },
  { face: "#e3e8f0", top: "#f8fafd", side: "#aeb8cc", stud: "#ffffff" },
];

const U = 20;
const BH = 22;
const D = 8;
const GAP = 1;

type Piece = { x: number; y: number; w: number; letter: number; open: number[]; side: boolean };

function build(word: string) {
  const pieces: Piece[] = [];
  let ox = 0;
  word.split("").forEach((ch, li) => {
    const g = GLYPHS[ch];
    const width = g[0].length;
    const filled = (r: number, c: number) => r >= 0 && r < g.length && c >= 0 && c < width && g[r][c] === "1";
    g.forEach((line, row) => {
      let c = 0;
      while (c < width) {
        if (line[c] !== "1") {
          c++;
          continue;
        }
        let end = c;
        while (end < width && line[end] === "1") end++;
        let start = c;
        // stagger joints row to row so it reads as a bonded wall
        let first = row % 2 === 0 ? 2 : 3;
        while (start < end) {
          const len = Math.min(first, end - start, end - start === 4 ? 2 : 3);
          const open: number[] = [];
          for (let k = start; k < start + len; k++) if (!filled(row - 1, k)) open.push(k - start);
          pieces.push({ x: ox + start, y: row, w: len, letter: li, open, side: !filled(row, start + len) });
          start += len;
          first = 2;
        }
        c = end;
      }
    });
    ox += width + GAP;
  });
  return { pieces: pieces.sort((a, b) => b.y - a.y || a.x - b.x), cols: ox - GAP };
}

const { pieces: PIECES, cols: COLS } = build("BRICK");

export function Wordmark({ className }: { className?: string }) {
  const width = COLS * U + D;
  const height = 7 * BH + D + 8;
  return (
    <svg className={className} viewBox={`0 ${-D - 8} ${width} ${height}`} role="img" aria-label="BRICK">
      {PIECES.map((p, i) => {
        const f = FACES[p.letter];
        const x = p.x * U;
        const y = p.y * BH;
        const w = p.w * U;
        return (
          <g key={i} className="wm-brick">
            {p.open.length > 0 && (
              <polygon
                points={`${x},${y} ${x + D},${y - D} ${x + w + D},${y - D} ${x + w},${y}`}
                fill={f.top}
              />
            )}
            {p.side && (
              <polygon
                points={`${x + w},${y} ${x + w + D},${y - D} ${x + w + D},${y + BH - D} ${x + w},${y + BH}`}
                fill={f.side}
              />
            )}
            <rect x={x} y={y} width={w} height={BH} fill={f.face} />
            <rect x={x} y={y} width={w} height={2} fill={f.top} opacity={0.6} />
            <line x1={x} y1={y + BH} x2={x + w} y2={y + BH} stroke="rgba(10,16,48,.25)" strokeWidth={1} />
            <line x1={x} y1={y} x2={x} y2={y + BH} stroke="rgba(10,16,48,.22)" strokeWidth={1} />
            {p.open.map((k) => {
              const cx = x + k * U + U / 2 + D / 2;
              const cy = y - D / 2;
              return (
                <g key={k}>
                  <rect x={cx - 5.5} y={cy - 5} width={11} height={5} fill={f.side} />
                  <ellipse cx={cx} cy={cy} rx={5.5} ry={2.4} fill={f.side} />
                  <ellipse cx={cx} cy={cy - 5} rx={5.5} ry={2.4} fill={f.stud} />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
