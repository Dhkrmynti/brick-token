"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Brick, iso } from "@/lib/iso";
import { TOKEN } from "@/lib/config";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// The fee split as a ten-brick tower: one brick per 10% of every trade fee.
export function SplitTower() {
  const ref = useRef<SVGSVGElement>(null);
  const creator = TOKEN.fees.creatorSharePct / 10;
  const [ax, ay] = iso(2, 1, creator / 2);
  const [bx, by] = iso(2, 1, creator + (10 - creator) / 2);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".tw-brick", {
          y: -260,
          opacity: 0,
          duration: 0.5,
          ease: "power4.out",
          stagger: 0.07,
          scrollTrigger: { trigger: ref.current, start: "top 75%", once: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <svg
      ref={ref}
      className="tower"
      viewBox="-90 -430 460 520"
      role="img"
      aria-label={`Fee split: ${TOKEN.fees.creatorSharePct}% creator for buyback and burn, ${TOKEN.fees.protocolSharePct}% Pons`}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <Brick key={i} className="tw-brick" gx={0} gy={0} gz={i} lx={2} ly={2} tone={i < creator ? "sun" : "sky"} />
      ))}
      <g className="tower__labels">
        <line x1={ax + 10} y1={ay} x2={ax + 80} y2={ay} />
        <text x={ax + 90} y={ay - 6}>
          {TOKEN.fees.creatorSharePct}%
        </text>
        <text x={ax + 90} y={ay + 20} className="tower__sub">
          creator wallet
        </text>
        <line x1={bx + 10} y1={by} x2={bx + 80} y2={by} />
        <text x={bx + 90} y={by - 6}>
          {TOKEN.fees.protocolSharePct}%
        </text>
        <text x={bx + 90} y={by + 20} className="tower__sub">
          Pons protocol
        </text>
      </g>
    </svg>
  );
}
