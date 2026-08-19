import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const INFINITY_API_KEY = Deno.env.get("INFINITY_API_KEY") ?? "";
const INFINITY_API_BASE_URL = (Deno.env.get("INFINITY_API_BASE_URL") ?? "https://api.infinitymoneysolutions.com").replace(/\/$/, "");
const INFINITY_CALLBACK_SECRET = Deno.env.get("INFINITY_CALLBACK_SECRET") ?? "";
const INFINITY_ADVANCED_COURSE_AMOUNT = Deno.env.get("INFINITY_ADVANCED_COURSE_AMOUNT") ?? "";
const INFINITY_PROVIDER_CURRENCY = (Deno.env.get("INFINITY_PROVIDER_CURRENCY") ?? "PKR").trim().toUpperCase() || "PKR";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://www.pipsepaisa.com").replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requiredConfig() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!INFINITY_API_KEY) missing.push("INFINITY_API_KEY");
  if (!INFINITY_CALLBACK_SECRET) missing.push("INFINITY_CALLBACK_SECRET");
  if (missing.length) throw new Error(`Missing server secrets: ${missing.join(", ")}`);
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

function firstRedirect(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as Record<string, unknown>;
  const direct = [p.redirect_url, p.redirectUrl, p.url].find((v) => typeof v === "string" && v.trim());
  if (typeof direct === "string") return direct.trim();
  for (const key of ["data", "result", "response"]) {
    const nested = p[key];
    if (nested && typeof nested === "object") {
      const found = firstRedirect(nested);
      if (found) return found;
    }
  }
  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Only POST is allowed." }, 405);

  const requestTrace = crypto.randomUUID();
  try {
    requiredConfig();

    const authorization = req.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return json({ success: false, error: "Authentication required.", request_id: requestTrace }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: authorization } },
    });
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user) {
      return json({ success: false, error: "Your login session is invalid or expired.", request_id: requestTrace }, 401);
    }

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const courseId = String(body.course_id ?? body.course_key ?? "advanced").trim().toLowerCase();
    const enrollmentId = String(body.enrollment_id ?? "").trim();

    // PipSePaisa currently has one paid course key: advanced.
    if (courseId !== "advanced") {
      return json({ success: false, error: "Local Bank Transfer is available only for the paid Advanced Forex Course.", request_id: requestTrace }, 400);
    }

    // Optional profile safety check. Missing optional fields do not block valid users.
    const profileResult = await service.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!profileResult.error && profileResult.data) {
      const profile = profileResult.data as Record<string, unknown>;
      const status = String(profile.status ?? "").toLowerCase();
      if (profile.is_active === false || ["disabled", "suspended", "inactive", "blocked"].includes(status)) {
        return json({ success: false, error: "This account is not active.", request_id: requestTrace }, 403);
      }
    }

    // The system Local Bank method must exist and be enabled.
    const methodResult = await service
      .from("payment_methods")
      .select("id,enabled,system_key,is_system")
      .eq("system_key", "infinity_local_bank")
      .maybeSingle();
    if (methodResult.error || !methodResult.data || methodResult.data.enabled !== true) {
      return json({ success: false, error: "Local Bank Transfer is temporarily unavailable.", request_id: requestTrace }, 503);
    }

    // Confirm the course is still published/open when the catalog row exists.
    const courseResult = await service.from("courses").select("*");
    if (!courseResult.error && Array.isArray(courseResult.data) && courseResult.data.length) {
      const row = courseResult.data.find((x: Record<string, unknown>) =>
        String(x.course_key ?? "").toLowerCase() === "advanced" ||
        /advanced forex course/i.test(String(x.title ?? ""))
      ) as Record<string, unknown> | undefined;
      if (row) {
        if (row.is_published === false || row.published === false) {
          return json({ success: false, error: "This course is not currently published.", request_id: requestTrace }, 409);
        }
        if (row.enrollment_open === false || row.enrollments_open === false) {
          return json({ success: false, error: "Enrollment for this course is currently closed.", request_id: requestTrace }, 409);
        }
      }
    }

    let enrollmentQuery = service
      .from("course_enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_key", "advanced");
    if (enrollmentId) enrollmentQuery = enrollmentQuery.eq("id", enrollmentId);
    const enrollmentResult = await enrollmentQuery.maybeSingle();
    if (enrollmentResult.error || !enrollmentResult.data) {
      return json({
        success: false,
        error: "Complete the course enrollment details before starting Local Bank Transfer.",
        request_id: requestTrace,
      }, 409);
    }

    const enrollment = enrollmentResult.data as Record<string, unknown>;
    if (String(enrollment.course_type ?? "") !== "paid" || Number(enrollment.price ?? 0) <= 0) {
      return json({ success: false, error: "This is not a paid course enrollment.", request_id: requestTrace }, 400);
    }

    // Infinity Local Bank Transfer is a local-currency collection flow. The
    // website course price remains USD 200 for access/revenue reporting; the
    // provider amount is configured server-side so a USD value is never
    // accidentally treated as PKR by the hosted bank page.
    const courseCurrency = String(enrollment.currency ?? "USD").trim().toUpperCase() || "USD";
    const courseAmount = Number(enrollment.price ?? 0);
    let providerAmount = courseAmount;
    let providerCurrency = courseCurrency;
    if (courseCurrency !== "PKR") {
      providerAmount = Number(INFINITY_ADVANCED_COURSE_AMOUNT);
      providerCurrency = INFINITY_PROVIDER_CURRENCY;
      if (!Number.isFinite(providerAmount) || providerAmount <= 0) {
        return json({
          success: false,
          error: "Local Bank Transfer amount is not configured. Set INFINITY_ADVANCED_COURSE_AMOUNT in Supabase Secrets.",
          request_id: requestTrace,
        }, 503);
      }
    }

    if (String(enrollment.payment_status ?? "") === "approved" || String(enrollment.enrollment_status ?? "") === "enrolled") {
      return json({ success: false, error: "Your paid course access is already active.", already_approved: true, request_id: requestTrace }, 409);
    }

    const prep = await service.rpc("prepare_infinity_payment", {
      p_user_id: user.id,
      p_enrollment_id: String(enrollment.id),
      p_course_key: "advanced",
      p_provider_amount: providerAmount,
      p_provider_currency: providerCurrency,
    });
    if (prep.error) throw new Error(prep.error.message);
    const payment = Array.isArray(prep.data) ? prep.data[0] : prep.data;
    if (!payment?.request_id) throw new Error("Could not prepare the Local Bank Transfer request.");

    if (payment.reused) {
      if (payment.redirect_url) {
        return json({
          success: true,
          reused: true,
          request_id: payment.request_id,
          redirect_url: payment.redirect_url,
          provider_amount: payment.amount,
          provider_currency: payment.currency,
        });
      }

      // Another request for the same student/course may already be creating the
      // hosted link. Wait briefly for that same request_id instead of creating a
      // second provider request. This closes the double-click/concurrent-tab gap.
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        const current = await service
          .from("course_payments")
          .select("status,provider_status,provider_redirect_url,provider_last_error")
          .eq("id", payment.payment_id)
          .maybeSingle();
        const row = current.data as Record<string, unknown> | null;
        const redirect = String(row?.provider_redirect_url ?? "").trim();
        if (redirect) {
          return json({
            success: true,
            reused: true,
            request_id: payment.request_id,
            redirect_url: redirect,
            provider_amount: payment.amount,
            provider_currency: payment.currency,
          });
        }
        if (["failed", "declined"].includes(String(row?.status ?? "").toLowerCase())) {
          return json({
            success: false,
            error: String(row?.provider_last_error ?? "The Local Bank Transfer request could not be created."),
            request_id: requestTrace,
          }, 502);
        }
      }
      return json({
        success: false,
        error: "Your Local Bank Transfer is already being prepared. Please wait a few seconds and try again.",
        request_id: requestTrace,
      }, 409);
    }

    const requestId = String(payment.request_id);
    const callbackToken = await hmacHex(INFINITY_CALLBACK_SECRET, requestId);
    const callbackUrl = `${SUPABASE_URL}/functions/v1/infinity-payment-callback?token=${encodeURIComponent(callbackToken)}`;
    const returnUrl = `${SITE_URL}/my-courses/?payment=return&course=advanced`;

    const customerName = String(
      enrollment.full_name ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      "PipSePaisa Student"
    ).trim();

    const form = new FormData();
    form.set("request_id", requestId);
    form.set("name", customerName || "PipSePaisa Student");
    form.set("amount", Number(payment.amount).toFixed(2));
    form.set("callbackurl", callbackUrl);
    form.set("customer_return_url", returnUrl);

    let providerResponse: Response;
    let providerPayload: unknown = null;
    try {
      providerResponse = await fetch(`${INFINITY_API_BASE_URL}/create-request`, {
        method: "POST",
        headers: { "X-API-Key": INFINITY_API_KEY },
        body: form,
      });
      const raw = await providerResponse.text();
      try { providerPayload = raw ? JSON.parse(raw) : {}; }
      catch { providerPayload = { message: raw }; }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Infinity API connection failed.";
      await service.from("course_payments").update({
        status: "failed",
        provider_status: "failed",
        provider_last_error: message,
        updated_at: new Date().toISOString(),
      }).eq("id", payment.payment_id);
      await service.from("course_enrollments").update({
        provider_status: "failed",
        provider_last_error: message,
      }).eq("id", enrollment.id);
      throw new Error(message);
    }

    const redirectUrl = firstRedirect(providerPayload);
    if (!providerResponse.ok || !redirectUrl) {
      const providerMessage = String(
        (providerPayload as Record<string, unknown> | null)?.message ??
        (providerPayload as Record<string, unknown> | null)?.error ??
        `Infinity request failed (${providerResponse.status}).`
      );
      await service.from("course_payments").update({
        status: "failed",
        provider_status: "failed",
        provider_last_error: providerMessage,
        updated_at: new Date().toISOString(),
      }).eq("id", payment.payment_id);
      await service.from("course_enrollments").update({
        provider_status: "failed",
        provider_last_error: providerMessage,
      }).eq("id", enrollment.id);
      return json({ success: false, error: providerMessage, request_id: requestTrace }, 502);
    }

    await service.from("course_payments").update({
      provider_status: "initiated",
      provider_redirect_url: redirectUrl,
      provider_last_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", payment.payment_id);

    await service.from("course_enrollments").update({
      payment_method: "Local Bank Transfer",
      payment_provider: "infinity",
      provider_request_id: Number(payment.request_id),
      provider_status: "initiated",
      provider_redirect_url: redirectUrl,
      provider_last_error: null,
      transaction_id: requestId,
    }).eq("id", enrollment.id);

    return json({
      success: true,
      reused: false,
      request_id: payment.request_id,
      redirect_url: redirectUrl,
      provider_amount: payment.amount,
      provider_currency: payment.currency,
    });
  } catch (error) {
    console.error(`[${requestTrace}] create-infinity-payment failed`, error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Could not start Local Bank Transfer.",
      request_id: requestTrace,
    }, 500);
  }
});
