"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Fire, ArrowUpRight } from "@phosphor-icons/react";
import { rng } from "@/lib/iso";
import { TOKEN, explorerTx } from "@/lib/config";
import { FurnaceArt } from "./FurnaceArt";
import { supplyStats, useEngine } from "./Engine";

type Row = { id: string; amount: number; minsAgo: number; hash: string; href?: string };

// Demo feed, shown (and labeled) only while the engine has no live token.
const hex = (r: () => number, n: number) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join("");
function seedDemo(): Row[] {
  const r = rng(2026);
  return Array.from({ length: 6 }, (_, i) => ({
    id: `d${i}`,
    amount: Math.round(180_000 + r() * 2_400_000),
    minsAgo: 4 + i * 37 + Math.floor(r() * 20),
    hash: `0x${hex(r, 64)}`,
  }));
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const ago = (m: number) => (m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ${m % 60} min ago` : `${Math.floor(m / 1440)} d ago`);

export function Ledger() {
  const { mode, data } = useEngine();
  const live = mode === "live" && data !== null;
  const [demo, setDemo] = useState<Row[]>(seedDemo);

  const rows: Row[] = useMemo(() => {
    if (!live) return demo;
    const now = Date.now();
    return data.burns.map((b) => ({
      id: b.burnTx,
      amount: parseFloat(b.tokens) || 0,
      minsAgo: Math.max(0, Math.floor((now - Date.parse(b.at)) / 60_000)),
      hash: b.burnTx,
      href: explorerTx(b.burnTx),
    }));
  }, [live, data, demo]);

  const totals = useMemo(() => {
    if (live) {
      const s = supplyStats(data);
      return { burned: s.burned, left: s.left, count: data.burnCount };
    }
    const burned = demo.reduce((sum, b) => sum + b.amount, 0);
    return { burned, left: TOKEN.supply - burned, count: demo.length };
  }, [live, data, demo]);

  const totalRef = useRef<HTMLSpanElement>(null);
  const supplyRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const beat = useRef<HTMLDivElement>(null);
  const shown = useRef({ burned: 0, left: TOKEN.supply, count: 0 });
  const topId = useRef<string | null>(null);
  const wasLive = useRef(live);
  const [newId, setNewId] = useState<string | null>(null);

  useEffect(() => {
    const paint = (v: typeof totals) => {
      if (totalRef.current) totalRef.current.textContent = fmt(v.burned);
      if (supplyRef.current) supplyRef.current.textContent = fmt(v.left);
      if (countRef.current) countRef.current.textContent = fmt(v.count);
    };
    const from = { ...shown.current };
    shown.current = { ...totals };
    const top = rows[0]?.id ?? null;
    // switching demo -> live is not a burn
    const fresh = wasLive.current === live && topId.current !== null && top !== null && top !== topId.current;
    wasLive.current = live;
    topId.current = top;
    setNewId(fresh ? top : null);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !fresh) {
      paint(totals);
      return;
    }
    // One downbeat: every counter moves on the same burn, together, and the furnace swallows a brick.
    const proxy = { ...from };
    const tw = gsap.to(proxy, { ...totals, duration: 0.9, ease: "power3.out", onUpdate: () => paint(proxy) });
    const root = beat.current;
    if (root) {
      gsap.fromTo(root.querySelector(".ledger__stats"), { scale: 1 }, { scale: 1.03, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", transformOrigin: "0 50%" });
      const brick = root.querySelector(".fa-brick");
      if (brick)
        gsap
          .timeline()
          .fromTo(brick, { x: 0, y: 0, opacity: 1, scale: 1 }, { x: 64, y: -32, duration: 0.55, ease: "power1.inOut" })
          .to(brick, { opacity: 0, scale: 0.5, transformOrigin: "50% 50%", duration: 0.15 })
          .to(root.querySelectorAll(".fa-mouth, .fa-glow"), { opacity: 1, duration: 0.1 }, "<")
          .set(brick, { x: 0, y: 0, scale: 1 })
          .to(brick, { opacity: 1, duration: 0.3 });
    }
    return () => {
      tw.kill();
    };
  }, [totals, rows]);

  // demo ticks only while there is no live engine
  useEffect(() => {
    if (live) return;
    const r = rng(77);
    let next = 100;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setDemo((prev) => [
        { id: `d${next++}`, amount: Math.round(120_000 + r() * 1_600_000), minsAgo: 0, hash: `0x${hex(r, 64)}` },
        ...prev.slice(0, 7).map((b) => ({ ...b, minsAgo: b.minsAgo + 1 })),
      ]);
    }, 7000);
    return () => window.clearInterval(id);
  }, [live]);

  const max = Math.max(1, ...rows.map((b) => b.amount));

  return (
    <section className="ledger" id="burns" aria-labelledby="ledger-title">
      <div className="ledger__inner">
        <div className="ledger__totals" ref={beat}>
          <h2 id="ledger-title" className="ledger__title">
            The furnace log
          </h2>
          <p className={`ledger__demo${live ? " ledger__demo--live" : ""}`}>
            {live
              ? "Live from Robinhood Chain. Every burn links to its transaction."
              : "Demo feed. Real burns appear here once the contract is live."}
          </p>
          <dl className="ledger__stats">
            <div className="ledger__stat ledger__stat--big">
              <dt>Burned</dt>
              <dd>
                <span ref={totalRef}>0</span>
                <small>{TOKEN.ticker}</small>
              </dd>
            </div>
            <div className="ledger__stat">
              <dt>Supply left</dt>
              <dd>
                <span ref={supplyRef}>{fmt(TOKEN.supply)}</span>
              </dd>
            </div>
            <div className="ledger__stat">
              <dt>Engine burns</dt>
              <dd>
                <span ref={countRef}>0</span>
              </dd>
            </div>
          </dl>
          <FurnaceArt />
        </div>

        <ol className="ledger__feed" aria-label={live ? "Latest burns" : "Latest burns (demo)"}>
          {rows.length === 0 && (
            <li className="burn burn--empty">
              <Fire className="burn__icon" size={20} weight="fill" aria-hidden="true" />
              <p>The furnace is lit. The first burn shows up here as soon as the engine runs its first buyback.</p>
            </li>
          )}
          {rows.map((b) => (
            <li key={b.id} className={`burn${b.id === newId ? " burn--new" : ""}`}>
              <Fire className="burn__icon" size={20} weight="fill" aria-hidden="true" />
              <div className="burn__main">
                <span className="burn__amount">
                  {fmt(b.amount)} <small>{TOKEN.ticker}</small>
                </span>
                <span className="burn__bar" style={{ width: `${(b.amount / max) * 100}%` }} aria-hidden="true" />
              </div>
              <span className="burn__meta">
                {b.href ? (
                  <a className="burn__hash" href={b.href} target="_blank" rel="noopener noreferrer">
                    {b.hash.slice(0, 8)}...{b.hash.slice(-4)}
                    <ArrowUpRight size={12} weight="bold" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="burn__hash">
                    {b.hash.slice(0, 8)}...{b.hash.slice(-4)}
                  </span>
                )}
                <span className="burn__ago">{ago(b.minsAgo)}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
