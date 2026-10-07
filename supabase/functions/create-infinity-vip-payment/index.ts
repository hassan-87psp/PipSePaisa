/* PipSePaisa V446 — automatic Infinity checkout for VIP/Premium plans. */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const INFINITY_API_KEY = Deno.env.get("INFINITY_API_KEY") ?? "";
const INFINITY_API_BASE_URL = (Deno.env.get("INFINITY_API_BASE_URL") ?? "https://api.infinitymoneysolutions.com").replace(/\/$/, "");
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://www.pipsepaisa.com").replace(/\/$/, "");
const PROVIDER_CURRENCY = (Deno.env.get("INFINITY_PROVIDER_CURRENCY") ?? "PKR").trim().toUpperCase() || "PKR";
const WINDOW_MS = 20 * 60 * 1000;
const VERSION = "v446";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
function required() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !INFINITY_API_KEY) {
    throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  }
}
function firstRedirect(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as Record<string, unknown>;
  for (const key of ["redirect_url","redirectUrl","payment_url","paymentUrl","checkout_url","checkoutUrl","url","link"]) {
    const v = p[key];
    if (typeof v === "string" && /^https?:\/\//i.test(v.trim())) return v.trim();
  }
  for (const key of ["data","result","response","payload"]) {
    const v = p[key];
    if (v && typeof v === "object") {
      const found = firstRedirect(v);
      if (found) return found;
    }
  }
  return "";
}
function safeMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const p = payload as Record<string, unknown>;
  for (const key of ["message","error","detail","status_message"]) {
    const v = p[key];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0,500);
  }
  return fallback;
}
function hex(bytes: number) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(data, b => b.toString(16).padStart(2,"0")).join("");
}
async function uniqueRequestId(service: ReturnType<typeof createClient>) {
  for (let i=0;i<12;i++) {
    const candidate = String(Math.floor(100000000 + Math.random()*900000000));
    const [course, vip] = await Promise.all([
      service.from("course_payments").select("id").eq("provider","infinity").eq("provider_request_id",candidate).limit(1).maybeSingle(),
      service.from("payment_requests").select("id").eq("provider","infinity").eq("provider_request_id",candidate).limit(1).maybeSingle(),
    ]);
    if (!course.error && !vip.error && !course.data && !vip.data) return candidate;
  }
  throw new Error("REQUEST_ID_GENERATION_FAILED");
}
function waiting(v: unknown) {
  return ["initiated","created","submitted","pending","processing","waiting","awaiting","in_process","queued"].includes(String(v??"").toLowerCase());
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok",{headers:corsHeaders});
  if (req.method !== "POST") return json({success:false,error:"Only POST is allowed.",version:VERSION},405);

  const trace = crypto.randomUUID();
  try {
    required();
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({success:false,error:"Authentication required.",code:"AUTH_REQUIRED",version:VERSION},401);

    const userClient = createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{global:{headers:{Authorization:auth}}});
    const service = createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
    const {data:{user},error:userError} = await userClient.auth.getUser();
    if (userError || !user) return json({success:false,error:"Your login session is invalid or expired.",code:"AUTH_SESSION_INVALID",version:VERSION},401);

    let body: Record<string,unknown> = {};
    try { body = await req.json(); } catch {}
    const planId = String(body.plan_id ?? "").trim();
    if (!planId) return json({success:false,error:"VIP plan is required.",code:"PLAN_REQUIRED",version:VERSION},400);

    const [profileR, planR, methodR] = await Promise.all([
      service.from("profiles").select("id,full_name,email,mentor_id,is_active").eq("id",user.id).single(),
      service.from("subscription_plans").select("*").eq("id",planId).single(),
      service.from("payment_methods").select("id,type,label,enabled").eq("type","infinity").eq("enabled",true).limit(1).maybeSingle(),
    ]);
    if (profileR.error || !profileR.data) return json({success:false,error:"Profile not found.",code:"PROFILE_MISSING",version:VERSION},404);
    if (profileR.data.is_active === false) return json({success:false,error:"This account is not active.",code:"ACCOUNT_INACTIVE",version:VERSION},403);
    if (planR.error || !planR.data) return json({success:false,error:"VIP plan not found.",code:"PLAN_MISSING",version:VERSION},404);
    if (!methodR.data) return json({success:false,error:"Local Bank Transfer is temporarily unavailable.",code:"LOCAL_BANK_DISABLED",version:VERSION},503);

    const plan = planR.data as Record<string,unknown>;
    if (plan.is_active === false) return json({success:false,error:"This VIP plan is not active.",code:"PLAN_INACTIVE",version:VERSION},409);
    const mentorId = String(profileR.data.mentor_id ?? "");
    const ownerId = String(plan.owner_id ?? "");
    if (plan.is_official !== true && (!mentorId || ownerId !== mentorId)) {
      return json({success:false,error:"This VIP plan is not available for your account.",code:"PLAN_NOT_AVAILABLE",version:VERSION},403);
    }

    const planAmount = Number(plan.price ?? 0);
    const planCurrency = String(plan.currency ?? "USD").toUpperCase();
    let providerAmount = Number(plan.local_bank_price_pkr ?? 0);
    if ((!Number.isFinite(providerAmount) || providerAmount<=0) && planCurrency===PROVIDER_CURRENCY) providerAmount=planAmount;
    if (!Number.isFinite(planAmount) || planAmount<=0) return json({success:false,error:"VIP plan price is not configured.",code:"PLAN_PRICE_INVALID",version:VERSION},409);
    if (!Number.isFinite(providerAmount) || providerAmount<=0) {
      return json({success:false,error:"Local Bank price is not configured for this VIP plan. Please use USDT or contact support.",code:"LOCAL_BANK_PRICE_MISSING",version:VERSION},409);
    }

    const latest = await service.from("payment_requests")
      .select("*")
      .eq("user_id",user.id).eq("plan_id",planId).eq("provider","infinity")
      .order("created_at",{ascending:false}).limit(1).maybeSingle();
    if (!latest.error && latest.data) {
      const row = latest.data as Record<string,unknown>;
      const exp = Date.parse(String(row.provider_expires_at ?? ""));
      const redirect = String(row.provider_redirect_url ?? "");
      if (waiting(row.provider_status ?? row.status) && redirect && Number.isFinite(exp) && exp>Date.now()) {
        return json({success:true,reused:true,request_id:row.provider_request_id,redirect_url:redirect,expires_at:row.provider_expires_at,provider_amount:row.provider_amount,provider_currency:row.provider_currency,version:VERSION});
      }
    }

    const requestId = await uniqueRequestId(service);
    const callbackToken = hex(32);
    const expiresAt = new Date(Date.now()+WINDOW_MS).toISOString();
    const duration = Math.max(1,Number(plan.duration_days ?? 30) || 30);

    const inserted = await service.from("payment_requests").insert({
      user_id:user.id,
      mentor_id:profileR.data.mentor_id ?? null,
      plan_id:planId,
      payment_method_id:methodR.data.id,
      plan_name:String(plan.name ?? "VIP Plan"),
      duration_days:duration,
      amount:planAmount,
      currency:planCurrency,
      request_type:"payment",
      method_type:"infinity",
      status:"pending",
      provider:"infinity",
      provider_request_id:Number(requestId),
      provider_status:"initiated",
      provider_amount:providerAmount,
      provider_currency:PROVIDER_CURRENCY,
      provider_callback_token:callbackToken,
      provider_expires_at:expiresAt,
      provider_last_error:null,
      transaction_id:requestId,
    }).select("id").single();

    if (inserted.error || !inserted.data) {
      console.error("[VIP Infinity] request row create failed",inserted.error);
      return json({success:false,error:"VIP payment could not start right now.",code:"PAYMENT_ROW_CREATE_FAILED",version:VERSION},503);
    }

    const callbackUrl = `${SUPABASE_URL}/functions/v1/infinity-vip-payment-callback/${encodeURIComponent(callbackToken)}?token=${encodeURIComponent(callbackToken)}`;
    const returnUrl = `${SITE_URL}/?tab=vipplans&payment=return&vip_request=${encodeURIComponent(requestId)}`;
    const form = new FormData();
    form.set("request_id",requestId);
    form.set("name",String(profileR.data.full_name ?? user.email?.split("@")[0] ?? "PipSePaisa Member"));
    form.set("amount",providerAmount.toFixed(2));
    form.set("callbackurl",callbackUrl);
    form.set("customer_return_url",returnUrl);

    let providerResponse: Response;
    let providerPayload: unknown = {};
    try {
      providerResponse = await fetch(`${INFINITY_API_BASE_URL}/create-request`,{method:"POST",headers:{"X-API-Key":INFINITY_API_KEY},body:form});
      const raw = await providerResponse.text();
      try { providerPayload = raw ? JSON.parse(raw) : {}; } catch { providerPayload = {message:raw}; }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Provider connection failed.";
      await service.from("payment_requests").update({status:"failed",provider_status:"failed",provider_last_error:message,updated_at:new Date().toISOString()}).eq("id",inserted.data.id);
      return json({success:false,error:"Local Bank Transfer is temporarily unavailable.",code:"PAYMENT_PROVIDER_CONNECTION_FAILED",version:VERSION},502);
    }

    const redirect = firstRedirect(providerPayload) || String(providerResponse.headers.get("location") ?? "").trim();
    if (!providerResponse.ok || !redirect) {
      const message = safeMessage(providerPayload,`Infinity request failed (${providerResponse.status}).`);
      await service.from("payment_requests").update({status:"failed",provider_status:"failed",provider_last_error:message,updated_at:new Date().toISOString()}).eq("id",inserted.data.id);
      return json({success:false,error:"Local Bank Transfer could not start. Please use USDT or try again later.",code:"PAYMENT_PROVIDER_REQUEST_FAILED",version:VERSION},502);
    }

    await service.from("payment_requests").update({
      provider_status:"initiated",
      provider_redirect_url:redirect,
      provider_last_error:null,
      updated_at:new Date().toISOString(),
    }).eq("id",inserted.data.id);

    return json({success:true,reused:false,request_id:requestId,redirect_url:redirect,expires_at:expiresAt,provider_amount:providerAmount,provider_currency:PROVIDER_CURRENCY,version:VERSION});
  } catch (error) {
    console.error(`[${trace}] create-infinity-vip-payment failed`,error);
    const raw = error instanceof Error ? error.message : String(error);
    return json({success:false,error:raw==="PAYMENT_PROVIDER_NOT_CONFIGURED"?"Local Bank Transfer is temporarily unavailable.":"VIP payment could not start right now.",code:raw,version:VERSION},500);
  }
});