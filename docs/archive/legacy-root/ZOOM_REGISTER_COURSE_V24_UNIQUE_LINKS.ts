import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ZOOM_ACCOUNT_ID = Deno.env.get("ZOOM_ACCOUNT_ID") ?? "";
const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID") ?? "";
const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVER_KEY =
  Deno.env.get("SUPABASE_SECRET_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";

const COURSE_KEY = "basic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Webinar = {
  course_key: string;
  class_number: number;
  title: string;
  webinar_id: string;
  scheduled_at: string | null;
};

type ZoomResponse = Record<string, unknown>;

const FALLBACK_WEBINARS: Webinar[] = [
  { course_key: COURSE_KEY, class_number: 1, title: "FINANCIAL MARKETS BLUEPRINT", webinar_id: "95218229808", scheduled_at: "2026-08-10T21:00:00+05:00" },
  { course_key: COURSE_KEY, class_number: 2, title: "THE LANGUAGE OF PRICE INTELLIGENCE", webinar_id: "99634407954", scheduled_at: "2026-08-13T21:00:00+05:00" },
  { course_key: COURSE_KEY, class_number: 3, title: "DECODING AND DISSECTING CANDLESTICKS", webinar_id: "95989125870", scheduled_at: "2026-08-15T21:00:00+05:00" },
  { course_key: COURSE_KEY, class_number: 4, title: "EXPLORING TRADER'S TOOLKIT", webinar_id: "91008283331", scheduled_at: "2026-08-17T21:00:00+05:00" },
  { course_key: COURSE_KEY, class_number: 5, title: "TRADING WITH MARKET PULSE", webinar_id: "95576754571", scheduled_at: "2026-08-18T21:00:00+05:00" },
  { course_key: COURSE_KEY, class_number: 6, title: "UNDERSTANDING REAL MARKET DRIVERS", webinar_id: "92765710480", scheduled_at: "2026-08-20T21:00:00+05:00" },
  { course_key: COURSE_KEY, class_number: 7, title: "ULTIMATE SUCCESS CODE — THE MINDSET", webinar_id: "94186031860", scheduled_at: "2026-08-24T21:00:00+05:00" },
  { course_key: COURSE_KEY, class_number: 8, title: "BUILDING YOUR TRADING EDGE", webinar_id: "92146765977", scheduled_at: "2026-08-25T21:00:00+05:00" },
  { course_key: COURSE_KEY, class_number: 9, title: "MASTER THE ART OF TRADING", webinar_id: "97711722838", scheduled_at: "2026-08-27T18:00:00+05:00" }
];

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
  if (!SUPABASE_SERVER_KEY) missing.push("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");

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

async function readJson(response: Response): Promise<ZoomResponse> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function getZoomAccessToken(): Promise<string> {
  const tokenUrl = new URL("https://zoom.us/oauth/token");
  tokenUrl.searchParams.set("grant_type", "account_credentials");
  tokenUrl.searchParams.set("account_id", ZOOM_ACCOUNT_ID);

  const response = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const data = await readJson(response);
  const token = typeof data.access_token === "string" ? data.access_token : "";

  if (!response.ok || !token) {
    console.error("Zoom OAuth token error", {
      status: response.status,
      data,
    });

    const rawMessage = String(
      data.reason ??
        data.error_description ??
        data.error ??
        "Could not get Zoom access token.",
    );

    if (response.status === 400 || /bad request/i.test(rawMessage)) {
      throw new Error(
        'Zoom OAuth credentials were rejected. ZOOM_ACCOUNT_ID must be the Server-to-Server OAuth App "Account ID / Acc ID" (the alphanumeric value shown with Client ID and Client Secret), not the numeric Zoom Account ID.',
      );
    }

    throw new Error(rawMessage);
  }

  return token;
}

async function addWebinarRegistrant(args: {
  accessToken: string;
  webinarId: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<{ ok: boolean; status: number; data: ZoomResponse }> {
  const response = await fetch(
    `https://api.zoom.us/v2/webinars/${encodeURIComponent(args.webinarId)}/registrants`,
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

  return {
    ok: response.ok,
    status: response.status,
    data: await readJson(response),
  };
}

async function findExistingRegistrant(args: {
  accessToken: string;
  webinarId: string;
  email: string;
}): Promise<ZoomResponse | null> {
  for (const status of ["approved", "pending"] as const) {
    const url = new URL(
      `https://api.zoom.us/v2/webinars/${encodeURIComponent(args.webinarId)}/registrants`,
    );
    url.searchParams.set("status", status);
    url.searchParams.set("page_size", "300");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${args.accessToken}` },
    });

    const data = await readJson(response);
    if (!response.ok) continue;

    const registrants = Array.isArray(data.registrants)
      ? data.registrants as ZoomResponse[]
      : [];

    const found = registrants.find(
      (item) => String(item.email ?? "").toLowerCase() === args.email.toLowerCase(),
    );

    if (found) return found;
  }

  return null;
}

function zoomValue(data: ZoomResponse, key: string): string | null {
  const value = data[key];
  return value === null || value === undefined || value === ""
    ? null
    : String(value);
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
      return jsonResponse({ success: false, error: "Please sign in first." }, 401);
    }

    const userAccessToken = authorization.replace("Bearer ", "").trim();

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVER_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
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

    // Only an enrolled Basic Forex Course student may create webinar links.
    const enrollmentResult = await supabaseAdmin
      .from("course_enrollments")
      .select("id,enrollment_status,payment_status")
      .eq("user_id", user.id)
      .eq("course_key", COURSE_KEY)
      .maybeSingle();

    if (enrollmentResult.error) {
      throw new Error(`Course enrollment check failed: ${enrollmentResult.error.message}`);
    }

    const enrollment = enrollmentResult.data;
    const blocked = ["rejected", "cancelled", "revoked"].includes(
      String(enrollment?.enrollment_status ?? enrollment?.payment_status ?? "").toLowerCase(),
    );

    if (!enrollment || blocked) {
      return jsonResponse(
        { success: false, error: "Basic Forex Course enrollment is required." },
        403,
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

    const catalogResult = await supabaseAdmin
      .from("zoom_webinar_catalog")
      .select("course_key,class_number,title,webinar_id,scheduled_at")
      .eq("course_key", COURSE_KEY)
      .eq("is_active", true)
      .order("class_number", { ascending: true });

    const catalogByClass = new Map<number, Webinar>(
      (!catalogResult.error && Array.isArray(catalogResult.data) ? catalogResult.data : []).map((row: Webinar) => [Number(row.class_number), row]),
    );
    const webinars: Webinar[] = FALLBACK_WEBINARS.map((base) => {
      const catalog = catalogByClass.get(Number(base.class_number));
      return {
        ...base,
        webinar_id: String(catalog?.webinar_id || base.webinar_id),
        title: base.title,
        scheduled_at: base.scheduled_at,
      };
    });
    const completionGraceMs = 3 * 60 * 60 * 1000;
    const isCompleted = (webinar: Webinar) => {
      if (!webinar.scheduled_at) return false;
      const scheduled = new Date(webinar.scheduled_at).getTime();
      return Number.isFinite(scheduled) && Date.now() > scheduled + completionGraceMs;
    };
    const completedWebinars = webinars.filter(isCompleted);
    const eligibleWebinars = webinars.filter((webinar) => !isCompleted(webinar));

    const existingResult = await supabaseAdmin
      .from("zoom_course_registrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_key", COURSE_KEY);

    if (existingResult.error) {
      throw new Error(
        `Zoom registration table unavailable: ${existingResult.error.message}. Run SQL 63 first.`,
      );
    }

    const existingByClass = new Map<number, ZoomResponse>(
      (existingResult.data ?? []).map((row: ZoomResponse) => [
        Number(row.class_number),
        row,
      ]),
    );

    const zoomAccessToken = eligibleWebinars.length ? await getZoomAccessToken() : "";
    const results: ZoomResponse[] = completedWebinars.map((webinar) => ({
      class_no: webinar.class_number,
      title: webinar.title,
      webinar_id: webinar.webinar_id,
      scheduled_at: webinar.scheduled_at,
      success: true,
      skipped: true,
      status: "completed",
      join_url: null,
      message: "Completed class skipped. No new Zoom link generated.",
    }));

    for (const webinar of eligibleWebinars) {
      const cached = existingByClass.get(Number(webinar.class_number));
      if (
        cached &&
        String(cached.registration_status ?? "") === "registered" &&
        String(cached.join_url ?? "").startsWith("http")
      ) {
        results.push({
          class_no: webinar.class_number,
          title: webinar.title,
          webinar_id: webinar.webinar_id,
          scheduled_at: webinar.scheduled_at,
          success: true,
          cached: true,
          status: "registered",
          registrant_id: cached.registrant_id ?? null,
          join_url: cached.join_url,
        });
        continue;
      }

      await supabaseAdmin.from("zoom_course_registrations").upsert(
        {
          user_id: user.id,
          course_key: COURSE_KEY,
          class_number: webinar.class_number,
          title: webinar.title,
          webinar_id: webinar.webinar_id,
          scheduled_at: webinar.scheduled_at,
          registration_status: "pending",
          zoom_http_status: null,
          zoom_error_code: null,
          zoom_error_message: null,
          last_attempt_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_key,class_number" },
      );

      const registration = await addWebinarRegistrant({
        accessToken: zoomAccessToken,
        webinarId: webinar.webinar_id,
        email: user.email,
        firstName,
        lastName,
      });

      let zoomData = registration.data;
      let recoveredExisting = false;

      if (!registration.ok) {
        const message = String(zoomData.message ?? zoomData.error ?? "");
        if (/already|exist|registered/i.test(message)) {
          const found = await findExistingRegistrant({
            accessToken: zoomAccessToken,
            webinarId: webinar.webinar_id,
            email: user.email,
          });
          if (found) {
            zoomData = found;
            recoveredExisting = true;
          }
        }
      }

      const joinUrl = zoomValue(zoomData, "join_url");
      const registrantId =
        zoomValue(zoomData, "registrant_id") ?? zoomValue(zoomData, "id");
      const approved = Boolean(joinUrl);
      const apiSucceeded = registration.ok || recoveredExisting;
      const registrationStatus = approved
        ? "registered"
        : apiSucceeded
        ? "pending"
        : "failed";
      const errorCode = apiSucceeded ? null : zoomValue(zoomData, "code");
      const errorMessage = apiSucceeded
        ? null
        : zoomValue(zoomData, "message") ??
          zoomValue(zoomData, "error") ??
          "Zoom registration failed.";

      const saved = await supabaseAdmin
        .from("zoom_course_registrations")
        .upsert(
          {
            user_id: user.id,
            course_key: COURSE_KEY,
            class_number: webinar.class_number,
            title: webinar.title,
            webinar_id: webinar.webinar_id,
            scheduled_at: webinar.scheduled_at,
            registrant_id: registrantId,
            join_url: joinUrl,
            registration_status: registrationStatus,
            zoom_http_status: registration.status,
            zoom_error_code: errorCode,
            zoom_error_message: errorMessage,
            registered_at: approved ? new Date().toISOString() : null,
            last_attempt_at: new Date().toISOString(),
          },
          { onConflict: "user_id,course_key,class_number" },
        )
        .select("class_number,registration_status,join_url")
        .single();

      if (saved.error) {
        throw new Error(`Could not save Class ${webinar.class_number} Zoom link: ${saved.error.message}`);
      }

      results.push({
        class_no: webinar.class_number,
        title: webinar.title,
        webinar_id: webinar.webinar_id,
        scheduled_at: webinar.scheduled_at,
        success: approved,
        status: registrationStatus,
        recovered_existing: recoveredExisting,
        http_status: registration.status,
        zoom_code: errorCode,
        message: errorMessage,
        registrant_id: registrantId,
        join_url: joinUrl,
      });
    }

    const registered = results.filter((item) => item.status === "registered").length;
    const pending = results.filter((item) => item.status === "pending").length;
    const failed = results.filter((item) => item.status === "failed").length;
    const completed = completedWebinars.length;
    const eligibleCount = eligibleWebinars.length;

    console.log("Zoom registration summary", {
      user_id: user.id,
      registered,
      pending,
      failed,
    });

    return jsonResponse(
      {
        success: failed === 0 && registered === eligibleCount,
        complete: registered === eligibleCount,
        message:
          registered === eligibleCount
            ? `All ${eligibleCount} upcoming unique Zoom links are ready.${completed ? ` ${completed} completed class${completed === 1 ? " was" : "es were"} skipped.` : ""}`
            : failed
            ? "Some upcoming Zoom registrations failed. Check the returned class errors."
            : "Zoom accepted the upcoming registrations, but some links are pending approval.",
        enrollment_id: enrollment.id,
        registered,
        pending,
        failed,
        completed_count: completed,
        eligible_count: eligibleCount,
        total_classes: webinars.length,
        results,
      },
      failed === 0 && registered === eligibleCount ? 200 : 207,
    );
  } catch (error) {
    console.error("zoom-register-course error", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected Zoom registration error.",
      },
      500,
    );
  }
});
