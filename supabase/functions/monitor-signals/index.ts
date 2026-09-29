// PipSePaisa V166 — automatic signal monitor intentionally disabled.
// Signal lifecycle is now mentor/admin controlled only.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-psp-monitor",
  "Content-Type": "application/json",
};

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  return new Response(JSON.stringify({
    ok: true,
    disabled: true,
    mode: "manual-signals",
    message: "Automatic signal activation/TP/SL/BE monitoring is disabled in V166."
  }), { status: 200, headers: cors });
});
