'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('admin-ea-indicator-v238.js');
const enterprise=read('admin-ea-indicator-enterprise-v374.js');
const compact=read('admin-ea-indicator-compact-v375.js');
const admin=read('admin-core-v406.js');

function harness(conn){
 const from=core.indexOf('function indicatorTimed(');
 const to=core.indexOf('\nfunction norm(v)',from);
 assert.ok(from>0&&to>from,'extract production guarded load implementation');
 const calls=[];
 const ctx={state:{products:[],requests:[],verifications:[],loaded:false,loading:false,loadPromise:null,loadError:null},
  db:()=>conn,inject(){calls.push('inject')},render(){calls.push('render')},
  syncPendingBadge(){calls.push('badge')},console:{warn(){},error(){}},
  setTimeout,clearTimeout,Promise,Set,Map,Date};
 vm.createContext(ctx);
 vm.runInContext(core.slice(from,to)+'\nthis.runLoad=load;',ctx);
 return {ctx,calls,run:()=>vm.runInContext('runLoad()',ctx)};
}

function fakeDb(responses){
 return {from(name){
  const data=responses[name]||{data:[]};
  return {select(){return this},order(){return this},in(){return this},
   then(success,failure){return Promise.resolve(data).then(success,failure)}};
 }};
}

test('Admin navigation always starts actual indicator data load',()=>{
 assert.ok(admin.includes("if (page === 'eaindicator' && typeof window.PSPEAIAdmin?.load === 'function')"));
 assert.ok(core.includes("window.addEventListener('psp-admin-auth-ready'"),'reload active queue on secure sign-in');
 assert.ok(core.includes("m.onclick=()=>{showPage('eaindicator',m)"),'injected navigation still opens indicator page');
 assert.ok(!core.includes("document.getElementById('pageSubtitle').textContent='Products, requests, account licences and per-user file delivery';load()"),'no double request');
});

test('Missing admin connection cannot leave indicator list spinning forever',async()=>{
 const h=harness(null);
 assert.equal(await h.run(),false);
 assert.equal(h.ctx.state.loaded,false);
 assert.match(h.ctx.state.loadError,/connection is unavailable/i);
 assert.ok(h.calls.includes('render'));
 assert.equal(h.ctx.state.loading,false);
});

test('Registered products and requests render on successful API response',async()=>{
 const db=fakeDb({
  ea_indicator_products:{data:[{id:'p1',title:'P+ Matrix'}]},
  ea_indicator_requests:{data:[{id:'r1',user_id:null,product_id:'p1',status:'pending'}]},
  account_verifications:{data:[]}
 });
 const h=harness(db);
 assert.equal(await h.run(),true);
 assert.equal(h.ctx.state.loaded,true);
 assert.equal(h.ctx.state.products.length,1);
 assert.equal(h.ctx.state.requests.length,1);
 assert.equal(h.ctx.state.loading,false);
 assert.equal(h.ctx.state.loadError,null);
 assert.ok(h.calls.includes('badge'));
 assert.ok(h.calls.includes('render'));
});

test('Permission failures are exposed as retryable loading errors rather than silent zero applications',async()=>{
 const db=fakeDb({
  ea_indicator_products:{data:[],error:{message:'Permission denied'}},
  ea_indicator_requests:{data:[]},
  account_verifications:{data:[]}
 });
 const h=harness(db);
 assert.equal(await h.run(),false);
 assert.equal(h.ctx.state.loaded,false);
 assert.match(h.ctx.state.loadError,/permission denied/i);
 assert.ok(h.calls.includes('render'));
 assert.equal(h.ctx.state.loading,false);
});

test('Failed verification lookup never authorizes license issuance',async()=>{
 const db=fakeDb({
  ea_indicator_products:{data:[{id:'p1'}]},
  ea_indicator_requests:{data:[{id:'r1',user_id:null,status:'pending'}]},
  account_verifications:{data:[],error:{message:'Verifications unavailable'}}
 });
 const h=harness(db);
 assert.equal(await h.run(),true);
 assert.equal(h.ctx.state.loaded,true);
 assert.equal(h.ctx.state.verifications.length,0);
 assert.match(h.ctx.state.loadError,/approval and issuance remain blocked/i);
});

test('Slow profile enrichment does not delay initial request queue paint',async()=>{
 let finishProfile;
 const db={from(name){
  const query={select(){return this},order(){return this},in(){return this},
   then(resolve,reject){
    if(name==='profiles')return new Promise(r=>{finishProfile=r}).then(resolve,reject);
    const value=name==='ea_indicator_products'?{data:[{id:'p1'}]}:
     name==='ea_indicator_requests'?{data:[{id:'r1',user_id:'u1'}]}:{data:[]};
    return Promise.resolve(value).then(resolve,reject);
   }};
  return query;
 }};
 const h=harness(db);
 const pending=h.run();
 for(let i=0;i<8&&!finishProfile;i++)await new Promise(r=>setImmediate(r));
 assert.equal(typeof finishProfile,'function');
 assert.equal(h.ctx.state.loaded,true);
 assert.equal(h.ctx.state.requests.length,1);
 assert.ok(h.calls.includes('render'),'list is rendered before profiles return');
 finishProfile({data:[{id:'u1',full_name:'Test Student'}]});
 assert.equal(await pending,true);
 assert.equal(h.ctx.state.requests[0].profiles.full_name,'Test Student');
});

test('Premium queue exposes Try Again on loading failure without changing secure approval rules',()=>{
 assert.ok(enterprise.includes("snap?.loadError"));
 assert.ok(enterprise.includes('data-e374-refresh="1">Try Again'));
 assert.ok(enterprise.includes('Applications could not be loaded — use Refresh'));
 assert.ok(compact.includes('Applications failed to load · Refresh to retry'));
 assert.ok(enterprise.includes("if(v.state!=='ok')"),'verified account still required before reapproval');
});
