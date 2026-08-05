import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.10.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") ?? "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? "";
const SMTP_FROM_EMAIL = Deno.env.get("SMTP_FROM_EMAIL") ?? "no-reply@pipsepaisa.com";
const SMTP_FROM_NAME = Deno.env.get("SMTP_FROM_NAME") ?? "PipSePaisa";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function esc(value: unknown): string {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function htmlMessage(name: string, message: string): string {
  const body = esc(message).replaceAll("\n", "<br>");
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827"><table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden"><tr><td style="background:#0b172a;padding:24px;text-align:center"><div style="font-size:27px;font-weight:900;color:#fff">Pip<span style="color:#f59e0b">Se</span>Paisa</div><div style="font-size:12px;color:#cbd5e1;margin-top:5px">Grow With Us</div></td></tr><tr><td style="padding:30px 28px"><p style="margin:0 0 18px;font-size:16px">Hi ${esc(name || "Trader")},</p><div style="font-size:15px;line-height:1.75;color:#374151">${body}</div><p style="margin:25px 0 0"><a href="https://www.pipsepaisa.com/" style="display:inline-block;background:#f59e0b;color:#111827;text-decoration:none;padding:13px 21px;border-radius:10px;font-weight:800">Open PipSePaisa</a></p></td></tr><tr><td style="padding:18px 28px;background:#fafafa;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.6">This is an automated email from PipSePaisa. Please do not reply.<br>© ${new Date().getFullYear()} PipSePaisa · www.pipsepaisa.com</td></tr></table></td></tr></table></body></html>`;
}

type RequestBody = { name?: string; audience?: "all" | "free" | "premium"; subject?: string; message?: string };
type Recipient = { id?: string; email?: string; full_name?: string; member_type?: string; is_premium?: boolean };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase server secrets are missing.");
    if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) throw new Error("SMTP secrets are missing.");

    const bearer = req.headers.get("authorization") ?? "";
    const token = bearer.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ ok: false, error: "Admin login is required." }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const userResult = await admin.auth.getUser(token);
    const user = userResult.data.user;
    if (userResult.error || !user) return json({ ok: false, error: "Admin session is invalid or expired." }, 401);

    const profileResult = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
    const profile = profileResult.data as Record<string, unknown> | null;
    const isAdmin = profile?.role === "admin" || profile?.is_admin === true || user.app_metadata?.role === "admin";
    if (!isAdmin) return json({ ok: false, error: "Only an administrator can send campaigns." }, 403);

    const input = await req.json() as RequestBody;
    const name = String(input.name ?? "Campaign").trim().slice(0, 120);
    const audience = ["all", "free", "premium"].includes(String(input.audience)) ? String(input.audience) as "all" | "free" | "premium" : "all";
    const subject = String(input.subject ?? "").trim().slice(0, 180);
    const message = String(input.message ?? "").trim().slice(0, 12000);
    if (!subject || !message) return json({ ok: false, error: "Subject and message are required." }, 400);

    let recipientsResult = await admin.from("profiles").select("id,email,full_name,member_type,is_premium").not("email", "is", null).limit(500);
    if (recipientsResult.error) {
      recipientsResult = await admin.from("profiles").select("id,email,full_name,member_type").not("email", "is", null).limit(500) as typeof recipientsResult;
    }
    if (recipientsResult.error) throw new Error(recipientsResult.error.message);

    let recipients = (recipientsResult.data ?? []) as Recipient[];
    recipients = recipients.filter((row) => {
      const email = String(row.email ?? "").trim();
      if (!email || !email.includes("@")) return false;
      const premium = row.is_premium === true || ["premium", "vip"].includes(String(row.member_type ?? "").toLowerCase());
      if (audience === "premium") return premium;
      if (audience === "free") return !premium;
      return true;
    });

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
    });

    let sent = 0;
    let failed = 0;
    const failures: string[] = [];
    for (let start = 0; start < recipients.length; start += 5) {
      const batch = recipients.slice(start, start + 5);
      const results = await Promise.allSettled(batch.map((recipient) => transporter.sendMail({
        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
        to: String(recipient.email),
        subject,
        text: `Hi ${recipient.full_name || "Trader"},\n\n${message}\n\nOpen PipSePaisa: https://www.pipsepaisa.com/`,
        html: htmlMessage(String(recipient.full_name ?? "Trader"), message),
      })));
      results.forEach((result, index) => {
        if (result.status === "fulfilled") sent += 1;
        else { failed += 1; if (failures.length < 10) failures.push(`${batch[index].email}: ${result.reason?.message ?? String(result.reason)}`); }
      });
    }
    transporter.close();

    await admin.from("email_campaigns").insert({
      name, audience, subject, message, sent_count: sent, failed_count: failed,
      status: failed && !sent ? "failed" : failed ? "partial" : "sent", created_by: user.id,
    });

    return json({ ok: true, recipients: recipients.length, sent, failed, failures });
  } catch (error) {
    console.error("send-campaign-email", error);
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
