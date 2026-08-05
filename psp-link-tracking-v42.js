(function(){
  'use strict';

  const SUPABASE_URL='https://etfolhinohgmskbfjoyh.supabase.co';
  const SUPABASE_KEY='sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw';
  const ATTR_KEY='psp_link_attribution_v42';
  const VISITOR_KEY='psp_visitor_id_v42';
  const SESSION_KEY='psp_session_id_v42';
  let clientPromise=null;

  function makeId(prefix){
    try{return prefix+(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36));}
    catch(_){return prefix+Math.random().toString(36).slice(2)+Date.now().toString(36);}
  }
  function storageGet(store,key){try{return store.getItem(key)||'';}catch(_){return '';}}
  function storageSet(store,key,value){try{store.setItem(key,value);}catch(_){}}
  function getVisitorId(){
    let id=storageGet(localStorage,VISITOR_KEY);
    if(!id){id=makeId('v_');storageSet(localStorage,VISITOR_KEY,id);}
    return id;
  }
  function getSessionId(){
    let id=storageGet(sessionStorage,SESSION_KEY);
    if(!id){id=makeId('s_');storageSet(sessionStorage,SESSION_KEY,id);}
    return id;
  }
  function getAttribution(){
    try{return JSON.parse(storageGet(localStorage,ATTR_KEY)||'null');}catch(_){return null;}
  }
  function saveAttribution(value){
    const current=getAttribution()||{};
    const next={...current,...value,first_seen_at:current.first_seen_at||new Date().toISOString(),last_seen_at:new Date().toISOString()};
    storageSet(localStorage,ATTR_KEY,JSON.stringify(next));
    return next;
  }
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(s=>s.src&&s.src.includes('@supabase/supabase-js'));
      if(existing){
        if(window.supabase?.createClient)return resolve();
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=src;script.async=true;
      script.onload=resolve;script.onerror=reject;
      document.head.appendChild(script);
    });
  }
  async function getClient(){
    if(window.__pspTrackingSupabase)return window.__pspTrackingSupabase;
    if(clientPromise)return clientPromise;
    clientPromise=(async()=>{
      if(!window.supabase?.createClient){
        await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      }
      if(!window.supabase?.createClient)throw new Error('Tracking client unavailable.');
      window.__pspTrackingSupabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
        auth:{storageKey:'pipsepaisa-tracking-auth-v42',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
      });
      return window.__pspTrackingSupabase;
    })();
    return clientPromise;
  }
  function cleanSlug(value){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,80);}
  function cleanTrackingParams(){
    try{
      const url=new URL(location.href);
      ['ref','psp_ref','utm_source','utm_medium','utm_campaign','utm_content'].forEach(k=>url.searchParams.delete(k));
      history.replaceState(history.state,'',url.pathname+(url.search?'?'+url.searchParams.toString():'')+url.hash);
    }catch(_){ }
  }
  async function record(eventType, options={}){
    const attr=getAttribution();
    const slug=cleanSlug(options.slug||attr?.slug);
    if(!slug)return {ok:false,skipped:true,reason:'no-attribution'};
    try{
      const client=await getClient();
      const payload={
        p_slug:slug,
        p_event_type:eventType,
        p_visitor_id:getVisitorId(),
        p_session_id:getSessionId(),
        p_user_id:options.userId||null,
        p_course_key:options.courseKey||null,
        p_page_path:location.pathname+location.search,
        p_referrer:document.referrer||null,
        p_user_agent:navigator.userAgent||null,
        p_metadata:{
          title:document.title||'',
          source:attr?.source||options.source||null,
          campaign:attr?.campaign||options.campaign||null,
          ...(options.metadata||{})
        }
      };
      const {data,error}=await client.rpc('psp_record_tracked_link_event',payload);
      if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;
      if(row){
        saveAttribution({
          slug,
          link_id:row.link_id||attr?.link_id||null,
          name:row.link_name||attr?.name||null,
          destination_path:row.destination_path||attr?.destination_path||null,
          source:row.source||attr?.source||null,
          campaign:row.campaign||attr?.campaign||null
        });
      }
      try{
        if(typeof window.gtag==='function')window.gtag('event','psp_'+eventType,{link_slug:slug,course_key:options.courseKey||undefined});
      }catch(_){ }
      return {ok:true,row,recorded:row?.event_recorded!==false};
    }catch(error){
      console.warn('PipSePaisa link tracking skipped:',error?.message||error);
      return {ok:false,error};
    }
  }
  async function captureFromUrl(){
    let params;
    try{params=new URLSearchParams(location.search);}catch(_){return;}
    const slug=cleanSlug(params.get('ref')||params.get('psp_ref'));
    if(!slug)return;
    const source=(params.get('utm_source')||'').trim()||null;
    const medium=(params.get('utm_medium')||'').trim()||null;
    const campaign=(params.get('utm_campaign')||'').trim()||null;
    saveAttribution({slug,source,medium,campaign,entry_path:location.pathname});
    const sessionFlag='psp_link_click_recorded_'+slug;
    if(storageGet(sessionStorage,sessionFlag)==='1'){
      cleanTrackingParams();
      return;
    }
    const result=await record('click',{slug,source,campaign,metadata:{medium}});
    if(result.ok){storageSet(sessionStorage,sessionFlag,'1');cleanTrackingParams();}
  }
  function authMetadata(){
    const a=getAttribution();
    if(!a?.slug)return {};
    return {
      referral_slug:a.slug,
      referral_source:a.source||null,
      referral_campaign:a.campaign||null,
      referral_link_id:a.link_id||null
    };
  }

  window.PSPTrack={
    getAttribution,
    authMetadata,
    record,
    signup:function(userId){return record('signup',{userId:userId||null});},
    enrollment:function(courseKey,userId,metadata){return record('enrollment',{courseKey,userId:userId||null,metadata:metadata||{}});},
    captureFromUrl,
    visitorId:getVisitorId,
    sessionId:getSessionId
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',captureFromUrl,{once:true});
  else captureFromUrl();
})();
