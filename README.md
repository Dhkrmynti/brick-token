# $BRICK

Landing site and buyback & burn engine for **$BRICK**, a toy-brick meme coin on Robinhood Chain (4663), launched on Pons.

- **Site**: Next.js 16 + GSAP ScrollTrigger. The page is one toy box: the lid lifts on scroll, four bags tell the
  supply → fees → buyback → burn story over an isometric brick town, then the furnace log, contents, building
  instructions and the back of the box. Read-only wallet connect ("Your bricks").
- **Engine** (`bot/`): claims creator fees from the Pons fee escrow, buys $BRICK back and sends it to the dead address
  (alternating with treasury cycles). See [`bot/README.md`](bot/README.md).

## Run

```bash
npm install
npm run dev              # site on http://localhost:3000
npm run bot              # engine (needs bot/.env, see bot/.env.example)
npm run build && npm start
```

The site shows labeled demo data until the engine answers `/api/engine/status` with a configured token.

## Config

| Where | What |
|---|---|
| `bot/.env` | `CREATOR_PRIVATE_KEY`, `TOKEN_ADDRESS`, `TREASURY_ADDRESS`, thresholds, RPC |
| env at build | `NEXT_PUBLIC_TOKEN_ADDRESS` (optional fallback CA), `NEXT_PUBLIC_X_URL`, `NEXT_PUBLIC_TELEGRAM_URL`, `BOT_URL` |

Design system: [`DESIGN.md`](DESIGN.md). Product notes: [`PRODUCT.md`](PRODUCT.md).
