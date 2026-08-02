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
function canAccessContent(svc,audienceStr){
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
  const {data,error}=await sb.from('signals').select('*').order('created_at',{ascending:false});
  if(error){g.innerHTML='<div style="color:var(--red);padding:30px;text-align:center;grid-column:1/-1;">'+error.message+'</div>';return;}
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
    tpHit:s.tp_hit||0, rawStatus:(s.status||'active'), beMoved:!!s.be_moved, orderType:((s.order_type||'market')+'').toLowerCase(), pips:(s.result_pips==null?null:s.result_pips),
    status:(s.status==='active'?'active':((s.status==='sl'||s.status==='closed'||s.status==='be')?'closed':'tp')),
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
function waBtn(id){return '<button onclick="event.stopPropagation();copySignalWA(\''+id+'\')" title="Copy for WhatsApp" style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border:none;border-radius:9px;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;font-weight:800;font-size:12px;cursor:pointer;">📲 Copy</button>';}
async function loadPerformance(){
  if(!sb)return;
  var hi=document.getElementById('perfHello');if(hi&&currentProfile){var nm=((currentProfile.full_name||currentProfile.email||'Trader')+'').split(' ')[0];hi.textContent='Welcome 👋';}
  try{
    var sr=await sb.from('signals').select('*').order('created_at',{ascending:false});
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
    html+=`<div class="card art-card art-media-only" onclick="openArt(${idx})" role="button" tabindex="0" aria-label="Open ${String(a.title||'item').replace(/"/g,'&quot;')}">
      <div class="art-cover" style="background:${a.image?('#000 url('+a.image+') center/cover no-repeat'):a.grad}">${a.image?'':a.ico}${a.locked?'<span style="position:absolute;top:10px;right:10px;background:var(--gold);color:#0a0e1a;font-size:9px;font-weight:800;padding:3px 8px;border-radius:5px">🔒 LOCKED</span>':''}</div>
      <div class="art-body"><div class="art-title">${String(a.title||'Untitled').replace(/</g,'&lt;')}</div><div class="art-time">${String(a.date||'').replace(/</g,'&lt;')}</div></div>
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
    '<button onclick="closeArt()" style="padding:10px 20px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-weight:600;cursor:pointer;font-family:inherit">Close</button>'+
    (hasImg?'<button onclick="downloadChartImg(\''+(a.image||'')+'\',\''+((a.title||'chart').replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,40)||'chart')+'\')" style="padding:10px 20px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));border:none;border-radius:8px;color:#0a0e1a;font-weight:800;cursor:pointer;font-family:inherit">⬇️ Download</button>':'')+
    '<button onclick="copyChartText('+i+')" style="padding:10px 20px;background:var(--bg-elevated);border:1px solid var(--gold);border-radius:8px;color:var(--gold);font-weight:700;cursor:pointer;font-family:inherit">📋 Copy</button>'+
  '</div>';
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
