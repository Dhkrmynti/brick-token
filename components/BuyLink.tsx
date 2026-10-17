"use client";

import { TOKEN } from "@/lib/config";
import { useEngine } from "./Engine";

export function BuyLink({ className = "" }: { className?: string }) {
  const { contract } = useEngine();
  const live = contract.length > 0;
  return (
    <a
      className={`brick-btn ${className}`}
      href={live ? TOKEN.ponsLaunchpad(contract) : "#how-to-buy"}
      {...(live ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="brick-btn__studs" aria-hidden="true" />
      <span>
        Buy<span className="brick-btn__more"> on Pons</span>
      </span>
    </a>
  );
}
