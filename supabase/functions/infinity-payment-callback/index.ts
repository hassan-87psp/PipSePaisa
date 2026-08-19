import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.10.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const INFINITY_CALLBACK_SECRET = Deno.env.get("INFINITY_CALLBACK_SECRET") ?? "";
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

async function hmacHex(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function parsePayload(req: Request): Promise<Record<string, unknown>> {
  const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.includes("application/json")) {
    const value = await req.json().catch(() => ({}));
    return value && typeof value === "object" ? value as Record<string, unknown> : {};
  }
  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    const out: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) out[key] = typeof value === "string" ? value : value.name;
    return out;
  }
  const raw = await req.text();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    const params = new URLSearchParams(raw);
    return Object.fromEntries(params.entries());
  }
}

function firstValue(payload: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ success: false, error: "Only POST is allowed." }, 405);
  const trace = crypto.randomUUID();

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !INFINITY_CALLBACK_SECRET) {
      throw new Error("Infinity callback server secrets are incomplete.");
    }

    const payload = await parsePayload(req);
    const status = firstValue(payload, ["status", "payment_status"]).toLowerCase();
    const requestIdRaw = firstValue(payload, ["request_id", "requestId", "id"]);
    const amountRaw = firstValue(payload, ["amount", "payment_amount"]);
    const rejectionReason = firstValue(payload, ["rejection_reason", "reason", "message"]);

    if (!requestIdRaw || !/^\d+$/.test(requestIdRaw)) {
      return json({ success: false, error: "Invalid request_id." }, 400);
    }
    if (!['accepted', 'rejected'].includes(status)) {
      return json({ success: false, error: "Unsupported payment status." }, 400);
    }
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ success: false, error: "Invalid callback amount." }, 400);
    }

    const suppliedToken = new URL(req.url).searchParams.get("token") ?? "";
    const expectedToken = await hmacHex(INFINITY_CALLBACK_SECRET, requestIdRaw);
    if (!suppliedToken || !timingSafeEqual(suppliedToken, expectedToken)) {
      console.warn(`[${trace}] invalid callback token for request ${requestIdRaw}`);
      return json({ success: false, error: "Invalid callback token." }, 401);
    }

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const final = await service.rpc("finalize_infinity_payment", {
      p_request_id: Number(requestIdRaw),
      p_provider_status: status,
      p_callback_amount: amount,
      p_rejection_reason: rejectionReason || null,
      p_payload: payload,
    });
    if (final.error) {
      console.error(`[${trace}] finalize failed`, final.error);
      return json({ success: false, error: final.error.message }, 400);
    }

    const row = (Array.isArray(final.data) ? final.data[0] : final.data) as Record<string, unknown> | null;
    if (!row) return json({ success: false, error: "Payment finalization returned no record." }, 500);

    // Only one email per real state transition. Replayed callbacks are idempotent.
    if (row.idempotent !== true) {
      try {
        await sendStatusEmail(row, status === "accepted", rejectionReason);
      } catch (emailError) {
        console.error(`[${trace}] payment finalized but email failed`, emailError);
      }
    }

    return json({
      success: true,
      request_id: requestIdRaw,
      status,
      idempotent: row.idempotent === true,
    });
  } catch (error) {
    console.error(`[${trace}] infinity-payment-callback failed`, error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Callback processing failed.",
    }, 500);
  }
});
