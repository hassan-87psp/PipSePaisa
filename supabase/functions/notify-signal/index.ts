// ============================================================
//  PipSePaisa — Auto Push Notification (OneSignal)
//  Runs on Supabase. A Database Webhook calls this whenever a
//  new row is inserted into signals / charts / articles / banners.
//  It then sends a push to all subscribed users (Chrome closed too).
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ONESIGNAL_APP_ID = "18a97e55-9d93-4193-b60b-fe8e621f5d12";
const REST_KEY   = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";
const HOOK_SECRET = Deno.env.get("HOOK_SECRET") ?? "";      // optional shared secret
const SITE_URL   = "https://www.pipsepaisa.com";

// New OneSignal keys start with "os_v2..." (use "Key"); old keys use "Basic"
const AUTH_SCHEME = REST_KEY.startsWith("os_v2") ? "Key" : "Basic";

function buildMessage(table: string, r: Record<string, unknown>) {
  const pair = (r.pair as string) || "";
  const dir  = ((r.direction as string) || "").toUpperCase();
  const entry = r.entry_price != null ? ` @ ${r.entry_price}` : "";
  const title = (r.title as string) || "";

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

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("ok", { status: 200 });

    // optional security: only accept calls that carry our secret header
    if (HOOK_SECRET && (req.headers.get("x-hook-secret") ?? "") !== HOOK_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    if (!REST_KEY) {
      return new Response(JSON.stringify({ error: "ONESIGNAL_REST_API_KEY not set" }), { status: 500 });
    }

    const payload = await req.json().catch(() => ({}));
    const table = payload.table || "signals";
    const record = payload.record || payload; // Supabase webhook -> record
    const { heading, content } = buildMessage(table, record);

    const body = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["Total Subscriptions"], // if this errors, use ["Subscribed Users"]
      headings: { en: heading },
      contents: { en: content },
      url: SITE_URL,
      chrome_web_icon: `${SITE_URL}/icon-192.png`,
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
