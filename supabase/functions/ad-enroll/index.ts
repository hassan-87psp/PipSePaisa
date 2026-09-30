import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.10.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") ?? "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? "";
const SMTP_FROM_EMAIL = Deno.env.get("SMTP_FROM_EMAIL") ?? "no-reply@pipsepaisa.com";
const SMTP_FROM_NAME = Deno.env.get("SMTP_FROM_NAME") ?? "PipSePaisa";
const SITE_URL = "https://pipsepaisa.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AdBody = {
  action?: string; event_type?: string; visitor_id?: string; source_path?: string;
  name?: string; email?: string; whatsapp?: string; course?: string; company?: string;
  opened_at?: number; utm_source?: string; utm_medium?: string; utm_campaign?: string;
  utm_content?: string; fbclid?: string;
};

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function clean(value: unknown, max = 180) { return String(value ?? "").trim().slice(0, max); }
function cleanPhone(value: unknown) { return String(value ?? "").replace(/[^0-9+]/g, "").slice(0, 24); }
function digits(value: unknown) { return String(value ?? "").replace(/\D/g, ""); }
function validEmail(value: string) { return /^\S+@\S+\.\S+$/.test(value); }
function esc(value: unknown) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function tempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(16); crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function credentialsEmailHtml(name: string, email: string, course: string, clientId: string, password: string, recoveryLink: string) {
  const passwordHelp = password
    ? "Use these details to sign in to your PipSePaisa account. If you want, you can change your password after login."
    : "Your existing PipSePaisa password has not been changed. Sign in with your current password, or use the Change Password link if needed.";
  return `<!doctype html><html><body style="margin:0;background:#f5f2eb;font-family:Arial,Helvetica,sans-serif;color:#171717"><table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border:1px solid #e8e1d6;border-radius:18px;overflow:hidden"><tr><td style="background:#111827;padding:25px;text-align:center"><div style="font-size:28px;font-weight:900;color:#fff">Pip<span style="color:#f39522">Se</span>Paisa</div><div style="font-size:12px;color:#cbd5e1;margin-top:5px;letter-spacing:.12em">GROW WITH US</div></td></tr><tr><td style="padding:30px 28px"><h1 style="font-size:23px;margin:0 0 10px">Welcome to PipSePaisa</h1><p style="font-size:15px;line-height:1.7;margin:0 0 18px">Hello <strong>${esc(name || "Trader")}</strong>, your account and free-course enrollment are ready.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:#fff9ef;border:1px solid #f7d7aa;border-radius:12px;overflow:hidden"><tr><td style="padding:12px 15px;color:#6b7280">Name</td><td style="padding:12px 15px;font-weight:700">${esc(name)}</td></tr><tr><td style="padding:12px 15px;color:#6b7280;border-top:1px solid #f4e6d4">Email</td><td style="padding:12px 15px;font-weight:700;border-top:1px solid #f4e6d4">${esc(email)}</td></tr><tr><td style="padding:12px 15px;color:#6b7280;border-top:1px solid #f4e6d4">Password</td><td style="padding:12px 15px;font-weight:800;border-top:1px solid #f4e6d4">${password ? esc(password) : "Existing password unchanged"}</td></tr><tr><td style="padding:12px 15px;color:#6b7280;border-top:1px solid #f4e6d4">Client ID</td><td style="padding:12px 15px;font-weight:800;border-top:1px solid #f4e6d4">${esc(clientId || "Pending")}</td></tr><tr><td style="padding:12px 15px;color:#6b7280;border-top:1px solid #f4e6d4">Course</td><td style="padding:12px 15px;font-weight:700;border-top:1px solid #f4e6d4">${esc(course)}</td></tr></table><p style="font-size:14px;line-height:1.65;color:#4b5563">${esc(passwordHelp)}</p><p style="margin:24px 0 8px"><a href="${SITE_URL}/sign-in" style="display:inline-block;background:#f39522;color:#151515;text-decoration:none;padding:14px 22px;border-radius:11px;font-weight:900;margin-right:8px">Sign In</a><a href="${esc(recoveryLink)}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:14px 22px;border-radius:11px;font-weight:900">Change Password</a></p><p style="font-size:12px;color:#6b7280;line-height:1.6">Keep your login details private. PipSePaisa Team will never ask you to share your password in chat or WhatsApp.</p></td></tr><tr><td style="padding:18px 28px;background:#faf9f7;border-top:1px solid #eee7de;color:#6b7280;font-size:12px">This is an automated account email from PipSePaisa.</td></tr></table></td></tr></table></body></html>`;
}

function teamDisplayName(value: unknown) {
  const raw = clean(value, 120);
  const key = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (key.includes("samiya")) return "Ms Samiya FX";
  if (key.includes("amal")) return "Ms Amal FX";
  if (key.includes("memona") || key.includes("mamoona") || key.includes("memoona")) return "Ms Memoona";
  return raw;
}

async function findUserId(admin: ReturnType<typeof createClient>, email: string): Promise<string> {
  const profile = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (!profile.error && profile.data?.id) return String(profile.data.id);

  const lookup = await admin.rpc("psp_service_auth_user_id_by_email_v320", { p_email: email });
  if (!lookup.error && lookup.data) return String(lookup.data);
  return "";
}

async function ensureProfile(admin: ReturnType<typeof createClient>, userId: string, name: string, email: string, whatsapp: string): Promise<string> {
  const prepared = await admin.from("profiles")
    .upsert({ id: userId, full_name: name, email, whatsapp }, { onConflict: "id" })
    .select("client_id")
    .single();
  if (prepared.error) throw new Error(`Profile could not be prepared: ${prepared.error.message}`);
  return clean(prepared.data?.client_id, 80);
}

async function sendCredentialsEmail(admin: ReturnType<typeof createClient>, name: string, email: string, course: string, clientId: string, password: string) {
  let recoveryLink = `${SITE_URL}/reset-password.html`;
  try {
    const link = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: `${SITE_URL}/reset-password.html?source=ad` } });
    if (!link.error && link.data?.properties?.action_link) recoveryLink = link.data.properties.action_link;
  } catch (_) { /* fallback */ }

  if (SMTP_HOST && SMTP_USERNAME && SMTP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, requireTLS: SMTP_PORT === 587, auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD }, connectionTimeout: 12000, greetingTimeout: 12000, socketTimeout: 22000 });
      await transporter.sendMail({
        from: { name: SMTP_FROM_NAME, address: SMTP_FROM_EMAIL },
        to: email,
        subject: "Welcome to PipSePaisa — Your Account Login Details",
        html: credentialsEmailHtml(name, email, course, clientId, password, recoveryLink),
      });
      transporter.close();
      return true;
    } catch (error) { console.error("ad-enroll credentials email", error); }
  }

  // Fallback: at least send a secure reset/setup email through Supabase Auth.
  if (ANON_KEY) {
    try {
      const publicClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      const reset = await publicClient.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/reset-password.html?source=ad` });
      return !reset.error;
    } catch (_) { /* no-op */ }
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Only POST is allowed." }, 405);

  try {
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase server configuration is missing.");
    const body = await req.json() as AdBody;
    if (clean(body.company)) return json({ ok: true });

    const action = clean(body.action, 24).toLowerCase();
    const course = clean(body.course, 32).toLowerCase();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const runtimeWait = (globalThis as any).EdgeRuntime;
    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "";
    const ipHash = forwarded ? await sha256(`${forwarded}|pipsepaisa-ad-v263`) : "";

    if (action === "track") {
      const eventType = clean(body.event_type, 32).toLowerCase();
      if (!["technical", "fundamental"].includes(course)) return json({ ok: false, error: "Invalid course link." }, 400);
      if (!["click", "form_open"].includes(eventType)) return json({ ok: false, error: "Invalid tracking event." }, 400);
      await admin.from("psp_ad_events_v261").insert({
        course_code: course, event_type: eventType, visitor_id: clean(body.visitor_id, 120) || null,
        utm_source: clean(body.utm_source,160) || null, utm_medium: clean(body.utm_medium,160) || null,
        utm_campaign: clean(body.utm_campaign,240) || null, utm_content: clean(body.utm_content,240) || null,
        fbclid: clean(body.fbclid,260) || null, ip_hash: ipHash || null
      });
      return json({ ok: true });
    }

    const name = clean(body.name, 120);
    const email = clean(body.email, 180).toLowerCase();
    const whatsapp = cleanPhone(body.whatsapp);
    if (name.length < 2) return json({ ok: false, error: "Please enter your full name." }, 400);
    if (!validEmail(email)) return json({ ok: false, error: "Please enter a valid email." }, 400);
    if (digits(whatsapp).length < 8) return json({ ok: false, error: "Please enter your active WhatsApp number with country code." }, 400);
    if (!["technical", "fundamental"].includes(course)) return json({ ok: false, error: "Invalid course link." }, 400);
    if (body.opened_at && Date.now() - Number(body.opened_at) < 650) return json({ ok: false, error: "Please try again." }, 429);

    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const rate = await admin.from("psp_ad_submissions_v259").select("id", { count: "exact", head: true }).ilike("email", email).gte("created_at", since);
    if (!rate.error && (rate.count ?? 0) >= 4) return json({ ok: false, error: "Too many requests. Please wait a few minutes and try again." }, 429);

    const formEventTask = admin.from("psp_ad_events_v261").insert({
      course_code: course, event_type: "form_submit", visitor_id: clean(body.visitor_id,120) || null,
      utm_source: clean(body.utm_source,160) || null, utm_medium: clean(body.utm_medium,160) || null,
      utm_campaign: clean(body.utm_campaign,240) || null, utm_content: clean(body.utm_content,240) || null,
      fbclid: clean(body.fbclid,260) || null, ip_hash: ipHash || null
    }).then(({ error }) => { if (error) console.error("ad-enroll form event", error); });
    if (runtimeWait?.waitUntil) runtimeWait.waitUntil(formEventTask);
    else await formEventTask;

    let userId = await findUserId(admin, email);
    let created = false;
    let accountPassword = "";
    if (!userId) {
      accountPassword = tempPassword();
      const createdUser = await admin.auth.admin.createUser({ email, password: accountPassword, email_confirm: true, user_metadata: { full_name: name, whatsapp, phone: whatsapp, source: "ad_link", ad_course: course } });
      if (createdUser.error || !createdUser.data.user?.id) throw new Error(createdUser.error?.message || "Account could not be created.");
      userId = createdUser.data.user.id;
      created = true;
    }

    const existingAdTask = admin.from("psp_ad_submissions_v259")
      .select("id,enrollment_id,course_name,client_id,team_member_id,team_member_name,team_member_whatsapp")
      .eq("user_id", userId).eq("course_code", course).order("created_at", { ascending: true }).limit(1).maybeSingle();
    const [profileClientId, existingAd] = await Promise.all([
      ensureProfile(admin, userId, name, email, whatsapp),
      existingAdTask,
    ]);
    let result: any = existingAd.data ? {
      submission_id: existingAd.data.id, enrollment_id: existingAd.data.enrollment_id, course_name: existingAd.data.course_name, client_id: existingAd.data.client_id,
      team_member_id: existingAd.data.team_member_id, team_member_name: existingAd.data.team_member_name, team_member_whatsapp: existingAd.data.team_member_whatsapp,
    } : {};
    if (!existingAd.data) {
      const rpc = await admin.rpc("psp_ad_complete_enrollment_v259", {
        p_user_id: userId, p_full_name: name, p_email: email, p_whatsapp: whatsapp, p_course_code: course,
        p_utm_source: clean(body.utm_source, 160) || null, p_utm_medium: clean(body.utm_medium, 160) || null,
        p_utm_campaign: clean(body.utm_campaign, 240) || null, p_utm_content: clean(body.utm_content, 240) || null,
        p_fbclid: clean(body.fbclid, 260) || null, p_ip_hash: ipHash || null,
      });
      if (rpc.error) throw new Error(rpc.error.message);
      result = Array.isArray(rpc.data) ? (rpc.data[0] ?? {}) : (rpc.data ?? {});
    }

    // Fresh submissions are already enrolled by psp_ad_complete_enrollment_v259.
    // Only an existing/re-submitted Ad lead needs an explicit current-batch repair.
    let ensuredEnrollmentId = result.enrollment_id ?? null;
    if (existingAd.data) {
      const ensured = await admin.rpc("psp_ad_ensure_enrollment_v268", {
        p_user_id: userId,
        p_full_name: name,
        p_email: email,
        p_whatsapp: whatsapp,
        p_course_code: course,
      });
      if (ensured.error) throw new Error(ensured.error.message);
      ensuredEnrollmentId = Array.isArray(ensured.data) ? ensured.data[0] : ensured.data;
      if (ensuredEnrollmentId) result.enrollment_id = ensuredEnrollmentId;
    }

    const teamName = teamDisplayName(result.team_member_name);
    const teamWhatsapp = digits(result.team_member_whatsapp);
    const clientId = clean(result.client_id, 80) || profileClientId || "Pending";
    const courseName = course === "technical" ? "Sir Sajid Khan Ghori Free Course — Batch 3" : "Sir Malik Ghulam Abbas Free Course — Batch 2";

    const submissionId = clean(result.submission_id, 80);
    const whatsappRouted = teamWhatsapp.length >= 8;
    if (submissionId) {
      const submissionPatch: Record<string, unknown> = {
        account_created: created,
        whatsapp_routed: whatsappRouted,
        source_path: clean(body.source_path,260) || null,
        course_name: courseName,
      };
      if (ensuredEnrollmentId) submissionPatch.enrollment_id = ensuredEnrollmentId;
      await admin.from("psp_ad_submissions_v259").update(submissionPatch).eq("id", submissionId);
    }

    let credentialsEmailSent = false;
    let credentialsEmailQueued = false;
    const emailTask = sendCredentialsEmail(admin, name, email, courseName, clientId, accountPassword).then(async (ok) => {
      credentialsEmailSent = ok;
      if (submissionId) await admin.from("psp_ad_submissions_v259").update({ credentials_email_sent: ok }).eq("id", submissionId);
      return ok;
    });
    const edgeRuntime = (globalThis as any).EdgeRuntime;
    if (edgeRuntime?.waitUntil) { edgeRuntime.waitUntil(emailTask); credentialsEmailQueued = true; }
    else { credentialsEmailSent = await Promise.race([emailTask, new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1800))]); credentialsEmailQueued = !credentialsEmailSent; }

    const enrollmentMessage = course === "technical"
      ? `I have enrolled in Sir Sajid’s Batch 3 (Client ID ${clientId}). Kindly verify and share next steps.`
      : `I have enrolled in Sir Malik Ghulam Abbas’s Batch 2 (Client ID ${clientId}). Kindly verify and share next steps.`;
    const message = teamName
      ? `Hello ${teamName}, ${enrollmentMessage}`
      : `Hello PipSePaisa Team, ${enrollmentMessage}`;
    const whatsappUrl = whatsappRouted ? `https://wa.me/${teamWhatsapp}?text=${encodeURIComponent(message)}` : "";

    return json({ ok: true, account_created: created, enrollment_id: result.enrollment_id ?? null, course_name: courseName, client_id: clientId, team_member_name: teamName, team_whatsapp: teamWhatsapp, whatsapp_url: whatsappUrl, whatsapp_message: message, credentials_email_sent: credentialsEmailSent, credentials_email_queued: credentialsEmailQueued });
  } catch (error) {
    console.error("ad-enroll", error);
    const message = error instanceof Error ? error.message : String(error);
    return json({ ok: false, error: message }, 500);
  }
});
