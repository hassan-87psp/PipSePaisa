import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const clean = (s: unknown, max = 4000) => String(s ?? '').replace(/\u0000/g, '').trim().slice(0, max);
const normalize = (s: unknown) => clean(s, 3000).toLowerCase().replace(/[^a-z0-9\s$+.-]/g, ' ').replace(/\s+/g, ' ').trim();

type ChatMsg = { id?: number; sender_type?: string; sender_name?: string; body?: string; created_at?: string; client_message_id?: string | null };
type Quick = { text: string; show_cta?: boolean; cta_url?: string; cta_label?: string; suggestions?: string[] };

const TECH_BASE = 'https://www.pipsepaisa.com/sajid-khan-ghori';
const FUND_BASE = 'https://www.pipsepaisa.com/ghulam-abbas';
const SUPPORT_WA = '+60 11-5696 1157';
const SUPPORT_WA_URL = 'https://wa.me/601156961157';
const CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb97Ba4KQuJM5FbsHl3v';
const FACEBOOK_URL = 'https://www.facebook.com/share/1AUgXGtVYy/';
const INSTAGRAM_URL = 'https://www.instagram.com/pipsepaisa/';

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function publicIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip')?.trim() ||
    ''
  ).slice(0, 80);
}
function randomToken() {
  const b = new Uint8Array(32); crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}
function trackingUrl(base: string, conversationId: string, content = 'chat') {
  const u = new URL(base);
  u.searchParams.set('utm_source', 'freecourse2');
  u.searchParams.set('utm_medium', 'ai-chat');
  u.searchParams.set('utm_campaign', 'batch3');
  u.searchParams.set('utm_content', content);
  u.searchParams.set('fc2', conversationId);
  return u.toString();
}
function stripHtml(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
function needsWebSearch(q: string) {
  const s = normalize(q);
  return /\b(latest|today|current|right now|abhi|aaj|news|breaking|price|rate|weather|temperature|gold price|xauusd|bitcoin|btc price|usd rate|exchange rate|economic calendar|fomc today|cpi today|ppi today|market today|why gold|gold kyun|gold kyu)\b/.test(s);
}
async function searchWeb(q: string, force = false) {
  if (!force && !needsWebSearch(q)) return '';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2600);
  try {
    try {
      const ia = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(q) + '&format=json&no_html=1&skip_disambig=1', {
        headers: { 'User-Agent': 'Mozilla/5.0 PipSePaisaAI/1.0' }, signal: ctrl.signal,
      });
      if (ia.ok) {
        const d = await ia.json().catch(() => ({}));
        const parts: string[] = [];
        const answer = clean(d?.Answer || '', 450);
        const abstract = clean(d?.AbstractText || '', 850);
        if (answer) parts.push(answer);
        if (abstract) parts.push(abstract);
        if (parts.length) return parts.join('\n').slice(0, 1300);
      }
    } catch (_) {}
    const r = await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q), {
      headers: { 'User-Agent': 'Mozilla/5.0 PipSePaisaAI/1.0' }, signal: ctrl.signal,
    });
    if (!r.ok) return '';
    const h = await r.text();
    const snippets: string[] = [];
    const re = /<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(h)) && snippets.length < 4) {
      const title = stripHtml(m[1]); const snip = stripHtml(m[2]);
      if (title || snip) snippets.push(`${title}: ${snip}`.slice(0, 650));
    }
    return snippets.join('\n');
  } catch (_) { return ''; }
  finally { clearTimeout(timer); }
}
function cleanAiReply(s: unknown) {
  return clean(s, 2600).replace(/^```[a-z]*\s*/i, '').replace(/```$/i, '').replace(/^#+\s*/gm, '').replace(/\*\*/g, '').trim();
}
async function callPspAI(prompt: string, timeoutMs = 5000) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch('https://pipsepaisa-api.vercel.app/api/ai-report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`AI upstream ${r.status}`);
    const d = await r.json(); const text = cleanAiReply(d?.report || d?.text || '');
    if (!text) throw new Error('Empty AI response');
    return { text, provider: clean(d?.provider || 'pipsepaisa-ai', 80) };
  } finally { clearTimeout(timer); }
}

function lastAssistantText(history: ChatMsg[]) {
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m?.sender_type !== 'visitor' && clean(m?.body, 1200)) return clean(m.body, 1200);
  }
  return '';
}
function recentText(history: ChatMsg[]) {
  return history.slice(-14).map(m => clean(m?.body, 700)).join(' ').toLowerCase();
}
function shortFollowup(s: string) { return s.length <= 48 || s.split(/\s+/).length <= 7; }
function replyMode(history: ChatMsg[], current = ''): 'short' | 'detail' | 'normal' {
  const items = [...history.filter(m => m?.sender_type === 'visitor').map(m => clean(m?.body, 400)), current].filter(Boolean);
  for (let i = items.length - 1; i >= Math.max(0, items.length - 12); i--) {
    const s = normalize(items[i]);
    if (/\b(detail|details|detail me|details me|proper explain|explain properly|lamba|long answer|full answer)\b/.test(s)) return 'detail';
    if (/\b(short|short answer|short me|short reply|brief|chota|choti|concise|sirf short)\b/.test(s)) return 'short';
  }
  return 'normal';
}
function defaultSuggestions(q = '', reply = '') {
  const s = normalize(q + ' ' + reply);
  if (/fundamental|ghulam|abbas/.test(s)) return ['Fundamental mein kya seekhenge?', 'Batch 2 kab start hoga?', 'Course free hai?', 'Join Fundamental Course'];
  if (/zoom|join|register|seat|enroll/.test(s)) return ['GET MY FREE ZOOM LINK', 'Batch 3 kab start hoga?', '4 sessions mein kya hoga?', 'WhatsApp par kya milega?'];
  if (/whatsapp|instagram|facebook|youtube|tiktok|social|contact number/.test(s)) return ['WhatsApp Number', 'Instagram', 'Facebook', 'Free Course'];
  if (/signal|chart|forex|pip|lot|risk|gold|xau|liquidity|resistance|support resistance|cpi|fomc/.test(s)) return ['Risk Management', 'Pip & Lot Size', 'Technical Course', 'Signals kaise kaam karte hain?'];
  if (/service|pipsepaisa|kya kya/.test(s)) return ['Free Courses', 'Signals', 'EA & Indicators', 'Broker Verification'];
  return ['Course bilkul free hai?', 'Batch 3 kab start hoga?', 'Forex kya hai?', 'GET MY FREE ZOOM LINK'];
}
function withSuggestions(x: Quick, q: string) {
  if (!x.suggestions?.length) x.suggestions = defaultSuggestions(q, x.text);
  return x;
}
function contextualQuickAnswer(q: string, history: ChatMsg[], technicalUrl: string, fundamentalUrl: string): Quick | null {
  const s = normalize(q), recent = recentText(history), lastAi = lastAssistantText(history), short = shortFollowup(s);

  if (short && /^(free|fee|price|cost|charges|kitna|kitni|kitne)$/.test(s)) {
    if (/fundamental/.test(recent) && /technical/.test(recent)) return withSuggestions({ text: 'Ji, dono current free courses FREE hain: Sir Sajid ka Technical Batch 3 aur Sir Malik Ghulam Abbas ka Fundamental Batch 2.' }, q);
    if (/fundamental|ghulam|abbas/.test(recent)) return withSuggestions({ text: 'Ji, Sir Malik Ghulam Abbas ka current Fundamental Batch 2 free hai.' }, q);
    return withSuggestions({ text: 'Ji, Sir Sajid Khan Ghori ka Technical Batch 3 bilkul FREE hai — 4 live sessions ke saath.', show_cta: true, cta_url: technicalUrl }, q);
  }
  if (short && /^(mtlb|matlab|meaning|means|samjha ni|samajh ni aya|smj ni ai|smj ni aya)$/.test(s)) {
    if (lastAi) return withSuggestions({ text: 'Simple matlab: ' + lastAi.replace(/^ji[, ]*/i, '').slice(0, 380) }, q);
    return withSuggestions({ text: 'Ji, jo point clear nahi hua woh likh dein — main simple words mein samjha deta hoon.' }, q);
  }
  if (short && /^(kon kon sa|kaun kaun sa|which one|which courses|courses|course kon se|kon se|konsy)$/.test(s)) {
    return withSuggestions({ text: 'Abhi 2 free courses available hain: 1) Sir Sajid Khan Ghori — Technical Analysis Batch 3, 2) Sir Malik Ghulam Abbas — Fundamental Analysis Batch 2. Paid Advanced courses bhi separate available hain.' }, q);
  }
  if (short && /\b(kab|start|starting|date|when)\b/.test(s)) {
    if (/fundamental|ghulam|abbas/.test(recent) && !/technical|sajid/.test(recent)) return withSuggestions({ text: 'Free Fundamental Course — Batch 2 ka planned start 3 October hai. Latest class update registration ke baad share hoti hai.' }, q);
    if (/technical|sajid|batch 3/.test(recent) && /fundamental/.test(recent)) return withSuggestions({ text: 'Sir Sajid ka Technical Batch 3 28 September se start ho raha hai. Fundamental Batch 2 ka planned start 3 October hai.', show_cta: true, cta_url: technicalUrl }, q);
    return withSuggestions({ text: 'Sir Sajid Khan Ghori ka Free Technical Course — Batch 3 28 September se start ho raha hai.', show_cta: true, cta_url: technicalUrl }, q);
  }
  if (short && /^(technical|technical course|free technical course|sajid|batch 3)$/.test(s)) return withSuggestions({ text: 'Sir Sajid Khan Ghori ka Free Technical Course — Batch 3 hai: 4 live sessions, practical charts, price action/confirmation aur live Q&A. Start 28 September.', show_cta: true, cta_url: technicalUrl }, q);
  if (short && /^(fundamental|fundamental course|free fundamental course|ghulam|abbas|batch 2)$/.test(s)) return withSuggestions({ text: 'Sir Malik Ghulam Abbas ka Free Fundamental Course — Batch 2 hai. Economic calendar, central banks, rates/inflation aur major economic events cover hote hain.' }, q);
  return null;
}
function quickAnswer(q: string, technicalUrl: string, fundamentalUrl: string, history: ChatMsg[] = []): Quick | null {
  const s = normalize(q);
  const contextual = contextualQuickAnswer(q, history, technicalUrl, fundamentalUrl);
  if (contextual) return contextual;
  const ans = (x: Quick) => withSuggestions(x, q);
  const join = /\b(join|register|registration|enroll|enrollment|seat|zoom|link|admission|mujhe join|join karna|zoom link)\b/.test(s);

  // Conversation controls and everyday chat. These must NEVER fall into an uncertainty/failure reply.
  if (/^(hi|hello|hey|helo|hii|hiii)$/.test(s)) return ans({ text: 'Hi 👋 Kaise help karun?' });
  if (/^(salam|assalam o alaikum|assalamualaikum|asalam o alaikum|aoa)$/.test(s)) return ans({ text: 'Wa Alaikum Assalam 👋 Ji, poochiye.' });
  if (/^(walaikum salam|walikum salam|wa alaikum salam|w salam|wsalam|ws)$/.test(s)) return ans({ text: 'Ji 😊 batayein, kya janna chahte hain?' });
  if (/\b(kese ho|kaise ho|kasy ho|kasay ho|kasyn he ap|kaise hain|kese hain|how are you|how r u)\b/.test(s)) return ans({ text: 'Main theek hoon 😊 Aap batayein, kis cheez mein help chahiye?' });
  if (/\b(short answer|short me|short reply|brief answer|concise|chota jawab|choti reply|sirf short)\b/.test(s)) return ans({ text: 'Bilkul 👍 Ab short aur direct answer dunga.' });
  if (/\b(detail me|details me|proper explain|explain properly|full answer|long answer|lamba jawab)\b/.test(s)) return ans({ text: 'Bilkul 👍 Ab detail mein explain karunga.' });
  if (/^(ok|okay|acha|achaa|theek|thk|right|yes|han|haan|hmm|hm|samajh gaya|samajh agaya|smj agyi|smj aya|got it)$/.test(s)) return ans({ text: 'Ji 👍' });
  if (/^(g|ji|jee|jii)$/.test(s)) return ans({ text: 'Ji 😊' });
  if (/^(kya|kia|what)$/.test(s)) return ans({ text: 'Ji, poochiye 😊' });
  if (/\b(thanks|thank you|thankyou|shukriya|jazakallah)\b/.test(s)) return ans({ text: 'Most welcome 😊' });
  if (/\b(who are you|kon ho|kaun ho|ai ho|aap kon|ap kon)\b/.test(s)) return ans({ text: 'Main PipSePaisa AI Assistant hoon 🤖 Courses, Forex/trading, PipSePaisa services aur general questions mein help karta hoon.' });
  if (/^(help|madad|help me)$/.test(s)) return ans({ text: 'Bilkul. Course, Forex/trading, signals, broker/account, PipSePaisa services ya kisi general question ke bare mein pooch sakte hain.' });

  // Contact / website / social media.
  if (/\b(website|site link|pipsepaisa link|official website)\b/.test(s)) return ans({ text: 'Official website: https://www.pipsepaisa.com' });
  if (/\b(whatsapp number|whatsapp no|contact number|support number|number do|contact karo|whatsapp do)\b/.test(s) && !/\b(kyun|kyu|use|privacy|kis liye)\b/.test(s)) return ans({ text: `PipSePaisa support WhatsApp: ${SUPPORT_WA}\n${SUPPORT_WA_URL}\nRegistration ke baad course ke liye assigned manager ka WhatsApp alag ho sakta hai.` });
  if (/\b(whatsapp channel|channel link)\b/.test(s)) return ans({ text: `PipSePaisa WhatsApp Channel:\n${CHANNEL_URL}` });
  if (/\b(instagram|insta)\b/.test(s)) return ans({ text: `PipSePaisa Instagram:\n${INSTAGRAM_URL}` });
  if (/\b(facebook|fb page|fb link)\b/.test(s)) return ans({ text: `PipSePaisa Facebook:\n${FACEBOOK_URL}` });
  if (/\b(youtube|tik ?tok|tiktok)\b/.test(s)) return ans({ text: 'PipSePaisa YouTube aur TikTok par bhi educational content share karta hai. Exact verified direct link current knowledge mein configured nahi hai, isliye main fake link share nahi karunga.' });
  if (/\b(social media|social links|all links)\b/.test(s)) return ans({ text: `PipSePaisa official links:\nInstagram: ${INSTAGRAM_URL}\nFacebook: ${FACEBOOK_URL}\nWhatsApp Channel: ${CHANNEL_URL}\nSupport WhatsApp: ${SUPPORT_WA}` });

  // Core course discovery. Broad wording such as “course ka btao” MUST be answered locally.
  if (/^(course|courses|course detail|course details|free course|free courses)$/.test(s) || (/\b(course|courses)\b/.test(s) && /\b(btao|batao|btado|bata do|detail|details|info|information|about|kya hai|kya h|available|chal raha|chal rha)\b/.test(s))) {
    return ans({ text: 'Abhi PipSePaisa par 2 free courses available hain: Sir Sajid Khan Ghori ka Technical Analysis Batch 3 — 4 live sessions, start 28 September; aur Sir Malik Ghulam Abbas ka Fundamental Analysis Batch 2 — planned start 3 October. Paid Advanced courses bhi separate available hain.', suggestions: ['Technical Course', 'Fundamental Course', 'Dono mein difference?', 'GET MY FREE ZOOM LINK'] });
  }
  if (/\b(kon kon|kaun kaun|which courses|courses available|course chal|course available)\b/.test(s)) return ans({ text: 'Abhi 2 free courses available hain: Sir Sajid Khan Ghori ka Technical Analysis Batch 3 aur Sir Malik Ghulam Abbas ka Fundamental Analysis Batch 2. Paid Advanced Technical aur Advanced Fundamental courses bhi separate available hain.' });
  if (/\b(technical.*fundamental|fundamental.*technical|difference.*course|course.*difference|pehle technical|pehle fundamental|which course|kon sa course|konsa course|dono.*difference|difference.*dono)\b/.test(s)) return ans({ text: 'Technical course charts, price action, structure aur confirmations par focus karta hai. Fundamental course news, economic calendar, central banks aur macro events samjhata hai. Beginner dono kar sakta hai; aapka focus charts ho to Technical se start karna easy rahega.' });
  if (/\b(dono course|both courses|2 course|two courses)\b/.test(s) && /\b(join|kar sakta|kar sakti|enroll)\b/.test(s)) return ans({ text: 'Ji, Technical aur Fundamental dono free courses mein register kar sakte hain. Dono ke registration pages separate hain.' });
  if (/\b(registration|register|form)\b/.test(s) && /\b(payment|pay|fee|paisa|charges)\b/.test(s) && /\b(baad|after|karni|karna|required|zaroori)\b/.test(s)) return ans({ text: 'Nahi, free course registration ke baad course fee dena compulsory nahi. Paid courses/services separate optional choice hain.' });
  if (/\b(broker account|deposit|minimum investment|investment)\b/.test(s) && /\b(zaroori|required|compulsory|chahiye|need|minimum|kitni|kitna)\b/.test(s)) return ans({ text: 'Free course join/register karne ke liye broker account, deposit ya minimum investment compulsory nahi. Broker/premium flows separate hain.' });
  if (/\b(laptop|computer|pc)\b/.test(s) && /\b(zaroori|required|chahiye|need)\b/.test(s)) return ans({ text: 'Laptop compulsory nahi — Zoom class mobile se join ho sakti hai. Charts aur practice ke liye laptop/desktop zyada convenient hota hai.' });
  if (/\b(kitn\w*|how many)\b/.test(s) && /\b(session|sessions|class|classes)\b/.test(s)) return ans({ text: 'Sir Sajid ke Free Technical Batch 3 mein total 4 live sessions hain.' });
  if (/\b(free kyun|free kyu|why free|hidden charge|hidden charges|baad me payment|later payment)\b/.test(s)) return ans({ text: 'Free Batch 3 ki registration ke liye course fee nahi hai. Form mein Name, Email aur Active WhatsApp liya jata hai. Paid courses/services separate optional hain.', show_cta: true, cta_url: technicalUrl });
  if (/\b(course|batch|class)\b/.test(s) && /\b(free|fee|price|cost|charges|kitn|paisa)\b/.test(s)) return ans({ text: 'Ji, Sir Sajid Khan Ghori ka Free Technical Course — Batch 3 bilkul FREE hai. Total 4 live sessions hain aur Batch 3 28 September se start ho raha hai.', show_cta: true, cta_url: technicalUrl });
  if (/\b(beginner|new hoon|new hun|kuch nahi pata|zero knowledge|bilkul new|new trader)\b/.test(s)) return ans({ text: 'Ji, beginner join kar sakta hai. Course step-by-step practical learning ke liye hai, isliye zero/basic knowledge se bhi start kar sakte hain.', show_cta: true, cta_url: technicalUrl });
  if (/\b(language|urdu|roman urdu|english me|hindi)\b/.test(s) && /\b(course|class|samjh|teach)\b/.test(s)) return ans({ text: 'Classes easy Urdu/Roman Urdu style ke saath common trading English terms mein explain ki jati hain.' });
  if (/\b(mobile|phone)\b/.test(s) && /\b(join|zoom|class|course)\b/.test(s)) return ans({ text: 'Ji, Zoom class mobile se join ki ja sakti hai. Charts/practice ke liye laptop convenient hota hai, lekin class attend karne ke liye mobile enough hai.', show_cta: true, cta_url: technicalUrl });
  if (/\b(investment|deposit|broker account|broker zaroori|deposit compulsory|minimum investment)\b/.test(s) && /\b(course|join|free)\b/.test(s)) return ans({ text: 'Free course registration ke liye payment ya broker deposit required nahi hota. Name, Email aur Active WhatsApp se registration hoti hai; broker/premium flows separate hain.' });
  if (/\b(pakistan ke bahar|outside pakistan|malaysia|uae|uk|india|overseas)\b/.test(s) && /\b(join|course|class)\b/.test(s)) return ans({ text: 'Ji, online Zoom course hone ki wajah se Pakistan ke bahar se bhi join kar sakte hain. Active internet aur WhatsApp/Zoom access chahiye.' });
  if (/\b(recording|recorded|certificate|certification)\b/.test(s)) return ans({ text: 'Recording/certificate ka confirmed promise current course information mein listed nahi hai, isliye main guess nahi karunga. Confirmed format 4 live sessions + practical learning + live Q&A hai.' });
  if (/\b(exact time|timing|class time|kitne baje|time kya)\b/.test(s)) return ans({ text: 'Batch 3 ka start 28 September confirmed hai. Exact class timing/Zoom details registration ke baad WhatsApp update mein share ki jayengi.', show_cta: true, cta_url: technicalUrl });
  if (/\b(last date|registration close|seat limited|seats limited|last day)\b/.test(s)) return ans({ text: 'Current registration open ho to form complete kar lena best hai. Confirmed last date current knowledge mein listed nahi, isliye main koi date invent nahi karunga.', show_cta: true, cta_url: technicalUrl });
  if (/\b(28|start|starting|kab|date|when)\b/.test(s) && /\b(batch|course|class|sajid)\b/.test(s)) return ans({ text: 'Sir Sajid ka Free Technical Batch 3 28 September se start ho raha hai. Total 4 live technical sessions hongi.', show_cta: true, cta_url: technicalUrl });
  if (/\b(session|sessions|class|classes|4)\b/.test(s) && /\b(kitn\w*|how many|course|batch|sajid|seekh\w*|sikh\w*)\b/.test(s)) return ans({ text: 'Batch 3 mein total 4 live sessions hain — technical analysis, market reading, price action/candlestick confirmation, practical charts/execution aur live Q&A par focus hoga.' });
  if (/\b(sajid|sir sajid)\b/.test(s) && /\b(kon|kaun|who|teacher|mentor|instructor)\b/.test(s)) return ans({ text: 'Sir Sajid Khan Ghori PipSePaisa ke Technical/Advanced trading instructor hain. Current Free Technical Course Batch 3 bhi woh conduct kar rahe hain.' });
  if (/\b(ghulam|abbas|sir malik|malik ghulam)\b/.test(s) && /\b(kon|kaun|who|teacher|mentor|instructor)\b/.test(s)) return ans({ text: 'Sir Malik Ghulam Abbas PipSePaisa ke Fundamental Analysis instructor hain. Current Free Fundamental Course Batch 2 woh conduct karte hain.' });
  if (/\b(zoom.*nahi|zoom.*ni|link.*nahi|link.*ni|zoom not|link not|zoom mila|link mila)\b/.test(s)) return ans({ text: `Agar registration complete hai aur Zoom/update nahi mila, assigned manager ke WhatsApp ko check karein. Zarurat par PipSePaisa support ${SUPPORT_WA} par apna Client ID ke saath message kar dein.` });
  if (/\b(form fill|form submit|register kar|registration complete|enroll kar)\b/.test(s) && /\b(ab|next|baad|after|kya)\b/.test(s)) return ans({ text: 'Form submit ke baad account/enrollment process hota hai aur assigned manager/WhatsApp ke through next steps aur class updates milti hain. Client ID save rakhna useful hai.' });
  if (/\b(existing account|already account|pehle se account|account already)\b/.test(s)) return ans({ text: 'Agar account pehle se hai to duplicate account banane ki zarurat nahi. Existing login ke saath enrollment flow continue karein.' });
  if (/\b(password|forgot password|password nahi|email nahi ayi|email nahi aayi|credentials)\b/.test(s)) return ans({ text: 'Agar password/credentials nahi mile to Spam/Junk bhi check karein aur Forgot Password use karein. Issue rahe to support WhatsApp par registered email/Client ID ke saath contact karein.' });
  if (/\b(data|whatsapp number)\b/.test(s) && /\b(kyun|use|privacy|kis liye)\b/.test(s)) return ans({ text: 'Registration details account/enrollment, class updates aur support/manager coordination ke liye use hoti hain. Password/OTP/private keys kabhi share na karein.' });
  if (/\b(genuine|trust|real hai|scam|legit)\b/.test(s)) return ans({ text: 'PipSePaisa courses, market education, signals/tools aur support services provide karta hai. Trading results ya broker safety ki 100% guarantee claim nahi ki jati; aap official website/details verify karke decision lein.' });
  if (/\b(free.*paid|paid.*free|advanced.*free|free.*advanced)\b/.test(s)) return ans({ text: 'Free course foundation/practical concepts cover karta hai; Paid Advanced course deeper structured topics aur advanced execution learning ke liye hai. Paid enrollment separate optional choice hai.' });
  if (/\b(whatsapp)\b/.test(s) && /\b(kya milega|updates|course update|zoom update|class update)\b/.test(s)) return ans({ text: 'Registration ke baad WhatsApp par manager/verification next steps, class updates aur Zoom details share hoti hain.' });
  if (/\b(zoom|link)\b/.test(s)) return ans({ text: 'Zoom link ke liye free registration complete karein. Registration ke baad class updates aur Zoom details Active WhatsApp par share ki jayengi.', show_cta: true, cta_url: technicalUrl });
  if (join && !/fundamental/.test(s)) return ans({ text: 'Bilkul 👍 Neeche “GET MY FREE ZOOM LINK” par tap karein — existing PipSePaisa registration page open ho jayega.', show_cta: true, cta_url: technicalUrl });
  if (/\b(fundamental|ghulam|abbas)\b/.test(s)) {
    const wantsJoin = /\b(join|register|enroll|link|zoom|seat)\b/.test(s);
    return ans({ text: 'PipSePaisa ka Free Fundamental Course Sir Malik Ghulam Abbas conduct karte hain. Current free Batch 2 hai; economic calendar, central banks, rates/inflation aur major economic events cover hote hain.', show_cta: wantsJoin, cta_url: fundamentalUrl, cta_label: 'JOIN FREE FUNDAMENTAL COURSE →' });
  }
  if (/\b(paid|advance|advanced)\b/.test(s) && /\b(course|fee|price|sajid|fundamental)\b/.test(s)) return ans({ text: 'PipSePaisa ke Paid Advanced Technical aur Advanced Fundamental courses available hain. Promotional fee around $150 ho sakti hai; exact current fee/payment page ko final samjhein.' });

  // PipSePaisa services.
  if (/\b(services|service|pipsepaisa kya|kya kya provide|what do you offer)\b/.test(s)) return ans({ text: 'PipSePaisa Free & Advanced Courses, Trading Signals, Charts/Market Analysis, EA & Indicators, Trading Tools & Services, Broker Reviews/Verification, Premium Access, educational content aur WhatsApp support provide karta hai.' });
  if (/\b(signal|signals)\b/.test(s)) return ans({ text: 'Ji, PipSePaisa Signals service bhi provide karta hai. Entry, SL/TP aur manual trade updates mil sakti hain; har setup guaranteed nahi hota, isliye proper risk management zaroor follow karein.' });
  if (/\b(chart|analysis|levels|confirmation)\b/.test(s) && !/gold.*today|today.*gold|abhi.*gold/.test(s)) return ans({ text: 'Ji, PipSePaisa market charts/analysis aur educational levels share karta hai. Entry se pehle confirmation important hai — “No Confirmation, No Trade” approach follow karein.' });
  if (/\b(ea|indicator|indicators|robot)\b/.test(s)) return ans({ text: 'PipSePaisa EA & Indicators bhi provide karta hai, mainly MT5 tools. Kuch products account-linked verification/licensing require kar sakte hain; exact product availability Trading Tools & Services section se confirm hoti hai.' });
  if (/\b(broker|exness|xm|dprime|d prime|verification)\b/.test(s)) return ans({ text: 'PipSePaisa broker reviews aur account-verification flows provide karta hai, including Exness, DPrime aur XM related support. Broker/account details verify hone ke baad eligible access/services activate ho sakti hain.' });

  // Forex / trading education — broad instant coverage.
  if (/\b(forex kya|what is forex|forex meaning|forex kia)\b/.test(s)) return ans({ text: 'Forex foreign currencies ki buying/selling market hai, jahan pairs jaise EURUSD trade hote hain. Price movement se profit/loss hota hai, isliye strategy aur risk management important hain.' });
  if (/\b(pip|pips)\b/.test(s) && /\b(lot|lots|lot size)\b/.test(s)) return ans({ text: 'Pip price movement ka measurement hai, jabke Lot Size aapki position size hai. Profit/loss impact pip movement × pip value/position size par depend karta hai.' });
  if (/\b(pip|pips)\b/.test(s)) return ans({ text: 'Pip price movement ka standard measurement hai. Forex pairs aur Gold/BTC mein broker digits/symbol specification alag ho sakti hai, isliye exact pip value symbol ke hisaab se calculate hoti hai.' });
  if (/\b(lot size|lot|lots)\b/.test(s)) return ans({ text: 'Lot size trade ka position size hota hai. Lot jitna bada hoga, same price move par profit/loss impact utna zyada hoga — lot ko account risk aur SL distance ke hisaab se choose karein.' });
  if (/\b(leverage)\b/.test(s)) return ans({ text: 'Leverage chhoti margin se larger position control karne deta hai. Ye buying power badhata hai, lekin loss risk bhi amplify karta hai — high leverage carefully use karein.' });
  if (/\b(margin|free margin|margin level)\b/.test(s)) return ans({ text: 'Margin wo amount hai jo broker open position ko support karne ke liye reserve karta hai. Free Margin available equity ka woh hissa hai jo new trades/loss fluctuation absorb kar sakta hai.' });
  if (/\b(spread)\b/.test(s)) return ans({ text: 'Spread Buy/Ask aur Sell/Bid price ka difference hota hai. Ye trading cost ka hissa hai aur news/low-liquidity time mein widen ho sakta hai.' });
  if (/\b(slippage)\b/.test(s)) return ans({ text: 'Slippage tab hoti hai jab order requested price se thore different price par execute ho, usually fast/volatile market ya low liquidity mein.' });
  if (/\b(swap|overnight fee|rollover)\b/.test(s)) return ans({ text: 'Swap/rollover overnight open position par financing adjustment hota hai. Amount pair, direction, broker aur day ke hisaab se vary karta hai.' });
  if (/\b(drawdown)\b/.test(s)) return ans({ text: 'Drawdown account equity ka peak se decline hota hai. Low controlled drawdown risk management ka important part hai.' });
  if (/\b(stop loss|\bsl\b)\b/.test(s)) return ans({ text: 'Stop Loss (SL) predefined exit hota hai jo trade wrong direction mein jaye to loss limit karta hai. SL ko setup invalidation aur risk plan ke hisaab se place karein.' });
  if (/\b(take profit|\btp\b)\b/.test(s)) return ans({ text: 'Take Profit (TP) predefined profit exit hota hai. TP ko structure/target aur Risk-to-Reward ke hisaab se set karna better hota hai.' });
  if (/\b(breakeven|break even|\bbe\b)\b/.test(s)) return ans({ text: 'Breakeven (BE) ka matlab SL ko entry ke qareeb shift karna taa-ke trade reverse ho to roughly no-loss/no-profit exit ho. Spread/slippage ki wajah se exact zero differ kar sakta hai.' });
  if (/\b(risk reward|risk to reward|rr|1:2|1 2)\b/.test(s)) return ans({ text: 'Risk-to-Reward batata hai aap kitna risk le kar kitna target rakh rahe hain. Example 1:2 mein $1 risk ke مقابل $2 target hota hai.' });
  if (/\b(risk management|risk manage)\b/.test(s) || (/\brisk\b/.test(s) && /\b(trade|trading|lot|loss|account)\b/.test(s))) return ans({ text: 'Risk management ka simple rule: per trade fixed small % risk, SL pehle define, lot size SL distance ke hisaab se, aur revenge/overtrading avoid karein.' });
  if (/\b(buy stop|sell stop|buy limit|sell limit|pending order)\b/.test(s)) return ans({ text: 'Buy Stop current price ke upar, Sell Stop current price ke neeche breakout entry ke liye hota hai. Buy Limit current price ke neeche aur Sell Limit current price ke upar pullback/reversal entry ke liye use hota hai.' });
  if (/\b(buy|sell)\b/.test(s) && /\b(kya|meaning|matlab|difference)\b/.test(s)) return ans({ text: 'Buy ka matlab aap price rise expect kar rahe hain; Sell ka matlab price fall expect kar rahe hain. Result entry aur exit ke price difference se banta hai.' });
  if (/\b(bid|ask)\b/.test(s)) return ans({ text: 'Bid woh price hai jahan aap generally sell karte hain, Ask woh price jahan buy karte hain. Dono ka difference spread hota hai.' });
  if (/\b(session|london|new york|tokyo|sydney)\b/.test(s) && /\b(forex|market|trading|open|session)\b/.test(s)) return ans({ text: 'Forex ke main sessions Sydney, Tokyo, London aur New York hain. London/New York overlap mein generally liquidity/volatility zyada hoti hai, lekin pair aur news ke hisaab se behavior change hota hai.' });
  if (/\b(liquidity|liquidity sweep|liquidity grab)\b/.test(s)) return ans({ text: 'Liquidity un areas ko kehte hain jahan orders/stop losses clustered hote hain. Sweep/grab mein price pehle liquidity take karta hai; entry ke liye uske baad structure/candle confirmation dekhna better hai.' });
  if (/\b(support|resistance)\b/.test(s)) return ans({ text: 'Support wo zone hota hai jahan buying interest aa sakta hai, resistance wo zone jahan selling pressure aa sakta hai. Exact line ki jagah zone + reaction + confirmation ko importance dein.' });
  if (/\b(market structure|higher high|lower low|hh|hl|lh|ll)\b/.test(s)) return ans({ text: 'Market structure price ke swing highs/lows se trend samajhne ka framework hai: bullish mein generally HH/HL, bearish mein LH/LL. Structure break ko context aur confirmation ke saath dekhein.' });
  if (/\b(choch|change of character)\b/.test(s)) return ans({ text: 'CHoCH (Change of Character) structure behavior mein possible shift show karta hai. Ye reversal guarantee nahi — liquidity, higher timeframe aur confirmation ke saath use karein.' });
  if (/\b(bos|break of structure)\b/.test(s)) return ans({ text: 'BOS (Break of Structure) tab kaha jata hai jab price important swing structure ko break kare. Trend continuation/reversal context samajhne ke liye higher timeframe aur liquidity bhi dekhein.' });
  if (/\b(fvg|fair value gap)\b/.test(s)) return ans({ text: 'FVG (Fair Value Gap) fast price displacement se banne wali imbalance area hoti hai. Price kabhi revisit karta hai, lekin har FVG fill/reverse guarantee nahi hoti.' });
  if (/\b(engulfing|engulf candle)\b/.test(s)) return ans({ text: 'Engulfing candle mein current candle previous candle/body ko strongly engulf karti hai. Confirmation ke liye useful ho sakti hai, especially key zone/structure ke context mein — candle akeli enough nahi.' });
  if (/\b(candlestick|candle confirmation|confirmation candle|best candle)\b/.test(s)) return ans({ text: 'Confirmation candle ka purpose level par actual reaction validate karna hai. Engulfing strong confirmation examples mein se hai, lekin location, structure aur liquidity context bhi zaroor dekhein.' });
  if (/\b(atr|average true range)\b/.test(s)) return ans({ text: 'ATR market volatility measure karta hai. ATR high ho to average movement zyada, low ho to movement relatively calm; SL/volatility context mein useful hai.' });
  if (/\b(stochastic|stoch)\b/.test(s)) return ans({ text: 'Stochastic momentum oscillator hai, commonly 0–100 range mein. 80+ overbought aur 20- oversold zones ke taur par dekhe jate hain, lekin trend/context ke bina direct Buy/Sell signal nahi.' });
  if (/\b(cpi|consumer price index)\b/.test(s) && !/today|aaj|latest|current|abhi/.test(s)) return ans({ text: 'CPI consumer inflation measure karta hai. Expected se hotter/cooler CPI interest-rate expectations aur USD/Gold volatility ko strongly affect kar sakta hai.' });
  if (/\b(ppi|producer price index)\b/.test(s) && !/today|aaj|latest|current|abhi/.test(s)) return ans({ text: 'PPI producers ke price changes measure karta hai. Ye inflation pressure ka early indicator ho sakta hai aur currency/Gold expectations par impact dal sakta hai.' });
  if (/\b(nfp|non farm payroll|nonfarm payroll)\b/.test(s) && !/today|aaj|latest|current|abhi/.test(s)) return ans({ text: 'NFP US employment report hai. Jobs growth, unemployment aur wages USD, Gold aur major FX pairs mein strong volatility la sakte hain.' });
  if (/\b(fomc|federal reserve|fed meeting)\b/.test(s) && !/today|aaj|latest|current|abhi/.test(s)) return ans({ text: 'FOMC US Federal Reserve ki monetary-policy meeting hai. Rate decision, statement aur Powell comments USD, Gold aur global markets mein strong volatility la sakte hain.' });
  if (/\b(central bank|interest rate|rate cut|rate hike)\b/.test(s) && !/today|aaj|latest|current|abhi/.test(s)) return ans({ text: 'Central banks interest rates aur monetary policy set karte hain. Rate expectations currency, bonds aur Gold ko affect karti hain; exact reaction market expectations par depend karta hai.' });
  if (/\b(economic calendar|calendar)\b/.test(s) && !/today|aaj|latest|current|abhi/.test(s)) return ans({ text: 'Economic calendar scheduled data/news events dikhata hai, jaise CPI, NFP, GDP aur central-bank decisions. High-impact events se pehle time, forecast, previous aur actual values compare ki jati hain.' });
  if (/\b(mt5|metatrader 5|mt4|metatrader 4)\b/.test(s) && /\b(kya|what|platform|trade)\b/.test(s)) return ans({ text: 'MT4/MT5 trading platforms hain jahan charts, orders, indicators aur EAs use kiye jate hain. MT5 newer platform hai aur zyada instruments/order features support karta hai.' });

  return null;
}
function knowledge(technicalUrl: string, fundamentalUrl: string, extra: string) {
  return `PIPSEPAISA CURRENT KNOWLEDGE (September 2026):
- Brand: PipSePaisa. Tagline: GROW WITH US.
- Free Technical Course: Sir Sajid Khan Ghori, Batch 3, starts 28 September 2026, 4 LIVE sessions, 100% free. Focus: technical analysis, market reading, price action/candlestick confirmation, practical charts, execution process and live Q&A. Registration uses Name, Email and Active WhatsApp. Technical registration: ${technicalUrl}
- Free Fundamental Course: Sir Malik Ghulam Abbas, current free Batch 2, planned start 3 October 2026. Focus: economic calendar, central banks, interest rates/inflation and major economic events. Fundamental registration: ${fundamentalUrl}
- Paid Advanced Technical: Sir Sajid Khan Ghori. Advanced live learning; promotional fee can be around $150 where applicable. Topics: mindset, sessions/liquidity, currency flow, confluence, order flow, market pulse/playbook and execution. Exact current fee/payment page is authoritative.
- Paid Advanced Fundamental: Sir Malik Ghulam Abbas. Advanced live fundamental learning; promotional fee can be around $150 where applicable. Exact live fee/payment flow is authoritative.
- Services: Free/Paid Courses, Trading Signals, Charts/Market Analysis, educational content, EA & Indicators, Trading Tools & Services, Broker Reviews, partner/broker flows, Account Verification, Premium Access, live sessions and WhatsApp support.
- Support WhatsApp: ${SUPPORT_WA} (${SUPPORT_WA_URL})
- WhatsApp Channel: ${CHANNEL_URL}
- Instagram: ${INSTAGRAM_URL}
- Facebook: ${FACEBOOK_URL}
- YouTube/TikTok: educational content is shared there, but exact verified direct URLs are not stored in current project knowledge. Never invent a URL. If Admin Knowledge supplies a verified link, use it.
- Free registration flow: Name + Email + Active WhatsApp -> account/enrollment processing -> assigned manager / WhatsApp next steps -> class/Zoom updates. Existing users should not get duplicate accounts. Client/manager routing is handled by the existing enrollment system.
- If a registered user has not received Zoom/class updates, tell them to check the assigned manager chat and contact PipSePaisa support with Client ID if needed. Do not invent a manager name/number.
- Free course does NOT require a course fee or broker deposit merely to submit the free registration form. Broker/premium-access flows are separate.
- Recording/certificate/exact class timing/last registration date are NOT confirmed in the current knowledge unless Admin Knowledge overrides them. Do not invent them.
- Signals can include entry, SL, TP and manual TP/BE/SL/Close/Cancel updates. Never promise profit or guaranteed results; recommend proper risk management.
- Charts/analysis are educational/support tools; market conditions change. Confirmation before entry is important.
- EA/Indicators can be account-linked/licensed and may require broker/trading-account verification.
- Broker flows may include Exness, DPrime and XM. Never promise broker funds are 100% guaranteed secure.
- Paid-course payment methods can include Local Bank Transfer and USDT TRC20 where currently available. Never invent payment account details.
- Forex knowledge: answer like a capable trading education assistant on pips, points, lots, leverage, margin, risk, SL/TP/BE, RR, sessions, liquidity, structure, support/resistance, candlesticks, confirmation, FVG, CHoCH/BOS, indicators, MT4/MT5, pending orders, spreads/slippage/swaps, CPI/PPI/NFP/FOMC/central banks/economic calendar, Gold and FX mechanics. For current market/news/calendar questions use current web context when available and never present analysis as certainty.
- Sales/ad-reply style: concise Roman Urdu/English, direct answer first, then one relevant next step. Handle beginner, free/hidden charges, outside Pakistan, mobile Zoom, start/session count, course comparison, trust/data-use, existing account, form submitted, Zoom missing, paid-vs-free, broker/deposit and support questions naturally.
- Conversation style: simple acknowledgements get simple acknowledgements. Never turn “Hi”, “Acha”, “G”, “Kya”, “Walikum Salam”, “Short answer kro”, or “Course ka btao” into a reliability/live-data disclaimer.
${extra ? `\nADMIN KNOWLEDGE / OVERRIDES:\n${extra}` : ''}`;
}
function showCtaFor(q: string) { return /\b(join|register|enroll|seat|zoom|admission|free course)\b/.test(normalize(q)); }
function likelyFundamental(q: string) { return /\b(fundamental|ghulam|abbas)\b/.test(normalize(q)); }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server is not configured' }, 500);
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const p = await req.json().catch(() => ({}));
    const mode = clean(p?.mode || 'start', 32);

    if (mode === 'start') {
      const existingToken = clean(p?.visitor_token, 128);
      if (existingToken) {
        const hash = await sha256Hex(existingToken);
        const { data: found } = await db.from('psp_fc2_conversations').select('*').eq('visitor_token_hash', hash).maybeSingle();
        if (found) {
          await db.from('psp_fc2_events').insert({ conversation_id: found.id, event_type: 'page_view', payload: { returning: true } });
          const { data: settings } = await db.from('psp_fc2_settings').select('*').eq('id', 'default').maybeSingle();
          const { data: messages } = await db.from('psp_fc2_messages').select('id,sender_type,sender_name,body,created_at,meta,client_message_id').eq('conversation_id', found.id).order('id').limit(80);
          return json({ ok: true, conversation_id: found.id, visitor_token: existingToken, greeting: settings?.greeting, suggestions: settings?.suggestions || [], messages: messages || [], ai_enabled: found.ai_enabled });
        }
      }
      // V495: cap anonymous creation of new chat sessions so bots cannot
      // fill conversation/event tables without ever sending a message.
      const startIp = publicIp(req);
      if (startIp) {
        const startHash = await sha256Hex(`${startIp}|pipsepaisa-freecourse2-start-v495`);
        const startSince = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const startRecent = await db.from('psp_fc2_rate_v353')
          .select('id', { count: 'exact', head: true })
          .eq('ip_hash', startHash)
          .gte('created_at', startSince);
        if (!startRecent.error && (startRecent.count ?? 0) >= 20) {
          return json({ error: 'Too many new chat sessions. Please wait a few minutes and try again.' }, 429);
        }
        const startRateWrite = await db.from('psp_fc2_rate_v353').insert({ ip_hash: startHash });
        if (startRateWrite.error) console.warn('freecourse2 start rate log warning', startRateWrite.error);
      }

      const token = randomToken(); const tokenHash = await sha256Hex(token);
      const meta = p?.meta || {};
      const row = {
        visitor_token_hash: tokenHash,
        visitor_id: clean(p?.visitor_id, 160) || null,
        source: clean(meta?.utm_source || 'freecourse2', 120) || 'freecourse2',
        medium: clean(meta?.utm_medium || 'ai-chat', 120) || 'ai-chat',
        campaign: clean(meta?.utm_campaign || 'batch3', 160) || 'batch3',
        ref_code: clean(meta?.ref, 180) || null,
        referrer: clean(meta?.referrer, 500) || null,
        landing_path: clean(meta?.path || '/freecourse2', 500) || '/freecourse2',
        current_page: clean(meta?.path || '/freecourse2', 500) || '/freecourse2',
      };
      const { data: conv, error } = await db.from('psp_fc2_conversations').insert(row).select('*').single();
      if (error) throw error;
      await db.from('psp_fc2_events').insert({ conversation_id: conv.id, event_type: 'page_view', payload: { returning: false, query: clean(meta?.query, 800) } });
      const { data: settings } = await db.from('psp_fc2_settings').select('*').eq('id', 'default').maybeSingle();
      return json({ ok: true, conversation_id: conv.id, visitor_token: token, greeting: settings?.greeting, suggestions: settings?.suggestions || [] });
    }

    const conversationId = clean(p?.conversation_id, 80);
    const visitorToken = clean(p?.visitor_token, 128);
    if (!conversationId || visitorToken.length < 32) return json({ error: 'Invalid chat session' }, 400);
    const tokenHash = await sha256Hex(visitorToken);
    const { data: conv, error: convErr } = await db.from('psp_fc2_conversations').select('*').eq('id', conversationId).eq('visitor_token_hash', tokenHash).maybeSingle();
    if (convErr) throw convErr;
    if (!conv) return json({ error: 'Chat session not found' }, 404);

    if (mode === 'poll') {
      const after = Math.max(0, Number(p?.after_id || 0));
      const { data: msgs, error } = await db.from('psp_fc2_messages').select('id,sender_type,sender_name,body,created_at,meta,client_message_id').eq('conversation_id', conv.id).gt('id', after).order('id').limit(100);
      if (error) throw error;
      return json({ ok: true, messages: msgs || [], status: conv.status, ai_enabled: conv.ai_enabled });
    }

    if (mode === 'cta') {
      const target = clean(p?.target || 'technical', 32) === 'fundamental' ? 'fundamental' : 'technical';
      const { data: cur } = await db.from('psp_fc2_conversations').select('cta_clicks').eq('id', conv.id).single();
      await db.from('psp_fc2_conversations').update({ cta_clicks: Number(cur?.cta_clicks || 0) + 1, updated_at: new Date().toISOString() }).eq('id', conv.id);
      await db.from('psp_fc2_events').insert({ conversation_id: conv.id, event_type: 'zoom_link_click', payload: { target } });
      const url = trackingUrl(target === 'fundamental' ? FUND_BASE : TECH_BASE, conv.id, target);
      return json({ ok: true, url });
    }

    if (mode !== 'message') return json({ error: 'Unsupported mode' }, 400);
    if (conv.status === 'closed') return json({ error: 'This chat has been closed by support.' }, 409);
    const question = clean(p?.message, 2000);
    const clientMessageId = clean(p?.client_message_id, 160) || randomToken().slice(0, 24);
    if (!question) return json({ error: 'Message is required' }, 400);

    // Protect the public AI path from automated cost abuse while keeping normal
    // chat usage unrestricted. The visitor token is still the primary chat auth.
    const ip = publicIp(req);
    if (ip) {
      const ipHash = await sha256Hex(`${ip}|pipsepaisa-freecourse2-ai-v353`);
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const recent = await db.from('psp_fc2_rate_v353')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', since);
      if (!recent.error && (recent.count ?? 0) >= 50) {
        return json({ error: 'Too many chat messages. Please wait a few minutes and try again.' }, 429);
      }
      const rateWrite = await db.from('psp_fc2_rate_v353').insert({ ip_hash: ipHash });
      if (rateWrite.error) console.warn('freecourse2 rate log warning', rateWrite.error);
    }

    // Idempotency: retries from mobile/network must not create temporary duplicate messages or duplicate AI answers.
    let visitorMsg: any = null;
    const { data: existingVisitor } = await db.from('psp_fc2_messages').select('id,sender_type,sender_name,body,created_at,meta,client_message_id').eq('conversation_id', conv.id).eq('client_message_id', clientMessageId).maybeSingle();
    if (existingVisitor) visitorMsg = existingVisitor;
    else {
      const { data: insertedVisitor, error: insErr } = await db.from('psp_fc2_messages').insert({ conversation_id: conv.id, sender_type: 'visitor', sender_name: 'Visitor', body: question, client_message_id: clientMessageId, meta: { client_message_id: clientMessageId } }).select('id,sender_type,sender_name,body,created_at,meta,client_message_id').single();
      if (insErr) throw insErr;
      visitorMsg = insertedVisitor;
    }

    const replyKey = `reply:${clientMessageId}`;
    const { data: existingReply } = await db.from('psp_fc2_messages').select('id,sender_type,sender_name,body,created_at,meta,client_message_id').eq('conversation_id', conv.id).eq('client_message_id', replyKey).maybeSingle();
    if (existingReply) return json({ ok: true, visitor_message: visitorMsg, message: existingReply, suggestions: defaultSuggestions(question, existingReply.body || '') });

    const technicalUrl = trackingUrl(TECH_BASE, conv.id, 'technical');
    const fundamentalUrl = trackingUrl(FUND_BASE, conv.id, 'fundamental');
    if (!conv.ai_enabled) return json({ ok: true, visitor_message: visitorMsg, waiting_for_admin: true, suggestions: ['Course Details', 'Start Date', 'WhatsApp Number'] });

    const { data: hist } = await db.from('psp_fc2_messages').select('id,sender_type,sender_name,body,created_at,client_message_id').eq('conversation_id', conv.id).order('id', { ascending: false }).limit(24);
    const histChronological = (hist || []).reverse() as ChatMsg[];
    const quick = quickAnswer(question, technicalUrl, fundamentalUrl, histChronological);

    let replyText = '';
    let provider = 'quick';
    let showCta = !!quick?.show_cta;
    let ctaUrl = quick?.cta_url;
    let ctaLabel = quick?.cta_label || 'GET MY FREE ZOOM LINK →';
    let suggestions = quick?.suggestions || [];

    if (quick) replyText = quick.text;
    else {
      const { data: settings } = await db.from('psp_fc2_settings').select('*').eq('id', 'default').maybeSingle();
      const history = histChronological.slice(-18).map((m: any) => `${m.sender_type === 'visitor' ? 'Visitor' : (m.sender_name || 'PipSePaisa')}: ${clean(m.body, 1000)}`).join('\n');
      const modePref = replyMode(histChronological, question);
      const web = await searchWeb(question);
      const prompt = `You are PipSePaisa AI Assistant in a fast WhatsApp-style website chat at /freecourse2.

PRIMARY JOB:
Answer exactly what the visitor asked. Do not behave like a narrow FAQ bot. You are a conversational PipSePaisa support + sales + Forex education + general assistant.

NON-NEGOTIABLE RESPONSE RULES:
- EVERY user message gets a useful, natural reply. Never return blank.
- Understand Roman Urdu/English, spelling mistakes, slang and fragments from conversation context.
- Use RECENT CONVERSATION before interpreting short follow-ups such as “free?”, “kab?”, “kon sa?”, “mtlb?”, “G”, “Kya”, “acha”, “link?”.
- If the visitor says “short answer”, “short me” or similar, keep following replies very short until they later ask for detail.
- If the visitor asks for detail, explain properly instead of forcing a short reply.
- Current reply-length preference: ${modePref.toUpperCase()}.
- Default style: natural Roman Urdu + simple English matching the visitor. Direct answer first. Usually 1-4 short sentences.
- Do NOT mention verification/live-data limitations unless the visitor actually asked about a current/today/latest/live price, news, market move, calendar event or another fact that genuinely requires fresh verification.
- NEVER use generic failure language for normal conversation. In particular, do not say “reliable answer confirm nahi ho pa raha”, “AI slow hai”, “message dobara bhejein”, or “exact live/verified detail” for ordinary questions.
- Do not repeat the previous answer mechanically. Answer the newest message.

EXPECTED SIMPLE BEHAVIOR EXAMPLES:
Visitor: “Hi” -> “Hi 👋 Kaise help karun?”
Visitor: “Walikum salam” -> a normal acknowledgement, not a disclaimer.
Visitor: “Acha” -> “Ji 👍”
Visitor: “G” -> “Ji 😊”
Visitor: “Kya” -> “Ji, poochiye 😊” when no clearer context exists.
Visitor: “Kasyn he ap” -> “Main theek hoon 😊 Aap batayein?”
Visitor: “Short answer kro” -> “Bilkul 👍 Ab short aur direct answer dunga.”
Visitor: “Course ka btao” -> tell them the current Technical + Fundamental courses from PipSePaisa knowledge, not a live-data disclaimer.

PIPSEPAISA / SALES:
- For PipSePaisa/course/service questions, CURRENT KNOWLEDGE below is the source of truth.
- Sales/ad replies should be helpful, positive and non-pushy: answer first, then one relevant next step.
- Join/Zoom/register intent: guide to the existing registration CTA. Do not create a second enrollment process.
- Never invent a manager, phone number, fee, recording/certificate promise, exact timing, payment account, social URL or unsupported offer.

FOREX / TRADING:
- Answer like a capable trading education assistant: pips, lots, leverage, margin, risk, SL/TP/BE, RR, sessions, liquidity, structure, support/resistance, candlesticks, confirmations, indicators, MT4/MT5, pending orders, Gold/FX mechanics and fundamentals.
- For CURRENT market/news/economic-calendar questions, use WEB SEARCH CONTEXT when available and clearly distinguish verified current facts from general market explanation.
- Never guarantee profit, a winning signal, exact market direction or broker safety.

GENERAL QUESTIONS:
- Answer normal everyday/general questions too when reasonable. Do not force a PipSePaisa/course pitch into unrelated questions.
- If a question is ambiguous, make the most likely contextual interpretation first; ask one short clarification only when truly necessary.
- Return only the next natural chat reply. No headings, markdown tables or robotic menus.

${knowledge(technicalUrl, fundamentalUrl, clean(settings?.knowledge_extra, 16000))}

WEB SEARCH CONTEXT (may be empty):
${web || '(none)'}

RECENT CONVERSATION:
${history}

VISITOR'S LATEST MESSAGE:
${question}`;
      try {
        const out = await callPspAI(prompt, 5000);
        replyText = out.text;
        provider = out.provider;
      } catch (e) {
        console.error('freecourse2-ai upstream', e);
        provider = 'fallback';

        // One fast rescue pass plus web lookup for substantive questions. Both run in parallel so mobile does not wait twice.
        const rescuePrompt = `Reply directly and naturally to this visitor message in ${modePref === 'detail' ? 'helpful detail' : '1-3 short sentences'}. Match Roman Urdu/English. Do not mention AI failure, verification, live sources or uncertainty unless the question itself asks for current/live information. Message: ${question}`;
        const shouldForceWeb = normalize(question).split(' ').length >= 2 && !/^(hi|hello|acha|ok|okay|g|ji|kya|thanks|thank you)$/.test(normalize(question));
        const [rescueAi, forcedWeb] = await Promise.all([
          callPspAI(rescuePrompt, 2800).catch(() => null),
          shouldForceWeb ? searchWeb(question, true).catch(() => '') : Promise.resolve(''),
        ]);

        if (rescueAi?.text) {
          replyText = rescueAi.text;
          provider = rescueAi.provider + '-rescue';
        } else {
          const firstUseful = clean(String(web || forcedWeb || '').split('\n').find(Boolean) || '', 700);
          if (firstUseful) {
            replyText = firstUseful;
            provider = 'web-fallback';
          } else {
            const ns = normalize(question);
            if (needsWebSearch(question)) {
              if (/\b(gold|xau|xauusd)\b/.test(ns)) replyText = 'Live reason abhi fetch nahi ho raha. Generally Gold USD strength, US yields/rate expectations, inflation data, risk sentiment aur geopolitics se move karta hai.';
              else if (/\b(fomc|fed|cpi|ppi|nfp|economic calendar|news)\b/.test(ns)) replyText = 'Current event ka live detail abhi fetch nahi ho raha. Aise events mein actual vs forecast, previous data aur central-bank expectations market reaction ka main driver hote hain.';
              else replyText = 'Current live figure abhi fetch nahi ho rahi; general concept ya calculation poochhein to main direct explain kar sakta hoon.';
            } else if (shortFollowup(ns)) {
              replyText = 'Ji, poochiye 😊';
            } else {
              replyText = 'Aapka point samajh gaya. Iska best direct answer dene ke liye jo exact cheez chahiye woh ek line mein likh dein.';
            }
          }
        }
      }
      showCta = showCtaFor(question);
      ctaUrl = likelyFundamental(question) ? fundamentalUrl : technicalUrl;
      ctaLabel = likelyFundamental(question) ? 'JOIN FREE FUNDAMENTAL COURSE →' : 'GET MY FREE ZOOM LINK →';
      suggestions = defaultSuggestions(question, replyText);
    }

    const meta = { provider, reply_to_client_message_id: clientMessageId };
    let aiMsg: any = null;
    const { data: insertedAi, error: aiErr } = await db.from('psp_fc2_messages').insert({ conversation_id: conv.id, sender_type: 'ai', sender_name: 'PipSePaisa AI', body: replyText, client_message_id: replyKey, meta }).select('id,sender_type,sender_name,body,created_at,meta,client_message_id').single();
    if (aiErr) {
      // A retried request may have won the unique race. Reuse that exact reply.
      const { data: racedReply } = await db.from('psp_fc2_messages').select('id,sender_type,sender_name,body,created_at,meta,client_message_id').eq('conversation_id', conv.id).eq('client_message_id', replyKey).maybeSingle();
      if (!racedReply) throw aiErr;
      aiMsg = racedReply;
    } else aiMsg = insertedAi;

    return json({ ok: true, visitor_message: visitorMsg, message: aiMsg, show_cta: showCta, cta_url: ctaUrl, cta_label: ctaLabel, suggestions: suggestions.slice(0, 4) });
  } catch (err) {
    console.error('freecourse2-ai', err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
