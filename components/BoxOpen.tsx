"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Scene } from "./Scene";
import { Wordmark } from "./Wordmark";
import { Bag } from "./Bits";
import { BuyLink } from "./BuyLink";
import { CopyCA } from "./CopyCA";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const BAGS = [
  { n: 1, label: "Supply", tones: ["sun", "tomato", "sky"] },
  { n: 2, label: "Fees", tones: ["sky", "sun", "mint"] },
  { n: 3, label: "Buyback", tones: ["mint", "snow", "tomato"] },
  { n: 4, label: "Burn", tones: ["tomato", "coal", "sun"] },
] as const;

export function BoxOpen() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", portrait: "(orientation: portrait)" }, (ctx) => {
        if (!ctx.conditions?.motion) return;
        const el = root.current!;
        const lid = el.querySelector<HTMLElement>(".lid")!;

        // The wordmark snaps together brick by brick on arrival.
        gsap.from(".wm-brick", {
          y: -220,
          opacity: 0,
          duration: 0.55,
          ease: "power4.out",
          stagger: 0.014,
          delay: 0.15,
        });
        gsap.from(".lid__window", { y: 40, opacity: 0, duration: 0.9, ease: "expo.out", delay: 0.25 });
        gsap.from(".lid__callout", { scale: 0.4, opacity: 0, duration: 0.5, ease: "back.out(2.2)", delay: 1.05 });
        // one pass of light across the laminated print, like tilting a new box
        gsap.fromTo(".lid__shine", { xPercent: -130 }, { xPercent: 260, duration: 1.7, ease: "power2.inOut", delay: 0.9 });

        // Signature moment: scrolling lifts the lid off the box. Only when the whole box front fits the
        // screen; on short screens (phone landscape, small phones) the page simply flows.
        if (lid.scrollHeight > window.innerHeight + 2) return;
        el.classList.add("box-open--anim");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top top", end: "+=120%", pin: true, scrub: 0.8, anticipatePin: 1 },
        });
        tl.to(".lid", { yPercent: -112, rotateX: 16, scale: 0.94, ease: "power2.in", duration: 1 }, 0)
          .to(".lid__shadow", { opacity: 0, duration: 0.6 }, 0.3)
          .from(
            ".interior .bag",
            { y: 90, rotate: (i: number) => [-8, 5, -4, 9][i], opacity: 0, stagger: 0.07, duration: 0.55, ease: "power3.out" },
            0.35,
          )
          .from(".interior__head", { y: 30, opacity: 0, duration: 0.4, ease: "power3.out" }, 0.4);

        const refocus = () => {
          if (window.scrollY > 0) window.scrollTo({ top: 0 });
        };
        lid.addEventListener("focusin", refocus);

        return () => {
          lid.removeEventListener("focusin", refocus);
          el.classList.remove("box-open--anim");
        };
      });
    },
    { scope: root },
  );

  return (
    <section className="box-open" ref={root} id="top">
      <div className="interior" id="inside">
        <div className="interior__walls" aria-hidden="true">
          <span className="wall wall--top" />
          <span className="wall wall--left" />
          <span className="wall wall--right" />
          <span className="wall wall--bottom" />
        </div>
        <div className="interior__inner">
          <h2 className="interior__head">
            Four bags.
            <br />
            One engine.
          </h2>
          <div className="interior__bags">
            {BAGS.map((b) => (
              <Bag key={b.n} n={b.n} label={b.label} tones={[...b.tones]} />
            ))}
          </div>
        </div>
      </div>

      <div className="lid">
        <div className="lid__shadow" aria-hidden="true" />
        <div className="lid__face">
          <div className="lid__band" aria-hidden="true" />
          <div className="lid__copy">
            <Wordmark className="lid__wordmark" />
            <h1 className="lid__title">Every trade feeds the furnace.</h1>
            <p className="lid__sub">
              A meme coin on Robinhood Chain that uses its creator fees to buy itself back and burn it.
            </p>
            <div className="lid__actions">
              <BuyLink />
              <CopyCA />
            </div>
          </div>
          <div className="lid__window">
            <div className="lid__art">
              <Scene variant="box" />
            </div>
            <div className="lid__age" aria-label="Ages 18 and up">
              <strong>18+</strong>
              <span>ages</span>
            </div>
            <div className="lid__pcs">
              <strong>1,000,000,000</strong>
              <span>pcs</span>
            </div>
            <p className="lid__callout" aria-hidden="true">
              Furnace included
            </p>
            <p className="lid__set">Buyback &amp; Burn Set, launched on Pons</p>
          </div>
          <div className="lid__shine" aria-hidden="true" />
        </div>
        <div className="lid__top" aria-hidden="true" />
        <div className="lid__side" aria-hidden="true">
          <p className="lid__side-print">
            <span className="lid__side-brand">$BRICK</span>
            <span>Buyback &amp; Burn Set</span>
            <span className="lid__side-no">No. 4663</span>
          </p>
        </div>
      </div>
    </section>
  );
}
