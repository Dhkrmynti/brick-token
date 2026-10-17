"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { TOKEN } from "@/lib/config";

export type EngineBurn = { at: string; tokens: string; ethSpent: string; buyTx: string; burnTx: string };
export type EngineStatus = {
  live: boolean;
  status: string;
  tokenAddress: string;
  escrowBalanceETH: string;
  nextCycleType: "burn" | "keep";
  totalCyclesExecuted: number;
  burnCount: number;
  lastCycleAt: string;
  chain: { symbol: string; totalSupply: string; deadBalance: string; updatedAt: string };
  burns: EngineBurn[];
};

type Engine = {
  /** "demo" until the engine answers with a configured token */
  mode: "loading" | "demo" | "live";
  data: EngineStatus | null;
  contract: string;
};

const EngineContext = createContext<Engine>({ mode: "loading", data: null, contract: TOKEN.contract });

const POLL_MS = 10_000;

export function EngineProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<Engine>({ mode: "loading", data: null, contract: TOKEN.contract });

  useEffect(() => {
    let stop = false;
    let timer: number | undefined;
    let misses = 0;
    const poll = async () => {
      try {
        const res = await fetch("/api/engine/status", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { success: boolean; offline?: boolean; data?: EngineStatus };
        if (!json.success || !json.data) throw new Error("engine offline");
        const d = json.data;
        const ready = d.live && d.chain.totalSupply !== "";
        if (!stop) setEngine({ mode: ready ? "live" : "demo", data: d, contract: d.tokenAddress || TOKEN.contract });
        misses = 0;
      } catch {
        // engine offline: keep the last good data if we had any, otherwise demo
        misses++;
        if (!stop) setEngine((e) => (e.mode === "live" ? e : { mode: "demo", data: null, contract: TOKEN.contract }));
      }
      // back off while the engine is down or the tab is hidden
      const wait = POLL_MS * (document.hidden ? 3 : 1) * Math.min(6, 1 + misses);
      if (!stop) timer = window.setTimeout(poll, wait);
    };
    poll();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, []);

  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
}

export const useEngine = () => useContext(EngineContext);

/** Burned and remaining supply from chain stats, in whole tokens. */
export function supplyStats(d: EngineStatus) {
  const total = parseFloat(d.chain.totalSupply) || TOKEN.supply;
  const burned = Math.min(total, parseFloat(d.chain.deadBalance) || 0);
  return { total, burned, left: Math.max(0, total - burned) };
}
