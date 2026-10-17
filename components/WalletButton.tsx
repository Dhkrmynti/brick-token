"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Wallet, X } from "@phosphor-icons/react";
import { TOKEN } from "@/lib/config";
import { connectWallet, forgetWallet, hasWallet, restoreWallet, short, switchToRobinhood, tokenBalance, useWallet } from "@/lib/wallet";
import { supplyStats, useEngine } from "./Engine";
import { BuyLink } from "./BuyLink";

const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
const NO_WALLET = "No wallet in this browser. Open this site inside your wallet app (MetaMask, Rabby, OKX) to connect.";

/** Header wallet button. Connecting opens "Your bricks": the holder's balance and how burns grew their slice. */
export function WalletButton() {
  const { account, onChain } = useWallet();
  const { mode, data, contract } = useEngine();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const panelId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => restoreWallet(), []);

  // close on outside click and Escape
  useEffect(() => {
    if (!open) return;
    const click = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", click);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const loadSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setBalance(null);
    setNote("");
    if (!account || !onChain || !contract) return;
    try {
      const b = await tokenBalance(contract, account);
      if (seq === loadSeq.current) setBalance(b);
    } catch {
      if (seq === loadSeq.current) setNote("Couldn't read your balance from the wallet. Try again in a moment.");
    }
  }, [account, onChain, contract]);

  // reload on open and whenever the account, chain or token changes
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const run = async (fn: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setNote("");
    try {
      await fn();
    } catch (e: any) {
      setNote(e?.code === 4001 ? "Cancelled in the wallet." : e?.message || fallback);
    } finally {
      setBusy(false);
    }
  };

  const press = () => {
    if (account) return setOpen((o) => !o);
    setOpen(true);
    if (!hasWallet()) return setNote(NO_WALLET);
    run(connectWallet, "The wallet didn't connect.");
  };

  const live = mode === "live" && data !== null;
  const stats = live ? supplyStats(data) : null;

  return (
    <div className="wallet" ref={wrap}>
      <button
        type="button"
        className={`wallet__btn${account ? " is-on" : ""}`}
        onClick={press}
        disabled={busy}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={account ? `Connected as ${account}. Show your bricks` : "Connect wallet"}
      >
        {account ? <span className="wallet__dot" aria-hidden="true" /> : <Wallet size={20} weight="bold" aria-hidden="true" />}
        <span className="wallet__label">{busy ? "Connecting" : account ? short(account) : "Connect"}</span>
      </button>

      {open && (
        <div className="wallet__panel" id={panelId} role="dialog" aria-label="Your bricks">
          <div className="wallet__head">
            <h2 className="wallet__title">Your bricks</h2>
            <button type="button" className="wallet__close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} weight="bold" />
            </button>
          </div>

          {!account ? (
            <p className="wallet__note">{note || "Approve the connection in your wallet."}</p>
          ) : (
            <>
              <p className="wallet__addr">
                <code>{short(account)}</code>
                <button type="button" className="wallet__link" onClick={() => run(forgetWallet, "")}>
                  Disconnect
                </button>
              </p>

              {!onChain ? (
                <div className="wallet__body">
                  <p className="wallet__note">Your wallet is on another network. $BRICK lives on {TOKEN.chain}.</p>
                  <button type="button" className="wallet__action" onClick={() => run(switchToRobinhood, "Couldn't switch the network.")} disabled={busy}>
                    Switch to {TOKEN.chain}
                  </button>
                </div>
              ) : !contract ? (
                <p className="wallet__note">Your balance shows up here once $BRICK is live on Pons.</p>
              ) : balance === null ? (
                <p className={`wallet__note${note ? " wallet__note--err" : ""}`}>{note || "Counting your bricks..."}</p>
              ) : balance === 0 ? (
                <div className="wallet__body">
                  <p className="wallet__note">This wallet holds no $BRICK yet.</p>
                  <BuyLink className="brick-btn--sm" />
                </div>
              ) : (
                <dl className="wallet__stats">
                  <div className="wallet__stat wallet__stat--big">
                    <dt>Balance</dt>
                    <dd>
                      {fmt(balance)} <small>{TOKEN.ticker}</small>
                    </dd>
                  </div>
                  {stats && stats.left > 0 && (
                    <>
                      <div className="wallet__stat">
                        <dt>Share of supply left</dt>
                        <dd>{fmt((balance / stats.left) * 100, 4)}%</dd>
                      </div>
                      <div className="wallet__stat">
                        <dt>Slice grown by burns</dt>
                        <dd className="wallet__heat">+{fmt((stats.total / stats.left - 1) * 100, 2)}%</dd>
                      </div>
                    </>
                  )}
                </dl>
              )}
            </>
          )}
          <p className="wallet__fine">Read-only. This site never asks your wallet to send anything.</p>
        </div>
      )}
    </div>
  );
}
