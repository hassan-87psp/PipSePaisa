// ============================================================
//  PipSePaisa — Auto Push Notification (OneSignal)
//  Handles: INSERT on signals/charts/articles/banners
//           UPDATE on signals (TP1/TP2/TP3 hit, SL hit, closed)
// ============================================================

const ONESIGNAL_APP_ID = "18a97e55-9d93-4193-b60b-fe8e621f5d12";
const REST_KEY   = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";
const SITE_URL   = "https://www.pipsepaisa.com";

const AUTH_SCHEME = REST_KEY.startsWith("os_v2") ? "Key" : "Basic";

function statusMessage(r: Record<string, unknown>) {
  const pair = (r.pair as string) || "Signal";
  const dir  = ((r.direction as string) || "").toUpperCase();
  const pips = r.result_pips != null ? ` (${Number(r.result_pips) >= 0 ? "+" : ""}${r.result_pips} pips)` : "";
  const st   = ((r.status as string) || "").toLowerCase();

  switch (st) {
    case "tp1": return { heading: `✅ TP1 Hit — ${pair}`, content: `${pair} ${dir} has hit Take Profit 1!${pips}` };
    case "tp2": return { heading: `✅ TP2 Hit — ${pair}`, content: `${pair} ${dir} has hit Take Profit 2!${pips}` };
    case "tp3": return { heading: `🏆 TP3 Hit — ${pair}`, content: `${pair} ${dir} has hit Take Profit 3 — full target reached!${pips}` };
    case "sl":  return { heading: `🛑 SL Hit — ${pair}`,  content: `${pair} ${dir} closed at Stop Loss.${pips}` };
    case "closed": return { heading: `🔒 Trade Closed — ${pair}`, content: `${pair} ${dir} trade has been closed.${pips}` };
    case "be": return { heading: `🔒 Breakeven Hit — ${pair}`, content: `${pair} ${dir} closed at breakeven — capital secured!${pips}` };
    default: return null; // active / unknown => no push
  }
}

function buildMessage(table: string, type: string, r: Record<string, unknown>, oldR: Record<string, unknown> | null) {
  const pair = (r.pair as string) || "";
  const ot   = (((r.order_type as string) || "market") + "").toLowerCase();
  const dir  = ((r.direction as string) || "").toUpperCase() + (ot !== "market" ? ` ${ot.toUpperCase()}` : "");
  const entry = r.entry_price != null ? ` @ ${r.entry_price}` : "";
  const title = (r.title as string) || "";

  // ---- UPDATE on signals => status change push (TP/SL/close) ----
  if (table === "signals" && type === "UPDATE") {
    const oldStatus = ((oldR?.status as string) || "").toLowerCase();
    const newStatus = ((r.status as string) || "").toLowerCase();
    if (newStatus && newStatus !== oldStatus) {
      return statusMessage(r); // null if status not push-worthy
    }
    // SL moved to Breakeven (status same, be_moved false -> true)
    const oldBe = !!(oldR && (oldR as Record<string, unknown>).be_moved);
    const newBe = !!(r as Record<string, unknown>).be_moved;
    if (newBe && !oldBe) {
      return { heading: `⚠️ Move SL to Breakeven — ${pair}`, content: `${pair} ${dir}: Move your Stop Loss to entry${entry} to secure your profit!` };
    }
    return null; // other edits (typo fix etc.) => no push
  }

  // ---- INSERT messages ----
  switch (table) {
    case "signals":
      return {
        heading: `📢 New Signal: ${pair} ${dir}`.trim(),
        content: `${pair} ${dir}${entry}`.trim() +
                 (r.take_profit1 ? ` · TP ${r.take_profit1}` : "") +
                 (r.stop_loss ? ` · SL ${r.stop_loss}` : ""),
      };
    case "charts":
      return { heading: "📈 New Chart posted", content: title || pair || "Open PipSePaisa to view the latest chart." };
    case "articles":
      return { heading: "📰 New Article", content: title || "A new article was just published." };
    case "banners":
      return { heading: "🖼️ New Banner", content: title || "A new banner is available to download." };
    default:
      return { heading: "🔔 PipSePaisa", content: title || pair || "You have a new update." };
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("ok", { status: 200 });

    if (!REST_KEY) {
      return new Response(JSON.stringify({ error: "ONESIGNAL_REST_API_KEY not set" }), { status: 500 });
    }

    const payload = await req.json().catch(() => ({}));
    const table  = payload.table || "signals";
    const type   = payload.type || "INSERT";          // INSERT | UPDATE
    const record = payload.record || payload;
    const oldRec = payload.old_record || null;

    const msg = buildMessage(table, type, record, oldRec);
    if (!msg) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    // Direct page open on click
    const pageMap: Record<string, string> = {
      signals: "/?page=signals",
      charts: "/?page=articles",
      articles: "/?page=articles",
      banners: "/?page=performance",
    };
    const clickUrl = SITE_URL + (pageMap[table] || "/");

    const body = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["Total Subscriptions"],
      headings: { en: msg.heading },
      contents: { en: msg.content },
      url: clickUrl,
      chrome_web_icon: `${SITE_URL}/icon-192.png`,
      chrome_web_badge: `${SITE_URL}/icon-192.png`,
      // unique topic => notifications STACK instead of replacing each other
      web_push_topic: `${table}-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };

    const r = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `${AUTH_SCHEME} ${REST_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const out = await r.text();
    return new Response(out, { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
