/* PipSePaisa V230 — Infinity automatic callback. Public webhook (verify_jwt=false), path/query token secured. */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.10.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://www.pipsepaisa.com").replace(/\/$/, "");

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") ?? "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? "";
const SMTP_FROM_EMAIL = Deno.env.get("SMTP_FROM_EMAIL") ?? "no-reply@pipsepaisa.com";
const SMTP_FROM_NAME = Deno.env.get("SMTP_FROM_NAME") ?? "PipSePaisa";

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function parsePayload(req: Request): Promise<Record<string, unknown>> {
  // Infinity may call the callback as POST form/json or as GET query parameters.
  // Merge URL query + body so either delivery style is accepted.
  const out: Record<string, unknown> = {};
  const url = new URL(req.url);
  for (const [key, value] of url.searchParams.entries()) out[key] = value;
  if (req.method === "GET" || req.method === "HEAD") return out;

  const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
  try {
    if (contentType.includes("application/json")) {
      const value = await req.json().catch(() => ({}));
      if (value && typeof value === "object") Object.assign(out, value as Record<string, unknown>);
      return out;
    }
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      for (const [key, value] of form.entries()) out[key] = typeof value === "string" ? value : value.name;
      return out;
    }
    const raw = await req.text();
    if (!raw) return out;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") Object.assign(out, parsed as Record<string, unknown>);
    } catch {
      const params = new URLSearchParams(raw);
      for (const [key, value] of params.entries()) out[key] = value;
    }
  } catch (error) {
    console.warn("Infinity callback payload parse warning", error);
  }
  return out;
}

function normalizedPayload(payload: Record<string, unknown>) {
  const map = new Map<string, unknown>();
  for (const [key, value] of Object.entries(payload)) {
    map.set(key.toLowerCase().replace(/[^a-z0-9]/g, ""), value);
  }
  return map;
}

function firstValue(payload: Record<string, unknown>, keys: string[]): string {
  const map = normalizedPayload(payload);
  for (const key of keys) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const value = map.get(normalized);
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function callbackTokenFromRequest(req: Request): string {
  const url = new URL(req.url);
  const queryToken = (url.searchParams.get("token") ?? "").trim();
  if (queryToken) return queryToken;
  // V230 also embeds the random token in the callback PATH because some
  // payment gateways normalize/drop query strings when posting webhooks.
  const parts = url.pathname.split("/").filter(Boolean);
  const last = (parts.at(-1) ?? "").trim();
  return /^[a-f0-9]{64}$/i.test(last) ? last : "";
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827"><table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb"><tr><td style="background:#0b172a;padding:24px;text-align:center;color:#fff;font-size:25px;font-weight:900">Pip<span style="color:#FB9201">Se</span>Paisa<div style="font-size:11px;color:#cbd5e1;margin-top:5px">GROW WITH US.</div></td></tr><tr><td style="padding:30px 26px"><h1 style="font-size:23px;margin:0 0 17px">${esc(title)}</h1>${body}</td></tr><tr><td style="padding:18px 26px;background:#fafafa;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px">Automated email from PipSePaisa.</td></tr></table></td></tr></table></body></html>`;
}

async function sendStatusEmail(row: Record<string, unknown>, accepted: boolean, reason = "") {
  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD || !row.user_email) {
    console.warn("Infinity callback email skipped because SMTP or recipient is missing.");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
  });
  const name = esc(row.user_name || "Student");
  const course = esc(row.course_name || "Advanced Forex Course");
  const amount = `${esc(row.currency || "USD")} ${esc(row.amount || "")}`;
  const requestId = esc(row.payment_id || "");

  const subject = accepted
    ? "Payment Successful — Course Access Active"
    : "Payment Rejected — Local Bank Transfer";
  const html = accepted
    ? layout("Payment Successful — Course Access Active", `<p style="font-size:16px;line-height:1.7">Hi <strong>${name}</strong>,</p><p style="font-size:15px;line-height:1.7;color:#374151">Your Local Bank Transfer for <strong>${course}</strong> has been accepted.</p><div style="padding:16px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;color:#065f46"><strong>✓ Payment successful</strong><br><strong>✓ Course access activated automatically</strong><br><strong>✓ Amount: ${amount}</strong></div><p style="margin:25px 0 0"><a href="${SITE_URL}/my-courses/" style="display:inline-block;background:#FB9201;color:#111827;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:800">Open My Course</a></p>`)
    : layout("Payment Rejected", `<p style="font-size:16px;line-height:1.7">Hi <strong>${name}</strong>,</p><p style="font-size:15px;line-height:1.7;color:#374151">Your Local Bank Transfer for <strong>${course}</strong> was not accepted.</p><div style="padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#991b1b"><strong>Reason:</strong><br>${esc(reason || "The payment provider could not verify the payment.")}</div><p style="font-size:14px;line-height:1.65;color:#6b7280">You can return to the course page and start a new Local Bank Transfer request.</p><p style="margin:25px 0 0"><a href="${SITE_URL}/my-courses/" style="display:inline-block;background:#FB9201;color:#111827;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:800">Open My Courses</a></p>`);

  await transporter.sendMail({
    from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
    to: String(row.user_email),
    subject,
    html,
    headers: { "X-PipSePaisa-Payment": requestId },
  });
}

function normalizeInfinityStatus(raw: unknown): "accepted" | "rejected" | "expired" | "" {
  const v = String(raw ?? "").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  if (["accepted","accept","approved","approve","success","successful","paid","completed","complete","captured","confirmed","verified","settled","payment_success","payment_approved"].includes(v)) return "accepted";
  if (["rejected","reject","declined","decline","failed","failure","cancelled","canceled","void","reversed","verification_failed","invalid_receipt","payment_rejected","payment_failed"].includes(v)) return "rejected";
  if (["expired","expire","timeout","timed_out","payment_expired"].includes(v)) return "expired";
  if (/reject|declin|fail|invalid_receipt|verification_failed/.test(v)) return "rejected";
  if (/accept|approv|success|paid|verif|settled|complete/.test(v)) return "accepted";
  if (/expir|timeout/.test(v)) return "expired";
  return "";
}

function numberValue(raw: string): number {
  const clean = String(raw ?? "").replace(/[^0-9.\-]/g, "");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

Deno.serve(async (req: Request) => {
  if (!["GET","POST"].includes(req.method)) return json({ success: false, error: "Only GET/POST are allowed.", version: "v230" }, 405);
  const trace = crypto.randomUUID();

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Callback service configuration is incomplete.");

    const payload = await parsePayload(req);
    const rawStatus = firstValue(payload, ["status", "payment_status", "paymentStatus", "transaction_status", "request_status", "state", "result"]);
    const requestIdRaw = firstValue(payload, ["request_id", "requestId", "requestid", "reference", "reference_id", "transaction_id", "id"]);
    const amountRaw = firstValue(payload, ["amount", "payment_amount", "paymentAmount", "paid_amount", "transaction_amount"]);
    const rejectionReason = firstValue(payload, ["rejection_reason", "reason", "message", "status_message", "verification_message", "error"]);
    let status = normalizeInfinityStatus(rawStatus);
    // Some Infinity rejection payloads carry only a rejection/verification reason.
    if (!status && /reject|declin|fail|invalid receipt|verification failed/i.test(rejectionReason)) status = "rejected";

    if (!requestIdRaw || !/^\d+$/.test(requestIdRaw)) return json({ success: false, error: "Invalid request_id.", version: "v230" }, 400);
    if (!status) {
      console.warn(`[${trace}] unsupported Infinity status`, rawStatus, payload);
      return json({ success: false, error: "Unsupported payment status.", received_status: rawStatus, version: "v230" }, 400);
    }

    const suppliedToken = callbackTokenFromRequest(req);

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // Lookup by request id first. V230 compares the stored token in-process so it
    // can safely support both query-token and path-token callback URLs.
    const tokenCheck = await service
      .from("course_payments")
      .select("id,amount,provider_status,status,provider_callback_token")
      .eq("provider", "infinity")
      .eq("provider_request_id", Number(requestIdRaw))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (tokenCheck.error || !tokenCheck.data) {
      console.warn(`[${trace}] Infinity request not found ${requestIdRaw}`, tokenCheck.error);
      return json({ success: false, error: "Payment request not found.", version: "v230" }, 404);
    }

    const expectedToken = String(tokenCheck.data.provider_callback_token ?? "").trim();
    const tokenValid = !!suppliedToken && suppliedToken.length >= 32 && !!expectedToken && suppliedToken === expectedToken;
    let callbackAuthMode = "token";
    if (!tokenValid) {
      // SECURITY: a tokenless callback can NEVER grant access.
      // For negative terminal events only, allowing the provider to close an
      // initiated request is safe and prevents gateways that strip query strings
      // from leaving rejected payments stuck forever in Auto Processing.
      if (status !== "rejected" && status !== "expired") {
        console.warn(`[${trace}] invalid callback token for positive/non-terminal request ${requestIdRaw}`);
        return json({ success: false, error: "Invalid callback token.", version: "v230" }, 401);
      }
      const current = String(tokenCheck.data.provider_status ?? tokenCheck.data.status ?? "").trim().toLowerCase();
      if (["accepted","approved","success","successful","completed","paid","captured","confirmed","verified","settled"].includes(current)) {
        return json({ success: false, error: "Accepted payment cannot be downgraded.", version: "v230" }, 409);
      }
      callbackAuthMode = "negative_only_fallback";
      console.warn(`[${trace}] Infinity negative callback accepted without token for request ${requestIdRaw}`);
    }

    const amount = (status === "rejected" || status === "expired")
      ? Number(tokenCheck.data.amount ?? 0)
      : (numberValue(amountRaw) || Number(tokenCheck.data.amount ?? 0));
    if (!Number.isFinite(amount) || amount <= 0) return json({ success: false, error: "Invalid callback amount.", version: "v230" }, 400);

    const final = await service.rpc("finalize_infinity_payment", {
      p_request_id: Number(requestIdRaw),
      p_provider_status: status,
      p_callback_amount: amount,
      p_rejection_reason: rejectionReason || (status === "expired" ? "Infinity payment window expired." : null),
      p_payload: { ...payload, _psp_received_status: rawStatus, _psp_normalized_status: status, _psp_callback_auth: callbackAuthMode },
    });
    if (final.error) {
      console.error(`[${trace}] finalize failed`, final.error);
      return json({ success: false, error: final.error.message, version: "v230" }, 400);
    }

    const row = (Array.isArray(final.data) ? final.data[0] : final.data) as Record<string, unknown> | null;
    if (!row) return json({ success: false, error: "Payment finalization returned no record.", version: "v230" }, 500);

    // Provider status is authoritative. Accepted access is active immediately;
    // rejected/expired attempts never wait for an Admin decision.
    if (row.idempotent !== true && status !== "expired") {
      try { await sendStatusEmail(row, status === "accepted", rejectionReason); }
      catch (emailError) { console.error(`[${trace}] payment finalized but email failed`, emailError); }
    }

    return json({ success: true, request_id: requestIdRaw, status, received_status: rawStatus, auth_mode: callbackAuthMode, idempotent: row.idempotent === true, version: "v230" });
  } catch (error) {
    console.error(`[${trace}] infinity-payment-callback V230 failed`, error);
    return json({ success: false, error: error instanceof Error ? error.message : "Callback processing failed.", version: "v230" }, 500);
  }
});
