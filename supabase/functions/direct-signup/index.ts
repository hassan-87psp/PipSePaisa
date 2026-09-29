import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
  }
  return "";
}

function readJsonEnv(name: string): string {
  const raw = Deno.env.get(name);
  if (!raw) return "";
  try { return firstString(JSON.parse(raw)); }
  catch { return raw.trim(); }
}

const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_SECRET_KEY") ||
  readJsonEnv("SUPABASE_SECRET_KEYS");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown, max = 250): string {
  return String(value ?? "").trim().slice(0, max);
}

function cleanMetadata(input: unknown): Record<string, unknown> {
  const src = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const out: Record<string, unknown> = {
    full_name: cleanText(src.full_name, 150),
    username: cleanText(src.username, 100),
    phone: cleanText(src.phone, 60),
    whatsapp: cleanText(src.whatsapp ?? src.phone, 60),
    role: "user",
    portal: "user",
  };

  const allowed = [
    "psp_auto_enroll_course",
    "psp_enrollment_experience",
    "psp_enrollment_goal",
    "psp_enrollment_payment_method",
    "psp_enrollment_transaction_id",
    "referral_slug",
    "referral_source",
    "referral_campaign",
    "referral_link_id",
  ];

  for (const key of allowed) {
    const value = src[key];
    if (value === undefined || value === null || value === "") continue;
    out[key] = typeof value === "string" ? cleanText(value, 300) : value;
  }

  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Supabase server secrets are missing.");
    }

    const body = await req.json() as {
      email?: string;
      password?: string;
      metadata?: Record<string, unknown>;
    };

    const email = cleanText(body.email, 320).toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return json({ ok: false, error: "Please enter a valid email address." }, 400);
    }
    if (password.length < 6 || password.length > 200) {
      return json({ ok: false, error: "Password must be at least 6 characters." }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const metadata = cleanMetadata(body.metadata);
    const result = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (result.error) {
      const raw = result.error.message || "Account could not be created.";
      if (/already|registered|exists|duplicate/i.test(raw)) {
        return json({ ok: false, code: "already_registered", error: "An account already exists with this email. Please sign in." }, 409);
      }
      throw result.error;
    }

    if (!result.data.user?.id) throw new Error("Account could not be created.");

    return json({
      ok: true,
      user_id: result.data.user.id,
      email_confirmed: true,
    });
  } catch (error) {
    console.error("direct-signup", error);
    return json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
