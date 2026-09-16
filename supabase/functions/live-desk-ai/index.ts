import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS, 'Content-Type': 'application/json' },
});

function normalize(s: string) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function wantsHuman(text: string) {
  const s = ` ${normalize(text)} `;
  const phrases = [
    ' human ', ' human se ', ' human chahiye ', ' human chahye ',
    ' manager se ', ' manager chahiye ', ' manager chahye ', ' manager ko connect ', ' manager connect ',
    ' agent se ', ' real person ', ' real insan ', ' insan se ', ' bande se ', ' banday se ',
    ' team se baat ', ' team member se ', ' support se baat ', ' representative se ',
    ' someone from team ', ' staff se ', ' call me ', ' mujhe call '
  ];
  return phrases.some(p => s.includes(p));
}
async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function withTracking(base: string, c: any) {
  const u = new URL(base);
  const mapping: Record<string,string> = {
    referral_code: 'ref', source: 'utm_source', medium: 'utm_medium', campaign: 'utm_campaign', content: 'utm_content', term: 'utm_term'
  };
  for (const [field, key] of Object.entries(mapping)) {
    const v = c?.[field];
    if (v) u.searchParams.set(key, String(v));
  }
  return u.toString();
}
function enrollmentLink(course: string, c: any) {
  return withTracking(`https://pipsepaisa.com/sign-in?psp_course=${encodeURIComponent(course)}&psp_auth=login`, c);
}
function cleanReply(s: string) {
  return String(s || '')
    .replace(/^```[a-z]*\s*/i, '').replace(/```$/i, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*/g, '')
    .trim().slice(0, 3200);
}
function transcriptFrom(history: any[]) {
  return (history || []).map((m:any) => {
    const who = m.sender_type === 'visitor' ? 'Visitor' : (m.sender_name || 'PipSePaisa');
    return `${who}: ${String(m.body || '').slice(0, 1200)}`;
  }).join('\n');
}
function linksFor(c: any) {
  return {
    advanced: enrollmentLink('advanced', c),
    advanceFundamental: enrollmentLink('advance-fundamental', c),
    basic: enrollmentLink('basic-b2', c),
    fundamental: enrollmentLink('fundamental', c),
    courses: withTracking('https://pipsepaisa.com/courses', c),
    brokers: withTracking('https://pipsepaisa.com/broker-reviews', c),
    ea: withTracking('https://pipsepaisa.com/eaindicator', c),
    partner: withTracking('https://pipsepaisa.com/becomepartner', c),
    tools: withTracking('https://pipsepaisa.com/tradingtools', c),
  };
}
function knowledgeBase(links: ReturnType<typeof linksFor>) {
  return `PIPSEPAISA KNOWLEDGE BASE:\nBrand: PipSePaisa. Tagline: GROW WITH US. PipSePaisa is a Forex/trading education and trader-support ecosystem with courses, signals, market tools, broker verification, EA/Indicators and member services.\n\nCourses:\n- Advanced Forex Course — instructor Sir Sajid Khan Ghori. Paid. Current offer price $150. 8 live professional sessions. Topics include professional mindset, sessions/liquidity, currency flow, correlations/confluence, order flow, sentiment, high-probability setups and execution/trade management.\n- Advance Fundamental — instructor Sir Malik Ghulam Abbas. Advanced level. Live classes only, no recordings. Current offer $150, original $250. Status: Starting Soon unless the website has since been updated. Topics include institutions/currency valuation, central banks/rates/inflation, CPI/PCE, NFP/labour, GDP/PMI/ISM/retail sales, bonds/yields/DXY/Gold, risk sentiment and building fundamental bias.\n- Basic Forex Course Batch 2 — free course.\n- Fundamental Forex Course — free fundamental education by Sir Malik Ghulam Abbas.\n\nEnrollment and payment:\n- Paid-course payment methods: USDT TRC20 and Local Bank Transfer.\n- Local Bank Transfer uses secure Infinity payment processing and verifies automatically. No Admin approval is required for Local Bank. A hosted bank-payment attempt expires after about 20 minutes if it is not completed.\n- USDT proof/manual payment can require Admin review.\n- For payment/how-to-join questions, naturally explain: open the correct enrollment link, sign in/sign up if required, choose Local Bank or USDT, then follow the on-screen steps.\n\nSignals and member tools:\n- PipSePaisa provides trading signals, live charts, charts/articles, World News Hub, Currency Strength Meter, trading journal/performance tools and AI Report features according to access.\n\nBroker ecosystem / verification:\n- Supported broker flows include Exness, DPrime and XM.\n- PipSePaisa supports new-account and existing-account/IB verification workflows. Exact eligibility depends on account verification.\n\nEA & Indicator:\n- EA & Indicator marketplace uses private account-linked access/licensing rather than one common public binary.\n- Access verification generally uses Trading Account ID, Broker and Deposit Proof.\n- PipSePaisa Pivot Indicator — MT5: free account-linked indicator for pivot structure, market condition, setup modes and pivot levels.\n- PipSePaisa Trading Sessions Indicator — MT5: free account-linked indicator for Sydney, Tokyo, London and New York sessions, open/closed state, countdown, overlaps and chart session markers.\n\nVIP and partner services:\n- PipSePaisa may provide VIP/community access and partner/referral services through the website. If a current price/condition is not confirmed in this knowledge, do not invent it; guide the visitor to the relevant website page or human team.\n\nAPPROVED ACTION LINKS — use the exact relevant URL when the visitor needs to act:\nAdvanced Forex enrollment: ${links.advanced}\nAdvance Fundamental enrollment: ${links.advanceFundamental}\nBasic Course enrollment: ${links.basic}\nFundamental Course enrollment: ${links.fundamental}\nCourses page: ${links.courses}\nBroker Reviews / account help: ${links.brokers}\nEA & Indicator: ${links.ea}\nBecome Partner: ${links.partner}\nTrading Tools & Services: ${links.tools}`;
}
async function callPspAI(prompt: string) {
  const ai = await fetch('https://pipsepaisa-api.vercel.app/api/ai-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal: AbortSignal.timeout(25000),
  });
  if (!ai.ok) throw new Error(`AI upstream ${ai.status}`);
  const data = await ai.json();
  const text = cleanReply(data?.report || data?.text || '');
  if (!text) throw new Error('Empty AI response');
  return { text, provider: String(data?.provider || 'pipsepaisa-ai') };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceKey) return json({ error: 'Live Desk server is not configured' }, 500);
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const payload = await req.json().catch(() => ({}));
    const mode = String(payload?.mode || 'visitor_reply').trim();

    // Manager-side AI tools. Team session is validated through existing Team Panel RPCs.
    if (mode === 'manager_assist') {
      const teamSession = String(payload?.team_session || '').trim();
      const managerUsername = String(payload?.manager_username || '').trim();
      const managerName = String(payload?.manager_name || managerUsername || 'Team Member').trim();
      const conversationId = String(payload?.conversation_id || '').trim();
      const action = String(payload?.action || 'suggest').trim().toLowerCase();
      if (teamSession.length < 12 || !managerUsername || !conversationId) return json({ error: 'Invalid Team session or conversation' }, 400);
      if (!['suggest','summary','intent','next_action'].includes(action)) return json({ error: 'Unsupported AI assist action' }, 400);

      const { data: msgs, error: msgErr } = await db.rpc('psp_live_chat_manager_messages', {
        p_session_token: teamSession,
        p_manager_username: managerUsername,
        p_manager_name: managerName,
        p_conversation_id: conversationId,
        p_mark_seen: false,
      });
      if (msgErr) throw msgErr;
      const { data: conv, error: convErr } = await db.rpc('psp_live_chat_manager_conversation', {
        p_session_token: teamSession,
        p_conversation_id: conversationId,
      });
      if (convErr) throw convErr;
      if (!conv) return json({ error: 'Conversation not found' }, 404);
      const history = Array.isArray(msgs) ? msgs.slice(-22) : [];
      const transcript = transcriptFrom(history);
      const links = linksFor(conv);
      const actionRule: Record<string,string> = {
        suggest: 'Write ONE natural reply the human manager can send next. Roman Urdu / simple English, short, warm and sales-friendly. Do not add a heading. Do not send it; only suggest the text.',
        summary: 'Summarize this conversation for the manager in 2-4 short lines: what the visitor wants, what has already been explained, and any unresolved point.',
        intent: 'State the visitor intent and lead temperature in one short line, for example: Intent: Advance Fundamental enrollment · Lead: Warm. Use only what the conversation supports.',
        next_action: 'Give the manager ONE best next action in one short practical line. Do not invent missing facts.',
      };
      const prompt = `You are the private AI co-pilot for a PipSePaisa human support/sales manager.\n${actionRule[action]}\nNever criticize PipSePaisa or use discouraging language. Stay accurate; do not invent prices, dates, seats, eligibility or payment status.\n\n${knowledgeBase(links)}\n\nCUSTOMER CONTEXT:\nCurrent page: ${conv.current_page || conv.first_page || '/'}\nSource: ${[conv.source, conv.campaign, conv.medium].filter(Boolean).join(' / ') || 'Direct'}\nLead stage: ${conv.lead_stage || 'new'}\nPriority: ${conv.priority || 'normal'}\nExisting user: ${conv.visitor_user_id ? 'Yes' : 'No/Unknown'}\n\nCONVERSATION:\n${transcript}\n\nReturn only the requested manager-assist output.`;
      const out = await callPspAI(prompt);
      return json({ ok: true, action, text: out.text, provider: out.provider });
    }

    const visitorToken = String(payload?.visitor_token || '').trim();
    const currentPage = String(payload?.current_page || '').slice(0, 500);
    if (visitorToken.length < 24) return json({ error: 'Invalid chat session' }, 400);
    const tokenHash = await sha256Hex(visitorToken);

    const { data: conv, error: convErr } = await db.from('psp_live_chat_conversations')
      .select('*').eq('visitor_token_hash', tokenHash).maybeSingle();
    if (convErr) throw convErr;
    if (!conv) return json({ error: 'Chat session not found' }, 404);
    if (conv.status === 'closed') return json({ ok: true, skipped: 'closed' });
    if (conv.ai_mode === false) return json({ ok: true, skipped: 'human_mode' });

    if (currentPage && currentPage !== conv.current_page) {
      await db.from('psp_live_chat_conversations').update({ current_page: currentPage, updated_at: new Date().toISOString() }).eq('id', conv.id);
    }

    const { data: latest, error: latestErr } = await db.from('psp_live_chat_messages')
      .select('id,body,created_at').eq('conversation_id', conv.id).eq('sender_type', 'visitor').order('id', { ascending: false }).limit(1).maybeSingle();
    if (latestErr) throw latestErr;
    if (!latest) return json({ ok: true, skipped: 'no_visitor_message' });

    const dedupeId = `ai-${latest.id}`;
    const { data: existing } = await db.from('psp_live_chat_messages')
      .select('id').eq('conversation_id', conv.id).eq('client_message_id', dedupeId).maybeSingle();
    if (existing) return json({ ok: true, skipped: 'already_replied' });

    await db.from('psp_live_chat_messages').update({ delivered_at: new Date().toISOString(), seen_at: new Date().toISOString() }).eq('id', latest.id);

    if (wantsHuman(latest.body)) {
      const transferText = 'Jee bilkul, main aapki chat PipSePaisa team member ko transfer kar raha hoon. Aap yahin wait karein, manager aapko isi chat mein reply karega.';
      await db.rpc('psp_live_chat_ai_store_reply', {
        p_conversation_id: conv.id,
        p_visitor_message_id: latest.id,
        p_body: transferText,
      });
      await db.rpc('psp_live_chat_ai_handoff', { p_conversation_id: conv.id, p_reason: 'Visitor explicitly requested human support' });
      return json({ ok: true, handoff: true });
    }

    await db.from('psp_live_chat_conversations').update({ ai_typing_until: new Date(Date.now() + 20000).toISOString(), updated_at: new Date().toISOString() }).eq('id', conv.id);

    const { data: history, error: historyErr } = await db.from('psp_live_chat_messages')
      .select('sender_type,sender_name,body,created_at').eq('conversation_id', conv.id).neq('sender_type', 'note').order('id', { ascending: false }).limit(18);
    if (historyErr) throw historyErr;
    const ordered = (history || []).reverse();
    const transcript = transcriptFrom(ordered);
    const links = linksFor(conv);

    const prompt = `You are PipSePaisa AI Assistant inside the website Live Desk.\n\nSTYLE - VERY IMPORTANT:\n- Reply naturally like a helpful human support/sales manager in Roman Urdu + simple English, matching the visitor's language and wording style.\n- Keep replies short and conversational, usually 1-4 sentences. Ask only one natural follow-up question when actually needed.\n- Do NOT show menu-style options, numbered choices, button choices or robotic decision trees.\n- Do NOT use markdown headings, tables, bold stars or long bullet lists. Plain chat only.\n- Stay positive, helpful and confident. Never criticize PipSePaisa, its team, services or systems.\n- Do not invent facts. If a transaction failed/rejected, describe it neutrally and immediately guide the next step.\n- Never guarantee trading profits or returns. Never request passwords, OTPs, private keys or card secrets.\n- You are an AI assistant; do not pretend to be a human. If asked who you are, say you are PipSePaisa AI Assistant.\n- Human handoff is handled by the system when the visitor explicitly asks for a human/manager. Do not present a menu for it.\n- When the visitor asks how to pay/enroll/join, give the correct direct enrollment URL below naturally in the reply. Preserve the supplied URL exactly.\n- If current page or recent conversation clearly identifies the product/course, use that context instead of asking the visitor to repeat it.\n- If the visitor asks a simple follow-up like "fee?", "local bank se?" or "link?", resolve it from the conversation context.\n\n${knowledgeBase(links)}\n\nVISITOR CONTEXT:\nCurrent page: ${currentPage || conv.current_page || conv.first_page || '/'}\nMarketing source: ${[conv.source, conv.campaign, conv.medium].filter(Boolean).join(' / ') || 'Direct'}\nExisting PipSePaisa user: ${conv.visitor_user_id ? 'Yes' : 'No/Unknown'}\n\nRECENT CONVERSATION:\n${transcript}\n\nReply only with the next natural chat message for the visitor.`;

    let out;
    try {
      out = await callPspAI(prompt);
    } catch (err) {
      console.error('Live Desk AI upstream:', err);
      const fallback = 'Jee, main aapki query PipSePaisa team ke liye forward kar raha hoon. Aap yahin wait karein, team member isi chat mein aapko guide karega.';
      await db.rpc('psp_live_chat_ai_store_reply', {
        p_conversation_id: conv.id,
        p_visitor_message_id: latest.id,
        p_body: fallback,
      });
      await db.rpc('psp_live_chat_ai_handoff', { p_conversation_id: conv.id, p_reason: 'AI provider unavailable; safe human fallback' });
      return json({ ok: true, fallback: true });
    }

    const { data: stored, error: storeErr } = await db.rpc('psp_live_chat_ai_store_reply', {
      p_conversation_id: conv.id,
      p_visitor_message_id: latest.id,
      p_body: out.text,
    });
    if (storeErr) throw storeErr;
    if (stored?.skipped) return json({ ok: true, skipped: stored.skipped });

    await db.from('psp_live_chat_events').insert({
      conversation_id: conv.id,
      event_type: 'ai_reply',
      actor: 'ai-assistant',
      payload: { provider: out.provider, visitor_message_id: latest.id },
    });
    return json({ ok: true, provider: out.provider });
  } catch (err) {
    console.error('live-desk-ai:', err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
