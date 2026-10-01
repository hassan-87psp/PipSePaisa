(function(){
'use strict';
if(window.__PSP_ADMIN_PERF_V398__) return;
window.__PSP_ADMIN_PERF_V398__=true;

var nativeFetch=window.fetch.bind(window);
var SUPABASE_HOST='etfolhinohgmskbfjoyh.supabase.co';
var cache=new Map();
var inflight=new Map();
var MAX_CACHE=180;

var READ_RPCS=new Set([
  'psp_admin_team_overview_v207','psp_admin_team_overview_v206',
  'psp_admin_team_daily_reports_v207','psp_admin_team_daily_reports_v206',
  'psp_admin_team_monitor_clients_v396','psp_admin_team_clients_v206',
  'psp_admin_team_history_v207','psp_admin_team_history_v206',
  'psp_admin_team_performance_range_v396','psp_admin_team_lead_directory_v248',
  'psp_admin_ad_team_directory_v261','psp_admin_team_directory',
  'psp_admin_lead_pool_summary_v248','psp_admin_tracked_link_stats_v314',
  'psp_admin_ad_link_summary_v344','psp_admin_ad_leads_v307',
  'psp_admin_ad_leads_v261','psp_admin_search_client_v273',
  'psp_admin_client_transfer_history_v273','psp_admin_fc2_dashboard_v308',
  'psp_finance_account_balances'
]);

function clear(){
  cache.clear();
}
function trim(){
  if(cache.size<=MAX_CACHE) return;
  var drop=cache.size-MAX_CACHE;
  for(var k of cache.keys()){
    cache.delete(k);
    if(--drop<=0) break;
  }
}
function headersFor(input,init){
  var h=new Headers(input instanceof Request ? input.headers : undefined);
  if(init&&init.headers) new Headers(init.headers).forEach(function(v,k){h.set(k,v)});
  return h;
}
function ttlFor(url,rpc){
  if(rpc) return 10000;
  var p=url.pathname;
  if(p.indexOf('/rest/v1/courses')===0) return 30000;
  if(p.indexOf('/rest/v1/profiles')===0) return 12000;
  if(p.indexOf('/rest/v1/course_enrollments')===0) return 5000;
  if(p.indexOf('/rest/v1/tracked_link')===0) return 15000;
  return 8000;
}
async function bodyText(input,init,method){
  if(method==='GET'||method==='HEAD') return '';
  if(init&&init.body!=null){
    if(typeof init.body==='string') return init.body;
    try{return JSON.stringify(init.body)}catch(_){return String(init.body)}
  }
  if(input instanceof Request){
    try{return await input.clone().text()}catch(_){}
  }
  return '';
}
function isSupabase(url){
  return url.hostname===SUPABASE_HOST;
}
function rpcName(url){
  var m=url.pathname.match(/^\/rest\/v1\/rpc\/([^/?#]+)/);
  return m?decodeURIComponent(m[1]):'';
}
function isCacheable(method,url,rpc){
  if(!isSupabase(url)) return false;
  if(method==='GET' && (url.pathname.indexOf('/rest/v1/')===0 || url.pathname==='/auth/v1/user')) return true;
  return method==='POST' && rpc && READ_RPCS.has(rpc);
}
function keyFor(method,url,headers,body){
  return [
    method,url.href,
    headers.get('authorization')||'',
    headers.get('apikey')||'',
    headers.get('accept-profile')||'',
    headers.get('content-profile')||'',
    headers.get('prefer')||'',
    headers.get('range')||'',
    body||''
  ].join('\n');
}

window.fetch=async function(input,init){
  var rawUrl=input instanceof Request?input.url:String(input);
  var url;
  try{url=new URL(rawUrl,location.href)}catch(_){return nativeFetch(input,init)}
  var method=String((init&&init.method)||(input instanceof Request&&input.method)||'GET').toUpperCase();
  var rpc=rpcName(url);
  var cacheable=isCacheable(method,url,rpc);

  if(!cacheable){
    if(isSupabase(url) && url.pathname.indexOf('/rest/v1/')===0 && method!=='GET' && method!=='HEAD'){
      clear();
      try{
        var writeRes=await nativeFetch(input,init);
        if(writeRes.ok) clear();
        return writeRes;
      }catch(e){
        clear();
        throw e;
      }
    }
    return nativeFetch(input,init);
  }

  var headers=headersFor(input,init);
  var body=await bodyText(input,init,method);
  var key=keyFor(method,url,headers,body);
  var now=Date.now();
  var hit=cache.get(key);
  if(hit && hit.expires>now){
    return hit.response.clone();
  }
  if(hit) cache.delete(key);

  if(inflight.has(key)){
    var shared=await inflight.get(key);
    return shared.clone();
  }

  var job=nativeFetch(input,init).then(function(res){
    if(res.ok){
      cache.set(key,{response:res.clone(),expires:Date.now()+ttlFor(url,rpc)});
      trim();
    }
    return res.clone();
  }).finally(function(){
    inflight.delete(key);
  });

  inflight.set(key,job);
  var response=await job;
  return response.clone();
};

var hiddenAt=0;
document.addEventListener('visibilitychange',function(){
  if(document.hidden){hiddenAt=Date.now();return}
  if(hiddenAt && Date.now()-hiddenAt>30000) clear();
  hiddenAt=0;
});
window.addEventListener('pageshow',function(e){if(e.persisted) clear()});
window.pspAdminPerfClear=clear;
})();