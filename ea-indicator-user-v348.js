/* PipSePaisa V348 — Smart EA/Indicator marketplace & personal license workspace */
(function(){
'use strict';
if(window.__PSP_EAI_LIBRARY_V348__ || !window.PSPEAIndicator) return;
window.__PSP_EAI_LIBRARY_V348__=true;
var api=window.PSPEAIndicator, originalLoad=api.load;
var state={tab:'explore',feedback:{},notifications:[],userId:null,requestOpened:false,gridObserver:null,requestSeq:0};
var d=id=>document.getElementById(id);
var client=()=>window.sb||null;
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]))}
function validUrl(v){var s=String(v||'');return (/^https:\/\//i.test(s)||/^\/(?!\/)/.test(s))?s:''}
function date(v){if(!v)return'—';var n=new Date(v);return Number.isNaN(n.getTime())?'—':n.toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'})}
function cash(v){var n=Number(v);return Number.isFinite(n)?'$'+n.toFixed(2):'—'}
function reqs(){return api._getPremiumState?.().requests||[]}
function products(){return api._getCatalog?.()||[]}
function findRequest(id){return reqs().find(r=>r.id===id)}
function findProduct(id){return products().find(p=>p.id===id)}
function latestFor(productId){return reqs().find(r=>r.product_id===productId)||null}
function feedback(id){return state.feedback[id]||null}
function label(s){return ({
 pending:'Application Submitted',under_review:'Under Review',approved:'Approved',
 license_preparing:'Preparing License',ready:'Ready to Download',downloaded:'Downloaded',
 rejected:'Action Required'
})[s]||'Not Applied'}
function badge(s,id){
 if(feedback(id)?.installation_confirmed_at)return ['installed','Installation Confirmed'];
 return [String(s||'new'),s?label(s):'Not Applied'];
}
function detail(s){return ({
 pending:'Your application was received and is awaiting review.',
 under_review:'Our team is verifying your broker and account details.',
 approved:'Approved. Your private licensed file will be prepared.',
 license_preparing:'An account-specific software file is being prepared.',
 ready:'Your licensed file is available for secure download.',
 downloaded:'Download started. Follow the installation guide to finish setup.',
 rejected:'Check the review note, correct your details and resubmit.'
})[s]||'Get a trading-account-specific PipSePaisa license.'}
function buttonInfo(r){
 if(!r)return ['Apply for Access','apply'];
 if(r.status==='rejected')return ['Correct & Resubmit','resubmit'];
 if(r.status==='ready')return ['Download Indicator','download'];
 if(r.status==='downloaded')return ['Download Again','download'];
 return ['Track Application','track'];
}
function icon(id){return '<span aria-hidden="true">'+id+'</span>'}
function count(){var rows=reqs(),installed=rows.filter(r=>feedback(r.id)?.installation_confirmed_at).length;
return {total:rows.length,processing:rows.filter(r=>['pending','under_review','approved','license_preparing'].includes(r.status)).length,
 ready:rows.filter(r=>['ready','downloaded'].includes(r.status)).length,installed:installed,
 action:rows.filter(r=>r.status==='rejected').length}}
var css=document.createElement('style');css.id='psp-eai-library-v348-css';css.textContent=[
'#page-eaindicator #eaiMyRequests{display:none!important}',
'#page-eaindicator{--eail-orange:#F39522}',
'#page-eaindicator .eai-hero h2{font-size:clamp(22px,2.2vw,29px);letter-spacing:-.025em}',
'#page-eaindicator .eai-grid{grid-template-columns:repeat(auto-fit,minmax(275px,1fr));gap:18px;align-items:stretch}',
'#page-eaindicator .eai-card{display:flex;flex-direction:column;min-width:0;border-radius:19px;box-shadow:0 5px 22px rgba(0,0,0,.04)}',
'#page-eaindicator .eai-card .eai-body{display:flex;flex-direction:column;flex:1;padding:17px}',
'#page-eaindicator .eai-card .eai-meta{margin-top:auto;padding-top:14px}',
'#page-eaindicator .eai-cover{position:relative}',
'.eaiL-nav{display:flex;gap:9px;flex-wrap:wrap;margin:17px 0 18px;padding:7px;border:1px solid var(--border);background:var(--bg-card);border-radius:15px;max-width:780px}',
'.eaiL-tab{border:1px solid transparent;background:transparent;color:var(--text-primary);font-weight:850;font-size:13px;padding:13px 19px;border-radius:11px;min-height:47px;cursor:pointer;flex:1;white-space:normal}',
'.eaiL-tab.active{background:#F39522;color:#171717;box-shadow:0 5px 14px rgba(243,149,34,.14)}',
'.eaiL-tab small{margin-left:6px;font-size:10px;opacity:.85}',
'.eaiL-intro{display:flex;gap:12px;align-items:center;justify-content:space-between;margin:0 0 15px;flex-wrap:wrap}',
'.eaiL-intro h3{font-size:20px;letter-spacing:-.015em;margin:0 0 4px}',
'.eaiL-intro p{font-size:13px;color:var(--text-muted);margin:0;line-height:1.6}',
'.eaiL-cardState{position:absolute;top:11px;right:11px;padding:7px 10px;border-radius:50px;background:rgba(11,18,29,.90);color:#fff;font-size:11px;font-weight:800;border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(5px)}',
'.eaiL-cardState.installed,.eaiL-cardState.ready,.eaiL-cardState.downloaded{background:rgba(11,94,58,.93)}',
'.eaiL-cardState.rejected{background:rgba(154,31,33,.94)}',
'.eaiL-cardActions{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}',
'.eaiL-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:11px 14px;border-radius:11px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);font-size:12px;font-weight:850;cursor:pointer;text-align:center}',
'.eaiL-btn.primary{background:#F39522;color:#171717;border-color:#F39522}',
'.eaiL-btn:disabled{opacity:.55;cursor:not-allowed}',
'.eaiL-cardActions .eaiL-btn.primary{flex:1}',
'.eaiL-shell{display:none}',
'.eaiL-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-bottom:19px}',
'.eaiL-stat{border:1px solid var(--border);background:var(--bg-card);border-radius:16px;padding:15px;min-width:0}',
'.eaiL-stat .eyebrow{color:var(--text-muted);font-size:11px;font-weight:750}',
'.eaiL-stat strong{display:block;font-size:28px;line-height:1.3;margin-top:4px}',
'.eaiL-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}',
'.eaiL-license{border:1px solid var(--border);background:var(--bg-card);border-radius:17px;overflow:hidden;box-shadow:0 7px 24px rgba(0,0,0,.035)}',
'.eaiL-licenseBody{padding:17px}',
'.eaiL-licHead{display:flex;gap:11px;align-items:flex-start}',
'.eaiL-licHead img{width:110px;aspect-ratio:16/10;object-fit:contain;background:#03060a;border-radius:10px;flex:0 0 auto}',
'.eaiL-licHead h4{font-size:15px;line-height:1.4;margin:0 0 7px;overflow-wrap:anywhere}',
'.eaiL-state{font-size:11px;font-weight:850;color:#a65e03;background:rgba(243,149,34,.12);border:1px solid rgba(243,149,34,.22);border-radius:30px;display:inline-flex;padding:5px 9px}',
'.eaiL-state.installed,.eaiL-state.ready,.eaiL-state.downloaded{color:#16803d;background:rgba(22,163,74,.09);border-color:rgba(22,163,74,.22)}',
'.eaiL-state.rejected{color:#c42f30;background:rgba(220,38,38,.07);border-color:rgba(220,38,38,.2)}',
'.eaiL-copy{font-size:13px;color:var(--text-muted);line-height:1.65;margin:12px 0 8px}',
'.eaiL-meta{font-size:12px;color:var(--text-muted);line-height:1.7;margin:7px 0}',
'.eaiL-meta strong{color:var(--text-primary)}',
'.eaiL-progress{height:5px;border-radius:8px;background:var(--bg-elevated);overflow:hidden;margin:13px 0}',
'.eaiL-progress span{display:block;height:100%;background:linear-gradient(90deg,#F39522,#f7c464);border-radius:8px}',
'.eaiL-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}',
'.eaiL-actions .eaiL-btn.primary{flex:1}',
'.eaiL-notifications{margin:18px 0;border:1px solid var(--border);border-radius:16px;background:var(--bg-card);overflow:hidden}',
'.eaiL-notifications header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid var(--border);font-weight:850;font-size:14px}',
'.eaiL-update{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)}',
'.eaiL-update:last-child{border:0}.eaiL-update p{margin:3px 0 0;color:var(--text-muted);font-size:12px;line-height:1.5}',
'.eaiL-update strong{font-size:12px}.eaiL-update.unread{background:rgba(243,149,34,.055)}',
'.eaiL-empty{padding:32px;border:1px dashed var(--border);border-radius:16px;text-align:center;background:var(--bg-card)}',
'.eaiL-empty h3{margin:0 0 7px;font-size:19px}.eaiL-empty p{margin:0 0 16px;color:var(--text-muted);font-size:13px;line-height:1.5}',
'.eaiL-modal{width:min(730px,96vw)!important}',
'.eaiL-modalBody{padding:22px}.eaiL-modalBody h3{font-size:18px;margin:0 0 8px}',
'.eaiL-guide{white-space:pre-line;line-height:1.8;font-size:13px;color:var(--text-primary);background:var(--bg-card);border:1px solid var(--border);padding:17px;border-radius:13px;margin:12px 0}',
'.eaiL-detailGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin:14px 0}',
'.eaiL-detail{background:var(--bg-card);border:1px solid var(--border);padding:12px;border-radius:12px;min-width:0}',
'.eaiL-detail small{display:block;color:var(--text-muted);font-size:11px;margin-bottom:5px}',
'.eaiL-detail strong{display:block;font-size:13px;overflow-wrap:anywhere}',
'.eaiL-confirm{display:flex;gap:8px;align-items:flex-start;border-radius:12px;padding:13px;background:rgba(243,149,34,.07);border:1px solid rgba(243,149,34,.25);font-size:12px;line-height:1.6;margin:14px 0}',
'.eaiL-modalActions{display:flex;gap:9px;flex-wrap:wrap;margin:16px 0 0}',
'.eaiL-support textarea{font-size:14px;line-height:1.55;min-height:135px;width:100%;box-sizing:border-box;padding:13px;border-radius:11px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary)}',
'.eaiL-error{color:#bd2525;font-size:12px;margin-top:8px}',
'@media(max-width:900px){.eaiL-summary{grid-template-columns:repeat(2,1fr)}}',
'@media(max-width:580px){.eaiL-tab{padding:12px 10px;font-size:12px}.eaiL-nav{gap:4px;padding:5px}.eaiL-intro h3{font-size:17px}.eaiL-list{grid-template-columns:1fr}.eaiL-licenseBody{padding:14px}.eaiL-licHead img{width:90px}.eaiL-detailGrid{grid-template-columns:1fr}.eaiL-modalBody{padding:14px}.eaiL-summary{gap:7px}.eaiL-stat{padding:12px}.eaiL-stat strong{font-size:23px}.eaiL-btn{min-height:44px}.eaiL-update{gap:5px}.eaiL-modalActions .eaiL-btn{flex:1}}'
].join('');
document.head.appendChild(css);

function ensure(){
 var page=d('page-eaindicator'),grid=d('eaiProductGrid'),oldMy=d('eaiMyRequests');
 if(!page||!grid||!oldMy)return false;
 if(!d('eaiLNav')){
  var nav=document.createElement('div');nav.className='eaiL-nav';nav.id='eaiLNav';
  nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Software marketplace sections');
  nav.innerHTML='<button class="eaiL-tab active" type="button" data-eail-tab="explore" role="tab" aria-selected="true">Explore Indicators & EAs</button>'+
   '<button class="eaiL-tab" type="button" data-eail-tab="licenses" role="tab" aria-selected="false">My Software & Licenses <small id="eaiLNavCount"></small></button>';
  oldMy.insertAdjacentElement('beforebegin',nav);
  nav.addEventListener('click',e=>{var b=e.target.closest('[data-eail-tab]');if(b)setTab(b.dataset.eailTab,true)});
  var mine=document.createElement('section');mine.id='eaiLShell';mine.className='eaiL-shell';mine.setAttribute('aria-label','My Software and Licenses');
  oldMy.insertAdjacentElement('afterend',mine);
  var head=document.createElement('div');head.className='eaiL-intro';head.id='eaiLExploreHeading';
  head.innerHTML='<div><h3>Explore Trading Tools</h3><p>Professional PipSePaisa tools with private, trading-account-licensed delivery.</p></div>';
  grid.insertAdjacentElement('beforebegin',head);
  mine.addEventListener('click',clickLibrary);
  if(!state.gridObserver){
   state.gridObserver=new MutationObserver(()=>decorateProducts());
   state.gridObserver.observe(grid,{childList:true});
  }
 }
 return true;
}
function setTab(tab,clicked){
 state.tab=tab==='licenses'?'licenses':'explore';
 if(!ensure())return;
 var mine=d('eaiLShell'),grid=d('eaiProductGrid'),hero=d('page-eaindicator')?.querySelector('.eai-toolbar');
 mine.style.display=state.tab==='licenses'?'block':'none';
 grid.style.display=state.tab==='explore'?'grid':'none';
 d('eaiLExploreHeading').style.display=state.tab==='explore'?'flex':'none';
 if(hero)hero.style.display=state.tab==='explore'?'flex':'none';
 d('eaiLNav').querySelectorAll('[data-eail-tab]').forEach(b=>{
  var on=b.dataset.eailTab===state.tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));
 });
 if(clicked){var u=new URL(window.location.href);u.searchParams.set('tab',state.tab);u.searchParams.delete('request');history.replaceState(null,'',u.pathname+u.search+u.hash)}
 if(state.tab==='licenses')renderLibrary();
}
function decorateProducts(){
 var grid=d('eaiProductGrid');if(!grid)return;
 var catalog=products(),requestList=reqs();var pid=(card)=>{var match=(card.getAttribute('onclick')||'').match(/detail\(['"]([a-f0-9-]{36})['"]\)/i);return match&&match[1]};
 grid.querySelectorAll('.eai-card').forEach(card=>{
  var id=pid(card),p=catalog.find(x=>x.id===id);if(!p)return;
  var r=requestList.find(x=>x.product_id===id)||null,installed=!!(r&&feedback(r.id)?.installation_confirmed_at);
  var hash=(r?r.status:'new')+(installed?'_installed':'');
  if(card.dataset.eailState===hash)return;
  card.dataset.eailState=hash;
  var cover=card.querySelector('.eai-cover'),body=card.querySelector('.eai-body');
  if(!cover||!body)return;
  cover.querySelector('.eaiL-cardState')?.remove();
  body.querySelector('.eaiL-cardActions')?.remove();
  var v=badge(r?.status,r?.id);var chip=document.createElement('span');chip.className='eaiL-cardState '+v[0];chip.textContent=v[1];cover.appendChild(chip);
  var actions=document.createElement('div');actions.className='eaiL-cardActions';
  var main=document.createElement('button');main.type='button';main.className='eaiL-btn primary';
  var act=buttonInfo(r);main.textContent=act[0];
  main.addEventListener('click',e=>{e.stopPropagation();runAction(act[1],r?.id,p.id)});
  actions.appendChild(main);
  var secondary=document.createElement('button');secondary.type='button';secondary.className='eaiL-btn';secondary.textContent='View Details';
  secondary.addEventListener('click',e=>{e.stopPropagation();api.detail(p.id)});
  actions.appendChild(secondary);
  body.appendChild(actions);
 });
}
function statsHtml(){
 var c=count();
 return '<div class="eaiL-summary" aria-label="My license totals">'+
 [['Applications',c.total],['In Progress',c.processing],['Ready / Downloaded',c.ready],['Installed (Confirmed)',c.installed]]
 .map(v=>'<div class="eaiL-stat"><span class="eyebrow">'+esc(v[0])+'</span><strong>'+v[1]+'</strong></div>').join('')+'</div>'
}
function width(s){return ({pending:13,under_review:31,approved:53,license_preparing:75,ready:100,downloaded:100})[s]||9}
function licHtml(r){
 var p=findProduct(r.product_id),f=feedback(r.id);
 var b=badge(r.status,r.id);var preview=validUrl(p?.cover_url||'');
 var [mainAction,action]=buttonInfo(r);
 var expired=r.license_expires_at&&new Date(r.license_expires_at)<new Date();
 return '<article class="eaiL-license"><div class="eaiL-licenseBody">'+
 '<div class="eaiL-licHead">'+(preview?'<img loading="lazy" src="'+esc(preview)+'" alt="">':'')+
 '<div><h4>'+esc(p?.title||r.ea_indicator_products?.title||'PipSePaisa Indicator')+'</h4>'+
 '<span class="eaiL-state '+b[0]+'">'+esc(b[1])+'</span></div></div>'+
 '<p class="eaiL-copy">'+esc(f?.installation_confirmed_at?'You confirmed installation on '+date(f.installation_confirmed_at)+'.':detail(r.status))+'</p>'+
 '<div class="eaiL-meta"><strong>Broker:</strong> '+esc(r.broker)+' &nbsp;·&nbsp; <strong>MT5 Account:</strong> '+esc(r.trading_account_id)+
 '<br><strong>Applied:</strong> '+esc(date(r.created_at))+
 ((r.status==='ready'||r.status==='downloaded')?'<br><strong>File issued:</strong> '+esc(date(r.ready_at)):'')+
 (r.licensed_version?'<br><strong>Licensed version:</strong> '+esc(r.licensed_version):'')+
 (r.license_expires_at?'<br><strong>License expiry:</strong> '+esc(date(r.license_expires_at))+(expired?' (date passed)':''):'')+
 '</div><div class="eaiL-progress"><span style="width:'+width(r.status)+'%"></span></div>'+
 (r.status==='rejected'?'<div class="eaiL-confirm"><span>!</span><div><strong>Correction required:</strong> '+esc(r.admin_note||'Please verify the broker account and resubmit.')+'</div></div>':'')+
 (f?.issue_description?'<div class="eaiL-confirm"><span>i</span><div><strong>Installation support requested:</strong> '+esc(f.issue_description)+'</div></div>':'')+
 '<div class="eaiL-actions"><button type="button" class="eaiL-btn primary" data-eail-action="'+action+'" data-request="'+esc(r.id)+'" data-product="'+esc(r.product_id)+'">'+esc(mainAction)+'</button>'+
 '<button type="button" class="eaiL-btn" data-eail-action="install" data-request="'+esc(r.id)+'">Installation Guide</button>'+
 (r.status==='downloaded'&&!f?.installation_confirmed_at?'<button type="button" class="eaiL-btn" data-eail-action="confirm" data-request="'+esc(r.id)+'">Confirm Installed</button>':'')+
 '</div></div></article>'
}
function noticeHtml(){
 if(!state.notifications.length)return '';
 return '<section class="eaiL-notifications"><header><span>License Updates</span><span style="font-size:11px;color:var(--text-muted);font-weight:500">Recent activity</span></header>'+
 state.notifications.slice(0,5).map(n=>{
 var match=(String(n.link||'').match(/request=([a-f0-9-]{36})/i)||[])[1];
 return '<div class="eaiL-update '+(n.read?'':'unread')+'"><div><strong>'+esc(n.title||'PipSePaisa Licensing')+'</strong><p>'+esc(n.text||n.body||'')+' · '+esc(date(n.created_at))+'</p></div>'+
 (match?'<button type="button" class="eaiL-btn" data-eail-action="notice" data-request="'+esc(match)+'" data-notice="'+esc(n.id)+'">Open</button>':'')+'</div>';
 }).join('')+'</section>'
}
function renderLibrary(){
 var shell=d('eaiLShell');if(!shell)return;
 var items=reqs();
 var html='<div class="eaiL-intro"><div><h3>My Software & Licenses</h3><p>Everything you requested, received or installed — in one place.</p></div>'+
 '<button type="button" class="eaiL-btn" data-eail-action="refresh">↻ Refresh Status</button></div>'+
 statsHtml()+noticeHtml();
 html+=items.length?'<div class="eaiL-list">'+items.map(licHtml).join('')+'</div>':
 '<div class="eaiL-empty"><h3>No Applications Yet</h3><p>Explore PipSePaisa indicators, choose a tool and request your private licensed file.</p>'+
 '<button class="eaiL-btn primary" type="button" data-eail-action="explore">Explore Indicators & EAs</button></div>';
 shell.innerHTML=html;
 d('eaiLNavCount').textContent=String(items.length);
}
function runAction(action,id,pid){
 if(action==='download')return api.download(id);
 if(action==='track')return api.track(id);
 if(action==='resubmit'||action==='apply')return api.request(pid);
 if(action==='install')return showInstall(id);
 if(action==='confirm')return confirmInstall(id);
 if(action==='issue')return showSupport(id);
 if(action==='explore')return setTab('explore',true);
 if(action==='refresh')return api.load();
}
function clickLibrary(e){
 var b=e.target.closest('[data-eail-action]');if(!b)return;e.preventDefault();
 if(b.dataset.eailAction==='notice'){
  var n=state.notifications.find(x=>x.id===b.dataset.notice);
  if(n){n.read=true;client()?.from('community_notifications').update({read:true,is_read:true}).eq('id',n.id).then(()=>{});}
  renderLibrary();return api.track(b.dataset.request);
 }
 runAction(b.dataset.eailAction,b.dataset.request,b.dataset.product)
}
function modal(title,content){
 d('eaiModalBack')?.remove();
 var back=document.createElement('div');back.id='eaiModalBack';back.className='eai-modalback';
 back.innerHTML='<div class="eai-modal eaiL-modal"><div class="eaiP-wizardHeader"><div><div class="eaiP-wizardMeta">PIPSEPAISA · LICENSE SUPPORT</div><h2>'+esc(title)+'</h2></div>'+
 '<button type="button" class="eai-x" aria-label="Close" data-eail-close="1">×</button></div><div class="eaiL-modalBody">'+content+'</div></div>';
 back.addEventListener('click',e=>{if(e.target===back||e.target.closest('[data-eail-close]'))back.remove()});
 document.body.appendChild(back);return back;
}
function showInstall(id){
 var r=findRequest(id),p=r&&findProduct(r.product_id);if(!r)return;
 var guide=p?.installation||(
 '1. Open MetaTrader 5 desktop.\n2. Choose File → Open Data Folder → MQL5 → Indicators.\n3. Copy your downloaded licensed EX5 file into the Indicators folder.\n4. Restart MetaTrader 5 or refresh the Navigator.\n5. Attach the indicator to your chart using the approved trading account.');
 var f=feedback(id),ready=['ready','downloaded'].includes(r.status);
 var version=r.licensed_version||null;
 var expired=r.license_expires_at&&new Date(r.license_expires_at)<new Date();
 var html='<h3>Install & Manage Your License</h3><div class="eaiL-detailGrid">'+
 [['Broker',r.broker],['Licensed trading account',r.licensed_account_id||r.trading_account_id],
  ['License file',r.licensed_file_name||(ready?'File available':'Not issued yet')],
  ['Issued version',version||'Not recorded'],
  ['Issued on',r.ready_at?date(r.ready_at):'Not issued yet'],
  ['Expires',r.license_expires_at?date(r.license_expires_at):'Not specified']]
 .map(v=>'<div class="eaiL-detail"><small>'+esc(v[0])+'</small><strong>'+esc(v[1])+'</strong></div>').join('')+'</div>'+
 (expired?'<div class="eaiL-confirm">The recorded license expiry date has passed. Contact support before relying on this file.</div>':'')+
 '<h3>MT5 Installation Guide</h3><div class="eaiL-guide">'+esc(guide)+'</div>'+
 '<div class="eaiL-confirm"><span>ℹ</span><div>Download history does not verify that MetaTrader activated the indicator. Mark installation complete only after you have installed it successfully.</div></div>'+
 '<div class="eaiL-modalActions">'+
 (ready?'<button type="button" class="eaiL-btn primary" data-eail-modal-action="download">↓ Download Licensed File</button>':'')+
 (r.status==='downloaded'&&!f?.installation_confirmed_at?'<button type="button" class="eaiL-btn" data-eail-modal-action="confirm">✓ I Installed It</button>':'')+
 (ready?'<button type="button" class="eaiL-btn" data-eail-modal-action="support">Report Installation Issue</button>':'')+
 '<button type="button" class="eaiL-btn" data-eail-close="1">Close</button></div>';
 var back=modal('Installation — '+(p?.title||r.ea_indicator_products?.title||'Indicator'),html);
 back.addEventListener('click',e=>{var button=e.target.closest('[data-eail-modal-action]');if(!button)return;
 var action=button.dataset.eailModalAction;
 if(action==='download')api.download(id);
 if(action==='confirm')confirmInstall(id);
 if(action==='support')showSupport(id);
 });
}
async function me(){var c=client();if(!c)return null;var res=await c.auth.getUser();return res.data?.user||null}
async function confirmInstall(id){
 var r=findRequest(id);if(!r||r.status!=='downloaded'||!r.downloaded_at){alert('Please download your licensed file first.');return}
 if(!window.confirm('Have you installed this indicator successfully in MetaTrader on the approved trading account? This is your own confirmation, not an automatic MT5 verification.'))return;
 var u=await me();if(!u)return;
 var res=await client().from('ea_indicator_license_feedback').upsert({request_id:id,user_id:u.id,installation_confirmed_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'request_id'});
 if(res.error){alert('Could not save installation confirmation: '+res.error.message);return}
 d('eaiModalBack')?.remove();if(window.pipToast)window.pipToast('Installation confirmed.','ok');
 await api.load();setTab('licenses',false);
}
function showSupport(id){
 var r=findRequest(id);if(!r||!['ready','downloaded'].includes(r.status))return;
 var body='<h3>Report an Installation Issue</h3>'+
 '<p style="font-size:13px;color:var(--text-muted);line-height:1.6">Tell the licensing team what is happening in MetaTrader. Include the error message, but never share passwords.</p>'+
 '<form class="eaiL-support" id="eaiLIssueForm"><label for="eaiLIssue" style="font-size:12px;font-weight:850;display:block;margin:10px 0 7px">Describe the issue *</label>'+
 '<textarea id="eaiLIssue" maxlength="1000" minlength="10" required placeholder="E.g., I copied the EX5 file into MQL5/Indicators, but it does not appear in MT5 Navigator.">'+esc(feedback(id)?.issue_description||'')+'</textarea>'+
 '<div class="eaiL-error" id="eaiLIssueError" aria-live="polite"></div>'+
 '<div class="eaiL-modalActions"><button class="eaiL-btn primary" type="submit" id="eaiLIssueSubmit">Send to Licensing Team</button>'+
 '<button class="eaiL-btn" type="button" data-eail-close="1">Cancel</button></div></form>';
 var back=modal('Installation Support',body);
 d('eaiLIssueForm').onsubmit=async function(e){
 e.preventDefault();var btn=d('eaiLIssueSubmit'),msg=d('eaiLIssue').value.trim();
 if(msg.length<10){d('eaiLIssueError').textContent='Please describe your issue in at least 10 characters.';return}
 btn.disabled=true;btn.textContent='Sending…';
 try{
 var u=await me();if(!u)throw Error('Please log in again.');
 var result=await client().from('ea_indicator_license_feedback').upsert({request_id:id,user_id:u.id,issue_description:msg,issue_reported_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'request_id'});
 if(result.error)throw result.error;
 back.remove();if(window.pipToast)window.pipToast('Installation issue sent to the licensing team.','ok');
 await api.load();setTab('licenses',false);
 }catch(ex){d('eaiLIssueError').textContent=ex.message||'Could not send request.';btn.disabled=false;btn.textContent='Send to Licensing Team'}
 };
}
async function refreshDetails(){
 var u=await me();if(!u)return;
 state.userId=u.id;
 var c=client(),queries=[
 c.from('ea_indicator_license_feedback').select('request_id,installation_confirmed_at,issue_description,issue_reported_at,updated_at').eq('user_id',u.id),
 c.from('community_notifications').select('id,type,title,text,body,link,read,created_at').eq('user_id',u.id).eq('type','ea_indicator').order('created_at',{ascending:false}).limit(8)
 ];
 var arr=await Promise.all(queries);
 if(arr[0].error)console.warn('EA library feedback unavailable',arr[0].error.message);
 else state.feedback=Object.fromEntries((arr[0].data||[]).map(f=>[f.request_id,f]));
 if(arr[1].error)console.warn('EA library notifications unavailable',arr[1].error.message);
 else state.notifications=arr[1].data||[];
}
async function initialize(){
 if(!ensure())return;
 var url=new URL(window.location.href);
 if(url.searchParams.get('tab')==='licenses')state.tab='licenses';
 renderLibrary();decorateProducts();setTab(state.tab,false);
 if(!state.requestOpened&&url.searchParams.has('request')){
  var id=url.searchParams.get('request');
  if(/^[a-f0-9-]{36}$/i.test(id)&&findRequest(id)){state.requestOpened=true;setTab('licenses',false);api.track(id)}
 }
}
api.load=async function(){
 var thisSeq=++state.requestSeq;
 var result=await originalLoad.apply(api,arguments);
 await refreshDetails();
 if(thisSeq===state.requestSeq)await initialize();
 return result;
};
api.showLibrary=function(){setTab('licenses',true)};
api.showExplore=function(){setTab('explore',true)};
api.installGuide=showInstall;
api.confirmInstalled=confirmInstall;
api.reportInstallationIssue=showSupport;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
 if(d('page-eaindicator')?.classList.contains('active'))api.load();
}, {once:true});
else if(d('page-eaindicator')?.classList.contains('active'))api.load();
})();