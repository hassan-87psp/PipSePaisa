import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ZOOM_ACCOUNT_ID = Deno.env.get("ZOOM_ACCOUNT_ID") ?? "";
const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID") ?? "";
const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WEBINARS = [
  { class_no: 1, title: "Introduction to Forex Trading", webinar_id: "95218229808", scheduled_at: "2026-08-10T21:00:00+05:00" },
  { class_no: 2, title: "Candlestick Patterns and Price Behaviour", webinar_id: "99634407954", scheduled_at: "2026-08-11T21:00:00+05:00" },
  { class_no: 3, title: "Market Sentiment Analysis", webinar_id: "95989125870", scheduled_at: "2026-08-13T21:00:00+05:00" },
  { class_no: 4, title: "Trading Psychology and Risk Management", webinar_id: "91008283331", scheduled_at: "2026-08-17T21:00:00+05:00" },
  { class_no: 5, title: "Foundations of Technical Analysis", webinar_id: "95576754571", scheduled_at: "2026-08-18T21:00:00+05:00" },
  { class_no: 6, title: "Understanding Technical Indicators", webinar_id: "92765710480", scheduled_at: "2026-08-20T21:00:00+05:00" },
  { class_no: 7, title: "Fundamentals of Fundamental Analysis", webinar_id: "94186031860", scheduled_at: "2026-08-24T21:00:00+05:00" },
  { class_no: 8, title: "Trading Strategies — Part 1", webinar_id: "92146765977", scheduled_at: "2026-08-25T21:00:00+05:00" },
  { class_no: 9, title: "Trading Strategies — Part 2", webinar_id: "97711722838", scheduled_at: "2026-08-27T18:00:00+05:00" },
] as const;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requireConfig(): void {
  const missing: string[] = [];
  if (!ZOOM_ACCOUNT_ID) missing.push("ZOOM_ACCOUNT_ID");
  if (!ZOOM_CLIENT_ID) missing.push("ZOOM_CLIENT_ID");
  if (!ZOOM_CLIENT_SECRET) missing.push("ZOOM_CLIENT_SECRET");
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length) {
    throw new Error(`Missing secrets: ${missing.join(", ")}`);
  }
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const clean = fullName.trim().replace(/\s+/g, " ");
  if (!clean) return { firstName: "PipSePaisa", lastName: "Student" };

  const parts = clean.split(" ");
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || "Student",
  };
}

async function getZoomAccessToken(): Promise<string> {
  const basicAuth = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);
  const tokenUrl = new URL("https://zoom.us/oauth/token");
  tokenUrl.searchParams.set("grant_type", "account_credentials");
  tokenUrl.searchParams.set("account_id", ZOOM_ACCOUNT_ID);

  const response = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const data = await response.json();

  if (!response.ok || !data?.access_token) {
    console.error("Zoom token error:", data);
    throw new Error(
      data?.reason ||
      data?.error_description ||
      data?.error ||
      "Could not get Zoom access token.",
    );
  }

  return String(data.access_token);
}

async function registerForWebinar(args: {
  accessToken: string;
  webinarId: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const response = await fetch(
    `https://api.zoom.us/v2/webinars/${args.webinarId}/registrants`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: args.email,
        first_name: args.firstName,
        last_name: args.lastName,
      }),
    },
  );

  let data: Record<string, unknown> = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return { ok: response.ok, status: response.status, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Only POST requests are allowed." },
      405,
    );
  }

  try {
    requireConfig();

    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(
        { success: false, error: "Please sign in first." },
        401,
      );
    }

    const userAccessToken = authorization.replace("Bearer ", "").trim();

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(userAccessToken);

    if (userError || !user?.email) {
      return jsonResponse(
        { success: false, error: "Your login session is invalid or expired." },
        401,
      );
    }

    let body: { full_name?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const fullName =
      body.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "PipSePaisa Student";

    const { firstName, lastName } = splitName(fullName);
    const zoomAccessToken = await getZoomAccessToken();

    const results = [];

    for (const webinar of WEBINARS) {
      const registration = await registerForWebinar({
        accessToken: zoomAccessToken,
        webinarId: webinar.webinar_id,
        email: user.email,
        firstName,
        lastName,
      });

      results.push({
        class_no: webinar.class_no,
        title: webinar.title,
        webinar_id: webinar.webinar_id,
        scheduled_at: webinar.scheduled_at,
        success: registration.ok,
        http_status: registration.status,
        zoom_code: registration.data?.code ?? null,
        message: registration.data?.message ?? null,
        registrant_id: registration.data?.registrant_id ?? null,
        join_url: registration.data?.join_url ?? null,
      });
    }

    const successful = results.filter((item) => item.success).length;
    const failed = results.length - successful;

    console.log("Zoom registration summary", {
      user_id: user.id,
      email: user.email,
      successful,
      failed,
    });

    return jsonResponse(
      {
        success: failed === 0,
        message:
          failed === 0
            ? "Student registered for all Zoom webinars."
            : "Some webinar registrations need attention.",
        email: user.email,
        successful,
        failed,
        results,
      },
      failed === 0 ? 200 : 207,
    );
  } catch (error) {
    console.error("zoom-register-course error:", error);

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected Zoom registration error.",
      },
      500,
    );
  }
});
