// PipSePaisa V174 — audit logger for Admin/Mentor auth + Team custom session.
// Deploy with Verify JWT OFF. The function validates either the user JWT or the Team session token itself.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
const geoCache = new Map<string, { at: number; data: any }>();
function publicIp(req: Request) {
  const raw = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '';
  return raw.split(',')[0].trim();
}
async function geoFor(ip: string) {
  if (!ip || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$)/.test(ip)) return {};
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.at < 30 * 60 * 1000) return cached.data;
  try {
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(2500) });
    if (!r.ok) return {};
    const j = await r.json();
    const data = j && j.success !== false ? j : {};
    geoCache.set(ip, { at: Date.now(), data });
    if (geoCache.size > 500) { const first = geoCache.keys().next().value; if (first) geoCache.delete(first); }
    return data;
  } catch (_) { return {}; }
}
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'POST required' }), { status: 405, headers: jsonHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const url = Deno.env.get('SUPABASE_URL') || '';
    const anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!url || !anon || !service) throw new Error('Supabase environment is incomplete.');
    const ip = publicIp(req), geo: any = await geoFor(ip);
    const common = {
      action: String(body.action || 'activity'), section: body.section || null,
      target_type: body.target_type || null, target_id: body.target_id == null ? null : String(body.target_id),
      summary: body.summary || null, old_value: body.old_value || null, new_value: body.new_value || null,
      metadata: body.metadata || {}, ip_address: ip || null, city: geo.city || null,
      region: geo.region || null, country: geo.country || null, device_type: body.device_type || null,
      browser: body.browser || null, os: body.os || null, user_agent: body.user_agent || req.headers.get('user-agent') || null,
    };

    // Team Panel uses a custom session token instead of Supabase Auth.
    if (body.team_session_token) {
      const vr = await fetch(`${url}/rest/v1/rpc/psp_team_my_dashboard_v56`, {
        method: 'POST', headers: { 'Content-Type':'application/json', apikey:service, Authorization:`Bearer ${service}` },
        body: JSON.stringify({ p_session_token: String(body.team_session_token) })
      });
      if (!vr.ok) return new Response(JSON.stringify({ error:'Invalid Team session.' }), { status:401, headers:jsonHeaders });
      const vd = await vr.json(); const team = Array.isArray(vd) ? vd[0] : vd;
      if (!team) return new Response(JSON.stringify({ error:'Inactive Team session.' }), { status:401, headers:jsonHeaders });
      const row = {
        actor_id:null, actor_email: team.email || null, actor_name: team.display_name || team.username || 'Team Member', actor_role:'team',
        action:common.action, section:common.section || 'team', target_type:common.target_type, target_id:common.target_id,
        summary:common.summary, old_value:common.old_value, new_value:common.new_value,
        metadata:{ ...(common.metadata||{}), team_username:team.username||null }, ip_address:common.ip_address,
        city:common.city, region:common.region, country:common.country, device_type:common.device_type,
        browser:common.browser, os:common.os, user_agent:common.user_agent
      };
      const ins = await fetch(`${url}/rest/v1/admin_activity_logs`, {
        method:'POST', headers:{'Content-Type':'application/json',apikey:service,Authorization:`Bearer ${service}`,Prefer:'return=minimal'}, body:JSON.stringify(row)
      });
      if (!ins.ok) return new Response(await ins.text(), { status:ins.status, headers:jsonHeaders });
      return new Response(JSON.stringify({ ok:true, actor:'team' }), { status:200, headers:jsonHeaders });
    }

    // Admin / Mentor / Staff: validate the actual Supabase user JWT.
    const auth = req.headers.get('authorization') || '';
    if (!auth.toLowerCase().startsWith('bearer ')) return new Response(JSON.stringify({ error:'Authentication required.' }), { status:401, headers:jsonHeaders });
    const who = await fetch(`${url}/auth/v1/user`, { headers:{apikey:anon,Authorization:auth} });
    if (!who.ok) return new Response(JSON.stringify({ error:'Invalid user session.' }), { status:401, headers:jsonHeaders });
    const payload = {
      p_action:common.action,p_section:common.section,p_target_type:common.target_type,p_target_id:common.target_id,
      p_summary:common.summary,p_old_value:common.old_value,p_new_value:common.new_value,p_metadata:common.metadata,
      p_ip_address:common.ip_address,p_city:common.city,p_region:common.region,p_country:common.country,
      p_device_type:common.device_type,p_browser:common.browser,p_os:common.os,p_user_agent:common.user_agent,
    };
    const rpc = await fetch(`${url}/rest/v1/rpc/psp_write_admin_audit`, {
      method:'POST',headers:{'Content-Type':'application/json',apikey:anon,Authorization:auth},body:JSON.stringify(payload)
    });
    const text = await rpc.text();
    if (!rpc.ok) return new Response(text || JSON.stringify({ error:'Audit write failed' }), { status:rpc.status, headers:jsonHeaders });
    return new Response(text || JSON.stringify({ ok:true }), { status:200, headers:jsonHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error:e instanceof Error?e.message:String(e) }), { status:500, headers:jsonHeaders });
  }
});
