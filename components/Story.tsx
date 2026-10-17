"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Scene } from "./Scene";
import { TOKEN } from "@/lib/config";
import { supplyStats, useEngine } from "./Engine";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CHAPTERS = [
  {
    bag: "Supply",
    title: "One billion bricks. Not one more.",
    body: "$BRICK launches on Pons with a fixed supply of 1,000,000,000. No mint button, no hidden second box.",
  },
  {
    bag: "Fees",
    title: "Every trade drops a brick fee.",
    body: `Each trade in the Pons pool pays ${TOKEN.fees.tradeFeePct}%. ${TOKEN.fees.creatorSharePct}% lands in the creator wallet, ${TOKEN.fees.protocolSharePct}% goes to Pons.`,
  },
  {
    bag: "Buyback",
    title: "Creator fees buy $BRICK back.",
    body: "The engine claims creator fees and market-buys $BRICK off the heap, in public, on-chain.",
  },
  {
    bag: "Burn",
    title: "Then the furnace eats it.",
    body: "Bought bricks go to the dead address for good. Supply moves one way only: down.",
  },
];

// Illustrative only: how far the counter drops in the demo burn.
const DEMO_BURN = 18_442_917;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const DESKTOP_VB = "0 0 1800 1000";
const MOBILE_VB = "560 200 1180 760";

export function Story() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const supply = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [mobile, setMobile] = useState(false);
  const { mode, data } = useEngine();
  const live = mode === "live" && data !== null;
  // where the HUD lands in bag 4: the real supply when the engine is live, a labeled demo otherwise
  const target = useRef({ left: TOKEN.supply - DEMO_BURN });
  useEffect(() => {
    target.current.left = live ? supplyStats(data).left : TOKEN.supply - DEMO_BURN;
    // without the scroll timeline (reduced motion) or once past bag 4, the HUD shows the number directly
    const tl = tlRef.current;
    const pastBurn = tl ? tl.progress() >= tl.labels.c4 / tl.duration() - 0.001 : true;
    if (!supply.current || !pastBurn) return;
    const demoStatic = !tl && !live;
    supply.current.textContent = fmt(demoStatic ? TOKEN.supply : target.current.left);
  }, [live, data]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const el = root.current!;
        el.classList.add("story--anim");
        const chapters = gsap.utils.toArray<HTMLElement>(".chapter", el);
        const tabs = gsap.utils.toArray<HTMLElement>(".story__tab", el);
        const sky = el.querySelector(".story__stage")!;

        gsap.set(chapters.slice(1), { autoAlpha: 0, y: 28 });
        gsap.set(".fee-b", { y: -420, opacity: 0 });
        gsap.set(".fee-label", { opacity: 0 });
        gsap.set(".belt-b", { opacity: 0 });
        gsap.set(".puff", { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" });

        const counter = { p: 0 };
        const swap = (tl: gsap.core.Timeline, i: number) =>
          tl
            .to(chapters[i - 1], { autoAlpha: 0, y: -28, duration: 0.25, ease: "power2.in" })
            .to(chapters[i], { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" }, "<0.12");

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "+=420%",
            pin: stage.current,
            scrub: 1,
            anticipatePin: 1,
            snap: { snapTo: "labels", duration: { min: 0.2, max: 0.6 }, delay: 0.08, ease: "power1.inOut" },
            onUpdate: (self) => {
              const t = self.progress * tl.duration();
              const labels = ["c1", "c2", "c3", "c4"].map((l) => tl.labels[l]);
              let active = 0;
              labels.forEach((lt, i) => {
                const prev = i === 0 ? 0 : (labels[i - 1] + lt) / 2;
                if (t >= prev) active = i;
              });
              tabs.forEach((tab, i) => tab.setAttribute("aria-current", i === active ? "step" : "false"));
            },
          },
        });
        tlRef.current = tl;

        tl.addLabel("c1", 0).to({}, { duration: 0.4 });

        // Bag 2: trades rain fee bricks onto two stacks
        swap(tl, 1);
        tl.to(".fee-c", { y: 0, opacity: 1, duration: 0.3, ease: "power3.out", stagger: 0.06 }, "<")
          .to(".fee-p", { y: 0, opacity: 1, duration: 0.3, ease: "power3.out", stagger: 0.08 }, "<0.1")
          .to(".fee-label", { opacity: 1, duration: 0.2 }, "<0.2")
          .addLabel("c2")
          .to({}, { duration: 0.4 });

        // Bag 3: the creator stack is spent, bricks lift off the heap onto the belt
        swap(tl, 2);
        tl.to(".fee-c", { y: -60, opacity: 0, duration: 0.35, stagger: { each: 0.04, from: "end" } }, "<")
          .to(".fee-label-c", { opacity: 0, duration: 0.2 }, "<0.2")
          .to(".pile-lift", { y: -150, opacity: 0, duration: 0.4, stagger: 0.03, ease: "power2.in" }, "<0.1")
          .to(".belt-b", { opacity: 1, duration: 0.2, stagger: 0.08 }, "<0.2")
          .to(sky, { "--sky-top": "#ff9b6a", "--sky-bottom": "#ffd59a", duration: 0.5 }, "<")
          .to(".sun", { attr: { cy: 330 }, fill: "#ff8a3d", duration: 0.5 }, "<")
          .addLabel("c3")
          .to({}, { duration: 0.4 });

        // Bag 4: the belt carries them into the furnace, the heap shrinks, supply ticks down
        swap(tl, 3);
        tl.to(".belt-b", { x: 128, y: -64, duration: 0.6, stagger: 0.12 }, "<")
          .to(".belt-b", { opacity: 0, scale: 0.6, transformOrigin: "50% 50%", duration: 0.15, stagger: 0.12 }, "<0.5")
          .to(".furnace-mouth", { opacity: 1, duration: 0.3 }, "<")
          .to(".furnace-glow", { opacity: 0.95, duration: 0.3 }, "<")
          .to(".puff", { opacity: (i: number) => 0.7 - i * 0.14, scale: 1, y: -60, duration: 0.6, stagger: 0.08, ease: "power2.out" }, "<")
          .to(".pile-burn", { y: -40, opacity: 0, duration: 0.5, stagger: 0.02, ease: "power2.in" }, "<0.1")
          .to(
            counter,
            {
              p: 1,
              duration: 0.7,
              ease: "power2.out",
              onUpdate: () => {
                const v = TOKEN.supply - (TOKEN.supply - target.current.left) * counter.p;
                if (supply.current) supply.current.textContent = fmt(v);
              },
            },
            "<",
          )
          .to(sky, { "--sky-top": "#0d1636", "--sky-bottom": "#2a2457", "--skyline-far": "#1b2550", "--skyline-near": "#141c40", duration: 0.6 }, "<")
          .to(".sun", { attr: { cy: 170 }, fill: "#e8ecf8", duration: 0.6 }, "<")
          .to(".story__hud", { color: "#ffb35c", duration: 0.3 }, "<0.3")
          .addLabel("c4")
          .to({}, { duration: 0.3 });

        // Distant skyline drifts slower than the town: depth while the story plays
        tl.to(".skyline-far", { x: -60, duration: tl.duration() }, 0).to(".skyline-near", { x: -120, duration: tl.duration() }, 0);

        return () => {
          el.classList.remove("story--anim");
          tlRef.current = null;
        };
      });
    },
    { scope: root },
  );

  function jump(i: number) {
    const tl = tlRef.current;
    const st = tl?.scrollTrigger;
    if (!tl || !st) {
      document.getElementById(`chapter-${i + 1}`)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const t = tl.labels[`c${i + 1}`] / tl.duration();
    window.scrollTo({ top: st.start + (st.end - st.start) * t, behavior: "smooth" });
  }

  return (
    <section className="story" ref={root} id="story" aria-label="How the buyback and burn works">
      <div className="story__stage" ref={stage}>
        <div className="story__scene">
          <Scene variant="story" viewBox={mobile ? MOBILE_VB : DESKTOP_VB} fit={mobile ? "meet" : "slice"} />
        </div>

        <p className="story__hud" aria-live="off">
          <span className="story__hud-label">Supply</span>
          <span className="story__hud-num" ref={supply}>
            {fmt(TOKEN.supply)}
          </span>
          <span className="story__hud-note">{live ? "live, burned on-chain" : "demo burn, not live data"}</span>
        </p>

        <div className="story__copy">
          {CHAPTERS.map((c, i) => (
            <article className="chapter" key={c.bag} id={`chapter-${i + 1}`}>
              <h2 className="chapter__title">
                <span className="chapter__num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="sr-only">Bag {i + 1}, {c.bag}: </span>
                {c.title}
              </h2>
              <p className="chapter__body">{c.body}</p>
            </article>
          ))}
        </div>

        <nav className="story__tabs" aria-label="Story chapters">
          {CHAPTERS.map((c, i) => (
            <button key={c.bag} type="button" className="story__tab" aria-current={i === 0 ? "step" : "false"} onClick={() => jump(i)}>
              <span className="story__tab-num">{i + 1}</span>
              <span className="story__tab-label">{c.bag}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
