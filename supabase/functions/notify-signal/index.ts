const ONESIGNAL_URL = "https://api.onesignal.com/notifications";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hook-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const expectedSecret = Deno.env.get("HOOK_SECRET") || "";
    const receivedSecret = req.headers.get("x-hook-secret") || "";
    if (!expectedSecret || receivedSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized webhook" }), {
        status: 401,
        headers: corsHeaders(),
      });
    }

    const appId = Deno.env.get("ONESIGNAL_APP_ID") || "18a97e55-9d93-4193-b60b-fe8e621f5d12";
    const restApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY") || "";
    if (!restApiKey) {
      throw new Error("ONESIGNAL_REST_API_KEY secret is missing.");
    }

    const payload = await req.json();
    const signal = payload.record || payload.new || payload;

    const pair = signal.pair || signal.symbol || signal.instrument || "New Trading Signal";
    const direction = signal.direction || signal.side || signal.type || "";
    const entry = signal.entry_price || signal.entry || "";
    const stopLoss = signal.stop_loss || signal.sl || "";
    const takeProfit = signal.take_profit || signal.tp1 || signal.tp || "";

    const parts = [
      direction,
      entry ? `Entry ${entry}` : "",
      stopLoss ? `SL ${stopLoss}` : "",
      takeProfit ? `TP ${takeProfit}` : "",
    ].filter(Boolean);

    const notificationBody = parts.length
      ? parts.join(" • ")
      : "A new PipSePaisa trading signal is available.";

    const oneSignalPayload = {
      app_id: appId,
      included_segments: ["Subscribed Users"],
      headings: { en: `PipSePaisa: ${pair}` },
      contents: { en: notificationBody },
      url: "https://www.pipsepaisa.com/?open=signals",
      web_url: "https://www.pipsepaisa.com/?open=signals",
      chrome_web_icon: "https://www.pipsepaisa.com/icon-192.png",
      chrome_web_badge: "https://www.pipsepaisa.com/icon-192.png",
      data: {
        type: "new_signal",
        signal_id: signal.id || null,
        pair,
      },
    };

    const response = await fetch(ONESIGNAL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Key ${restApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(oneSignalPayload),
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`OneSignal error ${response.status}: ${responseText}`);
    }

    return new Response(JSON.stringify({
      ok: true,
      signal_id: signal.id || null,
      onesignal: JSON.parse(responseText),
    }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
});