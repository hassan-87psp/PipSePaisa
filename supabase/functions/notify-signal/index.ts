// ============================================================
// PipSePaisa — Complete Automatic Push Notifications
//
// New content:
// New Signal
// New Article
// New Chart
// New Banner
//
// Signal updates:
// TP1 Hit
// TP2 Hit
// TP3 Hit
// SL Hit
// Breakeven Hit
// Move SL to Breakeven
// Trade Closed
// ============================================================

const ONESIGNAL_APP_ID =
  Deno.env.get("ONESIGNAL_APP_ID") ?? "";

const ONESIGNAL_REST_API_KEY =
  Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

const HOOK_SECRET =
  Deno.env.get("HOOK_SECRET") ?? "";

const SITE_ORIGIN = "https://pipsepaisa.com";
const SITE_URL = SITE_ORIGIN + "/dashboard";

type DatabaseRecord = Record<string, unknown>;

type NotificationMessage = {
  heading: string;
  content: string;
  launchUrl: string;
};

// ------------------------------------------------------------
// JSON response
// ------------------------------------------------------------

function jsonResponse(
  data: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

// ------------------------------------------------------------
// Safe text conversion
// ------------------------------------------------------------

function getText(value: unknown): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function contentDeepLink(page: string, idParam: string, record: DatabaseRecord): string {
  const id = getText(record.id);
  const destination = new URL(SITE_URL + "/");
  destination.searchParams.set("page",page);
  // Include only a real record identifier; never interpolate webhook text into a URL.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    destination.searchParams.set(idParam,id);
  }
  return destination.toString();
}

// ------------------------------------------------------------
// Normalize database values
//
// Examples converted:
// "TP1 Hit"  → "tp1_hit"
// "tp-1"     → "tp_1"
// "Stop Loss"→ "stop_loss"
// ------------------------------------------------------------

function normalize(value: unknown): string {
  return getText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ------------------------------------------------------------
// Check whether a value matches any supported status
// ------------------------------------------------------------

function matchesStatus(
  status: string,
  acceptedValues: string[],
): boolean {
  return acceptedValues.includes(status);
}

// ------------------------------------------------------------
// Signal details
// ------------------------------------------------------------

function getSignalDetails(
  record: DatabaseRecord,
) {
  const pair =
    getText(record.pair) ||
    getText(record.symbol) ||
    getText(record.instrument) ||
    "Signal";

  const direction =
    (
      getText(record.direction) ||
      getText(record.trade_type) ||
      getText(record.type)
    ).toUpperCase();

  const entry =
    record.entry_price ??
    record.entry ??
    record.entryPrice ??
    "";

  const tp1 =
    record.take_profit1 ??
    record.tp1 ??
    record.takeProfit1 ??
    "";

  const tp2 =
    record.take_profit2 ??
    record.tp2 ??
    record.takeProfit2 ??
    "";

  const tp3 =
    record.take_profit3 ??
    record.tp3 ??
    record.takeProfit3 ??
    "";

  const stopLoss =
    record.stop_loss ??
    record.sl ??
    record.stopLoss ??
    "";

  return {
    pair,
    direction,
    entry,
    tp1,
    tp2,
    tp3,
    stopLoss,
  };
}

// ------------------------------------------------------------
// Result pips text
// ------------------------------------------------------------

function getPipsText(
  record: DatabaseRecord,
): string {
  const rawPips =
    record.result_pips ??
    record.pips ??
    record.profit_pips ??
    null;

  if (
    rawPips === null ||
    rawPips === undefined ||
    rawPips === ""
  ) {
    return "";
  }

  const pips = Number(rawPips);

  if (!Number.isFinite(pips)) {
    return "";
  }

  return ` (${pips >= 0 ? "+" : ""}${pips} pips)`;
}

// ------------------------------------------------------------
// New Signal notification
// ------------------------------------------------------------

function buildNewSignalMessage(
  record: DatabaseRecord,
): NotificationMessage {
  const {
    pair,
    direction,
    entry,
    tp1,
    tp2,
    tp3,
    stopLoss,
  } = getSignalDetails(record);

  const details: string[] = [];

  if (entry !== "") {
    details.push(`Entry ${entry}`);
  }

  if (tp1 !== "") {
    details.push(`TP1 ${tp1}`);
  }

  if (tp2 !== "") {
    details.push(`TP2 ${tp2}`);
  }

  if (tp3 !== "") {
    details.push(`TP3 ${tp3}`);
  }

  if (stopLoss !== "") {
    details.push(`SL ${stopLoss}`);
  }

  return {
    heading:
      `📢 New Signal — ${pair} ${direction}`.trim(),

    content:
      details.length > 0
        ? details.join(" · ")
        : `A new ${pair} ${direction} signal is available.`.trim(),

    launchUrl:
      contentDeepLink("signals", "signal_id", record),
  };
}

// ------------------------------------------------------------
// Signal status notification
// ------------------------------------------------------------

function buildSignalStatusMessage(
  record: DatabaseRecord,
): NotificationMessage | null {
  const {
    pair,
    direction,
  } = getSignalDetails(record);

  const status = normalize(record.status);
  const pipsText = getPipsText(record);

  // TP1
  if (
    matchesStatus(status, [
      "tp1",
      "tp_1",
      "tp1_hit",
      "tp_1_hit",
      "take_profit_1",
      "take_profit_1_hit",
      "target_1",
      "target_1_hit",
    ])
  ) {
    return {
      heading: `✅ TP1 Hit — ${pair}`,
      content:
        `${pair} ${direction} has hit Take Profit 1!${pipsText}`.trim(),
      launchUrl:
        contentDeepLink("signals", "signal_id", record),
    };
  }

  // TP2
  if (
    matchesStatus(status, [
      "tp2",
      "tp_2",
      "tp2_hit",
      "tp_2_hit",
      "take_profit_2",
      "take_profit_2_hit",
      "target_2",
      "target_2_hit",
    ])
  ) {
    return {
      heading: `✅ TP2 Hit — ${pair}`,
      content:
        `${pair} ${direction} has hit Take Profit 2!${pipsText}`.trim(),
      launchUrl:
        contentDeepLink("signals", "signal_id", record),
    };
  }

  // TP3
  if (
    matchesStatus(status, [
      "tp3",
      "tp_3",
      "tp3_hit",
      "tp_3_hit",
      "take_profit_3",
      "take_profit_3_hit",
      "target_3",
      "target_3_hit",
    ])
  ) {
    return {
      heading: `🏆 TP3 Hit — ${pair}`,
      content:
        `${pair} ${direction} full target reached!${pipsText}`.trim(),
      launchUrl:
        contentDeepLink("signals", "signal_id", record),
    };
  }

  // Stop Loss
  if (
    matchesStatus(status, [
      "sl",
      "sl_hit",
      "stop_loss",
      "stop_loss_hit",
      "stopped",
      "stopped_out",
      "loss",
    ])
  ) {
    return {
      heading: `🛑 SL Hit — ${pair}`,
      content:
        `${pair} ${direction} closed at Stop Loss.${pipsText}`.trim(),
      launchUrl:
        contentDeepLink("signals", "signal_id", record),
    };
  }

  // Breakeven
  if (
    matchesStatus(status, [
      "be",
      "be_hit",
      "breakeven",
      "breakeven_hit",
      "break_even",
      "break_even_hit",
    ])
  ) {
    return {
      heading: `⚖️ Breakeven Hit — ${pair}`,
      content:
        `${pair} ${direction} closed at breakeven.${pipsText}`.trim(),
      launchUrl:
        contentDeepLink("signals", "signal_id", record),
    };
  }

  // Trade Closed
  if (
    matchesStatus(status, [
      "closed",
      "trade_closed",
      "close",
      "manually_closed",
      "manual_close",
      "completed",
    ])
  ) {
    return {
      heading: `🔒 Trade Closed — ${pair}`,
      content:
        `${pair} ${direction} trade has been closed.${pipsText}`.trim(),
      launchUrl:
        contentDeepLink("signals", "signal_id", record),
    };
  }

  return null;
}

// ------------------------------------------------------------
// Move SL to Breakeven
// ------------------------------------------------------------

function buildBreakevenMoveMessage(
  record: DatabaseRecord,
  oldRecord: DatabaseRecord | null,
): NotificationMessage | null {
  const oldBeMoved = Boolean(
    oldRecord?.be_moved ??
    oldRecord?.move_to_be ??
    oldRecord?.breakeven_moved,
  );

  const newBeMoved = Boolean(
    record.be_moved ??
    record.move_to_be ??
    record.breakeven_moved,
  );

  if (
    oldBeMoved ||
    !newBeMoved
  ) {
    return null;
  }

  const {
    pair,
    direction,
    entry,
  } = getSignalDetails(record);

  const entryText =
    entry !== ""
      ? ` at ${entry}`
      : "";

  return {
    heading:
      `⚠️ Move SL to Breakeven — ${pair}`,

    content:
      `${pair} ${direction}: Move Stop Loss to entry${entryText} to secure the trade.`.trim(),

    launchUrl:
      contentDeepLink("signals", "signal_id", record),
  };
}

// ------------------------------------------------------------
// Article, Chart and Banner notifications
// ------------------------------------------------------------

function buildContentMessage(
  table: string,
  record: DatabaseRecord,
): NotificationMessage | null {
  const title =
    getText(record.title) ||
    getText(record.name) ||
    getText(record.heading);

  if (table === "articles") {
    return {
      heading: "📰 New Article",
      content:
        title ||
        "A new article has been published on PipSePaisa.",
      launchUrl:
        contentDeepLink("articles", "article_id", record),
    };
  }

  if (table === "charts") {
    const pair =
      getText(record.pair) ||
      getText(record.symbol);

    return {
      heading: "📈 New Chart",
      content:
        title ||
        pair ||
        "A new market chart has been posted.",
      launchUrl:
        contentDeepLink("articles", "chart_id", record),
    };
  }

  if (table === "banners") {
    return {
      heading: "🖼️ New Banner",
      content:
        title ||
        "A new banner is available on PipSePaisa.",
      launchUrl:
        `${SITE_URL}/?page=banners`,
    };
  }

  return null;
}

// ------------------------------------------------------------
// Build notification based on table and database event
// ------------------------------------------------------------

function buildNotification(
  table: string,
  eventType: string,
  record: DatabaseRecord,
  oldRecord: DatabaseRecord | null,
): NotificationMessage | null {
  // New Signal
  if (
    table === "signals" &&
    eventType === "INSERT"
  ) {
    return buildNewSignalMessage(record);
  }

  // Signal updates
  if (
    table === "signals" &&
    eventType === "UPDATE"
  ) {
    const oldStatus =
      normalize(oldRecord?.status);

    const newStatus =
      normalize(record.status);

    // Status changed
    if (
      newStatus &&
      newStatus !== oldStatus
    ) {
      const statusMessage =
        buildSignalStatusMessage(record);

      if (statusMessage) {
        return statusMessage;
      }
    }

    // Move SL to Breakeven
    const breakevenMessage =
      buildBreakevenMoveMessage(
        record,
        oldRecord,
      );

    if (breakevenMessage) {
      return breakevenMessage;
    }

    // Other signal edits should not send push
    return null;
  }

  // Only published charts and articles notify subscribers.
  // Publishing a saved draft is an UPDATE, not an INSERT.
  if (table === "charts" || table === "articles") {
    if (record.is_published !== true) return null;
    if (table === "articles" && record.suppress_notifications === true) return null;
    if (eventType === "INSERT") return buildContentMessage(table, record);
    if (eventType === "UPDATE" && oldRecord?.is_published !== true) {
      return buildContentMessage(table, record);
    }
    return null;
  }

  // Banners are not controlled by is_published.
  if (table === "banners" && eventType === "INSERT") {
    return buildContentMessage(table, record);
  }

  return null;
}

// ------------------------------------------------------------
// Send push notification to OneSignal
// ------------------------------------------------------------

async function sendOneSignalNotification(
  message: NotificationMessage,
  table: string,
  eventType: string,
) {
  const oneSignalPayload = {
    app_id: ONESIGNAL_APP_ID,

    target_channel: "push",

    included_segments: [
      "Total Subscriptions",
    ],

    headings: {
      en: message.heading,
    },

    contents: {
      en: message.content,
    },

    url: message.launchUrl,

    chrome_web_icon:
      `${SITE_ORIGIN}/icon-192.png`,

    chrome_web_badge:
      `${SITE_ORIGIN}/icon-192.png`,

    web_push_topic:
      `${table}-${eventType}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,
  };

  const response = await fetch(
    "https://api.onesignal.com/notifications",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "Authorization":
          `Key ${ONESIGNAL_REST_API_KEY}`,
      },

      body:
        JSON.stringify(oneSignalPayload),
    },
  );

  const responseText =
    await response.text();

  let responseData: unknown;

  try {
    responseData =
      JSON.parse(responseText);
  } catch {
    responseData =
      responseText;
  }

  if (!response.ok) {
    throw new Error(
      `OneSignal error ${response.status}: ${responseText}`,
    );
  }

  return {
    status: response.status,
    data: responseData,
  };
}

// ------------------------------------------------------------
// Edge Function
// ------------------------------------------------------------

Deno.serve(async (request) => {
  try {
    // Health check
    if (request.method === "GET") {
      return jsonResponse({
        ok: true,
        message:
          "PipSePaisa notification function is running.",
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        {
          ok: false,
          error:
            "Only POST requests are supported.",
        },
        405,
      );
    }

    // Check required secrets
    const missingSecrets: string[] = [];

    if (!ONESIGNAL_APP_ID) {
      missingSecrets.push(
        "ONESIGNAL_APP_ID",
      );
    }

    if (!ONESIGNAL_REST_API_KEY) {
      missingSecrets.push(
        "ONESIGNAL_REST_API_KEY",
      );
    }

    if (!HOOK_SECRET) {
      missingSecrets.push(
        "HOOK_SECRET",
      );
    }

    if (missingSecrets.length > 0) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Required Edge Function secrets are missing.",
          missingSecrets,
        },
        500,
      );
    }

    // Check webhook secret
    const receivedSecret =
      request.headers.get(
        "x-hook-secret",
      ) ?? "";

    if (
      receivedSecret !== HOOK_SECRET
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Unauthorized webhook request.",
        },
        401,
      );
    }

    // Read database webhook body
    const payload =
      await request.json().catch(
        () => null,
      );

    if (
      !payload ||
      typeof payload !== "object"
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Invalid JSON request body.",
        },
        400,
      );
    }

    // Internal delivery diagnostics. Requires the same trusted webhook secret.
    // Never exposes OneSignal keys, subscriber identities or push tokens.
    if (payload.action === "diagnose_delivery") {
      const notificationId = getText(payload.notification_id);
      if (!/^[0-9a-f-]{36}$/i.test(notificationId)) {
        return jsonResponse({ok:false,error:"Invalid notification id"},400);
      }
      const r=await fetch(
        "https://api.onesignal.com/notifications/"+encodeURIComponent(notificationId)+
          "?app_id="+encodeURIComponent(ONESIGNAL_APP_ID),
        {headers:{"Authorization":"Key "+ONESIGNAL_REST_API_KEY,
                  "Accept":"application/json"},signal:AbortSignal.timeout(10000)}
      );
      if(!r.ok)return jsonResponse({ok:false,providerStatus:r.status},502);
      const d=await r.json();
      return jsonResponse({ok:true,metrics:{
        successful:d.successful??null,failed:d.failed??null,
        errored:d.errored??null,remaining:d.remaining??null,
        received:d.received??null,queued_at:d.queued_at??null,
        completed_at:d.completed_at??null,targeted:d.included_segments??null
      }});
    }

    const table =
      getText(payload.table)
        .toLowerCase();

    const eventType =
      getText(payload.type)
        .toUpperCase();

    const record: DatabaseRecord =
      payload.record &&
      typeof payload.record === "object"
        ? payload.record
        : {};

    const oldRecord: DatabaseRecord | null =
      payload.old_record &&
      typeof payload.old_record === "object"
        ? payload.old_record
        : null;

    if (!table) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Webhook table name is missing.",
        },
        400,
      );
    }

    if (!eventType) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Webhook event type is missing.",
        },
        400,
      );
    }

    const notification =
      buildNotification(
        table,
        eventType,
        record,
        oldRecord,
      );

    // No push needed
    if (!notification) {
      return jsonResponse({
        ok: true,
        skipped: true,
        table,
        eventType,
        reason:
          "This database change does not require a notification.",
      });
    }

    const oneSignalResult =
      await sendOneSignalNotification(
        notification,
        table,
        eventType,
      );

    return jsonResponse({
      ok: true,

      notificationType:
        notification.heading,

      table,
      eventType,

      oneSignal:
        oneSignalResult,
    });
  } catch (error) {
    console.error(
      "notify-signal error:",
      error,
    );

    return jsonResponse(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500,
    );
  }
});