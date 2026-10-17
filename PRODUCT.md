# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + GSAP (ScrollTrigger) — confirmed by the user. Deploy target: Vercel (assumed, not yet confirmed).

## Users

Meme-coin traders and community members on Robinhood Chain, mostly arriving from X/Telegram links on their phones. They want to understand in seconds what $BRICK is, why the supply shrinks, and where to buy — then share it.

## Product Purpose

Landing site for **$BRICK**, a brick-toy themed meme coin launched on **Pons** (the meme-coin launchpad on Robinhood Chain). Success: visitors understand the buyback & burn engine, trust that it is transparent, and click through to buy or join the community.

## Positioning

$BRICK turns the launchpad's own economics into the burn engine: every trade in a Pons pool pays a 1% fee, of which 70% goes to the token creator. The engine (`bot/`, ported from token5's BLAZE engine) claims those creator fees from the Pons escrow in alternating cycles: odd cycles (0.01 ETH) buy $BRICK back and send it to the dead address, even cycles (0.02 ETH) forward the ETH to the treasury. Every burn is recorded and shown with its transaction on the site.

Copy rule: site copy may say creator fees fund buybacks and burns; it must not claim that all creator fees are burned or that the creator never cashes out (decided 2026-10-17).

## Operating Context

- Chain: Robinhood Chain (Arbitrum Orbit L2, ETH gas). DEX: Uniswap pools via Pons.
- Pons token facts: fixed 1,000,000,000 supply per launched token; 1% trade fee split 70% creator / 30% protocol (per public coverage, Decrypt, Sept 2026).
- Buyback & burn is executed by a separate bot (out of scope for this phase).

## Capabilities and Constraints

- Phase 1 (this build): visual landing page only, with demo data.
- Undecided: contract address, launch date, socials, buyback cadence, exact % of creator share routed to burn (assume 100% until confirmed), treasury wallet.
- Must NOT use the LEGO name, logo, minifigure likeness or trade dress. Use generic interlocking-brick toy forms only.

## Brand Commitments

- Name/ticker: $BRICK (confirmed).
- Voice: playful, degen-friendly, Indonesian user but site copy in English for the global crypto audience (assumed).

## Evidence on Hand

None yet. No real burn transactions, holders, price, or market cap exist. All stats on the site are synthetic demo values and must be labeled as such until wired to live data. No testimonials, partners, or audits — do not invent them.

## Product Principles

1. Show the burn, don't just claim it — the mechanism must be visible and verifiable.
2. Transparency over hype: every number links to (or will link to) on-chain proof.
3. Fun first: it is a toy; the site should feel like playing.
4. Fast on phones: most visitors are on mobile from social links.
