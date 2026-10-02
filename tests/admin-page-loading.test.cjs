const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return {promise, resolve}; }
function node(id) {
  return {id, value: '', textContent: '', innerHTML: '', style: {}, dataset: {}, attrs: {},
    setAttribute(k,v) { this.attrs[k]=v; }, removeAttribute(k) { delete this.attrs[k]; },
    classList: {contains: () => true, toggle() {}, remove() {}, add() {}}, addEventListener() {}};
}
function harness() {
  const elements = new Map(), listeners = {}, requests = [], timers = [];
  const element = id => { if(!elements.has(id))elements.set(id,node(id));return elements.get(id); };
  const body = node('tbody'), heading = node('heading'), table = node('table');
  table.querySelector = s => s==='tbody'?body:s==='thead tr'?heading:null;
  const c = {console: {log() {},warn() {},error() {}}, Date, Promise, Map, Set, Event,
    currentAdmin: {id:'admin'}, pspAdminReadRevision:0,
    setTimeout(fn) {timers.push(fn);return timers.length;}, clearTimeout() {},
    addEventListener(name,fn) { (listeners[name] ||= []).push(fn); },
    localStorage: {getItem: () => null, setItem() {}},
    document: {readyState:'loading', hidden:false, addEventListener(name,fn) { (listeners[name] ||= []).push(fn); },
      getElementById(id) { return id==='page-users'?null:elements.get(id)||null; },
      querySelector(s) { return s==='#page-users table'?table:null; }, querySelectorAll: () => []},
    sb: {rpc(name,args) {const d=deferred();requests.push({name,args,...d});return d.promise;}},
    pspAdminPerfClear() { ++c.pspAdminReadRevision; }};
  c.window=c;vm.createContext(c);
  return {c,element,elements,body,table,requests,timers,listeners};
}
function users() {
  const h=harness();
  ['adminUserSearch','adminUserRoleFilter','usersAllCount','usersPremiumCount','usersFreeCount','usersBannedCount','usersShowing','v56Count','v56Pager','sidebarUsersCount'].forEach(h.element);
  h.element('adminUserRoleFilter').value='all';
  vm.runInContext(source('admin-users-v56-clean.js'),h.c);return h;
}
function page(name='Example', count=1700) {
  return {rows:[{id:name,full_name:name,email:'test@example.com',role:'user',created_at:'2026-10-01'}],filtered_total:count,totals:{all:1700,premium:20,free:1680,banned:3}};
}
function finance() {
  const h=harness();let text=source('finance-management-v179.js');
  const end=text.lastIndexOf('})();');
  text=text.slice(0,end)+`window.__testFinance={F,load};render=function(){window.__renders.push({month:F.month,loadedMonth:F._loadedMonth,loaded:F._loaded,tx:F.data.tx.slice()})};`+text.slice(end);
  h.c.__renders=[];vm.runInContext(text,h.c);h.f=h.c.__testFinance.F;h.load=h.c.__testFinance.load;return h;
}
const workspace = (id='one', audit=false) => ({tx:[{id}],accounts:[],balances:[],staff:[],salary:[],partners:[],payouts:[],obligations:[],recurring:[],budgets:[],closures:[],audit:audit?[{id:'audit'}]:[],settings:[],audit_loaded:audit});

test('Users requests only 100 rows and displays server totals for the whole directory',async()=>{
  const h=users(),job=h.c.loadAdminUsers();
  assert.equal(h.requests.length,1);assert.equal(h.requests[0].name,'psp_admin_users_page_v439');
  assert.equal(h.requests[0].args.p_limit,100);assert.equal(h.requests[0].args.p_offset,0);
  assert.equal(h.element('usersAllCount').textContent,'—');
  h.requests[0].resolve({data:page()});await job;
  assert.equal(h.element('usersAllCount').textContent,1700);assert.equal(h.element('usersPremiumCount').textContent,20);
  assert.match(h.element('usersShowing').textContent,/of 1,700/);assert.equal(h.c.adminUsersComplete,false);
  assert.match(h.element('v56Pager').innerHTML,/Page 1 \/ 17/);
});
test('Users reentry reuses the same request and a loaded page without replacing rows',async()=>{
  const h=users(),a=h.c.loadAdminUsers(),b=h.c.loadAdminUsers();assert.equal(h.requests.length,1);
  h.requests[0].resolve({data:page()});await Promise.all([a,b]);const rows=h.body.innerHTML;
  await h.c.loadAdminUsers();assert.equal(h.requests.length,1);assert.equal(h.body.innerHTML,rows);
  assert.equal(h.table.attrs['aria-busy'],undefined);
});
test('Users cached visits and unchanged responses keep mounted rows; changed responses update them',async()=>{
  const h=users();let html='',writes=0;Object.defineProperty(h.body,'innerHTML',{get:()=>html,set:v=>{html=v;++writes}});
  const first=h.c.loadAdminUsers();h.requests[0].resolve({data:page('Stable')});await first;assert.equal(writes,1);
  await h.c.loadAdminUsers();assert.equal(writes,1);
  const refresh=h.c.loadAdminUsers(true);h.requests[1].resolve({data:page('Stable')});await refresh;assert.equal(writes,1);
  const changed=h.c.loadAdminUsers(true);h.requests[2].resolve({data:page('Updated')});await changed;assert.equal(writes,2);assert.match(html,/Updated/);
});
test('Users next page fetches an offset and keeps existing data during the request',async()=>{
  const h=users(),first=h.c.loadAdminUsers();h.requests[0].resolve({data:page('First')});await first;
  const next=h.c.pspAdminUsersPage(1);assert.equal(h.requests[1].args.p_offset,100);assert.match(h.body.innerHTML,/First/);
  h.requests[1].resolve({data:page('Second')});await next;assert.match(h.body.innerHTML,/Second/);
  assert.match(h.element('usersShowing').textContent,/101–101 of 1,700/);
});
test('Users rejects late search results and sends search and role filters to the server',async()=>{
  const h=users();h.element('adminUserSearch').value='old';const old=h.c.loadAdminUsers();
  h.element('adminUserSearch').value='new';h.element('adminUserRoleFilter').value='mentor';const fresh=h.c.loadAdminUsers();
  assert.equal(h.requests[1].args.p_search,'new');assert.equal(h.requests[1].args.p_role,'mentor');
  h.requests[1].resolve({data:page('New result',1)});await fresh;h.requests[0].resolve({data:page('Old result')});await old;
  assert.match(h.body.innerHTML,/New result/);assert.doesNotMatch(h.body.innerHTML,/Old result/);
});
test('Users failed refresh preserves last successful data and permits retry',async()=>{
  const h=users(),first=h.c.loadAdminUsers();h.requests[0].resolve({data:page()});await first;const rows=h.body.innerHTML;
  const fail=h.c.loadAdminUsers(true);h.requests[1].resolve({error:{message:'Offline'}});await fail;
  assert.equal(h.body.innerHTML,rows);assert.match(h.element('usersShowing').textContent,/retry/);
  const retry=h.c.loadAdminUsers();h.requests[2].resolve({data:page('Updated')});await retry;assert.match(h.body.innerHTML,/Updated/);
});
test('Users logout prevents an earlier response from restoring the old directory',async()=>{
  const h=users(),job=h.c.loadAdminUsers();h.listeners['psp-admin-auth-closed'].forEach(fn=>fn());
  h.requests[0].resolve({data:page()});await job;assert.equal(h.c.adminUsers.length,0);assert.equal(h.c.adminUsersComplete,false);
});

test('Finance uses one combined request and repeated navigation shares the initial request',async()=>{
  const h=finance(),a=h.load({navigation:true}),b=h.load({navigation:true});
  assert.equal(h.requests.length,1);assert.equal(h.requests[0].name,'psp_admin_finance_workspace_v439');
  assert.equal(h.requests[0].args.p_prepare,true);assert.equal(h.requests[0].args.p_audit,false);
  h.requests[0].resolve({data:workspace()});await Promise.all([a,b]);await h.load({navigation:true});
  assert.equal(h.requests.length,1);assert.equal(h.f._loadPromise,null);
});
test('Finance loads full audit only when Reports needs it',async()=>{
  const h=finance(),first=h.load({navigation:true});h.requests[0].resolve({data:workspace()});await first;
  h.f.tab='reports';const reports=h.load({navigation:true});assert.equal(h.requests[1].args.p_prepare,false);assert.equal(h.requests[1].args.p_audit,true);
  h.requests[1].resolve({data:workspace('one',true)});await reports;await h.load({navigation:true});assert.equal(h.requests.length,2);
});
test('Finance month switching cannot display a late response for another month',async()=>{
  const h=finance();h.f.month='2026-09';const old=h.load({navigation:true});h.f.month='2026-10';const fresh=h.load({navigation:true});
  h.requests[1].resolve({data:workspace('October')});await fresh;h.requests[0].resolve({data:workspace('September')});await old;
  assert.equal(h.f._loadedMonth,'2026-10');assert.equal(h.f.data.tx[0].id,'October');assert.equal(h.f.loading,false);
});
test('Finance reload after a save bypasses navigation cooldown; explicit Refresh invalidates reads',async()=>{
  const h=finance(),first=h.load({navigation:true});h.requests[0].resolve({data:workspace()});await first;
  const saved=h.load();assert.equal(h.requests.length,2);h.requests[1].resolve({data:workspace('saved')});await saved;
  const refreshed=h.c.pspFinance179Load(true);assert.equal(h.requests.length,3);assert.equal(h.c.pspAdminReadRevision,1);
  h.requests[2].resolve({data:workspace('fresh')});await refreshed;assert.equal(h.f.data.tx[0].id,'fresh');
});
test('Finance initial failures, including synchronous errors, release loading and can retry',async()=>{
  const h=finance();h.c.sb.rpc=()=>{throw Error('Disconnected')};await h.load({navigation:true});
  assert.equal(h.f._loadPromise,null);assert.equal(h.f.loading,false);assert.equal(h.f._loaded,false);
  h.c.sb.rpc=(name,args)=>{const d=deferred();h.requests.push({name,args,...d});return d.promise};
  const retry=h.load({navigation:true});h.requests[0].resolve({data:workspace('retry')});await retry;assert.equal(h.f.data.tx[0].id,'retry');
});
test('Finance logout invalidates in-flight data',async()=>{
  const h=finance(),job=h.load({navigation:true});h.listeners['psp-admin-auth-closed'].forEach(fn=>fn());
  h.requests[0].resolve({data:workspace()});await job;assert.equal(h.f._loaded,false);assert.equal(h.f.data.tx.length,0);
});

test('Page read wrappers reuse pending reads, skip repeat rendering, and invalidate after writes',async()=>{
  const h=harness();let calls=0,pending=deferred();h.c.loadAdminCourses=()=>{++calls;return pending.promise};
  vm.runInContext(source('admin-clean-route-v238.js'),h.c);h.listeners.DOMContentLoaded.forEach(fn=>fn());h.timers.forEach(fn=>fn());
  const a=h.c.loadAdminCourses(),b=h.c.loadAdminCourses();assert.equal(calls,1);pending.resolve();await Promise.all([a,b]);
  await h.c.loadAdminCourses();assert.equal(calls,1);
  h.c.pspAdminInvalidatePageReads();pending=deferred();const fresh=h.c.loadAdminCourses();assert.equal(calls,2);pending.resolve();await fresh;
});
test('Page navigation skips the active tab but allows a manual Refresh to reopen it',()=>{
  const h=harness();let calls=0;h.c.showPage=()=>++calls;h.c.document.querySelector=s=>s==='#content>.page.active'?{id:'page-courses'}:null;
  vm.runInContext(source('admin-clean-route-v238.js'),h.c);h.listeners.DOMContentLoaded.forEach(fn=>fn());h.timers.forEach(fn=>fn());
  h.c.showPage('courses');assert.equal(calls,0);h.c.pspAdminForceNavigation=true;h.c.showPage('courses');assert.equal(calls,1);
});
test('Preparing Finance is a write; read-only Finance and paged Users reuse the fetch cache',async()=>{
  const h=harness();let calls=0;Object.assign(h.c,{Headers,Request,Response,URL,location:{href:'https://www.pipsepaisa.com/admin/'},fetch:async()=>{++calls;return new Response('{}')}});
  vm.runInContext(source('admin-performance-v398.js'),h.c);
  const call=(name,body)=>h.c.fetch('https://etfolhinohgmskbfjoyh.supabase.co/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(body)});
  await call('psp_admin_users_page_v439',{p_limit:100});await call('psp_admin_users_page_v439',{p_limit:100});assert.equal(calls,1);
  await call('psp_admin_finance_workspace_v439',{p_prepare:false});await call('psp_admin_finance_workspace_v439',{p_prepare:false});assert.equal(calls,2);
  await call('psp_admin_finance_workspace_v439',{p_prepare:true});await call('psp_admin_finance_workspace_v439',{p_prepare:true});assert.equal(calls,4);
  assert.equal(h.c.pspAdminReadRevision,4);await call('psp_admin_users_page_v439',{p_limit:100});assert.equal(calls,5);
});

test('Admin auth bootstrap runs on DOM readiness before images finish loading',async()=>{
  const h=harness();let dashboardLoads=0,sessionReads=0;
  const client={auth:{getSession:async()=>{++sessionReads;return {data:{session:{user:{id:'admin'}}}};}},
    from:()=>({select(){return this;},eq(){return this;},single:async()=>({data:{id:'admin',role:'admin'}})})};
  Object.assign(h.c,{supabase:{createClient:()=>client},queueMicrotask,dispatchEvent(){},PSPExecutiveDashboard181:{},loadDashboardStats:()=>++dashboardLoads});
  let removed=false;h.element('loginOverlay').classList.remove=()=>{removed=true};
  const text=source('admin-core-v406.js');vm.runInContext(text.slice(0,text.indexOf('async function loginAdmin')),h.c);
  assert.equal(h.listeners.load,undefined);assert.equal(sessionReads,0);
  await h.listeners.DOMContentLoaded[0]();await tick();assert.equal(sessionReads,1);assert.equal(dashboardLoads,1);assert.equal(removed,true);
});
test('Admin startup still shows login when there is no authenticated session',async()=>{
  const h=harness();let shown=false;h.element('loginOverlay').classList.add=()=>{shown=true};
  const client={auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}})}};
  h.c.supabase={createClient:()=>client};const text=source('admin-core-v406.js');vm.runInContext(text.slice(0,text.indexOf('async function loginAdmin')),h.c);
  await h.listeners.DOMContentLoaded[0]();assert.equal(shown,true);
});
test('Classic inline scripts can parse and install before deferred Supabase and admin core',()=>{
  const h=harness();h.c.document.createElement=()=>node('created');h.c.document.body=node('body');h.c.document.head=node('head');
  const html=source('admin/index.html'),scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  for(const [,attrs,text] of scripts){if(!/\bsrc=/.test(attrs)&&text.trim())assert.doesNotThrow(()=>vm.runInContext(text,h.c));}
  assert.match(html,/<script async src="https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js"/);
  assert.match(html,/<script defer src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"/);
  assert.doesNotMatch(html,/pipBoot|hideBoot/);
});
for(const file of ['ad-link-admin-v307.js','ad2-admin-v307.js','team-performance-admin-v56.js']) {
  test(file+' keeps loaded tables on repeat navigation and refreshes after invalidation',async()=>{
    const h=harness();['adlTeamTable','adlLeadTable','ad2LeadTable','taTable'].forEach(h.element);
    const isTeam=file.startsWith('team-'),isAd2=file.startsWith('ad2-');
    const inject=isTeam?'window.__load=loadAll;renderTeam=function(){};':isAd2?'window.__load=load;render=function(){};':'window.__load=load;renderSummary=function(){};renderTeam=function(){};renderLeads=function(){};';
    const text=source(file),end=text.lastIndexOf('})();');vm.runInContext(text.slice(0,end)+inject+text.slice(end),h.c);
    const first=h.c.__load({navigation:true});await tick();const count=isTeam||isAd2?2:3;assert.equal(h.requests.length,count);
    for(const req of h.requests)req.resolve({data:[]});await first;
    const body=h.element(isTeam?'taTable':isAd2?'ad2LeadTable':'adlLeadTable');body.innerHTML='Loaded rows';
    await h.c.__load({navigation:true});assert.equal(h.requests.length,count);assert.equal(body.innerHTML,'Loaded rows');
    h.c.pspAdminPerfClear();const fresh=h.c.__load({navigation:true});await tick();assert.equal(h.requests.length,count*2);assert.equal(body.innerHTML,'Loaded rows');
    for(const req of h.requests.slice(count))req.resolve({data:[]});await fresh;
  });
}
