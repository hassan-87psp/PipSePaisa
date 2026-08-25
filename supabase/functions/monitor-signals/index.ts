import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") ?? "18a97e55-9d93-4193-b60b-fe8e621f5d12";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-psp-monitor",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function reply(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}
function n(v: unknown): number | null {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
function pairKey(v: unknown): string {
  return String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function pipFactor(pair: string): number {
  const p = pairKey(pair);
  if (p.includes("XAU") || p.includes("GOLD")) return 10;
  if (p.includes("BTC")) return 0.1;
  if (p.includes("JPY")) return 100;
  if (/(EUR|GBP|AUD|NZD|USD|CHF|CAD)/.test(p)) return 10000;
  if (p.includes("XAG") || p.includes("SILVER")) return 10;
  if (/(ETH|SOL|XRP|BNB|DOGE)/.test(p)) return 1;
  return 10;
}
function calcPips(pair: string, direction: string, entry: unknown, target: unknown): number | null {
  const e = n(entry), t = n(target);
  if (e == null || t == null) return null;
  const raw = String(direction).toUpperCase() === "SELL" ? e - t : t - e;
  return Math.round(raw * pipFactor(pair) * 10) / 10;
}

type Snapshot = { price: number; high: number; low: number; at: string; source: string };
type Signal = Record<string, any> & {
  id: string; pair: string; direction: string; order_type?: string; status?: string;
  entry_price?: number; stop_loss?: number; take_profit1?: number; take_profit2?: number; take_profit3?: number;
  be_moved?: boolean; tp_hit?: number; created_at?: string; activated_at?: string; owner_id?: string;
};

const TV: Record<string, string> = {
  XAUUSD: "OANDA:XAUUSD", XAGUSD: "OANDA:XAGUSD",
  EURUSD: "FX:EURUSD", GBPUSD: "FX:GBPUSD", USDJPY: "FX:USDJPY", USDCHF: "FX:USDCHF",
  AUDUSD: "FX:AUDUSD", USDCAD: "FX:USDCAD", NZDUSD: "FX:NZDUSD", EURJPY: "FX:EURJPY", GBPJPY: "FX:GBPJPY",
  BTCUSD: "BITSTAMP:BTCUSD", ETHUSD: "BITSTAMP:ETHUSD",
};

function candleValue(c: any, short: string, long: string): number | null {
  return n(c?.[short] ?? c?.[long]);
}
function candleTime(c: any): string {
  const raw = c?.t ?? c?.time ?? c?.timestamp;
  if (raw == null) return new Date().toISOString();
  if (typeof raw === "number") return new Date(raw > 1e12 ? raw : raw * 1000).toISOString();
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString();
}

async function candleSnapshot(pair: string): Promise<Snapshot | null> {
  const symbol = TV[pairKey(pair)];
  if (!symbol) return null;
  try {
    const url = `https://pipsepaisa-api.vercel.app/api/candles?symbol=${encodeURIComponent(symbol)}&interval=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const body = await res.json();
    const candles = Array.isArray(body?.candles) ? body.candles : [];
    const c = candles[candles.length - 1];
    if (!c) return null;
    const close = candleValue(c, "c", "close");
    if (close == null) return null;
    const high = candleValue(c, "h", "high") ?? close;
    const low = candleValue(c, "l", "low") ?? close;
    return { price: close, high, low, at: candleTime(c), source: "pipsepaisa-1m" };
  } catch (_) {
    return null;
  }
}

async function fallbackSnapshot(pair: string): Promise<Snapshot | null> {
  const p = pairKey(pair);
  try {
    if (p === "XAUUSD" || p === "XAGUSD") {
      const metal = p.startsWith("XAG") ? "XAG" : "XAU";
      const res = await fetch(`https://api.gold-api.com/price/${metal}`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const body = await res.json(); const price = n(body?.price); if (price == null) return null;
      return { price, high: price, low: price, at: new Date().toISOString(), source: "gold-api" };
    }
    if (p === "BTCUSD" || p === "ETHUSD") {
      const base = p.startsWith("ETH") ? "ETH" : "BTC";
      const res = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${base}`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const body = await res.json(); const price = n(body?.data?.rates?.USD); if (price == null) return null;
      return { price, high: price, low: price, at: new Date().toISOString(), source: "coinbase" };
    }
    if (p.length === 6) {
      const base = p.slice(0, 3), quote = p.slice(3, 6);
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const body = await res.json(); const price = n(body?.rates?.[quote]); if (price == null) return null;
      return { price, high: price, low: price, at: new Date().toISOString(), source: "fx-fallback" };
    }
  } catch (_) {}
  return null;
}
async function getSnapshot(pair: string): Promise<Snapshot | null> {
  return (await candleSnapshot(pair)) ?? (await fallbackSnapshot(pair));
}

function wasCreatedRecently(ts?: string | null, seconds = 90): boolean {
  if (!ts) return false;
  return Date.now() - new Date(ts).getTime() < seconds * 1000;
}
function safeSnapshot(s: Signal, snap: Snapshot): Snapshot {
  const anchor = s.activated_at || s.created_at;
  return wasCreatedRecently(anchor, 90) ? { ...snap, high: snap.price, low: snap.price } : snap;
}
function entryTouched(s: Signal, x: Snapshot): boolean {
  const entry = n(s.entry_price); if (entry == null) return false;
  const dir = String(s.direction || "BUY").toUpperCase();
  const type = String(s.order_type || "market").toLowerCase();
  if (type === "market") return true;
  if (dir === "BUY" && type === "limit") return x.low <= entry;
  if (dir === "SELL" && type === "limit") return x.high >= entry;
  if (dir === "BUY" && type === "stop") return x.high >= entry;
  if (dir === "SELL" && type === "stop") return x.low <= entry;
  return x.low <= entry && x.high >= entry;
}
function targetTouched(s: Signal, x: Snapshot, level: number | null, kind: "tp" | "stop"): boolean {
  if (level == null) return false;
  const buy = String(s.direction || "BUY").toUpperCase() !== "SELL";
  if (kind === "tp") return buy ? x.high >= level : x.low <= level;
  return buy ? x.low <= level : x.high >= level;
}

async function createNotification(client: any, s: Signal, title: string, body: string) {
  try {
    await client.from("notifications").insert({
      owner_id: s.owner_id ?? null, is_official: true, title, body, type: "signal", audience: "all", action_link: "/?tab=signals",
    });
  } catch (_) {}

  if (!ONESIGNAL_REST_API_KEY || !ONESIGNAL_APP_ID) return;
  try {
    await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: { "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID, included_segments: ["Subscribed Users"],
        headings: { en: title }, contents: { en: body },
        url: "https://www.pipsepaisa.com/?open=signals", web_url: "https://www.pipsepaisa.com/?open=signals",
        data: { type: "signal_update", signal_id: s.id, pair: s.pair },
      }),
      signal: AbortSignal.timeout(7000),
    });
  } catch (_) {}
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ ok: false, error: "POST only" }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return reply({ ok: false, error: "Server configuration incomplete" }, 500);

  const client = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const startedAt = new Date().toISOString();

  // Public callable but deterministic + DB throttled: no signal IDs or prices are accepted from the request.
  try {
    const st = await client.from("signal_monitor_state").select("last_run_at").eq("id", 1).maybeSingle();
    const lastMs = st.data?.last_run_at ? new Date(st.data.last_run_at).getTime() : 0;
    if (lastMs && Date.now() - lastMs < 40000) return reply({ ok: true, throttled: true, last_run_at: st.data.last_run_at });
    await client.from("signal_monitor_state").update({ last_run_at: startedAt, updated_at: startedAt, last_error: null }).eq("id", 1);
  } catch (_) {}

  const rows = await client.from("signals").select("*")
    .eq("auto_monitor", true)
    .in("status", ["pending", "active", "tp1", "tp2"])
    .order("created_at", { ascending: true })
    .limit(250);

  if (rows.error) {
    await client.from("signal_monitor_state").update({ last_error: rows.error.message, updated_at: new Date().toISOString() }).eq("id", 1);
    return reply({ ok: false, error: rows.error.message }, 500);
  }

  const signals = (rows.data ?? []) as Signal[];
  const priceCache = new Map<string, Snapshot | null>();
  const events: Array<Record<string, unknown>> = [];
  const failures: Array<Record<string, unknown>> = [];

  for (const s of signals) {
    const key = pairKey(s.pair);
    let snap = priceCache.get(key);
    if (snap === undefined) {
      snap = await getSnapshot(s.pair);
      priceCache.set(key, snap ?? null);
    }
    if (!snap) { failures.push({ id: s.id, pair: s.pair, reason: "price_unavailable" }); continue; }

    const x = safeSnapshot(s, snap);
    const now = new Date().toISOString();
    const status = String(s.status || "active").toLowerCase();
    const entry = n(s.entry_price), sl = n(s.stop_loss), tp1 = n(s.take_profit1), tp2 = n(s.take_profit2), tp3 = n(s.take_profit3);
    if (entry == null || sl == null || tp1 == null) { failures.push({ id: s.id, pair: s.pair, reason: "missing_levels" }); continue; }
    const marketFields = { last_market_price: x.price, last_market_at: x.at };

    if (status === "pending") {
      if (!entryTouched(s, x)) {
        await client.from("signals").update(marketFields).eq("id", s.id);
        continue;
      }
      const r = await client.from("signals").update({ ...marketFields, status: "active", activated_at: now }).eq("id", s.id).eq("status", "pending");
      if (!r.error) {
        events.push({ id: s.id, pair: s.pair, event: "activated", price: x.price, source: x.source });
        await createNotification(client, s, `⚡ ${s.pair} Entry Active`, `${String(s.direction).toUpperCase()} ${String(s.order_type || "").toUpperCase()} activated at ${entry}.`);
      }
      // Never guess TP/SL ordering inside the same candle as pending-order activation.
      continue;
    }

    if (!s.activated_at) {
      const activated = s.created_at ?? now;
      await client.from("signals").update({ activated_at: activated }).eq("id", s.id);
      s.activated_at = activated;
    }

    const effectiveStop = s.be_moved ? entry : sl;
    if (targetTouched(s, x, effectiveStop, "stop")) {
      const update = s.be_moved
        ? { ...marketFields, status: "be", closed_at: now, closing_price: entry, result_pips: 0 }
        : { ...marketFields, status: "sl", closed_at: now, closing_price: sl, result_pips: calcPips(s.pair, s.direction, entry, sl) };
      const r = await client.from("signals").update(update).eq("id", s.id).in("status", ["active", "tp1", "tp2"]);
      if (!r.error) {
        events.push({ id: s.id, pair: s.pair, event: s.be_moved ? "be" : "sl", price: x.price, source: x.source });
        await createNotification(client, s, s.be_moved ? "🔒 Breakeven Hit" : "🛑 Stop Loss Hit", s.be_moved ? `${s.pair} closed at breakeven.` : `${s.pair} stop loss hit — signal closed automatically.`);
      }
      continue;
    }

    let next: "tp1" | "tp2" | "tp3" | null = null;
    if (tp3 != null && targetTouched(s, x, tp3, "tp")) next = "tp3";
    else if (tp2 != null && targetTouched(s, x, tp2, "tp")) next = "tp2";
    else if (targetTouched(s, x, tp1, "tp")) next = "tp1";

    const currentHit = Number(s.tp_hit ?? (status === "tp2" ? 2 : status === "tp1" ? 1 : 0));
    const nextHit = next === "tp3" ? 3 : next === "tp2" ? 2 : next === "tp1" ? 1 : 0;
    if (!next || nextHit <= currentHit) {
      await client.from("signals").update(marketFields).eq("id", s.id);
      continue;
    }

    const target = next === "tp3" ? tp3 : next === "tp2" ? tp2 : tp1;
    // TP2/TP3 are optional in the form. The highest configured TP is the final
    // target, so a TP1-only or TP1+TP2 signal must not remain open forever.
    const finalConfiguredHit = tp3 != null ? 3 : tp2 != null ? 2 : 1;
    const isFinalTarget = nextHit === finalConfiguredHit;
    const update: Record<string, unknown> = {
      ...marketFields,
      status: isFinalTarget ? (nextHit === 3 ? "tp3" : "closed") : next,
      tp_hit: nextHit,
      result_pips: calcPips(s.pair, s.direction, entry, target),
    };
    if (isFinalTarget) {
      update.closed_at = now;
      update.closing_price = target;
    }
    const r = await client.from("signals").update(update).eq("id", s.id).in("status", ["active", "tp1", "tp2"]);
    if (!r.error) {
      events.push({ id: s.id, pair: s.pair, event: next, final: isFinalTarget, price: x.price, source: x.source });
      const title = next === "tp3" ? "🏆 TP3 Hit" : next === "tp2" ? "✅ TP2 Hit" : "✅ TP1 Hit";
      const body = isFinalTarget
        ? `${s.pair} ${next.toUpperCase()} hit — final configured target reached, signal closed automatically.`
        : `${s.pair} ${next.toUpperCase()} hit automatically.`;
      await createNotification(client, s, title, body);
    }
  }

  const summary = { checked: signals.length, pairs: priceCache.size, events: events.length, failures: failures.length, finished_at: new Date().toISOString() };
  await client.from("signal_monitor_state").update({
    last_success_at: new Date().toISOString(),
    last_error: failures.length ? JSON.stringify(failures.slice(0, 8)) : null,
    last_summary: summary,
    updated_at: new Date().toISOString(),
  }).eq("id", 1);

  return reply({ ok: true, ...summary, events, failures: failures.slice(0, 20) });
});
