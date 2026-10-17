import { TOKEN } from "@/lib/config";
import { rng } from "@/lib/iso";
import { SplitTower } from "./SplitTower";

const r = rng(4663);
const BARS = Array.from({ length: 46 }, () => 1 + Math.floor(r() * 3));

const ITEMS = [
  { qty: "1,000,000,000", what: `${TOKEN.ticker}, total and final supply` },
  { qty: `${TOKEN.fees.tradeFeePct}%`, what: "fee on every trade in the Pons pool" },
  { qty: `${TOKEN.fees.creatorSharePct}%`, what: "of that fee to the creator wallet, which funds buybacks and burns" },
  { qty: `${TOKEN.fees.protocolSharePct}%`, what: "of that fee to the Pons protocol" },
  { qty: "0", what: "extra mints. The box is sealed." },
];

export function Contents() {
  return (
    <section className="contents" id="contents" aria-labelledby="contents-title">
      <div className="contents__panel">
        <h2 id="contents-title" className="contents__title">
          What&rsquo;s in the box
        </h2>
        <div className="contents__body">
          <ul className="contents__list">
            {ITEMS.map((it) => (
              <li key={it.what}>
                <strong>{it.qty}</strong>
                <span>{it.what}</span>
              </li>
            ))}
          </ul>
          <SplitTower />
        </div>
        <footer className="contents__foot">
          <div className="contents__chain">
            <span>{TOKEN.chain}</span>
            <span>Chain ID {TOKEN.chainId}</span>
          </div>
          <svg className="barcode" viewBox="0 0 160 48" aria-hidden="true">
            {(() => {
              let x = 0;
              return BARS.map((w, i) => {
                const el = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w * 1.3} height={48} fill="currentColor" /> : null;
                x += w * 1.3 + 0.9;
                return el;
              });
            })()}
          </svg>
        </footer>
      </div>
    </section>
  );
}
