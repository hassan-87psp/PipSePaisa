import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.10.1";
import { Webhook } from "npm:standardwebhooks@1.0.0";

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

const SITE_URL = "https://www.pipsepaisa.com";

type EmailActionType =
  | "signup"
  | "recovery"
  | "invite"
  | "magiclink"
  | "email_change"
  | "reauthentication";

interface HookUser {
  id: string;
  email?: string;
  new_email?: string;
  user_metadata?: Record<string, unknown>;
}

interface HookEmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: EmailActionType;
  site_url: string;
  token_new?: string;
  token_hash_new?: string;
  old_email?: string;
}

interface HookPayload {
  user: HookUser;
  email_data: HookEmailData;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function requireSecrets(): void {
  const missing: string[] = [];

  if (!SMTP_HOST) missing.push("SMTP_HOST");
  if (!SMTP_PORT) missing.push("SMTP_PORT");
  if (!SMTP_USERNAME) missing.push("SMTP_USERNAME");
  if (!SMTP_PASSWORD) missing.push("SMTP_PASSWORD");
  if (!SMTP_FROM_EMAIL) missing.push("SMTP_FROM_EMAIL");
  if (!SEND_EMAIL_HOOK_SECRET) {
    missing.push("SEND_EMAIL_HOOK_SECRET");
  }

  if (missing.length) {
    throw new Error(`Missing secrets: ${missing.join(", ")}`);
  }
}

function verificationUrl(args: {
  tokenHash: string;
  type: EmailActionType;
  redirectTo?: string;
}): string {
  const projectUrl = Deno.env.get("SUPABASE_URL") ?? "";

  if (!projectUrl) {
    throw new Error("Missing SUPABASE_URL.");
  }

  const url = new URL(`${projectUrl}/auth/v1/verify`);
  url.searchParams.set("token", args.tokenHash);
  url.searchParams.set("type", args.type);

  if (args.redirectTo) {
    url.searchParams.set("redirect_to", args.redirectTo);
  }

  return url.toString();
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
<body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#0b172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(preview)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:#f4f5f7;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="max-width:620px;background:#fff;border:1px solid #e5e7eb;
          border-radius:16px;overflow:hidden;">

          <tr>
            <td style="background:#0b172a;padding:24px;text-align:center;">
              <div style="font-size:27px;font-weight:800;color:#fff;">
                Pip<span style="color:#f88702;">Se</span>Paisa
              </div>
              <div style="margin-top:6px;font-size:12px;color:#cbd5e1;">
                Grow With Us
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;">
              <h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;">
                ${escapeHtml(title)}
              </h1>
              ${content}
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px;background:#fafafa;
              border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                This is an automated email from PipSePaisa.
                Please do not reply.
              </p>
              <p style="margin:7px 0 0;font-size:12px;color:#6b7280;">
                © ${new Date().getFullYear()} PipSePaisa · www.pipsepaisa.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(label: string, url: string): string {
  return `<p style="margin:26px 0 10px;">
    <a href="${escapeHtml(url)}"
      style="display:inline-block;background:#f88702;color:#111827;
      text-decoration:none;padding:14px 24px;border-radius:9px;
      font-size:15px;font-weight:800;">
      ${escapeHtml(label)}
    </a>
  </p>`;
}

function buildMessage(payload: HookPayload): {
  to: string;
  subject: string;
  html: string;
} {
  const { user, email_data } = payload;
  const action = email_data.email_action_type;

  const name = escapeHtml(
    user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "Student",
  );

  const defaultRedirect =
    action === "recovery"
      ? `${SITE_URL}/reset-password.html`
      : `${SITE_URL}/email-verified.html`;

  const redirectTo =
    email_data.redirect_to || defaultRedirect;

  const mainEmail = user.email ?? "";

  if (!mainEmail) {
    throw new Error("Hook payload does not contain a recipient email.");
  }

  if (action === "signup") {
    const url = verificationUrl({
      tokenHash: email_data.token_hash,
      type: "signup",
      redirectTo,
    });

    return {
      to: mainEmail,
      subject: "Verify Your PipSePaisa Account",
      html: emailLayout(
        "Verify Your Email",
        "Verify your PipSePaisa account.",
        `
        <p style="font-size:16px;line-height:1.7;margin:0 0 14px;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="font-size:15px;line-height:1.7;color:#374151;">
          Thank you for creating your PipSePaisa account.
          Please verify your email address to activate it.
        </p>
        ${button("Verify Email Address", url)}
        <p style="font-size:13px;line-height:1.6;color:#6b7280;">
          After verification, sign in manually using your email and password.
        </p>
        `,
      ),
    };
  }

  if (action === "recovery") {
    const url = verificationUrl({
      tokenHash: email_data.token_hash,
      type: "recovery",
      redirectTo:
        email_data.redirect_to ||
        `${SITE_URL}/reset-password.html`,
    });

    return {
      to: mainEmail,
      subject: "Reset Your PipSePaisa Password",
      html: emailLayout(
        "Reset Your Password",
        "Reset your PipSePaisa password securely.",
        `
        <p style="font-size:16px;line-height:1.7;margin:0 0 14px;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="font-size:15px;line-height:1.7;color:#374151;">
          We received a request to reset your PipSePaisa password.
        </p>
        ${button("Reset Password", url)}
        <p style="font-size:13px;line-height:1.6;color:#6b7280;">
          If you did not request this, you can safely ignore this email.
        </p>
        `,
      ),
    };
  }

  if (action === "invite") {
    const url = verificationUrl({
      tokenHash: email_data.token_hash,
      type: "invite",
      redirectTo,
    });

    return {
      to: mainEmail,
      subject: "You Are Invited to PipSePaisa",
      html: emailLayout(
        "Accept Your Invitation",
        "You have been invited to PipSePaisa.",
        `
        <p style="font-size:15px;line-height:1.7;color:#374151;">
          You have been invited to join PipSePaisa.
        </p>
        ${button("Accept Invitation", url)}
        `,
      ),
    };
  }

  if (action === "magiclink") {
    const url = verificationUrl({
      tokenHash: email_data.token_hash,
      type: "magiclink",
      redirectTo,
    });

    return {
      to: mainEmail,
      subject: "Your PipSePaisa Sign-In Link",
      html: emailLayout(
        "Sign In to PipSePaisa",
        "Use your secure sign-in link.",
        `
        <p style="font-size:15px;line-height:1.7;color:#374151;">
          Use the secure button below to sign in.
        </p>
        ${button("Sign In", url)}
        `,
      ),
    };
  }

  if (action === "reauthentication") {
    return {
      to: mainEmail,
      subject: "Your PipSePaisa Security Code",
      html: emailLayout(
        "Security Verification",
        "Your PipSePaisa security code.",
        `
        <p style="font-size:15px;line-height:1.7;color:#374151;">
          Enter this security code to continue:
        </p>
        <div style="margin:22px 0;padding:16px;text-align:center;
          background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;
          font-size:28px;font-weight:800;letter-spacing:5px;color:#9a3412;">
          ${escapeHtml(email_data.token)}
        </div>
        `,
      ),
    };
  }

  if (action === "email_change") {
    const recipient = user.new_email || mainEmail;
    const tokenHash =
      email_data.token_hash || email_data.token_hash_new || "";

    if (!tokenHash) {
      throw new Error("Email-change token hash is missing.");
    }

    const url = verificationUrl({
      tokenHash,
      type: "email_change",
      redirectTo,
    });

    return {
      to: recipient,
      subject: "Confirm Your New PipSePaisa Email",
      html: emailLayout(
        "Confirm Your New Email",
        "Confirm your new PipSePaisa email address.",
        `
        <p style="font-size:15px;line-height:1.7;color:#374151;">
          Confirm this email address for your PipSePaisa account.
        </p>
        ${button("Confirm New Email", url)}
        `,
      ),
    };
  }

  throw new Error(`Unsupported email action: ${action}`);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  requireTLS: SMTP_PORT === 587,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  tls: {
    servername: SMTP_HOST,
    rejectUnauthorized: true,
  },
});

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: {
          http_code: 405,
          message: "Only POST requests are allowed.",
        },
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    requireSecrets();

    const payloadText = await req.text();
    const headers = Object.fromEntries(req.headers);

    const hookSecret = SEND_EMAIL_HOOK_SECRET.replace(
      "v1,whsec_",
      "",
    );

    const webhook = new Webhook(hookSecret);
    const payload = webhook.verify(
      payloadText,
      headers,
    ) as HookPayload;

    const message = buildMessage(payload);

    const result = await transporter.sendMail({
      from: {
        name: SMTP_FROM_NAME,
        address: SMTP_FROM_EMAIL,
      },
      to: message.to,
      subject: message.subject,
      html: message.html,
    });

    console.log("Auth email sent", {
      type: payload.email_data.email_action_type,
      recipient: message.to,
      message_id: result.messageId ?? null,
    });

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("auth-send-email error:", error);

    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message:
            error instanceof Error
              ? error.message
              : "Auth email could not be sent.",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
