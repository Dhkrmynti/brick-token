"use client";

import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { useEngine } from "./Engine";

export function CopyCA({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const ca = useEngine().contract;
  const live = ca.length > 0;

  async function copy() {
    if (!live) return;
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className={`ca ca--${variant}`}>
      <span className="ca__label">CA</span>
      <code className="ca__value" title={live ? ca : undefined}>
        {live ? `${ca.slice(0, 6)}...${ca.slice(-4)}` : "drops at launch"}
      </code>
      <button
        type="button"
        className="ca__btn"
        onClick={copy}
        disabled={!live}
        aria-label={live ? "Copy contract address" : "Contract address not live yet"}
      >
        {copied ? <Check size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
        <span>{copied ? "Copied" : failed ? "Copy failed" : "Copy"}</span>
      </button>
    </div>
  );
}
