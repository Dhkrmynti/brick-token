---
name: $BRICK
description: A toy-box landing for a buyback & burn meme coin on Robinhood Chain.
colors:
  cobalt: "#1f44cf"
  cobalt-deep: "#142f96"
  cobalt-print: "#2b53e6"
  night: "#0d1636"
  kraft: "#b98551"
  kraft-deep: "#8a5c30"
  kraft-light: "#c99766"
  kraft-wall-top: "#7a5129"
  kraft-wall-left: "#946232"
  kraft-wall-right: "#7f5329"
  kraft-wall-bottom: "#a5713f"
  callout: "#dbe4f3"
  callout-line: "#b9c6de"
  paper: "#eef2f8"
  paper-dim: "#c9d6ff"
  ink: "#0f1733"
  ink-soft: "#3a4466"
  muted-night: "#a3b2df"
  sun: "#f7bb22"
  sun-top: "#ffd75e"
  sun-side: "#c98d08"
  tomato: "#e2452d"
  mint: "#26b583"
  sky: "#47a9f5"
  heat: "#ff9a1f"
  baseplate: "#1f6e4e"
typography:
  display:
    fontFamily: "Dela Gothic One, sans-serif"
    fontSize: "clamp(2rem, 3.3vw, 3.3rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.01em"
  section:
    fontFamily: "Dela Gothic One, sans-serif"
    fontSize: "clamp(2.2rem, 4vw, 3.4rem)"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.05rem"
    fontWeight: 400
rounded:
  sm: "8px"
  brick: "7px"
  md: "14px"
  box: "18px"
spacing:
  gutter: "clamp(16px, 5vw, 80px)"
  section: "clamp(96px, 14vh, 160px)"
components:
  button-brick:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.brick}"
    padding: "15px 26px 19px"
  button-brick-hover:
    backgroundColor: "#ffc53a"
  chip-ca:
    backgroundColor: "rgba(255,255,255,0.1)"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "6px 6px 6px 14px"
  nav:
    backgroundColor: "{colors.cobalt-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    height: "64px"
  card-chapter:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "clamp(22px, 2.4vw, 32px)"
  panel-box-side:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "clamp(28px, 5vw, 64px)"
---

# Design System: $BRICK

## Overview

The page is one toy box, seen once. Outside is the cobalt printed box (front = hero, side panel = contents, back = footer). Inside is kraft cardboard (the four parts bags, the building instructions). The burn happens at furnace night. Every illustration is an isometric studded brick drawn as exact geometry (`lib/iso.tsx`), never a sketched picture. The story is told by bricks moving through Bricktown: heap (supply) → fee stacks → conveyor (buyback) → furnace (burn).

Mood: loud, playful, honest. Toy-shop saturation on a committed cobalt ground; the numbers stay plain and labeled when they are demo values.

## Colors

### Primary
- **Cobalt** `#1f44cf`: the box print. Owns hero, contents panel, end page of the manual. Deep `#142f96` for nav, box edges, footer.

### Secondary
- **Kraft** `#b98551`: the box interior. Owns the bags section, contents surround, manual (`#c99766`).
- **Night** `#0d1636`: furnace night. Story end state and the furnace log.

### Tertiary (brick plastic)
- Tomato `#e2452d`, Sun `#f7bb22`, Mint `#26b583`, Sky `#47a9f5`, Snow `#dde3ee`, plus stone and coal greys for the furnace. Every brick tone carries a top (lighter), left (base) and right (darker) face; see `TONES` in `lib/iso.tsx`.
- **Heat** `#ff9a1f`: burn amounts, furnace glow. Only for burn data.

### Neutral
- Paper `#eef2f8` (cards, manual pages), Ink `#0f1733` text, Ink-soft `#3a4466` body on paper, Paper-dim `#c9d6ff` body on cobalt, Muted-night `#a3b2df` labels on night.

### Named Rules
- **One action color.** Sun is the only CTA color (brick buttons, active tab). Sun appears elsewhere only as brick plastic inside illustrations.
- **Materials, not themes.** Section grounds switch only between box materials (cobalt print, kraft, night). There is no light/dark toggle; the box is a printed object.

## Typography

### Hierarchy
- Display (Dela Gothic One): hero H1, section titles, chapter titles, big numbers. Never below 1rem.
- Body (Bricolage Grotesque): sub-copy and UI labels, 700 weight for labels and buttons inside the UI.
- Data (JetBrains Mono): contract address, burn amounts, tx hashes, chain id. Mono only for real data.

### Named Rules
- **The wordmark is built, not typeset.** "BRICK" is always the brick-built SVG (`components/Wordmark.tsx`): bold two-stud strokes, bonded joints, a top face with studs where nothing sits above, a side face where nothing sits to the right. Never set it in a font.
- Numbers use `font-variant-numeric: tabular-nums`.

## Layout

- Gutter `clamp(16px, 5vw, 80px)`; content max 1200px; section padding `clamp(96px, 14vh, 160px)`.
- Hero: 5/6 split (copy, box-art window), single column under 900px.
- Story: pinned 100dvh stage; chapter card left, HUD top-left, chapter tabs bottom center. Under 768px: scene in the middle band, card and tabs at the bottom.
- Manual: horizontal pan on ≥900px with motion allowed; stacked pages otherwise.

## Elevation & Depth

- Depth comes from objects: brick faces (top/left/right), the lid edge, bag drop shadows. Shadows are soft, offset downward and tinted toward the ground (`rgba(8,16,60,…)` on cobalt, `rgba(60,30,5,…)` on kraft).
- The brick button's bottom band is the brick's own side face (inset shadow), not a neobrutalist offset.

## Shapes

- Radii: 7px brick buttons, 8px chips, 14px cards and panels, 18px box faces and the box-art window.
- Bags use a crimped (zig-zag) top and bottom edge; this is the only zig-zag in the system.

## Components

### Buttons
- **Brick button**: sun body, two sun-top studs on the top edge, sun-side bottom face. Hover lifts 2px; active presses 3px down and shortens the side face (the "click").
- **Click sound**: every `.brick-btn` plays a synthesized plastic tick on press and a lighter clack on release (`lib/click.ts`, Web Audio, no files). A speaker toggle in the nav mutes it; the choice persists in localStorage.

### Chips
- **CA chip**: label, mono address (or "drops at launch"), copy button with Phosphor icon; disabled until `TOKEN.contract` is set.

### Cards / Containers
- **Chapter card**: paper, 14px, numbered cobalt tile floated into the title. No label above the heading.
- **Box side panel** (contents): cobalt, quantities in display type, fee split drawn as ten bricks, chain line + barcode footer.
- **Manual page**: paper, big cobalt step numeral, part callout top-right, iso parts that drop in.

### Navigation
- Fixed cobalt-deep bar, 64px, logo brick + links + small brick button. Links collapse under 768px (logo + buy only).

### Box lid (hero)
- The hero is the box seen from front-right-above: cobalt front face, a lighter top face (`.lid__top`) and a darker right side face (`.lid__side`) cut as parallelograms at depth `--depth: clamp(16px, 4.2vw, 64px)`. The side face carries vertical print: `$BRICK` in sun-top, set name, `No. 4663` in mono (hidden on mobile).
- One laminated-print shine (`.lid__shine`, soft-light) sweeps the face once on load. A paper "Furnace included" box-art callout points at the furnace in the window.

### Box interior walls
- Four trapezoid walls (`.interior__walls`) in the kraft-wall tones make the bags section read as looking down into the box. Wall depth is `--wall` (54px desktop, 24px mobile).

### Furnace art + log
- `components/FurnaceArt.tsx`: close-up of the Bricktown furnace on a coal baseplate. Mouth and glow flicker, embers rise (motion-safe only). On every new burn the log slides `.fa-brick` into the mouth on the same beat as the counters.

### Fee tower
- `components/SplitTower.tsx`: the fee split as ten stacked 2x2 bricks (one per 10%), sun for creator, sky for Pons, dashed leader lines to display-type labels. Builds brick by brick once on scroll.

### Manual part callout
- Bordered callout box with the step's part drawn as a mini iso brick, display-type quantity (`1x`) in cobalt, plus a mono page folio bottom-right.

### Wallet button + "Your bricks" panel
- Nav button (translucent on cobalt-deep, wallet icon; connected = mint status dot + mono short address; icon-only under 768px). Opens a paper panel (14px radius) with balance in cobalt display type, share of supply left, and "slice grown by burns" in heat orange. Read-only: injected EIP-1193 wallet, `eth_call` balance, optional switch to Robinhood Chain (`lib/wallet.ts`).

### Bricktown scene (signature)
- `components/Scene.tsx`: baseplate, heap (`makePile`), furnace with mouth glow and chimney smoke, conveyor, fee stacks, two-layer skyline. Classes (`pile-lift`, `pile-burn`, `fee-c`, `fee-p`, `belt-b`, `puff`, `sun`) are the animation API used by `Story.tsx`.

## Do's and Don'ts

### Do:
- Draw every new illustration with `Brick` / `iso()` geometry in the existing tones.
- Label every synthetic number ("demo") until it is wired to chain data.
- Keep one authored motion per moment: lid lift, four-bag scrub, counters on one downbeat.

### Don't:
- Don't use the LEGO name, logo, minifigure likeness, or red-square-yellow-outline logo treatment.
- Don't put a kicker/eyebrow label above headings.
- Don't add a second CTA color or a gradient text effect.
- Don't swap the brick wordmark for a font, or the iso bricks for sketch-style SVG or stock 3D renders.
