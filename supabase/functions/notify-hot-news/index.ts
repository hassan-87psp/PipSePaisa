// PipSePaisa HOT breaking-news push worker.
// Called only by an authenticated pg_cron webhook. No client secrets or public send endpoint.
// HOT means potential trading relevance from the publisher's headline, not confirmed price movement.
const projectUrl=(Deno.env.get("SUPABASE_URL")||"").replace(/\/$/,"");
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const hookSecret=Deno.env.get("HOOK_SECRET")||"";
const onesignalId=Deno.env.get("ONESIGNAL_APP_ID")||"";
const onesignalKey=Deno.env.get("ONESIGNAL_REST_API_KEY")||"";
const feedUrl="https://pipsepaisa-api.vercel.app/api/news?limit=500";
const HUB="https://pipsepaisa.com/dashboard/";
const MAX_PER_RUN=3, MAX_PER_HOUR=12, MAX_AGE_MS=30*60*1000;
function respond(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json"}});}
function safeText(x,len){return String(x||"").replace(/[\u0000-\u001f\u007f]+/g," ").trim().slice(0,len);}
function validateItem(item,enabled,now){
  if(!item || item.heat!=="hot" || !item.marketFocus)return false;
  const t=Date.parse(item.date),url=String(item.link||item.url||"");
  if(!Number.isFinite(t)||t<=enabled||t>now+60000||now-t>MAX_AGE_MS)return false;
  if(safeText(item.title,200).length<10)return false;
  try{const u=new URL(url);if(u.protocol!=="https:")return false;}catch{return false;}
  return true;
}
async function sha256(s){
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
function canonicalTitle(t){
 return String(t||"").toLowerCase().replace(/\s+-\s+[^-]{2,50}$/,"")
  .replace(/[^a-z0-9]+/g," ").trim().slice(0,200);
}
async function sb(path,opts={}){
 const response=await fetch(projectUrl+"/rest/v1/"+path,{
  ...opts,headers:{"apikey":serviceKey,"Authorization":"Bearer "+serviceKey,
   "Content-Type":"application/json","Accept":"application/json",...(opts.headers||{})},
  signal:AbortSignal.timeout(10000)
 });
 const body=await response.text();
 if(!response.ok)return {ok:false,status:response.status,message:body.slice(0,200)};
 let parsed=null;try{parsed=body?JSON.parse(body):null;}catch{}
 return {ok:true,data:parsed,status:response.status};
}
async function reserve(item,digest){
 return await sb("psp_hot_news_push_log",{
  method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({
   digest,headline:safeText(item.title,240),article_url:String(item.link||item.url),
   source:safeText(item.source,100)||"Publisher",published_at:new Date(item.date).toISOString(),status:"queued"
  })
 });
}
async function clearReservation(digest){
 try{await sb("psp_hot_news_push_log?digest=eq."+encodeURIComponent(digest)+"&status=eq.queued",{method:"DELETE"});}catch{}
}
async function sendPush(item,digest){
 // Same origin and manifest scope as the installed PWA. Include the exact
 // source item so the article can be selected after login/session recovery.
 const url=new URL(HUB);
 url.searchParams.set("page","newshub");
 url.searchParams.set("news_url",String(item.link||item.url).slice(0,1250));
 url.searchParams.set("news_title",safeText(item.title,150));
 const payload={
   app_id:onesignalId,target_channel:"push",included_segments:["Total Subscriptions"],
   headings:{en:"🔥 HOT Market News · PipSePaisa"},
   contents:{en:safeText(item.title,156)},
   url:url.href,
   data:{psp_page:"newshub",psp_news_url:String(item.link||item.url).slice(0,1250)},
   chrome_web_icon:"https://pipsepaisa.com/icon-192.png",
   chrome_web_badge:"https://pipsepaisa.com/icon-192.png",
   web_push_topic:"psp-hot-"+digest.slice(0,32)
 };
 const response=await fetch("https://api.onesignal.com/notifications",{
  method:"POST",headers:{"Content-Type":"application/json","Authorization":"Key "+onesignalKey},
  body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)
 });
 const raw=await response.text();if(!response.ok)throw Error("OneSignal HTTP "+response.status+" "+raw.slice(0,100));
 let data={};try{data=JSON.parse(raw)}catch{}
 if(!data.id)throw Error("OneSignal response contains no accepted notification ID");
 return safeText(data.id,100);
}
async function run(){
 if(!projectUrl||!serviceKey||!onesignalId||!onesignalKey||!hookSecret)throw Error("Missing required server credentials");
 const ctl=await sb("psp_hot_news_push_control?select=enabled_at&singleton=eq.true&limit=1");
 if(!ctl.ok||!Array.isArray(ctl.data)||!ctl.data.length)throw Error("HOT push control unavailable");
 const enabled=Date.parse(ctl.data[0].enabled_at),now=Date.now();
 if(!Number.isFinite(enabled))throw Error("HOT push control timestamp unavailable");
 const recent=await sb("psp_hot_news_push_log?select=digest&status=eq.sent&sent_at=gte."+encodeURIComponent(new Date(now-3600000).toISOString())+"&limit=20");
 if(!recent.ok)throw Error("HOT push rate-limit state unavailable");
 const available=Math.min(MAX_PER_RUN,Math.max(0,MAX_PER_HOUR-(recent.data?.length||0)));
 if(!available)return {ok:true,processed:0,sent:0,duplicates:0,limited:true};
 const r=await fetch(feedUrl,{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(18000),cache:"no-store"});
 if(!r.ok)throw Error("News feed HTTP "+r.status);
 const data=await r.json();
 if(!data.success||!Array.isArray(data.items))throw Error("News feed unavailable");
 const items=data.items.filter(x=>validateItem(x,enabled,now))
  .sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
 let sent=0,duplicates=0,failed=0;
 const seen=new Set();
 for(const item of items){
  if(sent>=available)break;
  const normalized=canonicalTitle(item.title);
  if(!normalized||seen.has(normalized))continue;
  seen.add(normalized);
  const digest=await sha256(normalized);
  const lock=await reserve(item,digest);
  if(!lock.ok){
   if(lock.status===409){duplicates++;continue;}
   failed++;continue;
  }
  try{
   const providerId=await sendPush(item,digest);
   const saved=await sb("psp_hot_news_push_log?digest=eq."+encodeURIComponent(digest),{
    method:"PATCH",headers:{"Prefer":"return=minimal"},
    body:JSON.stringify({status:"sent",sent_at:new Date().toISOString(),provider_id:providerId})
   });
   if(!saved.ok)throw Error("HOT send accepted but audit update failed");
   sent++;
  }catch(e){
   // Only remove reservation after a definitive OneSignal rejection. A send
   // accepted by OneSignal must not be sent again if the audit PATCH fails.
   if(!String(e).includes("audit update failed"))await clearReservation(digest);
   failed++;
  }
 }
 return {ok:true,observedHot:items.length,processed:seen.size,sent,duplicates,failed};
}

Deno.serve(async request=>{
 if(request.method==="GET")return respond({ok:true,service:"PipSePaisa HOT headline push worker"});
 if(request.method!=="POST")return respond({ok:false,error:"Method not allowed"},405);
 const submitted=request.headers.get("x-hook-secret")||"";
 if(!hookSecret||submitted!==hookSecret)return respond({ok:false,error:"Unauthorized"},401);
 try{return respond(await run());}
 catch(e){console.error("hot news push error",String(e));return respond({ok:false,error:String(e).slice(0,150)},503);}
});
