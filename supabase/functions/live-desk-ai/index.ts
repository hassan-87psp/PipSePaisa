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

const CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb97Ba4KQuJM5FbsHl3v';
const TECHNICAL_URL = 'https://pipsepaisa.com/technical';
const FUNDAMENTAL_URL = 'https://pipsepaisa.com/fundamental';

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
function parseReplyEnvelope(raw: string) {
  const cleaned = cleanReply(raw);
  const marker = /\[\[SUGGESTIONS\s*:\s*([\s\S]*?)\]\]\s*$/i.exec(cleaned);
  const reply = (marker ? cleaned.slice(0, marker.index) : cleaned).trim();
  const suggestions = marker
    ? marker[1].split(/\s*\|\|\s*/).map(x => x.trim()).filter(Boolean).slice(0, 4)
    : [];
  return { reply: reply || cleaned, suggestions };
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
    basic: withTracking(TECHNICAL_URL, c),
    fundamental: withTracking(FUNDAMENTAL_URL, c),
    courses: withTracking('https://pipsepaisa.com/courses', c),
    brokers: withTracking('https://pipsepaisa.com/broker-reviews', c),
    ea: withTracking('https://pipsepaisa.com/eaindicator', c),
    partner: withTracking('https://pipsepaisa.com/becomepartner', c),
    tools: withTracking('https://pipsepaisa.com/tradingtools', c),
    channel: CHANNEL_URL,
  };
}
function knowledgeBase(links: ReturnType<typeof linksFor>) {
  return `PIPSEPAISA CURRENT KNOWLEDGE BASE — use this as the source of truth:\nBrand: PipSePaisa. Tagline: GROW WITH US. PipSePaisa is a Forex/trading education and trader-support ecosystem with courses, signals, market tools, broker verification, EA/Indicators and member services.\n\nCURRENT FREE COURSES:\n- Basic Forex Course — CURRENT Batch 3. Instructor: Sir Sajid Khan Ghori. 100% free. This is the current technical/basic free batch and fresh current-batch enrollment. Main learning areas: Financial Markets Blueprint, Language of Price Intelligence, Candlesticks, Trader's Toolkit/indicators, and Building Your Trading Edge. Direct current enrollment link: ${links.basic}\n- Fundamental Forex Course — CURRENT Batch 2. Instructor: Sir Malik Ghulam Abbas. 100% free. Fresh current-batch enrollment. Core syllabus includes Economic Calendar, Central Banks & Market Impact, and FOMC/news-policy impact. Direct current enrollment link: ${links.fundamental}\n- Do NOT call the current Basic course Batch 2. Do NOT call the current Fundamental course Batch 1. Do not show or invent batch dates.\n\nPAID COURSES:\n- Advanced Forex Course — instructor Sir Sajid Khan Ghori. Paid. Current offer price $150. 8 live professional sessions. Topics include professional mindset, sessions/liquidity, currency flow, correlations/confluence, order flow, sentiment, high-probability setups and execution/trade management. Enrollment: ${links.advanced}\n- Advance Fundamental — instructor Sir Malik Ghulam Abbas. Advanced level. Live classes only; no recordings. Current offer $150, original $250. It is starting very soon. If a visitor asks when it starts and an exact date is not explicitly available, naturally say: "Bohat jald start hone wala hai. Aap hamara WhatsApp Channel follow kar lein, final date aur schedule aapko wahin mil jayega." Channel: ${links.channel}\n- Advance Fundamental learning areas include institutions/currency valuation, central banks, interest rates/inflation, CPI/PCE, NFP/labour, GDP/PMI/ISM/retail sales, bonds/yields/DXY/Gold, risk sentiment and building a fundamental bias.\n\nENROLLMENT / PAYMENT:\n- Free-course short links are the preferred links: Technical/Basic Batch 3 = ${links.basic} ; Fundamental Batch 2 = ${links.fundamental}. Never give the retired Basic Batch 2 sign-in URL for these current free courses.\n- Paid-course payment methods: USDT TRC20 and Local Bank Transfer.\n- Local Bank Transfer uses secure Infinity payment processing and verifies automatically. No Admin approval is required for Local Bank. A hosted bank-payment attempt expires after about 20 minutes if it is not completed.\n- USDT proof/manual payment can require Admin review.\n- For payment/how-to-join questions, answer directly and give the relevant enrollment link naturally.\n\nSIGNALS / MEMBER TOOLS:\n- PipSePaisa provides trading signals, live charts, charts/articles, World News Hub, Currency Strength Meter, trading journal/performance tools and AI Report features according to access.\n\nBROKER / VERIFICATION:\n- Supported broker flows include Exness, DPrime and XM.\n- PipSePaisa supports new-account and existing-account/IB verification workflows. Exact eligibility depends on account verification.\n\nEA & INDICATOR:\n- EA & Indicator marketplace uses private account-linked access/licensing rather than one common public binary.\n- Access verification generally uses Trading Account ID, Broker and Deposit Proof.\n- PipSePaisa Pivot Indicator — MT5: free account-linked indicator for pivot structure, market condition, setup modes and pivot levels.\n- PipSePaisa Trading Sessions Indicator — MT5: free account-linked indicator for Sydney, Tokyo, London and New York sessions, open/closed state, countdown, overlaps and chart session markers.\n\nVIP / PARTNER:\n- PipSePaisa may provide VIP/community access and partner/referral services through the website. If a current price/condition is not confirmed here, do not invent it; answer with what is known and naturally guide the visitor to the relevant page or human team.\n\nOTHER APPROVED LINKS:\nCourses: ${links.courses}\nBroker Reviews: ${links.brokers}\nEA & Indicator: ${links.ea}\nBecome Partner: ${links.partner}\nTrading Tools & Services: ${links.tools}\nWhatsApp Channel: ${links.channel}`;
}
async function callPspAI(prompt: string) {
  const ai = await fetch('https://pipsepaisa-api.vercel.app/api/ai-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal: AbortSignal.timeout(6500),
  });
  if (!ai.ok) throw new Error(`AI upstream ${ai.status}`);
  const data = await ai.json();
  const raw = cleanReply(data?.report || data?.text || '');
  if (!raw) throw new Error('Empty AI response');
  const parsed = parseReplyEnvelope(raw);
  return { text: parsed.reply, suggestions: parsed.suggestions, provider: String(data?.provider || 'pipsepaisa-ai') };
}
function fastKnowledgeReply(latest: string, transcript: string, links: ReturnType<typeof linksFor>) {
  const q = normalize(latest);
  const tail = normalize(transcript).slice(-2400);
  const says = (re: RegExp) => re.test(q);
  const ctx = (re: RegExp) => re.test(tail);
  const isGreeting = /^(hi|hello|hey|salam|assalam o alaikum|assalamualaikum|aoa)$/.test(q);
  const mentionsAdvanceFund = says(/advance fundamental|advanced fundamental|paid fundamental/) || ctx(/advance fundamental|advanced fundamental|paid fundamental/);
  const mentionsFund = says(/fundamental/) || ctx(/fundamental/);
  const mentionsTechnical = says(/technical|basic forex|basic course|sajid/) || ctx(/technical course|basic forex|basic course|sir sajid/);
  const mentionsAdvancedForex = says(/advanced forex|advance forex|sajid.*paid|paid.*sajid/) || ctx(/advanced forex course/);

  if (isGreeting) return {
    text: 'Hello! Jee bataye, main PipSePaisa AI Assistant hoon. Aap kis cheez mein help chahte hain?',
    suggestions: ['Courses', 'Enrollment', 'Payment', 'Broker']
  };

  if (/^(free course|free courses)$/.test(q)) return {
    text: 'Hamare 2 current free options hain — Basic Forex Course Batch 3 aur Fundamental Forex Course Batch 2. Aap kis course ki details chahte hain?',
    suggestions: ['Basic Forex Batch 3', 'Fundamental Batch 2']
  };

  if (/^(basic|basic forex|basic forex course|technical|technical course|basic forex batch 3)$/.test(q)) return {
    text: 'Basic Forex Course ka current Batch 3 hai aur ye 100% free hai. Isay Sir Sajid Khan Ghori conduct karte hain. Aap syllabus dekhna chahte hain ya enrollment link?',
    suggestions: ['Syllabus', 'Enrollment link']
  };

  if (/^(free fundamental|free fundamental course|fundamental batch 2|free fundamental batch 2)$/.test(q)) return {
    text: 'Free Fundamental ka current Batch 2 hai aur ye 100% free hai. Sir Malik Ghulam Abbas conduct karte hain. Aap syllabus dekhna chahte hain ya enrollment link?',
    suggestions: ['Syllabus', 'Enrollment link']
  };

  if (/^(advance fundamental|advanced fundamental|paid fundamental)$/.test(q)) return {
    text: 'Advance Fundamental Sir Malik Ghulam Abbas ka advanced paid course hai. Current offer $150 hai aur course bohat jald start hone wala hai. Aap fee/enrollment, syllabus ya start update mein se kya dekhna chahte hain?',
    suggestions: ['Enrollment', 'Syllabus', 'Start update']
  };

  if (/^(advanced forex|advance forex|advanced forex course)$/.test(q)) return {
    text: 'Advanced Forex Course Sir Sajid Khan Ghori conduct karte hain. Current offer $150 hai aur ismein 8 live professional sessions hain. Aap syllabus dekhna chahte hain ya enrollment?',
    suggestions: ['Syllabus', 'Enrollment']
  };

  if (/^(enrollment|enroll|join|registration)$/.test(q)) return {
    text: 'Bilkul. Aap kis course mein enroll hona chahte hain?',
    suggestions: ['Basic Forex Batch 3', 'Fundamental Batch 2', 'Advanced Forex', 'Advance Fundamental']
  };

  if (/^(fundamental|fundamental course)$/.test(q) && !mentionsAdvanceFund) return {
    text: 'Fundamental ke 2 options hain — Free Fundamental Batch 2 aur Advance Fundamental. Aap kis course ki baat kar rahe hain?',
    suggestions: ['Free Fundamental', 'Advance Fundamental']
  };

  if (/^(paid|paid course|paid wala|paid course wala)$/.test(q)) return {
    text: 'Paid courses mein Advanced Forex Course aur Advance Fundamental available hain. Aap kis course ki details chahte hain?',
    suggestions: ['Advanced Forex', 'Advance Fundamental']
  };

  if (/course fee|fee kya|fee kitni|price kya|price kitni|cost/.test(q) && !mentionsAdvanceFund && !mentionsAdvancedForex && !mentionsTechnical && !mentionsFund) return {
    text: 'Free course ki fee pooch rahe hain ya paid course ki?',
    suggestions: ['Free Course', 'Paid Course']
  };

  if (/teacher|instructor|kon hai teacher|kaun hai teacher|kon parhata|kaun parhata/.test(q) && mentionsFund) {
    return { text: 'Fundamental courses Sir Malik Ghulam Abbas conduct karte hain.', suggestions: [] };
  }

  if (/kab start|start kab|when start|start date|kab shuru/.test(q) && /syllabus|topics|kya parh|what learn/.test(q) && mentionsAdvanceFund) {
    return { text: `Bohat jald start hone wala hai. Final date aur schedule ke liye hamara WhatsApp Channel follow kar lein: ${links.channel}\nSyllabus mein central banks, interest rates/inflation, CPI/PCE, NFP, GDP/PMI, bonds/yields, DXY/Gold, risk sentiment aur fundamental bias cover hota hai.`, suggestions: [] };
  }

  if (/kab start|start kab|when start|start date|kab shuru/.test(q) && mentionsAdvanceFund) {
    return { text: `Bohat jald start hone wala hai. Aap hamara WhatsApp Channel follow kar lein, final date aur schedule aapko wahin mil jayega: ${links.channel}`, suggestions: [] };
  }

  if ((/syllabus|topics|kya parh|what learn/.test(q)) && mentionsAdvanceFund) {
    return { text: 'Advance Fundamental mein central banks, interest rates/inflation, CPI/PCE, NFP, GDP/PMI, bonds/yields, DXY/Gold, risk sentiment aur fundamental bias cover hota hai.', suggestions: [] };
  }

  if ((/syllabus|topics|kya parh|what learn/.test(q)) && mentionsFund && !mentionsAdvanceFund) {
    return { text: 'Free Fundamental Batch 2 mein Economic Calendar, Central Banks & Market Impact aur FOMC/news-policy impact cover hota hai.', suggestions: [] };
  }

  if ((/syllabus|topics|kya parh|what learn/.test(q)) && mentionsTechnical) {
    return { text: 'Basic Forex Batch 3 mein Financial Markets Blueprint, price/technical analysis, candlesticks, trader tools/indicators aur apna trading edge build karna cover hota hai.', suggestions: [] };
  }

  if (/link|enroll|join|registration/.test(q)) {
    if (mentionsAdvanceFund) return { text: `Advance Fundamental enrollment yahan se kar sakte hain: ${links.advanceFundamental}`, suggestions: [] };
    if (mentionsFund && !mentionsAdvanceFund) return { text: `Free Fundamental Batch 2 ka direct link ye hai: ${links.fundamental}`, suggestions: [] };
    if (mentionsTechnical) return { text: `Basic Forex Course Batch 3 ka direct link ye hai: ${links.basic}`, suggestions: [] };
  }

  if (/fee|price|cost/.test(q)) {
    if (mentionsAdvanceFund || mentionsAdvancedForex) return { text: 'Current offer price $150 hai.', suggestions: [] };
    if ((mentionsFund && !mentionsAdvanceFund) || mentionsTechnical || /free/.test(q)) return { text: 'Ye course 100% free hai.', suggestions: [] };
  }

  if (/payment|pay kasy|pay kese|payment kasy|payment kese|how to pay/.test(q) && (mentionsAdvanceFund || mentionsAdvancedForex || /paid/.test(q))) {
    return { text: 'Paid course ke liye USDT TRC20 ya Local Bank Transfer available hai. Aap jis course mein enroll karna chahte hain uska enrollment page open karein, wahan payment option select kar sakte hain.', suggestions: [] };
  }

  return null;
}

function smartFallback(latest: string, transcript: string, links: ReturnType<typeof linksFor>) {
  const q = normalize(latest);
  const ctx = normalize(transcript);
  const fundamentalCtx = /fundamental/.test(q) || /fundamental/.test(ctx.slice(-1600));
  const advancedFundCtx = /advance fundamental|advanced fundamental|paid fundamental/.test(q) || /advance fundamental|advanced fundamental|paid fundamental/.test(ctx.slice(-1600));
  const technicalCtx = /technical|basic|sajid/.test(q) || /technical|basic forex|sajid/.test(ctx.slice(-1600));
  if (/human|manager|team member/.test(q)) return { text: 'Jee bilkul, main aapki chat PipSePaisa team member ko transfer kar raha hoon. Aap yahin wait karein.', suggestions: [] };
  if (/link|enroll|join|registration/.test(q)) {
    if (advancedFundCtx) return { text: `Advance Fundamental enrollment yahan se kar sakte hain: ${links.advanceFundamental}`, suggestions: [] };
    if (fundamentalCtx) return { text: `Free Fundamental Batch 2 ka direct link ye hai: ${links.fundamental}`, suggestions: [] };
    if (technicalCtx) return { text: `Basic Forex Course Batch 3 ka direct link ye hai: ${links.basic}`, suggestions: [] };
    return { text: `Free Technical course: ${links.basic}\nFree Fundamental course: ${links.fundamental}`, suggestions: [] };
  }
  if (/teacher|instructor|kon sikha|kaun sikha/.test(q) && fundamentalCtx) return { text: 'Fundamental courses Sir Malik Ghulam Abbas conduct karte hain.', suggestions: [] };
  if (/kab start|start kab|start date|when start/.test(q)) {
    if (advancedFundCtx) return { text: `Bohat jald start hone wala hai. Aap hamara WhatsApp Channel follow kar lein, final date aur schedule aapko wahin mil jayega: ${links.channel}`, suggestions: [] };
    if (fundamentalCtx) return { text: `Fundamental Batch 2 current batch hai. Final class schedule/update ke liye WhatsApp Channel follow kar lein: ${links.channel}`, suggestions: [] };
    if (technicalCtx) return { text: `Basic Forex Course Batch 3 current batch hai. Final class schedule/update ke liye WhatsApp Channel follow kar lein: ${links.channel}`, suggestions: [] };
  }
  if (/syllabus|topics|kya parh|what learn/.test(q)) {
    if (advancedFundCtx) return { text: 'Advance Fundamental mein central banks, rates/inflation, CPI/PCE, NFP, GDP/PMI, bonds/yields, DXY/Gold, risk sentiment aur fundamental bias cover hota hai.', suggestions: [] };
    if (fundamentalCtx) return { text: 'Free Fundamental Batch 2 mein Economic Calendar, Central Banks & Market Impact aur FOMC/news-policy impact cover hota hai.', suggestions: [] };
    if (technicalCtx) return { text: 'Basic Forex Batch 3 mein Financial Markets Blueprint, price language/technical analysis, candlesticks, trader tools/indicators aur trading edge cover hota hai.', suggestions: [] };
  }
  if (/fee|price|cost|paid/.test(q)) {
    if (/free/.test(q) || (fundamentalCtx && !advancedFundCtx) || technicalCtx) return { text: 'Hamare current Basic Forex Batch 3 aur Fundamental Batch 2 dono 100% free hain.', suggestions: [] };
    return { text: 'Advanced Forex Course aur Advance Fundamental dono ka current offer price $150 hai.', suggestions: [] };
  }
  return { text: 'Bilkul, bataye aap kis cheez ke bare mein help chahte hain — course, enrollment, payment, broker ya trading tools?', suggestions: ['Course', 'Enrollment', 'Payment', 'Broker'] };
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
      const history = Array.isArray(msgs) ? msgs.slice(-26) : [];
      const transcript = transcriptFrom(history);
      const links = linksFor(conv);
      const actionRule: Record<string,string> = {
        suggest: 'Write ONE natural reply the human manager can send next. Roman Urdu / simple English, warm, direct and human. Resolve follow-up context. Do not add a heading. Do not send it; only suggest the text.',
        summary: 'Summarize this conversation for the manager in 2-4 short lines: what the visitor wants, what has already been explained, and any unresolved point.',
        intent: 'State the visitor intent and lead temperature in one short line, for example: Intent: Advance Fundamental enrollment · Lead: Warm. Use only what the conversation supports.',
        next_action: 'Give the manager ONE best next action in one short practical line. Do not invent missing facts.',
      };
      const prompt = `You are the private AI co-pilot for a PipSePaisa human support/sales manager.\n${actionRule[action]}\nBe accurate and natural. Never invent dates, prices, seats, eligibility or payment status.\n\n${knowledgeBase(links)}\n\nCUSTOMER CONTEXT:\nCurrent page: ${conv.current_page || conv.first_page || '/'}\nSource: ${[conv.source, conv.campaign, conv.medium].filter(Boolean).join(' / ') || 'Direct'}\nLead stage: ${conv.lead_stage || 'new'}\nPriority: ${conv.priority || 'normal'}\nExisting user: ${conv.visitor_user_id ? 'Yes' : 'No/Unknown'}\n\nCONVERSATION:\n${transcript}\n\nReturn only the requested manager-assist output. Do not append suggestion markers in manager_assist mode.`;
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
    if (conv.status === 'closed') return json({ ok: true, skipped: 'closed', suggestions: [] });
    if (conv.ai_mode === false) return json({ ok: true, skipped: 'human_mode', suggestions: [] });

    if (currentPage && currentPage !== conv.current_page) {
      await db.from('psp_live_chat_conversations').update({ current_page: currentPage, updated_at: new Date().toISOString() }).eq('id', conv.id);
    }

    const { data: latest, error: latestErr } = await db.from('psp_live_chat_messages')
      .select('id,body,created_at').eq('conversation_id', conv.id).eq('sender_type', 'visitor').order('id', { ascending: false }).limit(1).maybeSingle();
    if (latestErr) throw latestErr;
    if (!latest) return json({ ok: true, skipped: 'no_visitor_message', suggestions: [] });

    const dedupeId = `ai-${latest.id}`;
    const { data: existing } = await db.from('psp_live_chat_messages')
      .select('id').eq('conversation_id', conv.id).eq('client_message_id', dedupeId).maybeSingle();
    if (existing) return json({ ok: true, skipped: 'already_replied', suggestions: [] });

    await db.from('psp_live_chat_messages').update({ delivered_at: new Date().toISOString(), seen_at: new Date().toISOString() }).eq('id', latest.id);

    if (wantsHuman(latest.body)) {
      const transferText = 'Jee bilkul, main aapki chat PipSePaisa team member ko transfer kar raha hoon. Aap yahin wait karein, manager isi chat mein reply karega.';
      await db.rpc('psp_live_chat_ai_store_reply', {
        p_conversation_id: conv.id,
        p_visitor_message_id: latest.id,
        p_body: transferText,
      });
      await db.rpc('psp_live_chat_ai_handoff', { p_conversation_id: conv.id, p_reason: 'Visitor explicitly requested human support' });
      return json({ ok: true, handoff: true, reply: transferText, suggestions: [] });
    }

    await db.from('psp_live_chat_conversations').update({ ai_typing_until: new Date(Date.now() + 15000).toISOString(), updated_at: new Date().toISOString() }).eq('id', conv.id);

    const { data: history, error: historyErr } = await db.from('psp_live_chat_messages')
      .select('sender_type,sender_name,body,created_at').eq('conversation_id', conv.id).neq('sender_type', 'note').order('id', { ascending: false }).limit(26);
    if (historyErr) throw historyErr;
    const ordered = (history || []).reverse();
    const transcript = transcriptFrom(ordered);
    const links = linksFor(conv);

    const fast = fastKnowledgeReply(latest.body, transcript, links);
    if (fast) {
      const { data: storedFast, error: fastErr } = await db.rpc('psp_live_chat_ai_store_reply', {
        p_conversation_id: conv.id,
        p_visitor_message_id: latest.id,
        p_body: fast.text,
      });
      if (fastErr) throw fastErr;
      if (!storedFast?.skipped) {
        await db.from('psp_live_chat_events').insert({
          conversation_id: conv.id,
          event_type: 'ai_reply',
          actor: 'ai-assistant',
          payload: { provider: 'psp-fast-knowledge', visitor_message_id: latest.id },
        });
      }
      return json({ ok: true, provider: 'psp-fast-knowledge', reply: fast.text, suggestions: fast.suggestions });
    }

    const prompt = `You are PipSePaisa AI Assistant inside the website Live Desk.\n\nCONVERSATION STYLE — VERY IMPORTANT:\n- Talk naturally like a good human support/sales person in Roman Urdu + simple English. Match the visitor's wording, length and language.\n- Understand conversation continuity. If the visitor first says "fundamental", then "paid", then "teacher?", then "kab start?", keep talking about Advance Fundamental without asking them to repeat it.\n- Give the direct answer first. Do not use filler like "apna sawal detail mein likh dein" when the question is already clear.\n- Do not repeat greetings or "Jee main help karta hoon" in every message.\n- Usually reply in 1-4 natural sentences. Ask only one follow-up question when it genuinely helps.\n- If you ask the visitor a question, create 2-4 short possible visitor answers as suggestions. The visitor can tap one or type their own answer. Suggestions must answer YOUR question, not be generic menus.\n- Never show numbered menus, robotic decision trees, markdown tables, headings or bold-star formatting. Plain chat only.\n- If an exact date is not available for Advance Fundamental, say naturally that it will start very soon and ask them to follow the WhatsApp Channel for the final date/schedule. Do not say only "Starting Soon".\n- If you do not know an exact fact, never invent it. Give the useful known information and naturally bridge to the next helpful step instead of sounding evasive or robotic.\n- Stay positive and helpful, but never guarantee trading profits/returns. Never request passwords, OTPs, private keys or card secrets.\n- You are an AI assistant; do not pretend to be a human. If asked who you are, say you are PipSePaisa AI Assistant.\n- Human handoff is handled by the system when the visitor explicitly asks for a human/manager.\n- When the visitor asks how to pay/enroll/join/link, give the correct direct current link. For current free courses use ONLY /technical and /fundamental links from the knowledge base.\n- Use current page + recent conversation context instead of asking the visitor to repeat the course.\n\nOUTPUT FORMAT:\nWrite the natural reply first. On the final line append exactly: [[SUGGESTIONS: option 1 || option 2]]\nOnly include suggestions when your reply asks the visitor a question. If you do not ask a question, append: [[SUGGESTIONS:]]\n\n${knowledgeBase(links)}\n\nVISITOR CONTEXT:\nCurrent page: ${currentPage || conv.current_page || conv.first_page || '/'}\nMarketing source: ${[conv.source, conv.campaign, conv.medium].filter(Boolean).join(' / ') || 'Direct'}\nExisting PipSePaisa user: ${conv.visitor_user_id ? 'Yes' : 'No/Unknown'}\n\nRECENT CONVERSATION:\n${transcript}\n\nReply now.`;

    let out;
    try {
      out = await callPspAI(prompt);
    } catch (err) {
      console.error('Live Desk AI upstream:', err);
      const fallback = smartFallback(latest.body, transcript, links);
      await db.rpc('psp_live_chat_ai_store_reply', {
        p_conversation_id: conv.id,
        p_visitor_message_id: latest.id,
        p_body: fallback.text,
      });
      return json({ ok: true, fallback: true, reply: fallback.text, suggestions: fallback.suggestions });
    }

    const { data: stored, error: storeErr } = await db.rpc('psp_live_chat_ai_store_reply', {
      p_conversation_id: conv.id,
      p_visitor_message_id: latest.id,
      p_body: out.text,
    });
    if (storeErr) throw storeErr;
    if (stored?.skipped) return json({ ok: true, skipped: stored.skipped, suggestions: out.suggestions });

    await db.from('psp_live_chat_events').insert({
      conversation_id: conv.id,
      event_type: 'ai_reply',
      actor: 'ai-assistant',
      payload: { provider: out.provider, visitor_message_id: latest.id },
    });
    return json({ ok: true, provider: out.provider, reply: out.text, suggestions: out.suggestions });
  } catch (err) {
    console.error('live-desk-ai:', err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
