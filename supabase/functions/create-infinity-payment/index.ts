/* PipSePaisa V230 — fast automatic-only Infinity checkout.
 * Local Bank is provider-managed: no Admin approval/rejection path.
 *
 * Key design decision: this function does NOT call prepare_infinity_payment().
 * The previous V224/V225 checkout depended on that RPC and production failures
 * inside the RPC surfaced only as the generic Local Bank error. V226 restores
 * the stable direct Edge Function architecture while preserving the existing
 * Infinity callback contract.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const INFINITY_API_KEY = Deno.env.get("INFINITY_API_KEY") ?? "";
const INFINITY_API_BASE_URL = (Deno.env.get("INFINITY_API_BASE_URL") ?? "https://api.infinitymoneysolutions.com").replace(/\/$/, "");
const INFINITY_PROVIDER_CURRENCY = (Deno.env.get("INFINITY_PROVIDER_CURRENCY") ?? "PKR").trim().toUpperCase() || "PKR";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://www.pipsepaisa.com").replace(/\/$/, "");
const VERSION = "v230";
const PAYMENT_WINDOW_MS = 20 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-PipSePaisa-Payment-Version": VERSION,
    },
  });
}

function canonicalCourseKey(value: unknown) {
  const key = String(value ?? "advanced").trim().toLowerCase().replaceAll("_", "-");
  return key === "advanced-fundamental" ? "advance-fundamental" : key;
}

function requiredConfig() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY/SUPABASE_PUBLISHABLE_KEY");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY");
  if (!INFINITY_API_KEY) missing.push("INFINITY_API_KEY");
  if (missing.length) {
    console.error("create-infinity-payment V230 configuration incomplete:", missing.join(", "));
    throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  }
}

function firstRedirect(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as Record<string, unknown>;
  for (const key of ["redirect_url", "redirectUrl", "payment_url", "paymentUrl", "checkout_url", "checkoutUrl", "url", "link"]) {
    const value = p[key];
    if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) return value.trim();
  }
  for (const key of ["data", "result", "response", "payload"]) {
    const nested = p[key];
    if (nested && typeof nested === "object") {
      const found = firstRedirect(nested);
      if (found) return found;
    }
  }
  return "";
}

function safeProviderMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const p = payload as Record<string, unknown>;
  const value = p.message ?? p.error ?? p.detail ?? p.status_message;
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : fallback;
}

function ageMs(value: unknown) {
  const stamp = Date.parse(String(value ?? ""));
  return Number.isFinite(stamp) ? Math.max(0, Date.now() - stamp) : Number.POSITIVE_INFINITY;
}

function successfulStatus(value: unknown) {
  return ["accepted", "approved", "success", "successful", "completed", "complete", "paid", "captured", "confirmed", "verified", "settled"].includes(String(value ?? "").trim().toLowerCase());
}

function activeEnrollmentEvidence(enrollment: Record<string, unknown>, providerRows: Record<string, unknown>[]) {
  const statusClaimsActive = String(enrollment.payment_status ?? "").toLowerCase() === "approved" ||
    String(enrollment.enrollment_status ?? "").toLowerCase() === "enrolled";
  if (!statusClaimsActive) return false;

  // Strong evidence that access was intentionally granted. This prevents a stale
  // status left by an interrupted old checkout from blocking payment forever.
  if (enrollment.access_granted_at || enrollment.reviewed_at || enrollment.reviewed_by || enrollment.admin_added_by || enrollment.manual_added_at) return true;
  const source = String(enrollment.enrollment_source ?? "").toLowerCase();
  if (["manual", "admin", "admin_added", "manual_admin"].some((x) => source.includes(x))) return true;
  return providerRows.some((p) => successfulStatus(p.status) || successfulStatus(p.provider_status));
}

function cryptoHex(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(data, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function uniqueRequestId(service: ReturnType<typeof createClient>) {
  // Infinity/PipSePaisa historically uses a 9-digit numeric request id.
  const min = 100000001;
  const span = 899999999;
  for (let attempt = 0; attempt < 16; attempt++) {
    const raw = crypto.getRandomValues(new Uint32Array(1))[0];
    const candidate = min + (raw % span);
    const check = await service
      .from("course_payments")
      .select("id")
      .eq("provider", "infinity")
      .eq("provider_request_id", candidate)
      .limit(1)
      .maybeSingle();
    if (!check.error && !check.data) return candidate;
    if (check.error) throw new Error(`REQUEST_ID_LOOKUP_FAILED: ${check.error.message}`);
  }
  throw new Error("REQUEST_ID_GENERATION_FAILED");
}

async function historicalProviderAmount(
  service: ReturnType<typeof createClient>,
  courseKey: string,
  currentCourseAmount: number,
) {
  const recent = await service
    .from("course_payments")
    .select("course_amount,amount,currency,created_at")
    .eq("provider", "infinity")
    .eq("course_key", courseKey)
    .order("created_at", { ascending: false })
    .limit(10);
  if (!recent.error) {
    for (const row of recent.data ?? []) {
      const oldCourse = Number((row as Record<string, unknown>).course_amount ?? 0);
      const oldProvider = Number((row as Record<string, unknown>).amount ?? 0);
      const oldCurrency = String((row as Record<string, unknown>).currency ?? "PKR").toUpperCase();
      if (oldCurrency === INFINITY_PROVIDER_CURRENCY && oldCourse > 0 && oldProvider > 0 && currentCourseAmount > 0) {
        return Math.round((oldProvider / oldCourse) * currentCourseAmount * 100) / 100;
      }
    }
  }
  return 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Only POST is allowed.", code: "METHOD_NOT_ALLOWED", version: VERSION }, 405);

  const trace = crypto.randomUUID();
  let phase = "boot";

  try {
    requiredConfig();

    phase = "auth";
    const authorization = req.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return json({ success: false, error: "Authentication required.", code: "AUTH_REQUIRED", phase, request_id: trace, version: VERSION }, 401);
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
      console.warn(`[${trace}] invalid auth session`, userError);
      return json({ success: false, error: "Your login session is invalid or expired.", code: "AUTH_SESSION_INVALID", phase, request_id: trace, version: VERSION }, 401);
    }

    phase = "request";
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const courseId = canonicalCourseKey(body.course_id ?? body.course_key ?? "advanced");
    const requestedEnrollmentId = String(body.enrollment_id ?? "").trim();
    if (!['advanced', 'advance-fundamental'].includes(courseId)) {
      return json({ success: false, error: "Local Bank Transfer is not enabled for this course.", code: "COURSE_NOT_LOCAL_BANK_ELIGIBLE", phase, request_id: trace, version: VERSION }, 400);
    }

    // V229 speed: these three independent reads used to run sequentially.
    // Running them together removes two database round-trips before Infinity is called.
    phase = "bootstrap";
    const [profileResult, method, catalog] = await Promise.all([
      service.from("profiles").select("*").eq("id", user.id).limit(1).maybeSingle(),
      service.from("payment_methods").select("id,enabled,system_key,type").eq("system_key", "infinity_local_bank").eq("enabled", true).limit(1).maybeSingle(),
      service.from("courses").select("*").order("display_order", { ascending: true }),
    ]);

    if (!profileResult.error && profileResult.data) {
      const profile = profileResult.data as Record<string, unknown>;
      const status = String(profile.status ?? "").toLowerCase();
      if (profile.is_active === false || ["disabled", "suspended", "inactive", "blocked"].includes(status)) {
        return json({ success: false, error: "This account is not active.", code: "ACCOUNT_INACTIVE", phase: "profile", request_id: trace, version: VERSION }, 403);
      }
    }

    if (method.error || !method.data) {
      console.error(`[${trace}] Infinity Local Bank method unavailable`, method.error);
      return json({ success: false, error: "Local Bank Transfer is temporarily unavailable.", code: "LOCAL_BANK_METHOD_DISABLED", phase: "payment_method", request_id: trace, version: VERSION }, 503);
    }

    if (catalog.error) {
      console.error(`[${trace}] course catalog read failed`, catalog.error);
      return json({ success: false, error: "Local Bank Transfer is temporarily unavailable.", code: "COURSE_CATALOG_READ_FAILED", phase: "course", request_id: trace, version: VERSION }, 503);
    }
    phase = "course";
    const rows = (catalog.data ?? []) as Record<string, unknown>[];
    let courseRow = rows.find((row) => canonicalCourseKey(row.course_key) === courseId) ?? null;
    if (!courseRow && courseId === "advanced") {
      courseRow = rows.find((row) => /advanced.*forex|forex.*advanced/i.test(String(row.title ?? ""))) ?? null;
    }
    if (!courseRow && courseId === "advance-fundamental") {
      courseRow = rows.find((row) => /advance(?:d)?\s+fundamental/i.test(String(row.title ?? ""))) ?? null;
    }
    if (!courseRow) {
      return json({ success: false, error: "Local Bank Transfer is temporarily unavailable.", code: "COURSE_CATALOG_MISSING", phase, request_id: trace, version: VERSION }, 503);
    }
    if (courseRow.is_published === false) {
      return json({ success: false, error: "This course is not currently published.", code: "COURSE_NOT_PUBLISHED", phase, request_id: trace, version: VERSION }, 409);
    }
    if (courseRow.enrollment_open === false || courseRow.enrollments_open === false) {
      return json({ success: false, error: "Enrollment for this course is currently closed.", code: "COURSE_ENROLLMENT_CLOSED", phase, request_id: trace, version: VERSION }, 409);
    }

    const courseAmount = Number(courseRow.price ?? 0);
    const courseCurrency = String(courseRow.currency ?? "USD").trim().toUpperCase() || "USD";
    if (!Number.isFinite(courseAmount) || courseAmount <= 0) {
      return json({ success: false, error: "This paid course does not have a valid current price.", code: "COURSE_PRICE_INVALID", phase, request_id: trace, version: VERSION }, 409);
    }

    phase = "provider_price";
    let providerAmount = Number(courseRow.local_bank_price_pkr ?? 0);
    if ((!Number.isFinite(providerAmount) || providerAmount <= 0) && courseCurrency === INFINITY_PROVIDER_CURRENCY) providerAmount = courseAmount;
    if (!Number.isFinite(providerAmount) || providerAmount <= 0) {
      providerAmount = await historicalProviderAmount(service, courseId, courseAmount);
    }
    if ((!Number.isFinite(providerAmount) || providerAmount <= 0) && courseId === "advance-fundamental") {
      const advanced = rows.find((row) => canonicalCourseKey(row.course_key) === "advanced") ?? null;
      if (advanced) {
        const baseCourse = Number(advanced.price ?? 0);
        let baseProvider = Number(advanced.local_bank_price_pkr ?? 0);
        if ((!Number.isFinite(baseProvider) || baseProvider <= 0) && baseCourse > 0) {
          baseProvider = await historicalProviderAmount(service, "advanced", baseCourse);
        }
        if (baseCourse > 0 && baseProvider > 0) providerAmount = Math.round((baseProvider / baseCourse) * courseAmount * 100) / 100;
      }
    }
    if (!Number.isFinite(providerAmount) || providerAmount <= 0) {
      console.error(`[${trace}] Local Bank provider amount is missing for ${courseId}`);
      return json({ success: false, error: "Local Bank Transfer price is not configured yet. Please contact support or use another payment method.", code: "LOCAL_BANK_PRICE_NOT_CONFIGURED", phase, request_id: trace, version: VERSION }, 409);
    }

    phase = "enrollment_lookup";
    let enrollmentResult;
    if (requestedEnrollmentId) {
      enrollmentResult = await service
        .from("course_enrollments")
        .select("*")
        .eq("id", requestedEnrollmentId)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!enrollmentResult.data && !enrollmentResult.error) {
        enrollmentResult = await service
          .from("course_enrollments")
          .select("*")
          .eq("user_id", user.id)
          .eq("course_key", courseId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
      }
    } else {
      enrollmentResult = await service
        .from("course_enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_key", courseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    }
    if (enrollmentResult.error) {
      console.error(`[${trace}] enrollment lookup failed`, enrollmentResult.error);
      return json({ success: false, error: "Local Bank Transfer could not start right now. Please try again later.", code: "ENROLLMENT_LOOKUP_FAILED", phase, request_id: trace, version: VERSION }, 503);
    }

    let enrollment = enrollmentResult.data as Record<string, unknown> | null;
    if (enrollment && canonicalCourseKey(enrollment.course_key) !== courseId) {
      console.warn(`[${trace}] ignored mismatched enrollment ${String(enrollment.id ?? "")}`);
      enrollment = null;
    }

    if (!enrollment) {
      phase = "enrollment_create";
      const profile = (profileResult.data ?? {}) as Record<string, unknown>;
      const customerName = String(profile.full_name ?? profile.name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "PipSePaisa Student").trim();
      const customerPhone = String(profile.whatsapp ?? profile.phone ?? user.user_metadata?.whatsapp ?? user.user_metadata?.phone ?? "").trim();
      const created = await service
        .from("course_enrollments")
        .insert({
          user_id: user.id,
          course_key: courseId,
          course_name: String(courseRow.title ?? (courseId === "advanced" ? "Advanced Forex Course" : "Advance Fundamental")),
          course_type: "paid",
          price: courseAmount,
          currency: courseCurrency,
          full_name: customerName || "PipSePaisa Student",
          email: user.email ?? null,
          whatsapp: customerPhone || null,
          experience: null,
          learning_goal: null,
          payment_method: "Local Bank Transfer",
          payment_provider: "infinity",
          payment_status: "pending",
          enrollment_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (created.error || !created.data) {
        // A race/old duplicate can hit the unique user+course index. Re-read once.
        const duplicate = await service
          .from("course_enrollments")
          .select("*")
          .eq("user_id", user.id)
          .eq("course_key", courseId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!duplicate.error && duplicate.data) {
          enrollment = duplicate.data as Record<string, unknown>;
        } else {
          console.error(`[${trace}] enrollment creation failed`, created.error, duplicate.error);
          return json({ success: false, error: "Local Bank Transfer could not start right now. Please try again later.", code: "ENROLLMENT_CREATE_FAILED", phase, request_id: trace, version: VERSION }, 503);
        }
      } else {
        enrollment = created.data as Record<string, unknown>;
      }
    }

    phase = "access_state";
    const previousPayments = await service
      .from("course_payments")
      .select("id,status,provider_status,provider_redirect_url,provider_request_id,provider_callback_token,provider_expires_at,amount,currency,course_amount,course_currency,created_at,updated_at")
      .eq("user_id", user.id)
      .eq("enrollment_id", String(enrollment.id))
      .eq("provider", "infinity")
      .order("created_at", { ascending: false })
      .limit(12);
    if (previousPayments.error) {
      console.error(`[${trace}] previous payment lookup failed`, previousPayments.error);
      return json({ success: false, error: "Local Bank Transfer could not start right now. Please try again later.", code: "PAYMENT_HISTORY_LOOKUP_FAILED", phase, request_id: trace, version: VERSION }, 503);
    }
    const paymentRows = (previousPayments.data ?? []) as Record<string, unknown>[];

    if (activeEnrollmentEvidence(enrollment, paymentRows)) {
      return json({ success: false, error: "Your paid course access is already active.", code: "COURSE_ALREADY_ACTIVE", already_approved: true, phase, request_id: trace, version: VERSION }, 409);
    }

    // Heal only a status-only stale state that has no access/admin/provider proof.
    // This is intentionally conservative and cannot revoke a genuinely evidenced approval.
    if (String(enrollment.payment_status ?? "").toLowerCase() === "approved" || String(enrollment.enrollment_status ?? "").toLowerCase() === "enrolled") {
      const healed = await service.from("course_enrollments").update({
        payment_status: "pending",
        enrollment_status: "pending",
        access_granted_at: null,
        payment_method: "Local Bank Transfer",
        payment_provider: "infinity",
        provider_status: "pending",
        provider_last_error: null,
        updated_at: new Date().toISOString(),
      }).eq("id", String(enrollment.id)).eq("user_id", user.id).select("*").single();
      if (healed.error || !healed.data) {
        console.error(`[${trace}] stale enrollment healing failed`, healed.error);
        return json({ success: false, error: "Local Bank Transfer could not start right now. Please try again later.", code: "STALE_ENROLLMENT_REPAIR_FAILED", phase, request_id: trace, version: VERSION }, 503);
      }
      enrollment = healed.data as Record<string, unknown>;
    }

    phase = "reuse";
    // Infinity hosted requests are valid for 20 minutes. Anything still waiting
    // after that window is expired automatically and can never require Admin action.
    for (const old of paymentRows) {
      const st = String(old.status ?? "").trim().toLowerCase();
      const ps = String(old.provider_status ?? "").trim().toLowerCase();
      const waiting = ["initiated","created","submitted","pending","processing","waiting","awaiting","in_process","queued"].includes(st)
        || ["initiated","created","submitted","pending","processing","waiting","awaiting","in_process","queued"].includes(ps);
      if (waiting && ageMs(old.created_at) >= PAYMENT_WINDOW_MS) {
        const expiredAt = new Date(Date.parse(String(old.created_at ?? "")) + PAYMENT_WINDOW_MS).toISOString();
        await service.from("course_payments").update({
          provider_status: "expired",
          provider_expires_at: expiredAt,
          provider_last_error: "Infinity payment window expired.",
          updated_at: new Date().toISOString(),
        }).eq("id", String(old.id));
        if (String(enrollment.provider_request_id ?? "") === String(old.provider_request_id ?? "")) {
          await service.from("course_enrollments").update({
            provider_status: "expired",
            provider_expires_at: expiredAt,
            provider_last_error: "Infinity payment window expired. Start a new Local Bank Transfer.",
            provider_redirect_url: null,
            payment_status: "pending",
            enrollment_status: "pending",
            access_granted_at: null,
            reviewed_at: null,
            reviewed_by: null,
            updated_at: new Date().toISOString(),
          }).eq("id", String(enrollment.id)).eq("user_id", user.id);
        }
      }
    }

    for (const old of paymentRows) {
      const status = String(old.status ?? "").toLowerCase();
      const providerStatus = String(old.provider_status ?? "").toLowerCase();
      const redirect = String(old.provider_redirect_url ?? "").trim();
      const sameProviderAmount = Math.abs(Number(old.amount ?? 0) - providerAmount) <= 0.01;
      const sameCourseAmount = !old.course_amount || Math.abs(Number(old.course_amount ?? 0) - courseAmount) <= 0.01;
      if (status === "initiated" && sameProviderAmount && sameCourseAmount && redirect && ageMs(old.created_at) < PAYMENT_WINDOW_MS) {
        return json({
          success: true,
          reused: true,
          request_id: old.provider_request_id,
          redirect_url: redirect,
          provider_amount: old.amount ?? providerAmount,
          provider_currency: old.currency ?? INFINITY_PROVIDER_CURRENCY,
          version: VERSION,
        });
      }
      // If another tab literally started the row a moment ago, give it a brief
      // chance to attach the provider redirect before making another provider call.
      if (status === "initiated" && !redirect && !["failed", "rejected", "declined"].includes(providerStatus) && ageMs(old.created_at) < 4000) {
        for (let attempt = 0; attempt < 3; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 220));
          const fresh = await service.from("course_payments").select("provider_redirect_url,status,provider_status,provider_last_error").eq("id", String(old.id)).limit(1).maybeSingle();
          const freshRedirect = String(fresh.data?.provider_redirect_url ?? "").trim();
          if (freshRedirect) {
            return json({ success: true, reused: true, request_id: old.provider_request_id, redirect_url: freshRedirect, provider_amount: old.amount ?? providerAmount, provider_currency: old.currency ?? INFINITY_PROVIDER_CURRENCY, version: VERSION });
          }
        }
        return json({ success: false, error: "Your Local Bank Transfer is already being prepared. Please wait a few seconds and try again.", code: "PAYMENT_ALREADY_PREPARING", phase, request_id: trace, version: VERSION }, 409);
      }
    }

    phase = "payment_row";
    const requestId = await uniqueRequestId(service);
    const callbackToken = cryptoHex(32);
    const nowDate = new Date();
    const now = nowDate.toISOString();
    const providerExpiresAt = new Date(nowDate.getTime() + PAYMENT_WINDOW_MS).toISOString();
    const paymentInsert = await service
      .from("course_payments")
      .insert({
        user_id: user.id,
        enrollment_id: String(enrollment.id),
        course_key: courseId,
        course_name: String(courseRow.title ?? (courseId === "advanced" ? "Advanced Forex Course" : "Advance Fundamental")),
        course_amount: courseAmount,
        course_currency: courseCurrency,
        amount: providerAmount,
        currency: INFINITY_PROVIDER_CURRENCY,
        payment_method: "Local Bank Transfer",
        provider: "infinity",
        provider_request_id: requestId,
        provider_status: "initiated",
        status: "initiated",
        provider_callback_token: callbackToken,
        provider_redirect_url: null,
        provider_last_error: null,
        provider_expires_at: providerExpiresAt,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();
    if (paymentInsert.error || !paymentInsert.data) {
      console.error(`[${trace}] payment row insert failed`, paymentInsert.error);
      return json({ success: false, error: "Local Bank Transfer could not start right now. Please try again later.", code: "PAYMENT_ROW_CREATE_FAILED", phase, request_id: trace, version: VERSION }, 503);
    }
    const payment = paymentInsert.data as Record<string, unknown>;

    const updateEnrollment = async (fields: Record<string, unknown>) => {
      const result = await service.from("course_enrollments").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", String(enrollment!.id)).eq("user_id", user.id);
      if (result.error) console.warn(`[${trace}] enrollment provider-state update warning`, result.error);
      return result;
    };

    const preProviderEnrollment = await updateEnrollment({
      course_name: String(courseRow.title ?? enrollment.course_name ?? "PipSePaisa Paid Course"),
      course_type: "paid",
      price: courseAmount,
      currency: courseCurrency,
      payment_method: "Local Bank Transfer",
      payment_provider: "infinity",
      provider_request_id: requestId,
      provider_status: "initiated",
      provider_redirect_url: null,
      provider_rejection_reason: null,
      provider_callback_at: null,
      provider_last_error: null,
      provider_expires_at: providerExpiresAt,
      payment_status: "pending",
      enrollment_status: "pending",
      access_granted_at: null,
      rejection_reason: null,
      transaction_id: String(requestId),
    });
    if (preProviderEnrollment.error) {
      await service.from("course_payments").update({ status: "failed", provider_status: "failed", provider_last_error: preProviderEnrollment.error.message, updated_at: new Date().toISOString() }).eq("id", String(payment.id));
      return json({ success: false, error: "Local Bank Transfer could not start right now. Please try again later.", code: "ENROLLMENT_PROVIDER_STATE_FAILED", phase, request_id: trace, version: VERSION }, 503);
    }

    phase = "provider_create_request";
    const callbackUrl = `${SUPABASE_URL}/functions/v1/infinity-payment-callback/${encodeURIComponent(callbackToken)}?token=${encodeURIComponent(callbackToken)}`;
    const returnUrl = `${SITE_URL}/my-courses/?payment=return&course=${encodeURIComponent(courseId)}`;
    const customerName = String(enrollment.full_name ?? profileResult.data?.full_name ?? profileResult.data?.name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "PipSePaisa Student").trim();

    const form = new FormData();
    form.set("request_id", String(requestId));
    form.set("name", customerName || "PipSePaisa Student");
    form.set("amount", providerAmount.toFixed(2));
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
      const message = error instanceof Error ? error.message : "Provider connection failed.";
      console.error(`[${trace}] Infinity connection failed`, error);
      await Promise.all([
        service.from("course_payments").update({ status: "failed", provider_status: "failed", provider_last_error: message, updated_at: new Date().toISOString() }).eq("id", String(payment.id)),
        updateEnrollment({ provider_status: "failed", provider_last_error: message }),
      ]);
      return json({ success: false, error: "Local Bank Transfer is temporarily unavailable. Please try again in a few moments.", code: "PAYMENT_PROVIDER_CONNECTION_FAILED", phase, request_id: trace, version: VERSION }, 502);
    }

    const redirectUrl = firstRedirect(providerPayload) || String(providerResponse.headers.get("location") ?? "").trim();
    if (!providerResponse.ok || !redirectUrl) {
      const providerMessage = safeProviderMessage(providerPayload, `Infinity request failed (${providerResponse.status}).`);
      console.error(`[${trace}] Infinity create-request rejected`, { http: providerResponse.status, providerMessage, payload: providerPayload });
      await Promise.all([
        service.from("course_payments").update({ status: "failed", provider_status: "failed", provider_last_error: providerMessage, updated_at: new Date().toISOString() }).eq("id", String(payment.id)),
        updateEnrollment({ provider_status: "failed", provider_last_error: providerMessage }),
      ]);
      return json({
        success: false,
        error: "Local Bank Transfer could not start right now. Please try again later.",
        code: "PAYMENT_PROVIDER_REQUEST_FAILED",
        phase,
        provider_http_status: providerResponse.status,
        provider_message: providerMessage,
        request_id: trace,
        provider_request_id: requestId,
        version: VERSION,
      }, 502);
    }

    phase = "persist_redirect";
    const [paymentSaved, enrollmentSaved] = await Promise.all([
      service.from("course_payments").update({ provider_status: "initiated", provider_redirect_url: redirectUrl, provider_last_error: null, updated_at: new Date().toISOString() }).eq("id", String(payment.id)),
      updateEnrollment({ provider_status: "initiated", provider_redirect_url: redirectUrl, provider_last_error: null, transaction_id: String(requestId) }),
    ]);
    if (paymentSaved.error || enrollmentSaved.error) {
      // The hosted link is already valid. Return it rather than charging the user
      // twice because a non-critical local persistence update failed.
      console.error(`[${trace}] redirect persistence warning`, paymentSaved.error, enrollmentSaved.error);
    }

    return json({
      success: true,
      reused: false,
      request_id: requestId,
      redirect_url: redirectUrl,
      provider_amount: providerAmount,
      provider_currency: INFINITY_PROVIDER_CURRENCY,
      course_key: courseId,
      expires_at: providerExpiresAt,
      version: VERSION,
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error ?? "Unknown payment error");
    console.error(`[${trace}] create-infinity-payment V230 failed at ${phase}`, error);
    const config = raw === "PAYMENT_PROVIDER_NOT_CONFIGURED";
    return json({
      success: false,
      error: config ? "Local Bank Transfer is temporarily unavailable. Please try another payment method or try again later." : "Local Bank Transfer could not start right now. Please try again later.",
      code: config ? "PAYMENT_PROVIDER_NOT_CONFIGURED" : "PAYMENT_START_FAILED",
      phase,
      request_id: trace,
      version: VERSION,
    }, 500);
  }
});
