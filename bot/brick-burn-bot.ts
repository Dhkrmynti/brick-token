/**
 * $BRICK buyback & burn engine. Pons Family v2, Robinhood Chain (4663).
 * Ported from ../token5/bot/pons-burn-bot.ts (the BLAZE engine): same claim, buyback, burn and keep
 * cycle, same resumable runs. Changes: names, port, config from .env only (no admin write API),
 * a structured burn history and on-chain supply stats for the site's furnace log.
 *
 * Cycle (alternating, like token5):
 *   odd  cycles: escrow >= BURN_THRESHOLD_ETH -> claim -> buy $BRICK -> send to the dead address
 *   even cycles: escrow >= KEEP_THRESHOLD_ETH -> claim -> forward to TREASURY_ADDRESS (or keep)
 */

import http from "http";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { buildUniswapV4Buy, findGraduationPool, type PoolKey } from "./uniswap-v4";

const DIR = __dirname;
const DATA = path.join(DIR, "data");
fs.mkdirSync(DATA, { recursive: true });

// .env next to this file (no dependency needed)
try {
  const envPath = path.join(DIR, ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {}

const env = (k: string, d = "") => (process.env[k] || d).trim();
const posInt = (k: string, d: number) => {
  const n = parseInt(env(k), 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};
const ethAmount = (k: string, d: string) => {
  try {
    return ethers.parseEther(env(k, d)) > 0n ? env(k, d) : d;
  } catch {
    console.warn(`[CONFIG] ${k} is not a valid ETH amount; using ${d}.`);
    return d;
  }
};

const config = {
  rpcUrl: env("RPC_URL", "https://rpc.mainnet.chain.robinhood.com"),
  privateKey: env("CREATOR_PRIVATE_KEY"),
  tokenAddress: env("TOKEN_ADDRESS"),
  curveAddress: env("CURVE_ADDRESS"),
  treasuryAddress: env("TREASURY_ADDRESS"),
  burnThresholdETH: ethAmount("BURN_THRESHOLD_ETH", "0.01"),
  keepThresholdETH: ethAmount("KEEP_THRESHOLD_ETH", "0.02"),
  pollIntervalSeconds: posInt("POLL_INTERVAL_SECONDS", 10),
  port: posInt("PORT", 5047),
  host: env("BOT_HOST", "127.0.0.1"),
};

// BURN-ONLY mode (BURN_ONLY=1): never claims or buys; burns any $BRICK that lands in the operator wallet.
const BURN_ONLY = /^(1|true|yes)$/i.test(env("BURN_ONLY"));
let lastBurnOnlyIdleLog = 0;

// Pons v2 (docs.ponsfamily.com/v2)
const PONS_FEE_ESCROW = "0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e";
const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
const UNISWAP_V4_UNIVERSAL_ROUTER = env("UNISWAP_ROUTER_ADDRESS", "0x8876789976dEcBfCbBbe364623C63652db8C0904");

let v4Pool: PoolKey | null = null;

const ESCROW_ABI = ["function balanceOf(address recipient) view returns (uint256)", "function claim()"];
const CURVE_ABI = [
  "function buy(uint256 quoteIn, uint256 minTokensOut, address recipient) payable returns (uint256)",
  "function graduated() view returns (bool)",
];
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function totalSupply() view returns (uint256)",
  "function symbol() view returns (string)",
  "function curve() view returns (address)",
];

// ---------- persistence ----------

const STATE_FILE = path.join(DATA, "state.json");
const LOGS_FILE = path.join(DATA, "logs.json");
const BURNS_FILE = path.join(DATA, "burns.json");
const RUN_FILE = path.join(DATA, "run.json");

const readJSON = <T>(file: string, fallback: T): T => {
  try {
    return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf-8")) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (file: string, data: unknown) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (e: any) {
    console.error(`Could not write ${path.basename(file)}: ${e.message}`);
  }
};

type Log = { at: string; type: "info" | "success" | "warn" | "error"; message: string };
type Burn = { at: string; tokens: string; ethSpent: string; buyTx: string; burnTx: string };

const savedRaw = readJSON<Record<string, unknown>>(STATE_FILE, {});
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
const str = (v: unknown, d: string) => (typeof v === "string" && v ? v : d);
const saved = {
  cycleCount: num(savedRaw.cycleCount),
  burnCount: num(savedRaw.burnCount),
  totalFeesClaimedETH: str(savedRaw.totalFeesClaimedETH, "0"),
  totalFeesRetainedETH: str(savedRaw.totalFeesRetainedETH, "0"),
  curveAddress: str(savedRaw.curveAddress, ""),
};
if (!config.curveAddress && saved.curveAddress) config.curveAddress = saved.curveAddress;

const state = {
  status: "standby" as "standby" | "active" | "error" | "claiming" | "buyback" | "burning",
  walletAddress: "",
  escrowBalanceETH: "0",
  totalFeesClaimedETH: saved.totalFeesClaimedETH,
  totalFeesRetainedETH: saved.totalFeesRetainedETH,
  totalCyclesExecuted: saved.cycleCount,
  burnCount: saved.burnCount,
  lastCycleAt: "",
  chain: { symbol: "BRICK", totalSupply: "", deadBalance: "", updatedAt: "" },
  logs: readJSON<Log[]>(LOGS_FILE, []),
  burns: readJSON<Burn[]>(BURNS_FILE, []),
};

const persistState = () =>
  writeJSON(STATE_FILE, {
    cycleCount: state.totalCyclesExecuted,
    burnCount: state.burnCount,
    totalFeesClaimedETH: state.totalFeesClaimedETH,
    totalFeesRetainedETH: state.totalFeesRetainedETH,
    curveAddress: config.curveAddress,
  });

function addLog(type: Log["type"], message: string) {
  state.logs.unshift({ at: new Date().toISOString(), type, message });
  if (state.logs.length > 80) state.logs.pop();
  console.log(`[${new Date().toLocaleTimeString()}] [${type.toUpperCase()}] ${message}`);
  writeJSON(LOGS_FILE, state.logs);
}

function recordBurn(b: Burn) {
  state.burns.unshift(b);
  if (state.burns.length > 100) state.burns.pop();
  state.burnCount++;
  writeJSON(BURNS_FILE, state.burns);
  persistState();
}

const addEth = (a: string, wei: bigint) => ethers.formatEther(ethers.parseEther(a || "0") + wei);

// ---------- wallet ----------

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;

function initWallet() {
  try {
    provider = new ethers.JsonRpcProvider(config.rpcUrl, undefined, { cacheTimeout: -1 });
    if (!config.privateKey) {
      addLog("error", "CREATOR_PRIVATE_KEY is not set in bot/.env. Read-only: stats only, no cycles.");
      return;
    }
    wallet = new ethers.Wallet(config.privateKey, provider);
    state.walletAddress = wallet.address;
    addLog("info", `Operator wallet: ${wallet.address}`);
  } catch (e: any) {
    addLog("error", `Failed to initialize wallet: ${e.message}`);
  }
}
initWallet();

const isValidAddress = (a?: string) => !!a && ethers.isAddress(a.trim());

// ---------- on-chain stats for the site ----------

async function refreshChainStats() {
  if (!provider || !isValidAddress(config.tokenAddress)) return;
  try {
    const token = new ethers.Contract(config.tokenAddress, ERC20_ABI, provider);
    const [supply, dead, symbol] = await Promise.all([
      token.totalSupply() as Promise<bigint>,
      token.balanceOf(DEAD_ADDRESS) as Promise<bigint>,
      (token.symbol() as Promise<string>).catch(() => "BRICK"),
    ]);
    state.chain = {
      symbol,
      totalSupply: ethers.formatUnits(supply, 18),
      deadBalance: ethers.formatUnits(dead, 18),
      updatedAt: new Date().toISOString(),
    };
  } catch (e: any) {
    if (Date.now() - lastStatsWarn > 5 * 60_000) {
      lastStatsWarn = Date.now();
      addLog("warn", `Could not read supply stats: ${e.message}`);
    }
  }
}
let lastStatsWarn = 0;

// ---------- resumable run (saved after every step) ----------

interface PendingRun {
  cycle: number;
  kind: "burn" | "keep";
  claimWei: string;
  tokensBefore: string;
  claimTx?: string;
  claimed?: boolean;
  counted?: boolean;
  buyTx?: string;
  bought?: boolean;
  spentWei?: string;
  toBurn?: string;
  burnTx?: string;
  burned?: boolean;
  sendTx?: string;
  sent?: boolean;
}
let pending: PendingRun | null = readJSON<PendingRun | null>(RUN_FILE, null);
function savePending(run: PendingRun | null) {
  pending = run;
  try {
    if (run) fs.writeFileSync(RUN_FILE, JSON.stringify(run, null, 2), "utf-8");
    else fs.rmSync(RUN_FILE, { force: true });
  } catch (e: any) {
    addLog("error", `Could not save run.json: ${e.message}`);
  }
}
const nextNonce = () => provider!.getTransactionCount(wallet!.address, "pending");
const WAIT_MS = 180_000;
/** Waits for a receipt, at most WAIT_MS; a timeout throws and the next tick settles the hash. */
async function confirm(tx: ethers.TransactionResponse, what: string) {
  const rc = await tx.wait(1, WAIT_MS);
  if (!rc || rc.status !== 1) throw new Error(`${what} ${tx.hash} failed`);
  return rc;
}
/**
 * true: mined and succeeded; false: reverted or dropped (safe to send again).
 * Throws while the tx is still pending, so the run waits instead of sending a second one.
 */
async function settle(hash: string): Promise<boolean> {
  const rc = await provider!.getTransactionReceipt(hash);
  if (rc) return rc.status === 1;
  const tx = await provider!.getTransaction(hash);
  if (!tx) return false;
  const mined = await tx.wait(1, WAIT_MS).catch(() => null);
  if (!mined) throw new Error(`tx ${hash} is still pending; waiting for it`);
  return mined.status === 1;
}

// ---------- the cycle ----------

let isExecuting = false;
let burnOnlyTx: { hash: string; amount: bigint } | null = null;

/** One cycle at a time: the lock is taken before the first await, and ticks are chained, never overlapped. */
async function executeCycle() {
  if (isExecuting) return;
  isExecuting = true;
  try {
    await runCycle();
  } catch (e: any) {
    addLog("error", `Cycle error: ${e.message || e}`);
  } finally {
    isExecuting = false;
    if (state.status !== "error") state.status = "standby";
  }
}

function recordRunBurn(run: PendingRun, burnTx: string) {
  recordBurn({
    at: new Date().toISOString(),
    tokens: ethers.formatUnits(BigInt(run.toBurn ?? "0"), 18),
    ethSpent: ethers.formatEther(BigInt(run.spentWei ?? run.claimWei)),
    buyTx: run.buyTx ?? "",
    burnTx,
  });
}

async function runCycle() {
  await refreshChainStats();

  if (!isValidAddress(config.tokenAddress)) {
    state.status = "standby";
    return;
  }
  if (!wallet || !provider) {
    state.status = "error";
    return;
  }
  state.status = "active";

  // the token knows its own Pons curve
  try {
    const resolved: string = await new ethers.Contract(config.tokenAddress, ERC20_ABI, wallet).curve();
    if (resolved && ethers.isAddress(resolved) && resolved !== ethers.ZeroAddress && resolved.toLowerCase() !== config.curveAddress.toLowerCase()) {
      config.curveAddress = resolved;
      persistState();
      addLog("info", `Connected to the token's Pons curve: ${resolved}`);
    }
  } catch {}
  if (!isValidAddress(config.curveAddress)) {
    addLog("warn", "STANDBY: curve address not found yet.");
    return;
  }

  const feeEscrow = new ethers.Contract(PONS_FEE_ESCROW, ESCROW_ABI, wallet);
  const token = new ethers.Contract(config.tokenAddress, ERC20_ABI, wallet);

  if (BURN_ONLY) {
    state.escrowBalanceETH = ethers.formatEther(await feeEscrow.balanceOf(wallet.address));
    state.lastCycleAt = new Date().toISOString();
    // a burn sent earlier is settled before anything new goes out
    if (burnOnlyTx) {
      if (await settle(burnOnlyTx.hash)) {
        recordBurn({ at: new Date().toISOString(), tokens: ethers.formatUnits(burnOnlyTx.amount, 18), ethSpent: "0", buyTx: "", burnTx: burnOnlyTx.hash });
        addLog("success", `Burned ${ethers.formatUnits(burnOnlyTx.amount, 18)} $BRICK.`);
        await refreshChainStats();
      }
      burnOnlyTx = null;
      return;
    }
    const bal: bigint = await token.balanceOf(wallet.address);
    if (bal > 0n) {
      state.status = "burning";
      const tx = await token.transfer(DEAD_ADDRESS, bal, { nonce: await nextNonce() });
      burnOnlyTx = { hash: tx.hash, amount: bal };
      addLog("info", `[BURN-ONLY] Burn tx: ${tx.hash}`);
      await confirm(tx, "burn");
      burnOnlyTx = null;
      recordBurn({ at: new Date().toISOString(), tokens: ethers.formatUnits(bal, 18), ethSpent: "0", buyTx: "", burnTx: tx.hash });
      addLog("success", `Burned ${ethers.formatUnits(bal, 18)} $BRICK.`);
      await refreshChainStats();
    } else if (Date.now() - lastBurnOnlyIdleLog > 60_000) {
      lastBurnOnlyIdleLog = Date.now();
      addLog("info", `[BURN-ONLY] Waiting for $BRICK in the operator wallet. Escrow: ${state.escrowBalanceETH} ETH`);
    }
    return;
  }

  const cycleNum = state.totalCyclesExecuted + 1;
  const isBurnCycle = cycleNum % 2 === 1;
  const thresholdETH = isBurnCycle ? config.burnThresholdETH : config.keepThresholdETH;
  const label = `Cycle #${cycleNum} ${isBurnCycle ? "BURN" : "KEEP"}`;

  const claimableWei: bigint = await feeEscrow.balanceOf(wallet.address);
  state.escrowBalanceETH = ethers.formatEther(claimableWei);
  state.lastCycleAt = new Date().toISOString();
  const gasBuffer = ethers.parseEther("0.0008");
  const shouldExecute = claimableWei > 0n && claimableWei >= ethers.parseEther(thresholdETH);

  if (!pending) {
    if (!shouldExecute) return;
    const tokensBefore: bigint = await token.balanceOf(wallet.address);
    savePending({ cycle: cycleNum, kind: isBurnCycle ? "burn" : "keep", claimWei: claimableWei.toString(), tokensBefore: tokensBefore.toString() });
    addLog("success", `[${label}] Escrow ${state.escrowBalanceETH} ETH reached ${thresholdETH} ETH. Running.`);
  } else if (pending.cycle !== cycleNum) {
    addLog("warn", `Dropping a saved run for cycle #${pending.cycle}: the bot is on cycle #${cycleNum}.`);
    savePending(null);
    return;
  } else {
    addLog("info", `[${label}] Resuming the saved run.`);
  }
  const run = pending!;

  // 1. claim the creator fees from the Pons escrow
  if (!run.claimed && run.claimTx) {
    if (await settle(run.claimTx)) run.claimed = true;
    else delete run.claimTx;
    savePending(run);
  }
  if (!run.claimed) {
    const escrowNow: bigint = await feeEscrow.balanceOf(wallet.address);
    if (escrowNow === 0n) {
      addLog("warn", `[${label}] Escrow is empty (claimed outside the bot?). Run dropped.`);
      savePending(null);
      return;
    }
    run.claimWei = escrowNow.toString();
    state.status = "claiming";
    const tx = await feeEscrow.claim({ nonce: await nextNonce() });
    run.claimTx = tx.hash;
    savePending(run);
    addLog("info", `[1] Claim tx: ${tx.hash}`);
    await confirm(tx, "claim");
    run.claimed = true;
    savePending(run);
    addLog("success", `Claimed ${ethers.formatEther(escrowNow)} ETH.`);
  }
  const claimWei = BigInt(run.claimWei);
  if (!run.counted) {
    state.totalFeesClaimedETH = addEth(state.totalFeesClaimedETH, claimWei);
    persistState();
    run.counted = true;
    savePending(run);
  }
  state.escrowBalanceETH = "0";

  if (run.kind === "burn") {
    // 2. buy $BRICK with exactly what this run claimed
    if (!run.bought && run.buyTx) {
      if (await settle(run.buyTx)) run.bought = true;
      else delete run.buyTx;
      savePending(run);
    }
    if (!run.bought) {
      state.status = "buyback";
      const curve = new ethers.Contract(config.curveAddress, CURVE_ABI, wallet);
      const graduated: boolean = await curve.graduated().catch(() => false);
      const walletBal = await provider.getBalance(wallet.address);
      const spendable = walletBal > gasBuffer ? walletBal - gasBuffer : 0n;
      const buyWei = claimWei < spendable ? claimWei : spendable;
      if (buyWei <= 0n) {
        addLog("warn", "[2] Not enough ETH after the gas buffer. Will retry.");
        return;
      }
      if (graduated && !v4Pool) {
        v4Pool = await findGraduationPool(provider, config.tokenAddress, config.curveAddress);
        if (!v4Pool) throw new Error("Curve graduated but its Uniswap v4 pool is not found yet; retrying.");
        addLog("info", `Uniswap v4 pool: fee ${v4Pool.fee}, tick spacing ${v4Pool.tickSpacing}, hook ${v4Pool.hooks}`);
      }
      const tx: ethers.TransactionResponse = graduated
        ? await wallet.sendTransaction({
            to: UNISWAP_V4_UNIVERSAL_ROUTER,
            value: buyWei,
            data: buildUniswapV4Buy(config.tokenAddress, buyWei, v4Pool!),
            gasLimit: 400000n,
            nonce: await nextNonce(),
          })
        : await curve.buy(buyWei, 0n, wallet.address, { value: buyWei, nonce: await nextNonce() });
      run.buyTx = tx.hash;
      run.spentWei = buyWei.toString();
      savePending(run);
      addLog("info", `[2] Buyback tx (${graduated ? "Uniswap v4" : "Pons curve"}): ${tx.hash}`);
      await confirm(tx, "buy");
      run.bought = true;
      savePending(run);
      addLog("success", `Bought back with ${ethers.formatEther(buyWei)} ETH.`);
    }

    // 3. burn exactly what this run bought
    if (!run.burned && run.burnTx) {
      if (await settle(run.burnTx)) {
        recordRunBurn(run, run.burnTx);
        addLog("success", `Burned ${ethers.formatUnits(BigInt(run.toBurn ?? "0"), 18)} $BRICK (confirmed after a restart).`);
        run.burned = true;
      } else delete run.burnTx;
      savePending(run);
    }
    if (!run.burned) {
      state.status = "burning";
      const bal: bigint = await token.balanceOf(wallet.address);
      const toBurn = bal > BigInt(run.tokensBefore) ? bal - BigInt(run.tokensBefore) : 0n;
      if (toBurn > 0n) {
        run.toBurn = toBurn.toString();
        const tx = await token.transfer(DEAD_ADDRESS, toBurn, { nonce: await nextNonce() });
        run.burnTx = tx.hash;
        savePending(run);
        addLog("info", `[3] Burn tx: ${tx.hash}`);
        await confirm(tx, "burn");
        recordRunBurn(run, tx.hash);
        addLog("success", `Burned ${ethers.formatUnits(toBurn, 18)} $BRICK.`);
      } else {
        addLog("warn", "[3] No newly bought $BRICK to burn.");
      }
      run.burned = true;
      savePending(run);
    }
    await refreshChainStats();
  } else {
    // KEEP: forward to the treasury, or leave it in the operator wallet
    const toTreasury = isValidAddress(config.treasuryAddress) && config.treasuryAddress.toLowerCase() !== wallet.address.toLowerCase();
    if (toTreasury && !run.sent && run.sendTx) {
      if (await settle(run.sendTx)) run.sent = true;
      else delete run.sendTx;
      savePending(run);
    }
    if (toTreasury && !run.sent) {
      const transferGas = ethers.parseEther("0.0003");
      const bal = await provider.getBalance(wallet.address);
      let sendWei = claimWei;
      if (bal - sendWei < transferGas) sendWei = bal > transferGas ? bal - transferGas : 0n;
      if (sendWei > 0n) {
        const tx = await wallet.sendTransaction({ to: config.treasuryAddress, value: sendWei, nonce: await nextNonce() });
        run.sendTx = tx.hash;
        savePending(run);
        await confirm(tx, "treasury send");
        addLog("success", `[KEEP] Sent ${ethers.formatEther(sendWei)} ETH to the treasury. Tx: ${tx.hash}`);
      }
      run.sent = true;
      savePending(run);
    } else if (!toTreasury) {
      addLog("success", `[KEEP] ${ethers.formatEther(claimWei)} ETH kept in the operator wallet.`);
    }
    state.totalFeesRetainedETH = addEth(state.totalFeesRetainedETH, claimWei);
  }

  state.totalCyclesExecuted++;
  persistState();
  savePending(null);
}

// chained ticks: the next poll is scheduled only after this one finishes
async function loop() {
  await executeCycle();
  setTimeout(loop, config.pollIntervalSeconds * 1000);
}
loop();

// ---------- read-only API for the site (/api/engine/* via the Next.js rewrite) ----------

function sendJSON(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0].replace(/\/$/, "");
  if (req.method !== "GET") return sendJSON(res, 405, { success: false, error: "Read-only API" });
  if (url === "/api/status") {
    return sendJSON(res, 200, {
      success: true,
      data: {
        live: isValidAddress(config.tokenAddress),
        status: state.status,
        tokenAddress: config.tokenAddress,
        curveAddress: config.curveAddress,
        walletAddress: state.walletAddress,
        burnOnly: BURN_ONLY,
        escrowBalanceETH: state.escrowBalanceETH,
        nextCycleType: BURN_ONLY ? "burn" : (state.totalCyclesExecuted + 1) % 2 === 1 ? "burn" : "keep",
        totalCyclesExecuted: state.totalCyclesExecuted,
        burnCount: state.burnCount,
        totalFeesClaimedETH: state.totalFeesClaimedETH,
        lastCycleAt: state.lastCycleAt,
        chain: state.chain,
        burns: state.burns.slice(0, 20),
      },
    });
  }
  if (url === "/api/logs") return sendJSON(res, 200, { success: true, data: state.logs.slice(0, 40) });
  return sendJSON(res, 404, { success: false, error: "Not Found" });
});

server.listen(config.port, config.host, () => {
  console.log("==========================================================");
  console.log(" $BRICK BUYBACK & BURN ENGINE");
  console.log(`   API            : http://${config.host}:${config.port}/api/status`);
  console.log(`   Operator wallet: ${state.walletAddress || "not set"}`);
  console.log(`   Token          : ${config.tokenAddress || "not set (standby)"}`);
  console.log(`   Mode           : ${BURN_ONLY ? "burn-only" : `burn ${config.burnThresholdETH} ETH / keep ${config.keepThresholdETH} ETH, alternating`}`);
  console.log("==========================================================");
});
