import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.10.1";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") ?? "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? "";
const SMTP_FROM_EMAIL = Deno.env.get("SMTP_FROM_EMAIL") ?? "no-reply@pipsepaisa.com";
const SMTP_FROM_NAME = Deno.env.get("SMTP_FROM_NAME") ?? "PipSePaisa";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

function firstString(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["default", "api_key", "key", "value"]) {
      const found = firstString(record[key]);
      if (found) return found;
    }
    for (const item of Object.values(record)) {
      const found = firstString(item);
      if (found) return found;
    }
  }
  return "";
}

function readJsonEnv(envName: string): string {
  const raw = Deno.env.get(envName);
  if (!raw) return "";
  try {
    return firstString(JSON.parse(raw));
  } catch {
    return raw.trim();
  }
}

const SUPABASE_SECRET_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_SECRET_KEY") ||
  readJsonEnv("SUPABASE_SECRET_KEYS");

const SUPABASE_PUBLISHABLE_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ||
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
  readJsonEnv("SUPABASE_PUBLISHABLE_KEYS");

const SITE_URL = "https://www.pipsepaisa.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EmailType =
  | "free_course_enrolled"
  | "payment_receipt_received"
  | "payment_received"
  | "payment_approved"
  | "payment_rejected"
  | "payment_revoked"
  | "pin_access_welcome";

type Body = {
  type: EmailType;
  user_name?: string;
  user_email?: string;
  target_email?: string;
  course_title?: string;
  amount?: string | number;
  payment_method?: string;
  transaction_id?: string;
  rejection_reason?: string;
  target_user_id?: string;
  enrollment_id?: string;
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function response(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function actionButton(label: string, url: string): string {
  return `<p style="margin:27px 0 8px"><a href="${esc(url)}" style="display:inline-block;background:#f59e0b;color:#111827;text-decoration:none;padding:14px 23px;border-radius:10px;font-size:15px;font-weight:800">${esc(label)}</a></p>`;
}

function layout(title: string, content: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827"><table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 12px;background:#f3f4f6"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border-radius:17px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 14px 42px rgba(15,23,42,.08)"><tr><td style="background:#0b172a;padding:25px;text-align:center"><div style="font-size:26px;font-weight:900;color:#fff">Pip<span style="color:#f59e0b">Se</span>Paisa</div><div style="font-size:12px;color:#cbd5e1;margin-top:5px">Grow With Us</div></td></tr><tr><td style="padding:32px 28px"><h1 style="font-size:24px;line-height:1.3;margin:0 0 18px;color:#111827">${esc(title)}</h1>${content}</td></tr><tr><td style="padding:19px 28px;background:#fafafa;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.65">This is an automated email from PipSePaisa. Please do not reply.<br>© ${new Date().getFullYear()} PipSePaisa · www.pipsepaisa.com</td></tr></table></td></tr></table></body></html>`;
}

function detailTable(amount: string, method: string, transaction: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:21px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:11px;overflow:hidden"><tr><td style="padding:12px 15px;color:#6b7280;border-bottom:1px solid #e5e7eb">Amount</td><td style="padding:12px 15px;font-weight:700;border-bottom:1px solid #e5e7eb">${amount}</td></tr><tr><td style="padding:12px 15px;color:#6b7280;border-bottom:1px solid #e5e7eb">Payment Method</td><td style="padding:12px 15px;font-weight:700;border-bottom:1px solid #e5e7eb">${method}</td></tr><tr><td style="padding:12px 15px;color:#6b7280;border-bottom:1px solid #e5e7eb">Transaction ID</td><td style="padding:12px 15px;font-weight:700;border-bottom:1px solid #e5e7eb">${transaction}</td></tr><tr><td style="padding:12px 15px;color:#6b7280">Status</td><td style="padding:12px 15px;font-weight:700;color:#d97706">Under Review</td></tr></table>`;
}

function formatDeadline(value: unknown): string {
  if (!value) return "the deadline displayed in your Settings";
  try {
    return new Date(String(value)).toLocaleString("en-GB", {
      timeZone: "Asia/Karachi",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " (Pakistan time)";
  } catch {
    return "the deadline displayed in your Settings";
  }
}

function buildEmail(body: Body, extra: Record<string, unknown> = {}) {
  const name = esc(body.user_name || "Student");
  const course = esc(body.course_title || "PipSePaisa Forex Course");
  const amount = esc(body.amount || "Not provided");
  const method = esc(body.payment_method || "Not provided");
  const transaction = esc(body.transaction_id || "Not provided");
  const reason = esc(body.rejection_reason || "The submitted payment receipt could not be verified.");
  const type = body.type === "payment_received" ? "payment_receipt_received" : body.type;

  if (type === "free_course_enrolled") {
    return {
      subject: `Enrollment Successful — ${course}`,
      html: layout("Course Enrollment Successful", `<p style="font-size:16px;line-height:1.7;margin:0 0 14px">Hi <strong>${name}</strong>,</p><p style="font-size:15px;line-height:1.7;color:#374151">Your enrollment in <strong>${course}</strong> has been completed successfully.</p><div style="padding:16px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;color:#065f46"><strong>✓ Enrollment confirmed</strong><br><strong>✓ Course access active</strong><br>You can open the course modules from your account.</div>${actionButton("Open My Course", `${SITE_URL}/?open=basic`)}`),
    };
  }

  if (type === "payment_receipt_received") {
    return {
      subject: "Payment Receipt Received — Under Review",
      html: layout("Payment Receipt Received", `<p style="font-size:16px;line-height:1.7;margin:0 0 14px">Hi <strong>${name}</strong>,</p><p style="font-size:15px;line-height:1.7;color:#374151">We have received your payment receipt for <strong>${course}</strong>.</p>${detailTable(amount, method, transaction)}<div style="padding:16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;color:#9a3412"><strong>Your payment receipt is under review.</strong><br>Your paid course remains locked until an admin approves the receipt.</div>${actionButton("View Payment Status", `${SITE_URL}/?open=advanced`)}`),
    };
  }

  if (type === "payment_approved") {
    return {
      subject: "Payment Approved — Course Unlocked",
      html: layout("Payment Approved — Course Unlocked", `<p style="font-size:16px;line-height:1.7;margin:0 0 14px">Hi <strong>${name}</strong>,</p><p style="font-size:15px;line-height:1.7;color:#374151">Your payment receipt for <strong>${course}</strong> has been verified and approved.</p><div style="padding:17px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;color:#065f46"><strong>✓ Payment approved</strong><br><strong>✓ Course enrollment active</strong><br><strong>✓ Course modules unlocked</strong></div>${actionButton("Open My Course", `${SITE_URL}/?open=advanced`)}<p style="font-size:13px;line-height:1.6;color:#6b7280">Sign in using the same email address used for the payment receipt.</p>`),
    };
  }

  if (type === "payment_rejected" || type === "payment_revoked") {
    const revoked = type === "payment_revoked";
    return {
      subject: revoked ? "Course Access Revoked — Payment Review Required" : "Payment Receipt Verification Required",
      html: layout(revoked ? "Course Access Revoked" : "Payment Receipt Could Not Be Verified", `<p style="font-size:16px;line-height:1.7;margin:0 0 14px">Hi <strong>${name}</strong>,</p><p style="font-size:15px;line-height:1.7;color:#374151">${revoked ? `Your previously approved access to <strong>${course}</strong> has been revoked for review.` : `We could not verify your submitted payment receipt for <strong>${course}</strong>.`}</p><div style="padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#991b1b"><strong>Reason:</strong><br>${reason}</div><p style="font-size:15px;line-height:1.7;color:#374151">Your course is locked. Please contact the admin or submit a corrected payment receipt.</p>${actionButton("Open My Courses", `${SITE_URL}/?open=advanced`)}`),
    };
  }

  const whatsapp = String(extra.admin_whatsapp || "601156961157").replace(/\D/g, "");
  const deadline = formatDeadline(extra.grace_expires_at);
  const graceLabel = esc(extra.grace_label || "48 hours");
  return {
    subject: "Your Free PipSePaisa Access PIN Instructions",
    html: layout("Activate Your Free Access PIN", `<p style="font-size:16px;line-height:1.7;margin:0 0 14px">Hi <strong>${name}</strong>,</p><p style="font-size:15px;line-height:1.7;color:#374151">Your PipSePaisa account has been verified successfully.</p><div style="padding:16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;color:#9a3412"><strong>Your access PIN is completely free.</strong><br>Contact the PipSePaisa admin on WhatsApp, receive your unique PIN, and add it in <strong>Settings → Free Access PIN</strong>.</div><p style="font-size:15px;line-height:1.7;color:#374151">You have <strong>${graceLabel}</strong> to add the PIN. Your current deadline is <strong>${esc(deadline)}</strong>. After the deadline, Signals, Charts, Articles, Journal and other protected features will remain visible but locked until the PIN is activated.</p>${actionButton("Contact Admin — Get Free PIN", `https://wa.me/${whatsapp}`)}${actionButton("Open PipSePaisa Settings", `${SITE_URL}/?open=settings`)}`),
  };
}

function validateConfig() {
  const missing = [
    ["SMTP_HOST", SMTP_HOST],
    ["SMTP_USERNAME", SMTP_USERNAME],
    ["SMTP_PASSWORD", SMTP_PASSWORD],
    ["SMTP_FROM_EMAIL", SMTP_FROM_EMAIL],
    ["SUPABASE_URL", SUPABASE_URL],
    ["SUPABASE_SECRET_KEY", SUPABASE_SECRET_KEY],
  ].filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  requireTLS: SMTP_PORT === 587,
  auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
  connectionTimeout: 18000,
  greetingTimeout: 18000,
  socketTimeout: 30000,
  tls: { servername: SMTP_HOST, rejectUnauthorized: true },
});

async function deliver(to: string, subject: string, html: string) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await transporter.sendMail({
        from: { name: SMTP_FROM_NAME, address: SMTP_FROM_EMAIL },
        to,
        subject,
        html,
      });
      return result;
    } catch (error) {
      lastError = error;
      console.error(`SMTP attempt ${attempt + 1} failed`, error);
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 900));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("SMTP delivery failed.");
}

function normalizeType(type: EmailType): EmailType {
  return type === "payment_received" ? "payment_receipt_received" : type;
}

function normalizeRole(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

async function verifyCaller(token: string, requestApiKey: string) {
  const apiKey = requestApiKey || SUPABASE_PUBLISHABLE_KEY;
  if (!apiKey) throw new Error("Supabase publishable key is unavailable.");

  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${token}`,
    },
  });

  const authData = await authResponse.json().catch(() => ({}));
  if (!authResponse.ok || !authData?.id || !authData?.email) {
    const message = authData?.msg || authData?.message || authData?.error_description || "Invalid login session.";
    throw Object.assign(new Error(message), { status: 401 });
  }
  return authData as Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ success: false, error: "Only POST requests are allowed." }, 405);

  const requestId = crypto.randomUUID();
  try {
    validateConfig();

    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      console.error(`[${requestId}] missing authorization header`);
      return response({ success: false, error: "Authentication required.", request_id: requestId }, 401);
    }

    const token = authorization.slice(7).trim();
    const requestApiKey = req.headers.get("apikey") || "";
    const currentUser = await verifyCaller(token, requestApiKey);

    const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${SUPABASE_SECRET_KEY}` } },
    });

    const body = await req.json() as Body;
    const allowed: EmailType[] = [
      "free_course_enrolled",
      "payment_receipt_received",
      "payment_received",
      "payment_approved",
      "payment_rejected",
      "payment_revoked",
      "pin_access_welcome",
    ];
    if (!body?.type || !allowed.includes(body.type)) {
      return response({ success: false, error: "Unsupported email type.", request_id: requestId }, 400);
    }

    const eventType = normalizeType(body.type);
    const adminOnly = ["payment_approved", "payment_rejected", "payment_revoked"].includes(eventType);
    console.info(`[${requestId}] email event started`, {
      eventType,
      userId: currentUser.id,
      enrollmentId: body.enrollment_id || null,
    });

    let enrollment: Record<string, any> | null = null;
    if (body.enrollment_id) {
      const enrollmentResult = await admin
        .from("course_enrollments")
        .select("*")
        .eq("id", body.enrollment_id)
        .maybeSingle();
      if (enrollmentResult.error) {
        console.error(`[${requestId}] enrollment lookup failed`, enrollmentResult.error);
        return response({
          success: false,
          error: `Enrollment lookup failed: ${enrollmentResult.error.message}`,
          request_id: requestId,
        }, 500);
      }
      enrollment = enrollmentResult.data;
    }

    let recipientEmail = String(currentUser.email || "").trim().toLowerCase();
    let recipientName =
      body.user_name ||
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      recipientEmail.split("@")[0] ||
      "Student";

    if (adminOnly) {
      const profileResult = await admin
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileResult.error) {
        console.error(`[${requestId}] admin profile lookup failed`, profileResult.error);
        return response({
          success: false,
          error: `Admin profile lookup failed: ${profileResult.error.message}`,
          request_id: requestId,
        }, 500);
      }

      const roles = [
        normalizeRole(profileResult.data?.role),
        normalizeRole(currentUser.app_metadata?.role),
        normalizeRole(currentUser.user_metadata?.role),
      ];
      const isAdmin = roles.some((role) =>
        ["admin", "owner", "super_admin", "superadmin"].includes(role)
      );
      if (!isAdmin) {
        console.error(`[${requestId}] admin authorization failed`, { roles });
        return response({ success: false, error: "Admin access is required.", request_id: requestId }, 403);
      }

      const targetUserId = String(enrollment?.user_id || body.target_user_id || "").trim();
      const targetEmail = String(enrollment?.email || body.target_email || body.user_email || "").trim().toLowerCase();
      const targetName = String(enrollment?.full_name || body.user_name || "").trim();

      if (targetUserId) {
        const targetResult = await admin.auth.admin.getUserById(targetUserId);
        if (!targetResult.error && targetResult.data?.user?.email) {
          recipientEmail = targetResult.data.user.email;
          recipientName = targetName ||
            targetResult.data.user.user_metadata?.full_name ||
            targetResult.data.user.user_metadata?.name ||
            recipientEmail.split("@")[0] ||
            "Student";
        } else if (targetEmail) {
          recipientEmail = targetEmail;
          recipientName = targetName || targetEmail.split("@")[0] || "Student";
        } else {
          console.error(`[${requestId}] target user resolution failed`, targetResult.error);
          return response({ success: false, error: "The student email could not be resolved.", request_id: requestId }, 404);
        }
      } else if (targetEmail) {
        recipientEmail = targetEmail;
        recipientName = targetName || targetEmail.split("@")[0] || "Student";
      } else {
        return response({ success: false, error: "Student user ID or email is required.", request_id: requestId }, 400);
      }
    } else if (enrollment) {
      const enrollmentUserId = String(enrollment.user_id || "");
      if (enrollmentUserId && enrollmentUserId !== currentUser.id) {
        return response({ success: false, error: "You cannot send email for another user's enrollment.", request_id: requestId }, 403);
      }
      recipientEmail = String(enrollment.email || recipientEmail).trim().toLowerCase();
      recipientName = String(enrollment.full_name || recipientName).trim() || "Student";
    }

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return response({ success: false, error: "A valid recipient email could not be resolved.", request_id: requestId }, 400);
    }

    const hydratedBody: Body = {
      ...body,
      type: eventType,
      user_name: recipientName,
      course_title: body.course_title || String(enrollment?.course_name || "") || undefined,
      amount: body.amount ?? (enrollment?.price != null
        ? `${String(enrollment?.currency || "USD")} ${String(enrollment?.price)}`
        : undefined),
      payment_method: body.payment_method || String(enrollment?.payment_method || "") || undefined,
      transaction_id: body.transaction_id || String(enrollment?.transaction_id || "") || undefined,
      rejection_reason: body.rejection_reason || String(enrollment?.rejection_reason || enrollment?.revocation_reason || "") || undefined,
    };

    const extra: Record<string, unknown> = {};
    if (eventType === "pin_access_welcome") {
      const [{ data: pin }, { data: settings }] = await Promise.all([
        admin.from("user_access_pins").select("grace_expires_at").eq("user_id", currentUser.id).maybeSingle(),
        admin.from("pin_access_settings").select("grace_value,grace_unit,admin_whatsapp").eq("id", 1).maybeSingle(),
      ]);
      extra.grace_expires_at = pin?.grace_expires_at || null;
      extra.admin_whatsapp = settings?.admin_whatsapp || "601156961157";
      extra.grace_label = `${settings?.grace_value || 48} ${settings?.grace_unit || "hours"}`;
    }

    const email = buildEmail(hydratedBody, extra);
    const result = await deliver(recipientEmail, email.subject, email.html);
    console.info(`[${requestId}] email sent`, { eventType, recipientEmail, messageId: result.messageId || null });

    return response({
      success: true,
      message: "Email sent successfully.",
      event_type: eventType,
      recipient: recipientEmail,
      message_id: result.messageId || null,
      request_id: requestId,
    });
  } catch (error) {
    const status = Number((error as any)?.status) || 500;
    console.error(`[${requestId}] send-course-email error`, error);
    return response({
      success: false,
      error: error instanceof Error ? error.message : "Unexpected server error.",
      request_id: requestId,
    }, status);
  }
});
