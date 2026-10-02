const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(){
  const events={},docEvents={},timers=new Map(),nodes=[],calls=[],toasts=[],menus=new Map();let timerId=0,active='dashboard';
  const node=()=>({dataset:{},attributes:{},classList:{contains:()=>false},setAttribute(k,v){this.attributes[k]=v},removeAttribute(k){delete this.attributes[k]},remove(){this.removed=true}});
  for(const page of ['dashboard','users','revenue','teamperformance','adsignals','emails']){const el=node();el.dataset.page=page;menus.set(page,el)}
  const c={console,Event,Promise,Map,Set,currentAdmin:{id:'admin'},
    setTimeout(fn,ms){timers.set(++timerId,{fn,ms});return timerId},clearTimeout(id){timers.delete(id)},
    addEventListener(name,fn){(events[name] ||= []).push(fn)},dispatchEvent(e){for(const fn of events[e.type]||[])fn(e)},
    pipToast(message){toasts.push(message)},
    document:{readyState:'complete',addEventListener(name,fn){(docEvents[name] ||= []).push(fn)},
      head:{appendChild(el){nodes.push(el)}},createElement(tag){return {...node(),tagName:tag}},
      getElementById(id){return id==='loginOverlay'?node():null},
      querySelector(selector){if(selector==='#content>.page.active')return {id:'page-'+active};const match=selector.match(/^\[data-page="([^"]+)"\]$/);return match?menus.get(match[1])||null:null}},
    showPage(page,el){calls.push({page,el,forced:!!c.pspAdminForceNavigation});active=page;return page}};
  c.window=c;vm.createContext(c);vm.runInContext(source('admin-workspaces-v440.js'),c);
  return {c,events,docEvents,timers,nodes,calls,toasts,menus,active:()=>active,
    scripts:()=>nodes.filter(n=>n.tagName==='script'),
    async complete(i){const el=this.scripts()[i];assert.ok(el,'Script '+i+' exists');el.onload();await tick()}};
}
test('startup downloads no optional workspace and keeps synchronous routes synchronous',()=>{
  const h=harness();assert.equal(h.scripts().length,0);assert.equal(h.c.showPage('dashboard'), 'dashboard');assert.equal(h.calls.length,1);
});
test('first Finance visit waits for code, keeps the last page visible and then reuses the script',async()=>{
  const h=harness(),el=h.menus.get('revenue'),job=h.c.showPage('revenue',el);
  assert.equal(h.scripts().length,1);assert.match(h.scripts()[0].src,/finance-management/);assert.equal(h.scripts()[0].async,true);assert.equal(h.active(),'dashboard');assert.equal(el.attributes['aria-busy'],'true');
  await h.complete(0);await job;assert.equal(h.active(),'revenue');assert.equal(el.attributes['aria-busy'],undefined);
  h.c.showPage('dashboard');h.c.showPage('revenue',el);assert.equal(h.scripts().length,1);assert.equal(h.active(),'revenue');
});
test('rapid Users clicks share one download and preserve the Users/export dependency order',async()=>{
  const h=harness(),first=h.c.showPage('users',h.menus.get('users')),second=h.c.showPage('users',h.menus.get('users'));
  assert.equal(h.scripts().length,1);assert.match(h.scripts()[0].src,/users-v56/);
  await h.complete(0);assert.equal(h.scripts().length,2);assert.match(h.scripts()[1].src,/users-export/);assert.equal(h.calls.length,0);
  await h.complete(1);await Promise.all([first,second]);assert.equal(h.calls.length,1);assert.equal(h.active(),'users');
});
test('finishing an abandoned workspace cannot return to it after navigation',async()=>{
  const h=harness(),finance=h.c.showPage('revenue',h.menus.get('revenue')),team=h.c.showPage('teamperformance',h.menus.get('teamperformance'));
  await h.complete(1);await team;assert.equal(h.active(),'teamperformance');await h.complete(0);await finance;assert.equal(h.active(),'teamperformance');assert.equal(h.calls.length,1);
});
test('clicking the already-active page cancels a download even when the navigation guard skips it',async()=>{
  const h=harness();vm.runInContext(source('admin-clean-route-v238.js'),h.c);for(const [id,timer]of [...h.timers])if(timer.ms===0){h.timers.delete(id);timer.fn()}
  const pending=h.c.showPage('revenue',h.menus.get('revenue'));h.c.showPage('dashboard',h.menus.get('dashboard'));
  await h.complete(0);await pending;assert.equal(h.active(),'dashboard');assert.equal(h.calls.length,0);
});
test('a failed download leaves the current page usable and clicking again retries',async()=>{
  const h=harness(),first=h.c.showPage('emails',h.menus.get('emails'));h.scripts()[0].onerror();await first;
  assert.equal(h.active(),'dashboard');assert.equal(h.toasts.length,1);assert.equal(h.menus.get('emails').attributes['aria-busy'],undefined);
  const retry=h.c.showPage('emails',h.menus.get('emails'));assert.equal(h.scripts().length,2);await h.complete(1);await retry;assert.equal(h.active(),'emails');
});
test('a timed-out download releases the busy state and can be retried',async()=>{
  const h=harness(),first=h.c.showPage('adsignals',h.menus.get('adsignals'));const timer=[...h.timers.values()].find(t=>t.ms===15000);timer.fn();await first;
  assert.equal(h.active(),'dashboard');assert.equal(h.toasts.length,1);const retry=h.c.showPage('adsignals',h.menus.get('adsignals'));await h.complete(1);await retry;assert.equal(h.active(),'adsignals');
});
test('logout cancels a pending workspace and logged-out requests download no more code',async()=>{
  const h=harness(),pending=h.c.showPage('revenue',h.menus.get('revenue'));h.c.currentAdmin=null;h.c.dispatchEvent(new Event('psp-admin-auth-closed'));
  await h.complete(0);await pending;assert.equal(h.active(),'dashboard');await h.c.showPage('teamperformance',h.menus.get('teamperformance'));assert.equal(h.scripts().length,1);
});
test('a lazily installed navigation wrapper is used after its script finishes',async()=>{
  const h=harness(),pending=h.c.showPage('teamperformance',h.menus.get('teamperformance'));let called=0;const old=h.c.showPage;
  h.c.showPage=function(){++called;return old.apply(this,arguments)};await h.complete(0);await pending;assert.equal(called,1);assert.equal(h.active(),'teamperformance');
});
test('manual Refresh force survives the asynchronous route gate',async()=>{
  const h=harness();h.c.pspAdminForceNavigation=true;const pending=h.c.showPage('revenue',h.menus.get('revenue'));h.c.pspAdminForceNavigation=false;
  await h.complete(0);await pending;assert.equal(h.calls[0].forced,true);assert.equal(h.c.pspAdminForceNavigation,false);
});
test('hover prefetch downloads public code without executing the workspace or duplicating hints',()=>{
  const h=harness(),event={target:{closest:()=>h.menus.get('users')}};h.docEvents.pointerover[0](event);h.docEvents.pointerover[0](event);
  assert.equal(h.nodes.filter(n=>n.tagName==='link').length,2);assert.equal(h.scripts().length,0);assert.equal(h.calls.length,0);
});
test('deferred workspace assets are absent from startup script tags',()=>{
  const html=source('admin/index.html');for(const name of ['admin-users-v56-clean','admin-users-export-v299','finance-management-v179','admin-team-performance-v206','signals-workspace-v154','email-campaign-admin-v296'])assert.doesNotMatch(html,new RegExp('<script[^>]*src="/?'+name));
  assert.match(html,/<script defer src="\/admin-workspaces-v440.js/);
});
test('realtime follows the visible page while optional code is downloading',()=>{
  const timers=new Map(),channels=[],removed=[];let timerId=0,active='payments',downloadReady=false;
  const c={console,Event,currentAdmin:{id:'admin'},
    document:{readyState:'complete',hidden:false,getElementById(id){return {id,classList:{contains:()=>id!=='loginOverlay'}}},querySelector(){return {id:'page-'+active}},addEventListener(){}},
    addEventListener(){},setTimeout(fn){timers.set(++timerId,fn);return timerId},clearTimeout(id){timers.delete(id)},
    showPage(page){if(downloadReady)active=page;return Promise.resolve()},
    sb:{channel(name){const ch={name,on(){return ch},subscribe(){channels.push(ch);return ch}};return ch},removeChannel(ch){removed.push(ch);return Promise.resolve('ok')}}};
  c.window=c;vm.createContext(c);vm.runInContext(source('realtime-complete.js'),c);
  function flush(){for(const [id,fn]of [...timers]){timers.delete(id);fn()}}
  flush();assert.match(channels[0].name,/-payments$/);
  c.showPage('adsignals');flush();assert.equal(channels.length,1);assert.equal(removed.length,0);
  downloadReady=true;c.showPage('adsignals');flush();assert.match(channels[1].name,/-adsignals$/);assert.equal(removed[0],channels[0]);
});
