/**
 * The smallest possible wallet hookup, same as ../oilceo/src/lib/wallet.ts: an injected EIP-1193
 * provider (MetaMask, Rabby, OKX, a wallet's in-app browser). It asks for the account, can switch
 * the wallet to Robinhood Chain, and reads a balance. It never asks to send a transaction.
 */
import { useEffect, useState } from "react";
import { TOKEN } from "./config";

interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, fn: (...args: any[]) => void): void;
}

const provider = (): Eip1193 | null =>
  typeof window === "undefined" ? null : ((window as unknown as { ethereum?: Eip1193 }).ethereum ?? null);

export const hasWallet = () => !!provider();

const CHAIN_HEX = "0x" + TOKEN.chainId.toString(16);
const RPC = "https://rpc.mainnet.chain.robinhood.com";

/* One connected account and chain for the whole page. */
type WalletState = { account: string; chainId: string };
let current: WalletState = { account: "", chainId: "" };
const EVENT = "brick:wallet";
const publish = (next: Partial<WalletState>) => {
  current = { ...current, ...next };
  window.dispatchEvent(new CustomEvent(EVENT, { detail: current }));
};

export function useWallet() {
  const [state, setState] = useState(current);
  useEffect(() => {
    const on = (e: Event) => setState((e as CustomEvent<WalletState>).detail);
    window.addEventListener(EVENT, on);
    setState(current);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return { ...state, onChain: Number(state.chainId) === TOKEN.chainId };
}

let restored = false;
/** Picks up an account the wallet already shared with this site, without a popup. */
export function restoreWallet() {
  const p = provider();
  if (!p || restored) return;
  restored = true;
  p.request({ method: "eth_accounts" })
    .then((a) => (a as string[])?.[0] && publish({ account: (a as string[])[0] }))
    .catch(() => {});
  p.request({ method: "eth_chainId" })
    .then((c) => publish({ chainId: String(c) }))
    .catch(() => {});
  p.on?.("accountsChanged", (a: string[]) => publish({ account: a?.[0] || "" }));
  p.on?.("chainChanged", (c: string) => publish({ chainId: String(c) }));
}

export async function connectWallet(): Promise<string> {
  const p = provider();
  if (!p) throw new Error("No wallet found in this browser.");
  const accounts = (await p.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts?.length) throw new Error("The wallet didn't share an account.");
  publish({ account: accounts[0], chainId: String(await p.request({ method: "eth_chainId" })) });
  return accounts[0];
}

/** Forgets the account on this site; asks the wallet to drop the permission where it supports that. */
export async function forgetWallet() {
  const p = provider();
  publish({ account: "" });
  await p?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }).catch(() => {});
}

export async function switchToRobinhood() {
  const p = provider();
  if (!p) throw new Error("No wallet found in this browser.");
  try {
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (e: any) {
    // 4902: the wallet doesn't know the chain yet
    if (e?.code !== 4902 && e?.data?.originalError?.code !== 4902) throw e;
    await p.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_HEX,
          chainName: TOKEN.chain,
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [RPC],
          blockExplorerUrls: [TOKEN.explorerBase],
        },
      ],
    });
  }
  publish({ chainId: String(await p.request({ method: "eth_chainId" })) });
}

/** ERC-20 balanceOf through the wallet's own RPC, in whole tokens (18 decimals). */
export async function tokenBalance(token: string, account: string): Promise<number> {
  const p = provider();
  if (!p) throw new Error("No wallet found in this browser.");
  const data = "0x70a08231" + account.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const hex = (await p.request({ method: "eth_call", params: [{ to: token, data }, "latest"] })) as string;
  const wei = BigInt(hex && hex !== "0x" ? hex : "0x0");
  return Number(wei / 10n ** 12n) / 1e6;
}

export const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;
