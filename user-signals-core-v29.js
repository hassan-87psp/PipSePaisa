// ===== SIGNALS (from DB: mentor + official, RLS-restricted) =====
let SIGNALS=[];
let sigF='all';
function sigCat(p){p=(p||'').toUpperCase();if(/BTC|ETH|XRP|SOL|DOGE|BNB|USDT|CRYPTO/.test(p))return 'crypto';if(/XAU|GOLD|XAG|SILVER/.test(p))return 'gold';return 'forex';}
function sigIco(p){const c=sigCat(p);return c==='crypto'?'₿':c==='gold'?'🥇':'💱';}
function timeAgo(t){if(!t)return '';const d=(Date.now()-new Date(t).getTime())/1000;if(d<3600)return Math.max(1,Math.round(d/60))+'m ago';if(d<86400)return Math.round(d/3600)+'h ago';return Math.round(d/86400)+'d ago';}
function pspFmtTime(t){if(!t)return '';var d=new Date(t);var tm=d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});if(d.toDateString()===new Date().toDateString())return tm;return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})+', '+tm;}
function pspFmtDateTime(t){if(!t)return '';var d=new Date(t);return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})+', '+d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});}
function sigFilter(f,el){sigF=f;document.querySelectorAll('#sigFilters .sig-fbtn').forEach(b=>b.classList.remove('active'));el.classList.add('active');renderSignals()}
let sigView='active';let sigTimeF='all';
function sigSetView(v,el){
  sigView=v;
  var a=document.getElementById('sigViewActive'),h=document.getElementById('sigViewHistory');
  if(a)a.classList.toggle('active',v==='active');if(h)h.classList.toggle('active',v==='history');
  var tf=document.getElementById('sigTimeFilters');if(tf)tf.style.display=(v==='history')?'flex':'none';
  var rd=document.getElementById('sigResultDash');if(rd)rd.style.display=(v==='history')?'block':'none';
  renderSignals();
}
function sigSetTime(t,el){sigTimeF=t;document.querySelectorAll('#sigTimeFilters .sig-fbtn').forEach(b=>b.classList.remove('active'));el.classList.add('active');renderSignals()}
function memberCat(){ if(!currentProfile||!currentProfile.is_premium) return 'free'; var mt=currentProfile.member_type; if(!mt) return 'vip'; return mt==='vip'?'vip':'premium'; }
function userServicesList(){ if(!currentProfile) return []; var s=currentProfile.services; if(s==null||s==='') return null; return String(s).split(',').map(function(x){return x.trim();}).filter(Boolean); }
function pspHasVerifiedAccess(){
  try{
    var st=window.PSPAccountVerification&&typeof window.PSPAccountVerification.getState==='function'
      ? window.PSPAccountVerification.getState()
      : window.PSP_ACCOUNT_ACCESS_STATE;
    return !!(
      st &&
      (
        st.can_access ||
        st.direct_access_active ||
        st.temporary_access ||
        st.submission_status==='approved' ||
        st.submission_status==='pending'
      )
    );
  }catch(_){return false;}
}
function canAccessContent(svc,audienceStr){
  /*
    V113:
    Broker verification / active Free Access grants the protected PipSePaisa
    services. It must not be blocked again by the older Premium/VIP profile
    membership check.
  */
  if(pspHasVerifiedAccess()) return true;

  if(audienceStr==='all'||audienceStr==null||audienceStr==='') return true;
  var aud=String(audienceStr).split(',').map(function(x){return x.trim();}).filter(Boolean);
  if(!aud.length||aud.indexOf('free')>=0) return true;
  var cat=memberCat();
  if(cat==='free') return false;
  if(aud.indexOf(cat)<0) return false;
  var svcs=userServicesList();
  if(svcs===null) return true;
  return svcs.indexOf(svc)>=0;
}
async function loadSignalsFromDB(){
  const g=document.getElementById('signalsGrid');if(!g)return;
  if(!sb){g.innerHTML='';return;}
  g.innerHTML='<div style="color:var(--text-muted);padding:30px;text-align:center;grid-column:1/-1;">Loading signals...</div>';

  // V113: refresh verification state first so an Admin-approved account is
  // unlocked immediately without requiring logout/login or another refresh.
  try{
    if(window.PSPAccountVerification&&typeof window.PSPAccountVerification.load==='function'){
      await window.PSPAccountVerification.load(true);
    }
  }catch(_){}

  // V114: use the verified-user RPC feed instead of relying on each user's
  // table-level RLS path. This fixes cases where one verified account sees
  // signals while another equally verified account receives an empty table.
  let data=null,error=null;
  try{
    const feed=await sb.rpc('psp_user_signals_feed',{p_limit:250});
    data=feed.data;
    error=feed.error;
  }catch(e){
    error=e;
  }

  // Safe compatibility fallback while SQL migration is being deployed.
  if(error){
    console.warn('Signals RPC feed unavailable, trying legacy direct query:',error);
    const legacy=await sb.from('signals').select('*').order('created_at',{ascending:false});
    data=legacy.data;
    error=legacy.error;
  }

  if(error){
    console.error('Signals load failed:',error);
    g.innerHTML='<div style="color:var(--red);padding:30px;text-align:center;grid-column:1/-1;">Signals could not be loaded. Please refresh once. If the issue continues, contact Admin.</div>';
    return;
  }
  const _isVip=!!(currentProfile&&currentProfile.is_premium);
  window._SIGRAW=window._SIGRAW||{};(data||[]).forEach(function(s){window._SIGRAW[s.id]=s;});
  SIGNALS=(data||[]).map(s=>{
    const audStr=s.audience||(((s.access_level||'free')==='vip')?'premium,vip':'free');
    return {
    id:s.id, pair:s.pair||'', dir:(/sell/i).test(s.direction||'')?'sell':'buy',
    access:s.access_level||'free', plan:s.plan_name||'',
    locked:!canAccessContent('signal',audStr),
    entry:s.entry_price==null?'-':s.entry_price, sl:s.stop_loss==null?'-':s.stop_loss,
    tp1:s.take_profit1==null?'-':s.take_profit1, tp2:s.take_profit2==null?'-':s.take_profit2, tp3:s.take_profit3==null?'-':s.take_profit3, tp4:(s.take_profit4||''),
    tpHit:s.tp_hit||0, rawStatus:(s.status||'active'), beMoved:!!s.be_moved, orderType:((s.order_type||'market')+'').toLowerCase(), pips:(s.result_pips==null?null:s.result_pips), activatedAt:(s.activated_at||null), closingPrice:(s.closing_price==null?null:s.closing_price),
    status:((s.status==='active'||s.status==='pending')?'active':((s.status==='sl'||s.status==='closed'||s.status==='be')?'closed':'tp')),
    cat:sigCat(s.pair), ico:sigIco(s.pair), official:!!s.is_official, time:pspFmtDateTime(s.created_at),
    ts:s.created_at, closedTs:(s.closed_at||s.created_at)
  };});
  renderSignals();
}
function renderSigResultDash(rows,elId){
  var el=document.getElementById(elId||'sigResultDash');if(!el)return;
  var now=new Date();
  var weekAgo=new Date(now.getTime()-7*86400000);
  var monthStart=new Date(now.getFullYear(),now.getMonth(),1);
  var tF=(typeof sigTimeF!=='undefined')?sigTimeF:'all';
  var total=0,week=0,month=0,wins=0,losses=0,count=0,bestPair='',bestPips=-1e9,pairAgg={};
  (rows||[]).forEach(function(s){
    var pv=(s.result_pips!=null)?s.result_pips:s.pips;
    if(pv==null)return;
    var p=Number(pv);if(isNaN(p))return;
    var d=new Date(s.closed_at||s.closedTs||s.created_at||s.ts);
    total+=p;count++;if(p>=0)wins++;else losses++;
    if(d>=weekAgo)week+=p;
    if(d>=monthStart)month+=p;
    pairAgg[s.pair]=(pairAgg[s.pair]||0)+p;
  });
  if(!count){el.innerHTML='<div class="card" style="margin-bottom:18px;text-align:center;color:var(--text-muted);padding:22px;">🏆 No closed trades'+(tF!=='all'?' for this period':' yet')+'.</div>';return;}
  Object.keys(pairAgg).forEach(function(k){if(pairAgg[k]>bestPips){bestPips=pairAgg[k];bestPair=k;}});
  var fmt=function(v){return (v>=0?'+':'')+(Math.round(v*10)/10);};
  var col=function(v){return v>=0?'#10b981':'#ef4444';};
  var wr=Math.round(wins/count*100);
  var tile=function(lab,val,c){return '<div class="tile"><div class="lab">'+lab+'</div><div class="val" style="color:'+c+'">'+val+'</div></div>';};
  var donut='<div style="position:relative;width:150px;height:150px;flex:0 0 auto;">'+
      '<div class="perf-donut" style="width:150px;height:150px;border-radius:50%;background:conic-gradient(#10b981 0 '+wr+'%, #ef4444 '+wr+'% 100%);box-shadow:0 0 0 1px var(--border);"></div>'+
      '<div style="position:absolute;inset:20px;border-radius:50%;background:var(--bg-card);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px var(--border);">'+
        '<div style="font-size:28px;font-weight:900;color:var(--gold);line-height:1;">'+wr+'%</div>'+
        '<div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-top:3px;">Win Rate</div>'+
      '</div></div>';
  var legend='<div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;justify-content:center;">'+
      '<span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;"><span style="width:10px;height:10px;border-radius:3px;background:#10b981;"></span>'+wins+' Wins</span>'+
      '<span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;"><span style="width:10px;height:10px;border-radius:3px;background:#ef4444;"></span>'+losses+' Losses</span></div>';
  el.innerHTML='<div class="card" style="margin-bottom:18px;background:linear-gradient(135deg,rgba(245,158,11,.05),transparent);">'+
    '<div class="card-title" style="margin-bottom:4px;display:flex;align-items:center;gap:8px;">🏆 Signal Results <span style="font-size:11px;font-weight:500;color:var(--text-muted);">· '+count+' closed</span></div>'+
    '<div style="display:flex;gap:26px;align-items:center;flex-wrap:wrap;margin-top:14px;">'+
      '<div style="display:flex;flex-direction:column;align-items:center;">'+donut+legend+'</div>'+
      '<div style="flex:1;min-width:250px;"><div class="sigdash" style="grid-template-columns:1fr 1fr;">'+
        (tF==='all'
          ? tile('Total Pips',fmt(total),col(total))+tile('This Week',fmt(week),col(week))+tile('This Month',fmt(month),col(month))
          : tile(tF==='today'?'Today Pips':(tF==='week'?'Last Week Pips':'This Month Pips'),fmt(total),col(total)))+
        tile('Best Pair',bestPair?(bestPair+' '+fmt(bestPips)):'-','var(--gold)')+
      '</div></div>'+
    '</div></div>';
}
function sigWAtext(s){
  var dir=(/sell/i).test(s.direction||'')?'SELL 🔴':'BUY 🟢';
  var L=['📊 '+(s.pair||'')+' — '+dir];
  if(s.entry_price!=null)L.push('Entry: '+s.entry_price);
  if(s.stop_loss!=null)L.push('SL: '+s.stop_loss);
  if(s.take_profit1!=null)L.push('TP1: '+s.take_profit1);
  if(s.take_profit2!=null)L.push('TP2: '+s.take_profit2);
  if(s.take_profit3!=null)L.push('TP3: '+s.take_profit3);
  if(s.result_pips!=null)L.push((s.result_pips>=0?'✅ Result: +':'❌ Result: ')+s.result_pips+' pips');
  if(s.notes)L.push('📝 Note: '+s.notes);
  return L.join('\n');
}
function perfToast(msg){
  try{var t=document.createElement('div');t.textContent=msg;t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:11px 20px;border-radius:12px;font-weight:700;font-size:14px;z-index:99999;box-shadow:0 8px 30px rgba(0,0,0,.3);';document.body.appendChild(t);setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .4s';setTimeout(function(){t.remove();},400);},1600);}catch(e){}
}
function copySignalWA(id){
  var s=(window._SIGRAW||{})[id];if(!s)return;
  var txt=sigWAtext(s);
  function done(){perfToast('✅ Signal copied — paste in WhatsApp');}
  function fb(){try{var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();done();}catch(e){alert(txt);}}
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done).catch(fb);}else fb();}catch(e){fb();}
}
function waBtn(id){return '';}
async function loadPerformance(){
  if(!sb)return;
  var hi=document.getElementById('perfHello');if(hi&&currentProfile){var nm=((currentProfile.full_name||currentProfile.email||'Trader')+'').split(' ')[0];hi.textContent='Welcome 👋';}
  try{
    var sr=await sb.rpc('psp_user_signals_feed',{p_limit:250});
    if(sr.error)sr=await sb.from('signals').select('*').order('created_at',{ascending:false});
    var rows=sr.data||[];
    window._SIGRAW=window._SIGRAW||{};rows.forEach(function(s){window._SIGRAW[s.id]=s;});
    renderPerfDash(rows);
  }catch(e){}
}
function renderPerfSignals(rows){
  var box=document.getElementById('perfSignals');if(!box)return;
  var list=(rows||[]).slice(0,5);
  if(!list.length){box.innerHTML='<div style="color:var(--text-muted);padding:14px;">No signals yet.</div>';return;}
  box.innerHTML='<div style="display:grid;gap:10px;">'+list.map(function(s){
    var audStr=s.audience||(((s.access_level||'free')==='vip')?'premium,vip':'free');
    var locked=!canAccessContent('signal',audStr);
    var buy=!(/sell/i).test(s.direction||'');
    var st=(s.status||'active');var stTxt={active:'● Active',tp1:'✓ TP1',tp2:'✓ TP2',tp3:'🏆 TP3',sl:'🛑 SL',closed:'🔒 Closed'}[st]||'● Active';
    var pips=(s.result_pips!=null)?'<span style="color:'+(s.result_pips>=0?'#10b981':'#ef4444')+';font-weight:800;">'+(s.result_pips>=0?'+':'')+s.result_pips+' pips</span>':'';
    var lvls=locked?'<span style="color:var(--gold);font-weight:700;">🔒 VIP — unlock to view</span>':('Entry '+(s.entry_price||'-')+' · SL '+(s.stop_loss||'-')+' · TP1 '+(s.take_profit1||'-')+(s.take_profit2!=null?(' · TP2 '+s.take_profit2):'')+(s.take_profit3!=null?(' · TP3 '+s.take_profit3):''));
    return '<div style="border:1px solid var(--border);border-radius:12px;padding:11px 13px;background:rgba(255,255,255,.02);"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;"><div style="font-weight:800;">'+sigIco(s.pair)+' '+vEsc(s.pair||'')+' <span style="font-size:10px;padding:1px 7px;border-radius:9px;background:'+(buy?'rgba(16,185,129,.18);color:#10b981':'rgba(239,68,68,.18);color:#ef4444')+';">'+(buy?'BUY':'SELL')+'</span></div><div style="display:flex;gap:8px;align-items:center;">'+pips+'<span style="font-size:11px;color:var(--text-muted);">'+stTxt+'</span>'+(locked?'':waBtn(s.id))+'</div></div><div style="font-size:12px;color:var(--text-muted);margin-top:5px;">'+lvls+'</div></div>';
  }).join('')+'</div>';
}
function renderPerfCharts(rows){
  var box=document.getElementById('perfCharts');if(!box)return;
  var list=(rows||[]).slice(0,5);
  if(!list.length){box.innerHTML='<div style="color:var(--text-muted);padding:14px;">No charts yet.</div>';return;}
  box.innerHTML='<div style="display:grid;gap:10px;">'+list.map(function(c){
    var audStr=c.audience||'all';var locked=!canAccessContent('chart',audStr);
    return '<div onclick="document.querySelector(\'[data-page=articles]\').click()" style="border:1px solid var(--border);border-radius:12px;padding:10px 12px;background:rgba(255,255,255,.02);cursor:pointer;display:flex;gap:10px;align-items:center;">'+(c.image_url&&!locked?'<img src="'+vEsc(c.image_url)+'" style="width:54px;height:42px;object-fit:cover;border-radius:8px;flex:0 0 auto;">':'<div style="width:54px;height:42px;border-radius:8px;background:rgba(245,158,11,.12);display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto;">📈</div>')+'<div style="min-width:0;"><div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+vEsc(c.title||c.pair||'Chart Analysis')+'</div><div style="font-size:11px;color:var(--text-muted);">'+(locked?'🔒 Members only':vEsc((c.notes||'').slice(0,50)))+'</div></div></div>';
  }).join('')+'</div>';
}
function renderPerfNews(rows){
  var box=document.getElementById('perfNews');if(!box)return;
  var list=(rows||[]).slice(0,5);
  if(!list.length){box.innerHTML='<div style="color:var(--text-muted);padding:14px;">No news yet.</div>';return;}
  box.innerHTML='<div style="display:grid;gap:10px;">'+list.map(function(n){
    return '<div onclick="document.querySelector(\'[data-page=news]\').click()" style="border:1px solid var(--border);border-radius:12px;padding:10px 12px;background:rgba(255,255,255,.02);cursor:pointer;"><div style="font-weight:700;font-size:13px;">'+vEsc(n.title||'(untitled)')+'</div><div style="font-size:11px;color:var(--text-muted);margin-top:3px;">'+vEsc((n.content||n.body||'').slice(0,70))+'</div></div>';
  }).join('')+'</div>';
}
function savePerfGoal(){
  var i=document.getElementById('perfGoalInput');if(!i)return;
  var v=parseFloat(i.value)||0;
  try{localStorage.setItem('psp_month_goal',String(v));}catch(e){}
  perfToast('✅ Goal saved');
  if(window._perfRows)renderPerfDash(window._perfRows);
}
function renderPerfDash(rows){
  var el=document.getElementById('perfResults');if(!el)return;
  window._perfRows=rows;
  var now=new Date();
  var weekAgo=new Date(now.getTime()-7*86400000);
  var monthStart=new Date(now.getFullYear(),now.getMonth(),1);
  var closed=rows.filter(function(s){return s.result_pips!=null;});
  var wins=closed.filter(function(s){return Number(s.result_pips)>=0;}).length;
  var losses=closed.length-wins;
  var tpCount=rows.filter(function(s){return ['tp1','tp2','tp3'].indexOf(s.status)>=0;}).length;
  var slCount=rows.filter(function(s){return s.status==='sl';}).length;
  var wr=closed.length?Math.round(wins/closed.length*100):0;
  var total=0,week=0,month=0;
  var greenPips=0,redPips=0;
  closed.forEach(function(s){var p=Number(s.result_pips)||0;var d=new Date(s.closed_at||s.created_at);total+=p;if(p>=0)greenPips+=p;else redPips+=p;if(d>=weekAgo)week+=p;if(d>=monthStart)month+=p;});
  var fmt=function(v){return (v>=0?'+':'')+(Math.round(v*10)/10);};
  var col=function(v){return v>=0?'#10b981':'#ef4444';};
  // last 14 days
  var days=[];for(var i=13;i>=0;i--){var d=new Date(now);d.setDate(d.getDate()-i);days.push({key:d.toISOString().slice(0,10),label:d.getDate(),count:0});}
  rows.forEach(function(s){var k=new Date(s.created_at).toISOString().slice(0,10);var dd=days.find(function(x){return x.key===k;});if(dd)dd.count++;});
  var maxC=Math.max.apply(null,[1].concat(days.map(function(d){return d.count;})));
  // top pairs
  var pc={};rows.forEach(function(s){if(s.pair)pc[s.pair]=(pc[s.pair]||0)+1;});
  var pairs=Object.keys(pc).map(function(k){return {pair:k,n:pc[k]};}).sort(function(a,b){return b.n-a.n;}).slice(0,5);
  var maxP=Math.max.apply(null,[1].concat(pairs.map(function(p){return p.n;})));
  // recent activity
  var recent=rows.slice(0,6);
  // monthly goal
  var goal=5000;
  var earned=Math.max(0,month);
  var gpct=goal>0?Math.min(100,Math.round(earned/goal*100)):0;

  // Win rate ring (SVG)
  var R=52,C=2*Math.PI*R,off=C*(1-wr/100);
  var ring='<svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/><circle cx="65" cy="65" r="52" fill="none" stroke="#10b981" stroke-width="12" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+off+'" transform="rotate(-90 65 65)" style="transition:stroke-dashoffset 1s"/><text x="65" y="62" text-anchor="middle" font-size="27" font-weight="800" fill="#f59e0b">'+wr+'%</text><text x="65" y="82" text-anchor="middle" font-size="11" fill="#9ca3af">win</text></svg>';

  // 14-day bars
  var bars='<div style="display:flex;align-items:flex-end;gap:4px;height:120px;">'+days.map(function(d){
    var h=Math.round(d.count/maxC*100);
    return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end;"><div title="'+d.count+' signals" style="width:100%;border-radius:5px 5px 0 0;background:linear-gradient(180deg,#f59e0b,#d97706);height:'+(d.count?Math.max(h,6):2)+'%;'+(d.count?'':'opacity:.3;')+'transition:height .8s;"></div><div style="font-size:9px;color:var(--text-muted);">'+d.label+'</div></div>';
  }).join('')+'</div>';

  // top pairs bars
  var topPairs=pairs.length?pairs.map(function(p){
    return '<div style="margin-bottom:11px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><b>'+vEsc(p.pair)+'</b><span style="color:var(--text-muted);">'+p.n+' signal'+(p.n>1?'s':'')+'</span></div><div style="height:7px;border-radius:5px;background:rgba(255,255,255,.06);overflow:hidden;"><div style="height:100%;width:'+Math.round(p.n/maxP*100)+'%;background:linear-gradient(90deg,#f59e0b,#d97706);border-radius:5px;transition:width .9s;"></div></div></div>';
  }).join(''):'<div style="color:var(--text-muted);">No signals yet.</div>';

  // recent activity
  var stMap={active:['Active','#10b981'],tp1:['TP1 hit','#10b981'],tp2:['TP2 hit','#10b981'],tp3:['TP3 hit','#10b981'],sl:['SL hit','#ef4444'],closed:['Closed','#94a0b8']};
  var act=recent.length?recent.map(function(s){
    var buy=!(/sell/i).test(s.direction||'');var stv=stMap[s.status||'active']||stMap.active;
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);"><div style="font-weight:700;font-size:13px;">'+vEsc(s.pair||'')+' <span style="font-size:9px;padding:1px 6px;border-radius:8px;background:'+(buy?'rgba(16,185,129,.18);color:#10b981':'rgba(239,68,68,.18);color:#ef4444')+';">'+(buy?'BUY':'SELL')+'</span></div><span style="font-size:11px;font-weight:700;color:'+stv[1]+';">'+stv[0]+'</span></div>';
  }).join(''):'<div style="color:var(--text-muted);">No activity yet.</div>';

  el.innerHTML=
    // Net / Green / Red pips
    '<div class="sigdash" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">'+
      '<div class="tile" style="border-color:rgba(245,158,11,.3);"><div class="lab">Total Net Pips</div><div class="val" style="color:'+col(total)+'">'+fmt(total)+'</div></div>'+
      '<div class="tile" style="border-color:rgba(16,185,129,.3);"><div class="lab">Total Green Pips</div><div class="val" style="color:#10b981">'+fmt(greenPips)+'</div></div>'+
      '<div class="tile" style="border-color:rgba(239,68,68,.3);"><div class="lab">Total Red Pips</div><div class="val" style="color:#ef4444">'+fmt(redPips)+'</div></div>'+
    '</div>'+
    // pips strip (week / month)
    '<div class="sigdash" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">'+
      '<div class="tile"><div class="lab">Total Pips</div><div class="val" style="color:'+col(total)+'">'+fmt(total)+'</div></div>'+
      '<div class="tile"><div class="lab">This Week</div><div class="val" style="color:'+col(week)+'">'+fmt(week)+'</div></div>'+
      '<div class="tile"><div class="lab">This Month</div><div class="val" style="color:'+col(month)+'">'+fmt(month)+'</div></div>'+
    '</div>'+
    // Row A
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;" class="perf-rowA">'+
      '<div class="card"><div class="card-title" style="margin-bottom:12px;">🏆 Monthly Pips Goal</div>'+
        '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;"><span style="color:var(--text-muted);">'+fmt(earned)+' earned</span><b style="color:var(--gold);">'+gpct+'%</b></div>'+
        '<div style="height:9px;border-radius:6px;background:rgba(255,255,255,.07);overflow:hidden;margin-bottom:12px;"><div style="height:100%;width:'+gpct+'%;background:linear-gradient(90deg,#f59e0b,#10b981);border-radius:6px;transition:width 1s;"></div></div>'+
        '<div style="font-size:12px;color:var(--text-muted);">🎯 Target: <b style="color:var(--gold)">5000 pips</b> / month</div>'+
      '</div>'+
      '<div class="card"><div class="card-title" style="margin-bottom:12px;">📊 Signals — last 14 days</div>'+bars+'</div>'+
      '<div class="card"><div class="card-title" style="margin-bottom:8px;">🎯 Win Rate</div><div style="display:flex;flex-direction:column;align-items:center;">'+ring+'<div style="font-size:12px;color:var(--text-muted);margin-top:6px;">'+tpCount+' TP · '+slCount+' SL · '+closed.length+' total</div></div></div>'+
    '</div>'+
    // Row B
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;" class="perf-rowB">'+
      '<div class="card"><div class="card-title" style="margin-bottom:12px;">🔥 Top Traded Pairs</div>'+topPairs+'</div>'+
      '<div class="card"><div class="card-title" style="margin-bottom:6px;">⚡ Recent Activity</div>'+act+'</div>'+
    '</div>';
}
function sigDateKey(ts){
  const d=new Date(ts); d.setHours(0,0,0,0); return d.getTime();
}
function sigGroupLabel(ts){
  const d=new Date(ts);
  const today=new Date(); today.setHours(0,0,0,0);
  const y=new Date(today); y.setDate(today.getDate()-1);
  const dk=sigDateKey(ts);
  if(dk===today.getTime()) return 'Today Signals';
  if(dk===y.getTime()) return 'Yesterday Signals';
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
}

function sigHistoryResultLabel(s){
  if(s.rawStatus==='be') return 'BE Hit';
  if(s.rawStatus==='sl') return 'SL Hit';
  if(s.tpHit>=3 || s.rawStatus==='tp3') return 'TP3 Hit';
  if(s.tpHit===2 || s.rawStatus==='tp2') return 'TP2 Hit';
  if(s.tpHit===1 || s.rawStatus==='tp1') return 'TP1 Hit';
  return 'Closed';
}
function sigHistoryStatusLabel(s){
  return (s.rawStatus==='sl'||s.rawStatus==='closed'||s.rawStatus==='tp3'||s.rawStatus==='be')?'Closed':(s.beMoved?'Active · 🔒SL@BE':'Active');
}
function sigHistoryRow(s){
  var d=pspFmtDateTime(s.ts);
  var dir=(s.dir||'').toUpperCase()+((s.orderType&&s.orderType!=='market')?' '+s.orderType.toUpperCase():'');
  var p=(s.pips!=null)?((s.pips>=0?'+':'')+s.pips):'-';
  var pCls=(s.pips||0)>=0?'pips-pos':'pips-neg';
  return '<tr>'+
    '<td>'+vEsc(d)+'</td>'+
    '<td class="pair">'+vEsc(s.pair||'-')+'</td>'+
    '<td class="'+(dir==='SELL'?'sell':'buy')+'">'+vEsc(dir||'-')+'</td>'+
    '<td>'+vEsc(s.entry||'-')+'</td>'+
    '<td>'+vEsc(s.sl||'-')+'</td>'+
    '<td>'+vEsc(s.tp1||'-')+'</td>'+
    '<td>'+vEsc(s.tp2||'-')+'</td>'+
    '<td>'+vEsc(s.tp3||'-')+'</td>'+
    '<td><span class="sig-status st-tp">'+vEsc(sigHistoryResultLabel(s))+'</span></td>'+
    '<td class="'+pCls+'">'+vEsc(p)+'</td>'+
    '<td><span class="sig-status st-closed">'+vEsc(sigHistoryStatusLabel(s))+'</span></td>'+
  '</tr>';
}

function renderSignals(){
  const g=document.getElementById('signalsGrid');if(!g)return;
  var rd=document.getElementById('sigResultDash');if(rd)rd.style.display=(sigView==='history')?'block':'none';
  var now=Date.now();
  function inTime(s){
    if(sigView!=='history'||sigTimeF==='all')return true;
    var t=new Date(s.closedTs||s.ts).getTime();var d=new Date();
    if(sigTimeF==='today'){var ds=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();return t>=ds;}
    if(sigTimeF==='week')return t>=now-7*86400000;
    if(sigTimeF==='month')return t>=new Date(d.getFullYear(),d.getMonth(),1).getTime();
    return true;
  }
  const list=SIGNALS.filter(function(s){
    var finished=(s.rawStatus==='sl'||s.rawStatus==='closed'||s.rawStatus==='tp3'||s.rawStatus==='be');
    var viewOk=(sigView==='active')?(!finished):finished;
    var catOk=(sigF==='all')?true:(s.cat===sigF);
    return viewOk&&catOk&&inTime(s);
  });
  if(sigView==='history'){try{renderSigResultDash(list);}catch(e){}}
  const stMap={active:['st-active','● Active'],tp:['st-tp','✓ TP Hit'],closed:['st-closed','Closed']};
  if(!list.length){
    g.innerHTML='<div style="color:var(--text-muted);padding:30px;text-align:center;grid-column:1/-1;">'+(sigView==='history'?'No closed signals'+(sigTimeF!=='all'?' for this period':'')+' yet.':'No active signals right now. Check History for past results.')+'</div>';
    return;
  }
  let lastSigKey=null;
  let sigHtml='';

  if(sigView==='history'){
    let currentRows='';
    function flushTable(){
      if(currentRows){
        sigHtml+=`<div class="sig-history-table-wrap"><table class="sig-history-table">
          <thead><tr><th>Date</th><th>Pair</th><th>Type</th><th>Entry</th><th>SL</th><th>TP1</th><th>TP2</th><th>TP3</th><th>Result</th><th>Pips</th><th>Status</th></tr></thead>
          <tbody>${currentRows}</tbody>
        </table></div>`;
        currentRows='';
      }
    }
    list.forEach(s=>{
      const groupTs=new Date(s.closedTs||s.ts).getTime();
      const sigKey=sigDateKey(groupTs);
      if(sigKey!==lastSigKey){
        flushTable();
        lastSigKey=sigKey;
        sigHtml+=`<div class="signal-date-heading" style="grid-column:1/-1;margin:6px 0 -2px;display:flex;align-items:center;gap:12px;">
          <div style="font-size:18px;font-weight:800;color:var(--text-primary);white-space:nowrap;">${sigGroupLabel(groupTs)}</div>
          <div style="height:1px;background:var(--border);flex:1;"></div>
        </div>`;
      }
      currentRows+=sigHistoryRow(s);

      const a=stMap[s.status]||stMap.active;const sc=a[0],st=a[1];
      const pct=s.rawStatus==='sl'?100:(s.tpHit>=3?100:s.tpHit===2?66:s.tpHit===1?33:0);
      const loss=s.rawStatus==='sl';
      const prog=`<div style="margin-top:12px;">
        <div class="sig-prog ${loss?'loss':''}" style="--w:${pct}%"><span></span></div>
        <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:9px;font-weight:700;">
          <span style="color:${s.tpHit>=1&&!loss?'#10b981':'var(--text-muted)'}">${s.tpHit>=1&&!loss?'✓ ':''}TP1</span>
          <span style="color:${s.tpHit>=2&&!loss?'#10b981':'var(--text-muted)'}">${s.tpHit>=2&&!loss?'✓ ':''}TP2</span>
          <span style="color:${s.tpHit>=3&&!loss?'#10b981':'var(--text-muted)'}">${s.tpHit>=3&&!loss?'✓ ':''}TP3</span>
        </div>
      </div>`;
      sigHtml+=`<div class="card sig-card sig-history-mobile-card">
        <div class="sig-top"><div class="sig-pair">${s.ico} ${s.pair}</div><span class="sig-dir ${s.dir}">${s.dir.toUpperCase()}</span>${s.orderType&&s.orderType!=='market'?`<span style="font-size:11.5px;font-weight:900;padding:5px 11px;border-radius:999px;background:rgba(14,165,233,.14);color:#0ea5e9;border:1.5px solid rgba(14,165,233,.55);letter-spacing:.4px;white-space:nowrap;margin-left:6px">${s.orderType==='limit'?'📍':'🚀'} ${s.dir.toUpperCase()} ${s.orderType.toUpperCase()}</span>`:''}</div>
        <div class="sig-levels">
          <div class="sig-lv"><div class="l">Entry</div><div class="v">${s.entry}</div></div>
          <div class="sig-lv"><div class="l">Stop Loss</div><div class="v" style="color:var(--red)">${s.sl}</div></div>
          <div class="sig-lv"><div class="l">Take Profit 1</div><div class="v" style="color:var(--green)">${s.tp1}</div></div>
          <div class="sig-lv"><div class="l">Take Profit 2</div><div class="v" style="color:var(--green)">${s.tp2}</div></div>
          <div class="sig-lv"><div class="l">Take Profit 3</div><div class="v" style="color:var(--green)">${s.tp3}</div></div>
        </div>
        ${prog}
        <div class="sig-foot"><span style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">${s.locked?'':waBtn(s.id)}${s.pips!=null?`<span style="color:${s.pips>=0?'#10b981':'#ef4444'};font-weight:800;font-size:12px;">${s.pips>=0?'+':''}${s.pips} pips</span>`:''}<span class="sig-status ${sc}">${st}</span></span><span style="white-space:nowrap;color:var(--text-muted);">🕐 ${s.time}</span></div>
      </div>`;
    });
    flushTable();
  } else {
    list.forEach(s=>{
      const groupTs=new Date(s.closedTs||s.ts).getTime();
      const sigKey=sigDateKey(groupTs);
      if(sigKey!==lastSigKey){
        lastSigKey=sigKey;
        sigHtml+=`<div class="signal-date-heading" style="grid-column:1/-1;margin:6px 0 -2px;display:flex;align-items:center;gap:12px;">
          <div style="font-size:18px;font-weight:800;color:var(--text-primary);white-space:nowrap;">${sigGroupLabel(groupTs)}</div>
          <div style="height:1px;background:var(--border);flex:1;"></div>
        </div>`;
      }
      const a=stMap[s.status]||stMap.active;const sc=a[0],st=a[1];
      const pct=s.rawStatus==='sl'?100:(s.tpHit>=3?100:s.tpHit===2?66:s.tpHit===1?33:0);
      const loss=s.rawStatus==='sl';
      const prog=`<div style="margin-top:12px;">
        <div class="sig-prog ${loss?'loss':''}" style="--w:${pct}%"><span></span></div>
        <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:9px;font-weight:700;">
          <span class="${s.tpHit>=1&&!loss?'tp-on':''}" style="color:${s.tpHit>=1&&!loss?'#10b981':'var(--text-muted)'}">${s.tpHit>=1&&!loss?'✓ ':''}TP1</span>
          <span class="${s.tpHit>=2&&!loss?'tp-on':''}" style="color:${s.tpHit>=2&&!loss?'#10b981':'var(--text-muted)'}">${s.tpHit>=2&&!loss?'✓ ':''}TP2</span>
          <span class="${s.tpHit>=3&&!loss?'tp-on':''}" style="color:${s.tpHit>=3&&!loss?'#10b981':'var(--text-muted)'}">${s.tpHit>=3&&!loss?'✓ ':''}TP3</span>
        </div>
      </div>`;
      const lockOv=s.locked?'<div onclick="showPage(\'vipplans\', document.querySelector(\'[data-page=vipplans]\'))" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;z-index:2;cursor:pointer">\
<div style="font-size:14px;font-weight:800;color:var(--gold)">🔒 VIP Signal</div>\
<div style="font-size:11px;color:var(--text-muted)">Tap to upgrade &amp; unlock Entry, SL &amp; TP</div>\
<div style="margin-top:4px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0a0e1a;font-weight:800;font-size:11px;padding:6px 14px;border-radius:8px">View VIP Plans →</div></div>':'';
      sigHtml+=`<div class="card sig-card">
        <div class="sig-top"><div class="sig-pair">${s.ico} ${s.pair}</div><span class="sig-dir ${s.dir}">${s.dir.toUpperCase()}</span>${s.orderType&&s.orderType!=='market'?`<span style="font-size:11.5px;font-weight:900;padding:5px 11px;border-radius:999px;background:rgba(14,165,233,.14);color:#0ea5e9;border:1.5px solid rgba(14,165,233,.55);letter-spacing:.4px;white-space:nowrap;margin-left:6px">${s.orderType==='limit'?'📍':'🚀'} ${s.dir.toUpperCase()} ${s.orderType.toUpperCase()}</span>`:''}</div>
        <div style="position:relative">
          ${lockOv}
          <div class="sig-levels" style="${s.locked?'filter:blur(7px);pointer-events:none;user-select:none':''}">
            <div class="sig-lv"><div class="l">Entry</div><div class="v">${s.entry}</div></div>
            <div class="sig-lv"><div class="l">Stop Loss</div><div class="v" style="color:var(--red)">${s.sl}</div></div>
            <div class="sig-lv"><div class="l">Take Profit 1</div><div class="v" style="color:var(--green)">${s.tp1}</div></div>
            <div class="sig-lv"><div class="l">Take Profit 2</div><div class="v" style="color:var(--green)">${s.tp2}</div></div>
            <div class="sig-lv"><div class="l">Take Profit 3</div><div class="v" style="color:var(--green)">${s.tp3}</div></div>
            ${s.tp4?`<div class="sig-lv"><div class="l">Take Profit 4</div><div class="v" style="color:${(s.tp4+'').toLowerCase()==='open'?'#f59e0b':'var(--green)'}">${(s.tp4+'').toLowerCase()==='open'?'🔓 OPEN — let it run':s.tp4}</div></div>`:''}
            ${s.beMoved?`<div class="sig-lv" style="border:1px solid rgba(14,165,233,.5);background:rgba(14,165,233,.10)"><div class="l" style="color:#0ea5e9">Breakeven</div><div class="v" style="color:#0ea5e9">🔒 ACTIVE</div></div>`:''}
          </div>
        </div>
        ${prog}
        <div class="sig-foot"><span style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">${s.locked?'':waBtn(s.id)}${s.pips!=null?`<span style="color:${s.pips>=0?'#10b981':'#ef4444'};font-weight:800;font-size:12px;">${s.pips>=0?'+':''}${s.pips} pips</span>`:''}<span class="sig-status ${sc}">${st}</span></span><span style="white-space:nowrap;color:var(--text-muted);">🕐 ${s.time}</span></div>
      </div>`;
    });
  }
  g.innerHTML=sigHtml;
}

// ===== CHARTS & ARTICLES (from DB) =====
let ARTICLES=[];
let CHART_ITEMS=[];
let ARTICLE_ITEMS=[];
let artF='all';
let artMode='charts';
function setArtMode(mode,el){
  artMode=mode;
  document.querySelectorAll('#artModeCharts,#artModeArticles').forEach(b=>b.classList.remove('active'));
  if(el) el.classList.add('active');
  const filters=document.getElementById('artFilters');
  const title=document.getElementById('artPageTitle');
  const meta=document.getElementById('artPageMeta');
  if(mode==='articles'){
    if(filters) filters.style.display='flex';
    if(title) title.innerHTML='📖 Articles';
    if(meta) meta.textContent='Forex learning, strategies & educational content';
  }else{
    if(filters) filters.style.display='none';
    if(title) title.innerHTML='📈 Charts & Analysis';
    if(meta) meta.textContent='Trading charts, market analysis & setups';
  }
  renderArticles();
}
function artFilter(f,el){artF=f;document.querySelectorAll('#artFilters .sig-fbtn').forEach(b=>b.classList.remove('active'));if(el)el.classList.add('active');renderArticles()}
async function loadArticlesFromDB(){
  const g=document.getElementById('articlesGrid');if(!g)return;
  if(!sb){g.innerHTML='';return;}
  g.innerHTML='<div style="color:var(--text-muted);padding:30px;text-align:center;grid-column:1/-1;">Loading...</div>';
  const res=await Promise.all([
    sb.from('articles').select('*').eq('is_published',true).order('created_at',{ascending:false}),
    sb.from('charts').select('*').order('created_at',{ascending:false})
  ]);
  const ares=res[0], cres=res[1];
  if(ares.error){g.innerHTML='<div style="color:var(--red);padding:30px;text-align:center;grid-column:1/-1;">'+ares.error.message+'</div>';return;}
  const grad='linear-gradient(135deg,#3a2f1e,#1f0f33)';
  ARTICLE_ITEMS=(ares.data||[]).filter(a=>a.type!=='chart').map(a=>({
    kind:'article', cat:(a.category||'education'), tag:(a.category||'Article'), ico:'📝', grad:grad,
    title:a.title||'(untitled)', ex:(a.content||'').slice(0,140), content:a.content||'', contentUr:a.content_ur||'',
    image:a.image_url||'', date:pspFmtDateTime(a.created_at), ts:new Date(a.created_at).getTime()
  }));
  CHART_ITEMS=(cres&&cres.error)?[]:((cres&&cres.data)||[]).map(c=>{
    const audStr=c.audience||'all';
    const locked=!canAccessContent('chart',audStr);
    return {
      kind:'chart', cat:'chart', tag:'Chart', ico:'📈', grad:grad,
      title:c.title||'Chart Analysis',
      ex:locked?('🔒 Members-only chart — unlock to view'):(c.notes||'').slice(0,140),
      content:locked?('🔒 This chart is shared with selected members only.\n\nUpgrade from the VIP Plans page to unlock mentor charts & analysis.'):(c.notes||''),
      image:locked?'':(c.image_url||''), locked:locked,
      date:pspFmtDateTime(c.created_at), ts:new Date(c.created_at).getTime()
    };
  });
  ARTICLES=CHART_ITEMS.concat(ARTICLE_ITEMS).sort((a,b)=>b.ts-a.ts);
  setArtMode(artMode, document.getElementById(artMode==='articles'?'artModeArticles':'artModeCharts'));
}
function artDateKey(ts){
  const d=new Date(ts); d.setHours(0,0,0,0); return d.getTime();
}
function artGroupLabel(ts){
  const d=new Date(ts);
  const today=new Date(); today.setHours(0,0,0,0);
  const y=new Date(today); y.setDate(today.getDate()-1);
  const dk=artDateKey(ts);
  const suffix=artMode==='articles'?'Articles':'Charts';
  if(dk===today.getTime()) return 'Today '+suffix.toLowerCase();
  if(dk===y.getTime()) return 'Yesterday '+suffix.toLowerCase();
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
}
function renderArticles(){
  const g=document.getElementById('articlesGrid');if(!g)return;
  let list=artMode==='articles'?ARTICLE_ITEMS:CHART_ITEMS;
  if(artMode==='articles') list=list.filter(a=>artF==='all'||a.cat===artF);
  list=list.slice().sort((a,b)=>b.ts-a.ts);
  if(!list.length){g.innerHTML='<div style="color:var(--text-muted);padding:30px;text-align:center;grid-column:1/-1;">No '+(artMode==='articles'?'articles':'charts')+' yet.</div>';return;}
  let lastKey=null;
  let html='';
  list.forEach((a)=>{
    const key=artDateKey(a.ts);
    if(key!==lastKey){
      lastKey=key;
      html+=`<div class="chart-date-heading" style="grid-column:1/-1;margin:8px 0 2px;display:flex;align-items:center;gap:12px;">
        <div style="font-size:18px;font-weight:800;color:var(--text-primary);white-space:nowrap;">${artGroupLabel(a.ts)}</div>
        <div style="height:1px;background:var(--border);flex:1;"></div>
      </div>`;
    }
    const idx=ARTICLES.indexOf(a);
    const actionLabel=a.kind==='article'?'Read More':'View Details';
    html+=`<div class="card art-card art-media-only" onclick="openArt(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openArt(${idx})}" role="button" tabindex="0" aria-label="Open ${String(a.title||'item').replace(/"/g,'&quot;')}">
      <div class="art-cover" style="background:${a.image?('#000 url('+a.image+') center/cover no-repeat'):a.grad}">${a.image?'':a.ico}${a.locked?'<span style="position:absolute;top:10px;right:10px;background:var(--gold);color:#0a0e1a;font-size:9px;font-weight:800;padding:3px 8px;border-radius:5px">🔒 LOCKED</span>':''}</div>
      <div class="art-body">
        <div class="art-title">${String(a.title||'Untitled').replace(/</g,'&lt;')}</div>
        <div class="art-time">${String(a.date||'').replace(/</g,'&lt;')}</div>
        <button type="button" class="art-details-btn" onclick="event.stopPropagation();openArt(${idx})">${actionLabel} <span aria-hidden="true">→</span></button>
      </div>
    </div>`;
  });
  g.innerHTML=html;
}
function openArt(i){
  const a=ARTICLES[i];if(!a)return;
  const box=document.getElementById('artModalBox');
  const hasImg=!!a.image;
  box.style.maxWidth=hasImg?'1040px':'680px';
  box.style.padding=hasImg?'0':'26px';
  const closeBtn='<div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">'+
    '<button onclick="closeArt()" style="padding:10px 20px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-weight:600;cursor:pointer;font-family:inherit">Close</button>'+  '</div>';
  // Language: dono languages hon to toggle dikhao
  const hasBoth=!!(a.content&&a.contentUr);
  let lang='en';
  try{lang=localStorage.getItem('psp_art_lang')||'en';}catch(e){}
  if(!hasBoth)lang=a.contentUr?'ur':'en';
  const activeContent=(lang==='ur'&&a.contentUr)?a.contentUr:(a.content||a.contentUr||'');
  const langBtn=(v,lb)=>`<button onclick="setArtLang(${i},'${v}')" style="padding:7px 14px;border-radius:999px;border:1.5px solid ${lang===v?'var(--gold)':'var(--border)'};background:${lang===v?'var(--gold)':'transparent'};color:${lang===v?'#0a0e1a':'var(--text-muted)'};font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">${lb}</button>`;
  const langBar=hasBoth?`<div style="display:flex;gap:8px;margin:4px 0 12px">${langBtn('en','🇬🇧 English')}${langBtn('ur','🇵🇰 Roman Urdu')}</div>`:'';
  const text=`<h2 style="margin-top:0">${a.title}</h2><div class="art-meta" style="border:none;padding:0"><span></span><span>${a.date}</span></div>${langBar}<div class="body"><p>${(activeContent||'').replace(/\n/g,'<br>')}</p></div>${closeBtn}`;
  if(hasImg){
    box.innerHTML=`<div style="display:flex;flex-wrap:wrap;align-items:stretch">
      <div style="flex:1 1 440px;min-width:300px;background:#0a0e1a;display:flex;align-items:center;justify-content:center;padding:14px">
        <img src="${a.image}" title="Click to open full size" style="width:100%;max-height:80vh;object-fit:contain;border-radius:8px;cursor:zoom-in" onclick="window.open('${a.image}','_blank')">
      </div>
      <div style="flex:1 1 320px;min-width:280px;max-width:440px;padding:26px;overflow-y:auto;max-height:84vh">${text}</div>
    </div>`;
  } else {
    box.innerHTML=`<div class="art-cover" style="background:${a.grad};height:150px;font-size:54px">${a.ico}</div>${text}`;
  }
  document.getElementById('artModal').classList.add('open');
}
function closeArt(){document.getElementById('artModal').classList.remove('open')}
function setArtLang(i,v){try{localStorage.setItem('psp_art_lang',v);}catch(e){}openArt(i);}
let currentToolsTab='calculators';
window.currentToolsTab=currentToolsTab;
function setToolsTab(tab,el){
  currentToolsTab=tab;
  window.currentToolsTab=tab;
  var calc=document.getElementById('toolsCalculatorsPanel');
  var ban=document.getElementById('toolsBannersPanel');
  var meta=document.getElementById('toolsPageMeta');
  document.querySelectorAll('#toolsTabCalc,#toolsTabBanners').forEach(function(b){b.classList.remove('active')});
  if(el)el.classList.add('active');
  if(calc)calc.style.display=(tab==='calculators')?'block':'none';
  if(ban)ban.style.display=(tab==='banners')?'block':'none';
  if(meta)meta.textContent=(tab==='banners')?'Ready-made promotional banners for social media':'All 6 calculators ready to use — fill in values and click Calculate';
  if(tab==='banners' && typeof loadBanners==='function')loadBanners();
}
async function loadBanners(){
  var g=document.getElementById('bannersGrid');if(!g)return;
  if(!sb){g.innerHTML='';return;}
  g.innerHTML='<div style="color:var(--text-muted);padding:30px;text-align:center;grid-column:1/-1;">Loading…</div>';
  try{
    var r=await sb.from('banners').select('*').order('created_at',{ascending:false});
    var rows=r.data||[];
    if(!rows.length){g.innerHTML='<div style="color:var(--text-muted);padding:40px;text-align:center;grid-column:1/-1;">No banners yet. Check back soon! 🖼️</div>';return;}
    g.innerHTML=rows.map(function(b){
      return '<div class="card" style="padding:0;overflow:hidden;">'+
        '<div style="position:relative;background:#0a0e1a;"><img src="'+vEsc(b.image_url)+'" alt="banner" style="width:100%;display:block;object-fit:cover;"></div>'+
        '<div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;">'+
          '<div style="font-weight:700;font-size:13px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+vEsc(b.title||'Banner')+'</div>'+
          '<button onclick="downloadBanner(\''+b.image_url.replace(/'/g,"\\'")+'\',\''+((b.title||'banner').replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,40)||'banner')+'\')" style="flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:none;border-radius:9px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0a0e1a;font-weight:800;font-size:12px;cursor:pointer;">⬇️ Download</button>'+
        '</div></div>';
    }).join('');
  }catch(e){g.innerHTML='<div style="color:var(--red);padding:30px;text-align:center;grid-column:1/-1;">Could not load banners.</div>';}
}
function downloadBanner(url,name){
  if(!url)return;
  try{
    fetch(url).then(function(r){return r.blob();}).then(function(b){
      var ext=(url.split('.').pop()||'png').split('?')[0].toLowerCase();if(ext.length>4)ext='png';
      var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(name||'banner')+'.'+ext;document.body.appendChild(a);a.click();a.remove();
      setTimeout(function(){URL.revokeObjectURL(a.href);},2000);
      if(typeof pipToast==='function')pipToast('✅ Banner downloaded');
    }).catch(function(){window.open(url,'_blank');});
  }catch(e){window.open(url,'_blank');}
}
function downloadChartImg(url,name){
  if(!url)return;
  try{
    fetch(url).then(function(r){return r.blob();}).then(function(b){
      var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(name||'chart')+'.png';document.body.appendChild(a);a.click();a.remove();
      setTimeout(function(){URL.revokeObjectURL(a.href);},2000);
      if(typeof pipToast==='function')pipToast('✅ Chart downloaded');
    }).catch(function(){window.open(url,'_blank');});
  }catch(e){window.open(url,'_blank');}
}
function copyChartText(i){
  var a=ARTICLES[i];if(!a)return;
  var parts=[];if(a.title)parts.push(a.title);if(a.content)parts.push(a.content);
  var txt=parts.join('\n\n');
  function done(){if(typeof pipToast==='function')pipToast('✅ Copied');}
  function fb(){try{var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();done();}catch(e){alert(txt);}}
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done).catch(fb);}else fb();}catch(e){fb();}
}


// ============================================================================
// PIPSEPAISA V102 — PREMIUM RESPONSIVE SIGNALS UI
// 20 August 2026
// Desktop: compact table rows for BOTH Active and History.
// Mobile: compact expandable rows + Daily/Weekly/Monthly results.
// This is UI-only. Signal DB/API/mentor publishing logic is unchanged.
// ============================================================================

(function pspV102InstallSignalUI(){
  if(document.getElementById('psp-v102-signal-ui-css')) return;
  var style=document.createElement('style');
  style.id='psp-v102-signal-ui-css';
  style.textContent=`
  :root{--psp-sig-orange:#FB9201}

  /* Shared / desktop */
  #page-signals #signalsGrid{
    display:block!important;
    width:100%;
  }
  .psp-sig-table-wrap{
    width:100%;
    background:var(--bg-card);
    border:1px solid var(--border);
    border-radius:14px;
    overflow-x:auto;
    margin:0 0 14px;
    box-shadow:0 8px 24px rgba(0,0,0,.04);
  }
  .psp-sig-table{
    width:100%;
    min-width:1080px;
    border-collapse:collapse;
    table-layout:auto;
    font-size:12px;
  }
  .psp-sig-table thead th{
    padding:10px 9px;
    text-align:left;
    font-size:9px;
    text-transform:uppercase;
    letter-spacing:.65px;
    color:var(--text-muted);
    background:var(--bg-elevated);
    border-bottom:1px solid var(--border);
    white-space:nowrap;
  }
  .psp-sig-table tbody td{
    padding:10px 9px;
    border-bottom:1px solid var(--border);
    color:var(--text-secondary);
    white-space:nowrap;
    vertical-align:middle;
  }
  .psp-sig-table tbody tr:last-child td{border-bottom:none}
  .psp-sig-table tbody tr{transition:background .16s ease}
  .psp-sig-table tbody tr:hover{background:rgba(251,146,1,.045)}
  .psp-sig-table .pair{
    color:var(--text-primary);
    font-weight:900;
    letter-spacing:.1px;
  }
  .psp-sig-table .buy{color:#10b981;font-weight:900}
  .psp-sig-table .sell{color:#ef4444;font-weight:900}
  .psp-sig-table .pips-pos{color:#10b981;font-weight:900}
  .psp-sig-table .pips-neg{color:#ef4444;font-weight:900}
  .psp-sig-table .pips-open{color:var(--text-muted);font-weight:800}
  .psp-sig-table .level-locked{
    color:var(--text-muted);
    font-weight:800;
    letter-spacing:.8px;
  }
  .psp-sig-badge{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-height:22px;
    padding:3px 8px;
    border-radius:999px;
    font-size:9px;
    font-weight:900;
    white-space:nowrap;
  }
  .psp-sig-badge.active{background:rgba(16,185,129,.12);color:#10b981}
  .psp-sig-badge.tp{background:rgba(16,185,129,.13);color:#10b981}
  .psp-sig-badge.be{background:rgba(59,130,246,.12);color:#3b82f6}
  .psp-sig-badge.sl{background:rgba(239,68,68,.11);color:#ef4444}
  .psp-sig-badge.closed{background:rgba(148,163,184,.13);color:var(--text-muted)}
  .psp-sig-badge.open{background:rgba(251,146,1,.12);color:#FB9201}
  .psp-sig-desktop-heading{
    display:flex;
    align-items:center;
    gap:10px;
    margin:4px 0 9px;
  }
  .psp-sig-desktop-heading b{
    color:var(--text-primary);
    font-size:13px;
  }
  .psp-sig-desktop-heading span{
    height:1px;
    background:var(--border);
    flex:1;
  }

  /* Mobile list is hidden on desktop */
  .psp-sig-mobile-shell{display:none}

  @media(max-width:760px){
    #page-signals{padding-bottom:104px}
    #page-signals > .card:first-child{
      border-radius:16px;
      margin-bottom:10px!important;
      padding:13px!important;
    }
    #page-signals > .card:first-child .card-title{font-size:16px}
    #page-signals > .card:first-child .card-meta{font-size:11px}
    #page-signals .sig-filter-row{
      display:block!important;
      margin-top:10px;
    }
    #page-signals #sigFilters{
      width:100%;
      flex-wrap:nowrap!important;
      overflow-x:auto;
      padding-bottom:3px;
      scrollbar-width:none;
    }
    #page-signals #sigFilters::-webkit-scrollbar{display:none}
    #page-signals #sigFilters .sig-fbtn{
      flex:0 0 auto;
      padding:7px 11px;
      border-radius:10px;
    }
    #page-signals #sigTimeFilters{display:none!important}
    #page-signals .sig-filter-row > div:last-child{
      border-left:0!important;
      padding-left:0!important;
      margin:8px 0 0!important;
      width:100%;
      display:grid!important;
      grid-template-columns:1fr 1fr;
      gap:7px!important;
    }
    #page-signals .sig-filter-row > div:last-child .sig-fbtn{
      width:100%;
      min-height:36px;
      border-radius:10px;
    }

    #sigResultDash{display:none!important}
    .psp-sig-desktop{display:none!important}
    .psp-sig-mobile-shell{display:block}

    .psp-mobile-signals-title{
      text-align:center;
      margin:4px 0 12px;
      font-size:19px;
      font-weight:900;
      color:var(--text-primary);
    }
    .psp-mobile-signals-title:after{
      content:"";
      display:block;
      width:54px;
      height:2px;
      border-radius:3px;
      margin:7px auto 0;
      background:#FB9201;
    }
    .psp-mobile-sig-table{
      width:100%;
      border:1px solid var(--border);
      border-radius:14px;
      overflow:hidden;
      background:var(--bg-card);
    }
    .psp-mobile-sig-head,
    .psp-mobile-sig-row{
      display:grid;
      grid-template-columns:1.25fr .95fr .82fr .72fr .58fr;
      align-items:center;
      gap:4px;
    }
    .psp-mobile-sig-head{
      padding:10px 9px;
      background:var(--bg-elevated);
      border-bottom:1px solid var(--border);
      color:var(--text-muted);
      font-size:8px;
      font-weight:900;
      text-transform:uppercase;
      letter-spacing:.5px;
    }
    .psp-mobile-sig-row{
      padding:10px 9px;
      min-height:54px;
      border-bottom:1px solid var(--border);
      cursor:pointer;
      transition:background .15s ease;
    }
    .psp-mobile-sig-row:last-child{border-bottom:0}
    .psp-mobile-sig-row:active{background:rgba(251,146,1,.06)}
    .psp-mobile-sig-date{
      font-size:9px;
      color:var(--text-muted);
      line-height:1.25;
    }
    .psp-mobile-sig-pair{
      font-size:11px;
      font-weight:900;
      color:var(--text-primary);
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .psp-mobile-sig-profit{
      font-size:10px;
      font-weight:900;
    }
    .psp-mobile-open{
      display:flex;
      align-items:center;
      justify-content:center;
      gap:3px;
      color:#FB9201;
      font-size:9px;
      font-weight:900;
    }
    .psp-mobile-chevron{
      display:inline-block;
      transition:transform .2s ease;
      font-size:12px;
    }
    .psp-mobile-sig-row.is-open .psp-mobile-chevron{transform:rotate(180deg)}

    .psp-mobile-detail{
      display:none;
      padding:0 9px 10px;
      background:var(--bg-card);
      border-bottom:1px solid var(--border);
    }
    .psp-mobile-detail.open{display:block}
    .psp-mobile-detail-card{
      position:relative;
      overflow:hidden;
      padding:13px;
      border:1px solid rgba(251,146,1,.23);
      border-radius:14px;
      background:
        radial-gradient(circle at 100% 0,rgba(251,146,1,.10),transparent 34%),
        var(--bg-elevated);
      box-shadow:0 8px 22px rgba(0,0,0,.05);
    }
    .psp-mobile-detail-top{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:10px;
      margin-bottom:12px;
    }
    .psp-mobile-side{
      display:flex;
      align-items:center;
      gap:6px;
      font-size:15px;
      font-weight:950;
      color:#FB9201;
    }
    .psp-mobile-detail-pair{
      text-align:right;
      font-size:15px;
      font-weight:950;
      color:var(--text-primary);
    }
    .psp-mobile-detail-time{
      font-size:9px;
      color:var(--text-muted);
      margin-top:2px;
    }
    .psp-mobile-levels{
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:7px;
      margin-top:8px;
    }
    .psp-mobile-lv{
      min-width:0;
      padding:8px 5px;
      border:1px solid var(--border);
      border-radius:10px;
      text-align:center;
      background:var(--bg-card);
    }
    .psp-mobile-lv b{
      display:block;
      font-size:11px;
      color:var(--text-primary);
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .psp-mobile-lv span{
      display:block;
      font-size:7.5px;
      color:var(--text-muted);
      margin-top:3px;
      text-transform:uppercase;
      letter-spacing:.4px;
    }
    .psp-mobile-tps{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:7px;
      margin-top:7px;
    }
    .psp-mobile-tps .psp-mobile-lv b{color:#10b981}
    .psp-mobile-lock{
      text-align:center;
      padding:13px 8px;
      color:var(--text-muted);
      font-size:10px;
      line-height:1.5;
    }
    .psp-mobile-lock strong{display:block;color:#FB9201;font-size:12px;margin-bottom:3px}

    .psp-period-wrap{
      margin-top:18px;
      padding-top:4px;
    }
    .psp-period-tabs{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:8px;
      position:sticky;
      bottom:72px;
      z-index:5;
      padding:8px;
      border:1px solid var(--border);
      border-radius:16px;
      background:color-mix(in srgb,var(--bg-card) 92%,transparent);
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      box-shadow:0 10px 28px rgba(0,0,0,.10);
    }
    .psp-period-btn{
      min-height:39px;
      border:1px solid var(--border);
      border-radius:12px;
      background:var(--bg-elevated);
      color:var(--text-secondary);
      font:800 11px inherit;
      cursor:pointer;
    }
    .psp-period-btn.active{
      background:rgba(251,146,1,.13);
      color:#FB9201;
      border-color:rgba(251,146,1,.40);
    }
    .psp-period-result{
      display:none;
      margin-top:12px;
      padding:13px 10px;
      border:1px solid var(--border);
      border-radius:15px;
      background:var(--bg-card);
    }
    .psp-period-result.open{display:block}
    .psp-period-result-title{
      display:flex;
      align-items:center;
      gap:8px;
      margin-bottom:10px;
      font-size:15px;
      font-weight:900;
      color:var(--text-primary);
    }
    .psp-period-result-title:after{
      content:"";
      height:1px;
      flex:1;
      background:var(--border);
    }
    .psp-period-table-wrap{
      overflow-x:auto;
      border:1px solid var(--border);
      border-radius:11px;
    }
    .psp-period-table{
      width:100%;
      min-width:560px;
      border-collapse:collapse;
      font-size:9px;
    }
    .psp-period-table th{
      padding:8px 6px;
      background:var(--bg-elevated);
      color:var(--text-muted);
      text-transform:uppercase;
      letter-spacing:.35px;
      text-align:left;
      white-space:nowrap;
    }
    .psp-period-table td{
      padding:8px 6px;
      border-top:1px solid var(--border);
      color:var(--text-secondary);
      white-space:nowrap;
    }
    .psp-period-summary{
      display:grid;
      grid-template-columns:1fr;
      gap:5px;
      margin:12px 2px 0;
      font-size:12px;
      font-weight:800;
    }
    .psp-period-summary .green{color:#10b981}
    .psp-period-summary .red{color:#ef4444}
    .psp-period-summary .net{color:#FB9201;font-size:14px}
  }
  `;
  document.head.appendChild(style);
})();

var pspSigExpandedId = null;
var pspSigPeriod = null;

function pspSigIsFinished(s){
  return s.rawStatus==='sl'||s.rawStatus==='closed'||s.rawStatus==='tp3'||s.rawStatus==='be';
}
function pspSigDirectionText(s){
  var d=(s.dir||'').toUpperCase();
  var ot=(s.orderType||'market').toUpperCase();
  return d + ((ot && ot!=='MARKET') ? ' '+ot : '');
}
function pspSigActiveStatus(s){
  if(s.rawStatus==='sl') return ['SL Hit','sl'];
  if(s.rawStatus==='be') return ['BE Hit','be'];
  if(s.tpHit>=3||s.rawStatus==='tp3') return ['TP3 Hit','tp'];
  if(s.tpHit===2||s.rawStatus==='tp2') return ['TP2 Hit','tp'];
  if(s.tpHit===1||s.rawStatus==='tp1') return ['TP1 Hit','tp'];
  if(s.beMoved) return ['SL @ BE','be'];
  return ['Active','active'];
}
function pspSigClosedStatus(s){
  if(s.rawStatus==='sl') return ['SL Hit','sl'];
  if(s.rawStatus==='be') return ['BE Hit','be'];
  if(s.tpHit>=3||s.rawStatus==='tp3') return ['TP3 Hit','tp'];
  if(s.tpHit===2||s.rawStatus==='tp2') return ['TP2 Hit','tp'];
  if(s.tpHit===1||s.rawStatus==='tp1') return ['TP1 Hit','tp'];
  return ['Closed','closed'];
}
function pspSigCell(s,key){
  if(s.locked && ['entry','sl','tp1','tp2','tp3'].indexOf(key)>=0){
    return '<span class="level-locked">🔒 VIP</span>';
  }
  var v=s[key];
  return v==null||v===''?'-':vEsc(v);
}
function pspSigDesktopRow(s,history){
  var d=pspFmtDateTime(s.ts);
  var dir=pspSigDirectionText(s);
  var ds=(dir.indexOf('SELL')===0)?'sell':'buy';
  var st=history?pspSigClosedStatus(s):pspSigActiveStatus(s);
  var p=(s.pips!=null)?((Number(s.pips)>=0?'+':'')+s.pips):'—';
  var pc=(s.pips==null)?'pips-open':(Number(s.pips)>=0?'pips-pos':'pips-neg');
  var finalState=history?'Closed':'Open';
  return '<tr>'+
    '<td>'+vEsc(d)+'</td>'+
    '<td class="pair">'+vEsc(s.pair||'-')+'</td>'+
    '<td class="'+ds+'">'+vEsc(dir||'-')+'</td>'+
    '<td>'+pspSigCell(s,'entry')+'</td>'+
    '<td>'+pspSigCell(s,'sl')+'</td>'+
    '<td>'+pspSigCell(s,'tp1')+'</td>'+
    '<td>'+pspSigCell(s,'tp2')+'</td>'+
    '<td>'+pspSigCell(s,'tp3')+'</td>'+
    '<td><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></td>'+
    '<td class="'+pc+'">'+vEsc(p)+'</td>'+
    '<td><span class="psp-sig-badge '+(history?'closed':'open')+'">'+finalState+'</span></td>'+
  '</tr>';
}
function pspSigDesktopTable(rows,history){
  if(!rows.length) return '';
  var title=history?'Closed / History Signals':'Active Signals';
  return '<div class="psp-sig-desktop">'+
    '<div class="psp-sig-desktop-heading"><b>'+title+'</b><span></span></div>'+
    '<div class="psp-sig-table-wrap"><table class="psp-sig-table">'+
      '<thead><tr>'+
        '<th>Date</th><th>Pair</th><th>Type</th><th>Entry</th><th>SL</th>'+
        '<th>TP1</th><th>TP2</th><th>TP3</th><th>Status</th><th>Pips</th><th>State</th>'+
      '</tr></thead>'+
      '<tbody>'+rows.map(function(s){return pspSigDesktopRow(s,history)}).join('')+'</tbody>'+
    '</table></div></div>';
}
function pspSigMobileDate(ts){
  var d=new Date(ts);
  return d.toLocaleDateString('en-CA')+'<br>'+d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}
function pspSigToggleMobile(id){
  var next=(pspSigExpandedId===id)?null:id;
  pspSigExpandedId=next;
  document.querySelectorAll('.psp-mobile-sig-row').forEach(function(r){
    r.classList.toggle('is-open',r.getAttribute('data-id')===String(next));
  });
  document.querySelectorAll('.psp-mobile-detail').forEach(function(d){
    d.classList.toggle('open',d.getAttribute('data-id')===String(next));
  });
}
function pspSigMobileDetail(s){
  var dir=(s.dir||'').toUpperCase();
  var arrow=dir==='SELL'?'↓':'↑';
  var time=new Date(s.ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  var st=pspSigIsFinished(s)?pspSigClosedStatus(s):pspSigActiveStatus(s);
  if(s.locked){
    return '<div class="psp-mobile-detail" data-id="'+vEsc(String(s.id))+'">'+
      '<div class="psp-mobile-detail-card"><div class="psp-mobile-lock">'+
        '<strong>🔒 VIP Signal</strong>Upgrade your access to view Entry, SL and TP levels.'+
      '</div></div></div>';
  }
  return '<div class="psp-mobile-detail" data-id="'+vEsc(String(s.id))+'">'+
    '<div class="psp-mobile-detail-card">'+
      '<div class="psp-mobile-detail-top">'+
        '<div><div class="psp-mobile-side">'+arrow+' '+vEsc(pspSigDirectionText(s))+'</div>'+
          '<div class="psp-mobile-detail-time">'+vEsc(new Date(s.ts).toLocaleDateString('en-GB'))+'</div></div>'+
        '<div><div class="psp-mobile-detail-pair">'+vEsc(s.pair||'-')+'</div>'+
          '<div class="psp-mobile-detail-time">'+vEsc(time)+'</div></div>'+
      '</div>'+
      '<div class="psp-mobile-levels">'+
        '<div class="psp-mobile-lv"><b><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></b><span>Status</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.entry||'-')+'</b><span>Entry</span></div>'+
        '<div class="psp-mobile-lv"><b style="color:#ef4444">'+vEsc(s.sl||'-')+'</b><span>SL</span></div>'+
        '<div class="psp-mobile-lv"><b style="color:'+(s.pips!=null?(Number(s.pips)>=0?'#10b981':'#ef4444'):'var(--text-primary)')+'">'+(s.pips!=null?vEsc((Number(s.pips)>=0?'+':'')+s.pips):'Open')+'</b><span>Pips</span></div>'+
      '</div>'+
      '<div class="psp-mobile-tps">'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp1||'-')+'</b><span>TP1</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp2||'-')+'</b><span>TP2</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp3||'-')+'</b><span>TP3</span></div>'+
      '</div>'+
    '</div></div>';
}
function pspSigMobileRow(s){
  var history=pspSigIsFinished(s);
  var st=history?pspSigClosedStatus(s):pspSigActiveStatus(s);
  var profit=s.pips!=null?((Number(s.pips)>=0?'+':'')+s.pips):'Open';
  var profitColor=s.pips==null?'#FB9201':(Number(s.pips)>=0?'#10b981':'#ef4444');
  return '<div class="psp-mobile-sig-row" data-id="'+vEsc(String(s.id))+'" onclick="pspSigToggleMobile(\''+vEsc(String(s.id))+'\')">'+
      '<div class="psp-mobile-sig-date">'+pspSigMobileDate(s.ts)+'</div>'+
      '<div class="psp-mobile-sig-pair">'+vEsc(s.pair||'-')+'</div>'+
      '<div><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></div>'+
      '<div class="psp-mobile-sig-profit" style="color:'+profitColor+'">'+vEsc(profit)+'</div>'+
      '<div class="psp-mobile-open">Open <span class="psp-mobile-chevron">⌄</span></div>'+
    '</div>'+pspSigMobileDetail(s);
}
function pspSigPeriodRows(period){
  var now=new Date();
  var start;
  if(period==='daily'){
    start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  }else if(period==='weekly'){
    start=new Date(now.getTime()-7*86400000);
  }else{
    start=new Date(now.getFullYear(),now.getMonth(),1);
  }
  return SIGNALS.filter(function(s){
    if(!pspSigIsFinished(s)) return false;
    if(sigF!=='all' && s.cat!==sigF) return false;
    var d=new Date(s.closedTs||s.ts);
    return d>=start && d<=now;
  });
}
function pspSigPeriodTarget(s){
  if(s.tpHit>=3) return s.tp3||'-';
  if(s.tpHit===2) return s.tp2||'-';
  if(s.tpHit===1) return s.tp1||'-';
  return s.tp3||s.tp2||s.tp1||'-';
}
function pspSignalPeriod(period){
  pspSigPeriod=period;
  document.querySelectorAll('.psp-period-btn').forEach(function(b){
    b.classList.toggle('active',b.getAttribute('data-period')===period);
  });
  var box=document.getElementById('pspPeriodResult');
  if(!box)return;
  var rows=pspSigPeriodRows(period);
  var green=0,red=0,net=0;
  rows.forEach(function(s){
    var p=Number(s.pips)||0;
    net+=p;
    if(p>=0)green+=p;else red+=Math.abs(p);
  });
  var title=period==='daily'?'Daily Signals':(period==='weekly'?'Weekly Signals':'Monthly Signals');
  var tableRows=rows.map(function(s){
    var st=pspSigClosedStatus(s);
    var d=new Date(s.closedTs||s.ts);
    var p=Number(s.pips)||0;
    return '<tr>'+
      '<td>'+vEsc(d.toLocaleDateString('en-CA'))+'<br>'+vEsc(d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}))+'</td>'+
      '<td><b>'+vEsc(s.pair||'-')+'</b></td>'+
      '<td><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></td>'+
      '<td class="'+((s.dir||'').toUpperCase()==='SELL'?'sell':'buy')+'">'+vEsc((s.dir||'').toUpperCase())+'</td>'+
      '<td>'+pspSigCell(s,'entry')+'</td>'+
      '<td>'+pspSigCell(s,'sl')+'</td>'+
      '<td>'+ (s.locked?'<span class="level-locked">🔒 VIP</span>':vEsc(pspSigPeriodTarget(s))) +'</td>'+
      '<td style="font-weight:900;color:'+(p>=0?'#10b981':'#ef4444')+'">'+(p>=0?'+':'')+vEsc(p)+'</td>'+
    '</tr>';
  }).join('');
  box.innerHTML=
    '<div class="psp-period-result-title">'+title+'</div>'+
    (rows.length
      ? '<div class="psp-period-table-wrap"><table class="psp-period-table">'+
          '<thead><tr><th>Date</th><th>Pair</th><th>Status</th><th>Action</th><th>Entry</th><th>SL</th><th>TP</th><th>Result</th></tr></thead>'+
          '<tbody>'+tableRows+'</tbody></table></div>'
      : '<div style="padding:18px;text-align:center;color:var(--text-muted);font-size:11px;">No closed signals for this period.</div>')+
    '<div class="psp-period-summary">'+
      '<div class="green">🟢 Total Green Pips: '+(Math.round(green*10)/10)+'</div>'+
      '<div class="red">🔴 Total Red Pips: '+(Math.round(red*10)/10)+'</div>'+
      '<div class="net">Result: '+(net>=0?'+':'')+(Math.round(net*10)/10)+' pips</div>'+
    '</div>';
  box.classList.add('open');
  try{box.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(e){}
}
function pspSigMobileShell(rows){
  var title=sigView==='history'?'Signal History':'Daily Signals';
  return '<div class="psp-sig-mobile-shell">'+
    '<div class="psp-mobile-signals-title">'+title+'</div>'+
    '<div class="psp-mobile-sig-table">'+
      '<div class="psp-mobile-sig-head"><div>Date</div><div>Pair</div><div>Status</div><div>Profit</div><div>Open</div></div>'+
      rows.map(pspSigMobileRow).join('')+
    '</div>'+
    '<div class="psp-period-wrap">'+
      '<div class="psp-period-tabs">'+
        '<button class="psp-period-btn" data-period="daily" onclick="pspSignalPeriod(\'daily\')">Daily</button>'+
        '<button class="psp-period-btn" data-period="weekly" onclick="pspSignalPeriod(\'weekly\')">Weekly</button>'+
        '<button class="psp-period-btn" data-period="monthly" onclick="pspSignalPeriod(\'monthly\')">Monthly</button>'+
      '</div>'+
      '<div id="pspPeriodResult" class="psp-period-result"></div>'+
    '</div>'+
  '</div>';
}

// V102 renderer override.
function renderSignals(){
  const g=document.getElementById('signalsGrid');if(!g)return;

  var now=Date.now();
  function inTime(s){
    if(sigView!=='history'||sigTimeF==='all')return true;
    var t=new Date(s.closedTs||s.ts).getTime();
    var d=new Date();
    if(sigTimeF==='today'){
      var ds=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
      return t>=ds;
    }
    if(sigTimeF==='week')return t>=now-7*86400000;
    if(sigTimeF==='month')return t>=new Date(d.getFullYear(),d.getMonth(),1).getTime();
    return true;
  }

  var list=SIGNALS.filter(function(s){
    var finished=pspSigIsFinished(s);
    var viewOk=(sigView==='active')?(!finished):finished;
    var catOk=(sigF==='all')?true:(s.cat===sigF);
    return viewOk&&catOk&&inTime(s);
  });

  var rd=document.getElementById('sigResultDash');
  if(rd){
    rd.style.display=(sigView==='history')?'block':'none';
    if(sigView==='history'){
      try{renderSigResultDash(list);}catch(e){}
    }
  }

  if(!list.length){
    var msg=(sigView==='history'
      ? 'No closed signals'+(sigTimeF!=='all'?' for this period':'')+' yet.'
      : 'No active signals right now. Check History for past results.');
    g.innerHTML=
      '<div class="psp-sig-desktop" style="color:var(--text-muted);padding:28px;text-align:center;border:1px solid var(--border);border-radius:14px;background:var(--bg-card);">'+msg+'</div>'+
      '<div class="psp-sig-mobile-shell">'+
        '<div class="psp-mobile-signals-title">'+(sigView==='history'?'Signal History':'Daily Signals')+'</div>'+
        '<div style="padding:24px;text-align:center;color:var(--text-muted);border:1px solid var(--border);border-radius:14px;background:var(--bg-card);font-size:11px;">'+msg+'</div>'+
        '<div class="psp-period-wrap"><div class="psp-period-tabs">'+
          '<button class="psp-period-btn" data-period="daily" onclick="pspSignalPeriod(\'daily\')">Daily</button>'+
          '<button class="psp-period-btn" data-period="weekly" onclick="pspSignalPeriod(\'weekly\')">Weekly</button>'+
          '<button class="psp-period-btn" data-period="monthly" onclick="pspSignalPeriod(\'monthly\')">Monthly</button>'+
        '</div><div id="pspPeriodResult" class="psp-period-result"></div></div>'+
      '</div>';
    return;
  }

  g.innerHTML=
    pspSigDesktopTable(list,sigView==='history')+
    pspSigMobileShell(list);
}


// ============================================================================
// PIPSEPAISA V103 — SIGNAL DETAILS + MOBILE FIXED RESULTS
// 20 August 2026
// - TP4 / Runner visible on Desktop + Mobile
// - Mentor Note visible to permitted users
// - Daily / Weekly / Monthly fixed at bottom on mobile
// - Period result opens as a separate mobile result page
// - Result page is fully mobile-fit: NO left/right horizontal scrolling
// ============================================================================

(function pspV103InstallSignalUI(){
  if(document.getElementById('psp-v103-signal-ui-css')) return;
  var style=document.createElement('style');
  style.id='psp-v103-signal-ui-css';
  style.textContent=`
    .psp-tp4-open{
      display:inline-flex;align-items:center;justify-content:center;
      padding:3px 8px;border-radius:999px;
      background:rgba(251,146,1,.13);color:#FB9201;
      font-weight:900;font-size:9px;
    }
    .psp-sig-note-row td{
      padding:0 9px 10px!important;
      border-top:0!important;
      background:rgba(251,146,1,.025);
    }
    .psp-sig-note-box{
      display:flex;gap:7px;align-items:flex-start;
      padding:8px 10px;border-left:3px solid #FB9201;
      border-radius:8px;background:rgba(251,146,1,.07);
      color:var(--text-secondary);font-size:10px;line-height:1.45;
      white-space:normal!important;
    }
    .psp-sig-note-box b{color:#FB9201;white-space:nowrap}

    @media(max-width:760px){
      #page-signals{padding-bottom:145px!important}
      .psp-mobile-tps{grid-template-columns:repeat(4,1fr)!important}
      .psp-mobile-note{
        margin-top:9px;padding:10px 11px;
        border-left:3px solid #FB9201;border-radius:9px;
        background:rgba(251,146,1,.07);
        color:var(--text-secondary);font-size:10px;line-height:1.5;
      }
      .psp-mobile-note b{color:#FB9201}

      /* Reference-style fixed period selector above app bottom navigation */
      .psp-period-wrap{height:58px;margin:0!important;padding:0!important}
      .psp-period-tabs{
        position:fixed!important;
        left:12px!important;right:12px!important;bottom:76px!important;
        z-index:8900!important;
        width:auto!important;
        grid-template-columns:repeat(3,1fr)!important;
        padding:7px!important;
        border-radius:16px!important;
        background:color-mix(in srgb,var(--bg-card) 94%,transparent)!important;
        box-shadow:0 10px 30px rgba(0,0,0,.16)!important;
      }
      .psp-period-btn{min-height:40px!important;font-size:11px!important}
      #pspPeriodResult{display:none!important}

      /* Separate full-screen period result page */
      .psp-period-page{
        position:fixed;inset:0;z-index:30000;
        background:var(--bg-primary,#fff);
        color:var(--text-primary,#111827);
        overflow-y:auto;overflow-x:hidden;
        overscroll-behavior:contain;
        padding:calc(env(safe-area-inset-top,0px) + 10px) 10px 92px;
        box-sizing:border-box;
      }
      .psp-period-page-head{
        display:grid;grid-template-columns:42px 1fr 42px;
        align-items:center;margin-bottom:12px;
      }
      .psp-period-back{
        width:38px;height:38px;border-radius:11px;
        border:1px solid var(--border);
        background:var(--bg-card);color:var(--text-primary);
        font-size:20px;font-weight:900;cursor:pointer;
      }
      .psp-period-page-title{
        text-align:center;font-size:19px;font-weight:950;
      }
      .psp-period-page-sub{
        text-align:center;color:var(--text-muted);
        font-size:9px;margin-top:2px;
      }

      .psp-period-fit{
        width:100%;max-width:100%;
        border:1px solid var(--border);
        border-radius:12px;overflow:hidden;
        background:var(--bg-card);
      }
      .psp-period-fit-row{
        display:grid;
        grid-template-columns:1.18fr .82fr .78fr .68fr .70fr .64fr .64fr .66fr;
        width:100%;max-width:100%;
        align-items:stretch;
      }
      .psp-period-fit-row.head{
        background:var(--bg-elevated);
        color:var(--text-muted);
        font-weight:900;text-transform:uppercase;
        letter-spacing:.15px;
      }
      .psp-period-fit-row:not(.head){border-top:1px solid var(--border)}
      .psp-period-fit-row > div{
        min-width:0;
        padding:7px 2px;
        display:flex;align-items:center;justify-content:center;
        text-align:center;
        font-size:7.2px;line-height:1.22;
        overflow:hidden;
        overflow-wrap:anywhere;
        word-break:break-word;
      }
      .psp-period-fit-row.head > div{font-size:6.8px;padding:8px 1px}
      .psp-period-fit-row .date{font-size:6.8px;color:var(--text-muted)}
      .psp-period-fit-row .pair{font-size:7.5px;font-weight:950;color:var(--text-primary)}
      .psp-period-fit-row .action.buy{color:#10b981;font-weight:900}
      .psp-period-fit-row .action.sell{color:#ef4444;font-weight:900}
      .psp-period-fit-row .result{font-weight:950}
      .psp-period-fit-row .psp-sig-badge{
        min-height:17px!important;
        padding:2px 4px!important;
        font-size:6.5px!important;
        max-width:100%;
        overflow:hidden;text-overflow:ellipsis;
      }

      .psp-period-empty{
        padding:30px 12px;text-align:center;
        color:var(--text-muted);font-size:11px;
        border:1px solid var(--border);border-radius:12px;
        background:var(--bg-card);
      }
      .psp-period-page-summary{
        margin:14px 4px 0;
        display:grid;gap:6px;
        font-size:13px;font-weight:900;
      }
      .psp-period-page-summary .green{color:#10b981}
      .psp-period-page-summary .red{color:#ef4444}
      .psp-period-page-summary .net{color:#FB9201;font-size:15px}

      .psp-period-page .psp-period-tabs{
        bottom:12px!important;
        z-index:30001!important;
      }
    }
  `;
  document.head.appendChild(style);
})();

function pspSigNote(s){
  var raw=(window._SIGRAW||{})[s.id]||{};
  return (s.notes||raw.notes||'').toString().trim();
}
function pspSigTp4Cell(s){
  if(s.locked) return '<span class="level-locked">🔒 VIP</span>';
  var v=(s.tp4==null?'':String(s.tp4)).trim();
  if(!v) return '-';
  if(v.toLowerCase()==='open') return '<span class="psp-tp4-open">Open</span>';
  return vEsc(v);
}
function pspSigCell(s,key){
  if(s.locked && ['entry','sl','tp1','tp2','tp3','tp4'].indexOf(key)>=0){
    return '<span class="level-locked">🔒 VIP</span>';
  }
  if(key==='tp4') return pspSigTp4Cell(s);
  var v=s[key];
  return v==null||v===''?'-':vEsc(v);
}

/* Desktop: TP4 + Note */
function pspSigDesktopRow(s,history){
  var d=pspFmtDateTime(s.ts);
  var dir=pspSigDirectionText(s);
  var ds=(dir.indexOf('SELL')===0)?'sell':'buy';
  var st=history?pspSigClosedStatus(s):pspSigActiveStatus(s);
  var p=(s.pips!=null)?((Number(s.pips)>=0?'+':'')+s.pips):'—';
  var pc=(s.pips==null)?'pips-open':(Number(s.pips)>=0?'pips-pos':'pips-neg');
  var finalState=history?'Closed':'Open';

  var html='<tr>'+
    '<td>'+vEsc(d)+'</td>'+
    '<td class="pair">'+vEsc(s.pair||'-')+'</td>'+
    '<td class="'+ds+'">'+vEsc(dir||'-')+'</td>'+
    '<td>'+pspSigCell(s,'entry')+'</td>'+
    '<td>'+pspSigCell(s,'sl')+'</td>'+
    '<td>'+pspSigCell(s,'tp1')+'</td>'+
    '<td>'+pspSigCell(s,'tp2')+'</td>'+
    '<td>'+pspSigCell(s,'tp3')+'</td>'+
    '<td>'+pspSigCell(s,'tp4')+'</td>'+
    '<td><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></td>'+
    '<td class="'+pc+'">'+vEsc(p)+'</td>'+
    '<td><span class="psp-sig-badge '+(history?'closed':'open')+'">'+finalState+'</span></td>'+
  '</tr>';

  var note=pspSigNote(s);
  if(note && !s.locked){
    html+='<tr class="psp-sig-note-row"><td colspan="12">'+
      '<div class="psp-sig-note-box"><b>📝 Note:</b><span>'+vEsc(note)+'</span></div>'+
    '</td></tr>';
  }
  return html;
}
function pspSigDesktopTable(rows,history){
  if(!rows.length) return '';
  var title=history?'Closed / History Signals':'Active Signals';
  return '<div class="psp-sig-desktop">'+
    '<div class="psp-sig-desktop-heading"><b>'+title+'</b><span></span></div>'+
    '<div class="psp-sig-table-wrap"><table class="psp-sig-table" style="min-width:1180px">'+
      '<thead><tr>'+
        '<th>Date</th><th>Pair</th><th>Type</th><th>Entry</th><th>SL</th>'+
        '<th>TP1</th><th>TP2</th><th>TP3</th><th>TP4</th><th>Status</th><th>Pips</th><th>State</th>'+
      '</tr></thead>'+
      '<tbody>'+rows.map(function(s){return pspSigDesktopRow(s,history)}).join('')+'</tbody>'+
    '</table></div></div>';
}

/* Mobile expanded signal: TP4 + Note */
function pspSigMobileDetail(s){
  var dir=(s.dir||'').toUpperCase();
  var arrow=dir==='SELL'?'↓':'↑';
  var time=new Date(s.ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  var st=pspSigIsFinished(s)?pspSigClosedStatus(s):pspSigActiveStatus(s);

  if(s.locked){
    return '<div class="psp-mobile-detail" data-id="'+vEsc(String(s.id))+'">'+
      '<div class="psp-mobile-detail-card"><div class="psp-mobile-lock">'+
        '<strong>🔒 VIP Signal</strong>Upgrade your access to view Entry, SL, TP levels and mentor note.'+
      '</div></div></div>';
  }

  var note=pspSigNote(s);
  var tp4=(s.tp4==null?'':String(s.tp4)).trim();
  var tp4Html=!tp4?'-':(tp4.toLowerCase()==='open'
    ? '<span style="color:#FB9201;font-weight:950">Open</span>'
    : vEsc(tp4));

  return '<div class="psp-mobile-detail" data-id="'+vEsc(String(s.id))+'">'+
    '<div class="psp-mobile-detail-card">'+
      '<div class="psp-mobile-detail-top">'+
        '<div><div class="psp-mobile-side">'+arrow+' '+vEsc(pspSigDirectionText(s))+'</div>'+
          '<div class="psp-mobile-detail-time">'+vEsc(new Date(s.ts).toLocaleDateString('en-GB'))+'</div></div>'+
        '<div><div class="psp-mobile-detail-pair">'+vEsc(s.pair||'-')+'</div>'+
          '<div class="psp-mobile-detail-time">'+vEsc(time)+'</div></div>'+
      '</div>'+
      '<div class="psp-mobile-levels">'+
        '<div class="psp-mobile-lv"><b><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></b><span>Status</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.entry||'-')+'</b><span>Entry</span></div>'+
        '<div class="psp-mobile-lv"><b style="color:#ef4444">'+vEsc(s.sl||'-')+'</b><span>SL</span></div>'+
        '<div class="psp-mobile-lv"><b style="color:'+(s.pips!=null?(Number(s.pips)>=0?'#10b981':'#ef4444'):'var(--text-primary)')+'">'+
          (s.pips!=null?vEsc((Number(s.pips)>=0?'+':'')+s.pips):'Open')+'</b><span>Pips</span></div>'+
      '</div>'+
      '<div class="psp-mobile-tps">'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp1||'-')+'</b><span>TP1</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp2||'-')+'</b><span>TP2</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp3||'-')+'</b><span>TP3</span></div>'+
        '<div class="psp-mobile-lv"><b>'+tp4Html+'</b><span>TP4</span></div>'+
      '</div>'+
      (note?'<div class="psp-mobile-note"><b>📝 Mentor Note:</b><br>'+vEsc(note)+'</div>':'')+
    '</div></div>';
}

/* Current-week logic (Monday -> now), as requested. */
function pspSigPeriodRows(period){
  var now=new Date();
  var start;
  if(period==='daily'){
    start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  }else if(period==='weekly'){
    var mondayOffset=(now.getDay()+6)%7;
    start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-mondayOffset);
  }else{
    start=new Date(now.getFullYear(),now.getMonth(),1);
  }
  return SIGNALS.filter(function(s){
    if(!pspSigIsFinished(s)) return false;
    if(sigF!=='all' && s.cat!==sigF) return false;
    var d=new Date(s.closedTs||s.ts);
    return d>=start && d<=now;
  });
}

function pspClosePeriodPage(){
  var page=document.getElementById('pspPeriodPageV103');
  if(page) page.remove();
  try{document.body.style.overflow='';}catch(e){}
  pspSigPeriod=null;
  document.querySelectorAll('.psp-period-btn').forEach(function(b){b.classList.remove('active')});
}
function pspPeriodCompactValue(s,key){
  if(s.locked && ['entry','sl'].indexOf(key)>=0) return 'VIP';
  var v=s[key];
  return (v==null||v===''||v==='-')?'-':String(v);
}
function pspPeriodResultTarget(s){
  if(s.locked) return 'VIP';
  if(s.tpHit>=3) return String(s.tp3||'-');
  if(s.tpHit===2) return String(s.tp2||'-');
  if(s.tpHit===1) return String(s.tp1||'-');
  var tp4=(s.tp4==null?'':String(s.tp4)).trim();
  if(tp4) return tp4;
  return String(s.tp3||s.tp2||s.tp1||'-');
}
function pspSignalPeriod(period){
  pspSigPeriod=period;
  var rows=pspSigPeriodRows(period);
  var green=0,red=0,net=0;
  rows.forEach(function(s){
    var p=Number(s.pips)||0;
    net+=p;
    if(p>=0) green+=p; else red+=Math.abs(p);
  });

  var title=period==='daily'?'Daily Signals':(period==='weekly'?'Weekly Signals':'Monthly Signals');
  var sub=period==='daily'?'Today':(period==='weekly'?'Current Week':'Current Month');

  var page=document.getElementById('pspPeriodPageV103');
  if(!page){
    page=document.createElement('div');
    page.id='pspPeriodPageV103';
    page.className='psp-period-page';
    document.body.appendChild(page);
  }

  var rowsHtml=rows.map(function(s){
    var d=new Date(s.closedTs||s.ts);
    var st=pspSigClosedStatus(s);
    var p=Number(s.pips)||0;
    var action=(s.dir||'').toUpperCase();
    var dateHtml=vEsc(d.toLocaleDateString('en-CA'))+'<br>'+vEsc(d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}));
    return '<div class="psp-period-fit-row">'+
      '<div class="date">'+dateHtml+'</div>'+
      '<div class="pair">'+vEsc(s.pair||'-')+'</div>'+
      '<div><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></div>'+
      '<div class="action '+(action==='SELL'?'sell':'buy')+'">'+vEsc(action)+'</div>'+
      '<div>'+vEsc(pspPeriodCompactValue(s,'entry'))+'</div>'+
      '<div>'+vEsc(pspPeriodCompactValue(s,'sl'))+'</div>'+
      '<div>'+vEsc(pspPeriodResultTarget(s))+'</div>'+
      '<div class="result" style="color:'+(p>=0?'#10b981':'#ef4444')+'">'+(p>=0?'+':'')+vEsc(p)+'</div>'+
    '</div>';
  }).join('');

  page.innerHTML=
    '<div class="psp-period-page-head">'+
      '<button class="psp-period-back" onclick="pspClosePeriodPage()" aria-label="Back">←</button>'+
      '<div><div class="psp-period-page-title">'+title+'</div><div class="psp-period-page-sub">'+sub+' Result</div></div>'+
      '<div></div>'+
    '</div>'+
    (rows.length
      ? '<div class="psp-period-fit">'+
          '<div class="psp-period-fit-row head">'+
            '<div>Date</div><div>Pair</div><div>Status</div><div>Action</div>'+
            '<div>Open</div><div>SL</div><div>TP</div><div>Result</div>'+
          '</div>'+rowsHtml+
        '</div>'
      : '<div class="psp-period-empty">No closed signals for this period.</div>')+
    '<div class="psp-period-page-summary">'+
      '<div class="green">🟢 Total Green Pips: '+(Math.round(green*10)/10)+'</div>'+
      '<div class="red">🔴 Total Red Pips: '+(Math.round(red*10)/10)+'</div>'+
      '<div class="net">Result: '+(net>=0?'+':'')+(Math.round(net*10)/10)+' pips</div>'+
    '</div>'+
    '<div class="psp-period-tabs">'+
      '<button class="psp-period-btn '+(period==='daily'?'active':'')+'" data-period="daily" onclick="pspSignalPeriod(\'daily\')">Daily</button>'+
      '<button class="psp-period-btn '+(period==='weekly'?'active':'')+'" data-period="weekly" onclick="pspSignalPeriod(\'weekly\')">Weekly</button>'+
      '<button class="psp-period-btn '+(period==='monthly'?'active':'')+'" data-period="monthly" onclick="pspSignalPeriod(\'monthly\')">Monthly</button>'+
    '</div>';

  try{document.body.style.overflow='hidden';}catch(e){}
  document.querySelectorAll('.psp-period-btn').forEach(function(b){
    b.classList.toggle('active',b.getAttribute('data-period')===period);
  });
}

/* Mobile normal page keeps only the fixed 3-button selector; result is separate page. */
function pspSigMobileShell(rows){
  var title=sigView==='history'?'Signal History':'Daily Signals';
  return '<div class="psp-sig-mobile-shell">'+
    '<div class="psp-mobile-signals-title">'+title+'</div>'+
    '<div class="psp-mobile-sig-table">'+
      '<div class="psp-mobile-sig-head"><div>Date</div><div>Pair</div><div>Status</div><div>Profit</div><div>Open</div></div>'+
      rows.map(pspSigMobileRow).join('')+
    '</div>'+
    '<div class="psp-period-wrap">'+
      '<div class="psp-period-tabs">'+
        '<button class="psp-period-btn" data-period="daily" onclick="pspSignalPeriod(\'daily\')">Daily</button>'+
        '<button class="psp-period-btn" data-period="weekly" onclick="pspSignalPeriod(\'weekly\')">Weekly</button>'+
        '<button class="psp-period-btn" data-period="monthly" onclick="pspSignalPeriod(\'monthly\')">Monthly</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}


// ============================================================================
// PIPSEPAISA V104 — TRUE FIXED MOBILE RESULT DOCK + COMPACT NOTE DROPDOWN
// 20 August 2026
//
// Fixes:
// 1) Daily / Weekly / Monthly is now a BODY-LEVEL fixed dock. It no longer
//    lives inside the scrolling Signals content, so scrolling cannot move it.
// 2) Dock automatically sits above the real mobile bottom nav height.
// 3) Result page reuses the same dock at the bottom of the viewport.
// 4) Desktop Note is now a compact dropdown instead of a permanent yellow strip.
// 5) Desktop Date / Pair / Type spacing is tightened.
// ============================================================================

(function pspV104InstallCss(){
  if(document.getElementById('psp-v104-signal-css')) return;
  var s=document.createElement('style');
  s.id='psp-v104-signal-css';
  s.textContent=`
    /* ---------- Desktop compact table ---------- */
    .psp-sig-table-v104{
      width:100%!important;
      min-width:1040px!important;
      table-layout:fixed!important;
    }
    .psp-sig-table-v104 th,
    .psp-sig-table-v104 td{
      padding:8px 6px!important;
    }
    .psp-sig-table-v104 th:nth-child(1),
    .psp-sig-table-v104 td:nth-child(1){width:155px}
    .psp-sig-table-v104 th:nth-child(2),
    .psp-sig-table-v104 td:nth-child(2){width:90px}
    .psp-sig-table-v104 th:nth-child(3),
    .psp-sig-table-v104 td:nth-child(3){width:105px}
    .psp-sig-table-v104 th:nth-child(n+4):nth-child(-n+9),
    .psp-sig-table-v104 td:nth-child(n+4):nth-child(-n+9){width:62px;text-align:center}
    .psp-sig-table-v104 th:nth-child(10),
    .psp-sig-table-v104 td:nth-child(10){width:84px;text-align:center}
    .psp-sig-table-v104 th:nth-child(11),
    .psp-sig-table-v104 td:nth-child(11){width:62px;text-align:center}
    .psp-sig-table-v104 th:nth-child(12),
    .psp-sig-table-v104 td:nth-child(12){width:68px;text-align:center}
    .psp-sig-table-v104 th:nth-child(13),
    .psp-sig-table-v104 td:nth-child(13){width:72px;text-align:center}

    .psp-note-toggle{
      min-width:56px;
      height:27px;
      padding:0 8px;
      border:1px solid rgba(251,146,1,.30);
      border-radius:8px;
      background:rgba(251,146,1,.08);
      color:#FB9201;
      font-size:9px;
      font-weight:900;
      cursor:pointer;
      white-space:nowrap;
    }
    .psp-note-toggle:hover{background:rgba(251,146,1,.14)}
    .psp-note-toggle[disabled]{
      opacity:.38;cursor:default;
      border-color:var(--border);
      background:var(--bg-elevated);
      color:var(--text-muted);
    }
    .psp-note-dropdown-row{display:none}
    .psp-note-dropdown-row.open{display:table-row}
    .psp-note-dropdown-row td{
      padding:0 6px 8px!important;
      border-top:0!important;
      background:transparent!important;
    }
    .psp-note-dropdown-content{
      width:min(680px,72%);
      margin:0 auto;
      padding:7px 10px;
      border:1px solid rgba(251,146,1,.22);
      border-left:3px solid #FB9201;
      border-radius:8px;
      background:rgba(251,146,1,.045);
      color:var(--text-secondary);
      font-size:9.5px;
      line-height:1.45;
      text-align:left;
    }
    .psp-note-dropdown-content b{color:#FB9201;margin-right:4px}

    /* ---------- True viewport-fixed mobile dock ---------- */
    #pspSignalPeriodDockV104{
      display:none;
    }

    @media(max-width:760px){
      #page-signals{padding-bottom:150px!important}

      /* Kill every older inline/sticky period selector inside Signals. */
      #page-signals .psp-period-wrap,
      #page-signals .psp-period-tabs{
        display:none!important;
      }

      #pspSignalPeriodDockV104{
        position:fixed!important;
        left:18px!important;
        right:18px!important;
        z-index:24000!important;
        grid-template-columns:repeat(3,minmax(0,1fr))!important;
        gap:8px!important;
        padding:8px!important;
        box-sizing:border-box!important;
        border:1px solid var(--border)!important;
        border-radius:17px!important;
        background:color-mix(in srgb,var(--bg-card) 96%,transparent)!important;
        backdrop-filter:blur(14px)!important;
        -webkit-backdrop-filter:blur(14px)!important;
        box-shadow:0 10px 30px rgba(0,0,0,.16)!important;
        transform:none!important;
        margin:0!important;
      }
      #pspSignalPeriodDockV104 .psp-period-btn{
        width:100%!important;
        min-width:0!important;
        min-height:42px!important;
        margin:0!important;
        border-radius:12px!important;
        font-size:11px!important;
      }

      /* Result page is also viewport-bound; never horizontal-scroll. */
      #pspPeriodPageV103{
        overflow-x:hidden!important;
        width:100vw!important;
        max-width:100vw!important;
        box-sizing:border-box!important;
        padding-bottom:88px!important;
      }
      #pspPeriodPageV103 .psp-period-tabs{
        display:none!important;
      }
    }
  `;
  document.head.appendChild(s);
})();

var pspV104NoteOpen = {};

function pspToggleSignalNote(id){
  var key=String(id);
  pspV104NoteOpen[key]=!pspV104NoteOpen[key];

  var row=document.getElementById('pspNoteDrop-'+key);
  if(row) row.classList.toggle('open',!!pspV104NoteOpen[key]);

  var btn=document.getElementById('pspNoteBtn-'+key);
  if(btn){
    btn.innerHTML=pspV104NoteOpen[key]?'Note ▴':'Note ▾';
    btn.setAttribute('aria-expanded',pspV104NoteOpen[key]?'true':'false');
  }
}

/* Desktop row: Note is a dropdown, not a permanent strip. */
function pspSigDesktopRow(s,history){
  var d=pspFmtDateTime(s.ts);
  var dir=pspSigDirectionText(s);
  var ds=(dir.indexOf('SELL')===0)?'sell':'buy';
  var st=history?pspSigClosedStatus(s):pspSigActiveStatus(s);
  var p=(s.pips!=null)?((Number(s.pips)>=0?'+':'')+s.pips):'—';
  var pc=(s.pips==null)?'pips-open':(Number(s.pips)>=0?'pips-pos':'pips-neg');
  var finalState=history?'Closed':'Open';
  var note=pspSigNote(s);
  var id=String(s.id);

  var html='<tr>'+
    '<td>'+vEsc(d)+'</td>'+
    '<td class="pair">'+vEsc(s.pair||'-')+'</td>'+
    '<td class="'+ds+'">'+vEsc(dir||'-')+'</td>'+
    '<td>'+pspSigCell(s,'entry')+'</td>'+
    '<td>'+pspSigCell(s,'sl')+'</td>'+
    '<td>'+pspSigCell(s,'tp1')+'</td>'+
    '<td>'+pspSigCell(s,'tp2')+'</td>'+
    '<td>'+pspSigCell(s,'tp3')+'</td>'+
    '<td>'+pspSigCell(s,'tp4')+'</td>'+
    '<td><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></td>'+
    '<td class="'+pc+'">'+vEsc(p)+'</td>'+
    '<td><span class="psp-sig-badge '+(history?'closed':'open')+'">'+finalState+'</span></td>'+
    '<td>'+(note && !s.locked
      ? '<button id="pspNoteBtn-'+vEsc(id)+'" class="psp-note-toggle" type="button" aria-expanded="false" onclick="pspToggleSignalNote(\''+vEsc(id)+'\')">Note ▾</button>'
      : '<button class="psp-note-toggle" type="button" disabled>Note</button>')+
    '</td>'+
  '</tr>';

  if(note && !s.locked){
    html+='<tr id="pspNoteDrop-'+vEsc(id)+'" class="psp-note-dropdown-row'+(pspV104NoteOpen[id]?' open':'')+'">'+
      '<td colspan="13"><div class="psp-note-dropdown-content"><b>📝 Note:</b>'+vEsc(note)+'</div></td>'+
    '</tr>';
  }

  return html;
}

function pspSigDesktopTable(rows,history){
  if(!rows.length) return '';
  var title=history?'Closed / History Signals':'Active Signals';
  return '<div class="psp-sig-desktop">'+
    '<div class="psp-sig-desktop-heading"><b>'+title+'</b><span></span></div>'+
    '<div class="psp-sig-table-wrap"><table class="psp-sig-table psp-sig-table-v104">'+
      '<thead><tr>'+
        '<th>Date</th><th>Pair</th><th>Type</th><th>Entry</th><th>SL</th>'+
        '<th>TP1</th><th>TP2</th><th>TP3</th><th>TP4</th>'+
        '<th>Status</th><th>Pips</th><th>State</th><th>Note</th>'+
      '</tr></thead>'+
      '<tbody>'+rows.map(function(s){return pspSigDesktopRow(s,history)}).join('')+'</tbody>'+
    '</table></div></div>';
}

/* Only the signal list remains in normal mobile flow. The period controls live in BODY. */
function pspSigMobileShell(rows){
  var title=sigView==='history'?'Signal History':'Daily Signals';
  pspV104SyncPeriodDock();
  return '<div class="psp-sig-mobile-shell">'+
    '<div class="psp-mobile-signals-title">'+title+'</div>'+
    '<div class="psp-mobile-sig-table">'+
      '<div class="psp-mobile-sig-head"><div>Date</div><div>Pair</div><div>Status</div><div>Profit</div><div>Open</div></div>'+
      rows.map(pspSigMobileRow).join('')+
    '</div>'+
  '</div>';
}

function pspV104EnsurePeriodDock(){
  var dock=document.getElementById('pspSignalPeriodDockV104');
  if(dock) return dock;

  dock=document.createElement('div');
  dock.id='pspSignalPeriodDockV104';
  dock.innerHTML=
    '<button class="psp-period-btn" data-period="daily" type="button" onclick="pspSignalPeriod(\'daily\')">Daily</button>'+
    '<button class="psp-period-btn" data-period="weekly" type="button" onclick="pspSignalPeriod(\'weekly\')">Weekly</button>'+
    '<button class="psp-period-btn" data-period="monthly" type="button" onclick="pspSignalPeriod(\'monthly\')">Monthly</button>';

  /* Critical: append to BODY, outside .content/.page scrolling containers. */
  document.body.appendChild(dock);
  return dock;
}

function pspV104SyncPeriodDock(){
  var dock=pspV104EnsurePeriodDock();
  var isMobile=window.matchMedia && window.matchMedia('(max-width:760px)').matches;
  var signals=document.getElementById('page-signals');
  var resultOpen=!!document.getElementById('pspPeriodPageV103');
  var signalsOpen=!!(signals && signals.classList.contains('active'));

  if(!isMobile || (!signalsOpen && !resultOpen)){
    dock.style.display='none';
    return;
  }

  dock.style.display='grid';

  var bottom=12;
  if(!resultOpen){
    var nav=document.getElementById('userBottomNav');
    if(nav && getComputedStyle(nav).display!=='none'){
      var rect=nav.getBoundingClientRect();
      bottom=Math.max(8,Math.ceil(rect.height)+8);
    }else{
      bottom=76;
    }
  }

  dock.style.bottom='calc('+bottom+'px + env(safe-area-inset-bottom, 0px))';

  dock.querySelectorAll('.psp-period-btn').forEach(function(b){
    b.classList.toggle('active',b.getAttribute('data-period')===pspSigPeriod);
  });
}

/* Override result page: separate page, no embedded/scrolling period selector. */
function pspSignalPeriod(period){
  pspSigPeriod=period;
  var rows=pspSigPeriodRows(period);
  var green=0,red=0,net=0;

  rows.forEach(function(s){
    var p=Number(s.pips)||0;
    net+=p;
    if(p>=0) green+=p; else red+=Math.abs(p);
  });

  var title=period==='daily'?'Daily Signals':(period==='weekly'?'Weekly Signals':'Monthly Signals');
  var sub=period==='daily'?'Today':(period==='weekly'?'Current Week':'Current Month');

  var page=document.getElementById('pspPeriodPageV103');
  if(!page){
    page=document.createElement('div');
    page.id='pspPeriodPageV103';
    page.className='psp-period-page';
    document.body.appendChild(page);
  }

  var rowsHtml=rows.map(function(s){
    var d=new Date(s.closedTs||s.ts);
    var st=pspSigClosedStatus(s);
    var p=Number(s.pips)||0;
    var action=(s.dir||'').toUpperCase();
    var dateHtml=vEsc(d.toLocaleDateString('en-CA'))+'<br>'+
      vEsc(d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}));

    return '<div class="psp-period-fit-row">'+
      '<div class="date">'+dateHtml+'</div>'+
      '<div class="pair">'+vEsc(s.pair||'-')+'</div>'+
      '<div><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></div>'+
      '<div class="action '+(action==='SELL'?'sell':'buy')+'">'+vEsc(action)+'</div>'+
      '<div>'+vEsc(pspPeriodCompactValue(s,'entry'))+'</div>'+
      '<div>'+vEsc(pspPeriodCompactValue(s,'sl'))+'</div>'+
      '<div>'+vEsc(pspPeriodResultTarget(s))+'</div>'+
      '<div class="result" style="color:'+(p>=0?'#10b981':'#ef4444')+'">'+(p>=0?'+':'')+vEsc(p)+'</div>'+
    '</div>';
  }).join('');

  page.innerHTML=
    '<div class="psp-period-page-head">'+
      '<button class="psp-period-back" type="button" onclick="pspClosePeriodPage()" aria-label="Back">←</button>'+
      '<div><div class="psp-period-page-title">'+title+'</div>'+
      '<div class="psp-period-page-sub">'+sub+' Result</div></div>'+
      '<div></div>'+
    '</div>'+
    (rows.length
      ? '<div class="psp-period-fit">'+
          '<div class="psp-period-fit-row head">'+
            '<div>Date</div><div>Pair</div><div>Status</div><div>Action</div>'+
            '<div>Open</div><div>SL</div><div>TP</div><div>Result</div>'+
          '</div>'+rowsHtml+
        '</div>'
      : '<div class="psp-period-empty">No closed signals for this period.</div>')+
    '<div class="psp-period-page-summary">'+
      '<div class="green">🟢 Total Green Pips: '+(Math.round(green*10)/10)+'</div>'+
      '<div class="red">🔴 Total Red Pips: '+(Math.round(red*10)/10)+'</div>'+
      '<div class="net">Result: '+(net>=0?'+':'')+(Math.round(net*10)/10)+' pips</div>'+
    '</div>';

  try{document.body.style.overflow='hidden';}catch(e){}
  pspV104SyncPeriodDock();
}

function pspClosePeriodPage(){
  var page=document.getElementById('pspPeriodPageV103');
  if(page) page.remove();

  try{document.body.style.overflow='';}catch(e){}

  pspSigPeriod=null;
  pspV104SyncPeriodDock();
}

/* Keep the dock correct when navigating, rotating, resizing or browser chrome changes height. */
(function pspV104ObserveDock(){
  function start(){
    pspV104EnsurePeriodDock();
    pspV104SyncPeriodDock();

    var page=document.getElementById('page-signals');
    if(page && window.MutationObserver){
      new MutationObserver(pspV104SyncPeriodDock).observe(page,{
        attributes:true,
        attributeFilter:['class']
      });
    }

    window.addEventListener('resize',pspV104SyncPeriodDock,{passive:true});
    window.addEventListener('orientationchange',function(){
      setTimeout(pspV104SyncPeriodDock,120);
    },{passive:true});

    if(window.visualViewport){
      window.visualViewport.addEventListener('resize',pspV104SyncPeriodDock,{passive:true});
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',start,{once:true});
  }else{
    start();
  }
})();


// ============================================================================
// PIPSEPAISA V105 — DISTINCT SIGNAL TYPE COLORS
// 20 August 2026
//
// User-side visual differentiation:
// BUY        = Green
// BUY LIMIT  = Teal
// BUY STOP   = Blue
// SELL       = Red
// SELL LIMIT = Orange
// SELL STOP  = Purple
//
// Applied on desktop tables, mobile rows, expanded mobile cards and
// Daily / Weekly / Monthly result pages.
// ============================================================================

(function pspV105InstallSignalTypeColors(){
  if(document.getElementById('psp-v105-signal-type-colors')) return;
  var s=document.createElement('style');
  s.id='psp-v105-signal-type-colors';
  s.textContent=`
    .psp-type-pill{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:24px;
      padding:4px 9px;
      border-radius:999px;
      border:1px solid transparent;
      font-size:9px;
      font-weight:950;
      letter-spacing:.18px;
      white-space:nowrap;
      line-height:1;
    }

    .psp-type-buy{
      color:#059669;
      background:rgba(16,185,129,.11);
      border-color:rgba(16,185,129,.26);
    }
    .psp-type-buy-limit{
      color:#0f9f9a;
      background:rgba(20,184,166,.11);
      border-color:rgba(20,184,166,.27);
    }
    .psp-type-buy-stop{
      color:#2563eb;
      background:rgba(59,130,246,.11);
      border-color:rgba(59,130,246,.26);
    }
    .psp-type-sell{
      color:#dc2626;
      background:rgba(239,68,68,.10);
      border-color:rgba(239,68,68,.25);
    }
    .psp-type-sell-limit{
      color:#ea580c;
      background:rgba(249,115,22,.11);
      border-color:rgba(249,115,22,.28);
    }
    .psp-type-sell-stop{
      color:#7c3aed;
      background:rgba(139,92,246,.11);
      border-color:rgba(139,92,246,.27);
    }

    /* subtle matching dot improves recognition without relying only on text color */
    .psp-type-pill:before{
      content:"";
      width:6px;
      height:6px;
      border-radius:50%;
      margin-right:5px;
      background:currentColor;
      flex:0 0 auto;
    }

    /* Mobile signal list: add a thin type-color accent on the left */
    .psp-mobile-sig-row.psp-row-buy{box-shadow:inset 3px 0 0 #10b981}
    .psp-mobile-sig-row.psp-row-buy-limit{box-shadow:inset 3px 0 0 #14b8a6}
    .psp-mobile-sig-row.psp-row-buy-stop{box-shadow:inset 3px 0 0 #3b82f6}
    .psp-mobile-sig-row.psp-row-sell{box-shadow:inset 3px 0 0 #ef4444}
    .psp-mobile-sig-row.psp-row-sell-limit{box-shadow:inset 3px 0 0 #f97316}
    .psp-mobile-sig-row.psp-row-sell-stop{box-shadow:inset 3px 0 0 #8b5cf6}

    /* Expanded mobile card also carries the same top accent */
    .psp-mobile-detail-card.psp-detail-buy{border-top:3px solid #10b981}
    .psp-mobile-detail-card.psp-detail-buy-limit{border-top:3px solid #14b8a6}
    .psp-mobile-detail-card.psp-detail-buy-stop{border-top:3px solid #3b82f6}
    .psp-mobile-detail-card.psp-detail-sell{border-top:3px solid #ef4444}
    .psp-mobile-detail-card.psp-detail-sell-limit{border-top:3px solid #f97316}
    .psp-mobile-detail-card.psp-detail-sell-stop{border-top:3px solid #8b5cf6}

    @media(max-width:760px){
      .psp-type-pill{
        min-height:21px;
        padding:3px 7px;
        font-size:8px;
      }
      .psp-type-pill:before{
        width:5px;
        height:5px;
        margin-right:4px;
      }
      .psp-mobile-side .psp-type-pill{
        font-size:10px;
        min-height:25px;
        padding:5px 9px;
      }
    }
  `;
  document.head.appendChild(s);
})();

function pspSigTypeKey(s){
  var dir=((s&&s.dir)||'').toString().trim().toLowerCase();
  var ot=((s&&s.orderType)||'market').toString().trim().toLowerCase();

  if(dir!=='buy' && dir!=='sell'){
    var txt=pspSigDirectionText(s||{}).toLowerCase();
    if(txt.indexOf('sell')===0) dir='sell';
    else dir='buy';
  }

  if(ot==='limit') return dir+'-limit';
  if(ot==='stop') return dir+'-stop';
  return dir;
}

function pspSigTypeLabel(s){
  var key=pspSigTypeKey(s);
  if(key==='buy-limit') return 'BUY LIMIT';
  if(key==='buy-stop') return 'BUY STOP';
  if(key==='sell-limit') return 'SELL LIMIT';
  if(key==='sell-stop') return 'SELL STOP';
  return key==='sell' ? 'SELL' : 'BUY';
}

function pspSigTypeClass(s){
  return 'psp-type-'+pspSigTypeKey(s);
}

function pspSigTypePill(s){
  return '<span class="psp-type-pill '+pspSigTypeClass(s)+'">'+
    vEsc(pspSigTypeLabel(s))+
  '</span>';
}

/* Desktop: distinct type pill instead of plain BUY/SELL text. */
function pspSigDesktopRow(s,history){
  var d=pspFmtDateTime(s.ts);
  var st=history?pspSigClosedStatus(s):pspSigActiveStatus(s);
  var p=(s.pips!=null)?((Number(s.pips)>=0?'+':'')+s.pips):'—';
  var pc=(s.pips==null)?'pips-open':(Number(s.pips)>=0?'pips-pos':'pips-neg');
  var finalState=history?'Closed':'Open';
  var note=pspSigNote(s);
  var id=String(s.id);

  var html='<tr>'+
    '<td>'+vEsc(d)+'</td>'+
    '<td class="pair">'+vEsc(s.pair||'-')+'</td>'+
    '<td>'+pspSigTypePill(s)+'</td>'+
    '<td>'+pspSigCell(s,'entry')+'</td>'+
    '<td>'+pspSigCell(s,'sl')+'</td>'+
    '<td>'+pspSigCell(s,'tp1')+'</td>'+
    '<td>'+pspSigCell(s,'tp2')+'</td>'+
    '<td>'+pspSigCell(s,'tp3')+'</td>'+
    '<td>'+pspSigCell(s,'tp4')+'</td>'+
    '<td><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></td>'+
    '<td class="'+pc+'">'+vEsc(p)+'</td>'+
    '<td><span class="psp-sig-badge '+(history?'closed':'open')+'">'+finalState+'</span></td>'+
    '<td>'+(note && !s.locked
      ? '<button id="pspNoteBtn-'+vEsc(id)+'" class="psp-note-toggle" type="button" aria-expanded="false" onclick="pspToggleSignalNote(\''+vEsc(id)+'\')">Note ▾</button>'
      : '<button class="psp-note-toggle" type="button" disabled>Note</button>')+
    '</td>'+
  '</tr>';

  if(note && !s.locked){
    html+='<tr id="pspNoteDrop-'+vEsc(id)+'" class="psp-note-dropdown-row'+(pspV104NoteOpen[id]?' open':'')+'">'+
      '<td colspan="13"><div class="psp-note-dropdown-content"><b>📝 Note:</b>'+vEsc(note)+'</div></td>'+
    '</tr>';
  }
  return html;
}

/* Mobile row: keep compact table, but give every type a matching left accent. */
function pspSigMobileRow(s){
  var history=pspSigIsFinished(s);
  var st=history?pspSigClosedStatus(s):pspSigActiveStatus(s);
  var profit=s.pips!=null?((Number(s.pips)>=0?'+':'')+s.pips):'Open';
  var profitColor=s.pips==null?'#FB9201':(Number(s.pips)>=0?'#10b981':'#ef4444');
  var rowClass='psp-row-'+pspSigTypeKey(s);

  return '<div class="psp-mobile-sig-row '+rowClass+'" data-id="'+vEsc(String(s.id))+'" onclick="pspSigToggleMobile(\''+vEsc(String(s.id))+'\')">'+
      '<div class="psp-mobile-sig-date">'+pspSigMobileDate(s.ts)+'</div>'+
      '<div class="psp-mobile-sig-pair">'+vEsc(s.pair||'-')+'</div>'+
      '<div><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></div>'+
      '<div class="psp-mobile-sig-profit" style="color:'+profitColor+'">'+vEsc(profit)+'</div>'+
      '<div class="psp-mobile-open">Open <span class="psp-mobile-chevron">⌄</span></div>'+
    '</div>'+pspSigMobileDetail(s);
}

/* Mobile expanded card: exact signal type is prominent and color coded. */
function pspSigMobileDetail(s){
  var time=new Date(s.ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  var st=pspSigIsFinished(s)?pspSigClosedStatus(s):pspSigActiveStatus(s);
  var detailClass='psp-detail-'+pspSigTypeKey(s);

  if(s.locked){
    return '<div class="psp-mobile-detail" data-id="'+vEsc(String(s.id))+'">'+
      '<div class="psp-mobile-detail-card '+detailClass+'"><div class="psp-mobile-lock">'+
        '<strong>🔒 VIP Signal</strong>Upgrade your access to view Entry, SL, TP levels and mentor note.'+
      '</div></div></div>';
  }

  var note=pspSigNote(s);
  var tp4=(s.tp4==null?'':String(s.tp4)).trim();
  var tp4Html=!tp4?'-':(tp4.toLowerCase()==='open'
    ? '<span style="color:#FB9201;font-weight:950">Open</span>'
    : vEsc(tp4));

  return '<div class="psp-mobile-detail" data-id="'+vEsc(String(s.id))+'">'+
    '<div class="psp-mobile-detail-card '+detailClass+'">'+
      '<div class="psp-mobile-detail-top">'+
        '<div>'+
          '<div class="psp-mobile-side">'+pspSigTypePill(s)+'</div>'+
          '<div class="psp-mobile-detail-time">'+vEsc(new Date(s.ts).toLocaleDateString('en-GB'))+'</div>'+
        '</div>'+
        '<div><div class="psp-mobile-detail-pair">'+vEsc(s.pair||'-')+'</div>'+
          '<div class="psp-mobile-detail-time">'+vEsc(time)+'</div></div>'+
      '</div>'+
      '<div class="psp-mobile-levels">'+
        '<div class="psp-mobile-lv"><b><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></b><span>Status</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.entry||'-')+'</b><span>Entry</span></div>'+
        '<div class="psp-mobile-lv"><b style="color:#ef4444">'+vEsc(s.sl||'-')+'</b><span>SL</span></div>'+
        '<div class="psp-mobile-lv"><b style="color:'+(s.pips!=null?(Number(s.pips)>=0?'#10b981':'#ef4444'):'var(--text-primary)')+'">'+
          (s.pips!=null?vEsc((Number(s.pips)>=0?'+':'')+s.pips):'Open')+'</b><span>Pips</span></div>'+
      '</div>'+
      '<div class="psp-mobile-tps">'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp1||'-')+'</b><span>TP1</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp2||'-')+'</b><span>TP2</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp3||'-')+'</b><span>TP3</span></div>'+
        '<div class="psp-mobile-lv"><b>'+tp4Html+'</b><span>TP4</span></div>'+
      '</div>'+
      (note?'<div class="psp-mobile-note"><b>📝 Mentor Note:</b><br>'+vEsc(note)+'</div>':'')+
    '</div></div>';
}

/* Daily / Weekly / Monthly result page: color-coded Action type too. */
function pspSignalPeriod(period){
  pspSigPeriod=period;
  var rows=pspSigPeriodRows(period);
  var green=0,red=0,net=0;

  rows.forEach(function(s){
    var p=Number(s.pips)||0;
    net+=p;
    if(p>=0) green+=p; else red+=Math.abs(p);
  });

  var title=period==='daily'?'Daily Signals':(period==='weekly'?'Weekly Signals':'Monthly Signals');
  var sub=period==='daily'?'Today':(period==='weekly'?'Current Week':'Current Month');

  var page=document.getElementById('pspPeriodPageV103');
  if(!page){
    page=document.createElement('div');
    page.id='pspPeriodPageV103';
    page.className='psp-period-page';
    document.body.appendChild(page);
  }

  var rowsHtml=rows.map(function(s){
    var d=new Date(s.closedTs||s.ts);
    var st=pspSigClosedStatus(s);
    var p=Number(s.pips)||0;
    var dateHtml=vEsc(d.toLocaleDateString('en-CA'))+'<br>'+
      vEsc(d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}));

    return '<div class="psp-period-fit-row">'+
      '<div class="date">'+dateHtml+'</div>'+
      '<div class="pair">'+vEsc(s.pair||'-')+'</div>'+
      '<div><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></div>'+
      '<div>'+pspSigTypePill(s)+'</div>'+
      '<div>'+vEsc(pspPeriodCompactValue(s,'entry'))+'</div>'+
      '<div>'+vEsc(pspPeriodCompactValue(s,'sl'))+'</div>'+
      '<div>'+vEsc(pspPeriodResultTarget(s))+'</div>'+
      '<div class="result" style="color:'+(p>=0?'#10b981':'#ef4444')+'">'+(p>=0?'+':'')+vEsc(p)+'</div>'+
    '</div>';
  }).join('');

  page.innerHTML=
    '<div class="psp-period-page-head">'+
      '<button class="psp-period-back" type="button" onclick="pspClosePeriodPage()" aria-label="Back">←</button>'+
      '<div><div class="psp-period-page-title">'+title+'</div>'+
      '<div class="psp-period-page-sub">'+sub+' Result</div></div>'+
      '<div></div>'+
    '</div>'+
    (rows.length
      ? '<div class="psp-period-fit">'+
          '<div class="psp-period-fit-row head">'+
            '<div>Date</div><div>Pair</div><div>Status</div><div>Action</div>'+
            '<div>Open</div><div>SL</div><div>TP</div><div>Result</div>'+
          '</div>'+rowsHtml+
        '</div>'
      : '<div class="psp-period-empty">No closed signals for this period.</div>')+
    '<div class="psp-period-page-summary">'+
      '<div class="green">🟢 Total Green Pips: '+(Math.round(green*10)/10)+'</div>'+
      '<div class="red">🔴 Total Red Pips: '+(Math.round(red*10)/10)+'</div>'+
      '<div class="net">Result: '+(net>=0?'+':'')+(Math.round(net*10)/10)+' pips</div>'+
    '</div>';

  try{document.body.style.overflow='hidden';}catch(e){}
  pspV104SyncPeriodDock();
}


// ============================================================================
// PIPSEPAISA V106 — MOBILE RESULT FIT + LEFT-ALIGNED NOTE
// 20 August 2026
// ============================================================================

(function pspV106SignalPolish(){
  if(document.getElementById('psp-v106-signal-polish')) return;
  var s=document.createElement('style');
  s.id='psp-v106-signal-polish';
  s.textContent=`
    /* Desktop note: no centered empty gap; open from the LEFT side. */
    .psp-note-dropdown-content{
      margin-left:0!important;
      margin-right:auto!important;
      width:min(720px,72%)!important;
      max-width:100%!important;
    }

    @media(max-width:760px){
      /* Give Action enough width while keeping the whole result table on-screen. */
      .psp-period-fit-row{
        grid-template-columns:
          1.12fr   /* Date */
          .76fr    /* Pair */
          .72fr    /* Status */
          1.08fr   /* Action */
          .60fr    /* Open */
          .56fr    /* SL */
          .58fr    /* TP */
          .62fr!important; /* Result */
      }

      .psp-period-fit-row > div{
        padding-left:1px!important;
        padding-right:1px!important;
        overflow:hidden!important;
      }

      /* BUY LIMIT / SELL LIMIT / BUY STOP / SELL STOP must never be clipped. */
      .psp-period-fit-row .psp-type-pill{
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        min-height:24px!important;
        padding:3px 1px!important;
        border-radius:7px!important;
        font-size:5.7px!important;
        line-height:1.04!important;
        white-space:normal!important;
        text-align:center!important;
        overflow:visible!important;
        word-break:normal!important;
        overflow-wrap:normal!important;
      }
      .psp-period-fit-row .psp-type-pill:before{
        display:none!important;
      }

      .psp-period-fit-row.head > div{
        font-size:6.4px!important;
      }
      .psp-period-fit-row .date{font-size:6.3px!important}
      .psp-period-fit-row .pair{font-size:7px!important}
      .psp-period-fit-row .psp-sig-badge{
        padding:2px 2px!important;
        font-size:5.8px!important;
      }
    }
  `;
  document.head.appendChild(s);
})();


// ============================================================================
// PIPSEPAISA V107 — MOBILE ACTIVE SIGNALS CLEANUP
// 20 August 2026
// - Remove duplicate Active / History buttons on MOBILE only.
// - Main mobile heading: "Daily Active Signals".
// - Daily / Weekly / Monthly fixed dock remains the history/results entry point.
// ============================================================================

(function pspV107SignalCleanup(){
  if(document.getElementById('psp-v107-mobile-signal-cleanup')) return;

  var s=document.createElement('style');
  s.id='psp-v107-mobile-signal-cleanup';
  s.textContent=`
    @media(max-width:760px){
      /* History is already available from the fixed Daily / Weekly / Monthly dock. */
      #page-signals .sig-filter-row > div:last-child{
        display:none!important;
        border-left:0!important;
        padding-left:0!important;
        margin:0!important;
      }

      /* Remove the empty row/gap left by the hidden view buttons. */
      #page-signals .sig-filter-row{
        row-gap:0!important;
      }
    }
  `;
  document.head.appendChild(s);

  function syncHeading(){
    if(!window.matchMedia || !window.matchMedia('(max-width:760px)').matches) return;
    document.querySelectorAll('#page-signals .psp-mobile-signals-title').forEach(function(el){
      if(typeof sigView!=='undefined' && sigView==='active' && el.textContent!=='Daily Active Signals'){
        el.textContent='Daily Active Signals';
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',syncHeading,{once:true});
  }else{
    syncHeading();
  }

  /*
    V108 FIX:
    Do NOT observe page-signals subtree and rewrite textContent on every mutation.
    V107 could recursively retrigger MutationObserver while renderSignals() was
    rebuilding the mobile Signals DOM, making the Signals tab appear stuck/not open.
    The heading is already rendered correctly by pspSigMobileShell() below.
  */
})();

/* Override mobile shell so the correct heading is rendered immediately. */
function pspSigMobileShell(rows){
  var title=sigView==='history'?'Signal History':'Daily Active Signals';
  pspV104SyncPeriodDock();

  return '<div class="psp-sig-mobile-shell">'+
    '<div class="psp-mobile-signals-title">'+title+'</div>'+
    '<div class="psp-mobile-sig-table">'+
      '<div class="psp-mobile-sig-head"><div>Date</div><div>Pair</div><div>Status</div><div>Profit</div><div>Open</div></div>'+
      rows.map(pspSigMobileRow).join('')+
    '</div>'+
  '</div>';
}

/* Keep empty-state heading consistent too. */
(function pspV107WrapSignalRenderer(){
  var base=renderSignals;
  renderSignals=function(){
    base();
    if(window.matchMedia && window.matchMedia('(max-width:760px)').matches){
      document.querySelectorAll('#page-signals .psp-mobile-signals-title').forEach(function(el){
        if(sigView==='active' && el.textContent!=='Daily Active Signals') el.textContent='Daily Active Signals';
      });
    }
  };
})();



// ============================================================================
// PIPSEPAISA V108 — SIGNAL TAB OPEN STABILITY
// ============================================================================
(function pspV108SignalOpenStability(){
  function ensureDockAfterOpen(){
    try{
      var page=document.getElementById('page-signals');
      if(page && page.classList.contains('active') && typeof pspV104SyncPeriodDock==='function'){
        pspV104SyncPeriodDock();
      }
    }catch(_){ }
  }
  document.addEventListener('click',function(e){
    var t=e.target && e.target.closest ? e.target.closest('[data-page="signals"]') : null;
    if(!t)return;
    setTimeout(ensureDockAfterOpen,30);
    setTimeout(ensureDockAfterOpen,180);
  },true);
})();


// ============================================================================
// PIPSEPAISA V113 — VERIFIED ACCOUNT SIGNAL ACCESS SYNC
// ============================================================================
(function pspV113SignalAccessSync(){
  if(window.__pspV113SignalAccessSync)return;
  window.__pspV113SignalAccessSync=true;

  function refreshSignalsIfVisible(){
    try{
      var page=document.getElementById('page-signals');
      if(page && page.classList.contains('active') && typeof loadSignalsFromDB==='function'){
        loadSignalsFromDB();
      }
    }catch(_){}
  }

  // The account-verification module updates this state after approval/pending.
  // Re-check on tab focus/pageshow so an already-approved user does not remain
  // on a stale locked/empty Signals screen.
  window.addEventListener('pageshow',function(){
    setTimeout(refreshSignalsIfVisible,300);
  });
  window.addEventListener('focus',function(){
    setTimeout(refreshSignalsIfVisible,250);
  });
})();


// ============================================================================
// PIPSEPAISA V114 — CONSISTENT VERIFIED-USER SIGNAL FEED
// ============================================================================
(function pspV114SignalFeedRefresh(){
  if(window.__pspV114SignalFeedRefresh)return;
  window.__pspV114SignalFeedRefresh=true;

  // If account verification changes while the app is open, reload the signal feed.
  window.addEventListener('pageshow',function(){
    setTimeout(function(){
      try{
        var page=document.getElementById('page-signals');
        if(page && page.classList.contains('active') && typeof loadSignalsFromDB==='function'){
          loadSignalsFromDB();
        }
      }catch(_){}
    },450);
  });
})();


// ============================================================================
// PIPSEPAISA V115 — PENDING ORDER + ACTIVE NOW USER UI
// ============================================================================
(function pspV115SignalLifecycleStyle(){
  if(document.getElementById('psp-v115-signal-lifecycle'))return;
  var s=document.createElement('style');
  s.id='psp-v115-signal-lifecycle';
  s.textContent=`
    .psp-sig-badge.pending{background:rgba(251,146,1,.12)!important;color:#d97706!important;border-color:rgba(251,146,1,.28)!important}
    .psp-sig-badge.active-now{background:rgba(251,146,1,.16)!important;color:#d97706!important;border-color:rgba(251,146,1,.34)!important}
    .psp-v115-activation-notice{margin:0 0 9px;padding:8px 10px;border-radius:9px;background:rgba(251,146,1,.10);border:1px solid rgba(251,146,1,.30);color:#d97706;font-size:9px;font-weight:950;text-align:left;letter-spacing:.15px}
    .psp-v115-pending-notice{margin:0 0 9px;padding:8px 10px;border-radius:9px;background:rgba(251,146,1,.07);border:1px dashed rgba(251,146,1,.34);color:#a56b00;font-size:9px;font-weight:900;text-align:left}
  `;
  document.head.appendChild(s);
})();

function pspSigActiveStatus(s){
  if(s.rawStatus==='pending') return ['Pending','pending'];
  if(s.rawStatus==='sl') return ['SL Hit','sl'];
  if(s.rawStatus==='be') return ['BE Hit','be'];
  if(s.tpHit>=3||s.rawStatus==='tp3') return ['Closed','closed'];
  if(s.tpHit===2||s.rawStatus==='tp2') return ['TP2 Hit','tp'];
  if(s.tpHit===1||s.rawStatus==='tp1') return ['TP1 Hit','tp'];
  if(s.beMoved) return ['SL @ BE','be'];
  if(s.activatedAt && s.orderType!=='market') return ['Active Now','active-now'];
  return ['Active','active'];
}

function pspV115LifecycleNotice(s){
  var type=pspSigTypeLabel(s);
  if(s.rawStatus==='pending'){
    return '<div class="psp-v115-pending-notice">⏳ '+vEsc(type)+' PENDING ORDER</div>';
  }
  if(s.rawStatus==='active' && s.activatedAt && s.orderType!=='market'){
    return '<div class="psp-v115-activation-notice">⚡ '+vEsc(type)+' ACTIVE NOW</div>';
  }
  return '';
}

function pspSigMobileDetail(s){
  var time=new Date(s.ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  var st=pspSigIsFinished(s)?pspSigClosedStatus(s):pspSigActiveStatus(s);
  var detailClass='psp-detail-'+pspSigTypeKey(s);

  if(s.locked){
    return '<div class="psp-mobile-detail" data-id="'+vEsc(String(s.id))+'">'+
      '<div class="psp-mobile-detail-card '+detailClass+'"><div class="psp-mobile-lock">'+
        '<strong>🔒 VIP Signal</strong>Upgrade your access to view Entry, SL, TP levels and mentor note.'+
      '</div></div></div>';
  }

  var note=pspSigNote(s);
  var tp4=(s.tp4==null?'':String(s.tp4)).trim();
  var tp4Html=!tp4?'-':(tp4.toLowerCase()==='open'
    ? '<span style="color:#FB9201;font-weight:950">Open</span>'
    : vEsc(tp4));

  return '<div class="psp-mobile-detail" data-id="'+vEsc(String(s.id))+'">'+
    '<div class="psp-mobile-detail-card '+detailClass+'">'+
      pspV115LifecycleNotice(s)+
      '<div class="psp-mobile-detail-top">'+
        '<div>'+
          '<div class="psp-mobile-side">'+pspSigTypePill(s)+'</div>'+
          '<div class="psp-mobile-detail-time">'+vEsc(new Date(s.ts).toLocaleDateString('en-GB'))+'</div>'+
        '</div>'+
        '<div><div class="psp-mobile-detail-pair">'+vEsc(s.pair||'-')+'</div>'+
          '<div class="psp-mobile-detail-time">'+vEsc(time)+'</div></div>'+
      '</div>'+
      '<div class="psp-mobile-levels">'+
        '<div class="psp-mobile-lv"><b><span class="psp-sig-badge '+st[1]+'">'+vEsc(st[0])+'</span></b><span>Status</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.entry||'-')+'</b><span>Entry</span></div>'+
        '<div class="psp-mobile-lv"><b style="color:#ef4444">'+vEsc(s.sl||'-')+'</b><span>SL</span></div>'+
        '<div class="psp-mobile-lv"><b style="color:'+(s.pips!=null?(Number(s.pips)>=0?'#10b981':'#ef4444'):'var(--text-primary)')+'">'+
          (s.pips!=null?vEsc((Number(s.pips)>=0?'+':'')+s.pips):'Open')+'</b><span>Pips</span></div>'+
      '</div>'+
      '<div class="psp-mobile-tps">'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp1||'-')+'</b><span>TP1</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp2||'-')+'</b><span>TP2</span></div>'+
        '<div class="psp-mobile-lv"><b>'+vEsc(s.tp3||'-')+'</b><span>TP3</span></div>'+
        '<div class="psp-mobile-lv"><b>'+tp4Html+'</b><span>TP4</span></div>'+
      '</div>'+
      (note?'<div class="psp-mobile-note"><b>📝 Mentor Note:</b><br>'+vEsc(note)+'</div>':'')+
    '</div></div>';
}
