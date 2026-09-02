(function(){
'use strict';
if(window.PSPCourseAuthFlow)return;
const STORE='psp_course_auth_intent_v207';
const VALID=new Set(['basic-b2','fundamental','advanced']);
const SUPABASE_URL='https://etfolhinohgmskbfjoyh.supabase.co';
const SUPABASE_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
let client=null;
function cleanKey(v){v=String(v||'').trim().toLowerCase();if(v==='basic')v='basic-b2';return VALID.has(v)?v:'';}
function safeParse(v){try{return JSON.parse(v||'null')}catch(_){return null}}
function readStored(){return safeParse(sessionStorage.getItem(STORE))||safeParse(localStorage.getItem(STORE));}
function rawTracking(){try{const q=new URLSearchParams(location.search),out={};['ref','psp_ref','utm_source','utm_medium','utm_campaign','utm_content'].forEach(k=>{const v=q.get(k);if(v)out[k]=v});return out}catch(_){return {}}}
function currentFromUrl(){try{const q=new URLSearchParams(location.search);return cleanKey(q.get('psp_course')||q.get('psp_enroll'));}catch(_){return '';}}
function remember(key){
  key=cleanKey(key);if(!key)return null;
  const attr=window.PSPTrack?.getAttribution?.()||null;
  const prior=readStored()||{};const data={key,created_at:new Date().toISOString(),source_path:location.pathname,attribution:attr||prior.attribution||null,tracking:{...(prior.tracking||{}),...rawTracking()}};
  try{sessionStorage.setItem(STORE,JSON.stringify(data));localStorage.setItem(STORE,JSON.stringify(data));}catch(_){}
  return data;
}
function read(){const key=currentFromUrl();if(key)return remember(key);const saved=readStored();return saved&&cleanKey(saved.key)?saved:null;}
function clear(){try{sessionStorage.removeItem(STORE);localStorage.removeItem(STORE);}catch(_){}}
function restoreAttribution(intent){try{if(intent?.attribution&&window.PSPTrack?.restoreAttribution)window.PSPTrack.restoreAttribution(intent.attribution);}catch(_){} }
function authUrl(key,mode){key=cleanKey(key);const q=new URLSearchParams();q.set('psp_course',key);q.set('psp_auth',mode==='signup'?'signup':'login');const saved=readStored();Object.entries(saved?.tracking||rawTracking()).forEach(([k,v])=>{if(v)q.set(k,String(v))});return '/sign-in?'+q.toString();}
function appUrl(key){key=cleanKey(key);const q=new URLSearchParams();q.set('open','mycourses');q.set('psp_enroll',key);q.set('psp_course_from_auth','1');return '/?'+q.toString();}
function getClient(){
  if(window.sb?.auth)return window.sb;
  if(client)return client;
  if(!window.supabase?.createClient)return null;
  client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{storageKey:'pipsepaisa-user-auth-v2',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
}
async function hasSession(){try{const sb=getClient();if(!sb)return false;const {data}=await sb.auth.getSession();return !!data?.session?.user;}catch(_){return false}}
async function cta(key){
  key=cleanKey(key);if(!key)return false;
  const intent=remember(key);restoreAttribution(intent);
  if(await hasSession()){
    if(typeof window.openCourseEnrollment==='function'){window.openCourseEnrollment(key);return true;}
    location.assign(appUrl(key));return true;
  }
  location.assign(authUrl(key,'login'));return true;
}
function afterAuth(){const intent=read();if(!intent)return '';restoreAttribution(intent);return appUrl(intent.key);}
window.PSPCourseAuthFlow={cleanKey,remember,read,clear,restoreAttribution,authUrl,appUrl,afterAuth,hasSession,cta};
window.pspPublicCourseCTA=function(key){return cta(key)};
})();
