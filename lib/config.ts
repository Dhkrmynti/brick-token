// Launch facts. The contract address can come from NEXT_PUBLIC_TOKEN_ADDRESS at build time;
// at runtime the engine's /api/status is the source of truth (see components/Engine.tsx).
export const TOKEN = {
  name: "BRICK",
  ticker: "$BRICK",
  supply: 1_000_000_000,
  contract: (process.env.NEXT_PUBLIC_TOKEN_ADDRESS ?? "").trim(),
  chain: "Robinhood Chain",
  chainId: 4663,
  explorerBase: "https://explorer.mainnet.chain.robinhood.com",
  ponsLaunchpad: (ca: string) => `https://ponsfamily.com/launchpad/${ca}`,
  socials: {
    x: (process.env.NEXT_PUBLIC_X_URL ?? "").trim(),
    telegram: (process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "").trim(),
  },
  fees: {
    tradeFeePct: 1,
    creatorSharePct: 70,
    protocolSharePct: 30,
  },
};

export const explorerTx = (hash: string) => `${TOKEN.explorerBase}/tx/${hash}`;
export const explorerToken = (ca: string) => `${TOKEN.explorerBase}/token/${ca}`;
