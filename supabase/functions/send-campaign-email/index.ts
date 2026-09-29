import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.10.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") ?? "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? "";
const FROM_EMAIL = "no-reply@pipsepaisa.com";
const FROM_NAME = "PipSePaisa";
const SITE_URL = "https://www.pipsepaisa.com";
const CTA_URL = `${SITE_URL}/sajid-khan-ghori`;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-campaign-email`;
const BATCH_SIZE = 25;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function esc(v: unknown): string {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function lower(v: unknown): string { return String(v ?? "").trim().toLowerCase(); }
function validEmail(v: unknown): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? "").trim()); }
function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function requireAdmin(req: Request) {
  const bearer = req.headers.get("authorization") ?? "";
  const token = bearer.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Admin login is required.");
  const userResult = await admin.auth.getUser(token);
  const user = userResult.data.user;
  if (userResult.error || !user) throw new Error("Admin session is invalid or expired.");
  const profileResult = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const p = profileResult.data as Record<string, unknown> | null;
  const role = lower(p?.role ?? user.app_metadata?.role);
  const ok = role === "admin" || role === "super_admin" || role === "superadmin" || p?.is_admin === true;
  if (!ok) throw new Error("Only an administrator can send campaigns.");
  return user;
}

type AnyRow = Record<string, any>;

async function fetchPaged(table: string, select = "*"): Promise<AnyRow[]> {
  const out: AnyRow[] = [];
  const pageSize = 1000;
  for (let start = 0; start < 20000; start += pageSize) {
    const res = await admin.from(table).select(select).range(start, start + pageSize - 1);
    if (res.error) throw new Error(res.error.message);
    const rows = (res.data ?? []) as AnyRow[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

function enrollmentSegment(r: AnyRow): string {
  const saved = lower(r.psp_batch_key);
  if (saved === "basic_b1") return "sajid_b1";
  if (saved === "basic_b2") return "sajid_b2";
  if (saved === "basic_b3") return "sajid_b3";
  if (saved === "fundamental_b1") return "fund_b1";
  if (saved === "fundamental_b2") return "fund_b2";
  const explicit = lower(r.course_segment), key = lower(r.course_key), name = lower(r.course_name);
  const text = [explicit, key, name, lower(r.batch_key), lower(r.batch_name), lower(r.course_batch_key)].join(" ");
  if (/advance(?:d)?[\s_-]*fundamental/.test(text) || ["advance_fundamental","advance-fundamental","advanced_fundamental","advanced-fundamental"].includes(key)) return "advance_fund";
  if (/fundamental[\s_-]*(?:batch[\s_-]*)?2|fundamental_b2|fundamental-b2/.test(text)) return "fund_b2";
  if (/fundamental[\s_-]*(?:batch[\s_-]*)?1|fundamental_b1|fundamental-b1/.test(text)) return "fund_b1";
  if (/fundamental/.test(text)) return "fund_b1";
  if (/advanced forex|advance course/.test(text) || key === "advanced") return "advance";
  if (/basic[\s_-]*(?:batch[\s_-]*)?3|basic_b3|basic-b3|sajid.*(?:batch\s*3|b3)/.test(text)) return "sajid_b3";
  if (/basic[\s_-]*(?:batch[\s_-]*)?2|basic_b2|basic-b2|sajid.*(?:batch\s*2|b2)/.test(text)) return "sajid_b2";
  if (/basic[\s_-]*(?:batch[\s_-]*)?1|basic_b1|basic-b1|sajid.*(?:batch\s*1|b1)/.test(text)) return "sajid_b1";
  if (key === "basic" || /basic forex course|free technical course/.test(text)) {
    const created = Date.parse(String(r.created_at ?? ""));
    if (Number.isFinite(created)) return created < Date.parse("2026-09-01T00:00:00+08:00") ? "sajid_b1" : "sajid_b2";
    return "sajid_b2";
  }
  return "other";
}

async function resolveRecipients(audience: string, singleUserId?: string, singleEmail?: string): Promise<AnyRow[]> {
  const profiles = await fetchPaged("profiles", "*");
  const unsubRows = await fetchPaged("email_unsubscribes", "email").catch(() => [] as AnyRow[]);
  const unsub = new Set(unsubRows.map((x) => lower(x.email)).filter(Boolean));
  const byId = new Map(profiles.map((p) => [String(p.id), p]));
  let selected: AnyRow[] = [];

  if (audience === "single") {
    if (singleUserId && byId.has(singleUserId)) selected = [byId.get(singleUserId)!];
    else if (singleEmail) selected = profiles.filter((p) => lower(p.email) === lower(singleEmail));
  } else if (["sajid_b1","sajid_b2","sajid_b3","fund_b1","fund_b2","paid_students"].includes(audience)) {
    const enrollments = await fetchPaged("course_enrollments", "*");
    const ids = new Set<string>();
    for (const r of enrollments) {
      const seg = enrollmentSegment(r);
      const paid = lower(r.course_type) === "paid" || Number(r.price ?? 0) > 0 || ["advance","advance_fund"].includes(seg);
      if ((audience === "paid_students" && paid) || seg === audience) ids.add(String(r.user_id ?? ""));
    }
    selected = profiles.filter((p) => ids.has(String(p.id)));
  } else if (audience === "premium") {
    selected = profiles.filter((p) => p.is_premium === true || ["premium","vip"].includes(lower(p.member_type)));
  } else if (audience === "free") {
    selected = profiles.filter((p) => !(p.is_premium === true || ["premium","vip"].includes(lower(p.member_type))));
  } else {
    selected = profiles;
  }

  const seen = new Set<string>();
  return selected.filter((p) => {
    const email = lower(p.email);
    if (!validEmail(email) || unsub.has(email) || seen.has(email)) return false;
    seen.add(email);
    return true;
  }).map((p) => ({ id: p.id, email: String(p.email).trim(), full_name: p.full_name || p.name || "Trader", client_id: p.client_id || null }));
}

function trackingUrls(recipient: AnyRow, campaign: AnyRow, test = false) {
  if (test) return { cta: CTA_URL, unsubscribe: `${SITE_URL}/`, pixel: "" };
  const track = encodeURIComponent(String(recipient.tracking_token));
  const unsub = encodeURIComponent(String(recipient.unsubscribe_token));
  return {
    cta: `${FUNCTION_URL}?action=click&token=${track}`,
    unsubscribe: `${FUNCTION_URL}?action=unsubscribe&token=${unsub}`,
    pixel: `${FUNCTION_URL}?action=open&token=${track}`,
  };
}

function batch3Html(name: string, subject: string, urls: {cta:string;unsubscribe:string;pixel:string}, test = false): string {
  const greeting = name && lower(name) !== "trader" ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6b7280;margin-top:8px">Hi ${esc(name)},</div>` : "";
  const pixel = urls.pixel ? `<img src="${urls.pixel}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;opacity:0">` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table{border-collapse:collapse!important}img{border:0;outline:none;text-decoration:none;display:block}body{margin:0!important;padding:0!important;width:100%!important;background:#f3eee4}.mobileHero{display:none;max-height:0;overflow:hidden}
  @media(max-width:620px){.outer{padding:8px!important}.wrap{width:100%!important;max-width:100%!important}.desktopHero{display:none!important;max-height:0!important;overflow:hidden!important}.mobileHero{display:table-row!important;max-height:none!important;overflow:visible!important}.brand{font-size:18px!important}.badge{font-size:7.2px!important;padding:6px 7px!important;white-space:nowrap!important}.benefit{padding:10px 3px!important}.big{font-size:16px!important}.small{font-size:7px!important}.cta{display:block!important;width:100%!important;box-sizing:border-box!important;font-size:12.5px!important;padding:15px 7px!important;line-height:1.15!important;white-space:nowrap!important}.footerL,.footerR{display:block!important;width:100%!important;text-align:center!important}.footerR{padding-top:10px!important}}
  </style></head><body>${pixel}<div style="display:none;font-size:1px;color:#f3eee4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Sir Sajid Khan Ghori ka Free Technical Course — Batch 3 starts 28 September.</div>
  <table width="100%" role="presentation" cellpadding="0" cellspacing="0" style="background:#f3eee4"><tr><td class="outer" align="center" style="padding:20px 10px"><table class="wrap" width="600" role="presentation" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#fffdf8;border:1px solid #e7d7bf;border-radius:24px;overflow:hidden">
  <tr><td style="padding:16px 22px;border-bottom:1px solid #eadfce"><table width="100%" role="presentation"><tr><td><table role="presentation"><tr><td style="padding-right:10px"><img src="${SITE_URL}/icon-192.png" width="46" height="46" alt="PipSePaisa" style="border-radius:11px"></td><td><div class="brand" style="font-family:Arial,sans-serif;font-size:20px;font-weight:900;color:#0f172a">PipSePaisa</div><div style="font-family:Arial,sans-serif;font-size:8px;font-weight:900;letter-spacing:2px;color:#F39522;margin-top:4px">GROW WITH US</div></td></tr></table></td><td align="right"><span class="badge" style="display:inline-block;padding:8px 11px;border:1px solid #f3c77f;background:#fff1d7;border-radius:999px;font-family:Arial,sans-serif;font-size:9px;font-weight:900;color:#8a5208;white-space:nowrap">FREE COURSE • BATCH 3</span></td></tr></table></td></tr>
  <tr class="desktopHero"><td style="background:#fff4e4"><table width="100%" role="presentation"><tr><td width="55%" valign="middle" style="padding:31px 12px 30px 28px"><div style="font-family:Arial,sans-serif;font-size:10px;font-weight:900;letter-spacing:2px;color:#9a5b09">FREE TECHNICAL COURSE</div>${greeting}<div style="font-family:Arial,sans-serif;font-size:42px;line-height:1;font-weight:900;letter-spacing:-1.6px;color:#0f172a;margin-top:10px">Kya Aap Hamara<br>Pichla Batch<br><span style="color:#F39522">Miss Kar Gaye?</span></div><div style="font-family:Arial,sans-serif;font-size:18px;line-height:1.28;font-weight:800;color:#182230;margin-top:15px">Sir Sajid Khan Ghori<br><span style="font-weight:600">Free Technical Course — Batch 3</span><br><span style="display:inline-block;margin-top:6px;color:#F39522;font-size:13px;font-weight:900">Starts 28 September</span></div><div style="font-family:Arial,sans-serif;font-size:11px;color:#657182;margin-top:12px">4 Live Sessions • Practical Learning • Live Q&amp;A</div></td><td width="45%" valign="bottom" align="center" style="padding:6px 6px 0;background:#fff0d6"><img src="${SITE_URL}/sajid-email-batch3.png" width="270" alt="Sir Sajid Khan Ghori" style="width:270px;max-width:100%;height:auto;margin:0 auto"></td></tr></table></td></tr>
  <tr class="mobileHero"><td style="background:#fff6e8;padding:0"><table width="100%" role="presentation"><tr><td width="54%" valign="middle" style="padding:18px 5px 18px 17px"><span style="display:inline-block;background:#F39522;color:#fff;padding:6px 8px;border-radius:8px;font-family:Arial,sans-serif;font-size:8px;font-weight:900">FREE TECHNICAL COURSE</span>${greeting}<div style="font-family:Arial,sans-serif;font-size:25px;line-height:.98;font-weight:900;letter-spacing:-.9px;color:#0f172a;margin-top:11px">Kya Aap Hamara<br>Pichla Batch<br><span style="color:#F39522">Miss Kar Gaye?</span></div><div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.25;font-weight:800;color:#182230;margin-top:11px">Sir Sajid Khan Ghori<br><span style="font-weight:600">Free Technical Course — Batch 3</span><br><span style="display:inline-block;margin-top:5px;color:#F39522;font-size:10px;font-weight:900">Starts 28 September</span></div><div style="font-family:Arial,sans-serif;font-size:8.5px;color:#657182;margin-top:9px">4 Live Sessions • Practical • Live Q&amp;A</div></td><td width="46%" valign="bottom" align="center" style="padding:8px 4px 0;background:#fff0d4"><img src="${SITE_URL}/sajid-email-batch3.png" width="170" alt="Sir Sajid Khan Ghori" style="width:170px;max-width:100%;height:auto;margin:0 auto"></td></tr></table></td></tr>
  <tr><td style="padding:16px 22px 3px"><table width="100%" role="presentation" style="border:1px solid #ead7ba;border-radius:16px;overflow:hidden;background:#fffaf3"><tr>${[["04","LIVE SESSIONS"],["LIVE","PRACTICAL"],["Q&A","WITH SIR SAJID"],["FREE","RESERVE SEAT"]].map((x,i)=>`<td class="benefit" width="25%" align="center" style="padding:14px 6px;${i<3?'border-right:1px solid #ead7ba;':''}"><div class="big" style="font-family:Arial,sans-serif;font-size:19px;font-weight:900;color:#F39522">${x[0]}</div><div class="small" style="font-family:Arial,sans-serif;font-size:9px;font-weight:900;color:#101827;margin-top:3px">${x[1]}</div></td>`).join("")}</tr></table></td></tr>
  <tr><td align="center" style="padding:16px 22px 10px"><a class="cta" href="${urls.cta}" style="display:inline-block;padding:16px 34px;border-radius:13px;background:#F39522;color:#111;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:900;white-space:nowrap">GET MY FREE ZOOM LINK →</a></td></tr>
  <tr><td><div style="margin:0 22px 14px;padding:10px 12px;border-radius:12px;background:#fff5e6;border:1px solid #f3d9ad;font-family:Arial,sans-serif;font-size:10px;color:#626d79;text-align:center">Zoom link aur class updates registration ke baad aapke WhatsApp par share ki jayengi.</div></td></tr>
  <tr><td style="padding:18px 22px;background:#0d1518"><table width="100%" role="presentation"><tr><td class="footerL" width="60%"><div style="font-family:Arial,sans-serif;font-size:16px;font-weight:900;color:#fff">PipSePaisa</div><div style="font-family:Arial,sans-serif;font-size:8px;font-weight:900;letter-spacing:1.8px;color:#F39522;margin-top:4px">GROW WITH US</div></td><td class="footerR" width="40%" align="right" style="font-family:Arial,sans-serif;font-size:10px;line-height:1.8;color:#d3d9dd"><a href="${SITE_URL}/" style="color:#fff;text-decoration:underline">pipsepaisa.com</a><br><a href="${urls.unsubscribe}" style="color:#d3d9dd;text-decoration:underline">Unsubscribe</a></td></tr></table><div style="font-family:Arial,sans-serif;font-size:8.5px;line-height:1.5;text-align:center;color:#7f8a91;margin-top:13px">${test?"TEST EMAIL • ":""}You are receiving this email because you registered with PipSePaisa.<br>© 2026 PipSePaisa • ${FROM_EMAIL}</div></td></tr>
  </table></td></tr></table></body></html>`;
}

function transporter() {
  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) throw new Error("SMTP secrets are missing. Use the same SMTP secrets already used by send-course-email.");
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    requireTLS: SMTP_PORT === 587,
    auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    tls: { servername: SMTP_HOST, rejectUnauthorized: true },
  });
}

async function sendOne(t: any, to: string, name: string, subject: string, urls: any, test = false) {
  return await t.sendMail({
    from: { name: FROM_NAME, address: FROM_EMAIL },
    to,
    subject,
    text: `Hi ${name || "Trader"},\n\nKya aap hamara pichla batch miss kar gaye? Sir Sajid Khan Ghori ka Free Technical Course — Batch 3 starts 28 September.\n\n4 Live Sessions • Practical Learning • Live Q&A • 100% Free\n\nGet My Free Zoom Link: ${test ? CTA_URL : urls.cta}\n\nPipSePaisa — Grow With Us`,
    html: batch3Html(name || "Trader", subject, urls, test),
  });
}

async function publicGet(req: Request): Promise<Response> {
  const u = new URL(req.url);
  const action = u.searchParams.get("action") || "";
  const token = u.searchParams.get("token") || "";
  if (!token || !["open","click","unsubscribe"].includes(action)) return new Response("Not found", { status: 404 });
  if (action === "open") {
    const r = await admin.from("email_campaign_recipients").select("id,opened_at").eq("tracking_token", token).maybeSingle();
    if (r.data?.id && !r.data.opened_at) await admin.from("email_campaign_recipients").update({ opened_at: new Date().toISOString() }).eq("id", r.data.id);
    const gif = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="), c => c.charCodeAt(0));
    return new Response(gif, { headers: { "Content-Type":"image/gif", "Cache-Control":"no-store, no-cache, must-revalidate" } });
  }
  if (action === "click") {
    const r = await admin.from("email_campaign_recipients").select("id,campaign_id,clicked_at").eq("tracking_token", token).maybeSingle();
    let target = CTA_URL;
    if (r.data?.id) {
      if (!r.data.clicked_at) await admin.from("email_campaign_recipients").update({ clicked_at: new Date().toISOString() }).eq("id", r.data.id);
      const c = await admin.from("email_campaigns").select("cta_url").eq("id", r.data.campaign_id).maybeSingle();
      target = String(c.data?.cta_url || CTA_URL);
    }
    return Response.redirect(target, 302);
  }
  const r = await admin.from("email_campaign_recipients").select("id,user_id,email,campaign_id,unsubscribe_token").eq("unsubscribe_token", token).maybeSingle();
  if (r.data?.email) {
    await admin.from("email_unsubscribes").upsert({ email: lower(r.data.email), user_id: r.data.user_id || null, source_campaign_id: r.data.campaign_id || null, reason: "user_unsubscribe", created_at: new Date().toISOString() }, { onConflict: "email" });
    await admin.from("email_campaign_recipients").update({ unsubscribed_at: new Date().toISOString() }).eq("id", r.data.id);
  }
  return new Response(`<!doctype html><html><body style="font-family:Arial;background:#f5efe4;margin:0;padding:40px"><div style="max-width:520px;margin:auto;background:white;border-radius:18px;padding:30px;text-align:center"><h2 style="margin:0 0 10px">You’re unsubscribed</h2><p style="color:#667085">You will no longer receive PipSePaisa promotional emails at this address.</p><a href="${SITE_URL}" style="color:#F39522">Return to PipSePaisa</a></div></body></html>`, { headers: { "Content-Type":"text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method === "GET") return await publicGet(req);
  if (req.method !== "POST") return json({ ok:false, error:"Method not allowed." }, 405);
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase server secrets are missing.");
    const user = await requireAdmin(req);
    const input = await req.json() as AnyRow;
    const action = String(input.action || "");

    if (action === "send_test") {
      const email = String(input.email || "").trim();
      if (!validEmail(email)) return json({ ok:false, error:"Enter a valid test email." }, 400);
      const subject = String(input.subject || "Kya Aap Hamara Pichla Batch Miss Kar Gaye?").trim().slice(0,180);
      const t = transporter();
      await sendOne(t, email, String(input.name || "Trader"), subject, trackingUrls({}, {}, true), true);
      t.close();
      return json({ ok:true, sent:1, sender:FROM_EMAIL });
    }

    if (action === "count") {
      const audience = String(input.audience || "all");
      const rows = await resolveRecipients(audience, input.single_user_id, input.single_email);
      return json({ ok:true, count:rows.length });
    }

    if (action === "create_campaign") {
      const audience = String(input.audience || "all");
      const name = String(input.name || "Batch 3 Campaign").trim().slice(0,120);
      const subject = String(input.subject || "Kya Aap Hamara Pichla Batch Miss Kar Gaye?").trim().slice(0,180);
      if (!subject) return json({ ok:false, error:"Subject is required." }, 400);
      const recipients = await resolveRecipients(audience, input.single_user_id, input.single_email);
      if (!recipients.length) return json({ ok:false, error:"No eligible recipients found for this audience." }, 400);
      const c = await admin.from("email_campaigns").insert({
        name, audience, subject, message:"batch3_free_course", template_key:"batch3_free_course", cta_url:CTA_URL,
        sender_email:FROM_EMAIL, status:"queued", total_count:recipients.length,
        sent_count:0, failed_count:0, created_by:user.id,
      }).select("*").single();
      if (c.error) throw new Error(c.error.message);
      const campaignId = c.data.id;
      for (let i = 0; i < recipients.length; i += 500) {
        const chunk = recipients.slice(i, i + 500).map((r) => ({
          campaign_id:campaignId, user_id:r.id || null, email:lower(r.email), full_name:r.full_name || "Trader",
          client_id:r.client_id || null, status:"pending", tracking_token:crypto.randomUUID(), unsubscribe_token:crypto.randomUUID(),
        }));
        const ins = await admin.from("email_campaign_recipients").insert(chunk);
        if (ins.error) throw new Error(ins.error.message);
      }
      return json({ ok:true, campaign_id:campaignId, total:recipients.length });
    }

    if (action === "send_batch") {
      const campaignId = String(input.campaign_id || "");
      if (!campaignId) return json({ ok:false, error:"campaign_id is required." }, 400);
      const campaignRes = await admin.from("email_campaigns").select("*").eq("id", campaignId).single();
      if (campaignRes.error || !campaignRes.data) throw new Error(campaignRes.error?.message || "Campaign not found.");
      const campaign = campaignRes.data as AnyRow;
      await admin.from("email_campaigns").update({ status:"sending", started_at:campaign.started_at || new Date().toISOString() }).eq("id", campaignId);
      const pendingRes = await admin.from("email_campaign_recipients").select("*").eq("campaign_id", campaignId).eq("status","pending").order("created_at",{ascending:true}).limit(BATCH_SIZE);
      if (pendingRes.error) throw new Error(pendingRes.error.message);
      const rows = (pendingRes.data ?? []) as AnyRow[];
      if (rows.length) {
        const t = transporter();
        for (let i=0;i<rows.length;i+=5) {
          const group=rows.slice(i,i+5);
          const results=await Promise.allSettled(group.map((r)=>sendOne(t,String(r.email),String(r.full_name||"Trader"),String(campaign.subject),trackingUrls(r,campaign,false),false)));
          for (let j=0;j<results.length;j++) {
            const r=group[j], result=results[j];
            if (result.status === "fulfilled") await admin.from("email_campaign_recipients").update({status:"sent",sent_at:new Date().toISOString(),error:null}).eq("id",r.id);
            else await admin.from("email_campaign_recipients").update({status:"failed",error:String((result as PromiseRejectedResult).reason?.message || (result as PromiseRejectedResult).reason || "Send failed").slice(0,800)}).eq("id",r.id);
          }
          if (i+5<rows.length) await sleep(350);
        }
        t.close();
      }
      const [sentQ, failedQ, pendingQ] = await Promise.all([
        admin.from("email_campaign_recipients").select("id",{count:"exact",head:true}).eq("campaign_id",campaignId).eq("status","sent"),
        admin.from("email_campaign_recipients").select("id",{count:"exact",head:true}).eq("campaign_id",campaignId).eq("status","failed"),
        admin.from("email_campaign_recipients").select("id",{count:"exact",head:true}).eq("campaign_id",campaignId).eq("status","pending"),
      ]);
      const sent=sentQ.count||0, failed=failedQ.count||0, remaining=pendingQ.count||0;
      const status = remaining ? "sending" : (failed && !sent ? "failed" : failed ? "partial" : "sent");
      await admin.from("email_campaigns").update({sent_count:sent,failed_count:failed,status,completed_at:remaining?null:new Date().toISOString()}).eq("id",campaignId);
      return json({ok:true,campaign_id:campaignId,sent,failed,remaining,status,processed:rows.length});
    }

    return json({ ok:false, error:"Unknown action." }, 400);
  } catch (error) {
    console.error("send-campaign-email", error);
    const message = error instanceof Error ? error.message : String(error);
    const status = /Admin|session|administrator/i.test(message) ? 401 : 500;
    return json({ ok:false, error:message }, status);
  }
});
