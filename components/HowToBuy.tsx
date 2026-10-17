"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Brick, type BrickSpec } from "@/lib/iso";
import { BuyLink } from "./BuyLink";
import { CopyCA } from "./CopyCA";
import { TOKEN } from "@/lib/config";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Step = { title: string; body: string; part: string; qty: string; build: BrickSpec[] };

const STEPS: Step[] = [
  {
    title: "Set up a wallet",
    body: `Use any EVM wallet and add ${TOKEN.chain} as a network.`,
    part: "EVM wallet",
    qty: "1x",
    build: [
      { gx: 0, gy: 0, gz: 0, lx: 4, ly: 2, tone: "cobalt" },
      { gx: 2, gy: 0, gz: 1, lx: 2, ly: 1, tone: "sun" },
    ],
  },
  {
    title: "Load some ETH",
    body: `Bridge ETH to ${TOKEN.chain}. It pays for gas and for your $BRICK.`,
    part: "ETH on Robinhood Chain",
    qty: "3x",
    build: [
      { gx: 1, gy: 0, gz: 0, lx: 2, ly: 2, tone: "sky" },
      { gx: 1, gy: 0, gz: 1, lx: 2, ly: 2, tone: "snow" },
      { gx: 1, gy: 0, gz: 2, lx: 2, ly: 2, tone: "sky" },
    ],
  },
  {
    title: "Find $BRICK on Pons",
    body: "Open Pons and paste the contract address. Check it matches this page.",
    part: "contract address",
    qty: "1x",
    build: [
      { gx: 0, gy: 0, gz: 0, lx: 2, ly: 2, tone: "tomato" },
      { gx: 2.4, gy: 0.5, gz: 0, lx: 1, ly: 1, tone: "snow" },
    ],
  },
  {
    title: "Swap and hold",
    body: "Swap ETH for $BRICK. Every trade after yours feeds the furnace.",
    part: "patience",
    qty: "1x",
    build: [
      { gx: 0, gy: 0, gz: 0, lx: 2, ly: 1, tone: "sky" },
      { gx: 2.6, gy: 0, gz: 0, lx: 2, ly: 1, tone: "sun" },
      { gx: 2.6, gy: 0, gz: 1, lx: 2, ly: 1, tone: "tomato" },
    ],
  },
];

export function HowToBuy() {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 900px)", () => {
        const getDistance = () => Math.max(0, track.current!.scrollWidth - wrap.current!.clientWidth);
        const pan = gsap.to(track.current, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: wrap.current,
            start: "top top",
            end: () => `+=${getDistance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        // each page's parts drop in as it slides into view
        gsap.utils.toArray<HTMLElement>(".page__build", wrap.current).forEach((b) => {
          gsap.from(b.querySelectorAll("g.part"), {
            y: -80,
            opacity: 0,
            stagger: 0.08,
            duration: 0.45,
            ease: "power4.out",
            scrollTrigger: { trigger: b, containerAnimation: pan, start: "left 80%", toggleActions: "play none none reverse" },
          });
        });
      });
    },
    { scope: wrap },
  );

  return (
    <section className="manual" id="how-to-buy" ref={wrap} aria-labelledby="manual-title">
      <div className="manual__track" ref={track}>
        <header className="manual__cover">
          <h2 id="manual-title" className="manual__title">
            Building instructions
          </h2>
          <p className="manual__lead">Four steps from zero to holding $BRICK.</p>
          <CopyCA variant="dark" />
        </header>
        {STEPS.map((s, i) => (
          <article className="page" key={s.title}>
            <span className="page__step" aria-hidden="true">
              {i + 1}
            </span>
            <div className="page__callout">
              <svg viewBox="-70 -70 140 110" aria-hidden="true">
                <Brick {...s.build[s.build.length - 1]} gx={-1} gy={0} gz={0} />
              </svg>
              <span>
                <strong>{s.qty}</strong> {s.part}
              </span>
            </div>
            <svg className="page__build" viewBox="-150 -140 300 210" aria-hidden="true">
              {s.build.map((b, k) => (
                <Brick key={k} {...b} className="part" />
              ))}
            </svg>
            <h3 className="page__title">
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
            </h3>
            <p className="page__body">{s.body}</p>
            <span className="page__folio" aria-hidden="true">
              {i + 2}
            </span>
          </article>
        ))}
        <aside className="page page--end">
          <p className="page__done">Set complete.</p>
          <BuyLink />
        </aside>
      </div>
    </section>
  );
}
