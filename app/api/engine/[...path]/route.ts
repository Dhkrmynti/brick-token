// Proxy to the buyback & burn engine (bot/), which listens on localhost only.
// When the engine is down it answers 200 with `offline: true`, so the site falls back to demo data
// without a console error on every poll.
const BOT_URL = process.env.BOT_URL ?? "http://127.0.0.1:5047";
const ALLOWED = new Set(["status", "logs"]);

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const name = path.join("/");
  const headers = { "Cache-Control": "no-store" };
  if (!ALLOWED.has(name)) return Response.json({ success: false, error: "Not Found" }, { status: 404, headers });
  try {
    const res = await fetch(`${BOT_URL}/api/${name}`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(String(res.status));
    return Response.json(await res.json(), { headers });
  } catch {
    return Response.json({ success: false, offline: true }, { headers });
  }
}
