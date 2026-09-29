import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.10.1";
import { Webhook } from "npm:standardwebhooks@1.0.0";

/**
 * PipSePaisa — Single Email Edge Function
 *
 * One function handles:
 * 1) Supabase Auth Send Email Hook:
 *    - signup verification
 *    - resend confirmation
 *    - password recovery
 *    - invite
 *    - magic link
 *    - email change
 *    - reauthentication
 *
 * 2) Website/course emails:
 *    - PIN instructions after verification
 *    - free course enrollment
 *    - payment receipt received
 *    - payment approved
 *    - payment rejected
 *    - payment revoked
 *
 * IMPORTANT:
 * - Function name: send-course-email
 * - Verify JWT: OFF
 * - Auth Hook URL must point to this same function.
 * - Normal website calls are still protected because JWT is verified
 *   manually inside this code.
 */

// -----------------------------------------------------------------------------
// Environment variables
// -----------------------------------------------------------------------------

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") ?? "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? "";
const SMTP_FROM_EMAIL =
  Deno.env.get("SMTP_FROM_EMAIL") ?? "no-reply@pipsepaisa.com";
const SMTP_FROM_NAME =
  Deno.env.get("SMTP_FROM_NAME") ?? "PipSePaisa";

const SEND_EMAIL_HOOK_SECRET =
  Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

function firstString(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

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

function readJsonEnv(name: string): string {
  const raw = Deno.env.get(name);
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
const VERIFIED_REDIRECT = `${SITE_URL}/email-verified.html`;
const RESET_REDIRECT = `${SITE_URL}/reset-password.html`;
const ADMIN_WHATSAPP_FALLBACK = "601156961157";

// -----------------------------------------------------------------------------
// CORS and common helpers
// -----------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  data: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRole(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// -----------------------------------------------------------------------------
// Email design
// -----------------------------------------------------------------------------

function actionButton(label: string, url: string): string {
  return `
    <p style="margin:26px 0 10px">
      <a href="${escapeHtml(url)}"
        style="
          display:inline-block;
          background:#f59e0b;
          color:#111827;
          text-decoration:none;
          padding:14px 24px;
          border-radius:10px;
          font-size:15px;
          font-weight:800;
        ">
        ${escapeHtml(label)}
      </a>
    </p>
  `;
}

function emailLayout(
  title: string,
  preview: string,
  content: string,
): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="
  margin:0;
  background:#f3f4f6;
  font-family:Arial,Helvetica,sans-serif;
  color:#111827;
">
  <div style="
    display:none;
    max-height:0;
    overflow:hidden;
    opacity:0;
  ">
    ${escapeHtml(preview)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="padding:30px 12px;background:#f3f4f6">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="
            max-width:620px;
            background:#ffffff;
            border-radius:17px;
            overflow:hidden;
            border:1px solid #e5e7eb;
            box-shadow:0 14px 42px rgba(15,23,42,.08);
          ">

          <tr>
            <td style="background:#0b172a;padding:25px;text-align:center">
              <div style="font-size:27px;font-weight:900;color:#ffffff">
                Pip<span style="color:#f59e0b">Se</span>Paisa
              </div>
              <div style="font-size:12px;color:#cbd5e1;margin-top:5px">
                Grow With Us
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px">
              <h1 style="
                font-size:24px;
                line-height:1.3;
                margin:0 0 18px;
                color:#111827;
              ">
                ${escapeHtml(title)}
              </h1>
              ${content}
            </td>
          </tr>

          <tr>
            <td style="
              padding:19px 28px;
              background:#fafafa;
              border-top:1px solid #e5e7eb;
              color:#6b7280;
              font-size:12px;
              line-height:1.65;
            ">
              This is an automated email from PipSePaisa.
              Please do not reply.<br>
              © ${new Date().getFullYear()} PipSePaisa · www.pipsepaisa.com
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function paymentDetailsTable(
  amount: string,
  method: string,
  transactionId: string,
): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="
        margin:21px 0;
        background:#f9fafb;
        border:1px solid #e5e7eb;
        border-radius:11px;
        overflow:hidden;
      ">
      <tr>
        <td style="padding:12px 15px;color:#6b7280;border-bottom:1px solid #e5e7eb">
          Amount
        </td>
        <td style="padding:12px 15px;font-weight:700;border-bottom:1px solid #e5e7eb">
          ${amount}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 15px;color:#6b7280;border-bottom:1px solid #e5e7eb">
          Payment Method
        </td>
        <td style="padding:12px 15px;font-weight:700;border-bottom:1px solid #e5e7eb">
          ${method}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 15px;color:#6b7280;border-bottom:1px solid #e5e7eb">
          Transaction ID
        </td>
        <td style="padding:12px 15px;font-weight:700;border-bottom:1px solid #e5e7eb">
          ${transactionId}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 15px;color:#6b7280">
          Status
        </td>
        <td style="padding:12px 15px;font-weight:700;color:#d97706">
          Under Review
        </td>
      </tr>
    </table>
  `;
}

// -----------------------------------------------------------------------------
// SMTP delivery
// -----------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  requireTLS: SMTP_PORT === 587,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 35000,
  tls: {
    servername: SMTP_HOST,
    rejectUnauthorized: true,
  },
});

function validateBaseConfig(): void {
  const missing = [
    ["SMTP_HOST", SMTP_HOST],
    ["SMTP_USERNAME", SMTP_USERNAME],
    ["SMTP_PASSWORD", SMTP_PASSWORD],
    ["SMTP_FROM_EMAIL", SMTP_FROM_EMAIL],
    ["SUPABASE_URL", SUPABASE_URL],
    ["SUPABASE_SECRET_KEY", SUPABASE_SECRET_KEY],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}`,
    );
  }
}

type OutgoingMessage = {
  to: string;
  subject: string;
  html: string;
};

async function deliverEmail(
  message: OutgoingMessage,
  requestId: string,
  maxAttempts = 3,
): Promise<string | null> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await transporter.sendMail({
        from: {
          name: SMTP_FROM_NAME,
          address: SMTP_FROM_EMAIL,
        },
        to: message.to,
        subject: message.subject,
        html: message.html,
      });

      console.info(`[${requestId}] SMTP sent`, {
        recipient: message.to,
        subject: message.subject,
        attempt,
        messageId: result.messageId ?? null,
      });

      return result.messageId ?? null;
    } catch (error) {
      lastError = error;

      console.error(`[${requestId}] SMTP attempt failed`, {
        recipient: message.to,
        subject: message.subject,
        attempt,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

      if (attempt < maxAttempts) {
        await sleep(attempt * 1200);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("SMTP delivery failed.");
}

async function deliverManyInBackground(
  messages: OutgoingMessage[],
  requestId: string,
): Promise<void> {
  for (const message of messages) {
    try {
      await deliverEmail(message, requestId, 3);
    } catch (error) {
      console.error(`[${requestId}] background email permanently failed`, {
        recipient: message.to,
        subject: message.subject,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
}

// -----------------------------------------------------------------------------
// Supabase Auth Send Email Hook
// -----------------------------------------------------------------------------

type AuthActionType =
  | "signup"
  | "recovery"
  | "invite"
  | "magiclink"
  | "email_change"
  | "reauthentication";

type AuthHookUser = {
  id: string;
  email?: string;
  new_email?: string;
  user_metadata?: Record<string, unknown>;
};

type AuthHookEmailData = {
  token?: string;
  token_hash?: string;
  redirect_to?: string;
  email_action_type: AuthActionType;
  site_url?: string;
  token_new?: string;
  token_hash_new?: string;
  old_email?: string;
};

type AuthHookPayload = {
  user: AuthHookUser;
  email_data: AuthHookEmailData;
};

function isAuthHookRequest(req: Request): boolean {
  return Boolean(
    req.headers.get("webhook-id") &&
      req.headers.get("webhook-timestamp") &&
      req.headers.get("webhook-signature"),
  );
}

function buildVerifyUrl(args: {
  tokenHash: string;
  type: AuthActionType;
  redirectTo: string;
}): string {
  const url = new URL(`${SUPABASE_URL}/auth/v1/verify`);

  url.searchParams.set("token", args.tokenHash);
  url.searchParams.set("type", args.type);
  url.searchParams.set("redirect_to", args.redirectTo);

  return url.toString();
}

function authUserName(user: AuthHookUser): string {
  const metadata = user.user_metadata ?? {};

  return String(
    metadata.full_name ||
      metadata.name ||
      metadata.display_name ||
      "Student",
  ).trim() || "Student";
}

function buildAuthHookMessages(
  payload: AuthHookPayload,
): OutgoingMessage[] {
  const { user, email_data } = payload;
  const action = email_data.email_action_type;
  const name = escapeHtml(authUserName(user));
  const currentEmail = normalizeEmail(user.email);
  const newEmail = normalizeEmail(user.new_email);

  const redirectTo =
    email_data.redirect_to ||
    (action === "recovery"
      ? RESET_REDIRECT
      : VERIFIED_REDIRECT);

  if (action === "signup") {
    if (!currentEmail || !email_data.token_hash) {
      throw new Error(
        "Signup hook is missing email or token hash.",
      );
    }

    const verifyUrl = buildVerifyUrl({
      tokenHash: email_data.token_hash,
      type: "signup",
      redirectTo: VERIFIED_REDIRECT,
    });

    return [
      {
        to: currentEmail,
        subject: "Verify Your PipSePaisa Account",
        html: emailLayout(
          "Verify Your Email",
          "Verify your PipSePaisa account.",
          `
            <p style="font-size:16px;line-height:1.7;margin:0 0 14px">
              Hi <strong>${name}</strong>,
            </p>

            <p style="font-size:15px;line-height:1.7;color:#374151">
              Thank you for creating your PipSePaisa account.
              Please verify your email address to activate it.
            </p>

            ${actionButton("Verify Email Address", verifyUrl)}

            <p style="font-size:13px;line-height:1.65;color:#6b7280">
              After verification, sign in manually using the
              same email address and password.
            </p>
          `,
        ),
      },
    ];
  }

  if (action === "recovery") {
    if (!currentEmail || !email_data.token_hash) {
      throw new Error(
        "Recovery hook is missing email or token hash.",
      );
    }

    const recoveryUrl = buildVerifyUrl({
      tokenHash: email_data.token_hash,
      type: "recovery",
      redirectTo: RESET_REDIRECT,
    });

    return [
      {
        to: currentEmail,
        subject: "Reset Your PipSePaisa Password",
        html: emailLayout(
          "Reset Your Password",
          "Reset your PipSePaisa password securely.",
          `
            <p style="font-size:16px;line-height:1.7;margin:0 0 14px">
              Hi <strong>${name}</strong>,
            </p>

            <p style="font-size:15px;line-height:1.7;color:#374151">
              We received a request to reset your
              PipSePaisa account password.
            </p>

            ${actionButton("Reset Password", recoveryUrl)}

            <p style="font-size:13px;line-height:1.65;color:#6b7280">
              If you did not request this change,
              you can safely ignore this email.
            </p>
          `,
        ),
      },
    ];
  }

  if (action === "invite") {
    if (!currentEmail || !email_data.token_hash) {
      throw new Error(
        "Invite hook is missing email or token hash.",
      );
    }

    const inviteUrl = buildVerifyUrl({
      tokenHash: email_data.token_hash,
      type: "invite",
      redirectTo,
    });

    return [
      {
        to: currentEmail,
        subject: "You Are Invited to PipSePaisa",
        html: emailLayout(
          "Accept Your Invitation",
          "You have been invited to join PipSePaisa.",
          `
            <p style="font-size:15px;line-height:1.7;color:#374151">
              You have been invited to create and activate
              your PipSePaisa account.
            </p>

            ${actionButton("Accept Invitation", inviteUrl)}
          `,
        ),
      },
    ];
  }

  if (action === "magiclink") {
    if (!currentEmail || !email_data.token_hash) {
      throw new Error(
        "Magic-link hook is missing email or token hash.",
      );
    }

    const signInUrl = buildVerifyUrl({
      tokenHash: email_data.token_hash,
      type: "magiclink",
      redirectTo,
    });

    return [
      {
        to: currentEmail,
        subject: "Your PipSePaisa Sign-In Link",
        html: emailLayout(
          "Sign In to PipSePaisa",
          "Use your secure PipSePaisa sign-in link.",
          `
            <p style="font-size:15px;line-height:1.7;color:#374151">
              Click the secure button below to sign in
              to your account.
            </p>

            ${actionButton("Sign In", signInUrl)}
          `,
        ),
      },
    ];
  }

  if (action === "reauthentication") {
    if (!currentEmail || !email_data.token) {
      throw new Error(
        "Reauthentication hook is missing email or token.",
      );
    }

    return [
      {
        to: currentEmail,
        subject: "Your PipSePaisa Security Code",
        html: emailLayout(
          "Security Verification",
          "Your PipSePaisa security code.",
          `
            <p style="font-size:15px;line-height:1.7;color:#374151">
              Enter this security code to continue:
            </p>

            <div style="
              margin:22px 0;
              padding:16px;
              text-align:center;
              background:#fff7ed;
              border:1px solid #fed7aa;
              border-radius:10px;
              font-size:28px;
              font-weight:800;
              letter-spacing:5px;
              color:#9a3412;
            ">
              ${escapeHtml(email_data.token)}
            </div>
          `,
        ),
      },
    ];
  }

  if (action === "email_change") {
    const messages: OutgoingMessage[] = [];

    /**
     * Supabase documents that email-change hash names are reversed:
     * - token_hash_new is used for the CURRENT email.
     * - token_hash is used for the NEW email.
     */

    if (
      currentEmail &&
      email_data.token_hash_new
    ) {
      const currentEmailUrl = buildVerifyUrl({
        tokenHash: email_data.token_hash_new,
        type: "email_change",
        redirectTo,
      });

      messages.push({
        to: currentEmail,
        subject: "Approve Your PipSePaisa Email Change",
        html: emailLayout(
          "Approve Email Change",
          "Approve your PipSePaisa email address change.",
          `
            <p style="font-size:15px;line-height:1.7;color:#374151">
              A request was made to change your
              PipSePaisa account email address.
            </p>

            ${actionButton("Approve Email Change", currentEmailUrl)}
          `,
        ),
      });
    }

    if (
      newEmail &&
      email_data.token_hash
    ) {
      const newEmailUrl = buildVerifyUrl({
        tokenHash: email_data.token_hash,
        type: "email_change",
        redirectTo,
      });

      messages.push({
        to: newEmail,
        subject: "Confirm Your New PipSePaisa Email",
        html: emailLayout(
          "Confirm Your New Email",
          "Confirm your new PipSePaisa email address.",
          `
            <p style="font-size:15px;line-height:1.7;color:#374151">
              Confirm this new email address for your
              PipSePaisa account.
            </p>

            ${actionButton("Confirm New Email", newEmailUrl)}
          `,
        ),
      });
    }

    // Secure email change may be disabled, resulting in only one pair.
    if (
      messages.length === 0 &&
      newEmail &&
      (email_data.token_hash || email_data.token_hash_new)
    ) {
      const availableHash =
        email_data.token_hash ||
        email_data.token_hash_new ||
        "";

      const singleUrl = buildVerifyUrl({
        tokenHash: availableHash,
        type: "email_change",
        redirectTo,
      });

      messages.push({
        to: newEmail,
        subject: "Confirm Your New PipSePaisa Email",
        html: emailLayout(
          "Confirm Your New Email",
          "Confirm your new PipSePaisa email address.",
          `
            <p style="font-size:15px;line-height:1.7;color:#374151">
              Confirm this new email address for your
              PipSePaisa account.
            </p>

            ${actionButton("Confirm New Email", singleUrl)}
          `,
        ),
      });
    }

    if (messages.length === 0) {
      throw new Error(
        "Email-change hook is missing recipient or token hash.",
      );
    }

    return messages;
  }

  throw new Error(`Unsupported Auth email action: ${action}`);
}

async function handleAuthEmailHook(
  req: Request,
  requestId: string,
): Promise<Response> {
  if (!SEND_EMAIL_HOOK_SECRET) {
    throw new Error(
      "Missing SEND_EMAIL_HOOK_SECRET environment variable.",
    );
  }

  const rawPayload = await req.text();
  const headers = Object.fromEntries(req.headers);

  const hookSecret = SEND_EMAIL_HOOK_SECRET.replace(
    "v1,whsec_",
    "",
  );

  const webhook = new Webhook(hookSecret);

  let payload: AuthHookPayload;

  try {
    payload = webhook.verify(
      rawPayload,
      headers,
    ) as AuthHookPayload;
  } catch (error) {
    console.error(`[${requestId}] invalid Auth Hook signature`, error);

    return jsonResponse(
      {
        error: {
          http_code: 401,
          message: "Invalid Auth Hook signature.",
        },
      },
      401,
    );
  }

  const messages = buildAuthHookMessages(payload);

  /**
   * Critical timeout fix:
   * Supabase Auth Hook receives an immediate 200 response.
   * SMTP continues as a Supabase background task.
   */
  EdgeRuntime.waitUntil(
    deliverManyInBackground(messages, requestId),
  );

  console.info(`[${requestId}] Auth email accepted`, {
    action: payload.email_data.email_action_type,
    recipients: messages.map((message) => message.to),
  });

  return jsonResponse({}, 200);
}

// -----------------------------------------------------------------------------
// Website/course email handling
// -----------------------------------------------------------------------------

type WebsiteEmailType =
  | "free_course_enrolled"
  | "payment_receipt_received"
  | "payment_received"
  | "payment_approved"
  | "payment_rejected"
  | "payment_revoked"
  | "pin_access_welcome";

type WebsiteEmailBody = {
  type: WebsiteEmailType;
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

function normalizeWebsiteType(
  type: WebsiteEmailType,
): WebsiteEmailType {
  return type === "payment_received"
    ? "payment_receipt_received"
    : type;
}

function formatDeadline(value: unknown): string {
  if (!value) {
    return "the deadline displayed in your Settings";
  }

  try {
    return (
      new Date(String(value)).toLocaleString("en-GB", {
        timeZone: "Asia/Karachi",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " (Pakistan time)"
    );
  } catch {
    return "the deadline displayed in your Settings";
  }
}

function buildWebsiteEmail(
  body: WebsiteEmailBody,
  extra: Record<string, unknown> = {},
): {
  subject: string;
  html: string;
} {
  const name = escapeHtml(body.user_name || "Student");
  const course = escapeHtml(
    body.course_title || "PipSePaisa Forex Course",
  );
  const amount = escapeHtml(body.amount || "Not provided");
  const method = escapeHtml(
    body.payment_method || "Not provided",
  );
  const transaction = escapeHtml(
    body.transaction_id || "Not provided",
  );
  const reason = escapeHtml(
    body.rejection_reason ||
      "The submitted payment receipt could not be verified.",
  );

  const type = normalizeWebsiteType(body.type);

  if (type === "free_course_enrolled") {
    return {
      subject: `Enrollment Successful — ${course}`,
      html: emailLayout(
        "Course Enrollment Successful",
        "Your PipSePaisa course enrollment is active.",
        `
          <p style="font-size:16px;line-height:1.7;margin:0 0 14px">
            Hi <strong>${name}</strong>,
          </p>

          <p style="font-size:15px;line-height:1.7;color:#374151">
            Your enrollment in <strong>${course}</strong>
            has been completed successfully.
          </p>

          <div style="
            padding:16px;
            background:#ecfdf5;
            border:1px solid #a7f3d0;
            border-radius:10px;
            color:#065f46;
          ">
            <strong>✓ Enrollment confirmed</strong><br>
            <strong>✓ Course access active</strong><br>
            You can open the course modules from your account.
          </div>

          ${actionButton(
            "Open My Course",
            `${SITE_URL}/index.html?open=mycourses`,
          )}
        `,
      ),
    };
  }

  if (type === "payment_receipt_received") {
    return {
      subject: "Payment Receipt Received — Under Review",
      html: emailLayout(
        "Payment Receipt Received",
        "We received your PipSePaisa payment receipt.",
        `
          <p style="font-size:16px;line-height:1.7;margin:0 0 14px">
            Hi <strong>${name}</strong>,
          </p>

          <p style="font-size:15px;line-height:1.7;color:#374151">
            We have received your payment receipt for
            <strong>${course}</strong>.
          </p>

          ${paymentDetailsTable(amount, method, transaction)}

          <div style="
            padding:16px;
            background:#fff7ed;
            border:1px solid #fed7aa;
            border-radius:10px;
            color:#9a3412;
          ">
            <strong>Your payment receipt is under review.</strong><br>
            Your paid course remains locked until an admin
            approves the receipt.
          </div>

          ${actionButton(
            "View Payment Status",
            `${SITE_URL}/index.html?open=mycourses`,
          )}
        `,
      ),
    };
  }

  if (type === "payment_approved") {
    return {
      subject: "Payment Approved — Course Unlocked",
      html: emailLayout(
        "Payment Approved — Course Unlocked",
        "Your PipSePaisa payment was approved.",
        `
          <p style="font-size:16px;line-height:1.7;margin:0 0 14px">
            Hi <strong>${name}</strong>,
          </p>

          <p style="font-size:15px;line-height:1.7;color:#374151">
            Your payment receipt for <strong>${course}</strong>
            has been verified and approved.
          </p>

          <div style="
            padding:17px;
            background:#ecfdf5;
            border:1px solid #a7f3d0;
            border-radius:10px;
            color:#065f46;
          ">
            <strong>✓ Payment approved</strong><br>
            <strong>✓ Course enrollment active</strong><br>
            <strong>✓ Course modules unlocked</strong>
          </div>

          ${actionButton(
            "Open My Course",
            `${SITE_URL}/index.html?open=mycourses`,
          )}

          <p style="font-size:13px;line-height:1.6;color:#6b7280">
            Sign in using the same email address used
            for the payment receipt.
          </p>
        `,
      ),
    };
  }

  if (
    type === "payment_rejected" ||
    type === "payment_revoked"
  ) {
    const revoked = type === "payment_revoked";

    return {
      subject: revoked
        ? "Course Access Revoked — Payment Review Required"
        : "Payment Receipt Verification Required",
      html: emailLayout(
        revoked
          ? "Course Access Revoked"
          : "Payment Receipt Could Not Be Verified",
        "Your PipSePaisa payment needs attention.",
        `
          <p style="font-size:16px;line-height:1.7;margin:0 0 14px">
            Hi <strong>${name}</strong>,
          </p>

          <p style="font-size:15px;line-height:1.7;color:#374151">
            ${
              revoked
                ? `Your previously approved access to <strong>${course}</strong> has been revoked for review.`
                : `We could not verify your submitted payment receipt for <strong>${course}</strong>.`
            }
          </p>

          <div style="
            padding:16px;
            background:#fef2f2;
            border:1px solid #fecaca;
            border-radius:10px;
            color:#991b1b;
          ">
            <strong>Reason:</strong><br>
            ${reason}
          </div>

          <p style="font-size:15px;line-height:1.7;color:#374151">
            Your course is locked. Please contact the admin
            or submit a corrected payment receipt.
          </p>

          ${actionButton(
            "Open My Courses",
            `${SITE_URL}/index.html?open=mycourses`,
          )}
        `,
      ),
    };
  }

  const whatsapp = String(
    extra.admin_whatsapp || ADMIN_WHATSAPP_FALLBACK,
  ).replace(/\D/g, "");

  const deadline = formatDeadline(extra.grace_expires_at);
  const graceLabel = escapeHtml(
    extra.grace_label || "48 hours",
  );

  return {
    subject: "Your Free PipSePaisa Access PIN Instructions",
    html: emailLayout(
      "Activate Your Free Access PIN",
      "Get your free PipSePaisa Access PIN.",
      `
        <p style="font-size:16px;line-height:1.7;margin:0 0 14px">
          Hi <strong>${name}</strong>,
        </p>

        <p style="font-size:15px;line-height:1.7;color:#374151">
          Your PipSePaisa account has been verified successfully.
        </p>

        <div style="
          padding:16px;
          background:#fff7ed;
          border:1px solid #fed7aa;
          border-radius:10px;
          color:#9a3412;
        ">
          <strong>Your access PIN is completely free.</strong><br>
          Contact the PipSePaisa admin on WhatsApp,
          receive your unique PIN, and add it in
          <strong>Settings → Free Access PIN</strong>.
        </div>

        <p style="font-size:15px;line-height:1.7;color:#374151">
          You have <strong>${graceLabel}</strong> to add the PIN.
          Your current deadline is <strong>${escapeHtml(deadline)}</strong>.
          After the deadline, Signals, Charts, Articles,
          Journal and other protected features remain visible
          but locked until the PIN is activated.
        </p>

        ${actionButton(
          "Contact Admin — Get Free PIN",
          `https://wa.me/${whatsapp}`,
        )}

        ${actionButton(
          "Open PipSePaisa Settings",
          `${SITE_URL}/index.html?open=settings`,
        )}
      `,
    ),
  };
}

async function verifyCaller(
  token: string,
  requestApiKey: string,
): Promise<Record<string, any>> {
  const apiKey =
    requestApiKey || SUPABASE_PUBLISHABLE_KEY;

  if (!apiKey) {
    throw new Error(
      "Supabase publishable key is unavailable.",
    );
  }

  const authResponse = await fetch(
    `${SUPABASE_URL}/auth/v1/user`,
    {
      method: "GET",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const authData = await authResponse
    .json()
    .catch(() => ({}));

  if (
    !authResponse.ok ||
    !authData?.id ||
    !authData?.email
  ) {
    const message =
      authData?.msg ||
      authData?.message ||
      authData?.error_description ||
      "Invalid login session.";

    throw Object.assign(new Error(message), {
      status: 401,
    });
  }

  return authData as Record<string, any>;
}

async function handleWebsiteEmail(
  req: Request,
  requestId: string,
): Promise<Response> {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse(
      {
        success: false,
        error: "Authentication required.",
        request_id: requestId,
      },
      401,
    );
  }

  const token = authorization.slice(7).trim();
  const requestApiKey = req.headers.get("apikey") || "";

  const currentUser = await verifyCaller(
    token,
    requestApiKey,
  );

  const admin = createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        },
      },
    },
  );

  const body = (await req.json()) as WebsiteEmailBody;

  const allowedTypes: WebsiteEmailType[] = [
    "free_course_enrolled",
    "payment_receipt_received",
    "payment_received",
    "payment_approved",
    "payment_rejected",
    "payment_revoked",
    "pin_access_welcome",
  ];

  if (
    !body?.type ||
    !allowedTypes.includes(body.type)
  ) {
    return jsonResponse(
      {
        success: false,
        error: "Unsupported email type.",
        request_id: requestId,
      },
      400,
    );
  }

  const eventType = normalizeWebsiteType(body.type);

  const adminOnly = [
    "payment_approved",
    "payment_rejected",
    "payment_revoked",
  ].includes(eventType);

  console.info(`[${requestId}] website email started`, {
    eventType,
    currentUserId: currentUser.id,
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
      return jsonResponse(
        {
          success: false,
          error:
            `Enrollment lookup failed: ${enrollmentResult.error.message}`,
          request_id: requestId,
        },
        500,
      );
    }

    enrollment = enrollmentResult.data;
  }

  let recipientEmail = normalizeEmail(currentUser.email);

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
      return jsonResponse(
        {
          success: false,
          error:
            `Admin profile lookup failed: ${profileResult.error.message}`,
          request_id: requestId,
        },
        500,
      );
    }

    const roles = [
      normalizeRole(profileResult.data?.role),
      normalizeRole(currentUser.app_metadata?.role),
      normalizeRole(currentUser.user_metadata?.role),
    ];

    const isAdmin = roles.some((role) =>
      [
        "admin",
        "owner",
        "super_admin",
        "superadmin",
      ].includes(role)
    );

    if (!isAdmin) {
      return jsonResponse(
        {
          success: false,
          error: "Admin access is required.",
          request_id: requestId,
        },
        403,
      );
    }

    const targetUserId = String(
      enrollment?.user_id ||
        body.target_user_id ||
        "",
    ).trim();

    const targetEmail = normalizeEmail(
      enrollment?.email ||
        body.target_email ||
        body.user_email ||
        "",
    );

    const targetName = String(
      enrollment?.full_name ||
        body.user_name ||
        "",
    ).trim();

    if (targetUserId) {
      const targetResult =
        await admin.auth.admin.getUserById(targetUserId);

      if (
        !targetResult.error &&
        targetResult.data?.user?.email
      ) {
        recipientEmail = normalizeEmail(
          targetResult.data.user.email,
        );

        recipientName =
          targetName ||
          targetResult.data.user.user_metadata?.full_name ||
          targetResult.data.user.user_metadata?.name ||
          recipientEmail.split("@")[0] ||
          "Student";
      } else if (targetEmail) {
        recipientEmail = targetEmail;
        recipientName =
          targetName ||
          targetEmail.split("@")[0] ||
          "Student";
      } else {
        return jsonResponse(
          {
            success: false,
            error:
              "The student email could not be resolved.",
            request_id: requestId,
          },
          404,
        );
      }
    } else if (targetEmail) {
      recipientEmail = targetEmail;
      recipientName =
        targetName ||
        targetEmail.split("@")[0] ||
        "Student";
    } else {
      return jsonResponse(
        {
          success: false,
          error:
            "Student user ID or email is required.",
          request_id: requestId,
        },
        400,
      );
    }
  } else if (enrollment) {
    const enrollmentUserId = String(
      enrollment.user_id || "",
    );

    if (
      enrollmentUserId &&
      enrollmentUserId !== currentUser.id
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "You cannot send email for another user's enrollment.",
          request_id: requestId,
        },
        403,
      );
    }

    recipientEmail = normalizeEmail(
      enrollment.email || recipientEmail,
    );

    recipientName =
      String(
        enrollment.full_name || recipientName,
      ).trim() || "Student";
  }

  if (
    !recipientEmail ||
    !isValidEmail(recipientEmail)
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "A valid recipient email could not be resolved.",
        request_id: requestId,
      },
      400,
    );
  }

  const hydratedBody: WebsiteEmailBody = {
    ...body,
    type: eventType,
    user_name: recipientName,
    course_title:
      body.course_title ||
      String(enrollment?.course_name || "") ||
      undefined,
    amount:
      body.amount ??
      (
        enrollment?.price != null
          ? `${String(enrollment?.currency || "USD")} ${String(enrollment?.price)}`
          : undefined
      ),
    payment_method:
      body.payment_method ||
      String(enrollment?.payment_method || "") ||
      undefined,
    transaction_id:
      body.transaction_id ||
      String(enrollment?.transaction_id || "") ||
      undefined,
    rejection_reason:
      body.rejection_reason ||
      String(
        enrollment?.rejection_reason ||
          enrollment?.revocation_reason ||
          "",
      ) ||
      undefined,
  };

  const extra: Record<string, unknown> = {};

  if (eventType === "pin_access_welcome") {
    const [
      { data: pin, error: pinError },
      { data: settings, error: settingsError },
    ] = await Promise.all([
      admin
        .from("user_access_pins")
        .select("grace_expires_at")
        .eq("user_id", currentUser.id)
        .maybeSingle(),

      admin
        .from("pin_access_settings")
        .select(
          "grace_value,grace_unit,admin_whatsapp",
        )
        .eq("id", 1)
        .maybeSingle(),
    ]);

    if (pinError) {
      console.warn(
        `[${requestId}] PIN record lookup warning`,
        pinError,
      );
    }

    if (settingsError) {
      console.warn(
        `[${requestId}] PIN settings lookup warning`,
        settingsError,
      );
    }

    extra.grace_expires_at =
      pin?.grace_expires_at || null;

    extra.admin_whatsapp =
      settings?.admin_whatsapp ||
      ADMIN_WHATSAPP_FALLBACK;

    extra.grace_label =
      `${settings?.grace_value || 48} ` +
      `${settings?.grace_unit || "hours"}`;
  }

  const email = buildWebsiteEmail(
    hydratedBody,
    extra,
  );

  const messageId = await deliverEmail(
    {
      to: recipientEmail,
      subject: email.subject,
      html: email.html,
    },
    requestId,
    3,
  );

  return jsonResponse(
    {
      success: true,
      message: "Email sent successfully.",
      event_type: eventType,
      recipient: recipientEmail,
      message_id: messageId,
      request_id: requestId,
    },
    200,
  );
}

// -----------------------------------------------------------------------------
// Main request handler
// -----------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Only POST requests are allowed.",
      },
      405,
    );
  }

  const requestId = crypto.randomUUID();

  try {
    validateBaseConfig();

    if (isAuthHookRequest(req)) {
      return await handleAuthEmailHook(
        req,
        requestId,
      );
    }

    return await handleWebsiteEmail(
      req,
      requestId,
    );
  } catch (error) {
    const status =
      Number((error as { status?: number })?.status) ||
      500;

    console.error(
      `[${requestId}] send-course-email error`,
      error,
    );

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
        request_id: requestId,
      },
      status,
    );
  }
});
